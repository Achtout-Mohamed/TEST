import React, { useState, useEffect } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useSharing } from '../../hooks/useSharing';
import UserSearchInput from '../Common/UserSearchInput';
import PermissionSelector from './PermissionSelector';
import ShareLinkGenerator from './ShareLinkGenerator';
import Loader from '../Common/Loader';

const ShareDialog = ({ conversationId, onClose }) => {
  const { users, loading: loadingUsers, searchUsers } = useUsers();
  const { 
    shareConversation, 
    getSharedUsers, 
    removeSharedUser,
    generateShareLink,
    loading: loadingShare, 
    error 
  } = useSharing(conversationId);
  
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sharedUsers, setSharedUsers] = useState([]);
  const [shareLink, setShareLink] = useState('');
  
  // Load currently shared users on mount
  useEffect(() => {
    const loadSharedUsers = async () => {
      const users = await getSharedUsers();
      setSharedUsers(users || []);
    };
    
    loadSharedUsers();
  }, [getSharedUsers]);
  
  // Handle user search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      await searchUsers(query);
    }
  };
  
  // Handle user selection
  const handleSelectUser = (user) => {
    // Check if user is already selected
    if (!selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, {
        id: user.id,
        name: user.name,
        email: user.email,
        permissions: 'read'
      }]);
    }
    
    // Clear search
    setSearchQuery('');
  };
  
  // Handle permission change
  const handlePermissionChange = (userId, permission) => {
    setSelectedUsers(selectedUsers.map(user => 
      user.id === userId 
        ? { ...user, permissions: permission } 
        : user
    ));
  };
  
  // Handle removing a user from selection
  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userId));
  };
  
  // Handle removing a currently shared user
  const handleRemoveSharedUser = async (userId) => {
    const success = await removeSharedUser(userId);
    if (success) {
      setSharedUsers(sharedUsers.filter(user => user.id !== userId));
    }
  };
  
  // Handle share action
  const handleShare = async () => {
    if (selectedUsers.length === 0) return;
    
    const success = await shareConversation(selectedUsers);
    
    if (success) {
      // Update shared users list
      setSharedUsers([...sharedUsers, ...selectedUsers]);
      setSelectedUsers([]);
    }
  };
  
  // Handle generate share link
  const handleGenerateLink = async () => {
    const link = await generateShareLink();
    setShareLink(link);
  };
  
  return (
    <div className="share-dialog-overlay">
      <div className="share-dialog">
        <div className="share-dialog-header">
          <h3>Share Conversation</h3>
          <button className="close-button" onClick={onClose} aria-label="Close">×</button>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="share-dialog-content">
          <div className="user-search-section">
            <h4>Add people</h4>
            <UserSearchInput 
              value={searchQuery}
              onChange={handleSearch}
              onSelectUser={handleSelectUser}
              users={users}
              loading={loadingUsers}
              placeholder="Search by name or email"
            />
          </div>
          
          {selectedUsers.length > 0 && (
            <div className="selected-users-section">
              <h4>People to share with</h4>
              <ul className="selected-users-list">
                {selectedUsers.map(user => (
                  <li key={user.id} className="selected-user-item">
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                    <PermissionSelector 
                      value={user.permissions}
                      onChange={(permission) => handlePermissionChange(user.id, permission)}
                    />
                    <button 
                      className="remove-user-button" 
                      onClick={() => handleRemoveUser(user.id)}
                      aria-label="Remove user"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              
              <button 
                className="share-button"
                onClick={handleShare}
                disabled={loadingShare || selectedUsers.length === 0}
              >
                {loadingShare ? <Loader size="small" /> : 'Share'}
              </button>
            </div>
          )}
          
          {sharedUsers.length > 0 && (
            <div className="shared-users-section">
              <h4>Currently shared with</h4>
              <ul className="shared-users-list">
                {sharedUsers.map(user => (
                  <li key={user.id} className="shared-user-item">
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                    <span className="permission-tag">
                      {user.permissions}
                    </span>
                    <button 
                      className="remove-shared-button" 
                      onClick={() => handleRemoveSharedUser(user.id)}
                      aria-label="Remove shared access"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="share-link-section">
            <h4>Or generate a share link</h4>
            <ShareLinkGenerator 
              onGenerate={handleGenerateLink}
              shareLink={shareLink}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;