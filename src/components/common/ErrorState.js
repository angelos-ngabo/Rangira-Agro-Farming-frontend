import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import './ErrorState.css';

const ErrorState = ({
  title = 'Something went wrong',
  message = 'Failed to load dashboard data. Please check your connection and try again.',
  onRetry
}) => {
  return (
    <div className="error-state-card">
      <div className="error-icon-wrapper">
        <AlertCircle size={32} />
      </div>
      <h3 className="error-title">{title}</h3>
      <p className="error-message-text">{message}</p>
      {onRetry && (
        <button className="error-retry-button" onClick={onRetry}>
          <RotateCcw size={16} />
          <span>Retry Loading</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
