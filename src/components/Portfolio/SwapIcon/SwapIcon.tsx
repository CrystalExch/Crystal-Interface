import React from 'react';
import './SwapIcon.css';

interface SwapIconProps {
  tokenaddress: string;
  setpopup: (value: number) => void;
  onMarketSelect: any;
}

const SwapIcon: React.FC<SwapIconProps> = ({
  tokenaddress,
  setpopup,
  onMarketSelect,
}) => {
  
  return (
    <div
      className="swap-icon"
      onClick={() => {
        setpopup(0);
        let found = false;
        for (const market in markets) {
          if (
            markets[market].baseAddress === tokenaddress
          ) {
            found = true;
            onMarketSelect({quoteAddress: markets[market].quoteAddress, baseAddress: tokenaddress})
            break;
          }
        }
        if (!found) {
          for (const market in markets) {
            if (markets[market].quoteAddress === tokenaddress) {
              onMarketSelect({quoteAddress: tokenaddress, baseAddress: markets[market].baseAddress})
              break;
            }
          }
        }
      }}
    >
      {t('swap')}
    </div>
  );
};

export default SwapIcon;