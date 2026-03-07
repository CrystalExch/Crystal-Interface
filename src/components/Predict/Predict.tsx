import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { formatCommas } from '../../utils/numberDisplayFormat';
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
const SERIES_FAILURE_TTL_MS = 5 * 60 * 1000;
const SERIES_BACKGROUND_REFRESH_MS = 10 * 60 * 1000;
const EVENT_REFRESH_MS = 60 * 1000;
const EVENT_CACHE_TTL_MS = 30 * 60 * 1000;
const LIVE_TRADES_MAX_ITEMS = 60;
const LIVE_TRADES_SEED_LIMIT = 40;
const LIVE_TRADES_WS_RECONNECT_MS = 3000;
const LIVE_TRADES_WS_PING_MS = 10000;

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
  chartKey: string;
  name: string;
  probability: number;
  volume: number;
  yesPrice: number;
  noPrice: number;
  color: string;
  isConcluded?: boolean;
}

type IntervalType = '1H' | '24H' | '7D' | '30D' | 'ALL';
type ChartPoint = { time: number; value: number };
type LiveTrade = {
  key: string;
  timestamp: number;
  side: 'BUY' | 'SELL' | 'UNKNOWN';
  price: number;
  size: number;
  assetId: string;
  conditionId: string;
  outcome: string;
  trader: string;
  txHash: string;
  source: 'history' | 'stream';
};
type CachedEventSnapshot = {
  conditionId: string;
  cachedAt: number;
  marketData: any;
  chartData?: Record<string, ChartPoint[]>;
};
type SeriesEndpointConfig = { key: string; path: string };

const FAST_SERIES_ENDPOINT_KEYS = new Set(['prices-max']);

const buildSeriesEndpointConfigs = (seriesId: string): SeriesEndpointConfig[] => {
  const encoded = encodeURIComponent(seriesId);
  return [
    { key: 'series', path: `/clob/series?id=${encoded}` },
    { key: 'prices-max-fidelity', path: `/clob/prices-history?market=${encoded}&interval=max&fidelity=5` },
    { key: 'prices-max', path: `/clob/prices-history?market=${encoded}&interval=max` },
    { key: 'prices-default', path: `/clob/prices-history?market=${encoded}` },
  ];
};

const rankSeriesEndpointConfigs = (
  configs: SeriesEndpointConfig[],
  preferredKey: string | undefined,
  exhaustive: boolean,
): SeriesEndpointConfig[] => {
  const ranked = preferredKey
    ? [
        ...configs.filter((cfg) => cfg.key === preferredKey),
        ...configs.filter((cfg) => cfg.key !== preferredKey),
      ]
    : configs;

  if (exhaustive) return ranked;
  return ranked.filter((cfg) => FAST_SERIES_ENDPOINT_KEYS.has(cfg.key));
};

// Normalizes outcome labels so dynamic chart keys can be matched safely across APIs.
const normalizeOutcomeKey = (value: any): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9%+\-\s]/g, '')
    .replace(/\s+/g, ' ');

// Coerces polymarket-style mixed booleans ("0", "1", true/false) into a real boolean.
const toBooleanFlag = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  }
  return Boolean(value);
};

// Converts timestamps from multiple possible formats into unix seconds for charting.
const toEpochSeconds = (value: any): number | null => {
  if (value == null) return null;
  const numeric = Number(value);
  let parsed = Number.isFinite(numeric) ? numeric : Date.parse(String(value));
  if (!Number.isFinite(parsed)) return null;
  if (parsed > 1e12) parsed /= 1000;
  return Math.floor(parsed);
};

// Normalizes probability values from different scales into a 0-100 percentage.
const toProbabilityPercent = (value: any): number | null => {
  const numeric = Number(
    typeof value === 'string' ? value.replace(/,/g, '') : value,
  );
  if (!Number.isFinite(numeric)) return null;
  let normalized = numeric < 0 ? 0 : numeric;
  if (normalized <= 1.000001) {
    normalized *= 100;
  } else if (normalized <= 100.000001) {
    // already percent
  } else if (normalized <= 10_000.000001) {
    normalized /= 100;
  } else if (normalized <= 1_000_000.000001) {
    normalized /= 10_000;
  } else if (normalized <= 1_000_000_000.000001) {
    normalized /= 1_000_000;
  } else if (normalized <= 1_000_000_000_000_000_000.000001) {
    normalized /= 10_000_000_000_000_000;
  } else {
    while (normalized > 100.000001) normalized /= 10;
  }
  return Math.max(0, Math.min(100, normalized));
};

// Converts any probability representation into a 0-1 unit interval for UI math.
const toProbabilityUnit = (value: any): number => {
  const percent = toProbabilityPercent(value);
  if (percent == null) return 0;
  return Math.max(0, Math.min(1, percent / 100));
};

// Accepts many history payload shapes and returns sorted chart points in {time, value} form.
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

  const pickArraySeriesFromObject = (input: any): any[] => {
    if (!input || typeof input !== 'object') return [];
    const directCandidates = [
      input?.items,
      input?.points,
      input?.prices,
      input?.history,
      input?.series,
      input?.data,
      input?.result,
      input?.results,
    ];
    for (const candidate of directCandidates) {
      if (Array.isArray(candidate) && candidate.length > 0) return candidate;
    }
    const nestedObjectCandidates = [
      input?.history,
      input?.series,
      input?.data,
      input?.result,
      input?.results,
      input?.payload,
    ];
    for (const nested of nestedObjectCandidates) {
      if (!nested || typeof nested !== 'object') continue;
      const nestedPoints = pickArraySeriesFromObject(nested);
      if (nestedPoints.length) return nestedPoints;
    }
    return [];
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
        : pickArraySeriesFromObject(value);

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
        point?.prob ??
        point?.mid ??
        point?.last ??
        point?.open ??
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

// Parses outcome prices from API payloads (JSON string, CSV-like string, or array) into 0-1 units.
const parseOutcomePrices = (value: any): number[] => {
  let parsed: any = value;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = parsed
        .split(',')
        .map((item: string) => item.trim())
        .filter(Boolean);
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) => toProbabilityUnit(item ?? 0));
};

// Maps selected chart interval to a lower bound timestamp for history filtering.
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

// Filters points by selected interval, but preserves a tail fallback when data is sparse.
const filterSeriesByInterval = (points: ChartPoint[], interval: IntervalType): ChartPoint[] => {
  if (!points.length || interval === 'ALL') return points;
  const start = getIntervalStart(interval, Math.floor(Date.now() / 1000));
  if (start == null) return points;
  const filtered = points.filter((point) => point.time >= start);
  if (filtered.length >= 2) return filtered;
  return points.slice(-Math.min(points.length, 200));
};

// Picks a human-readable outcome label from polymarket market metadata with safe fallback.
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

// Computes movement amplitude for a time series; used to choose the best candidate history.
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

const parseTradeTimestampSeconds = (value: any): number => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric > 1e12 ? Math.floor(numeric / 1000) : Math.floor(numeric);
  }
  const parsed = Date.parse(String(value ?? ''));
  if (Number.isFinite(parsed)) {
    return Math.floor(parsed / 1000);
  }
  return Math.floor(Date.now() / 1000);
};

const parseTradeSide = (value: any): 'BUY' | 'SELL' | 'UNKNOWN' => {
  const side = String(value ?? '').trim().toUpperCase();
  if (side === 'BUY') return 'BUY';
  if (side === 'SELL') return 'SELL';
  return 'UNKNOWN';
};

const decodeRouteMarketSlug = (value: any): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const normalizeMarketSlug = (value: any): string =>
  decodeRouteMarketSlug(value).toLowerCase();

const normalizeTradeAssetId = (value: any): string =>
  String(value ?? '').trim().toLowerCase();

const formatActivityTime = (tsSeconds: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const delta = Math.max(0, now - tsSeconds);
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
};

const formatActivityPrice = (rawPrice: number): string => {
  if (!Number.isFinite(rawPrice)) return '--';
  if (rawPrice <= 1.000001) return `${(rawPrice * 100).toFixed(1)}%`;
  if (rawPrice <= 100.000001) return `${rawPrice.toFixed(1)}%`;
  return `$${formatCommas(rawPrice.toFixed(2))}`;
};

const formatActivitySize = (rawSize: number): string => {
  if (!Number.isFinite(rawSize) || rawSize <= 0) return '0';
  const rounded = rawSize >= 1000
    ? rawSize.toFixed(0)
    : rawSize.toFixed(2).replace(/\.?0+$/, '');
  return formatCommas(rounded);
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
  const failedSeriesCacheRef = useRef<Map<string, { failedAt: number }>>(new Map());
  const seriesEndpointPreferenceRef = useRef<Map<string, string>>(new Map());
  const seriesInFlightRef = useRef<Map<string, Promise<ChartPoint[]>>>(new Map());

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
  const [limitPriceInput, setLimitPriceInput] = useState('0');
  const [shares, setShares] = useState('');
  const [expirationEnabled, setExpirationEnabled] = useState(false);

  // Table state
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' }>({
    column: 'probability',
    direction: 'desc'
  });
  const [activityTab, setActivityTab] = useState<'all' | 'openOrders'>('all');
  const [isActivityHidden, setIsActivityHidden] = useState(false);
  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>([]);
  const [liveTradesConnected, setLiveTradesConnected] = useState(false);
  const [liveTradesError, setLiveTradesError] = useState<string | null>(null);
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
  const predictMarketsRef = useRef<Record<string, any>>({});

  // Get current market data
  const routeMarketSlug = decodeRouteMarketSlug(marketSlug);
  const normalizedRouteMarketSlug = normalizeMarketSlug(routeMarketSlug);
  const activeMarketFromStore = predictMarketsData[predictActiveMarketKey] || {};
  const normalizedActiveMarketSlugs = [
    normalizeMarketSlug(activeMarketFromStore?.eventSlug),
    normalizeMarketSlug(activeMarketFromStore?.marketSlug),
    normalizeMarketSlug(activeMarketFromStore?.slug),
  ].filter(Boolean);
  const activeMarket =
    normalizedRouteMarketSlug &&
    !normalizedActiveMarketSlugs.includes(normalizedRouteMarketSlug)
      ? {}
      : activeMarketFromStore;
  const effectiveViewMode = viewMode ?? localViewMode;
  const handleViewMode = setViewMode ?? setLocalViewMode;
  const effectiveActiveTab = activeTab ?? localActiveTab;
  const handleActiveTab = setActiveTab ?? setLocalActiveTab;
  const effectiveOrderbookPosition = orderbookPosition ?? 'right';
  const activityTokenIds = useMemo(() => {
    const out = new Set<string>();
    const collect = (value: any) => {
      if (value == null) return;
      if (Array.isArray(value)) {
        value.forEach(collect);
        return;
      }
      if (typeof value === 'object') {
        collect(value?.token_id ?? value?.tokenId ?? value?.id);
        return;
      }
      if (typeof value === 'string') {
        const raw = value.trim();
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach(collect);
            return;
          }
        } catch {
          const split = raw
            .split(/[,\s]+/)
            .map((item) => item.trim())
            .filter(Boolean);
          if (split.length > 1) {
            split.forEach(collect);
            return;
          }
        }
        out.add(raw);
        return;
      }
      out.add(String(value));
    };

    collect(activeMarket?.orderbookTokenIds);
    if (Array.isArray(activeMarket?.markets)) {
      activeMarket.markets.forEach((marketItem: any) => {
        collect(marketItem?.clobTokenIds);
        collect(marketItem?.tokenIds);
        collect(marketItem?.token_ids);
        collect(marketItem?.outcomeTokenIds);
        collect(marketItem?.yesTokenId);
        collect(marketItem?.noTokenId);
        if (Array.isArray(marketItem?.tokens)) {
          marketItem.tokens.forEach((tokenItem: any) => collect(tokenItem));
        }
      });
    }
    return Array.from(out);
  }, [activeMarket?.orderbookTokenIds, activeMarket?.markets, activeMarket?.contractId]);

  const activityOutcomeByAsset = useMemo(() => {
    const lookup = new Map<string, string>();
    const outcomesList = Array.isArray(activeMarket?.outcomes) ? activeMarket.outcomes : [];
    const tokenGroups = Array.isArray(activeMarket?.orderbookTokenIds) ? activeMarket.orderbookTokenIds : [];
    const isSingleBinary = tokenGroups.length === 1 && outcomesList.length === 2;
    const setOutcomeLabel = (assetId: any, rawLabel: any) => {
      const asset = String(assetId ?? '').trim();
      const label = String(rawLabel ?? '').trim();
      if (!asset || !label) return;
      lookup.set(asset, label);
      lookup.set(normalizeTradeAssetId(asset), label);
    };
    const collectTokenIds = (value: any, output: string[]) => {
      if (value == null) return;
      if (Array.isArray(value)) {
        value.forEach((item) => collectTokenIds(item, output));
        return;
      }
      if (typeof value === 'object') {
        collectTokenIds(value?.token_id ?? value?.tokenId ?? value?.id, output);
        return;
      }
      if (typeof value === 'string') {
        const raw = value.trim();
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => collectTokenIds(item, output));
            return;
          }
        } catch {
          const split = raw
            .split(/[,\s]+/)
            .map((item) => item.trim())
            .filter(Boolean);
          if (split.length > 1) {
            split.forEach((item) => collectTokenIds(item, output));
            return;
          }
        }
        output.push(raw);
        return;
      }
      output.push(String(value));
    };

    tokenGroups.forEach((group: any, idx: number) => {
      if (!Array.isArray(group)) return;
      const baseLabel = String(outcomesList[idx] ?? `Outcome ${idx + 1}`);
      const yesAsset = group[0];
      const noAsset = group[1];
      if (yesAsset) {
        setOutcomeLabel(
          yesAsset,
          isSingleBinary ? String(outcomesList[0] ?? 'Yes') : `${baseLabel} Yes`,
        );
      }
      if (noAsset) {
        setOutcomeLabel(
          noAsset,
          isSingleBinary ? String(outcomesList[1] ?? 'No') : `${baseLabel} No`,
        );
      }
    });

    if (Array.isArray(activeMarket?.markets)) {
      activeMarket.markets.forEach((marketItem: any, idx: number) => {
        const baseLabel = String(
          outcomesList[idx] ??
            marketItem?.groupItemTitle ??
            marketItem?.shortTitle ??
            marketItem?.title ??
            marketItem?.name ??
            marketItem?.question ??
            `Outcome ${idx + 1}`,
        ).trim();
        const tokenIds: string[] = [];
        collectTokenIds(marketItem?.clobTokenIds, tokenIds);
        collectTokenIds(marketItem?.tokenIds, tokenIds);
        collectTokenIds(marketItem?.token_ids, tokenIds);
        collectTokenIds(marketItem?.outcomeTokenIds, tokenIds);
        collectTokenIds(marketItem?.yesTokenId, tokenIds);
        collectTokenIds(marketItem?.noTokenId, tokenIds);
        if (Array.isArray(marketItem?.tokens)) {
          marketItem.tokens.forEach((tokenItem: any) => {
            const tokenId = tokenItem?.token_id ?? tokenItem?.tokenId ?? tokenItem?.id ?? tokenItem;
            const tokenLabel = String(
              tokenItem?.outcome ?? tokenItem?.title ?? tokenItem?.name ?? '',
            ).trim();
            if (tokenLabel) {
              setOutcomeLabel(tokenId, tokenLabel);
            }
            collectTokenIds(tokenId, tokenIds);
          });
        }

        const uniqueTokenIds = Array.from(
          new Set(
            tokenIds
              .map((item) => String(item ?? '').trim())
              .filter(Boolean),
          ),
        );
        if (!uniqueTokenIds.length) return;

        if (uniqueTokenIds.length === 1) {
          setOutcomeLabel(uniqueTokenIds[0], baseLabel);
          return;
        }

        if (isSingleBinary) {
          setOutcomeLabel(uniqueTokenIds[0], String(outcomesList[0] ?? 'Yes'));
          setOutcomeLabel(uniqueTokenIds[1], String(outcomesList[1] ?? 'No'));
          uniqueTokenIds.slice(2).forEach((tokenId) => setOutcomeLabel(tokenId, baseLabel));
          return;
        }

        setOutcomeLabel(uniqueTokenIds[0], `${baseLabel} Yes`);
        setOutcomeLabel(uniqueTokenIds[1], `${baseLabel} No`);
        uniqueTokenIds.slice(2).forEach((tokenId) => setOutcomeLabel(tokenId, baseLabel));
      });
    }

    return lookup;
  }, [activeMarket?.outcomes, activeMarket?.orderbookTokenIds, activeMarket?.markets, activeMarket?.contractId]);

  useEffect(() => {
    selectedOutcomeRef.current = selectedOutcome;
  }, [selectedOutcome]);

  useEffect(() => {
    predictMarketsRef.current = predictMarketsData || {};
  }, [predictMarketsData]);

  // Fetch market data when marketSlug changes
  useEffect(() => {
    if (marketSlug) {
      const requestedRouteSlug = decodeRouteMarketSlug(marketSlug);
      const normalizedRequestedSlug = normalizeMarketSlug(requestedRouteSlug);
      const cacheKey = `predict:event:${requestedRouteSlug}`;

      // Reads last good event payload for this slug so transient API outages don't blank the page.
      const readCachedEvent = (): CachedEventSnapshot | null => {
        if (typeof window === 'undefined') return null;
        try {
          const raw = window.sessionStorage.getItem(cacheKey);
          if (!raw) return null;
          const parsed = JSON.parse(raw) as CachedEventSnapshot;
          if (!parsed?.conditionId || !parsed?.marketData || !parsed?.cachedAt) return null;
          if (Date.now() - parsed.cachedAt > EVENT_CACHE_TTL_MS) return null;
          return parsed;
        } catch {
          return null;
        }
      };

      // Persists last known-good event payload for this slug to session storage.
      const writeCachedEvent = (payload: CachedEventSnapshot) => {
        if (typeof window === 'undefined') return;
        try {
          window.sessionStorage.setItem(cacheKey, JSON.stringify(payload));
        } catch {
          // Ignore storage write failures.
        }
      };

      // Applies cached data to store/chart so UI remains usable when live fetch fails.
      const applyCachedEvent = (cached: CachedEventSnapshot) => {
        if (!cached?.conditionId || !cached?.marketData) return false;
        setPredictActiveMarketKey(cached.conditionId);
        setPredictMarketsData((prev: any) => ({
          ...prev,
          [cached.conditionId]: {
            ...(prev?.[cached.conditionId] || {}),
            ...cached.marketData,
            orderbooks: {
              ...(prev?.[cached.conditionId]?.orderbooks || {}),
              ...(cached.marketData?.orderbooks || {}),
            },
          },
        }));
        if (cached.chartData && Object.keys(cached.chartData).length > 0) {
          setChartData(cached.chartData);
        }
        return true;
      };

      const existingEntry = Object.entries(predictMarketsRef.current || {}).find(([, marketData]) => {
        const candidateSlugs = [
          normalizeMarketSlug(marketData?.eventSlug),
          normalizeMarketSlug(marketData?.marketSlug),
          normalizeMarketSlug(marketData?.slug),
        ].filter(Boolean);
        return candidateSlugs.includes(normalizedRequestedSlug);
      });
      if (existingEntry) {
        const [conditionId, marketData] = existingEntry;
        setPredictActiveMarketKey(conditionId);
        if (marketData?.chartData && Object.keys(marketData.chartData).length > 0) {
          setChartData(marketData.chartData);
        }
      } else {
        const cached = readCachedEvent();
        if (!cached || !applyCachedEvent(cached)) {
          setChartData({});
        }
      }

      // Shared JSON fetch wrapper for predictapi endpoints with explicit error context.
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

      // Normalizes token-id containers from various market fields into string token IDs.
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
            return value
              .split(/[,\s]+/)
              .map((item) => item.trim())
              .filter(Boolean)
              .map((item) => String(item));
          }
        }
        return [];
      };

      // Collects all possible token-id representations for one market and deduplicates them.
      const getTokenIdsForMarket = (marketData: any): string[] => {
        const clobTokenIds = parseClobTokenIds(marketData?.clobTokenIds);
        const explicitTokenIds = parseClobTokenIds(
          marketData?.tokenIds ??
          marketData?.token_ids ??
          marketData?.outcomeTokenIds,
        );
        const tokens = Array.isArray(marketData?.tokens)
          ? marketData.tokens
              .map((token: any) => token?.token_id ?? token?.tokenId ?? token?.id)
              .filter(Boolean)
          : [];
        const singular = [
          marketData?.tokenID,
          marketData?.tokenId,
          marketData?.token_id,
          marketData?.yesTokenId,
          marketData?.noTokenId,
        ].filter(Boolean);

        return Array.from(
          new Set(
            [...clobTokenIds, ...explicitTokenIds, ...tokens, ...singular]
              .filter(Boolean)
              .map((item: any) => String(item)),
          ),
        );
      };

      // Returns token IDs in stable outcome order for orderbook pricing (prefer market.tokens order).
      const getOrderbookTokenIdsForMarket = (marketData: any): string[] => {
        const tokenObjects = Array.isArray(marketData?.tokens) ? marketData.tokens : [];
        const tokenIdsFromObjects = tokenObjects
          .map((token: any) => token?.token_id ?? token?.tokenId ?? token?.id)
          .filter(Boolean)
          .map((item: any) => String(item));
        if (tokenIdsFromObjects.length) {
          return Array.from(new Set(tokenIdsFromObjects));
        }

        const clobTokenIds = parseClobTokenIds(marketData?.clobTokenIds);
        if (clobTokenIds.length) return clobTokenIds;

        const explicitTokenIds = parseClobTokenIds(
          marketData?.tokenIds ??
          marketData?.token_ids ??
          marketData?.outcomeTokenIds,
        );
        if (explicitTokenIds.length) return explicitTokenIds;

        const singular = [
          marketData?.yesTokenId,
          marketData?.noTokenId,
          marketData?.tokenID,
          marketData?.tokenId,
          marketData?.token_id,
        ]
          .filter(Boolean)
          .map((item: any) => String(item));
        return Array.from(new Set(singular));
      };

      // Batch-fetches orderbooks for the requested token IDs from the clob books endpoint.
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

      const fetchEventBySlug = async (
        slugValue: string,
        signal: AbortSignal,
        includeChat: boolean,
      ) => {
        const includeChatParam = includeChat ? '&include_chat=true' : '';
        const slugParam = `slug=${encodeURIComponent(slugValue)}${includeChatParam}&include_history=true`;
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

      // Fetches one event for the route slug; supports both event slugs and market slugs.
      const fetchEvent = async (signal: AbortSignal, includeChat: boolean) => {
        const direct = await fetchEventBySlug(requestedRouteSlug, signal, includeChat);
        if (Array.isArray(direct) && direct.length > 0) {
          return direct;
        }

        try {
          const marketLookup = await fetchPolymarketJson(
            `/predictapi/markets?slug=${encodeURIComponent(requestedRouteSlug)}&limit=1`,
            signal,
          );
          const marketRow = Array.isArray(marketLookup) ? marketLookup[0] : null;
          const eventSlugFromMarket = String(
            marketRow?.eventSlug ??
              marketRow?.events?.[0]?.slug ??
              '',
          ).trim();
          if (eventSlugFromMarket) {
            const resolved = await fetchEventBySlug(eventSlugFromMarket, signal, includeChat);
            if (Array.isArray(resolved) && resolved.length > 0) {
              return resolved;
            }
          }
        } catch {
          // Ignore fallback lookup failures.
        }

        return direct;
      };

      // Retries event lookup once to smooth transient DNS/proxy failures from the dev server.
      const fetchEventWithRetry = async (signal: AbortSignal, includeChat: boolean) => {
        let lastError: unknown = null;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            return await fetchEvent(signal, includeChat);
          } catch (error) {
            lastError = error;
            if ((error as Error)?.name === 'AbortError' || signal.aborted) throw error;
            if (attempt === 0) {
              await new Promise((resolve) => {
                window.setTimeout(resolve, 400);
              });
            }
          }
        }
        throw lastError;
      };

      // Returns ranked history endpoints, biased toward the last endpoint that succeeded.
      const getRankedSeriesEndpoints = (seriesId: string, exhaustive: boolean): SeriesEndpointConfig[] => {
        const configs = buildSeriesEndpointConfigs(seriesId);
        return rankSeriesEndpointConfigs(
          configs,
          seriesEndpointPreferenceRef.current.get(seriesId),
          exhaustive,
        );
      };

      // Fetches and caches a history series with fast vs exhaustive modes, failure TTL, and in-flight dedupe.
      const fetchSeriesHistory = async (
        seriesId: string,
        signal: AbortSignal,
        options?: { exhaustive?: boolean; allowFailedRetry?: boolean },
      ) => {
        const exhaustive = Boolean(options?.exhaustive);
        const allowFailedRetry = Boolean(options?.allowFailedRetry);
        const cached = seriesCacheRef.current.get(seriesId);
        const now = Date.now();
        if (cached && now - cached.fetchedAt < SERIES_REFRESH_MS) {
          return cached.history;
        }
        const failed = failedSeriesCacheRef.current.get(seriesId);
        if (!allowFailedRetry && failed && now - failed.failedAt < SERIES_FAILURE_TTL_MS) {
          return [];
        }

        const inFlightKey = `${seriesId}:${exhaustive ? 'full' : 'fast'}`;
        const inFlight = seriesInFlightRef.current.get(inFlightKey);
        if (inFlight) {
          return inFlight;
        }

        const loadPromise = (async () => {
          if (signal.aborted) return [];
          const endpoints = getRankedSeriesEndpoints(seriesId, exhaustive);
          for (const endpoint of endpoints) {
            const seriesResponse = await fetch(endpoint.path, { signal }).catch(() => null);
            if (signal.aborted) return [];
            if (!seriesResponse?.ok) continue;
            const seriesData = seriesResponse ? await seriesResponse.json().catch(() => null) : null;
            const normalizedHistory = normalizeSeriesHistory(seriesData);
            if (normalizedHistory.length > 0) {
              seriesCacheRef.current.set(seriesId, {
                fetchedAt: now,
                history: normalizedHistory,
              });
              failedSeriesCacheRef.current.delete(seriesId);
              seriesEndpointPreferenceRef.current.set(seriesId, endpoint.key);
              return normalizedHistory;
            }
          }
          if (!signal.aborted) {
            failedSeriesCacheRef.current.set(seriesId, { failedAt: now });
          }
          return [];
        })();

        seriesInFlightRef.current.set(inFlightKey, loadPromise);
        try {
          return await loadPromise;
        } finally {
          seriesInFlightRef.current.delete(inFlightKey);
        }
      };

      // Tries all candidate IDs for a market and chooses the best non-flat history for chart rendering.
      const fetchBestSeriesHistory = async (
        marketItem: any,
        signal: AbortSignal,
        options?: { exhaustive?: boolean; allowFailedRetry?: boolean },
      ) => {
        const conditionKey = String(
          marketItem?.conditionId ||
          marketItem?.condition_id ||
          marketItem?.id ||
          marketItem?.marketId ||
          '',
        ).trim();
        const tokenKeys = getTokenIdsForMarket(marketItem);
        const candidateIds = Array.from(new Set(
          (options?.exhaustive
            ? [...tokenKeys, conditionKey]
            : (tokenKeys.length ? tokenKeys : [conditionKey])
          ).filter(Boolean),
        ));
        let bestHistory: ChartPoint[] = [];
        for (const candidateId of candidateIds) {
          const history = await fetchSeriesHistory(candidateId, signal, {
            exhaustive: options?.exhaustive,
            allowFailedRetry: options?.allowFailedRetry,
          });
          if (history.length <= 1) continue;
          if (!bestHistory.length || getSeriesRange(history) > getSeriesRange(bestHistory)) {
            bestHistory = history;
          }
          const isGoodEnough = getSeriesRange(history) > 0.15 || history.length >= 40;
          if (!options?.exhaustive || isGoodEnough) {
            break;
          }
        }

        if (!bestHistory.length) {
          const inlineCandidates = [
            marketItem?.series,
            marketItem?.history,
            marketItem?.priceHistory,
            marketItem?.priceHistoryData,
            marketItem?.chartData,
          ];
          const inlineHistories = inlineCandidates
            .map((candidate) => normalizeSeriesHistory(candidate))
            .filter((history) => history.length > 1);
          if (!inlineHistories.length) return [];
          inlineHistories.sort((a, b) => {
            const rangeDelta = getSeriesRange(b) - getSeriesRange(a);
            if (Math.abs(rangeDelta) > 0.0001) return rangeDelta;
            return b.length - a.length;
          });
          return inlineHistories[0];
        }
        return bestHistory;
      };

      // Main event-page refresh pipeline: event fetch, chart history fetch, orderbook fetch, and store update.
      const fetchMarketData = async (
        options: {
          includeChat: boolean;
          includeSeries: boolean;
          allowSeriesFailedRetry?: boolean;
        },
      ) => {
        activeRequestRef.current?.abort();
        const controller = new AbortController();
        activeRequestRef.current = controller;

        try {
          const data = await fetchEventWithRetry(controller.signal, options.includeChat);

          if (data && data.length > 0) {
            const event = data[0];
            const markets = event.markets || [];

            if (markets.length > 0) {
              const market = markets[0];
              const conditionId = market.conditionId;
              const tokenID = market.tokenID || market.tokens?.[0]?.token_id;
              const isMultiOutcome = markets.length > 1;

              setPredictActiveMarketKey(conditionId);

              const outcomePrices = parseOutcomePrices(market.outcomePrices);
              const baseOutcomePrices = isMultiOutcome
                ? markets.map((m: any) => {
                    const prices = parseOutcomePrices(m.outcomePrices);
                    return prices[0] ?? 0;
                  })
                : outcomePrices;

              let nextChartData: Record<string, ChartPoint[]> | null = null;
              if (options.includeSeries) {
                type RankedSeriesMarket = {
                  marketItem: any;
                  index: number;
                  probability: number;
                };
                const rankedSeriesMarkets = isMultiOutcome
                  ? markets
                      .map((marketItem: any, index: number) => ({
                        marketItem,
                        index,
                        probability: Number(baseOutcomePrices[index] ?? 0),
                      }))
                      .sort((a: RankedSeriesMarket, b: RankedSeriesMarket) => b.probability - a.probability)
                      .slice(0, 4)
                  : [{ marketItem: market, index: 0, probability: Number(baseOutcomePrices[0] ?? 0) }];

                const seriesEntries = await Promise.all(
                  rankedSeriesMarkets.map(async ({ marketItem, index }: RankedSeriesMarket) => {
                    let history = await fetchBestSeriesHistory(marketItem, controller.signal, {
                      exhaustive: false,
                      allowFailedRetry: options.allowSeriesFailedRetry,
                    });
                    if (history.length === 0) {
                      history = await fetchBestSeriesHistory(marketItem, controller.signal, {
                        exhaustive: true,
                        allowFailedRetry: options.allowSeriesFailedRetry,
                      });
                    }
                    if (history.length === 0) return null;
                    return {
                      index,
                      label: getOutcomeLabel(marketItem, index),
                      normalizedLabel: normalizeOutcomeKey(getOutcomeLabel(marketItem, index)),
                      history,
                    };
                  }),
                );

                const chartPoints = seriesEntries
                  .filter(Boolean)
                  .reduce((acc: Record<string, ChartPoint[]>, item: any) => {
                    acc[item.label] = item.history;
                    acc[`__index_${item.index}`] = item.history;
                    acc[`__label_${item.normalizedLabel}`] = item.history;
                    return acc;
                  }, {});

                if (Object.keys(chartPoints).length > 0) {
                  const firstSeries = (seriesEntries.find(Boolean) as any)?.history;
                  if (firstSeries?.length) {
                    chartPoints.Primary = firstSeries;
                  }
                  nextChartData = chartPoints;
                  setChartData(chartPoints);
                } else {
                  const fallbackSeries = await fetchSeriesHistory(conditionId, controller.signal, {
                    exhaustive: true,
                    allowFailedRetry: options.allowSeriesFailedRetry,
                  });
                  if (fallbackSeries.length > 0) {
                    const fallbackChart = { Primary: fallbackSeries };
                    nextChartData = fallbackChart;
                    setChartData(fallbackChart);
                  }
                }
              }

              const orderbookTokenIdGroups: string[][] = isMultiOutcome
                ? markets.map((m: any) => getOrderbookTokenIdsForMarket(m))
                : [getOrderbookTokenIdsForMarket(market)];
              const outcomeLabels = isMultiOutcome
                ? markets.map((m: any) => getOutcomeLabel(m, 0))
                : (typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes) || ['Yes', 'No'];
              const selectedOutcomeIndex = Math.max(
                0,
                outcomeLabels.indexOf(selectedOutcomeRef.current || outcomeLabels[0]),
              );
              const orderbookGroupsToFetch = options.includeSeries
                ? orderbookTokenIdGroups
                : [orderbookTokenIdGroups[selectedOutcomeIndex] || orderbookTokenIdGroups[0]];
              const orderbookFetchTokenIds = Array.from(
                new Set(orderbookGroupsToFetch.flat().filter(Boolean)),
              );

              const orderbooksByTokenId = await fetchOrderbooks(orderbookFetchTokenIds, controller.signal);
              // Use polymarket outcomePrices as the source of truth for displayed probabilities.
              // Orderbooks are still fetched for the orderbook panel only.
              const displayOutcomePrices = baseOutcomePrices.map((basePrice: number) => {
                const normalized = toProbabilityUnit(basePrice);
                return Number.isFinite(normalized) ? normalized : 0;
              });

              const chatChannels = Array.isArray(event.series)
                ? event.series.flatMap((series: any) => series?.chats || [])
                : [];
              const openInterestValue = Number(event.openInterest ?? market.openInterest ?? 0);
              const holdersValue = market.holders ?? event.holders;

              const marketData = {
                contractId: conditionId,
                baseAsset: event.title || market.question,
                quoteAsset: 'USD',
                lastPrice: displayOutcomePrices[0] || 0,
                value: market.volume || market.volume24hr || 0,
                liquidity: market.liquidity || 0,
                openInterest: Number.isFinite(openInterestValue) ? openInterestValue : 0,
                holders: holdersValue,
                commentCount: Number(event.commentCount ?? 0),
                chats: chatChannels,
                outcomes: isMultiOutcome
                  ? markets.map((m: any) => m.groupItemTitle || m.question)
                  : (typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes) || ['Yes', 'No'],
                outcomePrices: displayOutcomePrices,
                eventTitle: event.title,
                eventSlug: event.slug,
                marketSlug: requestedRouteSlug,
                iconURL: event.image || event.icon,
                question: market.question,
                endDate: market.endDate,
                startDate: market.startDate || market.creationDate,
                enableDisplay: true,
                activeRaw: market.active,
                closedRaw: market.closed ?? event.closed ?? false,
                active: toBooleanFlag(market.active),
                closed: toBooleanFlag(market.closed ?? event.closed ?? false),
                tokenID: tokenID,
                orderbooks: orderbooksByTokenId,
                orderbookTokenIds: orderbookTokenIdGroups,
                markets: markets,
                volume24hr: market.volume24hr || 0,
                volumeNum: market.volumeNum || 0,
                description: market.description || event.description,
                tags: event.tags || [],
                source: 'polymarket',
                chartData: nextChartData,
              };

              setPredictMarketsData((prev: any) => ({
                ...prev,
                [conditionId]: {
                  ...marketData,
                  chartData: marketData.chartData ?? prev?.[conditionId]?.chartData,
                  orderbooks: {
                    ...(prev?.[conditionId]?.orderbooks || {}),
                    ...marketData.orderbooks,
                  },
                },
              }));

              writeCachedEvent({
                conditionId,
                cachedAt: Date.now(),
                chartData: nextChartData ?? predictMarketsRef.current?.[conditionId]?.chartData,
                marketData: {
                  ...marketData,
                  chartData: nextChartData ?? predictMarketsRef.current?.[conditionId]?.chartData,
                  // Keep cache light; live orderbooks are re-fetched when available.
                  orderbooks: {},
                },
              });

              if (marketData.outcomes?.length > 0 && !selectedOutcomeRef.current) {
                setSelectedOutcome(marketData.outcomes[0]);
              }
            }
          }
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            console.error('Error fetching market data:', error);
            const cached = readCachedEvent();
            if (cached) {
              applyCachedEvent(cached);
            }
          }
        }
      };

      // Track last heavy chart-series refresh; light refresh still runs every EVENT_REFRESH_MS.
      let lastSeriesRefreshAt = Date.now();
      fetchMarketData({ includeChat: true, includeSeries: true, allowSeriesFailedRetry: true });

      const refreshId = window.setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        const now = Date.now();
        const shouldRefreshSeries = now - lastSeriesRefreshAt >= SERIES_BACKGROUND_REFRESH_MS;
        fetchMarketData({
          includeChat: false,
          includeSeries: shouldRefreshSeries,
          allowSeriesFailedRetry: shouldRefreshSeries,
        });
        if (shouldRefreshSeries) {
          lastSeriesRefreshAt = now;
        }
      }, EVENT_REFRESH_MS);
      return () => {
        window.clearInterval(refreshId);
        activeRequestRef.current?.abort();
      };
    }
    return undefined;
  }, [marketSlug, setPredictActiveMarketKey, setPredictMarketsData]);

  // Process outcomes data
  const outcomes: OutcomeData[] = useMemo(() => {
    if (!activeMarket || Object.keys(activeMarket).length === 0) return [];
    const outcomeLabels = Array.isArray(activeMarket?.outcomes)
      ? activeMarket.outcomes.filter((item: any) => item != null && String(item).trim() !== '')
      : [];
    const outcomePrices = Array.isArray(activeMarket?.outcomePrices) ? activeMarket.outcomePrices : [];
    if (!outcomeLabels.length || !outcomePrices.length) return [];
    const markets = activeMarket?.markets || [];
    const isMultiOutcome = markets.length > 1;

    const outcomeData = outcomeLabels.map((label: string, idx: number) => {
      const price = Number(outcomePrices[idx] ?? 0);
      const marketForOutcome = isMultiOutcome ? markets[idx] : markets[0];
      const marketVolume = marketForOutcome?.volume24hr || marketForOutcome?.volume || 0;

      const closedFlag = toBooleanFlag(
        marketForOutcome?.closed ??
        marketForOutcome?.resolved ??
        marketForOutcome?.isResolved ??
        false,
      );
      const explicitlyInactive = marketForOutcome?.active != null && !toBooleanFlag(marketForOutcome.active);
      const endDateRaw =
        marketForOutcome?.endDate ??
        marketForOutcome?.end_date ??
        marketForOutcome?.endDatetime ??
        marketForOutcome?.endTime;
      const endDateMs = endDateRaw ? Date.parse(String(endDateRaw)) : NaN;
      const endedByDate = Number.isFinite(endDateMs) && endDateMs <= Date.now();
      const isConcluded = isMultiOutcome && (closedFlag || explicitlyInactive || endedByDate);

      return {
        chartKey: `__index_${idx}`,
        name: label,
        probability: price,
        volume: marketVolume || (activeMarket?.volume24hr || 0) / outcomeLabels.length,
        yesPrice: price,
        noPrice: Math.max(0, Math.min(1, 1 - price)),
        color: OUTCOME_COLORS[idx % OUTCOME_COLORS.length],
        isConcluded,
      };
    });

    const filteredOutcomeData = isMultiOutcome
      ? outcomeData.filter((outcome: OutcomeData) => !outcome.isConcluded)
      : outcomeData;
    const displayOutcomeData = filteredOutcomeData.length ? filteredOutcomeData : outcomeData;

    if (displayOutcomeData.length > 2) {
      displayOutcomeData.sort((a: OutcomeData, b: OutcomeData) => b.probability - a.probability);
    }

    return displayOutcomeData;
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
    if (!outcomes.length) return;
    if (!selectedOutcome || !outcomes.some((outcome: OutcomeData) => outcome.name === selectedOutcome)) {
      setSelectedOutcome(outcomes[0].name);
    }
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

  // Seeds the recent-activity list from data-api and appends live trade ticks from Polymarket market WS.
  useEffect(() => {
    const conditionId = String(activeMarket?.contractId || '').trim();
    if (!conditionId) {
      setLiveTrades([]);
      setLiveTradesConnected(false);
      setLiveTradesError(null);
      return;
    }

    let cancelled = false;
    let ws: WebSocket | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanupTimers = () => {
      if (pingTimer) {
        clearInterval(pingTimer);
        pingTimer = null;
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const mergeTrades = (incoming: LiveTrade[]) => {
      if (!incoming.length) return;
      setLiveTrades((prev) => {
        const deduped = new Map<string, LiveTrade>();
        [...incoming, ...prev].forEach((trade) => {
          if (!deduped.has(trade.key)) {
            deduped.set(trade.key, trade);
          }
        });
        return Array.from(deduped.values())
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, LIVE_TRADES_MAX_ITEMS);
      });
    };

    const mapTrade = (raw: any, source: 'history' | 'stream'): LiveTrade | null => {
      const assetId = String(raw?.asset ?? raw?.asset_id ?? '').trim();
      const side = parseTradeSide(raw?.side);
      const price = Number(raw?.price ?? raw?.last_trade_price ?? raw?.lastTradePrice ?? 0);
      const size = Number(raw?.size ?? raw?.amount ?? raw?.quantity ?? 0);
      if (!assetId || !Number.isFinite(price) || !Number.isFinite(size)) {
        return null;
      }
      const timestamp = parseTradeTimestampSeconds(raw?.timestamp ?? raw?.time ?? raw?.createdAt);
      const txHash = String(raw?.transactionHash ?? raw?.txHash ?? raw?.tx_hash ?? '').trim();
      const trader = String(raw?.proxyWallet ?? raw?.maker ?? raw?.taker ?? raw?.user ?? '').trim();
      const outcome = String(
        raw?.outcome ??
          activityOutcomeByAsset.get(assetId) ??
          activityOutcomeByAsset.get(normalizeTradeAssetId(assetId)) ??
          '',
      ).trim();
      const stableKey = txHash
        ? `${txHash}:${assetId}:${side}`
        : `${assetId}:${timestamp}:${side}:${price}:${size}`;
      return {
        key: stableKey,
        timestamp,
        side,
        price,
        size,
        assetId,
        conditionId,
        outcome,
        trader,
        txHash,
        source,
      };
    };

    const seedRecentTrades = async () => {
      try {
        const response = await fetch(
          `/predictdata/trades?market=${encodeURIComponent(conditionId)}&limit=${LIVE_TRADES_SEED_LIMIT}`,
        );
        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(`trade seed failed (${response.status}) ${body.slice(0, 120)}`);
        }
        const rows = await response.json().catch(() => []);
        if (!Array.isArray(rows)) return;
        const seeded = rows
          .map((row: any) => mapTrade(row, 'history'))
          .filter(Boolean) as LiveTrade[];
        if (!cancelled) {
          mergeTrades(seeded);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Predict trade seed failed:', error);
          setLiveTradesError('Could not load recent trades');
        }
      }
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      cleanupTimers();
      reconnectTimer = setTimeout(() => {
        if (!cancelled) connectLiveStream();
      }, LIVE_TRADES_WS_RECONNECT_MS);
    };

    const connectLiveStream = () => {
      if (!activityTokenIds.length || cancelled) {
        setLiveTradesConnected(false);
        return;
      }

      try {
        ws = new WebSocket('wss://ws-subscriptions-clob.polymarket.com/ws/market');
      } catch (error) {
        console.warn('Predict trade stream init failed:', error);
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        if (cancelled || !ws) return;
        setLiveTradesConnected(true);
        setLiveTradesError(null);
        try {
          ws.send(JSON.stringify({ assets_ids: activityTokenIds, type: 'market' }));
        } catch (error) {
          console.warn('Predict trade stream subscribe failed:', error);
        }

        cleanupTimers();
        pingTimer = setInterval(() => {
          if (!ws || ws.readyState !== WebSocket.OPEN) return;
          try {
            ws.send('PING');
          } catch (error) {
            console.warn('Predict trade stream ping failed:', error);
          }
        }, LIVE_TRADES_WS_PING_MS);
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const rawData = typeof event.data === 'string' ? event.data : String(event.data);
          if (rawData === 'PONG' || rawData === 'CONNECTED') return;
          const payload = JSON.parse(rawData);
          const events = Array.isArray(payload) ? payload : [payload];
          const updates = events
            .filter((item: any) => item?.event_type === 'last_trade_price')
            .map((item: any) => mapTrade(item, 'stream'))
            .filter(Boolean) as LiveTrade[];
          mergeTrades(updates);
        } catch (error) {
          // Ignore unknown frames.
          if (import.meta.env.DEV) {
            console.debug('Predict trade stream parse skipped:', error);
          }
        }
      };

      ws.onerror = (error) => {
        if (cancelled) return;
        console.warn('Predict trade stream error:', error);
        setLiveTradesConnected(false);
        setLiveTradesError('Trade stream disconnected');
      };

      ws.onclose = () => {
        if (cancelled) return;
        setLiveTradesConnected(false);
        scheduleReconnect();
      };
    };

    setLiveTrades([]);
    setLiveTradesConnected(false);
    setLiveTradesError(null);
    seedRecentTrades();
    connectLiveStream();

    return () => {
      cancelled = true;
      cleanupTimers();
      if (ws) {
        try {
          ws.close();
        } catch {
          // Ignore close failures.
        }
      }
    };
  }, [activeMarket?.contractId, activityTokenIds, activityOutcomeByAsset]);

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
    // Converts raw book levels into typed numeric {price, size} rows.
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
  // Converts selected orderbook row price into a prefilled limit-order value (in cents).
  const handleOrderbookLimit = useCallback((price: number) => {
    if (!Number.isFinite(price)) return;
    setOrderType('Limit');
    setLimitPrice(Math.round(price * 100));
  }, []);

  useEffect(() => {
    setLimitPriceInput(String(limitPrice));
  }, [limitPrice]);

  const clampLimitPrice = useCallback((value: number) => {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(99, Math.round(value)));
  }, []);

  const handleLimitPriceInputChange = useCallback((rawValue: string) => {
    const digitsOnly = rawValue.replace(/[^0-9]/g, '');
    if (digitsOnly === '') {
      setLimitPriceInput('');
      setLimitPrice(0);
      return;
    }
    const parsed = clampLimitPrice(Number(digitsOnly));
    setLimitPriceInput(String(parsed));
    setLimitPrice(parsed);
  }, [clampLimitPrice]);

  const handleLimitPriceInputBlur = useCallback(() => {
    const parsed = clampLimitPrice(Number(limitPriceInput || '0'));
    setLimitPriceInput(String(parsed));
    setLimitPrice(parsed);
  }, [clampLimitPrice, limitPriceInput]);

  // Calculate potential win
  const toWin = useMemo(() => {
    if (!amount || !selectedOutcomeData) return '0.00';
    const price = selectedSide === 'Yes' ? selectedOutcomeData.yesPrice : selectedOutcomeData.noPrice;
    if (price <= 0) return '0.00';
    const potentialWin = (Number(amount) / price) - Number(amount);
    return potentialWin.toFixed(2);
  }, [amount, selectedOutcomeData, selectedSide]);

  // Builds a compact "Xd Yh" / "Xh Ym" countdown string from the event end date.
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
      seriesRefs.current.set(outcome.chartKey, lineSeries);
    });

    // Keeps chart dimensions synced with the container on viewport changes.
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
      const series = seriesRefs.current.get(outcome.chartKey);
      if (!series) return;

      const directByIndex = filterSeriesByInterval(chartData[outcome.chartKey] || [], selectedInterval);
      const directByLabel = filterSeriesByInterval(chartData[outcome.name] || [], selectedInterval);
      const normalizedKey = normalizeOutcomeKey(outcome.name);
      const directByNormalized = filterSeriesByInterval(
        chartData[`__label_${normalizedKey}`] || [],
        selectedInterval,
      );
      const directCandidates = [directByLabel, directByNormalized, directByIndex]
        .filter((candidate) => candidate.length > 1)
        .sort((a, b) => {
          const rangeDelta = getSeriesRange(b) - getSeriesRange(a);
          if (Math.abs(rangeDelta) > 0.0001) return rangeDelta;
          return b.length - a.length;
        });
      const directOutcomeData = directCandidates[0] || [];
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

  // Toggles outcome table sorting by column and direction.
  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Adds quick-select dollar presets to the market-order amount.
  const handlePreset = (value: number) => {
    setAmount(prev => (Number(prev || 0) + value).toString());
  };

  // Placeholder order submit handler (currently logs intent; real execution is TODO).
  const handlePlaceOrder = () => {
    if (!selectedOutcome || !amount || Number(amount) <= 0) return;
    console.log('Place order:', { selectedOutcome, selectedSide, orderType, amount });
    // TODO: Implement actual order placement
  };

  // Formats large volume figures into compact currency strings.
  const formatVolume = (vol: number | string | undefined | null) => {
    const numVol = Number(vol) || 0;
    if (numVol >= 1e9) return `$${(numVol / 1e9).toFixed(1)}B`;
    if (numVol >= 1e6) return `$${(numVol / 1e6).toFixed(1)}M`;
    if (numVol >= 1e3) return `$${(numVol / 1e3).toFixed(1)}K`;
    return `$${numVol.toFixed(0)}`;
  };

  // Formats event dates for header display.
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
  const isClosed = toBooleanFlag(activeMarket?.closed ?? activeMarket?.closedRaw);
  const isActive = toBooleanFlag(activeMarket?.active ?? activeMarket?.activeRaw ?? true);
  const isResolved = isClosed || !isActive;
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
  const activityTrades = activityTab === 'all' ? liveTrades : [];

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
                <div key={`${outcome.chartKey}-${idx}`} className="predict-event-legend-item">
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
              {sortedOutcomes.map((outcome, idx) => (
                <div
                  key={`${outcome.chartKey}-${idx}`}
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
                  <div
                    className="predict-event-outcome-col predict-event-outcome-actions-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
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
                      type="button"
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
                      onClick={() => setLimitPrice((prev) => clampLimitPrice(prev - 1))}
                    >
                      −
                    </button>
                    <div className="predict-event-limit-value">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={limitPriceInput}
                        disabled={isTradingDisabled}
                        onChange={(e) => handleLimitPriceInputChange(e.target.value)}
                        onBlur={handleLimitPriceInputBlur}
                        className="predict-event-limit-value-input"
                        aria-label="Limit price in cents"
                      />
                      <span className="predict-event-limit-value-suffix">¢</span>
                    </div>
                    <button
                      className="predict-event-limit-btn"
                      disabled={isTradingDisabled}
                      onClick={() => setLimitPrice((prev) => clampLimitPrice(prev + 1))}
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
              <div className="predict-event-activity-controls">
                {activityTab === 'all' && (
                  <span
                    className={`predict-event-activity-status-pill ${
                      liveTradesConnected ? 'connected' : 'disconnected'
                    }`}
                  >
                    {liveTradesConnected ? 'Live' : 'Reconnecting'}
                  </span>
                )}
                <button
                  type="button"
                  className="predict-event-activity-hide-btn"
                  onClick={() => setIsActivityHidden((prev) => !prev)}
                >
                  {isActivityHidden ? 'Show' : 'Hide'}
                </button>
              </div>
            </div>
            {!isActivityHidden && (
              <>
                <div className="predict-event-activity-tabs">
                  <button
                    type="button"
                    className={`predict-event-activity-tab ${activityTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActivityTab('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`predict-event-activity-tab ${activityTab === 'openOrders' ? 'active' : ''}`}
                    onClick={() => setActivityTab('openOrders')}
                  >
                    Open Orders
                  </button>
                </div>
                <div className="predict-event-activity-list">
                  {activityTab === 'openOrders' && (
                    <div className="predict-event-activity-empty">
                      Open orders activity will appear here
                    </div>
                  )}
                  {activityTab === 'all' && liveTradesError && (
                    <div className="predict-event-activity-message error">
                      {liveTradesError}
                    </div>
                  )}
                  {activityTab === 'all' && activityTrades.length === 0 && (
                    <div className="predict-event-activity-empty">
                      {liveTradesConnected ? 'Waiting for trades...' : 'Connecting to trade stream...'}
                    </div>
                  )}
                  {activityTab === 'all' && activityTrades.length > 0 && (
                    <div className="predict-event-activity-rows">
                      {activityTrades.map((trade) => {
                        const sideClass = trade.side === 'BUY'
                          ? 'buy'
                          : trade.side === 'SELL'
                            ? 'sell'
                            : 'unknown';
                        const sideLabel = trade.side === 'UNKNOWN' ? 'TRADE' : trade.side;
                        const tradeOutcome = String(
                          trade.outcome ||
                            activityOutcomeByAsset.get(trade.assetId) ||
                            activityOutcomeByAsset.get(normalizeTradeAssetId(trade.assetId)) ||
                            'Unknown outcome',
                        ).trim();

                        return (
                          <div key={trade.key} className={`predict-event-activity-row ${sideClass}`}>
                            <div className="predict-event-activity-main">
                              <span className={`predict-event-activity-side ${sideClass}`}>
                                {sideLabel}
                              </span>
                              <span className="predict-event-activity-outcome" title={tradeOutcome}>
                                {tradeOutcome}
                              </span>
                            </div>
                            <div className="predict-event-activity-metrics">
                              <span className="predict-event-activity-price">
                                {formatActivityPrice(trade.price)}
                              </span>
                              <span className="predict-event-activity-size">
                                {formatActivitySize(trade.size)}
                              </span>
                              <span className="predict-event-activity-time">
                                {formatActivityTime(trade.timestamp)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predict;
