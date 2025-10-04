import React from 'react';

import './SpreadDisplay.css';

interface SpreadDisplayProps {
  averagePrice: string;
  spread: string;
}

const SpreadDisplay: React.FC<SpreadDisplayProps> = ({
  averagePrice,
  spread,
}) => {
  return (
    <div className="ob-spread">
      <div className="ob-spread-inner">
        <span>
          {t('mid')}:{' '}
          {!!averagePrice
            ? averagePrice
            : t('N/A')}
        </span>
        <span>
          {t('Spread')}:{' '}
          {!!spread
            ? spread
            : t('N/A')}
        </span>
      </div>
    </div>
  );
};

export default SpreadDisplay;
