// src/hooks/useGroups.js
import { useState, useEffect } from 'react';
import groupService from '../services/groupService';

const useGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await groupService.getGroups();
      if (response.success) {
        setGroups(response.data);
      } else {
        setError(response.message || 'Failed to fetch groups');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchGroups();
  }, []);
  
  return {
    groups,
    loading,
    error,
    fetchGroups
  };
};

export default useGroups;