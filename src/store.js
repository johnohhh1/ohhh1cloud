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
        const { images, currentIndex, settings, slideTimer } = get()
        console.log('Next Image - Current state:', { 
          totalImages: images.length, 
          currentIndex, 
          currentImage: get().currentImage 
        })
        
        if (!images.length) return
        
        // Handle random transition if enabled
        if (settings.randomTransitions) {
          const transitions = [
            'matrix',
            'glitch',
            'portal'
          ]
          const randomTransition = transitions[Math.floor(Math.random() * transitions.length)]
          set(state => ({ 
            settings: { 
              ...state.settings, 
              transition: randomTransition,
              transitionDuration: 0.8
            } 
          }))
        }

        let nextIndex
        if (settings.shuffle) {
          nextIndex = Math.floor(Math.random() * images.length)
        } else {
          nextIndex = (currentIndex + 1) % images.length
        }

        console.log('Next Image - New state:', { nextIndex, nextImage: images[nextIndex] })
        
        set({ 
          currentIndex: nextIndex,
          currentImage: images[nextIndex],
          transitionEffect: 1
        })
      },

      previousImage: () => {
        const { images, currentIndex } = get()
        console.log('Previous Image - Current state:', { 
          totalImages: images.length, 
          currentIndex, 
          currentImage: get().currentImage 
        })
        
        if (!images.length) return
        const nextIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1
        
        console.log('Previous Image - New state:', { nextIndex, nextImage: images[nextIndex] })
        
        set({ 
          currentIndex: nextIndex,
          currentImage: images[nextIndex],
          transitionEffect: -1
        })
      },

      startSlideshow: () => {
        const { settings, slideTimer } = get()
        if (slideTimer) clearInterval(slideTimer)
        
        const timer = setInterval(() => {
          get().nextImage()
        }, settings.interval)
        
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
        set({ settings: { ...settings, isOpen: !settings.isOpen }})
      },

      updateSettings: (newSettings) => {
        set({ settings: { ...get().settings, ...newSettings }})
      },

      addLocalImages: async (files) => {
        const images = await Promise.all(
          Array.from(files).map(file => {
            return new Promise((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result)
              reader.readAsDataURL(file)
            })
          })
        )
        
        set(state => ({ 
          images: [...state.images, ...images],
          currentImage: state.images.length === 0 ? images[0] : state.currentImage
        }))
      },

      connectDropbox: () => {
        // Implement Dropbox OAuth flow
      },

      connectGoogleDrive: () => {
        // Implement Google Drive OAuth flow
      },

      addDropboxImages: (images) => {
        console.log('Adding Dropbox images to store:', images);
        set(state => {
          const imageUrls = images.map(img => img.url);
          const newState = {
            images: [...state.images, ...imageUrls],
            currentIndex: state.images.length === 0 ? 0 : state.currentIndex,
            currentImage: state.images.length === 0 ? imageUrls[0] : state.currentImage,
            transitionEffect: 1
          };
          console.log('New store state:', newState);
          return newState;
        });
      },

      addNewImages: (images, source) => {
        console.log(`Adding new images from ${source}:`, images);
        set(state => {
          const imageUrls = images.map(img => img.url);
          
          // Show newest if it's from any cloud source
          const showNewest = images.length === 1 && 
                            images[0].isNew && 
                            ['googleDrive', 'dropbox'].includes(images[0].source);
          
          const newState = {
            images: [...state.images, ...imageUrls],
            currentIndex: showNewest ? state.images.length : state.currentIndex,
            currentImage: showNewest ? imageUrls[0] : state.currentImage,
            transitionEffect: 1
          };
          return newState;
        });
      }
    }),
    {
      name: 'digital-frame-storage',
      partialize: (state) => ({
        settings: {
          ...state.settings,
          googleDrive: {
            ...state.settings.googleDrive,
            images: [] // Don't store Google Drive images in localStorage
          }
        }
      })
    }
  )
)

export { useStore }