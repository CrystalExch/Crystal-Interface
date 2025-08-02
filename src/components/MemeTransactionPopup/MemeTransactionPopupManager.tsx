import React, { useCallback, useState } from 'react';
import WalletOperationPopup from './WalletOperationPopup';
import './MemeTransactionPopupManager.css';

interface PopupData {
  id: string;
  title: string;
  subtitle?: string;
  amount?: string;
  amountUnit?: string;
  variant: 'success' | 'error' | 'info';
  isLoading?: boolean;
  visible: boolean;
  confirmed?: boolean;
  targetIndex?: number;
}

let globalSetPopups: React.Dispatch<React.SetStateAction<PopupData[]>> | null = null;

export const showLoadingPopup = (id: string, data: {
  title: string;
  subtitle?: string;
  amount?: string;
  amountUnit?: string;
}) => {
  const newPopup: PopupData = {
    id,
    title: data.title,
    subtitle: data.subtitle,
    amount: data.amount,
    amountUnit: data.amountUnit,
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
}) => {
  if (globalSetPopups) {
    globalSetPopups(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              title: data.title,
              subtitle: data.subtitle,
              variant: data.variant,
              isLoading: data.isLoading ?? p.isLoading,
              visible: true,
              confirmed: data.confirmed ?? true,
            }
          : p
      ).slice(0, 7)
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

  // prune ids that no longer exist
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
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MemeTransactionPopupManager;
