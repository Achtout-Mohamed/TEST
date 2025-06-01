// src/components/Common/Loader.jsx
import React from 'react';

const Loader = ({ message = 'Loading...' }) => {
  return (
    <div className="loader">
      <div className="loader-spinner"></div>
      <p className="loader-message">{message}</p>
    </div>
  );
};

export default Loader;