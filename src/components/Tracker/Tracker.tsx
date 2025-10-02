    import { Eye, Search, Plus, Edit2 } from 'lucide-react';
    import React, { useCallback, useEffect, useRef, useState } from 'react';
    import { createPortal } from 'react-dom';
    import copy from '../../assets/copy.svg'
    import closebutton from '../../assets/close_button.png'
    import monadicon from '../../assets/monadlogo.svg';
    import key from '../../assets/key.svg';
    import trash from '../../assets/trash.svg';
    import { settings } from '../../settings';
    import ImportWalletsPopup from './ImportWalletsPopup';
    import LiveTradesFiltersPopup from './LiveTradesFiltersPopup/LiveTradesFIltersPopup';
    import './Tracker.css';
    'src/assets/settings'

    export interface FilterState {
    transactionTypes: {
        buyMore: boolean;
        firstBuy: boolean;
        sellPartial: boolean;
        sellAll: boolean;
        addLiquidity: boolean;
        removeLiquidity: boolean;
    };
    marketCap: {
        min: string;
        max: string;
    };
    transactionAmount: {
        min: string;
        max: string;
    };
    tokenAge: {
        min: string;
        max: string;
    };
    }


    const Tooltip: React.FC<{
        content: string;
        children: React.ReactNode;
        position?: 'top' | 'bottom' | 'left' | 'right';
    }> = ({ content, children, position = 'top' }) => {
        const [vis, setVis] = useState(false);
        const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
        const containerRef = useRef<HTMLDivElement>(null);
        

        const updatePosition = useCallback(() => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;

            let top = 0;
            let left = 0;

            switch (position) {
                case 'top':
                    top = rect.top + scrollY - 25;
                    left = rect.left + scrollX + rect.width / 2;
                    break;
                case 'bottom':
                    top = rect.bottom + scrollY + 25;
                    left = rect.left + scrollX + rect.width / 2;
                    break;
                case 'left':
                    top = rect.top + scrollY + rect.height / 2;
                    left = rect.left + scrollX - 25;
                    break;
                case 'right':
                    top = rect.top + scrollY + rect.height / 2;
                    left = rect.right + scrollX + 25;
                    break;
            }

            setTooltipPosition({ top, left });
        }, [position]);

        useEffect(() => {
            if (vis) {
                updatePosition();
                window.addEventListener('scroll', updatePosition);
                window.addEventListener('resize', updatePosition);
                return () => {
                    window.removeEventListener('scroll', updatePosition);
                    window.removeEventListener('resize', updatePosition);
                };
            }
        }, [vis, updatePosition]);

        return (
            <div
                ref={containerRef}
                className="tooltip-container"
                onMouseEnter={() => setVis(true)}
                onMouseLeave={() => setVis(false)}
            >
                {children}
                {vis && createPortal(
                    <div
                        className={`tooltip tooltip-${position} fade-popup visible`}
                        style={{
                            position: 'absolute',
                            top: `${tooltipPosition.top}px`,
                            left: `${tooltipPosition.left}px`,
                            transform: position === 'top' || position === 'bottom'
                                ? 'translateX(-50%)'
                                : position === 'left' || position === 'right'
                                    ? 'translateY(-50%)'
                                    : 'none',
                            zIndex: 9999,
                            pointerEvents: 'none'
                        }}
                    >
                        <div className="tooltip-content">
                            {content}
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    };

    interface TrackedWallet {
        address: string;
        name: string;
        emoji: string;
        balance: number;
        lastActive: string;
        id: string;
    }

    interface LiveTrade {
        id: string;
        walletName: string;
        emoji: string;
        token: string;
        amount: number;
        marketCap: number;
        time: string;
        txHash: string;
        type: 'buy' | 'sell';
        createdAt: string;
    }

    interface TrackerProps {
        isBlurred: boolean;
        setpopup: (value: number) => void;
        onImportWallets?: (walletsText: string, addToSingleGroup: boolean) => void;
        onApplyFilters?: (filters: FilterState) => void;
        activeFilters?: FilterState;
    }

    interface MonitorToken {
        id: string;
        name: string;
        symbol: string;
        price: number;
        change24h: number;
        marketCap: number;
        volume24h: number;
        holders: number;
        emoji: string;
        trades: TokenTrade[];
    }

    interface TokenTrade {
        id: string;
        wallet: string;
        emoji: string;
        timeInTrade: string;
        exitStatus?: 'Exited';
        bought: number;
        boughtTxns: number;
        sold: number;
        soldTxns: number;
        pnl: number;
        remaining: number;
    }
    

    type TrackerTab = 'wallets' | 'trades' | 'monitor' ;
    type SortField = 'balance' | 'lastActive' | 'dateCreated' | 'amount' | 'marketCap' | null;
    type SortDirection = 'asc' | 'desc';
    

    const Tracker: React.FC<TrackerProps> = ({ isBlurred, setpopup, onApplyFilters: externalOnApplyFilters, activeFilters: externalActiveFilters}) => {
        const [walletSortField, setWalletSortField] = useState<'balance' | 'lastActive' | null>(null);
        const [walletSortDirection, setWalletSortDirection] = useState<SortDirection>('desc');

        const [tradeSortField, setTradeSortField] = useState<'dateCreated' | 'amount' | 'marketCap' | null>(null);
        const [tradeSortDirection, setTradeSortDirection] = useState<SortDirection>('desc');
        const [activeTab, setActiveTab] = useState<TrackerTab>('wallets');
        const [searchQuery, setSearchQuery] = useState('');
        const [showFiltersPopup, setShowFiltersPopup] = useState(false);
        const [activeFilters, setActiveFilters] = useState<FilterState>(externalActiveFilters || {
            transactionTypes: {
                buyMore: true,
                firstBuy: true,
                sellPartial: true,
                sellAll: true,
                addLiquidity: true,
                removeLiquidity: true,
            },
            marketCap: {
                min: '',
                max: '',
            },
            transactionAmount: {
                min: '',
                max: '',
            },
            tokenAge: {
                min: '',
                max: '',
            },
        });

        useEffect(() => {
            setSearchQuery('');
        }, [activeTab]);

        const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>([
            
            
        {
            id: '1',
            address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
            name: 'Whale Hunter',
            emoji: '🐋',
            balance: 127.43,
            lastActive: '5m'
        },
        {
            id: '2',
            address: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72',
            name: 'Diamond Hands',
            emoji: '💎',
            balance: 89.21,
            lastActive: '12m'
        },
        {
            id: '3',
            address: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
            name: 'Moon Mission',
            emoji: '🚀',
            balance: 45.67,
            lastActive: '1h'
        }
        ]);
        const [liveTrades] = useState<LiveTrade[]>([
        {
            id: '1',
            walletName: 'random demon',
            emoji: '😈',
            token: 'Girthc...',
            amount: 6.073,
            marketCap: 74400,
            time: '4m',
            txHash: '0xabc123...',
            type: 'buy',
            createdAt: '2025-09-29T10:23:00'
        },
        {
            id: '2',
            walletName: 'random demon',
            emoji: '😈',
            token: 'Girthc...',
            amount: 8.073,
            marketCap: 74400,
            time: '4m',
            txHash: '0xabc124...',
            type: 'sell',
            createdAt: '2025-09-29T10:19:00'
        },
        {
            id: '3',
            walletName: 'random demon',
            emoji: '😈',
            token: 'Girthc...',
            amount: 6.073,
            marketCap: 74400,
            time: '4m',
            txHash: '0xabc125...',
            type: 'buy',
            createdAt: '2025-09-29T10:15:00'
        },
        {
            id: '4',
            walletName: 'random demon',
            emoji: '😈',
            token: 'Girthc...',
            amount: 6.073,
            marketCap: 74400,
            time: '4m',
            txHash: '0xabc126...',
            type: 'sell',
            createdAt: '2025-09-29T10:10:00'
        },
        {
            id: '5',
            walletName: 'random demon',
            emoji: '😈',
            token: 'Girthc...',
            amount: 6.073,
            marketCap: 74400,
            time: '4m',
            txHash: '0xabc127...',
            type: 'buy',
            createdAt: '2025-09-29T10:05:00'
        },
        {
            id: '6',
            walletName: 'random demon',
            emoji: '😈',
            token: 'Girthc...',
            amount: 6.073,
            marketCap: 74400,
            time: '4m',
            txHash: '0xabc128...',
            type: 'buy',
            createdAt: '2025-09-29T10:00:00'
        }
        ]);

        const [monitorTokens] = useState<MonitorToken[]>([
            {
                id: '1',
                name: 'Carson',
                symbol: 'JUSTICE',
                price: 3.18,
                change24h: -7.2,
                marketCap: 7150,
                volume24h: 7370,
                holders: 1,
                emoji: '👨',
                trades: [
                    {
                        id: '1',
                        wallet: 'cupsey...',
                        emoji: '☕',
                        timeInTrade: '15s',
                        exitStatus: 'Exited',
                        bought: 215.1,
                        boughtTxns: 1,
                        sold: 220.3,
                        soldTxns: 1,
                        pnl: 2.701,
                        remaining: 0
                    }
                ]
            },
            {
                id: '2',
                name: 'MACORN',
                symbol: 'MARQUIS',
                price: 0.223,
                change24h: 5.4,
                marketCap: 10700,
                volume24h: 9620,
                holders: 1,
                emoji: '🌽',
                trades: [
                    {
                        id: '1',
                        wallet: 'cupsey...',
                        emoji: '☕',
                        timeInTrade: '15s',
                        exitStatus: 'Exited',
                        bought: 215.1,
                        boughtTxns: 1,
                        sold: 220.3,
                        soldTxns: 1,
                        pnl: 2.701,
                        remaining: 0
                    }
                ]
            },
            {
                id: '3',
                name: 'Marquis',
                symbol: 'MQS',
                price: 0.718,
                change24h: -2.1,
                marketCap: 6150,
                volume24h: 7340,
                holders: 1,
                emoji: '👑',
                trades: []
            },
            {
                id: '4',
                name: 'MCNUG',
                symbol: 'NUGGET',
                price: 0.226,
                change24h: 3.8,
                marketCap: 7080,
                volume24h: 6870,
                holders: 1,
                emoji: '🍗',
                trades: []
            },
            {
                id: '5',
                name: 'Simple',
                symbol: 'SMPL',
                price: 0.456,
                change24h: -1.5,
                marketCap: 12300,
                volume24h: 8900,
                holders: 3,
                emoji: '⚡',
                trades: []
            },
            {
                id: '6',
                name: 'Cupsey',
                symbol: 'CUP',
                price: 0.892,
                change24h: 8.2,
                marketCap: 15600,
                volume24h: 11200,
                holders: 2,
                emoji: '☕',
                trades: []
            }
        ]);

        const [showAddWalletModal, setShowAddWalletModal] = useState(false);
        const [newWalletAddress, setNewWalletAddress] = useState('');
        const [newWalletName, setNewWalletName] = useState('');
        const [newWalletEmoji, setNewWalletEmoji] = useState('😀');
        const [addWalletError, setAddWalletError] = useState('');

        const [editingWallet, setEditingWallet] = useState<string | null>(null);
        const [editingName, setEditingName] = useState('');

        const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
        const [walletToDelete, setWalletToDelete] = useState<string>('');
        const [showImportPopup, setShowImportPopup] = useState(false);

        const mainWalletsRef = useRef<HTMLDivElement>(null);

        const emojiOptions = ['😀', '😈', '🚀', '💎', '🔥', '⚡', '💰', '🎯', '👑', '🦄', '🐋', '🐸', '🤖', '👻', '🎪'];

        const isValidAddress = (addr: string) => {
            return /^0x[a-fA-F0-9]{40}$/.test(addr);
        };
        
        const parseLastActive = (lastActive: string): number => {
            const value = parseInt(lastActive);
            if (lastActive.includes('m')) return value;
            if (lastActive.includes('h')) return value * 60;
            if (lastActive.includes('d')) return value * 1440;
            return 999999;
        };

        const handleWalletSort = (field: 'balance' | 'lastActive') => {
            if (walletSortField === field) {
                setWalletSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
            } else {
                setWalletSortField(field);
                setWalletSortDirection('desc');
            }
        };

        const handleTradeSort = (field: 'dateCreated' | 'amount' | 'marketCap') => {
            if (tradeSortField === field) {
                setTradeSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
            } else {
                setTradeSortField(field);
                setTradeSortDirection('desc');
            }
        };

        const getSortedWallets = () => {
            if (!walletSortField) return trackedWallets;
            
            return [...trackedWallets].sort((a, b) => {
                let comparison = 0;
                
                if (walletSortField === 'balance') {
                    comparison = a.balance - b.balance;
                } else if (walletSortField === 'lastActive') {
                    comparison = parseLastActive(a.lastActive) - parseLastActive(b.lastActive);
                }
                
                return walletSortDirection === 'desc' ? -comparison : comparison;
            });
        };

        const getSortedTrades = () => {
            if (!tradeSortField) return liveTrades;
            
            return [...liveTrades].sort((a, b) => {
                let comparison = 0;
                
                if (tradeSortField === 'dateCreated') {
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                } else if (tradeSortField === 'amount') {
                    comparison = a.amount - b.amount;
                } else if (tradeSortField === 'marketCap') {
                    comparison = a.marketCap - b.marketCap;
                }
                
                return tradeSortDirection === 'desc' ? -comparison : comparison;
            });
        };

        const getFilteredWallets = () => {
            const sorted = getSortedWallets();
            if (!searchQuery.trim()) return sorted;
            
            const query = searchQuery.toLowerCase();
            return sorted.filter(wallet => 
                wallet.name.toLowerCase().includes(query) ||
                wallet.address.toLowerCase().includes(query)
            );
        };

        const getFilteredTrades = () => {
            let trades = liveTrades.filter(trade => {

                const isBuy = trade.type === 'buy';
                const isSell = trade.type === 'sell';
                
                if (isBuy && !activeFilters.transactionTypes.buyMore && !activeFilters.transactionTypes.firstBuy) {
                    return false;
                }
                if (isSell && !activeFilters.transactionTypes.sellPartial && !activeFilters.transactionTypes.sellAll) {
                    return false;
                }
                
                // Market cap filter
                if (activeFilters.marketCap.min && trade.marketCap < parseFloat(activeFilters.marketCap.min)) {
                    return false;
                }
                if (activeFilters.marketCap.max && trade.marketCap > parseFloat(activeFilters.marketCap.max)) {
                    return false;
                }
                
                // Transaction amount filter
                if (activeFilters.transactionAmount.min && trade.amount < parseFloat(activeFilters.transactionAmount.min)) {
                    return false;
                }
                if (activeFilters.transactionAmount.max && trade.amount > parseFloat(activeFilters.transactionAmount.max)) {
                    return false;
                }
                
                return true;
            });
            
            // Sorting
            if (tradeSortField) {
                trades = [...trades].sort((a, b) => {
                    let comparison = 0;
                    
                    if (tradeSortField === 'dateCreated') {
                        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    } else if (tradeSortField === 'amount') {
                        comparison = a.amount - b.amount;
                    } else if (tradeSortField === 'marketCap') {
                        comparison = a.marketCap - b.marketCap;
                    }
                    
                    return tradeSortDirection === 'desc' ? -comparison : comparison;
                });
            }
            
            // apply search
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                trades = trades.filter(trade =>
                    trade.walletName.toLowerCase().includes(query) ||
                    trade.token.toLowerCase().includes(query)
                );
            }
            
            return trades;
        };

        const getFilteredMonitorTokens = () => {
            if (!searchQuery.trim()) return monitorTokens;
            
            const query = searchQuery.toLowerCase();
            return monitorTokens.filter(token =>
                token.name.toLowerCase().includes(query) ||
                token.symbol.toLowerCase().includes(query)
            );
        };

        const handleAddWallet = () => {
            setAddWalletError('');

            if (!newWalletAddress.trim()) {
                setAddWalletError('Please enter a wallet address');
                return;
            }

            if (!isValidAddress(newWalletAddress.trim())) {
                setAddWalletError('Invalid wallet address format');
                return;
            }

            if (!newWalletName.trim()) {
                setAddWalletError('Please enter a wallet name');
                return;
            }

            const exists = trackedWallets.some(w => w.address.toLowerCase() === newWalletAddress.trim().toLowerCase());
            if (exists) {
                setAddWalletError('This wallet is already being tracked');
                return;
            }

            const newWallet: TrackedWallet = {
                id: Date.now().toString(),
                address: newWalletAddress.trim(),
                name: newWalletName.trim(),
                emoji: newWalletEmoji,
                balance: 0,
                lastActive: 'Never'
            };

            setTrackedWallets(prev => [...prev, newWallet]);
            closeAddWalletModal();
        };

        const handleExportWallets = () => {
            const exportData = trackedWallets.map(wallet => ({
                trackedWalletAddress: wallet.address,
                name: wallet.name,
                emoji: wallet.emoji,
                alertsOnToast: false,
                alertsOnBubble: false,
                alertsOnFeed: true,
                groups: ["Main"],
                sound: "default"
            }));
            
            const jsonString = JSON.stringify(exportData, null, 2);
            navigator.clipboard.writeText(jsonString);
        };

        const handleImportWallets = (walletsText: string, addToSingleGroup: boolean) => {
            try {
                const importedData = JSON.parse(walletsText);
                
                if (!Array.isArray(importedData)) {
                    console.error('Invalid format: expected an array');
                    return;
                }
                
                const newWallets: TrackedWallet[] = importedData
                    .filter(item => {
                        // Check if wallet already exists
                        const exists = trackedWallets.some(
                            w => w.address.toLowerCase() === item.trackedWalletAddress.toLowerCase()
                        );
                        return !exists && item.trackedWalletAddress;
                    })
                    .map(item => ({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        address: item.trackedWalletAddress,
                        name: item.name || 'Imported Wallet',
                        emoji: item.emoji || '👻',
                        balance: 0,
                        lastActive: 'Never'
                    }));
                
                if (newWallets.length > 0) {
                    setTrackedWallets(prev => [...prev, ...newWallets]);
                    console.log(`Successfully imported ${newWallets.length} wallets`);
                } else {
                    console.log('No new wallets to import');
                }
            } catch (error) {
                console.error('Failed to import wallets:', error);
            }
        };


        const closeAddWalletModal = () => {
            setShowAddWalletModal(false);
            setNewWalletAddress('');
            setNewWalletName('');
            setNewWalletEmoji('😀');
            setAddWalletError('');
        };

        const startEditingWallet = (id: string) => {
            const wallet = trackedWallets.find(w => w.id === id);
            if (wallet) {
                setEditingWallet(id);
                setEditingName(wallet.name);
            }
        };

        const saveWalletName = (id: string) => {
            setTrackedWallets(prev =>
                prev.map(w => w.id === id ? { ...w, name: editingName.trim() || w.name } : w)
            );
            setEditingWallet(null);
            setEditingName('');
        };

        const confirmDeleteWallet = (id: string) => {
            setWalletToDelete(id);
            setShowDeleteConfirmation(true);
        };

        const deleteWallet = () => {
            setTrackedWallets(prev => prev.filter(w => w.id !== walletToDelete));
            setShowDeleteConfirmation(false);
            setWalletToDelete('');
        };

        const handleApplyFilters = (filters: FilterState) => {
            setActiveFilters(filters);
            if (externalOnApplyFilters) {
                externalOnApplyFilters(filters);
            }
        };
        

        const renderWalletItem = (wallet: TrackedWallet) => (
            <div key={wallet.id} className="tracker-wallet-item">
                <div className="tracker-wallet-profile">
                    <div className="tracker-wallet-emoji">{wallet.emoji}</div>

                    <div className="tracker-wallet-info">
                        {editingWallet === wallet.id ? (
                            <div className="tracker-wallet-name-edit-container">
                                <input
                                    type="text"
                                    className="tracker-wallet-name-input"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            saveWalletName(wallet.id);
                                        } else if (e.key === 'Escape') {
                                            setEditingWallet(null);
                                            setEditingName('');
                                        }
                                    }}
                                    autoFocus
                                    onBlur={() => saveWalletName(wallet.id)}
                                />
                            </div>
                        ) : (
                            <div className="tracker-wallet-name-display">
                                <span className="tracker-wallet-name">{wallet.name}</span>
                                <Edit2
                                    size={12}
                                    className="tracker-wallet-name-edit-icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingWallet(wallet.id);
                                    }}
                                />
                            </div>
                        )}
                    <div className="tracker-wallet-address">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                        <img
                            src={copy}
                            className="tracker-copy-icon"
                            alt="Copy"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(wallet.address);
                            }}
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                    </div>
                </div>


                <div className={`tracker-wallet-balance ${isBlurred ? 'blurred' : ''}`}>
                    <img src={monadicon} className="tracker-balance-icon" alt="MON" />
                    {wallet.balance.toFixed(2)}K
                </div>

                <div className="tracker-wallet-last-active">{wallet.lastActive}</div>

                <div className="tracker-wallet-actions">
                    <Tooltip content="View on Explorer">
                        <a
                            href={`${settings.chainConfig[activechain].explorer}/address/${wallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tracker-action-button"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <svg
                                className="tracker-action-icon"
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="white"
                            >
                                <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                                <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
                            </svg>
                        </a>
                    </Tooltip>

                    <Tooltip content="Delete Wallet">
                        <button
                            className="tracker-action-button delete-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteWallet(wallet.id);
                            }}
                        >
                            <img src={trash} className="tracker-action-icon" alt="Delete" />
                        </button>
                    </Tooltip>
                </div>
            </div>
        );

        const handleRemoveAll = () => {
            setTrackedWallets([]);
        };



        const renderWalletManager = () => {
            const filteredWallets = getFilteredWallets();
            return (
            
                <div className="tracker-wallet-manager">
                    {trackedWallets.length === 0 ? (
                        <div className="tracker-empty-state">
                            <div className="tracker-empty-content">
                                <h4>No Wallets Tracked</h4>
                                <p>Add wallets to track their activity and trades in real-time.</p>
                                <button
                                    className="tracker-cta-button"
                                    onClick={() => setShowAddWalletModal(true)}
                                >
                                    Add Your First Wallet
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="tracker-wallets-header">
                                <div className="tracker-wallet-header-cell">Name</div>
                                <div 
                                    className={`tracker-wallet-header-cell sortable ${walletSortField === 'balance' ? 'active' : ''}`}
                                    onClick={() => handleWalletSort('balance')}
                                >
                                    Balance
                                    {walletSortField === 'balance' && (
                                        <span className={`tracker-sort-arrow ${walletSortDirection}`}>
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M5 7L2 3H8L5 7Z"/>
                                            </svg>
                                        </span>
                                    )}
                                </div>
                                <div 
                                    className={`tracker-wallet-header-cell sortable ${walletSortField === 'lastActive' ? 'active' : ''}`}
                                    onClick={() => handleWalletSort('lastActive')}
                                >
                                    Last Active
                                    {walletSortField === 'lastActive' && (
                                        <span className={`tracker-sort-arrow ${walletSortDirection}`}>
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M5 7L2 3H8L5 7Z"/>
                                            </svg>
                                        </span>
                                    )}
                                </div>
                                <button
                                    className="tracker-remove-all-button"
                                    onClick={handleRemoveAll}
                                    disabled={trackedWallets.length === 0}
                                >
                                    Remove All
                                </button>
                            </div>
                            <div ref={mainWalletsRef} className="tracker-wallets-list">
                                {filteredWallets.length === 0 ? (
                                    <div className="tracker-empty-state">
                                        <div className="tracker-empty-content">
                                            <h4>No Wallets Found</h4>
                                            <p>No wallets match your search criteria.</p>
                                        </div>
                                    </div>
                                ) : (
                                    filteredWallets.map(wallet => renderWalletItem(wallet))
                                )}
                            </div>
                        </>
                    )}
                </div>
            )
        };

        const renderLiveTrades = () => {
            const filteredTrades = getFilteredTrades();

            return (
                <div className="tracker-live-trades">
                    <div className="tracker-trades-table">
                        <div className="tracker-table-header">
                            <div 
                                className={`tracker-header-cell sortable ${tradeSortField === 'dateCreated' ? 'active' : ''}`}
                                onClick={() => handleTradeSort('dateCreated')}
                            >
                                Date Created
                                {tradeSortField === 'dateCreated' && (
                                    <span className={`tracker-sort-arrow ${tradeSortDirection}`}>
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5 7L2 3H8L5 7Z"/>
                                        </svg>
                                    </span>
                                )}
                            </div>
                            <div className="tracker-header-cell">Name</div>
                            <div className="tracker-header-cell">Token</div>
                            <div 
                                className={`tracker-header-cell sortable ${tradeSortField === 'amount' ? 'active' : ''}`}
                                onClick={() => handleTradeSort('amount')}
                            >
                                Amount
                                {tradeSortField === 'amount' && (
                                    <span className={`tracker-sort-arrow ${tradeSortDirection}`}>
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5 7L2 3H8L5 7Z"/>
                                        </svg>
                                    </span>
                                )}
                            </div>
                            <div 
                                className={`tracker-header-cell sortable ${tradeSortField === 'marketCap' ? 'active' : ''}`}
                                onClick={() => handleTradeSort('marketCap')}
                                style={{ justifySelf: 'end' }}
                            >
                                Market Cap
                                {tradeSortField === 'marketCap' && (
                                    <span className={`tracker-sort-arrow ${tradeSortDirection}`}>
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5 7L2 3H8L5 7Z"/>
                                        </svg>
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="tracker-table-content">
                            {filteredTrades.length === 0 ? (
                                <div className="tracker-empty-state">
                                    <div className="tracker-empty-content">
                                        <h4>No Trades Found</h4>
                                        <p>No trades match your search criteria.</p>
                                    </div>
                                </div>
                            ) : (
                                filteredTrades.map((trade) => (
                                <div 
                                    key={trade.id} 
                                    className={`tracker-trade-row ${trade.type === 'buy' ? 'trade-buy' : 'trade-sell'}`}
                                >
                                    <div className="tracker-trade-date">
                                        {new Date(trade.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                    <div className="tracker-trade-name">
                                        <span className="tracker-trade-emoji">{trade.emoji}</span>
                                        <span className="tracker-trade-wallet-name">{trade.walletName}</span>
                                        <span className="tracker-trade-time">{trade.time}</span>
                                    </div>
                                    <div className="tracker-trade-token">
                                        <div className="tracker-token-info">
                                            <div className="tracker-token-icon"></div>
                                            <span>{trade.token}</span>
                                            <span className="tracker-token-time">• {trade.time}</span>
                                        </div>
                                    </div>
                                    <div className="tracker-trade-amount">
                                        <img src={monadicon} className="tracker-amount-icon" alt="MON" />
                                        <span className={`tracker-amount-value ${isBlurred ? 'blurred' : ''}`}>
                                            {trade.amount}
                                        </span>
                                    </div>
                                    <div className={`tracker-trade-mc ${isBlurred ? 'blurred' : ''}`}>
                                        ${trade.marketCap.toLocaleString()}K
                                    </div>
                                </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )
        };

        const renderMonitor = () => {
            const filteredTokens = getFilteredMonitorTokens();
            return (
                <div className="tracker-monitor">
                    {filteredTokens.length === 0 ? (
                        <div className="tracker-empty-state">
                            <div className="tracker-empty-content">
                                <h4>No Tokens Found</h4>
                                <p>No tokens match your search criteria.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="tracker-monitor-grid">
                            {filteredTokens.map((token) => (
                                <div key={token.id} className="tracker-monitor-card-wrapper">
                                    <div className="tracker-monitor-card">
                                        <div className="tracker-monitor-card-header">
                                            <div className="tracker-monitor-token-identity">
                                                <span className="tracker-monitor-emoji">{token.emoji}</span>
                                                <div className="tracker-monitor-token-names">
                                                    <span className="tracker-monitor-token-name">{token.name}</span>
                                                    <span className="tracker-monitor-token-symbol">{token.symbol}</span>
                                                </div>
                                            </div>
                                            <div className={`tracker-monitor-change ${token.change24h >= 0 ? 'positive' : 'negative'}`}>
                                                {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                                            </div>
                                        </div>
                                        
                                        <div className="tracker-monitor-trades-header">
                                            <div className="tracker-monitor-trades-stats">
                                                <div className="tracker-monitor-trade-stat">
                                                    <span className="stat-label">H</span>
                                                    <span className="stat-value">{token.holders}</span>
                                                </div>
                                                <div className="tracker-monitor-trade-stat">
                                                    <span className="stat-label">MC</span>
                                                    <span className="stat-value">${(token.marketCap / 1000).toFixed(2)}K</span>
                                                </div>
                                                <div className="tracker-monitor-trade-stat">
                                                    <span className="stat-label">L</span>
                                                    <span className="stat-value">${(token.volume24h / 1000).toFixed(2)}K</span>
                                                </div>
                                                <div className="tracker-monitor-trade-stat">
                                                    <span className="stat-label">TX</span>
                                                    <span className="stat-value">{token.trades.reduce((sum, t) => sum + t.boughtTxns + t.soldTxns, 0)}</span>
                                                </div>
                                                <div className="tracker-monitor-trade-stat">
                                                    <span className="stat-label">Last TX</span>
                                                    <span className="stat-value">1m</span>
                                                </div>
                                            </div>
                                            <button className="tracker-monitor-flash-button">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                                                </svg>
                                            </button>
                                        </div>
                                        
                                        {token.trades.length > 0 && (
                                            <div className="tracker-monitor-trades-table">
                                                <div className="tracker-monitor-trades-table-header">
                                                    <div className="header-cell">Wallet</div>
                                                    <div className="header-cell">Time in Trade</div>
                                                    <div className="header-cell">Bought</div>
                                                    <div className="header-cell">Sold</div>
                                                    <div className="header-cell">PNL</div>
                                                    <div className="header-cell">Remaining</div>
                                                </div>
                                                {token.trades.map((trade) => (
                                                    <div key={trade.id} className="tracker-monitor-trade-row">
                                                        <div className="trade-wallet">
                                                            <span className="trade-emoji">{trade.emoji}</span>
                                                            <span className="trade-wallet-name">{trade.wallet}</span>
                                                        </div>
                                                        <div className="trade-time">
                                                            {trade.exitStatus && <span className="exit-badge">{trade.exitStatus}</span>}
                                                            <span className="time-value">{trade.timeInTrade}</span>
                                                        </div>
                                                        <div className="trade-bought">
                                                            <span className={`amount ${isBlurred ? 'blurred' : ''}`}>${trade.bought}</span>
                                                            <span className="txns">{trade.boughtTxns} txns</span>
                                                        </div>
                                                        <div className="trade-sold">
                                                            <span className={`amount ${isBlurred ? 'blurred' : ''}`}>${trade.sold}</span>
                                                            <span className="txns">{trade.soldTxns} txns</span>
                                                        </div>
                                                        <div className={`trade-pnl ${trade.pnl >= 0 ? 'positive' : 'negative'} ${isBlurred ? 'blurred' : ''}`}>
                                                            +${trade.pnl.toFixed(3)}
                                                        </div>
                                                        <div className={`trade-remaining ${isBlurred ? 'blurred' : ''}`}>
                                                            ${trade.remaining}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )
    };

        return (
            <div className="tracker-container">
                <div className="tracker-header">
                    <div className="tracker-tabs">
                        <button
                            className={`tracker-tab ${activeTab === 'wallets' ? 'active' : ''}`}
                            onClick={() => setActiveTab('wallets')}
                        >
                            Wallet Manager
                        </button>
                        <button
                            className={`tracker-tab ${activeTab === 'trades' ? 'active' : ''}`}
                            onClick={() => setActiveTab('trades')}
                        >
                            Live Trades
                        </button>

                         <button
                            className={`tracker-tab ${activeTab === 'monitor' ? 'active' : ''}`}
                            onClick={() => setActiveTab('monitor')}
                        >
                            Monitor
                        </button>
                    </div>
                    {activeTab === 'wallets' && (
                        <div className="tracker-header-actions">
                            <div className="tracker-search">
                                <Search size={14} className="tracker-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by name or addr..."
                                    className="tracker-search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button 
                                className="tracker-header-button" 
                                onClick={() => setShowImportPopup(true)}
                            >
                                Import
                            </button>
                            <button 
                                className="tracker-header-button" 
                                onClick={handleExportWallets}
                                disabled={trackedWallets.length === 0}
                            >
                                Export
                            </button>
                            <button
                                className="tracker-add-button"
                                onClick={() => setShowAddWalletModal(true)}
                            >
                                Add Wallet
                            </button>
                        </div>
                    )}

                    {activeTab === 'trades' && (
                        <div className="tracker-header-actions">
                            <div className="tracker-search">
                                <Search size={14} className="tracker-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by name or ticker"
                                    className="tracker-search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="tracker-header-button" onClick={() => setShowFiltersPopup(true)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18M7 12h10M10 18h4"/>
                                </svg>
                            </button>
                            <button className="tracker-header-button" onClick={() => setShowFiltersPopup(true)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18M7 12h10M10 18h4"/>
                                </svg>
                            </button>
                            <button className="tracker-header-button" onClick={() => setpopup(34)}>P1</button>
                            <button className="tracker-header-button">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                                </svg>
                            </button>
                            <button className="tracker-header-button">0.0</button>
                        </div>
                    )}

                    {activeTab === 'monitor' && (
                        <div className="tracker-header-actions">
                            <div className="tracker-search">
                                <Search size={14} className="tracker-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by name or ticker"
                                    className="tracker-search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="tracker-header-button">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18M7 12h10M10 18h4"/>
                                </svg>
                            </button>
                            <button className="tracker-header-button">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8"/>
                                    <path d="m21 21-4.35-4.35"/>
                                </svg>
                            </button>
                            <button className="tracker-header-button">USD $</button>
                            <button className="tracker-header-button">P1</button>
                            <button className="tracker-header-button">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                                </svg>
                            </button>
                            <button className="tracker-header-button">0.0</button>
                        </div>
                    )}
                </div>

                <div className="tracker-content">
                    {activeTab === 'wallets' ? renderWalletManager() : 
                    activeTab === 'trades' ? renderLiveTrades() : 
                    renderMonitor()}
                </div>

                {showAddWalletModal && (
                    <div className="tracker-modal-backdrop" onClick={closeAddWalletModal}>
                        <div className="tracker-modal-container" onClick={(e) => e.stopPropagation()}>
                            <div className="tracker-modal-header">
                                <h3 className="tracker-modal-title">Add Wallet</h3>
                                <button className="tracker-modal-close" onClick={closeAddWalletModal}>
                                    <img src={closebutton} className="close-button-icon" />
                                </button>
                            </div>
                            <div className="tracker-modal-content">
                                <div className="tracker-input-section">
                                    <label className="tracker-label">Wallet Address:</label>
                                    <input
                                        type="text"
                                        className="tracker-input"
                                        value={newWalletAddress}
                                        onChange={(e) => {
                                            setNewWalletAddress(e.target.value);
                                            setAddWalletError('');
                                        }}
                                        placeholder="0x..."
                                    />
                                </div>

                                <div className="tracker-input-section">
                                    <label className="tracker-label">Wallet Name:</label>
                                    <input
                                        type="text"
                                        className="tracker-input"
                                        value={newWalletName}
                                        onChange={(e) => {
                                            setNewWalletName(e.target.value);
                                            setAddWalletError('');
                                        }}
                                        placeholder="Enter a name for this wallet"
                                    />
                                </div>

                                <div className="tracker-input-section">
                                    <label className="tracker-label">Emoji:</label>
                                    <div className="tracker-emoji-grid">
                                        {emojiOptions.map((emoji) => (
                                            <button
                                                key={emoji}
                                                className={`tracker-emoji-option ${newWalletEmoji === emoji ? 'selected' : ''}`}
                                                onClick={() => setNewWalletEmoji(emoji)}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {addWalletError && (
                                    <div className="tracker-error-message">
                                        {addWalletError}
                                    </div>
                                )}

                                <div className="tracker-modal-actions">
                                    <button
                                        className="tracker-confirm-button"
                                        onClick={handleAddWallet}
                                        disabled={!newWalletAddress.trim() || !newWalletName.trim()}
                                    >
                                        Add Wallet
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showFiltersPopup && (
                    <div className="live-trades-filters-backdrop" onClick={() => setShowFiltersPopup(false)}>
                    <div className="live-trades-filters-container" onClick={(e) => e.stopPropagation()}>
                        <div className="live-trades-filters-header">
                        <h3 className="live-trades-filters-title">Live Trades Filters</h3>
                        <button className="live-trades-filters-close" onClick={() => setShowFiltersPopup(false)}>
                            <img src={closebutton} className="close-button-icon" alt="Close" />
                        </button>
                        </div>

                        <div className="live-trades-filters-content">
                        <div className="live-trades-filters-section">
                            <h4 className="live-trades-filters-section-title">Transaction Types</h4>
                            
                            <div className="live-trades-filters-checkboxes">
                            <label className="live-trades-filters-checkbox-label">
                                <input
                                type="checkbox"
                                checked={activeFilters.transactionTypes.buyMore}
                                onChange={() => setActiveFilters(prev => ({
                                    ...prev,
                                    transactionTypes: {
                                    ...prev.transactionTypes,
                                    buyMore: !prev.transactionTypes.buyMore,
                                    },
                                }))}
                                className="live-trades-filters-checkbox"
                                />
                                <span className="live-trades-filters-checkbox-text">Buy More</span>
                            </label>

                            <label className="live-trades-filters-checkbox-label">
                                <input
                                type="checkbox"
                                checked={activeFilters.transactionTypes.firstBuy}
                                onChange={() => setActiveFilters(prev => ({
                                    ...prev,
                                    transactionTypes: {
                                    ...prev.transactionTypes,
                                    firstBuy: !prev.transactionTypes.firstBuy,
                                    },
                                }))}
                                className="live-trades-filters-checkbox"
                                />
                                <span className="live-trades-filters-checkbox-text">First Buy</span>
                            </label>

                            <label className="live-trades-filters-checkbox-label">
                                <input
                                type="checkbox"
                                checked={activeFilters.transactionTypes.sellPartial}
                                onChange={() => setActiveFilters(prev => ({
                                    ...prev,
                                    transactionTypes: {
                                    ...prev.transactionTypes,
                                    sellPartial: !prev.transactionTypes.sellPartial,
                                    },
                                }))}
                                className="live-trades-filters-checkbox"
                                />
                                <span className="live-trades-filters-checkbox-text">Sell Partial</span>
                            </label>

                            <label className="live-trades-filters-checkbox-label">
                                <input
                                type="checkbox"
                                checked={activeFilters.transactionTypes.sellAll}
                                onChange={() => setActiveFilters(prev => ({
                                    ...prev,
                                    transactionTypes: {
                                    ...prev.transactionTypes,
                                    sellAll: !prev.transactionTypes.sellAll,
                                    },
                                }))}
                                className="live-trades-filters-checkbox"
                                />
                                <span className="live-trades-filters-checkbox-text">Sell All</span>
                            </label>

                            <label className="live-trades-filters-checkbox-label">
                                <input
                                type="checkbox"
                                checked={activeFilters.transactionTypes.addLiquidity}
                                onChange={() => setActiveFilters(prev => ({
                                    ...prev,
                                    transactionTypes: {
                                    ...prev.transactionTypes,
                                    addLiquidity: !prev.transactionTypes.addLiquidity,
                                    },
                                }))}
                                className="live-trades-filters-checkbox"
                                />
                                <span className="live-trades-filters-checkbox-text">Add Liquidity</span>
                            </label>

                            <label className="live-trades-filters-checkbox-label">
                                <input
                                type="checkbox"
                                checked={activeFilters.transactionTypes.removeLiquidity}
                                onChange={() => setActiveFilters(prev => ({
                                    ...prev,
                                    transactionTypes: {
                                    ...prev.transactionTypes,
                                    removeLiquidity: !prev.transactionTypes.removeLiquidity,
                                    },
                                }))}
                                className="live-trades-filters-checkbox"
                                />
                                <span className="live-trades-filters-checkbox-text">Remove Liquidity</span>
                            </label>
                            </div>
                        </div>

                        <div className="live-trades-filters-section">
                            <h4 className="live-trades-filters-section-title">Market Cap (USD)</h4>
                            <div className="live-trades-filters-range">
                            <div className="live-trades-filters-input-wrapper">
                                <input
                                type="text"
                                placeholder="Min"
                                value={activeFilters.marketCap.min}
                                onChange={(e) => setActiveFilters(prev => ({
                                    ...prev,
                                    marketCap: {
                                    ...prev.marketCap,
                                    min: e.target.value,
                                    },
                                }))}
                                className="live-trades-filters-input"
                                />
                                <span className="live-trades-filters-input-suffix">USD</span>
                            </div>
                            <div className="live-trades-filters-input-wrapper">
                                <input
                                type="text"
                                placeholder="Max"
                                value={activeFilters.marketCap.max}
                                onChange={(e) => setActiveFilters(prev => ({
                                    ...prev,
                                    marketCap: {
                                    ...prev.marketCap,
                                    max: e.target.value,
                                    },
                                }))}
                                className="live-trades-filters-input"
                                />
                                <span className="live-trades-filters-input-suffix">USD</span>
                            </div>
                            </div>
                        </div>

                        <div className="live-trades-filters-section">
                            <h4 className="live-trades-filters-section-title">Transaction Amount (SOL)</h4>
                            <div className="live-trades-filters-range">
                            <div className="live-trades-filters-input-wrapper">
                                <input
                                type="text"
                                placeholder="Min"
                                value={activeFilters.transactionAmount.min}
                                onChange={(e) => setActiveFilters(prev => ({
                                    ...prev,
                                    transactionAmount: {
                                    ...prev.transactionAmount,
                                    min: e.target.value,
                                    },
                                }))}
                                className="live-trades-filters-input"
                                />
                                <span className="live-trades-filters-input-suffix">SOL</span>
                            </div>
                            <div className="live-trades-filters-input-wrapper">
                                <input
                                type="text"
                                placeholder="Max"
                                value={activeFilters.transactionAmount.max}
                                onChange={(e) => setActiveFilters(prev => ({
                                    ...prev,
                                    transactionAmount: {
                                    ...prev.transactionAmount,
                                    max: e.target.value,
                                    },
                                }))}
                                className="live-trades-filters-input"
                                />
                                <span className="live-trades-filters-input-suffix">SOL</span>
                            </div>
                            </div>
                        </div>

                        <div className="live-trades-filters-section">
                            <h4 className="live-trades-filters-section-title">Token Age (Minutes)</h4>
                            <div className="live-trades-filters-range">
                            <div className="live-trades-filters-input-wrapper">
                                <input
                                type="text"
                                placeholder="Min"
                                value={activeFilters.tokenAge.min}
                                onChange={(e) => setActiveFilters(prev => ({
                                    ...prev,
                                    tokenAge: {
                                    ...prev.tokenAge,
                                    min: e.target.value,
                                    },
                                }))}
                                className="live-trades-filters-input"
                                />
                                <span className="live-trades-filters-input-suffix">min</span>
                            </div>
                            <div className="live-trades-filters-input-wrapper">
                                <input
                                type="text"
                                placeholder="Max"
                                value={activeFilters.tokenAge.max}
                                onChange={(e) => setActiveFilters(prev => ({
                                    ...prev,
                                    tokenAge: {
                                    ...prev.tokenAge,
                                    max: e.target.value,
                                    },
                                }))}
                                className="live-trades-filters-input"
                                />
                                <span className="live-trades-filters-input-suffix">min</span>
                            </div>
                            </div>
                        </div>
                        </div>

                        <div className="live-trades-filters-footer">
                        <button className="live-trades-filters-reset-button" onClick={() => setActiveFilters({
                            transactionTypes: {
                            buyMore: true,
                            firstBuy: true,
                            sellPartial: true,
                            sellAll: true,
                            addLiquidity: true,
                            removeLiquidity: true,
                            },
                            marketCap: {
                            min: '',
                            max: '',
                            },
                            transactionAmount: {
                            min: '',
                            max: '',
                            },
                            tokenAge: {
                            min: '',
                            max: '',
                            },
                        })}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                            <path d="M21 3v5h-5"/>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                            <path d="M3 21v-5h5"/>
                            </svg>
                        </button>
                        <button className="live-trades-filters-apply-button" onClick={() => {
                            if (externalOnApplyFilters) {
                            externalOnApplyFilters(activeFilters);
                            }
                            setShowFiltersPopup(false);
                        }}>
                            Apply Filters
                        </button>
                        </div>
                    </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirmation && (
                    <div className="tracker-modal-backdrop" onClick={() => setShowDeleteConfirmation(false)}>
                        <div className="tracker-modal-container" onClick={(e) => e.stopPropagation()}>
                            <div className="tracker-modal-header">
                                <h3 className="tracker-modal-title">Delete Wallet</h3>
                                <button className="tracker-modal-close" onClick={() => setShowDeleteConfirmation(false)}>
                                    <img src={closebutton} className="close-button-icon" />
                                </button>
                            </div>
                            <div className="tracker-modal-content">
                                <div className="tracker-delete-warning">
                                    <p>Are you sure you want to remove this wallet from tracking?</p>
                                    <p>This action cannot be undone.</p>
                                </div>
                                <div className="tracker-modal-actions">
                                    <button
                                        className="tracker-delete-confirm-button"
                                        onClick={deleteWallet}
                                    >
                                        Delete Wallet
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showImportPopup && (
                    <ImportWalletsPopup
                        onClose={() => setShowImportPopup(false)}
                        onImport={handleImportWallets}
                    />
                )}

                {showFiltersPopup && (
                    <LiveTradesFiltersPopup
                        onClose={() => setShowImportPopup(false)}
                        onApply={handleApplyFilters}
                        initialFilters={activeFilters}
                    />
                )}
            </div>
        );
    };

    export default Tracker;