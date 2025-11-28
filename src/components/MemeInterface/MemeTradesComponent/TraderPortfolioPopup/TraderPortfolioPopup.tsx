import { X, Edit2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import monadicon from '../../../../assets/monadlogo.svg';
import closebutton from '../../../../assets/close_button.png';
import { settings } from '../../../../settings';
import EmojiPicker from 'emoji-picker-react';

import {
  showLoadingPopup,
  updatePopup,
} from '../../../MemeTransactionPopup/MemeTransactionPopupManager';
import './TraderPortfolioPopup.css';

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

interface TraderPortfolioPopupProps {
  traderAddress: string;
  onClose: () => void;
  tokenList: any[];
  marketsData: any[];
  onMarketSelect?: (shareData: any) => void;
  setSendTokenIn?: (token: any) => void;
  setpopup?: (value: number) => void;
  positions?: Position[];
  onSellPosition?: (position: Position, monAmount: string) => void;
  monUsdPrice: number;
  trackedWalletsRef?: React.MutableRefObject<any[]>;
  onAddTrackedWallet?: (wallet: { address: string; name: string; emoji: string }) => void;
}

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
const TraderPortfolioPopup: React.FC<TraderPortfolioPopupProps> = ({
  traderAddress,
  onClose,
  tokenList,
  marketsData,
  onMarketSelect,
  setSendTokenIn,
  setpopup,
  positions = [],
  onSellPosition,
  monUsdPrice,
  trackedWalletsRef,
  onAddTrackedWallet,
}) => {

  const [traderPositions, setTraderPositions] = useState<Position[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'top100'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (trackedWalletsRef?.current) {
      const tracked = trackedWalletsRef.current.find(
        (w: any) => w.address.toLowerCase() === traderAddress.toLowerCase()
      );
      if (tracked) {
        setWalletName(tracked.name || '');
        setSelectedEmoji(tracked.emoji || '🎯');
      }
    }
  }, [traderAddress, trackedWalletsRef]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (!traderAddress) return;

    let cancelled = false;
    setIsLoadingPositions(true);

    (async () => {
      try {
        const response = await fetch(
          `https://api.crystal.exchange/user/${traderAddress}`,
          {
            method: 'GET',
            headers: { 'content-type': 'application/json' },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch trader positions');
        }

        const payload = await response.json();
        const rows: any[] = payload.positions ?? [];

        if (cancelled) return;

        const positions = rows.map((p) => {
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
          };
        });

        const sorted = positions.sort((a, b) => (b.pnlNative ?? 0) - (a.pnlNative ?? 0));
        setTraderPositions(sorted);
      } catch (error) {
        console.error('Failed to fetch trader positions:', error);
        setTraderPositions([]);
      } finally {
        if (!cancelled) {
          setIsLoadingPositions(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [traderAddress]);
  const navigate = useNavigate();
  const [isBlurred] = useState(false);
  const [amountMode, setAmountMode] = useState<'MON' | 'USD'>('MON');
  const [tokenImageErrors, setTokenImageErrors] = useState<Record<string, boolean>>({});
  const [showPNLCalendar, setShowPNLCalendar] = useState(false);
  const [pnlCalendarLoading, setPNLCalendarLoading] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [totalAccountValue, setTotalAccountValue] = useState<number | null>(null);
  const [tokenBalances, setTokenBalances] = useState<{ [key: string]: string }>({});

  // Filter positions based on active tab
  const tabFilteredPositions = activeTab === 'active' 
    ? traderPositions.filter(p => p.remainingTokens > 0)
    : activeTab === 'history'
    ? traderPositions.filter(p => p.remainingTokens === 0)
    : [];

  // Apply search filter on top of tab filter
  const displayedPositions = tabFilteredPositions.filter(p => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const matchesSymbol = p.symbol?.toLowerCase().includes(query);
    const matchesName = p.name?.toLowerCase().includes(query);
    const matchesAddress = p.tokenId.toLowerCase().includes(query);
    
    return matchesSymbol || matchesName || matchesAddress;
  });

  const handleNameSubmit = () => {
    if (walletName.trim() && onAddTrackedWallet) {
      onAddTrackedWallet({
        address: traderAddress,
        name: walletName.trim(),
        emoji: selectedEmoji,
      });
      setIsEditingName(false);
    }
  };

  const handleNameBlur = () => {
    if (walletName.trim()) {
      handleNameSubmit();
    } else {
      setIsEditingName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      if (trackedWalletsRef?.current) {
        const tracked = trackedWalletsRef.current.find(
          (w: any) => w.address.toLowerCase() === traderAddress.toLowerCase()
        );
        if (tracked) {
          setWalletName(tracked.name || '');
        }
      }
    }
  };
  const handleEmojiSelect = (emojiData: any) => {
    setSelectedEmoji(emojiData.emoji);
    setShowEmojiPicker(false);
    setEmojiPickerPosition(null);

    if (walletName.trim() && onAddTrackedWallet) {
      onAddTrackedWallet({
        address: traderAddress,
        name: walletName.trim(),
        emoji: emojiData.emoji,
      });
    }
  };
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

  useEffect(() => {
    const fetchBalances = async () => {
      if (!traderAddress) return;

      try {
        const { getBalance } = await import('@wagmi/core');
        const { config } = await import('../../../../wagmi');
        const balance = await getBalance(config, {
          address: traderAddress as `0x${string}`,
        });

        const monAmount = Number(balance.value) / 1e18;
        const positionsValue = traderPositions.reduce((sum, p) => {
          return sum + (p.remainingTokens * (p.lastPrice || 0));
        }, 0);

        const totalMonValue = monAmount + positionsValue;
        const totalValueUsd = totalMonValue * monUsdPrice;

        setTotalAccountValue(totalValueUsd);
      } catch (error) {
        setTotalAccountValue(0);
      }
    };

    fetchBalances();
  }, [traderAddress, monUsdPrice, traderPositions]);
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Calculate unrealized PNL only from active positions (remainingTokens > 0)
  const totalUnrealizedPnlNative = traderPositions?.reduce((sum, p) => {
    if (p.remainingTokens > 0) {
      // Only count the unrealized portion: remainingTokens * lastPrice
      const unrealizedValue = p.remainingTokens * (p.lastPrice || 0);
      const spentOnRemaining = (p.remainingTokens / p.boughtTokens) * p.spentNative;
      const unrealizedPnl = unrealizedValue - spentOnRemaining;
      return sum + unrealizedPnl;
    }
    return sum;
  }, 0) || 0;
  const totalUnrealizedPnlUsd = totalUnrealizedPnlNative * monUsdPrice;
  const unrealizedClass = totalUnrealizedPnlNative >= 0 ? 'positive' : 'negative';
  const unrealizedSign = totalUnrealizedPnlNative >= 0 ? '+' : '-';

  // Calculate realized PNL from closed positions (remainingTokens === 0)
  const totalRealizedPnlNative = traderPositions?.reduce((sum, p) => {
    if (p.remainingTokens === 0) {
      // For fully closed positions, realized PNL = received - spent
      return sum + (p.receivedNative - p.spentNative);
    }
    return sum;
  }, 0) || 0;
  const totalRealizedPnlUsd = totalRealizedPnlNative * monUsdPrice;
  const realizedClass = totalRealizedPnlNative >= 0 ? 'positive' : 'negative';
  const realizedSign = totalRealizedPnlNative >= 0 ? '+' : '-';

  // Calculate PNL ranges based on all positions
  const pnlRanges = traderPositions?.reduce((ranges, p) => {
    if (p.spentNative === 0) return ranges;
    
    const pnlPercentage = (p.pnlNative / p.spentNative) * 100;
    
    if (pnlPercentage > 500) {
      ranges.over500++;
    } else if (pnlPercentage >= 200) {
      ranges.range200to500++;
    } else if (pnlPercentage >= 0) {
      ranges.range0to200++;
    } else if (pnlPercentage >= -50) {
      ranges.range0toNeg50++;
    } else {
      ranges.underNeg50++;
    }
    
    return ranges;
  }, {
    over500: 0,
    range200to500: 0,
    range0to200: 0,
    range0toNeg50: 0,
    underNeg50: 0
  }) || {
    over500: 0,
    range200to500: 0,
    range0to200: 0,
    range0toNeg50: 0,
    underNeg50: 0
  };

  return (
    <div className="trader-popup-backdrop" onClick={handleBackdropClick}>
      <div className="trader-popup-container">
        <div className="trader-popup-header">
          <div className="trader-popup-title">
            <div className="trader-address-container">
              {isEditingName ? (
                <div className="trader-name-input-container">
                  <span className="trader-emoji-preview">{selectedEmoji}</span>
                  <input
                    ref={nameInputRef}
                    type="text"
                    className="trader-name-input"
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    onBlur={handleNameBlur}
                    placeholder=""
                    autoFocus
                  />
                </div>
              ) : walletName ? (
                <div className="trader-name-display">
                  <button
                    className="trader-emoji-button"
                    onClick={(e) => {
                      if (!showEmojiPicker) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setEmojiPickerPosition({
                          top: rect.bottom + window.scrollY + 8,
                          left: rect.left + window.scrollX + rect.width / 2,
                        });
                      }
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                  >
                    {selectedEmoji}
                  </button>
                  <span
                    className="trader-wallet-name"
                    onClick={() => setIsEditingName(true)}
                  >
                    {walletName}
                  </span>
                </div>
              ) : (
                <div
                  className="rename-track-button"
                  onClick={() => setIsEditingName(true)}
                >
                  <span>Rename to track</span>
                  <Edit2
                    size={12}
                    className="rename-track-edit-icon"
                  />
                </div>
              )}
              <span className="trader-address"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(traderAddress, 'Wallet address copied');
                }}
                style={{ cursor: 'pointer' }}>
                {traderAddress}
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
              </span>
            </div>
          </div>
          <button className="trader-popup-close" onClick={onClose}>
            <img src={closebutton} className="close-button-icon" alt="Close" />
          </button>
        </div>

        <div className="trader-popup-content">
          <div className="trenches-top-section">
            <div className="trenches-balance-section">
              <h3 className="trenches-balance-title">BALANCE</h3>
              <div>
                <div className="trenches-balance-item">
                  <div className="trenches-balance-label">Total Value</div>
                  <div className={`trenches-balance-value ${isBlurred ? 'blurred' : ''}`}>
                    <span className="wallet-dropdown-value">
                      ${formatNumberWithCommas(totalAccountValue || 0, 2)}
                    </span>
                  </div>
                </div>
                <div className="trenches-balance-item">
                  <div className="trenches-balance-label">Unrealized PNL</div>
                  <div className={`trenches-balance-value-small ${unrealizedClass} ${isBlurred ? 'blurred' : ''}`}>
                    {unrealizedSign}${formatNumberWithCommas(Math.abs(totalUnrealizedPnlUsd), 2)}
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
                  <svg fill="#cfcfdfff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="18" height="18">
                    <path d="M 8 8 L 8 20 L 56 20 L 56 8 L 46 8 L 46 9 C 46 10.657 44.657 12 43 12 C 41.343 12 40 10.657 40 9 L 40 8 L 24 8 L 24 9 C 24 10.657 22.657 12 21 12 C 19.343 12 18 10.657 18 9 L 18 8 L 8 8 z M 8 22 L 8 56 L 56 56 L 56 24 L 52 23.832031 L 52 45 C 52 47 47 47 47 47 C 47 47 47 52 44 52 L 12 52 L 12 22.167969 L 8 22 z M 19 29 L 19 35 L 25 35 L 25 29 L 19 29 z M 29 29 L 29 35 L 35 35 L 35 29 L 29 29 z M 39 29 L 39 35 L 45 35 L 45 29 L 39 29 z M 19 39 L 19 45 L 25 45 L 25 39 L 19 39 z M 29 39 L 29 45 L 35 45 L 35 39 L 29 39 z M 39 39 L 39 45 L 45 45 L 45 39 L 39 39 z" />
                  </svg>
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
              </div>
              <div className="trenches-performance-stats">
                <div className="trenches-performance-stat-row">
                  <span className="trenches-performance-stat-label">1d Unrealized PNL</span>
                  <span className={`trenches-performance-stat-value ${isBlurred ? 'blurred' : ''}`}>
                    $0.00
                  </span>
                </div>
                <div className="trenches-performance-stat-row">
                  <span className="trenches-performance-stat-label">1d Realized PNL</span>
                  <span className={`trenches-performance-stat-value ${isBlurred ? 'blurred' : ''}`}>
                    $0.00
                  </span>
                </div>
                <div className="trenches-performance-stat-row">
                  <span className="trenches-performance-stat-label">1d TXNS</span>
                  <span className={`trenches-performance-stat-value ${isBlurred ? 'blurred' : ''}`}>
                    0.0/0
                  </span>
                </div>
              </div>
              <div className="trenches-performance-ranges">
                {[
                  { label: '>500%', count: pnlRanges.over500, color: 'rgb(67, 254, 154)' },
                  { label: '200% ~ 500%', count: pnlRanges.range200to500, color: 'rgb(67, 254, 154)' },
                  { label: '0% ~ 200%', count: pnlRanges.range0to200, color: 'rgb(67, 254, 154)' },
                  { label: '0% ~ -50%', count: pnlRanges.range0toNeg50, color: 'rgb(247, 127, 125)' },
                  { label: '<-50%', count: pnlRanges.underNeg50, color: 'rgb(247, 127, 125)' }
                ].map((range, index) => (
                  <div key={index} className="trenches-performance-range">
                    <span className="trenches-performance-range-label">
                      <span style={{
                        display: 'inline-block',
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        backgroundColor: range.color,
                        opacity: range.count > 0 ? 1 : 0.25
                      }}></span>
                      {range.label}
                    </span>
                    <span className="trenches-performance-range-count">
                      {range.count}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pnl-calendar-ratio-container">
                <div className="pnl-calendar-ratio-buy"></div>
                <div className="pnl-calendar-ratio-sell"></div>
              </div>
            </div>
          </div>

          <div className="trader-trenches-activity-section">
            <div className="trenches-activity-header">
              <div className="trenches-activity-tabs">
                <button 
                  className={`trenches-activity-tab ${activeTab === 'active' ? 'active' : ''}`}
                  onClick={() => setActiveTab('active')}
                >
                  Active Positions
                </button>
                <button 
                  className={`trenches-activity-tab ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  History
                </button>
                <button 
                  className={`trenches-activity-tab ${activeTab === 'top100' ? 'active' : ''}`}
                  onClick={() => setActiveTab('top100')}
                >
                  Top 100
                </button>
              </div>
              <div className="trenches-activity-filters">
                <input
                  type="text"
                  placeholder="Search by name or address"
                  className="trenches-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="meme-oc-section-content" data-section="positions">
              <div className={`meme-oc-header ${activeTab === 'active' ? '' : 'meme-oc-header-5-col'}`}>
                <div className="meme-oc-header-cell">Token</div>
                <div className="meme-oc-header-cell clickable">Bought</div>
                <div className="meme-oc-header-cell">Sold</div>
                {activeTab === 'active' && <div className="meme-oc-header-cell">Remaining</div>}
                <div className="meme-oc-header-cell">PnL</div>
                <div className="meme-oc-header-cell">Actions</div>
              </div>
              <div className="meme-oc-items">
                {isLoadingPositions ? (
                  <>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={`skeleton-${index}`} className="meme-portfolio-oc-item trader-portfolio-skeleton-item">
                        <div className="meme-oc-cell">
                          <div className="oc-meme-wallet-info">
                            <div className="meme-portfolio-token-info">
                              <div className="meme-portfolio-token-icon-container">
                                <div className="meme-portfolio-token-icon trader-portfolio-skeleton-icon"></div>
                              </div>
                              <span className="portfolio-meme-wallet-address">
                                <span className="meme-token-symbol-portfolio trader-portfolio-skeleton-text trader-portfolio-skeleton-text-short"></span>
                                <span className="meme-token-name-portfolio trader-portfolio-skeleton-text trader-portfolio-skeleton-text-long"></span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="meme-oc-cell">
                          <div className="meme-trade-info">
                            <div className="meme-ordercenter-info">
                              <div className="trader-portfolio-skeleton-icon-small"></div>
                              <span className="trader-portfolio-skeleton-text trader-portfolio-skeleton-text-medium"></span>
                            </div>
                            <span className="trader-portfolio-skeleton-text trader-portfolio-skeleton-text-short"></span>
                          </div>
                        </div>
                        <div className="meme-oc-cell">
                          <div className="meme-trade-info">
                            <div className="meme-ordercenter-info">
                              <div className="trader-portfolio-skeleton-icon-small"></div>
                              <span className="trader-portfolio-skeleton-text trader-portfolio-skeleton-text-medium"></span>
                            </div>
                            <span className="trader-portfolio-skeleton-text trader-portfolio-skeleton-text-short"></span>
                          </div>
                        </div>
                        <div className="meme-oc-cell">
                          <div className="meme-ordercenter-info">
                            <div className="trader-portfolio-skeleton-icon-small"></div>
                            <span className="trader-portfolio-skeleton-text trader-portfolio-skeleton-text-long"></span>
                          </div>
                        </div>
                        <div className="meme-oc-cell">
                          <div className="trader-portfolio-skeleton-button"></div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : displayedPositions.length === 0 ? (
                  <div className="meme-oc-empty">
                    {searchQuery.trim() 
                      ? 'No positions match your search' 
                      : activeTab === 'active' 
                        ? 'No active positions' 
                        : activeTab === 'history' 
                          ? 'No trading history' 
                          : 'Coming soon'
                    }
                  </div>
                ) : (
                  displayedPositions.map((p) => {
                    const tokenShort = p.symbol || `${p.tokenId.slice(0, 6)}…${p.tokenId.slice(-4)}`;
                    const tokenImageUrl = p.imageUrl || null;

                    return (
                      <div key={p.tokenId} className={`meme-portfolio-oc-item ${activeTab === 'active' ? '' : 'meme-portfolio-oc-item-5-col'}`}>
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
                                <div className={`portfolio-launchpad-indicator`}>
                                  <svg width="10" height="10" viewBox="0 0 32 32" className="header-launchpad-logo" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                      <linearGradient id="nadfun" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#7C55FF" stopOpacity="1" />
                                        <stop offset="100%" stopColor="#AD5FFB" stopOpacity="1" />
                                      </linearGradient>
                                    </defs>
                                    <path fill="url(#nadfun)" d="m29.202 10.664-4.655-3.206-3.206-4.653A6.48 6.48 0 0 0 16.004 0a6.48 6.48 0 0 0-5.337 2.805L7.46 7.458l-4.654 3.206a6.474 6.474 0 0 0 0 10.672l4.654 3.206 3.207 4.653A6.48 6.48 0 0 0 16.004 32a6.5 6.5 0 0 0 5.337-2.805l3.177-4.616 4.684-3.236A6.49 6.49 0 0 0 32 16.007a6.47 6.47 0 0 0-2.806-5.335zm-6.377 5.47c-.467 1.009-1.655.838-2.605 1.06-2.264.528-2.502 6.813-3.05 8.35-.424 1.484-1.916 1.269-2.272 0-.631-1.53-.794-6.961-2.212-7.993-.743-.542-2.502-.267-3.177-.95-.668-.675-.698-1.729-.023-2.412l5.3-5.298a1.734 1.734 0 0 1 2.45 0l5.3 5.298c.505.505.586 1.306.297 1.937z" />
                                  </svg>
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
                        {activeTab === 'active' && (
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
                        )}
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
                                  : '0.0'}
                                %)
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
                                userAddress: traderAddress,
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
                            title="Share PNL"
                          >
                            <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="16" height="16">
                              <path d="M 31.964844 2.0078125 A 2 2 0 0 0 30.589844 2.5898438 L 20.349609 12.820312 A 2.57 2.57 0 0 0 19.910156 13.470703 A 2 2 0 0 0 21.759766 16.240234 L 30 16.240234 L 30 39.779297 A 2 2 0 0 0 34 39.779297 L 34 16.240234 L 42.25 16.240234 A 2 2 0 0 0 43.660156 12.820312 L 33.410156 2.5898438 A 2 2 0 0 0 31.964844 2.0078125 z M 4 21.619141 A 2 2 0 0 0 2 23.619141 L 2 56 A 2 2 0 0 0 4 58 L 60 58 A 2 2 0 0 0 62 56 L 62 23.619141 A 2 2 0 0 0 60 21.619141 L 44.269531 21.619141 A 2 2 0 0 0 44.269531 25.619141 L 58 25.619141 L 58 54 L 6 54 L 6 25.619141 L 19.730469 25.619141 A 2 2 0 0 0 19.730469 21.619141 L 4 21.619141 z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
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
                    <div className="pnl-calendar-total"></div>
                    <button className="pnl-calendar-close" onClick={() => setShowPNLCalendar(false)}>
                      <img src={closebutton} className="close-button-icon" alt="Close" />
                    </button>
                  </div>
                </div>
                <div className="pnl-calendar-gradient-bar">
                  <span className="pnl-calendar-total-label">$0</span>
                  <div className="pnl-calendar-ratio-container">
                    <div className="pnl-calendar-ratio-buy"></div>
                    <div className="pnl-calendar-ratio-sell"></div>
                  </div>
                  <div className="pnl-calendar-gradient-labels">
                    <span><span className="pnl-buy-color">0</span> / <span className="pnl-buy-color">$0</span></span>
                    <span><span className="pnl-sell-color">0</span> / <span className="pnl-sell-color">$0</span></span>
                  </div>
                </div>
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
      </div>

      {showEmojiPicker && emojiPickerPosition && (
        <div
          className="add-wallet-emoji-picker-backdrop"
          onClick={() => {
            setShowEmojiPicker(false);
            setEmojiPickerPosition(null);
          }}
        >
          <div
            className="add-wallet-emoji-picker-positioned"
            onClick={(e) => e.stopPropagation()}
            style={{
              top: `${emojiPickerPosition.top}px`,
              left: `${emojiPickerPosition.left}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiSelect}
              width={350}
              height={400}
              searchDisabled={false}
              skinTonesDisabled={true}
              previewConfig={{
                showPreview: false,
              }}
              style={{
                backgroundColor: '#000000',
                border: '1px solid rgba(179, 184, 249, 0.2)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TraderPortfolioPopup;