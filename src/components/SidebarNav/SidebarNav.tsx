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

import SidebarTooltip from './SidebarTooltip';

interface SidebarNavProps {
  simpleView: boolean;
  setSimpleView: (value: boolean) => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ simpleView, setSimpleView }) => {
  const location = useLocation();
  const path = location.pathname;
  const { t } = useLanguage();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem('crystal_sidebar_expanded');
    return windowWidth <= 1020 ? false : saved !== null ? JSON.parse(saved) : windowWidth > 1920 ? true : false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const backgroundlesslogo = '/CrystalLogo.png';

  const [tooltip, setTooltip] = useState<{ content: string; target: HTMLElement | null }>({
    content: '',
    target: null,
  });

  const isMobile = windowWidth <= 1020;

  const handleTooltip = (e: React.MouseEvent<HTMLElement>, content: string) => {
    if (expanded || isMobile) return; 
    setTooltip({ content, target: e.currentTarget });
  };

  const handleTooltipHide = () => {
    setTooltip({ content: '', target: null });
  };

  useEffect(() => {
    if (expanded || isMobile) {
      setTooltip({ content: '', target: null });
    }
  }, [expanded, isMobile]);

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      if (newWidth <= 1020 && expanded) {
        setExpanded(false);
        localStorage.setItem('crystal_sidebar_expanded', 'false');
      }
      if (newWidth > 1020 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [expanded, mobileMenuOpen]);

  useEffect(() => {
    const savedExpanded = localStorage.getItem('crystal_sidebar_expanded');
    if (savedExpanded !== null) {
      setExpanded(savedExpanded === 'true' && window.innerWidth > 1020);
    }
  }, [windowWidth]);

  useEffect(() => {
    document.body.classList.toggle('sidebar-expanded', expanded);
    return () => {
      document.body.classList.remove('sidebar-expanded');
    };
  }, [expanded]);

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

  const toggleSidebar = () => {
    if (windowWidth > 1020) {
      const newExpanded = !expanded;
      setExpanded(newExpanded);
      localStorage.setItem('crystal_sidebar_expanded', newExpanded.toString());
      window.dispatchEvent(new Event('resize'));
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <div className={`sidebar-nav ${simpleView ? 'simple-view' : 'advanced-view'} ${expanded ? 'expanded' : 'collapsed'}`}>
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
              onMouseEnter={(e) => handleTooltip(e, t('advancedView'))}
              onMouseLeave={handleTooltipHide}
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
              onMouseEnter={(e) => handleTooltip(e, t('simpleView'))}
              onMouseLeave={handleTooltipHide}
            >
              <img src={swap} className="sidebar-icon" />
              <span className="sidebar-label">{t('simpleView')}</span>
            </Link>

            <Link
              to="/portfolio"
              className={`page-mode-button ${path === '/portfolio' ? 'active' : ''}`}
              onMouseEnter={(e) => handleTooltip(e, t('portfolio'))}
              onMouseLeave={handleTooltipHide}
            >
              <img src={portfolio} className="sidebar-icon" />
              <span className="sidebar-label">{t('portfolio')}</span>
            </Link>

            <Link
              to="/referrals"
              className={`page-mode-button ${path === '/referrals' ? 'active' : ''}`}
              onMouseEnter={(e) => handleTooltip(e, t('referrals'))}
              onMouseLeave={handleTooltipHide}
            >
              <img src={referrals} className="sidebar-icon" />
              <span className="sidebar-label">{t('referrals')}</span>
            </Link>

            <Link
              to="/leaderboard"
              className={`page-mode-button ${path === '/leaderboard' ? 'active' : ''}`}
              onMouseEnter={(e) => handleTooltip(e, t('leaderboard'))}
              onMouseLeave={handleTooltipHide}
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
                onMouseEnter={(e) => handleTooltip(e, t('docs'))}
                onMouseLeave={handleTooltipHide}
              >
                <img src={docs} className="sidebar-icon" />
                <span className="sidebar-label">{t('docs')}</span>
              </a>
              <a
                href="https://discord.gg/CrystalExch"
                target="_blank"
                rel="noreferrer"
                className="sidebar-bottom-link"
                onMouseEnter={(e) => handleTooltip(e, t('discord'))}
                onMouseLeave={handleTooltipHide}
              >
                <img src={discord} className="sidebar-icon" />
                <span className="sidebar-label">{t('discord')}</span>
              </a>
              <a
                href="https://x.com/CrystalExch"
                target="_blank"
                rel="noreferrer"
                className="sidebar-bottom-link"
                onMouseEnter={(e) => handleTooltip(e, 'X / ' + t('twitter'))}
                onMouseLeave={handleTooltipHide}
              >
                <img src={twitter} className="sidebar-icon" />
                <span className="sidebar-label">{'X / ' + t('twitter')}</span>
              </a>
              <button
                onClick={toggleSidebar}
                className="sidebar-toggle-button"
                onMouseEnter={(e) => handleTooltip(e, expanded ? t('collapse') : t('expand'))}
                onMouseLeave={handleTooltipHide}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="sidebar-svg-icon"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                <span className="sidebar-label">{expanded ? t('collapse') : t('expand')}</span>
              </button>
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

      {!isMobile && (
        <SidebarTooltip content={tooltip.content} target={tooltip.target} visible={!!tooltip.target} />
      )}
    </>
  );
};

export default SidebarNav;