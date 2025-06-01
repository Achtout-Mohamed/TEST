// ConversationList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';

const ConversationList = () => {
  const navigate = useNavigate();
  const { conversations, createConversation } = useChat();

  const handleNewConversation = async () => {
    try {
      const newConversationId = await createConversation();
      navigate(`/conversations/${newConversationId}`);
    } catch (error) {
      console.error('Error creating new conversation:', error);
    }
  };

  return (
    <div className="conversation-list">
      <button onClick={handleNewConversation}>New Conversation</button>
      <div className="conversations">
        {conversations.map(conversation => (
          <div 
            key={conversation._id}
            className="conversation-item"
            onClick={() => navigate(`/conversations/${conversation._id}`)}
          >
            {conversation.title || 'Untitled Conversation'}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationList;