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
      
      if (storedAuth === 'true' && storedToken) {
        setIsAuthenticated(true);
        if (storedUser) {
          try {
            setAdminUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Error parsing stored user data', e);
          }
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);
  
  // Login function - use the API login endpoint with phone number
  const login = async (phoneNumber, password) => {
    try {
      setLoading(true);
      
      // Call the login API with phone number
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/login-admins`, 
        { phone: phoneNumber, password }, // Changed from email to phone
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ).catch(error => {
        console.error('Login API error:', error.response || error);
        throw new Error('Login failed. Please check your credentials.');
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
              import.meta.env.VITE_SECRET_KEY
            );
            console.log('User data decrypted successfully');
          } catch (decryptError) {
            console.error('Error decrypting user data:', decryptError);
          }
        }
        
        // Store authentication state in localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('adminToken', token);
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
            `${import.meta.env.VITE_API_BASE_URL}/logout-admin`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
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
