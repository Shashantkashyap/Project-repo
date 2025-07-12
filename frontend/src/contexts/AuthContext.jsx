import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { decryptData } from '../utils/decryptionHelper';

// Create context
const AuthContext = createContext();

// Auth provider component
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  
  // Check if user is already logged in (from localStorage in this demo)
  useEffect(() => {
    const checkAuth = async () => {
      const storedAuth = localStorage.getItem('isAuthenticated');
      const storedToken = localStorage.getItem('adminToken');
      const storedUser = localStorage.getItem('adminUser');
      const loginTime = localStorage.getItem('admin_login_time');
      
      if (storedAuth === 'true' && storedToken) {
        setIsAuthenticated(true);
        if (storedUser) {
          try {
            setAdminUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Error parsing stored user data', e);
          }
        }
      } else {
        // Check for persisted admin login
        const token = localStorage.getItem('admin_token');
        if (token && loginTime) {
          const now = Date.now();
          // If login time is within 24 hours
          if (now - Number(loginTime) < 24 * 60 * 60 * 1000) {
            setIsAuthenticated(true);
          } else {
            // Expired
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_login_time');
            setIsAuthenticated(false);
          }
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);
  
  // Safe encryption function
  const safeEncrypt = (data, secretKey) => {
    try {
      // Validate inputs
      if (!data || !secretKey) {
        throw new Error('Invalid data or secret key for encryption');
      }
      
      // Ensure data is a string
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Validate secret key
      if (typeof secretKey !== 'string' || secretKey.length === 0) {
        throw new Error('Invalid secret key');
      }
      
      // Perform encryption
      const encrypted = CryptoJS.AES.encrypt(dataString, secretKey);
      return encrypted.toString();
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data: ' + error.message);
    }
  };
  
  // Login function - use the API login endpoint with phone number
  const login = async (phoneNumber, password) => {
    try {
      setLoading(true);

      // Validate inputs
      if (!phoneNumber || !password) {
        throw new Error('Phone number and password are required');
      }

      // Get secret key with fallback
      const secretKey = import.meta.env.VITE_SECRET_KEY;
      if (!secretKey) {
        throw new Error('Secret key not configured');
      }

      // Prepare data for encryption
      const loginData = { phone: phoneNumber, password };
      
      // Safe encryption
      let encryptedData;
      try {
        encryptedData = safeEncrypt(loginData, secretKey);
      } catch (encryptError) {
        console.error('Encryption failed:', encryptError);
        throw new Error('Failed to encrypt login data');
      }
      
      // Call the login API with phone number
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/login-admins`,
        { data: encryptedData },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true,
          timeout: 10000 // 10 second timeout
        }
      ).catch(error => {
        console.error('Login API error:', error.response || error);
        if (error.response?.status === 401) {
          throw new Error('Invalid credentials');
        } else if (error.response?.status === 404) {
          throw new Error('Login service not found');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please try again.');
        } else {
          throw new Error('Login failed. Please check your credentials.');
        }
      });
      
      if (response.data && response.data.success) {
        // Extract token from response
        const token = response.data.token || '';
        
        // Get and decrypt user data if available
        let userData = null;
        if (response.data.data) {
          try {
            userData = decryptData(
              response.data.data,
              secretKey
            );
            console.log('User data decrypted successfully');
          } catch (decryptError) {
            console.error('Error decrypting user data:', decryptError);
            // Don't throw error here, continue with login
          }
        }
        
        // Store authentication state in localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('adminToken', token);
        localStorage.setItem('admin_token', 'some_flag');
        localStorage.setItem('admin_login_time', Date.now().toString());
        if (userData) {
          localStorage.setItem('adminUser', JSON.stringify(userData));
          setAdminUser(userData);
        }
        
        setIsAuthenticated(true);
        return true;
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      // Call logout API if available
      const token = localStorage.getItem('adminToken');
      if (token) {
        try {
          await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/admin/logout-admin`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${token}`
              },
              withCredentials: true
            }
          );
        } catch (logoutError) {
          console.warn('Logout API call failed:', logoutError);
          // Continue with logout even if API call fails
        }
      }
      
      // Clear local storage
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_login_time');
      
      // Update state
      setIsAuthenticated(false);
      setAdminUser(null);
      
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };
  
  const value = {
    isAuthenticated,
    loading,
    adminUser,
    login,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}