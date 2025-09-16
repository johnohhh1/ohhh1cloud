import { useTransition, animated } from "@react-spring/web";
import { useStore, getDisplayImageUrl } from "../store";
import { transitionStyles } from "../animations/transitions";
import { useState, useEffect, useRef } from "react";

export function Slideshow() {
  const { images, settings } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  // Get Google Drive token from settings
  const googleDriveToken = settings?.googleDrive?.accessToken;

  // Reset index when images array changes significantly
  useEffect(() => {
    // If current index is out of bounds, reset it
    if (currentIndex >= images.length && images.length > 0) {
      setCurrentIndex(0);
    }
  }, [images.length, currentIndex]);

  // Auto-cycle through images
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Don't start slideshow if no images
    if (!images.length) return;

    // Create new interval with current images array
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prevIndex => {
        // Use the current images.length, not a stale closure
        const nextIndex = (prevIndex + 1) % images.length;
        console.log(`Advancing slideshow: ${prevIndex} -> ${nextIndex} (of ${images.length} total)`);
        return nextIndex;
      });
    }, settings.transitionDuration * 1000);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [images.length, settings.transitionDuration]); // Re-create interval when images array size changes

  // Get current image safely
  const currentImage = images[currentIndex] || images[0] || null;

  // Debugging logs
  useEffect(() => {
    if (currentImage) {
      console.log("Current Image:", currentImage);
      console.log("Current Index:", currentIndex);
      console.log("Total Images:", images.length);
      console.log("Transition:", settings.transition);
      console.log("Duration:", settings.transitionDuration);
    }
  }, [currentImage, currentIndex, images.length, settings.transition, settings.transitionDuration]);

  const transitions = useTransition(currentImage, {
    ...(transitionStyles[settings.transition] || transitionStyles.fade),
    config: {
      duration: settings.transitionDuration * 1000,
      tension: 200,
      friction: 20,
    },
  });

  // Don't render if no images
  if (!images.length || !currentImage) {
    return (
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
        <div className="text-white text-2xl">No images to display</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {transitions((style, item) => (
        item && (
          <animated.div
            style={{
              ...style,
              position: "absolute",
              width: "100%",
              height: "100%",
              willChange: "transform, opacity",
            }}
            className="absolute inset-0"
          >
            <img
              src={getDisplayImageUrl(item, googleDriveToken)}
              className="w-full h-full object-contain"
              alt="Recognition"
              draggable={false}
              onError={(e) => {
                console.error("Failed to load image:", item);
                // Optionally advance to next image on error
                setCurrentIndex(prev => (prev + 1) % images.length);
              }}
            />
          </animated.div>
        )
      ))}
    </div>
  );
}