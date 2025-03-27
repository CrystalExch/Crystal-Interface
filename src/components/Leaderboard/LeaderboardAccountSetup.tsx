import React, { useState, ChangeEvent } from 'react';
import './LeaderboardAccountSetup.css';
import SideArrow from '../../assets/arrow.svg';

interface UserData {
  username: string;
  image: string;
  xp: number;
}

interface LeaderboardAccountSetupProps {
  onComplete: (userData: UserData) => void;
  onBackToIntro?: () => void; 
}

const LeaderboardAccountSetup: React.FC<LeaderboardAccountSetupProps> = ({ 
  onComplete, 
  onBackToIntro 
}) => {
  const [step, setStep] = useState<number>(1);
  const [username, setUsername] = useState<string>('');
  const [, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  
  const generateLetterAvatar = (name: string): string => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;

    if (context) {
      // Deterministic color based on username
      const getColorFromName = (name: string) => {
        const colors = [
          '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
          '#9b59b6', '#1abc9c', '#d35400', '#c0392b'
        ];
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Make sure it's positive
        hash = Math.abs(hash);
        
        // Use the hash to pick a color
        return colors[hash % colors.length];
      };

      context.fillStyle = getColorFromName(name);
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.font = 'bold 100px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(name.charAt(0).toUpperCase(), canvas.width / 2, canvas.height / 2 + 5);
    }

    return canvas.toDataURL('image/png');
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
    setPhotoPreview(null);
  };

  const handleNext = (): void => {
    if (step === 1) {
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
      
      setError('');
      setStep(2);
    } else {
      if (photoPreview) {
        const userData: UserData = {
          username,
          image: photoPreview,
          xp: 0
        };
        
        onComplete(userData);
      }
    }
  };

  const handleSkip = (): void => {
    const userData: UserData = {
      username,
      image: generateLetterAvatar(username),
      xp: 0
    };
    
    onComplete(userData);
  };

  const handleBack = (): void => {
    if (step === 1) {
      if (onBackToIntro) {
        onBackToIntro();
      }
    } else {
      setStep(1);
    }
  };

  return (
    <div className="account-setup-overlay">
      <div className="account-setup-container">
        <div className="account-setup-header">
          <h2 className="account-setup-title">
            {step === 1 ? 'Create An Account' : 'Upload Profile Photo'}
          </h2>
          <p className="account-setup-subtitle">
            {step === 1 
              ? 'Choose a username to join the leaderboard' 
              : 'Add a profile photo or skip to use a generated avatar'}
          </p>
        </div>
        
        {step === 1 ? (
          <div className="account-setup-form">
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
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
        ) : (
          <div className="account-setup-form">
            <div className="photo-upload-container">
              {photoPreview ? (
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
                    aria-label="Clear photo"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="letter-avatar">
                  <span className="letter-avatar-text">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              <label className="photo-upload-label">
                <span className="photo-upload-button">
                {t("choosePhoto")}
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
        )}
        
        <div className="account-setup-footer">
          {step === 1 ? (
            <>
              <button
                onClick={handleBack}
                className="back-button"
              >
                <img className="back-button-arrow" src={SideArrow} alt="Back" />
                {t("back")}

              </button>
              <button
                onClick={handleNext}
                className="next-button"
              >
                {t("next")}
                <img className="next-button-arrow" src={SideArrow} alt="Next" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleBack}
                className="back-button"
              >
                <img className="back-button-arrow" src={SideArrow} alt="Back" />
                {t("back")}
              </button>
              <div className="action-buttons">
                <button
                  onClick={handleSkip}
                  className="skip-button"
                >
                {t("skip")}
                </button>
                <button
                  onClick={handleNext}
                  className={`complete-button ${!photoPreview ? 'complete-button-disabled' : ''}`}
                  disabled={!photoPreview}
                >
                {t("complete")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardAccountSetup;