import React, { useEffect, useState, useRef } from 'react';

import './PriceDisplay.css';

interface PriceDisplayProps {
  price: string;
  activeMarket: string;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ price, activeMarket }) => {
  const [isLoading, setIsLoading] = useState(price === 'n/a');
  const prevPriceRef = useRef(price);
  const prevMarketRef = useRef(activeMarket);
  
  useEffect(() => {
    if (price === undefined) {
      setIsLoading(true);
      return;
    }
    
    if (activeMarket !== prevMarketRef.current) {
      setIsLoading(true);
      prevMarketRef.current = activeMarket;
      return;
    }
    
    if (isLoading && price !== prevPriceRef.current) {
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    }
    
    prevPriceRef.current = price;
  }, [price, activeMarket, isLoading]);

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