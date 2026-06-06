import React from 'react';
import { Sprout } from 'lucide-react';
import './LoadingState.css';

const LoadingState = ({ type = 'spinner', message = 'Loading data...', cardsCount = 3 }) => {
  if (type === 'skeleton-cards') {
    return (
      <div className="skeleton-grid">
        {Array.from({ length: cardsCount }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-line title" />
            <div className="skeleton-line value" />
            <div className="skeleton-line description" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'skeleton-table') {
    return (
      <div className="skeleton-table">
        <div className="skeleton-table-header">
          <div className="skeleton-th" />
          <div className="skeleton-th" />
          <div className="skeleton-th" />
          <div className="skeleton-th" />
        </div>
        <div className="skeleton-table-body">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-tr">
              <div className="skeleton-td" />
              <div className="skeleton-td" />
              <div className="skeleton-td" />
              <div className="skeleton-td" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="loading-spinner-state">
      <div className="spinner-icon-wrapper">
        <Sprout size={36} className="spinner-leaf-icon" />
      </div>
      <p className="loading-text">{message}</p>
    </div>
  );
};

export default LoadingState;
