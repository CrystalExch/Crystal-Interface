import React, { useState } from 'react';
import cancelOrder from '../../../scripts/cancelOrder';
import './CancelButton.css';

interface CancelButtonProps {
  order: any;
  router: any;
  refetch: any;
  sendUserOperationAsync: any;
  setChain: any;
}

const CancelButton: React.FC<CancelButtonProps> = ({ order, router, refetch, sendUserOperationAsync, setChain }) => {
  const [isSigning, setIsSigning] = useState(false);

  const handleCancel = async () => {
    if (isSigning) return;
    
    setIsSigning(true);
    let hash;
    try {
      await setChain();
      hash = await cancelOrder(
        sendUserOperationAsync,
        router,
        order[3] == 1
          ? markets[order[4]].quoteAddress
          : markets[order[4]].baseAddress,
        order[3] == 1
          ? markets[order[4]].baseAddress
          : markets[order[4]].quoteAddress,
        BigInt(order[0]),
        BigInt(order[1]),
      );
    } finally {
      setTimeout(() => {
        refetch();
        setIsSigning(false);
      }, 500);
    }
  };

  return (
    <div className={`cancel-button ${isSigning ? 'signing' : ''}`} onClick={handleCancel}>
      {isSigning ? (
        <div className="button-content">
          <div className="loading-spinner"></div>
          <span>{t('cancel')}</span>
        </div>
      ) : (
        <span>{t('cancel')}</span>
      )}
    </div>
  );
};

export default CancelButton;