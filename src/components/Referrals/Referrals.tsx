import { readContracts, writeContract } from '@wagmi/core';
import { Share2, TrendingUp, Users, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { config } from '../../wagmi';

import CustomLinkModal from './CustomLinkModal';
import EnterCode from './EnterACode';
import FeatureModal from './FeatureModal';
import ReferralStatsBar from './ReferralStatsBar';

import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi';
import { settings } from '../../config';
import customRound from '../../utils/customRound';

import ReferralBackground from '../../assets/referral_background.png';
import ReferralMobileBackground from '../../assets/referral_mobile_background.png';

import './Referrals.css';

interface ReferralProps {
  tokenList: any;
  markets: { [key: string]: any };
  router: `0x${string}`;
  address: `0x${string}` | undefined;
  usedRefLink: string;
  setUsedRefLink: any;
  setUsedRefAddress: React.Dispatch<React.SetStateAction<string>>;
  totalClaimableFees: number;
  claimableFees: { [key: string]: number };
  refLink: string;
  setRefLink: any;
  showModal: boolean;
  setShowModal: any;
  switchChain: any;
  setpopup: any;
  account: any;
  refetch: any;
}

const Referrals: React.FC<ReferralProps> = ({
  tokenList,
  markets,
  router,
  address,
  usedRefLink,
  setUsedRefLink,
  setUsedRefAddress,
  totalClaimableFees,
  claimableFees,
  refLink,
  setRefLink,
  showModal,
  setShowModal,
  switchChain,
  setpopup,
  account,
  refetch,
}) => {
  const [bgLoaded, setBgLoaded] = useState(false);
  const [refLinkString, setRefLinkString] = useState(refLink);
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState<
    number | null
  >(null);
  const [error, setError] = useState('');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 700;
  const featureData = [
    {
      icon: <Users size={20} />,
      iconClass: 'blue',
      title: t('communityRewards'),
      description: t('communityRewardsText'),
    },
    {
      icon: <Zap size={20} />,
      iconClass: 'purple',
      title: t('instantTracking'),
      description: t('instantTrackingText'),
    },
    {
      icon: <TrendingUp size={20} />,
      iconClass: 'green',
      title: t('tierBenefits'),
      description: t('tierBenefitsText'),
    },
  ];
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `https://app.crystal.exchange/swap?ref=${refLink}`,
    );
    setCopySuccess(true);
    setTimeout(() => {
      setCopySuccess(false);
    }, 3000);
  };

  useEffect(() => {
    (async () => {
      const refs = (await readContracts(config, {
        contracts: [
          {
            abi: CrystalRouterAbi,
            address: router,
            functionName: 'addressToRef',
            args: [address ?? '0x0000000000000000000000000000000000000000'],
          },
          {
            abi: CrystalRouterAbi,
            address: router,
            functionName: 'refToAddress',
            args: [usedRefLink.toLowerCase()],
          },
          {
            abi: CrystalRouterAbi,
            address: router,
            functionName: 'refToAddress',
            args: [refLinkString.toLowerCase()],
          },
        ],
      })) as any[];
      setRefLink(refs[0].result);
      setUsedRefAddress(
        refs[1].result || '0x0000000000000000000000000000000000000000',
      );
      setError(
        refs[2].result === '0x0000000000000000000000000000000000000000' ||
          refs[2].result == address
          ? error
          : t('codeTaken'),
      );
    })();
  }, [usedRefLink, address, refLinkString]);

  const handleCreateRef = async () => {
    try {
      await writeContract(config, {
        abi: CrystalRouterAbi,
        address: router,
        functionName: 'setReferral',
        args: [refLinkString],
      });
      setRefLink(refLinkString);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleClaimFees = async () => {
    if (account.status === 'connected' && account.chainId === activechain) {
      await writeContract(config, {
        abi: CrystalRouterAbi,
        address: router,
        functionName: 'claimFees',
        args: [
          Object.values(markets).map(
            (market) => market.address as `0x${string}`,
          ),
        ],
      });
      setTimeout(()=>refetch(), 500)
    } else {
      account.status !== 'connected'
        ? setpopup(4)
        : switchChain(config, { chainId: activechain });
    }
  };

  return (
    <div className="referral-scroll-wrapper">
      <div className="referral-content">
        <div className="referral-background-wrapper">
          <div className="main-title-container">
            <h1 className="main-title">{t('claimTitle')}</h1>
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
              <img
                src={ReferralMobileBackground}
                className="referral-mobile-background"
              />
            </div>
            <ReferralStatsBar
              tokenList={tokenList}
              claimableFees={claimableFees}
              totalClaimableFees={totalClaimableFees}
            />
          </div>
        </div>
        <div className="referral-grid">
          <div className="left-column">
            <div className="refer-section">
              <div className="refer-header">
                <h2 className="earnings-title">{t('shareEarn')}</h2>
                <button
                  className="action-button"
                  onClick={() => setShowModal(true)}
                >
                  {refLink ? t('customize') : t('create')}
                </button>
              </div>
              <div className="referral-link-box">
                {refLink ? (
                  <>
                    <span className="link-text">
                      <span className="link-base">
                        https://app.crystal.exchange/swap?ref=
                      </span>
                      <span className="link-url">{refLink}</span>
                    </span>
                    <div className="link-actions">
                      <div className="ref-icon-container" onClick={handleCopy}>
                        <svg
                          className={`ref-copy-icon ${copySuccess ? 'hidden' : ''}`}
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
                          className={`ref-check-icon ${copySuccess ? 'visible' : ''}`}
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
                        className="action-button"
                        onClick={() => {
                          const tweetText = 'Trade on Crystal Exchange! 🚀\n\n';
                          const url = `https://app.crystal.exchange/swap?ref=${refLink}`;
                          window.open(
                            `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`,
                            '_blank',
                          );
                        }}
                      >
                        <Share2 size={13} />
                      </div>
                    </div>
                  </>
                ) : (
                  <span className="link-text">{t('noLink')}</span>
                )}
              </div>
              <div className="features-grid">
                {featureData.map((feature, idx) => (
                  <div
                    className="feature-card"
                    key={idx}
                    onClick={() => {
                      if (isMobile) setSelectedFeatureIndex(idx);
                    }}
                  >
                    <div className={`feature-icon ${feature.iconClass}`}>
                      {feature.icon}
                    </div>
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-description">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <EnterCode
              usedRefLink={usedRefLink}
              setUsedRefLink={setUsedRefLink}
              refLink={refLink}
            />
          </div>
          <div className="earnings-section">
            <div className="earnings-dashboard">
              <h2 className="earnings-title">{t('earningsDashboard')}</h2>
              <p className="earnings-subtitle">{t('earningsSubtitle')}</p>
            </div>
            <div className="total-earnings-box">
              <div className="total-earnings-header">
                <span className="total-earnings-label">
                  {t('totalClaimable')}
                </span>
              </div>
              <div className="total-earnings-amount">
                $
                {totalClaimableFees
                  ? customRound(totalClaimableFees, 3)
                  : '0.00'}
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
                      <span className="token-label">
                        {t('availableToClaim')}
                      </span>
                    </div>
                  </div>
                  <div className="token-amount">
                    <div className="token-value">
                      {value ? customRound(value as number, 3) : '0.00'}
                    </div>
                    <div className="token-currency">{token}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="claim-button"
              onClick={handleClaimFees}
              disabled={
                totalClaimableFees === 0 ||
                (account.status === 'connected' &&
                  account.chainId !== activechain)
              }
            >
              {account.status === 'connected' && account.chainId === activechain
                ? totalClaimableFees === 0
                  ? t('nothingtoclaim')
                  : t('claimfees')
                : account.status === 'connected'
                  ? `${t('switchto')} ${t(settings.chainConfig[activechain].name)}`
                  : t('connectWallet')}
            </button>
            <div className="help-text">{t('referralsHelp')}</div>
          </div>
        </div>
        <CustomLinkModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          refLinkString={refLinkString}
          setRefLinkString={setRefLinkString}
          onCreateRef={handleCreateRef}
          refLink={refLink}
          setpopup={setpopup}
          switchChain={switchChain}
          setError={setError}
          error={error}
        />
        {selectedFeatureIndex !== null && (
          <FeatureModal
            feature={featureData[selectedFeatureIndex]}
            onClose={() => setSelectedFeatureIndex(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Referrals;
