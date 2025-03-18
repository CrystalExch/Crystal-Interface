import React from 'react';

import './MetricItem.css';

interface MetricItemProps {
  label: string;
  value: React.ReactNode;
  isLoading?: boolean;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, isLoading }) => {
  const shouldShowLoading = value === undefined || isLoading === true;
  
  return (
    <div className="metric-item">
      <span className="metric-label">{label}</span>
      {shouldShowLoading ? (
        <div className="metric-skeleton" />
      ) : (
        <span className="metric-value">{value}</span>
      )}
    </div>
  );
};

export default MetricItem;