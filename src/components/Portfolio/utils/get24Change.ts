export interface ChangeMetrics {
  percentageChange: number;
  actualPriceChange: number;
}

export const get24hChange = (trades: any[]): ChangeMetrics => {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const cutoffIndex = trades.findIndex((trade) => trade[6] * 1000 > oneDayAgo);

  let recentTrades: any[];
  if (cutoffIndex === -1) {
    recentTrades = [...trades];
  } else {
    recentTrades = trades.slice(cutoffIndex);
    if (cutoffIndex > 0) {
      const previousTrade = trades[cutoffIndex - 1];
      recentTrades.unshift(previousTrade);
    }
  }

  if (!recentTrades.some((trade) => trade[6] * 1000 > oneDayAgo)) {
    recentTrades = [];
  }

  const computePrice = (trade: any): number => {
    const marketName = trade[4];
    const market = markets[marketName];

    if (!market || !market.priceFactor) {
      return Number(trade[3]) || 0;
    }
    const priceFactor = Number(market.priceFactor);
    const precision = priceFactor > 0 ? Math.floor(Math.log10(priceFactor)) : 0;
    const price = (trade[3] / priceFactor || 0).toFixed(precision);

    return parseFloat(price);
  };

  const recentPrices = recentTrades.map(computePrice);

  if (recentPrices.length === 0) {
    return { percentageChange: 0.0, actualPriceChange: 0.0 };
  }

  const firstPrice = recentPrices[0];
  const lastPrice = recentPrices[recentPrices.length - 1];

  const percentageChange =
    firstPrice !== 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
  const actualPriceChange = lastPrice - firstPrice;

  return { percentageChange, actualPriceChange };
};
