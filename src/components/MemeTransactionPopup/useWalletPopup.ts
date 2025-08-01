import { useState, useCallback } from 'react';

interface WalletPopupData {
  type: 'distribution' | 'deposit' | 'transfer' | 'send' | 'import' | 'create';
  title: string;
  subtitle?: string;
  amount?: string;
  sourceWallet?: string;
  destinationWallet?: string;
  walletCount?: number;
  autoCloseDelay?: number;
}

interface UseWalletPopupReturn {
  isVisible: boolean;
  popupData: WalletPopupData | null;
  showPopup: (data: WalletPopupData) => void;
  hidePopup: () => void;
  showDistributionSuccess: (amount: string, sourceCount: number, destCount: number) => void;
  showDepositSuccess: (amount: string, targetWallet: string) => void;
  showTransferSuccess: (amount: string, from: string, to: string) => void;
  showWalletCreated: () => void;
  showWalletImported: (address: string) => void;
  showSendBackSuccess: (walletCount: number) => void;
}

export const useWalletPopup = (): UseWalletPopupReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [popupData, setPopupData] = useState<WalletPopupData | null>(null);

  const showPopup = useCallback((data: WalletPopupData) => {
    setPopupData(data);
    setIsVisible(true);
  }, []);

  const hidePopup = useCallback(() => {
    setIsVisible(false);
    // Clear data after animation completes
    setTimeout(() => {
      setPopupData(null);
    }, 300);
  }, []);

  // Convenience methods for common operations
  const showDistributionSuccess = useCallback((amount: string, sourceCount: number, destCount: number) => {
    showPopup({
      type: 'distribution',
      title: 'Distribution Complete',
      subtitle: `Successfully distributed ${amount} MON from ${sourceCount} source ${sourceCount === 1 ? 'wallet' : 'wallets'} to ${destCount} destination ${destCount === 1 ? 'wallet' : 'wallets'}`,
      amount,
      walletCount: sourceCount + destCount,
      autoCloseDelay: 5000
    });
  }, [showPopup]);

  const showDepositSuccess = useCallback((amount: string, targetWallet: string) => {
    showPopup({
      type: 'deposit',
      title: 'Deposit Complete',
      subtitle: 'Funds have been successfully deposited to your wallet',
      amount,
      destinationWallet: targetWallet,
      autoCloseDelay: 4000
    });
  }, [showPopup]);

  const showTransferSuccess = useCallback((amount: string, from: string, to: string) => {
    showPopup({
      type: 'transfer',
      title: 'Transfer Complete',
      subtitle: 'Funds have been successfully transferred between wallets',
      amount,
      sourceWallet: from,
      destinationWallet: to,
      autoCloseDelay: 4000
    });
  }, [showPopup]);

  const showWalletCreated = useCallback(() => {
    showPopup({
      type: 'create',
      title: 'Wallet Created',
      subtitle: 'New subwallet has been successfully created and added to your portfolio',
      autoCloseDelay: 3000
    });
  }, [showPopup]);

  const showWalletImported = useCallback((address: string) => {
    showPopup({
      type: 'import',
      title: 'Wallet Imported',
      subtitle: 'Wallet has been successfully imported to your portfolio',
      destinationWallet: address,
      autoCloseDelay: 3000
    });
  }, [showPopup]);

  const showSendBackSuccess = useCallback((walletCount: number) => {
    showPopup({
      type: 'send',
      title: 'Send Back Complete',
      subtitle: `Successfully sent funds from ${walletCount} ${walletCount === 1 ? 'wallet' : 'wallets'} back to main wallet`,
      walletCount,
      autoCloseDelay: 4000
    });
  }, [showPopup]);

  return {
    isVisible,
    popupData,
    showPopup,
    hidePopup,
    showDistributionSuccess,
    showDepositSuccess,
    showTransferSuccess,
    showWalletCreated,
    showWalletImported,
    showSendBackSuccess,
  };
};