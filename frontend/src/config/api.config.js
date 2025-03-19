import axios from 'axios';

// Determine the base URL based on environment
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
export const API_BASE_URL = isMobile 
  ? `http://${window.location.hostname}:5000` 
  : window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : `http://${window.location.hostname}:5000`;

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Set to true for CORS with credentials
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Log the outgoing request
    console.log('Outgoing request:', {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: error.config
    });
    if (error.response?.status === 403) {
      // Handle CORS errors
      console.error('CORS Error:', error);
    }
    return Promise.reject(error);
  }
);

export default api; 