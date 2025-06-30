import React, { useState, useEffect, useRef } from 'react';
import TransactionPopup from '../TransactionPopup/TransactionPopup';
import './TransactionPopupManager.css';

interface TransactionPopupData {
  identifier: string;
  explorerLink: string;
  currentAction: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  price: string;
  address: string;
  isNew?: boolean;
  isExiting?: boolean;
  timestamp: number;
}

interface TransactionPopupManagerProps {
  transactions: TransactionPopupData[];
  setTransactions: React.Dispatch<React.SetStateAction<TransactionPopupData[]>>;
  tokendict: Record<string, any>;
  showPreview?: boolean;
  previewPosition?: string | null;
}


const TransactionPopupManager: React.FC<TransactionPopupManagerProps> = ({
  transactions = [],
  setTransactions,
  tokendict,
  showPreview = false,
  previewPosition
}) => {
  const popupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [popupHeights, setPopupHeights] = useState<Record<string, number>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const notificationPosition = showPreview 
    ? (previewPosition || 'bottom-right')
    : localStorage.getItem('crystal_notification_position') || 'bottom-right';

  const hideNotificationPopups = JSON.parse(
    localStorage.getItem('crystal_hide_notification_popups') || 'false'
  );
  const hiddenPopupTypes: Record<string, boolean> = JSON.parse(
    localStorage.getItem('crystal_hidden_popup_types') || '{}'
  );

  const previewData: TransactionPopupData = {
    identifier: 'preview',
    explorerLink: '#',
    currentAction: 'preview',
    tokenIn: 'ETH',
    tokenOut: 'USDC',
    amountIn: '1.5',
    amountOut: '2847.32',
    price: '1897.55',
    address: '',
    isNew: true,
    isExiting: false,
    timestamp: Date.now()
  };

  const processedTransactions = showPreview 
    ? [previewData]
    : (hideNotificationPopups
        ? transactions.filter(tx => !hiddenPopupTypes[tx.currentAction])
        : transactions);

  const visibleTransactions = showPreview 
    ? processedTransactions 
    : processedTransactions.slice(-4);

  const isTopPosition = notificationPosition?.includes('top');
  const isLeftPosition = notificationPosition?.includes('left');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1020);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const calculateHeights = () => {
      const newHeights: Record<string, number> = {};
      visibleTransactions.forEach((transaction) => {
        const element = popupRefs.current[transaction.identifier];
        if (element) {
          newHeights[transaction.identifier] = element.offsetHeight;
        }
      });
      setPopupHeights(newHeights);
    };

    const timer = setTimeout(calculateHeights, 50);
    return () => clearTimeout(timer);
  }, [visibleTransactions]);

  const handleHidePopup = (identifier: string): void => {
    if (showPreview) return;
    
    setTransactions(prevTransactions =>
      prevTransactions.map(tx =>
        tx.identifier === identifier
          ? { ...tx, isExiting: true, timestamp: Date.now() - 9700 }
          : tx
      )
    );
  };

  const getExpandedPosition = (index: number) => {
    let position = 0;
    const shouldReverseOrder = isTopPosition && !isMobile;
    if (isMobile) {
      for (let i = 0; i < index; i++) {
        const transaction = visibleTransactions[i];
        const height = popupHeights[transaction.identifier] || 100;
        position += height;
      }
    } else {
      if (shouldReverseOrder) {
        for (let i = 0; i < index; i++) {
          const transaction = visibleTransactions[i];
          const height = popupHeights[transaction.identifier] || 100;
          position += height;
        }
      } else {
        for (let i = visibleTransactions.length - 1; i > index; i--) {
          const transaction = visibleTransactions[i];
          const height = popupHeights[transaction.identifier] || 100;
          position += height;
        }
      }
    }

    return position;
  };

  const handleMouseEnter = () => setIsExpanded(true);
  const handleMouseLeave = () => setIsExpanded(false);

  return (
    <div
      className={`popup-stack-container ${isExpanded ? 'expanded' : ''} ${isMobile ? 'mobile' : ''} ${notificationPosition} ${showPreview ? 'preview-mode' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {visibleTransactions.map((transaction, index) => {
        const shouldReverseOrder = isTopPosition && !isMobile;
        const isTop = isMobile 
          ? index === 0 
          : shouldReverseOrder 
            ? index === visibleTransactions.length - 1
            : index === visibleTransactions.length - 1;
        
        const stackIndex = isMobile 
          ? index 
          : shouldReverseOrder
            ? index
            : visibleTransactions.length - 1 - index;
        
        const expandedPosition = getExpandedPosition(index);

        let transformValue;
        if (isExpanded) {
          if (isMobile) {
            transformValue = `translateY(${expandedPosition}px)`;
          } else if (isTopPosition) {
            transformValue = `translateY(${expandedPosition}px)`;
          } else {
            transformValue = `translateY(-${expandedPosition}px)`;
          }
        } else {
          if (isMobile) {
            transformValue = `translateY(${stackIndex * 15}px) scale(${1 - stackIndex * 0.05})`;
          } else if (isTopPosition) {
            transformValue = `translateY(${stackIndex * 15}px) scale(${1 - stackIndex * 0.05})`;
          } else {
            transformValue = `translateY(-${stackIndex * 15}px) scale(${1 - stackIndex * 0.05})`;
          }
        }

        const expandedY = isMobile 
          ? `${expandedPosition}px`
          : isTopPosition 
            ? `${expandedPosition}px`
            : `-${expandedPosition}px`;

        return (
          <div
            className="popup-stack-item"
            key={transaction.identifier}
            ref={el => popupRefs.current[transaction.identifier] = el}
            style={{
              zIndex: isMobile ? 100 - stackIndex : 100 - stackIndex,
              '--expanded-y': expandedY,
              transform: transformValue,
              filter: isExpanded ? '' : `brightness(${1 - stackIndex * 0.05})`,
              padding: isExpanded && stackIndex !== 0 ? '0px 0px 10px 0px' : '',
            } as React.CSSProperties}
            data-index={stackIndex}
          >
            <TransactionPopup
              explorerLink={transaction.explorerLink}
              currentAction={transaction.currentAction}
              tokenIn={tokendict[transaction.tokenIn] || { ticker: 'ETH', image: '/eth-icon.png' }}
              tokenOut={transaction.tokenOut ? tokendict[transaction.tokenOut] || { ticker: 'USDC', image: '/usdc-icon.png' } : null}
              amountIn={transaction.amountIn}
              amountOut={transaction.amountOut}
              price={transaction.price}
              address={transaction.address}
              isNew={!!(isTop && transaction.isNew)}
              isExiting={!!transaction.isExiting}
              hideCallback={() => handleHidePopup(transaction.identifier)}
              delay={showPreview ? 0 : (Date.now() - transaction.timestamp) / 1000}
              slideDirection={isLeftPosition ? 'left' : 'right'}
              isTopPosition={isTopPosition}
            />
          </div>
        );
      })}
    </div>
  );
};

export default TransactionPopupManager;