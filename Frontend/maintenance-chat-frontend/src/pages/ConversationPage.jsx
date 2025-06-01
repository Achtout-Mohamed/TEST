// Alternative version without icon dependencies

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Common/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import './ConversationPage.css';

const ConversationPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  
  // Function to navigate back to the home/dashboard page
  const goToHomePage = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="conversation-page">
      <Sidebar />
      {conversationId ? (
        <ChatWindow />
      ) : (
        <div className="no-conversation-selected">
          <div className="no-conversation-content">
            <h2>Welcome to Your Conversations</h2>
            <p>Select a conversation from the sidebar or create a new one to get started.</p>
            <div className="navigation-buttons">
              <button 
                className="back-to-home-btn"
                onClick={goToHomePage}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationPage;