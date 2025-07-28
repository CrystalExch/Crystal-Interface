import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import LanguageSelector from './LanguageSelector/LanguageSelector';
import NetworkSelector from './NetworkSelector/NetworkSelector';
import SideMenuOverlay from './SideMenuOverlay/SideMenuOverlay';
import TransactionHistoryMenu from '../TransactionHistoryMenu/TransactionHistoryMenu';
import ChartHeader from '../Chart/ChartHeader/ChartHeader';

import { formatCommas } from '../../utils/numberDisplayFormat';

import settingsicon from '../../assets/settings.svg';
import walleticon from '../../assets/wallet_icon.png';
import historyIcon from '../../assets/notification.svg';

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
  tradesloading?: boolean;
  tradesByMarket: any;
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
  tradesByMarket,
}) => {
  const location = useLocation();
  const [isNetworkSelectorOpen, setNetworkSelectorOpen] = useState(false);
  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false);
  const [pendingNotifs, setPendingNotifs] = useState(0);
  const languageOptions: Language[] = [
    { code: 'EN', name: 'English' },
    { code: 'ES', name: 'Español' },
    { code: 'CN', name: '中文（简体）' },
    { code: 'JP', name: '日本語' },
    { code: 'KR', name: '한국어' },
    { code: 'RU', name: 'русский' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'VN', name: 'Tiếng Việt' },
    { code: 'PH', name: 'Filipino' },
  ];

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState<boolean>(false);
  const [inPic, setInPic] = useState('');
  const [outPic, setOutPic] = useState('');
  const backgroundlesslogo = '/CrystalLogo.png';

  const MARKET_UPDATE_EVENT = '0x797f1d495432fad97f05f9fdae69fbc68c04742c31e6dfcba581332bd1e7272a';
  const TOTAL_SUPPLY = 1e9;

  const wsRef = useRef<WebSocket | null>(null);
  const marketSubRef = useRef<string | null>(null);

  const [liveTokenData, setLiveTokenData] = useState<any>({});

  const isMemeTokenPage = location.pathname.startsWith('/meme/');

  const subscribe = useCallback((ws: WebSocket, params: any, onAck?: (subId: string) => void) => {
    const reqId = Date.now();
    ws.send(JSON.stringify({
      id: reqId,
      jsonrpc: '2.0',
      method: 'eth_subscribe',
      params,
    }));
    if (!onAck) return;
    const handler = (evt: MessageEvent) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === reqId && msg.result) {
        onAck(msg.result);
        ws.removeEventListener('message', handler);
      }
    };
    ws.addEventListener('message', handler);
  }, []);

  const updateMarketData = useCallback((log: any, tokenId: string) => {
    if (log.topics[0] !== MARKET_UPDATE_EVENT) return;

    const market = log.address.toLowerCase();
    if (market !== tokenId.toLowerCase()) return;

    const hex = log.data.replace(/^0x/, '');
    const words: string[] = [];
    for (let i = 0; i < hex.length; i += 64) words.push(hex.slice(i, i + 64));

    const amounts = BigInt('0x' + words[0]);
    const isBuy = BigInt('0x' + words[1]);
    const priceRaw = BigInt('0x' + words[2]);
    const counts = BigInt('0x' + words[3]);

    const priceEth = Number(priceRaw) / 1e18;
    const buys = Number(counts >> 128n);
    const sells = Number(counts & ((1n << 128n) - 1n));
    const amountIn = Number(amounts >> 128n);
    const amountOut = Number(amounts & ((1n << 128n) - 1n));

    setLiveTokenData((prev: any) => ({
      ...prev,
      price: priceEth,
      marketCap: priceEth * TOTAL_SUPPLY,
      buyTransactions: buys,
      sellTransactions: sells,
      volume24h: (prev.volume24h || 0) + (isBuy > 0 ? amountIn / 1e18 : amountOut / 1e18),
    }));
  }, []);

  const memeTokenData = isMemeTokenPage && location.state?.tokenData ? (() => {
    const token = location.state.tokenData;
    const mergedData = { ...token, ...liveTokenData };
    const currentMarketCap = liveTokenData.marketCap || token.marketCap;
    const bondingPercentage = Math.min((currentMarketCap / 25000) * 100, 100);

    return {
      symbol: token.symbol,
      name: token.name,
      image: token.image,
      tokenAddress: token.tokenAddress,
      marketCap: currentMarketCap,
      change24h: mergedData.change24h,
      bondingPercentage: bondingPercentage,
      status: token.status,
      created: token.created,
      website: token.website || '',
      twitterHandle: token.twitterHandle || '',
      price: liveTokenData.price || token.price,
      buyTransactions: liveTokenData.buyTransactions || token.buyTransactions,
      sellTransactions: liveTokenData.sellTransactions || token.sellTransactions,
      volume24h: liveTokenData.volume24h || token.volume24h,
    };
  })() : undefined;

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

  useEffect(() => {
    if (!isMemeTokenPage || !location.state?.tokenData) return;

    const token = location.state.tokenData;
    const ws = new WebSocket('wss://testnet-rpc.monad.xyz');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for meme token:', token.symbol);
      subscribe(ws, ['logs', { address: token.id }], (subId) => {
        marketSubRef.current = subId;
        console.log('Subscribed to market updates:', subId);
      });
    };

    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.method === 'eth_subscription' && msg.params?.result) {
        updateMarketData(msg.params.result, token.id);
      }
    };

    ws.onerror = (e) => console.error('WebSocket error:', e);
    ws.onclose = () => console.log('WebSocket closed');

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isMemeTokenPage, subscribe, updateMarketData]);

  useEffect(() => {
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = !isMenuOpen ? 'hidden' : 'auto';
  };

  const isTradeRoute = ['/swap', '/limit', '/send', '/scale', '/market'].includes(location.pathname);
  const rightHeaderClass = isTradeRoute && !simpleView ? 'right-header-trade' : 'right-header';
  const marketHeader = marketsData?.find(
    (market: any) => market?.address === activeMarket?.address
  );

  return (
    <>
      <header className="app-header">
        <div className="mobile-left-header">
          <div className="extitle">
            <img src={backgroundlesslogo} className="extitle-logo" />
            <span className="crystal-name">CRYSTAL</span>
          </div>
        </div>
        <div className="left-header">
          <ChartHeader
            in_icon={inPic}
            out_icon={outPic}
            price={isMemeTokenPage && memeTokenData ?
              memeTokenData.price?.toString() || 'n/a' :
              marketHeader?.currentPrice || 'n/a'
            }
            priceChangeAmount={isMemeTokenPage && memeTokenData ?
              memeTokenData.change24h?.toString() || 'n/a' :
              formatCommas(
                (marketHeader?.priceChangeAmount / Number(activeMarket?.priceFactor || 1)).toString()
              ) || 'n/a'
            }
            priceChangePercent={isMemeTokenPage && memeTokenData ?
              `${memeTokenData.change24h >= 0 ? '+' : ''}${memeTokenData.change24h.toFixed(2)}` :
              marketHeader?.priceChange || 'n/a'
            }
            activeMarket={activeMarket}
            high24h={marketHeader?.high24h || 'n/a'}
            low24h={marketHeader?.low24h || 'n/a'}
            volume={isMemeTokenPage && memeTokenData ?
              memeTokenData.volume24h?.toString() || 'n/a' :
              marketHeader?.volume || 'n/a'
            }
            orderdata={orderdata || {}}
            tokendict={tokendict}
            onMarketSelect={onMarketSelect}
            setpopup={setpopup}
            marketsData={marketsData}
            simpleView={simpleView}
            tradesByMarket={tradesByMarket}
            isMemeToken={isMemeTokenPage}
            memeTokenData={memeTokenData}
          />
        </div>
        <div className={rightHeaderClass}>
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
                setpopup(5);
              }}
            >
              <img
                className="other-settings-image"
                src={settingsicon}
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
                t('connectWallet')
              ) : (
                <span className="transparent-button-container">
                  <img src={walleticon} className="wallet-icon" />
                  <span className="header-wallet-address">{`${account.address?.slice(0, 6)}...${account.address?.slice(-4)}`}</span>
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
        setIsTransactionHistoryOpen={setIsTransactionHistoryOpen}
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