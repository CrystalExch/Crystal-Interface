import React, { useEffect, useRef, useState } from 'react';

import OrderBook from '../Orderbook/Orderbook';

import './ChartOrderbookPanel.css';

interface ChartOrderbookPanelProps {
  layoutSettings: string;
  orderbookPosition: string;
  orderdata: any;
  windowWidth: any;
  mobileView: any;
  isOrderbookVisible: boolean;
  orderbookWidth: number;
  setOrderbookWidth: any;
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
  updateLimitAmount: any;
  renderChartComponent: any;
}

const ChartOrderbookPanel: React.FC<ChartOrderbookPanelProps> = ({
  layoutSettings,
  orderbookPosition,
  orderdata,
  windowWidth,
  mobileView,
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
  updateLimitAmount,
  renderChartComponent,
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
      localStorage.setItem('orderbookWidth', newWidth.toString())
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
    width: isOrderbookVisible ? `${orderbookWidth}px` : '0px',
    minWidth: isOrderbookVisible ? `${orderbookWidth}px` : '0px',
    transition: isDragging ? 'none' : 'width 0.3s ease, min-width 0.3s ease',
    overflow: 'hidden', 
  };

  return (
    <div
      className={windowWidth > 1020 ? `chart-orderbook-panel ${isDragging ? 'isDragging' : ''}` : "trade-mobile-view-container"}
      ref={widthRef}
      style={windowWidth > 1020 ? {
        flexDirection: orderbookPosition == 'left' ? 'row-reverse' : 'row',
      } : {}}
    >
      <div className={(windowWidth > 1020 || mobileView === 'chart') ? 'chart-container' : 'hidden'}>
        {renderChartComponent}
      </div>

      <div className={windowWidth > 1020 ? `spacer ${!isOrderbookVisible ? 'collapsed' : ''}` : 'hidden'}>
        <div
          className="drag-handle"
          onMouseDown={handleMouseDown}
          role="separator"
          aria-label="Resize orderbook"
          tabIndex={0}
        />
      </div>

      <div
        className={(windowWidth > 1020 || (mobileView === 'orderbook' || mobileView === 'trades')) ? 'orderbook-container' : 'hidden'}
        style={windowWidth > 1020 ? orderBookStyle : {}}
      >
        <OrderBook
          trades={obtrades}
          orderdata={orderdata}
          layoutSettings={layoutSettings}
          orderbookPosition={orderbookPosition}
          hideHeader={windowWidth > 1020 ? false : true}
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
    </div>
  );
};

export default ChartOrderbookPanel;