// src/store.js
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
        transition: 'dissolve',
        transitionDuration: 1.5,
        randomTransitions: false,
        shuffle: false,
        googleDrive: {
          isConnected: false,
          accessToken: null,
          selectedFolder: null,
          images: [],
          tokenExpiry: null, // Track when token expires
          lastConnection: null // Track last successful connection
        },
        googlePhotos: {
          isConnected: false,
          accessToken: null,
          selectedAlbum: null,
          images: [],
          tokenExpiry: null,
          lastConnection: null
        },
        dropbox: {
          isConnected: false,
          accessToken: null,
          selectedFolder: null,
          images: [],
          lastConnection: null
        },
        notifications: {
          enabled: false,
          sound: true,
          volume: 0.5,
          checkInterval: 30000
        },
        app: {
          autoReconnect: true,
          maxRetryAttempts: 3,
          debugMode: false // Persistent debug mode setting
        }
      },

      setImages: (images) => set({ images, currentImage: images[0] }),

      nextImage: () => {
        const { images, currentIndex, settings } = get()
        if (!images.length) return

        if (settings.randomTransitions) {
          const transitions = ['fade', 'dissolve', 'slide-left', 'slide-up', 'zoom-in', 'zoom-out', 'rotate-in', 'flip-horizontal', 'iris', 'wave', 'curtain']
          const random = transitions[Math.floor(Math.random() * transitions.length)]
          set(state => ({
            settings: { ...state.settings, transition: random, transitionDuration: 1.5 }
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
        const currentSettings = get().settings;
        
        // Handle Google Drive token updates with expiry tracking
        if (newSettings.googleDrive?.accessToken && newSettings.googleDrive.accessToken !== currentSettings.googleDrive?.accessToken) {
          newSettings.googleDrive = {
            ...currentSettings.googleDrive,
            ...newSettings.googleDrive,
            tokenExpiry: Date.now() + (55 * 60 * 1000), // 55 minutes (tokens expire in 60)
            lastConnection: Date.now()
          };
        }

        // Handle Google Photos token updates
        if (newSettings.googlePhotos?.accessToken && newSettings.googlePhotos.accessToken !== currentSettings.googlePhotos?.accessToken) {
          newSettings.googlePhotos = {
            ...currentSettings.googlePhotos,
            ...newSettings.googlePhotos,
            tokenExpiry: Date.now() + (55 * 60 * 1000),
            lastConnection: Date.now()
          };
        }

        // Handle Dropbox token updates
        if (newSettings.dropbox?.accessToken && newSettings.dropbox.accessToken !== currentSettings.dropbox?.accessToken) {
          newSettings.dropbox = {
            ...currentSettings.dropbox,
            ...newSettings.dropbox,
            lastConnection: Date.now()
          };
        }

        set({ settings: { ...currentSettings, ...newSettings } })
      },

      // Enhanced method to check if tokens are expired
      checkTokenExpiry: () => {
        const { settings } = get();
        const now = Date.now();
        let needsUpdate = false;
        const updates = { ...settings };

        // Check Google Drive token
        if (settings.googleDrive?.tokenExpiry && now > settings.googleDrive.tokenExpiry) {
          console.log('Google Drive token expired, clearing...');
          updates.googleDrive = {
            ...settings.googleDrive,
            accessToken: null,
            isConnected: false,
            tokenExpiry: null
          };
          needsUpdate = true;
        }

        // Check Google Photos token
        if (settings.googlePhotos?.tokenExpiry && now > settings.googlePhotos.tokenExpiry) {
          console.log('Google Photos token expired, clearing...');
          updates.googlePhotos = {
            ...settings.googlePhotos,
            accessToken: null,
            isConnected: false,
            tokenExpiry: null
          };
          needsUpdate = true;
        }

        if (needsUpdate) {
          set({ settings: updates });
        }

        return needsUpdate;
      },

      addLocalImages: async (files) => {
        const images = await Promise.all(
          Array.from(files).map(file => {
            return new Promise((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve({ 
                url: reader.result,
                name: file.name,
                source: 'local',
                isNew: false
              })
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

      addGooglePhotosImages: (images) => {
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

      loadGooglePhotosImages: (images) => {
        set(state => {
          const allImages = [...state.images, ...images]
          return {
            images: allImages,
            currentIndex: state.images.length === 0 ? 0 : state.currentIndex,
            currentImage: state.images.length === 0 ? images[0] : state.currentImage,
            transitionEffect: 1,
            settings: {
              ...state.settings,
              googlePhotos: {
                ...state.settings.googlePhotos,
                images
              }
            }
          }
        })
      },

      addNewImages: (images, source) => {
        set(state => {
          // Filter out duplicates based on ID
          const existingIds = new Set(state.images.map(img => img.id));
          const newUniqueImages = images.filter(img => !existingIds.has(img.id));
          
          if (newUniqueImages.length === 0) {
            console.log('No new unique images to add');
            return state;
          }

          const showNewest = newUniqueImages.length === 1 &&
            newUniqueImages[0].isNew &&
            ['googleDrive', 'dropbox', 'googlePhotos'].includes(newUniqueImages[0].source);

          const allImages = [...state.images, ...newUniqueImages];

          console.log(`Added ${newUniqueImages.length} new images from ${source}, total: ${allImages.length}`);

          return {
            images: allImages,
            currentIndex: showNewest ? state.images.length : state.currentIndex,
            currentImage: showNewest ? newUniqueImages[0] : state.currentImage,
            transitionEffect: 1
          }
        })
      },

      // Clean up expired or invalid images
      cleanupImages: () => {
        set(state => {
          const validImages = state.images.filter(img => {
            // Remove test images after 5 minutes
            if (img.source === 'test' && img.id?.startsWith('test-')) {
              const imageTime = parseInt(img.id.split('-')[1]);
              return Date.now() - imageTime < 5 * 60 * 1000;
            }
            return true;
          });

          if (validImages.length !== state.images.length) {
            console.log(`Cleaned up ${state.images.length - validImages.length} expired images`);
            return {
              ...state,
              images: validImages,
              currentIndex: Math.min(state.currentIndex, validImages.length - 1),
              currentImage: validImages[Math.min(state.currentIndex, validImages.length - 1)] || null
            };
          }

          return state;
        });
      },

      // Reset connection for a specific service
      resetConnection: (service) => {
        set(state => ({
          settings: {
            ...state.settings,
            [service]: {
              ...state.settings[service],
              isConnected: false,
              accessToken: null,
              selectedFolder: null,
              selectedAlbum: null,
              tokenExpiry: null
            }
          }
        }));
      },

      // Get connection status for all services
      getConnectionStatus: () => {
        const { settings } = get();
        const now = Date.now();
        
        return {
          googleDrive: {
            connected: settings.googleDrive?.isConnected && 
                      settings.googleDrive?.accessToken &&
                      (!settings.googleDrive?.tokenExpiry || now < settings.googleDrive.tokenExpiry),
            expired: settings.googleDrive?.tokenExpiry && now > settings.googleDrive.tokenExpiry,
            lastConnection: settings.googleDrive?.lastConnection
          },
          googlePhotos: {
            connected: settings.googlePhotos?.isConnected && 
                      settings.googlePhotos?.accessToken &&
                      (!settings.googlePhotos?.tokenExpiry || now < settings.googlePhotos.tokenExpiry),
            expired: settings.googlePhotos?.tokenExpiry && now > settings.googlePhotos.tokenExpiry,
            lastConnection: settings.googlePhotos?.lastConnection
          },
          dropbox: {
            connected: settings.dropbox?.isConnected && settings.dropbox?.accessToken,
            expired: false, // Dropbox tokens don't expire as quickly
            lastConnection: settings.dropbox?.lastConnection
          }
        };
      }
    }),
    {
      name: 'digital-frame-storage',
      partialize: (state) => ({
        settings: {
          ...state.settings,
          googleDrive: {
            ...state.settings.googleDrive,
            images: [] // Don't persist images
          },
          googlePhotos: {
            ...state.settings.googlePhotos,
            images: [] // Don't persist images
          },
          dropbox: {
            ...state.settings.dropbox,
            images: [] // Don't persist images
          }
        }
      }),
      // Custom storage to handle sensitive data
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name);
          if (value) {
            try {
              const parsed = JSON.parse(value);
              // Check for expired tokens on load
              const now = Date.now();
              if (parsed.state?.settings?.googleDrive?.tokenExpiry && 
                  now > parsed.state.settings.googleDrive.tokenExpiry) {
                parsed.state.settings.googleDrive.accessToken = null;
                parsed.state.settings.googleDrive.isConnected = false;
                parsed.state.settings.googleDrive.tokenExpiry = null;
              }
              if (parsed.state?.settings?.googlePhotos?.tokenExpiry && 
                  now > parsed.state.settings.googlePhotos.tokenExpiry) {
                parsed.state.settings.googlePhotos.accessToken = null;
                parsed.state.settings.googlePhotos.isConnected = false;
                parsed.state.settings.googlePhotos.tokenExpiry = null;
              }
              return JSON.stringify(parsed);
            } catch {
              return value;
            }
          }
          return value;
        },
        setItem: (name, value) => localStorage.setItem(name, value),
        removeItem: (name) => localStorage.removeItem(name)
      }
    }
  )
)

export { useStore }

// Enhanced utility to get the correct image URL with better error handling
export function getDisplayImageUrl(image, googleDriveToken) {
  if (!image || !image.url) {
    console.warn('Invalid image object:', image);
    return '/images/placeholder.png'; // Fallback image
  }

  // Force proxy for any Google Drive URL
  const isGoogleDriveUrl = image.url && (
    image.url.includes('googleapis.com/drive/v3/files') ||
    image.url.includes('googleusercontent.com')
  );

  if ((image.source === 'googleDrive' || isGoogleDriveUrl)) {
    let fileId = image.id;
    
    // Try to extract fileId from URL if not present
    if (!fileId && image.url) {
      const match = image.url.match(/\/files\/(.*?)(?:\?|$)/);
      if (match && match[1]) fileId = match[1];
    }

    if (fileId && googleDriveToken) {
      const proxyUrl = `/api/gdrive-proxy?fileId=${fileId}&token=${encodeURIComponent(googleDriveToken)}`;
      console.log('Using proxy for Google Drive image:', fileId);
      return proxyUrl;
    } else {
      console.warn('Google Drive image missing fileId or token:', { fileId, hasToken: !!googleDriveToken });
      return '/images/placeholder.png'; // Fallback for broken Google Drive images
    }
  }

  console.log('Using direct URL for image:', image.source || 'unknown');
  return image.url;
}
