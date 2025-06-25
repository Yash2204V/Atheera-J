import React from 'react';

function AlertMessage({ type, message, onClose }) {
  if (!message) return null;
  
  const bgColor = type === 'success' 
    ? 'bg-green-100 border-green-400 text-green-700' 
    : 'bg-red-100 border-red-400 text-red-700';
  
  const icon = type === 'success' 
    ? 'fas fa-check-circle' 
    : 'fas fa-exclamation-circle';

  return (
    <div className={`${bgColor} px-4 py-3 rounded relative mb-4 border`} role="alert">
      <div className="flex items-center">
        <i className={`${icon} mr-2`}></i>
        <span className="block sm:inline">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-0 right-0 mt-3 mr-4 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
    </div>
  );
}

export default AlertMessage; 