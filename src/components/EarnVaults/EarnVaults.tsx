import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, ChevronDown, ChevronLeft, Info, Plus, Minus, TrendingUp, Search, Star } from 'lucide-react';
import './EarnVaults.css';
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

interface Vault {
  id: string;
  name: string;
  tokens: {
    first: {
      symbol: string;
      icon: string;
    };
    second: {
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

interface TokenDeposit {
  symbol: string;
  icon: string;
  amount: string;
  usdValue: string;
  selected: boolean;
}

interface Token {
  symbol: string;
  icon: string;
  name: string;
  address: string;
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
  { date: 'Feb 1', tvl: 50 },
  { date: 'Mar 1', tvl: 75 },
  { date: 'Apr 1', tvl: 120 },
  { date: 'May 1', tvl: 160 },
  { date: 'Jun 1', tvl: 178 },
];

const apyTrendData = [
  { date: 'Feb 1', supplyApy: 8.5, borrowApy: 12.2 },
  { date: 'Mar 1', supplyApy: 9.2, borrowApy: 13.0 },
  { date: 'Apr 1', supplyApy: 10.8, borrowApy: 14.5 },
  { date: 'May 1', supplyApy: 11.5, borrowApy: 15.1 },
  { date: 'Jun 1', supplyApy: 12.0, borrowApy: 16.3 },
];
const TIME_RANGES = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
  all: tvlData.length,
};

const VaultEarnVaults: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'deposited'>('all');
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('0.00');
  const [sliderValue, setSliderValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
 const [range, setRange] = useState<keyof typeof TIME_RANGES>("all");
  const sliceCount = TIME_RANGES[range];
  const slicedTvl = tvlData.slice(-sliceCount);
  const slicedApy = apyTrendData.slice(-sliceCount);
  const { favorites, toggleFavorite } = useSharedContext();

  const [depositTokens, setDepositTokens] = useState<TokenDeposit[]>([
    {
      symbol: 'SUI',
      icon: iconmonad,
      amount: '0.00',
      usdValue: '0.00',
      selected: true
    },
    {
      symbol: 'USDC',
      icon: iconusdc,
      amount: '0.00',
      usdValue: '0.00',
      selected: false
    }
  ]);

  const availableTokens: Token[] = [
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

  const defaultTokens = ['MON', 'WMON', 'USDC'];

  const vaults: Vault[] = [
    {
      id: 'mon-usdc-vault',
      name: 'MON-USDC',
      tokens: {
        first: {
          symbol: 'MON',
          icon: iconmonad
        },
        second: {
          symbol: 'USDC',
          icon: iconusdc
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
    },
    {
      id: 'weth-usdc-vault',
      name: 'WETH-USDC',
      tokens: {
        first: {
          symbol: 'WETH',
          icon: iconweth
        },
        second: {
          symbol: 'USDC',
          icon: iconusdc
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
      borrowApy: 9.8
    },
    {
      id: 'wbtc-usdc-vault',
      name: 'WBTC-USDC',
      tokens: {
        first: {
          symbol: 'WBTC',
          icon: iconwbtc
        },
        second: {
          symbol: 'USDC',
          icon: iconusdc
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
      borrowApy: 8.1
    },
    {
      id: 'shmon-mon-vault',
      name: 'shMON-MON',
      tokens: {
        first: {
          symbol: 'shMON',
          icon: iconshmonad
        },
        second: {
          symbol: 'MON',
          icon: iconmonad
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
      borrowApy: 38.5
    },
    {
      id: 'sol-usdc-vault',
      name: 'SOL-USDC',
      tokens: {
        first: {
          symbol: 'SOL',
          icon: iconsol
        },
        second: {
          symbol: 'USDC',
          icon: iconusdc
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
      borrowApy: 8.9
    },
    {
      id: 'aprmon-monF-vault',
      name: 'APRMON-MON',
      tokens: {
        first: {
          symbol: 'APRMON',
          icon: iconaprmonad
        },
        second: {
          symbol: 'MON',
          icon: iconmonad
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
      borrowApy: 10.8
    },
    {
      id: 'dak-monad-vault',
      name: 'DAK-MON',
      tokens: {
        first: {
          symbol: 'DAK',
          icon: icondak
        },
        second: {
          symbol: 'MON',
          icon: iconmonad
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
      borrowApy: 13.2
    },
    {
      id: 'yaki-mon-vault',
      name: 'YAKI-MON',
      tokens: {
        first: {
          symbol: 'YAKI',
          icon: iconyaki
        },
        second: {
          symbol: 'MON',
          icon: iconmonad
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
      borrowApy: 18.1
    },
    {
      id: 'chog-usdc-vault',
      name: 'CHOG-USDC',
      tokens: {
        first: {
          symbol: 'CHOG',
          icon: iconchog
        },
        second: {
          symbol: 'USDC',
          icon: iconusdc
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
      borrowApy: 48.5
    },
    {
      id: 'smon-mon-vault',
      name: 'sMON-MON',
      tokens: {
        first: {
          symbol: 'sMON',
          icon: iconsmon
        },
        second: {
          symbol: 'MON',
          icon: iconmonad
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
      borrowApy: 10.5
    },
    {
      id: 'usdt-usdc-vault',
      name: 'USDT-USDC',
      tokens: {
        first: {
          symbol: 'USDT',
          icon: iconusdt
        },
        second: {
          symbol: 'USDC',
          icon: iconusdc
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
      borrowApy: 10.5
    },
  ];

  useEffect(() => {
    const autoFavoriteDefaults = () => {
      defaultTokens.forEach(symbol => {
        const token = availableTokens.find(t => t.symbol === symbol);
        if (token && !favorites.includes(token.address)) {
          toggleFavorite(token.address);
        }
      });
    };

    autoFavoriteDefaults();
  }, []);

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
  const [hoveredTvl, setHoveredTvl] = useState<number | null>(null);

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

    return tokenMatch && isDeposited;
  });

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

  const showVaultDetail = (vaultId: string) => {
    setSelectedVault(vaultId);
  };

  const backToList = () => {
    setSelectedVault(null);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);
    setDepositAmount((value / 100 * 10).toFixed(2));
  };

  const toggleTokenSelection = (index: number) => {
    const updatedTokens = depositTokens.map((token, i) => ({
      ...token,
      selected: i === index
    }));
    setDepositTokens(updatedTokens);
  };

  const selectedVaultData = selectedVault ? vaults.find(vault => vault.id === selectedVault) : null;

  return (
    <div className="vault-container">
      <div className="vault-content-wrapper">

        {!selectedVault && (
          <div className="overview-charts">
            <div className="overview-chart">
              <div className="total-value-locked-container">
                                <span className="total-tvl-subtitle">Total Value Locked</span>

                <span className="total-tvl">
                  ${hoveredTvl !== null ? hoveredTvl.toLocaleString() + 'M' : '192.42M'}
                </span>
              </div>     
              <ResponsiveContainer width="100%" height="100%">
  <LineChart
    data={tvlData}
    onMouseMove={(e) => {
      if (e.isTooltipActive && e.activePayload) {
        setHoveredTvl(e.activePayload[0].payload.tvl);
      }
    }}
    onMouseLeave={() => {
      setHoveredTvl(null);
    }}
  >                  <defs>
                    <linearGradient id="tvlGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#50F08D" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#50F08D" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} horizontal={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ display: 'none'}}
                  />
                  <Line
                    type="monotone"
                    dataKey="tvl"
                    stroke="url(#tvlGrad)"
                    strokeWidth={1}
                    dot={false}
                    activeDot={{ r: 6, stroke: '#aaaecf', strokeWidth: 1, fill: '#0f0f12' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="overview-chart">
              <div className="total-value-locked-container">
                <span className="total-tvl-subtitle">Average APY Trends</span>

                <span className="total-tvl">$192.42M</span>
              </div>      <ResponsiveContainer width="100%" height="100%">
                <BarChart data={apyTrendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="apySupplyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#50F08D" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#50F08D" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="apyBorrowGrad" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#apySupplyGrad)"
                  />
                  <Bar
                    dataKey="borrowApy"
                    name="Borrow APY"
                    stackId="a"
                    barSize={14}
                    radius={[4, 4, 0, 0]}
                    fill="url(#apyBorrowGrad)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        <div className="vault-rectangle">
          {!selectedVault ? (
            <>
              <div className="vault-header">
                <div className="vault-filter">
                  <div className="vault-tabs" data-active={activeTab}>
                    <button
                      className={`vault-tab ${activeTab === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveTab('all')}
                    >
                      All Vaults
                    </button>
                    <button
                      className={`vault-tab ${activeTab === 'deposited' ? 'active' : ''}`}
                      onClick={() => setActiveTab('deposited')}
                    >
                      My Positions (1)
                    </button>
                  </div>

                  <div className="vault-search-container" ref={searchRef}>
                    <div
                      className="vault-search-input"
                      onClick={() => setIsSearchOpen(true)}
                    >
                      <Search size={16} className="vault-search-icon" />

                      {selectedTokens.map((token) => (
                        <div key={token.symbol} className="vault-search-selected-token">
                          <img src={token.icon} alt={token.symbol} className="vault-search-selected-icon" />
                          <span>{token.symbol}</span>
                          <button
                            className="vault-search-remove-token"
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
                        className="vault-search-field"
                      />
                    </div>

                    {isSearchOpen && (
                      <div className="vault-search-dropdown">
                        <div className="vault-search-tokens">
                          <div className="vault-favorites-container">
                            {getFavoriteTokens().map((token) => (
                              <div
                                key={`favorite-${token.symbol}`}
                                className="vault-search-token-favorites"
                                onClick={() => handleTokenToggle(token)}
                              >
                                <img src={token.icon} alt={token.symbol} className="vault-search-token-icon-favorite" />
                                {!defaultTokens.includes(token.symbol) && (
                                  <div className="vault-token-favorites">
                                    <span className="vault-search-token-symbol-favorite">{token.symbol}</span>
                                  </div>
                                )}
                                {!defaultTokens.includes(token.symbol) && (
                                  <button
                                    className="vault-favorite-close-button"
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
                          <div className="trending-header">
                            <span className="trending-title"> Default tokens</span>
                            <div className="trending-line"> </div>
                          </div>
                          {searchQuery.length > 0 && (
                            <>
                              {filteredTokens.length > 0 ? (
                                filteredTokens.map((token) => (
                                  <div
                                    key={`search-${token.symbol}`}
                                    className="vault-search-token"
                                    onClick={() => handleTokenToggle(token)}
                                  >
                                    <Star
                                      size={18}
                                      className="vault-search-token-star"
                                      onClick={(e) => handleFavoriteToggle(token, e)}
                                      fill="none"
                                      color="#ffffff79"
                                    />
                                    <img src={token.icon} alt={token.symbol} className="vault-search-token-icon" />
                                    <div className="vault-token-details">
                                      <span className="vault-search-token-symbol">{token.symbol}</span>
                                      <span className="vault-search-token-name">{token.name}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="vault-search-empty">No tokens found</div>
                              )}
                            </>
                          )}

                          {searchQuery.length === 0 && getRemainingTokens().map((token) => (
                            <div
                              key={`remaining-${token.symbol}`}
                              className="vault-search-token"
                              onClick={() => handleTokenToggle(token)}
                            >
                              <Star
                                size={18}
                                className={`vault-search-token-star ${isTokenFavorited(token) ? 'favorited' : ''}`}
                                onClick={(e) => handleFavoriteToggle(token, e)}
                                fill={isTokenFavorited(token) ? '#aaaecf' : 'none'}
                                color={isTokenFavorited(token) ? '#aaaecf' : '#ffffff79'}
                              />

                              <img src={token.icon} alt={token.symbol} className="vault-search-token-icon" />
                              <div className="vault-token-details">
                                <span className="vault-search-token-symbol">{token.symbol}</span>
                                <span className="vault-search-token-name">{token.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="vault-vaults-grid">
                <div className="vault-vaults-list-header">
                  <div className="vault-col vault-asset-col">Vault</div>
                  <div className="vault-col vault-supply-col">Total Supply</div>
                  <div className="vault-col vault-supply-apy-col">Supply APY</div>
                  <div className="vault-col vault-borrowed-col">Total Borrowed</div>
                  <div className="vault-col vault-borrow-apy-col">Borrow APY</div>
                  <div className="vault-col vault-balance-col">Your Deposit</div>
                  <div className="vault-col vault-action-col"></div>
                </div>

                {filteredVaults.map((vault) => (
                  <div
                    key={vault.id}
                    className="vault-card"
                    onClick={() => showVaultDetail(vault.id)}
                  >
                    <div className="vault-summary">
                      <div className="vault-col vault-asset-col">
                        <div className="vault-token-pair-icons">
                          <img
                            src={vault.tokens.first.icon}
                            alt={vault.tokens.first.symbol}
                            className="vault-token-icon vault-token-icon-first"
                          />
                          <img
                            src={vault.tokens.second.icon}
                            alt={vault.tokens.second.symbol}
                            className="vault-token-icon vault-token-icon-second"
                          />
                        </div>
                        <div className="vault-asset-info">
                          <h3 className="vaultlistname">{vault.name}</h3>
                        </div>
                      </div>

                      <div className="vault-col vault-supply-col">
                        <div className="vault-supply-value supply-tooltip-wrapper">
                          <span className="apy-value-text"> $2.8M </span>
                          <div className="supply-tooltip">
                            <div className="supply-tooltip-header">
                              <span className="supply-tooltip-sub">UTILIZATION</span>
                              <span>88.04%</span>
                            </div>

                            <div className="supply-tooltip-body">
                              <div className="supply-chart">
                                <svg width="35" height="35" viewBox="0 0 36 36">
                                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 1 1 0 31.831 a 15.9155 15.9155 0 1 1 0 -31.831" />
                                  <path className="circle-usage" strokeDasharray="88.04, 100" d="M18 2.0845 a 15.9155 15.9155 0 1 1 0 31.831 a 15.9155 15.9155 0 1 1 0 -31.831" />
                                </svg>
                              </div>

                              <div className="supply-tooltip-metrics">
                                <div className="supply-tooltip-top-row">
                                  <div className="supply-tooltip-top-row-left">
                                    <span className="supply-tooltip-title-top">Total Supplied</span>
                                    <span>2.64M / 3.00M</span>
                                  </div>
                                  <div className="supply-tooltip-top-row-right">
                                    <span className="supply-tooltip-title-top">Supply APY</span>
                                    <span>1.67%</span>
                                  </div>
                                </div>

                              </div>
                            </div>
                            <div className="supply-tooltip-body-bottom">
                              <span className="vault-risk-text">RISK PARAMETERS</span>
                              <div className="supply-tooltip-body-bottom-line"> </div>
                            </div>
                            <div className="supply-tooltip-row">
                              <span className="supply-row-detail">Max LTV</span>
                              <span className="supply-row-value">80.50%</span>
                            </div>
                            <div className="supply-tooltip-row">
                              <span className="supply-row-detail">Liquidation Threshold</span>
                              <span className="supply-row-value">83.00%</span>
                            </div>
                            <div className="supply-tooltip-row">
                              <span className="supply-row-detail">Liquidation Penalty</span>
                              <span className="supply-row-value">5.00%</span>
                            </div>
                          </div>
                        </div>
                      </div>




                      <div className="vault-col vault-supply-apy-col">
                        <div className="vault-supply-apy-value"> {vault.supplyApy}%</div>
                      </div>

                      <div className="vault-col vault-borrowed-col">
                        <div className="vault-borrowed-value">{vault.totalBorrowed}</div>
                      </div>

                      <div className="vault-col vault-borrow-apy-col">
                        <div className="vault-borrow-apy-value">{vault.borrowApy}%</div>
                      </div>

                      <div className="vault-col vault-balance-col">
                        <div className="vault-deposit-amount">${vault.userBalance}</div>
                      </div>

                      <div className="vault-col vault-action-col-button">

                        <button
                          className="supply-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            showVaultDetail(vault.id);
                          }}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="vault-detail-view">
              <div className="vault-detail-header">
                <button className="vault-back-button" onClick={backToList}>
                  <ChevronLeft size={18} />
                  <span>Back to Vaults</span>
                </button>
              </div>

              {selectedVaultData && (
                <>
                  <div className="vault-detail-summary">
                    <div className="vault-detail-top">
                      <div className="vault-detail-asset">
                        <div className="vault-detail-token-pair">
                          <img
                            src={selectedVaultData.tokens.first.icon}
                            alt={selectedVaultData.tokens.first.symbol}
                            className="vault-detail-token-icon vault-first-token"
                          />
                          <img
                            src={selectedVaultData.tokens.second.icon}
                            alt={selectedVaultData.tokens.second.symbol}
                            className="vault-detail-token-icon vault-second-token"
                          />
                        </div>
                        <div>
                          <h2 className="vault-detail-name">{selectedVaultData.name}</h2>
                        </div>
                      </div>
                      <div className="vault-detail-stats">
                        <div className="vault-detail-stat">
                          <span className="vault-stat-label">APY</span>
                          <span className="vault-stat-value">{selectedVaultData.apy}%</span>
                        </div>
                        <div className="vault-detail-stat">
                          <span className="vault-stat-label">TVL</span>
                          <span className="vault-stat-value">{selectedVaultData.tvl}</span>
                        </div>
                        <div className="vault-detail-stat">
                          <span className="vault-stat-label">Daily Yield</span>
                          <span className="vault-stat-value">{selectedVaultData.dailyYield}</span>
                        </div>
                        <div className="vault-detail-stat">
                          <span className="vault-stat-label">Supply APY</span>
                          <span className="vault-stat-value">{selectedVaultData.supplyApy}%</span>
                        </div>
                        <div className="vault-detail-stat">
                          <span className="vault-stat-label">Borrow APY</span>
                          <span className="vault-stat-value">{selectedVaultData.borrowApy}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="performance-chart-container">
                      <h4 className="performance-chart-header">
                        Performance <TrendingUp size={16} />
                      </h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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

                    <div className="vault-detail-description">
                      <h4>About {selectedVaultData.name}</h4>
                      <p>{selectedVaultData.description}</p>
                      <a href="#" className="vault-learn-more">
                        Learn more <ArrowUpRight size={14} />
                      </a>
                    </div>

                    <div className="trade-info-rectangle">
                      <div className="vault-info-row">
                        <div className="label-container">Protocol Fee</div>
                        <div className="value-container">{selectedVaultData.protocolFee}</div>
                      </div>
                      <div className="vault-info-row">
                        <div className="label-container">Withdrawal Time</div>
                        <div className="value-container">{selectedVaultData.withdrawalTime}</div>
                      </div>
                      <div className="vault-info-row">
                        <div className="label-container">Total Supply</div>
                        <div className="value-container">{selectedVaultData.totalSupply}</div>
                      </div>
                      <div className="vault-info-row">
                        <div className="label-container">Total Borrowed</div>
                        <div className="value-container">{selectedVaultData.totalBorrowed}</div>
                      </div>
                    </div>
                  </div>

                  <div className="vault-deposit-section">
                    <div className="deposit-menu-container">
                      <h4 className="deposit-menu-header">Deposit Amounts</h4>

                      {depositTokens.map((token, index) => (
                        <div key={index} className="token-deposit-item">
                          <div className="token-header">
                            <span className="token-label">{token.symbol} Deposit</span>
                            <div className="token-balance">0</div>
                          </div>

                          <div className="token-amount-row">
                            <div className="token-amount">0.00</div>
                            <div
                              className="token-badge"
                              onClick={() => toggleTokenSelection(index)}
                            >
                              <img
                                src={token.icon}
                                alt={token.symbol}
                                className="token-icon"
                              />
                              <span className="token-symbol">{token.symbol}</span>
                              {token.selected && (
                                <div className="token-selector">
                                  <div className="token-selector-inner"></div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="token-usd-value">${token.usdValue}</div>
                        </div>
                      ))}

                      <div className="deposit-total-row">
                        <div className="deposit-total-label">Total Amount</div>
                        <div className="deposit-total-value">$0</div>
                      </div>

                      <button className="connect-button">Connect Account</button>

                      <div className="deposit-ratio-row">
                        <div>Deposit Ratio</div>
                        <div className="deposit-ratio-display">
                          <span>{selectedVaultData.depositRatio}</span>
                          <div className="token-indicators">
                            <div className="token-indicator token-indicator-a">A</div>
                            <div className="token-indicator token-indicator-b">B</div>
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

export default VaultEarnVaults;