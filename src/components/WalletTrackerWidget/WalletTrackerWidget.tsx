import React, { useCallback, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import './WalletTrackerWidget.css';
import monadicon from '../../assets/monadlogo.svg';
import copy from '../../assets/copy.svg';
import trash from '../../assets/trash.svg';
import defaultPfp from '../../assets/avatar.png';
import settingsicon from '../../assets/settings.svg';
import filter from '../../assets/filter.svg';
import ImportWalletsPopup from '../Tracker/ImportWalletsPopup';

interface TrackedWallet {
  address: string;
  name: string;
  emoji: string;
  balance: number;
  lastActiveAt: number | null;
  id: string;
  createdAt: string;
}

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
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const WtwTooltip: React.FC<{
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
      className="wtw-tooltip-container"
      onMouseEnter={() => setVis(true)}
      onMouseLeave={() => setVis(false)}
    >
      {children}
      {vis && createPortal(
        <div
          className={`wtw-tooltip wtw-tooltip-${position} wtw-fade-popup wtw-visible`}
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
          <div className="wtw-tooltip-content">
            {content}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const WalletTrackerWidget: React.FC<WalletTrackerWidgetProps> = ({
  isOpen,
  onClose,
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
  const [activeTab, setActiveTab] = useState<TrackerTab>('wallets');
  const [searchQuery, setSearchQuery] = useState('');
  const [localWallets, setLocalWallets] = useState<TrackedWallet[]>([]);
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
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

  // Import and Add Wallet modals
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletEmoji, setNewWalletEmoji] = useState('😀');

  // Toggle popup functions
  const handleTogglePopup = (popupId: number) => {
    if (currentPopup === popupId) {
      setpopup?.(0);
    } else {
      setpopup?.(popupId);
    }
  };

  const chainCfg = chainCfgOf(activechain, settings);

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
    }
    if (onWalletsChange) {
      onWalletsChange(localWallets);
    }
  }, [localWallets, externalWallets, onWalletsChange]);

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

  const handleDeleteWallet = (id: string) => {
    setLocalWallets((prev) => prev.filter((w) => w.id !== id));
    setShowDeleteConfirm(null);
  };

  const handleRemoveAll = () => {
    if (window.confirm('Remove all wallets?')) {
      setLocalWallets([]);
    }
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

  const handleAddWallet = () => {
    if (!newWalletAddress.trim()) return;

    const newWallet: TrackedWallet = {
      address: newWalletAddress.trim(),
      name: newWalletName.trim() || 'New Wallet',
      emoji: newWalletEmoji,
      balance: 0,
      lastActiveAt: null,
      id: `wallet-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
    };

    setLocalWallets((prev) => [...prev, newWallet]);
    setShowAddWalletModal(false);
    setNewWalletAddress('');
    setNewWalletName('');
    setNewWalletEmoji('😀');
  };

  // Trade filtering and sorting
  const getFilteredTrades = () => {
    const walletAddressSet = new Set(localWallets.map(w => w.address.toLowerCase()));

    let filtered = allTrades.filter((trade: any) => {
      const tradeWalletAddr = trade.walletAddress?.toLowerCase();
      if (!walletAddressSet.has(tradeWalletAddr)) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          trade.walletName?.toLowerCase().includes(query) ||
          trade.tokenName?.toLowerCase().includes(query) ||
          trade.token?.toLowerCase().includes(query)
        );
      }
      return true;
    });

    if (tradeSortField) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = 0, bVal = 0;
        if (tradeSortField === 'amount') {
          aVal = a.amount || 0;
          bVal = b.amount || 0;
        } else if (tradeSortField === 'marketCap') {
          aVal = a.marketCap || 0;
          bVal = b.marketCap || 0;
        }
        return tradeSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
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
          <div className="wtw-detail-trades-table-header">
            <div className="wtw-detail-trades-header-cell wtw-detail-trades-account">Account</div>
            <div className="wtw-detail-trades-header-cell" style={{minWidth: '100px', width: '100px'}}>Token</div>
            <div
              className={`wtw-detail-trades-header-cell wtw-sortable ${tradeSortField === 'amount' ? 'active' : ''}`}
              style={{minWidth: '100px', width: '100px'}}
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

                  <div className="wtw-detail-trades-col" style={{minWidth: '120px', width: '120px'}}>
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
    <div className="wtw-overlay" onClick={onClose}>
      <div className="wtw-container" onClick={(e) => e.stopPropagation()}>
        {/* Filters Header */}
        <div className="wtw-filters-header">
          <h2 className="wtw-filters-title">Wallet Tracker</h2>
          <button className="wtw-filters-close-button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Header */}
        <div className="wtw-header">
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

          {activeTab === 'wallets' && (
            <div className="wtw-header-actions">
              <button
                className="wtw-header-button"
                onClick={() => setShowImportPopup(true)}
              >
                Import
              </button>
              <button
                className="wtw-header-button"
                onClick={handleExport}
                disabled={localWallets.length === 0}
              >
                Export
              </button>
              <button
                className="wtw-header-button"
                onClick={() => setWalletCurrency(prev => prev === 'USD' ? 'MON' : 'USD')}
              >
                {walletCurrency === 'USD' ? 'USD' : 'MON'}
              </button>
              <button
                className="wtw-add-button"
                onClick={() => setShowAddWalletModal(true)}
              >
                Add Wallet
              </button>
            </div>
          )}

          {activeTab === 'trades' && (
            <div className="wtw-header-actions">
              <button className="wtw-header-button" onClick={() => handleTogglePopup(33)}>
                <img className="wtw-settings-image" src={settingsicon} alt="Settings" />
              </button>
              <button className="wtw-header-button" onClick={() => setShowFiltersPopup(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M7 12h10M10 18h4" />
                </svg>
              </button>
              <button className="wtw-header-button" onClick={() => handleTogglePopup(37)}>P1</button>
              <div className="wtw-combined-flash-input">
                <button className="wtw-combined-flash-btn" onClick={() => handleTogglePopup(33)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </button>
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

          {activeTab === 'monitor' && (
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
              <button className="wtw-header-button" onClick={() => handleTogglePopup(34)}>P1</button>
              <div className="wtw-combined-flash-input">
                <button className="wtw-combined-flash-btn" onClick={() => handleTogglePopup(33)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </button>
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
        </div>

        {/* Search Bar - Full width */}
        {activeTab === 'wallets' && (
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
              {/* Table Header - Exact copy of tracker-wallets-header */}
              <div className="wtw-wallets-header" data-wallet-count={filteredWallets.length}>
                <div className="wtw-wallet-header-cell wtw-wallet-created">Created</div>
                <div className="wtw-wallet-header-cell wtw-wallet-drag-handle"></div>
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
              </div>

              {/* Wallet Items Container */}
              <div className="wtw-wallets-container">
                {filteredWallets.length === 0 ? (
                  <div className="wtw-empty-state">
                    <div className="wtw-empty-content">
                      <h4>No Wallets Found</h4>
                      <p>Add a wallet to start tracking</p>
                      <button className="wtw-cta-button" onClick={() => alert('Add wallet')}>
                        Add Wallet
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredWallets.map((wallet) => (
                    <div key={wallet.id} className="wtw-wallet-item">
                      {/* Created */}
                      <div className="wtw-wallet-created">
                        <span className="wtw-wallet-created-date">
                          {formatCreatedDate(wallet.createdAt)}
                        </span>
                      </div>

                      {/* Drag Handle */}
                      <div className="wtw-wallet-drag-handle">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="9" cy="5" r="1" />
                          <circle cx="9" cy="12" r="1" />
                          <circle cx="9" cy="19" r="1" />
                          <circle cx="15" cy="5" r="1" />
                          <circle cx="15" cy="12" r="1" />
                          <circle cx="15" cy="19" r="1" />
                        </svg>
                      </div>

                      {/* Profile */}
                      <div className="wtw-wallet-profile">
                        <div className="wtw-wallet-name-display">
                          <div className="wtw-wallet-avatar">
                            <span>{wallet.emoji || '😀'}</span>
                          </div>
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
                              />
                            ) : (
                              <div className="wtw-wallet-name" onClick={() => startEditingWallet(wallet)}>
                                {wallet.name}
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

                      {/* Balance */}
                      <div className="wtw-wallet-balance">
                        <span className="wtw-balance-value">
                          {(() => {
                            // Try both original and lowercase address
                            const b = walletTokenBalances[wallet.address] || walletTokenBalances[wallet.address.toLowerCase()];
                            const ethToken = chainCfg?.eth;

                            let balanceInMON;
                            if (b && ethToken) {
                              // Try to get balance with different case variations of ethToken
                              balanceInMON = Number(b[ethToken] || b[ethToken?.toLowerCase()] || b[ethToken?.toUpperCase()] || 0) / 1e18;
                            } else {
                              balanceInMON = wallet.balance || 0;
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
                          <img src={monadicon} className="wtw-balance-icon" alt="MON" />
                        )}
                      </div>

                      {/* Last Active */}
                      <div className="wtw-wallet-last-active">
                        <span className="wtw-wallet-last-active-time">
                          {lastActiveLabel(wallet)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="wtw-wallet-actions">
                        <WtwTooltip content="View on Explorer">
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
                        </WtwTooltip>

                        <WtwTooltip content="Delete Wallet">
                          <button
                            className="wtw-wallet-action-btn wtw-delete-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(wallet.id);
                            }}
                          >
                            <img src={trash} className="wtw-action-icon" alt="Delete" />
                          </button>
                        </WtwTooltip>
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

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="wtw-confirm-overlay" onClick={() => setShowDeleteConfirm(null)}>
            <div className="wtw-confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Wallet?</h3>
              <p>This action cannot be undone.</p>
              <div className="wtw-confirm-actions">
                <button
                  className="wtw-confirm-btn wtw-cancel"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  className="wtw-confirm-btn wtw-delete"
                  onClick={() => handleDeleteWallet(showDeleteConfirm)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Wallets Popup */}
        {showImportPopup && (
          <ImportWalletsPopup
            onClose={() => setShowImportPopup(false)}
            onImport={handleImportWallets}
          />
        )}

        {/* Add Wallet Modal */}
        {showAddWalletModal && (
          <div className="wtw-modal-overlay" onClick={() => setShowAddWalletModal(false)}>
            <div className="wtw-modal" onClick={(e) => e.stopPropagation()}>
              <div className="wtw-modal-header">
                <h3>Add Wallet</h3>
                <button className="wtw-modal-close" onClick={() => setShowAddWalletModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="wtw-modal-body">
                <div className="wtw-form-group">
                  <label>Wallet Address</label>
                  <input
                    type="text"
                    className="wtw-input"
                    placeholder="0x..."
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                  />
                </div>
                <div className="wtw-form-group">
                  <label>Name (Optional)</label>
                  <input
                    type="text"
                    className="wtw-input"
                    placeholder="Wallet name"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                  />
                </div>
                <div className="wtw-form-group">
                  <label>Emoji</label>
                  <input
                    type="text"
                    className="wtw-input"
                    placeholder="😀"
                    value={newWalletEmoji}
                    onChange={(e) => setNewWalletEmoji(e.target.value)}
                    maxLength={2}
                  />
                </div>
              </div>
              <div className="wtw-modal-footer">
                <button
                  className="wtw-modal-btn wtw-cancel"
                  onClick={() => setShowAddWalletModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="wtw-modal-btn wtw-primary"
                  onClick={handleAddWallet}
                  disabled={!newWalletAddress.trim()}
                >
                  Add Wallet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletTrackerWidget;
