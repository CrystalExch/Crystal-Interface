import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SidebarNav.css';
import { useLanguage } from '../../contexts/LanguageContext';
import mint from '../../assets/mintanvil.png';
import candlestick from '../../assets/candlestick.png';
import portfolio from '../../assets/wallet_icon.png';
import referrals from '../../assets/referrals.png';
import leaderboard from '../../assets/leaderboard.png';
import swap from '../../assets/circulararrow.png';
import twitter from '../../assets/twitter.png';
import docs from '../../assets/docs.png';
import vault from '../../assets/vault.png';

import SidebarTooltip from './SidebarTooltip';

interface SidebarNavProps {
  simpleView: boolean;
  setSimpleView: (value: boolean) => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ simpleView, setSimpleView }) => {
  const location = useLocation();
  const path = location.pathname;
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const backgroundlesslogo = '/CrystalLogo.png';

  const [tooltip, setTooltip] = useState<{ content: string; target: HTMLElement | null }>({
    content: '',
    target: null,
  });

  const handleTooltip = (e: React.MouseEvent<HTMLElement>, content: string) => {
    if (expanded) return;
    setTooltip({ content, target: e.currentTarget });
  };

  const handleTooltipHide = () => {
    setTooltip({ content: '', target: null });
  };

  useEffect(() => {
    if (expanded) {
      setTooltip({ content: '', target: null });
    }
  }, [expanded]);

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      if (newWidth <= 1020 && expanded) {
        setExpanded(false);
        localStorage.setItem('crystal_sidebar_expanded', 'false');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [expanded]);

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

  return (
    <>
      <div className={`sidebar-nav ${simpleView ? 'simple-view' : 'advanced-view'} ${expanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-nav-inner">
        <Link to="/" className="sidebar-logo">
          <img src={backgroundlesslogo} className="sidebar-logo-image" />
          <span className="sidebar-logo-text">CRYSTAL</span>
        </Link>

        <div className="sidebar-links">
          <Link
            to="/market"
            className={`view-mode-button ${path === '/market' || (isTradingPage && !simpleView) ? 'active' : ''}`}
            onClick={(e) => {
              if (location.pathname === '/market') {
                e.preventDefault();
              }
              else {
                setSimpleView(false)
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
              }
              else {
                setSimpleView(true)
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
          <Link
            to="/mint"
            className={`page-mode-button ${path === '/mint' ? 'active' : ''}`}
            onMouseEnter={(e) => handleTooltip(e, t('mint'))}
            onMouseLeave={handleTooltipHide}
          >
            <img src={mint} className="sidebar-icon" />
            <span className="sidebar-label">{t('mint')}</span>
          </Link>
          <Link
            to="/vaults"
            className={`page-mode-button ${path === '/vaults' ? 'active' : ''}`}
            onMouseEnter={(e) => handleTooltip(e, t('Vaults'))}
            onMouseLeave={handleTooltipHide}
          >
            <img src={vault} className="sidebar-icon" />
            <span className="sidebar-label">{t('Vaults')}</span>
          </Link>
        </div>

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
            href="https://x.com/CrystalExch"
            target="_blank"
            rel="noreferrer"
            className="sidebar-bottom-link"
            onMouseEnter={(e) => handleTooltip(e, t('twitter'))}
            onMouseLeave={handleTooltipHide}
          >
            <img src={twitter} className="sidebar-icon" />
            <span className="sidebar-label">{t('twitter')}</span>
          </a>
          <button
            onClick={toggleSidebar}
            className="sidebar-toggle-button"
            onMouseEnter={(e) => handleTooltip(e, expanded ? 'Collapse' : 'Expand')}
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
            <span className="sidebar-label">{expanded ? 'Collapse' : 'Expand'}</span>
          </button>
        </div>
        </div>
      </div>

      <SidebarTooltip content={tooltip.content} target={tooltip.target} visible={!!tooltip.target} />
    </>
  );
};

export default SidebarNav;