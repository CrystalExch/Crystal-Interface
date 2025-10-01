import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { formatSig } from '../../OrderCenter/utils';
import {
  mockDevTokens,
  mockHolders,
  mockOrders,
  mockTopTraders,
} from './MemeTraderData';

import closebutton from '../../../assets/close_button.png';
import filledcup from '../../../assets/filledcup.svg';
import filtercup from '../../../assets/filtercup.svg';
import lightning from '../../../assets/flash.png';
import monadicon from '../../../assets/monadlogo.svg';
import switchicon from '../../../assets/switch.svg';
import walleticon from '../../../assets/wallet_icon.png';
import { formatNumber } from '../../../utils/formatNumber';
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
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isWidgetOpen?: boolean;
  onToggleWidget?: () => void;
  holders?: LiveHolder[];
  positions?: Position[];
  topTraders: LiveHolder[];
  devTokens?: DevToken[];
  page?: number;
  pageSize?: number;
  currentPrice?: number;
  monUsdPrice?: number;
  onSellPosition?: (position: Position, monAmount: string) => void;
  trackedAddresses?: string[];
  onToggleTrackedAddress?: (addr: string) => void;
  token: any;
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

const fmt = (v: number, d = 3) => {
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
    return `$${(v * monPrice).toFixed(2)}`;
  }
  return `${v.toFixed(2)}`;
};

interface SellPopupProps {
  showSellPopup: boolean;
  selectedPosition: Position | null;
  sellAmount: string;
  sellSliderPercent: number;
  onClose: () => void;
  onSellAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSellSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSellConfirm: () => void;
  onMaxClick: () => void;
  fmt: (v: number, d?: number) => string;
  currentPrice: number;
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
}) => {
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

  const [sliderDragging, setSliderDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!showSellPopup || !selectedPosition) return null;

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
                  {(
                    selectedPosition.remainingTokens *
                    (selectedPosition.lastPrice || currentPrice)
                  ).toFixed(4)}{' '}
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
              <img
                className="meme-currency-monad-icon"
                src={monadicon}
              />
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

                <div className="meme-balance-slider-marks">
                  {[0, 25, 50, 75, 100].map((markPercent) => (
                    <span
                      key={markPercent}
                      className="meme-balance-slider-mark sell"
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
              parseFloat(sellAmount) >
                selectedPosition.remainingTokens *
                  (selectedPosition.lastPrice || currentPrice) ||
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
  page = 0,
  pageSize = 100,
  currentPrice = 0,
  monUsdPrice = 0,
  onSellPosition,
  trackedAddresses = [],
  onToggleTrackedAddress,
  token,
}) => {
  const [activeSection, setActiveSection] = useState<
    'positions' | 'orders' | 'holders' | 'topTraders' | 'devTokens'
  >('positions');
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

  const handleSellClose = useCallback(() => {
    setShowSellPopup(false);
    setSelectedPosition(null);
    setSellAmount('');
    setSellSliderPercent(0);
  }, []);

  const handleSellMaxClick = useCallback(() => {
    if (selectedPosition) {
      const maxMonAmount =
        selectedPosition.remainingTokens *
        (selectedPosition.lastPrice || currentPrice);
      setSellAmount(maxMonAmount.toFixed(4));
      setSellSliderPercent(100);
    }
  }, [selectedPosition, currentPrice]);

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
            ? 0
            : (h.balance / Math.max(h.amountBought, 1e-9)) * 100,
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

  const devTokensToShow: DevToken[] =
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
    { key: 'positions', label: `Positions (${positions.length})` },
    { key: 'orders', label: `Orders (${mockOrders.length})` },
    { key: 'holders', label: `Holders (${holderRows.length})` },
    { key: 'topTraders', label: `Top Traders (${topTraderRows.length})` },
    { key: 'devTokens', label: `Dev Tokens (${devTokensToShow.length})` },
  ];

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startY = e.clientY;
      const startHeight = orderCenterHeight;

      setIsDragging(true);
      setDragStartY(startY);
      setDragStartHeight(startHeight);
      onDragStart?.();

      const handleMouseMove = (moveEvent: MouseEvent) => {
        moveEvent.preventDefault();
        const deltaY = startY - moveEvent.clientY;
        const newHeight = Math.max(150, Math.min(800, startHeight + deltaY));
        onHeightChange?.(newHeight);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        upEvent.preventDefault();
        setIsDragging(false);
        onDragEnd?.();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [orderCenterHeight, onHeightChange, onDragStart, onDragEnd],
  );

  const handleTabChange = (
    section: 'positions' | 'orders' | 'holders' | 'topTraders' | 'devTokens',
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
      const maxMonAmount =
        selectedPosition.remainingTokens *
        (selectedPosition.lastPrice || currentPrice);
      const newAmount = (maxMonAmount * percent) / 100;
      setSellAmount(newAmount.toFixed(4));
    }
  };

  const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSellAmount(value);
    if (selectedPosition) {
      const maxMonAmount =
        selectedPosition.remainingTokens *
        (selectedPosition.lastPrice || currentPrice);
      if (maxMonAmount > 0) {
        const percent = (parseFloat(value) / maxMonAmount) * 100;
        setSellSliderPercent(Math.min(100, Math.max(0, percent)));
      }
    }
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
                        <div className="meme-wallet-info">
                          <div
                            className="meme-token-info"
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            {tokenImageUrl && (
                              <img
                                src={tokenImageUrl}
                                alt={p.symbol}
                                className="meme-token-icon"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <span
                              className="meme-wallet-address meme-clickable-token"
                              onClick={() =>
                                (window.location.href = `/meme/${p.tokenId}`)
                              }
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
                              {p.pnlNative >= 0 ? '+' : ''}
                              {fmtAmount(
                                Math.abs(p.pnlNative),
                                amountMode,
                                monUsdPrice,
                              )}{' '}
                              ({p.pnlNative >= 0 ? '+' : ''}
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
                .map((row) => (
                  <div key={row.wallet} className="meme-oc-item">
                    <div className="meme-oc-cell">
                      <div className="meme-wallet-info">
                        <span className="meme-wallet-index">{row.rank}</span>
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
                        <span className="meme-wallet-address">
                          {row.wallet.slice(0, 8)}…{row.wallet.slice(-4)}
                        </span>
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
                          (
                            (row.valueBought * monUsdPrice * 1e9) /
                            (row.bought || 1)
                          ),
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
                          (
                            (row.valueSold * monUsdPrice * 1e9) /
                            (row.sold || 1)
                          ),
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
                ))}
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
                      ? 0
                      : (row.balance / Math.max(row.amountBought, 1e-9)) * 100;
                  const pnl = row.valueNet;
                  const avgBuyUSD =
                    (row.valueBought * monUsdPrice) / (row.amountBought || 1);
                  const avgSellUSD =
                    (row.valueSold * monUsdPrice) / (row.amountSold || 1);

                  return (
                    <div key={row.address} className="meme-oc-item">
                      <div className="meme-oc-cell">
                        <div className="meme-wallet-info">
                          <span className="meme-wallet-index">{index + 1}</span>
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
                          <span
                            className="meme-wallet-address"
                            title={row.address}
                          >
                            {row.address.slice(0, 8)}…{row.address.slice(-4)}
                          </span>
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
                          (${formatNumber((avgBuyUSD * 1e9))})
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
                          (${formatNumber((avgSellUSD * 1e9))})
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
          <div className="meme-oc-section-content" data-section="devTokens">
            <div className="meme-oc-header">
              <div className="meme-oc-header-cell">Token</div>
              <div className="meme-oc-header-cell">Token Address</div>
              <div className="meme-oc-header-cell">Market Cap (MON)</div>
              <div className="meme-oc-header-cell">Migration Status</div>
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
                        <div className="meme-wallet-info">
                          <div
                            className="meme-token-info"
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            {t.imageUrl && (
                              <img
                                src={t.imageUrl}
                                alt={t.symbol || t.name || t.id}
                                className="meme-token-icon"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <span
                              className="meme-wallet-address"
                              title={t.name || t.symbol || t.id}
                            >
                              {(t.symbol || '').toUpperCase()}
                              <span className="meme-wallet-address-span">
                                {timeAgo(t.timestamp)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="meme-oc-cell">
                        <div className="meme-wallet-address-sub">
                          {t.id.slice(0, 6)}…{t.id.slice(-4)}
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
                        <span>{t.migrated ? 'Migrated' : 'Non-migrated'}</span>
                      </div>
                    </div>
                  );
                })
              )}
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
        transition: isVertDragging ? 'none' : 'height 0.1s ease',
        overflow: 'visible',
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
              title={
                isWidgetOpen ? 'Close QuickBuy Widget' : 'Open QuickBuy Widget'
              }
            >
              <img className="memeordercenter-lightning" src={lightning} />

              {windowWidth > 768 && (
                <span>{isWidgetOpen ? 'Instant Trade' : 'Instant Trade'}</span>
              )}
            </button>
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
      <SellPopup
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
      />
    </div>
  );
};

export default MemeOrderCenter;
