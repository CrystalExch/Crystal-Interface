import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, ChevronDown, ChevronLeft, Info, Plus, Minus, TrendingUp, Search, Star } from 'lucide-react';
import './LPVaults.css';
import iconmonad from '../../assets/iconmonad.png';
import iconwmonad from '../../assets/iconwmonad.png';
import iconusdc from '../../assets/iconusdc.png';
import iconshmonad from '../../assets/iconshmon.png';
import iconaprmonad from '../../assets/iconaprmon.png';
import iconchog from '../../assets/iconchog.png';
import iconweth from '../../assets/iconweth.png';
import iconwbtc from '../../assets/iconwbtc.png';
import iconsol from '../../assets/iconsol.png';
import icondak from '../../assets/icondak.png';
import iconyaki from '../../assets/iconyaki.png';
import iconusdt from '../../assets/iconusdt.png';
import iconsmon from '../../assets/iconsmon.png';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useSharedContext } from '../../contexts/SharedContext';

interface LPVault {
    id: string;
    name: string;
    tokens: {
        first: {
            symbol: string;
            icon: string;
        };
    };
    apy: number;
    tvl: string;
    description: string;
    userBalance: string;
    tags: string[];
    dailyYield?: string;
    protocolFee?: string;
    withdrawalTime?: string;
    depositRatio?: string;
    totalSupply: string;
    supplyApy: number;
    totalBorrowed: string;
    borrowApy: number;
}

interface LPTokenDeposit {
    symbol: string;
    icon: string;
    amount: string;
    usdValue: string;
    selected: boolean;
}

interface LPToken {
    symbol: string;
    icon: string;
    name: string;
    address: string;
}

interface LPVaultsProps {
    setpopup: (value: number) => void;
    setSupplyBorrowInitialTab?: (tab: 'supply' | 'borrow') => void;
    setSupplyBorrowVault?: (vault: any) => void;
}

const lpPerformanceData = [
    { name: 'Jan', value: 12.4 },
    { name: 'Feb', value: 14.8 },
    { name: 'Mar', value: 18.2 },
    { name: 'Apr', value: 16.9 },
    { name: 'May', value: 21.3 },
    { name: 'Jun', value: 22.7 },
    { name: 'Jul', value: 24.5 },
];

const lpTvlData = [
    { date: 'Feb 1', tvl: 50 },
    { date: 'Mar 1', tvl: 75 },
    { date: 'Apr 1', tvl: 120 },
    { date: 'May 1', tvl: 160 },
    { date: 'Jun 1', tvl: 178 },
];

const lpApyTrendData = [
    { date: 'Feb 1', supplyApy: 8.5, borrowApy: 12.2 },
    { date: 'Mar 1', supplyApy: 9.2, borrowApy: 13.0 },
    { date: 'Apr 1', supplyApy: 10.8, borrowApy: 14.5 },
    { date: 'May 1', supplyApy: 11.5, borrowApy: 15.1 },
    { date: 'Jun 1', supplyApy: 12.0, borrowApy: 16.3 },
];

const LP_TIME_RANGES = {
    "24h": 24,
    "7d": 24 * 7,
    "30d": 24 * 30,
    all: lpTvlData.length,
};

const LPVaults: React.FC<LPVaultsProps> = ({ setpopup, setSupplyBorrowInitialTab, setSupplyBorrowVault }) => {
    const [lpActiveTab, setLpActiveTab] = useState<'all' | 'deposited'>('all');
    const [lpSelectedVault, setLpSelectedVault] = useState<string | null>(null);
    const [lpDepositAmount, setLpDepositAmount] = useState('0.00');
    const [lpSliderValue, setLpSliderValue] = useState(0);
    const [lpSearchQuery, setLpSearchQuery] = useState('');
    const [lpIsSearchOpen, setLpIsSearchOpen] = useState(false);
    const [lpSelectedTokens, setLpSelectedTokens] = useState<LPToken[]>([]);
    const lpSearchRef = useRef<HTMLDivElement>(null);
    const lpSearchInputRef = useRef<HTMLInputElement>(null);
    const [lpRange, setLpRange] = useState<keyof typeof LP_TIME_RANGES>("all");
    const lpSliceCount = LP_TIME_RANGES[lpRange];
    const lpSlicedTvl = lpTvlData.slice(-lpSliceCount);
    const lpSlicedApy = lpApyTrendData.slice(-lpSliceCount);
    const { favorites, toggleFavorite } = useSharedContext();

    const [lpDepositTokens, setLpDepositTokens] = useState<LPTokenDeposit[]>([
        {
            symbol: 'SUI',
            icon: iconmonad,
            amount: '0.00',
            usdValue: '0.00',
            selected: true
        },
    ]);

    const lpAvailableTokens: LPToken[] = [
        { symbol: 'MON', icon: iconmonad, name: 'Monad', address: '0x1234...mon' },
        { symbol: 'WMON', icon: iconwmonad, name: 'Wrapped Monad', address: '0x1234...mon' },
        { symbol: 'USDC', icon: iconusdc, name: 'USD Coin', address: '0x1234...usdc' },
        { symbol: 'WETH', icon: iconweth, name: 'Wrapped Ether', address: '0x1234...weth' },
        { symbol: 'WBTC', icon: iconwbtc, name: 'Wrapped Bitcoin', address: '0x1234...wbtc' },
        { symbol: 'shMON', icon: iconshmonad, name: 'Kintsu Staked Monad', address: '0x1234...shmon' },
        { symbol: 'SOL', icon: iconsol, name: 'Wrapped Solana', address: '0x1234...sol' },
        { symbol: 'APRMON', icon: iconaprmonad, name: 'aPriori Monad LST', address: '0x1234...aprmon' },
        { symbol: 'DAK', icon: icondak, name: 'Molandak', address: '0x1234...dak' },
        { symbol: 'YAKI', icon: iconyaki, name: 'Moyaki', address: '0x1234...yaki' },
        { symbol: 'CHOG', icon: iconchog, name: 'Chog', address: '0x1234...chog' },
        { symbol: 'sMON', icon: iconsmon, name: 'shMonad', address: '0x1234...smon' },
        { symbol: 'USDT', icon: iconusdt, name: 'Tether USD', address: '0x1234...usdt' },
    ];

    const lpDefaultTokens = ['MON', 'WMON', 'USDC'];

    const lpVaults: LPVault[] = [
        {
            id: 'lp-mon-usdc-vault',
            name: 'MON',
            tokens: {
                first: {
                    symbol: 'MON',
                    icon: iconmonad
                },
            },
            apy: 24.5,
            tvl: '$3.7M',
            description: 'Earn yield by providing liquidity to the MON-USDC pool. This vault automatically compounds rewards into more LP tokens to maximize your returns.',
            userBalance: '1234.56',
            tags: ['Popular', 'High APY'],
            dailyYield: '0.0671%',
            protocolFee: '1.0%',
            withdrawalTime: 'Instant',
            depositRatio: '49.35%/50.65%',
            totalSupply: '$2.8M',
            supplyApy: 22.1,
            totalBorrowed: '$0.9M',
            borrowApy: 28.3,
        },
        {
            id: 'lp-weth-usdc-vault',
            name: 'WETH',
            tokens: {
                first: {
                    symbol: 'WETH',
                    icon: iconweth
                },
            },
            apy: 8.2,
            tvl: '$12.5M',
            description: 'Earn yield by providing liquidity to the ETH-USDC pool. This vault automatically compounds rewards into more LP tokens to maximize your returns.',
            userBalance: '0.00',
            tags: ['Stable', 'Low Risk'],
            dailyYield: '0.0224%',
            protocolFee: '0.5%',
            withdrawalTime: 'Instant',
            depositRatio: '50.00%/50.00%',
            totalSupply: '$9.8M',
            supplyApy: 7.5,
            totalBorrowed: '$2.7M',
            borrowApy: 9.8
        },
        {
            id: 'lp-wbtc-usdc-vault',
            name: 'WBTC',
            tokens: {
                first: {
                    symbol: 'WBTC',
                    icon: iconwbtc
                },
            },
            apy: 6.7,
            tvl: '$18.9M',
            description: 'Earn yield by providing liquidity to the BTC-USDC pool. This vault automatically compounds rewards into more LP tokens to maximize your returns.',
            userBalance: '0.00',
            tags: ['Stable'],
            dailyYield: '0.0183%',
            protocolFee: '0.5%',
            withdrawalTime: 'Instant',
            depositRatio: '48.50%/51.50%',
            totalSupply: '$15.2M',
            supplyApy: 6.2,
            totalBorrowed: '$3.7M',
            borrowApy: 8.1
        },
        {
            id: 'lp-shmon-mon-vault',
            name: 'shMON',
            tokens: {
                first: {
                    symbol: 'shMON',
                    icon: iconshmonad
                },
            },
            apy: 32.8,
            tvl: '$2.2M',
            description: 'Earn yield by providing liquidity to the shMON-MON pool. This vault automatically compounds rewards into more LP tokens to maximize your returns.',
            userBalance: '0.00',
            tags: ['High Yield', 'New'],
            dailyYield: '0.0898%',
            protocolFee: '1.0%',
            withdrawalTime: 'Instant',
            depositRatio: '52.10%/47.90%',
            totalSupply: '$1.6M',
            supplyApy: 30.2,
            totalBorrowed: '$0.6M',
            borrowApy: 38.5
        },
        {
            id: 'lp-sol-usdc-vault',
            name: 'WSOL',
            tokens: {
                first: {
                    symbol: 'WSOL',
                    icon: iconsol
                },
            },
            apy: 7.5,
            tvl: '$8.7M',
            description: 'Earn yield by providing liquidity to the SOL-USDC pool. This vault automatically compounds rewards into more LP tokens to maximize your returns.',
            userBalance: '0.00',
            tags: ['Popular'],
            dailyYield: '0.0205%',
            protocolFee: '0.5%',
            withdrawalTime: 'Instant',
            depositRatio: '50.00%/50.00%',
            totalSupply: '$6.9M',
            supplyApy: 7.1,
            totalBorrowed: '$1.8M',
            borrowApy: 8.9
        },
        {
            id: 'lp-aprmon-mon-vault',
            name: 'APRMON',
            tokens: {
                first: {
                    symbol: 'APRMON',
                    icon: iconaprmonad
                },
            },
            apy: 9.1,
            tvl: '$5.3M',
            description: 'Earn yield by providing liquidity to the AVAX-USDC pool. This vault automatically compounds rewards into more LP tokens to maximize your returns.',
            userBalance: '0.00',
            tags: ['Medium Risk'],
            dailyYield: '0.0249%',
            protocolFee: '0.5%',
            withdrawalTime: 'Instant',
            depositRatio: '50.00%/50.00%',
            totalSupply: '$4.2M',
            supplyApy: 8.6,
            totalBorrowed: '$1.1M',
            borrowApy: 10.8
        },
        {
            id: 'lp-dak-monad-vault',
            name: 'DAK',
            tokens: {
                first: {
                    symbol: 'DAK',
                    icon: icondak
                },
            },
            apy: 11.2,
            tvl: '$3.9M',
            description: 'Earn yield by providing liquidity to the ARB-USDC pool. This vault automatically compounds rewards into more LP tokens to maximize your returns.',
            userBalance: '0.00',
            tags: ['High Volume'],
            dailyYield: '0.0307%',
            protocolFee: '0.75%',
            withdrawalTime: 'Instant',
            depositRatio: '50.00%/50.00%',
            totalSupply: '$3.1M',
            supplyApy: 10.5,
            totalBorrowed: '$0.8M',
            borrowApy: 13.2
        },
        {
            id: 'lp-yaki-mon-vault',
            name: 'YAKI',
            tokens: {
                first: {
                    symbol: 'YAKI',
                    icon: iconyaki
                },
            },
            apy: 15.3,
            tvl: '$1.8M',
            description: 'Earn yield by providing liquidity to the CHZ-USDC pool. This vault automatically compounds rewards into more LP tokens to maximize your returns.',
            userBalance: '0.00',
            tags: ['High APY'],
            dailyYield: '0.0419%',
            protocolFee: '0.75%',
            withdrawalTime: 'Instant',
            depositRatio: '50.00%/50.00%',
            totalSupply: '$1.4M',
            supplyApy: 14.2,
            totalBorrowed: '$0.4M',
            borrowApy: 18.1
        },
        {
            id: 'lp-chog-usdc-vault',
            name: 'CHOG',
            tokens: {
                first: {
                    symbol: 'CHOG',
                    icon: iconchog
                },
            },
            apy: 42.7,
            tvl: '$0.9M',
            description: 'Earn yield by providing liquidity to the CHOG-USDC pool. This vault automatically compounds rewards into more LP tokens to maximize your returns.',
            userBalance: '0.00',
            tags: ['High APY', 'High Risk'],
            dailyYield: '0.1170%',
            protocolFee: '1.0%',
            withdrawalTime: 'Instant',
            depositRatio: '47.25%/52.75%',
            totalSupply: '$0.7M',
            supplyApy: 39.8,
            totalBorrowed: '$0.2M',
            borrowApy: 48.5
        },
        {
            id: 'lp-smon-mon-vault',
            name: 'sMON',
            tokens: {
                first: {
                    symbol: 'sMON',
                    icon: iconsmon
                },
            },
            apy: 8.9,
            tvl: '$4.3M',
            description: 'Earn yield by providing liquidity to the XRP-USDT pool. This vault automatically compounds rewards into more LP tokens to maximize your returns.',
            userBalance: '0.00',
            tags: ['Medium Risk'],
            dailyYield: '0.0244%',
            protocolFee: '0.5%',
            withdrawalTime: 'Instant',
            depositRatio: '50.00%/50.00%',
            totalSupply: '$3.4M',
            supplyApy: 8.3,
            totalBorrowed: '$0.9M',
            borrowApy: 10.5
        },
        {
            id: 'lp-usdt-usdc-vault',
            name: 'USDT',
            tokens: {
                first: {
                    symbol: 'USDT',
                    icon: iconusdt
                },
            },
            apy: 8.9,
            tvl: '$4.3M',
            description: 'Earn yield by providing liquidity to the XRP-USDT pool. This vault automatically compounds rewards into more LP tokens to maximize your returns.',
            userBalance: '0.00',
            tags: ['Medium Risk'],
            dailyYield: '0.0244%',
            protocolFee: '0.5%',
            withdrawalTime: 'Instant',
            depositRatio: '50.00%/50.00%',
            totalSupply: '$3.4M',
            supplyApy: 8.3,
            totalBorrowed: '$0.9M',
            borrowApy: 10.5
        },
    ];

    useEffect(() => {
        const lpAutoFavoriteDefaults = () => {
            lpDefaultTokens.forEach(symbol => {
                const token = lpAvailableTokens.find(t => t.symbol === symbol);
                if (token && !favorites.includes(token.address)) {
                    toggleFavorite(token.address);
                }
            });
        };

        lpAutoFavoriteDefaults();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (lpSearchRef.current && !lpSearchRef.current.contains(event.target as Node)) {
                setLpIsSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getLpFavoriteTokens = () => {
        return lpAvailableTokens.filter(token =>
            favorites.includes(token.address)
        );
    };

    const lpFilteredTokens = lpSearchQuery.length > 0
        ? lpAvailableTokens.filter(token => {
            const isAlreadySelected = lpSelectedTokens.some(t => t.symbol === token.symbol);
            if (isAlreadySelected) return false;
            return token.symbol.toLowerCase().includes(lpSearchQuery.toLowerCase()) ||
                token.name.toLowerCase().includes(lpSearchQuery.toLowerCase());
        })
        : [];

    const getLpRemainingTokens = () => {
        return lpAvailableTokens.filter(token =>
            !lpSelectedTokens.some(t => t.symbol === token.symbol)
        );
    };

    const [lpHoveredTvl, setLpHoveredTvl] = useState<number | null>(null);

    const lpFilteredVaults = lpVaults.filter(vault => {
        const tokenMatch =
            lpSelectedTokens.length === 0 ||
            lpSelectedTokens.every(token =>
                vault.tokens.first.symbol === token.symbol
            );

        const isDeposited = lpActiveTab === 'deposited'
            ? parseFloat(vault.userBalance) > 0
            : true;

        return tokenMatch && isDeposited;
    });

    const handleLpTokenToggle = (token: LPToken) => {
        setLpSelectedTokens(prev => {
            if (prev.length >= 2) return prev;
            if (prev.some(t => t.symbol === token.symbol)) return prev;
            return [...prev, token];
        });
        setLpSearchQuery('');
        lpSearchInputRef.current?.focus();
    };

    const removeLpSelectedToken = (tokenSymbol: string) => {
        setLpSelectedTokens(prev => prev.filter(t => t.symbol !== tokenSymbol));
    };

    const handleLpFavoriteToggle = (token: LPToken, e: React.MouseEvent) => {
        e.stopPropagation();
        if (lpDefaultTokens.includes(token.symbol)) return;
        toggleFavorite(token.address);
    };

    const isLpTokenFavorited = (token: LPToken) => {
        return favorites.includes(token.address);
    };

    const showLpVaultDetail = (vaultId: string) => {
        setLpSelectedVault(vaultId);
    };

    const backToLpList = () => {
        setLpSelectedVault(null);
    };

    const handleLpSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        setLpSliderValue(value);
        setLpDepositAmount((value / 100 * 10).toFixed(2));
    };

    const toggleLpTokenSelection = (index: number) => {
        const updatedTokens = lpDepositTokens.map((token, i) => ({
            ...token,
            selected: i === index
        }));
        setLpDepositTokens(updatedTokens);
    };

    const lpSelectedVaultData = lpSelectedVault ? lpVaults.find(vault => vault.id === lpSelectedVault) : null;

    return (
        <div className="lp-container">
            <div className="lp-content-wrapper">

                {!lpSelectedVault && (
                    <div className="lp-overview-charts">
                        <div className="lp-overview-chart">
                            <div className="lp-total-value-locked-container">
                                <span className="lp-total-tvl-subtitle">Total Value Locked</span>
                                <span className="lp-total-tvl">
                                    ${lpHoveredTvl !== null ? lpHoveredTvl.toLocaleString() + 'M' : '192.42M'}
                                </span>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={lpTvlData}
                                    onMouseMove={(e) => {
                                        if (e.isTooltipActive && e.activePayload) {
                                            setLpHoveredTvl(e.activePayload[0].payload.tvl);
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        setLpHoveredTvl(null);
                                    }}
                                >
                                    <defs>
                                        <linearGradient id="lpTvlGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#50F08D" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#50F08D" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} horizontal={false} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ display: 'none' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="tvl"
                                        stroke="url(#lpTvlGrad)"
                                        strokeWidth={1}
                                        dot={false}
                                        activeDot={{ r: 6, stroke: '#aaaecf', strokeWidth: 1, fill: '#0f0f12' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="lp-overview-chart">
                            <div className="lp-total-value-locked-container">
                                <span className="lp-total-tvl-subtitle">Average APY Trends</span>
                                <span className="lp-total-tvl">$192.42M</span>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={lpApyTrendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="lpApySupplyGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#50F08D" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#50F08D" stopOpacity={0.2} />
                                        </linearGradient>
                                        <linearGradient id="lpApyBorrowGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#7F82AC" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#7F82AC" stopOpacity={0.2} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} horizontal={false} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1f', border: 'none' }}
                                        labelStyle={{ color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar
                                        dataKey="supplyApy"
                                        name="Supply APY"
                                        stackId="a"
                                        barSize={14}
                                        radius={[4, 4, 0, 0]}
                                        fill="url(#lpApySupplyGrad)"
                                    />
                                    <Bar
                                        dataKey="borrowApy"
                                        name="Borrow APY"
                                        stackId="a"
                                        barSize={14}
                                        radius={[4, 4, 0, 0]}
                                        fill="url(#lpApyBorrowGrad)"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="lp-rectangle">
                    {!lpSelectedVault ? (
                        <>
                            <div className="lp-vaults-grid">
                                <div className="lp-vaults-list-header">
                                    <div className="lp-col lp-asset-col">Asset</div>
                                    <div className="lp-col lp-supply-col">Total Supply</div>
                                    <div className="lp-col lp-borrowed-col">Total Borrowed</div>
                                    <div className="lp-col lp-borrowed-col">Borrow LTV</div>
                                    <div className="lp-col lp-supply-apy-col">Supply APY</div>
                                    <div className="lp-col lp-borrow-apy-col">Borrow APY</div>
                                </div>

                                {lpFilteredVaults.map((vault) => (
                                    <div
                                        key={vault.id}
                                        className="lp-card"
                                        onClick={() => showLpVaultDetail(vault.id)}
                                    >
                                        <div className="lp-summary">
                                            <div className="lp-col lp-asset-col">
                                                <Star
                                                    size={20}
                                                    className="vault-search-token-star"
                                                    onClick={(e) => handleLpFavoriteToggle({
                                                        symbol: vault.tokens.first.symbol,
                                                        icon: vault.tokens.first.icon,
                                                        name: vault.name,
                                                        address: vault.id
                                                    }, e)}
                                                    fill="none"
                                                    color="#ffffff79"
                                                />
                                                <div className="lp-token-pair-icons">
                                                    <img
                                                        src={vault.tokens.first.icon}
                                                        alt={vault.tokens.first.symbol}
                                                        className="lp-token-icon lp-token-icon-first"
                                                    />
                                                </div>
                                                <div className="lp-asset-info">
                                                    <h3 className="lp-listname">{vault.name}</h3>
                                                </div>
                                            </div>

                                            <div className="lp-col lp-supply-col">
                                                <div className="lp-supply-value lp-supply-tooltip-wrapper">
                                                    <div className="lp-token-amount-display">{vault.totalSupply.replace('$', ' ')}</div>
                                                    <span className="lp-apy-value-text"> $2.8M </span>
                                                    <div className="lp-supply-tooltip">
                                                        <div className="lp-supply-tooltip-header">
                                                            <span className="lp-supply-tooltip-sub">UTILIZATION</span>
                                                            <span>88.04%</span>
                                                        </div>

                                                        <div className="lp-supply-tooltip-body">
                                                            <div className="lp-supply-chart">
                                                                <svg width="35" height="35" viewBox="0 0 36 36">
                                                                    <path className="lp-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 1 1 0 31.831 a 15.9155 15.9155 0 1 1 0 -31.831" />
                                                                    <path className="lp-circle-usage" strokeDasharray="88.04, 100" d="M18 2.0845 a 15.9155 15.9155 0 1 1 0 31.831 a 15.9155 15.9155 0 1 1 0 -31.831" />
                                                                </svg>
                                                            </div>

                                                            <div className="lp-supply-tooltip-metrics">
                                                                <div className="lp-supply-tooltip-top-row">
                                                                    <div className="lp-supply-tooltip-top-row-left">
                                                                        <span className="lp-supply-tooltip-title-top">Total Supplied</span>
                                                                        <span>2.64M / 3.00M</span>
                                                                    </div>
                                                                    <div className="lp-supply-tooltip-top-row-right">
                                                                        <span className="lp-supply-tooltip-title-top">Supply APY</span>
                                                                        <span>1.67%</span>
                                                                    </div>
                                                                </div>

                                                            </div>
                                                        </div>
                                                        <div className="lp-supply-tooltip-body-bottom">
                                                            <span className="lp-risk-text">RISK PARAMETERS</span>
                                                            <div className="lp-supply-tooltip-body-bottom-line"> </div>
                                                        </div>
                                                        <div className="lp-supply-tooltip-row">
                                                            <span className="lp-supply-row-detail">Max LTV</span>
                                                            <span className="lp-supply-row-value">80.50%</span>
                                                        </div>
                                                        <div className="lp-supply-tooltip-row">
                                                            <span className="lp-supply-row-detail">Liquidation Threshold</span>
                                                            <span className="lp-supply-row-value">83.00%</span>
                                                        </div>
                                                        <div className="lp-supply-tooltip-row">
                                                            <span className="lp-supply-row-detail">Liquidation Penalty</span>
                                                            <span className="lp-supply-row-value">5.00%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="lp-col lp-borrowed-col">
                                                <div className="lp-borrowed-amount-display">{vault.totalSupply.replace('$', ' ')}</div>
                                                <div className="lp-borrowed-value">{vault.totalBorrowed}</div>
                                            </div>
                                            <div className="lp-col lp-borrowed-ltv">80%</div>
                                            <div className="lp-col lp-supply-apy-col">
                                                <div className="lp-supply-apy-value"> {vault.supplyApy}%</div>
                                                <img src={iconwbtc} alt="WBTC" className="lp-collateral-token-icon" />
                                                <img src={iconshmonad} alt="shMON" className="lp-collateral-token-icon" />
                                                <img src={iconsol} alt="SOL" className="lp-collateral-token-icon" />
                                                <button
                                                    className="lp-supply-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setpopup(19);
                                                    }}
                                                >
                                                    Supply
                                                </button>
                                            </div>


                                            <div className="lp-col lp-borrow-apy-col">
                                                <div className="lp-borrow-apy-value">{vault.borrowApy}%</div>

                                                <button
                                                    className="lp-supply-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setpopup(19);

                                                    }}
                                                >
                                                    Borrow
                                                </button>
                                            </div>


                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="lp-detail-view">
                            <div className="lp-detail-header">
                                <button className="lp-back-button" onClick={backToLpList}>
                                    <ChevronLeft size={18} />
                                    <span>Back to Vaults</span>
                                </button>
                            </div>

                            {lpSelectedVaultData && (
                                <>
                                    <div className="lp-detail-summary">
                                        <div className="lp-detail-top">
                                            <div className="lp-detail-asset">
                                                <div className="lp-detail-token-pair">
                                                    <img
                                                        src={lpSelectedVaultData.tokens.first.icon}
                                                        alt={lpSelectedVaultData.tokens.first.symbol}
                                                        className="lp-detail-token-icon lp-first-token"
                                                    />
                                                </div>
                                                <div>
                                                    <h2 className="lp-detail-name">{lpSelectedVaultData.name}</h2>
                                                </div>
                                            </div>
                                            <div className="lp-detail-stats">
                                                <div className="lp-detail-stat">
                                                    <span className="lp-stat-label">APY</span>
                                                    <span className="lp-stat-value">{lpSelectedVaultData.apy}%</span>
                                                </div>
                                                <div className="lp-detail-stat">
                                                    <span className="lp-stat-label">TVL</span>
                                                    <span className="lp-stat-value">{lpSelectedVaultData.tvl}</span>
                                                </div>
                                                <div className="lp-detail-stat">
                                                    <span className="lp-stat-label">Daily Yield</span>
                                                    <span className="lp-stat-value">{lpSelectedVaultData.dailyYield}</span>
                                                </div>
                                                <div className="lp-detail-stat">
                                                    <span className="lp-stat-label">Supply APY</span>
                                                    <span className="lp-stat-value">{lpSelectedVaultData.supplyApy}%</span>
                                                </div>
                                                <div className="lp-detail-stat">
                                                    <span className="lp-stat-label">Borrow APY</span>
                                                    <span className="lp-stat-value">{lpSelectedVaultData.borrowApy}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lp-performance-chart-container">
                                            <h4 className="lp-performance-chart-header">
                                                Performance <TrendingUp size={16} />
                                            </h4>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={lpPerformanceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                                    <XAxis dataKey="name" stroke="#ffffff79" />
                                                    <YAxis stroke="#ffffff79" />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: "#1a1a1f", border: "none" }}
                                                        labelStyle={{ color: "#fff" }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#50f08dde"
                                                        strokeWidth={2}
                                                        dot={{ r: 4, fill: "#50f08dde" }}
                                                        activeDot={{ r: 6 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="lp-detail-description">
                                            <h4>About {lpSelectedVaultData.name}</h4>
                                            <p>{lpSelectedVaultData.description}</p>
                                            <a href="#" className="lp-learn-more">
                                                Learn more <ArrowUpRight size={14} />
                                            </a>
                                        </div>

                                        <div className="lp-trade-info-rectangle">
                                            <div className="lp-info-row">
                                                <div className="lp-label-container">Protocol Fee</div>
                                                <div className="lp-value-container">{lpSelectedVaultData.protocolFee}</div>
                                            </div>
                                            <div className="lp-info-row">
                                                <div className="lp-label-container">Withdrawal Time</div>
                                                <div className="lp-value-container">{lpSelectedVaultData.withdrawalTime}</div>
                                            </div>
                                            <div className="lp-info-row">
                                                <div className="lp-label-container">Total Supply</div>
                                                <div className="lp-value-container">{lpSelectedVaultData.totalSupply}</div>
                                            </div>
                                            <div className="lp-info-row">
                                                <div className="lp-label-container">Total Borrowed</div>
                                                <div className="lp-value-container">{lpSelectedVaultData.totalBorrowed}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lp-deposit-section">
                                        <div className="lp-deposit-menu-container">
                                            <h4 className="lp-deposit-menu-header">Deposit Amounts</h4>

                                            {lpDepositTokens.map((token, index) => (
                                                <div key={index} className="lp-token-deposit-item">
                                                    <div className="lp-token-header">
                                                        <span className="lp-token-label">{token.symbol} Deposit</span>
                                                        <div className="lp-token-balance">0</div>
                                                    </div>

                                                    <div className="lp-token-amount-row">
                                                        <div className="lp-token-amount">0.00</div>
                                                        <div
                                                            className="lp-token-badge"
                                                            onClick={() => toggleLpTokenSelection(index)}
                                                        >
                                                            <img
                                                                src={token.icon}
                                                                alt={token.symbol}
                                                                className="lp-token-icon"
                                                            />
                                                            <span className="lp-token-symbol">{token.symbol}</span>
                                                            {token.selected && (
                                                                <div className="lp-token-selector">
                                                                    <div className="lp-token-selector-inner"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="lp-token-usd-value">${token.usdValue}</div>
                                                </div>
                                            ))}

                                            <div className="lp-deposit-total-row">
                                                <div className="lp-deposit-total-label">Total Amount</div>
                                                <div className="lp-deposit-total-value">$0</div>
                                            </div>

                                            <button className="lp-connect-button">Connect Account</button>

                                            <div className="lp-deposit-ratio-row">
                                                <div>Deposit Ratio</div>
                                                <div className="lp-deposit-ratio-display">
                                                    <span>{lpSelectedVaultData.depositRatio}</span>
                                                    <div className="lp-token-indicators">
                                                        <div className="lp-token-indicator lp-token-indicator-a">A</div>
                                                        <div className="lp-token-indicator lp-token-indicator-b">B</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LPVaults;