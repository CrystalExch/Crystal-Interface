import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import AdditionalMetrics from './AdditionalMetrics/AdditionalMetrics';
import TokenInfo from './TokenInfo/TokenInfo.tsx';

import { formatCommas } from '../../../utils/numberDisplayFormat';
import { settings } from '../../../settings.ts';
import './ChartHeader.css';

interface ChartHeaderProps {
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
    tokenAddress: string;
    marketCap: number;
    change24h: number;
    status: 'new' | 'graduating' | 'graduated';
    created: string;
    website?: string;
    twitterHandle?: string;
    telegramHandle?: string;
    discordHandle?: string;
  };
  isPerpsToken?: boolean;
  perpsTokenData?: {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    tokenIcon: string;
    price: number;
    change24h: number;
    volume24h: number;
    openInterest: number;
    fundingRate: number;
    maxLeverage: number;
  };
  monUsdPrice: number;
  showLoadingPopup?: (id: string, config: any) => void;
  updatePopup?: (id: string, config: any) => void;
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
  perpsTokenData,
  monUsdPrice,
  showLoadingPopup,
  updatePopup
}) => {
  const [buyLiquidity, setBuyLiquidity] = useState('0');
  const [sellLiquidity, setSellLiquidity] = useState('0');
  const [prevMarketId, setPrevMarketId] = useState(activeMarket || '');
  const [isLoading, setIsLoading] = useState(true);
  const prevMetricsRef = useRef({
    price,
    priceChangeAmount,
    priceChangePercent,
    high24h,
    low24h,
    volume,
    buyLiquidity: '0',
    sellLiquidity: '0'
  });

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const delayedLoadingClearRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();
  const isTradeRoute = ['/swap', '/limit', '/send', '/scale', '/market'].includes(location.pathname);
  const shouldShowFullHeader = isTradeRoute && !simpleView;

  useEffect(() => {
    if (activeMarket !== prevMarketId) {
      setPrevMarketId(activeMarket || '');

      prevMetricsRef.current = {
        price,
        priceChangeAmount,
        priceChangePercent,
        high24h,
        low24h,
        volume,
        buyLiquidity,
        sellLiquidity
      };

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      if (delayedLoadingClearRef.current) {
        clearTimeout(delayedLoadingClearRef.current);
        delayedLoadingClearRef.current = null;
      }

      return () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
        if (delayedLoadingClearRef.current) {
          clearTimeout(delayedLoadingClearRef.current);
        }
      };
    }
  }, [activeMarket]);

  useEffect(() => {
    const prevMetrics = prevMetricsRef.current;

    const hasMetricsChanged =
      price !== prevMetrics.price ||
      priceChangeAmount !== prevMetrics.priceChangeAmount ||
      high24h !== prevMetrics.high24h ||
      low24h !== prevMetrics.low24h ||
      volume !== prevMetrics.volume ||
      buyLiquidity !== prevMetrics.buyLiquidity ||
      sellLiquidity !== prevMetrics.sellLiquidity;

    if (hasMetricsChanged) {
      if (delayedLoadingClearRef.current) {
        clearTimeout(delayedLoadingClearRef.current);
      }

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, [
    price,
    priceChangeAmount,
    priceChangePercent,
    high24h,
    low24h,
    volume,
    buyLiquidity,
    sellLiquidity
  ]);

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
          settings.chainConfig[activechain]?.ethticker : activeMarket.quoteAsset) + 'USDC']?.[0]?.[3];

      if ((roundedBuys.length !== 0 || orderdata?.reserveQuote != 0) && quotePrice) {
        const ammBuyLiquidity = Number(orderdata?.reserveQuote) / Number(10n ** activeMarket.quoteDecimals) * quotePrice || 0
        const buyLiquidity = (roundedBuys[roundedBuys.length - 1]?.totalSize * quotePrice || 0) + ammBuyLiquidity;
        setBuyLiquidity(formatCommas(buyLiquidity.toFixed(2)));
      } else {
        setBuyLiquidity('n/a');
      }
      if ((roundedSells.length !== 0 || orderdata?.reserveQuote != 0) && quotePrice) {
        const ammSellLiquidity = Number(orderdata?.reserveQuote) / Number(10n ** activeMarket.quoteDecimals) * quotePrice || 0
        const sellLiquidity = (roundedSells[roundedSells.length - 1]?.totalSize * quotePrice || 0) + ammSellLiquidity;
        setSellLiquidity(formatCommas(sellLiquidity.toFixed(2)));
      } else {
        setSellLiquidity('n/a');
      }
      setIsLoading(orderdata.liquidityBuyOrders?.market != activeMarket.address)
    }
  }, [orderdata]);

  const metrics = [
    {
      label: t('dayChange'),
      value: (
        <span className={`price-change ${parseFloat(priceChangePercent) > 0 ? 'positive' : parseFloat(priceChangePercent) < 0 ? 'negative' : 'neutral'}`}>
          {priceChangeAmount !== 'n/a'
            ? `${priceChangeAmount} / ${priceChangePercent}%`
            : 'n/a'}
        </span>
      ),
    },
    {
      label: t('availableLiquidity'),
      value: (
        <>
          <span className="long">
            {'↗\uFE0E'} ${buyLiquidity === 'n/a' ? '0.00' : buyLiquidity}
          </span>
          <span className="short">
            {'↘\uFE0E'} ${sellLiquidity === 'n/a' ? '0.00' : sellLiquidity}
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
        isLoading={isLoading}
        isTradeRoute={isTradeRoute}
        simpleView={simpleView}
        isMemeToken={isMemeToken}
        memeTokenData={memeTokenData}
        isPerpsToken={isPerpsToken}
        perpsTokenData={perpsTokenData}
        monUsdPrice={monUsdPrice}
      />
      {shouldShowFullHeader && (
        <AdditionalMetrics
          metrics={metrics}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default ChartHeader;