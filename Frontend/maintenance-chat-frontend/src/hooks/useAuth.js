// src/hooks/useAuth.js
import { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// This would go in your AuthContext.js file
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if the user is already authenticated (e.g., via token in localStorage)
  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    try {
      // Clear any previous errors
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        // No token found, user is not authenticated
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // Verify token with backend
      const response = await api.get('/auth/verify-token');
      
      if (response.success) {
        // Token is valid, set user data
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('auth_token');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      // In case of error, assume not authenticated
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
      setError('Authentication check failed');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Run auth check when component mounts
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);
  
  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.success) {
        // Store token
        localStorage.setItem('auth_token', response.token);
        
        // Set user data
        setUser(response.user);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        setError(response.message || 'Login failed');
        return { success: false };
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };
  
  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.success) {
        // Store token
        localStorage.setItem('auth_token', response.token);
        
        // Set user data
        setUser(response.user);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        setError(response.message || 'Registration failed');
        return { success: false };
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint if you have one
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear token and user data regardless of API response
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };
  
  const contextValue = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    checkAuthStatus
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};