// src/App.jsx

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, getDisplayImageUrl } from './store'
import Settings from './components/Settings'
import Navigation from './components/Navigation'
import { FaCog, FaPlay, FaPause } from 'react-icons/fa'

const transitions = {
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

  // Get Google Drive token from settings
  const googleDriveToken = settings?.googleDrive?.accessToken;

  // Simplified, less aggressive token checking
  useEffect(() => {
    const checkTokenHealth = async () => {
      if (!googleDriveToken) return;
      
      // Only check every 5 minutes to avoid performance issues
      const now = Date.now();
      if (now - lastTokenCheck < 5 * 60 * 1000) return;
      
      try {
        const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
          headers: { 'Authorization': `Bearer ${googleDriveToken}` }
        });

        if (response.status === 401) {
          console.log('Google Drive token expired');
          updateSettings({
            googleDrive: {
              ...settings.googleDrive,
              accessToken: null,
              isConnected: false
            }
          });
          setGlobalError('Google Drive session expired. Please reconnect.');
        } else if (response.ok) {
          setGlobalError(null);
        }
        
        setLastTokenCheck(now);
      } catch (error) {
        console.error('Token health check failed:', error);
      }
    };

    // Only run health checks every 5 minutes (instead of 2)
    const healthCheckInterval = setInterval(checkTokenHealth, 5 * 60 * 1000);
    
    // Initial check (but throttled)
    checkTokenHealth();

    return () => clearInterval(healthCheckInterval);
  }, [googleDriveToken, settings.googleDrive, updateSettings, lastTokenCheck]);

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
            type: "spring",
            stiffness: 200,
            damping: 20,
            opacity: { duration: 0.5 }
          }}
          className="absolute inset-0 w-full h-full object-contain"
        />
      </AnimatePresence>

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
