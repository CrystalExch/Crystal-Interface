import React, { useState, useEffect } from 'react';
import './Leaderboard.css';
import LeaderboardImage from '../../assets/leaderboardbanner.png';
import CrownIcon from '../../assets/crownicon.png';
import arrow from '../../assets/arrow.svg';
import LeaderboardAccountSetup from './LeaderboardAccountSetup';
import DeleteAccountPopup from './DeleteAccountPopup';
import EditAccountPopup from './EditAccountPopup';
import ChallengeIntro from './ChallengeIntro';

interface Faction {
  id: string; 
  name: string;
  points: number;
  level: number;
  rank: number;
  xp?: number;
  logo?: string;
}

interface LeaderboardProps {}

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

const ITEMS_PER_PAGE = 47;

const Leaderboard: React.FC<LeaderboardProps> = () => {
  const [hasAccount, setHasAccount] = useState<boolean>(false);
  const [showChallengeIntro, setShowChallengeIntro] = useState<boolean>(false);
  const [showAccountSetup, setShowAccountSetup] = useState<boolean>(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [showEditAccount, setShowEditAccount] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserDisplayData>({
    username: "Guest",
    userXP: 0,
    logo: ""
  });
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [directAccountSetup, setDirectAccountSetup] = useState<boolean>(false);
  const [introStep, setIntroStep] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 7,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [liveLeaderboard, setLiveLeaderboard] = useState<{ [address: string]: { username: string; points: number; logo?: string } }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [allFactions, setAllFactions] = useState<Faction[]>([]);
  const [newUsername, setNewUsername] = useState<string>("");

  useEffect(() => {
    const ws = new WebSocket("wss://points-backend-b5a062cda7cd.herokuapp.com/ws/points");
    ws.onopen = () => {};
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS data:", data);
      setLiveLeaderboard(data);
      setTimeout(() => setLoading(false), 1500);
    };
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setLoading(false);
    };
    ws.onclose = () => {};

    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      ws.close();
      clearTimeout(loadingTimeout);
    };
  }, []);

  useEffect(() => {
    if (Object.keys(liveLeaderboard).length > 0) {
      const liveEntries = Object.entries(liveLeaderboard).map(([address, data]) => ({
        id: address,
        name: data.username || address,
        points: Number(data.points),
        level: Math.max(1, Math.floor(Number(data.points) / 1000)),
        rank: 0,
        xp: Number(data.points),
        logo: data.logo || ""
      }));

      liveEntries.sort((a, b) => b.points - a.points);
      liveEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      setAllFactions(liveEntries);
    }
  }, [liveLeaderboard]);

  useEffect(() => {
    const storedUserData = localStorage.getItem('leaderboard_user_data');
    const hasSeenIntro = localStorage.getItem('has_seen_challenge_intro');

    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData) as UserData;
      setUserData({
        username: parsedData.username,
        userXP: parsedData.xp,
        logo: parsedData.image
      });
      setHasAccount(true);
      setShowChallengeIntro(false);
    } else if (hasSeenIntro === 'true') {
      setIsGuestMode(true);
      setShowChallengeIntro(false);
    } else {
      setShowChallengeIntro(true);
      setIntroStep(0);
    }
  }, []);

  const findUserPosition = () => {
    const userPosition = allFactions.findIndex(f => f.name === userData.username);
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

  const formatAddress = (address: string): string => {
    if (!address) return "Guest";
    if (address === "Guest") return "Guest";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleChallengeIntroComplete = (): void => {
    setShowChallengeIntro(false);
    localStorage.setItem('has_seen_challenge_intro', 'true');
    if (!hasAccount && !isGuestMode) {
      setShowAccountSetup(true);
      setDirectAccountSetup(false); 
    }
  };

  const handleContinueAsGuest = (): void => {
    setShowChallengeIntro(false);
    setIsGuestMode(true);
    localStorage.setItem('has_seen_challenge_intro', 'true');
    setUserData({ username: "Guest", userXP: 0, logo: "" });
  };

  const handleAccountSetupComplete = (newUserData: UserData): void => {
    localStorage.setItem('leaderboard_user_data', JSON.stringify(newUserData));
    setUserData({
      username: newUserData.username,
      userXP: newUserData.xp,
      logo: newUserData.image
    });
    setHasAccount(true);
    setShowAccountSetup(false);
    setDirectAccountSetup(false);
  };

  const handleDeleteAccount = (): void => {
    localStorage.removeItem('leaderboard_user_data');
    setHasAccount(false);
    setUserData({ username: "", userXP: 0, logo: "" });
    setShowDeleteConfirmation(false);
  };

  const handleEditAccount = (): void => {
    setShowEditAccount(true);
  };

  const handleSaveAccountChanges = (updatedUserData: UserData): void => {
    localStorage.setItem('leaderboard_user_data', JSON.stringify(updatedUserData));
    setUserData({
      username: updatedUserData.username,
      userXP: updatedUserData.xp,
      logo: updatedUserData.image
    });
    setShowEditAccount(false);
  };

  const handleViewRules = (): void => {
    setShowChallengeIntro(true);
    setIntroStep(0); 
  };

  const handleCreateAccount = (): void => {
    setShowAccountSetup(true);
    setDirectAccountSetup(true); 
  };

  const handleAccountSetupBack = (): void => {
    if (directAccountSetup) {
      setShowAccountSetup(false);
    } else {
      setShowAccountSetup(false);
      setShowChallengeIntro(true);
      setIntroStep(2); 
    }
  };

  useEffect(() => {
    if (newUsername) {
      const walletAddress = localStorage.getItem("wallet_address") || "guest";
      const updateUsername = async () => {
        console.log("Submitting username:", newUsername);
        try {
          const response = await fetch("https://points-backend-b5a062cda7cd.herokuapp.com/set_username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: walletAddress, username: newUsername })
          });
          console.log("Response received:", response);
          const data = await response.json();
          console.log("Data from response:", data);
          if (response.ok) {
            setUserData(prev => ({ ...prev, username: newUsername }));
            const stored = localStorage.getItem("leaderboard_user_data");
            if (stored) {
              const parsed = JSON.parse(stored) as UserData;
              parsed.username = newUsername;
              localStorage.setItem("leaderboard_user_data", JSON.stringify(parsed));
            }
            alert("Username updated successfully!");
          } else {
            alert("Error updating username: " + data.message);
          }
        } catch (error) {
          console.error("Error updating username:", error);
          alert("Error updating username");
        }
      };

      updateUsername();
    }
  }, [newUsername]);

  const t = (text: string): string => {
    const translations: Record<string, string> = {
      viewRules: "View Rules",
      username: "Username",
      xpEarned: "XP Earned",
      rank: "Rank",
      editAccount: "Edit Account",
      createAccount: "Create Account",
      page: "Page",
      of: "of",
      viewYourPosition: "View Your Position",
      user: "User",
      totalXP: "Total XP"
    };
    return translations[text] || text;
  };

  const isUserAddress = (address: string): boolean => {
    return userData.username === address;
  };

  const renderLoadingTopThree = () => {
    return [0, 1, 2].map((index) => (
      <div key={`loading-top-${index}`} className={`faction-card rank-${index + 1}`}>
        {index === 0 && (
          <div className="crown-icon-container">
            <img src={CrownIcon} className="crown-icon" alt="Crown" />
          </div>
        )}
        <div className="faction-rank">{index + 1}</div>
        <div className="faction-info">
          <div className="faction-logo loading-placeholder"></div>
          <div className="faction-name loading-placeholder"></div>
          <div className="faction-xp loading-placeholder"></div>
        </div>
      </div>
    ));
  };

  const renderLoadingRows = () => {
    return Array(ITEMS_PER_PAGE).fill(0).map((_, index) => (
      <div key={`loading-row-${index}`} className="leaderboard-row">
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

  return (
    <div className={`leaderboard-container ${loading ? 'is-loading' : ''}`}>
      {showChallengeIntro && (
        <ChallengeIntro 
          onComplete={handleChallengeIntroComplete} 
          onContinueAsGuest={handleContinueAsGuest}
          isLoggedIn={hasAccount}
          initialStep={introStep} 
        />
      )}
      
      {showAccountSetup && (
        <LeaderboardAccountSetup 
          onComplete={handleAccountSetupComplete}
          onBackToIntro={handleAccountSetupBack}
        />
      )}

      {showDeleteConfirmation && (
        <DeleteAccountPopup
          username={userData.username}
          onConfirmDelete={handleDeleteAccount}
          onClose={() => setShowDeleteConfirmation(false)}
          onCreateNewAccount={() => {
            setShowDeleteConfirmation(false);
            setShowAccountSetup(true);
            setDirectAccountSetup(true);
          }}
          onReturnHome={() => {
            setShowDeleteConfirmation(false);
          }}
        />
      )}
      
      {showEditAccount && (
        <EditAccountPopup
          userData={{
            username: userData.username,
            image: userData.logo,
            xp: userData.userXP
          }}
          onSaveChanges={handleSaveAccountChanges}
          onClose={() => setShowEditAccount(false)}
        />
      )}
      
      <div className="username-update-container">
        <form>
          <input
            type="text"
            placeholder="Enter new username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <button type="submit">Update Username</button>
        </form>
      </div>

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
            <div className="xp-display">
              <span>{Object.values(liveLeaderboard)
                .reduce((sum, entry) => sum + Number(entry.points), 0)
                .toLocaleString()} / {'1,000,000,000'.toLocaleString()} XP</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(Object.values(liveLeaderboard)
                  .reduce((sum, entry) => sum + Number(entry.points), 0) / 1000000000) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="leaderboard-user-info">
            <div className="info-column">
              <div className="column-header">{t("username")}</div>
              <div className="column-content">
                <div className="username-container">
                  {userData.logo && (
                    <img src={userData.logo} className="username-logo" alt="User Avatar" />
                  )}
                  <span className="username">
                    {userData.username ? formatAddress(userData.username) : "Guest"}
                  </span>
                </div>
              </div>
            </div>
            <div className="column-divider"/>
            
            <div className="info-column">
              <div className="column-header">{t("xpEarned")}</div>
              <div className="column-content">{userData.userXP.toLocaleString()} XP</div>
            </div>
            <div className="column-divider"/>
            
            <div className="info-column">
              <div className="column-header">{t("rank")}</div>
              <div className="column-content">
                #{hasAccount ? findUserPosition() + 1 || "N/A" : "N/A"}
              </div>
            </div>
            {hasAccount ? (
              <button 
                className="edit-account-button"
                onClick={handleEditAccount}
              >
                {t("editAccount")}
              </button>
            ) : isGuestMode ? (
              <button 
                className="create-account-button"
                onClick={handleCreateAccount}
              >
                {t("createAccount")}
              </button>
            ) : (
              <button 
                className="create-account-button"
                onClick={handleCreateAccount}
              >
                {t("createAccount")}
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
                <img src={''} className="faction-logo" alt="" />
                <div className="faction-name">{formatAddress(faction.name)}</div>
                <div className="faction-xp">{(faction.xp || faction.points || 0).toLocaleString()} XP</div>
              </div>
            </div>
          ))
        }
      </div>
      
      <div className="full-leaderboard">
        <div className="leaderboard-headers">
          <div className="header-rank">{t("rank")}</div>
          <div className="header-faction">{t("user")}</div>
          <div className="header-bonus">{t("totalXP")}</div>
        </div>
        
        <div className="leaderboard-rows">
          {loading 
            ? renderLoadingRows()
            : getCurrentPageItems().map((faction) => {
                const absoluteRank = faction.rank;
                const isCurrentUser = isUserAddress(faction.name);
                return (
                  <div key={faction.id} className={`leaderboard-row ${isCurrentUser ? 'current-user-row' : ''}`}>
                    <div className="row-rank"><span>{absoluteRank}</span></div>
                    <div className="row-faction">
                      <img src={''} className="faction-small-logo" alt="" />
                      <span className="faction-row-name">{formatAddress(faction.name)}</span>
                      {isCurrentUser && <span className="current-user-tag">You</span>}
                    </div>
                    <div className="row-xp">
                      <div className="xp-amount">{(faction.xp || faction.points || 0).toLocaleString()}</div>
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
            disabled={!hasAccount || findUserPosition() === -1 || loading}
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
