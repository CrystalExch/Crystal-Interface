import React, { useState, useEffect } from 'react';
import closebutton from '../../assets/close_button.png';
import backarrow from '../../assets/arrow.svg';
import './TransactionHistoryMenu.css';

type TxType = any;

interface TransactionHistoryMenuProps {
  isOpen: boolean;
  onClose: () => void;
  setPendingNotifs: any;
  transactions: any[]; 
  tokendict: any;
  walletAddress?: string;
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
  mode: 'usd' | 'token'
): string => {
  let valueStr = typeof rawValue === 'number' ? rawValue.toString() : rawValue;
  let num = parseFloat(valueStr);

  if (num === 0) {
    return '0.00';
  }

  const threshold = mode === 'usd' ? 0.01 : 0.0001;
  const prefix = '';

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

const TransactionHistoryMenu: React.FC<TransactionHistoryMenuProps> = ({
  isOpen,
  onClose,
  setPendingNotifs,
  transactions,
  tokendict,
  walletAddress,
}) => {
  const [sortedTransactions, setSortedTransactions] = useState<[TxType[], string]>([[], '']);
  const [closing, setClosing] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TxType | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPendingNotifs(0);
      setClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (showDetailView) {
      setShowDetailView(false);
      setSelectedTx(null);
      return;
    }
    
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 300);
  };

  useEffect(() => {
    setSortedTransactions((prev) => {
      let result = prev[0];
      if (walletAddress != prev[1]) {
        setTimeout(() => {setPendingNotifs(0)}, 0);
        const cached = localStorage.getItem(`txHistory_${walletAddress}`);
        if (cached) {
          try {
            result = JSON.parse(cached);
          } catch (err) {
            console.error(err);
          }
        }
        else {
          result = [];
        }
      }
      else if (transactions.length > 0 && walletAddress) {
        const existingIds = new Set(prev[0].map((tx: any) => tx.identifier));
        const newTx = transactions.filter((tx) => !existingIds.has(tx.identifier));
        setTimeout(() => {setPendingNotifs((prev: any) => {return Math.min(prev + newTx.length, 100)})}, 0);
        const merged = [...prev[0], ...newTx];
        merged.sort((a, b) => b.timestamp - a.timestamp);
        result = merged.slice(0, 100);
        localStorage.setItem(`txHistory_${walletAddress}`, JSON.stringify(result));
      }
      return [result, walletAddress || ''];
    });
  }, [transactions]);

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  };

  const formatFullDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleTxClick = (tx: TxType) => {
    setSelectedTx(tx);
    setShowDetailView(true);
  };

  const renderTransactionDetails = (tx: TxType) => {
    const tokenIn = tokendict[tx.tokenIn];
    const tokenOut = tx.tokenOut ? tokendict[tx.tokenOut] : null;

    const renderErrorX = () => (
      <div className="txhistory-error-x-container">
        <div className="txhistory-error-circle"></div>
        <div className="txhistory-error-x-line1"></div>
        <div className="txhistory-error-x-line2"></div>
      </div>
    );

    if (tx.currentAction === 'swap') {
      return (
        <div className="txhistory-inner">
          <div className="txhistory-main-content">
            <div className="txhistory-title">{t('swapComplete')}
              <div className="txhistory-item-time">{formatTimeAgo(tx.timestamp)}</div>
            </div>
            <div className="txhistory-swap-details">
              <div className="txhistory-token-group">
                <img src={tokenIn.image} className="txhistory-token-icon" />
                <span className="txhistory-amount">
                  {formatBalance(tx.amountIn, tokenIn.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenIn.ticker}
                </span>
                <span className="txhistory-arrow">→</span>
                <img src={tokenOut.image} className="txhistory-token-icon" />
                <span className="txhistory-amount">
                  {formatBalance(tx.amountOut, tokenOut.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenOut.ticker}
                </span>
              </div>
            </div>
          </div>
          <a className="txhistory-view-transaction" href={tx.explorerLink} target="_blank" rel="noopener noreferrer">
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (tx.currentAction === 'limit') {
      return (
        <div className="txhistory-inner">
          <div className="txhistory-main-content">
          <div className="txhistory-title">{t('limitComplete')}
            <div className="txhistory-item-time">{formatTimeAgo(tx.timestamp)}</div>
          </div>
            <div className="txhistory-swap-details">
              <div className="txhistory-token-group">
                <img src={tokenIn.image} className="txhistory-token-icon" />
                <span className="txhistory-amount">
                  {formatBalance(tx.amountIn, tokenIn.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenIn.ticker}
                </span>
                <span className="txhistory-arrow">→</span>
                <img src={tokenOut.image} className="txhistory-token-icon" />
                <span className="txhistory-amount">
                  {formatBalance(tx.amountOut, tokenOut.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenOut.ticker}
                </span>
              </div>
              <div className="txhistory-price">
                <span className="txhistory-price-label">{t('at')}</span>
                <span className="txhistory-price-value">{tx.price}</span>
              </div>
            </div>
          </div>
          <a className="txhistory-view-transaction" href={tx.explorerLink} target="_blank" rel="noopener noreferrer">
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (tx.currentAction === 'send') {
      return (
        <div className="txhistory-inner">
          <div className="txhistory-main-content">
          <div className="txhistory-title">{t('sendComplete')}
            <div className="txhistory-item-time">{formatTimeAgo(tx.timestamp)}</div>
          </div>
            <div className="txhistory-token-details">
              <img src={tokenIn.image} className="txhistory-token-icon" />
              <div className="txhistory-token-group">
                <span className="txhistory-amount">
                  {formatBalance(tx.amountIn, tokenIn.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenIn.ticker}
                </span>
                <span className="txhistory-arrow">→</span>
                <div className="txhistory-recipient">
                  {tx.address ? `${tx.address.slice(0, 6)}...${tx.address.slice(-4)}` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
          <a className="txhistory-view-transaction" href={tx.explorerLink} target="_blank" rel="noopener noreferrer">
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (tx.currentAction === 'cancel') {
      return (
        <div className="txhistory-inner">
          <div className="txhistory-main-content">
          <div className="txhistory-title">{t('limitCancelled')}
            <div className="txhistory-item-time">{formatTimeAgo(tx.timestamp)}</div>
          </div>
            <div className="txhistory-swap-details">
              <div className="txhistory-token-group">
                <img src={tokenIn.image} className="txhistory-token-icon" />
                <span className="txhistory-amount">
                  {formatBalance(tx.amountIn, tokenIn.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenIn.ticker}
                </span>
                <span className="txhistory-arrow">→</span>
                <img src={tokenOut.image} className="txhistory-token-icon" />
                <span className="txhistory-amount">
                  {formatBalance(tx.amountOut, tokenOut.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenOut.ticker}
                </span>
              </div>
              <div className="txhistory-price">
                <span className="txhistory-price-label">{t('at')}</span>
                <span className="txhistory-price-value">{tx.price}</span>
              </div>
            </div>
          </div>
          <a className="txhistory-view-transaction" href={tx.explorerLink} target="_blank" rel="noopener noreferrer">
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (tx.currentAction === 'fill') {
      return (
        <div className="txhistory-inner">
          <div className="txhistory-main-content">
          <div className="txhistory-title">{t('fillComplete')}
            <div className="txhistory-item-time">{formatTimeAgo(tx.timestamp)}</div>
          </div>
            <div className="txhistory-swap-details">
              <div className="txhistory-token-group">
                <img src={tokenIn.image} className="txhistory-token-icon" />
                <span className="txhistory-amount">
                  {formatBalance(tx.amountIn, tokenIn.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenIn.ticker}
                </span>
                <span className="txhistory-arrow">→</span>
                <img src={tokenOut.image} className="txhistory-token-icon" />
                <span className="txhistory-amount">
                  {formatBalance(tx.amountOut, tokenOut.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenOut.ticker}
                </span>
              </div>
              <div className="txhistory-price">
                <span className="txhistory-price-label">{t('filledAt')}</span>
                <span className="txhistory-price-value">{tx.price}</span>
              </div>
            </div>
          </div>
          <a className="txhistory-view-transaction" href={tx.explorerLink} target="_blank" rel="noopener noreferrer">
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (tx.currentAction === 'wrap') {
      return (
        <div className="txhistory-inner">
          <div className="txhistory-main-content">
            <div className="txhistory-title">{t('wrapComplete')}
              <div className="txhistory-item-time">{formatTimeAgo(tx.timestamp)}</div>
            </div>
            <div className="txhistory-swap-details">
              <div className="txhistory-token-group">
                <img src={tokenIn.image} className="txhistory-token-icon" />
                <span className="txhistory-amount">
                  {formatBalance(tx.amountIn, tokenIn.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenIn.ticker}
                </span>
                <span className="txhistory-arrow">→</span>
                <img src={tokenOut.image} className="txhistory-token-icon" />
                <span className="txhistory-amount">
                  {formatBalance(tx.amountOut, tokenOut.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenOut.ticker}
                </span>
              </div>
            </div>
          </div>
          <a className="txhistory-view-transaction" href={tx.explorerLink} target="_blank" rel="noopener noreferrer">
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (tx.currentAction === 'stake') {
      return (
        <div className="txhistory-inner">
          <div className="txhistory-main-content">
            <div className="txhistory-title">{t('stakeComplete')}
              <div className="txhistory-item-time">{formatTimeAgo(tx.timestamp)}</div>
            </div>
            <div className="txhistory-swap-details">
              <div className="txhistory-token-group">
                <img src={tokenIn.image} className="txhistory-token-icon" />
                <span className="txhistory-amount">
                  {formatBalance(tx.amountIn, tokenIn.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenIn.ticker}
                </span>
                <span className="txhistory-arrow">→</span>
                <img src={tokenOut.image} className="txhistory-token-icon" />
                <span className="txhistory-amount">
                  {formatBalance(tx.amountOut, tokenOut.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenOut.ticker}
                </span>
              </div>
            </div>
          </div>
          <a className="txhistory-view-transaction" href={tx.explorerLink} target="_blank" rel="noopener noreferrer">
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (tx.currentAction === 'unwrap') {
      return (
        <div className="txhistory-inner">
          <div className="txhistory-main-content">
            <div className="txhistory-title">{t('unwrapComplete')}  
              <div className="txhistory-item-time">{formatTimeAgo(tx.timestamp)}</div>
            </div>
            <div className="txhistory-swap-details">
              <div className="txhistory-token-group">
                <img src={tokenIn.image} className="txhistory-token-icon" />
                <span className="txhistory-amount">
                  {formatBalance(tx.amountIn, tokenIn.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenIn.ticker}
                </span>
                <span className="txhistory-arrow">→</span>
                <img src={tokenOut.image} className="txhistory-token-icon" />
                <span className="txhistory-amount">
                  {formatBalance(tx.amountOut, tokenOut.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenOut.ticker}
                </span>
              </div>
            </div>
          </div>
          <a className="txhistory-view-transaction" href={tx.explorerLink} target="_blank" rel="noopener noreferrer">
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    if (tx.currentAction === 'approve') {
      return (
        <div className="txhistory-inner">
          <div className="txhistory-main-content">
            <div className="txhistory-title">{t('approveComplete')}
              <div className="txhistory-item-time">{formatTimeAgo(tx.timestamp)}</div>
            </div>
            <div className="txhistory-token-details">
              <img src={tokenIn.image} className="txhistory-token-icon" />
              <div className="txhistory-token-group">
                <span className="txhistory-amount">
                  {formatBalance(tx.amountIn, tokenIn.ticker === 'USDC' ? 'usd' : 'token') + ' ' + tokenIn.ticker}
                </span>
                <span className="txhistory-arrow">→</span>
                <div className="txhistory-recipient">
                  {tx.address ? `${tx.address.slice(0, 6)}...${tx.address.slice(-4)}` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
          <a className="txhistory-view-transaction" href={tx.explorerLink} target="_blank" rel="noopener noreferrer">
            {t('viewOnExplorer')}
          </a>
        </div>
      );
    }

    // Failed transaction popups
    if (tx.currentAction === 'sendFailed') {
      return (
        <div className="txhistory-inner-failed">
          <div className="txhistory-error-wrapper">
            {renderErrorX()}
            <div className="txhistory-failed-content">
              <div className="txhistory-title-failed">{t('sendFailed')}
                <div className="txhistory-item-time">{formatTimeAgo(tx.timestamp)}</div>
              </div>
              <a className="txhistory-view-transaction" href={tx.explorerLink} target="_blank" rel="noopener noreferrer">
                {t('viewOnExplorer')}
              </a>
            </div>
          </div>
        </div>
      );
    }   
    
    if (tx.currentAction === 'swapFailed') {
      return (
        <div className="txhistory-inner-failed">
          <div className="txhistory-error-wrapper">
            {renderErrorX()}
            <div className="txhistory-failed-content">
              <div className="txhistory-title-failed">{t('swapFailed')}
                <div className="txhistory-item-time">{formatTimeAgo(tx.timestamp)}</div>
              </div>
              <a className="txhistory-view-transaction" href={tx.explorerLink} target="_blank" rel="noopener noreferrer">
                {t('viewOnExplorer')}
              </a>
            </div>
          </div>
        </div>
      );
    }   
    
    if (tx.currentAction === 'limitFailed') {
      return (
        <div className="txhistory-inner-failed">
          <div className="txhistory-error-wrapper">
            {renderErrorX()}
            <div className="txhistory-failed-content">
              <div className="txhistory-title-failed">{t('limitFailed')}
                <div className="txhistory-item-time">{formatTimeAgo(tx.timestamp)}</div>
              </div>
              <a className="txhistory-view-transaction" href={tx.explorerLink} target="_blank" rel="noopener noreferrer">
                {t('viewOnExplorer')}
              </a>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderTxDetailView = (tx: TxType) => {
    if (!tx) return null;
    
    const tokenIn = tokendict[tx.tokenIn];
    const tokenOut = tx.tokenOut ? tokendict[tx.tokenOut] : null;
    
    let actionTitle = '';
    switch (tx.currentAction) {
      case 'swap': actionTitle = t('swapDetails'); break;
      case 'limit': actionTitle = t('limitOrderDetails'); break;
      case 'send': actionTitle = t('sendDetails'); break;
      case 'cancel': actionTitle = t('cancelDetails'); break;
      case 'fill': actionTitle = t('fillDetails'); break;
      case 'wrap': actionTitle = t('wrapDetails'); break;
      case 'unwrap': actionTitle = t('unwrapDetails'); break;
      case 'approve': actionTitle = t('approveDetails'); break;
      case 'swapFailed': actionTitle = t('swapFailedDetails'); break;
      case 'sendFailed': actionTitle = t('sendFailedDetails'); break;
      case 'limitFailed': actionTitle = t('limitFailedDetails'); break;
      default: actionTitle = t('transactionDetails');
    }

    const isFailed = tx.currentAction.includes('Failed');

    return (
      <div className="tx-detail-view">
        <div className="tx-detail-header">
          <div className="tx-detail-back" onClick={() => {
            setShowDetailView(false);
            setSelectedTx(null);
          }}>
            <img src={backarrow} className="back-arrow"/>
            <span className="tx-detail-back-text">{t('back')}</span>
          </div>
          <div className={`tx-detail-title ${isFailed ? 'txdetail-title-failed' : ''}`}>
            {actionTitle}
          </div>
        </div>
        
        <div className="tx-detail-content">
          <div className="tx-detail-section">
            <div className="tx-detail-section-title">{t('generalInfo')}</div>
            <div className="tx-detail-row">
              <div className="tx-detail-label">{t('txType')}</div>
              <div className="tx-detail-value">
                {isFailed ? 
                  <span className="txdetail-status-failed">
                    {tx.currentAction.charAt(0).toUpperCase() + tx.currentAction.slice(1).replace('Failed', '')} ({t('failed')})
                  </span> : 
                  tx.currentAction.charAt(0).toUpperCase() + tx.currentAction.slice(1)
                }
              </div>
            </div>
            <div className="tx-detail-row">
              <div className="tx-detail-label">{t('txTime')}</div>
              <div className="tx-detail-value">{formatFullDate(tx.timestamp)}</div>
            </div>
            {isFailed && (
              <div className="tx-detail-row">
                <div className="tx-detail-label">{t('status')}</div>
                <div className="tx-detail-value txdetail-status-failed">{t('failed')}</div>
              </div>
            )}
          </div>
          
{(!isFailed && (tx.currentAction === 'swap' || tx.currentAction === 'limit' || 
  tx.currentAction === 'fill' || tx.currentAction === 'wrap' || 
  tx.currentAction === 'unwrap')) && (
  <div className="tx-detail-section">
    <div className="tx-detail-section-title">{t('tokenInfo')}</div>
    
    <div className="tx-detail-row">
      <div className="tx-detail-label">{t('fromToken')}</div>
      <div className="tx-detail-value tx-detail-token">
        <img src={tokenIn.image} className="tx-detail-token-icon-small" />
        <span>{formatBalance(tx.amountIn, tokenIn.ticker === 'USDC' ? 'usd' : 'token')} {tokenIn.ticker}</span>
      </div>
    </div>
    
    <div className="tx-detail-row">
      <div className="tx-detail-label">{t('toToken')}</div>
      <div className="tx-detail-value tx-detail-token">
        <img src={tokenOut.image} className="tx-detail-token-icon-small" />
        <span>{formatBalance(tx.amountOut, tokenOut.ticker === 'USDC' ? 'usd' : 'token')} {tokenOut.ticker}</span>
      </div>
    </div>
    
    {(tx.currentAction === 'limit' || tx.currentAction === 'fill') && tx.price && (
      <div className="tx-detail-row">
        <div className="tx-detail-label">{t('price')}</div>
        <div className="tx-detail-value">{tx.price}</div>
      </div>
    )}
    
    {tx.slippage && (
      <div className="tx-detail-row">
        <div className="tx-detail-label">{t('slippage')}</div>
        <div className="tx-detail-value">{tx.slippage}%</div>
      </div>
    )}
  </div>
)}

{(isFailed && (tx.currentAction === 'swapFailed' || tx.currentAction === 'limitFailed')) && (
  <div className="tx-detail-section txdetail-failed-section">
    <div className="tx-detail-section-title">{t('attemptedSwap')}</div>
    
    {tokenIn && (
      <div className="tx-detail-row">
        <div className="tx-detail-label">{t('fromToken')}</div>
        <div className="tx-detail-value tx-detail-token">
          <img src={tokenIn.image} className="tx-detail-token-icon-small" />
          <span>{formatBalance(tx.amountIn, tokenIn.ticker === 'USDC' ? 'usd' : 'token')} {tokenIn.ticker}</span>
        </div>
      </div>
    )}
    
    {tokenOut && (
      <div className="tx-detail-row">
        <div className="tx-detail-label">{t('toToken')}</div>
        <div className="tx-detail-value tx-detail-token">
          <img src={tokenOut.image} className="tx-detail-token-icon-small" />
          <span>{formatBalance(tx.amountOut, tokenOut.ticker === 'USDC' ? 'usd' : 'token')} {tokenOut.ticker}</span>
        </div>
      </div>
    )}
    
    {tx.price && (
      <div className="tx-detail-row">
        <div className="tx-detail-label">{t('price')}</div>
        <div className="tx-detail-value">{tx.price}</div>
      </div>
    )}
  </div>
)}

          {(!isFailed && (tx.currentAction === 'send' || tx.currentAction === 'approve') && tx.address) && (
            <div className="tx-detail-section">
              <div className="tx-detail-section-title">
                {tx.currentAction === 'send' ? t('recipientInfo') : t('contractInfo')}
              </div>
              <div className="tx-detail-address-row">
                <div className="tx-detail-label">{t('address')}</div>
                <div className="tx-detail-send-value tx-detail-hash">
                  {tx.address}
                </div>
              </div>
              <div className="tx-detail-row">
                <div className="tx-detail-label">{t('token')}</div>
                <div className="tx-detail-value">{tokenIn.name} ({tokenIn.ticker})</div>
              </div>
              <div className="tx-detail-row">
                <div className="tx-detail-label">{t('amount')}</div>
                <div className="tx-detail-value">
                  {formatBalance(tx.amountIn, tokenIn.ticker === 'USDC' ? 'usd' : 'token')} {tokenIn.ticker}
                </div>
              </div>
            </div>
          )}

          {(isFailed && tx.currentAction === 'sendFailed' && tx.address) && (
            <div className="tx-detail-section txdetail-failed-section">
              <div className="tx-detail-section-title">{t('attemptedSend')}</div>
              {tx.address && (
                <div className="tx-detail-address-row">
                  <div className="tx-detail-label">{t('address')}</div>
                  <div className="tx-detail-send-value tx-detail-hash">
                    {tx.address}
                  </div>
                </div>
              )}
              {tokenIn && (
                <>
                  <div className="tx-detail-row">
                    <div className="tx-detail-label">{t('token')}</div>
                    <div className="tx-detail-value">{tokenIn.name} ({tokenIn.ticker})</div>
                  </div>
                  <div className="tx-detail-row">
                    <div className="tx-detail-label">{t('amount')}</div>
                    <div className="tx-detail-value">
                      {formatBalance(tx.amountIn, tokenIn.ticker === 'USDC' ? 'usd' : 'token')} {tokenIn.ticker}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tx.errorMessage && (
            <div className="tx-detail-section txdetail-error-section">
              <div className="tx-detail-section-title">{t('errorInfo')}</div>
              <div className="tx-detail-row">
                <div className="txdetail-error-message">{tx.errorMessage}</div>
              </div>
            </div>
          )}

          <a 
            className="txhistory-view-transaction tx-detail-explorer-link" 
            href={tx.explorerLink} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {t('viewOnExplorer')}
          </a>
        </div>
      </div>
    );
  };

  if (!isOpen && !closing) return null;

  return (
    <>
      <div className={`tx-history-overlay ${isOpen && !closing ? 'open' : closing ? 'closing' : ''}`} onClick={handleClose}></div>
      <div className={`tx-history-menu ${isOpen && !closing ? 'open' : closing ? 'closing' : ''}`}>
        <div className="tx-history-bg">
          {!showDetailView ? (
            <>
              <div className="tx-history-header">
                <div className="tx-history-menu-title">{t('transactionHistory')}</div>
                <button className="tx-history-close-button" onClick={handleClose}>
                  <img src={closebutton} className="tx-history-close-button-icon" />
                </button>
              </div>
              <div className="tx-history-content">
                {sortedTransactions[0].length === 0 ? (
                  <div className="tx-history-empty-state">
                    <div className="tx-history-empty-text">{t('noTransactionsYet')}</div>
                  </div>
                ) : (
                  sortedTransactions[0].map((tx: any) => (
                    <div 
                      key={tx.identifier} 
                      className="tx-history-item" 
                      onClick={() => handleTxClick(tx)}
                    >
                      {renderTransactionDetails(tx)}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            selectedTx && renderTxDetailView(selectedTx)
          )}
        </div>
      </div>
    </>
  );
};

export default TransactionHistoryMenu;