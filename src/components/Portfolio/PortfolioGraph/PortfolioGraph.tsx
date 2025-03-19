import React, { memo, useEffect, useRef, useState } from 'react';
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

// Custom tooltip component
const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  chartDays,
}) => {
  if (!active || !payload || !payload.length) return null;

  // Split date and hour
  const parts = label ? label.split(' ') : ['', ''];
  const date = parts[0] || '';
  const hour = parts[1] || '';

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
    const gradientId = `colorValue-${isPopup ? 'popup' : 'main'}-${Math.random().toString(36).substring(2, 7)}`;
    const [errorState, setErrorState] = useState<boolean>(false);
    
    // Format X-axis tick labels
    const formatXAxisTick = (timeStr: string): string => {
      try {
        if (!timeStr) return '';
        const parts = timeStr.split(' ');
        if (parts.length < 2) return timeStr;
        
        const [date, hour] = parts;
        const dateParts = date.split('-');
        if (dateParts.length < 3) return timeStr;
        
        const [, month, day] = dateParts;

        if (chartDays === 1) return `${hour}:00`;
        if (chartDays < 7) return `${month}/${day} ${hour}:00`;
        return `${month}/${day}`;
      } catch (error) {
        console.error("Error formatting tick:", error);
        return timeStr || '';
      }
    };

    // Calculate X-axis interval (how many ticks to show)
    const calculateXAxisInterval = (): number => {
      try {
        // Calculate intervals based on window width and chart days
        const dataPoints = chartData?.length || 0;
        const windowWidth = window.innerWidth || 1000;
        
        // Determine how many ticks should be visible based on window width
        const optimalTickCount = Math.min(12, Math.max(4, Math.floor(windowWidth / 100)));
        
        // Calculate interval to show approximately optimalTickCount ticks
        const interval = Math.max(1, Math.floor(dataPoints / optimalTickCount));
        
        // Ensure there are not too many or too few ticks
        return Math.max(1, Math.min(interval, dataPoints / 4));
      } catch (error) {
        console.error("Error calculating interval:", error);
        return 4; // Default fallback
      }
    };

    // References for time period buttons and the indicator
    const timeButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const indicatorRef = useRef<HTMLDivElement>(null);

    // Update the position of the sliding indicator
    const updateIndicator = () => {
      try {
        const activeButton = timeButtonsRef.current.find((btn) =>
          btn?.classList.contains('active'),
        );
        if (activeButton && indicatorRef.current) {
          indicatorRef.current.style.width = `${activeButton.offsetWidth - 4}px`;
          indicatorRef.current.style.left = `${activeButton.offsetLeft + 2}px`;
        }
      } catch (error) {
        console.error("Error updating indicator:", error);
      }
    };

    // Update indicator position on resize or chart day change
    useEffect(() => {
      try {
        updateIndicator();
        window.addEventListener('resize', updateIndicator);
        return () => window.removeEventListener('resize', updateIndicator);
      } catch (error) {
        console.error("Error in indicator effect:", error);
      }
    }, [chartDays, portChartLoading]);

    // Calculate percentage change and set graph colors
    useEffect(() => {
      try {
        if (chartData?.length > 0) {
          // Filter out zero values
          const validData = chartData.filter(point => point.value > 0);
          
          if (validData.length > 0) {
            // Use first and last valid data points for calculating change
            const firstValue = validData[0].value;
            const lastValue = validData[validData.length - 1].value;
            const change =
              firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
            
            if (onPercentageChange) onPercentageChange(change);
            if (setColorValue) setColorValue(change >= 0 ? '#00b894' : '#d63031');
            
            // Use all non-zero values for high/low calculation
            const nonZeroValues = validData.map(d => d.value);
            if (nonZeroValues.length > 0) {
              const highValue = Math.max(...nonZeroValues);
              const lowValue = Math.min(...nonZeroValues);
              if (setHigh) setHigh(highValue);
              if (setLow) setLow(lowValue);
            }
          } else {
            // Set defaults for empty data
            if (onPercentageChange) onPercentageChange(0);
            if (setColorValue) setColorValue('#00b894');
          }
        } else {
          // Set defaults for empty data
          if (onPercentageChange) onPercentageChange(0);
          if (setColorValue) setColorValue('#00b894');
        }
      } catch (error) {
        console.error("Error processing chart data:", error);
        setErrorState(true);
        // Set safe defaults
        if (onPercentageChange) onPercentageChange(0);
        if (setColorValue) setColorValue('#00b894');
      }
    }, [chartData, onPercentageChange, setColorValue, setHigh, setLow]);

    // If no address, show empty graph
    if (!address) {
      try {
        const startDate = new Date();
        const stepHours =
          chartDays === 1 ? 2 : // 2 hours for 1 day
          chartDays === 7 ? 6 : // 6 hours for 7 days
          chartDays === 14 ? 12 : // 12 hours for 14 days
          24; // 24 hours for 30 days
        
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
                    if (setChartDays) setChartDays(option.value);
                    if (setDays) setDays(option.value);
                    if (setTimeRange) setTimeRange(option.label);
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
      } catch (error) {
        console.error("Error rendering empty graph:", error);
        return (
          <div className="portfolio-graph-container">
            <div className="error-message">Could not load portfolio graph</div>
          </div>
        );
      }
    }
    
    // Check for error state or empty chart data
    if (errorState || !chartData || chartData.length === 0) {
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
                className={`time-period-button ${chartDays === option.value ? 'active' : ''}`}
                onClick={() => {
                  if (setChartDays) setChartDays(option.value);
                  if (setDays) setDays(option.value);
                  if (setTimeRange) setTimeRange(option.label);
                }}
              >
                {option.label}
              </button>
            ))}
            <div ref={indicatorRef} className="time-period-sliding-indicator" />
          </div>
          <div className="graph-wrapper">
            <div className="error-message">No data available</div>
          </div>
        </div>
      );
    }
    
    // Render chart with data
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
              className={`time-period-button ${chartDays === option.value ? 'active' : ''}`}
              onClick={() => {
                if (setChartDays) setChartDays(option.value);
                if (setDays) setDays(option.value);
                if (setTimeRange) setTimeRange(option.label);
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
                // Always include 0 in the domain and add padding at the top
                domain={[(_dataMin: number) => 0, (dataMax: number) => dataMax * 1.1]} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => {
                  try {
                    return `${Math.floor(value)}`;
                  } catch (e) {
                    return '$0';
                  }
                }}
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
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill={`url(#${gradientId})`}
                animationDuration={0}
                isAnimationActive={false}
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
                animationDuration={0}
                isAnimationActive={false}
                connectNulls={true}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  },
);

// Empty graph component
const EmptyGraph: React.FC<{
  data: { time: string; value: number }[];
  gradientId: string;
  isPopup: boolean;
  formatXAxisTick: (timeStr: string) => string;
  calculateXAxisInterval: () => number;
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
            interval={calculateXAxisInterval()}
            tickFormatter={formatXAxisTick}
            style={{
              fontSize: '10px',
              fill: '#636e72',
              display: isPopup ? 'none' : 'block',
            }}
            padding={{ left: 10 }}
          />
          <YAxis
            domain={[(_dataMin: number) => 0, (dataMax: number) => dataMax * 1.1]}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => {
              try {
                return `${Math.floor(value)}`;
              } catch (e) {
                return '$0';
              }
            }}
            style={{ fontSize: '10px', fill: '#636e72' }}
            tickMargin={10}
            orientation="right"
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill={`url(#${gradientId})`}
            animationDuration={0}
            isAnimationActive={false}
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
            animationDuration={0}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  ),
);

export default PortfolioGraph;