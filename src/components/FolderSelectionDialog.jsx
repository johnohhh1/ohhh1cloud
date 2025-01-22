import React from 'react';
import { FaFolder } from 'react-icons/fa';

export function FolderSelectionDialog({ 
  folders, 
  isLoading, 
  onDismiss, 
  onFolderSelected 
}) {
  const [focusIndex, setFocusIndex] = React.useState(0);

  const handleKeyDown = (e, folder, index) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        onFolderSelected(folder);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusIndex((index + 1) % folders.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusIndex(index === 0 ? folders.length - 1 : index - 1);
        break;
      case 'Escape':
        onDismiss();
        break;
    }
  };

  return (
    <div 
      role="dialog"
      aria-labelledby="dialog-title"
      aria-modal="true"
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-gray-900 rounded-lg max-w-md w-full p-4 shadow-xl">
        <h2 id="dialog-title" className="text-lg font-semibold mb-4">
          Select a Folder
        </h2>
        
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-4" role="status">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              <span className="sr-only">Loading folders...</span>
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center p-4 text-gray-400">No folders found</div>
          ) : (
            <div 
              className="divide-y divide-gray-700"
              role="listbox"
              aria-label="Folder list"
            >
              {folders.map((folder, index) => (
                <div
                  key={folder.id}
                  role="option"
                  aria-selected={focusIndex === index}
                  tabIndex={focusIndex === index ? 0 : -1}
                  onClick={() => onFolderSelected(folder)}
                  onKeyDown={(e) => handleKeyDown(e, folder, index)}
                  className={`p-3 hover:bg-gray-800 cursor-pointer flex items-center gap-2 ${
                    focusIndex === index ? 'bg-gray-800 outline-none ring-2 ring-blue-500' : ''
                  }`}
                >
                  <FaFolder className="text-gray-400" aria-hidden="true" />
                  <span>{folder.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 rounded"
            aria-label="Cancel folder selection"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}