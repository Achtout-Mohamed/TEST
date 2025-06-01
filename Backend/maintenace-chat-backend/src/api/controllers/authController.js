// // src/api/controllers/authController.js

// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const User = require('../../models/User');
// const logger = require('../../utils/logger');

// // Register a new user
// exports.register = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     // Check if user already exists
//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     // Create new user
//     const user = new User({
//       name,
//       email,
//       password,
//       role: role || 'technician'
//     });

//     // Save user to database
//     await user.save();

//     // Generate token
//     const token = generateToken(user._id);

//     res.status(201).json({
//       success: true,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       },
//       token
//     });
//   } catch (error) {
//     logger.error(`Registration error: ${error.message}`);
//     res.status(500).json({ message: 'Server error during registration', error: error.message });
//   }
// };

// // Authenticate user & get token
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Check if user exists
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // Check if password matches
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // Update last active timestamp
//     user.lastActive = Date.now();
//     await user.save();

//     // Generate token
//     const token = generateToken(user._id);

//     res.json({
//       success: true,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       },
//       token
//     });
//   } catch (error) {
//     logger.error(`Login error: ${error.message}`);
//     res.status(500).json({ message: 'Server error during login', error: error.message });
//   }
// };

// // Get current user profile
// exports.getCurrentUser = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-password');
    
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     res.json({
//       success: true,
//       user
//     });
//   } catch (error) {
//     logger.error(`Get user profile error: ${error.message}`);
//     res.status(500).json({ message: 'Server error retrieving user profile', error: error.message });
//   }
// };

// // Change password
// exports.changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;
    
//     // Get user
//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     // Verify current password
//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Current password is incorrect' });
//     }
    
//     // Set new password
//     user.password = newPassword;
//     await user.save();
    
//     res.json({
//       success: true,
//       message: 'Password updated successfully'
//     });
//   } catch (error) {
//     logger.error(`Change password error: ${error.message}`);
//     res.status(500).json({ message: 'Server error changing password', error: error.message });
//   }
// };

// // Generate JWT token
// const generateToken = (userId) => {
//   return jwt.sign(
//     { userId },
//     process.env.JWT_SECRET,
//     { expiresIn: '30d' }
//   );
// };


const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../../models/User');
const logger = require('../../utils/logger');

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || 'technician'
    });

    // Save user to database
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// Authenticate user & get token
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last active timestamp
    user.lastActive = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        needsRoleSelection: false
      },
      token
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// Google OAuth login - SIMPLE VERSION
// Google OAuth login - FIXED VERSION
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    console.log('Google login attempt with credential:', credential ? 'Present' : 'Missing');

    if (!credential) {
      return res.status(400).json({ 
        success: false,
        message: 'Google credential is required' 
      });
    }

    // Check if Google Client ID is configured
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID environment variable not set');
      return res.status(500).json({ 
        success: false,
        message: 'Google authentication not configured on server' 
      });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    console.log('Google user info:', { email, name, googleId });

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email not provided by Google' 
      });
    }

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [{ email: email }, { googleId: googleId }]
    });

    let needsRoleSelection = false;

    if (user) {
      console.log('Existing user found:', user.email);
      // Update Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = user.avatar || picture;
        await user.save();
      }
      user.lastActive = Date.now();
      await user.save();
    } else {
      console.log('Creating new user for:', email);
      // Create new user
      user = new User({
        name,
        email,
        googleId,
        avatar: picture,
        role: 'technician',
        authProvider: 'google',
        password: Math.random().toString(36) // Random password
      });
      await user.save();
      needsRoleSelection = true;
    }

    // Generate JWT token - FIX: Use user._id instead of user.id
    const token = generateToken(user._id);

    console.log('Google login successful for:', user.email);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        needsRoleSelection
      },
      token
    });

  } catch (error) {
    console.error('Google login error details:', error);
    logger.error(`Google login error: ${error.message}`);
    res.status(500).json({ 
      success: false,
      message: 'Google authentication failed', 
      error: error.message 
    });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    const validRoles = ['technician', 'team_lead', 'knowledge_manager', 'admin', 'engineer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.role = role;
    await user.save();
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        needsRoleSelection: false
      }
    });
  } catch (error) {
    logger.error(`Update role error: ${error.message}`);
    res.status(500).json({ message: 'Server error updating role', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar, currentPassword, newPassword } = req.body;
    
    console.log('Profile update request:', {
      userId: req.user.id,
      name: name,
      hasAvatar: !!avatar,
      avatarSize: avatar ? avatar.length : 0,
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword
    });
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Validate name
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name is required' 
      });
    }

    // If changing password, validate current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password is required to change password' 
        });
      }

      // Skip password validation for Google OAuth users
      if (user.authProvider !== 'google') {
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ 
            success: false, 
            message: 'Current password is incorrect' 
          });
        }
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'New password must be at least 6 characters' 
        });
      }

      user.password = newPassword;
    }

    // Update profile fields
    user.name = name.trim();
    
    // Handle avatar update (can be empty string to remove avatar)
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    // Return updated user data (without password)
    const updatedUser = await User.findById(user._id).select('-password');
    
    console.log('Profile updated successfully for user:', updatedUser.email);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        authProvider: updatedUser.authProvider
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error: ' + error.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error(`Get user profile error: ${error.message}`);
    res.status(500).json({ message: 'Server error retrieving user profile', error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({ 
        message: 'Cannot change password for Google OAuth accounts' 
      });
    }
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    res.status(500).json({ message: 'Server error changing password', error: error.message });
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};