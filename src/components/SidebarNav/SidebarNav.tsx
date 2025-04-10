import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import backgroundlesslogo from '../../assets/logo_clear.png';
import './SidebarNav.css';
import { useLanguage } from '../../contexts/LanguageContext';
import mint from '../../assets/mint.png';
import candlestick from '../../assets/candlestick.png';
import portfolio from '../../assets/folder.png';
import referrals from '../../assets/referrals.png';
import leaderboard from '../../assets/leaderboard.png';
import swap from '../../assets/refresh.svg';
import twitter from '../../assets/twitter.png';
import docs from '../../assets/docs.png';
import SidebarTooltip from './SidebarTooltip';

interface SidebarNavProps {
  simpleView: boolean;
  setSimpleView: (value: boolean) => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ simpleView, setSimpleView }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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

  const isTradingPage = ['/swap', '/limit', '/send', '/scale'].some(tradePath =>
    path === tradePath || path.startsWith(tradePath)
  );

  const goToSimpleView = () => {
    setSimpleView(true);
    localStorage.setItem('crystal_simple_view', 'true');
    window.dispatchEvent(
      new CustomEvent('enterSimpleView', {
        detail: { clearTokens: true },
      })
    );
    window.dispatchEvent(new Event('resize'));
    navigate('/swap');
  };

  const goToAdvancedView = () => {
    setSimpleView(false);
    localStorage.setItem('crystal_simple_view', 'false');
    window.dispatchEvent(new Event('resize'));
    navigate('/swap');
  };

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
        <Link to="/" className="sidebar-logo">
          <img src={backgroundlesslogo} className="sidebar-logo-image" alt="Logo" />
          <span className="sidebar-logo-text">CRYSTAL</span>
        </Link>

        <div className="sidebar-links">
          <button
            className={`view-mode-button ${isTradingPage && !simpleView ? 'active' : ''}`}
            onClick={goToAdvancedView}
            onMouseEnter={(e) => handleTooltip(e, t('advancedView'))}
            onMouseLeave={handleTooltipHide}
          >
            <img src={candlestick} alt="Advanced View" className="sidebar-icon" />
            <span className="sidebar-label">{t('advancedView')}</span>
          </button>
          <button
            className={`view-mode-button ${isTradingPage && simpleView ? 'active' : ''}`}
            onClick={goToSimpleView}
            onMouseEnter={(e) => handleTooltip(e, t('simpleView'))}
            onMouseLeave={handleTooltipHide}
          >
            <img src={swap} alt="Basic View" className="sidebar-icon" />
            <span className="sidebar-label">{t('simpleView')}</span>
          </button>
          <Link
            to="/portfolio"
            className={`page-mode-button ${path === '/portfolio' ? 'active' : ''}`}
            onMouseEnter={(e) => handleTooltip(e, t('portfolio'))}
            onMouseLeave={handleTooltipHide}
          >
            <img src={portfolio} alt="Portfolio" className="sidebar-icon" />
            <span className="sidebar-label">{t('portfolio')}</span>
          </Link>
          <Link
            to="/referrals"
            className={`page-mode-button ${path === '/referrals' ? 'active' : ''}`}
            onMouseEnter={(e) => handleTooltip(e, t('referrals'))}
            onMouseLeave={handleTooltipHide}
          >
            <img src={referrals} alt="Referrals" className="sidebar-icon" />
            <span className="sidebar-label">{t('referrals')}</span>
          </Link>
          <Link
            to="/leaderboard"
            className={`page-mode-button ${path === '/leaderboard' ? 'active' : ''}`}
            onMouseEnter={(e) => handleTooltip(e, t('leaderboard'))}
            onMouseLeave={handleTooltipHide}
          >
            <img src={leaderboard} alt="Leaderboard" className="sidebar-icon" />
            <span className="sidebar-label">{t('leaderboard')}</span>
          </Link>
          <Link
            to="/mint"
            className={`page-mode-button ${path === '/mint' ? 'active' : ''}`}
            onMouseEnter={(e) => handleTooltip(e, t('mint'))}
            onMouseLeave={handleTooltipHide}
          >
            <img src={mint} alt="Mint" className="sidebar-icon" />
            <span className="sidebar-label">{t('mint')}</span>
          </Link>
        </div>

        <div className="sidebar-bottom">
          <a
            href="https://docs.crystal.exchange"
            target="_blank"
            rel="noreferrer"
            className="sidebar-bottom-link"
            title="Docs"
            onMouseEnter={(e) => handleTooltip(e, 'Docs')}
            onMouseLeave={handleTooltipHide}
          >
            <img src={docs} alt="Docs" className="sidebar-icon" />
            <span className="sidebar-label">Docs</span>
          </a>
          <a
            href="https://x.com/CrystalExch"
            target="_blank"
            rel="noreferrer"
            className="sidebar-bottom-link"
            title="Twitter"
            onMouseEnter={(e) => handleTooltip(e, 'Twitter')}
            onMouseLeave={handleTooltipHide}
          >
            <img src={twitter} alt="Twitter" className="sidebar-icon" />
            <span className="sidebar-label">Twitter</span>
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

      <SidebarTooltip content={tooltip.content} target={tooltip.target} visible={!!tooltip.target} />
    </>
  );
};

export default SidebarNav;
