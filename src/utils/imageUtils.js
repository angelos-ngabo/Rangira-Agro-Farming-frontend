





const IMAGE_VERSION = process.env.REACT_APP_IMAGE_VERSION || 
  (process.env.NODE_ENV === 'development' ? Date.now() : '1.0.0');


export const getImageUrl = (imagePath, version = null) => {
  if (!imagePath) return '';
  
  

  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  

  const cacheBuster = version || IMAGE_VERSION;
  
  

  return `${cleanPath}?v=${cacheBuster}`;
};


export const getPublicImageUrl = (imageName, version = null) => {
  return getImageUrl(`/images/${imageName}`, version);
};


export const getHeroImageUrl = (heroNumber = 1) => {
  return getPublicImageUrl(`hero_${heroNumber}.jpg`);
};


export const getLogoUrl = () => {
  return getPublicImageUrl('logo.png');
};


export const getImage = (imageName) => {
  return getPublicImageUrl(imageName);
};

