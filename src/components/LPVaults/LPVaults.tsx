import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronLeft, Plus, Search, X, ExternalLink } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { readContracts } from '@wagmi/core';
import { encodeFunctionData } from "viem";
import { CrystalVaultsAbi } from '../../abis/CrystalVaultsAbi';
import { TokenAbi } from '../../abis/TokenAbi';
import { settings } from "../../settings";
import { config } from '../../wagmi';
import './LPVaults.css';
import './LPVaults.css'
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi';
import closebutton from '../../assets/close_button.png';

interface LPVaultsProps {
  setpopup: (value: number) => void;
  onSelectToken: (token: { symbol: string; icon: string }) => void;
  setOnSelectTokenCallback?: (callback: ((token: { symbol: string; icon: string }) => void) | null) => void;
  tokendict: { [address: string]: any };
  tokenBalances: Record<string, any>;
  currentRoute?: string;
  onRouteChange?: (route: string) => void;
  connected: boolean;
  account: any;
  setselectedVault: any;
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
  router: string;
  formatUSDDisplay: any;
  calculateUSDValue: any;
  tradesByMarket: any;
  getMarket: any;
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

const VaultSnapshot: React.FC<VaultSnapshotProps> = ({ vaultId, className = '' }) => {
  const generateMockPerformance = (trend = 'up', volatility = 0.5): { day: number; value: number }[] => {
    const data: { day: number; value: number }[] = [];
    let value = 100;

    for (let i = 1; i <= 7; i++) {
      const randomChange = (Math.random() - 0.5) * volatility * 2;
      const trendChange = trend === 'up' ? 0.5 : trend === 'down' ? -0.3 : 0;
      value += randomChange + trendChange;
      data.push({ day: i, value: Math.max(95, value) });

MarketSelector.displayName = 'MarketSelector';
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
      if (!showDropdown) return;
      
      const target = event.target as Node;
          if (dropdownRef.current?.contains(target)) {
        return;
      }
      
      setShowDropdown(false);
    };

    if (showDropdown) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

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
          onFocus={(e) => {
            e.preventDefault();
            setShowDropdown(true);
          }}
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowDropdown(!showDropdown);
          }}
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
  tokendict,
  tokenBalances,
  currentRoute = '/earn/vaults',
  onRouteChange,
  connected,
  account,
  setselectedVault,
  isVaultDepositSigning,
  setIsVaultDepositSigning,
  sendUserOperationAsync,
  waitForTxReceipt,
  setChain,
  address,
  refetch,
  activechain,
  crystalVaultsAddress,
  router,
  formatUSDDisplay,
  calculateUSDValue,
  tradesByMarket,
  getMarket,
}) => {
  const [selectedVaultStrategy, setSelectedVaultStrategy] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVault, _setActiveVault] = useState({address: '0x845564D9444e3766b0f665A9AD097Ad1597F0492' as `0x${string}`, quoteAsset: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea', baseAsset: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701'});
  const [vaultList, setVaultList] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [vaultFilter, setVaultFilter] = useState<'All' | 'Spot' | 'Margin'>('All');
  const [activeVaultTab, setActiveVaultTab] = useState<'all' | 'my-vaults'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManagementMenu, setShowManagementMenu] = useState(false);

  const [activeVaultStrategyTab, setActiveVaultStrategyTab] = useState<'balances' | 'positions' | 'trades' | 'deposits' | 'withdrawals' | 'depositors'>('balances');
  const [vaultStrategyTimeRange, setVaultStrategyTimeRange] = useState<'1D' | '1W' | '1M' | 'All'>('All');
  const [vaultStrategyChartType, setVaultStrategyChartType] = useState<'value' | 'pnl'>('value');



  const initialCreateForm = React.useMemo(() => ({
    name: '',
    description: '',
    selectedMarket: null as any,
    quoteAsset: '',
    baseAsset: '',
    amountQuote: '',
    amountBase: '',
    social1: '',
    social2: ''
  }), []);

  const [createForm, setCreateForm] = useState(initialCreateForm);

  useEffect(() => {
    setIsLoading(true); 

    (async () => {
      try {
        const [vaultDetails, vaultQuoteBalance, vaultBaseBalance, vaultUserBalance] = (await readContracts(config, {
          contracts: [
            { abi: CrystalVaultsAbi as any, address: crystalVaultsAddress, functionName: 'getVault', args: [activeVault?.address] },
            {
              abi: CrystalRouterAbi as any,
              address: router as `0x${string}`,
              functionName: 'getDepositedBalance',
              args: [activeVault?.address as `0x${string}`, activeVault?.quoteAsset as `0x${string}`],
            }, {
              abi: CrystalRouterAbi as any,
              address: router as `0x${string}`,
              functionName: 'getDepositedBalance',
              args: [activeVault?.address as `0x${string}`, activeVault?.baseAsset as `0x${string}`],
            },
            ...(address ? [{
              abi: TokenAbi,
              address: activeVault.address,
              functionName: 'balanceOf',
              args: [address as `0x${string}`],
            }] : [])],
        })) as any[];
        if (vaultDetails?.status === "success") {
          const vaultMetaData = vaultDetails.result[9];
          const vaultDict = {
            address: vaultDetails.result[0],
            quoteAsset: vaultDetails.result[1],
            baseAsset: vaultDetails.result[2],
            owner: vaultDetails.result[3],
            totalShares: vaultDetails.result[4],
            maxShares: vaultDetails.result[5],
            lockup: vaultDetails.result[6],
            locked: vaultDetails.result[7],
            closed: vaultDetails.result[8],
            name: vaultMetaData.name,
            desc: vaultMetaData.description,
            social1: vaultMetaData.social1,
            social2: vaultMetaData.social2,
            social3: vaultMetaData.social3,
            type: 'Spot',
            quoteBalance: 0n,
            baseBalance: 0n,
            userShares: 0n,
          }
          vaultDict.quoteBalance = vaultQuoteBalance.result[0]
          vaultDict.baseBalance = vaultBaseBalance.result[0]
          if (address) {
            vaultDict.userShares = vaultUserBalance.result
          }
          setVaultList([vaultDict]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false); 
      }
    })();
  }, [activeVault, address]);

  const handleCreateVault = async () => {
    if (!account.connected || !createForm.name || !createForm.quoteAsset || !createForm.baseAsset ||
      !createForm.amountQuote || !createForm.amountBase) {
      return;
    }

    await setChain();

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
        createForm.quoteAsset.toLowerCase() === settings.chainConfig[activechain].eth ? amountQuote :
          createForm.baseAsset.toLowerCase() === settings.chainConfig[activechain].eth ? amountBase : 0n;

      console.log('Deploying vault with ETH value:', ethValue.toString());

      const deployUo = {
        target: crystalVaultsAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: CrystalVaultsAbi,
          functionName: "deploy",
          args: [
            (createForm.quoteAsset == settings.chainConfig[activechain].eth ? settings.chainConfig[activechain].weth : createForm.quoteAsset) as `0x${string}`,
            (createForm.baseAsset == settings.chainConfig[activechain].eth ? settings.chainConfig[activechain].weth : createForm.baseAsset) as `0x${string}`,
            amountQuote,
            amountBase,
            createForm.name || 'Unnamed Vault',
            createForm.description || 'No description provided',
            createForm.social1 || '',
            createForm.social2 || '',
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

      setCreateForm(initialCreateForm);
      setShowCreateModal(false);

      refetch?.();

    } catch (e: any) {
      console.error('Vault creation error:', e);
    } finally {
      setIsVaultDepositSigning(false);
    }
  };

  const vaultStrategyIndicatorRef = useRef<HTMLDivElement>(null);
  const vaultStrategyTabsRef = useRef<(HTMLDivElement | null)[]>([]);

  const getTokenIcon = (tokenIdentifier: string) => {
    return tokendict[tokenIdentifier]?.image
  };

  const getTokenName = (tokenIdentifier: string) => {
    return tokendict[tokenIdentifier]?.name
  };

  const getTokenTicker = (tokenIdentifier: string) => {
    return tokendict[tokenIdentifier]?.ticker
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

  const calculateTVL = (vault: any) => {
    return (
      calculateUSDValue(
        vault.quoteBalance,
        tradesByMarket[
        (({ baseAsset, quoteAsset }) =>
          (baseAsset === settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].wethticker : baseAsset) +
          (quoteAsset === settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].wethticker : quoteAsset)
        )(getMarket(vault?.quoteAsset, vault?.baseAsset))
        ],
        vault?.quoteAsset,
        getMarket(vault?.quoteAsset, vault?.baseAsset),
      ) + calculateUSDValue(
        vault.baseBalance,
        tradesByMarket[
        (({ baseAsset, quoteAsset }) =>
          (baseAsset === settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].wethticker : baseAsset) +
          (quoteAsset === settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].wethticker : quoteAsset)
        )(getMarket(vault?.quoteAsset, vault?.baseAsset))
        ],
        vault?.baseAsset,
        getMarket(vault?.quoteAsset, vault?.baseAsset),
      )
    )
  };

  const calculateUserPositionValue = (vault: any) => {
    return calculateTVL(vault) * Number(vault.userShares) / Number(vault.totalShares);
  };

  const filteredVaultStrategies = (vaultList || []).filter((vault: any) => {
    const typeMatch = vaultFilter === 'All' || vault.type === vaultFilter;
    const myVaultsMatch = activeVaultTab === 'all' ||
      (activeVaultTab === 'my-vaults' && address && vault.owner.toLowerCase() === address.toLowerCase());
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
    setShowManagementMenu(false);
    onRouteChange?.('/earn/vaults');
  };

  const selectedVault = selectedVaultStrategy ?
    filteredVaultStrategies.find((vault: any) => vault.address === selectedVaultStrategy) : null;

  const handleVaultManagement = async (action: string) => {
    setShowManagementMenu(false);
    await setChain();

    let deployUo = {
      target: crystalVaultsAddress as `0x${string}`,
      data: '',
      value: 0n,
    };
    switch (action) {
      case 'disable-deposits':
        !selectedVault?.locked ? deployUo.data = encodeFunctionData({
          abi: CrystalVaultsAbi,
          functionName: "lock",
          args: [selectedVault?.address
          ],
        }) : deployUo.data = encodeFunctionData({
          abi: CrystalVaultsAbi,
          functionName: "unlock",
          args: [selectedVault?.address
          ],
        })
        break;
      case 'decrease':
        true ? deployUo.data = encodeFunctionData({
          abi: CrystalVaultsAbi,
          functionName: "changeDecreaseOnWithdraw",
          args: [selectedVault?.address, true
          ],
        }) : deployUo.data = encodeFunctionData({
          abi: CrystalVaultsAbi,
          functionName: "changeDecreaseOnWithdraw",
          args: [selectedVault?.address, false
          ],
        })
        break;
      case 'close':
        deployUo.data = encodeFunctionData({
          abi: CrystalVaultsAbi,
          functionName: "close",
          args: [selectedVault?.address
          ],
        })
        break;
    }

    const deployOp = await sendUserOperationAsync({ uo: deployUo });
    await waitForTxReceipt(deployOp.hash);
  };

  const updateVaultStrategyIndicatorPosition = useCallback((activeTab: string) => {
    if (!vaultStrategyIndicatorRef.current || !vaultStrategyTabsRef.current) {
      return;
    }

    const availableTabs = ['balances', 'deposits', 'withdrawals', 'depositors'];
    const activeTabIndex = availableTabs.findIndex(tab => tab === activeTab);

    if (activeTabIndex !== -1) {
      const activeTabElement = vaultStrategyTabsRef.current[activeTabIndex];
      if (activeTabElement && activeTabElement.parentElement) {
        const indicator = vaultStrategyIndicatorRef.current;
        indicator.style.width = `${activeTabElement.offsetWidth}px`;
        indicator.style.left = `${activeTabElement.offsetLeft}px`;
      }
    }
  }, [selectedVault?.type]);

  useEffect(() => {
    if (selectedVaultStrategy && selectedVault) {
      setTimeout(() => {
        updateVaultStrategyIndicatorPosition(activeVaultStrategyTab);
      }, 0);
    }
  }, [activeVaultStrategyTab, selectedVaultStrategy, selectedVault, updateVaultStrategyIndicatorPosition]);

  useEffect(() => {
    const handleResize = () => {
      if (selectedVaultStrategy && selectedVault) {
        updateVaultStrategyIndicatorPosition(activeVaultStrategyTab);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (showManagementMenu && !(event.target as Element).closest('.vault-management-menu')) {
        setShowManagementMenu(false);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeVaultStrategyTab, selectedVaultStrategy, selectedVault, updateVaultStrategyIndicatorPosition, showManagementMenu]);

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

  const handleMarketChange = useCallback((market: any) => {
    setCreateForm(prev => ({
      ...prev,
      selectedMarket: market,
      quoteAsset: market.quoteAddress,
      baseAsset: market.baseAddress
    }));
  }, []);

  const stableMarketsData = React.useMemo(() => marketsData, [marketsData]);

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
                  <span className="stat-value">
                  {formatUSDDisplay(vaultList.reduce((total: number, vault: any) => total + parseFloat(calculateTVL(vault)), 0))}
                  </span>
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
                  My Vaults ({(vaultList || []).filter((v: any) => address && v.owner.toLowerCase() === address.toLowerCase()).length})
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
                <div className="col vault-deposits-col">Deposit Cap</div>
                <div className="col vault-your-deposits-col">Your Position</div>
                <div className="col vault-age-col">Status</div>
                <div className="col vault-actions-col">Snapshot</div>
              </div>

              {isLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <div key={`skeleton-vault-${index}`} className="vault-row vault-loading">
                    <div className="col vault-name-col">
                      <div className="vault-name-container">
                        <div className="vault-skeleton vault-skeleton-name"></div>
                      </div>
                    </div>
                    <div className="col vault-leader-col">
                      <div className="vault-skeleton vault-skeleton-leader"></div>
                    </div>
                    <div className="col vault-type-col">
                      <div className="vault-skeleton vault-skeleton-type"></div>
                    </div>
                    <div className="col vault-tokens-col">
                      <div className="vault-tokens">
                        <div className="vault-skeleton vault-skeleton-token-icon"></div>
                        <div className="vault-skeleton vault-skeleton-token-icon"></div>
                      </div>
                    </div>
                    <div className="col vault-apy-col">
                      <div className="vault-skeleton vault-skeleton-value"></div>
                    </div>
                    <div className="col vault-deposits-col">
                      <div className="vault-skeleton vault-skeleton-value"></div>
                    </div>
                    <div className="col vault-your-deposits-col">
                      <div className="vault-skeleton vault-skeleton-value"></div>
                    </div>
                    <div className="col vault-age-col">
                      <div className="vault-skeleton vault-skeleton-status"></div>
                    </div>
                    <div className="col vault-snapshot-col">
                      <div className="vault-skeleton vault-skeleton-chart"></div>
                    </div>
                  </div>
                ))
              ) : filteredVaultStrategies.length > 0 ? (
                filteredVaultStrategies.map((vault: any) => (
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
                          <img src={getTokenIcon(vault.quoteAsset)} className="vault-token-icon" />
                        </div>
                        <div className="base-token">
                          <img src={getTokenIcon(vault.baseAsset)} className="vault-token-icon" />
                        </div>
                      </div>
                    </div>

                    <div className="col vault-apy-col">
                      <span className="apy-value">{formatUSDDisplay(calculateTVL(vault))}</span>
                    </div>

                    <div className="col vault-deposits-col">
                      <span className="deposits-value">{BigInt(vault.maxShares) === 0n 
                        ? <span>&#8734;</span> 
                        : `$${formatDisplayValue(BigInt(vault.maxShares), 0)}`}</span>
                    </div>

                    <div className="col vault-your-deposits-col">
                      <span className="deposits-value">{formatUSDDisplay(calculateUserPositionValue(vault))}</span>
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
                ))
              ) : (
                <div className="no-vaults-message">
                  <p>No vaults found matching your criteria.</p>
                </div>
              )}
            </div>
          </>
        )}

        {selectedVaultStrategy && selectedVault && (
          <div className="vault-strategy-detail">
            <div className="vault-strategy-header">
              <div className="vault-strategy-breadcrumb-container">
                <div className="add-liquidity-breadcrumb">
                  <button onClick={backToList} className="breadcrumb-link">
                    Vaults
                  </button>
                  <ChevronLeft size={16} className="earn-breadcrumb-arrow" />
                  <span className="breadcrumb-current">{selectedVault.name}</span>
                </div>

                <div className="vault-detail-action-buttons">
                  <button
                    className={`vault-detail-deposit-btn ${!connected || selectedVault.closed ? 'disabled' : ''}`}
                    onClick={() => {
                      if (!connected) {
                        setpopup(4);
                      } else if (!selectedVault.closed) {
                        setselectedVault(selectedVault);
                        setpopup(22);
                      }
                    }}
                    disabled={!connected || selectedVault.closed}
                  >
                    Deposit
                  </button>

                  <button
                    className={`vault-detail-withdraw-btn ${!connected || parseFloat(selectedVault.userShares || '0') === 0 ? 'disabled' : ''}`}
                    onClick={() => {
                      if (!connected) {
                        setpopup(4);
                      } else if (parseFloat(selectedVault.userShares || '0') > 0) {
                        setselectedVault(selectedVault);
                        setpopup(23);
                      }
                    }}
                    disabled={!connected || parseFloat(selectedVault.userShares || '0') === 0}
                  >
                    Withdraw
                  </button>

                 {address && selectedVault.owner.toLowerCase() === address.toLowerCase() && (
                  <>
                    <button 
                      className="vault-management-trigger"
                      onClick={() => setShowManagementMenu(!showManagementMenu)}
                    >
                      Vault Actions
                      <ChevronDown size={14} />
                    </button>
                    
                    {showManagementMenu && 
                      <div 
                        className="vault-management-menu"
                      >
                        <button 
                          className="vault-management-option"
                          onClick={() => handleVaultManagement('disable-deposits')}
                        >
                          {selectedVault?.locked ? t('Enable Deposits') : t('Disable Deposits')}
                        </button>
                        <button 
                          className="vault-management-option"
                          onClick={() => handleVaultManagement('decrease')}
                        >
                          {true ? t('Enable Decrease On Withdraw') : t('Disable Decrease On Withdraw')}
                        </button>
                        <button 
                          className="vault-management-option vault-close-option"
                          onClick={() => handleVaultManagement('close')}
                        >
                          Close Vault
                        </button>
                      </div>}
                  </>
                )}
                </div>
              </div>

              <div className="vault-strategy-sticky-bar">
                <div className="vault-strategy-info">
                  <h1 className="vault-strategy-name">{selectedVault.name}</h1>
                  <div className="vault-strategy-contract">
                    <span className="contract-label">Contract:</span>
                    <span className="contract-address">{selectedVault.address}</span>
                    <button className="copy-address-btn" title="Copy address">
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>

                <div className="vault-strategy-metrics">
                  <div className="vault-metric">
                    <span className="vault-metric-label">Total Value Locked</span>
                    <span className="vault-metric-value">{formatUSDDisplay(calculateTVL(selectedVault))}</span>
                  </div>
                  <div className="vault-metric">
                    <span className="vault-metric-label">Deposit Cap</span>
                    <span className="vault-metric-value">{BigInt(selectedVault.maxShares) === 0n 
                      ? <span>&#8734;</span> 
                      : `$${formatDisplayValue(BigInt(selectedVault.maxShares), 0)}`}</span>
                  </div>
                  <div className="vault-metric">
                    <span className="vault-metric-label">Your Position Value</span>
                    <span className="vault-metric-value">{formatUSDDisplay(calculateUserPositionValue(selectedVault))}</span>
                  </div>
                  <div className="vault-metric">
                    <span className="vault-metric-label">Status</span>
                    <span className={`vault-metric-value ${selectedVault.closed ? 'metric-negative' : selectedVault.locked ? 'metric-warning' : 'metric-positive'}`}>
                      {selectedVault.closed ? 'Closed' : selectedVault.locked ? 'Locked' : 'Active'}
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
                    <span className="leader-address">{selectedVault.owner}</span>
                  </div>
                  <span className="vault-description">Description:</span>
                  <p className="description-text">{selectedVault.desc}</p>
                  <div className="vault-socials">
                    <span className="vault-description">Socials:</span>
                    {selectedVault.social1 && (
                      <a
                        href={selectedVault.social1}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="twitter-link-description"
                      >
                        <span>Social 1:</span>
                        {selectedVault.social1}
                      </a>
                    )}
                    {selectedVault.social2 && (
                      <a
                        href={selectedVault.social2}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="twitter-link-description"
                      >
                        <span>Social 2:</span>
                        {selectedVault.social2}
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
                      <TimeRangeDropdown 
                        value={vaultStrategyTimeRange}
                        onChange={setVaultStrategyTimeRange}
                      />
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
                            <div className="vault-holdings-col-header">Vault Balance</div>
                            <div className="vault-holdings-col-header">Your Balance</div>
                          </div>
                          <div className="vault-holdings-row">
                            <div className="vault-holding-asset">
                              <img src={getTokenIcon(selectedVault.quoteAsset)} className="vault-holding-icon" />
                              <span>{getTokenName(selectedVault.quoteAsset)}</span>
                            </div>
                            <div className="vault-holdings-col">{getTokenTicker(selectedVault.quoteAsset)}</div>
                            <div className="vault-holdings-col">{formatDisplayValue(BigInt(selectedVault.quoteBalance), Number(tokendict[selectedVault?.quoteAsset]?.decimals || 18))}</div>
                            <div className="vault-holdings-col">{formatDisplayValue(BigInt(selectedVault.quoteBalance * selectedVault.userShares / selectedVault.totalShares), Number(tokendict[selectedVault?.quoteAsset]?.decimals || 18))}</div>
                          </div>
                          <div className="vault-holdings-row">
                            <div className="vault-holding-asset">
                              <img src={getTokenIcon(selectedVault.baseAsset)} className="vault-holding-icon" />
                              <span>{getTokenName(selectedVault.baseAsset)}</span>
                            </div>
                            <div className="vault-holdings-col">{getTokenTicker(selectedVault.baseAsset)}</div>
                            <div className="vault-holdings-col">{formatDisplayValue(BigInt(selectedVault.baseBalance), Number(tokendict[selectedVault?.baseAsset]?.decimals || 18))}</div>
                            <div className="vault-holdings-col">{formatDisplayValue(BigInt(selectedVault.baseBalance * selectedVault.userShares / selectedVault.totalShares), Number(tokendict[selectedVault?.baseAsset]?.decimals || 18))}</div>
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
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Vault</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  <img src={closebutton} className='modal-close-icon' alt="Close" />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Vault Name</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input"
                    placeholder="Enter vault name"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    className="form-textarea"
                    rows={4}
                    placeholder="Describe your vault strategy"
                  />
                </div>

                <div className="form-row">
                <div className="form-group">
  <label>Select Market Pair</label>
  <MarketSelector
    key="create-vault-market-selector"
    value={createForm.selectedMarket}
    onChange={handleMarketChange}
    marketsData={stableMarketsData}
    placeholder="Select trading pair..."
  />
</div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Initial Quote Amount</label>
                    <input
                      type="number"
                      value={createForm.amountQuote}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, amountQuote: e.target.value }))}
                      className="form-input"
                      placeholder="0.0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Initial Base Amount</label>
                    <input
                      type="number"
                      value={createForm.amountBase}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, amountBase: e.target.value }))}
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
                      onChange={(e) => setCreateForm(prev => ({ ...prev, social1: e.target.value }))}
                      className="form-input"
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Social Link 2 (Optional)</label>
                    <input
                      type="text"
                      value={createForm.social2}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, social2: e.target.value }))}
                      className="form-input"
                      placeholder="https://telegram.me/..."
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className={`save-button ${(!createForm.name || !createForm.quoteAsset || !createForm.baseAsset || !createForm.amountQuote || !createForm.amountBase) ? 'disabled' : ''}`}
                  disabled={!createForm.name || !createForm.quoteAsset || !createForm.baseAsset || !createForm.amountQuote || !createForm.amountBase || isVaultDepositSigning}
                  onClick={handleCreateVault}
                >
                  {isVaultDepositSigning ? (
                    <div className="button-content">
                      <div className="loading-spinner"/>
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