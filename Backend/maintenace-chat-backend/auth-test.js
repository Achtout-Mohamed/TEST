const io = require('socket.io-client');

// Replace this with a valid JWT token from your application
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODI1ZGI4ZGJjMWEzNWU0NTlkZjFkMWYiLCJpYXQiOjE3NDc4NDI2ODUsImV4cCI6MTc1MDQzNDY4NX0.yZE14rZWM6vkwgPYzCRP-JBZ_I7GC9n7r20G8a9xs4Q';

console.log('Attempting to connect with authentication...');

const socket = io('http://localhost:5000', {
  auth: {
    token: TOKEN
  },
  transports: ['polling', 'websocket']
});

socket.on('connect', () => {
  console.log('Connected successfully!');
  console.log('Socket ID:', socket.id);
  
  // Try joining a conversation
  const CONVERSATION_ID = '6828786c04c339e2eca88ba5'; // Replace with a valid conversation ID
  socket.emit('join_conversation', { conversationId: CONVERSATION_ID });
  
  // Send a test message after 2 seconds
  setTimeout(() => {
    console.log('Sending test message...');
    socket.emit('send_message', {
      conversationId: CONVERSATION_ID,
      content: 'Test message from Node.js client'
    });
  }, 2000);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Listen for events
socket.on('new_message', (data) => {
  console.log('Received new message:', data);
});

socket.on('user_joined', (data) => {
  console.log('User joined:', data);
});

// Exit after 10 seconds
setTimeout(() => {
  console.log('Test complete, disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 10000);