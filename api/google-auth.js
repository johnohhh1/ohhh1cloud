// api/google-auth.js - Server-side auth endpoint
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { GoogleAuth } = await import('google-auth-library');
    
    const auth = new GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    res.status(200).json({ 
      access_token: accessToken.token,
      expires_in: 3600 
    });
  } catch (error) {
    console.error('Service account auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Modified GoogleDriveAuth.jsx - Fully automated
import React, { useState, useEffect } from 'react';
import { FaRobot, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useStore } from '../store';
import { DriveManager } from '../services/driveService';

const HARDCODED_FOLDER = {
  id: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID,
  name: 'Auto-Sync Folder'
};

export default function GoogleDriveAuth() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastAutoAuth, setLastAutoAuth] = useState(null);
  const { updateSettings, addNewImages, settings } = useStore();
  const [driveManager, setDriveManager] = useState(null);

  // Fully automated authentication
  const authenticateWithServiceAccount = async () => {
    setConnectionStatus('connecting');
    
    try {
      // Call our server-side auth endpoint
      const response = await fetch('/api/google-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Service account auth failed');
      
      const { access_token } = await response.json();
      
      // Set up drive manager
      const manager = new DriveManager(access_token);
      setDriveManager(manager);
      
      // Auto-load images
      const images = await manager.getImagesFromFolder(HARDCODED_FOLDER.id);
      console.log(`Service account loaded ${images.length} images`);
      
      addNewImages(images, 'googleDrive');
      
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
      
    } catch (error) {
      console.error('Auto-auth failed:', error);
      setConnectionStatus('error');
    }
  };

  // Auto-authenticate on mount and periodically
  useEffect(() => {
    authenticateWithServiceAccount();
    
    // Re-authenticate every 50 minutes proactively
    const interval = setInterval(authenticateWithServiceAccount, 50 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Emergency manual retry
  const handleManualRetry = () => {
    authenticateWithServiceAccount();
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <FaCheckCircle className="text-green-500" />;
      case 'connecting': return <FaSpinner className="animate-spin text-blue-500" />;
      case 'error': return <FaExclamationTriangle className="text-red-500" />;
      default: return <FaRobot />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return `🤖 Auto-Connected ${lastAutoAuth ? lastAutoAuth.toLocaleTimeString() : ''}`;
      case 'connecting': return '🔄 Auto-Authenticating...';
      case 'error': return '❌ Auto-Auth Failed';
      default: return '🤖 Service Account Ready';
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-purple-600 text-white">
        {getStatusIcon()}
        <span className="text-sm">{getStatusText()}</span>
      </div>
      
      {connectionStatus === 'connected' && (
        <div className="text-xs text-gray-400 bg-gray-800 rounded p-2">
          <div>🤖 Fully automated with service account</div>
          <div>📁 Folder: {HARDCODED_FOLDER.name}</div>
          <div>🔄 Next auth: {new Date(Date.now() + 50*60*1000).toLocaleTimeString()}</div>
        </div>
      )}
      
      {connectionStatus === 'error' && (
        <button
          onClick={handleManualRetry}
          className="w-full text-xs py-1 px-2 bg-red-600 hover:bg-red-700 rounded transition"
        >
          Retry Auto-Auth
        </button>
      )}
    </div>
  );
}

