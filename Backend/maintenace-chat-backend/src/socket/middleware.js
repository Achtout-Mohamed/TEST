// socket/middleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/server'); // Adjust path as needed
const logger = require('../utils/logger');

/**
 * Socket.IO authentication middleware
 * Verifies JWT token and attaches user to socket
 */
const authMiddleware = async (socket, next) => {
  try {
    // Get token from socket handshake auth or headers
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication token is required'));
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    if (!decoded || !decoded.userId) {
      return next(new Error('Invalid token'));
    }
    
    // Find user
const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }
    
    // Attach user data to socket
    socket.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email
    };
    
    logger.info(`Socket authenticated: ${user._id}`);
    next();
  } catch (error) {
    logger.error(`Socket authentication error: ${error.message}`);
    next(new Error('Authentication failed'));
  }
};

module.exports = { authMiddleware };