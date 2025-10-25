import { Search, Edit2, Bell } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import copy from '../../assets/copy.svg'
import closebutton from '../../assets/close_button.png'
import monadicon from '../../assets/monadlogo.svg';
import trash from '../../assets/trash.svg';
import lightning from '../../assets/flash.png';
import filter from '../../assets/filter.svg';
import gas from '../../assets/gas.svg';
import slippage from '../../assets/slippage.svg';
import { settings } from '../../settings';
import { loadBuyPresets } from '../../utils/presetManager';
import PortfolioContent from '../Portfolio/BalancesContent/BalancesContent';
import PortfolioHeader from '../Portfolio/BalancesHeader/PortfolioHeader';
import { createPublicClient, http } from 'viem';
import ImportWalletsPopup from './ImportWalletsPopup';

const SUBGRAPH_URL = 'https://gateway.thegraph.com/api/b9cc5f58f8ad5399b2c4dd27fa52d881/subgraphs/id/BJKD3ViFyTeyamKBzC1wS7a3XMuQijvBehgNaSBb197e';

export type GqlPosition = {
  tokenId: string;
  symbol?: string;
  name?: string;
  imageUrl?: string;
  boughtTokens: number;
  soldTokens: number;
  spentNative: number;
  receivedNative: number;
  remainingTokens: number;
  remainingPct: number;
  pnlNative: number;
  lastPrice: number;
  isOrderbook?: boolean;
};

const fetchPortfolio = async (address: string) => {
  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `
          query ($a: Bytes!) {
            launchpadPositions(
              where: { account: $a, tokens_gt: "0" }
              orderBy: tokens
              orderDirection: desc
              first: 1000
            ) {
              token {
                id
                symbol
                name
                lastPriceNativePerTokenWad
                metadataCID
                migrated
                migratedMarket { id }
              }
              account { id }
              tokenBought
              tokenSold
              nativeSpent
              nativeReceived
              tokens
              lastUpdatedAt
            }
          }
        `,
        variables: { a: address.toLowerCase() },
      }),
    });

    const result = await response.json();
    console.log('[Tracker] fetchPortfolio response for', address, ':', result);

    const { data, errors } = result;
    if (errors) {
      console.error('[Tracker] GraphQL errors:', errors);
    }

    const allPositions: any[] = data?.launchpadPositions ?? [];

    // Separate launchpad (not migrated) and orderbook (migrated) positions
    const launchpadRows = allPositions.filter((p: any) => !p.token.migrated);
    const orderbookRows = allPositions.filter((p: any) => p.token.migrated);

    console.log('[Tracker] fetchPortfolio parsed:', {
      totalPositions: allPositions.length,
      launchpadCount: launchpadRows.length,
      orderbookCount: orderbookRows.length,
      address
    });

    const positions: GqlPosition[] = [
      ...launchpadRows.map((p: any) => {
        const boughtTokens = Number(p.tokenBought) / 1e18;
        const soldTokens = Number(p.tokenSold) / 1e18;
        const spentNative = Number(p.nativeSpent) / 1e18;
        const receivedNative = Number(p.nativeReceived) / 1e18;
        const remainingTokens = Number(p.tokens) / 1e18;
        const lastPrice = Number(p.token.lastPriceNativePerTokenWad) / 1e9;

        return {
          tokenId: p.token.id,
          symbol: p.token.symbol,
          name: p.token.name,
          imageUrl: p.token.metadataCID
            ? `https://pub-8aff0f9ec88b4fff8cdce3f213f21b7f.r2.dev/img/${p.token.metadataCID}.png`
            : undefined,
          boughtTokens,
          soldTokens,
          spentNative,
          receivedNative,
          remainingTokens,
          remainingPct: boughtTokens > 0 ? (remainingTokens / boughtTokens) * 100 : 0,
          pnlNative: (remainingTokens * lastPrice) + receivedNative - spentNative,
          lastPrice,
          isOrderbook: false,
        };
      }),
      ...orderbookRows.map((p: any) => {
        const boughtTokens = Number(p.tokenBought) / 1e18;
        const soldTokens = Number(p.tokenSold) / 1e18;
        const spentNative = Number(p.nativeSpent) / 1e18;
        const receivedNative = Number(p.nativeReceived) / 1e18;
        const remainingTokens = Number(p.tokens) / 1e18;
        const lastPrice = Number(p.token.lastPriceNativePerTokenWad) / 1e9;

        return {
          tokenId: p.token.id,
          symbol: p.token.symbol,
          name: p.token.name,
          imageUrl: p.token.metadataCID
            ? `https://pub-8aff0f9ec88b4fff8cdce3f213f21b7f.r2.dev/img/${p.token.metadataCID}.png`
            : undefined,
          boughtTokens,
          soldTokens,
          spentNative,
          receivedNative,
          remainingTokens,
          remainingPct: boughtTokens > 0 ? (remainingTokens / boughtTokens) * 100 : 0,
          pnlNative: (remainingTokens * lastPrice) + receivedNative - spentNative,
          lastPrice,
          isOrderbook: true,
        };
      }),
    ];

    return {
      address,
      nativeBalance: 0,
      positions,
    };
  } catch (error) {
    console.error('[Tracker] Error fetching portfolio:', error);
    return {
      address,
      nativeBalance: 0,
      positions: [],
    };
  }
};

import LiveTradesFiltersPopup from './LiveTradesFiltersPopup/LiveTradesFiltersPopup';
import EmojiPicker from 'emoji-picker-react';
import { useSharedContext } from '../../contexts/SharedContext';
import MonitorFiltersPopup, { MonitorFilterState } from './MonitorFiltersPopup/MonitorFiltersPopup';
import settingsicon from '../../assets/settings.svg';
import circle from '../../assets/circle_handle.png';
import key from '../../assets/key.svg';
import defaultPfp from '../../assets/leaderboard_default.png';
import {
  SHOW_DEMO_TRADES,
  SHOW_DEMO_MONITOR,
  SHOW_DEMO_WALLETS,
  DEMO_TRADES,
  DEMO_MONITOR_TOKENS,
  DEMO_WALLETS,
} from './trackerDemoData';

import './Tracker.css';

import { watchContractEvent, getPublicClient } from 'wagmi/actions';
import { config } from '../../wagmi' 
import { CrystalMarketAbi } from '../../abis/CrystalMarketAbi';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi'; 
import { CrystalLaunchpadToken } from '../../abis/CrystalLaunchpadToken';


interface TrackedWallet {
  address: string;
  name: string;
  emoji: string;
  balance: number;          
  lastActiveAt: number | null; 
  id: string;
  createdAt: string;
}

interface LiveTrade {
  id: string;
  walletName: string;
  emoji: string;
  token: string;
  tokenName: string;
  amount: number;
  price: number;
  marketCap: number;
  time: string;
  txHash: string;
  type: 'buy' | 'sell';
  createdAt: string;
}

interface TrackerProps {
  isBlurred: boolean;
  setpopup: (value: number) => void;
  onImportWallets?: (walletsText: string, addToSingleGroup: boolean) => void;
  onApplyFilters?: (filters: FilterState) => void;
  activeFilters?: FilterState;
  monUsdPrice: number;
  activechain?: number;
  walletTokenBalances?: { [address: string]: any };
  connected?: boolean;
  address?: string | null;
  getWalletIcon?: () => string;
  onDepositClick?: () => void;
  onDisconnect?: () => void;
  t?: (k: string) => string;
}

// Add Position interface from MemeOrderCenter
interface Position {
  tokenId: string;
  symbol?: string;
  name?: string;
  metadataCID?: string;
  imageUrl?: string;
  boughtTokens: number;
  soldTokens: number;
  spentNative: number;
  receivedNative: number;
  remainingTokens: number;
  remainingPct: number;
  pnlNative: number;
  lastPrice: number;
}

// Enhanced MonitorToken to include position data
interface MonitorToken {
  id: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  emoji: string;
  price: number;
  marketCap: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  holders: number;
  buyTransactions: number;
  sellTransactions: number;
  bondingCurveProgress: number;
  txCount: number;
  volume5m: number;
  volume1h: number;
  volume6h: number;
  priceChange5m: number;
  priceChange1h: number;
  priceChange6h: number;
  priceChange24h: number;
  website: string;
  twitter: string;
  telegram: string;
  createdAt: string;
  lastTransaction: string;
  trades: TokenTrade[];
  positions?: Position[];
  totalPnl?: number;
  totalRemainingTokens?: number;
}

// Helper: fetch recent trades
const fetchRecentTradesForWallet = async (account: string, first = 50) => {
  const url = SUBGRAPH_URL;
  if (!url) return [];

  const tryPost = async (body: any) => {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json());
  };

  const q1 = `query ($account: String!, $first: Int!) { trades(where: { account: $account }, orderBy: block, orderDirection: desc, first: $first) { id token { id symbol name } account { id } block isBuy priceNativePerTokenWad amountIn amountOut txHash } }`;
  try {
    const resp = await tryPost({ query: q1, variables: { account: account.toLowerCase(), first } });
    const list = resp?.data?.trades;
    if (Array.isArray(list) && list.length) return list;
  } catch (e) {
  }

  const q2 = `query ($account: [Bytes!], $first: Int!) { launchpadTokens(first: 1000) { id symbol name trades(where: { account_in: $account }, orderBy: block, orderDirection: desc, first: $first) { id account { id } block isBuy priceNativePerTokenWad amountIn amountOut txHash } } }`;
  try {
    const resp2 = await tryPost({ query: q2, variables: { account: [account.toLowerCase()], first } });
    const tokens = resp2?.data?.launchpadTokens;
    if (Array.isArray(tokens)) {
      const out: any[] = [];
      for (const t of tokens) {
        if (!t?.trades) continue;
        for (const tr of t.trades) {
          try { tr.token = tr.token || { id: t.id, symbol: t.symbol, name: t.name }; } catch (e) {}
          out.push(tr);
        }
      }
      out.sort((a,b) => (Number(b.block) || 0) - (Number(a.block) || 0));
      return out.slice(0, first);
    }
  } catch (e) {}

  return [];
};

interface TokenTrade {
  id: string;
  wallet: string;
  emoji: string;
  timeInTrade: string;
  exitStatus?: 'Exited';
  bought: number;
  boughtTxns: number;
  sold: number;
  soldTxns: number;
  pnl: number;
  remaining: number;
}

export interface FilterState {
  transactionTypes: {
    buyMore: boolean;
    firstBuy: boolean;
    sellPartial: boolean;
    sellAll: boolean;
    addLiquidity: boolean;
    removeLiquidity: boolean;
  };
  marketCap: {
    min: string;
    max: string;
  };
  transactionAmount: {
    min: string;
    max: string;
  };
  tokenAge: {
    min: string;
    max: string;
  };
}
interface SortPreset {
  sortBy: string;
  order: 'asc' | 'desc';
}


const STORAGE_KEY = 'tracked_wallets_data';
const DISPLAY_SCALE = 1000;
const MONITOR_POLL_MS = 15000;
const SUPPLY = 1e9;


const saveWalletsToStorage = (wallets: TrackedWallet[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
  } catch (error) {
    console.error('Failed to save wallets to localStorage:', error);
  }
};

function chainCfgOf(activechain?: string | number) {
  const cc: any = settings.chainConfig;
  const raw =
    cc?.[activechain as any] ??
    cc?.[Number(activechain) as any] ??
    cc?.monad ??
    cc?.[10143];

  if (!raw) return undefined;

  const desiredId =
    typeof activechain === 'number'
      ? activechain
      : Number.isFinite(Number(activechain))
      ? Number(activechain)
      : undefined;

  const chainFromList =
    settings.chains?.find((c: any) =>
      desiredId != null ? c?.id === desiredId : (raw?.explorer && c?.blockExplorers?.default?.url?.includes(raw.explorer))
    ) ?? settings.chains?.[0];

  const id = chainFromList?.id;
  const rpcUrl =
    raw?.httpurl ??
    chainFromList?.rpcUrls?.default?.http?.[0] ??
    chainFromList?.rpcUrls?.alchemy?.http?.[0];

  return { ...raw, id, rpcUrl };
}


const loadWalletsFromStorage = (): TrackedWallet[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load wallets from localStorage:', error);
  }
  return [];
};

const isValidAddress = (addr: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
};

const SIMPLE_SORT_PRESETS: Record<string, SortPreset> = {
  latest: { sortBy: 'lastTransaction', order: 'desc' },
  marketCap: { sortBy: 'marketCap', order: 'desc' },
  liquidity: { sortBy: 'liquidity', order: 'desc' },
  txns: { sortBy: 'txCount', order: 'desc' },
  holders: { sortBy: 'holders', order: 'desc' },
  inflow: { sortBy: 'inflowVolume', order: 'desc' },
  outflow: { sortBy: 'outflowVolume', order: 'desc' },
  tokenAge: { sortBy: 'createdAt', order: 'asc' }
};
const Tooltip: React.FC<{
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
}> = ({ content, children, position = 'top', offset }) => {
  const [vis, setVis] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top + scrollY - 25;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollY + 25;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - 25;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + 25;
        break;
    }

    setTooltipPosition({ top, left });
  }, [position]);

  useEffect(() => {
    if (vis) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [vis, updatePosition]);

  

  return (
    <div
      ref={containerRef}
      className="tooltip-container"
      onMouseEnter={() => setVis(true)}
      onMouseLeave={() => setVis(false)}
    >
      {children}
      {vis && createPortal(
        <div
          className={`tooltip tooltip-${position} fade-popup visible`}
          style={{
            position: 'absolute',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: position === 'top' || position === 'bottom'
              ? 'translateX(-50%)'
              : position === 'left' || position === 'right'
                ? 'translateY(-50%)'
                : 'none',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          <div className="tooltip-content">
            {content}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

type MarketsMap = Map<string, MonitorToken>;
type TrackerTab = 'wallets' | 'trades' | 'monitor';
type SortDirection = 'asc' | 'desc';

const Tracker: React.FC<TrackerProps> = ({
  isBlurred,
  setpopup,
  onApplyFilters: externalOnApplyFilters,
  activeFilters: externalActiveFilters,
  monUsdPrice,
  walletTokenBalances = {},
  tokenList = [],
  marketsData = []
}) => {
  const [selectedSimpleFilter, setSelectedSimpleFilter] = useState<string | null>(null);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState<{top: number, left: number} | null>(null);
  const context = useSharedContext();
  const activechain = context?.activechain || 'monad';
  const [walletSortField, setWalletSortField] = useState<'balance' | 'lastActive' | null>(null);
  const [walletSortDirection, setWalletSortDirection] = useState<SortDirection>('desc');
  const [showMonitorFiltersPopup, setShowMonitorFiltersPopup] = useState(false);
  const initialStoredWallets = (() => { try { const s = localStorage.getItem('tracked_wallets_data'); return s ? JSON.parse(s) : []; } catch { return []; } })();
  const initialUsedDemoWallets = initialStoredWallets.length === 0 && SHOW_DEMO_WALLETS;
  const [demoMode, setDemoMode] = useState({ wallets: initialUsedDemoWallets, trades: SHOW_DEMO_TRADES, monitor: SHOW_DEMO_MONITOR });
  const disableDemo = (k: 'wallets'|'trades'|'monitor') => setDemoMode(m => ({ ...m, [k]: false }));
  const [trackedWalletTrades, setTrackedWalletTrades] = useState<LiveTrade[]>(demoMode.trades ? DEMO_TRADES : []);
  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>(() => {
    const stored = loadWalletsFromStorage();
    if (stored?.length) return stored.map(w => ({ ...w, createdAt: w.createdAt || new Date().toISOString(), lastActiveAt: (w as any).lastActiveAt ?? null }));
    return SHOW_DEMO_WALLETS ? (DEMO_WALLETS as any) : [];
  });


  const trackedWalletsRef = useRef(trackedWallets);
  const trackedWalletTradesRef = useRef(trackedWalletTrades);
  const [addressPositions, setAddressPositions] = useState<Record<string, GqlPosition[]>>({});
  useEffect(() => { trackedWalletsRef.current = trackedWallets; }, [trackedWallets]);
  useEffect(() => { trackedWalletTradesRef.current = trackedWalletTrades; }, [trackedWalletTrades]);

  const lastEventTsRef = useRef<number | null>(null);
  const setStatus = (extra: Record<string, any> = {}) => ((window as any).__TRACKER_STATUS__ = {
    chain: chainCfgOf(activechain)?.id,
    demoMode,
    trackedWalletsCount: trackedWalletsRef.current?.length ?? 0,
    tradesCount: trackedWalletTradesRef.current?.length ?? 0,
    lastEventAt: lastEventTsRef.current,
    ...extra
  });
  

  const normalizeTrade = useCallback((trade: any, wallets: TrackedWallet[]): LiveTrade => {
    const trackedWallet = wallets.find(
      w => w.address.toLowerCase() === trade.account.id.toLowerCase()
    );
    const isBuy = !!trade.isBuy;
    const nativeAmount = Number(isBuy ? trade.amountIn : trade.amountOut) / 1e18;
    const price = Number(trade.priceNativePerTokenWad) / 1e18;

    const TOTAL_SUPPLY = 1e9;
    const marketCap = price * TOTAL_SUPPLY;

    const timestamp = Number(trade.timestamp || 0);
    const now = Date.now() / 1000;
    const secondsAgo = Math.max(0, now - timestamp);
    let timeAgo = 'now';
    if (secondsAgo < 60) timeAgo = `${Math.floor(secondsAgo)}s`;
    else if (secondsAgo < 3600) timeAgo = `${Math.floor(secondsAgo / 60)}m`;
    else if (secondsAgo < 86400) timeAgo = `${Math.floor(secondsAgo / 3600)}h`;
    else timeAgo = `${Math.floor(secondsAgo / 86400)}d`;

    return {
      id: trade.id,
      walletName: trackedWallet?.name || 'Unknown',
      emoji: trackedWallet?.emoji || '👻',
      token: trade.token?.symbol || 'Unknown',
      tokenName: trade.token?.name || trade.token?.symbol || 'Unknown',
      amount: nativeAmount,
      price: price,
      marketCap: marketCap / DISPLAY_SCALE,
      time: timeAgo,
      txHash: trade.transaction?.id || trade.id,
      type: isBuy ? 'buy' : 'sell',
      createdAt: new Date(timestamp * 1000).toISOString(),
    };
  }, []);
  const toMon = (x: number) => (x > 1e12 ? x / 1e18 : x);
  const dedupeTrades = (arr: LiveTrade[]) => {
    const seen = new Set<string>();
    const out: LiveTrade[] = [];
    for (const t of arr) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        out.push(t);
      }
    }
    return out;
  };

  const [monitorFilters, setMonitorFilters] = useState<MonitorFilterState>({
    general: {
      lastTransaction: '',
      tokenAgeMin: '',
      tokenAgeMax: '',
    },
    market: {
      marketCapMin: '',
      marketCapMax: '',
      liquidityMin: '',
      liquidityMax: '',
      holdersMin: '',
      holdersMax: '',
    },
    transactions: {
      transactionCountMin: '',
      transactionCountMax: '',
      inflowVolumeMin: '',
      inflowVolumeMax: '',
      outflowVolumeMin: '',
      outflowVolumeMax: '',
    }
  });
  const chainCfg = chainCfgOf(activechain);

  const [tradeSortField, setTradeSortField] = useState<'dateCreated' | 'amount' | 'marketCap' | null>(null);
  const [tradeSortDirection, setTradeSortDirection] = useState<SortDirection>('desc');
  const [activeTab, setActiveTab] = useState<TrackerTab>('wallets');
  const [showFiltersPopup, setShowFiltersPopup] = useState(false);
  const [monitorTokens, setMonitorTokens] = useState<MonitorToken[]>(DEMO_MONITOR_TOKENS);
  const [portfolioMarkets, setPortfolioMarkets] = useState<MonitorToken[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [monitorCurrency, setMonitorCurrency] = useState<'USD' | 'MON'>('USD');
  const [isLoadingPortfolioMarkets, setIsLoadingPortfolioMarkets] = useState(false);
  const [walletCurrency, setWalletCurrency] = useState<'USD' | 'MON'>('USD');

  // Monitor column state
  const [quickAmounts, setQuickAmounts] = useState({ launchpad: '', orderbook: '' });
  const [activePresets, setActivePresets] = useState<Record<string, number>>({ launchpad: 1, orderbook: 1 });
  const [pausedColumn, setPausedColumn] = useState<string | null>(null);
  const [buyPresets, setBuyPresets] = useState<Record<number, any>>({});

  useEffect(() => {
    const presets = loadBuyPresets();
    setBuyPresets(presets);
  }, []);

  const setQuickAmount = (column: string, value: string) => {
    setQuickAmounts(prev => ({ ...prev, [column]: value }));
  };

  const setActivePreset = (column: string, preset: number) => {
    setActivePresets(prev => ({ ...prev, [column]: preset }));
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const [activeFilters, setActiveFilters] = useState<FilterState>(externalActiveFilters || {
    transactionTypes: {
      buyMore: true,
      firstBuy: true,
      sellPartial: true,
      sellAll: true,
      addLiquidity: true,
      removeLiquidity: true,
    },
    marketCap: {
      min: '',
      max: '',
    },
    transactionAmount: {
      min: '',
      max: '',
    },
    tokenAge: {
      min: '',
      max: '',
    },
  });
  const [selectedWallets, setSelectedWallets] = useState<Set<string>>(new Set());
  const [draggedWallet, setDraggedWallet] = useState<TrackedWallet | null>(null);
  const [selectionRect, setSelectionRect] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [activeSelectionContainer, setActiveSelectionContainer] = useState<'main' | null>(null);
  const [previewSelection, setPreviewSelection] = useState<Set<string>>(new Set());
  const [isMultiDrag, setIsMultiDrag] = useState(false);
  const [dragReorderState, setDragReorderState] = useState<{
    draggedIndex: number;
    dragOverIndex: number;
    dragOverPosition: 'top' | 'bottom' | null;
    draggedContainer: 'main' | null;
    dragOverContainer: 'main' | null;
  }>({
    draggedIndex: -1,
    dragOverIndex: -1,
    dragOverPosition: null,
    draggedContainer: null,
    dragOverContainer: null
  });
  const [dropPreviewLine, setDropPreviewLine] = useState<{ top: number; containerKey: string } | null>(null);
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());
  const [pinnedTokens, setPinnedTokens] = useState<Set<string>>(new Set());
  const marketsRef = useRef<MarketsMap>(new Map());
  const [marketsTick, setMarketsTick] = useState(0);
  const [debugVisible, setDebugVisible] = useState(false);
  const [forwardedLogCount, setForwardedLogCount] = useState(0);
  const [lastLogSummary, setLastLogSummary] = useState<string | null>(null);
  const [appListenerActive, setAppListenerActive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const marketSubsRef = useRef<Record<string, string>>({});
  const subIdRef = useRef<number>(1);
  // mappings addr/symbol -> market
  const tokenToMarketRef = useRef<Record<string, string>>({});
  const symbolToMarketRef = useRef<Record<string, string>>({});
  // event topic constants
  const ROUTER_EVENT = '0xfe210c99153843bc67efa2e9a61ec1d63c505e379b9dcf05a9520e84e36e6063';
  const MARKET_UPDATE_EVENT = '0xc367a2f5396f96d105baaaa90fe29b1bb18ef54c712964410d02451e67c19d3e';

  const txFromCacheRef = useRef(new Map<string, string>());

  const trackedSetRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    trackedSetRef.current = new Set(trackedWallets.map(w => w.address.toLowerCase()));
  }, [trackedWallets]);

  const push = useCallback(async (logs: any[], source: 'router' | 'market' | 'launchpad') => {
    if (!logs?.length) return;
    console.log('[Tracker] push called with', logs.length, 'logs from', source);
    if (demoMode.trades) { disableDemo('trades'); setTrackedWalletTrades([]); }
    lastEventTsRef.current = Date.now();
    setStatus({ lastPushSource: source });

    const lower = (s?: string) => (s || '').toLowerCase();
    const wallets = trackedWalletsRef.current;
    console.log('[Tracker] Tracked wallets:', wallets.map(w => w.address.toLowerCase()));
    console.log('[Tracker] trackedSetRef contents:', Array.from(trackedSetRef.current));
    const touchWallet = (addr: string) => {
      const key = lower(addr);
      if (!trackedSetRef.current.has(key)) return;
      setTrackedWallets(prev => prev.map(x => lower(x.address) === key ? { ...x, lastActiveAt: Date.now() } : x));
    };

    const toAdd: LiveTrade[] = [];

    for (const l of logs) {
      const args: any = l?.args ?? {};
      const txHash: string = l?.transactionHash ?? l?.transaction?.id ?? l?.id ?? '';
      console.log('[Tracker] Processing log:', { eventName: l.eventName, args, txHash });

      let accountAddr: string | null = (args.user || args.account || args.trader || args.sender || args.owner || args.from || args.buyer || args.seller) ?? null;

      if (accountAddr) {
        touchWallet(accountAddr);
      } else {
        console.log('[Tracker] Skipping log - no account address found');
        continue;
      }

      const lowerAccountAddr = lower(accountAddr);
      console.log('[Tracker] Checking if wallet is tracked:', {
        original: accountAddr,
        lowercase: lowerAccountAddr,
        isTracked: trackedSetRef.current.has(lowerAccountAddr),
        trackedSet: Array.from(trackedSetRef.current)
      });

      if (!trackedSetRef.current.has(lowerAccountAddr)) {
        console.log('[Tracker] ❌ Skipping trade - wallet not tracked:', accountAddr);
        console.log('[Tracker] Add this exact address to your Wallet Manager:', accountAddr);
        continue;
      }

      console.log('[Tracker] Processing trade for tracked wallet:', accountAddr);
      console.log('[Tracker] Raw event args:', JSON.stringify(args, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      , 2));

      const isBuy = Boolean(args.isBuy ?? args.buy ?? (args.from && !args.to));

      // Keep amounts as BigInt - they're already in wei from the contract
      const amountInWei = BigInt(args.amountIn ?? 0);
      const amountOutWei = BigInt(args.amountOut ?? 0);
      const priceWad = BigInt(args.priceNativePerTokenWad ?? args.price ?? args.endPrice ?? args.startPrice ?? 0);

      // For display/debug only
      const amountInEth = Number(amountInWei) / 1e18;
      const amountOutEth = Number(amountOutWei) / 1e18;
      const priceEth = Number(priceWad) / 1e18;

      const tokenAddr = String(args.market || args.token || args.tokenAddress || args.base || args.asset || args.tokenIn || args.tokenOut || (l as any)?.address || '').toLowerCase() || undefined;
      const symbol = (args.symbol || args.ticker || '').toString() || undefined;
      const ts = Math.floor(Date.now()/1000);

  // prefer live price when available
    // resolve market id - try token address first since that's most reliable
      const addrLower = tokenAddr ? tokenAddr.toLowerCase() : undefined;
      const symbolLower = (symbol || '').toLowerCase();

      // Try to find the token in marketsRef using address directly first
      const live = addrLower ? marketsRef.current.get(addrLower) : null;

      console.log('[Tracker] Token resolution:', {
        tokenAddr: addrLower,
        symbol,
        foundInMarkets: !!live,
        liveSymbol: live?.symbol,
        liveName: live?.name
      });

      // Use live price if available, convert to BigInt
      const livePriceWad = live?.price != null && live.price > 0
        ? BigInt(Math.floor(live.price * 1e18))
        : priceWad;

      const tradeLike = {
        id: txHash || `${Date.now()}_${Math.random()}`,
        account: { id: String(accountAddr || '') },
        isBuy,
        amountIn: amountInWei,
        amountOut: amountOutWei,
        priceNativePerTokenWad: livePriceWad,
        token: {
          symbol: (live?.symbol ?? symbol ?? 'UNK'),
          name: (live?.name ?? live?.symbol ?? symbol ?? 'Unknown')
        },
        timestamp: ts
      };

      console.log('[Tracker] Created tradeLike:', tradeLike);

      // Debug: Log what normalizeTrade will produce
      const normalized = normalizeTrade(tradeLike, wallets);
      console.log('[Tracker] Normalized trade:', normalized);

      toAdd.push(normalized);

  upsertMarket({ tokenAddr, symbol, price: priceEth, isBuy, amountNative: isBuy ? amountInEth : amountOutEth, ts, wallet: wallets.find(w=>lower(w.address)===lower(accountAddr||''))?.name, emoji: wallets.find(w=>lower(w.address)===lower(accountAddr||''))?.emoji });
    }

    if (toAdd.length === 0) {
      console.log('[Tracker] No trades to add after filtering');
      return;
    }

    console.log('[Tracker] Adding', toAdd.length, 'trades to LiveTrades');
    console.log('[Tracker] Trades to add:', toAdd);

    setTrackedWalletTrades(prev => {
      const next: LiveTrade[] = [...toAdd, ...prev];
      const seen = new Set<string>(), out: LiveTrade[] = [];
      for (const t of next) if (!seen.has(t.id)) { seen.add(t.id); out.push(t); }
      flushMarketsToState();
      console.log('[Tracker] Updated trackedWalletTrades, total count:', out.length);
      return out.slice(0, 500);
    });
  }, [normalizeTrade, activechain, demoMode.trades]);

  // safe RPC wrapper to avoid noisy errors


  useEffect(() => {
    // Live contract event watchers are disabled to avoid continuous LiveTrades ingestion.
    // We only populate Monitor data from portfolio GraphQL positions for tracked wallets.
    // If you want to re-enable live ingestion later, restore the original watcher code.
    return;
  }, [activechain, push]);




  useEffect(() => {
    saveWalletsToStorage(trackedWallets);
    setStatus();
  }, [trackedWallets]);

  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  useEffect(() => {
    let stop = false;
    const run = async () => {
      const addrs = trackedWalletsRef.current.map(w => w.address);
      if (!addrs.length) return;
      const results = await Promise.all(addrs.map(a => fetchPortfolio(a).catch(() => null)));
      if (stop) return;
      const pos: Record<string, GqlPosition[]> = {};
      // Don't update balances from fetchPortfolio since it doesn't fetch native balance
      // Balance updates come from walletTokenBalances prop via the useEffect below
      results.forEach((w, i) => {
        if (!w) return;
        pos[addrs[i]] = w.positions || [];
      });
      setAddressPositions(prev => ({ ...prev, ...pos }));
    };
    run();
    const id = setInterval(run, MONITOR_POLL_MS);
    return () => { stop = true; clearInterval(id); };
  }, [JSON.stringify(trackedWallets.map(w => w.address))]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (activeTab !== 'monitor') return;
        const addrs = trackedWalletsRef.current.map(w => w.address);
        if (!addrs.length) return;

        // If we already have addressPositions data, the other effect will populate Monitor.
        if (Object.keys(addressPositions).length > 0) return;

        const posResults = await Promise.all(addrs.map(a => fetchPortfolio(a).catch(() => null)));
        if (cancelled) return;

        const tokensMap = new Map<string, MonitorToken>();

        posResults.forEach((w, i) => {
          if (!w || !w.positions) return;
          const walletAddr = addrs[i];
          const wallet = trackedWalletsRef.current.find(x => x.address.toLowerCase() === walletAddr.toLowerCase());
          for (const pos of w.positions) {
            if (!pos || !pos.tokenId) continue;
            if (!(pos.remainingTokens && pos.remainingTokens > 0)) continue;
            const existing = tokensMap.get(pos.tokenId);
            if (existing) {
              const walletTrade = existing.trades.find(t => t.wallet === wallet?.name);
              if (walletTrade) {
                walletTrade.bought = pos.spentNative;
                walletTrade.sold = pos.receivedNative;
                walletTrade.remaining = pos.pnlNative;
                walletTrade.pnl = pos.pnlNative;
              } else {
                existing.trades.push({
                  id: `${pos.tokenId}_${wallet?.name}`,
                  wallet: wallet?.name || 'Unknown',
                  emoji: wallet?.emoji || '👤',
                  timeInTrade: '—',
                  bought: pos.spentNative,
                  boughtTxns: 0,
                  sold: pos.receivedNative,
                  soldTxns: 0,
                  pnl: pos.pnlNative,
                  remaining: pos.pnlNative
                });
              }
            } else {
              tokensMap.set(pos.tokenId, {
                id: pos.tokenId,
                tokenAddress: pos.tokenId,
                name: pos.name || pos.symbol || 'Unknown',
                symbol: pos.symbol || 'UNK',
                emoji: '🪙',
                price: pos.lastPrice || 0,
                marketCap: (pos.lastPrice || 0) * SUPPLY,
                change24h: 0,
                volume24h: 0,
                liquidity: 0,
                holders: 0,
                buyTransactions: 0,
                sellTransactions: 0,
                bondingCurveProgress: 0,
                txCount: 0,
                volume5m: 0,
                volume1h: 0,
                volume6h: 0,
                priceChange5m: 0,
                priceChange1h: 0,
                priceChange6h: 0,
                priceChange24h: 0,
                website: '',
                twitter: '',
                telegram: '',
                createdAt: new Date().toISOString(),
                lastTransaction: new Date().toISOString(),
                trades: [{
                  id: `${pos.tokenId}_${wallet?.name}`,
                  wallet: wallet?.name || 'Unknown',
                  emoji: wallet?.emoji || '👤',
                  timeInTrade: '—',
                  bought: pos.spentNative,
                  boughtTxns: 0,
                  sold: pos.receivedNative,
                  soldTxns: 0,
                  pnl: pos.pnlNative,
                  remaining: pos.pnlNative
                }]
              });
            }
          }
        });

        // Merge into marketsRef and flush
        for (const [id, tk] of tokensMap.entries()) marketsRef.current.set(id, tk);
        flushMarketsToState();
      } catch (e) {
        // ignore
      }
    };
    run();
    return () => { cancelled = true; };
  }, [activeTab, trackedWallets, addressPositions]);

  // Enhanced polling logic with better error handling
  useEffect(() => {
    if (activeTab !== 'monitor') return;
    
    if (SHOW_DEMO_MONITOR) {
      setMonitorTokens(DEMO_MONITOR_TOKENS);
      return;
    }

    const fetchMarkets = async () => {
      // Skip if no wallets to track
      if (trackedWallets.length === 0) {
        setMonitorTokens([]);
        setIsLoadingPortfolioMarkets(false);
        return;
      }

      setIsLoadingPortfolioMarkets(true);

      // NOTE: Disabled fetchPortfolioMarketsForWallets because it requires graphqlUrl which is not configured
      // Monitor tab will use positions from addressPositions state instead (fetched via fetchPortfolio)
      setIsLoadingPortfolioMarkets(false);
    };

    // Initial fetch
    fetchMarkets();

    // Set up polling
    const interval = setInterval(fetchMarkets, MONITOR_POLL_MS);

    return () => clearInterval(interval);
  }, [activeTab, trackedWallets]);

  useEffect(() => {
    if (Object.keys(walletTokenBalances).length === 0) return;
    setTrackedWallets(prev => prev.map(wallet => {
      const realBalance = walletTokenBalances[wallet.address];
      if (realBalance && chainCfg.eth) {
        const balance = Number(realBalance[chainCfg.eth] || 0) / 1e18;
        return { ...wallet, balance };
      }
      return wallet;
    }));
  }, [walletTokenBalances, activechain]);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletEmoji, setNewWalletEmoji] = useState('😀');
  const [addWalletError, setAddWalletError] = useState('');

  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<string>('');
  const [dontShowDeleteAgain, setDontShowDeleteAgain] = useState(false);
  const [showImportPopup, setShowImportPopup] = useState(false);

  const mainWalletsRef = useRef<HTMLDivElement>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  

  function getRpcPublicClient(chainCfg?: any) {
    if (!chainCfg?.rpcUrl) return null;
    return createPublicClient({
      transport: http(chainCfg.rpcUrl),
    });
  }

  const formatCompact = (n: number, d = 2) => {
    if (n === 0) return '0';
    const a = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    return a >= 1e6 ? `${sign}${(a / 1e6).toFixed(d)}M`
      : a >= 1e3 ? `${sign}${(a / 1e3).toFixed(d)}K`
      : `${sign}${a.toFixed(d)}`;
  };

  const toDisplay = (v: number, unit: 'USD' | 'MON', p: number) =>
    unit === 'USD' ? v * p : v;



  const handleWalletSort = (field: 'balance' | 'lastActive') => {
    if (walletSortField === field) {
      setWalletSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setWalletSortField(field);
      setWalletSortDirection('desc');
    }
  };

  const handleTradeSort = (field: 'dateCreated' | 'amount' | 'marketCap') => {
    if (tradeSortField === field) {
      setTradeSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setTradeSortField(field);
      setTradeSortDirection('desc');
    }
  };


  const getSortedWallets = () => {
    if (!walletSortField) return trackedWallets;

    return [...trackedWallets].sort((a, b) => {
      let comparison = 0;

      if (walletSortField === 'balance') {
        comparison = a.balance - b.balance;
      }
      if (walletSortField === 'lastActive') {
        const aTs = a.lastActiveAt ?? new Date(a.createdAt).getTime();
        const bTs = b.lastActiveAt ?? new Date(b.createdAt).getTime();
  // newer first when 'desc'
        comparison = aTs - bTs;
      }

      return walletSortDirection === 'desc' ? -comparison : comparison;
    });
  };

  const getFilteredWallets = () => {
    const q = searchQuery.trim().toLowerCase();
    const s = getSortedWallets();
    return q
      ? s.filter(w =>
          w.name.toLowerCase().includes(q) ||
          w.address.toLowerCase().includes(q)
        )
      : s;
  };

  const getFilteredTrades = () => {
    let trades = trackedWalletTrades.filter(trade => {

      const isBuy = trade.type === 'buy';
      const isSell = trade.type === 'sell';

      if (isBuy && !activeFilters.transactionTypes.buyMore && !activeFilters.transactionTypes.firstBuy) {
        return false;
      }
      if (isSell && !activeFilters.transactionTypes.sellPartial && !activeFilters.transactionTypes.sellAll) {
        return false;
      }

      if (activeFilters.marketCap.min && trade.marketCap < parseFloat(activeFilters.marketCap.min)) {
        return false;
      }
      if (activeFilters.marketCap.max && trade.marketCap > parseFloat(activeFilters.marketCap.max)) {
        return false;
      }

      if (activeFilters.transactionAmount.min && trade.amount < parseFloat(activeFilters.transactionAmount.min)) {
        return false;
      }
      if (activeFilters.transactionAmount.max && trade.amount > parseFloat(activeFilters.transactionAmount.max)) {
        return false;
      }

      return true;
    });

    if (tradeSortField) {
      trades = [...trades].sort((a, b) => {
        let comparison = 0;

        if (tradeSortField === 'dateCreated') {
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (tradeSortField === 'amount') {
          comparison = a.amount - b.amount;
        } else if (tradeSortField === 'marketCap') {
          comparison = a.marketCap - b.marketCap;
        }

        return tradeSortDirection === 'desc' ? -comparison : comparison;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      trades = trades.filter(trade =>
        trade.walletName.toLowerCase().includes(query) ||
        trade.token.toLowerCase().includes(query)
      );
    }

    return trades;
  };

  const getTimeAgo = (x: string | number) => {
    const toMs = (v: string | number) => {
      if (typeof v === 'number') {
        return v < 1e12 ? v * 1000 : v;
      }
      const n = Number(v);
      if (!Number.isNaN(n)) return n < 1e12 ? n * 1000 : n;
      const d = new Date(v).getTime();
      return Number.isNaN(d) ? NaN : d;
    };

    const t = toMs(x);
    if (Number.isNaN(t)) return 'Never';

    const diff = Date.now() - t;
    if (diff < 0) return '0s';

    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  const getFilteredPositions = (): GqlPosition[] => {
    // Flatten all positions from all tracked wallets
    const allPositions: GqlPosition[] = [];

    Object.entries(addressPositions).forEach(([walletAddr, positions]) => {
      positions.forEach(pos => {
        // Only include positions with remaining tokens
        if (pos.remainingTokens && pos.remainingTokens > 0) {
          // Add wallet info to position for display
          const wallet = trackedWallets.find(w => w.address.toLowerCase() === walletAddr.toLowerCase());
          (pos as any).walletName = wallet?.name || `${walletAddr.slice(0,6)}...${walletAddr.slice(-4)}`;
          (pos as any).walletEmoji = wallet?.emoji || '👤';
          (pos as any).walletAddress = walletAddr;
          allPositions.push(pos);
        }
      });
    });

    let positions = allPositions;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      positions = positions.filter((p) =>
        p.name?.toLowerCase().includes(q) ||
        p.symbol?.toLowerCase().includes(q) ||
        p.tokenId.toLowerCase().includes(q)
      );
    }

    // Apply monitor filters
    positions = positions.filter(pos => {
      const market = marketsRef.current.get(pos.tokenId.toLowerCase());

      // General filters
      if (monitorFilters.general.lastTransaction) {
        const maxAge = Number(monitorFilters.general.lastTransaction);
        if (!isNaN(maxAge) && market?.lastTransaction) {
          const lastTxTime = new Date(market.lastTransaction).getTime();
          const ageSeconds = (Date.now() - lastTxTime) / 1000;
          if (ageSeconds > maxAge) return false;
        }
      }

      if (monitorFilters.general.tokenAgeMin) {
        const minAgeMinutes = Number(monitorFilters.general.tokenAgeMin);
        if (!isNaN(minAgeMinutes) && market?.createdAt) {
          const ageMinutes = (Date.now() - new Date(market.createdAt).getTime()) / 60000;
          if (ageMinutes < minAgeMinutes) return false;
        }
      }

      if (monitorFilters.general.tokenAgeMax) {
        const maxAgeHours = Number(monitorFilters.general.tokenAgeMax);
        if (!isNaN(maxAgeHours) && market?.createdAt) {
          const ageHours = (Date.now() - new Date(market.createdAt).getTime()) / 3600000;
          if (ageHours > maxAgeHours) return false;
        }
      }

      // Market filters
      if (monitorFilters.market.marketCapMin) {
        const minMC = Number(monitorFilters.market.marketCapMin);
        if (!isNaN(minMC)) {
          const marketCap = pos.lastPrice * 1e9; // total supply is 1e9
          if (marketCap < minMC) return false;
        }
      }

      if (monitorFilters.market.marketCapMax) {
        const maxMC = Number(monitorFilters.market.marketCapMax);
        if (!isNaN(maxMC)) {
          const marketCap = pos.lastPrice * 1e9;
          if (marketCap > maxMC) return false;
        }
      }

      if (monitorFilters.market.liquidityMin) {
        const minLiq = Number(monitorFilters.market.liquidityMin);
        if (!isNaN(minLiq) && market?.liquidity !== undefined) {
          if (market.liquidity < minLiq) return false;
        }
      }

      if (monitorFilters.market.liquidityMax) {
        const maxLiq = Number(monitorFilters.market.liquidityMax);
        if (!isNaN(maxLiq) && market?.liquidity !== undefined) {
          if (market.liquidity > maxLiq) return false;
        }
      }

      if (monitorFilters.market.holdersMin) {
        const minHolders = Number(monitorFilters.market.holdersMin);
        if (!isNaN(minHolders) && market?.holders !== undefined) {
          if (market.holders < minHolders) return false;
        }
      }

      if (monitorFilters.market.holdersMax) {
        const maxHolders = Number(monitorFilters.market.holdersMax);
        if (!isNaN(maxHolders) && market?.holders !== undefined) {
          if (market.holders > maxHolders) return false;
        }
      }

      // Transaction filters
      if (monitorFilters.transactions.transactionCountMin) {
        const minTx = Number(monitorFilters.transactions.transactionCountMin);
        if (!isNaN(minTx) && market?.txCount !== undefined) {
          if (market.txCount < minTx) return false;
        }
      }

      if (monitorFilters.transactions.transactionCountMax) {
        const maxTx = Number(monitorFilters.transactions.transactionCountMax);
        if (!isNaN(maxTx) && market?.txCount !== undefined) {
          if (market.txCount > maxTx) return false;
        }
      }

      if (monitorFilters.transactions.inflowVolumeMin) {
        const minInflow = Number(monitorFilters.transactions.inflowVolumeMin);
        if (!isNaN(minInflow) && market?.volume24h !== undefined) {
          if (market.volume24h < minInflow) return false;
        }
      }

      if (monitorFilters.transactions.inflowVolumeMax) {
        const maxInflow = Number(monitorFilters.transactions.inflowVolumeMax);
        if (!isNaN(maxInflow) && market?.volume24h !== undefined) {
          if (market.volume24h > maxInflow) return false;
        }
      }

      if (monitorFilters.transactions.outflowVolumeMin) {
        const minOutflow = Number(monitorFilters.transactions.outflowVolumeMin);
        if (!isNaN(minOutflow) && market?.volume24h !== undefined) {
          if (market.volume24h < minOutflow) return false;
        }
      }

      if (monitorFilters.transactions.outflowVolumeMax) {
        const maxOutflow = Number(monitorFilters.transactions.outflowVolumeMax);
        if (!isNaN(maxOutflow) && market?.volume24h !== undefined) {
          if (market.volume24h > maxOutflow) return false;
        }
      }

      return true;
    });

    // Apply sorting based on selectedSimpleFilter
    if (selectedSimpleFilter) {
      switch (selectedSimpleFilter) {
        case 'latest':
          positions.sort((a, b) => {
            const aMarket = marketsRef.current.get(a.tokenId.toLowerCase());
            const bMarket = marketsRef.current.get(b.tokenId.toLowerCase());
            const aTime = aMarket?.lastTransaction ? new Date(aMarket.lastTransaction).getTime() : 0;
            const bTime = bMarket?.lastTransaction ? new Date(bMarket.lastTransaction).getTime() : 0;
            return bTime - aTime;
          });
          break;
        case 'marketCap':
          positions.sort((a, b) => {
            const aMC = a.lastPrice * 1e9;
            const bMC = b.lastPrice * 1e9;
            return bMC - aMC;
          });
          break;
        case 'liquidity':
          positions.sort((a, b) => {
            const aMarket = marketsRef.current.get(a.tokenId.toLowerCase());
            const bMarket = marketsRef.current.get(b.tokenId.toLowerCase());
            return (bMarket?.liquidity || 0) - (aMarket?.liquidity || 0);
          });
          break;
        case 'txns':
          positions.sort((a, b) => {
            const aMarket = marketsRef.current.get(a.tokenId.toLowerCase());
            const bMarket = marketsRef.current.get(b.tokenId.toLowerCase());
            return (bMarket?.txCount || 0) - (aMarket?.txCount || 0);
          });
          break;
        case 'holders':
          positions.sort((a, b) => {
            const aMarket = marketsRef.current.get(a.tokenId.toLowerCase());
            const bMarket = marketsRef.current.get(b.tokenId.toLowerCase());
            return (bMarket?.holders || 0) - (aMarket?.holders || 0);
          });
          break;
        case 'inflow':
          positions.sort((a, b) => {
            const aMarket = marketsRef.current.get(a.tokenId.toLowerCase());
            const bMarket = marketsRef.current.get(b.tokenId.toLowerCase());
            return (bMarket?.volume24h || 0) - (aMarket?.volume24h || 0);
          });
          break;
        case 'outflow':
          positions.sort((a, b) => {
            const aMarket = marketsRef.current.get(a.tokenId.toLowerCase());
            const bMarket = marketsRef.current.get(b.tokenId.toLowerCase());
            return (bMarket?.volume24h || 0) - (aMarket?.volume24h || 0);
          });
          break;
        case 'tokenAge':
          positions.sort((a, b) => {
            const aMarket = marketsRef.current.get(a.tokenId.toLowerCase());
            const bMarket = marketsRef.current.get(b.tokenId.toLowerCase());
            const aTime = aMarket?.createdAt ? new Date(aMarket.createdAt).getTime() : 0;
            const bTime = bMarket?.createdAt ? new Date(bMarket.createdAt).getTime() : 0;
            return aTime - bTime; // Ascending for token age (oldest first)
          });
          break;
        default:
          // Default sort by PnL
          positions.sort((a, b) => (b.pnlNative ?? 0) - (a.pnlNative ?? 0));
      }
    } else {
      // Default sort by PnL if no simple filter selected
      positions.sort((a, b) => (b.pnlNative ?? 0) - (a.pnlNative ?? 0));
    }

    // Move pinned tokens to top
    const pinned = positions.filter(p => pinnedTokens.has(p.tokenId));
    const unpinned = positions.filter(p => !pinnedTokens.has(p.tokenId));

    return [...pinned, ...unpinned];
  };

  const handleAddWallet = async () => {
    setAddWalletError('');
    if (!newWalletAddress.trim()) { setAddWalletError('Please enter a wallet address'); return; }
    if (!isValidAddress(newWalletAddress.trim())) { setAddWalletError('Invalid wallet address'); return; }
    if (trackedWallets.some(w => w.address.toLowerCase() === newWalletAddress.trim().toLowerCase())) { setAddWalletError('This wallet is already being tracked'); return; }
    const name = (newWalletName.trim() || `${newWalletAddress.slice(0, 6)}...${newWalletAddress.slice(-4)}`).slice(0, 20);
    const nw: TrackedWallet = { id: Date.now().toString(), address: newWalletAddress.trim(), name, emoji: newWalletEmoji, balance: 0, lastActiveAt: null, createdAt: new Date().toISOString() };
    setTrackedWallets(prev => demoMode.wallets ? [nw] : [...prev, nw]);
    if (demoMode.wallets) disableDemo('wallets');
    try {
      fetchRecentTradesForWallet(nw.address, 50).then(items => {
        if (items && items.length) ingestExternalTrades(items);
      }).catch(() => {});
    } catch (e) {}
  // also fetch portfolio positions immediately so Monitor reflects the new wallet
    try {
      (async () => {
        try {
          const p = await fetchPortfolio(nw.address).catch(() => null);
          if (p && p.positions && p.positions.length) {
            setAddressPositions(prev => ({ ...prev, [nw.address]: p.positions }));
          }
        } catch (e) {}
      })();
    } catch (e) {}
    closeAddWalletModal();
  };

  // Function to fetch portfolio positions for all tracked wallets with error handling
  const fetchPortfolioMarketsForWallets = async (wallets: TrackedWallet[]) => {
    if (!wallets.length) return [];

    // Check if GraphQL URL is available
    const graphqlUrl = (settings as any).graphqlUrl || (settings as any).api?.graphqlUrl;
    if (!graphqlUrl) {
      console.warn('[Tracker] GraphQL URL not configured - cannot fetch portfolio data');
      return [];
    }

    const allPositions: GqlPosition[] = [];
    let successCount = 0;
    let errorCount = 0;
    
    // Fetch portfolio for each tracked wallet
    for (const wallet of wallets) {
      try {
        console.log(`[Tracker] Fetching portfolio for wallet: ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`);
        const portfolio = await fetchPortfolio(wallet.address);
        
        if (portfolio?.positions && portfolio.positions.length > 0) {
          console.log(`[Tracker] Found ${portfolio.positions.length} positions for wallet ${wallet.name}`);
          allPositions.push(...portfolio.positions);
          successCount++;
        } else {
          console.log(`[Tracker] No positions found for wallet ${wallet.name}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`[Tracker] Failed to fetch portfolio for wallet ${wallet.name} (${wallet.address}):`, error);
      }
    }

    console.log(`[Tracker] Portfolio fetch complete: ${successCount} success, ${errorCount} errors, ${allPositions.length} total positions`);

    if (allPositions.length === 0) {
      return [];
    }

    // Extract unique tokens from positions (using tokenId as key)
    const uniqueTokens = new Map<string, GqlPosition>();
    allPositions.forEach(position => {
      if (position.tokenId && !uniqueTokens.has(position.tokenId)) {
        uniqueTokens.set(position.tokenId, position);
      }
    });

    console.log(`[Tracker] Found ${uniqueTokens.size} unique tokens from positions`);

    // Convert positions to MonitorToken format
    const markets: MonitorToken[] = Array.from(uniqueTokens.values()).map(position => {
      // Calculate market cap from position data if possible
      const estimatedMarketCap = position.lastPrice * 1000000000; // Assume 1B total supply
      
      return {
        id: position.tokenId,
        tokenAddress: position.tokenId,
        name: position.name || 'Unknown Token',
        symbol: position.symbol || 'UNK',
        emoji: getTokenEmoji(position.symbol),
        price: position.lastPrice || 0,
        marketCap: estimatedMarketCap,
        
        // Fields not available from portfolio data - set to 0 or defaults
        change24h: 0,
        volume24h: 0,
        liquidity: 0,
        holders: 0,
        buyTransactions: 0,
        sellTransactions: 0,
        bondingCurveProgress: 0,
        txCount: 0,
        volume5m: 0,
        volume1h: 0,
        volume6h: 0,
        priceChange5m: 0,
        priceChange1h: 0,
        priceChange6h: 0,
        priceChange24h: 0,
        website: '',
        twitter: '',
        telegram: '',
        createdAt: new Date().toISOString(),
        lastTransaction: new Date().toISOString(),
        
        // Add position-specific data as trades
        trades: [{
          id: `position-${position.tokenId}`,
          wallet: 'Portfolio Position',
          emoji: '💼',
          timeInTrade: 'Active',
          bought: position.boughtTokens,
          boughtTxns: 1,
          sold: position.soldTokens,
          soldTxns: position.soldTokens > 0 ? 1 : 0,
          pnl: position.pnlNative,
          remaining: position.remainingTokens
        }]
      };
    });

    return markets;
  };

  // Helper function to assign emojis based on token symbol
  const getTokenEmoji = (symbol?: string): string => {
    if (!symbol) return '🪙';
    
    const emojiMap: { [key: string]: string } = {
      'DOGE': '🐕',
      'SHIB': '🐕‍🦺', 
      'PEPE': '🐸',
      'MOON': '🚀',
      'BONK': '🔨',
      'WOJ': '😭',
      'CAT': '🐱',
      'FROG': '🐸',
      'ROCKET': '🚀'
    };
    
    const upperSymbol = symbol.toUpperCase();
    return emojiMap[upperSymbol] || '🪙';
  };

  



  const handleExportWallets = () => {
    const exportData = trackedWallets.map(wallet => ({
      trackedWalletAddress: wallet.address,
      name: wallet.name,
      emoji: wallet.emoji,
      alertsOnToast: false,
      alertsOnBubble: false,
      alertsOnFeed: true,
      groups: ["Main"],
      sound: "default"
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(jsonString);
  };

  const handleImportWallets = async (walletsText: string) => {
    try {
      const imported = JSON.parse(walletsText);
      if (!Array.isArray(imported)) return;
      const nowTag = Date.now().toString();
      const toAdd = imported
        .filter((it:any) => it?.trackedWalletAddress && !trackedWallets.some(w => w.address.toLowerCase() === it.trackedWalletAddress.toLowerCase()))
        .map((it:any,i:number) => ({ id: `${nowTag}_${i}_${Math.random().toString(36).slice(2)}`, address: it.trackedWalletAddress, name: String(it.name || 'Imported Wallet').slice(0,20), emoji: it.emoji || '👻', balance: 0, lastActiveAt: null, createdAt: new Date().toISOString() })) as TrackedWallet[];
      if (!toAdd.length) return;
      setTrackedWallets(prev => demoMode.wallets ? toAdd : [...prev, ...toAdd]);
      if (demoMode.wallets) disableDemo('wallets');
      (async () => {
        try {
          const all: any[] = [];
          for (const w of toAdd) {
            const items = await fetchRecentTradesForWallet(w.address, 50);
            if (items && items.length) all.push(...items);
          }
          if (all.length) ingestExternalTrades(all.slice(0, 500));
        } catch (e) {}
      })();
      try {
        (async () => {
          for (const w of toAdd) {
            try {
              const p = await fetchPortfolio(w.address).catch(() => null);
              if (p && p.positions && p.positions.length) setAddressPositions(prev => ({ ...prev, [w.address]: p.positions }));
            } catch (e) {}
          }
        })();
      } catch (e) {}
    } catch {}
  };

  const closeAddWalletModal = () => {
    setShowAddWalletModal(false);
    setNewWalletAddress('');
    setNewWalletName('');
    setNewWalletEmoji('😀');
    setAddWalletError('');
  };

  const startEditingWallet = (id: string) => {
    const wallet = trackedWallets.find(w => w.id === id);
    if (wallet) {
      setEditingWallet(id);
      setEditingName(wallet.name);
    }
  };

  const saveWalletName = (id: string) => {
    setTrackedWallets(prev =>
      prev.map(w => w.id === id ? { ...w, name: editingName.trim() || w.name } : w)
    );
    setEditingWallet(null);
    setEditingName('');
  };

  const confirmDeleteWallet = (id: string) => {
    const shouldSkip = getDeletePreference();
    
    if (shouldSkip) {
      setTrackedWallets(prev => prev.filter(w => w.id !== id));
    } else {
      setWalletToDelete(id);
      setShowDeleteConfirmation(true);
    }
  };

  const getDeletePreference = (): boolean => {
    try {
      return localStorage.getItem('tracker_skip_delete_confirmation') === 'true';
    } catch {
      return false;
    }
  };

  const saveDeletePreference = (skip: boolean) => {
    try {
      if (skip) {
        localStorage.setItem('tracker_skip_delete_confirmation', 'true');
      } else {
        localStorage.removeItem('tracker_skip_delete_confirmation');
      }
    } catch {
    }
  };

  const deleteWallet = () => {
    if (dontShowDeleteAgain) {
      saveDeletePreference(true);
    }
    
    setTrackedWallets(prev => prev.filter(w => w.id !== walletToDelete));
    setShowDeleteConfirmation(false);
    setWalletToDelete('');
    setDontShowDeleteAgain(false);
  };



  const handleApplyFilters = (filters: FilterState) => {
    setActiveFilters(filters);
    if (externalOnApplyFilters) {
      externalOnApplyFilters(filters);
    }
  };

  const handleApplyMonitorFilters = (filters: MonitorFilterState) => {
    setMonitorFilters(filters);
  };

  const handleReorderDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const reorderData = e.dataTransfer.getData('text/reorder');
      if (!reorderData || reorderData.trim() === '') {
        return;
      }

      const data = JSON.parse(reorderData);

      if (data.type === 'reorder') {
        const { index: draggedIndex } = data;
        const { dragOverIndex, dragOverPosition } = dragReorderState;

        if (draggedIndex === dragOverIndex) {
          setDragReorderState({
            draggedIndex: -1,
            dragOverIndex: -1,
            dragOverPosition: null,
            draggedContainer: null,
            dragOverContainer: null
          });
          setDropPreviewLine(null);
          return;
        }

        let targetIndex = dragOverIndex;

        if (dragOverPosition === 'bottom') {
          targetIndex++;
        }

        if (draggedIndex < targetIndex) {
          targetIndex--;
        }

        targetIndex = Math.max(0, targetIndex);

        const reorderedWallets = [...trackedWallets];
        const maxIndex = reorderedWallets.length - 1;
        targetIndex = Math.min(targetIndex, maxIndex);

        const [movedWallet] = reorderedWallets.splice(draggedIndex, 1);
        reorderedWallets.splice(targetIndex, 0, movedWallet);
        setTrackedWallets(reorderedWallets);
      }
    } catch (error) {
      console.error('Reorder drop error:', error);
    }

    setDragReorderState({
      draggedIndex: -1,
      dragOverIndex: -1,
      dragOverPosition: null,
      draggedContainer: null,
      dragOverContainer: null
    });
    setDropPreviewLine(null);
  };
  const lastActiveLabel = (w: TrackedWallet) => {
    const ts = w.lastActiveAt ?? new Date(w.createdAt).getTime();
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  // rerender every 30s
  const [, setTicker] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTicker(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);


  const handleMultiDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsMultiDrag(true);

    const selectedWalletsData = trackedWallets
      .filter(w => selectedWallets.has(w.id))
      .map((w, arrayIndex) => ({
        ...w,
        index: trackedWallets.findIndex(tw => tw.id === w.id)
      }));

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'multi-drag',
      wallets: selectedWalletsData,
      count: selectedWalletsData.length,
      timestamp: Date.now()
    }));
  };

  const updateSelection = (e: React.MouseEvent, container: HTMLElement) => {
    if (!activeSelectionContainer || !selectionRect) return;

    e.stopPropagation();
    e.preventDefault();

    const rect = container.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    setSelectionRect(prev => prev ? {
      ...prev,
      currentX,
      currentY
    } : null);
  };

  const endSelection = () => {
    if (activeSelectionContainer && previewSelection.size > 0) {
      setSelectedWallets(prev => {
        const combined = new Set(prev);
        previewSelection.forEach(id => combined.add(id));
        return combined;
      });
    }

    setPreviewSelection(new Set());
    setActiveSelectionContainer(null);
    setSelectionRect(null);
  };

  useEffect(() => {
    const cfg = chainCfgOf(activechain);
    const pc = getRpcPublicClient(cfg);
    if (!pc) return;
    let ignore = false;
    const addresses = trackedWallets.map(w => w.address);
    (async () => {
      try {
        const results = new Map<string, number>();
        for (const a of addresses) {
          try {
            const wei = await pc.getBalance({ address: a as `0x${string}` });
            if (ignore) return;
            const mon = Number(wei) / 1e18;
            results.set(a.toLowerCase(), mon);
          } catch (err) {
          }
        }
        setTrackedWallets(prev =>
          prev.map(w => {
            const v = results.get(w.address.toLowerCase());
            return v != null ? { ...w, balance: v } : w;
          })
        );
      } catch (e) {
      }
    })();
    return () => { ignore = true; };
  }, [activechain, JSON.stringify(trackedWallets.map(w => w.address))]);

  useEffect(() => {
    if (!demoMode.trades && trackedWalletTradesRef.current === DEMO_TRADES) setTrackedWalletTrades([]);
    setStatus();
  }, [demoMode.trades]);

  // Update trade times every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTrackedWalletTrades(prev =>
        prev.map(trade => {
          const timestamp = new Date(trade.createdAt).getTime() / 1000;
          const now = Date.now() / 1000;
          const secondsAgo = Math.max(0, now - timestamp);
          let timeAgo = 'now';
          if (secondsAgo < 60) timeAgo = `${Math.floor(secondsAgo)}s`;
          else if (secondsAgo < 3600) timeAgo = `${Math.floor(secondsAgo / 60)}m`;
          else if (secondsAgo < 86400) timeAgo = `${Math.floor(secondsAgo / 3600)}h`;
          else timeAgo = `${Math.floor(secondsAgo / 86400)}d`;
          return { ...trade, time: timeAgo };
        })
      );
    }, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('[Tracker] Setting up watchContractEvent for activechain:', activechain);
    const cfg = chainCfgOf(activechain);
    console.log('[Tracker] Chain config:', { id: cfg?.id, rpcUrl: cfg?.rpcUrl, router: cfg?.router, market: cfg?.market });

    if (!cfg?.id || !cfg?.rpcUrl) {
      console.log('[Tracker] Missing chain config, skipping watchContractEvent setup');
      return;
    }

    const unsubs: Array<() => void> = [];
    const common = { poll: true as const, chainId: cfg.id };

    try {
      if (cfg?.router) {
        console.log('[Tracker] Setting up router Trade event watcher:', cfg.router);
        unsubs.push(watchContractEvent(config, {
          address: cfg.router as `0x${string}`,
          abi: CrystalRouterAbi,
          eventName: 'Trade' as any,
          onLogs: (logs) => {
            console.log('[Tracker] Router Trade event received, logs:', logs);
            push(logs, 'router');
          },
          ...common,
        }));
      }
      if (cfg?.market) {
        console.log('[Tracker] Setting up market Trade event watcher:', cfg.market);
        unsubs.push(watchContractEvent(config, {
          address: cfg.market as `0x${string}`,
          abi: CrystalMarketAbi,
          eventName: 'Trade' as any,
          onLogs: (logs) => {
            console.log('[Tracker] Market Trade event received, logs:', logs);
            push(logs, 'market');
          },
          ...common,
        }));
      }
      if ((cfg?.launchpadTokens ?? []).length) {
        for (const a of cfg.launchpadTokens as `0x${string}`[]) {
          unsubs.push(watchContractEvent(config, {
            address: a,
            abi: CrystalLaunchpadToken,
            eventName: 'Transfer',
            onLogs: (l) => push(l, 'launchpad'),
            ...common,
          }));
        }
      } else if (cfg?.launchpad) {
        unsubs.push(watchContractEvent(config, {
          address: cfg.launchpad as `0x${string}`,
          abi: CrystalLaunchpadToken,
          eventName: 'Transfer',
          onLogs: (l) => push(l, 'launchpad'),
          ...common,
        }));
      }
    } catch (err) {
      console.error('[Tracker] Error setting up contract event watchers:', err);
    }

    return () => { try { unsubs.forEach(u => u?.()); } catch {} };
  }, [activechain, push]);

  const ingestExternalTrades = (items: any[]) => {
    if (demoMode.trades) { disableDemo('trades'); setTrackedWalletTrades([]); }
    const wallets = trackedWalletsRef.current;
    console.debug('[Tracker] ingestExternalTrades count=', items?.length || 0);
    try {
      for (const it of items) {
        try {
          const tokenAddr = (it.token?.id || it.tokenAddress || it.base || it.asset || it.tokenIn || it.tokenOut || '').toString().toLowerCase();
          const symbol = (it.token?.symbol || it.symbol || it.ticker || '').toString();
          const price = Number(it.priceNativePerTokenWad ?? it.price ?? 0) / 1e18;
          upsertMarket({ tokenAddr: tokenAddr || undefined, symbol: symbol || undefined, price: price || 0, ts: Number(it.block || it.timestamp) || undefined });
        } catch (e) { /* per-item ignore */ }
      }
    } catch (e) { console.error('[Tracker] ingestExternalTrades upsertMarket loop error', e); }
    setTrackedWalletTrades(prev => {
      const next = [...items.map(x => normalizeTrade(x, wallets)), ...prev];
      const seen = new Set<string>(), out: LiveTrade[] = [];
      for (const t of next) if (!seen.has(t.id)) { seen.add(t.id); out.push(t); }
      return out.slice(0,500);
    });
    lastEventTsRef.current = Date.now();
    setStatus({ lastPushSource: 'external' });
  };

  const upsertMarket = (t: { tokenAddr?: string; symbol?: string; name?: string; price?: number; isBuy?: boolean; amountNative?: number; ts?: number; wallet?: string; emoji?: string; }) => {
    const id = (t.tokenAddr || t.symbol)?.toLowerCase();
    if (!id) return;

    const m = marketsRef.current.get(id);
    const nowIso = new Date((t.ts ?? Math.floor(Date.now()/1000)) * 1000).toISOString();

  // keep last non-zero price
    const price = (t.price != null && t.price > 0) ? t.price : (m?.price ?? 0);
    const mk = (price || 0) * SUPPLY;

    const bought = t.isBuy ? (t.amountNative ?? 0) : 0;
    const sold   = !t.isBuy ? (t.amountNative ?? 0) : 0;

    const trades = (m?.trades ?? []).slice();
    const walletName = t.wallet || 'Unknown';
    const existingTradeIndex = trades.findIndex(tr => tr.wallet === walletName);

    if (existingTradeIndex >= 0) {
      const existing = trades[existingTradeIndex];
      trades[existingTradeIndex] = {
        ...existing,
        bought: existing.bought + bought,
        boughtTxns: existing.boughtTxns + (t.isBuy ? 1 : 0),
        sold: existing.sold + sold,
        soldTxns: existing.soldTxns + (t.isBuy ? 0 : 1),
        pnl: (existing.bought + bought) - (existing.sold + sold),
        remaining: (existing.bought + bought) - (existing.sold + sold)
      };
    } else {
      trades.unshift({
        id: `${id}_${walletName}_${Date.now()}`,
        wallet: walletName,
        emoji: (t.emoji || '👤'),
        timeInTrade: '—',
        bought,
        boughtTxns: t.isBuy ? 1 : 0,
        sold,
        soldTxns: t.isBuy ? 0 : 1,
        pnl: bought - sold,
        remaining: bought - sold
      });
    }

    const limitedTrades = trades.slice(0, 50);

    marketsRef.current.set(id, {
      id,
      tokenAddress: t.tokenAddr?.toLowerCase() || id,
      name: t.name || m?.name || t.symbol || 'Token',
      symbol: t.symbol || m?.symbol || 'TKN',
      emoji: m?.emoji || '🪙',
      price,
      marketCap: mk || m?.marketCap || 0,
      change24h: m?.change24h ?? 0,
      volume24h: (m?.volume24h ?? 0) + (t.amountNative ?? 0),
      liquidity: m?.liquidity ?? 0,
      holders: m?.holders ?? 0,
      buyTransactions: (m?.buyTransactions ?? 0) + (t.isBuy ? 1 : 0),
      sellTransactions: (m?.sellTransactions ?? 0) + (!t.isBuy ? 1 : 0),
      bondingCurveProgress: m?.bondingCurveProgress ?? 0,
      txCount: (m?.txCount ?? 0) + 1,
      volume5m: (m?.volume5m ?? 0) + (t.amountNative ?? 0),
      volume1h: (m?.volume1h ?? 0) + (t.amountNative ?? 0),
      volume6h: (m?.volume6h ?? 0) + (t.amountNative ?? 0),
      priceChange5m: m?.priceChange5m ?? 0,
      priceChange1h: m?.priceChange1h ?? 0,
      priceChange6h: m?.priceChange6h ?? 0,
      priceChange24h: m?.priceChange24h ?? 0,
      website: m?.website ?? '',
      twitter: m?.twitter ?? '',
      telegram: m?.telegram ?? '',
      createdAt: m?.createdAt ?? nowIso,
      lastTransaction: nowIso,
      trades: limitedTrades
    });

    if (demoMode.monitor) {
      setDemoMode(v => ({ ...v, monitor: false }));
      if (!m) setMonitorTokens([]);
    }
    try {
      const cfg = chainCfgOf(activechain);
      const wss = cfg?.wssurl;
      if (wss && wsRef.current && !marketSubsRef.current[id]) {
        try {
          console.debug('[Tracker] subscribing to market via subscribe helper', id);
          subscribe(wsRef.current, ['logs', { address: id }], (subId) => {
            try {
              marketSubsRef.current[id] = subId;
              console.debug('[Tracker] market subscription acked', id, 'subId=', subId);
            } catch (e) { console.error('[Tracker] market sub ack handler error', e); }
          });
        } catch (e) { console.error('[Tracker] subscribe helper failed', e); }
      }
    } catch (e) {}
  };

  // websocket helpers

  const subscribe = useCallback((ws: WebSocket, params: any, onAck?: (subId: string) => void) => {
    try {
      const reqId = subIdRef.current++;
      ws.send(JSON.stringify({ id: reqId, jsonrpc: '2.0', method: 'eth_subscribe', params }));
      if (!onAck) return;
      const handler = (evt: MessageEvent) => {
        try {
          const msg = JSON.parse(evt.data);
          console.debug('[Tracker] subscribe helper got message for reqId=', reqId, msg);
          if (msg.id === reqId && msg.result) {
            console.debug('[Tracker] subscribe helper ack result=', msg.result);
            onAck(msg.result);
            ws.removeEventListener('message', handler);
          }
        } catch (e) { console.error('[Tracker] subscribe handler parse error', e); }
      };
      ws.addEventListener('message', handler);
    } catch (e) {}
  }, []);

  const addMarketFromLog = useCallback(async (log: any) => {
    try {
      const topics = log.topics || [];
      const data = log.data || '';
      const market = `0x${(topics[1] || '').slice(26)}`.toLowerCase();
      const tokenAddr = `0x${(topics[2] || '').slice(26)}`.toLowerCase();
      const hex = data.replace(/^0x/, '');
      const offs = [parseInt(hex.slice(0, 64) || '0', 16), parseInt(hex.slice(64, 128) || '0', 16), parseInt(hex.slice(128, 192) || '0', 16)];
      const read = (at: number) => {
        const start = at * 2;
        const len = parseInt(hex.slice(start, start + 64) || '0', 16) || 0;
        const strHex = hex.slice(start + 64, start + 64 + len * 2) || '';
  const bytes = strHex.match(/.{2}/g) ?? [];
  return bytes.map((b: string) => String.fromCharCode(parseInt(b, 16))).join('');
      };
      const name = read(offs[0]) || 'Token';
      const symbol = (read(offs[1]) || 'TKN').toLowerCase();
      const marketId = market;
      if (tokenAddr) {
        tokenToMarketRef.current[tokenAddr] = marketId;
        console.debug('[Tracker] token->market mapping set', tokenAddr, '->', marketId);
      }
      if (symbol) {
        symbolToMarketRef.current[symbol] = marketId;
        console.debug('[Tracker] symbol->market mapping set', symbol, '->', marketId);
      }
      upsertMarket({ tokenAddr: tokenAddr, symbol: symbol.toUpperCase(), name, price: 0 });
      try {
        if (wsRef.current && !marketSubsRef.current[marketId]) {
          const reqId = subIdRef.current++;
          console.debug('[Tracker] addMarketFromLog subscribing to market', marketId, 'reqId=', reqId);
          wsRef.current.send(JSON.stringify({ id: reqId, jsonrpc: '2.0', method: 'eth_subscribe', params: ['logs', { address: marketId }] }));
        }
      } catch (e) { console.error('[Tracker] addMarketFromLog subscribe error', e); }
    } catch (e) {}
  }, [upsertMarket]);

  const updateMarketFromLog = useCallback((log: any) => {
    try {
      const MARKET_UPDATE_EVENT = '0xc367a2f5396f96d105baaaa90fe29b1bb18ef54c712964410d02451e67c19d3e';
      if ((log.topics || [])[0] !== MARKET_UPDATE_EVENT) return;
  const id = (log.address || '').toLowerCase();
      const hex = (log.data || '').replace(/^0x/, '');
      console.debug('[Tracker] updateMarketFromLog raw data for', id, hex.slice(0,120));
      const words: string[] = [];
      for (let i = 0; i < hex.length; i += 64) words.push(hex.slice(i, i + 64));
      const amounts = BigInt('0x' + (words[0] || '0'));
      const isBuy = BigInt('0x' + (words[1] || '0'));
      const priceRaw = BigInt('0x' + (words[2] || '0'));
      const counts = BigInt('0x' + (words[3] || '0'));
      const priceEth = Number(priceRaw) / 1e18;
      const buys = Number(counts >> 128n);
      const sells = Number(counts & ((1n << 128n) - 1n));
      const amountIn = Number(amounts >> 128n) / 1e18;
      const amountOut = Number(amounts & ((1n << 128n) - 1n)) / 1e18;
      const m = marketsRef.current.get(id) || { symbol: id, emoji: '🪙' } as MonitorToken;
  // Populate mappings from market data
      try {
  // best-effort mapping
        if (m.tokenAddress) {
          tokenToMarketRef.current[m.tokenAddress.toLowerCase()] = id;
          console.debug('[Tracker] tokenToMarketRef populated from market data', m.tokenAddress.toLowerCase(), '->', id);
        }
        if (m.symbol) {
          symbolToMarketRef.current[m.symbol.toLowerCase()] = id;
          console.debug('[Tracker] symbolToMarketRef populated from market data', m.symbol.toLowerCase(), '->', id);
        }
      } catch (e) { console.error('[Tracker] mapping populate error', e); }
      marketsRef.current.set(id, {
        ...m,
        id,
        tokenAddress: m.tokenAddress || id,
        name: m.name || m.symbol || id,
        symbol: m.symbol || id,
        emoji: m.emoji || '🪙',
        price: priceEth || m.price || 0,
        marketCap: (priceEth || m.price || 0) * SUPPLY,
        buyTransactions: (m.buyTransactions ?? 0) + buys,
        sellTransactions: (m.sellTransactions ?? 0) + sells,
        volume24h: (m.volume24h ?? 0) + (isBuy > 0 ? amountIn : amountOut),
        lastTransaction: new Date().toISOString(),
        trades: m.trades ?? []
      });
      flushMarketsToState();
    } catch (e) {}
  }, []);

  // Subscribe to all markets that tracked wallets have positions in
  const subscribeToMarkets = useCallback((ws: WebSocket, marketAddresses: string[]) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    marketAddresses.forEach(addr => {
      const marketAddr = addr.toLowerCase();
      if (!marketSubsRef.current[marketAddr]) {
        subscribe(ws, ['logs', { address: marketAddr }], (subId) => {
          marketSubsRef.current[marketAddr] = subId;
          console.log('[Tracker] Subscribed to market:', marketAddr, 'subId:', subId);
        });
      }
    });
  }, [subscribe]);

  // Initialize websocket for memecoin trades
  const openWebsocket = useCallback(() => {
    const cfg = chainCfgOf(activechain);
    const wssUrl = cfg?.wssurl;
    if (!wssUrl) {
      console.log('[Tracker] No websocket URL configured for chain:', activechain);
      return;
    }

    console.log('[Tracker] Opening websocket connection:', wssUrl);
    const ws = new WebSocket(wssUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Tracker] Websocket connected');

      // Subscribe to router events (new markets)
      const routerAddress = cfg.router;
      if (routerAddress) {
        subscribe(ws, ['logs', { address: routerAddress, topics: [ROUTER_EVENT] }]);
        console.log('[Tracker] Subscribed to router events:', routerAddress);
      }
    };

    ws.onmessage = ({ data }) => {
      try {
        const msg = JSON.parse(data);
        if (msg.method !== 'eth_subscription' || !msg.params?.result) return;

        const log = msg.params.result;
        const topic = log.topics?.[0];
        console.log('[Tracker] Websocket message received, topic:', topic);

        const TRADE_EVENT = '0x9adcf0ad0cda63c4d50f26a48925cf6405df27d422a39c456b5f03f661c82982';

        // Handle router events (new markets)
        if (topic === ROUTER_EVENT) {
          console.log('[Tracker] New market created via websocket');
          addMarketFromLog(log);
        }
        // Handle market update events
        else if (topic === MARKET_UPDATE_EVENT) {
          console.log('[Tracker] Market update via websocket');
          updateMarketFromLog(log);
        }
        // Handle trade events
        else if (topic === TRADE_EVENT) {
          console.log('[Tracker] Trade event via websocket');

          // Extract wallet address from trade event
          const marketAddr = `0x${(log.topics[1] || '').slice(26)}`.toLowerCase();
          const callerAddr = `0x${(log.topics[2] || '').slice(26)}`.toLowerCase();

          console.log('[Tracker] Trade - market:', marketAddr, 'caller:', callerAddr, 'tracked?', trackedSetRef.current.has(callerAddr));

          // Only process if wallet is tracked
          if (!trackedSetRef.current.has(callerAddr)) {
            console.log('[Tracker] Wallet not tracked, skipping trade');
            return;
          }

          // Parse trade data
          const hex = (log.data || '').startsWith('0x') ? (log.data || '').slice(2) : (log.data || '');
          const word = (i: number) => BigInt('0x' + hex.slice(i * 64, i * 64 + 64));
          const isBuy = word(0) !== 0n;
          const amountIn = Number(word(1) || 0n) / 1e18;
          const amountOut = Number(word(2) || 0n) / 1e18;
          const priceRaw = word(4) || 0n;
          const price = Number(priceRaw) / 1e18;

          // Get token address from market mapping
          let tokenAddrFromMarket = tokenToMarketRef.current[marketAddr] || marketsRef.current.get(marketAddr)?.tokenAddress;
          if (tokenAddrFromMarket) tokenAddrFromMarket = tokenAddrFromMarket.toLowerCase();

          // Update market with new trade
          try {
            upsertMarket({
              tokenAddr: tokenAddrFromMarket || marketAddr,
              price: price || 0,
              isBuy,
              amountNative: isBuy ? amountIn : amountOut,
              ts: Math.floor(Date.now() / 1000)
            });
          } catch (e) {
            console.error('[Tracker] Failed to upsert market:', e);
          }

          // Add to tracked wallet trades
          try {
            const market = marketsRef.current.get(tokenAddrFromMarket || '');
            const tradeLike = {
              id: `${log.transactionHash || ''}-${log.logIndex || ''}`,
              account: { id: callerAddr },
              isBuy,
              amountIn: BigInt(Math.floor((isBuy ? amountIn : amountOut) * 1e18)),
              amountOut: BigInt(Math.floor((isBuy ? amountOut : amountIn) * 1e18)),
              priceNativePerTokenWad: BigInt(Math.floor((price || 0) * 1e18)),
              token: {
                symbol: (market?.symbol || '').toString(),
                name: (market?.name || market?.symbol || '').toString()
              },
              timestamp: Math.floor(Date.now() / 1000).toString(),
              transactionHash: log.transactionHash || '',
            };

            // Use normalizeTrade to format it properly
            const normalizedTrade = normalizeTrade(tradeLike, trackedWalletsRef.current);

            setTrackedWalletTrades(prev => {
              const next = [normalizedTrade, ...prev];
              const seen = new Set<string>();
              const out: LiveTrade[] = [];
              for (const t of next) {
                if (!seen.has(t.id)) {
                  seen.add(t.id);
                  out.push(t);
                }
              }
              return out.slice(0, 500);
            });

            console.log('[Tracker] Added memecoin trade to LiveTrades:', normalizedTrade);
          } catch (e) {
            console.error('[Tracker] Failed to add trade:', e);
          }
        }
      } catch (e) {
        console.error('[Tracker] Websocket message error:', e);
      }
    };

    ws.onerror = (e) => {
      console.error('[Tracker] Websocket error:', e);
    };

    ws.onclose = () => {
      console.log('[Tracker] Websocket closed');
      wsRef.current = null;
    };
  }, [activechain, subscribe, addMarketFromLog, updateMarketFromLog, upsertMarket]);

  // Open websocket when component mounts or chain changes
  useEffect(() => {
    openWebsocket();

    return () => {
      if (wsRef.current) {
        console.log('[Tracker] Closing websocket');
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [openWebsocket]);

  // Subscribe to markets when positions change
  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const allMarkets = new Set<string>();
    Object.values(addressPositions).forEach(positions => {
      positions.forEach(pos => {
        const tokenAddr = pos.tokenId.toLowerCase();
        const marketAddr = tokenToMarketRef.current[tokenAddr] ||
                         Object.keys(tokenToMarketRef.current).find(k =>
                           tokenToMarketRef.current[k].toLowerCase() === tokenAddr
                         );
        if (marketAddr) {
          allMarkets.add(marketAddr.toLowerCase());
        } else {
          allMarkets.add(tokenAddr);
        }
      });
    });

    const newMarkets = Array.from(allMarkets).filter(m => !marketSubsRef.current[m]);
    if (newMarkets.length > 0) {
      console.log('[Tracker] Subscribing to', newMarkets.length, 'new markets');
      subscribeToMarkets(wsRef.current, newMarkets);
    }
  }, [addressPositions, subscribeToMarkets]);

  useEffect(() => {
    const TRADE_EVENT = '0x9adcf0ad0cda63c4d50f26a48925cf6405df27d422a39c456b5f03f661c82982';
    const MARKET_CREATED_EVENT = '0x24ad3570873d98f204dae563a92a783a01f6935a8965547ce8bf2cadd2c6ce3b';
    const MARKET_UPDATE_EVENT = '0xc367a2f5396f96d105baaaa90fe29b1bb18ef54c712964410d02451e67c19d3e';

    const handler = (ev: Event) => {
      try {
        const detail: any = (ev as CustomEvent).detail;
        const log = detail;
        // debug counters
        try {
          setForwardedLogCount(c => c + 1);
          setLastLogSummary(`${log.transactionHash || ''}@${log.logIndex || ''} topics=${(log.topics||[]).slice(0,3).map((t:any)=>t.slice(0,10)).join(',')}`);
        } catch (e) {}
        if (!log || !log.topics?.length) return;
        if (log.commitState && log.commitState !== 'Proposed') return;

        console.log('[Tracker] Received chainLog event, topic:', log.topics[0]);

        if (log.topics[0] === MARKET_CREATED_EVENT) {
          addMarketFromLog(log);
          return;
        }
        if (log.topics[0] === MARKET_UPDATE_EVENT) {
          updateMarketFromLog(log);
          return;
        }

        if (log.topics[0] === TRADE_EVENT) {
          const marketAddr = `0x${(log.topics[1] || '').slice(26)}`.toLowerCase();
          const callerAddr = `0x${(log.topics[2] || '').slice(26)}`.toLowerCase();

          console.log('[Tracker] TRADE_EVENT - caller:', callerAddr, 'tracked?', trackedSetRef.current.has(callerAddr));

          if (!trackedSetRef.current.has(callerAddr)) return;

          let tokenAddrFromMarket: string | undefined = undefined;
          try {
            tokenAddrFromMarket = tokenToMarketRef.current[marketAddr] || marketsRef.current.get(marketAddr)?.tokenAddress || (settings.chainConfig?.[activechain]?.markets?.[marketAddr]?.baseAddress);
            if (tokenAddrFromMarket) tokenAddrFromMarket = tokenAddrFromMarket.toLowerCase();
          } catch (e) {}

          const hex = (log.data || '').startsWith('0x') ? (log.data || '').slice(2) : (log.data || '');
          const word = (i: number) => BigInt('0x' + hex.slice(i * 64, i * 64 + 64));
          const isBuy = word(0) !== 0n;
          const amountIn = Number(word(1) || 0n) / 1e18;
          const amountOut = Number(word(2) || 0n) / 1e18;
          const priceRaw = word(4) || 0n;
          const price = Number(priceRaw) / 1e18;

          try { upsertMarket({ tokenAddr: tokenAddrFromMarket || marketAddr, price: price || 0, isBuy, amountNative: isBuy ? amountIn : amountOut, ts: Math.floor(Date.now() / 1000) }); } catch (e) {}

          try {
            const market = marketsRef.current.get(tokenAddrFromMarket || '');
            const tradeLike = {
              id: `${log.transactionHash || ''}-${log.logIndex || ''}`,
              account: { id: callerAddr },
              isBuy,
              amountIn: BigInt(Math.floor((isBuy ? amountIn : amountOut) * 1e18)),
              amountOut: BigInt(Math.floor((isBuy ? amountOut : amountIn) * 1e18)),
              priceNativePerTokenWad: BigInt(Math.floor((price || 0) * 1e18)),
              token: {
                symbol: (market?.symbol || '').toString(),
                name: (market?.name || market?.symbol || '').toString()
              },
              timestamp: Math.floor(Date.now() / 1000),
            };
            ingestExternalTrades([tradeLike]);
          } catch (e) {}
        }
      } catch (e) { console.error('[Tracker] app:chainLog handler error', e); }
    };

    window.addEventListener('app:chainLog', handler as EventListener);
    setAppListenerActive(true);
    return () => {
      window.removeEventListener('app:chainLog', handler as EventListener);
      setAppListenerActive(false);
    };
  }, [activechain]);


  // Bootstrap: fetch existing launchpadTokens / markets from the GraphQL endpoint
  useEffect(() => {
    let cancelled = false;
    const url = (settings as any).graphqlUrl || (settings as any).api?.graphqlUrl;
    if (!url) return;

    (async () => {
      try {
        const q = `query { launchpadTokens(first: 100, orderBy: createdAt, orderDirection: desc) { id tokenAddress name symbol lastPriceNativePerTokenWad createdAt metadataCID } }`;
        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: q }) });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        const list = json?.data?.launchpadTokens || [];
        for (const m of list) {
          try {
            const tokenAddr = (m.tokenAddress || m.id || '').toString().toLowerCase();
            const symbol = (m.symbol || '').toString();
            const price = Number(m.lastPriceNativePerTokenWad ?? 0) / 1e18;
            const ts = Number(m.createdAt) || undefined;
            upsertMarket({ tokenAddr: tokenAddr || undefined, symbol: symbol || undefined, name: m.name, price: price || 0, ts });
          } catch (e) { /* per-item ignore */ }
        }
      } catch (e) {
        console.warn('[Tracker] bootstrap fetch failed', e);
      }
    })();

    return () => { cancelled = true; };
  }, [activechain]);




  const flushMarketsToState = () => setMonitorTokens(Array.from(marketsRef.current.values()));





  

  const handleRemoveAll = () => {
    setTrackedWallets([]);
  };

  const handleReorderDragOver = (e: React.DragEvent, targetIndex: number, containerKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isMultiDrag) {
      return;
    }

    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const isTopHalf = y < rect.height / 2;

    const containerType = containerKey.split('-')[0] as 'main';

    setDragReorderState(prev => ({
      ...prev,
      dragOverIndex: targetIndex,
      dragOverPosition: isTopHalf ? 'top' : 'bottom',
      dragOverContainer: containerType
    }));

    const parentElement = element.parentElement;
    if (parentElement) {
      const parentRect = parentElement.getBoundingClientRect();
      const lineTop = isTopHalf ?
        rect.top - parentRect.top :
        rect.bottom - parentRect.top;

      setDropPreviewLine({ top: lineTop, containerKey });
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      endSelection();
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedWallets(new Set());
        endSelection();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  useEffect(()=>{
    const id=setInterval(()=>setMarketsTick(x=>x+1),15000); return ()=>clearInterval(id); 
  },[]);

  useEffect(() => {
    flushMarketsToState();
  }, [marketsTick, selectedSimpleFilter]);


  const renderWalletManager = () => {
    const filteredWallets = getFilteredWallets();
    const isSelecting = activeSelectionContainer === 'main';

    return (
      <div className="tracker-wallet-manager">
        <div className="tracker-wallets-header" data-wallet-count={filteredWallets.length}>
          <div className="tracker-wallet-header-cell tracker-wallet-created">Created</div>
          <div className="tracker-wallet-header-cell tracker-wallet-drag-handle"></div>
          <div className="tracker-wallet-header-cell tracker-wallet-profile">Name</div>
          <div 
            className={`tracker-wallet-header-cell tracker-wallet-balance sortable ${walletSortField === 'balance' ? 'active' : ''}`}
            onClick={() => handleWalletSort('balance')}
          >
            Balance
          </div>
          <div 
            className={`tracker-wallet-header-cell tracker-wallet-last-active sortable ${walletSortField === 'lastActive' ? 'active' : ''}`}
            onClick={() => handleWalletSort('lastActive')}
          >
            Last Active
          </div>
          <div className="tracker-wallet-header-cell tracker-wallet-actions">Actions</div>
        </div>
        

        {/* Wallet List Container */}
        <div 
          className={`tracker-wallets-container ${isSelecting ? 'selecting' : ''}`}
          ref={mainWalletsRef}
          onMouseDown={startSelection}
          onMouseMove={(e) => updateSelection(e, e.currentTarget)}
          onDrop={handleReorderDrop}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Selection Rectangle */}
          {selectionRect && activeSelectionContainer === 'main' && (
            <div
              className="selection-rectangle"
              style={{
                left: Math.min(selectionRect.startX, selectionRect.currentX),
                top: Math.min(selectionRect.startY, selectionRect.currentY),
                width: Math.abs(selectionRect.currentX - selectionRect.startX),
                height: Math.abs(selectionRect.currentY - selectionRect.startY),
              }}
            />
          )}

          {/* Empty State */}
          {filteredWallets.length === 0 ? (
            <div className="tracker-empty-state">
              <div className="tracker-empty-content">
                <h4>No Wallets Found</h4>
                <p>
                  {searchQuery.trim() 
                    ? "No wallets match your search criteria." 
                    : "Add your first wallet to start tracking."}
                </p>
                {!searchQuery.trim() && (
                  <button
                    className="tracker-add-wallet-empty-btn"
                    onClick={() => setShowAddWalletModal(true)}
                  >
                    Add Wallet
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Wallet List */
            filteredWallets.map((wallet, index) => renderWalletItem(wallet, index))
          )}

          
        </div>
      </div>
    );
  };


  const renderLiveTrades = () => {
    const filteredTrades = getFilteredTrades();

    return (
      <div className="tracker-live-trades">
        <div className="detail-trades-table">
          <div className="detail-trades-table-header">
            <div
              className={`detail-trades-header-cell detail-trades-time sortable ${tradeSortField === 'dateCreated' ? 'active' : ''}`}
              onClick={() => handleTradeSort('dateCreated')}
            >
              Time
              {/* ... */}
            </div>
            <div className="detail-trades-header-cell detail-trades-account">Account</div>
            <div className="detail-trades-header-cell" style={{minWidth: '70px', width: '70px'}}>Type</div>
            <div className="detail-trades-header-cell" style={{minWidth: '100px', width: '100px'}}>Token</div>
            <div
              className={`detail-trades-header-cell sortable ${tradeSortField === 'amount' ? 'active' : ''}`}
              style={{minWidth: '100px', width: '100px'}}
              onClick={() => handleTradeSort('amount')}
            >
              Amount
            </div>
            <div
              className={`detail-trades-header-cell sortable ${tradeSortField === 'marketCap' ? 'active' : ''}`}
              onClick={() => handleTradeSort('marketCap')}
            >
              Market Cap
            </div>
          </div>

          <div className="detail-trades-body">
            {filteredTrades.length === 0 ? (
              <div className="tracker-empty-state">
                <div className="tracker-empty-content">
                  <h4>No Trades Found</h4>
                  <p>No trades match your search criteria.</p>
                </div>
              </div>
            ) : (
              filteredTrades.map((trade) => (
                <div
                  key={trade.id}
                  className={`detail-trades-row ${trade.type === 'buy' ? 'buy' : 'sell'}`}
                >
                  <div className="detail-trades-col detail-trades-time">
                    {trade.time}
                  </div>

                  <div className="detail-trades-col detail-trades-account">
                    <div className="detail-trades-avatar">
                      <div>
                        <img src={defaultPfp} alt="Avatar" />
                      </div>
                    </div>
                    <span className="detail-trades-address">
                      {trade.walletName}
                    </span>
                  </div>

                  <div className="detail-trades-col" style={{minWidth: '70px', width: '70px'}}>
                    <span className={`detail-trade-type-badge ${trade.type}`}>
                      {trade.type === 'buy' ? 'Buy' : 'Sell'}
                    </span>
                  </div>

                  <div className="detail-trades-col">
                    {trade.token}
                  </div>

                  <div className="detail-trades-col">
                    <span
                      className={[
                        'detail-trades-amount',
                        trade.type === 'buy' ? 'amount-buy' : 'amount-sell',
                        isBlurred ? 'blurred' : ''
                      ].join(' ')}
                    >
                      {trade.amount < 0.0001
                        ? trade.amount.toExponential(2)
                        : trade.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </span>
                  </div>

                  <div className="detail-trades-col" style={{minWidth: '120px', width: '120px'}}>
                    <span className={isBlurred ? 'blurred' : ''}>
                      ${formatCompact(trade.marketCap)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  };

  const renderMonitor = () => {
    const allPositions = getFilteredPositions();

    console.log('[Tracker] Monitor - allPositions:', allPositions.length);

    // Separate graduated and non-graduated launchpad positions
    const graduatedPositions = allPositions.filter(p => p.isOrderbook);
    const nonGraduatedPositions = allPositions.filter(p => !p.isOrderbook);

    console.log('[Tracker] Monitor - graduated:', graduatedPositions.length, 'non-graduated:', nonGraduatedPositions.length);

    // Launchpad column: graduated tokens at top, then non-graduated
    let launchpadPositions = [...graduatedPositions, ...nonGraduatedPositions];

    console.log('[Tracker] Monitor - launchpadPositions:', launchpadPositions.length);

    // Orderbook column: Aggregate balances across all wallets and pass to PortfolioContent
    // Aggregate balances across all tracked wallets into a single tokenBalances object
    const aggregatedTokenBalances: { [address: string]: bigint } = {};
    trackedWallets.forEach(wallet => {
      const tokenBalances = walletTokenBalances?.[wallet.address];
      if (!tokenBalances) return;

      Object.entries(tokenBalances).forEach(([tokenAddress, balance]) => {
        if (!aggregatedTokenBalances[tokenAddress]) {
          aggregatedTokenBalances[tokenAddress] = 0n;
        }
        aggregatedTokenBalances[tokenAddress] += balance as bigint;
      });
    });

    console.log('Monitor Debug - tokenList:', tokenList);
    console.log('Monitor Debug - marketsData:', marketsData);
    console.log('Monitor Debug - aggregatedTokenBalances:', aggregatedTokenBalances);

    const formatValue = (value: number): string => {
      const converted = monitorCurrency === 'USD' ? value * monUsdPrice : value;
      if (converted === 0) return '0';
      const absNum = Math.abs(converted);
      const sign = converted < 0 ? '-' : '';

      if (absNum >= 1000000) {
        return `${sign}${(absNum / 1000000).toFixed(2)}M`;
      } else if (absNum >= 1000) {
        return `${sign}${(absNum / 1000).toFixed(2)}K`;
      }
      return `${sign}${absNum.toFixed(2)}`;
    };

    const renderPositionCard = (pos: GqlPosition) => {
      const tokenName = pos.name || pos.symbol || 'Unknown';
      const tokenSymbol = pos.symbol || 'UNK';
      const walletName = (pos as any).walletName || 'Unknown';
      const walletEmoji = (pos as any).walletEmoji || '👤';
      const isPinned = pinnedTokens.has(pos.tokenId);

      // Get market data for metric coloring
      const market = marketsRef.current.get(pos.tokenId.toLowerCase());
      const classes: string[] = ['tracker-monitor-card'];

      // Add metric coloring classes
      if (market) {
        classes.push('metric-colored');

        // Market cap coloring
        const marketCap = pos.lastPrice * 1e9;
        if (marketCap < 30000) {
          classes.push('market-cap-range1');
        } else if (marketCap < 150000) {
          classes.push('market-cap-range2');
        } else {
          classes.push('market-cap-range3');
        }

        // Volume coloring
        if (market.volume24h) {
          const volume = Number(market.volume24h);
          if (volume < 1000) {
            classes.push('volume-range1');
          } else if (volume < 2000) {
            classes.push('volume-range2');
          } else {
            classes.push('volume-range3');
          }
        }

        // Holders coloring
        if (market.holders) {
          const holders = Number(market.holders);
          if (holders < 10) {
            classes.push('holders-range1');
          } else if (holders < 50) {
            classes.push('holders-range2');
          } else {
            classes.push('holders-range3');
          }
        }
      }

      // Add graduated class
      if (pos.isOrderbook) {
        classes.push('graduated');
      }

      return (
        <div key={`${pos.tokenId}_${(pos as any).walletAddress}`} className={classes.join(' ')}>
          <div
            className="tracker-monitor-card-header"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              // Navigate to token detail page
              window.location.href = `/board/${pos.tokenId}`;
            }}
          >
            <div className="tracker-monitor-card-top">
              <div className="tracker-monitor-left-section">
                <div
                  className="tracker-monitor-icon-container"
                  style={{ '--progress': 0 } as React.CSSProperties}
                >
                  <div className="tracker-monitor-icon-spacer">
                    {pos.imageUrl ? (
                      <img
                        src={pos.imageUrl}
                        alt={tokenSymbol}
                        className="tracker-monitor-token-image"
                        style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="tracker-monitor-icon-emoji">🪙</span>
                    )}
                  </div>
                </div>

                <div className="tracker-monitor-token-details">
                  <div className="tracker-monitor-token-name-row">
                    <span className="tracker-monitor-token-name-text">{tokenName}</span>
                    <div className="tracker-monitor-address-copy-group">
                      <span className="tracker-monitor-token-ca">
                        {pos.tokenId.slice(0, 6)}...{pos.tokenId.slice(-4)}
                      </span>
                      <img
                        src={copy}
                        className="tracker-monitor-copy-icon"
                        alt="Copy"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(pos.tokenId);
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <button
                      className={`tracker-monitor-action-btn ${isPinned ? 'pinned' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPinnedTokens(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(pos.tokenId)) {
                            newSet.delete(pos.tokenId);
                          } else {
                            newSet.add(pos.tokenId);
                          }
                          return newSet;
                        });
                      }}
                    >
                      {isPinned ? '★' : '☆'}
                    </button>
                  </div>
                  <div className="tracker-monitor-token-subtitle">
                    <span className="tracker-monitor-token-symbol">{tokenSymbol}</span>
                    <span className="tracker-monitor-wallet-badge">
                      {walletEmoji} {walletName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="tracker-monitor-right-section">
                <div className="tracker-monitor-buy-sell-row">
                  <div className="tracker-monitor-buy-amount">
                    +{formatValue(pos.spentNative)}
                    <span className="tracker-monitor-tx-mini"> (bought)</span>
                  </div>
                  <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
                  <div className="tracker-monitor-sell-amount">
                    −{formatValue(pos.receivedNative)}
                    <span className="tracker-monitor-tx-mini"> (sold)</span>
                  </div>
                </div>

                <div className="tracker-monitor-quickbuy-section">
                  <button
                    className="tracker-monitor-quickbuy-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle quick buy/sell
                    }}
                  >
                    <svg
                      className="tracker-monitor-quickbuy-icon"
                      viewBox="0 0 72 72"
                      fill="currentColor"
                    >
                      <path d="M30.992,60.145c-0.599,0.753-1.25,1.126-1.952,1.117c-0.702-0.009-1.245-0.295-1.631-0.86 c-0.385-0.565-0.415-1.318-0.09-2.26l5.752-16.435H20.977c-0.565,0-1.036-0.175-1.412-0.526C19.188,40.83,19,40.38,19,39.833 c0-0.565,0.223-1.121,0.668-1.669l21.34-26.296c0.616-0.753,1.271-1.13,1.965-1.13s1.233,0.287,1.618,0.86 c0.385,0.574,0.415,1.331,0.09,2.273l-5.752,16.435h12.095c0.565,0,1.036,0.175,1.412,0.526C52.812,31.183,53,31.632,53,32.18 c0,0.565-0.223,1.121-0.668,1.669L30.992,60.145z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="tracker-monitor-stats-section">
              <div className="tracker-monitor-stat-compact">
                <span className="stat-label">Remaining</span>
                <span className="stat-value">{pos.remainingTokens?.toFixed(2) || 0}</span>
              </div>
              <div className="tracker-monitor-stat-compact">
                <span className="stat-label">Price</span>
                <span className={`stat-value ${monitorCurrency === 'MON' ? 'tracker-monitor-stat-value-with-icon' : ''}`}>
                  {monitorCurrency === 'USD' ? (
                    <>$<span>{(pos.lastPrice * monUsdPrice).toFixed(6)}</span></>
                  ) : (
                    <>
                      <span>{pos.lastPrice?.toFixed(6) || 0}</span>
                      <img src={monadicon} style={{ width: '10px', height: '10px' }} alt="MON" />
                    </>
                  )}
                </span>
              </div>
              <div className="tracker-monitor-stat-compact">
                <span className="stat-label">PNL</span>
                <span
                  className="stat-value"
                  style={{ color: (pos.pnlNative ?? 0) >= 0 ? '#4ade80' : '#f87171' }}
                >
                  {monitorCurrency === 'USD' ? (
                    <>$<span>{formatValue(pos.pnlNative)}</span></>
                  ) : (
                    <>
                      <span>{formatValue(pos.pnlNative)}</span>
                      <img src={monadicon} style={{ width: '10px', height: '10px' }} alt="MON" />
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="tracker-monitor">
        {allPositions.length === 0 && Object.keys(aggregatedTokenBalances).length === 0 ? (
          <div className="tracker-empty-state">
            <div className="tracker-empty-content">
              <h4>No Open Positions</h4>
              <p>Your tracked wallets don't have any open positions yet.</p>
            </div>
          </div>
        ) : (
          <div className="explorer-columns">
            <div className="explorer-column">
              <div className="explorer-column-header">
                <div className="explorer-column-title-section">
                  <h2 className="explorer-column-title">Launchpad</h2>
                </div>
                <div className="explorer-column-title-right">
                  <div
                    className={`column-pause-icon ${pausedColumn === 'launchpad' ? 'visible' : ''}`}
                    onClick={() => setPausedColumn(prev => prev === 'launchpad' ? null : 'launchpad')}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M7 19h2V5H7v14zm8-14v14h2V5h-2z" />
                    </svg>
                  </div>
                  <div className="explorer-quickbuy-container">
                    <img
                      className="explorer-quick-buy-search-icon"
                      src={lightning}
                      alt=""
                    />
                    <input
                      type="text"
                      placeholder="0.0"
                      value={quickAmounts.launchpad}
                      onChange={(e) => setQuickAmount('launchpad', e.target.value)}
                      onFocus={handleInputFocus}
                      className="explorer-quickbuy-input"
                    />
                    <img
                      className="quickbuy-monad-icon"
                      src={monadicon}
                    />
                    <div className="explorer-preset-controls">
                      {[1, 2, 3].map((p) => (
                        <Tooltip
                          key={p}
                          offset={35}
                          content={
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <img
                                  src={slippage}
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                  }}
                                  alt="Slippage"
                                />
                                <span>
                                  {buyPresets[p]?.slippage || '0'}%
                                </span>
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <img
                                  src={gas}
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                  }}
                                  alt="Priority"
                                />
                                <span>
                                  {buyPresets[p]?.priority || '0'}{' '}
                                </span>
                              </div>
                            </div>
                          }
                        >
                          <button
                            className={`explorer-preset-pill ${activePresets.launchpad === p ? 'active' : ''}`}
                            onClick={() => setActivePreset('launchpad', p)}
                          >
                            P{p}
                          </button>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                  <Tooltip content="Filters">
                    <button
                      className="column-filter-icon"
                      onClick={() => setShowMonitorFiltersPopup(true)}
                      title="filter launchpad"
                    >
                      <img className="filter-icon" src={filter} />
                    </button>
                  </Tooltip>
                </div>
              </div>
              <div className="explorer-tokens-list">
                <div className="tracker-monitor-grid">
                  {launchpadPositions.map((pos, idx) => {
                    if (idx === 0) console.log('[Tracker] Rendering first launchpad position:', pos);
                    return renderPositionCard(pos);
                  })}
                </div>
              </div>
            </div>

            <div className="explorer-column">
              <div className="explorer-column-header">
                <div className="explorer-column-title-section">
                  <h2 className="explorer-column-title">Orderbook</h2>
                </div>
                <div className="explorer-column-title-right">
                  <div
                    className={`column-pause-icon ${pausedColumn === 'orderbook' ? 'visible' : ''}`}
                    onClick={() => setPausedColumn(prev => prev === 'orderbook' ? null : 'orderbook')}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M7 19h2V5H7v14zm8-14v14h2V5h-2z" />
                    </svg>
                  </div>
                  <div className="explorer-quickbuy-container">
                    <img
                      className="explorer-quick-buy-search-icon"
                      src={lightning}
                      alt=""
                    />
                    <input
                      type="text"
                      placeholder="0.0"
                      value={quickAmounts.orderbook}
                      onChange={(e) => setQuickAmount('orderbook', e.target.value)}
                      onFocus={handleInputFocus}
                      className="explorer-quickbuy-input"
                    />
                    <img
                      className="quickbuy-monad-icon"
                      src={monadicon}
                    />
                    <div className="explorer-preset-controls">
                      {[1, 2, 3].map((p) => (
                        <Tooltip
                          key={p}
                          offset={35}
                          content={
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <img
                                  src={slippage}
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                  }}
                                  alt="Slippage"
                                />
                                <span>
                                  {buyPresets[p]?.slippage || '0'}%
                                </span>
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <img
                                  src={gas}
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                  }}
                                  alt="Priority"
                                />
                                <span>
                                  {buyPresets[p]?.priority || '0'}{' '}
                                </span>
                              </div>
                            </div>
                          }
                        >
                          <button
                            className={`explorer-preset-pill ${activePresets.orderbook === p ? 'active' : ''}`}
                            onClick={() => setActivePreset('orderbook', p)}
                          >
                            P{p}
                          </button>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                  <Tooltip content="Filters">
                    <button
                      className="column-filter-icon"
                      onClick={() => setShowMonitorFiltersPopup(true)}
                      title="filter orderbook"
                    >
                      <img className="filter-icon" src={filter} />
                    </button>
                  </Tooltip>
                </div>
              </div>
              <div className="explorer-tokens-list">
                <PortfolioHeader
                  onSort={() => {}}
                  sortConfig={{ column: 'assets', direction: 'asc' }}
                />
                <PortfolioContent
                  tokenList={tokenList || []}
                  onMarketSelect={() => {}}
                  setSendTokenIn={() => {}}
                  setpopup={setpopup}
                  sortConfig={{ column: 'assets', direction: 'asc' }}
                  tokenBalances={aggregatedTokenBalances}
                  marketsData={marketsData || []}
                  isBlurred={isBlurred}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWalletItem = (wallet: TrackedWallet, index: number) => {
    const isSelected = selectedWallets.has(wallet.id);
    const isPreviewSelected = previewSelection.has(wallet.id);
    const isDragging = dragReorderState.draggedIndex === index && dragReorderState.draggedContainer === 'main';
    const isDragOver = dragReorderState.dragOverIndex === index && dragReorderState.dragOverContainer === 'main';
    const containerKey = 'tracker-wallets';

    return (
      <div
        key={wallet.id}
        data-wallet-id={wallet.id}
        className={`tracker-wallet-item ${isSelected ? 'selected' : ''} ${isPreviewSelected ? 'preview-selected' : ''} ${isDragging ? 'dragging' : ''} ${isMultiDrag && isSelected ? 'multi-drag-ghost' : ''} ${(isSelected || isPreviewSelected) ? 'handle-visible' : ''}`}
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          setDropPreviewLine(null);
          setDragReorderState(prev => ({
            ...prev,
            draggedIndex: index,
            draggedContainer: 'main'
          }));

          if (selectedWallets.size > 1 && isSelected) {
            handleMultiDragStart(e);
            return;
          }

          setSelectedWallets(new Set([wallet.id]));

          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'single-drag',
            wallet: wallet,
            index: index
          }));

          const reorderData = {
            type: 'reorder',
            index: index,
            container: 'main',
            timestamp: Date.now()
          };
          e.dataTransfer.setData('text/reorder', JSON.stringify(reorderData));
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          setIsMultiDrag(false);
          setDragReorderState({
            draggedIndex: -1,
            dragOverIndex: -1,
            dragOverPosition: null,
            draggedContainer: null,
            dragOverContainer: null
          });
          setDropPreviewLine(null);
          setDraggedWallet(null);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isMultiDrag) {
            handleReorderDragOver(e, index, containerKey);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const relatedTarget = e.relatedTarget as Node;
          if (!e.currentTarget.contains(relatedTarget)) {
            setDropPreviewLine(null);
            setDragReorderState(prev => ({ ...prev, dragOverIndex: -1, dragOverPosition: null }));
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isMultiDrag) {
            handleReorderDrop(e);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (e.ctrlKey || e.metaKey) {
            setSelectedWallets(prev => {
              const newSet = new Set(prev);
              if (newSet.has(wallet.id)) {
                newSet.delete(wallet.id);
              } else {
                newSet.add(wallet.id);
              }
              return newSet;
            });
          } else {
            setSelectedWallets(new Set([wallet.id]));
          }
        }}
      >
        {/* Multi-drag count badge */}
        {isMultiDrag && isSelected && selectedWallets.size > 1 && (
          <div className="multi-drag-count">
            {selectedWallets.size}
          </div>
        )}

        {/* Drop preview line */}
        {!isMultiDrag && dropPreviewLine && dropPreviewLine.containerKey === containerKey && isDragOver && (
          <div
            className="drop-preview-line"
            style={{
              top: dragReorderState.dragOverPosition === 'top' ? -1 : '100%'
            }}
          />
        )}

        {/* Created column - MOVED TO FIRST */}
        <div className="tracker-wallet-created">
          <span className="tracker-wallet-created-date">
            {new Date(wallet.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
          <span className="tracker-wallet-created-time">
            {new Date(wallet.createdAt).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>

        {/* Drag handle column */}
        <div className="tracker-wallet-drag-handle">
          <Tooltip content="Drag to reorder wallet">
            <img src={circle} className="tracker-drag-handle-icon" alt="Drag" />
          </Tooltip>
        </div>

        {/* Profile column */}
        <div className="tracker-wallet-profile">
          <div className="tracker-wallet-avatar">
            <img src={defaultPfp} alt={wallet.name} />
          </div>
          <div className="tracker-wallet-name-container">
            {editingWallet === wallet.id ? (
              <div className="tracker-wallet-name-edit-container">
                <input
                  type="text"
                  className="tracker-wallet-name-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      saveWalletName(wallet.id);
                    } else if (e.key === 'Escape') {
                      setEditingWallet(null);
                      setEditingName('');
                    }
                  }}
                  autoFocus
                  onBlur={() => saveWalletName(wallet.id)}
                />
              </div>
            ) : (
              <div className="tracker-wallet-name-display">
                <span className="tracker-wallet-name">{wallet.name}</span>
                {editingWallet !== wallet.id && (
                  <div className="tracker-wallet-address">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    <img
                      src={copy}
                      className="tracker-copy-icon"
                      alt="Copy"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(wallet.address);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                )}
                <Edit2
                  size={12}
                  className="tracker-wallet-name-edit-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditingWallet(wallet.id);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Balance column */}
        <div className="tracker-wallet-balance">
          <span className={`tracker-balance-value ${isBlurred ? 'blurred' : ''}`}>
            {(() => {
              const b = walletTokenBalances[wallet.address];
              const ethToken = chainCfg?.eth; 

              let balanceInMON;
              if (b && ethToken) {
                balanceInMON = Number(b[ethToken] || 0) / 1e18; 
              } else {
                balanceInMON = wallet.balance;                  
              }


              const displayValue = walletCurrency === 'USD' 
                ? (balanceInMON * monUsdPrice)
                : balanceInMON;

              if (walletCurrency === 'USD') {
                return `$${displayValue.toFixed(2)}`;
              } else {
                return displayValue.toFixed(2);
              }
            })()}
          </span>
          {walletCurrency === 'MON' && (
            <img src={monadicon} className="tracker-balance-icon" alt="MON" />
          )}
        </div>

        <div className="tracker-wallet-last-active">
          <span className="tracker-wallet-last-active-time">
            {lastActiveLabel(wallet)}
          </span>
        </div>

        {/* Actions column */}
        <div className="tracker-wallet-actions">
          <Tooltip content="View on Explorer">
            <a
              href={`${chainCfg?.explorer}/address/${wallet.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tracker-action-button"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <svg
                className="tracker-action-icon-svg"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="white"
              >
                <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
              </svg>
            </a>
          </Tooltip>

          <Tooltip content="Delete Wallet">
            <button
              className="tracker-action-button delete-button"
              onClick={(e) => {
                e.stopPropagation();
                confirmDeleteWallet(wallet.id);
              }}
            >
              <img src={trash} className="tracker-action-icon" alt="Delete" />
            </button>
          </Tooltip>
        </div>
      </div>
    );
  };

  

  const startSelection = (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      
      if ((e.target as HTMLElement).closest('.tracker-wallet-item')) {
        return;
      }

      e.stopPropagation();

      if (!e.ctrlKey && !e.metaKey) {
        setSelectedWallets(new Set());
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;

      setActiveSelectionContainer('main');
      setSelectionRect({
        startX,
        startY,
        currentX: startX,
        currentY: startY
      });
  };

  return (
    <div className="tracker-container">
      <div className="tracker-header">
        <div className="tracker-tabs">
          <button
            className={`tracker-tab ${activeTab === 'wallets' ? 'active' : ''}`}
            onClick={() => setActiveTab('wallets')}
          >
            Wallet Manager
          </button>
          <button
            className={`tracker-tab ${activeTab === 'trades' ? 'active' : ''}`}
            onClick={() => setActiveTab('trades')}
          >
            Live Trades
          </button>

          <button
            className={`tracker-tab ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitor')}
          >
            Monitor
          </button>
        </div>
        {activeTab === 'wallets' && (
          <div className="tracker-header-actions">
            <div className="tracker-search">
              <Search size={14} className="tracker-search-icon" />
              <input
                type="text"
                placeholder="Search by name or addr..."
                className="tracker-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className="tracker-header-button"
              onClick={() => setShowImportPopup(true)}
            >
              Import
            </button>
            <button
              className="tracker-header-button"
              onClick={handleExportWallets}
              disabled={trackedWallets.length === 0}
            >
              Export
            </button>
            <button
              className="tracker-header-button"
              onClick={() => setWalletCurrency(prev => prev === 'USD' ? 'MON' : 'USD')}
            >
              {walletCurrency === 'USD' ? 'USD' : 'MON'}
            </button>
            <button
              className="tracker-add-button"
              onClick={() => setShowAddWalletModal(true)}
            >
              Add Wallet
            </button>
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="tracker-header-actions">
            <div className="tracker-search">
              <Search size={14} className="tracker-search-icon" />
              <input
                type="text"
                placeholder="Search by name or ticker"
                className="tracker-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="tracker-header-button" onClick={() => setpopup(33)}>
              <img
                className="tracker-settings-image"
                src={settingsicon}
              />
            </button>
            <button className="tracker-header-button" onClick={() => setShowFiltersPopup(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M7 12h10M10 18h4" />
              </svg>
            </button>
            <button className="tracker-header-button" onClick={() => setpopup(34)}>P1</button>
            <div className="tracker-combined-flash-input">
              <button className="tracker-combined-flash-btn" onClick={() => setpopup(33)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </button>
              <input
                type="text"
                className="tracker-combined-input"
                placeholder="0.0"
                onFocus={(e) => e.target.placeholder = ''}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    e.target.placeholder = '0.0';
                  }
                }}
              />
              <img src={monadicon} className="tracker-combined-mon-icon" alt="MON" />
            </div>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="tracker-header-actions">
            <div className="tracker-search">
              <Search size={14} className="tracker-search-icon" />
              <input
                type="text"
                placeholder="Search by name or ticker"
                className="tracker-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="tracker-header-button" onClick={() => setShowMonitorFiltersPopup(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M7 12h10M10 18h4" />
              </svg>
            </button>
            <button
              className="tracker-header-button"
              onClick={() => setMonitorCurrency(prev => prev === 'USD' ? 'MON' : 'USD')}
            >
              {monitorCurrency === 'USD' ? 'USD' : 'MON'}
            </button>
            <button className="tracker-header-button" onClick={() => setpopup(34)}>P1</button>
            <div className="tracker-combined-flash-input">
              <button className="tracker-combined-flash-btn" onClick={() => setpopup(33)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </button>
              <input
                type="text"
                className="tracker-combined-input"
                placeholder="0.0"
                onFocus={(e) => e.target.placeholder = ''}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    e.target.placeholder = '0.0';
                  }
                }}
              />
              <img src={monadicon} className="tracker-combined-mon-icon" alt="MON" />
            </div>
          </div>
        )}
      </div>

      <div className="tracker-content">
        {activeTab === 'wallets' ? renderWalletManager() :
          activeTab === 'trades' ? renderLiveTrades() :
            renderMonitor()}
      </div>

      {showAddWalletModal && (
        <div className="tracker-modal-backdrop" onClick={closeAddWalletModal}>
          <div className="tracker-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="tracker-modal-header">
              <h3 className="tracker-modal-title">Add Wallet</h3>
              <button className="tracker-modal-close" onClick={closeAddWalletModal}>
                <img src={closebutton} className="close-button-icon" />
              </button>
            </div>
            <div className="tracker-modal-content">
              <div className="tracker-input-section">
                <label className="tracker-label">Wallet Address:</label>
                <input
                  type="text"
                  className="tracker-input"
                  value={newWalletAddress}
                  onChange={(e) => {
                    setNewWalletAddress(e.target.value);
                    setAddWalletError('');
                  }}
                  placeholder="0x..."
                />
              </div>

              <div className="tracker-input-section">
                <label className="tracker-label">Wallet Name:</label>
                <div className="tracker-input-with-emoji">
                  <button 
                    className="tracker-emoji-picker-trigger"
                    onClick={(e) => {
                      if (!showEmojiPicker) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setEmojiPickerPosition({
                          top: rect.bottom + window.scrollY + 8,
                          left: rect.left + window.scrollX + (rect.width / 2)
                        });
                      }
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    type="button"
                  >
                    {newWalletEmoji}
                  </button>
                  <input
                    type="text"
                    className="tracker-input tracker-input-with-emoji-field"
                    value={newWalletName}
                    onChange={(e) => {
                      setNewWalletName(e.target.value);
                      setAddWalletError('');
                    }}
                    placeholder="Enter a name for this wallet"
                    maxLength={20}
                  />
                </div>
              </div>

              {addWalletError && (
                <div className="tracker-error-message">
                  {addWalletError}
                </div>
              )}

              <div className="tracker-modal-actions">
                <button
                  className="tracker-confirm-button"
                  onClick={handleAddWallet}
                  disabled={!newWalletAddress.trim()}
                >
                  Add Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEmojiPicker && emojiPickerPosition && (
        <div className="tracker-emoji-picker-backdrop" onClick={() => {
          setShowEmojiPicker(false);
          setEmojiPickerPosition(null);
        }}>
          <div 
            className="tracker-emoji-picker-positioned" 
            onClick={(e) => e.stopPropagation()}
            style={{
              top: `${emojiPickerPosition.top}px`,
              left: `${emojiPickerPosition.left}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                setNewWalletEmoji(emojiData.emoji);
                setShowEmojiPicker(false);
                setEmojiPickerPosition(null);
              }}
              width={350}
              height={400}
              searchDisabled={false}
              skinTonesDisabled={true}
              previewConfig={{
                showPreview: false
              }}
              style={{
                backgroundColor: '#000000',
                border: '1px solid rgba(179, 184, 249, 0.2)'
              }}
            />
          </div>
        </div>
      )}


      {showFiltersPopup && (
        <LiveTradesFiltersPopup
          onClose={() => setShowFiltersPopup(false)}
          onApply={handleApplyFilters}
          initialFilters={activeFilters}
        />
      )}

      {showDeleteConfirmation && (
        <div className="tracker-modal-backdrop" onClick={() => {
          setShowDeleteConfirmation(false);
          setDontShowDeleteAgain(false);
        }}>
          <div className="tracker-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="tracker-modal-header">
              <h3 className="tracker-modal-title">Delete Wallet</h3>
              <button className="tracker-modal-close" onClick={() => {
                setShowDeleteConfirmation(false);
                setDontShowDeleteAgain(false);
              }}>
                <img src={closebutton} className="close-button-icon" />
              </button>
            </div>
            <div className="tracker-modal-content">
              <div className="tracker-delete-warning">
                <p>Are you sure you want to remove this wallet from tracking?</p>
                <p>This action cannot be undone.</p>
              </div>
              
              <div className="checkbox-row">
                <input
                  type="checkbox"
                  className="tracker-delete-checkbox"
                  id="dontShowDeleteAgain"
                  checked={dontShowDeleteAgain}
                  onChange={(e) => setDontShowDeleteAgain(e.target.checked)}
                />
                <label className="checkbox-label" htmlFor="dontShowDeleteAgain">
                  Don't show this confirmation again
                </label>
              </div>
              
              <div className="tracker-modal-actions">
                <button
                  className="tracker-delete-confirm-button"
                  onClick={deleteWallet}
                >
                  Delete Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportPopup && (
        <ImportWalletsPopup
          onClose={() => setShowImportPopup(false)}
          onImport={handleImportWallets}
        />
      )}

      {showMonitorFiltersPopup && (
        <MonitorFiltersPopup
          onClose={() => setShowMonitorFiltersPopup(false)}
          onApply={handleApplyMonitorFilters}
          onSimpleSort={setSelectedSimpleFilter}
          initialFilters={monitorFilters}
        />
      )}
    </div>
  );
};

export default Tracker;