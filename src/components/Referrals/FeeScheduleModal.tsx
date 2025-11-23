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
      spotTaker: '0.050%',
      spotMaker: '0.020%',
    },
    {
      name: 'Silver',
      tier: 2,
      volume: '$100K+',
      spotTaker: '0.040%',
      spotMaker: '0.010%',
    },
    {
      name: 'Gold',
      tier: 3,
      volume: '$500K+',
      spotTaker: '0.035%',
      spotMaker: '0.005%',
    },
    {
      name: 'Diamond',
      tier: 4,
      volume: '$1M+',
      spotTaker: '0.030%',
      spotMaker: '0.000%',
    },
    {
      name: 'Netherite',
      tier: 5,
      volume: '$5M+',
      spotTaker: '0.025%',
      spotMaker: '-0.003%',
    },
    {
      name: 'Enchanted Netherite',
      tier: 6,
      volume: '$10M+',
      spotTaker: '0.020%',
      spotMaker: '-0.005%',
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
              Your fee tier is based on your 14-day trailing trading volume across all markets. Higher volume unlocks lower fees and maker rebates.
            </p>
          </div>

          {/* Referral Rewards System */}
          <div className="fee-schedule-section">
            <h3 className="fee-schedule-subsection-title">3-Tier Referral Commission System</h3>
            <p className="fee-schedule-subsection-description">
              Earn passive income from your referral network across 3 levels:
            </p>
            <div className="referral-tiers-grid">
              <div className="referral-tier-card">
                <div className="referral-tier-header">
                  <span className="referral-tier-badge level-1">Level 1</span>
                  <span className="referral-tier-percentage">30%</span>
                </div>
                <div className="referral-tier-title">Direct Referrals</div>
                <div className="referral-tier-description">
                  Earn 30% commission on fees from anyone who signs up using your referral link.
                </div>
                <div className="referral-tier-example">
                  Example: Referral trades $10,000 → You earn $30
                </div>
              </div>
              <div className="referral-tier-card">
                <div className="referral-tier-header">
                  <span className="referral-tier-badge level-2">Level 2</span>
                  <span className="referral-tier-percentage">3%</span>
                </div>
                <div className="referral-tier-title">Indirect Referrals</div>
                <div className="referral-tier-description">
                  Earn 3% commission on fees from users referred by your Level 1 referrals.
                </div>
                <div className="referral-tier-example">
                  Example: L2 referral trades $10,000 → You earn $3
                </div>
              </div>
              <div className="referral-tier-card">
                <div className="referral-tier-header">
                  <span className="referral-tier-badge level-3">Level 3</span>
                  <span className="referral-tier-percentage">2%</span>
                </div>
                <div className="referral-tier-title">Extended Network</div>
                <div className="referral-tier-description">
                  Earn 2% commission on fees from users referred by your Level 2 referrals.
                </div>
                <div className="referral-tier-example">
                  Example: L3 referral trades $10,000 → You earn $2
                </div>
              </div>
            </div>
            <div className="referral-benefits-note">
              <strong>Bonus:</strong> Users who sign up with a referral link receive a 10% discount on all trading fees!
            </div>
          </div>

          {/* Main Fee Tiers Table */}
          <div className="fee-schedule-section">
            <div className="fee-schedule-table-wrapper">
              <table className="fee-schedule-table">
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th>14D Volume</th>
                    <th>Taker</th>
                    <th>Maker</th>
                  </tr>
                </thead>
                <tbody>
                  {feeTiers.map((tier) => (
                    <tr key={tier.tier}>
                      <td className="modal-tier-cell">
                        <span className={`modal-tier-badge tier-${tier.tier}`}>
                          {tier.name}
                        </span>
                      </td>
                      <td className="modal-volume-cell">{tier.volume}</td>
                      <td className="modal-fee-cell">{tier.spotTaker}</td>
                      <td className="modal-fee-cell modal-maker-fee">
                        {tier.spotMaker}
                        {tier.spotMaker.startsWith('-') && (
                          <span className="modal-rebate-indicator">rebate</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Maker Rebate Tiers */}
          <div className="fee-schedule-section">
            <p className="fee-schedule-subsection-description">
              Based on your share of total platform volume over 14 days
            </p>
            <div className="rebate-tiers-grid">
              {makerRebateTiers.map((rebate) => (
                <div key={rebate.tier} className="rebate-tier-card">
                  <div className="rebate-tier-header">
                    <span className="rebate-tier-badge">{rebate.tier}</span>
                    <span className="rebate-tier-value">{rebate.rebate}</span>
                  </div>
                  <div className="rebate-tier-requirement">{rebate.volumeShare} of platform volume</div>
                  <div className="rebate-tier-description">{rebate.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="fee-schedule-notes">
            <h4 className="fee-schedule-notes-title">Notes</h4>
            <ul className="fee-schedule-notes-list">
              <li>Trading volume is calculated as a 14-day trailing sum across all markets</li>
              <li>Maker rebates are paid out daily in USDC</li>
              <li>Negative maker fees indicate you receive a rebate for providing liquidity</li>
              <li>Staking discounts are applied on top of volume-based tier discounts</li>
              <li>Fee tiers are updated in real-time based on your trading activity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeScheduleModal;
