import React, { useState } from 'react';
import './launchpad.css';

interface LaunchpadFormData {
  name: string;
  ticker: string;
  image: File | null;
  telegram: string;
  discord: string;
  twitter: string;
  website: string;
}

const Launchpad: React.FC = () => {
  const [formData, setFormData] = useState<LaunchpadFormData>({
    name: '',
    ticker: '',
    image: null,
    telegram: '',
    discord: '',
    twitter: '',
    website: ''
  });

  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size <= 1024 * 1024) { // 1MB limit
        setFormData(prev => ({
          ...prev,
          image: file
        }));
        
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size <= 1024 * 1024) { 
        setFormData(prev => ({
          ...prev,
          image: file
        }));
        
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const clearImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleLaunch = () => {
    // Launch logic here
    console.log('Launching token:', formData);
  };

  const isFormValid = formData.name && formData.ticker && formData.image;

  return (
    <div className="launchpad-container">
      <div className="launchpad-content">
        <div className="launchpad-form-wrapper">
          <h1 className="launchpad-title">Launch your token</h1>

          <div className="launchpad-form">
            <div className="launchpad-form-group">
              <label className="launchpad-label">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="launchpad-input"
                placeholder="Bitcoin"
              />
            </div>

            <div className="launchpad-form-group">
              <label className="launchpad-label">Ticker</label>
              <input
                type="text"
                name="ticker"
                value={formData.ticker}
                onChange={handleInputChange}
                className="launchpad-input"
                placeholder="BTC"
              />
            </div>

            <div className="launchpad-form-group">
              <label className="launchpad-label">Upload a picture</label>
              <div
                className={`launchpad-upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                  <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="launchpad-file-input"
                />
                
                {imagePreview ? (
                  <div className="launchpad-upload-content">
                    <div className="launchpad-image-container">
                      <img
                        src={imagePreview}
                        alt="Token preview"
                        className="launchpad-image-preview"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearImage();
                        }}
                        className="launchpad-clear-button"
                      >
                        ×
                      </button>
                    </div>
                    <div className="launchpad-upload-text">
                      <p>{formData.image?.name}</p>
                      <p>Click to change</p>
                    </div>
                  </div>
                ) : (
                  <div className="launchpad-upload-content">
                    <div className="launchpad-upload-text">
                      <p>Drag & drop or click to</p>
                      <p>upload (max 1 MB)</p>
                    </div>
                    <div className="launchpad-upload-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </div>
                  </div>
                )}
            
              </div>
            </div>

            <div className="launchpad-form-group">
              <label className="launchpad-label">Socials <span className="optional-text">[Optional]</span></label>
              <div className="launchpad-socials-grid">
                <div className="launchpad-social-field">
                  <label className="launchpad-label">Website</label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="launchpad-input"
                    placeholder="https://..."
                  />
                </div>
                <div className="launchpad-social-field">
                  <label className="launchpad-label">Telegram</label>
                  <input
                    type="text"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleInputChange}
                    className="launchpad-input"
                    placeholder="https://t.me/..."
                  />
                </div>
                <div className="launchpad-social-field">
                  <label className="launchpad-label">Discord</label>
                  <input
                    type="text"
                    name="discord"
                    value={formData.discord}
                    onChange={handleInputChange}
                    className="launchpad-input"
                    placeholder="https://discord.gg/..."
                  />
                </div>
                <div className="launchpad-social-field">
                  <label className="launchpad-label">X/Twitter</label>
                  <input
                    type="text"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    className="launchpad-input"
                    placeholder="https://x.com/..."
                  />
                </div>
              </div>
            </div>

            <div className="launchpad-cost-info">
              <div className="launchpad-cost-item">
                <span>Launch cost: 0.75 MON</span>
              </div>
            </div>

            <button
              className={`launchpad-launch-button ${isFormValid ? 'enabled' : ''}`}
              onClick={handleLaunch}
              disabled={!isFormValid}
            >
              Launch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Launchpad;