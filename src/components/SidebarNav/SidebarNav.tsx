import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SidebarNav.css';
import { useLanguage } from '../../contexts/LanguageContext';
import candlestick from '../../assets/candlestick.png';
import portfolio from '../../assets/wallet_icon.png';
import referrals from '../../assets/referrals.png';
import leaderboard from '../../assets/leaderboard.png';
import swap from '../../assets/circulararrow.png';
import twitter from '../../assets/twitter.png';
import discord from '../../assets/Discord.svg'
import docs from '../../assets/docs.png';

interface SidebarNavProps {
  simpleView: boolean;
  setSimpleView: (value: boolean) => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ simpleView, setSimpleView }) => {
  const location = useLocation();
  const path = location.pathname;
  const { t } = useLanguage();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [expanded, setExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const backgroundlesslogo = '/CrystalLogo.png';


  const isMobile = windowWidth <= 1020;


  const handleSidebarMouseEnter = () => {
    if (!isMobile) {
      setExpanded(true);
      document.body.classList.add('sidebar-hover-overlay');
    }
  };

  const handleSidebarMouseLeave = () => {
    if (!isMobile) {
      setExpanded(false);
      document.body.classList.remove('sidebar-hover-overlay');
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      if (newWidth <= 1020) {
        setExpanded(false);
      }
      if (newWidth > 1020 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [expanded, mobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen && event.target instanceof Element) {
        const mobileMenu = document.querySelector('.mobile-hamburger-menu');
        const hamburgerButton = document.querySelector('.mobile-hamburger-button');
        
        if (mobileMenu && !mobileMenu.contains(event.target) && 
            hamburgerButton && !hamburgerButton.contains(event.target)) {
          setMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const isTradingPage = ['/swap', '/limit', '/send', '/scale', '/market'].some(tradePath =>
    path === tradePath || path.startsWith(tradePath)
  );


  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <div 
        className={`sidebar-nav ${simpleView ? 'simple-view' : 'advanced-view'} ${expanded ? 'expanded' : 'collapsed'}`}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <div className="sidebar-nav-inner">
          {!isMobile && (
            <Link to="/" className="sidebar-logo">
              <img src={backgroundlesslogo} className="sidebar-logo-image" />
              <span className="sidebar-logo-text">CRYSTAL</span>
            </Link>
          )}

          <div className="sidebar-links">
            <Link
              to="/market"
              className={`view-mode-button ${path === '/market' || (isTradingPage && !simpleView) ? 'active' : ''}`}
              onClick={(e) => {
                if (location.pathname === '/market') {
                  e.preventDefault();
                } else {
                  setSimpleView(false);
                }
              }}
            >
              <img src={candlestick} className="sidebar-icon" />
              <span className="sidebar-label">{t('advancedView')}</span>
            </Link>

            <Link
              to="/swap"
              className={`view-mode-button ${path === '/swap' || (isTradingPage && simpleView) ? 'active' : ''}`}
              onClick={(e) => {
                if (location.pathname === '/swap') {
                  e.preventDefault();
                } else {
                  setSimpleView(true);
                }
              }}
            >
              <img src={swap} className="sidebar-icon" />
              <span className="sidebar-label">{t('simpleView')}</span>
            </Link>

            <Link
              to="/portfolio"
              className={`page-mode-button ${path === '/portfolio' ? 'active' : ''}`}
            >
              <img src={portfolio} className="sidebar-icon" />
              <span className="sidebar-label">{t('portfolio')}</span>
            </Link>

            <Link
              to="/referrals"
              className={`page-mode-button ${path === '/referrals' ? 'active' : ''}`}
            >
              <img src={referrals} className="sidebar-icon" />
              <span className="sidebar-label">{t('referrals')}</span>
            </Link>

            <Link
              to="/leaderboard"
              className={`page-mode-button ${path === '/leaderboard' ? 'active' : ''}`}
            >
              <img src={leaderboard} className="sidebar-icon" />
              <span className="sidebar-label">{t('leaderboard')}</span>
            </Link>
                    {isMobile && (
          <button
            onClick={toggleMobileMenu}
            className="mobile-hamburger-button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
          </div>

          {!isMobile && (
            <div className="sidebar-bottom">
              <a
                href="https://docs.crystal.exchange"
                target="_blank"
                rel="noreferrer"
                className="sidebar-bottom-link"
              >
                <img src={docs} className="sidebar-icon" />
                <span className="sidebar-label">{t('docs')}</span>
              </a>
              <a
                href="https://discord.gg/CrystalExch"
                target="_blank"
                rel="noreferrer"
                className="sidebar-bottom-link"
              >
                <img src={discord} className="sidebar-icon" />
                <span className="sidebar-label">{t('discord')}</span>
              </a>
              <a
                href="https://x.com/CrystalExch"
                target="_blank"
                rel="noreferrer"
                className="sidebar-bottom-link"
              >
                <img src={twitter} className="sidebar-icon" />
                <span className="sidebar-label">{'X / ' + t('twitter')}</span>
              </a>
            </div>
          )}
        </div>

      </div>

      {isMobile && (
        <>
          <div 
            className={`mobile-menu-backdrop ${mobileMenuOpen ? 'open' : ''}`}
            onClick={closeMobileMenu}
          />
          
          <div className={`mobile-hamburger-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-menu-header">
              <div className="mobile-menu-logo">
                <img src={backgroundlesslogo} className="mobile-menu-logo-image" />
              </div>
              <button onClick={closeMobileMenu} className="mobile-menu-close">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="mobile-menu-content">

              
              <div className="mobile-menu-section">
                                <a
                  href="https://docs.crystal.exchange"
                  target="_blank"
                  rel="noreferrer"
                  className="mobile-menu-item"
                  onClick={closeMobileMenu}
                >
                  <img src={docs} className="mobile-menu-icon" />
                  <span>{t('docs')}</span>
                </a>
                <a
                  href="https://discord.gg/CrystalExch"
                  target="_blank"
                  rel="noreferrer"
                  className="mobile-menu-item"
                  onClick={closeMobileMenu}
                >
                  <img src={discord} className="mobile-menu-icon" />
                  <span>{t('discord')}</span>
                </a>
                <a
                  href="https://x.com/CrystalExch"
                  target="_blank"
                  rel="noreferrer"
                  className="mobile-menu-item"
                  onClick={closeMobileMenu}
                >
                  <img src={twitter} className="mobile-menu-icon" />
                  <span>{'X / ' + t('twitter')}</span>
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SidebarNav;