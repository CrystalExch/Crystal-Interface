import React, { useCallback, useState, useEffect } from 'react';
import WalletOperationPopup from './WalletOperationPopup';
import './MemeTransactionPopupManager.css';
import stepaudio from '../../assets/step_audio.mp3';

interface PopupData {
  id: string;
  title: string;
  subtitle?: string;
  amount?: string;
  amountUnit?: string;
  tokenImage?: string;
  variant: 'success' | 'error' | 'info';
  isLoading?: boolean;
  visible: boolean;
  confirmed?: boolean;
  targetIndex?: number;
  onClick?: () => void;
  isClickable?: boolean;
  walletAddress?: string;
  timestamp?: number;
  actionType?: 'buy' | 'sell';
}
interface AudioSettings {
  soundAlertsEnabled: boolean;
  volume: number;
  sounds: {
    newPairs: string;
    pairMigrating: string;
    migrated: string;
  };
}
interface TrackedWallet {
  id: string;
  address: string;
  name: string;
  emoji: string;
  createdAt: string;
  balance?: number;
  lastActiveAt?: number | null;
}
const WALLET_NOTIFICATIONS_KEY = 'wallet_notifications_preferences';

const getWalletNotificationPreferences = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(WALLET_NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading wallet notification preferences:', error);
    return {};
  }
};

export const setWalletNotificationPreferences = (preferences: Record<string, boolean>) => {
  try {
    localStorage.setItem(WALLET_NOTIFICATIONS_KEY, JSON.stringify(preferences));
    window.dispatchEvent(new CustomEvent('wallet-notifications-updated', { detail: preferences }));
  } catch (error) {
    console.error('Error saving wallet notification preferences:', error);
  }
};
export const isWalletNotificationsEnabled = (address: string): boolean => {
  const preferences = getWalletNotificationPreferences();
  return preferences[address.toLowerCase()] !== false;
};

export const toggleWalletNotifications = (address: string): boolean => {
  const preferences = getWalletNotificationPreferences();
  const normalizedAddress = address.toLowerCase();
  const currentValue = preferences[normalizedAddress] !== false;
  const newValue = !currentValue;

  preferences[normalizedAddress] = newValue;
  setWalletNotificationPreferences(preferences);

  return newValue;
};
const TRACKED_WALLETS_KEY = 'tracked_wallets_data';
interface AudioGroups {
  swap: boolean;
  order: boolean;
  transfer: boolean;
  approve: boolean;
}

let globalSetPopups: React.Dispatch<React.SetStateAction<PopupData[]>> | null = null;

const getAudioSettings = (): { isAudioEnabled: boolean; audioGroups: AudioGroups } => {
  try {
    const audioEnabled = localStorage.getItem('crystal_audio_notifications');
    const audioGroupsData = localStorage.getItem('crystal_audio_groups');

    const isAudioEnabled = audioEnabled ? JSON.parse(audioEnabled) : false;
    const audioGroups: AudioGroups = audioGroupsData
      ? JSON.parse(audioGroupsData)
      : { swap: true, order: true, transfer: true, approve: true };

    return { isAudioEnabled, audioGroups };
  } catch (error) {
    console.error('Error loading audio settings:', error);
    return {
      isAudioEnabled: false,
      audioGroups: { swap: true, order: true, transfer: true, approve: true }
    };
  }
};

const playAudioIfEnabled = (audioType: keyof AudioGroups = 'swap') => {
  const { isAudioEnabled, audioGroups } = getAudioSettings();

  if (!isAudioEnabled || !audioGroups[audioType]) {
    return;
  }

  try {
    const stepAudio = new Audio(stepaudio);
    stepAudio.volume = 0.8;
    stepAudio.currentTime = 0;
    stepAudio.play().catch(console.error);
  } catch (error) {
    console.error('Error playing audio:', error);
  }
};

export const showLoadingPopup = (id: string, data: {
  title: string;
  subtitle?: string;
  amount?: string;
  amountUnit?: string;
  tokenImage?: string;
  onClick?: () => void;
  isClickable?: boolean;
  walletAddress?: string;
  timestamp?: number;
  actionType?: 'buy' | 'sell';
}) => {
  if (data.walletAddress && !isWalletNotificationsEnabled(data.walletAddress)) {
    return;
  }
  const newPopup: PopupData = {
    id,
    title: data.title,
    subtitle: data.subtitle,
    amount: data.amount,
    amountUnit: data.amountUnit,
    tokenImage: data.tokenImage,
    variant: 'info',
    isLoading: true,
    visible: true,
    confirmed: false,
    onClick: data.onClick,
    isClickable: data.isClickable,
    walletAddress: data.walletAddress,
    timestamp: data.timestamp || Date.now(),
    actionType: data.actionType,
  };
  if (globalSetPopups) {
    globalSetPopups(prev => [newPopup, ...prev].slice(0, 7));
  }
};

export const updatePopup = (id: string, data: {
  title: string;
  subtitle?: string;
  variant: 'success' | 'error' | 'info';
  confirmed?: boolean;
  isLoading?: boolean;
  tokenImage?: string;
  onClick?: () => void;
  isClickable?: boolean;
  walletAddress?: string;
  timestamp?: number;
  actionType?: 'buy' | 'sell';
}) => {
  if (globalSetPopups) {
    globalSetPopups(prev =>
      prev.map(p => {
        if (p.id === id) {
          const isZeroWallets = data.subtitle && (
            /across 0 wallets/i.test(data.subtitle) ||
            /bought.* 0 /i.test(data.subtitle) ||
            /sold.* 0 /i.test(data.subtitle)
          );

          let finalVariant = data.variant;
          let finalTitle = data.title;
          let finalSubtitle = data.subtitle;
          
          if (isZeroWallets && data.variant === 'success') {
            finalVariant = 'error';
            finalTitle = 'Transaction failed';
            finalSubtitle = 'No wallets were able to complete the transaction';
          }

          const updatedPopup = {
            ...p,
            title: finalTitle,
            subtitle: finalSubtitle,
            variant: finalVariant,
            isLoading: data.isLoading ?? p.isLoading,
            visible: true,
            confirmed: data.confirmed ?? true,
            tokenImage: data.tokenImage || p.tokenImage,
            onClick: data.onClick || p.onClick,
            isClickable: data.isClickable !== undefined ? data.isClickable : p.isClickable,
            walletAddress: data.walletAddress || p.walletAddress,
            timestamp: data.timestamp || p.timestamp,
            actionType: data.actionType || p.actionType,
          };

          if (finalVariant === 'success' && data.confirmed !== false) {
            const titleLower = finalTitle.toLowerCase();
            const subtitleLower = (finalSubtitle || '').toLowerCase();

            const isBuyOrSell =
              titleLower.includes('buy completed') ||
              titleLower.includes('sell completed') ||
              titleLower.includes('buy failed') ||
              titleLower.includes('sell failed') ||
              subtitleLower.includes('bought') ||
              subtitleLower.includes('sold') ||
              subtitleLower.includes('buying') ||
              subtitleLower.includes('selling') ||
              titleLower.includes('quick buy') ||
              titleLower.includes('quickbuy') ||
              titleLower.includes('buy') ||
              titleLower.includes('sell');

            if (isBuyOrSell) {
              playAudioIfEnabled('swap');
            }

            const isTransfer =
              titleLower.includes('transfer') ||
              titleLower.includes('send') ||
              titleLower.includes('wrap') ||
              titleLower.includes('unwrap') ||
              titleLower.includes('stake');

            if (isTransfer) {
              playAudioIfEnabled('transfer');
            }

            const isOrder =
              titleLower.includes('order') ||
              titleLower.includes('limit') ||
              titleLower.includes('filled') ||
              titleLower.includes('cancelled');

            if (isOrder) {
              playAudioIfEnabled('order');
            }

            const isApproval =
              titleLower.includes('approval') ||
              titleLower.includes('approve') ||
              titleLower.includes('allowance');

            if (isApproval) {
              playAudioIfEnabled('approve');
            }
          }

          return updatedPopup;
        }
        return p;
      }).slice(0, 7)
    );
  }
};

interface MemeTransactionPopupManagerProps {
  trackedWallets?: TrackedWallet[];
}

const MemeTransactionPopupManager: React.FC<MemeTransactionPopupManagerProps> = ({
  trackedWallets: externalTrackedWallets
}) => {
  const [transactionPopups, setTransactionPopups] = useState<PopupData[]>([]);
  const [newPopupIds, setNewPopupIds] = useState<Set<string>>(new Set());
  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>(() => 
    getWalletNotificationPreferences()
  );
  
  const [toastPosition, setToastPosition] = useState<string>(() => {
    try {
      return localStorage.getItem('crystal_toast_position') || 'top-center';
    } catch {
      return 'top-center';
    }
  });
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      setNotificationPrefs(customEvent.detail || getWalletNotificationPreferences());
    };
    
    window.addEventListener('wallet-notifications-updated', handleUpdate);
    return () => window.removeEventListener('wallet-notifications-updated', handleUpdate);
  }, []);

  const handleToggleNotifications = useCallback((address: string) => {
    const normalizedAddress = address.toLowerCase();
    const currentValue = notificationPrefs[normalizedAddress] !== false;
    const newValue = !currentValue;
    
    setNotificationPrefs(prev => ({ ...prev, [normalizedAddress]: newValue }));
    
    const preferences = getWalletNotificationPreferences();
    preferences[normalizedAddress] = newValue;
    setWalletNotificationPreferences(preferences);
  }, [notificationPrefs]);
  useEffect(() => {
    if (externalTrackedWallets && externalTrackedWallets.length > 0) {
      setTrackedWallets(externalTrackedWallets);
      return;
    }

    const loadWallets = () => {
      try {
        const stored = localStorage.getItem(TRACKED_WALLETS_KEY);
        if (stored) {
          setTrackedWallets(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading tracked wallets:', error);
      }
    };

    loadWallets();
    // Listen for wallet updates
    const handleWalletUpdate = (e: CustomEvent) => {
      if (e.detail?.wallets) {
        setTrackedWallets(e.detail.wallets);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TRACKED_WALLETS_KEY && e.newValue) {
        try {
          setTrackedWallets(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Error parsing tracked wallets:', error);
        }
      }
    };

    window.addEventListener('wallets-updated', handleWalletUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('wallets-updated', handleWalletUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [externalTrackedWallets]);

  const findTrackedWallet = (address?: string): TrackedWallet | null => {
    if (!address) return null;
    return trackedWallets.find(
      w => w.address.toLowerCase() === address.toLowerCase()
    ) || null;
  };
  React.useEffect(() => {
    globalSetPopups = setTransactionPopups;
  }, []);

  React.useEffect(() => {
    if (transactionPopups.length > 0) {
      const newest = transactionPopups[0];
      if (newest && !newPopupIds.has(newest.id)) {
        setNewPopupIds(prev => new Set([...prev, newest.id]));
        const t = setTimeout(() => {
          setNewPopupIds(prev => {
            const copy = new Set(prev);
            copy.delete(newest.id);
            return copy;
          });
        }, 500);
        return () => clearTimeout(t);
      }
    }
  }, [transactionPopups, newPopupIds]);

  React.useEffect(() => {
    const current = new Set(transactionPopups.map(p => p.id));
    setNewPopupIds(prev => {
      const next = new Set<string>();
      prev.forEach(id => { if (current.has(id)) next.add(id); });
      return next;
    });
  }, [transactionPopups]);

  const closeTransactionPopup = useCallback((id: string) => {
    setTransactionPopups(prev => prev.filter(p => p.id !== id));
  }, []);

  const visiblePopups = transactionPopups.slice(0, 7);
  useEffect(() => {
    const handlePositionUpdate = () => {
      try {
        const newPosition = localStorage.getItem('crystal_toast_position') || 'top-center';
        setToastPosition(newPosition);
      } catch (error) {
        console.error('Error loading toast position:', error);
      }
    };

    window.addEventListener('storage', handlePositionUpdate);
    
    window.addEventListener('toast-position-updated', handlePositionUpdate);

    return () => {
      window.removeEventListener('storage', handlePositionUpdate);
      window.removeEventListener('toast-position-updated', handlePositionUpdate);
    };
  }, []);
  const getPositionStyles = (position: string) => {
    const styles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 999999,
      pointerEvents: 'none',
    };

    switch (position) {
      case 'top-left':
        styles.top = '20px';
        styles.left = '0px';
        styles.transform = 'none';
        break;
      case 'top-center':
        styles.top = '20px';
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
        break;
      case 'top-right':
        styles.top = '20px';
        styles.right = '350px';
        styles.left = 'auto';
        styles.transform = 'none';
        break;
      case 'bottom-left':
        styles.bottom = '100px';
        styles.left = '0px';
        styles.top = 'auto';
        styles.transform = 'none';
        break;
      case 'bottom-center':
        styles.bottom = '100px';
        styles.left = '50%';
        styles.top = 'auto';
        styles.transform = 'translateX(-50%)';
        break;
      case 'bottom-right':
        styles.bottom = '100px';
        styles.right = '350px';
        styles.left = 'auto';
        styles.top = 'auto';
        styles.transform = 'none';
        break;
      default:
        styles.top = '20px';
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
    }

    return styles;
  };

  const getWrapperTransform = (position: string, index: number) => {
    const y = index * 60;
    const isBottom = position.startsWith('bottom-');
    
    const yOffset = isBottom ? -y : y;
    
    if (position.includes('center')) {
      return `translateX(-50%) translateY(${yOffset}px)`;
    }
    return `translateY(${yOffset}px)`;
  };

  return (
    <div 
      className="meme-transaction-popup-manager"
      style={getPositionStyles(toastPosition)}
    >
      {visiblePopups.map((popup, index) => {
        const isNew = newPopupIds.has(popup.id);

        return (
          <div
            key={popup.id}
            className="meme-transaction-popup-wrapper"
            style={{
              transform: getWrapperTransform(toastPosition, index),
              zIndex: 999999 - index,
            }}
          >
            <div className={`meme-transaction-popup-inner ${isNew ? 'enter' : ''}`}>
              {(() => {
                const trackedWallet = findTrackedWallet(popup.walletAddress);
                return (
                  <WalletOperationPopup
                    isVisible={popup.visible}
                    title={popup.title}
                    subtitle={popup.subtitle}
                    amount={popup.amount}
                    amountUnit={popup.amountUnit}
                    variant={popup.variant}
                    onClose={() => closeTransactionPopup(popup.id)}
                    autoCloseDelay={popup.isLoading || !popup.confirmed ? 999999 : popup.isClickable ? 10000 : 6000}
                    type={trackedWallet ? "wallet_trade" : "transfer"}
                    isLoading={popup.isLoading}
                    tokenImage={popup.tokenImage}
                    onClick={popup.onClick}
                    isClickable={popup.isClickable}
                    walletEmoji={trackedWallet?.emoji}
                    walletName={trackedWallet?.name}
                    timestamp={popup.timestamp}
                    actionType={popup.actionType}
                    walletAddress={popup.walletAddress}
                    onToggleNotifications={handleToggleNotifications}
                    notificationsEnabled={popup.walletAddress ? (notificationPrefs[popup.walletAddress.toLowerCase()] !== false) : true}
                  />
                );
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MemeTransactionPopupManager;