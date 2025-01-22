import { Dropbox } from 'dropbox';
import { ImageCache } from './imagecache';
import { logSensitive } from '../utils/security';

export class DropboxManager {
  constructor(accessToken) {
    if (!accessToken) {
      throw new Error("Access token is required");
    }
    this.accessToken = accessToken;
    logSensitive('Using Dropbox token', accessToken);
    this.dropbox = new Dropbox({ accessToken });
    this.imageCache = new ImageCache();
  }

  // List folders in Dropbox
  async listFolders(path = '') {
    try {
      console.log('Attempting to list folders with token:', this.accessToken.substring(0, 10) + '...');
      const response = await this.dropbox.filesListFolder({
        path,
        recursive: false
      });
      
      console.log('Dropbox response:', response);

      const folders = response.result.entries
        .filter(entry => entry['.tag'] === 'folder')
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          path: folder.path_display
        }));
        
      console.log('Filtered folders:', folders);
      return folders;
    } catch (error) {
      console.error("Error listing Dropbox folders:", error);
      return [];
    }
  }

  // Get images from a specific folder
  async getFolderImages(path) {
    try {
      const response = await this.dropbox.filesListFolder({
        path,
        recursive: false
      });

      console.log('Files in folder:', response.result.entries);

      const images = response.result.entries
        .filter(entry => entry['.tag'] === 'file' && 
          entry.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
        );

      console.log('Filtered image files:', images);

      const imageUrls = await Promise.all(
        images.map(async (file) => {
          const tempLink = await this.dropbox.filesGetTemporaryLink({
            path: file.path_display
          });
          
          // Use the new caching mechanism
          const cachedUrl = await this.imageCache.cacheImage(tempLink.result.link);
          
          return {
            id: file.id,
            name: file.name,
            url: cachedUrl,
            thumbnail: cachedUrl
          };
        })
      );

      console.log('Generated image URLs:', imageUrls);
      return imageUrls;
    } catch (error) {
      console.error("Error getting folder images:", error);
      return [];
    }
  }

  async watchFolder(path, onNewImages, checkInterval = 30000) {
    console.log('Started watching Dropbox folder:', path);
    let knownImages = new Set();
    let isWatching = true;
    
    // Initial load of images
    const initialImages = await this.getFolderImages(path);
    knownImages = new Set(initialImages.map(img => img.id));
    console.log('Initial Dropbox images:', initialImages.length);
    
    const checkForNewImages = async () => {
      if (!isWatching) return;
      
      try {
        const currentImages = await this.getFolderImages(path);
        const newImages = currentImages.filter(img => !knownImages.has(img.id));
        
        if (newImages.length > 0) {
          console.log(`Found ${newImages.length} new Dropbox images:`, newImages);
          knownImages = new Set(currentImages.map(img => img.id));
          onNewImages(newImages);
        }
      } catch (error) {
        console.error('Error checking for new Dropbox images:', error);
      }
    };

    // Start polling
    const intervalId = setInterval(checkForNewImages, checkInterval);
    console.log('Started Dropbox polling with interval:', checkInterval);

    return () => {
      isWatching = false;
      clearInterval(intervalId);
      console.log('Stopped watching Dropbox folder:', path);
    };
  }
} 