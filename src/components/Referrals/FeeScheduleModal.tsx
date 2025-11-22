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
      tier: 1,
      volume: '$0+',
      perpsTaker: '0.050%',
      perpsMaker: '0.020%',
      spotTaker: '0.075%',
      spotMaker: '0.025%',
    },
    {
      tier: 2,
      volume: '$100K+',
      perpsTaker: '0.040%',
      perpsMaker: '0.010%',
      spotTaker: '0.060%',
      spotMaker: '0.015%',
    },
    {
      tier: 3,
      volume: '$500K+',
      perpsTaker: '0.035%',
      perpsMaker: '0.005%',
      spotTaker: '0.050%',
      spotMaker: '0.010%',
    },
    {
      tier: 4,
      volume: '$1M+',
      perpsTaker: '0.030%',
      perpsMaker: '0.000%',
      spotTaker: '0.040%',
      spotMaker: '0.005%',
    },
    {
      tier: 5,
      volume: '$5M+',
      perpsTaker: '0.025%',
      perpsMaker: '-0.003%',
      spotTaker: '0.030%',
      spotMaker: '0.000%',
    },
    {
      tier: 6,
      volume: '$10M+',
      perpsTaker: '0.020%',
      perpsMaker: '-0.005%',
      spotTaker: '0.025%',
      spotMaker: '-0.002%',
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

          {/* Main Fee Tiers Table */}
          <div className="fee-schedule-section">
            <h3 className="fee-schedule-section-title">Trading Fee Tiers</h3>
            <div className="fee-schedule-table-wrapper">
              <table className="fee-schedule-table">
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th>14D Volume</th>
                    <th>Perps Taker</th>
                    <th>Perps Maker</th>
                    <th>Spot Taker</th>
                    <th>Spot Maker</th>
                  </tr>
                </thead>
                <tbody>
                  {feeTiers.map((tier) => (
                    <tr key={tier.tier}>
                      <td className="tier-cell">
                        <span className={`tier-badge tier-${tier.tier}`}>
                          Tier {tier.tier}
                        </span>
                      </td>
                      <td className="volume-cell">{tier.volume}</td>
                      <td className="fee-cell">{tier.perpsTaker}</td>
                      <td className="fee-cell maker-fee">
                        {tier.perpsMaker}
                        {tier.perpsMaker.startsWith('-') && (
                          <span className="rebate-indicator">rebate</span>
                        )}
                      </td>
                      <td className="fee-cell">{tier.spotTaker}</td>
                      <td className="fee-cell maker-fee">
                        {tier.spotMaker}
                        {tier.spotMaker.startsWith('-') && (
                          <span className="rebate-indicator">rebate</span>
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
            <h3 className="fee-schedule-section-title">Maker Rebate Tiers</h3>
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

          {/* Staking Discount */}
          <div className="fee-schedule-section">
            <h3 className="fee-schedule-section-title">Staking Discount</h3>
            <div className="staking-discount-card">
              <div className="staking-discount-header">
                <div className="staking-discount-icon">🔒</div>
                <div className="staking-discount-content">
                  <h4 className="staking-discount-title">Stake CRYSTAL for Additional Fee Reduction</h4>
                  <p className="staking-discount-description">
                    Staking CRYSTAL tokens provides an additional 5-10% discount on all trading fees, stackable with your volume tier.
                  </p>
                </div>
              </div>
              <div className="staking-discount-tiers">
                <div className="staking-discount-item">
                  <span className="staking-amount">10,000 CRYSTAL</span>
                  <span className="staking-benefit">5% discount</span>
                </div>
                <div className="staking-discount-item">
                  <span className="staking-amount">50,000 CRYSTAL</span>
                  <span className="staking-benefit">7.5% discount</span>
                </div>
                <div className="staking-discount-item">
                  <span className="staking-amount">100,000+ CRYSTAL</span>
                  <span className="staking-benefit">10% discount</span>
                </div>
              </div>
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
