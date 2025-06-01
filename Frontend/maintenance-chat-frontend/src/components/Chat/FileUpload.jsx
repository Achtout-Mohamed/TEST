// src/components/Chat/FileUpload.jsx

import React from 'react';
import './FileUpload.css'; // You'll need to create this CSS file

const FileUpload = ({ onFileChange, isUploading }) => {
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0 && !isUploading) {
      onFileChange(e.target.files);
      e.target.value = ''; // Reset input after selection
    }
  };

  return (
    <div className="file-upload">
      <label className={`upload-button ${isUploading ? 'disabled' : ''}`}>
        <input
          type="file"
          onChange={handleFileInput}
          disabled={isUploading}
          multiple
          style={{ display: 'none' }}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        {isUploading ? (
          <span className="uploading-icon">⏳</span>
        ) : (
          <span className="attachment-icon">📎</span>
        )}
      </label>
    </div>
  );
};

export default FileUpload;