// // src/config/database.js

// const mongoose = require('mongoose');
// const logger = require('../utils/logger');

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     logger.info(`MongoDB Connected: ${conn.connection.host}`);
//     return conn;
//   } catch (error) {
//     logger.error(`Error connecting to MongoDB: ${error.message}`);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;

// src/config/database.js
require('dotenv').config();

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGO_URI);

    // Remove deprecated options for MongoDB driver 4.0.0+
    const conn = await mongoose.connect(process.env.MONGO_URI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    
    if (error.message.includes('undefined')) {
      console.error('❌ MONGO_URI is not defined. Please check your .env file.');
      console.error('   Expected: MONGO_URI=mongodb://localhost:27017/maintenance_chat');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;