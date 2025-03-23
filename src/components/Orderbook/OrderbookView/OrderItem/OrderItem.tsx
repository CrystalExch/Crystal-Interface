import React, { useEffect, useState } from 'react';

import { formatCommas } from '../../../../utils/numberDisplayFormat';

import './OrderItem.css';

interface OrderItemProps {
  price: number;
  size: number;
  runningTotalSize: number;
  color: string;
  width: number;
  extra: number;
  isBuyOrder: boolean;
  changeType?: boolean;
  priceFactor: number;
  isHighlighted: boolean;
  isBoundary: boolean;
  isPhantom?: boolean;
  maxDecimals: number;
  updateLimitAmount: any;
  shouldFlash: boolean;
  hasUserOrder?: boolean;
}

const OrderItem = React.forwardRef<HTMLLIElement, OrderItemProps>(
  (
    {
      price,
      size,
      runningTotalSize,
      color,
      width,
      extra,
      isBuyOrder,
      priceFactor,
      isHighlighted,
      isBoundary,
      isPhantom = false,
      maxDecimals,
      updateLimitAmount,
      shouldFlash,
      hasUserOrder = false,
    },
    ref,
  ) => {
    const [flash, setFlash] = useState(shouldFlash);

    useEffect(() => {
      if (flash) {
        const timeout = setTimeout(() => setFlash(false), 500);
        return () => clearTimeout(timeout);
      }
    }, [flash]);

    const totalSizeBarStyle = {
      width: `${width}%`,
      backgroundColor: color,
    };

    const dynamicStyle = {
      height: `calc(var(--order-item-height, 20.5px) + ${extra}px)`,
    };

    if (isPhantom) {
      return (
        <li
          style={dynamicStyle}
          className={`order-item phantom-order ${isBuyOrder ? 'buyOrder' : 'sellOrder'}`}
        />
      );
    }
    
    return (
      <li
        ref={ref}
        style={dynamicStyle}
        className={`order-item-wrapper ${isHighlighted ? 'highlighted' : ''}`}
        onClick={() => {
          updateLimitAmount(price, priceFactor);
        }}
      >
        <div
          className={`order-item ${isBuyOrder ? 'buyOrder' : 'sellOrder'} ${
            isBoundary ? 'boundary' : ''
          } ${flash ? 'flash' : ''}`}
          style={dynamicStyle}
        >
          <div className="totalSizeBar" style={totalSizeBarStyle} />
          <div className="order-content">
            <span className="order-price" style={{ color }}>
              {formatCommas(price.toFixed(Math.log10(priceFactor)))}
              {hasUserOrder && (
                <span className="user-order-dot">•</span>
              )}
            </span>
            <span className="order-size">
              {formatCommas(size.toFixed(maxDecimals))}
            </span>
            <span className="total-size">
              {formatCommas(runningTotalSize.toFixed(maxDecimals))}
            </span>
          </div>
        </div>
      </li>
    );
  },
);

export default OrderItem;