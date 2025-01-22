// Add a special transition when showing new images
const transition = image?.isNew 
  ? 'zoom-in'  // or any special transition you want
  : settings.transition; 

<img 
  src={currentImage} 
  alt="Slideshow image" 
  className={`w-full h-full object-contain transition-opacity duration-500`}
/> 