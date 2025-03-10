import React, { useState } from 'react';
import './NFTMintingPage.css';
import LeaderboardBanner from '../../assets/leaderboardbanner.png';

const NFTMintingPage: React.FC = () => {
  const [mintLoading, setMintLoading] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [transaction, setTransaction] = useState('');
  
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

  const handleMint = () => {
    setMintLoading(true);
    
    // Simulate minting process
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
                <div className="nft-mint-success-icon">✓</div>
                <h3 className="nft-mint-success-title">Successfully Minted!</h3>
                <p className="nft-mint-success-text">Your NFT has been minted and sent to your wallet.</p>
                <div className="nft-mint-transaction">
                  <span>Transaction:</span>
                  <a href={`https://etherscan.io/tx/${transaction}`} target="_blank" rel="noopener noreferrer" className="nft-mint-transaction-link">
                    {transaction.substring(0, 6)}...{transaction.substring(transaction.length - 4)}
                  </a>
                </div>
                <button className="nft-view-button" onClick={() => window.open("https://opensea.io", "_blank")}>
                  View on OpenSea
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default NFTMintingPage;