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

import PerpsPositionsContent from './PerpsPositionsView/PerpsPositionContent';
import PerpsOpenOrdersContent from './PerpsOpenOrdersView/PerpsOpenOrdersContent';
import PerpsTradeHistoryContent from './PerpsTradeHistoryView/PerpsTradeHistoryContent';
import PerpsOrderHistoryContent from './PerpsOrderHistoryView/PerpsOrderHistoryContent';

import './OrderCenter.css';

const BREAKPOINT_HIDE_MARKET = 1180;
const BREAKPOINT_HIDE_TYPE = 460;
const BREAKPOINT_HIDE_PAGE_SIZE = 360;

type PerpsSection = 'positions' | 'openOrders' | 'tradeHistory' | 'orderHistory';
type SpotSection = 'balances' | 'orders' | 'tradeHistory' | 'orderHistory';
type ActiveSectionType = SpotSection | PerpsSection;

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
  activeSection: ActiveSectionType;
  setActiveSection: any;
  filter: 'all' | 'buy' | 'sell';
  setFilter: any;
  onlyThisMarket: boolean;
  setOnlyThisMarket: any;
  isPortfolio?: boolean;
  refetch: any;
  sendUserOperationAsync: any;
  setChain: any;
  isBlurred?: boolean;
  isVertDragging?: boolean;
  isOrderCenterVisible?: boolean;
  onLimitPriceUpdate?: (price: number) => void;
  openEditOrderPopup: (order: any) => void;
  openEditOrderSizePopup: (order: any) => void;
  marketsData: any;
  isPerps?: boolean; 
  perpsPositions?: any[]; 
  perpsOpenOrders?: any[]; 
  perpsTradeHistory?: any[];
  perpsOrderHistory?: any[];
  handleClose?: any;
}

const OrderCenter: React.FC<OrderCenterProps> = ({
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
  isVertDragging,
  isOrderCenterVisible,
  onLimitPriceUpdate,
  openEditOrderPopup,
  openEditOrderSizePopup,
  marketsData,
  isPerps = false,
  perpsPositions = [],
  perpsOpenOrders = [],
  perpsTradeHistory = [],
  perpsOrderHistory = [],
  handleClose = [],
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  
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
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showMarketOutside = windowWidth > BREAKPOINT_HIDE_MARKET;
  const showTypeOutside = windowWidth > BREAKPOINT_HIDE_TYPE;
  const showPageSize = windowWidth > BREAKPOINT_HIDE_PAGE_SIZE;
  
  const showMarketInDropdown = !showMarketOutside && !hideMarketFilter && onlyThisMarket !== undefined;
  const showTypeInDropdown = !showTypeOutside && filter !== undefined;
  const availableTabs: { key: any; label: any; }[] = [];

  const handleTabChange = (section: ActiveSectionType) => {
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
    if (isPerps) {
      switch (activeSection) {
        case 'positions':
          return Math.max(Math.ceil(perpsPositions.length / Number(pageSize)), 1);
        case 'openOrders':
          return Math.max(Math.ceil(perpsOpenOrders.length / Number(pageSize)), 1);
        case 'tradeHistory':
          return Math.max(Math.ceil(perpsTradeHistory.length / Number(pageSize)), 1);
        case 'orderHistory':
          return Math.max(Math.ceil(perpsOrderHistory.length / Number(pageSize)), 1);
        default:
          return 1;
      }
    } else {
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

  if (isPerps) {
    availableTabs.push(
      { key: 'positions', label: `${t('Positions')} (${perpsPositions.length})` },
      { key: 'openOrders', label: `${t('openOrders')} (${perpsOpenOrders.length})` },
      { key: 'tradeHistory', label: t('tradeHistory') },
      { key: 'orderHistory', label: t('orderHistory') }
    );
  } else {
    if (!hideBalances) {
      availableTabs.push({ key: 'balances', label: t('balances') });
    }
    availableTabs.push(
      { key: 'orders', label: `${t('openOrders')} (${filteredOrders.length})` },
      { key: 'tradeHistory', label: t('tradeHistory') },
      { key: 'orderHistory', label: t('orderHistory') }
    );
  }
  
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSection, address, onlyThisMarket, filter]);

  let noData = false;
  let noDataMessage = '';

  if (isPerps) {
    switch (activeSection) {
      case 'positions':
        noData = perpsPositions.length === 0;
        noDataMessage = t('noActivePositions');
        break;
      case 'openOrders':
        noData = perpsOpenOrders.length === 0;
        noDataMessage = t('noOpenOrders');
        break;
      case 'tradeHistory':
        noData = perpsTradeHistory.length === 0;
        noDataMessage = t('noTradeHistory');
        break;
      case 'orderHistory':
        noData = perpsOrderHistory.length === 0;
        noDataMessage = t('noOrderHistory');
        break;
    }
  } else {
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
        indicator.style.width = `${activeTab.offsetWidth+10}px`;
        indicator.style.left = `${activeTab.offsetLeft-5}px`;
      }
    }
  }

  useEffect(() => {
    const isMobileView = window.innerWidth <= 1020;
    updateIndicatorPosition(isMobileView, activeSection);
    
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      
      // Set resizing state to true immediately
      setIsResizing(true);
      
      // Clear any existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      // Set a timeout to re-enable transitions after resize is complete
      resizeTimeoutRef.current = setTimeout(() => {
        setIsResizing(false);
      }, 150); // Small delay to ensure resize is complete
      
      updateIndicatorPosition(width <= 1020, activeSection);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    let resizeObserver: any = null;
    if (!isMobileView && indicatorRef.current && tabsRef.current.length > 0) {
      resizeObserver = new ResizeObserver(() => {
        updateIndicatorPosition(isMobileView, activeSection);
      });
      tabsRef.current.forEach((tab) => {
        if (tab) resizeObserver.observe(tab);
      });
      const container = containerRef.current;
      if (container) resizeObserver.observe(container);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [activeSection]);

  const renderContent = () => {
    if (isPerps) {
      switch (activeSection) {
        case 'positions':
          return (
            <PerpsPositionsContent
              positions={perpsPositions}
              pageSize={pageSize}
              currentPage={currentPage}
              onMarketSelect={onMarketSelect}
              isBlurred={isBlurred}
              handleClose={handleClose}
            />
          );
        case 'openOrders':
          return (
            <PerpsOpenOrdersContent
              orders={perpsOpenOrders}
              pageSize={pageSize}
              currentPage={currentPage}
              onMarketSelect={onMarketSelect}
              onCancelOrder={(order) => {/* Handle cancel */}}
              onEditOrder={(order) => {/* Handle edit */}}
              isBlurred={isBlurred}
            />
          );
        case 'tradeHistory':
          return (
            <PerpsTradeHistoryContent
              tradehistory={perpsTradeHistory}
              pageSize={pageSize}
              currentPage={currentPage}
              onMarketSelect={onMarketSelect}
              isBlurred={isBlurred}
            />
          );
        case 'orderHistory':
          return (
            <PerpsOrderHistoryContent
              orderHistory={perpsOrderHistory}
              pageSize={pageSize}
              currentPage={currentPage}
              onMarketSelect={onMarketSelect}
              isBlurred={isBlurred}
            />
          );
        default:
          return null;
      }
    } else {
      switch (activeSection) {
        case 'balances':
          return (
            <div className="portfolio-assets-container">
              <PortfolioHeader onSort={onSort} sortConfig={sortConfig} />
              <PortfolioContent
                tokenList={tokenList}
                onMarketSelect={onMarketSelect}
                setSendTokenIn={setSendTokenIn}
                setpopup={setpopup}
                sortConfig={sortConfig}
                tokenBalances={tokenBalances}
                isBlurred={isBlurred} 
                marketsData={marketsData}
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
              onMarketSelect={onMarketSelect}
              setpopup={setpopup}
              onLimitPriceUpdate={onLimitPriceUpdate}
              openEditOrderPopup={openEditOrderPopup}
              openEditOrderSizePopup={openEditOrderSizePopup}
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
    }
  };

  return (
    <div
      ref={containerRef}
      className="oc-rectangle"
      style={{
        position: 'relative',
        height: (orderCenterHeight === 0 || isOrderCenterVisible == false ? '0px' : `${orderCenterHeight}px`),
        transition: (isVertDragging || isResizing) ? 'none' : 'height 0.1s ease',
        overflow: 'visible',
      }}
    >
      <div className="oc-top-bar">
        <div className="oc-types">
          {window.innerWidth > 1020 ? (
            <>
              <div className="oc-types-rectangle">
                {availableTabs.map(({ key, label }, index) => (
                  <div
                    key={key}
                    ref={(el) => (tabsRef.current[index] = el)}
                    className={`oc-type ${activeSection === key ? 'active' : ''}`}
                    onClick={() => handleTabChange(key as ActiveSectionType)}
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
                handleTabChange(key as ActiveSectionType);
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
              
              {showMarketOutside && !hideMarketFilter && onlyThisMarket !== undefined && setOnlyThisMarket && !isPerps && (
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
              
              {(showTypeInDropdown || showMarketInDropdown) && !isPerps && (
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
          maxHeight: noData ? '40px' : 'calc(100% - 38px)',
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