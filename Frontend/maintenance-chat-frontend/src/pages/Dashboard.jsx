import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useChat from '../hooks/useChat';
import useGroups from '../hooks/useGroups';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/Common/Loader';
import './Dashboard.css';

const Dashboard = () => {
  const { conversations, loading: loadingConversations, error: conversationsError, createConversation } = useChat();
  const { groups, loading: loadingGroups, error: groupsError } = useGroups();
  const { user, logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('conversations');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  
  // Settings form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const navigate = useNavigate();
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Handle conversation click
  const handleConversationClick = (conversationId) => {
    navigate(`/conversations/${conversationId}`);
  };
  
  // Handle group click
  const handleGroupClick = (groupId) => {
    navigate(`/groups/${groupId}`);
  };
  
  // Toggle new conversation modal
  const toggleNewConversationModal = () => {
    setShowNewConversationModal(!showNewConversationModal);
    setNewConversationTitle('');
  };

  // Toggle settings modal
  const toggleSettingsModal = () => {
    setShowSettingsModal(!showSettingsModal);
    if (!showSettingsModal) {
      // Reset form when opening
      setProfileData({
        name: user?.name || '',
        email: user?.email || '',
        avatar: user?.avatar || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setAvatarPreview(user?.avatar || '');
      setProfileError('');
      setProfileSuccess('');
    }
  };
  
  // Handle create new conversation
  const handleCreateConversation = async () => {
    if (!newConversationTitle.trim()) return;
    
    try {
      const conversationData = {
        title: newConversationTitle.trim()
      };
      
      console.log('Creating conversation with:', conversationData);
      
      const newConversation = await createConversation(conversationData);
      
      if (newConversation) {
        toggleNewConversationModal();
        navigate(`/conversations/${newConversation._id}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    setProfileError('');
    setProfileSuccess('');
  };

  // Handle avatar file upload with compression
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Validate file first
      const validation = validateImageFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
      });

      if (!validation.valid) {
        setProfileError(validation.error);
        return;
      }

      setProfileError('');
      
      // Show loading state
      setAvatarPreview('loading');

      // Compress image
      const compressedImage = await compressImage(file, {
        maxWidth: 300,
        maxHeight: 300,
        quality: 0.8,
        format: 'jpeg'
      });

      // Update preview and form data
      setAvatarPreview(compressedImage);
      setProfileData(prev => ({
        ...prev,
        avatar: compressedImage
      }));

    } catch (error) {
      console.error('Image compression error:', error);
      setProfileError('Failed to process image. Please try again.');
      setAvatarPreview(user?.avatar || '');
    }
  };

  // Image compression utility functions
  const compressImage = (file, options = {}) => {
    return new Promise((resolve, reject) => {
      const {
        maxWidth = 300,
        maxHeight = 300,
        quality = 0.8,
        format = 'jpeg'
      } = options;

      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        let { width, height } = img;
        
        // Maintain aspect ratio while resizing
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL(`image/${format}`, quality);
        resolve(compressedBase64);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const validateImageFile = (file, options = {}) => {
    const {
      maxSize = 5 * 1024 * 1024,
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
    } = options;

    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Invalid file type. Please select a JPEG, PNG, WebP, or GIF image.' 
      };
    }

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return { 
        valid: false, 
        error: `File too large. Maximum size is ${maxSizeMB}MB.` 
      };
    }

    return { valid: true };
  };

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      // Validate form
      if (!profileData.name.trim()) {
        setProfileError('Name is required');
        setIsUpdatingProfile(false);
        return;
      }

      // If changing password, validate password fields
      if (profileData.newPassword) {
        if (!profileData.currentPassword) {
          setProfileError('Current password is required to change password');
          setIsUpdatingProfile(false);
          return;
        }
        
        if (profileData.newPassword.length < 6) {
          setProfileError('New password must be at least 6 characters');
          setIsUpdatingProfile(false);
          return;
        }

        if (profileData.newPassword !== profileData.confirmPassword) {
          setProfileError('New passwords do not match');
          setIsUpdatingProfile(false);
          return;
        }
      }

      // Prepare update data
      const updateData = {
        name: profileData.name.trim(),
        avatar: profileData.avatar
      };

      // Add password fields if changing password
      if (profileData.newPassword) {
        updateData.currentPassword = profileData.currentPassword;
        updateData.newPassword = profileData.newPassword;
      }

      // Call update profile function (you'll need to implement this in your auth hook)
      const result = await updateProfile(updateData);
      
      if (result.success) {
        setProfileSuccess('Profile updated successfully!');
        // Clear password fields
        setProfileData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        setProfileError(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setProfileError('An error occurred while updating profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    setProfileData(prev => ({
      ...prev,
      avatar: ''
    }));
  };

  // Generate avatar initials
  const getAvatarInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render empty state with custom icon
  const renderEmptyState = (type) => {
    const emptyStates = {
      conversations: {
        icon: '💬',
        title: 'No conversations yet',
        subtitle: 'Start your first AI-powered maintenance conversation',
      },
      shared: {
        icon: '🤝',
        title: 'Nothing shared yet',
        subtitle: 'Collaborate with your team by sharing conversations',
      },
      groups: {
        icon: '👥',
        title: 'No groups joined',
        subtitle: 'Join or create groups to collaborate with your team',
      },
    };

    const state = emptyStates[type];
    
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          {state.icon}
        </div>
        <h3>{state.title}</h3>
        <p>{state.subtitle}</p>
        {type === 'conversations' && (
          <button 
            className="btn btn-primary"
            onClick={toggleNewConversationModal}
          >
            <span>🚀</span> Start New Conversation
          </button>
        )}
        {type === 'groups' && (
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/groups')}
          >
            <span>🔍</span> Browse Groups
          </button>
        )}
      </div>
    );
  };
  
  return (
    <div className="dashboard-container">
      {/* Cosmic Particles */}
      <div className="cosmic-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <div className="dashboard-main">
        {/* Futuristic Header */}
        <div className="dashboard-header">
          <div className="dashboard-title">
            <div className="user-profile-section">
              <div className="user-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <div className="avatar-initials">
                    {getAvatarInitials(user?.name || 'User')}
                  </div>
                )}
              </div>
              <div className="user-info">
                <h1>Mission Control</h1>
                <div className="user-welcome">
                  Welcome back, <strong>{user?.name || 'Agent'}</strong>
                </div>
              </div>
            </div>
            <div className="dashboard-ai-status">
              <div className="ai-indicator"></div>
              <span>AI Online</span>
            </div>
          </div>
          <div className="dashboard-actions">
            <button 
              className="btn btn-settings" 
              onClick={toggleSettingsModal}
              title="Settings"
            >
              <span>⚙️</span> Settings
            </button>
            <button 
              className="btn btn-primary" 
              onClick={toggleNewConversationModal}
            >
              <span>⚡</span> New Mission
            </button>
            <button 
              className="btn btn-outline-danger" 
              onClick={handleLogout}
            >
              <span>🚪</span> Exit
            </button>
          </div>
        </div>
        
        {/* Holographic Tabs */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-button ${activeTab === 'conversations' ? 'active' : ''}`}
            onClick={() => handleTabChange('conversations')}
          >
            <span>🎯</span> My Missions
          </button>
          <button 
            className={`tab-button ${activeTab === 'shared' ? 'active' : ''}`}
            onClick={() => handleTabChange('shared')}
          >
            <span>🤝</span> Shared Intel
          </button>
          <button 
            className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => handleTabChange('groups')}
          >
            <span>👥</span> Squad Operations
          </button>
        </div>
        
        {/* Content Area */}
        <div className="dashboard-content">
          {activeTab === 'conversations' && (
            <div className="conversations-list">
              <h2>🎯 Active Missions</h2>
              
              {loadingConversations ? (
                <Loader message="Scanning mission database..." />
              ) : conversationsError ? (
                <div className="error-message">
                  <strong>Mission Failed:</strong> {conversationsError}
                </div>
              ) : conversations.filter(c => !c.isShared).length === 0 ? (
                renderEmptyState('conversations')
              ) : (
                <ul className="conversations-items">
                  {conversations
                    .filter(conversation => !conversation.isShared && !conversation.groupId)
                    .map(conversation => (
                      <li 
                        key={conversation._id} 
                        className="conversation-item"
                        onClick={() => handleConversationClick(conversation._id)}
                      >
                        <div className="conversation-icon">
                          <span>🤖</span>
                        </div>
                        <div className="conversation-details">
                          <h3>{conversation.title}</h3>
                          <p className="conversation-preview">
                            {conversation.lastMessage ? (
                              conversation.lastMessage.content.substring(0, 80) + 
                              (conversation.lastMessage.content.length > 80 ? '...' : '')
                            ) : 'Mission briefing pending...'}
                          </p>
                          <div className="conversation-meta">
                            <span className="conversation-date">
                              <span>📅</span> {formatDate(conversation.lastMessageAt || conversation.createdAt)}
                            </span>
                            {conversation.unreadCount > 0 && (
                              <span className="unread-badge">
                                {conversation.unreadCount} new
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}
          

{activeTab === 'shared' && (
  <div className="shared-conversations-list">
    <h2>🤝 Shared Intelligence</h2>
    
    {loadingConversations ? (
      <Loader message="Decrypting shared data..." />
    ) : conversationsError ? (
      <div className="error-message">
        <strong>Access Denied:</strong> {conversationsError}
      </div>
    ) : (() => {
      // 🔥 FILTER: Show conversations where current user was ADDED by someone else
      const sharedConversations = conversations.filter(conversation => {
        // Skip if no user
        if (!user?._id) return false;
        
        // Skip conversations created by current user
        if (conversation.createdBy?._id === user._id || conversation.owner?._id === user._id) {
          return false;
        }
        
        // Show if current user is in participants but didn't create it
        const isParticipant = conversation.participants?.some(p => 
          (p._id || p) === user._id
        );
        
        // Show if current user is in members but didn't create it  
        const isMember = conversation.members?.some(m => 
          (m._id || m) === user._id
        );
        
        // Show if conversation has sharedWith array containing current user
        const isSharedWith = conversation.sharedWith?.some(u => 
          (u._id || u) === user._id
        );
        
        // Show if conversation is marked as shared and user has access
        const isSharedConversation = conversation.isShared && 
          (isParticipant || isMember || isSharedWith);
        
        return isParticipant || isMember || isSharedWith || isSharedConversation;
      });
      
      console.log('🔍 SHARED CONVERSATIONS FILTER:', {
        totalConversations: conversations.length,
        sharedConversations: sharedConversations.length,
        currentUserId: user?._id,
        sharedDetails: sharedConversations.map(c => ({
          id: c._id,
          title: c.title,
          createdBy: c.createdBy?.name || c.owner?.name,
          participants: c.participants?.length || 0,
          members: c.members?.length || 0,
          sharedWith: c.sharedWith?.length || 0
        }))
      });
      
      return sharedConversations.length === 0 ? (
        renderEmptyState('shared')
      ) : (
        <ul className="conversations-items">
          {sharedConversations.map(conversation => (
            <li 
              key={conversation._id} 
              className="conversation-item shared"
              onClick={() => handleConversationClick(conversation._id)}
            >
              <div className="conversation-icon">
                <span>🔗</span>
              </div>
              <div className="conversation-details">
                <h3>{conversation.title}</h3>
                <p className="conversation-preview">
                  {conversation.lastMessage ? (
                    conversation.lastMessage.content.substring(0, 80) + 
                    (conversation.lastMessage.content.length > 80 ? '...' : '')
                  ) : 'Classified information...'}
                </p>
                <div className="conversation-meta">
                  <span className="shared-by">
                    <span>👤</span> Shared by: {
                      conversation.createdBy?.name || 
                      conversation.owner?.name || 
                      conversation.sharedBy?.name || 
                      'Agent Unknown'
                    }
                  </span>
                  <span className="conversation-date">
                    <span>📅</span> {formatDate(conversation.lastMessageAt || conversation.createdAt)}
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="unread-badge">
                      {conversation.unreadCount} new
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      );
    })()}
  </div>
)}

{activeTab === 'conversations' && (
  <div className="conversations-list">
    <h2>🎯 Active Missions</h2>
    
    {loadingConversations ? (
      <Loader message="Scanning mission database..." />
    ) : conversationsError ? (
      <div className="error-message">
        <strong>Mission Failed:</strong> {conversationsError}
      </div>
    ) : (() => {
      // 🔥 FILTER: Show only conversations CREATED by current user
      const myConversations = conversations.filter(conversation => {
        // Skip if no user
        if (!user?._id) return false;
        
        // Skip group conversations
        if (conversation.groupId) return false;
        
        // Show only conversations created by current user OR where user is the owner
        const isOwner = conversation.createdBy?._id === user._id || 
                       conversation.owner?._id === user._id;
        
        // If no explicit owner, check if user is the only participant
        const isSoloConversation = !conversation.createdBy && !conversation.owner &&
          (!conversation.participants || conversation.participants.length <= 1);
        
        return isOwner || isSoloConversation;
      });
      
      return myConversations.length === 0 ? (
        renderEmptyState('conversations')
      ) : (
        <ul className="conversations-items">
          {myConversations.map(conversation => (
            <li 
              key={conversation._id} 
              className="conversation-item"
              onClick={() => handleConversationClick(conversation._id)}
            >
              <div className="conversation-icon">
                <span>🤖</span>
              </div>
              <div className="conversation-details">
                <h3>{conversation.title}</h3>
                <p className="conversation-preview">
                  {conversation.lastMessage ? (
                    conversation.lastMessage.content.substring(0, 80) + 
                    (conversation.lastMessage.content.length > 80 ? '...' : '')
                  ) : 'Mission briefing pending...'}
                </p>
                <div className="conversation-meta">
                  <span className="conversation-date">
                    <span>📅</span> {formatDate(conversation.lastMessageAt || conversation.createdAt)}
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="unread-badge">
                      {conversation.unreadCount} new
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      );
    })()}
  </div>
)}
          
          {activeTab === 'groups' && (
            <div className="groups-list">
              <h2>👥 Squad Operations</h2>
              
              {loadingGroups ? (
                <Loader message="Establishing squad connections..." />
              ) : groupsError ? (
                <div className="error-message">
                  <strong>Squad Error:</strong> {groupsError}
                </div>
              ) : groups.length === 0 ? (
                renderEmptyState('groups')
              ) : (
                <ul className="groups-items">
                  {groups.map(group => (
                    <li 
                      key={group._id} 
                      className="group-item"
                      onClick={() => handleGroupClick(group._id)}
                    >
                      <div className="group-icon">
                        <span>🏢</span>
                      </div>
                      <div className="group-details">
                        <h3>{group.name}</h3>
                        <p className="group-description">
                          {group.description || 'Elite maintenance squad'}
                        </p>
                        <div className="group-meta">
                          <span className="member-count">
                            <span>👥</span> {group.members?.length || 0} operatives
                          </span>
                          <span className="group-date">
                            <span>📅</span> Est. {formatDate(group.createdAt)}
                          </span>
                          {group.unreadCount > 0 && (
                            <span className="unread-badge">
                              {group.unreadCount} alerts
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="modal-overlay" onClick={toggleNewConversationModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚀 Initialize New Mission</h3>
              <button 
                className="close-button"
                onClick={toggleNewConversationModal}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="conversationTitle">Mission Codename</label>
                <input
                  type="text"
                  id="conversationTitle"
                  value={newConversationTitle}
                  onChange={(e) => setNewConversationTitle(e.target.value)}
                  placeholder="Enter mission designation..."
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateConversation()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={toggleNewConversationModal}
              >
                Cancel Mission
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCreateConversation}
                disabled={!newConversationTitle.trim()}
              >
                <span>🚀</span> Launch Mission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={toggleSettingsModal}>
          <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚙️ Agent Settings</h3>
              <button 
                className="close-button"
                onClick={toggleSettingsModal}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {profileError && (
                <div className="error-message">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="success-message">
                  {profileSuccess}
                </div>
              )}
              
              <form onSubmit={handleUpdateProfile}>
                {/* Avatar Section */}
                <div className="form-section">
                  <h4>🖼️ Profile Avatar</h4>
                  <div className="avatar-upload-section">
                    <div className="current-avatar">
                      {avatarPreview === 'loading' ? (
                        <div className="avatar-loading">
                          <div className="spinner"></div>
                        </div>
                      ) : avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" />
                      ) : (
                        <div className="avatar-placeholder">
                          {getAvatarInitials(profileData.name || 'User')}
                        </div>
                      )}
                    </div>
                    <div className="avatar-controls">
                      <input
                        type="file"
                        id="avatarUpload"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => document.getElementById('avatarUpload').click()}
                      >
                        📸 Upload Photo
                      </button>
                      {avatarPreview && (
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={handleRemoveAvatar}
                        >
                          🗑️ Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="form-section">
                  <h4>👤 Profile Information</h4>
                  <div className="form-group">
                    <label htmlFor="profileName">Full Name</label>
                    <input
                      type="text"
                      id="profileName"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="profileEmail">Email Address</label>
                    <input
                      type="email"
                      id="profileEmail"
                      name="email"
                      value={profileData.email}
                      disabled
                      placeholder="Email cannot be changed"
                    />
                    <small className="form-text">Email address cannot be modified</small>
                  </div>
                </div>

                {/* Password Change */}
                <div className="form-section">
                  <h4>🔐 Change Password</h4>
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={profileData.currentPassword}
                      onChange={handleProfileChange}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={profileData.newPassword}
                      onChange={handleProfileChange}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={profileData.confirmPassword}
                      onChange={handleProfileChange}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={toggleSettingsModal}
                disabled={isUpdatingProfile}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleUpdateProfile}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <>⏳ Updating...</>
                ) : (
                  <>💾 Save Changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;