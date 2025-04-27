import { readContracts } from '@wagmi/core';
import { Share2, TrendingUp, Users, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { encodeFunctionData } from 'viem';
import { config } from '../../wagmi';

import CustomLinkModal from './CustomLinkModal';
import EnterCode from './EnterACode';
import FeatureModal from './FeatureModal';
import ReferralStatsBar from './ReferralStatsBar';

import { CrystalReferralAbi } from '../../abis/CrystalReferralAbi';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi';
import { settings } from '../../settings.ts';
import customRound from '../../utils/customRound';

import ReferralMobileBackground from '../../assets/referral_mobile_background.png';
import ReferralBackground from '../../assets/referrals_bg.png';
import defaultPfp from '../../assets/leaderboard_default.png';

import './Referrals.css';

interface ReferralProps {
  tokenList: any;
  markets: { [key: string]: any };
  router: `0x${string}`;
  address: `0x${string}` | undefined;
  usedRefLink: string;
  setUsedRefLink: any;
  usedRefAddress: `0x${string}` | undefined;
  setUsedRefAddress: any;
  totalClaimableFees: number;
  claimableFees: { [key: string]: number };
  refLink: string;
  setRefLink: any;
  showModal: boolean;
  setShowModal: any;
  setChain: any;
  setpopup: any;
  account: any;
  refetch: any;
  sendUserOperationAsync: any;
  waitForTxReceipt: any;
}

const Referrals: React.FC<ReferralProps> = ({
  tokenList,
  markets,
  router,
  address,
  usedRefLink,
  setUsedRefLink,
  // usedRefAddress,
  setUsedRefAddress,
  totalClaimableFees,
  claimableFees,
  refLink,
  setRefLink,
  showModal,
  setShowModal,
  setChain,
  setpopup,
  account,
  refetch,
  sendUserOperationAsync,
  waitForTxReceipt,
}) => {
  const [bgLoaded, setBgLoaded] = useState(false);
  const [refLinkString, setRefLinkString] = useState(refLink);
  const [referredCount, setReferredCount] = useState(0);
  const [isSigning, setIsSigning] = useState(false);
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
  const [typedRefCode, setTypedRefCode] = useState<string>('');

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
            abi: CrystalReferralAbi,
            address: settings.chainConfig[activechain].referralManager,
            functionName: 'addressToRef',
            args: [address ?? '0x0000000000000000000000000000000000000000'],
          },
          {
            abi: CrystalReferralAbi,
            address: settings.chainConfig[activechain].referralManager,
            functionName: 'refToAddress',
            args: [refLinkString.toLowerCase()],
          },
          {
            abi: CrystalReferralAbi,
            address: settings.chainConfig[activechain].referralManager,
            functionName: 'referrerToReferredAddresses',
            args: [address ?? '0x0000000000000000000000000000000000000000'],
          },
          {
            abi: CrystalReferralAbi,
            address: settings.chainConfig[activechain].referralManager,
            functionName: 'addressToReferrer',
            args: [address ?? '0x0000000000000000000000000000000000000000'],
          },
        ],
      })) as any[];
      setRefLink(refs[0].result);
      setError(
        refs[1].result === '0x0000000000000000000000000000000000000000' ||
          refs[1].result == address
          ? error == t('codeTaken')
            ? ''
            : error
          : t('codeTaken'),
      );
      setReferredCount(Number(refs[2].result));
      setUsedRefAddress(
        refs[3].result || '0x0000000000000000000000000000000000000000',
      );
      const find = (await readContracts(config, {
        contracts: [
          {
            abi: CrystalReferralAbi,
            address: settings.chainConfig[activechain].referralManager,
            functionName: 'addressToRef',
            args: [
              refs[3].result ?? '0x0000000000000000000000000000000000000000',
            ],
          },
        ],
      })) as any[];
      setUsedRefLink(find[0].result);
    })();
  }, [address, refLinkString]);

  const handleCreateRef = async () => {
    try {
      const hash = await sendUserOperationAsync({
        uo: {
          target: settings.chainConfig[activechain].referralManager,
          data: encodeFunctionData({
            abi: CrystalReferralAbi,
            functionName: 'setReferral',
            args: [refLinkString],
          }),
          value: 0n,
        },
      });
      await waitForTxReceipt(hash.hash);
      setRefLink(refLinkString);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSetRef = async (used: string) => {
    if (used !== '') {
      const lookup = (await readContracts(config, {
        contracts: [
          {
            abi: CrystalReferralAbi,
            address: settings.chainConfig[activechain].referralManager,
            functionName: 'refToAddress',
            args: [used.toLowerCase()],
          },
        ],
      })) as any[];

      if (lookup[0].result === '0x0000000000000000000000000000000000000000') {
        setError(t('invalidRefCode'));
        return false;
      }
    }

    if (used === '') { // clear username
      try {
        const hash = await sendUserOperationAsync({
          uo: {
            target: settings.chainConfig[activechain].referralManager,
            data: encodeFunctionData({
              abi: CrystalReferralAbi,
              functionName: 'setUsedRef',
              args: [used],
            }),
            value: 0n,
          },
        });
        await waitForTxReceipt(hash.hash);
        setUsedRefLink('');
        return true;
      } catch {
        return false;
      }
    } else {
      try {
        const hash = await sendUserOperationAsync({
          uo: {
            target: settings.chainConfig[activechain].referralManager,
            data: encodeFunctionData({
              abi: CrystalReferralAbi,
              functionName: 'setUsedRef',
              args: [used],
            }),
            value: 0n,
          },
        });
        await waitForTxReceipt(hash.hash);
        setUsedRefLink(used);
        return true;
      } catch (error) {
        return false;
      }
    }
  };

  const handleClaimFees = async () => {
    if (account.connected && account.chainId === activechain) {
      try {
        setIsSigning(true);
        const hash = await sendUserOperationAsync({
          uo: {
            target: router,
            data: encodeFunctionData({
              abi: CrystalRouterAbi,
              functionName: 'claimFees',
              args: [
                Array.from(
                  new Set(
                    Object.values(markets).map(
                      (market) => market.address as `0x${string}`,
                    ),
                  ),
                ),
              ],
            }),
            value: 0n,
          },
        });
        await waitForTxReceipt(hash.hash);
        refetch();
      } catch (error) {
      } finally {
        setIsSigning(false);
      }
    } else {
      !account.connected ? setpopup(4) : setChain();
    }
  };

  return (
    <div className="referral-scroll-wrapper">
      <div className="referral-content">
        <div className="referral-header">
        <div className="referred-count">
         <img src={defaultPfp} className="referral-pfp" />
         <div className="referral-user-right-side">
          <span className="referral-username">{address}</span>
         <div className="user-points-subtitle">10% Point Rebates</div>
         </div>
        </div>
        <div className="total-referrals-container">
         <span className="referral-count-number">{referredCount}</span> <span>{t('totalReferredUsers')}</span>
        </div>
        <div className="total-crystals-earned-container">
        <span className="referral-count-number">{referredCount}</span> <span>{t('totalCrystalsEarned')}</span>
        </div>
        </div>
        <div className="referral-body-section">
          <div className="referral-top-section">
            <div className="referral-background-wrapper">
              <div className="main-title-container">
                <h1 className="main-title">{t('claimTitle')}</h1>
                <h1 className="referrals-subtitle">{t('Earn up to 50% rebates on all fees with your referral code')}</h1>

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
                <div className="features-grid">
                  <div
                    className="feature-card-left"

                  >
                    <div className="feature-icon">
                      <Users size={20} />
                    </div>
                    <h3 className="feature-title">{t('communityRewards')}</h3>
                    <p className="feature-description">{t('communityRewardsText')}</p>
                  </div>
                  <div
                    className="feature-card-middle"

                  >
                    <div className="feature-icon">
                      <Zap size={20} />
                    </div>
                    <h3 className="feature-title">{t('instantTracking')}</h3>
                    <p className="feature-description">{t('instantTrackingText')}</p>
                  </div>
                  <div
                    className="feature-card-right"

                  >
                    <div className="feature-icon">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className="feature-title">{t('tierBenefits')}</h3>
                    <p className="feature-description">{t('tierBenefitsText')}</p>
                  </div>
                </div>
                {/* <ReferralStatsBar
              tokenList={tokenList}
              claimableFees={claimableFees}
              totalClaimableFees={totalClaimableFees}
            /> */}
              </div>
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
                disabled={isSigning || totalClaimableFees === 0}
              >
                {isSigning ? (
                  <>
                    <div className="loading-spinner"></div>
                    {t('signTxn')}
                  </>
                ) : account.connected && account.chainId === activechain ? (
                  totalClaimableFees === 0 ? (
                    t('nothingtoclaim')
                  ) : (
                    t('claimfees')
                  )
                ) : account.connected ? (
                  `${t('switchto')} ${t(settings.chainConfig[activechain].name)}`
                ) : (
                  t('connectWallet')
                )}
              </button>
              <div className="help-text">{t('referralsHelp')}</div>
            </div>
          </div>

          <div className="referral-grid">
            <div className="left-column">
              <div className="refer-section">
                <div className="refer-header">
                  <div className="refer-header-content">
                    <h2 className="earnings-title">{t('shareEarn')}</h2>
                    <p className="earnings-subtitle">{t('shareEarnText')}</p>
                  </div>
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
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
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
                            const tweetText =
                              "Join me on @CrystalExch, the EVM's first fully on-chain orderbook exchange, now live on @monad_xyz.\n\nUse my referral link for a 25% discount on all fees:\n\n";
                            const url = `https://app.crystal.exchange/swap?ref=${refLink}`;
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
                    <span className="link-text">{t('noLink')}</span>
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
          <CustomLinkModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            refLinkString={refLinkString}
            setRefLinkString={setRefLinkString}
            onCreateRef={handleCreateRef}
            refLink={refLink}
            setpopup={setpopup}
            setChain={setChain}
            setError={setError}
            error={error}
            account={account}
          />
          {selectedFeatureIndex !== null && (
            <FeatureModal
              feature={featureData[selectedFeatureIndex]}
              onClose={() => setSelectedFeatureIndex(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Referrals;
