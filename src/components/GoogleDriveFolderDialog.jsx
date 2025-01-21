import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFolder, FaSpinner } from 'react-icons/fa';

export function GoogleDriveFolderDialog({
  folders,
  isLoading,
  onDismiss,
  onFolderSelected
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
      >
        <h2 className="text-xl font-bold mb-4">Select a folder</h2>
        
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <FaSpinner className="animate-spin h-6 w-6" />
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center p-4">
              No folders found
            </div>
          ) : (
            <div className="space-y-2">
              {folders.map(folder => (
                <div
                  key={folder.id}
                  onClick={() => onFolderSelected(folder)}
                  className="flex items-center p-3 rounded hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <FaFolder className="mr-2" />
                  <span>{folder.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
} 