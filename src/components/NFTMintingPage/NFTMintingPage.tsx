import React, { useState, useEffect } from 'react';
import './NFTMintingPage.css';
import LeaderboardBanner from '../../assets/MintTeaser.png';

const NFTMintingPage: React.FC = () => {
  const [mintLoading, setMintLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  const nftData = {
    name: "Crystal x ???",
    description: "Trade on Crystal to become eligible for our first NFT drop, coming soon...",
    imageUrl: LeaderboardBanner,
    remainingSupply: 1000,
    totalSupply: 1000,
    mints24h: 0,
    holders: 0,
    eligible: 0
  };

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date("2025-05-01T05:00:00Z");
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
    };
  }, []);

  const handleMint = () => {
    setMintLoading(true);
    
    setTimeout(() => {
      setMintLoading(false);
    }, 2000);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const supplySold = nftData.totalSupply - nftData.remainingSupply;
  const percentageSold = (supplySold / nftData.totalSupply) * 100;

  return (
    <div className="nft-scroll-wrapper">
      <div className="nft-main-content-wrapper">
        <div className="nft-image-container">
          {!imageLoaded && <div className="nft-image-placeholder"></div>}
          <img 
            src={nftData.imageUrl} 
            className={`nft-image ${imageLoaded ? 'nft-image-loaded' : ''}`} 
            onLoad={handleImageLoad}
          />
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
                
                <div className="nft-stats-grid">
                  <div className="nft-stat-item">
                    <div className="nft-stat-value">{nftData.mints24h}</div>
                    <div className="nft-stat-label">24h Mints</div>
                  </div>
                  <div className="nft-stat-item">
                    <div className="nft-stat-value">{nftData.holders}</div>
                    <div className="nft-stat-label">Holders</div>
                  </div>
                  <div className="nft-stat-item">
                    <div className="nft-stat-value">{nftData.eligible}</div>
                    <div className="nft-stat-label">Eligible</div>
                  </div>
                </div>
                
                <div className="nft-supply-container">
                  <div className="nft-supply-text">
                    <span>{supplySold} / {'???'}</span>
                    <span className="nft-supply-percentage">{percentageSold.toFixed(1)}% Minted</span>
                  </div>
                  <div className="nft-supply-bar">
                    <div className="nft-supply-progress" style={{ width: `${percentageSold}%` }}></div>
                  </div>
                </div>
                
                <div className="nft-price-container">
                  <div className="nft-label-container">Price</div>
                  <div className="nft-value-container">Free</div>
                </div>
                
              </div>
            </div>
            <button 
                className={`nft-swap-button ${mintLoading ? 'nft-signing' : ''}`} 
                onClick={handleMint}
                disabled={true}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTMintingPage;