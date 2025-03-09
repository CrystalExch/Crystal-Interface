import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';

import Overlay from '../loading/LoadingComponent';
import AdvancedTradingChart from './ChartCanvas/AdvancedTradingChart';
import ChartCanvas from './ChartCanvas/ChartCanvas';
import ChartHeader from './ChartHeader/ChartHeader';
import TimeFrameSelector from './TimeFrameSelector/TimeFrameSelector';
import UTCClock from './UTCClock/UTCClock';

import { settings } from '../../config';
import { calculatePriceMetrics, getBinancePair } from './utils';
import {
  DataPoint,
  generateChartDataFromTrades,
} from './utils/chartDataGenerator';

import './Chart.css';

interface ChartComponentProps {
  onMarketSelect: any;
  tokendict: any;
  trades: any[];
  universalTrades: any[];
  activeMarket: any;
  orderdata: any;
  userWalletAddress?: string | null | undefined;
  mids: any;
  setpopup: (value: number) => void;
  tradesloading: boolean;
}

const ChartComponent: React.FC<ChartComponentProps> = ({
  tokendict,
  trades,
  universalTrades,
  activeMarket,
  orderdata,
  mids,
  onMarketSelect,
  setpopup,
  tradesloading,
}) => {
  const [selectedInterval, setSelectedInterval] = useState('5m');
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [_lastPair, setLastPair] = useState('');
  const [data, setData] = useState<any>([]);
  const [inPic, setInPic] = useState('');
  const [outPic, setOutPic] = useState('');
  const [price, setPrice] = useState('0');
  const [priceChange, setPriceChange] = useState('0');
  const [change, setChange] = useState('0');
  const [high24h, setHigh24h] = useState('0');
  const [low24h, setLow24h] = useState('0');

  const chartRef = useRef<HTMLDivElement>(null);

  const updateChartData = async (
    interval: string,
    trades: any,
    token: string,
  ) => {
    setLastPair((lastPair) => {
      if (token + interval != lastPair && !settings.useAdv) {
        setOverlayVisible(true);
      }
      return token + interval;
    });
    if (
      (settings.useOurData) ||
      token === 'MON' ||
      token === 'WMON'
    ) {
      if (trades && !tradesloading) {
        const chartData = generateChartDataFromTrades(
          trades,
          interval,
          activeMarket,
        );
        setData([
          chartData,
          token +
            (interval == '1d'
              ? '1D'
              : interval == '4h'
                ? '240'
                : interval == '1h'
                  ? '60'
                  : interval.slice(0, -1)),
        ]);
        calculatePriceMetrics(
          trades,
          chartData,
          activeMarket,
          setPrice,
          setHigh24h,
          setLow24h,
          setChange,
          setPriceChange,
        );
      }
    } else {
      const binancePair = getBinancePair(
        activeMarket.baseAsset === settings.chainConfig[activechain].wethticker
          ? settings.chainConfig[activechain].ethticker
          : activeMarket.baseAsset,
        activeMarket.quoteAsset,
      );
      try {
        const klinesResponse = await axios.get(
          'https://api.binance.com/api/v3/klines',
          {
            params: {
              symbol:
                binancePair == 'WSOLUSDT'
                  ? 'SOLUSDT'
                  : binancePair == 'WETHUSDT'
                    ? 'ETHUSDT'
                    : binancePair == 'WBTCUSDT'
                      ? 'BTCUSDT'
                      : binancePair,
              interval: interval,
              limit: 1000,
            },
          },
        );

        const chartData: DataPoint[] = klinesResponse.data.map(
          (kline: any) => ({
            time: new Date(kline[0]).toISOString(),
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
            volume: parseFloat(kline[5]),
          }),
        );
        setData([
          chartData,
          token +
            (interval == '1d'
              ? '1D'
              : interval == '4h'
                ? '240'
                : interval == '1h'
                  ? '60'
                  : interval.slice(0, -1)),
        ]);
        calculatePriceMetrics(
          trades,
          chartData,
          activeMarket,
          setPrice,
          setHigh24h,
          setLow24h,
          setChange,
          setPriceChange,
        );
      } catch {
        if (trades) {
          const chartData = generateChartDataFromTrades(
            trades,
            interval,
            activeMarket,
          );
          setData([
            chartData,
            token +
              (interval == '1d'
                ? '1D'
                : interval == '4h'
                  ? '240'
                  : interval == '1h'
                    ? '60'
                    : interval.slice(0, -1)),
          ]);
          calculatePriceMetrics(
            trades,
            chartData,
            activeMarket,
            setPrice,
            setHigh24h,
            setLow24h,
            setChange,
            setPriceChange,
          );
        }
      }
    }
    if (!settings.useAdv) {
      setOverlayVisible(false);
    }
  };

  useEffect(() => {
    if (tokendict[activeMarket.baseAddress]) {
      setInPic(tokendict[activeMarket.baseAddress].image);
    }
    if (tokendict[activeMarket.quoteAddress]) {
      setOutPic(tokendict[activeMarket.quoteAddress].image);
    }

    updateChartData(selectedInterval, trades, activeMarket.baseAsset);
    const intervalId = setInterval(() => {
      updateChartData(selectedInterval, trades, activeMarket.baseAsset);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [selectedInterval, trades, activeMarket.baseAsset]);

  return (
    <div className="chartwrapper" ref={chartRef}>
      <ChartHeader
        in_icon={inPic}
        out_icon={outPic}
        price={price}
        priceChangeAmount={priceChange}
        priceChangePercent={change}
        activeMarket={activeMarket}
        high24h={high24h}
        low24h={low24h}
        trades={trades}
        orderdata={orderdata}
        markets={markets}
        tokendict={tokendict}
        mids={mids}
        onMarketSelect={onMarketSelect}
        universalTrades={universalTrades}
        setpopup={setpopup}
      />
      <div className="chartcontainer">
        {settings.useAdv ? (
          <AdvancedTradingChart
            data={data}
            activeMarket={activeMarket}
            selectedInterval={selectedInterval}
            setSelectedInterval={setSelectedInterval}
            setOverlayVisible={setOverlayVisible}
          />
        ) : (
          <>
            <div className="chart-options">
              <UTCClock />
              <TimeFrameSelector
                selectedInterval={selectedInterval}
                handleTimeChange={setSelectedInterval}
              />
            </div>
            <ChartCanvas data={data[0]} activeMarket={activeMarket} />
          </>
        )}
        <Overlay isVisible={overlayVisible} bgcolor={'#0f0f12'} height={20} />
      </div>
    </div>
  );
};

export default ChartComponent;
