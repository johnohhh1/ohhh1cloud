import { ImageCache } from './imagecache';

export class DriveManager {
  constructor(accessToken) {
    if (!accessToken) {
      throw new Error("Access token is required");
    }
    this.accessToken = accessToken;
    this.imageCache = new ImageCache();
    
    // Match your Android app's MIME types
    this.imageMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/webp"
    ];
  }

  async listFolders() {
    try {
      // Match your Android query
      const query = "mimeType='application/vnd.google-apps.folder'";
      
      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?' +
        new URLSearchParams({
          q: query,
          spaces: "drive",
          fields: "files(id, name)",
          pageSize: "100"
        }), {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const data = await response.json();
      console.log('Found folders:', data.files);
      
      return data.files.map(folder => ({
        id: folder.id,
        name: folder.name
      }));
    } catch (error) {
      console.error("Error listing folders:", error);
      return [];
    }
  }

  async getImagesFromFolder(folderId) {
    try {
      const query = `'${folderId}' in parents and (${
        this.imageMimeTypes.map(mime => `mimeType='${mime}'`).join(' or ')
      })`;

      console.log('Querying for images with:', query);

      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?' +
        new URLSearchParams({
          q: query,
          spaces: "drive",
          fields: "files(id, name, mimeType, webContentLink)",
          pageSize: "1000"
        }), {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const data = await response.json();
      console.log(`Found ${data.files.length} images in folder ${folderId}`);

      // Process images like your Android app
      const images = await Promise.all(
        data.files.map(async file => {
          const imageUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
          const cachedUrl = await this.imageCache.cacheImage(imageUrl, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`
            }
          });

          return {
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            url: cachedUrl // This should now be a proper URL string
          };
        })
      );

      console.log('Processed images:', images);
      return images;

    } catch (error) {
      console.error(`Error getting images from folder ${folderId}:`, error);
      return [];
    }
  }

  // Helper method to get an authorized image URL - now used in the React component
  async fetchImageData(url) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error fetching image data:", error);
      return null;
    }
  }

  async watchFolder(folderId, onNewImages, checkInterval = 30000) {
    console.log('Started watching folder:', folderId);
    let knownImages = new Set();
    let isWatching = true;
    
    const checkForNewImages = async () => {
      if (!isWatching) return;
      
      const currentImages = await this.getImagesFromFolder(folderId);
      const newImages = currentImages.filter(img => !knownImages.has(img.id));
      
      if (newImages.length > 0) {
        console.log(`Found ${newImages.length} new images`);
        knownImages = new Set([...currentImages.map(img => img.id)]);
        onNewImages(newImages);
      }
    };

    await checkForNewImages();
    const intervalId = setInterval(checkForNewImages, checkInterval);

    return () => {
      isWatching = false;
      clearInterval(intervalId);
      console.log('Stopped watching folder:', folderId);
    };
  }

  async testNotification(onNewImages) {
    const testImage = {
      id: 'test-' + Date.now(),
      name: 'Test Image',
      mimeType: 'image/jpeg',
      url: 'https://picsum.photos/800/600'  // Random test image
    };
    
    onNewImages([testImage]);
  }
}
