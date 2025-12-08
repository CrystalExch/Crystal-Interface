import React, { useEffect, useState } from 'react';

import { formatCommas, formatSubscript } from '../../../../utils/numberDisplayFormat';

import './OrderItem.css';
import { formatSig } from '../../../OrderCenter/utils';

interface OrderItemProps {
  price: number;
  size: number;
  totalSize: number;
  color: string;
  width: number;
  extra: number;
  isBuyOrder: boolean;
  priceFactor: number;
  isHighlighted: boolean;
  isBoundary: boolean;
  isPhantom?: boolean;
  maxDecimals: number;
  updateLimitAmount: any;
  shouldFlash: boolean;
  hasUserOrder?: boolean;
  marketType: any;
}

const OrderItem = React.forwardRef<HTMLLIElement, OrderItemProps>(
  (
    {
      price,
      size,
      totalSize,
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
      marketType,
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

    useEffect(() => {
      if (shouldFlash) {
        setFlash(false)
        queueMicrotask(() => {
          setFlash(true)
        })
      }
    }, [shouldFlash])

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
        className={`order-item-wrapper ${isHighlighted ? 'highlighted' : ''} ${
          isBuyOrder ? 'buy-order' : 'sell-order'
        }`}
        onClick={() => {
          updateLimitAmount(price, priceFactor, marketType != 0 && price ? 10 ** Math.max(0, 5 - Math.floor(Math.log10(price ?? 1)) - 1) : Number(priceFactor));
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
              {formatSubscript(formatSig(price.toFixed(Math.floor(Math.log10(priceFactor))), marketType != 0))}
              {hasUserOrder && (
                <span className="user-order-dot">•</span>
              )}
            </span>
            <span className="order-size">
              {formatCommas(size.toFixed(maxDecimals))}
            </span>
            <span className="total-size">
              {formatCommas(totalSize.toFixed(maxDecimals))}
            </span>
          </div>
        </div>
      </li>
    );
  },
);

export default OrderItem;