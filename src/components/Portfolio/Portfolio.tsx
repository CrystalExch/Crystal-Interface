import { Eye, Search, Eye as EyeIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import Overlay from '../loading/LoadingComponent';
import PortfolioGraph from './PortfolioGraph/PortfolioGraph';
import OrderCenter from '../OrderCenter/OrderCenter';
import ReferralSidebar from './ReferralSidebar/ReferralSidebar';

import { useSharedContext } from '../../contexts/SharedContext';
import { formatCommas } from '../../utils/numberDisplayFormat';
import { settings } from '../../settings';

import './Portfolio.css';

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
                      {isSpectating ? t("spectatingPerformance") : t("performance")}
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
                    t("account")
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
                    {isSpectating ? t("spectatedTradingStats") : t("tradingStats")}
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