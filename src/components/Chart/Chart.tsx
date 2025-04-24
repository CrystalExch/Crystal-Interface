import React, { useEffect, useRef, useState } from 'react';

import Overlay from '../loading/LoadingComponent';
import AdvancedTradingChart from './ChartCanvas/AdvancedTradingChart';
import ChartCanvas from './ChartCanvas/ChartCanvas';
import TimeFrameSelector from './TimeFrameSelector/TimeFrameSelector';
import UTCClock from './UTCClock/UTCClock';

import { settings } from '../../settings.ts';
import { formatCommas } from '../../utils/numberDisplayFormat.ts';
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
  marketsData: any;
  updateChartData?: any;
  chartHeaderData?: any;
  tradehistory?: any[];
  isMarksVisible: any;
}

const ChartComponent: React.FC<ChartComponentProps> = ({
  trades,
  activeMarket,
  tradesloading,
  updateChartData,
  marketsData,
  tradehistory = [], 
  isMarksVisible,
}) => {
  const [selectedInterval, setSelectedInterval] = useState('5m');
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [_lastPair, setLastPair] = useState('');
  const [data, setData] = useState<[DataPoint[], string]>([[], '']);
  const [price, setPrice] = useState('n/a');
  const [priceChange, setPriceChange] = useState('n/a');
  const [change, setChange] = useState('n/a');
  const [high24h, setHigh24h] = useState('n/a');
  const [low24h, setLow24h] = useState('n/a');
  const [volume, setVolume] = useState('n/a');
  const [isChartLoading, setIsChartLoading] = useState(false);

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
    const endpoint = `https://gateway.thegraph.com/api/${settings.graphKey}/subgraphs/id/6ikTAWa2krJSVCr4bSS9tv3i5nhyiELna3bE8cfgm8yn`;
    let allCandles: any[] = [];
    const query = `
      query {
        series_collection(where: { id: "${seriesId}" }) {
          series1: klines(first: 1000, skip: 0, orderBy: time, orderDirection: desc) {
            id
            time
            open
            high
            low
            close
            volume
          }
          series2: klines(first: 1000, skip: 1000, orderBy: time, orderDirection: desc) {
            id
            time
            open
            high
            low
            close
            volume
          }
          series3: klines(first: 1000, skip: 2000, orderBy: time, orderDirection: desc) {
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
        body: JSON.stringify({ query }),
      });
      const json = await res1.json();
      allCandles = allCandles
        .concat(json.data.series_collection?.[0]?.series1)
        .concat(json.data.series_collection?.[0]?.series2)
        .concat(json.data.series_collection?.[0]?.series3);
    } catch (err) {
      console.error('Error fetching from subgraph:', err);
    }

    allCandles.reverse();
    let lastClose: number | null = null;
    return allCandles.map((candle: any) => {
      const priceFactor = Number(activeMarket.priceFactor);
      const open = lastClose !== null ? lastClose : candle.open / priceFactor;
      const close = candle.close / priceFactor;

      let high = candle.high / priceFactor;
      let low = candle.low / priceFactor;
    
      high = Math.min(high, Math.max(open, close) * 1.01);
      low = Math.max(low, Math.min(open, close) * 0.99);

      lastClose = close;

      return {
        time: new Date(Number(candle.time) * 1000).toISOString(),
        open,
        high,
        low,
        close,
        volume: parseFloat(candle.volume),
      };
    });
  }

  const updateCandlestickData = async (
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
    setIsChartLoading(true);
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
      } else if (tradesArr && !tradesloading) {
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
      }
    } catch (err) {
      console.error('Error fetching subgraph candles:', err);
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
      }
    }
    setIsChartLoading(false);
    if (!settings.useAdv) {
      setOverlayVisible(false);
    }
  };

  useEffect(() => {
    updateCandlestickData(selectedInterval, trades, activeMarket.baseAsset);
  }, [selectedInterval, activeMarket.baseAsset]);

  useEffect(() => {
    if (!marketsData || !activeMarket) return;
    
    const marketHeader = marketsData.find(
      (market: any) => market.address === activeMarket.address
    );

    if (marketHeader) {
      setPrice(marketHeader.currentPrice);
      setPriceChange(
        formatCommas(
          (marketHeader.priceChangeAmount / Number(activeMarket.priceFactor)).toString()
        )
      );      
      setChange(marketHeader.priceChange);
      setHigh24h(
        formatCommas((parseFloat(marketHeader.high24h.replace(/,/g, '')) / Number(activeMarket.priceFactor)).toString())
      );
      setLow24h(
        formatCommas((parseFloat(marketHeader.low24h.replace(/,/g, '')) / Number(activeMarket.priceFactor)).toString())
      );
      setVolume(marketHeader.volume);
    }
  }, [marketsData, activeMarket]);

  useEffect(() => {
    if (updateChartData) {
      updateChartData((prevData: any) => {
        if (
          prevData.price === price &&
          prevData.priceChange === priceChange &&
          prevData.change === change &&
          prevData.high24h === high24h &&
          prevData.low24h === low24h &&
          prevData.volume === volume &&
          prevData.isChartLoading === isChartLoading
        ) {
          return prevData;
        }
  
        return {
          price,
          priceChange,
          change,
          high24h,
          low24h,
          volume,
          isChartLoading
        };
      });
    }
  }, [price, priceChange, change, high24h, low24h, volume, isChartLoading]);

  useEffect(() => {
    if (!data[0] || data[0].length === 0 || !trades || trades.length === 0) return;
  
    const lastTrade = trades[trades.length - 1];
  
    setData(([existingBars, existingIntervalLabel]) => {
      const updatedBars = [...existingBars];
      const barSizeSec = getBarSizeInSeconds(selectedInterval);
  
      const lastBarIndex = updatedBars.length - 1;
      const lastBar = updatedBars[lastBarIndex];
  
      const priceFactor = Number(activeMarket.priceFactor || 1);
      let rawPrice = lastTrade[3] / priceFactor;
      rawPrice = parseFloat(rawPrice.toFixed(Math.floor(Math.log10(priceFactor))));
  
      const rawVolume =
        (lastTrade[2] === 1 ? lastTrade[0] : lastTrade[1]) /
        10 ** Number(activeMarket.quoteDecimals);
      
      const tradeTimeSec = lastTrade[6];
      const flooredTradeTimeSec = Math.floor(tradeTimeSec / barSizeSec) * barSizeSec;
      const lastBarTimeSec = Math.floor(new Date(lastBar.time).getTime() / 1000);
      if (/^[^\d]+/.test(existingIntervalLabel) && lastTrade?.[4].startsWith(existingIntervalLabel.match(/^[^\d]+/)![0])) {
        if (flooredTradeTimeSec === lastBarTimeSec) {
          updatedBars[lastBarIndex] = {
            ...lastBar,
            high: Math.max(lastBar.high, rawPrice),
            low: Math.min(lastBar.low, rawPrice),
            close: rawPrice,
            volume: lastBar.volume + rawVolume,
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
      }
  
      return [updatedBars, existingIntervalLabel];
    });
  }, [trades]);

  return (
    <div className="chartwrapper" ref={chartRef}>
      <div className="chartcontainer">
        {settings.useAdv ? (
          <AdvancedTradingChart
            data={data}
            activeMarket={activeMarket}
            selectedInterval={selectedInterval}
            setSelectedInterval={setSelectedInterval}
            setOverlayVisible={setOverlayVisible}
            tradehistory={tradehistory} 
            isMarksVisible={isMarksVisible}
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