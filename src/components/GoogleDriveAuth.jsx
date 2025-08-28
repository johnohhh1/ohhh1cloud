// src/components/GoogleDriveAuth.jsx
// Simplified status display - connection managed by App.jsx

import React, { useState } from 'react';
import { FaRobot, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useStore } from '../store';
import { NotificationSound } from './NotificationSound';

const HARDCODED_FOLDER = {
  id: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID,
  name: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_NAME || 'Auto-Sync Folder'
};

export default function GoogleDriveAuth() {
  const [showNotification, setShowNotification] = useState(false);
  const { settings } = useStore();

  // Status derived from persistent connection in App.jsx
  const connectionStatus = settings.googleDrive?.isConnected ? 'connected' : 'disconnected';
  const lastConnection = settings.googleDrive?.lastConnection;
  const isPersistent = settings.googleDrive?.persistentConnection;

  // Test notification handler
  const handleTestNotification = () => {
    if (settings.notifications?.enabled) {
      setShowNotification(true);
    }
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
        return `🤖 Auto-Connected ${lastConnection ? new Date(lastConnection).toLocaleTimeString() : ''}`;
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
            <div>🤖 {isPersistent ? 'Persistent connection active' : 'Connection managed by app'}</div>
            <div>📁 Folder: {settings.googleDrive?.selectedFolder?.name || HARDCODED_FOLDER.name}</div>
            <div>🆔 ID: {settings.googleDrive?.selectedFolder?.id || HARDCODED_FOLDER.id}</div>
            <div className="text-green-400">✅ Stays connected when settings close</div>
            <div className="mt-1 text-yellow-400">🔄 Auto-refreshes token every 50 minutes</div>
            <button
              onClick={handleTestNotification}
              className="mt-2 w-full text-xs py-1 px-2 bg-blue-600 hover:bg-blue-700 rounded transition"
            >
              🔔 Test Notification
            </button>
          </div>
        )}
        
        {connectionStatus === 'disconnected' && (
          <div className="text-xs space-y-2">
            <div className="text-yellow-400 bg-yellow-900/20 rounded p-2">
              🤖 Connection managed automatically by the app. Check environment variables if not connecting.
            </div>
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
