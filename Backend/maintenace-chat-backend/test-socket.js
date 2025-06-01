// test-socket.js
const io = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:5000';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODI1ZGI4ZGJjMWEzNWU0NTlkZjFkMWYiLCJpYXQiOjE3NDc5MTcxMTQsImV4cCI6MTc1MDUwOTExNH0.zKzHGNpNDf5oxcM3AqflZsRk3-wzOqtr6ZMbGi3zZ-k'; // Replace with actual token

// Create socket connection
const socket = io(SERVER_URL, {
  auth: {
    token: JWT_TOKEN
  },
  transports: ['websocket', 'polling']
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log('Socket ID:', socket.id);
  
  // Test joining a conversation
  testJoinConversation();
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

// Test functions
function testJoinConversation() {
  const conversationId = '6828786c04c339e2eca88ba5'; // Replace with actual ID
  
  console.log('\n🧪 Testing join conversation...');
  socket.emit('join_conversation', { conversationId });
}

function testSendMessage() {
  const message = {
    conversationId: '6828786c04c339e2eca88ba5',
    content: 'Test message from Node.js client',
    sender: '6825db8dbc1a35e459df1d1f',
    timestamp: new Date()
  };
  
  console.log('\n📤 Sending test message...');
  socket.emit('send_message', message);
}

function testTyping() {
  const conversationId = '6828786c04c339e2eca88ba5';
  
  console.log('\n⌨️  Testing typing indicator...');
  socket.emit('typing', { 
    conversationId, 
    isTyping: true 
  });
  
  // Stop typing after 3 seconds
  setTimeout(() => {
    socket.emit('typing', { 
      conversationId, 
      isTyping: false 
    });
  }, 3000);
}

function testMessageRead() {
  const data = {
    conversationId: '6828786c04c339e2eca88ba5',
    messageId: 'your_message_id_here'
  };
  
  console.log('\n👁️  Testing message read...');
  socket.emit('message_read', data);
}

// Event listeners
socket.on('user_joined', (data) => {
  console.log('👤 User joined:', data);
});

socket.on('user_left', (data) => {
  console.log('👤 User left:', data);
});

socket.on('new_message', (message) => {
  console.log('📨 New message received:', message);
});

socket.on('typing', (data) => {
  console.log('⌨️  Typing status:', data);
});

socket.on('message_read', (data) => {
  console.log('👁️  Message read:', data);
});

socket.on('online_status', (data) => {
  console.log('🟢 Online status:', data);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

// Interactive testing
console.log('🚀 Socket.IO Test Client Starting...');
console.log('Available commands:');
console.log('- Press "m" + Enter to send a test message');
console.log('- Press "t" + Enter to test typing');
console.log('- Press "r" + Enter to test message read');
console.log('- Press "q" + Enter to quit\n');

// Handle user input
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key) => {
  switch (key) {
    case 'm':
      testSendMessage();
      break;
    case 't':
      testTyping();
      break;
    case 'r':
      testMessageRead();
      break;
    case 'q':
    case '\u0003': // Ctrl+C
      console.log('\n👋 Goodbye!');
      process.exit(0);
      break;
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  socket.disconnect();
  process.exit(0);
});