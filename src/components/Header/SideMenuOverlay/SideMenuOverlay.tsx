import React, {  useState } from 'react';
import { createPortal } from 'react-dom';

import NavLinks from '../NavLinks/NavLinks';

import closebutton from '../../../assets/close_button.png';
import './SideMenuOverlay.css';

interface SideMenuOverlayProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  backgroundlesslogo: string;
  setShowTrade: (value: boolean) => void;
  simpleView: boolean;
  setSimpleView: (value: boolean) => void;
}

const SideMenuOverlay: React.FC<SideMenuOverlayProps> = ({
  isMenuOpen,
  toggleMenu,
  backgroundlesslogo,
  setShowTrade,
  simpleView,
  setSimpleView,
}) => {
  const [closing, setClosing] = useState(false);




  const handleClose = () => {
    if (!closing) {
      setClosing(true);
      setTimeout(() => {
        toggleMenu();
        setClosing(false);
      }, 300); 
    }
  };

  if (!isMenuOpen && !closing) return null;

  return createPortal(
    <>
      <span 
        className={`side-menu-overlay ${isMenuOpen && !closing ? 'open' : closing ? 'closing' : ''}`} 
        onClick={handleClose}
      ></span>
      <div 
        className={`side-menu ${isMenuOpen && !closing ? 'open' : closing ? 'closing' : ''}`}
      >
        <div className="side-menu-bg">
          <div className="side-menu-header">
            <div className="side-menu-logo">
              <img src={backgroundlesslogo} className="crystal-logo"/>
              <span className="side-menu-title">CRYSTAL</span>
            </div>
            <button className="close-button" onClick={handleClose}>
              <img src={closebutton} className="sidemenu-close-button-icon"/>
            </button>
          </div>
          <nav className="side-menu-nav">
            <NavLinks
              isSideMenu={true}
              setShowTrade={setShowTrade}
              toggleMenu={toggleMenu}
              simpleView={simpleView}
              setSimpleView={setSimpleView}
            />
          </nav>
        </div>
      </div>
    </>,
    document.body,
  );
};

export default SideMenuOverlay;