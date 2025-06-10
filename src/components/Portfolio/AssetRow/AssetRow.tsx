import React from 'react';
import CopyButton from '../../CopyButton/CopyButton';
import SendIcon from '../SendIcon/SendIcon';
import SwapIcon from '../SwapIcon/SwapIcon';
import StakeIcon from '../StakeIcon/StakeIcon.tsx';

import { settings } from '../../../settings.ts';
import {
  formatBalance,
  formatSubscript,
} from '../../../utils/numberDisplayFormat';

import './AssetRow.css';

interface AssetRowProps {
  logo: string;
  assetName: string;
  assetAmount: string;
  tokenName: string;
  tokenAddress: string;
  price: number;
  totalValue: number;
  showLock?: boolean;
  onMarketSelect: any;
  setSendTokenIn: any;
  setpopup: any;
  priceChange: number;
  isBlurred?: boolean; 
  isLST?: boolean;
}

const AssetRow: React.FC<AssetRowProps> = ({
  logo,
  assetName,
  assetAmount,
  tokenName,
  tokenAddress,
  price,
  totalValue,
  onMarketSelect,
  setSendTokenIn,
  setpopup,
  priceChange,
  isBlurred = false,
  isLST = false,
}) => {
  const market =
    settings.chainConfig[activechain].markets[assetName + 'USDC'] ?? null;

  return (
    <div className="portfolio-row">
      <div className="oc-cell">
        <img src={logo} className="asset-icon" />
        <div className="asset-details">
          <div className="asset-ticker">
            {assetName}
            <CopyButton textToCopy={tokenAddress} />
          </div>
          <div className="asset-name">{tokenName}</div>
        </div>
      </div>
      <div className="oc-cell">
        <div className="amount-details">
          <div className={`usd-asset-amount ${isBlurred ? 'blurred' : ''}`}>
            {formatBalance(totalValue.toString(), 'usd')}
          </div>
          <div className={`asset-amount ${isBlurred ? 'blurred' : ''}`}>
            {formatBalance(assetAmount, 'token')}
            <span className="oc-market-ticker"> {assetName} </span>
          </div>
        </div>
      </div>
      <div className="oc-cell limit-price">
        <div className="price-details">
          <div className="port-token-price">
            $
            {formatSubscript(
              price.toFixed(Math.floor(Math.log10(Number(market?.priceFactor ?? 100)))),
            )}
          </div>
          <div
            className={`asset-price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}
          >
            {priceChange >= 0 ? '+' : ''}
            {priceChange ? priceChange.toFixed(2) : '0.00'}%
          </div>
        </div>
      </div>
      <div className="oc-cell">
        <div className="action-icons">
          {isLST ? <StakeIcon
            tokenaddress={tokenAddress}
            onMarketSelect={onMarketSelect}
            setpopup={setpopup}
          /> : <SwapIcon
          tokenaddress={tokenAddress}
          onMarketSelect={onMarketSelect}
          setpopup={setpopup}
          />}
          <SendIcon
            tokenaddress={tokenAddress}
            setpopup={setpopup}
            setSendTokenIn={setSendTokenIn}
          />
        </div>
      </div>
    </div>
  );
};

export default AssetRow;