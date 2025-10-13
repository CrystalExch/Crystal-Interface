import { Search, Edit2, Plus } from 'lucide-react';
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
import key from '../../assets/key.svg';
import {
  WALLET_BALANCE_QUERY,
  WALLET_TRADES_QUERY,
  TOKEN_METRICS_QUERY,
  TRACKED_TOKENS_QUERY
} from './TrackerQueries';

import './Tracker.css';

const SUBGRAPH_URL = 'https://gateway.thegraph.com/api/b9cc5f58f8ad5399b2c4dd27fa52d881/subgraphs/id/BJKD3ViFyTeyamKBzC1wS7a3XMuQijvBehgNaSBb197e';
const STORAGE_KEY = 'tracked_wallets_data';

// Helper functions for localStorage
const saveWalletsToStorage = (wallets: TrackedWallet[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
  } catch (error) {
    console.error('Failed to save wallets to localStorage:', error);
  }
};

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
  const context = useSharedContext();
  const activechain = context?.activechain || 'monad';
  const [walletSortField, setWalletSortField] = useState<'balance' | 'lastActive' | null>(null);
  const [walletSortDirection, setWalletSortDirection] = useState<SortDirection>('desc');
  const [showMonitorFiltersPopup, setShowMonitorFiltersPopup] = useState(false);
  const [trackedWalletTrades, setTrackedWalletTrades] = useState<LiveTrade[]>([]);
  // Hardcoded example data for testing
  const exampleWallets: TrackedWallet[] = [
    {
      id: '1',
      address: '0x1234567890123456789012345678901234567890',
      name: 'Whale Watcher',
      emoji: '🐋',
      balance: 1250.50,
      lastActive: '5m'
    },
    {
      id: '2',
      address: '0x2345678901234567890123456789012345678901',
      name: 'Diamond Hands',
      emoji: '💎',
      balance: 850.25,
      lastActive: '15m'
    },
    {
      id: '3',
      address: '0x3456789012345678901234567890123456789012',
      name: 'Moon Boy',
      emoji: '🚀',
      balance: 2100.75,
      lastActive: '1h'
    },
    {
      id: '4',
      address: '0x4567890123456789012345678901234567890123',
      name: 'Paper Hands',
      emoji: '🧻',
      balance: 420.00,
      lastActive: '3h'
    },
    {
      id: '5',
      address: '0x5678901234567890123456789012345678901234',
      name: 'Degen Trader',
      emoji: '🎰',
      balance: 690.50,
      lastActive: '5h'
    }
  ];

  const exampleTrades: LiveTrade[] = [
    {
      id: 'trade1',
      walletName: 'Whale Watcher',
      emoji: '🐋',
      token: 'PEPE',
      amount: 1.5,
      marketCap: 45000,
      time: '2m',
      txHash: '0xabc123',
      type: 'buy',
      createdAt: new Date(Date.now() - 120000).toISOString()
    },
    {
      id: 'trade2',
      walletName: 'Diamond Hands',
      emoji: '💎',
      token: 'WOJAK',
      amount: 0.8,
      marketCap: 12000,
      time: '5m',
      txHash: '0xdef456',
      type: 'sell',
      createdAt: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: 'trade3',
      walletName: 'Moon Boy',
      emoji: '🚀',
      token: 'DOGE',
      amount: 2.5,
      marketCap: 85000,
      time: '8m',
      txHash: '0xghi789',
      type: 'buy',
      createdAt: new Date(Date.now() - 480000).toISOString()
    },
    {
      id: 'trade4',
      walletName: 'Paper Hands',
      emoji: '🧻',
      token: 'SHIB',
      amount: 0.3,
      marketCap: 28000,
      time: '12m',
      txHash: '0xjkl012',
      type: 'sell',
      createdAt: new Date(Date.now() - 720000).toISOString()
    },
    {
      id: 'trade5',
      walletName: 'Degen Trader',
      emoji: '🎰',
      token: 'FLOKI',
      amount: 1.2,
      marketCap: 35000,
      time: '18m',
      txHash: '0xmno345',
      type: 'buy',
      createdAt: new Date(Date.now() - 1080000).toISOString()
    },
    {
      id: 'trade6',
      walletName: 'Whale Watcher',
      emoji: '🐋',
      token: 'BONK',
      amount: 3.5,
      marketCap: 52000,
      time: '25m',
      txHash: '0xpqr678',
      type: 'buy',
      createdAt: new Date(Date.now() - 1500000).toISOString()
    },
    {
      id: 'trade7',
      walletName: 'Moon Boy',
      emoji: '🚀',
      token: 'WIF',
      amount: 0.9,
      marketCap: 19000,
      time: '32m',
      txHash: '0xstu901',
      type: 'sell',
      createdAt: new Date(Date.now() - 1920000).toISOString()
    },
    {
      id: 'trade8',
      walletName: 'Diamond Hands',
      emoji: '💎',
      token: 'TURBO',
      amount: 1.8,
      marketCap: 41000,
      time: '45m',
      txHash: '0xvwx234',
      type: 'buy',
      createdAt: new Date(Date.now() - 2700000).toISOString()
    }
  ];

  const exampleMonitorTokens: MonitorToken[] = [
    {
      id: '0x1111',
      tokenAddress: '0x1111111111111111111111111111111111111111',
      name: 'PepeToken',
      symbol: 'PEPE',
      emoji: '🐸',
      price: 0.0000125,
      marketCap: 45000,
      change24h: 15.5,
      volume24h: 8500,
      liquidity: 12000,
      holders: 2450,
      buyTransactions: 1250,
      sellTransactions: 980,
      bondingCurveProgress: 65,
      txCount: 2230,
      volume5m: 450,
      volume1h: 1200,
      volume6h: 4500,
      priceChange5m: 2.5,
      priceChange1h: 5.2,
      priceChange6h: 12.8,
      priceChange24h: 15.5,
      website: '',
      twitter: '',
      telegram: '',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      lastTransaction: new Date(Date.now() - 120000).toISOString(),
      trades: [
        {
          id: 'trade-pepe-1',
          wallet: 'Whale Watcher',
          emoji: '🐋',
          timeInTrade: '2h',
          bought: 5000,
          boughtTxns: 3,
          sold: 2000,
          soldTxns: 1,
          pnl: 1500,
          remaining: 3500
        },
        {
          id: 'trade-pepe-2',
          wallet: 'Diamond Hands',
          emoji: '💎',
          timeInTrade: '1h',
          bought: 3000,
          boughtTxns: 2,
          sold: 0,
          soldTxns: 0,
          pnl: 800,
          remaining: 3800
        }
      ]
    },
    {
      id: '0x2222',
      tokenAddress: '0x2222222222222222222222222222222222222222',
      name: 'DogeKing',
      symbol: 'DOGE',
      emoji: '🐕',
      price: 0.000095,
      marketCap: 85000,
      change24h: -8.2,
      volume24h: 15000,
      liquidity: 22000,
      holders: 4200,
      buyTransactions: 2100,
      sellTransactions: 2450,
      bondingCurveProgress: 82,
      txCount: 4550,
      volume5m: 850,
      volume1h: 2200,
      volume6h: 7500,
      priceChange5m: -1.2,
      priceChange1h: -3.5,
      priceChange6h: -5.8,
      priceChange24h: -8.2,
      website: '',
      twitter: '',
      telegram: '',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      lastTransaction: new Date(Date.now() - 180000).toISOString(),
      trades: [
        {
          id: 'trade-doge-1',
          wallet: 'Moon Boy',
          emoji: '🚀',
          timeInTrade: '4h',
          bought: 8000,
          boughtTxns: 5,
          sold: 3000,
          soldTxns: 2,
          pnl: -500,
          remaining: 4500
        },
        {
          id: 'trade-doge-2',
          wallet: 'Paper Hands',
          emoji: '🧻',
          timeInTrade: '3h',
          exitStatus: 'Exited',
          bought: 2000,
          boughtTxns: 1,
          sold: 2200,
          soldTxns: 2,
          pnl: 200,
          remaining: 0
        }
      ]
    },
    {
      id: '0x3333',
      tokenAddress: '0x3333333333333333333333333333333333333333',
      name: 'ShibaRocket',
      symbol: 'SHIB',
      emoji: '🦊',
      price: 0.000032,
      marketCap: 28000,
      change24h: 22.8,
      volume24h: 6200,
      liquidity: 8500,
      holders: 1850,
      buyTransactions: 980,
      sellTransactions: 650,
      bondingCurveProgress: 45,
      txCount: 1630,
      volume5m: 320,
      volume1h: 980,
      volume6h: 3100,
      priceChange5m: 3.8,
      priceChange1h: 8.5,
      priceChange6h: 18.2,
      priceChange24h: 22.8,
      website: '',
      twitter: '',
      telegram: '',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      lastTransaction: new Date(Date.now() - 90000).toISOString(),
      trades: [
        {
          id: 'trade-shib-1',
          wallet: 'Degen Trader',
          emoji: '🎰',
          timeInTrade: '1h',
          bought: 4000,
          boughtTxns: 3,
          sold: 1500,
          soldTxns: 1,
          pnl: 800,
          remaining: 3300
        }
      ]
    },
    {
      id: '0x4444',
      tokenAddress: '0x4444444444444444444444444444444444444444',
      name: 'FlokiMoon',
      symbol: 'FLOKI',
      emoji: '🌙',
      price: 0.000048,
      marketCap: 35000,
      change24h: 5.3,
      volume24h: 9800,
      liquidity: 11500,
      holders: 2980,
      buyTransactions: 1520,
      sellTransactions: 1280,
      bondingCurveProgress: 58,
      txCount: 2800,
      volume5m: 520,
      volume1h: 1450,
      volume6h: 5200,
      priceChange5m: 1.2,
      priceChange1h: 2.8,
      priceChange6h: 4.5,
      priceChange24h: 5.3,
      website: '',
      twitter: '',
      telegram: '',
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      lastTransaction: new Date(Date.now() - 240000).toISOString(),
      trades: [
        {
          id: 'trade-floki-1',
          wallet: 'Whale Watcher',
          emoji: '🐋',
          timeInTrade: '3h',
          bought: 6000,
          boughtTxns: 4,
          sold: 2500,
          soldTxns: 2,
          pnl: 1200,
          remaining: 4700
        },
        {
          id: 'trade-floki-2',
          wallet: 'Moon Boy',
          emoji: '🚀',
          timeInTrade: '2h',
          bought: 3500,
          boughtTxns: 2,
          sold: 1000,
          soldTxns: 1,
          pnl: 400,
          remaining: 2900
        }
      ]
    }
  ];

  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>(() => {
    const stored = loadWalletsFromStorage();
    // If no stored wallets, use example data
    return stored.length > 0 ? stored : exampleWallets;
  });
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

  // Save wallets to localStorage whenever they change
  useEffect(() => {
    saveWalletsToStorage(trackedWallets);
  }, [trackedWallets]);

  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  useEffect(() => {
    if (trackedWallets.length === 0) {
      setTrackedWalletTrades([]);
      return;
    }

    // Use example data initially for testing
    if (trackedWallets.some(w => exampleWallets.find(ew => ew.id === w.id))) {
      setTrackedWalletTrades(exampleTrades);
    }

    let cancelled = false;
    let batchNumber = 0;

    const fetchTrackedWalletTrades = async () => {
      try {
        const walletAddresses = trackedWallets.map(w => w.address.toLowerCase());
        const BATCH_SIZE = 100;
        const allTrades: any[] = [];

        while (true) {
          const data = await fetchSubgraphData(WALLET_TRADES_QUERY, {
            accounts: walletAddresses,
            first: BATCH_SIZE,
            skip: batchNumber * BATCH_SIZE
          });

          if (!data?.trades || data.trades.length === 0) break;
          
          allTrades.push(...data.trades);
          
          if (data.trades.length < BATCH_SIZE) break;
          batchNumber++;
        }

        if (cancelled) return;

        const mapped: LiveTrade[] = allTrades.map((trade: any) => {
          const trackedWallet = trackedWallets.find(
            w => w.address.toLowerCase() === trade.account.id.toLowerCase()
          );

          const isBuy = !!trade.isBuy;
          const nativeAmount = Number(isBuy ? trade.amountIn : trade.amountOut) / 1e18;
          const price = Number(trade.priceNativePerTokenWad) / 1e18;

          const TOTAL_SUPPLY = 1e9;
          const marketCap = price * TOTAL_SUPPLY;

          const timestamp = Number(trade.timestamp || trade.block * 2);
          const now = Date.now() / 1000;
          const secondsAgo = Math.max(0, now - timestamp);

          let timeAgo = 'now';
          if (secondsAgo < 60) {
            timeAgo = `${Math.floor(secondsAgo)}s`;
          } else if (secondsAgo < 3600) {
            timeAgo = `${Math.floor(secondsAgo / 60)}m`;
          } else if (secondsAgo < 86400) {
            timeAgo = `${Math.floor(secondsAgo / 3600)}h`;
          } else {
            timeAgo = `${Math.floor(secondsAgo / 86400)}d`;
          }

          return {
            id: trade.id,
            walletName: trackedWallet?.name || 'Unknown',
            emoji: trackedWallet?.emoji || '👻',
            token: trade.token?.symbol || 'Unknown',
            amount: nativeAmount,
            marketCap: marketCap / 1000,
            time: timeAgo,
            txHash: trade.transaction?.id || trade.id,
            type: isBuy ? 'buy' : 'sell',
            createdAt: new Date(timestamp * 1000).toISOString()
          };
        });

        mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (!cancelled) {
          setTrackedWalletTrades(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch tracked wallet trades:', error);
        if (!cancelled) {
          setTrackedWalletTrades([]);
        }
      }
    };

    fetchTrackedWalletTrades();
    const interval = setInterval(fetchTrackedWalletTrades, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [trackedWallets]);

  useEffect(() => {
    if (activeTab !== 'monitor' || trackedWallets.length === 0) return;

    // Use example data initially for testing
    if (trackedWallets.some(w => exampleWallets.find(ew => ew.id === w.id))) {
      setMonitorTokens(exampleMonitorTokens);
      setIsLoadingMonitor(false);
    }

    let cancelled = false;

    const fetchMonitorTokens = async () => {
      try {
        setIsLoadingMonitor(true);
        const walletAddresses = trackedWallets.map(w => w.address.toLowerCase());

        const data = await fetchSubgraphData(TRACKED_TOKENS_QUERY, {
          accounts: walletAddresses
        });

        if (cancelled || !data?.launchpadPositions) return;

        const tokenMap = new Map<string, any>();

        data.launchpadPositions.forEach((position: any) => {
          const token = position.token;
          if (!token) return;

          if (!tokenMap.has(token.id)) {
            tokenMap.set(token.id, {
              token,
              walletPositions: []
            });
          }

          tokenMap.get(token.id).walletPositions.push({
            wallet: trackedWallets.find(w => w.address.toLowerCase() === position.account.id.toLowerCase()),
            position
          });
        });

        const processedTokens: MonitorToken[] = Array.from(tokenMap.values()).map(({ token, walletPositions }) => {
          const lastTrade = token.trades?.[0];
          const price = lastTrade 
            ? Number(lastTrade.priceNativePerTokenWad) / 1e18 
            : 0;

          const totalSupply = 1e9;
          const marketCap = price * totalSupply;

          const targetRaise = Number(token.bondingCurve?.targetRaise || 0) / 1e18;
          const currentRaise = Number(token.bondingCurve?.currentRaise || 0) / 1e18;
          const bondingCurveProgress = targetRaise > 0 
            ? Math.min((currentRaise / targetRaise) * 100, 100) 
            : 0;

          const allPositions = token.launchpadPositions || [];
          const holders = new Set(allPositions.map((p: any) => p.account.id)).size;
          
          const volume24h = allPositions.reduce((sum: number, p: any) => {
            return sum + (Number(p.nativeSpent || 0) + Number(p.nativeReceived || 0)) / 1e18;
          }, 0);

          const liquidity = currentRaise * 1000;

          const walletTrades = walletPositions.map(({ wallet, position }: any) => {
            if (!wallet) return null;

            const spent = Number(position.nativeSpent || 0) / 1e18;
            const received = Number(position.nativeReceived || 0) / 1e18;
            const tokenAmount = Number(position.tokenAmount || 0) / 1e18;

            const pnl = received - spent;
            const remaining = tokenAmount * price;

            const walletTrades = token.trades?.filter((t: any) => 
              t.account.id.toLowerCase() === wallet.address.toLowerCase()
            ) || [];

            const boughtTxns = walletTrades.filter((t: any) => t.isBuy).length;
            const soldTxns = walletTrades.filter((t: any) => !t.isBuy).length;

            return {
              id: `${token.id}-${wallet.id}`,
              wallet: wallet.name,
              emoji: wallet.emoji,
              timeInTrade: '0m',
              exitStatus: tokenAmount === 0 ? 'Exited' : undefined,
              bought: spent * 1000,
              boughtTxns,
              sold: received * 1000,
              soldTxns,
              pnl: pnl * 1000,
              remaining: remaining * 1000
            };
          }).filter(Boolean);

          const lastTimestamp = lastTrade ? Number(lastTrade.timestamp || lastTrade.block * 2) : 0;
          const lastTransaction = new Date(lastTimestamp * 1000).toISOString();

          return {
            id: token.id,
            tokenAddress: token.id,
            name: token.name || 'Unknown',
            symbol: token.symbol || 'UNK',
            emoji: '🪙',
            price: price * 1000,
            marketCap: marketCap / 1000,
            change24h: 0,
            volume24h: volume24h * 1000,
            liquidity,
            holders,
            buyTransactions: token.trades?.filter((t: any) => t.isBuy).length || 0,
            sellTransactions: token.trades?.filter((t: any) => !t.isBuy).length || 0,
            bondingCurveProgress,
            txCount: token.trades?.length || 0,
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
            lastTransaction,
            trades: walletTrades
          };
        });

        if (!cancelled) {
          setMonitorTokens(processedTokens);
          setIsLoadingMonitor(false);
        }
      } catch (error) {
        console.error('Failed to fetch monitor tokens:', error);
        if (!cancelled) {
          setIsLoadingMonitor(false);
        }
      }
    };

    fetchMonitorTokens();
    const interval = setInterval(fetchMonitorTokens, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeTab, trackedWallets]);

  useEffect(() => {
    if (Object.keys(walletTokenBalances).length === 0) return;

    setTrackedWallets(prev => prev.map(wallet => {
      const realBalance = walletTokenBalances[wallet.address];
      if (realBalance && activechain && settings.chainConfig[activechain]?.eth) {
        const ethToken = settings.chainConfig[activechain].eth;
        const balance = Number(realBalance[ethToken] || 0) / 1e18;
        return {
          ...wallet,
          balance: balance * 1000
        };
      }
      return wallet;
    }));
  }, [walletTokenBalances, activechain]);

  

  const [monitorTokens, setMonitorTokens] = useState<MonitorToken[]>([]);
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

  const fetchSubgraphData = async (query: string, variables: any) => {
    try {
      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
      const { data, errors } = await response.json();
      if (errors) {
        console.error('Subgraph errors:', errors);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    }
  };

  const parseLastActive = (lastActive: string): number => {
    const value = parseInt(lastActive);
    if (lastActive.includes('m')) return value;
    if (lastActive.includes('h')) return value * 60;
    if (lastActive.includes('d')) return value * 1440;
    return 999999;
  };

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
        comparison = parseLastActive(a.lastActive) - parseLastActive(b.lastActive);
      }

      return walletSortDirection === 'desc' ? -comparison : comparison;
    });
  };

  const getFilteredWallets = () => {
    const sorted = getSortedWallets();
    if (!searchQuery.trim()) return sorted;

    const query = searchQuery.toLowerCase();
    return sorted.filter(wallet =>
      wallet.name.toLowerCase().includes(query) ||
      wallet.address.toLowerCase().includes(query)
    );
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


  const getFilteredMonitorTokens = () => {
    const now = new Date();

    let tokens = monitorTokens.filter(token => {
      if (monitorFilters.general.lastTransaction) {
        const lastTxTime = new Date(token.lastTransaction);
        const secondsAgo = (now.getTime() - lastTxTime.getTime()) / 1000;
        if (secondsAgo > parseFloat(monitorFilters.general.lastTransaction)) {
          return false;
        }
      }

      const tokenCreatedTime = new Date(token.createdAt);
      const tokenAgeMinutes = (now.getTime() - tokenCreatedTime.getTime()) / (1000 * 60);

      if (monitorFilters.general.tokenAgeMin && tokenAgeMinutes < parseFloat(monitorFilters.general.tokenAgeMin)) {
        return false;
      }
      if (monitorFilters.general.tokenAgeMax && tokenAgeMinutes > parseFloat(monitorFilters.general.tokenAgeMax)) {
        return false;
      }

      if (monitorFilters.market.marketCapMin && token.marketCap < parseFloat(monitorFilters.market.marketCapMin)) {
        return false;
      }
      if (monitorFilters.market.marketCapMax && token.marketCap > parseFloat(monitorFilters.market.marketCapMax)) {
        return false;
      }

      if (monitorFilters.market.liquidityMin && token.volume24h < parseFloat(monitorFilters.market.liquidityMin)) {
        return false;
      }
      if (monitorFilters.market.liquidityMax && token.volume24h > parseFloat(monitorFilters.market.liquidityMax)) {
        return false;
      }

      if (monitorFilters.market.holdersMin && token.holders < parseFloat(monitorFilters.market.holdersMin)) {
        return false;
      }
      if (monitorFilters.market.holdersMax && token.holders > parseFloat(monitorFilters.market.holdersMax)) {
        return false;
      }

      const totalTransactions = token.trades.reduce((sum, t) => sum + t.boughtTxns + t.soldTxns, 0);

      if (monitorFilters.transactions.transactionCountMin && totalTransactions < parseFloat(monitorFilters.transactions.transactionCountMin)) {
        return false;
      }
      if (monitorFilters.transactions.transactionCountMax && totalTransactions > parseFloat(monitorFilters.transactions.transactionCountMax)) {
        return false;
      }

      const inflowVolume = token.trades.reduce((sum, t) => sum + t.bought, 0);

      if (monitorFilters.transactions.inflowVolumeMin && inflowVolume < parseFloat(monitorFilters.transactions.inflowVolumeMin)) {
        return false;
      }
      if (monitorFilters.transactions.inflowVolumeMax && inflowVolume > parseFloat(monitorFilters.transactions.inflowVolumeMax)) {
        return false;
      }

      const outflowVolume = token.trades.reduce((sum, t) => sum + t.sold, 0);

      if (monitorFilters.transactions.outflowVolumeMin && outflowVolume < parseFloat(monitorFilters.transactions.outflowVolumeMin)) {
        return false;
      }
      if (monitorFilters.transactions.outflowVolumeMax && outflowVolume > parseFloat(monitorFilters.transactions.outflowVolumeMax)) {
        return false;
      }

      return true;
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      tokens = tokens.filter(token =>
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query)
      );
    }

    return tokens;
  };

  const fetchWalletData = async (address: string) => {
    try {
      const data = await fetchSubgraphData(WALLET_BALANCE_QUERY, {
        address: address.toLowerCase()
      });

      if (!data?.account) {
        return {
          balance: 0,
          lastActive: 'Never',
          positions: []
        };
      }

      const account = data.account;
      
      const totalBalance = account.positions.reduce((sum: number, pos: any) => {
        const spent = Number(pos.nativeSpent || 0);
        const received = Number(pos.nativeReceived || 0);
        return sum + (spent + received);
      }, 0) / 1e18;

      const lastTrade = account.trades?.[0];
      const lastTimestamp = lastTrade ? Number(lastTrade.timestamp || lastTrade.block * 2) : 0;
      
      let lastActive = 'Never';
      if (lastTimestamp > 0) {
        const now = Date.now() / 1000;
        const secondsAgo = Math.max(0, now - lastTimestamp);
        
        if (secondsAgo < 3600) {
          lastActive = `${Math.floor(secondsAgo / 60)}m`;
        } else if (secondsAgo < 86400) {
          lastActive = `${Math.floor(secondsAgo / 3600)}h`;
        } else {
          lastActive = `${Math.floor(secondsAgo / 86400)}d`;
        }
      }

      return {
        balance: totalBalance * 1000,
        lastActive,
        positions: account.positions
      };
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      return {
        balance: 0,
        lastActive: 'Never',
        positions: []
      };
    }
  };

  const handleAddWallet = async () => {
    setAddWalletError('');

    if (!newWalletAddress.trim()) {
      setAddWalletError('Please enter a wallet address');
      return;
    }

    if (!isValidAddress(newWalletAddress.trim())) {
      setAddWalletError('Invalid wallet address');
      return;
    }

    const exists = trackedWallets.some(w => w.address.toLowerCase() === newWalletAddress.trim().toLowerCase());
    if (exists) {
      setAddWalletError('This wallet is already being tracked');
      return;
    }

    const walletData = await fetchWalletData(newWalletAddress.trim());
    const defaultName = newWalletName.trim() ||
      `${newWalletAddress.slice(0, 6)}...${newWalletAddress.slice(-4)}`;

    const newWallet: TrackedWallet = {
      id: Date.now().toString(),
      address: newWalletAddress.trim(),
      name: defaultName,
      emoji: newWalletEmoji,
      balance: walletData.balance,
      lastActive: walletData.lastActive
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

      const newWallets: TrackedWallet[] = await Promise.all(
        walletsToImport.map(async (item) => {
          const walletData = await fetchWalletData(item.trackedWalletAddress);
          const walletName = (item.name || 'Imported Wallet').slice(0, 20);

          return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            address: item.trackedWalletAddress,
            name: walletName,
            emoji: item.emoji || '👻',
            balance: walletData.balance,
            lastActive: walletData.lastActive
          };
        })
      );

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

  const formatMonitorValue = (value: number, decimals: number = 2): string => {
    const converted = monitorCurrency === 'USD'
      ? value * monUsdPrice
      : value;

    if (converted === 0) return '0';
    const absNum = Math.abs(converted);
    const sign = converted < 0 ? '-' : '';

    if (absNum >= 1000000) {
      return `${sign}${(absNum / 1000000).toFixed(decimals)}M`;
    } else if (absNum >= 1000) {
      return `${sign}${(absNum / 1000).toFixed(decimals)}K`;
    }
    return `${sign}${absNum.toFixed(decimals)}`;
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
        <div className="tracker-wallets-header">
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
        
        {trackedWallets.length === 0 ? (
          <div className="tracker-empty-state">
            <div className="tracker-empty-content">
              <h4>No Wallets Tracked</h4>
              <p>Add wallets to track their activity and trades in real-time.</p>
              <button
                className="tracker-cta-button"
                onClick={() => setShowAddWalletModal(true)}
              >
                Add Your First Wallet
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={mainWalletsRef}
            className={`tracker-wallets-list ${isSelecting ? 'selecting' : ''}`}
            onMouseDown={(e) => startSelection(e)}
            onMouseMove={(e) => {
              if (isSelecting && mainWalletsRef.current) {
                updateSelection(e, mainWalletsRef.current);
              }
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              endSelection();
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              endSelection();
            }}
            style={{ position: 'relative' }}
          >
            {isSelecting && selectionRect && (
              <div
                className="tracker-selection-rectangle"
                style={{
                  left: Math.min(selectionRect.startX, selectionRect.currentX),
                  top: Math.min(selectionRect.startY, selectionRect.currentY),
                  width: Math.abs(selectionRect.currentX - selectionRect.startX),
                  height: Math.abs(selectionRect.currentY - selectionRect.startY),
                }}
              />
            )}
            {filteredWallets.length === 0 ? (
              <div className="tracker-empty-state">
                <div className="tracker-empty-content">
                  <h4>No Wallets Found</h4>
                  <p>No wallets match your search criteria.</p>
                </div>
              </div>
            ) : (
              filteredWallets.map((wallet, index) => renderWalletItem(wallet, index))
            )}
          </div>
        )}
      </div>
    );
  };


  const renderLiveTrades = () => {
    const filteredTrades = getFilteredTrades();

    return (
      <div className="tracker-live-trades">
        <div className="tracker-trades-table">
          <div className="tracker-table-header">
            <div
              className={`tracker-header-cell sortable ${tradeSortField === 'dateCreated' ? 'active' : ''}`}
              onClick={() => handleTradeSort('dateCreated')}
            >
              Time
              {tradeSortField === 'dateCreated' && (
                <span className={`tracker-sort-arrow ${tradeSortDirection}`}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 7L2 3H8L5 7Z" />
                  </svg>
                </span>
              )}
            </div>
            <div className="tracker-header-cell">Name</div>
            <div className="tracker-header-cell">Token</div>
            <div
              className={`tracker-header-cell sortable ${tradeSortField === 'amount' ? 'active' : ''}`}
              onClick={() => handleTradeSort('amount')}
            >
              Amount
              {tradeSortField === 'amount' && (
                <span className={`tracker-sort-arrow ${tradeSortDirection}`}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 7L2 3H8L5 7Z" />
                  </svg>
                </span>
              )}
            </div>
            <div
              className={`tracker-header-cell sortable ${tradeSortField === 'marketCap' ? 'active' : ''}`}
              onClick={() => handleTradeSort('marketCap')}
              style={{ justifySelf: 'end' }}
            >
              Market Cap
              {tradeSortField === 'marketCap' && (
                <span className={`tracker-sort-arrow ${tradeSortDirection}`}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 7L2 3H8L5 7Z" />
                  </svg>
                </span>
              )}
            </div>
          </div>

          <div className="tracker-table-content">
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
                  className={`tracker-trade-row ${trade.type === 'buy' ? 'trade-buy' : 'trade-sell'}`}
                >
                  <div className="tracker-trade-date">
                    {new Date(trade.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="tracker-trade-name">
                    <span className="tracker-trade-emoji">{trade.emoji}</span>
                    <span className="tracker-trade-wallet-name">{trade.walletName}</span>
                    <span className="tracker-trade-time">{trade.time}</span>
                  </div>
                  <div className="tracker-trade-token">
                    <div className="tracker-token-info">
                      <div className="tracker-token-icon"></div>
                      <span>{trade.token}</span>
                      <span className="tracker-token-time">• {trade.time}</span>
                    </div>
                  </div>
                  <div className="tracker-trade-amount">
                    <img src={monadicon} className="tracker-amount-icon" alt="MON" />
                    <span className={`tracker-amount-value ${isBlurred ? 'blurred' : ''}`}>
                      {trade.amount}
                    </span>
                  </div>
                  <div className={`tracker-trade-mc ${isBlurred ? 'blurred' : ''}`}>
                    ${trade.marketCap.toLocaleString()}K
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

    const getTimeAgo = (timestamp: string) => {
      const now = new Date();
      const past = new Date(timestamp);
      const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

      if (seconds < 60) return `${seconds}s`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
      return `${Math.floor(seconds / 86400)}d`;
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
              const buyRatio = (totalBought + totalSold) > 0 ? (totalBought / (totalBought + totalSold) * 100) : 0;

              return (
                <div key={token.id} className="tracker-monitor-card">
                  <div 
                    className="tracker-monitor-card-header"
                    onClick={() => toggleTokenExpanded(token.id)}
                  >
                    <div className="tracker-monitor-card-top">
                      <div className="tracker-monitor-card-left">
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
                            <button className="tracker-monitor-action-btn" onClick={(e) => e.stopPropagation()}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                            </button>
                            <button className="tracker-monitor-action-btn" onClick={(e) => e.stopPropagation()}>☆</button>
                          </div>
                          <div className="tracker-monitor-token-subtitle">
                            <span className="tracker-monitor-token-symbol">{token.symbol}</span>
                            <span className="tracker-monitor-token-ca">
                              {token.tokenAddress.slice(0, 6)}...{token.tokenAddress.slice(-4)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="tracker-monitor-card-right">
                        <div className="tracker-monitor-price-info">
                          <div className="tracker-monitor-price">
                            {monitorCurrency === 'USD' ? '$' : '≡'}
                            {formatValue(token.price)}
                          </div>
                          <div className={`tracker-monitor-price-change ${token.change24h >= 0 ? 'positive' : 'negative'}`}>
                            {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="tracker-monitor-stats-grid">
                      <div className="tracker-monitor-stat">
                        <span className="stat-label">MC</span>
                        <span className="stat-value">
                          {monitorCurrency === 'USD' ? '$' : '≡'}
                          {formatValue(token.marketCap)}
                        </span>
                      </div>
                      <div className="tracker-monitor-stat">
                        <span className="stat-label">Liq</span>
                        <span className="stat-value">
                          {monitorCurrency === 'USD' ? '$' : '≡'}
                          {formatValue(token.liquidity)}
                        </span>
                      </div>
                      <div className="tracker-monitor-stat">
                        <span className="stat-label">Vol</span>
                        <span className="stat-value">
                          {monitorCurrency === 'USD' ? '$' : '≡'}
                          {formatValue(token.volume24h)}
                        </span>
                      </div>
                      <div className="tracker-monitor-stat">
                        <span className="stat-label">Holders</span>
                        <span className="stat-value">{token.holders}</span>
                      </div>
                      <div className="tracker-monitor-stat">
                        <span className="stat-label">Txns</span>
                        <span className="stat-value">{token.txCount}</span>
                      </div>
                      <div className="tracker-monitor-stat">
                        <span className="stat-label">Last TX</span>
                        <span className="stat-value">{getTimeAgo(token.lastTransaction)}</span>
                      </div>
                    </div>

                    <div className="tracker-monitor-trade-summary">
                      <div className="tracker-monitor-trade-counts">
                        <span className="buy-count">{totalBuys} Buys</span>
                        <span className="separator">•</span>
                        <span className="sell-count">{totalSells} Sells</span>
                      </div>
                      <div className="tracker-monitor-trade-bar">
                        <div className="bar-buy" style={{ width: `${buyRatio}%` }}></div>
                        <div className="bar-sell" style={{ width: `${100 - buyRatio}%` }}></div>
                      </div>
                      <div className="tracker-monitor-trade-amounts">
                        <span className="buy-amount">
                          ≡ {formatValue(totalBought)}
                        </span>
                        <span className="sell-amount">
                          ≡ {formatValue(totalSold)}
                        </span>
                      </div>
                    </div>

                    <div className="tracker-monitor-progress-section">
                      <div className="tracker-monitor-progress-bar">
                        <div 
                          className="tracker-monitor-progress-fill"
                          style={{ width: `${token.bondingCurveProgress}%` }}
                        ></div>
                      </div>
                      <span className="tracker-monitor-progress-text">
                        {token.bondingCurveProgress}% Bonding Curve
                      </span>
                    </div>
                  </div>

                  {isExpanded && token.trades.length > 0 && (
                    <div className="tracker-monitor-trades-expanded">
                      <div className="tracker-monitor-trades-table-header">
                        <div className="header-cell">Wallet</div>
                        <div className="header-cell">Time</div>
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
                            <span className={`amount ${isBlurred ? 'blurred' : ''}`}>
                              ≡ {formatValue(trade.bought)}
                            </span>
                            <span className="txns-text">{trade.boughtTxns} txns</span>
                          </div>
                          <div className="trade-sold-col">
                            <span className={`amount ${isBlurred ? 'blurred' : ''}`}>
                              ≡ {formatValue(trade.sold)}
                            </span>
                            <span className="txns-text">{trade.soldTxns} txns</span>
                          </div>
                          <div className={`trade-pnl-col ${trade.pnl >= 0 ? 'positive' : 'negative'} ${isBlurred ? 'blurred' : ''}`}>
                            ≡ {trade.pnl >= 0 ? '+' : ''}{formatValue(trade.pnl)}
                          </div>
                          <div className={`trade-remaining-col ${isBlurred ? 'blurred' : ''}`}>
                            ≡ {formatValue(trade.remaining)}
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

  /*

  const renderWalletItem = (wallet: TrackedWallet) => {
    const isSelected = selectedWallets.has(wallet.id);
    const isPreviewSelected = previewSelection.has(wallet.id);
    const isDragging = dragReorderState.draggedIndex === index && dragReorderState.draggedContainer === 'main';
    const isDragOver = dragReorderState.dragOverIndex === index && dragReorderState.dragOverContainer === 'main';
    const containerKey = 'tracker-wallets';

    return (
      <div
        key={wallet.id}
        data-wallet-id={wallet.id}
        className={`tracker-wallet-item ${isSelected ? 'selected' : ''} ${isPreviewSelected ? 'preview-selected' : ''}`}
        draggable
        onDragStart={(e) => {
          setDraggedWallet(wallet);
          if (selectedWallets.size > 1 && isSelected) {
            const selectedWalletsData = trackedWallets.filter(w => selectedWallets.has(w.id));
            e.dataTransfer.setData('application/json', JSON.stringify({
              type: 'multi-drag',
              wallets: selectedWalletsData,
              count: selectedWalletsData.length
            }));
          } else {
            e.dataTransfer.setData('application/json', JSON.stringify({
              type: 'single-drag',
              wallet: wallet
            }));
          }
        }}
        onDragEnd={() => setDraggedWallet(null)}
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
        <div className="tracker-wallet-drag-handle">
          <img src={circle} className="tracker-drag-handle-icon" alt="Drag" />
        </div>

        <div className="tracker-wallet-profile">
          <div className="tracker-wallet-emoji">{wallet.emoji}</div>

          <div className="tracker-wallet-info">
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
          </div>
        </div>

        <div className={`tracker-wallet-balance ${isBlurred ? 'blurred' : ''}`}>
          {walletCurrency === 'MON' ? (
            <img src={monadicon} className="tracker-balance-icon" alt="MON" />
          ) : (
            `$`
          )}
          {(() => {
            const realBalance = walletTokenBalances[wallet.address];
            if (realBalance && activechain && settings.chainConfig[activechain]?.eth) {
              const ethToken = settings.chainConfig[activechain].eth;
              const balance = Number(realBalance[ethToken] || 0) / 1e18;
              return balance > 0 ? (balance / 1000).toFixed(2) : '0.00';
            }
            return wallet.balance.toFixed(2);
          })()}K
        </div>

        <div className="tracker-wallet-last-active">{wallet.lastActive}</div>

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
              href={`${settings.chainConfig[activechain].explorer}/address/${wallet.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tracker-action-button"
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                className="tracker-action-icon"
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

  */

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

        <div className="tracker-wallet-drag-handle">
          <img src={circle} className="tracker-drag-handle-icon" alt="Drag" />
        </div>

        <div className="tracker-wallet-profile">
          <div className="tracker-wallet-emoji">{wallet.emoji}</div>

          <div className="tracker-wallet-info">
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
          </div>
        </div>

        <div className={`tracker-wallet-balance ${isBlurred ? 'blurred' : ''}`}>
          {walletCurrency === 'MON' ? (
            <img src={monadicon} className="tracker-balance-icon" alt="MON" />
          ) : (
            '$'
          )}
          {(() => {
            const realBalance = walletTokenBalances[wallet.address];
            if (realBalance && activechain && settings.chainConfig[activechain]?.eth) {
              const ethToken = settings.chainConfig[activechain].eth;
              const balance = Number(realBalance[ethToken] || 0) / 1e18;
              return balance > 0 ? (balance / 1000).toFixed(2) : '0.00';
            }
            return wallet.balance.toFixed(2);
          })()}K
        </div>

        <div className="tracker-wallet-last-active">{wallet.lastActive}</div>

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
              href={`${settings.chainConfig[activechain]?.explorer}/address/${wallet.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tracker-action-button"
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                className="tracker-action-icon"
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
            <button className="tracker-header-button">P1</button>
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
          initialFilters={monitorFilters}
        />
      )}
    </div>
  );
};

export default Tracker;