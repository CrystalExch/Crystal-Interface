import React, { useEffect, useState, useRef } from 'react';

import AdditionalMetrics from './AdditionalMetrics/AdditionalMetrics';
import TokenInfo from './TokenInfo/TokenInfo.tsx';

import { formatCommas } from '../../../utils/numberDisplayFormat';

import './ChartHeader.css';

interface UniversalTrades {
  [key: string]: Array<
    [number, number, number, number, string, string, number]
  >;
}

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
  universalTrades: any[];
  setpopup: (value: number) => void;
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
  universalTrades,
  setpopup,
}) => {
  const [buyLiquidity, setBuyLiquidity] = useState('0');
  const [sellLiquidity, setSellLiquidity] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [prevMarketId, setPrevMarketId] = useState(activeMarket?.id || '');
  
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
  
  useEffect(() => {
    if (activeMarket?.id !== prevMarketId) {
      setIsLoading(true);
      setPrevMarketId(activeMarket?.id || '');
      
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
      
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
      
      return () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      };
    }
  }, [activeMarket, prevMarketId]);
  
  useEffect(() => {
    if (isLoading) {
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
        setIsLoading(false);
        
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    }
  }, [
    isLoading,
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
        setBuyLiquidity('0');
      }
      if (roundedSells.length !== 0) {
        const sellLiquidity = roundedSells[roundedSells.length - 1].totalSize;
        setSellLiquidity(formatCommas(sellLiquidity.toFixed(2)));
      } else {
        setSellLiquidity('0');
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
          {priceChangeAmount} / {priceChangePercent}%
        </span>
      ),
      isLoading,
    },
    {
      label: t('availableLiquidity'),
      value: (
        <>
          <span className="long">
            {'↗\uFE0E'} ${buyLiquidity}
          </span>
          <span className="short">
            {'↘\uFE0E'} ${sellLiquidity}
          </span>
        </>
      ),
      isLoading,
    },
    {
      label: t('dayVolume'),
      value: `$${volume}`,
      isLoading,
    },
    {
      label: t('dayHigh'),
      value: high24h,
      isLoading,
    },
    {
      label: t('dayLow'),
      value: low24h,
      isLoading,
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
        universalTrades={universalTrades as unknown as UniversalTrades}
        setpopup={setpopup}
      />
      <AdditionalMetrics metrics={metrics} />
    </div>
  );
};

export default ChartHeader;