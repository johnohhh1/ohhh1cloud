// src/services/driveService.js

export class DriveManager {
  constructor(accessToken) {
    if (!accessToken) {
      throw new Error("Access token is required");
    }
    this.accessToken = accessToken;
    this.imageMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/webp"
    ];
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async makeRequest(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        ...options.headers
      }
    });

    if (response.status === 401) {
      throw new Error('Unauthorized: Token expired or invalid');
    }

    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error?.message?.includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error('Access forbidden. Check permissions.');
    }

    if (response.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  async retryRequest(requestFn, maxRetries = this.maxRetries) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry auth errors
        if (error.message.includes('Unauthorized') || error.message.includes('401')) {
          throw error;
        }

        // Don't retry forbidden errors
        if (error.message.includes('Access forbidden') || error.message.includes('403')) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
          console.log(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  async listFolders() {
    return this.retryRequest(async () => {
      try {
        const query = "mimeType='application/vnd.google-apps.folder'";
        const url = 'https://www.googleapis.com/drive/v3/files?' +
          new URLSearchParams({
            q: query,
            spaces: "drive",
            fields: "files(id, name)",
            pageSize: "100"
          });

        const response = await this.makeRequest(url);
        const data = await response.json();
        
        if (!data.files) {
          console.warn('No files array in response:', data);
          return [];
        }

        console.log('Found folders:', data.files.length);
        return data.files.map(folder => ({ id: folder.id, name: folder.name }));
      } catch (error) {
        console.error("Error listing folders:", error);
        throw error;
      }
    });
  }

  async getImagesFromFolder(folderId) {
    return this.retryRequest(async () => {
      try {
        const query = `'${folderId}' in parents and (${
          this.imageMimeTypes.map(mime => `mimeType='${mime}'`).join(' or ')
        })`;

        console.log('Querying for images in folder:', folderId);

        const url = 'https://www.googleapis.com/drive/v3/files?' +
          new URLSearchParams({
            q: query,
            spaces: "drive",
            fields: "files(id, name, mimeType, size, modifiedTime)",
            pageSize: "1000"
          });

        const response = await this.makeRequest(url);
        const data = await response.json();
        
        if (!data.files) {
          throw new Error('No files array in response: ' + JSON.stringify(data));
        }

        console.log(`Found ${data.files.length} images in folder ${folderId}`);

        const images = data.files.map((file) => {
          return {
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size,
            modifiedTime: file.modifiedTime,
            url: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            isNew: true,
            source: 'googleDrive'
          };
        });

        return images;
      } catch (error) {
        console.error(`Error getting images from folder ${folderId}:`, error);
        throw error;
      }
    });
  }

  async fetchImageData(url) {
    return this.retryRequest(async () => {
      try {
        const response = await this.makeRequest(url);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } catch (error) {
        console.error("Error fetching image data:", error);
        throw error;
      }
    });
  }

  async watchFolder(folderId, onNewImages, checkInterval = 30000) {
    console.log('Started watching folder:', folderId, 'interval:', checkInterval);
    let knownImages = new Map(); // Use Map to store more metadata
    let isWatching = true;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;

    const checkForNewImages = async () => {
      if (!isWatching) return;

      try {
        const currentImages = await this.getImagesFromFolder(folderId);
        const newImages = [];

        for (const img of currentImages) {
          const existing = knownImages.get(img.id);
          if (!existing) {
            // Completely new image
            newImages.push(img);
            knownImages.set(img.id, {
              id: img.id,
              modifiedTime: img.modifiedTime,
              name: img.name
            });
          } else if (existing.modifiedTime !== img.modifiedTime) {
            // Image was modified
            console.log('Image modified:', img.name);
            newImages.push({ ...img, isModified: true });
            knownImages.set(img.id, {
              id: img.id,
              modifiedTime: img.modifiedTime,
              name: img.name
            });
          }
        }

        if (newImages.length > 0) {
          console.log(`Found ${newImages.length} new/modified images`);
          onNewImages(newImages);
        }

        consecutiveErrors = 0; // Reset error counter on success
      } catch (error) {
        consecutiveErrors++;
        console.error(`Error checking for new images (${consecutiveErrors}/${maxConsecutiveErrors}):`, error);
        
        if (error.message.includes('Unauthorized') || error.message.includes('401')) {
          console.log('Token expired, stopping folder watch');
          isWatching = false;
          return;
        }

        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error('Too many consecutive errors, stopping folder watch');
          isWatching = false;
          return;
        }

        // Increase interval on errors to avoid hammering the API
        checkInterval = Math.min(checkInterval * 1.5, 300000); // Max 5 minutes
      }
    };

    // Initial check to populate known images
    await checkForNewImages();
    
    // Set up interval checking
    const intervalId = setInterval(checkForNewImages, checkInterval);

    return () => {
      isWatching = false;
      clearInterval(intervalId);
      console.log('Stopped watching folder:', folderId);
    };
  }

  async verifyConnection() {
    try {
      const response = await this.makeRequest(
        'https://www.googleapis.com/drive/v3/about?fields=user'
      );
      const data = await response.json();
      return {
        connected: true,
        user: data.user
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  async testNotification(onNewImages) {
    const testImage = {
      id: 'test-' + Date.now(),
      name: 'Test Image',
      mimeType: 'image/jpeg',
      url: 'https://picsum.photos/800/600',
      isNew: true,
      source: 'googleDrive'
    };

    onNewImages([testImage]);
  }
}

export default DriveManager;
