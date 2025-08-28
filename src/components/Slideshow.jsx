import { useTransition, animated } from "@react-spring/web";
import { useStore, getDisplayImageUrl } from "../store";
import { transitionStyles } from "../transitions";
import { useState, useEffect } from "react";

export function Slideshow() {
  const { images, settings } = useStore(); // Ensure images are fetched correctly
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImage, setCurrentImage] = useState(images[0] || "");

  // Get Google Drive token from settings
  const googleDriveToken = settings?.googleDrive?.accessToken;

  // Auto-cycle through images
  useEffect(() => {
    if (!images.length) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, settings.transitionDuration * 1000);

    return () => clearInterval(interval);
  }, [images, settings.transitionDuration]);

  // Update `currentImage` when `currentIndex` changes
  useEffect(() => {
    if (images.length) {
      setCurrentImage(images[currentIndex]);
    }
  }, [currentIndex, images]);

  // Debugging logs
  useEffect(() => {
    console.log("Current Image:", currentImage);
    console.log("Transition:", settings.transition);
    console.log("Duration:", settings.transitionDuration);
  }, [currentImage, settings.transition, settings.transitionDuration]);

  const transitions = useTransition(currentImage, {
    ...(transitionStyles[settings.transition] || transitionStyles.fade),
    config: {
      duration: settings.transitionDuration * 1000,
      tension: 200,
      friction: 20,
    },
  });

  return (
    <div className="relative w-full h-full overflow-hidden">
      {transitions((style, item) => (
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
          />
        </animated.div>
      ))}
    </div>
  );
}
