import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronLeft, Plus, Search, ExternalLink } from 'lucide-react';
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
import { CrystalDataHelperAbi } from '../../abis/CrystalDataHelperAbi';

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
  const [activeVault, _setActiveVault] = useState('0xd2043038d90600A6057c8fcD5f04c8D9B0E0f9F3' as `0x${string}`);
  const [vaultList, setVaultList] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vaultFilter, setVaultFilter] = useState<'All' | 'Spot' | 'Margin'>('All');
  const [activeVaultTab, setActiveVaultTab] = useState<'all' | 'my-vaults'>('all');
  const [showManagementMenu, setShowManagementMenu] = useState(false);

  const [activeVaultStrategyTab, setActiveVaultStrategyTab] = useState<any>('balances');
  const [activeVaultPerformance, setActiveVaultPerformance] = useState<any>([
    { name: 'Jan', value: 12.4 },
    { name: 'Feb', value: 14.8 },
    { name: 'Mar', value: 18.2 },
    { name: 'Apr', value: 16.9 },
    { name: 'May', value: 21.3 },
    { name: 'Jun', value: 22.7 },
    { name: 'Jul', value: 24.5 },
  ])
  const [vaultStrategyTimeRange, setVaultStrategyTimeRange] = useState<'1D' | '1W' | '1M' | 'All'>('All');
  const [vaultStrategyChartType, setVaultStrategyChartType] = useState<'value' | 'pnl'>('value');

  useEffect(() => {
    setIsLoading(true);

    (async () => {
      try {
        const [vaultDetails, vaultUserBalance] = (await readContracts(config, {
          contracts: [
            { abi: CrystalDataHelperAbi as any, address: settings.chainConfig[activechain].balancegetter, functionName: 'getVaultsInfo', args: [crystalVaultsAddress, [activeVault]] },
            ...(address ? [{
              abi: TokenAbi,
              address: activeVault,
              functionName: 'balanceOf',
              args: [address as `0x${string}`],
            }] : [])],
        })) as any[];
        if (vaultDetails?.status === "success") {
          const vaultMetaData = vaultDetails.result[0].metadata;
          const vaultDict = {
            address: activeVault,
            quoteAsset: vaultDetails.result[0].quoteAsset,
            baseAsset: vaultDetails.result[0].baseAsset,
            owner: vaultDetails.result[0].owner,
            totalShares: vaultDetails.result[0].totalShares,
            maxShares: vaultDetails.result[0].maxShares,
            lockup: vaultDetails.result[0].lockup,
            locked: vaultDetails.result[0].locked,
            closed: vaultDetails.result[0].closed,
            name: vaultMetaData.name,
            desc: vaultMetaData.description,
            social1: vaultMetaData.social1,
            social2: vaultMetaData.social2,
            social3: vaultMetaData.social3,
            type: 'Spot',
            quoteDecimals: vaultDetails.result[0].quoteDecimals,
            baseDecimals: vaultDetails.result[0].baseDecimals,
            quoteBalance: vaultDetails.result[0].quoteBalance,
            baseBalance: vaultDetails.result[0].baseBalance,
            userShares: 0n,
          }
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
    return vault.totalShares ? calculateTVL(vault) * Number(vault.userShares) / Number(vault.totalShares) : 0;
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
  };
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);

  const updateVaultStrategyIndicatorPosition = useCallback((activeTab: string) => {
    if (!vaultStrategyIndicatorRef.current || !vaultStrategyTabsRef.current) {
      return;
    }

    const availableTabs = ['balances', 'open Orders', 'depositors', 'deposit History'];
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
                    setpopup(29); 
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
                  <div key={vault.address} className="vault-row" onClick={() => showVaultStrategyDetail(vault.address)}>
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
                  <div className="vault-strategy-name">{selectedVault.name}</div>
                  <div className="vault-strategy-contract">
                    <span className="contract-label">Vault Address:</span>
                    <span className="contract-address">{selectedVault.address}</span>
                    <a className="copy-address-btn" href={`${explorer}/address/${selectedVault.address}`}
                          target="_blank"
                          rel="noopener noreferrer">
                      <ExternalLink size={14} />
                    </a>
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
                    <span className="leader-label">Vault Leader</span>
                    <span className="leader-address">{selectedVault.owner.slice(0, 6)}...{selectedVault.owner.slice(-4)}</span>
                  </div>
                  <span className="vault-description">Description</span>
                  <p className="description-text">{selectedVault.desc}</p>
                  <div className="vault-socials">
                    {(selectedVault.social1 || selectedVault.social2) && (
                      <span className="vault-description">Socials</span>
                    )}
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
                      <div
                        className="time-range-dropdown-container"
                        onBlur={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            setShowTimeRangeDropdown(false);
                          }
                        }}
                        tabIndex={-1}
                      >
                        <button
                          className="time-range-select-button"
                          onClick={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
                        >
                          {vaultStrategyTimeRange === 'All' ? 'All-time' : vaultStrategyTimeRange}
                          <ChevronDown size={14} />
                        </button>

                        {showTimeRangeDropdown && (
                          <div className="time-range-dropdown-portal">
                            <button
                              className={`time-range-option ${vaultStrategyTimeRange === '1D' ? 'active' : ''}`}
                              onClick={() => {
                                setVaultStrategyTimeRange('1D');
                                setShowTimeRangeDropdown(false);
                              }}
                            >
                              1D
                            </button>
                            <button
                              className={`time-range-option ${vaultStrategyTimeRange === '1W' ? 'active' : ''}`}
                              onClick={() => {
                                setVaultStrategyTimeRange('1W');
                                setShowTimeRangeDropdown(false);
                              }}
                            >
                              1W
                            </button>
                            <button
                              className={`time-range-option ${vaultStrategyTimeRange === '1M' ? 'active' : ''}`}
                              onClick={() => {
                                setVaultStrategyTimeRange('1M');
                                setShowTimeRangeDropdown(false);
                              }}
                            >
                              1M
                            </button>
                            <button
                              className={`time-range-option ${vaultStrategyTimeRange === 'All' ? 'active' : ''}`}
                              onClick={() => {
                                setVaultStrategyTimeRange('All');
                                setShowTimeRangeDropdown(false);
                              }}
                            >
                              All-time
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="performance-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activeVaultPerformance}>
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
                    {(['balances', 'open Orders', 'depositors', 'deposit History'] as const).map((tab, index) => (
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
                            <div className="vault-holdings-col">{formatDisplayValue(BigInt(selectedVault.totalShares ? selectedVault.quoteBalance * selectedVault.userShares / selectedVault.totalShares : 0n), Number(tokendict[selectedVault?.quoteAsset]?.decimals || 18))}</div>
                          </div>
                          <div className="vault-holdings-row">
                            <div className="vault-holding-asset">
                              <img src={getTokenIcon(selectedVault.baseAsset)} className="vault-holding-icon" />
                              <span>{getTokenName(selectedVault.baseAsset)}</span>
                            </div>
                            <div className="vault-holdings-col">{getTokenTicker(selectedVault.baseAsset)}</div>
                            <div className="vault-holdings-col">{formatDisplayValue(BigInt(selectedVault.baseBalance), Number(tokendict[selectedVault?.baseAsset]?.decimals || 18))}</div>
                            <div className="vault-holdings-col">{formatDisplayValue(BigInt(selectedVault.totalShares ? selectedVault.baseBalance * selectedVault.userShares / selectedVault.totalShares : 0n), Number(tokendict[selectedVault?.baseAsset]?.decimals || 18))}</div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {(activeVaultStrategyTab === 'open Orders' || activeVaultStrategyTab === 'depositors' || activeVaultStrategyTab === 'deposit History') && (
                    <div className="vault-data-tab">
                      <p>No data available for {activeVaultStrategyTab}.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LPVaults;