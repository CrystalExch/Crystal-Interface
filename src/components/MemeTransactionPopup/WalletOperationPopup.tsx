import React, { useState, useEffect } from 'react';
import './WalletOperationPopup.css';

interface WalletOperationPopupProps {
  isVisible: boolean;
  type: 'distribution' | 'deposit' | 'transfer' | 'send' | 'import' | 'create';
  title: string;
  subtitle?: string;
  amount?: string;
  sourceWallet?: string;
  destinationWallet?: string;
  walletCount?: number;
  onClose: () => void;
  autoCloseDelay?: number; // in milliseconds, default 4000
}

const WalletOperationPopup: React.FC<WalletOperationPopupProps> = ({
  isVisible,
  type,
  title,
  subtitle,
  amount,
  sourceWallet,
  destinationWallet,
  walletCount,
  onClose,
  autoCloseDelay = 4000
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsAnimatingOut(false);
      
      // Auto close timer
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoCloseDelay]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setShouldRender(false);
      setIsAnimatingOut(false);
      onClose();
    }, 300); 
  };


  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!shouldRender) return null;

  return (
    <div className={`wallet-popup-overlay ${isAnimatingOut ? 'exiting' : ''}`}>
      <div className={`wallet-popup-container ${isAnimatingOut ? 'slide-out' : 'slide-in'}`}>
        <button className="wallet-popup-close" onClick={handleClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Progress bar container */}
        <div className="wallet-popup-progress-container">
          <div 
            className="wallet-popup-progress-bar"
            style={{ animation: `progressBar ${autoCloseDelay}ms linear forwards` }}
          />
        </div>

        <div className="wallet-popup-content">
          <div className="wallet-popup-header">
            <h3 className="wallet-popup-title">{title}</h3>
          </div>
          
          {subtitle && <p className="wallet-popup-subtitle">{subtitle}</p>}

          {/* Operation Details - compact format */}
          <div className="wallet-popup-details">
            {amount && (
              <div className="wallet-popup-detail-group">
                <span className="wallet-popup-detail-value">{amount} MON</span>
                {(sourceWallet || destinationWallet) && (
                  <>
                    {sourceWallet && (
                      <>
                        <span className="wallet-popup-detail-label">from</span>
                        <span className="wallet-popup-detail-value">{formatAddress(sourceWallet)}</span>
                      </>
                    )}
                    {sourceWallet && destinationWallet && (
                      <span className="wallet-popup-arrow">→</span>
                    )}
                    {destinationWallet && (
                      <>
                        {!sourceWallet && <span className="wallet-popup-detail-label">to</span>}
                        <span className="wallet-popup-detail-value">{formatAddress(destinationWallet)}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {!amount && sourceWallet && (
              <div className="wallet-popup-detail-group">
                <span className="wallet-popup-detail-label">from</span>
                <span className="wallet-popup-detail-value">{formatAddress(sourceWallet)}</span>
                {destinationWallet && (
                  <>
                    <span className="wallet-popup-arrow">→</span>
                    <span className="wallet-popup-detail-value">{formatAddress(destinationWallet)}</span>
                  </>
                )}
              </div>
            )}

            {!amount && !sourceWallet && destinationWallet && (
              <div className="wallet-popup-detail-group">
                <span className="wallet-popup-detail-value">{formatAddress(destinationWallet)}</span>
              </div>
            )}

            {walletCount && !amount && (
              <div className="wallet-popup-detail-group">
                <span className="wallet-popup-detail-value">{walletCount} wallets</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletOperationPopup;