import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { formatCommas } from '../../../../utils/numberDisplayFormat';
import './HighlightPopup.css';

interface OrderHighlightPopupProps {
  mousePosition: { x: number; y: number };
  highlightData: {
    averagePrice: number;
    totalAmount: number;
    unit: string;
    otherTotalAmount: number;
    otherUnit: string;
  };
  orderbookPosition: string;
  containerRef: React.RefObject<HTMLElement>;
  priceFactor: number;
  marketType: any;
}

const OrderHighlightPopup: React.FC<OrderHighlightPopupProps> = ({
  mousePosition,
  highlightData,
  orderbookPosition,
  containerRef,
  priceFactor,
  marketType,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!highlightData || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = containerRect.left + mousePosition.x;
    const y = containerRect.top + mousePosition.y;
    setPosition({ x, y });
  }, [mousePosition, highlightData, containerRef]);

  if (!highlightData) return null;

  const isLeft = orderbookPosition === 'left';

  const formatNumber = (num: number, decimals: number) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const priceDecimals = Math.max(
    0,
    Math.floor(Math.log10(priceFactor)) +
      Math.floor(
        Math.log10(highlightData.averagePrice / 10 ** Math.log10(priceFactor)),
      ),
  );

  return createPortal(
    <div
      ref={popupRef}
      className={`highlight-popup ${isLeft ? 'left' : ''}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: isLeft
          ? 'translateX(0%) translateY(-50%)'
          : 'translateX(-100%) translateY(-50%)',
      }}
    >
      <div>
      <span style={{color: '#ffffffef'}}>{t('avgPrice')}: </span>
        {formatCommas(
          marketType == 0 ? highlightData.averagePrice.toFixed(Math.floor(Math.log10(priceFactor))) : highlightData.averagePrice.toFixed(Math.floor(Math.log10(10 ** Math.max(0, 5 - Math.floor(Math.log10(highlightData.averagePrice ?? 1)) - 1)))),
        )}{' '}
        {highlightData.unit}
      </div>
      <div>
      <span style={{color: '#ffffffef'}}>{t('total')} {highlightData.unit}: </span>
        {formatCommas(highlightData.totalAmount.toFixed(2))}
      </div>
      <div>
        <span style={{color: '#ffffffef'}}>
          {t('total')} ({highlightData.otherUnit}):{' '}
        </span>
        {formatNumber(
          Number(highlightData.otherTotalAmount),
          Math.max(2, priceDecimals + 1),
        )}
      </div>
    </div>,
    document.body,
  );
};

export default OrderHighlightPopup;
