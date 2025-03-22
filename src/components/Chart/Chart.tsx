import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';

import Overlay from '../loading/LoadingComponent';
import AdvancedTradingChart from './ChartCanvas/AdvancedTradingChart';
import ChartCanvas from './ChartCanvas/ChartCanvas';
import ChartHeader from './ChartHeader/ChartHeader';
import TimeFrameSelector from './TimeFrameSelector/TimeFrameSelector';
import UTCClock from './UTCClock/UTCClock';

import { settings } from '../../settings.ts';
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
  setpopup: (value: number) => void;
  tradesloading: boolean;
  dayKlines: any;
}

const ChartComponent: React.FC<ChartComponentProps> = ({
  tokendict,
  trades,
  universalTrades,
  activeMarket,
  orderdata,
  onMarketSelect,
  setpopup,
  tradesloading,
  dayKlines,
}) => {
  const [selectedInterval, setSelectedInterval] = useState('5m');
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [_lastPair, setLastPair] = useState('');
  const [data, setData] = useState<[DataPoint[], string]>([[], '']);
  const [inPic, setInPic] = useState('');
  const [outPic, setOutPic] = useState('');
  const [price, setPrice] = useState('n/a');
  const [priceChange, setPriceChange] = useState('n/a');
  const [change, setChange] = useState('n/a');
  const [high24h, setHigh24h] = useState('n/a');
  const [low24h, setLow24h] = useState('n/a');
  const [volume, setVolume] = useState('n/a');

  const chartRef = useRef<HTMLDivElement>(null);

  function getBarSizeInSeconds(interval: string): number {
    switch (interval) {
      case '1m':
        return 60;
      case '5m':
        return 5 * 60;
      case '15m':
        return 15 * 60;
      case '30m':
        return 30 * 60;
      case '1h':
        return 60 * 60;
      case '4h':
        return 4 * 60 * 60;
      case '1d':
        return 24 * 60 * 60;
      default:
        return 5 * 60;
    }
  }

  async function fetchSubgraphCandles(
    interval: string,
    contractAddress: string
  ): Promise<DataPoint[]> {
    const seriesId = `series-${interval}-${contractAddress}`.toLowerCase();
    const endpoint = `https://gateway.thegraph.com/api/${settings.graphKey}/subgraphs/id/BDU1hP5UVEeYcvWME3eApDa24oBteAfmupPHktgSzu5r`;

    let allCandles: any[] = [];
    const query = `
      query {
        series_collection(where: { id: "${seriesId}" }) {
          series1: klines(
            first: 1000,
            skip: 0,
            orderBy: time,
            orderDirection: desc
          ) {
            id
            time
            open
            high
            low
            close
            volume
          }
          series2: klines(
            first: 1000,
            skip: 1000,
            orderBy: time,
            orderDirection: desc
          ) {
            id
            time
            open
            high
            low
            close
            volume
          }
          series3: klines(
            first: 1000,
            skip: 2000,
            orderBy: time,
            orderDirection: desc
          ) {
            id
            time
            open
            high
            low
            close
            volume
          }
          series4: klines(
            first: 1000,
            skip: 3000,
            orderBy: time,
            orderDirection: desc
          ) {
            id
            time
            open
            high
            low
            close
            volume
          }
          series5: klines(
            first: 1000,
            skip: 4000,
            orderBy: time,
            orderDirection: desc
          ) {
            id
            time
            open
            high
            low
            close
            volume
          }
        }
      }
    `;

    try {
      let res1 = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query
        }),
      });
      const json = await res1.json();
      allCandles = allCandles.concat(json.data.series_collection?.[0]?.series1).concat(json.data.series_collection?.[0]?.series2).concat(json.data.series_collection?.[0]?.series3).concat(json.data.series_collection?.[0]?.series4).concat(json.data.series_collection?.[0]?.series5);
    } catch (err) {
      console.error('Error fetching from subgraph:', err);
    }

    allCandles.reverse();

    return allCandles.map((candle: any) => ({
      time: new Date(Number(candle.time) * 1000).toISOString(),
      open: candle.open / Number(activeMarket.priceFactor),
      high: candle.high / Number(activeMarket.priceFactor),
      low: candle.low / Number(activeMarket.priceFactor),
      close: candle.close / Number(activeMarket.priceFactor),
      volume: parseFloat(candle.volume),
    }));
  }

  const updateChartData = async (
    interval: string,
    tradesArr: any[],
    token: string
  ) => {
    setLastPair((lastPair) => {
      if (token + interval !== lastPair && !settings.useAdv) {
        setOverlayVisible(true);
      }
      return token + interval;
    });

    try {
      const subgraphData = await fetchSubgraphCandles(interval, activeMarket.address);
      if (subgraphData && subgraphData.length) {
        setData([
          subgraphData,
          token +
            (interval === '1d'
              ? '1D'
              : interval === '4h'
              ? '240'
              : interval === '1h'
              ? '60'
              : interval.slice(0, -1)),
        ]);
        calculatePriceMetrics(
          subgraphData,
          activeMarket,
          setPrice,
          setHigh24h,
          setLow24h,
          setChange,
          setPriceChange,
          setVolume
        );
      } else {
        const binancePair = getBinancePair(
          activeMarket.baseAsset === settings.chainConfig[activechain]?.wethticker
            ? settings.chainConfig[activechain]?.ethticker
            : activeMarket.baseAsset,
          activeMarket.quoteAsset
        );

        try {
          const klinesResponse = await axios.get(
            'https://api.binance.com/api/v3/klines',
            {
              params: {
                symbol:
                  binancePair === 'WSOLUSDT'
                    ? 'SOLUSDT'
                    : binancePair === 'WETHUSDT'
                    ? 'ETHUSDT'
                    : binancePair === 'WBTCUSDT'
                    ? 'BTCUSDT'
                    : binancePair,
                interval: interval,
                limit: 1000,
              },
            }
          );
          const chartData: DataPoint[] = klinesResponse.data.map((kline: any) => ({
            time: new Date(kline[0]).toISOString(),
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
            volume: parseFloat(kline[5]),
          }));
          setData([
            chartData,
            token +
              (interval === '1d'
                ? '1D'
                : interval === '4h'
                ? '240'
                : interval === '1h'
                ? '60'
                : interval.slice(0, -1)),
          ]);
          calculatePriceMetrics(
            chartData,
            activeMarket,
            setPrice,
            setHigh24h,
            setLow24h,
            setChange,
            setPriceChange,
            setVolume
          );
        } catch {
          if (tradesArr && !tradesloading) {
            const chartData = generateChartDataFromTrades(
              tradesArr,
              interval,
              activeMarket
            );
            setData([
              chartData,
              token +
                (interval === '1d'
                  ? '1D'
                  : interval === '4h'
                  ? '240'
                  : interval === '1h'
                  ? '60'
                  : interval.slice(0, -1)),
            ]);
            calculatePriceMetrics(
              chartData,
              activeMarket,
              setPrice,
              setHigh24h,
              setLow24h,
              setChange,
              setPriceChange,
              setVolume
            );
          }
        }
      }
    } catch (err) {
      console.error('Error fetching subgraph candles:', err);

      const binancePair = getBinancePair(
        activeMarket.baseAsset === settings.chainConfig[activechain]?.wethticker
          ? settings.chainConfig[activechain]?.ethticker
          : activeMarket.baseAsset,
        activeMarket.quoteAsset
      );

      try {
        const klinesResponse = await axios.get(
          'https://api.binance.com/api/v3/klines',
          {
            params: {
              symbol:
                binancePair === 'WSOLUSDT'
                  ? 'SOLUSDT'
                  : binancePair === 'WETHUSDT'
                  ? 'ETHUSDT'
                  : binancePair === 'WBTCUSDT'
                  ? 'BTCUSDT'
                  : binancePair,
              interval: interval,
              limit: 1000,
            },
          }
        );
        const chartData: DataPoint[] = klinesResponse.data.map((kline: any) => ({
          time: new Date(kline[0]).toISOString(),
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
          volume: parseFloat(kline[5]),
        }));
        setData([
          chartData,
          token +
            (interval === '1d'
              ? '1D'
              : interval === '4h'
              ? '240'
              : interval === '1h'
              ? '60'
              : interval.slice(0, -1)),
        ]);
        calculatePriceMetrics(
          chartData,
          activeMarket,
          setPrice,
          setHigh24h,
          setLow24h,
          setChange,
          setPriceChange,
          setVolume
        );
      } catch {
        if (tradesArr && !tradesloading) {
          const chartData = generateChartDataFromTrades(tradesArr, interval, activeMarket);
          setData([
            chartData,
            token +
              (interval === '1d'
                ? '1D'
                : interval === '4h'
                ? '240'
                : interval === '1h'
                ? '60'
                : interval.slice(0, -1)),
          ]);
          calculatePriceMetrics(
            chartData,
            activeMarket,
            setPrice,
            setHigh24h,
            setLow24h,
            setChange,
            setPriceChange,
            setVolume
          );
        }
      }
    }

    if (!settings.useAdv) {
      setOverlayVisible(false);
    }
  };

  useEffect(() => {
    updateChartData(selectedInterval, trades, activeMarket.baseAsset);
  }, [selectedInterval, activeMarket.baseAsset]);

  useEffect(() => {
    if (!data[0] || data[0].length === 0) return;
    if (!trades || trades.length === 0) return;
  
    const lastTrade = trades[trades.length - 1];

    if (lastTrade[4] !== activeMarket.baseAsset + activeMarket.quoteAsset) return;
  
    setData(([existingBars, existingIntervalLabel]) => {
      const updatedBars = [...existingBars];
      const barSizeSec = getBarSizeInSeconds(selectedInterval);
  
      const lastBarIndex = updatedBars.length - 1;
      const lastBar = updatedBars[lastBarIndex];
  
      const priceFactor = Number(activeMarket.priceFactor || 1);

      let rawPrice = lastTrade[3] / priceFactor;
      rawPrice = parseFloat(rawPrice.toFixed(Math.log10(priceFactor)));
  
      const rawVolume = (lastTrade[2] === 1 ? lastTrade[0] : lastTrade[1]) 
        / 10 ** Number(activeMarket.quoteDecimals);
      
      const tradeTimeSec = lastTrade[6];
  
      const flooredTradeTimeSec = Math.floor(tradeTimeSec / barSizeSec) * barSizeSec;
      const lastBarTimeSec = Math.floor(new Date(lastBar.time).getTime() / 1000);
  
      if (flooredTradeTimeSec === lastBarTimeSec) {
        const newHigh = Math.max(lastBar.high, rawPrice);
        const newLow = Math.min(lastBar.low, rawPrice);
        const newClose = rawPrice;
        const newVolume = lastBar.volume + rawVolume;
  
        updatedBars[lastBarIndex] = {
          ...lastBar,
          high: newHigh,
          low: newLow,
          close: newClose,
          volume: newVolume,
        };
      } else {
        updatedBars.push({
          time: new Date(flooredTradeTimeSec * 1000).toISOString(),
          open: rawPrice,
          high: rawPrice,
          low: rawPrice,
          close: rawPrice,
          volume: rawVolume,
        });
      }
  
      calculatePriceMetrics(
        updatedBars,
        activeMarket,
        setPrice,
        setHigh24h,
        setLow24h,
        setChange,
        setPriceChange,
        setVolume
      );
  
      return [updatedBars, existingIntervalLabel];
    });
  }, [trades]);

  useEffect(() => {
    if (tokendict[activeMarket.baseAddress]) {
      setInPic(tokendict[activeMarket.baseAddress].image);
    }
    if (tokendict[activeMarket.quoteAddress]) {
      setOutPic(tokendict[activeMarket.quoteAddress].image);
    }
    setData([[], '']);
  }, [activeMarket.baseAsset]);

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
        volume={volume}
        orderdata={orderdata}
        tokendict={tokendict}
        onMarketSelect={onMarketSelect}
        universalTrades={universalTrades}
        setpopup={setpopup}
        dayKlines={dayKlines}
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
