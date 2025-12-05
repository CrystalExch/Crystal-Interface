import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Wallet, Bell } from 'lucide-react';
import './Footer.css';
import OnlineStatus from './OnlineStatus/OnlineStatus';
import SocialLinks from './SocialLinks/SocialLinks';
import { settings } from '../../settings';

import walleticon from '../../assets/wallet_icon.svg';
import monadicon from '../../assets/monadlogo.svg';
import closebutton from '../../assets/close_button.png';
import twittericon from '../../assets/twitter.png';
import prismicon from '../../assets/prism.png';
import discovericon from '../../assets/compass.png';
import charticon from '../../assets/chart-column.png';
import crystallogo from '../../assets/crystalwhite.png';
import twitter from '../../assets/twitter.png';
import discord from '../../assets/Discord.svg'
import docs from '../../assets/docs.png';
import { createPortal } from 'react-dom';
import { formatSubscript } from '../../utils/numberDisplayFormat';
import {
  showLoadingPopup,
  updatePopup,
} from '../MemeTransactionPopup/MemeTransactionPopupManager';
interface SubWallet {
  address: string;
  privateKey: string;
}

interface FooterProps {
  subWallets?: Array<SubWallet>;
  selectedWallets?: Set<string>;
  setSelectedWallets?: (wallets: Set<string>) => void;
  walletTokenBalances?: Record<string, any>;
  address: string;
  activeChain: number;
  monUsdPrice: number;
  isTrackerWidgetOpen?: boolean;
  onToggleTrackerWidget: any;
  isSpectraWidgetOpen?: boolean;
  onToggleSpectraWidget?: any;
  isPNLWidgetOpen?: boolean;
  onTogglePNLWidget?: any;
  isWalletTrackerWidgetOpen?: boolean;
  onToggleWalletTrackerWidget?: any;
  setpopup: (value: number) => void;
  createSubWallet: any;
  activeWalletPrivateKey: string;
  setOneCTDepositAddress: any;
}

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
        top = rect.top + scrollY - tooltipRect.height - 10;
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
      {shouldRender &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`tooltip tooltip-${position} ${isVisible ? 'tooltip-entering' : isLeaving ? 'tooltip-leaving' : ''}`}
            style={{
              position: 'absolute',
              top: `${tooltipPosition.top - 20}px`,
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

const Footer: React.FC<FooterProps> = ({
  subWallets = [],
  selectedWallets = new Set(),
  setSelectedWallets,
  walletTokenBalances = {},
  address,
  activeChain,
  monUsdPrice,
  isTrackerWidgetOpen = false,
  onToggleTrackerWidget,
  isSpectraWidgetOpen = false,
  onToggleSpectraWidget,
  isPNLWidgetOpen = false,
  onTogglePNLWidget,
  isWalletTrackerWidgetOpen = false,
  onToggleWalletTrackerWidget,
  setpopup,
  createSubWallet,
  activeWalletPrivateKey,
  setOneCTDepositAddress
}) => {
  const isWalletActive = (privateKey: string) => {
    return activeWalletPrivateKey === privateKey;
  };
  const userAddr = address;

  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [isDiscoverPopupOpen, setIsDiscoverPopupOpen] = useState(false);
  const [discoverActiveTab, setDiscoverActiveTab] = useState<'trending' | 'dex' | 'surge' | 'live' | 'p1'>('surge');
  const [discoverActiveFilter, setDiscoverActiveFilter] = useState<'early' | 'surging'>('early');
  const dropdownRef = useRef<HTMLDivElement>(null);
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
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWalletDropdownOpen(false);
      }
    };

    if (isWalletDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isWalletDropdownOpen]);

  const formatNumberWithCommas = (value: number, decimals: number = 2): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

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

  const selectAllWallets = useCallback(() => {
    if (!setSelectedWallets) return;
    const allAddresses = new Set(subWallets.map((w) => w.address));
    setSelectedWallets(allAddresses);
  }, [subWallets, setSelectedWallets]);

  const unselectAllWallets = useCallback(() => {
    if (!setSelectedWallets) return;
    setSelectedWallets(new Set());
  }, [setSelectedWallets]);

  const selectAllWithBalance = useCallback(() => {
    if (!setSelectedWallets) return;
    const walletsWithBalance = subWallets
      .filter((wallet) => {
        const balance = getWalletBalance(wallet.address);
        return balance > 0;
      })
      .map((w) => w.address);
    setSelectedWallets(new Set(walletsWithBalance));
  }, [subWallets, setSelectedWallets]);

  const getWalletBalance = useCallback(
    (address: string): number => {
      const balances = walletTokenBalances[address];
      if (!balances) return 0;

      const ethAddress = settings.chainConfig[activeChain]?.eth;
      if (!ethAddress) return 0;

      const balance = balances[ethAddress];
      if (!balance) return 0;

      return Number(balance) / 10 ** 18;
    },
    [walletTokenBalances, activeChain],
  );

  const getWalletTokenCount = useCallback(
    (address: string): number => {
      const balanceData = walletTokenBalances[address];
      if (!balanceData || !Array.isArray(balanceData)) return 0;
      return balanceData.filter((token: any) => parseFloat(token.balance) > 0).length;
    },
    [walletTokenBalances],
  );

  const getWalletName = (address: string, index: number): string => {
    const savedName = localStorage.getItem(`wallet_name_${address}`);
    return savedName || `Wallet ${index + 1}`;
  };

  const totalSelectedBalance = useMemo(() => {
    if (selectedWallets.size == 0 || !activeWalletPrivateKey) {
      return (Number(walletTokenBalances?.[userAddr]?.[settings.chainConfig[activechain]?.eth] ?? 0) / 10 ** Number(18))
    }
    return Array.from(selectedWallets).reduce((total, w) => {
      return total + getWalletBalance(w);
    }, 0);
  }, [selectedWallets, getWalletBalance]);

  return (
    <footer className="footer">
      <div className="footer-content-left">
        <div className="footer-left">
          <div className="footer-left-side">
            <Tooltip content="Manage Presets">
              <div
                className="footer-preset-button"
                onClick={() => setpopup(37)}
                style={{ cursor: 'pointer' }}
              >
                PRESET 1
              </div>
            </Tooltip>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                className="footer-transparent-button"
                onClick={() => {
                  if (!address) {
                    setpopup(4);
                  } else {
                    setIsWalletDropdownOpen(!isWalletDropdownOpen);
                  }
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    width: '100%',
                  }}
                >
                  <img
                    src={walleticon}
                    style={{
                      width: '14px',
                      height: '14px',
                      opacity: 0.5
                    }}
                    alt="Wallet"
                  />
                  {selectedWallets.size == 0 || !activeWalletPrivateKey ?
                    <Tooltip content="Primary Wallet">
                      {(
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d8dcff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                          <path d="M4 20a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
                          <path d="m12.474 5.943 1.567 5.34a1 1 0 0 0 1.75.328l2.616-3.402" />
                          <path d="m20 9-3 9" />
                          <path d="m5.594 8.209 2.615 3.403a1 1 0 0 0 1.75-.329l1.567-5.34" />
                          <path d="M7 18 4 9" />
                          <circle cx="12" cy="4" r="2" />
                          <circle cx="20" cy="7" r="2" />
                          <circle cx="4" cy="7" r="2" />
                        </svg>
                      )}
                    </Tooltip> :
                    <span style={{ fontSize: '0.85rem', fontWeight: '300' }}>
                      {selectedWallets.size}
                    </span>
                  }
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: '300',
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: '4px',
                      color:"#e3e5f4"
                    }}
                  >
                    {totalSelectedBalance > 0 ? (
                      <>
                        <img
                          src={monadicon}
                          className="wallet-dropdown-mon-icon"
                          style={{
                            width: '13px',
                            height: '13px',
                            marginRight: '4px',
                          }}
                          alt="MON"
                        />
                        <span>
                          {formatBalanceCompact(totalSelectedBalance)}
                        </span>
                      </>
                    ) : (
                      <>
                        <img
                          src={monadicon}
                          className="wallet-dropdown-mon-icon"
                          style={{
                            width: '13px',
                            height: '13px',
                            marginRight: '4px',
                          }}
                          alt="MON"
                        />
                        <span>0</span>
                      </>
                    )}
                  </span>
                  <svg
                    className={`footer-wallet-dropdown-arrow ${isWalletDropdownOpen ? 'open' : ''}`}
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

              <div className={`footer-wallet-dropdown-panel ${isWalletDropdownOpen ? 'visible' : ''}`}>
                {subWallets.length > 0 && activeWalletPrivateKey && (
                  <div className="footer-wallet-dropdown-header">
                    <div className="footer-wallet-dropdown-actions">
                      <button
                        className="wallet-action-btn"
                        onClick={
                          selectedWallets.size === subWallets.length
                            ? unselectAllWallets
                            : selectAllWallets
                        }
                      >
                        {selectedWallets.size === subWallets.length
                          ? 'Unselect All'
                          : 'Select All'}
                      </button>
                      <button
                        className="wallet-action-btn"
                        onClick={selectAllWithBalance}
                      >
                        Select All with Balance
                      </button>
                    </div>
                  </div>
                )}

                <div className="wallet-dropdown-list" >
                  <div>
                    {(!activeWalletPrivateKey ? [] : subWallets).map((wallet, index) => {
                      const balance = getWalletBalance(wallet.address);
                      const isSelected = selectedWallets.has(wallet.address);
                      const isActive = isWalletActive(wallet.privateKey);
                      return (
                        <React.Fragment key={wallet.address}>
                          <div
                            key={wallet.address}
                            className={`footer-wallet-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() =>
                              toggleWalletSelection(wallet.address)
                            }
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
                                {isActive && (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', verticalAlign: 'middle' }}>
                                    <path d="M4 20a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
                                    <path d="m12.474 5.943 1.567 5.34a1 1 0 0 0 1.75.328l2.616-3.402" />
                                    <path d="m20 9-3 9" />
                                    <path d="m5.594 8.209 2.615 3.403a1 1 0 0 0 1.75-.329l1.567-5.34" />
                                    <path d="M7 18 4 9" />
                                    <circle cx="12" cy="4" r="2" />
                                    <circle cx="20" cy="7" r="2" />
                                    <circle cx="4" cy="7" r="2" />
                                  </svg>
                                )}
                              </div>
                              <div
                                className="wallet-dropdown-address"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(wallet.address, 'Wallet address copied');
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                {wallet.address.slice(0, 6)}...
                                {wallet.address.slice(-4)}
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
                                const gasReserve = BigInt(settings.chainConfig[activeChain].gasamount ?? 0);
                                const balanceWei = walletTokenBalances[wallet.address]?.[
                                  settings.chainConfig[activeChain]?.eth
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
                        </React.Fragment>
                      );
                    })}
                    {(subWallets.length < 10 || !activeWalletPrivateKey) && (
                      <div
                        className="quickbuy-add-wallet-button"
                        onClick={async () => {
                          let isSuccess = await createSubWallet(true, !activeWalletPrivateKey);
                          if (isSuccess) {
                            setOneCTDepositAddress(isSuccess);
                            setpopup(25);
                          }
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span>{!activeWalletPrivateKey ? 'Enable 1CT' : 'Add Wallet'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
            <div className="widget-toggle-buttons">
              <Tooltip content="Wallet Tracker">
                <div
                  className={`footer-widget-button ${isWalletTrackerWidgetOpen ? 'active' : ''}`}
                  onClick={() => onToggleWalletTrackerWidget?.(!isWalletTrackerWidgetOpen)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={walleticon} className="footer-widget-icon" />
                  Wallet
                </div>
              </Tooltip>
              <Tooltip content="Spectra Explorer">
                <div
                  className={`footer-widget-button ${isSpectraWidgetOpen ? 'active' : ''}`}
                  onClick={() => onToggleSpectraWidget?.(!isSpectraWidgetOpen)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={prismicon} className="footer-widget-icon" />
                  Spectra
                </div>
              </Tooltip>
              <Tooltip content="Coming Soon!">
                <div
                  className={`footer-widget-button ${isPNLWidgetOpen ? 'active' : ''}`}
                  // onClick={() => onTogglePNLWidget?.(!isPNLWidgetOpen)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={charticon} className="footer-widget-icon" />
                  PnL
                </div>
              </Tooltip>
              <Tooltip content="Coming Soon!">
                <div
                  className={`footer-widget-button ${isTrackerWidgetOpen ? 'active' : ''}`}
                  // onClick={() => onToggleTrackerWidget(!isTrackerWidgetOpen)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={twittericon} className="footer-widget-icon" />
                  Twitter
                </div>
              </Tooltip>
              <Tooltip content="Coming Soon!">
                <div
                  className="footer-widget-button"
                  style={{ cursor: 'pointer' }}
                >
                  <img src={discovericon} className="footer-widget-icon" />
                  Discover
                </div>
              </Tooltip>
            </div>
            <Tooltip content="Current MON Price">
              <div className="crystal-migration-mc">
                <img src={monadicon} className="footer-monad-logo" />
                <span>${formatNumberWithCommas(monUsdPrice, 5)}</span>
              </div>
            </Tooltip>
            <Tooltip content="nad.fun Migration Price">
              <div className="crystal-migration-mc">
                <svg width="13" height="13" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="nadfun" x1="0%" y1="0%" x2="100%" y2="0%">

                    </linearGradient>
                  </defs>
                  <path fill="white" d="m29.202 10.664-4.655-3.206-3.206-4.653A6.48 6.48 0 0 0 16.004 0a6.48 6.48 0 0 0-5.337 2.805L7.46 7.458l-4.654 3.206a6.474 6.474 0 0 0 0 10.672l4.654 3.206 3.207 4.653A6.48 6.48 0 0 0 16.004 32a6.5 6.5 0 0 0 5.337-2.805l3.177-4.616 4.684-3.236A6.49 6.49 0 0 0 32 16.007a6.47 6.47 0 0 0-2.806-5.335zm-6.377 5.47c-.467 1.009-1.655.838-2.605 1.06-2.264.528-2.502 6.813-3.05 8.35-.424 1.484-1.916 1.269-2.272 0-.631-1.53-.794-6.961-2.212-7.993-.743-.542-2.502-.267-3.177-.95-.668-.675-.698-1.729-.023-2.412l5.3-5.298a1.734 1.734 0 0 1 2.45 0l5.3 5.298c.505.505.586 1.306.297 1.937z" />
                </svg>
                <span>${formatNumberWithCommas(monUsdPrice * 1296000)}</span>
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
      <div className="footer-content-right">
        <Tooltip content="Notification Settings">
          <Bell className="footer-icon" size={18} style={{ marginRight: '8px', cursor: 'pointer' }} onClick={() => setpopup(38)} />
        </Tooltip>
        <div className="footer-right">
          <Tooltip content="Docs">
            <a
              href="https://docs.crystal.exchange"
              target="_blank"
              rel="noreferrer"
              className="footer-docs-icon"
            >
              <img className="footer-icon" src={docs} />
              Docs
            </a>
          </Tooltip>
        </div>
      </div>
    </footer>
  );
};

export default Footer;