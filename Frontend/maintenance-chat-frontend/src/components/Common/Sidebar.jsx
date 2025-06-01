
// // 1. Enhanced Sidebar.jsx with proper data validation
// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { useChat } from "../../hooks/useChat";
// import { useAuth } from '../../hooks/useAuth';
// import "./Sidebar.css";

// const Sidebar = () => {
//   const {
//     conversations,
//     loading,
//     fetchConversations,
//     createConversation,
//     setCurrentConversation,
//     searchConversations,
//     clearSearchResults,
//     searchResults,
//   } = useChat();
//   const { token } = useAuth();
//   const navigate = useNavigate();
//   const { conversationId } = useParams();
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showNewConversationForm, setShowNewConversationForm] = useState(false);
//   const [newConversationTitle, setNewConversationTitle] = useState("");
//   const [isSearchMode, setIsSearchMode] = useState(false);
//   const [isCreatingAI, setIsCreatingAI] = useState(false);

//   // Utility function to validate MongoDB ObjectID
//   const isValidObjectId = (id) => {
//     return /^[0-9a-fA-F]{24}$/.test(id);
//   };

//   const createAIChat = async () => {
//     if (isCreatingAI) return;
    
//     setIsCreatingAI(true);
//     try {
//       const authToken = token || localStorage.getItem('token');
      
//       if (!authToken) {
//         throw new Error('Authentication required. Please log in again.');
//       }

//       const response = await fetch('/api/conversations/ai', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${authToken}`
//         },
//         body: JSON.stringify({
//           title: 'AI Analysis Chat'
//         })
//       });
      
//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(errorData.message || `Server error: ${response.status}`);
//       }
      
//       const result = await response.json();
      
//       if (!result.success || !result.data || !result.data._id) {
//         throw new Error('Invalid response from server');
//       }

//       // Validate the returned ID
//       if (!isValidObjectId(result.data._id)) {
//         throw new Error('Invalid conversation ID received from server');
//       }
      
//       // Refresh conversations and navigate
//       await fetchConversations();
//       navigate(`/conversations/${result.data._id}`);
      
//     } catch (error) {
//       console.error('AI Chat Creation Error:', error);
      
//       // User-friendly error messages
//       const userMessage = error.message.includes('Authentication') 
//         ? 'Please log in again to create AI conversations.'
//         : error.message.includes('Server error')
//         ? 'Server is temporarily unavailable. Please try again.'
//         : 'Failed to create AI conversation. Please try again.';
        
//       alert(userMessage);
//     } finally {
//       setIsCreatingAI(false);
//     }
//   };

//   useEffect(() => {
//     fetchConversations();
//   }, [fetchConversations]);

//   // Enhanced conversation click handler with validation
//   const handleConversationClick = (conversation) => {
//     // Validate conversation object
//     if (!conversation || !conversation._id) {
//       console.error('Invalid conversation object:', conversation);
//       return;
//     }

//     // Validate ObjectID format
//     if (!isValidObjectId(conversation._id)) {
//       console.error('Invalid conversation ID format:', conversation._id);
//       return;
//     }

//     setCurrentConversation(conversation);
//     navigate(`/conversations/${conversation._id}`);
//   };

//   const handleSearchChange = (e) => {
//     const value = e.target.value;
//     setSearchTerm(value);

//     if (value.trim()) {
//       setIsSearchMode(true);
//       searchConversations(value);
//     } else {
//       setIsSearchMode(false);
//       clearSearchResults();
//     }
//   };

//   const handleCreateConversation = async (e) => {
//     e.preventDefault();

//     if (!newConversationTitle.trim()) return;

//     try {
//       const newConversation = await createConversation({
//         title: newConversationTitle.trim()
//       });

//       // Validate returned conversation
//       if (!newConversation || !newConversation._id || !isValidObjectId(newConversation._id)) {
//         throw new Error('Invalid conversation created');
//       }

//       setNewConversationTitle("");
//       setShowNewConversationForm(false);
//       navigate(`/conversations/${newConversation._id}`);
//     } catch (error) {
//       console.error("Create conversation error:", error);
//       alert("Failed to create conversation. Please try again.");
//     }
//   };

//   const displayedConversations = isSearchMode ? searchResults : conversations;

//   const formatDate = (dateString) => {
//     try {
//       return new Date(dateString).toLocaleDateString();
//     } catch (error) {
//       return 'Invalid Date';
//     }
//   };

//   // Enhanced conversation rendering with better error handling
//   const renderConversationItem = (conversation) => {
//     // Skip invalid conversations
//     if (!conversation || !conversation._id || !isValidObjectId(conversation._id)) {
//       console.warn('Skipping invalid conversation:', conversation);
//       return null;
//     }

//     const isAIConversation = conversation.aiEnabled || 
//       conversation.participants?.some(p => p && p.email === 'ai@system.local');
    
//     return (
//       <div
//         key={conversation._id}
//         className={`conversation-item ${
//           conversationId === conversation._id ? "active" : ""
//         } ${isAIConversation ? "ai-conversation" : ""}`}
//         onClick={() => handleConversationClick(conversation)}
//       >
//         <div className="conversation-title">
//           {isAIConversation && <span className="ai-indicator">🤖 </span>}
//           {conversation.title || 'Untitled Conversation'}
//         </div>
//         <div className="conversation-info">
//           <span className="conversation-date">
//             {formatDate(conversation.updatedAt || conversation.createdAt)}
//           </span>
//           {conversation.isGroup && (
//             <span className="group-badge">Group</span>
//           )}
//           {isAIConversation && (
//             <span className="ai-badge">AI</span>
//           )}
//           {conversation.tags && conversation.tags.length > 0 && (
//             <div className="conversation-tags">
//               {conversation.tags.slice(0, 2).map((tag, index) => (
//                 <span key={index} className="tag">
//                   {tag}
//                 </span>
//               ))}
//               {conversation.tags.length > 2 && (
//                 <span className="tag">
//                   +{conversation.tags.length - 2}
//                 </span>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="sidebar">
//       <div className="sidebar-header">
//         <div className="header-top">
//           <button className="back-btn" onClick={() => navigate("/dashboard")}>
//             Dashboard
//           </button>
//           <h2>Conversations</h2>
//         </div>
        
//         <div className="conversation-buttons">
//           <button 
//             className="new-conversation-btn"
//             onClick={() => setShowNewConversationForm(!showNewConversationForm)}
//           >
//             {showNewConversationForm ? "Cancel" : "New"}
//           </button>
//           <button 
//             className="ai-chat-btn" 
//             onClick={createAIChat}
//             disabled={isCreatingAI}
//             style={{ opacity: isCreatingAI ? 0.6 : 1 }}
//           >
//             {isCreatingAI ? "Creating..." : "🤖 AI Chat"}
//           </button>
//         </div>
//       </div>

//       {showNewConversationForm && (
//         <form className="new-conversation-form" onSubmit={handleCreateConversation}>
//           <input
//             type="text"
//             placeholder="Conversation title"
//             value={newConversationTitle}
//             onChange={(e) => setNewConversationTitle(e.target.value)}
//             required
//           />
//           <button type="submit">Create</button>
//         </form>
//       )}

//       <div className="search-container">
//         <input
//           type="text"
//           placeholder="Search conversations..."
//           value={searchTerm}
//           onChange={handleSearchChange}
//           className="search-input"
//         />
//       </div>

//       <div className="conversations-list">
//         {loading ? (
//           <div className="loading">Loading conversations...</div>
//         ) : displayedConversations.length === 0 ? (
//           <div className="no-conversations">
//             {isSearchMode
//               ? "No conversations match your search."
//               : "No conversations yet. Create one to get started!"}
//           </div>
//         ) : (
//           displayedConversations
//             .filter(conv => conv && conv._id && isValidObjectId(conv._id))
//             .map(renderConversationItem)
//         )}
//       </div>
//     </div>
//   );
// };

// export default Sidebar;

// src/components/Common/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useChat } from "../../hooks/useChat";
import { useAuth } from '../../hooks/useAuth';
import "./Sidebar.css";

const Sidebar = () => {
  const {
    conversations,
    loading,
    fetchConversations,
    createConversation,
    setCurrentConversation,
    searchConversations,
    clearSearchResults,
    searchResults,
  } = useChat();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewConversationForm, setShowNewConversationForm] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isCreatingAI, setIsCreatingAI] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // Utility function to validate MongoDB ObjectID
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarHidden(!sidebarHidden);
  };

  const createAIChat = async () => {
    if (isCreatingAI) return;
    
    setIsCreatingAI(true);
    try {
      const authToken = token || localStorage.getItem('token');
      
      if (!authToken) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch('/api/conversations/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: 'AI Analysis Chat'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.data || !result.data._id) {
        throw new Error('Invalid response from server');
      }

      if (!isValidObjectId(result.data._id)) {
        throw new Error('Invalid conversation ID received from server');
      }
      
      await fetchConversations();
      navigate(`/conversations/${result.data._id}`);
      
    } catch (error) {
      console.error('AI Chat Creation Error:', error);
      
      const userMessage = error.message.includes('Authentication') 
        ? 'Please log in again to create AI conversations.'
        : error.message.includes('Server error')
        ? 'Server is temporarily unavailable. Please try again.'
        : 'Failed to create AI conversation. Please try again.';
        
      alert(userMessage);
    } finally {
      setIsCreatingAI(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleConversationClick = (conversation) => {
    if (!conversation || !conversation._id) {
      console.error('Invalid conversation object:', conversation);
      return;
    }

    if (!isValidObjectId(conversation._id)) {
      console.error('Invalid conversation ID format:', conversation._id);
      return;
    }

    setCurrentConversation(conversation);
    navigate(`/conversations/${conversation._id}`);
    
    // Hide sidebar on mobile after selection
    if (window.innerWidth <= 1024) {
      setSidebarHidden(true);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim()) {
      setIsSearchMode(true);
      searchConversations(value);
    } else {
      setIsSearchMode(false);
      clearSearchResults();
    }
  };

  const handleCreateConversation = async (e) => {
    e.preventDefault();

    if (!newConversationTitle.trim()) return;

    try {
      const newConversation = await createConversation({
        title: newConversationTitle.trim()
      });

      if (!newConversation || !newConversation._id || !isValidObjectId(newConversation._id)) {
        throw new Error('Invalid conversation created');
      }

      setNewConversationTitle("");
      setShowNewConversationForm(false);
      navigate(`/conversations/${newConversation._id}`);
      
      // Hide sidebar on mobile after creation
      if (window.innerWidth <= 1024) {
        setSidebarHidden(true);
      }
    } catch (error) {
      console.error("Create conversation error:", error);
      alert("Failed to create conversation. Please try again.");
    }
  };

  const displayedConversations = isSearchMode ? searchResults : conversations;

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const renderConversationItem = (conversation) => {
    if (!conversation || !conversation._id || !isValidObjectId(conversation._id)) {
      console.warn('Skipping invalid conversation:', conversation);
      return null;
    }

    const isAIConversation = conversation.aiEnabled || 
      conversation.participants?.some(p => p && p.email === 'ai@system.local');
    
    return (
      <div
        key={conversation._id}
        className={`conversation-item ${
          conversationId === conversation._id ? "active" : ""
        } ${isAIConversation ? "ai-conversation" : ""}`}
        onClick={() => handleConversationClick(conversation)}
      >
        <div className="conversation-title">
          {isAIConversation && <span className="ai-indicator">🤖</span>}
          {conversation.title || 'Untitled Conversation'}
        </div>
        <div className="conversation-info">
          <span className="conversation-date">
            {formatDate(conversation.updatedAt || conversation.createdAt)}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {conversation.isGroup && (
              <span className="group-badge">Group</span>
            )}
            {isAIConversation && (
              <span className="ai-badge">AI</span>
            )}
            {conversation.tags && conversation.tags.length > 0 && (
              <div className="conversation-tags">
                {conversation.tags.slice(0, 1).map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
                {conversation.tags.length > 1 && (
                  <span className="tag">
                    +{conversation.tags.length - 1}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button 
        className="sidebar-toggle" 
        onClick={toggleSidebar}
        title={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
      >
        {sidebarHidden ? '☰' : '×'}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarHidden ? 'hidden' : ''}`}>
        <div className="sidebar-header">
          <div className="header-top">
            <button className="back-btn" onClick={() => navigate("/dashboard")}>
              ← Dashboard
            </button>
            <h2>Conversations</h2>
          </div>
          
          <div className="conversation-buttons">
            <button 
              className="new-conversation-btn"
              onClick={() => setShowNewConversationForm(!showNewConversationForm)}
            >
              {showNewConversationForm ? "Cancel" : "New"}
            </button>
            <button 
              className="ai-chat-btn" 
              onClick={createAIChat}
              disabled={isCreatingAI}
            >
              {isCreatingAI ? "Creating..." : "🤖 AI Chat"}
            </button>
          </div>
        </div>

        {showNewConversationForm && (
          <form className="new-conversation-form" onSubmit={handleCreateConversation}>
            <input
              type="text"
              placeholder="Conversation title"
              value={newConversationTitle}
              onChange={(e) => setNewConversationTitle(e.target.value)}
              required
            />
            <button type="submit">Create Conversation</button>
          </form>
        )}

        <div className="search-container">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>

        <div className="conversations-list">
          {loading ? (
            <div className="loading">Loading conversations...</div>
          ) : displayedConversations.length === 0 ? (
            <div className="no-conversations">
              {isSearchMode
                ? "No conversations match your search."
                : "No conversations yet. Create one to get started!"}
            </div>
          ) : (
            displayedConversations
              .filter(conv => conv && conv._id && isValidObjectId(conv._id))
              .map(renderConversationItem)
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;