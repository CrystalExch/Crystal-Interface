import React, { useEffect, useState, useRef } from 'react';

import AdditionalMetrics from './AdditionalMetrics/AdditionalMetrics';
import TokenInfo from './TokenInfo/TokenInfo.tsx';

import { formatCommas } from '../../../utils/numberDisplayFormat';

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
    priceFactor?: number;
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
  isChartLoading: boolean;
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
  isChartLoading,
}) => {
  const [buyLiquidity, setBuyLiquidity] = useState('0');
  const [sellLiquidity, setSellLiquidity] = useState('0');
  const [prevMarketId, setPrevMarketId] = useState(activeMarket || '');
  
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
    if (orderdata.liquidityBuyOrders || orderdata.liquiditySellOrders) {
      const roundedBuys =
        orderdata.liquidityBuyOrders.length !== 0
          ? orderdata.liquidityBuyOrders
          : [];
      const roundedSells =
        orderdata.liquiditySellOrders.length !== 0
          ? orderdata.liquiditySellOrders
          : [];
      if (roundedBuys.length !== 0) {
        const buyLiquidity = roundedBuys[roundedBuys.length - 1].totalSize;
        setBuyLiquidity(formatCommas(buyLiquidity.toFixed(2)));
      } else {
        setBuyLiquidity('n/a');
      }
      if (roundedSells.length !== 0) {
        const sellLiquidity = roundedSells[roundedSells.length - 1].totalSize;
        setSellLiquidity(formatCommas(sellLiquidity.toFixed(2)));
      } else {
        setSellLiquidity('n/a');
      }
    }
  }, [orderdata]);

  const priceChangeClass =
    parseFloat(priceChangePercent) > 0
      ? 'positive'
      : parseFloat(priceChangePercent) < 0
        ? 'negative'
        : 'neutral';

  const metrics = [
    {
      label: t('dayChange'),
      value: (
        <span className={`price-change ${priceChangeClass}`}>
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
    <div className="chart-header">
      <TokenInfo
        in_icon={in_icon}
        out_icon={out_icon}
        price={price}
        activeMarket={activeMarket}
        onMarketSelect={onMarketSelect}
        tokendict={tokendict}
        setpopup={setpopup}
        marketsData={marketsData}
        isLoading={isChartLoading}
      />
      <AdditionalMetrics 
        metrics={metrics} 
        isLoading={isChartLoading}
      />
    </div>
  );
};

export default ChartHeader;