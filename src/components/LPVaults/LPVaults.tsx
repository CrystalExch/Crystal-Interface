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
import walleticon from '../../assets/wallet_icon.png';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

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
export interface Token {
    icon: string;
    symbol: string;
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
    onSelectToken: (token: Token) => void;
    selectedToken: Token | null;
    tokenBalances: { [address: string]: bigint };
    tokendict: { [address: string]: any };
    address?: string;
    connected: boolean;
    refetch: () => void;

}


const chartData = [
    { date: '3 Mar', value: 600 },
    { date: '10 Mar', value: 580 },
    { date: '17 Mar', value: 560 },
    { date: '24 Mar', value: 540 },
    { date: '31 Mar', value: 520 },
    { date: '7 Apr', value: 480 },
    { date: '14 Apr', value: 460 },
    { date: '21 Apr', value: 380 },
    { date: '28 Apr', value: 370 },
    { date: '5 May', value: 365 },
    { date: '12 May', value: 350 },
    { date: '19 May', value: 330 },
    { date: '26 May', value: 310 },
    { date: '2 Jun', value: 275.51 }
];
const apyChartData = [
    { date: '1 May', value: 18.2 },
    { date: '2 May', value: 21.5 },
    { date: '3 May', value: 19.8 },
    { date: '4 May', value: 24.1 },
    { date: '5 May', value: 27.3 },
    { date: '6 May', value: 23.9 },
    { date: '7 May', value: 26.7 },
    { date: '8 May', value: 22.4 },
    { date: '9 May', value: 29.1 },
    { date: '10 May', value: 31.5 },
    { date: '11 May', value: 28.8 },
    { date: '12 May', value: 25.6 },
    { date: '13 May', value: 22.3 },
    { date: '14 May', value: 26.9 },
    { date: '15 May', value: 30.2 },
    { date: '16 May', value: 33.7 },
    { date: '17 May', value: 29.4 },
    { date: '18 May', value: 31.8 },
    { date: '19 May', value: 27.5 },
    { date: '20 May', value: 24.9 },
    { date: '21 May', value: 28.3 },
    { date: '22 May', value: 32.1 },
    { date: '23 May', value: 35.4 },
    { date: '24 May', value: 31.7 },
    { date: '25 May', value: 28.9 },
    { date: '26 May', value: 25.8 },
    { date: '27 May', value: 23.6 },
    { date: '28 May', value: 26.1 },
    { date: '29 May', value: 24.8 },
    { date: '30 May', value: 24.5 }
];
const LPVaults: React.FC<LPVaultsProps> = ({
    setpopup,
    setSupplyBorrowInitialTab,
    setSupplyBorrowVault,
    onSelectToken,
    selectedToken,
    tokenBalances,
    tokendict,
    address,
    connected,
    refetch }) => {
    const [lpActiveTab, setLpActiveTab] = useState<'all' | 'deposited'>('all');
    const [lpSelectedVault, setLpSelectedVault] = useState<string | null>(null);
    const [lpDepositAmount, setLpDepositAmount] = useState('0.00');
    const [lpSliderValue, setLpSliderValue] = useState(0);
    const [lpSearchQuery, setLpSearchQuery] = useState('');
    const [lpIsSearchOpen, setLpIsSearchOpen] = useState(false);
    const [lpSelectedTokens, setLpSelectedTokens] = useState<LPToken[]>([]);
    const lpSearchRef = useRef<HTMLDivElement>(null);
    const [chartPeriod, setChartPeriod] = useState('3 months');
    const [chartCurrency, setChartCurrency] = useState('USDC');
    const { favorites, toggleFavorite } = useSharedContext();
    const [lpDepositTokens, setLpDepositTokens] = useState<LPTokenDeposit[]>([]);
    const [lpTokenAmounts, setLpTokenAmounts] = useState<{ [key: string]: string }>({});

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    const lpAvailableTokens: LPToken[] = [
        {
            symbol: 'MON',
            icon: iconmonad,
            name: 'Monad',
            address: Object.values(tokendict).find((t: any) => t.ticker === 'MON')?.address || '0x1234...mon'
        },
        {
            symbol: 'WMON',
            icon: iconwmonad,
            name: 'Wrapped Monad',
            address: Object.values(tokendict).find((t: any) => t.ticker === 'WMON')?.address || '0x1234...wmon'
        },
        {
            symbol: 'USDC',
            icon: iconusdc,
            name: 'USD Coin',
            address: Object.values(tokendict).find((t: any) => t.ticker === 'USDC')?.address || '0x1234...usdc'
        },
        {
            symbol: 'WETH',
            icon: iconweth,
            name: 'Wrapped Ether',
            address: Object.values(tokendict).find((t: any) => t.ticker === 'WETH')?.address || '0x1234...weth'
        },
        {
            symbol: 'WBTC',
            icon: iconwbtc,
            name: 'Wrapped Bitcoin',
            address: Object.values(tokendict).find((t: any) => t.ticker === 'WBTC')?.address || '0x1234...wbtc'
        },
        {
            symbol: 'shMON',
            icon: iconshmonad,
            name: 'Kintsu Staked Monad',
            address: Object.values(tokendict).find((t: any) => t.ticker === 'shMON')?.address || '0x1234...shmon'
        },
        {
            symbol: 'SOL',
            icon: iconsol,
            name: 'Wrapped Solana',
            address: Object.values(tokendict).find((t: any) => t.ticker === 'SOL')?.address || '0x1234...sol'
        },
        {
            symbol: 'APRMON',
            icon: iconaprmonad,
            name: 'aPriori Monad LST',
            address: Object.values(tokendict).find((t: any) => t.ticker === 'APRMON')?.address || '0x1234...aprmon'
        },
        {
            symbol: 'DAK',
            icon: icondak,
            name: 'Molandak',
            address: Object.values(tokendict).find((t: any) => t.ticker === 'DAK')?.address || '0x1234...dak'
        },
        {
            symbol: 'YAKI',
            icon: iconyaki,
            name: 'Moyaki',
            address: Object.values(tokendict).find((t: any) => t.ticker === 'YAKI')?.address || '0x1234...yaki'
        },
        {
            symbol: 'CHOG',
            icon: iconchog,
            name: 'Chog',
            address: Object.values(tokendict).find((t: any) => t.ticker === 'CHOG')?.address || '0x1234...chog'
        },
        {
            symbol: 'sMON',
            icon: iconsmon,
            name: 'shMonad',
            address: Object.values(tokendict).find((t: any) => t.ticker === 'sMON')?.address || '0x1234...smon'
        },
        {
            symbol: 'USDT',
            icon: iconusdt,
            name: 'Tether USD',
            address: Object.values(tokendict).find((t: any) => t.ticker === 'USDT')?.address || '0x1234...usdt'
        },
    ];
    const lpDefaultTokens = ['MON', 'WMON', 'USDC'];
    const [lpChartView, setLpChartView] = useState<'overview' | 'positions'>('overview');

    const lpVaults: LPVault[] = [
        {
            id: 'lp-mon-usdc-vault',
            name: 'Monad',
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
            name: 'Wrapped Bitcoin',
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
            name: 'shMonad',
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
            name: 'Wrapped Solana',
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
            name: 'aPriori Monad LST',
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
            name: 'Molandak',
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
            name: 'Moyaki',
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
            name: 'Chog',
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
            name: 'Kintsu Staked Monad',
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
            name: 'Tether USD',
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


    const formatDisplayValue = (
        rawAmount: bigint,
        decimals = 18,
        precision = 3,
    ) => {
        const actualAmount = customRound(
            Number(rawAmount) / 10 ** Number(decimals),
            precision,
        );

        if (parseFloat(actualAmount) < 1) {
            return actualAmount.toString();
        }

        if (parseFloat(actualAmount) >= 1e12) {
            return `${(parseFloat(actualAmount) / 1e12).toFixed(2)}T`;
        } else if (parseFloat(actualAmount) >= 1e9) {
            return `${(parseFloat(actualAmount) / 1e9).toFixed(2)}B`;
        } else if (parseFloat(actualAmount) >= 1e6) {
            return `${(parseFloat(actualAmount) / 1e6).toFixed(2)}M`;
        }

        return actualAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const customRound = (num: number, precision: number) => {
        const factor = Math.pow(10, precision);
        return (Math.round(num * factor) / factor).toString();
    };

    const getTokenBalance = (tokenSymbol: string): bigint => {
        const token = lpAvailableTokens.find(t => t.symbol === tokenSymbol);
        if (!token || !tokendict[token.address]) return BigInt(0);
        return tokenBalances[token.address] || BigInt(0);
    };

    const getFormattedBalance = (tokenSymbol: string): string => {
        const token = lpAvailableTokens.find(t => t.symbol === tokenSymbol);
        if (!token || !tokendict[token.address]) return '0';

        const balance = getTokenBalance(tokenSymbol);
        return formatDisplayValue(balance, Number(tokendict[token.address].decimals));
    };
    const handleLpFavoriteToggle = (token: LPToken, e: React.MouseEvent) => {
        e.stopPropagation();
        if (lpDefaultTokens.includes(token.symbol)) return;
        toggleFavorite(token.address);
    };
    const [apyChartPeriod, setApyChartPeriod] = useState('30 days');
    const [isApyDropdownOpen, setIsApyDropdownOpen] = useState(false);
    const apyDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (apyDropdownRef.current && !apyDropdownRef.current.contains(event.target as Node)) {
                setIsApyDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    const showLpVaultDetail = (vaultId: string) => {
        setLpSelectedVault(vaultId);
    };

    const backToLpList = () => {
        setLpSelectedVault(null);
    };

    const lpSelectedVaultData = lpSelectedVault ? lpVaults.find(vault => vault.id === lpSelectedVault) : null;
    useEffect(() => {
        if (lpSelectedVaultData) {
            const tokenSymbol = lpSelectedVaultData.tokens.first.symbol;
            setLpDepositTokens([
                {
                    symbol: tokenSymbol,
                    icon: lpSelectedVaultData.tokens.first.icon,
                    amount: lpTokenAmounts[tokenSymbol] || '',
                    usdValue: '0.00',
                    selected: true
                },
            ]);
        }
    }, [lpSelectedVaultData, lpTokenAmounts]);
    const handleLpTokenAmountChange = (tokenSymbol: string, value: string) => {
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setLpTokenAmounts(prev => ({
                ...prev,
                [tokenSymbol]: value
            }));
        }
    };
    return (
        <div className="lp-container">
            <div className="lp-content-wrapper">


                {!lpSelectedVault && (
                    <>
                        <span className="vaults-title">Vaults</span>
                        <span className="tvl-title">Total Value Locked</span>
                        <span className="tvl-subtitle">$28,230,857</span>
                    </>
                )}
                <div className={`lp-rectangle ${lpSelectedVault ? 'lp-rectangle-no-border' : ''}`}>
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
                                                    <h2 className="lp-listname">{vault.name}<span className='lp-asset-ticker'>{vault.tokens.first.symbol}</span></h2>

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
                                                        onSelectToken({
                                                            icon: vault.tokens.first.icon,
                                                            symbol: vault.tokens.first.symbol,
                                                        });
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
                                                        onSelectToken({
                                                            icon: vault.tokens.first.icon,
                                                            symbol: vault.tokens.first.symbol,
                                                        });
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
                                <div className="lp-breadcrumb">
                                    <button className="lp-breadcrumb-back" onClick={backToLpList}>
                                        <span>Vaults</span>
                                    </button>
                                    <ChevronLeft size={16} className="lp-breadcrumb-arrow" />
                                    <span className="lp-breadcrumb-current">{lpSelectedVaultData?.name}</span>
                                </div>
                            </div>

                            {lpSelectedVaultData && (
                                <>                                        <div className="lp-detail-top">
                                    <div className="lp-detail-asset">
                                        <div className="lp-detail-token-pair">
                                            <img
                                                src={lpSelectedVaultData.tokens.first.icon}
                                                alt={lpSelectedVaultData.tokens.first.symbol}
                                                className="lp-detail-token-icon lp-first-token"
                                            />
                                        </div>
                                        <div>
                                            <h2 className="lp-detail-name">{lpSelectedVaultData.tokens.first.symbol}</h2>

                                        </div>
                                    </div>

                                </div>

                                    <div className="lp-detail-content">
                                        <div className="lp-detail-summary">
                                            <div className="lp-detail-description">
                                                <h4>About {lpSelectedVaultData.name}</h4>
                                                <p>{lpSelectedVaultData.description}
                                                    <a href="#" className="lp-learn-more">
                                                        Learn more
                                                    </a></p>

                                            </div>
                                            <div className="lp-detail-stats">
                                                <div className="lp-detail-stat">
                                                    <span className="lp-stat-label">APY</span>
                                                    <span className="lp-stat-value">{lpSelectedVaultData.apy}%</span>
                                                </div>
                                                <div className="lp-detail-stat">
                                                    <span className="lp-stat-label">Liquidity</span>
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
                                            <div className="lp-chart-toggle-section">
                                                <button
                                                    className={`lp-chart-toggle-btn ${lpChartView === 'overview' ? 'active' : ''}`}
                                                    onClick={() => setLpChartView('overview')}
                                                >
                                                    Overview
                                                </button>
                                                <button
                                                    className={`lp-chart-toggle-btn ${lpChartView === 'positions' ? 'active' : ''}`}
                                                    onClick={() => setLpChartView('positions')}
                                                >
                                                    Your Positions
                                                </button>
                                            </div>
                                            {lpChartView === 'overview' ? (
                                                <div className="lp-charts-wrapper">

                                                    <div className="lp-chart-container">
                                                        <div className="lp-chart-header">
                                                            <div className="lp-chart-left">
                                                                <h4 className="lp-chart-title">
                                                                    Total Deposits ({chartCurrency})
                                                                </h4>
                                                                <div className="lp-chart-value">$275.51M</div>
                                                            </div>
                                                            <div className="lp-chart-right">
                                                                <div className="lp-chart-controls">
                                                                    <div className="lp-chart-toggle">
                                                                        <button
                                                                            className={`lp-chart-toggle-btn ${chartCurrency === lpSelectedVaultData.tokens.first.symbol ? 'active' : ''}`}
                                                                            onClick={() => setChartCurrency(lpSelectedVaultData.tokens.first.symbol)}
                                                                        >
                                                                            {lpSelectedVaultData.tokens.first.symbol}
                                                                        </button>
                                                                        <button
                                                                            className={`lp-chart-toggle-btn ${chartCurrency === 'USDC' ? 'active' : ''}`}
                                                                            onClick={() => setChartCurrency('USDC')}
                                                                        >
                                                                            USDC
                                                                        </button>
                                                                    </div>
                                                                    <div className="lp-chart-dropdown" ref={dropdownRef}>
                                                                        <button
                                                                            className="lp-chart-dropdown-trigger"
                                                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                                        >
                                                                            {chartPeriod}
                                                                            <ChevronDown size={16} className={`lp-dropdown-icon ${isDropdownOpen ? 'open' : ''}`} />
                                                                        </button>
                                                                        {isDropdownOpen && (
                                                                            <div className="lp-chart-dropdown-menu">
                                                                                {['3 months', '6 months', '1 year'].map((period) => (
                                                                                    <button
                                                                                        key={period}
                                                                                        className={`lp-chart-dropdown-item ${chartPeriod === period ? 'active' : ''}`}
                                                                                        onClick={() => {
                                                                                            setChartPeriod(period);
                                                                                            setIsDropdownOpen(false);
                                                                                        }}
                                                                                    >
                                                                                        {period}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="lp-chart-wrapper">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <AreaChart data={chartData}>
                                                                    <defs>
                                                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="0%" stopColor="#c0c5ed" stopOpacity={0.4} />
                                                                            <stop offset="50%" stopColor="#aaaecf" stopOpacity={0.1} />
                                                                            <stop offset="100%" stopColor="#9599bf" stopOpacity={0} />
                                                                        </linearGradient>
                                                                    </defs>
                                                                    <XAxis
                                                                        dataKey="date"
                                                                        axisLine={false}
                                                                        tickLine={false}
                                                                        tick={{ fill: '#ffffff79', fontSize: 12 }}
                                                                    />
                                                                    <Area
                                                                        type="monotone"
                                                                        dataKey="value"
                                                                        stroke="#aaaecf"
                                                                        strokeWidth={2}
                                                                        fill="url(#chartGradient)"
                                                                        dot={false}
                                                                        activeDot={{ r: 4, fill: "#aaaecf", stroke: "#aaaecf", strokeWidth: 2 }}
                                                                    />
                                                                </AreaChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                    <div className="lp-chart-container">
                                                        <div className="lp-chart-header">
                                                            <div className="lp-chart-left">
                                                                <h4 className="lp-chart-title">
                                                                    APY Performance
                                                                </h4>
                                                                <div className="lp-chart-value">{lpSelectedVaultData.apy}%</div>
                                                            </div>
                                                            <div className="lp-chart-right">
                                                                <div className="lp-chart-controls">
                                                                    <div className="lp-chart-dropdown" ref={apyDropdownRef}>
                                                                        <button
                                                                            className="lp-chart-dropdown-trigger"
                                                                            onClick={() => setIsApyDropdownOpen(!isApyDropdownOpen)}
                                                                        >
                                                                            {apyChartPeriod}
                                                                            <ChevronDown size={16} className={`lp-dropdown-icon ${isApyDropdownOpen ? 'open' : ''}`} />
                                                                        </button>
                                                                        {isApyDropdownOpen && (
                                                                            <div className="lp-chart-dropdown-menu">
                                                                                {['30 days', '7 days', '90 days'].map((period) => (
                                                                                    <button
                                                                                        key={period}
                                                                                        className={`lp-chart-dropdown-item ${apyChartPeriod === period ? 'active' : ''}`}
                                                                                        onClick={() => {
                                                                                            setApyChartPeriod(period);
                                                                                            setIsApyDropdownOpen(false);
                                                                                        }}
                                                                                    >
                                                                                        {period}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="lp-chart-wrapper">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <AreaChart data={apyChartData}>
                                                                    <defs>
                                                                        <linearGradient id="apyChartGradient" x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="0%" stopColor="#c0c5ed" stopOpacity={0.4} />
                                                                            <stop offset="50%" stopColor="#aaaecf" stopOpacity={0.1} />
                                                                            <stop offset="100%" stopColor="#9599bf" stopOpacity={0} />
                                                                        </linearGradient>
                                                                    </defs>
                                                                    <XAxis
                                                                        dataKey="date"
                                                                        axisLine={false}
                                                                        tickLine={false}
                                                                        tick={{ fill: '#ffffff79', fontSize: 12 }}
                                                                    />
                                                                    <Area
                                                                        type="monotone"
                                                                        dataKey="value"
                                                                        stroke="#aaaecf"
                                                                        strokeWidth={2}
                                                                        fill="url(#apyChartGradient)"
                                                                        dot={false}
                                                                        activeDot={{ r: 4, fill: "#aaaecf", stroke: "#aaaecf", strokeWidth: 2 }}
                                                                    />
                                                                </AreaChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="lp-charts-wrapper">
                                                    <div className="lp-chart-container">
                                                        <div className="lp-chart-header">
                                                            <div className="lp-chart-left">
                                                                <h4 className="lp-chart-title">Your Positions</h4>
                                                                <div className="lp-chart-value">$12,345.67</div> 
                                                            </div>
                                                        </div>
                                                        <div className="lp-chart-wrapper">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <AreaChart data={chartData}>
                                                                    <defs>
                                                                        <linearGradient id="userChartGradient" x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="0%" stopColor="#c0c5ed" stopOpacity={0.4} />
                                                                            <stop offset="50%" stopColor="#aaaecf" stopOpacity={0.1} />
                                                                            <stop offset="100%" stopColor="#9599bf" stopOpacity={0} />
                                                                        </linearGradient>
                                                                    </defs>
                                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#ffffff79', fontSize: 12 }} />
                                                                    <Area
                                                                        type="monotone"
                                                                        dataKey="value"
                                                                        stroke="#aaaecf"
                                                                        strokeWidth={2}
                                                                        fill="url(#userChartGradient)"
                                                                        dot={false}
                                                                        activeDot={{ r: 4, fill: "#aaaecf", stroke: "#aaaecf", strokeWidth: 2 }}
                                                                    />
                                                                </AreaChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="lp-deposit-section">
                                            <div className="lp-deposit-menu-container">

                                                {lpDepositTokens.map((token, index) => (
                                                    <div key={`${lpSelectedVault}-${index}`} className="lp-token-deposit-item">
                                                        <div className="lp-token-header">
                                                            <span className="lp-token-label">Deposit {token.symbol}</span>

                                                            <div className="lp-token-balance">
                                                                <img className="lp-wallet-icon" src={walleticon} />
                                                                {connected && address ? getFormattedBalance(token.symbol) : '0'}
                                                            </div>                                                        </div>

                                                        <div className="lp-token-amount-row">
                                                            <input
                                                                type="text"
                                                                className="lp-token-amount-input"
                                                                value={lpTokenAmounts[token.symbol] || ''}
                                                                onChange={(e) => handleLpTokenAmountChange(token.symbol, e.target.value)}
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                        <div className="lp-token-input-bottom-row">
                                                            <div className="lp-token-usd-value">${token.usdValue}</div>
                                                            <button
                                                                className="lp-max-button"
                                                                onClick={() => {
                                                                    if (connected && address) {
                                                                        const balance = getTokenBalance(token.symbol);
                                                                        const tokenData = lpAvailableTokens.find(t => t.symbol === token.symbol);
                                                                        if (tokenData && tokendict[tokenData.address]) {
                                                                            const decimals = Number(tokendict[tokenData.address].decimals);
                                                                            const balanceAsNumber = Number(balance) / 10 ** decimals;
                                                                            handleLpTokenAmountChange(token.symbol, balanceAsNumber.toString());
                                                                        }
                                                                    }
                                                                }}                                                            >
                                                                MAX
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="lp-token-details-item">
                                                    <div className="lp-deposit-total-row">
                                                        <div className="lp-deposit-total-label">Total Amount</div>
                                                        <div className="lp-deposit-total-value">
                                                            ${lpDepositTokens.reduce((total, token) => {
                                                                const amount = lpTokenAmounts[token.symbol];
                                                                return total + (amount && amount !== '' ? parseFloat(amount) : 0);
                                                            }, 0).toFixed(2)}
                                                        </div>
                                                    </div>
                                                    <div className="lp-deposit-total-row">
                                                        <span className="lp-deposit-total-label">APY</span>
                                                        <span className="lp-deposit-total-value">{lpSelectedVaultData.apy}%</span>
                                                    </div>
                                                    <div className="lp-deposit-total-row">
                                                        <span className="lp-deposit-total-label">Projected Earnings / Month (USDC)</span>
                                                        <span className="lp-deposit-total-value">
                                                            ${(() => {
                                                                const totalAmount = lpDepositTokens.reduce((total, token) => {
                                                                    const amount = lpTokenAmounts[token.symbol];
                                                                    return total + (amount && amount !== '' ? parseFloat(amount) : 0);
                                                                }, 0);
                                                                const monthlyEarnings = (totalAmount * (lpSelectedVaultData.apy / 100)) / 12;
                                                                return monthlyEarnings.toFixed(2);
                                                            })()}
                                                        </span>
                                                    </div>

                                                    <div className="lp-deposit-total-row">
                                                        <span className="lp-deposit-total-label">Projected Earnings / Year (USDC)</span>
                                                        <span className="lp-deposit-total-value">
                                                            ${(() => {
                                                                const totalAmount = lpDepositTokens.reduce((total, token) => {
                                                                    const amount = lpTokenAmounts[token.symbol];
                                                                    return total + (amount && amount !== '' ? parseFloat(amount) : 0);
                                                                }, 0);
                                                                const yearlyEarnings = totalAmount * (lpSelectedVaultData.apy / 100);
                                                                return yearlyEarnings.toFixed(2);
                                                            })()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="lp-connect-button"
                                                    onClick={() => {
                                                        if (!connected) {
                                                            setpopup(4);
                                                        }
                                                    }}
                                                >
                                                    {connected ? 'Deposit' : 'Connect Account'}
                                                </button>                                            </div>
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