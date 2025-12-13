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
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();
    const crystalLogo = '/CrystalLogo.png'
    const NadfunLogo: React.FC = () => (
        <svg width="11" height="11" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="nadfun-meme-search" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#AD5FFB" />
                    <stop offset="100%" stopColor="#D896FF" />
                </linearGradient>
            </defs>
            <path fill="url(#nadfun-meme-search)" d="m29.202 10.664-4.655-3.206-3.206-4.653A6.48 6.48 0 0 0 16.004 0a6.48 6.48 0 0 0-5.337 2.805L7.46 7.458l-4.654 3.206a6.474 6.474 0 0 0 0 10.672l4.654 3.206 3.207 4.653A6.48 6.48 0 0 0 16.004 32a6.5 6.5 0 0 0 5.337-2.805l3.177-4.616 4.684-3.236A6.49 6.49 0 0 0 32 16.007a6.47 6.47 0 0 0-2.806-5.335zm-6.377 5.47c-.467 1.009-1.655.838-2.605 1.06-2.264.528-2.502 6.813-3.05 8.35-.424 1.484-1.916 1.269-2.272 0-.631-1.53-.794-6.961-2.212-7.993-.743-.542-2.502-.267-3.177-.95-.668-.675-.698-1.729-.023-2.412l5.3-5.298a1.734 1.734 0 0 1 2.45 0l5.3 5.298c.505.505.586 1.306.297 1.937z" />
        </svg>
    );
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
            marketCap: Number(m.marketcap_usd ?? 0),
            change24h: 0,
            buyTransactions: Number(m.tx?.buy ?? 0),
            sellTransactions: Number(m.tx?.sell ?? 0),
            volume24h: Number(m.volume_usd ?? 0),
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

                                        const tokenElement = (
                                            <div
                                                className={`meme-token-row ${hiddenTokens.has(token.id) ? 'hidden-token' : ''}`}
                                                onClick={() => handleTokenClick(token)}
                                                onMouseEnter={() => handleTokenHover(token.id)}
                                                onMouseLeave={handleTokenLeave}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="meme-search-explorer-token-actions">
                                                    <button
                                                        className={`meme-search-explorer-hide-button ${hiddenTokens.has(token.id) ? 'strikethrough' : ''}`}
                                                        onClick={(e) => handleHideToken(token.id, e)}
                                                    >
                                                        <Tooltip content={hiddenTokens.has(token.id) ? 'Show Token' : 'Hide Token'}>
                                                            <svg
                                                                width="16"
                                                                height="16"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                {hiddenTokens.has(token.id) ? (
                                                                    <>
                                                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                                                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                                                        <line x1="2" y1="2" x2="22" y2="22" />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                                        <circle cx="12" cy="12" r="3" />
                                                                    </>
                                                                )}
                                                            </svg>
                                                        </Tooltip>
                                                    </button>
                                                    <button
                                                        className="meme-search-explorer-blacklist-button"
                                                        onClick={(e) => handleBlacklistToken(token, e)}
                                                    >
                                                        <Tooltip content="Blacklist Dev">
                                                            <svg
                                                                width="16"
                                                                height="16"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <circle cx="12" cy="12" r="10" />
                                                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                            </svg>
                                                        </Tooltip>
                                                    </button>
                                                </div>
                                                <div className="meme-search-explorer-token-left">
                                                        <div
                                                            className={`meme-search-explorer-token-image-container ${token.status === 'graduated' ? 'meme-search-graduated' : ''}`}
                                                            style={
                                                                token.status === 'graduated'
                                                                    ? { position: 'relative' }
                                                                    : imageStyle
                                                            }
                                                        >
                                                            <div className="meme-search-explorer-progress-spacer">
                                                                <div
                                                                    className="meme-search-explorer-image-wrapper"
                                                                    onMouseEnter={() => handleImageHover(token.id)}
                                                                    onMouseLeave={handleImageLeave}
                                                                >
                                                                    {token.image ? (
                                                                        <img
                                                                            src={token.image}
                                                                            alt={token.symbol}
                                                                            className="meme-search-explorer-token-image"
                                                                            onError={(e) => {
                                                                                e.currentTarget.style.display = 'none';
                                                                                const placeholder = e.currentTarget.parentElement?.querySelector(
                                                                                    '.meme-search-explorer-token-letter',
                                                                                ) as HTMLElement;
                                                                                if (placeholder) placeholder.style.display = 'flex';
                                                                            }}
                                                                        />
                                                                    ) : null}
                                                                    <div
                                                                        className="meme-search-explorer-token-letter"
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            backgroundColor: 'rgb(6,6,6)',
                                                                            display: token.image ? 'none' : 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            fontSize: token.symbol.length <= 3 ? '34px' : '28px',
                                                                            fontWeight: '200',
                                                                            color: '#ffffff',
                                                                            letterSpacing: token.symbol.length > 3 ? '-1px' : '0',
                                                                            borderRadius: '8px',
                                                                        }}
                                                                    >
                                                                        {token.symbol.slice(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <div className="meme-search-explorer-image-overlay">
                                                                        <a
                                                                            href={`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(token.image || '')}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <svg className="camera-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                                                                                <circle cx="12" cy="13" r="3" />
                                                                            </svg>
                                                                        </a>
                                                                    </div>
                                                                    <div className="meme-search-token-explorer-launchpad-logo-container">
                                                                        {token.source === 'nadfun' ? (
                                                                            <Tooltip content="nad.fun">
                                                                                <svg width="10" height="10" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="meme-search-token-explorer-launchpad-logo">
                                                                                    <defs>
                                                                                        <linearGradient id="nadfun" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                                            <stop offset="0%" stopColor="#7C55FF" stopOpacity="1" />
                                                                                            <stop offset="100%" stopColor="#AD5FFB" stopOpacity="1" />
                                                                                        </linearGradient>
                                                                                    </defs>
                                                                                    <path fill="url(#nadfun)" d="m29.202 10.664-4.655-3.206-3.206-4.653A6.48 6.48 0 0 0 16.004 0a6.48 6.48 0 0 0-5.337 2.805L7.46 7.458l-4.654 3.206a6.474 6.474 0 0 0 0 10.672l4.654 3.206 3.207 4.653A6.48 6.48 0 0 0 16.004 32a6.5 6.5 0 0 0 5.337-2.805l3.177-4.616 4.684-3.236A6.49 6.49 0 0 0 32 16.007a6.47 6.47 0 0 0-2.806-5.335zm-6.377 5.47c-.467 1.009-1.655.838-2.605 1.06-2.264.528-2.502 6.813-3.05 8.35-.424 1.484-1.916 1.269-2.272 0-.631-1.53-.794-6.961-2.212-7.993-.743-.542-2.502-.267-3.177-.95-.668-.675-.698-1.729-.023-2.412l5.3-5.298a1.734 1.734 0 0 1 2.45 0l5.3 5.298c.505.505.586 1.306.297 1.937z" />
                                                                                </svg>
                                                                            </Tooltip>
                                                                        ) : (
                                                                            <Tooltip content="crystal.fun">
                                                                                <img src={crystalLogo} className="meme-search-token-explorer-launchpad-logo crystal" />
                                                                            </Tooltip>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {token.status !== 'graduated' && (
                                                            <div className="meme-search-explorer-progress-line">
                                                                <div
                                                                    className="meme-search-explorer-progress-line-fill"
                                                                    style={{ width: `${bondingPercentage}%` }}
                                                                />
                                                            </div>
                                                        )}

                                                        <span className="meme-search-explorer-contract-address">
                                                            {token.id.slice(0, 6)}…{token.id.slice(-4)}
                                                        </span>
                                                    </div>

                                                    <div className="meme-search-explorer-token-details">
                                                        <div className="meme-search-explorer-detail-section">
                                                            <div className="meme-search-explorer-top-row">
                                                                <div className="meme-search-explorer-token-info">
                                                                    <h3 className="meme-search-explorer-token-symbol">{token.symbol}</h3>
                                                                    <div className="meme-search-explorer-token-name-container" onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        copyToClipboard(token.id);
                                                                    }}
                                                                        style={{ cursor: 'pointer' }}>
                                                                        <Tooltip content="Click to copy address">
                                                                            <p
                                                                                className="meme-search-explorer-token-name"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    copyToClipboard(token.id);
                                                                                }}
                                                                                style={{ cursor: 'pointer' }}
                                                                            >
                                                                                {token.name}
                                                                            </p>
                                                                            <button
                                                                                className="meme-search-explorer-copy-btn"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    copyToClipboard(token.id);
                                                                                }}
                                                                            >
                                                                                <svg
                                                                                    width="14"
                                                                                    height="14"
                                                                                    viewBox="0 0 24 24"
                                                                                    fill="currentColor"
                                                                                >
                                                                                    <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                                                                                </svg>
                                                                            </button>
                                                                        </Tooltip>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="meme-search-explorer-second-row">
                                                                <div className="meme-search-explorer-price-section">
                                                                    <span
                                                                        className="meme-search-explorer-time-created"
                                                                        style={{
                                                                            color: (Math.floor(Date.now() / 1000) - token.created) > 21600
                                                                                ? '#f77f7d'
                                                                                : 'rgb(67, 254, 154)'
                                                                        }}
                                                                    >
                                                                        {formatTimeAgo(token.created)}
                                                                    </span>
                                                                    <>
                                                                        {!!token.twitterHandle && (
                                                                            <TwitterHover url={token.twitterHandle}>
                                                                                <a
                                                                                    className="meme-search-explorer-avatar-btn"
                                                                                    href={token.twitterHandle}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    <img
                                                                                        src={
                                                                                            token.twitterHandle.includes('/i/communities/')
                                                                                                ? communities
                                                                                                : token.twitterHandle.includes('/status/')
                                                                                                    ? tweet
                                                                                                    : avatar
                                                                                        }
                                                                                        alt={
                                                                                            token.twitterHandle.includes('/i/communities/')
                                                                                                ? 'Community'
                                                                                                : 'Twitter'
                                                                                        }
                                                                                        className={
                                                                                            token.twitterHandle.includes('/i/communities/')
                                                                                                ? 'community-icon'
                                                                                                : token.twitterHandle.includes('/status/')
                                                                                                    ? 'meme-search-tweet-icon'
                                                                                                    : 'meme-search-avatar-icon'
                                                                                        }
                                                                                    />
                                                                                </a>
                                                                            </TwitterHover>
                                                                        )}

                                                                        {!!token.website && (
                                                                            <a
                                                                                className="meme-search-explorer-website-btn"
                                                                                href={token.website}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <Tooltip content={token.website}>
                                                                                    <svg
                                                                                        width="16"
                                                                                        height="16"
                                                                                        viewBox="0 0 24 24"
                                                                                        fill="currentColor"
                                                                                    >
                                                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                                                                    </svg>
                                                                                </Tooltip>
                                                                            </a>
                                                                        )}

                                                                        {!!token.telegramHandle && (
                                                                            <a
                                                                                className="meme-search-explorer-telegram-btn"
                                                                                href={token.telegramHandle}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <Tooltip content="Telegram">
                                                                                    <img src={telegram} />
                                                                                </Tooltip>
                                                                            </a>
                                                                        )}

                                                                        {!!token.discordHandle && (
                                                                            <a
                                                                                className="meme-search-explorer-discord-btn"
                                                                                href={token.discordHandle}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <Tooltip content="Discord">
                                                                                    <img src={discord} />
                                                                                </Tooltip>
                                                                            </a>
                                                                        )}

                                                                        <a
                                                                            href={`https://twitter.com/search?q=${token.id}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="meme-search-explorer-search-btn"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <Search size={14} />
                                                                        </a>

                                                                        {token.source === 'nadfun' && (
                                                                            <Tooltip content="View on nad.fun">
                                                                                <a
                                                                                    className="meme-search-explorer-nadfun-link"
                                                                                    href={`https://nad.fun/tokens/${token.id}`}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    <svg width="13" height="13" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                        <defs>
                                                                                            <linearGradient id="nadfun" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                                            </linearGradient>
                                                                                        </defs>
                                                                                        <path fill="url(#nadfun)" d="m29.202 10.664-4.655-3.206-3.206-4.653A6.48 6.48 0 0 0 16.004 0a6.48 6.48 0 0 0-5.337 2.805L7.46 7.458l-4.654 3.206a6.474 6.474 0 0 0 0 10.672l4.654 3.206 3.207 4.653A6.48 6.48 0 0 0 16.004 32a6.5 6.5 0 0 0 5.337-2.805l3.177-4.616 4.684-3.236A6.49 6.49 0 0 0 32 16.007a6.47 6.47 0 0 0-2.806-5.335zm-6.377 5.47c-.467 1.009-1.655.838-2.605 1.06-2.264.528-2.502 6.813-3.05 8.35-.424 1.484-1.916 1.269-2.272 0-.631-1.53-.794-6.961-2.212-7.993-.743-.542-2.502-.267-3.177-.95-.668-.675-.698-1.729-.023-2.412l5.3-5.298a1.734 1.734 0 0 1 2.45 0l5.3 5.298c.505.505.586 1.306.297 1.937z" />
                                                                                    </svg>
                                                                                </a>
                                                                            </Tooltip>
                                                                        )}
                                                                    </>
                                                                </div>

                                                                <div className="meme-search-explorer-additional-data">
                                                                    <Tooltip content="Holders">
                                                                        <div className="meme-search-explorer-stat-item">
                                                                            <svg
                                                                                className="meme-search-traders-icon"
                                                                                width="20"
                                                                                height="20"
                                                                                viewBox="0 0 24 24"
                                                                                fill="currentColor"
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                            >
                                                                                <path d="M 8.8007812 3.7890625 C 6.3407812 3.7890625 4.3496094 5.78 4.3496094 8.25 C 4.3496094 9.6746499 5.0287619 10.931069 6.0703125 11.748047 C 3.385306 12.836193 1.4902344 15.466784 1.4902344 18.550781 C 1.4902344 18.960781 1.8202344 19.300781 2.2402344 19.300781 C 2.6502344 19.300781 2.9902344 18.960781 2.9902344 18.550781 C 2.9902344 15.330781 5.6000781 12.720703 8.8300781 12.720703 L 8.8203125 12.710938 C 8.9214856 12.710938 9.0168776 12.68774 9.1054688 12.650391 C 9.1958823 12.612273 9.2788858 12.556763 9.3476562 12.488281 C 9.4163056 12.41992 9.4712705 12.340031 9.5097656 12.25 C 9.5480469 12.160469 9.5703125 12.063437 9.5703125 11.960938 C 9.5703125 11.540938 9.2303125 11.210938 8.8203125 11.210938 C 7.1903125 11.210938 5.8691406 9.8897656 5.8691406 8.2597656 C 5.8691406 6.6297656 7.1900781 5.3105469 8.8300781 5.3105469 L 8.7890625 5.2890625 C 9.2090625 5.2890625 9.5507812 4.9490625 9.5507812 4.5390625 C 9.5507812 4.1190625 9.2107813 3.7890625 8.8007812 3.7890625 z M 14.740234 3.8007812 C 12.150234 3.8007812 10.060547 5.9002344 10.060547 8.4902344 L 10.039062 8.4707031 C 10.039063 10.006512 10.78857 11.35736 11.929688 12.212891 C 9.0414704 13.338134 7 16.136414 7 19.429688 C 7 19.839688 7.33 20.179688 7.75 20.179688 C 8.16 20.179688 8.5 19.839688 8.5 19.429688 C 8.5 15.969687 11.29 13.179688 14.75 13.179688 L 14.720703 13.160156 C 14.724012 13.160163 14.727158 13.160156 14.730469 13.160156 C 16.156602 13.162373 17.461986 13.641095 18.519531 14.449219 C 18.849531 14.709219 19.320078 14.640313 19.580078 14.320312 C 19.840078 13.990313 19.769219 13.519531 19.449219 13.269531 C 18.873492 12.826664 18.229049 12.471483 17.539062 12.205078 C 18.674662 11.350091 19.419922 10.006007 19.419922 8.4804688 C 19.419922 5.8904687 17.320234 3.8007812 14.740234 3.8007812 z M 14.730469 5.2890625 C 16.490469 5.2890625 17.919922 6.7104688 17.919922 8.4804688 C 17.919922 10.240469 16.500234 11.669922 14.740234 11.669922 C 12.980234 11.669922 11.560547 10.250234 11.560547 8.4902344 C 11.560547 6.7302344 12.98 5.3105469 14.75 5.3105469 L 14.730469 5.2890625 z M 21.339844 16.230469 C 21.24375 16.226719 21.145781 16.241797 21.050781 16.279297 L 21.039062 16.259766 C 20.649063 16.409766 20.449609 16.840469 20.599609 17.230469 C 20.849609 17.910469 20.990234 18.640156 20.990234 19.410156 C 20.990234 19.820156 21.320234 20.160156 21.740234 20.160156 C 22.150234 20.160156 22.490234 19.820156 22.490234 19.410156 C 22.490234 18.470156 22.319766 17.560703 22.009766 16.720703 C 21.897266 16.428203 21.628125 16.241719 21.339844 16.230469 z" />
                                                                            </svg>{' '}
                                                                            <span className="meme-search-explorer-stat-value">
                                                                                {(token.holders || 0).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                    </Tooltip>

                                                                    <Tooltip content="Pro Traders">
                                                                        <div className="meme-search-explorer-stat-item">
                                                                            <svg
                                                                                className="meme-search-traders-icon"
                                                                                width="20"
                                                                                height="20"
                                                                                viewBox="0 0 24 24"
                                                                                fill="currentColor"
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                            >
                                                                                <path d="M 12 2 L 12 4 L 11 4 C 10.4 4 10 4.4 10 5 L 10 10 C 10 10.6 10.4 11 11 11 L 12 11 L 12 13 L 14 13 L 14 11 L 15 11 C 15.6 11 16 10.6 16 10 L 16 5 C 16 4.4 15.6 4 15 4 L 14 4 L 14 2 L 12 2 z M 4 9 L 4 11 L 3 11 C 2.4 11 2 11.4 2 12 L 2 17 C 2 17.6 2.4 18 3 18 L 4 18 L 4 20 L 6 20 L 6 18 L 7 18 C 7.6 18 8 17.6 8 17 L 8 12 C 8 11.4 7.6 11 7 11 L 6 11 L 6 9 L 4 9 z M 18 11 L 18 13 L 17 13 C 16.4 13 16 13.4 16 14 L 16 19 C 16 19.6 16.4 20 17 20 L 18 20 L 18 22 L 20 22 L 20 20 L 21 20 C 21.6 20 22 19.6 22 19 L 22 14 C 22 13.4 21.6 13 21 13 L 20 13 L 20 11 L 18 11 z M 4 13 L 6 13 L 6 16 L 4 16 L 4 13 z" />
                                                                            </svg>{' '}
                                                                            <span className="meme-search-pro-explorer-stat-value">
                                                                                {(token.proTraders || 0).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                    </Tooltip>

                                                                    <Tooltip content="Dev Migrations ">
                                                                        <div className="meme-search-explorer-stat-item">
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                className="meme-search-graduated-icon"
                                                                                style={
                                                                                    (token.graduatedTokens || 0) > 0
                                                                                        ? { color: 'rgba(255, 251, 0, 1)' }
                                                                                        : undefined
                                                                                }
                                                                            >
                                                                                <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
                                                                                <path d="M5 21h14" />
                                                                            </svg>
                                                                            <div className="meme-search-dev-migrations-container">
                                                                                <span className="meme-search-explorer-dev-migrations">
                                                                                    {(token.graduatedTokens || 0).toLocaleString()}
                                                                                </span>{' '}
                                                                                <span className="meme-search-dev-migrations-slash">/</span>
                                                                                <span className="meme-search-explorer-dev-migrations">
                                                                                    {(token.launchedTokens || 0).toLocaleString()}
                                                                                </span>
                                                                            </div>
                                                                            </div>
                                                                        </Tooltip>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {token.twitterHandle && !token.twitterHandle.includes('/i/communities/') && (() => {
                                                            const username = extractTwitterUsername(token.twitterHandle);
                                                            return (
                                                                <a
                                                                    href={`https://x.com/${username}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="meme-search-explorer-twitter-username"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    @{username}
                                                                </a>
                                                            );
                                                        })()}

                                                        <div className="meme-search-explorer-holdings-section">
                                                            <InteractiveTooltip
                                                                    content={
                                                                        <div className="meme-search-explorer-dev-holding-tooltip-address">
                                                                            <a
                                                                                href={`https://monad-explorer.com/address/${token.dev || ''}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="wallet-address-link"
                                                                            >
                                                                                {token.dev ? `${token.dev.slice(0, 6)}...${token.dev.slice(-4)}` : 'N/A'}
                                                                            </a>
                                                                        </div>
                                                                    }
                                                                >
                                                                    <div className="meme-search-explorer-holding-item">
                                                                        <svg
                                                                            className="meme-search-holding-icon"
                                                                            width="16"
                                                                            height="16"
                                                                            viewBox="0 0 30 30"
                                                                            fill={
                                                                                (token.devHolding || 0) * 100 > 25
                                                                                    ? '#eb7070ff'
                                                                                    : 'rgb(67, 254, 154)'
                                                                            }
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                        >
                                                                            <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                                                                        </svg>{' '}
                                                                        <span
                                                                            className="meme-search-explorer-holding-value"
                                                                            style={{
                                                                                color:
                                                                                    (token.devHolding || 0) * 100 > 25
                                                                                        ? '#eb7070ff'
                                                                                        : 'rgb(67, 254, 154)',
                                                                            }}
                                                                        >
                                                                            {((token.devHolding || 0) * 100).toFixed(2)}%
                                                                        </span>
                                                                    </div>
                                                                </InteractiveTooltip>

                                                                <Tooltip content="Top 10 holders percentage">
                                                                    <div className="meme-search-explorer-holding-item">
                                                                        <svg
                                                                            className="meme-search-holding-icon"
                                                                            width="16"
                                                                            height="16"
                                                                            viewBox="0 0 32 32"
                                                                            fill={
                                                                                (token.top10Holding ?? 0) > 25
                                                                                    ? '#eb7070ff'
                                                                                    : 'rgb(67, 254, 154)'
                                                                            }
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                        >
                                                                            <path d="M 15 4 L 15 6 L 13 6 L 13 8 L 15 8 L 15 9.1875 C 14.011719 9.554688 13.25 10.433594 13.0625 11.5 C 12.277344 11.164063 11.40625 11 10.5 11 C 6.921875 11 4 13.921875 4 17.5 C 4 19.792969 5.199219 21.8125 7 22.96875 L 7 27 L 25 27 L 25 22.96875 C 26.800781 21.8125 28 19.792969 28 17.5 C 28 13.921875 25.078125 11 21.5 11 C 20.59375 11 19.722656 11.164063 18.9375 11.5 C 18.75 10.433594 17.988281 9.554688 17 9.1875 L 17 8 L 19 8 L 19 6 L 17 6 L 17 4 Z M 16 11 C 16.5625 11 17 11.4375 17 12 C 17 12.5625 16.5625 13 16 13 C 15.4375 13 15 12.5625 15 12 C 15 11.4375 15.4375 11 16 11 Z M 10.5 13 C 12.996094 13 15 15.003906 15 17.5 L 15 22 L 10.5 22 C 8.003906 22 6 19.996094 6 17.5 C 6 15.003906 8.003906 13 10.5 13 Z M 21.5 13 C 23.996094 13 26 15.003906 26 17.5 C 26 19.996094 23.996094 22 21.5 22 L 17 22 L 17 17.5 C 17 15.003906 19.003906 13 21.5 13 Z M 9 24 L 23 24 L 23 25 L 9 25 Z" />
                                                                        </svg>{' '}
                                                                        <span
                                                                            className="meme-search-explorer-holding-value"
                                                                            style={{
                                                                                color:
                                                                                    (token.top10Holding ?? 0) > 25
                                                                                        ? '#eb7070ff'
                                                                                        : 'rgb(67, 254, 154)',
                                                                            }}
                                                                        >
                                                                            {(token.top10Holding ?? 0).toFixed(2)}%
                                                                        </span>
                                                                    </div>
                                                                </Tooltip>

                                                            <Tooltip content="Sniper Holding">
                                                                <div className="meme-search-explorer-holding-item">
                                                                    <svg
                                                                        className="meme-search-sniper-icon"
                                                                        width="16"
                                                                        height="16"
                                                                        viewBox="0 0 24 24"
                                                                        fill={
                                                                            (token.sniperHolding || 0) > 20
                                                                                ? '#eb7070ff'
                                                                                : 'rgb(67, 254, 154)'
                                                                        }
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <path d="M 11.244141 2.0019531 L 11.244141 2.7519531 L 11.244141 3.1542969 C 6.9115518 3.5321749 3.524065 6.919829 3.1445312 11.251953 L 2.7421875 11.251953 L 1.9921875 11.251953 L 1.9921875 12.751953 L 2.7421875 12.751953 L 3.1445312 12.751953 C 3.5225907 17.085781 6.9110367 20.473593 11.244141 20.851562 L 11.244141 21.253906 L 11.244141 22.003906 L 12.744141 22.003906 L 12.744141 21.253906 L 12.744141 20.851562 C 17.076343 20.47195 20.463928 17.083895 20.841797 12.751953 L 21.244141 12.751953 L 21.994141 12.751953 L 21.994141 11.251953 L 21.244141 11.251953 L 20.841797 11.251953 C 20.462285 6.9209126 17.074458 3.5337191 12.744141 3.1542969 L 12.744141 2.7519531 L 12.744141 2.0019531 L 11.244141 2.0019531 z M 11.244141 4.6523438 L 11.244141 8.0742188 C 9.6430468 8.3817751 8.3759724 9.6507475 8.0683594 11.251953 L 4.6425781 11.251953 C 5.0091295 7.7343248 7.7260437 5.0173387 11.244141 4.6523438 z M 12.744141 4.6523438 C 16.25959 5.0189905 18.975147 7.7358303 19.341797 11.251953 L 15.917969 11.251953 C 15.610766 9.6510551 14.344012 8.3831177 12.744141 8.0742188 L 12.744141 4.6523438 z M 11.992188 9.4980469 C 13.371637 9.4980469 14.481489 10.6041 14.492188 11.982422 L 14.492188 12.021484 C 14.481501 13.40006 13.372858 14.503906 11.992188 14.503906 C 10.606048 14.503906 9.4921875 13.389599 9.4921875 12.001953 C 9.4921875 10.614029 10.60482 9.4980469 11.992188 9.4980469 z M 4.6425781 12.751953 L 8.0683594 12.751953 C 8.3760866 14.352973 9.6433875 15.620527 11.244141 15.927734 L 11.244141 19.353516 C 7.7258668 18.988181 5.0077831 16.270941 4.6425781 12.751953 z M 15.917969 12.751953 L 19.34375 12.751953 C 18.97855 16.26893 16.261295 18.986659 12.744141 19.353516 L 12.744141 15.927734 C 14.344596 15.619809 15.610176 14.35218 15.917969 12.751953 z" />
                                                                    </svg>{' '}
                                                                    <span
                                                                        className="meme-search-explorer-holding-value"
                                                                        style={{
                                                                            color:
                                                                                (token.sniperHolding || 0) > 20
                                                                                    ? '#eb7070ff'
                                                                                    : 'rgb(67, 254, 154)',
                                                                        }}
                                                                    >
                                                                        {(token.sniperHolding || 0).toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            </Tooltip>
                                                        </div>
                                                    </div>

                                                    <div className="meme-search-explorer-third-row metrics-size-small">
                                                        <div className="meme-search-explorer-metrics-container">
                                                            <div>
                                                                <Tooltip content="Volume">
                                                                    <div className="meme-search-explorer-volume">
                                                                        <span className="mc-label">V</span>
                                                                        <span className="meme-search-mc-value">
                                                                            {formatPrice(token.volume24h * monUsdPrice)}
                                                                        </span>
                                                                    </div>
                                                                </Tooltip>
                                                            </div>
                                                            <div>
                                                                <Tooltip content="Market Cap">
                                                                    <div className="meme-search-explorer-market-cap">
                                                                        <span className="mc-label">MC</span>
                                                                        <span className="meme-search-mc-value">
                                                                            {formatPrice(token.marketCap * monUsdPrice)}
                                                                        </span>
                                                                    </div>
                                                                </Tooltip>
                                                            </div>
                                                        </div>

                                                        <div className="meme-search-explorer-third-row-section">
                                                            <Tooltip content="Global Fees Paid">
                                                                <div className="meme-search-explorer-stat-item">
                                                                    <span className="meme-search-explorer-fee-label">F</span>
                                                                    <span className="meme-search-explorer-fee-total">
                                                                        {formatPrice((token.volume24h * monUsdPrice) / 100)}
                                                                    </span>
                                                                </div>
                                                            </Tooltip>

                                                            <Tooltip content="Transactions">
                                                                <div className="meme-search-explorer-tx-bar">
                                                                    <div className="meme-search-explorer-tx-header">
                                                                        <span className="meme-search-explorer-tx-label">TX</span>
                                                                        <span className="meme-search-explorer-tx-total">
                                                                            {((token.buyTransactions || 0) + (token.sellTransactions || 0)).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="meme-search-explorer-tx-visual-bar">
                                                                        {((token.buyTransactions || 0) + (token.sellTransactions || 0)) === 0 ? (
                                                                            <div
                                                                                style={{
                                                                                    width: '100%',
                                                                                    height: '100%',
                                                                                    backgroundColor: '#252526ff',
                                                                                    borderRadius: '1px',
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <>
                                                                                <div
                                                                                    className="meme-search-explorer-tx-buy-portion"
                                                                                    style={{
                                                                                        width: `${((token.buyTransactions || 0) / ((token.buyTransactions || 0) + (token.sellTransactions || 0))) * 100}%`
                                                                                    }}
                                                                                />
                                                                                <div
                                                                                    className="meme-search-explorer-tx-sell-portion"
                                                                                    style={{
                                                                                        width: `${((token.sellTransactions || 0) / ((token.buyTransactions || 0) + (token.sellTransactions || 0))) * 100}%`
                                                                                    }}
                                                                                />
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </Tooltip>
                                                        </div>

                                                        <div className="meme-search-explorer-actions-section">
                                                            <button
                                                                className="meme-search-explorer-quick-buy-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleQuickBuy(token);
                                                                }}
                                                                disabled={buyingTokens.has(token.id) || !onQuickBuy}
                                                            >
                                                                {buyingTokens.has(token.id) ? (
                                                                    <>
                                                                        <div className="meme-search-quickbuy-loading-spinner" />
                                                                        <img
                                                                            className="meme-search-explorer-quick-buy-icon"
                                                                            src={lightning}
                                                                            style={{ opacity: 0 }}
                                                                        />
                                                                        <span style={{ opacity: 0 }}>{getCurrentQuickBuyAmount()} MON</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <img
                                                                            className="meme-search-explorer-quick-buy-icon"
                                                                            src={lightning}
                                                                        />
                                                                        {getCurrentQuickBuyAmount()} MON
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                            </div>
                                        );

                                        return (
                                            <div key={`token-${index}`}>
                                                {tokenElement}
                                                {hoveredImage === token.id && token.image && createPortal(
                                                    <div className="meme-search-explorer-image-preview">
                                                        <div className="meme-search-explorer-preview-content">
                                                            <img src={token.image} alt={token.name} />
                                                        </div>
                                                    </div>,
                                                    document.body
                                                )}
                                            </div>
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
                                        const bondingPercentage = calculateBondingPercentage(t.marketCap);
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