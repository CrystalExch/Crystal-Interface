import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import './QuickBuyWidget.css';
import monadicon from '../../../assets/monadlogo.svg';
import { settings } from '../../../settings';
import closebutton from '../../../assets/close_button.png';
import squares from '../../../assets/squares.svg';
import editicon from '../../../assets/edit.svg';
import switchicon from '../../../assets/switch.svg';
import { showLoadingPopup, updatePopup } from '../../MemeTransactionPopup/MemeTransactionPopupManager';
import walleticon from '../../../assets/wallet_icon.png';
import slippage from '../../../assets/slippage.svg';
import gas from '../../../assets/gas.svg';
import { CrystalRouterAbi } from '../../../abis/CrystalRouterAbi';
import { encodeFunctionData } from 'viem';

interface PendingTransaction {
    id: string;
    type: 'buy' | 'sell';
    amount: string;
    timestamp: number;
    status: 'pending' | 'confirming' | 'complete' | 'error';
}

interface UserStats {
    balance: number;
    amountBought: number;
    amountSold: number;
    valueBought: number;
    valueSold: number;
    valueNet: number;
}

interface QuickBuyWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    tokenSymbol?: string;
    tokenAddress?: string;
    tokenPrice?: number;
    buySlippageValue: string;
    buyPriorityFee: string;
    sellSlippageValue: string;
    sellPriorityFee: string;
    sendUserOperationAsync?: any;
    account?: { connected: boolean; address: string; chainId: number };
    setChain?: () => void;
    activechain: number;
    routerAddress?: string;
    setpopup?: (value: number) => void;
    tokenBalances?: { [key: string]: bigint };
    refetch?: () => void;
    subWallets?: Array<{ address: string, privateKey: string }>;
    walletTokenBalances?: { [address: string]: any };
    activeWalletPrivateKey?: string;
    setOneCTSigner?: (privateKey: string) => void;
    tokenList?: any[];
    isBlurred?: boolean;
    forceRefreshAllWallets?: () => void;
    userStats?: UserStats;
    monUsdPrice?: number;

}
const QuickBuyWidget: React.FC<QuickBuyWidgetProps> = ({
    isOpen,
    onClose,
    tokenSymbol = "TOKEN",
    tokenAddress,
    tokenPrice = 0,
    buySlippageValue,
    buyPriorityFee,
    sellSlippageValue,
    sellPriorityFee,
    sendUserOperationAsync,
    account,
    setChain,
    activechain,
    routerAddress,
    setpopup,
    tokenBalances = {},
    refetch,
    subWallets = [],
    walletTokenBalances = {},
    activeWalletPrivateKey,
    setOneCTSigner,
    tokenList = [],
    isBlurred = false,
    forceRefreshAllWallets,
    userStats = {
        balance: 0,
        amountBought: 0,
        amountSold: 0,
        valueBought: 0,
        valueSold: 0,
        valueNet: 0,
    },
    monUsdPrice = 0,
}) => {

    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [selectedBuyAmount, setSelectedBuyAmount] = useState('1');
    const [selectedSellPercent, setSelectedSellPercent] = useState('25%');
    const [isEditMode, setIsEditMode] = useState(false);
    const [sellMode, setSellMode] = useState<'percent' | 'mon'>('percent');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempValue, setTempValue] = useState('');
    const [buyAmounts, setBuyAmounts] = useState(['1', '5', '10', '50']);
    const [sellPercents, setSellPercents] = useState(['10%', '25%', '50%', '100%']);
    const [sellMONAmounts, setSellMONAmounts] = useState(['1', '5', '10', '25']);
    const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
    const [_lastRefreshTime, setLastRefreshTime] = useState(0);
    const [quickBuyPreset, setQuickBuyPreset] = useState(1);
    const [isWalletsExpanded, setIsWalletsExpanded] = useState(false);
    const [walletNames, setWalletNames] = useState<{ [address: string]: string }>({});
    const [keybindsEnabled, setKeybindsEnabled] = useState(false);

    const widgetRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const storedWalletNames = localStorage.getItem('crystal_wallet_names');
        if (storedWalletNames) {
            try {
                setWalletNames(JSON.parse(storedWalletNames));
            } catch (error) {
                console.error('Error loading wallet names:', error);
            }
        }
    }, []);

    const formatNumberWithCommas = (num: number, decimals = 2) => {
        if (num === 0) return "0";
        if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
        if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
        if (num >= 1) return num.toLocaleString("en-US", { maximumFractionDigits: decimals });
        return num.toFixed(Math.min(decimals, 8));
    };

    const getWalletBalance = (address: string) => {
        const balances = walletTokenBalances[address];
        if (!balances) return 0;

        const ethToken = tokenList.find(t => t.address === settings.chainConfig[activechain]?.eth);
        if (ethToken && balances[ethToken.address]) {
            return Number(balances[ethToken.address]) / 10 ** Number(ethToken.decimals);
        }
        return 0;
    };

    const getWalletName = (address: string, index: number) => {
        return walletNames[address] || `Wallet ${index + 1}`;
    };

    const isWalletActive = (privateKey: string) => {
        return activeWalletPrivateKey === privateKey;
    };

    const handleSetActiveWallet = (privateKey: string) => {
        if (!isWalletActive(privateKey) && setOneCTSigner) {
            localStorage.setItem('crystal_active_wallet_private_key', privateKey);
            setOneCTSigner(privateKey);

            if (refetch) {
                setTimeout(() => refetch(), 100);
            }
            if (forceRefreshAllWallets) {
                setTimeout(() => forceRefreshAllWallets(), 200);
            }
        }
    };

    const currentTokenBalance = tokenBalances[tokenAddress || ''] ?? 0n;
    const tokenBalance = Number(currentTokenBalance) / 1e18;
    const getCurrentWalletMONBalance = () => {
        if (!activeWalletPrivateKey) return 0;

        const currentWallet = subWallets.find(w => w.privateKey === activeWalletPrivateKey);
        if (!currentWallet) return 0;

        return getWalletBalance(currentWallet.address);
    };
    const forceRefresh = useCallback(() => {
        if (refetch) {
            refetch();
            setLastRefreshTime(Date.now());
        }

        if (forceRefreshAllWallets) {
            forceRefreshAllWallets();
        }
    }, [refetch, forceRefreshAllWallets]);
    useEffect(() => {
        if (isOpen && account?.connected) {
            forceRefresh();
        }
    }, [isOpen, account?.connected]);
    const [widgetDimensions, setWidgetDimensions] = useState({ width: 330, height: 480 });
    useEffect(() => {
        const handleResize = () => {
            if (!widgetRef.current) return;

            const rect = widgetRef.current.getBoundingClientRect();
            const actualWidth = rect.width || 330;
            const actualHeight = rect.height || 480;

            setWidgetDimensions({ width: actualWidth, height: actualHeight });

            setPosition(prevPosition => {
                const maxX = Math.max(0, window.innerWidth - actualWidth);
                const maxY = Math.max(0, window.innerHeight - actualHeight);

                return {
                    x: Math.max(0, Math.min(prevPosition.x, maxX)),
                    y: Math.max(0, Math.min(prevPosition.y, maxY))
                };
            });
        };

        if (isOpen) {
            handleResize();
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, [isOpen]);
    const handleBuyTrade = async (amount: string) => {
        if (!account?.connected || !sendUserOperationAsync || !tokenAddress || !routerAddress) {
            if (setpopup) setpopup(4);
            return;
        }

        const currentChainId = Number(account.chainId);

        if (currentChainId != activechain) {
            if (setChain) setChain();
            return;
        }

        const requestedAmount = parseFloat(amount);
        const currentMONBalance = getCurrentWalletMONBalance();

        if (requestedAmount > currentMONBalance) {
            const txId = `insufficient-${Date.now()}`;
            if (showLoadingPopup) {
                showLoadingPopup(txId, {
                    title: 'Insufficient Balance',
                    subtitle: `Need ${amount} MON but only have ${currentMONBalance.toFixed(4)} MON`,
                    amount: amount,
                    amountUnit: 'MON'
                });
            }

            if (updatePopup) {
                setTimeout(() => {
                    updatePopup(txId, {
                        title: 'Insufficient Balance',
                        subtitle: `You need ${amount} MON but only have ${currentMONBalance.toFixed(4)} MON available`,
                        variant: 'error',
                        isLoading: false
                    });
                }, 100);
            }
            return;
        }

        const txId = `buy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newTx: PendingTransaction = {
            id: txId,
            type: 'buy',
            amount,
            timestamp: Date.now(),
            status: 'pending'
        };

        setPendingTransactions(prev => {
            const updated = [...prev, newTx];
            return updated;
        });

        if (showLoadingPopup) {
            showLoadingPopup(txId, {
                title: 'Sending transaction...',
                subtitle: `Buying ${amount} MON worth of ${tokenSymbol}`,
                amount,
                amountUnit: 'MON'
            });
        }

        try {
            const valNum = parseFloat(amount);
            const value = BigInt(Math.round(valNum * 1e18));

            const uo = {
                target: routerAddress,
                data: encodeFunctionData({
                    abi: CrystalRouterAbi,
                    functionName: "buy",
                    args: [true, tokenAddress as `0x${string}`, value, 0n],
                }),
                value,
            };

            if (updatePopup) {
                updatePopup(txId, {
                    title: 'Confirming transaction...',
                    subtitle: `Buying ${amount} MON worth of ${tokenSymbol}`,
                    variant: 'info'
                });
            }

            const op = await sendUserOperationAsync({ uo });

            const expectedTokens = tokenPrice > 0 ? parseFloat(amount) / tokenPrice : 0;
            if (updatePopup) {
                updatePopup(txId, {
                    title: 'Buy completed!',
                    subtitle: `Bought ~${formatNumberWithCommas(expectedTokens, 4)} ${tokenSymbol}`,
                    variant: 'success',
                    isLoading: false
                });
            }

            setPendingTransactions(prev => {
                const updated = prev.filter(tx => tx.id !== txId);
                return updated;
            });

            setTimeout(() => {
                forceRefresh();
            }, 1500);

        } catch (error: any) {
            if (updatePopup) {
                updatePopup(txId, {
                    title: 'Buy failed',
                    subtitle: error?.message || 'Transaction was rejected',
                    variant: 'error',
                    isLoading: false
                });
            }

            setPendingTransactions(prev => {
                const updated = prev.filter(tx => tx.id !== txId);
                return updated;
            });
        }
    };

    const handleSellTrade = async (value: string) => {
        if (!account?.connected || !sendUserOperationAsync || !tokenAddress || !routerAddress) {
            setpopup?.(4);
            return;
        }

        const currentChainId = Number(account.chainId);

        if (currentChainId != activechain) {
            setChain?.();
            return;
        }

        const txId = `sell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newTx: PendingTransaction = {
            id: txId,
            type: 'sell',
            amount: value,
            timestamp: Date.now(),
            status: 'pending'
        };

        setPendingTransactions(prev => {
            const updated = [...prev, newTx];
            return updated;
        });

        if (showLoadingPopup) {
            showLoadingPopup(txId, {
                title: 'Sending transaction...',
                subtitle: `Selling ${value} ${sellMode === 'percent' ? '' : 'MON worth'} of ${tokenSymbol}`,
                amount: value,
                amountUnit: sellMode === 'percent' ? '%' : 'MON'
            });
        }

        try {
            let amountTokenWei: bigint;

            if (sellMode === 'percent') {
                const pct = BigInt(parseInt(value.replace('%', ''), 10));
                amountTokenWei = pct === 100n
                    ? (currentTokenBalance > 0n ? currentTokenBalance - 1n : 0n)
                    : (currentTokenBalance * pct) / 100n;
            } else {
                const mon = parseFloat(value);
                const tokens = tokenPrice > 0 ? mon / tokenPrice : 0;
                amountTokenWei = BigInt(Math.floor(tokens * 1e18));
            }

            if (amountTokenWei <= 0n || amountTokenWei > currentTokenBalance) {
                throw new Error(`Invalid sell amount. Trying to sell ${amountTokenWei.toString()} but only have ${currentTokenBalance.toString()}`);
            }

            if (updatePopup) {
                updatePopup(txId, {
                    title: 'Confirming sell...',
                    subtitle: `Selling ${value} ${sellMode === 'percent' ? '' : 'MON worth'} of ${tokenSymbol}`,
                    variant: 'info'
                });
            }

            const sellUo = {
                target: routerAddress as `0x${string}`,
                data: encodeFunctionData({
                    abi: CrystalRouterAbi,
                    functionName: "sell",
                    args: [true, tokenAddress as `0x${string}`, amountTokenWei, 0n],
                }),
                value: 0n,
            };

            const sellOp = await sendUserOperationAsync({ uo: sellUo });

            const soldTokens = Number(amountTokenWei) / 1e18;
            const expectedMON = soldTokens * tokenPrice;
            if (updatePopup) {
                updatePopup(txId, {
                    title: 'Sell completed!',
                    subtitle: `Sold ${formatNumberWithCommas(soldTokens, 4)} ${tokenSymbol} for ~${formatNumberWithCommas(expectedMON, 4)} MON`,
                    variant: 'success',
                    isLoading: false
                });
            }

            setPendingTransactions(prev => {
                const updated = prev.filter(tx => tx.id !== txId);
                return updated;
            });

            setTimeout(() => {
                forceRefresh();
            }, 500);

        } catch (e: any) {
            if (updatePopup) {
                updatePopup(txId, {
                    title: 'Sell failed',
                    subtitle: e?.message || 'Transaction was rejected',
                    variant: 'error',
                    isLoading: false
                });
            }

            setPendingTransactions(prev => {
                const updated = prev.filter(tx => tx.id !== txId);
                return updated;
            });

            if (String(e?.message || '').includes('Invalid sell amount')) {
                if (updatePopup) {
                    updatePopup(txId, {
                        title: 'Insufficient balance',
                        subtitle: `Not enough ${tokenSymbol} for this sell`,
                        variant: 'error',
                        isLoading: false
                    });
                }
            }
        }
    };
    // Keybind functionality
    useEffect(() => {
        if (!keybindsEnabled || !isOpen || isEditMode) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            // Prevent if user is typing in an input field
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const key = e.key.toLowerCase();

            // Buy keybinds: Q, W, E, R
            if (['q', 'w', 'e', 'r'].includes(key)) {
                e.preventDefault();
                const buyIndex = ['q', 'w', 'e', 'r'].indexOf(key);
                if (buyIndex < buyAmounts.length) {
                    const amount = buyAmounts[buyIndex];
                    setSelectedBuyAmount(amount);
                    handleBuyTrade(amount);
                }
            }

            // Sell keybinds: A, S, D, F
            if (['a', 's', 'd', 'f'].includes(key)) {
                e.preventDefault();
                const sellIndex = ['a', 's', 'd', 'f'].indexOf(key);
                const currentSellValues = sellMode === 'percent' ? sellPercents : sellMONAmounts;
                if (sellIndex < currentSellValues.length) {
                    const value = currentSellValues[sellIndex];
                    setSelectedSellPercent(value);
                    handleSellTrade(value);
                }
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [keybindsEnabled, isOpen, isEditMode, buyAmounts, sellPercents, sellMONAmounts, sellMode, handleBuyTrade, handleSellTrade]);


    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!widgetRef.current || isEditMode) return;

        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' ||
            target.tagName === 'IMG' ||
            target.closest('button') ||
            target.closest('.quickbuy-edit-icon') ||
            target.closest('.close-btn') ||
            target.closest('.quickbuy-settings-display') ||
            target.closest('.quickbuy-preset-controls')) {
            return;
        }

        const rect = widgetRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setIsDragging(true);
        e.preventDefault();
    }, [isEditMode]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;

        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        const maxX = Math.max(0, window.innerWidth - widgetDimensions.width);
        const maxY = Math.max(0, window.innerHeight - widgetDimensions.height);

        setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
        });
    }, [isDragging, dragOffset, widgetDimensions]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    useEffect(() => {
        if (editingIndex !== null && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingIndex]);

    const handleEditToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditMode(!isEditMode);
        setEditingIndex(null);
        setTempValue('');
    }, [isEditMode]);

    const handleKeybindToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setKeybindsEnabled(!keybindsEnabled);
    }, [keybindsEnabled]);

    const handleSellModeToggle = useCallback(() => {
        setSellMode(sellMode === 'percent' ? 'mon' : 'percent');
    }, [sellMode]);

    const handleBuyButtonClick = useCallback((amount: string, index: number) => {
        if (isEditMode) {
            setEditingIndex(index);
            setTempValue(amount);
        } else {
            setSelectedBuyAmount(amount);
            handleBuyTrade(amount);
        }
    }, [isEditMode, handleBuyTrade]);

    const handleSellButtonClick = useCallback((value: string, index: number) => {
        if (isEditMode) {
            setEditingIndex(index + 100);
            setTempValue(sellMode === 'percent' ? value.replace('%', '') : value);
        } else {
            setSelectedSellPercent(value);
            handleSellTrade(value);
        }
    }, [isEditMode, sellMode, handleSellTrade]);

    const handleInputSubmit = useCallback(() => {
        if (editingIndex === null || tempValue.trim() === '') return;

        if (editingIndex < 100) {
            const newBuyAmounts = [...buyAmounts];
            newBuyAmounts[editingIndex] = tempValue;
            setBuyAmounts(newBuyAmounts);
        } else {
            const sellIndex = editingIndex - 100;
            if (sellMode === 'percent') {
                const newSellPercents = [...sellPercents];
                newSellPercents[sellIndex] = `${tempValue}%`;
                setSellPercents(newSellPercents);
            } else {
                const newSellMONAmounts = [...sellMONAmounts];
                newSellMONAmounts[sellIndex] = tempValue;
                setSellMONAmounts(newSellMONAmounts);
            }
        }

        setEditingIndex(null);
        setTempValue('');
    }, [editingIndex, tempValue, buyAmounts, sellPercents, sellMONAmounts, sellMode]);

    const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleInputSubmit();
        } else if (e.key === 'Escape') {
            setEditingIndex(null);
            setTempValue('');
        }
    }, [handleInputSubmit]);

    const currentSellValues = sellMode === 'percent' ? sellPercents : sellMONAmounts;
    const pendingBuyCount = pendingTransactions.filter(tx => tx.type === 'buy').length;
    const pendingSellCount = pendingTransactions.filter(tx => tx.type === 'sell').length;

    const getSellButtonStatus = (value: string) => {
        if (!account?.connected || tokenBalance <= 0) return true;

        if (sellMode === 'percent') {
            const percentage = parseFloat(value.replace('%', ''));
            const requiredTokens = (tokenBalance * percentage) / 100;
            return requiredTokens > tokenBalance;
        } else {
            const monAmount = parseFloat(value);
            const requiredTokens = tokenPrice > 0 ? monAmount / tokenPrice : 0;
            return requiredTokens > tokenBalance;
        }
    };


    const walletsPosition = useMemo(() => {
        const baseX = position.x + widgetDimensions.width - 4;
        const baseY = position.y;
        const walletsPanelWidth = 280;

        const maxWalletsX = window.innerWidth - walletsPanelWidth;

        if (baseX > maxWalletsX) {
            return {
                x: Math.max(10, position.x - walletsPanelWidth + 4),
                y: baseY
            };
        }

        return { x: baseX, y: baseY };
    }, [position, widgetDimensions]);


    const isPanelLeft = walletsPosition.x < position.x;
    const maxWalletsX = window.innerWidth - 280;
    if (walletsPosition.x > maxWalletsX) {
        walletsPosition.x = position.x - 280 - 10;
    }

    if (!isOpen) return null;

    return (
        <>
            {/* Main QuickBuy Widget */}
            <div
                ref={widgetRef}
                className={`quickbuy-widget ${isDragging ? 'dragging' : ''}`}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
            >
                <div
                    className="quickbuy-header"
                    onMouseDown={handleMouseDown}
                >
                    <div className="quickbuy-controls">
                        <div className="quickbuy-controls-left">
                            <button
                                className={`quickbuy-edit-icon  ${keybindsEnabled ? 'active' : ''}`}
                                onClick={handleKeybindToggle}
                                title={`Keybinds ${keybindsEnabled ? 'ON' : 'OFF'} - Buy: QWER, Sell: ASDF`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#a6a9b6ff"><path d="M260-120q-58 0-99-41t-41-99q0-58 41-99t99-41h60v-160h-60q-58 0-99-41t-41-99q0-58 41-99t99-41q58 0 99 41t41 99v60h160v-60q0-58 41-99t99-41q58 0 99 41t41 99q0 58-41 99t-99 41h-60v160h60q58 0 99 41t41 99q0 58-41 99t-99 41q-58 0-99-41t-41-99v-60H400v60q0 58-41 99t-99 41Zm0-80q25 0 42.5-17.5T320-260v-60h-60q-25 0-42.5 17.5T200-260q0 25 17.5 42.5T260-200Zm440 0q25 0 42.5-17.5T760-260q0-25-17.5-42.5T700-320h-60v60q0 25 17.5 42.5T700-200ZM400-400h160v-160H400v160ZM260-640h60v-60q0-25-17.5-42.5T260-760q-25 0-42.5 17.5T200-700q0 25 17.5 42.5T260-640Zm380 0h60q25 0 42.5-17.5T760-700q0-25-17.5-42.5T700-760q-25 0-42.5 17.5T640-700v60Z" /></svg>
                            </button>

                            <div className="quickbuy-preset-controls">
                                <button
                                    className={`quickbuy-preset-pill ${quickBuyPreset === 1 ? 'active' : ''}`}
                                    onClick={() => setQuickBuyPreset(1)}
                                >
                                    P1
                                </button>
                                <button
                                    className={`quickbuy-preset-pill ${quickBuyPreset === 2 ? 'active' : ''}`}
                                    onClick={() => setQuickBuyPreset(2)}
                                >
                                    P2
                                </button>
                                <button
                                    className={`quickbuy-preset-pill ${quickBuyPreset === 3 ? 'active' : ''}`}
                                    onClick={() => setQuickBuyPreset(3)}
                                >
                                    P3
                                </button>
                            </div>
                            <img
                                src={editicon}
                                alt="Edit"
                                className={`quickbuy-edit-icon ${isEditMode ? 'active' : ''}`}
                                onClick={handleEditToggle}
                            />

                        </div>

                        <div className="quickbuy-controls-right-side">
                            {subWallets.length > 0 && (
                                <button
                                    className={`quickbuy-wallets-button ${isWalletsExpanded ? 'active' : ''}`}
                                    onClick={() => setIsWalletsExpanded(!isWalletsExpanded)}
                                    title="Toggle Wallets"
                                >
                                    <img src={walleticon} alt="Wallet" className="quickbuy-wallets-icon" />
                                    <span className="quickbuy-wallets-count">{subWallets.length}</span>

                                </button>
                            )}

                            <button className="close-btn" onClick={onClose}>
                                <img className="quickbuy-close-icon" src={closebutton} alt="Close" />
                            </button>
                        </div>
                    </div>
                    <div className="quickbuy-drag-handle">
                        <img src={squares} alt="Squares" className="quickbuy-squares-icon" />
                        <img src={squares} alt="Squares" className="quickbuy-squares-icon" />
                    </div>
                </div>

                <div className="quickbuy-content">
                    <div className="buy-section">
                        <div className="section-header">
                            <span>Buy {keybindsEnabled && <span className="quickbuy-keybind-hint">QWER</span>}</span>
                            <div className="quickbuy-order-indicator">
                                <img className="quickbuy-monad-icon" src={monadicon} alt="Order Indicator" />
                                {pendingBuyCount > 0 ? (
                                    <div className="quickbuy-spinner" />
                                ) : (
                                    pendingBuyCount
                                )}
                            </div>
                        </div>

                        <div className="amount-buttons">
                            {buyAmounts.map((amount, index) => (
                                <div key={index} className="button-container">
                                    {editingIndex === index ? (
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            onKeyDown={handleInputKeyDown}
                                            onBlur={handleInputSubmit}
                                            className="edit-input"
                                        />
                                    ) : (
                                        <button
                                            className={`amount-btn ${isEditMode ? 'edit-mode' : ''} ${selectedBuyAmount === amount ? 'active' : ''} ${keybindsEnabled ? 'keybind-enabled' : ''}`}
                                            onClick={() => handleBuyButtonClick(amount, index)}
                                            disabled={!account?.connected}
                                        >
                                            {amount}
                                            {keybindsEnabled && <span className="quickbuy-keybind-key">{'QWER'[index]}</span>}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="quickbuy-settings-display">
                            <div className="quickbuy-settings-item">
                                <img src={slippage} alt="Slippage" className="quickbuy-settings-icon-slippage" />
                                <span className="quickbuy-settings-value">{buySlippageValue}%</span>
                            </div>
                            <div className="quickbuy-settings-item">
                                <img src={gas} alt="Priority Fee" className="quickbuy-settings-icon-priority" />
                                <span className="quickbuy-settings-value">{buyPriorityFee}</span>
                            </div>
                        </div>
                    </div>

                    <div className="sell-section">
                        <div className="section-header">
                            <div className="sell-header-left">
                                <span>Sell </span>
                                <span className="quickbuy-percent">
                                    {sellMode === 'percent' ? '%' : 'MON'}
                                </span>
                                <button
                                    className="sell-mode-toggle"
                                    onClick={handleSellModeToggle}
                                    title={`Switch to ${sellMode === 'percent' ? 'MON' : '%'} mode`}
                                >
                                    <img className="quickbuy-switch-icon" src={switchicon} alt="Switch" />
                                </button>
                                {keybindsEnabled && <span className="quickbuy-keybind-hint">ASDF</span>}
                            </div>
                            <div className="quickbuy-order-indicator">
                                <div className="quickbuy-token-balance">
                                    <span className="quickbuy-token-amount">
                                        {formatNumberWithCommas(userStats.balance, 2)} {tokenSymbol}
                                    </span>
                                    •
                                    <span className="quickbuy-usd-value">
                                        ${formatNumberWithCommas(userStats.balance * tokenPrice * monUsdPrice, 2)}
                                    </span>
                                    •
                                    <span className="quickbuy-mon-value">
                                        <img className="quickbuy-monad-icon" src={monadicon} alt="Order Indicator" />
                                        {formatNumberWithCommas(userStats.balance * tokenPrice, 2)}
                                    </span>
                                </div>
                            </div>

                        </div>

                        <div className="percent-buttons">
                            {currentSellValues.map((value, index) => {
                                const isDisabled = getSellButtonStatus(value);
                                return (
                                    <div key={index} className="button-container">
                                        {editingIndex === index + 100 ? (
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={tempValue}
                                                onChange={(e) => setTempValue(e.target.value)}
                                                onKeyDown={handleInputKeyDown}
                                                onBlur={handleInputSubmit}
                                                className="edit-input"
                                            />
                                        ) : (
                                            <button
                                                className={`percent-btn ${isEditMode ? 'edit-mode' : ''} ${selectedSellPercent === value ? 'active' : ''} ${isDisabled ? 'insufficient' : ''} ${keybindsEnabled ? 'keybind-enabled' : ''}`}
                                                onClick={() => handleSellButtonClick(value, index)}
                                                disabled={!account?.connected || isDisabled}
                                                title={isDisabled ? `Insufficient balance for ${value}` : ''}
                                            >
                                                {value}
                                                {keybindsEnabled && <span className="quickbuy-keybind-key">{'ASDF'[index]}</span>}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="quickbuy-settings-display">
                            <div className="quickbuy-settings-item">
                                <img src={slippage} alt="Slippage" className="quickbuy-settings-icon" />
                                <span className="quickbuy-settings-value">{sellSlippageValue}%</span>
                            </div>
                            <div className="quickbuy-settings-item">
                                <img src={gas} alt="Priority Fee" className="quickbuy-settings-icon" />
                                <span className="quickbuy-settings-value">{sellPriorityFee}</span>
                            </div>
                        </div>
                    </div>
                    <div className="quickbuy-portfolio-section">
                        <div className="quickbuy-portfolio-stat">
                            <div className="quickbuy-portfolio-value bought">
                                <img className="quickbuy-monad-icon" src={monadicon} alt="MON" />
                                {formatNumberWithCommas(userStats.valueBought, 1)}
                            </div>
                        </div>
                        <div className="quickbuy-portfolio-stat">
                            <div className="quickbuy-portfolio-value sold">
                                <img className="quickbuy-monad-icon" src={monadicon} alt="MON" />
                                {formatNumberWithCommas(userStats.valueSold, 1)}
                            </div>
                        </div>
                        <div className="quickbuy-portfolio-stat">
                            <div className="quickbuy-portfolio-value holding">
                                <img className="quickbuy-monad-icon" src={monadicon} alt="MON" />
                                {formatNumberWithCommas(userStats.balance * tokenPrice, 2)}
                            </div>
                        </div>
                        <div className="quickbuy-portfolio-stat pnl">
                            <div className={`quickbuy-portfolio-value pnl ${userStats.valueNet >= 0 ? 'positive' : 'negative'}`}>
                                <img className="quickbuy-monad-icon" src={monadicon} alt="MON" />
                                {userStats.valueNet >= 0 ? '+' : ''}{formatNumberWithCommas(userStats.valueNet, 1)}
                                {userStats.valueBought > 0 ? ` (${userStats.valueNet >= 0 ? '+' : ''}${((userStats.valueNet / userStats.valueBought) * 100).toFixed(1)}%)` : ' (0%)'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isWalletsExpanded && (
                <div
                    className={`quickbuy-wallets-panel ${isPanelLeft ? 'left' : 'right'}`}
                    style={{ left: `${walletsPosition.x}px`, top: `${walletsPosition.y}px` }}
                >
                    <div className="quickbuy-wallets-header">
                        <span className="quickbuy-wallets-title">Wallets</span>
                    </div>

                    <div className="quickbuy-wallets-list">
                        {subWallets.length === 0 ? (
                            <div className="quickbuy-wallets-empty">
                                <div className="quickbuy-wallets-empty-text">No wallets</div>
                                <div className="quickbuy-wallets-empty-subtitle">Create in Portfolio</div>
                            </div>
                        ) : (
                            subWallets.map((wallet, index) => {
                                const balance = getWalletBalance(wallet.address);
                                const isActive = isWalletActive(wallet.privateKey);

                                return (
                                    <div key={wallet.address} className={`quickbuy-wallet-item ${isActive ? 'active' : ''}`}>
                                        <div className="quickbuy-wallet-checkbox-container">
                                            <input
                                                type="checkbox"
                                                className="quickbuy-wallet-checkbox"
                                                checked={isActive}
                                                onChange={() => handleSetActiveWallet(wallet.privateKey)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>

                                        <div className="quickbuy-wallet-info">
                                            <div className="quickbuy-wallet-name">
                                                {getWalletName(wallet.address, index)}
                                            </div>
                                            <div className="quickbuy-wallet-address">
                                                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                                            </div>
                                        </div>

                                        <div className="quickbuy-wallet-balance">
                                            <div className={`quickbuy-wallet-balance-amount ${isBlurred ? 'blurred' : ''}`}>
                                                <img src={monadicon} className="quickbuy-wallet-mon-icon" alt="MON" />
                                                {formatNumberWithCommas(balance, 2)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default QuickBuyWidget;