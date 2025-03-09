import React, { useRef } from 'react';
import TradeItem from './TradeItem/TradeItem';
import TradeHeader from './TradesHeader/TradeHeader';

import './TradesView.css';

interface TradesViewProps {
  trades: any[];
  show: boolean;
}

const TradesView: React.FC<TradesViewProps> = ({ trades, show }) => {
  const listRef = useRef<HTMLDivElement>(null);
  

  return (
    <>
      <TradeHeader show={show} />
      <div className={`trades-container ${!show ? 'hidden' : ''}`}>
        <div className="trades-list" ref={listRef}>
          {trades.map((trade, index) => (
            <TradeItem key={index} trade={trade} />
          ))}
        </div>
      </div>
    </>
  );
};

export default TradesView;