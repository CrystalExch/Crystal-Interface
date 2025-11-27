import React, { useEffect, useState } from 'react';
import './WalletOperationPopup.css';
import closebutton from '../../assets/close_button.png';
import clipboard from '../../assets/clipboard.png';
import monadicon from '../../assets/monadlogo.svg';
type Variant = 'success' | 'error' | 'info';

interface WalletOperationPopupProps {
  isVisible: boolean;
  type?: 'distribution' | 'deposit' | 'transfer' | 'send' | 'import' | 'create' | 'wallet_trade';
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
  onClick?: () => void;
  isClickable?: boolean;
  walletEmoji?: string;
  walletName?: string;
  timestamp?: number;
  actionType?: 'buy' | 'sell';
  walletAddress?: string;
  onToggleNotifications?: (address: string) => void;
  notificationsEnabled?: boolean;
}

const WalletOperationPopup: React.FC<WalletOperationPopupProps> = ({
  isVisible,
  type,
  title,
  subtitle,
  tokenImage,
  onClose,
  autoCloseDelay = 4000,
  variant = 'info',
  isLoading = false,
  onClick,
  isClickable = false,
  walletEmoji,
  walletName,
  timestamp,
  actionType,
  walletAddress,
  onToggleNotifications,
  notificationsEnabled = true,
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [exiting, setExiting] = useState(false);
  const formatTimestamp = (ts?: number) => {
    if (!ts) return '';
    const now = Date.now();
    const tradeTime = ts > 1e12 ? ts : ts * 1000;
    const secondsAgo = Math.max(0, Math.floor((now - tradeTime) / 1000));

    if (secondsAgo < 60) return `${secondsAgo}s`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h`;
    return `${Math.floor(secondsAgo / 86400)}d`;
  };
  const crystal = '/CrystalLogo.png';

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
  const handleToggleNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (walletAddress && onToggleNotifications) {
      onToggleNotifications(walletAddress);
    }
  };
  const renderSubtitleWithImage = () => {
    if (!subtitle) return null;

    if (!tokenImage) {
      return <span>{subtitle}</span>;
    }

    const patterns = [
      // Trading patterns
      /(\b(?:worth of|of)\s+)([A-Z][A-Z0-9]*\b)/i, // "worth of TOKEN" or "of TOKEN"
      /(\bBuying\s+[\d.,]+\s+[A-Z]+\s+worth\s+of\s+)([A-Z][A-Z0-9]*\b)/i, // "Buying 5 MON worth of TOKEN"
      /(\bSelling\s+[\d.,]+\s+(?:[A-Z]+\s+worth\s+)?(?:of\s+)?)([A-Z][A-Z0-9]*\b)/i, // "Selling 25% of TOKEN" or "Selling 5 MON worth of TOKEN"

      // Success patterns
      /(\bBought\s+[≈~]?\s*[\d.,]+\s+)([A-Z][A-Z0-9]*\b)/i, // "Bought ~ 123 TOKEN"
      /(\bSold\s+[\d.,]+\s+)([A-Z][A-Z0-9]*\b)/i, // "Sold 123 TOKEN"
      /(\bReceived\s+[≈~]?\s*[\d.,]+\s+)([A-Z][A-Z0-9]*\b)/i, // "Received ~ 123 TOKEN"

      // Confirmation patterns  
      /(\bConfirming\s+[\w\s]*?\s+)([A-Z][A-Z0-9]*\b)/i, // "Confirming transaction... TOKEN"
      /(\bfor\s+[≈~]?\s*[\d.,]+\s+)([A-Z][A-Z0-9]*\b)/i, // "for ~ 5.4 TOKEN"

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
              }}
            />
            {tokenSymbol}
            {afterToken}
          </span>
        );
      }
    }

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
        className={`wallet-popup-container ${exiting ? 'slide-out' : 'slide-in'} variant-${variant} ${isClickable ? 'clickable' : ''}`}
        onClick={isClickable && onClick ? () => {
          onClick();
        } : undefined}
        style={{ cursor: isClickable ? 'pointer' : 'default' }}
      >
        <div className="wallet-popup-content">
          <div className="wallet-popup-header">
            {isLoading && (
              <div className="wallet-popup-left-spinner">
                <div className="wallet-popup-spinner" />
              </div>
            )}

            {!isLoading && walletEmoji && walletName ? (
              <>
                <div className="wallet-popup-wallet-section">
                  <div className="wallet-popup-emoji-avatar">
                    <span>                {
                      tokenImage && (
                        <div className="wallet-popup-token-icon-wrapper">
                          <img src={tokenImage} alt="Token" className="wallet-popup-token-icon" />
                        </div>
                      )}</span>
                  </div>
                  <div className="wallet-popup-wallet-info">
                    {timestamp && (
                      <span className={`tracker-wallet-popup-timestamp ${actionType === 'buy' ? 'action-buy' : actionType === 'sell' ? 'action-sell' : ''}`}>{formatTimestamp(timestamp)}</span>
                    )}
                    <div className="nadfun-launchpad-tracker-noti">
                      <svg width="8" height="8" viewBox="0 0 32 32" className="header-launchpad-logo" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="nadfun" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7C55FF" stopOpacity="1" />
                            <stop offset="100%" stopColor="#AD5FFB" stopOpacity="1" />
                          </linearGradient>
                        </defs>
                        <path fill="url(#nadfun)" d="m29.202 10.664-4.655-3.206-3.206-4.653A6.48 6.48 0 0 0 16.004 0a6.48 6.48 0 0 0-5.337 2.805L7.46 7.458l-4.654 3.206a6.474 6.474 0 0 0 0 10.672l4.654 3.206 3.207 4.653A6.48 6.48 0 0 0 16.004 32a6.5 6.5 0 0 0 5.337-2.805l3.177-4.616 4.684-3.236A6.49 6.49 0 0 0 32 16.007a6.47 6.47 0 0 0-2.806-5.335zm-6.377 5.47c-.467 1.009-1.655.838-2.605 1.06-2.264.528-2.502 6.813-3.05 8.35-.424 1.484-1.916 1.269-2.272 0-.631-1.53-.794-6.961-2.212-7.993-.743-.542-2.502-.267-3.177-.95-.668-.675-.698-1.729-.023-2.412l5.3-5.298a1.734 1.734 0 0 1 2.45 0l5.3 5.298c.505.505.586 1.306.297 1.937z" />
                      </svg>
                    </div>
                    <div className="wallet-popup-wallet-name-row">
                      <span className="wallet-popup-wallet-name">{walletEmoji} {walletName}</span>
                      {isLoading ? 'Confirming transaction' : (
                        <>
                          <span className={`wallet-popup-action ${actionType === 'buy' ? 'action-buy' : actionType === 'sell' ? 'action-sell' : ''}`}>
                            {title.split(' ').slice(0, -1).join(' ')}
                          </span>
                          {' '}
                          <span className="wallet-popup-token-name">
                            {title.split(' ').pop()}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="wallet-popup-subtitle-row">
                      <p className="tracker-wallet-popup-subtitle">
                        <img className="tracker-noti-monad-icon" src={monadicon} />
                        {(() => {
                          if (!subtitle) return null;

                          const parts = subtitle.split(' at ');
                          if (parts.length === 2) {
                            return (
                              <>
                                <span className={actionType === 'buy' ? 'action-buy' : actionType === 'sell' ? 'action-sell' : ''}>
                                  {parts[0]}
                                </span>
                                {' at '}
                                {parts[1]}
                              </>
                            );
                          }
                          return subtitle;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {!isLoading && !walletEmoji && (
                  <span className={`wallet-popup-status-icon status-${variant}`} aria-hidden="true">
                    {variant === 'success' && title.toLowerCase().includes('copied') && (
                      <img src={clipboard} className="clipboard" alt="Copied" width="20" height="20" />
                    )}
                    {variant === 'success' && !title.toLowerCase().includes('copied') && (
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
                  <div className="wallet-popup-title-row">
                    <h3 className="wallet-popup-title">
                      {isLoading ? 'Confirming transaction' : title}
                    </h3>
                  </div>
                  {subtitle && (
                    <p className="wallet-popup-subtitle">
                      {renderSubtitleWithImage()}
                      {isClickable && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px', opacity: 0.7 }}>
                          <path d="M7 17L17 7M17 7H7M17 7V17" />
                        </svg>
                      )}
                    </p>
                  )}
                </div>
              </>
            )}

          </div>
        </div>

        {type === 'wallet_trade' && walletEmoji && walletName && !isLoading && (
          <button
            className="wallet-popup-notification-toggle"
            onClick={handleToggleNotifications}
            title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
          >
            {notificationsEnabled ? (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="rgb(235, 112, 112)" stroke="rgb(235, 112, 112)" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            )}
          </button>
        )}

        <button className="wallet-popup-close" onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}>
          <img src={closebutton} className="close-button-icon" />
        </button>
      </div>
    </div>
  );
};

export default WalletOperationPopup;