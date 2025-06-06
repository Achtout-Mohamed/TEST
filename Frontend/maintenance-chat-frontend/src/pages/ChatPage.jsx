// src/pages/ChatPage.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Common/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import { ChatProvider } from '../contexts/ChatContext';
import './ChatPage.css';

const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  
  const handleCreateNewChat = () => {
    // Trigger the new conversation modal in sidebar
    // You can implement this by passing a ref or state to Sidebar
    console.log('Create new chat clicked');
  };

  const handleCreateAIChat = () => {
    // Trigger AI chat creation
    console.log('Create AI chat clicked');
  };
  
  return (
    <ChatProvider>
      <div className="chat-page">
        <div className="chat-layout">
          <Sidebar />
          <div className="chat-main">
            {conversationId ? (
              <ChatWindow />
            ) : (
              <div className="no-conversation-selected">
                <div className="no-conversation-content">
                  <h2>Welcome to Ovivia AI</h2>
                  <p>
                    Your intelligent maintenance assistant is ready to help. 
                    Select a conversation from the sidebar or start a new one to begin.
                  </p>
                  <div className="welcome-actions">
                    <button 
                      className="welcome-btn primary"
                      onClick={handleCreateAIChat}
                    >
                      🤖 Start AI Chat
                    </button>
                    <button 
                      className="welcome-btn secondary"
                      onClick={handleCreateNewChat}
                    >
                      💬 New Conversation
                    </button>
                    <button 
                      className="welcome-btn secondary"
                      onClick={() => navigate('/dashboard')}
                    >
                      📊 Dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ChatProvider>
  );
};

export default ChatPage;