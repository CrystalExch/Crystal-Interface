import React, { useState, useEffect } from 'react';
import './Leaderboard.css';
import LeaderboardImage from '../../assets/leaderboardbanner.png';
import CrownIcon from '../../assets/crownicon.png';
import LeaderboardAccountSetup from './LeaderboardAccountSetup';
import DeleteAccountPopup from './DeleteAccountPopup';
import EditAccountPopup from './EditAccountPopup';
import ChallengeIntro from './ChallengeIntro';

// Updated to accept string IDs to match the data passed from App.tsx
interface Faction {
  id: string; // Changed from number to string to match your data
  name: string;
  points: number;
  level: number;
  rank: number;
  // The following properties are expected by your inner components
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

const Leaderboard: React.FC<LeaderboardProps> = ({
  totalXP,
  currentXP,
  username,
  userXP,
  factions
}) => {
  const [hasAccount, setHasAccount] = useState<boolean>(false);
  const [showChallengeIntro, setShowChallengeIntro] = useState<boolean>(false);
  const [showAccountSetup, setShowAccountSetup] = useState<boolean>(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [showEditAccount, setShowEditAccount] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserDisplayData>({
    username: username || "Guest",
    userXP: userXP || 0,
    logo: ""
  });
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  
  // Process factions to ensure they have all required properties
  const processedFactions = factions.map(faction => ({
    ...faction,
    xp: faction.xp || faction.points || 0,
    bonusXP: faction.bonusXP || 0,
    growthPercentage: faction.growthPercentage || 0,
    logo: faction.logo,
    badgeIcon: faction.badgeIcon
  }));
  
  const [updatedFactions, setUpdatedFactions] = useState<Faction[]>(processedFactions);

  useEffect(() => {
    const storedUserData = localStorage.getItem('leaderboard_user_data');
    
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData) as UserData;
      setUserData({
        username: parsedData.username,
        userXP: parsedData.xp,
        logo: parsedData.image
      });
      setHasAccount(true);
    } else {
      setShowChallengeIntro(true);
    }
  }, []);

  // Sort by XP (points) in descending order for display
  const sortedFactions = [...updatedFactions].sort((a, b) => (b.xp || b.points || 0) - (a.xp || a.points || 0));
  
  const topThreeUsers = sortedFactions.slice(0, 3);
  
  const remainingUsers = sortedFactions.slice(3);
  
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 7,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

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
    if (!hasAccount && !isGuestMode) {
      setShowAccountSetup(true);
    }
  };
  
  const handleContinueAsGuest = (): void => {
    setShowChallengeIntro(false);
    setIsGuestMode(true);
    
    // Set up a generic guest profile
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
    
    // Use string ID to match the existing interface
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
  };

  const handleDeleteAccount = (): void => {
    localStorage.removeItem('leaderboard_user_data');
    
    setHasAccount(false);
    setUserData({
      username: "",
      userXP: 0,
      logo: ""
    });
    
    setUpdatedFactions(processedFactions.filter(f => f.name !== userData.username));
    setShowDeleteConfirmation(false);
  }
  
  const handleEditAccount = (): void => {
    setShowEditAccount(true);
  };
  
  const handleSaveAccountChanges = (updatedUserData: UserData): void => {
    // Update in localStorage
    localStorage.setItem('leaderboard_user_data', JSON.stringify(updatedUserData));
    
    // Update in state
    setUserData({
      username: updatedUserData.username,
      userXP: updatedUserData.xp,
      logo: updatedUserData.image
    });
    
    // Update in factions
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
  };

  const handleCreateAccount = (): void => {
    setShowAccountSetup(true);
  };

  return (
    <div className="leaderboard-container">
      {showChallengeIntro && (
        <ChallengeIntro 
          onComplete={handleChallengeIntroComplete} 
          onContinueAsGuest={handleContinueAsGuest}
          isLoggedIn={hasAccount} 
        />
      )}
      
      {showAccountSetup && (
        <LeaderboardAccountSetup 
          onComplete={handleAccountSetupComplete}
          onClose={() => setShowAccountSetup(false)}
          onBackToIntro={() => {
            setShowAccountSetup(false);
            setShowChallengeIntro(true);
          }}
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
          <img src={LeaderboardImage} alt="Leaderboard" className="leaderboard-image" />
          <button className="view-rules-button" onClick={handleViewRules}>View rules</button>
          
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
          
          <div className="user-info">
            <div className="info-column">
              <div className="column-header">Username</div>
              <div className="column-content">
                <div className="username-container">
                  {userData.logo && (
                    <img src={userData.logo} alt="User" className="username-logo" />
                  )}
                  <span className="username">@{userData.username || "Guest"}</span>
                </div>
              </div>
            </div>
            <div className="column-divider"/>
            
            <div className="info-column">
              <div className="column-header">XP Earned</div>
              <div className="column-content">{userData.userXP} XP</div>
            </div>
            <div className="column-divider"/>
            
            <div className="info-column">
              <div className="column-header">Rank</div>
              <div className="column-content">
                #{hasAccount ? sortedFactions.findIndex(f => f.name === userData.username) + 1 || "N/A" : "N/A"}
              </div>
            </div>
            {hasAccount ? (
              <div className="account-buttons-container">
                <button 
                  className="edit-account-button"
                  onClick={handleEditAccount}
                >
                  Edit Account
                </button>
                <button 
                  className="delete-account-button"
                  onClick={() => setShowDeleteConfirmation(true)}
                >
                  Delete Account
                </button>
              </div>
            ) : isGuestMode ? (
              <button 
                className="create-account-button"
                onClick={handleCreateAccount}
              >
                Create Account
              </button>
            ) : (
              <button 
                className="create-account-button"
                onClick={handleCreateAccount}
              >
                Create Account
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="top-factions">
        {topThreeUsers.map((faction, index) => (
          <div key={faction.id} className={`faction-card rank-${index + 1}`}>
            {index === 0 && (
              <div className="crown-icon-container">
                <img src={CrownIcon} alt="Crown" className="crown-icon" />
              </div>
            )}
            <div className="faction-rank">{index + 1}</div>
            <div className="faction-info">
              <img src={faction.logo} alt={faction.name} className="faction-logo" />
              <div className="faction-name">{faction.name}</div>
              <div className="faction-xp">{(faction.xp || faction.points || 0).toLocaleString()} XP</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="full-leaderboard">
        <div className="leaderboard-headers">
          <div className="header-rank">Rank</div>
          <div className="header-faction">User</div>
          <div className="header-bonus">Total XP</div>
        </div>
        
        <div className="leaderboard-rows">
          {remainingUsers.map((faction, index) => (
            <div key={faction.id} className="leaderboard-row">
              <div className="row-rank">
                <img src={faction.badgeIcon} alt="Badge" className="rank-badge" />
                <span>{index + 4}</span>
              </div>
              <div className="row-faction">
                <img src={faction.logo} alt={faction.name} className="faction-small-logo" />
                <span className="faction-row-name">{faction.name}</span>
              </div>
              <div className="row-xp">
                <div className="xp-amount">{(faction.xp || faction.points || 0).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;