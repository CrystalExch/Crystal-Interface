import {
  formatCommas,
  formatSubscript,
} from '../../../utils/numberDisplayFormat';
import { DataPoint } from './chartDataGenerator';

export const calculatePriceMetrics = (
  trades: any[],
  chartData: DataPoint[],
  market: any,
  setPrice: (price: string) => void,
  setHigh24h: (high: string) => void,
  setLow24h: (low: string) => void,
  setChange: (change: string) => void,
  setPriceChange: (priceChange: string) => void,
) => {
  const sortedTrades = [...trades].sort((a, b) => a[6] - b[6]);

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const cutoffIndex = sortedTrades.findIndex(
    (trade) => trade[6] * 1000 > oneDayAgo,
  );

  let recentTrades: any[];

  if (cutoffIndex === -1) {
    recentTrades = [...sortedTrades];
  } else {
    recentTrades = sortedTrades.slice(cutoffIndex);
    if (cutoffIndex > 0) {
      recentTrades.unshift(sortedTrades[cutoffIndex - 1]);
    }
  }

  if (!recentTrades.some((trade) => trade[6] * 1000 > oneDayAgo)) {
    recentTrades = [];
  }

  const decimals = Math.floor(Math.log10(Number(market.priceFactor)));

  const recentPrices = recentTrades.map((trade) =>
    computePrice(trade, market, decimals),
  );

  if (recentPrices.length === 0 && chartData.length > 0) {
    let lastPrice: number;
    if (sortedTrades.length > 0) {
      const lastTrade = sortedTrades[sortedTrades.length - 1];
      lastPrice = computePrice(lastTrade, market, decimals);
    } else {
      lastPrice = 0;
    }
    setPrice(formatSubscript(lastPrice.toFixed(decimals)));
    setHigh24h(formatSubscript(lastPrice.toFixed(decimals)));
    setLow24h(formatSubscript(lastPrice.toFixed(decimals)));
    setChange((0).toFixed(2));
    setPriceChange((0).toFixed(decimals));
  } else if (recentPrices.length > 0) {
    const high = Math.max(...recentPrices);
    const low = Math.min(...recentPrices);
    const lastPrice = recentPrices[recentPrices.length - 1];
    const firstPrice = recentPrices[0];

    const percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    const actualPriceChange = parseFloat(
      (lastPrice - firstPrice).toFixed(decimals),
    );

    setPrice(formatSubscript(lastPrice.toFixed(decimals)));
    setHigh24h(formatSubscript(high.toFixed(decimals)));
    setLow24h(formatSubscript(low.toFixed(decimals)));
    setChange(
      `${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(2)}`,
    );
    setPriceChange(
      formatCommas(
        `${actualPriceChange > 0 ? '+' : ''}${actualPriceChange.toFixed(
          decimals,
        )}`,
      ),
    );
  } else {
    setPrice(formatSubscript((0).toFixed(decimals)));
    setHigh24h(formatSubscript((0).toFixed(decimals)));
    setLow24h(formatSubscript((0).toFixed(decimals)));
    setChange((0).toFixed(2));
    setPriceChange((0).toFixed(decimals));
  }
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
