import React, { useEffect, useState } from 'react';

import AdditionalMetrics from './AdditionalMetrics/AdditionalMetrics';
import TokenInfo from './TokenInfo/TokenInfo.tsx';

import { formatCommas } from '../../../utils/numberDisplayFormat';
import { calculate24hVolume } from '../utils';

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
  trades: any[];
  orderdata: any;
  markets: any;
  tokendict: any;
  mids: any;
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
  trades,
  orderdata,
  markets,
  tokendict,
  mids,
  onMarketSelect,
  universalTrades,
  setpopup,
}) => {
  const [volume, setVolume] = useState('0');
  const [buyLiquidity, setBuyLiquidity] = useState('0');
  const [sellLiquidity, setSellLiquidity] = useState('0');

  useEffect(() => {
    if (activeMarket && trades && markets) {
      setVolume(
        formatCommas(calculate24hVolume(trades, activeMarket).toString()),
      );
    }
  }, [activeMarket, trades, markets]);

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
        mids={mids}
        universalTrades={universalTrades as unknown as UniversalTrades}
        setpopup={setpopup}
      />
      <AdditionalMetrics metrics={metrics} />
    </div>
  );
};

export default ChartHeader;
