import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { defaultMetrics } from '../TokenExplorer/TokenData';
import './TokenBoard.css';

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

interface TokenBoardProps {
  sendUserOperationAsync: any;
  waitForTxReceipt: any;
  account: { connected: boolean; address: string; chainId: number };
  setChain: () => void;
  setpopup?: (popup: number) => void;
}

const TOTAL_SUPPLY = 1e9;
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/104695/test/v0.0.10';
const MARKET_UPDATE_EVENT = '0x797f1d495432fad97f05f9fdae69fbc68c04742c31e6dfcba581332bd1e7272a';

const formatPrice = (p: number, noDecimals = false) => {
  if (p >= 1e12) return `$${noDecimals ? Math.round(p / 1e12) : (p / 1e12).toFixed(1)}T`;
  if (p >= 1e9) return `$${noDecimals ? Math.round(p / 1e9) : (p / 1e9).toFixed(1)}B`;
  if (p >= 1e6) return `$${noDecimals ? Math.round(p / 1e6) : (p / 1e6).toFixed(1)}M`;
  if (p >= 1e3) return `$${noDecimals ? Math.round(p / 1e3) : (p / 1e3).toFixed(1)}K`;
  return `$${noDecimals ? Math.round(p) : p.toFixed(2)}`;
};

const formatTimeAgo = (createdTimestamp: number) => {
  const now = Math.floor(Date.now() / 1000);
  const ageSec = now - createdTimestamp;
  
  if (ageSec < 60) {
    return `${ageSec}s ago`;
  } else if (ageSec < 3600) {
    return `${Math.floor(ageSec / 60)}m ago`;
  } else if (ageSec < 86400) {
    return `${Math.floor(ageSec / 3600)}h ago`;
  } else if (ageSec < 604800) {
    return `${Math.floor(ageSec / 86400)}d ago`;
  } else {
    return `${Math.floor(ageSec / 604800)}w ago`;
  }
};

const MiniChart: React.FC<{ token: Token }> = ({ token }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generate mock price data based on change24h
    const points = 20;
    const data: number[] = [];
    const basePrice = token.price || 1;
    const change = token.change24h || 0;
    
    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const randomVariation = (Math.random() - 0.5) * 0.1;
      const trendValue = basePrice * (1 + (change / 100) * progress + randomVariation);
      data.push(Math.max(0, trendValue));
    }

    if (data.length < 2) return;

    const minPrice = Math.min(...data);
    const maxPrice = Math.max(...data);
    const priceRange = maxPrice - minPrice || 1;

    // Draw chart line
    ctx.strokeStyle = change >= 0 ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    data.forEach((price, index) => {
      const x = (index / (data.length - 1)) * canvas.width;
      const y = canvas.height - ((price - minPrice) / priceRange) * canvas.height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }, [token.price, token.change24h]);

  return (
    <canvas 
      ref={canvasRef} 
      width={80} 
      height={40} 
      className="board-mini-chart"
    />
  );
};

const TokenCard: React.FC<{ token: Token; onClick: () => void }> = ({ token, onClick }) => {
  const changeColor = token.change24h >= 0 ? '#22c55e' : '#ef4444';
  const changeSign = token.change24h >= 0 ? '+' : '';

  return (
    <div className="board-token-card" onClick={onClick}>
                    <div className="board-token-image-container">
          <img 
            src={token.image || '/placeholder-token.png'} 
            alt={token.name}
            className="board-token-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-token.png';
            }}
          />
        </div>
        <div className="board-token-card-content">        
      <div className="board-card-header">

        <div className="board-token-info">
          <div className="board-token-name">{token.name}</div>
          <div className="board-token-symbol">{token.symbol}</div>
        </div>
      </div>

      <div className="board-token-creator">
        <div className="board-creator-info"> 
        <span className="board-creator-address">
          {token.createdBy ? 
            `${token.createdBy.slice(0, 6)}...${token.createdBy.slice(-4)}` : 
            '0x0000000000000000000000000000000000000000'
          }
        </span>
        <span className="board-time-ago">{formatTimeAgo(token.created)}</span>
        </div>
      </div>

      <div className="board-market-info">
        <div className="board-market-cap">
          <span className="board-mc-label">MC</span>
          <span className="board-mc-value">{formatPrice(token.marketCap)}</span>
        </div>
        <div className="board-price-change" style={{ color: changeColor }}>
          {changeSign}{token.change24h.toFixed(2)}%
        </div>
      </div>
            </div>
      {token.description && (
        <div className="board-token-description">
          {token.description.length > 100 
            ? `${token.description.slice(0, 100)}...` 
            : token.description
          }
        </div>
      )}

      <div className="board-card-footer">
        <div className="board-bonding-progress">
          <div className="board-progress-label">
            {token.status === 'graduated' ? 'Graduated' : `${Math.min((token.marketCap / 10000) * 100, 100).toFixed(1)}% to graduation`}
          </div>
          <div className="board-progress-bar">
            <div 
              className="board-progress-fill" 
              style={{ 
                width: `${token.status === 'graduated' ? 100 : Math.min((token.marketCap / 10000) * 100, 100)}%`,
                backgroundColor: token.status === 'graduated' ? '#ffd700' : '#22c55e'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const TokenBoard: React.FC<TokenBoardProps> = ({
  sendUserOperationAsync,
  waitForTxReceipt,
  account,
  setChain,
  setpopup
}) => {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'marketCap' | 'volume'>('newest');
  const wsRef = useRef<WebSocket | null>(null);

  const filteredAndSortedTokens = React.useMemo(() => {
    let filtered = tokens;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = tokens.filter(token => 
        token.name.toLowerCase().includes(term) ||
        token.symbol.toLowerCase().includes(term) ||
        token.description.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.created - a.created;
        case 'marketCap':
          return b.marketCap - a.marketCap;
        case 'volume':
          return b.volume24h - a.volume24h;
        default:
          return b.created - a.created;
      }
    });

    return sorted;
  }, [tokens, searchTerm, sortBy]);


const fetchTokens = useCallback(async () => {
  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `
          {
            markets(first: 50, orderBy: createdAt, orderDirection: desc) {
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
            }
          }
        `,
      }),
    });

    const data = await response.json();
    if (!data.data?.markets) return;

    const tokenPromises = data.data.markets.map(async (market: any) => {
      const price = Number(market.latestPrice) / 1e18;
      
      let metadata: any = {};
      try {
        const metaResponse = await fetch(market.metadataCID);
        if (metaResponse.ok) {
          metadata = await metaResponse.json();
        }
      } catch (e) {
        console.warn('Failed to load metadata for', market.metadataCID, e);
      }

      let createdTimestamp = Number(market.createdAt);
      if (createdTimestamp > 1e10) {
        createdTimestamp = Math.floor(createdTimestamp / 1000);
      }

      return {
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
        status: 'new' as const,
        created: createdTimestamp,
        price,
        marketCap: price * TOTAL_SUPPLY,
        buyTransactions: Number(market.buyCount),
        sellTransactions: Number(market.sellCount),
        volume24h: Number(market.volume24h) / 1e18,
        volumeDelta: 0,
        change24h: Math.random() * 200 - 100, // Mock data for now
        createdBy: '0x0000000000000000000000000000000000000000', // Since we can't get creator from API
      } as Token;
    });

    const resolvedTokens = await Promise.all(tokenPromises);
    setTokens(resolvedTokens);
  } catch (error) {
    console.error('Failed to fetch tokens:', error);
  } finally {
    setLoading(false);
  }
}, []);

  const setupWebSocket = useCallback(() => {
    if (wsRef.current) return;

    const ws = new WebSocket('wss://testnet-rpc.monad.xyz');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = ({ data }) => {
      try {
        const msg = JSON.parse(data);
        if (msg?.method !== 'eth_subscription' || !msg.params?.result) return;
        
        const log = msg.params.result;
        if (log.topics[0] === MARKET_UPDATE_EVENT) {
          const marketId = log.address.toLowerCase();
          const hex = log.data.slice(2);
          const words: string[] = [];
          for (let i = 0; i < hex.length; i += 64) {
            words.push(hex.slice(i, i + 64));
          }

          const priceRaw = BigInt('0x' + words[2]);
          const price = Number(priceRaw) / 1e18;
          const marketCap = price * TOTAL_SUPPLY;

          setTokens(prev => prev.map(token => 
            token.id === marketId 
              ? { ...token, price, marketCap }
              : token
          ));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      wsRef.current = null;
      // Reconnect after a delay
      setTimeout(setupWebSocket, 5000);
    };
  }, []);

  useEffect(() => {
    fetchTokens();
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [fetchTokens, setupWebSocket]);

  const handleTokenClick = (token: Token) => {
    navigate(`/board/${token.tokenAddress}`, { 
      state: { tokenData: token } 
    });
  };

  return (
    <div className="board-container">
      <div className="board-header">
        <h1 className="board-title">Trending</h1>
        <div className="board-controls">
          <div className="board-search">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="board-search-input"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="board-loading">
          <div className="board-loading-spinner"></div>
          <span>Loading tokens...</span>
        </div>
      ) : (
        <div className="board-tokens-grid">
          {filteredAndSortedTokens.length > 0 ? (
            filteredAndSortedTokens.map((token) => (
              <TokenCard
                key={token.id}
                token={token}
                onClick={() => handleTokenClick(token)}
              />
            ))
          ) : (
            <div className="board-no-tokens">
              <div className="board-no-tokens-icon">🔍</div>
              <div className="board-no-tokens-text">No tokens found</div>
              <div className="board-no-tokens-subtitle">
                {searchTerm ? 'Try adjusting your search terms' : 'No tokens available at the moment'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TokenBoard;