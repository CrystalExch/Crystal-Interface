import React from 'react';
import { Package, FileText, Image } from 'lucide-react';

const ReferralResources: React.FC = () => {
  return (
    <div className="resources-section">
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
    </div>
  );
};

export default ReferralResources;
