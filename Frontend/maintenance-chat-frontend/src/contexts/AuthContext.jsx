// import React, { createContext, useState, useEffect } from 'react';
// import api from '../services/api';

// // Create context
// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(localStorage.getItem('token'));
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
  
//   // Check if user is authenticated on mount
//   useEffect(() => {
//     const loadUserFromStorage = () => {
//       try {
//         // Get user from local storage
//         const storedUser = localStorage.getItem('user');
        
//         if (storedUser && token) {
//           const userData = JSON.parse(storedUser);
//           setUser(userData);
//           setNeedsRoleSelection(userData.needsRoleSelection || false);
//         }
        
//         setLoading(false);
//       } catch (error) {
//         console.error('Error loading user from storage:', error);
//         setLoading(false);
//       }
//     };
    
//     loadUserFromStorage();
//   }, [token]);
  
//   // Fetch current user profile if token exists but no user
//   useEffect(() => {
//     const fetchUserProfile = async () => {
//       if (token && !user) {
//         try {
//           setLoading(true);
          
//           const res = await api.get('/auth/me');
          
//           if (res.data.success) {
//             setUser(res.data.user);
//             localStorage.setItem('user', JSON.stringify(res.data.user));
//           }
//         } catch (error) {
//           console.error('Error fetching user profile:', error);
//           // Clear token if invalid
//           if (error.response && error.response.status === 401) {
//             localStorage.removeItem('token');
//             setToken(null);
//           }
//         } finally {
//           setLoading(false);
//         }
//       }
//     };
    
//     fetchUserProfile();
//   }, [token, user]);
  
//   // Register user
//   const register = async (userData) => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const res = await api.post('/auth/register', userData);
      
//       if (res.data.success) {
//         setUser(res.data.user);
//         setToken(res.data.token);
//         setNeedsRoleSelection(false);
//         localStorage.setItem('token', res.data.token);
//         localStorage.setItem('user', JSON.stringify(res.data.user));
//       }
      
//       return { success: true, data: res.data };
//     } catch (error) {
//       setError(error.response?.data?.message || 'Registration failed');
//       return { success: false, error: error.response?.data || error.message };
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   // Login user
//   const login = async (email, password) => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const res = await api.post('/auth/login', { email, password });
      
//       if (res.data.success) {
//         setUser(res.data.user);
//         setToken(res.data.token);
//         setNeedsRoleSelection(res.data.user.needsRoleSelection || false);
//         localStorage.setItem('token', res.data.token);
//         localStorage.setItem('user', JSON.stringify(res.data.user));
//       }
      
//       return { success: true, data: res.data };
//     } catch (error) {
//       setError(error.response?.data?.message || 'Login failed');
//       return { success: false, error: error.response?.data || error.message };
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Google OAuth login
//   const googleLogin = async (credential) => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const res = await api.post('/auth/google', { credential });
      
//       if (res.data.success) {
//         setUser(res.data.user);
//         setToken(res.data.token);
//         setNeedsRoleSelection(res.data.user.needsRoleSelection || false);
//         localStorage.setItem('token', res.data.token);
//         localStorage.setItem('user', JSON.stringify(res.data.user));
//       }
      
//       return { success: true, data: res.data };
//     } catch (error) {
//       setError(error.response?.data?.message || 'Google login failed');
//       return { success: false, error: error.response?.data || error.message };
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Update user role (for Google OAuth users)
//   const updateUserRole = async (role) => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const res = await api.put('/auth/role', { role });
      
//       if (res.data.success) {
//         const updatedUser = res.data.user;
//         setUser(updatedUser);
//         setNeedsRoleSelection(false);
//         localStorage.setItem('user', JSON.stringify(updatedUser));
//       }
      
//       return { success: true, data: res.data };
//     } catch (error) {
//       setError(error.response?.data?.message || 'Role update failed');
//       return { success: false, error: error.response?.data || error.message };
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   // Logout user
//   const logout = () => {
//     // Remove user from context
//     setUser(null);
//     setToken(null);
//     setNeedsRoleSelection(false);
    
//     // Remove from local storage
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//   };
  
//   // Update user profile
//   const updateProfile = async (userData) => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const res = await api.put('/users/profile', userData);
      
//       if (res.data.success) {
//         setUser(res.data.user);
//         localStorage.setItem('user', JSON.stringify(res.data.user));
//       }
      
//       return { success: true, data: res.data };
//     } catch (error) {
//       setError(error.response?.data?.message || 'Update profile failed');
//       return { success: false, error: error.response?.data || error.message };
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   // Change password
//   const changePassword = async (currentPassword, newPassword) => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const res = await api.put('/auth/password', { currentPassword, newPassword });
      
//       return { success: true, data: res.data };
//     } catch (error) {
//       setError(error.response?.data?.message || 'Change password failed');
//       return { success: false, error: error.response?.data || error.message };
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         token,
//         loading,
//         error,
//         needsRoleSelection,
//         register,
//         login,
//         googleLogin,
//         updateUserRole,
//         logout,
//         updateProfile,
//         changePassword,
//         isAuthenticated: !!user
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };


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
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        logout();
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
  const googleLogin = async (googleData) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.post('/auth/google', googleData);
      
      if (res.data.success) {
        const { token: newToken, user: newUser, needsRoleSelection: needsRole } = res.data;
        
        setToken(newToken);
        setUser(newUser);
        setNeedsRoleSelection(needsRole || false);
        
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        return { 
          success: true, 
          data: res.data,
          needsRoleSelection: needsRole 
        };
      } else {
        setError(res.data.message || 'Google login failed');
        return { success: false, error: res.data.message };
      }
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage = error.response?.data?.message || 'Google login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
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