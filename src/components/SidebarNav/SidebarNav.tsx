import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import backgroundlesslogo from '../../assets/logo_clear.png';
import './SidebarNav.css';
import { useLanguage } from '../../contexts/LanguageContext';

interface SidebarNavProps {
  simpleView: boolean;
  setSimpleView: (value: boolean) => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ simpleView, setSimpleView }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const { t } = useLanguage();

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

  return (
    <div className={`sidebar-nav ${simpleView ? 'simple-view' : 'advanced-view'}`}>
      <Link to="/" className="sidebar-logo">
        <img src={backgroundlesslogo} className="sidebar-logo-image" alt="Logo" />
      </Link>
      
      <div className="view-buttons-container">
        <button 
          className={`view-mode-button ${isTradingPage && simpleView ? 'active' : ''}`}
          onClick={goToSimpleView}
          title={t('basicView')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 5h16M4 12h12M4 19h8" />
          </svg>
        </button>
        
        <button 
          className={`view-mode-button ${isTradingPage && !simpleView ? 'active' : ''}`}
          onClick={goToAdvancedView}
          title={t('advancedView')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="6" y1="12" x2="6" y2="20"></line>
            <line x1="6" y1="4" x2="6" y2="8"></line>
            <line x1="12" y1="16" x2="12" y2="20"></line>
            <line x1="12" y1="4" x2="12" y2="14"></line>
            <line x1="18" y1="9" x2="18" y2="20"></line>
            <line x1="18" y1="4" x2="18" y2="7"></line>
            <line x1="4" y1="4" x2="8" y2="4"></line>
            <line x1="4" y1="20" x2="8" y2="20"></line>
            <line x1="10" y1="14" x2="14" y2="14"></line>
            <line x1="10" y1="16" x2="14" y2="16"></line>
            <line x1="16" y1="7" x2="20" y2="7"></line>
            <line x1="16" y1="9" x2="20" y2="9"></line>
          </svg>
        </button>
      </div>
      
      <div className="sidebar-links">
        <Link to="/referrals" className={path === '/referrals' ? 'active' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
        </Link>
        
        <Link to="/leaderboard" className={path === '/leaderboard' ? 'active' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </Link>
        
        <Link to="/portfolio" className={path === '/portfolio' ? 'active' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <path d="M16 10h4v4h-4a2 2 0 0 1 0-4z"></path>
          </svg>
        </Link>
        
        <Link to="/mint" className={path === '/mint' ? 'active' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </Link>
      </div>
      
      <div className="sidebar-bottom">
        <a
          href="https://docs.crystal.exchange"
          target="_blank"
          rel="noreferrer"
          className="sidebar-bottom-link"
          title="Docs"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </a>
        <a
          href="https://x.com/CrystalExch"
          target="_blank"
          rel="noreferrer"
          className="sidebar-bottom-link"
          title="Twitter"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
          </svg>
        </a>
      </div>
    </div>
  );
};

export default SidebarNav;
