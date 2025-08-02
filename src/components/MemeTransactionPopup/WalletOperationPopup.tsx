import React, { useEffect, useState } from 'react';
import './WalletOperationPopup.css';

type Variant = 'success' | 'error' | 'info';

interface WalletOperationPopupProps {
  isVisible: boolean;
  /** semantic operation type (not used for styling, but keep for future) */
  type?: 'distribution' | 'deposit' | 'transfer' | 'send' | 'import' | 'create';
  title: string;
  subtitle?: string;

  /** Displayed amount, e.g. "1.2500" */
  amount?: string;
  /** Unit for amount, defaults to "MON" (e.g. "TOKEN") */
  amountUnit?: string;

  /** Optional addresses for compact "from → to" line */
  sourceWallet?: string;
  destinationWallet?: string;

  /** Optional count for batch operations */
  walletCount?: number;

  /** Called when the popup closes (auto or manual) */
  onClose: () => void;

  /** Auto close delay in ms (default 4000) */
  autoCloseDelay?: number;

  /** Visual state of the popup (default "info") */
  variant?: Variant;

  /** Show loading spinner */
  isLoading?: boolean;
}

const WalletOperationPopup: React.FC<WalletOperationPopupProps> = ({
  isVisible,
  type = 'transfer',
  title,
  subtitle,
  amount,
  amountUnit = 'MON',
  sourceWallet,
  destinationWallet,
  walletCount,
  onClose,
  autoCloseDelay = 4000,
  variant = 'info',
  isLoading = false,
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [exiting, setExiting] = useState(false);
  
  console.log('💳 WalletOperationPopup render:', { isVisible, title, shouldRender, isLoading });

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setExiting(false);

      if (autoCloseDelay < 999999) {
        const timer = setTimeout(() => handleClose(), autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoCloseDelay]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      setShouldRender(false);
      setExiting(false);
      onClose();
    }, 300);
  };

  const formatAddress = (addr?: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

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
        <button className="wallet-popup-close" onClick={handleClose} aria-label="Close notification">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* progress bar - only show for confirmed transactions */}
        {!isLoading && (variant === 'success' || variant === 'error') && (
          <div className="wallet-popup-progress-container" aria-hidden="true">
            <div
              className="wallet-popup-progress-bar"
              style={{ animation: `progressBar ${autoCloseDelay}ms linear forwards` }}
            />
          </div>
        )}

        <div className="wallet-popup-content">
          <div className="wallet-popup-header">
            <span className={`wallet-popup-status-icon status-${variant}`} aria-hidden="true">
              {variant === 'success' && (
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
              {variant === 'error' && (
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v5M12 16h.01" />
                </svg>
              )}
              {variant === 'info' && (
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              )}
            </span>
            <h3 className="wallet-popup-title">{title}</h3>
            
            {/* Inline loading spinner - ONLY shows when isLoading is true */}
            {isLoading && (
              <div className="wallet-popup-inline-loading-spinner">
                <div className="wallet-popup-spinner" />
              </div>
            )}
          </div>

          {subtitle && <p className="wallet-popup-subtitle">{subtitle}</p>}

          {/* compact details */}
          <div className="wallet-popup-details">
            {amount && (
              <div className="wallet-popup-detail-group">
                <span className="wallet-popup-detail-value">
                  {amount} {amountUnit}
                </span>

                {(sourceWallet || destinationWallet) && (
                  <>
                    {sourceWallet && (
                      <>
                        <span className="wallet-popup-detail-label">from</span>
                        <span className="wallet-popup-detail-value">
                          {formatAddress(sourceWallet)}
                        </span>
                      </>
                    )}
                    {sourceWallet && destinationWallet && (
                      <span className="wallet-popup-arrow">→</span>
                    )}
                    {destinationWallet && (
                      <>
                        {!sourceWallet && <span className="wallet-popup-detail-label">to</span>}
                        <span className="wallet-popup-detail-value">
                          {formatAddress(destinationWallet)}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {!amount && (sourceWallet || destinationWallet) && (
              <div className="wallet-popup-detail-group">
                {sourceWallet && (
                  <>
                    <span className="wallet-popup-detail-label">from</span>
                    <span className="wallet-popup-detail-value">
                      {formatAddress(sourceWallet)}
                    </span>
                  </>
                )}
                {sourceWallet && destinationWallet && (
                  <span className="wallet-popup-arrow">→</span>
                )}
                {destinationWallet && (
                  <span className="wallet-popup-detail-value">
                    {formatAddress(destinationWallet)}
                  </span>
                )}
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