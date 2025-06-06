// src/api/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const logger = require('../../utils/logger');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;
    // In your auth.js middleware, add this line:
console.log('Received token:', token ? 'Present' : 'Missing');
console.log('Token starts with:', token ? token.substring(0, 20) + '...' : 'N/A');
    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach user to request
      req.user = await User.findById(decoded.userId).select('-password');
      
      // Update last active timestamp
      await User.findByIdAndUpdate(decoded.userId, { lastActive: Date.now() });
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      next();
    } catch (error) {
      logger.error(`Token verification error: ${error.message}`);
      res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    res.status(500).json({ message: 'Server error in auth middleware' });
  }
};

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user found' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role (${req.user.role}) is not authorized to access this resource` 
      });
    }
    
    next();
  };
};