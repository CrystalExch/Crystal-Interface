import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import HowItWorks from './HowItWorks';
import CommissionExplainer from './CommissionExplainer';
import BenefitsGrid from './BenefitsGrid';
import ReferralFAQ from './ReferralFAQ';
import ReferralsBG from '../../assets/ReferralsBG.png';

interface ReferralLandingPageProps {
  address: string | undefined;
  connected: boolean;
  setpopup: (n: number) => void;
  setShowModal: (v: boolean) => void;
}

const ReferralLandingPage: React.FC<ReferralLandingPageProps> = ({
  address,
  connected,
  setpopup,
  setShowModal,
}) => {
  const { t } = useLanguage();
  const [showRequestModal, setShowRequestModal] = React.useState(false);

  const handleGetStarted = () => {
    if (!connected) {
      setpopup(4); // Open wallet connection modal
    } else {
      setShowRequestModal(true); // Open request access modal
    }
  };

  return (
    <div className="referral-landing-page">
      {/* Hero Section */}
      <div className="referral-hero-section">
        <div className="referral-hero-content">
          <h1 className="referral-hero-title">
            REFER TRADERS NOW AND START EARNING LIFETIME COMMISSION
          </h1>
          <p className="referral-hero-subtitle">
            Join Crystal's affiliate program and earn competitive commissions on every trade your referrals make.
            No caps, no limits - just pure passive income potential.
          </p>
          <div className="referral-hero-buttons">
            <button
              className="referral-cta-button primary"
              onClick={handleGetStarted}
            >
            </button>
            <button
              className="referral-cta-button secondary"
              onClick={() => {
                // Navigate to dashboard view
                window.location.href = '/referrals?dashboard=true';

                // Original "Learn More" functionality (commented out)
                // const howItWorksSection = document.querySelector('.how-it-works-section');
                // if (howItWorksSection) {
                //   howItWorksSection.scrollIntoView({ behavior: 'smooth' });
                // }
              }}
            >
              View Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Commission Explainer */}
      <CommissionExplainer />

      {/* Benefits Grid */}
      <BenefitsGrid />

      {/* FAQ Section */}
      <ReferralFAQ />

      {/* Final CTA Section */}
      <div className="referral-final-cta">
        <h2>Ready to Start Earning?</h2>
        <p>Join thousands of affiliates already earning with Crystal Exchange</p>
        <button
          className="referral-cta-button primary large"
          onClick={handleGetStarted}
        >
        </button>
      </div>
    </div>
  );
};

export default ReferralLandingPage;
