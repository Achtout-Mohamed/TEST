// api/controllers/conversationController.js

const Conversation = require('../../models/Conversation');
const User = require('../../models/User');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');

/**
 * @desc    Create a new conversation
 * @route   POST /api/conversations
 * @access  Private
 */
exports.createConversation = async (req, res, next) => {
  try {
    const { title, participants = [], isGroup, groupId, isShared, tags } = req.body;

    // IMPORTANT: Create a new array to avoid modifying the input
    let allParticipants = [...participants];
    
    // CRITICAL FIX: Always add the current user to the participants
    // Check if the user is already in the participants array (convert ObjectId to string for comparison)
    const userIdStr = req.user._id.toString();
    if (!allParticipants.some(id => id.toString() === userIdStr)) {
      allParticipants.push(req.user._id);
    }
    
    // Validate participants are valid user IDs if provided
    if (allParticipants.length > 0) {
      const validParticipants = allParticipants.every(id => mongoose.isValidObjectId(id));
      if (!validParticipants) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid participant ID format' 
        });
      }

      // Check if all participants exist
      const participantCount = await User.countDocuments({
        _id: { $in: allParticipants }
      });
      
      if (participantCount !== allParticipants.length) {
        return res.status(404).json({ 
          success: false, 
          message: 'One or more participants not found' 
        });
      }
    }

    // Create the conversation with the modified participants array
    const conversation = await Conversation.create({
      title: title || 'New Conversation',
      participants: allParticipants, // Use the array that includes the current user
      isGroup: isGroup || false,
      groupId: groupId || null,
      isShared: isShared || false,
      tags: tags || [],
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    next(error);
  }
};

/**
 * @desc    Get all conversations for current user
 * @route   GET /api/conversations
 * @access  Private
 */
exports.getConversations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    
    // Build query
    const query = {
      participants: req.user._id, // Get conversations where current user is a participant
    };
    
    // Add search functionality if provided
    if (search) {
      query.$text = { $search: search };
    }
    
    // Get conversations with pagination
    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('participants', 'name email avatar')
      .populate('createdBy', 'name email');
    
    // Get total count for pagination
    const total = await Conversation.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: conversations.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: conversations
    });
  } catch (error) {
    logger.error(`Get conversations error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get a single conversation by ID
 * @route   GET /api/conversations/:id
 * @access  Private
 */
exports.getConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format'
      });
    }
    
    const conversation = await Conversation.findById(id)
      .populate('participants', 'name email avatar')
      .populate('createdBy', 'name email');
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    // Check if user is authorized to view this conversation
    if (!conversation.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this conversation'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.error(`Get conversation error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Update conversation
 * @route   PUT /api/conversations/:id
 * @access  Private
 */
exports.updateConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, participants, isGroup, groupId, isShared, tags } = req.body;
    
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format'
      });
    }
    
    // Find conversation
    let conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    // Check if user is authorized to update this conversation
    // Only creator or participants should be able to update
    if (conversation.createdBy.toString() !== req.user._id.toString() && 
        !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this conversation'
      });
    }
    
    // Validate participants if provided
    if (participants && participants.length > 0) {
      const validParticipants = participants.every(id => mongoose.isValidObjectId(id));
      if (!validParticipants) {
        return res.status(400).json({
          success: false,
          message: 'Invalid participant ID format'
        });
      }
      
      // Check if all participants exist
      const participantCount = await User.countDocuments({
        _id: { $in: participants }
      });
      
      if (participantCount !== participants.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more participants not found'
        });
      }
    }
    
    // Update conversation
    conversation = await Conversation.findByIdAndUpdate(
      id,
      {
        title: title || conversation.title,
        participants: participants || conversation.participants,
        isGroup: isGroup !== undefined ? isGroup : conversation.isGroup,
        groupId: groupId !== undefined ? groupId : conversation.groupId,
        isShared: isShared !== undefined ? isShared : conversation.isShared,
        tags: tags || conversation.tags,
        lastMessageAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('participants', 'name email avatar')
     .populate('createdBy', 'name email');
    
    return res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.error(`Update conversation error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Delete conversation
 * @route   DELETE /api/conversations/:id
 * @access  Private
 */
exports.deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format'
      });
    }
    
    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    // Only creator should be able to delete the conversation
    if (conversation.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this conversation'
      });
    }
    
    await conversation.deleteOne();
    
    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
      data: {}
    });
  } catch (error) {
    logger.error(`Delete conversation error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Add participants to conversation
 * @route   POST /api/conversations/:id/participants
 * @access  Private
 */
exports.addParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { participants } = req.body;
    
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of participant IDs'
      });
    }
    
    // Validate participant IDs
    const validParticipants = participants.every(id => mongoose.isValidObjectId(id));
    if (!validParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Invalid participant ID format'
      });
    }
    
    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    // Check authorization
    if (conversation.createdBy.toString() !== req.user._id.toString() && 
        !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this conversation'
      });
    }
    
    // Check if users exist
    const usersExist = await User.countDocuments({
      _id: { $in: participants }
    });
    
    if (usersExist !== participants.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more users not found'
      });
    }
    
    // Add participants (avoid duplicates)
    const updatedConversation = await Conversation.findByIdAndUpdate(
      id,
      {
        $addToSet: { participants: { $each: participants } },
        lastMessageAt: Date.now()
      },
      { new: true }
    ).populate('participants', 'name email avatar')
     .populate('createdBy', 'name email');
    
    return res.status(200).json({
      success: true,
      data: updatedConversation
    });
  } catch (error) {
    logger.error(`Add participants error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Remove participant from conversation
 * @route   DELETE /api/conversations/:id/participants/:userId
 * @access  Private
 */
exports.removeParticipant = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    // Only creator or the participant themselves can remove a participant
    if (conversation.createdBy.toString() !== req.user._id.toString() && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this participant'
      });
    }
    
    // Cannot remove the creator from their own conversation
    if (userId === conversation.createdBy.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the creator from the conversation'
      });
    }
    
    // Remove participant
    const updatedConversation = await Conversation.findByIdAndUpdate(
      id,
      {
        $pull: { participants: userId },
        lastMessageAt: Date.now()
      },
      { new: true }
    ).populate('participants', 'name email avatar')
     .populate('createdBy', 'name email');
    
    return res.status(200).json({
      success: true,
      data: updatedConversation
    });
  } catch (error) {
    logger.error(`Remove participant error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Search conversations
 * @route   GET /api/conversations/search
 * @access  Private
 */
exports.searchConversations = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const conversations = await Conversation.find({
      $text: { $search: query },
      participants: req.user._id // Only search in conversations where user is a participant
    })
    .sort({ score: { $meta: 'textScore' } })
    .populate('participants', 'name email avatar')
    .populate('createdBy', 'name email');
    
    return res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations
    });
  } catch (error) {
    logger.error(`Search conversations error: ${error.message}`);
    next(error);
  }
};