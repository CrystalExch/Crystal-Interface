import React, { useCallback, useEffect, useRef, useState } from 'react';

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
  symbolIn: string;
  symbolOut: string;
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
  // Add props for user orders
  userOrders?: any[];
  activeMarket?: string;
}

const OrderbookView: React.FC<OrderbookViewProps> = ({
  roundedBuy,
  roundedSell,
  spreadData,
  priceFactor,
  symbolIn,
  symbolOut,
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
  userOrders = [], // Default to empty array if not provided
  activeMarket = '',
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [rowHeight, setRowHeight] = useState<number>(0);
  const [processedBuyOrders, setProcessedBuyOrders] = useState<Order[]>([]);
  const [processedSellOrders, setProcessedSellOrders] = useState<Order[]>([]);
  const [adjustedMaxSize, setAdjustedMaxSize] = useState<number>(0);
  const [extraBuy, setBuyExtra] = useState<number>(0);
  const [extraSell, setSellExtra] = useState<number>(0);
  const [spread, setSpread] = useState<number>(0);
  const [averagePrice, setAveragePrice] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const heightUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nonUSDCsymbol = symbolIn === 'USDC' ? symbolOut : symbolIn;

  const updateContainerHeight = useCallback(() => {
    if (!containerRef.current) return;
    if (heightUpdateTimeoutRef.current) {
      clearTimeout(heightUpdateTimeoutRef.current);
    }
    heightUpdateTimeoutRef.current = setTimeout(() => {
      const rect = containerRef.current?.getBoundingClientRect();
      const newHeight = rect?.height || 0;
      if (Math.abs(newHeight - containerHeight) > 1) {
        setContainerHeight(newHeight);
      }
    }, 100);
  }, [containerHeight]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(updateContainerHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    updateContainerHeight();
    return () => {
      if (heightUpdateTimeoutRef.current) {
        clearTimeout(heightUpdateTimeoutRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [updateContainerHeight]);

  useEffect(() => {
    localStorage.setItem('ob_viewmode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    const probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.height = 'auto';
    probe.style.whiteSpace = 'nowrap';
    probe.className = 'order-list-probe';
    document.body.appendChild(probe);
    const measuredHeight = probe.getBoundingClientRect().height;
    setRowHeight(measuredHeight || 20.5);
    document.body.removeChild(probe);
  }, []);

  useEffect(() => {
    if (!containerHeight || !rowHeight) return;

    const processOrders = () => {
      const { orders: newProcessedBuy, leftoverPerRow: buyExtra } = scaleOrders(
        roundedBuy,
        obInterval,
        true,
        viewMode,
        containerHeight,
        rowHeight,
      );
      const { orders: newProcessedSell, leftoverPerRow: sellExtra } =
        scaleOrders(
          roundedSell,
          obInterval,
          false,
          viewMode,
          containerHeight,
          rowHeight,
        );
      setProcessedBuyOrders(newProcessedBuy);
      setProcessedSellOrders(newProcessedSell);
      setBuyExtra(buyExtra);
      setSellExtra(sellExtra);
      const buyTotalSize =
        newProcessedBuy.filter((order) => order.price !== 0).slice(-1)[0]
          ?.totalSize || 0;
      const sellTotalSize =
        newProcessedSell.filter((order) => order.price !== 0).slice(-1)[0]
          ?.totalSize || 0;
      setAdjustedMaxSize(Math.max(buyTotalSize, sellTotalSize));
    };
    processOrders();
  }, [
    roundedBuy,
    roundedSell,
    obInterval,
    viewMode,
    containerHeight,
    rowHeight,
  ]);

  useEffect(() => {
    if (!spreadData) return;
    setSpread(spreadData.spread);
    setAveragePrice(spreadData.averagePrice);
  }, [spreadData]);

  return (
    <DropdownContext.Provider value={{ openDropdown, setOpenDropdown }}>
      <div className={`ob-controls ${!show ? 'hidden' : ''}`}>
        <ViewModeButtons viewMode={viewMode} setViewMode={setViewMode} />
        <PriceIntervals
          interval={interval}
          localInterval={obInterval}
          setLocalInterval={setOBInterval}
          symbolOut={symbolOut}
        />
      </div>
      <div
        className={`ob-lists-container ${!show ? 'hidden' : ''}`}
        ref={containerRef}
      >
        <OrderListHeader
          amountsQuote={amountsQuote}
          onAmountsQuoteChange={setAmountsQuote}
          symbol={nonUSDCsymbol}
        />
        {viewMode === 'both' && (
          <div className="view-both">
            <OrderList
              roundedOrders={processedSellOrders}
              extra={extraSell}
              maxTotalSize={adjustedMaxSize}
              color="rgb(255, 108, 108)"
              amountsQuote={amountsQuote}
              isBuyOrderList={false}
              symbol={nonUSDCsymbol}
              priceFactor={priceFactor}
              spreadPrice={averagePrice}
              orderbookPosition={orderbookPosition}
              updateLimitAmount={updateLimitAmount}
              userOrders={userOrders}
              activeMarket={activeMarket}
            />
            <SpreadDisplay
              averagePrice={averagePrice}
              spread={spread}
              priceFactor={priceFactor}
            />
            <OrderList
              roundedOrders={processedBuyOrders}
              extra={extraBuy}
              maxTotalSize={adjustedMaxSize}
              color="rgb(111, 255, 111)"
              amountsQuote={amountsQuote}
              isBuyOrderList={true}
              symbol={nonUSDCsymbol}
              priceFactor={priceFactor}
              spreadPrice={averagePrice}
              orderbookPosition={orderbookPosition}
              updateLimitAmount={updateLimitAmount}
              userOrders={userOrders}
              activeMarket={activeMarket}
            />
          </div>
        )}
        {viewMode === 'sell' && (
          <div className="ob-sell-only">
            <OrderList
              roundedOrders={processedSellOrders}
              extra={extraSell}
              maxTotalSize={adjustedMaxSize}
              color="rgb(255, 108, 108)"
              amountsQuote={amountsQuote}
              isBuyOrderList={false}
              symbol={nonUSDCsymbol}
              priceFactor={priceFactor}
              spreadPrice={averagePrice}
              orderbookPosition={orderbookPosition}
              updateLimitAmount={updateLimitAmount}
              userOrders={userOrders}
              activeMarket={activeMarket}
            />
            <SpreadDisplay
              averagePrice={averagePrice}
              spread={spread}
              priceFactor={priceFactor}
            />
          </div>
        )}
        {viewMode === 'buy' && (
          <div className="ob-buy-only">
            <SpreadDisplay
              averagePrice={averagePrice}
              spread={spread}
              priceFactor={priceFactor}
            />
            <OrderList
              roundedOrders={processedBuyOrders}
              extra={extraBuy}
              maxTotalSize={adjustedMaxSize}
              color="rgb(111, 255, 111)"
              amountsQuote={amountsQuote}
              isBuyOrderList={true}
              symbol={nonUSDCsymbol}
              priceFactor={priceFactor}
              spreadPrice={averagePrice}
              orderbookPosition={orderbookPosition}
              updateLimitAmount={updateLimitAmount}
              userOrders={userOrders}
              activeMarket={activeMarket}
            />
          </div>
        )}
      </div>
    </DropdownContext.Provider>
  );
};

export default OrderbookView;