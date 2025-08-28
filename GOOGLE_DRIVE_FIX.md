# Google Drive Connection Fix

## Problem Fixed
The Google Drive connection was being lost when the Settings panel closed because the authentication and folder watching logic was tied to the GoogleDriveAuth component's lifecycle.

## Root Cause
- **GoogleDriveAuth component** (lines 121-155) was managing authentication intervals and folder watching
- When Settings panel closed, the component unmounted and cleaned up all intervals/watchers
- This broke the persistent connection and stopped photo loading

## Solution Applied

### 1. Moved Connection Management to App.jsx
- **New persistent auth logic** (lines 117-200): Runs once on app startup, not tied to Settings
- **Persistent folder watching** (lines 202-247): Continues running regardless of Settings state
- **useRef for persistence**: `driveManagerRef`, `authIntervalRef`, `folderWatcherRef` maintain state across renders

### 2. Simplified GoogleDriveAuth.jsx
- **Now just a status display** component - doesn't manage connections
- **Removed all lifecycle management** - no more useEffect cleanup that breaks connections
- **Shows connection status** from global state instead of managing it

### 3. Key Architecture Changes
- **App-level management**: Connection logic moved from component to app level
- **Persistent refs**: Use useRef to maintain connections across component lifecycles
- **Empty dependency array**: Authentication useEffect runs once on mount, not on Settings changes
- **Proper cleanup**: Only cleans up on actual app unmount, not Settings close

## Files Modified
1. **C:/framed3/src/App.jsx**: Added persistent Google Drive connection management
2. **C:/framed3/src/components/GoogleDriveAuth.jsx**: Simplified to status display only

## Expected Behavior After Fix
✅ Google Drive connects on app startup
✅ Connection persists when Settings panel closes  
✅ Photos continue loading with Settings closed
✅ Token refresh happens in background
✅ Folder watching continues regardless of UI state
✅ Status correctly displayed in Settings when reopened

## Testing
1. Open app - should auto-connect to Google Drive
2. Close Settings panel - connection should persist
3. Photos should continue cycling
4. Reopen Settings - should show "Connected" status
5. New photos should be detected in background