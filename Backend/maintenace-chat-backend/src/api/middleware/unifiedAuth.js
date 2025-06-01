// Backend/maintenace-chat-backend/src/middleware/unifiedAuth.js - Unified Authentication Middleware

const authService = require('../../services/authService');
const logger = require('../../utils/logger');

/**
 * Unified authentication middleware for REST APIs and Socket.IO
 */
class UnifiedAuthMiddleware {
  /**
   * Express middleware for protecting REST API routes
   */
  static async protect(req, res, next) {
    try {
      const token = UnifiedAuthMiddleware.extractToken(req);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.',
          code: 'NO_TOKEN'
        });
      }

      const { user, decoded } = await authService.verifyToken(token);
      
      // Attach user and token info to request
      req.user = user;
      req.tokenData = decoded;
      req.authMethod = 'jwt';

      logger.debug(`REST API auth successful: ${user.email}`);
      next();
      
    } catch (error) {
      logger.warn(`REST API auth failed: ${error.message}`);
      
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.',
        code: UnifiedAuthMiddleware.getErrorCode(error),
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Socket.IO middleware for protecting socket connections
   */
  static socketAuth() {
    return async (socket, next) => {
      try {
        const token = UnifiedAuthMiddleware.extractSocketToken(socket);
        
        if (!token) {
          logger.warn('Socket auth failed: No token provided', {
            socketId: socket.id,
            handshake: socket.handshake.auth,
            headers: Object.keys(socket.handshake.headers)
          });
          return next(new Error('Authentication error: No token provided'));
        }

        const { user, decoded } = await authService.verifyToken(token);
        
        // Attach user info to socket
        socket.userId = user.id;
        socket.user = user;
        socket.tokenData = decoded;
        socket.authMethod = 'jwt';

        logger.info(`Socket auth successful: ${user.email} (${socket.id})`);
        next();
        
      } catch (error) {
        logger.warn(`Socket auth failed: ${error.message}`, {
          socketId: socket.id,
          error: error.message
        });
        
        next(new Error(`Authentication error: ${error.message}`));
      }
    };
  }

  /**
   * Role-based authorization middleware
   */
  static authorize(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      if (allowedRoles.length === 0) {
        // No specific roles required, just need to be authenticated
        return next();
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`Authorization failed: User ${req.user.email} with role ${req.user.role} attempted to access ${allowedRoles.join(', ')} restricted resource`);
        
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: allowedRoles,
          current: req.user.role
        });
      }

      next();
    };
  }

  /**
   * Socket.IO role-based authorization
   */
  static socketAuthorize(...allowedRoles) {
    return (socket, next) => {
      if (!socket.user) {
        return next(new Error('Authentication required'));
      }

      if (allowedRoles.length === 0) {
        return next();
      }

      if (!allowedRoles.includes(socket.user.role)) {
        logger.warn(`Socket authorization failed: User ${socket.user.email} with role ${socket.user.role} attempted to access ${allowedRoles.join(', ')} restricted resource`);
        return next(new Error('Access denied. Insufficient permissions.'));
      }

      next();
    };
  }

  /**
   * Optional authentication middleware (doesn't fail if no token)
   */
  static async optional(req, res, next) {
    try {
      const token = UnifiedAuthMiddleware.extractToken(req);
      
      if (token) {
        const { user, decoded } = await authService.verifyToken(token);
        req.user = user;
        req.tokenData = decoded;
        req.authMethod = 'jwt';
      }
      
      next();
      
    } catch (error) {
      // Don't fail on optional auth, just continue without user
      logger.debug(`Optional auth failed: ${error.message}`);
      next();
    }
  }

  /**
   * Refresh token middleware
   */
  static async refresh(req, res, next) {
    try {
      const token = UnifiedAuthMiddleware.extractToken(req);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required',
          code: 'NO_REFRESH_TOKEN'
        });
      }

      const { user } = await authService.verifyToken(token);
      
      // Generate new token
      const newToken = authService.generateToken(user);
      
      res.json({
        success: true,
        token: newToken,
        user: authService.sanitizeUser(user)
      });
      
    } catch (error) {
      logger.warn(`Token refresh failed: ${error.message}`);
      
      return res.status(401).json({
        success: false,
        message: 'Token refresh failed',
        code: UnifiedAuthMiddleware.getErrorCode(error)
      });
    }
  }

  /**
   * Extract token from Express request
   */
  static extractToken(req) {
    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      return req.headers.authorization.substring(7);
    }
    
    // Check query parameter (less secure, for special cases)
    if (req.query.token) {
      return req.query.token;
    }
    
    // Check cookies (if using cookie-based auth)
    if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }
    
    return null;
  }

  /**
   * Extract token from Socket.IO handshake
   */
  static extractSocketToken(socket) {
    // Check auth object (preferred method)
    if (socket.handshake.auth && socket.handshake.auth.token) {
      return socket.handshake.auth.token;
    }
    
    // Check Authorization header
    if (socket.handshake.headers.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      return authHeader;
    }
    
    // Check query parameters
    if (socket.handshake.query && socket.handshake.query.token) {
      return socket.handshake.query.token;
    }
    
    return null;
  }

  /**
   * Get standardized error code from error
   */
  static getErrorCode(error) {
    if (error.name === 'JsonWebTokenError') {
      return 'INVALID_TOKEN';
    } else if (error.name === 'TokenExpiredError') {
      return 'TOKEN_EXPIRED';
    } else if (error.message.includes('User not found')) {
      return 'USER_NOT_FOUND';
    } else if (error.message.includes('Token version mismatch')) {
      return 'TOKEN_INVALIDATED';
    } else {
      return 'AUTH_ERROR';
    }
  }

  /**
   * Create user context for logging and auditing
   */
  static getUserContext(req) {
    if (!req.user) return null;
    
    return {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      authProvider: req.user.authProvider,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
  }

  /**
   * Middleware to add user context to all requests
   */
  static addUserContext(req, res, next) {
    req.userContext = UnifiedAuthMiddleware.getUserContext(req);
    next();
  }
}

module.exports = UnifiedAuthMiddleware;