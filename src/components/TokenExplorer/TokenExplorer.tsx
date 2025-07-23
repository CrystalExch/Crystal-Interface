import React, { useState, useCallback, useMemo, JSX, useEffect, useRef } from 'react';
import './TokenExplorer.css';
import { defaultMetrics } from './TokenData';
import { useNavigate } from 'react-router-dom';
import { settings } from '../../settings';
import { CrystalLaunchpadRouter } from '../../abis/CrystalLaunchpadRouter';
import { encodeFunctionData } from 'viem';

//ICONS
import telegram from '../../assets/telegram.png';
import { Search, EyeOff } from 'lucide-react';
import copyicon from '../../assets/copy.svg';
import lightning from '../../assets/flash.png';
import monadicon from '../../assets/monadlogo.svg';
import camera from '../../assets/camera.svg';
import filter from '../../assets/filter.svg';
import empty from '../../assets/empty.svg';
interface Token {
    id: string;
    name: string;
    symbol: string;
    image: string;
    price: number;
    change24h: number;
    marketCap: number;
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
    contractAddress: string;
    website: string;
    twitterHandle: string;
    progress: number;
    status: 'new' | 'graduating' | 'graduated';
    description: string;
    created: string;
    bondingAmount: number;
    tokenAddress: string;
}

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TokenExplorerProps {
    setpopup: (popup: number) => void;
    appliedFilters?: any;
    onOpenFiltersForColumn: (columnType: 'new' | 'graduating' | 'graduated') => void;
    activeFilterTab?: string;
    sendUserOperationAsync: any;
    waitForTxReceipt: any;



}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    const showTooltip = useCallback(() => setIsVisible(true), []);
    const hideTooltip = useCallback(() => setIsVisible(false), []);
    return (
        <div
            className="tooltip-container"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
        >
            {children}
            <div className={`tooltip tooltip-${position} fade-popup ${isVisible ? 'visible' : ''}`}>
                <div className="tooltip-content">
                    {content}
                    <div className={`tooltip-arrow tooltip-arrow-${position}`}></div>
                </div>
            </div>
        </div>
    );
};

const TokenExplorer: React.FC<TokenExplorerProps> = ({ setpopup, appliedFilters, activeFilterTab, onOpenFiltersForColumn, sendUserOperationAsync, waitForTxReceipt }) => {
    const [hoveredToken, setHoveredToken] = useState<string | null>(null);
    const navigate = useNavigate();
    const [newTokensAmount, setNewTokensAmount] = useState<string>(() => {
        const cached = localStorage.getItem('explorer-quickbuy-new');
        return cached || '0';
    });
    const handleTokenClick = useCallback((token: Token) => {
        navigate(`/meme/${token.tokenAddress}`);
    }, [navigate]);
    const [graduatingTokensAmount, setGraduatingTokensAmount] = useState<string>(() => {
        const cached = localStorage.getItem('explorer-quickbuy-graduating');
        return cached || '0';
    });

    const [graduatedTokensAmount, setGraduatedTokensAmount] = useState<string>(() => {
        const cached = localStorage.getItem('explorer-quickbuy-graduated');
        return cached || '0';
    });

    const wsRef = useRef<WebSocket | null>(null);
    const seenLogs = useRef<Set<string>>(new Set());
    const handleNewTokensAmountChange = useCallback((value: string) => {
        const cleanValue = value.replace(/[^0-9.]/g, '');
        setNewTokensAmount(cleanValue);
        localStorage.setItem('explorer-quickbuy-new', cleanValue);
    }, []);

    const handleGraduatingTokensAmountChange = useCallback((value: string) => {
        const cleanValue = value.replace(/[^0-9.]/g, '');
        setGraduatingTokensAmount(cleanValue);
        localStorage.setItem('explorer-quickbuy-graduating', cleanValue);
    }, []);

    const handleGraduatedTokensAmountChange = useCallback((value: string) => {
        const cleanValue = value.replace(/[^0-9.]/g, '');
        setGraduatedTokensAmount(cleanValue);
        localStorage.setItem('explorer-quickbuy-graduated', cleanValue);
    }, []);

    const [hiddenTokens, setHiddenTokens] = useState<Set<string>>(new Set());
    const hideToken = useCallback((tokenId: string) => {
        setHiddenTokens(prev => new Set([...prev, tokenId]));
    }, []);

    const applyFiltersToTokens = useCallback((tokens: Token[], filters: any): Token[] => {
        if (!filters) return tokens;

        return tokens.filter(token => {
            // if (filters.ageMin && token.created < parseInt(filters.ageMin)) return false;
            // if (filters.ageMax && token.created > parseInt(filters.ageMax)) return false;

            if (filters.holdersMin && token.holders < parseInt(filters.holdersMin)) return false;
            if (filters.holdersMax && token.holders > parseInt(filters.holdersMax)) return false;

            if (filters.proTradersMin && token.proTraders < parseInt(filters.proTradersMin)) return false;
            if (filters.proTradersMax && token.proTraders > parseInt(filters.proTradersMax)) return false;

            if (filters.kolTradersMin && token.kolTraders < parseInt(filters.kolTradersMin)) return false;
            if (filters.kolTradersMax && token.kolTraders > parseInt(filters.kolTradersMax)) return false;

            if (filters.top10HoldingMin && token.top10Holding < parseFloat(filters.top10HoldingMin)) return false;
            if (filters.top10HoldingMax && token.top10Holding > parseFloat(filters.top10HoldingMax)) return false;

            if (filters.devHoldingMin && token.devHolding < parseFloat(filters.devHoldingMin)) return false;
            if (filters.devHoldingMax && token.devHolding > parseFloat(filters.devHoldingMax)) return false;

            if (filters.sniperHoldingMin && token.sniperHolding < parseFloat(filters.sniperHoldingMin)) return false;
            if (filters.sniperHoldingMax && token.sniperHolding > parseFloat(filters.sniperHoldingMax)) return false;

            if (filters.bundleHoldingMin && token.bundleHolding < parseFloat(filters.bundleHoldingMin)) return false;
            if (filters.bundleHoldingMax && token.bundleHolding > parseFloat(filters.bundleHoldingMax)) return false;

            if (filters.insiderHoldingMin && token.insiderHolding < parseFloat(filters.insiderHoldingMin)) return false;
            if (filters.insiderHoldingMax && token.insiderHolding > parseFloat(filters.insiderHoldingMax)) return false;

            if (filters.marketCapMin && token.marketCap < parseFloat(filters.marketCapMin)) return false;
            if (filters.marketCapMax && token.marketCap > parseFloat(filters.marketCapMax)) return false;

            if (filters.volume24hMin && token.volume24h < parseFloat(filters.volume24hMin)) return false;
            if (filters.volume24hMax && token.volume24h > parseFloat(filters.volume24hMax)) return false;

            if (filters.globalFeesMin && token.globalFeesPaid < parseFloat(filters.globalFeesMin)) return false;
            if (filters.globalFeesMax && token.globalFeesPaid > parseFloat(filters.globalFeesMax)) return false;

            if (filters.buyTransactionsMin && token.buyTransactions < parseInt(filters.buyTransactionsMin)) return false;
            if (filters.buyTransactionsMax && token.buyTransactions > parseInt(filters.buyTransactionsMax)) return false;

            if (filters.sellTransactionsMin && token.sellTransactions < parseInt(filters.sellTransactionsMin)) return false;
            if (filters.sellTransactionsMax && token.sellTransactions > parseInt(filters.sellTransactionsMax)) return false;

            if (filters.priceMin && token.price < parseFloat(filters.priceMin)) return false;
            if (filters.priceMax && token.price > parseFloat(filters.priceMax)) return false;

            if (filters.searchKeywords) {
                const keywords = filters.searchKeywords.toLowerCase().split(',').map((k: string) => k.trim());
                const tokenText = `${token.name} ${token.symbol} ${token.description}`.toLowerCase();
                const hasKeyword = keywords.some((keyword: string) => tokenText.includes(keyword));
                if (!hasKeyword) return false;
            }

            if (filters.excludeKeywords) {
                const excludeKeywords = filters.excludeKeywords.toLowerCase().split(',').map((k: string) => k.trim());
                const tokenText = `${token.name} ${token.symbol} ${token.description}`.toLowerCase();
                const hasExcludedKeyword = excludeKeywords.some((keyword: string) => tokenText.includes(keyword));
                if (hasExcludedKeyword) return false;
            }

            if (filters.hasWebsite && (!token.website || token.website === '')) return false;
            if (filters.hasTwitter && (!token.twitterHandle || token.twitterHandle === '')) return false;

            return true;
        });
    }, []);

    const [tokens, setTokens] = useState<Token[]>([]);

    const filteredNewTokens = useMemo<Token[]>(() => {
        const base = tokens.filter((t: Token) => t.status === 'new' && !hiddenTokens.has(t.id));
        return appliedFilters && activeFilterTab === 'new'
            ? applyFiltersToTokens(base, appliedFilters)
            : base;
    }, [tokens, hiddenTokens, appliedFilters, activeFilterTab, applyFiltersToTokens]);

    const filteredGraduatingTokens = useMemo<Token[]>(() => {
        const base = tokens.filter((t: Token) => t.status === 'graduating' && !hiddenTokens.has(t.id));
        return appliedFilters && activeFilterTab === 'graduating'
            ? applyFiltersToTokens(base, appliedFilters)
            : base;
    }, [tokens, hiddenTokens, appliedFilters, activeFilterTab, applyFiltersToTokens]);

    const filteredGraduatedTokens = useMemo<Token[]>(() => {
        const base = tokens.filter((t: Token) => t.status === 'graduated' && !hiddenTokens.has(t.id));
        return appliedFilters && activeFilterTab === 'graduated'
            ? applyFiltersToTokens(base, appliedFilters)
            : base;
    }, [tokens, hiddenTokens, appliedFilters, activeFilterTab, applyFiltersToTokens]);


    const getBondingColor = useCallback((bondingAmount: number) => {
        if (bondingAmount < 25) return '#ee5b5bff';
        if (bondingAmount < 50) return '#f59e0b';
        if (bondingAmount < 75) return '#eab308';
        return '#43e17dff';
    }, []);

    const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        if (e.target.value === '0') {
            e.target.select();
        }
    }, []);
    const handleImageSearch = useCallback((imageUrl: string, tokenName: string) => {
        const yandexUrl = `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(imageUrl)}`;
        window.open(yandexUrl, '_blank', 'noopener,noreferrer');
    }, []);



    const formatNumber = useCallback((num: number): string => {
        if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
        if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
        return `$${num.toFixed(2)}`;
    }, []);

const formatPrice = useCallback((price: number): string => {
    if (price >= 1e12) {
        return `$${(price / 1e12).toFixed(1)}T`;
    } else if (price >= 1e9) {
        return `$${(price / 1e9).toFixed(1)}B`;
    } else if (price >= 1e6) {
        return `$${(price / 1e6).toFixed(1)}M`;
    } else if (price >= 1e3) {
        return `$${(price / 1e3).toFixed(1)}K`;
    }
    return `$${price.toFixed(2)}`;
}, []);


    const formatTimeAgo = useCallback((timeString: string): string => {
        if (timeString.includes('h ago')) {
            return timeString.replace(' ago', '');
        }
        if (timeString.includes('d ago')) {
            const days = parseInt(timeString);
            return `${days * 24}h`;
        }
        if (timeString.includes('w ago')) {
            const weeks = parseInt(timeString);
            return `${weeks * 7 * 24}h`;
        }
        if (timeString.includes('m ago')) {
            return timeString.replace(' ago', '');
        }
        if (timeString.includes('s ago')) {
            return timeString.replace(' ago', '');
        }
        return timeString;
    }, []);

    const copyToClipboard = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }, []);

    const createColorGradient = useCallback((baseColor: string) => {
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const lighterR = Math.min(255, Math.round(r + (255 - r) * 0.3));
        const lighterG = Math.min(255, Math.round(g + (255 - g) * 0.3));
        const lighterB = Math.min(255, Math.round(b + (255 - b) * 0.3));

        const darkerR = Math.round(r * 0.7);
        const darkerG = Math.round(g * 0.7);
        const darkerB = Math.round(b * 0.7);

        return {
            start: `rgb(${darkerR}, ${darkerG}, ${darkerB})`,
            mid: baseColor,
            end: `rgb(${lighterR}, ${lighterG}, ${lighterB})`
        };
    }, []);

    const [loadingTokens, setLoadingTokens] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        setTimeout(() => setIsLoading(false), 1000);
    }, []);

    const eventTopic = '0xfe210c99153843bc67efa2e9a61ec1d63c505e379b9dcf05a9520e84e36e6063';
    const router = settings.chainConfig[activechain].launchpadRouter.toLowerCase()
    const updateTopic = '0x797f1d495432fad97f05f9fdae69fbc68c04742c31e6dfcba581332bd1e7272a';
    const TOTAL_SUPPLY = 1_000_000_000;
    useEffect(() => {
        wsRef.current?.close();
        seenLogs.current.clear();

        // Open new socket
        const ws = new WebSocket('wss://testnet-rpc.monad.xyz');
        wsRef.current = ws;

        // Keep track of subscribed markets to avoid duplicate subscriptions
        const subscribedMarkets = new Set();
        let subscriptionId = 1;

        ws.onopen = () => {
            // Subscribe to new pair events from the router
            ws.send(JSON.stringify({
                id: subscriptionId++,
                jsonrpc: '2.0',
                method: 'eth_subscribe',
                params: ['logs', { address: router, topics: [eventTopic] }]
            }));

            // Subscribe to existing market addresses for update events
            // If you have existing tokens, subscribe to their market addresses
            tokens.forEach(token => {
                if (!subscribedMarkets.has(token.contractAddress.toLowerCase())) {
                    ws.send(JSON.stringify({
                        id: subscriptionId++,
                        jsonrpc: '2.0',
                        method: 'eth_subscribe',
                        params: ['logs', { address: token.contractAddress, topics: [updateTopic] }]
                    }));
                    subscribedMarkets.add(token.contractAddress.toLowerCase());
                }
            });
        };

        ws.onerror = console.error;

        ws.onmessage = async ({ data }) => {
            const msg = JSON.parse(data);
            console.log("Received message:", msg);

            if (msg.method !== 'eth_subscription') return;

            const { transactionHash, logIndex, topics, data: raw, address } = msg.params.result;
            console.log("Event details:", { transactionHash, logIndex, topics, address });

            const key = `${transactionHash}-${logIndex}`;
            if (seenLogs.current.has(key)) return;
            seenLogs.current.add(key);

            // New pair event from router?
            if (topics[0] === eventTopic && address.toLowerCase() === router.toLowerCase()) {
                const marketAddress = `0x${topics[1].slice(26)}`;
                const tokenAddress = `0x${topics[2].slice(26)}`;

                // Subscribe to this new market's update events
                if (!subscribedMarkets.has(marketAddress.toLowerCase())) {
                    ws.send(JSON.stringify({
                        id: subscriptionId++,
                        jsonrpc: '2.0',
                        method: 'eth_subscribe',
                        params: ['logs', { address: marketAddress, topics: [updateTopic] }]
                    }));
                    subscribedMarkets.add(marketAddress.toLowerCase());
                    console.log("Subscribed to market updates:", marketAddress);
                }

                const hex = raw.replace(/^0x/, '');
                const offsets = [
                    parseInt(hex.slice(0, 64), 16),
                    parseInt(hex.slice(64, 128), 16),
                    parseInt(hex.slice(128, 192), 16),
                ];
                const readString = (at) => {
                    const start = at * 2;
                    const len = parseInt(hex.slice(start, start + 64), 16);
                    const dataHex = hex.slice(start + 64, start + 64 + len * 2);
                    return Array.from(dataHex.match(/.{1,2}/g)!)
                        .map(b => String.fromCharCode(parseInt(b, 16)))
                        .join('');
                };

                const name = readString(offsets[0]);
                const symbol = readString(offsets[1]);
                const cid = readString(offsets[2]);

                let meta;
                try {
                    const res = await fetch(`https://ipfs.io/ipfs/${cid}`);
                    meta = await res.json();
                } catch {
                    return;
                }

                const imageUrl = meta.image.startsWith('ipfs://')
                    ? meta.image.replace(/^ipfs:\/\//, 'https://ipfs.io/ipfs/')
                    : meta.image;

                setTokens(prev => [
                    {
                        ...defaultMetrics,
                        id: marketAddress,
                        contractAddress: marketAddress,
                        tokenAddress,
                        name,
                        symbol,
                        image: imageUrl,
                        description: meta.description,
                        twitterHandle: meta.twitter ?? '',
                        website: meta.website ?? '',
                        telegram: meta.telegram ?? '',
                        discord: meta.discord ?? '',
                        marketCap: defaultMetrics.price * TOTAL_SUPPLY,
                    },
                    ...prev
                ]);
            }
            // Update event from a market contract?
            else if (topics[0] === updateTopic) {
                const marketAddress = address; // The address field tells us which market emitted this
                const hex = raw.replace(/^0x/, '');

                // Decode the event data properly
                const amounts = BigInt('0x' + hex.slice(0, 64));
                const isBuy = BigInt('0x' + hex.slice(64, 128));
                const price = BigInt('0x' + hex.slice(128, 192));
                const transactionCounts = BigInt('0x' + hex.slice(192, 256));

                // Decode amounts: split into amountIn (high 128 bits) and amountOut (low 128 bits)
                const amountOut = Number(amounts & ((1n << 128n) - 1n)) / 1e18; // Convert from wei
                // Convert price from 18 decimal precision
                const priceDecimal = Number(price) / 1e18;

                // Decode transaction counts: split into buyCount (high 128 bits) and sellCount (low 128 bits)
                const buyCount = Number(transactionCounts >> 128n);
                const sellCount = Number(transactionCounts & ((1n << 128n) - 1n));

                // Calculate volume based on transaction type
                // For buys: user sends ETH (amountIn), gets tokens (amountOut)
                // For sells: user sends tokens (amountIn), gets ETH (amountOut)
                // Volume should be in ETH terms

                console.log('Update Event Data:', {
                    marketAddress,
                    caller: `0x${topics[1].slice(26)}`,
                    amountOut,
                    isBuy: isBuy === 1n,
                    price: priceDecimal,
                    buyCount,
                    sellCount,
                });

                setTokens(prev =>
                    prev.map(token =>
                        token.id.toLowerCase() !== marketAddress.toLowerCase()
                            ? token
                            : {
                                ...token,
                                price: priceDecimal,
                                marketCap: TOTAL_SUPPLY * priceDecimal,
                                buyTransactions: token.buyTransactions + buyCount,
                                sellTransactions: token.sellTransactions + sellCount,
                                // Accumulate volume in ETH terms (convert from wei)
                            }
                    )
                );
            }
        };

        return () => {
            ws.close();
            wsRef.current = null;
            seenLogs.current.clear();
        };
    }, [router, eventTopic, updateTopic, setTokens]); // Remove tokens from dependencies to avoid infinite loop







    const handleQuickBuy = useCallback(
        async (token: Token, amount: string) => {
            setLoadingTokens(prev => new Set(prev).add(token.id));
            try {
                const value = BigInt(amount) * 10n ** 18n;
                const uo = {
                    target: router,
                    data: encodeFunctionData({
                        abi: CrystalLaunchpadRouter,
                        functionName: 'buy',
                        args: [token.tokenAddress as `0x${string}`],
                    }),
                    value,
                };
                const op = await sendUserOperationAsync({ uo });
                await waitForTxReceipt(op.hash);
            } catch (err) {
                console.error('QuickBuy failed', err);
            } finally {
                setLoadingTokens(prev => {
                    const s = new Set(prev);
                    s.delete(token.id);
                    return s;
                });
            }
        },
        [router, sendUserOperationAsync, waitForTxReceipt]
    );




    const handleTwitterOpen = useCallback((twitterHandle: string) => {
        const twitterUrl = `https://twitter.com/${twitterHandle}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    }, []);
    const handleWebsiteOpen = useCallback((website: string) => {
        if (!website) return;
        const url = website.startsWith('http') ? website : `https://${website}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }, []);
    const handleTwitterContractSearch = useCallback((contractAddress: string) => {
        const twitterUrl = `https://twitter.com/search?q=${contractAddress}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    }, []);

    const handleTokenHover = useCallback((tokenId: string) => {
        setHoveredToken(tokenId);
    }, []);

    const handleTokenLeave = useCallback(() => {
        setHoveredToken(null);
    }, []);

    const TokenRow = useMemo(() => React.memo(({ token, quickbuyAmount, onHideToken, isLoading }: {
        token: Token; quickbuyAmount: string; onHideToken: (tokenId: string) => void; isLoading: boolean;
    }) => {
        const totalTraders = useMemo(() =>
            token.holders + token.proTraders + token.kolTraders, [token.holders, token.proTraders, token.kolTraders]
        );
        const showBondingAmount = (token.status === 'new' || token.status === 'graduating') && hoveredToken === token.id;

        const onMouseEnter = useCallback(() => handleTokenHover(token.id), [token.id, handleTokenHover]);
        const onCopyClick = useCallback((e: React.MouseEvent) => {
            e.stopPropagation();
            copyToClipboard(token.tokenAddress);
        }, [token.tokenAddress]);

        const onTwitterClick = useCallback((e: React.MouseEvent) => {
            e.stopPropagation();
            handleTwitterOpen(token.twitterHandle);

        }, [token.twitterHandle]);

        const onWebsiteClick = useCallback((e: React.MouseEvent) => {
            e.stopPropagation();
            handleWebsiteOpen(token.website);
        }, [token.website]);

        const onTwitterContractSearch = useCallback((e: React.MouseEvent) => {
            e.stopPropagation();
            handleTwitterContractSearch(token.tokenAddress);
        }, [token.tokenAddress]);
        const onQuickBuyClick = useCallback((e: React.MouseEvent) => {
            e.stopPropagation();
            handleQuickBuy(token, quickbuyAmount);
        }, [token, quickbuyAmount]);

        const onHideClick = useCallback((e: React.MouseEvent) => {
            e.stopPropagation();
            onHideToken(token.id);
        }, [token.id, onHideToken]);
        const buyPercentage = useMemo(() =>
            (token.buyTransactions / (token.buyTransactions + token.sellTransactions)) * 100,
            [token.buyTransactions, token.sellTransactions]
        );
        const sellPercentage = useMemo(() =>
            (token.sellTransactions / (token.buyTransactions + token.sellTransactions)) * 100,
            [token.buyTransactions, token.sellTransactions]
        );

        return (
            <div
                className="explorer-token-row"
                onMouseEnter={onMouseEnter}
                onMouseLeave={handleTokenLeave}
                onClick={() => handleTokenClick(token)}
            >
                <Tooltip content="Hide Token">
                    <button
                        className="explorer-hide-button"
                        onClick={onHideClick}
                        title="Hide token"
                    >
                        <EyeOff size={16} />
                    </button>
                </Tooltip>
                <div
                    className={`bonding-amount-display ${showBondingAmount ? 'visible' : ''}`}
                    style={{
                        color: getBondingColor(token.bondingAmount)
                    }}
                >
                    BONDING: {(token.bondingAmount)}%
                </div>
                <div className="explorer-token-left">
                    <div
                        className={`explorer-token-image-container ${token.status === 'graduated' ? 'graduated' : ''}`}
                        onClick={() => handleImageSearch(token.image, token.name)}
                        style={
                            token.status === 'graduated'
                                ? {}
                                : {
                                    '--progress-angle': `${(token.bondingAmount / 100) * 360}deg`,
                                    '--progress-color-start': createColorGradient(getBondingColor(token.bondingAmount)).start,
                                    '--progress-color-mid': createColorGradient(getBondingColor(token.bondingAmount)).mid,
                                    '--progress-color-end': createColorGradient(getBondingColor(token.bondingAmount)).end,
                                } as React.CSSProperties
                        }
                    >
                        <div className="explorer-progress-spacer">
                            <div className="explorer-image-wrapper">
                                <img
                                    src={token.image}
                                    alt={token.name}
                                    className="explorer-token-image"
                                />
                                <div className="explorer-image-overlay">
                                    <img className="camera-icon" src={camera} alt="Inspect" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <span className="explorer-contract-address">
                        {token.tokenAddress.slice(0, 6)}...{token.tokenAddress.slice(-4)}
                    </span>
                </div>
                <div className="explorer-token-details">
                    <div className="explorer-detail-section">
                        <div className="explorer-top-row">
                            <div className="explorer-token-info">
                                <h3 className="explorer-token-symbol">{token.symbol}</h3>
                                <div className="explorer-token-name-container">
                                    <p className="explorer-token-name">{token.name}</p>
                                    <button
                                        className="explorer-copy-btn"
                                        onClick={onCopyClick}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M 4 2 C 2.895 2 2 2.895 2 4 L 2 18 L 4 18 L 4 4 L 18 4 L 18 2 L 4 2 z M 8 6 C 6.895 6 6 6.895 6 8 L 6 20 C 6 21.105 6.895 22 8 22 L 20 22 C 21.105 22 22 21.105 22 20 L 22 8 C 22 6.895 21.105 6 20 6 L 8 6 z M 8 8 L 20 8 L 20 20 L 8 20 L 8 8 z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="explorer-second-row">
                            <div className="explorer-price-section">
                                <span className="explorer-time-created">{formatTimeAgo(token.created)}</span>
                                <button
                                    className="explorer-twitter-btn"
                                    onClick={onTwitterClick}
                                    title={`Visit @${token.twitterHandle} on Twitter`}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </button>
                                <button className="explorer-website-link" onClick={onWebsiteClick}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                    </svg>
                                </button>
                                <button
                                    className="explorer-telegram-btn"
                                    onClick={onTwitterClick}
                                    title={`Share @${token.twitterHandle} on Telegram`}
                                >
                                    <img src={telegram} alt="Telegram" />
                                </button>
                                <button
                                    className="explorer-twitter-btn"
                                    onClick={onTwitterContractSearch}
                                    title={`Visit @${token.twitterHandle} on Twitter`}
                                >
                                    <Search size={14} />
                                </button>
                            </div>

                            <Tooltip content="Holders">
                                <div className="explorer-stat-item">
                                    <svg
                                        className="traders-icon"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M 8.8007812 3.7890625 C 6.3407812 3.7890625 4.3496094 5.78 4.3496094 8.25 C 4.3496094 9.6746499 5.0287619 10.931069 6.0703125 11.748047 C 3.385306 12.836193 1.4902344 15.466784 1.4902344 18.550781 C 1.4902344 18.960781 1.8202344 19.300781 2.2402344 19.300781 C 2.6502344 19.300781 2.9902344 18.960781 2.9902344 18.550781 C 2.9902344 15.330781 5.6000781 12.720703 8.8300781 12.720703 L 8.8203125 12.710938 C 8.9214856 12.710938 9.0168776 12.68774 9.1054688 12.650391 C 9.1958823 12.612273 9.2788858 12.556763 9.3476562 12.488281 C 9.4163056 12.41992 9.4712705 12.340031 9.5097656 12.25 C 9.5480469 12.160469 9.5703125 12.063437 9.5703125 11.960938 C 9.5703125 11.540938 9.2303125 11.210938 8.8203125 11.210938 C 7.1903125 11.210938 5.8691406 9.8897656 5.8691406 8.2597656 C 5.8691406 6.6297656 7.1900781 5.3105469 8.8300781 5.3105469 L 8.7890625 5.2890625 C 9.2090625 5.2890625 9.5507812 4.9490625 9.5507812 4.5390625 C 9.5507812 4.1190625 9.2107813 3.7890625 8.8007812 3.7890625 z M 14.740234 3.8007812 C 12.150234 3.8007812 10.060547 5.9002344 10.060547 8.4902344 L 10.039062 8.4707031 C 10.039063 10.006512 10.78857 11.35736 11.929688 12.212891 C 9.0414704 13.338134 7 16.136414 7 19.429688 C 7 19.839688 7.33 20.179688 7.75 20.179688 C 8.16 20.179688 8.5 19.839688 8.5 19.429688 C 8.5 15.969687 11.29 13.179688 14.75 13.179688 L 14.720703 13.160156 C 14.724012 13.160163 14.727158 13.160156 14.730469 13.160156 C 16.156602 13.162373 17.461986 13.641095 18.519531 14.449219 C 18.849531 14.709219 19.320078 14.640313 19.580078 14.320312 C 19.840078 13.990313 19.769219 13.519531 19.449219 13.269531 C 18.873492 12.826664 18.229049 12.471483 17.539062 12.205078 C 18.674662 11.350091 19.419922 10.006007 19.419922 8.4804688 C 19.419922 5.8904687 17.320234 3.8007812 14.740234 3.8007812 z M 14.730469 5.2890625 C 16.490469 5.2890625 17.919922 6.7104688 17.919922 8.4804688 C 17.919922 10.240469 16.500234 11.669922 14.740234 11.669922 C 12.980234 11.669922 11.560547 10.250234 11.560547 8.4902344 C 11.560547 6.7302344 12.98 5.3105469 14.75 5.3105469 L 14.730469 5.2890625 z M 21.339844 16.230469 C 21.24375 16.226719 21.145781 16.241797 21.050781 16.279297 L 21.039062 16.259766 C 20.649063 16.409766 20.449609 16.840469 20.599609 17.230469 C 20.849609 17.910469 20.990234 18.640156 20.990234 19.410156 C 20.990234 19.820156 21.320234 20.160156 21.740234 20.160156 C 22.150234 20.160156 22.490234 19.820156 22.490234 19.410156 C 22.490234 18.470156 22.319766 17.560703 22.009766 16.720703 C 21.897266 16.428203 21.628125 16.241719 21.339844 16.230469 z" />
                                    </svg>
                                    <span className="explorer-stat-value">{totalTraders.toLocaleString()}</span>
                                </div>
                            </Tooltip>

                            <Tooltip content="Pro Traders">
                                <div className="explorer-stat-item">
                                    <svg
                                        className="traders-icon"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M 12 2 L 12 4 L 11 4 C 10.4 4 10 4.4 10 5 L 10 10 C 10 10.6 10.4 11 11 11 L 12 11 L 12 13 L 14 13 L 14 11 L 15 11 C 15.6 11 16 10.6 16 10 L 16 5 C 16 4.4 15.6 4 15 4 L 14 4 L 14 2 L 12 2 z M 4 9 L 4 11 L 3 11 C 2.4 11 2 11.4 2 12 L 2 17 C 2 17.6 2.4 18 3 18 L 4 18 L 4 20 L 6 20 L 6 18 L 7 18 C 7.6 18 8 17.6 8 17 L 8 12 C 8 11.4 7.6 11 7 11 L 6 11 L 6 9 L 4 9 z M 18 11 L 18 13 L 17 13 C 16.4 13 16 13.4 16 14 L 16 19 C 16 19.6 16.4 20 17 20 L 18 20 L 18 22 L 20 22 L 20 20 L 21 20 C 21.6 20 22 19.6 22 19 L 22 14 C 22 13.4 21.6 13 21 13 L 20 13 L 20 11 L 18 11 z M 4 13 L 6 13 L 6 16 L 4 16 L 4 13 z" />
                                    </svg>
                                    <span className="explorer-stat-value">{token.proTraders.toLocaleString()}</span>
                                </div>
                            </Tooltip>

                            <Tooltip content="KOLs">
                                <div className="explorer-stat-item">
                                    <svg
                                        className="traders-icon"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M 2 3 L 2 4 C 2 6.7666667 3.1395226 8.7620178 4.1679688 10.304688 C 5.1964149 11.847357 6 12.944444 6 14 L 8 14 C 8 13.983831 7.9962584 13.96922 7.9960938 13.953125 C 8.97458 16.166161 10 17 10 17 L 14 17 C 14 17 15.02542 16.166161 16.003906 13.953125 C 16.003742 13.96922 16 13.983831 16 14 L 18 14 C 18 12.944444 18.803585 11.847356 19.832031 10.304688 C 20.860477 8.7620178 22 6.7666667 22 4 L 22 3 L 2 3 z M 4.1914062 5 L 6.2734375 5 C 6.337283 7.4080712 6.6187571 9.3802374 7.0078125 10.974609 C 6.6365749 10.366787 6.2230927 9.7819045 5.8320312 9.1953125 C 5.0286664 7.9902652 4.4191868 6.6549795 4.1914062 5 z M 8.3027344 5 L 15.697266 5 L 15.697266 6 L 15.693359 6 C 15.380359 11.398 13.843047 14.041 13.123047 15 L 10.882812 15 C 10.142812 14.016 8.6176406 11.371 8.3066406 6 L 8.3027344 6 L 8.3027344 5 z M 17.726562 5 L 19.808594 5 C 19.580813 6.6549795 18.971334 7.9902652 18.167969 9.1953125 C 17.776907 9.7819045 17.363425 10.366787 16.992188 10.974609 C 17.381243 9.3802374 17.662717 7.4080712 17.726562 5 z M 7 19 L 7 21 L 17 21 L 17 19 L 7 19 z" />
                                    </svg>
                                    <span className="explorer-stat-value">{token.kolTraders.toLocaleString()}</span>
                                </div>
                            </Tooltip>
                        </div>
                    </div>
                    <div className="explorer-holdings-section">
                        <Tooltip content="Sniper Holding">
                            <div className="explorer-holding-item">
                                <svg
                                    className="sniper-icon"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill={token.sniperHolding > 5 ? "#eb7070ff" : "#64ef84"}
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M 11.244141 2.0019531 L 11.244141 2.7519531 L 11.244141 3.1542969 C 6.9115518 3.5321749 3.524065 6.919829 3.1445312 11.251953 L 2.7421875 11.251953 L 1.9921875 11.251953 L 1.9921875 12.751953 L 2.7421875 12.751953 L 3.1445312 12.751953 C 3.5225907 17.085781 6.9110367 20.473593 11.244141 20.851562 L 11.244141 21.253906 L 11.244141 22.003906 L 12.744141 22.003906 L 12.744141 21.253906 L 12.744141 20.851562 C 17.076343 20.47195 20.463928 17.083895 20.841797 12.751953 L 21.244141 12.751953 L 21.994141 12.751953 L 21.994141 11.251953 L 21.244141 11.251953 L 20.841797 11.251953 C 20.462285 6.9209126 17.074458 3.5337191 12.744141 3.1542969 L 12.744141 2.7519531 L 12.744141 2.0019531 L 11.244141 2.0019531 z M 11.244141 4.6523438 L 11.244141 8.0742188 C 9.6430468 8.3817751 8.3759724 9.6507475 8.0683594 11.251953 L 4.6425781 11.251953 C 5.0091295 7.7343248 7.7260437 5.0173387 11.244141 4.6523438 z M 12.744141 4.6523438 C 16.25959 5.0189905 18.975147 7.7358303 19.341797 11.251953 L 15.917969 11.251953 C 15.610766 9.6510551 14.344012 8.3831177 12.744141 8.0742188 L 12.744141 4.6523438 z M 11.992188 9.4980469 C 13.371637 9.4980469 14.481489 10.6041 14.492188 11.982422 L 14.492188 12.021484 C 14.481501 13.40006 13.372858 14.503906 11.992188 14.503906 C 10.606048 14.503906 9.4921875 13.389599 9.4921875 12.001953 C 9.4921875 10.614029 10.60482 9.4980469 11.992188 9.4980469 z M 4.6425781 12.751953 L 8.0683594 12.751953 C 8.3760866 14.352973 9.6433875 15.620527 11.244141 15.927734 L 11.244141 19.353516 C 7.7258668 18.988181 5.0077831 16.270941 4.6425781 12.751953 z M 15.917969 12.751953 L 19.34375 12.751953 C 18.97855 16.26893 16.261295 18.986659 12.744141 19.353516 L 12.744141 15.927734 C 14.344596 15.619809 15.610176 14.35218 15.917969 12.751953 z" />
                                </svg>
                                <span
                                    className="explorer-holding-value"
                                    style={{ color: token.sniperHolding > 5 ? "#eb7070ff" : "#64ef84" }}
                                >
                                    {token.sniperHolding.toFixed(1)}%
                                </span>
                            </div>
                        </Tooltip>

                        <Tooltip content="Developer holdings percentage (red if >5%)">
                            <div className="explorer-holding-item">
                                <svg
                                    className="holding-icon"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 30 30"
                                    fill={token.devHolding > 5 ? "#eb7070ff" : "#64ef84"}
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />                                </svg>
                                <span
                                    className="explorer-holding-value"
                                    style={{ color: token.devHolding > 5 ? "#eb7070ff" : "#64ef84" }}
                                >
                                    {token.devHolding.toFixed(1)}%
                                </span>
                            </div>
                        </Tooltip>

                        <Tooltip content="Bundle Holding">
                            <div className="explorer-holding-item">
                                <svg
                                    className="holding-icon"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 128 128"
                                    fill={token.bundleHolding > 5 ? "#eb7070ff" : "#64ef84"}
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M117 68.26l-26-15a2 2 0 00-2 0l-26 15A2 2 0 0062 70v30a2 2 0 001 1.73l26 15a2 2 0 002 0l26-15a2 2 0 001-1.73V70A2 2 0 00117 68.26zm-27-11l22.46 13L90 82.7 68 70zM66 73.46L88 86.15v25.41L66 98.86zm26 38.1V86.18L114 74V98.85zM56 102.25l-16 8.82V86.72l17-10a2 2 0 10-2-3.44l-17 10L15.55 70.56 38 57.82l17 8.95a2 2 0 001.86-3.54l-18-9.46a2 2 0 00-1.92 0L11 68.53a2 2 0 00-1 1.74V99.73a2 2 0 001 1.74L37 116.2a2 2 0 002 0l19-10.46a2 2 0 10-1.92-3.5zm-42-28L36 86.74V111L14 98.56zM38 49a2 2 0 002-2V28.46L62 41.15V61a2 2 0 004 0V41.15L88 28.46V47a2 2 0 004 0V25a2 2 0 00-1-1.73l-26-15a2 2 0 00-2 0l-26 15A2 2 0 0036 25V47A2 2 0 0038 49zM64 12.31L86 25 64 37.69 42 25z" />
                                </svg>
                                <span
                                    className="explorer-holding-value"
                                    style={{ color: token.bundleHolding > 5 ? "#eb7070ff" : "#64ef84" }}
                                >
                                    {token.bundleHolding.toFixed(1)}%
                                </span>
                            </div>
                        </Tooltip>

                        <Tooltip content="Insider Holding">
                            <div className="explorer-holding-item">
                                <svg
                                    className="holding-icon"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 32 32"
                                    fill={token.insiderHolding > 5 ? "#eb7070ff" : "#64ef84"}
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M 16 3 C 14.0625 3 12.570313 3.507813 11.5 4.34375 C 10.429688 5.179688 9.8125 6.304688 9.375 7.34375 C 8.9375 8.382813 8.65625 9.378906 8.375 10.09375 C 8.09375 10.808594 7.859375 11.085938 7.65625 11.15625 C 4.828125 12.160156 3 14.863281 3 18 L 3 19 L 4 19 C 5.347656 19 6.003906 19.28125 6.3125 19.53125 C 6.621094 19.78125 6.742188 20.066406 6.8125 20.5625 C 6.882813 21.058594 6.847656 21.664063 6.9375 22.34375 C 6.984375 22.683594 7.054688 23.066406 7.28125 23.4375 C 7.507813 23.808594 7.917969 24.128906 8.375 24.28125 C 9.433594 24.632813 10.113281 24.855469 10.53125 25.09375 C 10.949219 25.332031 11.199219 25.546875 11.53125 26.25 C 11.847656 26.917969 12.273438 27.648438 13.03125 28.1875 C 13.789063 28.726563 14.808594 29.015625 16.09375 29 C 18.195313 28.972656 19.449219 27.886719 20.09375 26.9375 C 20.417969 26.460938 20.644531 26.050781 20.84375 25.78125 C 21.042969 25.511719 21.164063 25.40625 21.375 25.34375 C 22.730469 24.9375 23.605469 24.25 24.09375 23.46875 C 24.582031 22.6875 24.675781 21.921875 24.8125 21.40625 C 24.949219 20.890625 25.046875 20.6875 25.375 20.46875 C 25.703125 20.25 26.453125 20 28 20 L 29 20 L 29 19 C 29 17.621094 29.046875 16.015625 28.4375 14.5 C 27.828125 12.984375 26.441406 11.644531 24.15625 11.125 C 24.132813 11.121094 24.105469 11.132813 24 11 C 23.894531 10.867188 23.734375 10.601563 23.59375 10.25 C 23.3125 9.550781 23.042969 8.527344 22.59375 7.46875 C 22.144531 6.410156 21.503906 5.269531 20.4375 4.40625 C 19.371094 3.542969 17.90625 3 16 3 Z M 16 5 C 17.539063 5 18.480469 5.394531 19.1875 5.96875 C 19.894531 6.542969 20.367188 7.347656 20.75 8.25 C 21.132813 9.152344 21.402344 10.128906 21.75 11 C 21.921875 11.433594 22.109375 11.839844 22.40625 12.21875 C 22.703125 12.597656 23.136719 12.96875 23.6875 13.09375 C 25.488281 13.503906 26.15625 14.242188 26.5625 15.25 C 26.871094 16.015625 26.878906 17.066406 26.90625 18.09375 C 25.796875 18.1875 24.886719 18.386719 24.25 18.8125 C 23.40625 19.378906 23.050781 20.25 22.875 20.90625 C 22.699219 21.5625 22.632813 22.042969 22.40625 22.40625 C 22.179688 22.769531 21.808594 23.128906 20.78125 23.4375 C 20.070313 23.652344 19.558594 24.140625 19.21875 24.59375 C 18.878906 25.046875 18.675781 25.460938 18.4375 25.8125 C 17.960938 26.515625 17.617188 26.980469 16.0625 27 C 15.078125 27.011719 14.550781 26.820313 14.1875 26.5625 C 13.824219 26.304688 13.558594 25.929688 13.3125 25.40625 C 12.867188 24.460938 12.269531 23.765625 11.53125 23.34375 C 10.792969 22.921875 10.023438 22.714844 9 22.375 C 8.992188 22.359375 8.933594 22.285156 8.90625 22.09375 C 8.855469 21.710938 8.886719 21.035156 8.78125 20.28125 C 8.675781 19.527344 8.367188 18.613281 7.5625 17.96875 C 7 17.515625 6.195313 17.289063 5.25 17.15625 C 5.542969 15.230469 6.554688 13.65625 8.3125 13.03125 C 9.375 12.65625 9.898438 11.730469 10.25 10.84375 C 10.601563 9.957031 10.851563 8.96875 11.21875 8.09375 C 11.585938 7.21875 12.019531 6.480469 12.71875 5.9375 C 13.417969 5.394531 14.402344 5 16 5 Z M 13 9 C 12.449219 9 12 9.671875 12 10.5 C 12 11.328125 12.449219 12 13 12 C 13.550781 12 14 11.328125 14 10.5 C 14 9.671875 13.550781 9 13 9 Z M 17 9 C 16.449219 9 16 9.671875 16 10.5 C 16 11.328125 16.449219 12 17 12 C 17.550781 12 18 11.328125 18 10.5 C 18 9.671875 17.550781 9 17 9 Z" />                                </svg>
                                <span
                                    className="explorer-holding-value"
                                    style={{ color: token.insiderHolding > 5 ? "#eb7070ff" : "#64ef84" }}
                                >
                                    {token.insiderHolding.toFixed(1)}%
                                </span>
                            </div>
                        </Tooltip>

                        <Tooltip content="Top 10 holders percentage">
                            <div className="explorer-holding-item">
                                <svg
                                    className="holding-icon"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 32 32"
                                    fill={token.top10Holding > 5 ? "#eb7070ff" : "#64ef84"}
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M 15 4 L 15 6 L 13 6 L 13 8 L 15 8 L 15 9.1875 C 14.011719 9.554688 13.25 10.433594 13.0625 11.5 C 12.277344 11.164063 11.40625 11 10.5 11 C 6.921875 11 4 13.921875 4 17.5 C 4 19.792969 5.199219 21.8125 7 22.96875 L 7 27 L 25 27 L 25 22.96875 C 26.800781 21.8125 28 19.792969 28 17.5 C 28 13.921875 25.078125 11 21.5 11 C 20.59375 11 19.722656 11.164063 18.9375 11.5 C 18.75 10.433594 17.988281 9.554688 17 9.1875 L 17 8 L 19 8 L 19 6 L 17 6 L 17 4 Z M 16 11 C 16.5625 11 17 11.4375 17 12 C 17 12.5625 16.5625 13 16 13 C 15.4375 13 15 12.5625 15 12 C 15 11.4375 15.4375 11 16 11 Z M 10.5 13 C 12.996094 13 15 15.003906 15 17.5 L 15 22 L 10.5 22 C 8.003906 22 6 19.996094 6 17.5 C 6 15.003906 8.003906 13 10.5 13 Z M 21.5 13 C 23.996094 13 26 15.003906 26 17.5 C 26 19.996094 23.996094 22 21.5 22 L 17 22 L 17 17.5 C 17 15.003906 19.003906 13 21.5 13 Z M 9 24 L 23 24 L 23 25 L 9 25 Z" />
                                </svg>
                                <span
                                    className="explorer-holding-value"
                                    style={{ color: token.top10Holding > 5 ? "#eb7070ff" : "#64ef84" }}
                                >
                                    {token.top10Holding.toFixed(1)}%
                                </span>
                            </div>
                        </Tooltip>
                    </div>

                </div>
                <div className="explorer-third-row">
                    <Tooltip content="Market Cap">
                        <div className="explorer-market-cap">
                            <span className="mc-label">MC</span>
                            <span className="explorer-market-cap">{formatPrice(token.marketCap)}</span>
                        </div>
                    </Tooltip>
                    <Tooltip content="Volume">
                        <div className="explorer-volume">
                            <span className="mc-label">V</span>
                            <span className="mc-value">{formatPrice(token.volume24h)}</span>
                        </div>
                    </Tooltip>
                    <div className="explorer-third-row-section">
                        <Tooltip content="Global Fees Paid">
                            <div className="explorer-stat-item">
                                <span className="explorer-fee-label ">F</span>
                                <img className="explorer-fee-icon" src={monadicon} alt="Fee Icon" />
                                <span className="explorer-fee-total">{(token.globalFeesPaid)}</span>
                            </div>
                        </Tooltip>
                        <Tooltip content="Transactions">
                            <div className="explorer-tx-bar">
                                <div className="explorer-tx-header">
                                    <span className="explorer-tx-label">TX</span>
                                    <span className="explorer-tx-total">{(token.buyTransactions + token.sellTransactions).toLocaleString()}</span>
                                </div>
                                <div className="explorer-tx-visual-bar">
                                    <div
                                        className="explorer-tx-buy-portion"
                                        style={{
                                            width: `${buyPercentage}%`
                                        }}
                                    ></div>
                                    <div
                                        className="explorer-tx-sell-portion"
                                        style={{
                                            width: `${sellPercentage}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </Tooltip>
                    </div>

                    <div className="explorer-actions-section">
                        <button
                            className="explorer-quick-buy-btn"
                            onClick={onQuickBuyClick}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="quickbuy-loading-spinner"></div>
                            ) : (
                                <>
                                    <img className="explorer-quick-buy-icon" src={lightning} alt="Lightning Bolt" />
                                    {quickbuyAmount} MON
                                </>
                            )}
                        </button>
                    </div>

                </div>

            </div>
        );
    }), [
        copyToClipboard,
        formatNumber,
        formatPrice,
        formatTimeAgo,
        handleQuickBuy,
        handleTwitterOpen,
        handleWebsiteOpen,
        handleTokenHover,
        handleTokenLeave,
        handleImageSearch,
        getBondingColor,
        createColorGradient,
    ]);


    return (
        <div className="explorer-main">
            <div className="explorer-container">
                <div className="explorer-columns">
                    <div className="explorer-column">
                        <div className="explorer-column-header">
                            <div className="explorer-column-title-section">
                                <h2 className="explorer-column-title">
                                    New Pairs
                                </h2>
                            </div>
                            <div className="explorer-column-title-right">
                                <div className="explorer-quickbuy-container">
                                    <img className="explorer-quick-buy-search-icon" src={lightning} alt="Lightning Bolt" />
                                    <input
                                        type="text"
                                        placeholder="0"
                                        value={newTokensAmount}
                                        onChange={(e) => handleNewTokensAmountChange(e.target.value)}
                                        onFocus={handleInputFocus}
                                        className="explorer-quickbuy-input"
                                    />
                                    <img className="quickbuy-monad-icon" src={monadicon} />
                                </div>
                                <button
                                    className={`column-filter-icon ${appliedFilters && activeFilterTab === 'new' ? 'active' : ''}`}
                                    onClick={() => onOpenFiltersForColumn('new')}
                                    title="Filter New Pairs"
                                >
                                    <img className="filter-icon" src={filter} />
                                    {appliedFilters && activeFilterTab === 'new' && (
                                        <span className="filter-active-dot"></span>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="explorer-tokens-list">
                            {isLoading ? (
                                Array.from({ length: 14 }).map((_, index) => (
                                    <div key={`skeleton-${index}`} className="explorer-token-row loading">
                                        <div className="explorer-token-left">
                                            <div className="explorer-token-image-container">
                                                <div className="explorer-progress-spacer">
                                                    <div className="explorer-image-wrapper">
                                                        <img className="explorer-token-image" alt="loading" />
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="explorer-contract-address">Loading...</span>
                                        </div>
                                        <div className="explorer-token-details">
                                            <div className="explorer-detail-section">
                                                <div className="explorer-top-row">
                                                    <div className="explorer-token-info">
                                                        <h3 className="explorer-token-symbol">LOAD</h3>
                                                        <p className="explorer-token-name">Loading Token</p>
                                                    </div>
                                                </div>
                                                <div className="explorer-second-row">
                                                    <span className="explorer-time-created">0h</span>
                                                    <div className="explorer-stat-item">
                                                        <span className="explorer-stat-value">0</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="explorer-holdings-section">
                                            </div>
                                        </div>
                                        <div className="explorer-third-row">
                                            <div className="explorer-market-cap">
                                                <span className="mc-label">MC</span>
                                                <span>$0</span>
                                            </div>
                                            <div className="explorer-third-row-section">
                                            </div>
                                            <div className="explorer-actions-section">
                                                <button className="explorer-quick-buy-btn">Loading</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : filteredNewTokens.length > 0 ? (
                                filteredNewTokens.map(token => (
                                    <TokenRow key={token.id} token={token} quickbuyAmount={newTokensAmount} onHideToken={hideToken} isLoading={loadingTokens.has(token.id)} />
                                ))
                            ) : (
                                <div className="no-tokens-message">
                                    <img src={empty} className="empty-icon" />
                                    No tokens match the current filters
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="explorer-column">
                        <div className="explorer-column-header">
                            <div className="explorer-column-title-section">
                                <h2 className="explorer-column-title">
                                    Graduating Tokens
                                    {appliedFilters && activeFilterTab === 'graduating' && (
                                        <span className="filtered-count">({filteredGraduatingTokens.length})</span>
                                    )}
                                </h2>

                            </div>
                            <div className="explorer-column-title-right">
                                <div className="explorer-quickbuy-container">
                                    <img className="explorer-quick-buy-search-icon" src={lightning} alt="Lightning Bolt" />
                                    <input
                                        type="text"
                                        placeholder="0"
                                        value={graduatingTokensAmount}
                                        onChange={(e) => handleGraduatingTokensAmountChange(e.target.value)}
                                        onFocus={handleInputFocus}
                                        className="explorer-quickbuy-input"
                                    />
                                    <img className="quickbuy-monad-icon" src={monadicon} />
                                </div>
                                <button
                                    className={`column-filter-icon ${appliedFilters && activeFilterTab === 'graduating' ? 'active' : ''}`}
                                    onClick={() => onOpenFiltersForColumn('graduating')}
                                    title="Filter Graduating Tokens"
                                >
                                    <img className="filter-icon" src={filter} />

                                    {appliedFilters && activeFilterTab === 'graduating' && (
                                        <span className="filter-active-dot"></span>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="explorer-tokens-list">
                            {isLoading ? (
                                Array.from({ length: 14 }).map((_, index) => (
                                    <div key={`skeleton-new-${index}`} className="explorer-token-row loading">
                                        <div className="explorer-token-left">
                                            <div className="explorer-token-image-container">
                                                <div className="explorer-progress-spacer">
                                                    <div className="explorer-image-wrapper">
                                                        <img className="explorer-token-image" alt="loading" />
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="explorer-contract-address">Loading...</span>
                                        </div>
                                        <div className="explorer-token-details">
                                            <div className="explorer-detail-section">
                                                <div className="explorer-top-row">
                                                    <div className="explorer-token-info">
                                                        <h3 className="explorer-token-symbol">LOAD</h3>
                                                        <p className="explorer-token-name">Loading Token</p>
                                                    </div>
                                                </div>
                                                <div className="explorer-second-row">
                                                    <span className="explorer-time-created">0h</span>
                                                    <div className="explorer-stat-item">
                                                        <span className="explorer-stat-value">0</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="explorer-holdings-section">
                                                {/* Skeleton holdings */}
                                            </div>
                                        </div>
                                        <div className="explorer-third-row">
                                            <div className="explorer-market-cap">
                                                <span className="mc-label">MC</span>
                                                <span>$0</span>
                                            </div>
                                            <div className="explorer-third-row-section">
                                                {/* Skeleton transaction data */}
                                            </div>
                                            <div className="explorer-actions-section">
                                                <button className="explorer-quick-buy-btn">Loading</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : filteredGraduatingTokens.length > 0 ? (
                                filteredGraduatingTokens.map(token => (
                                    <TokenRow key={token.id} token={token} quickbuyAmount={graduatingTokensAmount} onHideToken={hideToken} isLoading={loadingTokens.has(token.id)} />
                                ))
                            ) : (
                                <div className="no-tokens-message">
                                    <img src={empty} className="empty-icon" />
                                    No tokens match the current filters
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="explorer-column">
                        <div className="explorer-column-header">
                            <div className="explorer-column-title-section">
                                <h2 className="explorer-column-title">
                                    Graduated
                                    {appliedFilters && activeFilterTab === 'graduated' && (
                                        <span className="filtered-count">({filteredGraduatedTokens.length})</span>
                                    )}
                                </h2>
                            </div>
                            <div className="explorer-column-title-right">
                                <div className="explorer-quickbuy-container">
                                    <img className="explorer-quick-buy-search-icon" src={lightning} alt="Lightning Bolt" />
                                    <input
                                        type="text"
                                        placeholder="0"
                                        value={graduatedTokensAmount}
                                        onChange={(e) => handleGraduatedTokensAmountChange(e.target.value)}
                                        onFocus={handleInputFocus}
                                        className="explorer-quickbuy-input"
                                    />
                                    <img className="quickbuy-monad-icon" src={monadicon} />
                                </div>
                                <button
                                    className={`column-filter-icon ${appliedFilters && activeFilterTab === 'graduated' ? 'active' : ''}`}
                                    onClick={() => onOpenFiltersForColumn('graduated')}
                                    title="Filter Graduated Tokens"
                                >

                                    <img className="filter-icon" src={filter} />
                                    {appliedFilters && activeFilterTab === 'graduated' && (
                                        <span className="filter-active-dot"></span>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="explorer-tokens-list">
                            {isLoading ? (
                                // Render skeleton rows
                                Array.from({ length: 14 }).map((_, index) => (
                                    <div key={`skeleton-graduated-${index}`} className="explorer-token-row loading">
                                        <div className="explorer-token-left">
                                            <div className="explorer-token-image-container">
                                                <div className="explorer-progress-spacer">
                                                    <div className="explorer-image-wrapper">
                                                        <img className="explorer-token-image" alt="loading" />
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="explorer-contract-address">Loading...</span>
                                        </div>
                                        <div className="explorer-token-details">
                                            <div className="explorer-detail-section">
                                                <div className="explorer-top-row">
                                                    <div className="explorer-token-info">
                                                        <h3 className="explorer-token-symbol">LOAD</h3>
                                                        <p className="explorer-token-name">Loading Token</p>
                                                    </div>
                                                </div>
                                                <div className="explorer-second-row">
                                                    <span className="explorer-time-created">0h</span>
                                                    <div className="explorer-stat-item">
                                                        <span className="explorer-stat-value">0</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="explorer-holdings-section">
                                                {/* Skeleton holdings */}
                                            </div>
                                        </div>
                                        <div className="explorer-third-row">
                                            <div className="explorer-market-cap">
                                                <span className="mc-label">MC</span>
                                                <span>$0</span>
                                            </div>
                                            <div className="explorer-third-row-section">
                                                {/* Skeleton transaction data */}
                                            </div>
                                            <div className="explorer-actions-section">
                                                <button className="explorer-quick-buy-btn">Loading</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : filteredGraduatedTokens.length > 0 ? (
                                filteredGraduatedTokens.map(token => (
                                    <TokenRow key={token.id} token={token} quickbuyAmount={graduatedTokensAmount} onHideToken={hideToken} isLoading={loadingTokens.has(token.id)} />
                                ))
                            ) : (
                                <div className="no-tokens-message">
                                    No tokens match the current filters
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TokenExplorer;