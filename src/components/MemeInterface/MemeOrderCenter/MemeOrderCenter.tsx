import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  mockDevTokens,
  mockHolders,
  mockOrders,
  mockTopTraders,
} from './MemeTraderData';

import { formatNumber } from '../../../utils/formatNumber';

import closebutton from '../../../assets/close_button.png';
import filledcup from '../../../assets/filledcup.svg';
import filtercup from '../../../assets/filtercup.svg';
import lightning from '../../../assets/flash.png';
import monadicon from '../../../assets/monadlogo.svg';
import switchicon from '../../../assets/switch.svg';
import walleticon from '../../../assets/wallet_icon.svg';
import filter from '../../../assets/filter.svg';
import TransactionFiltersPopup from '../MemeTradesComponent/TransactionFiltersPopup';

import { useNavigate } from 'react-router-dom';

import './MemeOrderCenter.css';

interface LiveHolder {
  address: string;
  balance: number;
  amountBought: number;
  amountSold: number;
  valueBought: number;
  valueSold: number;
  valueNet: number;
  tokenNet: number;
}


interface TrackedWallet {
  address: string;
  name: string;
  emoji: string;
  balance: number;
  lastActiveAt: number | null;
  id: string;
  createdAt: string;
}

const STORAGE_KEY = 'tracked_wallets_data';


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

interface MemeOrderCenterProps {
  orderCenterHeight?: number;
  isVertDragging?: boolean;
  isOrderCenterVisible?: boolean;
  onHeightChange?: (height: number) => void;
  onDragStart?: (e: React.MouseEvent) => void;
  onDragEnd?: () => void;
  isWidgetOpen?: boolean;
  onToggleWidget?: () => void;
  holders?: LiveHolder[];
  positions?: Position[];
  topTraders: LiveHolder[];
  devTokens?: DevToken[];
  trades?: any[];
  isTradesTabVisible?: boolean;
  onToggleTradesTab?: () => void;
  trackedWalletsMap?: Map<string, any>;
  userAddressesSet?: Set<string>;
  page?: number;
  pageSize?: number;
  currentPrice?: number;
  monUsdPrice?: number;
  onSellPosition?: (position: Position, monAmount: string) => void;
  trackedAddresses?: string[];
  onToggleTrackedAddress?: (addr: string) => void;
  token: any;
  userAddr?: string;
  subWallets?: Array<{ address: string; privateKey: string }>;
  walletTokenBalances?: { [address: string]: any };
  tokendict?: { [key: string]: any };
  nonces?: any;
  activeWalletPrivateKey?: string;
  onFilterDev?: () => void;
  onFilterYou?: () => void;
  onFilterTracked?: () => void;
  devAddress?: string;
  onTradesHoverChange?: (isHovered: boolean) => void;

}

interface DevToken {
  id: string;
  symbol: string;
  name: string;
  imageUrl: string;
  price: number;
  marketCap: number;
  timestamp: number;
  migrated: boolean;
}

const fmt = (v: number, d = 2) => {
  if (v === 0) return '0';
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
  return v.toLocaleString('en-US', { maximumFractionDigits: d });
};

const timeAgo = (tsSec?: number) => {
  if (!tsSec) return '—';
  const diffMs = Date.now() - tsSec * 1000;
  if (diffMs < 0) return 'just now';
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week}w ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(day / 365);
  return `${yr}y ago`;
};

const fmtAmount = (v: number, mode: 'MON' | 'USD', monPrice: number) => {
  if (mode === 'USD' && monPrice > 0) {
    return `$${fmt(v * monPrice)}`;
  }
  return `${fmt(v)}`;
};
interface TransactionFilters {
  makerAddress: string;
  minUSD: string;
  maxUSD: string;
}
interface SellPopupProps {
  showSellPopup: boolean;
  selectedPosition: Position;
  sellAmount: string;
  sellSliderPercent: number;
  onClose: () => void;
  onSellAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSellSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSellConfirm: () => void;
  onMaxClick: () => void;
  fmt: (v: number, d?: number) => string;
  currentPrice: number;
  userAddr: string;
  subWallets: Array<{ address: string; privateKey: string }>;
  walletTokenBalances: { [address: string]: any };
  tokendict: { [key: string]: any };
}

const SellPopup: React.FC<SellPopupProps> = ({
  showSellPopup,
  selectedPosition,
  sellAmount,
  sellSliderPercent,
  onClose,
  onSellAmountChange,
  onSellSliderChange,
  onSellConfirm,
  onMaxClick,
  currentPrice,
  userAddr,
  subWallets,
  walletTokenBalances,
  tokendict,
}) => {
  const [sliderDragging, setSliderDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sliderRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const setPopupRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) {
        if (popupRef.current !== el) {
          (popupRef as React.MutableRefObject<HTMLDivElement | null>).current =
            el;
        }
        if (sliderRef.current) {
          requestAnimationFrame(() => positionPopup(sellSliderPercent));
        }
      }
    },
    [sellSliderPercent],
  );

  const setSliderRef = useCallback(
    (el: HTMLInputElement | null) => {
      (sliderRef as React.MutableRefObject<HTMLInputElement | null>).current =
        el;
      if (el && popupRef.current)
        requestAnimationFrame(() => positionPopup(sellSliderPercent));
    },
    [sellSliderPercent],
  );

  const positionPopup = (percent: number) => {
    const input = sliderRef.current;
    const popup = popupRef.current;
    if (!input || !popup) return;

    const container = input.parentElement as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const inputLeft = inputRect.left - containerRect.left;

    const thumbW = 10;
    const x =
      inputLeft + (percent / 100) * (inputRect.width - thumbW) + thumbW / 2;

    popup.style.left = `${x}px`;
    popup.style.transform = 'translateX(-50%)';
  };

  const handleSliderChangeLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    positionPopup(value);
    onSellSliderChange(e);
  };

  const handleMarkClick = (markPercent: number) => {
    positionPopup(markPercent);
    onSellSliderChange({
      target: { value: String(markPercent) },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="alerts-popup-overlay" onClick={onClose}>
      <div className="alerts-popup" onClick={(e) => e.stopPropagation()}>
        <div className="alerts-popup-header">
          <h3 className="alerts-popup-title">
            Sell {selectedPosition.name} coin
          </h3>
          <button className="alerts-close-button" onClick={onClose}>
            <img src={closebutton} className="explorer-close-button" />
          </button>
        </div>

        <div className="sell-popup-content">
          <div className="alerts-section">
            <div className="meme-amount-header">
              <div className="meme-amount-header-left">
                <span className="meme-amount-label">Amount</span>
              </div>
              <div className="meme-balance-right">
                <div className="meme-balance-display">
                  <img src={walleticon} className="meme-wallet-icon" />
                  {(() => {
                    const totalTokenBalance = selectedPosition.remainingTokens;
                    return (
                      totalTokenBalance *
                      (selectedPosition.lastPrice || currentPrice)
                    ).toFixed(2);
                  })()}{' '}
                  MON
                </div>
                <button className="meme-balance-max-sell" onClick={onMaxClick}>
                  MAX
                </button>
              </div>
            </div>

            <div className="meme-trade-input-wrapper">
              <input
                type="number"
                value={sellAmount || '0'}
                onChange={onSellAmountChange}
                className="meme-trade-input"
              />
              <div className="meme-oc-trade-currency">
                <img className="meme-currency-monad-icon" src={monadicon} />
              </div>
            </div>
            <div className="meme-balance-slider-wrapper">
              <div className="meme-slider-container meme-slider-mode">
                <input
                  ref={setSliderRef}
                  type="range"
                  className={`meme-balance-amount-slider ${sliderDragging ? 'dragging' : ''}`}
                  min="0"
                  max="100"
                  step="1"
                  value={sellSliderPercent}
                  onChange={handleSliderChangeLocal}
                  onMouseDown={() => {
                    setSliderDragging(true);
                    positionPopup(sellSliderPercent);
                  }}
                  onMouseUp={() => setSliderDragging(false)}
                  style={{
                    background: `linear-gradient(to right, rgb(235, 112, 112) ${sellSliderPercent}%, rgb(21 21 27) ${sellSliderPercent}%)`,
                  }}
                />

                <div
                  ref={setPopupRef}
                  className={`meme-slider-percentage-popup ${sliderDragging ? 'visible' : ''}`}
                >
                  {sellSliderPercent}%
                </div>

                <div className="oc-meme-balance-slider-marks">
                  {[0, 25, 50, 75, 100].map((markPercent) => (
                    <span
                      key={markPercent}
                      className="oc-meme-balance-slider-mark sell"
                      data-active={sellSliderPercent >= markPercent}
                      data-percentage={markPercent}
                      onClick={() => handleMarkClick(markPercent)}
                    >
                      {markPercent}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            className="meme-trade-action-button sell"
            onClick={async () => {
              setIsLoading(true);
              try {
                await onSellConfirm();
              } catch (error) {
                console.error('Sell transaction failed:', error);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={
              !sellAmount ||
              parseFloat(sellAmount) <= 0 ||
              (() => {
                const totalTokenBalance = selectedPosition.remainingTokens;
                return (
                  parseFloat(sellAmount) >
                  totalTokenBalance *
                  (selectedPosition.lastPrice || currentPrice)
                );
              })() ||
              isLoading
            }
          >
            {isLoading ? (
              <div className="meme-button-spinner"></div>
            ) : (
              `Instantly Sell $${selectedPosition.symbol}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const MemeOrderCenter: React.FC<MemeOrderCenterProps> = ({
  orderCenterHeight = 300,
  isVertDragging = false,
  isOrderCenterVisible = true,
  onHeightChange,
  onDragStart,
  onDragEnd,
  isWidgetOpen = false,
  onToggleWidget,
  holders: liveHolders = [],
  positions = [],
  topTraders = [],
  devTokens = [],
  trades = [],
  isTradesTabVisible = false,
  onToggleTradesTab,
  monUsdPrice = 0,
  trackedWalletsMap = new Map(),
  userAddressesSet = new Set(),
  page = 0,
  pageSize = 100,
  currentPrice = 0,
  onSellPosition,
  trackedAddresses = [],
  onToggleTrackedAddress,
  token,
  userAddr = '',
  subWallets = [],
  walletTokenBalances = {},
  tokendict = {},
  nonces,
  activeWalletPrivateKey,
  onFilterDev,
  onFilterYou,
  onFilterTracked,
  devAddress = '',
  onTradesHoverChange,
}) => {
  const [showFiltersPopup, setShowFiltersPopup] = useState(false);
  const handleApplyFilters = (filters: TransactionFilters) => {
    setTransactionFilters(filters);
  };

  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<
    'positions' | 'orders' | 'holders' | 'topTraders' | 'devTokens' | 'trades'
  >('positions');
  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>([]);
  const [amountMode, setAmountMode] = useState<'MON' | 'USD'>('MON');
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [_dragStartY, setDragStartY] = useState(0);
  const [_dragStartHeight, setDragStartHeight] = useState(0);
  const [showSellPopup, setShowSellPopup] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null,
  );
  const [sellAmount, setSellAmount] = useState('');
  const [sellSliderPercent, setSellSliderPercent] = useState(0);
  const [showTokenBalance, setShowTokenBalance] = useState(false);
  const [tokenImageErrors, setTokenImageErrors] = useState<Record<string, boolean>>({});
  const [isTradesHovered, setIsTradesHovered] = useState(false);


  const norm = (s?: string) => (s || '').toLowerCase();
  const trackedSet = new Set((trackedAddresses || []).map(norm));
  const dev = norm(devAddress);

  let devActive = false;
  let youActive = false;
  let trackedActive = false;

  if (trackedSet.size === 0) {
  } else if (trackedSet.size === 1) {
    const [only] = Array.from(trackedSet);
    if (userAddressesSet.has(only)) {
      youActive = true;
    } else if (only === dev) {
      devActive = true;
    } else {
      trackedActive = true;
    }
  } else {
    const allYou = Array.from(trackedSet).every((addr) => userAddressesSet.has(addr));
    if (allYou) {
      youActive = true;
    } else {
      trackedActive = true;
    }
  }
  const handleSellClose = useCallback(() => {
    setShowSellPopup(false);
    setSelectedPosition(null);
    setSellAmount('');
    setSellSliderPercent(0);
  }, []);

  const handleSellMaxClick = useCallback(() => {
    if (selectedPosition) {
      const totalTokenBalance = selectedPosition.remainingTokens;
      const maxMonAmount =
        totalTokenBalance * (selectedPosition.lastPrice || currentPrice);
      setSellAmount(maxMonAmount.toFixed(2));
      setSellSliderPercent(100);
    }
  }, [
    selectedPosition,
    currentPrice,
  ]);

  useEffect(() => {
    const loadTrackedWallets = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setTrackedWallets(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading tracked wallets:', error);
      }
    };

    loadTrackedWallets();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setTrackedWallets(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Error parsing tracked wallets:', error);
        }
      }
    };

    const handleCustomWalletUpdate = (e: CustomEvent) => {
      if (e.detail && e.detail.wallets) {
        setTrackedWallets(e.detail.wallets);
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener('wallets-updated', handleCustomWalletUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('wallets-updated', handleCustomWalletUpdate as EventListener);
    };
  }, []);
  useEffect(() => {
    if (isTradesTabVisible && activeSection !== 'trades') {
      setActiveSection('trades');
    }
    if (!isTradesTabVisible && activeSection === 'trades') {
      setActiveSection('positions');
    }
  }, [isTradesTabVisible]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight > 1080) {
        onHeightChange?.(367.58);
      } else if (window.innerHeight > 960) {
        onHeightChange?.(324.38);
      } else if (window.innerHeight > 840) {
        onHeightChange?.(282.18);
      } else if (window.innerHeight > 720) {
        onHeightChange?.(239.98);
      } else {
        onHeightChange?.(198.78);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [onHeightChange]);

  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const holderRows = liveHolders.length
    ? liveHolders.map((h, i) => ({
      rank: page * pageSize + i + 1,
      wallet: h.address,
      balance: h.balance,
      bought: h.amountBought,
      sold: h.amountSold,
      valueBought: h.valueBought,
      valueSold: h.valueSold,
      pnl: h.valueNet,
      remainingPct:
        h.tokenNet === 0
          ? 100
          : Math.min((h.balance / Math.max(h.amountBought, 1e-9)) * 100, 100),
      tags: [],
    }))
    : mockHolders.slice(0, 20).map((h, i) => ({
      rank: i + 1,
      wallet: h.wallet,
      balance: h.balance,
      bought: Math.random() * 10,
      sold: Math.random() * 8,
      valueBought: Math.random() * 1000,
      valueSold: Math.random() * 800,
      pnl: (Math.random() - 0.5) * 20,
      remainingPct: h.percentage,
      tags: h.tags,
    }));

  const devTokensToShow: DevToken[] = useMemo(() => {
    const src =
      devTokens && devTokens.length > 0
        ? devTokens
        : mockDevTokens.map((mt) => ({
          id: mt.id,
          symbol: mt.symbol,
          name: mt.name,
          imageUrl: mt.imageUrl,
          price: mt.price,
          marketCap: mt.marketCap,
          timestamp: mt.timestamp,
          migrated: mt.migrated,
        }));

    const seen = new Set<string>();
    const uniq: DevToken[] = [];
    for (const t of src) {
      const k = (t.id || '').toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        uniq.push(t);
      }
    }
    return uniq;
  }, [devTokens]);

  const topTraderRows = useMemo(() => {
    const rows: LiveHolder[] =
      topTraders && topTraders.length
        ? topTraders
        : mockTopTraders.map((t) => ({
          address: t.wallet,
          balance: t.balance,
          amountBought: Math.random() * 10,
          amountSold: Math.random() * 8,
          valueBought: Math.random() * 1000,
          valueSold: Math.random() * 800,
          valueNet: (Math.random() - 0.5) * 20,
          tokenNet: t.percentage,
        }));

    const score = (x: LiveHolder) => x.valueNet + currentPrice * x.balance;

    return [...rows]
      .sort(
        (a, b) =>
          score(b) - score(a) ||
          b.balance - a.balance ||
          a.address.localeCompare(b.address),
      )
      .slice(0, 100);
  }, [topTraders, currentPrice]);

  const availableTabs = [
    ...(isTradesTabVisible ? [{ key: 'trades', label: `Trades` }] : []),
    { key: 'positions', label: `Positions (${positions.length})` },
    { key: 'orders', label: `Orders (${mockOrders.length})` },
    { key: 'holders', label: `Holders (${holderRows.length})` },
    { key: 'topTraders', label: `Top Traders (${topTraderRows.length})` },
    { key: 'devTokens', label: `Dev Tokens (${devTokensToShow.length})` },
  ];

  useEffect(() => {
    if (isDragging && !isVertDragging) {
      setIsDragging(false);
    }
  }, [isVertDragging, isDragging]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      onDragStart?.(e);
    },
    [onDragStart],
  );

  const handleTabChange = (
    section: 'positions' | 'orders' | 'holders' | 'topTraders' | 'devTokens' | 'trades',
  ) => {
    setActiveSection(section);
    const element = document.getElementsByClassName('meme-oc-content')[0];
    if (element) {
      element.scrollTop = 0;
    }
  };

  const updateIndicatorPosition = (mobile: boolean, section: string) => {
    if (mobile || !indicatorRef.current || !tabsRef.current) {
      if (indicatorRef.current) {
        indicatorRef.current.style.width = '0px';
        indicatorRef.current.style.left = '0px';
      }
      return;
    }

    const activeTabIndex = availableTabs.findIndex(
      (tab) => tab.key === section,
    );
    if (activeTabIndex !== -1) {
      const activeTab = tabsRef.current[activeTabIndex];
      if (activeTab && activeTab.parentElement) {
        const indicator = indicatorRef.current;
        indicator.style.width = `${activeTab.offsetWidth}px`;
        indicator.style.left = `${activeTab.offsetLeft}px`;
      }
    }
  };
  const [transactionFilters, setTransactionFilters] =
    useState<TransactionFilters>({
      makerAddress: '',
      minUSD: '',
      maxUSD: '',
    });
  const hasActiveFilters =
    transactionFilters.makerAddress.trim() !== '' ||
    transactionFilters.minUSD.trim() !== '' ||
    transactionFilters.maxUSD.trim() !== '';
  useEffect(() => {
    const isMobileView = window.innerWidth <= 1020;
    updateIndicatorPosition(isMobileView, activeSection);

    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      updateIndicatorPosition(width <= 1020, activeSection);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    let resizeObserver: any = null;
    if (!isMobileView && indicatorRef.current && tabsRef.current.length > 0) {
      resizeObserver = new ResizeObserver(() => {
        updateIndicatorPosition(isMobileView, activeSection);
      });

      tabsRef.current.forEach((tab) => {
        if (tab) resizeObserver.observe(tab);
      });

      const container = containerRef.current;
      if (container) resizeObserver.observe(container);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [activeSection]);

  const handleSellClick = (position: Position) => {
    setSelectedPosition(position);
    setShowSellPopup(true);
    setSellAmount('');
    setSellSliderPercent(0);
  };

  const handleSellConfirm = async () => {
    if (
      selectedPosition &&
      sellAmount &&
      parseFloat(sellAmount) > 0 &&
      onSellPosition
    ) {
      try {
        await onSellPosition(selectedPosition, sellAmount);
        setShowSellPopup(false);
        setSelectedPosition(null);
        setSellAmount('');
        setSellSliderPercent(0);
      } catch (error) {
        console.error('Sell transaction failed:', error);
      }
    }
  };

  const handleSellSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseInt(e.target.value);
    setSellSliderPercent(percent);
    if (selectedPosition) {
      const totalTokenBalance = selectedPosition.remainingTokens;
      const maxMonAmount =
        totalTokenBalance *
        (selectedPosition.lastPrice || currentPrice);
      const newAmount = (maxMonAmount * percent) / 100;
      setSellAmount(newAmount.toFixed(2));
    }
  };

  const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSellAmount(value);
    if (selectedPosition) {
      const totalTokenBalance = selectedPosition.remainingTokens;
      const maxMonAmount =
        totalTokenBalance *
        (selectedPosition.lastPrice || currentPrice);
      if (maxMonAmount > 0) {
        const percent = (parseFloat(value) / maxMonAmount) * 100;
        setSellSliderPercent(Math.min(100, Math.max(0, percent)));
      }
    }
  };


  const formatWalletDisplay = (address: string) => {
    const addressLower = address.toLowerCase();

    if (userAddressesSet.has(addressLower)) {
      return { text: 'YOU', emoji: undefined, isUser: true };
    }

    const trackedWallet = trackedWalletsMap.get(addressLower);
    if (trackedWallet) {
      return {
        text: trackedWallet.name,
        emoji: trackedWallet.emoji,
        isUser: false,
        isTracked: true
      };
    }

    return {
      text: `${address.slice(0, 8)}…${address.slice(-4)}`,
      emoji: undefined,
      isUser: false
    };
  };
  const renderContent = () => {
    switch (activeSection) {
      case 'positions':
        return (
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
              {[...(positions?.length ? positions : [])]
                .sort((a, b) => (b.pnlNative ?? 0) - (a.pnlNative ?? 0))
                .map((p, _) => {
                  const tokenShort =
                    p.symbol ||
                    `${p.tokenId.slice(0, 6)}…${p.tokenId.slice(-4)}`;
                  const tokenImageUrl = p.imageUrl || null;

                  return (
                    <div key={p.tokenId} className="meme-oc-item">
                      <div className="meme-oc-cell">
                        <div className="oc-meme-wallet-info">
                          <div
                            className="meme-token-info"
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            {tokenImageUrl && !tokenImageErrors[p.tokenId] ? (
                              <img
                                src={tokenImageUrl}
                                alt={p.symbol}
                                className="meme-token-icon"
                                onError={() => {
                                  setTokenImageErrors(prev => ({ ...prev, [p.tokenId]: true }));
                                }}
                              />
                            ) : (
                              <div
                                className="meme-token-icon"
                                style={{
                                  backgroundColor: 'rgba(35, 34, 41, .7)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: (p.symbol || '').length <= 3 ? '14px' : '12px',
                                  fontWeight: '200',
                                  color: '#ffffff',
                                  borderRadius: '3px',
                                  letterSpacing: (p.symbol || '').length > 3 ? '-0.5px' : '0',
                                }}
                              >
                                {(p.symbol || p.name || '?').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span
                              className="oc-meme-wallet-address meme-clickable-token"
                              onClick={() => {
                                if (p.tokenId != token.id) {
                                  navigate(`/meme/${p.tokenId}`)
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              {tokenShort}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="meme-oc-cell">
                        <div className="meme-trade-info">
                          <div className="meme-ordercenter-info">
                            {amountMode === 'MON' && (
                              <img
                                className="meme-ordercenter-monad-icon"
                                src={monadicon}
                                alt="MONAD"
                              />
                            )}
                            <span className="meme-usd-amount buy">
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
                                className="meme-ordercenter-monad-icon"
                                src={monadicon}
                                alt="MONAD"
                              />
                            )}
                            <span className="meme-usd-amount sell">
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
                            <span className="meme-remaining">
                              <img
                                src={monadicon}
                                className="meme-ordercenter-monad-icon"
                              />
                              {fmt(p.remainingTokens * p.lastPrice)}
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
                              className="meme-ordercenter-monad-icon"
                              src={monadicon}
                              alt="MONAD"
                            />
                          )}
                          <div className="meme-pnl-info">
                            <span
                              className={`meme-pnl ${p.pnlNative >= 0 ? 'positive' : 'negative'}`}
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
                          onClick={() => handleSellClick(p)}
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="meme-oc-section-content" data-section="orders">
            <div className="meme-oc-header">
              <div className="meme-oc-header-cell">Token</div>
              <div className="meme-oc-header-cell">Type</div>
              <div className="meme-oc-header-cell">Amount</div>
              <div className="meme-oc-header-cell">Current MC</div>
              <div className="meme-oc-header-cell">Target MC</div>
            </div>
            <div className="meme-oc-items">
              {mockOrders.map((order) => (
                <div key={order.id} className="meme-oc-item">
                  <div className="meme-oc-cell">{order.token}</div>
                  <div className="meme-oc-cell">
                    <span
                      className={`meme-order-type ${order.type.toLowerCase()}`}
                    >
                      {order.type}
                    </span>
                  </div>
                  <div className="meme-oc-cell">{order.amount}</div>
                  <div className="meme-oc-cell">
                    ${order.currentMC.toLocaleString()}
                  </div>
                  <div className="meme-oc-cell">
                    ${order.targetMC.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'holders':
        return (
          <div className="meme-oc-section-content" data-section="holders">
            <div className="meme-oc-header">
              <div className="meme-oc-header-cell">Wallet</div>
              <div
                className="meme-oc-header-cell clickable"
                onClick={() => setShowTokenBalance((v) => !v)}
                style={{ cursor: 'pointer' }}
              >
                {showTokenBalance
                  ? `Balance (${token.symbol})`
                  : 'Balance (MON)'}
              </div>
              <div
                className="meme-oc-header-cell clickable"
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Bought (Avg Buy)
              </div>
              <div className="meme-oc-header-cell">Sold (Avg Sell)</div>
              <div className="meme-oc-header-cell">PnL</div>
              <div className="meme-oc-header-cell">Remaining</div>
              <div className="meme-oc-header-cell">Filter</div>
            </div>
            <div className="meme-oc-items">
              {[...holderRows]
                .sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))
                .map((row) => {
                  const walletDisplay = formatWalletDisplay(row.wallet);

                  return (
                    <div
                      key={`${row.wallet}-${token.id}`}
                      className="meme-oc-item"
                    >
                      <div className="meme-oc-cell">
                        <div className="oc-meme-wallet-info">
                          <span className="meme-wallet-index">{row.rank}</span>
                          {walletDisplay.emoji && (
                            <span style={{ marginRight: '-4px', fontSize: '14px' }}>
                              {walletDisplay.emoji}
                            </span>
                          )}
                          <span
                            className={`oc-meme-wallet-address ${walletDisplay.isUser ? 'current-user' : walletDisplay.isTracked ? 'tracked-wallet' : ''}`}
                          >
                            {walletDisplay.text}
                          </span>
                          <div className="meme-wallet-tags">
                            {row.rank <= 10 && (
                              <svg
                                className="meme-top-holder-icon"
                                width="14"
                                height="14"
                                viewBox="0 0 32 32"
                                fill="#fff27a"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M 15 4 L 15 6 L 13 6 L 13 8 L 15 8 L 15 9.1875 C 14.011719 9.554688 13.25 10.433594 13.0625 11.5 C 12.277344 11.164063 11.40625 11 10.5 11 C 6.921875 11 4 13.921875 4 17.5 C 4 19.792969 5.199219 21.8125 7 22.96875 L 7 27 L 25 27 L 25 22.96875 C 26.800781 21.8125 28 19.792969 28 17.5 C 28 13.921875 25.078125 11 21.5 11 C 20.59375 11 19.722656 11.164063 18.9375 11.5 C 18.75 10.433594 17.988281 9.554688 17 9.1875 L 17 8 L 19 8 L 19 6 L 17 6 L 17 4 Z M 16 11 C 16.5625 11 17 11.4375 17 12 C 17 12.5625 16.5625 13 16 13 C 15.4375 13 15 12.5625 15 12 C 15 11.4375 15.4375 11 16 11 Z M 10.5 13 C 12.996094 13 15 15.003906 15 17.5 L 15 22 L 10.5 22 C 8.003906 22 6 19.996094 6 17.5 C 6 15.003906 8.003906 13 10.5 13 Z M 21.5 13 C 23.996094 13 26 15.003906 26 17.5 C 26 19.996094 23.996094 22 21.5 22 L 17 22 L 17 17.5 C 17 15.003906 19.003906 13 21.5 13 Z M 9 24 L 23 24 L 23 25 L 9 25 Z" />
                              </svg>
                            )}
                            {row.wallet.toLowerCase() ===
                              (token.dev || '').toLowerCase() && (
                                <svg
                                  className="meme-dev-icon"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 30 30"
                                  fill="#ffc107"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                                </svg>
                              )}
                            <svg
                              className="wallet-address-link"
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="rgb(206, 208, 223)"
                              onClick={() =>
                                window.open(
                                  `https://testnet.monadscan.com/address/${row.wallet}`,
                                  '_blank',
                                  'noopener noreferrer',
                                )
                              }
                            >
                              <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                              <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="meme-oc-cell">
                        {!showTokenBalance && (
                          <img
                            src={monadicon}
                            className="meme-oc-monad-icon"
                            alt="MONAD"
                          />
                        )}
                        <span className="meme-mon-balance">
                          {showTokenBalance
                            ? fmt(row.balance, 3)
                            : fmt(row.balance * currentPrice, 3)}
                        </span>
                      </div>
                      <div className="meme-oc-cell">
                        <div className="meme-trade-info">
                          <div className="meme-avg-buy-info">
                            {amountMode === 'MON' && (
                              <img
                                src={monadicon}
                                className="meme-oc-monad-icon"
                                alt="MONAD"
                              />
                            )}
                            <span className="meme-usd-amount buy">
                              {fmtAmount(
                                row.valueBought,
                                amountMode,
                                monUsdPrice,
                              )}
                            </span>
                          </div>
                          <span className="meme-token-amount">
                            {fmt(row.bought)}
                          </span>
                        </div>
                        <span className="meme-avg-price buy">
                          ($
                          {formatNumber(
                            (row.valueBought * monUsdPrice * 1e9) /
                            (row.bought || 1),
                          )}
                          )
                        </span>
                      </div>
                      <div className="meme-oc-cell">
                        <div className="meme-trade-info">
                          <div className="meme-avg-sell-info">
                            {amountMode === 'MON' && (
                              <img
                                src={monadicon}
                                className="meme-oc-monad-icon"
                                alt="MONAD"
                              />
                            )}
                            <span className="meme-usd-amount sell">
                              {fmtAmount(row.valueSold, amountMode, monUsdPrice)}
                            </span>
                          </div>
                          <span className="meme-token-amount">
                            {fmt(row.sold)}
                          </span>
                        </div>
                        <span className="meme-avg-price sell">
                          ($
                          {formatNumber(
                            (row.valueSold * monUsdPrice * 1e9) / (row.sold || 1),
                          )}
                          )
                        </span>
                      </div>
                      <div className="meme-oc-cell">
                        <div className="meme-ordercenter-info">
                          {amountMode === 'MON' && (
                            <img
                              src={monadicon}
                              className="meme-ordercenter-monad-icon"
                              alt="MONAD"
                            />
                          )}
                          <span
                            className={`meme-pnl ${row.pnl >= 0 ? 'positive' : 'negative'}`}
                          >
                            {row.pnl >= 0 ? '+' : '-'}
                            {fmtAmount(
                              Math.abs(row.pnl),
                              amountMode,
                              monUsdPrice,
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="meme-oc-cell">
                        <div className="meme-remaining-info">
                          <div>
                            <span className="meme-remaining">
                              {row.remainingPct.toFixed(2)}%
                            </span>
                          </div>
                          <div className="meme-remaining-bar">
                            <div
                              className="meme-remaining-bar-fill"
                              style={{ width: `${row.remainingPct.toFixed(0)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="meme-oc-cell">
                        <button
                          className={`meme-filter-action-btn ${trackedAddresses.includes(row.wallet.toLowerCase()) ? 'active' : ''}`}
                          onClick={() => onToggleTrackedAddress?.(row.wallet)}
                          title={
                            trackedAddresses.includes(row.wallet.toLowerCase())
                              ? 'Untrack'
                              : 'Track'
                          }
                        >
                          <img
                            src={
                              trackedAddresses.includes(row.wallet.toLowerCase())
                                ? filledcup
                                : filtercup
                            }
                            alt="Filter"
                            className="oc-filter-cup"
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        );

      case 'topTraders':
        return (
          <div className="meme-oc-section-content" data-section="topTraders">
            <div className="meme-oc-header">
              <div className="meme-oc-header-cell">Wallet</div>
              <div
                className="meme-oc-header-cell clickable"
                onClick={() => setShowTokenBalance((v) => !v)}
                title="toggle balance view"
                style={{ cursor: 'pointer' }}
              >
                {showTokenBalance
                  ? `Balance (${token.symbol})`
                  : 'Balance (MON)'}
              </div>
              <div className="meme-oc-header-cell">Bought (Avg Buy)</div>
              <div className="meme-oc-header-cell">Sold (Avg Sell)</div>
              <div className="meme-oc-header-cell">PnL</div>
              <div className="meme-oc-header-cell">Remaining</div>
              <div className="meme-oc-header-cell">Filter</div>
            </div>

            <div className="meme-oc-items">
              {[...topTraderRows]
                .sort((a, b) => (b.valueNet ?? 0) - (a.valueNet ?? 0))
                .map((row, index) => {
                  const remainingPct =
                    row.amountBought === 0
                      ? 100
                      : (row.balance / Math.max(row.amountBought, 1e-9)) * 100;
                  const pnl = row.valueNet;
                  const avgBuyUSD =
                    (row.valueBought * monUsdPrice) / (row.amountBought || 1);
                  const avgSellUSD =
                    (row.valueSold * monUsdPrice) / (row.amountSold || 1);

                  const walletDisplay = formatWalletDisplay(row.address);

                  return (
                    <div key={row.address} className="meme-oc-item">
                      <div className="meme-oc-cell">
                        <div className="oc-meme-wallet-info">
                          <span className="meme-wallet-index">{index + 1}</span>
                          {walletDisplay.emoji && (
                            <span style={{ marginRight: '4px', fontSize: '14px' }}>
                              {walletDisplay.emoji}
                            </span>
                          )}
                          <span
                            className={`oc-meme-wallet-address ${walletDisplay.isUser ? 'current-user' : walletDisplay.isTracked ? 'tracked-wallet' : ''}`}
                            title={row.address}
                          >
                            {walletDisplay.text}
                          </span>
                          <div className="meme-wallet-tags">
                            {index < 10 && (
                              <svg
                                className="meme-top-holder-icon"
                                width="14"
                                height="14"
                                viewBox="0 0 32 32"
                                fill="#fff27a"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M 15 4 L 15 6 L 13 6 L 13 8 L 15 8 L 15 9.1875 C 14.011719 9.554688 13.25 10.433594 13.0625 11.5 C 12.277344 11.164063 11.40625 11 10.5 11 C 6.921875 11 4 13.921875 4 17.5 C 4 19.792969 5.199219 21.8125 7 22.96875 L 7 27 L 25 27 L 25 22.96875 C 26.800781 21.8125 28 19.792969 28 17.5 C 28 13.921875 25.078125 11 21.5 11 C 20.59375 11 19.722656 11.164063 18.9375 11.5 C 18.75 10.433594 17.988281 9.554688 17 9.1875 L 17 8 L 19 8 L 19 6 L 17 6 L 17 4 Z M 16 11 C 16.5625 11 17 11.4375 17 12 C 17 12.5625 16.5625 13 16 13 C 15.4375 13 15 12.5625 15 12 C 15 11.4375 15.4375 11 16 11 Z M 10.5 13 C 12.996094 13 15 15.003906 15 17.5 L 15 22 L 10.5 22 C 8.003906 22 6 19.996094 6 17.5 C 6 15.003906 8.003906 13 10.5 13 Z M 21.5 13 C 23.996094 13 26 15.003906 26 17.5 C 26 19.996094 23.996094 22 21.5 22 L 17 22 L 17 17.5 C 17 15.003906 19.003906 13 21.5 13 Z M 9 24 L 23 24 L 23 25 L 9 25 Z" />
                              </svg>
                            )}
                            {row.address.toLowerCase() ===
                              (token.dev || '').toLowerCase() && (
                                <svg
                                  className="meme-dev-icon"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 30 30"
                                  fill="#ffc107"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                                </svg>
                              )}
                            <svg
                              className="wallet-address-link"
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="rgb(206, 208, 223)"
                              onClick={() =>
                                window.open(
                                  `https://testnet.monadscan.com/address/${row.address}`,
                                  '_blank',
                                  'noopener noreferrer',
                                )
                              }
                            >
                              <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                              <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="meme-oc-cell">
                        {!showTokenBalance && (
                          <img
                            src={monadicon}
                            className="meme-oc-monad-icon"
                            alt="MONAD"
                          />
                        )}
                        <span className="meme-mon-balance">
                          {showTokenBalance
                            ? `${fmt(row.balance, 3)} ${token.symbol}`
                            : fmt(row.balance * currentPrice, 3)}
                        </span>
                      </div>

                      <div className="meme-oc-cell">
                        <div className="meme-trade-info">
                          <div className="meme-avg-buy-info">
                            {amountMode === 'MON' && (
                              <img
                                src={monadicon}
                                className="meme-oc-monad-icon"
                                alt="MONAD"
                              />
                            )}
                            <span className="meme-usd-amount buy">
                              {fmtAmount(
                                row.valueBought,
                                amountMode,
                                monUsdPrice,
                              )}
                            </span>
                          </div>
                          <span className="meme-token-amount">
                            {fmt(row.amountBought)}
                          </span>
                        </div>
                        <span className="meme-avg-price buy">
                          (${formatNumber(avgBuyUSD * 1e9)})
                        </span>
                      </div>

                      <div className="meme-oc-cell">
                        <div className="meme-trade-info">
                          <div className="meme-avg-sell-info">
                            {amountMode === 'MON' && (
                              <img
                                src={monadicon}
                                className="meme-oc-monad-icon"
                                alt="MONAD"
                              />
                            )}
                            <span className="meme-usd-amount sell">
                              {fmtAmount(
                                row.valueSold,
                                amountMode,
                                monUsdPrice,
                              )}
                            </span>
                          </div>
                          <span className="meme-token-amount">
                            {fmt(row.amountSold)}
                          </span>
                        </div>
                        <span className="meme-avg-price sell">
                          (${formatNumber(avgSellUSD * 1e9)})
                        </span>
                      </div>

                      <div className="meme-oc-cell">
                        <div className="meme-ordercenter-info">
                          {amountMode === 'MON' && (
                            <img
                              className="meme-ordercenter-monad-icon"
                              src={monadicon}
                              alt="MONAD"
                            />
                          )}
                          <span
                            className={`meme-pnl ${pnl >= 0 ? 'positive' : 'negative'}`}
                          >
                            {pnl >= 0 ? '+' : '-'}
                            {fmtAmount(Math.abs(pnl), amountMode, monUsdPrice)}
                          </span>
                        </div>
                      </div>

                      <div className="meme-oc-cell">
                        <div className="meme-remaining-info">
                          <div>
                            <span className="meme-remaining">
                              {remainingPct.toFixed(2)}%
                            </span>
                          </div>
                          <div className="meme-remaining-bar">
                            <div
                              className="meme-remaining-bar-fill"
                              style={{
                                width: `${Math.max(0, Math.min(100, remainingPct)).toFixed(0)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="meme-oc-cell">
                        <button
                          className={`meme-filter-action-btn ${trackedAddresses.includes(row.address.toLowerCase()) ? 'active' : ''}`}
                          onClick={() => onToggleTrackedAddress?.(row.address)}
                          title={
                            trackedAddresses.includes(row.address.toLowerCase())
                              ? 'Untrack'
                              : 'Track'
                          }
                        >
                          <img
                            src={
                              trackedAddresses.includes(
                                row.address.toLowerCase(),
                              )
                                ? filledcup
                                : filtercup
                            }
                            alt="Filter"
                            className="oc-filter-cup"
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        );
      case 'devTokens':
        return (
          <div className="meme-oc-section-content meme-oc-dev-tokens-layout" data-section="devTokens">
            <div className="meme-oc-dev-tokens-table">
              <div className="meme-oc-header">
                <div className="meme-oc-header-cell">Token</div>
                <div className="meme-oc-header-cell">Market Cap (MON)</div>
                <div className="meme-oc-header-cell">Migrated</div>
                <div className="meme-oc-header-cell">Liquidity</div>
                <div className="meme-oc-header-cell">Holders</div>
              </div>

              <div className="meme-oc-items">
                {devTokensToShow.length === 0 ? (
                  <div className="meme-oc-empty">No tokens</div>
                ) : (
                  devTokensToShow.map((t) => {
                    const mc = Number(t.marketCap || 0);
                    return (
                      <div key={t.id} className="meme-oc-item">
                        <div className="meme-oc-cell">
                          <div className="oc-meme-wallet-info">
                            <div
                              className="meme-token-info"
                              style={{ display: 'flex', alignItems: 'center' }}
                            >
                              {t.imageUrl && !tokenImageErrors[t.id] ? (
                                <img
                                  src={t.imageUrl}
                                  alt={t.symbol || t.name || t.id}
                                  className="meme-token-icon"
                                  onError={() => {
                                    setTokenImageErrors(prev => ({ ...prev, [t.id]: true }));
                                  }}
                                />
                              ) : (
                                <div
                                  className="meme-token-icon"
                                  style={{
                                    backgroundColor: 'rgba(35, 34, 41, .7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: (t.symbol || '').length <= 3 ? '14px' : '12px',
                                    fontWeight: '200',
                                    color: '#ffffff',
                                    borderRadius: '3px',
                                    letterSpacing: (t.symbol || '').length > 3 ? '-0.5px' : '0',
                                  }}
                                >
                                  {(t.symbol || t.name || '?').slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span
                                className="oc-meme-wallet-address meme-clickable-token"
                                title={t.name || t.symbol || t.id}
                                onClick={() => {
                                  if (t.id != token.id) {
                                    navigate(`/meme/${t.id}`)
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                {(t.symbol || '').toUpperCase()}
                              </span>
                              <span className="oc-meme-wallet-address-span">
                                {timeAgo(t.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="meme-oc-cell">
                          <div className="meme-ordercenter-info">
                            <img
                              className="meme-ordercenter-monad-icon"
                              src={monadicon}
                              alt="MONAD"
                            />
                            <span className="meme-usd-amount">
                              {mc > 0 ? fmt(mc, 2) : '—'}
                            </span>
                          </div>
                        </div>
                        <div className="meme-oc-cell">
                          {t.migrated ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="rgb(67, 254, 154)"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="m9 12 2 2 4-4" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="rgb(240, 103, 103)"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="m15 9-6 6" />
                              <path d="m9 9 6 6" />
                            </svg>
                          )}
                        </div>
                        <div className="meme-oc-cell">
                          $0
                        </div>
                        <div className="meme-oc-cell">
                          <span>{liveHolders.length}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="meme-oc-dev-stats-panel">
              <div className="meme-oc-dev-stats-content">
                <div className="meme-oc-dev-stats-row">
                  <span className="meme-oc-dev-stats-label">DEV</span>
                  <span className="meme-oc-dev-stats-value">{token.dev ? `${token.dev.slice(0, 6)}...${token.dev.slice(-4)}` : '—'}</span>
                </div>

                <div className="meme-oc-dev-stats-row">
                  <span className="meme-oc-dev-stats-label">Total Pairs:</span>
                  <span className="meme-oc-dev-stats-value">{devTokensToShow.length}</span>
                </div>

                <div className="meme-oc-dev-stats-migration">
                  <div className="meme-oc-migration-item migrated">
                    <span className="meme-oc-migration-indicator"></span>
                    <span>Migrated: {token.graduatedTokens || devTokensToShow.filter(t => t.migrated).length}</span>
                  </div>
                  <div className="meme-oc-migration-item non-migrated">
                    <span className="meme-oc-migration-indicator"></span>
                    <span>Non Migrated: {devTokensToShow.length - (token.graduatedTokens || 0)}</span>
                  </div>
                </div>
                <div className="meme-oc-dev-stats-highlights">
                  <h4>Highlights</h4>
                  <div className="meme-oc-highlight-item">
                    <span>Top MCAP</span>
                    <span>
                      {devTokensToShow.length > 0
                        ? `${devTokensToShow[0].symbol} ($${fmt(Math.max(...devTokensToShow.map(t => Number(t.marketCap || 0))))})`
                        : '—'}
                    </span>
                  </div>
                  <div className="meme-oc-highlight-item">
                    <span>Last Token Launched:</span>
                    <span>
                      {devTokensToShow.length > 0
                        ? timeAgo(devTokensToShow[devTokensToShow.length - 1].timestamp)
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="meme-oc-dev-stats-chart">
                <div className="meme-oc-chart-circle">
                  <svg viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="rgb(240, 103, 103)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="rgb(67, 254, 154)"
                      strokeWidth="8"
                      strokeDasharray={`${devTokensToShow.length > 0 ? ((token.graduatedTokens || 0) / devTokensToShow.length) * 251 : 0} 251`}
                      strokeLinecap="butt"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="meme-oc-chart-label">
                    <div className="meme-oc-chart-percentage">
                      {devTokensToShow.length > 0
                        ? Math.round(((token.graduatedTokens || 0) / devTokensToShow.length) * 100)
                        : 0}%
                    </div>
                    <div className="meme-oc-chart-sublabel">Migrated</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'trades':
        return (
          <div className="meme-oc-section-content" data-section="trades">
            <div
              className="meme-oc-header"
              onMouseEnter={(e) => {
                e.stopPropagation();
                setIsTradesHovered(false);
                onTradesHoverChange?.(false);
              }}
            >
              <div className="meme-oc-header-cell">Age</div>
              <div className="meme-oc-header-cell">Type</div>
              <div className="meme-oc-header-cell">MC</div>
              <div className="meme-oc-header-cell">Amount</div>
              <div className="meme-oc-header-cell">Total {amountMode}</div>
              <div className="meme-oc-header-cell">Trader</div>
            </div>
            <div
              className="meme-oc-items"
              onMouseEnter={() => {
                setIsTradesHovered(true);
                onTradesHoverChange?.(true);
              }}
              onMouseLeave={() => {
                setIsTradesHovered(false);
                onTradesHoverChange?.(false);
              }}
            >
              {trades.slice(0, 100).map((trade: any) => {
                const callerLower = trade.caller?.toLowerCase() || '';
                const isCurrentUser = userAddressesSet.has(callerLower);
                const trackedWallet = trackedWalletsMap.get(callerLower);
                const isTracked = !!trackedWallet;
                const isDev = callerLower === devAddress?.toLowerCase();
                const isTopHolder = holderRows.findIndex(h => h.wallet.toLowerCase() === callerLower) >= 0 && holderRows.findIndex(h => h.wallet.toLowerCase() === callerLower) < 10;

                const walletDisplay = isCurrentUser
                  ? 'YOU'
                  : trackedWallet
                    ? trackedWallet.name
                    : `${trade.caller?.slice(0, 6) || ''}...${trade.caller?.slice(-4) || ''}`;

                const tradeUSD = trade.nativeAmount * monUsdPrice;
                const mcUSD = trade.price * monUsdPrice * 1_000_000_000;
                const positive = trade.isBuy;

                const maxAmount = Math.max(...trades.slice(0, 100).map((t: any) => Math.abs(t.nativeAmount * monUsdPrice)));
                const barWidth = maxAmount > 0 ? (Math.abs(tradeUSD) / maxAmount) * 40 : 0;

                const timeAgoStr = (ts: number) => {
                  const now = Date.now() / 1000;
                  const diff = Math.max(0, Math.floor(now - ts));
                  if (diff < 60) return `${diff}s`;
                  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
                  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
                  return `${Math.floor(diff / 86400)}d`;
                };

                return (
                  <div key={trade.id} className="meme-oc-item meme-oc-trade-item">
                    <div
                      className={`meme-oc-trade-volume-bar ${positive ? 'positive' : 'negative'}`}
                      style={{ width: `${barWidth}%` }}
                    />

                    <div className="meme-oc-cell">
                      <span className="meme-trade-time">{timeAgoStr(trade.timestamp)}</span>
                    </div>
                    <div className="meme-oc-cell">
                      <span className={`meme-order-type ${positive ? 'buy' : 'sell'}`}>
                        {positive ? 'Buy' : 'Sell'}
                      </span>
                    </div>
                    <div className="meme-oc-cell">
                      <span className="oc-meme-trade-mc">${fmt(mcUSD, 2)}</span>
                    </div>
                    <div className="meme-oc-cell">
                      <span className="meme-token-amount">{fmt(trade.tokenAmount, 2)}</span>
                    </div>
                    <div className="meme-oc-cell">
                      <div className={`meme-trade-amount-info ${positive ? 'positive' : 'negative'}`}>
                        {amountMode === 'MON' && (
                          <img src={monadicon} className="meme-ordercenter-monad-icon" alt="MON" />
                        )}
                        <span>
                          {amountMode === 'USD'
                            ? `$${fmt(Math.abs(tradeUSD), 2)}`
                            : fmt(Math.abs(trade.nativeAmount), 3)
                          }
                        </span>
                      </div>
                    </div>
                    <div className="meme-oc-cell">
                      <div className="meme-trader-info">
                        {trackedWallet?.emoji && <span>{trackedWallet.emoji}</span>}
                        <span className={`oc-meme-wallet-address ${isCurrentUser ? 'current-user' : isTracked ? 'tracked-wallet' : ''}`}>
                          {walletDisplay}
                        </span>
                        <div className="meme-wallet-tags">
                          {isTopHolder && (
                            <svg
                              className="meme-top-holder-icon"
                              width="14"
                              height="14"
                              viewBox="0 0 32 32"
                              fill="#fff27a"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M 15 4 L 15 6 L 13 6 L 13 8 L 15 8 L 15 9.1875 C 14.011719 9.554688 13.25 10.433594 13.0625 11.5 C 12.277344 11.164063 11.40625 11 10.5 11 C 6.921875 11 4 13.921875 4 17.5 C 4 19.792969 5.199219 21.8125 7 22.96875 L 7 27 L 25 27 L 25 22.96875 C 26.800781 21.8125 28 19.792969 28 17.5 C 28 13.921875 25.078125 11 21.5 11 C 20.59375 11 19.722656 11.164063 18.9375 11.5 C 18.75 10.433594 17.988281 9.554688 17 9.1875 L 17 8 L 19 8 L 19 6 L 17 6 L 17 4 Z M 16 11 C 16.5625 11 17 11.4375 17 12 C 17 12.5625 16.5625 13 16 13 C 15.4375 13 15 12.5625 15 12 C 15 11.4375 15.4375 11 16 11 Z M 10.5 13 C 12.996094 13 15 15.003906 15 17.5 L 15 22 L 10.5 22 C 8.003906 22 6 19.996094 6 17.5 C 6 15.003906 8.003906 13 10.5 13 Z M 21.5 13 C 23.996094 13 26 15.003906 26 17.5 C 26 19.996094 23.996094 22 21.5 22 L 17 22 L 17 17.5 C 17 15.003906 19.003906 13 21.5 13 Z M 9 24 L 23 24 L 23 25 L 9 25 Z" />
                            </svg>
                          )}
                          {isDev && (
                            <svg
                              className="meme-dev-icon"
                              width="14"
                              height="14"
                              viewBox="0 0 30 30"
                              fill="#ffc107"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                            </svg>
                          )}
                          <svg
                            className="wallet-address-link"
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="rgb(206, 208, 223)"
                            onClick={() =>
                              window.open(
                                `https://testnet.monadscan.com/tx/${trade.hash || trade.transactionHash || trade.id}`,
                                '_blank',
                                'noopener noreferrer',
                              )
                            }
                          >
                            <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                            <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const noData = false;
  const noDataMessage = 'No data available';

  return (
    <div
      ref={containerRef}
      className="meme-oc-rectangle"
      style={{
        position: 'relative',
        height:
          orderCenterHeight === 0 || isOrderCenterVisible === false
            ? '0px'
            : `${orderCenterHeight}px`,
        transition: (isVertDragging || isDragging) ? 'none' : 'height 0.1s ease',
        overflow: 'hidden',
      }}
    >
      <div
        className={`meme-oc-drag-spacer ${!isOrderCenterVisible ? 'meme-oc-collapsed' : ''}`}
      >
        <div
          className="meme-oc-drag-handle"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'row-resize' : 'row-resize' }}
        >
          <div className="meme-oc-drag-indicator">
            <div className="meme-oc-drag-dot"></div>
          </div>
        </div>
      </div>

      <div className="meme-oc-top-bar">
        <div className="meme-oc-inner">

          <div className="meme-oc-types">
            <>
              <div className="meme-oc-types-rectangle">
                {availableTabs.map(({ key, label }, index) => (
                  <div
                    key={key}
                    ref={(el) => (tabsRef.current[index] = el)}
                    className={`meme-oc-type ${activeSection === key ? 'active' : ''}`}
                    onClick={() => handleTabChange(key as typeof activeSection)}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div ref={indicatorRef} className="meme-oc-sliding-indicator" />
            </>
          </div>

          {onToggleWidget && (
            <div className="meme-oc-right-controls">
              <button
                onClick={onToggleWidget}
                className={`meme-oc-quickbuy-button ${isWidgetOpen ? 'active' : ''}`}
              >
                <img className="memeordercenter-lightning" src={lightning} />

                {windowWidth > 768 && (
                  <span>
                    {isWidgetOpen ? 'Instant Trade' : 'Instant Trade'}
                  </span>
                )}
              </button>

              <button
                onClick={onToggleTradesTab}
                className={`meme-oc-trades-toggle-button ${isTradesTabVisible ? 'active' : ''}`}
              >
                {isTradesTabVisible ? (

                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="panel">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M15 3v18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="panel">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M3 15h18" />
                  </svg>
                )}
                {windowWidth > 768 && <span>{isTradesTabVisible ? 'Trades Panel' : 'Trades Table'}</span>}
              </button>
              {isTradesTabVisible && (
                <div className="meme-oc-trades-filters">
                  <button
                    className={`meme-oc-trade-filter-btn ${devActive ? 'active' : ''}`}
                    onClick={onFilterDev}
                  >
                    <img
                      src={devActive ? filledcup : filtercup}
                      alt="Filter"
                      className="oc-filter-cup"
                    />
                    DEV
                  </button>
                  <button
                    className={`meme-oc-trade-filter-btn ${trackedActive ? 'active' : ''}`}
                    onClick={onFilterTracked}
                  >
                    <img
                      src={trackedActive ? filledcup : filtercup}
                      alt="Filter"
                      className="oc-filter-cup"
                    />
                    TRACKED
                  </button>
                  <button
                    className={`meme-oc-trade-filter-btn ${youActive ? 'active' : ''}`}
                    onClick={onFilterYou}
                  >
                    <img
                      src={youActive ? filledcup : filtercup}
                      alt="Filter"
                      className="oc-filter-cup"
                    />
                    YOU
                  </button>
                </div>
              )}

              <button
                onClick={() =>
                  setAmountMode((prev) => (prev === 'MON' ? 'USD' : 'MON'))
                }
                className="meme-oc-currency-toggle"
                title={`Switch to ${amountMode === 'MON' ? 'USD' : 'MON'} display`}
              >
                <img src={switchicon} className="meme-currency-switch-icon" />
                {amountMode}
              </button>
              {isTradesTabVisible && (

                <button
                  className={`filter-icon-button ${hasActiveFilters ? 'active' : ''}`}
                  onClick={() => setShowFiltersPopup(true)}
                  title="Advanced Filters"
                  style={{paddingRight: "15px"}}
                >
                  <img
                    className="filter-icon"
                    src={filter}
                    alt="Advanced Filters"
                    style={{
                      filter: hasActiveFilters
                        ? 'brightness(0) saturate(100%) invert(83%) sepia(11%) saturate(527%) hue-rotate(194deg) brightness(95%) contrast(92%)'
                        : undefined,
                    }}
                  />
                  {hasActiveFilters && <span className="trades-filter-active-dot" />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className="meme-oc-content"
        style={{
          overflowY: noData ? 'hidden' : 'auto',
          flex: 1,
        }}
      >
        {renderContent()}
      </div>

      {noData && (
        <div className="meme-oc-no-data-container">
          <span className="meme-oc-no-data">{noDataMessage}</span>
        </div>
      )}
      {selectedPosition && showSellPopup &&
        (<SellPopup
          showSellPopup={showSellPopup}
          selectedPosition={selectedPosition}
          sellAmount={sellAmount}
          sellSliderPercent={sellSliderPercent}
          onClose={handleSellClose}
          onSellAmountChange={handleSellAmountChange}
          onSellSliderChange={handleSellSliderChange}
          onSellConfirm={handleSellConfirm}
          onMaxClick={handleSellMaxClick}
          fmt={fmt}
          currentPrice={currentPrice}
          userAddr={userAddr}
          subWallets={subWallets}
          walletTokenBalances={walletTokenBalances}
          tokendict={tokendict}
        />)
      }

      {activeSection === 'trades' && (
        <div className={`meme-oc-pause-indicator ${isTradesHovered ? 'visible' : ''}`}>
          <div className="meme-oc-pause-content">
            <div className="meme-oc-pause-icon">
              <svg
                className="meme-oc-pause-icon-svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 19h2V5H7v14zm8-14v14h2V5h-2z" />
              </svg>
            </div>
            <span className="meme-oc-pause-text">Paused</span>
          </div>
        </div>
      )}
            <TransactionFiltersPopup
        isOpen={showFiltersPopup}
        onClose={() => setShowFiltersPopup(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={transactionFilters}
      />
    </div>
  );
};

export default MemeOrderCenter;