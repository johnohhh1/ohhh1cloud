export class ImageCache {
  constructor() {
    this.memoryCache = new Map();
    this.maxMemorySize = this.calculateMaxMemory();
    this.currentMemorySize = 0;
    this.preloadQueue = [];
    this.isPreloading = false;
    
    // Monitor memory like your Android app
    if ('memory' in performance) {
      setInterval(() => this.checkMemoryPressure(), 1000);
    }
  }

  calculateMaxMemory() {
    // Use 40% of available memory like your Android app
    if ('memory' in performance) {
      return Math.floor(performance.memory.jsHeapSizeLimit * 0.4);
    }
    return 250 * 1024 * 1024; // 250MB fallback
  }

  checkMemoryPressure() {
    const usedRatio = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    if (usedRatio > 0.8) { // 80% memory usage
      this.cleanupMemory();
    }
  }

  async cacheImage(url, options = {}) {
    // Check memory cache first
    if (this.memoryCache.has(url)) {
      const cached = this.memoryCache.get(url);
      cached.lastAccessed = Date.now();
      return cached.url;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Cache-Control': 'max-age=3600'
        }
      });

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const imageData = {
        url: objectUrl,
        size: blob.size,
        lastAccessed: Date.now(),
        width: 0,
        height: 0
      };

      // Get image dimensions like Glide does
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = () => {
          imageData.width = img.width;
          imageData.height = img.height;
          resolve();
        };
        img.onerror = reject;
        img.src = objectUrl;
      });

      this.memoryCache.set(url, imageData);
      this.currentMemorySize += imageData.size;

      if (this.currentMemorySize > this.maxMemorySize) {
        await this.cleanupMemory();
      }

      return objectUrl;
    } catch (error) {
      console.error('Error caching image:', error);
      return url;
    }
  }

  async preloadImages(urls) {
    this.preloadQueue.push(...urls);
    if (!this.isPreloading) {
      this.isPreloading = true;
      while (this.preloadQueue.length > 0) {
        const url = this.preloadQueue.shift();
        await this.cacheImage(url).catch(() => {});
      }
      this.isPreloading = false;
    }
  }

  cleanupMemory() {
    const entries = [...this.memoryCache.entries()]
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    while (this.currentMemorySize > this.maxMemorySize * 0.8 && entries.length) {
      const [url, entry] = entries.shift();
      URL.revokeObjectURL(entry.url);
      this.memoryCache.delete(url);
      this.currentMemorySize -= entry.size;
    }
  }
}