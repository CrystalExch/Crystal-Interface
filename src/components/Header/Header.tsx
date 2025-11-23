import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import LanguageSelector from './LanguageSelector/LanguageSelector';
import SideMenuOverlay from './SideMenuOverlay/SideMenuOverlay';
import TransactionHistoryMenu from '../TransactionHistoryMenu/TransactionHistoryMenu';
import ChartHeader from '../Header/ChartHeader/ChartHeader';
import MemeSearch from '../MemeSearch/MemeSearch';
import { formatCommas, formatSubscript } from '../../utils/numberDisplayFormat';
import { useNavigate } from 'react-router-dom';
import { encodeFunctionData } from 'viem';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi';
import { settings } from '../../settings';
import { showLoadingPopup, updatePopup } from '../MemeTransactionPopup/MemeTransactionPopupManager';
import CopyButton from '../CopyButton/CopyButton';

import settingsicon from '../../assets/settings.svg';
import walleticon from '../../assets/wallet_icon.svg';
import historyIcon from '../../assets/notification.svg';
import monadicon from '../../assets/monadlogo.svg';
import closebutton from '../../assets/close_button.png';
import iconusdc from '../../assets/iconusdc.png';
import edgeX from '../../assets/edgeX.svg';
import swapicon from '../../assets/swap_icon.png';
import './Header.css';
import { createPortal } from 'react-dom';

interface Language {
  code: string;
  name: string;
}

interface HeaderProps {
  setTokenIn: (token: string) => void;
  setTokenOut: (token: string) => void;
  tokenIn: string;
  setorders: (orders: any[]) => void;
  settradehistory: (history: any[]) => void;
  settradesByMarket: (trades: Record<string, any[]>) => void;
  setcanceledorders: (orders: any[]) => void;
  setpopup: (value: number) => void;
  setChain: any;
  account: {
    connected: boolean;
    address?: string;
    chainId?: number;
  };
  activechain: number;
  setShowTrade: (value: boolean) => void;
  simpleView: boolean;
  setSimpleView: (value: boolean) => void;
  tokendict: any;
  transactions?: any[];
  activeMarket?: any;
  orderdata?: any;
  onMarketSelect?: any;
  marketsData?: any;
  isChartLoading?: boolean;
  tradesloading?: boolean;
  tradesByMarket: any;
  currentWalletIcon?: string;
  subWallets?: Array<{ address: string, privateKey: string }>;
  onToggleWalletSelected?: (address: string) => void;
  walletTokenBalances?: { [address: string]: any };
  activeWalletPrivateKey?: string;
  setOneCTSigner: (privateKey: string) => void;
  refetch: () => void;
  isBlurred?: boolean;
  terminalRefetch?: () => void;
  tokenList?: any[];
  logout: () => void;
  tokenBalances: { [address: string]: bigint };
  lastRefGroupFetch: any;
  tokenData?: any;
  monUsdPrice: number;
  sendUserOperationAsync?: any;
  setTokenData?: (data: any) => void;
  quickAmounts?: { [key: string]: string };
  setQuickAmount?: (category: string, amount: string) => void;
  activePresets?: { [key: string]: number };
  setActivePreset?: (category: string, preset: number) => void;
  handleInputFocus?: () => void;
  buyPresets?: { [key: number]: { slippage: string; priority: string; amount: string } };
  sellPresets?: { [key: number]: { slippage: string; priority: string } };
  perpsActiveMarketKey: any;
  setperpsActiveMarketKey: (data: any) => void;
  perpsMarketsData: any;
  perpsFilterOptions: any;
  externalUserStats?: {
    balance: number;
    amountBought: number;
    amountSold: number;
    valueBought: number;
    valueSold: number;
    valueNet: number;
  };
  lastNonceGroupFetch: any;
  scaAddress: any;
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
        top = rect.top + scrollY - tooltipRect.height - 25;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollY + 10;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2 - 32;
        left = rect.left + scrollX - tooltipRect.width - 90;
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

const Header: React.FC<HeaderProps> = ({
  setTokenIn,
  setTokenOut,
  setorders,
  settradehistory,
  settradesByMarket,
  setcanceledorders,
  setpopup,
  setChain,
  account,
  activechain,
  setShowTrade,
  simpleView,
  setSimpleView,
  tokendict,
  transactions,
  activeMarket,
  orderdata,
  onMarketSelect,
  marketsData,
  tradesByMarket,
  currentWalletIcon,
  subWallets = [],
  walletTokenBalances = {},
  activeWalletPrivateKey,
  onToggleWalletSelected,
  setOneCTSigner,
  refetch,
  isBlurred = false,
  terminalRefetch,
  tokenList = [],
  logout,
  lastRefGroupFetch,
  tokenData,
  monUsdPrice,
  sendUserOperationAsync,
  setTokenData,
  quickAmounts,
  setQuickAmount,
  activePresets,
  setActivePreset,
  handleInputFocus,
  buyPresets,
  sellPresets,
  perpsActiveMarketKey,
  setperpsActiveMarketKey,
  perpsMarketsData,
  perpsFilterOptions,
  externalUserStats,
  lastNonceGroupFetch,
  scaAddress
}) => {
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
  const location = useLocation();
  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false);
  const navigate = useNavigate();
  const [isHeaderSubwalletsOpen, setIsHeaderSubwalletsOpen] = useState(true);

  const handleTokenClick = (token: any) => {
    if (setTokenData) {
      setTokenData(token);
    }
    navigate(`/meme/${token.tokenAddress}`);
    setIsMemeSearchOpen(false);
  };

  const handleQuickBuy = useCallback(async (token: any, amt: string) => {
    const val = BigInt(amt || '0') * 10n ** 18n;
    if (val === 0n) return;

    const routerAddress = settings.chainConfig[activechain]?.launchpadRouter?.toLowerCase();
    if (!routerAddress) {
      console.error('Router address not found');
      return;
    }

    const txId = `quickbuy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      if (showLoadingPopup) {
        showLoadingPopup(txId, {
          title: 'Sending transaction...',
          subtitle: `${amt} MON worth of ${token.symbol}`,
          amount: amt,
          amountUnit: 'MON',
          tokenImage: token.image
        });
      }

      const uo = {
        target: routerAddress,
        data: encodeFunctionData({
          abi: CrystalRouterAbi,
          functionName: 'buy',
          args: [true, token.tokenAddress as `0x${string}`, val, 0n]
        }),
        value: val,
      };

      if (updatePopup) {
        updatePopup(txId, {
          title: 'Confirming transaction...',
          subtitle: `${amt} MON worth of ${token.symbol}`,
          variant: 'info',
          tokenImage: token.image
        });
      }

      await sendUserOperationAsync({ uo });

      if (terminalRefetch) {
        terminalRefetch();
      }

      if (updatePopup) {
        updatePopup(txId, {
          title: 'Quick Buy Complete',
          subtitle: `Successfully bought ${token.symbol} with ${amt} MON`,
          variant: 'success',
          confirmed: true,
          isLoading: false,
          tokenImage: token.image
        });
      }
    } catch (e: any) {
      console.error('Quick buy failed', e);
      const msg = String(e?.message ?? '');
      if (updatePopup) {
        updatePopup(txId, {
          title: msg.toLowerCase().includes('insufficient') ? 'Insufficient Balance' : 'Quick Buy Failed',
          subtitle: msg || 'Please try again.',
          variant: 'error',
          confirmed: true,
          isLoading: false,
          tokenImage: token.image
        });
      }
    }
  }, [sendUserOperationAsync, activechain, terminalRefetch]);

  const [pendingNotifs, setPendingNotifs] = useState(0);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [walletNames, setWalletNames] = useState<{ [address: string]: string }>({});
  const walletDropdownRef = useRef<HTMLDivElement>(null);

  const languageOptions: Language[] = [
    { code: 'EN', name: 'English' },
    { code: 'ES', name: 'Español' },
    { code: 'CN', name: '中文（简体）' },
    { code: 'JP', name: '日本語' },
    { code: 'KR', name: '한국어' },
    { code: 'RU', name: 'русский' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'VN', name: 'Tiếng Việt' },
    { code: 'PH', name: 'Filipino' },
  ];

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState<boolean>(false);
  const backgroundlesslogo = '/CrystalLogo.png';

  const isMemeTokenPage = location.pathname.startsWith('/meme/');

  useEffect(() => {
    const storedWalletNames = localStorage.getItem('crystal_wallet_names');
    if (storedWalletNames) {
      try {
        setWalletNames(JSON.parse(storedWalletNames));
      } catch (error) {
        console.error('Error loading wallet names:', error);
      }
    }

    const handleWalletNamesUpdate = (event: CustomEvent) => {
      setWalletNames(event.detail);
    };

    window.addEventListener('walletNamesUpdated', handleWalletNamesUpdate as EventListener);

    return () => {
      window.removeEventListener('walletNamesUpdated', handleWalletNamesUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isPopupClick = target.closest('.blur-background-popups') || target.closest('.popup-content');

      if (!isPopupClick && walletDropdownRef.current && !walletDropdownRef.current.contains(event.target as Node)) {
        setIsWalletDropdownOpen(false);
      }
    };

    if (isWalletDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isWalletDropdownOpen]);

  const [isMemeSearchOpen, setIsMemeSearchOpen] = useState(false);
  const memeTokenData = isMemeTokenPage && tokenData ? tokenData : undefined;
  const isPerpsRoute = location.pathname.startsWith('/perps')
  const currentperpsActiveMarketKey = isPerpsRoute ? perpsActiveMarketKey : undefined;

  const formatNumberWithCommas = (num: number, decimals = 2) => {
    if (num === 0) return "0";
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    if (num >= 1) return num.toLocaleString("en-US", { maximumFractionDigits: decimals });
    return num.toFixed(Math.min(decimals, 8));
  };
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
  const getWalletBalance = (address: string) => {
    const balances = walletTokenBalances[address];
    if (!balances || !tokenList.length) return 0;

    const ethToken = tokenList.find(t => t.address === settings.chainConfig[activechain]?.eth);
    if (ethToken && balances[ethToken.address]) {
      return Number(balances[ethToken.address]) / 10 ** Number(ethToken.decimals);
    }
    return 0;
  };

  const getWalletName = (address: string, index: number) => {
    return walletNames[address] || `Wallet ${index + 1}`;
  };

  const isWalletActive = (privateKey: string) => {
    return activeWalletPrivateKey === privateKey;
  };

  const handleSetActiveWallet = (privateKey: string) => {
    if (!isWalletActive(privateKey)) {
      localStorage.setItem('crystal_active_wallet_private_key', privateKey);
      setOneCTSigner(privateKey);
      lastRefGroupFetch.current = 0;
      lastNonceGroupFetch.current = 0;
      setTimeout(() => refetch(), 0);
      if (terminalRefetch) {
        setTimeout(() => terminalRefetch(), 0);
      }
    }
    else {
      localStorage.removeItem('crystal_active_wallet_private_key');
      setOneCTSigner('')
      lastRefGroupFetch.current = 0;
      lastNonceGroupFetch.current = 0;
      setTimeout(() => refetch(), 0);
    }
  };

  const handleLogout = () => {
    if (setOneCTSigner) {
      setOneCTSigner('');
      localStorage.removeItem('crystal_active_wallet_private_key');
    }
    if (logout) {
      logout();
    }

    setIsWalletDropdownOpen(false);
  };

  const handleOpenPortfolio = () => {
    setpopup(4);
  };

  const getCurrentWalletInfo = () => {
    if (!activeWalletPrivateKey) return null;
    return subWallets.find(w => w.privateKey === activeWalletPrivateKey);
  };

  const handleWalletButtonClick = () => {
    if (!account.connected) {
      setpopup(4);
    } else if (account.chainId !== activechain) {
      setChain();
    } else {
      setIsWalletDropdownOpen(!isWalletDropdownOpen);
    }
  };

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = !isMenuOpen ? 'hidden' : 'auto';
  };

  const isTradeRoute = ['/swap', '/limit', '/send', '/scale', '/market'].includes(location.pathname);

  const rightHeaderClass = isTradeRoute && !simpleView ? 'right-header-trade' : 'right-header';
  const marketHeader = marketsData?.find(
    (market: any) => market?.address === activeMarket?.address
  );

  const currentWallet = getCurrentWalletInfo();
  const displayAddress = currentWallet ? currentWallet.address : account.address;

  return (
    <>
      <header className="app-header">
        <div className="mobile-left-header">
          <div className="extitle">
            <img src={backgroundlesslogo} className="extitle-logo" />
            <span className="crystal-name">CRYSTAL</span>
          </div>
        </div>
        <div className="left-header">
          <ChartHeader
            in_icon={tokendict[activeMarket.baseAddress].image}
            out_icon={tokendict[activeMarket.quoteAddress].image}
            price={isMemeTokenPage && memeTokenData ?
              (memeTokenData.price || 0.000001)?.toString() || 'N/A' :
              formatSubscript(marketHeader?.currentPrice) || 'N/A'
            }
            priceChangeAmount={isMemeTokenPage && memeTokenData ?
              memeTokenData.change24h?.toString() || 'N/A' :
              formatSubscript(marketHeader?.priceChangeAmount) || 'N/A'
            }
            priceChangePercent={isMemeTokenPage && memeTokenData ?
              `${memeTokenData.change24h >= 0 ? '+' : ''}${memeTokenData.change24h.toFixed(2)}` :
              marketHeader?.priceChange || 'N/A'
            }
            activeMarket={activeMarket}
            high24h={formatSubscript(marketHeader?.high24h) || 'N/A'}
            low24h={formatSubscript(marketHeader?.low24h) || 'N/A'}
            volume={isMemeTokenPage && memeTokenData ?
              memeTokenData.volume24h?.toString() || 'N/A' :
              marketHeader?.volume || 'N/A'
            }
            orderdata={orderdata || {}}
            tokendict={tokendict}
            onMarketSelect={onMarketSelect}
            setpopup={setpopup}
            marketsData={marketsData}
            simpleView={simpleView}
            tradesByMarket={tradesByMarket}
            isMemeToken={isMemeTokenPage}
            memeTokenData={memeTokenData}
            isPerpsToken={isPerpsRoute}
            perpsActiveMarketKey={currentperpsActiveMarketKey}
            perpsMarketsData={perpsMarketsData}
            perpsFilterOptions={perpsFilterOptions}
            monUsdPrice={monUsdPrice}
            showLoadingPopup={showLoadingPopup}
            updatePopup={updatePopup}
            setperpsActiveMarketKey={setperpsActiveMarketKey}
            externalUserStats={externalUserStats}
          />
        </div>
        <div className={rightHeaderClass}>
          {/* <button
            type="button"
            className="meme-search-button"
            onClick={() => setIsMemeSearchOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="meme-button-search-icon"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>
            Search by token or CA...
            <span className="meme-search-keybind">/</span>

          </button> */}
          <button
            type="button"
            className="history-button"
            onClick={() => setIsTransactionHistoryOpen(true)}
          >
            <img src={historyIcon} className="history-icon" />
            {pendingNotifs > 0 && (
              <span className="tx-notification-badge">{pendingNotifs}</span>
            )}
            {pendingNotifs > 99 && (
              <span className="tx-notification-badge">99+</span>
            )}
          </button>
          <div>
            <button
              type="button"
              className="app-settings-button"
              onClick={() => {
                setpopup(5);
              }}
            >
              <img
                className="other-settings-image"
                src={settingsicon}
              />
            </button>
            {isLanguageDropdownOpen && (
              <LanguageSelector
                languages={languageOptions}
                isLanguageDropdownOpen={isLanguageDropdownOpen}
                setIsLanguageDropdownOpen={setIsLanguageDropdownOpen}
                isHeader={true}
              />
            )}
            {/* <MemeSearch
              isOpen={isMemeSearchOpen}
              onClose={() => setIsMemeSearchOpen(false)}
              monUsdPrice={monUsdPrice}
              onTokenClick={handleTokenClick}
              onQuickBuy={handleQuickBuy}
              sendUserOperationAsync={sendUserOperationAsync}
              quickAmounts={quickAmounts}
              setQuickAmount={setQuickAmount}
              activePresets={activePresets}
              setActivePreset={setActivePreset}
              handleInputFocus={handleInputFocus}
              buyPresets={buyPresets}
              marketsData={marketsData}
              tokendict={tokendict}
              onMarketSelect={onMarketSelect}
            /> */}
          </div>

          <div className="wallet-dropdown-container" ref={walletDropdownRef}>
            <button
              type="button"
              className={account.connected ? 'transparent-button wallet-dropdown-button' : 'connect-button'}
              onClick={handleWalletButtonClick}
            >
              <div className="connect-content">
                {!account.connected ? (
                  'Connect Wallet'
                ) : (
                  <span className="transparent-button-container">
                    <img
                      src={walleticon}
                      className="img-wallet-icon"
                    />
                    <span className={`wallet-count ${subWallets.length ? 'has-active' : ''}`}>
                      {subWallets.length}
                    </span>
                    <span className="wallet-separator"></span>
                    <img
                      src={currentWalletIcon || walleticon}
                      className="wallet-icon"
                    />
                    <span className="subwallet-total-balance">
                      {displayAddress ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}` : 'No Address'}
                    </span>
                    <svg
                      className={`wallet-dropdown-arrow ${isWalletDropdownOpen ? 'open' : ''}`}
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
                )}
              </div>
            </button>
            {account.connected && (
              <div className={`wallet-dropdown-panel ${isWalletDropdownOpen ? 'visible' : ''}`}>
                <div className="wallet-dropdown-header">
                  <div className="wallet-dropdown-header-left-side">
                    <span className="wallet-dropdown-title">Total Value</span>
                    <span className="wallet-dropdown-value">
                      ${formatNumberWithCommas(
                        subWallets.reduce((total, wallet) =>
                          total + (getWalletBalance(wallet.address) * monUsdPrice),
                          0
                        ) + getWalletBalance(scaAddress) * monUsdPrice, 2)}
                    </span>
                  </div>
                        <div className="header-wallet-dropdown-address"              
                                   onClick={(e) => {
                                      e.stopPropagation();
                                      if (displayAddress) {
                                        copyToClipboard(displayAddress, 'Wallet address copied');
                                      }
                                    }}
                                    style={{ cursor: 'pointer' }}>
                                    {displayAddress ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}` : 'No Address'} 
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

            
                <div className="header-actions-container">
                  <div className="header-action-row">
                    <button className="header-action-item"
                      onClick={() => {
                        setpopup(12);
                      }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="header-action-icon"><path d="M12 17V3" /><path d="m6 11 6 6 6-6" /><path d="M19 21H5" /></svg>
                      Deposit
                    </button>
                    <button className="header-action-item"
                      onClick={() => {
                        setpopup(3);
                      }}>

                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="header-action-icon"><path d="m18 9-6-6-6 6" /><path d="M12 3v14" /><path d="M5 21h14" /></svg>
                      Withdraw
                    </button>
                    <button className="header-action-item" onClick={() => {
                      navigate('/swap');
                      setIsWalletDropdownOpen(false);
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="header-action-icon"><path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" /></svg>
                      Swap
                    </button>
                  </div>
                  <div className="header-action-row">
                    <button className="header-action-item" onClick={() => {
                      navigate('/portfolio?tab=wallets');
                      setIsWalletDropdownOpen(false);
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="header-action-icon"><path d="m8 6 4-4 4 4" /><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22" /><path d="m20 22-5-5" /></svg>
                      Consolidate
                    </button>
                    <button className="header-action-item" onClick={() => {
                      navigate('/portfolio?tab=wallets');
                      setIsWalletDropdownOpen(false);
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="header-action-icon"><path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" /><path d="m15 9 6-6" /></svg>
                      Distribute
                    </button>
                    <button className="header-action-item"
                      onClick={() => {
                        setpopup(3);
                      }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="header-action-icon"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /><path d="m21.854 2.147-10.94 10.939" /></svg>                      Transfer
                    </button>
                  </div>
                </div>
                {/*<div className="perps-bridge-button">
                  <div className="perps-bridge-balance-mon">
                    <img src={monadicon} className="perps-bridge-mon-icon" />
                    {formatNumberWithCommas(
                        subWallets.reduce((total, wallet) =>
                          total + (getWalletBalance(wallet.address)),
                          0
                        ), 2)}
                  </div>
                  <img src={swapicon} className="perps-bridge-swap-icon" />
                  <div className="perps-bridge-balance-edge">
                    <div><img src={iconusdc} className="perps-bridge-usdc-icon" /><img src={edgeX} className="perps-bridge-edge-icon" /> </div>
                    0
                  </div>
                      </div> */}
                <div className="wallet-dropdown-actions">
                  <div className="wallet-dropdown-list">
                    {activeWalletPrivateKey ? (
                      <>
                        <div className="header-wallet-dropdown-subwallets-header">
                          <button
                            className="wallet-dropdown-action-btn portfolio-btn"
                            onClick={() => {
                              handleSetActiveWallet(activeWalletPrivateKey || "")
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="wallet-dropdown-action-icon"><path d="M10.513 4.856 13.12 2.17a.5.5 0 0 1 .86.46l-1.377 4.317" /><path d="M15.656 10H20a1 1 0 0 1 .78 1.63l-1.72 1.773" /><path d="M16.273 16.273 10.88 21.83a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14H4a1 1 0 0 1-.78-1.63l4.507-4.643" /><path d="m2 2 20 20" /></svg>
                            Disable 1CT
                          </button>
                          <Tooltip content="Show/Hide Subwallets" position="left">
                            <button
                              className={`open-wallets-dropdown-arrow ${isHeaderSubwalletsOpen ? 'rotated' : ''}`}
                              onClick={() => setIsHeaderSubwalletsOpen(prev => !prev)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="open-subwallets-dropdown-arrow-icon">
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </button>
                          </Tooltip>
                        </div>
                        {isHeaderSubwalletsOpen && (

                          subWallets.map((wallet, index) => {
                            const balance = getWalletBalance(wallet.address);
                            const isActive = isWalletActive(wallet.privateKey);
                            return (
                              <div
                                key={wallet.address}
                                className={`wallet-dropdown-item ${isActive ? 'active' : ''}`}
                                onClick={(e) => {
                                  handleSetActiveWallet(wallet.privateKey)
                                  e.stopPropagation()
                                }}
                              >
                                <div className="wallet-dropdown-checkbox-container">
                                  <input
                                    type="checkbox"
                                    className="quickbuy-wallet-checkbox"
                                    checked={isActive}
                                    readOnly
                                  />
                                </div>

   <div
                                  className="wallet-dropdown-info"
                                >
                                  <div className="wallet-dropdown-name">
                                    {getWalletName(wallet.address, index)}
                                    <Tooltip content="Primary Wallet">
                                    {isActive && (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px', verticalAlign: 'middle' }}>
                                        <path d="M4 20a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>
                                        <path d="m12.474 5.943 1.567 5.34a1 1 0 0 0 1.75.328l2.616-3.402"/>
                                        <path d="m20 9-3 9"/>
                                        <path d="m5.594 8.209 2.615 3.403a1 1 0 0 0 1.75-.329l1.567-5.34"/>
                                        <path d="M7 18 4 9"/>
                                        <circle cx="12" cy="4" r="2"/>
                                        <circle cx="20" cy="7" r="2"/>
                                        <circle cx="4" cy="7" r="2"/>
                                      </svg>
                                    )}
                                    </Tooltip>
                                  </div>
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
                                          className={`wallet-dropdown-balance-amount ${isBlurred ? 'blurred' : ''} ${hasInsufficientGas ? 'insufficient-gas' : ''}`}
                                        >
                                          <img src={monadicon} className="wallet-dropdown-mon-icon" />
                                          {formatNumberWithCommas(balance, 2)}
                                        </div>
                                      </Tooltip>
                                    );
                                  })()}
                                </div>
                                <Tooltip content="Tokens">
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
                                </Tooltip>
                              </div>
                            );
                          })

                        )}
                      </>
                    ) : (
                      <button
                        className="wallet-dropdown-action-btn portfolio-btn"
                        onClick={() => {
                          if (subWallets.length > 0) {
                            handleSetActiveWallet(subWallets[0].privateKey)
                          }
                          else {
                            setpopup(28);
                            setIsWalletDropdownOpen(false);
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="wallet-dropdown-action-icon"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg>
                        Enable 1CT
                      </button>
                    )}
                  </div>
                  <button
                    className="wallet-dropdown-action-btn portfolio-btn"
                    onClick={handleOpenPortfolio}
                  >
                    <img className="wallet-dropdown-action-icon" src={walleticon} />
                    Portfolio
                  </button>
                  <button
                    className="wallet-dropdown-action-btn logout-btn"
                    onClick={handleLogout}
                  >
                    <svg className="wallet-dropdown-action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <SideMenuOverlay
          isMenuOpen={isMenuOpen}
          toggleMenu={toggleMenu}
          backgroundlesslogo={backgroundlesslogo}
          setShowTrade={setShowTrade}
          simpleView={simpleView}
          setSimpleView={setSimpleView}
        />
      )}

      <TransactionHistoryMenu
        isOpen={isTransactionHistoryOpen}
        setIsTransactionHistoryOpen={setIsTransactionHistoryOpen}
        setPendingNotifs={setPendingNotifs}
        transactions={transactions || []}
        tokendict={tokendict}
        walletAddress={account.address}
      />

      {isLanguageDropdownOpen && (
        <LanguageSelector
          isLanguageDropdownOpen={isLanguageDropdownOpen}
          setIsLanguageDropdownOpen={setIsLanguageDropdownOpen}
          isHeader={true}
          languages={[]}
        />
      )}
    </>
  );
};

export default Header;