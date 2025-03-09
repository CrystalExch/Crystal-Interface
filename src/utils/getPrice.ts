export function fetchLatestPrice(trades: any[], market: any): number | null {
  if (!trades || trades.length === 0) {
    return null;
  }

  const sortedTrades = [...trades].sort((a, b) => b[6] - a[6]);

  const latestTrade = sortedTrades[0];

  return computePrice(latestTrade, market);
}

export const computePrice = (trade: any, market: any): number => {
  const priceFactor = Number(market.priceFactor);

  const price = (trade[3] / priceFactor || 0).toFixed(Math.log10(priceFactor));

  return parseFloat(price);
};

export function get24hPriceChange(trades: any[], market: any): number | null {
  if (trades.length === 0) {
    return null;
  }

  const now = Date.now() / 1000;
  const oneDayAgo = now - 24 * 60 * 60;

  const tradesBefore24h = trades.filter((trade) => trade[6] < oneDayAgo);
  const tradesAfter24h = trades.filter((trade) => trade[6] >= oneDayAgo);

  if (tradesBefore24h.length === 0 || tradesAfter24h.length === 0) {
    return null;
  }

  const lastTradeBefore24h = tradesBefore24h.sort((a, b) => b[6] - a[6])[0];
  const price24hAgo = computePrice(lastTradeBefore24h, market);

  const latestPrice = fetchLatestPrice(trades, market);

  if (latestPrice === null) {
    return null;
  }

  const priceChangePercentage =
    ((latestPrice - price24hAgo) / price24hAgo) * 100;

  return priceChangePercentage;
}
