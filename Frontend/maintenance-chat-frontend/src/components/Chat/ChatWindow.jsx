// src/components/Chat/ChatWindow.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { MessageProvider } from '../../contexts/MessageContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './ChatWindow.css';

const ChatWindow = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentConversation,
    fetchConversation,
    updateConversation,
    deleteConversation,
    addParticipants,
    removeParticipant,
    loading,
    error
  } = useChat();
  
  const {
    joinConversation,
    leaveConversation,
    connected: socketConnected
  } = useSocket();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedTags, setEditedTags] = useState('');
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [newParticipantId, setNewParticipantId] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [conversationDocuments, setConversationDocuments] = useState([]);
  
  // Check if this is an AI-enabled conversation
  const isAIConversation = currentConversation?.aiEnabled || 
    currentConversation?.participants?.some(p => p.email === 'ai@system.local');
  
  // Fetch conversation when ID changes
  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId)
        .catch(error => {
          if (error.response && error.response.status === 403) {
            navigate('/conversations');
            console.error('You do not have permission to view this conversation');
          }
        });
    }
  }, [conversationId, fetchConversation, navigate]);
  
  // Join the conversation socket room
  useEffect(() => {
    if (currentConversation && socketConnected) {
      joinConversation(conversationId);
      
      return () => {
        leaveConversation();
      };
    }
  }, [currentConversation, socketConnected, conversationId, joinConversation, leaveConversation]);
  
  // Set form values when conversation data is loaded
  useEffect(() => {
    if (currentConversation) {
      setEditedTitle(currentConversation.title || '');
      setEditedTags((currentConversation.tags || []).join(', '));
    }
  }, [currentConversation]);
  
  // Check if user is conversation creator
  const isCreator = currentConversation && user && 
    currentConversation.createdBy?._id === user._id;
  
  // Handle conversation edit form submission
  const handleUpdateConversation = async (e) => {
    e.preventDefault();
    
    try {
      const tagsArray = editedTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      await updateConversation(conversationId, {
        title: editedTitle,
        tags: tagsArray
      });
      
      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  };
  
  // Handle adding a participant
  const handleAddParticipant = async (e) => {
    e.preventDefault();
    
    if (!newParticipantId.trim()) return;
    
    try {
      await addParticipants(conversationId, [newParticipantId]);
      setNewParticipantId('');
    } catch (error) {
      console.error('Error adding participant:', error);
    }
  };
  
  // Handle removing a participant
  const handleRemoveParticipant = async (userId) => {
    try {
      await removeParticipant(conversationId, userId);
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };
  
  // Handle conversation deletion
  const handleDeleteConversation = async () => {
    try {
      await deleteConversation(conversationId);
      navigate('/conversations');
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get AI status message
  const getAIStatusMessage = () => {
    if (isAIConversation) {
      return "🚀 Neural pathways active • Upload files for deep analysis • Ask anything about maintenance";
    }
    return null;
  };
  
  if (loading) {
    return (
      <div className="chat-window loading">
        <div className="neural-network">
          <div className="neural-line"></div>
          <div className="neural-line"></div>
          <div className="neural-line"></div>
          <div className="neural-line"></div>
        </div>
        <div>Establishing quantum connection...</div>
      </div>
    );
  }
  
  if (error) {
    return <div className="chat-window error">⚠️ Neural interface error: {error}</div>;
  }
  
  if (!currentConversation) {
    return <div className="chat-window not-found">🔍 Conversation not found in the quantum database</div>;
  }
  
  return (
    <div className={`chat-window ${isAIConversation ? 'ai-enabled' : ''}`}>
      {/* Neural Network Background */}
      <div className="neural-network">
        <div className="neural-line"></div>
        <div className="neural-line"></div>
        <div className="neural-line"></div>
        <div className="neural-line"></div>
      </div>

      <div className="chat-header">
  {isEditMode ? (
    <form className="edit-conversation-form" onSubmit={handleUpdateConversation} style={{ width: '100%' }}>
      <input
        type="text"
        value={editedTitle}
        onChange={(e) => setEditedTitle(e.target.value)}
        placeholder="Conversation title..."
        className="title-input"
        required
      />
      <input
        type="text"
        value={editedTags}
        onChange={(e) => setEditedTags(e.target.value)}
        placeholder="Tags (comma-separated)"
        className="tags-input"
      />
      <div className="form-buttons">
        <button type="submit" className="save-btn">Save</button>
        <button
          type="button"
          onClick={() => setIsEditMode(false)}
          className="cancel-btn"
        >
          Cancel
        </button>
      </div>
    </form>
  ) : (
    <>
      <div className="chat-header-left">
        {isAIConversation && <span className="ai-indicator">🤖</span>}
        <h2>{currentConversation.title}</h2>
        {(isCreator || currentConversation.participants.some(p => p._id === user._id)) && (
          <button className="edit-btn" onClick={() => setIsEditMode(true)}>
            Configure
          </button>
        )}
      </div>

      <div className="chat-header-middle">
        {isAIConversation && <span className="ai-tag">AI Enhanced</span>}
        <span className="created-by">
          Created by: {currentConversation.createdBy?.name || 'Unknown'}
        </span>
        <span className="created-at">{formatDate(currentConversation.createdAt)}</span>
      </div>

      <div className="chat-header-right">
        <span className="connection-status">
          {socketConnected ? (
            <span className="connected">Connected</span>
          ) : (
            <span className="disconnected">Disconnected</span>
          )}
        </span>
        <button
          className="participants-btn"
          onClick={() => setShowParticipantsModal(!showParticipantsModal)}
        >
          Participants ({currentConversation.participants?.length || 0})
        </button>
        {isCreator && (
          <button
            className="delete-btn"
            onClick={() => setShowDeleteConfirmation(true)}
          >
            Delete
          </button>
        )}
      </div>
    </>
  )}
</div>

      
      {/* Participants Modal */}
      {showParticipantsModal && (
        <div className="participants-modal">
          <div className="modal-header">
            <h3>🎭 Mission Operatives</h3>
            <button 
              className="close-btn"
              onClick={() => setShowParticipantsModal(false)}
            >
              ×
            </button>
          </div>
          
          <div className="participants-list">
            {currentConversation.participants?.map((participant) => (
              <div key={participant._id} className="participant-item">
                <div className="participant-info">
                  {participant.email === 'ai@system.local' && <span className="ai-badge">🤖</span>}
                  <span>{participant.name || participant.email || 'Unknown Agent'}</span>
                </div>
                {isCreator && participant._id !== currentConversation.createdBy._id && 
                 participant.email !== 'ai@system.local' && (
                  <button
                    className="remove-participant-btn"
                    onClick={() => handleRemoveParticipant(participant._id)}
                  >
                    ❌ Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {(isCreator || currentConversation.isGroup) && (
            <form className="add-participant-form" onSubmit={handleAddParticipant}>
              <input
                type="text"
                placeholder="🆔 Agent ID"
                value={newParticipantId}
                onChange={(e) => setNewParticipantId(e.target.value)}
                className="participant-input"
              />
              <button type="submit" className="add-btn">➕ Recruit</button>
            </form>
          )}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="delete-modal">
          <div className="modal-content">
            <h3>⚠️ Mission Termination Protocol</h3>
            <p>Are you certain you want to permanently delete this conversation? This action will erase all data and cannot be undone. All neural pathways and quantum entanglements will be severed.</p>
            <div className="modal-actions">
              <button 
                className="confirm-delete-btn"
                onClick={handleDeleteConversation}
              >
                💥 Execute Termination
              </button>
              <button 
                className="cancel-delete-btn"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                🛡️ Abort Mission
              </button>
            </div>
          </div>
        </div>
      )}
      
      <MessageProvider>
        <div className="messages-container">
          <MessageList />
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              {typingUsers.length === 1 ? (
                <span>🎭 {typingUsers[0]} is transmitting data...</span>
              ) : typingUsers.length === 2 ? (
                <span>🎭 {typingUsers[0]} and {typingUsers[1]} are transmitting...</span>
              ) : (
                <span>🎭 Multiple agents are transmitting data...</span>
              )}
            </div>
          )}
        </div>
        
        <div className="message-input-container">
          <MessageInput conversationId={conversationId} />
        </div>
      </MessageProvider>
    </div>
  );
};

export default ChatWindow;