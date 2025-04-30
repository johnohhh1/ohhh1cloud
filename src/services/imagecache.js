// src/services/imageCache.js

/**
 * Scale a blob down to maxDim×maxDim (preserving aspect ratio).
 * Returns the original blob if it’s already within the size limits.
 * @param {Blob} blob 
 * @param {number} maxDim 
 * @returns {Promise<Blob>}
 */
async function downscaleBlob(blob, maxDim = 1920) {
  const img = new Image();
  const url = URL.createObjectURL(blob);
  await new Promise((res, rej) => {
    img.onload  = res;
    img.onerror = rej;
    img.src     = url;
  });
  URL.revokeObjectURL(url);

  let { width, height } = img;
  if (width <= maxDim && height <= maxDim) {
    return blob;
  }
  if (width > height) {
    height = Math.round((height * maxDim) / width);
    width  = maxDim;
  } else {
    width  = Math.round((width * maxDim) / height);
    height = maxDim;
  }

  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(img, 0, 0, width, height);

  // output as JPEG at 80% quality
  return await new Promise(res =>
    canvas.toBlob(res, 'image/jpeg', 0.8)
  );
}

export class ImageCache {
  constructor() {
    this.memoryCache = new Map();
    this.pendingRequests = new Map();
    this.maxMemorySize = this.calculateMaxMemory();
    this.currentMemorySize = 0;
    this.preloadQueue = [];
    this.isPreloading = false;

    // Default caching policy
    this.defaultPolicy = {
      ttl: 3 * 60 * 1000, // 3 minutes
      priority: 'normal', // normal, high, low
      retries: 3
    };
    this.policies = new Map();
    this.urlPolicyCache = new Map(); // cache policy lookups

    // Analytics metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      refreshes: 0,
      errors: 0,
      startTime: Date.now()
    };

    // Store interval IDs for cleanup
    this.intervals = [];

    // Monitor memory if available
    if ('memory' in performance) {
      this.intervals.push(
        setInterval(() => this.checkMemoryPressure(), 1000)
      );
    }

    // Periodic cleanup
    this.intervals.push(
      setInterval(() => this.cleanupMemory(), 5 * 60 * 1000)
    );

    // Periodic refresh: re-fetch stale entries every 3 minutes
    this.intervals.push(
      setInterval(() => this.refreshCachedImages(), 3 * 60 * 1000)
    );
  }

  /**
   * Stop all background tasks and clear the cache.
   */
  shutdown() {
    this.intervals.forEach(id => clearInterval(id));
    this.intervals = [];
    this.pendingRequests.forEach(({ controller }) => controller.abort());
    this.pendingRequests.clear();
    this.clear();
  }

  calculateMaxMemory() {
    if ('memory' in performance) {
      return Math.floor(performance.memory.jsHeapSizeLimit * 0.4);
    }
    return 250 * 1024 * 1024; // 250MB fallback
  }

  checkMemoryPressure() {
    const { usedJSHeapSize = 0, jsHeapSizeLimit = 1 } = performance.memory || {};
    const usedRatio = usedJSHeapSize / jsHeapSizeLimit;
    if (usedRatio > 0.8) {
      this.cleanupMemory();
    }
  }

  setPolicy(urlPattern, policy) {
    this.policies.set(urlPattern, { ...this.defaultPolicy, ...policy });
    this.urlPolicyCache.clear();
    return this;
  }

  getPolicy(url) {
    if (this.urlPolicyCache.has(url)) {
      return this.urlPolicyCache.get(url);
    }
    let matched = this.defaultPolicy;
    for (const [pattern, policy] of this.policies) {
      if (url.includes(pattern)) {
        matched = policy;
        break;
      }
    }
    this.urlPolicyCache.set(url, matched);
    return matched;
  }

  async fetchWithRetry(url, options = {}, retries = 3, baseDelay = 300) {
    const { signal, ...rest } = options;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, { ...rest, signal });
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        return response;
      } catch (err) {
        if (signal && signal.aborted) throw err;
        if (attempt === retries) throw err;
        const delay = baseDelay * Math.pow(2, attempt) * (0.9 + Math.random() * 0.2);
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }

  async generateThumbnail(blob, maxSize = 200) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        if (width > height && width > maxSize) {
          height = Math.round(height * (maxSize / width));
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round(width * (maxSize / height));
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(th => resolve(URL.createObjectURL(th)), 'image/jpeg', 0.7);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  }

  async cacheImage(url, options = {}) {
    // Cancel any in-flight request for the same URL
    if (this.pendingRequests.has(url)) {
      this.pendingRequests.get(url).controller.abort();
      this.pendingRequests.delete(url);
    }

    const controller = new AbortController();
    const requestPromise = (async () => {
      const policy = this.getPolicy(url);
      const now = Date.now();

      // HIT: return if within TTL
      if (this.memoryCache.has(url)) {
        const entry = this.memoryCache.get(url);
        entry.lastAccessed = now;
        if (now - entry.fetchedAt < policy.ttl) {
          this.metrics.hits++;
          return entry.url;
        }
        // stale → revoke & remove
        URL.revokeObjectURL(entry.url);
        if (entry.thumbnailUrl) URL.revokeObjectURL(entry.thumbnailUrl);
        this.currentMemorySize -= entry.size;
        this.memoryCache.delete(url);
        this.metrics.refreshes++;
      } else {
        this.metrics.misses++;
      }

      try {
        // fetch raw blob
        let blob = await (await this.fetchWithRetry(
          url,
          { ...options, cache: 'no-store', signal: controller.signal },
          policy.retries
        )).blob();

        // downscale large images to max 1920px
        blob = await downscaleBlob(blob, 1920);

        const objectUrl = URL.createObjectURL(blob);

        // optional thumbnail for UI (not returned)
        let thumbnailUrl = null;
        if (blob.size > 100 * 1024) {
          try { thumbnailUrl = await this.generateThumbnail(blob) } catch {}
        }

        // measure dimensions
        let width = 0, height = 0;
        try {
          const img = new Image();
          await new Promise((res, rej) => {
            img.onload  = () => { width = img.width; height = img.height; res() };
            img.onerror = rej;
            img.src     = objectUrl;
          });
        } catch {}

        // cache entry
        const imageData = {
          url: objectUrl,
          thumbnailUrl,
          size: blob.size,
          lastAccessed: now,
          fetchedAt: now,
          width,
          height,
          priority: policy.priority
        };
        this.memoryCache.set(url, imageData);
        this.currentMemorySize += blob.size;
        if (this.currentMemorySize > this.maxMemorySize) {
          this.cleanupMemory();
        }

        return objectUrl;
            } catch (error) {
        if (controller.signal.aborted) {
          // do not count deliberate aborts as errors
          throw error;
        }
        this.metrics.errors++;
        console.error('cacheImage error:', error);

        // If we have a previously cached blob URL, reuse it
        const prev = this.memoryCache.get(url);
        if (prev) {
          return prev.url;
        }

        // Last resort: return a local placeholder so <img> doesn’t break
        return '/images/placeholder.png';
      }

    })();

    this.pendingRequests.set(url, { promise: requestPromise, controller });
    requestPromise.finally(() => this.pendingRequests.delete(url));
    return requestPromise;
  }

  async preloadImages(urls) {
    this.preloadQueue.push(...urls);
    if (!this.isPreloading) {
      this.isPreloading = true;
      while (this.preloadQueue.length) {
        const next = this.preloadQueue.shift();
        await this.cacheImage(next).catch(() => {});
      }
      this.isPreloading = false;
    }
  }

  async refreshCachedImages() {
    const now = Date.now();
    const stale = [];
    for (const [url, entry] of this.memoryCache) {
      const policy = this.getPolicy(url);
      if (now - entry.fetchedAt >= policy.ttl) stale.push(url);
    }
    const batch = 5;
    for (let i = 0; i < stale.length; i += batch) {
      const slice = stale.slice(i, i + batch);
      await Promise.allSettled(slice.map(u => this.cacheImage(u).catch(() => {})));
    }
  }

  cleanupMemory() {
    const entries = [...this.memoryCache.entries()]
      .sort(([, a], [, b]) => {
        const order = { high: 2, normal: 1, low: 0 };
        const d = order[a.priority] - order[b.priority];
        return d || a.lastAccessed - b.lastAccessed;
      });
    const threshold = this.maxMemorySize * 0.8;
    while (this.currentMemorySize > threshold && entries.length) {
      const [url, entry] = entries.shift();
      URL.revokeObjectURL(entry.url);
      if (entry.thumbnailUrl) URL.revokeObjectURL(entry.thumbnailUrl);
      this.memoryCache.delete(url);
      this.currentMemorySize -= entry.size;
    }
  }

  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total ? (this.metrics.hits / total) * 100 : 0;
    const uptime = Math.floor((Date.now() - this.metrics.startTime) / 1000);
    return {
      ...this.metrics,
      hitRate: `${hitRate.toFixed(1)}%`,
      cacheSize: `${(this.currentMemorySize / 1024 / 1024).toFixed(2)}MB`,
      maxSize: `${(this.maxMemorySize / 1024 / 1024).toFixed(2)}MB`,
      itemCount: this.memoryCache.size,
      pending: this.pendingRequests.size,
      uptime: `${uptime}s`
    };
  }

  clear() {
    for (const entry of this.memoryCache.values()) {
      URL.revokeObjectURL(entry.url);
      if (entry.thumbnailUrl) URL.revokeObjectURL(entry.thumbnailUrl);
    }
    this.memoryCache.clear();
    this.currentMemorySize = 0;
    return this;
  }

  resetMetrics() {
    this.metrics = { hits: 0, misses: 0, refreshes: 0, errors: 0, startTime: Date.now() };
    return this;
  }
}
