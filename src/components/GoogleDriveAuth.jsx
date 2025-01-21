import React from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useStore } from '../store'
import { FaGoogle, FaSpinner } from 'react-icons/fa'
import { DriveManager } from '../services/driveService'
import { GoogleDriveFolderDialog } from './GoogleDriveFolderDialog'
import { AnimatePresence } from 'framer-motion'

export default function GoogleDriveAuth() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [folders, setFolders] = React.useState([])
  const [showFolderPicker, setShowFolderPicker] = React.useState(false)
  const [accessToken, setAccessToken] = React.useState(null)
  const { updateSettings, addGoogleDriveImages } = useStore()
  const [driveManager, setDriveManager] = React.useState(null)

  const handleFolderSelect = async (folder) => {
    setIsLoading(true);
    try {
      const images = await driveManager.getImagesFromFolder(folder.id);
      console.log('Images before adding to store:', images);
      addGoogleDriveImages(images);
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
    </>
  );
}