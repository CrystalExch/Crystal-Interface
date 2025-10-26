import React, { useState } from 'react';

interface CancelButtonProps {
  callback: any
}

const CancelButton: React.FC<CancelButtonProps> = ({ callback }) => {
  const [isSigning, setIsSigning] = useState(false);

  const handleCancel = async () => {
    if (isSigning) return;
    try {
      setIsSigning(true);
      await callback()
    } catch (error) {
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className={`cancel-button ${isSigning ? 'signing' : ''}`} onClick={handleCancel}>
      {isSigning ? (
        <div className="cancel-button-content">
          <div className="cancel-button-loading-spinner"></div>
        </div>
      ) : (
        <span>{t('Close')}</span>
      )}
    </div>
  );
};

export default CancelButton;