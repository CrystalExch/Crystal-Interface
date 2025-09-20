import React from 'react';
import CopyButton from '../../CopyButton/CopyButton';
import ViewButton from '../ExplorerViewButton/ExplorerViewButton';
import { formatBalance } from '../../../utils/numberDisplayFormat';
import { formatDisplay, formatSig, formatDateAndTime } from '../utils';
import { settings } from '../../../settings.ts';
import { useSharedContext } from '../../../contexts/SharedContext';
import './PerpsTradeHistoryItem.css';

interface PerpsTradeHistoryItemProps {
  trade: any;
  onMarketSelect: any;
  isBlurred?: boolean;
}

const PerpsTradeHistoryItem: React.FC<PerpsTradeHistoryItemProps> = ({
  trade,
  onMarketSelect,
  isBlurred
}) => {
  const { activechain } = useSharedContext();
  const isLong = trade.direction === 'long' || trade.side === 1;
  const isProfit = trade.closedPnl >= 0;

  return (
    <div className="perps-trade-history-item">
      <div className="oc-cell oc-time">
        {formatDateAndTime(trade.time)}
      </div>

      <div className="oc-cell market-cell" onClick={() => onMarketSelect(trade)}>
        <img className="ordercenter-token-icon" src={trade.image} />
        <div className="market-details">
          <div className="market-name">
            {trade.symbol}
          </div>
          <div className="trade-info">
            <span className="trade-type">{trade.type || 'Market'}</span>
            <CopyButton textToCopy={trade.address} />
          </div>
        </div>
      </div>

      <div className="oc-cell">
        <span className={`direction-badge ${isLong ? 'long' : 'short'}`}>
          {isLong ? 'LONG' : 'SHORT'}
        </span>
      </div>

      <div className="oc-cell">
        <span className="price-value">
          {formatSig(trade.price)}
        </span>
      </div>

      <div className={`oc-cell ${isBlurred ? 'blurred' : ''}`}>
        <span className="size-value">
          {formatDisplay(trade.size)}
        </span>
      </div>

      <div className={`oc-cell value-cell ${isBlurred ? 'blurred' : ''}`}>
        <span className="trade-value">
          {formatBalance(trade.tradeValue || (trade.size * trade.price), 'usd')}
        </span>
      </div>

      <div className={`oc-cell ${isBlurred ? 'blurred' : ''}`}>
        <span className="fee-value">
          {formatBalance(trade.fee, 'usd')}
        </span>
      </div>

      <div className={`oc-cell closed-pnl-cell ${isBlurred ? 'blurred' : ''}`}>
        {trade.closedPnl !== undefined && trade.closedPnl !== null ? (
          <div className={`pnl-container ${isProfit ? 'profit' : 'loss'}`}>
            <span className="pnl-value">
              {isProfit ? '+' : ''}{formatBalance(trade.closedPnl, 'usd')}
            </span>
            {trade.closedPnlPercentage !== undefined && (
              <span className="pnl-percentage">
                ({isProfit ? '+' : ''}{trade.closedPnlPercentage.toFixed(2)}%)
              </span>
            )}
          </div>
        ) : (
          <span className="no-pnl">-</span>
        )}
      </div>

      {trade.txHash && (
        <div className="oc-cell oc-view-cell">
          <ViewButton
            txHash={trade.txHash}
            explorer={settings.chainConfig[activechain].explorer}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(PerpsTradeHistoryItem);