import React, { useState } from 'react';
import UserSearchInput from '../Common/UserSearchInput';
import { useUsers } from '../../hooks/useUsers';
import Loader from '../Common/Loader';

const MemberList = ({ 
  members, 
  isAdmin, 
  onAddMember, 
  onRemoveMember, 
  onUpdateRole, 
  onClose 
}) => {
  const { users, loading: loadingUsers, searchUsers } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [addingMember, setAddingMember] = useState(false);
  
  // Handle user search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      await searchUsers(query);
    }
  };
  
  // Handle user selection
  const handleSelectUser = (user) => {
    // Check if user is already a member
    const isMember = members.some(member => member.user.id === user.id);
    
    if (!isMember) {
      setSelectedUser(user);
    }
    
    // Clear search
    setSearchQuery('');
  };
  
  // Handle add member
  const handleAddMember = async () => {
    if (!selectedUser) return;
    
    setAddingMember(true);
    
    try {
      await onAddMember(selectedUser.id);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to add member:', error);
    } finally {
      setAddingMember(false);
    }
  };
  
  // Handle remove member
  const handleRemoveMember = async (userId) => {
    try {
      await onRemoveMember(userId);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };
  
  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    try {
      await onUpdateRole(userId, newRole);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };
  
  return (
    <div className="member-list-container">
      <div className="member-list-header">
        <h3>Group Members</h3>
        <button 
          className="close-button" 
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      
      {isAdmin && (
        <div className="add-member-section">
          <h4>Add member</h4>
          <UserSearchInput 
            value={searchQuery}
            onChange={handleSearch}
            onSelectUser={handleSelectUser}
            users={users}
            loading={loadingUsers}
            placeholder="Search by name or email"
          />
          
          {selectedUser && (
            <div className="selected-user">
              <div className="user-info">
                <span className="user-name">{selectedUser.name}</span>
                <span className="user-email">{selectedUser.email}</span>
              </div>
              <button 
                className="add-member-button"
                onClick={handleAddMember}
                disabled={addingMember}
              >
                {addingMember ? <Loader size="small" /> : 'Add'}
              </button>
              <button 
                className="cancel-button"
                onClick={() => setSelectedUser(null)}
                disabled={addingMember}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="members-section">
        <h4>Current members ({members.length})</h4>
        <ul className="members-list">
          {members.map(member => (
            <li key={member.user.id} className="member-item">
              <div className="member-info">
                <span className="member-name">{member.user.name}</span>
                <span className="member-role">{member.role}</span>
                {member.isOnline && <span className="online-indicator" />}
              </div>
              
              {isAdmin && member.user.id !== localStorage.getItem('userId') && (
                <div className="member-actions">
                  <select 
                    className="role-selector"
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.user.id, e.target.value)}
                    disabled={!isAdmin}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  
                  <button 
                    className="remove-member-button"
                    onClick={() => handleRemoveMember(member.user.id)}
                    aria-label="Remove member"
                  >
                    <i className="icon-trash" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MemberList;