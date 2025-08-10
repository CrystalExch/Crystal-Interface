
import React, { useEffect, useState } from 'react';
import './WalletOperationPopup.css';
import closebutton from '../../assets/close_button.png';

type Variant = 'success' | 'error' | 'info';

interface WalletOperationPopupProps {
  isVisible: boolean;
  type?: 'distribution' | 'deposit' | 'transfer' | 'send' | 'import' | 'create';
  title: string;
  subtitle?: string;
  amount?: string;
  amountUnit?: string;
  sourceWallet?: string;
  destinationWallet?: string;
  walletCount?: number;
  onClose: () => void;
  autoCloseDelay?: number;
  variant?: Variant;
  isLoading?: boolean;
}

const WalletOperationPopup: React.FC<WalletOperationPopupProps> = ({
  isVisible,
  title,
  subtitle,
  onClose,
  autoCloseDelay = 4000,
  variant = 'info',
  isLoading = false,
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setExiting(false);

      if (!isLoading && autoCloseDelay < 999999) {
        const timer = setTimeout(() => handleClose(), autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoCloseDelay, isLoading]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      setShouldRender(false);
      setExiting(false);
      onClose();
    }, 300);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`wallet-popup-overlay ${exiting ? 'exiting' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`wallet-popup-container ${exiting ? 'slide-out' : 'slide-in'} variant-${variant}`}
      >
        <div className="wallet-popup-content">
          <div className="wallet-popup-header">
            {isLoading && (
              <div className="wallet-popup-left-spinner">
                <div className="wallet-popup-spinner" />
              </div>
            )}

            {!isLoading && (
              <span className={`wallet-popup-status-icon status-${variant}`} aria-hidden="true">
                {variant === 'success' && (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
                {variant === 'error' && (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                )}
                {variant === 'info' && (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                )}
              </span>
            )}

            <div className="wallet-popup-text-content">
              <h3 className="wallet-popup-title">
                {isLoading ? 'Confirming transaction' : title}
              </h3>
              {subtitle && (
                <p className="wallet-popup-subtitle">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        <button className="wallet-popup-close" onClick={handleClose}>
          <img src={closebutton} className="close-button-icon" />
        </button>
      </div>
    </div>
  );
};

export default WalletOperationPopup;