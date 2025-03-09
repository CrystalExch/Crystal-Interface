export interface ScaledDataPoint {
  time: string;
  value: number;
}

export interface CacheEntry {
  data: ScaledDataPoint[];
  balanceResults: Record<string, any>;
  timestamp: number;
  chartDays: number;
}

export interface PortfolioData {
  chartData: ScaledDataPoint[];
  balanceResults: Record<string, any>;
  portChartLoading: boolean;
}
