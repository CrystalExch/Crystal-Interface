import React from 'react';
import { TrendingDown, Info } from 'lucide-react';
import './FeeTier.css';

interface FeeTierProps {
  tradingVolume: number; // 14-day trading volume in USD
  onViewFeeSchedule: () => void;
}

interface TierInfo {
  name: string;
  tier: number;
  color: string;
  takerFee: string;
  makerFee: string;
  minVolume: number;
  next: {
    name: string;
    tier: number;
    needed: number;
    minVolume: number;
  } | null;
}

const FeeTier: React.FC<FeeTierProps> = ({ tradingVolume, onViewFeeSchedule }) => {
  const getTierInfo = (volume: number): TierInfo => {
    if (volume >= 10000000) {
      return {
        name: 'VIP',
        tier: 6,
        color: '#FFD700',
        takerFee: '0.020%',
        makerFee: '-0.005%',
        minVolume: 10000000,
        next: null,
      };
    }
    if (volume >= 5000000) {
      return {
        name: 'Diamond',
        tier: 5,
        color: '#B9F2FF',
        takerFee: '0.025%',
        makerFee: '-0.003%',
        minVolume: 5000000,
        next: {
          name: 'VIP',
          tier: 6,
          needed: 10000000 - volume,
          minVolume: 10000000,
        },
      };
    }
    if (volume >= 1000000) {
      return {
        name: 'Platinum',
        tier: 4,
        color: '#E5E4E2',
        takerFee: '0.030%',
        makerFee: '0.000%',
        minVolume: 1000000,
        next: {
          name: 'Diamond',
          tier: 5,
          needed: 5000000 - volume,
          minVolume: 5000000,
        },
      };
    }
    if (volume >= 500000) {
      return {
        name: 'Gold',
        tier: 3,
        color: '#FFD700',
        takerFee: '0.035%',
        makerFee: '0.005%',
        minVolume: 500000,
        next: {
          name: 'Platinum',
          tier: 4,
          needed: 1000000 - volume,
          minVolume: 1000000,
        },
      };
    }
    if (volume >= 100000) {
      return {
        name: 'Silver',
        tier: 2,
        color: '#C0C0C0',
        takerFee: '0.040%',
        makerFee: '0.010%',
        minVolume: 100000,
        next: {
          name: 'Gold',
          tier: 3,
          needed: 500000 - volume,
          minVolume: 500000,
        },
      };
    }
    return {
      name: 'Bronze',
      tier: 1,
      color: '#CD7F32',
      takerFee: '0.050%',
      makerFee: '0.020%',
      minVolume: 0,
      next: {
        name: 'Silver',
        tier: 2,
        needed: 100000 - volume,
        minVolume: 100000,
      },
    };
  };

  const tier = getTierInfo(tradingVolume);
  const progressPercentage = tier.next
    ? ((tradingVolume - tier.minVolume) /
        (tier.next.minVolume - tier.minVolume)) *
      100
    : 100;

  const formatVolume = (vol: number): string => {
    if (vol >= 1000000) {
      return `$${(vol / 1000000).toFixed(2)}M`;
    }
    if (vol >= 1000) {
      return `$${(vol / 1000).toFixed(0)}K`;
    }
    return `$${vol.toFixed(0)}`;
  };

  return (
    <div className="fee-tier-section">
      <div className="fee-tier-header">
        <div className="fee-tier-header-left">
          <h3 className="referrals-fee-tier-title">Your Fee Tier</h3>
          <div className="fee-tier-badge" style={{ backgroundColor: tier.color }}>
            <TrendingDown size={16} />
            <span className="fee-tier-badge-name">Tier {tier.tier}</span>
          </div>
        </div>
        {tier.next && (
          <div className="fee-tier-next-info">
            <span className="fee-tier-next-label">Next Tier:</span>
            <span className="fee-tier-next-name">Tier {tier.next.tier}</span>
          </div>
        )}
      </div>

      <button className="view-schedule-button" onClick={onViewFeeSchedule}>
        <Info size={14} />
        View Full Fee Schedule
      </button>

      {tier.next && (
        <div className="fee-tier-progress">
          <div className="fee-tier-progress-bar">
            <div
              className="fee-tier-progress-fill"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: tier.color,
              }}
            />
          </div>
          <p className="fee-tier-progress-text">
            {formatVolume(tradingVolume)} / {formatVolume(tier.next.minVolume)}
          </p>
        </div>
      )}

      {tier.next === null && (
        <div className="fee-tier-max-message">
          <p className="fee-tier-max-text">
            You've reached the highest fee tier! Enjoy maximum benefits.
          </p>
        </div>
      )}

      <div className="fee-tier-benefits">
        <div className="fee-tier-benefit-card">
          <span className="fee-tier-benefit-label">Taker Fee</span>
          <span className="fee-tier-benefit-value" style={{ color: tier.color }}>
            {tier.takerFee}
          </span>
          <span className="fee-tier-benefit-description">
            on market orders
          </span>
        </div>
        <div className="fee-tier-benefit-card">
          <span className="fee-tier-benefit-label">Maker Fee</span>
          <span className="fee-tier-benefit-value" style={{ color: tier.color }}>
            {tier.makerFee}
          </span>
          <span className="fee-tier-benefit-description">
            {tier.makerFee.startsWith('-') ? 'rebate on limit orders' : 'on limit orders'}
          </span>
        </div>
        <div className="fee-tier-benefit-card">
          <span className="fee-tier-benefit-label">Savings vs Tier 1</span>
          <span className="fee-tier-benefit-value" style={{ color: tier.color }}>
            {tier.tier === 1 ? '0%' : `${((0.050 - parseFloat(tier.takerFee.replace('%', ''))) / 0.050 * 100).toFixed(0)}%`}
          </span>
          <span className="fee-tier-benefit-description">
            on taker fees
          </span>
        </div>
      </div>

      <div className="fee-tier-requirements">
        <h4 className="fee-tier-requirements-title">Tier Requirements</h4>
        <div className="fee-tier-requirements-list">
          <div
            className={`fee-tier-requirement-item ${
              tradingVolume >= 0 ? 'achieved' : ''
            }`}
          >
            <div className="fee-tier-requirement-badge tier-1">Tier 1</div>
            <div className="fee-tier-requirement-details">
              <span className="fee-tier-requirement-volume">$0+ volume</span>
              <span className="fee-tier-requirement-benefits">
                0.050% taker • 0.020% maker
              </span>
            </div>
          </div>
          <div
            className={`fee-tier-requirement-item ${
              tradingVolume >= 100000 ? 'achieved' : ''
            }`}
          >
            <div className="fee-tier-requirement-badge tier-2">Tier 2</div>
            <div className="fee-tier-requirement-details">
              <span className="fee-tier-requirement-volume">$100K+ volume</span>
              <span className="fee-tier-requirement-benefits">
                0.040% taker • 0.010% maker
              </span>
            </div>
          </div>
          <div
            className={`fee-tier-requirement-item ${
              tradingVolume >= 500000 ? 'achieved' : ''
            }`}
          >
            <div className="fee-tier-requirement-badge tier-3">Tier 3</div>
            <div className="fee-tier-requirement-details">
              <span className="fee-tier-requirement-volume">$500K+ volume</span>
              <span className="fee-tier-requirement-benefits">
                0.035% taker • 0.005% maker
              </span>
            </div>
          </div>
          <div
            className={`fee-tier-requirement-item ${
              tradingVolume >= 1000000 ? 'achieved' : ''
            }`}
          >
            <div className="fee-tier-requirement-badge tier-4">Tier 4</div>
            <div className="fee-tier-requirement-details">
              <span className="fee-tier-requirement-volume">$1M+ volume</span>
              <span className="fee-tier-requirement-benefits">
                0.030% taker • 0.000% maker
              </span>
            </div>
          </div>
          <div
            className={`fee-tier-requirement-item ${
              tradingVolume >= 5000000 ? 'achieved' : ''
            }`}
          >
            <div className="fee-tier-requirement-badge tier-5">Tier 5</div>
            <div className="fee-tier-requirement-details">
              <span className="fee-tier-requirement-volume">$5M+ volume</span>
              <span className="fee-tier-requirement-benefits">
                0.025% taker • -0.003% rebate
              </span>
            </div>
          </div>
          <div
            className={`fee-tier-requirement-item ${
              tradingVolume >= 10000000 ? 'achieved' : ''
            }`}
          >
            <div className="fee-tier-requirement-badge tier-6">Tier 6</div>
            <div className="fee-tier-requirement-details">
              <span className="fee-tier-requirement-volume">$10M+ volume</span>
              <span className="fee-tier-requirement-benefits">
                0.020% taker • -0.005% rebate
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeTier;
