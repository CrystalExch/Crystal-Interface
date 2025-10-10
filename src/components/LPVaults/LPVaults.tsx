import {
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  Plus,
  Search,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { encodeFunctionData, getAddress } from 'viem';

import { CrystalVaultsAbi } from '../../abis/CrystalVaultsAbi';
import { settings } from '../../settings';
import { formatSig } from '../OrderCenter/utils';

import './LPVaults.css';

interface LPVaultsProps {
  setpopup: (value: number) => void;
  onSelectToken: (token: { symbol: string; icon: string }) => void;
  setOnSelectTokenCallback?: (
    callback: ((token: { symbol: string; icon: string }) => void) | null,
  ) => void;
  tokendict: { [address: string]: any };
  currentRoute?: string;
  onRouteChange?: (route: string) => void;
  connected: boolean;
  account: any;
  selectedVault: any;
  setselectedVault: any;
  isVaultWithdrawSigning: boolean;
  setIsVaultWithdrawSigning: (signing: boolean) => void;
  sendUserOperationAsync: any;
  setChain: () => void;
  address: string;
  activechain: number;
  crystalVaultsAddress: any;
  formatUSDDisplay: any;
  calculateUSDValue: any;
  tradesByMarket: any;
  getMarket: any;
  vaultList: any;
  isLoading: any;
  depositors: any;
  depositHistory: any;
  withdrawHistory: any;
  openOrders: any;
  allOrders: any;
  selectedVaultStrategy: any;
  setSelectedVaultStrategy: any;
}

interface VaultSnapshotProps {
  vaultId: string;
  performance?: any;
  className?: string;
}

const VaultSnapshot: React.FC<VaultSnapshotProps> = ({
  vaultId,
  className = '',
}) => {
  const generateMockPerformance = (
    trend = 'up',
    volatility = 0.5,
  ): { day: number; value: number }[] => {
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
          <AreaChart
            data={data}
            margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
          >
            <defs>
              <linearGradient
                id={`gradient-${vaultId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={isPositive ? '#aaaecf' : '#d63031'}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={isPositive ? '#aaaecf' : '#d63031'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#aaaecf' : '#d63031'}
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
  currentRoute = '/earn/vaults',
  onRouteChange,
  connected,
  account,
  selectedVault,
  setselectedVault,
  sendUserOperationAsync,
  setChain,
  address,
  activechain,
  crystalVaultsAddress,
  formatUSDDisplay,
  calculateUSDValue,
  tradesByMarket,
  getMarket,
  vaultList,
  isLoading,
  depositors,
  depositHistory,
  withdrawHistory,
  openOrders,
  // allOrders,
  selectedVaultStrategy,
  setSelectedVaultStrategy,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [vaultFilter, setVaultFilter] = useState<'All' | 'Spot' | 'Margin'>(
    'All',
  );
  const [activeVaultTab, setActiveVaultTab] = useState<'all' | 'my-vaults'>(
    'all',
  );
  const [showManagementMenu, setShowManagementMenu] = useState(false);
  const [activeVaultStrategyTab, setActiveVaultStrategyTab] = useState<
    'Balances' | 'Open Orders' | 'Depositors' | 'Deposit History' | 'Withdraw History'
  >('Balances');
  const [activeVaultPerformance, _setActiveVaultPerformance] = useState<any>([
    { name: 'Jan', value: 12.4 },
    { name: 'Feb', value: 14.8 },
    { name: 'Mar', value: 18.2 },
    { name: 'Apr', value: 16.9 },
    { name: 'May', value: 21.3 },
    { name: 'Jun', value: 22.7 },
    { name: 'Jul', value: 24.5 },
  ]);
  const [vaultStrategyTimeRange, setVaultStrategyTimeRange] = useState<
    '1D' | '1W' | '1M' | 'All'
  >('All');
  const [vaultStrategyChartType, setVaultStrategyChartType] = useState<
    'value' | 'pnl'
  >('value');
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);

  const vaultStrategyIndicatorRef = useRef<HTMLDivElement>(null);
  const vaultStrategyTabsRef = useRef<(HTMLDivElement | null)[]>([]);

  const explorer = settings.chainConfig[activechain]?.explorer ?? '';
  const addresstomarket = settings.chainConfig[activechain].addresstomarket;
  const markets = settings.chainConfig[activechain].markets;

  const filteredVaultStrategies = (vaultList || []).filter((vault: any) => {
    const typeMatch = vaultFilter === 'All' || vault.type === vaultFilter;
    const myVaultsMatch =
      activeVaultTab === 'all' ||
      (activeVaultTab === 'my-vaults' &&
        address &&
        vault.owner.toLowerCase() === address.toLowerCase());
    const searchMatch =
      searchQuery === '' ||
      vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vault.owner.toLowerCase().includes(searchQuery.toLowerCase());

    return typeMatch && myVaultsMatch && searchMatch;
  });

  const selectedVaultRef = useRef<any>(null);
  const stableSelectedVault = React.useMemo(() => {
    if (!selectedVaultStrategy) return null;
    const fromList = (vaultList || []).find((v: any) => v.address === selectedVaultStrategy);
    const next = fromList ?? selectedVault ?? selectedVaultRef.current;
    if (next) selectedVaultRef.current = next;
    return next;
  }, [vaultList, selectedVaultStrategy, selectedVault]);

  const getTokenIcon = (tokenIdentifier: string) => {
    return tokendict[tokenIdentifier]?.image;
  };

  const getTokenName = (tokenIdentifier: string) => {
    return tokendict[tokenIdentifier]?.name;
  };

  const getTokenTicker = (tokenIdentifier: string) => {
    return tokendict[tokenIdentifier]?.ticker;
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

  const calculateTVL = (vault: any) => {
    return (
      calculateUSDValue(
        vault.quoteBalance,
        tradesByMarket[
          (({ baseAsset, quoteAsset }) =>
            (baseAsset === settings.chainConfig[activechain].wethticker
              ? settings.chainConfig[activechain].wethticker
              : baseAsset) +
            (quoteAsset === settings.chainConfig[activechain].wethticker
              ? settings.chainConfig[activechain].wethticker
              : quoteAsset))(getMarket(vault?.quoteAsset, vault?.baseAsset))
        ],
        vault?.quoteAsset,
        getMarket(vault?.quoteAsset, vault?.baseAsset),
      ) +
      calculateUSDValue(
        vault.baseBalance,
        tradesByMarket[
          (({ baseAsset, quoteAsset }) =>
            (baseAsset === settings.chainConfig[activechain].wethticker
              ? settings.chainConfig[activechain].wethticker
              : baseAsset) +
            (quoteAsset === settings.chainConfig[activechain].wethticker
              ? settings.chainConfig[activechain].wethticker
              : quoteAsset))(getMarket(vault?.quoteAsset, vault?.baseAsset))
        ],
        vault?.baseAsset,
        getMarket(vault?.quoteAsset, vault?.baseAsset),
      )
    );
  };

  const calculateUserPositionValue = (vault: any) => {
    return vault.totalShares
      ? (calculateTVL(vault) * Number(vault.userShares)) /
          Number(vault.totalShares)
      : 0;
  };

  const showVaultStrategyDetail = (vaultAddress: string) => {
    setSelectedVaultStrategy(vaultAddress);
    setActiveVaultStrategyTab('Balances');
    onRouteChange?.(`/earn/vaults/${vaultAddress}`);
  };

  const backToList = () => {
    setSelectedVaultStrategy(null);
    setShowManagementMenu(false);
    onRouteChange?.('/earn/vaults');
  };

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
        !selectedVault?.locked
          ? (deployUo.data = encodeFunctionData({
              abi: CrystalVaultsAbi,
              functionName: 'lock',
              args: [selectedVault?.address],
            }))
          : (deployUo.data = encodeFunctionData({
              abi: CrystalVaultsAbi,
              functionName: 'unlock',
              args: [selectedVault?.address],
            }));
        break;
      case 'decrease':
        true
          ? (deployUo.data = encodeFunctionData({
              abi: CrystalVaultsAbi,
              functionName: 'changeDecreaseOnWithdraw',
              args: [selectedVault?.address, true],
            }))
          : (deployUo.data = encodeFunctionData({
              abi: CrystalVaultsAbi,
              functionName: 'changeDecreaseOnWithdraw',
              args: [selectedVault?.address, false],
            }));
        break;
      case 'close':
        deployUo.data = encodeFunctionData({
          abi: CrystalVaultsAbi,
          functionName: 'close',
          args: [selectedVault?.address],
        });
        break;
    }

    await sendUserOperationAsync({ uo: deployUo });
  };

  const updateVaultStrategyIndicatorPosition = useCallback(
    (activeTab: string) => {
      if (!vaultStrategyIndicatorRef.current || !vaultStrategyTabsRef.current) {
        return;
      }

      const availableTabs = [
        'Balances',
        'Open Orders',
        'Depositors',
        'Deposit History',
        'Withdraw History'
      ];
      const activeTabIndex = availableTabs.findIndex(
        (tab) => tab === activeTab,
      );

      if (activeTabIndex !== -1) {
        const activeTabElement = vaultStrategyTabsRef.current[activeTabIndex];
        if (activeTabElement && activeTabElement.parentElement) {
          const indicator = vaultStrategyIndicatorRef.current;
          indicator.style.width = `${activeTabElement.offsetWidth}px`;
          indicator.style.left = `${activeTabElement.offsetLeft}px`;
        }
      }
    },
    [selectedVault?.type],
  );

  useEffect(() => {
    if (selectedVaultStrategy && selectedVault) {
      setTimeout(() => {
        updateVaultStrategyIndicatorPosition(activeVaultStrategyTab);
      }, 0);
    }
  }, [
    activeVaultStrategyTab,
    selectedVaultStrategy,
    selectedVault,
    updateVaultStrategyIndicatorPosition,
  ]);

  useEffect(() => {
    const handleResize = () => {
      if (selectedVaultStrategy && selectedVault) {
        updateVaultStrategyIndicatorPosition(activeVaultStrategyTab);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        showManagementMenu &&
        !(event.target as Element).closest('.vault-management-menu')
      ) {
        setShowManagementMenu(false);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [
    activeVaultStrategyTab,
    selectedVaultStrategy,
    selectedVault,
    updateVaultStrategyIndicatorPosition,
    showManagementMenu,
  ]);

  useEffect(() => {
    if (!currentRoute.startsWith('/earn/vaults')) return;

    const parts = currentRoute.split('/');
    const addr = parts.length >= 4 ? parts[3] : null;

    if (!addr) {
      setSelectedVaultStrategy(null);
      return;
    }

    const v = (vaultList || []).find((x: any) => x.address === addr);
    if (v && selectedVaultStrategy !== v.address) {
      setSelectedVaultStrategy(v.address);
      setActiveVaultStrategyTab('Balances');
    }
  }, [currentRoute, vaultList, selectedVaultStrategy]);

  return (
    <div className="vaults-page-container">
      <div className="lp-content-wrapper">
        {!selectedVaultStrategy && (
          <>
            <div className="vaults-header">
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
                  My Vaults (
                  {
                    (vaultList || []).filter(
                      (v: any) =>
                        address &&
                        v.owner.toLowerCase() === address.toLowerCase(),
                    ).length
                  }
                  )
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
                  <Search size={16} className="lp-search-icon" />
                  <input
                    type="text"
                    placeholder="Search"
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
                  <div
                    key={`skeleton-vault-${index}`}
                    className="vault-row vault-loading"
                  >
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
                    <div className="col vault-actions-col">
                      <div className="vault-skeleton vault-skeleton-chart"></div>
                    </div>
                  </div>
                ))
              ) : filteredVaultStrategies.length > 0 ? (
                filteredVaultStrategies.map((vault: any) => (
                  <div
                    key={vault.address}
                    className="vault-row"
                    onClick={() => showVaultStrategyDetail(vault.address)}
                  >
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
                        <span className="leader-token-name">
                          {vault.owner.slice(0, 6)}...{vault.owner.slice(-4)}
                        </span>
                      </div>
                    </div>

                    <div className="col vault-type-col">
                      <span
                        className={`vault-type-badge ${vault.type.toLowerCase()}`}
                      >
                        {vault.type}
                      </span>
                    </div>

                    <div className="col vault-tokens-col">
                      <div className="vault-tokens">
                        <div className="quote-token">
                          <img
                            src={getTokenIcon(vault.quoteAsset)}
                            className="vault-token-icon"
                          />
                        </div>
                        <div className="base-token">
                          <img
                            src={getTokenIcon(vault.baseAsset)}
                            className="vault-token-icon"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col vault-apy-col">
                      <span className="apy-value">
                        {formatUSDDisplay(calculateTVL(vault))}
                      </span>
                    </div>

                    <div className="col vault-deposits-col">
                      <span className="deposits-value">
                        {BigInt(vault.maxShares) === 0n ? (
                          <span>&#8734;</span>
                        ) : (
                          `$${formatDisplayValue(BigInt(vault.maxShares), 0)}`
                        )}
                      </span>
                    </div>

                    <div className="col vault-your-deposits-col">
                      <span className="deposits-value">
                        {formatUSDDisplay(calculateUserPositionValue(vault))}
                      </span>
                    </div>

                    <div className="col vault-age-col">
                      <span
                        className={`age-value ${vault.closed ? 'closed' : vault.locked ? 'locked' : 'active'}`}
                      >
                        {vault.closed
                          ? 'Closed'
                          : vault.locked
                            ? 'Locked'
                            : 'Active'}
                      </span>
                    </div>

                    <div className="col vault-actions-col">
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

        {selectedVaultStrategy && stableSelectedVault && (
          <div className="vault-strategy-detail">
            <div className="vault-strategy-header">
              <div className="vault-strategy-breadcrumb-container">
                <div className="add-liquidity-breadcrumb">
                  <button onClick={backToList} className="breadcrumb-link">
                    Vaults
                  </button>
                  <ChevronLeft size={16} className="earn-breadcrumb-arrow" />
                  <span className="breadcrumb-current">
                    {stableSelectedVault.name}
                  </span>
                </div>

                <div className="vault-detail-action-buttons">
                  <button
                    className={`vault-detail-deposit-btn ${!connected || stableSelectedVault.closed ? 'disabled' : ''}`}
                    onClick={() => {
                      if (!connected) {
                        setpopup(4);
                      } else if (!stableSelectedVault.closed) {
                        setselectedVault(stableSelectedVault);
                        setpopup(22);
                      }
                    }}
                    disabled={!connected || stableSelectedVault.closed}
                  >
                    Deposit
                  </button>

                  <button
                    className={`vault-detail-withdraw-btn ${!connected || parseFloat(stableSelectedVault.userShares || '0') === 0 ? 'disabled' : ''}`}
                    onClick={() => {
                      if (!connected) {
                        setpopup(4);
                      } else if (
                        parseFloat(stableSelectedVault.userShares || '0') > 0
                      ) {
                        setselectedVault(stableSelectedVault);
                        setpopup(23);
                      }
                    }}
                    disabled={
                      !connected ||
                      parseFloat(stableSelectedVault.userShares || '0') === 0
                    }
                  >
                    Withdraw
                  </button>

                  {address &&
                    stableSelectedVault.owner.toLowerCase() ===
                      address.toLowerCase() && (
                      <>
                        <button
                          className="vault-management-trigger"
                          onClick={() =>
                            setShowManagementMenu(!showManagementMenu)
                          }
                        >
                          Vault Actions
                          <ChevronDown size={14} />
                        </button>

                        {showManagementMenu && (
                          <div className="vault-management-menu">
                            <button
                              className="vault-management-option"
                              onClick={() =>
                                handleVaultManagement('disable-deposits')
                              }
                            >
                              {stableSelectedVault?.locked
                                ? t('Enable Deposits')
                                : t('Disable Deposits')}
                            </button>
                            <button
                              className="vault-management-option"
                              onClick={() => handleVaultManagement('decrease')}
                            >
                              {true
                                ? t('Enable Decrease On Withdraw')
                                : t('Disable Decrease On Withdraw')}
                            </button>
                            <button
                              className="vault-management-option vault-close-option"
                              onClick={() => handleVaultManagement('close')}
                            >
                              Close Vault
                            </button>
                          </div>
                        )}
                      </>
                    )}
                </div>
              </div>

              <div className="vault-strategy-sticky-bar">
                <div className="vault-strategy-info">
                  <div className="vault-strategy-name">
                    {stableSelectedVault.name}
                  </div>
                  <div className="vault-strategy-contract">
                    <span className="contract-label">Vault Address:</span>
                    <span className="contract-address">
                      {getAddress(stableSelectedVault.address)}
                    </span>
                    <a
                      className="copy-address-btn"
                      href={`${explorer}/address/${stableSelectedVault.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                <div className="vault-strategy-metrics">
                  <div className="vault-metric">
                    <span className="vault-metric-label">
                      Total Value Locked
                    </span>
                    <span className="vault-metric-value">
                      {formatUSDDisplay(calculateTVL(stableSelectedVault))}
                    </span>
                  </div>
                  <div className="vault-metric">
                    <span className="vault-metric-label">Deposit Cap</span>
                    <span className="vault-metric-value">
                      {BigInt(stableSelectedVault.maxShares) === 0n ? (
                        <span>&#8734;</span>
                      ) : (
                        `$${formatDisplayValue(BigInt(stableSelectedVault.maxShares), 0)}`
                      )}
                    </span>
                  </div>
                  <div className="vault-metric">
                    <span className="vault-metric-label">
                      Your Position Value
                    </span>
                    <span className="vault-metric-value">
                      {formatUSDDisplay(
                        calculateUserPositionValue(stableSelectedVault),
                      )}
                    </span>
                  </div>
                  <div className="vault-metric">
                    <span className="vault-metric-label">Status</span>
                    <span
                      className={`vault-metric-value ${stableSelectedVault.closed ? 'metric-negative' : stableSelectedVault.locked ? 'metric-warning' : 'metric-positive'}`}
                    >
                      {stableSelectedVault.closed
                        ? 'Closed'
                        : stableSelectedVault.locked
                          ? 'Locked'
                          : 'Active'}
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
                    <span className="leader-address">
                      {getAddress(stableSelectedVault.owner).slice(0, 6)}...
                      {getAddress(stableSelectedVault.owner).slice(-4)}
                    </span>
                  </div>
                  <span className="vault-description">Description</span>
                  <p className="description-text">{stableSelectedVault.desc}</p>
                  <div className="vault-socials">
                    {(stableSelectedVault.social1 || stableSelectedVault.social2) && (
                      <span className="vault-description">Socials</span>
                    )}
                    {stableSelectedVault.social1 && (
                      <a
                        href={stableSelectedVault.social1}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="twitter-link-description"
                      >
                        <span>Social 1:</span>
                        {stableSelectedVault.social1}
                      </a>
                    )}
                    {stableSelectedVault.social2 && (
                      <a
                        href={stableSelectedVault.social2}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="twitter-link-description"
                      >
                        <span>Social 2:</span>
                        {stableSelectedVault.social2}
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
                          if (
                            !e.currentTarget.contains(e.relatedTarget as Node)
                          ) {
                            setShowTimeRangeDropdown(false);
                          }
                        }}
                        tabIndex={-1}
                      >
                        <button
                          className="time-range-select-button"
                          onClick={() =>
                            setShowTimeRangeDropdown(!showTimeRangeDropdown)
                          }
                        >
                          {vaultStrategyTimeRange === 'All'
                            ? 'All-time'
                            : vaultStrategyTimeRange}
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
                          <linearGradient
                            id="vaultPerformanceGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#aaaecf"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="50%"
                              stopColor="#aaaecf"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="100%"
                              stopColor="#aaaecf"
                              stopOpacity={0}
                            />
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
                            color: '#fff',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#aaaecf"
                          strokeWidth={2}
                          fill="url(#vaultPerformanceGrad)"
                          dot={false}
                          activeDot={{
                            r: 4,
                            fill: 'rgb(6,6,6)',
                            stroke: '#aaaecf',
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="vault-strategy-tabs">
                <div className="vault-strategy-tabs-container">
                  <div className="vault-strategy-types-rectangle">
                    {(
                      [
                        'Balances',
                        'Open Orders',
                        'Depositors',
                        'Deposit History',
                        'Withdraw History',
                      ] as const
                    ).map((tab, index) => (
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
                  <div
                    ref={vaultStrategyIndicatorRef}
                    className="vault-strategy-sliding-indicator"
                  />
                </div>
                <div className="vault-tab-content">
                  {activeVaultStrategyTab === 'Balances' && (
                    <div className="balances-tab">
                      <div className="vault-holdings">
                        <div className="vault-holdings-table">
                          <div className="vault-holdings-header">
                            <div className="vault-holdings-col-header">
                              Asset
                            </div>
                            <div className="vault-holdings-col-header">
                              Symbol
                            </div>
                            <div className="vault-holdings-col-header">
                              Vault Balance
                            </div>
                            <div className="vault-holdings-col-header">
                              Your Balance
                            </div>
                          </div>
                          <div className="vault-holdings-row">
                            <div className="vault-holding-asset">
                              <img
                                src={getTokenIcon(stableSelectedVault.quoteAsset)}
                                className="vault-holding-icon"
                              />
                              <span>
                                {getTokenName(stableSelectedVault.quoteAsset)}
                              </span>
                            </div>
                            <div className="vault-holdings-col">
                              {getTokenTicker(stableSelectedVault.quoteAsset)}
                            </div>
                            <div className="vault-holdings-col">
                              {formatDisplayValue(
                                BigInt(stableSelectedVault.quoteBalance),
                                Number(
                                  tokendict[stableSelectedVault?.quoteAsset]
                                    ?.decimals || 18,
                                ),
                              )}
                            </div>
                            <div className="vault-holdings-col">
                              {formatDisplayValue(
                                BigInt(
                                  stableSelectedVault.totalShares
                                    ? (stableSelectedVault.quoteBalance *
                                        stableSelectedVault.userShares) /
                                        stableSelectedVault.totalShares
                                    : 0n,
                                ),
                                Number(
                                  tokendict[stableSelectedVault?.quoteAsset]
                                    ?.decimals || 18,
                                ),
                              )}
                            </div>
                          </div>
                          <div className="vault-holdings-row">
                            <div className="vault-holding-asset">
                              <img
                                src={getTokenIcon(stableSelectedVault.baseAsset)}
                                className="vault-holding-icon"
                              />
                              <span>
                                {getTokenName(stableSelectedVault.baseAsset)}
                              </span>
                            </div>
                            <div className="vault-holdings-col">
                              {getTokenTicker(stableSelectedVault.baseAsset)}
                            </div>
                            <div className="vault-holdings-col">
                              {formatDisplayValue(
                                BigInt(stableSelectedVault.baseBalance),
                                Number(
                                  tokendict[stableSelectedVault?.baseAsset]
                                    ?.decimals || 18,
                                ),
                              )}
                            </div>
                            <div className="vault-holdings-col">
                              {formatDisplayValue(
                                BigInt(
                                  stableSelectedVault.totalShares
                                    ? (stableSelectedVault.baseBalance *
                                        stableSelectedVault.userShares) /
                                        stableSelectedVault.totalShares
                                    : 0n,
                                ),
                                Number(
                                  tokendict[stableSelectedVault?.baseAsset]
                                    ?.decimals || 18,
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeVaultStrategyTab === 'Depositors' && (
                    <div className="balances-tab">
                      <div className="vault-depositors">
                        {depositors.length === 0 ? (
                          <p>No depositors yet.</p>
                        ) : (
                          <div className="vault-depositors-table">
                            <div className="vault-depositors-header">
                              <div className="vault-depositors-col-header">
                                Account
                              </div>
                              <div className="vault-depositors-col-header">
                                Vault Share
                              </div>
                              <div className="vault-depositors-col-header">
                                Deposits
                              </div>
                              <div className="vault-depositors-col-header">
                                Withdrawals
                              </div>
                              <div className="vault-depositors-col-header">
                                Last Deposit
                              </div>
                              <div className="vault-depositors-col-header">
                                Last Withdraw
                              </div>
                            </div>
                            {depositors.map((d: any) => (
                              <div key={d.id} className="vault-depositors-row">
                                <div className="vault-depositors-col">
                                  {d.account?.id
                                    ? `${getAddress(d.account.id).slice(0, 6)}...${getAddress(d.account.id).slice(-4)}`
                                    : ''}
                                </div>
                                <div className="vault-depositors-col">
                                  {(d.shares * 100 / Number(stableSelectedVault.totalShares)).toFixed(2)}%
                                </div>
                                <div className="vault-depositors-col">
                                  {d.depositCount}
                                </div>
                                <div className="vault-depositors-col">
                                  {d.withdrawCount}
                                </div>
                                <div className="vault-depositors-col">
                                  {(() => {
                                    const ts =
                                      d.lastDepositAt == null
                                        ? null
                                        : Number(d.lastDepositAt);
                                    if (!ts) return 'N/A';
                                    const dt = new Date(ts * 1000);
                                    const pad = (n: number) =>
                                      n.toString().padStart(2, '0');
                                    return `${pad(dt.getMonth() + 1)}/${pad(dt.getDate())}, ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
                                  })()}
                                </div>

                                <div className="vault-depositors-col">
                                  {(() => {
                                    const ts =
                                      d.lastWithdrawAt == null
                                        ? null
                                        : Number(d.lastWithdrawAt);
                                    if (!ts) return 'N/A';
                                    const dt = new Date(ts * 1000);
                                    const pad = (n: number) =>
                                      n.toString().padStart(2, '0');
                                    return `${pad(dt.getMonth() + 1)}/${pad(dt.getDate())}, ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
                                  })()}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeVaultStrategyTab === 'Deposit History' && (
                    <div className="balances-tab">
                      <div className="vault-dh">
                        {depositHistory.length === 0 ? (
                          <p>No deposits yet.</p>
                        ) : (
                          <div className="vault-dh-table">
                            <div className="vault-dh-header">
                              <div className="vault-dh-col-header">Time</div>
                              <div className="vault-dh-col-header">Account</div>
                              <div className="vault-dh-col-header">Quote</div>
                              <div className="vault-dh-col-header">Base</div>
                              <div className="vault-dh-col-header">Tx</div>
                            </div>
                            {depositHistory.map((e: any) => (
                              <div key={e.id} className="vault-dh-row">
                                <div className="vault-depositors-col">
                                  {(() => {
                                    const ts =
                                      e.timestamp == null
                                        ? null
                                        : Number(e.timestamp);
                                    if (!ts) return 'N/A';
                                    const dt = new Date(ts * 1000);
                                    const pad = (n: number) =>
                                      n.toString().padStart(2, '0');
                                    return `${pad(dt.getMonth() + 1)}/${pad(dt.getDate())}, ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
                                  })()}
                                </div>
                                <div className="vault-dh-col">
                                  {e.account?.id
                                    ? `${getAddress(e.account.id).slice(0, 6)}...${getAddress(e.account.id).slice(-4)}`
                                    : ''}
                                </div>
                                <div className="vault-dh-col">
                                  {formatDisplayValue(
                                    e.amountQuote, stableSelectedVault.quoteDecimals
                                  )}{' '}
                                  {stableSelectedVault.quoteTicker}
                                </div>
                                <div className="vault-dh-col">
                                  {formatDisplayValue(
                                    e.amountBase, stableSelectedVault.baseDecimals
                                  )}{' '}
                                  {stableSelectedVault.baseTicker}
                                </div>
                                <div className="vault-dh-col">
                                  <a
                                    href={`${explorer}/tx/${e.txHash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <svg
                                      className="txn-link"
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="13"
                                      height="13"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      onMouseEnter={(e) =>
                                        (e.currentTarget.style.color =
                                          '#73758b')
                                      }
                                      onMouseLeave={(e) =>
                                        (e.currentTarget.style.color =
                                          '#b7bad8')
                                      }
                                    >
                                      <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                                      <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
                                    </svg>
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeVaultStrategyTab === 'Withdraw History' && (
                    <div className="balances-tab">
                      <div className="vault-dh">
                        {withdrawHistory.length === 0 ? (
                          <p>No withdrawals yet.</p>
                        ) : (
                          <div className="vault-dh-table">
                            <div className="vault-dh-header">
                              <div className="vault-dh-col-header">Time</div>
                              <div className="vault-dh-col-header">Account</div>
                              <div className="vault-dh-col-header">Quote</div>
                              <div className="vault-dh-col-header">Base</div>
                              <div className="vault-dh-col-header">Tx</div>
                            </div>
                            {withdrawHistory.map((e: any) => (
                              <div key={e.id} className="vault-dh-row">
                                <div className="vault-depositors-col">
                                  {(() => {
                                    const ts =
                                      e.timestamp == null
                                        ? null
                                        : Number(e.timestamp);
                                    if (!ts) return 'N/A';
                                    const dt = new Date(ts * 1000);
                                    const pad = (n: number) =>
                                      n.toString().padStart(2, '0');
                                    return `${pad(dt.getMonth() + 1)}/${pad(dt.getDate())}, ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
                                  })()}
                                </div>
                                <div className="vault-dh-col">
                                  {e.account?.id
                                    ? `${getAddress(e.account.id).slice(0, 6)}...${getAddress(e.account.id).slice(-4)}`
                                    : ''}
                                </div>
                                <div className="vault-dh-col">
                                  {formatDisplayValue(
                                    e.amountQuote, stableSelectedVault.quoteDecimals
                                  )}{' '}
                                  {stableSelectedVault.quoteTicker}
                                </div>
                                <div className="vault-dh-col">
                                  {formatDisplayValue(
                                    e.amountBase, stableSelectedVault.baseDecimals
                                  )}{' '}
                                  {stableSelectedVault.baseTicker}
                                </div>
                                <div className="vault-dh-col">
                                  <a
                                    href={`${explorer}/tx/${e.txHash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <svg
                                      className="txn-link"
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="13"
                                      height="13"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      onMouseEnter={(e) =>
                                        (e.currentTarget.style.color =
                                          '#73758b')
                                      }
                                      onMouseLeave={(e) =>
                                        (e.currentTarget.style.color =
                                          '#b7bad8')
                                      }
                                    >
                                      <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                                      <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
                                    </svg>
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeVaultStrategyTab === 'Open Orders' && (
                    <div className="balances-tab">
                      <div className="vault-oo">
                        {openOrders.length === 0 ? (
                          <p>No open orders.</p>
                        ) : (
                          <div className="vault-oo-table">
                            <div className="vault-oo-header">
                              <div className="vault-oo-col-header">ID</div>
                              <div className="vault-oo-col-header">Market</div>
                              <div className="vault-oo-col-header">Side</div>
                              <div className="vault-oo-col-header">Price</div>
                              <div className="vault-oo-col-header">
                                Original
                              </div>
                              <div className="vault-oo-col-header">
                                Remaining
                              </div>
                              <div className="vault-oo-col-header">Status</div>
                              <div className="vault-oo-col-header">
                                Timestamp
                              </div>
                              <div className="vault-oo-col-header">Tx</div>
                            </div>
                            {openOrders.map((o: any) => (
                              <div key={o.id} className="vault-oo-row">
                                <div className="vault-oo-col">
                                  {o.id.split(':').slice(-1)[0]}
                                </div>
                                <div className="vault-oo-col">
                                  {(() => {
                                    const m =
                                      markets?.[
                                        addresstomarket?.[o.market?.id]
                                      ];
                                    return `${m.baseAsset} / ${m.quoteAsset}`;
                                  })()}
                                </div>
                                <div className="vault-oo-col">
                                  {o.isBuy ? 'BUY' : 'SELL'}
                                </div>
                                <div className="vault-oo-col">
                                  {(() => {
                                    const m =
                                      markets?.[
                                        addresstomarket?.[o.market?.id]
                                      ];
                                    if (!m) return String(o.price);
                                    const pf =
                                      typeof m.priceFactor === 'bigint'
                                        ? Number(m.priceFactor)
                                        : m.priceFactor;
                                    const pNum = Number(o.price) / (pf || 1);
                                    return `${formatSig(pNum.toString())}`;
                                  })()}
                                </div>
                                <div className="vault-oo-col">
                                  {(() => {
                                    const m =
                                      markets?.[
                                        addresstomarket?.[o.market?.id]
                                      ];
                                    if (!m) return String(o.originalSize);
                                    const dec = o.isBuy
                                      ? m.quoteDecimals
                                      : m.baseDecimals;
                                    const d =
                                      typeof dec === 'bigint'
                                        ? Number(dec)
                                        : dec;
                                    const denom = 10 ** (d || 0);
                                    const amt = Number(o.originalSize) / denom;
                                    const sym = o.isBuy
                                      ? m.quoteAsset
                                      : m.baseAsset;
                                    return `${amt.toFixed(2)} ${sym}`;
                                  })()}
                                </div>
                                <div className="vault-oo-col">
                                  {(() => {
                                    const m =
                                      markets?.[
                                        addresstomarket?.[o.market?.id]
                                      ];
                                    if (!m) return String(o.remainingSize);
                                    const dec = o.isBuy
                                      ? m.quoteDecimals
                                      : m.baseDecimals;
                                    const d =
                                      typeof dec === 'bigint'
                                        ? Number(dec)
                                        : dec;
                                    const denom = 10 ** (d || 0);
                                    const amt = Number(o.remainingSize) / denom;
                                    const sym = o.isBuy
                                      ? m.quoteAsset
                                      : m.baseAsset;
                                    return `${amt.toFixed(2)} ${sym}`;
                                  })()}
                                </div>
                                <div className="vault-oo-col">
                                  {(() => {
                                    const s = Number(o.status);
                                    return s === 2
                                      ? 'Open'
                                      : s === 1
                                        ? 'Filled'
                                        : s === 0
                                          ? 'Cancelled'
                                          : String(o.status);
                                  })()}
                                </div>
                                <div className="vault-oo-col">
                                  {(() => {
                                    const ts = o.placedAt ?? o.updatedAt;
                                    if (!ts) return 'N/A';
                                    const dt = new Date(ts * 1000);
                                    const pad = (n: number) =>
                                      n.toString().padStart(2, '0');
                                    return `${pad(dt.getMonth() + 1)}/${pad(dt.getDate())}, ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
                                  })()}
                                </div>
                                <div className="vault-oo-col">
                                  <a
                                    href={`${explorer}/tx/${o.txHash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <svg
                                      className="txn-link"
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="13"
                                      height="13"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      onMouseEnter={(e) =>
                                        (e.currentTarget.style.color =
                                          '#73758b')
                                      }
                                      onMouseLeave={(e) =>
                                        (e.currentTarget.style.color =
                                          '#b7bad8')
                                      }
                                    >
                                      <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                                      <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
                                    </svg>
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
