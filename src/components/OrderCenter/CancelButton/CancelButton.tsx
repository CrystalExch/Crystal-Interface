import React from 'react';

import cancelOrder from '../../../scripts/cancelOrder';

import './CancelButton.css';

interface CancelButtonProps {
  order: any;
  router: any;
  refetch: any;
  sendUserOperation: any;
  setChain: any;
}

const CancelButton: React.FC<CancelButtonProps> = ({ order, router, refetch, sendUserOperation, setChain }) => {
  const handleCancel = async () => {
    try {
      await setChain()
      await cancelOrder(
        sendUserOperation,
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
      setTimeout(()=>refetch(), 500)
    } catch (error) {}
  };

  return (
    <div className="cancel-button" onClick={handleCancel}>
      <span>{t('cancel')}</span>
    </div>
  );
};

export default CancelButton;
