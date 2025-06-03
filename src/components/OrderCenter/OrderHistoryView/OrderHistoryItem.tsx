import React from 'react';

import CopyButton from '../../CopyButton/CopyButton';
import ViewButton from '../ExplorerViewButton/ExplorerViewButton';
import SegmentedProgressBar from '../SegmentedProgressBar/SegmentedProgressBar.tsx';

import { useSharedContext } from '../../../contexts/SharedContext';
import customRound from '../../../utils/customRound';
import {
  formatBalance,
  formatSubscript,
} from '../../../utils/numberDisplayFormat.ts';
import { formatDateAndTime, formatDisplay } from '../utils';

import './OrderHistoryItem.css';

interface OrderHistoryItemProps {
  order: any;
  market: any;
  quotePrice: any;
  onMarketSelect: any;
}

const OrderHistoryItem: React.FC<OrderHistoryItemProps> = ({
  order,
  market,
  quotePrice,
  onMarketSelect,
}) => {
  const { favorites, toggleFavorite } = useSharedContext();

  const priceFactor = Number(market.priceFactor);
  const baseDecimals = Number(market.baseDecimals);

  const amount = order[2] / 10 ** baseDecimals;
  const amountFilled = order[7] / 10 ** baseDecimals;
  const percentFilled = (amountFilled / amount) * 100;

  const tokenAddress =
    market?.baseAddress?.toLowerCase() ||
    '0x0000000000000000000000000000000000000000';
  const isFavorite = favorites.includes(tokenAddress);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(tokenAddress);
  };

  return (
    <div className="order-history-oc-item">
      <div className="order-favorite-cell">
        <div
          className={`order-favorite-icon ${isFavorite ? 'order-favorite-active' : ''}`}
          onClick={handleFavoriteClick}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>
      </div>
      <div className="oc-cell market-cell">
        <img className="ordercenter-token-icon" src={market.image} onClick={() => onMarketSelect(market)}/>
        <div className="market-details" onClick={() => onMarketSelect(market)}>
          <div className="market-name">
            {market.baseAsset}-{market.quoteAsset}
          </div>
          <div className={`order-type ${order[3] === 1 ? 'buy' : 'sell'}`}>
            <span className="order-type-capitalized">
              {order[3] === 1 ? t('buy') : t('sell')}
            </span>
            <CopyButton textToCopy={market.address} />
          </div>
        </div>
      </div>
      <div className="oc-cell value-cell">
        <span className="order-value">
          {formatBalance(amount * quotePrice * (order[0] / priceFactor), 'usd')}
        </span>
        <div className="amount">
          {formatDisplay(customRound(amount, 3))}
          <span className="oc-market-ticker"> {market.baseAsset}</span>
        </div>
      </div>
      <div className="oc-cell price">
        {formatSubscript(
          (order[0] / priceFactor).toFixed(Math.floor(Math.log10(priceFactor))),
        )}
      </div>
      <div className="oc-cell amount-filled-cell">
        <div className="amount-filled-container">
          <span className="amount-filled-text">
            {formatDisplay(customRound(amountFilled, 3))} (
            {customRound(percentFilled, 2)}%)
          </span>
          <SegmentedProgressBar percentFilled={percentFilled} />
        </div>
      </div>
      <span className="oc-cell status">
        {order[9] === 0
          ? t('canceled')
          : order[9] === 1
            ? t('filled')
            : t('active')}
      </span>
      <span className="oc-cell oc-time">{formatDateAndTime(order[6])}</span>
      <span className="oc-cell oc-view-cell">
        <ViewButton txHash={order[5]} explorer={explorer} />
      </span>
    </div>
  );
};

export default React.memo(OrderHistoryItem);
