import React from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useStore } from '../store'
import { FaGoogle, FaSpinner } from 'react-icons/fa'
import { DriveManager } from '../services/driveService'
import { GoogleDriveFolderDialog } from './GoogleDriveFolderDialog'
import { AnimatePresence } from 'framer-motion'
import { NotificationSound } from './NotificationSound'

export default function GoogleDriveAuth() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [folders, setFolders] = React.useState([])
  const [showFolderPicker, setShowFolderPicker] = React.useState(false)
  const [accessToken, setAccessToken] = React.useState(null)
  const { updateSettings, addNewImages, settings } = useStore()
  const [driveManager, setDriveManager] = React.useState(null)
  const [showNotification, setShowNotification] = React.useState(false)

  const handleFolderSelect = async (folder) => {
    setIsLoading(true);
    try {
      const images = await driveManager.getImagesFromFolder(folder.id);
      console.log('Images before adding to store:', images);
      addNewImages(images, 'googleDrive');
      updateSettings({
        googleDrive: {
          isConnected: true,
          selectedFolder: folder
        }
      });
      setShowFolderPicker(false);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewImages = React.useCallback((newImages) => {
    console.log('New images detected from Google Drive:', newImages);
    
    const markedImages = newImages.map(img => ({
      ...img,
      isNew: true,
      source: 'googleDrive'
    }));
    
    addNewImages(markedImages, 'googleDrive');
    
    if (settings.notifications?.enabled) {
      setShowNotification(true);
    }
  }, [settings.notifications?.enabled, addNewImages]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Login successful');
      setIsLoading(true);
      try {
        setAccessToken(tokenResponse.access_token);
        const driveManager = new DriveManager(tokenResponse.access_token);
        setDriveManager(driveManager);
        const folderList = await driveManager.listFolders();
        setFolders(folderList);
        setShowFolderPicker(true);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      setIsLoading(false);
    },
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    flow: 'implicit'
  });

  React.useEffect(() => {
    let cleanup = null;

    if (driveManager && settings.googleDrive?.selectedFolder) {
      driveManager.watchFolder(
        settings.googleDrive.selectedFolder.id,
        handleNewImages
      ).then(stopWatchingFn => {
        cleanup = stopWatchingFn;
      });
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [driveManager, settings.googleDrive?.selectedFolder]);

  return (
    <>
      {!showFolderPicker ? (
        <button 
          onClick={() => login()}
          className="w-full flex items-center justify-center gap-2"
        >
          <FaGoogle />
          Connect Google Drive
        </button>
      ) : (
        <AnimatePresence>
          <GoogleDriveFolderDialog
            folders={folders}
            isLoading={isLoading}
            onDismiss={() => setShowFolderPicker(false)}
            onFolderSelected={handleFolderSelect}
          />
        </AnimatePresence>
      )}
      
      {showNotification && settings.notifications?.sound && (
        <NotificationSound 
          onComplete={() => setShowNotification(false)}
          volume={settings.notifications?.volume || 0.5}
        />
      )}
    </>
  );
}