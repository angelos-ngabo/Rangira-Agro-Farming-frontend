import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check for stored auth data
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      const userData = JSON.parse(storedUser);
      // Normalize user object: ensure both id and userId are available
      const normalizedUser = {
        ...userData,
        id: userData.userId || userData.id,
        userId: userData.userId || userData.id,
      };
      setToken(storedToken);
      setUser(normalizedUser);
      // Update localStorage with normalized user
      localStorage.setItem('user', JSON.stringify(normalizedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      // Check if 2FA is required
      if (response.requires2FA) {
        return { success: false, requires2FA: true, email: response.email };
      }
      
      // If token exists, login is complete
      if (response.token) {
        const { token: authToken, ...userData } = response;
        // Normalize user object: ensure both id and userId are available
        const normalizedUser = {
          ...userData,
          id: userData.userId || userData.id,
          userId: userData.userId || userData.id,
        };
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setToken(authToken);
        setUser(normalizedUser);
        return { success: true, requires2FA: false };
      }
      
      // If no token and no 2FA flag, something went wrong
      throw new Error('Unexpected login response');
    } catch (error) {
      throw error;
    }
  };

  const loginWith2FA = async (email, code) => {
    try {
      const response = await authService.verify2FA(email, code);
      const { token: authToken, ...userData } = response;
      
      // Normalize user object: ensure both id and userId are available
      const normalizedUser = {
        ...userData,
        id: userData.userId || userData.id,
        userId: userData.userId || userData.id,
      };
      
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      setToken(authToken);
      setUser(normalizedUser);
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      // Don't auto-login after registration - user needs to verify email first
      // Just return success without saving token/user
      return { success: true, data: response };
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    const updatedUser = { 
      ...user, 
      ...userData,
      // Ensure both id and userId are always available
      id: userData.userId || userData.id || user?.id || user?.userId,
      userId: userData.userId || userData.id || user?.id || user?.userId,
      // Merge userProfile if provided
      userProfile: userData.userProfile ? {
        ...user?.userProfile,
        ...userData.userProfile
      } : user?.userProfile,
      // If profilePictureUrl is provided directly, also set it in userProfile
      profilePictureUrl: userData.profilePictureUrl !== undefined 
        ? userData.profilePictureUrl 
        : (userData.userProfile?.profilePictureUrl !== undefined 
          ? userData.userProfile.profilePictureUrl 
          : user?.profilePictureUrl),
    };
    // Ensure profilePictureUrl is also in userProfile if it exists
    if (updatedUser.profilePictureUrl !== undefined) {
      updatedUser.userProfile = {
        ...updatedUser.userProfile,
        profilePictureUrl: updatedUser.profilePictureUrl
      };
    }
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const setAuthData = (authToken, userData) => {
    // Normalize user object: ensure both id and userId are available
    const normalizedUser = {
      ...userData,
      id: userData.userId || userData.id,
      userId: userData.userId || userData.id,
    };
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setToken(authToken);
    setUser(normalizedUser);
  };

  const value = {
    user,
    token,
    loading,
    login,
    loginWith2FA,
    register,
    logout,
    updateUser,
    setAuthData,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.userType === 'ADMIN',
    isFarmer: user?.userType === 'FARMER',
    isBuyer: user?.userType === 'BUYER',
    isStorekeeper: user?.userType === 'STOREKEEPER',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


