import React, { useState, useEffect } from 'react';
import { TrendingDown, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import monadicon from '../../assets/monadlogo.svg';
import './FeeTier.css';

interface FeeTierProps {
  tradingVolume: number;
  commissionBonus: number;
  onViewFeeSchedule: () => void;
  tokenList: any[];
  monUsdPrice: any;
}

interface TierInfo {
  name: string;
  tier: number;
  color: string;
  gradient: string;
  takerFee: string;
  makerFee: string;
  cashback: string;
  referralCommission: string;
  minVolume: number;
  next: {
    name: string;
    tier: number;
    needed: number;
    minVolume: number;
  } | null;
}

const FeeTier: React.FC<FeeTierProps> = ({ tradingVolume, commissionBonus, onViewFeeSchedule, tokenList, monUsdPrice }) => {
  const [testTierLevel, setTestTierLevel] = useState<number | null>(null);
  const [showUSD, setShowUSD] = useState<boolean>(true);
  const getTierInfo = (volume: number): TierInfo => {
    if (volume >= 1000000) {
      return {
        name: 'Diamond',
        tier: 4,
        color: '#aaaecf',
        gradient: 'linear-gradient(135deg, #aaaecf 0%, #7f82a1 100%)',
        takerFee: '0.030%',
        makerFee: '0.000%',
        cashback: '30%',
        referralCommission: '40%',
        minVolume: 1000000,
        next: null,
      };
    }
    if (volume >= 500000) {
      return {
        name: 'Gold',
        tier: 3,
        color: '#FFD700',
        gradient: 'linear-gradient(135deg, #F5D576 0%, #CC8400 100%)',
        takerFee: '0.035%',
        makerFee: '0.005%',
        cashback: '15%',
        referralCommission: '30%',
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
        gradient: 'linear-gradient(135deg, #D4D4D4 0%, #7A7A7A 100%)',
        takerFee: '0.040%',
        makerFee: '0.010%',
        cashback: '6%',
        referralCommission: '20%',
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
      color: 'rgb(169 133 98)',
      gradient: 'linear-gradient(135deg, #D4915A 0%, #8B5A1E 100%)',
      takerFee: '0.050%',
      makerFee: '0.020%',
      cashback: '3%',
      referralCommission: '10%',
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

  const formatMONVolume = (volUSD: number): string => {
    const volMON = volUSD / monUsdPrice;
    if (volMON >= 1000000) {
      const formatted = (volMON / 1000000).toFixed(2);
      return `${formatted}M`;
    }
    if (volMON >= 1000) {
      const formatted = (volMON / 1000).toFixed(2);
      return `${formatted}K`;
    }
    return `${Math.floor(volMON).toLocaleString()}`;
  };

  const formatUSDVolume = (volUSD: number): string => {
    if (volUSD >= 1000000) {
      const formatted = (volUSD / 1000000).toFixed(2);
      return `$${formatted}M`;
    }
    if (volUSD >= 1000) {
      const formatted = (volUSD / 1000).toFixed(2);
      return `$${formatted}K`;
    }
    return `$${Math.floor(volUSD).toLocaleString()}`;
  };

  const formatDisplay = (volUSD: number): React.ReactNode => {
    if (showUSD) {
      return formatUSDVolume(volUSD);
    } else {
      return (
        <>
          <img src={monadicon} className="fee-tier-mon-icon" alt="MON" />
          {formatMONVolume(volUSD)}
        </>
      );
    }
  };

  const toggleDisplay = () => {
    setShowUSD(!showUSD);
  };

  const getTierGradient = (tierName: string): string => {
    switch (tierName) {
      case 'Bronze':
        return 'linear-gradient(180deg, rgba(169, 133, 98, 0.25) 0%, rgba(6, 6, 6, 1) 100%)';
      case 'Silver':
        return 'linear-gradient(180deg, rgba(212, 212, 212, 0.25) 0%, rgba(6, 6, 6, 1) 100%)';
      case 'Gold':
        return 'linear-gradient(180deg, rgba(245, 213, 118, 0.25) 0%, rgba(6, 6, 6, 1) 100%)';
      case 'Diamond':
        return 'linear-gradient(180deg, rgba(170, 174, 207, 0.25) 0%, rgba(6, 6, 6, 1) 100%)';
      default:
        return 'rgb(6, 6, 6)';
    }
  };

  return (
    <>
      <div 
        className="fee-tier-section"
        style={{ background: getTierGradient(tier.name) }}
      >
        <div className="fee-tier-header">
          <div className="fee-tier-header-left">
            <h3 className="referrals-fee-tier-title">Fee Tier:</h3>
            <div className="fee-tier-badge" style={{ color: tier.color }}>
              {tier.name}
            </div>
          </div>
          <button className="view-schedule-button" onClick={onViewFeeSchedule}>
            <Info size={14} />
            Fee Schedule
          </button>
        </div>
        {tier.next && (
          <div className="fee-tier-next-info">

            <div className="fee-tier-benefits">
              <div className="fee-tier-benefit-card">
                <span className="fee-tier-benefit-label">Cashback</span>
                <span className="fee-tier-benefit-value">
                  {tier.cashback}
                </span>
              </div>
              <div className="fee-tier-benefit-card">
                <span className="fee-tier-benefit-label">Referral Commission</span>
                <span className="fee-tier-benefit-value">
                  {tier.referralCommission}
                </span>
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
           <p className="fee-tier-progress-text" onClick={toggleDisplay}>
              {formatDisplay(tradingVolume)} / {formatDisplay(tier.next.minVolume)}
            </p>
              <span className="fee-tier-next-label">Next Tier:</span>
              <span className={`fee-tier-next-name tier-${tier.next.name.toLowerCase().replace(' ', '-')}`}>{tier.next.name}</span>
            </div>
          </div>
        )}

        {tier.next && (
          <div className="fee-tier-progress">
            <div className="fee-tier-progress-bar">
              <div
                className="fee-tier-progress-fill"
                style={{
                  width: `${progressPercentage}%`,
                  background: '#d8dcff',
                }}
              />
            </div>
          </div>
        )}

        {tier.next === null && (
          <>
            <div className="fee-tier-progress">
              <p className="fee-tier-progress-text" onClick={toggleDisplay}>
                Trading Volume: {formatDisplay(tradingVolume)}
              </p>
            </div>
            <div className="fee-tier-max-message">
              <p className="fee-tier-max-text">
                You've reached the highest fee tier! Enjoy maximum benefits.
              </p>
            </div>
          </>
        )}

      </div>
    </>
  );
};

export default FeeTier;