import React, { useEffect, useRef } from 'react';

import OrderbookView from './OrderbookView/OrderbookView';
import TradesView from './TradesView/TradesView';

import './Orderbook.css';

interface OrderBookProps {
  trades: any[];
  orderdata: any;
  activemarket: any;
  layoutSettings: any;
  orderbookPosition: any;
  hideHeader?: boolean;
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
  userOrders: any[];
}

const OrderBook: React.FC<OrderBookProps> = ({
  trades,
  orderdata,
  activemarket,
  layoutSettings,
  orderbookPosition,
  hideHeader = false,
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
  userOrders = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<(HTMLDivElement | null)[]>([]);

  const displayBuyOrders = orderdata.roundedBuyOrders;
  const displaySellOrders = orderdata.roundedSellOrders;
  const priceFactor = orderdata.priceFactor;
  const spreadData = orderdata.spreadData;
  const symbolIn = orderdata.symbolIn;
  const symbolOut = orderdata.symbolOut;

  const filteredUserOrders = userOrders.filter(order => {
    return order[4] === (activemarket?.baseAsset + activemarket?.quoteAsset);
  });

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
  }, [activeTab, layoutSettings, orderbookPosition]);

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
        roundedBuy={displayBuyOrders}
        roundedSell={displaySellOrders}
        spreadData={spreadData}
        priceFactor={priceFactor}
        symbolIn={symbolIn}
        symbolOut={symbolOut}
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
        userOrders={filteredUserOrders}
        activeMarket={activemarket?.baseAsset + activemarket?.quoteAsset}
      />

      <TradesView
        trades={trades}
        show={activeTab === 'trades' ? true : false}
      />
    </div>
  );
};

export default OrderBook;