import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});



/**
 * Request Interceptor
 * Automatically attaches the JWT 'Bearer' token to the Authorization header
 * of every outgoing HTTP request if a token exists in localStorage.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);



/**
 * Response Interceptor
 * Handles global API response errors, such as network failures and unauthorized access.
 * Automatically logs out the user and redirects to the login page upon a 401 response.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    

    if (!error.response) {
      

      console.warn(`Network error: Backend may not be running. Check ${process.env.REACT_APP_BACKEND_URL ?? 'http://localhost:8081'}`);
      

      return Promise.reject(error);
    }

    

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

