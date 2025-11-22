import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SidebarNav.css';
import { useLanguage } from '../../contexts/LanguageContext';
import candlestick from '../../assets/candlestick.png';
import portfolio from '../../assets/wallet_icon.svg';
import leaderboard from '../../assets/leaderboard.png';
import referrals from '../../assets/referrals.png';
import swap from '../../assets/circulararrow.png';
import twitter from '../../assets/twitter.png';
import discord from '../../assets/Discord.svg'
import docs from '../../assets/docs.png';
import vaults from '../../assets/yeildvaults.png';
import earn from '../../assets/earn.png';
import liquidity from '../../assets/liquidity.svg';
import explorer from '../../assets/prism.png';
import tracker from '../../assets/tracker.png';
import earnvaults from '../../assets/vaults.png';
import perps from '../../assets/infinity.png'
import fun from '../../assets/fun.png';

interface SidebarNavProps {
  simpleView: boolean;
  setSimpleView: (value: boolean) => void;
  onOpenWidgetExplorer?: () => void;
  isWidgetExplorerOpen?: boolean;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ simpleView, setSimpleView }) => {
  const location = useLocation();
  const path = location.pathname;
  const { t } = useLanguage();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [expanded, setExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [linkClicked, setLinkClicked] = useState(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundlesslogo = '/CrystalLogo.png';

  // const handleWidgetExplorerToggle = () => {
  //   if (onOpenWidgetExplorer) {
  //     onOpenWidgetExplorer();
  //   }
  // };

  const isMobile = windowWidth <= 1020;

  const handleSidebarMouseEnter = () => {
    if (!isMobile && !isResizing && !linkClicked) {
      setExpanded(true);
      document.body.classList.add('sidebar-hover-overlay');
    }
  };

  const handleSidebarMouseLeave = () => {
    if (!isMobile && !isResizing) {
      setExpanded(false);
      document.body.classList.remove('sidebar-hover-overlay');
      setLinkClicked(false);
    }
  };

  const handleLinkClick = () => {
    if (!isMobile) {
      setExpanded(false);
      setLinkClicked(true);
      document.body.classList.remove('sidebar-hover-overlay');
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsResizing(true);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);

      if (newWidth <= 1020) {
        setExpanded(false);
      }
      if (newWidth > 1020 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        setIsResizing(false);
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
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

  return (
    <>
      <div
        className={`sidebar-nav ${simpleView ? 'simple-view' : 'advanced-view'} ${expanded ? 'expanded' : 'collapsed'} ${isResizing ? 'no-transition' : ''}`}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <div className={`sidebar-nav-inner ${isResizing ? 'no-transition' : ''}`}>
          {!isMobile && (
            <Link to="/" className="sidebar-logo" onClick={handleLinkClick}>
              <img src={backgroundlesslogo} className="sidebar-logo-image" />
              <span className={`sidebar-logo-text ${isResizing ? 'no-transition' : ''}`}>CRYSTAL</span>
            </Link>
          )}
          <div className="sidebar-links">
            {/*(<Link
              to="/market"
              className={`view-mode-button ${path === '/market' || (isTradingPage && !simpleView) ? 'active' : ''} ${isResizing ? 'no-transition' : ''}`}
              onClick={(e) => {
                if (location.pathname === '/market') {
                  e.preventDefault();
                } else {
                  setSimpleView(false);
                }
                handleLinkClick();
              }}
            >
              <img src={candlestick} className="sidebar-icon" />
              <span className={`sidebar-label ${isResizing ? 'no-transition' : ''}`}>{t('Trade')}</span>
            </Link>) */}
            <Link
              to="/spectra"
              className={`page-mode-button ${path === '/spectra' ? 'active' : ''} ${isResizing ? 'no-transition' : ''}`}
              onClick={handleLinkClick}
            >
              <img src={explorer} className="sidebar-icon" />
              <span className={`sidebar-label ${isResizing ? 'no-transition' : ''}`}>{t('Spectra')}</span>
            </Link>
            <Link
              to="/perps"
              className={`page-mode-button ${path.startsWith('/perps') 
                  ? 'active'
                  : ''
                } ${isResizing ? 'no-transition' : ''}`}              
                onClick={handleLinkClick}
            >
              <img src={perps} className="sidebar-icon" />
              <span className={`sidebar-label ${isResizing ? 'no-transition' : ''}`}>{t('Perpetuals')}</span>
            </Link>
            {/* !isMobile && (
              <Link
                to="/board"
                className={`page-mode-button ${path === '/board' ? 'active' : ''} ${isResizing ? 'no-transition' : ''}`}
                onClick={handleLinkClick}
              >
                <img src={fun} className="sidebar-icon" />
                <span className={`sidebar-label ${isResizing ? 'no-transition' : ''}`}>{t('crystal.fun')}</span>
              </Link>
            ) */}
            <Link
              to="/swap"
              className={`view-mode-button ${path === '/swap' || (isTradingPage && simpleView) ? 'active' : ''} ${isResizing ? 'no-transition' : ''}`}
              onClick={(e) => {
                if (location.pathname === '/swap') {
                  e.preventDefault();
                } else {
                  setSimpleView(true);
                }
                handleLinkClick();
              }}
            >
              <img src={swap} className="sidebar-icon" />
              <span className={`sidebar-label ${isResizing ? 'no-transition' : ''}`}>{t('Swap')}</span>
            </Link>
            {/* !isMobile && (
              <Link
                to="/earn/liquidity"
                className={`page-mode-button ${path.startsWith('/earn/liquidity') || path.startsWith('/earn/vaults')
                    ? 'active'
                    : ''
                  } ${isResizing ? 'no-transition' : ''}`}
                onClick={handleLinkClick}
              >
                <img src={liquidity} className="sidebar-icon" />
                <span className={`sidebar-label ${isResizing ? 'no-transition' : ''}`}>
                  {t('Earn')}
                </span>
              </Link>
            ) */}
            {<Link
              to="/trackers"
              className={`page-mode-button ${path === '/trackers' ? 'active' : ''} ${isResizing ? 'no-transition' : ''}`}
              onClick={handleLinkClick}
            >
              <img src={tracker} className="sidebar-icon" />
              <span className={`sidebar-label ${isResizing ? 'no-transition' : ''}`}>{t('Trackers')}</span>
            </Link>}
            <Link
              to="/portfolio"
              className={`page-mode-button ${path === '/portfolio' ? 'active' : ''} ${isResizing ? 'no-transition' : ''}`}
              onClick={handleLinkClick}
            >
              <img src={portfolio} className="sidebar-icon" />
              <span className={`sidebar-label ${isResizing ? 'no-transition' : ''}`}>{t('portfolio')}</span>
            </Link>
            {!isMobile && (
              <Link
                to="/referrals"
                className={`page-mode-button ${path === '/referrals' ? 'active' : ''} ${isResizing ? 'no-transition' : ''}`}
                onClick={handleLinkClick}
              >
                <img src={referrals} className="sidebar-icon" />
                <span className={`sidebar-label ${isResizing ? 'no-transition' : ''}`}>{t('referrals')}</span>
              </Link>
            )}
            {!isMobile && (
              <Link
                to="/leaderboard"
                className={`page-mode-button ${path === '/leaderboard' ? 'active' : ''} ${isResizing ? 'no-transition' : ''}`}
                onClick={handleLinkClick}
              >
                <img src={leaderboard} className="sidebar-icon" />
                <span className={`sidebar-label ${isResizing ? 'no-transition' : ''}`}>{t('leaderboard')}</span>
              </Link>
            )}
            {/* <Link
              to="/lending"
              className={`page-mode-button ${path === '/lending' ? 'active' : ''} ${isResizing ? 'no-transition' : ''}`}
              onClick={handleLinkClick}
            >
              <img src={vaults} className="sidebar-icon" />
              <span className={`sidebar-label ${isResizing ? 'no-transition' : ''}`}>{t('Lending')}</span>
            </Link> */}

            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
                className={`sidebar-bottom-link ${isResizing ? 'no-transition' : ''}`}
                onClick={handleLinkClick}
              >
                <img src={docs} className="sidebar-icon" />
                <span className={`sidebar-label ${isResizing ? 'no-transition' : ''}`}>{t('docs')}</span>
              </a>
              <a
                href="https://discord.gg/CrystalExch"
                target="_blank"
                rel="noreferrer"
                className={`sidebar-bottom-link ${isResizing ? 'no-transition' : ''}`}
                onClick={handleLinkClick}
              >
                <img src={discord} className="sidebar-icon" />
                <span className={`sidebar-label ${isResizing ? 'no-transition' : ''}`}>{t('discord')}</span>
              </a>
              <a
                href="https://x.com/CrystalExch"
                target="_blank"
                rel="noreferrer"
                className={`sidebar-bottom-link ${isResizing ? 'no-transition' : ''}`}
                onClick={handleLinkClick}
              >
                <img src={twitter} className="sidebar-icon" />
                <span className={`sidebar-label ${isResizing ? 'no-transition' : ''}`}>{'X / ' + t('twitter')}</span>
              </a>
            </div>
          )}
        </div>

      </div>

      {isMobile && (
        <>
          <div
            className={`mobile-menu-backdrop ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className={`mobile-hamburger-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-menu-header">
              <div className="mobile-menu-logo">
                <img src={backgroundlesslogo} className="extitle-logo" />
                <span className="crystal-name">CRYSTAL</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="mobile-menu-close">
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
              <a
                href="https://docs.crystal.exchange"
                target="_blank"
                rel="noreferrer"
                className="mobile-menu-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <img src={docs} className="mobile-menu-icon" />
                <span>{t('docs')}</span>
              </a>
              <a
                href="https://discord.gg/CrystalExch"
                target="_blank"
                rel="noreferrer"
                className="mobile-menu-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <img src={discord} className="mobile-menu-icon" />
                <span>{t('discord')}</span>
              </a>
              <a
                href="https://x.com/CrystalExch"
                target="_blank"
                rel="noreferrer"
                className="mobile-menu-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <img src={twitter} className="mobile-menu-icon" />
                <span>{'X / ' + t('twitter')}</span>
              </a>

              {/* (<><Link
                to="/board"
                className="mobile-menu-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <img src={fun} className="mobile-menu-icon" />
                <span>{t('crystal.fun')}</span>
              </Link>

              <Link
                to="/earn/liquidity"
                className="mobile-menu-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <img src={liquidity} className="mobile-menu-icon" />
                <span>{t('Earn')}</span>
              </Link></>) */}

              <Link
                to="/leaderboard"
                className="mobile-menu-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <img src={leaderboard} className="mobile-menu-icon" />
                <span>{t('leaderboard')}</span>
              </Link>

              <Link
                to="/referrals"
                className="mobile-menu-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <img src={referrals} className="mobile-menu-icon" />
                <span>{t('referrals')}</span>
              </Link>
            </div>

          </div>
        </>
      )}
    </>
  );
};

export default SidebarNav;