import { Eye, Search, Eye as EyeIcon, Edit2, Plus } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Overlay from '../loading/LoadingComponent';
import PortfolioGraph from './PortfolioGraph/PortfolioGraph';
import walleticon from '../../assets/wallet_icon.svg';

import OrderCenter from '../OrderCenter/OrderCenter';
import ReferralSidebar from './ReferralSidebar/ReferralSidebar';
import cheveron from '../../assets/chevron_arrow.png'
import { useSharedContext } from '../../contexts/SharedContext';
import { formatCommas } from '../../utils/numberDisplayFormat';
import { settings } from '../../settings';
import './Portfolio.css';
import copy from '../../assets/copy.svg'
import closebutton from '../../assets/close_button.png'
import monadicon from '../../assets/monadlogo.svg';
import key from '../../assets/key.svg';
import trash from '../../assets/trash.svg';
import { createPortal } from 'react-dom';
import { showLoadingPopup, updatePopup } from '../MemeTransactionPopup/MemeTransactionPopupManager';
import './Portfolio.css'
import circle from '../../assets/circle_handle.png'
import PortfolioBalance from './PortfolioBalance';
import { useNavigate } from 'react-router-dom';


const Tooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, children, position = 'top' }) => {
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
        top = rect.top + scrollY - tooltipRect.height - 25;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollY + 10;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - tooltipRect.width - 10;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + 10;
        break;
    }

    const Perpetuals = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (position === 'top' || position === 'bottom') {
      left = Math.min(
        Math.max(left, Perpetuals + tooltipRect.width / 2),
        viewportWidth - Perpetuals - tooltipRect.width / 2,
      );
    } else {
      top = Math.min(
        Math.max(top, Perpetuals),
        viewportHeight - Perpetuals - tooltipRect.height,
      );
    }

    setTooltipPosition({ top, left });
  }, [position]);

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
      {shouldRender && createPortal(
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
                : 'none'} scale(${isVisible ? 1 : 0})`,
            opacity: isVisible ? 1 : 0,
            zIndex: 9999,
            pointerEvents: 'none',
            transition: 'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform, opacity'
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
type SortDirection = 'asc' | 'desc';
interface SortConfig {
  column: string;
  direction: SortDirection;
}

interface TokenType {
  address: string;
  symbol: string;
  decimals: bigint;
  name: string;
  ticker: string;
  image: string;
}

interface TradesByMarket {
  [key: string]: any[];
}
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
  lastPrice?: number;
  source?: 'nadfun' | 'crystal' | string;
  status?: 'new' | 'graduating' | 'graduated';
  bondingPercentage?: number;
}
interface WalletDragItem {
  address: string;
  privateKey: string;
  name: string;
  balance: number;
  index: number;
  sourceZone?: 'source' | 'destination';
}
interface PortfolioProps {
  orders: any[];
  tradehistory: any[];
  trades: TradesByMarket;
  canceledorders: any[];
  tokenList: TokenType[];
  router: any;
  address: string;
  isBlurred: any;
  setIsBlurred: any;
  onMarketSelect: any;
  setSendTokenIn: any;
  setpopup: (value: number) => void;
  tokenBalances: any;
  totalAccountValue: number | null;
  setTotalVolume: (volume: number) => void;
  totalVolume: number;
  chartData: any[];
  portChartLoading: boolean;
  chartDays: number;
  setChartDays: (days: number) => void;
  totalClaimableFees: number;
  claimableFees: { [key: string]: number } | undefined;
  refLink: string;
  setRefLink: any;
  setShowRefModal: any;
  filter: 'all' | 'buy' | 'sell';
  setFilter: any;
  onlyThisMarket: boolean;
  setOnlyThisMarket: any;
  account: any;
  refetch: any;
  sendUserOperationAsync: any;
  setChain: any;
  marketsData: any;
  usedRefLink: string;
  setUsedRefLink: any;
  setClaimableFees: any;
  setUsedRefAddress: any;
  client: any;
  activechain: any;
  markets: any;
  tokendict: any;
  isSpectating?: boolean;
  spectatedAddress?: string;
  onStartSpectating?: (address: string) => void;
  onStopSpectating?: () => void;
  originalAddress?: string;
  onSpectatingChange?: (isSpectating: boolean, address: string | null) => void;
  subWallets: Array<{ address: string, privateKey: string }>;
  setSubWallets: (wallets: Array<{ address: string, privateKey: string }>) => void;
  walletTokenBalances: { [address: string]: any };
  walletsLoading: boolean;
  terminalRefetch: any;
  isVaultDepositSigning: boolean;
  setIsVaultDepositSigning: (signing: boolean) => void;
  handleSetChain: () => Promise<void>;
  createSubWallet?: any;
  Wallet?: any;
  lastRefGroupFetch: any;
  positions?: Position[];
  onSellPosition?: (position: Position, monAmount: string) => void;
  scaAddress: any;
  nonces: any;
  setOneCTDepositAddress: any;
  monUsdPrice: number;
  selectedWallets: any;
  setSelectedWallets: any;
  onTrenchesWalletsChange?: (wallets: string[]) => void;
  trenchesPositions?: Position[];
  trenchesLoading?: boolean;
  refreshTrenchesData?: () => void;
}

type PortfolioTab = 'spot' | 'Perpetuals' | 'wallets' | 'trenches';

const Portfolio: React.FC<PortfolioProps> = ({
  orders,
  tradehistory,
  trades,
  canceledorders,
  tokenList,
  router,
  address,
  isBlurred,
  setIsBlurred,
  onMarketSelect,
  setSendTokenIn,
  setpopup,
  tokenBalances,
  totalAccountValue,
  setTotalVolume,
  totalVolume,
  chartData,
  portChartLoading,
  chartDays,
  setChartDays,
  totalClaimableFees,
  claimableFees,
  refLink,
  setRefLink,
  filter,
  setFilter,
  onlyThisMarket,
  setOnlyThisMarket,
  account,
  refetch,
  sendUserOperationAsync,
  setChain,
  marketsData,
  usedRefLink,
  setUsedRefLink,
  setClaimableFees,
  setUsedRefAddress,
  client,
  activechain,
  markets,
  tokendict,
  isSpectating: propIsSpectating,
  spectatedAddress: propSpectatedAddress,
  onStartSpectating,
  onStopSpectating,
  originalAddress,
  onSpectatingChange,
  subWallets,
  setSubWallets,
  walletTokenBalances,
  walletsLoading,
  terminalRefetch,
  isVaultDepositSigning,
  setIsVaultDepositSigning,
  handleSetChain,
  createSubWallet,
  Wallet,
  lastRefGroupFetch,
  positions,
  onSellPosition,
  scaAddress,
  nonces,
  setOneCTDepositAddress,
  monUsdPrice,
  selectedWallets,
  setSelectedWallets,
  onTrenchesWalletsChange,
  trenchesPositions,
  trenchesLoading,
  refreshTrenchesData,
}) => {
  const formatBalanceCompact = (value: number): string => {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(2) + 'B';
    } else if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(2) + 'M';
    } else if (value >= 1_000) {
      return (value / 1_000).toFixed(2) + 'K';
    } else {
      return value.toFixed(2);
    }
  };
  const [isTrenchesWalletDropdownOpen, setIsTrenchesWalletDropdownOpen] = useState(false);
  const [trenchesSelectedWallets, setTrenchesSelectedWallets] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('crystal_trenches_selected_wallets');
    if (stored) {
      try {
        return new Set(JSON.parse(stored));
      } catch (error) {
        return new Set();
      }
    }
    return new Set();
  });

  
  const trenchesDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const crystal = '/CrystalLogo.png';
  const [trenchesSearchQuery, setTrenchesSearchQuery] = useState<string>('');
  const fmt = (v: number, d = 2): string => {
    if (!Number.isFinite(v)) return String(v);
    if (v === 0) return '0';
    if (d <= 0) return v.toLocaleString('en-US', { maximumFractionDigits: 0 });

    const abs = Math.abs(v);
    const threshold = Math.pow(10, -d);
    const thresholdStr = '0.' + '0'.repeat(d - 1) + '1';

    if (abs < threshold) {
      return v > 0 ? `<${thresholdStr}` : `>-${thresholdStr}`;
    }

    if (abs >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (abs >= 1e3) return (v / 1e3).toFixed(2) + 'K';
    return v.toLocaleString('en-US', { maximumFractionDigits: d });
  };
  const formatNumberWithCommas = (num: number, decimals = 2) => {
    if (num === 0) return "0";
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    if (num >= 1) return num.toLocaleString("en-US", { maximumFractionDigits: decimals });
    return num.toFixed(Math.min(decimals, 8));
  };
  const fmtAmount = (v: number, mode: 'MON' | 'USD', monPrice: number) => {
    if (mode === 'USD' && monPrice > 0) {
      return `$${fmt(v * monPrice)}`;
    }
    return `${fmt(v)}`;
  };
  const copyToClipboard = async (text: string, label = 'Address copied') => {
    const txId = `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    try {
      await navigator.clipboard.writeText(text);
      if (showLoadingPopup && updatePopup) {
        showLoadingPopup(txId, {
          title: label,
          subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`,
        });
        setTimeout(() => {
          updatePopup(txId, {
            title: label,
            subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`,
            variant: 'success',
            confirmed: true,
            isLoading: false,
          });
        }, 100);
      }
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        if (showLoadingPopup && updatePopup) {
          showLoadingPopup(txId, {
            title: label,
            subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`,
          });
          setTimeout(() => {
            updatePopup(txId, {
              title: label,
              subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`,
              variant: 'success',
              confirmed: true,
              isLoading: false,
            });
          }, 100);
        }
      } catch (fallbackErr) {
        if (showLoadingPopup && updatePopup) {
          showLoadingPopup(txId, {
            title: 'Copy Failed',
            subtitle: 'Unable to copy to clipboard',
          });
          setTimeout(() => {
            updatePopup(txId, {
              title: 'Copy Failed',
              subtitle: 'Unable to copy to clipboard',
              variant: 'error',
              confirmed: true,
              isLoading: false,
            });
          }, 100);
        }
      } finally {
        document.body.removeChild(ta);
      }
    }
  };
  const [activeTab, setActiveTab] = useState<PortfolioTab>('trenches');
  const [activeSection, setActiveSection] = useState<
    'orders' | 'tradeHistory' | 'orderHistory'
  >('orders');
  useEffect(() => {
    const handleTabOnResize = () => {
      const isMobileView = window.innerWidth <= 1020;

      if (isMobileView && activeTab === 'wallets') {
        setActiveTab('trenches');
      }
    };

    window.addEventListener('resize', handleTabOnResize);

    handleTabOnResize();

    return () => window.removeEventListener('resize', handleTabOnResize);
  }, [activeTab]);
  const [portfolioColorValue, setPortfolioColorValue] = useState('#00b894');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'balance',
    direction: 'desc',
  });

  const [enabledWallets, setEnabledWallets] = useState<Set<string>>(() => {
    const storedEnabledWallets = localStorage.getItem('crystal_enabled_wallets');
    if (storedEnabledWallets) {
      try {
        return (new Set(JSON.parse(storedEnabledWallets)));
      } catch (error) {
        return (new Set());
      }
    }
    else {
      return (new Set());
    }
  });
  const [walletNames, setWalletNames] = useState<{ [address: string]: string }>(() => {
    const stored = localStorage.getItem('crystal_wallet_names');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        return {};
      }
    }
    return {};
  });
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const [draggedWallet, setDraggedWallet] = useState<WalletDragItem | null>(null);
  const [sourceWallets, setSourceWallets] = useState<WalletDragItem[]>([]);
  const [destinationWallets, setDestinationWallets] = useState<WalletDragItem[]>([]);
  const [dragOverZone, setDragOverZone] = useState<'source' | 'destination' | 'main' | null>(null);
  const [distributionAmount, setDistributionAmount] = useState<string>('');
  const [distributionMode, setDistributionMode] = useState<'equal' | 'proportional'>('equal');
  const [sliderPercent, setSliderPercent] = useState(0);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);
  const sliderPopupRef = useRef<HTMLDivElement>(null);
  const [depositTargetWallet, setDepositTargetWallet] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('');

  const [showImportModal, setShowImportModal] = useState(false);
  const [importPrivateKey, setImportPrivateKey] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const mainWalletsRef = useRef<HTMLDivElement>(null);
  const sourceWalletsRef = useRef<HTMLDivElement>(null);
  const destinationWalletsRef = useRef<HTMLDivElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingWallet, setExportingWallet] = useState<{ address: string, privateKey: string } | null>(null);
  const [previewSelection, setPreviewSelection] = useState<Set<string>>(new Set());
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [tokenImageErrors, setTokenImageErrors] = useState<Record<string, boolean>>({});
  const [amountMode, setAmountMode] = useState<'MON' | 'USD'>('MON');
  const showDistributionSuccess = useCallback((amount: string, sourceCount: number, destCount: number) => {
    const txId = `distribution-${Date.now()}`;
    const formattedAmount = parseFloat(amount).toFixed(1);

    if (showLoadingPopup) {
      showLoadingPopup(txId, {
        title: 'Distribution Complete',
        subtitle: `Distributed ${formattedAmount} MON across ${destCount} wallets from ${sourceCount} sources`,
        amount: formattedAmount,
        amountUnit: 'MON'
      });
    }
    if (updatePopup) {
      updatePopup(txId, {
        title: 'Distribution Complete',
        subtitle: `Distributed ${formattedAmount} MON across ${destCount} wallets from ${sourceCount} sources`,
        variant: 'success',
        confirmed: true,
        isLoading: false
      });
    }
  }, []);
  const showDepositSuccess = useCallback((amount: string, targetWallet: string) => {
    const txId = `deposit-${Date.now()}`;
    if (showLoadingPopup) {
      showLoadingPopup(txId, {
        title: 'Deposit Complete',
        subtitle: `Deposited ${amount} MON to ${targetWallet.slice(0, 6)}...${targetWallet.slice(-4)}`,
        amount: amount,
        amountUnit: 'MON'
      });
    }
    if (updatePopup) {
      updatePopup(txId, {
        title: 'Deposit Complete',
        subtitle: `Deposited ${amount} MON to ${targetWallet.slice(0, 6)}...${targetWallet.slice(-4)}`,
        variant: 'success',
        confirmed: true,
        isLoading: false
      });
    }
  }, []);
  const showWalletImported = useCallback((walletAddress: string) => {
    const txId = `wallet-imported-${Date.now()}`;
    if (showLoadingPopup) {
      showLoadingPopup(txId, {
        title: 'Wallet Imported',
        subtitle: `Successfully imported ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      });
    }
    if (updatePopup) {
      updatePopup(txId, {
        title: 'Wallet Imported',
        subtitle: `Successfully imported ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        variant: 'success',
        confirmed: true,
        isLoading: false
      });
    }
  }, []);


  const handleResize = () => {
    setIsMobile(window.innerWidth <= 1020);
    if (window.innerHeight > 1080) {
      setOrderCenterHeight(363.58);
    } else if (window.innerHeight > 960) {
      setOrderCenterHeight(322.38);
    } else if (window.innerHeight > 840) {
      setOrderCenterHeight(281.18);
    } else if (window.innerHeight > 720) {
      setOrderCenterHeight(239.98);
    } else {
      setOrderCenterHeight(198.78);
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    localStorage.setItem('crystal_trenches_selected_wallets', JSON.stringify(Array.from(trenchesSelectedWallets)));
  }, [trenchesSelectedWallets]);
  useEffect(() => {
    localStorage.setItem('crystal_trenches_selected_wallets', JSON.stringify(Array.from(trenchesSelectedWallets)));
  }, [trenchesSelectedWallets]);

  useEffect(() => {
    if (onTrenchesWalletsChange) {
      onTrenchesWalletsChange(Array.from(trenchesSelectedWallets));
    }
  }, [trenchesSelectedWallets, onTrenchesWalletsChange]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (trenchesDropdownRef.current && !trenchesDropdownRef.current.contains(event.target as Node)) {
        setIsTrenchesWalletDropdownOpen(false);
      }
    };

    if (isTrenchesWalletDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTrenchesWalletDropdownOpen]);

  const toggleTrenchesWalletSelection = useCallback(
    (address: string) => {
      const newSelected = new Set(trenchesSelectedWallets);
      if (newSelected.has(address)) {
        newSelected.delete(address);
      } else {
        newSelected.add(address);
      }
      setTrenchesSelectedWallets(newSelected);
    },
    [trenchesSelectedWallets],
  );

  const selectAllTrenchesWallets = useCallback(() => {
    const allAddresses = new Set([scaAddress, ...subWallets.map((w) => w.address)]);
    setTrenchesSelectedWallets(allAddresses);
  }, [subWallets, scaAddress]);

  const unselectAllTrenchesWallets = useCallback(() => {
    setTrenchesSelectedWallets(new Set());
  }, []);

  const selectAllTrenchesWithBalance = useCallback(() => {
    const walletsWithBalance = [scaAddress, ...subWallets]
      .map(w => typeof w === 'string' ? w : w.address)
      .filter((address) => {
        const balance = getWalletBalance(address);
        return balance > 0;
      });
    setTrenchesSelectedWallets(new Set(walletsWithBalance));
  }, [subWallets, scaAddress]);


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');

    if (tabParam) {
      const validTabs: PortfolioTab[] = ['spot', 'Perpetuals', 'wallets', 'trenches'];
      if (validTabs.includes(tabParam as PortfolioTab)) {
        setActiveTab(tabParam as PortfolioTab);
      }
    }
  }, []);

  const { high, low, days, percentage, timeRange, setPercentage } = useSharedContext();

  const activeOrders = orders.length;
  const [orderCenterHeight, setOrderCenterHeight] = useState(() => {
    if (window.innerHeight > 1080) return 363.58;
    if (window.innerHeight > 960) return 322.38;
    if (window.innerHeight > 840) return 281.18;
    if (window.innerHeight > 720) return 239.98;
    return 198.78;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1020);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<string>('');

  const deleteWallet = (address: string) => {
    const walletToDelete = subWallets.find(w => w.address === address);

    const updatedWallets = subWallets.filter(w => w.address !== address);
    setSubWallets(updatedWallets);

    const newEnabledWallets = new Set(enabledWallets);
    newEnabledWallets.delete(address);
    setEnabledWallets(newEnabledWallets);
    localStorage.setItem('crystal_enabled_wallets', JSON.stringify(Array.from(newEnabledWallets)));
    const newWalletNames = { ...walletNames };
    delete newWalletNames[address];
    setWalletNames(newWalletNames);
    localStorage.setItem('crystal_wallet_names', JSON.stringify(newWalletNames));

    window.dispatchEvent(new CustomEvent('walletNamesUpdated', { detail: newWalletNames }));

    setShowDeleteConfirmation(false);
    setWalletToDelete('');
    closeExportModal();
  };

  const confirmDeleteWallet = (address: string) => {
    setWalletToDelete(address);
    setShowDeleteConfirmation(true);
  };
  const [searchInput, setSearchInput] = useState('');
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [privateKeyRevealed, setPrivateKeyRevealed] = useState(false)
  const getActiveAddress = () => {
    return isSpectating ? spectatedAddress : address;
  };



const [spectatorPositions, setSpectatorPositions] = useState<Position[]>([]);
  const [isSpectatorLoading, setIsSpectatorLoading] = useState(false);
  const [spectatorTotalValue, setSpectatorTotalValue] = useState<number>(0);
  const [internalIsSpectating, setInternalIsSpectating] = useState(false);
  const [internalSpectatedAddress, setInternalSpectatedAddress] = useState('');
  
  const isSpectating = propIsSpectating !== undefined ? propIsSpectating : internalIsSpectating;
  const spectatedAddress = propSpectatedAddress !== undefined ? propSpectatedAddress : internalSpectatedAddress;

  useEffect(() => {
    if (!isSpectating || !spectatedAddress) {
      setSpectatorPositions([]);
      setSpectatorTotalValue(0);
      return;
    }

    let cancelled = false;
    setIsSpectatorLoading(true);

    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://api.crystal.exchange/user/${spectatedAddress}`,
          {
            method: 'GET',
            headers: { 'content-type': 'application/json' },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch trader positions');

        const payload = await response.json();
        const rows: any[] = payload.positions ?? [];

        if (cancelled) return;

        const parsedPositions = rows.map((p) => {
          const boughtTokens = Number(p.token_bought ?? 0) / 1e18;
          const soldTokens = Number(p.token_sold ?? 0) / 1e18;
          const spentNative = Number(p.native_spent ?? 0) / 1e18;
          const receivedNative = Number(p.native_received ?? 0) / 1e18;
          const balance = Number(p.balance_token ?? 0) / 1e18;
          const balanceNative = Number(p.balance_native ?? 0) / 1e18;

          const lastPrice = balance > 0 ? balanceNative / balance : 0;
          const realized = receivedNative - spentNative;
          const unrealized = balance * lastPrice;
          const pnlNative = realized + unrealized;
          const remainingPct = boughtTokens > 0 ? (balance / boughtTokens) * 100 : 100;

          return {
            tokenId: p.token,
            symbol: p.symbol,
            name: p.name,
            metadataCID: p.metadata_cid,
            imageUrl: p.metadata_cid || '',
            boughtTokens,
            soldTokens,
            spentNative,
            receivedNative,
            remainingTokens: balance,
            lastPrice,
            remainingPct,
            pnlNative,
            source: 'nad.fun' 
          };
        });

        const sorted = parsedPositions.sort((a, b) => (b.pnlNative ?? 0) - (a.pnlNative ?? 0));
        setSpectatorPositions(sorted);

        try {
            const { getBalance } = await import('@wagmi/core');
            const { config } = await import('../../wagmi');

            const balance = await getBalance(config, {
              address: spectatedAddress as `0x${string}`,
            });
    
            const monAmount = Number(balance.value) / 1e18;
            
            const positionsValue = sorted.reduce((sum, p) => {
              return sum + (p.remainingTokens * (p.lastPrice || 0));
            }, 0);
    
            const totalMonValue = monAmount + positionsValue;
            const totalValueUsd = totalMonValue * monUsdPrice;
    
            setSpectatorTotalValue(totalValueUsd);

        } catch (err) {
            console.warn("Failed to fetch wagmi balance for spectator", err);
             const positionsValue = sorted.reduce((sum, p) => {
              return sum + (p.remainingTokens * (p.lastPrice || 0));
            }, 0);
            setSpectatorTotalValue(positionsValue * monUsdPrice);
        }

      } catch (error) {
        console.error('Failed to fetch spectator data:', error);
      } finally {
        if (!cancelled) setIsSpectatorLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [isSpectating, spectatedAddress, monUsdPrice]);











  const getMainWalletBalance = () => {
    const ethToken = tokenList.find(t => t.address === settings.chainConfig[activechain].eth);

    if (ethToken && tokenBalances[ethToken.address]) {
      return Number(tokenBalances[ethToken.address]) / 10 ** Number(ethToken.decimals);
    }
    return 0;
  };

  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const isValidPrivateKey = (key: string) => {
    return /^0x[a-fA-F0-9]{64}$/.test(key) || /^[a-fA-F0-9]{64}$/.test(key);
  };

  const handleSingleMainDrop = (dragData: any, targetZone: 'source' | 'destination') => {

    const targetArray = targetZone === 'source' ? sourceWallets : destinationWallets;
    const isAlreadyInZone = targetArray.some(w => w.address === dragData.address);

    if (isAlreadyInZone) return;

    if (targetZone === 'source') {
      setSourceWallets(prev => [...prev, { ...dragData, sourceZone: undefined }]);
    } else {
      setDestinationWallets(prev => [...prev, { ...dragData, sourceZone: undefined }]);
    }
  };

  const handleSingleZoneDrop = (dragData: any, targetZone: 'source' | 'destination' | 'main') => {

    if (targetZone === 'main') {
      if (dragData.sourceZone === 'source') {
        setSourceWallets(prev => prev.filter(w => w.address !== dragData.address));
      } else if (dragData.sourceZone === 'destination') {
        setDestinationWallets(prev => prev.filter(w => w.address !== dragData.address));
      }
    } else {
      const sourceZone = dragData.sourceZone;

      if (sourceZone === 'source') {
        setSourceWallets(prev => prev.filter(w => w.address !== dragData.address));
      } else if (sourceZone === 'destination') {
        setDestinationWallets(prev => prev.filter(w => w.address !== dragData.address));
      }

      if (targetZone === 'source') {
        setSourceWallets(prev => {
          const exists = prev.some(w => w.address === dragData.address);
          if (exists) return prev;
          return [...prev, { ...dragData, sourceZone: undefined }];
        });
      } else if (targetZone === 'destination') {
        setDestinationWallets(prev => {
          const exists = prev.some(w => w.address === dragData.address);
          if (exists) return prev;
          return [...prev, { ...dragData, sourceZone: undefined }];
        });
      }
    }
  };

  const handleUniversalDrop = (e: React.DragEvent, targetZone: 'source' | 'destination' | 'main') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverZone(null);
    setDropPreviewLine(null);

    try {
      const reorderDataStr = e.dataTransfer.getData('text/reorder');
      if (reorderDataStr) {
        try {
          const reorderData = JSON.parse(reorderDataStr);
          if (reorderData.type === 'reorder' && reorderData.container === targetZone) {
            handleReorderDrop(e, targetZone);
            return;
          }
        } catch (err) {
        }
      }

      let data = null;
      const jsonData = e.dataTransfer.getData('application/json');
      if (jsonData) {
        data = JSON.parse(jsonData);
      } else {
        const textData = e.dataTransfer.getData('text/plain');
        if (textData) {
          data = JSON.parse(textData);
        }
      }

      if (!data) {
        return;
      }

      switch (data.type) {
        case 'multi-drag':
          handleMultiDrop(e, targetZone);
          break;

        case 'reorder':
          if (data.container === targetZone) {
            handleReorderDrop(e, targetZone);
          }
          break;
        case 'single-zone-drag':
          if (data.sourceZone && data.sourceZone !== targetZone) {
            handleSingleZoneDrop(data, targetZone);
          }
          break;

        case 'single-main-drag':
          if (targetZone !== 'main') {
            handleSingleMainDrop(data, targetZone as 'source' | 'destination');
          }
          break;

        default:
          if (data.sourceZone) {
            handleSingleZoneDrop(data, targetZone);
          }
      }

    } catch (error) {
    }

    setDraggedWallet(null);
    setIsMultiDrag(false);
  };

  const handleDragOver = (e: React.DragEvent, zone: 'source' | 'destination' | 'main') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverZone(zone);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(null);
  };

  const handleDrop = (e: React.DragEvent, zone: 'source' | 'destination') => {
    e.preventDefault();
    setDragOverZone(null);

    if (!draggedWallet) return;

    const targetArray = zone === 'source' ? sourceWallets : destinationWallets;
    const isAlreadyInZone = targetArray.some(w => w.address === draggedWallet.address);

    if (isAlreadyInZone) return;

    if (zone === 'source') {
      setSourceWallets(prev => [...prev, { ...draggedWallet, sourceZone: undefined }]);
    } else {
      setDestinationWallets(prev => [...prev, { ...draggedWallet, sourceZone: undefined }]);
    }

    setDraggedWallet(null);
  };

  const handleDropBetweenZones = (e: React.DragEvent, targetZone: 'source' | 'destination') => {
    e.preventDefault();
    setDragOverZone(null);

    if (!draggedWallet) return;
    if (draggedWallet.sourceZone) {
      const sourceZone = draggedWallet.sourceZone;
      if (sourceZone === targetZone) {
        setDraggedWallet(null);
        return;
      }
      if (sourceZone === 'source') {
        setSourceWallets(prev => prev.filter(w => w.address !== draggedWallet.address));
      } else {
        setDestinationWallets(prev => prev.filter(w => w.address !== draggedWallet.address));
      }
      if (targetZone === 'source') {
        setSourceWallets(prev => {
          const exists = prev.some(w => w.address === draggedWallet.address);
          if (exists) return prev;
          return [...prev, { ...draggedWallet, sourceZone: undefined }];
        });
      } else {
        setDestinationWallets(prev => {
          const exists = prev.some(w => w.address === draggedWallet.address);
          if (exists) return prev;
          return [...prev, { ...draggedWallet, sourceZone: undefined }];
        });
      }
    }

    setDraggedWallet(null);
  };

  const clearAllZones = () => {
    setSourceWallets([]);
    setDestinationWallets([]);
  };

  const executeDistribution = async () => {
    if (sourceWallets.length === 0 || destinationWallets.length === 0 || !distributionAmount) {
      return;
    }

    const targetAmount = parseFloat(distributionAmount);
    if (targetAmount <= 0) {
      return;
    }

    try {
      setIsVaultDepositSigning(true);
      const sourceWalletCapacities = sourceWallets.map(sourceWallet => {
        const balances = walletTokenBalances[sourceWallet.address];
        let availableBalance = 0;

        if (balances) {
          const ethToken = tokenList.find(t => t.address === settings.chainConfig[activechain].eth);
          if (ethToken && balances[ethToken.address]) {
            const amount = balances[ethToken.address] - (settings.chainConfig[activechain].gasamount + BigInt(10000000000000000000)) > BigInt(0)
              ? balances[ethToken.address] - (settings.chainConfig[activechain].gasamount + BigInt(10000000000000000000))
              : BigInt(0);

            availableBalance = Number(amount) / 10 ** Number(ethToken.decimals);
          }
        }

        return {
          wallet: sourceWallet,
          availableBalance: Math.max(0, availableBalance),
          walletData: subWallets.find(w => w.address === sourceWallet.address)
        };
      }).filter(item => item.walletData && item.availableBalance > 0);

      if (sourceWalletCapacities.length === 0) {
        alert('No source wallets have sufficient balance to send');
        return;
      }

      const totalAvailable = sourceWalletCapacities.reduce((sum, item) => sum + item.availableBalance, 0);

      const actualDistributionAmount = Math.min(targetAmount, totalAvailable);

      const allTransfers = [];

      if (distributionMode === 'equal') {
        for (const sourceItem of sourceWalletCapacities) {
          const sourceContribution = (sourceItem.availableBalance / totalAvailable) * actualDistributionAmount;
          const amountPerDestination = sourceContribution / destinationWallets.length;

          for (const destWallet of destinationWallets) {
            if (amountPerDestination > 0.000001) {
              allTransfers.push({
                fromAddress: sourceItem.wallet.address,
                toAddress: destWallet.address,
                amount: amountPerDestination,
                fromPrivateKey: sourceItem.walletData!.privateKey,
                fromName: sourceItem.wallet.name,
                toName: destWallet.name,
                maxAmount: sourceItem.availableBalance
              });
            }
          }
        }
      } else {
        const totalDestValue = destinationWallets.reduce((sum, w) => sum + w.balance, 0);

        for (const sourceItem of sourceWalletCapacities) {
          const sourceContribution = (sourceItem.availableBalance / totalAvailable) * actualDistributionAmount;

          for (const destWallet of destinationWallets) {
            const proportion = destWallet.balance / (totalDestValue || 1);
            const transferAmount = sourceContribution * proportion;

            if (transferAmount > 0.000001) {
              allTransfers.push({
                fromAddress: sourceItem.wallet.address,
                toAddress: destWallet.address,
                amount: transferAmount,
                fromPrivateKey: sourceItem.walletData!.privateKey,
                fromName: sourceItem.wallet.name,
                toName: destWallet.name,
                maxAmount: sourceItem.availableBalance
              });
            }
          }
        }
      }

      const walletTotals = new Map<string, number>();
      for (const transfer of allTransfers) {
        const current = walletTotals.get(transfer.fromAddress) || 0;
        walletTotals.set(transfer.fromAddress, current + transfer.amount);
      }

      let adjustmentNeeded = false;
      for (const [walletAddress, totalToSend] of walletTotals.entries()) {
        const capacity = sourceWalletCapacities.find(item => item.wallet.address === walletAddress);
        if (capacity && totalToSend > capacity.availableBalance) {
          adjustmentNeeded = true;

          const scaleFactor = capacity.availableBalance / totalToSend;
          allTransfers
            .filter(t => t.fromAddress === walletAddress)
            .forEach(t => t.amount *= scaleFactor);
        }
      }


      const walletTransfers = new Map<string, typeof allTransfers>();

      for (const transfer of allTransfers) {
        if (!walletTransfers.has(transfer.fromAddress)) {
          walletTransfers.set(transfer.fromAddress, []);
        }
        walletTransfers.get(transfer.fromAddress)!.push(transfer);
      }

      const transferPromises = [];

      for (const [walletAddress, transfers] of walletTransfers.entries()) {

        for (const transfer of transfers) {
          const wallet = nonces.current.get(walletAddress)
          const amountInWei = BigInt(Math.round(transfer.amount * 10 ** 18));
          const params = [{
            uo: {
              target: transfer.toAddress as `0x${string}`,
              value: amountInWei,
              data: '0x'
            }
          }, 21000n, 0n, false, transfer.fromPrivateKey, wallet?.nonce]
          if (wallet) wallet.nonce += 1
          wallet?.pendingtxs.push(params);
          const transferPromise = sendUserOperationAsync(...params)
            .then(() => {
              if (wallet) wallet.pendingtxs = wallet.pendingtxs.filter((p: any) => p[5] != params[5])
              return true;
            }).catch(() => {
              if (wallet) wallet.pendingtxs = wallet.pendingtxs.filter((p: any) => p[5] != params[5])
              return false
            })
          transferPromises.push(transferPromise);
        }
      }


      const results = await Promise.allSettled(transferPromises);
      const successfulTransfers = results.filter(result =>
        result.status === 'fulfilled' && result.value === true
      ).length;

      const actualAmountSent = allTransfers.reduce((sum, t) => sum + t.amount, 0);

      setTimeout(() => {
        terminalRefetch();
        refetch();
      }, 500);

      showDistributionSuccess(actualAmountSent.toFixed(6), sourceWalletCapacities.length, destinationWallets.length);
      clearAllZones();
      setDistributionAmount('');

    } catch (error) {
    } finally {
      setIsVaultDepositSigning(false);
    }
  };

  const calculateMaxAmount = () => {
    const totalSourceBalance = sourceWallets.reduce((total, wallet) => {
      const balances = walletTokenBalances[wallet.address];
      if (!balances) return total;

      const ethToken = tokenList.find(t => t.address === settings.chainConfig[activechain].eth);
      if (ethToken && balances[ethToken.address]) {
        const amount = balances[ethToken.address] - (settings.chainConfig[activechain].gasamount + BigInt(10000000000000000000)) > BigInt(0)
          ? balances[ethToken.address] - (settings.chainConfig[activechain].gasamount + BigInt(10000000000000000000))
          : BigInt(0);

        const availableBalance = Number(amount) / 10 ** Number(ethToken.decimals);
        return total + availableBalance;
      }

      return total;
    }, 0);
    return totalSourceBalance;
  };

  const positionSliderPopup = useCallback((percent: number) => {
    const input = sliderRef.current;
    const popup = sliderPopupRef.current;
    if (!input || !popup) return;

    const container = input.parentElement as HTMLElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const inputLeft = inputRect.left - containerRect.left;

    const thumbW = 10;
    const x = inputLeft + (percent / 100) * (inputRect.width - thumbW) + thumbW / 2;

    popup.style.left = `${x}px`;
    popup.style.transform = 'translateX(-50%)';
  }, []);

  const handleSliderChange = useCallback((percent: number) => {
    setSliderPercent(percent);
    const maxAmount = calculateMaxAmount();
    const calculatedAmount = (maxAmount * percent) / 100;
    setDistributionAmount(calculatedAmount > 0 ? calculatedAmount.toFixed(6) : '');
    positionSliderPopup(percent);
  }, [positionSliderPopup, calculateMaxAmount]);

  const openExportModal = (wallet: { address: string, privateKey: string }) => {
    setExportingWallet(wallet);
    setPrivateKeyRevealed(false);
    setShowExportModal(true);
  };

  const closeExportModal = () => {
    setShowExportModal(false);
    setExportingWallet(null);
    setPrivateKeyRevealed(false);
  };

  const revealPrivateKey = () => {
    setPrivateKeyRevealed(true);
  };

  const handleImportWallet = async () => {
    setImportError('');
    setIsImporting(true);

    try {
      if (!importPrivateKey.trim()) {
        setImportError('Please enter a private key');
        return;
      }

      let formattedKey = importPrivateKey.trim();
      if (!formattedKey.startsWith('0x')) {
        formattedKey = '0x' + formattedKey;
      }

      if (!isValidPrivateKey(formattedKey)) {
        setImportError('Invalid private key format (must be 64 hex characters)');
        return;
      }

      const existingWallet = subWallets.find(w => w.privateKey.toLowerCase() === formattedKey.toLowerCase());
      if (existingWallet) {
        setImportError('This wallet is already imported');
        return;
      }

      let walletAddress: string;
      try {
        if (Wallet) {
          const tempWallet = new Wallet(formattedKey);
          walletAddress = tempWallet.address;
        } else {
          setImportError('Wallet functionality not available');
          return;
        }
      } catch (walletError) {
        setImportError('Invalid private key - unable to create wallet');
        return;
      }

      const existingAddress = subWallets.find(w => w.address.toLowerCase() === walletAddress.toLowerCase());
      if (existingAddress) {
        setImportError('A wallet with this address already exists');
        return;
      }

      const newWallet = {
        address: walletAddress,
        privateKey: formattedKey
      };

      const updatedWallets = [...subWallets, newWallet];
      setSubWallets(updatedWallets);
      const newWalletNames = {
        ...walletNames,
        [walletAddress]: `Wallet ${updatedWallets.length}`
      };
      setWalletNames(newWalletNames);
      localStorage.setItem('crystal_wallet_names', JSON.stringify(newWalletNames));

      window.dispatchEvent(new CustomEvent('walletNamesUpdated', { detail: newWalletNames }));

      closeImportModal();
      showWalletImported(walletAddress);
    } catch (error) {
      setImportError('Failed to import wallet. Please check your private key.');
    } finally {
      setIsImporting(false);
    }
  };

  const openImportModal = () => {
    setImportPrivateKey('');
    setImportError('');
    setShowImportModal(true);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportPrivateKey('');
    setImportError('');
  };

  const startEditingWallet = (address: string) => {
    setEditingWallet(address);
    setEditingName(walletNames[address] || `Wallet ${subWallets.findIndex(w => w.address === address) + 1}`);
  };

  const saveWalletName = (address: string) => {
    const newWalletNames = { ...walletNames, [address]: editingName || `Wallet ${subWallets.findIndex(w => w.address === address) + 1}` };
    setWalletNames(newWalletNames);
    localStorage.setItem('crystal_wallet_names', JSON.stringify(newWalletNames));

    window.dispatchEvent(new CustomEvent('walletNamesUpdated', { detail: newWalletNames }));

    setEditingWallet(null);
    setEditingName('');
  };

  const getWalletName = (address: string, walletIndex?: number) => {
    if (walletNames[address]) {
      return walletNames[address];
    }
    const actualIndex = subWallets.findIndex(w => w.address === address);
    return `Wallet ${actualIndex !== -1 ? actualIndex + 1 : (walletIndex !== undefined ? walletIndex + 1 : 1)}`;
  };

  const [showPNLCalendar, setShowPNLCalendar] = useState(false);
  const [pnlCalendarLoading, setPNLCalendarLoading] = useState(false);

  const [walletSearchQuery, setWalletSearchQuery] = useState<string>('');

  const handleMaxAmount = () => {
    const maxAmount = calculateMaxAmount();
    setDistributionAmount(maxAmount.toFixed(6));
    setSliderPercent(100);
  };

  const getWalletBalance = (address: string) => {
    const balances = walletTokenBalances[address];
    if (!balances) return 0;

    const ethToken = tokenList.find(t => t.address === settings.chainConfig[activechain].eth);
    if (ethToken && balances[ethToken.address]) {
      return Number(balances[ethToken.address]) / 10 ** Number(ethToken.decimals);
    }

    return 0;
  };
  const totalTrenchesSelectedBalance = useMemo(() => {
    if (trenchesSelectedWallets.size === 0) {
      return 0;
    }
    return Array.from(trenchesSelectedWallets).reduce((total, address) => {
      return total + getWalletBalance(address);
    }, 0);
  }, [trenchesSelectedWallets, getWalletBalance]);
  interface SelectionRect {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  }

  interface DragReorderState {
    draggedIndex: number;
    dragOverIndex: number;
    dragOverPosition: 'top' | 'bottom' | null;
    draggedContainer: 'main' | 'source' | 'destination' | null;
    dragOverContainer: 'main' | 'source' | 'destination' | null;
  }
  const [activeSelectionContainer, setActiveSelectionContainer] = useState<'main' | 'source' | 'destination' | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [_dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [isMultiDrag, setIsMultiDrag] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'positions' | 'history' | 'top100'>('positions');
  const [dragReorderState, setDragReorderState] = useState<DragReorderState>({
    draggedIndex: -1,
    dragOverIndex: -1,
    dragOverPosition: null,
    draggedContainer: null,
    dragOverContainer: null
  });
  const [dropPreviewLine, setDropPreviewLine] = useState<{ top: number; containerKey: string } | null>(null);
  const getWalletTokenCount = (address: string) => {
    const balances = walletTokenBalances[address];
    if (!balances) return 0;

    const ethAddress = settings.chainConfig[activechain]?.eth;
    let count = 0;

    for (const [tokenAddr, balance] of Object.entries(balances)) {
      if (tokenAddr !== ethAddress && balance && BigInt(balance.toString()) > 0n) {
        count++;
      }
    }

    return count;
  };
  const totalTrenchesTokenCount = useMemo(() => {
    if (trenchesSelectedWallets.size === 0) {
      return 0;
    }
    return Array.from(trenchesSelectedWallets).reduce((total, address) => {
      return total + getWalletTokenCount(address);
    }, 0);
  }, [trenchesSelectedWallets, getWalletTokenCount]);
  const startSelection = (e: React.MouseEvent, containerKey: 'main' | 'source' | 'destination') => {
    if (e.button !== 0) return;

    if ((e.target as HTMLElement).closest('.draggable-wallet-item')) {
      return;
    }

    if (!e.ctrlKey && !e.metaKey) {
      setSelectedWalletsPerContainer({
        main: new Set(),
        source: new Set(),
        destination: new Set()
      });
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setActiveSelectionContainer(containerKey);
    setDragStartPoint({ x: e.clientX, y: e.clientY });
    setSelectionRect({
      startX,
      startY,
      currentX: startX,
      currentY: startY
    });
  };


  const [selectedWalletsPerContainer, setSelectedWalletsPerContainer] = useState<{
    main: Set<string>;
    source: Set<string>;
    destination: Set<string>;
  }>({
    main: new Set(),
    source: new Set(),
    destination: new Set()
  });
  const updateSelection = (e: React.MouseEvent, container: HTMLElement, containerKey: 'main' | 'source' | 'destination') => {
    if (activeSelectionContainer !== containerKey || !selectionRect) return;

    const rect = container.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    setSelectionRect(prev => prev ? {
      ...prev,
      currentX,
      currentY
    } : null);

    const walletElements = container.querySelectorAll('.draggable-wallet-item');
    const newSelection = new Set<string>();

    walletElements.forEach((element) => {
      const walletRect = element.getBoundingClientRect();
      const elementRect = {
        left: walletRect.left - rect.left,
        top: walletRect.top - rect.top,
        right: walletRect.right - rect.left,
        bottom: walletRect.bottom - rect.top
      };

      const selectionBounds = {
        left: Math.min(selectionRect.startX, currentX),
        top: Math.min(selectionRect.startY, currentY),
        right: Math.max(selectionRect.startX, currentX),
        bottom: Math.max(selectionRect.startY, currentY)
      };

      if (elementRect.left < selectionBounds.right &&
        elementRect.right > selectionBounds.left &&
        elementRect.top < selectionBounds.bottom &&
        elementRect.bottom > selectionBounds.top) {

        const walletAddress = element.getAttribute('data-wallet-address');
        if (walletAddress) newSelection.add(walletAddress);
      }
    });

    setPreviewSelection(newSelection);
  };
  const endSelection = () => {
    if (activeSelectionContainer && previewSelection.size > 0) {
      setSelectedWalletsPerContainer(prev => {
        const combined = new Set(prev[activeSelectionContainer]);
        previewSelection.forEach(addr => combined.add(addr));
        return {
          ...prev,
          [activeSelectionContainer]: combined
        };
      });
    }

    setPreviewSelection(new Set());
    setActiveSelectionContainer(null);
    setSelectionRect(null);
    setDragStartPoint(null);
  };


  const handleMultiDragStart = (e: React.DragEvent, containerType: 'main' | 'source' | 'destination') => {
    e.stopPropagation();
    setIsMultiDrag(true);

    const walletsInContainer = getWalletsForContainer(containerType);
    const selectedWalletsData = walletsInContainer
      .filter((w) => {
        return selectedWalletsPerContainer[containerType].has(w.address);
      })
      .map((w, arrayIndex) => {
        const actualIndex = containerType === 'main'
          ? subWallets.findIndex(sw => sw.address === w.address)
          : arrayIndex;

        return {
          address: w.address,
          privateKey: w.privateKey,
          name: getWalletName(w.address),
          balance: getWalletBalance(w.address),
          index: actualIndex,
        };
      });

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'multi-drag',
      wallets: selectedWalletsData,
      sourceContainer: containerType,
      count: selectedWalletsData.length,
      timestamp: Date.now()
    }));
  };
  const handleMultiDrop = (e: React.DragEvent, targetZone: 'source' | 'destination' | 'main') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverZone(null);
    setDropPreviewLine(null);

    try {
      const jsonData = e.dataTransfer.getData('application/json');

      if (jsonData) {
        const data = JSON.parse(jsonData);

        if (data.type === 'multi-drag' && data.wallets && data.wallets.length > 0) {
          const { wallets, sourceContainer } = data;

          if (sourceContainer !== targetZone) {
            if (sourceContainer === 'source') {
              setSourceWallets(prev => {
                const filtered = prev.filter(w => !wallets.some((sw: any) => sw.address === w.address));
                return filtered;
              });
            } else if (sourceContainer === 'destination') {
              setDestinationWallets(prev => {
                const filtered = prev.filter(w => !wallets.some((sw: any) => sw.address === w.address));
                return filtered;
              });
            }

            if (targetZone === 'source') {
              setSourceWallets(prev => {
                const newWallets = wallets.filter((w: any) => !prev.some(pw => pw.address === w.address));
                return [...prev, ...newWallets];
              });
            } else if (targetZone === 'destination') {
              setDestinationWallets(prev => {
                const newWallets = wallets.filter((w: any) => !prev.some(pw => pw.address === w.address));
                return [...prev, ...newWallets];
              });
            }
          }
          setSelectedWalletsPerContainer({
            main: new Set(),
            source: new Set(),
            destination: new Set()
          });
          setIsMultiDrag(false);
          return;
        } else if (data.type === 'reorder') {
          handleReorderDrop(e, targetZone as any);
          return;
        }
      }
    } catch (error) {
    }

    try {
      const textData = e.dataTransfer.getData('text/plain');
      if (textData) {
        handleDrop(e, targetZone as any);
        return;
      }
    } catch (error) {
    }
    setIsMultiDrag(false);
    if (draggedWallet?.sourceZone) {
      handleDropBetweenZones(e, targetZone as any);
    } else {
      handleDrop(e, targetZone as any);
    }
  };

  useEffect(() => {
    if (subWallets.length > 0) {
      let needsUpdate = false;
      const updatedNames = { ...walletNames };

      subWallets.forEach((wallet, index) => {
        if (!updatedNames[wallet.address]) {
          updatedNames[wallet.address] = `Wallet ${index + 1}`;
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        setWalletNames(updatedNames);
        localStorage.setItem('crystal_wallet_names', JSON.stringify(updatedNames));
        window.dispatchEvent(new CustomEvent('walletNamesUpdated', { detail: updatedNames }));
      }
    }
  }, [subWallets.length]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      endSelection();
      setDropPreviewLine(null);
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMultiDrag(false);
        setDropPreviewLine(null);
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

    const containerType = containerKey.split('-')[0] as 'main' | 'source' | 'destination';

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

  const handleReorderDropWithData = (reorderData: any, containerType: 'main' | 'source' | 'destination') => {
    try {
      if (reorderData.type === 'reorder' && reorderData.container === containerType) {
        const { index: draggedIndex } = reorderData;
        const { dragOverIndex, dragOverPosition } = dragReorderState;

        if (draggedIndex === dragOverIndex) {
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
          } setDropPreviewLine(null);
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

        if (containerType === 'main') {
          const reorderedWallets = [...subWallets];
          const maxIndex = reorderedWallets.length - 1;
          targetIndex = Math.min(targetIndex, maxIndex);

          const [movedWallet] = reorderedWallets.splice(draggedIndex, 1);
          reorderedWallets.splice(targetIndex, 0, movedWallet);
          setSubWallets(reorderedWallets);
        } else if (containerType === 'source') {
          const reorderedWallets = [...sourceWallets];
          const maxIndex = reorderedWallets.length - 1;
          targetIndex = Math.min(targetIndex, maxIndex);

          const [movedWallet] = reorderedWallets.splice(draggedIndex, 1);
          reorderedWallets.splice(targetIndex, 0, movedWallet);
          setSourceWallets(reorderedWallets);
        } else if (containerType === 'destination') {
          const reorderedWallets = [...destinationWallets];
          const maxIndex = reorderedWallets.length - 1;
          targetIndex = Math.min(targetIndex, maxIndex);

          const [movedWallet] = reorderedWallets.splice(draggedIndex, 1);
          reorderedWallets.splice(targetIndex, 0, movedWallet);
          setDestinationWallets(reorderedWallets);
        }
      }
    } catch (error) {
    }


    setDragReorderState({
      draggedIndex: -1,
      dragOverIndex: -1,
      dragOverPosition: null,
      draggedContainer: null,
      dragOverContainer: null
    });
    setDropPreviewLine(null); setDropPreviewLine(null);
  };

  const handleReorderDrop = (e: React.DragEvent, containerType: 'main' | 'source' | 'destination') => {
    e.preventDefault();
    e.stopPropagation();

    try {
      let reorderData = e.dataTransfer.getData('text/reorder');
      if (!reorderData) {
        const jsonData = e.dataTransfer.getData('application/json');
        if (jsonData) {
          const data = JSON.parse(jsonData);
          if (data.type === 'reorder') {
            reorderData = jsonData;
          }
        }
      }

      if (!reorderData || reorderData.trim() === '') {
        return;
      }

      const data = JSON.parse(reorderData);

      if (data.type === 'reorder' && data.container === containerType) {
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

        if (containerType === 'main') {
          const reorderedWallets = [...subWallets];
          const maxIndex = reorderedWallets.length - 1;
          targetIndex = Math.min(targetIndex, maxIndex);

          const [movedWallet] = reorderedWallets.splice(draggedIndex, 1);
          reorderedWallets.splice(targetIndex, 0, movedWallet);
          setSubWallets(reorderedWallets);
        } else if (containerType === 'source') {
          const reorderedWallets = [...sourceWallets];
          const maxIndex = reorderedWallets.length - 1;
          targetIndex = Math.min(targetIndex, maxIndex);

          const [movedWallet] = reorderedWallets.splice(draggedIndex, 1);
          reorderedWallets.splice(targetIndex, 0, movedWallet);
          setSourceWallets(reorderedWallets);
        } else if (containerType === 'destination') {
          const reorderedWallets = [...destinationWallets];
          const maxIndex = reorderedWallets.length - 1;
          targetIndex = Math.min(targetIndex, maxIndex);

          const [movedWallet] = reorderedWallets.splice(draggedIndex, 1);
          reorderedWallets.splice(targetIndex, 0, movedWallet);
          setDestinationWallets(reorderedWallets);
        }
      }
    } catch (error) {
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

  const getWalletsForContainer = (containerType: 'main' | 'source' | 'destination') => {
    switch (containerType) {
      case 'main':
        return subWallets.filter(wallet =>
          !sourceWallets.some(w => w.address === wallet.address) &&
          !destinationWallets.some(w => w.address === wallet.address)
        );
      case 'source':
        return sourceWallets;
      case 'destination':
        return destinationWallets;
      default:
        return [];
    }
  };

  const toggleWalletSelection = useCallback(
    (address: string) => {
      if (!setSelectedWallets) return;

      const newSelected = new Set(selectedWallets);
      if (newSelected.has(address)) {
        newSelected.delete(address);
      } else {
        newSelected.add(address);
      }
      setSelectedWallets(newSelected);
    },
    [selectedWallets, setSelectedWallets],
  );

  const renderWalletItem = (wallet: any, index: number, containerType: 'main' | 'source' | 'destination', containerKey: string) => {
    const isSelected = selectedWalletsPerContainer[containerType].has(wallet.address);
    const isPreviewSelected = previewSelection.has(wallet.address);
    const isDragging = dragReorderState.draggedIndex === index && dragReorderState.draggedContainer === containerType;
    const isDragOver = dragReorderState.dragOverIndex === index && dragReorderState.dragOverContainer === containerType;

    return (
      <div
        key={wallet.address}
        data-wallet-address={wallet.address}
        className={`draggable-wallet-item ${isSelected ? 'selected' : ''} ${isPreviewSelected ? 'preview-selected' : ''} ${isDragging ? 'dragging' : ''} ${isMultiDrag && isSelected ? 'multi-drag-ghost' : ''} ${(isSelected || isPreviewSelected) ? 'handle-visible' : ''}`}
        draggable
        onDragStart={(e) => {
          setDropPreviewLine(null);
          setDragReorderState(prev => ({
            ...prev,
            draggedIndex: index,
            draggedContainer: containerType
          }));
          if (selectedWalletsPerContainer[containerType].size > 1 && isSelected) {
            handleMultiDragStart(e, containerType);
            return;
          }

          setSelectedWalletsPerContainer(prev => ({
            ...prev,
            [containerType]: new Set([wallet.address])
          }));

          if (containerType === 'main') {
            const dragData = {
              address: wallet.address,
              privateKey: wallet.privateKey,
              name: getWalletName(wallet.address, index),
              balance: getWalletBalance(wallet.address),
              index,
              type: 'single-main-drag'
            };
            e.dataTransfer.setData('application/json', JSON.stringify(dragData));
            e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
          } else {
            const dragData = {
              ...wallet,
              sourceZone: containerType,
              type: 'single-zone-drag'
            };
            e.dataTransfer.setData('application/json', JSON.stringify(dragData));
            e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
          }

          const reorderData = {
            type: 'reorder',
            index: index,
            container: containerType,
            timestamp: Date.now()
          };
          e.dataTransfer.setData('text/reorder', JSON.stringify(reorderData));

          setDragReorderState(prev => ({ ...prev, draggedIndex: index }));
        }}
        onDragEnd={() => {
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
          setDragOverZone(null);
        }}
        onDragOver={(e) => {
          if (!isMultiDrag) {
            handleReorderDragOver(e, index, containerKey);
          }
        }}
        onDragLeave={(e) => {
          const relatedTarget = e.relatedTarget as Node;
          if (!e.currentTarget.contains(relatedTarget)) {
            setDropPreviewLine(null);
            setDragReorderState(prev => ({ ...prev, dragOverIndex: -1, dragOverPosition: null, draggedContainer: null }));
          }
        }}
        onDrop={(e) => {
          if (!isMultiDrag) {
            e.stopPropagation();

            const reorderDataStr = e.dataTransfer.getData('text/reorder');
            if (reorderDataStr) {
              try {
                const reorderData = JSON.parse(reorderDataStr);
                if (reorderData.type === 'reorder' && reorderData.container === containerType) {
                  handleReorderDropWithData(reorderData, containerType);
                  return;
                }
              } catch (err) {
              }
            }

            handleUniversalDrop(e, containerType);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();

          if (e.ctrlKey || e.metaKey) {
            setSelectedWalletsPerContainer(prev => {
              const newContainerSet = new Set(prev[containerType]);
              if (newContainerSet.has(wallet.address)) {
                newContainerSet.delete(wallet.address);
              } else {
                newContainerSet.add(wallet.address);
              }
              return {
                ...prev,
                [containerType]: newContainerSet
              };
            });
          } else {
            setSelectedWalletsPerContainer({
              main: containerType === 'main' ? new Set([wallet.address]) : new Set(),
              source: containerType === 'source' ? new Set([wallet.address]) : new Set(),
              destination: containerType === 'destination' ? new Set([wallet.address]) : new Set()
            });
          }
        }}
      >
        {!isMultiDrag && dropPreviewLine && dropPreviewLine.containerKey === containerKey && isDragOver && (
          <div
            className="drop-preview-line"
            style={{
              top: dragReorderState.dragOverPosition === 'top' ? -1 : '100%'
            }}
          />
        )}

        <div className="wallet-active-checkbox-container">
          <Tooltip content={selectedWallets.has(wallet.address) ? "Active Wallet" : "Set as Active Wallet"}>
            <input
              type="checkbox"
              className="wallet-active-checkbox"
              checked={selectedWallets.has(wallet.address)}
              onChange={(e) => {
                e.stopPropagation();
                toggleWalletSelection(wallet.address)
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </Tooltip>
        </div>
        <Tooltip content="Drag to move wallet">
          <img
            src={circle}
            className="wallet-drag-handle-icon"
          />
        </Tooltip>
        <div className="wallet-drag-info">
          <div className="wallet-name-container">
            {editingWallet === wallet.address ? (
              <div className="wallet-name-edit-container">
                <input
                  type="text"
                  className="wallet-name-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      saveWalletName(wallet.address);
                    } else if (e.key === 'Escape') {
                      setEditingWallet(null);
                      setEditingName('');
                    }
                  }}
                  autoFocus
                  onBlur={() => saveWalletName(wallet.address)}
                />
              </div>
            ) : (
              <div className="wallet-name-display">
                <span
                  className={`wallet-drag-name ${selectedWallets.has(wallet.address) ? 'active' : ''}`}
                  style={{
                    color: selectedWallets.has(wallet.address) ? '#d8dcff' : '#fff'
                  }}
                >
                  {getWalletName(wallet.address, index)}
                </span>
                <Edit2
                  size={12}
                  className="wallet-name-edit-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditingWallet(wallet.address);
                  }}
                />
              </div>
            )}
          </div>
          {editingWallet != wallet.address ? (
            <div className="wallet-dropdown-address"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(wallet.address, 'Wallet address copied');
              }}
              style={{ cursor: 'pointer' }}>
              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              <svg
                className="wallet-dropdown-address-copy-icon"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ marginLeft: '2px' }}
              >
                <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
              </svg>
            </div>
          ) : null}
        </div>

        <div className="wallet-drag-values">
          {(() => {
            const gasReserve = BigInt(settings.chainConfig[activechain].gasamount ?? 0);
            const balanceWei = walletTokenBalances[wallet.address]?.[
              settings.chainConfig[activechain]?.eth
            ] || 0n;
            const hasInsufficientGas = balanceWei > 0n && balanceWei <= gasReserve;

            return (
              <Tooltip content={hasInsufficientGas ? "Not enough for gas, transactions will revert" : "MON Balance"}>
                <div className={`wallet-drag-balance ${isBlurred ? 'blurred' : ''} ${hasInsufficientGas ? 'insufficient-gas' : ''}`}>
                  <img src={monadicon} className="wallet-drag-balance-mon-icon" alt="MON" />
                  {getWalletBalance(wallet.address).toFixed(2)}
                </div>
              </Tooltip>
            );
          })()}
        </div>
        <div className="wallet-drag-tokens">
          <div className="wallet-token-count">
            <div className="wallet-token-structure-icons">
              <div className="token1"></div>
              <div className="token2"></div>
              <div className="token3"></div>
            </div>
            <span className="wallet-total-tokens">{getWalletTokenCount(wallet.address)}</span>
          </div>
        </div>
        <div className="wallet-drag-actions">
          <Tooltip content="Deposit from Main Wallet">
            <button
              className="wallet-icon-button"
              onClick={(e) => {
                e.stopPropagation();
                setOneCTDepositAddress(wallet.address);
                setpopup(25)
                setTimeout(() => {
                  refetch();
                }, 0);
              }}
            >
              <Plus size={14} className="wallet-action-icon" />
            </button>
          </Tooltip>

          <Tooltip content="Export Private Key">
            <button
              className="wallet-icon-button key-button"
              onClick={(e) => {
                e.stopPropagation();
                openExportModal(wallet);
              }}
            >
              <img src={key} className="wallet-action-icon" alt="Export Key" />
            </button>
          </Tooltip>

          <Tooltip content="View on Explorer">
            <a
              href={`${settings.chainConfig[activechain].explorer}/address/${wallet.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="wallet-icon-button explorer-button"
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                className="wallet-action-icon-svg"
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
              className="wallet-icon-button delete-button"
              onClick={(e) => {
                e.stopPropagation();
                confirmDeleteWallet(wallet.address);
              }}
            >
              <img src={trash} className="wallet-action-icon" alt="Delete Wallet" />
            </button>
          </Tooltip>
        </div>
      </div>
    );
  };

  const renderWalletContainer = (
    wallets: any[],
    containerType: 'main' | 'source' | 'destination',
    containerKey: string,
    emptyMessage: string,
    containerRef: React.RefObject<HTMLDivElement>
  ) => {
    const isThisContainerSelecting = activeSelectionContainer === containerType;

    const getEmptyStateIcon = () => {
      if (containerType === 'source') {
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="wallets-source-icon"><path d="m18 9-6-6-6 6" /><path d="M12 3v14" /><path d="M5 21h14" /></svg>
        )
      } else if (containerType === 'destination') {
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="wallets-destination-icon"><path d="M12 17V3" /><path d="m6 11 6 6 6-6" /><path d="M19 21H5" /></svg>
        )
      }
      return null;
    };

    return (
      <div
        ref={containerRef}
        className={`${containerType === 'main' ? 'drag-wallets-list' : 'drop-zone-wallets'} ${isThisContainerSelecting ? 'selecting' : ''}`}
        onMouseDown={(e) => startSelection(e, containerType)}
        onMouseMove={(e) => {
          if (isThisContainerSelecting && containerRef.current) {
            updateSelection(e, containerRef.current, containerType);
          }
        }}
        onMouseUp={endSelection}
        onMouseLeave={endSelection}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverZone(containerType);
        }}
        onDrop={(e) => handleUniversalDrop(e, containerType)}
        onDragLeave={(e) => {
          const relatedTarget = e.relatedTarget as Node;
          if (!e.currentTarget.contains(relatedTarget)) {
            setDragOverZone(null);
          }
        }}
        style={{ position: 'relative' }}
      >
        {isThisContainerSelecting && selectionRect && (
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

        {wallets.length === 0 ? (
          <div className="drop-zone-empty">
            {getEmptyStateIcon()}
            <div className="drop-zone-text">{emptyMessage}</div>
          </div>
        ) : (
          wallets.map((wallet, index) => renderWalletItem(wallet, index, containerType, containerKey))
        )}
      </div>
    );
  };

const handleConfirmSpectating = () => {
    if (searchInput.trim() && isValidAddress(searchInput.trim())) {
      if (onStartSpectating) {
        onStartSpectating(searchInput.trim());
      } else {
        setInternalSpectatedAddress(searchInput.trim());
        setInternalIsSpectating(true);
      }

      if (onSpectatingChange) {
        onSpectatingChange(true, searchInput.trim());
      }
      refetch(searchInput.trim());
    } else {
    }
  };

  const isButtonDisabled = !isSpectating && (!searchInput.trim() || !isValidAddress(searchInput.trim()));

  const clearSpectating = () => {
    if (onStopSpectating) {
      onStopSpectating();
    } else {
      setInternalIsSpectating(false);
      setInternalSpectatedAddress('');
    }

    if (onSpectatingChange) {
      onSpectatingChange(false, null);
    }

    setSearchInput('');
    refetch(originalAddress || address);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirmSpectating();
    }
  };

  const getTimeRangeText = (timeRange: string) => {
    switch (timeRange) {
      case '24H':
        return 'day';
      case '7D':
        return 'week';
      case '14D':
        return 'two weeks';
      case '30D':
        return 'month';
      default:
        return 'week';
    }
  };

  useEffect(() => {
    const totalSelected = Object.values(selectedWalletsPerContainer).reduce((sum, set) => sum + set.size, 0);
    if (totalSelected <= 1) {
      setIsMultiDrag(false);
    }
  }, [selectedWalletsPerContainer]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedWalletsPerContainer({
          main: new Set(),
          source: new Set(),
          destination: new Set()
        });
        setIsMultiDrag(false);
        setDropPreviewLine(null);
        endSelection();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const now = Date.now() / 1000;
    const timeago = now - 24 * 60 * 60 * days;
    let volume = 0;

    tradehistory.forEach((trade) => {
      const marketKey = trade[4];
      const tradeTime = trade[6];
      const tradeSide = trade[2];
      const amount = trade[0];
      const price = trade[1];

      if (
        typeof tradeTime === 'number' &&
        tradeTime >= timeago && markets[marketKey]
      ) {
        const quotePrice = markets[marketKey].quoteAsset == 'USDC' ? 1 : trades[(markets[marketKey].quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : markets[marketKey].quoteAsset) + 'USDC']?.[0]?.[3]
          / Number(markets[(markets[marketKey].quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : markets[marketKey].quoteAsset) + 'USDC']?.priceFactor)
        volume += (tradeSide === 1 ? amount : price) * quotePrice / 10 ** Number(markets[marketKey].quoteDecimals);
      }
    });

    setTotalVolume(parseFloat(volume.toFixed(2)));
  }, [tradehistory, days]);

const activePositions = isSpectating 
    ? spectatorPositions 
    : (trenchesPositions || positions || []);

  const totalUnrealizedPnl = activePositions.reduce((sum, p) => {
    return sum + (p.pnlNative || 0)
  }, 0)

  const totalUnrealizedPnlNative = activePositions.reduce((sum, p) => sum + (p.pnlNative || 0), 0)

  const totalUnrealizedPnlUsd = totalUnrealizedPnlNative * monUsdPrice

  const unrealizedClass =
    totalUnrealizedPnlNative >= 0 ? 'positive' : 'negative'

  const unrealizedSign =
    totalUnrealizedPnlNative >= 0 ? '+' : '-'


  const calculatePerformanceRanges = () => {
    if (!activePositions || activePositions.length === 0) {
      return [
        { label: '>500%', count: 0, color: 'rgb(67, 254, 154, 0.25)' },
        { label: '200% ~ 500%', count: 0, color: 'rgb(67, 254, 154, 0.25)' },
        { label: '0% ~ 200%', count: 0, color: 'rgb(67, 254, 154, 0.25)' },
        { label: '0% ~ -50%', count: 0, color: 'rgb(247, 127, 125, 0.25)' },
        { label: '<-50%', count: 0, color: 'rgb(247, 127, 125, 0.25)' }
      ];
    }

    const ranges = {
      above500: 0,
      range200to500: 0,
      range0to200: 0,
      range0toNeg50: 0,
      belowNeg50: 0
    };

    activePositions.forEach(p => {
      if (p.spentNative === 0) return;

      const pnlPercent = (p.pnlNative / p.spentNative) * 100;

      if (pnlPercent > 500) {
        ranges.above500++;
      } else if (pnlPercent >= 200) {
        ranges.range200to500++;
      } else if (pnlPercent >= 0) {
        ranges.range0to200++;
      } else if (pnlPercent >= -50) {
        ranges.range0toNeg50++;
      } else {
        ranges.belowNeg50++;
      }
    });

    return [
      { label: '>500%', count: ranges.above500, color: 'rgb(67, 254, 154, 0.25)' },
      { label: '200% ~ 500%', count: ranges.range200to500, color: 'rgb(67, 254, 154, 0.25)' },
      { label: '0% ~ 200%', count: ranges.range0to200, color: 'rgb(67, 254, 154, 0.25)' },
      { label: '0% ~ -50%', count: ranges.range0toNeg50, color: 'rgb(247, 127, 125, 0.25)' },
      { label: '<-50%', count: ranges.belowNeg50, color: 'rgb(247, 127, 125, 0.25)' }
    ];
  };

  const calculateBuySellRatio = () => {
    if (!activePositions || activePositions.length === 0) {
      return { buyCount: 0, sellCount: 0, buyValue: 0, sellValue: 0, buyPercent: 50, sellPercent: 50 };
    }

    let buyCount = 0;
    let sellCount = 0;
    let buyValue = 0;
    let sellValue = 0;

    activePositions.forEach(p => {
      if (p.boughtTokens > 0) {
        buyCount++;
        buyValue += p.spentNative;
      }
      if (p.soldTokens > 0) {
        sellCount++;
        sellValue += p.receivedNative;
      }
    });

    const totalValue = buyValue + sellValue;
    const buyPercent = totalValue > 0 ? (buyValue / totalValue) * 100 : 50;
    const sellPercent = totalValue > 0 ? (sellValue / totalValue) * 100 : 50;

    return { buyCount, sellCount, buyValue, sellValue, buyPercent, sellPercent };
  };

  const totalRealizedPnlNative = activePositions.reduce((sum, p) => {
    if (p.remainingTokens > 0 && p.boughtTokens > 0) {
      const soldPortion = p.soldTokens / p.boughtTokens;
      const realizedPnl = p.receivedNative - (p.spentNative * soldPortion);
      return sum + realizedPnl;
    }
    if (p.remainingTokens === 0) {
      return sum + (p.receivedNative - p.spentNative);
    }
    return sum;
  }, 0);

  const totalRealizedPnlUsd = totalRealizedPnlNative * monUsdPrice;
  const realizedClass = totalRealizedPnlNative >= 0 ? 'positive' : 'negative';
  const realizedSign = totalRealizedPnlNative >= 0 ? '+' : '-';
  const renderTabContent = () => {
    switch (activeTab) {
      case 'spot':
      default:
        return (
          <div className="portfolio-layout-with-referrals">
            <div className="port-top-section">
              <ReferralSidebar
                tokendict={tokendict}
                router={router}
                setClaimableFees={setClaimableFees}
                address={getActiveAddress() as `0x${string}`}
                usedRefLink={usedRefLink}
                setUsedRefLink={setUsedRefLink}
                setUsedRefAddress={setUsedRefAddress}
                totalClaimableFees={totalClaimableFees}
                claimableFees={claimableFees}
                refLink={refLink}
                setRefLink={setRefLink}
                setChain={setChain}
                setpopup={setpopup}
                account={account}
                refetch={refetch}
                sendUserOperationAsync={sendUserOperationAsync}
                client={client}
                activechain={activechain}
                lastRefGroupFetch={lastRefGroupFetch}
              />

              <div className="portfolio-left-column">
                <div className="graph-outer-container">
                  {portChartLoading ? (
                    <div className="graph-container">
                      <Overlay isVisible={true} bgcolor={'rgb(6,6,6)'} height={15} maxLogoHeight={100} />
                    </div>
                  ) : (
                    <div className="graph-container">
                      <span className="graph-label">
                        {isSpectating ? t("spectatingPerformance") : t("performance")}
                      </span>
                      <PortfolioGraph
                        address={getActiveAddress()}
                        colorValue={portfolioColorValue}
                        setColorValue={setPortfolioColorValue}
                        isPopup={false}
                        onPercentageChange={setPercentage}
                        chartData={chartData}
                        portChartLoading={portChartLoading}
                        chartDays={chartDays}
                        setChartDays={setChartDays}
                        isBlurred={isBlurred}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="account-stats-wrapper">
                <div className="controls-container">
                  <button
                    className="control-button"
                    onClick={() => setIsBlurred(!isBlurred)}
                  >
                    <div style={{ position: 'relative' }}>
                      <Eye className="control-icon" size={12} />
                      <div className={`port-eye-slash ${isBlurred ? '' : 'hidden'}`} />
                    </div>
                    Hide Balances
                  </button>

                  <button
                    className="control-button"
                    onClick={() => {
                      account.logout()
                    }}
                  >
                    <svg
                      className="control-icon"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M8.90002 7.55999C9.21002 3.95999 11.06 2.48999 15.11 2.48999H15.24C19.71 2.48999 21.5 4.27999 21.5 8.74999V15.27C21.5 19.74 19.71 21.53 15.24 21.53H15.11C11.09 21.53 9.24002 20.08 8.91002 16.54" />
                      <path d="M2 12H14.88" />
                      <path d="M12.65 8.6499L16 11.9999L12.65 15.3499" />
                    </svg>
                    Disconnect
                  </button>
                </div>
                <div
                  className={`account-summary-container ${percentage >= 0 ? 'positive' : 'negative'}`}
                >
                  <div className="account-header">
                    {isSpectating ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <EyeIcon size={16} style={{ color: '#ff6b6b' }} />
                        <span>SPECTATING</span>
                      </div>
                    ) : (
                      t("account")
                    )}
                  </div>
                  {isSpectating && (
                    <div style={{
                      fontSize: '12px',
                      color: '#888',
                      marginBottom: '8px',
                      wordBreak: 'break-all'
                    }}>
                      {spectatedAddress.slice(0, 6)}...{spectatedAddress.slice(-4)}
                    </div>
                  )}
                  <div className="total-value-container">
                    <span className={`total-value ${isBlurred ? 'blurred' : ''}`}>
                      ${formatCommas(typeof totalAccountValue === 'number' ? totalAccountValue.toFixed(2) : '0.00')}
                    </span>
                    <div className="percentage-change-container">
                      <span
                        className={`percentage-value ${isBlurred ? 'blurred' : ''} ${percentage >= 0 ? 'positive' : 'negative'
                          }`}
                      >
                        {portChartLoading ? (
                          <div className="port-loading" style={{ width: 55 }} />
                        ) : (
                          `${percentage >= 0 ? '+' : ''}${formatCommas(percentage.toFixed(2))}%`
                        )}
                      </span>
                      <span className="time-range">
                        (past {getTimeRangeText(timeRange)})
                      </span>
                    </div>
                  </div>
                </div>
                <div className="trading-stats-container">
                  <div className="trading-stats-header">
                    <span className="trading-stats-title">
                      {isSpectating ? t("spectatedTradingStats") : t("tradingStats")}
                    </span>
                  </div>
                  <div className="stats-list">
                    <div className="stat-row">
                      Total Volume
                      <span className={`account-stat-value ${isBlurred ? 'blurred' : ''}`}>
                        {portChartLoading ? (
                          <div className="port-loading" style={{ width: 80 }} />
                        ) : (
                          `$${formatCommas(getActiveAddress() ? totalVolume.toFixed(2) : '0.00')}`
                        )}
                      </span>
                    </div>
                    <div className="stat-row">
                      Session High
                      <span className={`account-stat-value ${isBlurred ? 'blurred' : ''}`}>
                        {portChartLoading ? (
                          <div className="port-loading" style={{ width: 80 }} />
                        ) : (
                          `$${formatCommas(getActiveAddress() ? high.toFixed(2) : '0.00')}`
                        )}
                      </span>
                    </div>
                    <div className="stat-row">
                      Session Low
                      <span className={`account-stat-value ${isBlurred ? 'blurred' : ''}`}>
                        {portChartLoading ? (
                          <div className="port-loading" style={{ width: 80 }} />
                        ) : (
                          `$${formatCommas(getActiveAddress() ? low.toFixed(2) : '0.00')}`
                        )}
                      </span>
                    </div>
                    <div className="stat-row">
                      Active Orders
                      <span className={`account-stat-value`}>
                        {portChartLoading ? (
                          <div className="port-loading" style={{ width: 80 }} />
                        ) : (
                          `${getActiveAddress() ? activeOrders : 0}`
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-section">
              <OrderCenter
                orders={orders}
                tradehistory={tradehistory}
                canceledorders={canceledorders}
                router={router}
                address={getActiveAddress()}
                trades={trades}
                currentMarket={''}
                orderCenterHeight={orderCenterHeight}
                tokenList={tokenList}
                onMarketSelect={onMarketSelect}
                setSendTokenIn={setSendTokenIn}
                setpopup={setpopup}
                sortConfig={sortConfig}
                onSort={setSortConfig}
                tokenBalances={tokenBalances}
                hideMarketFilter={true}
                hideBalances={true}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                filter={filter}
                setFilter={setFilter}
                onlyThisMarket={onlyThisMarket}
                setOnlyThisMarket={setOnlyThisMarket}
                isPortfolio={true}
                refetch={refetch}
                sendUserOperationAsync={sendUserOperationAsync}
                setChain={setChain}
                isBlurred={isBlurred}
                openEditOrderPopup={() => { }}
                openEditOrderSizePopup={() => { }}
                marketsData={marketsData}
              />
              <div className="portfolio-balance-wrapper" style={{ height: orderCenterHeight }}>
                <div className="portfolio-balance-header"><span className="portfolio-balance-header-title">Balances</span></div>
                <PortfolioBalance
                  tokenList={tokenList}
                  onMarketSelect={onMarketSelect}
                  setSendTokenIn={setSendTokenIn}
                  setpopup={setpopup}
                  sortConfig={sortConfig}
                  onSort={setSortConfig}
                  tokenBalances={tokenBalances}
                  marketsData={marketsData}
                  isBlurred={isBlurred}
                />
              </div>
            </div>
          </div>
        );

      case 'wallets':
        const filteredWallets = subWallets.filter(wallet => {
          if (!walletSearchQuery.trim()) return true;

          const walletName = getWalletName(wallet.address, subWallets.indexOf(wallet)).toLowerCase();
          const searchLower = walletSearchQuery.toLowerCase();

          return walletName.includes(searchLower) ||
            wallet.address.toLowerCase().includes(searchLower);
        }).filter(wallet =>
          !sourceWallets.some(w => w.address === wallet.address) &&
          !destinationWallets.some(w => w.address === wallet.address)
        );

        return (
          <div className="wallets-drag-drop-layout">
            <div className="wallets-left-panel">
              <div className="wallets-summary">
                <div className="wallets-summary-left">
                  <div className="portfolio-wallet-search-container" >
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search wallets by name..."
                      className="portfolio-wallet-search-input"
                      value={walletSearchQuery}
                      onChange={(e) => setWalletSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="wallets-summary-right">

                  {selectedWalletsPerContainer.main.size > 0 && (
                    <span className="drop-zone-selected"> {selectedWalletsPerContainer.main.size} selected</span>
                  )}
                  <button
                    className="import-wallet-button"
                    onClick={openImportModal}
                  >
                    Import
                  </button>
                  <button
                    className="create-wallet-button"
                    onClick={createSubWallet}
                  >
                    Create Subwallet
                  </button>
                </div>
              </div>
              {subWallets.length === 0 ? (
                <div className="no-wallets-container">
                  <div className="no-wallets-message">
                    <h4>No Sub Wallets Found</h4>
                    <p>Create sub wallets to manage multiple wallets from one interface and trade with 1CT.</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
                      <button
                        className="create-wallet-cta-button"
                        onClick={createSubWallet}
                      >
                        Create Subwallet
                      </button>
                      <button
                        className="import-wallet-cta-button"
                        onClick={openImportModal}
                      >
                        Import Wallet
                      </button>
                    </div>
                  </div>
                </div>
              ) : filteredWallets.length === 0 && walletSearchQuery.trim() ? (
                <div className="no-wallets-container">
                  <div className="no-wallets-message">
                    <h4>No Wallets Found</h4>
                    <p>Try adjusting your search term</p>
                  </div>
                </div>
              ) : (
                <div className="drag-wallets-container">
                  <div className="wallets-table-header">
                    <div className="wallet-header-checkbox"></div>
                    <div className="wallet-header-name">Wallet</div>
                    <div className="wallet-header-balance">Balance</div>
                    <div className="wallet-header-holdings">Holdings</div>
                    <div className="wallet-header-actions">Actions</div>
                  </div>

                  {renderWalletContainer(
                    subWallets.filter(wallet =>
                      !sourceWallets.some(w => w.address === wallet.address) &&
                      !destinationWallets.some(w => w.address === wallet.address)
                    ),
                    'main',
                    'main-wallets',
                    ' ',
                    mainWalletsRef
                  )}
                </div>
              )}
            </div>

            <div className="wallets-right-panel">
              <div
                className={`drop-zone source-zone ${dragOverZone === 'source' ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'source')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleUniversalDrop(e, 'source')}              >
                <div className="drop-zone-header">
                  <span className="drop-zone-title">Source Wallets</span>
                  <span className="drop-zone-count">{sourceWallets.length}</span>
                  <div className="drop-zone-right-section">
                    {selectedWalletsPerContainer.source.size > 0 && (
                      <span className="drop-zone-selected">{selectedWalletsPerContainer.source.size} selected</span>
                    )}
                    {sourceWallets.length > 0 && (
                      <button
                        className="clear-zone-button"
                        onClick={() => setSourceWallets([])}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className="wallets-table-header">
                  <div className="wallet-header-checkbox"></div>
                  <div className="wallet-header-name">Wallet</div>
                  <div className="wallet-header-balance">Balance</div>
                  <div className="wallet-header-holdings">Holdings</div>
                  <div className="wallet-header-actions">Actions</div>
                </div>

                {renderWalletContainer(
                  sourceWallets,
                  'source',
                  'source-wallets',
                  'Drag wallets to distribute MON',
                  sourceWalletsRef
                )}
              </div>

              <div
                className={`drop-zone destination-zone ${dragOverZone === 'destination' ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'destination')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleUniversalDrop(e, 'destination')}              >
                <div className="drop-zone-header2">
                  <div className="destination-wallets-container">
                    <span className="drop-zone-title">Destination Wallets</span>
                    <span className="drop-zone-count">{destinationWallets.length}</span>
                    {!client && (
                      <button
                        className="clear-zone-button"
                        onClick={() => {
                          setDestinationWallets(prev => {
                            if (prev.some(w => w.address === scaAddress)) {
                              return prev.filter(w => w.address != scaAddress)
                            }
                            return [...prev, { address: scaAddress, balance: Number(walletTokenBalances?.[scaAddress]?.[settings.chainConfig[activechain].eth]) / 10 ** 18, name: "Main Wallet", type: "mainWallet", privateKey: "", index: 0, sourceZone: undefined }];
                          });
                        }}
                      >
                        {!destinationWallets.some(w => w.address === scaAddress) ? 'Add Main' : 'Remove Main'}
                      </button>
                    )}
                  </div>
                  <div className="drop-zone-right-section">
                    {selectedWalletsPerContainer.destination.size > 0 && (
                      <span className="drop-zone-selected">{selectedWalletsPerContainer.destination.size} selected</span>
                    )}
                    {destinationWallets.length > 0 && (
                      <>
                        <button
                          className="clear-zone-button"
                          onClick={() => setDestinationWallets([])}
                        >
                          Clear
                        </button>
                      </>
                    )}
                    {(sourceWallets.length > 0 && destinationWallets.length > 0) && (
                      <button
                        className="distribution-popup-button"
                        onClick={() => setShowDistributionModal(true)}
                      >
                        Distribute
                      </button>
                    )}
                  </div>
                </div>
                <div className="wallets-table-header">
                  <div className="wallet-header-checkbox"></div>
                  <div className="wallet-header-name">Wallet</div>
                  <div className="wallet-header-balance">Balance</div>
                  <div className="wallet-header-holdings">Holdings</div>
                  <div className="wallet-header-actions">Actions</div>
                </div>

                {renderWalletContainer(
                  destinationWallets,
                  'destination',
                  'destination-wallets',
                  'Drag destination wallets here',
                  destinationWalletsRef
                )}
              </div>
            </div>

            {showDistributionModal && (
              <div className="pk-modal-backdrop" onClick={() => !isVaultDepositSigning && setShowDistributionModal(false)}>
                <div className="pk-modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="pk-modal-header">
                    <h3 className="pk-modal-title">Distribute MON</h3>
                    <button className="pk-modal-close" onClick={() => setShowDistributionModal(false)}>
                      <img src={closebutton} className="close-button-icon" />
                    </button>
                  </div>
                  <div className="pk-modal-content">
                    <div className="distribution-settings" style={{ padding: 0 }}>
                      <div className="distribution-amount-section">
                        <label className="distribution-label">Amount to Distribute (MON):</label>
                        <div className="distribution-amount-input-container">
                          <input
                            type="text"
                            className="distribution-amount-input"
                            value={distributionAmount}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*\.?\d{0,18}$/.test(value)) {
                                const maxAmount = calculateMaxAmount();
                                const numValue = parseFloat(value);
                                if (numValue > maxAmount) {
                                  setDistributionAmount(maxAmount.toFixed(6));
                                  setSliderPercent(100);
                                } else {
                                  setDistributionAmount(value);
                                  if (maxAmount > 0 && value) {
                                    const percent = (numValue / maxAmount) * 100;
                                    setSliderPercent(Math.min(100, Math.max(0, isNaN(percent) ? 0 : percent)));
                                  } else if (!value) {
                                    setSliderPercent(0);
                                  }
                                }
                              }
                            }}
                            placeholder="Enter amount"
                          />
                          <button
                            className="deposit-max-button"
                            onClick={handleMaxAmount}
                            disabled={sourceWallets.length === 0}
                          >
                            Max
                          </button>
                        </div>
                      </div>

                      <div className="perps-balance-slider-wrapper" style={{ marginTop: '-10px' }}>
                        <div className="perps-slider-container perps-slider-mode">
                          <input
                            ref={sliderRef}
                            type="range"
                            className={`perps-balance-amount-slider ${isSliderDragging ? "dragging" : ""}`}
                            min="0"
                            max="100"
                            step="1"
                            value={sliderPercent}
                            onChange={(e) => {
                              const percent = parseInt(e.target.value);
                              handleSliderChange(percent);
                            }}
                            onMouseDown={() => {
                              setIsSliderDragging(true);
                              positionSliderPopup(sliderPercent);
                            }}
                            onMouseUp={() => setIsSliderDragging(false)}
                            style={{
                              background: `linear-gradient(to right, #aaaecf ${sliderPercent}%, rgb(21 21 27) ${sliderPercent}%)`,
                            }}
                          />
                          <div
                            ref={sliderPopupRef}
                            className={`perps-slider-percentage-popup ${isSliderDragging ? "visible" : ""}`}
                          >
                            {sliderPercent}%
                          </div>

                          <div className="perps-balance-slider-marks">
                            {[0, 25, 50, 75, 100].map((markPercent) => (
                              <span
                                key={markPercent}
                                className="perps-balance-slider-mark"
                                data-active={sliderPercent >= markPercent}
                                data-percentage={markPercent}
                                onClick={() => handleSliderChange(markPercent)}
                              >
                                {markPercent}%
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="main-wallet-balance-section">
                        <div className="main-wallet-balance-container">
                          <span className="main-wallet-balance-label">Available Balance:</span>
                          <div className="main-wallet-balance-value">
                            <img src={monadicon} className="main-wallet-balance-icon" alt="MON" />
                            <span className={`main-wallet-balance-amount ${isBlurred ? 'blurred' : ''}`}>
                              {calculateMaxAmount().toFixed(6)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="distribution-actions">
                        <button
                          className={`execute-distribution-button ${isVaultDepositSigning ? 'loading' : ''}`}
                          onClick={async () => {
                            await executeDistribution();
                            setShowDistributionModal(false);
                          }}
                          disabled={
                            sourceWallets.length === 0 ||
                            destinationWallets.length === 0 ||
                            !distributionAmount ||
                            parseFloat(distributionAmount) <= 0 ||
                            isVaultDepositSigning
                          }
                        >
                          {isVaultDepositSigning ? (
                            <div className="button-loading-spinner">
                              <svg
                                className="loading-spinner"
                                width="16"
                                height="16"
                                viewBox="0 0 50 50"
                              >
                              </svg>
                            </div>
                          ) : (
                            'Execute Distribution'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showImportModal && (
              <div className="pk-modal-backdrop" onClick={closeImportModal}>
                <div className="pk-modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="pk-modal-header">
                    <h3 className="pk-modal-title">Import Wallet</h3>
                    <button className="pk-modal-close" onClick={closeImportModal}>
                      <img src={closebutton} className="close-button-icon" />
                    </button>
                  </div>
                  <div className="pk-modal-content">
                    <div className="pk-input-section">
                      <span className="pk-label">Private Key:</span>
                      <div className="pk-input-container">
                        <input
                          type="text"
                          className="pk-input"
                          value={importPrivateKey}
                          onChange={(e) => {
                            setImportPrivateKey(e.target.value);
                            setImportError('');
                          }}
                          placeholder="0x... prefix is optional"
                          autoComplete="off"
                          spellCheck="false"
                        />
                        {importError && (
                          <div className="pk-error-message">
                            {importError}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pk-modal-actions">
                      <button
                        className={`pk-confirm-button ${isImporting ? 'loading' : ''}`}
                        onClick={handleImportWallet}
                        disabled={!importPrivateKey.trim() || isImporting}
                      >
                        {isImporting ? 'Importing...' : 'Import Wallet'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showExportModal && exportingWallet && (
              <div className="export-private-key-modal-backdrop" onClick={closeExportModal}>
                <div className="export-private-key-modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="export-private-key-modal-header">
                    <h3 className="export-private-key-modal-title">Export Private Key</h3>
                    <button className="export-private-key-modal-close" onClick={closeExportModal}>
                      <img src={closebutton} className="close-button-icon" />
                    </button>
                  </div>
                  <div className="export-private-key-modal-content">
                    <div className="export-private-key-warning">
                      <div className="export-private-key-warning-text">
                        Never share your private key with anyone. Anyone with access to your private key can control your wallet and steal your funds.
                      </div>
                    </div>

                    <div className="export-private-key-wallet-info">
                      <div className="export-private-key-info-row">
                        <span className="export-private-key-label">Address:</span>
                        <span className="export-private-key-value">{exportingWallet.address.slice(0, 6)}...{exportingWallet.address.slice(-4)}</span>
                      </div>
                      <div className="export-private-key-info-row">
                        <span className="export-private-key-label">Name:</span>
                        <span className="export-private-key-value">
                          {getWalletName(exportingWallet.address, subWallets.findIndex(w => w.address === exportingWallet.address))}
                        </span>
                      </div>
                    </div>

                    <div className="export-private-key-section">
                      <span className="export-private-key-pk-label">Private Key:</span>
                      <div className="export-private-key-container">
                        {!privateKeyRevealed ? (
                          <div
                            className="export-private-key-reveal-button"
                            onClick={revealPrivateKey}
                          >
                            <span>Click to reveal private key</span>
                          </div>
                        ) : (
                          <>
                            <textarea
                              className="export-private-key-input"
                              value={exportingWallet.privateKey}
                              readOnly
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showDeleteConfirmation && (
              <div className="delete-confirmation-modal-backdrop" onClick={() => setShowDeleteConfirmation(false)}>
                <div className="delete-confirmation-modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="delete-confirmation-modal-header">
                    <h3 className="delete-confirmation-modal-title">Delete Wallet</h3>
                    <button className="delete-confirmation-modal-close" onClick={() => setShowDeleteConfirmation(false)}>
                      <img src={closebutton} className="close-button-icon" />
                    </button>
                  </div>
                  <div className="delete-confirmation-modal-content">
                    <div className="delete-confirmation-warning">
                      <div className="delete-confirmation-warning-text">
                        <h4>Are you sure you want to delete this wallet?</h4>
                        <p>This action cannot be undone. The private key will not be recoverable unless you have it saved elsewhere.</p>
                      </div>
                    </div>
                    <div className="delete-confirmation-actions">
                      <button
                        className="delete-confirmation-confirm-button"
                        onClick={() => deleteWallet(walletToDelete)}
                      >
                        Delete Wallet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'trenches':
        return (
          <div className="trenches-container">
            <div className="trenches-second-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div ref={trenchesDropdownRef} style={{ position: 'relative' }} className="trenches-dropdown">
                  <button
                    className="footer-transparent-button"
                    style={{ height: '30px' }}
                    onClick={() => setIsTrenchesWalletDropdownOpen(!isTrenchesWalletDropdownOpen)}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        width: '100%',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: '300' }}>
                        {trenchesSelectedWallets.size} {trenchesSelectedWallets.size === 1 ? 'wallet' : 'wallets'}
                      </span>
                      <svg
                        className={`footer-wallet-dropdown-arrow ${isTrenchesWalletDropdownOpen ? 'open' : ''}`}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </button>

                  <div className={`wallet-dropdown-panel ${isTrenchesWalletDropdownOpen ? 'visible' : ''}`} style={{right: 'auto'}}>
                    <div className="footer-wallet-dropdown-header">
                      <div className="footer-wallet-dropdown-actions">
                        <button
                          className="wallet-action-btn"
                          onClick={
                            trenchesSelectedWallets.size === (subWallets.length + 1)
                              ? unselectAllTrenchesWallets
                              : selectAllTrenchesWallets
                          }
                        >
                          {trenchesSelectedWallets.size === (subWallets.length + 1)
                            ? 'Unselect All'
                            : 'Select All'}
                        </button>
                        <button
                          className="wallet-action-btn"
                          onClick={selectAllTrenchesWithBalance}
                        >
                          Select All with Balance
                        </button>
                      </div>
                    </div>

                    <div className="wallet-dropdown-list">
                      <div>
                        <div
                          className={`footer-wallet-item ${trenchesSelectedWallets.has(scaAddress) ? 'selected' : ''}`}
                          onClick={() => toggleTrenchesWalletSelection(scaAddress)}
                        >
                          <div className="quickbuy-wallet-checkbox-container">
                            <input
                              type="checkbox"
                              className="quickbuy-wallet-checkbox selection"
                              checked={trenchesSelectedWallets.has(scaAddress)}
                              readOnly
                            />
                          </div>
                          <div className="wallet-dropdown-info">
                            <div className="quickbuy-wallet-name">
                              Main Wallet
                            </div>
                            <div
                              className="wallet-dropdown-address"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(scaAddress, 'Wallet address copied');
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              {scaAddress?.slice(0, 6)}...{scaAddress?.slice(-4)}
                              <svg
                                className="wallet-dropdown-address-copy-icon"
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                style={{ marginLeft: '2px' }}
                              >
                                <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                              </svg>
                            </div>
                          </div>
                          <div className="wallet-dropdown-balance">
                            {(() => {
                              const gasReserve = BigInt(settings.chainConfig[activechain].gasamount ?? 0);
                              const balanceWei = walletTokenBalances[scaAddress]?.[
                                settings.chainConfig[activechain]?.eth
                              ] || 0n;
                              const hasInsufficientGas = balanceWei > 0n && balanceWei <= gasReserve;
                              const balance = getWalletBalance(scaAddress);

                              return (
                                <Tooltip content={hasInsufficientGas ? "Not enough for gas, transactions will revert" : "MON Balance"}>
                                  <div
                                    className={`wallet-dropdown-balance-amount ${hasInsufficientGas ? 'insufficient-gas' : ''}`}
                                  >
                                    <img
                                      src={monadicon}
                                      className="wallet-dropdown-mon-icon"
                                      alt="MON"
                                    />
                                    {formatBalanceCompact(balance)}
                                  </div>
                                </Tooltip>
                              );
                            })()}
                          </div>
                          <div className="wallet-drag-tokens">
                            <div className="wallet-token-count">
                              <div className="wallet-token-structure-icons">
                                <div className="token1"></div>
                                <div className="token2"></div>
                                <div className="token3"></div>
                              </div>
                              <span className="wallet-total-tokens">
                                {getWalletTokenCount(scaAddress)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Sub Wallets */}
                        {subWallets.map((wallet, index) => {
                          const balance = getWalletBalance(wallet.address);
                          const isSelected = trenchesSelectedWallets.has(wallet.address);
                          return (
                            <div
                              key={wallet.address}
                              className={`footer-wallet-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => toggleTrenchesWalletSelection(wallet.address)}
                            >
                              <div className="quickbuy-wallet-checkbox-container">
                                <input
                                  type="checkbox"
                                  className="quickbuy-wallet-checkbox selection"
                                  checked={isSelected}
                                  readOnly
                                />
                              </div>
                              <div className="wallet-dropdown-info">
                                <div className="quickbuy-wallet-name">
                                  {getWalletName(wallet.address, index)}
                                </div>
                                <div
                                  className="wallet-dropdown-address"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(wallet.address, 'Wallet address copied');
                                  }}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                                  <svg
                                    className="wallet-dropdown-address-copy-icon"
                                    width="11"
                                    height="11"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    style={{ marginLeft: '2px' }}
                                  >
                                    <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="wallet-dropdown-balance">
                                {(() => {
                                  const gasReserve = BigInt(settings.chainConfig[activechain].gasamount ?? 0);
                                  const balanceWei = walletTokenBalances[wallet.address]?.[
                                    settings.chainConfig[activechain]?.eth
                                  ] || 0n;
                                  const hasInsufficientGas = balanceWei > 0n && balanceWei <= gasReserve;

                                  return (
                                    <Tooltip content={hasInsufficientGas ? "Not enough for gas, transactions will revert" : "MON Balance"}>
                                      <div
                                        className={`wallet-dropdown-balance-amount ${hasInsufficientGas ? 'insufficient-gas' : ''}`}
                                      >
                                        <img
                                          src={monadicon}
                                          className="wallet-dropdown-mon-icon"
                                          alt="MON"
                                        />
                                        {formatBalanceCompact(balance)}
                                      </div>
                                    </Tooltip>
                                  );
                                })()}
                              </div>
                              <div className="wallet-drag-tokens">
                                <div className="wallet-token-count">
                                  <div className="wallet-token-structure-icons">
                                    <div className="token1"></div>
                                    <div className="token2"></div>
                                    <div className="token3"></div>
                                  </div>
                                  <span className="wallet-total-tokens">
                                    {getWalletTokenCount(wallet.address)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="trenches-balance-display">
                  <img
                    src={monadicon}
                    style={{
                      width: '15px',
                      height: '15px',
                      marginRight: '4px',
                    }}
                    alt="MON"
                  />
                  <span style={{ fontSize: '1rem', color: "white" }}>
                    {formatBalanceCompact(totalTrenchesSelectedBalance)}
                  </span>
                </div>

                <div className="trenches-wallet-token-count">
                  <div className="wallet-token-structure-icons">
                    <div className="token1"></div>
                    <div className="token2"></div>
                    <div className="token3"></div>
                  </div>
                  <span className="trenches-wallet-total-tokens">{totalTrenchesTokenCount}</span>
                </div>

              </div>

              <div className="trenches-time-controls">
                <div className="trenches-time-button">1d</div>
                <div className="trenches-time-button">7d</div>
                <div className="trenches-time-button">30d</div>
                <div className="trenches-time-button-active">MAX</div>
              </div>
            </div>
            <div className="trenches-top-section">

              <div className="trenches-balance-section">
                <h3 className="trenches-balance-title">BALANCE</h3>
                <div>
                  <div className="trenches-balance-item">
                    <div className="trenches-balance-label">Total Value</div>
                    <div className={`trenches-balance-value ${isBlurred ? 'blurred' : ''}`}>
                    <span className="wallet-dropdown-value">
                        {isSpectating ? (
                            isSpectatorLoading ? (
                                <div className="port-loading" style={{ width: 100, height: 20 }} />
                            ) : (
                                `$${formatNumberWithCommas(spectatorTotalValue, 2)}`
                            )
                        ) : (
                            `$${formatNumberWithCommas(
                            subWallets.reduce((total, wallet) =>
                                total + (getWalletBalance(wallet.address) * monUsdPrice),
                                0
                            ) + getWalletBalance(scaAddress) * monUsdPrice, 2)}`
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="trenches-balance-item">
                    <div className="trenches-balance-label">Unrealized PNL</div>
                    <div
                      className={`trenches-balance-value-small ${unrealizedClass} ${isBlurred ? 'blurred' : ''}`}
                    >
                      {unrealizedSign}${
                        formatNumberWithCommas(Math.abs(totalUnrealizedPnlUsd), 2)
                      }
                    </div>
                  </div>


                  <div className="trenches-balance-item">
                    <div className="trenches-balance-label">Realized PNL</div>
                    <div className={`trenches-balance-value-small ${realizedClass} ${isBlurred ? 'blurred' : ''}`}>
                      {realizedSign}${formatNumberWithCommas(Math.abs(totalRealizedPnlUsd), 2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="trenches-pnl-section">
                <div className="trenches-pnl-header">
                  <h3 className="trenches-pnl-title">REALIZED PNL</h3>
                  <button
                    className="trenches-pnl-calendar-button"
                    onClick={() => {
                      setPNLCalendarLoading(true);
                      setTimeout(() => {
                        setPNLCalendarLoading(false);
                        setShowPNLCalendar(true);
                      }, 2000);
                    }}
                  >
                    <svg fill="#cfcfdfff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="18" height="18"><path d="M 8 8 L 8 20 L 56 20 L 56 8 L 46 8 L 46 9 C 46 10.657 44.657 12 43 12 C 41.343 12 40 10.657 40 9 L 40 8 L 24 8 L 24 9 C 24 10.657 22.657 12 21 12 C 19.343 12 18 10.657 18 9 L 18 8 L 8 8 z M 8 22 L 8 56 L 56 56 L 56 24 L 52 23.832031 L 52 45 C 52 47 47 47 47 47 C 47 47 47 52 44 52 L 12 52 L 12 22.167969 L 8 22 z M 19 29 L 19 35 L 25 35 L 25 29 L 19 29 z M 29 29 L 29 35 L 35 35 L 35 29 L 29 29 z M 39 29 L 39 35 L 45 35 L 45 29 L 39 29 z M 19 39 L 19 45 L 25 45 L 25 39 L 19 39 z M 29 39 L 29 45 L 35 45 L 35 39 L 29 39 z M 39 39 L 39 45 L 45 45 L 45 39 L 39 39 z" /></svg>
                  </button>
                </div>

                <div className="trenches-pnl-chart">
                  <div className="trenches-pnl-placeholder">
                    No trading data
                  </div>
                </div>
              </div>

              <div className="trenches-performance-section">
                <div className="trenches-performance-header">
                  <h3 className="trenches-performance-title">PERFORMANCE</h3>
                  <button
                    className="trenches-pnl-button"
                    onClick={() => setpopup(27)}
                  >
                    <svg fill="#cfcfdfff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="16" height="16"><path d="M 31.964844 2.0078125 A 2 2 0 0 0 30.589844 2.5898438 L 20.349609 12.820312 A 2.57 2.57 0 0 0 19.910156 13.470703 A 2 2 0 0 0 21.759766 16.240234 L 30 16.240234 L 30 39.779297 A 2 2 0 0 0 34 39.779297 L 34 16.240234 L 42.25 16.240234 A 2 2 0 0 0 43.660156 12.820312 L 33.410156 2.5898438 A 2 2 0 0 0 31.964844 2.0078125 z M 4 21.619141 A 2 2 0 0 0 2 23.619141 L 2 56 A 2 2 0 0 0 4 58 L 60 58 A 2 2 0 0 0 62 56 L 62 23.619141 A 2 2 0 0 0 60 21.619141 L 44.269531 21.619141 A 2 2 0 0 0 44.269531 25.619141 L 58 25.619141 L 58 54 L 6 54 L 6 25.619141 L 19.730469 25.619141 A 2 2 0 0 0 19.730469 21.619141 L 4 21.619141 z" /></svg>                  </button>
                </div>
                {(() => {
                  const oneDayAgo = Date.now() / 1000 - 24 * 60 * 60;
                  const totalPositions = activePositions.length;
                  const activePositionsCount = activePositions.filter(p => p.remainingTokens > 0).length;

                  return (
                    <div className="trenches-performance-stats">
                      <div className="trenches-performance-stat-row">
                        <span className="trenches-performance-stat-label">Total Unrealized PNL</span>
                        <span className={`trenches-performance-stat-value ${unrealizedClass} ${isBlurred ? 'blurred' : ''}`}>
                          {unrealizedSign}${formatNumberWithCommas(Math.abs(totalUnrealizedPnlUsd), 2)}
                        </span>
                      </div>
                      <div className="trenches-performance-stat-row">
                        <span className="trenches-performance-stat-label">Total Realized PNL</span>
                        <span className={`trenches-performance-stat-value ${realizedClass} ${isBlurred ? 'blurred' : ''}`}>
                          {realizedSign}${formatNumberWithCommas(Math.abs(totalRealizedPnlUsd), 2)}
                        </span>
                      </div>
                      <div className="trenches-performance-stat-row">
                        <span className="trenches-performance-stat-label">Positions</span>
                        <span className={`trenches-performance-stat-value ${isBlurred ? 'blurred' : ''}`}>
                          {activePositionsCount}/{totalPositions}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="trenches-performance-ranges">
                  {calculatePerformanceRanges().map((range, index) => (
                    <div key={index} className="trenches-performance-range">
                      <span className="trenches-performance-range-label">
                        <span style={{
                          display: 'inline-block',
                          width: '9px',
                          height: '9px',
                          borderRadius: '50%',
                          backgroundColor: range.color
                        }}></span>
                        {range.label}
                      </span>
                      <span className="trenches-performance-range-count">
                        {range.count}
                      </span>
                    </div>
                  ))}
                </div>
                {(() => {
                  const { buyPercent, sellPercent } = calculateBuySellRatio();
                  return (
                    <div className="pnl-calendar-ratio-container">
                      <div
                        className="pnl-calendar-ratio-buy"
                        style={{ width: `${buyPercent}%` }}
                      ></div>
                      <div
                        className="pnl-calendar-ratio-sell"
                        style={{ width: `${sellPercent}%` }}
                      ></div>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="trenches-main-content">
              <div className="trenches-activity-section">
                <div className="trenches-activity-header">
                  <div className="trenches-activity-tabs">
                    {[
                      { key: 'positions', label: 'Active Positions' },
                      { key: 'history', label: 'History' },
                      { key: 'top100', label: 'Top 100' }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        className={`trenches-activity-tab ${activeHistoryTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveHistoryTab(tab.key as 'positions' | 'history' | 'top100')}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="trenches-activity-filters">
                    <input
                      type="text"
                      placeholder="Search by name or address"
                      className="trenches-search-input"
                      value={trenchesSearchQuery}
                      onChange={(e) => setTrenchesSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                {activeHistoryTab === 'positions' && (

                  <div className="meme-oc-section-content" data-section="positions">
                    <div className="meme-oc-header">
                      <div className="meme-oc-header-cell">Token</div>
                      <div
                        className="meme-oc-header-cell clickable"
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        Bought
                      </div>
                      <div className="meme-oc-header-cell">Sold</div>
                      <div className="meme-oc-header-cell">Remaining</div>
                      <div className="meme-oc-header-cell">PnL</div>
                      <div className="meme-oc-header-cell">Actions</div>
                    </div>
                    <div className="meme-oc-items">
                      {activePositions.filter(p => p.remainingTokens > 0).length === 0 ? (
                        <div className="meme-oc-empty">
                          No active positions
                        </div>
                      ) : (
                        (() => {
                          const filteredPositions = [...activePositions
                            .filter(p => p.remainingTokens > 0)]
                            .filter(p => {
                              if (!trenchesSearchQuery.trim()) return true;

                              const searchLower = trenchesSearchQuery.toLowerCase();
                              const tokenName = (p.name || '').toLowerCase();
                              const tokenSymbol = (p.symbol || '').toLowerCase();
                              const tokenAddress = p.tokenId.toLowerCase();

                              return tokenName.includes(searchLower) ||
                                tokenSymbol.includes(searchLower) ||
                                tokenAddress.includes(searchLower);
                            })
                            .sort((a, b) => (b.pnlNative ?? 0) - (a.pnlNative ?? 0));

                          if (filteredPositions.length === 0) {
                            return (
                              <div className="meme-oc-empty">
                                No positions found matching "{trenchesSearchQuery}"
                              </div>
                            );
                          }

                          return filteredPositions.map((p) => {
                            const tokenShort =
                              p.symbol ||
                              (p.tokenId ? `${p.tokenId.slice(0, 6)}…${p.tokenId.slice(-4)}` : 'Unknown');
                            const tokenImageUrl = p.imageUrl || null;
                            return (
                              <div key={p.tokenId} className="meme-portfolio-oc-item">
                                <div className="meme-oc-cell">
                                  <div className="oc-meme-wallet-info">
                                    <div
                                      className="meme-portfolio-token-info"
                                      style={{ display: 'flex', alignItems: 'center' }}
                                    >
                                      <div className="meme-portfolio-token-icon-container">
                                        {tokenImageUrl && !tokenImageErrors[p.tokenId] ? (
                                          <img
                                            src={tokenImageUrl}
                                            alt={p.symbol}
                                            className="meme-portfolio-token-icon"
                                            onError={() => {
                                              setTokenImageErrors(prev => ({ ...prev, [p.tokenId]: true }));
                                            }}
                                          />
                                        ) : (
                                          <div
                                            className="meme-portfolio-token-icon"
                                            style={{
                                              backgroundColor: 'rgba(35, 34, 41, .7)',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              fontSize: (p.symbol || '').length <= 3 ? '14px' : '12px',
                                              fontWeight: '200',
                                              color: '#ffffff',
                                              borderRadius: '1px',
                                              letterSpacing: (p.symbol || '').length > 3 ? '-0.5px' : '0',
                                            }}
                                          >
                                            {(p.symbol || p.name || '?').slice(0, 2).toUpperCase()}
                                          </div>
                                        )}

                                        <div className={`portfolio-launchpad-indicator ${p.source === 'nadfun' ? 'nadfun' : ''}`
                                        }>
                                          <Tooltip content="nad.fun">
                                            <svg width="10" height="10" viewBox="0 0 32 32" className="header-launchpad-logo" fill="none" xmlns="http://www.w3.org/2000/svg">
                                              <defs>
                                                <linearGradient id="nadfun" x1="0%" y1="0%" x2="100%" y2="0%">
                                                  <stop offset="0%" stopColor="#7C55FF" stopOpacity="1" />
                                                  <stop offset="100%" stopColor="#AD5FFB" stopOpacity="1" />
                                                </linearGradient>
                                              </defs>
                                              <path fill="url(#nadfun)" d="m29.202 10.664-4.655-3.206-3.206-4.653A6.48 6.48 0 0 0 16.004 0a6.48 6.48 0 0 0-5.337 2.805L7.46 7.458l-4.654 3.206a6.474 6.474 0 0 0 0 10.672l4.654 3.206 3.207 4.653A6.48 6.48 0 0 0 16.004 32a6.5 6.5 0 0 0 5.337-2.805l3.177-4.616 4.684-3.236A6.49 6.49 0 0 0 32 16.007a6.47 6.47 0 0 0-2.806-5.335zm-6.377 5.47c-.467 1.009-1.655.838-2.605 1.06-2.264.528-2.502 6.813-3.05 8.35-.424 1.484-1.916 1.269-2.272 0-.631-1.53-.794-6.961-2.212-7.993-.743-.542-2.502-.267-3.177-.95-.668-.675-.698-1.729-.023-2.412l5.3-5.298a1.734 1.734 0 0 1 2.45 0l5.3 5.298c.505.505.586 1.306.297 1.937z" />
                                            </svg>
                                          </Tooltip>
                                        </div>
                                      </div>
                                      <span
                                        className="portfolio-meme-wallet-address portfolio-meme-clickable-token"
                                        onClick={() => {
                                          navigate(`/meme/${p.tokenId}`)
                                        }}
                                      >
                                        <span className="meme-token-symbol-portfolio">
                                          {tokenShort}
                                        </span>
                                        <span className="meme-token-name-portfolio">
                                          {p.name}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="meme-oc-cell">
                                  <div className="meme-trade-info">
                                    <div className="meme-ordercenter-info">
                                      {amountMode === 'MON' && (
                                        <img
                                          className="meme-portfolio-monad-icon"
                                          src={monadicon}
                                          alt="MONAD"
                                        />
                                      )}
                                      <span className={`meme-usd-amount buy ${isBlurred ? 'blurred' : ''}`}>
                                        {fmtAmount(
                                          p.spentNative,
                                          amountMode,
                                          monUsdPrice,
                                        )}{' '}
                                      </span>
                                    </div>
                                    <span className="meme-token-amount">
                                      {fmt(p.boughtTokens)} {p.symbol || ''}
                                    </span>
                                  </div>
                                </div>
                                <div className="meme-oc-cell">
                                  <div className="meme-trade-info">
                                    <div className="meme-ordercenter-info">
                                      {amountMode === 'MON' && (
                                        <img
                                          className="meme-portfolio-monad-icon"
                                          src={monadicon}
                                          alt="MONAD"
                                        />
                                      )}
                                      <span className={`meme-usd-amount sell ${isBlurred ? 'blurred' : ''}`}>
                                        {fmtAmount(
                                          p.receivedNative,
                                          amountMode,
                                          monUsdPrice,
                                        )}
                                      </span>
                                    </div>
                                    <span className="meme-token-amount">
                                      {fmt(p.soldTokens)} {p.symbol || ''}
                                    </span>
                                  </div>
                                </div>
                                <div className="meme-oc-cell">
                                  <div className="meme-remaining-info">
                                    <div className="meme-remaining-container">
                                      <span className={`meme-remaining ${isBlurred ? 'blurred' : ''}`}>
                                        <img
                                          src={monadicon}
                                          className="meme-portfolio-monad-icon"
                                        />
                                        {fmt(p.remainingTokens * (p.lastPrice || 0))}
                                      </span>
                                      <span className="meme-remaining-percentage">
                                        {p.remainingPct.toFixed(0)}%
                                      </span>
                                    </div>
                                    <div className="meme-remaining-bar">
                                      <div
                                        className="meme-remaining-bar-fill"
                                        style={{
                                          width: `${Math.max(0, Math.min(100, p.remainingPct)).toFixed(0)}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="meme-oc-cell">
                                  <div className="meme-ordercenter-info">
                                    {amountMode === 'MON' && (
                                      <img
                                        className="meme-portfolio-pnl-monad-icon"
                                        src={monadicon}
                                        alt="MONAD"
                                      />
                                    )}
                                    <div className="meme-pnl-info">
                                      <span
                                        className={`meme-portfolio-pnl ${p.pnlNative >= 0 ? 'positive' : 'negative'} ${isBlurred ? 'blurred' : ''}`}
                                      >
                                        {p.pnlNative >= 0 ? '+' : '-'}
                                        {fmtAmount(
                                          Math.abs(p.pnlNative),
                                          amountMode,
                                          monUsdPrice,
                                        )}{' '}
                                        (
                                        {p.spentNative > 0
                                          ? ((p.pnlNative / p.spentNative) * 100).toFixed(
                                            1,
                                          )
                                          : '0.0'}
                                        %)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="meme-oc-cell">
                                  <button
                                    className="meme-action-btn"
                                    onClick={() => {
                                      if (onSellPosition) {
                                        onSellPosition(p, (p.remainingTokens * (p.lastPrice || 0)).toString());
                                      }
                                    }}
                                  >
                                    Sell
                                  </button>
                                </div>
                              </div>
                            );
                          });
                        })()

                      )}
                    </div>
                  </div>
                )}
                {activeHistoryTab === 'history' && (
                  <div className="meme-oc-section-content" data-section="history">
                    <div className="meme-oc-header">
                      <div className="meme-oc-header-cell">Token</div>
                      <div className="meme-oc-header-cell">Bought</div>
                      <div className="meme-oc-header-cell">Sold</div>
                      <div className="meme-oc-header-cell">Remaining</div>
                      <div className="meme-oc-header-cell">PnL</div>
                      <div className="meme-oc-header-cell">Actions</div>
                    </div>
                    <div className="meme-oc-items">
                      {activePositions.filter(p => p.remainingTokens === 0).length === 0 ? (
                        <div className="meme-oc-empty">
                          No trading history
                        </div>
                      ) : (
                        (() => {
                          const filteredHistory = [...activePositions
                            .filter(p => p.remainingTokens === 0)]
                            .filter(p => {
                              if (!trenchesSearchQuery.trim()) return true;

                              const searchLower = trenchesSearchQuery.toLowerCase();
                              const tokenName = (p.name || '').toLowerCase();
                              const tokenSymbol = (p.symbol || '').toLowerCase();
                              const tokenAddress = p.tokenId.toLowerCase();

                              return tokenName.includes(searchLower) ||
                                tokenSymbol.includes(searchLower) ||
                                tokenAddress.includes(searchLower);
                            })
                            .sort((a, b) => (b.pnlNative ?? 0) - (a.pnlNative ?? 0));

                          if (filteredHistory.length === 0) {
                            return (
                              <div className="meme-oc-empty">
                                No history found matching "{trenchesSearchQuery}"
                              </div>
                            );
                          }

                          return filteredHistory.map((p) => {
                            const tokenShort =
                              p.symbol ||
                              (p.tokenId ? `${p.tokenId.slice(0, 6)}…${p.tokenId.slice(-4)}` : 'Unknown');
                            const tokenImageUrl = p.imageUrl || null;
                            return (
                              <div key={p.tokenId} className="meme-portfolio-oc-item meme-portfolio-oc-item-5-col">
                                <div className="meme-oc-cell">
                                  <div className="oc-meme-wallet-info">
                                    <div className="meme-portfolio-token-info">
                                      <div className="meme-portfolio-token-icon-container">
                                        {tokenImageUrl && !tokenImageErrors[p.tokenId] ? (
                                          <img
                                            src={tokenImageUrl}
                                            alt={p.symbol}
                                            className="meme-portfolio-token-icon"
                                            onError={() => {
                                              setTokenImageErrors(prev => ({ ...prev, [p.tokenId]: true }));
                                            }}
                                          />
                                        ) : (
                                          <div
                                            className="meme-portfolio-token-icon"
                                            style={{
                                              backgroundColor: 'rgba(35, 34, 41, .7)',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              fontSize: (p.symbol || '').length <= 3 ? '14px' : '12px',
                                              fontWeight: '200',
                                              color: '#ffffff',
                                              borderRadius: '1px',
                                              letterSpacing: (p.symbol || '').length > 3 ? '-0.5px' : '0',
                                            }}
                                          >
                                            {(p.symbol || p.name || '?').slice(0, 2).toUpperCase()}
                                          </div>
                                        )}
                                        <div className={`portfolio-launchpad-indicator ${p.source === 'nadfun' ? 'nadfun' : ''}`}>
                                          <Tooltip content="nad.fun">
                                            <svg width="10" height="10" viewBox="0 0 32 32" className="header-launchpad-logo" fill="none" xmlns="http://www.w3.org/2000/svg">
                                              <defs>
                                                <linearGradient id="nadfun" x1="0%" y1="0%" x2="100%" y2="0%">
                                                  <stop offset="0%" stopColor="#7C55FF" stopOpacity="1" />
                                                  <stop offset="100%" stopColor="#AD5FFB" stopOpacity="1" />
                                                </linearGradient>
                                              </defs>
                                              <path fill="url(#nadfun)" d="m29.202 10.664-4.655-3.206-3.206-4.653A6.48 6.48 0 0 0 16.004 0a6.48 6.48 0 0 0-5.337 2.805L7.46 7.458l-4.654 3.206a6.474 6.474 0 0 0 0 10.672l4.654 3.206 3.207 4.653A6.48 6.48 0 0 0 16.004 32a6.5 6.5 0 0 0 5.337-2.805l3.177-4.616 4.684-3.236A6.49 6.49 0 0 0 32 16.007a6.47 6.47 0 0 0-2.806-5.335zm-6.377 5.47c-.467 1.009-1.655.838-2.605 1.06-2.264.528-2.502 6.813-3.05 8.35-.424 1.484-1.916 1.269-2.272 0-.631-1.53-.794-6.961-2.212-7.993-.743-.542-2.502-.267-3.177-.95-.668-.675-.698-1.729-.023-2.412l5.3-5.298a1.734 1.734 0 0 1 2.45 0l5.3 5.298c.505.505.586 1.306.297 1.937z" />
                                            </svg>
                                          </Tooltip>
                                        </div>
                                      </div>
                                      <span
                                        className="portfolio-meme-wallet-address portfolio-meme-clickable-token"
                                        onClick={() => navigate(`/meme/${p.tokenId}`)}
                                      >
                                        <span className="meme-token-symbol-portfolio">
                                          {tokenShort}
                                        </span>
                                        <span className="meme-token-name-portfolio">
                                          {p.name}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="meme-oc-cell">
                                  <div className="meme-trade-info">
                                    <div className="meme-ordercenter-info">
                                      {amountMode === 'MON' && (
                                        <img className="meme-portfolio-monad-icon" src={monadicon} alt="MONAD" />
                                      )}
                                      <span className={`meme-usd-amount buy ${isBlurred ? 'blurred' : ''}`}>
                                        {fmtAmount(p.spentNative, amountMode, monUsdPrice)}
                                      </span>
                                    </div>
                                    <span className="meme-token-amount">
                                      {fmt(p.boughtTokens)} {p.symbol || ''}
                                    </span>
                                  </div>
                                </div>
                                <div className="meme-oc-cell">
                                  <div className="meme-trade-info">
                                    <div className="meme-ordercenter-info">
                                      {amountMode === 'MON' && (
                                        <img className="meme-portfolio-monad-icon" src={monadicon} alt="MONAD" />
                                      )}
                                      <span className={`meme-usd-amount sell ${isBlurred ? 'blurred' : ''}`}>
                                        {fmtAmount(p.receivedNative, amountMode, monUsdPrice)}
                                      </span>
                                    </div>
                                    <span className="meme-token-amount">
                                      {fmt(p.soldTokens)} {p.symbol || ''}
                                    </span>
                                  </div>
                                </div>
                                <div className="meme-oc-cell">
                                  <div className="meme-remaining-info">
                                    <div className="meme-remaining-container">
                                      <span className={`meme-remaining ${isBlurred ? 'blurred' : ''}`}>
                                        <img src={monadicon} className="meme-portfolio-monad-icon" />
                                        {fmt(p.remainingTokens * (p.lastPrice || 0))}
                                      </span>
                                      <span className="meme-remaining-percentage">
                                        {p.remainingPct.toFixed(0)}%
                                      </span>
                                    </div>
                                    <div className="meme-remaining-bar">
                                      <div
                                        className="meme-remaining-bar-fill"
                                        style={{
                                          width: `${Math.max(0, Math.min(100, p.remainingPct)).toFixed(0)}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="meme-oc-cell">
                                  <div className="meme-ordercenter-info">
                                    {amountMode === 'MON' && (
                                      <img className="meme-portfolio-pnl-monad-icon" src={monadicon} alt="MONAD" />
                                    )}
                                    <div className="meme-pnl-info">
                                      <span className={`meme-portfolio-pnl ${p.pnlNative >= 0 ? 'positive' : 'negative'} ${isBlurred ? 'blurred' : ''}`}>
                                        {p.pnlNative >= 0 ? '+' : '-'}
                                        {fmtAmount(Math.abs(p.pnlNative), amountMode, monUsdPrice)} (
                                        {p.spentNative > 0
                                          ? ((p.pnlNative / p.spentNative) * 100).toFixed(1)
                                          : '0.0'}%)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="meme-oc-cell">
                                  <button
                                    className="share-pnl-btn"
                                    onClick={() => {
                                      const shareData = {
                                        tokenAddress: p.tokenId,
                                        tokenSymbol: p.symbol || 'Unknown',
                                        tokenName: p.name || 'Unknown Token',
                                        userAddress: address,
                                        externalUserStats: {
                                          balance: p.remainingTokens,
                                          amountBought: p.boughtTokens,
                                          amountSold: p.soldTokens,
                                          valueBought: p.spentNative,
                                          valueSold: p.receivedNative,
                                          valueNet: p.pnlNative,
                                        },
                                        currentPrice: p.lastPrice || 0,
                                      };

                                      if (onMarketSelect) {
                                        onMarketSelect(shareData);
                                      }

                                      if (setpopup) {
                                        setpopup(27);
                                      }
                                    }}
                                  >
                                    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="16" height="16">
                                      <path d="M 31.964844 2.0078125 A 2 2 0 0 0 30.589844 2.5898438 L 20.349609 12.820312 A 2.57 2.57 0 0 0 19.910156 13.470703 A 2 2 0 0 0 21.759766 16.240234 L 30 16.240234 L 30 39.779297 A 2 2 0 0 0 34 39.779297 L 34 16.240234 L 42.25 16.240234 A 2 2 0 0 0 43.660156 12.820312 L 33.410156 2.5898438 A 2 2 0 0 0 31.964844 2.0078125 z M 4 21.619141 A 2 2 0 0 0 2 23.619141 L 2 56 A 2 2 0 0 0 4 58 L 60 58 A 2 2 0 0 0 62 56 L 62 23.619141 A 2 2 0 0 0 60 21.619141 L 44.269531 21.619141 A 2 2 0 0 0 44.269531 25.619141 L 58 25.619141 L 58 54 L 6 54 L 6 25.619141 L 19.730469 25.619141 A 2 2 0 0 0 19.730469 21.619141 L 4 21.619141 z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            );
                          });
                        })()
                      )}
                    </div>
                  </div>
                )}

               {activeHistoryTab === 'top100' && (
  <div className="meme-oc-section-content" data-section="top100">
    <div className="meme-oc-header meme-oc-header-5-col">
      <div className="meme-oc-header-cell">Token</div>
      <div className="meme-oc-header-cell">Bought</div>
      <div className="meme-oc-header-cell">Sold</div>
      <div className="meme-oc-header-cell">PnL</div>
      <div className="meme-oc-header-cell">Actions</div>
    </div>
    <div className="meme-oc-items">
      {(() => {
        const top100Positions = [...activePositions
          .filter(p => p.remainingTokens === 0)]
          .filter(p => {
            if (!trenchesSearchQuery.trim()) return true;

            const searchLower = trenchesSearchQuery.toLowerCase();
            const tokenName = (p.name || '').toLowerCase();
            const tokenSymbol = (p.symbol || '').toLowerCase();
            const tokenAddress = p.tokenId.toLowerCase();

            return tokenName.includes(searchLower) ||
              tokenSymbol.includes(searchLower) ||
              tokenAddress.includes(searchLower);
          })
          .sort((a, b) => (b.pnlNative ?? 0) - (a.pnlNative ?? 0))
          .slice(0, 100);

        if (top100Positions.length === 0) {
          return (
            <div className="meme-oc-empty">
              {trenchesSearchQuery.trim()
                ? `No positions found matching "${trenchesSearchQuery}"`
                : 'No closed positions yet'}
            </div>
          );
        }

        return top100Positions.map((p, index) => {
          const tokenShort =
            p.symbol ||
            (p.tokenId ? `${p.tokenId.slice(0, 6)}…${p.tokenId.slice(-4)}` : 'Unknown');
          const tokenImageUrl = p.imageUrl || null;
          const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';

          return (
            <div key={p.tokenId} className={`meme-portfolio-oc-item meme-portfolio-oc-item-5-col ${rankClass}`}>
              <div className="meme-oc-cell">
                <div className="oc-meme-wallet-info">
                  <div className="meme-portfolio-token-info">
                    <div className="top100-rank">#{index + 1}</div>
                    <div className="meme-portfolio-token-icon-container">
                      {tokenImageUrl && !tokenImageErrors[p.tokenId] ? (
                        <img
                          src={tokenImageUrl}
                          alt={p.symbol}
                          className="meme-portfolio-token-icon"
                          onError={() => {
                            setTokenImageErrors(prev => ({ ...prev, [p.tokenId]: true }));
                          }}
                        />
                      ) : (
                        <div
                          className="meme-portfolio-token-icon"
                          style={{
                            backgroundColor: 'rgba(35, 34, 41, .7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: (p.symbol || '').length <= 3 ? '14px' : '12px',
                            fontWeight: '200',
                            color: '#ffffff',
                            borderRadius: '1px',
                            letterSpacing: (p.symbol || '').length > 3 ? '-0.5px' : '0',
                          }}
                        >
                          {(p.symbol || p.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className={`portfolio-launchpad-indicator ${p.source === 'nadfun' ? 'nadfun' : ''}`}>
                        <Tooltip content="nad.fun">
                          <svg width="10" height="10" viewBox="0 0 32 32" className="header-launchpad-logo" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <linearGradient id="nadfun" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#7C55FF" stopOpacity="1" />
                                <stop offset="100%" stopColor="#AD5FFB" stopOpacity="1" />
                              </linearGradient>
                            </defs>
                            <path fill="url(#nadfun)" d="m29.202 10.664-4.655-3.206-3.206-4.653A6.48 6.48 0 0 0 16.004 0a6.48 6.48 0 0 0-5.337 2.805L7.46 7.458l-4.654 3.206a6.474 6.474 0 0 0 0 10.672l4.654 3.206 3.207 4.653A6.48 6.48 0 0 0 16.004 32a6.5 6.5 0 0 0 5.337-2.805l3.177-4.616 4.684-3.236A6.49 6.49 0 0 0 32 16.007a6.47 6.47 0 0 0-2.806-5.335zm-6.377 5.47c-.467 1.009-1.655.838-2.605 1.06-2.264.528-2.502 6.813-3.05 8.35-.424 1.484-1.916 1.269-2.272 0-.631-1.53-.794-6.961-2.212-7.993-.743-.542-2.502-.267-3.177-.95-.668-.675-.698-1.729-.023-2.412l5.3-5.298a1.734 1.734 0 0 1 2.45 0l5.3 5.298c.505.505.586 1.306.297 1.937z" />
                          </svg>
                        </Tooltip>
                      </div>
                    </div>
                    <span
                      className="portfolio-meme-wallet-address portfolio-meme-clickable-token"
                      onClick={() => navigate(`/meme/${p.tokenId}`)}
                    >
                      <span className="meme-token-symbol-portfolio">
                        {tokenShort}
                      </span>
                      <span className="meme-token-name-portfolio">
                        {p.name}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="meme-oc-cell">
                <div className="meme-trade-info">
                  <div className="meme-ordercenter-info">
                    {amountMode === 'MON' && (
                      <img className="meme-portfolio-monad-icon" src={monadicon} alt="MONAD" />
                    )}
                    <span className={`meme-usd-amount buy ${isBlurred ? 'blurred' : ''}`}>
                      {fmtAmount(p.spentNative, amountMode, monUsdPrice)}
                    </span>
                  </div>
                  <span className="meme-token-amount">
                    {fmt(p.boughtTokens)} {p.symbol || ''}
                  </span>
                </div>
              </div>
              <div className="meme-oc-cell">
                <div className="meme-trade-info">
                  <div className="meme-ordercenter-info">
                    {amountMode === 'MON' && (
                      <img className="meme-portfolio-monad-icon" src={monadicon} alt="MONAD" />
                    )}
                    <span className={`meme-usd-amount sell ${isBlurred ? 'blurred' : ''}`}>
                      {fmtAmount(p.receivedNative, amountMode, monUsdPrice)}
                    </span>
                  </div>
                  <span className="meme-token-amount">
                    {fmt(p.soldTokens)} {p.symbol || ''}
                  </span>
                </div>
              </div>
              <div className="meme-oc-cell">
                <div className="meme-ordercenter-info">
                  {amountMode === 'MON' && (
                    <img className="meme-portfolio-pnl-monad-icon" src={monadicon} alt="MONAD" />
                  )}
                  <div className="meme-pnl-info">
                    <span className={`meme-portfolio-pnl ${p.pnlNative >= 0 ? 'positive' : 'negative'} ${isBlurred ? 'blurred' : ''}`}>
                      {p.pnlNative >= 0 ? '+' : '-'}
                      {fmtAmount(Math.abs(p.pnlNative), amountMode, monUsdPrice)} (
                      {p.spentNative > 0
                        ? ((p.pnlNative / p.spentNative) * 100).toFixed(1)
                        : '0.0'}%)
                    </span>
                  </div>
                </div>
              </div>
              <div className="meme-oc-cell">
                <button
                  className="share-pnl-btn"
                  onClick={() => {
                    const shareData = {
                      tokenAddress: p.tokenId,
                      tokenSymbol: p.symbol || 'Unknown',
                      tokenName: p.name || 'Unknown Token',
                      userAddress: address,
                      externalUserStats: {
                        balance: p.remainingTokens,
                        amountBought: p.boughtTokens,
                        amountSold: p.soldTokens,
                        valueBought: p.spentNative,
                        valueSold: p.receivedNative,
                        valueNet: p.pnlNative,
                      },
                      currentPrice: p.lastPrice || 0,
                    };

                    if (onMarketSelect) {
                      onMarketSelect(shareData);
                    }

                    if (setpopup) {
                      setpopup(27);
                    }
                  }}
                >
                  <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="16" height="16">
                    <path d="M 31.964844 2.0078125 A 2 2 0 0 0 30.589844 2.5898438 L 20.349609 12.820312 A 2.57 2.57 0 0 0 19.910156 13.470703 A 2 2 0 0 0 21.759766 16.240234 L 30 16.240234 L 30 39.779297 A 2 2 0 0 0 34 39.779297 L 34 16.240234 L 42.25 16.240234 A 2 2 0 0 0 43.660156 12.820312 L 33.410156 2.5898438 A 2 2 0 0 0 31.964844 2.0078125 z M 4 21.619141 A 2 2 0 0 0 2 23.619141 L 2 56 A 2 2 0 0 0 4 58 L 60 58 A 2 2 0 0 0 62 56 L 62 23.619141 A 2 2 0 0 0 60 21.619141 L 44.269531 21.619141 A 2 2 0 0 0 44.269531 25.619141 L 58 25.619141 L 58 54 L 6 54 L 6 25.619141 L 19.730469 25.619141 A 2 2 0 0 0 19.730469 21.619141 L 4 21.619141 z" />
                  </svg>
                </button>
              </div>
            </div>
          );
        });
      })()}
    </div>
  </div>
)}
              </div>
              <div className="trenches-activity-feed">
                <div className="trenches-activity-header">
                  <div className="trenches-activity-tabs">
                    <button className="trenches-activity-tab active">
                      Activity
                    </button>
                  </div>
                </div>

                <div className="meme-oc-section-content">
                  <div className="meme-oc-header">
                    <div className="meme-oc-header-cell">Type</div>
                    <div className="meme-oc-header-cell">Token</div>
                    <div className="meme-oc-header-cell">Amount</div>
                    <div className="meme-oc-header-cell">Market Cap</div>
                    <div className="meme-oc-header-cell">Age</div>
                    <div className="meme-oc-header-cell">Explorer</div>
                  </div>
                  <div className="meme-oc-items">
                    <div className="meme-oc-empty">
                      No recent activity
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {pnlCalendarLoading && (
              <div className="pnl-calendar-backdrop">
                <div className="pnl-calendar-container">
                  <div className="pnl-calendar-header">
                    <div className="pnl-calendar-title-section">
                      <div className="skeleton-loading skeleton-title"></div>
                      <div className="pnl-calendar-nav">
                        <div className="skeleton-loading skeleton-nav-button"></div>
                        <div className="skeleton-loading skeleton-month"></div>
                        <div className="skeleton-loading skeleton-nav-button"></div>
                      </div>
                    </div>
                  </div>

                  <div className="pnl-calendar-gradient-bar">
                    <div className="skeleton-loading skeleton-gradient"></div>
                    <div className="pnl-calendar-gradient-labels">
                      <div className="skeleton-loading skeleton-label"></div>
                      <div className="skeleton-loading skeleton-label"></div>
                    </div>
                  </div>

                  <div className="pnl-calendar-content">
                    <div className="pnl-calendar-weekdays">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                        <div key={i} className="pnl-calendar-weekday">{day}</div>
                      ))}
                    </div>

                    <div className="pnl-calendar-grid">
                      {Array.from({ length: 31 }, (_, i) => (
                        <div key={i + 1} className="pnl-calendar-day skeleton-day">
                          <div className="skeleton-loading skeleton-day-number"></div>
                          <div className="skeleton-loading skeleton-day-pnl"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pnl-calendar-footer">
                    <div className="pnl-calendar-stats">
                      <div className="skeleton-loading skeleton-stat"></div>
                      <div className="skeleton-loading skeleton-stat"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showPNLCalendar && (
              <div className="pnl-calendar-backdrop" onClick={() => setShowPNLCalendar(false)}>
                <div className="pnl-calendar-container" onClick={(e) => e.stopPropagation()}>
                  <div className="pnl-calendar-header">
                    <div className="pnl-calendar-title-section">
                      <h3 className="pnl-calendar-title">PNL Calendar</h3>
                      <div className="pnl-calendar-nav">
                        <button
                          className="pnl-calendar-nav-button"
                          onClick={() => {
                            const newDate = new Date(currentCalendarDate);
                            newDate.setMonth(newDate.getMonth() - 1);
                            setCurrentCalendarDate(newDate);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="grey" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6" />
                          </svg>
                        </button>
                        <span className="pnl-calendar-month">
                          {currentCalendarDate.toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <button
                          className="pnl-calendar-nav-button"
                          onClick={() => {
                            const newDate = new Date(currentCalendarDate);
                            newDate.setMonth(newDate.getMonth() + 1);
                            setCurrentCalendarDate(newDate);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="grey" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="pnl-calendar-controls">
                      <div className="pnl-calendar-total">
                      </div>
                      <button className="pnl-calendar-close" onClick={() => setShowPNLCalendar(false)}>
                        <img src={closebutton} className="close-button-icon" />
                      </button>
                    </div>
                  </div>
                  {(() => {
                    const { buyCount, sellCount, buyValue, sellValue, buyPercent, sellPercent } = calculateBuySellRatio();
                    const totalPnl = totalUnrealizedPnlNative;

                    return (
                      <div className="pnl-calendar-gradient-bar">
                        <span className="pnl-calendar-total-label">
                          {totalPnl >= 0 ? '+' : ''}${formatNumberWithCommas(totalPnl * monUsdPrice, 2)}
                        </span>
                        <div className="pnl-calendar-ratio-container">
                          <div
                            className="pnl-calendar-ratio-buy"
                            style={{ width: `${buyPercent}%` }}
                          ></div>
                          <div
                            className="pnl-calendar-ratio-sell"
                            style={{ width: `${sellPercent}%` }}
                          ></div>
                        </div>
                        <div className="pnl-calendar-gradient-labels">
                          <span>
                            <span className="pnl-buy-color">{buyCount}</span> / <span className="pnl-buy-color">${formatNumberWithCommas(buyValue * monUsdPrice, 2)}</span>
                          </span>
                          <span>
                            <span className="pnl-sell-color">{sellCount}</span> / <span className="pnl-sell-color">${formatNumberWithCommas(sellValue * monUsdPrice, 2)}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="pnl-calendar-content">
                    <div className="pnl-calendar-weekdays">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                        <div key={i} className="pnl-calendar-weekday">{day}</div>
                      ))}
                    </div>
                    <div className="pnl-calendar-grid">
                      {(() => {
                        const year = currentCalendarDate.getFullYear();
                        const month = currentCalendarDate.getMonth();
                        const today = new Date();
                        const todayYear = today.getFullYear();
                        const todayMonth = today.getMonth();
                        const todayDay = today.getDate();

                        const daysInMonth = new Date(year, month + 1, 0).getDate();

                        const firstDay = new Date(year, month, 1).getDay();

                        const startDay = firstDay === 0 ? 6 : firstDay - 1;

                        const days = [];

                        for (let i = 0; i < startDay; i++) {
                          days.push(
                            <div key={`empty-${i}`} className="pnl-calendar-day pnl-calendar-day-empty"></div>
                          );
                        }

                        for (let day = 1; day <= daysInMonth; day++) {
                          const isPastOrToday = (
                            year < todayYear ||
                            (year === todayYear && month < todayMonth) ||
                            (year === todayYear && month === todayMonth && day <= todayDay)
                          );

                          days.push(
                            <div
                              key={`day-${day}`}
                              className={`pnl-calendar-day ${isPastOrToday ? 'past-or-today' : ''}`}
                            >
                              <div className="pnl-calendar-day-number">{day}</div>
                              <div className="pnl-calendar-day-pnl">$0</div>
                            </div>
                          );
                        }

                        return days;
                      })()}
                    </div>
                  </div>
                  <div className="pnl-calendar-footer">
                    <div className="pnl-calendar-stats">
                      <span>Current Positive Streak: <strong>0d</strong></span>
                      <span>Best Positive Streak in {currentCalendarDate.toLocaleDateString('en-US', { month: 'short' })}: <strong>0d</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  if (isMobile) {
    return (
      <div className="portfolio-specific-page">
        <div className="portfolio-top-row">
          <div className="portfolio-tab-selector">
            <span
              className={`portfolio-tab-title ${activeTab === 'trenches' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('trenches')}
            >
              Trenches
            </span>
            <span
              className={`portfolio-tab-title ${activeTab === 'wallets' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('wallets')}
            >
              Wallets
            </span>
            <span
              className="portfolio-tab-title perpetuals"
            >
              Perpetuals
            </span>
          </div>
          <div className="search-wallet-wrapper">
            <div className="portfolio-wallet-search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="View read-only address"
                className="portfolio-wallet-search-input"
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
        </div>

        <div className="portfolio-content-container">
          {renderTabContent()}
        </div>
      </div>
    );
  } else {
    return (
      <div className="portfolio-specific-page">
        <div className="portfolio-top-row">
          <div className="portfolio-tab-selector">
            <span
              className={`portfolio-tab-title ${activeTab === 'trenches' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('trenches')}
            >
              Trenches
            </span>
            {/* <span
              className={`portfolio-tab-title ${activeTab === 'spot' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('spot')}
            >
              Spot
            </span> */}
            <span
              className={`portfolio-tab-title ${activeTab === 'wallets' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('wallets')}
            >
              Wallets
            </span>
            <span
              className="portfolio-tab-title perpetuals"
            >
              Perpetuals
            </span>
          </div>
          <div className="search-wallet-wrapper">
            <div className="portfolio-wallet-search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="View read-only address"
                className="portfolio-wallet-search-input"
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
        </div>
        <div className="portfolio-content-container">
          {renderTabContent()}
        </div>
      </div>
    );

  }

};

export default Portfolio;