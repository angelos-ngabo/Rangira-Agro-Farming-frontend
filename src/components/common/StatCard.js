import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './StatCard.css';

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend, // e.g. { value: '12%', isPositive: true }
  color = 'var(--primary-green)',
  onClick,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="stat-card loading">
        <div className="stat-card-skeleton-icon"></div>
        <div className="stat-card-skeleton-content">
          <div className="stat-card-skeleton-title"></div>
          <div className="stat-card-skeleton-value"></div>
        </div>
      </div>
    );
  }

  const CardWrapper = onClick ? 'button' : 'div';

  return (
    <CardWrapper
      className={`stat-card ${onClick ? 'interactive' : ''}`}
      onClick={onClick}
      style={{ '--accent-color': color }}
    >
      <div className="stat-card-icon-wrapper" style={{ backgroundColor: `${color}10`, color: color }}>
        {Icon && <Icon size={24} />}
      </div>
      <div className="stat-card-content">
        <span className="stat-card-title">{title}</span>
        <h3 className="stat-card-value">{value}</h3>
        {trend && (
          <div className={`stat-card-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
            {trend.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="trend-text">{trend.value}</span>
            {trend.label && <span className="trend-label">{trend.label}</span>}
          </div>
        )}
      </div>
    </CardWrapper>
  );
};

export default StatCard;
