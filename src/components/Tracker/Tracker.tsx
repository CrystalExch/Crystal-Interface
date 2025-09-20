import { Eye, Search, Plus, Edit2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import copy from '../../assets/copy.svg'
import closebutton from '../../assets/close_button.png'
import monadicon from '../../assets/monadlogo.svg';
import key from '../../assets/key.svg';
import trash from '../../assets/trash.svg';
import { settings } from '../../settings';
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
}

interface TrackerProps {
    isBlurred: boolean;
}

type TrackerTab = 'wallets' | 'trades';

const Tracker: React.FC<TrackerProps> = ({ isBlurred }) => {
    const [activeTab, setActiveTab] = useState<TrackerTab>('wallets');
    const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>([
        {
            id: '1',
            address: '0x1234...5678',
            name: 'random demon',
            emoji: '😈',
            balance: 3.55,
            lastActive: '2m'
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
            txHash: '0xabc123...'
        },
        {
            id: '2',
            walletName: 'random demon',
            emoji: '😈',
            token: 'Girthc...',
            amount: 6.073,
            marketCap: 74400,
            time: '4m',
            txHash: '0xabc124...'
        },
        {
            id: '3',
            walletName: 'random demon',
            emoji: '😈',
            token: 'Girthc...',
            amount: 6.073,
            marketCap: 74400,
            time: '4m',
            txHash: '0xabc125...'
        },
        {
            id: '4',
            walletName: 'random demon',
            emoji: '😈',
            token: 'Girthc...',
            amount: 6.073,
            marketCap: 74400,
            time: '4m',
            txHash: '0xabc126...'
        },
        {
            id: '5',
            walletName: 'random demon',
            emoji: '😈',
            token: 'Girthc...',
            amount: 6.073,
            marketCap: 74400,
            time: '4m',
            txHash: '0xabc127...'
        },
        {
            id: '6',
            walletName: 'random demon',
            emoji: '😈',
            token: 'Girthc...',
            amount: 6.073,
            marketCap: 74400,
            time: '4m',
            txHash: '0xabc128...'
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

    const mainWalletsRef = useRef<HTMLDivElement>(null);

    const emojiOptions = ['😀', '😈', '🚀', '💎', '🔥', '⚡', '💰', '🎯', '👑', '🦄', '🐋', '🐸', '🤖', '👻', '🎪'];

    const isValidAddress = (addr: string) => {
        return /^0x[a-fA-F0-9]{40}$/.test(addr);
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
                        <div className="tracker-wallet-header-cell">Balance</div>
                        <div className="tracker-wallet-header-cell">Last Active</div>
                        <button
                            className="tracker-remove-all-button"
                            onClick={handleRemoveAll}
                            disabled={trackedWallets.length === 0}
                        >
                            Remove All
                        </button>        </div>
                    <div
                        ref={mainWalletsRef}
                        className="tracker-wallets-list"
                    >
                        {trackedWallets.map(wallet => renderWalletItem(wallet))}
                    </div>
                </>
            )}
        </div>
    );

    const renderLiveTrades = () => (
        <div className="tracker-live-trades">
            <div className="tracker-trades-table">
                <div className="tracker-table-header">
                    <div className="tracker-header-cell">Name</div>
                    <div className="tracker-header-cell">Token</div>
                    <div className="tracker-header-cell">Amount</div>
                    <div className="tracker-header-cell">$MC</div>
                </div>

                <div className="tracker-table-content">
                    {liveTrades.map((trade) => (
                        <div key={trade.id} className="tracker-trade-row">
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
                        <button className="tracker-header-button">Import</button>
                        <button className="tracker-header-button">Export</button>
                        <button
                            className="tracker-add-button"
                            onClick={() => setShowAddWalletModal(true)}
                        >
                            Add Wallet
                        </button>
                    </div>
                )}
            </div>

            <div className="tracker-content">
                {activeTab === 'wallets' ? renderWalletManager() : renderLiveTrades()}
            </div>

            {/* Add Wallet Modal */}
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
        </div>
    );
};

export default Tracker;