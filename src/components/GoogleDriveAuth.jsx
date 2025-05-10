// src/components/GoogleDriveAuth.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { FaGoogle, FaSpinner } from 'react-icons/fa';
import { useStore } from '../store';
import { DriveManager } from '../services/driveService';
import GoogleDriveFolderDialog from './GoogleDriveFolderDialog';
import { AnimatePresence } from 'framer-motion';
import NotificationSound from './NotificationSound';

// Grab your Client ID from Vite’s env
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
if (!CLIENT_ID) {
  console.warn('⚠️ VITE_GOOGLE_CLIENT_ID is not defined in your .env');
}

function GoogleDriveAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [folders, setFolders] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const { updateSettings, addNewImages, settings } = useStore();
  const [driveManager, setDriveManager] = useState(null);
  const [notify, setNotify] = useState(false);

  const handleFolderSelect = async (folder) => {
    setIsLoading(true);
    try {
      const images = await driveManager.getImagesFromFolder(folder.id);
      addNewImages(images, 'googleDrive');
      updateSettings({
        googleDrive: { isConnected: true, selectedFolder: folder }
      });
      setShowPicker(false);
    } catch (err) {
      console.error('Error loading images:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewImages = useCallback(
    (newImgs) => {
      const marked = newImgs.map(i => ({ ...i, isNew: true, source: 'googleDrive' }));
      addNewImages(marked, 'googleDrive');
      if (settings.notifications?.enabled) setNotify(true);
    },
    [addNewImages, settings.notifications?.enabled]
  );

  const login = useGoogleLogin({
    flow: 'implicit',
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    onSuccess: async (res) => {
      setIsLoading(true);
      try {
        const token = res.access_token;
        const dm = new DriveManager(token);
        setDriveManager(dm);
        const folderList = await dm.listFolders();
        setFolders(folderList);
        setShowPicker(true);
      } catch (err) {
        console.error('Drive init error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (err) => {
      console.error('Login failed:', err);
      setIsLoading(false);
    }
  });

  useEffect(() => {
    let stopFn;
    if (driveManager && settings.googleDrive?.selectedFolder?.id) {
      driveManager
        .watchFolder(settings.googleDrive.selectedFolder.id, handleNewImages, 10_000)
        .then(fn => (stopFn = fn))
        .catch(e => console.error('watchFolder error', e));
    }
    return () => stopFn && stopFn();
  }, [driveManager, settings.googleDrive?.selectedFolder?.id, handleNewImages]);

  return (
    <>
      {!showPicker ? (
        <button onClick={login} className="w-full flex items-center justify-center gap-2">
          {isLoading ? <FaSpinner className="animate-spin" /> : <FaGoogle />}
          {isLoading ? 'Connecting…' : 'Connect Google Drive'}
        </button>
      ) : (
        <AnimatePresence>
          <GoogleDriveFolderDialog
            folders={folders}
            isLoading={isLoading}
            onDismiss={() => setShowPicker(false)}
            onFolderSelected={handleFolderSelect}
          />
        </AnimatePresence>
      )}

      {notify && settings.notifications?.sound && (
        <NotificationSound
          volume={settings.notifications.volume}
          onComplete={() => setNotify(false)}
        />
      )}
    </>
  );
}

export default function GoogleDriveAuthWrapper() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <GoogleDriveAuth />
    </GoogleOAuthProvider>
  );
}
