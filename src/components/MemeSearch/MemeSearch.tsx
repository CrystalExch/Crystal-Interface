import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Search, Trash2, Clock, TrendingUp, BarChart3, Droplet, Users, ChevronDown, ChevronUp } from 'lucide-react';
import './MemeSearch.css';
import { TwitterHover } from '../TwitterHover/TwitterHover';
import telegram from '../../assets/telegram.png';
import discord from '../../assets/discord1.svg';
import avatar from '../../assets/avatar.png';
import tweet from '../../assets/tweet.png';
import communities from '../../assets/community.png';
import lightning from '../../assets/flash.png';
import monadicon from '../../assets/monad.svg';
import walleticon from '../../assets/wallet_icon.svg';
import { showLoadingPopup, updatePopup } from '../MemeTransactionPopup/MemeTransactionPopupManager';
import { createPortal } from 'react-dom';
import { settings as appSettings } from '../../settings';
import { TokenRow } from '../TokenExplorer/TokenExplorer';

const BACKEND_BASE_URL = 'https://api.crystal.exchange';
const TOTAL_SUPPLY = 1e9;

interface SubWallet {
    address: string;
    privateKey: string;
}

interface Token {
    id: string;
    dev: string;
    name: string;
    symbol: string;
    image: string;
    price: number;
    marketCap: number;
    change24h: number;
    volume24h: number;
    mini: any;
    holders: number;
    proTraders: number;
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
    graduatedTokens: number;
    launchedTokens: number;
    trades?: any;
    bondingPercentage: number;
    source?: 'crystal' | 'nadfun';
    market?: string;
    circulatingSupply: number;
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
    activechain: number;
    subWallets?: Array<SubWallet>;
    selectedWallets?: Set<string>;
    setSelectedWallets?: (wallets: Set<string>) => void;
    walletTokenBalances?: Record<string, any>;
    address: string;
    createSubWallet?: any;
    activeWalletPrivateKey?: string;
    onHideToken?: (tokenId: string) => void;
    onBlacklistToken?: (token: any) => void;
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
                top = rect.top + scrollY - tooltipRect.height - 20;
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
            className="meme-search-tooltip-container"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {shouldRender &&
                createPortal(
                    <div
                        ref={tooltipRef}
                        className={`meme-search-tooltip meme-search-tooltip-${position} ${isVisible ? 'meme-search-tooltip-entering' : isLeaving ? 'meme-search-tooltip-leaving' : ''}`}
                        style={{
                            position: 'absolute',
                            top: `${tooltipPosition.top}px`,
                            left: `${tooltipPosition.left}px`,
                            transform: `${position === 'top' || position === 'bottom'
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
                        <div className="meme-search-tooltip-content">{content}</div>
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

const InteractiveTooltip: React.FC<{
    content: React.ReactNode;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    offset?: number;
}> = ({ content, children, position = 'top', offset = 10 }) => {
    const [shouldRender, setShouldRender] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
                top = rect.top + scrollY - tooltipRect.height - offset - 40;
                left = rect.left + scrollX + rect.width / 2;
                break;
            case 'bottom':
                top = rect.bottom + scrollY + offset;
                left = rect.left + scrollX + rect.width / 2;
                break;
            case 'left':
                top = rect.top + scrollY + rect.height / 2;
                left = rect.left + scrollX - tooltipRect.width - offset;
                break;
            case 'right':
                top = rect.top + scrollY + rect.height / 2;
                left = rect.right + scrollX + offset;
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
    }, [position, offset]);

    const handleMouseEnter = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setShouldRender(true);
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, 10);
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => {
                setShouldRender(false);
            }, 150);
        }, 100);
    }, []);

    const handleTooltipMouseEnter = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(true);
    }, []);

    const handleTooltipMouseLeave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => {
                setShouldRender(false);
            }, 150);
        }, 100);
    }, []);

    useEffect(() => {
        if (shouldRender) {
            updatePosition();
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [shouldRender, updatePosition]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="meme-search-tooltip-container"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {shouldRender &&
                createPortal(
                    <div
                        ref={tooltipRef}
                        className={`meme-search-tooltip meme-search-tooltip-${position} ${isVisible ? 'meme-search-tooltip-entering' : 'meme-search-tooltip-leaving'}`}
                        style={{
                            position: 'absolute',
                            top: `${tooltipPosition.top}px`,
                            left: `${tooltipPosition.left}px`,
                            transform: `${position === 'top' || position === 'bottom'
                                ? 'translateX(-50%)'
                                : position === 'left' || position === 'right'
                                    ? 'translateY(-50%)'
                                    : 'none'
                                } scale(${isVisible ? 1 : 0})`,
                            opacity: isVisible ? 1 : 0,
                            zIndex: 9999,
                            pointerEvents: 'auto',
                            transition:
                                'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                            willChange: 'transform, opacity',
                        }}
                        onMouseEnter={handleTooltipMouseEnter}
                        onMouseLeave={handleTooltipMouseLeave}
                    >
                        <div className="meme-search-tooltip-content">{content}</div>
                    </div>,
                    document.body,
                )}
        </div>
    );
};

const DISPLAY_DEFAULTS: any = {
    metricSize: 'small',
    quickBuySize: 'large',
    quickBuyStyle: 'color',
    ultraStyle: 'default',
    ultraColor: 'color',
    hideSearchBar: false,
    noDecimals: false,
    hideHiddenTokens: false,
    squareImages: true,
    progressBar: true,
    spacedTables: false,
    colorRows: false,
    columnOrder: ['new', 'graduating', 'graduated'],
    hiddenColumns: [],
    quickBuyClickBehavior: 'nothing',
    secondQuickBuyEnabled: false,
    secondQuickBuyColor: '#606BCC',
    visibleRows: {
      marketCap: true,
      volume: true,
      fees: true,
      tx: true,
      socials: true,
      holders: true,
      proTraders: false,
      devMigrations: true,
      top10Holders: true,
      devHolding: true,
      fundingTime: false,
      snipers: false,
      insiders: true,
      dexPaid: false,
    },
    metricColoring: true,
    metricColors: {
      marketCap: { range1: '#ffffff', range2: '#d8dcff', range3: '#82f9a4ff' },
      volume: { range1: '#ffffff', range2: '#ffffff', range3: '#ffffff' },
      holders: { range1: '#ffffff', range2: '#ffffff', range3: '#ffffff' },
    },
    metricThresholds: {
      marketCap: { range1: 30000, range2: 150000 },
      volume: { range1: 1000, range2: 2000 },
      holders: { range1: 10, range2: 50 },
    },
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
    activechain,
    subWallets = [],
    selectedWallets = new Set(),
    setSelectedWallets,
    walletTokenBalances = {},
    address,
    createSubWallet,
    activeWalletPrivateKey,
}) => {
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

    const extractTwitterUsername = (url: string): string => {
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([^\/\?]+)/);
        return match ? match[1] : url;
    };

    const handleTokenHover = useCallback((tokenId: string) => {
        setHoveredToken(tokenId);
    }, []);

    const handleTokenLeave = useCallback(() => {
        setHoveredToken(null);
    }, []);

    const handleImageHover = useCallback((tokenId: string) => {
        setHoveredImage(tokenId);
    }, []);

    const handleImageLeave = useCallback(() => {
        setHoveredImage(null);
    }, []);

    const handleHideToken = useCallback((tokenId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setHiddenTokens(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tokenId)) {
                newSet.delete(tokenId);
            } else {
                newSet.add(tokenId);
            }
            return newSet;
        });
    }, []);

    const handleBlacklistToken = useCallback((token: any, event: React.MouseEvent) => {
        event.stopPropagation();
        // For now, just console log or add to parent callback if needed
        console.log('Blacklist token:', token);
    }, []);

    const [searchTerm, setSearchTerm] = useState('');
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [buyingTokens, setBuyingTokens] = useState<Set<string>>(new Set());
    const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
    const walletDropdownRef = useRef<HTMLDivElement>(null);

    type SortType = 'time' | 'marketCap' | 'volume' | 'liquidity' | 'holders';
    type SortDirection = 'asc' | 'desc';
    const [sortType, setSortType] = useState<SortType>('volume');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const isWalletActive = (privateKey: string) => {
        return activeWalletPrivateKey === privateKey;
    };

    const formatNumberWithCommas = (value: number, decimals: number = 2): string => {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    };

    const toggleWalletSelection = useCallback(
        (address: string) => {
            if (!setSelectedWallets) return;

            const newSelected = new Set(selectedWallets);
            if (newSelected.has(address)) {
                newSelected.delete(address);
            } else {
                newSelected.add(address);
            }
            setSelectedWallets(newSelected);
        },
        [selectedWallets, setSelectedWallets],
    );

    const selectAllWallets = useCallback(() => {
        if (!setSelectedWallets) return;
        const allAddresses = new Set(subWallets.map((w) => w.address));
        setSelectedWallets(allAddresses);
    }, [subWallets, setSelectedWallets]);

    const unselectAllWallets = useCallback(() => {
        if (!setSelectedWallets) return;
        setSelectedWallets(new Set());
    }, [setSelectedWallets]);

    const selectAllWithBalance = useCallback(() => {
        if (!setSelectedWallets) return;
        const walletsWithBalance = subWallets
            .filter((wallet) => {
                const balance = getWalletBalance(wallet.address);
                return balance > 0;
            })
            .map((w) => w.address);
        setSelectedWallets(new Set(walletsWithBalance));
    }, [subWallets, setSelectedWallets]);

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
    const [hoveredToken, setHoveredToken] = useState<string | null>(null);
    const [hoveredImage, setHoveredImage] = useState<string | null>(null);
    const [hiddenTokens, setHiddenTokens] = useState<Set<string>>(new Set());

    const getWalletBalance = useCallback(
        (address: string): number => {
            const balances = walletTokenBalances[address];
            if (!balances) return 0;

            const ethAddress = appSettings.chainConfig[activechain]?.eth;
            if (!ethAddress) return 0;

            const balance = balances[ethAddress];
            if (!balance) return 0;

            return Number(balance) / 10 ** 18;
        },
        [walletTokenBalances, activechain],
    );

    const getWalletTokenCount = useCallback(
        (address: string): number => {
            const balanceData = walletTokenBalances[address];
            if (!balanceData || !Array.isArray(balanceData)) return 0;
            return balanceData.filter((token: any) => parseFloat(token.balance) > 0).length;
        },
        [walletTokenBalances],
    );

    const getWalletName = (address: string, index: number): string => {
        const savedName = localStorage.getItem(`wallet_name_${address}`);
        return savedName || `Wallet ${index + 1}`;
    };

    const saveSearchHistory = (history: string[]) => {
        try {
            localStorage.setItem('crystal_meme_search_history', JSON.stringify(history));
        } catch { }
    };

    const saveRecentlyViewed = (ts: Token[]) => {
        try {
            localStorage.setItem('crystal_meme_recently_viewed', JSON.stringify(ts));
        } catch { }
    };

    const saveRecentlyViewedMarkets = (markets: Market[]) => {
        try {
            localStorage.setItem('crystal_meme_recently_viewed_markets', JSON.stringify(markets));
        } catch { }
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

    const clearHistory = () => {
        setTokens([]);
        setRecentlyViewed([]);
        setRecentlyViewedMarkets([]);
        localStorage.removeItem('crystal_meme_search_history');
        localStorage.removeItem('crystal_meme_recently_viewed');
        localStorage.removeItem('crystal_meme_recently_viewed_markets');
    };

    const handleSortChange = (newSortType: SortType) => {
        if (sortType === newSortType) {
        } else {
            setSortType(newSortType);
            setSortDirection('desc');
        }
    };

    const sortItems = <T extends Token | Market>(items: T[], type: SortType, direction: SortDirection): T[] => {
        const sorted = [...items].sort((a, b) => {
            let aValue: number = 0;
            let bValue: number = 0;

            if ('marketCap' in a && 'marketCap' in b) {
                // Sorting Tokens
                switch (type) {
                    case 'time':
                        aValue = a.created || 0;
                        bValue = b.created || 0;
                        break;
                    case 'marketCap':
                        aValue = a.marketCap || 0;
                        bValue = b.marketCap || 0;
                        break;
                    case 'volume':
                        aValue = a.volume24h || 0;
                        bValue = b.volume24h || 0;
                        break;
                    case 'liquidity':
                        aValue = a.bondingAmount || 0;
                        bValue = b.bondingAmount || 0;
                        break;
                    case 'holders':
                        aValue = a.holders || 0;
                        bValue = b.holders || 0;
                        break;
                }
            } else if ('volume' in a && 'volume' in b) {
                // Sorting Markets (basic support)
                switch (type) {
                    case 'volume':
                        aValue = parseFloat(a.volume) || 0;
                        bValue = parseFloat(b.volume) || 0;
                        break;
                    default:
                        return 0;
                }
            }

            return direction === 'asc' ? aValue - bValue : bValue - aValue;
        });

        return sorted;
    };

    const getCurrentQuickBuyAmount = useCallback(() => {
        const customAmount = quickAmounts?.new;
        if (customAmount && customAmount.trim() !== '') return customAmount;
        const activePreset = activePresets?.new || 1;
        const presetAmount = buyPresets?.[activePreset]?.amount;
        return presetAmount || '5';
    }, [quickAmounts, activePresets, buyPresets]);

    const totalSelectedBalance = useMemo(() => {
        if (selectedWallets.size === 0) {
            return getWalletBalance(address);
        }
        return Array.from(selectedWallets).reduce((total, w) => {
            return total + getWalletBalance(w);
        }, 0);
    }, [selectedWallets, getWalletBalance, address]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target as Node)) {
                setIsWalletDropdownOpen(false);
            }
        };

        if (isWalletDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isWalletDropdownOpen]);

    const handleQuickBuy = async (token: Token) => {
        if (!onQuickBuy) return;

        setBuyingTokens((prev) => new Set(prev).add(token.id));
        try {
            const amount = getCurrentQuickBuyAmount();
            await onQuickBuy(token, amount);
        } catch (e) {
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
            dev: (m.creator as string) || '',
            name: (m.name as string) || '',
            symbol: (m.symbol as string) || '',
            image: m.metadata_cid || '',
            description: m.description || '',
            twitterHandle: twitter || '',
            website: website || '',
            discordHandle: discord || '',
            telegramHandle: telegram || '',
            created: createdTimestamp,
            price,
            marketCap: Number(m.marketcap_native_raw ?? 0),
            change24h: 0,
            buyTransactions: Number(m.tx?.buy ?? 0),
            sellTransactions: Number(m.tx?.sell ?? 0),
            volume24h: Number(m.native_volume ?? 0) / 1e18,
            volumeDelta: 0,
            launchedTokens: Number(m.developer_tokens_created ?? 0),
            graduatedTokens: Number(m.developer_tokens_graduated ?? 0),
            holders: holdersRaw,
            proTraders: 0,
            devHolding: devHoldingRaw / 1e27,
            top10Holding: top10HoldingRaw / 1e25,
            bondingPercentage: m.graduationPercentageBps ?? progress,
            progress,
            bondingAmount: 0,
            source: launchpad,
            status: m.migrated == true ? 'graduated' : 'new',
            sniperHolding: 0,
            insiderHolding: 0,
            globalFeesPaid: 0,
            mini: [],
            bundleHolding: 0,
            circulatingSupply: Number(m.circulating_supply ?? 0),
        };
    }, []);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const fetchSearchResults = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            setError(null);
            setLoading(true);
            setIsSearching(true);
            debounceTimerRef.current = setTimeout(async () => {
                const searchQuery = searchTerm.trim();
                const url = `${BACKEND_BASE_URL}/search/query?query=${encodeURIComponent(searchQuery)}&sort=${encodeURIComponent(sortType == 'time' ? 'recent' : sortType == 'volume' ? 'volume_1h' : sortType == 'marketCap' ? 'mc' : 'holders')}`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json',
                    },
                    signal: controller.signal,
                });
    
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
                const json = await res.json();
                const rows = json?.tokens ?? json?.results ?? json ?? [];
    
                const processedTokens = Array.isArray(rows)
                    ? rows.map((row: any) => mapBackendTokenToUi(row))
                    : [];
                if (!controller.signal.aborted) {
                    setTokens(processedTokens);
                    setLoading(false);
                    setIsSearching(false);
                }
                debounceTimerRef.current = null;
            }, 300);
        } catch (e: any) {
            if (e?.name !== 'AbortError') {
                setError('Failed to load search results.');
            }
        }
    }, [searchTerm, sortType]);

    const fetchRecentlyViewedFromBackend = useCallback(
        async (tokens: Token[]) => {
            if (tokens.length === 0) return tokens;

            try {
                return tokens;
            } catch (e) {
                return tokens;
            }
        },
        [],
    );

    useEffect(() => {
        const term = searchTerm.trim();

        if (term.length < 1) {
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
    }, [searchTerm, sortType, fetchSearchResults, fetchRecentlyViewedFromBackend]);

    useEffect(() => {
        if (searchTerm.trim().length < 1 && recentlyViewed.length > 0) {
            fetchRecentlyViewedFromBackend(recentlyViewed).then(setTokens);
        }
    }, [recentlyViewed, searchTerm, fetchRecentlyViewedFromBackend]);

    const filteredTokens = useMemo(() => {
        const t = searchTerm.trim().toLowerCase();
        if (!t) return tokens;

        return tokens.filter(
            (token) =>
                token.name.toLowerCase().includes(t) ||
                token.symbol.toLowerCase().includes(t) ||
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

    const sortedFilteredTokens = useMemo(() => {
        return sortItems(filteredTokens, sortType, sortDirection);
    }, [filteredTokens, sortType, sortDirection]);

    const sortedCombinedRecentlyViewed = useMemo(() => {
        const sorted = [...combinedRecentlyViewed];
        const tokenItems = sorted.filter(item => item.type === 'token');
        const marketItems = sorted.filter(item => item.type === 'market');

        const sortedTokens = sortItems(tokenItems.map(item => item.data as Token), sortType, sortDirection);

        const result: Array<{ type: 'token' | 'market'; data: Token | Market }> = [];
        sortedTokens.forEach(token => result.push({ type: 'token', data: token }));
        marketItems.forEach(item => result.push(item));

        return result;
    }, [combinedRecentlyViewed, sortType, sortDirection]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (value.trim() === '') {
            setError(null);
        }
    };

    const showMarkets = searchTerm.trim().length >= 1 && filteredMarkets.length > 0;
    const showTokens = searchTerm.trim().length > 0 && filteredTokens.length > 0;
    const showCombinedRecent = searchTerm.trim().length === 0 && combinedRecentlyViewed.length > 0;

    return (
        <div className="meme-search-overlay" onClick={() => setpopup(0)}>
            <div className="meme-search-modal" onClick={(e) => e.stopPropagation()}>
                <div className="meme-search-sort-header">
                    <div className="meme-search-sort-icons">
                        <Tooltip content="1h Volume">
                            <button
                                className={`meme-search-sort-button ${sortType === 'volume' ? 'active' : ''}`}
                                onClick={() => handleSortChange('volume')}
                            >
                                <BarChart3 size={14} />
                                {sortType === 'volume' && (
                                    sortDirection === 'desc' ?
                                    <ChevronDown size={11} className="sort-direction-icon" /> :
                                    <ChevronUp size={11} className="sort-direction-icon" />
                                )}
                            </button>
                        </Tooltip>
                        <Tooltip content="Time">
                            <button
                                className={`meme-search-sort-button ${sortType === 'time' ? 'active' : ''}`}
                                onClick={() => handleSortChange('time')}
                            >
                                <Clock size={14} />
                                {sortType === 'time' && (
                                    sortDirection === 'desc' ?
                                    <ChevronDown size={11} className="sort-direction-icon" /> :
                                    <ChevronUp size={11} className="sort-direction-icon" />
                                )}
                            </button>
                        </Tooltip>
                        <Tooltip content="Market Cap">
                            <button
                                className={`meme-search-sort-button ${sortType === 'marketCap' ? 'active' : ''}`}
                                onClick={() => handleSortChange('marketCap')}
                            >
                                <TrendingUp size={14} />
                                {sortType === 'marketCap' && (
                                    sortDirection === 'desc' ?
                                    <ChevronDown size={11} className="sort-direction-icon" /> :
                                    <ChevronUp size={11} className="sort-direction-icon" />
                                )}
                            </button>
                        </Tooltip>
                        <Tooltip content="Holders">
                            <button
                                className={`meme-search-sort-button ${sortType === 'holders' ? 'active' : ''}`}
                                onClick={() => handleSortChange('holders')}
                            >
                                <Users size={14} />
                                {sortType === 'holders' && (
                                    sortDirection === 'desc' ?
                                    <ChevronDown size={11} className="sort-direction-icon" /> :
                                    <ChevronUp size={11} className="sort-direction-icon" />
                                )}
                            </button>
                        </Tooltip>
                    </div>

                    <div className="meme-search-sort-right-controls">
                        <div className="meme-search-explorer-quickbuy-container">
                            <img className="meme-search-explorer-quick-buy-search-icon" src={lightning} alt="" />
                            <input
                                type="text"
                                placeholder="0.0"
                                value={quickAmounts?.new}
                                onChange={(e) => setQuickAmount?.('new', e.target.value)}
                                onFocus={handleInputFocus}
                                className="meme-search-explorer-quickbuy-input"
                            />
                            <img className="meme-search-quickbuy-monad-icon" src={monadicon} />
                            <div className="meme-search-explorer-preset-controls">
                                {[1, 2, 3].map((p) => (
                                    <button
                                        key={p}
                                        className={`meme-search-explorer-preset-pill ${activePresets?.new === p ? 'meme-search-active' : ''}`}
                                        onClick={() => setActivePreset?.('new', p)}
                                    >
                                        P{p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div ref={walletDropdownRef} style={{ position: 'relative' }}>
                            <button
                                className="meme-search-wallet-button"
                                onClick={() => {
                                    if (!address) {
                                        setpopup(4);
                                    } else {
                                        setIsWalletDropdownOpen(!isWalletDropdownOpen);
                                    }
                                }}
                            >
                                <img src={walleticon} className="meme-search-wallet-icon" alt="Wallet" />
                                <span>{selectedWallets.size}</span>
                                {totalSelectedBalance > 0 ? (
                                    <>
                                        <img src={monadicon} className="meme-search-mon-icon" alt="MON" />
                                        <span>{formatNumberWithCommas(totalSelectedBalance, 2)}</span>
                                    </>
                                ) : (
                                    <>
                                        <img src={monadicon} className="meme-search-mon-icon" alt="MON" />
                                        <span>0</span>
                                    </>
                                )}
                                <svg
                                    className={`meme-search-wallet-dropdown-arrow ${isWalletDropdownOpen ? 'meme-search-open' : ''}`}
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>

                            <div className={`wallet-dropdown-panel ${isWalletDropdownOpen ? 'visible' : ''}`}>
                                <div className="meme-search-wallet-dropdown-header">
                                    <div className="meme-search-wallet-dropdown-actions">
                                        <button
                                            className="meme-search-wallet-action-btn"
                                            onClick={
                                                selectedWallets.size === subWallets.length
                                                    ? unselectAllWallets
                                                    : selectAllWallets
                                            }
                                        >
                                            {selectedWallets.size === subWallets.length ? 'Unselect All' : 'Select All'}
                                        </button>
                                        <button className="meme-search-wallet-action-btn" onClick={selectAllWithBalance}>
                                            Select All with Balance
                                        </button>
                                    </div>
                                </div>

                                <div className="meme-search-wallet-dropdown-list">
                                    <div>
                                        {subWallets.map((wallet, index) => {
                                            const balance = getWalletBalance(wallet.address);
                                            const isSelected = selectedWallets.has(wallet.address);
                                            const isActive = isWalletActive(wallet.privateKey);
                                            return (
                                                <React.Fragment key={wallet.address}>
                                                    <div
                                                        className={`meme-search-wallet-item ${isActive ? 'meme-search-active' : ''} ${isSelected ? 'meme-search-selected' : ''}`}
                                                        onClick={() => toggleWalletSelection(wallet.address)}
                                                    >
                                                        <div className="meme-search-meme-search-quickbuy-wallet-checkbox-container">
                                                            <input
                                                                type="checkbox"
                                                                className="meme-search-quickbuy-wallet-checkbox selection"
                                                                checked={isSelected}
                                                                readOnly
                                                            />
                                                        </div>
                                                        <div className="meme-search-wallet-dropdown-info">
                                                            <div className="meme-search-quickbuy-wallet-name">
                                                                {getWalletName(wallet.address, index)}
                                                                {isActive && (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', verticalAlign: 'middle' }}>
                                                                        <path d="M4 20a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
                                                                        <path d="m12.474 5.943 1.567 5.34a1 1 0 0 0 1.75.328l2.616-3.402" />
                                                                        <path d="m20 9-3 9" />
                                                                        <path d="m5.594 8.209 2.615 3.403a1 1 0 0 0 1.75-.329l1.567-5.34" />
                                                                        <path d="M7 18 4 9" />
                                                                        <circle cx="12" cy="4" r="2" />
                                                                        <circle cx="20" cy="7" r="2" />
                                                                        <circle cx="4" cy="7" r="2" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <div
                                                                className="meme-search-wallet-dropdown-address"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    copyToClipboard(wallet.address);
                                                                }}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                                                                <svg className="meme-search-meme-search-wallet-dropdown-address-copy-icon" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                                                                    <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <div className="meme-search-wallet-dropdown-balance">
                                                            {(() => {
                                                                const gasReserve = BigInt(appSettings.chainConfig[activechain].gasamount ?? 0);
                                                                const balanceWei = walletTokenBalances[wallet.address]?.[appSettings.chainConfig[activechain]?.eth] || 0n;
                                                                const hasInsufficientGas = balanceWei > 0n && balanceWei <= gasReserve;

                                                                return (
                                                                    <Tooltip content={hasInsufficientGas ? 'Not enough for gas, transactions will revert' : 'MON Balance'}>
                                                                        <div className={`meme-search-meme-search-wallet-dropdown-balance-amount ${hasInsufficientGas ? 'meme-search-insufficient-gas' : ''}`}>
                                                                            <img src={monadicon} className="meme-search-wallet-dropdown-mon-icon" alt="MON" />
                                                                            {formatNumberWithCommas(balance, 2)}
                                                                        </div>
                                                                    </Tooltip>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="meme-search-wallet-drag-tokens">
                                                            <div className="meme-search-wallet-token-count">
                                                                <div className="meme-search-wallet-token-structure-icons">
                                                                    <div className="meme-search-token1"></div>
                                                                    <div className="meme-search-token2"></div>
                                                                    <div className="meme-search-token3"></div>
                                                                </div>
                                                                <span className="meme-search-wallet-total-tokens">{getWalletTokenCount(wallet.address)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })}
                                        {subWallets.length < 10 && (
                                            <div
                                                className="meme-search-quickbuy-add-wallet-button"
                                                onClick={() => {
                                                    createSubWallet?.();
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                </svg>
                                                <span>Add Wallet</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="meme-search-bar">
                    <input
                        type="text"
                        className="meme-search-input"
                        placeholder="Search by name, ticker, or CA..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        autoFocus
                    />
                </div>
                {searchTerm.trim().length >= 1 && (loading || isSearching) ? (
                    <div className="meme-search-results">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={`skeleton-${i}`} className="meme-search-skeleton-container">
                                <div className="meme-search-skeleton-left">
                                    <div className="meme-search-skeleton-hide-button"></div>
                                    <div className="meme-search-skeleton-token-image-container">
                                        <div className="meme-search-skeleton-progress-spacer">
                                            <div className="meme-search-skeleton-image-wrapper">
                                                <div className="meme-search-skeleton-token-image"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="meme-search-skeleton-progress-line">
                                        <div className="meme-search-skeleton-progress-line-fill"></div>
                                    </div>
                                    <div className="meme-search-skeleton-contract-address"></div>
                                </div>
                                <div className="meme-search-skeleton-details">
                                    <div className="meme-search-skeleton-detail-section">
                                        <div className="meme-search-skeleton-token-info">
                                            <div className="meme-search-skeleton-token-symbol"></div>
                                            <div className="meme-search-skeleton-token-name"></div>
                                        </div>
                                        <div className="meme-search-skeleton-second-row">
                                            <div className="meme-search-skeleton-time-created"></div>
                                            <div className="meme-search-skeleton-social-buttons">
                                                <div className="meme-search-skeleton-social-btn"></div>
                                                <div className="meme-search-skeleton-social-btn"></div>
                                                <div className="meme-search-skeleton-social-btn"></div>
                                            </div>
                                        </div>
                                        <div className="meme-search-skeleton-additional-data">
                                            <div className="meme-search-skeleton-stat-item">
                                                <div className="meme-search-skeleton-stat-icon"></div>
                                                <div className="meme-search-skeleton-stat-value"></div>
                                            </div>
                                            <div className="meme-search-skeleton-stat-item">
                                                <div className="meme-search-skeleton-stat-icon"></div>
                                                <div className="meme-search-skeleton-stat-value"></div>
                                            </div>
                                            <div className="meme-search-skeleton-stat-item">
                                                <div className="meme-search-skeleton-stat-icon"></div>
                                                <div className="meme-search-skeleton-stat-value"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="meme-search-skeleton-holdings-section">
                                        <div className="meme-search-skeleton-holding-item"></div>
                                        <div className="meme-search-skeleton-holding-item"></div>
                                        <div className="meme-search-skeleton-holding-item"></div>
                                    </div>
                                </div>
                                <div className="meme-search-skeleton-third-row">
                                    <div className="meme-search-skeleton-metrics-container">
                                        <div className="meme-search-skeleton-volume"></div>
                                        <div className="meme-search-skeleton-market-cap"></div>
                                    </div>
                                    <div className="meme-search-skeleton-third-row-section">
                                        <div className="meme-search-skeleton-fee-stat"></div>
                                        <div className="meme-search-skeleton-tx-bar">
                                            <div className="meme-search-skeleton-tx-header"></div>
                                            <div className="meme-search-skeleton-tx-visual"></div>
                                        </div>
                                    </div>
                                    <div className="meme-search-skeleton-actions-section">
                                        <div className="meme-search-skeleton-quick-buy-btn"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {error && <div className="meme-search-error">{error}</div>}

                        {showCombinedRecent ? (
                            <div className="meme-search-section">
                                <div className="meme-search-section-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>History</span>
                                        <button
                                            className="meme-search-clear-history-btn"
                                            onClick={clearHistory}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (showTokens && !showMarkets && searchTerm.trim().length >= 1 && !(loading || isSearching)) && (
                        <div className="meme-search-section">
                            <div className="meme-search-section-header">Results</div>
                        </div>)}
                        <div className="meme-search-list">
                            {showCombinedRecent && (
                                sortedCombinedRecentlyViewed.map((item, index) => {
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

                                        return (
                                            <TokenRow
                                                key={token.id}
                                                token={token}
                                                quickbuyAmount={getCurrentQuickBuyAmount()}
                                                quickbuyAmountSecond={'0'}
                                                onHideToken={()=>{}}
                                                onBlacklistToken={()=>{}}
                                                isLoadingPrimary={buyingTokens.has(token.id)}
                                                isLoadingSecondary={buyingTokens.has(token.id)}
                                                hoveredToken={hoveredToken}
                                                hoveredImage={hoveredImage}
                                                onTokenHover={handleTokenHover}
                                                onTokenLeave={handleTokenLeave}
                                                onImageHover={handleImageHover}
                                                onImageLeave={handleImageLeave}
                                                onTokenClick={handleTokenClick}
                                                onQuickBuy={handleQuickBuy}
                                                onCopyToClipboard={copyToClipboard}
                                                displaySettings={DISPLAY_DEFAULTS}
                                                isHidden={false}
                                                isBlacklisted={(token as any).isBlacklisted || false}
                                                monUsdPrice={monUsdPrice}
                                                blacklistSettings={{}}
                                                formatTimeAgo={formatTimeAgo}
                                            />
                                        );
                                    }
                                })
                            )}

                            {showTokens && (
                                <>
                                    {showMarkets && (
                                        <div className="meme-search-section">
                                            <div className="meme-search-section-header">Tokens</div>
                                        </div>
                                    )}
                                     {sortedFilteredTokens.map((t) => {
                                        const status = getTokenStatus(t.progress);
   
                                        return (
                                            <TokenRow
                                                key={t.id}
                                                token={t}
                                                quickbuyAmount={getCurrentQuickBuyAmount()}
                                                quickbuyAmountSecond={'0'}
                                                onHideToken={()=>{}}
                                                onBlacklistToken={()=>{}}
                                                isLoadingPrimary={buyingTokens.has(t.id)}
                                                isLoadingSecondary={buyingTokens.has(t.id)}
                                                hoveredToken={hoveredToken}
                                                hoveredImage={hoveredImage}
                                                onTokenHover={handleTokenHover}
                                                onTokenLeave={handleTokenLeave}
                                                onImageHover={handleImageHover}
                                                onImageLeave={handleImageLeave}
                                                onTokenClick={handleTokenClick}
                                                onQuickBuy={handleQuickBuy}
                                                onCopyToClipboard={copyToClipboard}
                                                displaySettings={DISPLAY_DEFAULTS}
                                                isHidden={false}
                                                isBlacklisted={(t as any).isBlacklisted || false}
                                                monUsdPrice={monUsdPrice}
                                                blacklistSettings={{}}
                                                formatTimeAgo={formatTimeAgo}
                                            />
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
                                    {searchTerm.trim().length >= 1 && !loading && !isSearching && (
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