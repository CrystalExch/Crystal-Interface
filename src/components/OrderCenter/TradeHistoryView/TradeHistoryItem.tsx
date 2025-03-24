import React from 'react';

import CopyButton from '../../CopyButton/CopyButton';
import ViewButton from '../ExplorerViewButton/ExplorerViewButton';

import { settings } from '../../../settings.ts';
import { useSharedContext } from '../../../contexts/SharedContext';
import customRound from '../../../utils/customRound';
import {
  formatBalance,
  formatSubscript,
} from '../../../utils/numberDisplayFormat';
import { formatDateAndTime, formatDisplay } from '../utils';

import './TradeHistoryItem.css';

interface TradeHistoryItemProps {
  trade: any;
  market: any;
}

const TradeHistoryItem: React.FC<TradeHistoryItemProps> = ({
  trade,
  market,
}) => {
  const { activechain, favorites, toggleFavorite } = useSharedContext();

  const priceFactor = Number(market.priceFactor);
  const baseDecimals = Number(market.baseDecimals);
  const quoteDecimals = Number(market.quoteDecimals);

  const tokenAddress =
    market?.baseAddress?.toLowerCase() ||
    '0x0000000000000000000000000000000000000000';
  const isFavorite = favorites.includes(tokenAddress);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(tokenAddress);
  };

  return (
    <div className="trade-history-oc-item">
      <div className="order-favorite-cell">
        <div
          className={`order-favorite-icon ${isFavorite ? 'order-favorite-active' : ''}`}
          onClick={handleFavoriteClick}
          role="button"
          style={{ cursor: 'pointer' }}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
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
        <img className="ordercenter-token-icon" src={market.image} />
        <div className="market-details">
          <div className="market-name">
            {market.baseAsset}-{market.quoteAsset}
          </div>
          <div className={`order-type ${trade[2] === 1 ? 'buy' : 'sell'}`}>
            <span className="order-type-capitalized">
              {trade[2] === 1 ? t('buy') : t('sell')}
            </span>
            <CopyButton textToCopy={market.baseAddress} />
          </div>
        </div>
      </div>

      <div className="oc-cell value-cell">
        <span className="order-value">
          {formatBalance(
            (trade[2] === 1 ? trade[0] : trade[1]) / 10 ** quoteDecimals,
            'usd',
          )}
        </span>
        <div className="amount">
          {formatDisplay(
            customRound(
              (trade[2] === 0 ? trade[0] : trade[1]) / 10 ** baseDecimals,
              3,
            ),
          )}
          <span className="oc-market-ticker"> {market.baseAsset}</span>
        </div>
      </div>

      <div className="oc-cell trigger-price">
        {formatSubscript(
          (trade[3] / priceFactor).toFixed(Math.log10(priceFactor)),
        )}
      </div>
      <span className="oc-cell status">
        {trade[7] === 0
          ? t('limit')
          : trade[7] === 1
            ? t('market')
            : t('trigger')}
      </span>
      <span className="oc-cell oc-time">{formatDateAndTime(trade[6])}</span>

      <span className="oc-cell oc-view-cell">
        <ViewButton
          txHash={trade[5]}
          explorer={settings.chainConfig[activechain].explorer}
        />
      </span>
    </div>
  );
};

export default TradeHistoryItem;
