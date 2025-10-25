import React from 'react';
import './PriceDisplay.css';

interface PriceDisplayProps {
  price: string;
  activeMarket: string;
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

const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  price, 
  isLoading,
}) => {
  const shouldShowLoading = isLoading === true || valueCheck(price);

  if (shouldShowLoading) {
    return (
      <div className="price-container">
        <div className="price-label">{t('price')}</div>
        <div className="price-row">
          <div className="price-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="price-container">
      <div className="price-label">{t('price')}</div>
      <div className="price-row">
        <span className="token-price">{price}</span>
      </div>
    </div>
  );
};

export default PriceDisplay;