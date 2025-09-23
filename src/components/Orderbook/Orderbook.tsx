import React, { useEffect, useRef } from 'react';

import OrderbookView from './OrderbookView/OrderbookView';
import TradesView from './TradesView/TradesView';

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
}

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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<(HTMLDivElement | null)[]>([]);

  const updateIndicator = () => {
    if (!headerRef.current || !indicatorRef.current) return;

    const headerWidth = headerRef.current.offsetWidth;
    const indicatorWidth = headerWidth / 2;
    const activeTabIndex = activeTab === 'orderbook' ? 0 : 1;
    const leftPosition = activeTabIndex * indicatorWidth;

    indicatorRef.current.style.width = `${indicatorWidth}px`;
    indicatorRef.current.style.left = `${leftPosition}px`;
  };
  
  const handleTabClick = (tab: 'orderbook' | 'trades') => {
    setActiveTab(tab);
    updateIndicator();
  };

  useEffect(() => {
    localStorage.setItem('ob_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();

    const resizeObserver = new ResizeObserver(() => {
      updateIndicator();
    });

    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeTab, layoutSettings, orderbookPosition, hideHeader]);

  return (
    <div className="ob-container" ref={containerRef}>
      {!hideHeader && (
        <div className="ob-header" ref={headerRef}>
          <div className="ob-tabs">
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
          <div ref={indicatorRef} className="ob-sliding-indicator" />
        </div>
      )}

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
        show={activeTab === 'orderbook' ? true : false}
        updateLimitAmount={updateLimitAmount}
        reserveQuote={reserveQuote}
        reserveBase={reserveBase}
        isOrderbookLoading={isOrderbookLoading}
      />

      <TradesView
        trades={trades}
        show={activeTab === 'trades' ? true : false}
        symbolQuote={orderdata.symbolIn}
      />
    </div>
  );
};

export default OrderBook;