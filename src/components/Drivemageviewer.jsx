import { useState, useEffect } from 'react';
import { DriveManager } from '../services/driveservice';

const DriveImageViewer = ({ folderId, accessToken, onImageLoad, onError }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [stopWatchFunction, setStopWatchFunction] = useState(null);

  // Load images when folderId or accessToken changes
  useEffect(() => {
    if (folderId && accessToken) {
      loadImagesFromFolder(folderId, accessToken);
    }
    
    // Cleanup function to stop watching when component unmounts
    return () => {
      if (stopWatchFunction) {
        stopWatchFunction();
      }
    };
  }, [folderId, accessToken]);

  const loadImagesFromFolder = async (folder, token) => {
    if (!folder || !token) return;
    
    setLoading(true);
    try {
      const manager = new DriveManager(token);
      const imageList = await manager.getImagesFromFolder(folder);
      
      console.log(`Loaded ${imageList.length} images from folder ${folder}`);
      setImages(imageList);
      
      if (imageList.length > 0 && onImageLoad) {
        onImageLoad(imageList);
      }
      
      // Start watching the folder for changes
      startWatchingFolder(folder, token);
    } catch (err) {
      console.error("Error loading images:", err);
      if (onError) {
        onError(`Failed to load images: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const startWatchingFolder = async (folder, token) => {
    // Stop any existing watcher
    if (stopWatchFunction) {
      stopWatchFunction();
    }
    
    try {
      const manager = new DriveManager(token);
      
      const handleNewImages = (newImages) => {
        console.log(`Found ${newImages.length} new images`);
        
        setImages(prevImages => {
          // Avoid duplicates
          const existingIds = new Set(prevImages.map(img => img.id));
          const uniqueNewImages = newImages.filter(img => !existingIds.has(img.id));
          
          if (uniqueNewImages.length > 0 && onImageLoad) {
            onImageLoad([...prevImages, ...uniqueNewImages]);
          }
          
          return [...prevImages, ...uniqueNewImages];
        });
      };
      
      const stopFn = await manager.watchFolder(folder, handleNewImages);
      setStopWatchFunction(() => stopFn);
      setIsWatching(true);
      console.log(`Started watching folder: ${folder}`);
    } catch (err) {
      console.error("Error setting up folder watcher:", err);
      if (onError) {
        onError(`Failed to watch folder for new images: ${err.message}`);
      }
    }
  };

  // Function to get the current image to display
  const getCurrentImage = () => {
    if (images.length === 0) return null;
    return images[currentImageIndex];
  };

  // Move to the next image
  const showNextImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  // Move to the previous image
  const showPreviousImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };
  
  // Helper to create a proxy URL that avoids CORS issues
  const getProxyImageUrl = (image) => {
    if (!image) return '';
    
    // Option 1: Using API route proxy (recommended for production)
    return `/api/gdrive-proxy?fileId=${image.id}&token=${encodeURIComponent(accessToken)}`;
    
    // Option 2: Using public CORS proxy (for development/testing only)
    // return `https://corsproxy.io/?${encodeURIComponent(image.url)}`;
    
    // Option 3: Direct URL (may have CORS issues)
    // return image.url;
  };

  const currentImage = getCurrentImage();

  return (
    <div className="drive-image-viewer">
      {loading && <div className="loading">Loading images...</div>}
      
      {currentImage && (
        <div className="image-container">
          <img 
            src={getProxyImageUrl(currentImage)} 
            alt={currentImage.name}
            onError={(e) => {
              console.error("Image load error:", e);
              e.target.src = '/placeholder.png'; // Fallback image
            }}
          />
          <div className="image-name">{currentImage.name}</div>
        </div>
      )}
      
      {!currentImage && !loading && (
        <div className="no-images">
          No images available. Please select a Google Drive folder containing images.
        </div>
      )}
      
      {images.length > 1 && (
        <div className="navigation-controls">
          <button onClick={showPreviousImage} className="nav-button prev">
            Previous
          </button>
          <div className="image-counter">
            {currentImageIndex + 1} of {images.length}
          </div>
          <button onClick={showNextImage} className="nav-button next">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DriveImageViewer;
