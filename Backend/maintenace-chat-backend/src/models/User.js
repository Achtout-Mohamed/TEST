// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const UserSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//     lowercase: true
//   },
//   password: {
//     type: String,
//     required: true
//   },
//   role: {
//     type: String,
//     enum: ['technician', 'team_lead', 'knowledge_manager', 'admin','engineer'],
//     default: 'technician'
//   },
//   teams: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Group'
//   }],
//   lastActive: {
//     type: Date,
//     default: Date.now
//   },
//   preferences: {
//     notifications: {
//       email: {
//         type: Boolean,
//         default: true
//       },
//       push: {
//         type: Boolean,
//         default: true
//       }
//     },
//     theme: {
//       type: String,
//       enum: ['light', 'dark', 'system'],
//       default: 'system'
//     }
//   },
//   avatar: {
//     type: String,
//     default: ''
//   }
// }, {
//   timestamps: true
// });

// // Password hashing middleware
// UserSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
  
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Method to compare passwords
// UserSchema.methods.comparePassword = async function(candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// module.exports = mongoose.model('User', UserSchema);

// Backend/maintenace-chat-backend/src/models/User.js - Enhanced User Model

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return this.authProvider === 'local' || !this.googleId;
    },
    minlength: [6, 'Password must be at least 6 characters']
  },
  
  // Authentication provider information
  authProvider: {
    type: String,
    enum: ['local', 'google', 'hybrid'],
    default: 'local'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Role and permissions
  role: {
    type: String,
    enum: ['technician', 'team_lead', 'knowledge_manager', 'admin', 'engineer'],
    default: 'technician'
  },
  permissions: [{
    type: String,
    enum: [
      'read_conversations',
      'write_conversations', 
      'delete_conversations',
      'manage_users',
      'manage_equipment',
      'manage_maintenance',
      'view_analytics',
      'admin_access'
    ]
  }],
  
  // Team and group associations
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  
  // Security and session management
  tokenVersion: {
    type: Number,
    default: 1
  },
  isEmailVerified: {
    type: Boolean,
    default: function() {
      return this.authProvider === 'google';
    }
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Activity tracking
  lastActive: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginCount: {
    type: Number,
    default: 0
  },
  
  // User preferences
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sound: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Profile information
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  department: String,
  employeeId: String,
  phoneNumber: String,
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: String,
  
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  versionKey: '__v'
});

// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ googleId: 1 }, { sparse: true });
UserSchema.index({ role: 1 });
UserSchema.index({ lastActive: -1 });
UserSchema.index({ isActive: 1, isBlocked: 1 });
UserSchema.index({ 'teams': 1 });

// Pre-save middleware for password hashing
UserSchema.pre('save', async function(next) {
  // Only hash password if it's modified and exists
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware for login tracking
UserSchema.pre('save', function(next) {
  if (this.isModified('lastLogin') && !this.isNew) {
    this.loginCount += 1;
  }
  next();
});

// Instance methods
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.canChangePassword = function() {
  return this.authProvider === 'local' || this.authProvider === 'hybrid';
};

UserSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

UserSchema.methods.hasRole = function(...roles) {
  return roles.includes(this.role);
};

UserSchema.methods.isInTeam = function(teamId) {
  return this.teams.some(team => team.toString() === teamId.toString());
};

UserSchema.methods.incrementTokenVersion = function() {
  this.tokenVersion += 1;
  return this.save();
};

UserSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

UserSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

UserSchema.methods.block = function(reason, blockedBy) {
  this.isBlocked = true;
  this.blockReason = reason;
  this.updatedBy = blockedBy;
  return this.save();
};

UserSchema.methods.unblock = function(unblockedBy) {
  this.isBlocked = false;
  this.blockReason = null;
  this.updatedBy = unblockedBy;
  return this.save();
};

// Static methods
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true, isBlocked: false });
};

UserSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true, isBlocked: false });
};

UserSchema.statics.findByTeam = function(teamId) {
  return this.find({ teams: teamId, isActive: true, isBlocked: false });
};

UserSchema.statics.findOnlineUsers = function(minutesThreshold = 5) {
  const threshold = new Date(Date.now() - minutesThreshold * 60 * 1000);
  return this.find({ 
    lastActive: { $gte: threshold },
    isActive: true,
    isBlocked: false
  });
};

UserSchema.statics.searchUsers = function(query, limit = 20) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { name: searchRegex },
      { email: searchRegex },
      { employeeId: searchRegex }
    ],
    isActive: true,
    isBlocked: false
  })
  .limit(limit)
  .select('name email role avatar department');
};

// Virtual for full name (if needed later)
UserSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// Virtual for online status
UserSchema.virtual('isOnline').get(function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastActive > fiveMinutesAgo;
});

// Transform function for JSON output
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Remove sensitive fields
    delete ret.password;
    delete ret.tokenVersion;
    delete ret.emailVerificationToken;
    delete ret.passwordResetToken;
    delete ret.__v;
    
    // Rename _id to id
    ret.id = ret._id;
    delete ret._id;
    
    return ret;
  }
});

// Transform function for object output
UserSchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.tokenVersion;
    delete ret.emailVerificationToken;
    delete ret.passwordResetToken;
    delete ret.__v;
    
    ret.id = ret._id;
    delete ret._id;
    
    return ret;
  }
});

// Middleware to set default permissions based on role
UserSchema.pre('save', function(next) {
  if (this.isModified('role') || this.isNew) {
    // Set default permissions based on role
    switch (this.role) {
      case 'admin':
        this.permissions = [
          'read_conversations',
          'write_conversations',
          'delete_conversations',
          'manage_users',
          'manage_equipment',
          'manage_maintenance',
          'view_analytics',
          'admin_access'
        ];
        break;
      case 'knowledge_manager':
        this.permissions = [
          'read_conversations',
          'write_conversations',
          'delete_conversations',
          'manage_equipment',
          'manage_maintenance',
          'view_analytics'
        ];
        break;
      case 'team_lead':
        this.permissions = [
          'read_conversations',
          'write_conversations',
          'manage_equipment',
          'manage_maintenance',
          'view_analytics'
        ];
        break;
      case 'engineer':
        this.permissions = [
          'read_conversations',
          'write_conversations',
          'manage_equipment',
          'manage_maintenance'
        ];
        break;
      case 'technician':
      default:
        this.permissions = [
          'read_conversations',
          'write_conversations'
        ];
        break;
    }
  }
  next();
});

// Error handling for duplicate key
UserSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    if (error.keyPattern.email) {
      next(new Error('Email already exists'));
    } else if (error.keyPattern.googleId) {
      next(new Error('Google account already linked to another user'));
    } else {
      next(new Error('Duplicate key error'));
    }
  } else {
    next(error);
  }
});

// Model compilation
const User = mongoose.model('User', UserSchema);

module.exports = User;