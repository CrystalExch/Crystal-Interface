import React, { useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronLeft, Info, Plus, Minus, TrendingUp } from 'lucide-react';
import './EarnVaults.css';
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Types
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
}

interface TokenDeposit {
  symbol: string;
  icon: string;
  amount: string;
  usdValue: string;
  selected: boolean;
}

// Mock chart data
const performanceData = [
  { name: 'Jan', value: 12.4 },
  { name: 'Feb', value: 14.8 },
  { name: 'Mar', value: 18.2 },
  { name: 'Apr', value: 16.9 },
  { name: 'May', value: 21.3 },
  { name: 'Jun', value: 22.7 },
  { name: 'Jul', value: 24.5 },
];

const VaultEarnVaults: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'deposited'>('all');
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('0.00');
  const [sliderValue, setSliderValue] = useState(0);
  const [depositTokens, setDepositTokens] = useState<TokenDeposit[]>([
    { 
      symbol: 'SUI', 
      icon: iconmonad, // Using existing icon as placeholder
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
      userBalance: '0.00',
      tags: ['Popular', 'High APY'],
      dailyYield: '0.0671%',
      protocolFee: '1.0%',
      withdrawalTime: 'Instant',
      depositRatio: '49.35%/50.65%'
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
      depositRatio: '50.00%/50.00%'
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
      depositRatio: '48.50%/51.50%'
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
      depositRatio: '52.10%/47.90%'
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
      depositRatio: '50.00%/50.00%'
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
      depositRatio: '50.00%/50.00%'
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
          symbol: 'USDC',
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
      depositRatio: '50.00%/50.00%'
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
      depositRatio: '50.00%/50.00%'
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
      depositRatio: '47.25%/52.75%'
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
      depositRatio: '50.00%/50.00%'
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
      depositRatio: '50.00%/50.00%'
    },
  ];

  const showVaultDetail = (vaultId: string) => {
    setSelectedVault(vaultId);
  };

  const backToList = () => {
    setSelectedVault(null);
  };
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);
    // Update deposit amount based on slider value (mock implementation)
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
        <div className="total-value-locked-container">
        <span className="total-tvl">$63,232,232</span>
        <span className="total-tvl-subtitle">Total Value Locked</span>
        </div>

        <div className="vault-rectangle">
          {!selectedVault ? (
            <>
              <div className="vault-vaults-grid">
                <div className="vault-vaults-list-header">
                  <div className="vault-col vault-asset-col">Vault</div>
                  <div className="vault-col vault-apy-col">APY</div>
                  <div className="vault-col vault-tvl-col">TVL</div>
                  <div className="vault-col vault-balance-col">Your Deposit</div>
                  <div className="vault-col vault-action-col"></div>
                </div>

                {vaults.map((vault) => (
                  <div 
                    key={vault.id} 
                    className="vault-card"
                    onClick={() => showVaultDetail(vault.id)} // Make entire card clickable
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
                          <div className="vault-tags">
                            {vault.tags.map((tag, index) => (
                              <span key={index} className="vault-tag">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="vault-col vault-apy-col">
                        <div className="vault-apy-value">{vault.apy}%</div>
                        <div className="vault-apy-label">APY</div>
                      </div>
                      
                      <div className="vault-col vault-tvl-col">
                        <div className="vault-tvl-value">{vault.tvl}</div>
                        <div className="vault-tvl-label">TVL</div>
                      </div>
                      
                      <div className="vault-col vault-balance-col">
                        <div className="tokenlistbalance">{vault.userBalance}</div>
                      </div>
                      
                      <div className="vault-col vault-action-col">
                        <button 
                          className="deposit-button"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the card click
                            showVaultDetail(vault.id);
                          }}
                        >
                          Deposit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Detail View
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
                      </div>
                    </div>
                    
                    {/* Performance Chart */}
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
                    </div>
                  </div>
                  
                  {/* New Deposit Menu */}
                  <div className="vault-deposit-section">
                    <div className="deposit-menu-container">
                      <h4 className="deposit-menu-header">Deposit Amounts</h4>
                      
                      {/* Token Deposits */}
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