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
}

const TransactionPopupManager: React.FC<TransactionPopupManagerProps> = ({
  transactions = [],
  setTransactions,
  tokendict
}) => {
  const popupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [popupHeights, setPopupHeights] = useState<Record<string, number>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  let visibleTransactions = transactions.slice(-4);
  
  if (isMobile) {
    visibleTransactions = [...visibleTransactions].reverse();
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1020);
    };
    
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
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
    
    if (isMobile) {
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
    
    return position;
  };

  const handleMouseEnter = () => setIsExpanded(true);
  const handleMouseLeave = () => setIsExpanded(false);

  return (
    <div 
      className={`popup-stack-container ${isExpanded ? 'expanded' : ''} ${isMobile ? 'mobile' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {visibleTransactions.map((transaction, index) => {
        const isTop = isMobile ? index === 0 : index === visibleTransactions.length - 1;
        const stackIndex = isMobile ? index : visibleTransactions.length - 1 - index;
        const expandedPosition = getExpandedPosition(index);
        
        const transformValue = isExpanded
          ? isMobile
            ? `translateY(${expandedPosition}px)` 
            : `translateY(-${expandedPosition}px)`
          : isMobile
            ? `translateY(${stackIndex * 15}px) scale(${1 - stackIndex * 0.05})`
            : `translateY(-${stackIndex * 15}px) scale(${1 - stackIndex * 0.05})`;
          
        return (
          <div
            className="popup-stack-item"
            key={transaction.identifier}
            ref={el => popupRefs.current[transaction.identifier] = el}
            style={{ 
              zIndex: isMobile ? 100 - stackIndex : 100 - stackIndex, 
              '--expanded-y': isMobile ? `${expandedPosition}px` : `-${expandedPosition}px`,
              transform: transformValue,
              filter: isExpanded ? '' : ` brightness(${1 - stackIndex * 0.05}) `,
              padding: isExpanded && stackIndex !== 0 ? '0px 0px 10px 0px' : '',
            } as React.CSSProperties}
            data-index={stackIndex}
          >
            <TransactionPopup
              explorerLink={transaction.explorerLink}
              currentAction={transaction.currentAction}
              tokenIn={tokendict[transaction.tokenIn]}
              tokenOut={transaction.tokenOut ? tokendict[transaction.tokenOut] : null}
              amountIn={transaction.amountIn}
              amountOut={transaction.amountOut}
              price={transaction.price}
              address={transaction.address}
              isNew={!!(isTop && transaction.isNew)}
              isExiting={!!transaction.isExiting}
              hideCallback={() => handleHidePopup(transaction.identifier)}
              delay={(Date.now() - transaction.timestamp) / 1000}
            />
          </div>
        );
      })}
    </div>
  );
};

export default TransactionPopupManager;