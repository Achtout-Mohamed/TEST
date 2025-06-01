// Backend/maintenace-chat-backend/src/services/authService.js - Unified Authentication Service

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const logger = require('../utils/logger');

class AuthService {
  constructor() {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '30d';
  }

  /**
   * Generate JWT token with standardized payload
   */
  generateToken(user) {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      authProvider: user.authProvider || 'local',
      tokenVersion: user.tokenVersion || 1,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.jwtSecret, { 
      expiresIn: this.jwtExpiresIn,
      issuer: 'maintenance-chat-system',
      audience: 'maintenance-chat-client'
    });
  }

  /**
   * Verify and decode JWT token
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'maintenance-chat-system',
        audience: 'maintenance-chat-client'
      });

      // Verify user still exists and token version is valid
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        throw new Error('User not found');
      }

      // Check if token version matches (for token invalidation)
      if (user.tokenVersion && decoded.tokenVersion !== user.tokenVersion) {
        throw new Error('Token version mismatch');
      }

      return { user, decoded };
    } catch (error) {
      logger.error('Token verification failed:', error.message);
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Register new user with local authentication
   */
  async registerLocal(userData) {
    try {
      const { name, email, password, role } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Create new user
      const user = new User({
        name,
        email,
        password, // Will be hashed by User model pre-save middleware
        role: role || 'technician',
        authProvider: 'local',
        isEmailVerified: false,
        tokenVersion: 1
      });

      await user.save();
      
      // Generate token
      const token = this.generateToken(user);

      // Update last active
      user.lastActive = new Date();
      await user.save();

      logger.info(`New user registered: ${email} (local)`);

      return {
        user: this.sanitizeUser(user),
        token,
        needsRoleSelection: false
      };
    } catch (error) {
      logger.error('Local registration failed:', error.message);
      throw error;
    }
  }

  /**
   * Authenticate user with local credentials
   */
  async loginLocal(email, password) {
    try {
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate token
      const token = this.generateToken(user);

      // Update last active
      user.lastActive = new Date();
      await user.save();

      logger.info(`User logged in: ${email} (local)`);

      return {
        user: this.sanitizeUser(user),
        token,
        needsRoleSelection: false
      };
    } catch (error) {
      logger.error('Local login failed:', error.message);
      throw error;
    }
  }

  /**
   * Authenticate user with Google OAuth
   */
  async loginGoogle(credential) {
    try {
      // Verify Google token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { email, name, picture, sub: googleId } = payload;

      if (!email) {
        throw new Error('Email not provided by Google');
      }

      // Find existing user
      let user = await User.findOne({
        $or: [
          { email: email },
          { googleId: googleId }
        ]
      });

      let needsRoleSelection = false;

      if (user) {
        // Existing user - update Google info if needed
        let updated = false;
        
        if (!user.googleId) {
          user.googleId = googleId;
          updated = true;
        }
        
        if (!user.avatar && picture) {
          user.avatar = picture;
          updated = true;
        }

        if (user.authProvider !== 'google' && user.authProvider !== 'hybrid') {
          user.authProvider = 'hybrid'; // User has both local and Google auth
          updated = true;
        }

        if (updated) {
          await user.save();
        }
      } else {
        // New user - create with Google info
        user = new User({
          name,
          email,
          googleId,
          avatar: picture,
          role: 'technician', // Default role
          authProvider: 'google',
          isEmailVerified: true, // Google emails are pre-verified
          tokenVersion: 1,
          password: await bcrypt.hash(Math.random().toString(36), 10) // Random password for security
        });

        await user.save();
        needsRoleSelection = true;
      }

      // Generate token
      const token = this.generateToken(user);

      // Update last active
      user.lastActive = new Date();
      await user.save();

      logger.info(`User logged in: ${email} (google, new: ${needsRoleSelection})`);

      return {
        user: this.sanitizeUser(user),
        token,
        needsRoleSelection
      };
    } catch (error) {
      logger.error('Google login failed:', error.message);
      throw error;
    }
  }

  /**
   * Update user role (for Google OAuth users after role selection)
   */
  async updateUserRole(userId, role) {
    try {
      const validRoles = ['technician', 'team_lead', 'knowledge_manager', 'admin', 'engineer'];
      
      if (!validRoles.includes(role)) {
        throw new Error('Invalid role specified');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.role = role;
      await user.save();

      logger.info(`User role updated: ${user.email} -> ${role}`);

      return {
        user: this.sanitizeUser(user),
        needsRoleSelection: false
      };
    } catch (error) {
      logger.error('Role update failed:', error.message);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user can change password
      if (user.authProvider === 'google') {
        throw new Error('Cannot change password for Google OAuth accounts');
      }

      // Verify current password
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      user.tokenVersion = (user.tokenVersion || 1) + 1; // Invalidate existing tokens
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);

      return { success: true };
    } catch (error) {
      logger.error('Password change failed:', error.message);
      throw error;
    }
  }

  /**
   * Invalidate all user tokens (logout from all devices)
   */
  async invalidateAllTokens(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.tokenVersion = (user.tokenVersion || 1) + 1;
      await user.save();

      logger.info(`All tokens invalidated for user: ${user.email}`);

      return { success: true };
    } catch (error) {
      logger.error('Token invalidation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new Error('User not found');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Get user profile failed:', error.message);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Only allow specific fields to be updated
      const allowedFields = ['name', 'preferences', 'avatar'];
      const updates = {};

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      }

      // Handle email updates with validation
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({ email: updateData.email });
        if (existingUser) {
          throw new Error('Email already in use');
        }
        updates.email = updateData.email;
        updates.isEmailVerified = false; // Require re-verification
      }

      Object.assign(user, updates);
      await user.save();

      logger.info(`User profile updated: ${user.email}`);

      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Profile update failed:', error.message);
      throw error;
    }
  }

  /**
   * Sanitize user object for client response
   */
  sanitizeUser(user) {
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;
    delete userObj.tokenVersion;
    
    return {
      id: userObj._id,
      name: userObj.name,
      email: userObj.email,
      role: userObj.role,
      avatar: userObj.avatar,
      authProvider: userObj.authProvider || 'local',
      isEmailVerified: userObj.isEmailVerified,
      preferences: userObj.preferences,
      lastActive: userObj.lastActive,
      createdAt: userObj.createdAt,
      updatedAt: userObj.updatedAt
    };
  }

  /**
   * Health check for auth service
   */
  async healthCheck() {
    try {
      // Test JWT operations
      const testPayload = { test: true };
      const testToken = jwt.sign(testPayload, this.jwtSecret, { expiresIn: '1m' });
      jwt.verify(testToken, this.jwtSecret);

      // Test database connection
      await User.findOne().limit(1);

      return {
        status: 'healthy',
        jwt: 'operational',
        database: 'connected',
        googleOAuth: this.googleClient ? 'configured' : 'not configured',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Auth service health check failed:', error.message);
      throw new Error(`Auth service unhealthy: ${error.message}`);
    }
  }
}

// Singleton instance
const authService = new AuthService();

module.exports = authService;