import React from 'react';
import './GeneratingAddressPopup.css';
type GeneratingAddressPopupProps = {
  isVisible: boolean;
};

const GeneratingAddressPopup: React.FC<GeneratingAddressPopupProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="generating-address-overlay">
      <div className="generating-address-popup">
        <span className="loader"></span>
        <h2 className="generating-address-title">Fetching Your Wallet</h2>
        <p className="generating-address-text">
          Please wait while we set up your secure wallet address...
        </p>
      </div>
    </div>
  );
};

export default GeneratingAddressPopup;