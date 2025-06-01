// Updated messages.js routes
const messageController = require('../controllers/messageController');
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createMessage,
  getMessages,
  updateMessage,
  deleteMessage,
  searchMessages,
  markAsRead,
  sendTypingIndicator,
  getUnreadCount
} = require('../controllers/messageController');

// Search route - must be before other routes to avoid conflict with ID param
router.get('/search', protect, searchMessages);

// Get unread message count
router.get('/unread/count', protect, getUnreadCount);

// Create a new message
router.post('/', protect, createMessage);

// Update and delete message routes
router.route('/:id')
  .put(protect, updateMessage)
  .delete(protect, deleteMessage);

// Mark messages as read in a conversation
router.post('/:conversationId/read', protect, markAsRead);

// Send typing indicator
router.post('/:conversationId/typing', protect, sendTypingIndicator);

// Get messages for a conversation (if this route is needed)
router.get('/:conversationId', protect, getMessages);

// router.post('/conversations/ai', protect, messageController.createAIConversation);
// router.get('/conversations/:conversationId/documents', protect, messageController.getConversationDocuments);
// router.delete('/conversations/:conversationId/documents', protect, messageController.clearConversationDocuments);

module.exports = router;