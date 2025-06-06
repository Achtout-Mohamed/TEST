// import React, { createContext, useState, useCallback, useEffect } from 'react';
// import { useChat } from '../hooks/useChat';
// import messageService from '../services/messageService';

// // Create context
// const MessageContext = createContext();

// // Message provider component
// export const MessageProvider = ({ children }) => {
//   const { currentConversation } = useChat();
//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [pagination, setPagination] = useState({
//     currentPage: 1,
//     totalPages: 1,
//     total: 0
//   });
//   const [hasMore, setHasMore] = useState(true);

//   // Fetch messages for the current conversation
//   const fetchMessages = useCallback(async (conversationId, page = 1) => {
//     if (!conversationId) return;
    
//     try {
//       setLoading(true);
//       setError(null);
      
//       const response = await messageService.getMessages(conversationId, { page });
//       console.log('Fetched messages:', response);
      
//       if (page === 1) {
//         // First page, replace all messages
//         setMessages(response.data || []);
//       } else {
//         // Subsequent pages, append messages
//         setMessages(prev => [...prev, ...(response.data || [])]);
//       }
      
//       setPagination({
//         currentPage: response.currentPage || 1,
//         totalPages: response.totalPages || 1,
//         total: response.total || 0
//       });
      
//       // Check if there are more messages to load
//       setHasMore(response.currentPage < response.totalPages);
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to fetch messages');
//       console.error(`Error fetching messages for conversation ${conversationId}:`, err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Load more messages (pagination)
//   const loadMoreMessages = useCallback(() => {
//     if (!currentConversation || loading || !hasMore) return;
    
//     const nextPage = pagination.currentPage + 1;
//     fetchMessages(currentConversation._id, nextPage);
//   }, [currentConversation, loading, hasMore, pagination.currentPage, fetchMessages]);

//   // Send a new message
//   const sendMessage = useCallback(async (content, attachments = [], mentions = []) => {
//     if (!currentConversation) return;
    
//     try {
//       setLoading(true);
//       setError(null);
      
//       const messageData = {
//         conversationId: currentConversation._id,
//         content,
//         attachments,
//         mentions
//       };
      
//       console.log('Sending message:', messageData);
//       const response = await messageService.sendMessage(messageData);
//       console.log('Message sent response:', response);
      
//       // Add the new message to the messages array at the end (since we're sorting oldest first)
//       setMessages(prev => [...prev, response.data]);
      
//       return response.data;
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to send message');
//       console.error('Error sending message:', err);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, [currentConversation]);

//   // Update a message
//   const updateMessage = useCallback(async (messageId, content) => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const response = await messageService.updateMessage(messageId, { content });
      
//       // Update the message in the messages array
//       setMessages(prev => 
//         prev.map(msg => msg._id === messageId ? response.data : msg)
//       );
      
//       return response.data;
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to update message');
//       console.error(`Error updating message ${messageId}:`, err);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Delete a message
//   const deleteMessage = useCallback(async (messageId) => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       await messageService.deleteMessage(messageId);
      
//       // Remove the message from the messages array
//       setMessages(prev => prev.filter(msg => msg._id !== messageId));
      
//       return true;
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to delete message');
//       console.error(`Error deleting message ${messageId}:`, err);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Search messages
//   const searchMessages = useCallback(async (query, conversationId = null) => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const response = await messageService.searchMessages(query, conversationId);
      
//       return response.data || [];
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to search messages');
//       console.error('Error searching messages:', err);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Clear messages (when changing conversations)
//   const clearMessages = useCallback(() => {
//     setMessages([]);
//     setPagination({
//       currentPage: 1,
//       totalPages: 1,
//       total: 0
//     });
//     setHasMore(true);
//   }, []);

//   // Load messages when the current conversation changes
//   useEffect(() => {
//     if (currentConversation) {
//       clearMessages();
//       fetchMessages(currentConversation._id, 1);
//     }
//   }, [currentConversation, clearMessages, fetchMessages]);

//   // Create context value
//   const value = {
//     messages,
//     loading,
//     error,
//     pagination,
//     hasMore,
//     sendMessage,
//     updateMessage,
//     deleteMessage,
//     searchMessages,
//     loadMoreMessages,
//     clearMessages
//   };

//   return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
// };

// export default MessageContext;


// src/contexts/MessageContext.jsx - Updated with Socket.IO integration

import React, { createContext, useState, useCallback, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useSocket } from '../hooks/useSocket';
import messageService from '../services/messageService';

// Create context
const MessageContext = createContext();

// Message provider component
export const MessageProvider = ({ children }) => {
  const { currentConversation } = useChat();
  const { 
    subscribeToMessages, 
    subscribeToReadReceipts, 
    connected 
  } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  const [hasMore, setHasMore] = useState(true);

  // Fetch messages for the current conversation
  const fetchMessages = useCallback(async (conversationId, page = 1) => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await messageService.getMessages(conversationId, { page });
      console.log('Fetched messages:', response);
      
      // Ensure consistent ordering of messages (oldest to newest)
      const sortedMessages = [...(response.data || [])].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      if (page === 1) {
        // First page, replace all messages
        setMessages(sortedMessages);
      } else {
        // Subsequent pages, append messages (maintaining order)
        setMessages(prev => {
          const combined = [...prev, ...sortedMessages];
          return combined.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
      }
      
      setPagination({
        currentPage: response.currentPage || 1,
        totalPages: response.totalPages || 1,
        total: response.total || 0
      });
      
      // Check if there are more messages to load
      setHasMore(response.currentPage < response.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch messages');
      console.error(`Error fetching messages for conversation ${conversationId}:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(() => {
    if (!currentConversation || loading || !hasMore) return;
    
    const nextPage = pagination.currentPage + 1;
    fetchMessages(currentConversation._id, nextPage);
  }, [currentConversation, loading, hasMore, pagination.currentPage, fetchMessages]);

  // Send a new message
  const sendMessage = useCallback(async (messageData) => {
  if (!currentConversation) return;
  
  try {
    setLoading(true);
    setError(null);
    
    console.log('Sending message:', messageData);
    const response = await messageService.sendMessage(messageData);
    console.log('Message sent response:', response);
    
    // Don't add to state here - let socket handle it
    return response.data;
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to send message');
    console.error('Error sending message:', err);
    throw err;
  } finally {
    setLoading(false);
  }
}, [currentConversation]);

  // Update a message
  const updateMessage = useCallback(async (messageId, content) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await messageService.updateMessage(messageId, { content });
      
      // Update the message in the messages array
      setMessages(prev => 
        prev.map(msg => msg._id === messageId ? response.data : msg)
      );
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update message');
      console.error(`Error updating message ${messageId}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a message
  const deleteMessage = useCallback(async (messageId) => {
    try {
      setLoading(true);
      setError(null);
      
      await messageService.deleteMessage(messageId);
      
      // Remove the message from the messages array
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete message');
      console.error(`Error deleting message ${messageId}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search messages
  const searchMessages = useCallback(async (query, conversationId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await messageService.searchMessages(query, conversationId);
      
      // Ensure consistent ordering even for search results
      const sortedResults = [...(response.data || [])].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      return sortedResults;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search messages');
      console.error('Error searching messages:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle receiving new message via socket
  const handleNewMessage = useCallback((message) => {
    console.log('🔥 RECEIVED MESSAGE VIA SOCKET:', message);
    // Only add the message if it belongs to the current conversation
    if (currentConversation && message.conversationId === currentConversation._id) {
      setMessages(prev => {
        // Check if message already exists (to avoid duplicates)
        if (prev.some(msg => msg._id === message._id)) {
          return prev;
        }
        
        // Add new message and sort
        const updated = [...prev, message];
        return updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
    }
  }, [currentConversation]);

  // Handle message read status updates
  const handleReadReceipt = useCallback((receipt) => {
    if (currentConversation && receipt.conversationId === currentConversation._id) {
      setMessages(prev => 
        prev.map(msg => 
          msg._id === receipt.messageId 
            ? { ...msg, readBy: [...(msg.readBy || []), receipt.userId] }
            : msg
        )
      );
    }
  }, [currentConversation]);

  // Subscribe to socket events when connected and conversation changes
  useEffect(() => {
  if (connected && currentConversation) {
    console.log('🎯 Setting up socket subscriptions for conversation:', currentConversation._id);
    
    // Subscribe to new messages
    const unsubscribeMessages = subscribeToMessages(handleNewMessage);
    
    // Subscribe to read receipts
    const unsubscribeReadReceipts = subscribeToReadReceipts(handleReadReceipt);
    
    console.log('✅ Socket subscriptions active');
    
    // Cleanup on unmount or when conversation changes
    return () => {
      console.log('🧹 Cleaning up socket subscriptions');
      unsubscribeMessages();
      unsubscribeReadReceipts();
    };
  }
}, [connected, currentConversation]);

  // Clear messages (when changing conversations)
  const clearMessages = useCallback(() => {
    setMessages([]);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      total: 0
    });
    setHasMore(true);
  }, []);

  // Load messages when the current conversation changes
  useEffect(() => {
    if (currentConversation) {
      clearMessages();
      fetchMessages(currentConversation._id, 1);
    }
  }, [currentConversation, clearMessages, fetchMessages]);

  // Create context value
  const value = {
    messages,
    loading,
    error,
    pagination,
    hasMore,
    sendMessage,
    updateMessage,
    deleteMessage,
    searchMessages,
    loadMoreMessages,
    clearMessages
  };

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
};

export default MessageContext;