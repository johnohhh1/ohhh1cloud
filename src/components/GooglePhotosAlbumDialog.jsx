import React from 'react';
import { motion } from 'framer-motion';
import { FaFolder, FaTimes } from 'react-icons/fa';

export function GooglePhotosAlbumDialog({ albums, isLoading, onDismiss, onAlbumSelected }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-gray-900 rounded-lg max-w-md w-full p-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Select Google Photos Album</h2>
          <button onClick={onDismiss} className="p-2 hover:bg-gray-800 rounded-full">
            <FaTimes />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : albums.length === 0 ? (
            <div className="text-center p-4 text-gray-400">No albums found</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {albums.map(album => (
                <div
                  key={album.id}
                  onClick={() => onAlbumSelected(album)}
                  className="p-3 hover:bg-gray-800 cursor-pointer flex items-center gap-2"
                >
                  <FaFolder className="text-gray-400" />
                  <span>{album.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default GooglePhotosAlbumDialog;
