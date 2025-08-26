import React from 'react';

import { useTokenData, TokenSymbol } from '../TokenDescriptions';

import infoicon from '../../../../../assets/infoi.svg';

import './TokenInfoPopup.css';

interface TokenInfoPopupProps {
  symbol: TokenSymbol;
  setpopup: (value: number) => void;
}

const TokenInfoPopup: React.FC<TokenInfoPopupProps> = ({ symbol, setpopup }) => {
  const tokenData = useTokenData();
  const info = tokenData[symbol];
  if (!info) return null;

  return (
    <div className="token-info-button-container">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setpopup(7);
        }}
        className="token-info-button"
      >
        <img src={infoicon} className="token-info-popup-icon" />
      </button>
    </div>
  );
};

export default TokenInfoPopup;