import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface ReferralChartsProps {
  referredCount: number;
  commissionBonus: number;
  totalClaimableFees: number;
}

interface HistoricalDataPoint {
  timestamp: number;
  referredCount: number;
  crystalsEarned: number;
  claimableFees: number;
  date: string;
}

const ReferralCharts: React.FC<ReferralChartsProps> = ({
  referredCount,
  commissionBonus,
  totalClaimableFees,
}) => {
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>(
    []
  );
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>(
    '30d'
  );

  // Collect and store historical data
  useEffect(() => {
    const historyKey = 'crystal_referral_history';
    const lastCaptureKey = 'crystal_last_capture';

    const lastCapture = localStorage.getItem(lastCaptureKey);
    const now = Date.now();

    // Capture daily snapshot (once per 24 hours)
    if (
      !lastCapture ||
      now - parseInt(lastCapture) > 24 * 60 * 60 * 1000
    ) {
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');

      // Add new data point
      history.push({
        timestamp: now,
        referredCount,
        crystalsEarned: commissionBonus,
        claimableFees: totalClaimableFees,
        date: new Date(now).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      });

      // Keep only last 90 days
      const filtered = history.filter(
        (d: HistoricalDataPoint) =>
          d.timestamp > now - 90 * 24 * 60 * 60 * 1000
      );

      localStorage.setItem(historyKey, JSON.stringify(filtered));
      localStorage.setItem(lastCaptureKey, now.toString());
      setHistoricalData(filtered);
    } else {
      // Load existing data
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      setHistoricalData(history);
    }
  }, [referredCount, commissionBonus, totalClaimableFees]);

  // Filter data based on selected date range
  const getFilteredData = () => {
    const now = Date.now();
    const ranges = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      all: Infinity,
    };

    return historicalData.filter(
      (d) => now - d.timestamp < ranges[dateRange]
    );
  };

  const filteredData = getFilteredData();

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-date">{payload[0].payload.date}</p>
          <p className="chart-tooltip-value">
            <span className="chart-tooltip-label">Referrals:</span>{' '}
            <span className="chart-tooltip-number">
              {payload[0].payload.referredCount}
            </span>
          </p>
          <p className="chart-tooltip-value">
            <span className="chart-tooltip-label">Crystals:</span>{' '}
            <span className="chart-tooltip-number">
              {payload[0].payload.crystalsEarned}
            </span>
          </p>
          <p className="chart-tooltip-value">
            <span className="chart-tooltip-label">Earnings:</span>{' '}
            <span className="chart-tooltip-number">
              ${payload[0].payload.claimableFees.toFixed(2)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (filteredData.length === 0) {
    return (
      <div className="referral-charts-container">
        <div className="charts-header">
          <h3 className="charts-title">Performance Over Time</h3>
          <p className="charts-subtitle">
            Historical data will appear after 24 hours
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="referral-charts-container">
      <div className="charts-header">
        <h3 className="charts-title">Performance Over Time</h3>
        <div className="date-range-selector">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              className={`date-range-button ${
                dateRange === range ? 'active' : ''
              }`}
              onClick={() => setDateRange(range)}
            >
              {range === 'all' ? 'All' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="charts-grid">
        {/* Referrals Chart */}
        <div className="chart-card">
          <h4 className="chart-card-title">Total Referrals</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1f" />
              <XAxis
                dataKey="date"
                stroke="#aaaecf"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="#aaaecf" fontSize={12} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="referredCount"
                stroke="#aaaecf"
                strokeWidth={2}
                dot={{ fill: '#aaaecf', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Crystals Chart */}
        <div className="chart-card">
          <h4 className="chart-card-title">Crystals Earned</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1f" />
              <XAxis
                dataKey="date"
                stroke="#aaaecf"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="#aaaecf" fontSize={12} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="crystalsEarned"
                stroke="#9a9ec7"
                strokeWidth={2}
                dot={{ fill: '#9a9ec7', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Earnings Chart */}
        <div className="chart-card">
          <h4 className="chart-card-title">Claimable Earnings ($)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1f" />
              <XAxis
                dataKey="date"
                stroke="#aaaecf"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="#aaaecf" fontSize={12} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="claimableFees"
                stroke="#8b8eb8"
                strokeWidth={2}
                dot={{ fill: '#8b8eb8', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ReferralCharts;
