import React, { memo, useEffect, useRef } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import { Payload } from 'recharts/types/component/DefaultTooltipContent';

import { useSharedContext } from '../../../contexts/SharedContext';
import { ScaledDataPoint } from './types';

import './PortfolioGraph.css';

interface PortfolioGraphProps {
  address: string;
  colorValue: string;
  setColorValue: (color: string) => void;
  isPopup: boolean;
  onPercentageChange: (value: number) => void;
  chartData: ScaledDataPoint[];
  portChartLoading: any;
  chartDays: any;
  setChartDays: any;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  chartDays: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  chartDays,
}) => {
  if (!active || !payload || !payload.length) return null;

  const [date, hour] = label.split(' ');
  const formattedTime =
    chartDays === 1
      ? `${hour}:00`
      : chartDays <= 14
        ? `${date} ${hour}:00`
        : date;

  return (
    <div
      style={{
        background: 'none',
        border: 'none',
      }}
    >
      <p
        style={{
          color: '#ffffff80',
          fontSize: '12px',
          fontWeight: '300',
          margin: 0,
        }}
      >
        $
        {typeof payload[0]?.value === 'number'
          ? payload[0].value.toFixed(2)
          : '0'}
      </p>
      <p
        style={{
          color: '#ffffff80',
          fontSize: '12px',
          fontWeight: '300',
          margin: '0 0 -2px 0',
        }}
      >
        {formattedTime}
      </p>
    </div>
  );
};

const PortfolioGraph: React.FC<PortfolioGraphProps> = memo(
  ({
    address,
    colorValue,
    setColorValue,
    isPopup,
    onPercentageChange,
    chartData,
    portChartLoading,
    chartDays,
    setChartDays,
  }) => {
    const { setHigh, setLow, setDays, setTimeRange } = useSharedContext();
    const gradientId = `colorValue-${isPopup ? 'popup' : 'main'}`;

    const formatXAxisTick = (timeStr: string): string => {
      const [date, hour] = timeStr.split(' ');
      const [, month, day] = date.split('-');

      if (chartDays === 1) return `${hour}:00`;
      if (chartDays < 7) return `${month}/${day} ${hour}:00`;
      return `${month}/${day}`;
    };

    const calculateXAxisInterval = (): number => {
      switch (chartDays) {
        case 1:
          return Math.floor(1 * 1736 / window.innerWidth);
        case 7:
          return Math.floor(7 * 1736 / window.innerWidth);
        case 14:
          return Math.floor(7 * 1736 / window.innerWidth);
        case 30:
          return Math.floor(1 * 1736 / window.innerWidth);
        default:
          return Math.floor(7 * 1736 / window.innerWidth);
      }
    };

    const timeButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const indicatorRef = useRef<HTMLDivElement>(null);

    const updateIndicator = () => {
      const activeButton = timeButtonsRef.current.find((btn) =>
        btn?.classList.contains('active'),
      );
      if (activeButton && indicatorRef.current) {
        indicatorRef.current.style.width = `${activeButton.offsetWidth - 4}px`;
        indicatorRef.current.style.left = `${activeButton.offsetLeft + 2}px`;
      }
    };

    useEffect(() => {
      updateIndicator();
      window.addEventListener('resize', updateIndicator);
      return () => window.removeEventListener('resize', updateIndicator);
    }, [chartDays, portChartLoading]);

    useEffect(() => {
      if (chartData?.length > 0) {
        const firstValue = chartData[0].value;
        const lastValue = chartData[chartData.length - 1].value;
        const change =
          firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
        onPercentageChange?.(change);
        setColorValue?.(change >= 0 ? '#00b894' : '#d63031');
        setHigh(Math.max(...chartData.map((d) => d.value)) || 0);
        setLow(Math.min(...chartData.map((d) => d.value)) || 0);
      }
    }, [chartData]);

    if (!address) {
      const startDate = new Date();
      const stepHours =
        chartDays === 1 ? 1 : chartDays === 7 ? 3 : chartDays === 14 ? 6 : 15;
      let dateRange: any[] = [];
      const totalSteps = Math.ceil((chartDays * 24) / stepHours);

      for (let i = totalSteps - 1; i >= 0; i--) {
        const date = new Date(
          startDate.getTime() - i * stepHours * 60 * 60 * 1000,
        );
        dateRange.push({
          time: `${date.toISOString().split('T')[0]} ${date.toISOString().split('T')[1].substring(0, 2)}`,
          value: 0,
        });
      }
      const emptyData = dateRange;
      return (
        <div className="portfolio-graph-container">
          <div className="chart-days-dropdown">
            {[
              { value: 1, label: '24H' },
              { value: 7, label: '7D' },
              { value: 14, label: '14D' },
              { value: 30, label: '30D' },
            ].map((option, index) => (
              <button
                key={option.value}
                ref={(el) => (timeButtonsRef.current[index] = el)}
                className={`time-period-button ${chartDays === option.value ? 'active' : ''}`}
                onClick={() => {
                  setChartDays(option.value);
                  setDays(option.value);
                  setTimeRange(option.label);
                }}
              >
                {option.label}
              </button>
            ))}
            <div ref={indicatorRef} className="time-period-sliding-indicator" />
          </div>
          <EmptyGraph
            data={emptyData}
            gradientId={gradientId}
            isPopup={isPopup}
            formatXAxisTick={formatXAxisTick}
            calculateXAxisInterval={calculateXAxisInterval}
          />
        </div>
      );
    }
    return (
      <div className="portfolio-graph-container">
        <div className="chart-days-dropdown" style={isPopup ? {top: '-25px'} : {}}>
          {[
            { value: 1, label: '24H' },
            { value: 7, label: '7D' },
            { value: 14, label: '14D' },
            { value: 30, label: '30D' },
          ].map((option, index) => (
            <button
              key={option.value}
              ref={(el) => (timeButtonsRef.current[index] = el)}
              className={`time-period-button ${chartDays === option.value ? 'active' : 'disabled'}`}
              onClick={() => {
              }}
            >
              {option.label}
            </button>
          ))}
          <div ref={indicatorRef} className="time-period-sliding-indicator" />
        </div>
        <div className="graph-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colorValue} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={colorValue} stopOpacity={0} />
                </linearGradient>
              </defs>
              {!isPopup && (
                <rect
                  x="2%"
                  y="-5%"
                  width="93%"
                  height="93%"
                  fill="none"
                  className="grid-background"
                />
              )}
              <CartesianGrid
                stroke="transparent"
                strokeDasharray="0"
                horizontal={false}
                vertical={false}
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                interval={calculateXAxisInterval()}
                tickFormatter={formatXAxisTick}
                style={{
                  fontSize: '11px',
                  fill: '#636e72',
                  display: isPopup ? 'none' : 'block',
                }}
                padding={{ left: 10 }}
              />
              <YAxis
                domain={['auto', 'auto']} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                style={{ fontSize: '11px', fill: '#636e72' }}
                orientation="right"
                width={isPopup ? 20 : undefined}
                tick={isPopup ? false : true}
              />
              <Tooltip
                cursor={{ stroke: '#ffffff20', strokeWidth: 1 }}
                content={({ active, payload, label }) => (
                  <CustomTooltip
                    active={active}
                    payload={payload as Payload<number, string>[]}
                    label={label}
                    chartDays={chartDays}
                  />
                )}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill={`url(#${gradientId})`}
                animationDuration={1000}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colorValue}
                strokeWidth={2}
                dot={{ r: 0 }}
                activeDot={{
                  r: 4,
                  stroke: colorValue,
                  strokeWidth: 2,
                  fill: '#16171c',
                }}
                animationDuration={1000}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  },
);

const EmptyGraph: React.FC<{
  data: { time: string; value: number }[];
  gradientId: string;
  isPopup: boolean;
  formatXAxisTick: (timeStr: string) => string;
  calculateXAxisInterval: (totalPoints: number) => number;
}> = memo(
  ({ data, gradientId, isPopup, formatXAxisTick, calculateXAxisInterval }) => (
    <div className="graph-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00b894" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#00b894" stopOpacity={0} />
            </linearGradient>
          </defs>
          {!isPopup && (
            <rect
              x="2%"
              y="-5%"
              width="90%"
              height="93%"
              fill="none"
              className="grid-background"
            />
          )}
          <CartesianGrid
            stroke="transparent"
            strokeDasharray="0"
            horizontal={false}
            vertical={false}
          />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            interval={calculateXAxisInterval(data.length)}
            tickFormatter={formatXAxisTick}
            style={{
              fontSize: '10px',
              fill: '#636e72',
              display: isPopup ? 'none' : 'block',
            }}
            padding={{ left: 10 }}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            style={{ fontSize: '10px', fill: '#636e72' }}
            tickMargin={10}
            orientation="right"
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill={`url(#${gradientId})`}
            animationDuration={1000}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#00b894"
            strokeWidth={2}
            dot={{ r: 0 }}
            activeDot={{
              r: 4,
              stroke: '#00b894',
              strokeWidth: 2,
              fill: '#16171c',
            }}
            animationDuration={1000}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  ),
);

export default PortfolioGraph;