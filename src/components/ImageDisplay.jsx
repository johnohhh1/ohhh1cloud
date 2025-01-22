// Add a special transition when showing new images
const transition = image?.isNew 
  ? 'zoom-in'  // or any special transition you want
  : settings.transition; 