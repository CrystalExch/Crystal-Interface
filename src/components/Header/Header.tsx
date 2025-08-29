import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import LanguageSelector from './LanguageSelector/LanguageSelector';
import NetworkSelector from './NetworkSelector/NetworkSelector';
import SideMenuOverlay from './SideMenuOverlay/SideMenuOverlay';
import TransactionHistoryMenu from '../TransactionHistoryMenu/TransactionHistoryMenu';
import ChartHeader from '../Chart/ChartHeader/ChartHeader';

import { formatCommas } from '../../utils/numberDisplayFormat';
import { settings } from '../../settings';

import settingsicon from '../../assets/settings.svg';
import walleticon from '../../assets/wallet_icon.png';
import historyIcon from '../../assets/notification.svg';
import monadicon from '../../assets/monadlogo.svg';
import closebutton from '../../assets/close_button.png';

import './Header.css';

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
  walletTokenBalances?: { [address: string]: any };
  activeWalletPrivateKey?: string;
  setOneCTSigner: (privateKey: string) => void;
  refetch: () => void;
  isBlurred?: boolean;
  forceRefreshAllWallets?: () => void;
  tokenList?: any[];
  logout: () => void;
  tokenBalances: { [address: string]: bigint };
  lastRefGroupFetch: any;
}

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
  setOneCTSigner,
  refetch,
  isBlurred = false,
  forceRefreshAllWallets,
  tokenList = [],
  logout,
  lastRefGroupFetch,
}) => {
  const location = useLocation();
  const [isNetworkSelectorOpen, setNetworkSelectorOpen] = useState(false);
  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false);
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

  // Load wallet names from localStorage
  useEffect(() => {
    const storedWalletNames = localStorage.getItem('crystal_wallet_names');
    if (storedWalletNames) {
      try {
        setWalletNames(JSON.parse(storedWalletNames));
      } catch (error) {
        console.error('Error loading wallet names:', error);
      }
    }
  }, []);

  // Close dropdown when clicking outside
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

  const memeTokenData = isMemeTokenPage && location.state?.tokenData ? (() => {
    const token = location.state.tokenData;
    const mergedData = { ...token, ...liveTokenData };
    const currentMarketCap = liveTokenData.marketCap || token.marketCap;
    const bondingPercentage = Math.min((currentMarketCap / 25000) * 100, 100);

    return {
      symbol: token.symbol,
      name: token.name,
      image: token.image,
      tokenAddress: token.tokenAddress,
      marketCap: currentMarketCap,
      change24h: mergedData.change24h,
      bondingPercentage: bondingPercentage,
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
    };
  })() : undefined;

  // Wallet helper functions
  const formatNumberWithCommas = (num: number, decimals = 2) => {
    if (num === 0) return "0";
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    if (num >= 1) return num.toLocaleString("en-US", { maximumFractionDigits: decimals });
    return num.toFixed(Math.min(decimals, 8));
  };

  const getWalletBalance = (address: string) => {
    const balances = walletTokenBalances[address];
    if (!balances || !tokenList.length) return 0;

    // Get ETH/MON token from settings
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
      setTimeout(() => refetch(), 0);
      if (forceRefreshAllWallets) {
        setTimeout(() => forceRefreshAllWallets(), 200);
      }
    }
    else {
      localStorage.removeItem('crystal_active_wallet_private_key');
      setOneCTSigner('')
      lastRefGroupFetch.current = 0;
      setTimeout(() => refetch(), 0);
    }
  };

  const handleLogout = () => {
    // Clear the active wallet
    if (setOneCTSigner) {
      setOneCTSigner('');
      localStorage.removeItem('crystal_active_wallet_private_key');
    }
    
    // Call the logout function if available
    if (logout) {
      logout();
    }
    
    setIsWalletDropdownOpen(false);
  };

  const handleOpenPortfolio = () => {
    setpopup(4); // Open portfolio popup
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
              memeTokenData.price?.toString() || 'n/a' :
              marketHeader?.currentPrice || 'n/a'
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
            high24h={marketHeader?.high24h || 'n/a'}
            low24h={marketHeader?.low24h || 'n/a'}
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
          />
        </div>
        <div className={rightHeaderClass}>
          <NetworkSelector
            isNetworkSelectorOpen={isNetworkSelectorOpen}
            setNetworkSelectorOpen={setNetworkSelectorOpen}
            setTokenIn={setTokenIn}
            setTokenOut={setTokenOut}
            setorders={setorders}
            settradehistory={settradehistory}
            settradesByMarket={settradesByMarket}
            setcanceledorders={setcanceledorders}
            setChain={setChain}
          />
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
                    {subWallets.length > 0 && (
                      <span className="wallet-count">{subWallets.length}</span>
                    )}
                    {subWallets.length == 0 && (
                      <span className="wallet-count">0</span>
                    )}
                    <span className="wallet-separator"></span>
                                        <img 
                      src={currentWalletIcon || walleticon} 
                      className="wallet-icon" 
                    />
                    <span className="header-wallet-address">
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

                            <div className="wallet-dropdown-balance">
                              <div className={`wallet-dropdown-balance-amount ${isBlurred ? 'blurred' : ''}`}>
                                <img src={monadicon} className="wallet-dropdown-mon-icon"/>
                                {formatNumberWithCommas(balance, 2)}
                              </div>
                            </div>
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
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="wallet-dropdown-action-icon"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
                          Enable 1CT
                        </button>
                      </div>
                    )}
                  <div className="wallet-dropdown-actions">
                    <button
                      className="wallet-dropdown-action-btn portfolio-btn"
                      onClick={handleOpenPortfolio}
                    >
                      <img className="wallet-dropdown-action-icon" src={walleticon}/>
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