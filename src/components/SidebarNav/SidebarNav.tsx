import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import backgroundlesslogo from '../../assets/logo_clear.png';
import './SidebarNav.css';
import { useLanguage } from '../../contexts/LanguageContext';
import mint from '../../assets/mint.png';
import candlestick from '../../assets/candlestick.png';
import portfolio from '../../assets/folder.png';
import referrals from '../../assets/referrals.png';
import leaderboard from '../../assets/leaderboard.png';
import swap from '../../assets/swap.png';
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
  
      
      <div className="sidebar-links">
       <button 
          className={`view-mode-button ${isTradingPage && !simpleView ? 'active' : ''}`}
          onClick={goToAdvancedView}
          title={t('advancedView')}
        >
          <img src={candlestick} alt="Advanced View" className="sidebar-icon" />
          <span className="view-mode-text">{t('advanced')}</span>
        </button>
        <button 
          className={`view-mode-button ${isTradingPage && simpleView ? 'active' : ''}`}
          onClick={goToSimpleView}
          title={t('basicView')}
        >
          <img src={swap} alt="Basic View" className="sidebar-icon" />
          <span className="view-mode-text">{t('simple')}</span>

        </button>
        <Link to="/portfolio" className={path === '/portfolio' ? 'active' : 'page-mode-button'}>
          <img src={portfolio} alt="Portfolio" className="sidebar-icon" />
          <span className="view-mode-text">{t('portfolio')}</span>

        </Link>
        <Link to="/referrals" className={path === '/referrals' ? 'active' : 'page-mode-button'}>
          <img src={referrals} alt="Referrals" className="sidebar-icon" />
          <span className="view-mode-text">{t('referrals')}</span>

        </Link>
        
        <Link to="/leaderboard" className={path === '/leaderboard' ? 'active' : 'page-mode-button'}>
          <img src={leaderboard} alt="Leaderboard" className="sidebar-icon" />
          <span className="view-mode-text">{t('leaderboard')}</span>

        </Link>
  
        <Link to="/mint" className={path === '/mint' ? 'active' : 'page-mode-button'}>
          <img className="sidebar-icon" src={mint}/>
          <span className="view-mode-text">{t('mint')}</span>
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
