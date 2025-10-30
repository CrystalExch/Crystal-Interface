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
import { createPortal } from 'react-dom';
import { formatSubscript } from '../../utils/numberDisplayFormat';

interface SubWallet {
  address: string;
  privateKey: string;
}

interface FooterProps {
  subWallets?: Array<SubWallet>;
  selectedWallets?: Set<string>;
  setSelectedWallets?: (wallets: Set<string>) => void;
  walletTokenBalances?: Record<string, any>;
  activeWalletPrivateKey?: string;
  activeChain?: number;
  monUsdPrice: number;
  // Add these new props for widget control
  isTrackerWidgetOpen?: boolean;
  onToggleTrackerWidget: any;
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
  activeWalletPrivateKey = '',
  activeChain,
  monUsdPrice,
  isTrackerWidgetOpen = false,
  onToggleTrackerWidget,
}) => {
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      const balanceData = walletTokenBalances[address];
      if (!balanceData || !Array.isArray(balanceData)) return 0;

      const nativeToken = balanceData.find(
        (token: any) => token.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      );
      return nativeToken ? parseFloat(nativeToken.balance) : 0;
    },
    [walletTokenBalances],
  );

  const getWalletTokenCount = useCallback(
    (address: string): number => {
      const balanceData = walletTokenBalances[address];
      if (!balanceData || !Array.isArray(balanceData)) return 0;
      return balanceData.filter((token: any) => parseFloat(token.balance) > 0).length;
    },
    [walletTokenBalances],
  );

  const isWalletActive = useCallback(
    (privateKey: string): boolean => {
      return privateKey === activeWalletPrivateKey;
    },
    [activeWalletPrivateKey],
  );

  const getWalletName = (address: string, index: number): string => {
    const savedName = localStorage.getItem(`wallet_name_${address}`);
    return savedName || `Wallet ${index + 1}`;
  };

  const totalSelectedBalance = useMemo(() => {
    return Array.from(selectedWallets).reduce((total, address) => {
      return total + getWalletBalance(address);
    }, 0);
  }, [selectedWallets, getWalletBalance]);

  return (
    <footer className="footer">
      <div className="footer-content-left">
        <div className="footer-left">
          <div className="footer-left-side">
          <div className="footer-preset-button">PRESET 1</div>
            <Tooltip content="Manage Wallets">
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  className="footer-transparent-button"
                  onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
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
                      {selectedWallets.size}/{subWallets.length}
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
                              width: '14px',
                              height: '14px',
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
                              width: '14px',
                              height: '14px',
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

                {isWalletDropdownOpen && (
                  <div className="footer-wallet-dropdown-panel visible">
                    <div className="wallet-dropdown-header">
                      <div className="wallet-dropdown-actions">
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
                      <button
                        className="wallet-dropdown-close"
                        onClick={() => setIsWalletDropdownOpen(false)}
                      >
                        <img
                          src={closebutton}
                          className="wallet-dropdown-close-icon"
                          alt="Close"
                        />
                      </button>
                    </div>

                    <div className="wallet-dropdown-list">
                      {subWallets.length > 0 ? (
                        subWallets.map((wallet, index) => {
                          const balance = getWalletBalance(wallet.address);
                          const isActive = isWalletActive(wallet.privateKey);
                          const isSelected = selectedWallets.has(wallet.address);

                          return (
                            <React.Fragment key={wallet.address}>
                              <div
                                className={`quickbuy-wallet-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
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
                                  <div className="wallet-dropdown-address">
                                    {wallet.address.slice(0, 6)}...
                                    {wallet.address.slice(-4)}
                                  </div>
                                </div>
                                <div className="wallet-dropdown-balance">
                                  <div className="wallet-dropdown-balance-amount">
                                    <img
                                      src={monadicon}
                                      className="wallet-dropdown-mon-icon"
                                      alt="MON"
                                    />
                                    {formatNumberWithCommas(balance, 2)}
                                  </div>
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
                              {subWallets.length === 1 && (
                                <div
                                  className="quickbuy-add-wallet-button"
                                  onClick={() => {
                                    window.location.href = '/portfolio?tab=wallets';
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
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <div className="wallet-dropdown-no-subwallets">
                          <p>No wallets found. Create a wallet to get started.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Tooltip>
            <div className="widget-toggle-buttons">
              <Tooltip content="Wallet Tracker">
                <div className="footer-widget-button">
                  <img src={walleticon} className="footer-widget-icon" />
                  Wallet
                </div>
              </Tooltip>
              <Tooltip content="Twitter Tracker">
                <div 
                  className={`footer-widget-button ${isTrackerWidgetOpen ? 'active' : ''}`}
                  onClick={() => {onToggleTrackerWidget((prev: any) => !prev)}}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={twittericon} className="footer-widget-icon" />
                  Twitter
                </div>
              </Tooltip>
              <Tooltip content="Discover Tracker">
                <div className="footer-widget-button">
                  <img src={discovericon} className="footer-widget-icon" />
                  Discover
                </div>
              </Tooltip>
              <Tooltip content="Spectra Tracker">
                <div className="footer-widget-button">
                  <img src={prismicon} className="footer-widget-icon" />
                  Spectra
                </div>
              </Tooltip>
              <Tooltip content="PnL Tracker">
                <div className="footer-widget-button">
                  <img src={charticon} className="footer-widget-icon" />
                  PnL
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
        <div className="footer-right"></div>
      </div>
    </footer>
  );
};

export default Footer;