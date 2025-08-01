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
    }, 300); // Match animation duration
  };

  const getIcon = () => {
    switch (type) {
      case 'distribution':
        return (
          <div className="wallet-popup-icon distribution">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
          </div>
        );
      case 'deposit':
        return (
          <div className="wallet-popup-icon deposit">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2V22M5 12L12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'transfer':
      case 'send':
        return (
          <div className="wallet-popup-icon transfer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'import':
        return (
          <div className="wallet-popup-icon import">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15V3M7 10L12 15L17 10M19 21H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'create':
        return (
          <div className="wallet-popup-icon create">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="wallet-popup-icon default">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
    }
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
          {/* Header with icon and title */}
          <div className="wallet-popup-header">
            {getIcon()}
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