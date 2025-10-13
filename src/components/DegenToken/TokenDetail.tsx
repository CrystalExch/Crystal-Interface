import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { encodeFunctionData } from 'viem';

import { settings } from '../../settings';
import { showLoadingPopup, updatePopup } from '../MemeTransactionPopup/MemeTransactionPopupManager';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi';
import { useSharedContext } from '../../contexts/SharedContext';
import { formatSubscript } from '../../utils/numberDisplayFormat';

import MemeChart from '../MemeInterface/MemeChart/MemeChart';
import defaultPfp from '../../assets/leaderboard_default.png';
import { useWalletPopup } from '../MemeTransactionPopup/useWalletPopup';

import './TokenDetail.css';

interface Comment {
  id: string;
  user: string;
  message: string;
  userAddress: string;
  timestamp: number;
  likes: string[];
  profilePic?: string;
}

type SendUserOperation = (args: { uo: { target: `0x${string}`; data: `0x${string}`; value?: bigint } }) => Promise<unknown>;

interface TokenDetailProps {
  sendUserOperationAsync: SendUserOperation;
  account: { connected: boolean; address: string; chainId: number };
  setChain: () => void;
  setpopup?: (popup: number) => void;
  terminalQueryData: any;
  terminalRefetch: any;
  walletTokenBalances: any;
  tokenData: any;
  monUsdPrice: any;
  token: any;
  selectedInterval: any;
  setSelectedInterval: any;
  holders: any;
  chartData: any;
  setChartData: any;
  trades: any;
  realtimeCallbackRef: any;
}

const TOTAL_SUPPLY = 1e9;
const RESOLUTION_SECS: Record<string, number> = {
  '1s': 1,
  '5s': 5,
  '15s': 15,
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
};

const formatPrice = (p: number) => {
  if (p >= 1e12) return `$${(p / 1e12).toFixed(2)}T`;
  if (p >= 1e9) return `$${(p / 1e9).toFixed(2)}B`;
  if (p >= 1e6) return `$${(p / 1e6).toFixed(2)}M`;
  if (p >= 1e3) return `$${(p / 1e3).toFixed(2)}K`;
  return `$${p.toFixed(2)}`;
};

const formatNumber = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(2);
};

const formatTradeAmount = (amount: number): string => {
  if (amount === 0) return '';
  return amount.toFixed(6).replace(/\.?0+$/, '');
};

const CopyableAddress: React.FC<{
  address?: string | null;
  className?: string;
  truncate?: { start: number; end: number };
  labelPrefix?: string;
}> = ({ address, className, truncate = { start: 6, end: 4 }, labelPrefix }) => {

  const [copied, setCopied] = useState(false);
  const [copyTooltipVisible, setCopyTooltipVisible] = useState(false);
  const [showHoverTooltip, setShowHoverTooltip] = useState(false);

  if (!address) return <span className={className}>{labelPrefix ?? ''}Unknown</span>;

  const short = `${address.slice(0, truncate.start)}...${address.slice(-truncate.end)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = address;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } finally {
      setCopied(true);
      setCopyTooltipVisible(true);
      setShowHoverTooltip(false);
      setTimeout(() => {
        setCopied(false);
        setCopyTooltipVisible(false);
      }, 1200);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={copy}
        onMouseEnter={() => !copyTooltipVisible && setShowHoverTooltip(true)}
        onMouseLeave={() => setShowHoverTooltip(false)}
        className={className ? `${className} copyable-address` : 'copyable-address'}
        aria-label="Copy address to clipboard"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
        </svg>
        {labelPrefix}
        {short}
      </button>

      {copyTooltipVisible && (
        <div className="wallet-popup-copy-tooltip">
          Copied!
        </div>
      )}
      {!copyTooltipVisible && showHoverTooltip && (
        <div className="wallet-popup-hover-tooltip">
          Click to copy address
        </div>
      )}
    </div>
  );
};

const TokenDetail: React.FC<TokenDetailProps> = ({
  sendUserOperationAsync,
  account,
  setChain,
  setpopup,
  walletTokenBalances,
  tokenData,
  monUsdPrice,
  token,
  selectedInterval,
  setSelectedInterval,
  holders,
  chartData,
  setChartData,
  trades,
  realtimeCallbackRef,
}) => {
  const { tokenAddress } = useParams<{ tokenAddress: string }>();
  const navigate = useNavigate();
  const { activechain } = useSharedContext();

  const walletPopup = useWalletPopup();
  const [tradesSortField, setTradesSortField] = useState<'type' | 'amount' | 'tokenAmount' | 'time' | null>(null);
  const [tradesSortDirection, setTradesSortDirection] = useState<'asc' | 'desc'>('desc');
  const [tradesFilterEnabled, setTradesFilterEnabled] = useState(true);
  const [tradesFilterThreshold, setTradesFilterThreshold] = useState('1');
  const [activeTab, setActiveTab] = useState<'comments' | 'trades'>('comments');
  const explorer = settings.chainConfig[activechain]?.explorer;
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState<boolean>(() => !token);
  const [isSigning, setIsSigning] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'MON' | 'TOKEN'>('MON');
  const ethToken = settings.chainConfig[activechain]?.eth;
  const [priceStats, setPriceStats] = useState({
    ath: 0,
    change5m: 0,
    change1h: 0,
    change6h: 0,
  });
  const routerAddress = settings.chainConfig[activechain]?.launchpadRouter as `0x${string}` | undefined;

  const currentPrice = token?.price || token?.price || 0;
  const GRADUATION_THRESHOLD = 10000;

  if (Array.isArray(holders)) {
    holders.forEach((h: any) => {
      const tnRaw = h?.tokenNet ?? 0;
      const tn = typeof tnRaw === 'bigint' ? Number(tnRaw) : Number(tnRaw);
      h.percentage = tn / 1e9;
    });
  }

  const getCurrentMONBalance = useCallback(() => {
    if (!account?.address) return 0;
    const balances = walletTokenBalances[account.address];
    if (!balances) return 0;
    if (ethToken && balances[ethToken]) {
      return Number(balances[ethToken]) / 1e18;
    }
    return 0;
  }, [account?.address, walletTokenBalances, activechain]);

  const walletTokenBalance = useMemo(() => {
    const raw = walletTokenBalances?.[account?.address]?.[token?.id ?? ''];
    return (Number(raw) || 0) / 1e18;
  }, [walletTokenBalances, account?.address, token?.id]);

  const walletMonBalance = useMemo(() => {
    return getCurrentMONBalance();
  }, [getCurrentMONBalance]);

  const handleLikeComment = (commentId: string) => {
    if (!account.connected) {
      walletPopup.showConnectionError();
      return;
    }

    setComments((prev) =>
      prev.map(comment => {
        if (comment.id === commentId) {
          const hasLiked = comment.likes.includes(account.address);
          return {
            ...comment,
            likes: hasLiked
              ? comment.likes.filter(addr => addr !== account.address)
              : [...comment.likes, account.address]
          };
        }
        return comment;
      })
    );
  };

  const handleTradesSort = (field: 'type' | 'amount' | 'tokenAmount' | 'time') => {
    if (tradesSortField === field) {
      setTradesSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setTradesSortField(field);
      setTradesSortDirection('desc');
    }
  };

  const handleAddComment = () => {
    if (!account.connected) {
      walletPopup.showConnectionError();
      return;
    }

    const msg = newComment.trim();
    if (!msg) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user: account.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Anonymous',
      userAddress: account.address || '',
      message: msg,
      timestamp: Date.now(),
      likes: [],
      profilePic: undefined
    };

    setComments((prev) => [comment, ...prev]);
    setNewComment('');
  };

  const getDefaultProfilePic = (address: string) => {
    return defaultPfp;
  };

  const handleDeleteComment = (commentId: string) => {
    setComments((prev) => prev.filter(comment => comment.id !== commentId));
  };

  const handleCurrencySwitch = () => {
    setSelectedCurrency(prev => prev === 'MON' ? 'TOKEN' : 'MON');
    setTradeAmount('');
  };

  const currentCurrency = (tradeType === 'sell') ? (token?.symbol || 'TOKEN') :
    (selectedCurrency === 'MON' ? 'MON' : token?.symbol || 'TOKEN');
  const currentBalance = (tradeType === 'sell') ? walletTokenBalance :
    (selectedCurrency === 'MON' ? walletMonBalance : walletTokenBalance);

  const handleMaxClick = () => {
    if (tradeType === 'sell') {
      setTradeAmount(formatTradeAmount(walletTokenBalance));
    } else if (selectedCurrency === 'MON') {
      const monBalance = getCurrentMONBalance();
      setTradeAmount(formatTradeAmount(monBalance));
    } else {
      setTradeAmount(formatTradeAmount(walletTokenBalance));
    }
  };

  const handlePercentageClick = (percentage: number) => {
    if (tradeType === 'sell') {
      const amount = (walletTokenBalance * percentage) / 100;
      setTradeAmount(formatTradeAmount(amount));
    } else if (selectedCurrency === 'MON') {
      const amount = (walletMonBalance * percentage) / 100;
      setTradeAmount(formatTradeAmount(amount));
    } else {
      const amount = (walletTokenBalance * percentage) / 100;
      setTradeAmount(formatTradeAmount(amount));
    }
  };

  const handleTrade = async () => {
    if (!tradeAmount || !account.connected || !token || !sendUserOperationAsync || !routerAddress) {
      setpopup?.(4);
      return;
    }

    const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) {
      setChain();
      return;
    }

    const parsedAmount = parseFloat(tradeAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    const txId = `detail-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    try {
      setIsSigning(true);

      if (tradeType === 'buy') {
        showLoadingPopup(txId, {
          title: 'Sending transaction...',
          subtitle: `Buying ${tradeAmount} ${currentCurrency} worth of ${token.symbol}`,
          amount: tradeAmount,
          amountUnit: currentCurrency,
        });
        let uo;
        let value;
        if (currentCurrency == 'MON') {
          value = BigInt(Math.round(parsedAmount * 1e18));

          uo = {
            target: routerAddress as `0x${string}`,
            data: encodeFunctionData({
              abi: CrystalRouterAbi,
              functionName: 'buy',
              args: [true, tokenAddress as `0x${string}`, value, 0n],
            }),
            value,
          };
        }
        else {
          const tokenAmount = BigInt(Math.round(parsedAmount * 1e18));
          value = walletTokenBalances[account.address][ethToken] / 2n
          uo = {
            target: routerAddress as `0x${string}`,
            data: encodeFunctionData({
              abi: CrystalRouterAbi,
              functionName: 'buy',
              args: [false, tokenAddress as `0x${string}`, value, tokenAmount],
            }),
            value,
          };
        }

        updatePopup(txId, {
          title: 'Confirming transaction...',
          subtitle: `Buying ${tradeAmount} ${currentCurrency} worth of ${token.symbol}`,
          variant: 'info',
        });

        await sendUserOperationAsync({ uo });

        updatePopup(txId, {
          title: `Bought ${token.symbol}`,
          subtitle: `Spent ${tradeAmount} ${currentCurrency}`,
          variant: 'success',
          isLoading: false,
        });
      } else {
        showLoadingPopup(txId, {
          title: 'Sending transaction...',
          subtitle: `Selling ${tradeAmount} ${token.symbol}`,
          amount: tradeAmount,
          amountUnit: token.symbol,
        });

        const amountTokenWei = BigInt(Math.round(parsedAmount * 1e18));

        updatePopup(txId, {
          title: 'Confirming sell...',
          subtitle: `Selling ${tradeAmount} ${token.symbol}`,
          variant: 'info',
        });

        const sellUo = {
          target: routerAddress as `0x${string}`,
          data: encodeFunctionData({
            abi: CrystalRouterAbi,
            functionName: 'sell',
            args: [true, tokenAddress as `0x${string}`, amountTokenWei, 0n],
          }),
          value: 0n,
        };

        await sendUserOperationAsync({ uo: sellUo });

        updatePopup(txId, {
          title: `Sold ${token.symbol}`,
          subtitle: 'Received MON',
          variant: 'success',
          isLoading: false,
        });
      }

      setTradeAmount('');
    } catch (e: any) {
      console.error(e);
      updatePopup(txId, {
        title: 'Transaction failed',
        subtitle: e?.message || 'Please try again.',
        variant: 'error',
        isLoading: false,
      });
    } finally {
      setIsSigning(false);
    }
  };

  const getButtonText = () => {
    if (!account.connected) return walletPopup.texts.CONNECT_WALLET;
    const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId)
      return `${walletPopup.texts.SWITCH_CHAIN} to ${settings.chainConfig[activechain]?.name || 'Monad'}`;
    return `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`;
  };

  const isTradeDisabled = () => {
    if (!account.connected) return false;
    const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) return false;
    if (isSigning) return true;
    if (!tradeAmount) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="detail-loading-spinner" />
        <span>Loading token...</span>
      </div>
    );
  }

  const getSortedTrades = () => {
    const threshold = parseFloat(tradesFilterThreshold) || 0;
    const filteredTrades = tradesFilterEnabled
      ? trades.filter((trade: any) => trade.nativeAmount >= threshold)
      : trades;

    if (!tradesSortField) return filteredTrades;

    return [...filteredTrades].sort((a, b) => {
      let comparison = 0;

      switch (tradesSortField) {
        case 'type':
          comparison = a.isBuy === b.isBuy ? 0 : a.isBuy ? -1 : 1;
          break;
        case 'amount':
          comparison = a.nativeAmount - b.nativeAmount;
          break;
        case 'tokenAmount':
          comparison = a.tokenAmount - b.tokenAmount;
          break;
        case 'time':
          comparison = a.timestamp - b.timestamp;
          break;
        default:
          return 0;
      }

      return tradesSortDirection === 'desc' ? -comparison : comparison;
    });
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now() / 1000;
    const secondsAgo = Math.max(0, now - timestamp);

    if (secondsAgo < 60) {
      return `${Math.floor(secondsAgo)}s ago`;
    } else if (secondsAgo < 3600) {
      return `${Math.floor(secondsAgo / 60)}m ago`;
    } else if (secondsAgo < 86400) {
      return `${Math.floor(secondsAgo / 3600)}h ago`;
    } else {
      return `${Math.floor(secondsAgo / 86400)}d ago`;
    }
  };

  if (!token) {
    return (
      <div className="detail-error">
        <h2>Token not found</h2>
        <button onClick={() => navigate('/board')} className="detail-back-button">
          Back to Board
        </button>
      </div>
    );
  }

  const bondingProgress = Math.min((token.marketCap / 10000) * 100, 100);

  return (
    <div className="detail-container">
      <div className="detail-main">
        <div onClick={() => navigate('/board')} className="detail-back-button">
          ← Back
        </div>

        <div className="detail-header">
          <div className="detail-token-header">
            <img src={token.image} className="detail-token-image" />
            <div className="detail-token-info">
              <h1 className="detail-token-name">{token.name}</h1>
              <div className="detail-token-symbol">{token.symbol}</div>
              <div className="detail-token-meta">
                <CopyableAddress address={token.creator?.id ?? null} className="detail-meta-address" labelPrefix="Created by " />
                <span>•</span>
                <span>{Math.floor((Date.now() / 1000 - token.created) / 3600)}h ago</span>
                <span>•</span>
                {token.status === 'graduated' ? <span>Coin has graduated!</span> : <span>{bondingProgress.toFixed(1)}% bonded</span>}
              </div>
            </div>
          </div>

          <div className="detail-quick-stats">
            <div className="detail-stat">
              <div className="detail-stat-label">Market Cap</div>
              <div className="detail-stat-value">{formatPrice(token.marketCap * monUsdPrice)}</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-label">ATH</div>
              <div className="detail-stat-value">{formatPrice((priceStats.ath * TOTAL_SUPPLY) * monUsdPrice)}</div>
            </div>
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-chart-section">
            <MemeChart
              token={token}
              data={chartData}
              selectedInterval={selectedInterval}
              setSelectedInterval={setSelectedInterval}
              realtimeCallbackRef={realtimeCallbackRef}
              monUsdPrice={monUsdPrice}
              tradehistory={trades}
              address={account.address}
              devAddress={token.creator}
              trackedAddresses={[account.address]}
            />
          </div>

          <div className="detail-stats-bar">
            <div className="detail-stat-item">
              <div className="detail-stat-label">Vol 24h</div>
              <div className={`detail-stat-value ${((token?.volume24h || 0) === 0) ? 'detail-stat-neutral' : ''}`}>
                ${formatNumber((token?.volume24h || 0) * monUsdPrice)}
              </div>
            </div>
            <div className="detail-stat-item">
              <div className="detail-stat-label">Price</div>
              <div className={`detail-stat-value ${(currentPrice === 0) ? 'detail-stat-neutral' : ''}`}>
                {formatSubscript((currentPrice * monUsdPrice).toFixed(10).toString())}
              </div>
            </div>
            <div className="detail-stat-item">
              <div className="detail-stat-label">5m</div>
              <div className={`detail-stat-value ${priceStats.change5m > 0 ? 'detail-stat-positive' : priceStats.change5m < 0 ? 'detail-stat-negative' : 'detail-stat-neutral'}`}>
                {priceStats.change5m > 0 ? '+' : ''}{priceStats.change5m.toFixed(2)}%
              </div>
            </div>
            <div className="detail-stat-item">
              <div className="detail-stat-label">1h</div>
              <div className={`detail-stat-value ${priceStats.change1h > 0 ? 'detail-stat-positive' : priceStats.change1h < 0 ? 'detail-stat-negative' : 'detail-stat-neutral'}`}>
                {priceStats.change1h > 0 ? '+' : ''}{priceStats.change1h.toFixed(2)}%
              </div>
            </div>
            <div className="detail-stat-item">
              <div className="detail-stat-label">6h</div>
              <div className={`detail-stat-value ${priceStats.change6h > 0 ? 'detail-stat-positive' : priceStats.change6h < 0 ? 'detail-stat-negative' : 'detail-stat-neutral'}`}>
                {priceStats.change6h > 0 ? '+' : ''}{priceStats.change6h.toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="detail-info-grid">
            <div className="detail-info-section">

              <div className="detail-tabs-header" data-active={activeTab}>
                <button
                  className={`detail-tab ${activeTab === 'comments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('comments')}
                >
                  Comments
                </button>
                <button
                  className={`detail-tab ${activeTab === 'trades' ? 'active' : ''}`}
                  onClick={() => setActiveTab('trades')}
                >
                  Trades
                </button>
              </div>

              {activeTab === 'comments' ? (

                <div className="detail-comments-section">
                  <div className="detail-comment-input">
                    <input
                      type="text"
                      placeholder={account.connected ? "Add a comment..." : "Connect wallet to comment..."}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      className="detail-comment-field"
                      disabled={!account.connected}
                    />
                    <button
                      onClick={handleAddComment}
                      className="detail-comment-submit"
                      disabled={!account.connected || !newComment.trim()}
                    >
                      Post
                    </button>
                  </div>
                  <div className="detail-comments-list">
                    {comments.map((comment) => (
                      <div key={comment.id} className="detail-comment">
                        <div className="detail-comment-container">
                          <div className="detail-comment-avatar">
                            <img
                              src={comment.profilePic || getDefaultProfilePic(comment.userAddress)}
                              alt={`${comment.user} avatar`}
                              className="detail-comment-avatar-img"
                            />
                          </div>

                          <div className="detail-comment-content">
                            <div className="detail-comment-header">
                              <div className="detail-comment-user-info">
                                <span className="detail-comment-user">{comment.user}</span>
                                <span className="detail-comment-time">{Math.floor((Date.now() - comment.timestamp) / 60000)}m ago</span>
                              </div>

                              {account.connected && account.address === comment.userAddress && (
                                <button
                                  className="detail-comment-delete"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  ×
                                </button>
                              )}
                            </div>

                            <div className="detail-comment-message">{comment.message}</div>

                            <div className="detail-comment-actions">
                              <button
                                className={`detail-comment-like ${comment.likes.includes(account.address) ? 'liked' : ''}`}
                                onClick={() => handleLikeComment(comment.id)}
                                disabled={!account.connected}
                              >
                                <span className="detail-comment-like-icon">♥</span>
                                <span className="detail-comment-like-count">{comment.likes.length}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && <div className="detail-no-comments">No comments yet. Be the first!</div>}
                  </div>
                </div>
              ) : (
                <div className="detail-trades-section">
                  <div className="detail-trades-header-controls">
                    <div className="detail-trades-filter-controls">
                      <span className="detail-trades-filter-label">filter by size</span>
                      <div className="detail-trades-filter-toggle">
                        <input type="checkbox" id="trades-filter" checked={tradesFilterEnabled} onChange={() => setTradesFilterEnabled(!tradesFilterEnabled)} />
                        <label htmlFor="trades-filter"></label>
                      </div>
                      <input
                        type="decimal"
                        className="detail-trades-filter-value"
                        value={tradesFilterThreshold}
                        onChange={(e) => setTradesFilterThreshold(e.target.value)}
                        disabled={!tradesFilterEnabled}
                        step="0.01"
                        min="0"
                      />
                      <span className="detail-trades-filter-desc">(showing trades greater than {tradesFilterThreshold} MON)</span>
                    </div>

                    <div className="detail-trades-actions">
                      <button className="detail-trades-action-button">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M7 12h10M10 18h4" />
                        </svg>
                      </button>
                      <button className="detail-trades-action-button">
                        Export
                      </button>
                    </div>
                  </div>

                  <div className="detail-trades-table">
                    <div className="detail-trades-table-header">
                      <div className="detail-trades-header-cell">Account</div>
                      <div
                        className={`detail-trades-header-cell sortable ${tradesSortField === 'type' ? 'active' : ''}`}
                        onClick={() => handleTradesSort('type')}
                      >
                        Type
                        {tradesSortField === 'type' && (
                          <span className={`detail-trades-sort-arrow ${tradesSortDirection}`}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 7L2 3H8L5 7Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div
                        className={`detail-trades-header-cell sortable ${tradesSortField === 'amount' ? 'active' : ''}`}
                        onClick={() => handleTradesSort('amount')}
                      >
                        Amount (MON)
                        {tradesSortField === 'amount' && (
                          <span className={`detail-trades-sort-arrow ${tradesSortDirection}`}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 7L2 3H8L5 7Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div
                        className={`detail-trades-header-cell sortable ${tradesSortField === 'tokenAmount' ? 'active' : ''}`}
                        onClick={() => handleTradesSort('tokenAmount')}
                      >
                        Amount ({token.symbol})
                        {tradesSortField === 'tokenAmount' && (
                          <span className={`detail-trades-sort-arrow ${tradesSortDirection}`}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 7L2 3H8L5 7Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div
                        className={`detail-trades-header-cell sortable ${tradesSortField === 'time' ? 'active' : ''}`}
                        onClick={() => handleTradesSort('time')}
                      >
                        Time
                        {tradesSortField === 'time' && (
                          <span className={`detail-trades-sort-arrow ${tradesSortDirection}`}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 7L2 3H8L5 7Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="detail-trades-header-cell">Txn</div>
                    </div>

                    <div className="detail-trades-body">
                      {getSortedTrades().map((trade: any) => (
                        <div key={trade.id} className="detail-trades-row">
                          <div className="detail-trades-col detail-trades-account">
                            <div className="detail-trades-avatar">
                              <img src={defaultPfp} alt="Avatar" />
                            </div>
                            <span className="detail-trades-address">
                              {trade.caller === token?.creator ? (
                                <>
                                  {trade.caller.slice(0, 6)}...{trade.caller.slice(-4)}
                                  <span className="detail-trades-dev-tag">(dev)</span>
                                </>
                              ) : (
                                `${trade.caller.slice(0, 6)}...${trade.caller.slice(-4)}`
                              )}
                            </span>
                          </div>
                          <div className={`detail-trades-col detail-trades-type ${trade.isBuy ? 'buy' : 'sell'}`}>
                            {trade.isBuy ? 'Buy' : 'Sell'}
                          </div>
                          <div className="detail-trades-col">{trade.nativeAmount.toFixed(3)}</div>
                          <div className={`detail-trades-col ${trade.isBuy ? 'buy' : 'sell'}`}>
                            {formatNumber(trade.tokenAmount)}
                          </div>
                          <div className="detail-trades-col detail-trades-time">
                            {formatTimeAgo(trade.timestamp)}
                          </div>
                          <div className="detail-trades-col detail-trades-txn">
                            <button
                              className="detail-trades-txn-link"
                              onClick={() => window.open(`${explorer}/tx/${trade.id.substring(0, trade.id.indexOf('-'))}`, '_blank')}
                            >
                              {trade.id.slice(0, 6)}...
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <div className="detail-trading-panel-container">
        <div className="detail-trading-panel">
          <div className="detail-trade-header">
            <button className={`detail-trade-tab ${tradeType === 'buy' ? 'active' : ''}`} onClick={() => setTradeType('buy')}>
              Buy
            </button>
            <button className={`detail-trade-tab ${tradeType === 'sell' ? 'active' : ''}`} onClick={() => setTradeType('sell')}>
              Sell
            </button>
          </div>

          <div className="detail-trade-form">
            <div className="detail-trade-input-group">
              <div className="detail-balance-info">
                {tradeType === 'buy' && (
                  <button
                    className="detail-currency-switch-button"
                    onClick={handleCurrencySwitch}
                  >
                    Switch to {(selectedCurrency === 'MON' ? token?.symbol || 'TOKEN' : 'MON')}
                  </button>
                )}
                <span>
                  Balance: {formatNumber(currentBalance)} {currentCurrency}
                </span>
              </div>
              <div className="detail-trade-input-wrapper">
                <input
                  type="decimal"
                  placeholder="0.00"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  className="detail-trade-input"
                />
                <span className="detail-trade-unit">{currentCurrency}</span>
              </div>

              {tradeType === 'buy' && selectedCurrency === 'MON' ? (
                <div className="detail-preset-buttons">
                  <div className="detail-preset-buttons-right">
                    <button
                      className="detail-preset-button-left"
                      onClick={() => {/**/ }}
                    >
                      Slippage (%)
                    </button>
                    {['1', '10', '100'].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setTradeAmount(amount)}
                        className="detail-preset-button"
                      >
                        {amount} MON
                      </button>
                    ))}
                    <button onClick={handleMaxClick} className="detail-preset-button">
                      Max
                    </button>
                  </div>
                </div>
              ) : (
                <div className="detail-preset-buttons">
                  <div className="detail-preset-buttons-right">
                    <button
                      className="detail-preset-button-left"
                      onClick={() => {/* your custom action */ }}
                    >
                      Slippage (%)
                    </button>
                    {['25', '50', '75', '100'].map((percentage) => (
                      <button
                        key={percentage}
                        onClick={() => handlePercentageClick(Number(percentage))}
                        className="detail-preset-button"
                      >
                        {percentage}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (!account.connected) {
                  walletPopup.showConnectionError();
                } else {
                  const targetChainId =
                    settings.chainConfig[activechain]?.chainId || activechain;
                  if (account.chainId !== targetChainId) {
                    walletPopup.showChainSwitchRequired(
                      settings.chainConfig[activechain]?.name || 'Monad',
                    );
                    setChain();
                  } else {
                    handleTrade();
                  }
                }
              }}
              className={`detail-trade-button ${tradeType}`}
              disabled={isTradeDisabled()}
            >
              {isSigning ? (
                <div className="detail-button-spinner"></div>
              ) : (
                getButtonText()
              )}
            </button>
          </div>
        </div>

        <div className="detail-trading-panel">
          <div className="detail-trade-stats">
            <div className="detail-stat-row">
              <span>Position</span>
              <span>
                {formatNumber(walletTokenBalance)} {token.symbol}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-trading-panel">
          <div className="detail-bonding-section">
            <h4>Bonding Curve Progress</h4>
            <div className="detail-bonding-bar">
              <div className="detail-bonding-fill" style={{ width: `${bondingProgress}%` }} />
            </div>
            {token.status === 'graduated' ? (
              <div className="detail-bonding-info">
                <span>Coin has graduated!</span>
              </div>
            ) : (
              <div className="detail-bonding-info">
                <span>{formatNumber(token.marketCap)} MON in curve</span>
                <span>{formatNumber(GRADUATION_THRESHOLD - token.marketCap)} MON to graduate</span>
              </div>
            )}
          </div>
        </div>

        <div className="detail-trading-panel">
          <div className="detail-address-top">
            <div className="detail-meme-address-content">
              <svg
                className="detail-contract-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                <path d="M14 2v6h6" />
                <path d="M12 18v-6" />
                <path d="M9 15h6" />
              </svg>
              <span className="detail-meme-address-title">CA:</span>{' '}
              <CopyableAddress
                address={token.id}
                className="detail-meme-address-value"
                truncate={{ start: 15, end: 4 }}
              />
            </div>
            <button
              className="detail-address-link"
              onClick={() => window.open(`${explorer}/token/${token.id}`, '_blank')}
              aria-label="View on explorer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
              </svg>
            </button>
          </div>
        </div>


        <div className="detail-trading-panel">
          <div>Top Holders</div>
          <div className="detail-holders-grid">
            {holders.length > 0 ? (
              holders.slice(0, 10).map((holder: any, index: any) => (
                <div key={holder.address} className="detail-holder-card">
                  <div className="detail-holder-info">
                    <div className="detail-holder-address-main">
                      {holder.address === 'bonding curve' ? (
                        <span>Liquidity pool</span>
                      ) : (
                        <CopyableAddress
                          address={holder.address}
                          className="detail-holder-address-copy"
                          truncate={{ start: 4, end: 4 }}
                        />
                      )}
                    </div>
                  </div>
                  <span className="detail-holder-percentage-badge">
                    {holder.percentage.toFixed(2)}%
                  </span>
                </div>
              ))
            ) : (
              <div className="detail-no-holders-main">
                <div className="detail-no-holders-icon">👥</div>
                <span>No holder data available</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {isChatModalOpen && (
        <div className="detail-chat-modal-overlay" onClick={() => setIsChatModalOpen(false)}>
          <div className="detail-chat-modal" onClick={(e) => e.stopPropagation()}>
            <button className="detail-chat-modal-close" onClick={() => setIsChatModalOpen(false)}>
              ×
            </button>

            <div className="detail-chat-modal-content">
              <h3>token groupchat now available</h3>
              <p>chat with friends, share coins, and discover alpha all in one place.</p>

              <div className="detail-chat-qr-section">
                <div className="detail-chat-qr-code">
                  <div className="detail-qr-placeholder">
                    <div className="detail-qr-pattern" />
                    <div className="detail-qr-center">📱</div>
                  </div>
                </div>
                <span className="detail-chat-scan-text">scan to download</span>
              </div>

              <button className="detail-chat-learn-more">learn more</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenDetail;