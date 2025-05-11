import React, { useEffect, useState } from 'react';

import AssetRow from '../AssetRow/AssetRow.tsx';

import { settings } from '../../../settings.ts';
import customRound from '../../../utils/customRound.tsx';
import { fetchLatestPrice } from '../../../utils/getPrice.ts';
import normalizeTicker from '../../../utils/normalizeTicker.ts';
import { get24hChange } from '../utils/get24Change.ts';

import './BalancesContent.css';

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

interface PortfolioContentProps {
  trades: TradesByMarket;
  tokenList: any;
  onMarketSelect: any;
  setSendTokenIn: any;
  setpopup: any;
  sortConfig: SortConfig;
  tokenBalances: any;
  isBlurred?: boolean; 
}

const PortfolioContent: React.FC<PortfolioContentProps> = ({
  trades,
  tokenList,
  onMarketSelect,
  setSendTokenIn,
  setpopup,
  sortConfig,
  tokenBalances,
  isBlurred = false,
}) => {
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});

  const getPriceFromTrades = (ticker: string) => {
    const normalizedTicker = normalizeTicker(ticker, activechain);
    const marketKeyUSDC = `${normalizedTicker}USDC`;
    if (markets[marketKeyUSDC]) {
      const marketTrades = trades[marketKeyUSDC] || [];
      return fetchLatestPrice(marketTrades, markets[marketKeyUSDC]) || 0;
    }
    else {
      const quotePrice = trades[settings.chainConfig[activechain].ethticker + 'USDC']?.[0]?.[3]
      / Number(markets[settings.chainConfig[activechain].ethticker + 'USDC']?.priceFactor)
      const marketTrades = trades[`${normalizedTicker}${settings.chainConfig[activechain].ethticker}`] || [];
      return (fetchLatestPrice(marketTrades, markets[`${normalizedTicker}${settings.chainConfig[activechain].ethticker}`]) || 0) * quotePrice;
    }
  };

  const getPriceChangeFromTrades = (ticker: string) => {
    const normalizedTicker = normalizeTicker(ticker, activechain);
    const marketKey = `${normalizedTicker}USDC`;
    if (markets[marketKey]) {
      const marketTrades = trades[marketKey] || [];
      return get24hChange(marketTrades);
    }
    return { percentageChange: 0, actualPriceChange: 0 };
  };

  const fetchAllTokenPrices = async () => {
    const prices: Record<string, number> = {};

    Object.keys(markets).forEach((marketKey) => {
      const market = markets[marketKey];
      const price = getPriceFromTrades(market.baseAsset);
      prices[market.baseAddress] = price;
    });

    const wethPrice = prices[settings.chainConfig[activechain].eth];
    if (wethPrice) {
      prices[settings.chainConfig[activechain].weth] = wethPrice;
    }

    prices[settings.chainConfig[activechain].usdc] = 1;

    setTokenPrices(prices);
  };

  useEffect(() => {
    fetchAllTokenPrices();
  }, [activechain, trades]);

  const tokensWithBalances = tokenList.map((token: any) => {
    const balance = customRound(
      Number(tokenBalances[token.address]) / 10 ** Number(token.decimals),
      3,
    );
    const price = tokenPrices[token.address] || 0;
    const value =
      (Number(tokenBalances[token.address]) / 10 ** Number(token.decimals)) *
      price;
    const priceChange = getPriceChangeFromTrades(token.ticker);

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
            priceChange={token.priceChange.percentageChange}
            isBlurred={isBlurred}
          />
        ))}
    </div>
  );
};

export default PortfolioContent;