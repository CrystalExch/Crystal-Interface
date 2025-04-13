import { Eye } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Overlay from '../loading/LoadingComponent';
import PortfolioGraph from './PortfolioGraph/PortfolioGraph';
import OrderCenter from '../OrderCenter/OrderCenter';

import { useSharedContext } from '../../contexts/SharedContext';
import customRound from '../../utils/customRound';
import { formatCommas } from '../../utils/numberDisplayFormat';

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
  setTokenIn: (token: any) => void;
  setTokenOut: (token: any) => void;
  setSendTokenIn: any;
  setpopup: (value: number) => void;
  tokenBalances: any;
  totalAccountValue: number;
  setTotalVolume: (volume: number) => void;
  totalVolume: number;
  chartData: any[];
  portChartLoading: boolean;
  chartDays: number;
  setChartDays: (days: number) => void;
  totalClaimableFees: number;
  refLink: string;
  setShowRefModal: any;
  activeSection: 'orders' | 'tradeHistory' | 'orderHistory' | 'balances';
  setActiveSection: any;
  filter: 'all' | 'buy' | 'sell';
  setFilter: any;
  onlyThisMarket: boolean;
  setOnlyThisMarket: any;
  account: any;
  refetch: any;
  sendUserOperationAsync: any;
  setChain: any;
}

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
  setTokenIn,
  setTokenOut,
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
  refLink,
  setShowRefModal,
  activeSection,
  setActiveSection,
  filter,
  setFilter,
  onlyThisMarket,
  setOnlyThisMarket,
  account,
  refetch,
  sendUserOperationAsync,
  setChain,
}) => {
  const [portfolioColorValue, setPortfolioColorValue] = useState('#00b894');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'assets',
    direction: 'asc',
  });
  const [orderCenterHeight, setOrderCenterHeight] = useState(() => {
    if (window.innerHeight > 1080) return 363.58;
    if (window.innerHeight > 960) return 322.38;
    if (window.innerHeight > 840) return 281.18;
    if (window.innerHeight > 720) return 239.98;
    return 198.78;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1020);

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

  const getTimeRangeText = (timeRange: string) => {
    switch (timeRange) {
      case '24H':
        return t('day');
      case '7D':
        return t('week');
      case '14D':
        return t('weektwo');
      case '30D':
        return t('month');
      default:
        return t('week');
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
        markets[marketKey].baseAddress !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' &&
        typeof tradeTime === 'number' &&
        tradeTime >= timeago
      ) {
        volume += (tradeSide === 1 ? amount : price) / 10 ** Number(markets[marketKey].quoteDecimals);
      }
    });

    setTotalVolume(parseFloat(volume.toFixed(2)));
  }, [tradehistory, days]);

  const controlsContainer = (
    <div className="controls-container">
      <button
        className="control-button"
        onClick={() => setIsBlurred(!isBlurred)}
      >
        <div style={{ position: 'relative' }}>
          <Eye className="control-icon" size={12} />
          <div className={`port-eye-slash ${isBlurred ? '' : 'hidden'}`} />
        </div>
        {t('hideBalances')}
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
        {t('disconnect')}
      </button>
    </div>
  );

  const accountSummaryContainer = (
    <div
      className={`account-summary-container ${percentage >= 0 ? 'positive' : 'negative'}`}
    >
      <div className="account-header">{t('account')}</div>
      <div className="total-value-container">
        <span className={`total-value ${isBlurred ? 'blurred' : ''}`}>
          ${formatCommas(address ? totalAccountValue.toFixed(2) : '0.00')}
        </span>
        <div className="percentage-change-container">
          <span
            className={`percentage-value ${isBlurred ? 'blurred' : ''} ${
              percentage >= 0 ? 'positive' : 'negative'
            }`}
          >
            {portChartLoading ? (
              <div className="port-loading" style={{ width: 80 }} />
            ) : (
              `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`
            )}
          </span>
          <span className="time-range">
            ({t('past')} {getTimeRangeText(timeRange)})
          </span>
        </div>
      </div>
    </div>
  );

  const portfolioGraph = (
    <div className="graph-outer-container">
      {portChartLoading ? (
        <div className="graph-container">
          <Overlay isVisible={true} bgcolor={'#0f0f12'} height={20} />
        </div>
      ) : (
        <div className="graph-container">
          <span className="graph-label">{t('performance')}</span>
          <PortfolioGraph
            address={address}
            colorValue={portfolioColorValue}
            setColorValue={setPortfolioColorValue}
            isPopup={false}
            onPercentageChange={handlePercentageChange}
            chartData={chartData}
            portChartLoading={portChartLoading}
            chartDays={chartDays}
            setChartDays={setChartDays}
          />
        </div>
      )}
    </div>
  );

  const tradingStats = (
    <div className="trading-stats-container">
      <div className="trading-stats-header">
        <span className="trading-stats-title">{t('tradingStats')}</span>
      </div>
      <div className="stats-list">
        <div className="stat-row">
          {t('totalVol')}
          <span className={`account-stat-value ${isBlurred ? 'blurred' : ''}`}>
            {portChartLoading ? (
              <div className="port-loading" style={{ width: 80 }} />
            ) : (
              `$${formatCommas(address ? totalVolume.toFixed(2) : '0.00')}`
            )}
          </span>
        </div>
        <div className="stat-row">
          {t('sHigh')}
          <span className={`account-stat-value ${isBlurred ? 'blurred' : ''}`}>
            {portChartLoading ? (
              <div className="port-loading" style={{ width: 80 }} />
            ) : (
              `$${formatCommas(address ? high.toFixed(2) : '0.00')}`
            )}
          </span>
        </div>
        <div className="stat-row">
          {t('sLow')}
          <span className={`account-stat-value ${isBlurred ? 'blurred' : ''}`}>
            {portChartLoading ? (
              <div className="port-loading" style={{ width: 80 }} />
            ) : (
              `$${formatCommas(address ? low.toFixed(2) : '0.00')}`
            )}
          </span>
        </div>
        <div className="stat-row">
          {t('activeOrders')}
          <span className={`account-stat-value`}>
            {portChartLoading ? (
              <div className="port-loading" style={{ width: 80 }} />
            ) : (
              `${address ? activeOrders : 0}`
            )}
          </span>
        </div>
      </div>
    </div>
  );

  const referralStats = (
    <div className="referral-stats-container">
      <div className="referral-stats-header">
        <span className="referral-stats-title">{t('refStats')}</span>
      </div>
      <div className="referral-stats-list">
        <div className="stat-row">
          {t('claimableRewards')}
          <span className={`account-stat-value ${isBlurred ? 'blurred' : ''}`}>
            ${totalClaimableFees ? customRound(totalClaimableFees, 3) : '0.00'}
          </span>
        </div>
        <div className="stat-row">
          {t('myCode')}
          <span className={`account-stat-value`}>
            {refLink !== '' ? refLink : t('none')}
          </span>
        </div>
        <div className="stat-row">
          {t('usingCode')}
          <span className={`account-stat-value`}>
            {localStorage.getItem('ref') !== null
              ? localStorage.getItem('ref')
              : t('none')}
          </span>
        </div>
        {refLink === '' && (
          <Link
            className="create-code-text"
            to="/referrals"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              cursor: 'pointer',
            }}
            onClick={() => {
              setShowRefModal(true);
            }}
          >
            <span className="create-code-text">{t('noCode')}</span>
          </Link>
        )}
      </div>
    </div>
  );

  const orderSection = (
    <div className="order-section">
      <div className="portfolio-order-center-wrapper">
        <OrderCenter
          orders={orders}
          tradehistory={tradehistory}
          canceledorders={canceledorders}
          router={router}
          address={address}
          trades={trades}
          currentMarket={''}
          orderCenterHeight={orderCenterHeight}
          tokenList={tokenList}
          setTokenIn={setTokenIn}
          setTokenOut={setTokenOut}
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
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="portfolio-specific-page">
        <div className="portfolio-content-container">
          {controlsContainer}

          {accountSummaryContainer}

          {portfolioGraph}

          <div className="mobile-stats-container">
            {tradingStats}
            {referralStats}
          </div>

          {orderSection}
        </div>
      </div>
    );
  } else {
    return (
      <div className="portfolio-specific-page">
        <div className="portfolio-content-container">
          <div className="portfolio-left-column">
            {portfolioGraph}
            {orderSection}
          </div>
          <div className="account-stats-wrapper">
            {controlsContainer}
            {accountSummaryContainer}
            {tradingStats}
            {referralStats}
          </div>
        </div>
      </div>
    );
  }
};

export default Portfolio;
