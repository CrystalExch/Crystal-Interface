import { DataPoint, INTERVALS_IN_MS } from './chartDataGenerator';

export const generateEmptyChartData = (interval: string): DataPoint[] => {
  const intervalsToShow = 24;
  const intervalMs = INTERVALS_IN_MS[interval];
  const now = Date.now();
  const startTime = now - intervalMs * intervalsToShow;

  const dataPoints: DataPoint[] = [];

  for (let i = 0; i < intervalsToShow; i++) {
    const intervalStart = startTime + i * intervalMs;

    dataPoints.push({
      time: intervalStart,
      open: 0,
      high: 0,
      low: 0,
      close: 0,
      volume: 0,
    });
  }
  return dataPoints;
};
