import React, { useState } from 'react';

import './TokenIcons.css';

interface TokenIconsProps {
  inIcon: string;
}

const TokenIcons: React.FC<TokenIconsProps> = ({ inIcon }) => {
  const [inLoaded, setInLoaded] = useState(false);

  return (
    <div className="token-icons">
      <div className={`token-wrapper ${!inLoaded ? 'loading' : ''}`}>
        <img
          src={inIcon}
          className="token-icon"
          onLoad={() => setInLoaded(true)}
          style={{ opacity: inLoaded ? 1 : 0 }}
        />
        {!inLoaded && <div className="token-skeleton" />}
      </div>

    </div>
  );
};

export default TokenIcons;
