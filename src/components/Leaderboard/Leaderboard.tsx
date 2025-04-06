import React, { useState, useEffect } from 'react';
import './Leaderboard.css';
import LeaderboardImage from '../../assets/leaderboardbanner.png';
import crystalxp from '../../assets/CrystalX.png';
import CrownIcon from '../../assets/crownicon.png';
import arrow from '../../assets/arrow.svg';
import ChallengeIntro from './ChallengeIntro';
import EditAccountPopup from './EditAccountPopup';
import { useSmartAccountClient } from "@account-kit/react";
import defaultpfp from '../../assets/defaultpfp.webp';

interface Faction {
  id: string;
  name: string;
  points: number;
  level: number;
  rank: number;
  xp?: number;
  logo?: string;
}

interface UserData {
  username: string;
  image: string;
  xp: number;
}

interface UserDisplayData {
  username: string;
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
}

const ITEMS_PER_PAGE = 47;

const Leaderboard: React.FC<LeaderboardProps> = ({ setpopup = () => {} }) => {
  const [hasAccount, setHasAccount] = useState<boolean>(true);
  const [showChallengeIntro, setShowChallengeIntro] = useState<boolean>(false);
  const [showEditAccount, setShowEditAccount] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserDisplayData>({
    username: "",
    userXP: 0,
    logo: defaultpfp
  });
  const [introStep, setIntroStep] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 7,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [liveLeaderboard, setLiveLeaderboard] = useState<{ [address: string]: number }>({});
  const [userInfo, setUserInfo] = useState<{ [address: string]: { username: string } }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const { address } = useSmartAccountClient({ type: "LightAccount" });

  useEffect(() => {
    const fetchUserPoints = () => {
      fetch("https://points-backend-b5a062cda7cd.herokuapp.com/user_points")
        .then((res) => res.json())
        .then((data: Record<string, { username: string; points: number }>) => {
          const normalizedData = Object.fromEntries(
            Object.entries(data).map(([addr, info]) => [
              addr.toLowerCase(),
              { username: info.username, points: info.points }
            ])
          );
          const updatedUserInfo = Object.fromEntries(
            Object.entries(normalizedData).map(([addr, info]) => [addr, { username: info.username }])
          );
          console.log(normalizedData);
          setUserInfo(updatedUserInfo);
          const updatedLiveLeaderboard = Object.fromEntries(
            Object.entries(normalizedData).map(([addr, info]) => [addr, info.points])
          );
          setLiveLeaderboard(updatedLiveLeaderboard);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching user points:", err);
          setLoading(false);
        });
    };

    fetchUserPoints();
  }, []);

  useEffect(() => {
    if (address && Object.keys(userInfo).length > 0) {
      const lowerCaseAddress = address.toLowerCase();
      const hasSeenIntro = localStorage.getItem('has_seen_challenge_intro') === 'true';
      const points = liveLeaderboard[lowerCaseAddress] || 0;
      
      const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
      const displayName = userInfo[lowerCaseAddress]?.username || truncatedAddress;
      
      setUserData({
        username: displayName,
        userXP: points,
        logo: defaultpfp
      });
      setHasAccount(true);

      if (!hasSeenIntro) {
        setShowChallengeIntro(true);
        setIntroStep(0);
      }
    } else if (address) {
      const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
      setUserData({
        username: truncatedAddress,
        userXP: 0,
        logo: defaultpfp
      });
      setHasAccount(true);
      
      const hasSeenIntro = localStorage.getItem('has_seen_challenge_intro') === 'true';
      if (!hasSeenIntro) {
        setShowChallengeIntro(true);
        setIntroStep(0);
      }
    } else {
      setUserData({
        username: "",
        userXP: 0,
        logo: defaultpfp
      });
      setHasAccount(false);
    }
  }, [address, userInfo, liveLeaderboard]);

  useEffect(() => {
    if (Object.keys(liveLeaderboard).length > 0) {
      const liveEntries = Object.entries(liveLeaderboard).map(([address, points]) => ({
        id: address,
        name: address,
        points: Number(points),
        level: Math.max(1, Math.floor(Number(points) / 1000)),
        rank: 0,
        xp: Number(points),
        logo: defaultpfp  
      }));

      liveEntries.sort((a, b) => b.points - a.points);
      liveEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      setAllFactions(liveEntries);
    }
  }, [liveLeaderboard]);

  const [allFactions, setAllFactions] = useState<Faction[]>([]);

  const findUserPosition = () => {
    if (!address) return -1;

    const userPosition = allFactions.findIndex(f =>
      f.id.toLowerCase() === address.toLowerCase()
    );

    return userPosition >= 0 ? userPosition : -1;
  };

  const goToUserPosition = () => {
    const userPosition = findUserPosition();
    if (userPosition >= 0) {
      if (userPosition < 3) {
        setCurrentPage(0);
      } else {
        const adjustedPosition = userPosition - 3;
        const targetPage = Math.floor(adjustedPosition / ITEMS_PER_PAGE);
        setCurrentPage(targetPage);
      }
    }
  };

  const totalPages = Math.ceil((allFactions.length - 3) / ITEMS_PER_PAGE);

  const getCurrentPageItems = () => {
    const startIndex = 3 + (currentPage * ITEMS_PER_PAGE);
    return allFactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
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
      const targetDate = new Date("2025-03-28T12:00:00Z");
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
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

  const getDisplayName = (address: string): string => {
    const lowerAddr = address.toLowerCase();
  
    if (userInfo[lowerAddr]?.username && userInfo[lowerAddr].username != lowerAddr) {
      return userInfo[lowerAddr].username;
    }
  
    if (address.startsWith("0x")) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
  
    return address;
  };
  
  const handleChallengeIntroComplete = (): void => {
    setShowChallengeIntro(false);
    localStorage.setItem('has_seen_challenge_intro', 'true');
    setShowEditAccount(true);
  };

  const handleEditAccount = (): void => {
    setShowEditAccount(true);
  };

  const handleSaveAccountChanges = async (updatedUserData: UserData): Promise<void> => {
    setUserData({
      username: updatedUserData.username,
      userXP: updatedUserData.xp,
      logo: defaultpfp 
    });

    if (address) {
      setUserInfo(prevUserInfo => ({
        ...prevUserInfo,
        [address.toLowerCase()]: { username: updatedUserData.username }
      }));
    }

    setShowEditAccount(false);
  };

  const handleViewRules = (): void => {
    setShowChallengeIntro(true);
    setIntroStep(0);
  };

  const t = (text: string): string => {
    const translations: Record<string, string> = {
      viewRules: "View Rules",
      username: "Username",
      xpEarned: "XP Earned",
      rank: "Rank",
      editAccount: "Edit Account",
      page: "Page",
      of: "of",
      viewYourPosition: "View Your Position",
      user: "User",
      totalXP: "Total Crystals",
      earned: "Earned"
    };
    return translations[text] || text;
  };

  const isUserAddress = (factionAddress: string): boolean => {
    return address !== undefined && factionAddress.toLowerCase() === address.toLowerCase();
  };

  const renderLoadingTopThree = () => {
    return [0, 1, 2].map((index) => (
      <div
        key={`loading-top-${index}`}
        className={`faction-card rank-${index + 1}`}
      >
        {index === 0 && (
          <div className="crown-icon-container">
            <img src={CrownIcon} className="crown-icon" alt="Crown" />
          </div>
        )}
        <div className="faction-rank">{index + 1}</div>
        <div className="faction-info">
          <div className="account-top-logo-loading account-loading-animation"></div>
          <div className="account-top-name-loading account-loading-animation"></div>
          <div className="account-top-xp-loading account-loading-animation"></div>
        </div>
      </div>
    ));
  };

  const renderLoadingRows = () => {
    return Array(ITEMS_PER_PAGE).fill(0).map((_, index) => (
      <div
        key={`loading-row-${index}`}
        className="leaderboard-row"
      >
        <div className="row-rank">
          <span className="loading-placeholder"></span>
        </div>
        <div className="row-faction">
          <div className="faction-small-logo loading-placeholder"></div>
          <span className="faction-row-name loading-placeholder"></span>
        </div>
        <div className="row-xp">
          <div className="xp-amount loading-placeholder"></div>
        </div>
      </div>
    ));
  };

  useEffect(() => {
    if (address && !showChallengeIntro && Object.keys(userInfo).length > 0) {
      const lowerCaseAddress = address.toLowerCase();
      // Only show challenge intro if user hasn't seen it yet
      if (!localStorage.getItem('has_seen_challenge_intro')) {
        setShowChallengeIntro(true);
      }
    } else if (!address) {
      setShowEditAccount(false);
    }
  }, [address, userInfo, showChallengeIntro]);

  const handleConnectWallet = () => {
    setpopup(4);
  };

  return (
    <div className={`leaderboard-container ${loading ? 'is-loading' : ''}`}>
      {!address && (
        <div className="connect-wallet-overlay">
          <div className="connect-wallet-content">
            <h2>Connect Your Wallet</h2>
            <p>Please connect your wallet to view the leaderboard</p>
            <button
              type="button"
              className="leaderboard-connect-wallet-button"
              onClick={handleConnectWallet}
            >
              <div className="connect-content">
                Connect Wallet
              </div>
            </button>
          </div>
        </div>
      )}

      {showChallengeIntro && (
        <ChallengeIntro
          onComplete={handleChallengeIntroComplete}
          onContinueAsGuest={handleChallengeIntroComplete} // Both functions do the same thing now
          isLoggedIn={true} // Always true as we're using wallet address
          initialStep={introStep}
        />
      )}

      {showEditAccount && (
        <EditAccountPopup
          userData={{
            username: userData.username,
            image: defaultpfp,
            xp: userData.userXP
          }}
          onSaveChanges={handleSaveAccountChanges}
          onClose={() => setShowEditAccount(false)}
        />
      )}

      <div className="leaderboard-banner">
        <div className="banner-overlay">
          <img src={LeaderboardImage} className="leaderboard-image" alt="Leaderboard Banner" />
          <button className="view-rules-button" onClick={handleViewRules}>{t("viewRules")}</button>

          <div className="countdown-timer">
            <div className="countdown-time">
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </div>
          </div>

          <div className="progress-container">
            <div className={`xp-display ${loading ? 'loading' : ''}`}>
              {loading ? (
                <div className="total-xp-loading"></div>
              ) : (
                <span className="progress-bar-amount-header">
                  {Object.values(liveLeaderboard).reduce((sum: any, value: any) => sum + value, 0).toLocaleString()} / {'1,000,000,000'.toLocaleString()} 
                  <img src={crystalxp} className="xp-icon" alt="XP Icon" />

                </span>
              )}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ 
                  width: loading 
                    ? '5%'  
                    : `${(Object.values(liveLeaderboard).reduce((sum: any, value: any) => sum + value, 0) / 1000000000) * 100}%` 
                }}
              ></div>
            </div>
          </div>
          <div className="leaderboard-user-info">
            <div className="info-column">
              <div className="column-header">{t("username")}</div>
              <div className="column-content">
                <div className="username-container">
                  <span className="username">
                    {userData.username || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "")}
                  </span>
                </div>
              </div>
            </div>
            <div className="column-divider"/>
            
            <div className="info-column">
              <div className="earned-xp-header"> 
            <img src={crystalxp} className="xp-icon" alt="XP Icon" />
            <div className="column-header">{t("earned")}</div>
            </div> 
              <div className="column-content">
                {userData.userXP.toLocaleString()}
              </div>
            </div>
            <div className="column-divider"/>
            
            <div className="info-column">
              <div className="column-header">{t("rank")}</div>
              <div className="column-content">
                #{findUserPosition() + 1 || "N/A"}
              </div>
            </div>
            {address && (
              <button 
                className="edit-account-button"
                onClick={handleEditAccount}
              >
                {t("editAccount")}
              </button>
            )}
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
                  <img src={CrownIcon} className="crown-icon" alt="Crown" />
                </div>
              )}
              <div className="faction-rank">{index + 1}</div>
              <div className="faction-info">
                
                <div className="faction-name">{getDisplayName(faction.name)}</div>
                <div className="faction-xp">
                  <img src={crystalxp} className="top-xp-icon" alt="XP Icon" />
                  {(faction.xp || faction.points || 0).toLocaleString()}

                </div>
              </div>
            </div>
          ))
        }
      </div>

      <div className="full-leaderboard">
        <div className="leaderboard-headers">
          <div className="header-rank">{t("rank")}</div>
          <div className="header-bonus">{t("totalXP")}</div>
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
                    
                    <span className="faction-row-name">{getDisplayName(faction.name)}</span>
                    {isCurrentUser && <span className="current-user-tag">You</span>}
                  </div>
                  <div className="row-xp">
                    <div className="xp-amount">
                      {(faction.xp || faction.points || 0).toLocaleString()}
                      <img src={crystalxp} className="xp-icon" alt="XP Icon" />

                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>

        <div className="pagination-controls">
          <button
            className="go-to-user-position-button"
            onClick={goToUserPosition}
            disabled={findUserPosition() === -1 || loading}
          >
            {t("viewYourPosition")}
          </button>

          <div className="page-navigation">
            <button
              className="pagination-arrow prev-arrow"
              onClick={goToPreviousPage}
              disabled={currentPage === 0 || loading}
            >
              <img src={arrow} className="leaderboard-control-left-arrow" alt="Previous" />
            </button>

            <div className="page-indicator">
              {t("page")} {currentPage + 1} {t("of")} {loading ? "1" : (totalPages || 1)}
            </div>

            <button
              className="pagination-arrow next-arrow"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1 || loading}
            >
              <img src={arrow} className="leaderboard-control-right-arrow" alt="Next" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;