import React from 'react';
import './SortArrow.css';

interface SortArrowProps {
  sortDirection: 'asc' | 'desc' | undefined;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

const SortArrow: React.FC<SortArrowProps> = ({
  sortDirection,
  onClick,
  className = '',
}) => {
  return (
    <span
      className={`sort-arrow-container ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      role="button"
      tabIndex={0}
      aria-label={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
    >
      <span
        className={`sort-arrow-icon ${sortDirection || ''}`}
        aria-hidden="true"
      />
    </span>
  );
};

export default SortArrow;