import { Eye, Search, Eye as EyeIcon, Edit2, Check, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import Overlay from '../loading/LoadingComponent';
import PortfolioGraph from './PortfolioGraph/PortfolioGraph';
import OrderCenter from '../OrderCenter/OrderCenter';
import ReferralSidebar from './ReferralSidebar/ReferralSidebar';
import cheveron from '../../assets/chevron_arrow.png'
import { useSharedContext } from '../../contexts/SharedContext';
import { formatCommas } from '../../utils/numberDisplayFormat';
import { settings } from '../../settings';
import { fetchLatestPrice } from '../../utils/getPrice';
import normalizeTicker from '../../utils/normalizeTicker';
import './Portfolio.css';
import copy from '../../assets/copy.svg'
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  column: string;
  direction: SortDirection;
}

interface TokenType {
  address: string;
  symbol: string;
  decimals: bigint;
  name: string;
  ticker: string;
  image: string;
}

interface TradesByMarket {
  [key: string]: any[];
}

interface PortfolioProps {
  orders: any[];
  tradehistory: any[];
  trades: TradesByMarket;
  canceledorders: any[];
  tokenList: TokenType[];
  router: any;
  address: string;
  isBlurred: any;
  setIsBlurred: any;
  onMarketSelect: any;
  setSendTokenIn: any;
  setpopup: (value: number) => void;
  tokenBalances: any;
  totalAccountValue: number | null;
  setTotalVolume: (volume: number) => void;
  totalVolume: number;
  chartData: any[];
  portChartLoading: boolean;
  chartDays: number;
  setChartDays: (days: number) => void;
  totalClaimableFees: number;
  claimableFees: { [key: string]: number };
  refLink: string;
  setRefLink: any;
  setShowRefModal: any;
  filter: 'all' | 'buy' | 'sell';
  setFilter: any;
  onlyThisMarket: boolean;
  setOnlyThisMarket: any;
  account: any;
  refetch: any;
  sendUserOperationAsync: any;
  setChain: any;
  waitForTxReceipt: any;
  marketsData: any;
  usedRefLink: string;
  setUsedRefLink: any;
  usedRefAddress: string;
  setUsedRefAddress: any;
  client: any;
  activechain: any;
  markets: any;
  isSpectating?: boolean;
  spectatedAddress?: string;
  onStartSpectating?: (address: string) => void;
  onStopSpectating?: () => void;
  originalAddress?: string;
  onSpectatingChange?: (isSpectating: boolean, address: string | null) => void;
}

type PortfolioTab = 'spot' | 'margin' | 'wallets' | 'trenches';

const Portfolio: React.FC<PortfolioProps> = ({
  orders,
  tradehistory,
  trades,
  canceledorders,
  tokenList,
  router,
  address,
  isBlurred,
  setIsBlurred,
  onMarketSelect,
  setSendTokenIn,
  setpopup,
  tokenBalances,
  totalAccountValue,
  setTotalVolume,
  totalVolume,
  chartData,
  portChartLoading,
  chartDays,
  setChartDays,
  totalClaimableFees,
  claimableFees,
  refLink,
  setRefLink,
  filter,
  setFilter,
  onlyThisMarket,
  setOnlyThisMarket,
  account,
  refetch,
  sendUserOperationAsync,
  setChain,
  waitForTxReceipt,
  marketsData,
  usedRefLink,
  setUsedRefLink,
  usedRefAddress,
  setUsedRefAddress,
  client,
  activechain,
  markets,
  isSpectating: propIsSpectating,
  spectatedAddress: propSpectatedAddress,
  onStartSpectating,
  onStopSpectating,
  originalAddress,
  onSpectatingChange,
}) => {
  const [activeTab, setActiveTab] = useState<PortfolioTab>('spot');
  const [activeSection, setActiveSection] = useState<
    'orders' | 'tradeHistory' | 'orderHistory' | 'balances'
  >('balances');
  const [portfolioColorValue, setPortfolioColorValue] = useState('#00b894');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'balance',
    direction: 'desc',
  });

  // Subwallet management state
  const [subWallets, setSubWallets] = useState<Array<{address: string, privateKey: string}>>([]);
  const [enabledWallets, setEnabledWallets] = useState<Set<string>>(new Set());
  const [walletNames, setWalletNames] = useState<{[address: string]: string}>({});
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [walletTotalValues, setWalletTotalValues] = useState<{[address: string]: number}>({});
  const [walletTokenBalances, setWalletTokenBalances] = useState<{[address: string]: any}>({});
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // Deposit modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositTargetWallet, setDepositTargetWallet] = useState<string>('');
  const [depositMode, setDepositMode] = useState<'main' | 'subwallet'>('main');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositFromWallet, setDepositFromWallet] = useState<string>('');

  const handleResize = () => {
    setIsMobile(window.innerWidth <= 1020);
    if (window.innerHeight > 1080) {
      setOrderCenterHeight(363.58);
    } else if (window.innerHeight > 960) {
      setOrderCenterHeight(322.38);
    } else if (window.innerHeight > 840) {
      setOrderCenterHeight(281.18);
    } else if (window.innerHeight > 720) {
      setOrderCenterHeight(239.98);
    } else {
      setOrderCenterHeight(198.78);
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { high, low, days, percentage, timeRange, setPercentage } =
    useSharedContext();

  const activeOrders = orders.length;
  const [orderCenterHeight, setOrderCenterHeight] = useState(() => {
    if (window.innerHeight > 1080) return 363.58;
    if (window.innerHeight > 960) return 322.38;
    if (window.innerHeight > 840) return 281.18;
    if (window.innerHeight > 720) return 239.98;
    return 198.78;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1020);

  const [internalIsSpectating, setInternalIsSpectating] = useState(false);
  const [internalSpectatedAddress, setInternalSpectatedAddress] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const isSpectating = propIsSpectating !== undefined ? propIsSpectating : internalIsSpectating;
  const spectatedAddress = propSpectatedAddress !== undefined ? propSpectatedAddress : internalSpectatedAddress;

  const getActiveAddress = () => {
    return isSpectating ? spectatedAddress : address;
  };

  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  // Load subwallets data on component mount
  useEffect(() => {
    // Load subwallets from localStorage
    const storedSubWallets = localStorage.getItem('crystal_sub_wallets');
    if (storedSubWallets) {
      try {
        const wallets = JSON.parse(storedSubWallets);
        setSubWallets(wallets);
      } catch (error) {
        console.error('Error loading stored subwallets:', error);
      }
    }

    const storedEnabledWallets = localStorage.getItem('crystal_enabled_wallets');
    if (storedEnabledWallets) {
      try {
        setEnabledWallets(new Set(JSON.parse(storedEnabledWallets)));
      } catch (error) {
        console.error('Error loading enabled wallets:', error);
      }
    }

    // Load wallet names from localStorage
    const storedWalletNames = localStorage.getItem('crystal_wallet_names');
    if (storedWalletNames) {
      try {
        setWalletNames(JSON.parse(storedWalletNames));
      } catch (error) {
        console.error('Error loading wallet names:', error);
      }
    }
  }, []);

  // Wallet management helper functions
  const toggleWalletEnabled = (address: string) => {
    const newEnabledWallets = new Set(enabledWallets);
    if (newEnabledWallets.has(address)) {
      newEnabledWallets.delete(address);
    } else {
      newEnabledWallets.add(address);
    }
    setEnabledWallets(newEnabledWallets);
    localStorage.setItem('crystal_enabled_wallets', JSON.stringify(Array.from(newEnabledWallets)));
  };

const startEditingWallet = (address: string) => {
  setEditingWallet(address);
  setEditingName(walletNames[address] || `Wallet ${subWallets.findIndex(w => w.address === address) + 1}`);
};

const saveWalletName = (address: string) => {
  const newWalletNames = { ...walletNames, [address]: editingName || `Wallet ${subWallets.findIndex(w => w.address === address) + 1}` };
  setWalletNames(newWalletNames);
  localStorage.setItem('crystal_wallet_names', JSON.stringify(newWalletNames));
  setEditingWallet(null);
  setEditingName('');
};


  const getWalletName = (address: string, index: number) => {
    return walletNames[address] || `Wallet ${index + 1}`;
  };

  // Function to fetch token balances for a specific wallet address
  const fetchTokenBalancesForWallet = async (walletAddress: string) => {
    try {
      // Use dynamic imports to load your existing blockchain infrastructure
      const { readContract } = await import('@wagmi/core');
      const { config } = await import('../../wagmi');
      const { CrystalDataHelperAbi } = await import('../../abis/CrystalDataHelperAbi');

      // Fetch current token balances using the same method as TraderPortfolioPopup
      const balancesData = await readContract(config, {
        abi: CrystalDataHelperAbi,
        address: settings.chainConfig[activechain].balancegetter,
        functionName: 'batchBalanceOf',
        args: [
          walletAddress as `0x${string}`,
          tokenList.map((token) => token.address as `0x${string}`),
        ],
      });

      // Convert blockchain response to the format expected by your components
      const balances: { [key: string]: string } = {};
      for (const [index, balance] of balancesData.entries()) {
        const token = tokenList[index];
        if (token) {
          balances[token.address] = balance.toString();
        }
      }

      return balances;

    } catch (error) {
      console.error(`Error fetching token balances for ${walletAddress}:`, error);
      return {};
    }
  };

  // Function to calculate total account value for a specific wallet address
  const calculateTotalAccountValueForWallet = (walletAddress: string, walletTokenBalances: any) => {
    if (!walletTokenBalances || !marketsData) return 0;
    
    let totalValue = 0;
    const ethTicker = settings.chainConfig[activechain].ethticker;
    
    // Create marketDataMap (same as in usePortfolioData)
    const marketDataMap: Record<string, any> = {};
    marketsData.forEach((market: any) => {
      if (market) {
        const key = `${market.baseAsset}${market.quoteAsset}`;
        marketDataMap[key] = market;
      }
    });
    
    const ethMarket = marketDataMap[`${ethTicker}USDC`];

    tokenList.forEach((token) => {
      const bal = Number(walletTokenBalances[token.address]) / 10 ** Number(token.decimals) || 0;
      const normalized = normalizeTicker(token.ticker, activechain);
      let price = 0;
      const usdcMkt = marketDataMap[`${normalized}USDC`];

      if (usdcMkt?.series?.length) {
        price = usdcMkt.series[usdcMkt.series.length - 1].close / Number(usdcMkt.priceFactor);
      } else if (normalized === 'USDC') {
        price = 1;
      } else {
        const tokenEth = marketDataMap[`${normalized}${ethTicker}`];
        if (
          tokenEth?.series?.length &&
          ethMarket?.series?.length
        ) {
          price = tokenEth.series[tokenEth.series.length - 1].close / Number(tokenEth.priceFactor) * ethMarket.series[ethMarket.series.length - 1].close / Number(ethMarket.priceFactor);
        }
      }

      totalValue += bal * price;
    });
    
    return totalValue;
  };

  // Load balances and total values for all wallets with debouncing
  useEffect(() => {
    const loadWalletData = async () => {
      if (subWallets.length === 0) return;
      
      // Debounce: only fetch if it's been more than 10 seconds since last fetch
      const now = Date.now();
      if (now - lastFetchTime < 10000 && Object.keys(walletTokenBalances).length > 0) {
        return;
      }
      
      // Check if we have the necessary data
      if (!marketsData || marketsData.length === 0 || !tokenList || tokenList.length === 0) {
        return;
      }

      setWalletsLoading(true);
      setLastFetchTime(now);
      
      const balances: {[address: string]: any} = {};
      const totalValues: {[address: string]: number} = {};
      
      try {
        // Fetch balances for all wallets in parallel
        const balancePromises = subWallets.map(wallet => 
          fetchTokenBalancesForWallet(wallet.address)
        );
        
        const allBalances = await Promise.all(balancePromises);
        
        // Calculate total values
        subWallets.forEach((wallet, index) => {
          const tokenBalances = allBalances[index];
          balances[wallet.address] = tokenBalances;
          totalValues[wallet.address] = calculateTotalAccountValueForWallet(wallet.address, tokenBalances);
        });
        
        setWalletTokenBalances(balances);
        setWalletTotalValues(totalValues);
      } catch (error) {
        console.error('Error loading wallet data:', error);
      } finally {
        setWalletsLoading(false);
      }
    };
    
    loadWalletData();
  }, [subWallets.length, activechain]); // Removed marketsData and tokenList from dependencies

  // Separate useEffect to recalculate values when market data changes (without refetching balances)
  useEffect(() => {
    if (Object.keys(walletTokenBalances).length > 0 && marketsData && tokenList) {
      const totalValues: {[address: string]: number} = {};
      
      subWallets.forEach((wallet) => {
        totalValues[wallet.address] = calculateTotalAccountValueForWallet(wallet.address, walletTokenBalances[wallet.address]);
      });
      
      setWalletTotalValues(totalValues);
    }
  }, [marketsData, tokenList, walletTokenBalances, subWallets]);

  // Deposit functions
  const openDepositModal = (targetWallet: string, mode: 'main' | 'subwallet') => {
    setDepositTargetWallet(targetWallet);
    setDepositMode(mode);
    setDepositAmount('');
    setDepositFromWallet('');
    setShowDepositModal(true);
  };

  const closeDepositModal = () => {
    setShowDepositModal(false);
    setDepositTargetWallet('');
    setDepositAmount('');
    setDepositFromWallet('');
  };

  const handleDeposit = async () => {
    if (!depositAmount || !depositTargetWallet) return;

    try {
      const tokenIn = tokenList.find(t => t.ticker === 'MON' || t.symbol === 'MON');
      if (!tokenIn) return;

      const amountBigInt = BigInt(
        Math.round(parseFloat(depositAmount) * 10 ** Number(tokenIn.decimals))
      );

      // Use your existing send functionality
      if (depositMode === 'main') {
        // Send from main wallet to target wallet
        const hash = await sendUserOperationAsync({
          uo: {
            target: depositTargetWallet as `0x${string}`,
            value: amountBigInt,
            data: '0x'
          }
        });
        
        console.log('Deposit successful:', hash);
      } else {
        // Send from selected subwallet to target wallet
        if (!depositFromWallet) return;
        
        // You'll need to implement sending from subwallet
        // This would require switching to the source subwallet temporarily
        console.log('Sending from subwallet:', depositFromWallet, 'to:', depositTargetWallet);
      }

      closeDepositModal();
      // Refresh wallet data after deposit
      setLastFetchTime(0); // Force refresh
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  const getWalletBalance = (address: string) => {
    const balances = walletTokenBalances[address];
    if (!balances) return 0;
    
    // Get MON balance specifically
    const monToken = tokenList.find(t => t.ticker === 'MON' || t.symbol === 'MON');
    if (monToken && balances[monToken.address]) {
      return Number(balances[monToken.address]) / 10 ** Number(monToken.decimals);
    }
    
    return 0;
  };

  const getTotalWalletValue = (address: string) => {
    return walletTotalValues[address] || 0;
  };

  const handleConfirmSpectating = () => {
    if (searchInput.trim() && isValidAddress(searchInput.trim())) {
      if (onStartSpectating) {
        onStartSpectating(searchInput.trim());
      } else {
        setInternalSpectatedAddress(searchInput.trim());
        setInternalIsSpectating(true);
      }

      if (onSpectatingChange) {
        onSpectatingChange(true, searchInput.trim());
      }

      refetch(searchInput.trim());
    } else {
      alert('Please enter a valid wallet address');
    }
  };

  const isButtonDisabled = !isSpectating && (!searchInput.trim() || !isValidAddress(searchInput.trim()));

  const clearSpectating = () => {
    if (onStopSpectating) {
      onStopSpectating();
    } else {
      setInternalIsSpectating(false);
      setInternalSpectatedAddress('');
    }

    if (onSpectatingChange) {
      onSpectatingChange(false, null);
    }

    setSearchInput('');
    refetch(originalAddress || address);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirmSpectating();
    }
  };

  const getTimeRangeText = (timeRange: string) => {
    switch (timeRange) {
      case '24H':
        return 'day';
      case '7D':
        return 'week';
      case '14D':
        return 'two weeks';
      case '30D':
        return 'month';
      default:
        return 'week';
    }
  };

  const handlePercentageChange = (value: number) => {
    setPercentage(value);
  };

  useEffect(() => {
    const now = Date.now() / 1000;
    const timeago = now - 24 * 60 * 60 * days;
    let volume = 0;

    tradehistory.forEach((trade) => {
      const marketKey = trade[4];
      const tradeTime = trade[6];
      const tradeSide = trade[2];
      const amount = trade[0];
      const price = trade[1];

      if (
        typeof tradeTime === 'number' &&
        tradeTime >= timeago
      ) {
        const quotePrice = markets[marketKey].quoteAsset == 'USDC' ? 1 : trades[(markets[marketKey].quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : markets[marketKey].quoteAsset) + 'USDC']?.[0]?.[3]
          / Number(markets[(markets[marketKey].quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : markets[marketKey].quoteAsset) + 'USDC']?.priceFactor)
        volume += (tradeSide === 1 ? amount : price) * quotePrice / 10 ** Number(markets[marketKey].quoteDecimals);
      }
    });

    setTotalVolume(parseFloat(volume.toFixed(2)));
  }, [tradehistory, days]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'spot':
      default:
        return (
          <div className="portfolio-layout-with-referrals">
            <ReferralSidebar
              tokenList={tokenList}
              markets={markets}
              router={router}
              usedRefAddress={usedRefAddress as `0x${string}`}
              address={getActiveAddress() as `0x${string}`}
              usedRefLink={usedRefLink}
              setUsedRefLink={setUsedRefLink}
              setUsedRefAddress={setUsedRefAddress}
              totalClaimableFees={totalClaimableFees}
              claimableFees={claimableFees}
              refLink={refLink}
              setRefLink={setRefLink}
              setChain={setChain}
              setpopup={setpopup}
              account={account}
              refetch={refetch}
              sendUserOperationAsync={sendUserOperationAsync}
              waitForTxReceipt={waitForTxReceipt}
              client={client}
              activechain={activechain}
            />

            <div className="portfolio-left-column">
              <div className="graph-outer-container">
                {portChartLoading ? (
                  <div className="graph-container">
                    <Overlay isVisible={true} bgcolor={'rgb(6,6,6)'} height={15} maxLogoHeight={100} />
                  </div>
                ) : (
                  <div className="graph-container">
                    <span className="graph-label">
                      {isSpectating ? "Spectating Performance" : "Performance"}
                    </span>
                    <PortfolioGraph
                      address={getActiveAddress()}
                      colorValue={portfolioColorValue}
                      setColorValue={setPortfolioColorValue}
                      isPopup={false}
                      onPercentageChange={handlePercentageChange}
                      chartData={chartData}
                      portChartLoading={portChartLoading}
                      chartDays={chartDays}
                      setChartDays={setChartDays}
                      isBlurred={isBlurred}
                    />
                  </div>
                )}
              </div>
              <div className="order-section">
                <div className="portfolio-order-center-wrapper">
                  <OrderCenter
                    orders={orders}
                    tradehistory={tradehistory}
                    canceledorders={canceledorders}
                    router={router}
                    address={getActiveAddress()}
                    trades={trades}
                    currentMarket={''}
                    orderCenterHeight={orderCenterHeight}
                    tokenList={tokenList}
                    onMarketSelect={onMarketSelect}
                    setSendTokenIn={setSendTokenIn}
                    setpopup={setpopup}
                    sortConfig={sortConfig}
                    onSort={setSortConfig}
                    tokenBalances={tokenBalances}
                    hideMarketFilter={true}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    filter={filter}
                    setFilter={setFilter}
                    onlyThisMarket={onlyThisMarket}
                    setOnlyThisMarket={setOnlyThisMarket}
                    isPortfolio={true}
                    refetch={refetch}
                    sendUserOperationAsync={sendUserOperationAsync}
                    setChain={setChain}
                    isBlurred={isBlurred}
                    waitForTxReceipt={waitForTxReceipt}
                    openEditOrderPopup={() => { }}
                    openEditOrderSizePopup={() => { }}
                    marketsData={marketsData}
                  />
                </div>
              </div>
            </div>

            <div className="account-stats-wrapper">
              <div className="controls-container">
                <button
                  className="control-button"
                  onClick={() => setIsBlurred(!isBlurred)}
                >
                  <div style={{ position: 'relative' }}>
                    <Eye className="control-icon" size={12} />
                    <div className={`port-eye-slash ${isBlurred ? '' : 'hidden'}`} />
                  </div>
                  Hide Balances
                </button>

                <button
                  className="control-button"
                  onClick={() => {
                    account.logout()
                  }}
                >
                  <svg
                    className="control-icon"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M8.90002 7.55999C9.21002 3.95999 11.06 2.48999 15.11 2.48999H15.24C19.71 2.48999 21.5 4.27999 21.5 8.74999V15.27C21.5 19.74 19.71 21.53 15.24 21.53H15.11C11.09 21.53 9.24002 20.08 8.91002 16.54" />
                    <path d="M2 12H14.88" />
                    <path d="M12.65 8.6499L16 11.9999L12.65 15.3499" />
                  </svg>
                  Disconnect
                </button>
              </div>
              <div
                className={`account-summary-container ${percentage >= 0 ? 'positive' : 'negative'}`}
              >
                <div className="account-header">
                  {isSpectating ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <EyeIcon size={16} style={{ color: '#ff6b6b' }} />
                      <span>SPECTATING</span>
                    </div>
                  ) : (
                    "Account"
                  )}
                </div>
                {isSpectating && (
                  <div style={{
                    fontSize: '12px',
                    color: '#888',
                    marginBottom: '8px',
                    wordBreak: 'break-all'
                  }}>
                    {spectatedAddress.slice(0, 6)}...{spectatedAddress.slice(-4)}
                  </div>
                )}
                <div className="total-value-container">
                  <span className={`total-value ${isBlurred ? 'blurred' : ''}`}>
                    ${formatCommas(typeof totalAccountValue === 'number' ? totalAccountValue.toFixed(2) : '0.00')}
                  </span>
                  <div className="percentage-change-container">
                    <span
                      className={`percentage-value ${isBlurred ? 'blurred' : ''} ${percentage >= 0 ? 'positive' : 'negative'
                        }`}
                    >
                      {portChartLoading ? (
                        <div className="port-loading" style={{ width: 80 }} />
                      ) : (
                        `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`
                      )}
                    </span>
                    <span className="time-range">
                      (past {getTimeRangeText(timeRange)})
                    </span>
                  </div>
                </div>
              </div>
              <div className="trading-stats-container">
                <div className="trading-stats-header">
                  <span className="trading-stats-title">
                    {isSpectating ? "Spectated Trading Stats" : "Trading Stats"}
                  </span>
                </div>
                <div className="stats-list">
                  <div className="stat-row">
                    Total Volume
                    <span className={`account-stat-value ${isBlurred ? 'blurred' : ''}`}>
                      {portChartLoading ? (
                        <div className="port-loading" style={{ width: 80 }} />
                      ) : (
                        `$${formatCommas(getActiveAddress() ? totalVolume.toFixed(2) : '0.00')}`
                      )}
                    </span>
                  </div>
                  <div className="stat-row">
                    Session High
                    <span className={`account-stat-value ${isBlurred ? 'blurred' : ''}`}>
                      {portChartLoading ? (
                        <div className="port-loading" style={{ width: 80 }} />
                      ) : (
                        `$${formatCommas(getActiveAddress() ? high.toFixed(2) : '0.00')}`
                      )}
                    </span>
                  </div>
                  <div className="stat-row">
                    Session Low
                    <span className={`account-stat-value ${isBlurred ? 'blurred' : ''}`}>
                      {portChartLoading ? (
                        <div className="port-loading" style={{ width: 80 }} />
                      ) : (
                        `$${formatCommas(getActiveAddress() ? low.toFixed(2) : '0.00')}`
                      )}
                    </span>
                  </div>
                  <div className="stat-row">
                    Active Orders
                    <span className={`account-stat-value`}>
                      {portChartLoading ? (
                        <div className="port-loading" style={{ width: 80 }} />
                      ) : (
                        `${getActiveAddress() ? activeOrders : 0}`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'wallets':
        return (
          <div className="wallets-tab-content">
                <div className="wallets-summary">
                  <div className="wallets-summary-left">
                  <div className="summary-item">
                    <span className="summary-label">Total Wallets</span>
                    <span className="summary-value">{subWallets.length}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Enabled Wallets</span>
                    <span className="summary-value">{enabledWallets.size}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Combined Value</span>
                    <span className={`summary-value ${isBlurred ? 'blurred' : ''}`}>
                      {walletsLoading ? (
                        <div className="port-loading" style={{ width: 100 }} />
                      ) : (
                        `$${subWallets.reduce((total, wallet) => total + getTotalWalletValue(wallet.address), 0).toFixed(2)}`
                      )}
                    </span>
                  </div>
                  </div>
                  <div className="wallets-summary-right">
                    <button className="import-wallet-button">Import</button>
                    <button className="create-wallet-button">Create Subwallet</button>
                  </div>
                </div>
            {subWallets.length === 0 ? (
              <div className="no-wallets-container">
                <div className="no-wallets-message">
                  <h4>No Sub Wallets Found</h4>
                  <p>Create sub wallets in Settings to manage multiple wallets from one interface.</p>
                  <button 
                    className="create-wallet-cta-button"
                    onClick={() => setpopup(5)}
                  >
                    Go to Settings
                  </button>
                </div>
              </div>
            ) : (
              <div className="wallets-table-container">
                <div className="wallets-table-header">
                  <div className="wallet-header-name">Wallet Name</div>
                  <div className="wallet-header-address">Address</div>
                  <div className="wallet-header-mon">MON Balance</div>
                  <div className="wallet-header-total">Total Value</div>
                  <div className="wallet-header-actions">Actions</div>
                </div>
                
                <div className="wallets-table-body">
                  {subWallets.map((wallet, index) => (
                    <div key={wallet.address} className="wallet-row">
                      
                     
<div className="wallet-name-cell">
  <input
    type="checkbox"
    className="wallet-checkbox"
    checked={enabledWallets.has(wallet.address)}
    onChange={() => toggleWalletEnabled(wallet.address)}
  />
  {editingWallet === wallet.address ? (
    <div className="wallet-name-edit-container">
      <input
        type="text"
        value={editingName}
        onChange={(e) => setEditingName(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') saveWalletName(wallet.address);
        }}
        onBlur={() => saveWalletName(wallet.address)}
        className="wallet-name-input"
        autoFocus
      />
    </div>
  ) : (
    <div 
      className="wallet-name-display"
      onClick={() => startEditingWallet(wallet.address)}
    >
      <span className="wallet-name-text">{getWalletName(wallet.address, index)}</span>
      <Edit2 size={12} className="wallet-name-edit-icon" />
    </div>
  )}
</div>
                      
                      <div className="wallet-address-cell">
                        <span className="wallet-address-text">
                          {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                        </span>
                        <button 
                          className="wallet-copy-button"
                          onClick={() => navigator.clipboard.writeText(wallet.address)}
                        >
                          <img src={copy} className="wallet-address-copy-icon"alt="Copy" />
                        </button>
                      </div>
                      
                      <div className="wallet-balance-cell">
                        <span className={`wallet-balance ${isBlurred ? 'blurred' : ''}`}>
                          {walletsLoading ? (
                            <div className="port-loading" style={{ width: 60 }} />
                          ) : (
                            `${getWalletBalance(wallet.address).toFixed(2)} MON`
                          )}
                        </span>
                      </div>
                      
                      <div className="wallet-total-cell">
                        <span className={`wallet-total ${isBlurred ? 'blurred' : ''}`}>
                          {walletsLoading ? (
                            <div className="port-loading" style={{ width: 80 }} />
                          ) : (
                            `${getTotalWalletValue(wallet.address).toFixed(2)}`
                          )}
                        </span>
                      </div>
                      
                      <div className="wallet-actions-cell">
                        <div className="wallet-actions-grid">
                          <button 
                            className="wallet-action-button primary"
                            onClick={() => {
                              console.log('Setting wallet as active:', wallet.address);
                            }}
                          >
                            Set Active
                          </button>
                          <button 
                            className="wallet-action-button secondary"
                            onClick={() => openDepositModal(wallet.address, 'main')}
                          >
                            From Main
                          </button>
                          <button 
                            className="wallet-action-button secondary"
                            onClick={() => openDepositModal(wallet.address, 'subwallet')}
                          >
                            From Sub
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showDepositModal && (
              <div className="deposit-modal-backdrop" onClick={closeDepositModal}>
                <div className="deposit-modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="deposit-modal-header">
                    <h3 className="deposit-modal-title">
                      Deposit to {getWalletName(depositTargetWallet, subWallets.findIndex(w => w.address === depositTargetWallet))}
                    </h3>
                    <button className="deposit-modal-close" onClick={closeDepositModal}>
                      <X size={20} />
                    </button>
                  </div>

                  <div className="deposit-modal-content">
                    <div className="deposit-mode-info">
                      <span className="deposit-mode-label">
                        {depositMode === 'main' ? 'From Main Wallet' : 'From Sub Wallet'}
                      </span>
                      <span className="deposit-target-address">
                        To: {depositTargetWallet.slice(0, 6)}...{depositTargetWallet.slice(-4)}
                      </span>
                    </div>

                    {depositMode === 'subwallet' && (
                      <div className="deposit-source-selection">
                        <label className="deposit-label">Select Source Wallet:</label>
                        <select 
                          className="deposit-source-select"
                          value={depositFromWallet}
                          onChange={(e) => setDepositFromWallet(e.target.value)}
                        >
                          <option value="">Choose a wallet...</option>
                          {subWallets
                            .filter(w => w.address !== depositTargetWallet)
                            .map((wallet, index) => (
                              <option key={wallet.address} value={wallet.address}>
                                {getWalletName(wallet.address, index)} ({wallet.address.slice(0, 6)}...{wallet.address.slice(-4)})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    <div className="deposit-amount-section">
                      <label className="deposit-label">Amount (MON):</label>
                      <div className="deposit-amount-input-container">
                        <input
                          type="text"
                          className="deposit-amount-input"
                          value={depositAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*\.?\d{0,18}$/.test(value)) {
                              setDepositAmount(value);
                            }
                          }}
                          placeholder="0.00"
                        />
                        <button 
                          className="deposit-max-button"
                          onClick={() => {
                            // Set to available balance from source wallet
                            if (depositMode === 'main') {
                              const monToken = tokenList.find(t => t.ticker === 'MON' || t.symbol === 'MON');
                              if (monToken && tokenBalances[monToken.address]) {
                                const balance = Number(tokenBalances[monToken.address]) / 10 ** Number(monToken.decimals);
                                setDepositAmount(balance.toString());
                              }
                            } else if (depositFromWallet) {
                              const balance = getWalletBalance(depositFromWallet);
                              setDepositAmount(balance.toString());
                            }
                          }}
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    <div className="deposit-modal-actions">
                      <button 
                        className="deposit-cancel-button"
                        onClick={closeDepositModal}
                      >
                        Cancel
                      </button>
                      <button 
                        className="deposit-confirm-button"
                        onClick={handleDeposit}
                        disabled={
                          !depositAmount || 
                          parseFloat(depositAmount) <= 0 || 
                          (depositMode === 'subwallet' && !depositFromWallet)
                        }
                      >
                        Deposit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  if (isMobile) {
    return (
      <div className="portfolio-specific-page">
        <div className="portfolio-top-row">
          <div className="portfolio-tab-selector">
            <span
              className={`portfolio-tab-title ${activeTab === 'spot' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('spot')}
            >
              Spot
            </span>
            <span
              className={`portfolio-tab-title ${activeTab === 'margin' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('margin')}
            >
              Margin
            </span>
            <span
              className={`portfolio-tab-title ${activeTab === 'wallets' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('wallets')}
            >
              Wallets
            </span>
            <span
              className={`portfolio-tab-title ${activeTab === 'trenches' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('trenches')}
            >
              Trenches
            </span>
          </div>
          <div className="search-wallet-wrapper">
          <div className="portfolio-wallet-search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search vaults..."
              className="portfolio-wallet-search-input"
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyPress={handleKeyPress}
            />
          </div>
           <button
              className={`wallet-search-confirm-button ${isButtonDisabled ? 'disabled' : ''}`}
              onClick={isSpectating ? clearSpectating : handleConfirmSpectating}
              disabled={isButtonDisabled}
            >
              {isSpectating ? 'Stop Spectating' : 'Spectate'}
            </button>
            </div>
        </div>
        <div className="portfolio-content-container">
          {renderTabContent()}
        </div>
      </div>
    );
  } else {
    return (
      <div className="portfolio-specific-page">
        <div className="portfolio-top-row">
          <div className="portfolio-tab-selector">
            <span
              className={`portfolio-tab-title ${activeTab === 'spot' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('spot')}
            >
              Spot
            </span>
            <span
              className={`portfolio-tab-title ${activeTab === 'margin' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('margin')}
            >
              Margin
            </span>
            <span
              className={`portfolio-tab-title ${activeTab === 'wallets' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('wallets')}
            >
              Wallets
            </span>
            <span
              className={`portfolio-tab-title ${activeTab === 'trenches' ? 'active' : 'nonactive'}`}
              onClick={() => setActiveTab('trenches')}
            >
              Trenches
            </span>
          </div>
          <div className="search-wallet-wrapper">
            <button className="portfolio-selected-wallet">Main Wallet
              <img src={cheveron} className="portfolio-wallet-selector"/>
            </button>
            <div className="portfolio-wallet-search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search to track wallet..."
                className="portfolio-wallet-search-input"
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
              />
            </div>
            <button
              className={`wallet-search-confirm-button ${isButtonDisabled ? 'disabled' : ''}`}
              onClick={isSpectating ? clearSpectating : handleConfirmSpectating}
              disabled={isButtonDisabled}
            >
              {isSpectating ? 'Stop Spectating' : 'Spectate'}
            </button>
          </div>
        </div>
        <div className="portfolio-content-container">
          {renderTabContent()}
        </div>
      </div>
    );
  }
};



export default Portfolio;