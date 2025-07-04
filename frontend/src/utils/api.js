import axios from 'axios';
import { decryptData } from './decryptionHelper';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle common response patterns
export const fetchWithDecryption = async (endpoint, options = {}) => {
  try {
    const response = await api.get(endpoint, options);
    
    if (response.data && response.data.data) {
      return decryptData(response.data.data, import.meta.env.VITE_SECRET_KEY);
    }
    
    return null;
  } catch (error) {
    console.error(`API error in ${endpoint}:`, error);
    throw error;
  }
};

export const postWithAuth = async (endpoint, data, options = {}) => {
  try {
    const response = await api.post(endpoint, data, options);
    return response.data;
  } catch (error) {
    console.error(`API error in ${endpoint}:`, error);
    throw error;
  }
};

export default api;
