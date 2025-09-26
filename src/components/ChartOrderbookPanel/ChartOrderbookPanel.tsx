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
  reserveQuote: any;
  reserveBase: any;
  isOrderbookLoading?: boolean;
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
  reserveQuote,
  reserveBase,
  isOrderbookLoading,
}) => {
  const [isDragging, setIsDragging] = useState(false);
const [layoutMode, setLayoutMode] = useState<'tab' | 'stacked' | 'large'>(() => {
  const savedMode = localStorage.getItem('ob_layout_mode') as 'tab' | 'stacked' | 'large';
  return (savedMode && ['tab', 'stacked', 'large'].includes(savedMode)) ? savedMode : 'tab';
});

  const initialMousePosRef = useRef(0);
  const initialWidthRef = useRef(0);
  const widthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkLayoutMode = () => {
      const savedMode = localStorage.getItem('ob_layout_mode') as 'tab' | 'stacked' | 'large';
      if (savedMode && ['tab', 'stacked', 'large'].includes(savedMode)) {
        setLayoutMode(savedMode);
      }
    };

    checkLayoutMode();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ob_layout_mode') {
        checkLayoutMode();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(checkLayoutMode, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    e.preventDefault();
    e.stopPropagation();

    const mouseDelta = e.clientX - initialMousePosRef.current;
    const delta = orderbookPosition === 'left' ? mouseDelta : -mouseDelta;
    
  
    const adjustedDelta = layoutMode === 'large' ? delta / 2 : delta;
    
    const newWidth = Math.max(
      250,
      Math.min(
        widthRef.current
          ? widthRef.current.getBoundingClientRect().width / (layoutMode === 'large' ? 4 : 2)
          : 450,
        initialWidthRef.current + adjustedDelta,
      ),
    );

    setOrderbookWidth(newWidth);
    localStorage.setItem('orderbookWidth', newWidth.toString());
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
}, [isDragging, orderbookPosition, layoutMode]); 
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    initialMousePosRef.current = e.clientX;
    initialWidthRef.current = orderbookWidth;
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const getOrderBookStyle = () => {
    if (layoutMode === 'large') {
      const largeWidth = Math.max(orderbookWidth * 2, 480);
      return {
        width: isOrderbookVisible ? `${largeWidth}px` : '0px',
        minWidth: isOrderbookVisible ? `${largeWidth}px` : '0px',
        transition: isDragging ? 'none' : 'width 0.3s ease, min-width 0.3s ease',
        overflow: 'visible',
      };
    }

    return {
      width: isOrderbookVisible ? `${orderbookWidth}px` : '0px',
      minWidth: isOrderbookVisible ? `${orderbookWidth}px` : '0px',
      transition: isDragging ? 'none' : 'width 0.3s ease, min-width 0.3s ease',
      overflow: 'hidden',
    };
  };

  return (
    <div
      className={
        windowWidth > 1020
          ? `chart-orderbook-panel ${isDragging ? 'isDragging' : ''}`
          : 'trade-mobile-view-container'
      }
      ref={widthRef}
      style={
        windowWidth > 1020
          ? {
              flexDirection:
                orderbookPosition == 'left' ? 'row-reverse' : 'row',
            }
          : {}
      }
    >
      <div
        className={
          windowWidth > 1020 || mobileView === 'chart'
            ? 'chart-container'
            : 'hidden'
        }
      >
        {renderChartComponent}
      </div>

      <div
        className={
          windowWidth > 1020
            ? `spacer ${!isOrderbookVisible ? 'collapsed' : ''}`
            : 'hidden'
        }
      >
        <div
          className="drag-handle"
          onMouseDown={handleMouseDown}
          role="separator"
          aria-label="Resize orderbook"
          tabIndex={0}
        />
      </div>

      <div
        className={
          windowWidth > 1020 ||
          mobileView === 'orderbook' ||
          mobileView === 'trades'
            ? `orderbook-container ${layoutMode === 'large' ? 'large-mode' : ''}`
            : 'hidden'
        }
        style={windowWidth > 1020 ? getOrderBookStyle() : {}}
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
          reserveQuote={reserveQuote}
          reserveBase={reserveBase}
          isOrderbookLoading={isOrderbookLoading}
        />
      </div>
    </div>
  );
};

export default ChartOrderbookPanel;