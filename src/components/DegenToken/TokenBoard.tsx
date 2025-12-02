import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

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
  terminalRefetch: any;
  setTokenData: any;
  monUsdPrice: any;
  tokens: any;
}

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

  // Animation logic for Pump.fun style pop
  const cardRef = useRef<HTMLDivElement>(null);
  const [pop, setPop] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  useEffect(() => {
    if (isNew && animationsEnabled) {
      setPop(true);
      const timeout = setTimeout(() => setPop(false), 900);
      return () => clearTimeout(timeout);
    }
  }, [isNew, animationsEnabled]);

  const getCardClasses = () => {
    let classes = 'board-token-card';
    if (animationsEnabled) {
      classes += ' animations-enabled';
      if (isHighVolume) classes += ' high-volume';
    }
    if (pop) classes += ' pump-fun-animate';
    return classes;
  };

  return (
    <div
      ref={cardRef}
      className={getCardClasses()}
      onClick={onClick}
      style={{
        '--progress-color': token.status === 'graduated' ? '#ffd700' : bondingColor
      } as React.CSSProperties}
    >
      <div className="board-token-image-container">
        {token.image && !imageError ? (
          <img
            src={token.image}
            className="board-token-image"
            onError={() => setImageError(true)}
            alt={token.symbol}
          />
        ) : (
          <div
            className="board-token-image"
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'rgb(6,6,6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: token.symbol.length <= 3 ? '2.5rem' : '2rem',
              fontWeight: '200',
              color: '#ffffff',
              letterSpacing: token.symbol.length > 3 ? '-1px' : '0',
              borderRadius: '8px',
            }}
          >
            {token.symbol.slice(0, 2).toUpperCase()}
          </div>
        )}
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
  terminalRefetch,
  setTokenData,
  monUsdPrice,
  tokens,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'marketCap' | 'volume'>('newest');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [newTokenIds, setNewTokenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const groups: any[] = [
      ...(tokens.new ?? []),
      ...(tokens.graduating ?? []),
      ...(tokens.graduated ?? []),
    ];
    setLoading(groups.length == 0);
  }, [tokens]);

  const normalizedTokens: Token[] = useMemo(() => {
    if (!tokens) return [];

    const groups: any[] = [
      ...(tokens.new ?? []),
      ...(tokens.graduating ?? []),
      ...(tokens.graduated ?? []),
    ];

    return groups.map((t: any) => {
      const id = (t.id ?? t.id ?? '').toLowerCase();
      const tokenAddress = (t.id ?? t.id ?? '').toLowerCase();

      const price =
        Number(
          t.price ??
            (t.lastPriceNativePerTokenWad != null
              ? Number(t.lastPriceNativePerTokenWad) / 1e9
              : 0)
        ) || 0;

      const marketCap =
        Number(t.marketCap ?? (price ? price * 1e9 : 0)) || 0;

      const volume24h =
        Number(
          t.volume24h ??
            (t.volumeNative != null ? Number(t.volumeNative) / 1e18 : 0)
        ) || 0;

      return {
        id: id || tokenAddress,
        tokenAddress,
        name: t.name ?? '',
        symbol: t.symbol ?? '',
        image: t.image ?? t.metadataCID ?? '',
        price,
        marketCap,
        change24h: Number(t.change24h ?? 0),
        volume24h,
        holders: Number(t.holders ?? 0),
        proTraders: Number(t.proTraders ?? 0),
        kolTraders: Number(t.kolTraders ?? 0),
        sniperHolding: Number(t.sniperHolding ?? 0),
        devHolding: Number(t.devHolding ?? 0),
        bundleHolding: Number(t.bundleHolding ?? 0),
        insiderHolding: Number(t.insiderHolding ?? 0),
        top10Holding: Number(t.top10Holding ?? 0),
        buyTransactions: Number(t.buyTransactions ?? t.buyTxs ?? 0),
        sellTransactions: Number(t.sellTransactions ?? t.sellTxs ?? 0),
        globalFeesPaid: Number(t.globalFeesPaid ?? 0),
        website: t.website ?? '',
        twitterHandle: t.twitterHandle ?? '',
        progress: Number(t.progress ?? 0),
        status: (t.status ?? (t.migrated ? 'graduated' : 'new')) as
          | 'new'
          | 'graduating'
          | 'graduated',
        description: t.description ?? '',
        created: Number(t.created ?? t.timestamp ?? 0),
        bondingAmount: Number(t.bondingAmount ?? 0),
        volumeDelta: Number(t.volumeDelta ?? 0),
        telegramHandle: t.telegramHandle ?? (t.social2 ?? ''),
        discordHandle: t.discordHandle ?? (t.social3 ?? ''),
        creator: (t.creator?.id ?? t.dev ?? t.creator ?? '').toLowerCase(),
      } as Token;
    });
  }, [tokens]);

  const filteredAndSortedTokens = useMemo(() => {
    let filtered = normalizedTokens;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = normalizedTokens.filter(token =>
        (token.name ?? '').toLowerCase().includes(term) ||
        (token.symbol ?? '').toLowerCase().includes(term) ||
        (token.description ?? '').toLowerCase().includes(term) ||
        (token.creator ?? '').toLowerCase().includes(term)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.created ?? 0) - (a.created ?? 0);
        case 'marketCap':
          return (b.marketCap ?? 0) - (a.marketCap ?? 0);
        case 'volume':
          return (b.volume24h ?? 0) - (a.volume24h ?? 0);
        default:
          return (b.created ?? 0) - (a.created ?? 0);
      }
    });

    return sorted;
  }, [normalizedTokens, searchTerm, sortBy]);

  const handleTokenClick = (token: Token) => {
    setTokenData(token)
    navigate(`/board/${token.id}`);
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