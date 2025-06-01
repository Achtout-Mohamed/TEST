// // socket/socketManager.js

// const socketIo = require('socket.io');
// const { authMiddleware } = require('./middleware');
// const {
//   handleConnection,
//   handleDisconnect,
//   handleJoinConversation,
//   handleLeaveConversation,
//   handleNewMessage,
//   handleTyping,
//   handleMessageRead,
//   cleanupTypingStatus
// } = require('./eventHandlers');
// const logger = require('../utils/logger');
// const socketConfig = require('../config/socket');

// /**
//  * Initialize Socket.IO on the HTTP server
//  */
// const { instrument } = require('@socket.io/admin-ui');
// const initializeSocket = (server) => {
//   // Create Socket.IO instance with configuration
//   const io = socketIo(server, {
//     cors: {
//       origin: process.env.CLIENT_URL || '*',
//       methods: ['GET', 'POST', 'PUT', 'DELETE'],
//       credentials: true
//     },
//     pingInterval: socketConfig.pingInterval || 25000,
//     pingTimeout: socketConfig.pingTimeout || 10000,
//     transports: socketConfig.transports || ['websocket', 'polling']
//   });
//    if (process.env.NODE_ENV === 'development') {
//     instrument(io, {
//       auth: false // or set up authentication
//     });
//   }
  
//   // Use authentication middleware
//   io.use(authMiddleware);
  
//   // Handle connections
//   io.on('connection', (socket) => {
//     // Call connection handler
//     handleConnection(socket, io);
    
//     // Set up event listeners
//     socket.on('join_conversation', (data) => {
//       handleJoinConversation(socket, io, data);
//     });
    
//     socket.on('leave_conversation', (data) => {
//       handleLeaveConversation(socket, io, data);
//     });
    
//     socket.on('send_message', (message) => {
//       handleNewMessage(socket, io, message);
//     });
    
//     socket.on('typing', (data) => {
//       handleTyping(socket, io, data);
//     });
    
//     socket.on('message_read', (data) => {
//       handleMessageRead(socket, io, data);
//     });
    
//     // Handle disconnection
//     socket.on('disconnect', () => {
//       handleDisconnect(socket, io);
//     });
    
//     // Handle errors
//     socket.on('error', (err) => {
//       logger.error(`Socket error from ${socket.user?._id || 'unknown user'}: ${err.message}`);
//     });
//   });
  
//   // Start periodic cleanup of typing status
//   setInterval(() => {
//     cleanupTypingStatus(io);
//   }, 1000);
  
//   logger.info('Socket.IO initialized');
  
//   return io;
// };

// module.exports = { initializeSocket };


const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Initialize Socket.IO on the HTTP server
 */
const initializeSocket = (server) => {
  console.log('🚀 Initializing Socket.IO server...');
  
  // Create Socket.IO instance with configuration
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    pingInterval: 25000,
    pingTimeout: 10000,
    transports: ['websocket', 'polling']
  });
  
  console.log('✅ Socket.IO server created');
  
  // Debug authentication middleware
  io.use(async (socket, next) => {
    console.log('🔐 Socket authentication attempt...');
    console.log('🔍 Handshake auth:', socket.handshake.auth);
    console.log('🔍 Handshake headers:', Object.keys(socket.handshake.headers));
    
    try {
      let token;
      
      // Check multiple sources for token
      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
        console.log('✅ Token found in handshake.auth');
      } else if (socket.handshake.headers.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        console.log('🔍 Authorization header:', authHeader);
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
          console.log('✅ Token found in authorization header (Bearer)');
        } else {
          token = authHeader;
          console.log('✅ Token found in authorization header (direct)');
        }
      }
      
      if (!token) {
        console.log('❌ No token found in any location');
        return next(new Error('Authentication error: No token provided'));
      }
      
      console.log('🔍 Token preview:', token.substring(0, 20) + '...');
      
      // Verify token
      console.log('🔐 Verifying JWT token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified. User ID:', decoded.userId);
      
      // Find user
      console.log('👤 Finding user in database...');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        console.log('❌ User not found in database');
        return next(new Error('Authentication error: User not found'));
      }
      
      console.log('✅ User found:', user.name, user.email);
      
      // Attach user to socket
      socket.userId = user._id;
      socket.user = user;
      
      console.log('🎉 Socket authentication successful');
      next();
      
    } catch (error) {
      console.log('💥 Socket authentication failed:', error.message);
      logger.error(`Socket authentication error: ${error.message}`);
      next(new Error('Authentication error: Invalid token'));
    }
  });
  
  // Handle connections
  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`🔌 User connected: ${user.name} (${user.email})`);
    
    // Join user to their personal room
    socket.join(`user_${socket.userId}`);
    
    // Send confirmation
    socket.emit('authenticated', {
      message: 'Successfully connected',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
    
    // Handle joining conversation rooms
    socket.on('join_conversation', (conversationId) => {
      console.log(`User ${user.name} joining conversation: ${conversationId}`);
      socket.join(`conversation_${conversationId}`);
      socket.emit('joined_conversation', { conversationId });
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId) => {
      console.log(`User ${user.name} leaving conversation: ${conversationId}`);
      socket.leave(`conversation_${conversationId}`);
      socket.emit('left_conversation', { conversationId });
    });

    // Handle new messages
    socket.on('send_message', async (data) => {
      try {
        console.log(`📨 Message from ${user.name}:`, data);
        
        // Validate message data
        if (!data.conversationId || !data.content) {
          socket.emit('message_error', { error: 'Invalid message data' });
          return;
        }

        // Create message object
        const messageData = {
          id: Date.now(),
          conversationId: data.conversationId,
          content: data.content,
          sender: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar
          },
          timestamp: new Date(),
          type: data.type || 'text'
        };

        // Send to all users in the conversation
        io.to(`conversation_${data.conversationId}`).emit('new_message', messageData);
        
        // Confirm message sent
        socket.emit('message_sent', { messageId: messageData.id });
        
      } catch (error) {
        console.log('💥 Error handling message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`👋 User disconnected: ${user.name} (${reason})`);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.log(`💥 Socket error for user ${user.name}:`, error);
    });
  });

  // Handle general IO errors
  io.on('error', (error) => {
    console.log('💥 Socket.IO server error:', error);
  });

  console.log('🎉 Socket.IO server initialized successfully');
  return io;
};

module.exports = { initializeSocket };