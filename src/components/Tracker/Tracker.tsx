import { Search, Edit2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import copy from '../../assets/copy.svg'
import closebutton from '../../assets/close_button.png'
import monadicon from '../../assets/monadlogo.svg';
import trash from '../../assets/trash.svg';
import { settings } from '../../settings';
import { fetchPortfolio, type GqlPosition } from './portfolioGql';
import { createPublicClient, http } from 'viem';
import ImportWalletsPopup from './ImportWalletsPopup';
import LiveTradesFiltersPopup from './LiveTradesFiltersPopup/LiveTradesFiltersPopup';
import EmojiPicker from 'emoji-picker-react';
import { useSharedContext } from '../../contexts/SharedContext';
import MonitorFiltersPopup, { MonitorFilterState } from './MonitorFiltersPopup/MonitorFiltersPopup';
import settingsicon from '../../assets/settings.svg';
import circle from '../../assets/circle_handle.png';
import lightning from '../../assets/flash.png';
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
  lastActiveAt: number | null; 
  id: string;
  createdAt: string;
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
      amount: nativeAmount,
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
  const [pinnedTokens, setPinnedTokens] = useState<Set<string>>(new Set());

  const txFromCacheRef = useRef(new Map<string, string>());

  const trackedSetRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    trackedSetRef.current = new Set(trackedWallets.map(w => w.address.toLowerCase()));
  }, [trackedWallets]);

  const push = useCallback((logs: any[], source: 'router' | 'market' | 'launchpad') => {
    if (!logs?.length) return;
    if (demoMode.trades) { disableDemo('trades'); setTrackedWalletTrades([]); }
    lastEventTsRef.current = Date.now();
    setStatus({ lastPushSource: source });

    const lower = (s?: string) => (s || '').toLowerCase();
    const wallets = trackedWalletsRef.current;
    const touchWallet = (addr: string) => {
      const key = lower(addr);
      if (!trackedSetRef.current.has(key)) return;
      setTrackedWallets(prev => prev.map(x => lower(x.address) === key ? { ...x, lastActiveAt: Date.now() } : x));
    };
    const pc = getRpcPublicClient(chainCfgOf(activechain));

    setTrackedWalletTrades(prev => {
      const next: LiveTrade[] = [...prev];
      for (const l of logs) {
        const args: any = l?.args ?? {};
        const txHash: string = l?.transactionHash ?? l?.transaction?.id ?? l?.id;
        let accountAddr: string | null = (args.account || args.trader || args.sender || args.owner || args.from) ?? null;
        if (!accountAddr && txHash && pc) pc.getTransaction({ hash: txHash as `0x${string}` }).then(tx => { if (tx?.from && trackedSetRef.current.has(lower(tx.from))) touchWallet(tx.from); }).catch(()=>{});
        if (accountAddr) touchWallet(accountAddr);
        const isBuy = Boolean(args.isBuy ?? args.buy ?? (args.from && !args.to));
        const amountIn = Number(args.amountIn ?? 0n) / 1e18;
        const amountOut = Number(args.amountOut ?? 0n) / 1e18;
        const priceWad = Number(args.priceNativePerTokenWad ?? args.price ?? 0n) / 1e18;
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
      const seen = new Set<string>(), out: LiveTrade[] = [];
      for (const t of next) if (!seen.has(t.id)) { seen.add(t.id); out.push(t); }
      return out.slice(0, 500);
    });
  }, [normalizeTrade, activechain, demoMode.trades]);



  useEffect(() => {
    const cfg = chainCfgOf(activechain);
    if (!cfg?.id || !cfg?.rpcUrl) {
      dlog('WATCHERS skipped: invalid chain cfg', cfg);
      return;
    }

    const unsubs: Array<() => void> = [];
    const common = { poll: true as const, chainId: cfg.id };

    try {
      if (cfg?.router) {
        unsubs.push(watchContractEvent(config, {
          address: cfg.router as `0x${string}`,
          abi: CrystalRouterAbi,
          eventName: 'Trade' as any,
          onLogs: (logs) => push(logs, 'router'),
          ...common,
        }));
      }
      if (cfg?.market) {
        unsubs.push(watchContractEvent(config, {
          address: cfg.market as `0x${string}`,
          abi: CrystalMarketAbi,
          eventName: 'Trade' as any,
          onLogs: (logs) => push(logs, 'market'),
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
      dlog('WATCHERS error', err);
    }

    return () => { try { unsubs.forEach(u => u?.()); } catch {} };
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
      const bal = new Map<string, number>();
      results.forEach((w, i) => {
        if (!w) return;
        bal.set(addrs[i].toLowerCase(), toMon(Number(w.nativeBalance)));
        pos[addrs[i]] = w.positions || [];
      });
      setTrackedWallets(prev => prev.map(w => bal.has(w.address.toLowerCase()) ? { ...w, balance: bal.get(w.address.toLowerCase())! } : w));
      setAddressPositions(prev => ({ ...prev, ...pos }));
    };
    run();
    const id = setInterval(run, MONITOR_POLL_MS);
    return () => { stop = true; clearInterval(id); };
  }, [JSON.stringify(trackedWallets.map(w => w.address))]);









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

  

  const [monitorTokens, setMonitorTokens] = useState<MonitorToken[]>(
    demoMode.monitor ? DEMO_MONITOR_TOKENS : []
  );
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

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [allEmojis] = useState([
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌',
    '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
    '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢',
    '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔',
    '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤',
    '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺',
    '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀',
    '😿', '😾', '🚀', '💎', '🔥', '⚡', '💰', '🎯', '👑', '🦄', '🐋', '🐸', '🤖', '👻', '🎪'
  ]);

  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

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
        // newer activity first when 'desc'
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

    // Sort pinned tokens to the top
    const pinned = tokens.filter(t => pinnedTokens.has(t.id));
    const unpinned = tokens.filter(t => !pinnedTokens.has(t.id));
    
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
      const imported = JSON.parse(walletsText);
      if (!Array.isArray(imported)) return;
      const nowTag = Date.now().toString();
      const toAdd = imported
        .filter((it:any) => it?.trackedWalletAddress && !trackedWallets.some(w => w.address.toLowerCase() === it.trackedWalletAddress.toLowerCase()))
        .map((it:any,i:number) => ({ id: `${nowTag}_${i}_${Math.random().toString(36).slice(2)}`, address: it.trackedWalletAddress, name: String(it.name || 'Imported Wallet').slice(0,20), emoji: it.emoji || '👻', balance: 0, lastActiveAt: null, createdAt: new Date().toISOString() })) as TrackedWallet[];
      if (!toAdd.length) return;
      setTrackedWallets(prev => demoMode.wallets ? toAdd : [...prev, ...toAdd]);
      if (demoMode.wallets) disableDemo('wallets');
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
  // helper to format lastActiveAt → label
  const lastActiveLabel = (w: TrackedWallet) => {
    const ts = w.lastActiveAt ?? new Date(w.createdAt).getTime();
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  // re-render every 30s so the label updates
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
    if (!cfg?.id || !cfg?.rpcUrl) { dlog('BALANCE_QUERY skipped: invalid chain cfg for', activechain, cfg); return; }
    const pc = getRpcPublicClient(cfg);
    if (!pc) return;
    let ignore = false;
    const addresses = trackedWallets.map(w => w.address);
    dlog('BALANCE_QUERY start', { activechain, chainId: cfg.id, count: addresses.length, addresses });
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

  useEffect(() => {
    if (!demoMode.trades && trackedWalletTradesRef.current === DEMO_TRADES) setTrackedWalletTrades([]);
    setStatus();
  }, [demoMode.trades]);

  const ingestExternalTrades = (items: any[]) => {
    if (demoMode.trades) { disableDemo('trades'); setTrackedWalletTrades([]); }
    const wallets = trackedWalletsRef.current;
    setTrackedWalletTrades(prev => {
      const next = [...items.map(x => normalizeTrade(x, wallets)), ...prev];
      const seen = new Set<string>(), out: LiveTrade[] = [];
      for (const t of next) if (!seen.has(t.id)) { seen.add(t.id); out.push(t); }
      return out.slice(0,500);
    });
    lastEventTsRef.current = Date.now();
    setStatus({ lastPushSource: 'external' });
  };




  

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
              style={{minWidth: '120px', width: '120px'}}
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

                  <div className="detail-trades-col"  style={{minWidth: '100px', width: '100px'}}>
                    {trade.token}
                  </div>

                  <div className="detail-trades-col" style={{minWidth: '100px', width: '100px'}}>
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
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="tracker-monitor-card-top">
                      <div className="tracker-monitor-left-section">
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
                            <div className="tracker-monitor-address-copy-group">
                              <span className="tracker-monitor-token-ca">
                                {token.tokenAddress.slice(0, 6)}...{token.tokenAddress.slice(-4)}
                              </span>
                              <img
                                src={copy}
                                className="tracker-monitor-copy-icon"
                                alt="Copy"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(token.tokenAddress);
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                            </div>
                            <button 
                              className={`tracker-monitor-action-btn ${pinnedTokens.has(token.id) ? 'pinned' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPinnedTokens(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(token.id)) {
                                    newSet.delete(token.id);
                                  } else {
                                    newSet.add(token.id);
                                  }
                                  return newSet;
                                });
                              }}
                            >
                              {pinnedTokens.has(token.id) ? '★' : '☆'}
                            </button>
                          </div>
                          <div className="tracker-monitor-token-subtitle">
                            <span className="tracker-monitor-token-symbol">{token.symbol}</span>
                            <span className="tracker-monitor-token-age">{getTimeAgo(token.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="tracker-monitor-right-section">
                        <div className="tracker-monitor-buy-sell-row">
                          <div className="tracker-monitor-buy-amount">...</div>
                          <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
                          <div className="tracker-monitor-sell-amount">...</div>
                        </div>

                        <div className="tracker-monitor-quickbuy-section">
                          <button
                            className="tracker-monitor-quickbuy-btn"
                            onClick={(e) => {
                              e.stopPropagation(); // PREVENT triggering expand/collapse
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
                    </div>

                    <div className="tracker-monitor-stats-section">
                      <div className="tracker-monitor-stat-compact">
                        <span className="stat-label">H</span>
                        <span className="stat-value">{token.holders}</span>
                      </div>
                      <div className="tracker-monitor-stat-compact">
                        <span className="stat-label">MC</span>
                        <span className={`stat-value ${monitorCurrency === 'MON' ? 'tracker-monitor-stat-value-with-icon' : ''}`}>
                          {monitorCurrency === 'USD' ? (
                            <>$<span>{formatCompact(toDisplay(token.marketCap, monitorCurrency, monUsdPrice))}</span></>
                          ) : (
                            <>
                              <span>{formatCompact(toDisplay(token.marketCap, monitorCurrency, monUsdPrice))}</span>
                              <img src={monadicon} style={{ width: '10px', height: '10px' }} alt="MON" />
                            </>
                          )}
                        </span>
                      </div>
                      <div className="tracker-monitor-stat-compact">
                        <span className="stat-label">L</span>
                        <span className="stat-value">
                          {monitorCurrency === 'USD' ? (
                            <>
                              $<span>{formatValue(token.liquidity)}</span>
                            </>
                          ) : (
                            <>
                              <span>{formatValue(token.liquidity)}</span>
                              <img src={monadicon} style={{ width: '10px', height: '10px' }} alt="MON" />
                            </>
                          )}
                        </span>
                      </div>
                      <div className="tracker-monitor-stat-compact">
                        <span className="stat-label">TX</span>
                        <span className="stat-value">{token.txCount}</span>
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

                  {isExpanded && token.trades.length > 0 && (
                    <div className="tracker-monitor-trades-expanded">
                      <div className="tracker-monitor-trades-table-header">
                        <div className="header-cell">Wallet</div>
                        <div className="header-cell">Time in Trade</div>
                        <div className="header-cell">Bought</div>
                        <div className="header-cell">Sold</div>
                        <div className="header-cell">PNL</div>
                        <div className="header-cell">Remaining</div>
                      </div>
                      {token.trades.map((trade) => (
                        <div key={trade.id} className="tracker-monitor-trade-row-expanded">
                          <div className="trade-wallet-col">
                            <span className="trade-emoji">{trade.emoji}</span>
                            <span className="trade-wallet-name">{trade.wallet}</span>
                          </div>
                          <div className="trade-time-col">
                            {trade.exitStatus && (
                              <span className="exit-badge">{trade.exitStatus}</span>
                            )}
                            <span className="time-text">{trade.timeInTrade}</span>
                          </div>
                          <div className="trade-bought-col">
                            <div className="trade-amount-with-icon">
                              <span className="amount">{trade.bought.toFixed(3)}</span>
                              {monitorCurrency === 'MON' && (
                                <img src={monadicon} style={{ width: '10px', height: '10px' }} alt="MON" />
                              )}
                            </div>
                            <span className="txns-text">{trade.boughtTxns} txns</span>
                          </div>
                          <div className="trade-sold-col">
                            <div className="trade-amount-with-icon">
                              <span className="amount">{trade.sold.toFixed(3)}</span>
                              {monitorCurrency === 'MON' && (
                                <img src={monadicon} style={{ width: '10px', height: '10px' }} alt="MON" />
                              )}
                            </div>
                            <span className="txns-text">{trade.soldTxns} txns</span>
                          </div>
                          <div className={`trade-pnl-col ${trade.pnl >= 0 ? 'positive' : 'negative'} trade-pnl-with-icon`}>
                            <span>{trade.pnl >= 0 && '+'}{trade.pnl.toFixed(3)}</span>
                            {monitorCurrency === 'MON' && (
                              <img src={monadicon} style={{ width: '10px', height: '10px' }} alt="MON" />
                            )}
                          </div>
                          <div className="trade-remaining-col trade-remaining-with-icon">
                            <span>{trade.remaining.toFixed(3)}</span>
                            {monitorCurrency === 'MON' && (
                              <img src={monadicon} style={{ width: '10px', height: '10px' }} alt="MON" />
                            )}
                          </div>
                        </div>
                      ))}
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