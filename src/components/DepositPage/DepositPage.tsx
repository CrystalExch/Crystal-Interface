import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import closebutton from '../../assets/close_button.png';
import './DepositPage.css';

interface DepositPageProps {
  address: string;
  onClose: () => void;
}

const DepositPage: React.FC<DepositPageProps> = ({ address, onClose }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const addressRef = useRef<HTMLSpanElement>(null);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };
  
  const handleDontShowAgainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDontShowAgain(e.target.checked);
  };
  
  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideDepositPage', 'true');
    }
    onClose();
  };
  
  return (
    <div className="deposit-page-overlay">
      <div className="deposit-page-container" onClick={(e) => e.stopPropagation()}>
        <div className="deposit-page-header">
          <h2>Deposit</h2>
          <button className="deposit-close-button" onClick={handleClose}>
            <img src={closebutton} className="deposit-close-icon" alt="Close" />
          </button>
        </div>
        
        <div className="deposit-address-container">
          <label>Ethereum (ERC20) Address</label>
          <div className="deposit-address-box">
            <span ref={addressRef} className="deposit-address">{address}</span>
            <button
              className={`deposit-copy-button ${copySuccess ? 'success' : ''}`}
              onClick={handleCopy}
            >
              {copySuccess ? 
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg> : 
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                </svg>
              }
            </button>
          </div>
        </div>
        
        <div className="deposit-warning">
          <span>Your deposit must be sent on the Monad Testnet network to be processed.</span>
        </div>
        
        <div className="deposit-qr-container">
          <QRCodeSVG
            value={address}
            size={170}
            level="H"
            includeMargin={true}
            bgColor="#000000"
            fgColor="#ffffff"
          />
        </div>
        
        <div className="dont-show-again-container">
          <label className="dont-show-again-label">
            <input 
              type="checkbox" 
              checked={dontShowAgain}
              onChange={handleDontShowAgainChange}
              className="dont-show-again-checkbox"
            />
            <span className="dont-show-again-text">Don't show again</span>
          </label>
        </div>
        
        <button className="deposit-done-button" onClick={handleClose}>
          Done
        </button>
      </div>
    </div>
  );
};

export default DepositPage;