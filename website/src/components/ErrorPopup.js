import React from 'react';
import { X } from 'lucide-react';

const ErrorPopup = ({ message, onClose }) => {
  return (
    <div className="error-popup">
      <div className="error-content">
        <button className="error-close" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="error-message">{message}</div>
      </div>
    </div>
  );
};

export default ErrorPopup; 