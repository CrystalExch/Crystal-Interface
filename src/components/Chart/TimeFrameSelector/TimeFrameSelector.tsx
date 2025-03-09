import React, { useEffect, useRef } from 'react';

import TimeButton from '../TimeButton/TimeButton';

import './TimeFrameSelector.css';

interface TimeFrameSelectorProps {
  selectedInterval: string;
  handleTimeChange: (interval: string) => void;
}

const TimeFrameSelector: React.FC<TimeFrameSelectorProps> = ({
  selectedInterval,
  handleTimeChange,
}) => {
  const timeButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const intervals = ['1m', '5m', '15m', '1h', '4h', '1d'];

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
  }, [selectedInterval]);

  return (
    <div className="timeframe">
      {intervals.map((interval, index) => (
        <TimeButton
          key={interval}
          interval={interval}
          index={index}
          selectedInterval={selectedInterval}
          handleTimeChange={handleTimeChange}
          timeButtonsRef={timeButtonsRef}
        />
      ))}
      <div ref={indicatorRef} className="chart-sliding-indicator" />
    </div>
  );
};

export default TimeFrameSelector;
