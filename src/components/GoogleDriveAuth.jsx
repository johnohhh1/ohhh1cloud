// src/components/GoogleDriveAuth.jsx
// NUCLEAR OPTION: Full service account automation

import React, { useState, useEffect, useCallback } from 'react';
import { FaRobot, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useStore } from '../store';
import { DriveManager } from '../services/driveService';
import { NotificationSound } from './NotificationSound';

const HARDCODED_FOLDER = {
  id: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID,
  name: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_NAME || 'Auto-Sync Folder'
};

export default function GoogleDriveAuth() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastAutoAuth, setLastAutoAuth] = useState(null);
  const [nextAuthTime, setNextAuthTime] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const { updateSettings, addNewImages, settings } = useStore();
  const [driveManager, setDriveManager] = useState(null);

  // Fully automated authentication using service account
  const authenticateWithServiceAccount = useCallback(async () => {
    console.log('🤖 Starting service account authentication...');
    setConnectionStatus('connecting');
    
    try {
      // Call our server-side auth endpoint
      const response = await fetch('/api/google-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Service account auth failed: ${response.status} - ${errorText}`);
      }
      
      const { access_token } = await response.json();
      console.log('🤖 Service account token received');
      
      // Set up drive manager
      const manager = new DriveManager(access_token);
      setDriveManager(manager);
      
      // Auto-load images from hardcoded folder
      const images = await manager.getImagesFromFolder(HARDCODED_FOLDER.id);
      console.log(`🤖 Service account loaded ${images.length} images from ${HARDCODED_FOLDER.name}`);
      
      // Mark new images if any
      const markedImages = images.map(img => ({
        ...img,
        isNew: true,
        source: 'googleDrive'
      }));
      
      addNewImages(markedImages, 'googleDrive');
      
      // Update settings
      updateSettings({
        googleDrive: {
          accessToken: access_token,
          isConnected: true,
          selectedFolder: HARDCODED_FOLDER,
          tokenExpiry: Date.now() + (55 * 60 * 1000),
          lastConnection: Date.now()
        }
      });
      
      setConnectionStatus('connected');
      setLastAutoAuth(new Date());
      setNextAuthTime(new Date(Date.now() + 50 * 60 * 1000)); // Next auth in 50 minutes
      
      // Show notification if enabled
      if (settings.notifications?.enabled && images.length > 0) {
        setShowNotification(true);
      }
      
      console.log('🤖 Service account authentication complete!');
      
    } catch (error) {
      console.error('🚨 Service account auto-auth failed:', error);
      setConnectionStatus('error');
      
      // Retry after 5 minutes on error
      setTimeout(authenticateWithServiceAccount, 5 * 60 * 1000);
    }
  }, [updateSettings, addNewImages, settings.notifications?.enabled]);

  // Handle new images from folder watching
  const handleNewImages = useCallback((newImages) => {
    console.log('🔔 New images detected from service account:', newImages.length);
    
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

  // Auto-authenticate on mount and set up periodic refresh
  useEffect(() => {
    console.log('🤖 Nuclear Google Drive Auth initializing...');
    
    // Immediate authentication
    authenticateWithServiceAccount();
    
    // Re-authenticate every 50 minutes proactively
    const authInterval = setInterval(() => {
      console.log('🔄 Scheduled service account re-authentication');
      authenticateWithServiceAccount();
    }, 50 * 60 * 1000);
    
    return () => {
      clearInterval(authInterval);
      console.log('🤖 Nuclear Google Drive Auth cleanup');
    };
  }, [authenticateWithServiceAccount]);

  // Set up folder watching when we have a connected drive manager
  useEffect(() => {
    let stopWatcher = null;
    
    if (driveManager && connectionStatus === 'connected' && HARDCODED_FOLDER.id) {
      console.log('🔍 Starting folder watch for new images...');
      
      driveManager
        .watchFolder(
          HARDCODED_FOLDER.id,
          handleNewImages,
          settings.notifications?.checkInterval || 30000
        )
        .then(stop => {
          stopWatcher = stop;
          console.log('👀 Folder watching active');
        })
        .catch(err => {
          console.error('Failed to start folder watcher:', err);
        });
    }
    
    return () => {
      if (stopWatcher) {
        stopWatcher();
        console.log('🛑 Stopped folder watching');
      }
    };
  }, [driveManager, connectionStatus, handleNewImages, settings.notifications?.checkInterval]);

  // Emergency manual retry (fallback only)
  const handleManualRetry = () => {
    console.log('🔧 Manual retry triggered');
    authenticateWithServiceAccount();
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
        return <FaRobot className="text-purple-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return `🤖 Auto-Connected ${lastAutoAuth ? lastAutoAuth.toLocaleTimeString() : ''}`;
      case 'connecting':
        return '🔄 Auto-Authenticating...';
      case 'error':
        return '❌ Auto-Auth Failed';
      default:
        return '🤖 Service Account Ready';
    }
  };

  return (
    <>
      <div className="w-full space-y-2">
        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-purple-600 text-white">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        
        {connectionStatus === 'connected' && (
          <div className="text-xs text-gray-400 bg-gray-800 rounded p-2">
            <div>🤖 Fully automated with service account</div>
            <div>📁 Folder: {HARDCODED_FOLDER.name}</div>
            <div>🆔 ID: {HARDCODED_FOLDER.id}</div>
            {nextAuthTime && (
              <div>🔄 Next auth: {nextAuthTime.toLocaleTimeString()}</div>
            )}
            <div>⚡ Zero manual intervention required</div>
          </div>
        )}
        
        {connectionStatus === 'error' && (
          <div className="text-xs space-y-2">
            <div className="text-red-400 bg-red-900/20 rounded p-2">
              🚨 Service account authentication failed. Retrying automatically in 5 minutes...
            </div>
            <button
              onClick={handleManualRetry}
              className="w-full text-xs py-1 px-2 bg-red-600 hover:bg-red-700 rounded transition"
            >
              🔧 Force Retry Now
            </button>
          </div>
        )}
      </div>

      {/* Notification sound */}
      {showNotification && settings.notifications?.sound && (
        <NotificationSound
          onComplete={() => setShowNotification(false)}
          volume={settings.notifications?.volume || 0.5}
        />
      )}
    </>
  );
}
