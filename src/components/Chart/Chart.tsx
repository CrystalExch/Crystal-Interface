import React, { useEffect, useRef, useState } from 'react';

import Overlay from '../loading/LoadingComponent';
import AdvancedTradingChart from './ChartCanvas/AdvancedTradingChart';
import ChartCanvas from './ChartCanvas/ChartCanvas';
import TimeFrameSelector from './TimeFrameSelector/TimeFrameSelector';
import UTCClock from './UTCClock/UTCClock';
import normalizeTicker from '../../utils/normalizeTicker.ts';
import { settings } from '../../settings.ts';
import { formatCommas } from '../../utils/numberDisplayFormat.ts';
import {
  DataPoint,
} from './utils/chartDataGenerator';

import './Chart.css';

interface ChartComponentProps {
  activeMarket: any;
  orderdata: any;
  marketsData: any;
  updateChartData?: any;
  tradehistory: any;
  isMarksVisible: boolean;
  orders: any;
  isOrdersVisible: boolean;
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
  updateChartData,
  marketsData,
  tradehistory, 
  isMarksVisible,
  orders,
  isOrdersVisible,
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
  const [price, setPrice] = useState('n/a');
  const [priceChange, setPriceChange] = useState('n/a');
  const [change, setChange] = useState('n/a');
  const [high24h, setHigh24h] = useState('n/a');
  const [low24h, setLow24h] = useState('n/a');
  const [volume, setVolume] = useState('n/a');
  const [selectedInterval, setSelectedInterval] = useState('5m');
  const [isChartLoading, setIsChartLoading] = useState(false);

  const chartRef = useRef<HTMLDivElement>(null);

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
    return allCandles.map((candle: any) => {
      const priceFactor = Number(activeMarket.priceFactor);
      const open = candle.open / priceFactor;
      const close = candle.close / priceFactor;

      let high = candle.high / priceFactor;
      let low = candle.low / priceFactor;
    
      high = Math.min(high, Math.max(open, close) * 1.01);
      low = Math.max(low, Math.min(open, close) * 0.99);

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
      }
    } catch (err) {
      console.error('Error fetching subgraph candles:', err);
    }
    setIsChartLoading(false);
  };

  useEffect(() => {
    updateCandlestickData(selectedInterval, normalizeTicker(activeMarket.baseAsset, activechain));
  }, [selectedInterval, normalizeTicker(activeMarket.baseAsset, activechain)]);

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
        <Overlay isVisible={overlayVisible} bgcolor={'#0f0f12'} height={30} />
      </div>
    </div>
  );
};

export default ChartComponent;