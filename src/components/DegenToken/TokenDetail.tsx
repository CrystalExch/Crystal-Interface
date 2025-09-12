import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { encodeFunctionData, decodeFunctionResult } from 'viem';
import { settings } from '../../settings';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showLoadingPopup, updatePopup } from '../MemeTransactionPopup/MemeTransactionPopupManager';
import { defaultMetrics } from '../TokenExplorer/TokenData';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi';
import { CrystalDataHelperAbi } from '../../abis/CrystalDataHelperAbi';
import { useSharedContext } from '../../contexts/SharedContext';
import MemeChart from '../MemeInterface/MemeChart/MemeChart';

import './TokenDetail.css';

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
  timestamp: number;
  likes: number;
}

interface TokenDetailProps {
  sendUserOperationAsync: any;
  account: { connected: boolean; address: string; chainId: number };
  setChain: () => void;
  setpopup?: (popup: number) => void;
  terminalQueryData: any;
  terminalToken: any;
  setTerminalToken: any;
  terminalRefetch: any;
  walletTokenBalances: any;
  tokenData?: any;
}

const TOTAL_SUPPLY = 1e9;
const SUBGRAPH_URL = 'https://gateway.thegraph.com/api/b9cc5f58f8ad5399b2c4dd27fa52d881/subgraphs/id/BJKD3ViFyTeyamKBzC1wS7a3XMuQijvBehgNaSBb197e';
const MARKET_UPDATE_EVENT = '0xc367a2f5396f96d105baaaa90fe29b1bb18ef54c712964410d02451e67c19d3e';

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
  tokenData
}) => {
  const { tokenAddress } = useParams<{ tokenAddress: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { activechain } = useSharedContext();
  
  const [token, setToken] = useState<Token | null>(tokenData || null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState(!tokenData);
  const [isSigning, setIsSigning] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState('5m');
  const [chartData, setChartData] = useState<any>(null);
  const realtimeCallbackRef = useRef<any>({});

  const routerAddress = settings.chainConfig[activechain]?.launchpadRouter;

  const fetchTokenData = useCallback(async () => {
    if (!token) return;
    let isCancelled = false;

    try {
      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `
          query ($id: ID!) {
            launchpadTokens: launchpadTokens(where: { id: $id }) {
              lastPriceNativePerTokenWad
              volumeNative
              buyTxs
              sellTxs
              trades(first: 50, orderBy: block, orderDirection: desc) {
                id
                account {id}
                block
                isBuy
                priceNativePerTokenWad
                amountIn
                amountOut
              }
              series: ${'series' + (selectedInterval === '1m' ? '60' :
              selectedInterval === '5m' ? '300' :
                selectedInterval === '15m' ? '900' :
                  selectedInterval === '1h' ? '3600' :
                    selectedInterval === '4h' ? '14400' :
                      '86400')} {
                klines(first: 1000, orderBy: time, orderDirection: desc) {
                  time open high low close
                }
              }
            }
          }`,
          variables: {
            id: token.id.toLowerCase(),
          }
        }),
      });

      const data = (await response.json())?.data;
      if (isCancelled || !data) return;
      console.log(data)
      if (data.launchpadTokens?.[0]?.series?.klines) {
        const bars = data.launchpadTokens?.[0]?.series?.klines
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
        const key =
          token.symbol +
          "MON" +
          (selectedInterval === "1d"
            ? "1D"
            : selectedInterval === "4h"
              ? "240"
              : selectedInterval === "1h"
                ? "60"
                : selectedInterval.slice(0, -1));
        setChartData([bars, key, false]);
      }
    } catch (error) {
      console.error('Failed to fetch token data:', error);
    } finally {
      setLoading(false);
    }
  }, [tokenAddress]);

  useEffect(() => {
    setTerminalToken(tokenAddress)
    fetchTokenData();
  }, [token, fetchTokenData]);

  const handleTrade = async () => {
    if (!tradeAmount || !account.connected || !token || !sendUserOperationAsync) {
      setpopup?.(4);
      return;
    }

    const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) {
      setChain();
      return;
    }

    const txId = `detail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      setIsSigning(true);

      if (tradeType === 'buy') {
        if (showLoadingPopup) {
          showLoadingPopup(txId, {
            title: 'Sending transaction...',
            subtitle: `Buying ${tradeAmount} MON worth of ${token.symbol}`,
            amount: tradeAmount,
            amountUnit: 'MON'
          });
        }

        const value = BigInt(Math.round(parseFloat(tradeAmount) * 1e18));

        const uo = {
          target: routerAddress,
          data: encodeFunctionData({
            abi: CrystalRouterAbi,
            functionName: 'buy',
            args: [true, token.tokenAddress as `0x${string}`, value, 0n],
          }),
          value,
        };

        if (updatePopup) {
          updatePopup(txId, {
            title: 'Confirming transaction...',
            subtitle: `Buying ${tradeAmount} MON worth of ${token.symbol}`,
            variant: 'info'
          });
        }

        const op = await sendUserOperationAsync({ uo });

        if (updatePopup) {
          updatePopup(txId, {
            title: `Bought ${token.symbol}`,
            subtitle: `Spent ${tradeAmount} MON`,
            variant: 'success',
            isLoading: false
          });
        }

      } else {
        if (showLoadingPopup) {
          showLoadingPopup(txId, {
            title: 'Sending transaction...',
            subtitle: `Selling ${tradeAmount} ${token.symbol}`,
            amount: tradeAmount,
            amountUnit: token.symbol
          });
        }

        const amountTokenWei = BigInt(Math.round(parseFloat(tradeAmount) * 1e18));
        if (updatePopup) {
          updatePopup(txId, {
            title: 'Confirming sell...',
            subtitle: `Selling ${tradeAmount} ${token.symbol}`,
            variant: 'info'
          });
        }

        const sellUo = {
          target: routerAddress as `0x${string}`,
          data: encodeFunctionData({
            abi: CrystalRouterAbi,
            functionName: 'sell',
            args: [true, tokenAddress as `0x${string}`, amountTokenWei, 0n],
          }),
          value: 0n,
        };

        const sellOp = await sendUserOperationAsync({ uo: sellUo });

        if (updatePopup) {
          updatePopup(txId, {
            title: `Sold ${token.symbol}`,
            subtitle: `Received MON`,
            variant: 'success',
            isLoading: false
          });
        }
      }

      setTradeAmount('');
    } catch (e: any) {
      console.error(e);
      if (updatePopup) {
        updatePopup(txId, {
          title: 'Transaction failed',
          subtitle: e?.message || 'Please try again.',
          variant: 'error',
          isLoading: false
        });
      }
    } finally {
      setIsSigning(false);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      user: account.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Anonymous',
      message: newComment.trim(),
      timestamp: Date.now(),
      likes: 0,
    };
    
    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="detail-loading-spinner"></div>
        <span>Loading token...</span>
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

  const bondingProgress = Math.min((token.marketCap / 10000) * 100, 100);

  return (
    <div className="detail-container">
      <div className="detail-main">
                        <button onClick={() => navigate('/board')} className="detail-back-button">
          ← Back
        </button>
        <div className="detail-header">
        <div className="detail-token-header">
          <img src={token.image} alt={token.name} className="detail-token-image" />
          <div className="detail-token-info">
            <h1 className="detail-token-name">{token.name}</h1>
            <div className="detail-token-symbol">{token.symbol}</div>
            <div className="detail-token-meta">
              <span>Created by {token.creator ? `${token.creator.slice(0, 6)}...${token.creator.slice(-4)}` : 'Unknown'}</span>
              <span>•</span>
              <span>{Math.floor((Date.now() / 1000 - token.created) / 3600)}h ago</span>
              <span>•</span>
              {token.status == 'graduated' ? <span>Coin has graduated!</span> : <span>{bondingProgress.toFixed(1)}% bonded</span>}
            </div>
          </div>
        </div>
        <div className="detail-quick-stats">
          <div className="detail-stat">
            <div className="detail-stat-label">Market Cap</div>
            <div className="detail-stat-value">{formatPrice(token.marketCap)}</div>
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
            />
          </div>

          <div className="detail-info-grid">

            <div className="detail-info-section">
              <h3>Comments</h3>
              <div className="detail-comments-section">
                <div className="detail-comment-input">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    className="detail-comment-field"
                  />
                  <button onClick={handleAddComment} className="detail-comment-submit">
                    Post
                  </button>
                </div>
                <div className="detail-comments-list">
                  {comments.map((comment) => (
                    <div key={comment.id} className="detail-comment">
                      <div className="detail-comment-header">
                        <span className="detail-comment-user">{comment.user}</span>
                        <span className="detail-comment-time">
                          {Math.floor((Date.now() - comment.timestamp) / 60000)}m ago
                        </span>
                      </div>
                      <div className="detail-comment-message">{comment.message}</div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <div className="detail-no-comments">No comments yet. Be the first!</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
                          <div className="detail-trading-panel-container">
        <div className="detail-trading-panel">
          <div className="detail-trade-header">
            <button
              className={`detail-trade-tab ${tradeType === 'buy' ? 'active' : ''}`}
              onClick={() => setTradeType('buy')}
            >
              Buy
            </button>
            <button
              className={`detail-trade-tab ${tradeType === 'sell' ? 'active' : ''}`}
              onClick={() => setTradeType('sell')}
            >
              Sell
            </button>
          </div>

          <div className="detail-trade-form">
            <div className="detail-trade-input-group">
              <label className="detail-trade-label">
                {tradeType === 'buy' ? 'Switch to' : 'Set max slippage'} {token.symbol}
              </label>
              <div className="detail-trade-input-wrapper">
                <input
                  type="number"
                  placeholder="0.00"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  className="detail-trade-input"
                />
                <span className="detail-trade-unit">
                  {tradeType === 'buy' ? 'MON' : token.symbol}
                </span>
              </div>
                          {tradeType === 'buy' && (
              <div className="detail-preset-buttons">
                {['1', '5', '10', '50'].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTradeAmount(amount)}
                    className="detail-preset-button"
                  >
                    {amount} MON
                  </button>
                ))}
                <button
                  onClick={() => setTradeAmount('100')}
                  className="detail-preset-button detail-preset-max"
                >
                  Max
                </button>
              </div>
            )}
            </div>


            {tradeType === 'sell' && (Number(walletTokenBalances?.[account?.address]?.[token.id]) / 1e18 ?? 0) > 0 && (
              <div className="detail-balance-info">
                <span>Balance: {formatNumber(Number(walletTokenBalances?.[account?.address]?.[token.id]) / 1e18 ?? 0)} {token.symbol}</span>
                <button
                  onClick={() => setTradeAmount((Number(walletTokenBalances?.[account?.address]?.[token.id]) / 1e18 ?? 0).toString())}
                  className="detail-max-button"
                >
                  MAX
                </button>
              </div>
            )}

            <button
              onClick={handleTrade}
              disabled={!tradeAmount || isSigning || !account.connected}
              className={`detail-trade-button ${tradeType === 'buy' ? 'buy' : 'sell'}`}
            >
              {isSigning ? (
                <div className="detail-button-spinner"></div>
              ) : !account.connected ? (
                'Connect Wallet'
              ) : (
                `${tradeType === 'buy' ? 'Buy' : 'Sell'}`
              )}
            </button>
          </div>
        </div>
        <div className="detail-trading-panel">
          <div className="detail-trade-stats">
            <div className="detail-stat-row">
              <span>Position</span>
              <span>{formatNumber(Number(walletTokenBalances?.[account?.address]?.[token.id]) / 1e18 ?? 0)} {token.symbol}</span>
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
              <div 
                className="detail-bonding-fill" 
                style={{ width: `${bondingProgress}%` }}
              />
            </div>
            {token.status == 'graduated' ? (<div className="detail-bonding-info">
              <span>Coin has graduated!</span>
            </div>) : (<div className="detail-bonding-info">
              <span>{formatNumber(bondingProgress * 100)} MON in bonding curve</span>
              <span>${formatNumber(72940)} to graduate</span>
            </div>)}
          </div>
          </div>
          <span className="detail-meme-address">
                  <span className="detail-meme-address-title">CA:</span>{" "}
                  {token.id.slice(0, 24)}...{token.id.slice(-4)}
                </span>
            <div className="detail-info-section">
              <h3>Top holders</h3>
              <div className="detail-holders-list">
                {holders.slice(0, 10).map((holder, index) => (
                  <div key={holder.address} className="detail-holder-item">
                    <span className="detail-holder-rank">{index + 1}.</span>
                    <span className="detail-holder-address">
                      {holder.address === 'bonding curve' 
                        ? 'bonding curve' 
                        : `${holder.address.slice(0, 6)}...${holder.address.slice(-4)}`
                      }
                    </span>
                    <span className="detail-holder-percentage">{holder.percentage.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
        </div>
    </div>
  );
};

export default TokenDetail;