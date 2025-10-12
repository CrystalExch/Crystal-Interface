import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUpRight, ChevronDown, ChevronLeft, Plus, Search, Star, X } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { encodeFunctionData } from "viem";
import { MaxUint256 } from "ethers";
import { readContracts } from '@wagmi/core';
import { useSharedContext } from '../../contexts/SharedContext';
import { fetchLatestPrice } from '../../utils/getPrice.ts';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi';
import { TokenAbi } from '../../abis/TokenAbi.ts';
import customRound from '../../utils/customRound.tsx';
import { settings } from "../../settings";
import { config } from '../../wagmi';
import './LP.css';

import verified from '../../assets/verified.png';

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
  const [withdrawPercentage, setWithdrawPercentage] = useState('');
  const [withdrawPreview, setWithdrawPreview] = useState<any>(null);

  const router = settings.chainConfig[activechain]?.router;
  const [activeTab, setActiveTab] = useState<'all' | 'deposited'>('all');
  const [hoveredVolume, setHoveredVolume] = useState<number | null>(null);
  const [hoveredTvl, setHoveredTvl] = useState<number | null>(null);
  const [selectedVault, setSelectedVault] = useState<string>('');
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
  const [vaultInputStrings, setVaultInputStrings] = useState<{ base: string, quote: string }>({
    base: '',
    quote: ''
  });
  const [vaultDepositAmounts, setVaultDepositAmounts] = useState<any>({
    shares: 0n,
    quote: 0n,
    base: 0n
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
  const [vaultList, setVaultList] = useState<any>([]);

  const selectedVaultData = selectedVault ?
    vaultList.find((vault: any) => (vault.baseAsset + vault.quoteAsset) == selectedVault) : undefined;

  const hasInitializedFavorites = useRef(false);

const [loadingVaultDetails, setLoadingVaultDetails] = useState(false);

useEffect(() => {
  if (!selectedVault) return;
  
  (async () => {
    setLoadingVaultDetails(true);
    try {
      const [vaultDetails, vaultTotalSupply, vaultUserBalance] = (await readContracts(config, {
        contracts: [
          { abi: CrystalRouterAbi as any, address: router, functionName: 'getReserves', args: [markets?.[selectedVault]?.address] },
          { abi: TokenAbi as any, address: markets?.[selectedVault]?.address, functionName: 'totalSupply', args: [] },
          ...(account.address ? [{
            abi: TokenAbi as any,
            address: markets?.[selectedVault]?.address,
            functionName: 'balanceOf',
            args: [account.address as `0x${string}`],
          }] : [])],
      })) as any[];
      if (vaultDetails?.status === "success") {
        const vaultDict = {
          ...markets?.[selectedVault],
          quoteBalance: vaultDetails.result[0],
          baseBalance: vaultDetails.result[1],
          userBalance: 0n,
          userShares: 0n,
          totalShares: vaultTotalSupply.result,
        }
        if (account.address) {
          vaultDict.userBalance = vaultUserBalance.result;
          vaultDict.userShares = vaultUserBalance.result;
        }
        setVaultList([vaultDict]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingVaultDetails(false);
    }
  })();
}, [selectedVault, account.address]);

  const showVaultDetail = (vault: any) => {
    setSelectedVault(vault.baseAsset + vault.quoteAsset);
    setActiveVaultDetailTab('deposit');
    setVaultInputStrings({ base: '', quote: '' });
    setWithdrawAmount('');
    setWithdrawPercentage('');
    setWithdrawPreview(null);
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

  const handleVaultDepositAmountChange = (type: 'quote' | 'base', value: string) => {
    if (/^\d*\.?\d{0,18}$/.test(value) && selectedVaultData) {
      const tokenData = type == 'quote' ? tokendict[selectedVaultData?.quoteAddress] : tokendict[selectedVaultData?.baseAddress];
      if (tokenData) {
        const tokenDecimals = Number(tokenData.decimals) || 18;
        const enteredAmount = parseFloat(value) || 0;

        if (type === 'quote') {
          if (selectedVaultData?.totalShares) {
            const amountBase = BigInt(Math.round(enteredAmount * 10 ** tokenDecimals)) * selectedVaultData?.baseBalance / selectedVaultData?.quoteBalance
            const a = BigInt(Math.round(enteredAmount * 10 ** tokenDecimals)) * selectedVaultData?.totalShares / selectedVaultData?.quoteBalance;
            const b = amountBase * selectedVaultData?.totalShares / selectedVaultData?.baseBalance
            const shares = a > b ? b : a
            setVaultInputStrings({
              [type]: value,
              'base': amountBase == 0n ? '' : customRound(
                Number(amountBase) /
                10 ** Number(tokendict[selectedVaultData?.baseAddress].decimals),
                3,
              ).toString()
            })
            setVaultDepositAmounts({
              shares,
              [type]: BigInt(Math.round(enteredAmount * 10 ** tokenDecimals)),
              'base': amountBase,
            });
            setVaultSecondTokenExceedsBalance(BigInt(Math.round(enteredAmount * 10 ** tokenDecimals)) > tokenBalances[tokenData.address]);
            setVaultFirstTokenExceedsBalance(amountBase > tokenBalances[selectedVaultData?.baseAddress]);
          }
          else {
            setVaultInputStrings(prev => ({
              ...prev,
              [type]: value,
            }));
            setVaultDepositAmounts((prev: any) => ({
              ...prev,
              [type]: BigInt(Math.round(enteredAmount * 10 ** tokenDecimals)),
            }));
            setVaultSecondTokenExceedsBalance(BigInt(Math.round(enteredAmount * 10 ** tokenDecimals)) > tokenBalances[tokenData.address]);
          }
        } else {
          if (selectedVaultData?.totalShares) {
            const amountQuote = BigInt(Math.round(enteredAmount * 10 ** tokenDecimals)) * selectedVaultData?.quoteBalance / selectedVaultData?.baseBalance
            const a = BigInt(Math.round(enteredAmount * 10 ** tokenDecimals)) * selectedVaultData?.totalShares / selectedVaultData?.baseBalance;
            const b = amountQuote * selectedVaultData?.totalShares / selectedVaultData?.quoteBalance
            const shares = a > b ? b : a
            setVaultInputStrings({
              [type]: value,
              'quote': amountQuote == 0n ? '' : customRound(
                Number(amountQuote) /
                10 ** Number(tokendict[selectedVaultData?.quoteAddress].decimals),
                3,
              ).toString()
            })
            setVaultDepositAmounts({
              shares,
              [type]: BigInt(Math.round(enteredAmount * 10 ** tokenDecimals)),
              'quote': amountQuote,
            });
            setVaultFirstTokenExceedsBalance(BigInt(Math.round(enteredAmount * 10 ** tokenDecimals)) > tokenBalances[tokenData.address]);
            setVaultSecondTokenExceedsBalance(amountQuote > tokenBalances[selectedVaultData?.quoteAddress]);
          }
          else {
            setVaultInputStrings(prev => ({
              ...prev,
              [type]: value,
            }));
            setVaultDepositAmounts((prev: any) => ({
              ...prev,
              [type]: BigInt(Math.round(enteredAmount * 10 ** tokenDecimals)),
            }));
            setVaultFirstTokenExceedsBalance(BigInt(Math.round(enteredAmount * 10 ** tokenDecimals)) > tokenBalances[tokenData.address]);
          }
        }
      }
    }
  };


  const isAddLiquidityEnabled = () => {
    return depositAmounts.first !== '' && depositAmounts.second !== '' &&
      parseFloat(depositAmounts.first) > 0 && parseFloat(depositAmounts.second) > 0 &&
      !firstTokenExceedsBalance && !secondTokenExceedsBalance;
  };

  const isVaultDepositEnabled = () => {
    return vaultInputStrings.base !== '' && vaultInputStrings.quote !== '' &&
      parseFloat(vaultInputStrings.base) > 0 && parseFloat(vaultInputStrings.quote) > 0 &&
      !vaultFirstTokenExceedsBalance && !vaultSecondTokenExceedsBalance;
  };

  const handleWithdrawPercentageChange = (percentage: string) => {
    let cappedPercentage = percentage;
    if(cappedPercentage !== '' && parseFloat(cappedPercentage) > 100) {
      cappedPercentage = '100';
    }
    setWithdrawPercentage(cappedPercentage);

    if (cappedPercentage === '' || !selectedVaultData) {
      if (cappedPercentage === '') {
        setWithdrawAmount('');
        setWithdrawExceedsBalance(false);
        setWithdrawPreview(null);
        return;
      }
    }

const percentageValue = parseFloat(cappedPercentage);
    if (percentageValue > 100) {
      setWithdrawExceedsBalance(true);
      setWithdrawPreview(null);
      return;
    }

    const userLPBalance = BigInt(selectedVaultData.userShares || 0);
const percentageBigInt = BigInt(Math.round(percentageValue * 100));
    const sharesToWithdraw = (userLPBalance * percentageBigInt) / 10000n;

    const totalShares = BigInt(selectedVaultData.totalShares || 0);
    const quoteBalance = BigInt(selectedVaultData.quoteBalance || 0);
    const baseBalance = BigInt(selectedVaultData.baseBalance || 0);

    if (totalShares > 0n) {
      const amountQuote = (quoteBalance * sharesToWithdraw) / totalShares;
      const amountBase = (baseBalance * sharesToWithdraw) / totalShares;

      setWithdrawAmount(sharesToWithdraw.toString());
      setWithdrawPreview({
        amountQuote,
        amountBase,
        shares: sharesToWithdraw
      });
      setWithdrawExceedsBalance(false);
    }
  };

  const isWithdrawEnabled = () => {
    return withdrawPercentage !== '' && parseFloat(withdrawPercentage) > 0 && !withdrawExceedsBalance && withdrawPreview;
  };


  const handleVaultDeposit = async () => {
    if (!selectedVaultData || !account.connected) return;

    const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) {
      setChain();
      return;
    }

    try {
      const amountQuoteDesired = BigInt(Math.round(parseFloat(vaultInputStrings.quote) * Number(10n ** tokendict[selectedVaultData?.quoteAddress]?.decimals)));
      const amountBaseDesired = BigInt(Math.round(parseFloat(vaultInputStrings.base) * Number(10n ** tokendict[selectedVaultData?.baseAddress]?.decimals)));

      if (selectedVaultData?.quoteAddress != settings.chainConfig[activechain]?.eth) {
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
        await sendUserOperationAsync({ uo: approveFirstUo });
      }

      if (selectedVaultData?.baseAddress != settings.chainConfig[activechain]?.eth) {
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
        await sendUserOperationAsync({ uo: approveSecondUo });
      }

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

      setVaultInputStrings({ base: '', quote: '' });
      setVaultFirstTokenExceedsBalance(false);
      setVaultSecondTokenExceedsBalance(false);

      refetch?.();

    } catch (e: any) {
      console.error('Vault deposit error:', e);
    }
  };

  const handleVaultWithdraw = async () => {
    if (!selectedVaultData || !account.connected || !withdrawPreview) return;

    const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) {
      setChain();
      return;
    }

    try {
      const sharesToWithdraw = withdrawPreview.shares;

      const amountQuoteMin = (withdrawPreview.amountQuote * 95n) / 100n;
      const amountBaseMin = (withdrawPreview.amountBase * 95n) / 100n;
      console.log(selectedVaultData)
      const withdrawUo = (selectedVaultData.quoteAddress == settings.chainConfig[activechain]?.eth || selectedVaultData.baseAddress == settings.chainConfig[activechain]?.eth) ? {
        target: router as `0x${string}`,
        data: encodeFunctionData({
          abi: CrystalRouterAbi,
          functionName: "removeLiquidityETH",
          args: [
            selectedVaultData.address as `0x${string}`,
            account.address,
            sharesToWithdraw,
            amountQuoteMin,
            amountBaseMin
          ],
        }),
        value: 0n,
      } : {
        target: router as `0x${string}`,
        data: encodeFunctionData({
          abi: CrystalRouterAbi,
          functionName: "removeLiquidity",
          args: [
            selectedVaultData.address as `0x${string}`,
            account.address,
            sharesToWithdraw,
            amountQuoteMin,
            amountBaseMin
          ],
        }),
        value: 0n,
      };

      const withdrawOp = await sendUserOperationAsync({ uo: withdrawUo });

      setWithdrawAmount('');
      setWithdrawPercentage('');
      setWithdrawPreview(null);
      setWithdrawExceedsBalance(false);

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
    if (withdrawExceedsBalance || (withdrawPercentage && parseFloat(withdrawPercentage) > 100)) {
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
    setSelectedVault('');
  };

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
            <div className="lp-tabs" data-active={activeTab}>
              <button
                className={`lp-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Pools
              </button>
              <button
                className={`lp-tab ${activeTab === 'deposited' ? 'active' : ''}`}
                onClick={() => setActiveTab('deposited')}
              >
                My Positions
              </button>
            </div>


          </div>
          <div className="lp-filter-search-container">
            <div className="lp-filters">
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
          <button
            className={`add-liquidity-button ${!account.connected ? 'disabled' : ''}`}
            onClick={() => {
                  if (account.connected) {
                    setShowAddLiquidity(true);
                  } else {
                    setpopup(4); 
                  }
                }}
                disabled={!account.connected}
          >
            <Plus size={16} />
            Add Liquidity
          </button>

        </div>
      )}

      <div className={`lp-rectangle ${selectedVault ? 'no-border' : ''}`}>
        {!selectedVault ? (
          <div className="lp-vaults-grid" key={selectedVault}>
            <div className="lp-vaults-list-header">
              <div className="lp-col lp-asset-col">Pool</div>
              <div className="lp-col lp-supply-col">TVL</div>
              <div className="lp-col lp-supply-apy-col">24h Volume</div>
              <div className="lp-col lp-borrowed-col">24h Fees</div>
              <div className="lp-col lp-borrow-apy-col">24h APY</div>
            </div>

            {filteredVaults.length > 0 ? (filteredVaults.map((vault) => (
              <div
                key={vault.address + vault.quoteAddress + vault.baseAddress}
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
                        <span className="lp-fee-amount">0.25%</span>
                      </div>
                      {vault?.verified && (
                        <img src={verified} alt="Verified" className="lp-verified-badge" />
                      )}
                    </div>
                  </div>

                  <div className="lp-col lp-supply-col">
                    <div className="lp-supply-value lp-supply-tooltip-wrapper">
                      <span className="lp-apy-value-text"> $7.8M </span>
                    </div>
                  </div>

                  <div className="lp-col lp-supply-apy-col">
                    <div className="lp-supply-apy-value"> $147.2M</div>
                  </div>

                  <div className="lp-col lp-borrowed-col">
                    <div className="lp-borrowed-value">$186.3K</div>
                  </div>

                  <div className="lp-col lp-borrow-apy-col">
                    <div className="lp-borrow-apy-value">{26.7}%</div>
                  </div>
                </div>

                
              </div>
            ))) : (
            <div className="no-vaults-message">
              <p>No vaults found matching your criteria.</p>
            </div>)}
          </div>
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

    {loadingVaultDetails ? (
      <div className="vault-detail-layout">
        <div className="vault-info-section">
          <div className="lp-detail-summary">
            <div className="lp-detail-top">
              <div className="lp-detail-asset">
                <div className="lp-detail-token-pair">
                  <div className="lp-skeleton lp-skeleton-icon lp-first-token"></div>
                  <div className="lp-skeleton lp-skeleton-icon lp-second-token"></div>
                </div>
                <div>
                  <div className="lp-skeleton lp-skeleton-title"></div>
                  <div className="lp-skeleton lp-skeleton-fee"></div>
                </div>
              </div>
              <div className="lp-detail-stats">
                <div className="lp-detail-stat">
                  <div className="lp-skeleton lp-skeleton-stat-label"></div>
                  <div className="lp-skeleton lp-skeleton-stat-value"></div>
                </div>
                <div className="lp-detail-stat">
                  <div className="lp-skeleton lp-skeleton-stat-label"></div>
                  <div className="lp-skeleton lp-skeleton-stat-value"></div>
                </div>
                <div className="lp-detail-stat">
                  <div className="lp-skeleton lp-skeleton-stat-label"></div>
                  <div className="lp-skeleton lp-skeleton-stat-value"></div>
                </div>
                <div className="lp-detail-stat">
                  <div className="lp-skeleton lp-skeleton-stat-label"></div>
                  <div className="lp-skeleton lp-skeleton-stat-value"></div>
                </div>
              </div>
            </div>

            <div className="lp-performance-chart-container">
              <div className="lp-skeleton lp-skeleton-chart-header"></div>
              <div className="lp-skeleton lp-skeleton-chart"></div>
            </div>
          </div>
        </div>

        <div className="vault-actions-section">
          <div className="vault-tabs">
            <div className="lp-skeleton lp-skeleton-tab"></div>
            <div className="lp-skeleton lp-skeleton-tab"></div>
          </div>

          <div className="vault-deposit-form">
            <div className="lp-skeleton lp-skeleton-form-title"></div>
            <div className="lp-skeleton lp-skeleton-form-description"></div>

            <div className="deposit-amounts-section">
              <div className="deposit-input-group">
                <div className="lp-skeleton lp-skeleton-input"></div>
              </div>
              <div className="deposit-input-group">
                <div className="lp-skeleton lp-skeleton-input"></div>
              </div>
            </div>

            <div className="deposit-summary">
              <div className="deposit-summary-row">
                <div className="lp-skeleton lp-skeleton-summary-text"></div>
                <div className="lp-skeleton lp-skeleton-summary-value"></div>
              </div>
              <div className="deposit-summary-row">
                <div className="lp-skeleton lp-skeleton-summary-text"></div>
                <div className="lp-skeleton lp-skeleton-summary-value"></div>
              </div>
            </div>

            <div className="lp-skeleton lp-skeleton-button"></div>
          </div>
        </div>
      </div>
    ) : selectedVaultData && (
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
                            <span className="lp-fee-amount">0.25%</span>
                          </div>
                        </div>
                      </div>
                      <div className="lp-detail-stats">
                        <div className="lp-detail-stat">
                          <span className="lp-stat-label">APY</span>
                          <span className="lp-stat-value">{selectedVaultData.apy}12.3%</span>
                        </div>
                        <div className="lp-detail-stat">
                          <span className="lp-stat-label">TVL</span>
                          <span className="lp-stat-value">{selectedVaultData.tvl}1.1M</span>
                        </div>
                        <div className="lp-detail-stat">
                          <span className="lp-stat-label">Daily Yield</span>
                          <span className="lp-stat-value">{selectedVaultData.dailyYield}0.05% </span>
                        </div>
                        <div className="lp-detail-stat">
                          <span className="lp-stat-label">Your Balance</span>
                          <span className="lp-stat-value">${selectedVaultData.userBalance}231.23</span>
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
                              <stop offset="0%" stopColor="#aaaecf" stopOpacity={0.4} />
                              <stop offset="50%" stopColor="#aaaecf" stopOpacity={0.1} />
                              <stop offset="100%" stopColor="#aaaecf" stopOpacity={0} />
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
                              value={vaultInputStrings.base}
                              onChange={(e) => handleVaultDepositAmountChange('base', e.target.value)}
                            />
                            <div className="deposit-token-badge">
                              <img src={tokendict[selectedVaultData.baseAddress]?.image} alt="" className="deposit-token-icon" />
                              <span>{selectedVaultData.baseAsset}</span>
                            </div>
                          </div>
                          <div className="lp-deposit-balance-wrapper">
                            <div className={`lp-deposit-usd-value ${vaultFirstTokenExceedsBalance ? 'lp-usd-value-balance-error' : ''}`}>
                              {calculateUSD(vaultInputStrings.base, selectedVaultData.baseAsset)}
                            </div>
                          <div className="deposit-balance">
                            <div className="deposit-balance-value">
                              Balance: {formatDisplayValue(
                                getTokenBalance(selectedVaultData.baseAsset),
                                Number(
                                  (Object.values(tokendict).find(t => t.ticker === selectedVaultData.baseAsset)?.decimals) || 18
                                )
                              )}
                            </div>
                            <button
                              className="vault-max-button"
                              onClick={() => {
                                const maxAmount = formatDisplayValue(
                                  getTokenBalance(selectedVaultData.baseAsset),
                                  Number(
                                    (Object.values(tokendict).find(t => t.ticker === selectedVaultData.baseAsset)?.decimals) || 18
                                  )
                                ).replace(/,/g, '');
                                handleVaultDepositAmountChange('base', maxAmount);
                              }}
                            >
                              Max
                            </button>
                          </div>
                          </div>
                        </div>

                        <div className={`deposit-input-group ${vaultSecondTokenExceedsBalance ? 'lp-input-container-balance-error' : ''}`}>
                          <div className="deposit-input-wrapper">
                            <input
                              type="text"
                              placeholder="0.0"
                              className={`deposit-amount-input ${vaultSecondTokenExceedsBalance ? 'lp-input-balance-error' : ''}`}
                              value={vaultInputStrings.quote}
                              onChange={(e) => handleVaultDepositAmountChange('quote', e.target.value)}
                            />
                            <div className="deposit-token-badge">
                              <img src={tokendict[selectedVaultData.quoteAddress]?.image} alt="" className="deposit-token-icon" />
                              <span>{selectedVaultData.quoteAsset}</span>
                            </div>
                          </div>
                          <div className="lp-deposit-balance-wrapper">
                            <div className={`lp-deposit-usd-value ${vaultSecondTokenExceedsBalance ? 'lp-usd-value-balance-error' : ''}`}>
                              {calculateUSD(vaultInputStrings.quote, selectedVaultData.quoteAsset)}
                            </div>
                            <div className="deposit-balance">
                            <div className="deposit-balance-value">
                              Balance: {formatDisplayValue(
                                getTokenBalance(selectedVaultData.quoteAsset),
                                Number(
                                  (Object.values(tokendict).find(t => t.ticker === selectedVaultData.quoteAsset)?.decimals) || 18
                                )
                              )}
                            </div>
                            <button
                              className="vault-max-button"
                              onClick={() => {
                                const maxAmount = formatDisplayValue(
                                  getTokenBalance(selectedVaultData.quoteAsset),
                                  Number(
                                    (Object.values(tokendict).find(t => t.ticker === selectedVaultData.quoteAsset)?.decimals) || 18
                                  )
                                ).replace(/,/g, '');
                                handleVaultDepositAmountChange('quote', maxAmount);
                              }}
                            >
                              Max
                            </button>
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
                              const firstUSD = calculateUSD(vaultInputStrings.base, selectedVaultData.baseAsset);
                              const secondUSD = calculateUSD(vaultInputStrings.quote, selectedVaultData.quoteAsset);
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
                        Select the percentage of your position to withdraw. You'll receive both tokens proportionally.
                      </p>

                      <div className="withdraw-section">
                        <div className="withdraw-amount-section">
                          <div className="withdraw-percentage-input-container">
                            <div className="withdraw-percentage-display">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={withdrawPercentage}
                                onChange={(e) => handleWithdrawPercentageChange(e.target.value.replace(/[^\d]/g, ''))}
                                size={Math.max((withdrawPercentage || '0').length, 1)}
                                style={{ width: `${Math.max((withdrawPercentage || '0').length, 1)}ch` }}
                                className="withdraw-percentage-input"
                              />
                              <span style={{ color: `${withdrawPercentage ? '#FFF' : '#ededf571'}` }} className="withdraw-percentage-symbol">%</span>
                            </div>
                          </div>
                          <div className="percentage-buttons">
                            <button
                              className={`percentage-btn ${withdrawPercentage === '25' ? 'active' : ''}`}
                              onClick={() => handleWithdrawPercentageChange('25')}
                            >
                              25%
                            </button>
                            <button
                              className={`percentage-btn ${withdrawPercentage === '50' ? 'active' : ''}`}
                              onClick={() => handleWithdrawPercentageChange('50')}
                            >
                              50%
                            </button>
                            <button
                              className={`percentage-btn ${withdrawPercentage === '75' ? 'active' : ''}`}
                              onClick={() => handleWithdrawPercentageChange('75')}
                            >
                              75%
                            </button>
                            <button
                              className={`percentage-btn ${withdrawPercentage === '100' ? 'active' : ''}`}
                              onClick={() => handleWithdrawPercentageChange('100')}
                            >
                              Max
                            </button>
                          </div>
                        </div>
                        <div className="withdraw-preview">
                          <div className="preview-title">Your position:</div>
                          <div className="withdraw-token-preview">
                            <div className="withdraw-token-item">
                              <div className="deposit-token-info">
                                <img
                                  src={tokendict[selectedVaultData.quoteAddress]?.image}
                                  className="withdraw-token-icon"
                                />
                                <span className="token-symbol">
                                  {selectedVaultData.quoteAsset}
                                </span>
                              </div>
                              <span className="token-amount">
                                <span className="deposit-token-amount-before">
                                  {formatDisplayValue((BigInt(selectedVaultData?.quoteBalance || 0) * BigInt(selectedVaultData?.userShares || 0)) / BigInt(selectedVaultData?.totalShares || 1), Number(tokendict[selectedVaultData?.quoteAddress]?.decimals || 18))}
                                </span>
                                {withdrawPreview?.amountQuote != undefined && (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right-icon lucide-arrow-right" style={{ margin: '0 4px', opacity: 0.7 }}>
                                      <path d="M5 12h14" />
                                      <path d="m12 5 7 7-7 7" />
                                    </svg>
                                    {formatDisplayValue((BigInt(selectedVaultData?.quoteBalance || 0) * BigInt(selectedVaultData?.userShares || 0)) / BigInt(selectedVaultData?.totalShares || 1) - BigInt(withdrawPreview?.amountQuote || 0), Number(tokendict[selectedVaultData?.quoteAddress]?.decimals || 18))}
                                  </>
                                )}
                              </span>
                            </div>
                            <div className="withdraw-token-item">
                              <div className="deposit-token-info">
                                <img
                                  src={tokendict[selectedVaultData.baseAddress]?.image}
                                  className="withdraw-token-icon"
                                />
                                <span className="token-symbol">
                                  {selectedVaultData.baseAsset}
                                </span>
                              </div>
                              <span className="token-amount">
                                <span className="deposit-token-amount-before">
                                  {formatDisplayValue((BigInt(selectedVaultData?.baseBalance || 0) * BigInt(selectedVaultData?.userShares || 0)) / BigInt(selectedVaultData?.totalShares || 1), Number(tokendict[selectedVaultData?.baseAddress]?.decimals || 18))}
                                </span>
                                {withdrawPreview?.amountBase != undefined && (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right-icon lucide-arrow-right" style={{ margin: '0 4px', opacity: 0.7 }}>
                                      <path d="M5 12h14" />
                                      <path d="m12 5 7 7-7 7" />
                                    </svg>
                                    {formatDisplayValue((BigInt(selectedVaultData?.baseBalance || 0) * BigInt(selectedVaultData?.userShares || 0)) / BigInt(selectedVaultData?.totalShares || 1) - BigInt(withdrawPreview?.amountBase || 0), Number(tokendict[selectedVaultData?.baseAddress]?.decimals || 18))}
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        className={`continue-button ${(withdrawPercentage == '' || parseFloat(withdrawPercentage) == 0 || withdrawExceedsBalance || !withdrawPreview) ? '' : 'enabled'} ${withdrawExceedsBalance ? 'lp-button-balance-error' : ''}`}
                        disabled={(withdrawPercentage == '' || parseFloat(withdrawPercentage) == 0 || withdrawExceedsBalance || !withdrawPreview)}
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
