// src/models/SparePart.js
const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
  partNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    required: true // e.g., 'filters', 'belts', 'bearings', 'seals'
  },
  compatibleEquipment: [{
    type: String // Array of equipment IDs
  }],
  currentStock: {
    type: Number,
    default: 0,
    min: 0
  },
  minimumStock: {
    type: Number,
    default: 1,
    min: 0
  },
  maximumStock: {
    type: Number,
    default: 100
  },
  unit: {
    type: String,
    default: 'piece' // e.g., 'piece', 'meter', 'liter', 'kg'
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  supplier: {
    name: String,
    contact: String,
    email: String,
    phone: String,
    deliveryTime: Number, // in days
    minimumOrderQuantity: {
      type: Number,
      default: 1
    }
  },
  specifications: {
    dimensions: String,
    weight: String,
    material: String,
    color: String,
    model: String
  },
  lastOrdered: {
    type: Date
  },
  lastUsed: {
    type: Date
  },
  averageUsagePerMonth: {
    type: Number,
    default: 0
  },
  location: {
    warehouse: String,
    rack: String,
    bin: String
  },
  qrCode: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  replacementParts: [{
    partNumber: String,
    compatibility: String
  }]
}, {
  timestamps: true
});

// Create indexes for better query performance
sparePartSchema.index({ category: 1 });
sparePartSchema.index({ currentStock: 1, minimumStock: 1 });
sparePartSchema.index({ compatibleEquipment: 1 });

// Add a pre-save middleware to check if stock needs reordering
sparePartSchema.pre('save', function(next) {
  if (this.currentStock <= this.minimumStock) {
    // Log or trigger reorder alert
    console.log(`Low stock alert for ${this.name} (${this.partNumber}): ${this.currentStock} remaining`);
  }
  next();
});

module.exports = mongoose.model('SparePart', sparePartSchema);