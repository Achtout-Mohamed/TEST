// src/components/Chat/MessageList.jsx - Updated with Socket.IO integration

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import MessageItem from './MessageItem';
import './MessageList.css';

const MessageList = () => {
  const { messages, loading, error, hasMore, loadMoreMessages } = useMessages();
  const { user } = useAuth();
  const { sendReadReceipt, connected } = useSocket();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // State to track which messages have been read
  const [readMessages, setReadMessages] = useState(new Set());
  
  // Group messages by date
  const messageGroups = useMemo(() => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages
    }));
  }, [messages]);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle scroll for loading more messages
  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop } = messagesContainerRef.current;
        
        // If scrolled to top and has more messages, load more
        if (scrollTop < 50 && hasMore && !loading) {
          loadMoreMessages();
        }
      }
    };
    
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasMore, loading, loadMoreMessages]);
  
  // Send read receipts for visible messages
  useEffect(() => {
    if (!connected || !user || messages.length === 0) return;
    
    // Calculate which messages are visible and not sent by the current user
    const unreadMessages = messages.filter(
      message => 
        message.sender?._id !== user._id && 
        !readMessages.has(message._id) &&
        (!message.readBy || !message.readBy.includes(user._id))
    );
    
    if (unreadMessages.length > 0) {
      // Mark messages as read locally
      const newReadMessages = new Set(readMessages);
      
      unreadMessages.forEach(message => {
        // Send read receipt to server
        sendReadReceipt(message._id);
        newReadMessages.add(message._id);
      });
      
      setReadMessages(newReadMessages);
    }
  }, [messages, user, connected, readMessages, sendReadReceipt]);
  
  // Format date for message groups
  const formatDate = (dateString) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if message is from today or yesterday
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };
  
  if (loading && messages.length === 0) {
    return <div className="messages-loading">Loading messages...</div>;
  }
  
  if (error) {
    return <div className="messages-loading">Error: {error}</div>;
  }
  
  if (messages.length === 0) {
    return <div className="no-messages">No messages yet. Start the conversation!</div>;
  }
  
  return (
    <div 
      className="messages-list" 
      ref={messagesContainerRef}
    >
      {loading && hasMore && (
        <div className="load-more-indicator">
          Loading older messages...
        </div>
      )}
      
      {!loading && hasMore && (
        <div className="load-more-indicator">
          Scroll up for older messages
        </div>
      )}
      
      {messageGroups.map(group => (
        <div key={group.date} className="message-group">
          <div className="date-divider">
            <div className="date-divider-line"></div>
            <div className="date-divider-text">{formatDate(group.date)}</div>
            <div className="date-divider-line"></div>
          </div>
          
          {group.messages.map(message => (
            <MessageItem 
              key={message._id} 
              message={message}
              isRead={
                message.readBy && 
                message.readBy.length > 0 && 
                message.sender?._id === user?._id
              }
            />
          ))}
        </div>
      ))}
      
      <div ref={messagesEndRef} />
      
      {/* Socket connection indicator */}
      {!connected && (
        <div className="socket-indicator">
          <div className="socket-offline">
            You are currently offline. Messages will be sent when you reconnect.
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;