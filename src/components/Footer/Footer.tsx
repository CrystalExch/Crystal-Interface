import React from 'react';
import './Footer.css';
import OnlineStatus from './OnlineStatus/OnlineStatus';
import SocialLinks from './SocialLinks/SocialLinks';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content-left">
        <div className="footer-left">
          <OnlineStatus />
        </div>
      </div>
      <div className="footer-content-right">
        <div className="footer-right">
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
