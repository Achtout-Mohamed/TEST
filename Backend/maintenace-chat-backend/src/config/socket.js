// config/socket.js

/**
 * Socket.IO configuration options
 */
module.exports = {
  // Connection settings
  connectionTimeout: 30000,
  
  // Ping interval in milliseconds
  pingInterval: 25000,
  
  // Ping timeout in milliseconds 
  pingTimeout: 10000,
  
  // Available transports
  transports: ['websocket', 'polling'],
  
  // Reconnection settings
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  
  // Event timeouts
  typingTimeout: 5000, // How long typing indicator lasts
  
  // Max users shown as typing
  maxTypingUsers: 3,
  
  // Debug settings
  debug: process.env.NODE_ENV !== 'production'
};