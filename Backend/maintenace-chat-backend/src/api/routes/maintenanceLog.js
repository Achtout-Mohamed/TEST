// src/api/routes/maintenanceLog.js
const express = require('express');
const router = express.Router();
const {
  createMaintenanceLog,
  getMaintenanceLogs,
  getMaintenanceLogById
} = require('../controllers/maintenanceLogController');

// Routes
router.post('/log_operation', createMaintenanceLog);
router.get('/get_logs', getMaintenanceLogs);