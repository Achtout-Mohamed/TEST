// src/services/uploadService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Configure axios with auth
const apiClient = axios.create({
  baseURL: API_URL,
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const uploadService = {
  // Upload single file
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/attachments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Upload multiple files
  uploadFiles: async (files) => {
    const formData = new FormData();
    
    // Append all files
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await apiClient.post('/attachments/upload-multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Get attachment by ID
  getAttachment: async (id) => {
    try {
      const response = await apiClient.get(`/attachments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get attachment error:', error);
      throw error;
    }
  },

  // Delete attachment
  deleteAttachment: async (id) => {
    try {
      const response = await apiClient.delete(`/attachments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete attachment error:', error);
      throw error;
    }
  },

  // Get file URL for display/download
  getFileUrl: (attachment) => {
    if (attachment && attachment.url) {
      // If it's already a full URL, return as is
      if (attachment.url.startsWith('http')) {
        return attachment.url;
      }
      // Otherwise, prepend the server URL
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
      return `${serverUrl}${attachment.url}`;
    }
    return null;
  }
};

export default uploadService;