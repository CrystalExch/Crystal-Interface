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
  symbolQuote: string;
  symbolBase: string;
  priceFactor: number;
  spreadPrice?: number;
  orderbookPosition: string;
  updateLimitAmount: any;
  userOrders?: any[];
}

const OrderList: React.FC<OrderListProps> = ({
  roundedOrders,
  extra,
  maxTotalSize,
  color,
  amountsQuote,
  isBuyOrderList,
  symbolQuote,
  symbolBase,
  priceFactor,
  spreadPrice,
  orderbookPosition,
  updateLimitAmount,
  userOrders = [],
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
      const matchesMarket = orderMarket === symbolQuote+symbolBase;
      
      return matchesListType && matchesMarket;
    });
    
    if (filteredOrders.length === 0) {
      return priceMap;
    }
    
    const displayedPrices = roundedOrders.map(order => order.price);
    const sortedDisplayedPrices = [...displayedPrices].sort((a, b) => a - b);
    
    let scalingFactor = 1;
    if (filteredOrders.length > 0 && sortedDisplayedPrices.length > 0) {
      const sampleOrderPrice = Number(filteredOrders[0][0]);
      const averageDisplayPrice =
        sortedDisplayedPrices.reduce((sum, price) => sum + price, 0) / sortedDisplayedPrices.length;
      const rawScaling = sampleOrderPrice / averageDisplayPrice;
      const powerOf10 = Math.round(Math.log10(rawScaling));
      scalingFactor = Math.pow(10, powerOf10);
    }
    
    const bucketSpacing =
      sortedDisplayedPrices.length > 1 ? Math.abs(sortedDisplayedPrices[1] - sortedDisplayedPrices[0]) : 1;
    const tolerance = bucketSpacing * 0.5;
    
    filteredOrders.forEach(order => {
      const rawOrderPrice = Number(order[0]);
      const scaledOrderPrice = rawOrderPrice / scalingFactor;
      const isBuyOrder = Number(order[3]) === 1;
      let matchedPrice: number;
      
      if (isBuyOrder) {
        matchedPrice = sortedDisplayedPrices[0];
        for (let i = 0; i < sortedDisplayedPrices.length; i++) {
          if (sortedDisplayedPrices[i] <= scaledOrderPrice && sortedDisplayedPrices[i] > matchedPrice) {
            matchedPrice = sortedDisplayedPrices[i];
          }
        }
      } else {
        matchedPrice = sortedDisplayedPrices[sortedDisplayedPrices.length - 1];
        for (let i = sortedDisplayedPrices.length - 1; i >= 0; i--) {
          if (sortedDisplayedPrices[i] >= scaledOrderPrice && sortedDisplayedPrices[i] < matchedPrice) {
            matchedPrice = sortedDisplayedPrices[i];
          }
        }
      }
      
      const diff = Math.abs(scaledOrderPrice - matchedPrice);
      
      if (diff <= tolerance) {
        priceMap[matchedPrice] = true;
      }
    });
    
    return priceMap;
  }, [userOrders, roundedOrders, isBuyOrderList, symbolQuote+symbolBase, priceFactor]);  

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
        symbolQuote,
        symbolBase,
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
    symbolQuote+symbolBase,
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
              key={`order-${index}-${order.price}-${order.size}-${order.isPhantom === true ? 'phantom' : 'real'}`}
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
              isPhantom={order.isPhantom}
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