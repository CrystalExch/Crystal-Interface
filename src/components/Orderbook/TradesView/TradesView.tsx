import React, { useRef, useMemo } from 'react';
import TradeItem from './TradeItem/TradeItem';
import TradeHeader from './TradesHeader/TradeHeader';

import './TradesView.css';

interface TradesViewProps {
  trades: any[];
  show: boolean;
  symbolQuote: string;
}

const TradesView: React.FC<TradesViewProps> = ({ trades, show, symbolQuote }) => {
  const listRef = useRef<HTMLDivElement>(null);
  
  const isTradesLoading = !trades || !Array.isArray(trades) || trades.length === 0;
    const loadingTrades = useMemo(() => (
    <div className="trades-loading-list">
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={`loading-trade-${i}`} className="trade-loading-item">
          <div className="trade-loading-content">
            <div className="trade-loading-price ob-loading-skeleton" />
            <div className="trade-loading-size ob-loading-skeleton" />
            <div className="trade-loading-time ob-loading-skeleton" />
          </div>
        </div>
      ))}
    </div>
  ), []);
  
  return (
    <>
      <TradeHeader show={show} symbolQuote={symbolQuote} />
      <div className={`trades-container ${!show ? 'hidden' : ''}`}>
        <div className="trades-list" ref={listRef}>
          {isTradesLoading ? (
            loadingTrades
          ) : (
            trades.map((trade, index) => (
              <TradeItem key={index} trade={trade} />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default TradesView;