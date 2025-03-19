import axios from 'axios';

const instance = axios.create({
  baseURL: window.location.hostname.includes('ngrok') 
    ? window.location.origin  // Use the ngrok URL when accessed via ngrok
    : 'http://localhost:5000', // Use localhost when accessed locally
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable credentials for CORS
});

// Add a request interceptor to add auth token
instance.interceptors.request.use(
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

export default instance; 