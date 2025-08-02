import React, { useState, useRef, useCallback, useEffect } from 'react';
import './QuickBuyWidget.css';
import monadicon from '../../../assets/monadlogo.svg';
import { settings } from '../../../settings';
import closebutton from '../../../assets/close_button.png';
import squares from '../../../assets/squares.svg';
import editicon from '../../../assets/edit.svg';
import switchicon from '../../../assets/switch.svg';
import { showLoadingPopup, updatePopup } from '../../MemeTransactionPopup/MemeTransactionPopupManager';

// Import settings icons
import slippage from '../../../assets/slippage.svg';
import gas from '../../../assets/gas.svg';
import bribe from '../../../assets/bribe.svg';

import { Check } from 'lucide-react';
import { encodeFunctionData } from 'viem';
import { MaxUint256 } from 'ethers';
interface PendingTransaction {
  id: string;
  type: 'buy' | 'sell';
  amount: string;
  timestamp: number;
  status: 'pending' | 'confirming' | 'complete' | 'error';
}
interface QuickBuyWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    tokenSymbol?: string;
    tokenName?: string;
    tokenAddress?: string;
    tokenPrice?: number;
    // Buy settings
    buySlippageValue: string;
    buyPriorityFee: string;
    buyBribeValue: string;
    // Sell settings
    sellSlippageValue: string;
    sellPriorityFee: string;
    sellBribeValue: string;
    // Trading functions
    sendUserOperationAsync?: any;
    waitForTxReceipt?: any;
    account?: { connected: boolean; address: string; chainId: number };
    setChain?: () => void;
    activechain?: string;
    routerAddress?: string;
    setpopup?: (value: number) => void;
    // Live data from parent component
    tokenBalances?: { [key: string]: bigint };
    allowance?: bigint;
    refetch?: () => void;
    // Remove showLoadingPopup and updatePopup props - we'll get them from context
}

const QuickBuyWidget: React.FC<QuickBuyWidgetProps> = ({
    isOpen,
    onClose,
    tokenSymbol = "TOKEN",
    tokenName = "Token Name",
    tokenAddress,
    tokenPrice = 0,
    buySlippageValue,
    buyPriorityFee,
    buyBribeValue,
    sellSlippageValue,
    sellPriorityFee,
    sellBribeValue,
    sendUserOperationAsync,
    waitForTxReceipt,
    account,
    setChain,
    activechain,
    routerAddress,
    setpopup,
    tokenBalances = {},
    allowance = BigInt(0),
    refetch,
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
    const [lastRefreshTime, setLastRefreshTime] = useState(0);

    // Internal preset state for QuickBuy widget only
    const [quickBuyPreset, setQuickBuyPreset] = useState(1);

    const widgetRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Import ABIs
    const CrystalLaunchpadRouter = [
        {
            "inputs": [{"name": "token", "type": "address"}],
            "name": "buy",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {"name": "token", "type": "address"},
                {"name": "amount", "type": "uint256"}
            ],
            "name": "sell",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];

    const CrystalLaunchpadToken = [
        {
            "inputs": [
                {"name": "spender", "type": "address"},
                {"name": "amount", "type": "uint256"}
            ],
            "name": "approve",
            "outputs": [{"name": "", "type": "bool"}],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];

    const formatNumberWithCommas = (num: number, decimals = 2) => {
        if (num === 0) return "0";
        if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
        if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
        if (num >= 1) return num.toLocaleString("en-US", { maximumFractionDigits: decimals });
        return num.toFixed(Math.min(decimals, 8));
    };

    const currentTokenBalance = tokenBalances[tokenAddress || ''] ?? 0n;
    const currentAllowance = allowance ?? 0n;

    // for display only
    const tokenBalance = Number(currentTokenBalance) / 1e18;
    const allowanceBalance = Number(currentAllowance) / 1e18;

    // Force refresh function that triggers parent refetch
    const forceRefresh = useCallback(() => {
        if (refetch) {
            refetch();
            setLastRefreshTime(Date.now());
        }
    }, [refetch]);

    // Auto-refresh when widget opens or after trades
    useEffect(() => {
        if (isOpen && account?.connected) {
            // Force refresh when widget opens
            forceRefresh();
        }
    }, [isOpen, account?.connected]);

const handleBuyTrade = async (amount: string) => {
  console.log('🛒 handleBuyTrade called with amount:', amount);
  
  if (!account?.connected || !sendUserOperationAsync || !waitForTxReceipt || !tokenAddress || !routerAddress) {
    console.log('❌ Missing required dependencies:', {
      connected: account?.connected,
      sendUserOperationAsync: !!sendUserOperationAsync,
      waitForTxReceipt: !!waitForTxReceipt,
      tokenAddress: !!tokenAddress,
      routerAddress: !!routerAddress
    });
    if (setpopup) setpopup(4);
    return;
  }

  const targetChainId = Number(settings?.chainConfig?.[activechain || '']?.chainId || activechain);
  const currentChainId = Number(account.chainId);
  
  if (currentChainId !== targetChainId) {
    console.log('❌ Wrong chain:', { current: currentChainId, target: targetChainId });
    if (setChain) setChain();
    return;
  }

  const txId = `buy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log('🆔 Generated txId:', txId);
  
  // Add to pending transactions for widget counter
  const newTx: PendingTransaction = {
    id: txId,
    type: 'buy',
    amount,
    timestamp: Date.now(),
    status: 'pending'
  };
  
  setPendingTransactions(prev => {
    const updated = [...prev, newTx];
    console.log('📊 Updated pendingTransactions:', updated);
    return updated;
  });

  // Show INSTANT loading popup
  console.log('🚀 About to call showLoadingPopup');
  if (showLoadingPopup) {
    showLoadingPopup(txId, {
      title: 'Sending transaction...',
      subtitle: `Buying ${amount} MON worth of ${tokenSymbol}`,
      amount,
      amountUnit: 'MON'
    });
    console.log('✅ showLoadingPopup called');
  } else {
    console.log('❌ showLoadingPopup is undefined');
  }

  try {
    const valNum = parseFloat(amount);
    const value = BigInt(Math.round(valNum * 1e18));
    console.log('💰 Calculated value:', { valNum, value: value.toString() });

    const uo = {
      target: routerAddress,
      data: encodeFunctionData({
        abi: CrystalLaunchpadRouter,
        functionName: "buy",
        args: [tokenAddress as `0x${string}`],
      }),
      value,
    };

    // Update popup to "confirming"
    console.log('📝 About to call updatePopup with info variant');
    if (updatePopup) {
      updatePopup(txId, {
        title: 'Confirming transaction...',
        subtitle: `Buying ${amount} MON worth of ${tokenSymbol}`,
        variant: 'info'
      });
      console.log('✅ updatePopup called with info variant');
    } else {
      console.log('❌ updatePopup is undefined');
    }

    console.log('🔄 Sending user operation...');
    const op = await sendUserOperationAsync({ uo });
    console.log('⏳ Waiting for transaction receipt...', op.hash);
    await waitForTxReceipt(op.hash);
    console.log('✅ Transaction confirmed!');

    // Update to SUCCESS
    const expectedTokens = tokenPrice > 0 ? parseFloat(amount) / tokenPrice : 0;
    console.log('🎉 About to call updatePopup with success variant');
    if (updatePopup) {
      updatePopup(txId, {
        title: 'Buy completed!',
        subtitle: `Bought ~${formatNumberWithCommas(expectedTokens, 4)} ${tokenSymbol}`,
        variant: 'success'
      });
      console.log('✅ updatePopup called with success variant');
    } else {
      console.log('❌ updatePopup is undefined for success');
    }

    console.log('Buy order completed:', amount, 'MON');

    // Remove from local pending transactions only
    setPendingTransactions(prev => {
      const updated = prev.filter(tx => tx.id !== txId);
      console.log('📊 Removed from pendingTransactions:', updated);
      return updated;
    });

    // Force refresh after successful trade
    setTimeout(() => {
      console.log('🔄 Force refreshing balances...');
      forceRefresh();
    }, 1500);

  } catch (error: any) {
    console.error('❌ Buy trade failed:', error);
    
    // Update to ERROR
    console.log('💥 About to call updatePopup with error variant');
    if (updatePopup) {
      updatePopup(txId, {
        title: 'Buy failed',
        subtitle: error?.message || 'Transaction was rejected',
        variant: 'error'
      });
      console.log('✅ updatePopup called with error variant');
    } else {
      console.log('❌ updatePopup is undefined for error');
    }

    // Remove from local pending transactions only
    setPendingTransactions(prev => {
      const updated = prev.filter(tx => tx.id !== txId);
      console.log('📊 Removed failed tx from pendingTransactions:', updated);
      return updated;
    });
  }
};





const handleSellTrade = async (value: string) => {
  console.log('💸 handleSellTrade called with value:', value, 'mode:', sellMode);
  
  if (!account?.connected || !sendUserOperationAsync || !waitForTxReceipt || !tokenAddress || !routerAddress) {
    console.log('❌ Missing required dependencies for sell:', {
      connected: account?.connected,
      sendUserOperationAsync: !!sendUserOperationAsync,
      waitForTxReceipt: !!waitForTxReceipt,
      tokenAddress: !!tokenAddress,
      routerAddress: !!routerAddress
    });
    setpopup?.(4);
    return;
  }

  const targetChainId = Number(settings?.chainConfig?.[activechain || '']?.chainId || activechain);
  const currentChainId = Number(account.chainId);
  
  if (currentChainId !== targetChainId) {
    console.log('❌ Wrong chain for sell:', { current: currentChainId, target: targetChainId });
    setChain?.();
    return;
  }

  const txId = `sell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log('🆔 Generated sell txId:', txId);
  
  // Add to pending transactions
  const newTx: PendingTransaction = {
    id: txId,
    type: 'sell',
    amount: value,
    timestamp: Date.now(),
    status: 'pending'
  };
  
  setPendingTransactions(prev => {
    const updated = [...prev, newTx];
    console.log('📊 Updated pendingTransactions for sell:', updated);
    return updated;
  });

  // Show INSTANT loading popup
  console.log('🚀 About to call showLoadingPopup for sell');
  if (showLoadingPopup) {
    showLoadingPopup(txId, {
      title: 'Sending transaction...',
      subtitle: `Selling ${value} ${sellMode === 'percent' ? '' : 'MON worth'} of ${tokenSymbol}`,
      amount: value,
      amountUnit: sellMode === 'percent' ? '%' : 'MON'
    });
    console.log('✅ showLoadingPopup called for sell');
  } else {
    console.log('❌ showLoadingPopup is undefined for sell');
  }

  try {
    let amountTokenWei: bigint;

    console.log('🧮 Calculating sell amount...', {
      sellMode,
      value,
      currentTokenBalance: currentTokenBalance.toString(),
      tokenPrice
    });

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

    console.log('💰 Calculated sell amount:', {
      amountTokenWei: amountTokenWei.toString(),
      currentTokenBalance: currentTokenBalance.toString()
    });

    if (amountTokenWei <= 0n || amountTokenWei > currentTokenBalance) {
      throw new Error(`Invalid sell amount. Trying to sell ${amountTokenWei.toString()} but only have ${currentTokenBalance.toString()}`);
    }

    // Check allowance using BIGINT comparison
    console.log('🔍 Checking allowance...', {
      currentAllowance: currentAllowance.toString(),
      required: amountTokenWei.toString()
    });

    if (currentAllowance < amountTokenWei) {
      console.log('📝 Need approval, updating popup...');
      if (updatePopup) {
        updatePopup(txId, {
          title: 'Approving tokens...',
          subtitle: `Granting permission to sell ${tokenSymbol}`,
          variant: 'info'
        });
      }

      console.log('✍️ Sending approval transaction...');
      const approveUo = {
        target: tokenAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: CrystalLaunchpadToken,
          functionName: "approve",
          args: [routerAddress as `0x${string}`, MaxUint256],
        }),
        value: 0n,
      };
      const approveOp = await sendUserOperationAsync({ uo: approveUo });
      await waitForTxReceipt(approveOp.hash);
      console.log('✅ Approval confirmed, waiting for sync...');
      await new Promise(r => setTimeout(r, 800));
    }

    // Update popup to "confirming sell"
    console.log('📝 About to call updatePopup for sell confirmation');
    if (updatePopup) {
      updatePopup(txId, {
        title: 'Confirming sell...',
        subtitle: `Selling ${value} ${sellMode === 'percent' ? '' : 'MON worth'} of ${tokenSymbol}`,
        variant: 'info'
      });
      console.log('✅ updatePopup called for sell confirmation');
    } else {
      console.log('❌ updatePopup is undefined for sell confirmation');
    }

    console.log('💸 Sending sell transaction...');
    const sellUo = {
      target: routerAddress as `0x${string}`,
      data: encodeFunctionData({
        abi: CrystalLaunchpadRouter,
        functionName: "sell",
        args: [tokenAddress as `0x${string}`, amountTokenWei],
      }),
      value: 0n,
    };

    const sellOp = await sendUserOperationAsync({ uo: sellUo });
    console.log('⏳ Waiting for sell transaction receipt...', sellOp.hash);
    await waitForTxReceipt(sellOp.hash);
    console.log('✅ Sell transaction confirmed!');

    // Update to SUCCESS
    const soldTokens = Number(amountTokenWei) / 1e18;
    const expectedMON = soldTokens * tokenPrice;
    console.log('🎉 About to call updatePopup with sell success');
    if (updatePopup) {
      updatePopup(txId, {
        title: 'Sell completed!',
        subtitle: `Sold ${formatNumberWithCommas(soldTokens, 4)} ${tokenSymbol} for ~${formatNumberWithCommas(expectedMON, 4)} MON`,
        variant: 'success'
      });
      console.log('✅ updatePopup called with sell success');
    } else {
      console.log('❌ updatePopup is undefined for sell success');
    }

    // Remove from pending transactions
    setPendingTransactions(prev => {
      const updated = prev.filter(tx => tx.id !== txId);
      console.log('📊 Removed successful sell from pendingTransactions:', updated);
      return updated;
    });

    setTimeout(() => {
      console.log('🔄 Force refreshing balances after sell...');
      forceRefresh();
    }, 500);

  } catch (e: any) {
    console.error('❌ Sell trade failed:', e);
    
    // Update to ERROR
    console.log('💥 About to call updatePopup with sell error');
    if (updatePopup) {
      updatePopup(txId, {
        title: 'Sell failed',
        subtitle: e?.message || 'Transaction was rejected',
        variant: 'error'
      });
      console.log('✅ updatePopup called with sell error');
    } else {
      console.log('❌ updatePopup is undefined for sell error');
    }

    // Remove from pending transactions
    setPendingTransactions(prev => {
      const updated = prev.filter(tx => tx.id !== txId);
      console.log('📊 Removed failed sell from pendingTransactions:', updated);
      return updated;
    });

    // Handle specific error cases
    if (String(e?.message || '').includes('Invalid sell amount')) {
      console.log('💥 Insufficient balance error detected');
      if (updatePopup) {
        updatePopup(txId, {
          title: 'Insufficient balance',
          subtitle: `Not enough ${tokenSymbol} for this sell`,
          variant: 'error'
        });
      }
    }
  }
};
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

        const maxX = window.innerWidth - 300;
        const maxY = window.innerHeight - 480;

        setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
        });
    }, [isDragging, dragOffset]);

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

    const handleSellModeToggle = useCallback(() => {
        setSellMode(sellMode === 'percent' ? 'mon' : 'percent');
    }, [sellMode]);

    const handleBuyButtonClick = useCallback((amount: string, index: number) => {
        if (isEditMode) {
            setEditingIndex(index);
            setTempValue(amount);
        } else {
            setSelectedBuyAmount(amount);
            // Execute buy trade - this now allows multiple concurrent transactions
            handleBuyTrade(amount);
        }
    }, [isEditMode, handleBuyTrade]);

    const handleSellButtonClick = useCallback((value: string, index: number) => {
        if (isEditMode) {
            setEditingIndex(index + 100);
            setTempValue(sellMode === 'percent' ? value.replace('%', '') : value);
        } else {
            setSelectedSellPercent(value);
            // Execute sell trade - this now allows multiple concurrent transactions
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

    // Calculate portfolio values using live balance
    const portfolioValue = tokenBalance * tokenPrice;
    
    // Count pending transactions by type
    const pendingBuyCount = pendingTransactions.filter(tx => tx.type === 'buy').length;
    const pendingSellCount = pendingTransactions.filter(tx => tx.type === 'sell').length;

    // Check if sell buttons should be disabled based on live balance
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

    // Show loading indicator if we recently refreshed
    const isRefreshing = lastRefreshTime > 0 && (Date.now() - lastRefreshTime < 2000);

    if (!isOpen) return null;

    return (
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
                        <img
                            src={editicon}
                            alt="Edit"
                            className={`quickbuy-edit-icon ${isEditMode ? 'active' : ''}`}
                            onClick={handleEditToggle}
                        />

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
                    </div>

                    <div className="quickbuy-controls-right-side">
                        <button
                            className="refresh-btn"
                            onClick={forceRefresh}
                            disabled={isRefreshing}
                            title="Refresh balance"
                        >
                            <div className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`}>↻</div>
                        </button>
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
                        <span>Buy</span>
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
                                        className={`amount-btn ${isEditMode ? 'edit-mode' : ''} ${selectedBuyAmount === amount ? 'active' : ''}`}
                                        onClick={() => handleBuyButtonClick(amount, index)}
                                        disabled={!account?.connected}
                                    >
                                        {amount}
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
                        <div className="quickbuy-settings-item">
                            <img src={bribe} alt="Bribe" className="quickbuy-settings-icon-bribe" />
                            <span className="quickbuy-settings-value">{buyBribeValue}</span>
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
                        </div>
                        <div className="quickbuy-order-indicator">
                            <img className="quickbuy-monad-icon" src={monadicon} alt="Order Indicator" />
                            {pendingSellCount > 0 ? (
                                <div className="quickbuy-spinner" />
                            ) : (
                                pendingSellCount
                            )}
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
                                            className={`percent-btn ${isEditMode ? 'edit-mode' : ''} ${selectedSellPercent === value ? 'active' : ''} ${isDisabled ? 'insufficient' : ''}`}
                                            onClick={() => handleSellButtonClick(value, index)}
                                            disabled={!account?.connected || isDisabled}
                                            title={isDisabled ? `Insufficient balance for ${value}` : ''}
                                        >
                                            {value}
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
                        <div className="quickbuy-settings-item">
                            <img src={bribe} alt="Bribe" className="quickbuy-settings-icon" />
                            <span className="quickbuy-settings-value">{sellBribeValue}</span>
                        </div>
                    </div>
                </div>

                <div className="quickbuy-portfolio-section">
                    <div className="quickbuy-portfolio-item">
                        <span className="value green">
                            {formatNumberWithCommas(portfolioValue)} MON
                        </span>
                    </div>
                    <div className="quickbuy-portfolio-item">
                        <span className="value">
                            {formatNumberWithCommas(tokenBalance, 3)}
                        </span>
                    </div>
                    <div className="quickbuy-portfolio-item">
                        <span className="value">${formatNumberWithCommas(tokenPrice, 6)}</span>
                    </div>
                    <div className="quickbuy-portfolio-item">
                        <span className="value">{pendingBuyCount + pendingSellCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickBuyWidget;