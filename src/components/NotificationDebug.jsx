import React from 'react';

export function NotificationDebug({ enabled, lastNotification }) {
  return (
    <div className="mt-4 p-2 bg-gray-800 rounded text-sm">
      <h4 className="font-bold mb-2">Debug Info:</h4>
      <div>Notifications: {enabled ? 'Enabled' : 'Disabled'}</div>
      {lastNotification && (
        <div>Last notification: {new Date(lastNotification).toLocaleTimeString()}</div>
      )}
    </div>
  );
} 