import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const HowItWorks: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      number: 1,
      title: 'Create Your Code',
      description: 'Apply and get approved for your unique referral code. Only screened users can generate codes.',
      icon: '🔑'
    },
    {
      number: 2,
      title: 'Share Your Link',
      description: 'Share your personalized referral link with traders. Use social media, Discord, or direct outreach.',
      icon: '🔗'
    },
    {
      number: 3,
      title: 'Earn Commission',
      description: 'Earn lifetime commission on every trade your referrals make. Track earnings in real-time on your dashboard.',
      icon: '💰'
    }
  ];

  return (
    <div className="how-it-works-section">
      <h2 className="how-it-works-title">How to Get Started</h2>
      <p className="how-it-works-subtitle">
        Three simple steps to start earning passive income
      </p>
      <div className="how-it-works-steps">
        {steps.map((step) => (
          <div key={step.number} className="step-card">
            <div className="referrals-step-number">{step.number}</div>
            <div className="step-icon">{step.icon}</div>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-description">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;
