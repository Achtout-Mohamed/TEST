import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroup } from '../../hooks/useGroups';
import ChatWindow from '../Chat/ChatWindow';
import MemberList from './MemberList';
import GroupSettings from './GroupSettings';
import Loader from '../Common/Loader';

const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { 
    group, 
    members, 
    loading, 
    error, 
    joinGroup,
    leaveGroup,
    updateGroup,
    addMember,
    removeMember,
    updateMemberRole
  } = useGroup(groupId);
  
  const [showMemberList, setShowMemberList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Handle join group
  const handleJoinGroup = async () => {
    const success = await joinGroup();
    if (!success) {
      // Show error toast or notification
    }
  };
  
  // Handle leave group
  const handleLeaveGroup = async () => {
    const success = await leaveGroup();
    if (success) {
      navigate('/groups');
    }
  };
  
  // Toggle member list visibility
  const toggleMemberList = () => {
    setShowMemberList(!showMemberList);
    if (showMemberList) {
      setShowSettings(false);
    }
  };
  
  // Toggle settings visibility
  const toggleSettings = () => {
    setShowSettings(!showSettings);
    if (showSettings) {
      setShowMemberList(false);
    }
  };
  
  // Check if current user is admin
  const isCurrentUserAdmin = () => {
    const currentUser = localStorage.getItem('userId');
    const userMember = members?.find(member => member.user.id === currentUser);
    return userMember?.role === 'admin';
  };
  
  if (loading) {
    return <Loader message="Loading group..." />;
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h3>Error loading group</h3>
        <p>{error}</p>
        <button onClick={() => navigate('/groups')}>
          Back to Groups
        </button>
      </div>
    );
  }
  
  if (!group) {
    return (
      <div className="not-found-container">
        <h3>Group not found</h3>
        <p>The group you're looking for doesn't exist or you don't have access to it.</p>
        <button onClick={() => navigate('/groups')}>
          Back to Groups
        </button>
      </div>
    );
  }
  
  // Check if user is a member
  const currentUser = localStorage.getItem('userId');
  const isMember = members?.some(member => member.user.id === currentUser);
  
  if (!isMember) {
    return (
      <div className="join-group-container">
        <h3>{group.name}</h3>
        <p>{group.description}</p>
        <div className="member-count">
          <i className="icon-users" /> {members?.length || 0} members
        </div>
        <button 
          className="join-group-button"
          onClick={handleJoinGroup}
        >
          Join Group
        </button>
        <button 
          className="back-button"
          onClick={() => navigate('/groups')}
        >
          Back to Groups
        </button>
      </div>
    );
  }
  
  return (
    <div className="group-chat-container">
      <div className="group-header">
        <div className="group-info">
          <h2>{group.name}</h2>
          <div className="group-actions">
            <button
              className={`member-list-button ${showMemberList ? 'active' : ''}`}
              onClick={toggleMemberList}
              aria-label="Show members"
            >
              <i className="icon-users" /> {members?.length || 0}
            </button>
            {isCurrentUserAdmin() && (
              <button
                className={`settings-button ${showSettings ? 'active' : ''}`}
                onClick={toggleSettings}
                aria-label="Group settings"
              >
                <i className="icon-settings" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="group-content">
        <div className={`chat-area ${showMemberList || showSettings ? 'with-sidebar' : ''}`}>
          {group.conversationId && (
            <ChatWindow
              conversationId={group.conversationId}
              isGroup={true}
            />
          )}
        </div>
        
        {showMemberList && (
          <div className="member-sidebar">
            <MemberList
              members={members}
              isAdmin={isCurrentUserAdmin()}
              onAddMember={addMember}
              onRemoveMember={removeMember}
              onUpdateRole={updateMemberRole}
              onClose={() => setShowMemberList(false)}
            />
          </div>
        )}
        
        {showSettings && isCurrentUserAdmin() && (
          <div className="settings-sidebar">
            <GroupSettings
              group={group}
              onUpdateGroup={updateGroup}
              onLeaveGroup={handleLeaveGroup}
              onClose={() => setShowSettings(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChat;