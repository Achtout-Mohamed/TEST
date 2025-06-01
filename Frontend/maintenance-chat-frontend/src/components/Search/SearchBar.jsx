// import React, { useState, useRef, useEffect } from 'react';
// import { useSearch } from '../../hooks/useSearch';
// import SearchResults from './SearchResults';
// import FilterControls from './FilterControls';
// import { useClickOutside } from '../../hooks/useClickOutside';
// import Loader from '../Common/Loader';

// const SearchBar = () => {
//   const [query, setQuery] = useState('');
//   const [showResults, setShowResults] = useState(false);
//   const [showFilters, setShowFilters] = useState(false);
//   const [filters, setFilters] = useState({
//     dateFrom: '',
//     dateTo: '',
//     users: [],
//     groups: [],
//     tags: [],
//     onlyMyConversations: false
//   });
  
//   const { 
//     results, 
//     loading, 
//     error, 
//     search,
//     clearResults 
//   } = useSearch();
  
//   const searchContainerRef = useRef(null);
//   useClickOutside(searchContainerRef, () => setShowResults(false));
  
//   // Handle search input changes
//   const handleInputChange = (e) => {
//     setQuery(e.target.value);
//   };
  
//   // Handle search submission
//   const handleSearch = async (e) => {
//     if (e) e.preventDefault();
    
//     if (query.trim().length < 2) return;
    
//     await search(query, filters);
//     setShowResults(true);
//   };
  
//   // Handle filter changes
//   const handleFilterChange = (newFilters) => {
//     setFilters({ ...filters, ...newFilters });
//   };
  
//   // Toggle filters visibility
//   const toggleFilters = () => {
//     setShowFilters(!showFilters);
//   };
  
//   // Clear search
//   const handleClearSearch = () => {
//     setQuery('');
//     clearResults();
//     setShowResults(false);
//   };
  
//   // Auto-search when query has minimum length
//   useEffect(() => {
//     const delayDebounceFn = setTimeout(() => {
//       if (query.trim().length >= 2) {
//         handleSearch();
//       } else if (query.trim().length === 0) {
//         clearResults();
//       }
//     }, 500);
    
//     return () => clearTimeout(delayDebounceFn);
//   }, [query, filters]);
  
//   return (
//     <div className="search-container" ref={searchContainerRef}>
//       <form className="search-form" onSubmit={handleSearch}>
//         <div className="search-input-group">
//           <button
//             type="button"
//             className="filter-button"
//             onClick={toggleFilters}
//             aria-label="Filter search"
//           >
//             <i className="icon-filter" />
//           </button>
          
//           <input
//             type="text"
//             className="search-input"
//             placeholder="Search conversations..."
//             value={query}
//             onChange={handleInputChange}
//             onFocus={() => query.trim().length >= 2 && setShowResults(true)}
//           />
          
//           {query && (
//             <button
//               type="button"
//               className="clear-button"
//               onClick={handleClearSearch}
//               aria-label="Clear search"
//             >
//               <i className="icon-clear" />
//             </button>
//           )}
          
//           <button
//             type="submit"
//             className="search-button"
//             disabled={query.trim().length < 2 || loading}
//             aria-label="Search"
//           >
//             {loading ? <Loader size="small" /> : <i className="icon-search" />}
//           </button>
//         </div>
//       </form>
      
//       {showFilters && (
//         <FilterControls
//           filters={filters}
//           onChange={handleFilterChange}
//           onClose={() => setShowFilters(false)}
//         />
//       )}
      
//       {showResults && (
//         <SearchResults
//           results={results}
//           loading={loading}
//           error={error}
//           query={query}
//           onClose={() => setShowResults(false)}
//         />
//       )}
//     </div>
//   );
// };

// export default SearchBar;

// src/components/Search/SearchBar.jsx
import React, { useState } from 'react';
import useClickOutside from '../../hooks/useClickOutside';
import Loader from '../Common/Loader';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setIsSearching(true);
      // Simulate search
      setTimeout(() => {
        setIsSearching(false);
        setShowResults(true);
      }, 500);
    }
  };
  
  const searchRef = useClickOutside(() => {
    setShowResults(false);
  });
  
  return (
    <div className="search-container" ref={searchRef}>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search conversations..."
          className="search-input"
        />
        <button type="submit" className="search-button">
          <i className="icon-search"></i>
        </button>
      </form>
      
      {isSearching && (
        <div className="search-loading">
          <Loader message="Searching..." />
        </div>
      )}
    </div>
  );
};

export default SearchBar;