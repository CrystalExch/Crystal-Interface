import React, { useEffect, useState } from 'react';
import { encodeFunctionData } from 'viem';

import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi.ts';
import { settings } from '../../settings';
import upload from '../../assets/upload.svg'
import './Launchpad.css';
import { useNavigate } from 'react-router-dom';

interface LaunchpadFormData {
  name: string;
  ticker: string;
  description: string;
  image: File | null;
  telegram: string;
  discord: string;
  twitter: string;
  website: string;
}

interface LaunchpadProps {
  address: `0x${string}` | undefined;
  sendUserOperationAsync: any;
  account: any;
  setChain: () => void;
  setpopup: (n: number) => void;
}

const ROUTER_ADDRESS = settings.chainConfig[10143].launchpadRouter.toLowerCase();
const TOKEN_CREATED_TOPIC = '0x32a005ee3e18b7dd09cfff956d3a1e8906030b52ec1a9517f6da679db7ffe540';

const UPLOADER_URL = 'https://launchpad-api.bhealthyfences.workers.dev/';

async function uploadToR2(
  key: string,
  body: File | string,
  contentType: string
): Promise<string> {
  const res = await fetch(`${UPLOADER_URL}/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: body,
  });
  if (!res.ok) throw new Error(`upload failed: ${res.status}`);
  const data = await res.json();
  return data.url;
}

const Launchpad: React.FC<LaunchpadProps> = ({
  sendUserOperationAsync,
  account,
  setChain,
  setpopup,
}) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<LaunchpadFormData>({
    name: '',
    ticker: '',
    description: '',
    image: null,
    telegram: '',
    discord: '',
    twitter: '',
    website: '',
  });
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Limit ticker to 10 characters
    if (name === 'ticker' && value.length > 10) {
      return;
    }
    
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const readFilePreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 1 * 1024 * 1024) {
      setFormData((p) => ({ ...p, image: file }));
      readFilePreview(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.size <= 1 * 1024 * 1024) {
      setFormData((p) => ({ ...p, image: file }));
      readFilePreview(file);
    }
  };

  const clearImage = () => {
    setFormData((p) => ({ ...p, image: null }));
    setImagePreview(null);
    (document.getElementById('file-input') as HTMLInputElement | null)?.click();
  };

  const handleLaunch = async () => {
    if (!formData.name || !formData.ticker || !formData.image) {
      return;
    }
    if (!account.connected) return setpopup(4);
    if (account.chainId !== 10143) return setChain();

    setIsLaunching(true);
    try {
      const imageKey = `img/${formData.ticker}-${Date.now()}.${formData.image.name.split('.').pop()
        }`;
      const imageUrl = await uploadToR2(
        imageKey,
        formData.image,
        formData.image.type
      );

      const timestamp = Date.now();
      const metaKey = `metadata/${formData.ticker}-${timestamp}.json`;
      const metadata = {
        name: formData.name,
        symbol: formData.ticker,
        description: formData.description,
        image: imageUrl,
        telegram: formData.telegram,
        discord: formData.discord,
        twitter: formData.twitter,
        website: formData.website,
      };
      const metadataUrl = await uploadToR2(
        metaKey,
        JSON.stringify(metadata),
        'application/json'
      );
      await sendUserOperationAsync({
        uo: {
          target: ROUTER_ADDRESS,
          data: encodeFunctionData({
            abi: CrystalRouterAbi,
            functionName: 'createToken',
            args: [formData.name, formData.ticker, metadataUrl, formData.description, formData.twitter, formData.website, formData.telegram, formData.discord],
          }),
        },
      });
      setIsLaunching(false);
      navigate('/explorer');
    } catch (err: any) {
      setIsLaunching(false);
      return
    }
  };

  const isFormValid = !!formData.name && !!formData.ticker && !!formData.image;

  return (
    <div className="launchpad-container">
      <div className="launchpad-content">
        <div className="launchpad-form-wrapper">
          <h1 className="launchpad-title">Launch your token</h1>

          <div className="launchpad-form">
            <div className="launchpad-token-info">
              <div className="launchpad-form-group">
                <label className="launchpad-label">Name *</label>
                <input name="name" value={formData.name} onChange={handleInputChange} className="launchpad-input" placeholder="Name your coin" disabled={isLaunching}   maxLength={32}
/>
              </div>
              <div className="launchpad-form-group">
                <label className="launchpad-label">Ticker *</label>
                <input 
                  name="ticker" 
                  value={formData.ticker} 
                  onChange={handleInputChange} 
                  className="launchpad-input" 
                  placeholder="Add a coin ticker (e.g. BTC)" 
                  disabled={isLaunching}
                  maxLength={10}
                />
              </div>
            </div>
            <div className="launchpad-form-group">
              <label className="launchpad-label">Description <span className="optional-text">[Optional]</span></label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} className="launchpad-input" placeholder="Write a short description" rows={3} disabled={isLaunching} />
            </div>
            <div className="launchpad-form-group">
              <label className="launchpad-label">Upload a picture *</label>
              <div className={`launchpad-upload-area ${dragActive ? 'drag-active' : ''}`} onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => !isLaunching && document.getElementById('file-input')?.click()}>
                <input id="file-input" type="file" accept="image/*,video/mp4" onChange={handleFileSelect} className="launchpad-file-input" disabled={isLaunching} />
                {imagePreview ? (
                  <div className="launchpad-upload-content">
                    <div className="launchpad-image-container">
                      <img src={imagePreview} alt="preview" className="launchpad-image-preview" />
                      <button onClick={(e) => { e.stopPropagation(); clearImage(); }} className="launchpad-clear-button">×</button>
                    </div>
                    <p>{formData.image?.name}</p>
                    <p>Click to change</p>
                  </div>
                ) : (
                  <div className="launchpad-upload-content">
                    <img src={upload} />
                    <p className="launchpad-upload-header">Select a video or image to upload</p>
                    <p className="launchpad-upload-subtitle">or drag and drop it here</p>
                  </div>

                )}
              </div>
            </div>
            <div className="launchpad-form-group">
              <label className="launchpad-label">Socials <span className="optional-text">[Optional]</span></label>
              <div className="launchpad-socials-grid">
                {(['twitter', 'website', 'telegram', 'discord'] as const).map((field) => (
                  <div key={field} className="launchpad-social-field">
                    <label className="launchpad-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                    <input name={field} value={formData[field]} onChange={handleInputChange} className="launchpad-input" placeholder={field == 'telegram' ? 'https://t.me/...' : field == 'discord' ? 'https://discord.gg/...' : `https://${field}.com/...`} disabled={isLaunching} />
                  </div>
                ))}
              </div>
            </div>


            <button className={`launchpad-launch-button ${isFormValid && !isLaunching ? 'enabled' : ''}`} onClick={handleLaunch} disabled={!isFormValid || isLaunching}>
              {isLaunching && (<div className="loading-spinner" />)}
              {isLaunching ? 'Sign Transaction' : account.connected ? (account.chainId === 10143 ? 'Launch Token' : `Switch to ${settings.chainConfig[10143].name}`) : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Launchpad;