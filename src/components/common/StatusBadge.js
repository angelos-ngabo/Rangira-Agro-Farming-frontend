import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;

  const normalized = status.toUpperCase().trim();

  // Determine badge type based on status string
  const getBadgeType = (statusText) => {
    switch (statusText) {
      case 'PAID':
      case 'DELIVERED':
      case 'ACTIVE':
      case 'APPROVED':
      case 'VALIDATED':
      case 'SUCCESS':
      case 'COMPLETED':
        return 'success';

      case 'PENDING':
      case 'SHIPPED':
      case 'PROCESSING':
      case 'SUBMITTED':
      case 'WARNING':
        return 'warning';

      case 'FAILED':
      case 'REJECTED':
      case 'INACTIVE':
      case 'CANCELLED':
      case 'ERROR':
        return 'error';

      default:
        return 'secondary';
    }
  };

  const badgeType = getBadgeType(normalized);

  // Beautify status text (replace underscore with space, title case)
  const displayName = status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <span className={`status-badge status-badge-${badgeType} ${className}`}>
      <span className="status-badge-dot" />
      {displayName}
    </span>
  );
};

export default StatusBadge;
