import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useStore } from '../store';
import { FaGoogle, FaSpinner, FaFolder, FaTimes } from 'react-icons/fa';
import { DriveManager } from '../services/driveService';
import { motion } from 'framer-motion';

export function GoogleDriveFolderDialog({ folders, isLoading, onDismiss, onFolderSelected }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-gray-900 rounded-lg max-w-md w-full p-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Select Google Drive Folder</h2>
          <button
            onClick={onDismiss}
            className="p-2 hover:bg-gray-800 rounded-full"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center p-4 text-gray-400">No folders found</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {folders.map(folder => (
                <div
                  key={folder.id}
                  onClick={() => onFolderSelected(folder)}
                  className="p-3 hover:bg-gray-800 cursor-pointer flex items-center gap-2"
                >
                  <FaFolder className="text-gray-400" />
                  <span>{folder.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function GoogleDriveAuth() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [folders, setFolders] = React.useState([]);
  const [showFolderPicker, setShowFolderPicker] = React.useState(false);
  const [accessToken, setAccessToken] = React.useState(null);
  const { updateSettings, addGoogleDriveImages } = useStore();
  const [driveManager, setDriveManager] = React.useState(null);

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
      console.log('Login successful:', tokenResponse);
      setIsLoading(true);
      try {
        setAccessToken(tokenResponse.access_token);
        const driveManager = new DriveManager(tokenResponse.access_token);
        setDriveManager(driveManager);
        const folderList = await driveManager.listFolders();
        setFolders(folderList);
        setShowFolderPicker(true);
      } catch (error) {
        console.error('Error fetching folders:', error);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google login failed:', error);
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
          className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-all"
        >
          {isLoading ? <FaSpinner className="animate-spin" /> : <FaGoogle />}
          {isLoading ? 'Connecting...' : 'Connect Google Drive'}
        </button>
      ) : (
        motion.AnimatePresence && (
          <motion.AnimatePresence>
            <GoogleDriveFolderDialog
              folders={folders}
              isLoading={isLoading}
              onDismiss={() => setShowFolderPicker(false)}
              onFolderSelected={handleFolderSelect}
            />
          </motion.AnimatePresence>
        )
      )}
      {!accessToken && (
        <p className="text-red-500 text-center mt-2">
          Google Drive is not connected.
        </p>
      )}
    </>
  );
}
