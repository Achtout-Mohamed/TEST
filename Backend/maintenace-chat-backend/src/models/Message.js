// const mongoose = require('mongoose');

// const AttachmentSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   type: {
//     type: String,
//     required: true
//   },
//   size: {
//     type: Number
//   },
//   url: {
//     type: String
//   },
//   content: {
//     type: String
//   }
// });

// const MessageSchema = new mongoose.Schema({
//   conversationId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Conversation',
//     required: true
//   },
//   sender: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   isUser: {
//     type: Boolean,
//     default: true
//   },
//   content: {
//     type: String,
//     required: true
//   },
//   attachments: [AttachmentSchema],
//   mentions: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   }],
//   readBy: [{
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User'
//     },
//     readAt: {
//       type: Date,
//       default: Date.now
//     }
//   }]
// }, {
//   timestamps: true
// });

// // Index for full-text search
// MessageSchema.index({ content: 'text' });

// module.exports = mongoose.model('Message', MessageSchema);


// Updated Message.js with read receipts support

const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  size: {
    type: Number
  },
  url: {
    type: String
  },
  content: {
    type: String
  }
});

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isUser: {
    type: Boolean,
    default: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,  // Fixed: was Schema.Types.ObjectId
    ref: 'Attachment'
  }],  // Fixed: added missing comma
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // ... rest of your schema
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Add isEdited field to track edited messages
  isEdited: {
    type: Boolean,
    default: false
  },
  // Add isDeleted for soft deletes
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for full-text search
MessageSchema.index({ content: 'text' });
// Add index for faster queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

// Pre-save hook to handle edits
MessageSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
  }
  next();
});

// Method to mark message as read by a user
MessageSchema.methods.markAsRead = async function(userId) {
  // Check if user has already read this message
  const hasRead = this.readBy.some(read => 
    read.user.toString() === userId.toString()
  );
  
  if (!hasRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    await this.save();
  }
  return this;
};

// Check if a message has been read by a specific user
MessageSchema.methods.isReadByUser = function(userId) {
  return this.readBy.some(read => 
    read.user.toString() === userId.toString()
  );
};

// Static method to get unread messages for a user in a conversation
MessageSchema.statics.getUnreadMessages = function(conversationId, userId) {
  return this.find({
    conversationId,
    sender: { $ne: userId },
    'readBy.user': { $ne: userId }
  }).sort({ createdAt: 1 });
};

// Get read receipt count
MessageSchema.methods.getReadCount = function() {
  return this.readBy.length;
};

module.exports = mongoose.model('Message', MessageSchema);