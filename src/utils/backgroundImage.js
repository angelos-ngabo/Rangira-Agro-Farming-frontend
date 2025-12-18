



export const getBackgroundImageUrl = (type = 'landing') => {
  try {
    

    if (type === 'auth') {
      

      const publicUrl = process.env.PUBLIC_URL || '';
      return `${publicUrl}/images/background-dashboard.jpg`;
    }
    

    const publicUrl = process.env.PUBLIC_URL || '';
    return `${publicUrl}/images/tea-plantation-background.jpg`;
  } catch (error) {
    

    return null;
  }
};



export const hasBackgroundImage = () => {
  

  return true; 

};

