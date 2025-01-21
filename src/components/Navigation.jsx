import React from 'react';
import { FaArrowLeft, FaArrowRight, FaPlay, FaPause, FaExpand, FaCompress } from 'react-icons/fa';
import { useStore } from '../store';

export default function Navigation() {
  const { 
    nextImage, 
    previousImage, 
    startSlideshow, 
    stopSlideshow, 
    slideTimer 
  } = useStore();

  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30">
      <div className="bg-black/50 backdrop-blur-sm rounded-full p-2 flex items-center gap-4">
        <button
          onClick={previousImage}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Previous image"
        >
          <FaArrowLeft />
        </button>

        <button
          onClick={() => slideTimer ? stopSlideshow() : startSlideshow()}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label={slideTimer ? "Pause slideshow" : "Start slideshow"}
        >
          {slideTimer ? <FaPause /> : <FaPlay />}
        </button>

        <button
          onClick={nextImage}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Next image"
        >
          <FaArrowRight />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <FaCompress /> : <FaExpand />}
        </button>
      </div>
    </div>
  );
} 