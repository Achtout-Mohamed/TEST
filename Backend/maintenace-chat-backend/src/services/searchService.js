import api from './api';

export const searchService = {
  // Search conversations and groups
  async search(query, filters = {}) {
    try {
      const response = await api.post('/search', {
        query,
        filters
      });
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Search failed');
    }
  },
  
  // Search conversations only
  async searchConversations(query, filters = {}) {
    try {
      const response = await api.post('/search/conversations', {
        query,
        filters
      });
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Conversation search failed');
    }
  },
  
  // Search messages only
  async searchMessages(query, filters = {}) {
    try {
      const response = await api.post('/search/messages', {
        query,
        filters
      });
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Message search failed');
    }
  },
  
  // Get recent searches
  async getRecentSearches() {
    try {
      const response = await api.get('/search/recent');
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get recent searches');
    }
  },
  
  // Clear recent searches
  async clearRecentSearches() {
    try {
      const response = await api.delete('/search/recent');
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to clear recent searches');
    }
  }
};