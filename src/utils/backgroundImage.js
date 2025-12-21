// Utility to get background image URL
// This handles the case where the image might not exist yet
export const getBackgroundImageUrl = (type = 'landing') => {
  try {
    // For auth pages, use background-dashboard.jpg
    if (type === 'auth') {
      // Use direct path - in Create React App, public folder files are served from root
      const publicUrl = process.env.PUBLIC_URL || '';
      return `${publicUrl}/images/background-dashboard.jpg`;
    }
    // For landing page, use tea-plantation-background.jpg
    const publicUrl = process.env.PUBLIC_URL || '';
    return `${publicUrl}/images/tea-plantation-background.jpg`;
  } catch (error) {
    // Fallback to gradient
    return null;
  }
};

// Check if image exists (for conditional rendering)
export const hasBackgroundImage = () => {
  // This will be true once the image is added to public/images/
  return true; // Set to false if you want to disable until image is added
};

