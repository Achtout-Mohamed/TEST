// src/services/messageService.js

import api from './api';

/**
 * Service for handling message-related API calls
 */
const messageService = {
  /**
   * Get messages for a conversation
   * @param {string} conversationId - ID of the conversation
   * @param {Object} params - Query parameters for pagination
   * @returns {Promise} - Promise with messages data
   */
  getMessages: async (conversationId, params = {}) => {
    try {
      const { page = 1, limit = 20 } = params;
      const queryString = new URLSearchParams({
        page,
        limit
      }).toString();
      
      const response = await api.get(`/conversations/${conversationId}/messages?${queryString}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },

  /**
   * Send a new message
   * @param {Object} messageData - The message data
   * @returns {Promise} - Promise with the created message
   */
  sendMessage: async (messageData) => {
    try {
      const response = await api.post('/messages', messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },

  /**
   * Update an existing message
   * @param {string} messageId - ID of the message to update
   * @param {Object} updateData - Data to update
   * @returns {Promise} - Promise with updated message
   */
  updateMessage: async (messageId, updateData) => {
    try {
      const response = await api.put(`/messages/${messageId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Error updating message ${messageId}:`, error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },

  /**
   * Delete a message
   * @param {string} messageId - ID of the message to delete
   * @returns {Promise} - Promise with deletion result
   */
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting message ${messageId}:`, error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },

  /**
   * Search messages
   * @param {string} query - Search query string
   * @param {string} conversationId - Optional: limit search to a specific conversation
   * @returns {Promise} - Promise with search results
   */
  searchMessages: async (query, conversationId = null) => {
    try {
      let queryParams = new URLSearchParams({ query });
      
      if (conversationId) {
        queryParams.append('conversationId', conversationId);
      }
      
      const response = await api.get(`/messages/search?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error searching messages:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  }
};

export default messageService;