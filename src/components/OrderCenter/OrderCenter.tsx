import React, { memo, useEffect, useRef, useState } from 'react';

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
  setTokenIn: (token: any) => void;
  setTokenOut: (token: any) => void;
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
  isBlurred?: boolean;
}

const OrderCenter: React.FC<OrderCenterProps> = memo(
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
    setTokenIn,
    setTokenOut,
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

  }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isMobileView, setIsMobileView] = useState<boolean>(
      typeof window !== 'undefined' ? window.innerWidth <= 1020 : false,
    );
    
    const [windowWidth, setWindowWidth] = useState<number>(
      typeof window !== 'undefined' ? window.innerWidth : 1200
    );
    
    const [minSizeEnabled, setMinSizeEnabled] = useState<boolean>(
      typeof window !== 'undefined'
        ? localStorage.getItem('crystal_min_size_enabled') === 'true'
        : false,
    );
    const [minSizeValue, setMinSizeValue] = useState<string>(
      typeof window !== 'undefined'
        ? localStorage.getItem('crystal_min_size_value') || '0'
        : '0',
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
    
    const showSizeInDropdown = true;
    
    const showMarketInDropdown = !showMarketOutside && !hideMarketFilter && onlyThisMarket !== undefined;
    const showTypeInDropdown = !showTypeOutside && filter !== undefined;

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

    const matchesFilter = (sideValue: number) =>
      filter === 'all' ||
      (filter === 'buy' && sideValue === 1) ||
      (filter === 'sell' && sideValue === 0);

    const belongsToCurrentMarket = (marketKey: string) => {
      if (!onlyThisMarket || !currentMarket) return true;
      const marketData = markets[marketKey];
      if (!marketData) return false;
      const marketSymbol = `${marketData.baseAsset}${marketData.quoteAsset}`;
      return marketSymbol === currentMarket;
    };

    const debugValue = false;

    const filteredOrders = orders.filter((order) => {
      const sideMatch = matchesFilter(order[3]);
      const marketMatch = belongsToCurrentMarket(order[4]);

      let valueMatch = true;
      if (minSizeEnabled && minSizeValue !== '') {
        try {
          const marketData = markets[order[4]];
          if (marketData) {
            const scaleFactor = Number(marketData.scaleFactor || 1);
            const quoteDecimals = Number(marketData.quoteDecimals || 18);

            const usdValue = Number(order[8]) / (scaleFactor * 10 ** quoteDecimals);

            if (debugValue) {
              console.log("Open Order:", {
                orderId: order[0],
                orderValue: usdValue,
                minSizeValue: parseFloat(minSizeValue),
                matches: usdValue >= parseFloat(minSizeValue)
              });
            }

            valueMatch = usdValue >= parseFloat(minSizeValue);
          }
        } catch (error) {
          console.error("Error filtering open order:", error);
          valueMatch = true;
        }
      }

      return sideMatch && marketMatch && valueMatch;
    });

    const filteredTradeHistory = tradehistory.filter((trade) => {
      const sideMatch = matchesFilter(trade[2]);
      const marketMatch = belongsToCurrentMarket(trade[4]);

      let valueMatch = true;
      if (minSizeEnabled && minSizeValue !== '') {
        try {
          const value = trade[2] === 1 ? trade[0] : trade[1];
          const numericValue = typeof value === 'bigint' ?
            Number(value) / (10 ** Number(markets[trade[4]]?.quoteDecimals || 18)) :
            Number(value) / (10 ** Number(markets[trade[4]]?.quoteDecimals || 18));

          if (debugValue) {
            console.log("Trade History:", {
              tradeId: trade[0],
              tradeValue: numericValue,
              minSizeValue: parseFloat(minSizeValue),
              matches: numericValue >= parseFloat(minSizeValue)
            });
          }

          valueMatch = numericValue >= parseFloat(minSizeValue);
        } catch (error) {
          console.error("Error filtering trade history:", error);
          valueMatch = true;
        }
      }

      return sideMatch && marketMatch && valueMatch;
    });

    const filteredOrderHistory = canceledorders.filter((order) => {
      const sideMatch = matchesFilter(order[3]);
      const marketMatch = belongsToCurrentMarket(order[4]);

      let valueMatch = true;
      if (minSizeEnabled && minSizeValue !== '') {
        try {
          const marketData = markets[order[4]];
          if (marketData) {
            const priceFactor = Number(marketData.priceFactor || 1);
            const baseDecimals = Number(marketData.baseDecimals || 18);

            const amount = Number(order[2]) / (10 ** baseDecimals);
            const price = Number(order[0]) / priceFactor;
            const value = amount * price;

            if (debugValue) {
              console.log("Order History:", {
                orderId: order[0],
                amount: amount,
                price: price,
                orderValue: value,
                minSizeValue: parseFloat(minSizeValue),
                matches: value >= parseFloat(minSizeValue)
              });
            }

            valueMatch = value >= parseFloat(minSizeValue);
          }
        } catch (error) {
          console.error("Error filtering order history:", error);
          valueMatch = true;
        }
      }

      return sideMatch && marketMatch && valueMatch;
    });
    
    const availableTabs: { key: any; label: any; }[] = [];
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

    const handlePrevPage = () => {
      setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };
  
    const handleNextPage = () => {
      let maxPages = getTotalPages();
      setCurrentPage((prev) => (prev < maxPages ? prev + 1 : prev));
    };
    useEffect(() => {
      if (isPortfolio) {
        setActiveSection('balances');
      }
    }, []); 
    
    useEffect(() => {
      setCurrentPage(1);
    }, [activeSection, pageSize]);
    
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
    
    const renderContent = () => {
      switch (activeSection) {
        case 'balances':
          return (
            <>
              <PortfolioHeader onSort={onSort} sortConfig={sortConfig} />
              <div className="portfolio-assets-container">
                <PortfolioContent
                  trades={trades}
                  tokenList={tokenList}
                  setTokenIn={setTokenIn}
                  setTokenOut={setTokenOut}
                  setSendTokenIn={setSendTokenIn}
                  setpopup={setpopup}
                  sortConfig={sortConfig}
                  tokenBalances={tokenBalances}
                  isBlurred={isBlurred} 
                />
              </div>
            </>
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
            />
          );
        case 'tradeHistory':
          return (
            <TradeHistoryContent
              tradehistory={filteredTradeHistory}
              pageSize={pageSize}
              currentPage={currentPage}
              trades={trades}
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
            />
          );
        default:
          return null;
      }
    };

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
    
    const updateIndicatorPosition = () => {
      if (isMobileView || !indicatorRef.current || !tabsRef.current) {
        if (indicatorRef.current) {
          indicatorRef.current.style.width = '0px';
          indicatorRef.current.style.left = '0px';
        }
        return;
      }
      
      const activeTabIndex = availableTabs.findIndex(tab => tab.key === activeSection);
      
      if (activeTabIndex !== -1) {
        const activeTab = tabsRef.current[activeTabIndex];
        if (activeTab && activeTab.parentElement) {
          const indicator = indicatorRef.current;
          indicator.style.width = `${activeTab.offsetWidth}px`;
          indicator.style.left = `${activeTab.offsetLeft}px`;
        }
      }
    };

    useEffect(() => {
      updateIndicatorPosition();
    }, [activeSection, isMobileView, filteredOrders.length, hideBalances]);

    useEffect(() => {
      if (!isPortfolio && activeSection === 'balances') {
        setActiveSection(
          localStorage.getItem('crystal_oc_tab') !== null
            ? localStorage.getItem('crystal_oc_tab')
            : 'orders',
        );
      }
    }, [isPortfolio, activeSection, setActiveSection]);

    useEffect(() => {
      if (!isMobileView && indicatorRef.current && tabsRef.current.length > 0) {
        const resizeObserver = new ResizeObserver(() => {
          updateIndicatorPosition();
        });
        tabsRef.current.forEach((tab) => {
          if (tab) resizeObserver.observe(tab);
        });
        const container = containerRef.current;
        if (container) resizeObserver.observe(container);
        updateIndicatorPosition();
        return () => {
          resizeObserver.disconnect();
        };
      }
    }, [activeSection, isMobileView, filteredOrders.length, hideBalances]);

    useEffect(() => {
      const handleResize = () => {
        const width = window.innerWidth;
        setIsMobileView(width <= 1020);
        setWindowWidth(width);
        updateIndicatorPosition();
      };
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className="oc-rectangle"
        style={{
          position: 'relative',
          height: orderCenterHeight === 0 ? '0px' : `${orderCenterHeight}px`,
          transition: 'height 0.1s ease',
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
                  totalPages={getTotalPages()}
                  onPrevPage={handlePrevPage}
                  onNextPage={handleNextPage}
                  onPageChange={handlePageChange}
                  showPageSize={showPageSize}
                />
              </>
            )}
            
            <div className="size-filter-divider"/>
            <MinSizeFilter
              minSizeEnabled={minSizeEnabled}
              setMinSizeEnabled={setMinSizeEnabled}
              minSizeValue={minSizeValue}
              setMinSizeValue={setMinSizeValue}
              filter={showTypeInDropdown ? filter : undefined}
              setFilter={showTypeInDropdown ? setFilter : undefined}
              onlyThisMarket={showMarketInDropdown ? onlyThisMarket : undefined}
              setOnlyThisMarket={showMarketInDropdown ? setOnlyThisMarket : undefined}
              hideMarketFilter={hideMarketFilter}
              showMarketFilter={showMarketInDropdown}
              showTypeFilter={showTypeInDropdown}
              showSizeFilter={showSizeInDropdown}
              alwaysShowButton={true}
            />
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
  },
);

export default OrderCenter;