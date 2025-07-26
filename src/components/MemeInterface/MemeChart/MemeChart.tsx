import React, { useEffect, useState } from 'react';
import MemeAdvancedChart from './MemeAdvancedChart';
import Overlay from '../../loading/LoadingComponent';
import { settings } from '../../../settings';

import './MemeChart.css';

interface TimeFrameSelectorProps {
  selectedInterval: string;
  handleTimeChange: (interval: string) => void;
}

const TimeFrameSelector: React.FC<TimeFrameSelectorProps> = ({
  selectedInterval,
  handleTimeChange,
}) => {
  const timeframes = [
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1d', value: '1d' },
  ];

  return (
    <div className="meme-timeframe-selector">
      {timeframes.map((tf) => (
        <button
          key={tf.value}
          className={`meme-timeframe-button ${selectedInterval === tf.value ? 'active' : ''}`}
          onClick={() => handleTimeChange(tf.value)}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
};

const UTCClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: 'UTC',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="meme-utc-clock">
      <span className="meme-utc-label">UTC</span>
      <span className="meme-utc-time">{formatTime(time)}</span>
    </div>
  );
};

interface MemeChartProps {
  token: any;
  data: any;
  selectedInterval: string;
  setSelectedInterval: (interval: string) => void;
  setOverlayVisible: (visible: boolean) => void;
  realtimeCallbackRef: any;
}

const MemeChart: React.FC<MemeChartProps> = ({
  token,
  data,
  selectedInterval,
  setSelectedInterval,
  setOverlayVisible,
  realtimeCallbackRef,
}) => {
  const [overlayVisible, setLocalOverlayVisible] = useState(true);
  const [lastPair, setLastPair] = useState('');

  // Use advanced chart by default for meme tokens, but can be configured
  const useAdvancedChart = settings.useAdv !== false; // Default to true for meme charts

  useEffect(() => {
    const currentPair = `${token.symbol}MON${selectedInterval}`;
    setLastPair((lastPair) => {
      if (currentPair !== lastPair && !useAdvancedChart) {
        setLocalOverlayVisible(true);
        setOverlayVisible(true);
      }
      return currentPair;
    });
  }, [token.symbol, selectedInterval, useAdvancedChart, setOverlayVisible]);

  const handleOverlayChange = (visible: boolean) => {
    setLocalOverlayVisible(visible);
    setOverlayVisible(visible);
  };

  return (
    <div className="meme-chartwrapper">
      {useAdvancedChart ? (
        <MemeAdvancedChart
          data={data}
          token={token}
          selectedInterval={selectedInterval}
          setSelectedInterval={setSelectedInterval}
          setOverlayVisible={handleOverlayChange}
          realtimeCallbackRef={realtimeCallbackRef}
        />
      ) : (
        <>
          <div className="meme-chart-options">
            <UTCClock />
            <TimeFrameSelector
              selectedInterval={selectedInterval}
              handleTimeChange={setSelectedInterval}
            />
          </div>
          {/* Basic chart component would go here if needed */}
          <div className="meme-basic-chart-container">
            <div className="meme-chart-placeholder">
              <span>Basic Chart View (Not Implemented)</span>
            </div>
          </div>
        </>
      )}
      
      {/* Loading overlay */}
      <Overlay isVisible={overlayVisible} bgcolor={'rgb(6,6,6)'} height={15} maxLogoHeight={100}/>
    </div>
  );
};

export default MemeChart;