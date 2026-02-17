import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to inject User ID
api.interceptors.request.use((config) => {
  // Use the same test user ID as the backend
  const userId = localStorage.getItem('userId') || '507f1f77bcf86cd799439011';
  config.headers['x-user-id'] = userId;
  return config;
});

export default api;
