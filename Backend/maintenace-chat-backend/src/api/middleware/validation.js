// 2. Create middleware/validation.js - Route parameter validation
const mongoose = require('mongoose');

/**
 * Middleware to validate MongoDB ObjectID parameters
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: `${paramName} parameter is required`,
        error: 'MISSING_PARAMETER'
      });
    }
    
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format. Must be a valid MongoDB ObjectID.`,
        error: 'INVALID_OBJECT_ID',
        received: id
      });
    }
    
    next();
  };
};

/**
 * Middleware to validate conversation ID specifically
 */
const validateConversationId = validateObjectId('conversationId');

/**
 * General request validation middleware
 */
const validateRequest = (req, res, next) => {
  // Log suspicious requests
  const suspiciousPatterns = [
    /[^\w\-]/g, // Non-alphanumeric chars except hyphens
    /%[0-9A-F]{2}/g, // URL encoded chars
    /[🤖👋📊📄🔍💡❓]/g // Emojis
  ];
  
  const url = req.originalUrl;
  const hasSuspiciousChars = suspiciousPatterns.some(pattern => pattern.test(url));
  
  if (hasSuspiciousChars) {
    console.warn(`Suspicious URL detected: ${url} from IP: ${req.ip}`);
    
    // If it's clearly an invalid ObjectID in the URL, return 400 instead of 404
    const idMatch = url.match(/\/([^\/]+)$/);
    if (idMatch && idMatch[1] && !mongoose.isValidObjectId(idMatch[1])) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format. Resource IDs must be valid MongoDB ObjectIDs.',
        error: 'INVALID_URL_FORMAT'
      });
    }
  }
  
  next();
};

module.exports = {
  validateObjectId,
  validateConversationId,
  validateRequest
};