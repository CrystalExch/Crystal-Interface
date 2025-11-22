import React from 'react';
import { Package, FileText, Image } from 'lucide-react';

interface ReferredUser {
  address: string;
  username?: string;
  joinedAt: number; // timestamp
  tradingVolume: number;
  crystalsEarned: number;
}

const ReferralResources: React.FC = () => {
  // Mock data - 1 sample user who just joined but hasn't traded yet
  const referredUsers: ReferredUser[] = [
    {
      address: '0x1234...5678',
      username: 'User123',
      joinedAt: Date.now() - (5 * 24 * 60 * 60 * 1000), // 5 days ago
      tradingVolume: 0,
      crystalsEarned: 0,
    },
  ];

  const formatTimeAgo = (timestamp: number): string => {
    const days = Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const formatVolume = (volume: number): string => {
    if (volume === 0) return '$0';
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`;
    }
    return `$${volume.toFixed(0)}`;
  };

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="resources-section">
      {/*
      <h3 className="resources-title">Marketing Resources</h3>
      <p className="resources-subtitle">
        Tools to help you promote your referral link
      </p>

      <div className="resources-grid">
        <div className="resource-card">
          <div className="resource-icon">
            <Package size={32} />
          </div>
          <h4 className="resource-title">Asset Pack</h4>
          <p className="resource-description">
            Logos, banners, and graphics for promotion
          </p>
          <button disabled className="resource-button-disabled">
            Coming Soon
          </button>
        </div>

        <div className="resource-card">
          <div className="resource-icon">
            <FileText size={32} />
          </div>
          <h4 className="resource-title">Copy Templates</h4>
          <p className="resource-description">
            Pre-written social media posts and emails
          </p>
          <button disabled className="resource-button-disabled">
            Coming Soon
          </button>
        </div>

        <div className="resource-card">
          <div className="resource-icon">
            <Image size={32} />
          </div>
          <h4 className="resource-title">Performance Badge</h4>
          <p className="resource-description">
            Share your affiliate stats on social media
          </p>
          <button disabled className="resource-button-disabled">
            Coming Soon
          </button>
        </div>
      </div>

      <h3 className="resources-title">Referral Activity</h3>
      <div className="resources-wallets-container">
        <div className="resources-wallets-header">
          <div className="resources-wallet-header-cell" style={{ flex: '0 0 150px', textAlign: 'left' }}>
            User ({formatCount(referredUsers.length)})
          </div>
          <div style={{ flex: '1 1 auto' }}></div>
          <div className="resources-wallet-header-cell" style={{ flex: '0 0 120px', textAlign: 'right' }}>Date Joined</div>
          <div className="resources-wallet-header-cell" style={{ flex: '0 0 120px', textAlign: 'right' }}>Trading Volume</div>
          <div className="resources-wallet-header-cell" style={{ flex: '0 0 140px', textAlign: 'right' }}>Crystals Earned</div>
        </div>

        {referredUsers.length === 0 ? (
          <div className="resources-empty-state">
            <p>No referral activity yet</p>
            <p className="resources-empty-subtitle">Share your referral link to start earning</p>
          </div>
        ) : (
          <>
            {referredUsers.map((user, index) => (
              <div key={user.address} className="resources-wallet-item">
                <div className="resources-wallet-cell" style={{ flex: '0 0 150px' }}>
                  {user.username || user.address}
                </div>
                <div style={{ flex: '1 1 auto' }}></div>
                <div className="resources-wallet-cell" style={{ flex: '0 0 120px', textAlign: 'right' }}>
                  {formatTimeAgo(user.joinedAt)}
                </div>
                <div className="resources-wallet-cell" style={{ flex: '0 0 120px', textAlign: 'right' }}>
                  {formatVolume(user.tradingVolume)}
                </div>
                <div className="resources-wallet-cell" style={{ flex: '0 0 140px', textAlign: 'right' }}>
                  {user.crystalsEarned}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      */}
    </div>
  );
};

export default ReferralResources;
