import { useState, useCallback } from 'react';

interface WalletPopupData {
  type: 'distribution' | 'deposit' | 'transfer' | 'send' | 'import' | 'create' | 'trading';
  title: string;
  subtitle?: string;
  amount?: string;
  amountUnit?: string;
  sourceWallet?: string;
  destinationWallet?: string;
  walletCount?: number;
  autoCloseDelay?: number;
  variant?: 'success' | 'error' | 'info';
  isLoading?: boolean;
  tokenImage?: string;
}

export const TRANSACTION_TEXTS = {
  SENDING_TRANSACTION: 'Sending transaction...',
  CONFIRMING_TRANSACTION: 'Confirming transaction...',
  CONFIRMING_BUY: 'Confirming buy...',
  CONFIRMING_SELL: 'Confirming sell...',
  
  BUY_COMPLETED: 'Buy completed!',
  SELL_COMPLETED: 'Sell completed!',
  TRANSACTION_SUCCESSFUL: 'Transaction successful',
  DISTRIBUTION_COMPLETE: 'Distribution Complete',
  DEPOSIT_COMPLETE: 'Deposit Complete',
  TRANSFER_COMPLETE: 'Transfer Complete',
  WALLET_CREATED: 'Wallet Created',
  WALLET_IMPORTED: 'Wallet Imported',
  SEND_BACK_COMPLETE: 'Send Back Complete',
  
  TRANSACTION_FAILED: 'Transaction failed',
  BUY_FAILED: 'Buy failed',
  SELL_FAILED: 'Sell failed',
  INSUFFICIENT_BALANCE: 'Insufficient Balance',
  INSUFFICIENT_TOKEN_BALANCE: 'Insufficient balance',
  INVALID_SELL_AMOUNT: 'Invalid sell amount',
  
  CONNECT_WALLET: 'Connect Wallet',
  SWITCH_CHAIN: 'Switch Chain',
  WALLET_NOT_CONNECTED: 'Wallet not connected',
  
  PLEASE_TRY_AGAIN: 'Please try again.',
  TRANSACTION_REJECTED: 'Transaction was rejected',
  COPY_TO_CLIPBOARD: 'Copy to clipboard',
  COPIED_TO_CLIPBOARD: 'Copied to clipboard',
} as const;

export const TRANSACTION_SUBTITLES = {
  buyingToken: (amount: string, amountUnit: string, tokenSymbol: string) => 
    `Buying ${amount} ${amountUnit} worth of ${tokenSymbol}`,
  
  boughtToken: (tokenAmount: number, tokenSymbol: string, spentAmount: number, spentUnit: string) =>
    `Bought ~${tokenAmount.toFixed(4)} ${tokenSymbol} for ${spentAmount.toFixed(4)} ${spentUnit}`,
  
  sellingToken: (amount: string, amountUnit: string, tokenSymbol: string) =>
    amountUnit === '%' ? `Selling ${amount}% of ${tokenSymbol}` : `Selling ${amount} ${amountUnit} worth of ${tokenSymbol}`,
  
  soldToken: (tokenAmount: number, tokenSymbol: string, receivedAmount: number, receivedUnit: string) =>
    `Sold ${tokenAmount.toFixed(4)} ${tokenSymbol} for ~${receivedAmount.toFixed(4)} ${receivedUnit}`,
  
  insufficientBalance: (needed: string, available: string, unit: string) =>
    `Need ${needed} ${unit} but only have ${available} ${unit}`,
  
  insufficientTokenBalance: (tokenSymbol: string) =>
    `Not enough ${tokenSymbol} for this sell`,
  
  distributionSuccess: (amount: string, sourceCount: number, destCount: number) =>
    `Successfully distributed ${amount} MON from ${sourceCount} source ${sourceCount === 1 ? 'wallet' : 'wallets'} to ${destCount} destination ${destCount === 1 ? 'wallet' : 'wallets'}`,
  
  transferSuccess: (amount: string) =>
    'Funds have been successfully transferred between wallets',
  
  walletCreated: () =>
    'New subwallet has been successfully created and added to your portfolio',
  
  walletImported: () =>
    'Wallet has been successfully imported to your portfolio',
  
  sendBackSuccess: (walletCount: number) =>
    `Successfully sent funds from ${walletCount} ${walletCount === 1 ? 'wallet' : 'wallets'} back to main wallet`,
} as const;

interface UseWalletPopupReturn {
  isVisible: boolean;
  popupData: WalletPopupData | null;
  showPopup: (data: WalletPopupData) => void;
  hidePopup: () => void;
  
  showBuyTransaction: (amount: string, amountUnit: string, tokenSymbol: string, tokenImage?: string) => string;
  showSellTransaction: (amount: string, amountUnit: string, tokenSymbol: string, tokenImage?: string) => string;
  updateTransactionConfirming: (id: string, amount: string, amountUnit: string, tokenSymbol: string) => void;
  updateTransactionSuccess: (id: string, data: { tokenAmount?: number; spentAmount?: number; receivedAmount?: number; tokenSymbol: string; currencyUnit: string }) => void;
  updateTransactionError: (id: string, error: string, isInsufficientBalance?: boolean) => void;
  
  showDistributionSuccess: (amount: string, sourceCount: number, destCount: number) => void;
  showDepositSuccess: (amount: string, targetWallet: string) => void;
  showTransferSuccess: (amount: string, from: string, to: string) => void;
  showWalletCreated: () => void;
  showWalletImported: (address: string) => void;
  showSendBackSuccess: (walletCount: number) => void;
  
  showInsufficientBalance: (needed: string, available: string, unit: string) => void;
  showConnectionError: () => void;
  showChainSwitchRequired: (chainName: string) => void;
  
  texts: typeof TRANSACTION_TEXTS;
  subtitles: typeof TRANSACTION_SUBTITLES;
}

let globalShowLoadingPopup: ((id: string, config: any) => void) | null = null;
let globalUpdatePopup: ((id: string, config: any) => void) | null = null;

export const setGlobalPopupHandlers = (
  showLoading: (id: string, config: any) => void,
  updatePopup: (id: string, config: any) => void
) => {
  globalShowLoadingPopup = showLoading;
  globalUpdatePopup = updatePopup;
};

export const useWalletPopup = (): UseWalletPopupReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [popupData, setPopupData] = useState<WalletPopupData | null>(null);

  const showPopup = useCallback((data: WalletPopupData) => {
    setPopupData(data);
    setIsVisible(true);
  }, []);

  const hidePopup = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setPopupData(null);
    }, 300);
  }, []);

  const showBuyTransaction = useCallback((amount: string, amountUnit: string, tokenSymbol: string, tokenImage?: string): string => {
    const id = `buy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (globalShowLoadingPopup) {
      globalShowLoadingPopup(id, {
        title: TRANSACTION_TEXTS.SENDING_TRANSACTION,
        subtitle: TRANSACTION_SUBTITLES.buyingToken(amount, amountUnit, tokenSymbol),
        amount,
        amountUnit,
        tokenImage
      });
    }
    
    return id;
  }, []);

  const showSellTransaction = useCallback((amount: string, amountUnit: string, tokenSymbol: string, tokenImage?: string): string => {
    const id = `sell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (globalShowLoadingPopup) {
      globalShowLoadingPopup(id, {
        title: TRANSACTION_TEXTS.SENDING_TRANSACTION,
        subtitle: TRANSACTION_SUBTITLES.sellingToken(amount, amountUnit, tokenSymbol),
        amount,
        amountUnit,
        tokenImage
      });
    }
    
    return id;
  }, []);

  const updateTransactionConfirming = useCallback((id: string, amount: string, amountUnit: string, tokenSymbol: string) => {
    if (globalUpdatePopup) {
      const isBuy = id.startsWith('buy-');
      globalUpdatePopup(id, {
        title: isBuy ? TRANSACTION_TEXTS.CONFIRMING_BUY : TRANSACTION_TEXTS.CONFIRMING_SELL,
        subtitle: isBuy 
          ? TRANSACTION_SUBTITLES.buyingToken(amount, amountUnit, tokenSymbol)
          : TRANSACTION_SUBTITLES.sellingToken(amount, amountUnit, tokenSymbol),
        variant: 'info'
      });
    }
  }, []);

  const updateTransactionSuccess = useCallback((id: string, data: { 
    tokenAmount?: number; 
    spentAmount?: number; 
    receivedAmount?: number; 
    tokenSymbol: string; 
    currencyUnit: string 
  }) => {
    if (globalUpdatePopup) {
      const isBuy = id.startsWith('buy-');
      const title = isBuy ? TRANSACTION_TEXTS.BUY_COMPLETED : TRANSACTION_TEXTS.SELL_COMPLETED;
      
      let subtitle = '';
      if (isBuy && data.tokenAmount && data.spentAmount) {
        subtitle = TRANSACTION_SUBTITLES.boughtToken(data.tokenAmount, data.tokenSymbol, data.spentAmount, data.currencyUnit);
      } else if (!isBuy && data.tokenAmount && data.receivedAmount) {
        subtitle = TRANSACTION_SUBTITLES.soldToken(data.tokenAmount, data.tokenSymbol, data.receivedAmount, data.currencyUnit);
      }
      
      globalUpdatePopup(id, {
        title,
        subtitle,
        variant: 'success',
        isLoading: false
      });
    }
  }, []);

  const updateTransactionError = useCallback((id: string, error: string, isInsufficientBalance?: boolean) => {
    if (globalUpdatePopup) {
      const isBuy = id.startsWith('buy-');
      
      let title = TRANSACTION_TEXTS.TRANSACTION_FAILED;
      if (error.toLowerCase().includes('insufficient')) {
        title = TRANSACTION_TEXTS.INSUFFICIENT_BALANCE;
      } else if (isBuy) {
        title = TRANSACTION_TEXTS.BUY_FAILED;
      } else {
        title = TRANSACTION_TEXTS.SELL_FAILED;
      }
      
      globalUpdatePopup(id, {
        title,
        subtitle: error || TRANSACTION_TEXTS.PLEASE_TRY_AGAIN,
        variant: 'error',
        isLoading: false
      });
    }
  }, []);

  const showDistributionSuccess = useCallback((amount: string, sourceCount: number, destCount: number) => {
    showPopup({
      type: 'distribution',
      title: TRANSACTION_TEXTS.DISTRIBUTION_COMPLETE,
      subtitle: TRANSACTION_SUBTITLES.distributionSuccess(amount, sourceCount, destCount),
      amount,
      walletCount: sourceCount + destCount,
      autoCloseDelay: 5000,
      variant: 'success'
    });
  }, [showPopup]);

  const showDepositSuccess = useCallback((amount: string, targetWallet: string) => {
    showPopup({
      type: 'deposit',
      title: TRANSACTION_TEXTS.DEPOSIT_COMPLETE,
      subtitle: TRANSACTION_SUBTITLES.transferSuccess(amount),
      amount,
      destinationWallet: targetWallet,
      autoCloseDelay: 4000,
      variant: 'success'
    });
  }, [showPopup]);

  const showTransferSuccess = useCallback((amount: string, from: string, to: string) => {
    showPopup({
      type: 'transfer',
      title: TRANSACTION_TEXTS.TRANSFER_COMPLETE,
      subtitle: TRANSACTION_SUBTITLES.transferSuccess(amount),
      amount,
      sourceWallet: from,
      destinationWallet: to,
      autoCloseDelay: 4000,
      variant: 'success'
    });
  }, [showPopup]);

  const showWalletCreated = useCallback(() => {
    showPopup({
      type: 'create',
      title: TRANSACTION_TEXTS.WALLET_CREATED,
      subtitle: TRANSACTION_SUBTITLES.walletCreated(),
      autoCloseDelay: 3000,
      variant: 'success'
    });
  }, [showPopup]);

  const showWalletImported = useCallback((address: string) => {
    showPopup({
      type: 'import',
      title: TRANSACTION_TEXTS.WALLET_IMPORTED,
      subtitle: TRANSACTION_SUBTITLES.walletImported(),
      destinationWallet: address,
      autoCloseDelay: 3000,
      variant: 'success'
    });
  }, [showPopup]);

  const showSendBackSuccess = useCallback((walletCount: number) => {
    showPopup({
      type: 'send',
      title: TRANSACTION_TEXTS.SEND_BACK_COMPLETE,
      subtitle: TRANSACTION_SUBTITLES.sendBackSuccess(walletCount),
      walletCount,
      autoCloseDelay: 4000,
      variant: 'success'
    });
  }, [showPopup]);

  const showInsufficientBalance = useCallback((needed: string, available: string, unit: string) => {
    const id = `insufficient-${Date.now()}`;
    
    if (globalShowLoadingPopup) {
      globalShowLoadingPopup(id, {
        title: TRANSACTION_TEXTS.INSUFFICIENT_BALANCE,
        subtitle: TRANSACTION_SUBTITLES.insufficientBalance(needed, available, unit),
        amount: needed,
        amountUnit: unit
      });
    }

    if (globalUpdatePopup) {
      setTimeout(() => {
        globalUpdatePopup(id, {
          title: TRANSACTION_TEXTS.INSUFFICIENT_BALANCE,
          subtitle: TRANSACTION_SUBTITLES.insufficientBalance(needed, available, unit),
          variant: 'error',
          isLoading: false
        });
      }, 100);
    }
  }, []);

  const showConnectionError = useCallback(() => {
    showPopup({
      type: 'trading',
      title: TRANSACTION_TEXTS.WALLET_NOT_CONNECTED,
      subtitle: 'Please connect your wallet to continue',
      autoCloseDelay: 3000,
      variant: 'error'
    });
  }, [showPopup]);

  const showChainSwitchRequired = useCallback((chainName: string) => {
    showPopup({
      type: 'trading',
      title: TRANSACTION_TEXTS.SWITCH_CHAIN,
      subtitle: `Please switch to ${chainName} to continue`,
      autoCloseDelay: 4000,
      variant: 'info'
    });
  }, [showPopup]);

  return {
    isVisible,
    popupData,
    showPopup,
    hidePopup,
    showBuyTransaction,
    showSellTransaction,
    updateTransactionConfirming,
    updateTransactionSuccess,
    updateTransactionError,
    showDistributionSuccess,
    showDepositSuccess,
    showTransferSuccess,
    showWalletCreated,
    showWalletImported,
    showSendBackSuccess,
    showInsufficientBalance,
    showConnectionError,
    showChainSwitchRequired,
    texts: TRANSACTION_TEXTS,
    subtitles: TRANSACTION_SUBTITLES,
  };
};