import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TradeDropdown from '../TradeDropdown/TradeDropdown';
import './NavLinks.css';

interface NavLinksProps {
  isSideMenu: boolean;
  setShowTrade: (value: boolean) => void;
  toggleMenu: () => void;
  userWalletAddress?: string | null;
  onSelectTokens?: (baseToken: string, quoteToken: string) => void;
  simpleView: boolean;
  setSimpleView: (value: boolean) => void;
}

const NavLinks: React.FC<NavLinksProps> = ({
  isSideMenu,
  setShowTrade,
  toggleMenu,
  simpleView,
  setSimpleView,
}) => {
  const [isTradeDropdownOpen, setIsTradeDropdownOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const [isSideMenuTradeOpen, setIsSideMenuTradeOpen] = useState(false);
  const [isSideMenuMoreOpen, setIsSideMenuMoreOpen] = useState(false);
  const navigate = useNavigate();

  const handleTradeMouseToggle = useCallback((isOpen: boolean) => {
    setIsTradeDropdownOpen(isOpen);
  }, []);

  const handleMoreMouseToggle = useCallback((isOpen: boolean) => {
    setIsMoreDropdownOpen(isOpen);
  }, []);

  const handleSideMenuViewChange = useCallback((isSimple: boolean) => {
    setSimpleView(isSimple);
    localStorage.setItem('crystal_simple_view', JSON.stringify(isSimple));

    window.dispatchEvent(new Event('resize'));
    setIsSideMenuTradeOpen(false);
    if (isSimple && !(location.pathname == '/swap')) {
      navigate('/swap');
    }
    else if (!isSimple && !(location.pathname == '/market')) {
      navigate('/market');
    }
    toggleMenu();
  }, []);

  return (
    <>
      {isSideMenu ? (
        <>
          <div className="side-menu-section">
            <button
              className="side-menu-section-header"
              onClick={() => setIsSideMenuTradeOpen(!isSideMenuTradeOpen)}
            >
              {t('trade')}
              <svg
                className={`header-arrow ${isSideMenuTradeOpen ? 'open' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {isSideMenuTradeOpen && (
              <div className="side-menu-subsection">
                <button
                  type="button"
                  className="side-menu-item"
                  onClick={() => {
                    handleSideMenuViewChange(true);
                  }}
                >
                  <span className="item-title">{t('basicView')}</span>
                </button>
                <button
                  type="button"
                  className="side-menu-item"
                  onClick={() => {
                    handleSideMenuViewChange(false);
                  }}
                >
                  <span className="item-title">{t('advancedView')}</span>
                </button>
              </div>
            )}
          </div>

          <Link to="/portfolio" className="nav-link" onClick={toggleMenu}>
            {t('portfolio')}
          </Link>
          <Link to="/referrals" className="nav-link" onClick={toggleMenu}>
            {t('referrals')}
          </Link>
          <Link to="/leaderboard" className="nav-link" onClick={toggleMenu}>
            {t('leaderboard')}
          </Link>
          <Link to="/mint" className="nav-link" onClick={toggleMenu}>
            {t('Mint')}
          </Link>


          <div className="side-menu-section">
            <button
              className="side-menu-section-header"
              onClick={() => setIsSideMenuMoreOpen(!isSideMenuMoreOpen)}
            >
              {t('more')}
              <svg
                className={`header-arrow ${isSideMenuMoreOpen ? 'open' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {isSideMenuMoreOpen && (
              <div className="side-menu-subsection">
                <a
                  href="https://docs.crystal.exchange"
                  className="side-menu-item"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={toggleMenu}
                >
                  <span className="item-title">{t('docs')}</span>
                </a>
                <a
                  href="https://crystal.exchange"
                  className="side-menu-item"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={toggleMenu}
                >
                  <span className="item-title">{t('website')}</span>
                </a>
                <a
                  href="https://discord.gg/CrystalExch"
                  className="side-menu-item"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={toggleMenu}
                >
                  <span className="item-title">{t('discord')}</span>
                </a>
                <a
                  href="https://twitter.com/CrystalExch"
                  className="side-menu-item"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={toggleMenu}
                >
                  <span className="item-title">{'X / ' + t('twitter')}</span>
                </a>
                <a
                  href="https://crystal.exchange/terms"
                  className="side-menu-item"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={toggleMenu}
                >
                  <span className="item-title">{t('terms')}</span>
                </a>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div
            onMouseLeave={() => handleTradeMouseToggle(false)}
            className="dropdown-container"
          >
            <div
              className="nav-link trade"
              onMouseEnter={() => handleTradeMouseToggle(true)}
            >
              {t('trade')}
              <svg
                className="header-arrow"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <TradeDropdown
              isTradeDropdownOpen={isTradeDropdownOpen}
              simpleView={simpleView}
              setSimpleView={setSimpleView}
              setShowTrade={setShowTrade}
              onTradeDropdownClose={() => setIsTradeDropdownOpen(false)}
            />
          </div>

          <Link to="/portfolio" className="nav-link">
            {t('portfolio')}
          </Link>
          <Link to="/referrals" className="nav-link">
            {t('referrals')}
          </Link>
          <Link to="/leaderboard" className="nav-link">
            {t('leaderboard')}
          </Link>
          <Link to="/mint" className="nav-link">
            {t('mint')}
          </Link>


          <div
            onMouseLeave={() => handleMoreMouseToggle(false)}
            className="dropdown-container"
          >
            <div
              className="nav-link trade"
              onMouseEnter={() => handleMoreMouseToggle(true)}
            >
              {t('more')}
              <svg
                className="header-arrow"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <div className="tradedrop-container">
              <div
                className={`tradedrop-main ${isMoreDropdownOpen ? 'active' : ''}`}
              >
                <a
                  href="https://docs.crystal.exchange"
                  className="tradedrop-item"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="tradedrop-item-content">
                    <div className="tradedrop-text">
                      <span className="tradedrop-title">{t('docs')}</span>
                      <span className="tradedrop-subtitle">
                        {t('view_documentation')}
                      </span>
                    </div>
                  </div>
                </a>

                <a
                  href="https://crystal.exchange"
                  className="tradedrop-item"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="tradedrop-item-content">
                    <div className="tradedrop-text">
                      <span className="tradedrop-title">{t('website')}</span>
                      <span className="tradedrop-subtitle">
                        {t('visit_homepage')}
                      </span>
                    </div>
                  </div>
                </a>

                <a
                  href="https://discord.gg/CrystalExch"
                  className="tradedrop-item"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="tradedrop-item-content">
                    <div className="tradedrop-text">
                      <span className="tradedrop-title">{t('discord')}</span>
                      <span className="tradedrop-subtitle">
                        {t('join_community')}
                      </span>
                    </div>
                  </div>
                </a>

                <a
                  href="https://x.com/CrystalExch"
                  className="tradedrop-item"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="tradedrop-item-content">
                    <div className="tradedrop-text">
                      <span className="tradedrop-title">
                        {'X / ' + t('twitter')}
                      </span>
                      <span className="tradedrop-subtitle">
                        {t('follow_updates')}
                      </span>
                    </div>
                  </div>
                </a>

                <a
                  href="https://crystal.exchange/terms"
                  className="tradedrop-item"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="tradedrop-item-content">
                    <div className="tradedrop-text">
                      <span className="tradedrop-title">{t('terms')}</span>
                      <span className="tradedrop-subtitle">
                        {t('read_terms')}
                      </span>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default NavLinks;
