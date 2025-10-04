import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { encodeFunctionData } from 'viem';
import { settings } from '../../settings';
import { showLoadingPopup, updatePopup } from '../MemeTransactionPopup/MemeTransactionPopupManager';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi';
import { useSharedContext } from '../../contexts/SharedContext';
import MemeChart from '../MemeInterface/MemeChart/MemeChart';
import defaultPfp from '../../assets/leaderboard_default.png';
import './TokenDetail.css';
import {
  setGlobalPopupHandlers,
  useWalletPopup,
} from '../MemeTransactionPopup/useWalletPopup';

interface Token {
  id: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  image: string;
  price: number;
  marketCap: number;
  change24h: number;
  volume24h: number;
  holders: number;
  proTraders: number;
  kolTraders: number;
  sniperHolding: number;
  devHolding: number;
  bundleHolding: number;
  insiderHolding: number;
  top10Holding: number;
  buyTransactions: number;
  sellTransactions: number;
  globalFeesPaid: number;
  website: string;
  twitterHandle: string;
  progress: number;
  status: 'new' | 'graduating' | 'graduated';
  description: string;
  created: number;
  bondingAmount: number;
  volumeDelta: number;
  telegramHandle: string;
  discordHandle: string;
  creator?: string;
}

interface Trade {
  id: string;
  timestamp: number;
  isBuy: boolean;
  price: number;
  tokenAmount: number;
  nativeAmount: number;
  caller: string;
}

interface Holder {
  address: string;
  balance: number;
  percentage: number;
}

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
  terminalToken: any;
  setTerminalToken: (x: any) => void;
  terminalRefetch: any;
  walletTokenBalances: any;
  tokenData: any;
  setTokenData: any;
  monUsdPrice: any;
}

// const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/104695/test/v0.4.0';
const SUBGRAPH_URL = 'https://gateway.thegraph.com/api/b9cc5f58f8ad5399b2c4dd27fa52d881/subgraphs/id/BJKD3ViFyTeyamKBzC1wS7a3XMuQijvBehgNaSBb197e';
const TOTAL_SUPPLY = 1e9;

const formatPrice = (p: number) => {
  if (p >= 1e12) return `$${(p / 1e12).toFixed(2)}T`;
  if (p >= 1e9) return `$${(p / 1e9).toFixed(2)}B`;
  if (p >= 1e6) return `$${(p / 1e6).toFixed(2)}M`;
  if (p >= 1e3) return `$${(p / 1e3).toFixed(2)}K`;
  return `$${p.toFixed(6)}`;
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
        title={copied ? 'Copied!' : 'Click to copy full address'}
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
  terminalQueryData,
  terminalToken,
  setTerminalToken,
  terminalRefetch,
  walletTokenBalances,
  tokenData,
  setTokenData,
  monUsdPrice
}) => {
  const { tokenAddress } = useParams<{ tokenAddress: string }>();
  const navigate = useNavigate();
  const { activechain } = useSharedContext();

  const walletPopup = useWalletPopup();
  const [token, setToken] = useState<any>((tokenData || tokenAddress ? {id: tokenAddress} : null) || null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState(!tokenData);
  const [isSigning, setIsSigning] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<any>(() => localStorage.getItem('meme_chart_timeframe') || '1m');
  const [chartData, setChartData] = useState<any>(null);
  const realtimeCallbackRef = useRef<any>({});
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'MON' | 'TOKEN'>('MON');
  const ethToken = settings.chainConfig[activechain]?.eth;
  const routerAddress = settings.chainConfig[activechain]?.launchpadRouter as `0x${string}` | undefined;

  // get mon balance Ws in the chattttt
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

  const fetchTokenData = useCallback(async () => {
    if (!token) return;

    try {
      const seriesKey = 'series' + (
        selectedInterval === '1s' ? '1' :
        selectedInterval === '5s' ? '5' :
        selectedInterval === '15s' ? '15' :
        selectedInterval === '1m' ? '60' :
        selectedInterval === '5m' ? '300' :
        selectedInterval === '15m' ? '900' :
        selectedInterval === '1h' ? '3600' :
        selectedInterval === '4h' ? '14400':
          '86400'
      );

      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `
            query ($id: ID!) {
              launchpadTokens(where: { id: $id }) {
                lastPriceNativePerTokenWad
                volumeNative
                buyTxs
                sellTxs
                name
                symbol
                metadataCID
                creator {
                  id
                }
                timestamp
                trades(first: 50, orderBy: block, orderDirection: desc) {
                  id
                  account { id }
                  block
                  isBuy
                  priceNativePerTokenWad
                  amountIn
                  amountOut
                }
                series: ${seriesKey} {
                  klines(first: 1000, orderBy: time, orderDirection: desc) {
                    time open high low close
                  }
                }
              }
            }`,
          variables: { id: token.id.toLowerCase() },
        }),
      });

      const data = (await response.json())?.data;
      console.log(data)
      const klines = data?.launchpadTokens?.[0]?.series?.klines;
      const positions = data?.launchpadTokens?.[0]?.positions || [];
      
      if (!klines) return;

      if (data.launchpadTokens?.length) {
        const m = data.launchpadTokens[0];

        let imageUrl = token.image || '';
        if (m.metadataCID && !imageUrl) {
          try {
            const metaRes = await fetch(m.metadataCID);
            if (metaRes.ok) {
              const meta = await metaRes.json();
              imageUrl = meta.image || '';
            }
          } catch (e) {
            console.warn('Failed to load metadata for token:', token.id, e);
          }
        }

        const updatedTokenData = {
          ...token,
          name: m.name || token.name || "Unknown Token",
          symbol: m.symbol || token.symbol || "UNKNOWN",
          image: imageUrl,
          creator: m.creator.id || "",
          price: Number(m.lastPriceNativePerTokenWad || 0) / 1e18,
          marketCap: (Number(m.lastPriceNativePerTokenWad || 0) / 1e18) * TOTAL_SUPPLY,
          volume24h: Number(m.volumeNative || 0) / 1e18,
          buyTransactions: Number(m.buyTxs || 0),
          sellTransactions: Number(m.sellTxs || 0),
          created: m.timestamp,
        };

        setTokenData(updatedTokenData);

        const totalSupply = TOTAL_SUPPLY;
        const bondingCurveSupply = totalSupply * 0.8;
        
        let processedHolders: Holder[] = [];
        
        if (positions.length > 0) {
          const totalUserTokens = positions.reduce((sum, pos) => sum + Number(pos.tokens) / 1e18, 0);
          const bondingCurveTokens = Math.max(0, bondingCurveSupply - totalUserTokens);
          
          if (bondingCurveTokens > 0) {
            processedHolders.push({
              address: 'bonding curve',
              balance: bondingCurveTokens,
              percentage: (bondingCurveTokens / totalSupply) * 100
            });
          }
          
          const userHolders = positions
            .map(pos => ({
              address: pos.account.id,
              balance: Number(pos.tokens) / 1e18,
              percentage: (Number(pos.tokens) / 1e18 / totalSupply) * 100
            }))
            .filter(holder => holder.balance > 0);
          
          processedHolders.push(...userHolders);
          
          // Sort by balance descending
          processedHolders.sort((a, b) => b.balance - a.balance);
        } else {
          // Fallback sample data when no positions available
          processedHolders = [
            {
              address: 'bonding curve',
              balance: bondingCurveSupply,
              percentage: 80.0
            },
            {
              address: '0x1234567890123456789012345678901234567890',
              balance: totalSupply * 0.05,
              percentage: 5.0
            },
            {
              address: '0x2345678901234567890123456789012345678901',
              balance: totalSupply * 0.03,
              percentage: 3.0
            },
            {
              address: '0x3456789012345678901234567890123456789012',
              balance: totalSupply * 0.025,
              percentage: 2.5
            },
            {
              address: '0x4567890123456789012345678901234567890123',
              balance: totalSupply * 0.02,
              percentage: 2.0
            },
            {
              address: '0x5678901234567890123456789012345678901234',
              balance: totalSupply * 0.015,
              percentage: 1.5
            },
            {
              address: '0x6789012345678901234567890123456789012345',
              balance: totalSupply * 0.01,
              percentage: 1.0
            },
            {
              address: '0x7890123456789012345678901234567890123456',
              balance: totalSupply * 0.008,
              percentage: 0.8
            },
            {
              address: '0x8901234567890123456789012345678901234567',
              balance: totalSupply * 0.007,
              percentage: 0.7
            },
            {
              address: '0x9012345678901234567890123456789012345678',
              balance: totalSupply * 0.006,
              percentage: 0.6
            },
            {
              address: '0xa123456789012345678901234567890123456789',
              balance: totalSupply * 0.005,
              percentage: 0.5
            }
          ];
        }
        
        setHolders(processedHolders.slice(0, 10));
      }

      const bars = klines
        .slice()
        .reverse()
        .map((c: any) => ({
          time: Number(c.time) * 1000,
          open: Number(c.open) / 1e18,
          high: Number(c.high) / 1e18,
          low: Number(c.low) / 1e18,
          close: Number(c.close) / 1e18,
          volume: Number(c.baseVolume) / 1e18,
        }));

      const resForChart =
        selectedInterval === "1d" ? "1D" :
        selectedInterval === "4h" ? "240" :
        selectedInterval === "1h" ? "60"  :
        selectedInterval.endsWith("s")
          ? selectedInterval.slice(0, -1).toUpperCase() + "S"
          : selectedInterval.slice(0, -1);
      setChartData([bars, resForChart, false]);
    } catch (error) {
      console.error('Failed to fetch token data:', error);
    } finally {
      setLoading(false);
    }
  }, [token, selectedInterval]);

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

  useEffect(() => {
    if (tokenAddress) setTerminalToken(tokenAddress);
  }, [tokenAddress, setTerminalToken]);

  useEffect(() => {
    fetchTokenData();
  }, [fetchTokenData]);

  const handleCurrencySwitch = () => {
    setSelectedCurrency(prev => prev === 'MON' ? 'TOKEN' : 'MON');
    setTradeAmount('');
  };

  const currentCurrency = (tradeType === 'sell') ? (tokenData?.symbol || 'TOKEN') : 
                          (selectedCurrency === 'MON' ? 'MON' : tokenData?.symbol || 'TOKEN');
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
          subtitle: `Buying ${tradeAmount} ${currentCurrency} worth of ${tokenData.symbol}`,
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
          subtitle: `Buying ${tradeAmount} ${currentCurrency} worth of ${tokenData.symbol}`,
          variant: 'info',
        });

        await sendUserOperationAsync({ uo });

        updatePopup(txId, {
          title: `Bought ${tokenData.symbol}`,
          subtitle: `Spent ${tradeAmount} ${currentCurrency}`,
          variant: 'success',
          isLoading: false,
        });
      } else {
        showLoadingPopup(txId, {
          title: 'Sending transaction...',
          subtitle: `Selling ${tradeAmount} ${tokenData.symbol}`,
          amount: tradeAmount,
          amountUnit: tokenData.symbol,
        });

        const amountTokenWei = BigInt(Math.round(parsedAmount * 1e18));

        updatePopup(txId, {
          title: 'Confirming sell...',
          subtitle: `Selling ${tradeAmount} ${tokenData.symbol}`,
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
          title: `Sold ${tokenData.symbol}`,
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
    return `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${tokenData.symbol}`;
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
        <span>Loading tokenData...</span>
      </div>
    );
  }

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

  const bondingProgress = Math.min((tokenData.marketCap / 10000) * 100, 100);

  return (
    <div className="detail-container">
      <div className="detail-main">
        <div onClick={() => navigate('/board')} className="detail-back-button">
          ← Back
        </div>

        <div className="detail-header">
          <div className="detail-token-header">
            <img src={tokenData.image} alt={tokenData.name} className="detail-token-image" />
            <div className="detail-token-info">
              <h1 className="detail-token-name">{tokenData.name}</h1>
              <div className="detail-token-symbol">{tokenData.symbol}</div>
              <div className="detail-token-meta">
                <CopyableAddress address={tokenData.creator ?? null} className="detail-meta-address" labelPrefix="Created by " />
                <span>•</span>
                <span>{Math.floor((Date.now() / 1000 - tokenData.created) / 3600)}h ago</span>
                <span>•</span>
                {tokenData.status === 'graduated' ? <span>Coin has graduated!</span> : <span>{bondingProgress.toFixed(1)}% bonded</span>}
              </div>
            </div>
          </div>

          <div className="detail-quick-stats">
            <div className="detail-stat">
              <div className="detail-stat-label">Market Cap</div>
              <div className="detail-stat-value">{formatPrice(tokenData.marketCap * monUsdPrice)}</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-label">ATH</div>
              <div className="detail-stat-value">$45.1K</div>
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
            />
          </div>

          <div className="detail-info-grid">
            <div className="detail-info-section">
              <h3>Comments</h3>
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
                        {/* Profile Picture */}
                        <div className="detail-comment-avatar">
                          <img 
                            src={comment.profilePic || getDefaultProfilePic(comment.userAddress)} 
                            alt={`${comment.user} avatar`}
                            className="detail-comment-avatar-img"
                          />
                        </div>
                        
                        {/* Comment Content */}
                        <div className="detail-comment-content">
                          <div className="detail-comment-header">
                            <div className="detail-comment-user-info">
                              <span className="detail-comment-user">{comment.user}</span>
                              <span className="detail-comment-time">{Math.floor((Date.now() - comment.timestamp) / 60000)}m ago</span>
                            </div>
                            
                            {/* Delete button - only show for comment owner */}
                            {account.connected && account.address === comment.userAddress && (
                              <button 
                                className="detail-comment-delete"
                                onClick={() => handleDeleteComment(comment.id)}
                                title="Delete comment"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          
                          <div className="detail-comment-message">{comment.message}</div>
                          
                          {/* Like section */}
                          <div className="detail-comment-actions">
                            <button 
                              className={`detail-comment-like ${comment.likes.includes(account.address) ? 'liked' : ''}`}
                              onClick={() => handleLikeComment(comment.id)}
                              disabled={!account.connected}
                              title={account.connected ? (comment.likes.includes(account.address) ? 'Unlike' : 'Like') : 'Connect wallet to like'}
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
                    Switch to {(selectedCurrency === 'MON' ? tokenData?.symbol || 'TOKEN' : 'MON')}
                  </button>
                )}
                <span>
                  Balance: {formatNumber(currentBalance)} {currentCurrency}
                </span>
              </div>
              <div className="detail-trade-input-wrapper">
                <input
                  type="number"
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
                      onClick={() => {/* your custom action */}}
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
                    onClick={() => {/* your custom action */}}
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
                {formatNumber(walletTokenBalance)} {tokenData.symbol}
              </span>
            </div>

            <div className="progress-bar-container">
              <div className="detail-progress-bar">
                <div className="progress-indicator" style={{ left: '50%' }} />
              </div>
            </div>

            <div className="detail-stat-row">
              <span>Profit indicator</span>
              <span className="detail-profit">Profit/Loss</span>
            </div>
          </div>
        </div>

        <div className="detail-trading-panel">
          <div className="detail-bonding-section">
            <h4>Bonding Curve Progress</h4>
            <div className="detail-bonding-bar">
              <div className="detail-bonding-fill" style={{ width: `${bondingProgress}%` }} />
            </div>
            {tokenData.status === 'graduated' ? (
              <div className="detail-bonding-info">
                <span>Coin has graduated!</span>
              </div>
            ) : (
              <div className="detail-bonding-info">
                <span>{formatNumber(bondingProgress * 100)} MON in bonding curve</span>
                <span>${formatNumber(72940)} to graduate</span>
              </div>
            )}
          </div>
        </div>

        <div className="detail-trading-panel">
          <div className="detail-chat-section">
            <div className="detail-chat-header">
              <div className="detail-chat-info">
                <div className="detail-chat-avatar">
                  <img src={tokenData.image} alt={tokenData.symbol} className="detail-chat-avatar-image" />
                </div>
                <div className="detail-chat-text">
                  <h4 className="detail-chat-title">{tokenData.name} chat</h4>
                  <span className="detail-chat-members">1 member</span>
                </div>
              </div>
              <button className="detail-chat-join-button" onClick={() => setIsChatModalOpen(true)}>
                <span className="detail-chat-icon">💬</span>
                Join chat
              </button>
            </div>
          </div>
        </div>

        <div className="detail-meme-address">
          <span className="detail-meme-address-title">CA:</span>{' '}
          <CopyableAddress address={tokenData.id} className="detail-meme-address-value" truncate={{ start: 20, end: 10 }} />
        </div>

        <div className="detail-info-section">
          <h3>Top Holders</h3>
          <div className="detail-holders-grid">
            {holders.length > 0 ? (
              holders.slice(0, 10).map((holder, index) => (
                <div key={holder.address} className="detail-holder-card">
                  <div className="detail-holder-rank-badge">
                    #{index + 1}
                  </div>
                  <div className="detail-holder-info">
                    <div className="detail-holder-address-main">
                      {holder.address === 'bonding curve' ? (
                        <span className="detail-bonding-curve-label">Bonding Curve</span>
                      ) : (
                        <CopyableAddress 
                          address={holder.address} 
                          className="detail-holder-address-copy"
                          truncate={{ start: 8, end: 6 }}
                        />
                      )}
                    </div>
                    <div className="detail-holder-stats">
                      <span className="detail-holder-balance">
                        {formatNumber(holder.balance)} {token?.symbol || 'tokens'}
                      </span>
                      <span className="detail-holder-percentage-badge">
                        {holder.percentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
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