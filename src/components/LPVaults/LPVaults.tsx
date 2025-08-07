import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUpRight, ChevronDown, ChevronLeft, Plus, Search, Star, X, ExternalLink } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { readContracts } from '@wagmi/core';
import { encodeFunctionData, decodeFunctionResult } from "viem";
import { MaxUint256 } from "ethers";
import { useSharedContext } from '../../contexts/SharedContext';
import { fetchLatestPrice } from '../../utils/getPrice.ts';
import { CrystalVaultsAbi } from '../../abis/CrystalVaultsAbi';
import { settings } from "../../settings";
import walleticon from "../../assets/wallet_icon.png";
import closebutton from "../../assets/close_button.svg";
import { config } from '../../wagmi';
import './LPVaults.css';

interface VaultData {
  vault: string;
  quoteAsset: string;
  baseAsset: string;
  owner: string;
  name: string;
  desc: string;
  social1: string;
  social2: string;
  totalShares: bigint;
  maxShares: bigint;
  lockup: number;
  locked: boolean;
  closed: boolean;
}

interface VaultStrategy {
  id: string;
  address: string;
  name: string;
  description: string;
  type: 'Spot' | 'Margin';
  quoteAsset: string;
  baseAsset: string;
  quoteAssetData?: any;
  baseAssetData?: any;
  totalShares: string;
  maxShares: string;
  userShares: string;
  userBalance: string;
  userEarnings: string;
  isCreator?: boolean;
  createdAt: Date;
  lockup: number;
  locked: boolean;
  closed: boolean;
  owner: string;
  social1: string;
  social2: string;
  age: number;
}

interface LPVaultsProps {
  setpopup: (value: number) => void;
  onSelectToken: (token: { symbol: string; icon: string }) => void;
  setOnSelectTokenCallback?: (callback: ((token: { symbol: string; icon: string }) => void) | null) => void;
  tokendict: { [address: string]: any };
  tradesByMarket: Record<string, any[]>;
  markets: Record<string, any>;
  tokenBalances: Record<string, any>;
  currentRoute?: string;
  onRouteChange?: (route: string) => void;
  connected: boolean;
  account: any;
  selectedVaultForAction: VaultStrategy | null;
  setSelectedVaultForAction: (vault: VaultStrategy | null) => void;
  vaultDepositAmount: string;
  setVaultDepositAmount: (amount: string) => void;
  vaultWithdrawAmount: string;
  setVaultWithdrawAmount: (amount: string) => void;
  isVaultDepositSigning: boolean;
  setIsVaultDepositSigning: (signing: boolean) => void;
  isVaultWithdrawSigning: boolean;
  setIsVaultWithdrawSigning: (signing: boolean) => void;
  sendUserOperationAsync: any;
  waitForTxReceipt: any;
  setChain: () => void;
  address: string;
  refetch?: () => void;
  activechain: number;
  crystalVaultsAddress: any;
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

interface VaultSnapshotProps {
  vaultId: string;
  performance?: any;
  className?: string;
}

const VaultSnapshot: React.FC<VaultSnapshotProps> = ({ vaultId, performance, className = '' }) => {
  const generateMockPerformance = (trend = 'up', volatility = 0.5): { day: number; value: number }[] => {
    const data: { day: number; value: number }[] = [];
    let value = 100;

    for (let i = 1; i <= 7; i++) {
      const randomChange = (Math.random() - 0.5) * volatility * 2;
      const trendChange = trend === 'up' ? 0.5 : trend === 'down' ? -0.3 : 0;
      value += randomChange + trendChange;
      data.push({ day: i, value: Math.max(95, value) });
    }

    return data;
  };

  const data = generateMockPerformance('up', 0.8);
  const firstValue = data[0]?.value || 100;
  const lastValue = data[data.length - 1]?.value || 100;
  const percentChange = ((lastValue - firstValue) / firstValue) * 100;
  const isPositive = percentChange >= 0;

  return (
    <div className={`vault-snapshot ${className}`}>
      <div className="snapshot-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <defs>
              <linearGradient id={`gradient-${vaultId}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isPositive ? "#aaaecf" : "#ff5757"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={isPositive ? "#aaaecf" : "#ff5757"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "#aaaecf" : "#ff5757"}
              strokeWidth={1.5}
              fill={`url(#gradient-${vaultId})`}
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface TokenSelectorProps {
  value: string;
  onChange: (value: string) => void;
  tokendict: { [address: string]: any };
  placeholder: string;
  label: string;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ value, onChange, tokendict, placeholder, label }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedToken = Object.values(tokendict).find((t: any) => 
    t.address.toLowerCase() === value.toLowerCase()
  );

  const filteredTokens = Object.values(tokendict).filter((token: any) => {
    if (!searchTerm) return true;
    return token.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
           token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           token.address.toLowerCase().includes(searchTerm.toLowerCase());
  }).slice(0, 10);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTokenSelect = (token: any) => {
    onChange(token.address);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    if (inputValue.startsWith('0x') && inputValue.length === 42) {
      setShowDropdown(false);
    }
  };

  return (
    <div className="token-selector-container" ref={dropdownRef}>
      <label className="token-selector-label">{label}</label>
      <div className="token-selector-input-wrapper">
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          className="form-input token-selector-input"
          placeholder={placeholder}
        />
        
        {selectedToken && (
          <div className="selected-token-indicator">
            <img src={selectedToken.image} alt={selectedToken.ticker} className="token-icon-small" />
            <span className="token-symbol">{selectedToken.ticker}</span>
          </div>
        )}

        <button
          type="button"
          className="token-dropdown-button"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {showDropdown && (
        <div className="token-dropdown">
          <div className="token-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="token-search-input"
            />
          </div>
          
          <div className="token-list">
            {filteredTokens.map((token: any) => (
              <div
                key={token.address}
                className="token-option"
                onClick={() => handleTokenSelect(token)}
              >
                <img src={token.image} alt={token.ticker} className="token-icon" />
                <div className="token-info">
                  <div className="token-symbol">{token.ticker}</div>
                  <div className="token-name">{token.name}</div>
                </div>
                <div className="token-address">{token.address.slice(0, 6)}...{token.address.slice(-4)}</div>
              </div>
            ))}
            
            {filteredTokens.length === 0 && searchTerm && (
              <div className="no-tokens-found">No tokens found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LPVaults: React.FC<LPVaultsProps> = ({
  setpopup,
  onSelectToken,
  setOnSelectTokenCallback,
  tokendict,
  tradesByMarket,
  markets,
  tokenBalances,
  currentRoute = '/earn/vaults',
  onRouteChange,
  connected,
  account,
  selectedVaultForAction,
  setSelectedVaultForAction,
  vaultDepositAmount,
  setVaultDepositAmount,
  vaultWithdrawAmount,
  setVaultWithdrawAmount,
  isVaultDepositSigning,
  setIsVaultDepositSigning,
  isVaultWithdrawSigning,
  setIsVaultWithdrawSigning,
  sendUserOperationAsync,
  waitForTxReceipt,
  setChain,
  address,
  refetch,
  activechain,
  crystalVaultsAddress,
}) => {

  const [selectedVaultStrategy, setSelectedVaultStrategy] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVault, setActiveVault] = useState('0x6A6a20102070A58ac8bC21a12B29832CEe2a638e' as `0x${string}`);
  const [vaultList, setVaultList] = useState<any>([]);
  const [vaultFilter, setVaultFilter] = useState<'All' | 'Spot' | 'Margin'>('All');
  const [activeVaultTab, setActiveVaultTab] = useState<'all' | 'my-vaults'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [vaultDepositAmounts, setVaultDepositAmounts] = useState<{ quote: string, base: string }>({
    quote: '',
    base: ''
  });
  const [vaultQuoteExceedsBalance, setVaultQuoteExceedsBalance] = useState(false);
  const [vaultBaseExceedsBalance, setVaultBaseExceedsBalance] = useState(false);
  const [withdrawShares, setWithdrawShares] = useState('');
  const [withdrawExceedsBalance, setWithdrawExceedsBalance] = useState(false);
  const [depositPreview, setDepositPreview] = useState<{ shares: bigint, amountQuote: bigint, amountBase: bigint } | null>(null);
  const [withdrawPreview, setWithdrawPreview] = useState<{ amountQuote: bigint, amountBase: bigint } | null>(null);

  const [activeVaultStrategyTab, setActiveVaultStrategyTab] = useState<'balances' | 'positions' | 'trades' | 'deposits' | 'withdrawals' | 'depositors'>('balances');
  const [vaultStrategyTimeRange, setVaultStrategyTimeRange] = useState<'1D' | '1W' | '1M' | 'All'>('All');
  const [vaultStrategyChartType, setVaultStrategyChartType] = useState<'value' | 'pnl'>('value');

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    quoteAsset: '',
    baseAsset: '',
    amountQuote: '',
    amountBase: '',
    social1: '',
    social2: ''
  });

  useEffect(() => {
    
    (async () => {
      try {
        const [vaultDetails] = (await readContracts(config, {
          contracts: [
            { abi: CrystalVaultsAbi, address: crystalVaultsAddress, functionName: 'getVault', args: [activeVault] },
          ],
        })) as any[];
        if (vaultDetails?.status === "success") {
          const vaultDict = {
            address: vaultDetails.result[0],
            quoteAsset: vaultDetails.result[1],
            baseAsset: vaultDetails.result[2],
            owner: vaultDetails.result[3],
            name: vaultDetails.result[4],
            desc: vaultDetails.result[5],
            social1: vaultDetails.result[6],
            social2: vaultDetails.result[7],
            totalShares: vaultDetails.result[8],
            maxShares: vaultDetails.result[9],
            lockup: vaultDetails.result[10],
            locked: vaultDetails.result[11],
            closed: vaultDetails.result[12],
            type: 'Spot',
          }
          vaultList.push(vaultDict)
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [activeVault]);

const handleCreateVault = async () => {
  if (!account.connected || !createForm.name || !createForm.quoteAsset || !createForm.baseAsset || 
      !createForm.amountQuote || !createForm.amountBase) {
    return;
  }

  const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
  if (account.chainId !== targetChainId) {
    setChain();
    return;
  }

  try {
    setIsVaultDepositSigning(true);


    if (!createForm.quoteAsset.startsWith('0x') || !createForm.baseAsset.startsWith('0x')) {
      throw new Error('Invalid token addresses. Please provide valid contract addresses.');
    }


    const quoteAssetData = Object.values(tokendict).find((t: any) => 
      t.address.toLowerCase() === createForm.quoteAsset.toLowerCase()
    );
    const baseAssetData = Object.values(tokendict).find((t: any) => 
      t.address.toLowerCase() === createForm.baseAsset.toLowerCase()
    );

    if (!quoteAssetData || !baseAssetData) {
      throw new Error('One or both tokens not found in token dictionary. Please ensure you\'re using valid token addresses.');
    }

    const quoteDecimals = Number(quoteAssetData.decimals || 18);
    const baseDecimals = Number(baseAssetData.decimals || 18);

    const amountQuote = BigInt(Math.round(parseFloat(createForm.amountQuote) * 10 ** quoteDecimals));
    const amountBase = BigInt(Math.round(parseFloat(createForm.amountBase) * 10 ** baseDecimals));


    const quoteBalance = getTokenBalance(createForm.quoteAsset);
    const baseBalance = getTokenBalance(createForm.baseAsset);

    if (quoteBalance < amountQuote) {
      throw new Error(`Insufficient ${quoteAssetData.ticker} balance. Required: ${createForm.amountQuote}, Available: ${formatDisplayValue(quoteBalance, quoteDecimals)}`);
    }

    if (baseBalance < amountBase) {
      throw new Error(`Insufficient ${baseAssetData.ticker} balance. Required: ${createForm.amountBase}, Available: ${formatDisplayValue(baseBalance, baseDecimals)}`);
    }

    console.log('Creating vault with:', {
      quoteAsset: createForm.quoteAsset,
      baseAsset: createForm.baseAsset,
      amountQuote: amountQuote.toString(),
      amountBase: amountBase.toString(),
      name: createForm.name
    });

    if (createForm.quoteAsset.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      console.log('Approving quote token...');
      const approveQuoteUo = {
        target: createForm.quoteAsset as `0x${string}`,
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
          args: [crystalVaultsAddress as `0x${string}`, amountQuote],
        }),
        value: 0n,
      };
      const approveQuoteOp = await sendUserOperationAsync({ uo: approveQuoteUo });
      await waitForTxReceipt(approveQuoteOp.hash);
      console.log('Quote token approved');
    }

    if (createForm.baseAsset.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      console.log('Approving base token...');
      const approveBaseUo = {
        target: createForm.baseAsset as `0x${string}`,
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
          args: [crystalVaultsAddress as `0x${string}`, amountBase], 
        }),
        value: 0n,
      };
      const approveBaseOp = await sendUserOperationAsync({ uo: approveBaseUo });
      await waitForTxReceipt(approveBaseOp.hash);
      console.log('Base token approved');
    }

    const ethValue = 
      createForm.quoteAsset.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? amountQuote :
      createForm.baseAsset.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? amountBase : 0n;

    console.log('Deploying vault with ETH value:', ethValue.toString());

    const deployUo = {
      target: crystalVaultsAddress as `0x${string}`,
      data: encodeFunctionData({
        abi: CrystalVaultsAbi,
        functionName: "deploy",
        args: [
          createForm.quoteAsset as `0x${string}`,
          createForm.baseAsset as `0x${string}`,
          amountQuote,
          amountBase,
          createForm.name || 'Unnamed Vault',
          createForm.description || 'No description provided',
          createForm.social1 || '',
          createForm.social2 || '',
        ],
      }),
      value: ethValue,
    };

    console.log('Sending deploy transaction...');
    const deployOp = await sendUserOperationAsync({ uo: deployUo });
    console.log('Deploy transaction sent, waiting for receipt...');
    await waitForTxReceipt(deployOp.hash);
    console.log('Vault deployed successfully!');

    setCreateForm({
      name: '',
      description: '',
      quoteAsset: '',
      baseAsset: '',
      amountQuote: '',
      amountBase: '',
      social1: '',
      social2: ''
    });
    setShowCreateModal(false);

    refetch?.();
    alert('Vault created successfully!');

  } catch (e: any) {
    console.error('Vault creation error:', e);
    
    let errorMessage = 'Failed to create vault';
    
    if (e.message?.includes('insufficient')) {
      errorMessage = 'Insufficient balance for one or more tokens';
    } else if (e.message?.includes('allowance')) {
      errorMessage = 'Token approval failed. Please try again.';
    } else if (e.message?.includes('execution reverted')) {
      errorMessage = 'Transaction failed. This might be due to:\n• Minimum deposit requirements not met\n• Invalid token pair\n• Contract restrictions\n• Network congestion';
    } else if (e.message) {
      errorMessage = e.message;
    }
    
    alert(errorMessage);
  } finally {
    setIsVaultDepositSigning(false);
  }
};

  const vaultStrategyIndicatorRef = useRef<HTMLDivElement>(null);
  const vaultStrategyTabsRef = useRef<(HTMLDivElement | null)[]>([]);

const getTokenIcon = (tokenIdentifier: string) => {
  if (tokenIdentifier.startsWith('0x') && tokenIdentifier.length === 42) {
    const tokenByAddress = tokendict[tokenIdentifier.toLowerCase()];
    if (tokenByAddress) {
      return tokenByAddress.image;
    }
  }
  
  const tokenByTicker = Object.values(tokendict).find((t: any) => 
    t.ticker.toLowerCase() === tokenIdentifier.toLowerCase()
  );
  return tokenByTicker?.image || '/api/placeholder/24/24';
};
  const getTokenName = (symbol: string) => {
    const tokenEntry = Object.values(tokendict).find((t: any) => t.ticker === symbol.toUpperCase());
    return tokenEntry?.name || symbol;
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

  const getTokenBalance = (tokenAddress: string): bigint => {
    return tokenBalances[tokenAddress] || 0n;
  };

  const filteredVaultStrategies = (vaultList || []).filter((vault: any) => {
    const typeMatch = vaultFilter === 'All' || vault.type === vaultFilter;
    const myVaultsMatch = activeVaultTab === 'all' ||
      (activeVaultTab === 'my-vaults' && (vault.isCreator || parseFloat(vault.userBalance || '0') > 0));
    const searchMatch = searchQuery === '' ||
      vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vault.owner.toLowerCase().includes(searchQuery.toLowerCase());

    return typeMatch && myVaultsMatch && searchMatch;
  });

  const showVaultStrategyDetail = (vaultAddress: string) => {
    setSelectedVaultStrategy(vaultAddress);
    setActiveVaultStrategyTab('balances');
    onRouteChange?.(`/earn/vaults/${vaultAddress}`);
  };

  const backToList = () => {
    setSelectedVaultStrategy(null);
    onRouteChange?.('/earn/vaults');
  };

  const selectedVaultStrategyData = selectedVaultStrategy ? 
    filteredVaultStrategies.find((vault: any) => vault.address === selectedVaultStrategy) : null;

  const handleVaultDepositAmountChange = (type: 'quote' | 'base', value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setVaultDepositAmounts(prev => ({
        ...prev,
        [type]: value
      }));

      if (value !== '' && selectedVaultForAction) {
        const tokenData = type === 'quote' ? selectedVaultForAction.quoteAssetData : selectedVaultForAction.baseAssetData;
        if (tokenData) {
          const userBalance = getTokenBalance(tokenData.address);
          const tokenDecimals = Number(tokenData.decimals || 18);
          const maxAllowedAmount = Number(userBalance) / 10 ** tokenDecimals;
          const enteredAmount = parseFloat(value);

          if (type === 'quote') {
            setVaultQuoteExceedsBalance(enteredAmount > maxAllowedAmount);
          } else {
            setVaultBaseExceedsBalance(enteredAmount > maxAllowedAmount);
          }
        }
      } else {
        if (type === 'quote') {
          setVaultQuoteExceedsBalance(false);
        } else {
          setVaultBaseExceedsBalance(false);
        }
      }
    }
  };

  const handleWithdrawSharesChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWithdrawShares(value);

      if (value !== '' && selectedVaultForAction) {
        const userSharesBalance = parseFloat(selectedVaultForAction.userShares || '0');
        const enteredAmount = parseFloat(value);
        setWithdrawExceedsBalance(enteredAmount > userSharesBalance);
      } else {
        setWithdrawExceedsBalance(false);
      }
    }
  };

  useEffect(() => {
    if (!selectedVaultForAction || !vaultDepositAmounts.quote || !vaultDepositAmounts.base) {
      setDepositPreview(null);
      return;
    }

    const previewDeposit = async () => {
      try {
        const quoteDecimals = Number(selectedVaultForAction.quoteAssetData?.decimals || 18);
        const baseDecimals = Number(selectedVaultForAction.baseAssetData?.decimals || 18);
        
        const amountQuoteDesired = BigInt(Math.round(parseFloat(vaultDepositAmounts.quote) * 10 ** quoteDecimals));
        const amountBaseDesired = BigInt(Math.round(parseFloat(vaultDepositAmounts.base) * 10 ** baseDecimals));

      } catch (error) {
        console.error('Error previewing deposit:', error);
        setDepositPreview(null);
      }
    };

    const timeoutId = setTimeout(previewDeposit, 500);
    return () => clearTimeout(timeoutId);
  }, [vaultDepositAmounts, selectedVaultForAction, crystalVaultsAddress]);

  useEffect(() => {
    if (!selectedVaultForAction || !withdrawShares) {
      setWithdrawPreview(null);
      return;
    }

    const previewWithdrawal = async () => {
      try {
        const shares = BigInt(Math.round(parseFloat(withdrawShares) * 1e18));

      } catch (error) {
        console.error('Error previewing withdrawal:', error);
        setWithdrawPreview(null);
      }
    };

    const timeoutId = setTimeout(previewWithdrawal, 500);
    return () => clearTimeout(timeoutId);
  }, [withdrawShares, selectedVaultForAction, crystalVaultsAddress]);

  const handleVaultDeposit = async () => {
    if (!selectedVaultForAction || !account.connected || !depositPreview) return;
    
    const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) {
      setChain();
      return;
    }

    try {
      setIsVaultDepositSigning(true);

      const quoteAssetAddress = selectedVaultForAction.quoteAssetData?.address;
      const baseAssetAddress = selectedVaultForAction.baseAssetData?.address;

      if (!quoteAssetAddress || !baseAssetAddress) {
        throw new Error('Token addresses not found');
      }

      const quoteDecimals = Number(selectedVaultForAction.quoteAssetData?.decimals || 18);
      const baseDecimals = Number(selectedVaultForAction.baseAssetData?.decimals || 18);

      const amountQuoteDesired = BigInt(Math.round(parseFloat(vaultDepositAmounts.quote) * 10 ** quoteDecimals));
      const amountBaseDesired = BigInt(Math.round(parseFloat(vaultDepositAmounts.base) * 10 ** baseDecimals));
      
      const amountQuoteMin = (amountQuoteDesired * 95n) / 100n;
      const amountBaseMin = (amountBaseDesired * 95n) / 100n;

      const quoteBalance = getTokenBalance(quoteAssetAddress);
      const baseBalance = getTokenBalance(baseAssetAddress);
      
      if (quoteBalance < amountQuoteDesired) {
        throw new Error(`Insufficient ${selectedVaultForAction.quoteAsset} balance`);
      }

      if (baseBalance < amountBaseDesired) {
        throw new Error(`Insufficient ${selectedVaultForAction.baseAsset} balance`);
      }

      if (quoteAssetAddress !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        const approveQuoteUo = {
          target: quoteAssetAddress as `0x${string}`,
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
        const approveQuoteOp = await sendUserOperationAsync({ uo: approveQuoteUo });
        await waitForTxReceipt(approveQuoteOp.hash);
      }

      if (baseAssetAddress !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        const approveBaseUo = {
          target: baseAssetAddress as `0x${string}`,
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
        const approveBaseOp = await sendUserOperationAsync({ uo: approveBaseUo });
        await waitForTxReceipt(approveBaseOp.hash);
      }

      const ethValue = 
        quoteAssetAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? amountQuoteDesired :
        baseAssetAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? amountBaseDesired : 0n;

      const depositUo = {
        target: crystalVaultsAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: CrystalVaultsAbi,
          functionName: "deposit",
          args: [
            selectedVaultForAction.address as `0x${string}`,
            amountQuoteDesired,
            amountBaseDesired,
            amountQuoteMin,
            amountBaseMin,
          ],
        }),
        value: ethValue,
      };

      const depositOp = await sendUserOperationAsync({ uo: depositUo });
      await waitForTxReceipt(depositOp.hash);

      setVaultDepositAmounts({ quote: '', base: '' });
      setVaultQuoteExceedsBalance(false);
      setVaultBaseExceedsBalance(false);
      setDepositPreview(null);
      
      refetch?.();

      setpopup(0);
      setSelectedVaultForAction(null);

    } catch (e: any) {
      console.error('Vault deposit error:', e);
      alert(e.message || 'Deposit failed');
    } finally {
      setIsVaultDepositSigning(false);
    }
  };

  const handleVaultWithdraw = async () => {
    if (!selectedVaultForAction || !account.connected || !withdrawPreview) return;
    
    const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) {
      setChain();
      return;
    }

    try {
      setIsVaultWithdrawSigning(true);

      const sharesToWithdraw = BigInt(Math.round(parseFloat(withdrawShares) * 1e18));
      
      const amountQuoteMin = (withdrawPreview.amountQuote * 95n) / 100n;
      const amountBaseMin = (withdrawPreview.amountBase * 95n) / 100n;

      const withdrawUo = {
        target: crystalVaultsAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: CrystalVaultsAbi,
          functionName: "withdraw",
          args: [
            selectedVaultForAction.address as `0x${string}`,
            sharesToWithdraw,
            amountQuoteMin,
            amountBaseMin,
          ],
        }),
        value: 0n,
      };

      const withdrawOp = await sendUserOperationAsync({ uo: withdrawUo });
      await waitForTxReceipt(withdrawOp.hash);

      setWithdrawShares('');
      setWithdrawExceedsBalance(false);
      setWithdrawPreview(null);
      
      refetch?.();

      setpopup(0);
      setSelectedVaultForAction(null);

    } catch (e: any) {
      console.error('Vault withdraw error:', e);
      alert(e.message || 'Withdrawal failed');
    } finally {
      setIsVaultWithdrawSigning(false);
    }
  };

  const updateVaultStrategyIndicatorPosition = useCallback((activeTab: string) => {
    if (!vaultStrategyIndicatorRef.current || !vaultStrategyTabsRef.current) {
      return;
    }

    const availableTabs = ['balances', ...(selectedVaultStrategyData?.type === 'Margin' ? ['positions'] : []), 'trades', 'deposits', 'withdrawals', 'depositors'];
    const activeTabIndex = availableTabs.findIndex(tab => tab === activeTab);

    if (activeTabIndex !== -1) {
      const activeTabElement = vaultStrategyTabsRef.current[activeTabIndex];
      if (activeTabElement && activeTabElement.parentElement) {
        const indicator = vaultStrategyIndicatorRef.current;
        indicator.style.width = `${activeTabElement.offsetWidth}px`;
        indicator.style.left = `${activeTabElement.offsetLeft}px`;
      }
    }
  }, [selectedVaultStrategyData?.type]);

  useEffect(() => {
    if (selectedVaultStrategy && selectedVaultStrategyData) {
      setTimeout(() => {
        updateVaultStrategyIndicatorPosition(activeVaultStrategyTab);
      }, 0);
    }
  }, [activeVaultStrategyTab, selectedVaultStrategy, selectedVaultStrategyData, updateVaultStrategyIndicatorPosition]);

  useEffect(() => {
    const handleResize = () => {
      if (selectedVaultStrategy && selectedVaultStrategyData) {
        updateVaultStrategyIndicatorPosition(activeVaultStrategyTab);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeVaultStrategyTab, selectedVaultStrategy, selectedVaultStrategyData, updateVaultStrategyIndicatorPosition]);

  useEffect(() => {
    if (currentRoute.startsWith('/earn/vaults')) {
      const pathParts = currentRoute.split('/');
      if (pathParts.length >= 4 && pathParts[3]) {
        const vaultAddress = pathParts[3];
        const vault = filteredVaultStrategies.find((v: any) => v.address === vaultAddress);
        if (vault && selectedVaultStrategy !== vault.address) {
          setSelectedVaultStrategy(vault.address);
          setActiveVaultStrategyTab('balances');
        }
      } else {
        setSelectedVaultStrategy(null);
      }
    }
  }, [currentRoute, filteredVaultStrategies, selectedVaultStrategy]);

  const isVaultDepositEnabled = () => {
    return vaultDepositAmounts.quote !== '' && vaultDepositAmounts.base !== '' &&
      parseFloat(vaultDepositAmounts.quote) > 0 && parseFloat(vaultDepositAmounts.base) > 0 &&
      !vaultQuoteExceedsBalance && !vaultBaseExceedsBalance && depositPreview;
  };

  const isWithdrawEnabled = () => {
    return withdrawShares !== '' && parseFloat(withdrawShares) > 0 && 
      !withdrawExceedsBalance && withdrawPreview;
  };

  const getVaultDepositButtonText = () => {
    if (vaultQuoteExceedsBalance || vaultBaseExceedsBalance) {
      return 'Insufficient Balance';
    }
    if (!depositPreview) {
      return 'Enter Amounts';
    }
    return 'Deposit';
  };

  const getWithdrawButtonText = () => {
    if (withdrawExceedsBalance) {
      return 'Insufficient Shares';
    }
    if (!withdrawPreview) {
      return 'Enter Amount';
    }
    return 'Withdraw';
  };

  return (
    <div className="vaults-page-container">
      <div className="lp-content-wrapper">
        {!selectedVaultStrategy && (
          <>
            <div className="vaults-header">
              <div className="vaults-stats">
                <div className="vault-stat">
                  <span className="stat-label">Total Vaults</span>
                  <span className="stat-value">{vaultList.length || 0}</span>
                </div>
                <div className="vault-stat">
                  <span className="stat-label">Total Value Locked</span>
                  <span className="stat-value">$0.0M</span>
                </div>
              </div>

              <button
                className={`create-vault-button ${!account.connected ? 'disabled' : ''}`}
                onClick={() => {
                  if (!account.connected) {
                    setpopup(4);
                  } else {
                    setShowCreateModal(true);
                  }
                }}
                disabled={!account.connected}
              >
                <Plus size={16} />
                Create Vault
              </button>
            </div>

            <div className="vaults-filters">
              <div className="vault-tabs" data-active={activeVaultTab}>
                <button
                  className={`vault-tab ${activeVaultTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveVaultTab('all')}
                >
                  All Vaults ({filteredVaultStrategies.length})
                </button>
                <button
                  className={`vault-tab ${activeVaultTab === 'my-vaults' ? 'active' : ''}`}
                  onClick={() => setActiveVaultTab('my-vaults')}
                >
                  My Vaults ({filteredVaultStrategies.filter((v: any) => v.isCreator || parseFloat(v.userBalance || '0') > 0).length})
                </button>
              </div>

              <div className="filter-controls">
                <div className="type-filters">
                  {(['All', 'Spot', 'Margin'] as const).map((filter) => (
                    <button
                      key={filter}
                      className={`filter-button ${vaultFilter === filter ? 'active' : ''}`}
                      onClick={() => setVaultFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="vaults-search-container">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search vaults..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="vaults-search-input"
                  />
                </div>
              </div>
            </div>

            <div className="vaults-list">
              <div className="vaults-list-header">
                <div className="col vault-name-col">Vault</div>
                <div className="col vault-leader-col">Leader</div>
                <div className="col vault-type-col">Type</div>
                <div className="col vault-tokens-col">Assets</div>
                <div className="col vault-apy-col">TVL</div>
                <div className="col vault-deposits-col">Max Shares</div>
                <div className="col vault-your-deposits-col">Your Shares</div>
                <div className="col vault-age-col">Status</div>
                <div className="col vault-actions-col">Snapshot</div>
              </div>

              {filteredVaultStrategies.map((vault: any) => (
                <div key={vault.id} className="vault-row" onClick={() => showVaultStrategyDetail(vault.address)}>
                  <div className="col vault-name-col">
                    <div className="vault-name-container">
                      <h3 className="vault-name">{vault.name}</h3>
                      {vault.isCreator && (
                        <span className="creator-badge">Creator</span>
                      )}
                    </div>
                  </div>
                  <div className="col vault-leader-col">
                    <div className="vault-leader">
                      <span className="leader-token-name">{vault.owner.slice(0, 6)}...{vault.owner.slice(-4)}</span>
                    </div>
                  </div>

                  <div className="col vault-type-col">
                    <span className={`vault-type-badge ${vault.type.toLowerCase()}`}>
                      {vault.type}
                    </span>
                  </div>

                  <div className="col vault-tokens-col">
                    <div className="vault-tokens">
                      <div className="quote-token">
                        <img src={getTokenIcon(vault.quoteAsset)} alt={vault.quoteAsset} className="token-icon" />
                        <span>{vault.quoteAsset}</span>
                      </div>
                      <div className="base-token">
                        <img src={getTokenIcon(vault.baseAsset)} alt={vault.baseAsset} className="token-icon" />
                        <span>{vault.baseAsset}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col vault-apy-col">
                    <span className="apy-value">${formatDisplayValue(BigInt(vault.totalShares), 18)}</span>
                  </div>

                  <div className="col vault-deposits-col">
                    <span className="deposits-value">{formatDisplayValue(BigInt(vault.maxShares), 18)}</span>
                  </div>

                  <div className="col vault-your-deposits-col">
                    <span className="deposits-value">{vault.userShares}</span>
                  </div>

                  <div className="col vault-age-col">
                    <span className={`age-value ${vault.closed ? 'closed' : vault.locked ? 'locked' : 'active'}`}>
                      {vault.closed ? 'Closed' : vault.locked ? 'Locked' : 'Active'}
                    </span>
                  </div>

                  <div className="col vault-snapshot-col">
                    <VaultSnapshot vaultId={vault.id} />
                  </div>
                </div>
              ))}

              {filteredVaultStrategies.length === 0 && (
                <div className="no-vaults-message">
                  <p>No vaults found matching your criteria.</p>
                </div>
              )}
            </div>
          </>
        )}

        {selectedVaultStrategy && selectedVaultStrategyData && (
          <div className="vault-strategy-detail">
            <div className="vault-strategy-header">
              <div className="vault-strategy-breadcrumb-container">
                <div className="add-liquidity-breadcrumb">
                  <button onClick={backToList} className="breadcrumb-link">
                    Vaults
                  </button>
                  <ChevronLeft size={16} className="earn-breadcrumb-arrow" />
                  <span className="breadcrumb-current">{selectedVaultStrategyData.name}</span>
                </div>

                <div className="vault-detail-action-buttons">
                  <button
                    className={`vault-detail-deposit-btn ${!connected || selectedVaultStrategyData.closed ? 'disabled' : ''}`}
                    onClick={() => {
                      if (!connected) {
                        setpopup(4);
                      } else if (!selectedVaultStrategyData.closed) {
                        setSelectedVaultForAction(selectedVaultStrategyData);
                        setpopup(22);
                      }
                    }}
                    disabled={!connected || selectedVaultStrategyData.closed}
                  >
                    Deposit
                  </button>

                  <button
                    className={`vault-detail-withdraw-btn ${!connected || parseFloat(selectedVaultStrategyData.userShares || '0') === 0 ? 'disabled' : ''}`}
                    onClick={() => {
                      if (!connected) {
                        setpopup(4);
                      } else if (parseFloat(selectedVaultStrategyData.userShares || '0') > 0) {
                        setSelectedVaultForAction(selectedVaultStrategyData);
                        setpopup(23);
                      }
                    }}
                    disabled={!connected || parseFloat(selectedVaultStrategyData.userShares || '0') === 0}
                  >
                    Withdraw
                  </button>
                </div>
              </div>

              <div className="vault-strategy-sticky-bar">
                <div className="vault-strategy-info">
                  <h1 className="vault-strategy-name">{selectedVaultStrategyData.name}</h1>
                  <div className="vault-strategy-contract">
                    <span className="contract-label">Contract:</span>
                    <span className="contract-address">{selectedVaultStrategyData.address}</span>
                    <button className="copy-address-btn" title="Copy address">
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>

                <div className="vault-strategy-metrics">
                  <div className="vault-metric">
                    <span className="vault-metric-label">Total Shares</span>
                    <span className="vault-metric-value">{formatDisplayValue(BigInt(selectedVaultStrategyData.totalShares), 18)}</span>
                  </div>
                  <div className="vault-metric">
                    <span className="vault-metric-label">Max Shares</span>
                    <span className="vault-metric-value">{formatDisplayValue(BigInt(selectedVaultStrategyData.maxShares), 18)}</span>
                  </div>
                  <div className="vault-metric">
                    <span className="vault-metric-label">Your Shares</span>
                    <span className="vault-metric-value">{selectedVaultStrategyData.userShares || '0.00'}</span>
                  </div>
                  <div className="vault-metric">
                    <span className="vault-metric-label">Status</span>
                    <span className={`vault-metric-value ${selectedVaultStrategyData.closed ? 'metric-negative' : selectedVaultStrategyData.locked ? 'metric-warning' : 'metric-positive'}`}>
                      {selectedVaultStrategyData.closed ? 'Closed' : selectedVaultStrategyData.locked ? 'Locked' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="vault-strategy-content">
              <div className="vault-strategy-overview">
                <div className="vault-strategy-description">
                  <div className="description-header">
                    <span className="leader-label">Vault Owner:</span>
                    <span className="leader-address">{selectedVaultStrategyData.owner}</span>
                  </div>
                  <span className="vault-description">Description:</span>
                  <p className="description-text">{selectedVaultStrategyData.description}</p>
                  <div className="vault-socials">
                    <span className="vault-description">Socials:</span>
                    {selectedVaultStrategyData.social1 && (
                      <a
                        href={selectedVaultStrategyData.social1}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="twitter-link-description"
                      >
                        <span>Social 1:</span>
                        {selectedVaultStrategyData.social1}
                      </a>
                    )}
                    {selectedVaultStrategyData.social2 && (
                      <a
                        href={selectedVaultStrategyData.social2}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="twitter-link-description"
                      >
                        <span>Social 2:</span>
                        {selectedVaultStrategyData.social2}
                      </a>
                    )}
                  </div>
                </div>

                <div className="vault-strategy-performance">
                  <div className="performance-header">
                    <div className="chart-controls">
                      <div className="chart-type-toggle">
                        <button
                          className={`chart-type-btn ${vaultStrategyChartType === 'value' ? 'active' : ''}`}
                          onClick={() => setVaultStrategyChartType('value')}
                        >
                          Account Value
                        </button>
                        <button
                          className={`chart-type-btn ${vaultStrategyChartType === 'pnl' ? 'active' : ''}`}
                          onClick={() => setVaultStrategyChartType('pnl')}
                        >
                          PnL
                        </button>
                      </div>
                      <select
                        value={vaultStrategyTimeRange}
                        onChange={(e) => setVaultStrategyTimeRange(e.target.value as any)}
                        className="time-range-select"
                      >
                        <option value="1D">1D</option>
                        <option value="1W">1W</option>
                        <option value="1M">1M</option>
                        <option value="All">All-time</option>
                      </select>
                    </div>
                  </div>

                  <div className="performance-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="vaultPerformanceGrad" x1="0" y1="0" x2="0" y2="1">
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
                          contentStyle={{
                            background: 'none',
                            border: 'none',
                            color: '#fff'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#aaaecf"
                          strokeWidth={2}
                          fill="url(#vaultPerformanceGrad)"
                          dot={false}
                          activeDot={{ r: 4, fill: "rgb(6,6,6)", stroke: "#aaaecf", strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="vault-strategy-tabs">
                <div className="vault-strategy-tabs-container">
                  <div className="vault-strategy-types-rectangle">
                    {(['balances', 'deposits', 'withdrawals', 'depositors'] as const).map((tab, index) => (
                      <div
                        key={tab}
                        ref={(el) => (vaultStrategyTabsRef.current[index] = el)}
                        className={`vault-strategy-type ${activeVaultStrategyTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveVaultStrategyTab(tab as any)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </div>
                    ))}
                  </div>
                  <div ref={vaultStrategyIndicatorRef} className="vault-strategy-sliding-indicator" />
                </div>

                <div className="vault-tab-content">
                  {activeVaultStrategyTab === 'balances' && (
                    <div className="balances-tab">
                      <div className="vault-holdings">
                        <div className="vault-holdings-table">
                          <div className="vault-holdings-header">
                            <div className="vault-holdings-col-header">Asset</div>
                            <div className="vault-holdings-col-header">Symbol</div>
                            <div className="vault-holdings-col-header">Total Shares</div>
                            <div className="vault-holdings-col-header">Your Shares</div>
                          </div>
                          <div className="vault-holdings-row">
                            <div className="vault-holding-asset">
                              <img src={getTokenIcon(selectedVaultStrategyData.quoteAsset)} alt={selectedVaultStrategyData.quoteAsset} className="vault-holding-icon" />
                              <span>{getTokenName(selectedVaultStrategyData.quoteAsset)}</span>
                            </div>
                            <div className="vault-holdings-col">{selectedVaultStrategyData.quoteAsset}</div>
                            <div className="vault-holdings-col">{formatDisplayValue(BigInt(selectedVaultStrategyData.totalShares), 18)}</div>
                            <div className="vault-holdings-col">{selectedVaultStrategyData.userShares || '0.00'}</div>
                          </div>
                          <div className="vault-holdings-row">
                            <div className="vault-holding-asset">
                              <img src={getTokenIcon(selectedVaultStrategyData.baseAsset)} alt={selectedVaultStrategyData.baseAsset} className="vault-holding-icon" />
                              <span>{getTokenName(selectedVaultStrategyData.baseAsset)}</span>
                            </div>
                            <div className="vault-holdings-col">{selectedVaultStrategyData.baseAsset}</div>
                            <div className="vault-holdings-col">{formatDisplayValue(BigInt(selectedVaultStrategyData.totalShares), 18)}</div>
                            <div className="vault-holdings-col">{selectedVaultStrategyData.userShares || '0.00'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {(activeVaultStrategyTab === 'deposits' || activeVaultStrategyTab === 'withdrawals' || activeVaultStrategyTab === 'depositors') && (
                    <div className="vault-data-tab">
                      <p>No data available for {activeVaultStrategyTab}.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Create New Vault</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Vault Name</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({...prev, name: e.target.value}))}
                    className="form-input"
                    placeholder="Enter vault name"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({...prev, description: e.target.value}))}
                    className="form-textarea"
                    rows={4}
                    placeholder="Describe your vault strategy"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <TokenSelector
                      value={createForm.quoteAsset}
                      onChange={(value) => setCreateForm(prev => ({...prev, quoteAsset: value}))}
                      tokendict={tokendict}
                      placeholder="Select quote token..."
                      label="Quote Asset"
                    />
                  </div>
                  <div className="form-group">
                    <TokenSelector
                      value={createForm.baseAsset}
                      onChange={(value) => setCreateForm(prev => ({...prev, baseAsset: value}))}
                      tokendict={tokendict}
                      placeholder="Select base token..."
                      label="Base Asset"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Initial Quote Amount</label>
                    <input
                      type="number"
                      value={createForm.amountQuote}
                      onChange={(e) => setCreateForm(prev => ({...prev, amountQuote: e.target.value}))}
                      className="form-input"
                      placeholder="0.0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Initial Base Amount</label>
                    <input
                      type="number"
                      value={createForm.amountBase}
                      onChange={(e) => setCreateForm(prev => ({...prev, amountBase: e.target.value}))}
                      className="form-input"
                      placeholder="0.0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Social Link 1 (Optional)</label>
                    <input
                      type="text"
                      value={createForm.social1}
                      onChange={(e) => setCreateForm(prev => ({...prev, social1: e.target.value}))}
                      className="form-input"
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Social Link 2 (Optional)</label>
                    <input
                      type="text"
                      value={createForm.social2}
                      onChange={(e) => setCreateForm(prev => ({...prev, social2: e.target.value}))}
                      className="form-input"
                      placeholder="https://telegram.me/..."
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="vault-cancel-button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={`save-button ${(!createForm.name || !createForm.quoteAsset || !createForm.baseAsset || !createForm.amountQuote || !createForm.amountBase) ? 'disabled' : ''}`}
                  disabled={!createForm.name || !createForm.quoteAsset || !createForm.baseAsset || !createForm.amountQuote || !createForm.amountBase || isVaultDepositSigning}
                  onClick={handleCreateVault}
                >
                  {isVaultDepositSigning ? (
                    <div className="button-content">
                      <div className="loading-spinner" />
                      Creating...
                    </div>
                  ) : (
                    'Create Vault'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LPVaults;