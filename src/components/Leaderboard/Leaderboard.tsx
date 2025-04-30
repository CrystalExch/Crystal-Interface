import React, { useEffect, useRef, useState } from 'react';
import crystalxp from '../../assets/CrystalX.png';
import arrow from '../../assets/arrow.svg';
import CrownIcon from '../../assets/crownicon.png';
import defaultPfp from '../../assets/leaderboard_default.png';
import firstPlacePfp from '../../assets/leaderboard_first.png';
import secondPlacePfp from '../../assets/leaderboard_second.png';
import thirdPlacePfp from '../../assets/leaderboard_third.png';
import LeaderboardImage from '../../assets/leaderboardbanner.png';
import CopyButton from '../CopyButton/CopyButton';

import './Leaderboard.css';

interface Faction {
  id: string;
  name: string;
  points: number;
  referral_points?: number;
  level: number;
  rank: number;
  xp?: number;
  logo?: string;
  username?: string;
}

interface UserDisplayData {
  userXP: number;
  logo: string;
  username?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface LeaderboardProps {
  setpopup?: (value: number) => void;
  orders: any;
  address: any;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  setpopup = () => {},
  orders,
  address,
}) => {
  const [userData, setUserData] = useState<UserDisplayData>({
    userXP: 0,
    logo: '',
    username: '',
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [liveLeaderboard, setLiveLeaderboard] = useState<{
    [address: string]: { points: number; username: string; referral_points: number };
  }>({});
  const loading = Object.keys(liveLeaderboard).length === 0;
  const [allFactions, setAllFactions] = useState<Faction[]>([]);
  const ITEMS_PER_PAGE = currentPage === 0 ? 47 : 50;

  useEffect(() => {
    const fetchUserPoints = () => {
      if (!address) return;

      fetch('https://api.crystal.exchange/user_points')
        .then(res => res.json())
        .then((data: Record<string, [string, number, number]>) => {
          const updatedLiveLeaderboard = Object.fromEntries(
            Object.entries(data).filter(([addr, _]) => addr !== '0xe7d1f4ab222d94389b82981f99c58824ff42a7d0').map(([addr, info]) => {
              const [username, points, referral_points] = info;
              return [
                addr.toLowerCase(),
                {
                  points,
                  username: username || '',
                  referral_points,
                },
              ] as const;
            })
          );

          setLiveLeaderboard(updatedLiveLeaderboard);
        })
        .catch(err => {
          console.error('Error fetching user points:', err);
        });
    };

    fetchUserPoints();
    const interval = setInterval(fetchUserPoints, 3000);
    return () => clearInterval(interval);
  }, [address]);

  useEffect(() => {
    const lower = address?.toLowerCase();
    const userInfo = liveLeaderboard[lower] || { points: 0, username: '', referral_points: 0 };

    setUserData({
      userXP: userInfo.points,
      logo: '',
      username: userInfo.username || '',
    });

  }, [address, liveLeaderboard]);

  useEffect(() => {
    if (Object.keys(liveLeaderboard).length === 0) return;

    const me = address?.toLowerCase();
    const liveEntries: Faction[] = Object.entries(liveLeaderboard).map(
      ([addr, data]) => {
        const isMe = addr === me;
        const displayPoints = isMe
          ? data.points
          : data.points + (data.referral_points || 0);

        return {
          id: addr,
          name: addr,
          username: data.username || '',
          points: displayPoints,
          referral_points: data.referral_points,
          level: Math.max(1, Math.floor(displayPoints / 1000)),
          rank: 0,
          logo: '',
        };
      }
    );

    liveEntries.sort((a, b) => b.points - a.points);
    liveEntries.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });
    setAllFactions(liveEntries);
  }, [liveLeaderboard]);

  const getUserRank = () => {
    if (!address || allFactions.length === 0) return 'N/A';
    const f = allFactions.find(f => f.id.toLowerCase() === address.toLowerCase());
    return f ? `#${f.rank}` : 'N/A';
  };

  const findUserPosition = () => {
    if (!address) return -1;
    const idx = allFactions.findIndex(f => f.id.toLowerCase() === address.toLowerCase());
    return idx >= 0 ? idx : -1;
  };

  const goToUserPosition = () => {
    const pos = findUserPosition();
    if (pos === -1) return;
    if (pos < 3) {
      setCurrentPage(0);
      setTimeout(() => {
        document.querySelector('.leaderboard-banner')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const adj = pos - 3;
      const page = Math.floor(adj / ITEMS_PER_PAGE);
      setCurrentPage(page);
      setTimeout(() => {
        document.querySelector('.current-user-row')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const totalPages = Math.ceil((allFactions.length - 3) / ITEMS_PER_PAGE);

  const getCurrentPageItems = () => {
    let start: number, count: number;
    if (currentPage === 0) {
      start = 3; count = 47;
    } else {
      start = 3 + 47 + (currentPage - 1) * 50;
      count = 50;
    }
    return allFactions.slice(start, start + count);
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  const topThreeUsers = allFactions.slice(0, 3);

  useEffect(() => {
    const calculate = () => {
      const target = new Date('2025-06-01T00:00:00-04:00').getTime();
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, []);

  const rowsRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentPage > 0 && bottomSentinelRef.current) {
      bottomSentinelRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',   
      });
    }
  }, [currentPage]);

  const getDisplayAddress = (addr: string) =>
    addr.startsWith('0x') ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

  const getDisplayName = (f: Faction) =>
    f.username && f.username.trim() !== '' && f.username !== f.name
      ? f.username
      : getDisplayAddress(f.name);

  const isUserAddress = (addr: string) =>
    address && addr.toLowerCase() === address.toLowerCase();

  const getTopThreePfp = (i: number) => {
    switch (i) {
      case 0: return firstPlacePfp;
      case 1: return secondPlacePfp;
      case 2: return thirdPlacePfp;
      default: return defaultPfp;
    }
  };

  const renderLoadingTopThree = () =>
    [0, 1, 2].map(i => (
      <div key={i} className={`faction-card rank-${i + 1}`}>
        {i === 0 && <div className="crown-icon-container"><img src={CrownIcon} className="crown-icon" /></div>}
        <div className="faction-rank">{i + 1}</div>
        <div className="faction-info">
          <div className="pfp-container"><div className="pfp-loading account-loading-animation" /></div>
          <div className="account-top-name-loading account-loading-animation" />
          <div className="account-top-xp-loading account-loading-animation" />
        </div>
      </div>
    ));

  const renderLoadingRows = () =>
    Array(ITEMS_PER_PAGE).fill(0).map((_, i) => (
      <div key={i} className="leaderboard-row">
        <div className="leaderboard-inner-row">
          <div className="row-rank"><span className="loading-placeholder" /></div>
          <div className="row-faction">
            <div className="row-pfp-container"><div className="row-pfp-loading loading-placeholder" /></div>
            <span className="faction-row-name loading-placeholder" />
          </div>
          <div className="row-xp"><div className="leaderboard-xp-amount loading-placeholder" /></div>
        </div>
      </div>
    ));

  const formatPoints = (p: number) => (p < 0.001 ? '<0.001' : p.toLocaleString());
  const handleConnectWallet = () => setpopup(4);

  return (
    <div className={`leaderboard-container ${loading ? 'is-loading' : ''}`}>
      {!address && (
        <div className="connect-wallet-overlay">
          <div className="connect-wallet-content">
            <h2>{t('connectYourWallet')}</h2>
            <p>{t('connectYourWalletSubtitle')}</p>
            <button
              type="button"
              className="leaderboard-connect-wallet-button"
              onClick={handleConnectWallet}
            >
              <div className="connect-content">{t('connectWallet')}</div>
            </button>
          </div>
        </div>
      )}

      <div className="leaderboard-banner">
        <div className="banner-overlay">
          <img src={LeaderboardImage} className="leaderboard-image" />
          <div
            className="view-rules-button"
            onClick={() => setpopup(15)}
          >
            {t('viewRules')}
          </div>

          <div className="countdown-timer">
            <div className="countdown-time">
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </div>
          </div>

          <div className="progress-container">
            <div className={`xp-display ${loading ? 'loading' : ''}`}>
              {loading ? (
                <div className="total-xp-loading" />
              ) : (
                <span className="progress-bar-amount-header">
                  {Object.values(liveLeaderboard)
                    .reduce((sum, v) => sum + v.points, 0)
                    .toLocaleString()} / 1,000,000,000
                  <img src={crystalxp} className="xp-icon" />
                </span>
              )}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: loading
                    ? '5%'
                    : `${
                        (Object.values(liveLeaderboard).reduce((sum, v) => sum + v.points, 0) /
                          1000000000) *
                        100
                      }%`,
                }}
              />
            </div>
          </div>


<div className="leaderboard-user-info">
  <div className="info-column">
    <div className="column-header">{t('username')}             <button
      className="edit-username-button"
      onClick={() => setpopup(16)}
    >
      {t('edit')}
    </button>
    </div>
    <div className="column-content">
      <div className="address-container">
        {loading ? (
          <span className="leaderboard-user-address account-loading-animation" style={{ width: '120px', height: '14px', borderRadius: '6px' }}></span>
        ) : (
          <span className="leaderboard-user-address">
            @<span className="address-string">{address
              ? liveLeaderboard[address.toLowerCase()]?.username ||
                getDisplayAddress(address)
              : ''}
              </span>
            {address && <CopyButton textToCopy={address} />}
          </span>
        )}
      </div>
    </div>
  </div>
  <div className="column-divider" />

  <div className="info-column">
    <div className="earned-xp-header">
      <img src={crystalxp} className="xp-icon" />
      <div className="column-header">{t('earned')}</div>
    </div>
    <div className="column-content">
      {loading ? (
        <span className="account-xp-loading account-loading-animation" style={{ height: '14px', borderRadius: '6px' }}></span>
      ) : (
        userData.userXP.toLocaleString()
      )}
    </div>
  </div>
  <div className="column-divider" />

  <div className="info-column">
    <div className="earned-xp-header">
      <img src={crystalxp} className="xp-icon" />
      <div className="column-header">{t("bonusCommision")}</div>
    </div>
    <div className="column-content">
      {loading ? (
        <span className="account-xp-loading account-loading-animation" style={{ height: '14px', borderRadius: '6px' }}></span>
      ) : (
        (liveLeaderboard[address?.toLowerCase()]?.referral_points
          ?.toLocaleString() || '0')
      )}
    </div>
  </div>
  <div className="column-divider" />

  <div className="info-column">
    <div className="column-header">{t('rank')}</div>
    <div className="column-content">
      {loading ? (
        <span className="account-rank-loading account-loading-animation" style={{ height: '14px', borderRadius: '6px' }}></span>
      ) : (
        getUserRank()
      )}
    </div>
  </div>
</div>
        </div>
      </div>

      <div className="top-factions">
        {loading
          ? renderLoadingTopThree()
          : topThreeUsers.map((f, i) => (
              <div
                key={f.id}
                className={`faction-card rank-${i + 1} ${
                  isUserAddress(f.name) ? 'user-faction' : ''
                }`}
              >
                {i === 0 && (
                  <div className="crown-icon-container">
                    <img src={CrownIcon} className="crown-icon" />
                  </div>
                )}
                <div className="faction-rank">{i + 1}</div>
                <div className="faction-info">
                  <div className="pfp-container">
                    <img src={getTopThreePfp(i)} className="pfp-image" />
                  </div>
                  <div className="faction-name">
                    {getDisplayName(f)}
                    <div className="copy-button-wrapper">
                      <CopyButton textToCopy={f.name} />
                    </div>
                  </div>
                  <div className="faction-xp">
                    {formatPoints(f.points)}
                    <img src={crystalxp} className="top-xp-icon" />
                  </div>
                </div>
              </div>
            ))}
      </div>

      <div className="full-leaderboard">
        <div className="leaderboard-headers">
          <div className="header-rank">{t('rank')}</div>
          <div className="header-bonus">{t('totalXP')}</div>
        </div>

        <div className="leaderboard-rows"
         ref={rowsRef}  >
          {loading
            ? renderLoadingRows()
            : getCurrentPageItems().map(faction => {
                const isCurrent = isUserAddress(faction.name);
                return (
                  <div
                    key={faction.id}
                    className={`leaderboard-row ${
                      isCurrent ? 'current-user-row' : ''
                    }`}
                  >
                    <div className="leaderboard-inner-row">
                      <div className="row-rank">
                        <span>#{faction.rank}</span>
                      </div>
                      <div className="row-faction">
                        <div className="row-pfp-container">
                          <img src={defaultPfp} className="row-pfp-image" />
                        </div>
                        <span className="faction-row-name">
                          {getDisplayName(faction)}
                          <div className="copy-button-wrapper">
                            <CopyButton textToCopy={faction.name} />
                          </div>
                        </span>
                        <div className="user-self-tag">
                          {isCurrent && orders.length > 0 && (
                            <div className="orders-indicator-container">
                              <div
                                className="orders-indicator"
                                title={`You have ${orders.length} open orders earning points`}
                              />
                            </div>
                          )}
                          {isCurrent && (
                            <span className="current-user-tag">You</span>
                          )}
                        </div>
                      </div>
                      <div className="row-xp">
                        <div className="leaderboard-xp-amount">
                          {formatPoints(faction.points)}
                          <img src={crystalxp} className="xp-icon" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        <div className="pagination-controls">
          <button
            className="go-to-user-position-button"
            onClick={goToUserPosition}
            disabled={findUserPosition() === -1 || loading}
          >
            {t('viewYourPosition')}
          </button>

          <div className="page-navigation">
            <button
              className="pagination-arrow prev-arrow"
              onClick={goToPreviousPage}
              disabled={currentPage === 0 || loading}
            >
              <img src={arrow} className="leaderboard-control-left-arrow" />
            </button>

            <div className="page-indicator">
              {t('page')} {currentPage + 1} {t('of')}{' '}
              {loading ? '1' : totalPages || 1}
            </div>

            <button
              className="pagination-arrow next-arrow"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1 || loading}
            >
              <img src={arrow} className="leaderboard-control-right-arrow" />
            </button>
          </div>
        </div>
        <div ref={bottomSentinelRef} />

      </div>
    </div>
  );
};

export default Leaderboard;
