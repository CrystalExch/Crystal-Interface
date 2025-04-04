import React from 'react';
import spinninglogo from '../../assets/spinninglogo.gif';
import './LoadingScreen.css';

interface OverlayProps {
  isVisible: boolean;
}

const FullScreenOverlay: React.FC<OverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="overlay">
      <img className="logo" src={spinninglogo} alt="Loading" />
    </div>
  );
};

export default FullScreenOverlay;