import React, { useState, useEffect, useCallback } from 'react';
import { Share2, Eye, EyeOff } from 'lucide-react';
import { readContracts } from '@wagmi/core';
import { encodeFunctionData } from 'viem';
import { config } from '../../../wagmi';
import { CrystalRouterAbi } from '../../../abis/CrystalRouterAbi';
import { settings } from '../../../settings';
import customRound from '../../../utils/customRound';
import defaultPfp from '../../../assets/leaderboard_default.png';
import closebutton from '../../../assets/close_button.png';
import './ReferralSidebar.css';

interface ReferralSidebarProps {
  tokendict: { [key: string]: any };
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
  setChain: any;
  setpopup: any;
  account: any;
  refetch: any;
  sendUserOperationAsync: any;
  waitForTxReceipt: any;
  client: any;
  activechain: any;
}

const ReferralSidebar: React.FC<ReferralSidebarProps> = ({
  tokendict,
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
  setChain,
  setpopup,
  account,
  refetch,
  sendUserOperationAsync,
  waitForTxReceipt,
  client,
  activechain,
}) => {
  const [referredCount, setReferredCount] = useState(0);
  const [commissionBonus, setCommissionBonus] = useState(0);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [claimableLoading, setClaimableLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isRemovingCode, setIsRemovingCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEnterCode, setShowEnterCode] = useState(false);
  const [newRefCode, setNewRefCode] = useState('');
  const [enterRefCode, setEnterRefCode] = useState('');
  const [error, setError] = useState('');
  const [isBlurred, setIsBlurred] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);

  const getDisplayAddress = (addr: string) =>
    addr && addr.startsWith('0x') ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

  const displayName = username && username.trim() !== ''
    ? (username.startsWith('0x') ? getDisplayAddress(username) : username)
    : getDisplayAddress(address || '');

  useEffect(() => {
    if (!address) {
      setCommissionBonus(0);
      setUsername('');
      setReferredCount(0);
      setIsLoading(false);
      setClaimableLoading(false);
      return;
    }

    // Set loading states when address changes
    setIsLoading(true);
    setClaimableLoading(true);

    (async () => {
      const refs = (await readContracts(config, {
        contracts: [
          {
            abi: CrystalRouterAbi,
            address: settings.chainConfig[activechain].referralManager,
            functionName: 'addressToRefCode',
            args: [address ?? '0x0000000000000000000000000000000000000000'],
          },
          {
            abi: CrystalRouterAbi,
            address: settings.chainConfig[activechain].referralManager,
            functionName: 'addressToRefCode',
            args: [
              usedRefAddress ?? '0x0000000000000000000000000000000000000000',
            ],
          },
        ],
      })) as any[];
      setRefLink(refs[0].result);
      setUsedRefLink(refs[1].result);
    })();

    const fetchInfo = async () => {
      try {
        const res = await fetch(
          `https://api.crystal.exchange/user_info/${address.toLowerCase()}`
        );
        const data = await res.json();
        setUsername(data.username || '');
        setReferredCount(data.referred_users || 0);
        const pts = parseFloat(data.referral_points?.toString() || '0');
        setCommissionBonus(parseFloat(customRound(pts, 4)));
        setIsLoading(false);
      } catch (err) {
        console.error('user_info fetch failed', err);
        setUsername('');
        setReferredCount(0);
        setCommissionBonus(0);
        setIsLoading(false);
      }
    };

    fetchInfo();
    const iv = setInterval(fetchInfo, 3000);
    return () => clearInterval(iv);
  }, [address]);

  // Separate effect for claimable fees loading
  useEffect(() => {
    if (address) {
      setClaimableLoading(false);
    }
  }, [totalClaimableFees, claimableFees]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://app.crystal.exchange?ref=${refLink}`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const isValidInput = (value: string) => {
    const regex = /^[a-zA-Z0-9-]{0,20}$/;
    return regex.test(value);
  };

  const handleCreateRefCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (isValidInput(value) || value === "") {
        setNewRefCode(value);
        setError('');
      }
    },
    [newRefCode],
  );

  const handleEnterRefCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setEnterRefCode(value);
      setError('');
    },
    [enterRefCode],
  );

  const handleCreateRef = async () => {
    if (account.connected && account.chainId === activechain) {
      if (!isValidInput(newRefCode)) return false;

      try {
        setIsSigning(true);
        let lookup = (await readContracts(config, {
          contracts: [
            {
              abi: CrystalRouterAbi,
              address: settings.chainConfig[activechain].referralManager,
              functionName: 'refCodeToAddress',
              args: [newRefCode.toLowerCase()],
            },
          ],
        })) as any[];

        if (lookup[0].result != '0x0000000000000000000000000000000000000000') {
          setError('Code already taken');
          setIsSigning(false);
          return false;
        }

        const hash = await sendUserOperationAsync({
          uo: {
            target: settings.chainConfig[activechain].referralManager,
            data: encodeFunctionData({
              abi: CrystalRouterAbi,
              functionName: 'setReferral',
              args: [newRefCode],
            }),
            value: 0n,
          },
        });
        await waitForTxReceipt(hash.hash);
        setRefLink(newRefCode);
        setShowCreateModal(false);
        setNewRefCode('');
        setIsSigning(false);
        return true;
      } catch (error) {
        setIsSigning(false);
        return false;
      }
    } else {
      !account.connected ? setpopup(4) : setChain();
      return false;
    }
  };

  const handleSetRef = async (used: string) => {
    if (account.connected && account.chainId === activechain) {
      let lookup;
      const isRemoving = used === '';

      if (used !== '') {
        lookup = (await readContracts(config, {
          contracts: [
            {
              abi: CrystalRouterAbi,
              address: settings.chainConfig[activechain].referralManager,
              functionName: 'refCodeToAddress',
              args: [used.toLowerCase()],
            },
          ],
        })) as any[];

        if (lookup[0].result === '0x0000000000000000000000000000000000000000') {
          setError('Failed to set referral code');
          return false;
        }
      }

      try {
        if (isRemoving) {
          setIsRemovingCode(true);
        } else {
          setIsSigning(true);
        }

        const hash = await sendUserOperationAsync({
          uo: {
            target: settings.chainConfig[activechain].referralManager,
            data: encodeFunctionData({
              abi: CrystalRouterAbi,
              functionName: 'setUsedRef',
              args: [used],
            }),
            value: 0n,
          },
        });
        await waitForTxReceipt(hash.hash);
        setUsedRefLink(used);
        setUsedRefAddress(used === '' ? '0x0000000000000000000000000000000000000000' : lookup?.[0].result);
        setShowEnterCode(false);
        setEnterRefCode('');
        setIsEditingCode(false);
        setIsSigning(false);
        setIsRemovingCode(false);
        return true;
      } catch (error) {
        setIsSigning(false);
        setIsRemovingCode(false);
        return false;
      }
    } else {
      !account.connected ? setpopup(4) : setChain();
      return false;
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
              args: [address as `0x${string}`, Array.from(
                new Set(
                  Object.values(tokendict).map(
                    (market) => market.address as `0x${string}`,
                  ),
                ),
              )]
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

  // Updated handlers for opening modals
  const handleOpenEnterCode = () => {
    setEnterRefCode('');
    setIsEditingCode(false);
    setShowEnterCode(true);
    setError('');
  };

  const handleOpenEditCode = () => {
    setEnterRefCode(usedRefLink);
    setIsEditingCode(true);
    setShowEnterCode(true);
    setError('');
  };

  return (
    <div className="referral-sidebar">
      <div className="referral-sidebar-header">
        <h3 className="sidebar-title">REFERRALS</h3>
        <button
          className="blur-toggle"
          onClick={() => setIsBlurred(!isBlurred)}
        >
          {isBlurred ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      <div className="user-info-section">
        <div className="user-avatar">
          <img src={defaultPfp} className="avatar-img" />
        </div>
        <div className="user-details">
          {isLoading ? (
            <div className="skeleton skeleton-username"></div>
          ) : (
            <span className="username">{displayName}</span>
          )}
          <div className="multiplier-badge">
            {client && usedRefLink ? 1.375 : client ? 1.25 : usedRefLink ? 1.1 : 1}x Points
          </div>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-content">
            <div className={`stat-value ${isBlurred ? 'blurred' : ''}`}>
              {isLoading ? <div className="skeleton skeleton-stat"></div> : referredCount}
            </div>
            <div className="stat-label">Referred</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-content">
            <div className={`stat-value ${isBlurred ? 'blurred' : ''}`}>
              {isLoading ? <div className="skeleton skeleton-stat"></div> : commissionBonus}
            </div>
            <div className="stat-label">Crystals</div>
          </div>
        </div>
      </div>

      <div className="claimable-section">
        <div className="stat-item">
          <div className="stat-content">
            <div className={`stat-value ${isBlurred ? 'blurred' : ''}`}>
              {claimableLoading ? (
                <div className="skeleton skeleton-claimable"></div>
              ) : (
                `${totalClaimableFees ? '$' + customRound(totalClaimableFees, 2) : '$0.00'}`
              )}            </div>
            <div className="stat-label">Claimable</div>
          </div>
        </div>

        <div className="token-list">
          {claimableLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="token-row">
                <div className="skeleton skeleton-token-icon"></div>
                <div className="skeleton skeleton-token-amount"></div>
              </div>
            ))
          ) : (
            Object.entries(claimableFees).map(([token, value]) => (
              <div key={token} className="token-row">
                <div className="token-item">
                  <div className="token-info">
                    <div className="token-logo">
                      <img className="referral-token-image" src={tokendict[token]?.image}/>
                      <span className="token-symbol">{tokendict[token]?.ticker}</span>
                    </div>
                  </div>
                </div>
                <span className={`token-amount ${isBlurred ? 'blurred' : ''}`}>
                  {value ? customRound(value as number, 3) : '0.00'}
                </span>
              </div>
            ))
          )}
        </div>

        <button
          className="claim-button"
          onClick={handleClaimFees}
          disabled={isSigning || totalClaimableFees === 0 || claimableLoading}
        >
          {isSigning ? (
            <>
              <div className="spinner"></div>
              Claiming...
            </>
          ) : claimableLoading ? (
            <>
              <div className="spinner"></div>
              Loading...
            </>
          ) : totalClaimableFees === 0 ? (
            'Nothing to Claim'
          ) : (
            'Claim Fees'
          )}
        </button>
      </div>

      {/* My Referral Link */}
      <div className="my-link-section">
        <div className="section-header">
          <span className="section-title">My Link</span>
          {refLink && (
            <button
              className="customize-link-btn"
              onClick={() => setShowCreateModal(true)}
            >
              Customize
            </button>
          )}
        </div>
        {refLink ? (
          <div className="link-display">
            <div className="link-text">
              <span className="link-code">{refLink}</span>
            </div>
            <div className="link-actions">
              <div className="ref-icon-container" onClick={handleCopy}>
                <svg
                  className={`ref-copy-icon ${copySuccess ? 'hidden' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#aaaecf90"
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
                  stroke="#aaaecf90"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l3 3 6-6" />
                </svg>
              </div>
              <button
                className="action-btn"
                onClick={() => {
                  const tweetText = "Join me on @CrystalExch, the EVM's first fully on-chain orderbook exchange.\n\nUse my referral link for a 25% discount on all fees:\n\n";
                  const url = `https://app.crystal.exchange?ref=${refLink}`;
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`,
                    '_blank'
                  );
                }}
              >
                <Share2 color={"#aaaecf90"} size={12} />
              </button>
            </div>
          </div>
        ) : (
          <button
            className="create-link-btn"
            onClick={() => setShowCreateModal(true)}
          >
            Create Link
          </button>
        )}
      </div>

      <div className="using-code-section">
        <div className="section-title">Using Code</div>
        {usedRefLink ? (
          <div className="code-display">
            <span className="current-code">{usedRefLink}</span>
            <button
              className="change-btn"
              onClick={handleOpenEditCode}
            >
              Change
            </button>
          </div>
        ) : (
          <button
            className="enter-code-btn"
            onClick={handleOpenEnterCode}
          >
            Enter Code
          </button>
        )}
      </div>

      {/* Create/Customize Modal - CustomLinkModal Style */}
      {showCreateModal && (
        <div className="custom-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="custom-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="custom-modal-header">
              <h2 className="ref-popup-title">
                {refLink ? 'Customize' : 'Create'}
              </h2>
              <button className="custom-modal-close" onClick={() => setShowCreateModal(false)}>
                <img className="close-button-icon" src={closebutton} />
              </button>
            </div>
            {refLink ? (
              <div className="ref-popup-subtitle">This will replace your current referral code</div>
            ) : (
              <h3 className="ref-popup-subtitle">Create your personalized referral code</h3>
            )}

            <div className="input-wrapper">
              <input
                className={`custom-modal-input ${error ? 'has-error' : ''}`}
                value={newRefCode}
                onChange={handleCreateRefCodeChange}
                placeholder={refLink ? 'Enter a code' : 'Create code'}
                maxLength={20}
                autoFocus
              />
            </div>
            {error && <div className="input-error">{error}</div>}
            <div className="referral-preview">
              <span className="ref-link-structure">
                https://app.crystal.exchange?ref={' '}
                <div className="ref-url">{newRefCode}</div>
              </span>
            </div>

            <button
              className="customize-button"
              onClick={handleCreateRef}
              disabled={isSigning || !newRefCode}
            >
              {isSigning ? (
                <>
                  <div className="spinner"></div>
                  Sign Transaction
                </>
              ) : account.connected && account.chainId === activechain ? (
                <>{refLink ? 'Customize' : 'Create'}</>
              ) : account.connected ? (
                `Switch to ${settings.chainConfig[activechain]?.name || 'Network'}`
              ) : (
                'Connect Wallet'
              )}
            </button>
          </div>
        </div>
      )}

      {showEnterCode && (
        <div className="custom-modal-overlay" onClick={() => setShowEnterCode(false)}>
          <div className="custom-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="custom-modal-header">
              <h2 className="ref-popup-title">
                {isEditingCode ? 'Edit Ref Code' : 'Enter Referral Code'}
              </h2>
              <button className="custom-modal-close" onClick={() => setShowEnterCode(false)}>
                <img className="close-button-icon" src={closebutton} />
              </button>
            </div>
            <h3 className="ref-popup-subtitle">
              {isEditingCode
                ? 'Edit your current referral code'
                : 'Enter a referral code to get fee discounts'
              }
            </h3>

            <div className="input-wrapper">
              <input
                className={`custom-modal-input ${error ? 'has-error' : ''}`}
                value={enterRefCode}
                onChange={handleEnterRefCodeChange}
                placeholder={isEditingCode ? 'Edit referral code' : 'Enter referral code'}
                autoFocus
              />
            </div>
            {error && <div className="input-error">{error}</div>}

            <div className="modal-actions-custom">
              <button
                className="customize-button"
                onClick={() => handleSetRef(enterRefCode)}
                disabled={isSigning || !enterRefCode || (isEditingCode && enterRefCode === usedRefLink)}
              >
                {isSigning ? (
                  <>
                    <div className="spinner"></div>
                  </>
                ) : account.connected && account.chainId === activechain ? (
                  isEditingCode ? 'Update Code' : 'Set Code'
                ) : account.connected ? (
                  `Switch to ${settings.chainConfig[activechain]?.name || 'Network'}`
                ) : (
                  'Connect Wallet'
                )}
              </button>
              {usedRefLink && (
                <button
                  className="remove-button"
                  onClick={() => handleSetRef('')}
                  disabled={isRemovingCode}
                >
                  {isRemovingCode ? (
                    <>
                      <div className="spinner"></div>
                    </>
                  ) : (
                    'Remove Code'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralSidebar;