import React, { useState } from 'react';
import './Leaderboard.css';
import defaultPfp from '../../assets/leaderboard_default.png';

interface LeaderboardProps {
  address: `0x${string}` | undefined;
  displayName: string;
  isLoading: boolean;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  totalPoints: number;
  trading: number;
  referrals: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ address, displayName, isLoading }) => {
  const [activePage, setActivePage] = useState(1);

  // Mock data - will be replaced with real API data later
  const leaderboardData: LeaderboardEntry[] = [
    { rank: 1, userId: '0x1234...5678', totalPoints: 125000, trading: 100000, referrals: 25000 },
    { rank: 2, userId: '0xabcd...efgh', totalPoints: 98500, trading: 80000, referrals: 18500 },
    { rank: 3, userId: '0x9876...4321', totalPoints: 87200, trading: 70000, referrals: 17200 },
    { rank: 4, userId: '0xdef0...1234', totalPoints: 76800, trading: 65000, referrals: 11800 },
    { rank: 5, userId: '0x5555...6666', totalPoints: 68400, trading: 58000, referrals: 10400 },
    { rank: 6, userId: '0x7777...8888', totalPoints: 61200, trading: 52000, referrals: 9200 },
    { rank: 7, userId: '0x9999...0000', totalPoints: 54800, trading: 47000, referrals: 7800 },
    { rank: 8, userId: '0xaaaa...bbbb', totalPoints: 49600, trading: 43000, referrals: 6600 },
    { rank: 9, userId: '0xcccc...dddd', totalPoints: 44200, trading: 38000, referrals: 6200 },
    { rank: 10, userId: '0xeeee...ffff', totalPoints: 39800, trading: 35000, referrals: 4800 },
  ];

  // User's own data
  const userRank = 127;
  const userTotalPoints = 0;
  const userTrading = 0;
  const userReferrals = 0;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="leaderboard-container">
      {/* User Profile Section */}
      <div className="leaderboard-user-section">
        <img src={defaultPfp} className="leaderboard-user-pfp" alt="Profile" />
        <div className="leaderboard-user-info">
          {isLoading ? (
            <>
              <div className="referrals-skeleton leaderboard-username-skeleton"></div>
              <div className="referrals-skeleton leaderboard-rank-skeleton"></div>
            </>
          ) : (
            <>
              <span className="leaderboard-username">{displayName}</span>
              <div className="leaderboard-user-rank">Rank #{userRank}</div>
            </>
          )}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="leaderboard-table-section">
        <h2 className="leaderboard-title">Points Leaderboard</h2>

        <div className="leaderboard-table-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>User ID</th>
                <th>Total Points</th>
                <th>Trading</th>
                <th>Referrals</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((entry) => (
                <tr key={entry.rank}>
                  <td className="rank-cell">
                    <span className="rank-number">#{entry.rank}</span>
                  </td>
                  <td className="user-id-cell">{entry.userId}</td>
                  <td className="points-cell">{formatNumber(entry.totalPoints)}</td>
                  <td className="trading-cell">{formatNumber(entry.trading)}</td>
                  <td className="referrals-cell">{formatNumber(entry.referrals)}</td>
                </tr>
              ))}

              {/* User's row */}
              <tr className="user-row">
                <td className="rank-cell">
                  <span className="rank-number">#{userRank}</span>
                </td>
                <td className="user-id-cell">
                  <span className="user-highlight">You</span>
                </td>
                <td className="points-cell">{formatNumber(userTotalPoints)}</td>
                <td className="trading-cell">{formatNumber(userTrading)}</td>
                <td className="referrals-cell">{formatNumber(userReferrals)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="leaderboard-pagination">
          <button
            className={`pagination-btn ${activePage === 1 ? 'active' : ''}`}
            onClick={() => setActivePage(1)}
          >
            1
          </button>
          <button
            className={`pagination-btn ${activePage === 2 ? 'active' : ''}`}
            onClick={() => setActivePage(2)}
          >
            2
          </button>
          <button
            className={`pagination-btn ${activePage === 3 ? 'active' : ''}`}
            onClick={() => setActivePage(3)}
          >
            3
          </button>
          <button
            className={`pagination-btn ${activePage === 4 ? 'active' : ''}`}
            onClick={() => setActivePage(4)}
          >
            4
          </button>
          <button className="pagination-btn you-btn">YOU</button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
