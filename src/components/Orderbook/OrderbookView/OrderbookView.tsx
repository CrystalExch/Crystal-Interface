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
}

const OrderbookView: React.FC<OrderbookViewProps> = ({
  roundedBuy,
  roundedSell,
  spreadData,
  priceFactor,
  symbolQuote,
  symbolBase,
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
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const updateContainerHeight = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const newHeight = rect?.height || 0;
    setContainerHeight(prev =>
      Math.abs(newHeight - prev) > 1 && newHeight !== 0 ? newHeight : prev
    );
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
        />
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
            />
          </div>
        )}
      </div>
    </DropdownContext.Provider>
  );
};

export default OrderbookView;