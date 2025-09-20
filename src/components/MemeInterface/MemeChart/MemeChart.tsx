import React, { useEffect, useState } from 'react';
import { settings } from '../../../settings';
import Overlay from '../../loading/LoadingComponent';
import MemeAdvancedChart from './MemeAdvancedChart';

import './MemeChart.css';

interface TimeFrameSelectorProps {
  selectedInterval: string;
  handleTimeChange: any;
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
  realtimeCallbackRef: any;
  monUsdPrice?: number;
  tradehistory?: any[];
  isMarksVisible?: boolean;
}

const MemeChart: React.FC<MemeChartProps> = ({
  token,
  data,
  selectedInterval,
  setSelectedInterval,
  realtimeCallbackRef,
  monUsdPrice,
  tradehistory,
  isMarksVisible,
}) => {
  const [overlayVisible, setLocalOverlayVisible] = useState(true);

  const useAdvancedChart = settings.useAdv !== false;

  const handleOverlayChange = (visible: boolean) => {
    setLocalOverlayVisible(visible);
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
          tradehistory={tradehistory}
          isMarksVisible={isMarksVisible}
          realtimeCallbackRef={realtimeCallbackRef}
          monUsdPrice={monUsdPrice}
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
          <div className="meme-basic-chart-container">
            <div className="meme-chart-placeholder">
              <span>Basic Chart View (Not Implemented)</span>
            </div>
          </div>
        </>
      )}

      <Overlay
        isVisible={overlayVisible}
        bgcolor={'rgb(6,6,6)'}
        height={15}
        maxLogoHeight={100}
      />
    </div>
  );
};

export default MemeChart;
