import React, { useEffect, useRef, useState } from 'react';

import ChartComponent from '../Chart/Chart';
import OrderBook from '../Orderbook/Orderbook';

import './ChartOrderbookPanel.css';

interface ChartOrderbookPanelProps {
  onMarketSelect: (market: { quoteAddress: any; baseAddress: any; }) => void;
  tokendict: Record<string, any>;
  universalTrades: any[];
  userWalletAddress?: string | null;
  layoutSettings: string;
  orderbookPosition: string;
  trades: any[];
  orderdata: any;
  activeMarket: any;
  isOrderbookVisible: boolean;
  orderbookWidth: number;
  setOrderbookWidth: (newWidth: number) => void;
  obInterval: number;
  amountsQuote: any;
  setAmountsQuote: any;
  obtrades: any;
  baseInterval: number;
  setOBInterval: any;
  viewMode: 'both' | 'buy' | 'sell';
  setViewMode: any;
  activeTab: 'orderbook' | 'trades';
  setActiveTab: any;
  setpopup: (value: number) => void;
  updateLimitAmount: any;
  tradesloading: boolean;
  marketsData: any;
  chartOrderData?: any;
  updateChartData?: any;
}

const ChartOrderbookPanel: React.FC<ChartOrderbookPanelProps> = ({
  onMarketSelect,
  tokendict,
  universalTrades,
  userWalletAddress,
  layoutSettings,
  orderbookPosition,
  trades,
  orderdata,
  activeMarket,
  isOrderbookVisible,
  orderbookWidth,
  setOrderbookWidth,
  obInterval,
  amountsQuote,
  setAmountsQuote,
  obtrades,
  baseInterval,
  setOBInterval,
  viewMode,
  setViewMode,
  activeTab,
  setActiveTab,
  setpopup,
  updateLimitAmount,
  tradesloading,
  marketsData,
  updateChartData
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const initialMousePosRef = useRef(0);
  const initialWidthRef = useRef(0);
  const widthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      const mouseDelta = e.clientX - initialMousePosRef.current;
      const delta = orderbookPosition === 'left' ? mouseDelta : -mouseDelta;
      const newWidth = Math.max(
        250,
        Math.min(
          widthRef.current
            ? widthRef.current.getBoundingClientRect().width / 2
            : 450,
          initialWidthRef.current + delta,
        ),
      );

      setOrderbookWidth(newWidth);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      const overlay = document.getElementById('global-drag-overlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }
    };

    if (isDragging) {
      const overlay = document.createElement('div');
      overlay.id = 'global-drag-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.zIndex = '9999';
      overlay.style.cursor = 'col-resize';
      document.body.appendChild(overlay);

      window.addEventListener('mousemove', handleMouseMove, { capture: true });
      window.addEventListener('mouseup', handleMouseUp, { capture: true });
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove, {
        capture: true,
      });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });

      const overlay = document.getElementById('global-drag-overlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }
    };
  }, [isDragging, orderbookPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    initialMousePosRef.current = e.clientX;
    initialWidthRef.current = orderbookWidth;
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const orderBookStyle = {
    width: !isOrderbookVisible ? '0' : `${orderbookWidth}px`,
    minWidth: !isOrderbookVisible ? '0' : `${orderbookWidth}px`,
    transition: isDragging ? 'none' : 'width 0.1s ease',
  };


return (
  <div
    className={`chart-orderbook-panel ${isDragging ? 'isDragging' : ''}`}
    ref={widthRef}
    style={{
      flexDirection: orderbookPosition == 'left' ? 'row-reverse' : 'row',
    }}
  >
    <>
      <div className="chart-container">
        <ChartComponent
          onMarketSelect={onMarketSelect}
          tokendict={tokendict}
          trades={trades}
          universalTrades={universalTrades}
          activeMarket={activeMarket}
          orderdata={orderdata}
          userWalletAddress={userWalletAddress}
          setpopup={setpopup}
          tradesloading={tradesloading}
          marketsData={marketsData}
          updateChartData={updateChartData}
        />
      </div>

      <div className={`spacer ${!isOrderbookVisible ? 'collapsed' : ''}`}>
        <div
          className="drag-handle"
          onMouseDown={handleMouseDown}
          role="separator"
          aria-label="Resize orderbook"
          tabIndex={0}
        />
      </div>

      <div
        className={`orderbook-container ${!isOrderbookVisible ? 'collapsed' : ''}`}
        style={orderBookStyle}
      >
        <OrderBook
          trades={obtrades}
          orderdata={orderdata}
          layoutSettings={layoutSettings}
          orderbookPosition={orderbookPosition}
          hideHeader={false}
          interval={baseInterval}
          amountsQuote={amountsQuote}
          setAmountsQuote={setAmountsQuote}
          obInterval={obInterval}
          setOBInterval={setOBInterval}
          viewMode={viewMode}
          setViewMode={setViewMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          updateLimitAmount={updateLimitAmount}
        />
      </div>
    </>
  </div>
);
};

export default ChartOrderbookPanel;