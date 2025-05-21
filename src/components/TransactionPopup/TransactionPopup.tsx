import React, {useMemo} from 'react';

import popupclose from '../../assets/close_button.png';
import './TransactionPopup.css';

interface TransactionPopupProps {
  explorerLink: string;
  currentAction: string;
  tokenIn: any;
  tokenOut: any;
  amountIn: string;
  amountOut: string;
  price: string;
  address: string;
  hideCallback: any;
  isNew: boolean;
  isExiting: boolean;
  delay: number;
}

const subscriptMap: { [digit: string]: string } = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
};

const formatBalance = (
  rawValue: string | number,
  mode: 'usd' | 'token',
): string => {
  let valueStr = typeof rawValue === 'number' ? rawValue.toString() : rawValue;
  let num = parseFloat(valueStr);

  if (num === 0) {
    return mode === 'usd' ? '0.00' : '0.00';
  }

  const threshold = mode === 'usd' ? 0.01 : 0.0001;
  const prefix = mode === 'usd' ? '' : '';

  if (num > 0 && num < threshold) {
    return mode === 'usd' ? '<0.01' : '<0.0001';
  }

  if (valueStr.toLowerCase().includes('e')) {
    valueStr = mode === 'usd' ? num.toFixed(2) : num.toFixed(10);
    num = parseFloat(valueStr);
  }

  let [intPart, fracPart = ''] = valueStr.split('.');
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (mode === 'usd') {
    fracPart = fracPart.padEnd(2, '0').slice(0, 2);
    return `${prefix}${intPart}.${fracPart}`;
  }

  if (fracPart) {
    let zerosCount = 0;
    for (const char of fracPart) {
      if (char === '0') {
        zerosCount++;
      } else {
        break;
      }
    }

    if (zerosCount > 3) {
      const remainder = fracPart.slice(zerosCount);
      const zerosSubscript = zerosCount
        .toString()
        .split('')
        .map((digit) => subscriptMap[digit] || digit)
        .join('');

      return `${intPart}.0${zerosSubscript}${remainder}`;
    } else {
      return `${intPart}.${fracPart}`;
    }
  }

  return intPart;
};

const TransactionPopup: React.FC<TransactionPopupProps> = ({
  explorerLink,
  currentAction,
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  price,
  address,
  hideCallback,
  isNew,
  isExiting,
  delay,
}) => {
  const memoizedDelay = useMemo(() => delay || 0, []);
  
  const renderErrorX = () => (
    <div className="txpopup-error-x-container">
      <div className="txpopup-error-x-glow"></div>
      <div className="txpopup-error-x">
        <div className="txpopup-error-circle"></div>
        <div className="txpopup-error-x-line1"></div>
        <div className="txpopup-error-x-line2"></div>
      </div>
    </div>
  );
  
  const renderTransactionDetails = () => {
    if (currentAction === 'swap') {
      return (
        <div className="txpopup-inner">
          <div className="txpopup-main-content">
            <div className="txpopup-title">{t('swapComplete')}</div>
            <div className="txpopup-swap-details">
              <div className="txpopup-token-group">
                <img src={tokenIn.image} className="txpopup-token-icon" />
                <span className="txpopup-amount">
                  {formatBalance(
                    amountIn,
                    tokenIn.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenIn.ticker}
                </span>
                <span className="txpopup-arrow">→</span>
                <img src={tokenOut.image} className="txpopup-token-icon" />
                <span className="txpopup-amount">
                  {formatBalance(
                    amountOut,
                    tokenOut.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenOut.ticker}
                </span>
              </div>
            </div>
          </div>
          <a
            className="view-transaction"
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (currentAction === 'limit') {
      return (
        <div className="txpopup-inner">
          <div className="txpopup-main-content">
            <div className="txpopup-title">{t('limitComplete')}</div>
            <div className="txpopup-swap-details">
              <div className="txpopup-token-group">
                <img src={tokenIn.image} className="txpopup-token-icon" />
                <span className="txpopup-amount">
                  {formatBalance(
                    amountIn,
                    tokenIn.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenIn.ticker}
                </span>
                <span className="txpopup-arrow">→</span>
                <img src={tokenOut.image} className="txpopup-token-icon" />
                <span className="txpopup-amount">
                  {formatBalance(
                    amountOut,
                    tokenOut.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenOut.ticker}
                </span>
              </div>
              <div className="txpopup-price">
                <span className="txpopup-price-label">at</span>
                <span className="txpopup-price-value">{price}</span>
              </div>
            </div>
          </div>
          <a
            className="view-transaction"
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (currentAction === 'send') {
      return (
        <div className="txpopup-inner">
          <div className="txpopup-main-content">
            <div className="txpopup-title">{t('sendComplete')}</div>
            <div className="txpopup-token-details">
              <img src={tokenIn.image} className="txpopup-token-icon" />
              <div className="txpopup-token-group">
                <span className="txpopup-amount">
                  {formatBalance(
                    amountIn,
                    tokenIn.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenIn.ticker}
                </span>
                <span className="txpopup-arrow">→</span>
                <div className="txpopup-recipient">{`${address.slice(0, 6)}...${address.slice(-4)}`}</div>
              </div>
            </div>
          </div>
          <a
            className="view-transaction"
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (currentAction === 'cancel') {
      return (
        <div className="txpopup-inner">
          <div className="txpopup-main-content">
            <div className="txpopup-title">{t('limitCancelled')}</div>
            <div className="txpopup-swap-details">
              <div className="txpopup-token-group">
                <img src={tokenIn.image} className="txpopup-token-icon" />
                <span className="txpopup-amount">
                  {formatBalance(
                    amountIn,
                    tokenIn.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenIn.ticker}
                </span>
                <span className="txpopup-arrow">→</span>
                <img src={tokenOut.image} className="txpopup-token-icon" />
                <span className="txpopup-amount">
                  {formatBalance(
                    amountOut,
                    tokenOut.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenOut.ticker}
                </span>
              </div>
              <div className="txpopup-price">
                <span className="txpopup-price-label">at</span>
                <span className="txpopup-price-value">{price}</span>
              </div>
            </div>
          </div>
          <a
            className="view-transaction"
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (currentAction === 'fill') {
      return (
        <div className="txpopup-inner">
          <div className="txpopup-main-content">
            <div className="txpopup-title">{t('fillComplete')}</div>
            <div className="txpopup-swap-details">
              <div className="txpopup-token-group">
                <img src={tokenIn.image} className="txpopup-token-icon" />
                <span className="txpopup-amount">
                  {formatBalance(
                    amountIn,
                    tokenIn.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenIn.ticker}
                </span>
                <span className="txpopup-arrow">→</span>
                <img src={tokenOut.image} className="txpopup-token-icon" />
                <span className="txpopup-amount">
                  {formatBalance(
                    amountOut,
                    tokenOut.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenOut.ticker}
                </span>
              </div>
              <div className="txpopup-price">
                <span className="txpopup-price-label">filled at</span>
                <span className="txpopup-price-value">{price}</span>
              </div>
            </div>
          </div>
          <a
            className="view-transaction"
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (currentAction === 'wrap') {
      return (
        <div className="txpopup-inner">
          <div className="txpopup-main-content">
            <div className="txpopup-title">{t('wrapComplete')}</div>
            <div className="txpopup-swap-details">
              <div className="txpopup-token-group">
                <img src={tokenIn.image} className="txpopup-token-icon" />
                <span className="txpopup-amount">
                  {formatBalance(
                    amountIn,
                    tokenIn.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenIn.ticker}
                </span>
                <span className="txpopup-arrow">→</span>
                <img src={tokenOut.image} className="txpopup-token-icon" />
                <span className="txpopup-amount">
                  {formatBalance(
                    amountOut,
                    tokenOut.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenOut.ticker}
                </span>
              </div>
            </div>
          </div>
          <a
            className="view-transaction"
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (currentAction === 'stake') {
      return (
        <div className="txpopup-inner">
          <div className="txpopup-main-content">
            <div className="txpopup-title">{t('stakeComplete')}</div>
            <div className="txpopup-swap-details">
              <div className="txpopup-token-group">
                <img src={tokenIn.image} className="txpopup-token-icon" />
                <span className="txpopup-amount">
                  {formatBalance(
                    amountIn,
                    tokenIn.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenIn.ticker}
                </span>
                <span className="txpopup-arrow">→</span>
                <img src={tokenOut.image} className="txpopup-token-icon" />
                <span className="txpopup-amount">
                  {formatBalance(
                    amountOut,
                    tokenOut.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenOut.ticker}
                </span>
              </div>
            </div>
          </div>
          <a
            className="view-transaction"
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (currentAction === 'unwrap') {
      return (
        <div className="txpopup-inner">
          <div className="txpopup-main-content">
            <div className="txpopup-title">{t('unwrapComplete')}</div>
            <div className="txpopup-swap-details">
              <div className="txpopup-token-group">
                <img src={tokenIn.image} className="txpopup-token-icon" />
                <span className="txpopup-amount">
                  {formatBalance(
                    amountIn,
                    tokenIn.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenIn.ticker}
                </span>
                <span className="txpopup-arrow">→</span>
                <img src={tokenOut.image} className="txpopup-token-icon" />
                <span className="txpopup-amount">
                  {formatBalance(
                    amountOut,
                    tokenOut.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenOut.ticker}
                </span>
              </div>
            </div>
          </div>
          <a
            className="view-transaction"
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (currentAction === 'approve') {
      return (
        <div className="txpopup-inner">
          <div className="txpopup-main-content">
            <div className="txpopup-title">{t('approveComplete')}</div>
            <div className="txpopup-token-details">
              <img src={tokenIn.image} className="txpopup-token-icon" />
              <div className="txpopup-token-group">
                <span className="txpopup-amount">
                  {formatBalance(
                    amountIn,
                    tokenIn.ticker === 'USDC' ? 'usd' : 'token',
                  ) +
                    ' ' +
                    tokenIn.ticker}
                </span>
                <span className="txpopup-arrow">→</span>
                <div className="txpopup-recipient">{`${address.slice(0, 6)}...${address.slice(-4)}`}</div>
              </div>
            </div>
          </div>
          <a
            className="view-transaction"
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (currentAction === 'sendFailed') {
      return (
        <div className="txpopup-inner-failed">
          {renderErrorX()}
          <div className="txpopup-failed-content">
            <div className="txpopup-title-failed">{t('sendFailed')}</div>
            <a
              className="view-transaction"
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('viewOnExplorer')}
            </a>
          </div>
        </div>
      );
    }   
    
    if (currentAction === 'swapFailed') {
      return (
        <div className="txpopup-inner-failed">
          {renderErrorX()}
          <div className="txpopup-failed-content">
            <div className="txpopup-title-failed">{t('swapFailed')}</div>

            <a
              className="view-transaction"
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('viewOnExplorer')}
            </a>
          </div>
        </div>
      );
    }   
    
    if (currentAction === 'limitFailed') {
      return (
        <div className="txpopup-inner-failed">
          {renderErrorX()}
          <div className="txpopup-failed-content">
            <div className="txpopup-title-failed">{t('limitFailed')}</div>
            <a
              className="view-transaction"
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('viewOnExplorer')}
            </a>
          </div>
        </div>
      );
    }

    return null;
  };
  return (
    <div className={`txpopup ${isNew ? 'new' : ''} ${isExiting ? 'exit' : ''} ${currentAction.includes('Failed') ? 'failed' : ''}`}>
      <div className="txpopup-progress-container">
        <div 
          className="txpopup-progress-bar" 
          style={{animation: `progressBar 10s linear forwards -${memoizedDelay}s`}}
        ></div>
      </div>
      <button
        className="txpopup-close-button"
        onClick={hideCallback}
      >
        <img src={popupclose} className="txpopup-close-button-icon" />
      </button>
      {renderTransactionDetails()}
    </div>
  );
};

export default TransactionPopup;