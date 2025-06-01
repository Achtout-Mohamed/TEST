// src/models/MaintenanceSchedule.js
const mongoose = require('mongoose');

const maintenanceScheduleSchema = new mongoose.Schema({
  equipmentId: {
    type: String,
    required: true,
    index: true
  },
  taskDescription: {
    type: String,
    required: true
  },
  taskType: {
    type: String,
    enum: ['preventive', 'predictive', 'corrective', 'emergency'],
    default: 'preventive'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'semi-annual', 'annual', 'as-needed'],
    required: true
  },
  frequencyValue: {
    type: Number, // e.g., every 2 weeks, every 3 months
    default: 1
  },
  nextDueDate: {
    type: Date,
    required: true
  },
  lastCompletedDate: {
    type: Date
  },
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  backupTechnicians: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  requiredParts: [{
    partNumber: String,
    quantity: Number,
    isOptional: {
      type: Boolean,
      default: false
    }
  }],
  requiredTools: [{
    name: String,
    isOptional: {
      type: Boolean,
      default: false
    }
  }],
  safetyRequirements: [{
    type: String
  }],
  instructions: {
    type: String
  },
  checklistItems: [{
    description: String,
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedBy: String,
    completedAt: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  notificationSettings: {
    advanceNotice: {
      type: Number, // days before due date
      default: 3
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  completionHistory: [{
    completedDate: Date,
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    actualDuration: Number,
    notes: String,
    issuesFound: String,
    nextDueDate: Date
  }]
}, {
  timestamps: true
});

// Create indexes for better query performance
maintenanceScheduleSchema.index({ nextDueDate: 1 });
maintenanceScheduleSchema.index({ equipmentId: 1, isActive: 1 });
maintenanceScheduleSchema.index({ assignedTechnician: 1, nextDueDate: 1 });

// Add a method to calculate next due date
maintenanceScheduleSchema.methods.calculateNextDueDate = function() {
  const currentDate = this.lastCompletedDate || new Date();
  const nextDate = new Date(currentDate);
  
  switch (this.frequency) {
    case 'daily':
      nextDate.setDate(currentDate.getDate() + this.frequencyValue);
      break;
    case 'weekly':
      nextDate.setDate(currentDate.getDate() + (this.frequencyValue * 7));
      break;
    case 'monthly':
      nextDate.setMonth(currentDate.getMonth() + this.frequencyValue);
      break;
    case 'quarterly':
      nextDate.setMonth(currentDate.getMonth() + (this.frequencyValue * 3));
      break;
    case 'semi-annual':
      nextDate.setMonth(currentDate.getMonth() + (this.frequencyValue * 6));
      break;
    case 'annual':
      nextDate.setFullYear(currentDate.getFullYear() + this.frequencyValue);
      break;
  }
  
  return nextDate;
};

module.exports = mongoose.model('MaintenanceSchedule', maintenanceScheduleSchema);