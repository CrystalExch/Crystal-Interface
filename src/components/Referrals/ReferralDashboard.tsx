import React, { useState } from 'react';
import { Share2, TrendingUp, Users, Zap, Gem } from 'lucide-react';
import EnterCode from './EnterACode';
import ReferralCharts from './ReferralCharts';
import ReferralTier from './ReferralTier';
import ReferralResources from './ReferralResources';
import FeeTier from './FeeTier';
import FeeScheduleModal from './FeeScheduleModal';
import Leaderboard from './Leaderboard';
import customRound from '../../utils/customRound';
import ReferralBackground from '../../assets/referrals_bg.png';
import defaultPfp from '../../assets/leaderboard_default.png';

// TODO: Get activechain from context or props
const activechain = 10143; // Monad testnet - temporary hardcoded value

interface ReferralDashboardProps {
  tokenList: any;
  address: `0x${string}` | undefined;
  usedRefLink: string;
  totalClaimableFees: number;
  claimableFees: { [key: string]: number };
  refLink: string;
  setShowModal: (v: boolean) => void;
  account: any;
  referredCount: number;
  commissionBonus: number;
  displayName: string;
  client: any;
  isLoading: boolean;
  bgLoaded: boolean;
  setBgLoaded: (v: boolean) => void;
  copySuccess: boolean;
  handleCopy: () => void;
  handleClaimFees: () => void;
  handleSetRef: (code: string) => void;
  typedRefCode: string;
  setTypedRefCode: (v: string) => void;
  isSigning: boolean;
}

const ReferralDashboard: React.FC<ReferralDashboardProps> = ({
  tokenList,
  address,
  usedRefLink,
  totalClaimableFees,
  claimableFees,
  refLink,
  setShowModal,
  account,
  referredCount,
  commissionBonus,
  displayName,
  client,
  isLoading,
  bgLoaded,
  setBgLoaded,
  copySuccess,
  handleCopy,
  handleClaimFees,
  handleSetRef,
  typedRefCode,
  setTypedRefCode,
  isSigning,
}) => {
  const [showFeeSchedule, setShowFeeSchedule] = useState(false);
  const [activeTab, setActiveTab] = useState<'rewards' | 'leaderboard'>('rewards');

  // TODO: Get actual trading volume from backend/blockchain
  const tradingVolume = 0; // Default: $0, starts at 0 until manually tracked

  return (
    <div className="referral-scroll-wrapper">
      <div className="referral-content">
        {/* Navigation Tabs */}
        <div className="referral-nav-tabs">
          <button
            className={`referral-nav-tab ${activeTab === 'rewards' ? 'active' : ''}`}
            onClick={() => setActiveTab('rewards')}
          >
            Rewards
          </button>
          <button
            className={`referral-nav-tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </button>
        </div>

        <div className="referral-header">
          <div className="referred-count">
            <img src={defaultPfp} className="referral-pfp" />
            <div className="referral-user-right-side">
              {isLoading ? (
                <>
                  <div className="referrals-skeleton referrals-username-skeleton"></div>
                  <div className="referrals-skeleton referrals-multiplier-skeleton"></div>
                </>
              ) : (
                <>
                  <span className="referral-username">{displayName}</span>
                  <div className="user-points-subtitle">
                    {client && usedRefLink
                      ? 1.375
                      : client
                      ? 1.25
                      : usedRefLink
                      ? 1.1
                      : 1}
                    x Point Multiplier
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Conditional rendering based on active tab */}
        {activeTab === 'leaderboard' ? (
          <Leaderboard
            address={address}
            displayName={displayName}
            isLoading={isLoading}
          />
        ) : (
        <div className="referral-body-section">
          <div className="referral-top-section">
            <div className="referral-background-wrapper">
              <div className="main-title-container">
                <h1 className="main-title">Earn Rewards</h1>
                <h1 className="referrals-subtitle">Share & Earn with Friends</h1>
              </div>
              <div className="referral-background-container">
                <div className="referral-bg-placeholder">
                  <img
                    src={ReferralBackground}
                    className="referral-background"
                    onLoad={() => setBgLoaded(true)}
                    style={{ display: bgLoaded ? 'block' : 'none' }}
                  />
                  {!bgLoaded && (
                    <div className="referral-bg-placeholder-content"></div>
                  )}
                </div>
                <span className="referral-loader"></span>
                <div className="features-grid">
                  <div className="feature-card-left">
                    <div className="feature-icon">
                      <Users size={20} />
                    </div>
                    <h3 className="feature-title">Community Rewards</h3>
                    <p className="feature-description">
                      Earn together with your referrals
                    </p>
                  </div>
                  <div className="feature-card-middle">
                    <div className="feature-icon">
                      <Zap size={20} />
                    </div>
                    <h3 className="feature-title">Instant Tracking</h3>
                    <p className="feature-description">
                      Real-time referral updates
                    </p>
                  </div>
                  <div className="feature-card-right">
                    <div className="feature-icon">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className="feature-title">Tier Benefits</h3>
                    <p className="feature-description">
                      Unlock exclusive rewards
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="earnings-section">
              <div className="earnings-dashboard">
                <h2 className="earnings-title">Earnings Dashboard</h2>
                <p className="earnings-subtitle">Track your referral earnings</p>
              </div>
              <div className="total-earnings-box">
                <div className="total-earnings-header">
                  <span className="total-earnings-label">Total Claimable</span>
                </div>
                <div className="total-earnings-amount">
                  $0.00
                </div>
              </div>
              <div className="token-breakdown">
                {Object.entries(claimableFees).map(([token, value]) => (
                  <div key={token} className="token-item">
                    <div className="token-info">
                      <div className="token-logo">
                        <img
                          className="referral-token-image"
                          src={
                            tokenList.find((t: any) => t.ticker === token)
                              ?.image || ''
                          }
                        />
                      </div>
                      <div className="referrals-token-details">
                        <span className="token-symbol">{token}</span>
                        <span className="token-label">Available to Claim</span>
                      </div>
                    </div>
                    <div className="token-amount">
                      <div className="token-value">
                        0.00
                      </div>
                      <div className="token-currency">{token}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="claim-button"
                onClick={handleClaimFees}
                disabled={true}
              >
                Nothing to Claim
              </button>
              <div className="help-text">
                Claim your referral earnings from trading fees
              </div>
            </div>
          </div>

          <div className="referral-grid">
            <div className="left-column">
              <div className="refer-section">
                <div className="refer-header">
                  <div className="refer-header-content">
                    <h2 className="earnings-title">Share & Earn</h2>
                    <p className="earnings-subtitle">
                      Invite friends and earn rewards
                    </p>
                  </div>
                  <button
                    className="action-button"
                    onClick={() => setShowModal(true)}
                  >
                    {refLink ? 'Customize' : 'Create'}
                  </button>
                </div>

                <div className="referral-link-box">
                  {refLink ? (
                    <>
                      <span className="link-text">
                        <span className="link-base">
                          https://app.crystal.exchange?ref=
                        </span>
                        <span className="link-url">{refLink}</span>
                      </span>
                      <div className="link-actions">
                        <div className="ref-icon-container" onClick={handleCopy}>
                          <svg
                            className={`ref-copy-icon ${
                              copySuccess ? 'hidden' : ''
                            }`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#aaaecf"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="9"
                              y="9"
                              width="13"
                              height="13"
                              rx="2"
                              ry="2"
                            />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <svg
                            className={`ref-check-icon ${
                              copySuccess ? 'visible' : ''
                            }`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#aaaecf"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 12l3 3 6-6" />
                          </svg>
                        </div>
                        <div
                          className="share-button"
                          onClick={() => {
                            const tweetText =
                              "Join me on @CrystalExch, the EVM's first fully on-chain orderbook exchange, now live on @monad_xyz.\n\nUse my referral link for a 25% discount on all fees:\n\n";
                            const url = `https://app.crystal.exchange?ref=${refLink}`;
                            window.open(
                              `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                tweetText
                              )}&url=${encodeURIComponent(url)}`,
                              '_blank'
                            );
                          }}
                        >
                          <Share2 size={13} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <span className="link-text">
                      No referral link created yet
                    </span>
                  )}
                </div>
              </div>
              <div className="enter-code-container">
                <EnterCode
                  usedRefLink={usedRefLink}
                  setUsedRefLink={handleSetRef}
                  refLink={refLink}
                  inputValue={typedRefCode}
                  setInputValue={setTypedRefCode}
                />
              </div>
            </div>
          </div>

          {/* Performance Charts */}
          <ReferralCharts
            referredCount={referredCount}
            commissionBonus={commissionBonus}
            totalClaimableFees={totalClaimableFees}
          />

          {/* Tier System */}
          <ReferralTier commissionBonus={commissionBonus} />

          {/* Fee Tier System */}
          <FeeTier
            tradingVolume={tradingVolume}
            onViewFeeSchedule={() => setShowFeeSchedule(true)}
          />

          {/* Marketing Resources */}
          <ReferralResources />

          {/* Fee Schedule Modal */}
          <FeeScheduleModal
            isOpen={showFeeSchedule}
            onClose={() => setShowFeeSchedule(false)}
          />
        </div>
        )}
      </div>
    </div>
  );
};

export default ReferralDashboard;
