import React, { useEffect, useState, useRef } from 'react';
import './PriceDisplay.css';

interface PriceDisplayProps {
  price: string;
  activeMarket: string;
  isLoading?: boolean; 
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  price, 
  activeMarket,
  isLoading: externalLoading = false 
}) => {
  const [internalLoading, setInternalLoading] = useState(price === 'n/a');
  const prevPriceRef = useRef(price);
  const prevMarketRef = useRef(activeMarket);
  
  const isLoading = externalLoading || internalLoading;
  
  useEffect(() => {
    if (price === undefined) {
      setInternalLoading(true);
      return;
    }
    
    if (activeMarket !== prevMarketRef.current) {
      setInternalLoading(true);
      prevMarketRef.current = activeMarket;
      return;
    }
    
    if (internalLoading && price !== prevPriceRef.current) {
      setTimeout(() => {
        setInternalLoading(false);
      }, 100);
    }
    
    prevPriceRef.current = price;
  }, [price, activeMarket, internalLoading]);

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