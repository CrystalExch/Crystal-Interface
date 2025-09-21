import React from 'react';
import CopyButton from '../../CopyButton/CopyButton';
import { formatBalance } from '../../../utils/numberDisplayFormat';
import { formatDisplay, formatSig } from '../utils';
import './PerpsPositionItem.css';

interface PerpsPositionItemProps {
  position: any;
  onMarketSelect: any;
  isBlurred?: boolean;
}

const PerpsPositionItem: React.FC<PerpsPositionItemProps> = ({
  position,
  onMarketSelect,
  isBlurred
}) => {
  const pnlValue = position.pnl || 0;
  const pnlPercentage = position.entryPrice ? ((position.markPrice - position.entryPrice) / position.entryPrice * 100) : 0;
  const isProfit = pnlValue >= 0;

  return (
    <div className="perps-position-item">
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

      {/* Coin */}
      <div className="oc-cell market-cell" onClick={() => onMarketSelect(position)}>
        <img className="ordercenter-token-icon" src={position.image} />
        <div className="market-details">
          <div className="market-name">
            {position.symbol}
          </div>
          <div className={`order-type ${position.direction === 'long' ? 'buy' : 'sell'}`}>
            <span className="order-type-capitalized">
              {position.direction === 'long' ? 'LONG' : 'SHORT'}
            </span>
            {position.leverage && <span className="leverage-badge">{position.leverage}x</span>}
          </div>
        </div>
      </div>

      {/* Size */}
      <div className={`oc-cell ${isBlurred ? 'blurred' : ''}`}>
        <span className="position-size">
          {formatDisplay(position.size)}
        </span>
      </div>

      {/* Position Value */}
      <div className={`oc-cell value-cell ${isBlurred ? 'blurred' : ''}`}>
        <span className="order-value">
          {formatBalance(position.positionValue, 'usd')}
        </span>
        <div className="amount">
          {formatDisplay(position.size * position.markPrice, 2)} USD
        </div>
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
          <span className="pnl-percentage">
            ({isProfit ? '+' : ''}{pnlPercentage.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Liquidation Price */}
      <div className="oc-cell">
        <span className={`liq-price ${position.liqPrice < position.markPrice ? 'safe' : 'danger'}`}>
          {position.liqPrice ? formatSig(position.liqPrice) : '-'}
        </span>
      </div>

      {/* Margin */}
      <div className={`oc-cell ${isBlurred ? 'blurred' : ''}`}>
        <span className="margin-value">
          {formatBalance(position.margin, 'usd')}
        </span>
      </div>

      {/* Funding */}
      <div className={`oc-cell ${isBlurred ? 'blurred' : ''}`}>
        <span className={`funding-value ${position.funding >= 0 ? 'positive' : 'negative'}`}>
          {position.funding >= 0 ? '+' : ''}{position.funding.toFixed(4)}%
        </span>
      </div>

      {/* Actions */}
      <div className="oc-cell actions">
        <button 
          className="position-action-btn close-btn"
          onClick={(e) => {
            e.stopPropagation();
            // Handle close position
          }}
        >
          Close
        </button>
        <button 
          className="position-action-btn edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            // Handle edit position
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default React.memo(PerpsPositionItem);