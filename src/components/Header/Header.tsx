import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import LanguageSelector from './LanguageSelector/LanguageSelector';
import NetworkSelector from './NetworkSelector/NetworkSelector';
import SideMenuOverlay from './SideMenuOverlay/SideMenuOverlay';
import TransactionHistoryMenu from '../TransactionHistoryMenu/TransactionHistoryMenu';
import ChartHeader from '../Chart/ChartHeader/ChartHeader';
import Hamburger from '../../assets/header_menu.svg';
import globeicon from '../../assets/globe.svg';
import settingsicon from '../../assets/settings.svg';
import walleticon from '../../assets/wallet_icon.png';
import historyIcon from '../../assets/notification.svg';
import backgroundlesslogo from '../../assets/logo_clear.png';

import './Header.css';

interface Language {
  code: string;
  name: string;
}

interface HeaderProps {
  setTokenIn: (token: string) => void;
  setTokenOut: (token: string) => void;
  tokenIn: string;
  setorders: (orders: any[]) => void;
  settradehistory: (history: any[]) => void;
  settradesByMarket: (trades: Record<string, any[]>) => void;
  setcanceledorders: (orders: any[]) => void;
  setpopup: (value: number) => void;
  setChain: any;
  account: {
    connected: boolean;
    address?: string;
    chainId?: number;
  };
  activechain: number;
  setShowTrade: (value: boolean) => void;
  simpleView: boolean;
  setSimpleView: (value: boolean) => void;
  tokendict: any;
  transactions?: any[];
  activeMarket?: any;
  orderdata?: any;
  onMarketSelect?: any;
  marketsData?: any;
  isChartLoading?: boolean;
  trades?: any[];
  tradesloading?: boolean;
  chartHeaderData?: any;
}

const Header: React.FC<HeaderProps> = ({
  setTokenIn,
  setTokenOut,
  setorders,
  settradehistory,
  settradesByMarket,
  setcanceledorders,
  setpopup,
  setChain,
  account,
  activechain,
  setShowTrade,
  simpleView,
  setSimpleView,
  tokendict,
  transactions,
  activeMarket,
  orderdata,
  onMarketSelect,
  marketsData,
  chartHeaderData,

}) => {
  const location = useLocation();
  const [isNetworkSelectorOpen, setNetworkSelectorOpen] = useState(false);
  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false);
  const [pendingNotifs, setPendingNotifs] = useState(0);
  const languageOptions: Language[] = [
    { code: 'EN', name: 'English' },
    { code: 'CN', name: '中文（简体）' },
    { code: 'JP', name: '日本語' },
    { code: 'KR', name: '한국어' },
    { code: 'ES', name: 'Español' },
  ];

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState<boolean>(false);
  const [inPic, setInPic] = useState('');
  const [outPic, setOutPic] = useState('');

  useEffect(() => {
    if (activeMarket && tokendict) {
      if (tokendict[activeMarket.baseAddress]) {
        setInPic(tokendict[activeMarket.baseAddress].image);
      }
      if (tokendict[activeMarket.quoteAddress]) {
        setOutPic(tokendict[activeMarket.quoteAddress].image);
      }
    }
  }, [activeMarket, tokendict]);

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = !isMenuOpen ? 'hidden' : 'auto';
  };

  const isTradeRoute = ['/swap', '/limit', '/send', '/scale'].includes(location.pathname);
  const shouldShowSettings = isTradeRoute && !simpleView;

  return (
    <>
      <header className="app-header">
        <div className="left-header">
          <button
            className={`hamburger ${isMenuOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            type="button"
          >
            <img src={Hamburger} className="hamburger-image" />
          </button>

          <div className="extitle">
            <span className="crystal-name">CRYSTAL</span>
          </div>
          <ChartHeader
  in_icon={inPic}
  out_icon={outPic}
  price={chartHeaderData?.price || 'n/a'}
  priceChangeAmount={chartHeaderData?.priceChange || 'n/a'}
  priceChangePercent={chartHeaderData?.change || 'n/a'}
  activeMarket={activeMarket}
  high24h={chartHeaderData?.high24h || 'n/a'}
  low24h={chartHeaderData?.low24h || 'n/a'}
  volume={chartHeaderData?.volume || 'n/a'}
  orderdata={orderdata || {}}
  tokendict={tokendict}
  onMarketSelect={onMarketSelect}
  setpopup={setpopup}
  marketsData={marketsData}
  isChartLoading={chartHeaderData.isChartLoading} 
  simpleView={simpleView}
/>
        </div>

        <div className="chart-header-container">

        </div>


        <div className="right-header">
          <NetworkSelector
            isNetworkSelectorOpen={isNetworkSelectorOpen}
            setNetworkSelectorOpen={setNetworkSelectorOpen}
            setTokenIn={setTokenIn}
            setTokenOut={setTokenOut}
            setorders={setorders}
            settradehistory={settradehistory}
            settradesByMarket={settradesByMarket}
            setcanceledorders={setcanceledorders}
            setChain={setChain}
          />
          <button
            type="button"
            className="history-button"
            onClick={() => setIsTransactionHistoryOpen(true)}
          >
            <img src={historyIcon} className="history-icon" />
            {pendingNotifs > 0 && (
              <span className="tx-notification-badge">{pendingNotifs}</span>
            )}
            {pendingNotifs > 99 && (
              <span className="tx-notification-badge">99+</span>
            )}
          </button>
          <div>
            <button
              type="button"
              className="app-settings-button"
              onClick={() => {
                if (shouldShowSettings) {
                  setpopup(5);
                } else {
                  setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
                }
              }}
            >
              <img
                className={`other-settings-image ${shouldShowSettings ? 'visible' : ''}`}
                src={settingsicon}
              />
              <img
                className={`other-globe-image ${shouldShowSettings ? '' : 'visible'}`}
                src={globeicon}
              />
            </button>
            {isLanguageDropdownOpen && (
              <LanguageSelector
                languages={languageOptions}
                isLanguageDropdownOpen={isLanguageDropdownOpen}
                setIsLanguageDropdownOpen={setIsLanguageDropdownOpen}
                isHeader={true}
              />
            )}
          </div>
          <button
            type="button"
            className={account.connected ? 'transparent-button' : 'connect-button'}
            onClick={async () => {
              if (account.connected && account.chainId === activechain) {
                setpopup(4);
              } else {
                !account.connected
                  ? setpopup(4)
                  : setChain()
              }
            }}
          >
            <div className="connect-content">
              {!account.connected ? (
                'Connect Wallet'
              ) : (
                <span className="transparent-button-container">
                  <img src={walleticon} className="wallet-icon" />
                  {`${account.address?.slice(0, 6)}...${account.address?.slice(-4)}`}
                </span>
              )}
            </div>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <SideMenuOverlay
          isMenuOpen={isMenuOpen}
          toggleMenu={toggleMenu}
          backgroundlesslogo={backgroundlesslogo}
          setShowTrade={setShowTrade}
          simpleView={simpleView}
          setSimpleView={setSimpleView}
        />
      )}

      <TransactionHistoryMenu
        isOpen={isTransactionHistoryOpen}
        onClose={() => setIsTransactionHistoryOpen(false)}
        setPendingNotifs={setPendingNotifs}
        transactions={transactions || []}
        tokendict={tokendict}
        walletAddress={account.address}
      />

      {isLanguageDropdownOpen && (
        <LanguageSelector
          isLanguageDropdownOpen={isLanguageDropdownOpen}
          setIsLanguageDropdownOpen={setIsLanguageDropdownOpen}
          isHeader={true}
          languages={[]}
        />
      )}
    </>
  );
};

export default Header;