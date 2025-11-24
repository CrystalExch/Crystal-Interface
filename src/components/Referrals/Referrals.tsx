import { readContracts } from '@wagmi/core';
import { TrendingUp, Users, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { encodeFunctionData } from 'viem';
import { config } from '../../wagmi';

import CustomLinkModal from './CustomLinkModal';
import FeatureModal from './FeatureModal';
import ReferralLandingPage from './ReferralLandingPage';
import ReferralDashboard from './ReferralDashboard';

import { CrystalReferralAbi } from '../../abis/CrystalReferralAbi';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi';
import { settings } from '../../settings.ts';
import customRound from '../../utils/customRound';

// TODO: Get activechain from context or props
const activechain = 10143; // Monad testnet - temporary hardcoded value

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
  client: any;
}

const Referrals: React.FC<ReferralProps> = ({
  tokenList,
  markets,
  router,
  address,
  usedRefLink,
  setUsedRefLink,
  usedRefAddress,
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
  client,
}) => {
  // const { t } = useLanguage(); // TODO: Uncomment when translations are needed
  const [bgLoaded, setBgLoaded] = useState(false);
  const [refLinkString, setRefLinkString] = useState(refLink);
  const [referredCount, setReferredCount] = useState(0);
  const [isSigning, setIsSigning] = useState(false);
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState<
    number | null
  >(null);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [commissionBonus, setCommissionBonus] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const featureData = [
    {
      icon: <Users size={20} />,
      iconClass: 'blue',
      title: 'Community Rewards', // t('communityRewards'),
      description: 'Earn together', // t('communityRewardsText'),
    },
    {
      icon: <Zap size={20} />,
      iconClass: 'purple',
      title: 'Instant Tracking', // t('instantTracking'),
      description: 'Real-time updates', // t('instantTrackingText'),
    },
    {
      icon: <TrendingUp size={20} />,
      iconClass: 'green',
      title: 'Tier Benefits', // t('tierBenefits'),
      description: 'Unlock rewards', // t('tierBenefitsText'),
    },
  ];
  const [copySuccess, setCopySuccess] = useState(false);
  const [typedRefCode, setTypedRefCode] = useState<string>('');

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `https://app.crystal.exchange?ref=${refLink}`,
    );
    setCopySuccess(true);
    setTimeout(() => {
      setCopySuccess(false);
    }, 3000);
  };

  const getDisplayAddress = (addr: string) =>
    addr && addr.startsWith('0x') ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

  useEffect(() => {
    if (!address) {
      setCommissionBonus(0);
      setUsername('');
      setReferredCount(0);
      setIsLoading(false);
      return;
    }

    (async () => {
      const refs = (await readContracts(config, {
        contracts: [
          {
            abi: CrystalReferralAbi,
            address: settings.chainConfig[activechain].referralManager,
            functionName: 'addressToRefCode',
            args: [address ?? '0x0000000000000000000000000000000000000000'],
          },
          {
            abi: CrystalReferralAbi,
            address: settings.chainConfig[activechain].referralManager,
            functionName: 'addressToReferrer',
            args: [address ?? '0x0000000000000000000000000000000000000000'],
          },
          {
            abi: CrystalReferralAbi,
            address: settings.chainConfig[activechain].referralManager,
            functionName: 'referrerToReferredAddressCount',
            args: [address ?? '0x0000000000000000000000000000000000000000'],
          },
        ],
      })) as any[];

      setRefLink(refs[0].result);

      // Get the referrer address and fetch their code
      const referrerAddress = refs[1].result as `0x${string}`;
      if (referrerAddress && referrerAddress !== '0x0000000000000000000000000000000000000000') {
        setUsedRefAddress(referrerAddress);

        // Fetch the referrer's code
        const referrerCodeResult = (await readContracts(config, {
          contracts: [
            {
              abi: CrystalReferralAbi,
              address: settings.chainConfig[activechain].referralManager,
              functionName: 'addressToRefCode',
              args: [referrerAddress],
            },
          ],
        })) as any[];

        setUsedRefLink(referrerCodeResult[0].result);
      } else {
        setUsedRefLink('');
        setUsedRefAddress('0x0000000000000000000000000000000000000000');
      }

      // Set on-chain referred count
      const onChainCount = Number(refs[2].result || 0);
      setReferredCount(onChainCount);
    })();

    if (!address) {
      setUsername('')
      setReferredCount(0)
      setCommissionBonus(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true);
    
    const fetchInfo = async () => {
      try {
        const res = await fetch(
          `https://api.crystal.exchange/user_info/${address.toLowerCase()}`
        )

        // Silently handle 404 for new users
        if (!res.ok) {
          if (res.status === 404) {
            setUsername('')
            // Don't reset referred count on 404 - keep on-chain value
            setCommissionBonus(0)
            setIsLoading(false)
            return
          }
          throw new Error(`HTTP ${res.status}`)
        }

        const data = await res.json()
        setUsername(data.username || '')
        // Only update referred count from API if it exists and is greater than 0
        // Otherwise keep the on-chain count
        if (data.referred_users && data.referred_users > 0) {
          setReferredCount(data.referred_users)
        }
        const pts = parseFloat(data.referral_points?.toString() || '0')
        setCommissionBonus(parseFloat(customRound(pts, 4)))
        setIsLoading(false)
      } catch (err) {
        // Only log non-404 errors
        if (!(err instanceof Error && err.message.includes('404'))) {
          console.error('user_info fetch failed', err)
        }
        setUsername('')
        // Don't reset referred count on error - keep on-chain value
        setCommissionBonus(0)
        setIsLoading(false)
      }
    }

    fetchInfo()
    const iv = setInterval(fetchInfo, 3000)
    return () => clearInterval(iv)
  }, [address]);

  const handleCreateRef = async () => {
    setError('');
    try {
      let lookup
      lookup = (await readContracts(config, {
        contracts: [
          {
            abi: CrystalReferralAbi,
            address: settings.chainConfig[activechain].referralManager,
            functionName: 'refCodeToAddress',
            args: [refLinkString.toLowerCase()],
          },
        ],
      })) as any[];

      if (lookup[0].result != '0x0000000000000000000000000000000000000000') {
        setError('Code already taken'); // t('codeTaken')
        return false;
      }

      const hash = await sendUserOperationAsync({
        uo: {
          target: settings.chainConfig[activechain].referralManager,
          data: encodeFunctionData({
            abi: CrystalReferralAbi,
            functionName: 'setReferral',
            args: [refLinkString.toLowerCase()],
          }),
          value: 0n,
        },
      });
      await waitForTxReceipt(hash.hash);
      setRefLink(refLinkString.toLowerCase());
      return true;
    } catch (error) {
      console.error('Error creating code:', error);
      return false;
    }
  };

  const handleSetRef = async (used: string) => {
    // Prevent self-referral
    if (used !== '' && used.toLowerCase() === refLink.toLowerCase()) {
      setError('Cannot use your own referral code'); // t('noSelfRefer')
      return false;
    }

    let lookup
    if (used !== '') {
      lookup = (await readContracts(config, {
        contracts: [
          {
            abi: CrystalReferralAbi,
            address: settings.chainConfig[activechain].referralManager,
            functionName: 'refCodeToAddress',
            args: [used.toLowerCase()],
          },
        ],
      })) as any[];

      if (lookup[0].result === '0x0000000000000000000000000000000000000000') {
        setError('Referral code not found'); // t('codeNotFound')
        return false;
      }
    }
    if (account.connected && account.chainId === activechain) {
      if (used === '') {
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
          setUsedRefAddress('0x0000000000000000000000000000000000000000')
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
                args: [used.toLowerCase()],
              }),
              value: 0n,
            },
          });
          await waitForTxReceipt(hash.hash);
          setUsedRefLink(used.toLowerCase());
          setUsedRefAddress(lookup?.[0].result as `0x${string}`)
          return true;
        } catch (error) {
          return false;
        }
      }
    } else {
      !account.connected ? setpopup(4) : setChain();
      return false
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
                address as `0x${string}`,
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
        }, 10000000n);
        console.log('Claim fees transaction hash:', hash);

        // Wait for transaction to be mined before refetching
        if (hash.hash) {
          await waitForTxReceipt(hash.hash);
        }

        refetch();
      } catch (error) {
        console.error('Claim fees error:', error);
      } finally {
        setIsSigning(false);
      }
    } else {
      !account.connected ? setpopup(4) : setChain();
    }
  };
const displayName = username && username.trim() !== ''
  ? (username.startsWith('0x') ? getDisplayAddress(username) : username)
  : getDisplayAddress(address || '');

  // Show landing page if user doesn't have a referral code yet
  // Add ?dashboard=true to URL to force show dashboard for testing
  const urlParams = new URLSearchParams(window.location.search);
  const forceDashboard = urlParams.get('dashboard') === 'true';
  const hasAffiliateAccess = (refLink && refLink !== '') || forceDashboard;

  return (
    <>
      <ReferralDashboard
        tokenList={tokenList}
        address={address}
        usedRefLink={usedRefLink}
        totalClaimableFees={totalClaimableFees}
        claimableFees={claimableFees}
        refLink={refLink}
        setShowModal={setShowModal}
        account={account}
        referredCount={referredCount}
        commissionBonus={commissionBonus}
        displayName={displayName}
        client={client}
        isLoading={isLoading}
        bgLoaded={bgLoaded}
        setBgLoaded={setBgLoaded}
        copySuccess={copySuccess}
        handleCopy={handleCopy}
        handleClaimFees={handleClaimFees}
        handleSetRef={handleSetRef}
        typedRefCode={typedRefCode}
        setTypedRefCode={setTypedRefCode}
        isSigning={isSigning}
      />

      {/* Modal rendered for both landing page and dashboard */}
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
    </>
  );
};

export default Referrals;
