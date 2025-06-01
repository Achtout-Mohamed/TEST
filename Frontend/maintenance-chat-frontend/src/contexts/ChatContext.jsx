// src/contexts/ChatContext.jsx

import React, { createContext, useState, useEffect, useCallback } from 'react';
import chatService from '../services/chatService';
import { useAuth } from '../hooks/useAuth'; // Using your authentication hook

// Create the context
const ChatContext = createContext();

// Chat provider component
export const ChatProvider = ({ children }) => {
  const { isAuthenticated } = useAuth(); // Removed unused user variable
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  // Fetch all conversations
  const fetchConversations = useCallback(async (params = {}) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await chatService.getConversations(params);
      
      setConversations(response.data || []);
      setPagination({
        currentPage: response.currentPage || 1,
        totalPages: response.totalPages || 1,
        total: response.total || 0
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch conversations');
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch a single conversation by ID
  const fetchConversation = useCallback(async (conversationId) => {
    if (!isAuthenticated || !conversationId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await chatService.getConversation(conversationId);
      setCurrentConversation(response.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch conversation');
      console.error(`Error fetching conversation ${conversationId}:`, err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Create a new conversation
  const createConversation = useCallback(async (conversationData) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await chatService.createConversation(conversationData);
      
      // Add the new conversation to the list
      setConversations(prev => [response.data, ...prev]);
      
      // Set as current conversation
      setCurrentConversation(response.data);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create conversation');
      console.error('Error creating conversation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Update a conversation
  const updateConversation = useCallback(async (conversationId, updateData) => {
    if (!isAuthenticated || !conversationId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await chatService.updateConversation(conversationId, updateData);
      
      // Update the conversation in the list
      setConversations(prev => 
        prev.map(conv => conv._id === conversationId ? response.data : conv)
      );
      
      // Update current conversation if it's the one being edited
      if (currentConversation && currentConversation._id === conversationId) {
        setCurrentConversation(response.data);
      }
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update conversation');
      console.error(`Error updating conversation ${conversationId}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentConversation]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId) => {
    if (!isAuthenticated || !conversationId) return;
    
    try {
      setLoading(true);
      setError(null);
      await chatService.deleteConversation(conversationId);
      
      // Remove the conversation from the list
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));
      
      // Clear current conversation if it's the one being deleted
      if (currentConversation && currentConversation._id === conversationId) {
        setCurrentConversation(null);
      }
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete conversation');
      console.error(`Error deleting conversation ${conversationId}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentConversation]);

  // Add participants to a conversation
  const addParticipants = useCallback(async (conversationId, participantIds) => {
    if (!isAuthenticated || !conversationId || !participantIds.length) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await chatService.addParticipants(conversationId, participantIds);
      
      // Update the conversation in the list
      setConversations(prev => 
        prev.map(conv => conv._id === conversationId ? response.data : conv)
      );
      
      // Update current conversation if it's the one being edited
      if (currentConversation && currentConversation._id === conversationId) {
        setCurrentConversation(response.data);
      }
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add participants');
      console.error(`Error adding participants to conversation ${conversationId}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentConversation]);

  // Remove a participant from a conversation
  const removeParticipant = useCallback(async (conversationId, userId) => {
    if (!isAuthenticated || !conversationId || !userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await chatService.removeParticipant(conversationId, userId);
      
      // Update the conversation in the list
      setConversations(prev => 
        prev.map(conv => conv._id === conversationId ? response.data : conv)
      );
      
      // Update current conversation if it's the one being edited
      if (currentConversation && currentConversation._id === conversationId) {
        setCurrentConversation(response.data);
      }
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove participant');
      console.error(`Error removing participant ${userId} from conversation ${conversationId}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentConversation]);

  // Search conversations
  const searchConversations = useCallback(async (query) => {
    if (!isAuthenticated || !query) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await chatService.searchConversations(query);
      setSearchResults(response.data || []);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search conversations');
      console.error('Error searching conversations:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Clear search results
  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  // Load initial conversations
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  // Value to be provided by the context
  const value = {
    conversations,
    currentConversation,
    loading,
    error,
    searchResults,
    pagination,
    fetchConversations,
    fetchConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    addParticipants,
    removeParticipant,
    searchConversations,
    clearSearchResults,
    setCurrentConversation
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;