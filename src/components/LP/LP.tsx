import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUpRight, ChevronDown, ChevronLeft, Plus, Search, Star, X } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { encodeFunctionData } from "viem";
import { useQuery } from "@tanstack/react-query";
import { MaxUint256 } from "ethers";
import { useSharedContext } from '../../contexts/SharedContext';
import { fetchLatestPrice } from '../../utils/getPrice.ts';
import { CrystalVaultsAbi } from '../../abis/CrystalVaultsAbi';
import { settings } from "../../settings";
import './LP.css';

import iconmonad from '../../assets/iconmonad.png';
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
import verified from '../../assets/verified.png';

interface Vault {
  id: string;
  name: string;
  tokens: {
    first: {
      symbol: string;
      icon: string;
      feeAmount?: string;
    };
    second: {
      symbol: string;
      icon: string;
      feeAmount?: string;
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
  verified?: boolean;
  category?: 'LST' | 'Stable' | 'Regular';
}

interface Token {
  symbol: string;
  icon: string;
  name: string;
  address: string;
}

interface LPProps {
  setpopup: (value: number) => void;
  onSelectToken: (token: { symbol: string; icon: string }) => void;
  setOnSelectTokenCallback?: (callback: ((token: { symbol: string; icon: string }) => void) | null) => void;
  tokendict: { [address: string]: any };
  tradesByMarket: Record<string, any[]>;
  markets: Record<string, any>;
  tokenBalances: Record<string, any>;
  connected: boolean;
  account: any;
  sendUserOperationAsync: any;
  waitForTxReceipt: any;
  setChain: () => void;
  address: string;
  refetch?: () => void;
}

const performanceData = [
  { name: 'Jan', value: 12.4 },
  { name: 'Feb', value: 14.8 },
  { name: 'Mar', value: 18.2 },
  { name: 'Apr', value: 16.9 },
  { name: 'May', value: 21.3 },
  { name: 'Jun', value: 22.7 },
  { name: 'Jul', value: 24.5 },
];

const tvlData = [
  { date: 'Mar 20', tvl: 45 },
  { date: 'Mar 21', tvl: 48 },
  { date: 'Mar 22', tvl: 52 },
  { date: 'Mar 23', tvl: 55 },
  { date: 'Mar 24', tvl: 58 },
  { date: 'Mar 25', tvl: 62 },
  { date: 'Mar 26', tvl: 65 },
  { date: 'Mar 27', tvl: 68 },
  { date: 'Mar 28', tvl: 72 },
  { date: 'Mar 29', tvl: 75 },
  { date: 'Mar 30', tvl: 78 },
  { date: 'Mar 31', tvl: 82 },
  { date: 'Apr 1', tvl: 85 },
  { date: 'Apr 2', tvl: 88 },
  { date: 'Apr 3', tvl: 92 },
  { date: 'Apr 4', tvl: 95 },
  { date: 'Apr 5', tvl: 98 },
  { date: 'Apr 6', tvl: 102 },
  { date: 'Apr 7', tvl: 105 },
  { date: 'Apr 8', tvl: 108 },
  { date: 'Apr 9', tvl: 112 },
  { date: 'Apr 10', tvl: 115 },
  { date: 'Apr 11', tvl: 118 },
  { date: 'Apr 12', tvl: 122 },
  { date: 'Apr 13', tvl: 125 },
  { date: 'Apr 14', tvl: 128 },
  { date: 'Apr 15', tvl: 132 },
  { date: 'Apr 16', tvl: 135 },
  { date: 'Apr 17', tvl: 138 },
  { date: 'Apr 18', tvl: 142 },
  { date: 'Apr 19', tvl: 145 },
  { date: 'Apr 20', tvl: 148 },
  { date: 'Apr 21', tvl: 152 },
  { date: 'Apr 22', tvl: 155 },
  { date: 'Apr 23', tvl: 158 },
  { date: 'Apr 24', tvl: 162 },
  { date: 'Apr 25', tvl: 165 },
  { date: 'Apr 26', tvl: 168 },
  { date: 'Apr 27', tvl: 172 },
  { date: 'Apr 28', tvl: 175 },
  { date: 'Apr 29', tvl: 178 },
  { date: 'Apr 30', tvl: 182 },
  { date: 'May 1', tvl: 185 },
  { date: 'May 2', tvl: 188 },
  { date: 'May 3', tvl: 192 },
  { date: 'May 4', tvl: 195 },
  { date: 'May 5', tvl: 198 },
  { date: 'May 6', tvl: 202 },
  { date: 'May 7', tvl: 205 },
  { date: 'May 8', tvl: 208 },
  { date: 'May 9', tvl: 212 },
  { date: 'May 10', tvl: 215 },
  { date: 'May 11', tvl: 218 },
  { date: 'May 12', tvl: 222 },
  { date: 'May 13', tvl: 225 },
  { date: 'May 14', tvl: 228 },
  { date: 'May 15', tvl: 195 },
  { date: 'May 16', tvl: 202 },
  { date: 'May 17', tvl: 208 },
  { date: 'May 18', tvl: 215 },
  { date: 'May 19', tvl: 222 },
  { date: 'May 20', tvl: 228 },
  { date: 'May 21', tvl: 235 },
  { date: 'May 22', tvl: 242 },
  { date: 'May 23', tvl: 248 },
  { date: 'May 24', tvl: 255 },
  { date: 'Jun 1', tvl: 262 },
  { date: 'Jun 8', tvl: 268 },
  { date: 'Jun 16', tvl: 275 },
  { date: 'Jun 25', tvl: 282 },
  { date: 'Jul 3', tvl: 288 },
  { date: 'Jul 11', tvl: 295 },
  { date: 'Jul 19', tvl: 302 },
  { date: 'Jul 27', tvl: 308 },
  { date: 'Aug 4', tvl: 315 },
  { date: 'Aug 12', tvl: 322 },
];

const crystalVolumeData = [
  { date: 'Feb 1', volume: 2.1 },
  { date: 'Feb 8', volume: 1.8 },
  { date: 'Feb 15', volume: 3.2 },
  { date: 'Feb 22', volume: 2.9 },
  { date: 'Mar 1', volume: 4.5 },
  { date: 'Mar 8', volume: 3.8 },
  { date: 'Mar 15', volume: 5.1 },
  { date: 'Mar 22', volume: 4.2 },
  { date: 'Mar 29', volume: 6.3 },
  { date: 'Apr 5', volume: 5.9 },
  { date: 'Apr 12', volume: 7.2 },
  { date: 'Apr 19', volume: 6.8 },
  { date: 'Apr 26', volume: 8.4 },
  { date: 'May 3', volume: 9.1 },
  { date: 'May 10', volume: 7.6 },
  { date: 'May 17', volume: 10.2 },
  { date: 'May 24', volume: 11.8 },
  { date: 'May 31', volume: 9.5 },
  { date: 'Jun 7', volume: 12.3 },
  { date: 'Jun 14', volume: 11.1 },
  { date: 'Jun 21', volume: 13.7 },
  { date: 'Jun 28', volume: 15.2 },
  { date: 'Jul 5', volume: 14.8 },
  { date: 'Jul 12', volume: 16.4 },
  { date: 'Jul 19', volume: 15.9 },
  { date: 'Jul 26', volume: 17.5 },
  { date: 'Aug 2', volume: 18.1 },
  { date: 'Aug 9', volume: 19.3 },
  { date: 'Aug 16', volume: 20.5 },
  { date: 'Aug 23', volume: 21.7 },
  { date: 'Aug 30', volume: 22.9 },
];

const LP: React.FC<LPProps> = ({
  setpopup,
  onSelectToken,
  setOnSelectTokenCallback,
  tokendict,
  tradesByMarket,
  markets,
  tokenBalances,
  connected,
  account,
  sendUserOperationAsync,
  waitForTxReceipt,
  setChain,
  address,
  refetch,
}) => {
  const { activechain } = useSharedContext();
  
  const crystalVaultsAddress = settings.chainConfig[activechain]?.crystalVaults;

  // Balance fetching for vault tokens
  const { data: vaultBalances, refetch: refetchVaultBalances } = useQuery({
    queryKey: ["vault-balances", address, crystalVaultsAddress],
    queryFn: async () => {
      if (!address || !crystalVaultsAddress) return {};
      
      const allVaultsCall = encodeFunctionData({
        abi: CrystalVaultsAbi,
        functionName: "allVaults",
        args: [0n], 
      });

      return {};
    },
    enabled: !!address && !!crystalVaultsAddress,
    staleTime: 30_000,
  });

  const [activeTab, setActiveTab] = useState<'all' | 'deposited'>('all');
  const [hoveredVolume, setHoveredVolume] = useState<number | null>(null);
  const [hoveredTvl, setHoveredTvl] = useState<number | null>(null);
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);
  const [activeFilter, setActiveFilter] = useState<'All' | 'LSTs' | 'Stables' | 'Unverified' | 'Verified'>('All');
  const [firstTokenExceedsBalance, setFirstTokenExceedsBalance] = useState(false);
  const [secondTokenExceedsBalance, setSecondTokenExceedsBalance] = useState(false);
  const [showAddLiquidity, setShowAddLiquidity] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTokenSelection, setActiveTokenSelection] = useState<'first' | 'second' | null>(null);
  const [addLiquidityTokens, setAddLiquidityTokens] = useState<{ first: string, second: string }>({
    first: '',
    second: ''
  });
  const [selectedFeeTier, setSelectedFeeTier] = useState('0.05%');
  const [depositAmounts, setDepositAmounts] = useState<{ first: string, second: string }>({
    first: '',
    second: ''
  });
  const [duplicateTokenWarning, setDuplicateTokenWarning] = useState('');

  const [activeVaultDetailTab, setActiveVaultDetailTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [vaultDepositAmounts, setVaultDepositAmounts] = useState<{ first: string, second: string }>({
    first: '',
    second: ''
  });
  const [vaultFirstTokenExceedsBalance, setVaultFirstTokenExceedsBalance] = useState(false);
  const [vaultSecondTokenExceedsBalance, setVaultSecondTokenExceedsBalance] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawExceedsBalance, setWithdrawExceedsBalance] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { favorites, toggleFavorite } = useSharedContext();

  const availableTokens: Token[] = React.useMemo(() => {
    if (!tokendict || Object.keys(tokendict).length === 0) {
      return [];
    }
    return Object.values(tokendict).map((token: any) => ({
      symbol: token.ticker,
      icon: token.image,
      name: token.name,
      address: token.address
    }));
  }, [tokendict]);

  const defaultTokens = ['MON', 'WMON', 'USDC'];

  const vaults: Vault[] = [
    {
      id: 'mon-usdc-lp-vault',
      name: 'MON-USDC',
      tokens: {
        first: {
          symbol: 'MON',
          icon: iconmonad,
          feeAmount: '0.30%'
        },
        second: {
          symbol: 'USDC',
          icon: iconusdc,
          feeAmount: '0.30%'
        }
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
      verified: true,
      category: 'Regular',
    },
    {
      id: 'weth-usdc-lp-vault',
      name: 'WETH-USDC',
      tokens: {
        first: {
          symbol: 'WETH',
          icon: iconweth,
          feeAmount: '0.05%'
        },
        second: {
          symbol: 'USDC',
          icon: iconusdc,
          feeAmount: '0.05%'
        }
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
      borrowApy: 9.8,
      verified: true,
      category: 'Regular'
    },
    {
      id: 'wbtc-usdc-lp-vault',
      name: 'WBTC-USDC',
      tokens: {
        first: {
          symbol: 'WBTC',
          icon: iconwbtc,
          feeAmount: '0.05%'
        },
        second: {
          symbol: 'USDC',
          icon: iconusdc,
          feeAmount: '0.05%'
        }
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
      borrowApy: 8.1,
      verified: true,
      category: 'Regular'
    },
    {
      id: 'shmon-mon-lp-vault',
      name: 'shMON-MON',
      tokens: {
        first: {
          symbol: 'shMON',
          icon: iconshmonad,
          feeAmount: '1.00%'
        },
        second: {
          symbol: 'MON',
          icon: iconmonad,
          feeAmount: '1.00%'
        }
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
      borrowApy: 38.5,
      category: 'LST'
    },
    {
      id: 'sol-usdc-lp-vault',
      name: 'SOL-USDC',
      tokens: {
        first: {
          symbol: 'SOL',
          icon: iconsol,
          feeAmount: '0.30%'
        },
        second: {
          symbol: 'USDC',
          icon: iconusdc,
          feeAmount: '0.30%'
        }
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
      borrowApy: 8.9,
      verified: true,
      category: 'Regular'
    },
    {
      id: 'aprmon-mon-lp-vault',
      name: 'APRMON-MON',
      tokens: {
        first: {
          symbol: 'APRMON',
          icon: iconaprmonad,
          feeAmount: '0.30%'
        },
        second: {
          symbol: 'MON',
          icon: iconmonad,
          feeAmount: '0.30%'
        }
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
      borrowApy: 10.8,
      category: 'LST'
    },
    {
      id: 'dak-monad-lp-vault',
      name: 'DAK-MON',
      tokens: {
        first: {
          symbol: 'DAK',
          icon: icondak,
          feeAmount: '0.30%'
        },
        second: {
          symbol: 'MON',
          icon: iconmonad,
          feeAmount: '0.30%'
        }
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
      borrowApy: 13.2,
      category: 'Regular'
    },
    {
      id: 'yaki-mon-lp-vault',
      name: 'YAKI-MON',
      tokens: {
        first: {
          symbol: 'YAKI',
          icon: iconyaki,
          feeAmount: '0.30%'
        },
        second: {
          symbol: 'MON',
          icon: iconmonad,
          feeAmount: '0.30%'
        }
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
      borrowApy: 18.1,
      category: 'Regular'
    },
    {
      id: 'chog-usdc-lp-vault',
      name: 'CHOG-USDC',
      tokens: {
        first: {
          symbol: 'CHOG',
          icon: iconchog,
          feeAmount: '1.00%'
        },
        second: {
          symbol: 'USDC',
          icon: iconusdc,
          feeAmount: '1.00%'
        }
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
      borrowApy: 48.5,
      category: 'Regular'
    },
    {
      id: 'smon-mon-lp-vault',
      name: 'sMON-MON',
      tokens: {
        first: {
          symbol: 'sMON',
          icon: iconsmon,
          feeAmount: '0.30%'
        },
        second: {
          symbol: 'MON',
          icon: iconmonad,
          feeAmount: '0.30%'
        }
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
      borrowApy: 10.5,
      category: 'LST'
    },
    {
      id: 'usdt-usdc-lp-vault',
      name: 'USDT-USDC',
      tokens: {
        first: {
          symbol: 'USDT',
          icon: iconusdt,
          feeAmount: '0.01%'
        },
        second: {
          symbol: 'USDC',
          icon: iconusdc,
          feeAmount: '0.01%'
        }
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
      borrowApy: 10.5,
      verified: true,
      category: 'Stable'
    },
  ];

  const showVaultDetail = (vaultId: string) => {
    setSelectedVault(vaultId);
    setActiveVaultDetailTab('deposit');
    setVaultDepositAmounts({ first: '', second: '' });
    setWithdrawAmount('');
    setVaultFirstTokenExceedsBalance(false);
    setVaultSecondTokenExceedsBalance(false);
    setWithdrawExceedsBalance(false);
  };

  const getTokenBySymbol = (symbol: string) => {
    if (availableTokens.length === 0) {
      return { symbol, icon: '', name: symbol, address: '' };
    }
    const token = availableTokens.find(t => t.symbol === symbol);
    return token || availableTokens[0];
  };

  const getTokenBalance = (symbol: string): bigint => {
    const entry = Object.values(tokendict).find((t: any) => t.ticker === symbol);
    return entry ? (tokenBalances[entry.address] || 0n) : 0n;
  };

  const formatDisplayValue = (rawAmount: bigint, decimals = 18): string => {
    let amount = Number(rawAmount) / 10 ** decimals;
    if (amount >= 1e12) return `${(amount / 1e12).toFixed(2)}T`;
    if (amount >= 1e9) return `${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(2)}M`;
    const fixedAmount = amount.toFixed(2);
    const [integerPart, decimalPart] = fixedAmount.split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${formattedInteger}.${decimalPart}`;
  };

  const calculateUSD = (
    amountRaw: string,
    symbol: string
  ): string => {
    if (!amountRaw || parseFloat(amountRaw) === 0) return '$0.00';
    const entry = Object.values(tokendict).find((t: any) => t.ticker === symbol);
    if (!entry) return '$0.00';
    const decimals = Number(entry.decimals);
    const amount = parseFloat(amountRaw) * Math.pow(10, decimals);

    const directKey = `${symbol}USDC`;
    let market = markets[directKey];
    let trades = tradesByMarket[directKey];
    if (!market || !trades) {
      const viaMON = `${symbol}MON`;
      market = markets[viaMON];
      trades = tradesByMarket[viaMON];
    }
    if (!market || !trades) return '$0.00';

    const price = fetchLatestPrice(trades, market);
    if (!price) return '$0.00';

    let usd = 0;
    if (market.quoteAsset === 'USDC') {
      usd = (amount / Math.pow(10, decimals)) * price;
    } else {
      const monKey = `MONUSDC`;
      const monMarket = markets[monKey];
      const monTrades = tradesByMarket[monKey];
      const monPrice = monTrades && fetchLatestPrice(monTrades, monMarket);
      if (!monPrice) return '$0.00';
      usd = (amount / Math.pow(10, decimals)) * price * monPrice;
    }

    if (usd >= 1e12) return `$${(usd / 1e12).toFixed(2)}T`;
    if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
    if (usd >= 1e6) return `$${(usd / 1e6).toFixed(2)}M`;
    return `$${usd.toFixed(2)}`;
  };

  const filteredVaults = vaults.filter(vault => {
    const tokenMatch =
      selectedTokens.length === 0 ||
      selectedTokens.every(token =>
        vault.tokens.first.symbol === token.symbol ||
        vault.tokens.second.symbol === token.symbol
      );

    const isDeposited = activeTab === 'deposited'
      ? parseFloat(vault.userBalance) > 0
      : true;

    let categoryMatch = true;
    if (activeFilter === 'LSTs') {
      categoryMatch = vault.category === 'LST';
    } else if (activeFilter === 'Stables') {
      categoryMatch = vault.category === 'Stable';
    } else if (activeFilter === 'Verified') {
      categoryMatch = vault.verified === true;
    } else if (activeFilter === 'Unverified') {
      categoryMatch = vault.verified === false;
    }

    return tokenMatch && isDeposited && categoryMatch;
  });

  const handleReset = () => {
    setAddLiquidityTokens({ first: '', second: '' });
    setSelectedFeeTier('0.05%');
    setCurrentStep(1);
    setDepositAmounts({ first: '', second: '' });
    setDuplicateTokenWarning('');
    setFirstTokenExceedsBalance(false);
    setSecondTokenExceedsBalance(false);
  };

  const handleContinue = () => {
    if (addLiquidityTokens.first && addLiquidityTokens.second) {
      setCurrentStep(2);
    }
  };

  const openTokenSelection = (position: 'first' | 'second') => {
    setActiveTokenSelection(position);
    setpopup(1);
  };

  const handleAddLiquidityTokenSelect = (token: { symbol: string; icon: string }) => {
    if (activeTokenSelection === 'first') {
      if (addLiquidityTokens.second === token.symbol) {
        setDuplicateTokenWarning(`Cannot select ${token.symbol} for both tokens`);
        setTimeout(() => setDuplicateTokenWarning(''), 3000);
        setpopup(0);
        return;
      }
      setAddLiquidityTokens(prev => ({
        ...prev,
        first: token.symbol
      }));
      setFirstTokenExceedsBalance(false);
      setDepositAmounts(prev => ({ ...prev, first: '' }));
    } else if (activeTokenSelection === 'second') {
      if (addLiquidityTokens.first === token.symbol) {
        setDuplicateTokenWarning(`Cannot select ${token.symbol} for both tokens`);
        setTimeout(() => setDuplicateTokenWarning(''), 3000);
        setpopup(0);
        return;
      }
      setAddLiquidityTokens(prev => ({
        ...prev,
        second: token.symbol
      }));
      setSecondTokenExceedsBalance(false);
      setDepositAmounts(prev => ({ ...prev, second: '' }));
    }
    setActiveTokenSelection(null);
    setpopup(0);
  };

  const handleDepositAmountChange = (position: 'first' | 'second', value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDepositAmounts(prev => ({
        ...prev,
        [position]: value
      }));

      if (value !== '') {
        const tokenSymbol = position === 'first' ? addLiquidityTokens.first : addLiquidityTokens.second;
        const userBalance = getTokenBalance(tokenSymbol);
        const tokenDecimals = Number(
          (Object.values(tokendict).find(t => t.ticker === tokenSymbol)?.decimals) || 18
        );
        const maxAllowedAmount = Number(userBalance) / 10 ** tokenDecimals;
        const enteredAmount = parseFloat(value);

        if (position === 'first') {
          setFirstTokenExceedsBalance(enteredAmount > maxAllowedAmount);
        } else {
          setSecondTokenExceedsBalance(enteredAmount > maxAllowedAmount);
        }
      } else {
        if (position === 'first') {
          setFirstTokenExceedsBalance(false);
        } else {
          setSecondTokenExceedsBalance(false);
        }
      }
    }
  };

  const handleVaultDepositAmountChange = (position: 'first' | 'second', value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setVaultDepositAmounts(prev => ({
        ...prev,
        [position]: value
      }));

      if (value !== '' && selectedVaultData) {
        const tokenSymbol = position === 'first' ? selectedVaultData.tokens.first.symbol : selectedVaultData.tokens.second.symbol;
        const userBalance = getTokenBalance(tokenSymbol);
        const tokenDecimals = Number(
          (Object.values(tokendict).find(t => t.ticker === tokenSymbol)?.decimals) || 18
        );
        const maxAllowedAmount = Number(userBalance) / 10 ** tokenDecimals;
        const enteredAmount = parseFloat(value);

        if (position === 'first') {
          setVaultFirstTokenExceedsBalance(enteredAmount > maxAllowedAmount);
        } else {
          setVaultSecondTokenExceedsBalance(enteredAmount > maxAllowedAmount);
        }
      } else {
        if (position === 'first') {
          setVaultFirstTokenExceedsBalance(false);
        } else {
          setVaultSecondTokenExceedsBalance(false);
        }
      }
    }
  };

  const handleWithdrawAmountChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWithdrawAmount(value);

      if (value !== '' && selectedVaultData) {
        const userLPBalance = parseFloat(selectedVaultData.userBalance);
        const enteredAmount = parseFloat(value);
        setWithdrawExceedsBalance(enteredAmount > userLPBalance);
      } else {
        setWithdrawExceedsBalance(false);
      }
    }
  };

  const isAddLiquidityEnabled = () => {
    return depositAmounts.first !== '' && depositAmounts.second !== '' &&
      parseFloat(depositAmounts.first) > 0 && parseFloat(depositAmounts.second) > 0 &&
      !firstTokenExceedsBalance && !secondTokenExceedsBalance;
  };

  const isVaultDepositEnabled = () => {
    return vaultDepositAmounts.first !== '' && vaultDepositAmounts.second !== '' &&
      parseFloat(vaultDepositAmounts.first) > 0 && parseFloat(vaultDepositAmounts.second) > 0 &&
      !vaultFirstTokenExceedsBalance && !vaultSecondTokenExceedsBalance;
  };

  const isWithdrawEnabled = () => {
    return withdrawAmount !== '' && parseFloat(withdrawAmount) > 0 && !withdrawExceedsBalance;
  };

  const handleVaultDeposit = async () => {
    if (!selectedVaultData || !account.connected) return;
    
    const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) {
      setChain();
      return;
    }

    try {
      const firstTokenAddress = Object.values(tokendict).find(
        (t: any) => t.ticker === selectedVaultData.tokens.first.symbol
      )?.address;
      
      const secondTokenAddress = Object.values(tokendict).find(
        (t: any) => t.ticker === selectedVaultData.tokens.second.symbol
      )?.address;

      if (!firstTokenAddress || !secondTokenAddress) {
        throw new Error('Token addresses not found');
      }

      const firstTokenDecimals = Number(
        Object.values(tokendict).find(t => t.ticker === selectedVaultData.tokens.first.symbol)?.decimals || 18
      );
      
      const secondTokenDecimals = Number(
        Object.values(tokendict).find(t => t.ticker === selectedVaultData.tokens.second.symbol)?.decimals || 18
      );

      const amountQuoteDesired = BigInt(Math.round(parseFloat(vaultDepositAmounts.first) * 10 ** firstTokenDecimals));
      const amountBaseDesired = BigInt(Math.round(parseFloat(vaultDepositAmounts.second) * 10 ** secondTokenDecimals));
      
      // Use 95% of desired amounts as minimum (5% slippage)
      const amountQuoteMin = (amountQuoteDesired * 95n) / 100n;
      const amountBaseMin = (amountBaseDesired * 95n) / 100n;

      // Approve tokens if needed
      const firstTokenBalance = getTokenBalance(selectedVaultData.tokens.first.symbol);
      const secondTokenBalance = getTokenBalance(selectedVaultData.tokens.second.symbol);
      
      if (firstTokenBalance < amountQuoteDesired) {
        const approveFirstUo = {
          target: firstTokenAddress as `0x${string}`,
          data: encodeFunctionData({
            abi: [{
              inputs: [
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" }
              ],
              name: "approve",
              outputs: [{ name: "", type: "bool" }],
              stateMutability: "nonpayable",
              type: "function",
            }],
            functionName: "approve",
            args: [crystalVaultsAddress as `0x${string}`, MaxUint256],
          }),
          value: 0n,
        };
        const approveFirstOp = await sendUserOperationAsync({ uo: approveFirstUo });
        await waitForTxReceipt(approveFirstOp.hash);
      }

      if (secondTokenBalance < amountBaseDesired) {
        const approveSecondUo = {
          target: secondTokenAddress as `0x${string}`,
          data: encodeFunctionData({
            abi: [{
              inputs: [
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" }
              ],
              name: "approve",
              outputs: [{ name: "", type: "bool" }],
              stateMutability: "nonpayable",
              type: "function",
            }],
            functionName: "approve",
            args: [crystalVaultsAddress as `0x${string}`, MaxUint256],
          }),
          value: 0n,
        };
        const approveSecondOp = await sendUserOperationAsync({ uo: approveSecondUo });
        await waitForTxReceipt(approveSecondOp.hash);
      }

      // Deposit into vault
      const depositUo = {
        target: crystalVaultsAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: CrystalVaultsAbi,
          functionName: "deposit",
          args: [
            selectedVaultData.id as `0x${string}`, // vault address
            amountQuoteDesired,
            amountBaseDesired,
            amountQuoteMin,
            amountBaseMin,
          ],
        }),
        value: 0n,
      };

      const depositOp = await sendUserOperationAsync({ uo: depositUo });
      await waitForTxReceipt(depositOp.hash);

      // Reset form
      setVaultDepositAmounts({ first: '', second: '' });
      setVaultFirstTokenExceedsBalance(false);
      setVaultSecondTokenExceedsBalance(false);
      
      // Refresh balances
      refetch?.();
      refetchVaultBalances();

    } catch (e: any) {
      console.error('Vault deposit error:', e);
    }
  };

  const handleVaultWithdraw = async () => {
    if (!selectedVaultData || !account.connected) return;
    
    const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) {
      setChain();
      return;
    }

    try {
      const sharesToWithdraw = BigInt(Math.round(parseFloat(withdrawAmount) * 1e18));
      
      // Use 95% of expected amounts as minimum (5% slippage)
      const amountQuoteMin = 0n; // You'd want to calculate this properly
      const amountBaseMin = 0n; // You'd want to calculate this properly

      const withdrawUo = {
        target: crystalVaultsAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: CrystalVaultsAbi,
          functionName: "withdraw",
          args: [
            selectedVaultData.id as `0x${string}`, // vault address
            sharesToWithdraw,
            amountQuoteMin,
            amountBaseMin,
          ],
        }),
        value: 0n,
      };

      const withdrawOp = await sendUserOperationAsync({ uo: withdrawUo });
      await waitForTxReceipt(withdrawOp.hash);

      // Reset form
      setWithdrawAmount('');
      setWithdrawExceedsBalance(false);
      
      // Refresh balances
      refetch?.();
      refetchVaultBalances();

    } catch (e: any) {
      console.error('Vault withdraw error:', e);
    }
  };

  const getAddLiquidityButtonText = () => {
    if (firstTokenExceedsBalance || secondTokenExceedsBalance) {
      return 'Insufficient Balance';
    }
    return 'Add Liquidity';
  };

  const getVaultDepositButtonText = () => {
    if (vaultFirstTokenExceedsBalance || vaultSecondTokenExceedsBalance) {
      return 'Insufficient Balance';
    }
    return 'Deposit';
  };

  const getWithdrawButtonText = () => {
    if (withdrawExceedsBalance) {
      return 'Insufficient Balance';
    }
    return 'Withdraw';
  };

  const getFavoriteTokens = () => {
    return availableTokens.filter(token =>
      favorites.includes(token.address)
    );
  };

  const filteredTokens = searchQuery.length > 0
    ? availableTokens.filter(token => {
      const isAlreadySelected = selectedTokens.some(t => t.symbol === token.symbol);
      if (isAlreadySelected) return false;
      return token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    : [];

  const getRemainingTokens = () => {
    return availableTokens.filter(token =>
      !selectedTokens.some(t => t.symbol === token.symbol)
    );
  };

  const handleTokenToggle = (token: Token) => {
    setSelectedTokens(prev => {
      if (prev.length >= 2) return prev;
      if (prev.some(t => t.symbol === token.symbol)) return prev;
      return [...prev, token];
    });
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const removeSelectedToken = (tokenSymbol: string) => {
    setSelectedTokens(prev => prev.filter(t => t.symbol !== tokenSymbol));
  };

  const handleFavoriteToggle = (token: Token, e: React.MouseEvent) => {
    e.stopPropagation();
    if (defaultTokens.includes(token.symbol)) return;
    toggleFavorite(token.address);
  };

  const isTokenFavorited = (token: Token) => {
    return favorites.includes(token.address);
  };

  const backToList = () => {
    setSelectedVault(null);
  };

  const selectedVaultData = selectedVault ? vaults.find(vault => vault.id === selectedVault) : null;

  const hasInitializedFavorites = useRef(false);

  useEffect(() => {
    if (hasInitializedFavorites.current || availableTokens.length === 0) return;

    const autoFavoriteDefaults = () => {
      defaultTokens.forEach(symbol => {
        const token = availableTokens.find(t => t.symbol === symbol);
        if (token && !favorites.includes(token.address)) {
          toggleFavorite(token.address);
        }
      });
    };

    autoFavoriteDefaults();
    hasInitializedFavorites.current = true;
  }, [availableTokens]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (setOnSelectTokenCallback) {
      const tokenSelectCallback = (token: { symbol: string; icon: string }) => {
        try {
          if (showAddLiquidity && activeTokenSelection) {
            handleAddLiquidityTokenSelect(token);
          } else {
            const fullToken = availableTokens.find(t => t.symbol === token.symbol);
            if (fullToken) {
              onSelectToken(fullToken);
            } else {
              const completeToken = {
                name: token.symbol,
                address: '',
                baseAsset: token.symbol,
                ...token
              };
              onSelectToken(completeToken);
            }
          }
        } catch (error) {
          console.error('Error in token selection:', error);
          onSelectToken(token);
        }
      };

      setOnSelectTokenCallback(() => tokenSelectCallback);
    }

    return () => {
      if (setOnSelectTokenCallback) {
        setOnSelectTokenCallback(null);
      }
    };
  }, [showAddLiquidity, activeTokenSelection]);

  if (showAddLiquidity) {
    return (
      <div className="add-liquidity-container">
        <div className="add-liquidity-content">
          <div className="add-liquidity-breadcrumb">
            <button onClick={() => setShowAddLiquidity(false)} className="breadcrumb-link">Liquidity Pools</button>
            <ChevronLeft size={16} className="earn-breadcrumb-arrow" />
            <span className="breadcrumb-current">New position</span>
          </div>

          <div className="add-liquidity-header">
            <h1>New position</h1>
            <div className="header-controls">
              <button className="reset-button" onClick={handleReset}>
                Reset
              </button>
            </div>
          </div>

          <div className="add-liquidity-main">
            <div className="steps-sidebar">
              <div
                className={`step ${currentStep === 1 ? 'active' : ''}`}
                onClick={() => setCurrentStep(1)}
                style={{ cursor: 'pointer' }}
              >
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Step 1</h3>
                  <p>Select token pair and fees</p>
                </div>
              </div>
              <div
                className={`step ${currentStep === 2 ? 'active' : ''}`}
                onClick={() => {
                  if (addLiquidityTokens.first && addLiquidityTokens.second) {
                    setCurrentStep(2);
                  }
                }}
                style={{
                  cursor: (addLiquidityTokens.first && addLiquidityTokens.second) ? 'pointer' : 'not-allowed',
                  opacity: (addLiquidityTokens.first && addLiquidityTokens.second) ? 1 : 0.6
                }}
              >
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Step 2</h3>
                  <p>Enter deposit amounts</p>
                </div>
              </div>
            </div>

            <div className="add-liquidity-form">
              {currentStep === 1 ? (
                <>
                  <div className="form-section">
                    <h2>Select pair</h2>
                    <p className="section-description">
                      Choose the tokens you want to provide liquidity for. You can select tokens on all supported networks.
                    </p>

                    <div className="token-pair-selection">
                      <div className="lp-token-dropdown-wrapper">
                        <button
                          className="lp-token-dropdown"
                          onClick={() => openTokenSelection('first')}
                        >
                          {addLiquidityTokens.first ? (
                            <>
                              <div className="lp-token-icon-wrapper">
                                <img
                                  src={getTokenBySymbol(addLiquidityTokens.first).icon}
                                  alt=""
                                  className="liquidity-token-icon"
                                />
                                <span>{addLiquidityTokens.first}</span>
                              </div>
                              <ChevronDown size={16} />
                            </>
                          ) : (
                            <>
                              <span>Select a Token</span>
                              <ChevronDown size={16} />
                            </>
                          )}
                        </button>
                      </div>

                      <div className="lp-token-dropdown-wrapper">
                        <button
                          className="lp-token-dropdown"
                          onClick={() => openTokenSelection('second')}
                        >
                          {addLiquidityTokens.second ? (
                            <>
                              <div className="lp-token-icon-wrapper">
                                <img
                                  src={getTokenBySymbol(addLiquidityTokens.second).icon}
                                  alt=""
                                  className="liquidity-token-icon"
                                />
                                <span>{addLiquidityTokens.second}</span>
                              </div>
                              <ChevronDown size={16} />
                            </>
                          ) : (
                            <>
                              <span>Select a Token</span>
                              <ChevronDown size={16} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {duplicateTokenWarning && (
                      <div className="duplicate-token-warning">
                        <div className="duplicate-token-warning-text">
                          {duplicateTokenWarning}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-section">
                    <h2>Fee tier</h2>
                    <p className="section-description">
                      The fee tier determines the trading fee collected on swaps. Higher fee tiers are typically used for more volatile token pairs.
                    </p>

                    <div className="fee-tier-options">
                      <div
                        className={`fee-tier-option ${selectedFeeTier === '0.05%' ? 'active' : ''}`}
                        onClick={() => setSelectedFeeTier('0.05%')}
                      >
                        <div className="fee-tier-percentage">0.05%</div>
                        <div className="fee-tier-description">
                          <span className="fee-tier-title">Best for stable pairs</span>
                          <span className="fee-tier-subtitle">Very stable pairs like USDC/USDT</span>
                        </div>
                      </div>

                      <div
                        className={`fee-tier-option ${selectedFeeTier === '0.30%' ? 'active' : ''}`}
                        onClick={() => setSelectedFeeTier('0.30%')}
                      >
                        <div className="fee-tier-percentage">0.30%</div>
                        <div className="fee-tier-description">
                          <span className="fee-tier-title">Best for most pairs</span>
                          <span className="fee-tier-subtitle">Most liquid for majority of pairs</span>
                        </div>
                      </div>

                      <div
                        className={`fee-tier-option ${selectedFeeTier === '1.00%' ? 'active' : ''}`}
                        onClick={() => setSelectedFeeTier('1.00%')}
                      >
                        <div className="fee-tier-percentage">1.00%</div>
                        <div className="fee-tier-description">
                          <span className="fee-tier-title">Best for exotic pairs</span>
                          <span className="fee-tier-subtitle">Rare or highly volatile pairs</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    className={`continue-button ${addLiquidityTokens.first && addLiquidityTokens.second ? 'enabled' : ''}`}
                    disabled={!addLiquidityTokens.first || !addLiquidityTokens.second}
                    onClick={handleContinue}
                  >
                    Continue
                  </button>
                </>
              ) : (
                <div className="form-section">
                  <h2>Enter deposit amounts</h2>
                  <p className="section-description">
                    Enter the amounts you want to deposit for each token. The ratio will be automatically calculated based on the current pool ratio.
                  </p>

                  <div className="deposit-amounts-section">
                    <div className={`deposit-input-group ${firstTokenExceedsBalance ? 'lp-input-container-balance-error' : ''}`}>
                      <div className="deposit-input-wrapper">
                        <input
                          type="text"
                          placeholder="0.0"
                          className={`deposit-amount-input ${firstTokenExceedsBalance ? 'lp-input-balance-error' : ''}`}
                          value={depositAmounts.first}
                          onChange={(e) => handleDepositAmountChange('first', e.target.value)}
                        />
                        <div className="deposit-token-badge">
                          <img src={getTokenBySymbol(addLiquidityTokens.first).icon} alt="" className="deposit-token-icon" />
                          <span>{addLiquidityTokens.first}</span>
                        </div>
                      </div>
                      <div className="lp-deposit-balance-wrapper">
                        <div className={`lp-deposit-usd-value ${firstTokenExceedsBalance ? 'lp-usd-value-balance-error' : ''}`}>
                          {calculateUSD(depositAmounts.first, addLiquidityTokens.first)}
                        </div>
                        <div className="deposit-balance">
                          Balance: {formatDisplayValue(
                            getTokenBalance(addLiquidityTokens.first),
                            Number(
                              (Object.values(tokendict).find(t => t.ticker === addLiquidityTokens.first)?.decimals) || 18
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`deposit-input-group ${secondTokenExceedsBalance ? 'lp-input-container-balance-error' : ''}`}>
                      <div className="deposit-input-wrapper">
                        <input
                          type="text"
                          placeholder="0.0"
                          className={`deposit-amount-input ${secondTokenExceedsBalance ? 'lp-input-balance-error' : ''}`}
                          value={depositAmounts.second}
                          onChange={(e) => handleDepositAmountChange('second', e.target.value)}
                        />
                        <div className="deposit-token-badge">
                          <img src={getTokenBySymbol(addLiquidityTokens.second).icon} alt="" className="deposit-token-icon" />
                          <span>{addLiquidityTokens.second}</span>
                        </div>
                      </div>
                      <div className="lp-deposit-balance-wrapper">
                        <div className={`lp-deposit-usd-value ${secondTokenExceedsBalance ? 'lp-usd-value-balance-error' : ''}`}>
                          {calculateUSD(depositAmounts.second, addLiquidityTokens.second)}
                        </div>
                        <div className="deposit-balance">
                          Balance: {formatDisplayValue(
                            getTokenBalance(addLiquidityTokens.second),
                            Number(
                              (Object.values(tokendict).find(t => t.ticker === addLiquidityTokens.second)?.decimals) || 18
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="deposit-summary">
                    <div className="deposit-summary-row">
                      <span>Selected Fee Tier:</span>
                      <span>{selectedFeeTier}</span>
                    </div>
                    <div className="deposit-summary-row">
                      <span>Total Value:</span>
                      <span>
                        {(() => {
                          const firstUSD = calculateUSD(depositAmounts.first, addLiquidityTokens.first);
                          const secondUSD = calculateUSD(depositAmounts.second, addLiquidityTokens.second);
                          const firstValue = parseFloat(firstUSD.replace('$', '')) || 0;
                          const secondValue = parseFloat(secondUSD.replace('$', '')) || 0;
                          const total = firstValue + secondValue;
                          return `$${total.toFixed(2)}`;
                        })()}
                      </span>
                    </div>
                    <div className="deposit-summary-row">
                      <span>Pool Share:</span>
                      <span>~0.01%</span>
                    </div>
                  </div>

                  <button
                    className={`continue-button ${isAddLiquidityEnabled() ? 'enabled' : ''} ${(firstTokenExceedsBalance || secondTokenExceedsBalance) ? 'lp-button-balance-error' : ''}`}
                    disabled={!isAddLiquidityEnabled()}
                  >
                    {getAddLiquidityButtonText()}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lp-content-wrapper">
      {!selectedVault && (
        <div className="lp-overview-charts">
          <div className="lp-overview-chart">
            <div className="lp-total-value-locked-container">
              <span className="lp-total-tvl-subtitle">Total Value Locked</span>
              <span className="lp-total-tvl">
                ${hoveredTvl !== null ? hoveredTvl.toLocaleString() + 'M' : '192.42M'}
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={tvlData}
                onMouseMove={(e) => {
                  if (e.isTooltipActive && e.activePayload) {
                    setHoveredTvl(e.activePayload[0].payload.tvl);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredTvl(null);
                }}
              >
                <defs>
                  <linearGradient id="tvlGrad" x1="0" y1="0" x2="0" y2="1">
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
                <Tooltip
                  contentStyle={{ display: 'none' }}
                />
                <Area
                  type="monotone"
                  dataKey="tvl"
                  stroke="#aaaecf"
                  strokeWidth={2}
                  fill="url(#tvlGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "rgb(6,6,6)", stroke: "#aaaecf", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="lp-overview-chart">
            <div className="lp-total-value-locked-container">
              <span className="lp-total-tvl-subtitle">Crystal Volume</span>
              <span className="lp-total-tvl">
                ${hoveredVolume !== null ? hoveredVolume.toLocaleString() + 'M' : '16.4M'}
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={crystalVolumeData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                onMouseMove={(e) => {
                  if (e.isTooltipActive && e.activePayload) {
                    setHoveredVolume(e.activePayload[0].payload.volume);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredVolume(null);
                }}
              >
                <defs>
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#aaaecf" stopOpacity={1} />
                    <stop offset="100%" stopColor="#aaaecf" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} horizontal={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    display: 'none'
                  }}
                  cursor={{ fill: 'rgba(170, 174, 207, 0.1)' }}
                />
                <Bar
                  dataKey="volume"
                  name="Volume"
                  barSize={14}
                  radius={[2, 2, 0, 0]}
                  fill="url(#volumeGrad)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!selectedVault && (
        <div className="lp-filter-row">
          <div className="lp-filter-buttons">
            {(['All', 'LSTs', 'Stables', 'Unverified', 'Verified'] as const).map((filter) => (
              <button
                key={filter}
                className={`lp-filter-button ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <button
            className="add-liquidity-button"
            onClick={() => setShowAddLiquidity(true)}
          >
            <Plus size={16} />
            Add Liquidity
          </button>
        </div>
      )}

      <div className={`lp-rectangle ${selectedVault ? 'no-border' : ''}`}>
        {!selectedVault ? (
          <>
            <div className="lp-header">
              <div className="lp-filter">
                <div className="lp-tabs" data-active={activeTab}>
                  <button
                    className={`lp-tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All LP Vaults
                  </button>
                  <button
                    className={`lp-tab ${activeTab === 'deposited' ? 'active' : ''}`}
                    onClick={() => setActiveTab('deposited')}
                  >
                    My Positions (1)
                  </button>
                </div>

                <div className="lp-search-container" ref={searchRef}>
                  <div
                    className="lp-search-input"
                    onClick={() => setIsSearchOpen(true)}
                  >
                    <Search size={16} className="lp-search-icon" />

                    {selectedTokens.map((token) => (
                      <div key={token.symbol} className="lp-search-selected-token">
                        <img src={token.icon} alt={token.symbol} className="lp-search-selected-icon" />
                        <span>{token.symbol}</span>
                        <button
                          className="lp-search-remove-token"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelectedToken(token.symbol);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={selectedTokens.length === 0 ? "Search" : ""}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="lp-search-field"
                    />
                  </div>

                  {isSearchOpen && (
                    <div className="lp-search-dropdown">
                      <div className="lp-search-tokens">
                        <div className="lp-favorites-container">
                          {getFavoriteTokens().map((token) => (
                            <div
                              key={`favorite-${token.symbol}`}
                              className="lp-search-token-favorites"
                              onClick={() => handleTokenToggle(token)}
                            >
                              <img src={token.icon} alt={token.symbol} className="lp-search-token-icon-favorite" />
                              {!defaultTokens.includes(token.symbol) && (
                                <div className="lp-token-favorites">
                                  <span className="lp-search-token-symbol-favorite">{token.symbol}</span>
                                </div>
                              )}
                              {!defaultTokens.includes(token.symbol) && (
                                <button
                                  className="lp-favorite-close-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(token.address);
                                  }}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="lp-trending-header">
                          <span className="lp-trending-title"> Default tokens</span>
                          <div className="lp-trending-line"> </div>
                        </div>
                        {searchQuery.length > 0 && (
                          <>
                            {filteredTokens.length > 0 ? (
                              filteredTokens.map((token) => (
                                <div
                                  key={`search-${token.symbol}`}
                                  className="lp-search-token"
                                  onClick={() => handleTokenToggle(token)}
                                >
                                  <Star
                                    size={18}
                                    className="lp-search-token-star"
                                    onClick={(e) => handleFavoriteToggle(token, e)}
                                    fill="none"
                                    color="#ffffff79"
                                  />
                                  <img src={token.icon} alt={token.symbol} className="lp-search-token-icon" />
                                  <div className="lp-token-details">
                                    <span className="lp-search-token-symbol">{token.symbol}</span>
                                    <span className="lp-search-token-name">{token.name}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="lp-search-empty">No tokens found</div>
                            )}
                          </>
                        )}

                        {searchQuery.length === 0 && getRemainingTokens().map((token) => (
                          <div
                            key={`remaining-${token.symbol}`}
                            className="lp-search-token"
                            onClick={() => handleTokenToggle(token)}
                          >
                            <Star
                              size={18}
                              className={`lp-search-token-star ${isTokenFavorited(token) ? 'favorited' : ''}`}
                              onClick={(e) => handleFavoriteToggle(token, e)}
                              fill={isTokenFavorited(token) ? '#aaaecf' : 'none'}
                              color={isTokenFavorited(token) ? '#aaaecf' : '#ffffff79'}
                            />

                            <img src={token.icon} alt={token.symbol} className="lp-search-token-icon" />
                            <div className="lp-token-details">
                              <span className="lp-search-token-symbol">{token.symbol}</span>
                              <span className="lp-search-token-name">{token.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lp-vaults-grid">
              <div className="lp-vaults-list-header">
                <div className="lp-col lp-asset-col">Pool</div>
                <div className="lp-col lp-supply-col">TVL</div>
                <div className="lp-col lp-supply-apy-col">24h Volume</div>
                <div className="lp-col lp-borrowed-col">24h Fees</div>
                <div className="lp-col lp-borrow-apy-col">24h APY</div>
              </div>

              {filteredVaults.map((vault) => (
                <div
                  key={vault.id}
                  className="lp-card"
                  onClick={() => showVaultDetail(vault.id)}
                >
                  <div className="lp-summary">
                    <div className="lp-col lp-asset-col">
                      <div className="lp-token-pair-icons">
                        <img
                          src={vault.tokens.first.icon}
                          alt={vault.tokens.first.symbol}
                          className="lp-token-icon lp-token-icon-first"
                        />
                        <img
                          src={vault.tokens.second.icon}
                          alt={vault.tokens.second.symbol}
                          className="lp-token-icon lp-token-icon-second"
                        />
                      </div>
                      <div className="lp-asset-info">
                        <h3 className="lp-listname">{vault.name}</h3>
                        <div className="lp-fee-amounts">
                          {vault.tokens.first.feeAmount && (
                            <span className="lp-fee-amount">{vault.tokens.first.feeAmount}</span>
                          )}
                        </div>
                        {vault.verified && (
                          <img src={verified} alt="Verified" className="lp-verified-badge" />
                        )}
                      </div>
                    </div>

                    <div className="lp-col lp-supply-col">
                      <div className="lp-supply-value lp-supply-tooltip-wrapper">
                        <span className="lp-apy-value-text"> $2.8M </span>
                      </div>
                    </div>

                    <div className="lp-col lp-supply-apy-col">
                      <div className="lp-supply-apy-value"> {vault.supplyApy}%</div>
                    </div>

                    <div className="lp-col lp-borrowed-col">
                      <div className="lp-borrowed-value">{vault.totalBorrowed}</div>
                    </div>

                    <div className="lp-col lp-borrow-apy-col">
                      <div className="lp-borrow-apy-value">{vault.borrowApy}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="lp-detail-view">
            <div className="lp-detail-header">
              <div className="add-liquidity-breadcrumb">
                <button onClick={backToList} className="breadcrumb-link">
                  Liquidity Pools
                </button>
                <ChevronLeft size={16} className="earn-breadcrumb-arrow" />
                <span className="breadcrumb-current">{selectedVaultData?.name} Pool</span>
              </div>
            </div>

            {selectedVaultData && (
              <div className="vault-detail-layout">
                <div className="vault-info-section">
                  <div className="lp-detail-summary">
                    <div className="lp-detail-top">
                      <div className="lp-detail-asset">
                        <div className="lp-detail-token-pair">
                          <img
                            src={selectedVaultData.tokens.first.icon}
                            alt={selectedVaultData.tokens.first.symbol}
                            className="lp-detail-token-icon lp-first-token"
                          />
                          <img
                            src={selectedVaultData.tokens.second.icon}
                            alt={selectedVaultData.tokens.second.symbol}
                            className="lp-detail-token-icon lp-second-token"
                          />
                        </div>
                        <div>
                          <h2 className="lp-detail-name">{selectedVaultData.name}</h2>
                          <div className="lp-fee-amounts-detail">
                            {selectedVaultData.tokens.first.feeAmount && (
                              <span className="lp-fee-amount">{selectedVaultData.tokens.first.feeAmount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="lp-detail-stats">
                        <div className="lp-detail-stat">
                          <span className="lp-stat-label">APY</span>
                          <span className="lp-stat-value">{selectedVaultData.apy}%</span>
                        </div>
                        <div className="lp-detail-stat">
                          <span className="lp-stat-label">TVL</span>
                          <span className="lp-stat-value">{selectedVaultData.tvl}</span>
                        </div>
                        <div className="lp-detail-stat">
                          <span className="lp-stat-label">Daily Yield</span>
                          <span className="lp-stat-value">{selectedVaultData.dailyYield}</span>
                        </div>
                        <div className="lp-detail-stat">
                          <span className="lp-stat-label">Your Balance</span>
                          <span className="lp-stat-value">{selectedVaultData.userBalance} LP</span>
                        </div>
                      </div>
                    </div>

                    <div className="lp-performance-chart-container">
                      <h4 className="lp-performance-chart-header">
                        PERFORMANCE
                      </h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                          <defs>
                            <linearGradient id="performanceGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#c0c5ed" stopOpacity={0.4} />
                              <stop offset="50%" stopColor="#aaaecf" stopOpacity={0.1} />
                              <stop offset="100%" stopColor="#9599bf" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#ffffff79', fontSize: 12 }}
                          />
                          <YAxis hide />
                          <Tooltip
                            contentStyle={{ display: 'none' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#aaaecf"
                            strokeWidth={2}
                            fill="url(#performanceGrad)"
                            dot={false}
                            activeDot={{ r: 4, fill: "rgb(6,6,6)", stroke: "#aaaecf", strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="lp-detail-description">
                      <h4>About {selectedVaultData.name}</h4>
                      <p>{selectedVaultData.description}</p>
                      <a href="#" className="lp-learn-more">
                        Learn more <ArrowUpRight size={14} />
                      </a>
                    </div>

                    <div className="lp-trade-info-rectangle">
                      <div className="lp-info-row">
                        <div className="lp-label-container">Protocol Fee</div>
                        <div className="lp-value-container">{selectedVaultData.protocolFee}</div>
                      </div>
                      <div className="lp-info-row">
                        <div className="lp-label-container">Withdrawal Time</div>
                        <div className="lp-value-container">{selectedVaultData.withdrawalTime}</div>
                      </div>
                      <div className="lp-info-row">
                        <div className="lp-label-container">Total Supply</div>
                        <div className="lp-value-container">{selectedVaultData.totalSupply}</div>
                      </div>
                      <div className="lp-info-row">
                        <div className="lp-label-container">Total Borrowed</div>
                        <div className="lp-value-container">{selectedVaultData.totalBorrowed}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="vault-actions-section">
                  <div className="vault-tabs">
                    <button
                      className={`vault-tab ${activeVaultDetailTab === 'deposit' ? 'active' : ''}`}
                      onClick={() => setActiveVaultDetailTab('deposit')}
                    >
                      Deposit
                    </button>
                    <button
                      className={`vault-tab ${activeVaultDetailTab === 'withdraw' ? 'active' : ''}`}
                      onClick={() => setActiveVaultDetailTab('withdraw')}
                    >
                      Withdraw
                    </button>
                  </div>

                  {activeVaultDetailTab === 'deposit' ? (
                    <div className="vault-deposit-form">
                      <h4 className="vault-form-title">Add Liquidity to {selectedVaultData.name}</h4>
                      <p className="vault-form-description">
                        Enter the amounts you want to deposit for each token. The ratio will be maintained automatically.
                      </p>

                      <div className="deposit-amounts-section">
                        <div className={`deposit-input-group ${vaultFirstTokenExceedsBalance ? 'lp-input-container-balance-error' : ''}`}>
                          <div className="deposit-input-wrapper">
                            <input
                              type="text"
                              placeholder="0.0"
                              className={`deposit-amount-input ${vaultFirstTokenExceedsBalance ? 'lp-input-balance-error' : ''}`}
                              value={vaultDepositAmounts.first}
                              onChange={(e) => handleVaultDepositAmountChange('first', e.target.value)}
                            />
                            <div className="deposit-token-badge">
                              <img src={selectedVaultData.tokens.first.icon} alt="" className="deposit-token-icon" />
                              <span>{selectedVaultData.tokens.first.symbol}</span>
                            </div>
                          </div>
                          <div className="lp-deposit-balance-wrapper">
                            <div className={`lp-deposit-usd-value ${vaultFirstTokenExceedsBalance ? 'lp-usd-value-balance-error' : ''}`}>
                              {calculateUSD(vaultDepositAmounts.first, selectedVaultData.tokens.first.symbol)}
                            </div>
                            <div className="deposit-balance">
                              Balance: {formatDisplayValue(
                                getTokenBalance(selectedVaultData.tokens.first.symbol),
                                Number(
                                  (Object.values(tokendict).find(t => t.ticker === selectedVaultData.tokens.first.symbol)?.decimals) || 18
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={`deposit-input-group ${vaultSecondTokenExceedsBalance ? 'lp-input-container-balance-error' : ''}`}>
                          <div className="deposit-input-wrapper">
                            <input
                              type="text"
                              placeholder="0.0"
                              className={`deposit-amount-input ${vaultSecondTokenExceedsBalance ? 'lp-input-balance-error' : ''}`}
                              value={vaultDepositAmounts.second}
                              onChange={(e) => handleVaultDepositAmountChange('second', e.target.value)}
                            />
                            <div className="deposit-token-badge">
                              <img src={selectedVaultData.tokens.second.icon} alt="" className="deposit-token-icon" />
                              <span>{selectedVaultData.tokens.second.symbol}</span>
                            </div>
                          </div>
                          <div className="lp-deposit-balance-wrapper">
                            <div className={`lp-deposit-usd-value ${vaultSecondTokenExceedsBalance ? 'lp-usd-value-balance-error' : ''}`}>
                              {calculateUSD(vaultDepositAmounts.second, selectedVaultData.tokens.second.symbol)}
                            </div>
                            <div className="deposit-balance">
                              Balance: {formatDisplayValue(
                                getTokenBalance(selectedVaultData.tokens.second.symbol),
                                Number(
                                  (Object.values(tokendict).find(t => t.ticker === selectedVaultData.tokens.second.symbol)?.decimals) || 18
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="deposit-summary">
                        <div className="deposit-summary-row">
                          <span>Pool Share:</span>
                          <span>~0.01%</span>
                        </div>
                        <div className="deposit-summary-row">
                          <span>Total Value:</span>
                          <span>
                            {(() => {
                              const firstUSD = calculateUSD(vaultDepositAmounts.first, selectedVaultData.tokens.first.symbol);
                              const secondUSD = calculateUSD(vaultDepositAmounts.second, selectedVaultData.tokens.second.symbol);
                              const firstValue = parseFloat(firstUSD.replace('$', '')) || 0;
                              const secondValue = parseFloat(secondUSD.replace('$', '')) || 0;
                              const total = firstValue + secondValue;
                              return `${total.toFixed(2)}`;
                            })()}
                          </span>
                        </div>
                      </div>

                      <button
                        className={`continue-button ${isVaultDepositEnabled() ? 'enabled' : ''} ${(vaultFirstTokenExceedsBalance || vaultSecondTokenExceedsBalance) ? 'lp-button-balance-error' : ''}`}
                        disabled={!isVaultDepositEnabled()}
                        onClick={handleVaultDeposit}
                      >
                        {getVaultDepositButtonText()}
                      </button>
                    </div>
                  ) : (
                    <div className="vault-withdraw-form">
                      <h4 className="vault-form-title">Withdraw from {selectedVaultData.name}</h4>
                      <p className="vault-form-description">
                        Enter the amount of LP tokens you want to withdraw. You'll receive both tokens proportionally.
                      </p>

                                                <div className="withdraw-section">
                        <div className={`deposit-input-group ${withdrawExceedsBalance ? 'lp-input-container-balance-error' : ''}`}>
                          <div className="deposit-input-wrapper">
                            <input
                              type="text"
                              placeholder="0.0"
                              className={`deposit-amount-input ${withdrawExceedsBalance ? 'lp-input-balance-error' : ''}`}
                              value={withdrawAmount}
                              onChange={(e) => handleWithdrawAmountChange(e.target.value)}
                            />
                            <div className="deposit-token-badge">
                              <div className="lp-token-pair-icons" style={{ width: '40px', height: '20px' }}>
                                <img
                                  src={selectedVaultData.tokens.first.icon}
                                  alt=""
                                  className="lp-token-icon lp-token-icon-first"
                                  style={{ width: '20px', height: '20px' }}
                                />
                                <img
                                  src={selectedVaultData.tokens.second.icon}
                                  alt=""
                                  className="lp-token-icon lp-token-icon-second"
                                  style={{ width: '20px', height: '20px', left: '15px' }}
                                />
                              </div>
                              <span>LP Tokens</span>
                            </div>
                          </div>
                          <div className="lp-deposit-balance-wrapper">
                            <div className={`lp-deposit-usd-value ${withdrawExceedsBalance ? 'lp-usd-value-balance-error' : ''}`}>
                              ${(parseFloat(withdrawAmount || '0') * 1.5).toFixed(2)}
                            </div>
                            <div className="deposit-balance">
                              Balance: {selectedVaultData.userBalance} LP
                            </div>
                          </div>
                        </div>

                        <div className="withdraw-preview">
                          <h5 style={{ color: '#ffffff79', fontSize: '0.8rem', marginBottom: '0.5rem' }}>You will receive:</h5>
                          <div className="withdraw-token-preview">
                            <div className="withdraw-token-item">
                              <img src={selectedVaultData.tokens.first.icon} alt="" className="withdraw-token-icon" />
                              <span>{selectedVaultData.tokens.first.symbol}</span>
                              <span style={{ marginLeft: 'auto', color: '#fff' }}>
                                {(parseFloat(withdrawAmount || '0') * 0.5).toFixed(4)}
                              </span>
                            </div>
                            <div className="withdraw-token-item">
                              <img src={selectedVaultData.tokens.second.icon} alt="" className="withdraw-token-icon" />
                              <span>{selectedVaultData.tokens.second.symbol}</span>
                              <span style={{ marginLeft: 'auto', color: '#fff' }}>
                                {(parseFloat(withdrawAmount || '0') * 0.5).toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        className={`continue-button ${isWithdrawEnabled() ? 'enabled' : ''} ${withdrawExceedsBalance ? 'lp-button-balance-error' : ''}`}
                        disabled={!isWithdrawEnabled()}
                        onClick={handleVaultWithdraw}
                      >
                        {getWithdrawButtonText()}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LP;
