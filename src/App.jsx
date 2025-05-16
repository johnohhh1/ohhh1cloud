// src/App.jsx

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, getDisplayImageUrl } from './store'
import Settings from './components/Settings'
import Navigation from './components/Navigation'
import { FaCog, FaPlay, FaPause } from 'react-icons/fa'

const transitions = {
  /* … your existing transition definitions … */
}

export default function App() {
  const { 
    currentImage, 
    settings, 
    toggleSettings,
    transitionEffect,
    startSlideshow,
    stopSlideshow,
    slideTimer
  } = useStore()

  // Error state
  const [globalError, setGlobalError] = useState(null);

  // Get Google Drive token from settings (always fresh)
  const googleDriveToken = settings?.googleDrive?.accessToken;

  useEffect(() => {
    if (settings.interval) {
      startSlideshow()
      return () => stopSlideshow()
    }
  }, [settings.interval, settings.transition])

  // If the current image is a Google Drive image and token is missing, show error
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

  // Proxy error handler
  const handleImgError = (e) => {
    if (e?.target?.src && e.target.src.includes('/api/gdrive-proxy')) {
      setGlobalError('Failed to load image from Google Drive. Your token may be expired or the file is not shared with your account. Try reconnecting Google Drive.');
    }
  };

  const displayUrl = getDisplayImageUrl(currentImage, googleDriveToken);

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden relative">
      {globalError && (
        <div className="fixed top-0 left-0 w-full bg-red-700 text-white text-center py-4 z-50">
          <b>Error:</b> {globalError}
        </div>
      )}
      {/* blurred background from currentImage */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
        style={{ backgroundImage: `url(${displayUrl})` }}
      />
      
      <AnimatePresence mode="wait" initial={false} custom={transitionEffect}>
        <motion.img
          key={displayUrl}
          src={displayUrl}
          onError={handleImgError}
          custom={transitionEffect}
          variants={transitions[settings.transition]}
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

      
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={slideTimer ? stopSlideshow : startSlideshow}
          className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          {slideTimer ? <FaPause className="w-6 h-6" /> : <FaPlay className="w-6 h-6" />}
        </button>
        <button
          onClick={toggleSettings}
          className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <FaCog className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {settings.isOpen && <Settings />}
      </AnimatePresence>
      
      <Navigation />
    </div>
  )
}
