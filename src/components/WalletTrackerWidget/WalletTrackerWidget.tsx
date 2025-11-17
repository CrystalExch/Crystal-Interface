import React, { useCallback, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Edit2 } from 'lucide-react';
import './WalletTrackerWidget.css';
import monadicon from '../../assets/monadlogo.svg';
import copy from '../../assets/copy.svg';
import trash from '../../assets/trash.svg';
import defaultPfp from '../../assets/leaderboard_default.png';
import closebutton from '../../assets/close_button.png';
import filtericon from '../../assets/filtercup.svg';
import settingsicon from '../../assets/settings.svg';
import filter from '../../assets/filter.svg';
import ImportWalletsPopup from '../Tracker/ImportWalletsPopup';
import AddWalletModal, { TrackedWallet } from '../Tracker/AddWalletModal';
import LiveTradesFiltersPopup from '../Tracker/LiveTradesFiltersPopup/LiveTradesFiltersPopup';
import { FilterState } from '../Tracker/Tracker';
import MonitorFiltersPopup, { MonitorFilterState } from '../Tracker/MonitorFiltersPopup/MonitorFiltersPopup';
import circle from '../../assets/circle_handle.png';
import lightning from '../../assets/flash.png';
import SortArrow from '../OrderCenter/SortArrow/SortArrow';
import { useNavigate } from 'react-router-dom';
import { encodeFunctionData } from 'viem';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi.ts';
import { NadFunAbi } from '../../abis/NadFun.ts';
import { settings as appSettings } from '../../settings';
import {
  showLoadingPopup,
  updatePopup,
} from '../MemeTransactionPopup/MemeTransactionPopupManager';

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
  sendUserOperationAsync?: any;
  terminalRefetch?: any;
  nonces?: any;
  subWallets?: Array<{ address: string; privateKey: string }>;
  activeWalletPrivateKey?: string;
  account?: {
    connected: boolean;
    address?: string;
    chainId?: number;
  };
  selectedWallets?: Set<string>;
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
  }
  return [];
};

const saveWalletsToStorage = (wallets: TrackedWallet[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
  } catch (error) {
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


const formatTradeTime = (timestamp: number) => {
  if (!timestamp) return '0s';

  const now = Date.now();
  const tradeTime = timestamp > 1e12 ? timestamp : timestamp * 1000;
  const secondsAgo = Math.max(0, Math.floor((now - tradeTime) / 1000));

  if (secondsAgo < 60) return `${secondsAgo}s`;
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h`;
  return `${Math.floor(secondsAgo / 86400)}d`;
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
  sendUserOperationAsync,
  terminalRefetch,
  nonces,
  subWallets,
  activeWalletPrivateKey,
  account,
  selectedWallets,
}) => {
  const crystal = '/CrystalLogo.png';
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TrackerTab>('wallets');
  const [searchQuery, setSearchQuery] = useState('');
  const [localWallets, setLocalWallets] = useState<TrackedWallet[]>([]);
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [dontShowDeleteAgain, setDontShowDeleteAgain] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [sortBy, setSortBy] = useState<'created' | 'name' | 'balance' | 'lastActive' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [walletCurrency, setWalletCurrency] = useState<'USD' | 'MON'>('USD');
  const [tradeAmountCurrency, setTradeAmountCurrency] = useState<'USD' | 'MON'>('USD');
  const [showFiltersPopup, setShowFiltersPopup] = useState(false);
  const [showMonitorFiltersPopup, setShowMonitorFiltersPopup] = useState(false);
  const [hoveredTradeRow, setHoveredTradeRow] = useState<string | null>(null);
  const [buyingTrade, setBuyingTrade] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });

  const handleImageHover = useCallback((tradeId: string) => {
    setHoveredImage(tradeId);
  }, []);

  const handleImageLeave = useCallback(() => {
    setHoveredImage(null);
    setShowPreview(false);
  }, []);

  const updatePreviewPosition = useCallback((containerElement: HTMLElement) => {
    if (!containerElement) return;

    const rect = containerElement.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    const viewportWidth = window.innerWidth;
    const previewWidth = 220;
    const offset = 10;

    let left = rect.right + scrollX + offset;

    if (left + previewWidth > viewportWidth) {
      left = rect.left + scrollX - previewWidth - offset;
    }

    const top = rect.top + scrollY;

    setPreviewPosition({ top, left });
    setTimeout(() => setShowPreview(true), 10);
  }, []);
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

  const [showImportPopup, setShowImportPopup] = useState(false);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);

  const chainCfg = chainCfgOf(activechain, settings);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('wtw-resize-handle')) {
      return;
    }
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
  const getMaxSpendableWei = useCallback(
    (addr: string): bigint => {
      const balances = walletTokenBalances[addr];
      if (!balances) return 0n;

      const ethToken = tokenList?.find(
        (t: any) => t.address === chainCfg?.eth,
      );
      if (!ethToken || !balances[ethToken.address]) return 0n;

      let raw = balances[ethToken.address];
      if (raw <= 0n) return 0n;

      const gasReserve = BigInt(chainCfg?.gasamount ?? 0);
      const safe = raw > gasReserve ? raw - gasReserve : 0n;

      return safe;
    },
    [walletTokenBalances, tokenList, chainCfg],
  );

  const handleTradeQuickBuy = useCallback(
    async (trade: any, quickAmount: string) => {
      const val = BigInt(Math.floor(parseFloat(quickAmount) * 1e18));
      if (val === 0n || !trade.tokenAddress) return;

      const targets: string[] = Array.from(selectedWallets || new Set());
      const txId = `quickbuy-trade-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      setBuyingTrade(trade.id);

      try {
        if (showLoadingPopup) {
          showLoadingPopup(txId, {
            title: 'Sending batch buy...',
            subtitle: `Buying ${quickAmount} MON of ${trade.tokenName || trade.token} across ${targets.length || 1} wallet${targets.length > 1 ? 's' : ''}`,
            amount: quickAmount,
            amountUnit: 'MON',
            tokenImage: trade.tokenIcon,
          });
        }

        const isNadFun = trade.launchpad === 'nadfun';
        const contractAddress = isNadFun
          ? appSettings.chainConfig[activechain].nadFunRouter
          : appSettings.chainConfig[activechain].launchpadRouter;

        let remaining = val;
        const plan: { addr: string; amount: bigint }[] = [];
        const transferPromises = [];

        if (targets.length > 0) {
          for (const addr of targets) {
            const maxWei = getMaxSpendableWei(addr);
            const fairShare = val / BigInt(targets.length);
            const allocation = fairShare > maxWei ? maxWei : fairShare;
            if (allocation > 0n) {
              plan.push({ addr, amount: allocation });
              remaining -= allocation;
            } else {
              plan.push({ addr, amount: 0n });
            }
          }

          for (const entry of plan) {
            if (remaining <= 0n) break;
            const maxWei = getMaxSpendableWei(entry.addr);
            const room = maxWei - entry.amount;
            if (room > 0n) {
              const add = remaining > room ? room : remaining;
              entry.amount += add;
              remaining -= add;
            }
          }

          if (remaining > 0n) {
            if (updatePopup) {
              updatePopup(txId, {
                title: 'Batch buy failed',
                subtitle: 'Not enough MON balance across selected wallets',
                variant: 'error',
                isLoading: false,
              });
            }
            setBuyingTrade(null);
            return;
          }

          for (const { addr, amount: partWei } of plan) {
            if (partWei <= 0n) continue;

            const wally = subWallets?.find((w: any) => w.address === addr);
            const pk = wally?.privateKey ?? activeWalletPrivateKey;
            if (!pk) continue;

            let uo;

            if (isNadFun) {
              uo = {
                target: contractAddress as `0x${string}`,
                data: encodeFunctionData({
                  abi: NadFunAbi,
                  functionName: 'buy',
                  args: [{
                    amountOutMin: 0n,
                    token: trade.devAddress as `0x${string}`,
                    to: account?.address as `0x${string}`,
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 600),
                  }],
                }),
                value: partWei,
              };
            } else {
              uo = {
                target: contractAddress as `0x${string}`,
                data: encodeFunctionData({
                  abi: CrystalRouterAbi,
                  functionName: 'buy',
                  args: [true, trade.tokenAddress as `0x${string}`, partWei, 0n],
                }),
                value: partWei,
              };
            }

            const wallet = nonces?.current.get(addr);
            const params = [{ uo }, 0n, 0n, false, pk, wallet?.nonce];
            if (wallet) wallet.nonce += 1;
            wallet?.pendingtxs.push(params);

            const transferPromise = sendUserOperationAsync(...params)
              .then(() => {
                if (wallet)
                  wallet.pendingtxs = wallet.pendingtxs.filter(
                    (p: any) => p[5] != params[5],
                  );
                return true;
              })
              .catch(() => {
                if (wallet)
                  wallet.pendingtxs = wallet.pendingtxs.filter(
                    (p: any) => p[5] != params[5],
                  );
                return false;
              });
            transferPromises.push(transferPromise);
          }
        } else {
          if (account?.address) {
            let uo;

            if (isNadFun) {
              uo = {
                target: contractAddress as `0x${string}`,
                data: encodeFunctionData({
                  abi: NadFunAbi,
                  functionName: 'buy',
                  args: [{
                    amountOutMin: 0n,
                    token: trade.devAddress as `0x${string}`,
                    to: account.address as `0x${string}`,
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 600),
                  }],
                }),
                value: val,
              };
            } else {
              uo = {
                target: contractAddress as `0x${string}`,
                data: encodeFunctionData({
                  abi: CrystalRouterAbi,
                  functionName: 'buy',
                  args: [true, trade.tokenAddress as `0x${string}`, val, 0n],
                }),
                value: val,
              };
            }

            const transferPromise = sendUserOperationAsync({ uo });
            transferPromises.push(transferPromise);
          }
        }

        const results = await Promise.allSettled(transferPromises);
        const successfulTransfers = results.filter(
          (result) => result.status === 'fulfilled' && result.value === true,
        ).length;

        if (terminalRefetch) terminalRefetch();

        if (updatePopup) {
          updatePopup(txId, {
            title: `Bought ${quickAmount} MON Worth`,
            subtitle: `Distributed across ${successfulTransfers} wallet${successfulTransfers !== 1 ? 's' : ''}`,
            variant: 'success',
            confirmed: true,
            isLoading: false,
            tokenImage: trade.tokenIcon,
          });
        }
      } catch (e: any) {
        console.error('Quick buy failed', e);
        const msg = String(e?.message ?? '');
        if (updatePopup) {
          updatePopup(txId, {
            title: msg.toLowerCase().includes('insufficient')
              ? 'Insufficient Balance'
              : 'Buy Failed',
            subtitle: msg || 'Transaction failed',
            variant: 'error',
            confirmed: true,
            isLoading: false,
            tokenImage: trade.tokenIcon,
          });
        }
      } finally {
        setBuyingTrade(null);
      }
    },
    [
      selectedWallets,
      subWallets,
      activeWalletPrivateKey,
      getMaxSpendableWei,
      account,
      nonces,
      terminalRefetch,
      activechain,
      sendUserOperationAsync,
    ],
  );
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
  const [pausedTrades, setPausedTrades] = useState(false);
  const pausedTradesQueue = useRef<any[]>([]);
  const lastTradeCount = useRef(0);
  const lastActiveLabel = (w: TrackedWallet) => {
    const ts = w.lastActiveAt ?? new Date(w.createdAt).getTime();
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  useEffect(() => {
    if (externalWallets) {
      setLocalWallets(externalWallets);
    } else {
      setLocalWallets(loadWalletsFromStorage());
    }
  }, [externalWallets]);

  useEffect(() => {
    if (!externalWallets && localWallets.length >= 0) {
      saveWalletsToStorage(localWallets);
      window.dispatchEvent(new CustomEvent('wallets-updated', { detail: { wallets: localWallets, source: 'widget' } }));
    }
    if (onWalletsChange) {
      onWalletsChange(localWallets);
    }
  }, [localWallets, externalWallets, onWalletsChange]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const updatedWallets = JSON.parse(e.newValue);
          setLocalWallets(updatedWallets);
        } catch (error) {
        }
      }
    };

    const handleCustomWalletUpdate = (e: CustomEvent) => {
      if (e.detail && e.detail.source !== 'widget' && !externalWallets) {
        const updatedWallets = e.detail.wallets;
        if (JSON.stringify(updatedWallets) !== JSON.stringify(localWallets)) {
          setLocalWallets(updatedWallets);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener('wallets-updated', handleCustomWalletUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('wallets-updated', handleCustomWalletUpdate as EventListener);
    };
  }, [externalWallets, localWallets]);
  const handleSort = (field: 'created' | 'name' | 'balance' | 'lastActive') => {
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
      let aVal: number | string, bVal: number | string;

      if (sortBy === 'balance') {
        aVal = a.balance || 0;
        bVal = b.balance || 0;
      } else if (sortBy === 'lastActive') {
        aVal = a.lastActiveAt || 0;
        bVal = b.lastActiveAt || 0;
      } else if (sortBy === 'created') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else if (sortBy === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else {
        return 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
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

  const getFilteredTrades = () => {
    let trades = allTrades;

    // Handle paused state
    if (pausedTrades) {
      // Check if there are new trades since we paused
      if (allTrades.length > lastTradeCount.current) {
        const newTrades = allTrades.slice(0, allTrades.length - lastTradeCount.current);
        pausedTradesQueue.current = [...pausedTradesQueue.current, ...newTrades];
        // Only show the trades that existed when we started hovering
        trades = allTrades.slice(allTrades.length - lastTradeCount.current);
      } else {
        trades = allTrades;
      }
    }

    // Apply filters
    trades = trades.filter((trade: any) => {
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

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      trades = trades.filter((trade: any) =>
        trade.walletName?.toLowerCase().includes(query) ||
        trade.token?.toLowerCase().includes(query) ||
        trade.tokenName?.toLowerCase().includes(query)
      );
    }

    return trades;
  };

  const formatAmount = (amount: number, decimals: number = 2) => {
    if (amount >= 1e9) {
      return `${(amount / 1e9).toFixed(decimals)}B`;
    }
    if (amount >= 1e6) {
      return `${(amount / 1e6).toFixed(decimals)}M`;
    }
    if (amount >= 1e3) {
      return `${(amount / 1e3).toFixed(decimals)}K`;
    }
    return amount.toFixed(decimals);
  };
  const handleTradesBodyHover = useCallback(() => {
    setPausedTrades(true);
    lastTradeCount.current = allTrades.length;
  }, [allTrades.length]);

  const handleTradesBodyLeave = useCallback(() => {
    setPausedTrades(false);
    pausedTradesQueue.current = [];
    lastTradeCount.current = allTrades.length;
  }, [allTrades.length]);
  const renderLiveTrades = () => {
    const filteredTrades = getFilteredTrades();

    const getQuickbuyAmount = () => {
      const input = document.querySelector('.wtw-combined-input') as HTMLInputElement;
      return input?.value || '1';
    };

    return (
      <div className="wtw-live-trades">
        <div className="wtw-detail-trades-table">
          <div className="wtw-detail-trades-header">
            <div className="wtw-detail-trades-header-cell wtw-detail-trades-time">
              {pausedTrades && (
                <div className="wtw-trades-pause-icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7 19h2V5H7v14zm8-14v14h2V5h-2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="wtw-detail-trades-header-cell wtw-detail-trades-account">Name</div>
            <div className="wtw-detail-trades-header-cell">Token</div>
            <div
              className="wtw-detail-trades-header-cell"
              style={{ cursor: 'pointer' }}
              onClick={() => setTradeAmountCurrency(prev => prev === 'USD' ? 'MON' : 'USD')}
            >
              Amount ({tradeAmountCurrency})
            </div>
            <div className="wtw-detail-trades-header-cell">Market Cap</div>
          </div>
          <div
            className="wtw-detail-trades-body"
            onMouseEnter={handleTradesBodyHover}
            onMouseLeave={handleTradesBodyLeave}
          >
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
                  onMouseEnter={() => setHoveredTradeRow(trade.id)}
                  onMouseLeave={() => setHoveredTradeRow(null)}
                >
                  <div className="wtw-detail-trades-col wtw-detail-trades-time">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: '#e3e4f0bd', fontWeight: '300' }}>
                      <span>{trade.timestamp ? formatTradeTime(trade.timestamp) : (trade.time || '0s')}</span>
                    </div>
                  </div>

                  <div className="wtw-detail-trades-col wtw-detail-trades-account">
                    <div className="wtw-detail-trades-avatar">
                      <span style={{ fontSize: '15px' }}>
                        {trade.emoji}
                      </span>
                    </div>
                    <div className={`wtw-detail-trades-address ${trade.type === 'sell' ? 'sell' : trade.type === 'buy' ? 'buy' : ''}`}>
                      {trade.walletName}
                    </div>
                  </div>

                  <div className="wtw-detail-trades-col">
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                      onClick={() => {
                        if (trade.tokenAddress) {
                          navigate(`/meme/${trade.tokenAddress}`);
                        }
                      }}
                    >
                      {trade.tokenIcon && (
                        <div
                          style={{ position: 'relative' }}
                          onMouseEnter={(e) => {
                            handleImageHover(trade.id);
                            updatePreviewPosition(e.currentTarget);
                          }}
                          onMouseLeave={handleImageLeave}
                        >
                          <img src={trade.tokenIcon} className="wtw-asset-icon" alt={trade.tokenName || trade.token} />
                          <img src={crystal} className="wtw-launchpad-logo crystal" />
                        </div>
                      )}
                      <div className="wtw-asset-details">
                        <div className="wtw-asset-ticker">{trade.token}</div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="wtw-detail-trades-col"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setTradeAmountCurrency(prev => prev === 'USD' ? 'MON' : 'USD')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {tradeAmountCurrency === 'MON' && (
                        <img src={monadicon} style={{ width: '14px', height: '14px' }} alt="MON" />
                      )}
                      <span
                        className={[
                          'wtw-detail-trades-amount',
                          trade.type === 'buy' ? 'wtw-amount-buy' : 'wtw-amount-sell'
                        ].join(' ')}
                      >
                        {trade.amount === 0 || isNaN(trade.amount)
                          ? (tradeAmountCurrency === 'USD' ? '$0.00' : '0.00')
                          : (() => {
                            if (tradeAmountCurrency === 'USD') {
                              const usd = monUsdPrice ? trade.amount * monUsdPrice : trade.amount;
                              return '$' + formatAmount(usd, 2);
                            } else {
                              return formatAmount(trade.amount, 2);
                            }
                          })()}
                      </span>
                    </div>
                  </div>

                  <div className="wtw-detail-trades-col">
                    {hoveredTradeRow === trade.id ? (
                      <button
                        className={`wtw-trade-quickbuy-btn ${buyingTrade === trade.id ? 'loading' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const amount = getQuickbuyAmount();
                          handleTradeQuickBuy(trade, amount);
                        }}
                        disabled={buyingTrade === trade.id}
                      >
                        {buyingTrade === trade.id ? (
                          <div className="wtw-quickbuy-spinner" />
                        ) : (
                          <>
                            <img src={lightning} className="wtw-quickbuy-icon" alt="Buy" />
                            {getQuickbuyAmount()}
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="wtw-market-cap-value">
                        {trade.marketCap === 0 || isNaN(trade.marketCap)
                          ? '$0.0'
                          : (() => {
                            const usd = monUsdPrice ? trade.marketCap * monUsdPrice : trade.marketCap;
                            return '$' + formatAmount(usd, 1);
                          })()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {hoveredImage && showPreview && (() => {
          const trade = filteredTrades.find((t: any) => t.id === hoveredImage);
          if (!trade || !trade.tokenIcon) return null;

          return createPortal(
            <div
              className="wtw-image-preview show"
              style={{
                position: 'absolute',
                top: `${previewPosition.top}px`,
                left: `${previewPosition.left}px`,
                zIndex: 9999,
                pointerEvents: 'none',
              }}
            >
              <img
                src={trade.tokenIcon}
                alt={trade.tokenName || trade.token}
                className="wtw-preview-image"
              />
            </div>,
            document.body
          );
        })()}
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
        <div className="wtw-filters-header" onMouseDown={handleDragStart}>
          <div className="wtw-tabs">
            <button
              className={`wtw-tab ${activeTab === 'wallets' ? 'active' : ''}`}
              onClick={() => setActiveTab('wallets')}
            >
              Manager
            </button>
            <button
              className={`wtw-tab ${activeTab === 'trades' ? 'active' : ''}`}
              onClick={() => setActiveTab('trades')}
            >
              Trades
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
                    <img src={filtericon} className="wtw-filter-image" />
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
                  window.open(`${window.location.origin}/trackers`, '_blank');
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

        <div className="wtw-content">
          {activeTab === 'wallets' && (
            <div className="wtw-wallet-manager">
              <div className="wtw-wallets-header" data-wallet-count={filteredWallets.length}>
                <div
                  className={`wtw-wallet-header-cell wtw-wallet-created sortable ${sortBy === 'created' ? 'active' : ''}`}
                  onClick={() => handleSort('created')}
                >
                  Created
                  <SortArrow sortDirection={sortBy === 'created' ? sortDirection : undefined} />
                </div>
                <div
                  className={`wtw-wallet-header-cell wtw-wallet-profile sortable ${sortBy === 'name' ? 'active' : ''}`}
                  onClick={() => handleSort('name')}
                >
                  Name
                  <SortArrow sortDirection={sortBy === 'name' ? sortDirection : undefined} />
                </div>
                <div
                  className={`wtw-wallet-header-cell wtw-wallet-balance sortable ${sortBy === 'balance' ? 'active' : ''}`}
                  onClick={() => handleSort('balance')}
                >
                  Balance
                  <SortArrow sortDirection={sortBy === 'balance' ? sortDirection : undefined} />
                </div>
                <div
                  className={`wtw-wallet-header-cell wtw-wallet-last-active sortable ${sortBy === 'lastActive' ? 'active' : ''}`}
                  onClick={() => handleSort('lastActive')}
                >
                  Last Active
                  <SortArrow sortDirection={sortBy === 'lastActive' ? sortDirection : undefined} />
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