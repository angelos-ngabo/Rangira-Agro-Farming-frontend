import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  verify2FA: async (email, code) => {
    const response = await api.post('/auth/verify-2fa', { email, otpCode: code });
    return response.data;
  },

  send2FACode: async (email) => {
    const response = await api.post('/auth/send-2fa', { email });
    return response.data;
  },

  verifyOtp: async (email, otpCode) => {
    const response = await api.post('/auth/verify-otp', { email, otpCode });
    return response.data;
  },

  resendOtp: async (email) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.patch('/users/me/password', { 
      currentPassword, 
      newPassword 
    });
    return response.data;
  },
};
