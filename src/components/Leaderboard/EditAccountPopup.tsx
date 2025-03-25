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
  const [username, setUsername] = useState<string>(userData.username);
  const [, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(userData.image);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const { address } = useSmartAccountClient({ type: "LightAccount" });

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

  const handleSave = async (): Promise<void> => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);

    const updatedUserData: UserData = {
      username,
      image: photoPreview,
      xp: userData.xp 
    };

    try {
      const response = await fetch('https://points-backend-b5a062cda7cd.herokuapp.com/set_username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: address,
          username
        })
      });

      const data = await response.json();
      if (response.ok) {
        // If username is updated successfully, update the UI and close the popup
        onSaveChanges(updatedUserData);
        onClose();
      } else {
        setError(data.message || 'Failed to update username');
      }
    } catch (error) {
      setError('Error updating username. Please try again.');
      console.error('Error updating username:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-setup-overlay">
      <div className="account-setup-container">
        <div className="account-setup-header">
          <h2 className="account-setup-title">Edit Account</h2>
          <p className="account-setup-subtitle">Change your username and photo</p>
        </div>

        <div className="account-setup-form">
          <div className="form-group">
            <label className="form-label" htmlFor="edit-username">Username</label>
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
                Choose New Photo
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
            disabled={loading}
          >
            <img className="back-button-arrow" src={SideArrow} alt="Back" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="complete-button"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAccountPopup;
