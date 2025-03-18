import React, { useState } from 'react';
import './DeleteAccountPopup.css';

interface DeleteAccountPopupProps {
  username: string;
  onConfirmDelete: () => void;
  onClose: () => void;
  onCreateNewAccount?: () => void;
  onReturnHome?: () => void;
}

const DeleteAccountPopup: React.FC<DeleteAccountPopupProps> = ({
  username,
  onConfirmDelete,
  onClose,
  onCreateNewAccount,
  onReturnHome
}) => {
  const [step, setStep] = useState<number>(1);
  const [confirmUsername, setConfirmUsername] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [animate, setAnimate] = useState(false);

  const isUsernameMatch = confirmUsername === username;

  const handleNextStep = () => {
    setStep(2);
    setError('');
  };

  const handleConfirmDelete = () => {
    if (confirmUsername === username) {
      setShowSuccess(true);
      
      setTimeout(() => {
        setAnimate(true);
      }, 100);

      onConfirmDelete();
    } else {
      setError('Username does not match');
    }
  };

  const handleCreateNewAccount = () => {
    if (onCreateNewAccount) {
      onCreateNewAccount();
    }
    onClose();
  };

  const handleReturnHome = () => {
    if (onReturnHome) {
      onReturnHome();
    }
    onClose();
  };

  return (
    <div className="account-delete-overlay">
      <div className="account-delete-container">
        {!showSuccess ? (
          <>
            <div className="account-delete-header">
              <h3>{step === 1 ? 'Delete Account?' : 'Confirm Deletion'}</h3>
            </div>
            
            <div className="account-delete-content">
              {step === 1 ? (
                <>
                  <div className="setup-warning">
                    <p>Are you sure you want to delete your account? This will clear all your progress and cannot be undone.</p>
                  </div>
                  
                  <div className="setup-buttons">
                    <button className="account-delete-cancel-button" onClick={onClose}>Cancel</button>
                    <button className="confirm-button delete-confirm" onClick={handleNextStep}>Delete My Account</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="setup-warning">
                    <p>Please type <strong>{username}</strong> to confirm account deletion.</p>
                  </div>
                  
                  <div className="username-input-container">
                    <input
                      type="text"
                      value={confirmUsername}
                      onChange={(e) => setConfirmUsername(e.target.value)}
                      placeholder="Type your username"
                      className="username-input"
                    />
                    {error && <div className="error-message">{error}</div>}
                  </div>
                  
                  <div className="setup-buttons">
                    <button className="account-delete-cancel-button" onClick={() => setStep(1)}>Go Back</button>
                    <button
                      className="confirm-button delete-confirm"
                      onClick={handleConfirmDelete}
                      disabled={!isUsernameMatch}
                      style={{
                        opacity: isUsernameMatch ? 1 : 0.5,
                        cursor: isUsernameMatch ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Confirm Deletion
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="success-container">
            <div className="success-animation-container">
              <div className={`checkmark-circle ${animate ? 'animate' : ''}`}>
                <div className="background"></div>
                <div className="checkmark draw"></div>
              </div>
            </div>
            
            <h2 className="success-title">Account Successfully Deleted</h2>
            <p className="success-message">
              Your account and all associated data have been permanently removed.
            </p>
            
            <div className="success-buttons">
              <button 
                className="new-account-button"
                onClick={handleCreateNewAccount}
              >
                Create New Account
              </button>
              
              <button 
                className="return-home-button"
                onClick={handleReturnHome}
              >
                Return to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteAccountPopup;