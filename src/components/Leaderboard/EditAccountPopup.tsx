import React, { useState, ChangeEvent } from 'react';
import './EditAccountPopup.css';
import SideArrow from '../../assets/arrow.svg';
import closebutton from '../../assets/close_button.png';
import { useSmartAccountClient } from '@account-kit/react';

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
  const [, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(userData.image);
  const [error, setError] = useState<string>('');

  const generateLetterAvatar = (name: string): string => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;

    if (context) {
      context.fillStyle = getRandomColor();
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.font = 'bold 100px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(name.charAt(0).toUpperCase(), canvas.width / 2, canvas.height / 2);
    }

    return canvas.toDataURL('image/png');
  };

  const getRandomColor = (): string => {
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
      '#9b59b6', '#1abc9c', '#d35400', '#c0392b'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const clearPhoto = (): void => {
    setPhoto(null);
    setPhotoPreview(generateLetterAvatar(username));
  };

  const handleSave = (): void => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    const updatedUserData: UserData = {
      username,
      image: photoPreview,
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

  return (
    <div className="account-setup-overlay">
      <div className="account-setup-container">
        <div className="account-setup-header">
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
            />
            {error && <p className="form-error">{error}</p>}
          </div>
          
          <div className="photo-upload-container">
            <div className="photo-preview-container">
              <img 
                src={photoPreview} 
                alt="Preview" 
                className="photo-preview"
              />
              <button 
                className="clear-photo-button" 
                onClick={clearPhoto}
                type="button"
                aria-label="Change photo"
              >
                <img src={closebutton} className="edit-account-close-icon" />
              </button>
            </div>
            
            <label className="photo-upload-label">
              <span className="photo-upload-button">
                {t("chooseNewPhoto")}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden-input"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>
        
        <div className="account-setup-footer">
          <button
            onClick={onClose}
            className="back-button"
          >
            <img className="back-button-arrow" src={SideArrow} alt="Back" />
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            className="complete-button"
          >
            {t("saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAccountPopup;
