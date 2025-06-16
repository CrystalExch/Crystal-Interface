import React, { useState } from 'react';

import './TokenIcons.css';

interface TokenIconsProps {
  inIcon: string;
  outIcon: string;
}

const TokenIcons: React.FC<TokenIconsProps> = ({ inIcon, outIcon }) => {
  const [inLoaded, setInLoaded] = useState(false);
  const [outLoaded, setOutLoaded] = useState(false);

  return (
    <div className="token-icons">
      <div className={`token-wrapper ${!inLoaded ? 'loading' : ''}`}>
        <img
          src={inIcon}
          className="token-icon1"
          onLoad={() => setInLoaded(true)}
          style={{ opacity: inLoaded ? 1 : 0 }}
        />
        {!inLoaded && <div className="token-skeleton" />}
      </div>

    </div>
  );
};

export default TokenIcons;
