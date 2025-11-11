import { Search, Edit2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import copy from '../../assets/copy.svg';
import closebutton from '../../assets/close_button.png';
import monadicon from '../../assets/monadlogo.svg';
import trash from '../../assets/trash.svg';
import lightning from '../../assets/flash.png';
import filter from '../../assets/filter.svg';
import gas from '../../assets/gas.svg';
import slippage from '../../assets/slippage.svg';
import { settings } from '../../settings';
import { loadBuyPresets } from '../../utils/presetManager';
import { createPublicClient, http, encodeFunctionData } from 'viem';
import ImportWalletsPopup from './ImportWalletsPopup';
import AddWalletModal from './AddWalletModal';
import {
  showLoadingPopup,
  updatePopup,
} from '../MemeTransactionPopup/MemeTransactionPopupManager';

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

interface LaunchpadPositionData {
  token: {
    id: string;
    symbol?: string;
    name?: string;
    lastPriceNativePerTokenWad: string;
    metadataCID?: string;
    migrated: boolean;
  };
  tokenBought: string;
  tokenSold: string;
  nativeSpent: string;
  nativeReceived: string;
  tokens: string;
}

const createPositionFromData = (p: LaunchpadPositionData, isOrderbook: boolean): GqlPosition => {
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
    isOrderbook,
  };
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

    const { data, errors } = result;
    if (errors) {
      console.error('[Tracker] GraphQL errors:', errors);
    }

    const allPositions: LaunchpadPositionData[] = data?.launchpadPositions ?? [];

    // Separate launchpad (not migrated) and orderbook (migrated) positions
    const launchpadRows = allPositions.filter(p => !p.token.migrated);
    const orderbookRows = allPositions.filter(p => p.token.migrated);

    const positions: GqlPosition[] = [
      ...launchpadRows.map(p => createPositionFromData(p, false)),
      ...orderbookRows.map(p => createPositionFromData(p, true)),
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
import { useSharedContext } from '../../contexts/SharedContext';
import MonitorFiltersPopup, { MonitorFilterState } from './MonitorFiltersPopup/MonitorFiltersPopup';
import '../TokenExplorer/TokenExplorer.css';
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

import { config } from '../../wagmi';
import { CrystalMarketAbi } from '../../abis/CrystalMarketAbi';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi';


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
  tokenAddress?: string;
  tokenIcon?: string;
  amount: number;
  price: number;
  marketCap: number;
  time: string;
  txHash: string;
  type: 'buy' | 'sell';
  createdAt: string;
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
  imageUrl?: string;
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

  const q1 = `query ($account: String!, $first: Int!) { trades(where: { account: $account }, orderBy: block, orderDirection: desc, first: $first) { id token { id symbol name } account { id } block isBuy priceNativePerTokenWad amountIn amountOut } }`;
  try {
    const resp = await tryPost({ query: q1, variables: { account: account.toLowerCase(), first } });
    const list = resp?.data?.trades;
    if (Array.isArray(list) && list.length) return list;
  } catch (e) {
  }

  const q2 = `query ($account: [Bytes!], $first: Int!) { launchpadTokens(first: 1000) { id symbol name metadataCID trades(where: { account_in: $account }, orderBy: block, orderDirection: desc, first: $first) { id account { id } block isBuy priceNativePerTokenWad amountIn amountOut } } }`;
  try {
    const resp2 = await tryPost({ query: q2, variables: { account: [account.toLowerCase()], first } });
    const tokens = resp2?.data?.launchpadTokens;
    if (Array.isArray(tokens)) {
      const out: any[] = [];
      for (const t of tokens) {
        if (!t?.trades) continue;
        for (const tr of t.trades) {
          try { tr.token = tr.token || { id: t.id, symbol: t.symbol, name: t.name, metadataCID: t.metadataCID }; } catch (e) {}
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

interface TrackerProps {
  isBlurred: boolean;
  setpopup: (value: number) => void;
  onImportWallets?: (walletsText: string, addToSingleGroup: boolean) => void;
  onApplyFilters?: (filters: FilterState) => void;
  activeFilters?: FilterState;
  monUsdPrice: number;
  walletTokenBalances?: { [address: string]: any };
  tokenList?: any[];
  tokensByStatus?: Record<'new' | 'graduating' | 'graduated', any[]>;
  marketsData?: any;
  tradesByMarket?: any;
  sendUserOperationAsync?: any;
  account?: {
    connected: boolean;
    address: string | null;
    chainId: number;
  };
  terminalRefetch?: () => void;
  trades: any;
  trackedWalletsRef: any;
  trackedWalletTradesRef: any;
  trackedWalletTrades: any;
  setTrackedWalletTrades: any;
}

const Tracker: React.FC<TrackerProps> = ({
  isBlurred,
  setpopup,
  onApplyFilters: externalOnApplyFilters,
  activeFilters: externalActiveFilters,
  monUsdPrice,
  walletTokenBalances = {},
  tokenList = [],
  tokensByStatus = { new: [], graduating: [], graduated: [] },
  marketsData = {},
  tradesByMarket = {},
  sendUserOperationAsync,
  account,
  terminalRefetch,
  trades = [],
  trackedWalletsRef,
  trackedWalletTradesRef,
  trackedWalletTrades,
  setTrackedWalletTrades
}) => {
  const [selectedSimpleFilter, setSelectedSimpleFilter] = useState<string | null>(null);
  const context = useSharedContext();
  const activechain = context?.activechain || 'monad';
  const [walletSortField, setWalletSortField] = useState<'balance' | 'lastActive' | null>(null);
  const [walletSortDirection, setWalletSortDirection] = useState<SortDirection>('desc');
  const [showMonitorFiltersPopup, setShowMonitorFiltersPopup] = useState(false);
  const initialStoredWallets = (() => { try { const s = localStorage.getItem('tracked_wallets_data'); return s ? JSON.parse(s) : []; } catch { return []; } })();
  const initialUsedDemoWallets = initialStoredWallets.length === 0 && SHOW_DEMO_WALLETS;
  const [demoMode, setDemoMode] = useState({ wallets: initialUsedDemoWallets, trades: SHOW_DEMO_TRADES, monitor: SHOW_DEMO_MONITOR });
  const disableDemo = (k: 'wallets'|'trades'|'monitor') => setDemoMode(m => ({ ...m, [k]: false }));
  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>(() => {
    const stored = loadWalletsFromStorage();
    if (stored?.length) return stored.map(w => ({ ...w, createdAt: w.createdAt || new Date().toISOString(), lastActiveAt: (w as any).lastActiveAt ?? null }));
    return SHOW_DEMO_WALLETS ? (DEMO_WALLETS as any) : [];
  });


  const [addressPositions, setAddressPositions] = useState<Record<string, GqlPosition[]>>({});
  const [expandedTokenIds, setExpandedTokenIds] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [historicalTrades, setHistoricalTrades] = useState<Record<string, any[]>>({});
  const [isLoadingHistory, setIsLoadingHistory] = useState<Set<string>>(new Set());
  useEffect(() => { trackedWalletsRef.current = trackedWallets; }, [trackedWallets]);

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
  const tradeAccountAddr = (trade.account?.id || trade.caller || '').toLowerCase();
  const connectedAddr = account?.address?.toLowerCase();

  // Try to find in tracked wallets first, then check if it's the connected wallet
  const trackedWallet = wallets.find(
    w => w.address.toLowerCase() === tradeAccountAddr
  );

  const isConnectedWallet = connectedAddr && tradeAccountAddr === connectedAddr;

  // Use tracked wallet name if found, otherwise use "You" for connected wallet, otherwise use shortened address
  let walletName: string;
  let emoji: string;

  if (trackedWallet) {
    walletName = trackedWallet.name;
    emoji = trackedWallet.emoji || '👤';
  } else if (isConnectedWallet) {
    walletName = 'You';
    emoji = '👤';
  } else {
    walletName = `${tradeAccountAddr.slice(0, 6)}...${tradeAccountAddr.slice(-4)}`;
    emoji = '👻';
  }

  const isBuy = !!trade.isBuy;
  const nativeAmount = Number(isBuy ? trade.amountIn : trade.amountOut) / 1e18;
  const price = Number(trade.priceNativePerTokenWad) / 1e18;

  const TOTAL_SUPPLY = 1e9;
  const marketCap = price * TOTAL_SUPPLY;

  // FIX: Better timestamp handling - handles both seconds and milliseconds
  let timestamp = Number(trade.timestamp || trade.block || Date.now() / 1000);
  // If timestamp is in milliseconds (> year 2100 in seconds), convert to seconds
  if (timestamp > 5000000000) {
    timestamp = timestamp / 1000;
  }
  // If timestamp is 0 or very small, use current time
  if (timestamp < 1000000000) {
    timestamp = Date.now() / 1000;
  }
  
  const now = Date.now() / 1000;
  const secondsAgo = Math.max(0, now - timestamp);
  let timeAgo = 'now';
  if (secondsAgo < 60) timeAgo = `${Math.floor(secondsAgo)}s`;
  else if (secondsAgo < 3600) timeAgo = `${Math.floor(secondsAgo / 60)}m`;
  else if (secondsAgo < 86400) timeAgo = `${Math.floor(secondsAgo / 3600)}h`;
  else timeAgo = `${Math.floor(secondsAgo / 86400)}d`;

  // Get token symbol, name, address, and icon
  const tokenAddress = trade.token?.address || trade.tokenAddress || trade.token?.id || undefined;
  const tokenSymbol = trade.token?.symbol || trade.symbol || 'TKN';
  const tokenName = trade.token?.name || trade.token?.symbol || trade.name || tokenSymbol;
  
  // FIX: Enhanced token icon resolution - check multiple sources
  let tokenIcon = trade.tokenIcon || trade.token?.imageUrl || undefined;
  
  // If no icon but we have a token address, try to get it from marketsRef
  if (!tokenIcon && tokenAddress) {
    const market = marketsRef.current.get(tokenAddress.toLowerCase());
    if (market) {
      // Check multiple possible icon fields
      tokenIcon = market.imageUrl || (market as any).image;
    }
  }
  
  // If still no icon and we have metadataCID, construct the URL
  if (!tokenIcon && trade.token?.metadataCID) {
    tokenIcon = `https://pub-8aff0f9ec88b4fff8cdce3f213f21b7f.r2.dev/img/${trade.token.metadataCID}.png`;
  }

  return {
    id: trade.id,
    walletName: walletName,
    emoji: emoji,
    token: tokenSymbol,
    tokenName: tokenName,
    tokenAddress: tokenAddress,
    tokenIcon: tokenIcon,
    amount: nativeAmount,
    price: price,
    marketCap: marketCap / DISPLAY_SCALE,
    time: timeAgo,
    txHash: trade.transaction?.id || trade.id,
    type: isBuy ? 'buy' : 'sell',
    createdAt: new Date(timestamp * 1000).toISOString(),
  };
}, [account?.address]);

  // Quick buy function - buys 1 MON worth of token instantly
  const handleQuickBuy = useCallback(async (tokenAddress: string, tokenSymbol: string, tokenImage?: string) => {
    const amt = '1'; // Always buy 1 MON worth
    const val = BigInt(amt || '0') * 10n ** 18n;
    if (val === 0n) return;

    const routerAddress = settings.chainConfig[activechain]?.launchpadRouter?.toLowerCase();
    if (!routerAddress) {
      console.error('Router address not found');
      return;
    }

    const txId = `quickbuy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      if (showLoadingPopup) {
        showLoadingPopup(txId, {
          title: 'Sending transaction...',
          subtitle: `${amt} MON worth of ${tokenSymbol}`,
          amount: amt,
          amountUnit: 'MON',
          tokenImage: tokenImage
        });
      }

      const uo = {
        target: routerAddress,
        data: encodeFunctionData({
          abi: CrystalRouterAbi,
          functionName: 'buy',
          args: [true, tokenAddress as `0x${string}`, val, 0n]
        }),
        value: val,
      };

      if (updatePopup) {
        updatePopup(txId, {
          title: 'Confirming transaction...',
          subtitle: `${amt} MON worth of ${tokenSymbol}`,
          variant: 'info',
          tokenImage: tokenImage
        });
      }

      await sendUserOperationAsync({ uo });

      if (terminalRefetch) {
        terminalRefetch();
      }

      if (updatePopup) {
        updatePopup(txId, {
          title: 'Quick Buy Complete',
          subtitle: `Successfully bought ${tokenSymbol} with ${amt} MON`,
          variant: 'success',
          confirmed: true,
          isLoading: false,
          tokenImage: tokenImage
        });
      }
    } catch (e: any) {
      console.error('Quick buy failed', e);
      const msg = String(e?.message ?? '');
      if (updatePopup) {
        updatePopup(txId, {
          title: msg.toLowerCase().includes('insufficient') ? 'Insufficient Balance' : 'Quick Buy Failed',
          subtitle: msg || 'Please try again.',
          variant: 'error',
          confirmed: true,
          isLoading: false,
          tokenImage: tokenImage
        });
      }
    }
  }, [sendUserOperationAsync, activechain, terminalRefetch]);

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

  // Copied from TokenExplorer for consistent formatting
  const formatPrice = (p: number, noDecimals = false, isUSD = true) => {
    const prefix = isUSD ? '$' : '';
    const suffix = isUSD ? '' : ' MON';

    if (p >= 1e12)
      return `${prefix}${noDecimals ? Math.round(p / 1e12) : (p / 1e12).toFixed(1)}T${suffix}`;
    if (p >= 1e9)
      return `${prefix}${noDecimals ? Math.round(p / 1e9) : (p / 1e9).toFixed(1)}B${suffix}`;
    if (p >= 1e6)
      return `${prefix}${noDecimals ? Math.round(p / 1e6) : (p / 1e6).toFixed(1)}M${suffix}`;
    if (p >= 1e3)
      return `${prefix}${noDecimals ? Math.round(p / 1e3) : (p / 1e3).toFixed(1)}K${suffix}`;
    return `${prefix}${noDecimals ? Math.round(p) : p.toFixed(2)}${suffix}`;
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
  const [hiddenTokens, setHiddenTokens] = useState<Set<string>>(new Set());
  const [blacklistedDevs, setBlacklistedDevs] = useState<Set<string>>(new Set());
  const [hoveredMonitorToken, setHoveredMonitorToken] = useState<string | null>(null);
  const [bondingPopupPosition, setBondingPopupPosition] = useState({ top: 0, left: 0 });
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
  lastEventTsRef.current = Date.now();
  setStatus({ lastPushSource: source });

  const lower = (s?: string) => (s || '').toLowerCase();
  const wallets = trackedWalletsRef.current;
  const touchWallet = (addr: string) => {
    const key = lower(addr);
    if (!trackedSetRef.current.has(key)) return;
    setTrackedWallets(prev => prev.map(x => lower(x.address) === key ? { ...x, lastActiveAt: Date.now() } : x));
  };

  const toAdd: LiveTrade[] = [];

  for (const l of logs) {
    const args: any = l?.args ?? {};
    const txHash: string = l?.transactionHash ?? l?.transaction?.id ?? l?.id ?? '';

    let accountAddr: string | null = (args.user || args.account || args.trader || args.sender || args.owner || args.from || args.buyer || args.seller) ?? null;

    if (accountAddr) {
      touchWallet(accountAddr);
    } else {
      continue;
    }

    const lowerAccountAddr = lower(accountAddr);
    const connectedAddr = account?.address?.toLowerCase();
    const isTrackedWallet = trackedSetRef.current.has(lowerAccountAddr);
    const isConnectedWallet = connectedAddr && lowerAccountAddr === connectedAddr;

    // Allow trades from either tracked wallets OR the connected wallet
    if (!isTrackedWallet && !isConnectedWallet) {
      continue;
    }

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
    
    // FIX: Extract timestamp properly - handle both seconds and milliseconds
    let ts = Number(l.timestamp || l.block || args.timestamp || Date.now() / 1000);
    if (ts > 5000000000) {
      ts = ts / 1000;
    }

    // prefer live price when available
    // resolve market id - try token address first since that's most reliable
    const addrLower = tokenAddr ? tokenAddr.toLowerCase() : undefined;
    const symbolLower = (symbol || '').toLowerCase();

    // Try to find the token in marketsRef using address directly first
    const live = addrLower ? marketsRef.current.get(addrLower) : null;

    // Use live price if available, convert to BigInt
    const livePriceWad = live?.price != null && live.price > 0
      ? BigInt(Math.floor(live.price * 1e18))
      : priceWad;

    // FIX: Extract imageUrl from multiple sources
    let imageUrl = args.imageUrl || args.tokenIcon || l.token?.imageUrl || live?.imageUrl;
    
    // If we have metadataCID, construct the URL
    if (!imageUrl && (args.metadataCID || l.token?.metadataCID)) {
      const cid = args.metadataCID || l.token?.metadataCID;
      imageUrl = `https://pub-8aff0f9ec88b4fff8cdce3f213f21b7f.r2.dev/img/${cid}.png`;
    }

    const tradeLike = {
      id: txHash || `${Date.now()}_${Math.random()}`,
      account: { id: String(accountAddr || '') },
      caller: String(accountAddr || ''),
      isBuy,
      amountIn: amountInWei,
      amountOut: amountOutWei,
      priceNativePerTokenWad: livePriceWad,
      token: {
        address: tokenAddr,
        symbol: (live?.symbol ?? symbol ?? 'TKN'),
        name: (live?.name ?? live?.symbol ?? symbol ?? 'Unknown'),
        imageUrl: imageUrl // Add imageUrl to token object
      },
      tokenIcon: imageUrl, // Also add at top level
      timestamp: ts
    };

    const normalized = normalizeTrade(tradeLike, wallets);

    toAdd.push(normalized);

    upsertMarket({ 
      tokenAddr, 
      symbol, 
      price: priceEth, 
      isBuy, 
      amountNative: isBuy ? amountInEth : amountOutEth, 
      ts, 
      wallet: wallets.find((w: any)=>lower(w.address)===lower(accountAddr||''))?.name, 
      emoji: wallets.find((w: any)=>lower(w.address)===lower(accountAddr||''))?.emoji,
      imageUrl: imageUrl // Pass imageUrl to upsertMarket
    });
  }

  if (toAdd.length === 0) {
    return;
  }

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
    // Dispatch custom event for same-window sync with WalletTrackerWidget
    window.dispatchEvent(new CustomEvent('wallets-updated', { detail: { wallets: trackedWallets, source: 'tracker' } }));
    setStatus();
  }, [trackedWallets]);

  // Listen for wallet changes from WalletTrackerWidget
  useEffect(() => {
    const handleCustomWalletUpdate = (e: CustomEvent) => {
      if (e.detail && e.detail.source !== 'tracker') {
        const updatedWallets = e.detail.wallets;
        // Only update if the wallets are actually different to avoid infinite loops
        if (JSON.stringify(updatedWallets) !== JSON.stringify(trackedWallets)) {
          setTrackedWallets(updatedWallets);
        }
      }
    };

    window.addEventListener('wallets-updated', handleCustomWalletUpdate as EventListener);

    return () => {
      window.removeEventListener('wallets-updated', handleCustomWalletUpdate as EventListener);
    };
  }, [trackedWallets]);

  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  useEffect(() => {
    let stop = false;
    const run = async () => {
      const addrs = trackedWalletsRef.current.map((w: any) => w.address);
      if (!addrs.length) return;
      const results = await Promise.all(addrs.map((a: any) => fetchPortfolio(a).catch(() => null)));
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
        const addrs = trackedWalletsRef.current.map((w: any) => w.address);
        if (!addrs.length) return;

        // If we already have addressPositions data, the other effect will populate Monitor.
        if (Object.keys(addressPositions).length > 0) return;

        const posResults = await Promise.all(addrs.map((a: any) => fetchPortfolio(a).catch(() => null)));
        if (cancelled) return;

        const tokensMap = new Map<string, MonitorToken>();

        posResults.forEach((w, i) => {
          if (!w || !w.positions) return;
          const walletAddr = addrs[i];
          const wallet = trackedWalletsRef.current.find((x: any) => x.address.toLowerCase() === walletAddr.toLowerCase());
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

  // Populate marketsRef with volume and transaction data from tokensByStatus (TokenExplorer's data source)
  useEffect(() => {
    // Flatten all tokens from TokenExplorer's state
    const allTokens = [
      ...(tokensByStatus.new || []),
      ...(tokensByStatus.graduating || []),
      ...(tokensByStatus.graduated || [])
    ];

    allTokens.forEach((token: any) => {
      if (!token) return;
      const tokenAddr = (token.tokenAddress || token.id)?.toLowerCase();
      if (!tokenAddr) return;

      const existing = marketsRef.current.get(tokenAddr);
      marketsRef.current.set(tokenAddr, {
        ...(existing || {}),
        id: tokenAddr,
        tokenAddress: tokenAddr,
        name: token.name || existing?.name || '',
        symbol: token.symbol || existing?.symbol || '',
        emoji: token.emoji || existing?.emoji || '🪙',
        price: token.price ?? existing?.price ?? 0,
        marketCap: token.marketCap ?? existing?.marketCap ?? 0,
        change24h: token.change24h ?? existing?.change24h ?? 0,
        volume24h: token.volume24h ?? existing?.volume24h ?? 0,
        liquidity: token.liquidity ?? existing?.liquidity ?? 0,
        holders: token.holders ?? existing?.holders ?? 0,
        buyTransactions: token.buyTransactions ?? existing?.buyTransactions ?? 0,
        sellTransactions: token.sellTransactions ?? existing?.sellTransactions ?? 0,
        bondingCurveProgress: token.bondingCurveProgress ?? existing?.bondingCurveProgress ?? 0,
        txCount: (token.buyTransactions ?? 0) + (token.sellTransactions ?? 0),
        volume5m: token.volume5m ?? existing?.volume5m ?? 0,
        volume1h: token.volume1h ?? existing?.volume1h ?? 0,
        volume6h: token.volume6h ?? existing?.volume6h ?? 0
      } as any);
    });

    flushMarketsToState();
  }, [tokensByStatus]);

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

  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<string>('');
  const [dontShowDeleteAgain, setDontShowDeleteAgain] = useState(false);
  const [showImportPopup, setShowImportPopup] = useState(false);

  const mainWalletsRef = useRef<HTMLDivElement>(null);


  function getRpcPublicClient(chainCfg?: any) {
    if (!chainCfg?.rpcUrl) return null;
    return createPublicClient({
      transport: http(chainCfg.rpcUrl),
    });
  }

  const formatCompact = (n: number, d = 2) => {
    if (!n || isNaN(n)) return '0';
    const a = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (a >= 1e6) return `${sign}${(a / 1e6).toFixed(d)}M`;
    if (a >= 1e3) return `${sign}${(a / 1e3).toFixed(d)}K`;
    if (a < 0.01 && a > 0) return `${sign}${a.toExponential(2)}`;
    return `${sign}${a.toFixed(d)}`;
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

  // Fetch historical trades for a wallet
  const fetchHistoricalTradesForWallet = useCallback(async (wallet: TrackedWallet) => {
    const walletAddr = wallet.address.toLowerCase();

    // Check if already loading or loaded using functional state update
    let shouldSkip = false;
    setIsLoadingHistory(prev => {
      if (prev.has(walletAddr)) {
        shouldSkip = true;
        return prev;
      }
      return new Set(prev).add(walletAddr);
    });

    setHistoricalTrades(prev => {
      if (prev[walletAddr]) {
        shouldSkip = true;
      }
      return prev;
    });

    if (shouldSkip) {
      return;
    }

    try {
      const trades = await fetchRecentTradesForWallet(walletAddr, 100);

      // Convert trades to the same format as trackedWalletTrades
      const normalizedTrades = trades.map((trade: any) => {
        const isBuy = !!trade.isBuy;
        const nativeAmount = Number(isBuy ? trade.amountIn : trade.amountOut) / 1e18;
        const price = Number(trade.priceNativePerTokenWad) / 1e18;
        const TOTAL_SUPPLY = 1e9;
        const marketCap = price * TOTAL_SUPPLY;

        // Handle timestamp
        let timestamp = Number(trade.block || Date.now() / 1000);
        if (timestamp > 5000000000) timestamp = timestamp / 1000;
        if (timestamp < 1000000000) timestamp = Date.now() / 1000;

        const now = Date.now() / 1000;
        const secondsAgo = Math.max(0, now - timestamp);
        let timeAgo = 'now';
        if (secondsAgo < 60) timeAgo = `${Math.floor(secondsAgo)}s`;
        else if (secondsAgo < 3600) timeAgo = `${Math.floor(secondsAgo / 60)}m`;
        else if (secondsAgo < 86400) timeAgo = `${Math.floor(secondsAgo / 3600)}h`;
        else timeAgo = `${Math.floor(secondsAgo / 86400)}d`;

        const tokenAddress = trade.token?.id;
        const tokenSymbol = trade.token?.symbol || 'TKN';
        const tokenName = trade.token?.name || tokenSymbol;
        const metadataCID = trade.token?.metadataCID;

        // metadataCID is actually the full URL, not just the CID
        let tokenIcon = metadataCID || undefined;

        return {
          id: trade.id,
          walletName: wallet.name,
          walletEmoji: wallet.emoji || '👤',
          walletAddress: walletAddr,
          token: tokenSymbol,
          tokenName: tokenName,
          tokenAddress: tokenAddress,
          tokenIcon: tokenIcon,
          type: isBuy ? 'buy' : 'sell',
          amount: nativeAmount,
          price: price,
          marketCap: marketCap,
          time: timeAgo,
          timeAgo: timeAgo,
          timestamp: timestamp,
          txHash: trade.id,
          createdAt: new Date(timestamp * 1000).toISOString(),
          isHistorical: true
        };
      });

      setHistoricalTrades(prev => ({
        ...prev,
        [walletAddr]: normalizedTrades
      }));
    } catch (error) {
      console.error(`Failed to fetch historical trades for ${wallet.name}:`, error);
    } finally {
      setIsLoadingHistory(prev => {
        const next = new Set(prev);
        next.delete(walletAddr);
        return next;
      });
    }
  }, []);

  // Fetch historical trades for all tracked wallets on mount and when wallets change
  useEffect(() => {
    if (trackedWallets.length > 0) {
      trackedWallets.forEach(wallet => {
        fetchHistoricalTradesForWallet(wallet);
      });
    }
  }, [trackedWallets, fetchHistoricalTradesForWallet]);

  const getFilteredTrades = () => {
    // Merge live trades with historical trades
    const allHistoricalTrades = Object.values(historicalTrades).flat();
    const allTrades = [...trackedWalletTrades, ...allHistoricalTrades];

    // Remove duplicates based on txHash
    const uniqueTrades = Array.from(
      new Map(allTrades.map(trade => [trade.txHash || trade.id, trade])).values()
    );

    let trades = uniqueTrades.filter((trade: any) => {

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
      trades = trades.filter((trade: any) =>
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
      // Skip positions from wallets that are no longer tracked
      const wallet = trackedWallets.find(w => w.address.toLowerCase() === walletAddr.toLowerCase());
      if (!wallet) return;

      positions.forEach(pos => {
        // Only include positions with remaining tokens
        if (pos.remainingTokens && pos.remainingTokens > 0) {
          // Add wallet info to position for display
          (pos as any).walletName = wallet.name;
          (pos as any).walletEmoji = wallet.emoji || '👤';
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

  const handleAddWallet = async (wallet: TrackedWallet) => {
    setTrackedWallets(prev => demoMode.wallets ? [wallet] : [...prev, wallet]);
    if (demoMode.wallets) disableDemo('wallets');
    try {
      fetchRecentTradesForWallet(wallet.address, 50).then(items => {
        if (items && items.length) ingestExternalTrades(items);
      }).catch(() => {});
    } catch (e) {}
    // also fetch portfolio positions immediately so Monitor reflects the new wallet
    try {
      (async () => {
        try {
          const p = await fetchPortfolio(wallet.address).catch(() => null);
          if (p && p.positions && p.positions.length) {
            setAddressPositions(prev => ({ ...prev, [wallet.address]: p.positions }));
          }
        } catch (e) {}
      })();
    } catch (e) {}
    setShowAddWalletModal(false);
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
        const portfolio = await fetchPortfolio(wallet.address);

        if (portfolio?.positions && portfolio.positions.length > 0) {
          allPositions.push(...portfolio.positions);
          successCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`[Tracker] Failed to fetch portfolio for wallet ${wallet.name} (${wallet.address}):`, error);
      }
    }

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
      const walletToRemove = trackedWallets.find(w => w.id === id);
      setTrackedWallets(prev => prev.filter(w => w.id !== id));

      // Clean up data for deleted wallet
      if (walletToRemove) {
        const addressToRemove = walletToRemove.address.toLowerCase();

        // Remove positions for this wallet
        setAddressPositions(prev => {
          const newPositions = { ...prev };
          delete newPositions[addressToRemove];
          return newPositions;
        });

        // Remove trades for this wallet
        setTrackedWalletTrades((prev: any[]) =>
          prev.filter((trade: any) => trade.walletAddress?.toLowerCase() !== addressToRemove)
        );

        // Remove historical trades for this wallet
        setHistoricalTrades(prev => {
          const newHistoricalTrades = { ...prev };
          delete newHistoricalTrades[addressToRemove];
          return newHistoricalTrades;
        });
      }
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

    const walletToRemove = trackedWallets.find(w => w.id === walletToDelete);
    setTrackedWallets(prev => prev.filter(w => w.id !== walletToDelete));

    // Clean up data for deleted wallet
    if (walletToRemove) {
      const addressToRemove = walletToRemove.address.toLowerCase();

      // Remove positions for this wallet
      setAddressPositions(prev => {
        const newPositions = { ...prev };
        delete newPositions[addressToRemove];
        return newPositions;
      });

      // Remove trades for this wallet
      setTrackedWalletTrades((prev: any[]) =>
        prev.filter((trade: any) => trade.walletAddress?.toLowerCase() !== addressToRemove)
      );

      // Remove historical trades for this wallet
      setHistoricalTrades(prev => {
        const newHistoricalTrades = { ...prev };
        delete newHistoricalTrades[addressToRemove];
        return newHistoricalTrades;
      });
    }

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

  const handleHideToken = (tokenId: string) => {
    setHiddenTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        newSet.add(tokenId);
      }
      return newSet;
    });
  };

  const handleBlacklistDev = (tokenId: string, devAddress?: string) => {
    if (!devAddress) return;

    setBlacklistedDevs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(devAddress)) {
        newSet.delete(devAddress);
      } else {
        newSet.add(devAddress);
      }
      return newSet;
    });

    // Also hide the token when blacklisting
    handleHideToken(tokenId);
  };

  const getBondingColor = (b: number) => {
    if (b < 25) return '#ee5b5bff';
    if (b < 50) return '#f59e0b';
    if (b < 75) return '#eab308';
    return '#43e17dff';
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

  const ingestExternalTrades = (items: any[]) => {
    const wallets = trackedWalletsRef.current;
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
    lastEventTsRef.current = Date.now();
    setStatus({ lastPushSource: 'external' });
  };

  const upsertMarket = (t: { tokenAddr?: string; symbol?: string; name?: string; price?: number; isBuy?: boolean; amountNative?: number; ts?: number; wallet?: string; emoji?: string; imageUrl?: string;}) => {
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
      trades: trades
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
          if (msg.id === reqId && msg.result) {
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
      }
      if (symbol) {
        symbolToMarketRef.current[symbol] = marketId;
      }
      upsertMarket({ tokenAddr: tokenAddr, symbol: symbol.toUpperCase(), name, price: 0 });
      try {
        if (wsRef.current && !marketSubsRef.current[marketId]) {
          const reqId = subIdRef.current++;
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
        }
        if (m.symbol) {
          symbolToMarketRef.current[m.symbol.toLowerCase()] = id;
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

  useEffect(() => {
    const TRADE_EVENT = '0x9adcf0ad0cda63c4d50f26a48925cf6405df27d422a39c456b5f03f661c82982';
    const MARKET_CREATED_EVENT = '0x24ad3570873d98f204dae563a92a783a01f6935a8965547ce8bf2cadd2c6ce3b';
    const MARKET_UPDATE_EVENT = '0xc367a2f5396f96d105baaaa90fe29b1bb18ef54c712964410d02451e67c19d3e';

    const handler = (ev: Event) => {
      console.log(ev)
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
        <div className="tracker-detail-trades-table">
          <div className="detail-trades-table-header">
            <div className="detail-trades-header-cell detail-trades-time">Time</div>
            <div className="detail-trades-header-cell detail-trades-account">Account</div>
            <div className="detail-trades-header-cell">Token</div>
            <div
              className={`detail-trades-header-cell sortable ${tradeSortField === 'amount' ? 'active' : ''}`}
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

          <div className="tracker-detail-trades-body">
            {filteredTrades.length === 0 ? (
              <div className="tracker-empty-state">
                <div className="tracker-empty-content">
                  <h4>No Trades Found</h4>
                  <p>No trades match your search criteria.</p>
                </div>
              </div>
            ) : (
              filteredTrades.map((trade: any) => (

                <div
                  key={trade.id}
                  className={`tracker-detail-trades-row ${trade.type === 'buy' ? 'buy' : 'sell'}`}
                >
                  <div className="detail-trades-col detail-trades-time">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>{trade.time}</span>
                    </div>
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


                  {/* Token column styled like AssetRow */}
                  <div className="detail-trades-col">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {trade.tokenIcon && (
                        <img src={trade.tokenIcon} className="asset-icon" alt={trade.tokenName || trade.token} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', background: '#222' }} />
                      )}
                      <div className="asset-details">
                        <div className="asset-ticker">{trade.tokenName || trade.token}</div>
                        {trade.tokenAddress && (
                          <a
                            href={`https://testnet.monadex.xyz/token/${trade.tokenAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#b3b8f9', textDecoration: 'none', fontSize: '0.8em' }}
                            onClick={e => e.stopPropagation()}
                          >
                            {trade.tokenAddress.slice(0, 6)}...{trade.tokenAddress.slice(-4)}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="detail-trades-col">
                    <span
                      className={[
                        'detail-trades-amount',
                        trade.type === 'buy' ? 'amount-buy' : 'amount-sell',
                        isBlurred ? 'blurred' : ''
                      ].join(' ')}
                    >
                      {trade.amount === 0 || isNaN(trade.amount)
                        ? (monitorCurrency === 'USD' ? '$0' : '0 MON')
                        : (() => {
                            const value = monitorCurrency === 'USD' ? (monUsdPrice ? trade.amount * monUsdPrice : trade.amount) : trade.amount;
                            const prefix = monitorCurrency === 'USD' ? '$' : '';
                            const suffix = monitorCurrency === 'MON' ? ' MON' : '';
                            if (Math.abs(value) < 1e-8 && value !== 0) return prefix + value.toFixed(12).replace(/0+$/, '').replace(/\.$/, '') + suffix;
                            return prefix + value.toLocaleString(undefined, { maximumFractionDigits: 8 }) + suffix;
                          })()}
                    </span>
                  </div>

                  <div className="detail-trades-col" style={{minWidth: '120px', width: '120px'}}>
                    <span className={isBlurred ? 'blurred' : ''}>
                      {trade.marketCap === 0 || isNaN(trade.marketCap)
                        ? (monitorCurrency === 'USD' ? '$0' : '0 MON')
                        : (() => {
                            const marketCapInBillions = trade.marketCap * 1e9;
                            const value = monitorCurrency === 'USD' ? (monUsdPrice ? marketCapInBillions * monUsdPrice : marketCapInBillions) : marketCapInBillions;
                            const prefix = monitorCurrency === 'USD' ? '$' : '';
                            const suffix = monitorCurrency === 'MON' ? ' MON' : '';
                            if (Math.abs(value) < 1e-8 && value !== 0) return prefix + value.toFixed(12).replace(/0+$/, '').replace(/\.$/, '') + suffix;
                            return prefix + value.toLocaleString(undefined, { maximumFractionDigits: 8 }) + suffix;
                          })()}
                    </span>
                  </div>

                  {trade.tokenAddress && (
                    <div className="detail-trades-col detail-trades-quickbuy-col">
                      <button
                        className="tracker-livetrades-quickbuy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickBuy(trade.tokenAddress, trade.token, trade.tokenIcon);
                        }}
                      >
                        <svg
                          className="tracker-livetrades-quickbuy-icon"
                          viewBox="0 0 72 72"
                          fill="currentColor"
                        >
                          <path d="M30.992,60.145c-0.599,0.753-1.25,1.126-1.952,1.117c-0.702-0.009-1.245-0.295-1.631-0.86 c-0.385-0.565-0.415-1.318-0.09-2.26l5.752-16.435H20.977c-0.565,0-1.036-0.175-1.412-0.526C19.188,40.83,19,40.38,19,39.833 c0-0.565,0.223-1.121,0.668-1.669l21.34-26.296c0.616-0.753,1.271-1.13,1.965-1.13s1.233,0.287,1.618,0.86 c0.385,0.574,0.415,1.331,0.09,2.273l-5.752,16.435h12.095c0.565,0,1.036,0.175,1.412,0.526C52.812,31.183,53,31.632,53,32.18 c0,0.565-0.223,1.121-0.668,1.669L30.992,60.145z" />
                        </svg>
                        1 MON
                      </button>
                    </div>
                  )}
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

    // Launchpad column: Only memecoin positions (exclude major tokens from tokenList, graduated tokens, and migrated/orderbook tokens)
    // These come from GraphQL launchpadPositions query
    // Filter out graduated tokens (bondingCurveProgress === 100) and orderbook tokens (isOrderbook === true)
    let launchpadPositions = allPositions.filter(pos => {
      // Exclude orderbook tokens (migrated tokens from GraphQL)
      if (pos.isOrderbook) return false;

      const market = marketsRef.current.get(pos.tokenId.toLowerCase());
      return !market || market.bondingCurveProgress < 100;
    });

    // Get graduated tokens for orderbook column (bondingCurveProgress === 100 but not already marked as orderbook from migration)
    const graduatedPositions = allPositions.filter(pos => {
      if (pos.isOrderbook) return false; // These are already in orderbook via migration
      const market = marketsRef.current.get(pos.tokenId.toLowerCase());
      return market && market.bondingCurveProgress === 100;
    });

    // Get migrated orderbook positions from GraphQL (these have isOrderbook: true)
    const migratedOrderbookPositions = allPositions.filter(pos => pos.isOrderbook === true);

    // Orderbook column: only major tokens from tokenList
    const spotTokenPositions: GqlPosition[] = [];
    const chainCfg = settings.chainConfig?.[activechain];

    if (walletTokenBalances && tokenList && tokenList.length > 0) {
      trackedWallets.forEach(wallet => {
        const walletBalances = walletTokenBalances[wallet.address] || walletTokenBalances[wallet.address.toLowerCase()];
        if (!walletBalances) return;

        // Only iterate through tokens in tokenList (major tokens)
        tokenList.forEach((token: any) => {
          const tokenAddr = token.address?.toLowerCase();
          if (!tokenAddr) return;

          // Try to find balance with both lowercase and original case
          let balanceWei = walletBalances[tokenAddr];
          if (!balanceWei) {
            // Try finding by checking all keys case-insensitively
            const matchingKey = Object.keys(walletBalances).find(k => k.toLowerCase() === tokenAddr);
            if (matchingKey) {
              balanceWei = walletBalances[matchingKey];
            }
          }
          if (!balanceWei || balanceWei === 0n) return;

          const decimals = token.decimals || 18;
          const balance = Number(balanceWei) / (10 ** Number(decimals));

          if (balance <= 0) return;

          const market = marketsRef.current.get(tokenAddr);
          const price = market?.price || 0;

          const position: GqlPosition = {
            tokenId: tokenAddr,
            symbol: token.ticker,
            name: token.name,
            imageUrl: token.image,
            boughtTokens: balance,
            soldTokens: 0,
            spentNative: 0,
            receivedNative: 0,
            remainingTokens: balance,
            remainingPct: 100,
            pnlNative: 0,
            lastPrice: price,
            isOrderbook: true,
          };

          (position as any).walletName = wallet.name;
          (position as any).walletEmoji = wallet.emoji;
          (position as any).walletAddress = wallet.address;

          spotTokenPositions.push(position);
        });
      });
    }

    // Aggregate orderbook positions by token (combine all wallets)
    const aggregatedOrderbookPositions: GqlPosition[] = [];
    const tokenMap = new Map<string, { position: GqlPosition, wallets: any[] }>();

    spotTokenPositions.forEach(pos => {
      const tokenId = pos.tokenId.toLowerCase();
      if (!tokenMap.has(tokenId)) {
        tokenMap.set(tokenId, {
          position: {
            tokenId: pos.tokenId,
            symbol: pos.symbol,
            name: pos.name,
            imageUrl: pos.imageUrl,
            boughtTokens: 0,
            soldTokens: 0,
            spentNative: 0,
            receivedNative: 0,
            remainingTokens: 0,
            remainingPct: 0,
            pnlNative: 0,
            lastPrice: pos.lastPrice,
            isOrderbook: true
          },
          wallets: []
        });
      }

      const entry = tokenMap.get(tokenId)!;
      entry.position.boughtTokens += pos.boughtTokens;
      entry.position.soldTokens += pos.soldTokens;
      entry.position.spentNative += pos.spentNative;
      entry.position.receivedNative += pos.receivedNative;
      entry.position.remainingTokens += pos.remainingTokens;
      entry.position.pnlNative += pos.pnlNative;

      entry.wallets.push({
        name: (pos as any).walletName,
        emoji: (pos as any).walletEmoji,
        address: (pos as any).walletAddress,
        balance: pos.remainingTokens,
        pnl: pos.pnlNative,
        spent: pos.spentNative,
        received: pos.receivedNative
      });
    });

    tokenMap.forEach((entry, tokenId) => {
      (entry.position as any).wallets = entry.wallets;
      aggregatedOrderbookPositions.push(entry.position);
    });

    // Combine spot tokens, graduated tokens, and migrated orderbook tokens for orderbook column
    const orderbookPositions = [...aggregatedOrderbookPositions, ...graduatedPositions, ...migratedOrderbookPositions];

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

      // Get market data - check both marketsRef (for meme tokens) and marketsData (for OrderBook tokens)
      let market = marketsRef.current.get(pos.tokenId.toLowerCase());

      // If not found in marketsRef, check marketsData (for OrderBook tokens)
      if (!market && marketsData) {
        let orderBookMarket = null;

        // marketsData is an array - find by address or baseAddress matching the token
        if (Array.isArray(marketsData)) {
          // Try to find by baseAddress (token address) or by address (market address)
          orderBookMarket = marketsData.find((m: any) =>
            m.baseAddress?.toLowerCase() === pos.tokenId.toLowerCase() ||
            m.address?.toLowerCase() === pos.tokenId.toLowerCase()
          );

          // If not found by address, try matching by market symbol
          if (!orderBookMarket && pos.symbol) {
            orderBookMarket = marketsData.find((m: any) =>
              m.marketSymbol === `${pos.symbol}USDC` ||
              m.marketSymbol === `${pos.symbol}MON` ||
              m.marketSymbol === `${pos.symbol}ETH` ||
              m.symbol === pos.symbol
            );
          }
        } else {
          // marketsData is an object - try different keys
          orderBookMarket = marketsData[pos.tokenId.toLowerCase()];

          if (!orderBookMarket && pos.symbol) {
            const possibleKeys = [
              `${pos.symbol}USDC`,
              `${pos.symbol}MON`,
              `${pos.symbol}ETH`,
              pos.symbol
            ];
            for (const key of possibleKeys) {
              if (marketsData[key]) {
                orderBookMarket = marketsData[key];
                break;
              }
            }
          }
        }

        if (orderBookMarket) {
          // Parse volume from string if needed (marketsData has volume as formatted string)
          let volume24h = 0;
          if (typeof orderBookMarket.volume === 'string') {
            volume24h = parseFloat(orderBookMarket.volume.replace(/,/g, '')) || 0;
          } else if (typeof orderBookMarket.volume24h === 'number') {
            volume24h = orderBookMarket.volume24h;
          }

          // Get transactions from tradesByMarket if available
          let buyTxs = 0;
          let sellTxs = 0;

          const marketSymbol = orderBookMarket.marketSymbol || `${pos.symbol}USDC`;
          if (tradesByMarket && tradesByMarket[marketSymbol]) {
            const trades = tradesByMarket[marketSymbol] || [];
            const now = Date.now() / 1000;
            const oneDayAgo = now - 86400;

            trades.forEach((trade: any) => {
              const timestamp = Number(trade.timestamp || 0);
              if (timestamp >= oneDayAgo) {
                if (trade.isBuy) buyTxs++;
                else sellTxs++;
              }
            });
          }

          // Convert marketsData format to expected market format
          market = {
            id: pos.tokenId,
            tokenAddress: pos.tokenId,
            symbol: orderBookMarket.symbol || orderBookMarket.baseAsset || pos.symbol,
            name: orderBookMarket.name || pos.name,
            emoji: orderBookMarket.emoji || '📈',
            price: orderBookMarket.currentPrice || orderBookMarket.price || pos.lastPrice,
            marketCap: (orderBookMarket.currentPrice || orderBookMarket.price || pos.lastPrice) * 1e9,
            change24h: parseFloat(orderBookMarket.priceChange || orderBookMarket.change24h || '0'),
            volume24h: volume24h,
            liquidity: orderBookMarket.liquidity || 0,
            holders: orderBookMarket.holders || 0,
            buyTransactions: buyTxs,
            sellTransactions: sellTxs,
            bondingCurveProgress: 100,
            txCount: buyTxs + sellTxs,
            volume5m: orderBookMarket.volume5m || 0,
            volume1h: orderBookMarket.volume1h || 0,
            volume6h: orderBookMarket.volume6h || 0,
            priceChange5m: orderBookMarket.priceChange5m || 0,
            priceChange1h: orderBookMarket.priceChange1h || 0,
            priceChange6h: orderBookMarket.priceChange6h || 0,
            priceChange24h: parseFloat(orderBookMarket.priceChange || orderBookMarket.change24h || '0'),
            website: orderBookMarket.website || '',
            twitter: orderBookMarket.twitter || '',
            telegram: orderBookMarket.telegram || '',
            createdAt: orderBookMarket.createdAt || '',
            lastTransaction: orderBookMarket.lastTransaction || '',
            trades: [],
          };
        }
      }

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

      const isExpanded = expandedTokenIds.has(pos.tokenId);
      const walletAddress = (pos as any).walletAddress;
      const positionWallets = (pos as any).wallets || []; // For aggregated positions

      // Get trades for this token
      // Merge live trades with historical trades
      let allTrades = [...trackedWalletTrades];

      // Add historical trades from all relevant wallets
      if (positionWallets.length > 0) {
        // Aggregated position - get historical trades from all wallets
        positionWallets.forEach((wallet: any) => {
          if (wallet.address) {
            const walletAddrLower = wallet.address.toLowerCase();
            if (historicalTrades[walletAddrLower]) {
              allTrades.push(...historicalTrades[walletAddrLower]);
            }
          }
        });
      } else if (walletAddress) {
        // Single wallet position
        const walletAddrLower = walletAddress.toLowerCase();
        if (historicalTrades[walletAddrLower]) {
          allTrades.push(...historicalTrades[walletAddrLower]);
        }
      }

      // Remove duplicates by txHash/id
      const uniqueTradesMap = new Map();
      allTrades.forEach((trade: any) => {
        const key = trade.txHash || trade.id;
        if (key && !uniqueTradesMap.has(key)) {
          uniqueTradesMap.set(key, trade);
        }
      });

      // Filter by token symbol to show only trades for this specific token
      let tokenTrades = Array.from(uniqueTradesMap.values()).filter((trade: any) =>
        trade.token === pos.symbol
      );

      // For OrderBook tokens, also check tradesByMarket
      if (pos.isOrderbook && tradesByMarket) {
        // Try multiple keys to find trades
        const possibleKeys = [
          pos.tokenId.toLowerCase(),
          pos.symbol ? `${pos.symbol}USDC` : null,
          pos.symbol ? `${pos.symbol}MON` : null,
          pos.symbol ? `${pos.symbol}ETH` : null,
        ].filter(Boolean);

        let orderBookTrades: any[] = [];
        for (const key of possibleKeys) {
          if (key && tradesByMarket[key]) {
            orderBookTrades = tradesByMarket[key];
            break;
          }
        }

        if (orderBookTrades.length > 0) {
          // Filter trades by wallet address if available
          const filteredOrderBookTrades = orderBookTrades
            .filter((trade: any) => {
              const tradeWalletAddr = (trade.account?.id || trade.caller || '').toLowerCase();
              return tradeWalletAddr === walletAddress?.toLowerCase();
            })
            .map((trade: any) => {
              const isBuy = !!trade.isBuy;
              const nativeAmount = Number(isBuy ? trade.amountIn : trade.amountOut) / 1e18;
              const timestamp = Number(trade.timestamp || 0);
              const now = Date.now() / 1000;
              const secondsAgo = Math.max(0, now - timestamp);
              let timeAgo = 'now';
              if (secondsAgo < 60) timeAgo = `${Math.floor(secondsAgo)}s`;
              else if (secondsAgo < 3600) timeAgo = `${Math.floor(secondsAgo / 60)}m`;
              else if (secondsAgo < 86400) timeAgo = `${Math.floor(secondsAgo / 3600)}h`;
              else timeAgo = `${Math.floor(secondsAgo / 86400)}d`;

              return {
                id: trade.id || `${trade.transaction?.id || ''}-${Date.now()}`,
                walletName: walletName,
                emoji: walletEmoji,
                token: pos.symbol,
                amount: Number(isBuy ? trade.amountOut : trade.amountIn) / 1e18,
                monAmount: nativeAmount,
                price: Number(trade.price || 0),
                marketCap: Number(trade.price || 0) * 1e9,
                time: timeAgo,
                txHash: trade.transaction?.id || trade.id,
                type: isBuy ? 'buy' : 'sell',
                createdAt: new Date(timestamp * 1000).toISOString(),
              };
            });
          tokenTrades = [...tokenTrades, ...filteredOrderBookTrades];
        }
      }

      // Sort trades by timestamp (most recent first)
      tokenTrades.sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      const isHidden = hiddenTokens.has(pos.tokenId);
      // Use token creator address if available, otherwise use token ID as proxy
      const devAddress = (market as any)?.creator || (market as any)?.devAddress || pos.tokenId;
      const isBlacklisted = blacklistedDevs.has(devAddress);

      // Get bonding curve progress for overlay
      const bondingPercentage = market?.bondingCurveProgress || 0;
      const showBonding = bondingPercentage < 100 && hoveredMonitorToken === pos.tokenId;

      // Get image URL - prefer market data, fallback to position data
      const imageUrl = market?.imageUrl || (market as any)?.image || pos.imageUrl;

      return (
        <div key={`${pos.tokenId}_${walletAddress}`} className={classes.join(' ')}>
          <div
            className="tracker-monitor-card-header"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setExpandedTokenIds(prev => {
                const newSet = new Set(prev);
                if (isExpanded) {
                  newSet.delete(pos.tokenId);
                } else {
                  newSet.add(pos.tokenId);
                }
                return newSet;
              });
            }}
          >
            <div className="tracker-monitor-card-top">
              <div className="tracker-monitor-token-actions">
                <button
                  className={`tracker-monitor-hide-button ${isHidden ? 'strikethrough' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHideToken(pos.tokenId);
                  }}
                >
                  <Tooltip content={isHidden ? 'Show Token' : 'Hide Token'}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </Tooltip>
                </button>
                <button
                  className={`tracker-monitor-blacklist-button ${isBlacklisted ? 'strikethrough' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBlacklistDev(pos.tokenId, devAddress);
                  }}
                >
                  <Tooltip content={isBlacklisted ? 'Unblacklist Dev' : 'Blacklist Dev'}>
                    <svg
                      className="tracker-monitor-blacklist-dev-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 30 30"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                    </svg>
                  </Tooltip>
                </button>
              </div>
              <div className="tracker-monitor-left-section">
                <div
                  className={`tracker-monitor-image-container ${bondingPercentage >= 100 ? 'graduated' : ''}`}
                  style={{
                    position: 'relative',
                    '--progress-angle': `${(bondingPercentage / 100) * 360}deg`
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    if (bondingPercentage < 100) {
                      setHoveredMonitorToken(pos.tokenId);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setBondingPopupPosition({
                        top: rect.top - 30,
                        left: rect.left + rect.width / 2
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredMonitorToken(null);
                  }}
                >
                  <div className="tracker-monitor-progress-spacer">
                    <div className="tracker-monitor-image-wrapper">
                      {imageUrl && !failedImages.has(pos.tokenId) ? (
                        <img
                          src={imageUrl}
                          className="tracker-monitor-market-image"
                          alt={tokenSymbol}
                          onError={() => {
                            setFailedImages(prev => new Set(prev).add(pos.tokenId));
                          }}
                        />
                      ) : (
                        <div
                          className="tracker-monitor-market-letter"
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgb(6,6,6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: tokenSymbol?.length <= 3 ? '34px' : '28px',
                            fontWeight: '200',
                            color: '#ffffff',
                            letterSpacing: tokenSymbol?.length > 3 ? '-1px' : '0',
                            borderRadius: '50%',
                          }}
                        >
                          {tokenSymbol?.slice(0, 2).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="tracker-monitor-launchpad-logo-container">
                    <Tooltip content="crystal.fun">
                      <img src="/CrystalLogo.png" className="tracker-monitor-launchpad-logo" alt="crystal.fun" />
                    </Tooltip>
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

                  {/* Additional data section - Holders and Pro Traders */}
                  <div className="explorer-additional-data">
                    <div className="explorer-stat-item">
                      <svg
                        className="traders-icon"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M 8.8007812 3.7890625 C 6.3407812 3.7890625 4.3496094 5.78 4.3496094 8.25 C 4.3496094 9.6746499 5.0287619 10.931069 6.0703125 11.748047 C 3.385306 12.836193 1.4902344 15.466784 1.4902344 18.550781 C 1.4902344 18.960781 1.8202344 19.300781 2.2402344 19.300781 C 2.6502344 19.300781 2.9902344 18.960781 2.9902344 18.550781 C 2.9902344 15.330781 5.6000781 12.720703 8.8300781 12.720703 L 8.8203125 12.710938 C 8.9214856 12.710938 9.0168776 12.68774 9.1054688 12.650391 C 9.1958823 12.612273 9.2788858 12.556763 9.3476562 12.488281 C 9.4163056 12.41992 9.4712705 12.340031 9.5097656 12.25 C 9.5480469 12.160469 9.5703125 12.063437 9.5703125 11.960938 C 9.5703125 11.540938 9.2303125 11.210938 8.8203125 11.210938 C 7.1903125 11.210938 5.8691406 9.8897656 5.8691406 8.2597656 C 5.8691406 6.6297656 7.1900781 5.3105469 8.8300781 5.3105469 L 8.7890625 5.2890625 C 9.2090625 5.2890625 9.5507812 4.9490625 9.5507812 4.5390625 C 9.5507812 4.1190625 9.2107813 3.7890625 8.8007812 3.7890625 z M 14.740234 3.8007812 C 12.150234 3.8007812 10.060547 5.9002344 10.060547 8.4902344 L 10.039062 8.4707031 C 10.039063 10.006512 10.78857 11.35736 11.929688 12.212891 C 9.0414704 13.338134 7 16.136414 7 19.429688 C 7 19.839688 7.33 20.179688 7.75 20.179688 C 8.16 20.179688 8.5 19.839688 8.5 19.429688 C 8.5 15.969687 11.29 13.179688 14.75 13.179688 L 14.720703 13.160156 C 14.724012 13.160163 14.727158 13.160156 14.730469 13.160156 C 16.156602 13.162373 17.461986 13.641095 18.519531 14.449219 C 18.849531 14.709219 19.320078 14.640313 19.580078 14.320312 C 19.840078 13.990313 19.769219 13.519531 19.449219 13.269531 C 18.873492 12.826664 18.229049 12.471483 17.539062 12.205078 C 18.674662 11.350091 19.419922 10.006007 19.419922 8.4804688 C 19.419922 5.8904687 17.320234 3.8007812 14.740234 3.8007812 z M 14.730469 5.2890625 C 16.490469 5.2890625 17.919922 6.7104688 17.919922 8.4804688 C 17.919922 10.240469 16.500234 11.669922 14.740234 11.669922 C 12.980234 11.669922 11.560547 10.250234 11.560547 8.4902344 C 11.560547 6.7302344 12.98 5.3105469 14.75 5.3105469 L 14.730469 5.2890625 z M 21.339844 16.230469 C 21.24375 16.226719 21.145781 16.241797 21.050781 16.279297 L 21.039062 16.259766 C 20.649063 16.409766 20.449609 16.840469 20.599609 17.230469 C 20.849609 17.910469 20.990234 18.640156 20.990234 19.410156 C 20.990234 19.820156 21.320234 20.160156 21.740234 20.160156 C 22.150234 20.160156 22.490234 19.820156 22.490234 19.410156 C 22.490234 18.470156 22.319766 17.560703 22.009766 16.720703 C 21.897266 16.428203 21.628125 16.241719 21.339844 16.230469 z" />
                      </svg>
                      <span className="explorer-stat-value">
                        {market?.holders?.toLocaleString() || '0'}
                      </span>
                    </div>

                    <div className="explorer-stat-item">
                      <svg
                        className="pro-traders-icon"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M 12 2 L 12 4 L 11 4 C 10.4 4 10 4.4 10 5 L 10 10 C 10 10.6 10.4 11 11 11 L 12 11 L 12 13 L 14 13 L 14 11 L 15 11 C 15.6 11 16 10.6 16 10 L 16 5 C 16 4.4 15.6 4 15 4 L 14 4 L 14 2 L 12 2 z M 4 9 L 4 11 L 3 11 C 2.4 11 2 11.4 2 12 L 2 17 C 2 17.6 2.4 18 3 18 L 4 18 L 4 20 L 6 20 L 6 18 L 7 18 C 7.6 18 8 17.6 8 17 L 8 12 C 8 11.4 7.6 11 7 11 L 6 11 L 6 9 L 4 9 z M 18 11 L 18 13 L 17 13 C 16.4 13 16 13.4 16 14 L 16 19 C 16 19.6 16.4 20 17 20 L 18 20 L 18 22 L 20 22 L 20 20 L 21 20 C 21.6 20 22 19.6 22 19 L 22 14 C 22 13.4 21.6 13 21 13 L 20 13 L 20 11 L 18 11 z M 4 13 L 6 13 L 6 16 L 4 16 L 4 13 z" />
                      </svg>
                      <span className="explorer-stat-value">
                        {Math.floor((market?.holders || 0) * 0.15).toLocaleString()}
                      </span>
                    </div>

                    <Tooltip content="Dev Migrations">
                      <div className="explorer-stat-item">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="tracker-monitor-graduated-icon"
                          style={
                            (market as any)?.graduatedTokens > 0
                              ? { color: 'rgba(255, 251, 0, 1)' }
                              : undefined
                          }
                        >
                          <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
                          <path d="M5 21h14" />
                        </svg>
                        <div className="tracker-monitor-dev-migrations-container">
                          <span className="tracker-monitor-dev-migrations-value">
                            {((market as any)?.graduatedTokens || 0).toLocaleString()}
                          </span>{' '}
                          <span className="tracker-monitor-dev-migrations-slash">/</span>
                          <span className="tracker-monitor-dev-migrations-value">
                            {((market as any)?.launchedTokens || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Market metrics (V, MC, F, TX) in top-right */}
              <div className="tracker-monitor-right-section">
                <div className="tracker-monitor-third-row">
                  <div className="tracker-monitor-metrics-container">
                    <div className="tracker-monitor-volume">
                      <span className="tracker-monitor-mc-label">V</span>
                      <span className="tracker-monitor-mc-value">
                        {monitorCurrency === 'USD'
                          ? formatPrice(((market?.volume24h || 0) * monUsdPrice), false, true)
                          : formatPrice((market?.volume24h || 0), false, false)}
                      </span>
                    </div>
                    <div className="tracker-monitor-market-cap">
                      <span className="tracker-monitor-mc-label">MC</span>
                      <span className="tracker-monitor-mc-value">
                        {monitorCurrency === 'USD'
                          ? formatPrice((market?.marketCap || pos.lastPrice * 1e9) * monUsdPrice, false, true)
                          : formatPrice((market?.marketCap || pos.lastPrice * 1e9), false, false)}
                      </span>
                    </div>
                  </div>

                  <div className="tracker-monitor-third-row-section">
                    <div className="tracker-monitor-stat-item">
                      <span className="tracker-monitor-fee-label">F</span>
                      <span className="tracker-monitor-fee-total">
                        {monitorCurrency === 'USD'
                          ? formatPrice(((market?.volume24h || 0) * monUsdPrice) / 100, false, true)
                          : formatPrice((market?.volume24h || 0) / 100, false, false)}
                      </span>
                    </div>

                    <div className="tracker-monitor-tx-bar">
                      <div className="tracker-monitor-tx-header">
                        <span className="tracker-monitor-tx-label">TX</span>
                        <span className="tracker-monitor-tx-total">
                          {((market?.buyTransactions || 0) + (market?.sellTransactions || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div className="tracker-monitor-tx-visual-bar">
                        {((market?.buyTransactions || 0) + (market?.sellTransactions || 0)) === 0 ? (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#252526ff',
                            borderRadius: '1px'
                          }} />
                        ) : (
                          <>
                            <div
                              className="tracker-monitor-tx-buy-portion"
                              style={{
                                width: `${((market?.buyTransactions || 0) / ((market?.buyTransactions || 0) + (market?.sellTransactions || 0)) * 100)}%`
                              }}
                            />
                            <div
                              className="tracker-monitor-tx-sell-portion"
                              style={{
                                width: `${((market?.sellTransactions || 0) / ((market?.buyTransactions || 0) + (market?.sellTransactions || 0)) * 100)}%`
                              }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom section with stats on left and quickbuy on right */}
            <div className="tracker-monitor-bottom-controls">
              <div className="tracker-monitor-bottom-left">
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

              <button
                className="tracker-monitor-quickbuy-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickBuy(pos.tokenId, tokenSymbol, pos.imageUrl);
                }}
              >
                <svg
                  className="tracker-monitor-quickbuy-icon"
                  viewBox="0 0 72 72"
                  fill="currentColor"
                >
                  <path d="M30.992,60.145c-0.599,0.753-1.25,1.126-1.952,1.117c-0.702-0.009-1.245-0.295-1.631-0.86 c-0.385-0.565-0.415-1.318-0.09-2.26l5.752-16.435H20.977c-0.565,0-1.036-0.175-1.412-0.526C19.188,40.83,19,40.38,19,39.833 c0-0.565,0.223-1.121,0.668-1.669l21.34-26.296c0.616-0.753,1.271-1.13,1.965-1.13s1.233,0.287,1.618,0.86 c0.385,0.574,0.415,1.331,0.09,2.273l-5.752,16.435h12.095c0.565,0,1.036,0.175,1.412,0.526C52.812,31.183,53,31.632,53,32.18 c0,0.565-0.223,1.121-0.668,1.669L30.992,60.145z" />
                </svg>
                1 MON
              </button>
            </div>
          </div>

          {/* Expanded trades section */}
          {isExpanded && (
            <div className="tracker-monitor-card-expanded">
              <div className="monitor-expanded-trades-table">
                <div className="monitor-expanded-header">
                  <div className="monitor-expanded-header-cell">Wallet</div>
                  <div className="monitor-expanded-header-cell">Time in Trade</div>
                  <div className="monitor-expanded-header-cell">Bought</div>
                  <div className="monitor-expanded-header-cell">Sold</div>
                  <div className="monitor-expanded-header-cell">Remaining</div>
                  <div className="monitor-expanded-header-cell">PNL</div>
                </div>

                <div className="monitor-expanded-body">
                  {tokenTrades.length > 0 ? (() => {
                    // Aggregate trades by wallet
                    const walletPositions = new Map<string, any>();

                    // Sort trades chronologically (oldest first)
                    const sortedTrades = [...tokenTrades].sort((a, b) =>
                      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );

                    sortedTrades.forEach((trade: any) => {
                      const walletKey = trade.walletAddress?.toLowerCase() || trade.walletName;

                      if (!walletPositions.has(walletKey)) {
                        walletPositions.set(walletKey, {
                          walletAddress: trade.walletAddress,
                          walletName: trade.walletName,
                          walletEmoji: trade.walletEmoji,
                          totalBought: 0,
                          totalSold: 0,
                          buyTxns: 0,
                          sellTxns: 0,
                          firstTradeTime: new Date(trade.createdAt).getTime(),
                          lastTradeTime: new Date(trade.createdAt).getTime(),
                          trades: []
                        });
                      }

                      const position = walletPositions.get(walletKey);
                      const tradeValue = monitorCurrency === 'USD' ? (monUsdPrice ? trade.amount * monUsdPrice : trade.amount) : trade.amount;

                      if (trade.type === 'buy') {
                        position.totalBought += tradeValue;
                        position.buyTxns += 1;
                      } else {
                        position.totalSold += tradeValue;
                        position.sellTxns += 1;
                      }

                      position.lastTradeTime = Math.max(position.lastTradeTime, new Date(trade.createdAt).getTime());
                      position.trades.push(trade);
                    });

                    // Convert to array and calculate derived values
                    const aggregatedPositions = Array.from(walletPositions.values()).map(pos => {
                      const remaining = pos.totalBought - pos.totalSold;
                      const pnl = pos.totalBought > 0 ? (pos.totalSold + remaining) / pos.totalBought : 0;

                      // Calculate time in trade
                      const duration = pos.lastTradeTime - pos.firstTradeTime;
                      const seconds = Math.floor(duration / 1000);
                      let timeInTrade = '';
                      let isExited = remaining <= 0.01;

                      if (isExited) {
                        timeInTrade = 'Exited';
                      } else if (seconds < 60) {
                        timeInTrade = `${seconds}s`;
                      } else if (seconds < 3600) {
                        timeInTrade = `${Math.floor(seconds / 60)}m`;
                      } else if (seconds < 86400) {
                        timeInTrade = `${Math.floor(seconds / 3600)}h`;
                      } else {
                        timeInTrade = `${Math.floor(seconds / 86400)}d`;
                      }

                      return {
                        ...pos,
                        remaining,
                        pnl,
                        timeInTrade,
                        isExited
                      };
                    });

                    return aggregatedPositions.slice(0, 10).map((position: any, idx: any) => {
                      const pnlAbsolute = position.totalSold + position.remaining - position.totalBought;
                      const pnlPercentage = position.totalBought > 0 ? (pnlAbsolute / position.totalBought) * 100 : 0;

                      const prefix = monitorCurrency === 'USD' ? '$' : '';
                      const suffix = monitorCurrency === 'MON' ? ' MON' : '';

                      // Format amounts
                      const boughtFormatted = position.totalBought === 0
                        ? '0'
                        : position.totalBought < 0.0001
                          ? position.totalBought.toExponential(2)
                          : position.totalBought.toLocaleString(undefined, { maximumFractionDigits: 1 });

                      const soldFormatted = position.totalSold === 0
                        ? '0'
                        : position.totalSold < 0.0001
                          ? position.totalSold.toExponential(2)
                          : position.totalSold.toLocaleString(undefined, { maximumFractionDigits: 1 });

                      const remainingFormatted = position.remaining === 0
                        ? '0'
                        : position.remaining < 0.0001
                          ? position.remaining.toExponential(2)
                          : position.remaining.toLocaleString(undefined, { maximumFractionDigits: 2 });

                      const pnlAbsFormatted = pnlAbsolute === 0
                        ? '0'
                        : Math.abs(pnlAbsolute) < 0.0001
                          ? Math.abs(pnlAbsolute).toExponential(2)
                          : Math.abs(pnlAbsolute).toLocaleString(undefined, { maximumFractionDigits: 2 });

                      const remainingPct = position.totalBought > 0 ? (position.remaining / position.totalBought) * 100 : 0;

                      // Determine row class based on whether they have more buys or sells
                      const rowClass = position.buyTxns > position.sellTxns ? 'buy' : position.sellTxns > position.buyTxns ? 'sell' : 'buy';

                      return (
                        <div
                          key={`${position.walletAddress}-${idx}`}
                          className={`monitor-expanded-row ${rowClass}`}
                        >
                          <div className="monitor-expanded-col">
                            <span className="wallet-emoji">{position.walletEmoji}</span>
                            <span className="wallet-name">
                              {position.walletAddress
                                ? `${position.walletAddress.slice(0, 4)}...${position.walletAddress.slice(-3)}`
                                : position.walletName}
                            </span>
                          </div>
                          <div className="monitor-expanded-col">
                            {position.timeInTrade}
                          </div>
                          <div className="monitor-expanded-col">
                            <div className="monitor-trade-info">
                              <span className="monitor-amount amount-buy">
                                {prefix}{boughtFormatted}{suffix}
                              </span>
                              {position.buyTxns > 0 && (
                                <span className="tracker-monitor-txn-count">{position.buyTxns} txn{position.buyTxns > 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                          <div className="monitor-expanded-col">
                            <div className="monitor-trade-info">
                              <span className="monitor-amount amount-sell">
                                {prefix}{soldFormatted}{suffix}
                              </span>
                              {position.sellTxns > 0 && (
                                <span className="tracker-monitor-txn-count">{position.sellTxns} txn{position.sellTxns > 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                          <div className="monitor-expanded-col">
                            <div className="monitor-remaining-info">
                              <div className="monitor-remaining-container">
                                <span className="monitor-remaining">
                                  {prefix}{remainingFormatted}{suffix}
                                </span>
                                <span className="monitor-remaining-percentage">
                                  {remainingPct.toFixed(0)}%
                                </span>
                              </div>
                              <div className="monitor-remaining-bar">
                                <div
                                  className="monitor-remaining-bar-fill"
                                  style={{
                                    width: `${Math.max(0, Math.min(100, remainingPct)).toFixed(0)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="monitor-expanded-col">
                            <span className={`monitor-pnl ${pnlAbsolute >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                              {pnlAbsolute >= 0 ? '+' : '-'}{prefix}{pnlAbsFormatted}{suffix} ({pnlPercentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })() : (
                    <div className="monitor-expanded-empty">
                      No trades found for this token
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="tracker-monitor">
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
                  {launchpadPositions.map((pos) => renderPositionCard(pos))}
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
                <div className="tracker-monitor-grid">
                  {orderbookPositions.map((pos) => renderPositionCard(pos))}
                </div>
              </div>
            </div>

        </div>

        {hoveredMonitorToken && createPortal(
          <div
            className="tracker-bonding-amount-display visible"
            style={{
              position: 'absolute',
              top: `${bondingPopupPosition.top}px`,
              left: `${bondingPopupPosition.left}px`,
              transform: 'translateX(-50%)',
              color: getBondingColor(
                marketsRef.current.get(hoveredMonitorToken.toLowerCase())?.bondingCurveProgress || 0
              ),
              pointerEvents: 'none',
              zIndex: 9999,
            }}
          >
            BONDING: {(marketsRef.current.get(hoveredMonitorToken.toLowerCase())?.bondingCurveProgress || 0).toFixed(1)}%
          </div>,
          document.body
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
            <button className="tracker-header-button" onClick={() => setpopup(33)}>
              <img
                className="tracker-settings-image"
                src={settingsicon}
              />
            </button>
            <button className="tracker-header-button" onClick={() => setShowFiltersPopup(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M7 12h10M10 18h4" />
              </svg>
            </button>
            <button
              className="tracker-header-button"
              onClick={() => setMonitorCurrency(prev => prev === 'USD' ? 'MON' : 'USD')}
            >
              {monitorCurrency === 'USD' ? 'USD' : 'MON'}
            </button>
            <button className="tracker-header-button" onClick={() => setpopup(37)}>P1</button>
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
        <AddWalletModal
          onClose={() => setShowAddWalletModal(false)}
          onAdd={handleAddWallet}
          existingWallets={trackedWallets}
        />
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