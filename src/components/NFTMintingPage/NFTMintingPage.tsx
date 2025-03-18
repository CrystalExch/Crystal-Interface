import React, { useState, useEffect } from 'react';
import './NFTMintingPage.css';
import LeaderboardBanner from '../../assets/MintTeaser.png';

const NFTMintingPage: React.FC = () => {
  const [mintLoading, setMintLoading] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [transaction, setTransaction] = useState('');
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // Mock NFT data
  const nftData = {
    name: "Amethyst Ravine",
    description: "A rare digital collectible. This NFT grants access to exclusive community events and future airdrops.",
    imageUrl: LeaderboardBanner,
    price: 0.08,
    remainingSupply: 117,
    totalSupply: 1000,
    volume24h: 5.27,
    holders: 423,
    sales24h: 18
  };

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date("2025-03-24T12:00:00Z");
      const now = new Date();
      
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      
      setTimeLeft({ days, hours, minutes, seconds });
    };
    
    calculateTimeLeft();
    
    const timer = setInterval(() => {
      calculateTimeLeft();
    }, 1000);
    
    return () => {
      clearInterval(timer);
      console.log('Countdown timer cleared');
    };
  }, []);

  const handleMint = () => {
    setMintLoading(true);
    
    setTimeout(() => {
      setMintLoading(false);
      setMintSuccess(true);
      setTransaction('0x3a8d45ab67c9f4213d8324252f9c69b4382f7d98b45678c3d458f47c2d941589');
    }, 2000);
  };

  const supplySold = nftData.totalSupply - nftData.remainingSupply;
  const percentageSold = (supplySold / nftData.totalSupply) * 100;

  return (
      <div className="nft-main-content-wrapper">
        <div className="nft-image-container">
          <img src={nftData.imageUrl} alt={nftData.name} className="nft-image" />
          <div className="nft-countdown-timer">
            <div className="nft-countdown-content">
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </div>
          </div>
        </div>
        <div className="nft-swapmodal">
          <div className="nft-header">
            <h1 className="nft-tokenselectheader1">Mint NFT</h1>
            <p className="nft-tokenselectheader2">Create your exclusive digital collectible</p>
          </div>

          <div className="nft-content">
            <div className="nft-flex-container">
              <div className="nft-details">
                <h2 className="nft-name">{nftData.name}</h2>
                <p className="nft-description">{nftData.description}</p>
                
                {/* Stats Grid */}
                <div className="nft-stats-grid">
                  <div className="nft-stat-item">
                    <div className="nft-stat-value">{nftData.volume24h} MON</div>
                    <div className="nft-stat-label">24h Volume</div>
                  </div>
                  <div className="nft-stat-item">
                    <div className="nft-stat-value">{nftData.holders}</div>
                    <div className="nft-stat-label">Holders</div>
                  </div>
                  <div className="nft-stat-item">
                    <div className="nft-stat-value">{nftData.sales24h}</div>
                    <div className="nft-stat-label">24h Sales</div>
                  </div>
                </div>
                
                <div className="nft-supply-container">
                  <div className="nft-supply-text">
                    <span>{supplySold} / {nftData.totalSupply}</span>
                    <span className="nft-supply-percentage">{percentageSold.toFixed(1)}% Minted</span>
                  </div>
                  <div className="nft-supply-bar">
                    <div className="nft-supply-progress" style={{ width: `${percentageSold}%` }}></div>
                  </div>
                </div>
                
                <div className="nft-price-container">
                  <div className="nft-label-container">Price</div>
                  <div className="nft-value-container">{nftData.price} MON</div>
                </div>
                
              </div>
            </div>
            
            {!mintSuccess ? (
              <button 
                className={`nft-swap-button ${mintLoading ? 'nft-signing' : ''}`} 
                onClick={handleMint}
                disabled={mintLoading}
              >
                {mintLoading ? (
                  <div className="nft-button-content">
                    <div className="nft-loading-spinner"></div>
                    <span>Minting...</span>
                  </div>
                ) : (
                  "Mint NFT"
                )}
              </button>
            ) : (
              <div className="nft-mint-success-container">
    
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default NFTMintingPage;