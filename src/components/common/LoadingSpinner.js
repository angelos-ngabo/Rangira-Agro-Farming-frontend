import React from 'react';
import './common.css';

/**
 * A reusable loading spinner component to maintain consistent UI during async operations.
 * @param {string} message - Optional text to display below the spinner.
 */
const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-spinner-container">
      <div className="spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
