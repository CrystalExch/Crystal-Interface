import React, { useCallback, useState } from 'react';
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
}) => {
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
}) => {
  if (globalSetPopups) {
    globalSetPopups(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updatedPopup = {
            ...p,
            title: data.title,
            subtitle: data.subtitle,
            variant: data.variant,
            isLoading: data.isLoading ?? p.isLoading,
            visible: true,
            confirmed: data.confirmed ?? true,
            tokenImage: data.tokenImage || p.tokenImage, 
          };

          if (data.variant === 'success' && data.confirmed !== false) {
            const titleLower = data.title.toLowerCase();
            const subtitleLower = (data.subtitle || '').toLowerCase();
            
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

const MemeTransactionPopupManager: React.FC = () => {
  const [transactionPopups, setTransactionPopups] = useState<PopupData[]>([]);
  const [newPopupIds, setNewPopupIds] = useState<Set<string>>(new Set());

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

  return (
    <div className="meme-transaction-popup-manager">
      {visiblePopups.map((popup, index) => {
        const isNew = newPopupIds.has(popup.id);
        const y = index * 60; 

        return (
          <div
            key={popup.id}
            className="meme-transaction-popup-wrapper"
            style={{
              transform: `translateX(-50%) translateY(${y}px)`,
              zIndex: 999999 - index,
            }}
          >
            <div className={`meme-transaction-popup-inner ${isNew ? 'enter' : ''}`}>
              <WalletOperationPopup
                isVisible={popup.visible}
                title={popup.title}
                subtitle={popup.subtitle}
                amount={popup.amount}
                amountUnit={popup.amountUnit}
                variant={popup.variant}
                onClose={() => closeTransactionPopup(popup.id)}
                autoCloseDelay={popup.isLoading || !popup.confirmed ? 999999 : 6000}
                type="transfer"
                isLoading={popup.isLoading}
                tokenImage={popup.tokenImage}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MemeTransactionPopupManager;