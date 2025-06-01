// src/contexts/SocketContext.jsx

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import socketService from '../services/socketService';

// Create context
export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  
  // Initialize socket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      // Initialize socket connection
      socketService.connect(token);
      
      // Set up connection status handlers
      socketService.onConnect(() => {
        console.log('Socket connected');
        setConnected(true);
      });
      
      socketService.onDisconnect(() => {
        console.log('Socket disconnected');
        setConnected(false);
      });
      
      // Clean up on component unmount
      return () => {
        socketService.disconnect();
        setConnected(false);
      };
    }
  }, [isAuthenticated, token]);
  
  // Join a conversation
  const joinConversation = useCallback((conversationId) => {
    if (connected && conversationId) {
      // Leave current conversation if different
      if (currentConversationId && currentConversationId !== conversationId) {
        socketService.leaveConversation(currentConversationId);
      }
      
      // Join new conversation
      socketService.joinConversation(conversationId);
      setCurrentConversationId(conversationId);
    }
  }, [connected, currentConversationId]);
  
  // Leave current conversation
  const leaveConversation = useCallback(() => {
    if (connected && currentConversationId) {
      socketService.leaveConversation(currentConversationId);
      setCurrentConversationId(null);
    }
  }, [connected, currentConversationId]);
  
  // Send a message via socket
  const sendMessage = useCallback((message) => {
    if (connected) {
      return socketService.sendMessage(message);
    }
    return false;
  }, [connected]);
  
  // Send typing indicator
  const sendTyping = useCallback((isTyping) => {
    if (connected && currentConversationId) {
      socketService.sendTyping(currentConversationId, isTyping);
    }
  }, [connected, currentConversationId]);
  
  // Send read receipt
  const sendReadReceipt = useCallback((messageId) => {
    if (connected && currentConversationId) {
      socketService.sendReadReceipt(currentConversationId, messageId);
    }
  }, [connected, currentConversationId]);
  
  // Subscribe to socket events
  const subscribeToMessages = useCallback((callback) => {
    return socketService.subscribeToMessages(callback);
  }, []);
  
  const subscribeToTyping = useCallback((callback) => {
    return socketService.subscribeToTyping(callback);
  }, []);
  
  const subscribeToReadReceipts = useCallback((callback) => {
    return socketService.subscribeToReadReceipts(callback);
  }, []);
  
  const subscribeToOnlineStatus = useCallback((callback) => {
    return socketService.subscribeToOnlineStatus(callback);
  }, []);
  
  // Context value
  const value = {
    connected,
    currentConversationId,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    sendReadReceipt,
    subscribeToMessages,
    subscribeToTyping,
    subscribeToReadReceipts,
    subscribeToOnlineStatus
  };
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;