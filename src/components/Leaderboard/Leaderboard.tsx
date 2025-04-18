import React, { useEffect, useState } from 'react';
import crystalxp from '../../assets/CrystalX.png';
import arrow from '../../assets/arrow.svg';
import CrownIcon from '../../assets/crownicon.png';
import defaultPfp from '../../assets/leaderboard_default.png';
import firstPlacePfp from '../../assets/leaderboard_first.png';
import secondPlacePfp from '../../assets/leaderboard_second.png';
import thirdPlacePfp from '../../assets/leaderboard_third.png';
import LeaderboardImage from '../../assets/leaderboardbanner.png';
import ChallengeIntro from './ChallengeIntro';
import CopyButton from '../CopyButton/CopyButton';

import './Leaderboard.css';

interface Faction {
  id: string;
  name: string;
  points: number;
  level: number;
  rank: number;
  xp?: number;
  logo?: string;
}

interface UserDisplayData {
  userXP: number;
  logo: string;
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
  const [showChallengeIntro, setShowChallengeIntro] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserDisplayData>({
    userXP: 0,
    logo: '',
  });
  const [introStep, setIntroStep] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [liveLeaderboard, setLiveLeaderboard] = useState<{
    [address: string]: number;
  }>({});
  const loading = Object.keys(liveLeaderboard).length === 0;
  const [allFactions, setAllFactions] = useState<Faction[]>([]);
  const ITEMS_PER_PAGE = currentPage == 0 ? 47 : 50;

  useEffect(() => {
    const fetchUserPoints = () => {
      if (address) {
        fetch('https://points-backend-b5a062cda7cd.herokuapp.com/user_points')
        .then((res) => res.json())
        .then((data: Record<string, { points: number }>) => {
  
          const updatedLiveLeaderboard = Object.fromEntries(
            Object.entries(data).map(([addr, info]) => [addr.toLowerCase(), info.points] as const)
          );
  
          setLiveLeaderboard(updatedLiveLeaderboard);
        })
        .catch((err) => {
          console.error('Error fetching user points:', err);
        });
      }
    };
  
    fetchUserPoints();
    const interval = setInterval(fetchUserPoints, 3000);
  
    return () => clearInterval(interval);
  }, []);  
  
  useEffect(() => {
    if (address) {
      const lowerCaseAddress = address.toLowerCase();
      const hasSeenIntro =
        localStorage.getItem('has_seen_challenge_intro') === 'true';
      const points = liveLeaderboard[lowerCaseAddress] || 0;

      setUserData({
        userXP: points,
        logo: '',
      });

      if (!hasSeenIntro) {
        setShowChallengeIntro(true);
        setIntroStep(0);
      }
    } else {
      setUserData({
        userXP: 0,
        logo: '',
      });

      const hasSeenIntro =
        localStorage.getItem('has_seen_challenge_intro') === 'true';
      if (!hasSeenIntro) {
        setShowChallengeIntro(true);
        setIntroStep(0);
      }
    }
  }, [address, liveLeaderboard]);

  useEffect(() => {
    if (Object.keys(liveLeaderboard).length > 0) {
      const liveEntries = Object.entries(liveLeaderboard).map(
        ([address, points]) => ({
          id: address,
          name: address,
          points: Number(points),
          level: Math.max(1, Math.floor(Number(points) / 1000)),
          rank: 0,
          logo: '',
        }),
      );

      liveEntries.sort((a, b) => b.points - a.points);
      liveEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      setAllFactions(liveEntries);
    }
  }, [liveLeaderboard]);

  const getUserRank = () => {
    if (!address || !allFactions.length) return 'N/A';

    const userFaction = allFactions.find(
      (f) => f.id.toLowerCase() === address.toLowerCase(),
    );

    if (userFaction) {
      return '#' + userFaction.rank;
    }

    return 'N/A';
  };

  const findUserPosition = () => {
    if (!address) return -1;

    const userPosition = allFactions.findIndex(
      (f) => f.id.toLowerCase() === address.toLowerCase(),
    );

    return userPosition >= 0 ? userPosition : -1;
  };

  const goToUserPosition = () => {
    const userPosition = findUserPosition();
    if (userPosition >= 0) {
      if (userPosition < 3) {
        setCurrentPage(0);
        setTimeout(() => {
          const topFactions = document.querySelector('.top-factions');
          if (topFactions) {
            topFactions.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        const adjustedPosition = userPosition - 3;
        const targetPage = Math.floor(adjustedPosition / ITEMS_PER_PAGE);
        setCurrentPage(targetPage);
        
        setTimeout(() => {
          const userRow = document.querySelector('.current-user-row');
          if (userRow) {
            userRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  };

  const totalPages = Math.ceil((allFactions.length - 3) / ITEMS_PER_PAGE);

  const getCurrentPageItems = () => {
    let startIndex: number;
    let itemsCount: number;
    if (currentPage === 0) {
      startIndex = 3;
      itemsCount = 47;
    } else {
      startIndex = 3 + 47 + (currentPage - 1) * 50;
      itemsCount = 50;
    }
    return allFactions.slice(startIndex, startIndex + itemsCount);
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const topThreeUsers = allFactions.slice(0, 3);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date('2025-06-01T00:00:00-04:00');
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(() => {
      calculateTimeLeft();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getDisplayAddress = (address: string): string => {
    if (address.startsWith('0x')) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address;
  };

  const handleChallengeIntroComplete = (): void => {
    setShowChallengeIntro(false);
    localStorage.setItem('has_seen_challenge_intro', 'true');
  };

  const handleViewRules = (): void => {
    setShowChallengeIntro(true);
    setIntroStep(0);
  };

  const isUserAddress = (factionAddress: string): boolean => {
    return (
      address !== undefined &&
      factionAddress.toLowerCase() === address.toLowerCase()
    );
  };

  const getTopThreePfp = (index: number) => {
    switch (index) {
      case 0:
        return firstPlacePfp;
      case 1:
        return secondPlacePfp;
      case 2:
        return thirdPlacePfp;
      default:
        return defaultPfp;
    }
  };

  const renderLoadingTopThree = () => {
    return [0, 1, 2].map((index) => (
      <div
        key={`loading-top-${index}`}
        className={`faction-card rank-${index + 1}`}
      >
        {index === 0 && (
          <div className="crown-icon-container">
            <img src={CrownIcon} className="crown-icon" />
          </div>
        )}
        <div className="faction-rank">{index + 1}</div>
        <div className="faction-info">
          <div className="pfp-container">
            <div className="pfp-loading account-loading-animation" />
          </div>
          <div className="account-top-name-loading account-loading-animation" />
          <div className="account-top-xp-loading account-loading-animation" />
        </div>
      </div>
    ));
  };

  const renderLoadingRows = () => {
    return Array(ITEMS_PER_PAGE)
      .fill(0)
      .map((_, index) => (
        <div key={`loading-row-${index}`} className="leaderboard-row">
          <div className="row-rank">
            <span className="loading-placeholder" />
          </div>
          <div className="row-faction">
            <div className="row-pfp-container">
              <div className="row-pfp-loading loading-placeholder" />
            </div>
            <span className="faction-row-name loading-placeholder" />
          </div>
          <div className="row-xp">
            <div className="xp-amount loading-placeholder" />
          </div>
        </div>
      ));
  };

  const formatPoints = (points: number): string => {
    return points < 0.001 ? '<0.001' : points.toLocaleString();
  };

  useEffect(() => {
    if (address && !showChallengeIntro) {
      if (!localStorage.getItem('has_seen_challenge_intro')) {
        setShowChallengeIntro(true);
      }
    }
  }, [address, showChallengeIntro]);

  const handleConnectWallet = () => {
    setpopup(4);
  };

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

      {showChallengeIntro && (
        <ChallengeIntro
          onComplete={handleChallengeIntroComplete}
          initialStep={introStep}
        />
      )}

      <div className="leaderboard-banner">
        <div className="banner-overlay">
          <img
            src={LeaderboardImage}
            className="leaderboard-image"
          />
          <button className="view-rules-button" onClick={handleViewRules}>
            {t('viewRules')}
          </button>

          <div className="countdown-timer">
            <div className="countdown-time">
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{' '}
              {timeLeft.seconds}s
            </div>
          </div>

          <div className="progress-container">
            <div className={`xp-display ${loading ? 'loading' : ''}`}>
              {loading ? (
                <div className="total-xp-loading" />
              ) : (
                <span className="progress-bar-amount-header">
                  {Object.values(liveLeaderboard)
                    .reduce((sum: any, value: any) => sum + value, 0)
                    .toLocaleString()}{' '}
                  / {'10,000,000,000'.toLocaleString()}
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
                    : `${(Object.values(liveLeaderboard).reduce((sum: number, value: number) => sum + value, 0) / 10000000000) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="leaderboard-user-info">
            <div className="info-column">
              <div className="column-header">{t('address')}</div>
              <div className="column-content">
                <div className="address-container">
                  <span className="leaderboard-user-address">
                    {address ? getDisplayAddress(address) : ''}
                    {address && <CopyButton textToCopy={address} />}
                  </span>
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
                {userData.userXP.toLocaleString()}
              </div>
            </div>
            <div className="column-divider" />

            <div className="info-column">
              <div className="column-header">{t('rank')}</div>
              <div className="column-content">{getUserRank()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="top-factions">
        {loading
          ? renderLoadingTopThree()
          : topThreeUsers.map((faction, index) => (
              <div
                key={faction.id}
                className={`faction-card rank-${index + 1} ${isUserAddress(faction.name) ? 'user-faction' : ''}`}
              >
                {index === 0 && (
                  <div className="crown-icon-container">
                    <img src={CrownIcon} className="crown-icon" />
                  </div>
                )}
                <div className="faction-rank">{index + 1}</div>
                <div className="faction-info">
                  <div className="pfp-container">
                    <img
                      src={getTopThreePfp(index)}
                      className="pfp-image"
                    />
                  </div>
                  <div className="faction-name">
                    {getDisplayAddress(faction.name)}
                    <div className="copy-button-wrapper"><CopyButton textToCopy={faction.name} /></div>
                  </div>
                  <div className="faction-xp">
                    {formatPoints(faction.points || 0)}
                    <img
                      src={crystalxp}
                      className="top-xp-icon"
                    />
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

        <div className="leaderboard-rows">
          {loading
            ? renderLoadingRows()
            : getCurrentPageItems().map((faction) => {
                const absoluteRank = faction.rank;
                const isCurrentUser = isUserAddress(faction.name);
                return (
                  <div
                    key={faction.id}
                    className={`leaderboard-row ${isCurrentUser ? 'current-user-row' : ''}`}
                  >
                    <div className="row-rank">
                      <span>#{absoluteRank}</span>
                    </div>
                    <div className="row-faction">
                      <div className="row-pfp-container">
                        <img
                          src={defaultPfp}
                          className="row-pfp-image"
                        />
                      </div>
                      <span className="faction-row-name">
                        {getDisplayAddress(faction.name)}
                        <div className="copy-button-wrapper"><CopyButton textToCopy={faction.name} /></div>
                      </span>
                      <div className="user-self-tag">
                      {isCurrentUser && orders.length > 0 && (
                        <div className="orders-indicator-container">
                          <div
                            className="orders-indicator"
                            title={`You have ${orders.length} open orders earning points`}
                          ></div>
                        </div>
                      )}
                      {isCurrentUser && (
                        <span className="current-user-tag">You</span>
                      )}
                      </div>
                      
                    </div>
                    <div className="row-xp">
                      <div className="xp-amount">
                        {formatPoints(faction.points || 0)}
                        <img
                          src={crystalxp}
                          className="xp-icon"
                        />
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
              <img
                src={arrow}
                className="leaderboard-control-left-arrow"
              />
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
              <img
                src={arrow}
                className="leaderboard-control-right-arrow"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;