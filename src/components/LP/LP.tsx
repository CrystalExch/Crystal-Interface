import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUpRight, ChevronDown, ChevronLeft, Plus, Search, Star, X } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { encodeFunctionData } from "viem";
import { MaxUint256 } from "ethers";
import { useSharedContext } from '../../contexts/SharedContext';
import { fetchLatestPrice } from '../../utils/getPrice.ts';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi';
import { settings } from "../../settings";
import './LP.css';

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
  setChain,
  address,
  refetch,
}) => {
  const { activechain } = useSharedContext();
  
  const router = settings.chainConfig[activechain]?.router;
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
  const [vaultDepositAmounts, setVaultDepositAmounts] = useState<{ base: string, quote: string }>({
    base: '',
    quote: ''
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

  const showVaultDetail = (vault: any) => {
    setSelectedVault(vault.baseAsset + vault.quoteAsset);
    setActiveVaultDetailTab('deposit');
    setVaultDepositAmounts({ base: '', quote: '' });
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

  const filteredVaults = Object.values(markets).filter((market: any) => {
    const tokenMatch =
      selectedTokens.length === 0 ||
      selectedTokens.every(token =>
        market.quoteAsset === token.symbol ||
        market.baseAsset === token.symbol
      );

    const isDeposited = activeTab === 'deposited'
      ? parseFloat(market?.userBalance) > 0
      : true;

    let categoryMatch = true;
    if (activeFilter === 'LSTs') {
      categoryMatch = market?.category === 'LST';
    } else if (activeFilter === 'Stables') {
      categoryMatch = market?.category === 'Stable';
    } else if (activeFilter === 'Verified') {
      categoryMatch = market?.verified === true;
    } else if (activeFilter === 'Unverified') {
      categoryMatch = market?.verified === false;
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

  const handleVaultDepositAmountChange = (position: 'base' | 'quote', value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setVaultDepositAmounts(prev => ({
        ...prev,
        [position]: value
      }));

      if (value !== '' && selectedVaultData) {
        const tokenSymbol = position === 'base' ? selectedVaultData.baseAsset : selectedVaultData.quoteAsset;
        const userBalance = getTokenBalance(tokenSymbol);
        const tokenDecimals = Number(
          (Object.values(tokendict).find(t => t.ticker === tokenSymbol)?.decimals) || 18
        );
        const maxAllowedAmount = Number(userBalance) / 10 ** tokenDecimals;
        const enteredAmount = parseFloat(value);

        if (position === 'base') {
          setVaultFirstTokenExceedsBalance(enteredAmount > maxAllowedAmount);
        } else {
          setVaultSecondTokenExceedsBalance(enteredAmount > maxAllowedAmount);
        }
      } else {
        if (position === 'base') {
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
    return vaultDepositAmounts.base !== '' && vaultDepositAmounts.quote !== '' &&
      parseFloat(vaultDepositAmounts.base) > 0 && parseFloat(vaultDepositAmounts.quote) > 0 &&
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
      const amountQuoteDesired = BigInt(Math.round(parseFloat(vaultDepositAmounts.quote) * Number(10n ** tokendict[selectedVaultData?.quoteAddress]?.decimals)));
      const amountBaseDesired = BigInt(Math.round(parseFloat(vaultDepositAmounts.base) * Number(10n ** tokendict[selectedVaultData?.baseAddress]?.decimals)));
      
      // Use 95% of desired amounts as minimum (5% slippage)
      const amountQuoteMin = (amountQuoteDesired * 95n) / 100n;
      const amountBaseMin = (amountBaseDesired * 95n) / 100n;

      // Approve tokens if needed
      const firstTokenBalance = getTokenBalance(selectedVaultData.baseAsset);
      const secondTokenBalance = getTokenBalance(selectedVaultData.quoteAsset);

      if (firstTokenBalance < amountQuoteDesired) {
        const approveFirstUo = {
          target: selectedVaultData?.quoteAddress as `0x${string}`,
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
            args: [router as `0x${string}`, MaxUint256],
          }),
          value: 0n,
        };
        const approveFirstOp = await sendUserOperationAsync({ uo: approveFirstUo });
      }

      if (secondTokenBalance < amountBaseDesired) {
        const approveSecondUo = {
          target: selectedVaultData?.baseAddress as `0x${string}`,
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
            args: [router as `0x${string}`, MaxUint256],
          }),
          value: 0n,
        };
        const approveSecondOp = await sendUserOperationAsync({ uo: approveSecondUo });
      }

      // Deposit into vault
      const depositUo = {
        target: router as `0x${string}`,
        data: encodeFunctionData({
          abi: CrystalRouterAbi,
          functionName: "addLiquidity",
          args: [
            selectedVaultData.address as `0x${string}`,
            account.address,
            amountQuoteDesired,
            amountBaseDesired,
            0n,
            0n,
          ],
        }),
        value: amountBaseDesired,
      };

      const depositOp = await sendUserOperationAsync({ uo: depositUo });

      // Reset form
      setVaultDepositAmounts({ base: '', quote: '' });
      setVaultFirstTokenExceedsBalance(false);
      setVaultSecondTokenExceedsBalance(false);
      
      // Refresh balances
      refetch?.();

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
        target: router as `0x${string}`,
        data: encodeFunctionData({
          abi: CrystalRouterAbi,
          functionName: "removeLiquidity",
          args: [
            selectedVaultData.address as `0x${string}`,
            account.address,
            sharesToWithdraw,
            amountQuoteMin,
            amountBaseMin,
          ],
        }),
        value: 0n,
      };

      const withdrawOp = await sendUserOperationAsync({ uo: withdrawUo });

      // Reset form
      setWithdrawAmount('');
      setWithdrawExceedsBalance(false);
      
      // Refresh balances
      refetch?.();

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

  const selectedVaultData = selectedVault ? markets[selectedVault] : null;

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
                  onClick={() => showVaultDetail(vault)}
                >
                  <div className="lp-summary">
                    <div className="lp-col lp-asset-col">
                      <div className="lp-token-pair-icons">
                        <img
                          src={tokendict[vault.baseAddress]?.image}
                          className="lp-token-icon lp-token-icon-first"
                        />
                        <img
                          src={tokendict[vault.quoteAddress]?.image}
                          className="lp-token-icon lp-token-icon-second"
                        />
                      </div>
                      <div className="lp-asset-info">
                        <h3 className="lp-listname">{vault.baseAsset + '/' + vault.quoteAsset}</h3>
                        <div className="lp-fee-amounts">
                          <span className="lp-fee-amount">0.3%</span>
                        </div>
                        {vault?.verified && (
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
                      <div className="lp-supply-apy-value"> {vault?.supplyApy}%</div>
                    </div>

                    <div className="lp-col lp-borrowed-col">
                      <div className="lp-borrowed-value">{vault?.totalBorrowed}</div>
                    </div>

                    <div className="lp-col lp-borrow-apy-col">
                      <div className="lp-borrow-apy-value">{vault?.borrowApy}%</div>
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
                            src={tokendict[selectedVaultData.baseAddress]?.image}
                            className="lp-detail-token-icon lp-first-token"
                          />
                          <img
                            src={tokendict[selectedVaultData.quoteAddress]?.image}
                            className="lp-detail-token-icon lp-second-token"
                          />
                        </div>
                        <div>
                          <h2 className="lp-detail-name">{selectedVaultData.baseAsset + '/' + selectedVaultData.quoteAsset}</h2>
                          <div className="lp-fee-amounts-detail">
                            <span className="lp-fee-amount">0.3%</span>
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
                      <h4>About {selectedVaultData.baseAsset + '/' + selectedVaultData.quoteAsset}</h4>
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
                      <h4 className="vault-form-title">Add Liquidity to {selectedVaultData.baseAsset + '/' + selectedVaultData.quoteAsset}</h4>
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
                              value={vaultDepositAmounts.base}
                              onChange={(e) => handleVaultDepositAmountChange('base', e.target.value)}
                            />
                            <div className="deposit-token-badge">
                              <img src={tokendict[selectedVaultData.baseAddress]?.image} alt="" className="deposit-token-icon" />
                              <span>{selectedVaultData.baseAsset}</span>
                            </div>
                          </div>
                          <div className="lp-deposit-balance-wrapper">
                            <div className={`lp-deposit-usd-value ${vaultFirstTokenExceedsBalance ? 'lp-usd-value-balance-error' : ''}`}>
                              {calculateUSD(vaultDepositAmounts.base, selectedVaultData.baseAsset)}
                            </div>
                            <div className="deposit-balance">
                              Balance: {formatDisplayValue(
                                getTokenBalance(selectedVaultData.baseAsset),
                                Number(
                                  (Object.values(tokendict).find(t => t.ticker === selectedVaultData.baseAsset)?.decimals) || 18
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
                              value={vaultDepositAmounts.quote}
                              onChange={(e) => handleVaultDepositAmountChange('quote', e.target.value)}
                            />
                            <div className="deposit-token-badge">
                              <img src={tokendict[selectedVaultData.quoteAddress]?.image} alt="" className="deposit-token-icon" />
                              <span>{selectedVaultData.quoteAsset}</span>
                            </div>
                          </div>
                          <div className="lp-deposit-balance-wrapper">
                            <div className={`lp-deposit-usd-value ${vaultSecondTokenExceedsBalance ? 'lp-usd-value-balance-error' : ''}`}>
                              {calculateUSD(vaultDepositAmounts.quote, selectedVaultData.quoteAsset)}
                            </div>
                            <div className="deposit-balance">
                              Balance: {formatDisplayValue(
                                getTokenBalance(selectedVaultData.quoteAsset),
                                Number(
                                  (Object.values(tokendict).find(t => t.ticker === selectedVaultData.quoteAsset)?.decimals) || 18
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
                              const firstUSD = calculateUSD(vaultDepositAmounts.base, selectedVaultData.baseAsset);
                              const secondUSD = calculateUSD(vaultDepositAmounts.quote, selectedVaultData.quoteAsset);
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
                      <h4 className="vault-form-title">Withdraw from {selectedVaultData.baseAsset + '/' + selectedVaultData.quoteAsset}</h4>
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
                                  src={tokendict[selectedVaultData.baseAddress]?.image}
                                  alt=""
                                  className="lp-token-icon lp-token-icon-first"
                                  style={{ width: '20px', height: '20px' }}
                                />
                                <img
                                  src={tokendict[selectedVaultData.quoteAddress]?.image}
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
                              <img src={tokendict[selectedVaultData.baseAddress]?.image} alt="" className="withdraw-token-icon" />
                              <span>{selectedVaultData.baseAsset}</span>
                              <span style={{ marginLeft: 'auto', color: '#fff' }}>
                                {(parseFloat(withdrawAmount || '0') * 0.5).toFixed(4)}
                              </span>
                            </div>
                            <div className="withdraw-token-item">
                              <img src={tokendict[selectedVaultData.quoteAddress]?.image} alt="" className="withdraw-token-icon" />
                              <span>{selectedVaultData.quoteAsset}</span>
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
