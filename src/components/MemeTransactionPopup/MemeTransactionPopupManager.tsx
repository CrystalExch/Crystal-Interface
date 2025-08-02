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
  targetIndex?: number; // Track target position for smooth transitions
}

// Global state for the popup manager
let globalSetPopups: React.Dispatch<React.SetStateAction<PopupData[]>> | null = null;

// Export these functions so other components can use them
export const showLoadingPopup = (id: string, data: {
  title: string;
  subtitle?: string;
  amount?: string;
  amountUnit?: string;
}) => {
  console.log('🚀 showLoadingPopup called with:', { id, data });
  
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
    globalSetPopups(prev => {
      const updated = [newPopup, ...prev];
      // Automatically remove oldest popup if we exceed 5
      const limited = updated.slice(0, 5);
      console.log('📊 transactionPopups updated to:', limited);
      return limited;
    });
  } else {
    console.warn('❌ globalSetPopups is null - popup manager not initialized');
  }
};

export const updatePopup = (id: string, data: {
  title: string;
  subtitle?: string;
  variant: 'success' | 'error' | 'info';
  confirmed?: boolean;
}) => {
  console.log('📝 updatePopup called with:', { id, data });
  
  if (globalSetPopups) {
    globalSetPopups(prev => {
      const updated = prev.map(popup =>
        popup.id === id ? {
          ...popup,
          title: data.title,
          subtitle: data.subtitle,
          variant: data.variant,
          isLoading: false,
          visible: true,
          confirmed: data.confirmed ?? true,
        } : popup
      );
      // Ensure we don't exceed 5 popups
      const limited = updated.slice(0, 5);
      console.log('📊 transactionPopups after update:', limited);
      return limited;
    });
  } else {
    console.warn('❌ globalSetPopups is null - popup manager not initialized');
  }
};

const MemeTransactionPopupManager: React.FC = () => {
  const [transactionPopups, setTransactionPopups] = useState<PopupData[]>([]);
  const [newPopupIds, setNewPopupIds] = useState<Set<string>>(new Set());

  // Set global reference when component mounts
  React.useEffect(() => {
    globalSetPopups = setTransactionPopups;
    console.log('✅ Popup manager initialized');
  }, []);

  // Track new popups and handle repositioning
  React.useEffect(() => {
    if (transactionPopups.length > 0) {
      const newestPopup = transactionPopups[0];
      
      // Check if this is actually a new popup (not just a reorder)
      if (newestPopup && !newPopupIds.has(newestPopup.id)) {
        // Mark as new popup
        setNewPopupIds(prev => new Set([...prev, newestPopup.id]));
        
        // Remove "new" status after animation completes
        const newTimer = setTimeout(() => {
          setNewPopupIds(prev => {
            const updated = new Set(prev);
            updated.delete(newestPopup.id);
            return updated;
          });
        }, 500); // Match animation duration
        
        return () => {
          clearTimeout(newTimer);
        };
      }
    }
  }, [transactionPopups.length, newPopupIds]);

  // Clean up removed popup IDs from newPopupIds
  React.useEffect(() => {
    const currentIds = new Set(transactionPopups.map(p => p.id));
    setNewPopupIds(prev => {
      const updated = new Set<string>();
      prev.forEach(id => {
        if (currentIds.has(id)) {
          updated.add(id);
        }
      });
      return updated;
    });
  }, [transactionPopups]);

  const closeTransactionPopup = useCallback((id: string) => {
    console.log('❌ closeTransactionPopup called with:', id);
    setTransactionPopups(prev => prev.filter(popup => popup.id !== id));
  }, []);

  // Always show maximum 5 popups
  const visiblePopups = transactionPopups.slice(0, 5);

  return (
    <div className="meme-transaction-popup-manager">
      {visiblePopups.map((popup, index) => {
        const isNew = newPopupIds.has(popup.id);
        
        return (
          <div
            key={popup.id}
            className={`meme-transaction-popup-wrapper ${isNew ? 'new-popup' : 'existing-popup'}`}
            style={{
              // Use CSS custom property to control vertical offset
              '--popup-offset': `${index * 100}px`,
              zIndex: 999999 - index,
            } as React.CSSProperties}
          >
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
            />

            {popup.isLoading && (
              <div className="meme-transaction-loading-overlay">
                <div className="meme-transaction-spinner" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MemeTransactionPopupManager;