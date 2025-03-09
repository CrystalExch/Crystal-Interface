import React, { useEffect, useState } from 'react';

import { getTime } from '../utils';

import './UTCClock.css';

const UTCClock: React.FC = () => {
  const [localTime, setLocalTime] = useState<string>('');

  useEffect(() => {
    const intervalId = setInterval(() => {
      setLocalTime(getTime());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return <span className="utc-clock">{localTime}</span>;
};

export default UTCClock;
