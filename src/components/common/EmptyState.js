import React from 'react';
import { Package } from 'lucide-react';
import './common.css';

/**
 * A reusable empty state component for when lists or tables have no data.
 * @param {string} title - The main heading for the empty state.
 * @param {string} description - The subtext explaining why it's empty.
 * @param {React.ReactNode} icon - Optional Lucide icon to override the default package icon.
 */
const EmptyState = ({ title = 'No Data Found', description = 'There are no records to display.', icon }) => {
  return (
    <div className="empty-state-container">
      <div className="empty-state-icon">
        {icon || <Package size={48} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
    </div>
  );
};

export default EmptyState;
