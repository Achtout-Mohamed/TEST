// // src/services/socketService.js

// import { io } from 'socket.io-client';

// // Define the API URL and socket endpoint
// const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// class SocketService {
//   constructor() {
//     this.socket = null;
//     this.listeners = new Map();
//     this.isConnected = false;
//   }

//   // Initialize socket connection
//   connect(token) {
//     if (this.socket && this.isConnected) {
//       console.log('Socket already connected');
//       return;
//     }

//     // Initialize socket with auth token
//     this.socket = io(SOCKET_URL, {
//       auth: {
//         token
//       },
//       transports: ['websocket'],
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000
//     });

//     // Setup default event handlers
//     this.socket.on('connect', () => {
//       console.log('Socket connected:', this.socket.id);
//       this.isConnected = true;
//     });

//     this.socket.on('disconnect', (reason) => {
//       console.log('Socket disconnected:', reason);
//       this.isConnected = false;
//     });

//     this.socket.on('error', (error) => {
//       console.error('Socket error:', error);
//     });

//     return this.socket;
//   }

//   // Disconnect socket
//   disconnect() {
//     if (this.socket) {
//       this.socket.disconnect();
//       this.socket = null;
//       this.isConnected = false;
//       console.log('Socket disconnected by client');
//     }
//   }

//   // Check if socket is connected
//   isConnected() {
//     return this.socket && this.socket.connected;
//   }

//   // Set up connection event handlers
//   onConnect(callback) {
//     if (this.socket) {
//       this.socket.on('connect', callback);
//     }
//   }

//   onDisconnect(callback) {
//     if (this.socket) {
//       this.socket.on('disconnect', callback);
//     }
//   }

//   // Join a conversation room
//   joinConversation(conversationId) {
//     if (!this.socket || !this.isConnected) {
//       console.error('Socket not connected');
//       return;
//     }

//     this.socket.emit('join_conversation', { conversationId });
//     console.log('Joined conversation:', conversationId);
//   }

//   // Leave a conversation room
//   leaveConversation(conversationId) {
//     if (!this.socket || !this.isConnected) {
//       console.error('Socket not connected');
//       return;
//     }

//     this.socket.emit('leave_conversation', { conversationId });
//     console.log('Left conversation:', conversationId);
//   }

//   // Send a message
//   sendMessage(message) {
//     if (!this.socket || !this.isConnected) {
//       console.error('Socket not connected');
//       return false;
//     }

//     this.socket.emit('send_message', message);
//     return true;
//   }

//   // Subscribe to new messages
//   subscribeToMessages(callback) {
//     if (!this.socket) {
//       console.error('Socket not connected');
//       return () => {};
//     }

//     // Store the callback in our listeners map
//     this.listeners.set('new_message', callback);
//     this.socket.on('new_message', callback);

//     // Return unsubscribe function
//     return () => {
//       this.socket.off('new_message', callback);
//       this.listeners.delete('new_message');
//     };
//   }

//   // Subscribe to typing indicators
//   subscribeToTyping(callback) {
//     if (!this.socket) {
//       console.error('Socket not connected');
//       return () => {};
//     }

//     // Store the callback in our listeners map
//     this.listeners.set('typing', callback);
//     this.socket.on('typing', callback);

//     // Return unsubscribe function
//     return () => {
//       this.socket.off('typing', callback);
//       this.listeners.delete('typing');
//     };
//   }

//   // Send typing indicator
//   sendTyping(conversationId, isTyping) {
//     if (!this.socket || !this.isConnected) {
//       console.error('Socket not connected');
//       return;
//     }

//     this.socket.emit('typing', { conversationId, isTyping });
//   }

//   // Subscribe to message read status updates
//   subscribeToReadReceipts(callback) {
//     if (!this.socket) {
//       console.error('Socket not connected');
//       return () => {};
//     }

//     // Store the callback in our listeners map
//     this.listeners.set('message_read', callback);
//     this.socket.on('message_read', callback);

//     // Return unsubscribe function
//     return () => {
//       this.socket.off('message_read', callback);
//       this.listeners.delete('message_read');
//     };
//   }

//   // Send read receipt
//   sendReadReceipt(conversationId, messageId) {
//     if (!this.socket || !this.isConnected) {
//       console.error('Socket not connected');
//       return;
//     }

//     this.socket.emit('message_read', { conversationId, messageId });
//   }

//   // Subscribe to online status updates
//   subscribeToOnlineStatus(callback) {
//     if (!this.socket) {
//       console.error('Socket not connected');
//       return () => {};
//     }

//     // Store the callback in our listeners map
//     this.listeners.set('online_status', callback);
//     this.socket.on('online_status', callback);

//     // Return unsubscribe function
//     return () => {
//       this.socket.off('online_status', callback);
//       this.listeners.delete('online_status');
//     };
//   }

//   // Clean up all socket event listeners
//   cleanUp() {
//     if (this.socket) {
//       // Clean up all registered event listeners
//       for (const [event, callback] of this.listeners.entries()) {
//         this.socket.off(event, callback);
//       }
      
//       this.listeners.clear();
//       this.disconnect();
//     }
//   }
// }

// // Create singleton instance
// const socketService = new SocketService();

// export default socketService;

// src/services/socketService.js - FIXED VERSION

import { io } from 'socket.io-client';

// FIXED: Use base URL, not API URL
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false; // FIXED: Renamed to avoid conflict
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket && this.connected) {
      console.log('Socket already connected');
      return;
    }

    console.log('🔌 Connecting to socket:', SOCKET_URL);

    // Initialize socket with auth token
    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'], // FIXED: Allow polling fallback
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    // In your connect() method, add after socket initialization:
console.log('🔌 Attempting socket connection to:', SOCKET_URL);
console.log('🔐 Using token:', token ? 'Present' : 'Missing');

this.socket.on('connect', () => {
  console.log('✅ Socket connected:', this.socket.id);
  this.connected = true;
});

this.socket.on('connect_error', (error) => {
  console.log('💥 Socket connection error:', error.message);
  console.log('💥 Error details:', error);
});
this.socket.onAny((eventName, ...args) => {
  console.log('📡 ALL SOCKET EVENTS:', eventName, args);
});

    // Setup default event handlers
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.log('💥 Socket connection error:', error.message);
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('💥 Socket error:', error);
    });

    // FIXED: Add authentication confirmation handler
    this.socket.on('authenticated', (data) => {
      console.log('🔐 Socket authenticated:', data);
    });
    
    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('Socket disconnected by client');
    }
  }

  // FIXED: Check if socket is connected (renamed method)
  isSocketConnected() {
    return this.socket && this.socket.connected;
  }

  // Set up connection event handlers
  onConnect(callback) {
    if (this.socket) {
      this.socket.on('connect', callback);
    }
  }

  onDisconnect(callback) {
    if (this.socket) {
      this.socket.on('disconnect', callback);
    }
  }

  // Join a conversation room
  // In socketService.js - joinConversation method:
joinConversation(conversationId) {
  if (!this.socket || !this.connected) {
    console.error('Socket not connected');
    return;
  }

  this.socket.emit('join_conversation', conversationId);
  console.log('🚪 Joined conversation:', conversationId);
}

// In socketService.js - subscribeToMessages method:
subscribeToMessages(callback) {
  if (!this.socket) {
    console.error('Socket not connected');
    return () => {};
  }

  console.log('🎯 Setting up new_message listener');
  
  this.socket.on('new_message', (data) => {
    console.log('🔥 RECEIVED new_message:', data);
    callback(data);
  });

  return () => {
    this.socket.off('new_message', callback);
  };
}

  // Leave a conversation room
  leaveConversation(conversationId) {
    if (!this.socket || !this.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('leave_conversation', conversationId); // FIXED: Send just the ID, not object
    console.log('👋 Left conversation:', conversationId);
  }

  // Send a message
  sendMessage(message) {
    if (!this.socket || !this.connected) {
      console.error('Socket not connected');
      return false;
    }

    this.socket.emit('send_message', message);
    console.log('📤 Sent message:', message);
    return true;
  }

  // Subscribe to new messages
  subscribeToMessages(callback) {
  if (!this.socket) {
    console.error('Socket not connected');
    return () => {};
  }

  // Try multiple possible event names
  this.socket.on('new_message', callback);
  this.socket.on('message', callback); 
  this.socket.on('newMessage', callback);
  this.socket.on('messageCreated', callback);

  // Return unsubscribe function
  return () => {
    this.socket.off('new_message', callback);
    this.socket.off('message', callback);
    this.socket.off('newMessage', callback);
    this.socket.off('messageCreated', callback);
  };
}

  // Subscribe to typing indicators
  subscribeToTyping(callback) {
    if (!this.socket) {
      console.error('Socket not connected');
      return () => {};
    }

    // FIXED: Listen to correct events
    const typingStart = (data) => callback({ ...data, isTyping: true });
    const typingStop = (data) => callback({ ...data, isTyping: false });

    this.socket.on('user_typing', typingStart);
    this.socket.on('user_stopped_typing', typingStop);

    // Return unsubscribe function
    return () => {
      this.socket.off('user_typing', typingStart);
      this.socket.off('user_stopped_typing', typingStop);
    };
  }

  // Send typing indicator
  sendTyping(conversationId, isTyping) {
    if (!this.socket || !this.connected) {
      console.error('Socket not connected');
      return;
    }

    // FIXED: Send correct events
    if (isTyping) {
      this.socket.emit('typing_start', { conversationId });
    } else {
      this.socket.emit('typing_stop', { conversationId });
    }
  }

  // Subscribe to message read status updates
  subscribeToReadReceipts(callback) {
    if (!this.socket) {
      console.error('Socket not connected');
      return () => {};
    }

    this.listeners.set('message_read', callback);
    this.socket.on('message_read', callback);

    return () => {
      this.socket.off('message_read', callback);
      this.listeners.delete('message_read');
    };
  }

  // Send read receipt
  sendReadReceipt(conversationId, messageId) {
    if (!this.socket || !this.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('message_read', { conversationId, messageId });
  }

  // Subscribe to online status updates
  subscribeToOnlineStatus(callback) {
    if (!this.socket) {
      console.error('Socket not connected');
      return () => {};
    }

    this.listeners.set('user_offline', callback);
    this.socket.on('user_offline', callback);

    return () => {
      this.socket.off('user_offline', callback);
      this.listeners.delete('user_offline');
    };
  }

  // Clean up all socket event listeners
  cleanUp() {
    if (this.socket) {
      // Clean up all registered event listeners
      for (const [event, callback] of this.listeners.entries()) {
        this.socket.off(event, callback);
      }
      
      this.listeners.clear();
      this.disconnect();
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;