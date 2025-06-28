// src/App.jsx

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, getDisplayImageUrl } from './store'
import Settings from './components/Settings'
import Navigation from './components/Navigation'
import { FaCog, FaPlay, FaPause, FaSpinner } from 'react-icons/fa'

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

  // Enhanced connection state management
  const [connectionState, setConnectionState] = useState('connected'); // connected, reconnecting, failed
  const [autoReconnectAttempts, setAutoReconnectAttempts] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [debugKeySequence, setDebugKeySequence] = useState([]);
  const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState(Date.now());
  const [isAutoReconnecting, setIsAutoReconnecting] = useState(false);

  // Get Google Drive token from settings
  const googleDriveToken = settings?.googleDrive?.accessToken;
  const hasGoogleDriveImages = settings?.googleDrive?.isConnected;

  // Auto-reconnection system
  const triggerAutoReconnect = async () => {
    if (isAutoReconnecting || autoReconnectAttempts >= 3) {
      return;
    }

    setIsAutoReconnecting(true);
    setConnectionState('reconnecting');
    setAutoReconnectAttempts(prev => prev + 1);

    try {
      // Trigger the Google OAuth flow programmatically
      const { useGoogleLogin } = await import('@react-oauth/google');
      
      // Create a promise-based login
      const loginPromise = new Promise((resolve, reject) => {
        const login = useGoogleLogin({
          onSuccess: (tokenResponse) => {
            console.log('Auto-reconnect successful');
            updateSettings({
              googleDrive: {
                ...settings.googleDrive,
                accessToken: tokenResponse.access_token,
                isConnected: true,
                tokenExpiry: Date.now() + (55 * 60 * 1000),
                lastConnection: Date.now()
              }
            });
            setConnectionState('connected');
            setAutoReconnectAttempts(0);
            setLastSuccessfulConnection(Date.now());
            setIsAutoReconnecting(false);
            resolve(tokenResponse);
          },
          onError: (error) => {
            console.error('Auto-reconnect failed:', error);
            setConnectionState('failed');
            setIsAutoReconnecting(false);
            reject(error);
          },
          scope: 'https://www.googleapis.com/auth/drive.readonly',
          flow: 'implicit'
        });
        
        // Automatically trigger the login
        setTimeout(() => login(), 1000);
      });

      await loginPromise;
    } catch (error) {
      console.error('Auto-reconnection failed:', error);
      setConnectionState('failed');
      setIsAutoReconnecting(false);
      
      // Retry after delay if we haven't hit max attempts
      if (autoReconnectAttempts < 3) {
        setTimeout(() => {
          triggerAutoReconnect();
        }, 30000 * autoReconnectAttempts); // Exponential backoff: 30s, 60s, 90s
      }
    }
  };

  // Enhanced token health monitoring
  useEffect(() => {
    const checkTokenHealth = async () => {
      if (!googleDriveToken || !hasGoogleDriveImages) return;

      try {
        const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
          headers: {
            'Authorization': `Bearer ${googleDriveToken}`
          }
        });

        if (response.status === 401) {
          console.log('Token expired, triggering auto-reconnect...');
          triggerAutoReconnect();
        } else if (response.ok) {
          setConnectionState('connected');
          setAutoReconnectAttempts(0);
          setLastSuccessfulConnection(Date.now());
        }
      } catch (error) {
        console.error('Token health check failed:', error);
        // Don't immediately fail - could be temporary network issue
        const timeSinceLastSuccess = Date.now() - lastSuccessfulConnection;
        if (timeSinceLastSuccess > 10 * 60 * 1000) { // 10 minutes
          triggerAutoReconnect();
        }
      }
    };

    // More frequent health checks
    const healthCheckInterval = setInterval(checkTokenHealth, 2 * 60 * 1000); // Every 2 minutes
    
    // Initial check
    checkTokenHealth();

    return () => clearInterval(healthCheckInterval);
  }, [googleDriveToken, hasGoogleDriveImages, lastSuccessfulConnection, autoReconnectAttempts]);

  // Preemptive token refresh (before expiry)
  useEffect(() => {
    if (!settings.googleDrive?.tokenExpiry) return;

    const timeUntilExpiry = settings.googleDrive.tokenExpiry - Date.now();
    const refreshTime = Math.max(timeUntilExpiry - (10 * 60 * 1000), 60000); // Refresh 10 min before expiry, but at least in 1 min

    if (refreshTime > 0) {
      const refreshTimer = setTimeout(() => {
        console.log('Preemptively refreshing token before expiry...');
        triggerAutoReconnect();
      }, refreshTime);

      return () => clearTimeout(refreshTimer);
    }
  }, [settings.googleDrive?.tokenExpiry]);

  // Debug mode activation via key sequence
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

  // Clear debug sequence after 3 seconds of inactivity
  useEffect(() => {
    if (debugKeySequence.length > 0) {
      const timeout = setTimeout(() => setDebugKeySequence([]), 3000);
      return () => clearTimeout(timeout);
    }
  }, [debugKeySequence]);

  useEffect(() => {
    if (settings.interval) {
      startSlideshow()
      return () => stopSlideshow()
    }
  }, [settings.interval, settings.transition])

  // Enhanced error handler for images
  const handleImgError = (e) => {
    if (e?.target?.src && e.target.src.includes('/api/gdrive-proxy')) {
      console.error('Google Drive image load failed, triggering reconnect');
      triggerAutoReconnect();
    }
  };

  const displayUrl = getDisplayImageUrl(currentImage, googleDriveToken);

  // Manual reconnect as fallback
  const handleManualReconnect = () => {
    setAutoReconnectAttempts(0); // Reset attempts
    updateSettings({ isOpen: true }); // Open settings
  };

  // Get appropriate status message and styling
  const getConnectionBanner = () => {
    if (!hasGoogleDriveImages) return null;

    switch (connectionState) {
      case 'reconnecting':
        return {
          message: `Reconnecting to Google Drive... (attempt ${autoReconnectAttempts}/3)`,
          className: 'bg-yellow-600',
          showButton: false,
          icon: <FaSpinner className="animate-spin" />
        };
      case 'failed':
        return {
          message: `Auto-reconnect failed. Manual reconnection required.`,
          className: 'bg-red-700',
          showButton: true,
          icon: '⚠️'
        };
      default:
        return null;
    }
  };

  const connectionBanner = getConnectionBanner();

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden relative">
      {/* Smart connection banner - only shows when needed */}
      {connectionBanner && (
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className={`fixed top-0 left-0 w-full text-white text-center py-4 z-50 ${connectionBanner.className}`}
        >
          <div className="flex items-center justify-center gap-4">
            {connectionBanner.icon}
            <span><b>Status:</b> {connectionBanner.message}</span>
            {connectionBanner.showButton && (
              <button 
                onClick={handleManualReconnect} 
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-800 transition-colors"
              >
                Open Settings
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Debug panel - only shown when activated via key sequence */}
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
            <div><b>Connection State:</b> {connectionState}</div>
            <div><b>Auto-reconnect Attempts:</b> {autoReconnectAttempts}/3</div>
            <div><b>Google Drive Token:</b> {googleDriveToken ? 'Connected' : 'None'}</div>
            <div><b>Token Expiry:</b> {settings.googleDrive?.tokenExpiry ? new Date(settings.googleDrive.tokenExpiry).toLocaleTimeString() : 'None'}</div>
            <div><b>Last Successful:</b> {new Date(lastSuccessfulConnection).toLocaleTimeString()}</div>
            <div><b>Current Image:</b> {currentImage?.name || 'None'}</div>
            <div><b>Images Count:</b> {useStore.getState().images.length}</div>
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
