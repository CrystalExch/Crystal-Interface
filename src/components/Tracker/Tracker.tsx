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
    import './Tracker.css';

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
    }
    

    type TrackerTab = 'wallets' | 'trades' | 'monitor' ;
    type SortField = 'balance' | 'lastActive' | 'dateCreated' | 'amount' | 'marketCap' | null;
    type SortDirection = 'asc' | 'desc';

    const Tracker: React.FC<TrackerProps> = ({ isBlurred, setpopup}) => {

        const [walletSortField, setWalletSortField] = useState<'balance' | 'lastActive' | null>(null);
        const [walletSortDirection, setWalletSortDirection] = useState<SortDirection>('desc');

        const [tradeSortField, setTradeSortField] = useState<'dateCreated' | 'amount' | 'marketCap' | null>(null);
        const [tradeSortDirection, setTradeSortDirection] = useState<SortDirection>('desc');
        const [activeTab, setActiveTab] = useState<TrackerTab>('wallets');
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
            marketCap: 330000,
            volume24h: 34900,
            holders: 2,
            emoji: '👨'
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
            emoji: '🌽'
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
            emoji: '👑'
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
            emoji: '🍗'
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
            emoji: '⚡'
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
            emoji: '☕'
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

        const renderWalletManager = () => (
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
                        <div
                            ref={mainWalletsRef}
                            className="tracker-wallets-list"
                        >
                            {getSortedWallets().map(wallet => renderWalletItem(wallet))}
                        </div>
                    </>
                )}
            </div>
        );

        const renderLiveTrades = () => (
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
                        {getSortedTrades().map((trade) => (
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
                        ))}
                    </div>
                </div>
            </div>
        );

        const renderMonitor = () => (
            <div className="tracker-monitor">
                <div className="tracker-monitor-grid">
                    {monitorTokens.map((token, index) => {
                        if (index % 2 === 0) {
                            const nextToken = monitorTokens[index + 1];
                            return (
                                <div key={`row-${index}`} className="tracker-monitor-row">
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
                                        <div className="tracker-monitor-card-body">
                                            <div className="tracker-monitor-stat">
                                                <span className="tracker-monitor-stat-label">MC</span>
                                                <span className={`tracker-monitor-stat-value ${isBlurred ? 'blurred' : ''}`}>
                                                    ${(token.marketCap / 1000).toFixed(1)}K
                                                </span>
                                            </div>
                                            <div className="tracker-monitor-stat">
                                                <span className="tracker-monitor-stat-label">Vol 24h</span>
                                                <span className={`tracker-monitor-stat-value ${isBlurred ? 'blurred' : ''}`}>
                                                    ${(token.volume24h / 1000).toFixed(1)}K
                                                </span>
                                            </div>
                                            <div className="tracker-monitor-stat">
                                                <span className="tracker-monitor-stat-label">Holders</span>
                                                <span className="tracker-monitor-stat-value">{token.holders}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {nextToken && (
                                        <div className="tracker-monitor-card">
                                            <div className="tracker-monitor-card-header">
                                                <div className="tracker-monitor-token-identity">
                                                    <span className="tracker-monitor-emoji">{nextToken.emoji}</span>
                                                    <div className="tracker-monitor-token-names">
                                                        <span className="tracker-monitor-token-name">{nextToken.name}</span>
                                                        <span className="tracker-monitor-token-symbol">{nextToken.symbol}</span>
                                                    </div>
                                                </div>
                                                <div className={`tracker-monitor-change ${nextToken.change24h >= 0 ? 'positive' : 'negative'}`}>
                                                    {nextToken.change24h >= 0 ? '+' : ''}{nextToken.change24h}%
                                                </div>
                                            </div>
                                            <div className="tracker-monitor-card-body">
                                                <div className="tracker-monitor-stat">
                                                    <span className="tracker-monitor-stat-label">MC</span>
                                                    <span className={`tracker-monitor-stat-value ${isBlurred ? 'blurred' : ''}`}>
                                                        ${(nextToken.marketCap / 1000).toFixed(1)}K
                                                    </span>
                                                </div>
                                                <div className="tracker-monitor-stat">
                                                    <span className="tracker-monitor-stat-label">Vol 24h</span>
                                                    <span className={`tracker-monitor-stat-value ${isBlurred ? 'blurred' : ''}`}>
                                                        ${(nextToken.volume24h / 1000).toFixed(1)}K
                                                    </span>
                                                </div>
                                                <div className="tracker-monitor-stat">
                                                    <span className="tracker-monitor-stat-label">Holders</span>
                                                    <span className="tracker-monitor-stat-value">{nextToken.holders}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </div>
        );

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
                                />
                            </div>
                            <button className="tracker-header-button" onClick={() => setpopup(33)}>
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
            </div>
        );
    };

    export default Tracker;