import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './TradeDropdown.css';

interface TradeDropdownProps {
  isTradeDropdownOpen: boolean;
  simpleView: boolean;
  setSimpleView: (value: boolean) => void;
  setShowTrade?: (value: boolean) => void;
  onTradeDropdownClose: () => void;
}

const TradeDropdown: React.FC<TradeDropdownProps> = ({
  isTradeDropdownOpen,
  simpleView,
  setSimpleView,
  setShowTrade,
  onTradeDropdownClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isTradingPage = useMemo(() => {
    const tradingPaths = ['/swap', '/limit', '/send', '/scale', '/trade'];
    return tradingPaths.some(path => location.pathname.startsWith(path));
  }, [location.pathname]);

  const handleViewChange = (view: 'simple' | 'pro') => {
    const isSimpleView = view === 'simple';
    setSimpleView(isSimpleView);
    localStorage.setItem('crystal_simple_view', JSON.stringify(isSimpleView));
    
    if (isSimpleView) {
      window.dispatchEvent(
        new CustomEvent('enterSimpleView', {
          detail: { clearTokens: true },
        }),
      );
    }
    
    window.dispatchEvent(new Event('resize'));
    onTradeDropdownClose();
    if (setShowTrade) {
      setShowTrade(true);
    }
    navigate('/swap');
  };

  return (
    <div className="tradedrop-container">
      <div className={`tradedrop-main ${isTradeDropdownOpen ? 'active' : ''}`}>
        <div
          className={`tradedrop-item ${isTradingPage && simpleView ? 'tradedrop-item-active' : ''}`}
          onClick={() => handleViewChange('simple')}
          role="button"
          tabIndex={0}
        >
          <div className="tradedrop-item-content">
            <div className="tradedrop-text">
              <span className="tradedrop-title">{t('basicView')}</span>
              <span className="tradedrop-subtitle">{t('basicViewText')}</span>
            </div>
          </div>
        </div>
        <div
          className={`tradedrop-item ${isTradingPage && !simpleView ? 'tradedrop-item-active' : ''}`}
          onClick={() => handleViewChange('pro')}
          role="button"
          tabIndex={0}
        >
          <div className="tradedrop-item-content">
            <div className="tradedrop-text">
              <span className="tradedrop-title">{t('advancedView')}</span>
              <span className="tradedrop-subtitle">
                {t('advancedViewText')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeDropdown;