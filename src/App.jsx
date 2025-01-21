import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from './store'
import Settings from './components/Settings'
import Navigation from './components/Navigation'
import { FaCog, FaPlay, FaPause } from 'react-icons/fa'

const transitions = {
  'slide-horizontal': {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  },
  'ripple': {
    enter: () => ({
      scale: 0,
      opacity: 0,
      borderRadius: '100%'
    }),
    center: {
      scale: 1,
      opacity: 1,
      borderRadius: '0%'
    },
    exit: () => ({
      scale: 2,
      opacity: 0,
      borderRadius: '100%'
    })
  },
  'morph': {
    enter: () => ({
      scale: 0.5,
      opacity: 0,
      rotate: -180,
      borderRadius: '50%'
    }),
    center: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      borderRadius: '0%'
    },
    exit: () => ({
      scale: 0.5,
      opacity: 0,
      rotate: 180,
      borderRadius: '50%'
    })
  },
  'elastic': {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.3
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.3
    })
  },
  'swirl': {
    enter: () => ({
      opacity: 0,
      rotate: -720,
      scale: 0
    }),
    center: {
      opacity: 1,
      rotate: 0,
      scale: 1
    },
    exit: () => ({
      opacity: 0,
      rotate: 720,
      scale: 0
    })
  },
  'slide-vertical': {
    enter: (direction) => ({
      y: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      y: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      y: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  },
  'fade': {
    enter: () => ({
      opacity: 0
    }),
    center: {
      zIndex: 1,
      opacity: 1
    },
    exit: () => ({
      zIndex: 0,
      opacity: 0
    })
  },
  'zoom': {
    enter: () => ({
      scale: 0,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      scale: 1,
      opacity: 1
    },
    exit: () => ({
      zIndex: 0,
      scale: 2,
      opacity: 0
    })
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
    slideTimer
  } = useStore()

  React.useEffect(() => {
    if (settings.interval) {
      startSlideshow()
      return () => stopSlideshow()
    }
  }, [settings.interval, settings.transition])

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden relative">
      <div 
        className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
        style={{ backgroundImage: `url(${currentImage})` }}
      />
      <div className="absolute inset-0 bg-black/30" />
      
      <AnimatePresence mode="wait" initial={false} custom={transitionEffect}>
        <motion.img
          key={currentImage}
          src={currentImage}
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