import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import './MemeSearch.css';
import { TwitterHover } from '../TwitterHover/TwitterHover';
import telegram from '../../assets/telegram.png';
import discord from '../../assets/discord1.svg';
import avatar from '../../assets/avatar.png';
import tweet from '../../assets/tweet.png';
import lightning from '../../assets/flash.png';
import monadicon from '../../assets/monad.svg';
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

const calculateBondingPercentage = (marketCap: number) => {
    const bondingPercentage = Math.min((marketCap / 10000) * 100, 100);
    return bondingPercentage;
};

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
    buyPresets
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [buyingTokens, setBuyingTokens] = useState<Set<string>>(new Set());

    // Function to get the current quick buy amount
    const getCurrentQuickBuyAmount = useCallback(() => {
        // Use custom amount if available, otherwise use preset amount
        const customAmount = quickAmounts?.new;
        if (customAmount && customAmount.trim() !== '') {
            return customAmount;
        }

        // Fall back to preset amount
        const activePreset = activePresets?.new || 1;
        const presetAmount = buyPresets?.[activePreset]?.amount;
        return presetAmount || '5'; // Default to '5' if nothing is configured
    }, [quickAmounts, activePresets, buyPresets]);

    const handleQuickBuy = async (token: Token, event: React.MouseEvent) => {
        event.stopPropagation();

        if (!onQuickBuy) return;

        setBuyingTokens(prev => new Set(prev).add(token.id));

        try {
            const amount = getCurrentQuickBuyAmount();
            await onQuickBuy(token, amount); // Use dynamic amount instead of hardcoded "5"
        } catch (error) {
            console.error('Quick buy failed:', error);
        } finally {
            setBuyingTokens(prev => {
                const newSet = new Set(prev);
                newSet.delete(token.id);
                return newSet;
            });
        }
    };

    const handleTokenClick = (token: Token) => {
        if (onTokenClick) {
            onTokenClick(token);
            onClose();
        }
    };
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

    // If no tokens loaded yet, fetch immediately without debounce
    if (tokens.length === 0) {
        fetchLatest();
        return;
    }

    debounceRef.current = setTimeout(() => {
        if (searchTerm.trim().length >= 3) fetchLatest();
    }, 250);

    return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
    };
}, [isOpen, searchTerm, fetchLatest, tokens.length]);
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
                <div className="meme-top-row">
                    <div className="meme-search-filters">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="meme-search-time-active"><path d="M12 6v6l4-2" /><circle cx="12" cy="12" r="10" /></svg>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="meme-search-market-cap"><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M7 11.207a.5.5 0 0 1 .146-.353l2-2a.5.5 0 0 1 .708 0l3.292 3.292a.5.5 0 0 0 .708 0l4.292-4.292a.5.5 0 0 1 .854.353V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z" /></svg>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="meme-search-liquidity"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" /><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" /></svg>
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
                {error && <div className="meme-search-error">{error}</div>}
                {loading && (
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
                                                                    if (placeholder) {
                                                                        placeholder.style.display = 'flex';
                                                                    }
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
                            {loading ? <p></p> : <p>No tokens found matching "{searchTerm}"</p>}
                        </div>
                    )}
                </div>
                </div>
            </div>
        </div>
    );
};

export default MemeSearch;