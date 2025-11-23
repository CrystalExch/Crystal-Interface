import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import './MemeSearch.css';
import { TwitterHover } from '../TwitterHover/TwitterHover';
import telegram from '../../assets/telegram.png';
import discord from '../../assets/discord1.svg';
import avatar from '../../assets/avatar.png';
import tweet from '../../assets/tweet.png';
import lightning from '../../assets/flash.png';
import monadicon from '../../assets/monad.svg';
import { showLoadingPopup, updatePopup } from '../MemeTransactionPopup/MemeTransactionPopupManager';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { settings as appSettings } from '../../settings';

const BACKEND_BASE_URL = 'https://api.crystal.exchange';
const TOTAL_SUPPLY = 1e9;

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
  holders?: number;
  devHolding?: number;
  top10Holding?: number;
  bondingPercentage?: number;
  source?: 'crystal' | 'nadfun';
  buyTransactions?: number;
  sellTransactions?: number;
  launchedTokens?: number;
  graduatedTokens?: number;
}

export interface Market {
  address: string;
  baseAsset: string;
  quoteAsset: string;
  baseAddress: string;
  quoteAddress: string;
  pair: string;
  image: string;
  currentPrice: string;
  priceChange: string;
  volume: string;
  priceFactor?: number;
}

interface MemeSearchProps {
  monUsdPrice: number;
  onTokenClick?: (token: Token) => void;
  onMarketSelect?: (market: Market) => void;
  onQuickBuy?: (token: Token, amount: string) => void;
  sendUserOperationAsync?: any;
  quickAmounts?: { [key: string]: string };
  setQuickAmount?: (category: string, amount: string) => void;
  activePresets?: { [key: string]: number };
  setActivePreset?: (category: string, preset: number) => void;
  handleInputFocus?: () => void;
  buyPresets?: { [key: number]: { slippage: string; priority: string; amount: string } };
  marketsData?: Market[];
  tokendict: any;
  setpopup: any;
  activechain?: number;
}

const Tooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, children, position = 'top' }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current || !tooltipRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top + scrollY - tooltipRect.height - 5;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollY + 10;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - tooltipRect.width - 10;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + 10;
        break;
    }

    const margin = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (position === 'top' || position === 'bottom') {
      left = Math.min(
        Math.max(left, margin + tooltipRect.width / 2),
        viewportWidth - margin - tooltipRect.width / 2,
      );
    } else {
      top = Math.min(
        Math.max(top, margin),
        viewportHeight - margin - tooltipRect.height,
      );
    }

    setTooltipPosition({ top, left });
  }, [position]);

  const handleMouseEnter = useCallback(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    setIsLeaving(false);
    setShouldRender(true);

    fadeTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      fadeTimeoutRef.current = null;
    }, 10);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    setIsLeaving(true);
    setIsVisible(false);

    fadeTimeoutRef.current = setTimeout(() => {
      setShouldRender(false);
      setIsLeaving(false);
      fadeTimeoutRef.current = null;
    }, 150);
  }, []);

  useEffect(() => {
    if (shouldRender && !isLeaving) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [shouldRender, updatePosition, isLeaving]);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tooltip-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {shouldRender &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`tooltip tooltip-${position} ${isVisible ? 'tooltip-entering' : isLeaving ? 'tooltip-leaving' : ''}`}
            style={{
              position: 'absolute',
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: `${
                position === 'top' || position === 'bottom'
                  ? 'translateX(-50%)'
                  : position === 'left' || position === 'right'
                    ? 'translateY(-50%)'
                    : 'none'
              } scale(${isVisible ? 1 : 0})`,
              opacity: isVisible ? 1 : 0,
              zIndex: 9999,
              pointerEvents: 'none',
              transition:
                'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform, opacity',
            }}
          >
            <div className="tooltip-content">{content}</div>
          </div>,
          document.body,
        )}
    </div>
  );
};

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

const getTokenStatus = (progress: number): 'new' | 'graduating' | 'graduated' => {
  if (progress >= 100) return 'graduated';
  if (progress >= 75) return 'graduating';
  return 'new';
};

const calculateBondingPercentage = (marketCap: number) => Math.min((marketCap / 25000) * 100, 100);

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

const MemeSearch: React.FC<MemeSearchProps> = ({
  monUsdPrice,
  onTokenClick,
  onMarketSelect,
  onQuickBuy,
  sendUserOperationAsync,
  quickAmounts,
  setQuickAmount,
  activePresets,
  setActivePreset,
  handleInputFocus,
  buyPresets,
  marketsData = [],
  tokendict,
  setpopup,
  activechain = 10143, // Default to Monad testnet
}) => {
  const navigate = useNavigate();

  const copyToClipboard = useCallback(async (text: string) => {
    const txId = `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    try {
      await navigator.clipboard.writeText(text);
      if (showLoadingPopup && updatePopup) {
        showLoadingPopup(txId, {
          title: 'Address Copied',
          subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`,
        });
        setTimeout(() => {
          updatePopup(txId, {
            title: 'Address Copied',
            subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`,
            variant: 'success',
            confirmed: true,
            isLoading: false,
          });
        }, 100);
      }
    } catch (err) {
      console.error('Copy failed', err);
      if (showLoadingPopup && updatePopup) {
        showLoadingPopup(txId, {
          title: 'Copy Failed',
          subtitle: 'Unable to copy address to clipboard',
        });
        setTimeout(() => {
          updatePopup(txId, {
            title: 'Copy Failed',
            subtitle: 'Unable to copy address to clipboard',
            variant: 'error',
            confirmed: true,
            isLoading: false,
          });
        }, 100);
      }
    }
  }, []);

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

  const [recentlyViewedMarkets, setRecentlyViewedMarkets] = useState<Market[]>(() => {
    try {
      const saved = localStorage.getItem('crystal_meme_recently_viewed_markets');
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

  const saveRecentlyViewedMarkets = (markets: Market[]) => {
    try {
      localStorage.setItem('crystal_meme_recently_viewed_markets', JSON.stringify(markets));
    } catch {}
  };

  const addToSearchHistory = (term: string) => {
    if (term.trim().length < 2) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item !== term);
      const next = [term, ...filtered].slice(0, 10);
      saveSearchHistory(next);
      return next;
    });
  };

  const addToRecentlyViewed = (token: Token) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((item) => item.id !== token.id);
      const next = [token, ...filtered].slice(0, 20);
      saveRecentlyViewed(next);
      return next;
    });
  };

  const addToRecentlyViewedMarkets = (market: Market) => {
    setRecentlyViewedMarkets((prev) => {
      const filtered = prev.filter((item) => item.address !== market.address);
      const next = [market, ...filtered].slice(0, 20);
      saveRecentlyViewedMarkets(next);
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

    setBuyingTokens((prev) => new Set(prev).add(token.id));
    try {
      const amount = getCurrentQuickBuyAmount();
      await onQuickBuy(token, amount);
    } catch (e) {
      console.error('Quick buy failed:', e);
    } finally {
      setBuyingTokens((prev) => {
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
    setpopup(0);
  };

  const handleMarketClick = (market: Market) => {
    addToRecentlyViewedMarkets(market);
    setSearchTerm('');
    onMarketSelect?.(market);
    setpopup(0);
  };

  const mapBackendTokenToUi = useCallback((m: any): Token => {
    const marketCapNativeRaw = Number(m.marketcap_native_raw ?? 0);
    const price = marketCapNativeRaw / TOTAL_SUPPLY || 0;

    let createdTimestamp = Number(m.created_ts ?? 0);
    if (createdTimestamp > 1e10) {
      createdTimestamp = Math.floor(createdTimestamp / 1000);
    }

    const volume = Number(m.native_volume ?? 0) / 1e18;
    const holdersRaw = Number(m.holders ?? 0);
    const devHoldingRaw = Number(m.developer_holding ?? 0);
    const top10HoldingRaw = Number(m.top10_holding ?? 0);
    const launchpad = m.source === 1 ? 'nadfun' : 'crystal';

    const progress = (price * TOTAL_SUPPLY) / 25000 * 100;

    // Parse socials from the backend response
    const socials = [m.social1, m.social2, m.social3, m.social4]
      .map((s: string) => (s ? (/^https?:\/\//.test(s) ? s : `https://${s}`) : s))
      .filter(Boolean);

    const twitter = socials.find(
      (s: string) => s?.startsWith('https://x.com') || s?.startsWith('https://twitter.com'),
    );
    const telegram = socials.find((s: string) => s?.startsWith('https://t.me'));
    const discord = socials.find(
      (s: string) => s?.startsWith('https://discord.gg') || s?.startsWith('https://discord.com'),
    );
    const website = socials.find(
      (s: string) => !s?.includes('x.com') && !s?.includes('twitter.com') && !s?.includes('t.me') && !s?.includes('discord'),
    ) || '';

    return {
      id: (m.token as string).toLowerCase(),
      tokenAddress: (m.token as string).toLowerCase(),
      dev: (m.creator as string) || '',
      name: (m.name as string) || '',
      symbol: (m.symbol as string) || '',
      image: (m.metadata_cid as string) || '',
      description: m.description || '',
      twitterHandle: twitter || '',
      website: website || '',
      discordHandle: discord || '',
      telegramHandle: telegram || '',
      created: createdTimestamp,
      price,
      marketCap: price * TOTAL_SUPPLY,
      change24h: 0,
      buyTransactions: Number(m.tx?.buy ?? 0),
      sellTransactions: Number(m.tx?.sell ?? 0),
      volume24h: volume,
      volumeDelta: 0,
      launchedTokens: Number(m.developer_tokens_created ?? 0),
      graduatedTokens: Number(m.developer_tokens_graduated ?? 0),
      holders: holdersRaw,
      devHolding: devHoldingRaw / 1e27,
      top10Holding: top10HoldingRaw / 1e25,
      bondingPercentage: m.graduationPercentageBps ?? progress,
      progress,
      bondingAmount: 0,
      source: launchpad,
    };
  }, []);

  const fetchSearchResults = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setError(null);
      setLoading(true);
      setIsSearching(true);

      const searchQuery = searchTerm.trim();
      const url = `${BACKEND_BASE_URL}/search/query?query=${encodeURIComponent(searchQuery)}&limit=100`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      // The backend should return an array of tokens
      // Adjust based on your actual response structure
      const rows = json?.tokens ?? json?.results ?? json ?? [];

      const processedTokens = Array.isArray(rows) 
        ? rows.map((row: any) => mapBackendTokenToUi(row))
        : [];

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
  }, [searchTerm, mapBackendTokenToUi]);

  const fetchRecentlyViewedFromBackend = useCallback(
    async (tokens: Token[]) => {
      if (tokens.length === 0) return tokens;

      try {
        // If you have a batch endpoint, use it here
        // For now, we'll just return the cached tokens
        // since we don't have current prices
        return tokens;
      } catch (e) {
        console.warn('Failed to fetch recently viewed from backend:', e);
        return tokens;
      }
    },
    [],
  );

  useEffect(() => {
    const term = searchTerm.trim();

    if (term.length < 2) {
      setIsSearching(false);
      setLoading(false);
      setTokens([]);

      if (recentlyViewed.length > 0) {
        fetchRecentlyViewedFromBackend(recentlyViewed).then(setTokens);
      }
      return;
    }

    addToSearchHistory(term);
    fetchSearchResults();
  }, [searchTerm, recentlyViewed, fetchSearchResults, fetchRecentlyViewedFromBackend]);

  const filteredTokens = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return tokens;

    return tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(t) ||
        token.symbol.toLowerCase().includes(t) ||
        token.tokenAddress.toLowerCase().includes(t) ||
        token.id.toLowerCase().includes(t),
    );
  }, [searchTerm, tokens]);

  const filteredMarkets = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t || !marketsData.length) return [];

    return marketsData.filter(
      (market) =>
        market.pair.toLowerCase().includes(t) ||
        market.baseAsset.toLowerCase().includes(t) ||
        market.quoteAsset.toLowerCase().includes(t),
    );
  }, [searchTerm, marketsData]);

  const combinedRecentlyViewed = useMemo(() => {
    if (searchTerm.trim().length > 0) return [];

    const combined: Array<{ type: 'token' | 'market'; data: Token | Market }> = [];

    const tokensToUse = tokens.length > 0 ? tokens : recentlyViewed;
    tokensToUse.forEach((token) => {
      combined.push({ type: 'token', data: token });
    });

    recentlyViewedMarkets.forEach((market) => {
      combined.push({ type: 'market', data: market });
    });

    return combined;
  }, [tokens, recentlyViewed, recentlyViewedMarkets, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const showMarkets = searchTerm.trim().length >= 1 && filteredMarkets.length > 0;
  const showTokens = searchTerm.trim().length > 0 && filteredTokens.length > 0;
  const showCombinedRecent = searchTerm.trim().length === 0 && combinedRecentlyViewed.length > 0;

  return (
    <div className="meme-search-overlay" onClick={() => setpopup(0)}>
      <div className="meme-search-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="meme-search-bar">
          <input
            type="text"
            className="meme-search-input"
            placeholder="Search by name, ticker, or CA..."
            value={searchTerm}
            onChange={handleSearchChange}
            autoFocus
          />
                 <div className="explorer-quickbuy-container">
            <img className="explorer-quick-buy-search-icon" src={lightning} alt="" />
            <input
              type="text"
              placeholder="0.0"
              value={quickAmounts?.new}
              onChange={(e) => setQuickAmount?.('new', e.target.value)}
              onFocus={handleInputFocus}
              className="explorer-quickbuy-input"
            />
            <img className="quickbuy-monad-icon" src={monadicon} />
            <div className="explorer-preset-controls">
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  className={`explorer-preset-pill ${activePresets?.new === p ? 'active' : ''}`}
                  onClick={() => setActivePreset?.('new', p)}
                >
                  P{p}
                </button>
              ))}
            </div>
          </div>
        </div>
        {searchTerm.trim().length >= 2 && (loading || isSearching) ? (
          <div className="meme-search-results">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="meme-search-skeleton-container">
                <div className="meme-search-skeleton-row">
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
                      <div className="meme-search-skeleton-button"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {error && <div className="meme-search-error">{error}</div>}

            {showCombinedRecent && (
              <div className="meme-search-section">
                <div className="meme-search-section-header">History</div>
              </div>
            )}

            {searchTerm.trim().length >= 2 && (loading || isSearching) && (
              <div className="meme-search-loading">Searching...</div>
            )}

            <div className="meme-search-list">
              {showCombinedRecent && (
                <>
                  {combinedRecentlyViewed.map((item, index) => {
                    if (item.type === 'market') {
                      const market = item.data as Market;
                      const marketName = tokendict?.[market?.baseAddress]?.name;

                      return (
                        <div
                          key={`market-${index}`}
                          className="meme-token-row"
                          onClick={() => handleMarketClick(market)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="meme-token-content">
                            <div className="meme-token-avatar">
                              <img
                                src={market.image}
                                alt={market.baseAsset}
                                className="meme-token-image"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const placeholder = e.currentTarget.parentElement?.querySelector(
                                    '.meme-search-avatar-placeholder',
                                  ) as HTMLElement;
                                  if (placeholder) placeholder.style.display = 'flex';
                                }}
                              />
                              <div className="meme-search-avatar-placeholder">
                                {market.baseAsset?.slice(0, 2) || '??'}
                              </div>
                            </div>

                            <div className="meme-market-token-header">
                              <div className="meme-token-meta">
                                <div className="meme-search-market-name">{marketName}</div>
                                <h3 className="meme-search-token-symbol">
                                  {market.baseAsset}/{market.quoteAsset}
                                </h3>
                              </div>
                            </div>

                            <div className="meme-token-stats">
                              <div className="meme-search-stat-item">
                                <p className="meme-search-stat-label">P</p>
                                <span className="meme-search-stat-value">{market.currentPrice}</span>
                              </div>
                              <div className="meme-search-stat-item">
                                <p className="meme-search-stat-label">24h</p>
                                <span className="meme-search-stat-value">{market.priceChange}</span>
                              </div>
                              <div className="meme-search-stat-item">
                                <p className="meme-search-stat-label">Vol</p>
                                <span className="meme-search-stat-value">{market.volume}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      const token = item.data as Token;
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
                          key={`token-${index}`}
                          className="meme-token-row"
                          onClick={() => handleTokenClick(token)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="meme-token-content">
                            <div
                              className={`meme-search-token-avatar-container ${
                                status === 'graduated' ? 'meme-search-graduated' : ''
                              }`}
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
                                        const placeholder = e.currentTarget.parentElement?.querySelector(
                                          '.meme-search-avatar-placeholder',
                                        ) as HTMLElement;
                                        if (placeholder) placeholder.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className="meme-search-avatar-placeholder">
                                    {token.symbol?.slice(0, 2) || '??'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="meme-token-header">
                              <div className="meme-token-meta">
                                <h3 className="meme-search-token-symbol">{token.symbol}</h3>
                                <div
                                  className="meme-search-token-name-container"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(token.tokenAddress);
                                  }}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <Tooltip content="Click to copy address">
                                    <p className="meme-search-token-name">{token.name}</p>
                                    <button
                                      className="meme-search-copy-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(token.tokenAddress);
                                      }}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                                      </svg>
                                    </button>
                                  </Tooltip>
                                </div>
                              </div>

                              <div className="meme-token-details">
                                <p className="meme-search-token-age">{formatTimeAgo(token.created)}</p>
                                <div className="meme-social-links">
                                  {!!token.twitterHandle && (
                                    <TwitterHover url={token.twitterHandle}>
                                      <a
                                        className="meme-avatar-btn"
                                        href={token.twitterHandle}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <img src={avatar} alt="Twitter" className="avatar-icon" />
                                      </a>
                                    </TwitterHover>
                                  )}

                                  {!!token.telegramHandle && (
                                    <a
                                      className="meme-telegram-btn"
                                      href={token.telegramHandle}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <img src={telegram} alt="Telegram" />
                                    </a>
                                  )}

                                  {!!token.discordHandle && (
                                    <a
                                      className="meme-discord-btn"
                                      href={token.discordHandle}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <img src={discord} alt="Discord" />
                                    </a>
                                  )}

                                  {!!token.website && (
                                    <a
                                      className="meme-website-btn"
                                      href={token.website}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                      </svg>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="meme-token-stats">
                              <div className="meme-search-stat-item">
                                <p className="meme-search-stat-label">MC</p>
                                <span className="meme-search-stat-value">{formatPrice(token.marketCap)}</span>
                              </div>
                              <div className="meme-search-stat-item">
                                <p className="meme-search-stat-label">V</p>
                                <span className="meme-search-stat-value">{formatPrice(token.volume24h)}</span>
                              </div>
                              <div className="meme-search-stat-item">
                                <p className="meme-search-stat-label">L</p>
                                <span className="meme-search-stat-value">{formatPrice(69000)}</span>
                              </div>
                            </div>

                            <button
                              className={`meme-price-badge quickbuy-button ${
                                buyingTokens.has(token.id) ? 'loading' : ''
                              }`}
                              onClick={(e) => handleQuickBuy(token, e)}
                              disabled={buyingTokens.has(token.id) || !onQuickBuy}
                            >
                              {buyingTokens.has(token.id) ? (
                                <>
                                  <div className="quickbuy-loading-spinner"></div>
                                  <img
                                    className="explorer-quick-buy-icon"
                                    src={lightning}
                                    style={{ opacity: 0 }}
                                    alt=""
                                  />
                                  <span style={{ opacity: 0 }}>{getCurrentQuickBuyAmount()} MON</span>
                                </>
                              ) : (
                                <>
                                  <img className="explorer-quick-buy-icon" src={lightning} alt="" />
                                  {getCurrentQuickBuyAmount()} MON
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    }
                  })}
                </>
              )}

              {showMarkets && (
                <>
                  <div className="meme-search-section">
                    <div className="meme-search-section-header">Markets</div>
                  </div>
                  {filteredMarkets.map((market) => {
                    const marketName = tokendict?.[market?.baseAddress]?.name;

                    return (
                      <div
                        key={market.address}
                        className="meme-token-row"
                        onClick={() => handleMarketClick(market)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="meme-token-content">
                          <div className="meme-token-avatar">
                            <img
                              src={market.image}
                              alt={market.baseAsset}
                              className="meme-token-image"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const placeholder = e.currentTarget.parentElement?.querySelector(
                                  '.meme-search-avatar-placeholder',
                                ) as HTMLElement;
                                if (placeholder) placeholder.style.display = 'flex';
                              }}
                            />
                            <div className="meme-search-avatar-placeholder">
                              {market.baseAsset?.slice(0, 2) || '??'}
                            </div>
                          </div>

                          <div className="meme-market-token-header">
                            <div className="meme-token-meta">
                              <div className="meme-search-market-name">{marketName}</div>
                              <h3 className="meme-search-token-symbol">
                                {market.baseAsset}/{market.quoteAsset}
                              </h3>
                            </div>
                          </div>

                          <div className="meme-token-stats">
                            <div className="meme-search-stat-item">
                              <p className="meme-search-stat-label">P</p>
                              <span className="meme-search-stat-value">{market.currentPrice}</span>
                            </div>
                            <div className="meme-search-stat-item">
                              <p className="meme-search-stat-label">24h</p>
                              <span className="meme-search-stat-value">{market.priceChange}</span>
                            </div>
                            <div className="meme-search-stat-item">
                              <p className="meme-search-stat-label">Vol</p>
                              <span className="meme-search-stat-value">{market.volume}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {showTokens && (
                <>
                  {showMarkets && (
                    <div className="meme-search-section">
                      <div className="meme-search-section-header">Tokens</div>
                    </div>
                  )}
                  {!showMarkets && searchTerm.trim().length >= 2 && !(loading || isSearching) && (
                    <div className="meme-search-section">
                      <div className="meme-search-section-header">Results</div>
                    </div>
                  )}

                  {filteredTokens.map((token) => {
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
                          <div
                            className={`meme-search-token-avatar-container ${
                              status === 'graduated' ? 'meme-search-graduated' : ''
                            }`}
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
                                      const placeholder = e.currentTarget.parentElement?.querySelector(
                                        '.meme-search-avatar-placeholder',
                                      ) as HTMLElement;
                                      if (placeholder) placeholder.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className="meme-search-avatar-placeholder">
                                  {token.symbol?.slice(0, 2) || '??'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="meme-token-header">
                            <div className="meme-token-meta">
                              <h3 className="meme-search-token-symbol">{token.symbol}</h3>
                              <div
                                className="meme-search-token-name-container"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(token.tokenAddress);
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                <Tooltip content="Click to copy address">
                                  <p className="meme-search-token-name">{token.name}</p>
                                  <button
                                    className="meme-search-copy-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(token.tokenAddress);
                                    }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                                    </svg>
                                  </button>
                                </Tooltip>
                              </div>
                            </div>

                            <div className="meme-token-details">
                              <p className="meme-search-token-age">{formatTimeAgo(token.created)}</p>
                              <div className="meme-social-links">
                                {!!token.twitterHandle && (
                                  <TwitterHover url={token.twitterHandle}>
                                    <a
                                      className="meme-avatar-btn"
                                      href={token.twitterHandle}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <img src={avatar} alt="Twitter" className="avatar-icon" />
                                    </a>
                                  </TwitterHover>
                                )}

                                {!!token.telegramHandle && (
                                  <a
                                    className="meme-telegram-btn"
                                    href={token.telegramHandle}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <img src={telegram} alt="Telegram" />
                                  </a>
                                )}

                                {!!token.discordHandle && (
                                  <a
                                    className="meme-discord-btn"
                                    href={token.discordHandle}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <img src={discord} alt="Discord" />
                                  </a>
                                )}

                                {!!token.website && (
                                  <a
                                    className="meme-website-btn"
                                    href={token.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                    </svg>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="meme-token-stats">
                            <div className="meme-search-stat-item">
                              <p className="meme-search-stat-label">MC</p>
                              <span className="meme-search-stat-value">{formatPrice(token.marketCap)}</span>
                            </div>
                            <div className="meme-search-stat-item">
                              <p className="meme-search-stat-label">V</p>
                              <span className="meme-search-stat-value">{formatPrice(token.volume24h)}</span>
                            </div>
                            <div className="meme-search-stat-item">
                              <p className="meme-search-stat-label">L</p>
                              <span className="meme-search-stat-value">{formatPrice(69000)}</span>
                            </div>
                          </div>

                          <button
                            className={`meme-price-badge quickbuy-button ${
                              buyingTokens.has(token.id) ? 'loading' : ''
                            }`}
                            onClick={(e) => handleQuickBuy(token, e)}
                            disabled={buyingTokens.has(token.id) || !onQuickBuy}
                          >
                            {buyingTokens.has(token.id) ? (
                              <>
                                <div className="quickbuy-loading-spinner"></div>
                                <img
                                  className="explorer-quick-buy-icon"
                                  src={lightning}
                                  style={{ opacity: 0 }}
                                  alt=""
                                />
                                <span style={{ opacity: 0 }}>{getCurrentQuickBuyAmount()} MON</span>
                              </>
                            ) : (
                              <>
                                <img className="explorer-quick-buy-icon" src={lightning} alt="" />
                                {getCurrentQuickBuyAmount()} MON
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {!showMarkets && !showTokens && !showCombinedRecent && (
                <div className="meme-no-results">
                  {searchTerm.trim().length === 0 &&
                    recentlyViewed.length === 0 &&
                    recentlyViewedMarkets.length === 0 && (
                      <p>No recently viewed tokens or markets</p>
                    )}
                  {searchTerm.trim().length >= 2 && !loading && !isSearching && (
                    <p>No markets or tokens found matching "{searchTerm}"</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MemeSearch;