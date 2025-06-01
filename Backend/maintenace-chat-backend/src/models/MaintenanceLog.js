// src/models/MaintenanceLog.js
const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  equipment: {
    type: String,
    required: true,
    index: true
  },
  operation: {
    type: String,
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    default: ''
  },
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 60
  },
  actualTime: {
    type: Number // in minutes
  },
  completedAt: {
    type: Date
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  partsUsed: [{
    partNumber: String,
    quantity: Number,
    cost: Number
  }]
}, {
  timestamps: true
});

// Create compound indexes for better query performance
maintenanceLogSchema.index({ equipment: 1, status: 1 });
maintenanceLogSchema.index({ createdAt: -1 });
maintenanceLogSchema.index({ technician: 1, status: 1 });

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);