import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import './MemeInterface.css';
import { defaultMetrics } from '../TokenExplorer/TokenData';
import { readContracts } from '@wagmi/core';
import { encodeFunctionData } from 'viem';
import { config } from '../../wagmi';
import { settings } from '../../settings';

//files
import QuickBuyWidget from './QuickBuyWidget/QuickBuyWidget';
import MemeOrderCenter from './MemeOrderCenter/MemeOrderCenter';
import MemeTradesComponent from './MemeTradesComponent/MemeTradesComponent';

import contract from '../../assets/contract.svg';
import gas from '../../assets/gas.svg';
import slippage from '../../assets/slippage.svg';
import bribe from '../../assets/bribe.svg';
import switchicon from '../../assets/switch.svg';
import editicon from '../../assets/edit.svg';
import walleticon from '../../assets/wallet_icon.png';

// Import ABIs
const CrystalLaunchpadRouter = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_gov",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            }
        ],
        "name": "buy",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            }
        ],
        "name": "getPrice",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
            }
        ],
        "name": "sell",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

// Import Token interface from TokenExplorer
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
    created: string;
    bondingAmount: number;
    volumeDelta: number;
}

interface MemeInterfaceProps {
    tradingMode: 'spot' | 'trenches';
    sliderMode: 'presets' | 'increment' | 'slider';
    sliderPresets: number[];
    sliderIncrement: number;
    tokenList: any[];
    marketsData: any[];
    onMarketSelect: (market: any) => void;
    setSendTokenIn: (token: any) => void;
    setpopup: (value: number) => void;
    sendUserOperationAsync: any;
    waitForTxReceipt: any;
    account: {
        connected: boolean;
        address: string;
        chainId: number;
    };
    setChain: () => void;
    tokenBalances?: { [key: string]: bigint };
    tokendict?: { [key: string]: any };
}

const MemeInterface: React.FC<MemeInterfaceProps> = ({
    tradingMode,
    sliderMode,
    sliderPresets,
    sliderIncrement,
    tokenList,
    marketsData,
    onMarketSelect,
    setSendTokenIn,
    setpopup,
    sendUserOperationAsync,
    waitForTxReceipt,
    account,
    setChain,
    tokenBalances = {},
    tokendict = {}
}) => {
    
    const [tokenInfoExpanded, setTokenInfoExpanded] = useState(true);
    const [isWidgetOpen, setIsWidgetOpen] = useState(false);
    type TimePeriod = '5M' | '1H' | '6H' | '24H';
    const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('24H');
    const [activeTradeType, setActiveTradeType] = useState('buy');
    const [activeOrderType, setActiveOrderType] = useState<'market' | 'Limit'>('market');
    const [tradeAmount, setTradeAmount] = useState('');
    const [LimitPrice, setLimitPrice] = useState('');
    const [isQuoteLoading, setIsQuoteLoading] = useState(false);
    const [inputCurrency, setInputCurrency] = useState<'MON' | 'TOKEN'>('MON');
    const [sliderPercent, setSliderPercent] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [settingsExpanded, setSettingsExpanded] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState(1);
    const [slippageValue, setSlippageValue] = useState('20');
    const [priorityFee, setPriorityFee] = useState('0.01');
    const [bribeValue, setBribeValue] = useState('0.05');
    const [orderCenterHeight, setOrderCenterHeight] = useState<number>(350);
    const [isVertDragging, setIsVertDragging] = useState<boolean>(false);
    const [isOrderCenterVisible, setIsOrderCenterVisible] = useState<boolean>(true);
   const [isSigning, setIsSigning] = useState(false);
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [quoteAmount, setQuoteAmount] = useState<string>('0');
    
    // Real-time token data state
    const [liveTokenData, setLiveTokenData] = useState<Partial<Token>>({});
    
    // WebSocket refs
    const wsRef = useRef<WebSocket | null>(null);
    const marketSubRef = useRef<string | null>(null);
    
    // WebSocket constants
    const MARKET_UPDATE_EVENT = '0x797f1d495432fad97f05f9fdae69fbc68c04742c31e6dfcba581332bd1e7272a';
    const TOTAL_SUPPLY = 1e9;

    const { tokenAddress } = useParams<{ tokenAddress: string }>();
    const location = useLocation();


    // WebSocket subscription helper
    const subscribe = useCallback((ws: WebSocket, params: any, onAck?: (subId: string) => void) => {
        const reqId = Date.now();
        ws.send(JSON.stringify({
            id: reqId,
            jsonrpc: '2.0',
            method: 'eth_subscribe',
            params,
        }));
        if (!onAck) return;
        const handler = (evt: MessageEvent) => {
            const msg = JSON.parse(evt.data);
            if (msg.id === reqId && msg.result) {
                onAck(msg.result);
                ws.removeEventListener('message', handler);
            }
        };
        ws.addEventListener('message', handler);
    }, []);
    const getTokenData = (): Token | null => {
        let baseToken: Token | null = null;
        
        // First try to get from navigation state
        if (location.state?.tokenData) {
            baseToken = location.state.tokenData as Token;
        } else {
            // Fallback: try to find in tokenList
            const foundInList = tokenList.find(t => 
                t.contractAddress === tokenAddress || 
                t.tokenAddress === tokenAddress
            );
            
            if (foundInList) {
                baseToken = {
                    id: foundInList.id || foundInList.contractAddress || '',
                    tokenAddress: foundInList.contractAddress || foundInList.tokenAddress || '',
                    name: foundInList.name || '',
                    symbol: foundInList.symbol || '',
                    image: foundInList.image || '',
                    price: foundInList.price || 0.000001,
                    marketCap: foundInList.marketCap || 0,
                    change24h: foundInList.change24h || 0,
                    volume24h: foundInList.volume24h || 0,
                    holders: foundInList.holders || 0,
                    proTraders: foundInList.proTraders || 0,
                    kolTraders: foundInList.kolTraders || 0,
                    sniperHolding: foundInList.sniperHolding || 0,
                    devHolding: foundInList.devHolding || 0,
                    bundleHolding: foundInList.bundleHolding || 0,
                    insiderHolding: foundInList.insiderHolding || 0,
                    top10Holding: foundInList.top10Holding || 0,
                    buyTransactions: foundInList.buyTransactions || 0,
                    sellTransactions: foundInList.sellTransactions || 0,
                    globalFeesPaid: foundInList.globalFeesPaid || 0,
                    website: foundInList.website || '',
                    twitterHandle: foundInList.twitterHandle || '',
                    progress: foundInList.progress || 0,
                    status: foundInList.status || 'new',
                    description: foundInList.description || '',
                    created: foundInList.created || '0h ago',
                    bondingAmount: foundInList.bondingAmount || 0,
                    volumeDelta: foundInList.volumeDelta || 0
                };
            } else {
                // Last fallback: create a basic token object with default values
                baseToken = {
                    id: tokenAddress || '',
                    tokenAddress: tokenAddress || '',
                    name: 'Unknown Token',
                    symbol: 'UNKNOWN',
                    image: '',
                    ...defaultMetrics
                };
            }
        }
        
        // Merge with live data if available
        if (baseToken && liveTokenData) {
            return {
                ...baseToken,
                ...liveTokenData,
                id: baseToken.id,
                tokenAddress: baseToken.tokenAddress,
                name: baseToken.name,
                symbol: baseToken.symbol,
                image: baseToken.image,
                website: baseToken.website,
                twitterHandle: baseToken.twitterHandle,
                description: baseToken.description,
                created: baseToken.created,
                status: baseToken.status
            };
        }
        
        return baseToken;
    };
    const token = getTokenData();

    // Handle market updates from WebSocket
    const updateMarketData = useCallback((log: any) => {
        if (log.topics[0] !== MARKET_UPDATE_EVENT) return;
        
        const market = log.address.toLowerCase();
        if (market !== token?.id.toLowerCase()) return; // Only update if it's our token's market

        const hex = log.data.replace(/^0x/, '');
        const words: string[] = [];
        for (let i = 0; i < hex.length; i += 64) words.push(hex.slice(i, i + 64));

        const amounts = BigInt('0x' + words[0]);
        const isBuy = BigInt('0x' + words[1]);
        const priceRaw = BigInt('0x' + words[2]);
        const counts = BigInt('0x' + words[3]);
        
        const priceEth = Number(priceRaw) / 1e18;
        const buys = Number(counts >> 128n);
        const sells = Number(counts & ((1n << 128n) - 1n));
        const amountIn = Number(amounts >> 128n);
        const amountOut = Number(amounts & ((1n << 128n) - 1n));

        setLiveTokenData(prev => ({
            ...prev,
            price: priceEth,
            marketCap: priceEth * TOTAL_SUPPLY,
            buyTransactions: buys,
            sellTransactions: sells,
            volume24h: (prev.volume24h || 0) + (isBuy > 0 ? amountIn / 1e18 : amountOut / 1e18),
        }));
        
        // Update current price for quotes
        setCurrentPrice(priceEth);
    }, [token?.id]);

    // Setup WebSocket connection
    useEffect(() => {
        if (!token?.id) return;

        const ws = new WebSocket('wss://testnet-rpc.monad.xyz');
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connected for token:', token.symbol);
            // Subscribe to market updates for this specific token
            subscribe(ws, ['logs', { address: token.id }], (subId) => {
                marketSubRef.current = subId;
                console.log('Subscribed to market updates:', subId);
            });
        };

        ws.onmessage = ({ data }) => {
            const msg = JSON.parse(data);
            if (msg.method === 'eth_subscription' && msg.params?.result) {
                updateMarketData(msg.params.result);
            }
        };

        ws.onerror = (e) => console.error('WebSocket error:', e);
        ws.onclose = () => console.log('WebSocket closed');

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [token?.id, subscribe, updateMarketData]);

    // Get token balance and format it
    const getTokenBalance = useCallback(() => {
        if (!account.connected || !token) return '0';
        
        const tokenKey = token.tokenAddress.toLowerCase();
        const tokenInfo = tokendict[tokenKey] || tokendict[token.symbol] || {};
        const balance = tokenBalances[tokenKey] || tokenBalances[token.symbol] || BigInt(0);
        const decimals = tokenInfo.decimals || 18;
        
        const balanceNum = Number(balance) / Math.pow(10, decimals);
        return formatDisplayValue(balanceNum, 4);
    }, [account.connected, token, tokenBalances, tokendict]);
    
    // Get active chain - handle both string and object cases
    const activechain = typeof (settings as any).activechain === 'string' 
        ? (settings as any).activechain 
        : Object.keys(settings.chainConfig)[0];
    const routerAddress = settings.chainConfig[activechain]?.launchpadRouter;

   // Get token data from navigation state or fallback to tokenList, then merge with live data


    if (!token) {
        return (
            <div className="meme-interface-container">
                <div>Token not found</div>
            </div>
        );
    }

    // Fetch current price from contract
    const fetchCurrentPrice = useCallback(async () => {
        if (!token.tokenAddress || !routerAddress) return;
        
        try {
            const result = await readContracts(config, {
                contracts: [
                    {
                        abi: CrystalLaunchpadRouter,
                        address: routerAddress as `0x${string}`,
                        functionName: 'getPrice',
                        args: [token.tokenAddress as `0x${string}`],
                    },
                ],
            });
            
            if (result[0].result) {
                const price = Number(result[0].result) / 1e18;
                setCurrentPrice(price);
            }
        } catch (error) {
            console.error('Failed to fetch price:', error);
        }
    }, [token.tokenAddress, routerAddress]);

    // Fetch quote for conversion
    const fetchQuote = useCallback(async (amount: string) => {
        if (!amount || !token.tokenAddress || !currentPrice) {
            setQuoteAmount('0');
            return;
        }

        setIsQuoteLoading(true);
        try {
            const inputAmount = parseFloat(amount);
            let convertedAmount: number;

            if (activeTradeType === 'buy') {
                if (inputCurrency === 'MON') {
                    convertedAmount = inputAmount / currentPrice;
                } else {
                    convertedAmount = inputAmount * currentPrice;
                }
            } else {
                if (inputCurrency === 'MON') {
                    // TOKEN to MON
                    convertedAmount = inputAmount * currentPrice;
                } else {
                    // MON to TOKEN
                    convertedAmount = inputAmount / currentPrice;
                }
            }

            setQuoteAmount(convertedAmount.toFixed(6));
        } catch (error) {
            console.error('Failed to calculate quote:', error);
            setQuoteAmount('0');
        } finally {
            setIsQuoteLoading(false);
        }
    }, [token.tokenAddress, currentPrice, activeTradeType, inputCurrency]);

    // Fetch price on component mount and periodically
    useEffect(() => {
        fetchCurrentPrice();
        const interval = setInterval(fetchCurrentPrice, 10000); // Update every 10 seconds
        return () => clearInterval(interval);
    }, [fetchCurrentPrice]);

    // Update quote when amount or settings change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchQuote(tradeAmount);
        }, 500); // Debounce for 500ms

        return () => clearTimeout(timeoutId);
    }, [tradeAmount, fetchQuote]);

    const handlePresetClick = (preset: number) => {
        setSliderPercent(preset);
        // You would calculate based on actual balance here
        const newAmount = (1000 * preset) / 100; // Replace 1000 with actual balance
        setTradeAmount(newAmount.toString());
    };

    const handlePresetSelect = (preset: number) => {
        setSelectedPreset(preset);

        const presets = {
            1: { slippage: '20', priority: '0.001', bribe: '0.05' },
            2: { slippage: '10', priority: '0.005', bribe: '0.1' },
            3: { slippage: '5', priority: '0.01', bribe: '0.2' }
        };

        const presetValues = presets[preset as keyof typeof presets];
        setSlippageValue(presetValues.slippage);
        setPriorityFee(presetValues.priority);
        setBribeValue(presetValues.bribe);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const percent = parseInt(e.target.value);
        setSliderPercent(percent);
        const newAmount = (1000 * percent) / 100; // Replace with actual balance
        setTradeAmount(newAmount.toString());

        const slider = e.target;
        const rect = slider.getBoundingClientRect();
        const trackWidth = rect.width - 15;
        const thumbPosition = (percent / 100) * trackWidth + 15 / 2;
        const popup = document.querySelector('.meme-slider-percentage-popup') as HTMLElement;
        if (popup) {
            popup.style.left = `${thumbPosition}px`;
        }
    };

    const handleIncrementClick = (direction: 'plus' | 'minus') => {
        const newPercent = direction === 'plus'
            ? Math.min(100, sliderPercent + sliderIncrement)
            : Math.max(0, sliderPercent - sliderIncrement);
        setSliderPercent(newPercent);
        const newAmount = (1000 * newPercent) / 100; // Replace with actual balance
        setTradeAmount(newAmount.toString());
    };

    // Time period data - use real data where available, simulate for missing periods
    const timePeriodsData = {
        '5M': {
            change: (token.change24h || 0) * 0.002 + (Math.random() - 0.5) * 2,
            volume: (token.volume24h || 0) * 0.002,
            buyTransactions: Math.floor((token.buyTransactions || 0) * 0.001),
            sellTransactions: Math.floor((token.sellTransactions || 0) * 0.001),
            buyVolumePercentage: 45 + Math.random() * 20,
            sellVolumePercentage: 45 + Math.random() * 20,
            buyerPercentage: 40 + Math.random() * 20,
            sellerPercentage: 40 + Math.random() * 20
        },
        '1H': {
            change: (token.change24h || 0) * 0.05 + (Math.random() - 0.5) * 5,
            volume: (token.volume24h || 0) * 0.05,
            buyTransactions: Math.floor((token.buyTransactions || 0) * 0.04),
            sellTransactions: Math.floor((token.sellTransactions || 0) * 0.04),
            buyVolumePercentage: 65 + Math.random() * 20,
            sellVolumePercentage: 25 + Math.random() * 20,
            buyerPercentage: 70 + Math.random() * 20,
            sellerPercentage: 20 + Math.random() * 20
        },
        '6H': {
            change: (token.change24h || 0) * 0.3 + (Math.random() - 0.5) * 10,
            volume: (token.volume24h || 0) * 0.3,
            buyTransactions: Math.floor((token.buyTransactions || 0) * 0.25),
            sellTransactions: Math.floor((token.sellTransactions || 0) * 0.25),
            buyVolumePercentage: 60 + Math.random() * 20,
            sellVolumePercentage: 30 + Math.random() * 20,
            buyerPercentage: 65 + Math.random() * 20,
            sellerPercentage: 25 + Math.random() * 20
        },
        '24H': {
            change: token.change24h || 0,
            volume: token.volume24h || 0,
            buyTransactions: token.buyTransactions || 0,
            sellTransactions: token.sellTransactions || 0,
            buyVolumePercentage: 65,
            sellVolumePercentage: 35,
            buyerPercentage: 70,
            sellerPercentage: 30
        }
    };

    interface TooltipProps {
        content: string;
        children: React.ReactNode;
        position?: 'top' | 'bottom' | 'left' | 'right';
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

    const currentData = timePeriodsData[selectedTimePeriod];

    // Trading Stats calculations based on selected time period
    const totalTransactions = currentData.buyTransactions + currentData.sellTransactions;
    const totalTraders = (token.holders || 0) + (token.proTraders || 0) + (token.kolTraders || 0);

    // Calculate percentages for buy/sell bars
    const buyTxPercentage = totalTransactions > 0 ? (currentData.buyTransactions / totalTransactions) * 100 : 0;
    const sellTxPercentage = totalTransactions > 0 ? (currentData.sellTransactions / totalTransactions) * 100 : 0;

    const buyVolume = (currentData.volume * currentData.buyVolumePercentage) / 100;
    const sellVolume = (currentData.volume * currentData.sellVolumePercentage) / 100;

    // Simulate buyer/seller split
    const buyers = Math.floor(totalTraders * currentData.buyerPercentage / 100);
    const sellers = Math.floor(totalTraders * currentData.sellerPercentage / 100);

    // Format numbers with K/M/B suffixes and commas
    const formatDisplayValue = (value: number, decimals: number = 6): string => {
        if (value === 0) return '0';
        
        const num = Number(value);
        
        if (num >= 1e9) {
            return `${(num / 1e9).toFixed(2)}B`;
        } else if (num >= 1e6) {
            return `${(num / 1e6).toFixed(2)}M`;
        } else if (num >= 1e3) {
            return `${(num / 1e3).toFixed(2)}K`;
        } else if (num >= 1) {
            return num.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: decimals
            });
        } else {
            // For small numbers, show more precision
            return num.toFixed(Math.min(decimals, 8));
        }
    };

    const formatNumberWithCommas = (num: number): string => {
        if (num === 0) return '0';
        
        if (num >= 1e9) {
            return `${(num / 1e9).toFixed(2)}B`;
        } else if (num >= 1e6) {
            return `${(num / 1e6).toFixed(2)}M`;
        } else if (num >= 1e3) {
            return `${(num / 1e3).toFixed(2)}K`;
        } else {
            return num.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 6
            });
        }
    };

    const formatVolume = (num: number): string => {
        if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
        if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
        return `$${num.toFixed(0)}`;
    };

    const handleTimePeriodClick = (period: TimePeriod) => {
        setSelectedTimePeriod(period);
    };

    const handleTradeTypeClick = (type: 'buy' | 'sell') => {
        setActiveTradeType(type);
    };

    const handleOrderTypeClick = (type: 'market' | 'Limit') => {
        setActiveOrderType(type);
        if (type === 'market') {
            setLimitPrice('');
        }
    };

    const handleTradeAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTradeAmount(e.target.value);
    };

    const handleLimitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLimitPrice(e.target.value);
    };

    const handleCurrencySwitch = () => {
        setInputCurrency(prev => prev === 'MON' ? 'TOKEN' : 'MON');
    };

    const handleTrade = async () => {
        if (!tradeAmount || !account.connected) return;

        if (activeOrderType === 'Limit' && !LimitPrice) {
            console.log('Limit price is required for Limit orders');
            return;
        }

        const targetChainId = settings.chainConfig[activechain]?.chainId || 
                             parseInt(activechain) || 
                             activechain;

        if (account.chainId !== targetChainId) {
            setChain();
            return;
        }

        try {
            setIsSigning(true);
            
            if (activeTradeType === 'buy') {
                const value = BigInt(parseFloat(tradeAmount) * 1e18);
                const uo = {
                    target: routerAddress,
                    data: encodeFunctionData({
                        abi: CrystalLaunchpadRouter,
                        functionName: 'buy',
                        args: [token.tokenAddress as `0x${string}`],
                    }),
                    value: value,
                };
                const op = await sendUserOperationAsync({ uo });
                await waitForTxReceipt(op.hash);
            } else {
                // For sell, you'd need to implement token approval first
                const amountIn = BigInt(parseFloat(tradeAmount) * 1e18);
                const uo = {
                    target: routerAddress,
                    data: encodeFunctionData({
                        abi: CrystalLaunchpadRouter,
                        functionName: 'sell',
                        args: [token.tokenAddress as `0x${string}`, amountIn],
                    }),
                    value: 0n,
                };
                const op = await sendUserOperationAsync({ uo });
                await waitForTxReceipt(op.hash);
            }

            // Reset form after successful trade
            setTradeAmount('');
            setLimitPrice('');
            setSliderPercent(0);
            
            // Refresh price
            fetchCurrentPrice();
            
        } catch (error) {
            console.error('Trade failed:', error);
        } finally {
            setIsSigning(false);
        }
    };

    const getButtonText = () => {
        if (!account.connected) {
            return 'Connect Wallet';
        }
        
        // More flexible chain comparison
        const targetChainId = settings.chainConfig[activechain]?.chainId || 
                             parseInt(activechain) || 
                             activechain;
        
        if (account.chainId !== targetChainId) {
            return `Switch to ${settings.chainConfig[activechain]?.name || 'Monad'}`;
        }
        if (isSigning) {
            return 'Signing...';
        }
        if (activeOrderType === 'market') {
            return `${activeTradeType === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`;
        } else {
            return `Set ${activeTradeType === 'buy' ? 'Buy' : 'Sell'} Limit`;
        }
    };

    const isTradeDisabled = () => {
        if (!account.connected) return false; // Show connect wallet button
        
        const targetChainId = settings.chainConfig[activechain]?.chainId || 
                             parseInt(activechain) || 
                             activechain;
        
        if (account.chainId !== targetChainId) return false; // Show switch chain button
        if (isSigning) return true;
        if (!tradeAmount) return true;
        if (activeOrderType === 'Limit' && !LimitPrice) return true;
        return false;
    };

    const getCurrentInputCurrency = () => {
        if (activeTradeType === 'buy') {
            return inputCurrency === 'MON' ? 'MON' : token.symbol;
        } else {
            return inputCurrency === 'MON' ? token.symbol : 'MON';
        }
    };

    const getCurrentConversionCurrency = () => {
        if (activeTradeType === 'buy') {
            return inputCurrency === 'MON' ? token.symbol : 'MON';
        } else {
            return inputCurrency === 'MON' ? 'MON' : token.symbol;
        }
    };

    // Add drag functionality handlers
    const handleHeightChange = useCallback((newHeight: number) => {
        setOrderCenterHeight(newHeight);
        localStorage.setItem('meme_order_center_height', newHeight.toString());
    }, []);

    const handleDragStart = useCallback(() => {
        setIsVertDragging(true);
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const handleDragEnd = useCallback(() => {
        setIsVertDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    // Load saved height on component mount
    React.useEffect(() => {
        const savedHeight = localStorage.getItem('meme_order_center_height');
        if (savedHeight) {
            const height = parseInt(savedHeight, 10);
            if (height >= 150 && height <= 800) {
                setOrderCenterHeight(height);
            }
        }
    }, []);

    return (
        <div className="meme-interface-container">
            <div className="memechartandtradesandordercenter">
                <div className="memecharttradespanel">
                    <div className="meme-chart-container"></div>
                    <div className="meme-trades-container">
                        <span className="meme-trades-title">Trades</span>
                        <MemeTradesComponent
                            tokenList={tokenList}
                            marketsData={marketsData}
                            onMarketSelect={onMarketSelect}
                            setSendTokenIn={setSendTokenIn}
                            setpopup={setpopup}
                        />                
                    </div>
                </div>
                <div className="meme-ordercenter">
                    <MemeOrderCenter
                        orderCenterHeight={orderCenterHeight}
                        isVertDragging={isVertDragging}
                        isOrderCenterVisible={isOrderCenterVisible}
                        onHeightChange={handleHeightChange}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        isWidgetOpen={isWidgetOpen}
                        onToggleWidget={() => setIsWidgetOpen(!isWidgetOpen)}
                    />
                </div>
            </div>

            {/* Trade Panel */}
            <div className="meme-trade-panel">
                <div className="meme-buy-sell-container">
                    <button
                        className={`meme-buy-button ${activeTradeType === 'buy' ? 'active' : 'inactive'}`}
                        onClick={() => handleTradeTypeClick('buy')}
                    >
                        Buy
                    </button>
                    <button
                        className={`meme-sell-button ${activeTradeType === 'sell' ? 'active' : 'inactive'}`}
                        onClick={() => handleTradeTypeClick('sell')}
                    >
                        Sell
                    </button>
                </div>

                <div className="meme-trade-panel-content">
                    <div className="meme-order-types">
                        <button
                            className={`meme-order-type-button ${activeOrderType === 'market' ? 'active' : 'inactive'}`}
                            onClick={() => handleOrderTypeClick('market')}
                        >
                            Market
                        </button>
                        <button
                            className={`meme-order-type-button ${activeOrderType === 'Limit' ? 'active' : 'inactive'}`}
                            onClick={() => handleOrderTypeClick('Limit')}
                        >
                            Limit
                        </button>
                    </div>
                    <div className="meme-amount-header">
                        <span className="meme-amount-label">{inputCurrency === 'TOKEN' ? 'Qty' : 'Amount'}</span>
                        <button
                            className="meme-currency-switch-button"
                            onClick={handleCurrencySwitch}
                            title="Switch input currency"
                        >
                            <img src={switchicon} alt="Switch Currency" className="meme-currency-switch-icon" />
                        </button>
                    </div>
                    <div className="meme-trade-input-wrapper">
                        <input
                            type="number"
                            placeholder="0"
                            value={tradeAmount}
                            onChange={handleTradeAmountChange}
                            className="meme-trade-input"
                        />
                        <div
                            className="meme-trade-currency"
                            style={{
                                left: `${Math.max(12 + (tradeAmount.length || 1) * 10, 12)}px`
                            }}
                        >
                            {getCurrentInputCurrency()}
                        </div>
                        {isQuoteLoading ? (
                            <div className="meme-trade-spinner"></div>
                        ) : (
                            <div className="meme-trade-conversion">
                                ≈ {formatNumberWithCommas(parseFloat(quoteAmount))} {getCurrentConversionCurrency()}
                            </div>
                        )}
                    </div>
                    
                    {account.connected && (
                        <div className="meme-token-balance">
                            <img src={walleticon} className="balance-wallet-icon" />
                            <span className="balance-amount">{getTokenBalance()} {token.symbol}</span>
                        </div>
                    )}
                    
                    {activeOrderType === 'Limit' && (
                        <div className="meme-trade-input-wrapper">
                            <input
                                type="number"
                                placeholder="Limit price"
                                value={LimitPrice}
                                onChange={handleLimitPriceChange}
                                className="meme-trade-input"
                            />
                            <div className="meme-trade-currency">
                                USD
                            </div>
                        </div>
                    )}

                    <div className="meme-balance-slider-wrapper">
                        {sliderMode === 'presets' ? (
                            <div className="meme-slider-container meme-presets-mode">
                                <div className="meme-preset-buttons">
                                    {sliderPresets.map((preset: number, index: number) => (
                                        <button
                                            key={index}
                                            className={`meme-preset-button ${sliderPercent === preset ? 'active' : ''}`}
                                            onClick={() => handlePresetClick(preset)}
                                        >
                                            {preset}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : sliderMode === 'increment' ? (
                            <div className="meme-slider-container meme-increment-mode">
                                <button
                                    className="meme-increment-button meme-minus"
                                    onClick={() => handleIncrementClick('minus')}
                                    disabled={sliderPercent === 0}
                                >
                                    −
                                </button>
                                <div className="meme-increment-display">
                                    <div className="meme-increment-amount">{sliderIncrement}%</div>
                                </div>
                                <button
                                    className="meme-increment-button meme-plus"
                                    onClick={() => handleIncrementClick('plus')}
                                    disabled={sliderPercent === 100}
                                >
                                    +
                                </button>
                            </div>
                        ) : (
                            <div className="meme-slider-container meme-slider-mode">
                                <input
                                    type="range"
                                    className={`meme-balance-amount-slider ${isDragging ? 'dragging' : ''}`}
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={sliderPercent}
                                    onChange={handleSliderChange}
                                    onMouseDown={() => setIsDragging(true)}
                                    onMouseUp={() => setIsDragging(false)}
                                    style={{
                                        background: `linear-gradient(to right,rgb(171, 176, 224) ${sliderPercent}%,rgb(28, 28, 31) ${sliderPercent}%)`,
                                    }}
                                />
                                <div className={`meme-slider-percentage-popup ${isDragging ? 'visible' : ''}`}>
                                    {sliderPercent}%
                                </div>
                                <div className="meme-balance-slider-marks">
                                    {[0, 25, 50, 75, 100].map((markPercent) => (
                                        <span
                                            key={markPercent}
                                            className="meme-balance-slider-mark"
                                            data-active={sliderPercent >= markPercent}
                                            data-percentage={markPercent}
                                            onClick={() => {
                                                setSliderPercent(markPercent);
                                                const newAmount = (1000 * markPercent) / 100;
                                                setTradeAmount(newAmount.toString());
                                            }}
                                        >
                                            {markPercent}%
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="meme-trade-settings">
                        <div className="meme-settings-toggle">
                            <div className="meme-settings-collapsed">
                                <div className="meme-settings-item">
                                    <img src={slippage} alt="Slippage" className="meme-settings-icon1" />
                                    <span className="meme-settings-value">{slippageValue}%</span>
                                </div>
                                <div className="meme-settings-item">
                                    <img src={gas} alt="Priority Fee" className="meme-settings-icon2" />
                                    <span className="meme-settings-value">{priorityFee}</span>
                                </div>
                                <div className="meme-settings-item">
                                    <img src={bribe} alt="Bribe" className="meme-settings-icon3" />
                                    <span className="meme-settings-value">{bribeValue}</span>
                                </div>
                            </div>
                            <button
                                className="meme-settings-edit-button"
                                onClick={() => setSettingsExpanded(!settingsExpanded)}
                                title="Edit settings"
                            >
                                <img
                                    src={editicon}
                                    alt="Edit Settings"
                                    className={`meme-settings-edit-icon ${settingsExpanded ? 'expanded' : ''}`}
                                />
                            </button>
                        </div>

                        {settingsExpanded && (
                            <div className="meme-settings-content">
                                <div className="meme-settings-presets">
                                    <button
                                        className={`meme-settings-preset ${selectedPreset === 1 ? 'active' : ''}`}
                                        onClick={() => handlePresetSelect(1)}
                                    >
                                        Preset 1
                                    </button>
                                    <button
                                        className={`meme-settings-preset ${selectedPreset === 2 ? 'active' : ''}`}
                                        onClick={() => handlePresetSelect(2)}
                                    >
                                        Preset 2
                                    </button>
                                    <button
                                        className={`meme-settings-preset ${selectedPreset === 3 ? 'active' : ''}`}
                                        onClick={() => handlePresetSelect(3)}
                                    >
                                        Preset 3
                                    </button>
                                </div>

                                <div className="meme-settings-grid">
                                    <div className="meme-setting-item">
                                        <label className="meme-setting-label">
                                            <img src={slippage} alt="Slippage" className="meme-setting-label-icon" />
                                            Slippage
                                        </label>
                                        <div className="meme-setting-input-wrapper">
                                            <input
                                                type="number"
                                                className="meme-setting-input"
                                                value={slippageValue}
                                                onChange={(e) => setSlippageValue(e.target.value)}
                                                step="0.1"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="meme-setting-unit">%</span>
                                        </div>
                                    </div>

                                    <div className="meme-setting-item">
                                        <label className="meme-setting-label">
                                            <img src={gas} alt="Priority Fee" className="meme-setting-label-icon" />
                                            Priority
                                        </label>
                                        <div className="meme-setting-input-wrapper">
                                            <input
                                                type="number"
                                                className="meme-setting-input"
                                                value={priorityFee}
                                                onChange={(e) => setPriorityFee(e.target.value)}
                                                step="1"
                                                min="0"
                                            />
                                            <span className="meme-setting-unit">MON</span>
                                        </div>
                                    </div>

                                    <div className="meme-setting-item">
                                        <label className="meme-setting-label">
                                            <img src={bribe} alt="Bribe" className="meme-setting-label-icon" />
                                            Bribe
                                        </label>
                                        <div className="meme-setting-input-wrapper">
                                            <input
                                                type="number"
                                                className="meme-setting-input"
                                                value={bribeValue}
                                                onChange={(e) => setBribeValue(e.target.value)}
                                                step="0.0000001"
                                                min="0"
                                            />
                                            <span className="meme-setting-unit">MON</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            if (!account.connected) {
                                setpopup(4); // Show connect wallet popup
                            } else {
                                const targetChainId = settings.chainConfig[activechain]?.chainId || 
                                                     parseInt(activechain) || 
                                                     activechain;
                                if (account.chainId !== targetChainId) {
                                    setChain();
                                } else {
                                    handleTrade();
                                }
                            }
                        }}
                        className={`meme-trade-action-button ${activeTradeType}`}
                        disabled={isTradeDisabled()}
                    >
                        {getButtonText()}
                    </button>
                </div>

                <div className="meme-trading-stats-container">
                    <div className="meme-time-stats-row">
                        {Object.entries(timePeriodsData).map(([period, data]) => (
                            <button
                                key={period}
                                className={`meme-time-stat-item ${selectedTimePeriod === period ? 'highlighted' : ''}`}
                                onClick={() => handleTimePeriodClick(period)}
                            >
                                <div className="meme-time-label">{period}</div>
                                <div className={`meme-time-value ${data.change >= 0 ? 'positive' : 'negative'} ${period === '24H' ? 'large' : ''}`}>
                                    {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="meme-trading-stats-row">
                        <div className="meme-stat-group">
                            <div className="meme-stat-header">
                                <span className="meme-stat-label">TXNS</span>
                                <div className="meme-stat-value">{formatNumberWithCommas(totalTransactions)}</div>
                            </div>
                            <div className="meme-stat-details">
                                <div className="meme-stat-subrow">
                                    <div className="stat-sublabel">BUYS</div>
                                    <div className="stat-sublabel">SELLS</div>
                                </div>
                                <div className="meme-stat-subrow">
                                    <div className="stat-subvalue buy">{formatNumberWithCommas(currentData.buyTransactions)}</div>
                                    <div className="stat-subvalue sell">{formatNumberWithCommas(currentData.sellTransactions)}</div>
                                </div>
                                <div className="meme-progress-bar">
                                    <div
                                        className="progress-buy"
                                        style={{ width: `${buyTxPercentage}%` }}
                                    ></div>
                                    <div
                                        className="progress-sell"
                                        style={{ width: `${sellTxPercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="meme-stat-group">
                            <div className="meme-stat-header">
                                <span className="meme-stat-label">VOLUME</span>
                                <div className="meme-stat-value">{formatVolume(currentData.volume)}</div>
                            </div>
                            <div className="meme-stat-details">
                                <div className="meme-stat-subrow">
                                    <div className="stat-sublabel">BUY VOL</div>
                                    <div className="stat-sublabel">SELL VOL</div>
                                </div>
                                <div className="meme-stat-subrow">
                                    <div className="stat-subvalue buy">{formatVolume(buyVolume)}</div>
                                    <div className="stat-subvalue sell">{formatVolume(sellVolume)}</div>
                                </div>
                                <div className="meme-progress-bar">
                                    <div
                                        className="progress-buy"
                                        style={{ width: `${currentData.buyVolumePercentage}%` }}
                                    ></div>
                                    <div
                                        className="progress-sell"
                                        style={{ width: `${currentData.sellVolumePercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="meme-stat-group">
                            <div className="meme-stat-header">
                                <span className="meme-stat-label">MAKERS</span>
                                <div className="meme-stat-value">{formatNumberWithCommas(totalTraders)}</div>
                            </div>
                            <div className="meme-stat-details">
                                <div className="meme-stat-subrow">
                                    <div className="stat-sublabel">BUYERS</div>
                                    <div className="stat-sublabel">SELLERS</div>
                                </div>
                                <div className="meme-stat-subrow">
                                    <div className="stat-subvalue buy">{formatNumberWithCommas(buyers)}</div>
                                    <div className="stat-subvalue sell">{formatNumberWithCommas(sellers)}</div>
                                </div>
                                <div className="meme-progress-bar">
                                    <div
                                        className="progress-buy"
                                        style={{ width: `${currentData.buyerPercentage}%` }}
                                    ></div>
                                    <div
                                        className="progress-sell"
                                        style={{ width: `${currentData.sellerPercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="meme-token-info-container">
                    <div className="meme-token-info-header">
                        <h3 className="meme-token-info-title">Token Info</h3>
                        <button
                            className="meme-token-info-collapse-button"
                            onClick={() => setTokenInfoExpanded(!tokenInfoExpanded)}
                            title={tokenInfoExpanded ? "Collapse token info" : "Expand token info"}
                        >
                            <svg
                                className={`meme-token-info-arrow ${tokenInfoExpanded ? 'expanded' : ''}`} xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                    </div>

                    {tokenInfoExpanded && (
                        <div className="meme-token-info-grid">
                            <div className="meme-token-info-item">
                                <div className="meme-token-info-icon-container">
                                    <svg
                                        className="meme-token-info-icon"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 32 32"
                                        fill={(token.top10Holding || 0) > 5 ? "#eb7070ff" : "rgb(67 254 154)"}
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M 15 4 L 15 6 L 13 6 L 13 8 L 15 8 L 15 9.1875 C 14.011719 9.554688 13.25 10.433594 13.0625 11.5 C 12.277344 11.164063 11.40625 11 10.5 11 C 6.921875 11 4 13.921875 4 17.5 C 4 19.792969 5.199219 21.8125 7 22.96875 L 7 27 L 25 27 L 25 22.96875 C 26.800781 21.8125 28 19.792969 28 17.5 C 28 13.921875 25.078125 11 21.5 11 C 20.59375 11 19.722656 11.164063 18.9375 11.5 C 18.75 10.433594 17.988281 9.554688 17 9.1875 L 17 8 L 19 8 L 19 6 L 17 6 L 17 4 Z M 16 11 C 16.5625 11 17 11.4375 17 12 C 17 12.5625 16.5625 13 16 13 C 15.4375 13 15 12.5625 15 12 C 15 11.4375 15.4375 11 16 11 Z M 10.5 13 C 12.996094 13 15 15.003906 15 17.5 L 15 22 L 10.5 22 C 8.003906 22 6 19.996094 6 17.5 C 6 15.003906 8.003906 13 10.5 13 Z M 21.5 13 C 23.996094 13 26 15.003906 26 17.5 C 26 19.996094 23.996094 22 21.5 22 L 17 22 L 17 17.5 C 17 15.003906 19.003906 13 21.5 13 Z M 9 24 L 23 24 L 23 25 L 9 25 Z" />
                                    </svg>
                                    <span className="meme-token-info-value" style={{ color: (token.top10Holding || 0) > 5 ? "#eb7070ff" : "rgb(67 254 154)" }}>
                                        {(token.top10Holding || 0).toFixed(2)}%
                                    </span>
                                </div>
                                <span className="meme-token-info-label">Top 10 H.</span>
                            </div>

                            <div className="meme-token-info-item">
                                <div className="meme-token-info-icon-container">
                                    <svg
                                        className="meme-token-info-icon"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 30 30"
                                        fill={(token.devHolding || 0) > 5 ? "#eb7070ff" : "rgb(67 254 154)"}
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                                    </svg>
                                    <span className="meme-token-info-value" style={{ color: (token.devHolding || 0) > 5 ? "#eb7070ff" : "rgb(67 254 154)" }}>
                                        {(token.devHolding || 0).toFixed(2)}%
                                    </span>
                                </div>
                                <span className="meme-token-info-label">Dev H.</span>
                            </div>

                            <div className="meme-token-info-item">
                                <div className="meme-token-info-icon-container">
                                    <svg
                                        className="meme-token-info-icon"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill={(token.sniperHolding || 0) > 5 ? "#eb7070ff" : "rgb(67 254 154)"}
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M 11.244141 2.0019531 L 11.244141 2.7519531 L 11.244141 3.1542969 C 6.9115518 3.5321749 3.524065 6.919829 3.1445312 11.251953 L 2.7421875 11.251953 L 1.9921875 11.251953 L 1.9921875 12.751953 L 2.7421875 12.751953 L 3.1445312 12.751953 C 3.5225907 17.085781 6.9110367 20.473593 11.244141 20.851562 L 11.244141 21.253906 L 11.244141 22.003906 L 12.744141 22.003906 L 12.744141 21.253906 L 12.744141 20.851562 C 17.076343 20.47195 20.463928 17.083895 20.841797 12.751953 L 21.244141 12.751953 L 21.994141 12.751953 L 21.994141 11.251953 L 21.244141 11.251953 L 20.841797 11.251953 C 20.462285 6.9209126 17.074458 3.5337191 12.744141 3.1542969 L 12.744141 2.7519531 L 12.744141 2.0019531 L 11.244141 2.0019531 z M 11.244141 4.6523438 L 11.244141 8.0742188 C 9.6430468 8.3817751 8.3759724 9.6507475 8.0683594 11.251953 L 4.6425781 11.251953 C 5.0091295 7.7343248 7.7260437 5.0173387 11.244141 4.6523438 z M 12.744141 4.6523438 C 16.25959 5.0189905 18.975147 7.7358303 19.341797 11.251953 L 15.917969 11.251953 C 15.610766 9.6510551 14.344012 8.3831177 12.744141 8.0742188 L 12.744141 4.6523438 z M 11.992188 9.4980469 C 13.371637 9.4980469 14.481489 10.6041 14.492188 11.982422 L 14.492188 12.021484 C 14.481501 13.40006 13.372858 14.503906 11.992188 14.503906 C 10.606048 14.503906 9.4921875 13.389599 9.4921875 12.001953 C 9.4921875 10.614029 10.60482 9.4980469 11.992188 9.4980469 z M 4.6425781 12.751953 L 8.0683594 12.751953 C 8.3760866 14.352973 9.6433875 15.620527 11.244141 15.927734 L 11.244141 19.353516 C 7.7258668 18.988181 5.0077831 16.270941 4.6425781 12.751953 z M 15.917969 12.751953 L 19.34375 12.751953 C 18.97855 16.26893 16.261295 18.986659 12.744141 19.353516 L 12.744141 15.927734 C 14.344596 15.619809 15.610176 14.35218 15.917969 12.751953 z" />
                                    </svg>
                                    <span className="meme-token-info-value" style={{ color: (token.sniperHolding || 0) > 5 ? "#eb7070ff" : "rgb(67 254 154)" }}>
                                        {(token.sniperHolding || 0).toFixed(2)}%
                                    </span>
                                </div>
                                <span className="meme-token-info-label">Snipers H.</span>
                            </div>

                            <div className="meme-token-info-item">
                                <div className="meme-token-info-icon-container">
                                    <svg
                                        className="meme-token-info-icon"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 32 32"
                                        fill={(token.insiderHolding || 0) > 5 ? "#eb7070ff" : "rgb(67 254 154)"}
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M 16 3 C 14.0625 3 12.570313 3.507813 11.5 4.34375 C 10.429688 5.179688 9.8125 6.304688 9.375 7.34375 C 8.9375 8.382813 8.65625 9.378906 8.375 10.09375 C 8.09375 10.808594 7.859375 11.085938 7.65625 11.15625 C 4.828125 12.160156 3 14.863281 3 18 L 3 19 L 4 19 C 5.347656 19 6.003906 19.28125 6.3125 19.53125 C 6.621094 19.78125 6.742188 20.066406 6.8125 20.5625 C 6.882813 21.058594 6.847656 21.664063 6.9375 22.34375 C 6.984375 22.683594 7.054688 23.066406 7.28125 23.4375 C 7.507813 23.808594 7.917969 24.128906 8.375 24.28125 C 9.433594 24.632813 10.113281 24.855469 10.53125 25.09375 C 10.949219 25.332031 11.199219 25.546875 11.53125 26.25 C 11.847656 26.917969 12.273438 27.648438 13.03125 28.1875 C 13.789063 28.726563 14.808594 29.015625 16.09375 29 C 18.195313 28.972656 19.449219 27.886719 20.09375 26.9375 C 20.417969 26.460938 20.644531 26.050781 20.84375 25.78125 C 21.042969 25.511719 21.164063 25.40625 21.375 25.34375 C 22.730469 24.9375 23.605469 24.25 24.09375 23.46875 C 24.582031 22.6875 24.675781 21.921875 24.8125 21.40625 C 24.949219 20.890625 25.046875 20.6875 25.375 20.46875 C 25.703125 20.25 26.453125 20 28 20 L 29 20 L 29 19 C 29 17.621094 29.046875 16.015625 28.4375 14.5 C 27.828125 12.984375 26.441406 11.644531 24.15625 11.125 C 24.132813 11.121094 24.105469 11.132813 24 11 C 23.894531 10.867188 23.734375 10.601563 23.59375 10.25 C 23.3125 9.550781 23.042969 8.527344 22.59375 7.46875 C 22.144531 6.410156 21.503906 5.269531 20.4375 4.40625 C 19.371094 3.542969 17.90625 3 16 3 Z M 16 5 C 17.539063 5 18.480469 5.394531 19.1875 5.96875 C 19.894531 6.542969 20.367188 7.347656 20.75 8.25 C 21.132813 9.152344 21.402344 10.128906 21.75 11 C 21.921875 11.433594 22.109375 11.839844 22.40625 12.21875 C 22.703125 12.597656 23.136719 12.96875 23.6875 13.09375 C 25.488281 13.503906 26.15625 14.242188 26.5625 15.25 C 26.871094 16.015625 26.878906 17.066406 26.90625 18.09375 C 25.796875 18.1875 24.886719 18.386719 24.25 18.8125 C 23.40625 19.378906 23.050781 20.25 22.875 20.90625 C 22.699219 21.5625 22.632813 22.042969 22.40625 22.40625 C 22.179688 22.769531 21.808594 23.128906 20.78125 23.4375 C 20.070313 23.652344 19.558594 24.140625 19.21875 24.59375 C 18.878906 25.046875 18.675781 25.460938 18.4375 25.8125 C 17.960938 26.515625 17.617188 26.980469 16.0625 27 C 15.078125 27.011719 14.550781 26.820313 14.1875 26.5625 C 13.824219 26.304688 13.558594 25.929688 13.3125 25.40625 C 12.867188 24.460938 12.269531 23.765625 11.53125 23.34375 C 10.792969 22.921875 10.023438 22.714844 9 22.375 C 8.992188 22.359375 8.933594 22.285156 8.90625 22.09375 C 8.855469 21.710938 8.886719 21.035156 8.78125 20.28125 C 8.675781 19.527344 8.367188 18.613281 7.5625 17.96875 C 7 17.515625 6.195313 17.289063 5.25 17.15625 C 5.542969 15.230469 6.554688 13.65625 8.3125 13.03125 C 9.375 12.65625 9.898438 11.730469 10.25 10.84375 C 10.601563 9.957031 10.851563 8.96875 11.21875 8.09375 C 11.585938 7.21875 12.019531 6.480469 12.71875 5.9375 C 13.417969 5.394531 14.402344 5 16 5 Z M 13 9 C 12.449219 9 12 9.671875 12 10.5 C 12 11.328125 12.449219 12 13 12 C 13.550781 12 14 11.328125 14 10.5 C 14 9.671875 13.550781 9 13 9 Z M 17 9 C 16.449219 9 16 9.671875 16 10.5 C 16 11.328125 16.449219 12 17 12 C 17.550781 12 18 11.328125 18 10.5 C 18 9.671875 17.550781 9 17 9 Z" />
                                    </svg>
                                    <span className="meme-token-info-value" style={{ color: (token.insiderHolding || 0) > 5 ? "#eb7070ff" : "rgb(67 254 154)" }}>
                                        {(token.insiderHolding || 0).toFixed(2)}%
                                    </span>
                                </div>
                                <span className="meme-token-info-label">Insiders</span>
                            </div>

                            <div className="meme-token-info-item">
                                <div className="meme-token-info-icon-container">
                                    <svg
                                        className="meme-token-info-icon"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 128 128"
                                        fill={(token.bundleHolding || 0) > 5 ? "#eb7070ff" : "rgb(67 254 154)"}
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M117 68.26l-26-15a2 2 0 00-2 0l-26 15A2 2 0 0062 70v30a2 2 0 001 1.73l26 15a2 2 0 002 0l26-15a2 2 0 001-1.73V70A2 2 0 00117 68.26zm-27-11l22.46 13L90 82.7 68 70zM66 73.46L88 86.15v25.41L66 98.86zm26 38.1V86.18L114 74V98.85zM56 102.25l-16 8.82V86.72l17-10a2 2 0 10-2-3.44l-17 10L15.55 70.56 38 57.82l17 8.95a2 2 0 001.86-3.54l-18-9.46a2 2 0 00-1.92 0L11 68.53a2 2 0 00-1 1.74V99.73a2 2 0 001 1.74L37 116.2a2 2 0 002 0l19-10.46a2 2 0 10-1.92-3.5zm-42-28L36 86.74V111L14 98.56zM38 49a2 2 0 002-2V28.46L62 41.15V61a2 2 0 004 0V41.15L88 28.46V47a2 2 0 004 0V25a2 2 0 00-1-1.73l-26-15a2 2 0 00-2 0l-26 15A2 2 0 0036 25V47A2 2 0 0038 49zM64 12.31L86 25 64 37.69 42 25z" />
                                    </svg>
                                    <span className="meme-token-info-value" style={{ color: (token.bundleHolding || 0) > 5 ? "#eb7070ff" : "rgb(67 254 154)" }}>
                                        {(token.bundleHolding || 0).toFixed(2)}%
                                    </span>
                                </div>
                                <span className="meme-token-info-label">Bundlers</span>
                            </div>

                            <div className="meme-token-info-item">
                                <div className="meme-token-info-icon-container">
                                    <svg
                                        className="meme-token-info-icon"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="#7f808d"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M 12 2 L 12 4 L 11 4 C 10.4 4 10 4.4 10 5 L 10 10 C 10 10.6 10.4 11 11 11 L 12 11 L 12 13 L 14 13 L 14 11 L 15 11 C 15.6 11 16 10.6 16 10 L 16 5 C 16 4.4 15.6 4 15 4 L 14 4 L 14 2 L 12 2 z M 4 9 L 4 11 L 3 11 C 2.4 11 2 11.4 2 12 L 2 17 C 2 17.6 2.4 18 3 18 L 4 18 L 4 20 L 6 20 L 6 18 L 7 18 C 7.6 18 8 17.6 8 17 L 8 12 C 8 11.4 7.6 11 7 11 L 6 11 L 6 9 L 4 9 z M 18 11 L 18 13 L 17 13 C 16.4 13 16 13.4 16 14 L 16 19 C 16 19.6 16.4 20 17 20 L 18 20 L 18 22 L 20 22 L 20 20 L 21 20 C 21.6 20 22 19.6 22 19 L 22 14 C 22 13.4 21.6 13 21 13 L 20 13 L 20 11 L 18 11 z M 4 13 L 6 13 L 6 16 L 4 16 L 4 13 z" />
                                    </svg>
                                    <span className="meme-token-info-value">{(token.proTraders || 0).toLocaleString()}</span>
                                </div>
                                <span className="meme-token-info-label">Pro Traders</span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="meme-token-info-footer">
                    <span className="meme-address">
                        <img className="meme-contract-icon" src={contract} />
                        <span className="meme-address-title">CA:</span> {token.tokenAddress.slice(0, 16)}...{token.tokenAddress.slice(-8)}   
                        <svg
                            className="meme-address-link"
                            xmlns="http://www.w3.org/2000/svg"
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                            <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
                        </svg>
                    </span>
                    <span className="meme-address">
                        <svg
                            className="meme-da-token-icon"
                            width="16"
                            height="16"
                            viewBox="0 0 30 30"
                            fill="#727380ff"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                        </svg>
                        <span className="meme-address-title">DA:</span> {token.tokenAddress.slice(0, 16)}...{token.tokenAddress.slice(-8)}        
                        <a target="_blank" rel="noopener noreferrer">
                            <svg
                                className="meme-address-link"
                                xmlns="http://www.w3.org/2000/svg"
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                                <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
                            </svg>
                        </a>
                    </span>
                </div>
            </div>

            <QuickBuyWidget
                isOpen={isWidgetOpen}
                onClose={() => setIsWidgetOpen(false)}
                tokenSymbol={token.symbol}
                tokenName={token.name}
            />
        </div>
    );
};

export default MemeInterface;