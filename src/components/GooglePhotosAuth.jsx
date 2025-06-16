// src/components/GooglePhotosAuth.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { FaGoogle, FaSpinner } from 'react-icons/fa';
import { AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { GooglePhotosManager } from '../services/googlePhotosService';
import GooglePhotosAlbumDialog from './GooglePhotosAlbumDialog';
import { NotificationSound } from './NotificationSound';

const GOOGLE_PHOTOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_PHOTOS_CLIENT_ID;

export default function GooglePhotosAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [photosManager, setPhotosManager] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  const { updateSettings, addNewImages, settings } = useStore();

  const handleAlbumSelect = async (album) => {
    setIsLoading(true);
    try {
      const images = await photosManager.getAlbumPhotos(album.id);
      addNewImages(images.map(img => ({ ...img, isNew: true })), 'googlePhotos');
      updateSettings({
        googlePhotos: {
          ...settings.googlePhotos,
          isConnected: true,
          selectedAlbum: album
        }
      });
      setShowAlbumPicker(false);
    } catch (e) {
      console.error('Error loading Google Photos:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewImages = useCallback((newImages) => {
    addNewImages(newImages.map(img => ({ ...img, isNew: true })), 'googlePhotos');
    if (settings.notifications?.enabled) {
      setShowNotification(true);
    }
  }, [settings.notifications?.enabled, addNewImages]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const manager = new GooglePhotosManager(tokenResponse.access_token);
        setPhotosManager(manager);
        updateSettings({
          googlePhotos: {
            ...settings.googlePhotos,
            accessToken: tokenResponse.access_token,
            isConnected: true
          }
        });
        const albumList = await manager.listAlbums();
        setAlbums(albumList);
        setShowAlbumPicker(true);
      } catch (error) {
        console.error('Google Photos login error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google Photos login failed:', error);
      setIsLoading(false);
    },
    scope: 'https://www.googleapis.com/auth/photoslibrary.readonly',
    flow: 'implicit',
    clientId: GOOGLE_PHOTOS_CLIENT_ID
  });

  useEffect(() => {
    let stopWatcher = null;
    if (photosManager && settings.googlePhotos?.selectedAlbum?.id) {
      photosManager
        .watchAlbum(
          settings.googlePhotos.selectedAlbum.id,
          handleNewImages,
          settings.notifications?.checkInterval || 30000
        )
        .then(stop => (stopWatcher = stop))
        .catch(err => console.error('Failed to watch album', err));
    }
    return () => stopWatcher && stopWatcher();
  }, [photosManager, settings.googlePhotos?.selectedAlbum?.id, handleNewImages, settings.notifications?.checkInterval]);

  return (
    <>
      <button
        onClick={() => login()}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
      >
        {isLoading ? <FaSpinner className="animate-spin" /> : <FaGoogle />}
        {isLoading ? 'Connecting...' : 'Connect Google Photos'}
      </button>

      <AnimatePresence>
        {showAlbumPicker && (
          <GooglePhotosAlbumDialog
            albums={albums}
            isLoading={isLoading}
            onDismiss={() => setShowAlbumPicker(false)}
            onAlbumSelected={handleAlbumSelect}
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
