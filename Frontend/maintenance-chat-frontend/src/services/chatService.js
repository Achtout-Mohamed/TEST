// src/services/chatService.js

import api from './api';

/**
 * Service for handling conversation-related API calls
 */
const chatService = {
  /**
   * Get all conversations for the current user
   * @param {Object} params - Query parameters for pagination and search
   * @returns {Promise} - Promise with conversations data
   */
  getConversations: async (params = {}) => {
    try {
      const { page = 1, limit = 10, search = '' } = params;
      const queryString = new URLSearchParams({
        page,
        limit,
        ...(search && { search })
      }).toString();
      
      const response = await api.get(`/conversations?${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  /**
   * Get a single conversation by ID
   * @param {string} id - Conversation ID
   * @returns {Promise} - Promise with conversation data
   */
  getConversation: async (id) => {
    try {
      const response = await api.get(`/conversations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching conversation ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new conversation
   * @param {Object} conversationData - The conversation data
   * @returns {Promise} - Promise with the created conversation
   */
  createConversation: async (conversationData) => {
    try {
      const response = await api.post('/conversations', conversationData);
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  /**
   * Update an existing conversation
   * @param {string} id - Conversation ID
   * @param {Object} updateData - Data to update
   * @returns {Promise} - Promise with updated conversation
   */
  updateConversation: async (id, updateData) => {
    try {
      const response = await api.put(`/conversations/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Error updating conversation ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a conversation
   * @param {string} id - Conversation ID
   * @returns {Promise} - Promise with deletion result
   */
  deleteConversation: async (id) => {
    try {
      const response = await api.delete(`/conversations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting conversation ${id}:`, error);
      throw error;
    }
  },

  /**
   * Add participants to a conversation
   * @param {string} conversationId - Conversation ID
   * @param {Array} participantIds - Array of user IDs to add
   * @returns {Promise} - Promise with updated conversation
   */
  addParticipants: async (conversationId, participantIds) => {
    try {
      const response = await api.post(`/conversations/${conversationId}/participants`, {
        participants: participantIds
      });
      return response.data;
    } catch (error) {
      console.error(`Error adding participants to conversation ${conversationId}:`, error);
      throw error;
    }
  },

  /**
   * Remove a participant from a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID to remove
   * @returns {Promise} - Promise with updated conversation
   */
  removeParticipant: async (conversationId, userId) => {
    try {
      const response = await api.delete(`/conversations/${conversationId}/participants/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error removing participant ${userId} from conversation ${conversationId}:`, error);
      throw error;
    }
  },

  /**
   * Search conversations by title or tags
   * @param {string} query - Search query string
   * @returns {Promise} - Promise with search results
   */
  searchConversations: async (query) => {
    try {
      const response = await api.get(`/conversations/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching conversations:', error);
      throw error;
    }
  }
};

export default chatService;