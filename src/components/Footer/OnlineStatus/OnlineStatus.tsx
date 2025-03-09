import React from 'react';

import useOnlineStatus from '../utils/useOnlineStatus';

import './OnlineStatus.css';

const OnlineStatus: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div className={`online-status ${isOnline ? 'online' : 'offline'}`}>
      <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
      <span className="status-text">
        {isOnline ? t('online') : t('offline')}
      </span>
    </div>
  );
};

export default OnlineStatus;
