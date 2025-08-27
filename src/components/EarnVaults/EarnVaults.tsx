import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, Star } from 'lucide-react';
import './EarnVaults.css';
import walleticon from '../../assets/wallet_icon.png';
import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts';
import { fetchLatestPrice } from '../../utils/getPrice.ts';
import { settings } from '../../settings.ts';
import { useSharedContext } from '../../contexts/SharedContext';
import { CrystalLending } from '../../abis/CrystalLending.ts';
import { useReadContracts } from 'wagmi';
import { encodeFunctionData } from 'viem';



interface EarnVault {
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


interface EarnToken {
    symbol: string;
    icon: string;
    name: string;
    address: string;
}

interface EarnVaultsProps {
    setpopup: (value: number) => void;
    setSupplyBorrowInitialTab?: (tab: 'supply' | 'borrow') => void;
    setSupplyBorrowVault?: (vault: any) => void;
    onSelectToken: (token: Token) => void;
    selectedToken: Token | null;
    setOnSelectTokenCallback?: (callback: ((token: Token) => void) | null) => void;
    tokenBalances: { [address: string]: bigint };
    tokendict: { [address: string]: any };
    address?: string;
    connected: boolean;
    refetch: () => void;
    onCollateralSelect?: (token: Token) => void;
    tradesByMarket: any;
    markets: any;
    usdc: string;
    wethticker: string;
    ethticker: string;
    account: any;
    sendUserOperationAsync: any;
    activechain: number;
    setChain: () => void;
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

const EarnVaults: React.FC<EarnVaultsProps> = ({
    setpopup,
    onSelectToken,
    setOnSelectTokenCallback,
    tokenBalances,
    tokendict,
    address,
    connected,
    tradesByMarket,
    markets,
    usdc,
    wethticker,
    account,
    sendUserOperationAsync,
    activechain,
    setChain,
    refetch,

}) => {
    const [userHasPositions, setUserHasPositions] = useState(false);
    const checkUserHasPositions = (vault: EarnVault) => {
        return parseFloat(vault.userBalance) > 0;
    };
    const [earnActiveTab] = useState<'all' | 'deposited'>('all');
    const [earnSelectedVault, setEarnSelectedVault] = useState<string | null>(null);
    const [earnSelectedTokens] = useState<EarnToken[]>([]);
    const [chartPeriod, setChartPeriod] = useState('3 months');
    const [chartCurrency, setChartCurrency] = useState('USDC');
    const { favorites, toggleFavorite } = useSharedContext();
    const [earnTokenAmounts, setEarnTokenAmounts] = useState<{ [key: string]: string }>({});
    const [earnActiveMode, setEarnActiveMode] = useState('supply');
    const [earnLtvValue, setEarnLtvValue] = useState(0);
    const [earnCollateralAmount, setEarnCollateralAmount] = useState('');
    const [earnBorrowAmount, setEarnBorrowAmount] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [earnSelectedCollateral, setEarnSelectedCollateral] = useState<EarnToken | null>(null);
    const [apyChartPeriod, setApyChartPeriod] = useState('30 days');
    const [isApyDropdownOpen, setIsApyDropdownOpen] = useState(false);
    const apyDropdownRef = useRef<HTMLDivElement>(null);
    const [earnChartView, setEarnChartView] = useState<'overview' | 'positions'>('overview');
    const [attemptedExceedLimit, setAttemptedExceedLimit] = useState(false);
    const hasInitializedFavorites = useRef(false);

    const chainId = 10143;
    const chainTokenDict = settings.chainConfig[chainId].tokendict;
    const chainMarkets = settings.chainConfig[chainId].markets;
    const earnAvailableTokens: EarnToken[] = Object.values(chainTokenDict).map((token: any) => ({
        symbol: token.ticker,
        icon: token.image,
        name: token.name,
        address: token.address
    }));

    const lendingAddress = null as `0x${string}` | null;
    const {  refetch: lendingRefetch } = useReadContracts({
        batchSize: 0,
        contracts: [
            ...(lendingAddress ? [
                // get governance address
                {
                    abi: CrystalLending,
                    address: lendingAddress,
                    functionName: 'gov',
                    args: [],
                },
                // get account health for account ID 0
                {
                    abi: CrystalLending,
                    address: lendingAddress,
                    functionName: 'getAccountHealth',
                    args: [false, address ?? '0x0000000000000000000000000000000000000000', 0],
                },
                // get account health for account ID 1
                {
                    abi: CrystalLending,
                    address: lendingAddress,
                    functionName: 'getAccountHealth',
                    args: [false, address ?? '0x0000000000000000000000000000000000000000', 1],
                },
                // get account health for account ID 2
                {
                    abi: CrystalLending,
                    address: lendingAddress,
                    functionName: 'getAccountHealth',
                    args: [false, address ?? '0x0000000000000000000000000000000000000000', 2],
                },
                // get interest rates for all tokens
                ...Object.values(chainTokenDict).map((token: any) => ({
                    abi: CrystalLending,
                    address: lendingAddress,
                    functionName: 'getInterestRate',
                    args: [token.address],
                })),
                // get token information for all tokens
                ...Object.values(chainTokenDict).map((token: any) => ({
                    abi: CrystalLending,
                    address: lendingAddress,
                    functionName: 'tokens',
                    args: [token.address],
                })),
            ] : []),
        ],
        query: {
            refetchInterval: 10000,
            gcTime: 0
        },
    });


    const [isSigning, setIsSigning] = useState(false);


    const handleApproval = async (tokenAddress: `0x${string}`) => {
  if (!account.connected || !address || !lendingAddress) {
    return false;
  }

  try {
    setIsSigning(true);
    
    
    const maxApproval = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    
    const hash = await sendUserOperationAsync({
      uo: {
        target: tokenAddress,
        data: encodeFunctionData({
          abi: [
            {
              "inputs": [
                {"internalType": "address", "name": "spender", "type": "address"},
                {"internalType": "uint256", "name": "amount", "type": "uint256"}
              ],
              "name": "approve",
              "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          functionName: 'approve',
          args: [lendingAddress, maxApproval],
        }),
        value: 0n,
      },
    });
    
    return true;
  } catch (error) {
    console.error('Approval failed:', error);
    return false;
  } finally {
    setIsSigning(false);
  }
};

const handleSupply = async (tokenAddress: `0x${string}`, amount: string, accountId: number = 0) => {
  if (!account.connected || !address) {
    setpopup(4);
    return false;
  }

  if (account.chainId !== activechain) {
    setChain();
    return false;
  }

  try {
    setIsSigning(true);

    const tokenData = earnAvailableTokens.find(t => t.address === tokenAddress);
    if (!tokenData || !tokendict[tokenAddress]) return false;

    if (tokenAddress !== wethticker) {
      const approvalSuccess = await handleApproval(tokenAddress);
      if (!approvalSuccess) return false;
    }

    const decimals = Number(tokendict[tokenAddress].decimals);
    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * (10 ** decimals)));

    const hash = await sendUserOperationAsync({
      uo: {
        target: lendingAddress,
        data: encodeFunctionData({
          abi: CrystalLending,
          functionName: 'supply',
          args: [tokenAddress, amountBigInt, BigInt(accountId)],
        }),
        value: tokenAddress === wethticker ? amountBigInt : 0n, 
      },
    });

    refetch();
    lendingRefetch();
    return true;
  } catch (error) {
    console.error('Supply failed:', error);
    return false;
  } finally {
    setIsSigning(false);
  }
};

    const handleBorrow = async (tokenAddress: `0x${string}`, amount: string, accountId: number = 0) => {
        if (!account.connected || !address) {
            setpopup(4);
            return false;
        }

        if (account.chainId !== activechain) {
            setChain();
            return false;
        }

        try {
            setIsSigning(true);

            const tokenData = earnAvailableTokens.find(t => t.address === tokenAddress);
            if (!tokenData || !tokendict[tokenAddress]) return false;

            const decimals = Number(tokendict[tokenAddress].decimals);
            const amountBigInt = BigInt(Math.floor(parseFloat(amount) * (10 ** decimals)));

            const hash = await sendUserOperationAsync({
                uo: {
                    target: lendingAddress,
                    data: encodeFunctionData({
                        abi: CrystalLending,
                        functionName: 'borrow',
                        args: [tokenAddress, amountBigInt, BigInt(accountId)],
                    }),
                    value: 0n,
                },
            });

            refetch();
            lendingRefetch();
            return true;
        } catch (error) {
            console.error('Borrow failed:', error);
            return false;
        } finally {
            setIsSigning(false);
        }
    };

    const handleWithdraw = async (tokenAddress: `0x${string}`, amount: string, accountId: number = 0) => {
        if (!account.connected || !address) {
            setpopup(4);
            return false;
        }

        if (account.chainId !== activechain) {
            setChain();
            return false;
        }

        try {
            setIsSigning(true);

            const tokenData = earnAvailableTokens.find(t => t.address === tokenAddress);
            if (!tokenData || !tokendict[tokenAddress]) return false;

            const decimals = Number(tokendict[tokenAddress].decimals);
            const amountBigInt = BigInt(Math.floor(parseFloat(amount) * (10 ** decimals)));

            const hash = await sendUserOperationAsync({
                uo: {
                    target: lendingAddress,
                    data: encodeFunctionData({
                        abi: CrystalLending,
                        functionName: 'withdraw',
                        args: [tokenAddress, amountBigInt, BigInt(accountId)],
                    }),
                    value: 0n,
                },
            });

            refetch();
            lendingRefetch();
            return true;
        } catch (error) {
            console.error('Withdraw failed:', error);
            return false;
        } finally {
            setIsSigning(false);
        }
    };

    const handleRepay = async (tokenAddress: `0x${string}`, amount: string, accountId: number = 0) => {
        if (!account.connected || !address) {
            setpopup(4);
            return false;
        }

        if (account.chainId !== activechain) {
            setChain();
            return false;
        }

        try {
            setIsSigning(true);

            const tokenData = earnAvailableTokens.find(t => t.address === tokenAddress);
            if (!tokenData || !tokendict[tokenAddress]) return false;

            const decimals = Number(tokendict[tokenAddress].decimals);
            const amountBigInt = BigInt(Math.floor(parseFloat(amount) * (10 ** decimals)));

            const hash = await sendUserOperationAsync({
                uo: {
                    target: lendingAddress,
                    data: encodeFunctionData({
                        abi: CrystalLending,
                        functionName: 'repay',
                        args: [tokenAddress, amountBigInt, BigInt(accountId)],
                    }),
                    value: 0n,
                },
            });

            refetch();
            lendingRefetch();
            return true;
        } catch (error) {
            console.error('Repay failed:', error);
            return false;
        } finally {
            setIsSigning(false);
        }
    };

    const earnDefaultTokens = ['MON', 'WMON', 'USDC'];
    const earnVaults: EarnVault[] = [
        {
            id: 'earn-mon-usdc-vault',
            name: 'Monad',
            tokens: {
                first: {
                    symbol: 'MON',
                    icon: chainTokenDict['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'].image
                },
            },
            apy: 24.5,
            tvl: '$3.7M',
            description: 'Earn yield by providing liquidity to the MON-USDC pool. This vault automatically compounds rewards into more tokens to maximize your returns.',
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
            id: 'earn-usdc-vault',
            name: 'USD Coin',
            tokens: {
                first: {
                    symbol: 'USDC',
                    icon: chainTokenDict['0xf817257fed379853cDe0fa4F97AB987181B1E5Ea']?.image
                },
            },
            apy: 5.2,
            tvl: '$25.8M',
            description: 'Earn yield by supplying USDC to the lending pool. This vault provides stable returns with low risk exposure.',
            userBalance: '0.00',
            tags: ['Stable', 'Low Risk'],
            dailyYield: '0.0142%',
            protocolFee: '0.5%',
            withdrawalTime: 'Instant',
            depositRatio: '100%',
            totalSupply: '$20.5M',
            supplyApy: 5.2,
            totalBorrowed: '$5.3M',
            borrowApy: 7.8
        },
        {
            id: 'earn-weth-usdc-vault',
            name: 'Wrapped Ethereum',
            tokens: {
                first: {
                    symbol: 'WETH',
                    icon: chainTokenDict['0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37'].image
                },
            },
            apy: 8.2,
            tvl: '$12.5M',
            description: 'Earn yield by providing liquidity to the ETH-USDC pool. This vault automatically compounds rewards into more tokens to maximize your returns.',
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
            id: 'earn-wbtc-usdc-vault',
            name: 'Wrapped Bitcoin',
            tokens: {
                first: {
                    symbol: 'WBTC',
                    icon: chainTokenDict['0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d'].image
                },
            },
            apy: 6.7,
            tvl: '$18.9M',
            description: 'Earn yield by providing liquidity to the BTC-USDC pool. This vault automatically compounds rewards into more tokens to maximize your returns.',
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
            id: 'earn-shmon-mon-vault',
            name: 'shMonad',
            tokens: {
                first: {
                    symbol: 'shMON',
                    icon: chainTokenDict['0x3a98250F98Dd388C211206983453837C8365BDc1'].image
                },
            },
            apy: 32.8,
            tvl: '$2.2M',
            description: 'Earn yield by providing liquidity to the shMON-MON pool. This vault automatically compounds rewards into more tokens to maximize your returns.',
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
            id: 'earn-sol-usdc-vault',
            name: 'Wrapped Solana',
            tokens: {
                first: {
                    symbol: 'WSOL',
                    icon: chainTokenDict['0x5387C85A4965769f6B0Df430638a1388493486F1'].image
                },
            },
            apy: 7.5,
            tvl: '$8.7M',
            description: 'Earn yield by providing liquidity to the SOL-USDC pool. This vault automatically compounds rewards into more tokens to maximize your returns.',
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
            id: 'earn-aprmon-mon-vault',
            name: 'aPriori Monad LST',
            tokens: {
                first: {
                    symbol: 'aprMON',
                    icon: chainTokenDict['0xb2f82D0f38dc453D596Ad40A37799446Cc89274A'].image
                },
            },
            apy: 9.1,
            tvl: '$5.3M',
            description: 'Earn yield by providing liquidity to the AVAX-USDC pool. This vault automatically compounds rewards into more tokens to maximize your returns.',
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
            id: 'earn-smon-mon-vault',
            name: 'Kintsu Staked Monad',
            tokens: {
                first: {
                    symbol: 'sMON',
                    icon: chainTokenDict['0xe1d2439b75fb9746E7Bc6cB777Ae10AA7f7ef9c5'].image
                },
            },
            apy: 8.9,
            tvl: '$4.3M',
            description: 'Earn yield by providing liquidity to the XRP-USDT pool. This vault automatically compounds rewards into more tokens to maximize your returns.',
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
            id: 'earn-usdt-usdc-vault',
            name: 'Tether USD',
            tokens: {
                first: {
                    symbol: 'USDT',
                    icon: chainTokenDict['0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D'].image
                },
            },
            apy: 8.9,
            tvl: '$4.3M',
            description: 'Earn yield by providing liquidity to the XRP-USDT pool. This vault automatically compounds rewards into more tokens to maximize your returns.',
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
    const calculateUSDValue = (
        amount: bigint,
        trades: any[],
        tokenAddress: string,
        market: any,
        tradesByMarket: any,
        markets: any,
        tokendict: any
    ) => {
        if (amount === BigInt(0)) return 0;

        if (market.quoteAsset === 'USDC') {
            const latestPrice = fetchLatestPrice(trades, market);
            if (!latestPrice) return 0;

            const decimals = Number(tokendict[tokenAddress]?.decimals || 18);
            const usdValue = (Number(amount) * latestPrice) / (10 ** decimals);
            return usdValue;
        }
        if (market.quoteAsset === 'MON' || market.quoteAsset === 'WMON') {
            const latestPrice = fetchLatestPrice(trades, market);
            if (!latestPrice) return 0;

            const monUsdcTrades = tradesByMarket['MONUSDC'];
            const monUsdcMarket = markets['MONUSDC'];

            if (!monUsdcTrades || !monUsdcMarket) {
                return 0;
            }

            const monUsdPrice = fetchLatestPrice(monUsdcTrades, monUsdcMarket);
            if (!monUsdPrice) return 0;

            const decimals = Number(tokendict[tokenAddress]?.decimals || 18);
            const usdValue = (Number(amount) * latestPrice * monUsdPrice) / (10 ** decimals);
            return usdValue;
        }
        return 0;
    };
    const formatUSDDisplay = (amount: number) => {
        if (amount === 0) return '$0.00';

        const absAmount = Math.abs(amount);
        if (absAmount >= 1e12) {
            return `$${(amount / 1e12).toFixed(2)}T`;
        } else if (absAmount >= 1e9) {
            return `$${(amount / 1e9).toFixed(2)}B`;
        } else if (absAmount >= 1e6) {
            return `$${(amount / 1e6).toFixed(2)}M`;
        }

        if (absAmount >= 1) {
            return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
        }

        if (absAmount < 0.01) {
            return '<$0.01';
        }
        return `$${amount.toFixed(2)}`;
    };

    const getInputUSDValue = (
        tokenSymbol: string,
        inputValue: string,
        tradesByMarket: any,
        usdc: string,
    ): string => {
        if (!inputValue || inputValue === '' || inputValue === '0' || inputValue === '0.00') {
            return '$0.00';
        }

        const tokenEntry = Object.values(chainTokenDict).find((token: any) => token.ticker === tokenSymbol) as any;
        if (!tokenEntry) {
            return '$0.00';
        }
        if (tokenSymbol === 'USDC') {
            return `$${parseFloat(inputValue).toFixed(2)}`;
        }

        const decimals = Number(tokenEntry.decimals);
        const amountBigInt = BigInt(Math.floor(parseFloat(inputValue) * (10 ** decimals)));

        let market = null;
        let trades = null;

        const directUSDCKeys = [
            `${tokenSymbol}USDC`,
            `USDC${tokenSymbol}`
        ];

        for (const key of directUSDCKeys) {
            if (chainMarkets[key] && tradesByMarket[key]) {
                market = chainMarkets[key];
                trades = tradesByMarket[key];
                break;
            }
        }

        if (!market && (tokenSymbol !== 'MON' && tokenSymbol !== 'WMON')) {
            const monKeys = [
                `${tokenSymbol}MON`,
                `${tokenSymbol}WMON`,
                `MON${tokenSymbol}`,
                `WMON${tokenSymbol}`
            ];

            for (const key of monKeys) {
                if (chainMarkets[key] && tradesByMarket[key]) {
                    market = chainMarkets[key];
                    trades = tradesByMarket[key];
                    break;
                }
            }
        }

        if (!market && tokenSymbol === 'MON') {
            if (chainMarkets['MONUSDC'] && tradesByMarket['MONUSDC']) {
                market = chainMarkets['MONUSDC'];
                trades = tradesByMarket['MONUSDC'];
            }
        }

        if (!market && tokenSymbol === 'WMON') {
            if (chainMarkets['WMONUSDC'] && tradesByMarket['WMONUSDC']) {
                market = chainMarkets['WMONUSDC'];
                trades = tradesByMarket['WMONUSDC'];
            }
        }

        if (!market || !trades || !trades[0]) {
            return '$0.00';
        }

        try {
            const usdValue = calculateUSDValue(
                amountBigInt,
                trades,
                tokenEntry.address,
                market,
                tradesByMarket,
                chainMarkets,
                usdc
            );

            return formatUSDDisplay(usdValue);
        } catch (error) {
            return '$0.00';
        }
    };

    const getEarnSliderColor = (value: number) => {
        if (value <= 40) return '#50f08d';
        if (value <= 60) return '#ffa500';
        if (value <= 75) return '#ff6b35';
        return '#ff4757';
    };
    const earnSelectedVaultData = earnSelectedVault ? earnVaults.find(vault => vault.id === earnSelectedVault) : null;

    const handleEarnLtvChange = (newLtv: number) => {
        const cappedLtv = Math.min(newLtv, 90);
        setEarnLtvValue(cappedLtv);
        if (cappedLtv <= 90) {
            setAttemptedExceedLimit(false);
        }

        if (earnCollateralAmount && cappedLtv > 0 && earnSelectedCollateral && earnSelectedVaultData) {
            const collateralUSD = parseFloat(getInputUSDValue(
                earnSelectedCollateral.symbol,
                earnCollateralAmount,
                tradesByMarket,
                markets,
            ).replace('$', '').replace(',', ''));

            const targetBorrowUSD = (collateralUSD * cappedLtv) / 100;

            if (earnSelectedVaultData.tokens.first.symbol === 'USDC') {
                setEarnBorrowAmount(targetBorrowUSD.toFixed(2));
            } else {
                const currentBorrowUSD = parseFloat(getInputUSDValue(
                    earnSelectedVaultData.tokens.first.symbol,
                    '1',
                    tradesByMarket,
                    markets,
                ).replace('$', '').replace(',', ''));

                if (currentBorrowUSD > 0) {
                    const tokenAmount = targetBorrowUSD / currentBorrowUSD;
                    setEarnBorrowAmount(tokenAmount.toFixed(6));
                }
            }
        }
    };


    const handleEarnBorrowAmountChange = (value: string) => {
        if (!earnCollateralAmount || !value || !earnSelectedCollateral || !earnSelectedVaultData) {
            setEarnBorrowAmount(value);
            setAttemptedExceedLimit(false);
            return;
        }

        const collateralUSD = parseFloat(getInputUSDValue(
            earnSelectedCollateral.symbol,
            earnCollateralAmount,
            tradesByMarket,
            markets,
        ).replace('$', '').replace(',', ''));

        const borrowUSD = parseFloat(getInputUSDValue(
            earnSelectedVaultData.tokens.first.symbol,
            value,
            tradesByMarket,
            markets,
        ).replace('$', '').replace(',', ''));

        if (collateralUSD > 0) {
            const newLTV = (borrowUSD / collateralUSD) * 100;

            if (newLTV > 90) {
                setAttemptedExceedLimit(true);
                const maxBorrowUSD = (collateralUSD * 90) / 100;

                if (earnSelectedVaultData.tokens.first.symbol === 'USDC') {
                    setEarnBorrowAmount(maxBorrowUSD.toFixed(2));
                } else {
                    const currentBorrowUSD = parseFloat(getInputUSDValue(
                        earnSelectedVaultData.tokens.first.symbol,
                        '1',
                        tradesByMarket,
                        markets,
                    ).replace('$', '').replace(',', ''));

                    if (currentBorrowUSD > 0) {
                        const maxTokenAmount = maxBorrowUSD / currentBorrowUSD;
                        setEarnBorrowAmount(maxTokenAmount.toFixed(6));
                    }
                }
                setEarnLtvValue(90);
            } else {
                setEarnBorrowAmount(value);
                setEarnLtvValue(newLTV);
                setAttemptedExceedLimit(false);
            }
        } else {
            setEarnBorrowAmount(value);
            setAttemptedExceedLimit(false);
        }
    };
    useEffect(() => {
        if (setOnSelectTokenCallback) {
            setOnSelectTokenCallback(() => (token: Token) => {
                if (earnActiveMode === 'borrow') {
                    handleCollateralTokenSelect(token);
                } else {
                    onSelectToken(token);
                }
            });
        }

        return () => {
            if (setOnSelectTokenCallback) {
                setOnSelectTokenCallback(null);
            }
        };
    }, [earnActiveMode]);
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
    useEffect(() => {
        if (hasInitializedFavorites.current) return;
        hasInitializedFavorites.current = true;

        const earnAutoFavoriteDefaults = () => {
            earnDefaultTokens.forEach(symbol => {
                const token = earnAvailableTokens.find(t => t.symbol === symbol);
                if (token && !favorites.includes(token.address)) {
                    toggleFavorite(token.address);
                }
            });
        };
        earnAutoFavoriteDefaults();
    }, []);
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


    const handleCollateralTokenSelect = (token: Token) => {
        const earnToken: EarnToken = {
            symbol: token.symbol,
            icon: token.icon,
            name: token.symbol,
            address: earnAvailableTokens.find(t => t.symbol === token.symbol)?.address || ''
        };
        setEarnSelectedCollateral(earnToken);
        setpopup(0);
    };
    const showEarnVaultDetailWithMode = (vaultId: string, mode: 'supply' | 'borrow' | 'withdraw' | 'repay') => {
        setEarnSelectedVault(vaultId);
        setEarnActiveMode(mode);
        const vaultData = earnVaults.find(vault => vault.id === vaultId);
        if (vaultData) {
            const vaultToken = earnAvailableTokens.find(t => t.symbol === vaultData.tokens.first.symbol);
            if (vaultToken) {
                setEarnSelectedCollateral(vaultToken);
            }
            setUserHasPositions(checkUserHasPositions(vaultData));
        }
    };
    const [supplyExceedsBalance, setSupplyExceedsBalance] = useState(false);
    const [borrowExceedsBalance] = useState(false);
    const [collateralExceedsBalance, setCollateralExceedsBalance] = useState(false);

    const checkExceedsBalance = (tokenSymbol: string, inputAmount: string, mode = 'supply') => {
        if (!connected || !address || !inputAmount || inputAmount === '0' || inputAmount === '0.00') {
            return false;
        }

        const token = earnAvailableTokens.find(t => t.symbol === tokenSymbol);
        if (!token || !tokendict[token.address]) return false;

        const balance = getTokenBalance(tokenSymbol);
        const decimals = Number(tokendict[token.address].decimals);

        try {
            const inputBigInt = BigInt(Math.floor(parseFloat(inputAmount) * (10 ** decimals)));

            if (tokenSymbol === 'ETH' && mode === 'supply') {
                const gasReserve = settings.chainConfig[chainId].gasamount;
                const availableBalance = balance > gasReserve ? balance - gasReserve : BigInt(0);
                return inputBigInt > availableBalance;
            }

            return inputBigInt > balance;
        } catch (error) {
            return false;
        }
    };
    const handleEarnTokenAmountChangeWithValidation = (tokenSymbol: string, value: string) => {
        handleEarnTokenAmountChange(tokenSymbol, value);

        let exceedsBalance = false;
        if (earnActiveMode === 'withdraw') {
            if (earnSelectedVaultData) {
                const depositedAmount = parseFloat(earnSelectedVaultData.userBalance);
                const withdrawAmount = parseFloat(value || '0');
                exceedsBalance = withdrawAmount > depositedAmount;
            }
        } else {
            exceedsBalance = checkExceedsBalance(tokenSymbol, value, 'supply');
        }

        setSupplyExceedsBalance(exceedsBalance);
    };
    const handleEarnCollateralAmountChangeWithValidation = (value: string) => {
        setEarnCollateralAmount(value);

        if (!value || value === '0') {
            setAttemptedExceedLimit(false);
            setCollateralExceedsBalance(false);
            return;
        }

        if (earnSelectedCollateral) {
            const exceedsBalance = checkExceedsBalance(earnSelectedCollateral.symbol, value, 'collateral');
            setCollateralExceedsBalance(exceedsBalance);
        }

        if (earnBorrowAmount && value && earnSelectedCollateral && earnSelectedVaultData) {
            const collateralUSD = parseFloat(getInputUSDValue(
                earnSelectedCollateral.symbol,
                value,
                tradesByMarket,
                markets,
            ).replace('$', '').replace(',', ''));

            const borrowUSD = parseFloat(getInputUSDValue(
                earnSelectedVaultData.tokens.first.symbol,
                earnBorrowAmount,
                tradesByMarket,
                markets,
            ).replace('$', '').replace(',', ''));

            if (collateralUSD > 0) {
                const newLTV = (borrowUSD / collateralUSD) * 100;
                setEarnLtvValue(Math.min(newLTV, 90));

                if (newLTV <= 90) {
                    setAttemptedExceedLimit(false);
                }
            }
        }
    };


    const getSupplyErrorMessage = (tokenSymbol: string) => {
        if (!supplyExceedsBalance) return null;

        const balance = getFormattedBalance(tokenSymbol);
        return `Insufficient ${tokenSymbol} balance. You have ${balance} ${tokenSymbol} available.`;
    };

    const getCollateralErrorMessage = () => {
        if (!collateralExceedsBalance || !earnSelectedCollateral) return null;

        const balance = getFormattedBalance(earnSelectedCollateral.symbol);
        return `Insufficient ${earnSelectedCollateral.symbol} balance. You have ${balance} ${earnSelectedCollateral.symbol} available.`;
    };
    const handleSupplyMaxClick = () => {
        if (connected && address && earnSelectedVaultData) {
            const balance = getTokenBalance(earnSelectedVaultData.tokens.first.symbol);
            const tokenData = earnAvailableTokens.find(t => t.symbol === earnSelectedVaultData.tokens.first.symbol);

            if (tokenData && tokendict[tokenData.address] && balance != BigInt(0)) {
                const decimals = Number(tokendict[tokenData.address].decimals);
                let amount = balance;

                if (earnSelectedVaultData.tokens.first.symbol === 'ETH') {
                    amount = balance - settings.chainConfig[chainId].gasamount > BigInt(0)
                        ? balance - settings.chainConfig[chainId].gasamount
                        : BigInt(0);
                }

                const formattedAmount = customRound(
                    Number(amount) / 10 ** decimals,
                    3
                ).toString();
                if (earnActiveMode === 'supply') {
                    handleEarnCollateralAmountChangeWithValidation(formattedAmount);
                } else {
                    handleEarnTokenAmountChangeWithValidation(earnSelectedVaultData.tokens.first.symbol, formattedAmount);
                }
            }
        }
    };

    const handleCollateralMaxClick = () => {
        if (connected && address && earnSelectedCollateral) {
            const balance = getTokenBalance(earnSelectedCollateral.symbol);
            const tokenData = earnAvailableTokens.find(t => t.symbol === earnSelectedCollateral.symbol);

            if (tokenData && tokendict[tokenData.address] && balance != BigInt(0)) {
                const decimals = Number(tokendict[tokenData.address].decimals);
                let amount = balance;

                if (earnSelectedCollateral.symbol === 'ETH') {
                    amount = balance - settings.chainConfig[chainId].gasamount > BigInt(0)
                        ? balance - settings.chainConfig[chainId].gasamount
                        : BigInt(0);
                }

                const formattedAmount = customRound(
                    Number(amount) / 10 ** decimals,
                    3
                ).toString();

                handleEarnCollateralAmountChangeWithValidation(formattedAmount);
            }
        }
    };

    const isActionButtonDisabled = () => {
        if (!connected) return false;

        if (earnActiveMode === 'supply' || earnActiveMode === 'withdraw') {
            return supplyExceedsBalance;
        } else if (earnActiveMode === 'borrow' || earnActiveMode === 'repay') {
            return (
                collateralExceedsBalance ||
                borrowExceedsBalance ||
                earnLtvValue > 90 ||
                attemptedExceedLimit
            );
        }

        return false;
    };
    const getActionButtonText = () => {
        if (!connected) return 'Connect Account';

        if (earnActiveMode === 'supply' || earnActiveMode === 'withdraw') {
            if (supplyExceedsBalance) return 'Insufficient Balance';
            return earnActiveMode === 'withdraw' ? 'Withdraw' : 'Supply';
        } else if (earnActiveMode === 'borrow' || earnActiveMode === 'repay') {
            if (collateralExceedsBalance) return 'Insufficient Collateral';
            if (borrowExceedsBalance) return 'Insufficient Liquidity';
            if (earnLtvValue > 90 || attemptedExceedLimit) return 'Reduce Borrow Amount';
            return earnActiveMode === 'repay' ? 'Repay' : 'Borrow';
        }

        return 'Continue';
    };

    const earnFilteredVaults = earnVaults.filter(vault => {
        const tokenMatch =
            earnSelectedTokens.length === 0 ||
            earnSelectedTokens.every(token =>
                vault.tokens.first.symbol === token.symbol
            );

        const isDeposited = earnActiveTab === 'deposited'
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
        const token = earnAvailableTokens.find(t => t.symbol === tokenSymbol);
        if (!token || !tokendict[token.address]) return BigInt(0);
        return tokenBalances[token.address] || BigInt(0);
    };

    const getFormattedBalance = (tokenSymbol: string): string => {
        const token = earnAvailableTokens.find(t => t.symbol === tokenSymbol);
        if (!token || !tokendict[token.address]) return '0';

        const balance = getTokenBalance(tokenSymbol);
        return formatDisplayValue(balance, Number(tokendict[token.address].decimals));
    };

    const handleEarnFavoriteToggle = (vault: EarnVault, e: React.MouseEvent) => {
        e.stopPropagation();

        const tokenEntry = Object.values(chainTokenDict).find(
            (token: any) => token.ticker === vault.tokens.first.symbol
        ) as any;

        if (!tokenEntry) return;

        if (earnDefaultTokens.includes(vault.tokens.first.symbol)) return;

        toggleFavorite(tokenEntry.address);
    };


    const isVaultFavorited = (vault: EarnVault) => {
        const tokenEntry = Object.values(chainTokenDict).find(
            (token: any) => token.ticker === vault.tokens.first.symbol
        ) as any;

        if (!tokenEntry) return false;

        return favorites.includes(tokenEntry.address);
    };

    const backToEarnList = () => {
        setEarnSelectedVault(null);
        setEarnSelectedCollateral(null);
        setEarnCollateralAmount('');
        setEarnBorrowAmount('');
        setEarnLtvValue(0);
    };



    const handleEarnTokenAmountChange = (tokenSymbol: string, value: string) => {
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setEarnTokenAmounts(prev => ({
                ...prev,
                [tokenSymbol]: value
            }));
        }
    };

    return (
        <div className="earn-container">
            <div className="earn-content-wrapper">
                {!earnSelectedVault && (
                    <>

                    </>
                )}
                <div className={`earn-rectangle ${earnSelectedVault ? 'earn-rectangle-no-border' : ''}`}>
                    {!earnSelectedVault ? (
                        <>
                            <div className="earn-vaults-grid">
                                <div className="earn-vaults-list-header">
                                    <div className="earn-col earn-asset-col">Asset</div>
                                    <div className="earn-col earn-supply-col">Total Supply</div>
                                    <div className="earn-col earn-borrowed-col">Total Borrowed</div>
                                    <div className="earn-col earn-borrowed-col">Borrow LTV</div>
                                    <div className="earn-col earn-supply-apy-col">Supply APY</div>
                                    <div className="earn-col earn-borrow-apy-col">Borrow APY</div>
                                    <div className="earn-col earn-actions-col"></div>
                                </div>

                                {earnFilteredVaults.map((vault) => (
                                    <div
                                        key={vault.id}
                                        className="earn-card"
                                    >
                                        <div className="earn-summary">
                                            <div className="earn-col earn-asset-col">
                                                <Star
                                                    size={20}
                                                    className="vault-search-token-star"
                                                    onClick={(e) => handleEarnFavoriteToggle(vault, e)}
                                                    fill={isVaultFavorited(vault) ? "#aaaecf" : "none"}
                                                    color={isVaultFavorited(vault) ? "#aaaecf" : "#ffffff79"}
                                                />
                                                <div className="earn-token-pair-icons">
                                                    <img
                                                        src={vault.tokens.first.icon}
                                                        alt={vault.tokens.first.symbol}
                                                        className="earn-token-icon earn-token-icon-first"
                                                    />
                                                </div>
                                                <div className="earn-asset-info">
                                                    <h2 className="earn-listname">{vault.name}<span className='earn-asset-ticker'>{vault.tokens.first.symbol}</span></h2>
                                                </div>
                                            </div>

                                            <div className="earn-col earn-supply-col">
                                                <div className="earn-supply-value earn-supply-tooltip-wrapper">
                                                    <div className="earn-token-amount-display">{vault.totalSupply.replace('$', ' ')}</div>
                                                    <span className="earn-apy-value-text"> $2.8M </span>
                                                    <div className="earn-supply-tooltip">
                                                        <div className="earn-supply-tooltip-header">
                                                            <span className="earn-supply-tooltip-sub">UTILIZATION</span>
                                                            <span>88.04%</span>
                                                        </div>

                                                        <div className="earn-supply-tooltip-body">
                                                            <div className="earn-supply-chart">
                                                                <svg width="35" height="35" viewBox="0 0 36 36">
                                                                    <path className="earn-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 1 1 0 31.831 a 15.9155 15.9155 0 1 1 0 -31.831" />
                                                                    <path className="earn-circle-usage" strokeDasharray="88.04, 100" d="M18 2.0845 a 15.9155 15.9155 0 1 1 0 31.831 a 15.9155 15.9155 0 1 1 0 -31.831" />
                                                                </svg>
                                                            </div>

                                                            <div className="earn-supply-tooltip-metrics">
                                                                <div className="earn-supply-tooltip-top-row">
                                                                    <div className="earn-supply-tooltip-top-row-left">
                                                                        <span className="earn-supply-tooltip-title-top">Total Supplied</span>
                                                                        <span>2.64M / 3.00M</span>
                                                                    </div>
                                                                    <div className="earn-supply-tooltip-top-row-right">
                                                                        <span className="earn-supply-tooltip-title-top">Supply APY</span>
                                                                        <span>1.67%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="earn-supply-tooltip-body-bottom">
                                                            <span className="earn-risk-text">RISK PARAMETERS</span>
                                                            <div className="earn-supply-tooltip-body-bottom-line"> </div>
                                                        </div>
                                                        <div className="earn-supply-tooltip-row">
                                                            <span className="earn-supply-row-detail">Max LTV</span>
                                                            <span className="earn-supply-row-value">80.50%</span>
                                                        </div>
                                                        <div className="earn-supply-tooltip-row">
                                                            <span className="earn-supply-row-detail">Liquidation Threshold</span>
                                                            <span className="earn-supply-row-value">83.00%</span>
                                                        </div>
                                                        <div className="earn-supply-tooltip-row">
                                                            <span className="earn-supply-row-detail">Liquidation Penalty</span>
                                                            <span className="earn-supply-row-value">5.00%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="earn-col earn-borrowed-col">
                                                <div className="earn-borrowed-amount-display">{vault.totalSupply.replace('$', ' ')}</div>
                                                <div className="earn-borrowed-value">{vault.totalBorrowed}</div>
                                            </div>
                                            <div className="earn-col earn-borrowed-ltv">90%</div>
                                            <div className="earn-col earn-supply-apy-col">
                                                <div className="earn-supply-apy-value"> {vault.supplyApy}%</div>
                                            </div>

                                            <div className="earn-col earn-borrow-apy-col">
                                                <div className="earn-borrow-apy-value">{vault.borrowApy}%</div>
                                            </div>
                                            <div className="earn-col earn-actions-col">
                                                <div className="earn-action-buttons">
                                                    <button
                                                        className="earn-supply-button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            showEarnVaultDetailWithMode(vault.id, 'supply');
                                                        }}
                                                    >
                                                        Supply
                                                    </button>
                                                    <button
                                                        className="earn-borrow-button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            showEarnVaultDetailWithMode(vault.id, 'borrow');
                                                        }}
                                                    >
                                                        Borrow
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="earn-detail-view">
                            <div className="earn-detail-header">
                                <div className="earn-breadcrumb">
                                    <button className="earn-breadcrumb-back" onClick={backToEarnList}>
                                        <span>Vaults</span>
                                    </button>
                                    <ChevronLeft size={16} className="earn-breadcrumb-arrow" />
                                    <span className="earn-breadcrumb-current">{earnSelectedVaultData?.name}</span>
                                </div>
                            </div>

                            {earnSelectedVaultData && (
                                <>
                                    <div className="earn-detail-top">
                                        <div className="earn-detail-asset">
                                            <div className="earn-detail-token-pair">
                                                <img
                                                    src={earnSelectedVaultData.tokens.first.icon}
                                                    alt={earnSelectedVaultData.tokens.first.symbol}
                                                    className="earn-detail-token-icon earn-first-token"
                                                />
                                            </div>
                                            <div>
                                                <h2 className="earn-detail-name">{earnSelectedVaultData.tokens.first.symbol}</h2>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="earn-detail-content">
                                        <div className="earn-detail-summary">
                                            <div className="earn-detail-description">
                                                <h4>About {earnSelectedVaultData.name}</h4>
                                                <p>{earnSelectedVaultData.description}
                                                    <a href="#" className="earn-learn-more">
                                                        Learn more
                                                    </a></p>
                                            </div>
                                            <div className="earn-detail-stats">
                                                <div className="earn-detail-stat">
                                                    <span className="earn-stat-label">APY</span>
                                                    <span className="earn-stat-value">{earnSelectedVaultData.apy}%</span>
                                                </div>
                                                <div className="earn-detail-stat">
                                                    <span className="earn-stat-label">Liquidity</span>
                                                    <span className="earn-stat-value">{earnSelectedVaultData.tvl}</span>
                                                </div>
                                                <div className="earn-detail-stat">
                                                    <span className="earn-stat-label">Daily Yield</span>
                                                    <span className="earn-stat-value">{earnSelectedVaultData.dailyYield}</span>
                                                </div>
                                                <div className="earn-detail-stat">
                                                    <span className="earn-stat-label">Supply APY</span>
                                                    <span className="earn-stat-value">{earnSelectedVaultData.supplyApy}%</span>
                                                </div>
                                                <div className="earn-detail-stat">
                                                    <span className="earn-stat-label">Borrow APY</span>
                                                    <span className="earn-stat-value">{earnSelectedVaultData.borrowApy}%</span>
                                                </div>
                                            </div>
                                            <div className="earn-chart-toggle-section">
                                                <button
                                                    className={`earn-chart-toggle-btn ${earnChartView === 'overview' ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setEarnChartView('overview');
                                                        setUserHasPositions(false);
                                                        setEarnActiveMode('supply');
                                                    }}
                                                >
                                                    Overview
                                                </button>
                                                <button
                                                    className={`earn-chart-toggle-btn ${earnChartView === 'positions' ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setEarnChartView('positions');
                                                        if (earnSelectedVaultData) {
                                                            const hasPositions = checkUserHasPositions(earnSelectedVaultData);
                                                            setUserHasPositions(hasPositions);
                                                            setEarnActiveMode(hasPositions ? 'withdraw' : 'supply');
                                                        }
                                                    }}
                                                >
                                                    Your Positions
                                                </button>
                                            </div>
                                            {earnChartView === 'overview' ? (
                                                <div className="earn-charts-wrapper">
                                                    <div className="earn-chart-container">
                                                        <div className="earn-chart-header">
                                                            <div className="earn-chart-left">
                                                                <h4 className="earn-chart-title">
                                                                    Total Deposits ({chartCurrency})
                                                                </h4>
                                                                <div className="earn-chart-value">$275.51M</div>
                                                            </div>
                                                            <div className="earn-chart-right">
                                                                <div className="earn-chart-controls">
                                                                    <div className="earn-chart-toggle">
                                                                        <button
                                                                            className={`earn-chart-toggle-btn ${chartCurrency === earnSelectedVaultData.tokens.first.symbol ? 'active' : ''}`}
                                                                            onClick={() => setChartCurrency(earnSelectedVaultData.tokens.first.symbol)}
                                                                        >
                                                                            {earnSelectedVaultData.tokens.first.symbol}
                                                                        </button>
                                                                        <button
                                                                            className={`earn-chart-toggle-btn ${chartCurrency === 'USDC' ? 'active' : ''}`}
                                                                            onClick={() => setChartCurrency('USDC')}
                                                                        >
                                                                            USDC
                                                                        </button>
                                                                    </div>
                                                                    <div className="earn-chart-dropdown" ref={dropdownRef}>
                                                                        <button
                                                                            className="earn-chart-dropdown-trigger"
                                                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                                        >
                                                                            {chartPeriod}
                                                                            <ChevronDown size={16} className={`earn-dropdown-icon ${isDropdownOpen ? 'open' : ''}`} />
                                                                        </button>
                                                                        {isDropdownOpen && (
                                                                            <div className="earn-chart-dropdown-menu">
                                                                                {['3 months', '6 months', '1 year'].map((period) => (
                                                                                    <button
                                                                                        key={period}
                                                                                        className={`earn-chart-dropdown-item ${chartPeriod === period ? 'active' : ''}`}
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
                                                        <div className="earn-chart-wrapper">
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
                                                    <div className="earn-chart-container">
                                                        <div className="earn-chart-header">
                                                            <div className="earn-chart-left">
                                                                <h4 className="earn-chart-title">
                                                                    APY Performance
                                                                </h4>
                                                                <div className="earn-chart-value">{earnSelectedVaultData.apy}%</div>
                                                            </div>
                                                            <div className="earn-chart-right">
                                                                <div className="earn-chart-controls">
                                                                    <div className="earn-chart-dropdown" ref={apyDropdownRef}>
                                                                        <button
                                                                            className="earn-chart-dropdown-trigger"
                                                                            onClick={() => setIsApyDropdownOpen(!isApyDropdownOpen)}
                                                                        >
                                                                            {apyChartPeriod}
                                                                            <ChevronDown size={16} className={`earn-dropdown-icon ${isApyDropdownOpen ? 'open' : ''}`} />
                                                                        </button>
                                                                        {isApyDropdownOpen && (
                                                                            <div className="earn-chart-dropdown-menu">
                                                                                {['30 days', '7 days', '90 days'].map((period) => (
                                                                                    <button
                                                                                        key={period}
                                                                                        className={`earn-chart-dropdown-item ${apyChartPeriod === period ? 'active' : ''}`}
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
                                                        <div className="earn-chart-wrapper">
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
                                                <div className="earn-charts-wrapper">
                                                    <div className="earn-chart-container">
                                                        <div className="earn-chart-header">
                                                            <div className="earn-chart-left">
                                                                <h4 className="earn-chart-title">Your Positions</h4>
                                                                <div className="earn-chart-value">$12,345.67</div>
                                                            </div>
                                                        </div>
                                                        <div className="earn-chart-wrapper">
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

                                        <div className="earn-deposit-section">
                                            <div className="earn-deposit-menu-container">
                                                <div className="earn-mode-toggle">
                                                    <button
                                                        onClick={() => setEarnActiveMode(userHasPositions ? 'withdraw' : 'supply')}
                                                        className={`earn-mode-toggle-btn ${(earnActiveMode === 'supply' || earnActiveMode === 'withdraw') ? 'active' : ''}`}
                                                    >
                                                        {userHasPositions ? 'Withdraw' : 'Supply'}
                                                    </button>
                                                    <button
                                                        onClick={() => setEarnActiveMode(userHasPositions ? 'repay' : 'borrow')}
                                                        className={`earn-mode-toggle-btn ${(earnActiveMode === 'borrow' || earnActiveMode === 'repay') ? 'active' : ''}`}
                                                    >
                                                        {userHasPositions ? 'Repay' : 'Borrow'}
                                                    </button>
                                                </div>

                                                {earnActiveMode === 'supply' && (
                                                    <div className={`earn-collateral-input-card ${supplyExceedsBalance ? 'exceed-balance' : ''}`}>
                                                        <div className="earn-collateral-header">
                                                            <span className="earn-collateral-label">Deposit {earnSelectedVaultData.tokens.first.symbol}</span>
                                                            <div className="earn-token-balance">
                                                                <img
                                                                    src={walleticon}
                                                                    alt="wallet"
                                                                    className="earn-wallet-icon"
                                                                />
                                                                <span className="earn-balance-text">
                                                                    {getFormattedBalance(earnSelectedVaultData.tokens.first.symbol)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="earn-token-amount-row">
                                                            <input
                                                                type="text"
                                                                className={`earn-token-amount-input ${collateralExceedsBalance ? 'exceed-balance' : ''}`}
                                                                value={earnCollateralAmount}
                                                                onChange={(e) => handleEarnCollateralAmountChangeWithValidation(e.target.value)}
                                                                placeholder="0.00"
                                                                disabled={!earnSelectedCollateral}
                                                            />
                                                        </div>

                                                        <div className="earn-token-input-bottom-row">
                                                            <div className={`earn-token-usd-value ${supplyExceedsBalance ? 'exceed-balance' : ''}`}>
                                                                {getInputUSDValue(
                                                                    earnSelectedVaultData.tokens.first.symbol,
                                                                    earnCollateralAmount,  
                                                                    tradesByMarket,
                                                                    markets,
                                                                )}
                                                            </div>

                                                            <div className="earn-amount-buttons">
                                                                <button
                                                                    className={`earn-fifty-button ${supplyExceedsBalance ? 'exceed-balance' : ''}`}
                                                                    onClick={() => {
                                                                        if (connected && address && earnSelectedVaultData) {
                                                                            const balance = getTokenBalance(earnSelectedVaultData.tokens.first.symbol);
                                                                            const tokenData = earnAvailableTokens.find(t => t.symbol === earnSelectedVaultData.tokens.first.symbol);

                                                                            if (tokenData && tokendict[tokenData.address] && balance != BigInt(0)) {
                                                                                const decimals = Number(tokendict[tokenData.address].decimals);

                                                                                let amount = balance;
                                                                                if (earnSelectedVaultData.tokens.first.symbol === 'ETH') {
                                                                                    amount = balance - settings.chainConfig[chainId].gasamount > BigInt(0)
                                                                                        ? balance - settings.chainConfig[chainId].gasamount
                                                                                        : BigInt(0);
                                                                                }

                                                                                const fiftyPercentAmount = amount / BigInt(2);

                                                                                const formattedAmount = customRound(
                                                                                    Number(fiftyPercentAmount) / 10 ** decimals,
                                                                                    3
                                                                                ).toString();

                                                                                handleEarnCollateralAmountChangeWithValidation(formattedAmount);
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    50%
                                                                </button>
                                                                <button
                                                                    className={`earn-max-button ${supplyExceedsBalance ? 'exceed-balance' : ''}`}
                                                                    onClick={handleSupplyMaxClick}
                                                                >
                                                                    MAX
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {supplyExceedsBalance && (
                                                            <div className="earn-exceeded-balance-warning">
                                                                <div className="earn-exceeded-balance-warning-text">
                                                                    {getSupplyErrorMessage(earnSelectedVaultData.tokens.first.symbol)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {earnActiveMode === 'withdraw' && (
                                                    <div className={`earn-collateral-input-card ${supplyExceedsBalance ? 'exceed-balance' : ''}`}>
                                                        <div className="earn-collateral-header">
                                                            <span className="earn-collateral-label">Withdraw {earnSelectedVaultData.tokens.first.symbol}</span>
                                                            <div className="earn-token-balance">
                                                                <span className="earn-balance-text">
                                                                    Deposited: {earnSelectedVaultData.userBalance}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="earn-token-amount-row">
                                                            <input
                                                                type="text"
                                                                className={`earn-token-amount-input ${supplyExceedsBalance ? 'exceed-balance' : ''}`}
                                                                value={earnTokenAmounts[earnSelectedVaultData.tokens.first.symbol] || ''}
                                                                onChange={(e) => handleEarnTokenAmountChangeWithValidation(earnSelectedVaultData.tokens.first.symbol, e.target.value)}
                                                                placeholder="0.00"
                                                            />
                                                        </div>

                                                        <div className="earn-token-input-bottom-row">
                                                            <div className={`earn-token-usd-value ${supplyExceedsBalance ? 'exceed-balance' : ''}`}>
                                                                {getInputUSDValue(
                                                                    earnSelectedVaultData.tokens.first.symbol,
                                                                    earnTokenAmounts[earnSelectedVaultData.tokens.first.symbol] || '',
                                                                    tradesByMarket,
                                                                    markets,
                                                                )}
                                                            </div>

                                                            <div className="earn-amount-buttons">
                                                                <button
                                                                    className={`earn-fifty-button ${supplyExceedsBalance ? 'exceed-balance' : ''}`}
                                                                    onClick={() => {
                                                                        const userBalance = parseFloat(earnSelectedVaultData.userBalance);
                                                                        const fiftyPercent = (userBalance / 2).toString();
                                                                        handleEarnTokenAmountChangeWithValidation(earnSelectedVaultData.tokens.first.symbol, fiftyPercent);
                                                                    }}
                                                                >
                                                                    50%
                                                                </button>
                                                                <button
                                                                    className={`earn-max-button ${supplyExceedsBalance ? 'exceed-balance' : ''}`}
                                                                    onClick={() => {
                                                                        handleEarnTokenAmountChangeWithValidation(earnSelectedVaultData.tokens.first.symbol, earnSelectedVaultData.userBalance);
                                                                    }}
                                                                >
                                                                    MAX
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {supplyExceedsBalance && (
                                                            <div className="earn-exceeded-balance-warning">
                                                                <div className="earn-exceeded-balance-warning-text">
                                                                    Cannot withdraw more than deposited amount. You have {earnSelectedVaultData.userBalance} {earnSelectedVaultData.tokens.first.symbol} deposited.
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {earnActiveMode === 'borrow' && (
                                                    <div className={`earn-collateral-input-card ${collateralExceedsBalance ? 'exceed-balance' : ''}`}>
                                                        <div className="earn-collateral-header">
                                                            <span className="earn-collateral-label">Supply Collateral</span>
                                                            <div className="earn-wallet-balance">
                                                                <img
                                                                    src={walleticon}
                                                                    alt="wallet"
                                                                    className="earn-wallet-icon"
                                                                    style={{ width: '16px', height: '16px' }}
                                                                />
                                                                <span className="earn-balance-text">
                                                                    {earnSelectedCollateral ? getFormattedBalance(earnSelectedCollateral.symbol) : '0'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="earn-token-amount-row">
                                                            <input
                                                                type="text"
                                                                className={`earn-token-amount-input ${collateralExceedsBalance ? 'exceed-balance' : ''}`}
                                                                value={earnCollateralAmount}
                                                                onChange={(e) => handleEarnCollateralAmountChangeWithValidation(e.target.value)}
                                                                placeholder="0.00"
                                                                disabled={!earnSelectedCollateral}
                                                            />
                                                            <button
                                                                className={`earn-collateral-selector-btn ${collateralExceedsBalance ? 'exceed-balance' : ''}`}
                                                                onClick={() => {
                                                                    setpopup(1);
                                                                }}
                                                            >
                                                                {earnSelectedCollateral ? (
                                                                    <>
                                                                        <img
                                                                            src={earnSelectedCollateral.icon}
                                                                            alt={earnSelectedCollateral.symbol}
                                                                            className="earn-collateral-token-icon"
                                                                            style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                                                                        />
                                                                        <span className="earn-collateral-symbol">{earnSelectedCollateral.symbol}</span>
                                                                        <ChevronDown size={16} className="earn-collateral-dropdown-icon" />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="earn-collateral-placeholder">USDC</span>
                                                                        <ChevronDown size={16} className="earn-collateral-dropdown-icon" />
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>

                                                        <div className="earn-token-input-bottom-row">
                                                            <div className={`earn-token-usd-value ${collateralExceedsBalance ? 'exceed-balance' : ''}`}>
                                                                {earnSelectedCollateral ? getInputUSDValue(
                                                                    earnSelectedCollateral.symbol,
                                                                    earnCollateralAmount,
                                                                    tradesByMarket,
                                                                    markets,
                                                                ) : '$0.00'}
                                                            </div>
                                                            <div className="earn-amount-buttons">
                                                                <button
                                                                    className={`earn-fifty-button ${collateralExceedsBalance ? 'exceed-balance' : ''}`}
                                                                    disabled={!earnSelectedCollateral}
                                                                    onClick={() => {
                                                                        if (connected && address && earnSelectedCollateral) {
                                                                            const balance = getTokenBalance(earnSelectedCollateral.symbol);
                                                                            const tokenData = earnAvailableTokens.find(t => t.symbol === earnSelectedCollateral.symbol);

                                                                            if (tokenData && tokendict[tokenData.address] && balance != BigInt(0)) {
                                                                                const decimals = Number(tokendict[tokenData.address].decimals);

                                                                                let amount = balance;
                                                                                if (earnSelectedCollateral.symbol === 'ETH') {
                                                                                    amount = balance - settings.chainConfig[chainId].gasamount > BigInt(0)
                                                                                        ? balance - settings.chainConfig[chainId].gasamount
                                                                                        : BigInt(0);
                                                                                }

                                                                                const fiftyPercentAmount = amount / BigInt(2);

                                                                                const formattedAmount = customRound(
                                                                                    Number(fiftyPercentAmount) / 10 ** decimals,
                                                                                    3
                                                                                ).toString();

                                                                                handleEarnCollateralAmountChangeWithValidation(formattedAmount);
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    50%
                                                                </button>
                                                                <button
                                                                    className={`earn-max-button ${collateralExceedsBalance ? 'exceed-balance' : ''}`}
                                                                    disabled={!earnSelectedCollateral}
                                                                    onClick={handleCollateralMaxClick}
                                                                >
                                                                    MAX
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {collateralExceedsBalance && (
                                                            <div className="earn-exceeded-balance-warning">
                                                                <div className="earn-exceeded-balance-warning-text">
                                                                    {getCollateralErrorMessage()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {earnActiveMode === 'borrow' && (
                                                    <div className="earn-collateral-input-card">
                                                        <div className="earn-collateral-header">
                                                            <span className="earn-collateral-label">Borrow {earnSelectedVaultData.tokens.first.symbol}</span>
                                                            <div className="earn-token-balance">
                                                                <img
                                                                    src={walleticon}
                                                                    alt="wallet"
                                                                    className="earn-wallet-icon"
                                                                />
                                                                <span className="earn-balance-text">
                                                                    {getFormattedBalance(earnSelectedVaultData.tokens.first.symbol)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="earn-token-amount-row">
                                                            <input
                                                                type="text"
                                                                value={earnBorrowAmount}
                                                                onChange={(e) => handleEarnBorrowAmountChange(e.target.value)}
                                                                placeholder="0.00"
                                                                className="earn-token-amount-input"
                                                            />
                                                        </div>

                                                        <div className="earn-token-input-bottom-row">
                                                            <div className="earn-token-usd-value">
                                                                {getInputUSDValue(
                                                                    earnSelectedVaultData.tokens.first.symbol,
                                                                    earnBorrowAmount,
                                                                    tradesByMarket,
                                                                    markets,
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {earnActiveMode === 'borrow' && (
                                                    <div className="earn-ltv-container">
                                                        <div className="earn-ltv-header">
                                                            <div className="earn-ltv-content">
                                                                <span className="earn-ltv-title">Loan to Value (LTV)</span>
                                                                <div className="earn-ltv-description">
                                                                    Ratio of the collateral value to the borrowed value
                                                                </div>
                                                            </div>

                                                            <div className="earn-ltv-values">
                                                                <div className="earn-ltv-current">{Math.min(earnLtvValue, 90).toFixed(2)}%</div>
                                                                <div className="earn-ltv-max">max. 90.00%</div>
                                                            </div>
                                                        </div>

                                                        <div className="earn-slider-container">
                                                            <div className="earn-slider-track">
                                                                <div
                                                                    className="earn-slider-progress"
                                                                    style={{
                                                                        width: `${earnLtvValue}%`,
                                                                        backgroundColor: getEarnSliderColor(earnLtvValue)
                                                                    }}
                                                                />
                                                                <div className="earn-liquidation-line" />
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                value={earnLtvValue}
                                                                onChange={(e) => {
                                                                    const sliderValue = parseFloat(e.target.value);
                                                                    const maxSliderPosition = 90;
                                                                    const actualValue = Math.min(sliderValue, maxSliderPosition);
                                                                    handleEarnLtvChange(actualValue);
                                                                }}
                                                                className="earn-slider-input"
                                                            />
                                                            <div
                                                                className="earn-slider-handle"
                                                                style={{
                                                                    left: `calc(${earnLtvValue}% - 8px)`,
                                                                    backgroundColor: getEarnSliderColor(earnLtvValue)
                                                                }}
                                                            />
                                                        </div>

                                                        <div className="earn-risk-labels">
                                                            <span>Conservative</span>
                                                            <span>Moderate</span>
                                                            <span>Aggressive</span>
                                                            <span className="earn-liquidation-label">Liquidation</span>
                                                        </div>
                                                        {attemptedExceedLimit && (
                                                            <div className="earn-warning-box">
                                                                <div className="earn-warning-text">
                                                                    Insufficient Collateral: Not enough collateral to borrow this amount. Maximum LTV is 90%. Add more collateral or reduce borrow amount.
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {earnActiveMode === 'repay' && (
                                                    <>
                                                        <div className="earn-repay-section">
                                                            <div className="earn-repay-amount-section">
                                                                <div className="earn-collateral-header">
                                                                    <span className="earn-collateral-label">Amount</span>
                                                                    <div className="earn-token-balance">
                                                                        <img
                                                                            src={walleticon}
                                                                            alt="wallet"
                                                                            className="earn-wallet-icon"
                                                                        />
                                                                        <span className="earn-balance-text">
                                                                            {getFormattedBalance(earnSelectedVaultData.tokens.first.symbol)}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="earn-repay-input-container">
                                                                    <input
                                                                        type="text"
                                                                        className="earn-repay-amount-input"
                                                                        value={earnBorrowAmount}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            const borrowedAmount = 1234.56;

                                                                            if (value === '' || parseFloat(value) <= borrowedAmount) {
                                                                                setEarnBorrowAmount(value);
                                                                            }
                                                                        }}
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>

                                                                <div className="earn-repay-input-footer">
                                                                    <div className="earn-token-usd-value">
                                                                        {getInputUSDValue(
                                                                            earnSelectedVaultData.tokens.first.symbol,
                                                                            earnBorrowAmount,
                                                                            tradesByMarket,
                                                                            markets,
                                                                        )}
                                                                    </div>
                                                                    <div className="earn-repay-balance-info">
                                                                        <button
                                                                            className="earn-repay-fifty-button"
                                                                            onClick={() => setEarnBorrowAmount("617.28")}
                                                                        >
                                                                            50%
                                                                        </button>
                                                                        <button
                                                                            className="earn-repay-max-button"
                                                                            onClick={() => setEarnBorrowAmount("1234.56")}
                                                                        >
                                                                            MAX
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {(() => {
                                                                    const borrowedAmount = 1234.56;
                                                                    const repayAmount = parseFloat(earnBorrowAmount || '0');

                                                                    return repayAmount > borrowedAmount && repayAmount > 0 ? (
                                                                        <div className="earn-repay-error">
                                                                            Cannot repay more than borrowed amount. Maximum repayable: {borrowedAmount} {earnSelectedVaultData.tokens.first.symbol}
                                                                        </div>
                                                                    ) : null;
                                                                })()}
                                                            </div>
                                                            <div className="earn-repay-overview-section">

                                                                <div className="earn-repay-overview-item">
                                                                    <div className="earn-repay-overview-row">
                                                                        <span className="earn-repay-overview-label">Remaining debt</span>
                                                                        <div className="earn-repay-overview-values">
                                                                            <div className="earn-repay-overview-main">
                                                                                {(() => {
                                                                                    const borrowed = 1234.56;
                                                                                    const repaying = parseFloat(earnBorrowAmount || '0');
                                                                                    const remaining = Math.max(0, borrowed - repaying);
                                                                                    return `${borrowed.toFixed(2)} ${earnSelectedVaultData.tokens.first.symbol} → ${remaining.toFixed(2)} ${earnSelectedVaultData.tokens.first.symbol}`;
                                                                                })()}
                                                                            </div>
                                                                            <div className="earn-repay-overview-sub">
                                                                                {(() => {
                                                                                    const currentUSD = getInputUSDValue(
                                                                                        earnSelectedVaultData.tokens.first.symbol,
                                                                                        "1234.56",
                                                                                        tradesByMarket,
                                                                                        markets,
                                                                                    );
                                                                                    const borrowed = 1234.56;
                                                                                    const repaying = parseFloat(earnBorrowAmount || '0');
                                                                                    const remaining = Math.max(0, borrowed - repaying);
                                                                                    const remainingUSD = getInputUSDValue(
                                                                                        earnSelectedVaultData.tokens.first.symbol,
                                                                                        remaining.toString(),
                                                                                        tradesByMarket,
                                                                                        markets,
                                                                                    );
                                                                                    return `${currentUSD} → ${remainingUSD}`;
                                                                                })()}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="earn-repay-overview-item">
                                                                    <div className="earn-repay-overview-row">
                                                                        <span className="earn-repay-overview-label">Health factor</span>
                                                                        <div className="earn-repay-overview-values">
                                                                            <div className="earn-repay-overview-main">
                                                                                {(() => {
                                                                                    const repaying = parseFloat(earnBorrowAmount || '0');
                                                                                    const currentHealth = 1.08;
                                                                                    const newHealth = repaying > 0 ? Math.min(currentHealth + (repaying / 1234.56) * 2, 99.99) : currentHealth;

                                                                                    return (
                                                                                        <>
                                                                                            <span className={currentHealth < 1.2 ? "earn-repay-health-bad" : "earn-repay-health-current"}>
                                                                                                {currentHealth.toFixed(2)}
                                                                                            </span>
                                                                                            {" → "}
                                                                                            <span className={newHealth > 1.5 ? "earn-repay-health-good" : "earn-repay-health-new"}>
                                                                                                {newHealth.toFixed(2)}
                                                                                            </span>
                                                                                        </>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                            <div className="earn-repay-overview-sub">Liquidation at &lt;1.0</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {earnActiveMode === 'supply' && (
                                                    <div className="earn-token-details-item">
                                                        <div className="earn-deposit-total-row">
                                                            <div className="earn-deposit-total-label">Total Amount</div>
                                                            <div className="earn-deposit-total-value">
                                                                {getInputUSDValue(
                                                                    earnSelectedVaultData.tokens.first.symbol,
                                                                    earnCollateralAmount,
                                                                    tradesByMarket,
                                                                    markets,
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="earn-deposit-total-row">
                                                            <span className="earn-deposit-total-label">APY</span>
                                                            <span className="earn-deposit-total-value">
                                                                {earnSelectedVaultData.supplyApy}%
                                                            </span>
                                                        </div>
                                                        <div className="earn-deposit-total-row">
                                                            <span className="earn-deposit-total-label">Projected Earnings / Month (USD)</span>
                                                            <span className="earn-deposit-total-value">
                                                                ${(() => {
                                                                    const tokenAmount = earnCollateralAmount;
                                                                    if (!tokenAmount || tokenAmount === '0') return '0.00';
                                                                    const tokenEntry = Object.values(chainTokenDict).find((token: any) => token.ticker === earnSelectedVaultData.tokens.first.symbol) as any;
                                                                    if (!tokenEntry) return '0.00';
                                                                    const decimals = Number(tokenEntry.decimals);
                                                                    const amountBigInt = BigInt(Math.floor(parseFloat(tokenAmount) * (10 ** decimals)));

                                                                    let market = null;
                                                                    let trades = null;
                                                                    const directUSDCKeys = [`${earnSelectedVaultData.tokens.first.symbol}USDC`];
                                                                    for (const key of directUSDCKeys) {
                                                                        if (chainMarkets[key] && tradesByMarket[key]) {
                                                                            market = chainMarkets[key];
                                                                            trades = tradesByMarket[key];
                                                                            break;
                                                                        }
                                                                    }
                                                                    if (!market && earnSelectedVaultData.tokens.first.symbol === 'MON') {
                                                                        market = chainMarkets['MONUSDC'];
                                                                        trades = tradesByMarket['MONUSDC'];
                                                                    }
                                                                    if (!market || !trades) return '0.00';

                                                                    const rawUsdValue = calculateUSDValue(amountBigInt, trades, tokenEntry.address, market, tradesByMarket, chainMarkets, usdc);
                                                                    const apy = earnSelectedVaultData.supplyApy;
                                                                    const monthlyEarnings = (rawUsdValue * (apy / 100)) / 12;
                                                                    return monthlyEarnings.toFixed(2);
                                                                })()}
                                                            </span>
                                                        </div>

                                                        <div className="earn-deposit-total-row">
                                                            <span className="earn-deposit-total-label">Projected Earnings / Year (USD)</span>
                                                            <span className="earn-deposit-total-value">
                                                                ${(() => {
                                                                    const tokenAmount = earnCollateralAmount;  
                                                                    if (!tokenAmount || tokenAmount === '0') return '0.00';
                                                                    const tokenEntry = Object.values(chainTokenDict).find((token: any) => token.ticker === earnSelectedVaultData.tokens.first.symbol) as any;
                                                                    if (!tokenEntry) return '0.00';
                                                                    const decimals = Number(tokenEntry.decimals);
                                                                    const amountBigInt = BigInt(Math.floor(parseFloat(tokenAmount) * (10 ** decimals)));

                                                                    let market = null;
                                                                    let trades = null;
                                                                    const directUSDCKeys = [`${earnSelectedVaultData.tokens.first.symbol}USDC`];
                                                                    for (const key of directUSDCKeys) {
                                                                        if (chainMarkets[key] && tradesByMarket[key]) {
                                                                            market = chainMarkets[key];
                                                                            trades = tradesByMarket[key];
                                                                            break;
                                                                        }
                                                                    }
                                                                    if (!market && earnSelectedVaultData.tokens.first.symbol === 'MON') {
                                                                        market = chainMarkets['MONUSDC'];
                                                                        trades = tradesByMarket['MONUSDC'];
                                                                    }
                                                                    if (!market || !trades) return '0.00';

                                                                    const rawUsdValue = calculateUSDValue(amountBigInt, trades, tokenEntry.address, market, tradesByMarket, chainMarkets, usdc);
                                                                    const apy = earnSelectedVaultData.supplyApy;
                                                                    const yearlyEarnings = rawUsdValue * (apy / 100);
                                                                    return yearlyEarnings.toFixed(2);
                                                                })()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {earnActiveMode === 'withdraw' && (
                                                    <div className="earn-token-details-item">
                                                        <div className="earn-deposit-total-row">
                                                            <div className="earn-deposit-total-label">Withdrawal Amount</div>
                                                            <div className="earn-deposit-total-value">
                                                                {getInputUSDValue(
                                                                    earnSelectedVaultData.tokens.first.symbol,
                                                                    earnTokenAmounts[earnSelectedVaultData.tokens.first.symbol] || '',
                                                                    tradesByMarket,
                                                                    markets,
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="earn-deposit-total-row">
                                                            <span className="earn-deposit-total-label">Current Position</span>
                                                            <span className="earn-deposit-total-value">
                                                                {earnSelectedVaultData.userBalance} {earnSelectedVaultData.tokens.first.symbol}
                                                            </span>
                                                        </div>
                                                        <div className="earn-deposit-total-row">
                                                            <span className="earn-deposit-total-label">Remaining After Withdrawal</span>
                                                            <span className="earn-deposit-total-value">
                                                                {(() => {
                                                                    const currentBalance = parseFloat(earnSelectedVaultData.userBalance);
                                                                    const withdrawAmount = parseFloat(earnTokenAmounts[earnSelectedVaultData.tokens.first.symbol] || '0');
                                                                    const remaining = currentBalance - withdrawAmount;
                                                                    return `${remaining >= 0 ? remaining.toFixed(2) : '0.00'} ${earnSelectedVaultData.tokens.first.symbol}`;
                                                                })()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                <button
                                                    className={`earn-connect-button ${isActionButtonDisabled() ? (earnActiveMode === 'supply' && supplyExceedsBalance ? 'exceed-balance' : 'disabled') : ''}`}
                                                    disabled={isActionButtonDisabled() || isSigning}
                                                    onClick={async () => {
                                                        if (!connected) {
                                                            setpopup(4);
                                                            return;
                                                        }

                                                        if (isActionButtonDisabled()) {
                                                            return;
                                                        }

                                                        if (!lendingAddress) {
                                                            console.error('Lending address not set');
                                                            return;
                                                        }

                                                        const tokenAddress = earnSelectedVaultData?.tokens.first.symbol === 'ETH'
                                                            ? wethticker 
                                                            : earnAvailableTokens.find(t => t.symbol === earnSelectedVaultData?.tokens.first.symbol)?.address;

                                                        if (!tokenAddress || !earnSelectedVaultData) return;

                                                        let success = false;

                                                        switch (earnActiveMode) {
                                                            case 'supply':
                                                                success = await handleSupply(tokenAddress as `0x${string}`, earnCollateralAmount);
                                                                break;
                                                            case 'withdraw':
                                                                success = await handleWithdraw(tokenAddress as `0x${string}`, earnTokenAmounts[earnSelectedVaultData.tokens.first.symbol] || '');
                                                                break;
                                                            case 'borrow':
                                                                if (earnSelectedCollateral) {
                                                                    const collateralAddress = earnSelectedCollateral.symbol === 'ETH'
                                                                        ? wethticker
                                                                        : earnSelectedCollateral.address;
                                                                    const supplySuccess = await handleSupply(collateralAddress as `0x${string}`, earnCollateralAmount);
                                                                    if (supplySuccess) {
                                                                        success = await handleBorrow(tokenAddress as `0x${string}`, earnBorrowAmount);
                                                                    }
                                                                }
                                                                break;
                                                            case 'repay':
                                                                success = await handleRepay(tokenAddress as `0x${string}`, earnBorrowAmount);
                                                                break;
                                                        }

                                                        if (success) {
                                                            setEarnCollateralAmount('');
                                                            setEarnBorrowAmount('');
                                                            setEarnLtvValue(0);
                                                            setEarnTokenAmounts({});
                                                        }
                                                    }}
                                                >
                                                    {isSigning ? (
                                                        <>
                                                            <div className="loading-spinner"></div>
                                                            Signing...
                                                        </>
                                                    ) : (
                                                        getActionButtonText()
                                                    )}
                                                </button>
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

export default EarnVaults;