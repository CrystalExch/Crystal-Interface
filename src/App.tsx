// import libraries
import {
  getBlockNumber,
  waitForTransactionReceipt,
  switchChain,
  getAccount,
} from '@wagmi/core';
import React, {
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { maxUint256 } from 'viem';
import { useReadContracts } from 'wagmi';
import { useLanguage } from './contexts/LanguageContext';
import getAddress from './utils/getAddress.ts';
import { config } from './wagmi.ts';
import {
  useLogout,
  useSmartAccountClient,
  useSendUserOperation,
  useAlchemyAccountContext,
  AuthCard,
  useUser,
  useAccount
} from "@account-kit/react";

// import css
import './App.css';

// import scripts
import approve from './scripts/approve';
import limitOrder from './scripts/limitOrder';
import multiBatchOrders from './scripts/multiBatchOrders';
import sendeth from './scripts/sendeth';
import sendtokens from './scripts/sendtokens';
import _swap from './scripts/swap';
import swapETHForExactTokens from './scripts/swapETHForExactTokens';
import swapExactETHForTokens from './scripts/swapExactETHForTokens';
import swapExactTokensForETH from './scripts/swapExactTokensForETH';
import swapExactTokensForTokens from './scripts/swapExactTokensForTokens';
import swapTokensForExactETH from './scripts/swapTokensForExactETH';
import swapTokensForExactTokens from './scripts/swapTokensForExactTokens';
import unwrapeth from './scripts/unwrapeth';
import wrapeth from './scripts/wrapeth';
import { fetchLatestPrice } from './utils/getPrice.ts';

// import utils
import customRound from './utils/customRound';
import { formatTime } from './utils/formatTime.ts';
import { getTradeValue } from './utils/getTradeValue.ts';
import { formatCommas, formatSubscript } from './utils/numberDisplayFormat.ts';

// import abis
import { CrystalDataHelperAbi } from './abis/CrystalDataHelperAbi';
import { CrystalMarketAbi } from './abis/CrystalMarketAbi';
import { CrystalRouterAbi } from './abis/CrystalRouterAbi';
import { TokenAbi } from './abis/TokenAbi';

// import types
import { DataPoint } from './components/Chart/utils/chartDataGenerator.ts';

// import svg graphics
import tradearrow from './assets/arrow.svg';
import closebutton from './assets/close_button.png';
import sendSwitch from './assets/send_arrow.svg';
import SocialBanner from './assets/SocialBanner.png';
import walleticon from './assets/wallet_icon.png';
import Xicon from './assets/Xicon.svg';
import walletbackpack from './assets/walletbackpack.jpg'
import walletcoinbase from './assets/walletcoinbase.png'
import walletconnect from './assets/walletconnect.png'
import walletinjected from './assets/walletinjected.png'
import walletmetamask from './assets/walletmetamask.svg'
import walletphantom from './assets/walletphantom.svg'
import walletrabby from './assets/walletrabby.png'
import walletsafe from './assets/walletsafe.png'
import wallettomo from './assets/wallettomo.jpg'
import wallethaha from './assets/wallethaha.png'
import mobiletradeswap from './assets/mobile_trade_swap.png';
import notificationSound from './assets/notification.wav';

// import routes
import Portfolio from './components/Portfolio/Portfolio.tsx';
import Referrals from './components/Referrals/Referrals.tsx';

// import main app components
import ChartComponent from './components/Chart/Chart.tsx';
import TokenInfoPopupContent from './components/Chart/ChartHeader/TokenInfo/TokenInfoPopup/TokenInfoPopupContent.tsx';
import ChartOrderbookPanel from './components/ChartOrderbookPanel/ChartOrderbookPanel.tsx';
import Footer from './components/Footer/Footer.tsx';
import Header from './components/Header/Header.tsx';
import LanguageSelector from './components/Header/LanguageSelector/LanguageSelector';
import LoadingOverlay from './components/loading/LoadingComponent.tsx';
import FullScreenOverlay from './components/loading/LoadingScreen.tsx';
import NavigationProgress from './components/NavigationProgress.tsx';
import OrderBook from './components/Orderbook/Orderbook.tsx';
import OrderCenter from './components/OrderCenter/OrderCenter.tsx';
import SortArrow from './components/OrderCenter/SortArrow/SortArrow.tsx';
import PortfolioContent from './components/Portfolio/BalancesContent/BalancesContent.tsx';
import PortfolioPopupGraph from './components/Portfolio/PortfolioGraph/PortfolioGraph.tsx';
import ToggleSwitch from './components/ToggleSwitch/ToggleSwitch.tsx';
import TooltipLabel from './components/TooltipLabel/TooltipLabel.tsx';
import TransactionPopupManager from './components/TransactionPopupManager/TransactionPopupManager';
import MiniChart from './components/Chart/ChartHeader/TokenInfo/MiniChart/MiniChart.tsx';
import Leaderboard from './components/Leaderboard/Leaderboard.tsx';
import NFTMintingPage from './components/NFTMintingPage/NFTMintingPage.tsx';
import GeneratingAddressPopup from './components/GeneratingAddressPopup';
import DepositPage from './components/DepositPage/DepositPage';
import SimpleOrdersContainer from './components/SimpleOrdersButton/SimpleOrdersContainer';


// import config
import { SearchIcon } from 'lucide-react';
import { usePortfolioData } from './components/Portfolio/PortfolioGraph/usePortfolioData.ts';
import { settings } from './settings.ts';
import { useSharedContext } from './contexts/SharedContext.tsx';

function App() {
  // constants
  const { config: alchemyconfig } = useAlchemyAccountContext() as any;
  const { client, address } = useSmartAccountClient({ type: "LightAccount" });
  const { sendUserOperationAsync, isSendingUserOperation } = useSendUserOperation({
    client,
    waitForTxn: true,
  });


  const currentUser = useUser();
  const [showDepositPage, setShowDepositPage] = useState(false);
  const [isNewWallet, setIsNewWallet] = useState(false);

  const isGeneratingAddressVisible = currentUser && !address;
  useEffect(() => {
    if (currentUser && !address) {
      setIsNewWallet(true);
    }
  }, [currentUser, address]);




  const handleCloseDepositPage = () => {
    setShowDepositPage(false);
  };




  const isDepositPageVisible = showDepositPage && address;




  useEffect(() => {
    if (address && isNewWallet && !showDepositPage) {
      const hideDepositPage = localStorage.getItem('hideDepositPage') === 'true';

      if (!hideDepositPage) {
        setShowDepositPage(true);
      }
      setIsNewWallet(false);
    }
  }, [address, isNewWallet, showDepositPage]);



  const sendUserOperation = useCallback(sendUserOperationAsync, []);
  const { logout } = useLogout();
  const { t, language, setLanguage } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activechain, percentage, setPercentage, favorites } = useSharedContext();
  const account = getAccount(config)
  const userchain = account.chainId || client?.chain?.id
  const connected = address != undefined
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const HTTP_URL = settings.chainConfig[activechain].httpurl;
  const eth = settings.chainConfig[activechain].eth as `0x${string}`;
  const weth = settings.chainConfig[activechain].weth as `0x${string}`;
  const usdc = settings.chainConfig[activechain].usdc as `0x${string}`;
  const balancegetter = settings.chainConfig[activechain].balancegetter;
  const router = settings.chainConfig[activechain].router;
  const markets: { [key: string]: any } =
    settings.chainConfig[activechain].markets;
  const tokendict: { [key: string]: any } =
    settings.chainConfig[activechain].tokendict;
  const addresstoMarket: { [key: string]: any } =
    settings.chainConfig[activechain].addresstomarket;
  const graph: Record<string, string[]> = (() => {
    let g: Record<string, string[]> = {};
    for (const [, market] of Object.entries(markets)) {
      const baseAddress = market.baseAddress;
      const quoteAddress = market.quoteAddress;

      if (!g[baseAddress]) g[baseAddress] = [];
      if (!g[quoteAddress]) g[quoteAddress] = [];

      g[baseAddress].push(quoteAddress);
      g[quoteAddress].push(baseAddress);
    }
    return g;
  })();

  // get market including multihop
  const getMarket = (token1: string, token2: string): any => {
    return (
      markets[`${tokendict[token1].ticker}${tokendict[token2].ticker}`] ||
      markets[`${tokendict[token2].ticker}${tokendict[token1].ticker}`] ||
      (() => {
        if (
          (token1 == eth && token2 == weth) ||
          (token1 == weth && token2 == eth)
        ) {
          let market = { ...getMarket(eth, usdc) };
          market['path'] = [token1, token2];
          market['fee'] = BigInt(10000);
          return market;
        }
      })() ||
      (() => {
        const path = findShortestPath(token1, token2);
        if (path && path.length > 1 && activeTab != 'limit') {
          let fee = BigInt(1);
          for (let i = 0; i < path.length - 1; i++) {
            fee *= getMarket(path[i], path[i + 1]).fee;
          }
          fee /= BigInt(100000);
          return {
            quoteAsset: getMarket(path.at(-2), path.at(-1)).quoteAsset,
            baseAsset: getMarket(path.at(-2), path.at(-1)).baseAsset,
            path: path,
            quoteAddress: getMarket(path.at(-2), path.at(-1)).quoteAddress,
            baseAddress: getMarket(path.at(-2), path.at(-1)).baseAddress,
            quoteDecimals: getMarket(path.at(-2), path.at(-1)).quoteDecimals,
            baseDecimals: getMarket(path.at(-2), path.at(-1)).baseDecimals,
            address: getMarket(path.at(-2), path.at(-1)).address,
            scaleFactor: getMarket(path.at(-2), path.at(-1)).scaleFactor,
            priceFactor: getMarket(path.at(-2), path.at(-1)).priceFactor,
            tickSize: getMarket(path.at(-2), path.at(-1)).tickSize,
            minSize: getMarket(path.at(-2), path.at(-1)).minSize,
            maxPrice: getMarket(path.at(-2), path.at(-1)).maxPrice,
            fee: fee,
            image: getMarket(path.at(-2), path.at(-1)).image,
            website: getMarket(path.at(-2), path.at(-1)).website,
          };
        }
      })()
    );
  };

  // find path between two tokens
  const findShortestPath = (start: string, end: string): any => {
    const queue: string[][] = [[start]];
    const visited: Set<string> = new Set();

    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];
      if (current === end) {
        return path;
      }
      if (!visited.has(current)) {
        visited.add(current);
        for (const neighbor of graph[current] || []) {
          if (!visited.has(neighbor)) {
            queue.push([...path, neighbor]);
          }
        }
      }
    }
    return null;
  };

  // state vars
  const showFooter = [
    '/swap',
    '/limit',
    '/send',
    '/scale',
    '/portfolio',
    '/leaderboard',
    '/mint',

    '/referrals',
    '/earn',
    '/mint'
  ].includes(location.pathname);
  const sortConfig = undefined;
  const leaderboardData = {
    totalXP: 10000,
    currentXP: 750,
    username: "CryptoTrader42",
    userXP: 750,
    factions: [
      {
        id: "phoenix",
        name: "Phoenix",
        points: 8500,
        level: 7,
        rank: 3
      },
      {
        id: "dragon",
        name: "Dragon",
        points: 9200,
        level: 8,
        rank: 2
      },
      {
        id: "kraken",
        name: "Kraken",
        points: 7800,
        level: 6,
        rank: 4
      },
      {
        id: "titan",
        name: "Titan",
        points: 9800,
        level: 9,
        rank: 1
      },
      {
        id: "oracle",
        name: "Oracle",
        points: 7200,
        level: 6,
        rank: 5
      },
      {
        id: "phantom",
        name: "Phantom",
        points: 6900,
        level: 5,
        rank: 6
      },
      {
        id: "celestial",
        name: "Celestial",
        points: 6500,
        level: 5,
        rank: 7
      },
      {
        id: "shadow",
        name: "Shadow",
        points: 6100,
        level: 4,
        rank: 8
      },
      {
        id: "frost",
        name: "Frost",
        points: 5800,
        level: 4,
        rank: 9
      },
      {
        id: "inferno",
        name: "Inferno",
        points: 5400,
        level: 3,
        rank: 10
      }
    ]
  };
  const [showSendDropdown, setShowSendDropdown] = useState(false);
  const sendDropdownRef = useRef<HTMLDivElement | null>(null);
  const sendButtonRef = useRef<HTMLSpanElement | null>(null);

  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [mobileView, setMobileView] = useState('chart');
  const [showTrade, setShowTrade] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<any>(null);
  const [totalAccountValue, setTotalAccountValue] = useState<number>(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [copyTooltipVisible, setCopyTooltipVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showHoverTooltip, setShowHoverTooltip] = useState(false);
  const [activeTab, setActiveTab] = useState(location.pathname.slice(1));
  const [currentProText, setCurrentProText] = useState(activeTab == 'swap' || activeTab == 'limit' ? t('pro') : t(activeTab.toLowerCase()));
  const [refLink, setRefLink] = useState('');
  const [totalClaimableFees, setTotalClaimableFees] = useState(0);
  const [switched, setswitched] = useState(false);
  const [claimableFees, setClaimableFees] = useState<{ [key: string]: number }>(
    {},
  );
  const [tokenIn, setTokenIn] = useState(() => {
    if (activeTab == 'send') {
      const token = searchParams.get('token');
      if (token && tokendict[getAddress(token)]) {
        return getAddress(token);
      }
    } else {
      let token = searchParams.get('tokenIn');
      if (token && tokendict[getAddress(token)]) {
        return getAddress(token);
      } else {
        token = searchParams.get('tokenOut');
        if (token) {
          token = getAddress(token);
          for (const market in markets) {
            if (markets[market].quoteAddress == token) {
              return markets[market].baseAddress;
            } else if (markets[market].baseAddress == token) {
              return markets[market].quoteAddress;
            }
          }
        }
      }
    }
    return usdc;
  });
  const [tokenOut, setTokenOut] = useState(() => {
    let tokenIn =
      activeTab == 'send'
        ? searchParams.get('token')
        : searchParams.get('tokenIn');
    let tokenOut = searchParams.get('tokenOut');
    if (tokenIn && tokenOut) {
      tokenIn = getAddress(tokenIn);
      tokenOut = getAddress(tokenOut);
      if (tokendict[tokenIn] && tokendict[tokenOut]) {
        if (getMarket(tokenIn, tokenOut)) {
          return tokenOut;
        } else {
          const path = findShortestPath(tokenIn, tokenOut);
          if (path && path.length > 1 && activeTab == 'swap') {
            return tokenOut;
          } else {
            for (const market in markets) {
              if (markets[market].quoteAddress == tokenIn) {
                return markets[market].baseAddress;
              } else if (markets[market].baseAddress == tokenIn) {
                return markets[market].quoteAddress;
              }
            }
          }
        }
      }
    } else if (tokenIn) {
      tokenIn = getAddress(tokenIn);
      if (tokendict[tokenIn]) {
        for (const market in markets) {
          if (markets[market].quoteAddress == tokenIn) {
            return markets[market].baseAddress;
          } else if (markets[market].baseAddress == tokenIn) {
            return markets[market].quoteAddress;
          }
        }
      }
    } else if (tokenOut) {
      tokenOut = getAddress(tokenOut);
      if (tokendict[tokenOut]) {
        return tokenOut;
      }
    }
    return eth;
  });
  const [usedRefLink, setUsedRefLink] = useState(() => {
    if (searchParams.get('ref')) {
      localStorage.setItem('ref', searchParams.get('ref') as string);
    }
    return searchParams.get('ref') || localStorage.getItem(`ref`) || '';
  });
  const [usedRefAddress, setUsedRefAddress] = useState(
    '0x0000000000000000000000000000000000000000',
  );
  const [simpleView, setSimpleView] = useState(() => {
    const savedSimpleView = localStorage.getItem('crystal_simple_view');
    return savedSimpleView ? JSON.parse(savedSimpleView) : false;
  });
  const [isOrderbookVisible, setIsOrderbookVisible] = useState(() => {
    const saved = localStorage.getItem('crystal_orderbook_visible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => {
    return JSON.parse(localStorage.getItem('crystal_audio_notifications') || 'false');
  });
  const [orderbookPosition, setOrderbookPosition] = useState(() => {
    const savedPosition = localStorage.getItem('crystal_orderbook');
    return savedPosition || 'right';
  });
  const [slippage, setSlippage] = useState(() => {
    const saved = localStorage.getItem('crystal_slippage');
    return saved !== null ? BigInt(saved) : BigInt(9900);
  });
  const [slippageString, setSlippageString] = useState(() => {
    const saved = localStorage.getItem('crystal_slippage_string');
    return saved !== null ? saved : '1';
  });
  const [orderType, setorderType] = useState(() => {
    const saved = localStorage.getItem('crystal_order_type');
    return saved !== null ? JSON.parse(saved) : 1;
  });
  const [addliquidityonly, setAddLiquidityOnly] = useState(() => {
    const saved = localStorage.getItem('crystal_add_liquidity_only');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [tokenString, settokenString] = useState('');
  const [amountIn, setamountIn] = useState(() => {
    const amount = searchParams.get('amountIn');
    if (amount) {
      return BigInt(amount);
    }
    return BigInt(0);
  });
  const [amountOutSwap, setamountOutSwap] = useState(() => {
    if (activeTab == 'swap') {
      const amount = searchParams.get('amountOut');
      if (amount) {
        setswitched(true);
        return BigInt(amount);
      }
    }
    return BigInt(0);
  });
  const [amountOutLimit, setamountOutLimit] = useState(BigInt(0));
  const [inputString, setInputString] = useState(() => {
    const amount = searchParams.get('amountIn');
    if (amount && Number(amount) > 0) {
      return customRound(
        Number(amount) / 10 ** Number(tokendict[tokenIn].decimals),
        3,
      )
        .toString()
        .replace(/(\.\d*?[1-9])0+$/g, '$1')
        .replace(/\.0+$/, '');
    }
    return '';
  });
  const [outputString, setoutputString] = useState(() => {
    if (activeTab == 'swap') {
      const amount = searchParams.get('amountOut');
      if (amount && Number(amount) > 0) {
        return customRound(
          Number(amount) / 10 ** Number(tokendict[tokenOut].decimals),
          3,
        )
          .toString()
          .replace(/(\.\d*?[1-9])0+$/g, '$1')
          .replace(/\.0+$/, '');
      }
    }
    return '';
  });
  const [isComposing, setIsComposing] = useState(false);
  const [sendInputString, setsendInputString] = useState('');
  const [limitoutputString, setlimitoutputString] = useState('');
  const [limitPriceString, setlimitPriceString] = useState('');
  const [allowance, setallowance] = useState(BigInt(0));
  const [warning, setwarning] = useState(0);
  const [layoutSettings, setLayoutSettings] = useState(() => {
    const savedLayout = localStorage.getItem('crystal_layout');
    return savedLayout || 'default';
  });
  const [showReferralsModal, setShowReferralsModal] = useState(false);
  const [lowestAsk, setlowestAsk] = useState(BigInt(0));
  const [highestBid, sethighestBid] = useState(BigInt(0));
  const [priceImpact, setPriceImpact] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [tradeFee, setTradeFee] = useState('');
  const [isOrdersVisible, setIsOrdersVisible] = useState(false);
  const [stateIsLoading, setStateIsLoading] = useState(true);
  const [displayValuesLoading, setDisplayValuesLoading] = useState(true);
  const [portfolioColorValue, setPortfolioColorValue] = useState('#00b894');
  const [recipient, setrecipient] = useState('');
  const [limitPrice, setlimitPrice] = useState(BigInt(0));
  const [limitChase, setlimitChase] = useState(true);
  const [popup, setpopup] = useState(() => {
    if (localStorage.getItem('hasShownSocialPopup') === 'true') {
      return 0
    }
    else {
      localStorage.setItem('hasShownSocialPopup', 'true');
      return 9
    }
  });
  const [orders, setorders] = useState<any[]>([]);
  const [canceledorders, setcanceledorders] = useState<any[]>([]);
  const [tradehistory, settradehistory] = useState<any[]>([]);
  const [tradesByMarket, settradesByMarket] = useState<any>({});
  const [tokenBalances, setTokenBalances] = useState<any>({});
  const [transactions, setTransactions] = useState<any[]>([]);
  const [mids, setmids] = useState<any>({});
  const [sliderPercent, setSliderPercent] = useState(0);
  const [displayMode, setDisplayMode] = useState('token');
  const [swapButton, setSwapButton] = useState(5);
  const [swapButtonDisabled, setSwapButtonDisabled] = useState(true);
  const [limitButton, setLimitButton] = useState(8);
  const [limitButtonDisabled, setLimitButtonDisabled] = useState(true);
  const [sendButton, setSendButton] = useState(5);
  const [sendButtonDisabled, setSendButtonDisabled] = useState(true);
  const [amountOutScale, setAmountOutScale] = useState(BigInt(0));
  const [scaleOutputString, setScaleOutputString] = useState('');
  const [scaleStart, setScaleStart] = useState(BigInt(0));
  const [scaleStartString, setScaleStartString] = useState('');
  const [scaleEnd, setScaleEnd] = useState(BigInt(0));
  const [scaleEndString, setScaleEndString] = useState('');
  const [scaleOrders, setScaleOrders] = useState(BigInt(0));
  const [scaleOrdersString, setScaleOrdersString] = useState('');
  const [scaleSkew, setScaleSkew] = useState(1);
  const [scaleSkewString, setScaleSkewString] = useState('1.00');
  const [scaleButton, setScaleButton] = useState(12)
  const [scaleButtonDisabled, setScaleButtonDisabled] = useState(true)
  const [isBlurred, setIsBlurred] = useState(false);
  const [orderCenterHeight, setOrderCenterHeight] = useState<number>(() => {
    const savedHeight = localStorage.getItem('orderCenterHeight');
    if (savedHeight !== null) {
      const parsedHeight = parseFloat(savedHeight);
      if (!isNaN(parsedHeight)) {
        return parsedHeight;
      }
    }

    if (window.innerHeight > 1080) return 363.58;
    if (window.innerHeight > 960) return 322.38;
    if (window.innerHeight > 840) return 281.18;
    if (window.innerHeight > 720) return 239.98;
    return 198.78;
  });
  const [roundedBuyOrders, setRoundedBuyOrders] = useState<Order[]>([]);
  const [roundedSellOrders, setRoundedSellOrders] = useState<Order[]>([]);
  const [liquidityBuyOrders, setLiquidityBuyOrders] = useState<Order[]>([]);
  const [liquiditySellOrders, setLiquiditySellOrders] = useState<Order[]>([]);
  const [isOrderCenterVisible, setIsOrderCenterVisible] = useState(() => {
    const saved = localStorage.getItem('crystal_ordercenter_visible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [orderbookWidth, setOrderbookWidth] = useState<number>(() => {
    const saved = localStorage.getItem('orderbookWidth');
    return saved ? parseInt(saved, 10) : 300;
  });
  const [stateloading, setstateloading] = useState(true);
  const [tradesloading, settradesloading] = useState(true);
  const [addressinfoloading, setaddressinfoloading] = useState(true);
  const [chartDays, setChartDays] = useState<number>(1);
  const { chartData, portChartLoading } = usePortfolioData(
    address,
    tradesByMarket,
    Object.values(tokendict),
    markets,
    chartDays,
    tokenBalances,
    setTotalAccountValue,
    tradesloading,
  );
  const [isVertDragging, setIsVertDragging] = useState(false);
  const [trades, setTrades] = useState<
    [boolean, string, number, string, string][]
  >([]);
  const [spreadData, setSpreadData] = useState({});
  const [priceFactor, setPriceFactor] = useState(0);
  const [symbolIn, setSymbolIn] = useState('');
  const [symbolOut, setSymbolOut] = useState('');
  const [activeSection, setActiveSection] = useState<
    'orders' | 'tradeHistory' | 'orderHistory' | 'balances'
  >(() => {
    const section = localStorage.getItem('crystal_oc_tab');
    if (sortConfig) {
      return ['orders', 'tradeHistory', 'orderHistory', 'balances'].includes(
        String(section),
      )
        ? (section as 'orders' | 'tradeHistory' | 'orderHistory' | 'balances')
        : 'orders';
    }
    return ['orders', 'tradeHistory', 'orderHistory'].includes(String(section))
      ? (section as 'orders' | 'tradeHistory' | 'orderHistory' | 'balances')
      : 'orders';
  });
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>(() => {
    const f = localStorage.getItem('crystal_oc_filter');
    return ['all', 'buy', 'sell'].includes(String(f))
      ? (f as 'all' | 'buy' | 'sell')
      : 'all';
  });
  const [onlyThisMarket, setOnlyThisMarket] = useState<boolean>(() => {
    const only = localStorage.getItem('crystal_only_this_market');
    return only !== null ? JSON.parse(only) : false;
  });
  const [baseInterval, setBaseInterval] = useState<number>(0.1);
  const [viewMode, setViewMode] = useState<'both' | 'buy' | 'sell'>(() => {
    const stored = localStorage.getItem('ob_viewmode');
    return ['both', 'buy', 'sell'].includes(String(stored))
      ? (stored as 'both' | 'buy' | 'sell')
      : 'both';
  });
  const [obTab, setOBTab] = useState<'orderbook' | 'trades'>(() => {
    const stored = localStorage.getItem('ob_active_tab');

    if (['orderbook', 'trades'].includes(stored ?? '')) {
      return stored as 'orderbook' | 'trades';
    }

    return mobileView === 'trades' ? 'trades' : 'orderbook';
  });
  const [amountsQuote, setAmountsQuote] = useState(() => {
    const stored = localStorage.getItem('ob_amounts_quote');

    return ['Quote', 'Base'].includes(String(stored))
      ? (stored as string)
      : 'Quote';
  });
  const [dayKlines, setDayKlines] = useState([]);
  const [, setProcessedLogs] = useState<{ queue: string[]; set: Set<string> }>({
    queue: [],
    set: new Set(),
  });
  const emptyFunction = useCallback(() => { }, []);
  const memoizedTokenList = useMemo(
    () => Object.values(tokendict),
    [tokendict],
  );

  // refs
  const popupref = useRef<HTMLDivElement>(null);
  const blurref = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialMousePosRef = useRef(0);
  const initialHeightRef = useRef(0);

  // more constants
  const languageOptions = [
    { code: 'EN', name: 'English' },
    { code: 'CN', name: '中文（简体）' },
    { code: 'JP', name: '日本語' },
    { code: 'KR', name: '한국어' },
    { code: 'ES', name: 'Español' },
  ];

  const isWrap =
    (tokenIn == eth && tokenOut == weth) ||
    (tokenIn == weth && tokenOut == eth);

  const loading =
    stateloading ||
    tradesloading ||
    addressinfoloading

  const activeMarket = getMarket(tokenIn, tokenOut);
  const activeMarketKey = activeMarket.baseAsset + activeMarket.quoteAsset;

  const multihop = activeMarket.path.length > 2;

  const navigate = useNavigate();
  const [sendAmountIn, setSendAmountIn] = useState(BigInt(0));
  const [sendInputAmount, setSendInputAmount] = useState('');
  const [sendUsdValue, setSendUsdValue] = useState('');
  const [sendTokenIn, setSendTokenIn] = useState(eth)

  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [marketsData, setMarketsData] = useState<any[]>([]);
  const [sortField, setSortField] = useState<
    'volume' | 'price' | 'change' | 'favorites' | null
  >('volume');
  const [sortDirection, setSortDirection] = useState<
    'asc' | 'desc' | undefined
  >('desc');
  const { toggleFavorite } = useSharedContext();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const audio = useMemo(() => {
    const a = new Audio(notificationSound);
    a.volume = 1;
    return a;
  }, []);

  const filteredMarkets = marketsData.filter((market) => {
    const matchesSearch = market.pair
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const notWeth =
      market.baseAddress !== settings.chainConfig[activechain].weth;
    return matchesSearch && notWeth;
  });

  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    let aValue: number = 0;
    let bValue: number = 0;

    switch (sortField) {
      case 'volume':
        aValue = parseFloat(a.volume.toString().replace(/,/g, ''));
        bValue = parseFloat(b.volume.toString().replace(/,/g, ''));
        break;
      case 'price':
        aValue = parseFloat(a.currentPrice.toString().replace(/,/g, ''));
        bValue = parseFloat(b.currentPrice.toString().replace(/,/g, ''));
        break;
      case 'change':
        aValue = parseFloat(a.priceChange.replace(/[+%]/g, ''));
        bValue = parseFloat(b.priceChange.replace(/[+%]/g, ''));
        break;
      case 'favorites':
        aValue = favorites.includes(a.baseAddress.toLowerCase()) ? 1 : 0;
        bValue = favorites.includes(b.baseAddress.toLowerCase()) ? 1 : 0;
        break;
      default:
        return 0;
    }

    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const [obInterval, setOBInterval] = useState<number>(() => {
    const stored = localStorage.getItem(
      `${activeMarket.baseAsset}_ob_interval`,
    );
    return stored !== null ? JSON.parse(stored) : 0.1;
  });

  const handleSetChain = useCallback(async () => {
    return await switchChain(config, { chainId: activechain as any });
  }, [activechain]);

  function newTxPopup(
    _transactionHash: any,
    _currentAction: any,
    _tokenIn: any,
    _tokenOut: any,
    _amountIn: any,
    _amountOut: any,
    _price: any = 0,
    _address: any = '',
  ) {
    setTransactions((prevTransactions) => {
      const newTransaction = {
        explorerLink: `${settings.chainConfig[activechain].explorer}/tx/${_transactionHash}`,
        currentAction: _currentAction,
        tokenIn: _tokenIn,
        tokenOut: _tokenOut,
        amountIn: _amountIn,
        amountOut: _amountOut,
        price: _price,
        address: _address,
        timestamp: Date.now(),
        isNew: true,
        isExiting: false,
        identifier: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      let updatedTransactions = [...prevTransactions, newTransaction];

      return updatedTransactions;
    });
    setIsAudioEnabled((prev: any) => {
      if (prev) {
        audio.currentTime = 0;
        audio.play();
      }
      return prev;
    });
  }

  function handleSetOrderbookWidth(newWidth: number) {
    setOrderbookWidth(newWidth);
    localStorage.setItem('orderbookWidth', newWidth.toString());
  }

  const formatDisplayValue = (
    rawAmount: bigint,
    decimals = 18,
    precision = 3,
  ) => {
    const actualAmount = customRound(
      Number(rawAmount) / 10 ** Number(decimals),
      precision,
    );

    if (parseFloat(actualAmount) < 1) {
      return actualAmount.toString();
    }

    if (parseFloat(actualAmount) >= 1e12) {
      return `${(parseFloat(actualAmount) / 1e12).toFixed(2)}T`;
    } else if (parseFloat(actualAmount) >= 1e9) {
      return `${(parseFloat(actualAmount) / 1e9).toFixed(2)}B`;
    } else if (parseFloat(actualAmount) >= 1e6) {
      return `${(parseFloat(actualAmount) / 1e6).toFixed(2)}M`;
    }

    return actualAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatUSDDisplay = (amount: number) => {
    if (amount === 0) return '$0.00';

    const absAmount = Math.abs(amount);
    if (absAmount >= 1e12) {
      return `$${(amount / 1e12).toFixed(2)}T`;
    } else if (absAmount >= 1e9) {
      return `$${(amount / 1e9).toFixed(2)}B`;
    } else if (absAmount >= 1e6) {
      return `$${(amount / 1e6).toFixed(2)}M`;
    }

    if (absAmount >= 1) {
      return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }

    if (absAmount < 0.01) {
      return '<$0.01';
    }
    return `$${amount.toFixed(2)}`;
  };

  const calculateUSDValue = (
    amount: bigint,
    trades: any[],
    tokenAddress: string,
    market: any,
  ) => {
    if (amount === BigInt(0)) return 0;

    if (tokenAddress === usdc) {
      const usdcAmount = Number(amount) / 10 ** 6;
      return usdcAmount;
    }

    const latestPrice = fetchLatestPrice(trades, market);
    if (!latestPrice) return 0;

    const usdValue =
      (Number(amount) / 10 ** Number(tokendict[tokenAddress].decimals)) *
      latestPrice;
    return Number(usdValue);
  };

  // calculate token value of usd
  const calculateTokenAmount = (
    usdValue: string,
    trades: any[],
    tokenAddress: string,
    market: any,
  ): bigint => {
    const usdNumeric = parseFloat(usdValue);
    if (!usdNumeric || usdNumeric == 0) return BigInt(0);

    if (tokenAddress === usdc) {
      return BigInt(Math.round(usdNumeric * 10 ** 6));
    }

    const latestPrice = fetchLatestPrice(trades, market);
    if (!latestPrice) return BigInt(0);
    return BigInt(
      Math.round(
        (usdNumeric / latestPrice) *
        10 ** Number(tokendict[tokenAddress].decimals),
      ),
    );
  };

  // on market select
  const onMarketSelect = (market: any) => {
    setTokenIn(market.quoteAddress);
    setTokenOut(market.baseAddress);
    setswitched(false);
    setInputString('');
    setsendInputString('');
    setamountIn(BigInt(0));
    setSliderPercent(0);
    setamountOutLimit(BigInt(0));
    setlimitoutputString('');
    setlimitChase(true);
    setoutputString('');
    setamountOutSwap(BigInt(0));
    setAmountOutScale(BigInt(0))
    setScaleOutputString('')
    setScaleStart(BigInt(0))
    setScaleEnd(BigInt(0))
    setScaleStartString('')
    setScaleEndString('')
    const slider = document.querySelector('.balance-amount-slider');
    const popup = document.querySelector('.slider-percentage-popup');
    if (slider && popup) {
      (popup as HTMLElement).style.left = `${15 / 2}px`;
    }
  };

  const updateLimitAmount = (price: number, priceFactor: number) => {
    let newPrice = BigInt(Math.round(price * priceFactor));
    setlimitPrice(newPrice);
    setlimitPriceString(price.toFixed(Math.log10(priceFactor)));
    setlimitChase(false);
    setamountOutLimit(
      newPrice != BigInt(0) && amountIn != BigInt(0)
        ? tokenIn === activeMarket?.baseAddress
          ? (amountIn * newPrice) / (activeMarket.scaleFactor || BigInt(1))
          : (amountIn * (activeMarket.scaleFactor || BigInt(1))) / newPrice
        : BigInt(0),
    );
    setlimitoutputString(
      (newPrice != BigInt(0) && amountIn != BigInt(0)
        ? tokenIn === activeMarket?.baseAddress
          ? customRound(
            Number(
              (amountIn * newPrice) / (activeMarket.scaleFactor || BigInt(1)),
            ) /
            10 ** Number(tokendict[tokenOut].decimals),
            3,
          )
          : customRound(
            Number(
              (amountIn * (activeMarket.scaleFactor || BigInt(1))) / newPrice,
            ) /
            10 ** Number(tokendict[tokenOut].decimals),
            3,
          )
        : ''
      ).toString(),
    );
  };

  // set amount for a token
  const debouncedSetAmount =
    (amount: bigint) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setStateIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        setamountIn(amount);
      }, 300);
    }

  // set amountout for a token
  const debouncedSetAmountOut =
    (amount: bigint) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setStateIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        setamountOutSwap(amount);
      }, 300);
    }

  // set token string
  const debouncedSetTokenString = (value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      settokenString(value);
    }, 100);
  }

  // fetch state
  const { data, isLoading, dataUpdatedAt, refetch } = useReadContracts({
    batchSize: 0,
    contracts: [
      {
        abi: CrystalRouterAbi,
        address: router,
        functionName: switched == false ? 'getAmountsOut' : 'getAmountsIn',
        args: [
          switched == false ? amountIn : amountOutSwap,
          activeMarket.path[0] == tokenIn
            ? activeMarket.path
            : [...activeMarket.path].reverse(),
        ],
      },
      {
        abi: TokenAbi,
        address: (tokenIn == eth ? weth : tokenIn) as `0x${string}`,
        functionName: 'allowance',
        args: [
          address as `0x${string}`,
          getMarket(activeMarket.path.at(0), activeMarket.path.at(1)).address,
        ],
      },
      {
        abi: CrystalDataHelperAbi,
        address: balancegetter,
        functionName: 'batchBalanceOf',
        args: [
          address as `0x${string}`,
          Object.values(tokendict).map(
            (token) => token.address as `0x${string}`,
          ),
        ],
      },
      {
        address: activeMarket?.address,
        abi: CrystalMarketAbi,
        functionName: 'getPriceLevelsFromMid',
        args: [BigInt(10000)],
      },
      {
        address: balancegetter,
        abi: CrystalDataHelperAbi as any,
        functionName: 'getPrices',
        args: [
          Object.values(markets).map(
            (market) => market.address as `0x${string}`,
          ),
        ],
      },
    ],
    query: { refetchInterval: simpleView ? 5000 : 1000, gcTime: 0 },
  });

  // fetch ref data
  const { data: refData, isLoading: refDataLoading, refetch: refRefetch } = useReadContracts({
    batchSize: 0,
    contracts: [
      ...Object.values(markets).flatMap((market: any) => ({
        address: market.address as `0x${string}`,
        abi: CrystalMarketAbi,
        functionName: 'accumulatedFeeQuote',
        args: [address ?? undefined],
      })),
      ...Object.values(markets).flatMap((market: any) => ({
        address: market.address as `0x${string}`,
        abi: CrystalMarketAbi,
        functionName: 'accumulatedFeeBase',
        args: [address ?? undefined],
      })),
    ],
    query: { refetchInterval: 10000 },
  });


  // live event stream
  useEffect(() => {
    let blockNumber = '';
    (async () => {
      blockNumber = '0x' + (await getBlockNumber(config) - BigInt(10)).toString(16)
    })()

    const fetchData = async () => {
      try {
        const req = await fetch(HTTP_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{
            jsonrpc: '2.0',
            id: 0,
            method: 'eth_blockNumber',
          }, {
            jsonrpc: '2.0',
            id: 0,
            method: 'eth_getLogs',
            params: [
              {
                fromBlock: blockNumber,
                toBlock: 'latest',
                address: Object.values(markets).map(
                  (market: { address: string }) => market.address,
                ),
                topics: [
                  [
                    '0x9e2343fa67d709721d4042719dd2bb7443822bc095cdeef583b66cb1cd5887eb',
                  ],
                ],
              },
            ],
          }, ...(address?.slice(2) ? [{
            jsonrpc: '2.0',
            id: 0,
            method: 'eth_getLogs',
            params: [
              {
                fromBlock: blockNumber,
                toBlock: 'latest',
                address: Object.values(markets).map(
                  (market: { address: string }) => market.address,
                ),
                topics: [
                  [
                    '0xcd726e874e479599fa8abfd7a4ad443b08415d78fb36a088cd0e9c88b249ba66',
                  ],
                  [
                    '0x000000000000000000000000' + address?.slice(2),
                  ],
                ],
              },
            ],
          }] : [])]),
        });
        const result = await req.json()
        blockNumber = result[0].result;
        const tradelogs = result[1].result;
        const orderlogs = result?.[2]?.result;
        setProcessedLogs(({ queue, set }: { queue: string[]; set: Set<string> }) => {
          setorders((orders) => {
            let temporders = orders;
            if (Array.isArray(orderlogs)) {
              for (const log of orderlogs) {
                const logIdentifier = `${log['transactionHash']}-${log['logIndex']}`;
                if (!set.has(logIdentifier) && addresstoMarket[log['address']] && log['topics'][1].slice(26) ==
                  address?.slice(2).toLowerCase()) {
                  if (queue.length >= 1000) {
                    const removed = queue.shift();
                    set.delete(removed!);
                  }
                  queue.push(logIdentifier);
                  set.add(logIdentifier);
                  let _timestamp = parseInt(log['data'].slice(2, 66), 16);
                  let _orderdata = log['data'].slice(194);
                  for (let i = 0; i < _orderdata.length; i += 64) {
                    let chunk = _orderdata.slice(i, i + 64);
                    let _isplace = parseInt(chunk.slice(0, 1), 16) < 2;
                    if (_isplace) {
                      let order = [
                        parseInt(chunk.slice(1, 20), 16),
                        parseInt(chunk.slice(20, 32), 16),
                        parseInt(chunk.slice(32, 64), 16) /
                        parseInt(chunk.slice(1, 20), 16),
                        parseInt(chunk.slice(0, 1), 16),
                        addresstoMarket[log['address']],
                        log['transactionHash'],
                        _timestamp,
                        0,
                        parseInt(chunk.slice(32, 64), 16),
                        2,
                      ];
                      temporders.push(order)
                      setcanceledorders((canceledorders) => [
                        ...canceledorders,
                        [
                          parseInt(chunk.slice(1, 20), 16),
                          parseInt(chunk.slice(20, 32), 16),
                          parseInt(chunk.slice(32, 64), 16) /
                          parseInt(chunk.slice(1, 20), 16),
                          parseInt(chunk.slice(0, 1), 16),
                          addresstoMarket[log['address']],
                          log['transactionHash'],
                          _timestamp,
                          0,
                          parseInt(chunk.slice(32, 64), 16),
                          2,
                        ],
                      ]);
                      let price = parseInt(chunk.slice(1, 20), 16);
                      let buy = parseInt(chunk.slice(0, 1), 16);
                      let quoteasset =
                        markets[addresstoMarket[log['address']]].quoteAddress;
                      let baseasset =
                        markets[addresstoMarket[log['address']]].baseAddress;
                      let amountquote = (
                        parseInt(chunk.slice(32, 64), 16) /
                        (Number(
                          markets[addresstoMarket[log['address']]].scaleFactor,
                        ) *
                          10 **
                          Number(
                            markets[addresstoMarket[log['address']]]
                              .quoteDecimals,
                          ))
                      ).toFixed(2);
                      let amountbase = customRound(
                        parseInt(chunk.slice(32, 64), 16) /
                        price /
                        10 **
                        Number(
                          markets[addresstoMarket[log['address']]]
                            .baseDecimals,
                        ),
                        3,
                      );
                      newTxPopup(
                        log['transactionHash'],
                        'limit',
                        buy ? quoteasset : baseasset,
                        buy ? baseasset : quoteasset,
                        buy ? amountquote : amountbase,
                        buy ? amountbase : amountquote,
                        `${price / Number(markets[addresstoMarket[log['address']]].priceFactor)} ${markets[addresstoMarket[log['address']]].quoteAsset}`,
                        '',
                      );
                    } else {
                      setcanceledorders((canceledorders) => {
                        let updatedCanceledOrders: any[];
                        let canceledOrderIndex: number;
                        updatedCanceledOrders = [...canceledorders];
                        canceledOrderIndex = updatedCanceledOrders.findIndex(
                          (canceledOrder) =>
                            canceledOrder[0] ===
                            parseInt(chunk.slice(1, 20), 16) &&
                            canceledOrder[1] ===
                            parseInt(chunk.slice(20, 32), 16) &&
                            canceledOrder[4] ===
                            addresstoMarket[log['address']],
                        );
                        if (canceledOrderIndex !== -1) {
                          updatedCanceledOrders[canceledOrderIndex] = [
                            ...updatedCanceledOrders[canceledOrderIndex],
                          ];
                          updatedCanceledOrders[canceledOrderIndex][9] = 0;
                          updatedCanceledOrders[canceledOrderIndex][8] =
                            updatedCanceledOrders[canceledOrderIndex][8] -
                            parseInt(chunk.slice(32, 64), 16);
                          updatedCanceledOrders[canceledOrderIndex][6] =
                            _timestamp;
                        }
                        return updatedCanceledOrders;
                      });
                      let index = temporders.findIndex(
                        (sublist: any) =>
                          sublist[0] == parseInt(chunk.slice(1, 20), 16) &&
                          sublist[1] == parseInt(chunk.slice(20, 32), 16) &&
                          sublist[4] == addresstoMarket[log['address']],
                      );
                      if (index != -1) {
                        temporders.splice(index, 1);
                      }
                      let price = parseInt(chunk.slice(1, 20), 16);
                      let buy = parseInt(chunk.slice(0, 1), 16) == 3;
                      let quoteasset =
                        markets[addresstoMarket[log['address']]].quoteAddress;
                      let baseasset =
                        markets[addresstoMarket[log['address']]].baseAddress;
                      let amountquote = (
                        parseInt(chunk.slice(32, 64), 16) /
                        (Number(
                          markets[addresstoMarket[log['address']]].scaleFactor,
                        ) *
                          10 **
                          Number(
                            markets[addresstoMarket[log['address']]]
                              .quoteDecimals,
                          ))
                      ).toFixed(2);
                      let amountbase = customRound(
                        parseInt(chunk.slice(32, 64), 16) /
                        price /
                        10 **
                        Number(
                          markets[addresstoMarket[log['address']]]
                            .baseDecimals,
                        ),
                        3,
                      );
                      newTxPopup(
                        log['transactionHash'],
                        'cancel',
                        buy ? quoteasset : baseasset,
                        buy ? baseasset : quoteasset,
                        buy ? amountquote : amountbase,
                        buy ? amountbase : amountquote,
                        `${price / Number(markets[addresstoMarket[log['address']]].priceFactor)} ${markets[addresstoMarket[log['address']]].quoteAsset}`,
                        '',
                      );
                    }
                  }
                }
              }
            }
            if (Array.isArray(tradelogs)) {
              for (const log of tradelogs) {
                const logIdentifier = `${log['transactionHash']}-${log['logIndex']}`;
                if (!set.has(logIdentifier) && addresstoMarket[log['address']]) {
                  if (queue.length >= 1000) {
                    const removed = queue.shift();
                    set.delete(removed!);
                  }
                  queue.push(logIdentifier);
                  set.add(logIdentifier);
                  let _timestamp = parseInt(log['data'].slice(67, 98), 16);
                  let _orderdata = log['data'].slice(258);
                  const marketKey = addresstoMarket[log['address']];
                  if (
                    log['topics'][1].slice(26) ==
                    address?.slice(2).toLowerCase()
                  ) {
                    settradehistory((tradehistory) => [
                      ...tradehistory,
                      [
                        parseInt(log['data'].slice(2, 34), 16),
                        parseInt(log['data'].slice(34, 66), 16),
                        parseInt(log['data'].slice(66, 67), 16),
                        parseInt(log['data'].slice(98, 130), 16),
                        marketKey,
                        log['transactionHash'],
                        _timestamp,
                        1,
                      ],
                    ]);
                    let buy = parseInt(log['data'].slice(66, 67), 16);
                    let quoteasset =
                      markets[addresstoMarket[log['address']]].quoteAddress;
                    let baseasset =
                      markets[addresstoMarket[log['address']]].baseAddress;
                    let amountin = customRound(
                      parseInt(log['data'].slice(2, 34), 16) /
                      10 **
                      Number(
                        buy
                          ? markets[addresstoMarket[log['address']]]
                            .quoteDecimals
                          : markets[addresstoMarket[log['address']]]
                            .baseDecimals,
                      ),
                      3,
                    );
                    let amountout = customRound(
                      parseInt(log['data'].slice(34, 66), 16) /
                      10 **
                      Number(
                        buy
                          ? markets[addresstoMarket[log['address']]]
                            .baseDecimals
                          : markets[addresstoMarket[log['address']]]
                            .quoteDecimals,
                      ),
                      3,
                    );
                    newTxPopup(
                      log['transactionHash'],
                      'swap',
                      buy ? quoteasset : baseasset,
                      buy ? baseasset : quoteasset,
                      amountin,
                      amountout,
                      '',
                      '',
                    );
                  }
                  settradesByMarket((tradesByMarket: any) => {
                    let temptradesByMarket = { ...tradesByMarket };
                    if (marketKey) {
                      if (!Array.isArray(temptradesByMarket[marketKey])) {
                        temptradesByMarket[marketKey] = [];
                      }
                      temptradesByMarket[marketKey] = [
                        ...temptradesByMarket[marketKey],
                        [
                          parseInt(log['data'].slice(2, 34), 16),
                          parseInt(log['data'].slice(34, 66), 16),
                          parseInt(log['data'].slice(66, 67), 16),
                          parseInt(log['data'].slice(98, 130), 16),
                          marketKey,
                          log['transactionHash'],
                          _timestamp,
                        ],
                      ];
                      temptradesByMarket[
                        settings.chainConfig[activechain].wethticker + 'USDC'
                      ] =
                        temptradesByMarket[
                        settings.chainConfig[activechain].ethticker + 'USDC'
                        ];
                    }
                    return { ...temptradesByMarket };
                  });
                  setcanceledorders((canceledorders) => {
                    let updatedCanceledOrders = [...canceledorders];
                    settradehistory((tradehistory: any) => {
                      let updatedTradeHistory = [...tradehistory];
                      for (let i = 0; i < _orderdata.length; i += 64) {
                        let chunk = _orderdata.slice(i, i + 64);
                        let newsize = parseInt(chunk.slice(32, 64), 16);
                        let orderIndex = temporders.findIndex(
                          (sublist: any) =>
                            sublist[0] ==
                            parseInt(chunk.slice(1, 20), 16) &&
                            sublist[1] ==
                            parseInt(chunk.slice(20, 32), 16) &&
                            sublist[4] == marketKey,
                        );
                        let canceledOrderIndex =
                          updatedCanceledOrders.findIndex(
                            (sublist: any) =>
                              sublist[0] ==
                              parseInt(chunk.slice(1, 20), 16) &&
                              sublist[1] ==
                              parseInt(chunk.slice(20, 32), 16) &&
                              sublist[4] == marketKey,
                          );
                        if (orderIndex != -1 && canceledOrderIndex != -1) {
                          let order = temporders[orderIndex];
                          let buy = order[3];
                          let quoteasset =
                            markets[addresstoMarket[log['address']]]
                              .quoteAddress;
                          let baseasset =
                            markets[addresstoMarket[log['address']]]
                              .baseAddress;
                          let amountquote = (
                            ((order[2] - order[7] - newsize / order[0]) *
                              order[0]) /
                            (Number(
                              markets[addresstoMarket[log['address']]]
                                .scaleFactor,
                            ) *
                              10 **
                              Number(
                                markets[addresstoMarket[log['address']]]
                                  .quoteDecimals,
                              ))
                          ).toFixed(2);
                          let amountbase = customRound(
                            (order[2] - order[7] - newsize / order[0]) /
                            10 **
                            Number(
                              markets[addresstoMarket[log['address']]]
                                .baseDecimals,
                            ),
                            3,
                          );
                          newTxPopup(
                            log['transactionHash'],
                            'fill',
                            buy ? quoteasset : baseasset,
                            buy ? baseasset : quoteasset,
                            buy ? amountquote : amountbase,
                            buy ? amountbase : amountquote,
                            `${order[0] / Number(markets[addresstoMarket[log['address']]].priceFactor)} ${markets[addresstoMarket[log['address']]].quoteAsset}`,
                            '',
                          );
                          if (newsize == 0) {
                            updatedTradeHistory.push([
                              order[3] == 1
                                ? (order[2] * order[0]) /
                                Number(markets[order[4]].scaleFactor)
                                : order[2],
                              order[3] == 1
                                ? order[2]
                                : (order[2] * order[0]) /
                                Number(markets[order[4]].scaleFactor),
                              order[3],
                              order[0],
                              order[4],
                              order[5],
                              Math.floor(Date.now() / 1000),
                              0,
                            ]);
                            if (orderIndex != -1) {
                              temporders.splice(orderIndex, 1);
                            }
                            updatedCanceledOrders[canceledOrderIndex] = [
                              ...updatedCanceledOrders[canceledOrderIndex],
                            ];
                            updatedCanceledOrders[canceledOrderIndex][9] =
                              1;
                            updatedCanceledOrders[canceledOrderIndex][7] =
                              order[2] - newsize / order[0];
                            updatedCanceledOrders[canceledOrderIndex][8] =
                              order[8] - newsize;
                          } else {
                            temporders[orderIndex][7] =
                              order[2] - newsize / order[0];
                            updatedCanceledOrders[canceledOrderIndex] = [
                              ...updatedCanceledOrders[canceledOrderIndex],
                            ];
                            updatedCanceledOrders[canceledOrderIndex][7] =
                              order[2] - newsize / order[0];
                          }
                        }
                      }
                      return updatedTradeHistory;
                    });
                    return updatedCanceledOrders;
                  });
                }
              }
            }
            return temporders
          });
          return { queue, set };
        })
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    let interval: any;
    setTimeout(() => {
      interval = setInterval(fetchData, 1000);
    }, 2000);

    return () => clearInterval(interval);
  }, [HTTP_URL, address?.slice(2)]);

  // tokeninfo data initial
  useEffect(() => {
    const processMarkets = async () => {
      try {
        const data = dayKlines;

        const processedMarkets = data
          .map((series: any) => {
            const idParts = series.id.split("-");
            const address = idParts[2];

            const match = Object.values(markets).find(
              (m) => m.address.toLowerCase() === address.toLowerCase()
            );

            if (!match) return;

            const marketVolume = series.klines.reduce((acc: number, c: DataPoint) => acc + parseFloat(c.volume.toString()), 2);
            const current = series.klines[series.klines.length - 1].close;
            const first = series.klines[0].open;
            const percentageChange = (current - first) / first * 100;

            return {
              ...match,
              pair: `${match.baseAsset}/${match.quoteAsset}`,
              currentPrice: formatSubscript((current / Number(match.priceFactor)).toFixed(Math.log10(Number(match.priceFactor)))),
              priceChange: `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(2)}%`,
              volume: formatCommas(marketVolume.toFixed(2)),
              marketKey: `${match.baseAsset}${match.quoteAsset}`,
              series: series.klines,
              firstPrice: first,
            };
          });

        setMarketsData(processedMarkets);
      } catch (error) {
        console.error("error fetching candles:", error);
      }
    };

    processMarkets();
  }, [markets, dayKlines]);

  // tokeninfo modal updating
  useEffect(() => {
    setMarketsData((prevMarkets) =>
      prevMarkets.map((market) => {
        const trades = tradesByMarket[market.marketKey] || [];

        if (trades.length === 0) return market;

        const latestTrade = trades[trades.length - 1];
        const currentPriceRaw = Number(latestTrade[3]);
        const percentageChange = (currentPriceRaw - market.firstPrice) / market.firstPrice * 100;
        const tradeVolume = (latestTrade[2] === 1 ? latestTrade[0] : latestTrade[1]) / 10 ** Number(market.quoteDecimals);

        return {
          ...market,
          volume: formatCommas((parseFloat(market.volume.toString().replace(/,/g, '')) + tradeVolume).toFixed(2)),
          currentPrice: formatSubscript(
            (currentPriceRaw / Number(market.priceFactor)).toFixed(
              Math.log10(Number(market.priceFactor))
            )
          ),
          priceChange: `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(
            2
          )}%`,
        };
      })
    );
  }, [tradesByMarket]);

  // search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent): void => {
      if (
        e.key === '/' &&
        document.activeElement &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)
      ) {
        e.preventDefault();
        setpopup(8);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSearchKeyDown = (
    e: ReactKeyboardEvent<HTMLInputElement>,
  ): void => {
    if (e.key === 'Enter' && sortedMarkets.length > 0) {
      e.preventDefault();
      const selectedMarket = sortedMarkets[selectedIndex];
      handleMarketSelect(
        selectedMarket.baseAddress,
        selectedMarket.quoteAddress,
      );
    } else if (e.key === 'Escape') {
      setIsSearchPopupOpen(false);
      setSearchQuery('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < sortedMarkets.length - 1 ? prev + 1 : prev,
      );
      refocusSearchInput();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      refocusSearchInput();
    }
  };

  useEffect(() => {
    if (isSearchPopupOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchPopupOpen]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    if (showSendDropdown) {
      const handleClick = (event: MouseEvent) => {
        if (sendButtonRef.current && sendButtonRef.current.contains(event.target as Node)) {
          return;
        }

        if (sendDropdownRef.current && !sendDropdownRef.current.contains(event.target as Node)) {
          setShowSendDropdown(false);
        }
      };

      document.addEventListener('mousedown', handleClick);
      return () => {
        document.removeEventListener('mousedown', handleClick);
      };
    }
  }, [showSendDropdown])

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const refocusSearchInput = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSort = (field: 'volume' | 'price' | 'change' | 'favorites') => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(undefined);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleMarketSelect = (baseToken: string, quoteToken: string): void => {
    if (location.pathname !== '/limit') {
      navigate('/limit');
    }

    setTokenIn(quoteToken);
    setTokenOut(baseToken);

    setIsSearchPopupOpen(false);
    setSearchQuery('');
    setpopup(0);
  };

  const setScaleOutput = (
    amountIn: number,
    startPrice: number,
    endPrice: number,
    numOrders: number,
    skew: number,
  ) => {
    const prices: number[] = Array.from({ length: numOrders }, (_, i) =>
      Math.round(
        startPrice +
        ((endPrice - startPrice) * i) /
        (numOrders - 1)
      )
    );

    let orderSizes: number[];
    let factorSum: number;

    if (tokenIn == activeMarket.quoteAddress) {
      factorSum = prices.reduce(
        (sum, price, i) => sum + price * (1 + ((skew - 1) * i) / (numOrders - 1)),
        0
      );
      const x = (Number(amountIn) * Number(activeMarket.scaleFactor)) / factorSum;
      orderSizes = Array.from({ length: numOrders }, (_, i) =>
        Math.round(x * (1 + ((skew - 1) * i) / (numOrders - 1)))
      );
    } else {
      factorSum = Array.from({ length: numOrders }).reduce(
        (sum: number, _, i) => sum + (1 + ((skew - 1) * i) / (numOrders - 1)),
        0
      );
      const x = Number(amountIn) / factorSum;
      orderSizes = Array.from({ length: numOrders }, (_, i) =>
        Math.round(x * (1 + ((skew - 1) * i) / (numOrders - 1)))
      );
    }
    const orderUsdValues: number[] = prices.map((price, i) =>
      Math.round((price * orderSizes[i]) / Number(activeMarket.scaleFactor)))
    let totalUsdValue = orderUsdValues.reduce((sum, val) => sum + val, 0);
    let totalTokenValue = orderSizes.reduce((sum, val) => sum + val, 0);
    if (tokenIn == activeMarket.quoteAddress) {
      if (totalUsdValue != amountIn) {
        orderUsdValues[-1] -= (amountIn - totalUsdValue)
        totalUsdValue = amountIn
      }
      setAmountOutScale(BigInt(totalTokenValue))
      setScaleOutputString(
        totalTokenValue
          /
          10 ** Number(tokendict[tokenOut].decimals)
          ? customRound(
            totalTokenValue
            /
            10 ** Number(tokendict[tokenOut].decimals),
            3,
          ) : ''
      );
    }
    else {
      if (totalTokenValue != amountIn) {
        orderSizes[-1] -= (amountIn - totalTokenValue)
        totalTokenValue = amountIn
      }
      setAmountOutScale(BigInt(totalUsdValue))
      setScaleOutputString(
        totalUsdValue
          /
          10 ** Number(tokendict[tokenOut].decimals)
          ? customRound(
            totalUsdValue
            /
            10 ** Number(tokendict[tokenOut].decimals),
            3,
          ) : ''
      );
    }
  }

  const calculateScaleOutput = (
    amountIn: number,
    startPrice: number,
    endPrice: number,
    numOrders: number,
    skew: number,
  ) => {
    const prices: number[] = Array.from({ length: numOrders }, (_, i) =>
      Math.round(
        startPrice +
        ((endPrice - startPrice) * i) /
        (numOrders - 1)
      )
    );

    let orderSizes: number[];
    let factorSum: number;

    if (tokenIn == activeMarket.quoteAddress) {
      factorSum = prices.reduce(
        (sum, price, i) => sum + price * (1 + ((skew - 1) * i) / (numOrders - 1)),
        0
      );
      const x = (Number(amountIn) * Number(activeMarket.scaleFactor)) / factorSum;
      orderSizes = Array.from({ length: numOrders }, (_, i) =>
        Math.round(x * (1 + ((skew - 1) * i) / (numOrders - 1)))
      );
    } else {
      factorSum = Array.from({ length: numOrders }).reduce(
        (sum: number, _, i) => sum + (1 + ((skew - 1) * i) / (numOrders - 1)),
        0
      );
      const x = Number(amountIn) / factorSum;
      orderSizes = Array.from({ length: numOrders }, (_, i) =>
        Math.round(x * (1 + ((skew - 1) * i) / (numOrders - 1)))
      );
    }
    const orderUsdValues: number[] = prices.map((price, i) =>
      Math.round((price * orderSizes[i]) / Number(activeMarket.scaleFactor)))
    let totalUsdValue = orderUsdValues.reduce((sum, val) => sum + val, 0);
    let totalTokenValue = orderSizes.reduce((sum, val) => sum + val, 0);
    if (tokenIn == activeMarket.quoteAddress) {
      if (totalUsdValue != amountIn) {
        orderUsdValues[-1] -= (amountIn - totalUsdValue)
        totalUsdValue = amountIn
      }
    }
    else {
      if (totalTokenValue != amountIn) {
        orderSizes[-1] -= (amountIn - totalTokenValue)
        totalTokenValue = amountIn
      }
    }
    return prices.map((price, i) => [price, orderSizes[i], orderUsdValues[i]])
  }

  // oc resizers
  const handleVertMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    initialMousePosRef.current = e.clientY;
    initialHeightRef.current = orderCenterHeight;

    setIsVertDragging(true);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  // order processing
  function processOrders(buyOrdersRaw: any[], sellOrdersRaw: any[]) {
    const mapOrders = (orderData: bigint[]) => {
      const orders = orderData
        .filter(
          (order) =>
            (order & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')) !==
            BigInt(0),
        )
        .map((order) => {
          const price =
            Number(order >> BigInt(128)) / Number(activeMarket.priceFactor);
          const size =
            Number(order & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')) /
            (Number(activeMarket.scaleFactor) *
              10 ** Number(activeMarket.quoteDecimals));
          return {
            price,
            size,
            totalSize: 0,
          };
        });

      let runningTotal = 0;
      return orders.map((order) => {
        runningTotal += order.size;
        return {
          ...order,
          totalSize: runningTotal,
        };
      });
    };

    return {
      buyOrders: mapOrders(buyOrdersRaw as bigint[]),
      sellOrders: mapOrders(sellOrdersRaw as bigint[]),
    };
  }

  // providing a rounded ver of orders for display
  const processOrdersForDisplay = (
    orders: Order[],
    amountsQuote: string,
    latestPrice: number,
  ) => {
    const priceDecimals =
      Math.floor(
        Math.log10(Number(latestPrice) / Number(activeMarket.priceFactor)),
      ) -
        Math.floor(Math.log10(Number(activeMarket.priceFactor))) >
        -5
        ? Math.max(
          0,
          Math.floor(Math.log10(Number(activeMarket.priceFactor))) +
          Math.floor(
            Math.log10(
              Number(latestPrice) / Number(activeMarket.priceFactor),
            ),
          ) +
          1,
        )
        : 0;
    const roundedOrders = orders.map((order) => ({
      price: Number(
        Number(order.price).toFixed(
          Math.floor(Math.log10(Number(activeMarket.priceFactor))),
        ),
      ),
      size:
        amountsQuote === 'Base'
          ? Number(Number(order.size / order.price).toFixed(priceDecimals))
          : Number(Number(order.size).toFixed(2)),
      totalSize:
        amountsQuote === 'Base'
          ? Number(Number(order.totalSize / order.price).toFixed(priceDecimals))
          : Number(Number(order.totalSize).toFixed(2)),
      shouldFlash: false,
    }));

    const defaultOrders = orders.map((order) => ({
      price: Number(
        Number(order.price).toFixed(
          Math.floor(Math.log10(Number(activeMarket.priceFactor))),
        ),
      ),
      size: Number(Number(order.size).toFixed(2)),
      totalSize: Number(Number(order.totalSize).toFixed(2)),
    }));

    return { roundedOrders, defaultOrders };
  };

  // drag resizer
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVertDragging) return;

      e.preventDefault();
      e.stopPropagation();

      const mouseDeltaY = e.clientY - initialMousePosRef.current;
      const newHeight = Math.max(
        236,
        Math.min(450, initialHeightRef.current - mouseDeltaY),
      );

      setOrderCenterHeight(newHeight);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isVertDragging) return;

      e.preventDefault();
      e.stopPropagation();

      setIsVertDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      const overlay = document.getElementById('global-drag-overlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }
    };

    if (isVertDragging) {
      const overlay = document.createElement('div');
      overlay.id = 'global-drag-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.zIndex = '9999';
      overlay.style.cursor = 'row-resize';
      document.body.appendChild(overlay);

      window.addEventListener('mousemove', handleMouseMove, { capture: true });
      window.addEventListener('mouseup', handleMouseUp, { capture: true });
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove, {
        capture: true,
      });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });

      const overlay = document.getElementById('global-drag-overlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }
    };
  }, [isVertDragging]);

  // auto resizer
  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight > 1080) {
        setOrderCenterHeight(363.58);
      } else if (window.innerHeight > 960) {
        setOrderCenterHeight(322.38);
      } else if (window.innerHeight > 840) {
        setOrderCenterHeight(281.18);
      } else if (window.innerHeight > 720) {
        setOrderCenterHeight(239.98);
      } else {
        setOrderCenterHeight(198.78);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // dynamic title
  useEffect(() => {
    let title = 'Crystal | Decentralized Cryptocurrency Exchange';

    switch (location.pathname) {
      case '/portfolio':
        title = 'Portfolio | Crystal';
        break;
      case '/referrals':
        title = 'Referrals | Crystal';
        break;
      case '/earn':
        title = 'Earn | Crystal';
        break;
      case '/leaderboard':
        title = 'Leaderboard | Crystal';
        break;
      case '/mint':
        title = 'Mint | Crystal';
        break;
      case '/swap':
      case '/limit':
      case '/send':
      case '/scale':
        if (trades.length > 0) {
          const formattedPrice = formatSubscript(trades[0][1]);
          if (activeMarket.quoteAsset) {
            title = `${formattedPrice} - ${activeMarket.baseAsset + '/' + activeMarket.quoteAsset} | Crystal`;
          } else {
            title = `${location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2)} | Crystal`;
          }
          break;
        }
    }

    document.title = title;
  }, [trades, location.pathname]);

  // referral data
  useEffect(() => {
    if (!refDataLoading && refData) {
      setClaimableFees(() => {
        let newFees = {};
        let totalFees = 0;
        Object.values(markets).forEach((market, index) => {
          if (
            market.baseAddress !==
            '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' &&
            mids !== null &&
            market !== null
          ) {
            const quoteIndex = index;
            const baseIndex = index + Object.values(markets).length;

            if (!(newFees as any)[market.quoteAsset]) {
              (newFees as any)[market.quoteAsset] =
                Number(refData[quoteIndex].result) /
                10 ** Number(market.quoteDecimals);
              totalFees +=
                Number(refData[quoteIndex].result) /
                10 ** Number(market.quoteDecimals);
            } else {
              (newFees as any)[market.quoteAsset] +=
                Number(refData[quoteIndex].result) /
                10 ** Number(market.quoteDecimals);
              totalFees +=
                Number(refData[quoteIndex].result) /
                10 ** Number(market.quoteDecimals);
            }

            const midValue = Number(
              mids?.[`${market.baseAsset}${market.quoteAsset}`]?.[0] || 0,
            );

            if (!(newFees as any)[market.baseAsset]) {
              (newFees as any)[market.baseAsset] =
                Number(refData[baseIndex].result) /
                10 ** Number(market.baseDecimals);
              totalFees +=
                (Number(refData[baseIndex].result) * midValue) /
                Number(market.scaleFactor) /
                10 ** Number(market.quoteDecimals);
            } else {
              (newFees as any)[market.baseAsset] +=
                Number(refData[baseIndex].result) /
                10 ** Number(market.baseDecimals);
              totalFees +=
                (Number(refData[baseIndex].result) * midValue) /
                Number(market.scaleFactor) /
                10 ** Number(market.quoteDecimals);
            }
          }
        });
        setTotalClaimableFees(totalFees);

        return newFees;
      });
    }
  }, [refData, mids]);

  // spread data - separate to ensure it works on initial load
  useEffect(() => {
    setPriceFactor(Number(activeMarket.priceFactor));
    setSymbolIn(activeMarket.quoteAsset);
    setSymbolOut(activeMarket.baseAsset);
  }, [roundedBuyOrders, roundedSellOrders]);

  // trades processing
  useEffect(() => {
    const temp: Trade[] | undefined = tradesByMarket[activeMarketKey];
    let processed: [boolean, string, number, string, string][] = [];

    if (temp) {
      const sortedTrades = [...temp].sort((a, b) => b[6] - a[6]);

      processed = sortedTrades.slice(0, 150).map((trade: Trade) => {
        const isBuy = trade[2] === 1;
        const { price, tradeValue } = getTradeValue(trade, activeMarket);
        const time = formatTime(trade[6]);
        const hash = trade[5];

        return [
          isBuy,
          formatCommas(
            price.toFixed(Math.log10(Number(activeMarket.priceFactor))),
          ),
          tradeValue,
          time,
          hash,
        ];
      });
    }

    setTrades(processed);
  }, [tradesByMarket[activeMarketKey]]);

  // update state variables when data is loaded
  useEffect(() => {
    if (!isLoading && data) {
      setStateIsLoading(false);
      setstateloading(false);
      setallowance(data[1].result || BigInt(0));
      let tempbalances = Object.values(tokendict).reduce((acc, token, i) => {
        const balance = data[2].result?.[i] || BigInt(0);
        acc[token.address] = balance;
        return acc;
      }, {});
      if (stateloading) {
        const percentage = !tempbalances[tokenIn]
          ? 0
          : Math.min(
            100,
            Math.floor(
              Number((amountIn * BigInt(100)) / tempbalances[tokenIn]),
            ),
          );
        setSliderPercent(percentage);
        const slider = document.querySelector('.balance-amount-slider');
        const popup = document.querySelector('.slider-percentage-popup');
        if (slider && popup) {
          const rect = slider.getBoundingClientRect();
          (popup as HTMLElement).style.left =
            `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
        }
      }
      setTokenBalances(tempbalances);
      if (switched == false && !isWrap) {
        const outputValue = BigInt(data?.[0].result?.at(-1) || BigInt(0));
        setamountOutSwap(outputValue);
        setoutputString(
          outputValue === BigInt(0)
            ? ''
            : parseFloat(
              customRound(
                Number(outputValue) /
                10 ** Number(tokendict[tokenOut].decimals),
                3,
              ),
            ).toString(),
        );
      } else if (!isWrap) {
        let inputValue;
        if (BigInt(data?.[0].result?.at(-1) || BigInt(0)) != amountOutSwap) {
          inputValue = BigInt(0);
        } else {
          inputValue = BigInt(data?.[0].result?.[0] || BigInt(0));
        }
        setamountIn(inputValue);
        setInputString(
          inputValue == BigInt(0)
            ? ''
            : parseFloat(
              customRound(
                Number(inputValue) /
                10 ** Number(tokendict[tokenIn].decimals),
                3,
              ),
            ).toString(),
        );
        const percentage = !tempbalances[tokenIn]
          ? 0
          : Math.min(
            100,
            Math.floor(
              Number((inputValue * BigInt(100)) / tempbalances[tokenIn]),
            ),
          );
        setSliderPercent(percentage);
        const slider = document.querySelector('.balance-amount-slider');
        const popup = document.querySelector('.slider-percentage-popup');
        if (slider && popup) {
          const rect = slider.getBoundingClientRect();
          (popup as HTMLElement).style.left =
            `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
        }
      }
      let tempmids;
      if (data[4].result) {
        tempmids = Object.keys(markets).reduce(
          (acc, market, i) => {
            const prices = [
              (data as any)[4].result?.[0][i],
              (data as any)[4].result?.[1][i],
              (data as any)[4].result?.[2][i],
            ];
            acc[market] = prices;
            return acc;
          },
          {} as Record<string, any>,
        );
        setmids(tempmids);
      }
      if (data[3].result) {
        sethighestBid((data as any)[3].result[0] || BigInt(0));
        setlowestAsk((data as any)[3].result[1] || BigInt(0));
        const orderdata = data?.[3].result;

        if (orderdata && Array.isArray(orderdata) && orderdata.length >= 4) {
          try {
            const buyOrdersRaw: bigint[] = [];
            const sellOrdersRaw: bigint[] = [];

            for (let i = 2; i < orderdata[2].length; i += 64) {
              const chunk = orderdata[2].slice(i, i + 64);
              buyOrdersRaw.push(BigInt(`0x${chunk}`));
            }

            for (let i = 2; i < orderdata[3].length; i += 64) {
              const chunk = orderdata[3].slice(i, i + 64);
              sellOrdersRaw.push(BigInt(`0x${chunk}`));
            }

            const {
              buyOrders: processedBuyOrders,
              sellOrders: processedSellOrders,
            } = processOrders(buyOrdersRaw, sellOrdersRaw);

            if (tempmids && tempmids[activeMarketKey]) {
              const { roundedOrders: roundedBuy, defaultOrders: liquidityBuy } =
                processOrdersForDisplay(
                  processedBuyOrders,
                  amountsQuote,
                  tempmids[activeMarketKey][0],
                );
              const {
                roundedOrders: roundedSell,
                defaultOrders: liquiditySell,
              } = processOrdersForDisplay(
                processedSellOrders,
                amountsQuote,
                tempmids[activeMarketKey][0],
              );

              const highestBid =
                roundedBuy.length > 0 ? roundedBuy[0].price : undefined;
              const lowestAsk =
                roundedSell.length > 0 ? roundedSell[0].price : undefined;

              const spread = {
                spread:
                  highestBid !== undefined && lowestAsk !== undefined
                    ? lowestAsk - highestBid
                    : NaN,
                averagePrice:
                  highestBid !== undefined && lowestAsk !== undefined
                    ? Number(
                      ((highestBid + lowestAsk) / 2).toFixed(
                        Math.log10(Number(activeMarket.priceFactor)) + 1,
                      ),
                    )
                    : NaN,
              };

              roundedBuy.forEach((order, index) => {
                const match = roundedBuyOrders.find(
                  (o) => o.price == order.price && o.size == order.size,
                );
                if (!match || index == 0 && index != roundedBuyOrders.findIndex((o) => o.price == order.price && o.size == order.size)) {
                  order.shouldFlash = true;
                }
              });
              roundedSell.forEach((order, index) => {
                const match = roundedSellOrders.find(
                  (o) => o.price == order.price && o.size == order.size,
                );
                if (!match || index == 0 && index != roundedSellOrders.findIndex((o) => o.price == order.price && o.size == order.size)) {
                  order.shouldFlash = true;
                }
              });
              setSpreadData(spread);
              setRoundedBuyOrders(roundedBuy);
              setRoundedSellOrders(roundedSell);
              setLiquidityBuyOrders(liquidityBuy);
              setLiquiditySellOrders(liquiditySell);
            }

            setBaseInterval(1 / Number(activeMarket.priceFactor));
            setOBInterval(
              localStorage.getItem(`${activeMarket.baseAsset}_ob_interval`)
                ? Number(
                  localStorage.getItem(
                    `${activeMarket.baseAsset}_ob_interval`,
                  ),
                )
                : 1 / Number(activeMarket.priceFactor),
            );
          } catch (error) {
            console.error(error);
          }
        }
      }
    } else {
      setStateIsLoading(true);
    }
  }, [data, activechain, isLoading, activeTab, dataUpdatedAt, amountsQuote]);

  // update display values when loading is finished
  useEffect(() => {
    if (!isLoading && !stateIsLoading && Object.keys(mids).length > 0) {
      setDisplayValuesLoading(false);
      let estPrice = multihop
        ? (Number(amountIn) * 100000) /
        Number(activeMarket.fee) /
        10 ** Number(tokendict[tokenIn].decimals) /
        (Number(amountOutSwap) /
          10 ** Number(tokendict[tokenOut].decimals)) ||
        (() => {
          let price = 1;
          let mid;
          for (let i = 0; i < activeMarket.path.length - 1; i++) {
            let market = getMarket(
              activeMarket.path[i],
              activeMarket.path[i + 1],
            );
            if (activeMarket.path[i] == market.quoteAddress) {
              mid = Number(mids[market.baseAsset + market.quoteAsset][2]);
              price *= mid / Number(market.priceFactor);
            } else {
              mid = Number(mids[market.baseAsset + market.quoteAsset][1]);
              price /= mid / Number(market.priceFactor);
            }
          }
          return price;
        })()
        : amountIn != BigInt(0) && amountOutSwap != BigInt(0)
          ? Number(
            tokenIn == activeMarket.quoteAddress
              ? amountIn
              : (Number(amountOutSwap) * 100000) / Number(activeMarket.fee),
          ) /
          10 ** Number(tokendict[activeMarket.quoteAddress].decimals) /
          (Number(
            tokenIn == activeMarket.quoteAddress
              ? (Number(amountOutSwap) * 100000) / Number(activeMarket.fee)
              : amountIn,
          ) /
            10 ** Number(tokendict[activeMarket.baseAddress].decimals))
          : (tokenIn == activeMarket.quoteAddress
            ? Number(lowestAsk)
            : Number(highestBid)) / Number(activeMarket.priceFactor);
      setAveragePrice(
        multihop
          ? `${customRound(estPrice, 2)} ${tokendict[tokenOut].ticker}`
          : `${estPrice.toFixed(Math.log10(Number(activeMarket.priceFactor)))} USDC`,
      );
      setPriceImpact(() => {
        let temppriceimpact;
        if (multihop) {
          let price = 1;
          let mid;
          for (let i = 0; i < activeMarket.path.length - 1; i++) {
            let market = getMarket(
              activeMarket.path[i],
              activeMarket.path[i + 1],
            );
            mid = Number(mids[market.baseAsset + market.quoteAsset][0]);
            if (activeMarket.path[i] == market.quoteAddress) {
              price *= mid / Number(market.priceFactor);
            } else {
              price /= mid / Number(market.priceFactor);
            }
          }
          temppriceimpact = `${customRound(
            0.001 > Math.abs(((estPrice - price) / price) * 100)
              ? 0
              : Math.abs(((estPrice - price) / price) * 100),
            3,
          )}%`;
        } else {
          temppriceimpact = `${customRound(
            0.001 >
              Math.abs(
                ((estPrice -
                  (tokenIn == activeMarket.quoteAddress
                    ? Number(lowestAsk) / Number(activeMarket.priceFactor)
                    : Number(highestBid) / Number(activeMarket.priceFactor))) /
                  (tokenIn == activeMarket.quoteAddress
                    ? Number(lowestAsk) / Number(activeMarket.priceFactor)
                    : Number(highestBid) / Number(activeMarket.priceFactor))) *
                100,
              )
              ? 0
              : Math.abs(
                ((estPrice -
                  (tokenIn == activeMarket.quoteAddress
                    ? Number(lowestAsk) / Number(activeMarket.priceFactor)
                    : Number(highestBid) /
                    Number(activeMarket.priceFactor))) /
                  (tokenIn == activeMarket.quoteAddress
                    ? Number(lowestAsk) / Number(activeMarket.priceFactor)
                    : Number(highestBid) /
                    Number(activeMarket.priceFactor))) *
                100,
              ),
            3,
          )}%`;
        }
        setSwapButtonDisabled(
          (amountIn === BigInt(0) ||
            amountIn > tokenBalances[tokenIn] ||
            ((orderType == 1 || multihop) &&
              !isWrap &&
              BigInt(data?.[0].result?.at(0) || BigInt(0)) != amountIn)) &&
          connected &&
          userchain == activechain,
        );
        setSwapButton(
          connected && userchain == activechain
            ? (switched &&
              amountOutSwap != BigInt(0) &&
              amountIn == BigInt(0)) ||
              ((orderType == 1 || multihop) &&
                !isWrap &&
                BigInt(data?.[0].result?.at(0) || BigInt(0)) != amountIn)
              ? 0
              : amountIn === BigInt(0)
                ? 1
                : amountIn <= tokenBalances[tokenIn]
                  ? allowance < amountIn && tokenIn != eth && !isWrap
                    ? 6
                    : 2
                  : 3
            : connected
              ? 4
              : 5,
        );
        setLimitButtonDisabled(
          (amountIn === BigInt(0) ||
            limitPrice == BigInt(0) ||
            (tokenIn == activeMarket.quoteAddress
              ? amountIn < activeMarket.minSize
              : (amountIn * limitPrice) / activeMarket.scaleFactor <
              activeMarket.minSize) ||
            amountIn > tokenBalances[tokenIn] ||
            (addliquidityonly &&
              ((limitPrice >= lowestAsk &&
                tokenIn == activeMarket.quoteAddress) ||
                (limitPrice <= highestBid &&
                  tokenIn == activeMarket.baseAddress)))) &&
          connected &&
          userchain == activechain,
        );
        setLimitButton(
          connected && userchain == activechain
            ? amountIn === BigInt(0)
              ? 0
              : limitPrice == BigInt(0)
                ? 1
                : amountIn <= tokenBalances[tokenIn]
                  ? addliquidityonly &&
                    ((limitPrice >= lowestAsk &&
                      tokenIn == activeMarket.quoteAddress) ||
                      (limitPrice <= highestBid &&
                        tokenIn == activeMarket.baseAddress))
                    ? tokenIn == activeMarket.quoteAddress
                      ? 2
                      : 3
                    : (
                      tokenIn == activeMarket.quoteAddress
                        ? amountIn < activeMarket.minSize
                        : (amountIn * limitPrice) /
                        activeMarket.scaleFactor <
                        activeMarket.minSize
                    )
                      ? 4
                      : allowance < amountIn && tokenIn != eth
                        ? 9
                        : 5
                  : 6
            : connected
              ? 7
              : 8,
        );
        setSendButtonDisabled(
          (amountIn === BigInt(0) ||
            amountIn > tokenBalances[tokenIn] ||
            !/^(0x[0-9a-fA-F]{40})$/.test(recipient)) &&
          connected &&
          userchain == activechain,
        );
        setSendButton(
          connected && userchain == activechain
            ? amountIn === BigInt(0)
              ? 0
              : !/^(0x[0-9a-fA-F]{40})$/.test(recipient)
                ? 1
                : amountIn <= tokenBalances[tokenIn]
                  ? 2
                  : 3
            : connected
              ? 4
              : 5,
        );
        setScaleButtonDisabled(
          (amountIn === BigInt(0) ||
            scaleStart == BigInt(0) || scaleEnd == BigInt(0) || scaleOrders == BigInt(0) || scaleOrders == BigInt(1) || scaleSkew == 0 ||
            calculateScaleOutput(
              Number(amountIn),
              Number(scaleStart),
              Number(scaleEnd),
              Number(scaleOrders),
              Number(scaleSkew)
            ).some((order) => order[2] < activeMarket.minSize) ||
            amountIn > tokenBalances[tokenIn] ||
            (
              ((scaleStart >= lowestAsk &&
                tokenIn == activeMarket.quoteAddress) ||
                (scaleStart <= highestBid &&
                  tokenIn == activeMarket.baseAddress) || (scaleEnd >= lowestAsk &&
                    tokenIn == activeMarket.quoteAddress) ||
                (scaleEnd <= highestBid &&
                  tokenIn == activeMarket.baseAddress)))) &&
          connected &&
          userchain == activechain,
        );
        setScaleButton(
          connected && userchain == activechain
            ? amountIn === BigInt(0)
              ? 0
              : scaleStart == BigInt(0)
                ? 1 : scaleEnd == BigInt(0) ? 2
                  : amountIn <= tokenBalances[tokenIn]
                    ? ((scaleStart >= lowestAsk &&
                      tokenIn == activeMarket.quoteAddress) ||
                      (scaleStart <= highestBid &&
                        tokenIn == activeMarket.baseAddress))
                      ? tokenIn == activeMarket.quoteAddress
                        ? 3
                        : 4 : ((scaleEnd >= lowestAsk &&
                          tokenIn == activeMarket.quoteAddress) ||
                          (scaleEnd <= highestBid &&
                            tokenIn == activeMarket.baseAddress))
                        ? tokenIn == activeMarket.quoteAddress
                          ? 5
                          : 6
                        : (
                          calculateScaleOutput(
                            Number(amountIn),
                            Number(scaleStart),
                            Number(scaleEnd),
                            Number(scaleOrders),
                            Number(scaleSkew)
                          ).some((order) => order[2] < activeMarket.minSize)
                        ) ? 7 : scaleOrders <= BigInt(1) ? 8 : scaleSkew == 0 ? 9
                          : allowance < amountIn && tokenIn != eth
                            ? 13
                            : 14
                    : 10
            : connected
              ? 11
              : 12,
        );
        setwarning(
          !isWrap &&
            ((amountIn == BigInt(0) && amountOutSwap != BigInt(0)) ||
              ((orderType == 1 || multihop) &&
                BigInt(data?.[0].result?.at(0) || BigInt(0)) != amountIn))
            ? multihop
              ? 3
              : 2
            : parseFloat(temppriceimpact.slice(0, -1)) > 5 &&
              !isWrap &&
              slippage < BigInt(9500) &&
              !isLoading &&
              !stateIsLoading
              ? 1
              : 0,
        );
        return temppriceimpact == 'NaN%' ? '0%' : temppriceimpact;
      });
      setTradeFee(
        `${(Number(amountIn) * (100000 - Number(activeMarket.fee))) /
          100000 /
          10 ** Number(tokendict[tokenIn].decimals) >
          0.0001
          ? customRound(
            (Number(amountIn) * (100000 - Number(activeMarket.fee))) /
            100000 /
            10 ** Number(tokendict[tokenIn].decimals),
            2,
          )
          : (Number(amountIn) * (100000 - Number(activeMarket.fee))) /
            100000 /
            10 ** Number(tokendict[tokenIn].decimals) ==
            0
            ? '0'
            : '<0.0001'
        } ${tokendict[tokenIn].ticker}`,
      );
    } else if (stateIsLoading && !isWrap) {
      setDisplayValuesLoading(true);
    }
  }, [
    isLoading,
    stateIsLoading,
    amountIn,
    amountOutSwap,
    tokenIn,
    tokenOut,
    activechain,
    isWrap,
    addliquidityonly,
    limitPrice,
    highestBid,
    lowestAsk,
    activeMarket.quoteAddress,
    activeMarket.baseAddress,
    orderType,
    slippage,
    connected,
    userchain,
    tokenBalances[tokenIn],
    multihop,
    data?.[0].result?.at(0),
    recipient,
    mids,
    scaleStart,
    scaleEnd,
    scaleOrders,
    scaleSkew,
    amountOutScale,
  ]);

  // fetch initial address info
  useEffect(() => {
    if (address) {
      setTimeout(() => {
        setTransactions([]);
        settradehistory([]);
        setorders([]);
        setcanceledorders([]);
      }, 10);
      (async () => {
        try {
          const endpoint = `https://gateway.thegraph.com/api/${settings.graphKey}/subgraphs/id/BDU1hP5UVEeYcvWME3eApDa24oBteAfmupPHktgSzu5r`;

          let temptradehistory: any[] = [];
          let temporders: any[] = [];
          let tempcanceledorders: any[] = [];

          const query = `
            query {
              orderFilledBatches(first: 10, orderDirection: desc, orderBy: id) {
                id
                total
                orders(first: 1000, where: {caller: "${address}"}) {
                  caller
                  amountIn
                  amountOut
                  buySell
                  price
                  timeStamp
                  transactionHash
                  blockNumber
                  contractAddress
                }
              }
              orderMaps(where:{caller: "${address}"}) {
                id
                counter
                batches(first: 10, orderDirection: desc, orderBy: id) {
                  id
                  orders(first: 1000) {
                    id
                    caller
                    originalSizeBase
                    originalSizeQuote
                    filledAmountBase
                    filledSizeQuote
                    price
                    buySell
                    contractAddress
                    transactionHash
                    timestamp
                    status
                  }
                }
              }
            }
          `;

          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          });

          const result = await response.json();

          const filledBatches = result?.data?.orderFilledBatches || [];
          for (const batch of filledBatches) {
            const orders = batch.orders || [];
            for (const event of orders) {
              const marketKey = addresstoMarket[event.contractAddress];
              if (marketKey) {
                temptradehistory.push([
                  event.amountIn,
                  event.amountOut,
                  event.buySell,
                  event.price,
                  marketKey,
                  event.transactionHash,
                  event.timeStamp,
                  1,
                ]);
              }
            }
          }

          const updatedMaps = result?.data?.orderMaps || [];
          for (const orderMap of updatedMaps) {
            const batches = orderMap.batches || [];
            for (const batch of batches) {
              const orders = batch.orders || [];
              for (const order of orders) {
                const marketKey = addresstoMarket[order.contractAddress];
                if (!marketKey) continue;
                const row = [
                  parseInt(order.id.split('-')[0], 10),
                  parseInt(order.id.split('-')[2], 10),
                  Number(order.originalSizeBase.toString()),
                  order.buySell,
                  marketKey,
                  order.transactionHash,
                  order.timestamp,
                  Number(order.filledAmountBase.toString()),
                  Number(order.originalSizeQuote.toString()),
                  order.status,
                ];

                if (order.status === 2) {
                  temporders.push(row);
                  tempcanceledorders.push(row);
                } else {
                  tempcanceledorders.push(row);
                }
              }
            }
          }

          settradehistory((prev) => [...temptradehistory, ...prev]);
          setorders((prev) => [...temporders, ...prev]);
          setcanceledorders((prev) => [...tempcanceledorders, ...prev]);

          setaddressinfoloading(false);
        } catch (error) {
          console.error("Error fetching logs:", error);
          setaddressinfoloading(false);
        }
      })();
    }
    else {
      setTimeout(() => {
        setTransactions([]);
        settradehistory([]);
        setorders([]);
        setcanceledorders([]);
      }, 500);
      setaddressinfoloading(false);
    }
  }, [address, activechain]);

  // klines + trades
  useEffect(() => {
    (async () => {
      try {
        settradesloading(true);
        // amountin, amountout, buy/sell, price, market, hash, timestamp
        let temptradesByMarket: any = {};
        Object.keys(markets).forEach((market) => {
          temptradesByMarket[market] = [];
        });
        const endpoint = `https://gateway.thegraph.com/api/${settings.graphKey}/subgraphs/id/BDU1hP5UVEeYcvWME3eApDa24oBteAfmupPHktgSzu5r`;
        let allLogs: any[] = [];

        const query = `
          query {
            orders1: orderFilleds(
              first: 150,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0x3e186070cb7a1b2c498cd7347735859bc5ae278d" }
            ) {
              id
              caller
              amountIn
              amountOut
              buySell
              price
              timeStamp
              transactionHash
              blockNumber
              contractAddress
            }
            orders2: orderFilleds(
              first: 150,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0x3514e481e658533ee4d02a7de53c19a803f1783f" }
            ) {
              id
              caller
              amountIn
              amountOut
              buySell
              price
              timeStamp
              transactionHash
              blockNumber
              contractAddress
            }
            orders3: orderFilleds(
              first: 150,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0x35e79dac2ef49abd319f50d028f99e7d0f1a3559" }
            ) {
              id
              caller
              amountIn
              amountOut
              buySell
              price
              timeStamp
              transactionHash
              blockNumber
              contractAddress
            }
            orders4: orderFilleds(
              first: 150,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0x12b6179c20e9bac7398ab9d38be8997d1048d3c3" }
            ) {
              id
              caller
              amountIn
              amountOut
              buySell
              price
              timeStamp
              transactionHash
              blockNumber
              contractAddress
            }
            orders5: orderFilleds(
              first: 150,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0x20db6a0db7b47539e513ce29ac4018fe504fbb2a" }
            ) {
              id
              caller
              amountIn
              amountOut
              buySell
              price
              timeStamp
              transactionHash
              blockNumber
              contractAddress
            }
            series_collection(
              where: {
                id_gte: "series-1h-",
                id_lte: "series-1h-ffffffffffffffffffffffffffffffffffffffff"
              }
            ) {
              id
              klines(first: 24, orderBy: time, orderDirection: desc) {
                id
                time
                open
                high
                low
                close
                volume
              }
            }
          }
        `;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const json = await response.json();

        const orders = json.data.orders1
          .concat(
            json.data.orders2,
            json.data.orders3,
            json.data.orders4,
            json.data.orders5
          );

        allLogs = allLogs.concat(orders);

        if (Array.isArray(allLogs)) {
          for (const event of allLogs) {
            if (addresstoMarket[event.contractAddress]) {
              temptradesByMarket[addresstoMarket[event.contractAddress]].push([
                event.amountIn,
                event.amountOut,
                event.buySell,
                event.price,
                addresstoMarket[event.contractAddress],
                event.transactionHash,
                event.timeStamp,
              ]);
            } else {
            }
          }
        }

        temptradesByMarket[
          settings.chainConfig[activechain].wethticker + 'USDC'
        ] =
          temptradesByMarket[
          settings.chainConfig[activechain].ethticker + 'USDC'
          ];
        settradesByMarket(temptradesByMarket);
        settradesloading(false);
        if (
          sendInputString === '' &&
          activeTab === 'send' &&
          amountIn &&
          BigInt(amountIn) != BigInt(0)
        ) {
          setsendInputString(
            `$${calculateUSDValue(
              BigInt(amountIn),
              temptradesByMarket[
              getMarket(activeMarket.path.at(0), activeMarket.path.at(1))
                .baseAsset +
              getMarket(activeMarket.path.at(0), activeMarket.path.at(1))
                .quoteAsset
              ],
              tokenIn,
              getMarket(activeMarket.path.at(0), activeMarket.path.at(1)),
            ).toFixed(2)}`,
          );
        }

        setDayKlines(json.data.series_collection);
      } catch (error) {
        console.error("Error fetching data:", error);
        settradesloading(false);
      }
    })();
  }, [activechain]);

  // click outside slippage and resize handler and click outside popup and showtrade esc
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setpopup(0);
        setSendUsdValue('');
        setSendInputAmount('');
        setSendAmountIn(BigInt(0));
        setSendButton(0);
        setIsLanguageDropdownOpen(false);
        settokenString('');
        setSelectedConnector(null);

        if (showTrade && !simpleView) {
          document.body.style.overflow = 'auto'
          document.querySelector('.right-column')?.classList.add('hide');
          document.querySelector('.right-column')?.classList.remove('show');
          document.querySelector('.trade-mobile-switch')?.classList.remove('open');
          setTimeout(() => {
            setShowTrade(false);
          }, 300);
        }
      }
    };
    const handleMouseDown = (e: MouseEvent) => {
      setpopup((popup) => {
        if (showTrade && popup == 0 && !simpleView) {
          const rectangleElement = document.querySelector('.rectangle');
          if (
            rectangleElement &&
            !rectangleElement.contains(e.target as Node)
          ) {
            document.body.style.overflow = 'auto'
            document.querySelector('.right-column')?.classList.add('hide');
            document.querySelector('.right-column')?.classList.remove('show');
            document.querySelector('.trade-mobile-switch')?.classList.remove('open');
            setTimeout(() => {
              setShowTrade(false);
            }, 300);
          }
        }

        if (!popupref.current?.contains(e.target as Node)) {
          setIsLanguageDropdownOpen(false);
          setSendUsdValue('');
          setSendInputAmount('');
          setSendAmountIn(BigInt(0));
          setSendButton(0);
          settokenString('');
          return 0;
        }
        return popup;
      });
    };
    const handleResize = () => setWindowWidth(window.innerWidth);
    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [showTrade]);

  // url
  useEffect(() => {
    const path = location.pathname.slice(1);
    if (['swap', 'limit', 'send', 'scale'].includes(path)) {
      setSearchParams({
        ...(path != 'send' ? { tokenIn } : { token: tokenIn }),
        ...(tokenOut && path != 'send' && { tokenOut }),
        ...(switched && path == 'swap'
          ? { amountOut: amountOutSwap }
          : { amountIn }),
      });
    }
  }, [tokenIn, tokenOut, activeTab, amountIn, amountOutSwap, switched]);

  // update active tab
  useEffect(() => {
    const path = location.pathname.slice(1);
    setActiveTab(path);
    if (['swap', 'limit', 'send', 'scale'].includes(path)) {
      if (amountIn == BigInt(0)) {
        setInputString('');
      }
      const slider = document.querySelector('.balance-amount-slider');
      const popup = document.querySelector('.slider-percentage-popup');
      if (slider && popup) {
        const rect = slider.getBoundingClientRect();
        (popup as HTMLElement).style.left =
          `${(rect.width - 15) * (sliderPercent / 100) + 15 / 2}px`;
      }
      if (path == 'send') {
        setswitched(false);
        setsendInputString(
          amountIn != BigInt(0)
            ? `$${calculateUSDValue(
              amountIn,
              tradesByMarket[
              getMarket(activeMarket.path.at(0), activeMarket.path.at(1))
                .baseAsset +
              getMarket(activeMarket.path.at(0), activeMarket.path.at(1))
                .quoteAsset
              ],
              tokenIn,
              getMarket(activeMarket.path.at(0), activeMarket.path.at(1)),
            ).toFixed(2)}`
            : '',
        );
      } else if (path == 'limit') {
        setCurrentProText(t('pro'));
        setswitched(false);
        if (multihop || isWrap) {
          let token;
          let pricefetchmarket;
          for (const market in markets) {
            if (markets[market].quoteAddress === tokenOut) {
              token = tokendict[markets[market].baseAddress];
              pricefetchmarket = getMarket(
                markets[market].baseAddress,
                tokenOut,
              );
              setTokenIn(markets[market].baseAddress);
            } else if (markets[market].baseAddress === tokenOut) {
              token = tokendict[markets[market].quoteAddress];
              pricefetchmarket = getMarket(
                markets[market].quoteAddress,
                tokenOut,
              );
              setTokenIn(markets[market].quoteAddress);
            }
          }
          setamountIn(
            limitPrice != BigInt(0) && amountOutSwap != BigInt(0)
              ? token.address === pricefetchmarket?.baseAddress
                ? (amountOutSwap *
                  (pricefetchmarket.scaleFactor || BigInt(1))) /
                limitPrice
                : (amountOutSwap * limitPrice) /
                (pricefetchmarket.scaleFactor || BigInt(1))
              : BigInt(0),
          );
          setInputString(
            (limitPrice != BigInt(0) && amountOutSwap != BigInt(0)
              ? token.address === pricefetchmarket?.baseAddress
                ? customRound(
                  Number(
                    (amountOutSwap *
                      (pricefetchmarket.scaleFactor || BigInt(1))) /
                    limitPrice,
                  ) /
                  10 ** Number(token.decimals),
                  3,
                )
                : customRound(
                  Number(
                    (amountOutSwap * limitPrice) /
                    (pricefetchmarket.scaleFactor || BigInt(1)),
                  ) /
                  10 ** Number(token.decimals),
                  3,
                )
              : ''
            ).toString(),
          );
          setamountOutLimit(amountOutSwap);
          setlimitoutputString(outputString);
          const percentage = !tokenBalances[token.address]
            ? 0
            : Math.min(
              100,
              Math.floor(
                Number(
                  ((limitPrice != BigInt(0) && amountOutSwap != BigInt(0)
                    ? token === pricefetchmarket?.baseAddress
                      ? (amountOutSwap *
                        (pricefetchmarket.scaleFactor || BigInt(1))) /
                      limitPrice
                      : (amountOutSwap * limitPrice) /
                      (pricefetchmarket.scaleFactor || BigInt(1))
                    : BigInt(0)) *
                    BigInt(100)) /
                  tokenBalances[token.address],
                ),
              ),
            );
          setSliderPercent(percentage);
          const slider = document.querySelector('.balance-amount-slider');
          const popup = document.querySelector('.slider-percentage-popup');
          if (slider && popup) {
            const rect = slider.getBoundingClientRect();
            (popup as HTMLElement).style.left =
              `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
          }
        } else {
          setamountOutLimit(
            limitPrice != BigInt(0) && amountIn != BigInt(0)
              ? tokenIn === activeMarket?.baseAddress
                ? (amountIn * limitPrice) /
                (activeMarket.scaleFactor || BigInt(1))
                : (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
                limitPrice
              : BigInt(0),
          );
          setlimitoutputString(
            (limitPrice != BigInt(0) && amountIn != BigInt(0)
              ? tokenIn === activeMarket?.baseAddress
                ? customRound(
                  Number(
                    (amountIn * limitPrice) /
                    (activeMarket.scaleFactor || BigInt(1)),
                  ) /
                  10 ** Number(tokendict[tokenOut].decimals),
                  3,
                )
                : customRound(
                  Number(
                    (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
                    limitPrice,
                  ) /
                  10 ** Number(tokendict[tokenOut].decimals),
                  3,
                )
              : ''
            )
              .toString()
              .replace(/(\.\d*?[1-9])0+$/g, '$1')
              .replace(/\.0+$/, ''),
          );
        }
      } else if (path == 'swap') {
        setCurrentProText(t('pro'));
      } else if (path == 'scale') {
        setswitched(false);
        if (multihop || isWrap) {
          let token;
          for (const market in markets) {
            if (markets[market].quoteAddress === tokenOut) {
              token = tokendict[markets[market].baseAddress];
              setTokenIn(markets[market].baseAddress);
            } else if (markets[market].baseAddress === tokenOut) {
              token = tokendict[markets[market].quoteAddress];
              setTokenIn(markets[market].quoteAddress);
            }
          }
          setamountIn(
            BigInt(0)
          );
          setInputString('')
          setAmountOutScale(BigInt(0))
          setScaleOutputString('')
          setScaleStart(BigInt(0))
          setScaleEnd(BigInt(0))
          setScaleStartString('')
          setScaleEndString('')
          const percentage = !tokenBalances[token.address]
            ? 0
            : Math.min(
              100,
              Math.floor(
                Number(
                  (BigInt(0) *
                    BigInt(100)) /
                  tokenBalances[token.address],
                ),
              ),
            );
          setSliderPercent(percentage);
          const slider = document.querySelector('.balance-amount-slider');
          const popup = document.querySelector('.slider-percentage-popup');
          if (slider && popup) {
            const rect = slider.getBoundingClientRect();
            (popup as HTMLElement).style.left =
              `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
          }
        }
        else {
          if (scaleStart && scaleEnd && scaleOrders && scaleSkew) {
            setScaleOutput(Number(amountIn), Number(scaleStart), Number(scaleEnd), Number(scaleOrders), Number(scaleSkew))
          }
        }
      }
    }

    return () => {
    };
  }, [location.pathname]);

  // limit chase
  useEffect(() => {
    if (limitChase && mids?.[activeMarketKey]?.[0]) {
      setlimitPrice(mids[activeMarketKey][0]);
      setlimitPriceString(
        (
          Number(mids[activeMarketKey][0]) / Number(activeMarket.priceFactor)
        ).toFixed(Math.log10(Number(activeMarket.priceFactor))),
      );
      setamountOutLimit(
        mids[activeMarketKey][0] != BigInt(0) && amountIn != BigInt(0)
          ? tokenIn === activeMarket?.baseAddress
            ? (amountIn * mids[activeMarketKey][0]) /
            (activeMarket.scaleFactor || BigInt(1))
            : (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
            mids[activeMarketKey][0]
          : BigInt(0),
      );
      setlimitoutputString(
        (mids[activeMarketKey][0] != BigInt(0) && amountIn != BigInt(0)
          ? tokenIn === activeMarket?.baseAddress
            ? customRound(
              Number(
                (amountIn * mids[activeMarketKey][0]) /
                (activeMarket.scaleFactor || BigInt(1)),
              ) /
              10 ** Number(tokendict[tokenOut].decimals),
              3,
            )
            : customRound(
              Number(
                (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
                mids[activeMarketKey][0],
              ) /
              10 ** Number(tokendict[tokenOut].decimals),
              3,
            )
          : ''
        ).toString(),
      );
    }
  }, [limitChase, activechain, mids?.[activeMarketKey]?.[0], activeMarketKey]);

  // tx popup time
  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions((prevTransactions) => {
        const time = Date.now();
        const filteredTransactions = prevTransactions
          .filter((tx) => time - tx.timestamp < 9950)
          .map((tx) => ({
            ...tx,
            isNew: time - tx.timestamp < 300 ? true : false,
            isExiting: time - tx.timestamp > 9700 ? true : false,
          }));
        return filteredTransactions.length !== prevTransactions.length ||
          filteredTransactions.some(
            (tx, i) => tx.isNew !== prevTransactions[i]?.isNew,
          ) ||
          filteredTransactions.some(
            (tx, i) => tx.isExiting !== prevTransactions[i]?.isExiting,
          )
          ? filteredTransactions
          : prevTransactions;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // popup
  useEffect(() => {
    if (popupref.current && blurref.current) {
      const updateBlurSize = () => {
        if (popupref.current && blurref.current) {
          const { offsetWidth, offsetHeight } = popupref.current;
          blurref.current.style.width = `${offsetWidth}px`;
          blurref.current.style.height = `${offsetHeight}px`;
        }
      };

      updateBlurSize();

      const resizeObserver = new ResizeObserver(updateBlurSize);
      resizeObserver.observe(popupref.current);

      return () => resizeObserver.disconnect();
    }
  }, [popup, connected]);

  // input tokenlist
  const TokenList1 = (
    <div className="tokenlistcontainer">
      <ul className="tokenlist">
        {Object.values(tokendict).filter(
          (token) =>
            token.ticker.toLowerCase().includes(tokenString.toLowerCase()) ||
            token.name.toLowerCase().includes(tokenString.toLowerCase()) ||
            token.address.toLowerCase().includes(tokenString.toLowerCase()),
        ).length === 0 ? (
          <div className="empty-token-list">
            <div className="empty-token-list-content">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="empty-token-list-icon"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <div className="empty-token-list-text">{t('noTokens')}</div>
            </div>
          </div>
        ) : (
          Object.values(tokendict)
            .filter(
              (token) =>
                token.ticker
                  .toLowerCase()
                  .includes(tokenString.toLowerCase()) ||
                token.name.toLowerCase().includes(tokenString.toLowerCase()) ||
                token.address.toLowerCase().includes(tokenString.toLowerCase()),
            )
            .map((token) => (
              <button
                className="tokenbutton"
                key={token.address}
                onClick={() => {
                  let pricefetchmarket;
                  let newTokenOut;
                  setpopup(0);
                  settokenString('');
                  setTokenIn(token.address);
                  setStateIsLoading(true);
                  if (activeTab === 'swap') {
                    if (token.address !== tokenOut) {
                      if (
                        markets[
                        `${tokendict[token.address].ticker}${tokendict[tokenOut].ticker}`
                        ] ||
                        markets[
                        `${tokendict[tokenOut].ticker}${tokendict[token.address].ticker}`
                        ]
                      ) {
                        newTokenOut = tokenOut;
                      } else {
                        const path = findShortestPath(token.address, tokenOut);
                        if (path && path.length > 1 && activeTab == 'swap') {
                          newTokenOut = tokenOut;
                        } else {
                          for (const market in markets) {
                            if (
                              markets[market].quoteAddress === token.address
                            ) {
                              setTokenOut(markets[market].baseAddress);
                              newTokenOut = markets[market].baseAddress;
                            } else if (
                              markets[market].baseAddress === token.address
                            ) {
                              setTokenOut(markets[market].quoteAddress);
                              newTokenOut = markets[market].quoteAddress;
                            }
                          }
                        }
                      }
                      if (
                        (tokenOut == eth && token.address == weth) ||
                        (tokenOut == weth && token.address == eth)
                      ) {
                        if (switched == false) {
                          setamountIn((amountIn * BigInt(10) ** token.decimals) / BigInt(10) ** tokendict[tokenIn].decimals)
                          setamountOutSwap((amountIn * BigInt(10) ** token.decimals) / BigInt(10) ** tokendict[tokenIn].decimals);
                          setoutputString(inputString);
                          const percentage = !tokenBalances[token.address]
                            ? 0
                            : Math.min(
                              100,
                              Math.floor(
                                Number(
                                  ((amountIn * BigInt(10) ** token.decimals) /
                                    BigInt(10) ** tokendict[tokenIn].decimals * BigInt(100)) /
                                  tokenBalances[token.address],
                                ),
                              ),
                            );
                          setSliderPercent(percentage);
                          const slider = document.querySelector(
                            '.balance-amount-slider',
                          );
                          const popup = document.querySelector(
                            '.slider-percentage-popup',
                          );
                          if (slider && popup) {
                            const rect = slider.getBoundingClientRect();
                            (popup as HTMLElement).style.left =
                              `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                          }
                        }
                        else {
                          setamountIn(amountOutSwap);
                          setInputString(outputString);
                          const percentage = !tokenBalances[token.address]
                            ? 0
                            : Math.min(
                              100,
                              Math.floor(
                                Number(
                                  (amountOutSwap * BigInt(100)) /
                                  tokenBalances[token.address],
                                ),
                              ),
                            );
                          setSliderPercent(percentage);
                          const slider = document.querySelector(
                            '.balance-amount-slider',
                          );
                          const popup = document.querySelector(
                            '.slider-percentage-popup',
                          );
                          if (slider && popup) {
                            const rect = slider.getBoundingClientRect();
                            (popup as HTMLElement).style.left =
                              `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                          }
                        }
                      } else {
                        if (switched === false && token.address != tokenIn) {
                          setamountIn(
                            (amountIn * BigInt(10) ** token.decimals) /
                            BigInt(10) ** tokendict[tokenIn].decimals
                          );
                          setamountOutSwap(BigInt(0));
                          setoutputString('');
                          const percentage = !tokenBalances[token.address]
                            ? 0
                            : Math.min(
                              100,
                              Math.floor(
                                Number(
                                  ((amountIn * BigInt(10) ** token.decimals) /
                                    BigInt(10) ** tokendict[tokenIn].decimals * BigInt(100)) /
                                  tokenBalances[token.address],
                                ),
                              ),
                            );
                          setSliderPercent(percentage);
                          const slider = document.querySelector(
                            '.balance-amount-slider',
                          );
                          const popup = document.querySelector(
                            '.slider-percentage-popup',
                          );
                          if (slider && popup) {
                            const rect = slider.getBoundingClientRect();
                            (popup as HTMLElement).style.left =
                              `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                          }
                        } else if (newTokenOut != tokenOut) {
                          setamountOutSwap(
                            (amountOutSwap *
                              BigInt(10) ** tokendict[newTokenOut].decimals) /
                            BigInt(10) ** tokendict[tokenOut].decimals,
                          );
                          setamountIn(BigInt(0));
                          setInputString('');
                        }
                      }
                      setlimitChase(true);
                    } else {
                      setTokenOut(tokenIn);
                      if (
                        (amountIn != BigInt(0) || amountOutSwap != BigInt(0)) &&
                        !isWrap
                      ) {
                        if (switched == false) {
                          setswitched(true);
                          setStateIsLoading(true);
                          setInputString('');
                          setamountIn(BigInt(0));
                          setamountOutSwap(amountIn);
                          setoutputString(
                            amountIn === BigInt(0)
                              ? ''
                              : String(
                                customRound(
                                  Number(amountIn) /
                                  10 ** Number(tokendict[tokenIn].decimals),
                                  3,
                                ),
                              ),
                          );
                        } else {
                          setswitched(false);
                          setStateIsLoading(true);
                          setoutputString('');
                          setamountOutSwap(BigInt(0));
                          setamountIn(amountOutSwap);
                          setInputString(
                            amountOutSwap === BigInt(0)
                              ? ''
                              : String(
                                customRound(
                                  Number(amountOutSwap) /
                                  10 **
                                  Number(tokendict[tokenOut].decimals),
                                  3,
                                ),
                              ),
                          );
                          const percentage = !tokenBalances[tokenOut]
                            ? 0
                            : Math.min(
                              100,
                              Math.floor(
                                Number(
                                  (amountOutSwap * BigInt(100)) /
                                  tokenBalances[tokenOut],
                                ),
                              ),
                            );
                          setSliderPercent(percentage);
                          const slider = document.querySelector(
                            '.balance-amount-slider',
                          );
                          const popup = document.querySelector(
                            '.slider-percentage-popup',
                          );
                          if (slider && popup) {
                            const rect = slider.getBoundingClientRect();
                            (popup as HTMLElement).style.left =
                              `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                          }
                        }
                      }
                    }
                  } else if (activeTab == 'limit') {
                    if (token.address != tokenOut) {
                      if (
                        markets[
                        `${tokendict[token.address].ticker}${tokendict[tokenOut].ticker}`
                        ] ||
                        markets[
                        `${tokendict[tokenOut].ticker}${tokendict[token.address].ticker}`
                        ]
                      ) {
                      } else {
                        for (const market in markets) {
                          if (markets[market].quoteAddress === token.address) {
                            setTokenOut(markets[market].baseAddress);
                          } else if (
                            markets[market].baseAddress === token.address
                          ) {
                            setTokenOut(markets[market].quoteAddress);
                          }
                        }
                      }
                      setamountIn(
                        (amountIn * BigInt(10) ** token.decimals) /
                        BigInt(10) ** tokendict[tokenIn].decimals,
                      );
                      setlimitChase(true);
                      const percentage = !tokenBalances[token.address]
                        ? 0
                        : Math.min(
                          100,
                          Math.floor(
                            Number(
                              ((amountIn * BigInt(10) ** token.decimals) /
                                BigInt(10) ** tokendict[tokenIn].decimals * BigInt(100)) /
                              tokenBalances[token.address],
                            ),
                          ),
                        );
                      setSliderPercent(percentage);
                      const slider = document.querySelector(
                        '.balance-amount-slider',
                      );
                      const popup = document.querySelector(
                        '.slider-percentage-popup',
                      );
                      if (slider && popup) {
                        const rect = slider.getBoundingClientRect();
                        (popup as HTMLElement).style.left =
                          `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                      }
                    } else {
                      setTokenOut(tokenIn);
                      if (amountIn != BigInt(0)) {
                        setInputString(limitoutputString);
                        setlimitoutputString(inputString);
                        setamountIn(amountOutLimit);
                        setamountOutLimit(amountIn);
                        const percentage = !tokenBalances[tokenOut]
                          ? 0
                          : Math.min(
                            100,
                            Math.floor(
                              Number(
                                (amountOutLimit * BigInt(100)) /
                                tokenBalances[tokenOut],
                              ),
                            ),
                          );
                        setSliderPercent(percentage);
                        const slider = document.querySelector(
                          '.balance-amount-slider',
                        );
                        const popup = document.querySelector(
                          '.slider-percentage-popup',
                        );
                        if (slider && popup) {
                          const rect = slider.getBoundingClientRect();
                          (popup as HTMLElement).style.left =
                            `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                        }
                      }
                    }
                  } else if (activeTab == 'send') {
                    setlimitChase(true);
                    if (token.address == tokenOut && multihop == false) {
                      setTokenOut(tokenIn);
                      pricefetchmarket = getMarket(token.address, tokenIn);
                    } else if (
                      markets[
                      `${tokendict[token.address].ticker}${tokendict[tokenOut].ticker}`
                      ] ||
                      markets[
                      `${tokendict[tokenOut].ticker}${tokendict[token.address].ticker}`
                      ]
                    ) {
                      pricefetchmarket = getMarket(token.address, tokenOut);
                    } else {
                      for (const market in markets) {
                        if (markets[market].quoteAddress === token.address) {
                          setTokenOut(markets[market].baseAddress);
                          pricefetchmarket = getMarket(
                            token.address,
                            markets[market].baseAddress,
                          );
                        } else if (
                          markets[market].baseAddress === token.address
                        ) {
                          setTokenOut(markets[market].quoteAddress);
                          pricefetchmarket = getMarket(
                            token.address,
                            markets[market].quoteAddress,
                          );
                        }
                      }
                    }
                    if (displayMode == 'usd') {
                      setInputString(
                        customRound(
                          Number(
                            calculateTokenAmount(
                              sendInputString.replace(/^\$|,/g, ''),
                              tradesByMarket[
                              pricefetchmarket.baseAsset +
                              pricefetchmarket.quoteAsset
                              ],
                              token.address,
                              pricefetchmarket,
                            ),
                          ) /
                          10 ** Number(token.decimals),
                          3,
                        ).toString(),
                      );
                      setamountIn(
                        calculateTokenAmount(
                          sendInputString.replace(/^\$|,/g, ''),
                          tradesByMarket[
                          pricefetchmarket.baseAsset +
                          pricefetchmarket.quoteAsset
                          ],
                          token.address,
                          pricefetchmarket,
                        ),
                      );
                      const percentage = !tokenBalances[token.address]
                        ? 0
                        : Math.min(
                          100,
                          Math.floor(
                            Number(
                              (calculateTokenAmount(
                                sendInputString.replace(/^\$|,/g, ''),
                                tradesByMarket[
                                pricefetchmarket.baseAsset +
                                pricefetchmarket.quoteAsset
                                ],
                                token.address,
                                pricefetchmarket,
                              ) * BigInt(100)) /
                              tokenBalances[token.address],
                            ),
                          ),
                        );
                      setSliderPercent(percentage);
                      const slider = document.querySelector(
                        '.balance-amount-slider',
                      );
                      const popup = document.querySelector(
                        '.slider-percentage-popup',
                      );
                      if (slider && popup) {
                        const rect = slider.getBoundingClientRect();
                        (popup as HTMLElement).style.left =
                          `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                      }
                    } else {
                      setamountIn(
                        (amountIn * BigInt(10) ** token.decimals) /
                        BigInt(10) ** tokendict[tokenIn].decimals
                      );
                      setsendInputString(
                        `$${calculateUSDValue(
                          (amountIn * BigInt(10) ** token.decimals) /
                          BigInt(10) ** tokendict[tokenIn].decimals,
                          tradesByMarket[
                          pricefetchmarket.baseAsset +
                          pricefetchmarket.quoteAsset
                          ],
                          token.address,
                          pricefetchmarket,
                        ).toFixed(2)}`,
                      );
                      const percentage = !tokenBalances[token.address]
                        ? 0
                        : Math.min(
                          100,
                          Math.floor(
                            Number(
                              ((amountIn * BigInt(10) ** token.decimals) /
                                BigInt(10) ** tokendict[tokenIn].decimals * BigInt(100)) /
                              tokenBalances[token.address],
                            ),
                          ),
                        );
                      setSliderPercent(percentage);
                      const slider = document.querySelector(
                        '.balance-amount-slider',
                      );
                      const popup = document.querySelector(
                        '.slider-percentage-popup',
                      );
                      if (slider && popup) {
                        const rect = slider.getBoundingClientRect();
                        (popup as HTMLElement).style.left =
                          `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                      }
                    }
                  } else if (activeTab == 'scale') {
                    if (token.address != tokenOut) {
                      if (
                        markets[
                        `${tokendict[token.address].ticker}${tokendict[tokenOut].ticker}`
                        ] ||
                        markets[
                        `${tokendict[tokenOut].ticker}${tokendict[token.address].ticker}`
                        ]
                      ) {
                      } else {
                        for (const market in markets) {
                          if (markets[market].quoteAddress === token.address) {
                            setTokenOut(markets[market].baseAddress);
                          } else if (
                            markets[market].baseAddress === token.address
                          ) {
                            setTokenOut(markets[market].quoteAddress);
                          }
                        }
                      }
                      setamountIn(
                        BigInt(0)
                      );
                      setInputString('')
                      setAmountOutScale(BigInt(0))
                      setScaleOutputString('')
                      setScaleStart(BigInt(0))
                      setScaleEnd(BigInt(0))
                      setScaleStartString('')
                      setScaleEndString('')
                      setlimitChase(true);
                      const percentage = !tokenBalances[token.address]
                        ? 0
                        : Math.min(
                          100,
                          Math.floor(
                            Number(
                              BigInt(0) /
                              tokenBalances[token.address],
                            ),
                          ),
                        );
                      setSliderPercent(percentage);
                      const slider = document.querySelector(
                        '.balance-amount-slider',
                      );
                      const popup = document.querySelector(
                        '.slider-percentage-popup',
                      );
                      if (slider && popup) {
                        const rect = slider.getBoundingClientRect();
                        (popup as HTMLElement).style.left =
                          `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                      }
                    } else {
                      setTokenOut(tokenIn);
                      if (amountIn != BigInt(0) && scaleStart && scaleEnd && scaleOrders && scaleSkew) {
                        setInputString(scaleOutputString);
                        setScaleOutputString(inputString);
                        setamountIn(amountOutScale);
                        setAmountOutScale(amountIn);
                        const percentage = !tokenBalances[tokenOut]
                          ? 0
                          : Math.min(
                            100,
                            Math.floor(
                              Number(
                                (amountOutScale * BigInt(100)) /
                                tokenBalances[tokenOut],
                              ),
                            ),
                          );
                        setSliderPercent(percentage);
                        const slider = document.querySelector('.balance-amount-slider');
                        const popup = document.querySelector('.slider-percentage-popup');
                        if (slider && popup) {
                          const rect = slider.getBoundingClientRect();
                          (popup as HTMLElement).style.left =
                            `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                        }
                      }
                      else {
                        setamountIn(BigInt(0))
                        setInputString('')
                      }
                    }
                  }
                }}
              >
                <img className="tokenlistimage" src={token.image} />
                <div className="tokenlisttext">
                  <div className="tokenlistname">
                    {token.ticker}
                    {favorites.includes(token.address) && (
                      <span className="token-favorites-label">Favorite</span>
                    )}
                  </div>
                  <div className="tokenlistticker">{token.name}</div>
                </div>
                <div className="token-right-content">
                  <div className="tokenlistbalance">
                    {customRound(
                      Number(tokenBalances[token.address] ?? 0) /
                      10 ** Number(token.decimals ?? 18),
                      3,
                    )
                      .replace(/(\.\d*?[1-9])0+$/g, '$1')
                      .replace(/\.0+$/, '')}
                  </div>
                  <div className="token-address-container">
                    <span className="token-address">
                      {`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}
                    </span>
                    <div
                      className="copy-address-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(token.address);
                        const copyIcon =
                          e.currentTarget.querySelector('.copy-icon');
                        const checkIcon =
                          e.currentTarget.querySelector('.check-icon');
                        if (copyIcon && checkIcon) {
                          copyIcon.classList.add('hidden');
                          checkIcon.classList.add('visible');
                          setTimeout(() => {
                            copyIcon.classList.remove('hidden');
                            checkIcon.classList.remove('visible');
                          }, 2000);
                        }
                      }}
                    >
                      <svg
                        className="copy-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      <svg
                        className="check-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12l3 3 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            ))
        )}
      </ul>
    </div>
  );

  // output tokenlist
  const TokenList2 = (
    <div className="tokenlistcontainer">
      <ul className="tokenlist">
        {Object.values(tokendict).filter(
          (token) =>
            token.ticker.toLowerCase().includes(tokenString.toLowerCase()) ||
            token.name.toLowerCase().includes(tokenString.toLowerCase()) ||
            token.address.toLowerCase().includes(tokenString.toLowerCase()),
        ).length === 0 ? (
          <div className="empty-token-list">
            <div className="empty-token-list-content">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="empty-token-list-icon"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <div className="empty-token-list-text">{t('noTokens')}</div>
            </div>
          </div>
        ) : (
          Object.values(tokendict)
            .filter(
              (token) =>
                token.ticker
                  .toLowerCase()
                  .includes(tokenString.toLowerCase()) ||
                token.name.toLowerCase().includes(tokenString.toLowerCase()) ||
                token.address.toLowerCase().includes(tokenString.toLowerCase()),
            )
            .map((token) => (
              <button
                className="tokenbutton"
                key={token.address}
                onClick={() => {
                  let newTokenIn;
                  setpopup(0);
                  settokenString('');
                  setTokenOut(token.address);
                  setStateIsLoading(true);
                  if (activeTab == 'swap') {
                    if (token.address != tokenIn) {
                      if (
                        markets[
                        `${tokendict[token.address].ticker}${tokendict[tokenIn].ticker}`
                        ] ||
                        markets[
                        `${tokendict[tokenIn].ticker}${tokendict[token.address].ticker}`
                        ]
                      ) {
                        newTokenIn = tokenIn;
                      } else {
                        const path = findShortestPath(
                          tokendict[tokenIn].address,
                          token.address,
                        );
                        if (path && path.length > 1) {
                          newTokenIn = tokenIn;
                        } else {
                          for (const market in markets) {
                            if (
                              markets[market].quoteAddress === token.address
                            ) {
                              setTokenIn(markets[market].baseAddress);
                              newTokenIn = markets[market].baseAddress;
                            } else if (
                              markets[market].baseAddress === token.address
                            ) {
                              setTokenIn(markets[market].quoteAddress);
                              newTokenIn = markets[market].quoteAddress;
                            }
                          }
                        }
                      }
                      if (
                        (tokenIn == eth && token.address == weth) ||
                        (tokenIn == weth && token.address == eth)
                      ) {
                        if (switched == false) {
                          setamountOutSwap(amountIn);
                          setoutputString(inputString);
                        }
                        else {
                          setamountOutSwap((amountOutSwap * BigInt(10) ** token.decimals) / BigInt(10) ** tokendict[tokenOut].decimals)
                          setamountIn((amountOutSwap * BigInt(10) ** token.decimals) / BigInt(10) ** tokendict[tokenOut].decimals);
                          setInputString(outputString);
                          const percentage = !tokenBalances[tokenIn]
                            ? 0
                            : Math.min(
                              100,
                              Math.floor(
                                Number(
                                  ((amountOutSwap * BigInt(10) ** token.decimals) / BigInt(10) ** tokendict[tokenOut].decimals * BigInt(100)) /
                                  tokenBalances[tokenIn],
                                ),
                              ),
                            );
                          setSliderPercent(percentage);
                          const slider = document.querySelector(
                            '.balance-amount-slider',
                          );
                          const popup = document.querySelector(
                            '.slider-percentage-popup',
                          );
                          if (slider && popup) {
                            const rect = slider.getBoundingClientRect();
                            (popup as HTMLElement).style.left =
                              `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                          }
                        }
                      } else {
                        if (switched == false) {
                          setamountIn(
                            (amountIn *
                              BigInt(10) ** tokendict[newTokenIn].decimals) /
                            BigInt(10) ** tokendict[tokenIn].decimals
                          );
                          setamountOutSwap(BigInt(0));
                          setoutputString('');
                          const percentage = !tokenBalances[newTokenIn]
                            ? 0
                            : Math.min(
                              100,
                              Math.floor(
                                Number(
                                  ((amountIn *
                                    BigInt(10) ** tokendict[newTokenIn].decimals) /
                                    BigInt(10) ** tokendict[tokenIn].decimals * BigInt(100)) /
                                  tokenBalances[newTokenIn],
                                ),
                              ),
                            );
                          setSliderPercent(percentage);
                          const slider = document.querySelector(
                            '.balance-amount-slider',
                          );
                          const popup = document.querySelector(
                            '.slider-percentage-popup',
                          );
                          if (slider && popup) {
                            const rect = slider.getBoundingClientRect();
                            (popup as HTMLElement).style.left =
                              `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                          }
                        } else if (token.address != tokenOut) {
                          setamountOutSwap(
                            (amountOutSwap * BigInt(10) ** token.decimals) /
                            BigInt(10) ** tokendict[tokenOut].decimals,
                          );
                          setamountIn(BigInt(0));
                          setInputString('');
                        }
                      }
                      setlimitChase(true);
                    } else {
                      setTokenIn(tokenOut);
                      if (
                        (amountIn != BigInt(0) || amountOutSwap != BigInt(0)) &&
                        !isWrap
                      ) {
                        if (switched == false) {
                          setswitched(true);
                          setStateIsLoading(true);
                          setInputString('');
                          setamountIn(BigInt(0));
                          setamountOutSwap(amountIn);
                          setoutputString(
                            amountIn === BigInt(0)
                              ? ''
                              : String(
                                customRound(
                                  Number(amountIn) /
                                  10 ** Number(tokendict[tokenIn].decimals),
                                  3,
                                ),
                              ),
                          );
                        } else {
                          setswitched(false);
                          setStateIsLoading(true);
                          setoutputString('');
                          setamountOutSwap(BigInt(0));
                          setamountIn(amountOutSwap);
                          setInputString(
                            amountOutSwap === BigInt(0)
                              ? ''
                              : String(
                                customRound(
                                  Number(amountOutSwap) /
                                  10 **
                                  Number(tokendict[tokenOut].decimals),
                                  3,
                                ),
                              ),
                          );
                          const percentage = !tokenBalances[tokenOut]
                            ? 0
                            : Math.min(
                              100,
                              Math.floor(
                                Number(
                                  (amountOutSwap * BigInt(100)) /
                                  tokenBalances[tokenOut],
                                ),
                              ),
                            );
                          setSliderPercent(percentage);
                          const slider = document.querySelector(
                            '.balance-amount-slider',
                          );
                          const popup = document.querySelector(
                            '.slider-percentage-popup',
                          );
                          if (slider && popup) {
                            const rect = slider.getBoundingClientRect();
                            (popup as HTMLElement).style.left =
                              `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                          }
                        }
                      }
                    }
                  } else if (activeTab == 'limit') {
                    if (token.address != tokenIn) {
                      if (
                        markets[
                        `${tokendict[token.address].ticker}${tokendict[tokenIn].ticker}`
                        ] ||
                        markets[
                        `${tokendict[tokenIn].ticker}${tokendict[token.address].ticker}`
                        ]
                      ) {
                        newTokenIn = tokenIn;
                      } else {
                        for (const market in markets) {
                          if (markets[market].quoteAddress === token.address) {
                            setTokenIn(markets[market].baseAddress);
                            newTokenIn = markets[market].baseAddress;
                          } else if (
                            markets[market].baseAddress === token.address
                          ) {
                            setTokenIn(markets[market].quoteAddress);
                            newTokenIn = markets[market].quoteAddress;
                          }
                        }
                      }
                      setamountIn(
                        (amountIn *
                          BigInt(10) ** tokendict[newTokenIn].decimals) /
                        BigInt(10) ** tokendict[tokenIn].decimals,
                      );
                      setlimitChase(true);
                      const percentage = !tokenBalances[newTokenIn]
                        ? 0
                        : Math.min(
                          100,
                          Math.floor(
                            Number(
                              ((amountIn * BigInt(10) ** tokendict[newTokenIn].decimals) /
                                BigInt(10) ** tokendict[tokenIn].decimals * BigInt(100)) /
                              tokenBalances[newTokenIn],
                            ),
                          ),
                        );
                      setSliderPercent(percentage);
                      const slider = document.querySelector(
                        '.balance-amount-slider',
                      );
                      const popup = document.querySelector(
                        '.slider-percentage-popup',
                      );
                      if (slider && popup) {
                        const rect = slider.getBoundingClientRect();
                        (popup as HTMLElement).style.left =
                          `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                      }
                    } else {
                      setTokenIn(tokenOut);
                      if (amountIn != BigInt(0)) {
                        setInputString(limitoutputString);
                        setlimitoutputString(inputString);
                        setamountIn(amountOutLimit);
                        setamountOutLimit(amountIn);
                        const percentage = !tokenBalances[tokenOut]
                          ? 0
                          : Math.min(
                            100,
                            Math.floor(
                              Number(
                                (amountOutLimit * BigInt(100)) /
                                tokenBalances[tokenOut],
                              ),
                            ),
                          );
                        setSliderPercent(percentage);
                        const slider = document.querySelector(
                          '.balance-amount-slider',
                        );
                        const popup = document.querySelector(
                          '.slider-percentage-popup',
                        );
                        if (slider && popup) {
                          const rect = slider.getBoundingClientRect();
                          (popup as HTMLElement).style.left =
                            `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                        }
                      }
                    }
                  } else if (activeTab == 'scale') {
                    if (token.address != tokenIn) {
                      if (
                        markets[
                        `${tokendict[token.address].ticker}${tokendict[tokenIn].ticker}`
                        ] ||
                        markets[
                        `${tokendict[tokenIn].ticker}${tokendict[token.address].ticker}`
                        ]
                      ) {
                        newTokenIn = tokenIn;
                      } else {
                        for (const market in markets) {
                          if (markets[market].quoteAddress === token.address) {
                            setTokenIn(markets[market].baseAddress);
                            newTokenIn = markets[market].baseAddress;
                          } else if (
                            markets[market].baseAddress === token.address
                          ) {
                            setTokenIn(markets[market].quoteAddress);
                            newTokenIn = markets[market].quoteAddress;
                          }
                        }
                      }
                      setamountIn(
                        BigInt(0)
                      );
                      setInputString('')
                      setAmountOutScale(BigInt(0))
                      setScaleOutputString('')
                      setScaleStart(BigInt(0))
                      setScaleEnd(BigInt(0))
                      setScaleStartString('')
                      setScaleEndString('')
                      setlimitChase(true);
                      const percentage = !tokenBalances[newTokenIn]
                        ? 0
                        : Math.min(
                          100,
                          Math.floor(
                            Number(
                              BigInt(0) /
                              tokenBalances[newTokenIn],
                            ),
                          ),
                        );
                      setSliderPercent(percentage);
                      const slider = document.querySelector(
                        '.balance-amount-slider',
                      );
                      const popup = document.querySelector(
                        '.slider-percentage-popup',
                      );
                      if (slider && popup) {
                        const rect = slider.getBoundingClientRect();
                        (popup as HTMLElement).style.left =
                          `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                      }
                    } else {
                      setTokenIn(tokenOut);
                      if (amountIn != BigInt(0) && scaleStart && scaleEnd && scaleOrders && scaleSkew) {
                        setInputString(scaleOutputString);
                        setScaleOutputString(inputString);
                        setamountIn(amountOutScale);
                        setAmountOutScale(amountIn);
                        const percentage = !tokenBalances[tokenOut]
                          ? 0
                          : Math.min(
                            100,
                            Math.floor(
                              Number(
                                (amountOutScale * BigInt(100)) /
                                tokenBalances[tokenOut],
                              ),
                            ),
                          );
                        setSliderPercent(percentage);
                        const slider = document.querySelector('.balance-amount-slider');
                        const popup = document.querySelector('.slider-percentage-popup');
                        if (slider && popup) {
                          const rect = slider.getBoundingClientRect();
                          (popup as HTMLElement).style.left =
                            `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                        }
                      }
                      else {
                        setamountIn(BigInt(0))
                        setInputString('')
                      }
                    }
                  }
                }}
              >
                <img className="tokenlistimage" src={token.image} />
                <div className="tokenlisttext">
                  <div className="tokenlistname">
                    {token.ticker}
                    {favorites.includes(token.address) && (
                      <span className="token-favorites-label">Favorite</span>
                    )}
                  </div>
                  <div className="tokenlistticker">{token.name}</div>
                </div>
                <div className="token-right-content">
                  <div className="tokenlistbalance">
                    {customRound(
                      Number(tokenBalances[token.address] ?? 0) /
                      10 ** Number(token.decimals ?? 18),
                      3,
                    )
                      .replace(/(\.\d*?[1-9])0+$/g, '$1')
                      .replace(/\.0+$/, '')}
                  </div>
                  <div className="token-address-container">
                    <span className="token-address">
                      {`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}
                    </span>
                    <div
                      className="copy-address-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(token.address);
                        const copyIcon =
                          e.currentTarget.querySelector('.copy-icon');
                        const checkIcon =
                          e.currentTarget.querySelector('.check-icon');
                        if (copyIcon && checkIcon) {
                          copyIcon.classList.add('hidden');
                          checkIcon.classList.add('visible');
                          setTimeout(() => {
                            copyIcon.classList.remove('hidden');
                            checkIcon.classList.remove('visible');
                          }, 2000);
                        }
                      }}
                    >
                      <svg
                        className="copy-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      <svg
                        className="check-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12l3 3 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            ))
        )}
      </ul>
    </div>
  );

  //popup modals
  const Modals = (
    <>
      {popup ? <div ref={blurref} className="popup-blur"></div> : <></>}
      <div className={`blur-background-popups ${popup != 0 ? 'active' : ''}`}>
        {popup === 1 ? ( // token select
          <div ref={popupref} className="tokenselectbg">
            <button
              className="tokenselect-close-button"
              onClick={() => {
                setpopup(0);
                settokenString('');
              }}
            >
              <img src={closebutton} className="close-button-icon" />
            </button>
            <div className="tokenselectheader1">{t('selectAToken')}</div>
            <div className="tokenselectheader2">{t('selectTokenSubtitle')}</div>
            <div className="tokenselectheader-divider"></div>
            <div className="tokenlistbg"></div>
            <div style={{ position: 'relative' }}>
              <input
                className="tokenselect"
                onChange={(e) => {
                  debouncedSetTokenString(e.target.value);
                }}
                placeholder={t('searchToken')}
                autoFocus={!(windowWidth <= 1020)}
              />
              {tokenString && (
                <button
                  className="tokenselect-clear visible"
                  onClick={() => {
                    settokenString('');
                    const input = document.querySelector(
                      '.tokenselect',
                    ) as HTMLInputElement;
                    if (input) {
                      input.value = '';
                      input.focus();
                    }
                  }}
                >
                  {t('clear')}
                </button>
              )}
            </div>
            {TokenList1}
          </div>
        ) : null}
        {popup === 2 ? ( // token select
          <div ref={popupref} className="tokenselectbg">
            <button
              className="tokenselect-close-button"
              onClick={() => {
                setpopup(0);
                settokenString('');
              }}
            >
              <img src={closebutton} className="close-button-icon" />
            </button>
            <div className="tokenselectheader1">{t('selectAToken')}</div>
            <div className="tokenselectheader2">{t('selectTokenSubtitle')}</div>
            <div className="tokenlistbg"></div>
            <div style={{ position: 'relative' }}>
              <input
                className="tokenselect"
                onChange={(e) => {
                  debouncedSetTokenString(e.target.value);
                }}
                placeholder={t('searchToken')}
                autoFocus={!(windowWidth <= 1020)}
              />
              {tokenString && (
                <button
                  className="tokenselect-clear visible"
                  onClick={() => {
                    settokenString('');
                    const input = document.querySelector(
                      '.tokenselect',
                    ) as HTMLInputElement;
                    if (input) {
                      input.value = '';
                      input.focus();
                    }
                  }}
                >
                  {t('clear')}
                </button>
              )}
            </div>
            {TokenList2}
          </div>
        ) : null}
        {popup === 3 ? ( // send popup
          <div ref={popupref} className="send-popup-container">
            <div className="send-popup-background">
              <div className={`sendbg ${connected && sendAmountIn > tokenBalances[sendTokenIn] ? 'exceed-balance' : ''}`}>
                <div className="sendbutton1container">
                  <div className="send-Send">{t('send')}</div>
                  <button
                    className="send-button1"
                    onClick={() => {
                      setpopup(10);
                    }}
                  >
                    <img className="send-button1pic" src={tokendict[sendTokenIn].image} />
                    <span>{tokendict[sendTokenIn].ticker || '?'}</span>
                  </button>

                </div>
                <div className="sendinputcontainer">
                  <input
                    inputMode="decimal"
                    className={`send-input ${connected && sendAmountIn > tokenBalances[sendTokenIn] ? 'exceed-balance' : ''}`}
                    onCompositionStart={() => {
                      setIsComposing(true);
                    }}
                    onCompositionEnd={(
                      e: React.CompositionEvent<HTMLInputElement>,
                    ) => {
                      setIsComposing(false);
                      if (/^\$?\d*\.?\d{0,18}$/.test(e.currentTarget.value)) {
                        if (displayMode == 'usd') {
                          if (e.currentTarget.value == '$') {
                            setSendUsdValue('');
                            setSendInputAmount('');
                            setSendAmountIn(BigInt(0));
                            setSendButton(0);
                          } else {
                            setSendUsdValue(`$${e.currentTarget.value.replace(/^\$/, '')}`);
                            const calculatedAmount = calculateTokenAmount(
                              e.currentTarget.value.replace(/^\$/, ''),
                              tradesByMarket[getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc).baseAsset + getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc).quoteAsset],
                              sendTokenIn,
                              getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc),
                            );
                            setSendAmountIn(calculatedAmount);
                            setSendInputAmount(
                              customRound(
                                Number(calculatedAmount) / 10 ** Number(tokendict[sendTokenIn].decimals),
                                3,
                              ).toString()
                            );
                          }
                        } else {
                          const inputValue = BigInt(
                            Math.round((parseFloat(e.currentTarget.value || '0') || 0) * 10 ** Number(tokendict[sendTokenIn].decimals))
                          );
                          setSendAmountIn(inputValue);
                          setSendInputAmount(e.currentTarget.value);
                          setSendUsdValue(
                            `$${calculateUSDValue(
                              inputValue,
                              tradesByMarket[getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc).baseAsset + getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc).quoteAsset],
                              sendTokenIn,
                              getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc),
                            ).toFixed(2)}`
                          );
                        }
                      }
                    }}
                    onChange={(e) => {
                      if (isComposing) {
                        setSendInputAmount(e.target.value);
                        return;
                      }
                      if (/^\$?\d*\.?\d{0,18}$/.test(e.target.value)) {
                        if (displayMode == 'usd') {
                          if (e.target.value == '$') {
                            setSendUsdValue('');
                            setSendInputAmount('');
                            setSendAmountIn(BigInt(0));
                            setSendButton(0);
                          } else {
                            setSendUsdValue(`$${e.target.value.replace(/^\$/, '')}`);
                            const calculatedAmount = calculateTokenAmount(
                              e.target.value.replace(/^\$/, ''),
                              tradesByMarket[getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc).baseAsset + getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc).quoteAsset],
                              sendTokenIn,
                              getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc),
                            );
                            setSendAmountIn(calculatedAmount);
                            setSendInputAmount(
                              customRound(
                                Number(calculatedAmount) / 10 ** Number(tokendict[sendTokenIn].decimals),
                                3,
                              ).toString()
                            );
                          }
                        } else {
                          const inputValue = BigInt(
                            Math.round((parseFloat(e.target.value || '0') || 0) * 10 ** Number(tokendict[sendTokenIn].decimals))
                          );
                          setSendAmountIn(inputValue);
                          setSendInputAmount(e.target.value);
                          setSendUsdValue(
                            `$${calculateUSDValue(
                              inputValue,
                              tradesByMarket[getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc).baseAsset + getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc).quoteAsset],
                              sendTokenIn,
                              getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc),
                            ).toFixed(2)}`
                          );
                        }
                      }
                    }}
                    placeholder={displayMode == 'usd' ? '$0.00' : '0.00'}
                    value={displayMode == 'usd' ? sendUsdValue : sendInputAmount}
                    autoFocus={!(windowWidth <= 1020)}
                  />
                </div>
                <div className="send-balance-wrapper">
                  <div className="send-balance-max-container">
                    <div className="send-balance1">
                      <img src={walleticon} className="send-balance-wallet-icon" />{' '}
                      {formatDisplayValue(tokenBalances[sendTokenIn], Number(tokendict[sendTokenIn].decimals))}
                    </div>
                    <div
                      className="send-max-button"
                      onClick={() => {
                        if (tokenBalances[sendTokenIn] != BigInt(0)) {
                          let amount =
                            sendTokenIn == eth
                              ? tokenBalances[sendTokenIn] - settings.chainConfig[activechain].gasamount > BigInt(0)
                                ? tokenBalances[sendTokenIn] - settings.chainConfig[activechain].gasamount
                                : BigInt(0)
                              : tokenBalances[sendTokenIn];
                          setSendAmountIn(amount);
                          setSendInputAmount(
                            customRound(Number(amount) / 10 ** Number(tokendict[sendTokenIn].decimals), 3).toString()
                          );
                          setSendUsdValue(
                            `$${calculateUSDValue(
                              amount,
                              tradesByMarket[getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc).baseAsset + getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc).quoteAsset],
                              sendTokenIn,
                              getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc),
                            ).toFixed(2)}`
                          );
                        }
                      }}
                    >
                      {t('max')}
                    </div>
                  </div>
                  <div
                    className="send-usd-switch-wrapper"
                    onClick={() => {
                      if (displayMode === 'usd') {
                        setDisplayMode('token');
                        if (parseFloat(sendUsdValue.replace(/^\$|,/g, '')) == 0) {
                          setSendInputAmount('');
                        }
                      } else {
                        setDisplayMode('usd');
                        if (parseFloat(sendInputAmount) == 0) {
                          setSendUsdValue('');
                        }
                      }
                    }}
                  >
                    <div className="send-usd-value">
                      {displayMode === 'usd'
                        ? `${customRound(Number(sendAmountIn) / 10 ** Number(tokendict[sendTokenIn].decimals), 3)} ${tokendict[sendTokenIn].ticker}`
                        : sendAmountIn === BigInt(0)
                          ? '$0.00'
                          : formatUSDDisplay(
                            calculateUSDValue(
                              sendAmountIn,
                              tradesByMarket[getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc).baseAsset + getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc).quoteAsset],
                              sendTokenIn,
                              getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc),
                            )
                          )}
                    </div>
                    <img src={sendSwitch} className="send-arrow" />
                  </div>
                </div>
              </div>
              <div className="swap-container-divider" />
              <div className="sendaddressbg">
                <div className="send-To">{t('to')}</div>
                <div className="send-address-input-container">
                  <input
                    className="send-output"
                    onChange={(e) => {
                      if (e.target.value === '' || /^(0x[0-9a-fA-F]{0,40}|0)$/.test(e.target.value)) {
                        setrecipient(e.target.value);
                      }
                    }}
                    value={recipient}
                    placeholder={t('enterWalletAddress')}
                  />
                  <button
                    className="address-paste-button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (/^(0x[0-9a-fA-F]{40})$/.test(text)) {
                          setrecipient(text);
                        }
                      } catch (err) {
                      }
                    }}
                    title={t('pasteAddress')}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    </svg>
                  </button>
                </div>
              </div>
              <button
                className={`send-swap-button ${isSendingUserOperation ? 'signing' : ''}`}
                onClick={async () => {
                  if (
                    connected &&
                    userchain === activechain
                  ) {
                    try {
                      if (tokenIn == eth) {
                        const hash = await sendeth(
                          sendUserOperationAsync,
                          recipient as `0x${string}`,
                          amountIn,
                        );
                        newTxPopup(
                          (client ? hash.hash : await waitForTransactionReceipt(config, { hash: hash.hash })).transactionHash,
                          'send',
                          eth,
                          '',
                          customRound(
                            Number(amountIn) / 10 ** Number(tokendict[eth].decimals),
                            3,
                          ),
                          0,
                          '',
                          recipient,
                        );
                      } else {
                        const hash = await sendtokens(
                          sendUserOperationAsync,
                          tokenIn as `0x${string}`,
                          recipient as `0x${string}`,
                          amountIn,
                        );
                        newTxPopup(
                          (client ? hash.hash : await waitForTransactionReceipt(config, { hash: hash.hash })).transactionHash,
                          'send',
                          tokenIn,
                          '',
                          customRound(
                            Number(amountIn) /
                            10 ** Number(tokendict[tokenIn].decimals),
                            3,
                          ),
                          0,
                          '',
                          recipient,
                        );
                      }
                      setInputString('');
                      setsendInputString('');
                      setamountIn(BigInt(0));
                      setSliderPercent(0);
                      setSendButton(0);
                      setSendButtonDisabled(true);
                      const slider = document.querySelector('.balance-amount-slider');
                      const popup = document.querySelector(
                        '.slider-percentage-popup',
                      );
                      if (slider && popup) {
                        (popup as HTMLElement).style.left = `${15 / 2}px`;
                      }
                    } catch (error) {
                    } finally {
                      setTimeout(() => refetch(), 500)
                    }
                  } else {
                    !connected
                      ? setpopup(4)
                      : handleSetChain()
                  }
                }}
                disabled={sendButtonDisabled || isSendingUserOperation}
              >
                {isSendingUserOperation ? (
                  <div className="button-content">
                    <div className="loading-spinner" />
                    {t('signTransaction')}
                  </div>
                ) : !connected ? (
                  t('connectWallet')
                ) : sendButton == 0 ? (
                  t('enterAmount')
                ) : sendButton == 1 ? (
                  t('enterWalletAddress')
                ) : sendButton == 2 ? (
                  t('send')
                ) : sendButton == 3 ? (
                  t('insufficient') +
                  (tokendict[tokenIn].ticker || '?') +
                  ' ' +
                  t('bal')
                ) : sendButton == 4 ? (
                  `${t('switchto')} ${t(settings.chainConfig[activechain].name)}`
                ) : (
                  t('connectWallet')
                )}
              </button>
            </div>
          </div>
        ) : null}
        {popup === 4 && !isGeneratingAddressVisible && !isDepositPageVisible ? (
          !connected ? (
            <div ref={popupref} className="connect-wallet-background unconnected">
              <div className="connect-wallet-content-container">
                <AuthCard {...alchemyconfig.ui.auth} />
              </div>
            </div>
          ) : (
            <div ref={popupref} className="connect-wallet-background connected">
              <div className="wallet-header">
                <div className="wallet-info"
                  onMouseEnter={() =>
                    !copyTooltipVisible && setShowHoverTooltip(true)
                  }
                  onMouseLeave={() => setShowHoverTooltip(false)}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(
                      address || '',
                    );
                    setShowHoverTooltip(false);
                    setCopyTooltipVisible(true);
                    setTimeout(() => {
                      setCopyTooltipVisible(false);
                    }, 2000);
                  }}>
                  {connected &&
                    address && (
                      <>
                        <div
                          className="wallet-popup-address-container"
                        >
                          <span
                            className={`wallet-popup-address`}
                          >
                            <img
                              src={walleticon}
                              className="port-popup-wallet-icon"
                            />
                            {`${address.slice(0, 6)}...${address.slice(-4)}`}
                          </span>

                          {copyTooltipVisible && (
                            <div className="wallet-popup-copy-tooltip">
                              {t('copied')}!
                            </div>
                          )}
                          {!copyTooltipVisible && showHoverTooltip && (
                            <div className="wallet-popup-hover-tooltip">
                              {t('clickCopyAddress')}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                </div>
                <button
                  className={`eye-button ${!isBlurred ? '' : 'h'}`}
                  onClick={() => setIsBlurred(!isBlurred)}
                >
                  <div className="eye-icon-container">
                    <svg
                      className="eye-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <div className="eye-slash" />
                  </div>
                </button>
                <button
                  className="popup-disconnect-button"
                  onClick={() => {
                    logout()
                  }}
                >
                  <svg
                    className="disconnect-icon"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>

                <div className="header-actions">
                  <button
                    className="connect-wallet-close-button"
                    onClick={() => {
                      setpopup(0);
                      settokenString('');
                    }}
                  >
                    <img src={closebutton} className="close-button-icon" />
                  </button>
                </div>
              </div>
              {portChartLoading ? (
                <div
                  className="portfolio-popup-graph"
                  style={{ marginTop: 15, marginBottom: 10, height: 195 }}
                >
                  <LoadingOverlay
                    isVisible={true}
                    bgcolor={'#00000000'}
                    height={40}
                  />
                </div>
              ) : (
                <>
                  <div className="total-account-summary-value">
                    <div
                      className={`total-value ${isBlurred ? 'blurred' : ''}`}
                    >
                      ${formatCommas(totalAccountValue.toFixed(2))}
                    </div>
                    <div
                      className={`percentage-change ${isBlurred ? 'blurred' : ''} ${percentage >= 0 ? 'positive' : 'negative'}`}
                    >
                      {percentage >= 0 ? '+' : ''}
                      {percentage.toFixed(2)}%
                    </div>
                  </div>
                  <div className="portfolio-popup-graph">
                    <PortfolioPopupGraph
                      address={address ?? ''}
                      onPercentageChange={setPercentage}
                      colorValue={portfolioColorValue}
                      setColorValue={setPortfolioColorValue}
                      isPopup={true}
                      chartData={totalAccountValue ? [
                        ...chartData.slice(0, -1),
                        {
                          ...chartData[chartData.length - 1],
                          value: totalAccountValue,
                        },
                      ] : chartData}
                      portChartLoading={portChartLoading}
                      chartDays={chartDays}
                      setChartDays={setChartDays}
                    />
                  </div>
                </>
              )}
              <div className="graph-assets-divider" />
              <div className="portfolio-content-popup">
                <PortfolioContent
                  trades={tradesByMarket}
                  tokenList={Object.values(tokendict)}
                  setTokenIn={setTokenIn}
                  setTokenOut={setTokenOut}
                  setSendTokenIn={setSendTokenIn}
                  setpopup={setpopup}
                  sortConfig={{ column: 'name', direction: 'asc' }}
                  tokenBalances={tokenBalances}
                />
              </div>
            </div>
          )
        ) : null}
        {popup === 5 ? ( // settings
          <div
            className={`layout-settings-background ${simpleView ? 'simple' : ''}`}
            ref={popupref}
          >
            <div className="layout-settings-header">
              <button
                className="layout-settings-close-button"
                onClick={() => setpopup(0)}
              >
                <img src={closebutton} className="close-button-icon" />
              </button>

              <div className="layout-settings-title">{t('settings')}</div>
            </div>
            <div className="layout-settings-content">
              {!simpleView && (
                <div className="layout-options">
                  <div>
                    <div className="layout-section-title">
                      {t('tradePanelPosition')}
                    </div>
                    <div className="layout-section">
                      <button
                        className={`layout-option ${layoutSettings === 'alternative' ? 'active' : ''}`}
                        onClick={() => {
                          setLayoutSettings('alternative');
                          localStorage.setItem('crystal_layout', 'alternative');
                        }}
                      >
                        <div className="layout-preview-container">
                          <div className="preview-trade"></div>
                          <div className="layout-preview-wrapper">
                            <div className="layout-preview alternative-layout">
                              <div className="preview-chart"></div>
                              <div className="preview-orderbook"></div>
                            </div>
                            <div className="layout-preview-bottom">
                              <div className="preview-ordercenter"></div>
                            </div>
                          </div>
                        </div>
                        <div className="layout-label">
                          <span className="layout-name">
                            {t('left')} {t('panel')}
                          </span>
                        </div>
                      </button>

                      <button
                        className={`layout-option ${layoutSettings === 'default' ? 'active' : ''}`}
                        onClick={() => {
                          setLayoutSettings('default');
                          localStorage.setItem('crystal_layout', 'default');
                        }}
                      >
                        <div className="layout-preview-container">
                          <div className="layout-preview-wrapper">
                            <div className="layout-preview alternative-layout">
                              <div className="preview-chart" />
                              <div className="preview-orderbook" />
                            </div>
                            <div className="layout-preview-bottom">
                              <div className="preview-ordercenter" />
                            </div>
                          </div>
                          <div className="preview-trade" />
                        </div>

                        <div className="layout-label">
                          <span className="layout-name">
                            {t('right')} {t('panel')}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="layout-section-title">
                      {t('orderbookPosition')}
                    </div>
                    <div className="layout-section">
                      <button
                        className={`layout-option ${orderbookPosition === 'left' ? 'active' : ''}`}
                        onClick={() => {
                          setOrderbookPosition('left');
                          localStorage.setItem('crystal_orderbook', 'left');
                        }}
                      >
                        <div className="ob-layout-preview-container">
                          <div className="ob-layout-preview alternative-layout">
                            <div className="ob-preview-orderbook">
                              <div className="ob-preview-sell"></div>
                              <div className="ob-preview-buy"></div>
                            </div>
                            <div className="ob-preview-chart"></div>
                          </div>
                        </div>
                        <div className="layout-label">
                          <span className="layout-name">
                            {t('left')} {t('side')}
                          </span>
                        </div>
                      </button>

                      <button
                        className={`layout-option ${orderbookPosition === 'right' ? 'active' : ''}`}
                        onClick={() => {
                          setOrderbookPosition('right');
                          localStorage.setItem('crystal_orderbook', 'right');
                        }}
                      >
                        <div className="ob-layout-preview-container">
                          <div className="ob-layout-preview alternative-layout">
                            <div className="ob-preview-chart"></div>

                            <div className="ob-preview-orderbook">
                              <div className="ob-preview-sell"></div>
                              <div className="ob-preview-buy"></div>
                            </div>
                          </div>
                        </div>
                        <div className="layout-label">
                          <span className="layout-name">
                            {t('right')} {t('side')}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="layout-language-row">
                <span className="layout-language-label">{t('language')}</span>
                <div className="language-selector-app-container">
                  <LanguageSelector
                    languages={languageOptions}
                    isLanguageDropdownOpen={isLanguageDropdownOpen}
                    setIsLanguageDropdownOpen={setIsLanguageDropdownOpen}
                  />
                </div>
              </div>

              {!simpleView && (
                <>
                  <div className="orderbook-toggle-row">
                    <span className="orderbook-toggle-label">
                      {t('showOB')}
                    </span>
                    <ToggleSwitch
                      checked={isOrderbookVisible}
                      onChange={() => {
                        setIsOrderbookVisible(!isOrderbookVisible);
                        localStorage.setItem(
                          'crystal_orderbook_visible',
                          JSON.stringify(!isOrderbookVisible),
                        );
                      }}
                    />
                  </div>

                  <div className="ordercenter-toggle-row">
                    <span className="ordercenter-toggle-label">
                      {t('showOC')}
                    </span>
                    <ToggleSwitch
                      checked={isOrderCenterVisible}
                      onChange={() => {
                        setIsOrderCenterVisible(!isOrderCenterVisible);
                        localStorage.setItem(
                          'crystal_ordercenter_visible',
                          JSON.stringify(!isOrderCenterVisible),
                        );
                      }}
                    />
                  </div>
                  <div className="audio-toggle-row">
                    <span className="audio-toggle-label">{t('audioNotifications')}</span>
                    <ToggleSwitch
                      checked={isAudioEnabled}
                      onChange={() => {
                        setIsAudioEnabled(!isAudioEnabled);
                        localStorage.setItem('crystal_audio_notifications', JSON.stringify(!isAudioEnabled));
                      }}
                    />
                  </div>

                  <button
                    className="revert-settings-button"
                    onClick={() => {
                      setLanguage('EN');
                      localStorage.setItem('crystal_language', 'EN');

                      setLayoutSettings('default');
                      localStorage.setItem('crystal_layout', 'default');

                      setOrderbookPosition('right');
                      localStorage.setItem('crystal_orderbook', 'right');

                      setSimpleView(false);
                      localStorage.setItem('crystal_simple_view', 'false');

                      setIsOrderbookVisible(true);
                      localStorage.setItem('crystal_orderbook_visible', 'true');

                      setIsOrderCenterVisible(true);
                      localStorage.setItem(
                        'crystal_ordercenter_visible',
                        'true',
                      );

                      setOrderbookWidth(300);
                      localStorage.setItem('orderbookWidth', '300');

                      setAddLiquidityOnly(false);
                      localStorage.setItem(
                        'crystal_add_liquidity_only',
                        'false',
                      );

                      setorderType(1);
                      localStorage.setItem('crystal_order_type', '1');

                      setSlippageString('1');
                      setSlippage(BigInt(9900));
                      localStorage.setItem('crystal_slippage_string', '1');
                      localStorage.setItem('crystal_slippage', '9900');

                      setActiveSection('orders');
                      localStorage.setItem('crystal_oc_tab', 'orders');

                      setFilter('all');
                      localStorage.setItem('crystal_oc_filter', 'all');

                      setOnlyThisMarket(false);
                      localStorage.setItem('crystal_only_this_market', 'false');

                      setOBInterval(baseInterval);
                      localStorage.setItem(
                        `${activeMarket.baseAsset}_ob_interval`,
                        JSON.stringify(baseInterval),
                      );

                      const currentKey = `${activeMarket.baseAsset}_ob_interval`;
                      for (let i = localStorage.length - 1; i >= 0; i--) {
                        const key = localStorage.key(i);
                        if (
                          key &&
                          key.endsWith('_ob_interval') &&
                          key !== currentKey
                        ) {
                          localStorage.removeItem(key);
                        }
                      }

                      setViewMode('both');
                      localStorage.setItem('ob_viewmode', 'both');

                      setOBTab('orderbook');
                      localStorage.setItem('ob_active_tab', 'orderbook');

                      setMobileView('chart');

                      setAmountsQuote('Quote');
                      localStorage.setItem('ob_amounts_quote', 'Quote');

                      let defaultHeight: number;

                      if (window.innerHeight > 1080) defaultHeight = 363.58;
                      else if (window.innerHeight > 960) defaultHeight = 322.38;
                      else if (window.innerHeight > 840) defaultHeight = 281.18;
                      else if (window.innerHeight > 720) defaultHeight = 239.98;
                      else defaultHeight = 198.78;

                      setOrderCenterHeight(defaultHeight);
                      localStorage.setItem(
                        'orderCenterHeight',
                        defaultHeight.toString(),
                      );
                    }}
                  >
                    {t('revertToDefault')}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}
        {popup === 6 && selectedConnector ? (
          <div ref={popupref} className="connecting-popup">
            <div className="connecting-content">
              <div className="connecting-header">
                <button
                  className="connecting-back-button"
                  onClick={() => {
                    setpopup(4);
                    setSelectedConnector(null);
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  className="disconnected-wallet-close-button"
                  onClick={() => {
                    setpopup(0);
                    setSelectedConnector(null);
                  }}
                >
                  <img src={closebutton} className="close-button-icon" />
                </button>
              </div>

              <div className="logo-container">
                <div className="logo-spinner" />
                <img
                  src={
                    selectedConnector.name === 'MetaMask'
                      ? walletmetamask
                      : selectedConnector.name === 'Coinbase Wallet'
                        ? walletcoinbase
                        : selectedConnector.name === 'WalletConnect'
                          ? walletconnect
                          : selectedConnector.name === 'Safe'
                            ? walletsafe
                            : selectedConnector.name === 'Rabby Wallet'
                              ? walletrabby
                              : selectedConnector.name === 'Backpack'
                                ? walletbackpack
                                : selectedConnector.name === 'Phantom'
                                  ? walletphantom
                                  : selectedConnector.name === 'Tomo' ? wallettomo : selectedConnector.name === 'HaHa Wallet' ? wallethaha : walletinjected
                  }
                  className="wallet-logo"
                />
              </div>

              <h2 className="connecting-title">{selectedConnector.name}</h2>
              <p className="connecting-text">{t('requestingConnection')}</p>
              <p className="connecting-subtext">
                {t('confirmConnection1')} {selectedConnector.name}{' '}
                {t('confirmConnection2')}.
              </p>
            </div>
          </div>
        ) : null}
        {popup === 7 ? (
          <TokenInfoPopupContent
            symbol={activeMarket.baseAsset}
            setpopup={setpopup}
            ref={popupref}
          />
        ) : null}
        {popup === 8 ? (
          <div className="search-markets-dropdown-popup" ref={popupref}>
            <div className="search-markets-dropdown-header">
              <div className="search-container">
                <div className="search-wrapper">
                  <SearchIcon className="search-icon" size={12} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t('searchMarkets')}
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    autoFocus={!(windowWidth <= 1020)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="cancel-search"
                      onClick={() => setSearchQuery('')}
                      title="Clear search"
                    >
                      {t('clear')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="search-markets-list-header">
              <div className="favorites-header">
                <button
                  onClick={() => handleSort('favorites')}
                  className="favorite-sort-button"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="favorites-sort-icon"
                  >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </button>
              </div>
              <div
                className="search-header-item"
                onClick={() => handleSort('volume')}
              >
                {t('market')} / {t('volume')}
                <SortArrow
                  sortDirection={
                    sortField === 'volume' ? sortDirection : undefined
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSort('volume');
                  }}
                />
              </div>
              <div
                className="search-header-item"
                onClick={() => handleSort('change')}
              >
                {t('last') + ' ' + t('day')}
                <SortArrow
                  sortDirection={
                    sortField === 'change' ? sortDirection : undefined
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSort('change');
                  }}
                />
              </div>
              <div
                className="search-header-item"
                onClick={() => handleSort('price')}
              >
                {t('price')}
                <SortArrow
                  sortDirection={
                    sortField === 'price' ? sortDirection : undefined
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSort('price');
                  }}
                />
              </div>
            </div>
            <div className="search-markets-list">
              {sortedMarkets.length > 0 ? (
                sortedMarkets.map((market, index) => (
                  <div
                    key={market.pair}
                    className={`search-market-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() =>
                      handleMarketSelect(
                        market.baseAddress,
                        market.quoteAddress,
                      )
                    }
                    onMouseEnter={() => setSelectedIndex(index)}
                    role="button"
                    tabIndex={-1}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        toggleFavorite(market.baseAddress?.toLowerCase() ?? '');
                        refocusSearchInput();
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      tabIndex={-1}
                      className={`dropdown-market-favorite-button 
                            ${favorites.includes(market.baseAddress?.toLowerCase() ?? '') ? 'active' : ''}`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={
                          favorites.includes(
                            market.baseAddress?.toLowerCase() ?? '',
                          )
                            ? 'currentColor'
                            : 'none'
                        }
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </button>

                    <div className="search-market-pair-section">
                      <img src={market.image} className="market-icon" />
                      <div className="market-info">
                        <span className="market-pair">{market.pair}</span>
                        <span className="market-volume">
                          ${formatCommas(market.volume)}
                        </span>
                      </div>
                    </div>
                    <div className="search-market-chart-section">
                      <MiniChart
                        market={market}
                        series={market.series}
                        priceChange={market.priceChange}
                        isVisible={true}
                      />
                    </div>
                    <div className="search-market-price-section">
                      <div className="search-market-price">
                        {formatSubscript(market.currentPrice)}
                      </div>
                      <div
                        className={`search-market-change ${market.priceChange.startsWith('-') ? 'negative' : 'positive'}`}
                      >
                        {market.priceChange}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-markets-message">{t('noMarkets')}</div>
              )}
            </div>

            <div className="keyboard-shortcuts-container">
              <div className="keyboard-shortcut">
                <span className="arrow-key">↑</span>
                <span className="arrow-key">↓</span>
                <span>{t('toNavigate')}</span>
              </div>
              <div className="keyboard-shortcut">
                <span className="key">Enter</span>
                <span>{t('toSelect')}</span>
              </div>
              <div className="keyboard-shortcut">
                <span className="key">Esc</span>
                <span>{t('toClose')}</span>
              </div>
            </div>
          </div>
        ) : null}
        {popup === 9 ? (
          <div ref={popupref} className="connect-wallet-background unconnected">
            <div className="social-content-container">
              <div className="social-content">
                <div className="social-banner-wrapper">
                  <img
                    src={SocialBanner}
                    className="social-banner-image"
                  />
                </div>

                <h1 className="social-heading">Join our growing community!</h1>
                <p className="social-description">
                  Crystal Exchange is being released in phases. Stay updated with
                  the latest news and features.
                </p>

                <div className="social-buttons">
                  <button
                    className="wallet-option"
                    onClick={() =>
                      window.open('https://discord.gg/CrystalExch', '_blank')
                    }
                  >
                    <img
                      className="connect-wallet-icon"
                      src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.svg"
                      alt="Discord"
                    />
                    <span className="wallet-name">Join Crystal's Discord</span>
                  </button>

                  <button
                    className="wallet-option"
                    onClick={() =>
                      window.open('https://x.com/CrystalExch', '_blank')
                    }
                  >
                    <img
                      className="connect-wallet-icon"
                      src={Xicon}
                      alt="Twitter"
                    />
                    <span className="wallet-name">Follow us on X (Twitter)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {popup === 10 ? ( //send search 
          <div ref={popupref} className="sendselectbg">
            <div className="tokenlistbg"></div>
            <div className="send-top-row">
              <input
                className="sendselect"
                onChange={(e) => {
                  debouncedSetTokenString(e.target.value);
                }}
                placeholder={t('searchToken')}
                autoFocus={!(windowWidth <= 1020)}
              />
              {tokenString && (
                <button
                  className="sendselect-clear visible"
                  onClick={() => {
                    settokenString('');
                    const input = document.querySelector('.tokenselect') as HTMLInputElement;
                    if (input) {
                      input.value = '';
                      input.focus();
                    }
                  }}
                >
                  {t('clear')}
                </button>
              )}
              <button
                className="sendselect-back"
                onClick={() => {
                  setpopup(3);
                }}
              >
                <img src={closebutton} className="send-close-button-icon" />
              </button>
            </div>

            <ul className="sendtokenlist">
              {Object.values(tokendict)
                .filter(
                  (token) =>
                    token.ticker.toLowerCase().includes(tokenString.trim().toLowerCase()) ||
                    token.name.toLowerCase().includes(tokenString.trim().toLowerCase()) ||
                    token.address.toLowerCase().includes(tokenString.trim().toLowerCase())
                )
                .map((token) => (
                  <button
                    className="sendtokenbutton"
                    key={token.address}
                    onClick={() => {
                      setSendTokenIn(token.address);
                      setSendUsdValue('');
                      setSendInputAmount('');
                      setSendAmountIn(BigInt(0));
                      setSendButton(0);
                      settokenString('');
                      setpopup(3);
                    }}
                  >
                    <img className="tokenlistimage" src={token.image} />
                    <div className="tokenlisttext">
                      <div className="tokenlistname">{token.ticker}</div>
                      <div className="tokenlistticker">{token.name}</div>
                    </div>
                    <div className="token-right-content">
                      <div className="tokenlistbalance">
                        {formatDisplayValue(tokenBalances[token.address], Number(token.decimals))}
                      </div>
                      <div className="token-address-container">
                        <span className="token-address">
                          {`${token.address.slice(0, 6)}...${token.address.slice(-4)}`}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
            </ul>
          </div>
        ) : null}
      </div>
    </>
  );

  // trade ui component
  const swap = (
    <div className="rectangle">
      <div className="navlinkwrapper" data-active={activeTab}>


        <div className="innernavlinkwrapper">
          <Link
            to="/swap"
            className={`navlink ${activeTab === 'swap' ? 'active' : ''}`}
            onClick={(e) => {
              if (location.pathname === '/swap') {
                e.preventDefault();
              }
            }}
          >
            {t('swap')}
          </Link>
          <Link
            to="/limit"
            className={`navlink ${activeTab === 'limit' ? 'active' : ''}`}

          >
            {t('limit')}
          </Link>
          <span
            ref={(el: HTMLSpanElement | null) => {
              sendButtonRef.current = el;
            }}
            className={`navlink ${activeTab != 'swap' && activeTab != 'limit' ? 'active' : ''}`}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              setShowSendDropdown(!showSendDropdown);
            }}
          >
            {t(currentProText)}
            <svg
              className={`dropdown-arrow ${showSendDropdown ? 'open' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>

          {showSendDropdown && (
            <div className="navlink-dropdown" ref={sendDropdownRef}>
              <Link
                to="/send"
                className="dropdown-item"
                onClick={() => {
                  setShowSendDropdown(false);
                  setCurrentProText(t('send'));
                }}
              >
                {t('send')}
              </Link>
              <Link
                to="/scale"
                className="dropdown-item"
                onClick={() => {
                  setShowSendDropdown(false);
                  setCurrentProText(t('scale'));
                }}
              >
                {t('scale')}
              </Link>
            </div>
          )}
        </div>

        <div className="sliding-tab-indicator" />
      </div>
      <div className="swapmodal">
        <div
          className={`inputbg ${connected && amountIn > tokenBalances[tokenIn]
            ? 'exceed-balance'
            : ''
            }`}
        >
          <div className="Pay">{t('pay')}</div>
          <div className="inputbutton1container">
            {displayValuesLoading &&
              switched == true &&
              !(inputString == '' && outputString == '') ? (
              <div className="output-skeleton" />
            ) : (
              <input
                inputMode="decimal"
                className={`input ${connected &&
                    amountIn > tokenBalances[tokenIn]
                    ? 'exceed-balance'
                    : ''
                  }`}
                onCompositionStart={() => {
                  setIsComposing(true);
                }}
                onCompositionEnd={(
                  e: React.CompositionEvent<HTMLInputElement>,
                ) => {
                  setIsComposing(false);
                  if (/^\d*\.?\d{0,18}$/.test(e.currentTarget.value)) {
                    const inputValue = BigInt(
                      Math.round(
                        (parseFloat(e.currentTarget.value || '0') || 0) *
                        10 ** Number(tokendict[tokenIn].decimals),
                      ),
                    );
                    setswitched(false);
                    setInputString(e.currentTarget.value);
                    debouncedSetAmount(inputValue);
                    if (isWrap) {
                      setamountOutSwap(inputValue);
                      setoutputString(e.currentTarget.value);
                    }
                    const percentage = !tokenBalances[tokenIn]
                      ? 0
                      : Math.min(
                        100,
                        Math.floor(
                          Number(
                            (inputValue * BigInt(100)) /
                            tokenBalances[tokenIn],
                          ),
                        ),
                      );
                    setSliderPercent(percentage);
                    const slider = document.querySelector(
                      '.balance-amount-slider',
                    );
                    const popup = document.querySelector(
                      '.slider-percentage-popup',
                    );
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      (popup as HTMLElement).style.left = `${(rect.width - 15) * (percentage / 100) + 15 / 2
                        }px`;
                    }
                  }
                }}
                onChange={(e) => {
                  if (isComposing) {
                    setInputString(e.target.value);
                    return;
                  }
                  if (/^\d*\.?\d{0,18}$/.test(e.target.value)) {
                    const inputValue = BigInt(
                      Math.round(
                        (parseFloat(e.target.value || '0') || 0) *
                        10 ** Number(tokendict[tokenIn].decimals),
                      ),
                    );
                    setswitched(false);
                    setInputString(e.target.value);
                    debouncedSetAmount(inputValue);
                    if (isWrap) {
                      setamountOutSwap(inputValue);
                      setoutputString(e.target.value);
                    }
                    const percentage = !tokenBalances[tokenIn]
                      ? 0
                      : Math.min(
                        100,
                        Math.floor(
                          Number(
                            (inputValue * BigInt(100)) /
                            tokenBalances[tokenIn],
                          ),
                        ),
                      );
                    setSliderPercent(percentage);
                    const slider = document.querySelector(
                      '.balance-amount-slider',
                    );
                    const popup = document.querySelector(
                      '.slider-percentage-popup',
                    );
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      (popup as HTMLElement).style.left = `${(rect.width - 15) * (percentage / 100) + 15 / 2
                        }px`;
                    }
                  }
                }}
                placeholder="0.00"
                value={inputString}
                autoFocus={
                  outputString === '' &&
                  switched === false &&
                  !(windowWidth <= 1020)
                }
              />
            )}
            <button
              className={`button1 ${connected &&
                amountIn > tokenBalances[tokenIn]
                ? 'exceed-balance'
                : ''
                }`}
              onClick={() => {
                setpopup(1);
              }}
            >
              <img className="button1pic" src={tokendict[tokenIn].image} />
              <span>{tokendict[tokenIn].ticker || '?'}</span>
              <svg
                className="button-arrow"
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
          </div>
          <div className="balance1maxcontainer">
            {displayValuesLoading &&
              switched == true &&
              !(inputString == '' && outputString == '') ? (
              <div className="output-usd-skeleton" />
            ) : (
              <span className="usd-value">
                {Math.round(
                  (parseFloat(inputString || '0') || 0) *
                  10 ** Number(tokendict[tokenIn].decimals),
                ) == 0
                  ? '$0.00'
                  : formatUSDDisplay(
                    calculateUSDValue(
                      BigInt(
                        Math.round(
                          (parseFloat(inputString || '0') || 0) *
                          10 ** Number(tokendict[tokenIn].decimals),
                        ),
                      ),
                      tradesByMarket[
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ).baseAsset +
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ).quoteAsset
                      ],
                      tokenIn,
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ),
                    ),
                  )}
              </span>
            )}
            <div className="balance1">
              <img src={walleticon} className="balance-wallet-icon" />{' '}
              {formatDisplayValue(
                tokenBalances[tokenIn],
                Number(tokendict[tokenIn].decimals),
              )}
            </div>
            <div
              className="max-button"
              onClick={() => {
                if (tokenBalances[tokenIn] != BigInt(0)) {
                  setswitched(false);
                  let amount =
                    tokenIn == eth
                      ? tokenBalances[tokenIn] -
                        settings.chainConfig[activechain].gasamount >
                        BigInt(0)
                        ? tokenBalances[tokenIn] -
                        settings.chainConfig[activechain].gasamount
                        : BigInt(0)
                      : tokenBalances[tokenIn];
                  debouncedSetAmount(BigInt(amount));
                  setInputString(
                    customRound(
                      Number(amount) /
                      10 ** Number(tokendict[tokenIn].decimals),
                      3,
                    ).toString(),
                  );
                  if (isWrap) {
                    setamountOutSwap(BigInt(amount));
                    setoutputString(
                      customRound(
                        Number(amount) /
                        10 ** Number(tokendict[tokenIn].decimals),
                        3,
                      ).toString(),
                    );
                  }
                  setSliderPercent(100);
                  const slider = document.querySelector(
                    '.balance-amount-slider',
                  );
                  const popup = document.querySelector(
                    '.slider-percentage-popup',
                  );
                  if (slider && popup) {
                    const rect = slider.getBoundingClientRect();
                    const trackWidth = rect.width - 15;
                    const thumbPosition = trackWidth + 15 / 2;
                    (popup as HTMLElement).style.left = `${thumbPosition}px`;
                  }
                }
              }}
            >
              {t('max')}{' '}
            </div>
          </div>
        </div>
        <div
          className="switch-button"
          onClick={() => {
            setTokenIn(tokenOut);
            setTokenOut(tokenIn);
            if (amountIn != BigInt(0) || amountOutSwap != BigInt(0)) {
              if (!isWrap) {
                if (switched == false) {
                  setswitched(true);
                  setStateIsLoading(true);
                  setInputString('');
                  setamountIn(BigInt(0));
                  setamountOutSwap(amountIn);
                  setoutputString(
                    amountIn == BigInt(0)
                      ? ''
                      : String(
                        customRound(
                          Number(amountIn) /
                          10 ** Number(tokendict[tokenIn].decimals),
                          3,
                        ),
                      ),
                  );
                } else {
                  setswitched(false);
                  setStateIsLoading(true);
                  setoutputString('');
                  setamountOutSwap(BigInt(0));
                  setamountIn(amountOutSwap);
                  setInputString(
                    amountOutSwap == BigInt(0)
                      ? ''
                      : String(
                        customRound(
                          Number(amountOutSwap) /
                          10 ** Number(tokendict[tokenOut].decimals),
                          3,
                        ),
                      ),
                  );
                  const percentage = !tokenBalances[tokenOut]
                    ? 0
                    : Math.min(
                      100,
                      Math.floor(
                        Number(
                          (amountOutSwap * BigInt(100)) /
                          tokenBalances[tokenOut],
                        ),
                      ),
                    );
                  setSliderPercent(percentage);
                  const slider = document.querySelector(
                    '.balance-amount-slider',
                  );
                  const popup = document.querySelector(
                    '.slider-percentage-popup',
                  );
                  if (slider && popup) {
                    const rect = slider.getBoundingClientRect();
                    (popup as HTMLElement).style.left =
                      `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                  }
                }
              }
            }
          }}
        >
          <img src={tradearrow} className="switch-arrow" />
        </div>
        <div className="swap-container-divider" />
        <div className="outputbg">
          <div className="Recieve">{t('receive')}</div>
          <div className="outputbutton2container">
            {displayValuesLoading &&
              switched == false &&
              !(inputString == '' && outputString == '') ? (
              <div className="output-skeleton" />
            ) : (
              <input
                inputMode="decimal"
                className="output"
                onCompositionStart={() => {
                  setIsComposing(true);
                }}
                onCompositionEnd={(
                  e: React.CompositionEvent<HTMLInputElement>,
                ) => {
                  setIsComposing(false);
                  if (/^\d*\.?\d{0,18}$/.test(e.currentTarget.value)) {
                    const outputValue = BigInt(
                      Math.round(
                        (parseFloat(e.currentTarget.value || '0') || 0) *
                        10 ** Number(tokendict[tokenOut].decimals),
                      ),
                    );
                    setswitched(true);
                    setoutputString(e.currentTarget.value);
                    if (isWrap) {
                      setamountIn(outputValue);
                      setInputString(e.currentTarget.value);
                    }
                    debouncedSetAmountOut(outputValue);
                  }
                }}
                onChange={(e) => {
                  if (isComposing) {
                    setoutputString(e.target.value);
                    return;
                  }
                  if (/^\d*\.?\d{0,18}$/.test(e.target.value)) {
                    const outputValue = BigInt(
                      Math.round(
                        (parseFloat(e.target.value || '0') || 0) *
                        10 ** Number(tokendict[tokenOut].decimals),
                      ),
                    );
                    setswitched(true);
                    setoutputString(e.target.value);
                    if (isWrap) {
                      setamountIn(outputValue);
                      setInputString(e.target.value);
                    }
                    debouncedSetAmountOut(outputValue);
                  }
                }}
                value={outputString}
                placeholder="0.00"
              />
            )}
            <button
              className="button2"
              onClick={() => {
                setpopup(2);
              }}
            >
              <img className="button2pic" src={tokendict[tokenOut].image} />
              <span>{tokendict[tokenOut].ticker || '?'}</span>
              <svg
                className="button-arrow"
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
          </div>
          <div className="balance1maxcontainer">
            {displayValuesLoading &&
              switched == false &&
              !(inputString == '' && outputString == '') ? (
              <div className="output-usd-skeleton" />
            ) : (
              <div className="output-usd-value">
                {amountOutSwap === BigInt(0)
                  ? '$0.00'
                  : (() => {
                    const outputUSD = calculateUSDValue(
                      amountOutSwap,
                      tradesByMarket[
                      getMarket(
                        activeMarket.path.at(-2),
                        activeMarket.path.at(-1),
                      ).baseAsset +
                      getMarket(
                        activeMarket.path.at(-2),
                        activeMarket.path.at(-1),
                      ).quoteAsset
                      ],
                      tokenOut,
                      getMarket(
                        activeMarket.path.at(-2),
                        activeMarket.path.at(-1),
                      ),
                    );

                    const inputUSD = calculateUSDValue(
                      amountIn,
                      tradesByMarket[
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ).baseAsset +
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ).quoteAsset
                      ],
                      tokenIn,
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ),
                    );

                    const percentageDiff =
                      inputUSD > 0
                        ? ((outputUSD - inputUSD) / inputUSD) * 100
                        : 0;

                    return (
                      <div className="output-usd-container">
                        <span>{formatUSDDisplay(outputUSD)}</span>
                        {inputUSD > 0 && (
                          <span
                            className={`output-percentage ${percentageDiff >= 0 ? 'positive' : 'negative'}`}
                          >
                            ({percentageDiff >= 0 ? '+' : ''}
                            {percentageDiff.toFixed(2)}%)
                          </span>
                        )}
                      </div>
                    );
                  })()}
              </div>
            )}
            <div className="balance2">
              <img src={walleticon} className="balance-wallet-icon" />{' '}
              {formatDisplayValue(
                tokenBalances[tokenOut],
                Number(tokendict[tokenOut].decimals),
              )}
            </div>
          </div>
        </div>
        <div className="balance-slider-wrapper">
          <div className="slider-container">
            <input
              type="range"
              className={`balance-amount-slider ${isDragging ? 'dragging' : ''}`}
              min="0"
              max="100"
              step="1"
              value={sliderPercent}
              onChange={(e) => {
                const percent = parseInt(e.target.value);
                const newAmount =
                  ((tokenIn == eth
                    ? tokenBalances[tokenIn] -
                      settings.chainConfig[activechain].gasamount >
                      BigInt(0)
                      ? tokenBalances[tokenIn] -
                      settings.chainConfig[activechain].gasamount
                      : BigInt(0)
                    : tokenBalances[tokenIn]) *
                    BigInt(percent)) /
                  100n;
                setSliderPercent(percent);
                setswitched(false);
                setInputString(
                  newAmount == BigInt(0)
                    ? ''
                    : customRound(
                      Number(newAmount) /
                      10 ** Number(tokendict[tokenIn].decimals),
                      3,
                    ).toString(),
                );
                debouncedSetAmount(newAmount);
                if (isWrap) {
                  setoutputString(
                    newAmount == BigInt(0)
                      ? ''
                      : customRound(
                        Number(newAmount) /
                        10 ** Number(tokendict[tokenIn].decimals),
                        3,
                      ).toString(),
                  );
                  setamountOutSwap(newAmount);
                }
                const slider = e.target;
                const rect = slider.getBoundingClientRect();
                const trackWidth = rect.width - 15;
                const thumbPosition = (percent / 100) * trackWidth + 15 / 2;
                const popup: HTMLElement | null = document.querySelector(
                  '.slider-percentage-popup',
                );
                if (popup) {
                  popup.style.left = `${thumbPosition}px`;
                }
              }}
              onMouseDown={() => {
                setIsDragging(true);
                const popup: HTMLElement | null = document.querySelector(
                  '.slider-percentage-popup',
                );
                if (popup) popup.classList.add('visible');
              }}
              onMouseUp={() => {
                setIsDragging(false);
                const popup: HTMLElement | null = document.querySelector(
                  '.slider-percentage-popup',
                );
                if (popup) popup.classList.remove('visible');
              }}
              style={{
                background: `linear-gradient(to right,rgb(171, 176, 224) ${sliderPercent}%,rgb(21, 21, 25) ${sliderPercent}%)`,
              }}
            />
            <div className="slider-percentage-popup">{sliderPercent}%</div>
            <div className="balance-slider-marks">
              {[0, 25, 50, 75, 100].map((markPercent) => (
                <span
                  key={markPercent}
                  className="balance-slider-mark"
                  data-active={sliderPercent >= markPercent}
                  data-percentage={markPercent}
                  onClick={() => {
                    const newAmount =
                      ((tokenIn == eth
                        ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount >
                          BigInt(0)
                          ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount
                          : BigInt(0)
                        : tokenBalances[tokenIn]) *
                        BigInt(markPercent)) /
                      100n;
                    setSliderPercent(markPercent);
                    setswitched(false);
                    setInputString(
                      newAmount == BigInt(0)
                        ? ''
                        : customRound(
                          Number(newAmount) /
                          10 ** Number(tokendict[tokenIn].decimals),
                          3,
                        ).toString(),
                    );
                    debouncedSetAmount(newAmount);
                    if (isWrap) {
                      setoutputString(
                        newAmount == BigInt(0)
                          ? ''
                          : customRound(
                            Number(newAmount) /
                            10 ** Number(tokendict[tokenIn].decimals),
                            3,
                          ).toString(),
                      );
                      setamountOutSwap(newAmount);
                    }
                    const slider = document.querySelector(
                      '.balance-amount-slider',
                    );
                    const popup: HTMLElement | null = document.querySelector(
                      '.slider-percentage-popup',
                    );
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      popup.style.left = `${(rect.width - 15) * (markPercent / 100) + 15 / 2
                        }px`;
                    }
                  }}
                >
                  {markPercent}%
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          className={`swap-button ${isSendingUserOperation ? 'signing' : ''}`}
          onClick={async () => {
            if (
              connected &&
              userchain === activechain
            ) {
              try {
                if (tokenIn == eth && tokenOut == weth) {
                  const hash = await wrapeth(sendUserOperationAsync, amountIn, weth);
                  newTxPopup(
                    (client ? hash.hash : await waitForTransactionReceipt(config, { hash: hash.hash })).transactionHash,
                    'wrap',
                    eth,
                    weth,
                    customRound(
                      Number(amountIn) / 10 ** Number(tokendict[eth].decimals),
                      3,
                    ),
                    customRound(
                      Number(amountIn) / 10 ** Number(tokendict[eth].decimals),
                      3,
                    ),
                    '',
                    '',
                  );
                } else if (tokenIn == weth && tokenOut == eth) {
                  const hash = await unwrapeth(sendUserOperationAsync, amountIn, weth);
                  newTxPopup(
                    (client ? hash.hash : await waitForTransactionReceipt(config, { hash: hash.hash })).transactionHash,
                    'unwrap',
                    weth,
                    eth,
                    customRound(
                      Number(amountIn) / 10 ** Number(tokendict[eth].decimals),
                      3,
                    ),
                    customRound(
                      Number(amountIn) / 10 ** Number(tokendict[eth].decimals),
                      3,
                    ),
                    '',
                    '',
                  );
                } else {
                  if (switched == false) {
                    if (tokenIn == eth) {
                      if (orderType == 1 || multihop) {
                        await swapExactETHForTokens(
                          sendUserOperationAsync,
                          router,
                          amountIn,
                          (amountOutSwap * slippage + 5000n) / 10000n,
                          activeMarket.path[0] == tokenIn
                            ? activeMarket.path
                            : [...activeMarket.path].reverse(),
                          address as `0x${string}`,
                          BigInt(Math.floor(new Date().getTime() / 1000) + 300),
                          usedRefAddress as `0x${string}`,
                        );
                      } else {
                        await _swap(
                          sendUserOperationAsync,
                          router,
                          amountIn,
                          activeMarket.path[0] == tokenIn
                            ? activeMarket.path.at(0)
                            : activeMarket.path.at(1),
                          activeMarket.path[0] == tokenIn
                            ? activeMarket.path.at(1)
                            : activeMarket.path.at(0),
                          true,
                          BigInt(0),
                          amountIn,
                          tokenIn == activeMarket.quoteAddress
                            ? (lowestAsk * 10000n + slippage / 2n) / slippage
                            : (highestBid * slippage + 5000n) / 10000n,
                          BigInt(Math.floor(new Date().getTime() / 1000) + 300),
                          usedRefAddress as `0x${string}`,
                        );
                      }
                    } else {
                      if (allowance < amountIn) {
                        const hash = await approve(
                          sendUserOperationAsync,
                          tokenIn as `0x${string}`,
                          getMarket(
                            activeMarket.path.at(0),
                            activeMarket.path.at(1),
                          ).address,
                          maxUint256,
                        );
                        newTxPopup(
                          (client ? hash.hash : await waitForTransactionReceipt(config, { hash: hash.hash })).transactionHash,
                          'approve',
                          tokenIn,
                          '',
                          customRound(
                            Number(amountIn) /
                            10 ** Number(tokendict[tokenIn].decimals),
                            3,
                          ),
                          0,
                          '',
                          getMarket(
                            activeMarket.path.at(0),
                            activeMarket.path.at(1),
                          ).address,
                        );
                      }
                      if (tokenOut == eth) {
                        if (orderType == 1 || multihop) {
                          await swapExactTokensForETH(
                            sendUserOperationAsync,
                            router,
                            amountIn,
                            (amountOutSwap * slippage + 5000n) / 10000n,
                            activeMarket.path[0] == tokenIn
                              ? activeMarket.path
                              : [...activeMarket.path].reverse(),
                            address as `0x${string}`,
                            BigInt(
                              Math.floor(new Date().getTime() / 1000) + 300,
                            ),
                            usedRefAddress as `0x${string}`,
                          );
                        } else {
                          await _swap(
                            sendUserOperationAsync,
                            router,
                            BigInt(0),
                            activeMarket.path[0] == tokenIn
                              ? activeMarket.path.at(0)
                              : activeMarket.path.at(1),
                            activeMarket.path[0] == tokenIn
                              ? activeMarket.path.at(1)
                              : activeMarket.path.at(0),
                            true,
                            BigInt(0),
                            amountIn,
                            tokenIn == activeMarket.quoteAddress
                              ? (lowestAsk * 10000n + slippage / 2n) / slippage
                              : (highestBid * slippage + 5000n) / 10000n,
                            BigInt(
                              Math.floor(new Date().getTime() / 1000) + 300,
                            ),
                            usedRefAddress as `0x${string}`,
                          );
                        }
                      } else {
                        if (orderType == 1 || multihop) {
                          await swapExactTokensForTokens(
                            sendUserOperationAsync,
                            router,
                            amountIn,
                            (amountOutSwap * slippage + 5000n) / 10000n,
                            activeMarket.path[0] == tokenIn
                              ? activeMarket.path
                              : [...activeMarket.path].reverse(),
                            address as `0x${string}`,
                            BigInt(
                              Math.floor(new Date().getTime() / 1000) + 300,
                            ),
                            usedRefAddress as `0x${string}`,
                          );
                        } else {
                          await _swap(
                            sendUserOperationAsync,
                            router,
                            BigInt(0),
                            activeMarket.path[0] == tokenIn
                              ? activeMarket.path.at(0)
                              : activeMarket.path.at(1),
                            activeMarket.path[0] == tokenIn
                              ? activeMarket.path.at(1)
                              : activeMarket.path.at(0),
                            true,
                            BigInt(0),
                            amountIn,
                            tokenIn == activeMarket.quoteAddress
                              ? (lowestAsk * 10000n + slippage / 2n) / slippage
                              : (highestBid * slippage + 5000n) / 10000n,
                            BigInt(
                              Math.floor(new Date().getTime() / 1000) + 300,
                            ),
                            usedRefAddress as `0x${string}`,
                          );
                        }
                      }
                    }
                  } else {
                    if (tokenIn == eth) {
                      if (orderType == 1 || multihop) {
                        await swapETHForExactTokens(
                          sendUserOperationAsync,
                          router,
                          amountOutSwap,
                          (amountIn * 10000n + slippage / 2n) / slippage,
                          activeMarket.path[0] == tokenIn
                            ? activeMarket.path
                            : [...activeMarket.path].reverse(),
                          address as `0x${string}`,
                          BigInt(Math.floor(new Date().getTime() / 1000) + 300),
                          usedRefAddress as `0x${string}`,
                        );
                      } else {
                        await _swap(
                          sendUserOperationAsync,
                          router,
                          BigInt(
                            (amountIn * 10000n + slippage / 2n) / slippage,
                          ),
                          activeMarket.path[0] == tokenIn
                            ? activeMarket.path.at(0)
                            : activeMarket.path.at(1),
                          activeMarket.path[0] == tokenIn
                            ? activeMarket.path.at(1)
                            : activeMarket.path.at(0),
                          false,
                          BigInt(0),
                          amountOutSwap,
                          tokenIn == activeMarket.quoteAddress
                            ? (lowestAsk * 10000n + slippage / 2n) / slippage
                            : (highestBid * slippage + 5000n) / 10000n,
                          BigInt(Math.floor(new Date().getTime() / 1000) + 300),
                          usedRefAddress as `0x${string}`,
                        );
                      }
                    } else {
                      if (allowance < amountIn) {
                        const hash = await approve(
                          sendUserOperationAsync,
                          tokenIn as `0x${string}`,
                          getMarket(
                            activeMarket.path.at(0),
                            activeMarket.path.at(1),
                          ).address,
                          maxUint256,
                        );
                        newTxPopup(
                          (client ? hash.hash : await waitForTransactionReceipt(config, { hash: hash.hash })).transactionHash,
                          'approve',
                          tokenIn,
                          '',
                          customRound(
                            Number(amountIn) /
                            10 ** Number(tokendict[tokenIn].decimals),
                            3,
                          ),
                          0,
                          '',
                          getMarket(
                            activeMarket.path.at(0),
                            activeMarket.path.at(1),
                          ).address,
                        );
                      }
                      if (tokenOut == eth) {
                        if (orderType == 1 || multihop) {
                          await swapTokensForExactETH(
                            sendUserOperationAsync,
                            router,
                            amountOutSwap,
                            (amountIn * 10000n + slippage / 2n) / slippage,
                            activeMarket.path[0] == tokenIn
                              ? activeMarket.path
                              : [...activeMarket.path].reverse(),
                            address as `0x${string}`,
                            BigInt(
                              Math.floor(new Date().getTime() / 1000) + 300,
                            ),
                            usedRefAddress as `0x${string}`,
                          );
                        } else {
                          await _swap(
                            sendUserOperationAsync,
                            router,
                            BigInt(0),
                            activeMarket.path[0] == tokenIn
                              ? activeMarket.path.at(0)
                              : activeMarket.path.at(1),
                            activeMarket.path[0] == tokenIn
                              ? activeMarket.path.at(1)
                              : activeMarket.path.at(0),
                            false,
                            BigInt(0),
                            amountOutSwap,
                            tokenIn == activeMarket.quoteAddress
                              ? (lowestAsk * 10000n + slippage / 2n) / slippage
                              : (highestBid * slippage + 5000n) / 10000n,
                            BigInt(
                              Math.floor(new Date().getTime() / 1000) + 300,
                            ),
                            usedRefAddress as `0x${string}`,
                          );
                        }
                      } else {
                        if (orderType == 1 || multihop) {
                          await swapTokensForExactTokens(
                            sendUserOperationAsync,
                            router,
                            amountOutSwap,
                            (amountIn * 10000n + slippage / 2n) / slippage,
                            activeMarket.path[0] == tokenIn
                              ? activeMarket.path
                              : [...activeMarket.path].reverse(),
                            address as `0x${string}`,
                            BigInt(
                              Math.floor(new Date().getTime() / 1000) + 300,
                            ),
                            usedRefAddress as `0x${string}`,
                          );
                        } else {
                          await _swap(
                            sendUserOperationAsync,
                            router,
                            BigInt(0),
                            activeMarket.path[0] == tokenIn
                              ? activeMarket.path.at(0)
                              : activeMarket.path.at(1),
                            activeMarket.path[0] == tokenIn
                              ? activeMarket.path.at(1)
                              : activeMarket.path.at(0),
                            false,
                            BigInt(0),
                            amountOutSwap,
                            tokenIn == activeMarket.quoteAddress
                              ? (lowestAsk * 10000n + slippage / 2n) / slippage
                              : (highestBid * slippage + 5000n) / 10000n,
                            BigInt(
                              Math.floor(new Date().getTime() / 1000) + 300,
                            ),
                            usedRefAddress as `0x${string}`,
                          );
                        }
                      }
                    }
                  }
                }
                setswitched(false);
                setInputString('');
                setamountIn(BigInt(0));
                setoutputString('');
                setamountOutSwap(BigInt(0));
                setSliderPercent(0);
                setSwapButtonDisabled(true);
                setSwapButton(1);
                const slider = document.querySelector('.balance-amount-slider');
                const popup = document.querySelector(
                  '.slider-percentage-popup',
                );
                if (slider && popup) {
                  (popup as HTMLElement).style.left = `${15 / 2}px`;
                }
              } catch (error) {
              } finally {
                setTimeout(() => refetch(), 500)
              }
            } else {
              !connected
                ? setpopup(4)
                : handleSetChain()
            }
          }}
          disabled={swapButtonDisabled || displayValuesLoading || isSendingUserOperation}
        >
          {isSendingUserOperation ? (
            <div className="button-content">
              <div className="loading-spinner" />
              {t('signTransaction')}
            </div>
          ) : swapButton == 0 ? (
            t('insufficientLiquidity')
          ) : swapButton == 1 ? (
            t('enterAmount')
          ) : swapButton == 2 ? (
            t('swap')
          ) : swapButton == 3 ? (
            t('insufficient') +
            (tokendict[tokenIn].ticker || '?') +
            ' ' +
            t('bal')
          ) : swapButton == 4 ? (
            `${t('switchto')} ${t(settings.chainConfig[activechain].name)}`
          ) : swapButton == 5 ? (
            t('connectWallet')
          ) : (
            t('approve')
          )}
        </button>
      </div>
      <div className="trade-info-rectangle">
        {!multihop && !isWrap && (
          <div className="trade-fee">
            <div className="label-container">
              <TooltipLabel
                label={t('partialFill')}
                tooltipText={
                  <div>
                    <div className="tooltip-description">
                      {t('partialFillSubtitle')}
                    </div>
                  </div>
                }
                className="impact-label"
              />
            </div>
            <ToggleSwitch
              checked={orderType === 0}
              onChange={() => {
                const newValue = orderType === 1 ? 0 : 1;
                setorderType(newValue);
                localStorage.setItem(
                  'crystal_order_type',
                  JSON.stringify(newValue),
                );
              }}
            />
          </div>
        )}

        {!isWrap && (
          <div className="slippage-row">
            <div className="label-container">
              <div className="slippage-group">
                <TooltipLabel
                  label={t('slippage')}
                  tooltipText={
                    <div>
                      <div className="tooltip-description">
                        {t('slippageHelp')}
                      </div>
                    </div>
                  }
                  className="slippage-label"
                />
              </div>
            </div>
            <div className="slippage-input-container">
              <input
                inputMode="decimal"
                className={`slippage-inline-input ${parseFloat(slippageString) > 5 ? 'red' : ''
                  }`}
                type="text"
                value={slippageString}
                onChange={(e) => {
                  const value = e.target.value;

                  if (
                    /^(?!0{2})\d*\.?\d{0,2}$/.test(value) &&
                    !/^\d{2}\.\d{2}$/.test(value)
                  ) {
                    if (value === '') {
                      setSlippageString('');
                      setSlippage(BigInt(9900));
                      localStorage.setItem('crystal_slippage_string', '1');
                      localStorage.setItem('crystal_slippage', '9900');
                    } else if (parseFloat(value) <= 50) {
                      setSlippageString(value);
                      localStorage.setItem('crystal_slippage_string', value);

                      const newSlippage = BigInt(
                        10000 - parseFloat(value) * 100,
                      );
                      setSlippage(newSlippage);
                      localStorage.setItem(
                        'crystal_slippage',
                        newSlippage.toString(),
                      );
                    }
                  }
                }}
                onBlur={() => {
                  if (slippageString === '') {
                    setSlippageString('1');
                    localStorage.setItem('crystal_slippage_string', '1');

                    setSlippage(BigInt(9900));
                    localStorage.setItem('crystal_slippage', '9900');
                  }
                }}
              />
              <span
                className={`slippage-symbol ${parseFloat(slippageString) > 5 ? 'red' : ''
                  }`}
              >
                %
              </span>
            </div>
          </div>
        )}

        {!isWrap && (
          <div className="average-price">
            <div className="label-container">
              <TooltipLabel
                label={t('averagePrice')}
                tooltipText={
                  <div>
                    <div className="tooltip-description">
                      {t('averagePriceHelp')}
                    </div>
                  </div>
                }
                className="impact-label"
              />
            </div>
            <div className="value-container">
              {displayValuesLoading ? (
                <div className="limit-fee-skeleton" style={{ width: 80 }} />
              ) : isWrap ? (
                `1 ${tokendict[tokenOut].ticker}`
              ) : (
                `${formatSubscript(multihop ? parseFloat(averagePrice).toString() : parseFloat(averagePrice).toFixed(Math.floor(Math.log10(Number(activeMarket.priceFactor)))))} ${multihop ? tokendict[tokenIn].ticker : 'USDC'}`
              )}
            </div>
          </div>
        )}

        <div className="price-impact">
          <div className="label-container">
            <TooltipLabel
              label={t('priceImpact')}
              tooltipText={
                <div>
                  <div className="tooltip-description">
                    {t('priceImpactHelp')}
                  </div>
                </div>
              }
              className="impact-label"
            />
          </div>
          <div className="value-container">
            {displayValuesLoading ? (
              <div className="limit-fee-skeleton" style={{ width: 60 }} />
            ) : isWrap ? (
              `0%`
            ) : priceImpact ? (
              formatCommas(priceImpact)
            ) : (
              '0.00%'
            )}
          </div>
        </div>

        <div className="trade-fee">
          <div className="label-container">
            <TooltipLabel
              label={`${t('fee')} (0.0${isWrap ? '0' : String(Number(BigInt(100000) - activeMarket.fee) / 10).replace(/\./g, "")})%`}
              tooltipText={
                <div>
                  <div className="tooltip-description">
                    {isWrap ? t('nofeeforwrap') : t('takerfeeexplanation')}
                  </div>
                </div>
              }
              className="impact-label"
            />
          </div>
          <div className="value-container">
            {displayValuesLoading ? (
              <div className="limit-fee-skeleton" style={{ width: 70 }} />
            ) : isWrap ? (
              `0 ${tokendict[tokenIn].ticker}`
            ) : (
              formatCommas(tradeFee)
            )}
          </div>
        </div>

        {(warning == 1 && (
          <div className="price-impact-warning">{t('Warning')}</div>
        )) ||
          (warning == 2 && (
            <div className="price-impact-warning">
              {t('insufficientLiquidityWarning')}
            </div>
          )) ||
          (warning == 3 && (
            <div className="price-impact-warning">
              {t('insufficientLiquidityWarningMultihop')}
            </div>
          ))}
      </div>
      <div className="orders-info-rectangle">
        <SimpleOrdersContainer
          orders={orders}
          router={router}
          address={address}
          trades={tradesByMarket}
          refetch={refetch}
          sendUserOperation={sendUserOperation}
          setChain={handleSetChain}
        />
      </div>

    </div>
  );

  // limit ui component
  const limit = (
    <div className="rectangle">
      <div className="navlinkwrapper" data-active={activeTab}>
        <div className="innernavlinkwrapper">
          <Link
            to="/swap"
            className={`navlink ${activeTab === 'swap' ? 'active' : ''}`}
          >
            {t('swap')}
          </Link>
          <Link
            to="/limit"
            className={`navlink ${activeTab === 'limit' ? 'active' : ''}`}
            onClick={(e) => {
              if (location.pathname === '/limit') {
                e.preventDefault();
              }
            }}
          >
            {t('limit')}
          </Link>
          <span
            ref={(el: HTMLSpanElement | null) => {
              sendButtonRef.current = el;
            }}
            className={`navlink ${activeTab != 'swap' && activeTab != 'limit' ? 'active' : ''}`}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              setShowSendDropdown(!showSendDropdown);
            }}
          >
            {t(currentProText)}
            <svg
              className={`dropdown-arrow ${showSendDropdown ? 'open' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>

          {showSendDropdown && (
            <div className="navlink-dropdown" ref={sendDropdownRef}>
              <Link
                to="/send"
                className="dropdown-item"
                onClick={() => {
                  setShowSendDropdown(false);
                  setCurrentProText(t('send'));
                }}
              >
                {t('send')}
              </Link>
              <Link
                to="/scale"
                className="dropdown-item"
                onClick={() => {
                  setShowSendDropdown(false);
                  setCurrentProText(t('scale'));
                }}
              >
                {t('scale')}
              </Link>
            </div>
          )}
        </div>

        <div className="sliding-tab-indicator" />
      </div>
      <div className="swapmodal">
        <div
          className={`inputbg ${connected &&
            ((amountIn > tokenBalances[tokenIn] &&
              !isLoading &&
              !stateIsLoading) ||
              (amountIn != BigInt(0) &&
                (tokenIn == activeMarket.quoteAddress
                  ? amountIn < activeMarket.minSize
                  : (amountIn * limitPrice) / activeMarket.scaleFactor <
                  activeMarket.minSize)))
            ? 'exceed-balance'
            : ''
            }`}
        >
          <div className="Pay">{t('pay')}</div>
          <div className="inputbutton1container">
            <input
              inputMode="decimal"
              className={`input ${connected &&
                  ((amountIn > tokenBalances[tokenIn] &&
                    !isLoading &&
                    !stateIsLoading) ||
                    (amountIn !== BigInt(0) &&
                      (tokenIn === activeMarket.quoteAddress
                        ? amountIn < activeMarket.minSize
                        : (amountIn * limitPrice) / activeMarket.scaleFactor <
                        activeMarket.minSize)))
                  ? 'exceed-balance'
                  : ''
                }`}
              onCompositionStart={() => {
                setIsComposing(true);
              }}
              onCompositionEnd={(
                e: React.CompositionEvent<HTMLInputElement>,
              ) => {
                setIsComposing(false);
                if (/^\d*\.?\d{0,18}$/.test(e.currentTarget.value)) {
                  setInputString(e.currentTarget.value);
                  const inputValue = BigInt(
                    Math.round(
                      (parseFloat(e.currentTarget.value || '0') || 0) *
                      10 ** Number(tokendict[tokenIn].decimals),
                    ),
                  );

                  setamountOutLimit(
                    limitPrice !== BigInt(0) && inputValue !== BigInt(0)
                      ? tokenIn === activeMarket?.baseAddress
                        ? (inputValue * limitPrice) /
                        (activeMarket.scaleFactor || BigInt(1))
                        : (inputValue *
                          (activeMarket.scaleFactor || BigInt(1))) /
                        limitPrice
                      : BigInt(0),
                  );

                  setlimitoutputString(
                    (limitPrice !== BigInt(0) && inputValue !== BigInt(0)
                      ? tokenIn === activeMarket?.baseAddress
                        ? customRound(
                          Number(
                            (inputValue * limitPrice) /
                            (activeMarket.scaleFactor || BigInt(1)),
                          ) /
                          10 ** Number(tokendict[tokenOut].decimals),
                          3,
                        )
                        : customRound(
                          Number(
                            (inputValue *
                              (activeMarket.scaleFactor || BigInt(1))) /
                            limitPrice,
                          ) /
                          10 ** Number(tokendict[tokenOut].decimals),
                          3,
                        )
                      : ''
                    ).toString(),
                  );

                  debouncedSetAmount(inputValue);

                  const percentage = !tokenBalances[tokenIn]
                    ? 0
                    : Math.min(
                      100,
                      Math.floor(
                        Number(
                          (inputValue * BigInt(100)) / tokenBalances[tokenIn],
                        ),
                      ),
                    );
                  setSliderPercent(percentage);

                  const slider = document.querySelector(
                    '.balance-amount-slider',
                  );
                  const popup = document.querySelector(
                    '.slider-percentage-popup',
                  );
                  if (slider && popup) {
                    const rect = slider.getBoundingClientRect();
                    (popup as HTMLElement).style.left =
                      `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                  }
                }
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (isComposing) {
                  setInputString(e.target.value);
                  return;
                }

                if (/^\d*\.?\d{0,18}$/.test(e.target.value)) {
                  setInputString(e.target.value);
                  const inputValue = BigInt(
                    Math.round(
                      (parseFloat(e.target.value || '0') || 0) *
                      10 ** Number(tokendict[tokenIn].decimals),
                    ),
                  );

                  setamountOutLimit(
                    limitPrice !== BigInt(0) && inputValue !== BigInt(0)
                      ? tokenIn === activeMarket?.baseAddress
                        ? (inputValue * limitPrice) /
                        (activeMarket.scaleFactor || BigInt(1))
                        : (inputValue *
                          (activeMarket.scaleFactor || BigInt(1))) /
                        limitPrice
                      : BigInt(0),
                  );

                  setlimitoutputString(
                    (limitPrice !== BigInt(0) && inputValue !== BigInt(0)
                      ? tokenIn === activeMarket?.baseAddress
                        ? customRound(
                          Number(
                            (inputValue * limitPrice) /
                            (activeMarket.scaleFactor || BigInt(1)),
                          ) /
                          10 ** Number(tokendict[tokenOut].decimals),
                          3,
                        )
                        : customRound(
                          Number(
                            (inputValue *
                              (activeMarket.scaleFactor || BigInt(1))) /
                            limitPrice,
                          ) /
                          10 ** Number(tokendict[tokenOut].decimals),
                          3,
                        )
                      : ''
                    ).toString(),
                  );

                  debouncedSetAmount(inputValue);

                  const percentage = !tokenBalances[tokenIn]
                    ? 0
                    : Math.min(
                      100,
                      Math.floor(
                        Number(
                          (inputValue * BigInt(100)) / tokenBalances[tokenIn],
                        ),
                      ),
                    );
                  setSliderPercent(percentage);

                  const slider = document.querySelector(
                    '.balance-amount-slider',
                  );
                  const popup = document.querySelector(
                    '.slider-percentage-popup',
                  );
                  if (slider && popup) {
                    const rect = slider.getBoundingClientRect();
                    (popup as HTMLElement).style.left =
                      `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                  }
                }
              }}
              placeholder="0.00"
              value={inputString}
              autoFocus={!(windowWidth <= 1020)}
            />
            <button
              className={`button1 ${connected &&
                ((amountIn > tokenBalances[tokenIn] &&
                  !isLoading &&
                  !stateIsLoading) ||
                  (amountIn != BigInt(0) &&
                    (tokenIn == activeMarket.quoteAddress
                      ? amountIn < activeMarket.minSize
                      : (amountIn * limitPrice) / activeMarket.scaleFactor <
                      activeMarket.minSize)))
                ? 'exceed-balance'
                : ''
                }`}
              onClick={() => {
                setpopup(1);
              }}
            >
              <img className="button1pic" src={tokendict[tokenIn].image} />
              <span>{tokendict[tokenIn].ticker || '?'}</span>
              <svg
                className="button-arrow"
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
          </div>
          <div className="balance1maxcontainer">
            <span className="usd-value">
              {Math.round(
                (parseFloat(inputString || '0') || 0) *
                10 ** Number(tokendict[tokenIn].decimals),
              ) == 0
                ? '$0.00'
                : formatUSDDisplay(
                  calculateUSDValue(
                    BigInt(
                      Math.round(
                        (parseFloat(inputString || '0') || 0) *
                        10 ** Number(tokendict[tokenIn].decimals),
                      ),
                    ),
                    tradesByMarket[
                    getMarket(
                      activeMarket.path.at(0),
                      activeMarket.path.at(1),
                    ).baseAsset +
                    getMarket(
                      activeMarket.path.at(0),
                      activeMarket.path.at(1),
                    ).quoteAsset
                    ],
                    tokenIn,
                    getMarket(
                      activeMarket.path.at(0),
                      activeMarket.path.at(1),
                    ),
                  ),
                )}
            </span>
            <div className="balance1">
              <img src={walleticon} className="balance-wallet-icon" />{' '}
              {formatDisplayValue(
                tokenBalances[tokenIn],
                Number(tokendict[tokenIn].decimals),
              )}
            </div>
            <div
              className="max-button"
              onClick={() => {
                if (tokenBalances[tokenIn] != BigInt(0)) {
                  let amount =
                    tokenIn == eth
                      ? tokenBalances[tokenIn] -
                        settings.chainConfig[activechain].gasamount >
                        BigInt(0)
                        ? tokenBalances[tokenIn] -
                        settings.chainConfig[activechain].gasamount
                        : BigInt(0)
                      : tokenBalances[tokenIn];
                  debouncedSetAmount(BigInt(amount));
                  setInputString(
                    customRound(
                      Number(amount) /
                      10 ** Number(tokendict[tokenIn].decimals),
                      3,
                    ).toString(),
                  );
                  setamountOutLimit(
                    limitPrice != BigInt(0) && amount != BigInt(0)
                      ? tokenIn === activeMarket?.baseAddress
                        ? (amount * limitPrice) /
                        (activeMarket.scaleFactor || BigInt(1))
                        : (BigInt(amount) *
                          (activeMarket.scaleFactor || BigInt(1))) /
                        limitPrice
                      : BigInt(0),
                  );
                  setlimitoutputString(
                    (limitPrice != BigInt(0) && amount != BigInt(0)
                      ? tokenIn === activeMarket?.baseAddress
                        ? customRound(
                          Number(
                            (amount * limitPrice) /
                            (activeMarket.scaleFactor || BigInt(1)),
                          ) /
                          10 ** Number(tokendict[tokenOut].decimals),
                          3,
                        )
                        : customRound(
                          Number(
                            (BigInt(amount) *
                              (activeMarket.scaleFactor || BigInt(1))) /
                            limitPrice,
                          ) /
                          10 ** Number(tokendict[tokenOut].decimals),
                          3,
                        )
                      : ''
                    ).toString(),
                  );
                  setSliderPercent(100);
                  const slider = document.querySelector(
                    '.balance-amount-slider',
                  );
                  const popup = document.querySelector(
                    '.slider-percentage-popup',
                  );
                  if (slider && popup) {
                    const rect = slider.getBoundingClientRect();
                    const trackWidth = rect.width - 15;
                    const thumbPosition = trackWidth + 15 / 2;
                    (popup as HTMLElement).style.left = `${thumbPosition}px`;
                  }
                }
              }}
            >
              {t('max')}{' '}
            </div>
          </div>
        </div>
        <div
          className="switch-button"
          onClick={() => {
            setTokenIn(tokenOut);
            setTokenOut(tokenIn);
            if (amountIn != BigInt(0)) {
              setInputString(limitoutputString);
              setlimitoutputString(inputString);
              setamountIn(amountOutLimit);
              setamountOutLimit(amountIn);
              const percentage = !tokenBalances[tokenOut]
                ? 0
                : Math.min(
                  100,
                  Math.floor(
                    Number(
                      (amountOutLimit * BigInt(100)) /
                      tokenBalances[tokenOut],
                    ),
                  ),
                );
              setSliderPercent(percentage);
              const slider = document.querySelector('.balance-amount-slider');
              const popup = document.querySelector('.slider-percentage-popup');
              if (slider && popup) {
                const rect = slider.getBoundingClientRect();
                (popup as HTMLElement).style.left =
                  `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
              }
            }
          }}
        >
          <img src={tradearrow} className="switch-arrow" />
        </div>
        <div className="swap-container-divider" />

        <div className="outputbg">
          <div className="Recieve">{t('receive')}</div>
          <div className="outputbutton2container">
            <>
              <input
                inputMode="decimal"
                className="output"
                onCompositionStart={() => {
                  setIsComposing(true);
                }}
                onCompositionEnd={(
                  e: React.CompositionEvent<HTMLInputElement>,
                ) => {
                  setIsComposing(false);
                  if (/^\d*\.?\d{0,18}$/.test(e.currentTarget.value)) {
                    setlimitoutputString(e.currentTarget.value);
                    const outputValue = BigInt(
                      Math.round(
                        (parseFloat(e.currentTarget.value || '0') || 0) *
                        10 ** Number(tokendict[tokenOut].decimals),
                      ),
                    );
                    setamountOutLimit(outputValue);
                    debouncedSetAmount(
                      limitPrice !== BigInt(0) && outputValue !== BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? (outputValue *
                            (activeMarket.scaleFactor || BigInt(1))) /
                          limitPrice
                          : (outputValue * limitPrice) /
                          (activeMarket.scaleFactor || BigInt(1))
                        : BigInt(0),
                    );
                    setInputString(
                      (limitPrice !== BigInt(0) && outputValue !== BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? customRound(
                            Number(
                              (outputValue *
                                (activeMarket.scaleFactor || BigInt(1))) /
                              limitPrice,
                            ) /
                            10 ** Number(tokendict[tokenIn].decimals),
                            3,
                          )
                          : customRound(
                            Number(
                              (outputValue * limitPrice) /
                              (activeMarket.scaleFactor || BigInt(1)),
                            ) /
                            10 ** Number(tokendict[tokenIn].decimals),
                            3,
                          )
                        : ''
                      ).toString(),
                    );
                    const percentage =
                      tokenBalances[tokenIn] === BigInt(0)
                        ? 0
                        : Math.min(
                          100,
                          Math.floor(
                            Number(
                              (limitPrice !== BigInt(0) &&
                                outputValue !== BigInt(0)
                                ? tokenIn === activeMarket?.baseAddress
                                  ? (outputValue *
                                    (activeMarket.scaleFactor ||
                                      BigInt(1))) /
                                  limitPrice
                                  : (outputValue * limitPrice) /
                                  (activeMarket.scaleFactor || BigInt(1))
                                : BigInt(0)) * BigInt(100),
                            ) / tokenBalances[tokenIn],
                          ),
                        );
                    setSliderPercent(percentage);
                    const slider = document.querySelector(
                      '.balance-amount-slider',
                    );
                    const popup = document.querySelector(
                      '.slider-percentage-popup',
                    );
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      (popup as HTMLElement).style.left = `${(rect.width - 15) * (percentage / 100) + 15 / 2
                        }px`;
                    }
                  }
                }}
                onChange={(e) => {
                  if (isComposing) {
                    setlimitoutputString(e.target.value);
                    return;
                  }
                  if (/^\d*\.?\d{0,18}$/.test(e.target.value)) {
                    setlimitoutputString(e.target.value);
                    const outputValue = BigInt(
                      Math.round(
                        (parseFloat(e.target.value || '0') || 0) *
                        10 ** Number(tokendict[tokenOut].decimals),
                      ),
                    );
                    setamountOutLimit(outputValue);
                    debouncedSetAmount(
                      limitPrice !== BigInt(0) && outputValue !== BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? (outputValue *
                            (activeMarket.scaleFactor || BigInt(1))) /
                          limitPrice
                          : (outputValue * limitPrice) /
                          (activeMarket.scaleFactor || BigInt(1))
                        : BigInt(0),
                    );
                    setInputString(
                      (limitPrice !== BigInt(0) && outputValue !== BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? customRound(
                            Number(
                              (outputValue *
                                (activeMarket.scaleFactor || BigInt(1))) /
                              limitPrice,
                            ) /
                            10 ** Number(tokendict[tokenIn].decimals),
                            3,
                          )
                          : customRound(
                            Number(
                              (outputValue * limitPrice) /
                              (activeMarket.scaleFactor || BigInt(1)),
                            ) /
                            10 ** Number(tokendict[tokenIn].decimals),
                            3,
                          )
                        : ''
                      ).toString(),
                    );
                    const percentage =
                      tokenBalances[tokenIn] === BigInt(0)
                        ? 0
                        : Math.min(
                          100,
                          Math.floor(
                            Number(
                              (limitPrice !== BigInt(0) &&
                                outputValue !== BigInt(0)
                                ? tokenIn === activeMarket?.baseAddress
                                  ? (outputValue *
                                    (activeMarket.scaleFactor ||
                                      BigInt(1))) /
                                  limitPrice
                                  : (outputValue * limitPrice) /
                                  (activeMarket.scaleFactor || BigInt(1))
                                : BigInt(0)) * BigInt(100) / tokenBalances[tokenIn]
                            )
                          ),
                        );
                    setSliderPercent(percentage);
                    const slider = document.querySelector(
                      '.balance-amount-slider',
                    );
                    const popup = document.querySelector(
                      '.slider-percentage-popup',
                    );
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      (popup as HTMLElement).style.left = `${(rect.width - 15) * (percentage / 100) + 15 / 2
                        }px`;
                    }
                  }
                }}
                value={limitoutputString}
                placeholder="0.00"
              />
              <button
                className="button2"
                onClick={() => {
                  setpopup(2);
                }}
              >
                <img className="button2pic" src={tokendict[tokenOut].image} />
                <span>{tokendict[tokenOut].ticker || '?'}</span>
                <svg
                  className="button-arrow"
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
            </>
          </div>
          <div className="balance1maxcontainer">
            <div className="output-usd-value">
              {amountOutLimit === BigInt(0)
                ? '$0.00'
                : (() => {
                  const outputUSD = calculateUSDValue(
                    amountOutLimit,
                    tradesByMarket[
                    getMarket(
                      activeMarket.path.at(-2),
                      activeMarket.path.at(-1),
                    ).baseAsset +
                    getMarket(
                      activeMarket.path.at(-2),
                      activeMarket.path.at(-1),
                    ).quoteAsset
                    ],
                    tokenOut,
                    getMarket(
                      activeMarket.path.at(-2),
                      activeMarket.path.at(-1),
                    ),
                  );

                  const inputUSD = calculateUSDValue(
                    limitPrice != BigInt(0) && amountOutLimit != BigInt(0)
                      ? tokenIn === activeMarket?.baseAddress
                        ? (amountOutLimit *
                          (activeMarket.scaleFactor || BigInt(1))) /
                        limitPrice
                        : (amountOutLimit * limitPrice) /
                        (activeMarket.scaleFactor || BigInt(1))
                      : BigInt(0),
                    tradesByMarket[
                    getMarket(
                      activeMarket.path.at(0),
                      activeMarket.path.at(1),
                    ).baseAsset +
                    getMarket(
                      activeMarket.path.at(0),
                      activeMarket.path.at(1),
                    ).quoteAsset
                    ],
                    tokenIn,
                    getMarket(
                      activeMarket.path.at(0),
                      activeMarket.path.at(1),
                    ),
                  );

                  const percentageDiff =
                    inputUSD > 0
                      ? ((outputUSD - inputUSD) / inputUSD) * 100
                      : 0;

                  return (
                    <div className="output-usd-container">
                      <span>{formatUSDDisplay(outputUSD)}</span>
                      {inputUSD > 0 && (
                        <span
                          className={`output-percentage ${percentageDiff >= 0 ? 'positive' : 'negative'}`}
                        >
                          ({percentageDiff >= 0 ? '+' : ''}
                          {percentageDiff.toFixed(2)}%)
                        </span>
                      )}
                    </div>
                  );
                })()}
            </div>
            <div className="balance2">
              <img src={walleticon} className="balance-wallet-icon" />{' '}
              {formatDisplayValue(
                tokenBalances[tokenOut],
                Number(tokendict[tokenOut].decimals),
              )}
            </div>
          </div>
        </div>

        <div className="swap-container-divider" />

        <div
          className={`limitbg ${connected &&
            !(
              amountIn > tokenBalances[tokenIn] &&
              !isLoading &&
              !stateIsLoading
            ) &&
            addliquidityonly &&
            amountIn != BigInt(0) &&
            ((limitPrice >= lowestAsk &&
              tokenIn == activeMarket.quoteAddress) ||
              (limitPrice <= highestBid &&
                tokenIn == activeMarket.baseAddress)) &&
            !(tokenIn == activeMarket.quoteAddress
              ? amountIn < activeMarket.minSize
              : (amountIn * limitPrice) / activeMarket.scaleFactor <
              activeMarket.minSize)
            ? 'exceed-balance'
            : ''
            }`}
        >
          <div className="limit-label">
            <span>{t('When')}</span>
            <button
              className="limit-token-button"
              onClick={() => {
                tokenIn == activeMarket?.quoteAddress
                  ? setpopup(2)
                  : setpopup(1);
              }}
            >
              <img
                className="limit-token-icon"
                src={tokendict[activeMarket?.baseAddress].image}
              />
              <span>{tokendict[activeMarket?.baseAddress].ticker || '?'}</span>
            </button>
            <span>{t('isWorth')}</span>
            <button
              className="use-market-button"
              onClick={() => {
                setlimitChase(true);
              }}
            >
              {t('useMarket')}
            </button>
          </div>
          <div className="limitpricecontainer">
            <input
              inputMode="decimal"
              className={`limit-order ${connected &&
                  !(
                    amountIn > tokenBalances[tokenIn] &&
                    !isLoading &&
                    !stateIsLoading
                  ) &&
                  addliquidityonly &&
                  amountIn != BigInt(0) &&
                  ((limitPrice >= lowestAsk &&
                    tokenIn == activeMarket.quoteAddress) ||
                    (limitPrice <= highestBid &&
                      tokenIn == activeMarket.baseAddress)) &&
                  !(tokenIn == activeMarket.quoteAddress
                    ? amountIn < activeMarket.minSize
                    : (amountIn * limitPrice) / activeMarket.scaleFactor <
                    activeMarket.minSize)
                  ? 'exceed-balance'
                  : ''
                }`}
              onChange={(e) => {
                if (/^\d*\.?\d{0,18}$/.test(e.target.value)) {
                  setlimitChase(false);
                  setlimitPriceString(e.target.value);
                  let price = BigInt(
                    Math.round(
                      (parseFloat(e.target.value || '0') || 0) *
                      Number(activeMarket.priceFactor),
                    ),
                  );
                  setlimitPrice(price);
                  setamountOutLimit(
                    price != BigInt(0) && amountIn != BigInt(0)
                      ? tokenIn === activeMarket?.baseAddress
                        ? (amountIn * price) /
                        (activeMarket.scaleFactor || BigInt(1))
                        : (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
                        price
                      : BigInt(0),
                  );
                  setlimitoutputString(
                    (price != BigInt(0) && amountIn != BigInt(0)
                      ? tokenIn === activeMarket?.baseAddress
                        ? customRound(
                          Number(
                            (amountIn * price) /
                            (activeMarket.scaleFactor || BigInt(1)),
                          ) /
                          10 ** Number(tokendict[tokenOut].decimals),
                          3,
                        )
                        : customRound(
                          Number(
                            (amountIn *
                              (activeMarket.scaleFactor || BigInt(1))) /
                            price,
                          ) /
                          10 ** Number(tokendict[tokenOut].decimals),
                          3,
                        )
                      : ''
                    ).toString(),
                  );
                }
              }}
              placeholder="0.00"
              value={limitPriceString}
            />
            <span className="limit-order-usd-label">USDC</span>
          </div>
        </div>
        <div className="balance-slider-wrapper">
          <div className="slider-container">
            <input
              type="range"
              className={`balance-amount-slider ${isDragging ? 'dragging' : ''}`}
              min="0"
              max="100"
              step="1"
              value={sliderPercent}
              onChange={(e) => {
                const percent = parseInt(e.target.value);
                const newAmount =
                  ((tokenIn == eth
                    ? tokenBalances[tokenIn] -
                      settings.chainConfig[activechain].gasamount >
                      BigInt(0)
                      ? tokenBalances[tokenIn] -
                      settings.chainConfig[activechain].gasamount
                      : BigInt(0)
                    : tokenBalances[tokenIn]) *
                    BigInt(percent)) /
                  100n;
                setSliderPercent(percent);
                setInputString(
                  newAmount == BigInt(0)
                    ? ''
                    : customRound(
                      Number(newAmount) /
                      10 ** Number(tokendict[tokenIn].decimals),
                      3,
                    ).toString(),
                );
                debouncedSetAmount(newAmount);
                setamountOutLimit(
                  limitPrice != BigInt(0) && newAmount != BigInt(0)
                    ? tokenIn === activeMarket?.baseAddress
                      ? (newAmount * limitPrice) /
                      (activeMarket.scaleFactor || BigInt(1))
                      : (newAmount * (activeMarket.scaleFactor || BigInt(1))) /
                      limitPrice
                    : BigInt(0),
                );
                setlimitoutputString(
                  (limitPrice != BigInt(0) && newAmount != BigInt(0)
                    ? tokenIn === activeMarket?.baseAddress
                      ? customRound(
                        Number(
                          (newAmount * limitPrice) /
                          (activeMarket.scaleFactor || BigInt(1)),
                        ) /
                        10 ** Number(tokendict[tokenOut].decimals),
                        3,
                      )
                      : customRound(
                        Number(
                          (newAmount *
                            (activeMarket.scaleFactor || BigInt(1))) /
                          limitPrice,
                        ) /
                        10 ** Number(tokendict[tokenOut].decimals),
                        3,
                      )
                    : ''
                  ).toString(),
                );
                const slider = e.target;
                const rect = slider.getBoundingClientRect();
                const trackWidth = rect.width - 15;
                const thumbPosition = (percent / 100) * trackWidth + 15 / 2;
                const popup: HTMLElement | null = document.querySelector(
                  '.slider-percentage-popup',
                );
                if (popup) {
                  popup.style.left = `${thumbPosition}px`;
                }
              }}
              onMouseDown={() => {
                setIsDragging(true);
                const popup: HTMLElement | null = document.querySelector(
                  '.slider-percentage-popup',
                );
                if (popup) popup.classList.add('visible');
              }}
              onMouseUp={() => {
                setIsDragging(false);
                const popup: HTMLElement | null = document.querySelector(
                  '.slider-percentage-popup',
                );
                if (popup) popup.classList.remove('visible');
              }}
              style={{
                background: `linear-gradient(to right,rgb(171, 176, 224) ${sliderPercent}%,rgb(21, 21, 25) ${sliderPercent}%)`,
              }}
            />
            <div className="slider-percentage-popup">{sliderPercent}%</div>
            <div className="balance-slider-marks">
              {[0, 25, 50, 75, 100].map((markPercent) => (
                <div
                  key={markPercent}
                  className="balance-slider-mark"
                  data-active={sliderPercent >= markPercent}
                  data-percentage={markPercent}
                  onClick={() => {
                    const newAmount =
                      ((tokenIn == eth
                        ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount >
                          BigInt(0)
                          ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount
                          : BigInt(0)
                        : tokenBalances[tokenIn]) *
                        BigInt(markPercent)) /
                      100n;
                    setSliderPercent(markPercent);
                    setInputString(
                      newAmount == BigInt(0)
                        ? ''
                        : customRound(
                          Number(newAmount) /
                          10 ** Number(tokendict[tokenIn].decimals),
                          3,
                        ).toString(),
                    );
                    debouncedSetAmount(newAmount);
                    setamountOutLimit(
                      limitPrice != BigInt(0) && newAmount != BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? (newAmount * limitPrice) /
                          (activeMarket.scaleFactor || BigInt(1))
                          : (newAmount *
                            (activeMarket.scaleFactor || BigInt(1))) /
                          limitPrice
                        : BigInt(0),
                    );
                    setlimitoutputString(
                      (limitPrice != BigInt(0) && newAmount != BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? customRound(
                            Number(
                              (newAmount * limitPrice) /
                              (activeMarket.scaleFactor || BigInt(1)),
                            ) /
                            10 ** Number(tokendict[tokenOut].decimals),
                            3,
                          )
                          : customRound(
                            Number(
                              (newAmount *
                                (activeMarket.scaleFactor || BigInt(1))) /
                              limitPrice,
                            ) /
                            10 ** Number(tokendict[tokenOut].decimals),
                            3,
                          )
                        : ''
                      ).toString(),
                    );
                    const slider = document.querySelector(
                      '.balance-amount-slider',
                    );
                    const popup: HTMLElement | null = document.querySelector(
                      '.slider-percentage-popup',
                    );
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      popup.style.left = `${(rect.width - 15) * (markPercent / 100) + 15 / 2
                        }px`;
                    }
                  }}
                >
                  {markPercent}%
                </div>
              ))}
            </div>
          </div>
        </div>
        <button
          className={`limit-swap-button ${isSendingUserOperation ? 'signing' : ''}`}
          onClick={async () => {
            if (
              connected &&
              userchain === activechain
            ) {
              try {
                if (tokenIn == eth) {
                  if (addliquidityonly) {
                    await limitOrder(
                      sendUserOperationAsync,
                      router,
                      amountIn,
                      eth,
                      tokenOut as `0x${string}`,
                      limitPrice,
                      amountIn,
                    );
                  } else {
                    await _swap(
                      sendUserOperationAsync,
                      router,
                      amountIn,
                      eth,
                      tokenOut as `0x${string}`,
                      true,
                      BigInt(2),
                      amountIn,
                      limitPrice,
                      BigInt(Math.floor(new Date().getTime() / 1000) + 300),
                      usedRefAddress as `0x${string}`,
                    );
                  }
                } else {
                  if (allowance < amountIn) {
                    const hash = await approve(
                      sendUserOperationAsync,
                      tokenIn as `0x${string}`,
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ).address,
                      maxUint256,
                    );
                    newTxPopup(
                      (client ? hash.hash : await waitForTransactionReceipt(config, { hash: hash.hash })).transactionHash,
                      'approve',
                      tokenIn,
                      '',
                      customRound(
                        Number(amountIn) /
                        10 ** Number(tokendict[tokenIn].decimals),
                        3,
                      ),
                      0,
                      '',
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ).address,
                    );
                  }

                  if (addliquidityonly) {
                    await limitOrder(
                      sendUserOperationAsync,
                      router,
                      BigInt(0),
                      tokenIn as `0x${string}`,
                      tokenOut as `0x${string}`,
                      limitPrice,
                      amountIn,
                    );
                  } else {
                    await _swap(
                      sendUserOperationAsync,
                      router,
                      BigInt(0),
                      tokenIn as `0x${string}`,
                      tokenOut as `0x${string}`,
                      true,
                      BigInt(2),
                      amountIn,
                      limitPrice,
                      BigInt(Math.floor(new Date().getTime() / 1000) + 300),
                      usedRefAddress as `0x${string}`,
                    );
                  }
                }
                setInputString('');
                setamountIn(BigInt(0));
                setSliderPercent(0);
                const slider = document.querySelector('.balance-amount-slider');
                const popup = document.querySelector(
                  '.slider-percentage-popup',
                );
                if (slider && popup) {
                  (popup as HTMLElement).style.left = `${15 / 2}px`;
                }
                setamountOutLimit(BigInt(0));
                setlimitoutputString('');
                setLimitButtonDisabled(true);
                setLimitButton(0);
              } catch (error) {
              } finally {
                setTimeout(() => refetch(), 500)
              }
            } else {
              !connected
                ? setpopup(4)
                : handleSetChain()
            }
          }}
          disabled={limitButtonDisabled || isSendingUserOperation}
        >
          {isSendingUserOperation ? (
            <div className="button-content">
              <div className="loading-spinner" />
              {t('signTransaction')}
            </div>
          ) : limitButton == 0 ? (
            t('enterAmount')
          ) : limitButton == 1 ? (
            t('enterLimitPrice')
          ) : limitButton == 2 ? (
            t('priceOutOfRangeBuy')
          ) : limitButton == 3 ? (
            t('priceOutOfRangeSell')
          ) : limitButton == 4 ? (
            t('lessThanMinSize')
          ) : limitButton == 5 ? (
            t('placeOrder')
          ) : limitButton == 6 ? (
            t('insufficient') +
            (tokendict[tokenIn].ticker || '?') +
            ' ' +
            t('bal')
          ) : limitButton == 7 ? (
            `${t('switchto')} ${t(settings.chainConfig[activechain].name)}`
          ) : limitButton == 8 ? (
            t('connectWallet')
          ) : (
            t('approve')
          )}
        </button>
      </div>
      <div className="limit-info-rectangle">
        <div className="trade-fee">
          <div className="label-container">
            <TooltipLabel
              label={t('addLiquidityOnly')}
              tooltipText={
                <div>
                  <div className="tooltip-description">
                    {t('addLiquidityOnlySubtitle')}
                  </div>
                </div>
              }
              className="impact-label"
            />
          </div>
          <ToggleSwitch
            checked={addliquidityonly}
            onChange={() => {
              const newValue = !addliquidityonly;
              setAddLiquidityOnly(newValue);
              localStorage.setItem(
                'crystal_add_liquidity_only',
                JSON.stringify(newValue),
              );
            }}
          />
        </div>
        <div className="trade-fee">
          <div className="label-container">
            <TooltipLabel
              label={t('fee')}
              tooltipText={
                <div>
                  <div className="tooltip-description">
                    {t('makerfeeexplanation')}
                  </div>
                </div>
              }
              className="impact-label"
            />
          </div>
          <div className="value-container">
            {`${0} ${tokendict[tokenIn].ticker}`}
          </div>
        </div>

        {!addliquidityonly &&
          limitPrice != BigInt(0) &&
          ((limitPrice >= lowestAsk && tokenIn == activeMarket.quoteAddress) ||
            (limitPrice <= highestBid &&
              tokenIn == activeMarket.baseAddress)) &&
          amountIn != BigInt(0) && (
            <div className="limit-impact-warning">
              {tokenIn == activeMarket.quoteAddress
                ? t('priceOutOfRangeWarningBuy')
                : t('priceOutOfRangeWarningSell')}
            </div>
          )}
      </div>
      <div className="orders-info-rectangle">
        <SimpleOrdersContainer
          orders={orders}
          router={router}
          address={address}
          trades={tradesByMarket}
          refetch={refetch}
          sendUserOperation={sendUserOperation}
          setChain={handleSetChain}
        />
      </div>
    </div>
  );

  // send ui component
  const send = (
    <div className="rectangle">
      <div className="navlinkwrapper" data-active={activeTab}>
        <div className="innernavlinkwrapper">
          <Link
            to="/swap"
            className={`navlink ${activeTab === 'swap' ? 'active' : ''}`}
          >
            {t('swap')}
          </Link>
          <Link
            to="/limit"
            className={`navlink ${activeTab === 'limit' ? 'active' : ''}`}
          >
            {t('limit')}
          </Link>
          <span
            ref={(el: HTMLSpanElement | null) => {
              sendButtonRef.current = el;
            }}
            className={`navlink ${activeTab != 'swap' && activeTab != 'limit' ? 'active' : ''}`}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              setShowSendDropdown(!showSendDropdown);
            }}
          >
            {t(currentProText)}
            <svg
              className={`dropdown-arrow ${showSendDropdown ? 'open' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>

          {showSendDropdown && (
            <div className="navlink-dropdown" ref={sendDropdownRef}>
              <Link
                to="/send"
                className="dropdown-item"
                onClick={(e) => {
                  setShowSendDropdown(false);
                  setCurrentProText(t('send'));
                  if (location.pathname === '/send') {
                    e.preventDefault();
                  }
                }}
              >
                {t('send')}
              </Link>
              <Link
                to="/scale"
                className="dropdown-item"
                onClick={() => {
                  setShowSendDropdown(false);
                  setCurrentProText(t('scale'));
                }}
              >
                {t('scale')}
              </Link>
            </div>
          )}
        </div>
        <div className="sliding-tab-indicator" />
      </div>
      <div className="swapmodal">
        <div
          className={`sendbg ${connected && amountIn > tokenBalances[tokenIn]
            ? 'exceed-balance'
            : ''
            }`}
        >
          <div className="sendbutton1container">
            <div className="send-Send">{t('send')}</div>
            <button
              className="send-button1"
              onClick={() => {
                setpopup(1);
              }}
            >
              <img className="send-button1pic" src={tokendict[tokenIn].image} />
              <span>{tokendict[tokenIn].ticker || '?'}</span>
            </button>
          </div>
          <div className="sendinputcontainer">
            <input
              inputMode="decimal"
              className={`send-input ${connected &&
                  amountIn > tokenBalances[tokenIn]
                  ? 'exceed-balance'
                  : ''
                }`}
              onCompositionStart={() => {
                setIsComposing(true);
              }}
              onCompositionEnd={(
                e: React.CompositionEvent<HTMLInputElement>,
              ) => {
                setIsComposing(false);
                const value = e.currentTarget.value;

                if (/^\$?\d*\.?\d{0,18}$/.test(value)) {
                  if (displayMode === 'usd') {
                    if (value === '$') {
                      setsendInputString('');
                      setInputString('');
                      debouncedSetAmount(BigInt(0));
                      setSliderPercent(0);

                      const slider = document.querySelector(
                        '.balance-amount-slider',
                      );
                      const popup = document.querySelector(
                        '.slider-percentage-popup',
                      );
                      if (slider && popup) {
                        (popup as HTMLElement).style.left = `${15 / 2}px`;
                      }
                    } else {
                      const numericValue = value.replace(/^\$/, '');
                      setsendInputString(`$${numericValue}`);

                      const tokenBigInt = calculateTokenAmount(
                        numericValue,
                        tradesByMarket[
                        getMarket(
                          activeMarket.path.at(0),
                          activeMarket.path.at(1),
                        ).baseAsset +
                        getMarket(
                          activeMarket.path.at(0),
                          activeMarket.path.at(1),
                        ).quoteAsset
                        ],
                        tokenIn,
                        getMarket(
                          activeMarket.path.at(0),
                          activeMarket.path.at(1),
                        ),
                      );

                      setInputString(
                        customRound(
                          Number(tokenBigInt) /
                          10 ** Number(tokendict[tokenIn].decimals),
                          3,
                        ).toString(),
                      );

                      debouncedSetAmount(tokenBigInt);

                      const percentage = !tokenBalances[tokenIn]
                        ? 0
                        : Math.min(
                          100,
                          Math.floor(
                            Number(
                              (tokenBigInt * BigInt(100)) /
                              tokenBalances[tokenIn],
                            ),
                          ),
                        );
                      setSliderPercent(percentage);

                      const slider = document.querySelector(
                        '.balance-amount-slider',
                      );
                      const popup = document.querySelector(
                        '.slider-percentage-popup',
                      );
                      if (slider && popup) {
                        const rect = slider.getBoundingClientRect();
                        (popup as HTMLElement).style.left = `${(rect.width - 15) * (percentage / 100) + 15 / 2
                          }px`;
                      }
                    }
                  } else {
                    setInputString(value);

                    const tokenBigInt = BigInt(
                      Math.round(
                        (parseFloat(value || '0') || 0) *
                        10 ** Number(tokendict[tokenIn].decimals),
                      ),
                    );
                    debouncedSetAmount(tokenBigInt);

                    const usd = calculateUSDValue(
                      tokenBigInt,
                      tradesByMarket[
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ).baseAsset +
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ).quoteAsset
                      ],
                      tokenIn,
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ),
                    ).toFixed(2);
                    setsendInputString(`$${usd}`);

                    const percentage = !tokenBalances[tokenIn]
                      ? 0
                      : Math.min(
                        100,
                        Math.floor(
                          Number(
                            (tokenBigInt * BigInt(100)) /
                            tokenBalances[tokenIn],
                          ),
                        ),
                      );
                    setSliderPercent(percentage);

                    const slider = document.querySelector(
                      '.balance-amount-slider',
                    );
                    const popup = document.querySelector(
                      '.slider-percentage-popup',
                    );
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      (popup as HTMLElement).style.left = `${(rect.width - 15) * (percentage / 100) + 15 / 2
                        }px`;
                    }
                  }
                }
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (isComposing) {
                  if (displayMode === 'usd') {
                    setsendInputString(e.target.value);
                  } else {
                    setInputString(e.target.value);
                  }
                  return;
                }

                const value = e.target.value;
                if (/^\$?\d*\.?\d{0,18}$/.test(value)) {
                  if (displayMode === 'usd') {
                    if (value === '$') {
                      setsendInputString('');
                      setInputString('');
                      debouncedSetAmount(BigInt(0));
                      setSliderPercent(0);

                      const slider = document.querySelector(
                        '.balance-amount-slider',
                      );
                      const popup = document.querySelector(
                        '.slider-percentage-popup',
                      );
                      if (slider && popup) {
                        (popup as HTMLElement).style.left = `${15 / 2}px`;
                      }
                    } else {
                      const numericValue = value.replace(/^\$/, '');
                      setsendInputString(`$${numericValue}`);

                      const tokenBigInt = calculateTokenAmount(
                        numericValue,
                        tradesByMarket[
                        getMarket(
                          activeMarket.path.at(0),
                          activeMarket.path.at(1),
                        ).baseAsset +
                        getMarket(
                          activeMarket.path.at(0),
                          activeMarket.path.at(1),
                        ).quoteAsset
                        ],
                        tokenIn,
                        getMarket(
                          activeMarket.path.at(0),
                          activeMarket.path.at(1),
                        ),
                      );

                      setInputString(
                        customRound(
                          Number(tokenBigInt) /
                          10 ** Number(tokendict[tokenIn].decimals),
                          3,
                        ).toString(),
                      );
                      debouncedSetAmount(tokenBigInt);

                      const percentage = !tokenBalances[tokenIn]
                        ? 0
                        : Math.min(
                          100,
                          Math.floor(
                            Number(
                              (tokenBigInt * BigInt(100)) /
                              tokenBalances[tokenIn],
                            ),
                          ),
                        );
                      setSliderPercent(percentage);

                      const slider = document.querySelector(
                        '.balance-amount-slider',
                      );
                      const popup = document.querySelector(
                        '.slider-percentage-popup',
                      );
                      if (slider && popup) {
                        const rect = slider.getBoundingClientRect();
                        (popup as HTMLElement).style.left = `${(rect.width - 15) * (percentage / 100) + 15 / 2
                          }px`;
                      }
                    }
                  } else {
                    setInputString(value);
                    const tokenBigInt = BigInt(
                      Math.round(
                        (parseFloat(value || '0') || 0) *
                        10 ** Number(tokendict[tokenIn].decimals),
                      ),
                    );
                    debouncedSetAmount(tokenBigInt);

                    const usd = calculateUSDValue(
                      tokenBigInt,
                      tradesByMarket[
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ).baseAsset +
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ).quoteAsset
                      ],
                      tokenIn,
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ),
                    ).toFixed(2);
                    setsendInputString(`$${usd}`);

                    const percentage = !tokenBalances[tokenIn]
                      ? 0
                      : Math.min(
                        100,
                        Math.floor(
                          Number(
                            (tokenBigInt * BigInt(100)) /
                            tokenBalances[tokenIn],
                          ),
                        ),
                      );
                    setSliderPercent(percentage);

                    const slider = document.querySelector(
                      '.balance-amount-slider',
                    );
                    const popup = document.querySelector(
                      '.slider-percentage-popup',
                    );
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      (popup as HTMLElement).style.left = `${(rect.width - 15) * (percentage / 100) + 15 / 2
                        }px`;
                    }
                  }
                }
              }}
              placeholder={displayMode === 'usd' ? '$0.00' : '0.00'}
              value={displayMode === 'usd' ? sendInputString : inputString}
              autoFocus={!(windowWidth <= 1020)}
            />
          </div>
          <div className="send-balance-wrapper">
            <div className="send-balance-max-container">
              <div className="send-balance1">
                <img src={walleticon} className="send-balance-wallet-icon" />{' '}
                {formatDisplayValue(
                  tokenBalances[tokenIn],
                  Number(tokendict[tokenIn].decimals),
                )}
              </div>
              <div
                className="send-max-button"
                onClick={() => {
                  if (tokenBalances[tokenIn] != BigInt(0)) {
                    let amount =
                      tokenIn == eth
                        ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount >
                          BigInt(0)
                          ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount
                          : BigInt(0)
                        : tokenBalances[tokenIn];
                    setamountIn(BigInt(amount));
                    setInputString(
                      customRound(
                        Number(amount) /
                        10 ** Number(tokendict[tokenIn].decimals),
                        3,
                      ).toString(),
                    );
                    setsendInputString(
                      `$${calculateUSDValue(
                        amount,
                        tradesByMarket[
                        getMarket(
                          activeMarket.path.at(0),
                          activeMarket.path.at(1),
                        ).baseAsset +
                        getMarket(
                          activeMarket.path.at(0),
                          activeMarket.path.at(1),
                        ).quoteAsset
                        ],
                        tokenIn,
                        getMarket(
                          activeMarket.path.at(0),
                          activeMarket.path.at(1),
                        ),
                      ).toFixed(2)}`,
                    );
                    setSliderPercent(100);
                    const slider = document.querySelector(
                      '.balance-amount-slider',
                    );
                    const popup = document.querySelector(
                      '.slider-percentage-popup',
                    );
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      const trackWidth = rect.width - 15;
                      const thumbPosition = trackWidth + 15 / 2;
                      (popup as HTMLElement).style.left = `${thumbPosition}px`;
                    }
                  }
                }}
              >
                {t('max')}
              </div>
            </div>
            <div
              className="send-usd-switch-wrapper"
              onClick={() => {
                if (displayMode === 'usd') {
                  setDisplayMode('token');
                  if (parseFloat(sendInputString.replace(/^\$|,/g, '')) == 0) {
                    setInputString('');
                  }
                } else {
                  setDisplayMode('usd');
                  if (parseFloat(inputString) == 0) {
                    setsendInputString('');
                  }
                }
              }}
            >
              <div className="send-usd-value">
                {displayMode === 'usd'
                  ? `${customRound(
                    Number(amountIn) /
                    10 ** Number(tokendict[tokenIn].decimals),
                    3,
                  )} ${tokendict[tokenIn].ticker}`
                  : amountIn === BigInt(0)
                    ? '$0.00'
                    : Math.round(
                      (parseFloat(inputString || '0') || 0) *
                      10 ** Number(tokendict[tokenIn].decimals),
                    ) == 0
                      ? '$0.00'
                      : formatUSDDisplay(
                        calculateUSDValue(
                          BigInt(
                            Math.round(
                              (parseFloat(inputString || '0') || 0) *
                              10 ** Number(tokendict[tokenIn].decimals),
                            ),
                          ),
                          tradesByMarket[
                          getMarket(
                            activeMarket.path.at(0),
                            activeMarket.path.at(1),
                          ).baseAsset +
                          getMarket(
                            activeMarket.path.at(0),
                            activeMarket.path.at(1),
                          ).quoteAsset
                          ],
                          tokenIn,
                          getMarket(
                            activeMarket.path.at(0),
                            activeMarket.path.at(1),
                          ),
                        ),
                      )}
              </div>
              <img src={sendSwitch} className="send-arrow" />
            </div>
          </div>
        </div>
        <div className="swap-container-divider" />

        <div className="sendaddressbg">
          <div className="send-To">{t('to')}</div>
          <div className="send-address-input-container">
            <input
              className="send-output"
              onChange={(e) => {
                if (e.target.value === '' || /^(0x[0-9a-fA-F]{0,40}|0)$/.test(e.target.value)) {
                  setrecipient(e.target.value);
                }
              }}
              value={recipient}
              placeholder={t('enterWalletAddress')}
            />
            <button
              className="address-paste-button"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (/^(0x[0-9a-fA-F]{40})$/.test(text)) {
                    setrecipient(text);
                  }
                } catch (err) {
                  console.error('Failed to read clipboard: ', err);
                }
              }}
              title={t('pasteAddress')}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
            </button>
          </div>
        </div>
        <button
          className={`send-swap-button ${isSendingUserOperation ? 'signing' : ''}`}
          onClick={async () => {
            if (
              connected &&
              userchain === activechain
            ) {
              try {
                if (tokenIn == eth) {
                  const hash = await sendeth(
                    sendUserOperationAsync,
                    recipient as `0x${string}`,
                    amountIn,
                  );
                  newTxPopup(
                    (client ? hash.hash : await waitForTransactionReceipt(config, { hash: hash.hash })).transactionHash,
                    'send',
                    eth,
                    '',
                    customRound(
                      Number(amountIn) / 10 ** Number(tokendict[eth].decimals),
                      3,
                    ),
                    0,
                    '',
                    recipient,
                  );
                } else {
                  const hash = await sendtokens(
                    sendUserOperationAsync,
                    tokenIn as `0x${string}`,
                    recipient as `0x${string}`,
                    amountIn,
                  );
                  newTxPopup(
                    (client ? hash.hash : await waitForTransactionReceipt(config, { hash: hash.hash })).transactionHash,
                    'send',
                    tokenIn,
                    '',
                    customRound(
                      Number(amountIn) /
                      10 ** Number(tokendict[tokenIn].decimals),
                      3,
                    ),
                    0,
                    '',
                    recipient,
                  );
                }
                setInputString('');
                setsendInputString('');
                setamountIn(BigInt(0));
                setSliderPercent(0);
                setSendButton(0);
                setSendButtonDisabled(true);
                const slider = document.querySelector('.balance-amount-slider');
                const popup = document.querySelector(
                  '.slider-percentage-popup',
                );
                if (slider && popup) {
                  (popup as HTMLElement).style.left = `${15 / 2}px`;
                }
              } catch (error) {
              } finally {
                setTimeout(() => refetch(), 500)
              }
            } else {
              !connected
                ? setpopup(4)
                : handleSetChain()
            }
          }}
          disabled={sendButtonDisabled || isSendingUserOperation}
        >
          {isSendingUserOperation ? (
            <div className="button-content">
              <div className="loading-spinner" />
              {t('signTransaction')}
            </div>
          ) : !connected ? (
            t('connectWallet')
          ) : sendButton == 0 ? (
            t('enterAmount')
          ) : sendButton == 1 ? (
            t('enterWalletAddress')
          ) : sendButton == 2 ? (
            t('send')
          ) : sendButton == 3 ? (
            t('insufficient') +
            (tokendict[tokenIn].ticker || '?') +
            ' ' +
            t('bal')
          ) : sendButton == 4 ? (
            `${t('switchto')} ${t(settings.chainConfig[activechain].name)}`
          ) : (
            t('connectWallet')
          )}
        </button>
      </div>
      <div className="orders-info-rectangle">
        <SimpleOrdersContainer
          orders={orders}
          router={router}
          address={address}
          trades={tradesByMarket}
          refetch={refetch}
          sendUserOperation={sendUserOperation}
          setChain={handleSetChain}
        />
      </div>
    </div>
  );

  // scale ui component
  const scale = (
    <div className="rectangle">
      <div className="navlinkwrapper" data-active={activeTab}>
        <div className="innernavlinkwrapper">
          <Link
            to="/swap"
            className={`navlink ${activeTab === 'swap' ? 'active' : ''}`}
          >
            {t('swap')}
          </Link>
          <Link
            to="/limit"
            className={`navlink ${activeTab === 'limit' ? 'active' : ''}`}
          >
            {t('limit')}
          </Link>
          <span
            ref={(el: HTMLSpanElement | null) => {
              sendButtonRef.current = el;
            }}
            className={`navlink ${activeTab != 'swap' && activeTab != 'limit' ? 'active' : ''}`}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              setShowSendDropdown(!showSendDropdown);
            }}
          >
            {t(currentProText)}
            <svg
              className={`dropdown-arrow ${showSendDropdown ? 'open' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>

          {showSendDropdown && (
            <div className="navlink-dropdown" ref={sendDropdownRef}>
              <Link
                to="/send"
                className="dropdown-item"
                onClick={() => {
                  setShowSendDropdown(false);
                  setCurrentProText(t('send'));
                }}
              >
                {t('send')}
              </Link>
              <Link
                to="/scale"
                className="dropdown-item"
                onClick={(e) => {
                  setShowSendDropdown(false);
                  setCurrentProText(t('scale'));
                  if (location.pathname === '/scale') {
                    e.preventDefault();
                  }
                }}
              >
                {t('scale')}
              </Link>
            </div>
          )}
        </div>
        <div className="sliding-tab-indicator" />
      </div>
      <div className="swapmodal">
        <div
          className={`inputbg ${connected &&
            ((amountIn > tokenBalances[tokenIn] &&
              !isLoading &&
              !stateIsLoading) ||
              (amountIn != BigInt(0) &&
                (tokenIn == activeMarket.quoteAddress
                  ? amountIn < activeMarket.minSize
                  : (amountIn * limitPrice) / activeMarket.scaleFactor <
                  activeMarket.minSize)))
            ? 'exceed-balance'
            : ''
            }`}
        >
          <div className="Pay">{t('pay')}</div>
          <div className="inputbutton1container">
            <input
              inputMode="decimal"
              className={`input ${connected &&
                  ((amountIn > tokenBalances[tokenIn] &&
                    !isLoading &&
                    !stateIsLoading) ||
                    (amountIn !== BigInt(0) &&
                      (tokenIn === activeMarket.quoteAddress
                        ? amountIn < activeMarket.minSize
                        : (amountIn * limitPrice) / activeMarket.scaleFactor <
                        activeMarket.minSize)))
                  ? 'exceed-balance'
                  : ''
                }`}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (isComposing) {
                  setInputString(e.target.value);
                  return;
                }

                if (/^\d*\.?\d{0,18}$/.test(e.target.value)) {
                  setInputString(e.currentTarget.value);
                  const inputValue = BigInt(
                    Math.round(
                      (parseFloat(e.currentTarget.value || '0') || 0) *
                      10 ** Number(tokendict[tokenIn].decimals),
                    ),
                  );
                  if (scaleStart && scaleEnd && scaleOrders && scaleSkew) {
                    setScaleOutput(Number(inputValue), Number(scaleStart), Number(scaleEnd), Number(scaleOrders), Number(scaleSkew))
                  }

                  debouncedSetAmount(inputValue);

                  const percentage = !tokenBalances[tokenIn]
                    ? 0
                    : Math.min(
                      100,
                      Math.floor(
                        Number(
                          (inputValue * BigInt(100)) / tokenBalances[tokenIn],
                        ),
                      ),
                    );
                  setSliderPercent(percentage);

                  const slider = document.querySelector(
                    '.balance-amount-slider',
                  );
                  const popup = document.querySelector(
                    '.slider-percentage-popup',
                  );
                  if (slider && popup) {
                    const rect = slider.getBoundingClientRect();
                    (popup as HTMLElement).style.left =
                      `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
                  }
                }
              }}
              placeholder="0.00"
              value={inputString}
              autoFocus={!(windowWidth <= 1020)}
            />
            <button
              className={`button1 ${connected &&
                ((amountIn > tokenBalances[tokenIn] &&
                  !isLoading &&
                  !stateIsLoading) ||
                  (amountIn != BigInt(0) &&
                    (tokenIn == activeMarket.quoteAddress
                      ? amountIn < activeMarket.minSize
                      : (amountIn * limitPrice) / activeMarket.scaleFactor <
                      activeMarket.minSize)))
                ? 'exceed-balance'
                : ''
                }`}
              onClick={() => {
                setpopup(1);
              }}
            >
              <img className="button1pic" src={tokendict[tokenIn].image} />
              <span>{tokendict[tokenIn].ticker || '?'}</span>
              <svg
                className="button-arrow"
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
          </div>
          <div className="balance1maxcontainer">
            <span className="usd-value">
              {Math.round(
                (parseFloat(inputString || '0') || 0) *
                10 ** Number(tokendict[tokenIn].decimals),
              ) == 0
                ? '$0.00'
                : formatUSDDisplay(
                  calculateUSDValue(
                    BigInt(
                      Math.round(
                        (parseFloat(inputString || '0') || 0) *
                        10 ** Number(tokendict[tokenIn].decimals),
                      ),
                    ),
                    tradesByMarket[
                    getMarket(
                      activeMarket.path.at(0),
                      activeMarket.path.at(1),
                    ).baseAsset +
                    getMarket(
                      activeMarket.path.at(0),
                      activeMarket.path.at(1),
                    ).quoteAsset
                    ],
                    tokenIn,
                    getMarket(
                      activeMarket.path.at(0),
                      activeMarket.path.at(1),
                    ),
                  ),
                )}
            </span>
            <div className="balance1">
              <img src={walleticon} className="balance-wallet-icon" />{' '}
              {formatDisplayValue(
                tokenBalances[tokenIn],
                Number(tokendict[tokenIn].decimals),
              )}
            </div>
            <div
              className="max-button"
              onClick={() => {
                if (tokenBalances[tokenIn] != BigInt(0)) {
                  let amount =
                    tokenIn == eth
                      ? tokenBalances[tokenIn] -
                        settings.chainConfig[activechain].gasamount >
                        BigInt(0)
                        ? tokenBalances[tokenIn] -
                        settings.chainConfig[activechain].gasamount
                        : BigInt(0)
                      : tokenBalances[tokenIn];
                  debouncedSetAmount(BigInt(amount));
                  setInputString(
                    customRound(
                      Number(amount) /
                      10 ** Number(tokendict[tokenIn].decimals),
                      3,
                    ).toString(),
                  );
                  if (scaleStart && scaleEnd && scaleOrders && scaleSkew) {
                    setScaleOutput(Number(amount), Number(scaleStart), Number(scaleEnd), Number(scaleOrders), Number(scaleSkew))
                  }
                  setSliderPercent(100);
                  const slider = document.querySelector(
                    '.balance-amount-slider',
                  );
                  const popup = document.querySelector(
                    '.slider-percentage-popup',
                  );
                  if (slider && popup) {
                    const rect = slider.getBoundingClientRect();
                    const trackWidth = rect.width - 15;
                    const thumbPosition = trackWidth + 15 / 2;
                    (popup as HTMLElement).style.left = `${thumbPosition}px`;
                  }
                }
              }}
            >
              {t('max')}{' '}
            </div>
          </div>
        </div>
        <div
          className="switch-button"
          onClick={() => {
            setTokenIn(tokenOut);
            setTokenOut(tokenIn);
            if (amountIn != BigInt(0) && scaleStart && scaleEnd && scaleOrders && scaleSkew) {
              setInputString(scaleOutputString);
              setScaleOutputString(inputString);
              setamountIn(amountOutScale);
              setAmountOutScale(amountIn);
              const percentage = !tokenBalances[tokenOut]
                ? 0
                : Math.min(
                  100,
                  Math.floor(
                    Number(
                      (amountOutScale * BigInt(100)) /
                      tokenBalances[tokenOut],
                    ),
                  ),
                );
              setSliderPercent(percentage);
              const slider = document.querySelector('.balance-amount-slider');
              const popup = document.querySelector('.slider-percentage-popup');
              if (slider && popup) {
                const rect = slider.getBoundingClientRect();
                (popup as HTMLElement).style.left =
                  `${(rect.width - 15) * (percentage / 100) + 15 / 2}px`;
              }
            }
            else {
              setamountIn(BigInt(0))
              setInputString('')
            }
          }}
        >
          <img src={tradearrow} className="switch-arrow" />
        </div>
        <div className="swap-container-divider" />
        <div className="outputbg">
          <div className="Recieve">{t('receive')}</div>
          <div className="outputbutton2container">
            <>
              <input
                inputMode="decimal"
                className="output"
                value={scaleOutputString}
                placeholder="0.00"
                disabled={true}
                style={{ cursor: 'not-allowed' }}
              />
              <button
                className="button2"
                onClick={() => {
                  setpopup(2);
                }}
              >
                <img className="button2pic" src={tokendict[tokenOut].image} />
                <span>{tokendict[tokenOut].ticker || '?'}</span>
                <svg
                  className="button-arrow"
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
            </>
          </div>
          <div className="balance1maxcontainer">
            <div className="output-usd-value">
              {amountOutScale === BigInt(0)
                ? '$0.00'
                : (() => {
                  const outputUSD = calculateUSDValue(
                    amountOutScale,
                    tradesByMarket[
                    getMarket(
                      activeMarket.path.at(-2),
                      activeMarket.path.at(-1),
                    ).baseAsset +
                    getMarket(
                      activeMarket.path.at(-2),
                      activeMarket.path.at(-1),
                    ).quoteAsset
                    ],
                    tokenOut,
                    getMarket(
                      activeMarket.path.at(-2),
                      activeMarket.path.at(-1),
                    ),
                  );

                  const inputUSD = calculateUSDValue(
                    BigInt(
                      Math.round(
                        (parseFloat(inputString || '0') || 0) *
                        10 ** Number(tokendict[tokenIn].decimals),
                      ),
                    ),
                    tradesByMarket[
                    getMarket(
                      activeMarket.path.at(0),
                      activeMarket.path.at(1),
                    ).baseAsset +
                    getMarket(
                      activeMarket.path.at(0),
                      activeMarket.path.at(1),
                    ).quoteAsset
                    ],
                    tokenIn,
                    getMarket(
                      activeMarket.path.at(0),
                      activeMarket.path.at(1),
                    ),
                  );

                  const percentageDiff =
                    inputUSD > 0
                      ? ((outputUSD - inputUSD) / inputUSD) * 100
                      : 0;

                  return (
                    <div className="output-usd-container">
                      <span>{formatUSDDisplay(outputUSD)}</span>
                      {inputUSD > 0 && (
                        <span
                          className={`output-percentage ${percentageDiff >= 0 ? 'positive' : 'negative'}`}
                        >
                          ({percentageDiff >= 0 ? '+' : ''}
                          {percentageDiff.toFixed(2)}%)
                        </span>
                      )}
                    </div>
                  );
                })()}
            </div>
            <div className="balance2">
              <img src={walleticon} className="balance-wallet-icon" />{' '}
              {formatDisplayValue(
                tokenBalances[tokenOut],
                Number(tokendict[tokenOut].decimals),
              )}
            </div>
          </div>
        </div>
        <div className="scale-start-end-container">
          <div
            className={`scalebgtop ${connected &&
              !(
                amountIn > tokenBalances[tokenIn] &&
                !isLoading &&
                !stateIsLoading
              ) &&
              amountIn != BigInt(0) &&
              ((scaleStart >= lowestAsk &&
                tokenIn == activeMarket.quoteAddress) ||
                (scaleStart <= highestBid &&
                  tokenIn == activeMarket.baseAddress)) &&
              !(tokenIn == activeMarket.quoteAddress
                ? amountIn < activeMarket.minSize
                : (amountIn * scaleStart) / activeMarket.scaleFactor <
                activeMarket.minSize)
              ? 'exceed-balance'
              : ''
              }`}
          >
            <div className="scalepricecontainer">
              <span className="scale-order-start-label">{t('start')}</span>
              <input
                inputMode="decimal"
                className={`scale-input ${connected &&
                  !(
                    amountIn > tokenBalances[tokenIn] &&
                    !isLoading &&
                    !stateIsLoading
                  ) &&
                  amountIn != BigInt(0) &&
                  ((scaleStart >= lowestAsk &&
                    tokenIn == activeMarket.quoteAddress) ||
                    (scaleStart <= highestBid &&
                      tokenIn == activeMarket.baseAddress)) &&
                  !(tokenIn == activeMarket.quoteAddress
                    ? amountIn < activeMarket.minSize
                    : (amountIn * scaleStart) / activeMarket.scaleFactor <
                    activeMarket.minSize)
                  ? 'exceed-balance'
                  : ''
                  }`}
                onChange={(e) => {
                  if (/^\d*\.?\d{0,18}$/.test(e.target.value)) {
                    setScaleStartString(e.target.value);
                    let price = BigInt(
                      Math.round(
                        (parseFloat(e.target.value || '0') || 0) *
                        Number(activeMarket.priceFactor),
                      ),
                    );
                    setScaleStart(price);
                    if (price && scaleEnd && scaleOrders && scaleSkew) {
                      setScaleOutput(Number(amountIn), Number(price), Number(scaleEnd), Number(scaleOrders), Number(scaleSkew))
                    }
                  }
                }}
                placeholder="0.00"
                value={scaleStartString}
              />
            </div>
          </div>
          <div
            className={`scalebgtop ${connected &&
              !(
                amountIn > tokenBalances[tokenIn] &&
                !isLoading &&
                !stateIsLoading
              ) &&
              amountIn != BigInt(0) &&
              ((scaleEnd >= lowestAsk &&
                tokenIn == activeMarket.quoteAddress) ||
                (scaleEnd <= highestBid &&
                  tokenIn == activeMarket.baseAddress)) &&
              !(tokenIn == activeMarket.quoteAddress
                ? amountIn < activeMarket.minSize
                : (amountIn * scaleEnd) / activeMarket.scaleFactor <
                activeMarket.minSize)
              ? 'exceed-balance'
              : ''
              }`}
          >
            <div className="scalepricecontainer">
              <span className="scale-order-end-label">{t('end')}</span>
              <input
                inputMode="decimal"
                className={`scale-input ${connected &&
                  !(
                    amountIn > tokenBalances[tokenIn] &&
                    !isLoading &&
                    !stateIsLoading
                  ) &&
                  amountIn != BigInt(0) &&
                  ((scaleEnd >= lowestAsk &&
                    tokenIn == activeMarket.quoteAddress) ||
                    (scaleEnd <= highestBid &&
                      tokenIn == activeMarket.baseAddress)) &&
                  !(tokenIn == activeMarket.quoteAddress
                    ? amountIn < activeMarket.minSize
                    : (amountIn * scaleEnd) / activeMarket.scaleFactor <
                    activeMarket.minSize)
                  ? 'exceed-balance'
                  : ''
                  }`}
                onChange={(e) => {
                  if (/^\d*\.?\d{0,18}$/.test(e.target.value)) {
                    setScaleEndString(e.target.value);
                    let price = BigInt(
                      Math.round(
                        (parseFloat(e.target.value || '0') || 0) *
                        Number(activeMarket.priceFactor),
                      ),
                    );
                    setScaleEnd(price);
                    if (price && scaleStart && scaleOrders && scaleSkew) {
                      setScaleOutput(Number(amountIn), Number(scaleStart), Number(price), Number(scaleOrders), Number(scaleSkew))
                    }
                  }
                }}
                placeholder="0.00"
                value={scaleEndString}
              />
            </div>
          </div>
        </div>
        <div className="scale-size-skew">
          <div
            className={`scalebottombg ${scaleOrdersString == '1'
              ? 'exceed-balance'
              : ''
              }`}
          >
            <div className="scalebottomcontainer">
              <span className="scale-order-total-label">{t('orders')}</span>
              <input
                inputMode="numeric" pattern="[0-9]*"
                className={`scale-bottom-input ${scaleOrdersString == '1'
                  ? 'exceed-balance'
                  : ''
                  }`}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value) && Number(e.target.value) <= 100) {
                    setScaleOrdersString(e.target.value);
                    let temporders = BigInt(e.target.value == "1" ? 0 : e.target.value)
                    setScaleOrders(temporders)
                    if (temporders && scaleStart && scaleSkew && scaleEnd) {
                      setScaleOutput(Number(amountIn), Number(scaleStart), Number(scaleEnd), Number(temporders), Number(scaleSkew))
                    }
                    else {
                      setScaleOutput(Number(amountIn), Number(scaleStart), Number(scaleEnd), Number(0), Number(scaleSkew))
                    }
                  }
                }}
                placeholder="0"
                value={scaleOrdersString}
              />
            </div>
          </div>
          <div
            className={`scalebottombg`}
          >
            <div className="scalebottomcontainer">
              <span className="scale-order-size-label">{t('skew')}</span>
              <input
                inputMode="decimal"
                className={`scale-bottom-input`}
                onChange={(e) => {
                  if (/^\d*\.?\d{0,2}$/.test(e.target.value) && Number(e.target.value) <= 100) {
                    setScaleSkewString(e.target.value);
                    let skew = Number(e.target.value)
                    setScaleSkew(skew)
                    if (skew && scaleStart && scaleOrders && scaleEnd) {
                      setScaleOutput(Number(amountIn), Number(scaleStart), Number(scaleEnd), Number(scaleOrders), Number(skew))
                    }
                  }
                }}
                placeholder="0.00"
                value={scaleSkewString}
              />
            </div>
          </div>
        </div>
        <div className="balance-slider-wrapper">
          <div className="slider-container">
            <input
              type="range"
              className={`balance-amount-slider ${isDragging ? 'dragging' : ''}`}
              min="0"
              max="100"
              step="1"
              value={sliderPercent}
              onChange={(e) => {
                const percent = parseInt(e.target.value);
                const newAmount =
                  ((tokenIn == eth
                    ? tokenBalances[tokenIn] -
                      settings.chainConfig[activechain].gasamount >
                      BigInt(0)
                      ? tokenBalances[tokenIn] -
                      settings.chainConfig[activechain].gasamount
                      : BigInt(0)
                    : tokenBalances[tokenIn]) *
                    BigInt(percent)) /
                  100n;
                setSliderPercent(percent);
                setInputString(
                  newAmount == BigInt(0)
                    ? ''
                    : customRound(
                      Number(newAmount) /
                      10 ** Number(tokendict[tokenIn].decimals),
                      3,
                    ).toString(),
                );
                debouncedSetAmount(newAmount);

                if (scaleStart && scaleEnd && scaleOrders && scaleSkew) {
                  setScaleOutput(Number(newAmount), Number(scaleStart), Number(scaleEnd), Number(scaleOrders), Number(scaleSkew))
                }
                const slider = e.target;
                const rect = slider.getBoundingClientRect();
                const trackWidth = rect.width - 15;
                const thumbPosition = (percent / 100) * trackWidth + 15 / 2;
                const popup: HTMLElement | null = document.querySelector(
                  '.slider-percentage-popup',
                );
                if (popup) {
                  popup.style.left = `${thumbPosition}px`;
                }
              }}
              onMouseDown={() => {
                setIsDragging(true);
                const popup: HTMLElement | null = document.querySelector(
                  '.slider-percentage-popup',
                );
                if (popup) popup.classList.add('visible');
              }}
              onMouseUp={() => {
                setIsDragging(false);
                const popup: HTMLElement | null = document.querySelector(
                  '.slider-percentage-popup',
                );
                if (popup) popup.classList.remove('visible');
              }}
              style={{
                background: `linear-gradient(to right,rgb(171, 176, 224) ${sliderPercent}%,rgb(21, 21, 25) ${sliderPercent}%)`,
              }}
            />
            <div className="slider-percentage-popup">{sliderPercent}%</div>
            <div className="balance-slider-marks">
              {[0, 25, 50, 75, 100].map((markPercent) => (
                <div
                  key={markPercent}
                  className="balance-slider-mark"
                  data-active={sliderPercent >= markPercent}
                  data-percentage={markPercent}
                  onClick={() => {
                    const newAmount =
                      ((tokenIn == eth
                        ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount >
                          BigInt(0)
                          ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount
                          : BigInt(0)
                        : tokenBalances[tokenIn]) *
                        BigInt(markPercent)) /
                      100n;
                    setSliderPercent(markPercent);
                    setInputString(
                      newAmount == BigInt(0)
                        ? ''
                        : customRound(
                          Number(newAmount) /
                          10 ** Number(tokendict[tokenIn].decimals),
                          3,
                        ).toString(),
                    );
                    debouncedSetAmount(newAmount);
                    if (scaleStart && scaleEnd && scaleOrders && scaleSkew) {
                      setScaleOutput(Number(newAmount), Number(scaleStart), Number(scaleEnd), Number(scaleOrders), Number(scaleSkew))
                    }
                    const slider = document.querySelector(
                      '.balance-amount-slider',
                    );
                    const popup: HTMLElement | null = document.querySelector(
                      '.slider-percentage-popup',
                    );
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      popup.style.left = `${(rect.width - 15) * (markPercent / 100) + 15 / 2
                        }px`;
                    }
                  }}
                >
                  {markPercent}%
                </div>
              ))}
            </div>
          </div>
        </div>
        <button
          className={`limit-swap-button ${isSendingUserOperation ? 'signing' : ''}`}
          onClick={async () => {
            if (
              connected &&
              userchain === activechain
            ) {
              try {
                let o
                o = calculateScaleOutput(Number(amountIn), Number(scaleStart), Number(scaleEnd), Number(scaleOrders), Number(scaleSkew))
                let action: any = [[]];
                let price: any = [[]];
                let param1: any = [[]];
                let param2: any = [[]];
                o.forEach((order) => {
                  action[0].push(tokenIn == activeMarket.quoteAddress ? 1 : 2);
                  price[0].push(order[0]);
                  param1[0].push(tokenIn == activeMarket.quoteAddress ? order[2] : order[1]);
                  param2[0].push(
                    tokenIn == eth ? router : address
                  );
                });
                if (tokenIn == eth) {
                  await multiBatchOrders(
                    sendUserOperationAsync,
                    router,
                    BigInt(amountIn),
                    [activeMarket.address],
                    action,
                    price,
                    param1,
                    param2,
                  );
                } else {
                  if (allowance < amountIn) {
                    const hash = await approve(
                      sendUserOperationAsync,
                      tokenIn as `0x${string}`,
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ).address,
                      maxUint256,
                    );
                    newTxPopup(
                      (client ? hash.hash : await waitForTransactionReceipt(config, { hash: hash.hash })).transactionHash,
                      'approve',
                      tokenIn,
                      '',
                      customRound(
                        Number(amountIn) /
                        10 ** Number(tokendict[tokenIn].decimals),
                        3,
                      ),
                      0,
                      '',
                      getMarket(
                        activeMarket.path.at(0),
                        activeMarket.path.at(1),
                      ).address,
                    );
                  }

                  await multiBatchOrders(
                    sendUserOperationAsync,
                    router,
                    BigInt(0),
                    [activeMarket.address],
                    action,
                    price,
                    param1,
                    param2,
                  );
                }
                setInputString('');
                setamountIn(BigInt(0));
                setSliderPercent(0);
                const slider = document.querySelector('.balance-amount-slider');
                const popup = document.querySelector(
                  '.slider-percentage-popup',
                );
                if (slider && popup) {
                  (popup as HTMLElement).style.left = `${15 / 2}px`;
                }
                setAmountOutScale(BigInt(0));
                setScaleOutputString('');
                setScaleButtonDisabled(true);
                setScaleButton(0);
                setScaleStart(BigInt(0))
                setScaleEnd(BigInt(0))
                setScaleStartString('')
                setScaleEndString('')
                setScaleSkew(1)
                setScaleSkewString('1.00')
                setScaleOrders(BigInt(0))
                setScaleOrdersString('')
              } catch (error) {
              } finally {
                setTimeout(() => refetch(), 500)
              }
            } else {
              !connected
                ? setpopup(4)
                : handleSetChain()
            }
          }}
          disabled={scaleButtonDisabled || isSendingUserOperation}
        >
          {isSendingUserOperation ? (
            <div className="button-content">
              <div className="loading-spinner" />
              {t('signTransaction')}
            </div>
          ) : scaleButton == 0 ? (
            t('enterAmount')
          ) : scaleButton == 1 ? (
            t('enterStartPrice')
          ) : scaleButton == 2 ? (
            t('enterEndPrice')
          ) : scaleButton == 3 ? (
            t('startPriceHigh')
          ) : scaleButton == 4 ? (
            t('startPriceLow')
          ) : scaleButton == 5 ? (
            t('endPriceHigh')
          ) : scaleButton == 6 ? (
            t('endPriceLow')
          ) : scaleButton == 7 ? (
            t('scaleMinSize')
          ) : scaleButton == 8 ? (
            t('enterOrders')
          ) : scaleButton == 9 ? (
            t('enterSkew')
          ) : scaleButton == 10 ? (
            t('insufficient') +
            (tokendict[tokenIn].ticker || '?') +
            ' ' +
            t('bal')
          ) : scaleButton == 11 ? (
            `${t('switchto')} ${t(settings.chainConfig[activechain].name)}`
          ) : scaleButton == 12 ? (
            t('connectWallet')
          ) : scaleButton == 13 ? (
            t('approve')
          ) : t('placeOrder')}
        </button>
      </div>
      <div className="limit-info-rectangle">
        <div className="trade-fee">
          <div className="label-container">
            <TooltipLabel
              label={t('addLiquidityOnly')}
              tooltipText={
                <div>
                  <div className="tooltip-description">
                    {t('addLiquidityOnlySubtitle')}
                  </div>
                </div>
              }
              className="impact-label"
            />
          </div>
          <ToggleSwitch
            checked={true}
            onChange={() => { }}
            disabled={true}
          />
        </div>
        <div className="trade-fee">
          <div className="label-container">
            <TooltipLabel
              label={t('fee')}
              tooltipText={
                <div>
                  <div className="tooltip-description">
                    {t('makerfeeexplanation')}
                  </div>
                </div>
              }
              className="impact-label"
            />
          </div>
          <div className="value-container">
            {`${0} ${tokendict[tokenIn].ticker}`}
          </div>
        </div>
      </div>
      <div className="orders-info-rectangle">
        <SimpleOrdersContainer
          orders={orders}
          router={router}
          address={address}
          trades={tradesByMarket}
          refetch={refetch}
          sendUserOperation={sendUserOperation}
          setChain={handleSetChain}
        />
      </div>
    </div>
  );

  return (
    <div className="app-wrapper" key={language}>
      <NavigationProgress location={location} />
      <FullScreenOverlay isVisible={loading} />
      {Modals}
      {currentUser && !address && (
        <GeneratingAddressPopup isVisible={true} />
      )}
      {isDepositPageVisible && (
        <DepositPage
          address={address}
          onClose={handleCloseDepositPage}
        />
      )}
      {windowWidth <= 1020 &&
        !simpleView &&
        ['swap', 'limit', 'send', 'scale'].includes(activeTab) && (
          <>
            <button
              className="mobile-trade-button"
              onClick={() => {
                if (showTrade && !simpleView) {
                  document.body.style.overflow = 'hidden'
                  document
                    .querySelector('.right-column')
                    ?.classList.add('hide');
                  document
                    .querySelector('.right-column')
                    ?.classList.remove('show');
                  document
                    .querySelector('.trade-mobile-switch')
                    ?.classList.remove('open');
                  setTimeout(() => {
                    setShowTrade(false);
                  }, 300);
                } else {
                  setShowTrade(true);
                  document
                    .querySelector('.trade-mobile-switch')
                    ?.classList.add('open');
                }
              }}
            >
              <img src={mobiletradeswap} className="trade-mobile-switch" />
            </button>
            <div className={`right-column ${showTrade ? 'show' : ''}`}>
              {activeTab == 'swap' ? swap : activeTab == 'limit' ? limit : activeTab == 'send' ? send : scale}
            </div>
          </>
        )}
      {
        <>
          <Header
            setTokenIn={setTokenIn}
            setTokenOut={setTokenOut}
            setorders={setorders}
            settradehistory={settradehistory}
            settradesByMarket={settradesByMarket}
            setcanceledorders={setcanceledorders}
            setpopup={setpopup}
            setChain={handleSetChain}
            account={{
              connected: connected,
              address: address,
              chainId: userchain,
            }}
            activechain={activechain}
            tokenIn={tokenIn}
            setShowTrade={setShowTrade}
            simpleView={simpleView}
            setSimpleView={setSimpleView}
            tokendict={tokendict}
            transactions={transactions}
          />
          <div className="headerfiller"></div>
        </>
      }
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/swap" replace />} />
          <Route path="*" element={<Navigate to="/swap" replace />} />
          <Route
            path="/referrals"
            element={
              <Referrals
                tokenList={Object.values(tokendict)}
                markets={markets}
                router={router}
                address={address ?? undefined}
                usedRefLink={usedRefLink}
                setUsedRefAddress={setUsedRefAddress}
                setUsedRefLink={setUsedRefLink}
                totalClaimableFees={totalClaimableFees}
                claimableFees={claimableFees}
                refLink={refLink}
                setRefLink={setRefLink}
                showModal={showReferralsModal}
                setShowModal={setShowReferralsModal}
                setChain={handleSetChain}
                setpopup={setpopup}
                account={{
                  connected: connected,
                  address: address,
                  chainId: userchain,
                }}
                refetch={refRefetch}
                sendUserOperation={sendUserOperation}
              />
            }
          />
          <Route path="/leaderboard" element={
            <Leaderboard
              totalXP={leaderboardData.totalXP}
              currentXP={leaderboardData.currentXP}
              username={leaderboardData.username}
              userXP={leaderboardData.userXP}
              factions={leaderboardData.factions.map(faction => ({
                ...faction,
                xp: faction.points,
                bonusXP: 0,
                growthPercentage: 0,
                logo: '',
                badgeIcon: ''
              }))}
            />
          }>
          </Route>
          <Route path="/mint"
            element={
              <NFTMintingPage />
            }>
          </Route>
          <Route
            path="/portfolio"
            element={
              <Portfolio
                orders={orders}
                tradehistory={tradehistory}
                trades={tradesByMarket}
                canceledorders={canceledorders}
                tokenList={memoizedTokenList}
                router={router}
                address={address ?? ''}
                isBlurred={isBlurred}
                setIsBlurred={setIsBlurred}
                setTokenIn={setTokenIn}
                setTokenOut={setTokenOut}
                setSendTokenIn={setSendTokenIn}
                setpopup={setpopup}
                tokenBalances={tokenBalances}
                totalAccountValue={totalAccountValue}
                setTotalVolume={setTotalVolume}
                totalVolume={totalVolume}
                chartData={totalAccountValue ? [
                  ...chartData.slice(0, -1),
                  {
                    ...chartData[chartData.length - 1],
                    value: totalAccountValue,
                  },
                ] : chartData}
                portChartLoading={portChartLoading}
                chartDays={chartDays}
                setChartDays={setChartDays}
                totalClaimableFees={totalClaimableFees}
                refLink={refLink}
                setShowRefModal={setShowReferralsModal}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                filter={filter}
                setFilter={setFilter}
                onlyThisMarket={onlyThisMarket}
                setOnlyThisMarket={setOnlyThisMarket}
                account={{
                  connected: connected,
                  address: address,
                  chainId: userchain,
                  logout: logout,
                }}
                refetch={refetch}
                sendUserOperation={sendUserOperation}
                setChain={handleSetChain}
              />
            }
          />
          <Route
            path="/swap"
            element={
              <div className="trade-container">
                {windowWidth <= 1020 && (
                  <div className="mobile-nav" data-active={mobileView}>
                    <div className="mobile-nav-inner">
                      <button
                        className={`mobile-nav-link ${mobileView === 'chart' ? 'active' : ''}`}
                        onClick={() => setMobileView('chart')}
                      >
                        {t('chart')}
                      </button>
                      <button
                        className={`mobile-nav-link ${mobileView === 'orderbook' ? 'active' : ''}`}
                        onClick={() => {
                          setMobileView('orderbook');
                          setOBTab('orderbook');
                        }}
                      >
                        {t('orderbook')}
                      </button>
                      <button
                        className={`mobile-nav-link ${mobileView === 'trades' ? 'active' : ''}`}
                        onClick={() => {
                          setMobileView('trades');
                          setOBTab('trades');
                        }}
                      >
                        {t('trades')}
                      </button>
                      <div className="mobile-sliding-indicator" />
                    </div>
                  </div>
                )}
                <div
                  className={`main-content-wrapper ${simpleView ? 'simple-view' : ''}`}
                  style={{
                    flexDirection:
                      layoutSettings === 'alternative' ? 'row-reverse' : 'row',
                  }}
                >
                  {simpleView ? (
                    <>
                      <div className="right-column">{swap}</div>
                    </>
                  ) : (
                    <>
                      <div className="chartandorderbookandordercenter">
                        <div className="chartandorderbook">
                          {windowWidth <= 1020 ? (
                            <div className="trade-mobile-view-container">
                              {mobileView === 'chart' && (
                                <ChartComponent
                                  onMarketSelect={onMarketSelect}
                                  tokendict={tokendict}
                                  trades={tradesByMarket[activeMarketKey]}
                                  universalTrades={tradesByMarket}
                                  activeMarket={activeMarket}
                                  orderdata={{
                                    liquidityBuyOrders,
                                    liquiditySellOrders,
                                    spreadData,
                                    priceFactor,
                                    symbolIn,
                                    symbolOut,
                                  }}
                                  userWalletAddress={
                                    connected
                                      ? address
                                      : undefined
                                  }
                                  setpopup={setpopup}
                                  tradesloading={tradesloading}
                                  dayKlines={dayKlines}
                                />
                              )}
                              {(mobileView === 'orderbook' ||
                                mobileView === 'trades') && (
                                  <OrderBook
                                    trades={trades}
                                    orderdata={{
                                      roundedBuyOrders,
                                      roundedSellOrders,
                                      spreadData,
                                      priceFactor,
                                      symbolIn,
                                      symbolOut,
                                    }}
                                    activemarket={activeMarket}
                                    layoutSettings={layoutSettings}
                                    orderbookPosition={orderbookPosition}
                                    hideHeader={true}
                                    interval={baseInterval}
                                    amountsQuote={amountsQuote}
                                    setAmountsQuote={setAmountsQuote}
                                    obInterval={obInterval}
                                    setOBInterval={setOBInterval}
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                    activeTab={obTab}
                                    setActiveTab={setOBTab}
                                    updateLimitAmount={updateLimitAmount}
                                  />
                                )}
                            </div>
                          ) : (
                            <ChartOrderbookPanel
                              onMarketSelect={onMarketSelect}
                              tokendict={tokendict}
                              universalTrades={tradesByMarket}
                              userWalletAddress={
                                connected
                                  ? address
                                  : undefined
                              }
                              layoutSettings={layoutSettings}
                              orderbookPosition={orderbookPosition}
                              trades={tradesByMarket[activeMarketKey]}
                              orderdata={{
                                roundedBuyOrders,
                                roundedSellOrders,
                                spreadData,
                                priceFactor,
                                symbolIn,
                                symbolOut,
                                liquidityBuyOrders,
                                liquiditySellOrders,
                              }}
                              activeMarket={activeMarket}
                              isOrderbookVisible={isOrderbookVisible}
                              orderbookWidth={orderbookWidth}
                              setOrderbookWidth={handleSetOrderbookWidth}
                              obInterval={obInterval}
                              amountsQuote={amountsQuote}
                              setAmountsQuote={setAmountsQuote}
                              obtrades={trades}
                              setOBInterval={setOBInterval}
                              baseInterval={baseInterval}
                              viewMode={viewMode}
                              setViewMode={setViewMode}
                              activeTab={obTab}
                              setActiveTab={setOBTab}
                              setpopup={setpopup}
                              updateLimitAmount={updateLimitAmount}
                              tradesloading={tradesloading}
                              orders={orders}
                              dayKlines={dayKlines}
                            />
                          )}
                        </div>

                        <div
                          className={`oc-spacer ${!isOrderCenterVisible ? 'collapsed' : ''}`}
                        >
                          <div
                            className="ordercenter-drag-handle"
                            onMouseDown={handleVertMouseDown}
                            style={{
                              position: 'relative',
                              width: '100%',
                              cursor: 'row-resize',
                            }}
                          />
                        </div>

                        <div
                          className="app-ordercenter-wrapper"
                          style={{
                            height: `${isOrderCenterVisible ? `${orderCenterHeight}px` : '0px'}`,
                            transition: isVertDragging
                              ? 'none'
                              : 'height 0.1s ease',
                          }}
                        >
                          <OrderCenter
                            orders={orders}
                            tradehistory={tradehistory}
                            canceledorders={canceledorders}
                            router={router}
                            address={address}
                            trades={tradesByMarket}
                            currentMarket={
                              activeMarketKey ==
                                settings.chainConfig[activechain].wethticker +
                                'USDC'
                                ? settings.chainConfig[activechain].ethticker +
                                'USDC'
                                : activeMarketKey
                            }
                            orderCenterHeight={orderCenterHeight}
                            hideBalances={true}
                            tokenList={memoizedTokenList}
                            setTokenIn={setTokenIn}
                            setTokenOut={setTokenOut}
                            setSendTokenIn={setSendTokenIn}
                            setpopup={setpopup}
                            sortConfig={{ column: 'name', direction: 'asc' }}
                            onSort={emptyFunction}
                            tokenBalances={tokenBalances}
                            activeSection={activeSection}
                            setActiveSection={setActiveSection}
                            filter={filter}
                            setFilter={setFilter}
                            onlyThisMarket={onlyThisMarket}
                            setOnlyThisMarket={setOnlyThisMarket}
                            refetch={refetch}
                            sendUserOperation={sendUserOperation}
                            setChain={handleSetChain}
                          />
                        </div>
                      </div>
                      {windowWidth > 1020 && (
                        <div className="right-column"> {swap} </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            }
          />
          <Route
            path="/limit"
            element={
              <div className="trade-container">
                {windowWidth <= 1020 && (
                  <div className="mobile-nav" data-active={mobileView}>
                    <div className="mobile-nav-inner">
                      <button
                        className={`mobile-nav-link ${mobileView === 'chart' ? 'active' : ''}`}
                        onClick={() => setMobileView('chart')}
                      >
                        {t('chart')}
                      </button>
                      <button
                        className={`mobile-nav-link ${mobileView === 'orderbook' ? 'active' : ''}`}
                        onClick={() => {
                          setMobileView('orderbook');
                          setOBTab('orderbook');
                        }}
                      >
                        {t('orderbook')}
                      </button>
                      <button
                        className={`mobile-nav-link ${mobileView === 'trades' ? 'active' : ''}`}
                        onClick={() => {
                          setMobileView('trades');
                          setOBTab('trades');
                        }}
                      >
                        {t('trades')}
                      </button>
                      <div className="mobile-sliding-indicator" />
                    </div>
                  </div>
                )}
                <div
                  className={`main-content-wrapper ${simpleView ? 'simple-view' : ''}`}
                  style={{
                    flexDirection:
                      layoutSettings === 'alternative' ? 'row-reverse' : 'row',
                  }}
                >
                  {simpleView ? (
                    <>
                      <div className="right-column">{limit}</div>
                    </>
                  ) : (
                    <>
                      <div className="chartandorderbookandordercenter">
                        <div className="chartandorderbook">
                          {windowWidth <= 1020 ? (
                            <div className="trade-mobile-view-container">
                              {mobileView === 'chart' && (
                                <ChartComponent
                                  onMarketSelect={onMarketSelect}
                                  tokendict={tokendict}
                                  trades={tradesByMarket[activeMarketKey]}
                                  universalTrades={tradesByMarket}
                                  activeMarket={activeMarket}
                                  orderdata={{
                                    liquidityBuyOrders,
                                    liquiditySellOrders,
                                    spreadData,
                                    priceFactor,
                                    symbolIn,
                                    symbolOut,
                                  }}
                                  userWalletAddress={
                                    connected
                                      ? address
                                      : undefined
                                  }
                                  setpopup={setpopup}
                                  tradesloading={tradesloading}
                                  dayKlines={dayKlines}
                                />
                              )}
                              {(mobileView === 'orderbook' ||
                                mobileView === 'trades') && (
                                  <OrderBook
                                    trades={trades}
                                    orderdata={{
                                      roundedBuyOrders,
                                      roundedSellOrders,
                                      spreadData,
                                      priceFactor,
                                      symbolIn,
                                      symbolOut,
                                    }}
                                    activemarket={activeMarket}
                                    layoutSettings={layoutSettings}
                                    orderbookPosition={orderbookPosition}
                                    hideHeader={true}
                                    interval={baseInterval}
                                    amountsQuote={amountsQuote}
                                    setAmountsQuote={setAmountsQuote}
                                    obInterval={obInterval}
                                    setOBInterval={setOBInterval}
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                    activeTab={obTab}
                                    setActiveTab={setOBTab}
                                    updateLimitAmount={updateLimitAmount}
                                  />
                                )}
                            </div>
                          ) : (
                            <ChartOrderbookPanel
                              onMarketSelect={onMarketSelect}
                              tokendict={tokendict}
                              universalTrades={tradesByMarket}
                              userWalletAddress={
                                connected
                                  ? address
                                  : undefined
                              }
                              layoutSettings={layoutSettings}
                              orderbookPosition={orderbookPosition}
                              trades={tradesByMarket[activeMarketKey]}
                              orderdata={{
                                roundedBuyOrders,
                                roundedSellOrders,
                                spreadData,
                                priceFactor,
                                symbolIn,
                                symbolOut,
                                liquidityBuyOrders,
                                liquiditySellOrders,
                              }}
                              activeMarket={activeMarket}
                              isOrderbookVisible={isOrderbookVisible}
                              orderbookWidth={orderbookWidth}
                              setOrderbookWidth={handleSetOrderbookWidth}
                              obInterval={obInterval}
                              amountsQuote={amountsQuote}
                              setAmountsQuote={setAmountsQuote}
                              obtrades={trades}
                              setOBInterval={setOBInterval}
                              baseInterval={baseInterval}
                              viewMode={viewMode}
                              setViewMode={setViewMode}
                              activeTab={obTab}
                              setActiveTab={setOBTab}
                              setpopup={setpopup}
                              updateLimitAmount={updateLimitAmount}
                              tradesloading={tradesloading}
                              orders={orders}
                              dayKlines={dayKlines}
                            />
                          )}
                        </div>

                        <div
                          className={`oc-spacer ${!isOrderCenterVisible ? 'collapsed' : ''}`}
                        >
                          <div
                            className="ordercenter-drag-handle"
                            onMouseDown={handleVertMouseDown}
                            style={{
                              position: 'relative',
                              width: '100%',
                              cursor: 'row-resize',
                            }}
                          />
                        </div>
                        <div
                          className="app-ordercenter-wrapper"
                          style={{
                            height: `${isOrderCenterVisible ? `${orderCenterHeight}px` : '0px'}`,
                            transition: isVertDragging
                              ? 'none'
                              : 'height 0.1s ease',
                          }}
                        >
                          <OrderCenter
                            orders={orders}
                            tradehistory={tradehistory}
                            canceledorders={canceledorders}
                            router={router}
                            address={address}
                            trades={tradesByMarket}
                            currentMarket={
                              activeMarketKey ==
                                settings.chainConfig[activechain].wethticker +
                                'USDC'
                                ? settings.chainConfig[activechain].ethticker +
                                'USDC'
                                : activeMarketKey
                            }
                            orderCenterHeight={orderCenterHeight}
                            hideBalances={true}
                            tokenList={memoizedTokenList}
                            setTokenIn={setTokenIn}
                            setTokenOut={setTokenOut}
                            setSendTokenIn={setSendTokenIn}
                            setpopup={setpopup}
                            sortConfig={{ column: 'name', direction: 'asc' }}
                            onSort={emptyFunction}
                            tokenBalances={tokenBalances}
                            activeSection={activeSection}
                            setActiveSection={setActiveSection}
                            filter={filter}
                            setFilter={setFilter}
                            onlyThisMarket={onlyThisMarket}
                            setOnlyThisMarket={setOnlyThisMarket}
                            refetch={refetch}
                            sendUserOperation={sendUserOperation}
                            setChain={handleSetChain}
                          />
                        </div>
                      </div>
                      {windowWidth > 1020 && (
                        <div className="right-column"> {limit} </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            }
          />
          <Route
            path="/send"
            element={
              <div className="trade-container">
                {windowWidth <= 1020 && (
                  <div className="mobile-nav" data-active={mobileView}>
                    <div className="mobile-nav-inner">
                      <button
                        className={`mobile-nav-link ${mobileView === 'chart' ? 'active' : ''}`}
                        onClick={() => setMobileView('chart')}
                      >
                        {t('chart')}
                      </button>
                      <button
                        className={`mobile-nav-link ${mobileView === 'orderbook' ? 'active' : ''}`}
                        onClick={() => {
                          setMobileView('orderbook');
                          setOBTab('orderbook');
                        }}
                      >
                        {t('orderbook')}
                      </button>
                      <button
                        className={`mobile-nav-link ${mobileView === 'trades' ? 'active' : ''}`}
                        onClick={() => {
                          setMobileView('trades');
                          setOBTab('trades');
                        }}
                      >
                        {t('trades')}
                      </button>
                      <div className="mobile-sliding-indicator" />
                    </div>
                  </div>
                )}
                <div
                  className={`main-content-wrapper ${simpleView ? 'simple-view' : ''}`}
                  style={{
                    flexDirection:
                      layoutSettings === 'alternative' ? 'row-reverse' : 'row',
                  }}
                >
                  {simpleView ? (
                    <>
                      <div className="right-column">{send}</div>
                    </>
                  ) : (
                    <>
                      <div className="chartandorderbookandordercenter">
                        <div className="chartandorderbook">
                          {windowWidth <= 1020 ? (
                            <div className="trade-mobile-view-container">
                              {mobileView === 'chart' && (
                                <ChartComponent
                                  onMarketSelect={onMarketSelect}
                                  tokendict={tokendict}
                                  trades={tradesByMarket[activeMarketKey]}
                                  universalTrades={tradesByMarket}
                                  activeMarket={activeMarket}
                                  orderdata={{
                                    liquidityBuyOrders,
                                    liquiditySellOrders,
                                    spreadData,
                                    priceFactor,
                                    symbolIn,
                                    symbolOut,
                                  }}
                                  userWalletAddress={
                                    connected
                                      ? address
                                      : undefined
                                  }
                                  setpopup={setpopup}
                                  tradesloading={tradesloading}
                                  dayKlines={dayKlines}
                                />
                              )}
                              {(mobileView === 'orderbook' ||
                                mobileView === 'trades') && (
                                  <OrderBook
                                    trades={trades}
                                    orderdata={{
                                      roundedBuyOrders,
                                      roundedSellOrders,
                                      spreadData,
                                      priceFactor,
                                      symbolIn,
                                      symbolOut,
                                    }}
                                    activemarket={activeMarket}
                                    layoutSettings={layoutSettings}
                                    orderbookPosition={orderbookPosition}
                                    hideHeader={true}
                                    interval={baseInterval}
                                    amountsQuote={amountsQuote}
                                    setAmountsQuote={setAmountsQuote}
                                    obInterval={obInterval}
                                    setOBInterval={setOBInterval}
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                    activeTab={obTab}
                                    setActiveTab={setOBTab}
                                    updateLimitAmount={updateLimitAmount}
                                  />
                                )}
                            </div>
                          ) : (
                            <ChartOrderbookPanel
                              onMarketSelect={onMarketSelect}
                              tokendict={tokendict}
                              universalTrades={tradesByMarket}
                              userWalletAddress={
                                connected
                                  ? address
                                  : undefined
                              }
                              layoutSettings={layoutSettings}
                              orderbookPosition={orderbookPosition}
                              trades={tradesByMarket[activeMarketKey]}
                              orderdata={{
                                roundedBuyOrders,
                                roundedSellOrders,
                                spreadData,
                                priceFactor,
                                symbolIn,
                                symbolOut,
                                liquidityBuyOrders,
                                liquiditySellOrders,
                              }}
                              activeMarket={activeMarket}
                              isOrderbookVisible={isOrderbookVisible}
                              orderbookWidth={orderbookWidth}
                              setOrderbookWidth={handleSetOrderbookWidth}
                              obInterval={obInterval}
                              amountsQuote={amountsQuote}
                              setAmountsQuote={setAmountsQuote}
                              obtrades={trades}
                              setOBInterval={setOBInterval}
                              baseInterval={baseInterval}
                              viewMode={viewMode}
                              setViewMode={setViewMode}
                              activeTab={obTab}
                              setActiveTab={setOBTab}
                              setpopup={setpopup}
                              updateLimitAmount={updateLimitAmount}
                              tradesloading={tradesloading}
                              orders={orders}
                              dayKlines={dayKlines}
                            />
                          )}
                        </div>

                        <div
                          className={`oc-spacer ${!isOrderCenterVisible ? 'collapsed' : ''}`}
                        >
                          <div
                            className="ordercenter-drag-handle"
                            onMouseDown={handleVertMouseDown}
                            style={{
                              position: 'relative',
                              width: '100%',
                              cursor: 'row-resize',
                            }}
                          />
                        </div>

                        <div
                          className="app-ordercenter-wrapper"
                          style={{
                            height: `${isOrderCenterVisible ? `${orderCenterHeight}px` : '0px'}`,
                            transition: isVertDragging
                              ? 'none'
                              : 'height 0.1s ease',
                          }}
                        >
                          <OrderCenter
                            orders={orders}
                            tradehistory={tradehistory}
                            canceledorders={canceledorders}
                            router={router}
                            address={address}
                            trades={tradesByMarket}
                            currentMarket={
                              activeMarketKey ==
                                settings.chainConfig[activechain].wethticker +
                                'USDC'
                                ? settings.chainConfig[activechain].ethticker +
                                'USDC'
                                : activeMarketKey
                            }
                            orderCenterHeight={orderCenterHeight}
                            hideBalances={true}
                            tokenList={memoizedTokenList}
                            setTokenIn={setTokenIn}
                            setTokenOut={setTokenOut}
                            setSendTokenIn={setSendTokenIn}
                            setpopup={setpopup}
                            sortConfig={{ column: 'name', direction: 'asc' }}
                            onSort={emptyFunction}
                            tokenBalances={tokenBalances}
                            activeSection={activeSection}
                            setActiveSection={setActiveSection}
                            filter={filter}
                            setFilter={setFilter}
                            onlyThisMarket={onlyThisMarket}
                            setOnlyThisMarket={setOnlyThisMarket}
                            refetch={refetch}
                            sendUserOperation={sendUserOperation}
                            setChain={handleSetChain}
                          />
                        </div>
                      </div>
                      {windowWidth > 1020 && (
                        <div className="right-column"> {send} </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            }
          />
          <Route
            path="/scale"
            element={
              <div className="trade-container">
                {windowWidth <= 1020 && (
                  <div className="mobile-nav" data-active={mobileView}>
                    <div className="mobile-nav-inner">
                      <button
                        className={`mobile-nav-link ${mobileView === 'chart' ? 'active' : ''}`}
                        onClick={() => setMobileView('chart')}
                      >
                        {t('chart')}
                      </button>
                      <button
                        className={`mobile-nav-link ${mobileView === 'orderbook' ? 'active' : ''}`}
                        onClick={() => {
                          setMobileView('orderbook');
                          setOBTab('orderbook');
                        }}
                      >
                        {t('orderbook')}
                      </button>
                      <button
                        className={`mobile-nav-link ${mobileView === 'trades' ? 'active' : ''}`}
                        onClick={() => {
                          setMobileView('trades');
                          setOBTab('trades');
                        }}
                      >
                        {t('trades')}
                      </button>
                      <div className="mobile-sliding-indicator" />
                    </div>
                  </div>
                )}
                <div
                  className={`main-content-wrapper ${simpleView ? 'simple-view' : ''}`}
                  style={{
                    flexDirection:
                      layoutSettings === 'alternative' ? 'row-reverse' : 'row',
                  }}
                >
                  {simpleView ? (
                    <>
                      <div className="right-column">{scale}</div>
                    </>
                  ) : (
                    <>
                      <div className="chartandorderbookandordercenter">
                        <div className="chartandorderbook">
                          {windowWidth <= 1020 ? (
                            <div className="trade-mobile-view-container">
                              {mobileView === 'chart' && (
                                <ChartComponent
                                  onMarketSelect={onMarketSelect}
                                  tokendict={tokendict}
                                  trades={tradesByMarket[activeMarketKey]}
                                  universalTrades={tradesByMarket}
                                  activeMarket={activeMarket}
                                  orderdata={{
                                    liquidityBuyOrders,
                                    liquiditySellOrders,
                                    spreadData,
                                    priceFactor,
                                    symbolIn,
                                    symbolOut,
                                  }}
                                  userWalletAddress={
                                    connected
                                      ? address
                                      : undefined
                                  }
                                  setpopup={setpopup}
                                  tradesloading={tradesloading}
                                  dayKlines={dayKlines}
                                />
                              )}
                              {(mobileView === 'orderbook' ||
                                mobileView === 'trades') && (
                                  <OrderBook
                                    trades={trades}
                                    orderdata={{
                                      roundedBuyOrders,
                                      roundedSellOrders,
                                      spreadData,
                                      priceFactor,
                                      symbolIn,
                                      symbolOut,
                                    }}
                                    activemarket={activeMarket}
                                    layoutSettings={layoutSettings}
                                    orderbookPosition={orderbookPosition}
                                    hideHeader={true}
                                    interval={baseInterval}
                                    amountsQuote={amountsQuote}
                                    setAmountsQuote={setAmountsQuote}
                                    obInterval={obInterval}
                                    setOBInterval={setOBInterval}
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                    activeTab={obTab}
                                    setActiveTab={setOBTab}
                                    updateLimitAmount={updateLimitAmount}
                                  />
                                )}
                            </div>
                          ) : (
                            <ChartOrderbookPanel
                              onMarketSelect={onMarketSelect}
                              tokendict={tokendict}
                              universalTrades={tradesByMarket}
                              userWalletAddress={
                                connected
                                  ? address
                                  : undefined
                              }
                              layoutSettings={layoutSettings}
                              orderbookPosition={orderbookPosition}
                              trades={tradesByMarket[activeMarketKey]}
                              orderdata={{
                                roundedBuyOrders,
                                roundedSellOrders,
                                spreadData,
                                priceFactor,
                                symbolIn,
                                symbolOut,
                                liquidityBuyOrders,
                                liquiditySellOrders,
                              }}
                              activeMarket={activeMarket}
                              isOrderbookVisible={isOrderbookVisible}
                              orderbookWidth={orderbookWidth}
                              setOrderbookWidth={handleSetOrderbookWidth}
                              obInterval={obInterval}
                              amountsQuote={amountsQuote}
                              setAmountsQuote={setAmountsQuote}
                              obtrades={trades}
                              setOBInterval={setOBInterval}
                              baseInterval={baseInterval}
                              viewMode={viewMode}
                              setViewMode={setViewMode}
                              activeTab={obTab}
                              setActiveTab={setOBTab}
                              setpopup={setpopup}
                              updateLimitAmount={updateLimitAmount}
                              tradesloading={tradesloading}
                              orders={orders}
                              dayKlines={dayKlines}
                            />
                          )}
                        </div>

                        <div
                          className={`oc-spacer ${!isOrderCenterVisible ? 'collapsed' : ''}`}
                        >
                          <div
                            className="ordercenter-drag-handle"
                            onMouseDown={handleVertMouseDown}
                            style={{
                              position: 'relative',
                              width: '100%',
                              cursor: 'row-resize',
                            }}
                          />
                        </div>
                        <div
                          className="app-ordercenter-wrapper"
                          style={{
                            height: `${isOrderCenterVisible ? `${orderCenterHeight}px` : '0px'}`,
                            transition: isVertDragging
                              ? 'none'
                              : 'height 0.1s ease',
                          }}
                        >
                          <OrderCenter
                            orders={orders}
                            tradehistory={tradehistory}
                            canceledorders={canceledorders}
                            router={router}
                            address={address}
                            trades={tradesByMarket}
                            currentMarket={
                              activeMarketKey ==
                                settings.chainConfig[activechain].wethticker +
                                'USDC'
                                ? settings.chainConfig[activechain].ethticker +
                                'USDC'
                                : activeMarketKey
                            }
                            orderCenterHeight={orderCenterHeight}
                            hideBalances={true}
                            tokenList={memoizedTokenList}
                            setTokenIn={setTokenIn}
                            setTokenOut={setTokenOut}
                            setSendTokenIn={setSendTokenIn}
                            setpopup={setpopup}
                            sortConfig={{ column: 'name', direction: 'asc' }}
                            onSort={emptyFunction}
                            tokenBalances={tokenBalances}
                            activeSection={activeSection}
                            setActiveSection={setActiveSection}
                            filter={filter}
                            setFilter={setFilter}
                            onlyThisMarket={onlyThisMarket}
                            setOnlyThisMarket={setOnlyThisMarket}
                            refetch={refetch}
                            sendUserOperation={sendUserOperation}
                            setChain={handleSetChain}
                          />
                        </div>
                      </div>
                      {windowWidth > 1020 && (
                        <div className="right-column"> {scale} </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            }
          />
        </Routes>
        <TransactionPopupManager
          transactions={transactions}
          setTransactions={setTransactions}
          tokendict={tokendict}
        />
      </div>
      {showFooter && <Footer />}
    </div>
  );
}

export default App;
