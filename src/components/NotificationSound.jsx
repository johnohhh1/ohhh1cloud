import React, { useEffect, useRef } from 'react';

export function NotificationSound({ onComplete, volume = 0.5 }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const soundPath = '/we-are-the-champions-copia.mp3'; // ✅ Correct file path

    // Test if the file is accessible
    fetch(soundPath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Audio file is accessible:', soundPath);
      })
      .catch(error => {
        console.error('Audio file not accessible:', error);
      });

    if (audioRef.current) {
      console.log('Audio element ready, volume:', volume);
      audioRef.current.volume = volume;

      // Debugging events
      audioRef.current.addEventListener('playing', () => console.log('Audio started playing'));
      audioRef.current.addEventListener('error', (e) => console.error('Audio error:', e.target.error));

      // Play the sound
      audioRef.current.play()
        .then(() => console.log('Audio play started successfully'))
        .catch(error => console.error('Error playing notification:', error));
    }
  }, [volume]);

  return (
    <audio
      ref={audioRef}
      onEnded={() => {
        console.log('Audio finished playing');
        if (onComplete) onComplete();
      }}
      preload="auto"
    >
      <source 
        src="/we-are-the-champions-copia.mp3" // ✅ Correct file path
        type="audio/mpeg"
        onError={(e) => console.error('Source error:', e)}
      />
      Your browser does not support the audio element.
    </audio>
  );
}
