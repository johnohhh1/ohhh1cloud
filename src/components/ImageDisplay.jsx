import { getDisplayImageUrl, useStore } from '../store';

export default function ImageDisplay({ image }) {
  const { settings } = useStore();
  const googleDriveToken = settings?.googleDrive?.accessToken;
  const displayUrl = getDisplayImageUrl(image, googleDriveToken);
  const transition = image?.isNew 
    ? 'zoom-in'  // or any special transition you want
    : settings.transition; 

  return (
    <img 
      src={displayUrl} 
      alt="Slideshow image" 
      className={`w-full h-full object-contain transition-opacity duration-500`}
    />
  );
} 