import React from 'react';
import './PriceDisplay.css';

interface PriceDisplayProps {
  price: string;
  activeMarket: string;
  isLoading?: boolean; 
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  price, 
  isLoading,
}) => {

  if (isLoading) {
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