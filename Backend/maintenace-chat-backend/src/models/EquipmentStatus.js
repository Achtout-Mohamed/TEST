// src/models/EquipmentStatus.js
const mongoose = require('mongoose');

const equipmentStatusSchema = new mongoose.Schema({
  equipmentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true // e.g., 'pump', 'conveyor', 'motor', 'compressor'
  },
  location: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['operational', 'warning', 'critical', 'offline', 'maintenance'],
    default: 'operational'
  },
  lastMaintenanceDate: {
    type: Date
  },
  nextMaintenanceDate: {
    type: Date
  },
  maintenanceInterval: {
    type: Number, // in days
    default: 30
  },
  failurePrediction: {
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastPredicted: {
      type: Date,
      default: Date.now
    },
    factors: [{
      name: String,
      value: Number,
      description: String
    }]
  },
  specifications: {
    model: String,
    manufacturer: String,
    serialNumber: String,
    installationDate: Date,
    warrantyExpiry: Date,
    capacity: String,
    powerRating: String
  },
  sensors: [{
    type: String,
    value: Number,
    unit: String,
    lastUpdated: Date,
    threshold: {
      min: Number,
      max: Number
    }
  }],
  maintenanceHistory: [{
    date: Date,
    type: String,
    technician: String,
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
equipmentStatusSchema.index({ type: 1, status: 1 });
equipmentStatusSchema.index({ nextMaintenanceDate: 1 });
equipmentStatusSchema.index({ 'failurePrediction.riskLevel': 1 });

module.exports = mongoose.model('EquipmentStatus', equipmentStatusSchema);