
const Message = require('../../models/Message');
const Conversation = require('../../models/Conversation');
const User = require('../../models/User');
const Attachment = require('../../models/Attachment');
const advancedRAGService = require('../../services/advancedRAGService');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const path = require('path');
const deepseekService = require('../../services/deepseekService');

// AI Bot User ID
let AI_BOT_USER_ID = null;

// Initialize AI bot user
const initializeAIBot = async () => {
  try {
    let aiBot = await User.findOne({ email: 'ai@system.local' });
    
    if (!aiBot) {
      console.log('Creating AI bot user...');
      aiBot = await User.create({
        name: 'AI Assistant',
        email: 'ai@system.local',
        password: 'ai@123456',
        role: 'admin',
        avatar: '🤖'
      });
      console.log('✅ AI Assistant created successfully');
    } else {
      console.log('✅ AI Assistant found in database');
    }
    
    AI_BOT_USER_ID = aiBot._id;
    console.log('✅ AI Bot ID set to:', AI_BOT_USER_ID);
    return aiBot;
  } catch (error) {
    console.error('❌ Error initializing AI bot:', error.message);
    console.error('Full error:', error);
  }
};

// Fix existing AI conversation - run this once
const fixExistingAIConversation = async () => {
  try {
    const result = await Conversation.updateOne(
      { _id: '6831e2b80cf3199b6260993a' },
      { $set: { aiEnabled: true } }
    );
    console.log('✅ Existing AI conversation fixed:', result);
  } catch (error) {
    console.error('❌ Error fixing existing AI conversation:', error);
  }
};

// Initialize on startup
initializeAIBot().then(() => {
  console.log('AI Bot setup complete');
  setTimeout(() => {
    fixExistingAIConversation();
  }, 1000);
}).catch(err => {
  console.error('AI Bot setup failed:', err);
});

/**
 * Enhanced message creation with FIXED SOCKET EMISSION
 */
exports.createMessage = async (req, res, next) => {
  try {
    const { conversationId, content, attachments, mentions } = req.body;

    // Validate conversation ID
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format'
      });
    }

    // Check if conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Validate content
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Process attachments for AI analysis
    let processedAttachments = [];
    if (attachments && attachments.length > 0) {
      for (const attachmentId of attachments) {
        const attachment = await Attachment.findById(attachmentId);
        if (attachment) {
          processedAttachments.push(attachment);
          
          // Process document for AI knowledge base if advancedRAGService exists
          if (advancedRAGService && advancedRAGService.processUploadedDocument) {
            try {
              const filePath = path.join(__dirname, '../../', attachment.url);
              const result = await advancedRAGService.processUploadedDocument(
                filePath, 
                attachment.filename, 
                conversationId
              );
              
              if (result.success) {
                console.log(`Processed document: ${attachment.filename} (${result.chunks} chunks)`);
              }
            } catch (error) {
              console.error('Error processing document:', error);
            }
          }
        }
      }
    }

    // Create user message
    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      isUser: true,
      content,
      attachments: attachments || [],
      mentions: mentions || [],
      readBy: [{ user: req.user._id }]
    });

    // Populate message
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('mentions', 'name email avatar')
      .populate('attachments');

    // Update conversation timestamp
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessageAt: Date.now()
    });

    // 🔥 FIXED: Emit message via Socket.IO with CORRECT ROOM NAME
    const io = req.app.get('io');
    if (io) {
      console.log(`📡 Emitting new_message to conversation_${conversationId}`);
      io.to(`conversation_${conversationId}`).emit('new_message', populatedMessage);
      
      // Also emit typing stopped event
      io.to(`conversation_${conversationId}`).emit('typing', {
        conversationId,
        userId: req.user._id,
        isTyping: false
      });
    }

    // Debug AI response logic
    console.log('🤖 Message created. Checking AI response...');
    console.log('🤖 Conversation aiEnabled:', conversation.aiEnabled);
    console.log('🤖 AI_BOT_USER_ID:', AI_BOT_USER_ID);

    // Determine if AI should respond
    const shouldAIRespond = await shouldGenerateAIResponse(content, conversation, processedAttachments);
    console.log('🤖 Should AI respond:', shouldAIRespond);
    
    if (shouldAIRespond && AI_BOT_USER_ID) {
      console.log('🤖 Generating AI response...');
      // Generate AI response asynchronously
      setImmediate(() => {
        generateIntelligentAIResponse(conversationId, content, processedAttachments, io);
      });
    } else {
      console.log('🤖 AI response skipped. shouldAIRespond:', shouldAIRespond, 'AI_BOT_USER_ID:', AI_BOT_USER_ID);
    }

    return res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    logger.error(`Create message error: ${error.message}`);
    next(error);
  }
};

/**
 * Determine if AI should respond (now more intelligent)
 */
async function shouldGenerateAIResponse(content, conversation, attachments) {
  console.log('🤖 Evaluating if AI should respond...', {
    content: content.substring(0, 50),
    aiEnabled: conversation.aiEnabled,
    hasAttachments: attachments && attachments.length > 0,
    conversationId: conversation._id
  });

  const contentLower = content.toLowerCase();
  
  // 1. Direct AI mention
  if (contentLower.includes('@ai') || contentLower.includes('ai assistant')) {
    console.log('🤖 AI mentioned directly - RESPONDING');
    return true;
  }
  
  // 2. AI-enabled conversation
  if (conversation.aiEnabled === true) {
    console.log('🤖 AI-enabled conversation - RESPONDING');
    return true;
  }
  
  // 3. Check if AI bot is a participant (most important check)
  try {
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'email _id');
    
    const hasAIParticipant = populatedConversation.participants.some(participant => {
      return participant.email === 'ai@system.local' || 
             participant._id.toString() === AI_BOT_USER_ID?.toString();
    });
    
    console.log('🤖 Participants check:', {
      participantEmails: populatedConversation.participants.map(p => p.email),
      hasAIParticipant,
      AI_BOT_USER_ID: AI_BOT_USER_ID?.toString()
    });
    
    if (hasAIParticipant) {
      console.log('🤖 AI is participant - RESPONDING');
      return true;
    }
  } catch (error) {
    console.error('🤖 Error checking participants:', error);
  }
  
  // 4. Questions
  if (content.includes('?')) {
    console.log('🤖 Question detected - RESPONDING');
    return true;
  }
  
  // 5. Documents uploaded
  if (attachments && attachments.length > 0) {
    console.log('🤖 Attachments detected - RESPONDING');
    return true;
  }
  
  // 6. Request words
  const requestWords = [
    'analyze', 'explain', 'help', 'what', 'how', 'why', 'when', 'where', 
    'who', 'which', 'show', 'tell', 'describe', 'compare', 'find', 'search',
    'recommend', 'suggest', 'advise', 'calculate', 'summarize', 'review',
    'hello', 'hi', 'hey'  // Added greetings
  ];
  
  const hasRequestWords = requestWords.some(word => contentLower.includes(word));
  
  if (hasRequestWords) {
    console.log('🤖 Request words detected - RESPONDING');
    return true;
  }
  
  console.log('🤖 No AI response conditions met - NOT RESPONDING');
  return false;
}

/**
 * Generate intelligent AI response using RAG system - FIXED SOCKET EMISSION
 */
async function generateIntelligentAIResponse(conversationId, userMessage, attachments, io) {
  try {
    console.log('🤖 Starting DeepSeek AI response generation...', { 
      conversationId, 
      userMessage: userMessage.substring(0, 50) 
    });

    // Show typing indicator - FIXED ROOM NAME
    if (io) {
      console.log('📡 Showing typing indicator');
      io.to(`conversation_${conversationId}`).emit('typing', {
        conversationId,
        userId: AI_BOT_USER_ID,
        userName: 'AI Assistant',
        isTyping: true
      });
    }

    let finalResponse;
    let sources = { totalSources: 0, dataSource: 'No data' };
    
    try {
      console.log('🧠 Calling DeepSeek AI for analysis...');
      
      // Get conversation history for context (optional - last 5 messages)
      const recentMessages = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('sender', 'name email');
      
      // Convert to conversation context format
      const conversationContext = recentMessages
        .reverse() // Oldest first
        .slice(0, -1) // Exclude current message
        .map(msg => ({
          role: msg.sender.email === 'ai@system.local' ? 'assistant' : 'user',
          content: msg.content
        }));

      // Call DeepSeek AI
      const apiTest = await deepseekService.testAPIConnection();
      console.log('🧪 API test result:', apiTest);
      const aiResult = await deepseekService.analyzeWithDeepSeek(userMessage, conversationContext);
      
      if (aiResult.success) {
  finalResponse = aiResult.response; // No footer added
  sources = {
    totalSources: 1,
    dataSource: aiResult.dataSource,
    usage: aiResult.usage
  };
        
        // Add source attribution
        
        console.log('✅ DeepSeek analysis completed:', {
    responseLength: finalResponse.length,
    tokensUsed: aiResult.usage
  });
} else {
  throw new Error('DeepSeek analysis failed');
}
      
    } catch (error) {
      console.error('❌ DeepSeek AI error:', error.message);
      
      // Provide helpful error response
      if (error.message.includes('API key')) {
        finalResponse = `🔑 **Configuration Issue**

I need a DeepSeek API key to analyze your equipment data. Please:

1. Get a DeepSeek API key from https://platform.deepseek.com
2. Add it to your environment variables: \`DEEPSEEK_API_KEY=your_key_here\`
3. Restart the server

Meanwhile, I can see you asked: "${userMessage}"

I have access to ${deepseekService.equipmentSummary?.totalEquipment || 0} equipment records, but I need the AI service to provide intelligent analysis.`;
      
      } else if (error.message.includes('rate limit')) {
        finalResponse = `⏳ **Rate Limit Reached**

The DeepSeek API is temporarily unavailable due to rate limiting. Please try again in a few minutes.

Your question: "${userMessage}"

I'll be ready to analyze your equipment data once the rate limit resets.`;
      
      } else if (error.message.includes('Equipment data not loaded')) {
        finalResponse = `📊 **Data Loading Issue**

I can't find the equipment data file. Please ensure:
- \`clean_equipment_data.xlsx\` exists in \`src/data/\` folder
- The file is accessible and not corrupted
- Server has read permissions

Your question: "${userMessage}"

Once the data is available, I can provide comprehensive equipment analysis.`;
      
      } else {
        finalResponse = `🤖 **AI Analysis Temporarily Unavailable**

I encountered an issue while analyzing your equipment data: ${error.message}

Your question: "${userMessage}"

I have access to the equipment database, but the AI analysis service is currently having issues. Please try again in a moment, or contact your administrator if the problem persists.`;
      }
    }

    // Stop typing indicator - FIXED ROOM NAME
    if (io) {
      console.log('📡 Stopping typing indicator');
      io.to(`conversation_${conversationId}`).emit('typing', {
        conversationId,
        userId: AI_BOT_USER_ID,
        userName: 'AI Assistant',
        isTyping: false
      });
    }

    // Create AI message in database
    console.log('📝 Creating AI message in database...');
    const aiMessage = await Message.create({
      conversationId,
      sender: AI_BOT_USER_ID,
      isUser: false,
      content: finalResponse,
      attachments: [],
      mentions: [],
      readBy: []
    });

    console.log('📝 AI message created:', aiMessage._id);

    // Populate AI message
    const populatedAIMessage = await Message.findById(aiMessage._id)
      .populate('sender', 'name email avatar')
      .populate('attachments');

    // Update conversation timestamp
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessageAt: Date.now()
    });

    // 🔥 FIXED: Emit AI response via Socket.IO with CORRECT ROOM NAME
    if (io) {
      console.log('📡 Emitting AI response via Socket.IO');
      io.to(`conversation_${conversationId}`).emit('new_message', populatedAIMessage);
    }

    console.log('✅ DeepSeek AI response completed successfully');
    logger.info(`DeepSeek AI response generated for conversation ${conversationId}`, {
      responseLength: finalResponse.length,
      sources: sources
    });

  } catch (error) {
    console.error('❌ AI response generation error:', error);
    logger.error(`AI response generation error: ${error.message}`);
    
    // Send fallback error message - FIXED ROOM NAME
    try {
      const errorMessage = await Message.create({
        conversationId,
        sender: AI_BOT_USER_ID,
        isUser: false,
        content: `I apologize, but I'm experiencing technical difficulties right now. 

Your question: "${userMessage}"

Please try again in a moment. If the problem persists, please contact support.

Error details: ${error.message}`,
        attachments: [],
        mentions: [],
        readBy: []
      });

      const populatedErrorMessage = await Message.findById(errorMessage._id)
        .populate('sender', 'name email avatar');

      if (io) {
        io.to(`conversation_${conversationId}`).emit('new_message', populatedErrorMessage);
        io.to(`conversation_${conversationId}`).emit('typing', {
          conversationId,
          userId: AI_BOT_USER_ID,
          isTyping: false
        });
      }
    } catch (errorMsgError) {
      console.error('❌ Error sending AI error message:', errorMsgError);
      logger.error(`Error sending AI error message: ${errorMsgError.message}`);
    }
  }
}

/**
 * Create AI-enabled conversation
 */
exports.createAIConversation = async (req, res, next) => {
  try {
    const { title, participants = [] } = req.body;

    // Ensure AI bot is initialized
    if (!AI_BOT_USER_ID) {
      await initializeAIBot();
    }

    // Add AI bot to participants
    if (AI_BOT_USER_ID && !participants.includes(AI_BOT_USER_ID.toString())) {
      participants.push(AI_BOT_USER_ID);
    }

    // Add current user
    if (!participants.includes(req.user._id.toString())) {
      participants.push(req.user._id);
    }

    const conversation = await Conversation.create({
      title: title || 'AI Analysis Chat',
      participants,
      createdBy: req.user._id,
      aiEnabled: true,
      isGroup: participants.length > 2
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    // Send welcome message
    if (AI_BOT_USER_ID) {
      const welcomeMessage = await Message.create({
        conversationId: conversation._id,
        sender: AI_BOT_USER_ID,
        isUser: false,
        content: `👋 Hello! I'm your AI Assistant. I can help you with:

📊 **Equipment Analysis** - Analyze your industrial equipment data (turbines, compressors, pumps)
📄 **Document Processing** - Read and analyze any documents you upload (PDFs, Word docs, Excel files, etc.)
🔍 **Data Insights** - Find patterns, trends, and insights in your data
💡 **Recommendations** - Provide maintenance recommendations and technical advice
❓ **Q&A** - Answer any questions about your data or documents

**Just ask me anything!** Upload documents and I'll analyze them, or ask questions about your equipment data. I can handle any topic - from technical analysis to general questions about your uploaded content.

What would you like to explore today?`,
        attachments: [],
        mentions: [],
        readBy: []
      });
    }

    res.status(201).json({
      success: true,
      data: populatedConversation
    });
  } catch (error) {
    logger.error(`Create AI conversation error: ${error.message}`);
    next(error);
  }
};

/**
 * Get conversation documents
 */
exports.getConversationDocuments = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    
    let documents = [];
    if (advancedRAGService && advancedRAGService.getConversationDocuments) {
      documents = advancedRAGService.getConversationDocuments(conversationId);
    }
    
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    logger.error(`Get conversation documents error: ${error.message}`);
    next(error);
  }
};

/**
 * Clear conversation documents
 */
exports.clearConversationDocuments = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    
    if (advancedRAGService && advancedRAGService.clearConversationDocuments) {
      advancedRAGService.clearConversationDocuments(conversationId);
    }
    
    res.json({
      success: true,
      message: 'Conversation documents cleared'
    });
  } catch (error) {
    logger.error(`Clear conversation documents error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get messages for a conversation - FIXED SOCKET EMISSION
 * @route   GET /api/conversations/:conversationId/messages
 * @access  Private
 */
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Validate conversation ID
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format'
      });
    }

    // Check if conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant in the conversation
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Get messages with pagination (newest first)
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email avatar')
      .populate('mentions', 'name email avatar')
      .populate('readBy.user', 'name email avatar')
      .populate('attachments');

    // Get total count for pagination
    const total = await Message.countDocuments({ conversationId });

    // Find messages that need to be marked as read
    const unreadMessageIds = [];
    
    // Mark messages as read by this user
    const readPromises = messages.map(async (message) => {
      // Skip messages sent by the current user
      if (message.sender._id.toString() === req.user._id.toString()) {
        return;
      }
      
      // Check if message is already read by user
      const alreadyRead = message.readBy.some(
        read => read.user._id.toString() === req.user._id.toString()
      );
      
      if (!alreadyRead) {
        unreadMessageIds.push(message._id);
        
        // Add user to readBy array
        message.readBy.push({
          user: req.user._id,
          readAt: new Date()
        });
        
        return message.save();
      }
    });
    
    // Wait for all read operations to complete
    await Promise.all(readPromises);

    // 🔥 FIXED: Emit read receipts via Socket.IO with CORRECT ROOM NAME
    const io = req.app.get('io');
    if (io && unreadMessageIds.length > 0) {
      unreadMessageIds.forEach(messageId => {
        io.to(`conversation_${conversationId}`).emit('message_read', {
          messageId,
          userId: req.user._id,
          conversationId
        });
      });
    }

    return res.status(200).json({
      success: true,
      count: messages.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: messages
    });
  } catch (error) {
    logger.error(`Get messages error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Update a message - FIXED SOCKET EMISSION
 * @route   PUT /api/messages/:id
 * @access  Private
 */
exports.updateMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Validate message ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID format'
      });
    }

    // Find the message
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender of the message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    // Check if content is provided
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Update the message
    message.content = content;
    message.isEdited = true;
    await message.save();

    // Populate sender details
    const updatedMessage = await Message.findById(id)
      .populate('sender', 'name email avatar')
      .populate('mentions', 'name email avatar')
      .populate('readBy.user', 'name email avatar');

    // 🔥 FIXED: Emit message updated event via Socket.IO with CORRECT ROOM NAME
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${message.conversationId.toString()}`).emit('message_updated', updatedMessage);
    }

    return res.status(200).json({
      success: true,
      data: updatedMessage
    });
  } catch (error) {
    logger.error(`Update message error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Delete a message - FIXED SOCKET EMISSION
 * @route   DELETE /api/messages/:id
 * @access  Private
 */
exports.deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate message ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID format'
      });
    }

    // Find the message
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender of the message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    // Delete the message
    const conversationId = message.conversationId;
    await message.deleteOne();

    // 🔥 FIXED: Emit message deleted event via Socket.IO with CORRECT ROOM NAME
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId.toString()}`).emit('message_deleted', {
        messageId: id,
        conversationId: conversationId.toString()
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      data: {}
    });
  } catch (error) {
    logger.error(`Delete message error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Search messages
 * @route   GET /api/messages/search
 * @access  Private
 */
exports.searchMessages = async (req, res, next) => {
  try {
    const { query, conversationId } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Build the search query
    const searchQuery = {
      $text: { $search: query }
    };
    
    // If conversationId is provided, limit search to that conversation
    if (conversationId) {
      if (!mongoose.isValidObjectId(conversationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid conversation ID format'
        });
      }
      
      searchQuery.conversationId = conversationId;
      
      // Check if user is participant in the conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }
      
      if (!conversation.participants.includes(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not a participant in this conversation'
        });
      }
    } else {
      // If no conversationId provided, only search in conversations where user is a participant
      const userConversations = await Conversation.find({
        participants: req.user._id
      });
      
      const conversationIds = userConversations.map(c => c._id);
      searchQuery.conversationId = { $in: conversationIds };
    }
    
    // Execute the search
    const messages = await Message.find(searchQuery)
      .sort({ score: { $meta: 'textScore' } })
      .populate('sender', 'name email avatar')
      .populate('conversationId', 'title')
      .populate('attachments')
      .limit(20);
    
    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    logger.error(`Search messages error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Mark messages as read - FIXED SOCKET EMISSION
 * @route   POST /api/messages/:conversationId/read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { messageIds } = req.body;

    // Validate conversation ID
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format'
      });
    }

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Find messages to mark as read
    let messagesToUpdate;
    
    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      // Mark specific messages as read
      messagesToUpdate = await Message.find({
        _id: { $in: messageIds },
        conversationId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      });
    } else {
      // Mark all unread messages in the conversation as read
      messagesToUpdate = await Message.find({
        conversationId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      });
    }

    // Process each message
    const updatePromises = messagesToUpdate.map(async (message) => {
      message.readBy.push({
        user: req.user._id,
        readAt: new Date()
      });
      await message.save();
      
      // 🔥 FIXED: Emit read receipt event with CORRECT ROOM NAME
      const io = req.app.get('io');
      if (io) {
        io.to(`conversation_${conversationId}`).emit('message_read', {
          messageId: message._id,
          userId: req.user._id,
          conversationId
        });
      }
      
      return message._id;
    });
    
    const updatedMessageIds = await Promise.all(updatePromises);

    return res.status(200).json({
      success: true,
      message: `${updatedMessageIds.length} messages marked as read`,
      data: {
        readCount: updatedMessageIds.length,
        messageIds: updatedMessageIds
      }
    });
  } catch (error) {
    logger.error(`Mark as read error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Send typing indicator - FIXED SOCKET EMISSION
 * @route   POST /api/messages/:conversationId/typing
 * @access  Private
 */
exports.sendTypingIndicator = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { isTyping } = req.body;

    // Validate conversation ID
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format'
      });
    }

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // 🔥 FIXED: Emit typing event via Socket.IO with CORRECT ROOM NAME
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('typing', {
        conversationId,
        userId: req.user._id,
        userName: req.user.name,
        isTyping: isTyping === true
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Typing indicator sent'
    });
  } catch (error) {
    logger.error(`Typing indicator error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get unread message count
 * @route   GET /api/messages/unread/count
 * @access  Private
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    // Get all conversations where user is a participant
    const conversations = await Conversation.find({
      participants: req.user._id
    });

    const conversationIds = conversations.map(conv => conv._id);

    // Get unread count for each conversation
    const unreadCounts = await Promise.all(
      conversationIds.map(async (convId) => {
        const count = await Message.countDocuments({
          conversationId: convId,
          sender: { $ne: req.user._id },
          'readBy.user': { $ne: req.user._id }
        });

        return {
          conversationId: convId,
          count
        };
      })
    );

    // Calculate total unread
    const totalUnread = unreadCounts.reduce((sum, item) => sum + item.count, 0);

    return res.status(200).json({
      success: true,
      data: {
        total: totalUnread,
        conversations: unreadCounts
      }
    });
  } catch (error) {
    logger.error(`Get unread count error: ${error.message}`);
    next(error);
  }
};