import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { settings } from '../../settings';
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
  creator: string;
}

interface TokenBoardProps {
  sendUserOperationAsync: any;
  account: { connected: boolean; address: string; chainId: number };
  setChain: () => void;
  setpopup?: (popup: number) => void;
  terminalQueryData: any;
  terminalToken: any;
  setTerminalToken: any;
  terminalRefetch: any;
  setTokenData: any;
  monUsdPrice: any;
}

const activechain = (settings as any).activechain ?? Object.keys(settings.chainConfig)[0];
const TOTAL_SUPPLY = 1e9;
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/104695/test/v0.4.0';
const MARKET_UPDATE_EVENT = '0xc367a2f5396f96d105baaaa90fe29b1bb18ef54c712964410d02451e67c19d3e';

const formatPrice = (p: number, noDecimals = false) => {
  if (p >= 1e12) return `${noDecimals ? Math.round(p / 1e12) : (p / 1e12).toFixed(1)}T MON`;
  if (p >= 1e9) return `${noDecimals ? Math.round(p / 1e9) : (p / 1e9).toFixed(1)}B MON`;
  if (p >= 1e6) return `${noDecimals ? Math.round(p / 1e6) : (p / 1e6).toFixed(1)}M MON`;
  if (p >= 1e3) return `${noDecimals ? Math.round(p / 1e3) : (p / 1e3).toFixed(1)}K MON`;
  return `${noDecimals ? Math.round(p) : p.toFixed(2)} MON`;
};

const formatTimeAgo = (createdTimestamp: number) => {
  const now = Math.floor(Date.now() / 1000);
  const ageSec = now - createdTimestamp;

  if (ageSec < 60) return `${ageSec}s`;
  if (ageSec < 3600) return `${Math.floor(ageSec / 60)}m`;
  if (ageSec < 86400) return `${Math.floor(ageSec / 3600)}h`;
  if (ageSec < 604800) return `${Math.floor(ageSec / 86400)}d`;
  return `${Math.floor(ageSec / 604800)}w`;
};

const getBondingColor = (percentage: number) => {
  if (percentage < 25) return '#ee5b5bff';
  if (percentage < 50) return '#f59e0b';
  if (percentage < 75) return '#eab308';
  return '#43e17dff';
};

const calculateBondingPercentage = (marketCap: number) => {
  return Math.min((marketCap / 25000) * 100, 100);
};

const SkeletonCard: React.FC = () => (
  <div className="board-token-card skeleton">
    <div className="board-token-image-container skeleton">
      <div className="board-token-image skeleton" />
    </div>
    <div className="board-token-card-body">
      <div className="board-token-card-content">
        <div className="board-card-header">
          <div className="board-token-info">
            <div className="board-token-name skeleton">Loading Token Name</div>
            <div className="board-token-symbol skeleton">LOAD</div>
          </div>
        </div>

        <div className="board-token-creator">
          <div className="board-creator-info">
            <span className="board-creator-address skeleton">0x1234...5678</span>
            <span className="board-time-ago skeleton">5m</span>
          </div>
        </div>
      </div>
      <div className="board-token-description skeleton">
        Loading description text that would normally show the token description here with some sample content to fill the space...
      </div>
    </div>
  </div>
);

const TokenCard: React.FC<{ 
  token: Token; 
  onClick: () => void; 
  animationsEnabled: boolean;
  isNew?: boolean;
}> = ({ token, onClick, animationsEnabled, isNew = false }) => {
  const bondingPercentage = calculateBondingPercentage(token.marketCap);
  const bondingColor = getBondingColor(bondingPercentage);
  const changeColor = token.change24h >= 0 ? '#43e17dff' : '#ef4444';
  const changeSign = token.change24h >= 0 ? '+' : '';
  
  const isHighVolume = token.volume24h > 10000; 

  const getCardClasses = () => {
    let classes = 'board-token-card';
    
    if (animationsEnabled) {
      classes += ' animations-enabled';
      if (isNew) classes += ' is-new';
      if (isHighVolume) classes += ' high-volume';
    }
    
    return classes;
  };

  return (
    <div className={getCardClasses()} onClick={onClick} style={{
      '--progress-color': token.status === 'graduated' ? '#ffd700' : bondingColor
    } as React.CSSProperties}>
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
      <div className="board-token-card-body">
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
                {token.creator ? 
                  `${token.creator.slice(0, 6)}...${token.creator.slice(-4)}` : 
                  '0x0000...0000'
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
          </div>
          <div className="board-market-info">
            <div className="board-bonding-progress">
                <div className="board-progress-bar">
                  <div
                    className="board-progress-fill"
                    style={{
                      width: `${token.status === 'graduated' ? 100 : bondingPercentage}%`,
                      backgroundColor: token.status === 'graduated' ? '#ffd700' : bondingColor
                    }}
                  />
                </div>
              </div>
              <div className="board-price-change" style={{ color: changeColor }}>
                {changeSign}{token.change24h.toFixed(2)}%
              </div>
            </div>
          </div>
        {token.description && (
          <div className="board-token-description">
            {token.description.length > 120
              ? `${token.description.slice(0, 120)}...`
              : token.description
            }
          </div>
        )}
      </div>
    </div>
  );
};

const TokenBoard: React.FC<TokenBoardProps> = ({
  sendUserOperationAsync,
  account,
  setChain,
  setpopup,
  terminalQueryData,
  terminalToken,
  setTerminalToken,
  terminalRefetch,
  setTokenData,
  monUsdPrice
}) => {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'marketCap' | 'volume'>('newest');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [newTokenIds, setNewTokenIds] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);

  const filteredAndSortedTokens = React.useMemo(() => {
    let filtered = tokens;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = tokens.filter(token =>
        token.name.toLowerCase().includes(term) ||
        token.symbol.toLowerCase().includes(term) ||
        token.description.toLowerCase().includes(term) ||
        token.creator.toLowerCase().includes(term)
      );
    }

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
              launchpadTokens(first: 100, orderBy: timestamp, orderDirection: desc) {
                id
                creator {
                  id
                }
                name
                symbol
                metadataCID
                description
                social1
                social2
                social3
                timestamp
                migrated
                migratedAt
                volumeNative
                volumeToken
                buyTxs
                sellTxs
                distinctBuyers
                distinctSellers
                lastPriceNativePerTokenWad
                lastUpdatedAt
              }
            }`,
        }),
      });

      const data = await response.json();
      if (!data.data?.launchpadTokens) return;

      const tokenPromises = data.data.launchpadTokens.map(async (market: any) => {
        const price = Number(market.lastPriceNativePerTokenWad) / 1e18 || defaultMetrics.price;

        let metadata: any = {};
        try {
          const metaResponse = await fetch(market.metadataCID);
          if (metaResponse.ok) {
            metadata = await metaResponse.json();
          }
        } catch (e) {
          console.warn('Failed to load metadata for', market.metadataCID, e);
        }

        let createdTimestamp = Number(market.timestamp);
        if (createdTimestamp > 1e10) {
          createdTimestamp = Math.floor(createdTimestamp / 1000);
        }

        const socials = [market.social1, market.social2, market.social3].map(s => 
          s ? (/^https?:\/\//.test(s) ? s : `https://${s}`) : s
        );
        const twitter = socials.find(s => s?.startsWith("https://x.com") || s?.startsWith("https://twitter.com"));
        if (twitter) socials.splice(socials.indexOf(twitter), 1);
        const telegram = socials.find(s => s?.startsWith("https://t.me"));
        if (telegram) socials.splice(socials.indexOf(telegram), 1);
        const discord = socials.find(s => s?.startsWith("https://discord.gg") || s?.startsWith("https://discord.com"));
        if (discord) socials.splice(socials.indexOf(discord), 1);
        const website = socials[0];

        return {
          ...defaultMetrics,
          id: market.id.toLowerCase(),
          tokenAddress: market.id.toLowerCase(),
          creator: market.creator?.id || '0x0000000000000000000000000000000000000000',
          name: market.name,
          symbol: market.symbol,
          image: metadata.image || '',
          description: metadata.description || '',
          twitterHandle: twitter || '',
          website: website || '',
          telegramHandle: telegram || '',
          discordHandle: discord || '',
          status: market.migrated ? 'graduated' : 'new' as const,
          created: createdTimestamp,
          price,
          marketCap: price * TOTAL_SUPPLY,
          buyTransactions: Number(market.buyTxs),
          sellTransactions: Number(market.sellTxs),
          volume24h: Number(market.volumeNative) / 1e18,
          volumeDelta: 0,
          change24h: 20, 
        } as Token;
      });

      const resolvedTokens = await Promise.all(tokenPromises);
      
      if (tokens.length > 0) {
        const existingIds = new Set(tokens.map(t => t.id));
        const newIds = new Set<string>();
        
        resolvedTokens.forEach(token => {
          if (!existingIds.has(token.id)) {
            newIds.add(token.id);
          }
        });
        
        if (newIds.size > 0) {
          setNewTokenIds(newIds);
          setTimeout(() => setNewTokenIds(new Set()), 1000);
        }
      }
      
      setTokens(resolvedTokens);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setLoading(false);
    }
  }, [tokens]);

  const setupWebSocket = useCallback(() => {
    if (wsRef.current) return;

    const ws = new WebSocket(settings.chainConfig[activechain].wssurl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('TokenBoard WebSocket connected');
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
  }, [setupWebSocket]);

  const handleTokenClick = (token: Token) => {
    setTokenData(token)
    navigate(`/board/${token.tokenAddress}`);
  };

  const handleSortChange = (newSort: 'newest' | 'marketCap' | 'volume') => {
    setSortBy(newSort);
  };

  const toggleAnimations = () => {
    setAnimationsEnabled(!animationsEnabled);
  };

  return (
    <div className="board-container">
      <button className="launch-token-btn" onClick={() => navigate('/launchpad')}>
        Launch a Token
      </button>
      
      <div className="board-header">
        {/* <h1 className="board-title">Trending Tokens</h1> */}
        <div className="board-controls">
          <div className="board-controls-left">
            <div className="board-sort-buttons">
              <button
                className={`board-sort-btn ${sortBy === 'newest' ? 'active' : ''}`}
                onClick={() => handleSortChange('newest')}
              >
                Newest
              </button>
              <button
                className={`board-sort-btn ${sortBy === 'marketCap' ? 'active' : ''}`}
                onClick={() => handleSortChange('marketCap')}
              >
                Market Cap
              </button>
              <button
                className={`board-sort-btn ${sortBy === 'volume' ? 'active' : ''}`}
                onClick={() => handleSortChange('volume')}
              >
                Volume
              </button>
            </div>
          </div>
          
          <div className="board-controls-right">
            <div 
              className={`board-animation-toggle ${animationsEnabled ? 'active' : ''}`}
              onClick={toggleAnimations}
            >
              <span>Animations</span>
            </div>
          </div>
        </div>
      </div>

      <div className="board-tokens-grid">
        {loading ? (
          Array.from({ length: 30 }).map((_, index) => (
            <SkeletonCard key={`skeleton-${index}`} />
          ))
        ) : filteredAndSortedTokens.length > 0 ? (
          filteredAndSortedTokens.map((token) => (
            <TokenCard
              key={token.id}
              token={token}
              onClick={() => handleTokenClick(token)}
              animationsEnabled={animationsEnabled}
              isNew={newTokenIds.has(token.id)}
            />
          ))
        ) : (
          <div className="board-no-tokens">
            <div className="board-no-tokens-text">No tokens found</div>
            <div className="board-no-tokens-subtitle">
              {searchTerm ? 'Try adjusting your search terms' : 'No tokens available at the moment'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenBoard;