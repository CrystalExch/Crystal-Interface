
import React from 'react';

import './LoadingComponent.css';

interface OverlayProps {
  isVisible: boolean;
  bgcolor: string;
  height?: number;
  minLogoHeight?: number;
  maxLogoHeight?: number;
}

const Overlay: React.FC<OverlayProps> = ({
  isVisible,
  bgcolor,
  height = 0,
  minLogoHeight = 50,
  maxLogoHeight = 100,
}) => {
  if (!isVisible) return null;
  const uiLogo = '/3dlogo.png';

  const calculateLogoStyle = () => {
    const heightPercentage = height === 0 ? '20%' : `${height}%`;
    
    return {
      height: heightPercentage,
      minHeight: `${minLogoHeight}px`,
      maxHeight: `${maxLogoHeight}px`,
    };
  };
  
  return (
    <div className="componentoverlay" style={{ background: bgcolor }}>
      <img
        className="logo-pulse-component"
        src={uiLogo}
        style={calculateLogoStyle()}
      />
    </div>
  );
};

export default Overlay;