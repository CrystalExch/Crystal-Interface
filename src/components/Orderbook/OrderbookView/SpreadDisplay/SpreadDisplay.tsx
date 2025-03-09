import React from 'react';

import { formatCommas } from '../../../../utils/numberDisplayFormat';

import './SpreadDisplay.css';

interface SpreadDisplayProps {
  averagePrice: number;
  spread: number;
  priceFactor: number;
}

const SpreadDisplay: React.FC<SpreadDisplayProps> = ({
  averagePrice,
  spread,
  priceFactor,
}) => {
  return (
    <div className="ob-spread">
      <div className="ob-spread-inner">
        <span>
          {t('mid')}:{' '}
          {!isNaN(averagePrice) && priceFactor != 0
            ? formatCommas(averagePrice.toFixed(Math.log10(priceFactor)))
            : t('N/A')}
        </span>
        <span>
          {t('Spread')}:{' '}
          {averagePrice && !isNaN(spread)
            ? `${((spread / averagePrice) * 100).toFixed(2)}%`
            : t('N/A')}
        </span>
      </div>
    </div>
  );
};

export default SpreadDisplay;
