import React from 'react';

import uiLogo from '../../assets/logo_clear.png';

import './LoadingScreen.css';

interface OverlayProps {
  isVisible: boolean;
}

const FullScreenOverlay: React.FC<OverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="overlay">
      <img className="logo-pulse" src={uiLogo} />
    </div>
  );
};

export default FullScreenOverlay;
