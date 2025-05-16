// src/components/GoogleDriveAuth.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { FaGoogle, FaSpinner } from 'react-icons/fa';
import { AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { DriveManager } from '../services/driveService';
import { GoogleDriveFolderDialog } from './GoogleDriveFolderDialog';
import { NotificationSound } from './NotificationSound';

export default function GoogleDriveAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [folders, setFolders] = useState([]);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const { updateSettings, addNewImages, settings } = useStore();
  const [driveManager, setDriveManager] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  const handleFolderSelect = async (folder) => {
    setIsLoading(true);
    try {
      const images = await driveManager.getImagesFromFolder(folder.id);
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

  const handleNewImages = useCallback((newImages) => {
    const marked = newImages.map(img => ({
      ...img,
      isNew: true,
      source: 'googleDrive'
    }));
    addNewImages(marked, 'googleDrive');
    if (settings.notifications?.enabled) {
      setShowNotification(true);
    }
  }, [settings.notifications?.enabled, addNewImages]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        setAccessToken(tokenResponse.access_token);
        updateSettings({
          googleDrive: {
            ...settings.googleDrive,
            accessToken: tokenResponse.access_token,
            isConnected: true
          }
        });
        const manager = new DriveManager(tokenResponse.access_token);
        setDriveManager(manager);
        const folderList = await manager.listFolders();
        setFolders(folderList);
        setShowFolderPicker(true);
      } catch (error) {
        console.error('Google login error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
      setIsLoading(false);
    },
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    flow: 'implicit'
  });

  useEffect(() => {
    let stopWatcher = null;
    if (driveManager && settings.googleDrive?.selectedFolder?.id) {
      driveManager
        .watchFolder(settings.googleDrive.selectedFolder.id, handleNewImages, settings.notifications?.checkInterval || 30000)
        .then(stop => stopWatcher = stop)
        .catch(err => console.error('Failed to start folder watcher', err));
    }
    return () => stopWatcher && stopWatcher();
  }, [driveManager, settings.googleDrive?.selectedFolder?.id, handleNewImages, settings.notifications?.checkInterval]);

  return (
    <>
      <button
        onClick={() => login()}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
      >
        {isLoading ? <FaSpinner className="animate-spin" /> : <FaGoogle />}
        {isLoading ? 'Connecting...' : 'Connect Google Drive'}
      </button>

      <AnimatePresence>
        {showFolderPicker && (
          <GoogleDriveFolderDialog
            folders={folders}
            isLoading={isLoading}
            onDismiss={() => setShowFolderPicker(false)}
            onFolderSelected={handleFolderSelect}
          />
        )}
      </AnimatePresence>

      {showNotification && settings.notifications?.sound && (
        <NotificationSound
          onComplete={() => setShowNotification(false)}
          volume={settings.notifications?.volume || 0.5}
        />
      )}
    </>
  );
}
