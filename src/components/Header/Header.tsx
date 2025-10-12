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

import settingsicon from '../../assets/settings.svg';
import walleticon from '../../assets/wallet_icon.png';
import historyIcon from '../../assets/notification.svg';
import monadicon from '../../assets/monadlogo.svg';
import closebutton from '../../assets/close_button.png';

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
  selectedWallets?: Set<string> | string[];
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
  selectedWallets,
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
  lastNonceGroupFetch
}) => {
  const selectedSet = useMemo(() => {
    if (!selectedWallets) return new Set<string>();
    return selectedWallets instanceof Set ? selectedWallets : new Set(selectedWallets);
  }, [selectedWallets]);
  const location = useLocation();
  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false);
  const navigate = useNavigate();

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

  const [liveTokenData, setLiveTokenData] = useState<any>({});

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
    const storedActiveWalletPrivateKey = localStorage.getItem('crystal_active_wallet_private_key');

    if (storedActiveWalletPrivateKey && subWallets.length > 0) {
      const isValidWallet = subWallets.some(wallet => wallet.privateKey === storedActiveWalletPrivateKey);

      if (isValidWallet) {
        if (activeWalletPrivateKey !== storedActiveWalletPrivateKey) {
          setOneCTSigner(storedActiveWalletPrivateKey);
        }
      } else {
        localStorage.removeItem('crystal_active_wallet_private_key');
      }
    }
  }, [subWallets, setOneCTSigner, activeWalletPrivateKey]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target as Node)) {
        setIsWalletDropdownOpen(false);
      }
    };

    if (isWalletDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isWalletDropdownOpen]);

  const [isMemeSearchOpen, setIsMemeSearchOpen] = useState(false);
  const memeTokenData = isMemeTokenPage && tokenData ? (() => {
    const token = tokenData;
    const mergedData = { ...token, ...liveTokenData };
    const currentMarketCap = liveTokenData.marketCap || token.marketCap;

    return {
      symbol: token.symbol,
      name: token.name,
      image: token.image,
      tokenAddress: token.tokenAddress,
      marketCap: currentMarketCap,
      change24h: mergedData.change24h,
      status: token.status,
      created: token.created,
      website: token.website || '',
      twitterHandle: token.twitterHandle || '',
      telegramHandle: token.telegramHandle || '',
      discordHandle: token.discordHandle || '',
      price: liveTokenData.price || token.price,
      buyTransactions: liveTokenData.buyTransactions || token.buyTransactions,
      sellTransactions: liveTokenData.sellTransactions || token.sellTransactions,
      volume24h: liveTokenData.volume24h || token.volume24h,
      graduatedTokens: token.graduatedTokens || 0,
      launchedTokens: token.launchedTokens || 0,
      developerAddress: token.dev,
      reserveQuote: token.reserveQuote,
      reserveBase: token.reserveBase,
    };
  })() : undefined;
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
    setIsWalletDropdownOpen(false);
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
              (memeTokenData.price || 0.000001)?.toString() || 'n/a' :
              formatSubscript(marketHeader?.currentPrice) || 'n/a'
            }
            priceChangeAmount={isMemeTokenPage && memeTokenData ?
              memeTokenData.change24h?.toString() || 'n/a' :
              formatCommas(
                (marketHeader?.priceChangeAmount / Number(activeMarket?.priceFactor || 1)).toString()
              ) || 'n/a'
            }
            priceChangePercent={isMemeTokenPage && memeTokenData ?
              `${memeTokenData.change24h >= 0 ? '+' : ''}${memeTokenData.change24h.toFixed(2)}` :
              marketHeader?.priceChange || 'n/a'
            }
            activeMarket={activeMarket}
            high24h={formatSubscript(marketHeader?.high24h) || 'n/a'}
            low24h={formatSubscript(marketHeader?.low24h) || 'n/a'}
            volume={isMemeTokenPage && memeTokenData ?
              memeTokenData.volume24h?.toString() || 'n/a' :
              marketHeader?.volume || 'n/a'
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

          {/* <NetworkSelector
            isNetworkSelectorOpen={isNetworkSelectorOpen}
            setNetworkSelectorOpen={setNetworkSelectorOpen}
            setTokenIn={setTokenIn}
            setTokenOut={setTokenOut}
            setorders={setorders}
            settradehistory={settradehistory}
            settradesByMarket={settradesByMarket}
            setcanceledorders={setcanceledorders}
            setChain={setChain}
          /> */}
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
            <MemeSearch
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
            />
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
                    <span className={`wallet-count ${selectedSet.size ? 'has-active' : ''}`}>
                      {selectedSet.size}
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
                  <span className="wallet-dropdown-title">Wallets</span>
                  <button
                    className="wallet-dropdown-close"
                    onClick={() => setIsWalletDropdownOpen(false)}
                  >
                    <img src={closebutton} className="wallet-dropdown-close-icon" />
                  </button>
                </div>
                <div className="wallet-dropdown-list">
                  {subWallets.length > 0 ? (
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
                              className="wallet-dropdown-checkbox"
                              checked={isActive}
                              readOnly
                            />
                          </div>

                          <div
                            className="wallet-dropdown-info"
                          >
                            <div className="wallet-dropdown-name">
                              {getWalletName(wallet.address, index)}
                            </div>
                            <div className="wallet-dropdown-address">
                              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                            </div>
                          </div>
                          <Tooltip content="MON Balance">
                            <div className="wallet-dropdown-balance">
                              <div className={`wallet-dropdown-balance-amount ${isBlurred ? 'blurred' : ''}`}>
                                <img src={monadicon} className="wallet-dropdown-mon-icon" />
                                {formatNumberWithCommas(balance, 2)}
                              </div>
                            </div>
                          </Tooltip>
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
                  ) : (
                    <div className="wallet-dropdown-no-subwallets">
                      <button
                        className="wallet-dropdown-action-btn 1ct-trading-btn"
                        onClick={() => {
                          setpopup(28);
                          setIsWalletDropdownOpen(false);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="wallet-dropdown-action-icon"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg>
                        Enable 1CT
                      </button>
                    </div>
                  )}
                </div>
                <div className="wallet-dropdown-actions">
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