/**
 * Image utility functions for loading images with cache-busting
 * This ensures new images load correctly even after browser caching
 */

// Image version - increment this when you update images to force browser refresh
// You can also set this via environment variable: REACT_APP_IMAGE_VERSION
const IMAGE_VERSION = process.env.REACT_APP_IMAGE_VERSION || 
  (process.env.NODE_ENV === 'development' ? Date.now() : '1.0.0');

/**
 * Get image URL with cache-busting query parameter
 * Uses version number to force browser refresh when images are updated
 * 
 * @param {string} imagePath - Path to image (e.g., '/images/hero_1.jpg')
 * @param {string|number} version - Optional version number override
 * @returns {string} Image URL with cache-busting parameter
 */
export const getImageUrl = (imagePath, version = null) => {
  if (!imagePath) return '';
  
  // Remove leading slash if present to ensure consistent path
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // Use provided version or the global IMAGE_VERSION
  const cacheBuster = version || IMAGE_VERSION;
  
  // Add cache-busting query parameter
  return `${cleanPath}?v=${cacheBuster}`;
};

/**
 * Get image URL from public/images folder
 * Convenience function for images in the public/images directory
 * 
 * @param {string} imageName - Image filename (e.g., 'hero_1.jpg', 'logo.png')
 * @param {string|number} version - Optional version number
 * @returns {string} Full image URL with cache-busting
 */
export const getPublicImageUrl = (imageName, version = null) => {
  return getImageUrl(`/images/${imageName}`, version);
};

/**
 * Get hero image URL
 * @param {number} heroNumber - Hero image number (1-5)
 * @returns {string} Hero image URL
 */
export const getHeroImageUrl = (heroNumber = 1) => {
  return getPublicImageUrl(`hero_${heroNumber}.jpg`);
};

/**
 * Get logo URL
 * @returns {string} Logo image URL
 */
export const getLogoUrl = () => {
  return getPublicImageUrl('logo.png');
};

/**
 * Get any image from public/images folder with cache-busting
 * This is the main function to use for all images to ensure they load correctly
 * 
 * @param {string} imageName - Image filename (e.g., 'hero_1.jpg', 'img-13.png')
 * @returns {string} Image URL with cache-busting
 */
export const getImage = (imageName) => {
  return getPublicImageUrl(imageName);
};

