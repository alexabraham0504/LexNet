import axios from 'axios';

// Determine the base URL based on environment
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
export const API_BASE_URL = isMobile 
  ? `http://${window.location.hostname}:5000` 
  : window.location.hostname === 'localhost' 
    ? 'https://lexnet-backend.onrender.com' 
    : `http://${window.location.hostname}:5000`;

// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://lexnet-backend.onrender.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for CORS with credentials
});

// Add request interceptor to include auth token
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

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // Handle CORS errors
      console.error('CORS Error:', error);
    }
    return Promise.reject(error);
  }
);

export default api; 