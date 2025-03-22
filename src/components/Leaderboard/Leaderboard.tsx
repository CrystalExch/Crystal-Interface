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
  bonusXP?: number;
  growthPercentage?: number;
  logo?: string;
  badgeIcon?: string;
}

interface LeaderboardProps {
  totalXP: number;
  currentXP: number;
  username: string;
  userXP: number;
  factions: Faction[];
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

const ITEMS_PER_PAGE = 47;

const Leaderboard: React.FC<LeaderboardProps> = ({
  totalXP,
  currentXP,
  username: initialUsername,
  userXP: initialUserXP,
  factions: initialFactions
}) => {
  const [hasAccount, setHasAccount] = useState<boolean>(false);
  const [showChallengeIntro, setShowChallengeIntro] = useState<boolean>(false);
  const [showAccountSetup, setShowAccountSetup] = useState<boolean>(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [showEditAccount, setShowEditAccount] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserDisplayData>({
    username: initialUsername || "Guest",
    userXP: initialUserXP || 0,
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
  
  const generateExtendedFactions = () => {
    const baseNames = [
      "Astral", "Nebula", "Cosmic", "Galactic", "Quantum", "Celestial", "Void", "Solar", 
      "Lunar", "Stellar", "Nova", "Eclipse", "Horizon", "Zenith", "Infinity", "Radiant",
      "Ember", "Crystal", "Shadow", "Phoenix", "Dragon", "Titan", "Kraken", "Oracle",
      "Frost", "Inferno", "Thunder", "Tempest", "Vortex", "Nexus", "Mystic", "Arcane"
    ];
    
    const suffixes = [
      "Keepers", "Guardians", "Hunters", "Warriors", "Knights", "Sentinels", "Vanguard", 
      "Legion", "Disciples", "Lords", "Masters", "Watchers", "Protectors", "Seekers", 
      "Arbiters", "Defenders", "Raiders", "Crusaders", "Wanderers", "Explorers"
    ];
    
    const processedFactions = initialFactions.map(faction => ({
      ...faction,
      xp: faction.xp || faction.points || 0,
      bonusXP: faction.bonusXP || 0,
      growthPercentage: faction.growthPercentage || 0,
      logo: faction.logo,
      badgeIcon: faction.badgeIcon
    }));

    let extendedFactions: Faction[] = [...processedFactions];
    
    const maxRank = Math.max(...initialFactions.map(f => f.rank));
    
    // RANDOM ACCOUNT GENERATOR FOR TESTING
    for (let i = maxRank + 1; i <= maxRank + 320; i++) {
      const nameIndex = Math.floor(Math.random() * baseNames.length);
      const suffixIndex = Math.floor(Math.random() * suffixes.length);
      const randomName = `${baseNames[nameIndex]} ${suffixes[suffixIndex]}`;
      
      const baseXP = Math.floor(9800 * Math.pow(0.995, i - maxRank));
      const randomVariation = Math.floor(baseXP * 0.1 * (Math.random() - 0.5));
      const xp = Math.max(100, baseXP + randomVariation);
      
      extendedFactions.push({
        id: `gen-${i}`,
        name: randomName,
        points: xp,
        level: Math.max(1, Math.floor(xp / 1000)),
        rank: i,
        xp: xp,
        logo: `https://api.dicebear.com/6.x/bottts/svg?seed=${i}`,
        badgeIcon: ''
      });
    }
    
    extendedFactions.sort((a, b) => (b.xp || b.points) - (a.xp || a.points));
    
    extendedFactions = extendedFactions.map((faction, index) => ({
      ...faction,
      rank: index + 1
    }));
    
    return extendedFactions;
  };
  
  const [allFactions] = useState<Faction[]>(() => generateExtendedFactions());
  const [updatedFactions, setUpdatedFactions] = useState<Faction[]>(allFactions);
  
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
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    const timer = setInterval(() => {
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);


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
    
    setUserData({
      username: "Guest",
      userXP: 0,
      logo: ""
    });
  };
  
  
  const handleAccountSetupComplete = (newUserData: UserData): void => {
    localStorage.setItem('leaderboard_user_data', JSON.stringify(newUserData));
    
    setUserData({
      username: newUserData.username,
      userXP: newUserData.xp,
      logo: newUserData.image
    });
    
    const maxId = Math.max(...updatedFactions.map(f => parseInt(f.id.toString()) || 0));
    const userFaction: Faction = {
      id: (maxId + 1).toString(),
      name: newUserData.username,
      points: 0,
      level: 1,
      rank: updatedFactions.length + 1,
      xp: 0,
      bonusXP: 0,
      growthPercentage: 0,
      logo: newUserData.image,
      badgeIcon: ''
    };
    
    setUpdatedFactions([...updatedFactions, userFaction]);
    setHasAccount(true);
    setShowAccountSetup(false);
    setDirectAccountSetup(false);
  };

  const handleDeleteAccount = (): void => {
    localStorage.removeItem('leaderboard_user_data');
    
    setHasAccount(false);
    setUserData({
      username: "",
      userXP: 0,
      logo: ""
    });
    
    setUpdatedFactions(allFactions.filter(f => f.name !== userData.username));
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
    
    const updatedFactionsList = updatedFactions.map(faction => {
      if (faction.name === userData.username) {
        return {
          ...faction,
          name: updatedUserData.username,
          logo: updatedUserData.image
        };
      }
      return faction;
    });
    
    setUpdatedFactions(updatedFactionsList);
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

  return (
    <div className="leaderboard-container">
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
              <span>{currentXP.toLocaleString()} / {totalXP.toLocaleString()} XP</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(currentXP / totalXP) * 100}%` }}
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
                  <span className="username">@{userData.username || "Guest"}</span>
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
        {topThreeUsers.map((faction, index) => (
          <div 
            key={faction.id} 
            className={`faction-card rank-${index + 1} ${faction.name === userData.username ? 'user-faction' : ''}`}
          >
            {index === 0 && (
              <div className="crown-icon-container">
                <img src={CrownIcon} className="crown-icon" alt="Crown" />
              </div>
            )}
            <div className="faction-rank">{index + 1}</div>
            <div className="faction-info">
              <img 
                src={faction.logo || `https://api.dicebear.com/6.x/bottts/svg?seed=${faction.name}`} 
                className="faction-logo" 
                alt={`${faction.name} avatar`} 
              />
              <div className="faction-name">{faction.name}</div>
              <div className="faction-xp">{(faction.xp || faction.points || 0).toLocaleString()} XP</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="full-leaderboard">
        <div className="leaderboard-headers">
          <div className="header-rank">                {t("rank")}
          </div>
          <div className="header-faction">                {t("user")}
          </div>
          <div className="header-bonus">                {t("totalXP")}
          </div>
        </div>
        
        <div className="leaderboard-rows">
          {getCurrentPageItems().map((faction) => {
            const absoluteRank = faction.rank;
            const isCurrentUser = faction.name === userData.username;
            
            return (
              <div 
                key={faction.id} 
                className={`leaderboard-row ${isCurrentUser ? 'current-user-row' : ''}`}
              >
                <div className="row-rank">
                  <span>{absoluteRank}</span>
                </div>
                <div className="row-faction">
                  <img 
                    src={faction.logo || `https://api.dicebear.com/6.x/bottts/svg?seed=${faction.name}`} 
                    className="faction-small-logo" 
                    alt={`${faction.name} avatar`} 
                  />
                  <span className="faction-row-name">{faction.name}</span>
                  {isCurrentUser && <span className="current-user-tag">You</span>}
                </div>
                <div className="row-xp">
                  <div className="xp-amount">{(faction.xp || faction.points || 0).toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="pagination-controls">
          <button 
            className="go-to-user-position-button"
            onClick={goToUserPosition}
            disabled={!hasAccount || findUserPosition() === -1}
          >
            {t("viewYourPosition")}
          </button>
          
          <div className="page-navigation">
            <button 
              className="pagination-arrow prev-arrow"
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
            >
              <img src={arrow} className="leaderboard-control-left-arrow" />
            </button>
            
            <div className="page-indicator">
              {t("page")} {currentPage + 1} {t("of")} {totalPages}
            </div>
            
            <button 
              className="pagination-arrow next-arrow"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1}
            >
              <img src={arrow} className="leaderboard-control-right-arrow" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;