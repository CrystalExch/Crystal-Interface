import React from 'react';
import CopyButton from '../../CopyButton/CopyButton';
import ViewButton from '../ExplorerViewButton/ExplorerViewButton';
import { formatBalance } from '../../../utils/numberDisplayFormat';
import { formatDisplay, formatSig, formatDateAndTime } from '../utils';
import { settings } from '../../../settings.ts';
import { useSharedContext } from '../../../contexts/SharedContext';
import './PerpsOrderHistoryItem.css';

interface PerpsOrderHistoryItemProps {
  order: any;
  onMarketSelect: any;
  isBlurred?: boolean;
}

const PerpsOrderHistoryItem: React.FC<PerpsOrderHistoryItemProps> = ({
  order,
  onMarketSelect,
  isBlurred
}) => {
  const { activechain } = useSharedContext();
  const isLong = order.direction === 'long' || order.side === 1;
  const fillPercentage = order.originalSize && order.filledSize ? 
    (order.filledSize / order.originalSize * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'filled':
      case 'completed':
        return 'success';
      case 'cancelled':
      case 'canceled':
        return 'cancelled';
      case 'expired':
        return 'expired';
      case 'rejected':
        return 'rejected';
      case 'partial':
      case 'partially filled':
        return 'partial';
      default:
        return 'default';
    }
  };

  return (
    <div className="perps-order-history-item">
      <div className="oc-cell oc-time">
        {formatDateAndTime(order.time)}
      </div>

      <div className="oc-cell order-type-cell">
        <span className="order-type-badge">
          {order.type || 'LIMIT'}
        </span>
      </div>

      <div className="oc-cell market-cell" onClick={() => onMarketSelect(order)}>
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
        <div className="filled-size-container">
          <span className="filled-size-value">
            {formatDisplay(order.filledSize || 0)}
          </span>
          {fillPercentage > 0 && fillPercentage < 100 && (
            <span className="fill-percentage">
              ({fillPercentage.toFixed(0)}%)
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

      <div className="oc-cell trigger-cell">
        {order.triggerCondition ? (
          <div className="trigger-info">
            <span className="trigger-type">{order.triggerType || 'STOP'}</span>
            <span className="trigger-price">{formatSig(order.triggerPrice)}</span>
          </div>
        ) : (
          <span className="no-trigger">-</span>
        )}
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

      <div className="oc-cell">
        <span className={`status-badge ${getStatusColor(order.status)}`}>
          {order.status || 'Unknown'}
        </span>
      </div>

      {order.txHash && (
        <div className="oc-cell oc-view-cell">
          <ViewButton
            txHash={order.txHash}
            explorer={settings.chainConfig[activechain].explorer}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(PerpsOrderHistoryItem);