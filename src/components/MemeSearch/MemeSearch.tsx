import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import './MemeSearch.css';

const SUBGRAPH_URL = 'https://gateway.thegraph.com/api/b9cc5f58f8ad5399b2c4dd27fa52d881/subgraphs/id/BJKD3ViFyTeyamKBzC1wS7a3XMuQijvBehgNaSBb197e';

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
}

const formatPrice = (p: number) => {
  if (p >= 1e12) return `${(p / 1e12).toFixed(1)}T MON`;
  if (p >= 1e9) return `${(p / 1e9).toFixed(1)}B MON`;
  if (p >= 1e6) return `${(p / 1e6).toFixed(1)}M MON`;
  if (p >= 1e3) return `${(p / 1e3).toFixed(1)}K MON`;
  return `${p.toFixed(2)} MON`;
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

const sanitizeUrl = (s?: string) => {
  if (!s) return '';
  const u = s.startsWith('http') ? s : `https://${s}`;
  try {
    return new URL(u).toString();
  } catch {
    return '';
  }
};

const isTwitter = (u: string) => /https:\/\/(x\.com|twitter\.com)\//i.test(u);
const isTelegram = (u: string) => /https:\/\/t\.me\//i.test(u);
const isDiscord = (u: string) => /https:\/\/(discord\.gg|discord\.com)\//i.test(u);

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

type HydrationInfo = { cid?: string; s1?: string; s2?: string; s3?: string };
const metaCache = new Map<string, any>();
const hydratedIds = new Set<string>();

const MemeSearch: React.FC<MemeSearchProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const hydrateMapRef = useRef<Map<string, HydrationInfo>>(new Map());

  const mapGraphTokenToUi = useCallback((g: any): Token => {
    console.log(g);
    const price = Number(g.lastPriceNativePerTokenWad || 0) / 1e18;
    hydrateMapRef.current.set(g.id.toLowerCase(), { cid: g.metadataCID, s1: g.social1, s2: g.social2, s3: g.social3 });
    return {
      id: g.id.toLowerCase(),
      tokenAddress: g.id.toLowerCase(),
      dev: g.creator?.id || '',
      name: g.name || '',
      symbol: g.symbol || '',
      image: '',
      price,
      marketCap: price * 1e9,
      change24h: 0,
      volume24h: Number(g.volumeNative) / 1e18,
      website: '',
      twitterHandle: '',
      progress: price * 1e9 / 250,
      created: Number(g.timestamp || 0),
      bondingAmount: 0,
      volumeDelta: 0,
      telegramHandle: '',
      discordHandle: '',
      description: '',
    };
  }, []);

  const pLimitAll = async <T,>(
    items: T[],
    limit: number,
    worker: (item: T) => Promise<void>
  ) => {
    const queue = [...items];
    const runners: Promise<void>[] = [];
    for (let i = 0; i < Math.min(limit, queue.length); i++) {
      runners.push(
        (async function run() {
          while (queue.length) {
            const it = queue.shift()!;
            await worker(it);
          }
        })()
      );
    }
    await Promise.all(runners);
  };

  const extractSocials = (info: HydrationInfo, meta: any) => {
    const raw = [sanitizeUrl(info.s1), sanitizeUrl(info.s2), sanitizeUrl(info.s3)].filter(Boolean);
    let twitter = raw.find(isTwitter) || sanitizeUrl(meta?.twitter);
    if (twitter) raw.splice(raw.indexOf(raw.find(isTwitter) ?? ''), 1);

    let telegram = raw.find(isTelegram) || sanitizeUrl(meta?.telegram);
    if (telegram) raw.splice(raw.indexOf(raw.find(isTelegram) ?? ''), 1);

    let discord = raw.find(isDiscord) || sanitizeUrl(meta?.discord);
    if (discord) raw.splice(raw.indexOf(raw.find(isDiscord) ?? ''), 1);

    const website = sanitizeUrl(meta?.website) || raw[0] || '';

    return { twitter, telegram, discord, website };
  };

  const hydrateTokens = useCallback(
    async (base: Token[], reqId: number, signal: AbortSignal) => {
      const work = base
        .filter(t => !hydratedIds.has(t.id))
        .map(t => ({ id: t.id, info: hydrateMapRef.current.get(t.id) }));

      if (!work.length) return;

      const updates: Record<string, Partial<Token>> = {};

      await pLimitAll(work, 6, async ({ id, info }) => {
        if (signal.aborted || reqId !== reqIdRef.current) return;
        if (!info?.cid) {
          updates[id] = { image: '', website: '', twitterHandle: '', telegramHandle: '', discordHandle: '' };
          hydratedIds.add(id);
          return;
        }

        try {
          let meta = metaCache.get(info.cid);
          if (!meta) {
            const res = await fetch(info.cid, { signal });
            meta = res.ok ? await res.json() : {};
            metaCache.set(info.cid, meta);
          }
          const { twitter, telegram, discord, website } = extractSocials(info, meta);
          updates[id] = {
            image: meta?.image || '',
            website,
            twitterHandle: twitter || '',
            telegramHandle: telegram || '',
            discordHandle: discord || '',
            description: meta?.description || '',
          };
        } catch {
          updates[id] = { image: '', website: '', twitterHandle: '', telegramHandle: '', discordHandle: '' };
        } finally {
          hydratedIds.add(id);
        }
      });

      if (reqId === reqIdRef.current && !signal.aborted && Object.keys(updates).length) {
        setTokens(prev =>
          prev.map(t => (updates[t.id] ? { ...t, ...updates[t.id] } : t))
        );
      }
    },
    []
  );

  const fetchLatest = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const reqId = ++reqIdRef.current;

    try {
      setLoading(true);
      setError(null);

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

      if (reqId !== reqIdRef.current) return;
      const rows = json?.data?.launchpadTokens ?? [];

      hydrateMapRef.current = new Map();
      const base = rows.map(mapGraphTokenToUi);

      setTokens(base);
      hydrateTokens(base, reqId, controller.signal);
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError('Failed to load search results.');
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [mapGraphTokenToUi, hydrateTokens]);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (tokens.length === 0 || searchTerm.trim().length >= 3) fetchLatest();
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isOpen, searchTerm]);

  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
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
        <div className="meme-search-bar">
          <input
            type="text"
            placeholder="Search by name, ticker, or CA..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="meme-search-input"
          />
        </div>

        {error && <div className="meme-search-error">{error}</div>}
        {loading && tokens.length === 0 && (
          <div className="meme-search-loading">Loading latest…</div>
        )}
        {!loading && searchTerm.length > 0 && searchTerm.length < 3 && (
          <div className="meme-search-hint">Type 3+ characters to refresh results.</div>
        )}

        <div className="meme-search-list">
          {filteredTokens.length > 0 ? (
            filteredTokens.map((token) => {
              const status = getTokenStatus(token.progress);
              return (
                <div key={token.id} className="meme-token-row">
                  <div className="meme-token-content">
                    <div className="meme-token-info">
                      <div className="meme-token-avatar">
                        {token.image ? (
                          <img
                            src={token.image}
                            alt={token.symbol}
                            className="meme-token-image"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="meme-avatar-placeholder" style={{ display: token.image ? 'none' : 'flex' }}>
                          {token.symbol?.slice(0, 2) || '??'}
                        </div>
                      </div>

                      <div className="meme-token-details">
                        <div className="meme-token-header">
                          <h3 className="meme-search-token-name">{token.name || token.symbol || token.id.slice(0, 6)}</h3>
                          <span className={`meme-status-badge status-${status}`}>
                            {status === 'new' ? 'NEW' : status === 'graduating' ? 'GRADUATING' : 'GRADUATED'}
                          </span>
                        </div>

                        <div className="meme-token-meta">
                          <p className="meme-search-token-age">{formatTimeAgo(token.created)}</p>
                          <p className="meme-token-address">
                            {token.tokenAddress.slice(0, 6)}...{token.tokenAddress.slice(-4)}
                          </p>
                        </div>

                        <div className="meme-social-links">
                          {!!token.twitterHandle && (
                            <a href={token.twitterHandle} target="_blank" rel="noopener noreferrer" className="meme-social-link" onClick={e => e.stopPropagation()}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                              </svg>
                            </a>
                          )}
                          {!!token.telegramHandle && (
                            <a href={token.telegramHandle} target="_blank" rel="noopener noreferrer" className="meme-social-link" onClick={e => e.stopPropagation()}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                              </svg>
                            </a>
                          )}
                          {!!token.discordHandle && (
                            <a href={token.discordHandle} target="_blank" rel="noopener noreferrer" className="meme-social-link" onClick={e => e.stopPropagation()}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152...Z" />
                              </svg>
                            </a>
                          )}
                          {!!token.website && (
                            <a href={token.website} target="_blank" rel="noopener noreferrer" className="meme-social-link" onClick={e => e.stopPropagation()}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10..." />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="meme-token-middle">
                      <div className="meme-bonding-info">
                        <div className="meme-bonding-label">Progress: {token.progress.toFixed(2)}%</div>
                        <div className="meme-bonding-bar">
                          <div
                            className="meme-bonding-fill"
                            style={{
                              width: `${token.progress}%`,
                              backgroundColor:
                                token.progress < 25 ? '#ee5b5b' :
                                  token.progress < 50 ? '#f59e0b' :
                                    token.progress < 75 ? '#eab308' : '#43e17d'
                            }}
                          />
                        </div>
                        <div className="meme-bonding-amount">Bonding: {token.bondingAmount}</div>
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
              {loading ? <p>Loading...</p> : <p>No tokens found matching "{searchTerm}"</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemeSearch;
