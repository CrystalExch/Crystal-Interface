import React from 'react';
import CopyButton from '../../CopyButton/CopyButton';
import { formatBalance } from '../../../utils/numberDisplayFormat';
import { formatDisplay, formatSig, formatDateAndTime } from '../utils';
import './PerpsOpenOrdersItem.css';

interface PerpsOpenOrdersItemProps {
  order: any;
  onMarketSelect: any;
  isBlurred?: boolean;
  handleCancel: any;
}

const PerpsOpenOrdersItem: React.FC<PerpsOpenOrdersItemProps> = ({
  order,
  onMarketSelect,
  isBlurred,
  handleCancel
}) => {
  const isLong = order.direction === 'long' || order.side === 1;
  const fillPercentage = order.originalSize ? ((order.originalSize - order.size) / order.originalSize * 100) : 0;

  return (
    <div className="perps-open-order-item">
      <div className="oc-cell oc-time">
        {formatDateAndTime(order.time)}
      </div>

      <div className="oc-cell order-type-cell">
        <span className="order-type-badge">
          {order.type || 'LIMIT'}
        </span>
      </div>

      <div className="oc-cell market-cell" onClick={() => onMarketSelect(order.symbol)}>
        <img className="ordercenter-token-icon" src={order.image} />
        <div className="market-details">
          <div className="market-name">
            {order.symbol}
          </div>
          <CopyButton textToCopy={order.address} />
        </div>
      </div>

      <div className="oc-cell">
        <span className={`direction-badge ${isLong ? 'long' : 'short'}`}>
          {isLong ? 'LONG' : 'SHORT'}
        </span>
      </div>

      <div className={`oc-cell ${isBlurred ? 'blurred' : ''}`}>
        <span className="size-value">
          {formatDisplay(order.size)}
        </span>
      </div>

      <div className={`oc-cell ${isBlurred ? 'blurred' : ''}`}>
        <div className="original-size-container">
          <span className="original-size-value">
            {formatDisplay(order.originalSize || order.size)}
          </span>
          {fillPercentage > 0 && (
            <span className="fill-percentage">
              ({fillPercentage.toFixed(0)}% filled)
            </span>
          )}
        </div>
      </div>

      <div className={`oc-cell value-cell ${isBlurred ? 'blurred' : ''}`}>
        <span className="order-value">
          {formatBalance(order.orderValue || (order.size * order.price), 'usd')}
        </span>
      </div>

      <div className="oc-cell">
        <span className="price-value">
          {formatSig(order.price)}
        </span>
      </div>

      <div className="oc-cell">
        <span className={`reduce-only-badge ${order.reduceOnly ? 'active' : 'inactive'}`}>
          {order.reduceOnly ? 'Yes' : 'No'}
        </span>
      </div>

      <div className="oc-cell tpsl-cell">
        {(order.takeProfit || order.stopLoss) ? (
          <div className="tpsl-info">
            {order.takeProfit && (
              <span className="tp-value">TP: {formatSig(order.takeProfit)}</span>
            )}
            {order.stopLoss && (
              <span className="sl-value">SL: {formatSig(order.stopLoss)}</span>
            )}
          </div>
        ) : (
          <span className="no-tpsl">-</span>
        )}
      </div>

      <div className="oc-cell actions">
        <button 
          className="order-action-btn cancel-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleCancel?.(order.id);
          }}
        >
          Cancel
        </button>
        <button 
          className="order-action-btn edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleCancel?.(order.id);
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default React.memo(PerpsOpenOrdersItem);