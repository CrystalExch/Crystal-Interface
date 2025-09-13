import React, { useEffect, useState } from 'react';
import './WalletOperationPopup.css';
import closebutton from '../../assets/close_button.png';

type Variant = 'success' | 'error' | 'info';

interface WalletOperationPopupProps {
  isVisible: boolean;
  type?: 'distribution' | 'deposit' | 'transfer' | 'send' | 'import' | 'create';
  title: string;
  subtitle?: string;
  tokenImage?: string;
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
  tokenImage,
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

  // Function to render subtitle with inline token image
  const renderSubtitleWithImage = () => {
    if (!subtitle) return null;
    
    if (!tokenImage) {
      return <span>{subtitle}</span>;
    }

    // Look for common patterns where we want to insert the token image
    // Priority: token being traded gets the image, not the currency
    const patterns = [
      // Trading patterns - token before "for" gets priority
      /(\bSold\s+[\d.,]+[A-Z]*\s+)([A-Z][A-Z0-9]*\b)(\s+for)/i, // "Sold 123M CRYSTAL for" - CRYSTAL gets image
      /(\bBought\s+[≈~]?\s*[\d.,]+[A-Z]*\s+)([A-Z][A-Z0-9]*\b)(\s+(?:for|with))/i, // "Bought ~ 123 CRYSTAL for/with" 
      /(\bReceived\s+[≈~]?\s*[\d.,]+[A-Z]*\s+)([A-Z][A-Z0-9]*\b)(\s+(?:for|from))/i, // "Received ~ 123 CRYSTAL for"
      
      // "worth of" patterns - token after "of" gets image
      /(\b(?:worth of|of)\s+)([A-Z][A-Z0-9]*\b)/i, // "worth of TOKEN" or "of TOKEN"
      /(\bBuying\s+[\d.,]+\s+[A-Z]+\s+worth\s+of\s+)([A-Z][A-Z0-9]*\b)/i, // "Buying 5 MON worth of TOKEN"
      /(\bSelling\s+[\d.,]+\s+(?:[A-Z]+\s+worth\s+)?(?:of\s+)?)([A-Z][A-Z0-9]*\b)/i, // "Selling 25% of TOKEN"
      
      // Confirmation patterns - look for token in transaction context
      /(\bConfirming\s+(?:transaction|buy|sell)[\w\s]*?worth\s+of\s+)([A-Z][A-Z0-9]*\b)/i, // "Confirming transaction... worth of TOKEN"
      /(\bConfirming\s+(?:sell)[\w\s]*?)([A-Z][A-Z0-9]*\b)(\s+(?:for|to))/i, // "Confirming sell... TOKEN for"
      
      // Simple patterns when no "for" present
      /(\bBought\s+[≈~]?\s*[\d.,]+[A-Z]*\s+)([A-Z][A-Z0-9]*\b)(?!\s+for)/i, // "Bought ~ 123 TOKEN" (not followed by "for")
      /(\bSold\s+[\d.,]+[A-Z]*\s+)([A-Z][A-Z0-9]*\b)(?!\s+for)/i, // "Sold 123 TOKEN" (not followed by "for")
      /(\bReceived\s+[≈~]?\s*[\d.,]+[A-Z]*\s+)([A-Z][A-Z0-9]*\b)(?!\s+for)/i, // "Received ~ 123 TOKEN" (not followed by "for")
      
      // Error patterns
      /(\bNot\s+enough\s+)([A-Z][A-Z0-9]*\b)/i, // "Not enough TOKEN"
      /(\bInsufficient\s+)([A-Z][A-Z0-9]*\b)/i, // "Insufficient TOKEN"
    ];

    for (const pattern of patterns) {
      const match = subtitle.match(pattern);
      if (match) {
        const beforeToken = subtitle.substring(0, match.index! + match[1].length);
        const tokenSymbol = match[2];
        const afterToken = subtitle.substring(match.index! + match[0].length);
        
        return (
          <span>
            {beforeToken}
            <img
              src={tokenImage}
              alt="Token"
              className="wallet-popup-token-image"
              style={{ 
                display: 'inline', 
                width: '16px', 
                height: '16px', 
                marginRight: '4px',
                verticalAlign: 'text-bottom'
              }}
            />
            {tokenSymbol}
            {afterToken}
          </span>
        );
      }
    }

    // If no pattern matches, just show the subtitle normally
    return <span>{subtitle}</span>;
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
                  {renderSubtitleWithImage()}
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