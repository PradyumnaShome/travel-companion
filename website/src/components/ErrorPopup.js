import React from 'react';
import { X } from 'lucide-react';

const ErrorPopup = ({ message, onClose, isLoading }) => {
  return (
    <div className="error-popup">
      <div className={`error-content ${isLoading ? 'loading' : ''}`}>
        {!isLoading && (
          <button className="error-close" onClick={onClose}>
            <X size={20} />
          </button>
        )}
        <div className="error-message">{message}</div>
      </div>
    </div>
  );
};

export default ErrorPopup; 