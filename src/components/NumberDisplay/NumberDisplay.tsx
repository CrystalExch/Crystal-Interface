import React from 'react';
import type { FormattedNumber } from '../../utils/numberDisplayFormat';
import './NumberDisplay.css';

interface NumberDisplayProps {
  formatted: FormattedNumber;
  className?: string;
}

export const NumberDisplay: React.FC<NumberDisplayProps> = ({ formatted, className = '' }) => {
  const { type, isNegative, prefix } = formatted;

  if (type === 'simple') {
    return (
      <span className={className}>
        {isNegative && '-'}
        {prefix}
        {formatted.text}
      </span>
    );
  }

  return (
    <span className={`number-with-subscript ${className}`}>
      {isNegative && '-'}
      {prefix}
      {formatted.beforeSubscript}
      <span className="subscript-container">
        <span className="subscript-number">{formatted.subscriptValue}</span>
      </span>
      {formatted.afterSubscript}
    </span>
  );
};

export default NumberDisplay;