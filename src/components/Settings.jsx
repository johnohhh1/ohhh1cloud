import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import GoogleDriveAuth from './GoogleDriveAuth'
import DropboxAuth from './DropboxAuth'
import { 
  FaTimes, 
  FaFolder, 
  FaDropbox,
  FaGoogle,
  FaRandom,
  FaClock,
  FaImage,
  FaMagic,
  FaExpand,
  FaBell
} from 'react-icons/fa'
import { NotificationSound } from './NotificationSound'

export default function Settings() {
  const { settings, updateSettings, addLocalImages, addGoogleDriveImages, addNewImages } = useStore()
  const fileInputRef = React.useRef()
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [showNotification, setShowNotification] = React.useState(false)

  const handleFileSelect = (e) => {
    if (e.target.files?.length) {
      addLocalImages(e.target.files)
    }
  }

  const transitionOptions = [
    { value: 'fade', label: 'Fade' },
    { value: 'dissolve', label: 'Dissolve (Blur)' },
    { value: 'cross-fade', label: 'Cross Fade' },
    { value: 'slide-left', label: 'Slide Left' },
    { value: 'slide-right', label: 'Slide Right' },
    { value: 'slide-up', label: 'Slide Up' },
    { value: 'slide-down', label: 'Slide Down' },
    { value: 'zoom-in', label: 'Zoom In' },
    { value: 'zoom-out', label: 'Zoom Out' },
    { value: 'rotate-in', label: 'Rotate In' },
    { value: 'flip-horizontal', label: 'Flip Horizontal' },
    { value: 'flip-vertical', label: 'Flip Vertical' },
    { value: 'push-left', label: 'Push Left' },
    { value: 'push-up', label: 'Push Up' },
    { value: 'cube-left', label: 'Cube' },
    { value: 'wave', label: 'Wave' },
    { value: 'iris', label: 'Iris (Circle)' },
    { value: 'curtain', label: 'Curtain' },
    { value: 'diagonal-wipe', label: 'Diagonal Wipe' }
  ]

  const transitionSpeeds = [
    { value: 0.3, label: 'Fast' },
    { value: 0.8, label: 'Normal' },
    { value: 1.2, label: 'Slow' },
    { value: 1.5, label: 'Very Slow' }
  ]

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      })
    }
  }

  const handleTestNotification = () => {
    const testImage = { 
      id: 'test-' + Date.now(),
      name: 'Test Image',
      url: 'https://picsum.photos/800/600',
      isNew: true,
      source: 'test'
    };
    addNewImages([testImage], 'test');
    if (settings.notifications?.enabled) {
      setShowNotification(true);
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="fixed top-0 right-0 w-80 h-full bg-gray-900 p-6 shadow-lg z-40 overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold">Settings</h2>
        <button
          onClick={() => updateSettings({ isOpen: false })}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <FaTimes />
        </button>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaImage className="mr-2" /> Image Sources
          </h3>
          <div className="space-y-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 bg-gray-800 rounded flex items-center hover:bg-gray-700 transition-colors"
            >
              <FaFolder className="mr-2" />
              Add Local Images
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept="image/*"
            />
            
            <GoogleDriveAuth />
            <DropboxAuth />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaClock className="mr-2" /> Timing
          </h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="mr-2">Interval:</span>
              <select
                value={settings.interval}
                onChange={(e) => updateSettings({ interval: parseInt(e.target.value) })}
                className="bg-gray-800 rounded p-2 flex-1 transition-colors hover:bg-gray-700"
              >
                <option value={3000}>3 seconds</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
              </select>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaMagic className="mr-2" /> Transitions
          </h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="mr-2">Effect:</span>
              <select
                value={settings.transition}
                onChange={(e) => updateSettings({ transition: e.target.value })}
                className="bg-gray-800 rounded p-2 flex-1 transition-colors hover:bg-gray-700"
              >
                {transitionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <label className="flex items-center p-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.randomTransitions}
                onChange={(e) => updateSettings({ randomTransitions: e.target.checked })}
                className="mr-2"
              />
              <span>Random Transitions</span>
            </label>

            <div className="flex items-center">
              <span className="mr-2">Speed:</span>
              <select
                value={settings.transitionDuration}
                onChange={(e) => updateSettings({ transitionDuration: parseFloat(e.target.value) })}
                className="bg-gray-800 rounded p-2 flex-1 transition-colors hover:bg-gray-700"
              >
                {transitionSpeeds.map((speed) => (
                  <option key={speed.value} value={speed.value}>
                    {speed.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaRandom className="mr-2" /> Playback
          </h3>
          <label className="flex items-center p-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.shuffle}
              onChange={(e) => updateSettings({ shuffle: e.target.checked })}
              className="mr-2"
            />
            <span>Shuffle Images</span>
          </label>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaExpand className="mr-2" /> Display
          </h3>
          <label className="flex items-center p-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFullscreen}
              onChange={toggleFullscreen}
              className="mr-2"
            />
            <span>Fullscreen Mode</span>
          </label>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaBell className="mr-2" /> Notifications
          </h3>
          <div className="space-y-4">
            <label className="flex items-center p-2 cursor-pointer" htmlFor="notificationToggle">
              <input
                id="notificationToggle"
                type="checkbox"
                checked={settings.notifications?.enabled}
                onChange={(e) => updateSettings({ 
                  notifications: { 
                    ...settings.notifications,
                    enabled: e.target.checked 
                  }
                })}
                className="mr-2"
              />
              <span>Enable New Image Notifications</span>
            </label>
            
            {settings.notifications?.enabled && (
              <>
                <label className="flex items-center p-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications?.sound}
                    onChange={(e) => updateSettings({ 
                      notifications: {
                        ...settings.notifications,
                        sound: e.target.checked
                      }
                    })}
                    className="mr-2"
                  />
                  <span>Play Sound</span>
                </label>
                
                <div className="flex items-center">
                  <span className="mr-2">Volume:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.notifications?.volume || 0.5}
                    onChange={(e) => updateSettings({
                      notifications: {
                        ...settings.notifications,
                        volume: parseFloat(e.target.value)
                      }
                    })}
                    className="w-full"
                  />
                </div>

                <button
                  onClick={handleTestNotification}
                  className="w-full p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
                >
                  Test Notification Sound
                </button>
              </>
            )}
          </div>
        </section>
      </div>

      {showNotification && settings.notifications?.sound && (
        <NotificationSound 
          onComplete={() => setShowNotification(false)}
          volume={settings.notifications?.volume || 0.5}
        />
      )}
    </motion.div>
  )
}