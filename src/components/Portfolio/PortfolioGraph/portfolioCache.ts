import { CacheEntry, ScaledDataPoint } from './types';

export class PortfolioCache {
  private static instance: PortfolioCache;
  private cache: Map<string, CacheEntry>;
  private readonly CACHE_DURATION = 3 * 60 * 1000; 

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): PortfolioCache {
    if (!PortfolioCache.instance) {
      PortfolioCache.instance = new PortfolioCache();
    }
    return PortfolioCache.instance;
  }

  getCacheKey(chain: number, address: string, days: number): string {
    return `${chain}-${address}-${days}`;
  }

  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return undefined;
    }

    return entry;
  }

  set(
    key: string,
    data: ScaledDataPoint[],
    balanceResults: Record<string, any>,
    chartDays: number,
  ): void {
    // Only store in cache if we have valid data points
    const hasValidData = data.some(point => point.value > 0);
    if (hasValidData) {
      this.cache.set(key, {
        data,
        balanceResults,
        timestamp: Date.now(),
        chartDays,
      });
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export default PortfolioCache;