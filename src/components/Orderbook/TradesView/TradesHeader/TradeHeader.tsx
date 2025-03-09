import React from 'react';

import './TradeHeader.css';

interface TradeHeaderProps {
  show: boolean;
}

const TradeHeader: React.FC<TradeHeaderProps> = ({ show }) => {
  return (
    <div className={`trades-header ${!show ? 'hidden' : ''}`}>
      <span style={{ width: '33%', textAlign: 'left' }}>{t('price')}</span>
      <span style={{ width: '33%', textAlign: 'center' }}>
        {t('size')} [USDC]
      </span>
      <span style={{ width: '33%', textAlign: 'right' }}>{t('time')}</span>
    </div>
  );
};

export default TradeHeader;
