// Modified GoogleDriveAuth.jsx - Skip folder picker
import React, { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { FaGoogle, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useStore } from '../store';
import { DriveManager } from '../services/driveService';

// Get hardcoded folder from environment
const HARDCODED_FOLDER = {
  id: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID,
  name: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_NAME || 'Default Folder'
};

export default function GoogleDriveAuth() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const { updateSettings, addNewImages, settings } = useStore();
  const [driveManager, setDriveManager] = useState(null);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setConnectionStatus('connecting');
      
      try {
        // Set up drive manager
        const manager = new DriveManager(tokenResponse.access_token);
        setDriveManager(manager);
        
        // Immediately load images from hardcoded folder
        const images = await manager.getImagesFromFolder(HARDCODED_FOLDER.id);
        console.log(`Auto-loaded ${images.length} images from ${HARDCODED_FOLDER.name}`);
        
        addNewImages(images, 'googleDrive');
        
        // Update settings with hardcoded folder
        updateSettings({
          googleDrive: {
            accessToken: tokenResponse.access_token,
            isConnected: true,
            selectedFolder: HARDCODED_FOLDER,
            tokenExpiry: Date.now() + (55 * 60 * 1000),
            lastConnection: Date.now()
          }
        });
        
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Auto-setup failed:', error);
        setConnectionStatus('error');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
      setConnectionStatus('error');
      setIsLoading(false);
    },
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    flow: 'implicit'
  });

  // Auto-reconnect when component mounts if we have stored token
  useEffect(() => {
    const storedToken = settings?.googleDrive?.accessToken;
    if (storedToken && !driveManager) {
      setConnectionStatus('connecting');
      const manager = new DriveManager(storedToken);
      setDriveManager(manager);
      setConnectionStatus('connected');
    }
  }, [settings?.googleDrive?.accessToken]);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <FaCheckCircle className="text-green-500" />;
      case 'connecting': return <FaSpinner className="animate-spin text-blue-500" />;
      case 'error': return <FaExclamationTriangle className="text-red-500" />;
      default: return <FaGoogle />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return `Connected to ${HARDCODED_FOLDER.name}`;
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Connect Google Drive';
    }
  };

  return (
    <div className="w-full space-y-2">
      <button
        onClick={() => login()}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition"
      >
        {getStatusIcon()}
        {getStatusText()}
      </button>
      
      {connectionStatus === 'connected' && (
        <div className="text-xs text-gray-400 bg-gray-800 rounded p-2">
          <div>✓ Auto-connected to: {HARDCODED_FOLDER.name}</div>
          <div>Folder ID: {HARDCODED_FOLDER.id}</div>
        </div>
      )}
    </div>
  );
}
