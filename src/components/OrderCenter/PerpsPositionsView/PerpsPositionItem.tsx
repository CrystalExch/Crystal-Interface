import React from 'react';
import CancelButton from '../PerpsCancelButton/PerpsCancelButton';
import { formatBalance } from '../../../utils/numberDisplayFormat';
import { formatDisplay, formatSig } from '../utils';
import './PerpsPositionItem.css';

interface PerpsPositionItemProps {
  position: any;
  onMarketSelect: any;
  isBlurred?: boolean;
  handleClose: any;
}

const PerpsPositionItem: React.FC<PerpsPositionItemProps> = ({
  position,
  onMarketSelect,
  isBlurred,
  handleClose
}) => {
  const pnlValue = position.pnl || 0;
  const pnlPercentage = position.direction === 'long' ? (position.entryPrice ? ((position.markPrice - position.entryPrice) * position.leverage / position.entryPrice * 100) : 0) : position.entryPrice ? ((position.entryPrice - position.markPrice) * position.leverage / position.entryPrice * 100) : 0;
  const isProfit = pnlValue >= 0;

  return (
    <div className="perps-position-item">
      <div className="oc-cell market-cell" onClick={() => onMarketSelect(position.symbol)}>
      <div className="order-favorite-cell">
        <div
          className="order-favorite-icon"
          role="button"
          style={{ cursor: 'pointer' }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
      </div>
        <img className="ordercenter-token-icon" src={position.image} />
        <div className="market-details">
          <div className="market-name">
            {position.symbol}
          </div>
          <div className={`order-type ${position.direction === 'long' ? 'buy' : 'sell'}`}>
            <span className="order-type-capitalized">
              {position.direction === 'long' ? 'LONG' : 'SHORT'}
            </span>
            {position.leverage && <span className={`leverage-badge ${position.direction}`}>{position.leverage}x</span>}
          </div>
        </div>
      </div>

      <div className={`oc-cell ${isBlurred ? 'blurred' : ''}`}>
        <span className="position-size">
          {formatDisplay(position.size)}
        </span>
      </div>

      <div className={`oc-cell value-cell ${isBlurred ? 'blurred' : ''}`}>
        <span className="order-value">
          {formatBalance(position.positionValue, 'usd')}
        </span>
      </div>

      <div className="oc-cell">
        <span className="price-value">
          {formatSig(position.entryPrice)}
        </span>
      </div>

      {/* Mark Price */}
      <div className="oc-cell">
        <span className="price-value">
          {formatSig(position.markPrice)}
        </span>
      </div>

      {/* PNL */}
      <div className={`oc-cell pnl-cell ${isBlurred ? 'blurred' : ''}`}>
        <div className={`pnl-container ${isProfit ? 'profit' : 'loss'}`}>
          <span className="pnl-value">
            {isProfit ? '+' : ''}{formatBalance(pnlValue, 'usd')}
          </span>
          <span className="perps-pnl-percentage">
            ({isProfit ? '+' : ''}{pnlPercentage.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Liquidation Price */}
      <div className="oc-cell">
        <span className={`liq-price`}>
          {position.liqPrice ? formatSig(position.liqPrice) : '-'}
        </span>
      </div>

      {/* Margin */}
      <div className={`oc-cell ${isBlurred ? 'blurred' : ''}`}>
        <span className="margin-value">
          {formatBalance(position.margin, 'usd')}
        </span>
      </div>

      <div className={`oc-cell ${isBlurred ? 'blurred' : ''}`}>
        <span className={`funding-value ${position.funding >= 0 ? 'positive' : 'negative'}`}>
          {position.funding >= 0 ? '' : '-'}${Math.abs(position.funding).toFixed(2)}
        </span>
      </div>
      <div className="oc-cell tpsl-actions">
        <button 
          className="position-action-btn tpsl-btn"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          Add
        </button>
      </div>
      <div className="oc-cell perps-actions">
        <CancelButton callback={() => handleClose(position.symbol, position.size, position.direction)} />
      </div>
    </div>
  );
};

export default React.memo(PerpsPositionItem);