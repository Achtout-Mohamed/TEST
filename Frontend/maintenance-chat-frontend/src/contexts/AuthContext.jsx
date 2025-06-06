import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

// Export the context for external use if needed
export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  // Initialize auth state
  useEffect(() => {
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');
  
  console.log('Auth init - stored data:', { hasUser: !!storedUser, hasToken: !!storedToken });
  
  if (storedUser && storedToken) {
    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setToken(storedToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      console.log('Auth restored for user:', userData.name);
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
}, []);

  // Set authorization header when token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.post('/auth/register', userData);
      
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        
        setToken(newToken);
        setUser(newUser);
        
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        return { success: true, data: res.data };
      } else {
        setError(res.data.message || 'Registration failed');
        return { success: false, error: res.data.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Login function
 const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.success) {
        setUser(res.data.user);
        setToken(res.data.token);
        setNeedsRoleSelection(res.data.user.needsRoleSelection || false);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      
      return { success: true, data: res.data };
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data || error.message };
    } finally {
      setLoading(false);
    }
  };

  // Google login function
  
const googleLogin = async (credential) => {
  try {
    setLoading(true);
    setError(null);
    
    const res = await api.post('/auth/google', { credential });
    
    console.log('Frontend received:', res);
    
    // Handle different response formats
    const token = res.token || res.data?.token;
    const user = res.user || res.data?.user;
    const success = res.success !== false && (token || user);
    
    if (success && token) {
      const needsRole = user?.needsRoleSelection || false;
      
      setToken(token);
      setUser(user);
      setNeedsRoleSelection(needsRole);
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { 
        success: true, 
        user: user,
        needsRoleSelection: needsRole 
      };
    } else {
      console.error('Invalid response format:', res);
      setError('Invalid server response');
      return { success: false, error: { message: 'Invalid server response' } };
    }
  } catch (error) {
    console.error('Google login error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Google login failed';
    setError(errorMessage);
    return { success: false, error: { message: errorMessage } };
  } finally {
    setLoading(false);
  }
};
  // Update user role function
  const updateUserRole = async (role) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.put('/auth/role', { role });
      
      if (res.data.success) {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        setNeedsRoleSelection(false);
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        return { success: true, data: res.data };
      } else {
        setError(res.data.message || 'Role update failed');
        return { success: false, error: res.data.message };
      }
    } catch (error) {
      console.error('Role update error:', error);
      const errorMessage = error.response?.data?.message || 'Role update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile function
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Updating profile with data:', {
        name: profileData.name,
        hasAvatar: !!profileData.avatar,
        avatarSize: profileData.avatar ? profileData.avatar.length : 0,
        hasPassword: !!profileData.newPassword
      });

      const res = await api.put('/auth/profile', profileData);
      
      if (res.data.success) {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        return { 
          success: true, 
          data: res.data,
          message: 'Profile updated successfully!'
        };
      } else {
        return { 
          success: false, 
          error: res.data.message || 'Update failed' 
        };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      
      let errorMessage = 'Failed to update profile';
      
      if (error.response) {
        if (error.response.status === 413) {
          errorMessage = 'Image too large. Please try a smaller image.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.put('/auth/password', passwordData);
      
      if (res.data.success) {
        return { success: true, data: res.data };
      } else {
        setError(res.data.message || 'Password change failed');
        return { success: false, error: res.data.message };
      }
    } catch (error) {
      console.error('Password change error:', error);
      const errorMessage = error.response?.data?.message || 'Password change failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      setNeedsRoleSelection(false);
      setError(null);
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      delete api.defaults.headers.common['Authorization'];
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  };

  // Context value
  const value = {
    user,
    token,
    loading,
    error,
    needsRoleSelection,
    register,
    login,
    googleLogin,
    updateUserRole,
    updateProfile,
    changePassword,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};