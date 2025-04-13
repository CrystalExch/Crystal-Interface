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
}) => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [highlightData, setHighlightData] = useState<HighlightData | null>(null);
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

    if (amountsQuote === 'Quote') {
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
        : roundedOrders.slice(0, Math.max(0, roundedOrders.length - selectedIndex));

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
    symbolQuote + symbolBase,
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
              isHighlighted={
                selectedIndex === null || order.price === 0
                  ? false
                  : isBuyOrderList
                  ? index <= selectedIndex
                  : index >= selectedIndex
              }
              isBoundary={selectedIndex === index}
              isPhantom={order.isPhantom}
              maxDecimals={maxDecimals}
              updateLimitAmount={updateLimitAmount}
              shouldFlash={order.shouldFlash}
              hasUserOrder={order.userPrice}
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
