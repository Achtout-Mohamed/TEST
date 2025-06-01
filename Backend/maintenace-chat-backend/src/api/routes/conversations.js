// // Update api/routes/conversations.js to include the message routes

// const express = require('express');
// const router = express.Router();
// const { protect } = require('../../api/middleware/auth');
// const {
//   createConversation,
//   getConversations,
//   getConversation,
//   updateConversation,
//   deleteConversation,
//   addParticipants,
//   removeParticipant,
//   searchConversations
// } = require('../controllers/conversationController');

// const { getMessages } = require('../controllers/messageController');

// // Search route
// router.get('/search', protect, searchConversations);

// // Get messages for a conversation
// router.get('/:conversationId/messages', protect, getMessages);

// // Main routes
// router.route('/')
//   .post(protect, createConversation)
//   .get(protect, getConversations);

// router.route('/:id')
//   .get(protect, getConversation)
//   .put(protect, updateConversation)
//   .delete(protect, deleteConversation);

// // Participant management
// router.post('/:id/participants', protect, addParticipants);
// router.delete('/:id/participants/:userId', protect, removeParticipant);

// module.exports = router;
// 3. Updated conversations.js with proper validation
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  addParticipants,
  removeParticipant,
  searchConversations
} = require('../controllers/conversationController');

const { getMessages, createAIConversation } = require('../controllers/messageController');

// AI conversation route
router.post('/ai', protect, createAIConversation);

// Search route
router.get('/search', protect, searchConversations);

// Get messages for a conversation
router.get('/:conversationId/messages', protect, getMessages);

// Main routes
router.route('/')
  .post(protect, createConversation)
  .get(protect, getConversations);

// Routes without validation
router.route('/:id')
  .get(protect, getConversation)
  .put(protect, updateConversation)
  .delete(protect, deleteConversation);

// Participant management
router.post('/:id/participants', protect, addParticipants);
router.delete('/:id/participants/:userId', protect, removeParticipant);

module.exports = router;