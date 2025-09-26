import React, { useEffect, useLayoutEffect, useRef, useMemo, useState } from 'react';

import DropdownContext from './DropdownContext/DropdownContext';
import OrderList from './OrderList/OrderList';
import OrderListHeader from './OrderListHeader/OrderListHeader';
import PriceIntervals from './PriceIntervalSelect/PriceIntervals';
import SpreadDisplay from './SpreadDisplay/SpreadDisplay';
import ViewModeButtons from './ViewModeButtons/ViewModeButtons';

import { scaleOrders } from '../utils';

import './OrderbookView.css';

interface OrderbookViewProps {
  roundedBuy: any[];
  roundedSell: any[];
  spreadData: any;
  priceFactor: number;
  symbolQuote: string;
  symbolBase: string;
  marketType: any;
  orderbookPosition: string;
  interval: number;
  amountsQuote: string;
  setAmountsQuote: (quote: string) => void;
  obInterval: number;
  setOBInterval: (interval: number) => void;
  viewMode: 'both' | 'buy' | 'sell';
  setViewMode: (mode: 'both' | 'buy' | 'sell') => void;
  show?: boolean;
  updateLimitAmount: any;
  reserveQuote: any;
  reserveBase: any;
  isOrderbookLoading?: boolean;
  perps?: boolean;
}

const OrderbookView: React.FC<OrderbookViewProps> = ({
  roundedBuy,
  roundedSell,
  spreadData,
  priceFactor,
  symbolQuote,
  symbolBase,
  marketType,
  orderbookPosition,
  interval,
  amountsQuote,
  setAmountsQuote,
  obInterval,
  setOBInterval,
  viewMode,
  setViewMode,
  updateLimitAmount,
  show = true,
  reserveQuote,
  reserveBase,
  isOrderbookLoading,
  perps
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const updateContainerHeight = () => {
    if (!containerRef.current) return;
    requestAnimationFrame(() => {
      const rect = containerRef.current?.getBoundingClientRect();
      const newHeight = rect?.height || 0;
      setContainerHeight(prev =>
        Math.abs(newHeight - prev) > 1 && newHeight !== 0 ? newHeight : prev
      );
    });
  }

  useLayoutEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    const newHeight = rect?.height || 0;
    setContainerHeight(prev =>
      Math.abs(newHeight - prev) > 1 && newHeight !== 0 ? newHeight : prev
    );
    const resizeObserver = new ResizeObserver(updateContainerHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('ob_viewmode', viewMode);
  }, [viewMode]);

  const { orders: processedBuyOrders, leftoverPerRow: extraBuy } = useMemo(() => {
    return scaleOrders(
      roundedBuy,
      reserveBase,
      reserveQuote,
      obInterval,
      true,
      viewMode,
      containerHeight,
      20.5,
    );
  }, [roundedBuy, obInterval, viewMode, containerHeight]);

  const { orders: processedSellOrders, leftoverPerRow: extraSell } = useMemo(() => {
    return scaleOrders(
      roundedSell,
      reserveBase,
      reserveQuote,
      obInterval,
      false,
      viewMode,
      containerHeight,
      20.5
    );
  }, [roundedSell, obInterval, viewMode, containerHeight]);

  const adjustedMaxSize = useMemo(() => {
    const lastBuySize = processedBuyOrders
      .filter((order) => order.price !== 0)
      .slice(-1)[0]?.totalSize || 0;

    const lastSellSize = processedSellOrders
      .filter((order) => order.price !== 0)
      .slice(-1)[0]?.totalSize || 0;
    return Math.max(lastBuySize, lastSellSize);
  }, [processedBuyOrders, processedSellOrders]);

  const loadingData = useMemo(() => {
    if (containerHeight === 0) return { rowCount: 0, extra: 0 };
    
    const baseHeight = 20.5;
    const spreadHeight = 29; 
    const bufferHeight = 17; 
    const availableHeight = containerHeight - spreadHeight - bufferHeight;
    
    if (availableHeight <= 0) return { rowCount: 0, extra: 0 };
    
    let rowCount;
    if (viewMode === 'both') {
      rowCount = Math.floor(availableHeight / (baseHeight * 2)); 
    } else {
      rowCount = Math.floor(availableHeight / baseHeight);
    }
    
    const usedHeight = rowCount * baseHeight * (viewMode === 'both' ? 2 : 1);
    const leftoverHeight = availableHeight - usedHeight;
    const totalRows = viewMode === 'both' ? rowCount * 2 : rowCount;
    const extra = totalRows > 0 ? Math.max(0, leftoverHeight / totalRows) : 0;
    
    return { rowCount, extra };
  }, [containerHeight, viewMode]);

  const loadingSellOrders = useMemo(() => {
    const { rowCount, extra } = loadingData;
    
    return (
      <div className="orderlist">
        <ul className="order-list-items bottom-aligned">
          {Array.from({ length: rowCount }).map((_, i) => {
            const widthPercentage = 10 + ((i / Math.max(1, rowCount - 1)) * 86);
            const dynamicStyle = {
              height: `calc(var(--order-item-height, 20.5px) + ${extra}px)`,
            };
            
            return (
              <li
                key={`sell-${i}`}
                className="order-item-wrapper loading-order"
                style={dynamicStyle}
              >
                <div className="order-item loading-skeleton-item" style={dynamicStyle}>
                  <div 
                    className="ob-loading-bar ob-loading-skeleton" 
                    style={{ width: `${widthPercentage}%` }} 
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }, [loadingData]);

  const loadingBuyOrders = useMemo(() => {
    const { rowCount, extra } = loadingData;
    
    return (
      <div className="orderlist">
        <ul className="order-list-items top-aligned">
          {Array.from({ length: rowCount }).map((_, i) => {
            const widthPercentage = 10 + ((i / Math.max(1, rowCount - 1)) * 86);
            const dynamicStyle = {
              height: `calc(var(--order-item-height, 20.5px) + ${extra}px)`,
            };
            
            return (
              <li
                key={`buy-${i}`}
                className="order-item-wrapper loading-order"
                style={dynamicStyle}
              >
                <div className="order-item loading-skeleton-item" style={dynamicStyle}>
                  <div 
                    className="ob-loading-bar ob-loading-skeleton" 
                    style={{ width: `${widthPercentage}%` }} 
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }, [loadingData]);

  const LoadingSpreadDisplay = useMemo(() => (
    <div className="ob-spread">
      <div className="ob-spread-inner">
        <div className="ob-loading-skeleton ob-loading-spread-value" />
      </div>
    </div>
  ), []);

  return (
    <DropdownContext.Provider value={{ openDropdown, setOpenDropdown }}>
      <div className={`ob-controls ${!show ? 'hidden' : ''}`}>
        <ViewModeButtons viewMode={viewMode} setViewMode={setViewMode} />
        <PriceIntervals
          interval={interval}
          localInterval={obInterval}
          setLocalInterval={setOBInterval}
          symbolOut={symbolBase}
        />
      </div>
      <div
        className={`ob-lists-container ${!show ? 'hidden' : ''}`}
        ref={containerRef}
      >
        <OrderListHeader
          amountsQuote={amountsQuote}
          onAmountsQuoteChange={setAmountsQuote}
          symbolQuote={symbolQuote}
          symbolBase={symbolBase}
          perps={perps}
        />
        {isOrderbookLoading ? (
    Array.from({ length: 50 }).map((_, i) => (
      <div key={`loading-trade-${i}`} className="trade-loading-item">
        <div className="trade-loading-content">
          <div className="trade-loading-price ob-loading-skeleton" />
          <div className="trade-loading-size ob-loading-skeleton" />
          <div className="trade-loading-time ob-loading-skeleton" />
        </div>
      </div>
    ))
        ) : (
          <>
            {viewMode === 'both' && containerHeight != 0 && (
              <div className="view-both">
                <OrderList
                  roundedOrders={processedSellOrders}
                  extra={extraSell}
                  maxTotalSize={adjustedMaxSize}
                  color="rgb(255, 108, 108)"
                  amountsQuote={amountsQuote}
                  isBuyOrderList={false}
                  symbolQuote={symbolQuote}
                  symbolBase={symbolBase}
                  priceFactor={priceFactor}
                  spreadPrice={spreadData.averagePrice}
                  orderbookPosition={orderbookPosition}
                  updateLimitAmount={updateLimitAmount}
                  marketType={marketType}
                />
                <SpreadDisplay
                  averagePrice={spreadData.averagePrice}
                  spread={spreadData.spread}
                  priceFactor={priceFactor}
                />
                <OrderList
                  roundedOrders={processedBuyOrders}
                  extra={extraBuy}
                  maxTotalSize={adjustedMaxSize}
                  color="rgb(111, 255, 111)"
                  amountsQuote={amountsQuote}
                  isBuyOrderList={true}
                  symbolQuote={symbolQuote}
                  symbolBase={symbolBase}
                  priceFactor={priceFactor}
                  spreadPrice={spreadData.averagePrice}
                  orderbookPosition={orderbookPosition}
                  updateLimitAmount={updateLimitAmount}
                  marketType={marketType}
                />
              </div>
            )}
            {viewMode === 'sell' && containerHeight != 0 && (
              <div className="ob-sell-only">
                <OrderList
                  roundedOrders={processedSellOrders}
                  extra={extraSell}
                  maxTotalSize={adjustedMaxSize}
                  color="rgb(255, 108, 108)"
                  amountsQuote={amountsQuote}
                  isBuyOrderList={false}
                  symbolQuote={symbolQuote}
                  symbolBase={symbolBase}
                  priceFactor={priceFactor}
                  spreadPrice={spreadData.averagePrice}
                  orderbookPosition={orderbookPosition}
                  updateLimitAmount={updateLimitAmount}
                  marketType={marketType}
                />
                <SpreadDisplay
                  averagePrice={spreadData.averagePrice}
                  spread={spreadData.spread}
                  priceFactor={priceFactor}
                />
              </div>
            )}
            {viewMode === 'buy' && containerHeight != 0 && (
              <div className="ob-buy-only">
                <SpreadDisplay
                  averagePrice={spreadData.averagePrice}
                  spread={spreadData.spread}
                  priceFactor={priceFactor}
                />
                <OrderList
                  roundedOrders={processedBuyOrders}
                  extra={extraBuy}
                  maxTotalSize={adjustedMaxSize}
                  color="rgb(111, 255, 111)"
                  amountsQuote={amountsQuote}
                  isBuyOrderList={true}
                  symbolQuote={symbolQuote}
                  symbolBase={symbolBase}
                  priceFactor={priceFactor}
                  spreadPrice={spreadData.averagePrice}
                  orderbookPosition={orderbookPosition}
                  updateLimitAmount={updateLimitAmount}
                  marketType={marketType}
                />
              </div>
            )}
          </>
        )}

      </div>
    </DropdownContext.Provider>
  );
};

export default OrderbookView;