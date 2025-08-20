import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { encodeFunctionData, decodeFunctionResult } from 'viem';
import { MaxUint256 } from 'ethers';
import { settings } from '../../settings';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showLoadingPopup, updatePopup } from '../MemeTransactionPopup/MemeTransactionPopupManager';
import { defaultMetrics } from '../TokenExplorer/TokenData';
import { CrystalLaunchpadRouter } from '../../abis/CrystalLaunchpadRouter';
import { CrystalDataHelperAbi } from '../../abis/CrystalDataHelperAbi';
import { CrystalLaunchpadToken } from '../../abis/CrystalLaunchpadToken';
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
  createdBy?: string;
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
  waitForTxReceipt: any;
  account: { connected: boolean; address: string; chainId: number };
  setChain: () => void;
  setpopup?: (popup: number) => void;
}

const TOTAL_SUPPLY = 1e9;
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/104695/crystal-launchpad/v0.0.10';
const MARKET_UPDATE_EVENT = '0x797f1d495432fad97f05f9fdae69fbc68c04742c31e6dfcba581332bd1e7272a';

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
  waitForTxReceipt,
  account,
  setChain,
  setpopup
}) => {
  const { tokenAddress } = useParams<{ tokenAddress: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { activechain } = useSharedContext();
  
  const [token, setToken] = useState<Token | null>(location.state?.tokenData || null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState(!location.state?.tokenData);
  const [isSigning, setIsSigning] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const [selectedInterval, setSelectedInterval] = useState('5m');
  const [chartData, setChartData] = useState<any>(null);
  const realtimeCallbackRef = useRef<any>({});
  const wsRef = useRef<WebSocket | null>(null);

  const routerAddress = settings.chainConfig[activechain]?.launchpadRouter;
  const balancegetter = settings.chainConfig[activechain]?.balancegetter;
  const HTTP_URL = settings.chainConfig[activechain]?.httpurl;
  const multicallAddress = settings.chainConfig[activechain]?.multicall3;
  const queryClient = useQueryClient();

  const userAddr = (account?.address ?? '').toLowerCase();
  const tokAddr = (tokenAddress ?? '').toLowerCase();
  const BAL_KEY = ['balance-and-allowance', userAddr, tokAddr] as const;

  const { data: rpcData } = useQuery({
    queryKey: BAL_KEY,
    queryFn: async () => {
      if (!account?.address || !tokenAddress) return { rawBalance: 0n, rawAllowance: 0n };

      const balanceCalldata = encodeFunctionData({
        abi: CrystalDataHelperAbi,
        functionName: 'batchBalanceOf',
        args: [account.address as `0x${string}`, [tokenAddress as `0x${string}`]],
      });

      const allowanceCalldata = encodeFunctionData({
        abi: CrystalLaunchpadToken,
        functionName: 'allowance',
        args: [account.address as `0x${string}`, routerAddress as `0x${string}`],
      });

      const multiCalldata = encodeFunctionData({
        abi: [{
          inputs: [
            { name: 'requireSuccess', type: 'bool' },
            {
              components: [
                { name: 'target', type: 'address' },
                { name: 'callData', type: 'bytes' },
              ],
              name: 'calls',
              type: 'tuple[]',
            },
          ],
          name: 'tryBlockAndAggregate',
          outputs: [
            { name: 'blockNumber', type: 'uint256' },
            { name: 'blockHash', type: 'bytes32' },
            {
              components: [
                { name: 'success', type: 'bool' },
                { name: 'returnData', type: 'bytes' },
              ],
              name: 'returnData',
              type: 'tuple[]',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        }],
        functionName: 'tryBlockAndAggregate',
        args: [false, [
          { target: balancegetter, callData: balanceCalldata },
          { target: tokenAddress as `0x${string}`, callData: allowanceCalldata },
        ]],
      });

      const res = await fetch(HTTP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{ to: multicallAddress, data: multiCalldata }, 'latest'],
        }),
      });
      
      const { result } = await res.json();
      const [, , returnData] = decodeFunctionResult({
        abi: [{
          inputs: [
            { name: 'requireSuccess', type: 'bool' },
            {
              components: [
                { name: 'target', type: 'address' },
                { name: 'callData', type: 'bytes' },
              ],
              name: 'calls',
              type: 'tuple[]',
            },
          ],
          name: 'tryBlockAndAggregate',
          outputs: [
            { name: 'blockNumber', type: 'uint256' },
            { name: 'blockHash', type: 'bytes32' },
            {
              components: [
                { name: 'success', type: 'bool' },
                { name: 'returnData', type: 'bytes' },
              ],
              name: 'returnData',
              type: 'tuple[]',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        }],
        functionName: 'tryBlockAndAggregate',
        data: result,
      });

      let rawBalance = 0n;
      let rawAllowance = 0n;

      if (returnData[0].success) {
        [rawBalance] = decodeFunctionResult({
          abi: CrystalDataHelperAbi,
          functionName: 'batchBalanceOf',
          data: returnData[0].returnData,
        });
      }

      if (returnData[1].success) {
        rawAllowance = decodeFunctionResult({
          abi: CrystalLaunchpadToken,
          functionName: 'allowance',
          data: returnData[1].returnData,
        });
      }

      return { rawBalance, rawAllowance };
    },
    enabled: !!account?.address && !!tokenAddress,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!rpcData) return;
    const { rawBalance, rawAllowance } = rpcData;
    setTokenBalance(Number(rawBalance.toString()) / 1e18);
    setAllowance(Number(rawAllowance.toString()) / 1e18);
  }, [rpcData]);

  const fetchTokenData = useCallback(async () => {
    if (!tokenAddress) return;

    try {
      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `
            query ($id: ID!) {
              market: markets(where: { tokenAddress: $id }) {
                id
                tokenAddress
                name
                symbol
                metadataCID
                createdAt
                latestPrice
                buyCount
                sellCount
                volume24h
                creator
              }
              trades(first: 50, orderBy: timestamp, orderDirection: desc, where: { tokenAddress: $id }) {
                id
                trader
                timestamp
                isBuy
                price
                tokenAmount
                nativeAmount
              }
              holders(first: 20, orderBy: balance, orderDirection: desc, where: { tokenAddress: $id }) {
                address
                balance
              }
            }
          `,
          variables: { id: tokenAddress.toLowerCase() }
        }),
      });

      const data = await response.json();
      if (!data.data) return;

      if (data.data.market?.length) {
        const market = data.data.market[0];
        const price = Number(market.latestPrice) / 1e18;
        
        let metadata: any = {};
        try {
          const metaResponse = await fetch(market.metadataCID);
          if (metaResponse.ok) {
            metadata = await metaResponse.json();
          }
        } catch (e) {
          console.warn('Failed to load metadata');
        }

        let createdTimestamp = Number(market.createdAt);
        if (createdTimestamp > 1e10) {
          createdTimestamp = Math.floor(createdTimestamp / 1000);
        }

        const tokenData: Token = {
          ...defaultMetrics,
          id: market.id.toLowerCase(),
          tokenAddress: market.tokenAddress.toLowerCase(),
          name: market.name,
          symbol: market.symbol,
          image: metadata.image || '',
          description: metadata.description || '',
          twitterHandle: metadata.twitter || '',
          website: metadata.website || '',
          telegramHandle: metadata.telegram || '',
          discordHandle: metadata.discord || '',
          status: 'new',
          created: createdTimestamp,
          price,
          marketCap: price * TOTAL_SUPPLY,
          buyTransactions: Number(market.buyCount),
          sellTransactions: Number(market.sellCount),
          volume24h: Number(market.volume24h) / 1e18,
          volumeDelta: 0,
          createdBy: market.creator,
          change24h: Math.random() * 200 - 100, // Mock data
        };

        setToken(tokenData);
      }

      if (data.data.trades?.length) {
        const mappedTrades = data.data.trades.map((t: any) => ({
          id: t.id,
          timestamp: Number(t.timestamp),
          isBuy: t.isBuy,
          price: Number(t.price) / 1e18,
          tokenAmount: Number(t.tokenAmount) / 1e18,
          nativeAmount: Number(t.nativeAmount) / 1e18,
          caller: t.trader,
        }));
        setTrades(mappedTrades);
      }

      if (data.data.holders?.length) {
        const mappedHolders = data.data.holders.map((h: any) => ({
          address: h.address,
          balance: Number(h.balance) / 1e18,
          percentage: (Number(h.balance) / 1e18 / TOTAL_SUPPLY) * 100,
        }));
        setHolders(mappedHolders);
      }

    } catch (error) {
      console.error('Failed to fetch token data:', error);
    } finally {
      setLoading(false);
    }
  }, [tokenAddress]);

  useEffect(() => {
    if (!token) {
      fetchTokenData();
    }
  }, [token, fetchTokenData]);

  const handleTrade = async () => {
    if (!tradeAmount || !account.connected || !token || !sendUserOperationAsync || !waitForTxReceipt) {
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
            abi: CrystalLaunchpadRouter,
            functionName: 'buy',
            args: [token.tokenAddress as `0x${string}`],
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
        await waitForTxReceipt(op.hash);

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

        if (allowance < parseFloat(tradeAmount)) {
          if (updatePopup) {
            updatePopup(txId, {
              title: 'Approving tokens...',
              subtitle: `Granting permission to sell ${token.symbol}`,
              variant: 'info'
            });
          }

          const approveUo = {
            target: tokenAddress as `0x${string}`,
            data: encodeFunctionData({
              abi: CrystalLaunchpadToken,
              functionName: 'approve',
              args: [routerAddress as `0x${string}`, MaxUint256],
            }),
            value: 0n,
          };
          const approveOp = await sendUserOperationAsync({ uo: approveUo });
          await waitForTxReceipt(approveOp.hash);
        }

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
            abi: CrystalLaunchpadRouter,
            functionName: 'sell',
            args: [tokenAddress as `0x${string}`, amountTokenWei],
          }),
          value: 0n,
        };

        const sellOp = await sendUserOperationAsync({ uo: sellUo });
        await waitForTxReceipt(sellOp.hash);

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
              <span>Created by {token.createdBy ? `${token.createdBy.slice(0, 6)}...${token.createdBy.slice(-4)}` : 'Unknown'}</span>
              <span>•</span>
              <span>{Math.floor((Date.now() / 1000 - token.created) / 3600)}h ago</span>
              <span>•</span>
              <span>{bondingProgress.toFixed(1)}% bonded</span>
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


            {tradeType === 'sell' && tokenBalance > 0 && (
              <div className="detail-balance-info">
                <span>Balance: {formatNumber(tokenBalance)} {token.symbol}</span>
                <button
                  onClick={() => setTradeAmount(tokenBalance.toString())}
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
                `${tradeType === 'buy' ? 'Log in to buy' : 'Sell'}`
              )}
            </button>
          </div>
        </div>
        <div className="detail-trading-panel">
          <div className="detail-trade-stats">
            <div className="detail-stat-row">
              <span>Position</span>
              <span>{formatNumber(tokenBalance)} {token.symbol}</span>
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
            <div className="detail-bonding-info">
              <span>{formatNumber(bondingProgress * 100)} MON in bonding curve</span>
              <span>${formatNumber(72940)} to graduate</span>
            </div>
          </div>
          </div>
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