import React, { useEffect, useRef, useState, useCallback } from 'react';

import { mockOrders, mockHolders, mockTopTraders, mockDevTokens } from './MemeTraderData';

import { formatSubscript, FormattedNumber } from '../../../utils/memeFormatSubscript';

import monadicon from '../../../assets/monadlogo.svg';
import filtercup from "../../../assets/filtercup.svg";
import switchicon from "../../../assets/switch.svg";
import closebutton from "../../../assets/close_button.png";
import walleticon from '../../../assets/wallet_icon.png';

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
  lastPrice?: number;
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
  devTokens?: DevToken[];
  page?: number;
  pageSize?: number;
  currentPrice?: number;
  monUsdPrice?: number;
  onSellPosition?: (position: Position, monAmount: string) => void;
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
  return `${v.toFixed(4)}`;
};

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const showTooltip = useCallback(() => setIsVisible(true), []);
  const hideTooltip = useCallback(() => setIsVisible(false), []);

  return (
    <div
      className="meme-ordercenter-tooltip-container"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        cursor: 'pointer'
      }}
    >
      {children}
      <div className={`meme-ordercenter-tooltip meme-ordercenter-tooltip-${position} meme-ordercenter-fade-popup ${isVisible ? 'meme-ordercenter-visible' : ''}`}>
        <div className="meme-ordercenter-tooltip-content">
          {content}
          <div className={`meme-ordercenter-tooltip-arrow meme-ordercenter-tooltip-arrow-${position}`}></div>
        </div>
      </div>
    </div>
  );
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
  const [sliderDragging, setSliderDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!showSellPopup || !selectedPosition) return null;

  return (
    <div className="alerts-popup-overlay" onClick={onClose}>
      <div className="alerts-popup" onClick={(e) => e.stopPropagation()}>
        <div className="alerts-popup-header">
          <h3 className="alerts-popup-title">Sell {selectedPosition.name} coin</h3>
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
                  {(selectedPosition.remainingTokens * (selectedPosition.lastPrice || currentPrice)).toFixed(4)} MON
                </div>
                <button className="meme-balance-max" onClick={onMaxClick}>
                  MAX
                </button>
              </div>
            </div>

            <div className="meme-trade-input-wrapper">
              <input
                type="number"
                value={sellAmount || "0"}
                onChange={onSellAmountChange}
                className="meme-trade-input"
              />
              <div
                className="meme-trade-currency"
                style={{
                  left: `${Math.max(12 + (sellAmount.length || 1) * 10, 12)}px`,
                }}
              >
                MON
              </div>
            </div>
            <div className="meme-balance-slider-wrapper">
              <div className="meme-slider-container meme-slider-mode">
                <input
                  type="range"
                  className={`meme-balance-amount-slider ${sliderDragging ? "dragging" : ""}`}
                  min="0"
                  max="100"
                  step="1"
                  value={sellSliderPercent}
                  onChange={onSellSliderChange}
                  onMouseDown={() => setSliderDragging(true)}
                  onMouseUp={() => setSliderDragging(false)}
                  style={{
                    background: `linear-gradient(to right, rgb(235, 112, 112) ${sellSliderPercent}%, rgb(28, 28, 31) ${sellSliderPercent}%)`,
                  }}
                />
                <div
                  className={`meme-slider-percentage-popup ${sliderDragging ? "visible" : ""}`}
                  style={{
                    left: `calc(${Math.max(0, Math.min(100, sellSliderPercent))}% - 15px)`
                  }}
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
                      onClick={() => onSellSliderChange({ target: { value: markPercent.toString() } } as React.ChangeEvent<HTMLInputElement>)}
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
            disabled={!sellAmount || parseFloat(sellAmount) <= 0 || parseFloat(sellAmount) > (selectedPosition.remainingTokens * (selectedPosition.lastPrice || currentPrice)) || isLoading}
          >
            {isLoading ? (
              <div className="meme-button-spinner"></div>
            ) : (
              `Instantly Sell ${selectedPosition.symbol}`
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
  devTokens = [],
  page = 0,
  pageSize = 100,
  currentPrice = 0,
  monUsdPrice = 0,
  onSellPosition,
}) => {
  const [activeSection, setActiveSection] = useState<'positions' | 'orders' | 'holders' | 'topTraders' | 'devTokens'>('positions');
  const [amountMode, setAmountMode] = useState<'MON' | 'USD'>('MON');
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [isDragging, setIsDragging] = useState(false);
  const [_dragStartY, setDragStartY] = useState(0);
  const [_dragStartHeight, setDragStartHeight] = useState(0);
  const [showSellPopup, setShowSellPopup] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [sellAmount, setSellAmount] = useState("");
  const [sellSliderPercent, setSellSliderPercent] = useState(0);

  const handleSellClose = useCallback(() => {
    setShowSellPopup(false);
    setSelectedPosition(null);
    setSellAmount("");
    setSellSliderPercent(0);
  }, []);

  const handleSellMaxClick = useCallback(() => {
    if (selectedPosition) {
      const maxMonAmount = selectedPosition.remainingTokens * (selectedPosition.lastPrice || currentPrice);
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

  const holderRows = (liveHolders.length
    ? liveHolders.map((h, i) => ({
      rank: page * pageSize + i + 1,
      wallet: h.address,
      balance: h.balance,
      bought: h.amountBought,
      sold: h.amountSold,
      valueBought: h.valueBought,
      valueSold: h.valueSold,
      pnl: h.valueNet + currentPrice * h.balance,
      remainingPct: h.tokenNet === 0 ? 0 : (h.balance / Math.max(h.amountBought, 1e-9)) * 100,
      tags: []
    }))
    : mockHolders.slice(0, 20).map((h, i) => ({
      rank: i + 1,
      wallet: h.wallet,
      balance: h.balance,
      bought: Math.random() * 10,
      sold: Math.random() * 8,
      valueBought: Math.random() * 1000,
      valueSold: Math.random() * 800,
      pnl: (Math.random() - .5) * 20,
      remainingPct: h.percentage,
      tags: h.tags
    }))
  );

  const devTokensToShow: DevToken[] = (devTokens && devTokens.length > 0)
    ? devTokens
    : mockDevTokens.map(mt => ({
      id: mt.id,
      symbol: mt.symbol,
      name: mt.name,
      imageUrl: mt.imageUrl,
      price: mt.price,
      marketCap: mt.marketCap,
      timestamp: mt.timestamp,
      migrated: mt.migrated,
    }));

  const availableTabs = [
    { key: 'positions', label: `Positions (${positions.length})` },
    { key: 'orders', label: `Orders (${mockOrders.length})` },
    { key: 'holders', label: `Holders (${holderRows.length})` },
    { key: 'topTraders', label: 'Top Traders' },
    { key: 'devTokens', label: `Dev Tokens (${devTokensToShow.length})` }
  ];

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
  }, [orderCenterHeight, onHeightChange, onDragStart, onDragEnd]);

  const renderTagIcon = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'sniper':
        return (
          <svg
            className="meme-tag-icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M 11.244141 2.0019531 L 11.244141 2.7519531 L 11.244141 3.1542969 C 6.9115518 3.5321749 3.524065 6.919829 3.1445312 11.251953 L 2.7421875 11.251953 L 1.9921875 11.251953 L 1.9921875 12.751953 L 2.7421875 12.751953 L 3.1445312 12.751953 C 3.5225907 17.085781 6.9110367 20.473593 11.244141 20.851562 L 11.244141 21.253906 L 11.244141 22.003906 L 12.744141 22.003906 L 12.744141 21.253906 L 12.744141 20.851562 C 17.076343 20.47195 20.463928 17.083895 20.841797 12.751953 L 21.244141 12.751953 L 21.994141 12.751953 L 21.994141 11.251953 L 21.244141 11.251953 L 20.841797 11.251953 C 20.462285 6.9209126 17.074458 3.5337191 12.744141 3.1542969 L 12.744141 2.7519531 L 12.744141 2.0019531 L 11.244141 2.0019531 z M 11.244141 4.6523438 L 11.244141 8.0742188 C 9.6430468 8.3817751 8.3759724 9.6507475 8.0683594 11.251953 L 4.6425781 11.251953 C 5.0091295 7.7343248 7.7260437 5.0173387 11.244141 4.6523438 z M 12.744141 4.6523438 C 16.25959 5.0189905 18.975147 7.7358303 19.341797 11.251953 L 15.917969 11.251953 C 15.610766 9.6510551 14.344012 8.3831177 12.744141 8.0742188 L 12.744141 4.6523438 z M 11.992188 9.4980469 C 13.371637 9.4980469 14.481489 10.6041 14.492188 11.982422 L 14.492188 12.021484 C 14.481501 13.40006 13.372858 14.503906 11.992188 14.503906 C 10.606048 14.503906 9.4921875 13.389599 9.4921875 12.001953 C 9.4921875 10.614029 10.60482 9.4980469 11.992188 9.4980469 z M 4.6425781 12.751953 L 8.0683594 12.751953 C 8.3760866 14.352973 9.6433875 15.620527 11.244141 15.927734 L 11.244141 19.353516 C 7.7258668 18.988181 5.0077831 16.270941 4.6425781 12.751953 z M 15.917969 12.751953 L 19.34375 12.751953 C 18.97855 16.26893 16.261295 18.986659 12.744141 19.353516 L 12.744141 15.927734 C 14.344596 15.619809 15.610176 14.35218 15.917969 12.751953 z" />
          </svg>
        );
      case 'dev':
        return (
          <svg
            className="meme-tag-icon"
            width="15"
            height="15"
            viewBox="0 0 30 30"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
          </svg>
        );
      case 'kol':
        return (
          <svg
            className="meme-tag-icon"
            width="15"
            height="15"
            viewBox="0 0 32 32"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M 15 4 L 15 6 L 13 6 L 13 8 L 15 8 L 15 9.1875 C 14.011719 9.554688 13.25 10.433594 13.0625 11.5 C 12.277344 11.164063 11.40625 11 10.5 11 C 6.921875 11 4 13.921875 4 17.5 C 4 19.792969 5.199219 21.8125 7 22.96875 L 7 27 L 25 27 L 25 22.96875 C 26.800781 21.8125 28 19.792969 28 17.5 C 28 13.921875 25.078125 11 21.5 11 C 20.59375 11 19.722656 11.164063 18.9375 11.5 C 18.75 10.433594 17.988281 9.554688 17 9.1875 L 17 8 L 19 8 L 19 6 L 17 6 L 17 4 Z M 16 11 C 16.5625 11 17 11.4375 17 12 C 17 12.5625 16.5625 13 16 13 C 15.4375 13 15 12.5625 15 12 C 15 11.4375 15.4375 11 16 11 Z M 10.5 13 C 12.996094 13 15 15.003906 15 17.5 L 15 22 L 10.5 22 C 8.003906 22 6 19.996094 6 17.5 C 6 15.003906 8.003906 13 10.5 13 Z M 21.5 13 C 23.996094 13 26 15.003906 26 17.5 C 26 19.996094 23.996094 22 21.5 22 L 17 22 L 17 17.5 C 17 15.003906 19.003906 13 21.5 13 Z M 9 24 L 23 24 L 23 25 L 9 25 Z" />
          </svg>
        );
      case 'bundler':
        return (
          <svg
            className="meme-tag-icon"
            width="15"
            height="15"
            viewBox="0 0 128 128"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M117 68.26l-26-15a2 2 0 00-2 0l-26 15A2 2 0 0062 70v30a2 2 0 001 1.73l26 15a2 2 0 002 0l26-15a2 2 0 001-1.73V70A2 2 0 00117 68.26zm-27-11l22.46 13L90 82.7 68 70zM66 73.46L88 86.15v25.41L66 98.86zm26 38.1V86.18L114 74V98.85zM56 102.25l-16 8.82V86.72l17-10a2 2 0 10-2-3.44l-17 10L15.55 70.56 38 57.82l17 8.95a2 2 0 001.86-3.54l-18-9.46a2 2 0 00-1.92 0L11 68.53a2 2 0 00-1 1.74V99.73a2 2 0 001 1.74L37 116.2a2 2 0 002 0l19-10.46a2 2 0 10-1.92-3.5zm-42-28L36 86.74V111L14 98.56zM38 49a2 2 0 002-2V28.46L62 41.15V61a2 2 0 004 0V41.15L88 28.46V47a2 2 0 004 0V25a2 2 0 00-1-1.73l-26-15a2 2 0 00-2 0l-26 15A2 2 0 0036 25V47A2 2 0 0038 49zM64 12.31L86 25 64 37.69 42 25z" />
          </svg>
        );
      case 'insider':
        return (
          <svg
            className="meme-tag-icon"
            width="15"
            height="15"
            viewBox="0 0 32 32"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M 16 3 C 14.0625 3 12.570313 3.507813 11.5 4.34375 C 10.429688 5.179688 9.8125 6.304688 9.375 7.34375 C 8.9375 8.382813 8.65625 9.378906 8.375 10.09375 C 8.09375 10.808594 7.859375 11.085938 7.65625 11.15625 C 4.828125 12.160156 3 14.863281 3 18 L 3 19 L 4 19 C 5.347656 19 6.003906 19.28125 6.3125 19.53125 C 6.621094 19.78125 6.742188 20.066406 6.8125 20.5625 C 6.882813 21.058594 6.847656 21.664063 6.9375 22.34375 C 6.984375 22.683594 7.054688 23.066406 7.28125 23.4375 C 7.507813 23.808594 7.917969 24.128906 8.375 24.28125 C 9.433594 24.632813 10.113281 24.855469 10.53125 25.09375 C 10.949219 25.332031 11.199219 25.546875 11.53125 26.25 C 11.847656 26.917969 12.273438 27.648438 13.03125 28.1875 C 13.789063 28.726563 14.808594 29.015625 16.09375 29 C 18.195313 28.972656 19.449219 27.886719 20.09375 26.9375 C 20.417969 26.460938 20.644531 26.050781 20.84375 25.78125 C 21.042969 25.511719 21.164063 25.40625 21.375 25.34375 C 22.730469 24.9375 23.605469 24.25 24.09375 23.46875 C 24.582031 22.6875 24.675781 21.921875 24.8125 21.40625 C 24.949219 20.890625 25.046875 20.6875 25.375 20.46875 C 25.703125 20.25 26.453125 20 28 20 L 29 20 L 29 19 C 29 17.621094 29.046875 16.015625 28.4375 14.5 C 27.828125 12.984375 26.441406 11.644531 24.15625 11.125 C 24.132813 11.121094 24.105469 11.132813 24 11 C 23.894531 10.867188 23.734375 10.601563 23.59375 10.25 C 23.3125 9.550781 23.042969 8.527344 22.59375 7.46875 C 22.144531 6.410156 21.503906 5.269531 20.4375 4.40625 C 19.371094 3.542969 17.90625 3 16 3 Z M 16 5 C 17.539063 5 18.480469 5.394531 19.1875 5.96875 C 19.894531 6.542969 20.367188 7.347656 20.75 8.25 C 21.132813 9.152344 21.402344 10.128906 21.75 11 C 21.921875 11.433594 22.109375 11.839844 22.40625 12.21875 C 22.703125 12.597656 23.136719 12.96875 23.6875 13.09375 C 25.488281 13.503906 26.15625 14.242188 26.5625 15.25 C 26.871094 16.015625 26.878906 17.066406 26.90625 18.09375 C 25.796875 18.1875 24.886719 18.386719 24.25 18.8125 C 23.40625 19.378906 23.050781 20.25 22.875 20.90625 C 22.699219 21.5625 22.632813 22.042969 22.40625 22.40625 C 22.179688 22.769531 21.808594 23.128906 20.78125 23.4375 C 20.070313 23.652344 19.558594 24.140625 19.21875 24.59375 C 18.878906 25.046875 18.675781 25.460938 18.4375 25.8125 C 17.960938 26.515625 17.617188 26.980469 16.0625 27 C 15.078125 27.011719 14.550781 26.820313 14.1875 26.5625 C 13.824219 26.304688 13.558594 25.929688 13.3125 25.40625 C 12.867188 24.460938 12.269531 23.765625 11.53125 23.34375 C 10.792969 22.921875 10.023438 22.714844 9 22.375 C 8.992188 22.359375 8.933594 22.285156 8.90625 22.09375 C 8.855469 21.710938 8.886719 21.035156 8.78125 20.28125 C 8.675781 19.527344 8.367188 18.613281 7.5625 17.96875 C 7 17.515625 6.195313 17.289063 5.25 17.15625 C 5.542969 15.230469 6.554688 13.65625 8.3125 13.03125 C 9.375 12.65625 9.898438 11.730469 10.25 10.84375 C 10.601563 9.957031 10.851563 8.96875 11.21875 8.09375 C 11.585938 7.21875 12.019531 6.480469 12.71875 5.9375 C 13.417969 5.394531 14.402344 5 16 5 Z M 13 9 C 12.449219 9 12 9.671875 12 10.5 C 12 11.328125 12.449219 12 13 12 C 13.550781 12 14 11.328125 14 10.5 C 14 9.671875 13.550781 9 13 9 Z M 17 9 C 16.449219 9 16 9.671875 16 10.5 C 16 11.328125 16.449219 12 17 12 C 17.550781 12 18 11.328125 18 10.5 C 18 9.671875 17.550781 9 17 9 Z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleTabChange = (section: 'positions' | 'orders' | 'holders' | 'topTraders' | 'devTokens') => {
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

    const activeTabIndex = availableTabs.findIndex(tab => tab.key === section);
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

  const FormattedNumberDisplay = ({ formatted }: { formatted: FormattedNumber }) => {
    if (formatted.type === 'simple') {
      return <span>{formatted.text}</span>;
    }

    return (
      <span>
        {formatted.beforeSubscript}
        <span className="subscript">{formatted.subscriptValue}</span>
        {formatted.afterSubscript}
      </span>
    );
  };

  const handleSellClick = (position: Position) => {
    setSelectedPosition(position);
    setShowSellPopup(true);
    setSellAmount("");
    setSellSliderPercent(0);
  };

  const handleSellConfirm = async () => {
    if (selectedPosition && sellAmount && parseFloat(sellAmount) > 0 && onSellPosition) {
      try {
        await onSellPosition(selectedPosition, sellAmount);
        setShowSellPopup(false);
        setSelectedPosition(null);
        setSellAmount("");
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
      const maxMonAmount = selectedPosition.remainingTokens * (selectedPosition.lastPrice || currentPrice);
      const newAmount = (maxMonAmount * percent) / 100;
      setSellAmount(newAmount.toFixed(4));
    }
  };

  const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSellAmount(value);
    if (selectedPosition) {
      const maxMonAmount = selectedPosition.remainingTokens * (selectedPosition.lastPrice || currentPrice);
      if (maxMonAmount > 0) {
        const percent = (parseFloat(value) / maxMonAmount) * 100;
        setSellSliderPercent(Math.min(100, Math.max(0, percent)));
      }
    }
  };

  console.log(devTokensToShow);

  const renderContent = () => {
    switch (activeSection) {
      case 'positions':
        return (
          <div className="meme-oc-section-content" data-section="positions">
            <div className="meme-oc-header">
              <div className="meme-oc-header-cell">Token</div>
              <div
                className="meme-oc-header-cell clickable"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Bought
              </div>
              <div className="meme-oc-header-cell">Sold</div>
              <div className="meme-oc-header-cell">Remaining</div>
              <div className="meme-oc-header-cell">PnL</div>
              <div className="meme-oc-header-cell">Actions</div>
            </div>
            <div className="meme-oc-items">
              {(positions?.length ? positions : []).map((p, _) => {
                const tokenShort = p.symbol || `${p.tokenId.slice(0, 6)}…${p.tokenId.slice(-4)}`;
                const tokenImageUrl = p.imageUrl || null;

                return (
                  <div key={p.tokenId} className="meme-oc-item">
                    <div className="meme-oc-cell">
                      <div className="meme-wallet-info">
                        <div className="meme-token-info" style={{ display: 'flex', alignItems: 'center' }}>
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
                            onClick={() => window.location.href = `/meme/${p.tokenId}`}
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
                          {amountMode === 'MON' && <img className="meme-ordercenter-monad-icon" src={monadicon} alt="MONAD" />}
                          <span className="meme-usd-amount buy">{fmtAmount(p.spentNative, amountMode, monUsdPrice)} </span>
                        </div>
                        <span className="meme-token-amount">{fmt(p.boughtTokens)} {p.symbol || ''}</span>
                      </div>
                    </div>
                    <div className="meme-oc-cell">
                      <div className="meme-trade-info">
                        <div className="meme-ordercenter-info">
                          {amountMode === 'MON' && <img className="meme-ordercenter-monad-icon" src={monadicon} alt="MONAD" />}
                          <span className="meme-usd-amount sell">{fmtAmount(p.receivedNative, amountMode, monUsdPrice)}</span>
                        </div>
                        <span className="meme-token-amount">{fmt(p.soldTokens)}  {p.symbol || ''}</span>
                      </div>
                    </div>
                    <div className="meme-oc-cell">
                      <div className="meme-remaining-info">
                        <div>
                          <span className="meme-remaining">
                            {fmt(p.remainingTokens)} {p.symbol || ''}
                          </span>
                          <span className="meme-remaining-percentage">
                            {p.remainingPct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="meme-remaining-bar">
                          <div
                            className="meme-remaining-bar-fill"
                            style={{ width: `${Math.max(0, Math.min(100, p.remainingPct)).toFixed(0)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="meme-oc-cell">
                      <div className="meme-ordercenter-info">
                        {amountMode === 'MON' && <img className="meme-ordercenter-monad-icon" src={monadicon} alt="MONAD" />}
                        <div className="meme-pnl-info">
                          <span className={`meme-pnl ${p.pnlNative >= 0 ? 'positive' : 'negative'}`}>
                            {p.pnlNative >= 0 ? '+' : ''}{fmtAmount(Math.abs(p.pnlNative), amountMode, monUsdPrice)}         ({p.pnlNative >= 0 ? '+' : ''}{p.spentNative > 0 ? ((p.pnlNative / p.spentNative) * 100).toFixed(1) : '0.0'}%)
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
                    <span className={`meme-order-type ${order.type.toLowerCase()}`}>{order.type}</span>
                  </div>
                  <div className="meme-oc-cell">{order.amount}</div>
                  <div className="meme-oc-cell">${order.currentMC.toLocaleString()}</div>
                  <div className="meme-oc-cell">${order.targetMC.toLocaleString()}</div>
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
              <div className="meme-oc-header-cell">Balance</div>
              <div
                className="meme-oc-header-cell clickable"
                onClick={() => setAmountMode(prev => prev === 'MON' ? 'USD' : 'MON')}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Bought (Avg Buy)
                <img src={switchicon} className="meme-header-switch-icon" alt="" style={{ width: '12px', height: '12px' }} />
              </div>
              <div className="meme-oc-header-cell">Sold (Avg Sell)</div>
              <div className="meme-oc-header-cell">PnL</div>
              <div className="meme-oc-header-cell">Remaining</div>
              <div className="meme-oc-header-cell">Filter</div>
            </div>
            <div className="meme-oc-items">
              {holderRows.map(row => (
                <div key={row.wallet} className="meme-oc-item">
                  <div className="meme-oc-cell">
                    <div className="meme-wallet-info">
                      <span className="meme-wallet-index">{row.rank}</span>
                      <span className="meme-wallet-address">
                        {row.wallet.slice(0, 8)}…{row.wallet.slice(-4)}
                      </span>
                    </div>
                  </div>
                  <div className="meme-oc-cell">
                    <span className="meme-mon-balance">{fmt(row.balance, 3)}</span>
                  </div>
                  <div className="meme-oc-cell">
                    <div className="meme-trade-info">
                      <span className="meme-token-amount">{fmt(row.bought)}</span>
                      <span className="meme-usd-amount buy">{fmtAmount(row.valueBought, amountMode, monUsdPrice)}</span>
                    </div>
                    <span className="meme-avg-price">
                      <FormattedNumberDisplay formatted={formatSubscript((row.valueBought / (row.bought || 1)).toFixed(7))} /> {amountMode === 'USD' ? 'USD' : 'MON'}
                    </span>
                  </div>
                  <div className="meme-oc-cell">
                    <div className="meme-trade-info">
                      <span className="meme-token-amount">{fmt(row.sold)}</span>
                      <span className="meme-usd-amount sell">{fmtAmount(row.valueSold, amountMode, monUsdPrice)}</span>
                    </div>
                    <span className="meme-avg-price">
                      <FormattedNumberDisplay formatted={formatSubscript((row.valueSold / (row.sold || 1)).toFixed(7))} /> {amountMode === 'USD' ? 'USD' : 'MON'}
                    </span>
                  </div>
                  <div className="meme-oc-cell">
                    <span className={`meme-pnl ${row.pnl >= 0 ? 'positive' : 'negative'}`}>
                      {row.pnl >= 0 ? '+' : ''}{fmtAmount(Math.abs(row.pnl), amountMode, monUsdPrice)}
                    </span>
                  </div>
                  <div className="meme-oc-cell">
                    <div className="meme-remaining-info">
                      <div>
                        <span className="meme-remaining">{row.remainingPct.toFixed(1)}%</span>
                      </div>
                      <div className="meme-remaining-bar">
                        <div className="meme-remaining-bar-fill"
                          style={{ width: `${row.remainingPct.toFixed(0)}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="meme-oc-cell"><button className="meme-filter-action-btn">
                    <img src={filtercup} alt="Filter" className="oc-filter-cup" />
                  </button></div>
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
              <div className="meme-oc-header-cell">MON Balance</div>
              <div className="meme-oc-header-cell">Bought (Avg Buy)</div>
              <div className="meme-oc-header-cell">Sold (Avg Sell)</div>
              <div className="meme-oc-header-cell">PnL</div>
              <div className="meme-oc-header-cell">Remaining</div>
              <div className="meme-oc-header-cell">Filter</div>
            </div>
            <div className="meme-oc-items">
              {mockTopTraders.slice(0, 15).map((trader, index) => (
                <div key={trader.id} className="meme-oc-item">
                  <div className="meme-oc-cell">
                    <div className="meme-wallet-info">
                      <span className="meme-wallet-index">{index + 1}</span>
                      <span className="meme-wallet-address">{trader.wallet}</span>
                      <div className="meme-wallet-tags">
                        {trader.tags.map(tag => (
                          <Tooltip key={tag} content={tag}>
                            <span className={`meme-tag meme-tag-${tag.toLowerCase().replace(' ', '')}`}>
                              {renderTagIcon(tag)}
                            </span>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="meme-oc-cell">
                    <span className="meme-mon-balance"><img className="meme-oc-monad-icon" src={monadicon} />{trader.solBalance.toFixed(3)}</span>
                  </div>
                  <div className="meme-oc-cell">
                    <div className="meme-trade-info">
                      <span className="meme-usd-amount buy">${trader.bought.usd.toFixed(2)}</span>
                      <span className="meme-token-amount">{trader.bought.amount.toFixed(0)}M / {trader.bought.percentage.toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className="meme-oc-cell">
                    <div className="meme-trade-info">
                      <span className="meme-usd-amount sell">${trader.sold.usd.toFixed(2)}</span>
                      <span className="meme-token-amount">{trader.sold.amount.toFixed(0)}M / {trader.sold.percentage.toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className="meme-oc-cell">
                    <span className={`meme-pnl ${trader.pnl.amount >= 0 ? 'positive' : 'negative'}`}>
                      {trader.pnl.amount >= 0 ? '+' : ''}${trader.pnl.amount.toFixed(0)}
                    </span>
                  </div>
                  <div className="meme-oc-cell">
                    <div className="meme-remaining-info">
                      <div>
                        <span className="meme-remaining">${trader.remaining.amount.toFixed(0)}</span>
                        <span className="meme-remaining-percentage">{trader.remaining.percentage.toFixed(0)}%</span>
                      </div>
                      <div className="meme-remaining-bar">
                        <div className="meme-remaining-bar-fill" style={{ width: `${trader.remaining.percentage.toFixed(0)}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="meme-oc-cell"><button className="meme-filter-action-btn">
                    <img src={filtercup} alt="Filter" className="oc-filter-cup" />
                  </button></div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'devTokens':
        return (
          <div className="meme-oc-section-content" data-section="devTokens">
            <div className="meme-oc-header">
              <div className="meme-oc-header-cell">Token</div>
              <div className="meme-oc-header-cell">Price (MON)</div>
              <div className="meme-oc-header-cell">Market Cap (MON)</div>
              <div className="meme-oc-header-cell">Launched</div>
              <div className="meme-oc-header-cell">Migraton Status</div>
            </div>

            <div className="meme-oc-items">
              {devTokensToShow.length === 0 ? (
                <div className="meme-oc-empty">No tokens</div>
              ) : devTokensToShow.map((t) => {
                const price = Number(t.price || 0);
                const mc = Number(t.marketCap || 0);
                return (
                  <div key={t.id} className="meme-oc-item">
                    <div className="meme-oc-cell">
                      <div className="meme-wallet-info">
                        <div className="meme-token-info" style={{ display: 'flex', alignItems: 'center' }}>
                          {t.imageUrl && (
                            <img
                              src={t.imageUrl}
                              alt={t.symbol || t.name || t.id}
                              className="meme-token-icon"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                          <span className="meme-wallet-address" title={t.name || t.symbol || t.id}>
                            {(t.symbol || '').toUpperCase()} {t.name ? `· ${t.name}` : ''}
                          </span>
                        </div>
                        <div className="meme-wallet-address-sub">
                          {t.id.slice(0, 6)}…{t.id.slice(-4)}
                        </div>
                      </div>
                    </div>

                    <div className="meme-oc-cell">
                      <div className="meme-ordercenter-info">
                        <img className="meme-ordercenter-monad-icon" src={monadicon} alt="MONAD" />
                        <span className="meme-usd-amount">{price > 0 ? price.toFixed(6) : '—'}</span>
                      </div>
                    </div>

                    <div className="meme-oc-cell">
                      <div className="meme-ordercenter-info">
                        <img className="meme-ordercenter-monad-icon" src={monadicon} alt="MONAD" />
                        <span className="meme-usd-amount">{mc > 0 ? fmt(mc, 2) : '—'}</span>
                      </div>
                    </div>

                    <div className="meme-oc-cell">
                      <span>{timeAgo(t.timestamp)}</span>
                    </div>

                    <div className="meme-oc-cell">
                      <span>{t.migrated ? 'Migrated' : 'Non-migrated'}</span>
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
        height: orderCenterHeight === 0 || isOrderCenterVisible === false ? '0px' : `${orderCenterHeight}px`,
        transition: isVertDragging ? 'none' : 'height 0.1s ease',
        overflow: 'visible',
      }}
    >
      <div className={`meme-oc-drag-spacer ${!isOrderCenterVisible ? 'meme-oc-collapsed' : ''}`}>
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
              title={isWidgetOpen ? 'Close QuickBuy Widget' : 'Open QuickBuy Widget'}
            >
              {windowWidth > 768 && <span>{isWidgetOpen ? 'Quick Buy' : 'Quick Buy'}</span>}
            </button>
            <button
              onClick={() => setAmountMode(prev => prev === 'MON' ? 'USD' : 'MON')}
              className="meme-oc-currency-toggle"
              title={`Switch to ${amountMode === 'MON' ? 'USD' : 'MON'} display`}
            >
              <img src={switchicon} className="meme-currency-switch-icon" />
              {amountMode}
            </button>
          </div>
        )}
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