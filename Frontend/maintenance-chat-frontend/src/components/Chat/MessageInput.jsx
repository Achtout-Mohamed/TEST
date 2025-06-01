// // src/components/Chat/MessageInput.jsx
// import React, { useState, useRef, useEffect } from 'react';
// import { useMessages } from '../../hooks/useMessages';
// import { useSocket } from '../../hooks/useSocket';
// import uploadService from '../../services/uploadService';
// // import FileUpload from './FileUpload';
// import './MessageInput.css';

// const MessageInput = ({ conversationId }) => {
//   const [message, setMessage] = useState('');
//   const [attachments, setAttachments] = useState([]);
//   const [isUploading, setIsUploading] = useState(false);
//   const [typingTimeout, setTypingTimeout] = useState(null);
//   const [isTyping, setIsTyping] = useState(false);
//   const [showAIHint, setShowAIHint] = useState(false);
//   const inputRef = useRef(null);
//   const fileInputRef = useRef(null);
  
//   const { sendMessage, loading } = useMessages();
//   const { sendTyping, connected } = useSocket();
  
//   // Focus input on mount
//   useEffect(() => {
//     if (inputRef.current) {
//       inputRef.current.focus();
//     }
//   }, []);

//   // Show AI hint for AI conversations
//   useEffect(() => {
//     const isAIConversation = window.location.pathname.includes('ai') || 
//                             document.querySelector('.ai-enabled');
    
//     if (isAIConversation && !message && attachments.length === 0) {
//       const timer = setTimeout(() => setShowAIHint(true), 2000);
//       return () => clearTimeout(timer);
//     } else {
//       setShowAIHint(false);
//     }
//   }, [message, attachments]);
  
//   // Handle typing indicator
//   const handleTyping = () => {
//     if (!isTyping) {
//       setIsTyping(true);
//       sendTyping(true);
//     }
    
//     if (typingTimeout) {
//       clearTimeout(typingTimeout);
//     }
    
//     const timeout = setTimeout(() => {
//       setIsTyping(false);
//       sendTyping(false);
//     }, 2000);
    
//     setTypingTimeout(timeout);
//   };
  
//   // Clean up typing timeout on unmount
//   useEffect(() => {
//     return () => {
//       if (typingTimeout) {
//         clearTimeout(typingTimeout);
//       }
//       if (isTyping) {
//         sendTyping(false);
//       }
//     };
//   }, [typingTimeout, isTyping, sendTyping]);
  
//   // Handle input change
//   const handleInputChange = (e) => {
//     setMessage(e.target.value);
//     handleTyping();
    
//     // Auto-resize textarea
//     if (inputRef.current) {
//       inputRef.current.style.height = 'auto';
//       inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
//     }
//   };
  
//   // Handle file upload button click
//   const handleFileUploadClick = () => {
//     fileInputRef.current?.click();
//   };
  
//   // Handle file upload
//   const handleFileChange = async (files) => {
//     if (!files || files.length === 0) return;
    
//     setIsUploading(true);
    
//     try {
//       const uploadedFiles = await Promise.all(
//         Array.from(files).map(async (file) => {
//           try {
//             const response = await uploadService.uploadFile(file);
//             return response.data;
//           } catch (error) {
//             console.error(`Error uploading file ${file.name}:`, error);
//             return null;
//           }
//         })
//       );
      
//       const successfulUploads = uploadedFiles.filter(file => file !== null);
      
//       if (successfulUploads.length > 0) {
//         setAttachments(prev => [...prev, ...successfulUploads]);
//       }
      
//     } catch (error) {
//       console.error('Error uploading files:', error);
//     } finally {
//       setIsUploading(false);
//     }
//   };
  
//   // Remove attachment
//   const removeAttachment = async (index) => {
//     const attachment = attachments[index];
    
//     try {
//       await uploadService.deleteAttachment(attachment._id);
//       setAttachments(prev => prev.filter((_, i) => i !== index));
//     } catch (error) {
//       console.error('Error removing attachment:', error);
//       setAttachments(prev => prev.filter((_, i) => i !== index));
//     }
//   };
  
//   // Handle message submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     const trimmedMessage = message.trim();
//     if (!trimmedMessage && attachments.length === 0) return;
    
//     try {
//       const messageData = {
//         content: trimmedMessage || "📎 Quantum data transmission",
//         conversationId,
//         attachments: attachments.map(att => att._id)
//       };
      
//       await sendMessage(messageData);
      
//       // Reset form
//       setMessage('');
//       setAttachments([]);
//       setIsTyping(false);
//       sendTyping(false);
      
//       // Reset textarea height
//       if (inputRef.current) {
//         inputRef.current.style.height = 'auto';
//         inputRef.current.focus();
//       }
//     } catch (error) {
//       console.error('Error sending message:', error);
//     }
//   };

//   // Handle keyboard shortcuts
//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSubmit(e);
//     }
//   };
  
//   // Format file size
//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   // Get file icon based on type
//   const getFileIcon = (fileType) => {
//     if (fileType?.startsWith('image/')) return '🖼️';
//     if (fileType?.startsWith('video/')) return '🎥';
//     if (fileType?.startsWith('audio/')) return '🎵';
//     if (fileType?.includes('pdf')) return '📄';
//     if (fileType?.includes('word')) return '📝';
//     if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return '📊';
//     if (fileType?.includes('zip') || fileType?.includes('archive')) return '📦';
//     return '📎';
//   };
  
//   return (
//     <div className="message-input">
//       {/* AI Enhancement Hint */}
//       {showAIHint && (
//         <div className="ai-input-enhancement">
//           🧠 Neural interface ready • Try: "Analyze this equipment data" or upload technical documents
//         </div>
//       )}

//       {/* Holographic Attachment Previews */}
//       {attachments.length > 0 && (
//         <div className="attachment-previews">
//           {attachments.map((file, index) => (
//             <div key={file._id || index} className="attachment-preview">
//               <div className="attachment-info">
//                 <div className="attachment-icon">
//                   {getFileIcon(file.type)}
//                 </div>
//                 <div className="attachment-details">
//                   <div className="attachment-name">{file.filename}</div>
//                   <div className="attachment-size">{formatFileSize(file.size)}</div>
//                 </div>
//               </div>
//               <button 
//                 type="button" 
//                 className="remove-attachment" 
//                 onClick={() => removeAttachment(index)}
//                 title="Remove quantum file"
//               >
//                 ×
//               </button>
//             </div>
//           ))}
//         </div>
//       )}
      
//       {/* Quantum Upload Progress */}
//       {isUploading && (
//         <div className="upload-progress">
//           <div className="progress-info">
//             <span>Quantum file transmission in progress...</span>
//           </div>
//         </div>
//       )}
      
//       <form onSubmit={handleSubmit} className="message-form">
//         {/* File Upload Button */}
//         <button
//           type="button"
//           className="file-upload-btn"
//           onClick={handleFileUploadClick}
//           disabled={isUploading}
//           title="Upload quantum files"
//         >
//           📎
//         </button>
        
//         {/* Hidden File Input */}
//         <input
//           ref={fileInputRef}
//           type="file"
//           multiple
//           className="file-input"
//           onChange={(e) => handleFileChange(e.target.files)}
//           accept="*/*"
//         />
        
//         {/* Futuristic Message Input */}
//         <textarea
//           ref={inputRef}
//           value={message}
//           onChange={handleInputChange}
//           onKeyDown={handleKeyDown}
//           placeholder="🚀 Transmit your message to the neural network..."
//           disabled={loading || isUploading}
//           className="message-input-field"
//           rows="1"
//         />
        
//         {/* Quantum Send Button */}
//         <button 
//           type="submit" 
//           disabled={loading || isUploading || (!message.trim() && attachments.length === 0)} 
//           className={`send-button ${loading ? 'loading' : ''}`}
//           title="Launch message into quantum space"
//         >
//           {loading ? '⏳' : '🚀'}
//         </button>
//       </form>
      
//       {/* Quantum Connection Status */}
//       <div className="connection-status-indicator">
//         {connected ? (
//           <span className="connected-status">Quantum Link Stable</span>
//         ) : (
//           <span className="disconnected-status">Neural Network Offline</span>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MessageInput;

import React, { useState, useRef, useEffect } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import uploadService from '../../services/uploadService';
import './MessageInput.css';

const MessageInput = ({ conversationId }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { user } = useAuth();
  const { sendMessage, loading, messages } = useMessages();
  const { sendTyping, connected } = useSocket();
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Handle input change
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  };
  
  // Handle file upload
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (files) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const uploadedFiles = await Promise.all(
        Array.from(files).map(async (file) => {
          try {
            const response = await uploadService.uploadFile(file);
            return response.data;
          } catch (error) {
            console.error(`Error uploading file ${file.name}:`, error);
            return null;
          }
        })
      );
      
      const successfulUploads = uploadedFiles.filter(file => file !== null);
      
      if (successfulUploads.length > 0) {
        setAttachments(prev => [...prev, ...successfulUploads]);
      }
      
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Remove attachment
  const removeAttachment = async (index) => {
    const attachment = attachments[index];
    
    try {
      await uploadService.deleteAttachment(attachment._id);
      setAttachments(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error removing attachment:', error);
      setAttachments(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  // SIMPLE MESSAGE SEND - This should fix the real-time issue
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachments.length === 0) return;
    if (isSending) return; // Prevent double sending
    
    setIsSending(true);
    
    // Create a temporary message for immediate UI update
    const tempMessage = {
      _id: 'temp-' + Date.now(),
      content: trimmedMessage || "📎 File attachment",
      sender: {
        _id: user._id || user.id,
        name: user.name,
        avatar: user.avatar
      },
      createdAt: new Date().toISOString(),
      conversationId: conversationId,
      attachments: attachments,
      isTemporary: true
    };
    
    try {
      const messageData = {
        content: trimmedMessage || "📎 Quantum data transmission",
        conversationId,
        attachments: attachments.map(att => att._id)
      };
      
      console.log('Sending message:', messageData);
      
      // Send the message
      await sendMessage(messageData);
      
      // Clear form immediately
      setMessage('');
      setAttachments([]);
      
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.focus();
      }
      
      console.log('Message sent successfully');
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return '🖼️';
    if (fileType?.startsWith('video/')) return '🎥';
    if (fileType?.startsWith('audio/')) return '🎵';
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('word')) return '📝';
    if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return '📊';
    if (fileType?.includes('zip') || fileType?.includes('archive')) return '📦';
    return '📎';
  };
  
  return (
    <div className="message-input">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="attachment-previews">
          {attachments.map((file, index) => (
            <div key={file._id || index} className="attachment-preview">
              <div className="attachment-info">
                <div className="attachment-icon">
                  {getFileIcon(file.type)}
                </div>
                <div className="attachment-details">
                  <div className="attachment-name">{file.filename}</div>
                  <div className="attachment-size">{formatFileSize(file.size)}</div>
                </div>
              </div>
              <button 
                type="button" 
                className="remove-attachment" 
                onClick={() => removeAttachment(index)}
                title="Remove file"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload progress */}
      {isUploading && (
        <div className="upload-progress">
          <div className="progress-info">
            <span>Uploading files...</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="message-form">
        {/* File Upload Button */}
        <button
          type="button"
          className="file-upload-btn"
          onClick={handleFileUploadClick}
          disabled={isUploading || isSending}
          title="Upload files"
        >
          📎
        </button>
        
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="file-input"
          onChange={(e) => handleFileChange(e.target.files)}
          accept="*/*"
        />
        
        {/* Message Input */}
        <textarea
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={loading || isUploading || isSending}
          className="message-input-field"
          rows="1"
        />
        
        {/* Send Button */}
        <button 
          type="submit" 
          disabled={loading || isUploading || isSending || (!message.trim() && attachments.length === 0)} 
          className={`send-button ${(loading || isSending) ? 'loading' : ''}`}
          title="Send message"
        >
          {(loading || isSending) ? '⏳' : '🚀'}
        </button>
      </form>
      
      {/* Connection Status */}
      <div className="connection-status-indicator">
        {connected ? (
          <span className="connected-status">Connected</span>
        ) : (
          <span className="disconnected-status">Disconnected</span>
        )}
      </div>
    </div>
  );
};

export default MessageInput;