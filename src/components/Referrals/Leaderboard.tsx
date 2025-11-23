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
  const allLeaderboardData: LeaderboardEntry[] = [
    // Page 1 (ranks 1-10)
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
    // Page 2 (ranks 11-20)
    { rank: 11, userId: '0x1111...2222', totalPoints: 36400, trading: 31000, referrals: 5400 },
    { rank: 12, userId: '0x3333...4444', totalPoints: 33200, trading: 28000, referrals: 5200 },
    { rank: 13, userId: '0x5555...7777', totalPoints: 30800, trading: 26000, referrals: 4800 },
    { rank: 14, userId: '0x8888...9999', totalPoints: 28400, trading: 24000, referrals: 4400 },
    { rank: 15, userId: '0xaaaa...cccc', totalPoints: 26200, trading: 22000, referrals: 4200 },
    { rank: 16, userId: '0xdddd...eeee', totalPoints: 24000, trading: 20000, referrals: 4000 },
    { rank: 17, userId: '0xffff...0000', totalPoints: 22400, trading: 19000, referrals: 3400 },
    { rank: 18, userId: '0x1234...abcd', totalPoints: 20800, trading: 17500, referrals: 3300 },
    { rank: 19, userId: '0xef01...2345', totalPoints: 19200, trading: 16000, referrals: 3200 },
    { rank: 20, userId: '0x6789...def0', totalPoints: 17800, trading: 15000, referrals: 2800 },
    // Page 3 (ranks 21-30)
    { rank: 21, userId: '0xabcd...1111', totalPoints: 16400, trading: 14000, referrals: 2400 },
    { rank: 22, userId: '0x2222...3333', totalPoints: 15200, trading: 13000, referrals: 2200 },
    { rank: 23, userId: '0x4444...5555', totalPoints: 14000, trading: 12000, referrals: 2000 },
    { rank: 24, userId: '0x6666...7777', totalPoints: 12800, trading: 11000, referrals: 1800 },
    { rank: 25, userId: '0x8888...aaaa', totalPoints: 11600, trading: 10000, referrals: 1600 },
    { rank: 26, userId: '0xbbbb...cccc', totalPoints: 10400, trading: 9000, referrals: 1400 },
    { rank: 27, userId: '0xdddd...ffff', totalPoints: 9200, trading: 8000, referrals: 1200 },
    { rank: 28, userId: '0x0000...1234', totalPoints: 8400, trading: 7200, referrals: 1200 },
    { rank: 29, userId: '0x5678...90ab', totalPoints: 7600, trading: 6500, referrals: 1100 },
    { rank: 30, userId: '0xcdef...0123', totalPoints: 6800, trading: 5800, referrals: 1000 },
    // Page 4 (ranks 31-40)
    { rank: 31, userId: '0x4567...89ab', totalPoints: 6200, trading: 5300, referrals: 900 },
    { rank: 32, userId: '0xcdef...4567', totalPoints: 5600, trading: 4800, referrals: 800 },
    { rank: 33, userId: '0x89ab...cdef', totalPoints: 5000, trading: 4300, referrals: 700 },
    { rank: 34, userId: '0x0123...4567', totalPoints: 4400, trading: 3800, referrals: 600 },
    { rank: 35, userId: '0x89ab...0123', totalPoints: 3800, trading: 3300, referrals: 500 },
    { rank: 36, userId: '0x4567...cdef', totalPoints: 3200, trading: 2800, referrals: 400 },
    { rank: 37, userId: '0xfedc...ba98', totalPoints: 2600, trading: 2300, referrals: 300 },
    { rank: 38, userId: '0x7654...3210', totalPoints: 2000, trading: 1800, referrals: 200 },
    { rank: 39, userId: '0xabcd...ef01', totalPoints: 1400, trading: 1300, referrals: 100 },
    { rank: 40, userId: '0x2345...6789', totalPoints: 800, trading: 700, referrals: 100 },
  ];

  // User's own data
  const userRank = 127;
  const userTotalPoints = 0;
  const userTrading = 0;
  const userReferrals = 0;

  // Paginate data
  const itemsPerPage = 10;
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const leaderboardData = allLeaderboardData.slice(startIndex, endIndex);

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
      {/* Leaderboard Table */}
      <div className="leaderboard-table-section">
        {/* User Profile Section - Top Right */}
        <div className="leaderboard-user-badge">
          {isLoading ? (
            <>
              <div className="leaderboard-user-text">
                <div className="referrals-skeleton leaderboard-username-skeleton"></div>
                <div className="referrals-skeleton leaderboard-rank-skeleton"></div>
              </div>
              <div className="leaderboard-user-pfp-skeleton"></div>
            </>
          ) : (
            <>
              <div className="leaderboard-user-text">
                <span className="leaderboard-username">{displayName}</span>
                <span className="leaderboard-user-rank">Rank #{userRank}</span>
              </div>
              <img src={defaultPfp} className="leaderboard-user-pfp" alt="Profile" />
            </>
          )}
        </div>

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
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
