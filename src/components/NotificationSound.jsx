import React from 'react';

export function NotificationSound({ onComplete, volume = 0.5 }) {
  const audioRef = React.useRef(null);

  React.useEffect(() => {
    // Test if file is accessible
    fetch('/notification.mp3')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Audio file is accessible');
      })
      .catch(error => {
        console.error('Audio file not accessible:', error);
      });

    if (audioRef.current) {
      console.log('Audio element ready, volume:', volume);
      audioRef.current.volume = volume;
      
      // Add event listeners for debugging
      audioRef.current.addEventListener('playing', () => {
        console.log('Audio started playing');
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio error:', e.target.error);
      });

      audioRef.current.play()
        .then(() => {
          console.log('Audio play started successfully');
        })
        .catch(error => {
          console.error('Error playing notification:', error);
        });
    }
  }, [volume]);

  return (
    <audio 
      ref={audioRef}
      onEnded={() => {
        console.log('Audio finished playing');
        onComplete();
      }}
      preload="auto"
    >
      <source 
        src="/notification.mp3"
        type="audio/mpeg"
        onError={(e) => console.error('Source error:', e)}
      />
      Your browser does not support the audio element.
    </audio>
  );
} 