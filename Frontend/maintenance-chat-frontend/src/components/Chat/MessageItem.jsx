// import React, { useState, useMemo } from 'react';
// import { useAuth } from '../../hooks/useAuth';
// import './MessageItem.css';

// const MessageItem = ({ message, isRead, onEdit, onDelete }) => {
//   const { user } = useAuth();
//   const [showOptions, setShowOptions] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editedContent, setEditedContent] = useState(message.content);
  
//   // SIMPLE CHECK: Is this message from the current user?
//   const isOwnMessage = user && message.sender && 
//     (message.sender._id === user._id || message.sender._id === user.id);
  
//   // Check if it's an AI message
//   const isAIMessage = message.sender?.email === 'ai@system.local' || 
//                      message.sender?.name?.includes('AI');
  
//   console.log('Message debug:', {
//     messageId: message._id,
//     senderId: message.sender?._id,
//     senderName: message.sender?.name,
//     userId: user?._id || user?.id,
//     userName: user?.name,
//     isOwnMessage: isOwnMessage,
//     isAIMessage: isAIMessage
//   });
  
//   // Format message timestamp
//   const formatTime = (timestamp) => {
//     const date = new Date(timestamp);
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };
  
//   // Handle edit submission
//   const handleEditSubmit = (e) => {
//     e.preventDefault();
//     if (editedContent.trim() && editedContent !== message.content) {
//       onEdit && onEdit(message._id, editedContent);
//     }
//     setIsEditing(false);
//   };
  
//   // Handle message deletion
//   const handleDelete = () => {
//     if (window.confirm('Are you sure you want to delete this message?')) {
//       onDelete && onDelete(message._id);
//     }
//   };
  
//   // Get file icon based on type
//   const getFileIcon = (fileType) => {
//     if (!fileType) return '📎';
//     if (fileType.startsWith('image/')) return '🖼️';
//     if (fileType.startsWith('video/')) return '🎥';
//     if (fileType.startsWith('audio/')) return '🎵';
//     if (fileType.includes('pdf')) return '📄';
//     if (fileType.includes('word')) return '📝';
//     if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
//     if (fileType.includes('zip') || fileType.includes('archive')) return '📦';
//     return '📎';
//   };

//   // Format file size
//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
//   };
  
//   // Render attachments
//   const renderAttachments = () => {
//     if (!message.attachments || message.attachments.length === 0) return null;
    
//     return (
//       <div className="message-attachments">
//         {message.attachments.map((attachment, index) => {
//           const isImage = attachment.type && attachment.type.startsWith('image/');
          
//           return (
//             <div key={index} className="attachment-item">
//               {isImage && attachment.url ? (
//                 <div className="image-attachment">
//                   <img 
//                     src={`http://localhost:5000${attachment.url}`}
//                     alt={attachment.filename || attachment.name || 'Image attachment'} 
//                     className="attachment-preview"
//                   />
//                   <a href={`http://localhost:5000${attachment.url}`} target="_blank" rel="noopener noreferrer" className="attachment-name">
//                     {attachment.filename || attachment.name || 'Image'}
//                   </a>
//                 </div>
//               ) : (
//                 <div className="file-attachment">
//                   <span className="file-icon">
//                     {getFileIcon(attachment.type)}
//                   </span>
//                   {attachment.url ? (
//                     <a href={`http://localhost:5000${attachment.url}`} target="_blank" rel="noopener noreferrer" className="attachment-name">
//                       {attachment.filename || attachment.name || 'File'}
//                     </a>
//                   ) : (
//                     <span className="attachment-name">{attachment.filename || attachment.name || 'File'}</span>
//                   )}
//                   {attachment.size && (
//                     <span className="attachment-size">
//                       {formatFileSize(attachment.size)}
//                     </span>
//                   )}
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     );
//   };
  
//   // Parse AI message content for source attribution
//   const parseAIContent = (content) => {
//     if (!isAIMessage) return { mainContent: content, sources: null };
    
//     // Look for sources section at the end
//     const sourcesMatch = content.match(/\n\n---\n\*Sources:([^*]+)\*/);
//     if (sourcesMatch) {
//       const mainContent = content.replace(/\n\n---\n\*Sources:[^*]+\*/, '');
//       const sources = sourcesMatch[1].trim();
//       return { mainContent, sources };
//     }
    
//     return { mainContent: content, sources: null };
//   };
  
//   const { mainContent, sources } = parseAIContent(message.content);
  
//   if (!user) {
//     return <div className="message-loading">Loading...</div>;
//   }
  
//   // SIMPLE STRUCTURE - Clear left/right alignment
//   return (
//     <div className={`message-wrapper ${isOwnMessage ? 'own' : 'other'} ${isAIMessage ? 'ai' : ''}`}>
//       <div className="message-content">
//         {/* Avatar for other users only */}
//         {!isOwnMessage && (
//           <div className="avatar">
//             {message.sender?.avatar ? (
//               <img src={message.sender.avatar} alt={message.sender.name || 'User'} />
//             ) : (
//               <div className="avatar-text">
//                 {isAIMessage ? '🤖' : 
//                  message.sender?.name ? message.sender.name.charAt(0).toUpperCase() : '?'}
//               </div>
//             )}
//           </div>
//         )}
        
//         <div className="message-body">
//           {/* Sender name for other users */}
//           {!isOwnMessage && (
//             <div className="sender-name">
//               {message.sender?.name || 'Unknown'}
//             </div>
//           )}
          
//           {/* Message bubble */}
//           <div className="bubble">
//             {isEditing ? (
//               <form onSubmit={handleEditSubmit}>
//                 <input
//                   type="text"
//                   value={editedContent}
//                   onChange={(e) => setEditedContent(e.target.value)}
//                   autoFocus
//                 />
//                 <div className="edit-buttons">
//                   <button type="submit">Save</button>
//                   <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
//                 </div>
//               </form>
//             ) : (
//               <>
//                 <div className="text">
//                   {mainContent.split('\n').map((line, index) => (
//                     <React.Fragment key={index}>
//                       {line}
//                       {index < mainContent.split('\n').length - 1 && <br />}
//                     </React.Fragment>
//                   ))}
//                 </div>
//                 {renderAttachments()}
//                 {sources && (
//                   <div className="sources">Sources: {sources}</div>
//                 )}
//               </>
//             )}
//           </div>
          
//           {/* Message time */}
//           <div className="time">{formatTime(message.createdAt)}</div>
//         </div>
        
//         {/* Edit options for own messages */}
//         {isOwnMessage && !isEditing && onEdit && onDelete && (
//           <div className="options">
//             <button onClick={() => setIsEditing(true)}>✏️</button>
//             <button onClick={handleDelete}>🗑️</button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MessageItem;

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './MessageItem.css';

const MessageItem = ({ message, isRead, onEdit, onDelete }) => {
  const { user } = useAuth();
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  
  // 🔥 FIXED: Proper user ID comparison with debugging
  console.log('🔍 MESSAGE DEBUG:', {
    messageId: message._id,
    senderId: message.sender?._id,
    senderName: message.sender?.name,
    currentUserId: user?._id,
    currentUserName: user?.name,
    userObject: user
  });
  
  // Check ALL possible user ID fields
  const currentUserId = user?._id || user?.id;
  const senderId = message.sender?._id || message.sender?.id;
  
  const isOwnMessage = currentUserId && senderId && (senderId === currentUserId);
  
  // Check if it's an AI message
  const isAIMessage = message.sender?.email === 'ai@system.local' || 
                     message.sender?.name?.includes('AI');
  
  console.log('🎯 ALIGNMENT RESULT:', {
    isOwnMessage,
    isAIMessage,
    currentUserId,
    senderId,
    alignment: isOwnMessage ? 'RIGHT' : 'LEFT'
  });
  
  // Format message timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Handle edit submission
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editedContent.trim() && editedContent !== message.content) {
      onEdit && onEdit(message._id, editedContent);
    }
    setIsEditing(false);
  };
  
  // Handle message deletion
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDelete && onDelete(message._id);
    }
  };
  
  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (!fileType) return '📎';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('zip') || fileType.includes('archive')) return '📦';
    return '📎';
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };
  
  // Render attachments
  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;
    
    return (
      <div className="message-attachments">
        {message.attachments.map((attachment, index) => {
          const isImage = attachment.type && attachment.type.startsWith('image/');
          
          return (
            <div key={index} className="attachment-item">
              {isImage && attachment.url ? (
                <div className="image-attachment">
                  <img 
                    src={`http://localhost:5000${attachment.url}`}
                    alt={attachment.filename || attachment.name || 'Image attachment'} 
                    className="attachment-preview"
                  />
                  <a href={`http://localhost:5000${attachment.url}`} target="_blank" rel="noopener noreferrer" className="attachment-name">
                    {attachment.filename || attachment.name || 'Image'}
                  </a>
                </div>
              ) : (
                <div className="file-attachment">
                  <span className="file-icon">
                    {getFileIcon(attachment.type)}
                  </span>
                  {attachment.url ? (
                    <a href={`http://localhost:5000${attachment.url}`} target="_blank" rel="noopener noreferrer" className="attachment-name">
                      {attachment.filename || attachment.name || 'File'}
                    </a>
                  ) : (
                    <span className="attachment-name">{attachment.filename || attachment.name || 'File'}</span>
                  )}
                  {attachment.size && (
                    <span className="attachment-size">
                      {formatFileSize(attachment.size)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  // Parse AI message content for source attribution
  const parseAIContent = (content) => {
    if (!isAIMessage) return { mainContent: content, sources: null };
    
    // Look for sources section at the end
    const sourcesMatch = content.match(/\n\n---\n\*Sources:([^*]+)\*/);
    if (sourcesMatch) {
      const mainContent = content.replace(/\n\n---\n\*Sources:[^*]+\*/, '');
      const sources = sourcesMatch[1].trim();
      return { mainContent, sources };
    }
    
    return { mainContent: content, sources: null };
  };
  
  const { mainContent, sources } = parseAIContent(message.content);
  
  if (!user) {
    return <div className="message-loading">Loading user...</div>;
  }
  
  // 🔥 CLEAR ALIGNMENT: Use explicit classes
  return (
    <div className={`message-wrapper ${isOwnMessage ? 'own' : 'other'} ${isAIMessage ? 'ai' : ''}`}>
      <div className="message-content">
        {/* Avatar for other users only (LEFT side) */}
        {!isOwnMessage && (
          <div className="avatar">
            {message.sender?.avatar ? (
              <img src={message.sender.avatar} alt={message.sender.name || 'User'} />
            ) : (
              <div className="avatar-text">
                {isAIMessage ? '🤖' : 
                 message.sender?.name ? message.sender.name.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
        )}
        
        <div className="message-body">
          {/* Sender name for other users only */}
          {!isOwnMessage && (
            <div className="sender-name">
              {message.sender?.name || 'Unknown'}
            </div>
          )}
          
          {/* Message bubble */}
          <div className="bubble">
            {isEditing ? (
              <form onSubmit={handleEditSubmit}>
                <input
                  type="text"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  autoFocus
                />
                <div className="edit-buttons">
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="text">
                  {mainContent.split('\n').map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < mainContent.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                {renderAttachments()}
                {sources && (
                  <div className="sources">Sources: {sources}</div>
                )}
              </>
            )}
          </div>
          
          {/* Message time */}
          <div className="time">{formatTime(message.createdAt)}</div>
        </div>
        
        {/* Edit options for own messages only (RIGHT side) */}
        {isOwnMessage && !isEditing && onEdit && onDelete && (
          <div className="options">
            <button onClick={() => setIsEditing(true)}>✏️</button>
            <button onClick={handleDelete}>🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;