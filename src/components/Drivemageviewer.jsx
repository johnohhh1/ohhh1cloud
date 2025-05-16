import { useState, useEffect } from 'react';
import { DriveManager } from '../services/driveservice';

const DriveImageViewer = () => {
  const [accessToken, setAccessToken] = useState('');
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [driveManager, setDriveManager] = useState(null);
  const [stopWatching, setStopWatching] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Client ID and API key from environment variables
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
  const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

  useEffect(() => {
    // Load the Google API client library
    const loadGoogleApi = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = initializeGapiClient;
      document.body.appendChild(script);
    };

    loadGoogleApi();
    
    // Clean up watcher when component unmounts
    return () => {
      if (stopWatching) {
        stopWatching();
      }
    };
  }, [stopWatching]);

  const initializeGapiClient = () => {
    window.gapi.load('client:auth2', initClient);
  };

  const initClient = () => {
    setLoading(true);
    window.gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES
    }).then(() => {
      // Listen for sign-in state changes
      window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
      
      // Handle the initial sign-in state
      updateSignInStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
      setLoading(false);
    }).catch(error => {
      setError(`Error initializing Google API client: ${error.message}`);
      setLoading(false);
    });
  };

  const updateSignInStatus = (isSignedIn) => {
    setIsSignedIn(isSignedIn);
    if (isSignedIn) {
      const authInstance = window.gapi.auth2.getAuthInstance();
      const currentUser = authInstance.currentUser.get();
      const authResponse = currentUser.getAuthResponse();
      const token = authResponse.access_token;
      
      setAccessToken(token);
      initializeDriveManager(token);
    }
  };

  const handleSignIn = () => {
    window.gapi.auth2.getAuthInstance().signIn();
  };

  const handleSignOut = () => {
    window.gapi.auth2.getAuthInstance().signOut();
    setDriveManager(null);
    setFolders([]);
    setImages([]);
    setAccessToken('');
  };

  const initializeDriveManager = (token) => {
    try {
      setLoading(true);
      setError('');
      
      const manager = new DriveManager(token);
      setDriveManager(manager);
      
      // List folders
      manager.listFolders()
        .then(folderList => {
          setFolders(folderList);
          setLoading(false);
        })
        .catch(err => {
          setError(`Error listing folders: ${err.message}`);
          setLoading(false);
        });
    } catch (err) {
      setError(`Failed to initialize DriveManager: ${err.message}`);
      setLoading(false);
    }
  };

  const handleFolderChange = (e) => {
    setSelectedFolder(e.target.value);
  };

  const loadImagesFromFolder = async () => {
    if (!driveManager || !selectedFolder) return;
    
    setLoading(true);
    setError('');
    
    try {
      const imageList = await driveManager.getImagesFromFolder(selectedFolder);
      setImages(imageList);
    } catch (err) {
      setError(`Error loading images: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const watchSelectedFolder = async () => {
    if (!driveManager || !selectedFolder) return;
    
    // Stop previous watcher if exists
    if (stopWatching) {
      stopWatching();
    }
    
    setLoading(true);
    
    try {
      const handleNewImages = (newImgs) => {
        setImages(prevImages => {
          const existingIds = new Set(prevImages.map(img => img.id));
          const uniqueNewImages = newImgs.filter(img => !existingIds.has(img.id));
          return [...prevImages, ...uniqueNewImages];
        });
      };
      
      const stopWatchingFn = await driveManager.watchFolder(selectedFolder, handleNewImages);
      setStopWatching(() => stopWatchingFn);
    } catch (err) {
      setError(`Error watching folder: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testNotification = () => {
    if (!driveManager) return;
    
    driveManager.testNotification((newImages) => {
      setImages(prev => [...prev, ...newImages]);
    });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Google Drive Image Viewer</h1>
      
      <div className="mb-4 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Step 1: Connect to Google Drive</h2>
        <div className="flex gap-2">
          {!isSignedIn ? (
            <button 
              onClick={handleSignIn}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              Sign in with Google
            </button>
          ) : (
            <button 
              onClick={handleSignOut}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Sign Out
            </button>
          )}
        </div>
        {isSignedIn && (
          <div className="mt-2 text-green-600">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Connected to Google Drive
          </div>
        )}
      </div>
      
      {driveManager && folders.length > 0 && (
        <div className="mb-4 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Step 2: Select Image Folder</h2>
          <div className="flex gap-2">
            <select 
              value={selectedFolder} 
              onChange={handleFolderChange}
              className="flex-1 p-2 border rounded"
            >
              <option value="">Select a folder</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <button 
              onClick={loadImagesFromFolder}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              disabled={!selectedFolder || loading}
            >
              Load Images
            </button>
            <button 
              onClick={watchSelectedFolder}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
              disabled={!selectedFolder || loading}
            >
              Watch Folder
            </button>
          </div>
        </div>
      )}
      
      {driveManager && (
        <div className="mb-4">
          <button 
            onClick={testNotification}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Test Notification
          </button>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {loading && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          Loading...
        </div>
      )}
      
      {images.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Images ({images.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map(image => (
              <div key={image.id} className="border rounded overflow-hidden">
                <div className="aspect-w-1 aspect-h-1 w-full">
                  <img 
                    src={image.url} 
                    alt={image.name}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150?text=Error';
                    }}
                  />
                </div>
                <div className="p-2 text-sm truncate" title={image.name}>
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriveImageViewer;
