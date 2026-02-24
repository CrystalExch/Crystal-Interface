import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { formatCommas } from '../../utils/numberDisplayFormat';
import OrderBook from '../Orderbook/Orderbook';
import './Predict.css';

// Color palette for outcome lines
const OUTCOME_COLORS = [
  '#3B82F6', // blue
  '#F59E0B', // orange
  '#10B981', // green
  '#EC4899', // pink
  '#8B5CF6', // purple
  '#EF4444', // red
  '#06B6D4', // cyan
  '#84CC16', // lime
];
const DEFAULT_TICK_SIZE = 0.01;
const SERIES_REFRESH_MS = 5 * 60 * 1000;

interface PredictProps {
  layoutSettings?: string;
  orderbookPosition?: string;
  windowWidth: number;
  mobileView: string;
  isOrderbookVisible?: boolean;
  orderbookWidth?: number;
  setOrderbookWidth?: any;
  viewMode?: 'both' | 'buy' | 'sell';
  setViewMode?: any;
  activeTab?: 'orderbook' | 'trades';
  setActiveTab?: any;
  predictActiveMarketKey: string;
  setPredictActiveMarketKey: (key: string) => void;
  predictMarketsData: Record<string, any>;
  setPredictMarketsData: (data: any) => void;
  address?: string;
  router?: any;
  orderCenterHeight?: number;
  setSendTokenIn?: any;
  refetch?: () => void;
  setpopup?: (value: number) => void;
  sortConfig?: any;
  onSort?: (config: any) => void;
  activeSection?: 'balances' | 'orders' | 'tradeHistory' | 'orderHistory';
  setActiveSection?: any;
  filter?: 'all' | 'buy' | 'sell';
  setFilter?: any;
  onlyThisMarket?: boolean;
  setOnlyThisMarket?: any;
  sendUserOperationAsync?: any;
  setChain?: any;
  isOrderCenterVisible?: boolean;
  openEditOrderPopup?: (order: any) => void;
  openEditOrderSizePopup?: (order: any) => void;
  wethticker?: any;
  ethticker?: any;
  memoizedSortConfig?: any;
  emptyFunction?: any;
  handleSetChain?: any;
  selectedInterval?: string;
  setSelectedInterval?: any;
  predictFilterOptions?: any;
  setPredictFilterOptions?: any;
  signMessageAsync?: any;
  leverage?: string;
  setLeverage?: (value: string) => void;
  signer?: any;
  setSigner?: any;
  setOrderCenterHeight?: (height: number) => void;
  isMarksVisible?: any;
  setIsMarksVisible?: any;
  setPerpsLimitChase?: any;
  perpsLimitChase?: any;
  handlePerpsMarketSelect?: any;
  scaAddress?: string;
  setTempLeverage?: any;
}

interface OutcomeData {
  name: string;
  probability: number;
  volume: number;
  yesPrice: number;
  noPrice: number;
  color: string;
}

type IntervalType = '1H' | '24H' | '7D' | '30D' | 'ALL';
type ChartPoint = { time: number; value: number };

const toEpochSeconds = (value: any): number | null => {
  if (value == null) return null;
  const numeric = Number(value);
  let parsed = Number.isFinite(numeric) ? numeric : Date.parse(String(value));
  if (!Number.isFinite(parsed)) return null;
  if (parsed > 1e12) parsed /= 1000;
  return Math.floor(parsed);
};

const toProbabilityPercent = (value: any): number | null => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  let normalized = numeric;
  if (normalized <= 1.000001) normalized *= 100;
  else if (normalized > 100 && normalized <= 10000) normalized /= 100;
  return Math.max(0, Math.min(100, normalized));
};

const toProbabilityUnit = (value: any): number => {
  const percent = toProbabilityPercent(value);
  if (percent == null) return 0;
  return Math.max(0, Math.min(1, percent / 100));
};

const normalizeSeriesHistory = (value: any): ChartPoint[] => {
  const zipSeriesArrays = (times: any[], probs: any[]): ChartPoint[] => {
    const size = Math.min(times.length, probs.length);
    if (!size) return [];
    const points: ChartPoint[] = [];
    for (let i = 0; i < size; i += 1) {
      const time = toEpochSeconds(times[i]);
      const prob = toProbabilityPercent(probs[i]);
      if (time == null || prob == null) continue;
      points.push({ time, value: prob });
    }
    return points;
  };

  const rawPoints = Array.isArray(value)
    ? value
    : Array.isArray(value?.history)
      ? value.history
      : Array.isArray(value?.history?.points)
        ? value.history.points
      : Array.isArray(value?.data)
        ? value.data
        : Array.isArray(value?.series)
          ? value.series
        : [];

  const deduped = new Map<number, number>();

  if (!rawPoints.length) {
    const container = value?.history && !Array.isArray(value.history)
      ? value.history
      : value?.data && !Array.isArray(value.data)
        ? value.data
        : value;

    const timeArr =
      (Array.isArray(container?.t) && container.t) ||
      (Array.isArray(container?.time) && container.time) ||
      (Array.isArray(container?.ts) && container.ts) ||
      (Array.isArray(container?.timestamps) && container.timestamps) ||
      (Array.isArray(container?.x) && container.x) ||
      [];
    const probArr =
      (Array.isArray(container?.p) && container.p) ||
      (Array.isArray(container?.price) && container.price) ||
      (Array.isArray(container?.prices) && container.prices) ||
      (Array.isArray(container?.value) && container.value) ||
      (Array.isArray(container?.values) && container.values) ||
      (Array.isArray(container?.y) && container.y) ||
      (Array.isArray(container?.probability) && container.probability) ||
      (Array.isArray(container?.probabilities) && container.probabilities) ||
      [];

    const zipped = zipSeriesArrays(timeArr, probArr);
    zipped.forEach((point) => deduped.set(point.time, point.value));
  } else {
    rawPoints.forEach((point: any) => {
      const time = toEpochSeconds(
        point?.t ??
        point?.time ??
        point?.timestamp ??
        point?.ts ??
        point?.x ??
        point?.date ??
        point?.[0],
      );
      const prob = toProbabilityPercent(
        point?.p ??
        point?.price ??
        point?.value ??
        point?.y ??
        point?.probability ??
        point?.close ??
        point?.[1],
      );
      if (time == null || prob == null) return;
      deduped.set(time, prob);
    });
  }

  if (!deduped.size) return [];

  return Array.from(deduped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([time, value]) => ({ time, value }));
};

const getIntervalStart = (interval: IntervalType, nowSec: number): number | null => {
  switch (interval) {
    case '1H':
      return nowSec - 60 * 60;
    case '24H':
      return nowSec - 24 * 60 * 60;
    case '7D':
      return nowSec - 7 * 24 * 60 * 60;
    case '30D':
      return nowSec - 30 * 24 * 60 * 60;
    default:
      return null;
  }
};

const filterSeriesByInterval = (points: ChartPoint[], interval: IntervalType): ChartPoint[] => {
  if (!points.length || interval === 'ALL') return points;
  const start = getIntervalStart(interval, Math.floor(Date.now() / 1000));
  if (start == null) return points;
  const filtered = points.filter((point) => point.time >= start);
  if (filtered.length >= 2) return filtered;
  return points.slice(-Math.min(points.length, 200));
};

const getOutcomeLabel = (market: any, index: number): string => {
  const label =
    market?.groupItemTitle ??
    market?.shortTitle ??
    market?.title ??
    market?.name ??
    market?.question;
  if (label) return String(label);
  return `Outcome ${index + 1}`;
};

const getSeriesRange = (points: ChartPoint[]): number => {
  if (points.length < 2) return 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  points.forEach((point) => {
    if (point.value < min) min = point.value;
    if (point.value > max) max = point.value;
  });
  if (!Number.isFinite(min) || !Number.isFinite(max)) return 0;
  return max - min;
};

const Predict: React.FC<PredictProps> = ({
  layoutSettings,
  orderbookPosition,
  viewMode,
  setViewMode,
  activeTab,
  setActiveTab,
  windowWidth,
  mobileView,
  predictActiveMarketKey,
  setPredictActiveMarketKey,
  predictMarketsData,
  setPredictMarketsData,
  address,
  setpopup,
}) => {
  const { marketSlug } = useParams<{ marketSlug?: string }>();
  const activeRequestRef = useRef<AbortController | null>(null);
  const selectedOutcomeRef = useRef<string | null>(null);
  const seriesCacheRef = useRef<Map<string, { fetchedAt: number; history: ChartPoint[] }>>(new Map());

  // Chart state
  const [selectedInterval, setSelectedInterval] = useState<IntervalType>('ALL');
  const [chartData, setChartData] = useState<Record<string, ChartPoint[]>>({});

  // Order state
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<'Yes' | 'No'>('Yes');
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState<'Market' | 'Limit'>('Market');
  const [isOrderTypeDropdownOpen, setIsOrderTypeDropdownOpen] = useState(false);

  // Limit order state
  const [limitPrice, setLimitPrice] = useState(0);
  const [shares, setShares] = useState('');
  const [expirationEnabled, setExpirationEnabled] = useState(false);

  // Table state
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' }>({
    column: 'probability',
    direction: 'desc'
  });
  const [activityTab, setActivityTab] = useState<'all' | 'openOrders'>('all');
  const [obInterval, setOBInterval] = useState<number>(DEFAULT_TICK_SIZE);
  const [amountsQuote, setAmountsQuote] = useState<string>(() => {
    const stored = localStorage.getItem('predict_ob_amounts_quote');
    return stored === 'Quote' || stored === 'Base' ? stored : 'Quote';
  });
  const [localViewMode, setLocalViewMode] = useState<'both' | 'buy' | 'sell'>('both');
  const [localActiveTab, setLocalActiveTab] = useState<'orderbook' | 'trades'>('orderbook');

  // Chart refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());
  const chartYRangeRef = useRef<{ min: number; max: number } | null>(null);

  // Get current market data
  const activeMarket = predictMarketsData[predictActiveMarketKey] || {};
  const effectiveViewMode = viewMode ?? localViewMode;
  const handleViewMode = setViewMode ?? setLocalViewMode;
  const effectiveActiveTab = activeTab ?? localActiveTab;
  const handleActiveTab = setActiveTab ?? setLocalActiveTab;
  const effectiveOrderbookPosition = orderbookPosition ?? 'right';

  useEffect(() => {
    selectedOutcomeRef.current = selectedOutcome;
  }, [selectedOutcome]);

  // Fetch market data when marketSlug changes
  useEffect(() => {
    if (marketSlug) {
      setChartData({});
      const fetchPolymarketJson = async (path: string, signal: AbortSignal) => {
        const response = await fetch(path, { signal });
        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(`Polymarket request failed (${response.status}) for ${path}: ${body.slice(0, 200)}`);
        }
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(`Polymarket response not JSON for ${path}: ${text.slice(0, 200)}`);
        }
      };

      const parseClobTokenIds = (value: any): string[] => {
        if (Array.isArray(value)) {
          return value.filter(Boolean).map((item) => String(item));
        }
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              return parsed.filter(Boolean).map((item) => String(item));
            }
          } catch {
            return [];
          }
        }
        return [];
      };

      const getTokenIdsForMarket = (marketData: any): string[] => {
        const clobTokenIds = parseClobTokenIds(marketData?.clobTokenIds);
        if (clobTokenIds.length) return clobTokenIds;
        const tokens = Array.isArray(marketData?.tokens)
          ? marketData.tokens.map((token: any) => token?.token_id).filter(Boolean)
          : [];
        return tokens.map((item: any) => String(item));
      };

      const fetchOrderbooks = async (tokenIds: string[], signal: AbortSignal) => {
        if (!tokenIds.length) return {};
        try {
          const response = await fetch('/clob/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tokenIds.map((tokenId) => ({ token_id: tokenId }))),
            signal,
          });
          if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`Orderbook request failed (${response.status}): ${body.slice(0, 200)}`);
          }
          const books = await response.json().catch(() => []);
          if (!Array.isArray(books)) return {};
          return books.reduce((acc: Record<string, any>, book: any) => {
            if (book?.asset_id) {
              acc[String(book.asset_id)] = book;
            }
            return acc;
          }, {});
        } catch (error) {
          if ((error as Error).name === 'AbortError') return {};
          console.warn('Failed to fetch orderbooks:', error);
          return {};
        }
      };

      const getOrderbookPrice = (book: any, fallback: number) => {
        const bestAsk = book?.asks?.[0]?.price;
        const bestBid = book?.bids?.[0]?.price;
        const price = bestAsk ?? bestBid;
        const parsed = price != null ? Number(price) : fallback;
        return Number.isFinite(parsed) ? parsed : fallback;
      };

      const fetchEvent = async (signal: AbortSignal, includeChat: boolean) => {
        const includeChatParam = includeChat ? '&include_chat=true' : '';
        const slugParam = `slug=${encodeURIComponent(marketSlug)}${includeChatParam}`;
        try {
          const activeData = await fetchPolymarketJson(
            `/predictapi/events?active=true&closed=false&${slugParam}`,
            signal,
          );
          if (Array.isArray(activeData) && activeData.length > 0) {
            return activeData;
          }
        } catch {
          // Fall through to non-filtered lookup.
        }
        return fetchPolymarketJson(`/predictapi/events?${slugParam}`, signal);
      };

      const fetchSeriesHistory = async (seriesId: string, signal: AbortSignal) => {
        const cached = seriesCacheRef.current.get(seriesId);
        const now = Date.now();
        if (cached && now - cached.fetchedAt < SERIES_REFRESH_MS) {
          return cached.history;
        }
        const seriesResponse = await fetch(`/clob/series?id=${encodeURIComponent(seriesId)}`, { signal }).catch(() => null);
        const seriesData = seriesResponse ? await seriesResponse.json().catch(() => null) : null;
        const normalizedHistory = normalizeSeriesHistory(seriesData);
        if (normalizedHistory.length > 0) {
          seriesCacheRef.current.set(seriesId, {
            fetchedAt: now,
            history: normalizedHistory,
          });
          return normalizedHistory;
        }
        return [];
      };

      const fetchBestSeriesHistory = async (marketItem: any, signal: AbortSignal) => {
        const conditionKey = String(marketItem?.conditionId || marketItem?.condition_id || '').trim();
        const tokenKeys = getTokenIdsForMarket(marketItem);
        const candidateIds = Array.from(new Set([...tokenKeys, conditionKey].filter(Boolean)));
        if (!candidateIds.length) return [];

        const histories = await Promise.all(
          candidateIds.map((id) => fetchSeriesHistory(id, signal)),
        );
        const nonEmpty = histories.filter((history) => history.length > 1);
        if (!nonEmpty.length) return [];

        nonEmpty.sort((a, b) => {
          const rangeDelta = getSeriesRange(b) - getSeriesRange(a);
          if (Math.abs(rangeDelta) > 0.0001) return rangeDelta;
          return b.length - a.length;
        });
        return nonEmpty[0];
      };

      const fetchMarketData = async (options: { includeChat: boolean; includeSeries: boolean }) => {
        activeRequestRef.current?.abort();
        const controller = new AbortController();
        activeRequestRef.current = controller;

        try {
          const data = await fetchEvent(controller.signal, options.includeChat);

          if (data && data.length > 0) {
            const event = data[0];
            const markets = event.markets || [];

            if (markets.length > 0) {
              const market = markets[0];
              const conditionId = market.conditionId;
              const tokenID = market.tokenID || market.tokens?.[0]?.token_id;
              const isMultiOutcome = markets.length > 1;

              setPredictActiveMarketKey(conditionId);

              const outcomePrices = typeof market.outcomePrices === 'string'
                ? JSON.parse(market.outcomePrices)
                : market.outcomePrices || [];

              if (options.includeSeries) {
                const seriesEntries = await Promise.all(
                  markets.map(async (marketItem: any, index: number) => {
                    const history = await fetchBestSeriesHistory(marketItem, controller.signal);
                    if (history.length === 0) return null;
                    return {
                      index,
                      label: getOutcomeLabel(marketItem, index),
                      history,
                    };
                  }),
                );

                const chartPoints = seriesEntries
                  .filter(Boolean)
                  .reduce((acc: Record<string, ChartPoint[]>, item: any) => {
                    acc[item.label] = item.history;
                    acc[`__index_${item.index}`] = item.history;
                    return acc;
                  }, {});

                if (Object.keys(chartPoints).length > 0) {
                  const firstSeries = (seriesEntries.find(Boolean) as any)?.history;
                  if (firstSeries?.length) {
                    chartPoints.Primary = firstSeries;
                  }
                  setChartData(chartPoints);
                } else {
                  const fallbackSeries = await fetchSeriesHistory(conditionId, controller.signal);
                  if (fallbackSeries.length > 0) {
                    setChartData({ Primary: fallbackSeries });
                  }
                }
              }

              const baseOutcomePrices = isMultiOutcome
                ? markets.map((m: any) => {
                    const prices = typeof m.outcomePrices === 'string'
                      ? JSON.parse(m.outcomePrices)
                      : m.outcomePrices || [];
                    return toProbabilityUnit(prices[0] ?? 0);
                  })
                : outcomePrices.map((p: any) => toProbabilityUnit(p ?? 0));

              const orderbookTokenIdGroups: string[][] = isMultiOutcome
                ? markets.map((m: any) => getTokenIdsForMarket(m))
                : [getTokenIdsForMarket(market)];
              const orderbookFetchTokenIds = Array.from(
                new Set(orderbookTokenIdGroups.flat().filter(Boolean)),
              );

              const orderbooksByTokenId = await fetchOrderbooks(orderbookFetchTokenIds, controller.signal);
              const derivedOutcomePrices = baseOutcomePrices;

              const chatChannels = Array.isArray(event.series)
                ? event.series.flatMap((series: any) => series?.chats || [])
                : [];
              const openInterestValue = Number(event.openInterest ?? market.openInterest ?? 0);
              const holdersValue = market.holders ?? event.holders;

              const marketData = {
                contractId: conditionId,
                baseAsset: event.title || market.question,
                quoteAsset: 'USD',
                lastPrice: derivedOutcomePrices[0] || 0,
                value: market.volume || market.volume24hr || 0,
                liquidity: market.liquidity || 0,
                openInterest: Number.isFinite(openInterestValue) ? openInterestValue : 0,
                holders: holdersValue,
                commentCount: Number(event.commentCount ?? 0),
                chats: chatChannels,
                outcomes: isMultiOutcome
                  ? markets.map((m: any) => m.groupItemTitle || m.question)
                  : (typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes) || ['Yes', 'No'],
                outcomePrices: derivedOutcomePrices,
                eventTitle: event.title,
                eventSlug: event.slug,
                iconURL: event.image || event.icon,
                question: market.question,
                endDate: market.endDate,
                startDate: market.startDate || market.creationDate,
                enableDisplay: true,
                active: market.active,
                closed: market.closed ?? event.closed ?? false,
                tokenID: tokenID,
                orderbooks: orderbooksByTokenId,
                orderbookTokenIds: orderbookTokenIdGroups,
                markets: markets,
                volume24hr: market.volume24hr || 0,
                volumeNum: market.volumeNum || 0,
                description: market.description || event.description,
                tags: event.tags || [],
                source: 'polymarket',
              };

              setPredictMarketsData((prev: any) => ({
                ...prev,
                [conditionId]: marketData,
              }));

              if (marketData.outcomes?.length > 0 && !selectedOutcomeRef.current) {
                setSelectedOutcome(marketData.outcomes[0]);
              }
            }
          }
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            console.error('Error fetching market data:', error);
          }
        }
      };

      fetchMarketData({ includeChat: true, includeSeries: true });

      const refreshId = window.setInterval(() => {
        fetchMarketData({ includeChat: false, includeSeries: true });
      }, 60_000);
      return () => {
        window.clearInterval(refreshId);
        activeRequestRef.current?.abort();
      };
    }
    return undefined;
  }, [marketSlug, setPredictActiveMarketKey, setPredictMarketsData]);

  // Process outcomes data
  const outcomes: OutcomeData[] = useMemo(() => {
    const outcomeLabels = Array.isArray(activeMarket?.outcomes) ? activeMarket.outcomes : ['Yes', 'No'];
    const outcomePrices = Array.isArray(activeMarket?.outcomePrices) ? activeMarket.outcomePrices : [0.5, 0.5];
    const markets = activeMarket?.markets || [];

    const outcomeData = outcomeLabels.map((label: string, idx: number) => {
      const price = Number(outcomePrices[idx] ?? 0);
      const marketVolume = markets[idx]?.volume24hr || markets[idx]?.volume || 0;

      return {
        name: label,
        probability: price,
        volume: marketVolume || (activeMarket?.volume24hr || 0) / outcomeLabels.length,
        yesPrice: price,
        noPrice: 1 - price,
        color: OUTCOME_COLORS[idx % OUTCOME_COLORS.length],
      };
    });

    if (outcomeLabels.length > 2) {
      outcomeData.sort((a: OutcomeData, b: OutcomeData) => b.probability - a.probability);
    }

    return outcomeData;
  }, [activeMarket]);
  const chartOutcomes = useMemo(() => outcomes.slice(0, 4), [outcomes]);

  // Sort outcomes
  const sortedOutcomes = useMemo(() => {
    return [...outcomes].sort((a, b) => {
      const mult = sortConfig.direction === 'asc' ? 1 : -1;
      if (sortConfig.column === 'probability') {
        return (a.probability - b.probability) * mult;
      }
      return a.name.localeCompare(b.name) * mult;
    });
  }, [outcomes, sortConfig]);

  const leaderOutcomeName = useMemo(() => {
    if (!outcomes.length) return null;
    return outcomes.reduce((leader, current) => (
      current.probability > leader.probability ? current : leader
    )).name;
  }, [outcomes]);

  // Get selected outcome data
  const selectedOutcomeData = useMemo(() => {
    return outcomes.find(o => o.name === selectedOutcome);
  }, [outcomes, selectedOutcome]);

  useEffect(() => {
    localStorage.setItem('predict_ob_amounts_quote', amountsQuote);
  }, [amountsQuote]);

  const baseInterval = useMemo(() => {
    const market = activeMarket?.markets?.[0];
    const tickSizeRaw = market?.minimum_tick_size ?? market?.tickSize ?? market?.minTickSize;
    const tickSize = Number(tickSizeRaw ?? DEFAULT_TICK_SIZE);
    return Number.isFinite(tickSize) && tickSize > 0 ? tickSize : DEFAULT_TICK_SIZE;
  }, [activeMarket?.markets, activeMarket?.contractId]);

  useEffect(() => {
    setOBInterval(baseInterval);
  }, [baseInterval]);

  const orderbookInfo = useMemo(() => {
    const tokenGroups = activeMarket?.orderbookTokenIds;
    const outcomesList = Array.isArray(activeMarket?.outcomes) ? activeMarket.outcomes : [];
    const outcomeIndex = outcomesList.indexOf(selectedOutcome ?? '');
    const safeOutcomeIndex = outcomeIndex >= 0 ? outcomeIndex : 0;
    const isMultiOutcome = Array.isArray(activeMarket?.markets) && activeMarket.markets.length > 1;
    if (!Array.isArray(tokenGroups) || tokenGroups.length === 0) {
      return { book: null, tokenId: null };
    }

    const tokenSet = isMultiOutcome ? tokenGroups[safeOutcomeIndex] : tokenGroups[0];
    const yesTokenId = tokenSet?.[0];
    const noTokenId = tokenSet?.[1];
    const tokenId = isMultiOutcome
      ? (selectedSide === 'No' ? noTokenId : yesTokenId)
      : (outcomeIndex === 1 ? noTokenId : yesTokenId) ?? (selectedSide === 'No' ? noTokenId : yesTokenId);

    const book = tokenId ? activeMarket?.orderbooks?.[tokenId] : null;
    return { book, tokenId };
  }, [
    activeMarket?.orderbookTokenIds,
    activeMarket?.orderbooks,
    activeMarket?.markets,
    activeMarket?.outcomes,
    selectedOutcome,
    selectedSide,
  ]);

  const orderbookData = useMemo(() => {
    const book = orderbookInfo.book;
    const normalizeOrders = (orders: any[]) =>
      orders
        .map((order) => {
          const price = Number(order?.price ?? order?.[0]);
          const size = Number(order?.size ?? order?.[1]);
          if (!Number.isFinite(price) || !Number.isFinite(size)) return null;
          return { price, size };
        })
        .filter(Boolean) as Array<{ price: number; size: number }>;

    const bids = Array.isArray(book?.bids) ? normalizeOrders(book.bids) : [];
    const asks = Array.isArray(book?.asks) ? normalizeOrders(book.asks) : [];

    let runningBid = 0;
    const processedBids = bids.map((order) => {
      const sizeVal = amountsQuote === 'Quote' ? order.size * order.price : order.size;
      runningBid += sizeVal;
      return { ...order, size: sizeVal, totalSize: runningBid, shouldFlash: false, userPrice: false };
    });

    let runningAsk = 0;
    const processedAsks = asks.map((order) => {
      const sizeVal = amountsQuote === 'Quote' ? order.size * order.price : order.size;
      runningAsk += sizeVal;
      return { ...order, size: sizeVal, totalSize: runningAsk, shouldFlash: false, userPrice: false };
    });

    const highestBid = processedBids[0]?.price;
    const lowestAsk = processedAsks[0]?.price;
    const avgPrice =
      highestBid !== undefined && lowestAsk !== undefined
        ? (highestBid + lowestAsk) / 2
        : null;
    const decimals = Math.max(0, Math.floor(Math.log10(1 / baseInterval)));
    const spreadData = {
      spread:
        highestBid !== undefined && lowestAsk !== undefined && avgPrice
          ? `${(((lowestAsk - highestBid) / avgPrice) * 100).toFixed(2)}%`
          : '',
      averagePrice:
        highestBid !== undefined && lowestAsk !== undefined && avgPrice
          ? formatCommas(avgPrice.toFixed(decimals))
          : '',
    };

    return {
      roundedBuyOrders: processedBids,
      roundedSellOrders: processedAsks,
      spreadData,
    };
  }, [orderbookInfo.book, amountsQuote, baseInterval]);

  const orderbookIsLoading = Boolean(orderbookInfo.tokenId && !orderbookInfo.book);
  const orderbookSymbol = selectedOutcome || 'Shares';
  const handleOrderbookLimit = useCallback((price: number) => {
    if (!Number.isFinite(price)) return;
    setOrderType('Limit');
    setLimitPrice(Math.round(price * 100));
  }, []);

  // Calculate potential win
  const toWin = useMemo(() => {
    if (!amount || !selectedOutcomeData) return '0.00';
    const price = selectedSide === 'Yes' ? selectedOutcomeData.yesPrice : selectedOutcomeData.noPrice;
    if (price <= 0) return '0.00';
    const potentialWin = (Number(amount) / price) - Number(amount);
    return potentialWin.toFixed(2);
  }, [amount, selectedOutcomeData, selectedSide]);

  // Format countdown
  const getCountdown = useCallback((endDate: string) => {
    if (!endDate) return null;
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRefs.current.clear();
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.5)',
      },
      grid: {
        vertLines: { color: 'rgba(170, 174, 207, 0.06)' },
        horzLines: { color: 'rgba(170, 174, 207, 0.06)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(170, 174, 207, 0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(170, 174, 207, 0.3)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(170, 174, 207, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(170, 174, 207, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    // Add line series for top outcomes only
    chartOutcomes.forEach((outcome) => {
      const lineSeries = chart.addLineSeries({
        color: outcome.color,
        lineWidth: 2,
        priceFormat: {
          type: 'custom',
          formatter: (price: number) => `${price.toFixed(0)}%`,
        },
        autoscaleInfoProvider: () => {
          const range = chartYRangeRef.current;
          if (!range) return null;
          return {
            priceRange: {
              minValue: range.min,
              maxValue: range.max,
            },
          };
        },
      });
      seriesRefs.current.set(outcome.name, lineSeries);
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartOutcomes]);

  // Update chart data
  useEffect(() => {
    if (!chartRef.current || chartOutcomes.length === 0) return;
    const primaryData = filterSeriesByInterval(chartData['Primary'] || [], selectedInterval);
    const now = Math.floor(Date.now() / 1000);
    const plottedValues: number[] = [];
    const isBinaryMarket = chartOutcomes.length === 2;

    chartOutcomes.forEach((outcome, index) => {
      const series = seriesRefs.current.get(outcome.name);
      if (!series) return;

      const directByIndex = filterSeriesByInterval(chartData[`__index_${index}`] || [], selectedInterval);
      const directByLabel = filterSeriesByInterval(chartData[outcome.name] || [], selectedInterval);
      const directOutcomeData = directByIndex.length > 1 ? directByIndex : directByLabel;
      let pointsToPlot: ChartPoint[] = [];
      const directRange = getSeriesRange(directOutcomeData);
      const primaryRange = getSeriesRange(primaryData);

      if (directOutcomeData.length > 1 && (!isBinaryMarket || directRange > 0.2 || primaryRange <= 0.2)) {
        pointsToPlot = directOutcomeData;
      } else if (isBinaryMarket && primaryData.length > 1) {
        pointsToPlot = index === 0
          ? primaryData
          : primaryData.map((point) => ({
              time: point.time,
              value: Math.max(0, Math.min(100, 100 - point.value)),
            }));
      } else {
        const fallbackValue = toProbabilityPercent(outcome.probability) ?? 0;
        pointsToPlot = [
          { time: now - 3600, value: fallbackValue },
          { time: now, value: fallbackValue },
        ];
      }

      const data = pointsToPlot.map((point) => ({
        time: point.time as any,
        value: Math.max(0, Math.min(100, point.value)),
      }));

      data.forEach((point) => plottedValues.push(point.value));
      series.setData(data);
    });

    if (plottedValues.length > 0) {
      let min = Math.min(...plottedValues);
      let max = Math.max(...plottedValues);
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        chartYRangeRef.current = null;
      } else {
        if (max === min) {
          min = Math.max(0, min - 1.5);
          max = Math.min(100, max + 1.5);
        }
        const span = max - min;
        const pad = Math.max(span * 0.18, 1.1);
        chartYRangeRef.current = {
          min: Math.max(0, min - pad),
          max: Math.min(100, max + pad),
        };
      }
    } else {
      chartYRangeRef.current = null;
    }

    chartRef.current.timeScale().fitContent();
  }, [chartData, chartOutcomes, selectedInterval]);

  // Handle sort
  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Handle preset amount
  const handlePreset = (value: number) => {
    setAmount(prev => (Number(prev || 0) + value).toString());
  };

  // Handle place order (placeholder)
  const handlePlaceOrder = () => {
    if (!selectedOutcome || !amount || Number(amount) <= 0) return;
    console.log('Place order:', { selectedOutcome, selectedSide, orderType, amount });
    // TODO: Implement actual order placement
  };

  // Format large numbers
  const formatVolume = (vol: number | string | undefined | null) => {
    const numVol = Number(vol) || 0;
    if (numVol >= 1e9) return `$${(numVol / 1e9).toFixed(1)}B`;
    if (numVol >= 1e6) return `$${(numVol / 1e6).toFixed(1)}M`;
    if (numVol >= 1e3) return `$${(numVol / 1e3).toFixed(1)}K`;
    return `$${numVol.toFixed(0)}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Extract market info
  const eventTitle = activeMarket?.eventTitle || activeMarket?.baseAsset || 'Loading...';
  const eventImage = activeMarket?.iconURL || '';
  const eventTags = activeMarket?.tags || [];
  const volume24h = activeMarket?.volume24hr || activeMarket?.value || 0;
  const liquidity = activeMarket?.liquidity || 0;
  const endDate = activeMarket?.endDate || '';
  const countdown = getCountdown(endDate);
  const isResolved = Boolean(activeMarket?.closed || activeMarket?.active === false);
  const statusLabel = isResolved ? 'Resolved' : 'Live';
  const statusTitle = endDate
    ? `${isResolved ? 'Resolved' : 'Ends'} ${formatDate(endDate)}`
    : statusLabel;
  const isTradingDisabled = isResolved;
  const commentsCount = Number(activeMarket?.commentCount ?? NaN);
  const holdersCount = Number(activeMarket?.holders ?? NaN);
  const commentsAvailable = Number.isFinite(commentsCount);
  const holdersAvailable = Number.isFinite(holdersCount);
  const chatChannels = Array.isArray(activeMarket?.chats) ? activeMarket.chats : [];

  return (
    <div className={`predict-event-page ${isResolved ? 'predict-event-resolved' : ''}`}>
      {/* HEADER */}
      <div className="predict-event-header">
        <div className="predict-event-header-left">
          <div className="predict-event-image">
            {eventImage ? (
              <img src={eventImage} alt={eventTitle} />
            ) : (
              <span>{eventTitle.charAt(0)}</span>
            )}
          </div>
          <div className="predict-event-info">
            {eventTags.length > 0 && (
              <div className="predict-event-tags">
                {eventTags.slice(0, 3).map((tag: any, idx: number) => (
                  <span key={idx} className="predict-event-tag">
                    {tag.label || tag.name || tag}
                  </span>
                ))}
              </div>
            )}
            <div className="predict-event-title-row">
              <h1 className="predict-event-title">{eventTitle}</h1>
              <span
                className={`predict-event-status-pill ${isResolved ? 'resolved' : 'live'}`}
                title={statusTitle}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="predict-event-header-stats">
          <div className="predict-event-stat">
            <span className="predict-event-stat-value">{formatVolume(volume24h)}</span>
            <span className="predict-event-stat-label">Vol</span>
          </div>
          <div className="predict-event-stat">
            <span className="predict-event-stat-value">{formatDate(endDate)}</span>
            <span className="predict-event-stat-label">End Date</span>
          </div>
          {countdown && (
            <div className="predict-event-stat predict-event-countdown-stat">
              <span className="predict-event-stat-value predict-event-countdown-value">{countdown}</span>
            </div>
          )}
        </div>
      </div>

      <div className="predict-event-main-content">
        {/* LEFT PANEL */}
        <div className="predict-event-left-panel">
          {/* Chart Section */}
          <div className="predict-event-chart-section">
            {/* Chart Legend */}
            <div className="predict-event-chart-legend">
              {chartOutcomes.map((outcome, idx) => (
                <div key={outcome.name} className="predict-event-legend-item">
                  <span className="predict-event-legend-color" style={{ backgroundColor: outcome.color }} />
                  <span className="predict-event-legend-name">{outcome.name}</span>
                  <span className="predict-event-legend-value">{(outcome.probability * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>

            {/* Chart Container */}
            <div className="predict-event-chart-container" ref={chartContainerRef} />

            {/* Interval Selector */}
            <div className="predict-event-interval-selector">
              {(['1H', '24H', '7D', '30D', 'ALL'] as IntervalType[]).map(interval => (
                <button
                  key={interval}
                  className={`predict-event-interval-btn ${selectedInterval === interval ? 'active' : ''}`}
                  onClick={() => setSelectedInterval(interval)}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>

          {/* Outcomes Table */}
          <div className="predict-event-outcomes-table">
            <div className="predict-event-outcomes-header">
              <div
                className="predict-event-outcome-col predict-event-outcome-name-col"
                onClick={() => handleSort('name')}
              >
                OUTCOME
                {sortConfig.column === 'name' && (
                  <span className="predict-event-sort-arrow">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
              <div
                className="predict-event-outcome-col predict-event-outcome-prob-col"
                onClick={() => handleSort('probability')}
              >
                % CHANCE
                {sortConfig.column === 'probability' && (
                  <span className="predict-event-sort-arrow">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
              <div className="predict-event-outcome-col predict-event-outcome-actions-col">
                {/* Empty header for actions */}
              </div>
            </div>
            <div className="predict-event-outcomes-body">
              {sortedOutcomes.map(outcome => (
                <div
                  key={outcome.name}
                  className={`predict-event-outcome-row ${selectedOutcome === outcome.name ? 'selected' : ''}`}
                  onClick={() => setSelectedOutcome(outcome.name)}
                >
                  <div className="predict-event-outcome-col predict-event-outcome-name-col">
                    <span className="predict-event-outcome-label">{outcome.name}</span>
                    <span className="predict-event-outcome-volume">{formatVolume(outcome.volume)} Vol</span>
                  </div>
                  <div className="predict-event-outcome-col predict-event-outcome-prob-col">
                    <span className="predict-event-probability-value">{(outcome.probability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="predict-event-outcome-col predict-event-outcome-actions-col">
                    <button
                      className="predict-event-buy-yes-btn"
                      disabled={isTradingDisabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOutcome(outcome.name);
                        setSelectedSide('Yes');
                      }}
                    >
                      Buy Yes {(outcome.yesPrice * 100).toFixed(1)}c
                    </button>
                    <button
                      className="predict-event-buy-no-btn"
                      disabled={isTradingDisabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOutcome(outcome.name);
                        setSelectedSide('No');
                      }}
                    >
                      Buy No {(outcome.noPrice * 100).toFixed(1)}c
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Order Panel */}
        <div className="predict-event-right-panel">
          {/* Selected Outcome */}
          {selectedOutcomeData && (
            <div className="predict-event-selected-outcome-display">
              <div className="predict-event-selected-outcome-image">
                {eventImage ? (
                  <img src={eventImage} alt={selectedOutcomeData.name} />
                ) : (
                  <span>{selectedOutcomeData.name.charAt(0)}</span>
                )}
              </div>
              <span className="predict-event-selected-outcome-name">{selectedOutcomeData.name}</span>
            </div>
          )}

          {/* Buy/Sell Toggle + Order Type */}
          <div className="predict-event-trade-header-row">
            <div className="predict-event-trade-toggle">
              <button className="predict-event-trade-toggle-btn buy active" disabled={isTradingDisabled}>Buy</button>
              <button className="predict-event-trade-toggle-btn sell" disabled={isTradingDisabled}>Sell</button>
            </div>
            <div className="predict-event-order-type-dropdown">
              <button
                className="predict-event-order-type-button"
                disabled={isTradingDisabled}
                onClick={() => {
                  if (isTradingDisabled) return;
                  setIsOrderTypeDropdownOpen(!isOrderTypeDropdownOpen);
                }}
              >
                {orderType}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {isOrderTypeDropdownOpen && !isTradingDisabled && (
                <div className="predict-event-order-type-dropdown-menu">
                  {(['Market', 'Limit'] as const).map((option) => (
                    <div
                      key={option}
                      className={`predict-event-order-type-option ${orderType === option ? 'active' : ''}`}
                      onClick={() => {
                        setOrderType(option);
                        setIsOrderTypeDropdownOpen(false);
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Yes/No Selection */}
          <div className="predict-event-outcome-selection">
            <button
              className={`predict-event-outcome-btn yes ${selectedSide === 'Yes' ? 'active' : ''}`}
              disabled={isTradingDisabled}
              onClick={() => setSelectedSide('Yes')}
            >
              <span className="predict-event-outcome-btn-label">Yes</span>
              {selectedOutcomeData && (
                <span className="predict-event-outcome-btn-price">{(selectedOutcomeData.yesPrice * 100).toFixed(1)}c</span>
              )}
            </button>
            <button
              className={`predict-event-outcome-btn no ${selectedSide === 'No' ? 'active' : ''}`}
              disabled={isTradingDisabled}
              onClick={() => setSelectedSide('No')}
            >
              <span className="predict-event-outcome-btn-label">No</span>
              {selectedOutcomeData && (
                <span className="predict-event-outcome-btn-price">{(selectedOutcomeData.noPrice * 100).toFixed(1)}c</span>
              )}
            </button>
          </div>

          {/* Market Order - Amount Section */}
          {orderType === 'Market' && (
            <>
              <div className="predict-event-amount-section">
                <div className="predict-event-amount-header">
                  <span className="predict-event-amount-label">Amount</span>
                  <div className="predict-event-amount-input-wrapper">
                    <span className="predict-event-amount-currency">$</span>
                    <input
                      type="text"
                      value={amount}
                      disabled={isTradingDisabled}
                      onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="0.00"
                      className="predict-event-amount-input"
                    />
                  </div>
                </div>
                <div className="predict-event-amount-presets">
                  <button onClick={() => handlePreset(1)} disabled={isTradingDisabled}>+$1</button>
                  <button onClick={() => handlePreset(20)} disabled={isTradingDisabled}>+$20</button>
                  <button onClick={() => handlePreset(100)} disabled={isTradingDisabled}>+$100</button>
                  <button onClick={() => setAmount('0')} disabled={isTradingDisabled}>Max</button>
                </div>
              </div>

              {/* Market Order Summary */}
              <div className="predict-event-order-summary">
                <div className="predict-event-summary-row">
                  <span className="predict-event-summary-label">To win</span>
                  <span className="predict-event-summary-value to-win">${toWin}</span>
                </div>
              </div>
            </>
          )}

          {/* Limit Order - Price & Shares Section */}
          {orderType === 'Limit' && (
            <>
              {/* Limit Price */}
              <div className="predict-event-limit-section">
                <div className="predict-event-limit-row">
                  <span className="predict-event-limit-label">Limit Price</span>
                  <div className="predict-event-limit-control">
                    <button
                      className="predict-event-limit-btn"
                      disabled={isTradingDisabled}
                      onClick={() => setLimitPrice(prev => Math.max(0, prev - 1))}
                    >
                      −
                    </button>
                    <span className="predict-event-limit-value">{limitPrice}¢</span>
                    <button
                      className="predict-event-limit-btn"
                      disabled={isTradingDisabled}
                      onClick={() => setLimitPrice(prev => Math.min(99, prev + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Shares */}
              <div className="predict-event-amount-section">
                <div className="predict-event-amount-header">
                  <span className="predict-event-amount-label">Shares</span>
                </div>
                <div className="predict-event-amount-input-wrapper">
                  <input
                    type="text"
                    value={shares}
                    disabled={isTradingDisabled}
                    onChange={(e) => setShares(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    className="predict-event-amount-input predict-event-shares-input"
                  />
                </div>
                <div className="predict-event-amount-presets">
                  <button onClick={() => setShares(prev => String(Math.max(0, Number(prev || 0) - 100)))} disabled={isTradingDisabled}>-100</button>
                  <button onClick={() => setShares(prev => String(Math.max(0, Number(prev || 0) - 10)))} disabled={isTradingDisabled}>-10</button>
                  <button onClick={() => setShares(prev => String(Number(prev || 0) + 10))} disabled={isTradingDisabled}>+10</button>
                  <button onClick={() => setShares(prev => String(Number(prev || 0) + 100))} disabled={isTradingDisabled}>+100</button>
                </div>
              </div>

              {/* Set Expiration */}
              <div className="predict-event-expiration-row">
                <span className="predict-event-expiration-label">Set Expiration</span>
                <button
                  className={`predict-event-toggle ${expirationEnabled ? 'active' : ''}`}
                  disabled={isTradingDisabled}
                  onClick={() => setExpirationEnabled(!expirationEnabled)}
                >
                  <span className="predict-event-toggle-knob" />
                </button>
              </div>

              {/* Total */}
              <div className="predict-event-order-summary">
                <div className="predict-event-summary-row">
                  <span className="predict-event-summary-label">Total</span>
                  <span className="predict-event-summary-value">
                    ${((Number(shares) || 0) * (limitPrice / 100)).toFixed(0)}
                  </span>
                </div>
                <div className="predict-event-summary-row">
                  <span className="predict-event-summary-label">To win</span>
                  <span className="predict-event-summary-value to-win">
                    ${shares || '0'}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Place Order Button */}
          <button
            className="predict-event-place-order-btn"
            disabled={isTradingDisabled || !selectedOutcome || !amount || Number(amount) <= 0}
            onClick={handlePlaceOrder}
          >
            Place {orderType} Buy
          </button>

          <p className="predict-event-terms-text">
            By trading, you agree to the <a href="#">Terms of Use</a>.
          </p>

          {/* Recent Activity */}
          <div className="predict-event-recent-activity">
            <div className="predict-event-activity-header">
              <span className="predict-event-activity-title">Recent Activity</span>
              <button className="predict-event-activity-hide-btn">Hide</button>
            </div>
            <div className="predict-event-activity-tabs">
              <button
                className={`predict-event-activity-tab ${activityTab === 'all' ? 'active' : ''}`}
                onClick={() => setActivityTab('all')}
              >
                All
              </button>
              <button
                className={`predict-event-activity-tab ${activityTab === 'openOrders' ? 'active' : ''}`}
                onClick={() => setActivityTab('openOrders')}
              >
                Open Orders
              </button>
            </div>
            <div className="predict-event-activity-list">
              <div className="predict-event-activity-empty">
                No recent activity
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predict;
