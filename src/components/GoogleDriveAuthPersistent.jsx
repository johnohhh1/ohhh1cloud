// src/components/GoogleDriveAuthPersistent.jsx
// This component runs at the app level, not just in settings

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store';
import { DriveManager } from '../services/driveService';

const HARDCODED_FOLDER = {
  id: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID,
  name: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_NAME || 'Auto-Sync Folder'
};

export default function GoogleDriveAuthPersistent() {
  const [driveManager, setDriveManager] = useState(null);
  const [authInterval, setAuthInterval] = useState(null);
  const [watchInterval, setWatchInterval] = useState(null);
  const { updateSettings, addNewImages, settings } = useStore();

  // Fully automated authentication using service account
  const authenticateWithServiceAccount = useCallback(async () => {
    console.log('🤖 Nuclear Google Drive Auth initializing...');
    console.log('🤖 Starting service account authentication...');
    
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
      
      // Query for images
      const apiResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?` +
        `q='${HARDCODED_FOLDER.id}' in parents and mimeType contains 'image/' and trashed = false` +
        `&fields=files(id,name,mimeType,modifiedTime,size)` +
        `&pageSize=1000`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        }
      );

      if (!apiResponse.ok) {
        throw new Error(`Failed to fetch images: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      console.log(`Found ${data.files?.length || 0} images in folder ${HARDCODED_FOLDER.id}`);

      // Set up drive manager
      const manager = new DriveManager(access_token);
      setDriveManager(manager);
      
      // Process images
      const images = (data.files || []).map(file => ({
        id: file.id,
        name: file.name,
        url: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
        thumbnail: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
        source: 'googleDrive',
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        size: file.size,
        isNew: false
      }));
      
      console.log(`🤖 Service account loaded ${images.length} images from ${HARDCODED_FOLDER.name}`);
      
      // Add images
      if (images.length > 0) {
        addNewImages(images, 'googleDrive');
      }
      
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
      
      console.log('🤖 Service account authentication complete!');
      
    } catch (error) {
      console.error('🚨 Service account auto-auth failed:', error);
      
      // Retry after 5 minutes on error
      setTimeout(authenticateWithServiceAccount, 5 * 60 * 1000);
    }
  }, [updateSettings, addNewImages]);

  // Watch for new images
  const watchFolder = useCallback(async () => {
    if (!settings.googleDrive?.accessToken || !HARDCODED_FOLDER.id) return;
    
    console.log(`Querying for images in folder: ${HARDCODED_FOLDER.id}`);
    
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?` +
        `q='${HARDCODED_FOLDER.id}' in parents and mimeType contains 'image/' and trashed = false` +
        `&fields=files(id,name,mimeType,modifiedTime,size)` +
        `&pageSize=1000` +
        `&orderBy=modifiedTime desc`,
        {
          headers: {
            'Authorization': `Bearer ${settings.googleDrive.accessToken}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Token expired, re-authenticating...');
          authenticateWithServiceAccount();
        }
        return;
      }

      const data = await response.json();
      console.log(`Found ${data.files?.length || 0} images in folder ${HARDCODED_FOLDER.id}`);
      
      // Get current image IDs
      const currentImages = useStore.getState().images;
      const currentIds = new Set(currentImages.map(img => img.id));
      
      // Find new images
      const newImages = (data.files || [])
        .filter(file => !currentIds.has(file.id))
        .map(file => ({
          id: file.id,
          name: file.name,
          url: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
          thumbnail: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
          source: 'googleDrive',
          mimeType: file.mimeType,
          modifiedTime: file.modifiedTime,
          size: file.size,
          isNew: true
        }));
      
      if (newImages.length > 0) {
        console.log(`Found ${newImages.length} new/modified images`);
        console.log('🔔 New images detected from service account:', newImages.length);
        addNewImages(newImages, 'googleDrive');
      }
      
    } catch (error) {
      console.error('Error watching folder:', error);
    }
  }, [settings.googleDrive?.accessToken, addNewImages, authenticateWithServiceAccount]);

  // Initial authentication and setup
  useEffect(() => {
    console.log('🤖 Persistent Google Drive Auth initializing...');
    
    // Immediate authentication
    authenticateWithServiceAccount();
    
    // Re-authenticate every 50 minutes
    const authInt = setInterval(() => {
      console.log('🔄 Scheduled service account re-authentication');
      authenticateWithServiceAccount();
    }, 50 * 60 * 1000);
    
    setAuthInterval(authInt);
    
    return () => {
      if (authInt) clearInterval(authInt);
      console.log('🤖 Persistent Google Drive Auth cleanup');
    };
  }, []);

  // Set up folder watching
  useEffect(() => {
    if (settings.googleDrive?.isConnected && settings.googleDrive?.accessToken) {
      console.log('🔍 Starting folder watch for new images...');
      
      // Watch every 30 seconds
      const watchInt = setInterval(watchFolder, settings.notifications?.checkInterval || 30000);
      setWatchInterval(watchInt);
      
      // Also do an immediate check
      watchFolder();
      
      return () => {
        if (watchInt) clearInterval(watchInt);
        console.log('🛑 Stopped folder watching');
      };
    }
  }, [settings.googleDrive?.isConnected, settings.googleDrive?.accessToken, settings.notifications?.checkInterval, watchFolder]);

  // This component doesn't render anything
  return null;
}