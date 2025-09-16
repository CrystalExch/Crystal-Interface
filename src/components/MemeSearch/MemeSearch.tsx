import React, { useState, useMemo } from 'react';
import './MemeSearch.css';

// Simplified Token interface
export interface Token {
  id: string;
  tokenAddress: string;
  dev: string;
  name: string;
  symbol: string;
  image: string;
  price: number;
  marketCap: number;
  change24h: number;
  volume24h: number;
  website: string;
  twitterHandle: string;
  progress: number;
  created: number;
  bondingAmount: number;
  volumeDelta: number;
  telegramHandle: string;
  discordHandle: string;
}

interface MemeSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const MemeSearch: React.FC<MemeSearchProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Helper functions for formatting
  const formatPrice = (p: number) => {
    if (p >= 1e12) return `$${(p / 1e12).toFixed(1)}T`;
    if (p >= 1e9) return `$${(p / 1e9).toFixed(1)}B`;
    if (p >= 1e6) return `$${(p / 1e6).toFixed(1)}M`;
    if (p >= 1e3) return `$${(p / 1e3).toFixed(1)}K`;
    return `$${p.toFixed(2)}`;
  };

  const formatTimeAgo = (created: number) => {
    const now = Math.floor(Date.now() / 1000);
    const ageSec = now - created;
    if (ageSec < 60) return `${ageSec}s`;
    if (ageSec < 3600) return `${Math.floor(ageSec / 60)}m`;
    if (ageSec < 86400) return `${Math.floor(ageSec / 3600)}h`;
    if (ageSec < 604800) return `${Math.floor(ageSec / 86400)}d`;
    return `${Math.floor(ageSec / 604800)}w`;
  };

  const getTokenStatus = (progress: number) => {
    if (progress >= 100) return 'graduated';
    if (progress >= 75) return 'graduating';
    return 'new';
  };

  const tokens: Token[] = [
    {
      id: "0x1234567890abcdef1234567890abcdef12345678",
      tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
      dev: "0xabcdef1234567890abcdef1234567890abcdef12",
      name: 'PRICELESS',
      symbol: 'PRICELESS',
      image: '/api/placeholder/60/60',
      price: 0.000012,
      marketCap: 12000,
      change24h: 5.2,
      volume24h: 44,
      website: "https://priceless.com",
      twitterHandle: "https://twitter.com/priceless",
      progress: 25.4,
      created: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
      bondingAmount: 2540,
      volumeDelta: 0,
      telegramHandle: "https://t.me/priceless",
      discordHandle: "https://discord.gg/priceless"
    },
    {
      id: "0x2345678901bcdef12345678901bcdef123456789",
      tokenAddress: "0x2345678901bcdef12345678901bcdef123456789",
      dev: "0xbcdef12345678901bcdef12345678901bcdef123",
      name: 'MIMU',
      symbol: 'MIMU',
      image: '/api/placeholder/60/60',
      price: 0.000047,
      marketCap: 47000,
      change24h: -12.8,
      volume24h: 105000,
      website: "",
      twitterHandle: "https://twitter.com/mimu_token",
      progress: 78.7,
      created: Math.floor(Date.now() / 1000) - 2280, // 38 minutes ago
      bondingAmount: 7870,
      volumeDelta: 0,
      telegramHandle: "",
      discordHandle: "https://discord.gg/mimu"
    },
    {
      id: "0x3456789012cdef123456789012cdef1234567890",
      tokenAddress: "0x3456789012cdef123456789012cdef1234567890",
      dev: "0xcdef123456789012cdef123456789012cdef1234",
      name: 'EASTARM',
      symbol: 'EASTARM',
      image: '/api/placeholder/60/60',
      price: 0.000008,
      marketCap: 8000,
      change24h: 0,
      volume24h: 0,
      website: "https://eastarm.io",
      twitterHandle: "",
      progress: 18.2,
      created: Math.floor(Date.now() / 1000) - 2592000, // 1 month ago
      bondingAmount: 1820,
      volumeDelta: 0,
      telegramHandle: "https://t.me/eastarm",
      discordHandle: ""
    },
    {
      id: "0x4567890123def1234567890123def12345678901",
      tokenAddress: "0x4567890123def1234567890123def12345678901",
      dev: "0xdef1234567890123def1234567890123def12345",
      name: '$DIH',
      symbol: 'DIH',
      image: '/api/placeholder/60/60',
      price: 0.000007,
      marketCap: 7000,
      change24h: -5.1,
      volume24h: 0,
      website: "",
      twitterHandle: "https://twitter.com/dih_token",
      progress: 15.6,
      created: Math.floor(Date.now() / 1000) - 345600, // 4 days ago
      bondingAmount: 1560,
      volumeDelta: 0,
      telegramHandle: "",
      discordHandle: ""
    },
    {
      id: "0x5678901234ef12345678901234ef123456789012",
      tokenAddress: "0x5678901234ef12345678901234ef123456789012",
      dev: "0xef123456789012ef123456789012ef1234567890",
      name: 'CHARLIE',
      symbol: 'CHARLIE',
      image: '/api/placeholder/60/60',
      price: 0.000165,
      marketCap: 165000,
      change24h: 23.4,
      volume24h: 1000,
      website: "https://charlie.finance",
      twitterHandle: "https://twitter.com/charlie_coin",
      progress: 88.2,
      created: Math.floor(Date.now() / 1000) - 432000, // 5 days ago
      bondingAmount: 8820,
      volumeDelta: 0,
      telegramHandle: "https://t.me/charlie_army",
      discordHandle: "https://discord.gg/charlie"
    },
    {
      id: "0x6789012345f123456789012345f1234567890123",
      tokenAddress: "0x6789012345f123456789012345f1234567890123",
      dev: "0xf123456789012345f123456789012345f1234567",
      name: 'PEPE',
      symbol: 'PEPE',
      image: '/api/placeholder/60/60',
      price: 2.1,
      marketCap: 2100000,
      change24h: 156.7,
      volume24h: 45000,
      website: "https://pepe.vip",
      twitterHandle: "https://twitter.com/pepecoin",
      progress: 100,
      created: Math.floor(Date.now() / 1000) - 604800, // 7 days ago
      bondingAmount: 10000,
      volumeDelta: 0,
      telegramHandle: "https://t.me/pepecoin",
      discordHandle: "https://discord.gg/pepe"
    },
    {
      id: "0x7890123456f234567890123456f2345678901234",
      tokenAddress: "0x7890123456f234567890123456f2345678901234",
      dev: "0x123456789012345612345678901234561234567",
      name: 'DOGE',
      symbol: 'DOGE',
      image: '/api/placeholder/60/60',
      price: 0.156,
      marketCap: 890000,
      change24h: 45.2,
      volume24h: 23000,
      website: "https://dogecoin.com",
      twitterHandle: "https://twitter.com/dogecoin",
      progress: 100,
      created: Math.floor(Date.now() / 1000) - 1036800, // 12 days ago
      bondingAmount: 10000,
      volumeDelta: 0,
      telegramHandle: "https://t.me/dogecoin",
      discordHandle: ""
    },
    {
      id: "0x8901234567f345678901234567f3456789012345",
      tokenAddress: "0x8901234567f345678901234567f3456789012345",
      dev: "0x234567890123456723456789012345672345678",
      name: 'SHIB',
      symbol: 'SHIB',
      image: '/api/placeholder/60/60',
      price: 0.034,
      marketCap: 345000,
      change24h: -8.7,
      volume24h: 12000,
      website: "",
      twitterHandle: "https://twitter.com/shibtoken",
      progress: 100,
      created: Math.floor(Date.now() / 1000) - 259200, // 3 days ago
      bondingAmount: 10000,
      volumeDelta: 0,
      telegramHandle: "",
      discordHandle: "https://discord.gg/shib"
    }
  ];

  // Filter tokens based on search term
  const filteredTokens = useMemo(() => {
    if (!searchTerm) return tokens;
    
    return tokens.filter(token =>
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.tokenAddress.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, tokens]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div className="meme-search-overlay" onClick={onClose}>
      <div className="meme-search-modal" onClick={(e) => e.stopPropagation()}>
        {/* Search Bar */}
        <div className="meme-search-bar">
          <input
            type="text"
            placeholder="Search by name, ticker, or CA..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="meme-search-input"
          />
        </div>

        {/* Token List */}
        <div className="meme-search-list">
          {filteredTokens.length > 0 ? (
            filteredTokens.map((token) => {
              const status = getTokenStatus(token.progress);
              return (
                <div key={token.id} className="meme-token-row">
                  <div className="meme-token-content">
                    {/* Left side - Token info */}
                    <div className="meme-token-info">
                      <div className="meme-token-avatar">
                        <img 
                          src={token.image} 
                          alt={token.symbol}
                          className="meme-token-image"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div className="meme-avatar-placeholder" style={{ display: 'none' }}>
                          {token.symbol.slice(0, 2)}
                        </div>
                      </div>
                      <div className="meme-token-details">
                        <div className="meme-token-header">
                          <h3 className="meme-search-token-name">{token.name}</h3>
                          <span className={`meme-status-badge status-${status}`}>
                            {status === 'new' ? 'NEW' : 
                             status === 'graduating' ? 'GRADUATING' : 'GRADUATED'}
                          </span>
                        </div>
                        <div className="meme-token-meta">
                          <p className="meme-search-token-age">{formatTimeAgo(token.created)}</p>
                          <p className="meme-token-address">
                            {token.tokenAddress.slice(0, 6)}...{token.tokenAddress.slice(-4)}
                          </p>
                        </div>
                        
                        {/* Social Links */}
                        <div className="meme-social-links">
                          {token.twitterHandle && (
                            <a href={token.twitterHandle} target="_blank" rel="noopener noreferrer" className="meme-social-link">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                              </svg>
                            </a>
                          )}
                          {token.telegramHandle && (
                            <a href={token.telegramHandle} target="_blank" rel="noopener noreferrer" className="meme-social-link">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                              </svg>
                            </a>
                          )}
                          {token.discordHandle && (
                            <a href={token.discordHandle} target="_blank" rel="noopener noreferrer" className="meme-social-link">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                              </svg>
                            </a>
                          )}
                          {token.website && (
                            <a href={token.website} target="_blank" rel="noopener noreferrer" className="meme-social-link">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle - Progress Info */}
                    <div className="meme-token-middle">
                      {/* Bonding Progress (for non-graduated tokens) */}
                      {status !== 'graduated' && (
                        <div className="meme-bonding-info">
                          <div className="meme-bonding-label">
                            Progress: {token.progress.toFixed(1)}%
                          </div>
                          <div className="meme-bonding-bar">
                            <div 
                              className="meme-bonding-fill" 
                              style={{ 
                                width: `${token.progress}%`,
                                backgroundColor: token.progress < 25 ? '#ee5b5b' :
                                               token.progress < 50 ? '#f59e0b' :
                                               token.progress < 75 ? '#eab308' : '#43e17d'
                              }}
                            />
                          </div>
                          <div className="meme-bonding-amount">
                            Bonding: {formatPrice(token.bondingAmount)}
                          </div>
                        </div>
                      )}
                      
                      {status === 'graduated' && (
                        <div className="meme-graduated-info">
                          <div className="meme-graduated-badge">
                            🎓 GRADUATED
                          </div>
                          <div className="meme-dev-info">
                            Dev: {token.dev.slice(0, 6)}...{token.dev.slice(-4)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right side - Main Stats */}
                    <div className="meme-token-stats">
                      <div className="meme-search-stat-item">
                        <p className="meme-search-stat-label">MC</p>
                        <p className="meme-search-stat-value">{formatPrice(token.marketCap)}</p>
                      </div>
                      <div className="meme-search-stat-item">
                        <p className="meme-search-stat-label">V</p>
                        <p className="meme-search-stat-value">{formatPrice(token.volume24h)}</p>
                      </div>
                      <div className="meme-search-stat-item">
                        <p className="meme-search-stat-label">Price</p>
                        <p className="meme-search-stat-value">{token.price.toFixed(6)} MON</p>
                      </div>
                      <div className={`meme-price-badge ${token.change24h >= 0 ? 'positive' : 'negative'}`}>
                        {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="meme-no-results">
              <p>No tokens found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemeSearch;