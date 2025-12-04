import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import AdditionalMetrics from './AdditionalMetrics/AdditionalMetrics';
import TokenInfo from './TokenInfo/TokenInfo.tsx';

import { formatCommas } from '../../../utils/numberDisplayFormat';
import { settings } from '../../../settings.ts';
import './ChartHeader.css';


interface ChartHeaderProps {
  externalUserStats?: {
    balance: number;
    amountBought: number;
    amountSold: number;
    valueBought: number;
    valueSold: number;
    valueNet: number;
  };
  in_icon: string;
  out_icon: string;
  price: string;
  priceChangeAmount: string;
  priceChangePercent: string;
  activeMarket: {
    id?: string;
    marketSymbol?: string;
    address?: string;
    baseAddress?: string;
    [key: string]: any;
  };
  high24h: string;
  low24h: string;
  volume: string;
  orderdata: any;
  tokendict: any;
  onMarketSelect: any;
  setpopup: (value: number) => void;
  marketsData: any;
  simpleView: boolean;
  tradesByMarket: any;
  isMemeToken?: boolean;
  memeTokenData?: {
    symbol: string;
    name: string;
    image: string;
    id: string;
    marketCap: number;
    change24h: number;
    status: 'new' | 'graduating' | 'graduated';
    created: string;
    website?: string;
    twitterHandle?: string;
    telegramHandle?: string;
    discordHandle?: string;
    graduatedTokens?: number;
    launchedTokens?: number;
    developerAddress?: string;
    reserveQuote?: bigint;
    reserveBase?: bigint;
    bondingPercentage: number;
    source?: 'nadfun' | 'crystal' | string;
  };
  isPerpsToken?: boolean;
  perpsActiveMarketKey: any;
  perpsMarketsData: any;
  perpsFilterOptions: any;
  monUsdPrice: number;
  showLoadingPopup?: (id: string, config: any) => void;
  updatePopup?: (id: string, config: any) => void;
  setperpsActiveMarketKey: any;
  userAddress?: string;
  onSharePNL?: (shareData: any) => void;
}
const ChartHeader: React.FC<ChartHeaderProps> = ({
  in_icon,
  out_icon,
  price,
  priceChangeAmount,
  priceChangePercent,
  activeMarket,
  high24h,
  low24h,
  volume,
  orderdata,
  tokendict,
  onMarketSelect,
  setpopup,
  marketsData,
  simpleView,
  tradesByMarket,
  isMemeToken = false,
  memeTokenData,
  isPerpsToken = false,
  perpsActiveMarketKey,
  perpsMarketsData,
  perpsFilterOptions,
  monUsdPrice,
  showLoadingPopup,
  updatePopup,
  setperpsActiveMarketKey,
  externalUserStats,
  onSharePNL,
  userAddress
}) => {
  const [buyLiquidity, setBuyLiquidity] = useState('0');
  const [sellLiquidity, setSellLiquidity] = useState('0');
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  const isTradeRoute = ['/swap', '/limit', '/send', '/scale', '/market'].includes(location.pathname);
  const shouldShowFullHeader = isTradeRoute && !simpleView;

  useEffect(() => {
    if (orderdata.liquidityBuyOrders?.orders || orderdata.liquiditySellOrders?.orders || orderdata?.reserveQuote || orderdata?.reserveBase) {
      const roundedBuys =
        orderdata.liquidityBuyOrders?.orders.length !== 0
          ? orderdata.liquidityBuyOrders?.orders
          : [];
      const roundedSells =
        orderdata.liquiditySellOrders?.orders.length !== 0
          ? orderdata.liquiditySellOrders?.orders
          : [];

      const activechain = Object.keys(settings.chainConfig)[0];
      const quotePrice = activeMarket.quoteAsset == 'USDC' ? 1 :
        tradesByMarket[(activeMarket.quoteAsset == settings.chainConfig[activechain]?.wethticker ?
          settings.chainConfig[activechain]?.ethticker : activeMarket.quoteAsset) + 'USDC']?.[0]?.[3] / Number(markets[(activeMarket.quoteAsset == settings.chainConfig[activechain]?.wethticker ? settings.chainConfig[activechain]?.ethticker : activeMarket.quoteAsset) + 'USDC']?.priceFactor);

      if ((roundedBuys.length !== 0 || orderdata?.reserveQuote != 0) && quotePrice) {
        const ammBuyLiquidity = Number(orderdata?.reserveQuote) / Number(10n ** activeMarket.quoteDecimals) * quotePrice || 0
        const buyLiquidity = (roundedBuys[roundedBuys.length - 1]?.totalSize * quotePrice || 0) + ammBuyLiquidity;
        setBuyLiquidity(formatCommas(buyLiquidity.toFixed(2)));
      } else {
        setBuyLiquidity('N/A');
      }
      if ((roundedSells.length !== 0 || orderdata?.reserveQuote != 0) && quotePrice) {
        const ammSellLiquidity = Number(orderdata?.reserveQuote) / Number(10n ** activeMarket.quoteDecimals) * quotePrice || 0
        const sellLiquidity = (roundedSells[roundedSells.length - 1]?.totalSize * quotePrice || 0) + ammSellLiquidity;
        setSellLiquidity(formatCommas(sellLiquidity.toFixed(2)));
      } else {
        setSellLiquidity('N/A');
      }

      const newIsLoading = orderdata.liquidityBuyOrders?.market != activeMarket.address;
      setIsLoading(prev => prev !== newIsLoading ? newIsLoading : prev);
    }
  }, [orderdata, activeMarket.address, activeMarket.quoteAsset, activeMarket.quoteDecimals, tradesByMarket]);

  const priceChangeAmountStr = String(priceChangeAmount || '');
  const priceChangePercentStr = String(priceChangePercent || '');

  const metrics = [
    {
      label: t('dayChange'),
      value: (
        <span className={`price-change ${priceChangeAmountStr.trim().startsWith('-') ? 'negative' : priceChangeAmountStr.replace(/[^0-9]/g, '').split('').every(c => c == '0') ? 'neutral' : 'positive'}`}>
          {priceChangeAmountStr !== 'N/A'
            ? `${priceChangeAmountStr} / ${priceChangePercentStr}%`
            : 'N/A'}
        </span>
      ),
    },
    {
      label: t('availableLiquidity'),
      value: (
        <>
          <span className="long">
            {'↗\uFE0E'} ${buyLiquidity === 'N/A' ? '0.00' : buyLiquidity}
          </span>
          <span className="short">
            {'↘\uFE0E'} ${sellLiquidity === 'N/A' ? '0.00' : sellLiquidity}
          </span>
        </>
      ),
    },
    {
      label: t('dayVolume'),
      value: `$${volume}`,
    },
    {
      label: t('dayHigh'),
      value: high24h,
    },
    {
      label: t('dayLow'),
      value: low24h,
    },
  ];

  return (
    <div className={`chart-header ${!shouldShowFullHeader ? 'simplified' : ''}`}>
      <TokenInfo
        in_icon={in_icon}
        out_icon={out_icon}
        price={price}
        activeMarket={activeMarket}
        onMarketSelect={onMarketSelect}
        tokendict={tokendict}
        setpopup={setpopup}
        marketsData={marketsData}
        isLoading={isLoading || price == 'N/A'}
        isTradeRoute={isTradeRoute}
        simpleView={simpleView}
        isMemeToken={isMemeToken}
        memeTokenData={memeTokenData}
        isPerpsToken={isPerpsToken}
        perpsActiveMarketKey={perpsActiveMarketKey}
        perpsMarketsData={perpsMarketsData}
        perpsFilterOptions={perpsFilterOptions}
        monUsdPrice={monUsdPrice}
        showLoadingPopup={showLoadingPopup}
        updatePopup={updatePopup}
        setperpsActiveMarketKey={setperpsActiveMarketKey}
        externalUserStats={externalUserStats}
        onSharePNL={onSharePNL}
        userAddress={userAddress}
      />
      {shouldShowFullHeader && (
        <AdditionalMetrics
          metrics={metrics}
          isLoading={isLoading || price == 'N/A'}
        />
      )}
    </div>
  );
};

export default ChartHeader;