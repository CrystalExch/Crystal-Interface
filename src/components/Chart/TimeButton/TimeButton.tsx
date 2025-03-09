import React from 'react';

import './TimeButton.css';

interface TimeButtonProps {
  interval: string;
  index: number;
  selectedInterval: string;
  handleTimeChange: (interval: string) => void;
  timeButtonsRef: React.MutableRefObject<(HTMLButtonElement | null)[]>;
}

const TimeButton: React.FC<TimeButtonProps> = ({
  interval,
  index,
  selectedInterval,
  handleTimeChange,
  timeButtonsRef,
}) => (
  <button
    ref={(el) => (timeButtonsRef.current[index] = el)}
    className={`chart-time-button ${selectedInterval === interval ? 'active' : ''}`}
    onClick={() => handleTimeChange(interval)}
  >
    {interval}
  </button>
);

export default TimeButton;
