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
      {sortDirection && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`sort-arrow-icon ${sortDirection}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      )}
    </span>
  );
};

export default SortArrow;