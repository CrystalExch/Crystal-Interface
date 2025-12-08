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
  marketType: any;
  perps?: boolean;
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
  marketType,
  perps = false,
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

  const maxDecimals = useMemo(() => {
    if (amountsQuote === 'Quote') {
      if (perps) {
        return 0;
      }
      return 2;
    }
    
    let max = 0;
    roundedOrders.forEach((order) => {
      const sizeDecimals = getDecimalPlaces(order.size);
      const totalSizeDecimals = getDecimalPlaces(order.totalSize || 0);
      max = Math.max(max, sizeDecimals, totalSizeDecimals);
    });

    return max;
  }, [roundedOrders, amountsQuote]);

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
      const ordersInRange = roundedOrders.slice(0, selectedIndex + 1)

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
    roundedOrders,
    amountsQuote,
    symbolQuote + symbolBase,
  ]);

  return (
    <div
      className="orderlist"
      ref={containerRef}
      onMouseLeave={() => {
        setSelectedIndex(null)
        setHighlightData(null)
      }}
      onMouseMove={handleMouseMove}
    >
      <ul
        className={`order-list-items ${isBuyOrderList ? 'top-aligned' : 'bottom-aligned'}`}
      >
        {roundedOrders.map((order, index) => {
          return (
            <OrderItem
              key={index}
              ref={(el) => (orderRefs.current[index] = el)}
              price={order.price}
              size={order.size}
              totalSize={order.totalSize || 0}
              color={color}
              width={(order.totalSize / maxTotalSize) * 100}
              extra={extra}
              isBuyOrder={isBuyOrderList}
              priceFactor={priceFactor}
              isHighlighted={
                selectedIndex === null || order.price === 0
                  ? false
                  : index <= selectedIndex
              }
              isBoundary={selectedIndex === index}
              isPhantom={order.isPhantom}
              maxDecimals={maxDecimals}
              updateLimitAmount={updateLimitAmount}
              shouldFlash={order.shouldFlash}
              hasUserOrder={order.userPrice}
              marketType={marketType}
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
            marketType={marketType}
            maxDecimals={perps ? 0 : 2}
          />
        )}
      </ul>
    </div>
  );
};

export default OrderList;
