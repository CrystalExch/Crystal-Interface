import React, { useState, useEffect } from 'react';
import './EditAccountPopup.css';
import SideArrow from '../../assets/arrow.svg';
import { useSmartAccountClient } from '@account-kit/react';
import defaultpfp from '../../assets/defaultpfp.webp';

interface UserData {
  username: string;
  image: string;
  xp: number;
}

interface EditAccountPopupProps {
  userData: UserData;
  onSaveChanges: (userData: UserData) => void;
  onClose: () => void;
}

const EditAccountPopup: React.FC<EditAccountPopupProps> = ({ 
  userData, 
  onSaveChanges, 
  onClose 
}) => {
  const { address } = useSmartAccountClient({ type: "LightAccount" });
  const [username, setUsername] = useState<string>(userData.username);
  const [error, setError] = useState<string>('');
  const [isUsernameChanged, setIsUsernameChanged] = useState<boolean>(false);
  
  // Check if username has changed from original
  useEffect(() => {
    setIsUsernameChanged(username !== userData.username);
  }, [username, userData.username]);

  const handleSave = (): void => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (username.length > 20) {
      setError('Username cannot exceed 20 characters');
      return;
    }
    
    const updatedUserData: UserData = {
      username,
      image: defaultpfp, // Always use default profile picture
      xp: userData.xp 
    };
    
    fetch("https://points-backend-b5a062cda7cd.herokuapp.com/usernames", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        address: address?.toLowerCase(),
        username: username
      })
    })
      .then(res => res.json())
      .then(result => {
        console.log(result);
        onSaveChanges(updatedUserData);
      })
      .catch(err => {
        console.error("Error updating username:", err);
        setError("Failed to update username. Please try again.");
      });
  };

  const t = (text: string): string => {
    const translations: Record<string, string> = {
      editAccountTitle: "Edit Account",
      editAccountSubtitle: "Update your username",
      username: "Username",
      cancel: "Cancel",
      saveChanges: "Save Changes"
    };
    return translations[text] || text;
  };

  return (
    <div className="account-setup-overlay">
      <div className="account-setup-container">
        <div className="edit-account-setup-header">
          <h2 className="account-setup-title">{t("editAccountTitle")}</h2>
          <p className="account-setup-subtitle">{t("editAccountSubtitle")}</p>
        </div>
        
        <div className="account-setup-form">
          <div className="form-group">
            <label className="form-label" htmlFor="edit-username">
              {t("username")}
            </label>
            <input
              id="edit-username"
              type="text"
              className="form-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
            />
            {error && <p className="form-error">{error}</p>}
          </div>
          
        </div>
        
        <div className="account-setup-footer">
          <button
            onClick={onClose}
            className="back-button"
            type="button"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            className="complete-button"
            type="button"
            disabled={!isUsernameChanged}
          >
            {t("saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAccountPopup;