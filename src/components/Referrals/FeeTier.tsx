import React, { useState } from 'react';
import { TrendingDown, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import './FeeTier.css';

interface FeeTierProps {
  tradingVolume: number; // 14-day trading volume in USD
  commissionBonus: number; // Crystals from referrals
  onViewFeeSchedule: () => void;
}

interface TierInfo {
  name: string;
  tier: number;
  color: string;
  gradient: string;
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

const FeeTier: React.FC<FeeTierProps> = ({ tradingVolume, commissionBonus, onViewFeeSchedule }) => {
  const [testTierLevel, setTestTierLevel] = useState<number | null>(null);
  const getTierInfo = (volume: number): TierInfo => {
    if (volume >= 1000000) {
      return {
        name: 'Diamond',
        tier: 4,
        color: '#B9F2FF',
        gradient: 'linear-gradient(135deg, #B9F2FF 0%, #7DD3FC 100%)',
        takerFee: '0.030%',
        makerFee: '0.000%',
        minVolume: 1000000,
        next: null,
      };
    }
    if (volume >= 500000) {
      return {
        name: 'Gold',
        tier: 3,
        color: '#FFD700',
        gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        takerFee: '0.035%',
        makerFee: '0.005%',
        minVolume: 500000,
        next: {
          name: 'Diamond',
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
        gradient: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
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
      gradient: 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)',
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

  const getTierByLevel = (level: number): TierInfo => {
    const volumes = [0, 0, 100000, 500000, 1000000];
    return getTierInfo(volumes[level]);
  };

  const tier = testTierLevel !== null ? getTierByLevel(testTierLevel) : getTierInfo(tradingVolume);
  const progressPercentage = tier.next
    ? ((tradingVolume - tier.minVolume) /
        (tier.next.minVolume - tier.minVolume)) *
      100
    : 100;

  const handlePrevTier = () => {
    if (testTierLevel === null) {
      setTestTierLevel(tier.tier - 1 < 1 ? 1 : tier.tier - 1);
    } else {
      setTestTierLevel(testTierLevel - 1 < 1 ? 1 : testTierLevel - 1);
    }
  };

  const handleNextTier = () => {
    if (testTierLevel === null) {
      setTestTierLevel(tier.tier + 1 > 4 ? 4 : tier.tier + 1);
    } else {
      setTestTierLevel(testTierLevel + 1 > 4 ? 4 : testTierLevel + 1);
    }
  };

  const formatVolume = (vol: number): string => {
    if (vol >= 1000000) {
      const formatted = (vol / 1000000).toFixed(2);
      return `${parseFloat(formatted)}M MON`;
    }
    if (vol >= 1000) {
      const formatted = (vol / 1000).toFixed(1);
      return `${parseFloat(formatted)}K MON`;
    }
    return `${vol.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} MON`;
  };

  return (
    <>
      <div className="fee-tier-section">
        <div className="fee-tier-header">
          <div className="fee-tier-header-left">
            <h3 className="referrals-fee-tier-title">Your Fee Tier</h3>
            <div className="fee-tier-badge-wrapper">
              <button className="tier-nav-button" onClick={handlePrevTier}>
                <ChevronLeft size={14} />
              </button>
              <div className="fee-tier-badge" style={{ background: tier.gradient }}>
                <TrendingDown size={16} />
                <span className="fee-tier-badge-name">{tier.name}</span>
              </div>
              <button className="tier-nav-button" onClick={handleNextTier}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <button className="view-schedule-button" onClick={onViewFeeSchedule}>
            <Info size={14} />
            Fee Schedule
          </button>
        </div>
        {tier.next && (
          <div className="fee-tier-next-info">
            <span className="fee-tier-next-label">Next Tier:</span>
            <span className={`fee-tier-next-name tier-${tier.next.name.toLowerCase().replace(' ', '-')}`}>{tier.next.name}</span>
          </div>
        )}

      {tier.next && (
        <div className="fee-tier-progress">
          <div className="fee-tier-progress-bar-wrapper">
            <button className="tier-nav-button" onClick={handlePrevTier}>
              <ChevronLeft size={14} />
            </button>
            <div className="fee-tier-progress-bar">
              <div
                className="fee-tier-progress-fill"
                style={{
                  width: `${progressPercentage}%`,
                  background: tier.gradient,
                }}
              />
            </div>
            <button className="tier-nav-button" onClick={handleNextTier}>
              <ChevronRight size={14} />
            </button>
          </div>
          <p className="fee-tier-progress-text">
            {formatVolume(tradingVolume)} / {formatVolume(tier.next.minVolume)}
          </p>
        </div>
      )}

      {tier.next === null && (
        <>
          <div className="fee-tier-progress">
            <p className="fee-tier-progress-text">
              Trading Volume: {formatVolume(tradingVolume)}
            </p>
          </div>
          <div className="fee-tier-max-message">
            <p className="fee-tier-max-text">
              You've reached the highest fee tier! Enjoy maximum benefits.
            </p>
          </div>
        </>
      )}

      <div className="fee-tier-benefits">
        <div className="fee-tier-benefit-card">
          <span className="fee-tier-benefit-label">Cashback Commissions</span>
          <span className="fee-tier-benefit-value" style={{ color: tier.color }}>
            {commissionBonus}
          </span>
          <span className="fee-tier-benefit-description">
            crystals earned
          </span>
        </div>
        <div className="fee-tier-benefit-card">
          <span className="fee-tier-benefit-label">Referral Commissions</span>
          <span className="fee-tier-benefit-value" style={{ color: tier.color }}>
            10%
          </span>
          <span className="fee-tier-benefit-description">
            of referral fees
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
            <div className="tier-requirement-badge bronze">Bronze</div>
            <div className="fee-tier-requirement-details">
              <span className="fee-tier-requirement-volume">0+ MON volume</span>
              <span className="fee-tier-requirement-benefits">
                0.00% Cashback • 0.02% Referral Fees
              </span>
            </div>
          </div>
          <div
            className={`fee-tier-requirement-item ${
              tradingVolume >= 100000 ? 'achieved' : ''
            }`}
          >
            <div className="tier-requirement-badge silver">Silver</div>
            <div className="fee-tier-requirement-details">
              <span className="fee-tier-requirement-volume">100K+ MON volume</span>
              <span className="fee-tier-requirement-benefits">
                30% L1 • 3% L2 • 2% L3
              </span>
            </div>
          </div>
          <div
            className={`fee-tier-requirement-item ${
              tradingVolume >= 500000 ? 'achieved' : ''
            }`}
          >
            <div className="tier-requirement-badge gold">Gold</div>
            <div className="fee-tier-requirement-details">
              <span className="fee-tier-requirement-volume">500K+ MON volume</span>
              <span className="fee-tier-requirement-benefits">
                30% L1 • 3% L2 • 2% L3
              </span>
            </div>
          </div>
          <div
            className={`fee-tier-requirement-item ${
              tradingVolume >= 1000000 ? 'achieved' : ''
            }`}
          >
            <div className="tier-requirement-badge diamond">Diamond</div>
            <div className="fee-tier-requirement-details">
              <span className="fee-tier-requirement-volume">1M+ MON volume</span>
              <span className="fee-tier-requirement-benefits">
                30% L1 • 3% L2 • 2% L3
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default FeeTier;
