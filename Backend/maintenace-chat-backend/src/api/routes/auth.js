// const express = require('express');
// const router = express.Router();
// const { 
//   register, 
//   login, 
//   googleLogin, 
//   getCurrentUser, 
//   changePassword,
//   updateUserRole
// } = require('../controllers/authController');
// const { protect } = require('../middleware/auth'); // Use your existing auth middleware

// // Register new user
// // POST /api/auth/register
// router.post('/register', register);

// // Authenticate user
// // POST /api/auth/login
// router.post('/login', login);

// // Google OAuth login
// // POST /api/auth/google
// router.post('/google', googleLogin);

// // Update user role (for Google OAuth users after role selection)
// // PUT /api/auth/role
// router.put('/role', protect, updateUserRole);

// // Get current user profile
// // GET /api/auth/me
// router.get('/me', protect, getCurrentUser);

// // Change password
// // PUT /api/auth/password
// router.put('/password', protect, changePassword);


// module.exports = router;

// Updated auth.js routes file

const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  googleLogin, 
  getCurrentUser, 
  changePassword,
  updateUserRole,
  updateProfile  // Add this import
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Register new user
// POST /api/auth/register
router.post('/register', register);

// Authenticate user
// POST /api/auth/login
router.post('/login', login);

// Google OAuth login
// POST /api/auth/google
router.post('/google', googleLogin);

// Update user role (for Google OAuth users after role selection)
// PUT /api/auth/role
router.put('/role', protect, updateUserRole);

// Get current user profile
// GET /api/auth/me
router.get('/me', protect, getCurrentUser);

// Update user profile (NEW ROUTE)
// PUT /api/auth/profile
router.put('/profile', protect, updateProfile);

// Change password
// PUT /api/auth/password
router.put('/password', protect, changePassword);

module.exports = router;