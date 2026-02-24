import React from 'react';
import { formatCommas } from '../../../../utils/numberDisplayFormat';
import './PriceDisplay.css';

interface PriceDisplayProps {
  price: string;
  activeMarket: string;
  isLoading?: boolean; 
  priceColor?: string;
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

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  isLoading,
  priceColor = '',
}) => {
  const normalizedPrice = String(price ?? '').replace(/,/g, '');
  const decimalPlaces = (normalizedPrice.split('.')[1] || '').length;
  const formattedPrice = normalizedPrice.trim() !== '' && Number.isFinite(Number(normalizedPrice))
    ? formatCommas(Number(normalizedPrice).toFixed(decimalPlaces))
    : price;

  if (isLoading) {
    return (
      <div className="perps-skeleton-text" style={{ width: '80px', height: '20px' }}></div>
    );
  }

  return (
    <span
      className={`token-price perps-interface-metric-value perps-price-large ${priceColor}`}
    >
      {formattedPrice}
    </span>
  );
};

export default PriceDisplay;
