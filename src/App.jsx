// src/App.jsx

import React, { useEffect } from 'react'
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

  // Get Google Drive token from settings
  const googleDriveToken = settings?.googleDrive?.accessToken;

  useEffect(() => {
    if (settings.interval) {
      startSlideshow()
      return () => stopSlideshow()
    }
  }, [settings.interval, settings.transition])

  const displayUrl = getDisplayImageUrl(currentImage, googleDriveToken);

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden relative">

      {/* blurred background from currentImage */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
        style={{ backgroundImage: `url(${displayUrl})` }}
      />
      
      <AnimatePresence mode="wait" initial={false} custom={transitionEffect}>
        <motion.img
          key={displayUrl}
          src={displayUrl}
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
