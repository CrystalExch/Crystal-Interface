import {
  formatCommas,
  formatSubscript,
} from '../../../utils/numberDisplayFormat';
import { DataPoint } from './chartDataGenerator';

export const calculatePriceMetrics = (
  chartData: DataPoint[],
  market: any,
  setPrice: (price: string) => void,
  setHigh24h: (high: string) => void,
  setLow24h: (low: string) => void,
  setChange: (change: string) => void,
  setPriceChange: (priceChange: string) => void,
  setVolume: (volume: string) => void,
) => {
  if (!chartData || chartData.length === 0) {
    setPrice(formatSubscript('0'));
    setHigh24h(formatSubscript('0'));
    setLow24h(formatSubscript('0'));
    setChange('0.00');
    setPriceChange('0');
    return;
  }
  const decimals = Math.floor(Math.log10(Number(market.priceFactor)));

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const last24hCandles = chartData.filter((candle) => {
    const candleTime = new Date(candle.time).getTime();
    return candleTime >= oneDayAgo;
  });

  const relevantCandles =
    last24hCandles.length > 0 ? last24hCandles : chartData;

  const highs = relevantCandles.map((c) => c.high);
  const lows = relevantCandles.map((c) => c.low);
  const high = Math.max(...highs);
  const low = Math.min(...lows);

  const lastCandle = relevantCandles[relevantCandles.length - 1];
  const firstCandle = relevantCandles[0];
  const lastPrice = lastCandle.close;
  const firstPrice = firstCandle.close;

  const percentageChange =
    firstPrice === 0
      ? 0
      : ((lastPrice - firstPrice) / firstPrice) * 100;

  const actualPriceChange = lastPrice - firstPrice;
  const totalVolume = relevantCandles.reduce((acc, c) => acc + parseFloat(c.volume.toString()), 0);

  setPrice(formatSubscript(lastPrice.toFixed(decimals)));
  setHigh24h(formatSubscript(high.toFixed(decimals)));
  setLow24h(formatSubscript(low.toFixed(decimals)));
  setChange(`${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(2)}`);
  setPriceChange(
    formatCommas(
      `${actualPriceChange > 0 ? '+' : ''}${actualPriceChange.toFixed(decimals)}`
    )
  );
  setVolume(formatCommas(totalVolume.toFixed(2)));
};

export const computePrice = (
  trade: any,
  market: any,
  decimals: number,
): number => {
  const priceFactor = Number(market.priceFactor);
  const rawPrice = trade[3] / priceFactor;
  return parseFloat(rawPrice.toFixed(decimals));
};
