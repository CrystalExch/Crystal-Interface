import React from 'react';
import closebutton from '../../assets/close_button.png';
import './FeeScheduleModal.css';

interface FeeScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeeScheduleModal: React.FC<FeeScheduleModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const feeTiers = [
    {
      name: 'Bronze',
      tier: 1,
      volume: '$0+',
      cashback: '5%',
      referralCommission: '10%',
    },
    {
      name: 'Silver',
      tier: 2,
      volume: '$100K+',
      cashback: '10%',
      referralCommission: '10%',
    },
    {
      name: 'Gold',
      tier: 3,
      volume: '$500K+',
      cashback: '15%',
      referralCommission: '10%',
    },
    {
      name: 'Diamond',
      tier: 4,
      volume: '$1M+',
      cashback: '20%',
      referralCommission: '10%',
    },
  ];

  const makerRebateTiers = [
    {
      tier: 'R1',
      volumeShare: '0.5%+',
      rebate: '0.002%',
      description: 'Additional maker rebate',
    },
    {
      tier: 'R2',
      volumeShare: '1.0%+',
      rebate: '0.003%',
      description: 'Additional maker rebate',
    },
    {
      tier: 'R3',
      volumeShare: '2.0%+',
      rebate: '0.005%',
      description: 'Additional maker rebate',
    },
  ];

  return (
    <div className="fee-schedule-overlay" onClick={onClose}>
      <div className="fee-schedule-container" onClick={(e) => e.stopPropagation()}>
        <div className="fee-schedule-header">
          <h2 className="fee-schedule-title">Fee Tier</h2>
          <button className="fee-schedule-close" onClick={onClose}>
            <img src={closebutton} className="close-button-icon" alt="Close" />
          </button>
        </div>

        <div className="fee-schedule-body">
          {/* Introduction */}
          <div className="fee-schedule-intro">
            <p className="fee-schedule-description">
              Your fee tier is based on your monthly trailing trading volume across all markets. Higher volume unlocks lower fees and higher cashbacks.
            </p>
          </div>

          {/* Main Fee Tiers List */}
          <div className="fee-schedule-section">
            <div className="fee-schedule-table-wrapper">
              {feeTiers.map((tier) => (
                <div key={tier.tier} className="fee-tier-requirement-item achieved">
                  <div className={`tier-requirement-badge tier-${tier.tier}`}>
                    {tier.name}
                  </div>
                  <div className="fee-tier-requirement-details">
                    <span className="fee-tier-requirement-volume">{tier.volume} volume</span>
                    <span className="fee-tier-requirement-benefits">
                      Cashback: {tier.cashback} • Referral Commission: {tier.referralCommission}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* Notes */}
          <div className="fee-schedule-notes">
            <h4 className="fee-schedule-notes-title">Notes</h4>
            <ul className="fee-schedule-notes-list">
              <li>Trading volume is calculated as a trailing sum across all markets</li>
              <li>Cashbacks are paid out daily in WMON</li>
              <li>Fee tiers are updated in real-time based on your trading activity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeScheduleModal;
