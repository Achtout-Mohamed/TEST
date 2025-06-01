// src/api/controllers/userController.js

const User = require('../../models/User');
const logger = require('../../utils/logger');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    logger.error(`Get all users error: ${error.message}`);
    res.status(500).json({ message: 'Server error retrieving users', error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error(`Get user by ID error: ${error.message}`);
    res.status(500).json({ message: 'Server error retrieving user', error: error.message });
  }
};

// Update user profile
exports.updateUser = async (req, res) => {
  try {
    const { name, email, preferences } = req.body;
    
    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email already exists for another user
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      };
    }
    
    await user.save();
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences
      }
    });
  } catch (error) {
    logger.error(`Update user error: ${error.message}`);
    res.status(500).json({ message: 'Server error updating user', error: error.message });
  }
};

// Update user avatar
exports.updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    
    if (!avatar) {
      return res.status(400).json({ message: 'Avatar URL is required' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true }
    ).select('-password');
    
    res.json({
      success: true,
      avatar: user.avatar
    });
  } catch (error) {
    logger.error(`Update avatar error: ${error.message}`);
    res.status(500).json({ message: 'Server error updating avatar', error: error.message });
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }
    
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('_id name email role avatar');
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    logger.error(`Search users error: ${error.message}`);
    res.status(500).json({ message: 'Server error searching users', error: error.message });
  }
};