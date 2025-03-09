import React from 'react';

import './MetricItem.css';

interface MetricItemProps {
  label: string;
  value: React.ReactNode;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value }) => {
  const isLoading = value == undefined;

  return (
    <div className="metric-item">
      <span className="metric-label">{label}</span>
      {isLoading ? (
        <div className="metric-skeleton" />
      ) : (
        <span className="metric-value">{value}</span>
      )}
    </div>
  );
};

export default MetricItem;
