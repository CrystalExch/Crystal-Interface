import React, { useEffect, useMemo, useRef, useState } from 'react';

import OrderHighlightPopup from '../HighlightPopup/HighlightPopup';
import OrderItem from '../OrderItem/OrderItem';

import { calculateHighlightData } from '../../utils';

import './OrderList.css';

interface HighlightData {
  averagePrice: number;
  totalAmount: number;
  unit: string;
  otherTotalAmount: number;
  otherUnit: string;
}

interface OrderListProps {
  roundedOrders: any[];
  extra: number;
  maxTotalSize: number;
  color: string;
  amountsQuote: string;
  isBuyOrderList: boolean;
  symbol: string;
  priceFactor: number;
  spreadPrice?: number;
  orderbookPosition: string;
  updateLimitAmount: any;
  userOrders?: any[];
  activeMarket?: string;
}

const OrderList: React.FC<OrderListProps> = ({
  roundedOrders,
  extra,
  maxTotalSize,
  color,
  amountsQuote,
  isBuyOrderList,
  symbol,
  priceFactor,
  spreadPrice,
  orderbookPosition,
  updateLimitAmount,
  userOrders = [],
  activeMarket = '',
}) => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [highlightData, setHighlightData] = useState<HighlightData | null>(
    null,
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const orderRefs = useRef<(HTMLLIElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const getDecimalPlaces = (num: number): number => {
    const numStr = num.toString();
    if (numStr.includes('.')) {
      return numStr.split('.')[1].length;
    }
    return 0;
  };

  const userOrderPrices = useMemo(() => {
    const priceMap: { [key: string]: boolean } = {};
    
    if (!userOrders || userOrders.length === 0 || !roundedOrders || roundedOrders.length === 0) {
      return priceMap;
    }
    
    const filteredOrders = userOrders.filter(order => {
      const isBuy = Number(order[3]) === 1;
      const matchesListType = isBuyOrderList ? isBuy : !isBuy;
      const orderMarket = String(order[4]);
      const matchesMarket = orderMarket === activeMarket;
      
      return matchesListType && matchesMarket;
    });
    
    if (filteredOrders.length === 0) {
      return priceMap;
    }
    
    const displayedPrices = roundedOrders.map(order => order.price);
    
    let scalingFactor = 1;
    if (filteredOrders.length > 0 && displayedPrices.length > 0) {
      const sampleOrderPrice = Number(filteredOrders[0][0]);
      const averageDisplayPrice = displayedPrices.reduce((sum, price) => sum + price, 0) / displayedPrices.length;
      const rawScaling = sampleOrderPrice / averageDisplayPrice;
      const powerOf10 = Math.round(Math.log10(rawScaling));
      scalingFactor = Math.pow(10, powerOf10);
    }
    
    filteredOrders.forEach(order => {
      const rawOrderPrice = Number(order[0]);
      const scaledOrderPrice = rawOrderPrice / scalingFactor;
      
      let closestPrice = displayedPrices[0];
      let minDiff = Math.abs(scaledOrderPrice - closestPrice);
      
      for (let i = 1; i < displayedPrices.length; i++) {
        const diff = Math.abs(scaledOrderPrice - displayedPrices[i]);
        if (diff < minDiff) {
          minDiff = diff;
          closestPrice = displayedPrices[i];
        }
      }
      
      const bucketSpacing = displayedPrices.length > 1 
        ? Math.abs(displayedPrices[1] - displayedPrices[0])
        : 1;
      
      const tolerance = bucketSpacing * 0.5;
      
      if (minDiff <= tolerance) {
        priceMap[closestPrice] = true;
      }
    });
    
    return priceMap;
  }, [userOrders, roundedOrders, isBuyOrderList, activeMarket, priceFactor]);

  const displayedOrders = useMemo(() => {
    const updatedOrders = roundedOrders.map((order) => ({
      ...order,
      runningTotalSize: order.totalSize,
      changeType: true,
    }));
    return isBuyOrderList ? updatedOrders : updatedOrders.reverse();
  }, [roundedOrders, isBuyOrderList]);

  const maxDecimals = useMemo(() => {
    let max = 0;
    displayedOrders.forEach((order) => {
      const sizeDecimals = getDecimalPlaces(order.size);
      const totalSizeDecimals = getDecimalPlaces(order.runningTotalSize || 0);
      max = Math.max(max, sizeDecimals, totalSizeDecimals);
    });
    if (amountsQuote == 'Quote') {
      return 2;
    }
    return max;
  }, [displayedOrders, amountsQuote]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseY = e.clientY - containerRect.top;

    let closestIndex: number | null = null;
    let minDistance = Infinity;
    orderRefs.current.forEach((orderEl, idx) => {
      if (orderEl) {
        const rect = orderEl.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2 - containerRect.top;
        const distance = Math.abs(mouseY - centerY);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = idx;
        }
      }
    });
    if (closestIndex !== null) {
      setSelectedIndex(closestIndex);
      const orderEl = orderRefs.current[closestIndex];
      if (orderEl) {
        const orderRect = orderEl.getBoundingClientRect();
        setMousePosition({
          x:
            orderbookPosition === 'right'
              ? orderRect.left - containerRect.left - 12.5
              : orderRect.right - containerRect.left + 12.5,
          y: orderRect.top - containerRect.top + orderRect.height / 2,
        });
      }
    }
  };

  useEffect(() => {
    if (selectedIndex !== null) {
      const ordersInRange = isBuyOrderList
        ? roundedOrders.slice(0, selectedIndex + 1)
        : roundedOrders.slice(
            0,
            Math.max(0, roundedOrders.length - selectedIndex),
          );

      const highlightRawData = calculateHighlightData(
        ordersInRange,
        amountsQuote,
        symbol,
      );
      setHighlightData({
        ...highlightRawData,
        averagePrice: highlightRawData.averagePrice,
      });
    } else {
      setHighlightData(null);
    }
  }, [
    selectedIndex,
    displayedOrders,
    isBuyOrderList,
    amountsQuote,
    symbol,
    spreadPrice,
    roundedOrders,
  ]);

  return (
    <div
      className="orderlist"
      ref={containerRef}
      onMouseLeave={() => {
        setSelectedIndex(null);
        setHighlightData(null);
      }}
      onMouseMove={handleMouseMove}
    >
      <ul
        className={`order-list-items ${isBuyOrderList ? 'top-aligned' : 'bottom-aligned'}`}
      >
        {displayedOrders.map((order, index) => {
          const price = order.price;
          const hasUserOrder = userOrderPrices[price] === true;
          
          return (
            <OrderItem
              key={`order-${index}-${order.price}-${order.size}-${order.price === 0 ? 'phantom' : 'real'}`}
              ref={(el) => (orderRefs.current[index] = el)}
              price={order.price}
              size={order.size}
              runningTotalSize={order.runningTotalSize || 0}
              color={color}
              width={(order.runningTotalSize / maxTotalSize) * 100}
              extra={extra}
              isBuyOrder={isBuyOrderList}
              changeType={order.changeType}
              priceFactor={priceFactor}
              isHighlighted={(() => {
                if (selectedIndex == null || order.price === 0) return false;
                return isBuyOrderList
                  ? index <= selectedIndex
                  : index >= selectedIndex;
              })()}
              isBoundary={selectedIndex === index}
              isPhantom={order.price === 0}
              maxDecimals={maxDecimals}
              updateLimitAmount={updateLimitAmount}
              shouldFlash={order.shouldFlash}
              hasUserOrder={hasUserOrder}
            />
          );
        })}
        {highlightData && (
          <OrderHighlightPopup
            mousePosition={mousePosition}
            highlightData={highlightData}
            orderbookPosition={orderbookPosition}
            containerRef={containerRef}
            priceFactor={priceFactor}
          />
        )}
      </ul>
    </div>
  );
};

export default OrderList;