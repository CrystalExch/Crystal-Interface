import React from 'react';
import './MetricItem.css';

interface MetricItemProps {
  label: string;
  value: React.ReactNode;
  isLoading?: boolean;
}

function valueCheck(value: React.ReactNode): boolean {
  if (typeof value === 'string') {
    return value === 'n/a' || value === '$n/a';
  }

  if (React.isValidElement(value)) {
    const children = value.props.children;

    if (typeof children === 'string') {
      return children === 'n/a' || children === '$n/a';
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
        <div className="metric-skeleton" />
      ) : (
        <span className="metric-value">{value}</span>
      )}
    </div>
  );
};

export default MetricItem;