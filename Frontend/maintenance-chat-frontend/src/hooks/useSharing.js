import { useState, useCallback } from 'react';
import { sharingService } from '../services/sharingService';

export const useSharing = (conversationId) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Share conversation with users
  const shareConversation = useCallback(async (users) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await sharingService.shareConversation(conversationId, users);
      return result.success;
    } catch (err) {
      setError(err.message || 'Failed to share conversation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [conversationId]);
  
  // Get users the conversation is shared with
  const getSharedUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await sharingService.getSharedUsers(conversationId);
      return result.users;
    } catch (err) {
      setError(err.message || 'Failed to get shared users');
      return [];
    } finally {
      setLoading(false);
    }
  }, [conversationId]);
  
  // Remove shared access for a user
  const removeSharedUser = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await sharingService.removeSharedAccess(conversationId, userId);
      return result.success;
    } catch (err) {
      setError(err.message || 'Failed to remove shared access');
      return false;
    } finally {
      setLoading(false);
    }
  }, [conversationId]);
  
  // Generate shareable link
  const generateShareLink = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await sharingService.generateShareLink(conversationId);
      return result.link;
    } catch (err) {
      setError(err.message || 'Failed to generate share link');
      return '';
    } finally {
      setLoading(false);
    }
  }, [conversationId]);
  
  return {
    shareConversation,
    getSharedUsers,
    removeSharedUser,
    generateShareLink,
    loading,
    error
  };
};