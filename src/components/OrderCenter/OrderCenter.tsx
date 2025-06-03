import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';

import PortfolioContent from '../Portfolio/BalancesContent/BalancesContent';
import PortfolioHeader from '../Portfolio/BalancesHeader/PortfolioHeader';
import DropdownMenu from './DropdownMenu/DropdownMenu';
import OrderHistoryContent from './OrderHistoryView/OrderHistoryContent';
import OrdersContent from './OrdersView/OrdersContent';
import TradeHistoryContent from './TradeHistoryView/TradeHistoryContent';
import MinSizeFilter from './MinSizeFilter/MinSizeFilter';
import CombinedHeaderFilter from './CombinedHeaderFilter/CombinedHeaderFilter';
import FilterSelect from './FilterSelect/FilterSelect';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';

import './OrderCenter.css';

const BREAKPOINT_HIDE_MARKET = 1180;
const BREAKPOINT_HIDE_TYPE = 460;
const BREAKPOINT_HIDE_PAGE_SIZE = 360;

interface OrderCenterProps {
  orders: any[];
  tradehistory: any[];
  canceledorders: any[];
  router: any;
  address: any;
  trades: any;
  currentMarket: string;
  orderCenterHeight: number;
  hideBalances?: boolean;
  tokenList: any[];
  onMarketSelect: (token: any) => void;
  setSendTokenIn: any;
  setpopup: (value: number) => void;
  hideMarketFilter?: boolean;
  sortConfig: any;
  onSort: (config: any) => void;
  tokenBalances: any;
  activeSection: 'balances' | 'orders' | 'tradeHistory' | 'orderHistory';
  setActiveSection: any;
  filter: 'all' | 'buy' | 'sell';
  setFilter: any;
  onlyThisMarket: boolean;
  setOnlyThisMarket: any;
  isPortfolio?: boolean;
  refetch: any;
  sendUserOperationAsync: any;
  setChain: any;
  waitForTxReceipt: any;
  isBlurred?: boolean;
  isVertDragging?: boolean;
  isOrderCenterVisible?: boolean;
}

const OrderCenter: React.FC<OrderCenterProps> = 
  ({
    orders,
    tradehistory,
    canceledorders,
    router,
    address,
    trades,
    currentMarket,
    orderCenterHeight,
    hideBalances = false,
    hideMarketFilter = false,
    tokenList,
    onMarketSelect,
    setSendTokenIn,
    setpopup,
    sortConfig,
    onSort,
    tokenBalances,
    activeSection,
    setActiveSection,
    filter,
    setFilter,
    onlyThisMarket,
    setOnlyThisMarket,
    isPortfolio,
    refetch,
    sendUserOperationAsync,
    setChain,
    isBlurred,
    waitForTxReceipt,
    isVertDragging,
    isOrderCenterVisible,
  }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isMobileView, setIsMobileView] = useState<boolean>(
      typeof window !== 'undefined' ? window.innerWidth <= 1020 : false,
    );
    
    const [windowWidth, setWindowWidth] = useState<number>(
      typeof window !== 'undefined' ? window.innerWidth : 1200
    );
    
    const [pageSize, setPageSize] = useState<number>(
      typeof window !== 'undefined'
        ? Number(localStorage.getItem('crystal_page_size') || '10')
        : 10,
    );
    const [currentPage, setCurrentPage] = useState<number>(1);

    const indicatorRef = useRef<HTMLDivElement>(null);
    const tabsRef = useRef<(HTMLDivElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    const showMarketOutside = windowWidth > BREAKPOINT_HIDE_MARKET;
    const showTypeOutside = windowWidth > BREAKPOINT_HIDE_TYPE;
    const showPageSize = windowWidth > BREAKPOINT_HIDE_PAGE_SIZE;
    
    const showMarketInDropdown = !showMarketOutside && !hideMarketFilter && onlyThisMarket !== undefined;
    const showTypeInDropdown = !showTypeOutside && filter !== undefined;
    const availableTabs: { key: any; label: any; }[] = [];

    const handleTabChange = (
      section:  'balances' | 'orders' | 'tradeHistory' | 'orderHistory' ,
    ) => {
      if (!isPortfolio) {
        localStorage.setItem('crystal_oc_tab', section);
      }
      setActiveSection(section);
      setIsDropdownOpen(false);
      setCurrentPage(1); 
      const element = document.getElementsByClassName('oc-content')[0];
      if (element) {
        element.scrollTop = 0;
      }
    };

    const matchesFilter = useCallback(
      (sideValue: number) =>
        filter === 'all' ||
        (filter === 'buy' && sideValue === 1) ||
        (filter === 'sell' && sideValue === 0),
      [filter]
    );
    
    const belongsToCurrentMarket = useCallback(
      (marketKey: string) => {
        if (!onlyThisMarket || !currentMarket) return true;
        const marketData = markets[marketKey];
        if (!marketData) return false;
        const marketSymbol = `${marketData.baseAsset}${marketData.quoteAsset}`;
        return marketSymbol === currentMarket;
      },
      [onlyThisMarket, currentMarket]
    );

    const handlePrevPage = () => {
      setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

    const handleNextPage = () => {
      let maxPages = getTotalPages();
      setCurrentPage((prev) => (prev < maxPages ? prev + 1 : prev));
    };
        
    const getTotalPages = (): number => {
      switch (activeSection) {
        case 'orders':
          return Math.max(Math.ceil(filteredOrders.length / Number(pageSize)), 1);
        case 'tradeHistory':
          return Math.max(Math.ceil(filteredTradeHistory.length / Number(pageSize)), 1);
        case 'orderHistory':
          return Math.max(Math.ceil(filteredOrderHistory.length / Number(pageSize)), 1);
        default:
          return 1;
      }
    };

    const filteredOrders = useMemo(() => {
      return orders.filter(order => matchesFilter(order[3]) && belongsToCurrentMarket(order[4]));
    }, [orders, matchesFilter, belongsToCurrentMarket]);

    const filteredTradeHistory = useMemo(() => {
      return tradehistory.filter(trade => matchesFilter(trade[2]) && belongsToCurrentMarket(trade[4]));
    }, [tradehistory, matchesFilter, belongsToCurrentMarket]);

    const filteredOrderHistory = useMemo(() => {
      return canceledorders.filter(order => matchesFilter(order[3]) && belongsToCurrentMarket(order[4]));
    }, [canceledorders, matchesFilter, belongsToCurrentMarket]);

    if (!hideBalances) {
      availableTabs.push({ key: 'balances', label: t('balances') });
    }
    availableTabs.push(
      {
        key: 'orders',
        label: `${t('openOrders')} (${filteredOrders.length})`,
      },
      { key: 'tradeHistory', label: t('tradeHistory') },
      { key: 'orderHistory', label: t('orderHistory') }
    );
    
    useEffect(() => {
      setCurrentPage(1);
    }, [activeSection, address, onlyThisMarket, filter]);

    let noData = false;
    let noDataMessage = '';

    switch (activeSection) {
      case 'balances':
        const tokensEmpty = Object.values(tokenBalances).every(
          (balance) => balance === 0n,
        );
        noData = tokensEmpty;
        noDataMessage = t('noTokensDetected');
        break;
      case 'orders':
        noData = filteredOrders.length === 0;
        noDataMessage = t('noOpenOrders');
        break;
      case 'tradeHistory':
        noData = filteredTradeHistory.length === 0;
        noDataMessage = t('noTradeHistory');
        break;
      case 'orderHistory':
        noData = filteredOrderHistory.length === 0;
        noDataMessage = t('noOrderHistory');
        break;
    }
    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };
    
    const updateIndicatorPosition = (mobile: boolean, section: string) => {
      if (mobile || !indicatorRef.current || !tabsRef.current) {
        if (indicatorRef.current) {
          indicatorRef.current.style.width = '0px';
          indicatorRef.current.style.left = '0px';
        }
        return;
      }
      
      const activeTabIndex = availableTabs.findIndex(tab => tab.key === section);
      if (activeTabIndex !== -1) {
        const activeTab = tabsRef.current[activeTabIndex];
        if (activeTab && activeTab.parentElement) {
          const indicator = indicatorRef.current;
          indicator.style.width = `${activeTab.offsetWidth}px`;
          indicator.style.left = `${activeTab.offsetLeft}px`;
        }
      }
    }

    useEffect(() => {
      if (!isPortfolio && activeSection === 'balances') {
        setActiveSection(
          localStorage.getItem('crystal_oc_tab') !== null
            ? localStorage.getItem('crystal_oc_tab')
            : 'orders',
        );
      }
      else if (isPortfolio) {
        setActiveSection('balances');
      }
      const handleResize = () => {
        const width = window.innerWidth;
        setIsMobileView(width <= 1020);
        setWindowWidth(width);
        updateIndicatorPosition(width <= 1020, activeSection);
      };
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, [isPortfolio, activeSection]);

    useEffect(() => {
      updateIndicatorPosition(isMobileView, activeSection);
      if (!isMobileView && indicatorRef.current && tabsRef.current.length > 0) {
        const resizeObserver = new ResizeObserver(() => {
          updateIndicatorPosition(isMobileView, activeSection);
        });
        tabsRef.current.forEach((tab) => {
          if (tab) resizeObserver.observe(tab);
        });
        const container = containerRef.current;
        if (container) resizeObserver.observe(container);
        return () => {
          resizeObserver.disconnect();
        };
      }
    }, [isMobileView, activeSection]);

    const renderContent = () => {
      switch (activeSection) {
        case 'balances':
          return (
            <div className="portfolio-assets-container">
              <PortfolioHeader onSort={onSort} sortConfig={sortConfig} />
              <PortfolioContent
                trades={trades}
                tokenList={tokenList}
                onMarketSelect={onMarketSelect}
                setSendTokenIn={setSendTokenIn}
                setpopup={setpopup}
                sortConfig={sortConfig}
                tokenBalances={tokenBalances}
                isBlurred={isBlurred} 
              />
            </div>
          );
        case 'orders':
          return (
            <OrdersContent
              orders={filteredOrders}
              router={router}
              address={address}
              trades={trades}
              refetch={refetch}
              sendUserOperationAsync={sendUserOperationAsync}
              pageSize={pageSize}
              currentPage={currentPage}
              setChain={setChain}
              waitForTxReceipt={waitForTxReceipt}
              onMarketSelect={onMarketSelect}
            />
          );
        case 'tradeHistory':
          return (
            <TradeHistoryContent
              tradehistory={filteredTradeHistory}
              pageSize={pageSize}
              currentPage={currentPage}
              trades={trades}
              onMarketSelect={onMarketSelect}
            />
          );
        case 'orderHistory':
          return (
            <OrderHistoryContent
              canceledorders={filteredOrderHistory}
              onlyThisMarket={hideMarketFilter ? false : onlyThisMarket}
              currentMarket={currentMarket}
              pageSize={pageSize}
              currentPage={currentPage}
              trades={trades}
              onMarketSelect={onMarketSelect}
            />
          );
        default:
          return null;
      }
    };

    return (
      <div
        ref={containerRef}
        className="oc-rectangle"
        style={{
          position: 'relative',
          height: orderCenterHeight === 0 || isOrderCenterVisible == false ? '0px' : `${orderCenterHeight}px`,
          transition: isVertDragging ? 'none' : 'height 0.1s ease',
          overflow: 'visible',
        }}
      >
        <div className="oc-top-bar">
          <div className="oc-types">
            {!isMobileView ? (
              <>
                <div className="oc-types-rectangle">
                  {availableTabs.map(({ key, label }, index) => (
                    <div
                      key={key}
                      ref={(el) => (tabsRef.current[index] = el)}
                      className={`oc-type ${activeSection === key ? 'active' : ''
                        }`}
                      onClick={() =>
                        handleTabChange(key as typeof activeSection)
                      }
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div ref={indicatorRef} className="oc-sliding-indicator" />
              </>
            ) : (
              <DropdownMenu
                isOpen={isDropdownOpen}
                toggleDropdown={() => setIsDropdownOpen(!isDropdownOpen)}
                items={availableTabs}
                activeItem={activeSection}
                onItemSelect={(key) => {
                  handleTabChange(key as typeof activeSection);
                  setIsDropdownOpen(false);
                }}
              />
            )}
          </div>
          
          <div className="oc-filters">
            {activeSection !== 'balances' && (
              <>
                {showTypeOutside && filter !== undefined && setFilter && (
                  <div className="oc-filter-item type-filter">
                    <FilterSelect filter={filter} setFilter={setFilter} inDropdown={false} />
                  </div>
                )}
                
                {showMarketOutside && !hideMarketFilter && onlyThisMarket !== undefined && setOnlyThisMarket && (
                  <div className="oc-filter-item market-filter">
                    <ToggleSwitch
                      checked={onlyThisMarket}
                      onChange={() => setOnlyThisMarket(!onlyThisMarket)}
                      label={t('onlyCurrentMarket')}
                    />
                  </div>
                )}
                
                <CombinedHeaderFilter 
                  pageSize={Number(pageSize)} 
                  setPageSize={setPageSize}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalPages={getTotalPages()}
                  onPrevPage={handlePrevPage}
                  onNextPage={handleNextPage}
                  onPageChange={handlePageChange}
                  showPageSize={showPageSize}
                />
                
                {(showTypeInDropdown || showMarketInDropdown) && (
                  <MinSizeFilter
                    filter={showTypeInDropdown ? filter : undefined}
                    setFilter={showTypeInDropdown ? setFilter : undefined}
                    onlyThisMarket={showMarketInDropdown ? onlyThisMarket : undefined}
                    setOnlyThisMarket={showMarketInDropdown ? setOnlyThisMarket : undefined}
                    hideMarketFilter={hideMarketFilter}
                    showMarketFilter={showMarketInDropdown}
                    showTypeFilter={showTypeInDropdown}
                  />
                )}
              </>
            )}
          </div>
        </div>

        <div
          className="oc-content"
          style={{
            overflowY: noData ? 'hidden' : 'auto',
            maxHeight: noData ? '40px' : 'calc(100% - 36.67px)',
            flex: 1,
          }}
        >
          {renderContent()}
        </div>

        {noData && (
          <div className="oc-no-data-container">
            <span className="oc-no-data">{noDataMessage}</span>
          </div>
        )}
      </div>
    );
  }

export default OrderCenter;