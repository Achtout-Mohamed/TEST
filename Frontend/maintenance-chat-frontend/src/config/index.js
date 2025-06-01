// src/config/index.js

// API configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// Socket.IO configuration
const SOCKET_CONFIG = {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
};

// Message configuration
const MESSAGE_CONFIG = {
  maxLength: 5000,
  typingTimeout: 2000,
  maxAttachments: 10
};

// Auth configuration
const AUTH_CONFIG = {
  tokenKey: 'token',
  userKey: 'user'
};

export {
  API_URL,
  SOCKET_URL,
  SOCKET_CONFIG,
  MESSAGE_CONFIG,
  AUTH_CONFIG
};

export default {
  API_URL,
  SOCKET_URL,
  SOCKET_CONFIG,
  MESSAGE_CONFIG,
  AUTH_CONFIG
};