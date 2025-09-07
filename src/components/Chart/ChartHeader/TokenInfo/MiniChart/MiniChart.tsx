import React, { useState, useEffect } from 'react';

import { ComposedChart, Line, Area, ResponsiveContainer, YAxis } from 'recharts';

import './MiniChart.css';

interface MiniChartProps {
  market: any;
  series: any[];
  priceChange: string;
  isVisible: boolean;
  height?: number;
  width?: number;
}

const MiniChart: React.FC<MiniChartProps> = ({
  market,
  series,
  priceChange,
  isVisible,
  height = 30,
  width = 80,
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [yAxisDomain, setYAxisDomain] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    if (!isVisible || !market || !Array.isArray(series) || series.length === 0) return;

    const rawData = series
      .map((dp) => {
        const rawTime = typeof dp.time === 'number' ? dp.time : new Date(dp.time).getTime();
        const t = rawTime < 1e12 ? rawTime * 1000 : rawTime;
        const p = dp.value ?? dp.price ?? dp.close;
        return (typeof p === 'number' && Number.isFinite(p)) ? { time: t, price: p } : null;
      })
      .filter((x): x is { time: number; price: number } => !!x)
      .sort((a, b) => a.time - b.time);

    if (rawData.length === 0) return;

    let filtered = rawData;
    if (rawData.length > 30) {
      const rate = Math.max(1, Math.floor(rawData.length / 30));
      filtered = rawData.filter((_, i) => i % rate === 0);
      if (filtered[0].time !== rawData[0].time) filtered.unshift(rawData[0]);
      if (filtered[filtered.length - 1].time !== rawData[rawData.length - 1].time) {
        filtered.push(rawData[rawData.length - 1]);
      }
    }

    setChartData(filtered);

    const prices = filtered.map((d) => d.price);
    let minP = Math.min(...prices);
    let maxP = Math.max(...prices);

    if (minP === maxP) {
      const eps = Math.max(1e-8, Math.abs(minP) * 0.005);
      minP -= eps;
      maxP += eps;
    }

    const topPad = (maxP - minP) * 0.1;
    const botPad = (maxP - minP) * 0.25;
    setYAxisDomain([minP - botPad, maxP + topPad]);
  }, [market, series, isVisible]);

  if (!isVisible || chartData.length === 0) {
    return null;
  }

  const chartColor = priceChange[0] === '+' ? "#50f08d" : "#ef5151";
  const gradientId = `chart-gradient-${market?.marketKey || market.baseAsset + market.quoteAsset}`;

  return (
    <div className="mini-chart" style={{ height, width }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} style={{ cursor: 'pointer' }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <YAxis domain={yAxisDomain} hide />

          <Area
            type="monotone"
            dataKey="price"
            stroke="none"
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            isAnimationActive={false}
          />

          <Line
            type="monotone"
            dataKey="price"
            stroke={chartColor}
            dot={false}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniChart;
