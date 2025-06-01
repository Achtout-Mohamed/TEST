// require('dotenv').config();
// const express = require('express');
// const http = require('http');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const path = require('path');
// const { initializeSocket } = require('./socket/socketManager');
// const logger = require('./utils/logger');

// // Create Express app
// const app = express();

// // Create HTTP server with Express app
// const server = http.createServer(app);

// // Initialize Socket.IO with the server
// const io = initializeSocket(server);

// // Store IO instance on app for use in routes
// app.set('io', io);

// // Middlewares
// app.use(cors({
//   origin: process.env.CLIENT_URL || '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Static files for production
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../client/build')));
// }

// // API routes
// app.use('/api/auth', require('./api/routes/auth'));
// app.use('/api/messages', require('./api/routes/messages'));
// app.use('/api/conversations', require('./api/routes/conversations'));

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.status(200).json({ 
//     status: 'OK',
//     version: process.env.npm_package_version || '1.0.0',
//     socketConnected: !!io
//   });
// });

// // Handle SPA for production
// if (process.env.NODE_ENV === 'production') {
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../client/build/index.html'));
//   });
// }

// // Error handling middleware
// app.use((err, req, res, next) => {
//   logger.error(`API error: ${err.message}`);
  
//   res.status(err.statusCode || 500).json({
//     success: false,
//     message: err.message || 'Server Error',
//     stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
//   });
// });

// // Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => {
//   logger.info('Connected to MongoDB');
// })
// .catch((err) => {
//   logger.error(`MongoDB connection error: ${err.message}`);
//   process.exit(1);
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   logger.info(`Server running on port ${PORT}`);
//   logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err) => {
//   logger.error(`Unhandled Promise Rejection: ${err.message}`);
//   logger.error(err.stack);
//   if (process.env.NODE_ENV !== 'production') {
//     process.exit(1);
//   }
// });

// module.exports = { app, server, io };

require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { initializeSocket } = require('./socket/socketManager');
const logger = require('./utils/logger');

// Create Express app
const app = express();

// Create HTTP server with Express app
const server = http.createServer(app);

// Initialize Socket.IO with the server
const io = initializeSocket(server);

// Store IO instance on app for use in routes
app.set('io', io);

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// IMPORTANT: Increase payload limits for image uploads
app.use(express.json({ 
  limit: '10mb',  // Increased from default 100kb to handle base64 images
  extended: true 
}));

app.use(express.urlencoded({ 
  limit: '10mb',  // Increased from default 100kb
  extended: true 
}));

// Static files for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// API routes
app.use('/api/auth', require('./api/routes/auth'));
app.use('/api/messages', require('./api/routes/messages'));
app.use('/api/conversations', require('./api/routes/conversations'));

// Add users route for profile management (you'll need to create this)
// app.use('/api/users', require('./api/routes/users'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    version: process.env.npm_package_version || '1.0.0',
    socketConnected: !!io,
    payloadLimit: '10mb'  // Added to show current limit
  });
});

// Handle SPA for production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Enhanced error handling middleware for payload errors
app.use((err, req, res, next) => {
  // Handle payload too large error specifically
  if (err.type === 'entity.too.large') {
    logger.error(`Payload too large error: ${err.message}`);
    return res.status(413).json({
      success: false,
      message: 'File too large. Maximum size is 10MB.',
      error: 'PAYLOAD_TOO_LARGE'
    });
  }

  // Handle other JSON parsing errors
  if (err.type === 'entity.parse.failed') {
    logger.error(`JSON parse error: ${err.message}`);
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format',
      error: 'INVALID_JSON'
    });
  }

  // General error handling
  logger.error(`API error: ${err.message}`);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  logger.info('Connected to MongoDB');
})
.catch((err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Payload limit set to: 10MB`);  // Log the payload limit
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Promise Rejection: ${err.message}`);
  logger.error(err.stack);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

module.exports = { app, server, io };