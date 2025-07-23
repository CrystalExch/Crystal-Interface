import React, { useEffect, useState } from 'react';
import { encodeFunctionData } from 'viem';
import './launchpad.css';

import { CrystalLaunchpadToken } from '../../abis/CrystalLaunchpadToken';
import { CrystalLaunchpadRouter } from '../../abis/CrystalLaunchpadRouter';
import { settings } from '../../settings';

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
  waitForTxReceipt: any;
  account: any;
  setChain: any;
  setpopup: any;
  config: any;
}

const Launchpad: React.FC<LaunchpadProps> = ({
  address,
  sendUserOperationAsync,
  waitForTxReceipt,
  account,
  setChain,
  setpopup,
  config
}) => {


  useEffect(() => {
  const connector = (account as any).connector;
  if (connector && typeof connector.getChainId !== 'function') {
    connector.getChainId = async () => {
      const provider = await connector.getProvider();
      const { chainId } = await provider.getNetwork();
      return chainId;
    };
  }
}, [account.connector]);


  const activechain = 10143;
  const routerAddress = settings.chainConfig[activechain].launchpadRouter.toLowerCase();
  const eventTopic = '0xfe210c99153843bc67efa2e9a61ec1d63c505e379b9dcf05a9520e84e36e6063';

  useEffect(() => {
    const wsRpcUrl = 'wss://testnet-rpc.monad.xyz';  
    const ws = new WebSocket(wsRpcUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_subscribe',
        params: [
          'logs',
          { address: routerAddress, topics: [eventTopic] }
        ]
      }));
    };
   ws.onmessage = ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.method !== 'eth_subscription') return;

  const log = msg.params.result;
  const marketAddress = `0x${log.topics[1].slice(26)}`;
  console.log('marketAddress:', marketAddress);

  // strip “0x” and prepare hex payload
  const hex = log.data.startsWith('0x') ? log.data.slice(2) : log.data;

  // parse head slots (3 dynamic args) to get byte‐offsets
  const offsets = [
    parseInt(hex.slice(   0,  64), 16),
    parseInt(hex.slice(  64, 128), 16),
    parseInt(hex.slice( 128, 192), 16),
  ];

  // helper to read a Solidity‐encoded string at a given byte offset
  function readString(at: number) {
    const base    = at * 2; // hex index
    const length = parseInt(hex.slice(base, base + 64), 16);
    const start  = base + 64;
    const strHex = hex.slice(start, start + length * 2);
    let out = '';
    for (let i = 0; i < strHex.length; i += 2) {
      out += String.fromCharCode(parseInt(strHex.slice(i, i + 2), 16));
    }
    return out;
  }

  const name   = readString(offsets[0]);
  const ticker = readString(offsets[1]);
  const cid    = readString(offsets[2]);

  console.log('name:', name);
  console.log('ticker:', ticker);
  console.log('CID:', cid);
};


    ws.onerror = (err) => console.error('WebSocket error', err);

    return () => {
      ws.close();
    };
  }, []);


  const [formData, setFormData] = useState<LaunchpadFormData>({
    name: '',
    ticker: '',
    description: '',
    image: null,
    telegram: '',
    discord: '',
    twitter: '',
    website: ''
  });

  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStatus, setLaunchStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [deployedTokenAddress, setDeployedTokenAddress] = useState<string>('');
  const [deployedMarketAddress, setDeployedMarketAddress] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const uploadToIPFS = async () => {
    if (!formData.image) throw new Error('No image selected');

    const form = new FormData();
    form.append('image', formData.image);
    form.append('telegram', formData.telegram);
    form.append('discord', formData.discord);
    form.append('twitter', formData.twitter);
    form.append('website', formData.website);

    const response = await fetch('http://localhost:5000/upload-image', {
      method: 'POST',
      body: form
    });


    const data = await response.json();
    return data;
  };

  const deployToken = async (metadataCID: string) => {
    const routerAddress = settings.chainConfig[activechain]?.launchpadRouter;

    const hash = await sendUserOperationAsync({
      uo: {
        target: routerAddress,
        data: encodeFunctionData({
          abi: CrystalLaunchpadRouter,
          functionName: 'createToken',
          args: [
            formData.name,                              // name
            formData.ticker,                            // symbol  
            metadataCID                                 // metadataCID
          ]
        }),
      }
    });

    const receipt = await waitForTxReceipt(hash.hash);
    return receipt;
  };

  const createMarket = async (tokenAddress: string) => {
    return { logs: [] };
  };

  const handleLaunch = async () => {
    if (!formData.image || !formData.name || !formData.ticker) {
      setError('Please fill in all required fields');
      return;
    }

    if (!account.connected) {
      setpopup(4);
      return;
    }

    if (account.chainId !== activechain) {
      setChain();
      return;
    }

    setIsLaunching(true);
    setError('');
    setSuccess('');

    try {
      const ipfsData = await uploadToIPFS();
      console.log('IPFS Upload successful:', ipfsData);
      
      const tokenReceipt = await deployToken(ipfsData.metadataCID);
      console.log('Token deployed:', tokenReceipt);
      console.log('json data:', ipfsData);
      const tokenAddress = extractTokenAddressFromReceipt(tokenReceipt);
      setDeployedTokenAddress(tokenAddress);

      setLaunchStatus('Creating trading market...');
      const marketReceipt = await createMarket(tokenAddress);
      console.log('Market created:', marketReceipt);
      const marketAddress = extractMarketAddressFromReceipt(marketReceipt);
      setDeployedMarketAddress(marketAddress);
      setSuccess(`Token successfully launched! 
        Token Address: ${tokenAddress}
        Market Address: ${marketAddress}`);

    } catch (err: any) {
      setLaunchStatus('');
    } finally {
      setIsLaunching(false);
    }
  };

  const extractTokenAddressFromReceipt = (receipt: any): string => {
    try {
      const tokenCreatedEvent = receipt.logs.find((log: any) =>
        log.topics && log.topics[0] &&
        (log.topics[0].toLowerCase().includes('tokencreated') ||
          log.address.toLowerCase() === settings.chainConfig[activechain]?.launchpadRouter.toLowerCase())
      );

      if (tokenCreatedEvent && tokenCreatedEvent.topics && tokenCreatedEvent.topics.length >= 3) {
        const tokenAddress = `0x${tokenCreatedEvent.topics[1].slice(26)}`;

        const marketAddress = `0x${tokenCreatedEvent.topics[2].slice(26)}`;
        setDeployedMarketAddress(marketAddress);

        return tokenAddress;
      }
      const contractAddresses = receipt.logs
        .map((log: any) => log.address)
        .filter((addr: string) => addr && addr !== settings.chainConfig[activechain]?.launchpadRouter);

      if (contractAddresses.length > 0) {
        return contractAddresses[0];
      }

    } catch (error) {
    }
  };

  const extractMarketAddressFromReceipt = (receipt: any): string => {
    try {
      if (deployedMarketAddress) {
        return deployedMarketAddress;
      }

      const tokenCreatedEvent = receipt.logs.find((log: any) =>
        log.topics && log.topics[0] &&
        log.address.toLowerCase() === settings.chainConfig[activechain]?.launchpadRouter.toLowerCase()
      );

      if (tokenCreatedEvent && tokenCreatedEvent.topics && tokenCreatedEvent.topics.length >= 3) {
        return `0x${tokenCreatedEvent.topics[2].slice(26)}`;
      }
      const contractAddresses = receipt.logs
        .map((log: any) => log.address)
        .filter((addr: string) =>
          addr &&
          addr !== settings.chainConfig[activechain]?.launchpadRouter &&
          addr !== deployedTokenAddress
        );

      if (contractAddresses.length > 0) {
        return contractAddresses[0];
      }

    } catch (error) {
    }
  };

  const isFormValid = formData.name && formData.ticker && formData.image;

  return (
    <div className="launchpad-container">
      <div className="launchpad-content">
        <div className="launchpad-form-wrapper">
          <h1 className="launchpad-title">Launch your token</h1>
          <div className="launchpad-form">
            <div className="launchpad-form-group">
              <label className="launchpad-label">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="launchpad-input"
                placeholder="Bitcoin"
                disabled={isLaunching}
              />
            </div>

            <div className="launchpad-form-group">
              <label className="launchpad-label">Ticker *</label>
              <input
                type="text"
                name="ticker"
                value={formData.ticker}
                onChange={handleInputChange}
                className="launchpad-input"
                placeholder="BTC"
                disabled={isLaunching}
              />
            </div>

            <div className="launchpad-form-group">
              <label className="launchpad-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="launchpad-input"
                placeholder="Describe your token..."
                rows={3}
                disabled={isLaunching}
              />
            </div>

            <div className="launchpad-form-group">
              <label className="launchpad-label">Upload a picture *</label>
              <div
                className={`launchpad-upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isLaunching && document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4,.jpg,.jpeg,.png,.gif,.mp4"
                  onChange={handleFileSelect}
                  className="launchpad-file-input"
                  disabled={isLaunching}
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
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
                    disabled={isLaunching}
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
                    disabled={isLaunching}
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
                    disabled={isLaunching}
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
                    disabled={isLaunching}
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
              className={`launchpad-launch-button ${isFormValid && !isLaunching ? 'enabled' : ''}`}
              onClick={handleLaunch}
              disabled={!isFormValid || isLaunching}
            >
              {isLaunching ? (
                <>
                  <div className="loading-spinner"></div>
                  Sign Transaction
                </>
              ) : account.connected && account.chainId === activechain ? (
                'Launch Token'
              ) : account.connected ? (
                `Switch to ${settings.chainConfig[activechain]?.name || 'Monad'}`
              ) : (
                'Connect Wallet'
              )}
            </button>

            {deployedTokenAddress && (
              <div className="deployment-results">
                <h3>Deployment Successful!</h3>
                <div className="deployment-details">
                  <p><strong>Token Address:</strong> {deployedTokenAddress}</p>
                  {deployedMarketAddress && (
                    <p><strong>Market Address:</strong> {deployedMarketAddress}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Launchpad;