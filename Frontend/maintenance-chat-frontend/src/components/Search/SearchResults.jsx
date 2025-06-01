// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { formatDate } from '../../utils/dateFormatters';
// import Loader from '../Common/Loader';

// const SearchResults = ({ results, loading, error, query, onClose }) => {
//   const navigate = useNavigate();
  
//   // Handle result click
//   const handleResultClick = (result) => {
//     if (result.type === 'conversation') {
//       navigate(`/conversations/${result.id}`);
//     } else if (result.type === 'group') {
//       navigate(`/groups/${result.id}`);
//     }
    
//     onClose();
//   };
  
//   // Highlight matching text in result
//   const highlightMatch = (text, query) => {
//     if (!query.trim()) return text;
    
//     const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
//     const parts = text.split(regex);
    
//     return parts.map((part, i) => 
//       regex.test(part) ? <mark key={i}>{part}</mark> : part
//     );
//   };
  
//   if (loading) {
//     return (
//       <div className="search-results-container">
//         <div className="search-results-header">
//           <h3>Searching...</h3>
//           <button className="close-button" onClick={onClose} aria-label="Close">×</button>
//         </div>
//         <div className="search-loading">
//           <Loader message="Searching conversations..." />
//         </div>
//       </div>
//     );
//   }
  
//   if (error) {
//     return (
//       <div className="search-results-container">
//         <div className="search-results-header">
//           <h3>Search Error</h3>
//           <button className="close-button" onClick={onClose} aria-label="Close">×</button>
//         </div>
//         <div className="search-error">
//           <p>{error}</p>
//         </div>
//       </div>
//     );
//   }
  
//   return (
//     <div className="search-results-container">
//       <div className="search-results-header">
//         <h3>
//           {results.length > 0 
//             ? `Found ${results.length} results` 
//             : 'No results found'}
//         </h3>
//         <button className="close-button" onClick={onClose} aria-label="Close">×</button>
//       </div>
      
//       {results.length > 0 ? (
//         <ul className="search-results-list">
//           {results.map(result => (
//             <li 
//               key={`${result.type}-${result.id}`}
//               className="search-result-item"
//               onClick={() => handleResultClick(result)}
//             >
//               <div className="result-icon">
//                 <i className={`icon-${result.type === 'conversation' ? 'chat' : 'group'}`} />
//               </div>
              
//               <div className="result-content">
//                 <h4 className="result-title">
//                   {highlightMatch(result.title, query)}
//                 </h4>
                
//                 {result.snippet && (
//                   <p className="result-snippet">
//                     {highlightMatch(result.snippet, query)}
//                   </p>
//                 )}
                
//                 <div className="result-meta">
//                   {result.type === 'conversation' && result.participants && (
//                     <span className="result-participants">
//                       <i className="icon-user" /> {result.participants.join(', ')}
//                     </span>
//                   )}
                  
//                   {result.type === 'group' && (
//                     <span className="result-member-count">
//                       <i className="icon-users" /> {result.memberCount} members
//                     </span>
//                   )}
                  
//                   <span className="result-date">
//                     <i className="icon-calendar" /> {formatDate(result.date)}
//                   </span>
                  
//                   {result.tags && result.tags.length > 0 && (
//                     <div className="result-tags">
//                       {result.tags.map(tag => (
//                         <span key={tag} className="tag">
//                           {tag}
//                         </span>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </li>
//           ))}
//         </ul>
//       ) : query.trim().length >= 2 ? (
//         <div className="no-results">
//           <p>No results found for "{query}"</p>
//           <p>Try different keywords or filters</p>
//         </div>
//       ) : null}
//     </div>
//   );
// };

// export default SearchResults;

// src/components/Search/SearchResults.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Loader from '../Common/Loader';

const SearchResults = ({ results, isLoading, onClose }) => {
  if (isLoading) {
    return <Loader message="Searching..." />;
  }
  
  if (!results || (results.conversations.length === 0 && results.messages.length === 0)) {
    return (
      <div className="search-no-results">
        <p>No results found. Try a different search term.</p>
      </div>
    );
  }
  
  return (
    <div className="search-results">
      {results.conversations.length > 0 && (
        <div className="search-section">
          <h3>Conversations</h3>
          <ul className="search-list">
            {results.conversations.map(conv => (
              <li key={conv._id} className="search-item">
                <Link to={`/conversations/${conv._id}`} onClick={onClose}>
                  {conv.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {results.messages.length > 0 && (
        <div className="search-section">
          <h3>Messages</h3>
          <ul className="search-list">
            {results.messages.map(msg => (
              <li key={msg._id} className="search-item">
                <Link to={`/conversations/${msg.conversationId}`} onClick={onClose}>
                  <div className="search-message-content">{msg.content}</div>
                  <div className="search-message-meta">in {msg.conversationTitle}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchResults;