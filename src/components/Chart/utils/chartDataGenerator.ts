export type DataPoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export const INTERVALS_IN_MS: { [key: string]: number } = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
};

export function generateChartDataFromTrades(
  trades: any[],
  interval: string,
  market: any,
): DataPoint[] {
  const intervalMs = INTERVALS_IN_MS[interval];
  if (!intervalMs) {
    throw new Error(`Unsupported interval: ${interval}`);
  }

  const now = Date.now();
  const endTime = Math.floor(now / intervalMs) * intervalMs + intervalMs;

  const intervalsToShow = 5000;
  const startTime = endTime - intervalMs * intervalsToShow;

  const sortedTrades = [...trades].sort((a, b) => a[6] - b[6]);

  let tradesIndex = 0;
  let previousClose = 0;

  const dataPoints: DataPoint[] = [];

  for (let i = 0; i < intervalsToShow; i++) {
    const intervalStart = startTime + i * intervalMs;
    const intervalEnd = intervalStart + intervalMs;

    const intervalTrades: any[] = [];
    while (
      tradesIndex < sortedTrades.length &&
      sortedTrades[tradesIndex][6] * 1000 <= intervalEnd
    ) {
      intervalTrades.push(sortedTrades[tradesIndex]);
      tradesIndex++;
    }

    if (intervalTrades.length > 0) {
      let open: number | null = null;
      let high: number | null = null;
      let low: number | null = null;
      let close: number | null = null;
      let candleVolume = 0;

      for (const trade of intervalTrades) {
        const price = computePrice(trade, market);
        const quoteDecimals = Number(market.quoteDecimals);

        const tradeVolume =
          (trade[2] === 1 ? trade[0] : trade[1]) / 10 ** quoteDecimals;

        candleVolume += tradeVolume;

        if (open === null) {
          open = price;
          high = price;
          low = price;
          close = price;
        } else {
          high = high != null ? Math.max(high, price) : price;
          low = low != null ? Math.min(low, price) : price;
          close = price;
        }
      }

      previousClose = close!;

      dataPoints.push({
        time: intervalStart,
        open: open!,
        high: high!,
        low: low!,
        close: close!,
        volume: candleVolume,
      });
    } else {
      dataPoints.push({
        time: intervalStart,
        open: previousClose,
        high: previousClose,
        low: previousClose,
        close: previousClose,
        volume: 0,
      });
    }
  }

  return dataPoints;
}

const computePrice = (trade: any, market: any): number => {
  const priceFactor = Number(market.priceFactor);

  const price = (trade[3] / priceFactor || 0).toFixed(Math.floor(Math.log10(priceFactor)));

  return parseFloat(price);
};
