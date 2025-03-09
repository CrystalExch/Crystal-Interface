export const generateMiniChartData = (
  trades: any[],
  market: any,
  timeframeHours: number = 24
): { time: number; price: number }[] => {
  if (!trades || trades.length === 0 || !market) {
    return [];
  }
  
  const now = Date.now();
  const cutoffTime = now - timeframeHours * 60 * 60 * 1000;
  
  const filteredTrades = trades.filter(
    (trade) => trade[6] * 1000 > cutoffTime
  );
  
  if (filteredTrades.length === 0) {
    return [];
  }
  
  const priceFactor = Number(market.priceFactor) || 1;
  
  const chartData = filteredTrades.map((trade) => ({
    time: trade[6] * 1000,
    price: trade[3] / priceFactor,
  }));
  
  return chartData;
};

export const calculatePriceChange = (
  chartData: { time: number; price: number }[]
): { priceIncreased: boolean; percentChange: number } => {
  if (!chartData || chartData.length < 2) {
    return {
      priceIncreased: true,
      percentChange: 0,
    };
  }
  
  const firstPrice = chartData[0].price;
  const lastPrice = chartData[chartData.length - 1].price;
  const priceIncreased = lastPrice >= firstPrice;
  const percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  return {
    priceIncreased,
    percentChange,
  };
};

export const getMarketKey = (baseAsset: string, quoteAsset: string): string => {
  return `${baseAsset}${quoteAsset}`;
};