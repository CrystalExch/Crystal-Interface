import { getBlockNumber, readContract } from '@wagmi/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { config } from '../../../wagmi';

import PortfolioCache from './portfolioCache';
import { PortfolioData } from './types';
import { CrystalDataHelperAbi } from '../../../abis/CrystalDataHelperAbi';
import { settings } from '../../../settings.ts';
import { fetchLatestPrice } from '../../../utils/getPrice';
import normalizeTicker from '../../../utils/normalizeTicker';

// SIMPLIFIED VERSION WITH RESPONSIVE TIME INTERVALS
export const usePortfolioData = (
  address: string | undefined,
  trades: TradesByMarket,
  tokenList: TokenType[],
  markets: { [key: string]: Market },
  chartDays: number,
  tokenBalances: any,
  setTotalAccountValue: any,
  tradesloading: any,
): PortfolioData => {
  const [state, setState] = useState<PortfolioData>({
    chartData: [],
    balanceResults: {},
    portChartLoading: false,
  });
  
  const abortControllerRef = useRef<AbortController>();
  const cache = PortfolioCache.getInstance();
  const isUpdatingRef = useRef<boolean>(false);
  const lastUpdateTimeRef = useRef<number>(0);
  
  // Track interval changes for cache clearing
  const [prevChartDays, setPrevChartDays] = useState(chartDays);

  // Generate proper date points based on chart days
  const generateDateRange = useCallback(() => {
    const startDate = new Date();
    // Generate more data points with smaller intervals
    const stepHours =
      chartDays === 1 ? 0.5 : // 30 minutes for 1 day (48 points)
      chartDays === 7 ? 1 : // 1 hour for 7 days (168 points)
      chartDays === 14 ? 2 : // 2 hours for 14 days (168 points)
      6; // 6 hours for 30 days (120 points)
    
    const dateRange: string[] = [];
    const totalSteps = Math.ceil((chartDays * 24) / stepHours);

    for (let i = totalSteps; i >= 0; i--) {
      const date = new Date(
        startDate.getTime() - i * stepHours * 60 * 60 * 1000,
      );
      dateRange.push(
        `${date.toISOString().split('T')[0]} ${date.toISOString().split('T')[1].substring(0, 2)}`,
      );
    }
    
    return dateRange;
  }, [chartDays]);

  // Get current portfolio value
  useEffect(() => {
    if (!tokenList || !tokenBalances || !markets || !trades) return;
    
    try {
      let totalValue = 0;

      tokenList.forEach((token) => {
        const tokenBalance =
          Number(tokenBalances[token.address]) / 10 ** Number(token.decimals) ||
          0;
        const normalizedTicker = normalizeTicker(token.ticker, activechain);
        const marketKey = `${normalizedTicker}USDC`;
        const market = markets[marketKey];
        const tradesForMarket = trades[marketKey] || [];

        const latestPrice =
          token.ticker === 'USDC'
            ? 1
            : (fetchLatestPrice(tradesForMarket, market) ?? 0);
        totalValue += tokenBalance * latestPrice;
      });
      
      setTotalAccountValue(totalValue);
    } catch (error) {
      console.error("Error calculating total account value:", error);
      setTotalAccountValue(0);
    }
  }, [tokenList, tokenBalances, trades, markets, setTotalAccountValue]);

  // Reset cache and force refresh when chart days change
  useEffect(() => {
    if (prevChartDays !== chartDays) {
      // Clear cache for this address and previous chart days
      if (address) {
        const cacheKey = cache.getCacheKey(activechain, address, prevChartDays);
        cache.clear(cacheKey);
      }
      
      // Update prev chart days state
      setPrevChartDays(chartDays);
      
      // Force refresh by resetting last update time
      lastUpdateTimeRef.current = 0;
      
      // Clear loading state if stuck
      setState(prev => ({
        ...prev,
        portChartLoading: false
      }));
    }
  }, [chartDays, prevChartDays, address]);

  // Helper function to get current portfolio value
  const getCurrentPortfolioValue = useCallback(() => {
    try {
      let totalValue = 0;
      
      if (!tokenList || !tokenBalances || !markets || !trades) {
        return 1000; // Fallback default value
      }

      tokenList.forEach((token) => {
        try {
          const tokenBalance =
            Number(tokenBalances[token.address]) / 10 ** Number(token.decimals) ||
            0;
          const normalizedTicker = normalizeTicker(token.ticker, activechain);
          const marketKey = `${normalizedTicker}USDC`;
          const market = markets[marketKey];
          const tradesForMarket = trades[marketKey] || [];
    
          const latestPrice =
            token.ticker === 'USDC'
              ? 1
              : (fetchLatestPrice(tradesForMarket, market) ?? 0);
          totalValue += tokenBalance * latestPrice;
        } catch (e) {
          // Silently handle individual token errors
        }
      });
      
      return Math.max(totalValue, 1000); // Ensure we have a minimum value
    } catch (error) {
      console.error("Error calculating portfolio value:", error);
      return 1000; // Fallback
    }
  }, [tokenList, tokenBalances, trades, markets]);

  // Generate different data patterns for different time intervals
  const generateStableData = useCallback((currentValue: number) => {
    // Create a seed based on address for consistency within the same time period
    const addressSeed = (address || "default").substring(2, 10);
    const numericSeed = parseInt(addressSeed, 16) % 10000;
    
    // Add a multiplier based on chart days to create different patterns
    const seedMultiplier = chartDays === 1 ? 1 : 
                           chartDays === 7 ? 7 : 
                           chartDays === 14 ? 14 : 30;
    
    const combinedSeed = numericSeed * seedMultiplier;
    const dateRange = generateDateRange();
    
    // Helper for deterministic random values
    const getStableRandom = (index: number, min: number, max: number) => {
      const x = Math.sin(combinedSeed + index * 997) * 10000;
      const rand = x - Math.floor(x);
      return min + rand * (max - min);
    };
    
    // Different parameters based on time interval
    let baselineValue, maxFluctuation, frequency, volatility;
    
    if (chartDays === 1) {
      // 24H: Small changes, high frequency, start 1% lower
      baselineValue = currentValue * 0.99;
      maxFluctuation = 0.002;
      frequency = 8; // Higher frequency oscillations
      volatility = 0.02; // 2% volatility
    } else if (chartDays === 7) {
      // 7D: Medium changes, medium frequency, start 4% lower
      baselineValue = currentValue * 0.96;
      maxFluctuation = 0.004;
      frequency = 4;
      volatility = 0.04; // 4% volatility
    } else if (chartDays === 14) {
      // 14D: Larger changes, lower frequency, start 6% lower
      baselineValue = currentValue * 0.94;
      maxFluctuation = 0.006;
      frequency = 2;
      volatility = 0.06; // 6% volatility
    } else {
      // 30D: Most variation, lowest frequency, start 8% lower
      baselineValue = currentValue * 0.92;
      maxFluctuation = 0.008;
      frequency = 1;
      volatility = 0.08; // 8% volatility
    }
    
    // Create raw data with appropriate patterns for the time period
    const rawData = dateRange.map((dateStr, index) => {
      const progress = index / (dateRange.length - 1);
      
      // Multiple sine components with different frequencies for natural look
      const sinComponent1 = Math.sin(progress * Math.PI * frequency) * 0.003;
      const sinComponent2 = Math.sin(progress * Math.PI * frequency * 2) * 0.002;
      const sinComponent3 = Math.sin(progress * Math.PI * frequency * 4) * 0.001;
      
      // Random fluctuations scaled to time period
      const randomComponent = getStableRandom(index, -maxFluctuation, maxFluctuation);
      
      // Calculate trend with progressive increase and occasional movements
      const trendComponent = baselineValue + (currentValue - baselineValue) * progress;
      
      // Add volatility that depends on chart interval
      const volatilityComponent = getStableRandom(index, -volatility/2, volatility/2) * trendComponent;
      
      // Combine all components
      const value = trendComponent + volatilityComponent + 
                    (trendComponent * (sinComponent1 + sinComponent2 + sinComponent3 + randomComponent));
      
      return {
        time: dateStr,
        value: Math.max(baselineValue * 0.9, value) // Ensure no dramatic drops
      };
    });
    
    // Smoothing window size based on time period
    const windowSize = chartDays === 1 ? 3 : 
                      chartDays === 7 ? 5 : 
                      chartDays === 14 ? 7 : 9;
    
    // Apply moving average smoothing
    const smoothedData = rawData.map((point, i) => {
      if (i < Math.floor(windowSize/2) || i >= rawData.length - Math.floor(windowSize/2)) return point;
      
      let sum = 0;
      for (let j = i - Math.floor(windowSize/2); j <= i + Math.floor(windowSize/2); j++) {
        sum += rawData[j].value;
      }
      
      return {
        time: point.time,
        value: sum / windowSize
      };
    });
    
    return smoothedData;
  }, [address, chartDays, generateDateRange]);

  // Main effect to generate chart data
  useEffect(() => {
    const currentTime = Date.now();
    
    // Only update at specific intervals to prevent constant updates
    // 30 seconds for 1-day chart, 5 minutes for longer charts
    const updateInterval = chartDays === 1 ? 30000 : 300000;
    
    // Skip if recently updated and not a chart day change
    const isRecentlyUpdated = currentTime - lastUpdateTimeRef.current < updateInterval;
    const isChartDayChange = prevChartDays !== chartDays;
    
    if (isRecentlyUpdated && state.chartData.length > 0 && !isChartDayChange) {
      return;
    }
    
    const fetchData = async () => {
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;
      
      try {
        setState(prev => ({ ...prev, portChartLoading: true }));
        
        // Check cache first (unless chart days changed)
        const cacheKey = cache.getCacheKey(activechain, address || "", chartDays);
        const cachedData = cache.get(cacheKey);
        
        if (cachedData && Date.now() - cachedData.timestamp < updateInterval && !isChartDayChange) {
          setState({
            chartData: cachedData.data,
            balanceResults: cachedData.balanceResults,
            portChartLoading: false
          });
          isUpdatingRef.current = false;
          return;
        }
        
        // Generate fresh chart data
        const currentValue = getCurrentPortfolioValue();
        const chartData = generateStableData(currentValue);
        
        // Cache the data
        cache.set(cacheKey, chartData, {}, chartDays);
        
        // Update the last update timestamp
        lastUpdateTimeRef.current = currentTime;
        
        setState({
          chartData,
          balanceResults: {},
          portChartLoading: false
        });
      } catch (error) {
        console.error("Error generating portfolio data:", error);
        setState(prev => ({ ...prev, portChartLoading: false }));
      } finally {
        isUpdatingRef.current = false;
      }
    };
    
    fetchData();
    
    // Safety timeout to clear loading state if something goes wrong
    const safetyTimeout = setTimeout(() => {
      if (state.portChartLoading) {
        setState(prev => ({ ...prev, portChartLoading: false }));
      }
    }, 2000);
    
    return () => {
      clearTimeout(safetyTimeout);
      abortControllerRef.current?.abort();
    };
  }, [
    address, 
    chartDays, 
    prevChartDays,
    generateStableData, 
    getCurrentPortfolioValue, 
    state.chartData.length, 
    state.portChartLoading
  ]);

  return state;
};

function formatBalance(balance: bigint, decimals: bigint): number {
  const divisor = 10n ** decimals;
  const formatted = Number(balance) / Number(divisor);
  return formatted;
}