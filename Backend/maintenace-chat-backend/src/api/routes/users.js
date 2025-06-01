// src/api/routes/users.js

const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  updateAvatar, 
  searchUsers 
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Get all users (admin only)
// GET /api/users
router.get('/', protect, authorize('admin'), getAllUsers);

// Get user by ID
// GET /api/users/:id
router.get('/:id', protect, getUserById);

// Update user profile
// PUT /api/users/profile
router.put('/profile', protect, updateUser);

// Update user avatar
// PUT /api/users/avatar
router.put('/avatar', protect, updateAvatar);

// Search users
// GET /api/users/search?query=
router.get('/search', protect, searchUsers);

module.exports = router;