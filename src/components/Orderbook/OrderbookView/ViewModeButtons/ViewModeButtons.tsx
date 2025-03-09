import React from 'react';

import OrderbookBuyIcon from '../../../../assets/buy_filter.png';
import BuySellIcon from '../../../../assets/buy_sell.png';
import OrderbookSellIcon from '../../../../assets/sell_filter.png';

import './ViewModeButtons.css';

interface ViewModeButtonsProps {
  viewMode: 'both' | 'buy' | 'sell';
  setViewMode: (mode: 'both' | 'buy' | 'sell') => void;
}

const buttonStyle: React.CSSProperties = {
  backgroundSize: '13px 13px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  color: 'white',
  border: 'none',
  width: '20px',
  height: '20px',
  padding: '0 10px',
  margin: '0 2.5px',
  cursor: 'pointer',
  fontSize: '12px',
  transition: 'opacity 0.3s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const ViewModeButtons: React.FC<ViewModeButtonsProps> = ({
  viewMode,
  setViewMode,
}) => {
  return (
    <div className="ob-view-buttons">
      <div
        onClick={() => setViewMode('both')}
        style={{
          ...buttonStyle,
          backgroundImage: `url(${BuySellIcon})`,
          opacity: viewMode === 'both' ? 1 : 0.4,
        }}
      />
      <div
        onClick={() => setViewMode('sell')}
        style={{
          ...buttonStyle,
          backgroundImage: `url(${OrderbookSellIcon})`,
          opacity: viewMode === 'sell' ? 1 : 0.4,
        }}
      />
      <div
        onClick={() => setViewMode('buy')}
        style={{
          ...buttonStyle,
          backgroundImage: `url(${OrderbookBuyIcon})`,
          opacity: viewMode === 'buy' ? 1 : 0.4,
        }}
      />
    </div>
  );
};

export default ViewModeButtons;
