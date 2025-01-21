import React from 'react';
import { useStore } from '../store';
import { FaDropbox, FaSpinner } from 'react-icons/fa';
import { DropboxManager } from '../services/dropboxService';
import { DropboxFolderDialog } from './DropboxFolderDialog';
import { logSensitive, maskSensitiveValue } from '../utils/security';

const DROPBOX_CLIENT_ID = import.meta.env.VITE_DROPBOX_CLIENT_ID;
const DROPBOX_APP_SECRET = import.meta.env.VITE_DROPBOX_APP_SECRET;
const DROPBOX_REDIRECT_URI = encodeURIComponent(`${window.location.origin}/auth/callback`);

export default function DropboxAuth() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [folders, setFolders] = React.useState([]);
  const [showFolderPicker, setShowFolderPicker] = React.useState(false);
  const [currentPath, setCurrentPath] = React.useState('');
  const { updateSettings, addDropboxImages } = useStore();
  const [dropboxManager, setDropboxManager] = React.useState(null);

  const handleFolderSelect = async (folder) => {
    setIsLoading(true);
    try {
      // If the folder has subfolders, navigate into it
      const subFolders = await dropboxManager.listFolders(folder.path);
      if (subFolders.length > 0) {
        setFolders(subFolders);
        setCurrentPath(folder.path);
        setIsLoading(false);
        return;
      }

      // If no subfolders, select this folder for images
      const images = await dropboxManager.getFolderImages(folder.path);
      console.log('Images to add to store:', images);
      addDropboxImages(images);
      console.log('Store updated with images');
      updateSettings({
        dropbox: {
          isConnected: true,
          selectedFolder: folder
        }
      });
      setShowFolderPicker(false);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateUp = async () => {
    setIsLoading(true);
    try {
      const parentPath = currentPath.split('/').slice(0, -1).join('/');
      const parentFolders = await dropboxManager.listFolders(parentPath);
      setFolders(parentFolders);
      setCurrentPath(parentPath);
    } catch (error) {
      console.error('Error navigating up:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectToDropbox = () => {
    const authUrl = new URL('https://www.dropbox.com/oauth2/authorize');
    const params = new URLSearchParams({
      client_id: DROPBOX_CLIENT_ID,
      response_type: 'token',
      redirect_uri: `${window.location.origin}/auth/callback`
    });
    
    authUrl.search = params.toString();
    window.location.href = authUrl.toString();
  };

  React.useEffect(() => {
    // Debug logging
    console.log('Current URL:', window.location.href);
    console.log('Hash:', window.location.hash);
    
    const hash = window.location.hash;
    if (hash) {
      console.log('Found hash in URL');
      const token = hash.match(/access_token=([^&]*)/)?.[1];
      if (token) {
        console.log('Found token in hash');
        const manager = new DropboxManager(token);
        setDropboxManager(manager);
        manager.listFolders('').then(folders => {
          console.log('Got folders:', folders);
          setFolders(folders);
        });
        setShowFolderPicker(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  return (
    <div className="w-full">
      {isLoading && !showFolderPicker ? (
        <div className="flex items-center gap-2">
          <FaSpinner className="animate-spin" />
          <span>Loading...</span>
        </div>
      ) : !showFolderPicker ? (
        <button
          onClick={connectToDropbox}
          className="w-full flex items-center justify-center gap-2"
        >
          <FaDropbox />
          Connect Dropbox
        </button>
      ) : (
        <DropboxFolderDialog
          folders={folders}
          isLoading={isLoading}
          onDismiss={() => setShowFolderPicker(false)}
          onFolderSelected={handleFolderSelect}
          currentPath={currentPath}
          onNavigateUp={handleNavigateUp}
        />
      )}
    </div>
  );
} 