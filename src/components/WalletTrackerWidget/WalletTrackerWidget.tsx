import React, { useCallback, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Edit2 } from 'lucide-react';
import './WalletTrackerWidget.css';
import monadicon from '../../assets/monadlogo.svg';
import copy from '../../assets/copy.svg';
import trash from '../../assets/trash.svg';
import defaultPfp from '../../assets/leaderboard_default.png';
import closebutton from '../../assets/close_button.png';
import settingsicon from '../../assets/settings.svg';
import filter from '../../assets/filter.svg';
import ImportWalletsPopup from '../Tracker/ImportWalletsPopup';
import AddWalletModal, { TrackedWallet } from '../Tracker/AddWalletModal';
import LiveTradesFiltersPopup from '../Tracker/LiveTradesFiltersPopup/LiveTradesFiltersPopup';
import { FilterState } from '../Tracker/Tracker';
import MonitorFiltersPopup, { MonitorFilterState } from '../Tracker/MonitorFiltersPopup/MonitorFiltersPopup';
import circle from '../../assets/circle_handle.png';
import lightning from '../../assets/flash.png';

interface GqlPosition {
  tokenId: string;
  symbol: string;
  name: string;
  imageUrl: string;
  boughtTokens: number;
  soldTokens: number;
  spentNative: number;
  receivedNative: number;
  remainingTokens: number;
  remainingPct: number;
  pnlNative: number;
  lastPrice: number;
  isOrderbook?: boolean;
}

interface WalletTrackerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSnapChange?: (snapSide: 'left' | 'right' | null, width: number) => void;
  trackedWallets?: TrackedWallet[];
  onWalletsChange?: (wallets: TrackedWallet[]) => void;
  monUsdPrice?: number;
  walletTokenBalances?: { [address: string]: any };
  activechain?: string | number;
  settings?: any;
  allTrades?: any[];
  launchpadPositions?: GqlPosition[];
  tokenList?: any[];
  marketsData?: any;
  tradesByMarket?: any;
  marketsRef?: any;
  setpopup?: (popupId: number) => void;
  currentPopup?: number;
}

type TrackerTab = 'wallets' | 'trades' | 'monitor';

const STORAGE_KEY = 'tracked_wallets_data';

function chainCfgOf(activechain?: string | number, settings?: any) {
  const cc = settings?.chainConfig;
  return (
    cc?.[activechain as any] ??
    cc?.[Number(activechain) as any] ??
    cc?.monad ??
    null
  );
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

const saveWalletsToStorage = (wallets: TrackedWallet[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
  } catch (error) {
    console.error('Failed to save wallets to localStorage:', error);
  }
};

const formatAddress = (addr: string) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const formatCreatedDate = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days >= 30) return `${Math.floor(days / 30)}mo`;
  if (days >= 7) return `${Math.floor(days / 7)}w`;
  if (days >= 1) return `${days}d`;
  if (hours >= 1) return `${hours}h`;
  if (minutes >= 1) return `${minutes}m`;
  return `${seconds}s`;
};

const Tooltip: React.FC<{
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
}> = ({ content, children, position = 'top', offset = 10 }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current || !tooltipRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top + scrollY - tooltipRect.height - offset - 15;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollY + offset;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - tooltipRect.width - offset;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + offset;
        break;
    }

    const margin = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (position === 'top' || position === 'bottom') {
      left = Math.min(
        Math.max(left, margin + tooltipRect.width / 2),
        viewportWidth - margin - tooltipRect.width / 2,
      );
    } else {
      top = Math.min(
        Math.max(top, margin),
        viewportHeight - margin - tooltipRect.height,
      );
    }

    setTooltipPosition({ top, left });
  }, [position, offset]);

  const handleMouseEnter = useCallback(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    setIsLeaving(false);
    setShouldRender(true);

    fadeTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      fadeTimeoutRef.current = null;
    }, 10);
  }, []);



  const handleMouseLeave = useCallback(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    setIsLeaving(true);
    setIsVisible(false);

    fadeTimeoutRef.current = setTimeout(() => {
      setShouldRender(false);
      setIsLeaving(false);
      fadeTimeoutRef.current = null;
    }, 150);
  }, []);

  useEffect(() => {
    if (shouldRender && !isLeaving) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [shouldRender, updatePosition, isLeaving]);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tooltip-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {shouldRender &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`tooltip tooltip-${position} ${isVisible ? 'tooltip-entering' : isLeaving ? 'tooltip-leaving' : ''}`}
            style={{
              position: 'absolute',
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: `${position === 'top' || position === 'bottom'
                ? 'translateX(-50%)'
                : position === 'left' || position === 'right'
                  ? 'translateY(-50%)'
                  : 'none'
                } scale(${isVisible ? 1 : 0})`,
              opacity: isVisible ? 1 : 0,
              zIndex: 9999,
              pointerEvents: 'none',
              transition:
                'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform, opacity',
            }}
          >
            <div className="tooltip-content">{content}</div>
          </div>,
          document.body,
        )}
    </div>
  );
};

const HEADER_HEIGHT = 53;
const SIDEBAR_WIDTH = 50;
const SNAP_THRESHOLD = 10;
const SNAP_HOVER_TIME = 300;

const WalletTrackerWidget: React.FC<WalletTrackerWidgetProps> = ({
  isOpen,
  onClose,
  onSnapChange,
  trackedWallets: externalWallets,
  onWalletsChange,
  monUsdPrice = 0,
  walletTokenBalances = {},
  activechain = 'monad',
  settings,
  allTrades = [],
  launchpadPositions,
  tokenList = [],
  marketsData = {},
  tradesByMarket = {},
  marketsRef,
  setpopup,
  currentPopup = 0,
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 600, height: 700 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [isSnapped, setIsSnapped] = useState<'left' | 'right' | null>(null);
  const [snapZoneHover, setSnapZoneHover] = useState<'left' | 'right' | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const resizeStartPosition = useRef({ x: 0, y: 0 });
  const snapHoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const presnapState = useRef<{ position: { x: number; y: number }; size: { width: number; height: number } } | null>(null);

  const [activeTab, setActiveTab] = useState<TrackerTab>('wallets');
  const [searchQuery, setSearchQuery] = useState('');
  const [localWallets, setLocalWallets] = useState<TrackedWallet[]>([]);
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [dontShowDeleteAgain, setDontShowDeleteAgain] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [sortBy, setSortBy] = useState<'balance' | 'lastActive' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [walletCurrency, setWalletCurrency] = useState<'USD' | 'MON'>('USD');

  // Trades tab state
  const [tradeSortField, setTradeSortField] = useState<'amount' | 'marketCap' | null>(null);
  const [tradeSortDirection, setTradeSortDirection] = useState<'asc' | 'desc'>('desc');

  // Monitor tab state
  const [monitorCurrency, setMonitorCurrency] = useState<'USD' | 'MON'>('USD');
  const [pinnedTokens, setPinnedTokens] = useState<Set<string>>(new Set());
  const [monitorSortField, setMonitorSortField] = useState<string | null>(null);
  const [monitorSortDirection, setMonitorSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedTokenId, setExpandedTokenId] = useState<string | null>(null);

  // Filter popups state
  const [showFiltersPopup, setShowFiltersPopup] = useState(false);
  const [showMonitorFiltersPopup, setShowMonitorFiltersPopup] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
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
    },
  });

  // Import and Add Wallet modals
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);

  const chainCfg = chainCfgOf(activechain, settings);

  // Drag functionality
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('wtw-resize-handle')) {
      return;
    }
    // Don't drag if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('.wtw-wallet-item') ||
      target.closest('.wtw-search') ||
      target.closest('.wtw-tabs')
    ) {
      return;
    }

    if (isSnapped && presnapState.current) {
      setIsSnapped(null);
      setPosition(presnapState.current.position);
      setSize(presnapState.current.size);
      dragStartPos.current = {
        x: e.clientX - presnapState.current.position.x,
        y: e.clientY - presnapState.current.position.y,
      };
      presnapState.current = null;
    } else {
      dragStartPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }

    setIsDragging(true);
  }, [position, isSnapped]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.stopPropagation();
      setIsResizing(true);
      setResizeDirection(direction);
      resizeStartPos.current = { x: e.clientX, y: e.clientY };
      resizeStartSize.current = { ...size };
      resizeStartPosition.current = { ...position };
    },
    [size, position]
  );

  useEffect(() => {
    if (onSnapChange) {
      onSnapChange(isSnapped, size.width);
    }
  }, [isSnapped, size.width, onSnapChange]);

  useEffect(() => {
    const handleWindowResize = () => {
      if (isSnapped) {
        if (isSnapped === 'left') {
          setPosition({ x: SIDEBAR_WIDTH, y: HEADER_HEIGHT });
          setSize(prev => ({
            width: Math.min(prev.width, window.innerWidth - SIDEBAR_WIDTH - 200),
            height: window.innerHeight - HEADER_HEIGHT
          }));
        } else if (isSnapped === 'right') {
          const maxWidth = window.innerWidth - SIDEBAR_WIDTH - 200;
          const newWidth = Math.min(size.width, maxWidth);
          setSize({
            width: newWidth,
            height: window.innerHeight - HEADER_HEIGHT
          });
          setPosition({
            x: window.innerWidth - newWidth,
            y: HEADER_HEIGHT
          });
        }
      } else {
        setPosition(prev => ({
          x: Math.max(SIDEBAR_WIDTH, Math.min(prev.x, window.innerWidth - size.width)),
          y: Math.max(HEADER_HEIGHT, Math.min(prev.y, window.innerHeight - size.height))
        }));
        setSize(prev => ({
          width: Math.min(prev.width, window.innerWidth - SIDEBAR_WIDTH),
          height: Math.min(prev.height, window.innerHeight - HEADER_HEIGHT)
        }));
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [isSnapped, size.width]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        let newX = e.clientX - dragStartPos.current.x;
        let newY = e.clientY - dragStartPos.current.y;

        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;

        newX = Math.max(SIDEBAR_WIDTH, Math.min(newX, maxX));
        newY = Math.max(HEADER_HEIGHT, Math.min(newY, maxY));

        setPosition({ x: newX, y: newY });

        const distanceFromLeft = newX - SIDEBAR_WIDTH;
        const distanceFromRight = window.innerWidth - (newX + size.width);

        if (distanceFromLeft <= SNAP_THRESHOLD) {
          if (!snapHoverTimeout.current) {
            setSnapZoneHover('left');
            snapHoverTimeout.current = setTimeout(() => {
              presnapState.current = { position: { x: newX, y: newY }, size };

              setIsSnapped('left');
              const snappedWidth = Math.min(size.width, window.innerWidth - SIDEBAR_WIDTH - 200);
              setPosition({ x: SIDEBAR_WIDTH, y: HEADER_HEIGHT });
              setSize({ width: snappedWidth, height: window.innerHeight - HEADER_HEIGHT });
              setSnapZoneHover(null);
              snapHoverTimeout.current = null;
            }, SNAP_HOVER_TIME);
          }
        } else if (distanceFromRight <= SNAP_THRESHOLD) {
          if (!snapHoverTimeout.current) {
            setSnapZoneHover('right');
            snapHoverTimeout.current = setTimeout(() => {
              presnapState.current = { position: { x: newX, y: newY }, size };

              setIsSnapped('right');
              const snappedWidth = Math.min(size.width, window.innerWidth - SIDEBAR_WIDTH - 200);
              setPosition({ x: window.innerWidth - snappedWidth, y: HEADER_HEIGHT });
              setSize({ width: snappedWidth, height: window.innerHeight - HEADER_HEIGHT });
              setSnapZoneHover(null);
              snapHoverTimeout.current = null;
            }, SNAP_HOVER_TIME);
          }
        } else {
          if (snapHoverTimeout.current) {
            clearTimeout(snapHoverTimeout.current);
            snapHoverTimeout.current = null;
          }
          setSnapZoneHover(null);
        }
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStartPos.current.x;
        const deltaY = e.clientY - resizeStartPos.current.y;

        let newWidth = resizeStartSize.current.width;
        let newHeight = resizeStartSize.current.height;
        let newX = resizeStartPosition.current.x;
        let newY = resizeStartPosition.current.y;

        if (isSnapped === 'left' && resizeDirection === 'right') {
          newWidth = Math.max(200, Math.min(resizeStartSize.current.width + deltaX, window.innerWidth - SIDEBAR_WIDTH));
        } else if (isSnapped === 'right' && resizeDirection === 'left') {
          newWidth = Math.max(200, Math.min(resizeStartSize.current.width - deltaX, window.innerWidth));
          newX = window.innerWidth - newWidth;
        } else if (!isSnapped) {
          if (resizeDirection.includes('right')) {
            newWidth = Math.max(200, Math.min(resizeStartSize.current.width + deltaX, window.innerWidth - newX));
          }
          if (resizeDirection.includes('left')) {
            const maxWidthIncrease = newX - SIDEBAR_WIDTH;
            newWidth = Math.max(200, Math.min(resizeStartSize.current.width - deltaX, resizeStartSize.current.width + maxWidthIncrease));
            if (newWidth > 200) {
              newX = Math.max(SIDEBAR_WIDTH, resizeStartPosition.current.x + deltaX);
            }
          }
          if (resizeDirection.includes('bottom')) {
            newHeight = Math.max(150, Math.min(resizeStartSize.current.height + deltaY, window.innerHeight - newY));
          }
          if (resizeDirection.includes('top')) {
            const maxHeightIncrease = newY - HEADER_HEIGHT;
            newHeight = Math.max(150, Math.min(resizeStartSize.current.height - deltaY, resizeStartSize.current.height + maxHeightIncrease));
            if (newHeight > 150) {
              newY = Math.max(HEADER_HEIGHT, resizeStartPosition.current.y + deltaY);
            }
          }
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');

      if (snapHoverTimeout.current) {
        clearTimeout(snapHoverTimeout.current);
        snapHoverTimeout.current = null;
      }
      setSnapZoneHover(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, resizeDirection, size, isSnapped]);

  const lastActiveLabel = (w: TrackedWallet) => {
    const ts = w.lastActiveAt ?? new Date(w.createdAt).getTime();
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  // Initialize wallets from external prop or localStorage
  useEffect(() => {
    if (externalWallets) {
      setLocalWallets(externalWallets);
    } else {
      setLocalWallets(loadWalletsFromStorage());
    }
  }, [externalWallets]);

  // Save to localStorage when wallets change
  useEffect(() => {
    if (!externalWallets && localWallets.length >= 0) {
      saveWalletsToStorage(localWallets);
      // Dispatch custom event for same-window sync
      window.dispatchEvent(new CustomEvent('wallets-updated', { detail: { wallets: localWallets, source: 'widget' } }));
    }
    if (onWalletsChange) {
      onWalletsChange(localWallets);
    }
  }, [localWallets, externalWallets, onWalletsChange]);

  // Listen for wallet changes from Tracker.tsx or other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const updatedWallets = JSON.parse(e.newValue);
          setLocalWallets(updatedWallets);
        } catch (error) {
          console.error('Failed to parse updated wallets:', error);
        }
      }
    };

    const handleCustomWalletUpdate = (e: CustomEvent) => {
      if (e.detail && e.detail.source !== 'widget' && !externalWallets) {
        const updatedWallets = e.detail.wallets;
        // Only update if the wallets are actually different to avoid infinite loops
        if (JSON.stringify(updatedWallets) !== JSON.stringify(localWallets)) {
          setLocalWallets(updatedWallets);
        }
      }
    };

    // Listen for localStorage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange as EventListener);
    // Listen for custom events from same window (Tracker component)
    window.addEventListener('wallets-updated', handleCustomWalletUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('wallets-updated', handleCustomWalletUpdate as EventListener);
    };
  }, [externalWallets, localWallets]);

  const handleSort = (field: 'balance' | 'lastActive') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const getSortedWallets = (wallets: TrackedWallet[]) => {
    if (!sortBy) return wallets;

    return [...wallets].sort((a, b) => {
      let aVal: number, bVal: number;

      if (sortBy === 'balance') {
        aVal = a.balance || 0;
        bVal = b.balance || 0;
      } else {
        aVal = a.lastActiveAt || 0;
        bVal = b.lastActiveAt || 0;
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  const filteredWallets = getSortedWallets(
    localWallets.filter(
      (w) =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.address.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
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

  const confirmDeleteWallet = (id: string) => {
    const shouldSkip = getDeletePreference();

    if (shouldSkip) {
      setLocalWallets((prev) => prev.filter((w) => w.id !== id));
    } else {
      setShowDeleteConfirm(id);
    }
  };

  const handleDeleteWallet = (id: string) => {
    if (dontShowDeleteAgain) {
      saveDeletePreference(true);
    }

    setLocalWallets((prev) => prev.filter((w) => w.id !== id));
    setShowDeleteConfirm(null);
    setDontShowDeleteAgain(false);
  };

  const handleRemoveAll = () => {
    setShowDeleteAllConfirm(true);
  };

  const confirmDeleteAll = () => {
    setLocalWallets([]);
    setShowDeleteAllConfirm(false);
  };
  const startEditingWallet = (wallet: TrackedWallet) => {
    setEditingWallet(wallet.id);
    setEditingName(wallet.name);
  };

  const saveWalletName = (id: string) => {
    if (editingName.trim()) {
      setLocalWallets((prev) =>
        prev.map((w) => (w.id === id ? { ...w, name: editingName.trim() } : w))
      );
    }
    setEditingWallet(null);
    setEditingName('');
  };

  const handleExport = () => {
    const exportData = localWallets.map(wallet => ({
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

  const handleImportWallets = (walletsText: string, addToSingleGroup: boolean) => {
    try {
      const importedWallets = JSON.parse(walletsText);
      const walletsArray = Array.isArray(importedWallets) ? importedWallets : [importedWallets];

      const newWallets: TrackedWallet[] = walletsArray.map((w) => ({
        address: w.trackedWalletAddress || w.address,
        name: w.name || 'Imported Wallet',
        emoji: w.emoji || '👤',
        balance: 0,
        lastActiveAt: null,
        id: `wallet-${Date.now()}-${Math.random()}`,
        createdAt: new Date().toISOString(),
      }));

      setLocalWallets((prev) => [...prev, ...newWallets]);
      setShowImportPopup(false);
    } catch (error) {
      console.error('Failed to import wallets:', error);
      alert('Invalid JSON format. Please check your import data.');
    }
  };

  const handleAddWallet = (wallet: TrackedWallet) => {
    setLocalWallets((prev) => [...prev, wallet]);
    setShowAddWalletModal(false);
  };

  const handleApplyFilters = (filters: FilterState) => {
    setActiveFilters(filters);
  };

  const handleApplyMonitorFilters = (filters: MonitorFilterState) => {
    setMonitorFilters(filters);
  };

  // Trade filtering and sorting - copied from Tracker.tsx
  const getFilteredTrades = () => {
    let trades = allTrades.filter((trade: any) => {
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

        if (tradeSortField === 'amount') {
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
        trade.walletName?.toLowerCase().includes(query) ||
        trade.token?.toLowerCase().includes(query)
      );
    }

    return trades;
  };

  const handleTradeSort = (field: 'amount' | 'marketCap') => {
    if (tradeSortField === field) {
      setTradeSortDirection(tradeSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setTradeSortField(field);
      setTradeSortDirection('desc');
    }
  };

  // Monitor filtering and sorting
  const getFilteredPositions = () => {
    if (!launchpadPositions) return [];

    const walletAddressSet = new Set(localWallets.map(w => w.address.toLowerCase()));

    return launchpadPositions.filter((pos: any) => {
      const posWalletAddr = pos.walletAddress?.toLowerCase();
      if (!walletAddressSet.has(posWalletAddr)) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          pos.name?.toLowerCase().includes(query) ||
          pos.symbol?.toLowerCase().includes(query)
        );
      }
      return true;
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

  const formatPrice = (price: number, noDecimals = false, compact = false) => {
    if (price >= 1e6) {
      return `$${(price / 1e6).toFixed(noDecimals ? 0 : 2)}M`;
    }
    if (price >= 1e3) {
      return `$${(price / 1e3).toFixed(noDecimals ? 0 : 2)}K`;
    }
    if (price >= 1) {
      return `$${price.toFixed(noDecimals ? 0 : 2)}`;
    }
    return `$${price.toFixed(noDecimals ? 4 : 6)}`;
  };

  // Render Live Trades
  const renderLiveTrades = () => {
    const filteredTrades = getFilteredTrades();

    return (
      <div className="wtw-live-trades">
        <div className="wtw-detail-trades-table">
          <div className="wtw-detail-trades-header">
            <div className="wtw-detail-trades-header-cell wtw-detail-trades-time">Time</div>
            <div className="wtw-detail-trades-header-cell wtw-detail-trades-account">Account</div>
            <div className="wtw-detail-trades-header-cell">Token</div>
            <div
              className={`wtw-detail-trades-header-cell wtw-sortable ${tradeSortField === 'amount' ? 'active' : ''}`}
              onClick={() => handleTradeSort('amount')}
            >
              Amount
            </div>
            <div
              className={`wtw-detail-trades-header-cell wtw-sortable ${tradeSortField === 'marketCap' ? 'active' : ''}`}
              onClick={() => handleTradeSort('marketCap')}
            >
              Market Cap
            </div>
          </div>

          <div className="wtw-detail-trades-body">
            {filteredTrades.length === 0 ? (
              <div className="wtw-empty-state">
                <div className="wtw-empty-content">
                  <h4>No Trades Found</h4>
                  <p>No trades match your search criteria.</p>
                </div>
              </div>
            ) : (
              filteredTrades.map((trade: any) => (
                <div
                  key={trade.id}
                  className={`wtw-detail-trades-row ${trade.type === 'buy' ? 'buy' : 'sell'}`}
                >
                  <div className="wtw-detail-trades-col wtw-detail-trades-time">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>{trade.time}</span>
                    </div>
                  </div>

                  <div className="wtw-detail-trades-col wtw-detail-trades-account">
                    <div className="wtw-detail-trades-avatar">
                      <div>
                        <img src={defaultPfp} alt="Avatar" />
                      </div>
                    </div>
                    <span className="wtw-detail-trades-address">
                      {trade.walletName}
                    </span>
                  </div>

                  <div className="wtw-detail-trades-col">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {trade.tokenIcon && (
                        <img src={trade.tokenIcon} className="wtw-asset-icon" alt={trade.tokenName || trade.token} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', background: '#222' }} />
                      )}
                      <div className="wtw-asset-details">
                        <div className="wtw-asset-ticker">{trade.tokenName || trade.token}</div>
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

                  <div className="wtw-detail-trades-col">
                    <span
                      className={[
                        'wtw-detail-trades-amount',
                        trade.type === 'buy' ? 'wtw-amount-buy' : 'wtw-amount-sell'
                      ].join(' ')}
                    >
                      {trade.amount === 0 || isNaN(trade.amount)
                        ? '$0'
                        : (() => {
                          const usd = monUsdPrice ? trade.amount * monUsdPrice : trade.amount;
                          if (Math.abs(usd) < 1e-8 && usd !== 0) return '$' + usd.toFixed(12).replace(/0+$/, '').replace(/\.$/, '');
                          return '$' + usd.toLocaleString(undefined, { maximumFractionDigits: 8 });
                        })()}
                    </span>
                  </div>

                  <div className="wtw-detail-trades-col" style={{ minWidth: '120px', width: '120px' }}>
                    <span>
                      {trade.marketCap === 0 || isNaN(trade.marketCap)
                        ? '$0'
                        : (() => {
                          const usd = monUsdPrice ? trade.marketCap * monUsdPrice : trade.marketCap;
                          if (Math.abs(usd) < 1e-8 && usd !== 0) return '$' + usd.toFixed(12).replace(/0+$/, '').replace(/\.$/, '');
                          return '$' + usd.toLocaleString(undefined, { maximumFractionDigits: 8 });
                        })()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Monitor
  const renderMonitor = () => {
    const allPositions = getFilteredPositions();

    // Create positions from tokenList (Orderbook tokens)
    const spotTokenPositions: GqlPosition[] = [];

    if (walletTokenBalances && tokenList && tokenList.length > 0) {
      localWallets.forEach(wallet => {
        const walletBalances = walletTokenBalances[wallet.address] || walletTokenBalances[wallet.address.toLowerCase()];
        if (!walletBalances) return;

        tokenList.forEach((token: any) => {
          const tokenAddr = token.address?.toLowerCase();
          if (!tokenAddr) return;

          let balanceWei = walletBalances[tokenAddr];
          if (!balanceWei) {
            const matchingKey = Object.keys(walletBalances).find(k => k.toLowerCase() === tokenAddr);
            if (matchingKey) {
              balanceWei = walletBalances[matchingKey];
            }
          }
          if (!balanceWei || balanceWei === 0n) return;

          const decimals = token.decimals || 18;
          const balance = Number(balanceWei) / (10 ** Number(decimals));
          if (balance <= 0) return;

          // Get price from marketsData if available
          let price = 0;
          if (marketsData && Array.isArray(marketsData)) {
            const market = marketsData.find((m: any) =>
              m.baseAddress?.toLowerCase() === tokenAddr ||
              m.address?.toLowerCase() === tokenAddr ||
              m.symbol === token.ticker
            );
            price = market?.currentPrice || market?.price || 0;
          }

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

    const allMonitorPositions = [...allPositions, ...spotTokenPositions];

    if (allMonitorPositions.length === 0) {
      return (
        <div className="wtw-monitor">
          <div className="wtw-empty-state">
            <div className="wtw-empty-content">
              <h4>No Positions Found</h4>
              <p>No tokens held by tracked wallets</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="wtw-monitor">
        <div className="wtw-monitor-grid">
          {allMonitorPositions.map((pos) => {
            const tokenName = pos.name || pos.symbol || 'Unknown';
            const tokenSymbol = pos.symbol || 'UNK';
            const walletName = (pos as any).walletName || 'Unknown';
            const walletEmoji = (pos as any).walletEmoji || '👤';

            const value = pos.remainingTokens * pos.lastPrice;
            const displayValue = monitorCurrency === 'USD' ? value * monUsdPrice : value;

            return (
              <div key={`${pos.tokenId}-${walletName}`} className="wtw-monitor-card">
                <div className="wtw-monitor-card-header">
                  <div className="wtw-monitor-token-info">
                    {pos.imageUrl && (
                      <img src={pos.imageUrl} className="wtw-monitor-token-icon" alt={tokenSymbol} />
                    )}
                    <div className="wtw-monitor-token-details">
                      <div className="wtw-monitor-token-name">{tokenName}</div>
                      <div className="wtw-monitor-token-symbol">{tokenSymbol}</div>
                    </div>
                  </div>
                  <div className="wtw-monitor-wallet-badge">
                    <span className="wtw-monitor-wallet-emoji">{walletEmoji}</span>
                    <span className="wtw-monitor-wallet-name">{walletName}</span>
                  </div>
                </div>
                <div className="wtw-monitor-card-body">
                  <div className="wtw-monitor-stat">
                    <div className="wtw-monitor-stat-label">Holdings</div>
                    <div className="wtw-monitor-stat-value">
                      {pos.remainingTokens.toFixed(2)} {tokenSymbol}
                    </div>
                  </div>
                  <div className="wtw-monitor-stat">
                    <div className="wtw-monitor-stat-label">Value</div>
                    <div className="wtw-monitor-stat-value">
                      {monitorCurrency === 'USD' ? '$' : ''}{displayValue.toFixed(2)}
                      {monitorCurrency === 'MON' && <img src={monadicon} className="wtw-monitor-mon-icon" alt="MON" />}
                    </div>
                  </div>
                  <div className="wtw-monitor-stat">
                    <div className="wtw-monitor-stat-label">Price</div>
                    <div className="wtw-monitor-stat-value">
                      ${(pos.lastPrice * monUsdPrice).toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {(isDragging || isResizing) && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9998,
          cursor: isDragging ? 'move' : 'resize',
          userSelect: 'none'
        }} />
      )}
      {snapZoneHover && (
        <>
          <div className={`wtw-snap-zone-overlay left ${snapZoneHover === 'left' ? 'active' : ''}`} />
          <div className={`wtw-snap-zone-overlay right ${snapZoneHover === 'right' ? 'active' : ''}`} />
        </>
      )}

      <div
        ref={widgetRef}
        className={`wtw-container ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isSnapped ? `snapped snapped-${isSnapped}` : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
        }}
      >
        {/* Filters Header */}
        <div className="wtw-filters-header" onMouseDown={handleDragStart}>
          <div className="wtw-tabs">
            <button
              className={`wtw-tab ${activeTab === 'wallets' ? 'active' : ''}`}
              onClick={() => setActiveTab('wallets')}
            >
              Wallet
            </button>
            <button
              className={`wtw-tab ${activeTab === 'trades' ? 'active' : ''}`}
              onClick={() => setActiveTab('trades')}
            >
              Trades
            </button>
            <button
              className={`wtw-tab ${activeTab === 'monitor' ? 'active' : ''}`}
              onClick={() => setActiveTab('monitor')}
            >
              Monitor
            </button>
          </div>
          <div className="wtw-widget-header-right">
            {activeTab === 'trades' && (
              <div className="wtw-header-actions">
                <Tooltip content="Live Trade Settings">
                <button className="wtw-header-button" onClick={() => setpopup?.(33)}>
                  <img className="wtw-settings-image" src={settingsicon} alt="Settings" />
                </button>
                </Tooltip>
                <Tooltip content="Filters">
                <button className="wtw-header-button" onClick={() => setShowFiltersPopup(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M7 12h10M10 18h4" />
                  </svg>
                </button>
                </Tooltip>
                <Tooltip content="Presets">
                  <button className="wtw-header-button" onClick={() => setpopup?.(37)}>P1</button>
                </Tooltip>
                <div className="wtw-combined-flash-input">
                  <img className="edit-spectra-quick-buy-icon" src={lightning} alt="" />

                  <input
                    type="text"
                    className="wtw-combined-input"
                    placeholder="0.0"
                    onFocus={(e) => e.target.placeholder = ''}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        e.target.placeholder = '0.0';
                      }
                    }}
                  />
                  <img src={monadicon} className="wtw-combined-mon-icon" alt="MON" />
                </div>
              </div>
            )}
            <Tooltip content="Open Wallet Tracker in a new tab">
              <button
                className="wtw-open-new-tab-button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`${window.location.origin}/tracker`, '_blank');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="wtw-link-icon">
                  <path d="M15 3h6v6" />
                  <path d="M10 14 21 3" />
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                </svg>
              </button>
            </Tooltip>
            <Tooltip content="Close">
              <button className="wtw-filters-close-button" onClick={onClose}>
                <X size={16} />
              </button>
            </Tooltip>
          </div>
          <div className="quickbuy-drag-handle">
            <div className="circle-row">
              <img src={circle} className="circle" />
            </div>
          </div>
        </div>


        {activeTab === 'wallets' && (
          <div className="wtw-header">

            <div className="wtw-header-actions">
              <div className="wtw-search-bar">
                <div className="wtw-search">
                  <Search size={14} className="wtw-search-icon" />
                  <input
                    type="text"
                    className="wtw-search-input"
                    placeholder="Search by name or addr..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <button
                className="wtw-import-button"
                onClick={() => setShowImportPopup(true)}
              >
                Import
              </button>
              <button
                className="wtw-export-button"
                onClick={handleExport}
              >
                Export
              </button>
              <button
                className="wtw-add-button"
                onClick={() => setShowAddWalletModal(true)}
              >
                Add Wallet
              </button>
            </div>
          </div>
        )}


        {activeTab === 'monitor' && (
          <div className="wtw-header">
            <div className="wtw-header-actions">
              <button className="wtw-header-button" onClick={() => setShowMonitorFiltersPopup(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M7 12h10M10 18h4" />
                </svg>
              </button>
              <button
                className="wtw-header-button"
                onClick={() => setMonitorCurrency(prev => prev === 'USD' ? 'MON' : 'USD')}
              >
                {monitorCurrency === 'USD' ? 'USD' : 'MON'}
              </button>
              <button className="wtw-header-button" onClick={() => setpopup?.(34)}>P1</button>
              <div className="wtw-combined-flash-input">
                <img className="edit-spectra-quick-buy-icon" src={lightning} alt="" />

                <input
                  type="text"
                  className="wtw-combined-input"
                  placeholder="0.0"
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      e.target.placeholder = '0.0';
                    }
                  }}
                />
                <img src={monadicon} className="wtw-combined-mon-icon" alt="MON" />
              </div>
            </div>
          </div>

        )}


        {activeTab === 'monitor' && (
          <div className="wtw-search-bar">
            <div className="wtw-search">
              <Search size={14} className="wtw-search-icon" />
              <input
                type="text"
                className="wtw-search-input"
                placeholder="Search by name or ticker"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="wtw-content">
          {activeTab === 'wallets' && (
            <div className="wtw-wallet-manager">
              <div className="wtw-wallets-header" data-wallet-count={filteredWallets.length}>
                <div className="wtw-wallet-header-cell wtw-wallet-created">Created</div>
                <div className="wtw-wallet-header-cell wtw-wallet-profile">Name</div>
                <div
                  className={`wtw-wallet-header-cell wtw-wallet-balance sortable ${sortBy === 'balance' ? 'active' : ''}`}
                  onClick={() => handleSort('balance')}
                >
                  Balance
                </div>
                <div
                  className={`wtw-wallet-header-cell wtw-wallet-last-active sortable ${sortBy === 'lastActive' ? 'active' : ''}`}
                  onClick={() => handleSort('lastActive')}
                >
                  Last Active
                </div>
                <div
                  className="wtw-wallet-header-cell wtw-wallet-remove sortable"
                  onClick={handleRemoveAll}
                >
                  Remove All
                </div>
              </div>

              <div className="wtw-wallets-container">
                {filteredWallets.length === 0 ? (
                  <div className="wtw-empty-state">
                    <div className="wtw-empty-content">
                      <h4>No Wallets Found</h4>
                      <p>Add a wallet to start tracking</p>
                    </div>
                  </div>
                ) : (
                  filteredWallets.map((wallet) => (
                    <div key={wallet.id} className="wtw-wallet-item">
                      <div className="wtw-wallet-created">
                        <span className="wtw-wallet-created-date">
                          {formatCreatedDate(wallet.createdAt)}
                        </span>
                      </div>


                      <div className="wtw-wallet-profile">
                        <div className="wtw-wallet-avatar">
                          <span className="wtw-wallet-emoji-avatar">{wallet.emoji}</span>
                        </div>
                        <div className="wtw-wallet-name-display">
                          <div className="wtw-wallet-name-container">
                            {editingWallet === wallet.id ? (
                              <input
                                type="text"
                                className="wtw-wallet-name-input"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={() => saveWalletName(wallet.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveWalletName(wallet.id);
                                  if (e.key === 'Escape') {
                                    setEditingWallet(null);
                                    setEditingName('');
                                  }
                                }}
                                autoFocus
                                onFocus={(e) => e.target.select()}
                                style={{ width: `${editingName.length * 8 + 12}px` }}
                              />
                            ) : (
                              <div className="wtw-wallet-name-display">
                                <span className="wtw-wallet-name">
                                  {wallet.name}
                                </span>
                                <Edit2
                                  size={12}
                                  className="wtw-wallet-name-edit-icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingWallet(wallet);
                                  }}
                                />
                              </div>
                            )}
                            <div className="wtw-wallet-address">
                              {formatAddress(wallet.address)}
                              <button
                                className="wtw-copy-address"
                                onClick={() => handleCopyAddress(wallet.address)}
                              >
                                <img src={copy} alt="copy" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="wtw-wallet-balance">
                        <img src={monadicon} className="wtw-balance-icon" alt="MON" />
                        <span className="wtw-balance-value">
                          {(() => {
                            const b = walletTokenBalances[wallet.address] || walletTokenBalances[wallet.address.toLowerCase()];
                            const ethToken = chainCfg?.eth;

                            let balanceInMON;
                            if (b && ethToken) {
                              balanceInMON = Number(b[ethToken] || b[ethToken?.toLowerCase()] || b[ethToken?.toUpperCase()] || 0) / 1e18;
                            } else {
                              balanceInMON = wallet.balance || 0;
                            }
                            return balanceInMON.toFixed(2);
                          })()}
                        </span>

                      </div>

                      <div className="wtw-wallet-last-active">
                        <span className="wtw-wallet-last-active-time">
                          {lastActiveLabel(wallet)}
                        </span>
                      </div>

                      <div className="wtw-wallet-actions">
                        <Tooltip content="View on Explorer">
                          <a
                            href={`${chainCfg?.explorer}/address/${wallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wtw-wallet-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <svg
                              className="wtw-action-icon-svg"
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                              <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
                            </svg>
                          </a>
                        </Tooltip>

                        <Tooltip content="Delete Wallet">
                          <button
                            className="wtw-wallet-action-btn wtw-delete-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteWallet(wallet.id);
                            }}
                          >
                            <img src={trash} className="wtw-action-icon" alt="Delete" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'trades' && renderLiveTrades()}

          {activeTab === 'monitor' && renderMonitor()}
        </div>
        {showDeleteAllConfirm && (
          <div className="tracker-modal-backdrop" onClick={() => setShowDeleteAllConfirm(false)}>
            <div className="tracker-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="tracker-modal-header">
                <h3 className="tracker-modal-title">Delete All Wallets</h3>
                <button className="tracker-modal-close" onClick={() => setShowDeleteAllConfirm(false)}>
                  <img src={closebutton} className="close-button-icon" />
                </button>
              </div>
              <div className="tracker-modal-content">
                <div className="tracker-delete-warning">
                  <p>Are you sure you want to remove all wallets from tracking?</p>
                  <p>This action cannot be undone.</p>
                </div>

                <div className="tracker-modal-actions">
                  <button
                    className="tracker-delete-confirm-button"
                    onClick={confirmDeleteAll}
                  >
                    Delete All Wallets
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showDeleteConfirm && (
          <div className="tracker-modal-backdrop" onClick={() => {
            setShowDeleteConfirm(null);
            setDontShowDeleteAgain(false);
          }}>
            <div className="tracker-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="tracker-modal-header">
                <h3 className="tracker-modal-title">Delete Wallet</h3>
                <button className="tracker-modal-close" onClick={() => {
                  setShowDeleteConfirm(null);
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
                    onClick={() => handleDeleteWallet(showDeleteConfirm)}
                  >
                    Delete Wallet
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

        {showMonitorFiltersPopup && (
          <MonitorFiltersPopup
            onClose={() => setShowMonitorFiltersPopup(false)}
            onApply={handleApplyMonitorFilters}
            initialFilters={monitorFilters}
          />
        )}

        {showImportPopup && (
          <ImportWalletsPopup
            onClose={() => setShowImportPopup(false)}
            onImport={handleImportWallets}
          />
        )}

        {showAddWalletModal && (
          <AddWalletModal
            onClose={() => setShowAddWalletModal(false)}
            onAdd={handleAddWallet}
            existingWallets={localWallets}
          />
        )}

        {!isSnapped && (
          <>
            <div className="wtw-resize-handle top-left" onMouseDown={(e) => handleResizeStart(e, 'top-left')} />
            <div className="wtw-resize-handle top-right" onMouseDown={(e) => handleResizeStart(e, 'top-right')} />
            <div className="wtw-resize-handle bottom-left" onMouseDown={(e) => handleResizeStart(e, 'bottom-left')} />
            <div className="wtw-resize-handle bottom-right" onMouseDown={(e) => handleResizeStart(e, 'bottom-right')} />
            <div className="wtw-resize-handle top" onMouseDown={(e) => handleResizeStart(e, 'top')} />
            <div className="wtw-resize-handle bottom" onMouseDown={(e) => handleResizeStart(e, 'bottom')} />
            <div className="wtw-resize-handle left" onMouseDown={(e) => handleResizeStart(e, 'left')} />
            <div className="wtw-resize-handle right" onMouseDown={(e) => handleResizeStart(e, 'right')} />
          </>
        )}

        {isSnapped === 'left' && (
          <div className="wtw-resize-handle right snapped-resize" onMouseDown={(e) => handleResizeStart(e, 'right')} />
        )}
        {isSnapped === 'right' && (
          <div className="wtw-resize-handle left snapped-resize" onMouseDown={(e) => handleResizeStart(e, 'left')} />
        )}
      </div>
    </>
  );
};

export default WalletTrackerWidget;