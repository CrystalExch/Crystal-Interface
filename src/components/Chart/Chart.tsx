import React, { useEffect, useState } from 'react';

import Overlay from '../loading/LoadingComponent';
import AdvancedTradingChart from './ChartCanvas/AdvancedTradingChart';
import ChartCanvas from './ChartCanvas/ChartCanvas';
import TimeFrameSelector from './TimeFrameSelector/TimeFrameSelector';
import UTCClock from './UTCClock/UTCClock';
import normalizeTicker from '../../utils/normalizeTicker.ts';
import { settings } from '../../settings.ts';

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
  address: any;
  client: any;
  newTxPopup: any;
  usedRefAddress: any;
  data: any;
  setData: any;
  realtimeCallbackRef: any;
  limitPrice?: bigint;
  updateLimitAmount?: any;
  tokenIn?: string;
  amountIn?: bigint;
  isLimitOrderMode?: boolean;
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
  address,
  client,
  newTxPopup,
  usedRefAddress,
  data,
  setData,
  realtimeCallbackRef,
  limitPrice,
  updateLimitAmount,
  tokenIn,
  amountIn,
  isLimitOrderMode = false,
}) => {
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [_lastPair, setLastPair] = useState('');
  const [selectedInterval, setSelectedInterval] = useState('5m');

  useEffect(() => {
    let isFetching = true;
    (async () => {
      setLastPair((lastPair) => {
        if (normalizeTicker(activeMarket.baseAsset, activechain) + normalizeTicker(activeMarket.quoteAsset, activechain) + selectedInterval !== lastPair && !settings.useAdv) {
          setOverlayVisible(true);
        }
        return normalizeTicker(activeMarket.baseAsset, activechain) + normalizeTicker(activeMarket.quoteAsset, activechain) + selectedInterval;
      });
      try {
        if (showChartOutliers != data[2]) {
          setOverlayVisible(true);
        }
        const seriesId = `${activeMarket.address}-${
          selectedInterval === '1m' ? 60 :
          selectedInterval === '5m' ? 300 :
          selectedInterval === '15m' ? 900 :
          selectedInterval === '1h' ? 3600 :
          selectedInterval === '4h' ? 14400 :
          86400
        }`.toLowerCase();
        const endpoint = 'https://api.studio.thegraph.com/query/104695/test/v0.2.0';
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
                baseVolume
              }
              series2: klines(first: 1000, skip: 1000, orderBy: time, orderDirection: desc) {
                id
                time
                open
                high
                low
                close
                baseVolume
              }
              series3: klines(first: 1000, skip: 2000, orderBy: time, orderDirection: desc) {
                id
                time
                open
                high
                low
                close
                baseVolume
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
        if (!isFetching) return;
        allCandles.reverse();
        let lastClose: number | null = null;
        const outlierFactor = selectedInterval == '1d' ? 0.5 : selectedInterval == '4h' ? 0.25 : selectedInterval == '1h' ? 0.1 : selectedInterval == '15m' ? 0.05 : 0.01
        const subgraphData = allCandles.map((candle: any) => {
          const priceFactor = Number(activeMarket.priceFactor);
          const open = lastClose !== null ? lastClose : candle.open / priceFactor;
          const close = candle.close / priceFactor
    
          let high = candle.high / priceFactor;
          let low = candle.low / priceFactor;
          if (!showChartOutliers) {
            high = Math.min(high, Math.max(open, close) * (1 + outlierFactor));
            low = Math.max(low, Math.min(open, close) * (1 - outlierFactor));
          }
          
          lastClose = close

          return {
            time: candle.time * 1000,
            open,
            high,
            low,
            close,
            volume: Number(candle.baseVolume) / (10 ** Number(activeMarket.baseDecimals)),
          };
        });
        if (subgraphData && subgraphData.length) {
          setData([
            subgraphData,
            normalizeTicker(activeMarket.baseAsset, activechain) + normalizeTicker(activeMarket.quoteAsset, activechain) +
              (selectedInterval === '1d'
                ? '1D'
                : selectedInterval === '4h'
                ? '240'
                : selectedInterval === '1h'
                ? '60'
                : selectedInterval.slice(0, -1)), showChartOutliers
          ]);
        }
      } catch (err) {
        console.error('Error fetching subgraph candles:', err);
      }
    })()
    return () => {
      isFetching = false;
    };
  }, [selectedInterval, normalizeTicker(activeMarket.baseAsset, activechain) + normalizeTicker(activeMarket.quoteAsset, activechain), showChartOutliers]);

  return (
    <div className="chartwrapper">
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
          address={address}
          client={client}
          newTxPopup={newTxPopup}
          usedRefAddress={usedRefAddress}
          realtimeCallbackRef={realtimeCallbackRef}
          limitPrice={limitPrice}
          updateLimitAmount={updateLimitAmount}
          tokenIn={tokenIn}
          amountIn={amountIn}
          isLimitOrderMode={isLimitOrderMode}
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
      <Overlay isVisible={overlayVisible} bgcolor={'rgb(6,6,6)'} height={15} maxLogoHeight={100}/>
    </div>
  );
};

export default ChartComponent;