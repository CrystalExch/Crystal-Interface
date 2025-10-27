import React from 'react';
import './MetricItem.css';

interface MetricItemProps {
  label: string;
  value: React.ReactNode;
  isLoading?: boolean;
}

function valueCheck(value: React.ReactNode): boolean {
  if (typeof value === 'string') {
    return value === 'N/A' || value === '$N/A';
  }

  if (React.isValidElement(value)) {
    const children = value.props.children;

    if (typeof children === 'string') {
      return children === 'N/A' || children === '$N/A';
    }
  }

  return false;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, isLoading }) => {
  const shouldShowLoading = isLoading === true || valueCheck(value);
  
  return (
    <div className="metric-item">
      <span className="metric-label">{label}</span>
      {shouldShowLoading ? (
        <div className={`metric-skeleton ${label == t('availableLiquidity') ? 'liquidity-skeleton' : label == t('dayChange') ? 'change-skeleton' : ''}`} />
      ) : (
        <span className="metric-value">{value}</span>
      )}
    </div>
  );
};

export default MetricItem;