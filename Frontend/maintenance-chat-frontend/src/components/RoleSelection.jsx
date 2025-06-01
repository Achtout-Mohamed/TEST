// Frontend/maintenance-chat-frontend/src/components/RoleSelection.jsx

import React, { useState } from 'react';
import './RoleSelection.css';

const RoleSelection = ({ onRoleSelect, userInfo, loading = false }) => {
  const [selectedRole, setSelectedRole] = useState('technician');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = [
    {
      value: 'technician',
      label: 'Maintenance Technician',
      description: 'Perform maintenance tasks and report issues',
      icon: '🔧'
    },
    {
      value: 'team_lead',
      label: 'Team Lead',
      description: 'Lead maintenance teams and coordinate work',
      icon: '👥'
    },
    {
      value: 'engineer',
      label: 'Engineer',
      description: 'Design and oversee maintenance procedures',
      icon: '⚙️'
    },
    {
      value: 'knowledge_manager',
      label: 'Knowledge Manager',
      description: 'Manage documentation and knowledge base',
      icon: '📚'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onRoleSelect(selectedRole);
    } catch (error) {
      console.error('Error selecting role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="role-selection-loading">
        <div className="loading-spinner"></div>
        <p>Setting up your account...</p>
      </div>
    );
  }

  return (
    <div className="role-selection-container">
      <div className="role-selection-card">
        <div className="role-selection-header">
          <div className="user-info">
            {userInfo?.avatar && (
              <img 
                src={userInfo.avatar} 
                alt="Profile" 
                className="user-avatar"
              />
            )}
            <div>
              <h2>Welcome, {userInfo?.name}!</h2>
              <p className="user-email">{userInfo?.email}</p>
            </div>
          </div>
          <h3>Choose Your Role</h3>
          <p>Select your role in the maintenance team to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="role-selection-form">
          <div className="roles-grid">
            {roles.map((role) => (
              <label
                key={role.value}
                className={`role-option ${selectedRole === role.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={selectedRole === role.value}
                  onChange={(e) => setSelectedRole(e.target.value)}
                />
                <div className="role-content">
                  <div className="role-icon">{role.icon}</div>
                  <div className="role-details">
                    <h4>{role.label}</h4>
                    <p>{role.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Setting up your account...' : 'Continue to Dashboard'}
          </button>
        </form>

        <div className="role-selection-footer">
          <p>You can change your role later in your profile settings.</p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;