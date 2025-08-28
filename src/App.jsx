// src/App.jsx

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, getDisplayImageUrl } from './store'
import Settings from './components/Settings'
import Navigation from './components/Navigation'
import { DriveManager } from './services/driveService'
import { FaCog, FaPlay, FaPause } from 'react-icons/fa'

const transitions = {
  // EXISTING TRANSITIONS
  fade: {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 }
  },
  'slide-left': {
    enter: { x: '100%', opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
  },
  'slide-up': {
    enter: { y: '100%', opacity: 0 },
    center: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 }
  },
  'zoom-in': {
    enter: { scale: 0.5, opacity: 0 },
    center: { scale: 1, opacity: 1 },
    exit: { scale: 1.5, opacity: 0 }
  },
  'zoom-out': {
    enter: { scale: 1.5, opacity: 0 },
    center: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 }
  },
  'fade-up': {
    enter: { y: 20, opacity: 0 },
    center: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 }
  },
  'fade-down': {
    enter: { y: -20, opacity: 0 },
    center: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 }
  },
  'push': {
    enter: { x: '100%', opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: '-50%', opacity: 0 }
  },
  
  // 3D TRANSITIONS
  'flip-horizontal': {
    enter: { rotateY: -180, opacity: 0, transformOrigin: 'center' },
    center: { rotateY: 0, opacity: 1, transformOrigin: 'center' },
    exit: { rotateY: 180, opacity: 0, transformOrigin: 'center' }
  },
  'flip-vertical': {
    enter: { rotateX: -180, opacity: 0, transformOrigin: 'center' },
    center: { rotateX: 0, opacity: 1, transformOrigin: 'center' },
    exit: { rotateX: 180, opacity: 0, transformOrigin: 'center' }
  },
  'cube-left': {
    enter: { rotateY: 90, x: '50%', opacity: 0, transformOrigin: 'left center' },
    center: { rotateY: 0, x: 0, opacity: 1, transformOrigin: 'left center' },
    exit: { rotateY: -90, x: '-50%', opacity: 0, transformOrigin: 'left center' }
  },
  'cube-up': {
    enter: { rotateX: 90, y: '50%', opacity: 0, transformOrigin: 'center top' },
    center: { rotateX: 0, y: 0, opacity: 1, transformOrigin: 'center top' },
    exit: { rotateX: -90, y: '-50%', opacity: 0, transformOrigin: 'center top' }
  },
  'carousel': {
    enter: { rotateY: -45, scale: 0.8, x: '100%', opacity: 0 },
    center: { rotateY: 0, scale: 1, x: 0, opacity: 1 },
    exit: { rotateY: 45, scale: 0.8, x: '-100%', opacity: 0 }
  },
  
  // ARTISTIC TRANSITIONS  
  'dissolve': {
    enter: { opacity: 0, filter: 'blur(10px)', scale: 1.1 },
    center: { opacity: 1, filter: 'blur(0px)', scale: 1 },
    exit: { opacity: 0, filter: 'blur(10px)', scale: 0.9 }
  },
  'paint-brush': {
    enter: { opacity: 0, clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)' },
    center: { opacity: 1, clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' },
    exit: { opacity: 0, clipPath: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)' }
  },
  'pixelate': {
    enter: { opacity: 0, filter: 'blur(20px)', scale: 0.8 },
    center: { opacity: 1, filter: 'blur(0px)', scale: 1 },
    exit: { opacity: 0, filter: 'blur(20px)', scale: 1.2 }
  },
  'glitch': {
    enter: { opacity: 0, x: -20, skew: -5 },
    center: { opacity: 1, x: 0, skew: 0 },
    exit: { opacity: 0, x: 20, skew: 5 }
  },
  
  // NATURE-INSPIRED TRANSITIONS
  'wave': {
    enter: { opacity: 0, clipPath: 'polygon(0% 50%, 0% 50%, 0% 50%, 0% 50%)' },
    center: { opacity: 1, clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' },
    exit: { opacity: 0, clipPath: 'polygon(100% 50%, 100% 50%, 100% 50%, 100% 50%)' }
  },
  'ripple': {
    enter: { opacity: 0, scale: 0, borderRadius: '50%' },
    center: { opacity: 1, scale: 1, borderRadius: '0%' },
    exit: { opacity: 0, scale: 2, borderRadius: '50%' }
  },
  'leaf-turn': {
    enter: { opacity: 0, rotateZ: -45, scale: 0.5, transformOrigin: 'top left' },
    center: { opacity: 1, rotateZ: 0, scale: 1, transformOrigin: 'top left' },
    exit: { opacity: 0, rotateZ: 45, scale: 0.5, transformOrigin: 'bottom right' }
  },
  'wind-blow': {
    enter: { opacity: 0, x: -100, skew: -10, filter: 'blur(5px)' },
    center: { opacity: 1, x: 0, skew: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, x: 100, skew: 10, filter: 'blur(5px)' }
  },
  
  // GEOMETRIC TRANSITIONS
  'shatter': {
    enter: { opacity: 0, scale: 0.3, rotate: -30 },
    center: { opacity: 1, scale: 1, rotate: 0 },
    exit: { opacity: 0, scale: 0.3, rotate: 30 }
  },
  'diamond-wipe': {
    enter: { opacity: 0, clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)' },
    center: { opacity: 1, clipPath: 'polygon(0% 50%, 50% 0%, 100% 50%, 50% 100%)' },
    exit: { opacity: 1, clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }
  },
  'kaleidoscope': {
    enter: { opacity: 0, rotate: -180, scale: 0.5, filter: 'hue-rotate(180deg)' },
    center: { opacity: 1, rotate: 0, scale: 1, filter: 'hue-rotate(0deg)' },
    exit: { opacity: 0, rotate: 180, scale: 0.5, filter: 'hue-rotate(-180deg)' }
  },
  'mosaic': {
    enter: { opacity: 0, scale: 0.1, rotate: 45 },
    center: { opacity: 1, scale: 1, rotate: 0 },
    exit: { opacity: 0, scale: 0.1, rotate: -45 }
  },
  
  // CINEMATIC TRANSITIONS
  'film-strip': {
    enter: { opacity: 0, scaleX: 0, transformOrigin: 'left center' },
    center: { opacity: 1, scaleX: 1, transformOrigin: 'left center' },
    exit: { opacity: 0, scaleX: 0, transformOrigin: 'right center' }
  },
  'lens-focus': {
    enter: { opacity: 0, scale: 2, filter: 'blur(20px)' },
    center: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 0.5, filter: 'blur(20px)' }
  },
  'camera-flash': {
    enter: { opacity: 0, scale: 0.8, filter: 'brightness(3) saturate(0)' },
    center: { opacity: 1, scale: 1, filter: 'brightness(1) saturate(1)' },
    exit: { opacity: 0, scale: 1.2, filter: 'brightness(3) saturate(0)' }
  },
  'zoom-blur': {
    enter: { opacity: 0, scale: 0.3, filter: 'blur(10px)' },
    center: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 3, filter: 'blur(10px)' }
  },
  
  // ADVANCED CREATIVE TRANSITIONS  
  'portal': {
    enter: { opacity: 0, scale: 0, rotate: 180, borderRadius: '50%' },
    center: { opacity: 1, scale: 1, rotate: 0, borderRadius: '0%' },
    exit: { opacity: 0, scale: 0, rotate: -180, borderRadius: '50%' }
  },
  'matrix-slide': {
    enter: { opacity: 0, x: '100%', filter: 'hue-rotate(120deg) contrast(1.5)' },
    center: { opacity: 1, x: 0, filter: 'hue-rotate(0deg) contrast(1)' },
    exit: { opacity: 0, x: '-100%', filter: 'hue-rotate(-120deg) contrast(1.5)' }
  },
  'hologram': {
    enter: { opacity: 0, scaleY: 0, filter: 'hue-rotate(180deg)', transformOrigin: 'center bottom' },
    center: { opacity: 1, scaleY: 1, filter: 'hue-rotate(0deg)', transformOrigin: 'center bottom' },
    exit: { opacity: 0, scaleY: 0, filter: 'hue-rotate(-180deg)', transformOrigin: 'center top' }
  },
  'time-warp': {
    enter: { opacity: 0, scale: 0.1, rotate: -360, filter: 'blur(20px)' },
    center: { opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 0.1, rotate: 360, filter: 'blur(20px)' }
  }
}

export default function App() {
  const { 
    currentImage, 
    settings, 
    toggleSettings,
    transitionEffect,
    startSlideshow,
    stopSlideshow,
    slideTimer,
    updateSettings
  } = useStore()

  // Simplified state management
  const [globalError, setGlobalError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugKeySequence, setDebugKeySequence] = useState([]);
  const [lastTokenCheck, setLastTokenCheck] = useState(0);
  
  // Persistent Google Drive connection management
  const driveManagerRef = useRef(null);
  const folderWatcherRef = useRef(null);

  // Get Google Drive token from settings
  const googleDriveToken = settings?.googleDrive?.accessToken;
  const googleDriveConnected = settings?.googleDrive?.isConnected;
  const googleDriveFolder = settings?.googleDrive?.selectedFolder;

  // Remove aggressive token checking that causes false expiration errors
  // The service account tokens are managed by the backend and refreshed automatically

  // Track if we've initialized the service account
  const serviceAccountInitialized = useRef(false);
  const tokenRefreshInterval = useRef(null);

  // Persistent Google Drive Authentication and Connection Management
  useEffect(() => {
    // Prevent duplicate auth attempts
    if (serviceAccountInitialized.current) return;
    
    const HARDCODED_FOLDER = {
      id: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID,
      name: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_NAME || 'Auto-Sync Folder'
    };

    const authenticateWithServiceAccount = async () => {
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
        
        // Set up persistent drive manager
        if (!driveManagerRef.current) {
          const manager = new DriveManager(access_token);
          driveManagerRef.current = manager;
        } else {
          driveManagerRef.current.accessToken = access_token;
        }
        
        // Auto-load images from hardcoded folder if configured
        if (HARDCODED_FOLDER.id) {
          const images = await driveManagerRef.current.getImagesFromFolder(HARDCODED_FOLDER.id);
          console.log(`🤖 Loaded ${images.length} images from ${HARDCODED_FOLDER.name}`);
          
          const markedImages = images.map(img => ({
            ...img,
            isNew: true,
            source: 'googleDrive'
          }));
          
          const { addNewImages } = useStore.getState();
          addNewImages(markedImages, 'googleDrive');
        }
        
        // Update settings to maintain connection state
        updateSettings({
          googleDrive: {
            accessToken: access_token,
            isConnected: true,
            selectedFolder: HARDCODED_FOLDER.id ? HARDCODED_FOLDER : null,
            tokenExpiry: Date.now() + (55 * 60 * 1000),
            lastConnection: Date.now(),
            persistentConnection: true
          }
        });
        
        console.log('🤖 Service account authentication complete!');
        setGlobalError(null);
        return true;
        
      } catch (error) {
        console.error('🚨 Service account auth failed:', error);
        // Don't show error in UI for initial connection attempts
        // The app can still work with manual OAuth
        return false;
      }
    };

    // Try service account authentication if configured
    if (import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || import.meta.env.VITE_USE_SERVICE_ACCOUNT) {
      serviceAccountInitialized.current = true;
      
      // Initial authentication
      authenticateWithServiceAccount();
      
      // Set up token refresh every 58 minutes (tokens last 60 minutes)
      tokenRefreshInterval.current = setInterval(() => {
        console.log('🔄 Refreshing service account token...');
        authenticateWithServiceAccount();
      }, 58 * 60 * 1000);
    }
    
    // Cleanup function
    return () => {
      if (tokenRefreshInterval.current) {
        clearInterval(tokenRefreshInterval.current);
      }
    };
  }, []); // Empty dependency array - run only once

  // Maintain existing token-based connection
  useEffect(() => {
    if (googleDriveToken && googleDriveConnected) {
      if (!driveManagerRef.current) {
        console.log('🔗 Setting up DriveManager with existing token');
        const manager = new DriveManager(googleDriveToken);
        driveManagerRef.current = manager;
      } else if (driveManagerRef.current.accessToken !== googleDriveToken) {
        console.log('🔄 Updating DriveManager token');
        driveManagerRef.current.accessToken = googleDriveToken;
      }
    }
  }, [googleDriveToken, googleDriveConnected]);

  // Persistent Folder Watching Management  
  useEffect(() => {
    const setupFolderWatching = async () => {
      // Clear existing watcher if any
      if (folderWatcherRef.current) {
        folderWatcherRef.current();
        folderWatcherRef.current = null;
      }

      if (driveManagerRef.current && googleDriveConnected && googleDriveFolder?.id) {
        console.log('🔍 Starting persistent folder watch for:', googleDriveFolder.name);
        
        try {
          const handleNewImages = (newImages) => {
            console.log('🔔 New images detected:', newImages.length);
            
            const markedImages = newImages.map(img => ({
              ...img,
              isNew: true,
              source: 'googleDrive'
            }));
            
            const { addNewImages } = useStore.getState();
            addNewImages(markedImages, 'googleDrive');
          };

          const stopWatcher = await driveManagerRef.current.watchFolder(
            googleDriveFolder.id,
            handleNewImages,
            settings.notifications?.checkInterval || 30000
          );
          
          folderWatcherRef.current = stopWatcher;
          console.log('👀 Folder watching active - persists when settings close');
          
        } catch (err) {
          console.error('Failed to start folder watcher:', err);
        }
      }
    };

    // Small delay to ensure connection is established
    const timeoutId = setTimeout(setupFolderWatching, 100);

    return () => {
      clearTimeout(timeoutId);
      // Don't cleanup watcher here - keep it running
    };
  }, [googleDriveConnected, googleDriveFolder?.id, settings.notifications?.checkInterval]);

  // Cleanup only on app unmount or disconnection
  useEffect(() => {
    return () => {
      // This cleanup runs when connection is lost or app unmounts
      if (!googleDriveConnected && folderWatcherRef.current) {
        folderWatcherRef.current();
        folderWatcherRef.current = null;
        console.log('🛑 Stopped folder watching - connection lost');
      }
    };
  }, [googleDriveConnected]);

  // Debug mode activation (unchanged)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const newSequence = [...debugKeySequence, key];
      
      if (e.ctrlKey && e.shiftKey) {
        if ('debug'.startsWith(newSequence.join(''))) {
          setDebugKeySequence(newSequence);
          if (newSequence.join('') === 'debug') {
            setShowDebug(prev => !prev);
            setDebugKeySequence([]);
          }
        } else {
          setDebugKeySequence([]);
        }
      } else {
        setDebugKeySequence([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debugKeySequence]);

  // Clear debug sequence after 3 seconds
  useEffect(() => {
    if (debugKeySequence.length > 0) {
      const timeout = setTimeout(() => setDebugKeySequence([]), 3000);
      return () => clearTimeout(timeout);
    }
  }, [debugKeySequence]);

  // Slideshow management
  useEffect(() => {
    if (settings.interval) {
      startSlideshow()
      return () => stopSlideshow()
    }
  }, [settings.interval, settings.transition])

  // Enhanced error detection for Google Drive
  useEffect(() => {
    if (currentImage && (currentImage.source === 'googleDrive' || (currentImage.url && currentImage.url.includes('googleapis.com/drive/v3/files')))) {
      if (!googleDriveToken) {
        setGlobalError('Google Drive access token is missing or expired. Please reconnect Google Drive.');
      } else {
        setGlobalError(null);
      }
    } else {
      setGlobalError(null);
    }
  }, [currentImage, googleDriveToken]);

  // Simple error handler
  const handleImgError = (e) => {
    if (e?.target?.src && e.target.src.includes('/api/gdrive-proxy')) {
      setGlobalError('Failed to load image from Google Drive. Please check your connection.');
    }
  };

  const displayUrl = getDisplayImageUrl(currentImage, googleDriveToken);

  // Manual reconnect handler
  const handleReconnect = () => {
    updateSettings({
      googleDrive: {
        ...settings.googleDrive,
        accessToken: null,
        isConnected: false,
        selectedFolder: null
      }
    });
    setGlobalError(null);
    updateSettings({ isOpen: true });
  };

  // Auto-dismiss errors after 10 seconds
  useEffect(() => {
    if (globalError) {
      const timer = setTimeout(() => setGlobalError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [globalError]);

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden relative">
      {/* Simple error banner */}
      {globalError && (
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className="fixed top-0 left-0 w-full bg-red-700 text-white text-center py-4 z-50"
        >
          <div className="flex items-center justify-center gap-4">
            <span><b>Error:</b> {globalError}</span>
            {globalError.includes('Google Drive') && (
              <button 
                onClick={handleReconnect} 
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-800 transition-colors"
              >
                Reconnect
              </button>
            )}
            <button 
              onClick={() => setGlobalError(null)}
              className="px-3 py-1 text-sm hover:bg-red-800 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}

      {/* Lightweight debug panel */}
      {showDebug && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg shadow-lg text-xs max-w-md"
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold">Debug Info</h4>
            <button 
              onClick={() => setShowDebug(false)}
              className="hover:bg-white/20 px-2 py-1 rounded"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 break-all">
            <div><b>Google Drive Token:</b> {googleDriveToken ? 'Connected' : 'None'}</div>
            <div><b>Current Image URL:</b> {displayUrl}</div>
            <div><b>Current Image Source:</b> {currentImage?.source || 'None'}</div>
            <div><b>Last Error:</b> {globalError || 'None'}</div>
            <div><b>Images Count:</b> {useStore.getState().images.length}</div>
            <div><b>Last Token Check:</b> {lastTokenCheck ? new Date(lastTokenCheck).toLocaleTimeString() : 'Never'}</div>
          </div>
          <div className="mt-2 text-gray-400">
            Tip: Use Ctrl+Shift+D+E+B+U+G to toggle debug mode
          </div>
        </motion.div>
      )}

      {/* Blurred background */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
        style={{ backgroundImage: `url(${displayUrl})` }}
      />
      
      {/* Main image display */}
      <div className="slideshow-container">
        <AnimatePresence mode="wait" initial={false} custom={transitionEffect}>
          <motion.img
            key={displayUrl}
            src={displayUrl}
            onError={handleImgError}
            custom={transitionEffect}
            variants={transitions[settings.transition] || transitions.fade}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: settings.transitionDuration || 0.8,
              type: settings.transition?.includes('3d') || settings.transition?.includes('flip') || settings.transition?.includes('cube') || settings.transition?.includes('carousel') ? "spring" : "tween",
              stiffness: 200,
              damping: 20,
              opacity: { duration: settings.transitionDuration ? settings.transitionDuration * 0.6 : 0.5 },
              filter: { duration: settings.transitionDuration || 0.8 },
              clipPath: { duration: settings.transitionDuration || 0.8, ease: "easeInOut" },
              borderRadius: { duration: settings.transitionDuration || 0.8, ease: "easeInOut" }
            }}
            className="absolute inset-0 w-full h-full object-contain transition-gpu"
            style={{
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden'
            }}
          />
        </AnimatePresence>
      </div>

      {/* Control buttons */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={slideTimer ? stopSlideshow : startSlideshow}
          className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          aria-label={slideTimer ? "Pause slideshow" : "Start slideshow"}
        >
          {slideTimer ? <FaPause className="w-6 h-6" /> : <FaPlay className="w-6 h-6" />}
        </button>
        <button
          onClick={toggleSettings}
          className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          aria-label="Open settings"
        >
          <FaCog className="w-6 h-6" />
        </button>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {settings.isOpen && <Settings />}
      </AnimatePresence>
      
      {/* Navigation */}
      <Navigation />
    </div>
  )
}
