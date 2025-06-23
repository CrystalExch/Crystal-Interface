import React from 'react';

import CopyButton from '../../CopyButton/CopyButton';
import CancelButton from '../CancelButton/CancelButton';
import SegmentedProgressBar from '../SegmentedProgressBar/SegmentedProgressBar.tsx';
import editicon from '../../../assets/edit.png';
import { useSharedContext } from '../../../contexts/SharedContext';
import customRound from '../../../utils/customRound';
import { fetchLatestPrice } from '../../../utils/getPrice';
import {
  formatBalance,
  formatSubscript,
} from '../../../utils/numberDisplayFormat.ts';
import { formatDateAndTime, formatDisplay, getPriceGap } from '../utils';

import './OrderItem.css';

interface OrderItemProps {
  order: any;
  trades: any;
  router: any;
  refetch: any;
  sendUserOperationAsync: any;
  setChain: any;
  quotePrice: any;
  waitForTxReceipt: any;
  onMarketSelect: any;
  setpopup: (value: number) => void;
  onLimitPriceUpdate?: (price: number) => void;
  openEditOrderPopup: (order:any) => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ order, trades, router, refetch, sendUserOperationAsync, setChain, quotePrice, waitForTxReceipt, onMarketSelect, openEditOrderPopup }) => {
  const { favorites, toggleFavorite } = useSharedContext();

  const marketKey = order[4];
  const market = markets[marketKey];
  const priceFactor = Number(market.priceFactor);
  const baseDecimals = Number(market.baseDecimals);
  const quoteDecimals = Number(market.quoteDecimals);
  const scaleFactor = Number(market.scaleFactor);
  const amount = order[2] / 10 ** baseDecimals;
  const amountFilled = order[7] / 10 ** baseDecimals;
  const percentFilled = (amountFilled / amount) * 100;
  const usdValue = (order[8] * quotePrice / (scaleFactor * 10 ** quoteDecimals)).toFixed(2);
  const isBuyOrder = order[3] === 1;

  const currentPrice = fetchLatestPrice(trades, market) || 0;
  const limitPrice = order[0] / priceFactor;
  const { formattedGap, gapColor } = getPriceGap(
    limitPrice,
    currentPrice,
    priceFactor,
  );

  const tokenAddress =
    market?.baseAddress?.toLowerCase() ||
    '0x0000000000000000000000000000000000000000';
  const isFavorite = favorites.includes(tokenAddress);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(tokenAddress);
  };

  return (
    <div className="orders-oc-item">
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
      <div className="oc-cell market-cell" >
        <img className="ordercenter-token-icon" src={market.image} onClick={() => onMarketSelect(market)} />
        <div className="market-details" onClick={() => onMarketSelect(market)}>
          <div className="market-name">
            {market.baseAsset}-{market.quoteAsset}
          </div>
          <div className={`order-type ${isBuyOrder ? 'buy' : 'sell'}`}>
            <span className="order-type-capitalized">
              {isBuyOrder ? t('buy') : t('sell')}
            </span>
            <CopyButton textToCopy={market.baseAddress} />
          </div>
        </div>
      </div>
      <div className="oc-cell value-cell">
        <div className="order-value">
          {formatBalance(usdValue, 'usd')}
          <div className="edit-limit-price-button" 
            onClick={() => {
              openEditOrderPopup(order);
            }}>
              <img src={editicon} className="edit-icon"/>
          </div>
        </div>
        <div className="amount">
          {formatDisplay(customRound(amount, 3))}
          <span className="oc-market-ticker"> {market.baseAsset}</span>
        </div>
      </div>
      <div className="oc-cell limit-price">
        <div className="open-order-price-level">
          {formatSubscript(limitPrice.toFixed(Math.floor(Math.log10(priceFactor))))}
          <div className="edit-limit-price-button" 
            onClick={() => {
              openEditOrderPopup(order);
            }}>
              <img src={editicon} className="edit-icon"/>
          </div>
        </div>
        <div className="price-gap" style={{ color: gapColor }}>
          {formattedGap}
        </div>
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
      <span className="oc-cell oc-time">{formatDateAndTime(order[6])}</span>
      <span className="oc-cell cancel-cell">
        <CancelButton order={order} router={router} refetch={refetch} sendUserOperationAsync={sendUserOperationAsync} setChain={setChain} waitForTxReceipt={waitForTxReceipt} />
      </span>
    </div>
  );
}

export default React.memo(OrderItem);
