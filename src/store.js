// store.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      images: [],
      currentIndex: 0,
      currentImage: null,
      transitionEffect: 1,
      slideTimer: null,
      settings: {
        isOpen: false,
        interval: 5000,
        transition: 'fade',
        transitionDuration: 0.8,
        randomTransitions: false,
        shuffle: false,
        googleDrive: {
          isConnected: false,
          accessToken: null,
          selectedFolder: null,
          images: []
        },
        notifications: {
          enabled: false,
          sound: true,
          volume: 0.5,
          checkInterval: 30000
        }
      },

      setImages: (images) => set({ images, currentImage: images[0] }),

      nextImage: () => {
        const { images, currentIndex, settings } = get()
        if (!images.length) return

        if (settings.randomTransitions) {
          const transitions = ['matrix', 'glitch', 'portal']
          const random = transitions[Math.floor(Math.random() * transitions.length)]
          set(state => ({
            settings: { ...state.settings, transition: random, transitionDuration: 0.8 }
          }))
        }

        const nextIndex = settings.shuffle
          ? Math.floor(Math.random() * images.length)
          : (currentIndex + 1) % images.length

        set({
          currentIndex: nextIndex,
          currentImage: images[nextIndex],
          transitionEffect: 1
        })
      },

      previousImage: () => {
        const { images, currentIndex } = get()
        if (!images.length) return
        const nextIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1
        set({
          currentIndex: nextIndex,
          currentImage: images[nextIndex],
          transitionEffect: -1
        })
      },

      startSlideshow: () => {
        const { settings, slideTimer } = get()
        if (slideTimer) clearInterval(slideTimer)
        const timer = setInterval(() => get().nextImage(), settings.interval)
        set({ slideTimer: timer })
      },

      stopSlideshow: () => {
        const { slideTimer } = get()
        if (slideTimer) {
          clearInterval(slideTimer)
          set({ slideTimer: null })
        }
      },

      toggleSettings: () => {
        const { settings } = get()
        set({ settings: { ...settings, isOpen: !settings.isOpen } })
      },

      updateSettings: (newSettings) => {
        set({ settings: { ...get().settings, ...newSettings } })
      },

      addLocalImages: async (files) => {
        const images = await Promise.all(
          Array.from(files).map(file => {
            return new Promise((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve({ url: reader.result })
              reader.readAsDataURL(file)
            })
          })
        )
        set(state => ({
          images: [...state.images, ...images],
          currentImage: state.images.length === 0 ? images[0] : state.currentImage
        }))
      },

      connectDropbox: () => {},
      connectGoogleDrive: () => {},

      addDropboxImages: (images) => {
        set(state => {
          const allImages = [...state.images, ...images]
          return {
            images: allImages,
            currentIndex: state.images.length === 0 ? 0 : state.currentIndex,
            currentImage: state.images.length === 0 ? images[0] : state.currentImage,
            transitionEffect: 1
          }
        })
      },

      addNewImages: (images, source) => {
        set(state => {
          const showNewest = images.length === 1 &&
            images[0].isNew &&
            ['googleDrive', 'dropbox'].includes(images[0].source)

          const allImages = [...state.images, ...images]

          return {
            images: allImages,
            currentIndex: showNewest ? state.images.length : state.currentIndex,
            currentImage: showNewest ? images[0] : state.currentImage,
            transitionEffect: 1
          }
        })
      }
    }),
    {
      name: 'digital-frame-storage',
      partialize: (state) => ({
        settings: {
          ...state.settings,
          googleDrive: {
            ...state.settings.googleDrive,
            images: [] // Avoid persisting
          }
        }
      })
    }
  )
)

export { useStore }

// Utility to get the correct image URL (proxy for Google Drive)
export function getDisplayImageUrl(image, googleDriveToken) {
  if (!image) return '';
  // Force proxy for any Google Drive URL
  const isGoogleDriveUrl = image.url && (
    image.url.includes('googleapis.com/drive/v3/files') ||
    image.url.includes('googleusercontent.com')
  );
  if ((image.source === 'googleDrive' || isGoogleDriveUrl)) {
    let fileId = image.id;
    // Try to extract fileId from URL if not present
    if (!fileId && image.url) {
      const match = image.url.match(/\/files\/(.*?)\?/);
      if (match && match[1]) fileId = match[1];
    }
    if (fileId && googleDriveToken) {
      const proxyUrl = `/api/gdrive-proxy?fileId=${fileId}&token=${encodeURIComponent(googleDriveToken)}`;
      console.log('Using proxy for image:', proxyUrl, image);
      return proxyUrl;
    } else {
      console.warn('Google Drive image missing fileId or token:', image, googleDriveToken);
    }
  }
  console.log('Using direct url for image:', image.url, image);
  return image.url;
}
