import React, { useEffect, useRef, useState, useMemo } from 'react';

import OrderbookView from './OrderbookView/OrderbookView';
import TradesView from './TradesView/TradesView';
import filter from '../../assets/filter.svg';
import './Orderbook.css';

interface OrderBookProps {
  trades: any[];
  orderdata: any;
  layoutSettings: any;
  orderbookPosition: any;
  hideHeader: boolean;
  interval: number;
  amountsQuote: any;
  setAmountsQuote: any;
  obInterval: number;
  setOBInterval: any;
  viewMode: 'both' | 'buy' | 'sell';
  setViewMode: any;
  activeTab: 'orderbook' | 'trades';
  setActiveTab: any;
  updateLimitAmount: any;
  reserveQuote: any;
  reserveBase: any;
  isOrderbookLoading?: boolean;
  perps?: boolean;
}

type LayoutMode = 'tab' | 'stacked' | 'large';

const OrderBook: React.FC<OrderBookProps> = ({
  trades,
  orderdata,
  layoutSettings,
  orderbookPosition,
  hideHeader,
  interval,
  amountsQuote,
  setAmountsQuote,
  obInterval,
  setOBInterval,
  viewMode,
  setViewMode,
  activeTab,
  setActiveTab,
  updateLimitAmount,
  reserveQuote,
  reserveBase,
  isOrderbookLoading,
  perps
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<(HTMLDivElement | null)[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('tab');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const layoutOptions = [
    { value: 'tab' as LayoutMode, label: 'Tab'},
    { value: 'stacked' as LayoutMode, label: 'Stacked'},
    { value: 'large' as LayoutMode, label: 'Large'},
  ];

  const currentOption = layoutOptions.find(option => option.value === layoutMode);

  useEffect(() => {
    const savedLayoutMode = localStorage.getItem('ob_layout_mode') as LayoutMode;
    if (savedLayoutMode && ['tab', 'stacked', 'large'].includes(savedLayoutMode)) {
      setLayoutMode(savedLayoutMode);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateIndicator = () => {
    if (!headerRef.current || !indicatorRef.current || !tabsRef.current.length || layoutMode !== 'tab') return;
    const activeTabElement = tabsRef.current.find(tab => 
      tab && tab.classList.contains('ob-active')
    );
    
    if (activeTabElement) {
      const indicator = indicatorRef.current;
      indicator.style.width = `${activeTabElement.offsetWidth}px`;
      indicator.style.left = `${activeTabElement.offsetLeft}px`;
    }
  };
  
  const handleTabClick = (tab: 'orderbook' | 'trades') => {
    setActiveTab(tab);
    setTimeout(() => updateIndicator(), 0);
  };

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
    setIsDropdownOpen(false);
    localStorage.setItem('ob_layout_mode', mode);
  };

  useEffect(() => {
    if (perps) {
      localStorage.setItem('perps_ob_active_tab', activeTab);
    }
    else {
      localStorage.setItem('ob_active_tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();

    const resizeObserver = new ResizeObserver(() => {
      updateIndicator();
    });
    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }
    tabsRef.current.forEach(tab => {
      if (tab) resizeObserver.observe(tab);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeTab, layoutSettings, orderbookPosition, hideHeader, layoutMode]);

  const LayoutDropdown = useMemo(() => (
    <div className="layout-dropdown" ref={dropdownRef}>
      <button
        className="layout-dropdown-trigger"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
       <img src={filter} className="filter-icon"/>
      </button>

      {isDropdownOpen && (
        <div className="layout-dropdown-menu">
          {layoutOptions.map((option) => (
            <button
              key={option.value}
              className={`layout-dropdown-option ${
                layoutMode === option.value ? 'active' : ''
              }`}
              onClick={() => handleLayoutChange(option.value)}
            >
              <span className="layout-dropdown-option-content">
                <span className="layout-dropdown-option-label">{option.label}</span>
              </span>
              {layoutMode === option.value && (
                <svg
                  className="layout-dropdown-check"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  ), [layoutMode, isDropdownOpen, currentOption]);

  const renderTabMode = () => (
    <>
      <OrderbookView
        roundedBuy={orderdata.roundedBuyOrders}
        roundedSell={orderdata.roundedSellOrders}
        spreadData={orderdata.spreadData}
        priceFactor={orderdata.priceFactor}
        symbolQuote={orderdata.symbolIn}
        symbolBase={orderdata.symbolOut}
        marketType={orderdata.marketType}
        orderbookPosition={orderbookPosition}
        interval={interval}
        amountsQuote={amountsQuote}
        setAmountsQuote={setAmountsQuote}
        obInterval={obInterval}
        setOBInterval={setOBInterval}
        viewMode={viewMode}
        setViewMode={setViewMode}
        show={activeTab === 'orderbook'}
        updateLimitAmount={updateLimitAmount}
        reserveQuote={reserveQuote}
        reserveBase={reserveBase}
        isOrderbookLoading={isOrderbookLoading}
        perps={perps}
      />
      <TradesView
        trades={trades}
        show={activeTab === 'trades'}
        symbolQuote={perps ? orderdata.symbolIn : orderdata.symbolOut}
      />
    </>
  );

  const renderStackedMode = () => (
    <div className="ob-stacked-layout">
      <div className="ob-stacked-section">
        <div className="ob-section-header">
          <div className="ob-section-header-content">
            <div>Order Book</div>
            <div>{LayoutDropdown}</div>
          </div>
        </div>
        <OrderbookView
          roundedBuy={orderdata.roundedBuyOrders}
          roundedSell={orderdata.roundedSellOrders}
          spreadData={orderdata.spreadData}
          priceFactor={orderdata.priceFactor}
          symbolQuote={orderdata.symbolIn}
          symbolBase={orderdata.symbolOut}
          marketType={orderdata.marketType}
          orderbookPosition={orderbookPosition}
          interval={interval}
          amountsQuote={amountsQuote}
          setAmountsQuote={setAmountsQuote}
          obInterval={obInterval}
          setOBInterval={setOBInterval}
          viewMode={viewMode}
          setViewMode={setViewMode}
          show={true}
          updateLimitAmount={updateLimitAmount}
          reserveQuote={reserveQuote}
          reserveBase={reserveBase}
          isOrderbookLoading={isOrderbookLoading}
          perps={perps}
        />
      </div>
      <div className="ob-stacked-section">
        <div className="ob-trades-header">
          <div>Trades</div>
        </div>
        <TradesView
          trades={trades}
          show={true}
          symbolQuote={orderdata.symbolIn}
        />
      </div>
    </div>
  );

  const renderLargeMode = () => (
    <div className="ob-large-layout">
      <div className="ob-large-section-orderbook">
        <div className="ob-section-header">
          <div className="ob-section-header-content">
            <div>Order Book</div>
          </div>
        </div>
        <OrderbookView
          roundedBuy={orderdata.roundedBuyOrders}
          roundedSell={orderdata.roundedSellOrders}
          spreadData={orderdata.spreadData}
          priceFactor={orderdata.priceFactor}
          symbolQuote={orderdata.symbolIn}
          symbolBase={orderdata.symbolOut}
          marketType={orderdata.marketType}
          orderbookPosition={orderbookPosition}
          interval={interval}
          amountsQuote={amountsQuote}
          setAmountsQuote={setAmountsQuote}
          obInterval={obInterval}
          setOBInterval={setOBInterval}
          viewMode={viewMode}
          setViewMode={setViewMode}
          show={true}
          updateLimitAmount={updateLimitAmount}
          reserveQuote={reserveQuote}
          reserveBase={reserveBase}
          isOrderbookLoading={isOrderbookLoading}
          perps={perps}
        />
      </div>
      <div className="ob-large-section-trades">
        <div className="ob-section-header">
          <div>Trades</div>
          <div>{LayoutDropdown}</div>
        </div>
        <TradesView
          trades={trades}
          show={true}
          symbolQuote={orderdata.symbolIn}
        />
      </div>
    </div>
  );

  return (
    <div className={`ob-container`} ref={containerRef}>
      {!hideHeader && layoutMode === 'tab' && (
        <div className="ob-header">
          <div className="ob-header-content">
            <div className="ob-tabs" ref={headerRef}>
              <div
                ref={(el) => (tabsRef.current[0] = el)}
                className={`ob-tab ${activeTab === 'orderbook' ? 'ob-active' : ''}`}
                onClick={() => handleTabClick('orderbook')}
              >
                {t('orderbook')}
              </div>
              <div
                ref={(el) => (tabsRef.current[1] = el)}
                className={`ob-tab ${activeTab === 'trades' ? 'ob-active' : ''}`}
                onClick={() => handleTabClick('trades')}
              >
                {t('trades')}
              </div>
            </div>
            {LayoutDropdown}
          </div>
          <div ref={indicatorRef} className="ob-sliding-indicator" />
        </div>
      )}

      {layoutMode === 'tab' && renderTabMode()}
      {layoutMode === 'stacked' && renderStackedMode()}
      {layoutMode === 'large' && renderLargeMode()}
    </div>
  );
};

export default OrderBook;