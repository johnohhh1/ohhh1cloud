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
      ttl: 2 * 60 * 1000, // 2 minutes
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

    // Cleanup every 5 minutes if needed
    this.intervals.push(
      setInterval(() => this.cleanupMemory(), 5 * 60 * 1000)
    );

    // Periodic refresh: re-fetch only stale entries every 2 minutes
    this.intervals.push(
      setInterval(() => this.refreshCachedImages(), 2 * 60 * 1000)
    );
  }

  /**
   * Stop all background tasks and clear the cache.
   */
  shutdown() {
    // clear intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals = [];

    // abort pending fetches
    this.pendingRequests.forEach(({ controller }) => controller.abort());
    this.pendingRequests.clear();

    // clear all objectURLs
    this.clear();
  }

  calculateMaxMemory() {
    if ('memory' in performance) {
      return Math.floor(performance.memory.jsHeapSizeLimit * 0.4);
    }
    return 250 * 1024 * 1024; // 250MB fallback
  }

  checkMemoryPressure() {
    const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory || {};
    const usedRatio = usedJSHeapSize / jsHeapSizeLimit;
    if (usedRatio > 0.8) {
      this.cleanupMemory();
    }
  }

  /**
   * Assign a custom caching policy for URLs containing a pattern.
   */
  setPolicy(urlPattern, policy) {
    this.policies.set(urlPattern, { ...this.defaultPolicy, ...policy });
    this.urlPolicyCache.clear(); // invalidate cache
    return this; // chainable
  }

  /**
   * Retrieve the policy for a given URL, with caching of lookups.
   */
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

  /**
   * Fetch with retry logic, exponential backoff, and abort support.
   */
  async fetchWithRetry(url, options = {}, retries = 3, baseDelay = 300) {
    const { signal, ...rest } = options;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, { ...rest, signal });
        if (!response.ok) throw new Error(`Failed: ${response.status}`);
        return response;
      } catch (err) {
        if (signal && signal.aborted) throw err;
        if (attempt === retries) throw err;
        const delay = baseDelay * Math.pow(2, attempt) * (0.9 + Math.random() * 0.2);
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }

  /**
   * Generate a thumbnail objectURL for a blob.
   */
  async generateThumbnail(blob, maxSize = 200) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxSize) {
          height = Math.round(height * (maxSize / width));
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round(width * (maxSize / height));
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(th => resolve(URL.createObjectURL(th)), 'image/jpeg', 0.7);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Cache and retrieve an image, with TTL, retries, dedupe, and metrics.
   */
  async cacheImage(url, options = {}) {
    // Abort any stale in-flight request
    if (this.pendingRequests.has(url)) {
      const { controller } = this.pendingRequests.get(url);
      controller.abort();
      this.pendingRequests.delete(url);
    }

    const controller = new AbortController();
    const requestPromise = (async () => {
      const policy = this.getPolicy(url);
      const now = Date.now();

      // Hit
      if (this.memoryCache.has(url)) {
        const entry = this.memoryCache.get(url);
        entry.lastAccessed = now;
        if (now - entry.fetchedAt < policy.ttl) {
          this.metrics.hits++;
          return entry.thumbnailUrl || entry.url;
        }
        // stale: revoke both URLs
        URL.revokeObjectURL(entry.url);
        if (entry.thumbnailUrl) URL.revokeObjectURL(entry.thumbnailUrl);
        this.currentMemorySize -= entry.size;
        this.memoryCache.delete(url);
        this.metrics.refreshes++;
      } else {
        this.metrics.misses++;
      }

      try {
        const response = await this.fetchWithRetry(
          url,
          { ...options, cache: 'no-store', signal: controller.signal },
          policy.retries
        );
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        // optional thumbnail
        let thumbnailUrl = null;
        if (blob.size > 100 * 1024) {
          try {
            thumbnailUrl = await this.generateThumbnail(blob);
          } catch {}
        }

        // measure dimensions
        let width = 0, height = 0;
        try {
          const img = new Image();
          await new Promise((res, rej) => {
            img.onload = () => { width = img.width; height = img.height; res(); };
            img.onerror = rej;
            img.src = objectUrl;
          });
        } catch {}

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
          // do not count aborts as errors
          throw error;
        }
        this.metrics.errors++;
        return url;
      }
    })();

    this.pendingRequests.set(url, { promise: requestPromise, controller });
    requestPromise.finally(() => this.pendingRequests.delete(url));
    return requestPromise;
  }

  /**
   * Preload images sequentially in background
   */
  async preloadImages(urls) {
    this.preloadQueue.push(...urls);
    if (!this.isPreloading) {
      this.isPreloading = true;
      while (this.preloadQueue.length) {
        const nextUrl = this.preloadQueue.shift();
        await this.cacheImage(nextUrl).catch(() => {});
      }
      this.isPreloading = false;
    }
  }

  /**
   * Refresh only URLs whose TTL expired, batching to avoid spikes.
   */
  async refreshCachedImages() {
    const now = Date.now();
    const stale = [];
    for (const [url, entry] of this.memoryCache) {
      const policy = this.getPolicy(url);
      if (now - entry.fetchedAt >= policy.ttl) stale.push(url);
    }
    const batchSize = 5;
    for (let i = 0; i < stale.length; i += batchSize) {
      const batch = stale.slice(i, i + batchSize);
      await Promise.allSettled(batch.map(u => this.cacheImage(u).catch(() => {})));
    }
  }

  /**
   * Cleanup based on priority + LRU until under memory threshold.
   */
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

  /**
   * Get snapshot of cache metrics
   */
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

  /**
   * Clear all cached entries immediately.
   */
  clear() {
    for (const entry of this.memoryCache.values()) {
      URL.revokeObjectURL(entry.url);
      if (entry.thumbnailUrl) URL.revokeObjectURL(entry.thumbnailUrl);
    }
    this.memoryCache.clear();
    this.currentMemorySize = 0;
    return this;
  }

  /**
   * Reset metrics counters and start time
   */
  resetMetrics() {
    this.metrics = { hits: 0, misses: 0, refreshes: 0, errors: 0, startTime: Date.now() };
    return this;
  }
}
