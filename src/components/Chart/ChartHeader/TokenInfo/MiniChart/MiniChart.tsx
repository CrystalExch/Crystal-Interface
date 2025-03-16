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
    if (!isVisible || !market || !series || series.length === 0) return;

    const rawData = series.map((dp) => ({
      time: new Date(dp.time).getTime(),
      price: dp.close,
    }));
    
    let filteredData = rawData;
    if (rawData.length > 30) {
      const samplingRate = Math.max(1, Math.floor(rawData.length / 30));
      filteredData = rawData.filter((_, index) => index % samplingRate === 0);
      
      if (filteredData.length > 0 && rawData.length > 0) {
        if (filteredData[0].time !== rawData[0].time) {
          filteredData.unshift(rawData[0]);
        }
        if (filteredData[filteredData.length - 1].time !== rawData[rawData.length - 1].time) {
          filteredData.push(rawData[rawData.length - 1]);
        }
      }
    }
    
    setChartData(filteredData);
    
    if (filteredData.length > 0) {
      const prices = filteredData.map(item => item.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const topPadding = (maxPrice - minPrice) * 0.1;
      const bottomPadding = (maxPrice - minPrice) * 0.25;
      setYAxisDomain([minPrice - bottomPadding, maxPrice + topPadding]);
    }
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
