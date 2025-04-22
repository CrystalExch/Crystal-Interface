import { getBlockNumber, readContract } from '@wagmi/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { config } from '../../../wagmi.ts';

import PortfolioCache from './portfolioCache';

import { PortfolioData } from './types';

import { CrystalDataHelperAbi } from '../../../abis/CrystalDataHelperAbi';
import { settings } from '../../../settings.ts';
import normalizeTicker from '../../../utils/normalizeTicker';

export const usePortfolioData = (
  address: string | undefined,
  tokenList: TokenType[],
  chartDays: number,
  tokenBalances: any,
  setTotalAccountValue: any,
  marketsData: any,
): PortfolioData => {
  const [state, setState] = useState<PortfolioData>({
    chartData: [],
    balanceResults: {},
    portChartLoading: false,
  });
  const cache = PortfolioCache.getInstance();
  let isFetching = false;

  const marketDataMap = useMemo(() => {
    const map: Record<string, any> = {};
    marketsData.forEach((market: Market) => {
      if (market) {
        const key = `${market.baseAsset}${market.quoteAsset}`;
        map[key] = market;
      }
    });
    return map;
  }, [marketsData]);

  const generateDateRange = useCallback(() => {
    const startDate = new Date();
    const stepHours =
      chartDays === 1 ? 1 : chartDays === 7 ? 3 : chartDays === 14 ? 6 : 24;
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

  const calculateChartData = useCallback(
    (balanceResults: Record<string, any>) => {
      const dateRange = generateDateRange();
      const chartData = dateRange.map((date) => ({ time: date, value: 0 }));
      const lastKnownPrice: Record<string, number> = {};
      const ethTicker = settings.chainConfig[activechain].ethticker;
      const ethMarket = marketDataMap[`${ethTicker}USDC`];
      let lastBalances = Object.values(balanceResults)[0]?.balances;
      dateRange.forEach((date, idx) => {
        const dailyBalances = balanceResults[date]?.balances || lastBalances || {};
        
        Object.entries(dailyBalances).forEach(([ticker, bal]) => {
          const tokenBalance = bal as number;
          const normalized = normalizeTicker(ticker, activechain);

          let price = lastKnownPrice[normalized] || 0;
          const usdcMkt = marketDataMap[`${normalized}USDC`];
          if (usdcMkt?.series?.length > idx) {
            price = usdcMkt.series[idx].close / Number(usdcMkt.priceFactor);
          } else if (normalized === 'USDC') {
            price = 1;
          } else {
            const tokenEth = marketDataMap[`${normalized}${ethTicker}`];
            if (
              tokenEth?.series?.length > idx &&
              ethMarket?.series?.length > idx
            ) {
              price = tokenEth.series[idx].close / Number(tokenEth.priceFactor) * ethMarket.series[idx].close / Number(ethMarket.priceFactor);
            }
          }
          lastKnownPrice[normalized] = price;
          chartData[idx].value += tokenBalance * price;
        })
        lastBalances = dailyBalances
      });

      return chartData;
    },
    [chartDays, markets, marketDataMap],
  );

  useEffect(() => {
    let totalValue = 0;
    const ethTicker = settings.chainConfig[activechain].ethticker;
    const ethMarket = marketDataMap[`${ethTicker}USDC`];

    tokenList.forEach((token) => {
      const bal = Number(tokenBalances[token.address]) / 10 ** Number(token.decimals) || 0;
      const normalized = normalizeTicker(token.ticker, activechain);
      let price = 0;
      const usdcMkt = marketDataMap[`${normalized}USDC`];

      if (usdcMkt?.series?.length) {
        price = usdcMkt.series[usdcMkt.series.length - 1].close / Number(usdcMkt.priceFactor);
      } else if (normalized === 'USDC') {
        price = 1;
      } else {
        const tokenEth = marketDataMap[`${normalized}${ethTicker}`];
        if (
          tokenEth?.series?.length &&
          ethMarket?.series?.length
        ) {
          price = tokenEth.series[tokenEth.series.length - 1].close / Number(tokenEth.priceFactor) * ethMarket.series[ethMarket.series.length - 1].close / Number(ethMarket.priceFactor);
        }
      }

      totalValue += bal * price;
    });

    setTotalAccountValue(totalValue);
  }, [tokenList, tokenBalances, marketsData]);

  useEffect(() => {
    const fetchData = async () => {
      if (!address) {
        setState((prev) => ({
          ...prev,
          portChartLoading: false,
          chartData: [],
        }));
        return;
      }

      if (marketsData.length === 0) {
        setState(prev => ({ ...prev, portChartLoading: true }));
        return;
      }

      const cacheKey = cache.getCacheKey(activechain, address, chartDays);
      const cachedData = cache.get(cacheKey);
      if (cachedData && Date.now() - cachedData.timestamp < 1000) {
        setState({
          chartData: cachedData.chartData,
          balanceResults: cachedData.balanceResults,
          portChartLoading: false,
        });
        return;
      }
      setState((prev) => ({ ...prev, portChartLoading: true }));
      try {
        if (marketsData.length > 0) {
          isFetching = true;
          const balanceResults = await (async () => {
            if (!address) return {};
        
            try {
              const startblock = await getBlockNumber(config);
              const dateRange = generateDateRange();
              const results: Record<string, any> = {};
              const simplifiedTokenList = tokenList.map((token) => ({
                ticker: token.ticker,
                address: token.address,
                decimals: token.decimals,
              }));
        
              const batchSize = 1;
              for (let i = 0; i < dateRange.length; i += batchSize) {
                if (!isFetching) return;
                const batch = dateRange.slice(i, i + batchSize);
                const batchResults = await Promise.all(
                  batch.map(async (dateStr) => {
                    const [datePart, hourPart] = dateStr.split(' ');
                    const currentDate = new Date(`${datePart}T${hourPart}:00:00Z`);
                    const targetTimestamp = Math.floor(currentDate.getTime() / 1000);
                    const startTimestamp = Math.floor(new Date().getTime() / 1000);
                    const blockNumber = BigInt(
                      Math.round(
                        Number(startblock) -
                          (startTimestamp - targetTimestamp) *
                            (1 / settings.chainConfig[activechain].blocktime) -
                          10,
                      ),
                    );
        
                    try {
                      const balancesdata = await readContract(config, {
                        blockNumber,
                        abi: CrystalDataHelperAbi,
                        address: settings.chainConfig[activechain].balancegetter,
                        functionName: 'batchBalanceOf',
                        args: [
                          address as `0x${string}`,
                          simplifiedTokenList.map(
                            (token) => token.address as `0x${string}`,
                          ),
                        ],
                      });
        
                      const balances: Record<string, number> = {};
                      for (const [index, balance] of balancesdata.entries()) {
                        const token = simplifiedTokenList[index];
                        if (token) {
                          balances[token.ticker] = formatBalance(
                            BigInt(balance),
                            BigInt(token.decimals),
                          );
                        }
                      }
        
                      return { date: dateStr, balances };
                    } catch (error) {
                      return null;
                    }
                  }),
                );
                batchResults.forEach((response) => {
                  if (response) {
                    results[response.date] = response;
                  }
                });
        
                if (i + batchSize < dateRange.length) {
                  await new Promise((resolve) => setTimeout(resolve, 100));
                }
              }
        
              return results;
            } catch (error) {
              return;
            }
          })()
          isFetching = false
          if (balanceResults) {
            const chartData = calculateChartData(balanceResults);
            cache.set(cacheKey, chartData, balanceResults, chartDays);
  
            setState({
              chartData,
              balanceResults,
              portChartLoading: false,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
        setState((prev) => ({ ...prev, portChartLoading: false }));
      }
    };
    fetchData();

    return () => { isFetching = false; };
  }, [address, chartDays, marketsData.length]);

  return state;
};

function formatBalance(balance: bigint, decimals: bigint): number {
  const divisor = 10n ** decimals;
  const formatted = Number(balance) / Number(divisor);
  return formatted;
}