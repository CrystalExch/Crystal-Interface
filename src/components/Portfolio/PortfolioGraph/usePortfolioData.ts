import { getBlockNumber, readContract } from '@wagmi/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { config } from '../../../wagmi.ts';

import PortfolioCache from './portfolioCache';

import { PortfolioData } from './types';

import { CrystalDataHelperAbi } from '../../../abis/CrystalDataHelperAbi';
import { settings } from '../../../settings.ts';
import { fetchLatestPrice } from '../../../utils/getPrice';
import normalizeTicker from '../../../utils/normalizeTicker';

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

  const fetchBalances = useCallback(async () => {
    if (!address) return {};

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

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
        if (signal.aborted) throw new Error('Operation cancelled');

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
      if (error instanceof Error && error.message === 'Operation cancelled') {
        return {};
      }
      throw error;
    }
  }, [address, tokenList, chartDays]);

  const calculateChartData = useCallback(
    (balanceResults: Record<string, any>) => {
        const dateRange = generateDateRange();
        let chartData = dateRange.map((date) => ({
          time: date,
          value: 0,
        }));
          const lastKnownPrice: Record<string, number> = {};

          dateRange.forEach((date) => {
            const dailyBalances = balanceResults[date]?.balances || {};

            Object.keys(dailyBalances).forEach((ticker) => {
              const tokenBalance = dailyBalances[ticker] || 0;
              const normalizedTicker = normalizeTicker(ticker, activechain);
              const tradeTicker = `${normalizedTicker}USDC`;

              const marketTrades = trades[tradeTicker] || [];
              const filteredTrades = marketTrades.filter((trade) => {
                const tradeDate = new Date(trade[6] * 1000)
                  .toISOString()
                  .split('T')[0];
                return tradeDate === date;
              });

              let priceForDay =
                normalizedTicker == 'USDC'
                  ? 1
                  : (fetchLatestPrice(filteredTrades, markets[tradeTicker]) ?? 0);
              if (!priceForDay || priceForDay === 0) {
                priceForDay =
                  lastKnownPrice[ticker] ||
                  fetchLatestPrice(marketTrades, markets[tradeTicker]) ||
                  0;
              }

              lastKnownPrice[ticker] = priceForDay;

              const index = chartData.findIndex((d) => d.time === date);
              if (index !== -1) {
                chartData[index].value += tokenBalance * priceForDay;
              }
            });
          });
        return chartData;
    },
    [chartDays, trades, markets],
  );

  useEffect(() => {
    let totalValue = 0;

    tokenList.forEach((token) => {
      const tokenBalance =
        Number(tokenBalances[token.address]) / 10 ** Number(token.decimals) ||
        0;
      let latestPrice
      const normalizedTicker = normalizeTicker(token.ticker, activechain);
      const marketKeyUSDC = `${normalizedTicker}USDC`;
      if (markets[marketKeyUSDC]) {
        const marketTrades = trades[marketKeyUSDC] || [];
        latestPrice = fetchLatestPrice(marketTrades, markets[marketKeyUSDC]) || 0;
      }
      else {
        const quotePrice = trades[settings.chainConfig[activechain].ethticker + 'USDC']?.[0]?.[3]
        / Number(markets[settings.chainConfig[activechain].ethticker + 'USDC']?.priceFactor)
        const marketTrades = trades[`${normalizedTicker}${settings.chainConfig[activechain].ethticker}`] || [];
        latestPrice = (fetchLatestPrice(marketTrades, markets[`${normalizedTicker}${settings.chainConfig[activechain].ethticker}`]) || 0) * quotePrice;
      }
      totalValue += tokenBalance * latestPrice;
    });
    setTotalAccountValue(totalValue);
  }, [tokenList, tokenBalances, trades, markets]);

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

      const cacheKey = cache.getCacheKey(activechain, address, chartDays);
      const cachedData = cache.get(cacheKey);

      if (cachedData && Date.now() - cachedData.timestamp < 600000) {
        setState({
          chartData: cachedData.data,
          balanceResults: cachedData.balanceResults,
          portChartLoading: false,
        });
        return;
      }

      setState((prev) => ({ ...prev, portChartLoading: true }));

      try {
        if (Object.keys(trades).length > 0 && tradesloading == false) {
          const balanceResults = await fetchBalances();
          const chartData = calculateChartData(balanceResults);
          cache.set(cacheKey, chartData, balanceResults, chartDays);

          setState({
            chartData,
            balanceResults,
            portChartLoading: false,
          });
        }
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
        setState((prev) => ({ ...prev, portChartLoading: false }));
      }
    };

    fetchData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [address, chartDays, Object.keys(trades).length > 0, tradesloading]);

  return state;
};

function formatBalance(balance: bigint, decimals: bigint): number {
  const divisor = 10n ** decimals;
  const formatted = Number(balance) / Number(divisor);
  return formatted;
}