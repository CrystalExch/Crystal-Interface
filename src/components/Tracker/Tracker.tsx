import { Search, Edit2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import copy from '../../assets/copy.svg'
import closebutton from '../../assets/close_button.png'
import monadicon from '../../assets/monadlogo.svg';
import trash from '../../assets/trash.svg';
import { settings } from '../../settings';
import ImportWalletsPopup from './ImportWalletsPopup';
import LiveTradesFiltersPopup from './LiveTradesFiltersPopup/LiveTradesFiltersPopup';
import { useSharedContext } from '../../contexts/SharedContext';
import MonitorFiltersPopup, { MonitorFilterState } from './MonitorFiltersPopup/MonitorFiltersPopup';
import settingsicon from '../../assets/settings.svg';
import circle from '../../assets/circle_handle.png';
import lightning from '../../assets/flash.png';
import key from '../../assets/key.svg';


import './Tracker.css';

import { watchContractEvent, getPublicClient } from 'wagmi/actions';
import { config } from '../../wagmi' 
import { CrystalMarketAbi } from '../../abis/CrystalMarketAbi';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi'; 
import { CrystalLaunchpadToken } from '../../abis/CrystalLaunchpadToken';

const dlog = (...args: any[]) => {
  // flip to true to see logs; or set (window as any).DEBUG_TRACKER = true in devtools
  const ON = (window as any).DEBUG_TRACKER ?? true;
  if (ON) console.log('[Tracker]', ...args);
};

const STORAGE_KEY = 'tracked_wallets_data';
const DISPLAY_SCALE = 1000;
const MONITOR_POLL_MS = 15000;


const saveWalletsToStorage = (wallets: TrackedWallet[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
  } catch (error) {
    console.error('Failed to save wallets to localStorage:', error);
  }
};

function chainCfgOf(activechain?: string | number) {
  const cc: any = settings.chainConfig;
  return cc?.[activechain as any]
      || cc?.[Number(activechain) as any]
      || cc?.monad
      || cc?.[10143];
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
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, children, position = 'top' }) => {
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

interface TrackedWallet {
  address: string;
  name: string;
  emoji: string;
  balance: number;
  lastActive: string;
  id: string;
}

interface LiveTrade {
  id: string;
  walletName: string;
  emoji: string;
  token: string;
  amount: number;
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
  activechain?: string;
  walletTokenBalances?: { [address: string]: any };
  connected?: boolean;
  address?: string | null;
  getWalletIcon?: () => string;
  onDepositClick?: () => void;
  onDisconnect?: () => void;
  t?: (k: string) => string;
}

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
}

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


type TrackerTab = 'wallets' | 'trades' | 'monitor';
type SortDirection = 'asc' | 'desc';


const Tracker: React.FC<TrackerProps> = ({
  isBlurred,
  setpopup,
  onApplyFilters: externalOnApplyFilters,
  activeFilters: externalActiveFilters,
  monUsdPrice,
  walletTokenBalances = {}
}) => {
  const [selectedSimpleFilter, setSelectedSimpleFilter] = useState<string | null>(null);
  const context = useSharedContext();
  const activechain = context?.activechain || 'monad';
  const [walletSortField, setWalletSortField] = useState<'balance' | 'lastActive' | null>(null);
  const [walletSortDirection, setWalletSortDirection] = useState<SortDirection>('desc');
  const [showMonitorFiltersPopup, setShowMonitorFiltersPopup] = useState(false);
  const [trackedWalletTrades, setTrackedWalletTrades] = useState<LiveTrade[]>([
    {
      id: '0x1234567890abcdef1234567890abcdef12345678-1',
      walletName: 'Paper Hands',
      emoji: '😀',
      token: 'DOGE',
      amount: 25.5,
      marketCap: 1250,
      time: '2m',
      txHash: '0x1234567890abcdef1234567890abcdef12345678',
      type: 'buy',
      createdAt: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: '0x1234567890abcdef1234567890abcdef12345679-2',
      walletName: 'Whale Watcher',
      emoji: '😈',
      token: 'SHIB',
      amount: 150.0,
      marketCap: 5600,
      time: '5m',
      txHash: '0x1234567890abcdef1234567890abcdef12345679',
      type: 'sell',
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: '0x1234567890abcdef1234567890abcdef12345680-3',
      walletName: 'Diamond Hands',
      emoji: '💎',
      token: 'PEPE',
      amount: 75.25,
      marketCap: 3200,
      time: '8m',
      txHash: '0x1234567890abcdef1234567890abcdef12345680',
      type: 'buy',
      createdAt: new Date(Date.now() - 480000).toISOString(),
    },
    {
      id: '0x1234567890abcdef1234567890abcdef12345681-4',
      walletName: 'Moon Boy',
      emoji: '🚀',
      token: 'BONK',
      amount: 200.75,
      marketCap: 8900,
      time: '12m',
      txHash: '0x1234567890abcdef1234567890abcdef12345681',
      type: 'sell',
      createdAt: new Date(Date.now() - 720000).toISOString(),
    },
    {
      id: '0x1234567890abcdef1234567890abcdef12345682-5',
      walletName: 'Degen Trader',
      emoji: '⚡',
      token: 'WIF',
      amount: 50.0,
      marketCap: 2100,
      time: '15m',
      txHash: '0x1234567890abcdef1234567890abcdef12345682',
      type: 'buy',
      createdAt: new Date(Date.now() - 900000).toISOString(),
    }
  ]);



  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>(() => {
    const stored = loadWalletsFromStorage();
    return stored.length > 0 ? stored : [];
  });

  const trackedWalletsRef = useRef(trackedWallets);
  useEffect(() => { trackedWalletsRef.current = trackedWallets; }, [trackedWallets]);
  

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
      amount: nativeAmount,
      marketCap: marketCap / DISPLAY_SCALE,
      time: timeAgo,
      txHash: trade.transaction?.id || trade.id,
      type: isBuy ? 'buy' : 'sell',
      createdAt: new Date(timestamp * 1000).toISOString(),
    };
  }, []);

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersPopup, setShowFiltersPopup] = useState(false);
  const [monitorCurrency, setMonitorCurrency] = useState<'USD' | 'MON'>('USD');
  const [walletCurrency, setWalletCurrency] = useState<'USD' | 'MON'>('USD');
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
  const txFromCacheRef = useRef(new Map<string, string>());

  const trackedSetRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    trackedSetRef.current = new Set(trackedWallets.map(w => w.address.toLowerCase()));
  }, [trackedWallets]);

  const push = useCallback((logs: any[], source: 'router' | 'market' | 'launchpad') => {
    if (!logs?.length) return;

    const lower = (s?: string) => (s || '').toLowerCase();
    const wallets = trackedWalletsRef.current;

    const touchWallet = (addr: string) => {
      const key = lower(addr);
      if (!trackedSetRef.current.has(key)) return;
      // avoid no-op updates
      setTrackedWallets(prev => {
        let changed = false;
        const next = prev.map(x => {
          if (lower(x.address) === key && x.lastActive !== '0s') {
            changed = true;
            return { ...x, lastActive: '0s' };
          }
          return x;
        });
        return changed ? next : prev;
      });
    };

    const pc = getPublicClient(config, { chainId: chainCfgOf(activechain)?.id });

    setTrackedWalletTrades(prev => {
      const next: LiveTrade[] = [...prev];

      for (const l of logs) {
        const args: any = l?.args ?? {};
        const txHash: string = l?.transactionHash ?? l?.transaction?.id ?? l?.id;

        // 1) try event args
        let accountAddr: string | null =
          (args.account || args.trader || args.sender || args.owner || args.from) ?? null;

        // 2) fallback: resolve from the tx (async, cached)
        if (!accountAddr && txHash) {
          const cached = txFromCacheRef.current.get(txHash);
          if (cached) {
            accountAddr = cached;
          } else {
            // fire-and-forget; update lastActive when resolved
            pc.getTransaction({ hash: txHash as `0x${string}` })
              .then(tx => {
                if (!tx?.from) return;
                txFromCacheRef.current.set(txHash, tx.from);
                if (trackedSetRef.current.has(lower(tx.from))) {
                  touchWallet(tx.from);
                }
              })
              .catch(() => {});
          }
        }

        if (accountAddr) touchWallet(accountAddr);

        // derive numbers safely
        const isBuy     = Boolean(args.isBuy ?? args.buy ?? (args.from && !args.to));
        const amountIn  = Number(args.amountIn ?? 0n) / 1e18;
        const amountOut = Number(args.amountOut ?? 0n) / 1e18;
        const priceWad  = Number(args.priceNativePerTokenWad ?? args.price ?? 0n) / 1e18;

        const tradeLike = {
          id: txHash || `${Date.now()}_${Math.random()}`,
          account: { id: String(accountAddr || '') },
          isBuy,
          amountIn: BigInt(Math.floor(amountIn * 1e18)),
          amountOut: BigInt(Math.floor(amountOut * 1e18)),
          priceNativePerTokenWad: BigInt(Math.floor(priceWad * 1e18)),
          token: { symbol: args.symbol || args.ticker || 'UNK' },
          timestamp: Math.floor(Date.now() / 1000),
        };

        next.unshift(normalizeTrade(tradeLike, wallets));
      }

      // dedupe and trim
      const seen = new Set<string>();
      const out: LiveTrade[] = [];
      for (const t of next) { if (!seen.has(t.id)) { seen.add(t.id); out.push(t); } }
      return out.slice(0, 500);
    });
  }, [normalizeTrade, activechain]);



  useEffect(() => {
    const cfg = chainCfgOf(activechain);
    const chainId = cfg?.id; // ensure your chainConfig exposes this

    const unsubs: Array<() => void> = [];
    const common = { poll: true as const, chainId };

    // router
    if (cfg?.router) {
      unsubs.push(watchContractEvent(config, {
        address: cfg.router as `0x${string}`,
        abi: CrystalRouterAbi,
        eventName: 'Trade' as any,
        onLogs: (logs) => push(logs, 'router'),
        ...common,
      }));
    }

    // market
    if (cfg?.market) {
      unsubs.push(watchContractEvent(config, {
        address: cfg.market as `0x${string}`,
        abi: CrystalMarketAbi,
        eventName: 'Trade' as any,
        onLogs: (logs) => push(logs, 'market'),
        ...common,
      }));
    }

    // launchpad/transfer
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

    return () => { try { unsubs.forEach(u => u?.()); } catch {} };
  }, [activechain, push]);



  useEffect(() => {
    saveWalletsToStorage(trackedWallets);
  }, [trackedWallets]);

  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);








  useEffect(() => {
    if (Object.keys(walletTokenBalances).length === 0) return;

    setTrackedWallets(prev => prev.map(wallet => {
      const realBalance = walletTokenBalances[wallet.address];
      if (realBalance && chainCfg.eth) {
        const balance = Number(realBalance[chainCfg.eth] || 0) / 1e18;
        return {
          ...wallet,
          balance: balance
        };
      }
      return wallet;
    }));
  }, [walletTokenBalances, activechain]);

  

  const [monitorTokens, setMonitorTokens] = useState<MonitorToken[]>([
    {
      id: 'token-1',
      tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'Doge Killer',
      symbol: 'DOGEK',
      emoji: '🐕',
      price: 0.000125,
      marketCap: 125000,
      change24h: 15.6,
      volume24h: 45000,
      liquidity: 25000,
      holders: 1250,
      buyTransactions: 145,
      sellTransactions: 89,
      bondingCurveProgress: 85,
      txCount: 234,
      volume5m: 1200,
      volume1h: 8500,
      volume6h: 18000,
      priceChange5m: 2.3,
      priceChange1h: 8.7,
      priceChange6h: 12.4,
      priceChange24h: 15.6,
      website: '',
      twitter: '',
      telegram: '',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      lastTransaction: new Date(Date.now() - 300000).toISOString(), // 5 min ago
      trades: [
        {
          id: 'trade-1',
          wallet: 'Paper Hands',
          emoji: '😀',
          timeInTrade: '2h 15m',
          bought: 150.5,
          boughtTxns: 3,
          sold: 45.2,
          soldTxns: 1,
          pnl: 25.8,
          remaining: 105.3
        },
        {
          id: 'trade-2',
          wallet: 'Diamond Hands',
          emoji: '💎',
          timeInTrade: '6h 42m',
          exitStatus: 'Exited' as const,
          bought: 200.0,
          boughtTxns: 2,
          sold: 200.0,
          soldTxns: 2,
          pnl: 85.4,
          remaining: 0
        }
      ]
    },
    {
      id: 'token-2',
      tokenAddress: '0x2345678901bcdef12345678901bcdef123456789',
      name: 'Moon Rocket',
      symbol: 'MOON',
      emoji: '🚀',
      price: 0.000890,
      marketCap: 890000,
      change24h: -8.3,
      volume24h: 125000,
      liquidity: 78000,
      holders: 3450,
      buyTransactions: 287,
      sellTransactions: 194,
      bondingCurveProgress: 67,
      txCount: 481,
      volume5m: 2100,
      volume1h: 12500,
      volume6h: 45000,
      priceChange5m: -1.2,
      priceChange1h: -3.8,
      priceChange6h: -6.1,
      priceChange24h: -8.3,
      website: '',
      twitter: '',
      telegram: '',
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      lastTransaction: new Date(Date.now() - 120000).toISOString(), // 2 min ago
      trades: [
        {
          id: 'trade-3',
          wallet: 'Whale Watcher',
          emoji: '😈',
          timeInTrade: '1d 4h',
          bought: 500.0,
          boughtTxns: 5,
          sold: 150.0,
          soldTxns: 2,
          pnl: -45.6,
          remaining: 350.0
        }
      ]
    },
    {
      id: 'token-3',
      tokenAddress: '0x3456789012cdef123456789012cdef1234567890',
      name: 'Shiba Inu 2.0',
      symbol: 'SHIB2',
      emoji: '🐕‍🦺',
      price: 0.0000045,
      marketCap: 4500,
      change24h: 125.7,
      volume24h: 8900,
      liquidity: 3200,
      holders: 890,
      buyTransactions: 67,
      sellTransactions: 23,
      bondingCurveProgress: 15,
      txCount: 90,
      volume5m: 450,
      volume1h: 2100,
      volume6h: 5600,
      priceChange5m: 8.9,
      priceChange1h: 45.2,
      priceChange6h: 89.3,
      priceChange24h: 125.7,
      website: '',
      twitter: '',
      telegram: '',
      createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      lastTransaction: new Date(Date.now() - 60000).toISOString(), // 1 min ago
      trades: [
        {
          id: 'trade-4',
          wallet: 'Moon Boy',
          emoji: '🚀',
          timeInTrade: '8h 12m',
          bought: 75.0,
          boughtTxns: 2,
          sold: 0,
          soldTxns: 0,
          pnl: 89.5,
          remaining: 75.0
        },
        {
          id: 'trade-5',
          wallet: 'Degen Trader',
          emoji: '⚡',
          timeInTrade: '3h 45m',
          bought: 25.5,
          boughtTxns: 1,
          sold: 0,
          soldTxns: 0,
          pnl: 15.2,
          remaining: 25.5
        }
      ]
    }
  ]);
  const [isLoadingMonitor, setIsLoadingMonitor] = useState(false);

  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletEmoji, setNewWalletEmoji] = useState('😀');
  const [addWalletError, setAddWalletError] = useState('');

  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<string>('');
  const [showImportPopup, setShowImportPopup] = useState(false);

  const mainWalletsRef = useRef<HTMLDivElement>(null);

  const emojiOptions = ['😀', '😈', '🚀', '💎', '🔥', '⚡', '💰', '🎯', '👑', '🦄', '🐋', '🐸', '🤖', '👻', '🎪'];

  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };


  const minutesFromAge = (s: string) =>
    s.endsWith('m') ? +s.slice(0, -1)
    : s.endsWith('h') ? +s.slice(0, -1) * 60
    : s.endsWith('d') ? +s.slice(0, -1) * 1440
    : 999999;


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
      } else if (walletSortField === 'lastActive') {
        comparison = minutesFromAge(a.lastActive) - minutesFromAge(b.lastActive);
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

  const getFilteredMonitorTokens = () => {
    let tokens = [...monitorTokens];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tokens = tokens.filter((t) => 
        t.name.toLowerCase().includes(q) || 
        t.symbol.toLowerCase().includes(q)
      );
    }

    if (selectedSimpleFilter && SIMPLE_SORT_PRESETS[selectedSimpleFilter]) {
      const preset = SIMPLE_SORT_PRESETS[selectedSimpleFilter];
      tokens = tokens.sort((a, b) => {
        let aVal: number, bVal: number;
        
        switch (preset.sortBy) {
          case 'lastTransaction':
            aVal = new Date(a.lastTransaction || 0).getTime();
            bVal = new Date(b.lastTransaction || 0).getTime();
            break;
          case 'marketCap':
            aVal = a.marketCap;
            bVal = b.marketCap;
            break;
          case 'liquidity':
            aVal = a.liquidity;
            bVal = b.liquidity;
            break;
          case 'txCount':
            aVal = a.txCount;
            bVal = b.txCount;
            break;
          case 'holders':
            aVal = a.holders;
            bVal = b.holders;
            break;
          case 'inflowVolume':
            aVal = a.trades?.reduce((sum, t) => sum + (t?.bought ?? 0), 0) ?? 0;
            bVal = b.trades?.reduce((sum, t) => sum + (t?.bought ?? 0), 0) ?? 0;
            break;
          case 'outflowVolume':
            aVal = a.trades?.reduce((sum, t) => sum + (t?.sold ?? 0), 0) ?? 0;
            bVal = b.trades?.reduce((sum, t) => sum + (t?.sold ?? 0), 0) ?? 0;
            break;
          case 'createdAt':
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
            break;
          default:
            return 0;
        }
        
        return preset.order === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }

    return tokens;
  };

  const handleAddWallet = async () => {
    setAddWalletError('');

    if (!newWalletAddress.trim()) { setAddWalletError('Please enter a wallet address'); return; }
    if (!isValidAddress(newWalletAddress.trim())) { setAddWalletError('Invalid wallet address'); return; }
    const exists = trackedWallets.some(w => w.address.toLowerCase() === newWalletAddress.trim().toLowerCase());
    if (exists) { setAddWalletError('This wallet is already being tracked'); return; }

    const addr = (newWalletAddress || '').trim();
    dlog('ADD_WALLET click', { addr, valid: /^0x[a-fA-F0-9]{40}$/.test(addr) });


    const defaultName =
      newWalletName.trim() || `${newWalletAddress.slice(0, 6)}...${newWalletAddress.slice(-4)}`;

    const newWallet: TrackedWallet = {
      id: Date.now().toString(),
      address: newWalletAddress.trim(),
      name: defaultName,
      emoji: newWalletEmoji,
      balance: 0,             
      lastActive: '—'         
    };

    setTrackedWallets(prev => [...prev, newWallet]);
    closeAddWalletModal();
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
      const importedData = JSON.parse(walletsText);

      if (!Array.isArray(importedData)) {
        console.error('Invalid format: expected an array');
        return;
      }

      const walletsToImport = importedData.filter(item => {
        const exists = trackedWallets.some(
          w => w.address.toLowerCase() === item.trackedWalletAddress.toLowerCase()
        );
        return !exists && item.trackedWalletAddress;
      });

      const nowTag = Date.now().toString();
      const newWallets: TrackedWallet[] = walletsToImport.map((item, i) => {
        const walletName = (item.name || 'Imported Wallet').slice(0, 20);
        return {
          id: `${nowTag}_${i}_${Math.random().toString(36).slice(2)}`,
          address: item.trackedWalletAddress,
          name: walletName,
          emoji: item.emoji || '👻',
          balance: 0,
          lastActive: '—'
        };
      });


      if (newWallets.length > 0) {
        setTrackedWallets(prev => [...prev, ...newWallets]);
        console.log(`Successfully imported ${newWallets.length} wallets`);
      } else {
        console.log('No new wallets to import');
      }
    } catch (error) {
      console.error('Failed to import wallets:', error);
    }
  };

  const handleExportPrivateKey = (address: string) => {
    alert(`Export private key functionality needs to be integrated with your wallet management system.\n\nWallet: ${address}\n\nThis would typically:\n1. Retrieve the encrypted private key from secure storage\n2. Decrypt it with the user's password\n3. Display it securely or copy to clipboard`);
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
    setWalletToDelete(id);
    setShowDeleteConfirmation(true);
  };

  const deleteWallet = () => {
    setTrackedWallets(prev => prev.filter(w => w.id !== walletToDelete));
    setShowDeleteConfirmation(false);
    setWalletToDelete('');
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
    const chainId = cfg?.id;
    if (!chainId) {
      dlog('BALANCE_QUERY skipped: no chainId for', activechain);
      return;
    }

    const pc = getPublicClient(config, { chainId });
    let ignore = false;

    const addresses = trackedWallets.map(w => w.address);
    dlog('BALANCE_QUERY start', { activechain, chainId, count: addresses.length, addresses });

    (async () => {
      try {
        const results = new Map<string, number>();
        for (const a of addresses) {
          dlog('BALANCE_QUERY -> getBalance()', { address: a });
          try {
            const wei = await pc.getBalance({ address: a as `0x${string}` });
            if (ignore) return;
            const thousands = Number(wei) / 1e18 / DISPLAY_SCALE; // your UI shows “K”
            dlog('BALANCE_QUERY <- result', { address: a, wei: wei.toString(), thousands });
            results.set(a.toLowerCase(), thousands);
          } catch (err) {
            dlog('BALANCE_QUERY ERROR', { address: a, err });
          }
        }

        setTrackedWallets(prev =>
          prev.map(w => {
            const v = results.get(w.address.toLowerCase());
            return v != null ? { ...w, balance: v } : w;
          })
        );

        dlog('BALANCE_QUERY done');
      } catch (e) {
        dlog('BALANCE_QUERY fatal', e);
      }
    })();

    return () => { ignore = true; };
  }, [activechain, JSON.stringify(trackedWallets.map(w => w.address))]);



  

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

  const renderWalletManager = () => {
    const filteredWallets = getFilteredWallets();
    const isSelecting = activeSelectionContainer === 'main';

    return (
      <div className="tracker-wallet-manager">
        <div className="tracker-wallets-header">
          <div className="tracker-wallet-header-cell"></div>
          <div className="tracker-wallet-header-cell"></div>
          <div className="tracker-wallet-header-cell">Name</div>
          <div
            className={`tracker-wallet-header-cell sortable ${walletSortField === 'balance' ? 'active' : ''}`}
            onClick={() => handleWalletSort('balance')}
          >
            Balance
            {walletSortField === 'balance' && (
              <span className={`tracker-sort-arrow ${walletSortDirection}`}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M5 7L2 3H8L5 7Z" />
                </svg>
              </span>
            )}
          </div>
          <div
            className={`tracker-wallet-header-cell sortable ${walletSortField === 'lastActive' ? 'active' : ''}`}
            onClick={() => handleWalletSort('lastActive')}
          >
            Last Active
            {walletSortField === 'lastActive' && (
              <span className={`tracker-sort-arrow ${walletSortDirection}`}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M5 7L2 3H8L5 7Z" />
                </svg>
              </span>
            )}
          </div>
          <div className="tracker-wallet-header-cell">Actions</div>
        </div>
        
        {/* rest of the component remains the same */}
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
              className={`detail-trades-header-cell sortable ${tradeSortField === 'dateCreated' ? 'active' : ''}`}
              onClick={() => handleTradeSort('dateCreated')}
            >
              Time
              {tradeSortField === 'dateCreated' && (
                <span className={`detail-trades-sort-arrow ${tradeSortDirection}`}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M5 7L2 3H8L5 7Z" />
                  </svg>
                </span>
              )}
            </div>

            <div className="detail-trades-header-cell">Account</div>

            <div className="detail-trades-header-cell">Type</div>

            <div className="detail-trades-header-cell">Token</div>

            <div
              className={`detail-trades-header-cell sortable ${tradeSortField === 'amount' ? 'active' : ''}`}
              onClick={() => handleTradeSort('amount')}
            >
              Amount
              {tradeSortField === 'amount' && (
                <span className={`detail-trades-sort-arrow ${tradeSortDirection}`}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M5 7L2 3H8L5 7Z" />
                  </svg>
                </span>
              )}
            </div>

            <div
              className={`detail-trades-header-cell sortable ${tradeSortField === 'marketCap' ? 'active' : ''}`}
              onClick={() => handleTradeSort('marketCap')}
            >
              Market Cap
              {tradeSortField === 'marketCap' && (
                <span className={`detail-trades-sort-arrow ${tradeSortDirection}`}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M5 7L2 3H8L5 7Z" />
                  </svg>
                </span>
              )}
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
                      <div style={{
                        width: 24, height: 24, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--c-border)', fontSize: 12
                      }}>
                        {trade.emoji}
                      </div>
                    </div>
                    <span className="detail-trades-address">
                      {trade.walletName}
                    </span>
                  </div>

                  <div className="detail-trades-col">
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
                      {trade.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </span>
                  </div>

                  <div className="detail-trades-col">
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
    const filteredTokens = getFilteredMonitorTokens();

    const toggleTokenExpanded = (tokenId: string) => {
      setExpandedTokens(prev => {
        const newSet = new Set(prev);
        if (newSet.has(tokenId)) {
          newSet.delete(tokenId);
        } else {
          newSet.add(tokenId);
        }
        return newSet;
      });
    };

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

    return (
      <div className="tracker-monitor">
        {filteredTokens.length === 0 ? (
          <div className="tracker-empty-state">
            <div className="tracker-empty-content">
              <h4>No Tracked Tokens</h4>
              <p>Track tokens to monitor their performance and trading activity.</p>
            </div>
          </div>
        ) : (
          <div className="tracker-monitor-grid">
            {filteredTokens.map((token) => {
              const isExpanded = expandedTokens.has(token.id);
              const totalBought = token.trades.reduce((sum, t) => sum + t.bought, 0);
              const totalSold = token.trades.reduce((sum, t) => sum + t.sold, 0);
              const totalBuys = token.trades.reduce((sum, t) => sum + t.boughtTxns, 0);
              const totalSells = token.trades.reduce((sum, t) => sum + t.soldTxns, 0);

              return (
                <div key={token.id} className="tracker-monitor-card">
                  <div 
                    className="tracker-monitor-card-header"
                    onClick={() => toggleTokenExpanded(token.id)}
                  >
                    <div className="tracker-monitor-card-row">
                      {/* Top Row: Token Info */}
                      <div className="tracker-monitor-card-top">
                        <div
                          className="tracker-monitor-icon-container"
                          style={{ '--progress': token.bondingCurveProgress } as React.CSSProperties}
                        >
                          <div className="tracker-monitor-icon-spacer">
                            <span className="tracker-monitor-icon-emoji">{token.emoji}</span>
                          </div>
                        </div>

                        <div className="tracker-monitor-token-details">
                          <div className="tracker-monitor-token-name-row">
                            <span className="tracker-monitor-token-name-text">{token.name}</span>
                            <button 
                              className="tracker-monitor-copy-btn" 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(token.tokenAddress);
                              }}
                              title="Copy Address"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                              </svg>
                            </button>
                            <button className="tracker-monitor-action-btn" onClick={(e) => e.stopPropagation()}>☆</button>
                          </div>
                          <div className="tracker-monitor-token-subtitle">
                            <span className="tracker-monitor-token-symbol">{token.symbol}</span>
                            <span className="tracker-monitor-token-ca">
                              {token.tokenAddress.slice(0, 6)}...{token.tokenAddress.slice(-4)}
                            </span>
                            <span className="tracker-monitor-token-age">
                              {getTimeAgo(token.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="tracker-monitor-quickbuy-section">
                          <button
                            className="tracker-monitor-quickbuy-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle quick buy
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

                      {/* Bottom: Stats & Buy/Sell */}
                      <div className="tracker-monitor-card-bottom">
                        <div className="tracker-monitor-stats-section">
                          <div className="tracker-monitor-stat-compact">
                            <span className="stat-label">H</span>
                            <span className="stat-value">{token.holders}</span>
                          </div>

                          <div className="tracker-monitor-stat-compact">
                            <span className="stat-label">MC</span>
                            <span className="stat-value">
                              {monitorCurrency === 'USD' ? '$' : '≡'}
                              {formatCompact(toDisplay(token.marketCap, monitorCurrency, monUsdPrice))}
                            </span>
                          </div>

                          <div className="tracker-monitor-stat-compact">
                            <span className="stat-label">L</span>
                            <span className="stat-value">
                              {monitorCurrency === 'USD' ? '$' : '≡'}
                              {formatValue(token.liquidity)}
                            </span>
                          </div>

                          <div className="tracker-monitor-stat-compact">
                            <span className="stat-label">TX</span>
                            <span className="stat-value">{token.txCount}</span>
                          </div>
                        </div>

                        <div className="tracker-monitor-buy-sell-row">
                          <div className="tracker-monitor-buy-sell-left">
                            <div className="tracker-monitor-buy-amount">
                              <span>{totalBuys}</span>
                              <img src={monadicon} className="tracker-monitor-amount-icon" alt="MON" />
                              <span className={isBlurred ? 'blurred' : ''}>{formatValue(totalBought)}</span>
                            </div>

                            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>

                            <div className="tracker-monitor-sell-amount">
                              <span>{totalSells}</span>
                              <img src={monadicon} className="tracker-monitor-amount-icon" alt="MON" />
                              <span className={isBlurred ? 'blurred' : ''}>{formatValue(totalSold)}</span>
                            </div>
                          </div>

                          <div className="tracker-monitor-progress-section">
                            <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,0.5)' }}>
                              Last TX {getTimeAgo(token.lastTransaction || 0)}
                            </span>
                            <div className="tracker-monitor-progress-bar-inline">
                              <div 
                                className="tracker-monitor-progress-fill-inline"
                                style={{ width: `${token.bondingCurveProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && token.trades.length > 0 && (
                    <div className="tracker-monitor-trades-expanded">
                      {/* trades content remains the same */}
                    </div>
                  )}
                </div>
              );

            })}
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

    // Get token count for this wallet
    const getWalletTokenCount = (address: string) => {
      const balances = walletTokenBalances[address];
      if (!balances) return 0;

      const ethAddress = chainCfg?.eth;
      let count = 0;

      for (const [tokenAddr, balance] of Object.entries(balances)) {
        if (tokenAddr !== ethAddress && balance && BigInt(balance.toString()) > 0n) {
          count++;
        }
      }

      return count;
    };

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

        <div style={{ width: '30px' }}></div>

        <div className="tracker-wallet-drag-handle">
          <Tooltip content="Drag to reorder wallet">
            <img src={circle} className="tracker-drag-handle-icon" alt="Drag" />
          </Tooltip>
        </div>

        <div className="tracker-wallet-profile">
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
          </div>
        </div>

        <div className="tracker-wallet-balance">
          <img src={monadicon} className="tracker-balance-icon" alt="MON" />
          <span className={isBlurred ? 'blurred' : ''}>
            {(() => {
              const b = walletTokenBalances[wallet.address];
              const ethToken = chainCfg?.eth;

              if (b && ethToken) {
                const bal = Number(b[ethToken] || 0) / 1e18;
                return bal > 0
                  ? (bal / DISPLAY_SCALE).toFixed(2)
                  : '0.00';
              }
              return wallet.balance.toFixed(2);
            })()}
          </span>
        </div>

        <div className="tracker-wallet-last-active">
          <div className="tracker-wallet-token-count">
            <div className="tracker-wallet-token-structure-icons">
              <div className="token1"></div>
              <div className="token2"></div>
              <div className="token3"></div>
            </div>
            <span className="tracker-wallet-total-tokens">{getWalletTokenCount(wallet.address)}</span>
          </div>
        </div>  

        <div className="tracker-wallet-actions">
          <Tooltip content="Export Private Key">
            <button 
              className="tracker-action-button"
              onClick={(e) => {
                e.stopPropagation();
                handleExportPrivateKey(wallet.address);
              }}
            >
              <img src={key} className="tracker-action-icon" alt="Export Key" />
            </button>
          </Tooltip>

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
            <div style={{ display: 'flex' }}>
              <button className="tracker-header-button flash-button">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </button>
              <div className="tracker-header-button counter-button">
                <div className="tracker-counter-wrapper">
                  <input
                    type="text"
                    className="tracker-counter-input"
                    placeholder="0.0"
                    onFocus={(e) => e.target.placeholder = ''}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        e.target.placeholder = '0.0';
                      }
                    }}
                  />
                </div>
              </div>
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
            <div style={{ display: 'flex' }}>
              <button className="tracker-header-button flash-button" onClick={() => setpopup(33)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </button>
              <div className="tracker-header-button counter-button">
                <div className="tracker-counter-wrapper">
                  <input
                    type="text"
                    className="tracker-counter-input"
                    placeholder="0.0"
                    onFocus={(e) => e.target.placeholder = ''}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        e.target.placeholder = '0.0';
                      }
                    }}
                  />
                </div>
              </div>
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
                <input
                  type="text"
                  className="tracker-input"
                  value={newWalletName}
                  onChange={(e) => {
                    setNewWalletName(e.target.value);
                    setAddWalletError('');
                  }}
                  placeholder="Enter a name for this wallet"
                  maxLength={20}
                />
              </div>

              <div className="tracker-input-section">
                <label className="tracker-label">Emoji:</label>
                <div className="tracker-emoji-grid">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      className={`tracker-emoji-option ${newWalletEmoji === emoji ? 'selected' : ''}`}
                      onClick={() => setNewWalletEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
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

      {showFiltersPopup && (
        <LiveTradesFiltersPopup
          onClose={() => setShowFiltersPopup(false)}
          onApply={handleApplyFilters}
          initialFilters={activeFilters}
        />
      )}

      {showDeleteConfirmation && (
        <div className="tracker-modal-backdrop" onClick={() => setShowDeleteConfirmation(false)}>
          <div className="tracker-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="tracker-modal-header">
              <h3 className="tracker-modal-title">Delete Wallet</h3>
              <button className="tracker-modal-close" onClick={() => setShowDeleteConfirmation(false)}>
                <img src={closebutton} className="close-button-icon" />
              </button>
            </div>
            <div className="tracker-modal-content">
              <div className="tracker-delete-warning">
                <p>Are you sure you want to remove this wallet from tracking?</p>
                <p>This action cannot be undone.</p>
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