import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import './MemeSearch.css';
import { TwitterHover } from '../TwitterHover/TwitterHover';
import telegram from '../../assets/telegram.png';
import discord from '../../assets/discord1.svg';
import avatar from '../../assets/avatar.png';
import tweet from '../../assets/tweet.png';
import lightning from '../../assets/flash.png';
import monadicon from '../../assets/monad.svg';

const SUBGRAPH_URL =
  'https://gateway.thegraph.com/api/b9cc5f58f8ad5399b2c4dd27fa52d881/subgraphs/id/BJKD3ViFyTeyamKBzC1wS7a3XMuQijvBehgNaSBb197e';

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
  description?: string;
}

interface MemeSearchProps {
  isOpen: boolean;
  onClose: () => void;
  monUsdPrice: number;
  onTokenClick?: (token: Token) => void;
  onQuickBuy?: (token: Token, amount: string) => void;
  sendUserOperationAsync?: any;
  quickAmounts?: { [key: string]: string };
  setQuickAmount?: (category: string, amount: string) => void;
  activePresets?: { [key: string]: number };
  setActivePreset?: (category: string, preset: number) => void;
  handleInputFocus?: () => void;
  buyPresets?: { [key: number]: { slippage: string; priority: string; amount: string } };
}

const formatPrice = (p: number) => {
  if (p >= 1e12) return `${(p / 1e12).toFixed(1)}T`;
  if (p >= 1e9) return `${(p / 1e9).toFixed(1)}B`;
  if (p >= 1e6) return `${(p / 1e6).toFixed(1)}M`;
  if (p >= 1e3) return `${(p / 1e3).toFixed(1)}K`;
  return `${p.toFixed(2)}`;
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

const calculateBondingPercentage = (marketCap: number) =>
  Math.min((marketCap / 25000) * 100, 100);

const getBondingColor = (b: number) => {
  if (b < 25) return '#ee5b5bff';
  if (b < 50) return '#f59e0b';
  if (b < 75) return '#eab308';
  return '#43e17dff';
};

const createColorGradient = (base: string) => {
  const hex = base.replace('#', '');
  const [r, g, b] = [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
  const lighter = (x: number) => Math.min(255, Math.round(x + (255 - x) * 0.3));
  const darker = (x: number) => Math.round(x * 0.7);
  return {
    start: `rgb(${darker(r)}, ${darker(g)}, ${darker(b)})`,
    mid: base,
    end: `rgb(${lighter(r)}, ${lighter(g)}, ${lighter(b)})`,
  };
};

const TOKENS_QUERY = `
  query ($first: Int!, $skip: Int!) {
    launchpadTokens(
      orderBy: timestamp
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      name
      symbol
      timestamp
      description
      metadataCID
      social1
      social2
      social3
      creator { id }
      lastPriceNativePerTokenWad
      volumeNative
    }
  }
`;

const MemeSearch: React.FC<MemeSearchProps> = ({
  isOpen,
  onClose,
  monUsdPrice,
  onTokenClick,
  onQuickBuy,
  sendUserOperationAsync,
  quickAmounts,
  setQuickAmount,
  activePresets,
  setActivePreset,
  handleInputFocus,
  buyPresets,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyingTokens, setBuyingTokens] = useState<Set<string>>(new Set());

  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('crystal_meme_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentlyViewed, setRecentlyViewed] = useState<Token[]>(() => {
    try {
      const saved = localStorage.getItem('crystal_meme_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const abortRef = useRef<AbortController | null>(null);

  const saveSearchHistory = (history: string[]) => {
    try {
      localStorage.setItem('crystal_meme_search_history', JSON.stringify(history));
    } catch {}
  };

  const saveRecentlyViewed = (ts: Token[]) => {
    try {
      localStorage.setItem('crystal_meme_recently_viewed', JSON.stringify(ts));
    } catch {}
  };

  const addToSearchHistory = (term: string) => {
    if (term.trim().length < 2) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== term);
      const next = [term, ...filtered].slice(0, 10);
      saveSearchHistory(next);
      return next;
    });
  };

  const addToRecentlyViewed = (token: Token) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(item => item.id !== token.id);
      const next = [token, ...filtered].slice(0, 20);
      saveRecentlyViewed(next);
      return next;
    });
  };

  const getCurrentQuickBuyAmount = useCallback(() => {
    const customAmount = quickAmounts?.new;
    if (customAmount && customAmount.trim() !== '') return customAmount;
    const activePreset = activePresets?.new || 1;
    const presetAmount = buyPresets?.[activePreset]?.amount;
    return presetAmount || '5';
  }, [quickAmounts, activePresets, buyPresets]);

  const handleQuickBuy = async (token: Token, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!onQuickBuy) return;
    setBuyingTokens(prev => new Set(prev).add(token.id));
    try {
      const amount = getCurrentQuickBuyAmount();
      await onQuickBuy(token, amount);
    } catch (e) {
      console.error('Quick buy failed:', e);
    } finally {
      setBuyingTokens(prev => {
        const s = new Set(prev);
        s.delete(token.id);
        return s;
      });
    }
  };

  const handleTokenClick = (token: Token) => {
    addToRecentlyViewed(token);
    setSearchTerm('');
    onTokenClick?.(token);
    onClose();
  };

  const mapGraphTokenToUi = useCallback(async (m: any): Promise<Token> => {
    const price = Number(m.lastPriceNativePerTokenWad || 0) / 1e18;
    
    let meta: any = {};
    try {
      if (m.metadataCID) {
        const metaRes = await fetch(m.metadataCID);
        if (metaRes.ok) meta = await metaRes.json();
      }
    } catch (e) {
      console.warn('failed to load metadata for', m.metadataCID, e);
    }

    const socials = [m.social1, m.social2, m.social3].map((s: string) => 
      s ? (/^https?:\/\//.test(s) ? s : `https://${s}`) : s
    ).filter(Boolean);

    const twitter = socials.find((s: string) => 
      s?.startsWith("https://x.com") || s?.startsWith("https://twitter.com")
    );
    if (twitter) {
      const index = socials.indexOf(twitter);
      if (index >= 0) socials.splice(index, 1);
    }

    const telegramUrl = socials.find((s: string) => s?.startsWith("https://t.me"));
    if (telegramUrl) {
      const index = socials.indexOf(telegramUrl);
      if (index >= 0) socials.splice(index, 1);
    }

    const discordUrl = socials.find((s: string) => 
      s?.startsWith("https://discord.gg") || s?.startsWith("https://discord.com")
    );
    if (discordUrl) {
      const index = socials.indexOf(discordUrl);
      if (index >= 0) socials.splice(index, 1);
    }

    const website = meta?.website || socials[0] || '';

    let createdTimestamp = Number(m.timestamp);
    if (createdTimestamp > 1e10) {
      createdTimestamp = Math.floor(createdTimestamp / 1000);
    }

    return {
      id: m.id.toLowerCase(),
      tokenAddress: m.id.toLowerCase(),
      dev: m.creator?.id || '',
      name: m.name || '',
      symbol: m.symbol || '',
      image: meta?.image || '',
      price,
      marketCap: price * 1e9,
      change24h: 0,
      volume24h: Number(m.volumeNative) / 1e18,
      website: website || '',
      twitterHandle: twitter || '',
      progress: (price * 1e9) / 25000 * 100,
      created: createdTimestamp,
      bondingAmount: 0,
      volumeDelta: 0,
      telegramHandle: telegramUrl || '',
      discordHandle: discordUrl || '',
      description: meta?.description || m.description || '',
    };
  }, []);

  const fetchLatest = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setError(null);
      setLoading(true);
      setIsSearching(true);

      const body = JSON.stringify({
        query: TOKENS_QUERY,
        variables: { first: 100, skip: 0 },
      });

      const res = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        signal: controller.signal,
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const rows = json?.data?.launchpadTokens ?? [];

      const processedTokens = await Promise.all(
        rows.map((row: any) => mapGraphTokenToUi(row))
      );

      if (!controller.signal.aborted) {
        setTokens(processedTokens);
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setError('Failed to load search results.');
        console.error('Search fetch failed:', e);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setIsSearching(false);
      }
    }
  }, [mapGraphTokenToUi]);


  const fetchRecentlyViewedFromSubgraph = useCallback(async (tokens: Token[]) => {
    if (tokens.length === 0) return tokens;
    
    try {
      const tokenIds = tokens.map(t => t.id.toLowerCase());
      const query = `
        query {
          launchpadTokens(
            where: { id_in: ${JSON.stringify(tokenIds)} }
            orderBy: timestamp
            orderDirection: desc
          ) {
            id
            name
            symbol
            timestamp
            description
            metadataCID
            social1
            social2
            social3
            creator { id }
            lastPriceNativePerTokenWad
            volumeNative
          }
        }
      `;

      const res = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const rows = json?.data?.launchpadTokens ?? [];

      const freshTokens = await Promise.all(
        rows.map((row: any) => mapGraphTokenToUi(row))
      );

      const orderedTokens = tokens.map(originalToken => {
        const freshToken = freshTokens.find(ft => ft.id.toLowerCase() === originalToken.id.toLowerCase());
        return freshToken || originalToken; 
      });

      return orderedTokens;
    } catch (e) {
      console.warn('Failed to fetch recently viewed from subgraph:', e);
      return tokens; 
    }
  }, [mapGraphTokenToUi]);

  useEffect(() => {
    if (!isOpen) return;

    const term = searchTerm.trim();

    if (term.length < 2) {
      setIsSearching(false);
      setLoading(false);
      
      if (recentlyViewed.length > 0) {
        fetchRecentlyViewedFromSubgraph(recentlyViewed).then(setTokens);
      } else {
        setTokens([]);
      }
      return;
    }

    addToSearchHistory(term);
    fetchLatest();
  }, [isOpen, searchTerm, recentlyViewed, fetchLatest, fetchRecentlyViewedFromSubgraph]);

  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
    }
  }, [isOpen]);

  const filteredTokens = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return tokens;
    return tokens.filter(token =>
      token.name.toLowerCase().includes(t) ||
      token.symbol.toLowerCase().includes(t) ||
      token.tokenAddress.toLowerCase().includes(t) ||
      token.id.toLowerCase().includes(t)
    );
  }, [searchTerm, tokens]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div className="meme-search-overlay" onClick={onClose}>
      <div className="meme-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="meme-top-row">
          <div className="meme-search-filters">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="meme-search-time-active">
              <path d="M12 6v6l4-2" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="meme-search-market-cap">
              <path d="M3 3v16a2 2 0 0 0 2 2h16" />
              <path d="M7 11.207a.5.5 0 0 1 .146-.353l2-2a.5.5 0 0 1 .708 0l3.292 3.292a.5.5 0 0 0 .708 0l4.292-4.292a.5.5 0 0 1 .854.353V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="meme-search-liquidity">
              <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
              <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
            </svg>
          </div>

          <div>
            <div className="explorer-quickbuy-container">
              <img className="explorer-quick-buy-search-icon" src={lightning} alt="" />
              <input
                type="text"
                placeholder="0.0"
                value={quickAmounts?.new || ''}
                onChange={(e) => setQuickAmount?.('new', e.target.value)}
                onFocus={handleInputFocus}
                className="explorer-quickbuy-input"
              />
              <img className="quickbuy-monad-icon" src={monadicon} />
              <div className="explorer-preset-controls">
                {[1, 2, 3].map(p => (
                  <button
                    key={p}
                    className={`explorer-preset-pill ${(activePresets?.new || 1) === p ? 'active' : ''}`}
                    onClick={() => setActivePreset?.('new', p)}
                  >
                    P{p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="meme-search-bar">
          <input
            type="text"
            placeholder="Search by name, ticker, or CA..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="meme-search-input"
          />
        </div>

        <div className="meme-search-results">
          {searchTerm.trim().length >= 2 && (loading || isSearching) ? (
            <div className="meme-search-skeleton-container">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="meme-search-skeleton-row">
                  <div className="meme-search-skeleton-content">
                    <div className="meme-search-skeleton-info">
                      <div className="meme-search-skeleton-avatar"></div>
                      <div className="meme-search-skeleton-details">
                        <div className="meme-search-skeleton-header">
                          <div className="meme-search-skeleton-symbol"></div>
                          <div className="meme-search-skeleton-name"></div>
                        </div>
                        <div className="meme-search-skeleton-meta">
                          <div className="meme-search-skeleton-age"></div>
                          <div className="meme-search-skeleton-socials">
                            <div className="meme-search-skeleton-social"></div>
                            <div className="meme-search-skeleton-social"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="meme-search-skeleton-stats">
                      <div className="meme-search-skeleton-stat"></div>
                      <div className="meme-search-skeleton-stat"></div>
                      <div className="meme-search-skeleton-stat"></div>
                      <div className="meme-search-skeleton-button"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {error && (
                <div className="meme-search-error">{error}</div>
              )}

              {searchTerm.trim().length === 0 && recentlyViewed.length > 0 && (
                <div className="meme-search-section">
                  <div className="meme-search-section-header">
                    <span>History</span>
                  </div>
                </div>
              )}

              {searchTerm.trim().length >= 2 && (loading || isSearching) && (
                <div className="meme-search-section">
                  <div className="meme-search-section-header">
                    <span>Searching...</span>
                  </div>
                </div>
              )}

              {searchTerm.trim().length >= 2 && !(loading || isSearching) && (
                <div className="meme-search-section">
                  <div className="meme-search-section-header">
                    <span>Results</span>
                  </div>
                </div>
              )}

              <div className="meme-search-list">
                {filteredTokens.length > 0 ? (
                  filteredTokens.map((token) => {
                    const status = getTokenStatus(token.progress);
                    const bondingPercentage = calculateBondingPercentage(token.marketCap);
                    const gradient = createColorGradient(getBondingColor(bondingPercentage));

                    type CSSVars = React.CSSProperties & Record<string, string>;
                    const imageStyle: CSSVars = {
                      position: 'relative',
                      '--progress-angle': `${(bondingPercentage / 100) * 360}deg`,
                      '--progress-color-start': gradient.start,
                      '--progress-color-mid': gradient.mid,
                      '--progress-color-end': gradient.end,
                    };

                    return (
                      <div
                        key={token.id}
                        className="meme-token-row"
                        onClick={() => handleTokenClick(token)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="meme-token-content">
                          <div className="meme-token-info">
                            <div
                              className={`meme-search-token-avatar-container ${status === 'graduated' ? 'meme-search-graduated' : ''}`}
                              style={status === 'graduated' ? { position: 'relative' } : imageStyle}
                            >
                              <div className="meme-search-progress-spacer">
                                <div className="meme-search-image-wrapper">
                                  {token.image ? (
                                    <img
                                      src={token.image}
                                      alt={token.symbol}
                                      className="meme-search-token-image"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const placeholder = e.currentTarget.parentElement?.querySelector('.meme-search-avatar-placeholder') as HTMLElement;
                                        if (placeholder) placeholder.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className="meme-search-avatar-placeholder"
                                    style={{ display: token.image ? 'none' : 'flex' }}
                                  >
                                    {token.symbol?.slice(0, 2) || '??'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="meme-token-details">
                              <div className="meme-token-header">
                                <h3 className="meme-search-token-symbol">{token.symbol}</h3>
                                <h3 className="meme-search-token-name">{token.name}</h3>
                              </div>

                              <div className="meme-token-meta">
                                <p className="meme-search-token-age">{formatTimeAgo(token.created)}</p>
                                <div className="meme-social-links">
                                  {!!token.twitterHandle && (
                                    <TwitterHover url={token.twitterHandle}>
                                      <a
                                        className="meme-social-link meme-avatar-btn"
                                        href={token.twitterHandle}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={e => e.stopPropagation()}
                                      >
                                        <img
                                          src={token.twitterHandle.includes('/status/') ? tweet : avatar}
                                          alt="Twitter"
                                          className={token.twitterHandle.includes('/status/') ? 'tweet-icon' : 'avatar-icon'}
                                        />
                                      </a>
                                    </TwitterHover>
                                  )}
                                  {!!token.telegramHandle && (
                                    <a
                                      className="meme-social-link meme-telegram-btn"
                                      href={token.telegramHandle}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <img src={telegram} alt="Telegram" />
                                    </a>
                                  )}
                                  {!!token.discordHandle && (
                                    <a
                                      className="meme-social-link meme-discord-btn"
                                      href={token.discordHandle}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <img src={discord} alt="Discord" />
                                    </a>
                                  )}
                                  {!!token.website && (
                                    <a
                                      className="meme-social-link meme-website-btn"
                                      href={token.website}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                      </svg>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

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
                              <p className="meme-search-stat-label">L</p>
                              <p className="meme-search-stat-value">{formatPrice(69000)}</p>
                            </div>
                            <button
                              className={`meme-price-badge quickbuy-button ${buyingTokens.has(token.id) ? 'loading' : ''}`}
                              onClick={(e) => handleQuickBuy(token, e)}
                              disabled={buyingTokens.has(token.id) || !onQuickBuy}
                              title={`Quick buy ${getCurrentQuickBuyAmount()} MON`}
                            >
                              {buyingTokens.has(token.id) ? (
                                <div className="quickbuy-loading-spinner" />
                              ) : (
                                <>
                                  <img className="explorer-quick-buy-icon" src={lightning} />
                                  {getCurrentQuickBuyAmount()} MON
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="meme-no-results">
                    {searchTerm.trim().length === 0 && recentlyViewed.length === 0 && (
                      <p>No recently viewed tokens</p>
                    )}
                    {searchTerm.trim().length >= 2 && filteredTokens.length === 0 && !loading && !isSearching && (
                      <p>No tokens found matching "{searchTerm}"</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemeSearch;