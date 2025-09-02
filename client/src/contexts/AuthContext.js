import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configure axios defaults
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://project-management-platform-ye0w.onrender.com/api' 
    : 'http://localhost:5000/api');
console.log('API URL configured as:', API_URL);
console.log('Environment:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('Force refresh - deployment check v2');

// Test backend connectivity
const testBackend = async () => {
  try {
    const response = await fetch('https://project-management-platform-ye0w.onrender.com/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log('Backend test response:', response.status, response.statusText);
    const data = await response.json();
    console.log('Backend test data:', data);
  } catch (error) {
    console.error('Backend test failed:', error);
  }
};
testBackend();

axios.defaults.baseURL = API_URL;

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add necessary headers for CORS
    config.headers['Content-Type'] = 'application/json';
    config.withCredentials = false; // Set to false for cross-origin requests
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Simple approach - just remove tokens and let the app handle the routing
      console.log('Authentication failed - tokens removed');
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Add timeout and detailed logging
          console.log('Verifying token with API...');
          const response = await axios.get('/auth/profile', { timeout: 8000 });
          console.log('Token verification successful');
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth verification failed:', error.message);
          // If API is down or token invalid, clear storage and continue
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          
          // Show toast only if it's not a network error
          if (!error.code || error.code !== 'ECONNABORTED') {
            toast.error('Session expired. Please login again.');
          }
        }
      }
      
      // Set loading to false after auth check
      setTimeout(() => setLoading(false), 100);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const { token, user: newUser } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);

      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/auth/profile', profileData);
      const updatedUser = response.data.user;

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put('/auth/change-password', {
        currentPassword,
        newPassword
      });

      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
