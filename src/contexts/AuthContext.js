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
    

    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      const userData = JSON.parse(storedUser);
      

      const normalizedUser = {
        ...userData,
        id: userData.userId || userData.id,
        userId: userData.userId || userData.id,
      };
      setToken(storedToken);
      setUser(normalizedUser);
      

      localStorage.setItem('user', JSON.stringify(normalizedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      

      if (response.requires2FA) {
        return { success: false, requires2FA: true, email: response.email };
      }
      
      

      if (response.token) {
        const { token: authToken, ...userData } = response;
        

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
      
      

      throw new Error('Unexpected login response');
    } catch (error) {
      throw error;
    }
  };

  const loginWith2FA = async (email, code) => {
    try {
      const response = await authService.verify2FA(email, code);
      const { token: authToken, ...userData } = response;
      
      

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
      

      id: userData.userId || userData.id || user?.id || user?.userId,
      userId: userData.userId || userData.id || user?.id || user?.userId,
      

      userProfile: userData.userProfile ? {
        ...user?.userProfile,
        ...userData.userProfile
      } : user?.userProfile,
      

      profilePictureUrl: userData.profilePictureUrl !== undefined 
        ? userData.profilePictureUrl 
        : (userData.userProfile?.profilePictureUrl !== undefined 
          ? userData.userProfile.profilePictureUrl 
          : user?.profilePictureUrl),
    };
    

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


