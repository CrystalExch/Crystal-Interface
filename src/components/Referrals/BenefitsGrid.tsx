import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const BenefitsGrid: React.FC = () => {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: '♾️',
      title: 'Lifetime Earning',
      description: 'Earn commissions from your referrals forever. No expiration dates or time limits on your earnings.'
    },
    {
      icon: '⚡',
      title: 'Instant Payout',
      description: 'Claim your earnings instantly on-chain. No waiting periods or minimum thresholds to withdraw.'
    },
    {
      icon: '📊',
      title: 'Performance Tracking',
      description: 'Real-time dashboard to monitor your referrals, earnings, and commission breakdown with detailed analytics.'
    },
    {
      icon: '🎨',
      title: 'Marketing Tools',
      description: 'Access QR codes, social badges, and promotional assets to maximize your affiliate success.'
    },
    {
      icon: '🏆',
      title: 'Tier Progression',
      description: 'Unlock higher commission rates and exclusive perks as you grow. Bronze, Silver, and Gold tiers available.'
    },
    {
      icon: '💬',
      title: 'Dedicated Support',
      description: 'Direct access to our affiliate support team via Discord for personalized assistance and optimization tips.'
    }
  ];

  return (
    <div className="benefits-grid-section">
      <h2 className="benefits-grid-title">Why Join Crystal Affiliates?</h2>
      <p className="benefits-grid-subtitle">
        Industry-leading features designed to maximize your earning potential
      </p>
      <div className="benefits-grid">
        {benefits.map((benefit, index) => (
          <div key={index} className="benefit-card">
            <div className="benefit-icon">{benefit.icon}</div>
            <h3 className="benefit-title">{benefit.title}</h3>
            <p className="benefit-description">{benefit.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BenefitsGrid;
