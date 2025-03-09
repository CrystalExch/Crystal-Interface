import React from 'react';

import uiLogo from '../../assets/logo_clear.png';

import './LoadingComponent.css';

interface OverlayProps {
  isVisible: boolean;
  bgcolor: string;
  height?: number;
}

const Overlay: React.FC<OverlayProps> = ({
  isVisible,
  bgcolor,
  height = 0,
}) => {
  if (!isVisible) return null;

  return (
    <div className="componentoverlay" style={{ background: bgcolor }}>
      <img
        className="logo-pulse-component"
        src={uiLogo}
        style={{ height: height == 0 ? '20%' : `${height}%` }}
      />
    </div>
  );
};

export default Overlay;
