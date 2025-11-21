import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Wallet } from 'lucide-react';
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
  createSubWallet
}) => {
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
    if (selectedWallets.size == 0) {
      return getWalletBalance(address)
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
              <Tooltip content={subWallets.length == 0 ? "Enable 1CT" : "Manage Wallets"}>
                <button
                  className="footer-transparent-button"
                  onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                  style={{
                    transition: 'all 0.2s ease'
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
                    <span style={{ fontSize: '0.85rem', fontWeight: '300' }}>
                      {selectedWallets.size}
                    </span>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: '300',
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: '4px',
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
                            {formatNumberWithCommas(totalSelectedBalance, 2)}
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
              </Tooltip>

              <div className={`footer-wallet-dropdown-panel ${isWalletDropdownOpen ? 'visible' : ''}`}>
                <div className="footer-wallet-dropdown-header" style={{
                  transition: 'all 0.2s ease'
                }}>
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

                <div className="wallet-dropdown-list" >
                  {true ? (
                    <>
                      <div style={{
                        transition: 'all 0.2s ease'
                      }}>
                        {subWallets.map((wallet, index) => {
                          const balance = getWalletBalance(wallet.address);
                          const isSelected = selectedWallets.has(wallet.address);

                          return (
                            <React.Fragment key={wallet.address}>
                              <div
                                className={`quickbuy-wallet-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => toggleWalletSelection(wallet.address)}
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
                                  <div className="wallet-dropdown-name">
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
                                          {formatNumberWithCommas(balance, 2)}
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
                        {subWallets.length < 10 && (
                          <div
                            className="quickbuy-add-wallet-button"
                            onClick={() => {
                              createSubWallet()
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
                            <span>Add Wallet</span>
                          </div>
                        )}
                      </div>
                      {subWallets.length == 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '12px',
                          zIndex: 10,
                          pointerEvents: 'auto'
                        }}>
                          <button
                            onClick={() => {
                              if (subWallets.length > 0) {
                                setpopup(28);
                              } else {
                                setpopup(28);
                              }
                              setIsWalletDropdownOpen(false);
                            }}
                            className="enable-1ct-button"
                          >
                            Enable 1CT
                          </button>

                        </div>
                      )}
                    </>
                  ) : (
                    <div className="wallet-dropdown-no-subwallets" style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '40px 20px'
                    }}>
                      {subWallets.length == 0 ? (
                        <button
                          onClick={() => {
                            setpopup(28);
                            setIsWalletDropdownOpen(false);
                          }}
                          className="enable-1ct-button"
                        >
                          Enable 1CT and Create Subwallet
                        </button>
                      ) : (
                        <p>No wallets found. Create a wallet to get started.</p>
                      )}
                    </div>
                  )}
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
              <Tooltip content="Spectra Tracker">
                <div
                  className={`footer-widget-button ${isSpectraWidgetOpen ? 'active' : ''}`}
                  onClick={() => onToggleSpectraWidget?.(!isSpectraWidgetOpen)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={prismicon} className="footer-widget-icon" />
                  Spectra
                </div>
              </Tooltip>
              <Tooltip content="PnL Tracker">
                <div
                  className={`footer-widget-button ${isPNLWidgetOpen ? 'active' : ''}`}
                  onClick={() => onTogglePNLWidget?.(!isPNLWidgetOpen)}
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
                <span>${formatNumberWithCommas(monUsdPrice)}</span>
              </div>
            </Tooltip>
            <Tooltip content="crystal.fun Migration Price">
              <div className="crystal-migration-mc">
                <img src={crystallogo} className="footer-crystal-logo" />
                <span>${formatNumberWithCommas(monUsdPrice * 25000)}</span>
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
      <div className="footer-content-right">
        <div className="footer-right">
          <Tooltip content="Discord">
            <img className="footer-icon" src={discord} />
          </Tooltip>
          <Tooltip content="Twitter">
            <img className="footer-icon" src={twitter} />
          </Tooltip>
          <Tooltip content="Docs">
            <div className="footer-docs-icon">
              <img className="footer-icon" src={docs} />
              Docs
            </div>
          </Tooltip>

        </div>
      </div>

      {/* Discover Popup */}
      {isDiscoverPopupOpen && createPortal(
        <>
          <div className="discover-popup-overlay" onClick={() => setIsDiscoverPopupOpen(false)} />
          <div className="discover-popup">
            {/* Header with tabs */}
            <div className="discover-popup-header">
              <div className="discover-tabs">
                <button
                  className={`discover-tab ${discoverActiveTab === 'trending' ? 'active' : ''}`}
                  onClick={() => setDiscoverActiveTab('trending')}
                >
                  Trending
                </button>
                <button
                  className={`discover-tab ${discoverActiveTab === 'dex' ? 'active' : ''}`}
                  onClick={() => setDiscoverActiveTab('dex')}
                >
                  Dex
                </button>
                <button
                  className={`discover-tab ${discoverActiveTab === 'surge' ? 'active' : ''}`}
                  onClick={() => setDiscoverActiveTab('surge')}
                >
                  Surge
                </button>
                <button
                  className={`discover-tab ${discoverActiveTab === 'live' ? 'active' : ''}`}
                  onClick={() => setDiscoverActiveTab('live')}
                >
                  Live
                </button>
                <button
                  className={`discover-tab ${discoverActiveTab === 'p1' ? 'active' : ''}`}
                  onClick={() => setDiscoverActiveTab('p1')}
                >
                  P1
                </button>
              </div>
              <div className="discover-header-right">
                <div className="discover-balance-display">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  0.0
                </div>
                <div className="discover-menu-button">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </div>
                <button className="discover-close-button" onClick={() => setIsDiscoverPopupOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="discover-filters">
              <button
                className={`discover-filter-pill ${discoverActiveFilter === 'early' ? 'active' : ''}`}
                onClick={() => setDiscoverActiveFilter('early')}
              >
                Early
              </button>
              <button
                className={`discover-filter-pill ${discoverActiveFilter === 'surging' ? 'active' : ''}`}
                onClick={() => setDiscoverActiveFilter('surging')}
              >
                Surging
              </button>
              <button className="discover-filter-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </button>
              <button className="discover-filter-minus">−</button>
              <div className="discover-mc-display">50K</div>
              <button className="discover-filter-plus">+</button>
            </div>

            {/* Token List */}
            <div className="discover-token-list">
              {/* Sample token card matching the image */}
              <div className="discover-token-card">
                <div className="discover-token-header">
                  <div className="discover-token-image-container">
                    <div className="discover-token-image">K</div>
                    <div className="discover-launchpad-badge">
                      <img src={crystallogo} style={{ width: '10px', height: '10px' }} />
                    </div>
                  </div>
                  <div className="discover-token-info">
                    <div className="discover-token-name-row">
                      <span className="discover-token-ticker">KIMIK2</span>
                      <span className="discover-token-name">Kimi K2 Thinking</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="discover-copy-icon">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </div>
                    <div className="discover-token-stats-row">
                      <span className="discover-stat-label">MC</span>
                      <span className="discover-stat-value blue">$12.5K</span>
                      <div className="discover-progress-bar">
                        <div className="discover-progress-fill" style={{ width: '60%' }} />
                      </div>
                      <div className="discover-token-price">
                        <span className="discover-price-circle" />
                        <span className="discover-price-value">$15.4K</span>
                        <span className="discover-price-change positive">+22.88%</span>
                      </div>
                    </div>
                    <div className="discover-token-wallet-info">
                      <span className="discover-wallet-address">9w4Z...pump</span>
                      <span className="discover-time-badge">35m</span>
                      <div className="discover-icon-row">
                        <svg width="14" height="14" className="discover-metric-icon"><use href="#icon-users" /></svg>
                        <span>88</span>
                        <svg width="14" height="14" className="discover-metric-icon"><use href="#icon-globe" /></svg>
                        <span>62</span>
                      </div>
                    </div>
                  </div>
                  <div className="discover-token-metrics">
                    <div className="discover-ath-badge">
                      <span className="discover-ath-label">ATH</span>
                      <span className="discover-ath-value">$15.4K 1.23x</span>
                    </div>
                    <div className="discover-volume-row">
                      <span className="discover-volume-label">V</span>
                      <span className="discover-volume-value">$691.7</span>
                      <span className="discover-liquidity-label">L</span>
                      <span className="discover-liquidity-value">$5.92K</span>
                      <svg width="14" height="14" className="discover-metric-icon"><use href="#icon-users" /></svg>
                      <span>188</span>
                      <svg width="14" height="14" className="discover-metric-icon"><use href="#icon-chart" /></svg>
                      <span>62</span>
                    </div>
                  </div>
                  <div className="discover-time-badge-top">2m</div>
                </div>
                <div className="discover-token-footer">
                  <div className="discover-holder-stats">
                    <div className="discover-stat-badge">
                      <svg width="14" height="14" className="discover-icon-red"><use href="#icon-user" /></svg>
                      <span>23%</span>
                    </div>
                    <div className="discover-stat-badge">
                      <svg width="14" height="14" className="discover-icon-green"><use href="#icon-up" /></svg>
                      <span>0%</span>
                    </div>
                    <div className="discover-stat-badge">
                      <svg width="14" height="14" className="discover-icon-orange"><use href="#icon-diamond" /></svg>
                      <span>0%</span>
                    </div>
                    <div className="discover-stat-badge">
                      <svg width="14" height="14" className="discover-icon-teal"><use href="#icon-lock" /></svg>
                      <span>0%</span>
                    </div>
                    <div className="discover-stat-badge">
                      <svg width="14" height="14" className="discover-icon-pink"><use href="#icon-sniper" /></svg>
                      <span>6%</span>
                    </div>
                    <div className="discover-paid-badge">
                      <svg width="14" height="14"><use href="#icon-badge" /></svg>
                      <span>Paid</span>
                    </div>
                  </div>
                  <button className="discover-quick-buy-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </footer>
  );
};

export default Footer;