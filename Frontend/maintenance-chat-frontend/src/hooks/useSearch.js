// import { useState, useCallback } from 'react';
// import { searchService } from '../services/searchService';

// export const useSearch = () => {
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
  
//   // Search conversations and groups
//   const search = useCallback(async (query, filters = {}) => {
//     if (query.trim().length < 2) {
//       setResults([]);
//       return;
//     }
    
//     setLoading(true);
//     setError(null);
    
//     try {
//       const searchResults = await searchService.search(query, filters);
//       setResults(searchResults.results || []);
//     } catch (err) {
//       setError(err.message || 'Search failed. Please try again.');
//       setResults([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);
  
//   // Clear search results
//   const clearResults = useCallback(() => {
//     setResults([]);
//     setError(null);
//   }, []);
  
//   return {
//     results,
//     loading,
//     error,
//     search,
//     clearResults
//   };
// };


// src/hooks/useSearch.js
import { useState } from 'react';
import searchService from '../services/searchService';

const useSearch = () => {
  const [results, setResults] = useState({ conversations: [], messages: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  
  const search = async (query) => {
    if (!query.trim()) {
      setResults({ conversations: [], messages: [] });
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await searchService.search(query);
      if (response.success) {
        setResults(response.data);
      } else {
        setError(response.message || 'Search failed');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };
  
  return {
    search,
    results,
    isSearching,
    error
  };
};

export default useSearch;