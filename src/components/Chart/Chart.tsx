import React, { useEffect, useRef, useState } from 'react';

import Overlay from '../loading/LoadingComponent';
import AdvancedTradingChart from './ChartCanvas/AdvancedTradingChart';
import ChartCanvas from './ChartCanvas/ChartCanvas';
import TimeFrameSelector from './TimeFrameSelector/TimeFrameSelector';
import UTCClock from './UTCClock/UTCClock';
import normalizeTicker from '../../utils/normalizeTicker.ts';
import { settings } from '../../settings.ts';
import {
  DataPoint,
} from './utils/chartDataGenerator';

import './Chart.css';

interface ChartComponentProps {
  activeMarket: any;
  tradehistory: any;
  isMarksVisible: boolean;
  orders: any;
  isOrdersVisible: boolean;
  showChartOutliers: boolean;
  router: any;
  refetch: any;
  sendUserOperationAsync: any;
  setChain: any;
  waitForTxReceipt: any;
  address: any;
  client: any;
  newTxPopup: any;
  usedRefAddress: any;
  data: any;
  setData: any;
  realtimeCallbackRef: any;
}

const ChartComponent: React.FC<ChartComponentProps> = ({
  activeMarket,
  tradehistory, 
  isMarksVisible,
  orders,
  isOrdersVisible,
  showChartOutliers,
  router,
  refetch,
  sendUserOperationAsync,
  setChain,
  waitForTxReceipt,
  address,
  client,
  newTxPopup,
  usedRefAddress,
  data,
  setData,
  realtimeCallbackRef,
}) => {
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [_lastPair, setLastPair] = useState('');
  const [selectedInterval, setSelectedInterval] = useState('5m');

  const chartRef = useRef<HTMLDivElement>(null);

  async function fetchSubgraphCandles(
    interval: string,
    contractAddress: string,
    showChartOutliers: boolean,
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
      const close = Math.abs(open - candle.close / priceFactor) / (candle.close / priceFactor) <= 0.5 || showChartOutliers ? candle.close / priceFactor : open

      let high = candle.high / priceFactor;
      let low = candle.low / priceFactor;
      if (!showChartOutliers) {
        high = Math.min(high, Math.max(open, close) * 1.01);
        low = Math.max(low, Math.min(open, close) * 0.99);
      }
      
      lastClose = Math.abs(open - candle.close / priceFactor) / (candle.close / priceFactor) <= 0.5 || showChartOutliers ? close : null;

      return {
        time: candle.time * 1000,
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
    token: string,
    showChartOutliers: boolean,
  ) => {
    setLastPair((lastPair) => {
      if (token + interval !== lastPair && !settings.useAdv) {
        setOverlayVisible(true);
      }
      return token + interval;
    });
    try {
      const subgraphData = await fetchSubgraphCandles(interval, activeMarket.address, showChartOutliers);
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
              : interval.slice(0, -1)), showChartOutliers
        ]);
      }
    } catch (err) {
      console.error('Error fetching subgraph candles:', err);
    }
  };

  useEffect(() => {
    updateCandlestickData(selectedInterval, normalizeTicker(activeMarket.baseAsset, activechain) + normalizeTicker(activeMarket.quoteAsset, activechain), showChartOutliers);
  }, [selectedInterval, normalizeTicker(activeMarket.baseAsset, activechain) + normalizeTicker(activeMarket.quoteAsset, activechain), showChartOutliers]);

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
            orders={orders}
            isOrdersVisible={isOrdersVisible}
            showChartOutliers={showChartOutliers}
            router={router}
            refetch={refetch}
            sendUserOperationAsync={sendUserOperationAsync}
            setChain={setChain}
            waitForTxReceipt={waitForTxReceipt}
            address={address}
            client={client}
            newTxPopup={newTxPopup}
            usedRefAddress={usedRefAddress}
            realtimeCallbackRef={realtimeCallbackRef}
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
            <ChartCanvas data={data} activeMarket={activeMarket} selectedInterval={selectedInterval} setOverlayVisible={setOverlayVisible}/>
          </>
        )}
        <Overlay isVisible={overlayVisible} bgcolor={'#0f0f12'} height={15} maxLogoHeight={100}/>
      </div>
    </div>
  );
};

export default ChartComponent;