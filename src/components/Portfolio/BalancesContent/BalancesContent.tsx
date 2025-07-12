import React from 'react';

import AssetRow from '../AssetRow/AssetRow.tsx';

import { settings } from '../../../settings.ts';
import customRound from '../../../utils/customRound.tsx';
import normalizeTicker from '../../../utils/normalizeTicker.ts';

import './BalancesContent.css';

interface SortConfig {
  column: string;
  direction: string;
}

interface PortfolioContentProps {
  tokenList: any;
  onMarketSelect: any;
  setSendTokenIn: any;
  setpopup: any;
  sortConfig: SortConfig;
  tokenBalances: any;
  marketsData: any;
  isBlurred?: boolean; 
}

const PortfolioContent: React.FC<PortfolioContentProps> = ({
  tokenList,
  onMarketSelect,
  setSendTokenIn,
  setpopup,
  sortConfig,
  tokenBalances,
  marketsData,
  isBlurred = false,
}) => {

  const marketsDataDict = marketsData.reduce((acc: any, market: any) => {
    acc[market.marketKey] = market;
    return acc;
  }, {} as any);

  const tokensWithBalances = tokenList.map((token: any) => {
    const normalizedTicker = normalizeTicker(token.ticker, activechain);
    const marketKeyUSDC = `${normalizedTicker}USDC`;
    let price = 0;
    let priceChange = 0;
    if (token.address == settings.chainConfig[activechain].usdc) {
      price = 1;
      priceChange = 0;
    }
    else if (marketsDataDict[marketKeyUSDC]) {
      price = Number(marketsDataDict[marketKeyUSDC].currentPrice.replace(/,/g, ''))
      priceChange = Number(marketsDataDict[marketKeyUSDC].priceChange)
    }
    else {
      const quotePrice = marketsDataDict[settings.chainConfig[activechain].ethticker + 'USDC'].currentPrice.replace(/,/g, '')
      price = Number(marketsDataDict[`${normalizedTicker}${settings.chainConfig[activechain].ethticker}`].currentPrice.replace(/,/g, '') * quotePrice);
      priceChange = (1 + Number(marketsDataDict[`${normalizedTicker}${settings.chainConfig[activechain].ethticker}`].priceChange)) * (1 + Number(marketsDataDict[settings.chainConfig[activechain].ethticker + 'USDC'].priceChange)) - 1
    }
    const balance = customRound(
      Number(tokenBalances[token.address]) / 10 ** Number(token.decimals),
      3,
    );
    const value =
      (Number(tokenBalances[token.address]) / 10 ** Number(token.decimals)) *
      price;

    return {
      ...token,
      balance,
      price,
      value,
      priceChange,
    };
  });

  const tokensToDisplay = tokensWithBalances.filter(
    (token: any) => token.balance > 0,
  );

  const sortTokens = (tokens: typeof tokensToDisplay) => {
    return [...tokens].sort((a, b) => {
      switch (sortConfig.column) {
        case 'assets':
          const comparison = a.ticker.localeCompare(b.ticker);
          return sortConfig.direction === 'asc' ? comparison : -comparison;

        case 'balance':
          const balanceValueA = (a.balance || 0) * (a.price || 0);
          const balanceValueB = (b.balance || 0) * (b.price || 0);
          return sortConfig.direction === 'asc'
            ? balanceValueA - balanceValueB
            : balanceValueB - balanceValueA;

        case 'price':
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return sortConfig.direction === 'asc'
            ? priceA - priceB
            : priceB - priceA;

        case 'value':
          const valueA = a.value || 0;
          const valueB = b.value || 0;
          return sortConfig.direction === 'asc'
            ? valueA - valueB
            : valueB - valueA;

        default:
          return 0;
      }
    });
  };

  const sortedTokens = sortTokens(tokensToDisplay);
  
  return (
    <div className="portfolio-content">
      {sortedTokens.length > 0 &&
        sortedTokens.map((token) => (
          <AssetRow
            key={token.address}
            logo={token.image}
            assetName={token.ticker}
            assetAmount={token.balance.toString()}
            tokenName={token.name}
            tokenAddress={token.address}
            price={token.price}
            totalValue={token.value}
            onMarketSelect={onMarketSelect}
            setSendTokenIn={setSendTokenIn}
            setpopup={setpopup}
            priceChange={token.priceChange}
            isBlurred={isBlurred}
            isLST={token?.lst == true}
          />
        ))}
    </div>
  );
};

export default PortfolioContent;