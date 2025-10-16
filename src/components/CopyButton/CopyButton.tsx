import React from 'react';
import { showLoadingPopup, updatePopup } from '../MemeTransactionPopup/MemeTransactionPopupManager';
import './CopyButton.css';

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, label = 'Address' }) => {
  const handleCopy = (e: any) => {
    e.stopPropagation();
    navigator.clipboard.writeText(textToCopy);
    
    const txId = `copy-${Date.now()}`;
    
    if (showLoadingPopup) {
      showLoadingPopup(txId, {
        title: 'Copied to Clipboard',
        subtitle: `${label} copied successfully`
      });
    }
    
    if (updatePopup) {
      updatePopup(txId, {
        title: 'Copied to Clipboard',
        subtitle: `${label} copied successfully`,
        variant: 'success',
        confirmed: true,
        isLoading: false
      });
    }
  };

  return (
    <div className="copy-wrapper" onClick={handleCopy}>
      <div className="icon-container">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="#b8b7b7"
        >
          <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
        </svg>
      </div>
    </div>
  );
};

export default CopyButton;