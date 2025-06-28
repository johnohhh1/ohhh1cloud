// src/components/GoogleDriveAuth.jsx

  import React, { useState, useEffect, useCallback } from 'react';
  import { useGoogleLogin } from '@react-oauth/google';
  import { FaGoogle, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
  import { AnimatePresence, motion } from 'framer-motion';
  import { useStore } from '../store';
  import { DriveManager } from '../services/driveService';
  import { GoogleDriveFolderDialog } from './GoogleDriveFolderDialog';
  import { NotificationSound } from './NotificationSound';

  export default function GoogleDriveAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [folders, setFolders] = useState([]);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [lastHealthCheck, setLastHealthCheck] = useState(null);
  const { updateSettings, addNewImages, settings } = useStore();
  const [driveManager, setDriveManager] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  // Monitor connection health
  useEffect(() => {
    const checkTokenHealth = async () => {
      if (!accessToken) {
        setConnectionStatus('disconnected');
        return;
      }

      try {
        const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          setConnectionStatus('connected');
          setLastHealthCheck(new Date().toLocaleTimeString());
        } else if (response.status === 401) {
          console.log('Google Drive token expired during health check');
          setConnectionStatus('error');
          handleTokenExpiry();
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        console.error('Health check failed:', error);
        setConnectionStatus('error');
      }
    };

    // Initial health check
    if (accessToken) {
      checkTokenHealth();
    }

    // Regular health checks every 5 minutes
    const healthInterval = setInterval(checkTokenHealth, 5 * 60 * 1000);

    return () => clearInterval(healthInterval);
  }, [accessToken]);

  // Get stored token on component mount
  useEffect(() => {
    const storedToken = settings?.googleDrive?.accessToken;
    if (storedToken && storedToken !== accessToken) {
      setAccessToken(storedToken);
      setConnectionStatus('connecting');
      const manager = new DriveManager(storedToken);
      setDriveManager(manager);
    }
  }, [settings?.googleDrive?.accessToken]);

  const handleTokenExpiry = useCallback(() => {
    console.log('Handling Google Drive token expiry');
    setAccessToken(null);
    setDriveManager(null);
    setConnectionStatus('disconnected');
    
    updateSettings({
      googleDrive: {
        ...settings.googleDrive,
        accessToken: null,
        isConnected: false
      }
    });
  }, [settings.googleDrive, updateSettings]);

  const handleFolderSelect = async (folder) => {
    setIsLoading(true);
    try {
      const images = await driveManager.getImagesFromFolder(folder.id);
      addNewImages(images, 'googleDrive');
      updateSettings({
        googleDrive: {
          ...settings.googleDrive,
          isConnected: true,
          selectedFolder: folder
        }
      });
      setShowFolderPicker(false);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error loading images:', error);
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        handleTokenExpiry();
      }
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
      setConnectionStatus('connecting');
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
        
        // Test the connection first
        const testResponse = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
          headers: {
            'Authorization': `Bearer ${tokenResponse.access_token}`
          }
        });

        if (!testResponse.ok) {
          throw new Error('Failed to verify Google Drive connection');
        }

        const folderList = await manager.listFolders();
        setFolders(folderList);
        setShowFolderPicker(true);
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Google login error:', error);
        setConnectionStatus('error');
        handleTokenExpiry();
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
      setIsLoading(false);
      setConnectionStatus('error');
    },
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    flow: 'implicit'
  });

  // Enhanced folder watcher with better error handling
  useEffect(() => {
    let stopWatcher = null;
    if (driveManager && settings.googleDrive?.selectedFolder?.id && connectionStatus === 'connected') {
      driveManager
        .watchFolder(
          settings.googleDrive.selectedFolder.id, 
          handleNewImages, 
          settings.notifications?.checkInterval || 30000
        )
        .then(stop => stopWatcher = stop)
        .catch(err => {
          console.error('Failed to start folder watcher', err);
          if (err.message.includes('401')) {
            handleTokenExpiry();
          }
        });
    }
    return () => stopWatcher && stopWatcher();
  }, [driveManager, settings.googleDrive?.selectedFolder?.id, handleNewImages, settings.notifications?.checkInterval, connectionStatus]);

  const handleDisconnect = () => {
    setAccessToken(null);
    setDriveManager(null);
    setConnectionStatus('disconnected');
    setShowFolderPicker(false);
    updateSettings({
      googleDrive: {
        isConnected: false,
        accessToken: null,
        selectedFolder: null
      }
    });
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <FaCheckCircle className="text-green-500" />;
      case 'connecting':
        return <FaSpinner className="animate-spin text-blue-500" />;
      case 'error':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaGoogle />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return `Connected${settings.googleDrive?.selectedFolder ? ` • ${settings.googleDrive.selectedFolder.name}` : ''}`;
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Connect Google Drive';
    }
  };

  const isConnected = connectionStatus === 'connected' && settings.googleDrive?.isConnected;

  return (
    <>
      <div className="w-full space-y-2">
        <button
          onClick={isConnected ? handleDisconnect : () => login()}
          disabled={isLoading || connectionStatus === 'connecting'}
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md transition ${
            isConnected 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {getStatusIcon()}
          {getStatusText()}
        </button>

        {/* Connection status details */}
        {(isConnected || connectionStatus === 'error') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-gray-400 bg-gray-800 rounded p-2"
          >
            {isConnected && (
              <>
                <div>Status: Connected ✓</div>
                {lastHealthCheck && <div>Last check: {lastHealthCheck}</div>}
                {settings.googleDrive?.selectedFolder && (
                  <div>Folder: {settings.googleDrive.selectedFolder.name}</div>
                )}
              </>
            )}
            {connectionStatus === 'error' && (
              <>
                <div className="text-red-400">Connection lost or expired</div>
                <div>Click "Connect Google Drive" to reconnect</div>
              </>
            )}
          </motion.div>
        )}
      </div>

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
