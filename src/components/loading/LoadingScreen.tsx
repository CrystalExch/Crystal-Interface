import React from 'react';

import './LoadingScreen.css';

interface OverlayProps {
  isVisible: boolean;
}

const FullScreenOverlay: React.FC<OverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  const uiLogo = '/CrystalLogo.png';

  return (
    <div className="overlay">
      <img className="logo-pulse" src={uiLogo} />
    </div>
  );
};

export default FullScreenOverlay;
