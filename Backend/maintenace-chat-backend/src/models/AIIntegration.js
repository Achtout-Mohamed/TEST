// src/models/AIIntegration.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const aiIntegrationSchema = new Schema({
  apiKey: {
    type: String,
    required: true
  },
  usageLimit: {
    type: Number,
    required: true,
    default: 10000
  },
  currentUsage: {
    type: Number,
    default: 0
  },
  lastReset: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('AIIntegration', aiIntegrationSchema);