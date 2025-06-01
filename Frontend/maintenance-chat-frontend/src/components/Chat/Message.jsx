// import React from 'react';
// import MarkdownRenderer from './MarkdownRenderer';

// const Message = ({ message }) => {
//   return (
//     <div className={`message ${message.sender._id === currentUser._id ? 'sent' : 'received'}`}>
//       <div className="message-sender">{message.sender.name}</div>
//       <div className="message-content">
//         <MarkdownRenderer content={message.content} />
//       </div>
//       <div className="message-time">{new Date(message.createdAt).toLocaleTimeString()}</div>
//     </div>
//   );
// };

// export default Message;

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import MarkdownRenderer from './MarkdownRenderer';

const Message = ({ message }) => {
  const { user } = useAuth();
  
  // Safely determine if this is the current user's message
  const isOwnMessage = user && message.sender && message.sender._id === user.id;
  
  return (
    <div className={`message ${isOwnMessage ? 'sent' : 'received'}`}>
      <div className="message-sender">{message.sender?.name || 'Unknown'}</div>
      <div className="message-content">
        <MarkdownRenderer content={message.content} />
      </div>
      <div className="message-time">
        {new Date(message.createdAt).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default Message;