// socket/eventHandlers.js

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const logger = require('../utils/logger');

// In-memory storage for connected users and typing status
const userSockets = new Map();
const typingUsers = new Map();

/**
 * Handle user connection
 */
const handleConnection = (socket, io) => {
  const userId = socket.user._id;
  
  // Store socket ID for this user
  userSockets.set(userId, socket.id);
  
  logger.info(`User connected: ${userId}`);
  
  // Emit online status to conversations this user is part of
  emitUserStatus(userId, true, io);
};

/**
 * Handle user disconnection
 */
const handleDisconnect = (socket, io) => {
  const userId = socket.user._id;
  
  // Remove user from connected users
  userSockets.delete(userId);
  
  // Emit offline status
  emitUserStatus(userId, false, io);
  
  // Clear any typing indicators
  clearUserTypingStatus(userId, io);
  
  logger.info(`User disconnected: ${userId}`);
};

/**
 * Emit user online status to relevant conversations
 */
const emitUserStatus = async (userId, isOnline, io) => {
  try {
    // Find all conversations this user is part of
    const conversations = await Conversation.find({
      participants: userId
    });
    
    // Emit status to each conversation
    conversations.forEach(conversation => {
      io.to(conversation._id.toString()).emit('online_status', {
        userId,
        isOnline
      });
    });
  } catch (error) {
    logger.error(`Error emitting online status: ${error.message}`);
  }
};

/**
 * Handle join conversation
 */
const handleJoinConversation = async (socket, io, data) => {
  try {
    const { conversationId } = data;
    const userId = socket.user._id;
    
    // Validate user has access to this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      socket.emit('error', { message: 'Conversation not found or access denied' });
      return;
    }
    
    // Join the conversation room
    socket.join(conversationId);
    
    // Store current conversation in socket for easy access
    socket.currentConversation = conversationId;
    
    logger.info(`User ${userId} joined conversation ${conversationId}`);
    
    // Emit join event
    io.to(conversationId).emit('user_joined', {
      userId,
      userName: socket.user.name,
      conversationId
    });
    
    // Send online status of all participants to this user
    const participantIds = conversation.participants;
    
    participantIds.forEach(participantId => {
      const participantIdStr = participantId.toString();
      const isOnline = userSockets.has(participantIdStr);
      
      socket.emit('online_status', {
        userId: participantIdStr,
        isOnline
      });
    });
  } catch (error) {
    logger.error(`Error joining conversation: ${error.message}`);
    socket.emit('error', { message: 'Failed to join conversation' });
  }
};

/**
 * Handle leave conversation
 */
const handleLeaveConversation = (socket, io, data) => {
  const { conversationId } = data;
  const userId = socket.user._id;
  
  // Leave the room
  socket.leave(conversationId);
  
  // Clear conversation from socket
  delete socket.currentConversation;
  
  // Clear typing status
  clearUserTypingInConversation(userId, conversationId, io);
  
  logger.info(`User ${userId} left conversation ${conversationId}`);
  
  // Emit leave event
  io.to(conversationId).emit('user_left', {
    userId,
    userName: socket.user.name,
    conversationId
  });
};

/**
 * Handle new message
 */
const handleNewMessage = async (socket, io, message) => {
  try {
    const conversationId = message.conversationId;
    
    if (!conversationId) {
      socket.emit('error', { message: 'Conversation ID is required' });
      return;
    }
    
    // Forward the message to all clients in this conversation
    io.to(conversationId).emit('new_message', message);
    
    // Clear typing indicator for this user
    clearUserTypingInConversation(socket.user._id, conversationId, io);
    
    logger.info(`New message in conversation ${conversationId} from ${socket.user._id}`);
  } catch (error) {
    logger.error(`Error handling new message: ${error.message}`);
    socket.emit('error', { message: 'Failed to process message' });
  }
};

/**
 * Handle typing indicator
 */
const handleTyping = (socket, io, data) => {
  const { conversationId, isTyping } = data;
  const userId = socket.user._id;
  
  if (!conversationId) {
    return;
  }
  
  // Initialize conversation tracking if not exists
  if (!typingUsers.has(conversationId)) {
    typingUsers.set(conversationId, new Map());
  }
  
  const typingInConversation = typingUsers.get(conversationId);
  
  if (isTyping) {
    // Add user to typing users with timestamp
    typingInConversation.set(userId, {
      name: socket.user.name,
      timestamp: Date.now()
    });
  } else {
    // Remove user from typing users
    typingInConversation.delete(userId);
    
    // Clean up if no one is typing
    if (typingInConversation.size === 0) {
      typingUsers.delete(conversationId);
    }
  }
  
  // Emit updated typing status
  emitTypingStatus(conversationId, io);
};

/**
 * Handle message read receipt
 */
const handleMessageRead = async (socket, io, data) => {
  try {
    const { conversationId, messageId } = data;
    const userId = socket.user._id;
    
    if (!conversationId || !messageId) {
      socket.emit('error', { message: 'Conversation ID and message ID are required' });
      return;
    }
    
    // Find message
    const message = await Message.findOne({ 
      _id: messageId,
      conversationId
    });
    
    if (!message) {
      socket.emit('error', { message: 'Message not found' });
      return;
    }
    
    // Check if user already marked as read
    const alreadyRead = message.readBy.some(read => 
      read.user.toString() === userId.toString()
    );
    
    if (!alreadyRead) {
      // Add user to readBy array
      message.readBy.push({
        user: userId,
        readAt: new Date()
      });
      
      await message.save();
      
      // Emit read receipt to all users in conversation
      io.to(conversationId).emit('message_read', {
        messageId,
        userId,
        conversationId,
        readAt: new Date()
      });
      
      logger.info(`Message ${messageId} marked as read by ${userId}`);
    }
  } catch (error) {
    logger.error(`Error handling message read: ${error.message}`);
    socket.emit('error', { message: 'Failed to mark message as read' });
  }
};

/**
 * Emit current typing status to a conversation
 */
const emitTypingStatus = (conversationId, io) => {
  if (!typingUsers.has(conversationId)) {
    return;
  }
  
  const typingInConversation = typingUsers.get(conversationId);
  const typingData = Array.from(typingInConversation).map(([userId, data]) => ({
    userId,
    name: data.name
  }));
  
  io.to(conversationId).emit('typing', {
    conversationId,
    users: typingData
  });
};

/**
 * Clear typing status for a user in a specific conversation
 */
const clearUserTypingInConversation = (userId, conversationId, io) => {
  if (typingUsers.has(conversationId)) {
    const typingInConversation = typingUsers.get(conversationId);
    
    if (typingInConversation.has(userId)) {
      typingInConversation.delete(userId);
      
      if (typingInConversation.size === 0) {
        typingUsers.delete(conversationId);
      }
      
      emitTypingStatus(conversationId, io);
    }
  }
};

/**
 * Clear all typing statuses for a user
 */
const clearUserTypingStatus = (userId, io) => {
  // Check all conversations
  for (const [conversationId, typingInConversation] of typingUsers.entries()) {
    if (typingInConversation.has(userId)) {
      typingInConversation.delete(userId);
      
      if (typingInConversation.size === 0) {
        typingUsers.delete(conversationId);
      } else {
        emitTypingStatus(conversationId, io);
      }
    }
  }
};

/**
 * Clean up expired typing indicators
 */
const cleanupTypingStatus = (io) => {
  const now = Date.now();
  const TYPING_TIMEOUT = 5000; // 5 seconds
  
  // Check all conversations
  for (const [conversationId, typingInConversation] of typingUsers.entries()) {
    let changed = false;
    
    // Check all users in this conversation
    for (const [userId, data] of typingInConversation.entries()) {
      if (now - data.timestamp > TYPING_TIMEOUT) {
        typingInConversation.delete(userId);
        changed = true;
      }
    }
    
    // If we deleted any expired typing indicators
    if (changed) {
      if (typingInConversation.size === 0) {
        typingUsers.delete(conversationId);
      } else {
        emitTypingStatus(conversationId, io);
      }
    }
  }
};

// Export all handlers and utilities
module.exports = {
  handleConnection,
  handleDisconnect,
  handleJoinConversation,
  handleLeaveConversation,
  handleNewMessage,
  handleTyping,
  handleMessageRead,
  cleanupTypingStatus,
  userSockets,
  typingUsers
};