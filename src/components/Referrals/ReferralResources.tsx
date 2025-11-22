import React from 'react';
import { Package, FileText, Image } from 'lucide-react';

const ReferralResources: React.FC = () => {
  return (
    <div className="resources-section">
      {/* Commented out old resources section
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
      */}

      {/* New section with tracker-wallets styling structure */}
      <h3 className="resources-title">Referral Activity</h3>
      <div className="resources-wallets-container">
        <div className="resources-wallets-header">
          <div className="resources-wallet-header-cell" style={{ flex: '0 0 150px' }}>User</div>
          <div className="resources-wallet-header-cell" style={{ flex: '0 0 120px' }}>Date Joined</div>
          <div className="resources-wallet-header-cell" style={{ flex: '1 1 auto' }}>Trading Volume</div>
          <div className="resources-wallet-header-cell" style={{ flex: '0 0 140px', textAlign: 'right' }}>Crystals Earned</div>
        </div>

        {/* Placeholder for when there's no activity */}
        <div className="resources-empty-state">
          <p>No referral activity yet</p>
          <p className="resources-empty-subtitle">Share your referral link to start earning</p>
        </div>
      </div>
    </div>
  );
};

export default ReferralResources;
