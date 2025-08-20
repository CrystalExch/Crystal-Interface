// import libraries
import {
  getBlockNumber,
  readContracts,
  waitForTransactionReceipt,
  getTransactionCount
} from '@wagmi/core';
import React, {
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
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
import { TransactionExecutionError, encodeFunctionData, maxUint256, decodeFunctionResult } from 'viem';
import { useLanguage } from './contexts/LanguageContext';
import getAddress from './utils/getAddress.ts';
import { config } from './wagmi.ts';
import {
  useLogout,
  useSmartAccountClient,
  useSendUserOperation,
  useAlchemyAccountContext,
  useUser,
  AuthCard,
  useSignTypedData,
} from "@account-kit/react";
import { Wallet, keccak256 } from 'ethers'
import { useQuery } from '@tanstack/react-query';

// import css
import './App.css';

// import scripts
import approve from './scripts/approve';
import limitOrder from './scripts/limitOrder';
import multiBatchOrders from './scripts/multiBatchOrders';
import cancelOrder from './scripts/cancelOrder';
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
import stake from './scripts/stake.ts';
import { fetchLatestPrice } from './utils/getPrice.ts';
import replaceOrder from './scripts/replaceOrder';
// import utils
import customRound from './utils/customRound';
import { formatTime } from './utils/formatTime.ts';
import { getTradeValue } from './utils/getTradeValue.ts';
import { formatCommas, formatSubscript } from './utils/numberDisplayFormat';
import { formatDisplay } from './components/OrderCenter/utils/formatDisplay.ts';

// import abis
import { CrystalDataHelperAbi } from './abis/CrystalDataHelperAbi';
import { CrystalMarketAbi } from './abis/CrystalMarketAbi';
import { CrystalRouterAbi } from './abis/CrystalRouterAbi';
import { CrystalReferralAbi } from './abis/CrystalReferralAbi.ts';
import { TokenAbi } from './abis/TokenAbi';
import { shMonadAbi } from './abis/shMonadAbi.ts';
import { CrystalVaultsAbi } from "./abis/CrystalVaultsAbi";

// import types
import { DataPoint } from './components/Chart/utils/chartDataGenerator.ts';

// import svg graphics
import tradearrow from './assets/arrow.svg';
import closebutton from './assets/close_button.png';
import sendSwitch from './assets/send_arrow.svg';
import walleticon from './assets/wallet_icon.png';
import infoicon from './assets/icon.png';
import refreshicon from './assets/circulararrow.png';
import Xicon from './assets/Xicon.svg';
import reset from './assets/reset.svg';
import walletbackpack from './assets/walletbackpack.jpg'
import walletcoinbase from './assets/walletcoinbase.png'
import walletconnect from './assets/walletconnect.png'
import walletinjected from './assets/walletinjected.png'
import walletmetamask from './assets/walletmetamask.svg'
import walletphantom from './assets/walletphantom.svg'
import walletrabby from './assets/walletrabby.png'
import warningicon from './assets/warning_icon.png'
import walletsafe from './assets/walletsafe.png'
import wallettomo from './assets/wallettomo.jpg'
import wallethaha from './assets/wallethaha.png'
import crystalxp from './assets/CrystalX.png';
import part1image from './assets/part1intro.png';
import topright from './assets/topright.png';
import veryleft from './assets/veryleft.png';
import topmiddle from './assets/topmiddle.png';
import veryright from './assets/veryright.png';
import topleft from './assets/topleft.png';
import circleleft from './assets/circleleft.png';
import lbstand from './assets/lbstand.png';
import firstPlacePfp from './assets/leaderboard_first.png';
import secondPlacePfp from './assets/leaderboard_second.png';
import thirdPlacePfp from './assets/leaderboard_third.png';
import defaultPfp from './assets/leaderboard_default.png';
import LogoText from './assets/LogoText.png';

import PNLBG from './assets/PNLBG.png';
import PNLBG2 from './assets/PNLBG2.png'

//audio
import stepaudio from './assets/step_audio.mp3';
import backaudio from './assets/back_audio.mp3';

// import routes
import Portfolio from './components/Portfolio/Portfolio.tsx';

// import main app components
import ChartComponent from './components/Chart/Chart.tsx';
import TokenInfoPopupContent from './components/Chart/ChartHeader/TokenInfo/TokenInfoPopup/TokenInfoPopupContent.tsx';
import ChartOrderbookPanel from './components/ChartOrderbookPanel/ChartOrderbookPanel.tsx';
import Header from './components/Header/Header.tsx';
import LoadingOverlay from './components/loading/LoadingComponent.tsx';
import FullScreenOverlay from './components/loading/LoadingScreen.tsx';
import NavigationProgress from './components/NavigationProgress.tsx';
import OrderCenter from './components/OrderCenter/OrderCenter.tsx';
import SortArrow from './components/OrderCenter/SortArrow/SortArrow.tsx';
import PortfolioContent from './components/Portfolio/BalancesContent/BalancesContent.tsx';
import PortfolioPopupGraph from './components/Portfolio/PortfolioGraph/PortfolioGraph.tsx';
import ToggleSwitch from './components/ToggleSwitch/ToggleSwitch.tsx';
import TooltipLabel from './components/TooltipLabel/TooltipLabel.tsx';
import TransactionPopupManager from './components/TransactionPopupManager/TransactionPopupManager';
import MiniChart from './components/Chart/ChartHeader/TokenInfo/MiniChart/MiniChart.tsx';
import Leaderboard from './components/Leaderboard/Leaderboard.tsx';
import SimpleOrdersContainer from './components/SimpleOrdersContainer/SimpleOrdersContainer';
import SidebarNav from './components/SidebarNav/SidebarNav';
import CrystalObject from './components/CrystalObject.tsx';
import EarnVaults from './components/EarnVaults/EarnVaults.tsx';
import LPVaults from './components/LPVaults/LPVaults.tsx';
import Launchpad from './components/Launchpad/Launchpad.tsx';
import TokenExplorer from './components/TokenExplorer/TokenExplorer.tsx';
import MemeInterface from './components/MemeInterface/MemeInterface.tsx';
import MemeTransactionPopupManager from './components/MemeTransactionPopup/MemeTransactionPopupManager';
import html2canvas from 'html2canvas';
import { HexColorPicker } from 'react-colorful';
import TokenBoard from './components/DegenToken/TokenBoard';
import TokenDetail from './components/DegenToken/TokenDetail';

// import config
import { SearchIcon } from 'lucide-react';
import { usePortfolioData } from './components/Portfolio/PortfolioGraph/usePortfolioData.ts';
import { settings } from './settings.ts';
import { useSharedContext } from './contexts/SharedContext.tsx';
import { QRCodeSVG } from 'qrcode.react';
import CopyButton from './components/CopyButton/CopyButton.tsx';
import { sMonAbi } from './abis/sMonAbi.ts';
const clearlogo = '/CrystalLogo.png';
export type NotifyPayload = {
  title: string;
  subtitle?: string;
  amount?: string;
  amountUnit?: string;
  variant?: 'success' | 'error' | 'info';
};
function App() {
  // constants
  const { config: alchemyconfig } = useAlchemyAccountContext() as any;
  const { client, address: scaAddress } = useSmartAccountClient({});
  const { sendUserOperationAsync: rawSendUserOperationAsync } = useSendUserOperation({
    client,
    waitForTxn: true,
  });
  const { signTypedDataAsync } = useSignTypedData({ client })
  const user = useUser();
  const { logout } = useLogout();
  const { t, language, setLanguage } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activechain, percentage, setPercentage, favorites } = useSharedContext();
  const userchain = alchemyconfig?._internal?.wagmiConfig?.state?.connections?.entries()?.next()?.value?.[1]?.chainId || client?.chain?.id
  const location = useLocation();
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const HTTP_URL = settings.chainConfig[activechain].httpurl;
  const WS_URL = settings.chainConfig[activechain].wssurl;
  const eth = settings.chainConfig[activechain].eth as `0x${string}`;
  const weth = settings.chainConfig[activechain].weth as `0x${string}`;
  const usdc = settings.chainConfig[activechain].usdc as `0x${string}`;
  const ethticker = settings.chainConfig[activechain].ethticker;
  const wethticker = settings.chainConfig[activechain].wethticker;
  const balancegetter = settings.chainConfig[activechain].balancegetter;
  const router = settings.chainConfig[activechain].router;
  const crystalVaults = settings.chainConfig[activechain].crystalVaults;
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

  const [selectedVaultForAction, setSelectedVaultForAction] = useState<any | null>(null);
  const [vaultDepositAmount, setVaultDepositAmount] = useState('');
  const [vaultWithdrawAmount, setVaultWithdrawAmount] = useState('');
  const [isVaultDepositSigning, setIsVaultDepositSigning] = useState(false);
  const [isVaultWithdrawSigning, setIsVaultWithdrawSigning] = useState(false);
  const txReceiptResolvers = new Map<string, () => void>();
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
        if (path && path.length > 2) {
          let fee = BigInt(1);
          for (let i = 0; i < path.length - 1; i++) {
            fee *= getMarket(path[i], path[i + 1]).fee;
          }
          fee /= BigInt(100000 ** (path.length - 2));
          if (path.at(-1) != usdc) {
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
          return {
            quoteAsset: getMarket(path.at(0), path.at(1)).quoteAsset,
            baseAsset: getMarket(path.at(0), path.at(1)).baseAsset,
            path: path,
            quoteAddress: getMarket(path.at(0), path.at(1)).quoteAddress,
            baseAddress: getMarket(path.at(0), path.at(1)).baseAddress,
            quoteDecimals: getMarket(path.at(0), path.at(1)).quoteDecimals,
            baseDecimals: getMarket(path.at(0), path.at(1)).baseDecimals,
            address: getMarket(path.at(0), path.at(1)).address,
            scaleFactor: getMarket(path.at(0), path.at(1)).scaleFactor,
            priceFactor: getMarket(path.at(0), path.at(1)).priceFactor,
            tickSize: getMarket(path.at(0), path.at(1)).tickSize,
            minSize: getMarket(path.at(0), path.at(1)).minSize,
            maxPrice: getMarket(path.at(0), path.at(1)).maxPrice,
            fee: fee,
            image: getMarket(path.at(0), path.at(1)).image,
            website: getMarket(path.at(0), path.at(1)).website,
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
//  const [isWidgetExplorerOpen, setIsWidgetExplorerOpen] = useState(false);
// const [widgetExplorerSnapSide, setWidgetExplorerSnapSide] = useState<'left' | 'right' | 'none'>('none');
// const [widgetWidth, setWidgetWidth] = useState(400);

// const handleOpenWidgetExplorer = useCallback(() => {
//   setIsWidgetExplorerOpen(true);
// }, []);

// const handleCloseWidgetExplorer = useCallback(() => {
//   setIsWidgetExplorerOpen(false);
//   setWidgetExplorerSnapSide('none');
//   setWidgetWidth(400); 
// }, []);

// const handleWidgetExplorerSnapToSide = useCallback((side: 'left' | 'right' | 'none') => {
//   console.log('Widget snapped to:', side); // Debug log
//   setWidgetExplorerSnapSide(side);
// }, []);

// const handleWidgetExplorerResize = useCallback((width) => {
//   console.log('Widget resized to:', width, 'Snap side:', widgetExplorerSnapSide); 
//   setWidgetWidth(width);
// }, [widgetExplorerSnapSide]);

// const getAppContainerStyle = () => {
//   const style = {};
  
//   if (widgetExplorerSnapSide === 'left') {
//     style.marginLeft = `${widgetWidth}px`;
//     console.log('Applying left margin:', widgetWidth);
//   } else if (widgetExplorerSnapSide === 'right') {
//     style.marginRight = `${widgetWidth}px`;
//     console.log('Applying right margin:', widgetWidth); 
//   }
  
//   style.transition = 'margin-left 0.2s ease, margin-right 0.2s ease';
  
//   return style;
// };

// const getHeaderStyle = () => {
//   const style = {};
  
//   let leftPosition = 55;
  
//   if (widgetExplorerSnapSide === 'left') {
//     leftPosition = 55 + widgetWidth;
//     console.log('Header left position:', leftPosition);
//   }
  
//   style.left = `${leftPosition}px`;
//   style.transition = 'left 0.3s ease';
  
//   return style;
// };

// const getHeaderClassName = () => {
//   let className = 'app-header';
  
//   if (widgetExplorerSnapSide === 'left') {
//     className += ' widget-left';
//   } else if (widgetExplorerSnapSide === 'right') {
//     className += ' widget-right';
//   }
  
//   const isTradeRoute = ['/swap', '/limit', '/send', '/scale', '/market'].includes(location.pathname);
//   if (isTradeRoute && !simpleView) {
//   }
  
//   return className;
// };


  const [useOneCT, setUseOneCT] = useState(true);
  const [oneCTSigner, setOneCTSigner] = useState('');
  const validOneCT = useOneCT && oneCTSigner
  const oneCTNonceRef = useRef<number>(0);
  const onectclient = validOneCT ? new Wallet(oneCTSigner) : {
    address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    signTransaction: async () => ''
  };
  const address = validOneCT && scaAddress ? onectclient.address as `0x${string}` : scaAddress as `0x${string}`
  const connected = address != undefined
  const [subWallets, setSubWallets] = useState<Array<{ address: string, privateKey: string }>>([]);
  useEffect(() => {
    const storedSubWallets = localStorage.getItem('crystal_sub_wallets');
    if (storedSubWallets) {
      try {
        setSubWallets(JSON.parse(storedSubWallets));
      } catch (error) {
        console.error('Error loading stored subwallets:', error);
      }
    }
  }, []);
const getCurrentConnector = () => {
  const connection = alchemyconfig?._internal?.wagmiConfig?.state?.connections?.entries()?.next()?.value?.[1];
  return connection?.connector;
};
const getConnectorName = () => {
  const connector = getCurrentConnector();
  return connector?.name || 'Unknown';
};

const getWalletIcon = () => {
  const connectorName = getConnectorName();
  
  switch (connectorName) {
    case 'MetaMask':
      return walletmetamask;
    case 'Coinbase Wallet':
      return walletcoinbase;
    case 'WalletConnect':
      return walletconnect;
    case 'Safe':
      return walletsafe;
    case 'Rabby Wallet':
    case 'Rabby':
      return walletrabby;
    case 'Backpack':
      return walletbackpack;
    case 'Phantom':
      return walletphantom;
    case 'Tomo':
      return wallettomo;
    case 'HaHa Wallet':
      return wallethaha;
    default:
      return; 
  }
};
  useEffect(() => {
  if (connected) {
    const connector = getCurrentConnector();
    console.log('Connector details:', {
      name: connector?.name,
      type: connector?.type,
      id: connector?.id
    });
  }
}, [connected]);

const [withdrawPercentage, setWithdrawPercentage] = useState('');
const [currentWalletType, setCurrentWalletType] = useState('');
const [currentWalletIcon, setCurrentWalletIcon] = useState(walleticon);

useEffect(() => {
  if (connected) {
    const connectorName = getConnectorName();
    setCurrentWalletType(connectorName);
    setCurrentWalletIcon(getWalletIcon());
  } else {
    setCurrentWalletType('');
    setCurrentWalletIcon(walleticon);
  }
}, [connected, alchemyconfig]);
  const saveSubWalletsToStorage = (wallets: Array<{ address: string, privateKey: string }>) => {
    localStorage.setItem('crystal_sub_wallets', JSON.stringify(wallets));
  };


  const createSubWallet = async () => {
    try {
      const privateKey = keccak256(await signTypedDataAsync({
        typedData: {
          types: {
            createCrystalOneCT: [
              { name: 'version', type: 'string' },
              { name: 'account', type: 'uint256' },
            ],
          },
          primaryType: 'createCrystalOneCT',
          message: {
            version: 'Crystal v0.0.1 Testnet',
            account: BigInt(subWallets.length + 1),
          }
        }
      }));

      const tempWallet = new Wallet(privateKey);
      const walletAddress = tempWallet.address as string;

      const newWallet = {
        address: walletAddress,
        privateKey: privateKey
      };

      const updatedWallets = [...subWallets, newWallet];
      setSubWallets(updatedWallets);
      saveSubWalletsToStorage(updatedWallets);

      console.log('New Subwallet Created:', newWallet);

      if (!validOneCT && updatedWallets.length === 1) {
        setOneCTSigner(privateKey);
        setpopup(25);
        refetch();
      }
    } catch (error) {
      console.error('Error creating subwallet:', error);
    }
  };

  const deleteSubWallet = (index: number) => {
    const updatedWallets = subWallets.filter((_, i) => i !== index);
    setSubWallets(updatedWallets);
    saveSubWalletsToStorage(updatedWallets);
  };

  const setActiveSubWallet = (privateKey: string) => {
    setOneCTSigner(privateKey);
    setpopup(25);
    refetch();
  };

  const sendUserOperationAsync = useCallback(
    async (params: any, gasLimit: bigint = 0n, prioFee: bigint = 0n) => {
      if (validOneCT) {
        const tx = {
          to: params.uo.target,
          value: params.uo.value,
          data: params.uo.data,
          gasLimit: gasLimit > 0n ? gasLimit : 500000n,
          maxFeePerGas: 100000000000n + (prioFee > 0n ? prioFee : 13000000000n),
          maxPriorityFeePerGas: (prioFee > 0n ? prioFee : 13000000000n),
          nonce: oneCTNonceRef.current,
          chainId: activechain
        }
        oneCTNonceRef.current += 1;
        const signedTx = await onectclient.signTransaction(tx);
        const hash = keccak256(signedTx) as `0x${string}`;

        const RPC_URLS = [
          HTTP_URL,
          'https://rpc.monad-testnet.fastlane.xyz/eyJhIjoiMHhlN0QxZjRBQjIyMmQ5NDM4OWI4Mjk4MWY5OUM1ODgyNGZGNDJhN2QwIiwidCI6MTc1MzUwMjEzNiwicyI6IjB4ODE1ODNhMjQ5Yjc5ZTljNjliYzJjNDkzZGZkMDQ0ODdiMWMzZmRhYzE1ZGZlMmVlYjgyOWQ0NTRkZWQ3MTZjMTU4ZmQwMWNmNzlkM2JkNWJlNWRlOTVkZjU1MzE3ODkzNmMyZTBmMGFiYzk1NDlkNTMzYWRmODA4Y2UxODEwNjUxYyJ9',
          'https://rpc.ankr.com/monad_testnet',
          'https://monad-testnet.drpc.org',
          'https://monad-testnet.g.alchemy.com/v2/SqJPlMJRSODWXbVjwNyzt6-uY9RMFGng',
        ];

        RPC_URLS.forEach(url => {
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 0,
              method: 'eth_sendRawTransaction',
              params: [signedTx]
            })
          }).catch();
        });
        return { hash }
      }
      else {
        return rawSendUserOperationAsync(params)
      }
    },
    [validOneCT]
  );

  // state vars
  const [showSendDropdown, setShowSendDropdown] = useState(false);
  const sendDropdownRef = useRef<HTMLDivElement | null>(null);
  const sendButtonRef = useRef<HTMLSpanElement | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedDepositToken, setSelectedDepositToken] = useState(() => Object.keys(tokendict)[0]);
  const [mobileView, setMobileView] = useState('chart');
  const [showTrade, setShowTrade] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [selectedConnector, setSelectedConnector] = useState<any>(null);
  const [totalAccountValue, setTotalAccountValue] = useState<number | null>(null);
  const [totalVolume, setTotalVolume] = useState(0);
  const [copyTooltipVisible, setCopyTooltipVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showHoverTooltip, setShowHoverTooltip] = useState(false);
  const [currentProText, setCurrentProText] = useState(location.pathname.slice(1) == 'swap' || location.pathname.slice(1) == 'market' || location.pathname.slice(1) == 'limit' ? 'pro' : t(location.pathname.slice(1).toLowerCase()));
  const [refLink, setRefLink] = useState('');
  const [totalClaimableFees, setTotalClaimableFees] = useState(0);
  const [switched, setswitched] = useState(false);

  const [orderSizePercent, setOrderSizePercent] = useState(100);
  const [originalOrderSize, setOriginalOrderSize] = useState(0);
  type SliderMode = 'slider' | 'presets' | 'increment';
  const [spotSliderMode, setSpotSliderMode] = useState<'presets' | 'increment' | 'slider'>('presets');
  const [trenchesSliderMode, setTrenchesSliderMode] = useState<'presets' | 'increment' | 'slider'>('presets');
  const [spotSliderPresets, setSpotSliderPresets] = useState([25, 50, 75, 100]);
  const [trenchesSliderPresets, setTrenchesSliderPresets] = useState([25, 50, 75, 100]);
  const [spotSliderIncrement, setSpotSliderIncrement] = useState(5);
  const [trenchesSliderIncrement, setTrenchesSliderIncrement] = useState(5);

  const [sliderMode, setSliderMode] = useState<SliderMode>(() => {
    const saved = localStorage.getItem('crystal_slider_mode');
    return (saved as SliderMode) || 'slider';
  });

  const [sliderPresets, setSliderPresets] = useState<number[]>(() => {
    const saved = localStorage.getItem('crystal_slider_presets');
    return saved ? JSON.parse(saved) : [25, 50, 75];
  });

  const [sliderIncrement, setSliderIncrement] = useState<number>(() => {
    const saved = localStorage.getItem('crystal_slider_increment');
    return saved ? parseFloat(saved) : 10;
  });

  const [claimableFees, setClaimableFees] = useState<{ [key: string]: number }>(
    {},
  );
  const [tokenIn, setTokenIn] = useState(() => {
    if (location.pathname.slice(1) == 'send') {
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
            if (markets[market].baseAddress == token) {
              return markets[market].quoteAddress;
            }
          }
          for (const market in markets) {
            if (markets[market].quoteAddress == token) {
              return markets[market].baseAddress;
            }
          }
        }
      }
    }
    return usdc;
  });
  const [tokenOut, setTokenOut] = useState(() => {
    let tokenIn =
      location.pathname.slice(1) == 'send'
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
          if (path && path.length > 1 && location.pathname.slice(1) == 'swap') {
            return tokenOut;
          } else {
            for (const market in markets) {
              if (markets[market].baseAddress == tokenIn) {
                return markets[market].quoteAddress;
              }
            }
            for (const market in markets) {
              if (markets[market].quoteAddress == tokenIn) {
                return markets[market].baseAddress;
              }
            }
          }
        }
      }
    } else if (tokenIn) {
      tokenIn = getAddress(tokenIn);
      if (tokendict[tokenIn]) {
        for (const market in markets) {
          if (markets[market].baseAddress == tokenIn) {
            return markets[market].quoteAddress;
          }
        }
        for (const market in markets) {
          if (markets[market].quoteAddress == tokenIn) {
            return markets[market].baseAddress;
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
  const activeMarket = getMarket(tokenIn, tokenOut);
  const activeMarketKey = (activeMarket.baseAsset + activeMarket.quoteAsset).replace(
    new RegExp(
      `^${wethticker}|${wethticker}$`,
      'g'
    ),
    ethticker
  );
  const multihop = activeMarket.path.length > 2;
  const [usedRefLink, setUsedRefLink] = useState('');
  const [usedRefAddress, setUsedRefAddress] = useState(
    '0x0000000000000000000000000000000000000000' as `0x${string}`,
  );
  const [simpleView, setSimpleView] = useState(() => {
    const savedSimpleView = localStorage.getItem('crystal_simple_view');
    return savedSimpleView ? JSON.parse(savedSimpleView) : false;
  });
  const [hideNotificationPopups, setHideNotificationPopups] = useState(() => {
    return JSON.parse(localStorage.getItem('crystal_hide_notification_popups') || 'false');
  });
  const [rpcUrl, setRpcUrl] = useState(() => localStorage.getItem('crystal_rpc_url') || '')
  const [graphUrl, setGraphUrl] = useState(() => localStorage.getItem('crystal_graph_url') || '')
  const [graphKey, setGraphKey] = useState(() => localStorage.getItem('crystal_graph_key') || '')
  const [notificationPosition, setNotificationPosition] = useState(() => {
    const saved = localStorage.getItem('crystal_notification_position');
    return saved || 'bottom-right';
  });

  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<string | null>(null);
  const [previewTimer, setPreviewTimer] = useState<NodeJS.Timeout | null>(null);
  const [previewExiting, setPreviewExiting] = useState(false);

  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [onSelectTokenCallback, setOnSelectTokenCallback] = useState<((token: any) => void) | null>(null);



const [vaultDepositAmounts, setVaultDepositAmounts] = useState<{ quote: string, base: string }>({
  quote: '',
  base: ''
});
const [vaultQuoteExceedsBalance, setVaultQuoteExceedsBalance] = useState(false);
const [vaultBaseExceedsBalance, setVaultBaseExceedsBalance] = useState(false);
const [withdrawShares, setWithdrawShares] = useState('');
const [withdrawExceedsBalance, setWithdrawExceedsBalance] = useState(false);
const [depositPreview, setDepositPreview] = useState<{ shares: bigint, amountQuote: bigint, amountBase: bigint } | null>(null);
const [withdrawPreview, setWithdrawPreview] = useState<{ amountQuote: bigint, amountBase: bigint } | null>(null);

const calculateSharesFromPercentage = (percentage: string, userShares: any) => {
  if (!percentage || !userShares) return '0';
  const percentageDecimal = parseFloat(percentage) / 100;
  const sharesToWithdraw = BigInt(Math.floor(Number(userShares) * percentageDecimal));
  return sharesToWithdraw.toString();
};

const handleWithdrawPercentageChange = (value: string) => {
  const cleanValue = value.replace(/[^\d.]/g, '');
  
  const numericValue = parseFloat(cleanValue);
  if (numericValue > 100) {
    setWithdrawPercentage('100');
  } else {
    setWithdrawPercentage(cleanValue);
  }
  
  setWithdrawExceedsBalance(false);
  
  const sharesToWithdraw = calculateSharesFromPercentage(cleanValue, selectedVaultForAction?.userShares);
  const userSharesBalance = BigInt(selectedVaultForAction?.userShares || 0);
  
  if (BigInt(sharesToWithdraw) > userSharesBalance) {
    setWithdrawExceedsBalance(true);
  }
};

const handleVaultDepositAmountChange = (type: 'quote' | 'base', value: string) => {
  if (value === '' || /^\d*\.?\d*$/.test(value)) {
    setVaultDepositAmounts(prev => ({
      ...prev,
      [type]: value
    }));

    if (value !== '' && selectedVaultForAction) {
      const tokenData = type === 'quote' ? selectedVaultForAction.quoteTokenData : selectedVaultForAction.baseTokenData;
      if (tokenData) {
        const tokenDecimals = Number(tokenData.decimals || 18);
        const maxAllowedAmount = Number(tokenBalances[tokenData.address]) / 10 ** tokenDecimals;
        const enteredAmount = parseFloat(value);

        if (type === 'quote') {
          setVaultQuoteExceedsBalance(enteredAmount > maxAllowedAmount);
        } else {
          setVaultBaseExceedsBalance(enteredAmount > maxAllowedAmount);
        }
      }
    } else {
      if (type === 'quote') {
        setVaultQuoteExceedsBalance(false);
      } else {
        setVaultBaseExceedsBalance(false);
      }
    }
  }
};

const handleWithdrawSharesChange = (value: string) => {
  if (value === '' || /^\d*\.?\d*$/.test(value)) {
    setWithdrawShares(value);

    if (value !== '' && selectedVaultForAction) {
      const userSharesBalance = parseFloat(selectedVaultForAction.userShares || '0');
      const enteredAmount = parseFloat(value);
      setWithdrawExceedsBalance(enteredAmount > userSharesBalance);
    } else {
      setWithdrawExceedsBalance(false);
    }
  }
};

const isVaultDepositEnabled = () => {
  return vaultDepositAmounts.quote !== '' && vaultDepositAmounts.base !== '' &&
    parseFloat(vaultDepositAmounts.quote) > 0 && parseFloat(vaultDepositAmounts.base) > 0 &&
    !vaultQuoteExceedsBalance && !vaultBaseExceedsBalance && depositPreview;
};

const isWithdrawEnabled = () => {
  return withdrawShares !== '' && parseFloat(withdrawShares) > 0 && 
    !withdrawExceedsBalance && withdrawPreview;
};

const getVaultDepositButtonText = () => {
  if (vaultQuoteExceedsBalance || vaultBaseExceedsBalance) {
    return 'Insufficient Balance';
  }
  if (!depositPreview) {
    return 'Enter Amounts';
  }
  return 'Deposit';
};

const getWithdrawButtonText = () => {
  if (withdrawExceedsBalance) {
    return 'Insufficient Shares';
  }
  if (!withdrawPreview) {
    return 'Enter Amount';
  }
  return 'Withdraw';
};

// Preview deposit effect
useEffect(() => {
  if (!selectedVaultForAction || !vaultDepositAmounts.quote || !vaultDepositAmounts.base) {
    setDepositPreview(null);
    return;
  }

  const previewDeposit = async () => {
    try {
      const crystalVaultsAddress = settings.chainConfig[activechain]?.crystalVaults;
      const HTTP_URL = settings.chainConfig[activechain]?.httpurl;
      
      if (!crystalVaultsAddress || !HTTP_URL) return;

      const quoteDecimals = Number(selectedVaultForAction.quoteTokenData?.decimals || 18);
      const baseDecimals = Number(selectedVaultForAction.baseTokenData?.decimals || 18);
      
      const amountQuoteDesired = BigInt(Math.round(parseFloat(vaultDepositAmounts.quote) * 10 ** quoteDecimals));
      const amountBaseDesired = BigInt(Math.round(parseFloat(vaultDepositAmounts.base) * 10 ** baseDecimals));

      const calldata = encodeFunctionData({
        abi: CrystalVaultsAbi,
        functionName: "previewDeposit",
        args: [
          selectedVaultForAction.address as `0x${string}`,
          amountQuoteDesired,
          amountBaseDesired,
        ],
      });

      const res = await fetch(HTTP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [
            { to: crystalVaultsAddress, data: calldata },
            "latest",
          ],
        }),
      });

      const { result } = await res.json();
      const [shares, amountQuote, amountBase] = decodeFunctionResult({
        abi: CrystalVaultsAbi,
        functionName: "previewDeposit",
        data: result,
      });

      setDepositPreview({ shares, amountQuote, amountBase });
    } catch (error) {
      console.error('Error previewing deposit:', error);
      setDepositPreview(null);
    }
  };

  const timeoutId = setTimeout(previewDeposit, 500);
  return () => clearTimeout(timeoutId);
}, [vaultDepositAmounts, selectedVaultForAction, activechain]);

// Preview withdrawal effect
useEffect(() => {
  if (!selectedVaultForAction || !withdrawShares) {
    setWithdrawPreview(null);
    return;
  }

  const previewWithdrawal = async () => {
    try {
      const crystalVaultsAddress = settings.chainConfig[activechain]?.crystalVaults;
      const HTTP_URL = settings.chainConfig[activechain]?.httpurl;
      
      if (!crystalVaultsAddress || !HTTP_URL) return;

      const shares = BigInt(withdrawShares);

      const calldata = encodeFunctionData({
        abi: CrystalVaultsAbi,
        functionName: "previewWithdrawal",
        args: [
          selectedVaultForAction.address as `0x${string}`,
          shares,
        ],
      });

      const res = await fetch(HTTP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [
            { to: crystalVaultsAddress, data: calldata },
            "latest",
          ],
        }),
      });

      const { result } = await res.json();
      const [amountQuote, amountBase] = decodeFunctionResult({
        abi: CrystalVaultsAbi,
        functionName: "previewWithdrawal",
        data: result,
      });

      setWithdrawPreview({ amountQuote, amountBase });
    } catch (error) {
      console.error('Error previewing withdrawal:', error);
      setWithdrawPreview(null);
    }
  };

  const timeoutId = setTimeout(previewWithdrawal, 500);
  return () => clearTimeout(timeoutId);
}, [withdrawShares, selectedVaultForAction, activechain]);

const handleVaultDeposit = async () => {
  if (!selectedVaultForAction || !connected || !depositPreview) return;
  
  const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
  if (userchain !== targetChainId) {
    handleSetChain();
    return;
  }

  try {
    setIsVaultDepositSigning(true);

    const crystalVaultsAddress = settings.chainConfig[activechain]?.crystalVaults;
    const quoteTokenAddress = selectedVaultForAction.quoteAsset;
    const baseTokenAddress = selectedVaultForAction.baseAsset;


    const quoteDecimals = Number(tokendict[selectedVaultForAction?.quoteAsset]?.decimals || 18);
    const baseDecimals = Number(tokendict[selectedVaultForAction?.baseAsset]?.decimals || 18);

    const amountQuoteDesired = BigInt(Math.round(parseFloat(vaultDepositAmounts.quote) * 10 ** quoteDecimals));
    const amountBaseDesired = BigInt(Math.round(parseFloat(vaultDepositAmounts.base) * 10 ** baseDecimals));

    const amountQuoteMin = (amountQuoteDesired * 95n) / 100n;
    const amountBaseMin = (amountBaseDesired * 95n) / 100n;

    // Approve tokens if needed
    if (quoteTokenAddress !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
      const approveQuoteUo = {
        target: quoteTokenAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: [{
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" }
            ],
            name: "approve",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          }],
          functionName: "approve",
          args: [crystalVaultsAddress as `0x${string}`, maxUint256],
        }),
        value: 0n,
      };
      const approveQuoteOp = await sendUserOperationAsync({ uo: approveQuoteUo });
      await waitForTxReceipt(approveQuoteOp.hash);
    }

    if (baseTokenAddress !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
      const approveBaseUo = {
        target: baseTokenAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: [{
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" }
            ],
            name: "approve",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          }],
          functionName: "approve",
          args: [crystalVaultsAddress as `0x${string}`, maxUint256],
        }),
        value: 0n,
      };
      const approveBaseOp = await sendUserOperationAsync({ uo: approveBaseUo });
      await waitForTxReceipt(approveBaseOp.hash);
    }

    // Deposit into vault
    const ethValue = 
      quoteTokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? amountQuoteDesired :
      baseTokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? amountBaseDesired : 0n;

    const depositUo = {
      target: crystalVaultsAddress as `0x${string}`,
      data: encodeFunctionData({
        abi: CrystalVaultsAbi,
        functionName: "deposit",
        args: [
          selectedVaultForAction.address as `0x${string}`,
          amountQuoteDesired,
          amountBaseDesired,
          amountQuoteMin,
          amountBaseMin,
        ],
      }),
      value: ethValue,
    };

    const depositOp = await sendUserOperationAsync({ uo: depositUo });
    await waitForTxReceipt(depositOp.hash);

    // Reset form
    setVaultDepositAmounts({ quote: '', base: '' });
    setVaultQuoteExceedsBalance(false);
    setVaultBaseExceedsBalance(false);
    setDepositPreview(null);
    
    refetch();
    setpopup(0);
    setSelectedVaultForAction(null);

  } catch (e: any) {
    console.error('Vault deposit error:', e);
  } finally {
    setIsVaultDepositSigning(false);
  }
};

// Handle vault withdrawal function
const handleVaultWithdraw = async () => {
  if (!selectedVaultForAction || !connected || !withdrawPreview) return;
  
  const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
  if (userchain !== targetChainId) {
    handleSetChain();
    return;
  }

  try {
    setIsVaultWithdrawSigning(true);

    const crystalVaultsAddress = settings.chainConfig[activechain]?.crystalVaults;
    
    const amountQuoteMin = (withdrawPreview.amountQuote * 95n) / 100n;
    const amountBaseMin = (withdrawPreview.amountBase * 95n) / 100n;

    const withdrawUo = {
      target: crystalVaultsAddress as `0x${string}`,
      data: encodeFunctionData({
        abi: CrystalVaultsAbi,
        functionName: "withdraw",
        args: [
          selectedVaultForAction.address as `0x${string}`,
          BigInt(withdrawShares),
          amountQuoteMin,
          amountBaseMin,
        ],
      }),
      value: 0n,
    };

    const withdrawOp = await sendUserOperationAsync({ uo: withdrawUo });
    await waitForTxReceipt(withdrawOp.hash);

    // Reset form
    setWithdrawShares('');
    setWithdrawExceedsBalance(false);
    setWithdrawPreview(null);
    
    refetch();
    setpopup(0);
    setSelectedVaultForAction(null);

  } catch (e: any) {
    console.error('Vault withdraw error:', e);
  } finally {
    setIsVaultWithdrawSigning(false);
  }
};







  const updateNotificationPosition = (position: string) => {
    if (previewTimer) {
      clearTimeout(previewTimer);
      setPreviewTimer(null);
    }

    if (showPreview && previewPosition !== position) {
      setPreviewExiting(true);

      setTimeout(() => {
        setPreviewExiting(false);
        setShowPreview(false);

        setTimeout(() => {
          setPreviewPosition(position);
          setShowPreview(true);
          setNotificationPosition(position);
          localStorage.setItem('crystal_notification_position', position);

          const newTimer = setTimeout(() => {
            setPreviewExiting(true);
            setTimeout(() => {
              setShowPreview(false);
              setPreviewPosition(null);
              setPreviewExiting(false);
            }, 300);
          }, 3000);

          setPreviewTimer(newTimer);
        }, 50);
      }, 300);
    } else {
      setPreviewPosition(position);
      setShowPreview(true);
      setNotificationPosition(position);
      localStorage.setItem('crystal_notification_position', position);

      const newTimer = setTimeout(() => {
        setPreviewExiting(true);
        setTimeout(() => {
          setShowPreview(false);
          setPreviewPosition(null);
          setPreviewExiting(false);
        }, 300);
      }, 3000);

      setPreviewTimer(newTimer);
    }
  };

  const [hiddenPopupTypes, setHiddenPopupTypes] = useState(() => {
    return JSON.parse(localStorage.getItem('crystal_hidden_popup_types') || '{}');
  });

  const updateHiddenPopupType = (actionType: string, hide: boolean) => {
    const newHiddenTypes = { ...hiddenPopupTypes, [actionType]: hide };
    setHiddenPopupTypes(newHiddenTypes);
    localStorage.setItem('crystal_hidden_popup_types', JSON.stringify(newHiddenTypes));
  };
  const updateMultipleHiddenPopupTypes = (types: string[], hide: boolean) => {
    const newHiddenTypes = { ...hiddenPopupTypes };
    types.forEach(type => {
      newHiddenTypes[type] = hide;
    });
    setHiddenPopupTypes(newHiddenTypes);
    localStorage.setItem('crystal_hidden_popup_types', JSON.stringify(newHiddenTypes));
  };
  const [activeSettingsSection, setActiveSettingsSection] = useState(() => {
    const saved = localStorage.getItem('crystal_active_settings_section');
    return saved || 'general';
  });

  const updateActiveSettingsSection = (section: string) => {
    setActiveSettingsSection(section);
    localStorage.setItem('crystal_active_settings_section', section);
  };
  const [isMarksVisible, setIsMarksVisible] = useState(() => {
    const saved = localStorage.getItem('crystal_marks_visible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isOrdersVisible, setIsOrdersVisible] = useState(() => {
    const saved = localStorage.getItem('crystal_orders_visible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isOrderbookVisible, setIsOrderbookVisible] = useState(() => {
    const saved = localStorage.getItem('crystal_orderbook_visible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isOrderCenterVisible, setIsOrderCenterVisible] = useState(() => {
    const saved = localStorage.getItem('crystal_ordercenter_visible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [orderbookWidth, setOrderbookWidth] = useState<number>(() => {
    const saved = localStorage.getItem('orderbookWidth');
    return saved ? parseInt(saved, 10) : 300;
  });
  const [orderCenterHeight, setOrderCenterHeight] = useState<number>(() => {
    const savedHeight = localStorage.getItem('orderCenterHeight');
    if (savedHeight !== null) {
      const parsedHeight = parseFloat(savedHeight);
      if (!isNaN(parsedHeight)) {
        return parsedHeight;
      }
    }

    if (window.innerHeight > 1080) return 367.58;
    if (window.innerHeight > 960) return 324.38;
    if (window.innerHeight > 840) return 282.18;
    if (window.innerHeight > 720) return 239.98;
    return 198.78;


  });
  const [showChartOutliers, setShowChartOutliers] = useState(() => {
    return JSON.parse(localStorage.getItem('crystal_show_chart_outliers') || 'false');
  });
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => {
    return JSON.parse(localStorage.getItem('crystal_audio_notifications') || 'false');
  });
  const [orderbookPosition, setOrderbookPosition] = useState(() => {
    const savedPosition = localStorage.getItem('crystal_orderbook');
    return savedPosition || 'right';
  });
  const [obInterval, setOBInterval] = useState<number>(() => {
    const stored = localStorage.getItem(
      `${activeMarket.baseAsset}_ob_interval`,
    );
    return stored !== null ? JSON.parse(stored) : 0.1;
  });
  const [layoutSettings, setLayoutSettings] = useState(() => {
    const savedLayout = localStorage.getItem('crystal_layout');
    return savedLayout || 'default';
  });
  const [popup, setpopup] = useState(0);
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
  const [isStake, setIsStake] = useState(() => {
    return true
  })
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
    if (location.pathname.slice(1) == 'swap' || location.pathname.slice(1) == 'market') {
      const amount = searchParams.get('amountOut');
      if (amount) {
        setswitched(true);
        return BigInt(amount);
      }
      else if ((tokenIn == eth && tokenOut == weth) ||
        (tokenIn == weth && tokenOut == eth)) {
        return amountIn
      }
    }
    return BigInt(0);
  });
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
    if (location.pathname.slice(1) == 'swap' || location.pathname.slice(1) == 'market') {
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
      else if ((tokenIn == eth && tokenOut == weth) ||
        (tokenIn == weth && tokenOut == eth)) {
        return inputString
      }
    }
    return '';
  });
  const [isComposing, setIsComposing] = useState(false);
  const [sendInputString, setsendInputString] = useState('');
  const [limitPriceString, setlimitPriceString] = useState('');
  const [allowance, setallowance] = useState(BigInt(0));
  const [warning, setwarning] = useState(0);
  const [lowestAsk, setlowestAsk] = useState(BigInt(0));
  const [highestBid, sethighestBid] = useState(BigInt(0));
  const [priceImpact, setPriceImpact] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [tradeFee, setTradeFee] = useState('');
  const [stateIsLoading, setStateIsLoading] = useState(true);
  const [displayValuesLoading, setDisplayValuesLoading] = useState(true);
  const [portfolioColorValue, setPortfolioColorValue] = useState('#00b894');
  const [recipient, setrecipient] = useState('');
  const [limitPrice, setlimitPrice] = useState(BigInt(0));
  const [limitChase, setlimitChase] = useState(true);
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
  const [sendPopupButton, setSendPopupButton] = useState(5);
  const [sendPopupButtonDisabled, setSendPopupButtonDisabled] = useState(true);
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
  const [roundedBuyOrders, setRoundedBuyOrders] = useState<{ orders: any[], key: string }>({ orders: [], key: '' });
  const [roundedSellOrders, setRoundedSellOrders] = useState<{ orders: any[], key: string }>({ orders: [], key: '' });
  const [liquidityBuyOrders, setLiquidityBuyOrders] = useState<{ orders: any[], market: string }>({ orders: [], market: '' });
  const [liquiditySellOrders, setLiquiditySellOrders] = useState<{ orders: any[], market: string }>({ orders: [], market: '' });
  const [prevOrderData, setPrevOrderData] = useState<any[]>([])
  const [stateloading, setstateloading] = useState(true);
  const [tradesloading, settradesloading] = useState(true);
  const [addressinfoloading, setaddressinfoloading] = useState(true);
  const [chartDays, setChartDays] = useState<number>(1);
  const [marketsData, setMarketsData] = useState<any[]>([]);
  const [advChartData, setChartData] = useState<[DataPoint[], string, boolean]>([[], '', showChartOutliers]);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isEditingSigning, setIsEditingSigning] = useState(false);
  const openEditOrderPopup = (order: any) => {
    setEditingOrder(order);
    const currentPrice = order[0] / Number(markets[order[4]].priceFactor);
    setCurrentLimitPrice(currentPrice);
    setpopup(19);
  };
  const openEditOrderSizePopup = (order: any) => {
    setEditingOrderSize(order);

    const marketKey = order[4];
    const market = (markets as any)[marketKey];
    const isBuyOrder = order[3] === 1;

    const scaleFactor = Number(market.scaleFactor);
    const quoteDecimals = Number(market.quoteDecimals);
    const baseDecimals = Number(market.baseDecimals);

    let originalSize;

    if (isBuyOrder) {
      let quotePrice = 1;
      if (market.quoteAsset !== 'USDC') {
        const chainConfig = (settings.chainConfig as any)[activechain];
        const quotePriceKey = (market.quoteAsset == chainConfig?.wethticker ?
          chainConfig.ethticker : market.quoteAsset) + 'USDC';

        quotePrice = (trades as any)[quotePriceKey]?.[0]?.[3] /
          Number((markets as any)[quotePriceKey]?.priceFactor) || 1;
      }

      originalSize = parseFloat((order[8] * quotePrice / (scaleFactor * 10 ** quoteDecimals)).toFixed(2));
    } else {
      originalSize = parseFloat((order[2] / (10 ** baseDecimals)).toFixed(6));
    }

    setOriginalOrderSize(originalSize);
    setCurrentOrderSize(originalSize);
    setOrderSizePercent(100);
    setHasEditedSize(false);
    setpopup(20);
  };
  const handleEditLimitPriceConfirm = async () => {
    if (isEditingSigning || !editingOrder) return;

    try {
      setIsEditingSigning(true);
      await handleSetChain();
      const scaledPrice = Math.round(currentLimitPrice * Number(markets[editingOrder[4]].priceFactor));

      const hash = await sendUserOperationAsync({
        uo: replaceOrder(
          router,
          BigInt(0),
          (editingOrder[3] == 1 ? markets[editingOrder[4]].quoteAsset : markets[editingOrder[4]].baseAsset) == settings.chainConfig[activechain].ethticker ? settings.chainConfig[activechain].weth : editingOrder[3] == 1 ? markets[editingOrder[4]].quoteAddress : markets[editingOrder[4]].baseAddress,
          (editingOrder[3] == 1 ? markets[editingOrder[4]].baseAsset : markets[editingOrder[4]].quoteAsset) == settings.chainConfig[activechain].ethticker ? settings.chainConfig[activechain].weth : editingOrder[3] == 1 ? markets[editingOrder[4]].baseAddress : markets[editingOrder[4]].quoteAddress,
          false,
          BigInt(editingOrder[0]),
          BigInt(editingOrder[1]),
          BigInt(scaledPrice),
          BigInt(0),
          usedRefAddress
        )
      });

      await waitForTxReceipt(hash.hash);
      refetch();
      setpopup(0);
      setEditingOrder(null);
    } catch (error) {
      console.error('Error editing order:', error);
      const originalPrice = editingOrder[0] / Number(markets[editingOrder[4]].priceFactor);
      setCurrentLimitPrice(originalPrice);
    } finally {
      setIsEditingSigning(false);
    }
  };

  const [editingOrderSize, setEditingOrderSize] = useState<any>(null);
  const [currentOrderSize, setCurrentOrderSize] = useState<number>(0);
  const [hasEditedSize, setHasEditedSize] = useState(false);
  const [isEditingSizeSigning, setIsEditingSizeSigning] = useState(false);

  const handleEditOrderSizeConfirm = async () => {
    if (isEditingSizeSigning || !editingOrderSize) return;

    try {
      setIsEditingSizeSigning(true);
      await handleSetChain();
      const tokenAddress = editingOrderSize[3] === 1
        ? markets[editingOrderSize[4]].quoteAddress
        : markets[editingOrderSize[4]].baseAddress;
      const tokenDecimals = Number(tokendict[tokenAddress].decimals);
      const scaledSize = BigInt(
        Math.round(currentOrderSize * 10 ** tokenDecimals)
      );
      const hash = await sendUserOperationAsync({
        uo: replaceOrder(
          router,
          BigInt(0),
          (
            (editingOrderSize[3] === 1
              ? markets[editingOrderSize[4]].quoteAsset
              : markets[editingOrderSize[4]].baseAsset
            ) === settings.chainConfig[activechain].ethticker
              ? settings.chainConfig[activechain].weth
              : editingOrderSize[3] === 1
                ? markets[editingOrderSize[4]].quoteAddress
                : markets[editingOrderSize[4]].baseAddress
          ),
          (
            (editingOrderSize[3] === 1
              ? markets[editingOrderSize[4]].baseAsset
              : markets[editingOrderSize[4]].quoteAsset
            ) === settings.chainConfig[activechain].ethticker
              ? settings.chainConfig[activechain].weth
              : editingOrderSize[3] === 1
                ? markets[editingOrderSize[4]].baseAddress
                : markets[editingOrderSize[4]].quoteAddress
          ),
          false,
          BigInt(editingOrderSize[0]),
          BigInt(editingOrderSize[1]),
          BigInt(editingOrderSize[0]),
          scaledSize,
          usedRefAddress
        )
      });

      await waitForTxReceipt(hash.hash);
      refetch();
      setpopup(0);
      setEditingOrderSize(null);

    } catch (error) {
      console.error('Error editing order size:', error);
      setCurrentOrderSize(originalOrderSize);
    } finally {
      setIsEditingSizeSigning(false);
    }
  };

  const { chartData, portChartLoading } = usePortfolioData(
    address,
    Object.values(tokendict),
    chartDays,
    tokenBalances,
    setTotalAccountValue,
    marketsData,
    stateIsLoading,
    (popup == 4 && connected) || location.pathname.slice(1) == 'portfolio'
  );
  const [isVertDragging, setIsVertDragging] = useState(false);
  const [trades, setTrades] = useState<
    [boolean, string, number, string, string][]
  >([]);
  const [spreadData, setSpreadData] = useState({});
  const [activeSection, setActiveSection] = useState<
    'orders' | 'tradeHistory' | 'orderHistory' | 'balances'
  >(() => {
    const section = localStorage.getItem('crystal_oc_tab');
    return ['orders', 'tradeHistory', 'orderHistory', 'balances'].includes(
      String(section),
    )
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
  const [_processedLogs, setProcessedLogs] = useState<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const emptyFunction = useCallback(() => { }, []);
  const memoizedTokenList = useMemo(
    () => Object.values(tokendict),
    [tokendict],
  );
  const memoizedSortConfig = useMemo(() => ({ column: 'balance', direction: 'desc' }), []);
  const [isMobileDragging, setIsMobileDragging] = useState(false);
  const [mobileDragY, setMobileDragY] = useState(0);
  const [mobileStartY, setMobileStartY] = useState(0);
  const [currentLimitPrice, setCurrentLimitPrice] = useState<number>(0);
  const lastRefGroupFetch = useRef(0);
  const blockNumber = useRef(0n);

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<any>(null);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [keybindError, setKeybindError] = useState<string | null>(null);
  const [duplicateKeybind, setDuplicateKeybind] = useState<string | null>(null);

  const [keybinds, setKeybinds] = useState(() => {
    const saved = localStorage.getItem('crystal_keybinds');
    return saved ? JSON.parse(saved) : {
      submitTransaction: 'Enter',
      switchTokens: 'KeyZ',
      maxAmount: 'KeyA',
      focusInput: 'KeyF',
      openSettings: 'KeyP',
      openWallet: 'KeyI',
      openTokenInSelect: 'KeyQ',
      openTokenOutSelect: 'KeyE',
      cancelAllOrders: 'KeyC',
      cancelTopOrder: 'KeyX',
      openPortfolio: 'KeyP',
      openLeaderboard: 'KeyL',
      openReferrals: 'KeyO',
      toggleFavorite: 'KeyM',
      toggleSimpleView: 'KeyV',
      refreshQuote: 'KeyR',
      switchToOrders: 'Digit1',
      switchToTrades: 'Digit2',
      switchToHistory: 'Digit3',
    };
  });

  const [editingKeybind, setEditingKeybind] = useState<string | null>(null);
  const [isListeningForKey, setIsListeningForKey] = useState(false);
  const [mainWalletBalances, setMainWalletBalances] = useState<any>({})
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0);

  const scrollToToken = (index: number) => {
    const tokenListContainer = document.querySelector('.tokenlist');
    if (!tokenListContainer) return;

    const tokenButtons = tokenListContainer.querySelectorAll('.tokenbutton');
    const selectedButton = tokenButtons[index];

    if (selectedButton) {
      selectedButton.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
      });
    }
  };

  const handleTokenSelectKeyDown = (e: React.KeyboardEvent) => {
    const currentTokenList = Object.values(tokendict).filter(
      (token) =>
        token.ticker.toLowerCase().includes(tokenString.toLowerCase()) ||
        token.name.toLowerCase().includes(tokenString.toLowerCase()) ||
        token.address.toLowerCase().includes(tokenString.toLowerCase())
    );

    if (!currentTokenList || currentTokenList.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedTokenIndex((prev) => {
          const newIndex = prev < currentTokenList.length - 1 ? prev + 1 : prev;
          scrollToToken(newIndex);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedTokenIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : prev;
          scrollToToken(newIndex);
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (currentTokenList[selectedTokenIndex]) {
          const tokenButtons = document.querySelectorAll('.tokenbutton');
          if (tokenButtons[selectedTokenIndex]) {
            (tokenButtons[selectedTokenIndex] as HTMLElement).click();
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setpopup(0);
        settokenString('');
        break;
    }
  };

  const [orderSizeString, setOrderSizeString] = useState('');

  const displayValue = hasEditedSize
    ? orderSizeString
    : (originalOrderSize === 0 ? '' : originalOrderSize.toString());

  const [hasEditedPrice, setHasEditedPrice] = useState(false);

  const displayLimitPrice = hasEditedPrice
    ? limitPriceString
    : (currentLimitPrice === 0 ? '' : currentLimitPrice.toString());
  type AudioGroups = 'swap' | 'order' | 'transfer' | 'approve';

  interface AudioGroupSettings {
    swap: boolean;
    order: boolean;
    transfer: boolean;
    approve: boolean;
  }

  const defaultGroups: AudioGroupSettings = {
    swap: true,
    order: true,
    transfer: true,
    approve: true,
  };

  const [audioGroups, setAudioGroups] = useState<AudioGroupSettings>(() => {
    const saved = localStorage.getItem('crystal_audio_groups');
    return saved ? JSON.parse(saved) : defaultGroups;
  });

  const audioGroupsRef = useRef(audioGroups);

  useEffect(() => {
    audioGroupsRef.current = audioGroups;
  }, [audioGroups]);

  const toggleAudioGroup = (group: AudioGroups) => {
    setAudioGroups(prev => {
      const next = { ...prev, [group]: !prev[group] };
      audioGroupsRef.current = next;
      localStorage.setItem('crystal_audio_groups', JSON.stringify(next));
      return next;
    });
  };

  function getGroupForAction(action: string): AudioGroups {
    if (action === 'swap' || action === 'swapFailed') return 'swap';
    if (['limit', 'fill', 'cancel', 'limitFailed'].includes(action)) return 'order';
    if (['send', 'sendFailed', 'wrap', 'unwrap', 'stake'].includes(action)) return 'transfer';
    if (action === 'approve') return 'approve';
    return 'swap';
  }
  const shouldPlayAudio = (action: string): boolean => {
    const currentAudioGroups = audioGroupsRef.current;
    if (!isAudioEnabled) {
      return false;
    }
    const group = getGroupForAction(action);
    return currentAudioGroups[group];
  };

  // refs
  const popupref = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeCallbackRef = useRef<any>({});
  const initialMousePosRef = useRef(0);
  const initialHeightRef = useRef(0);
  const txPending = useRef(false);

  // more constants
  const languageOptions = [
    { code: 'EN', name: 'English' },
    { code: 'ES', name: 'Español' },
    { code: 'CN', name: '中文' },
    { code: 'JP', name: '日本語' },
    { code: 'KR', name: '한국어' },
    { code: 'RU', name: 'русский' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'VN', name: 'Tiếng Việt' },
    { code: 'PH', name: 'Filipino' },
  ];

  const isWrap =
    (tokenIn == eth && tokenOut == weth) ||
    (tokenIn == weth && tokenOut == eth);

  const loading =
    (stateloading ||
    tradesloading ||
    addressinfoloading) && false;


  const [sendAmountIn, setSendAmountIn] = useState(BigInt(0));
  const [sendInputAmount, setSendInputAmount] = useState('');
  const [sendUsdValue, setSendUsdValue] = useState('');
  const [sendTokenIn, setSendTokenIn] = useState(eth);
  const [isSigning, setIsSigning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<
    'volume' | 'price' | 'change' | 'favorites' | null
  >('volume');
  const [sortDirection, setSortDirection] = useState<
    'asc' | 'desc' | undefined
  >('desc');
  const { toggleFavorite } = useSharedContext();

  const audio = useMemo(() => {
    const a = new Audio(stepaudio);
    a.volume = 1;
    return a;
  }, []);

  const sortedMarkets = (marketsData.sort((a, b) => {
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
  }));

  const newTxPopup = useCallback((
    _transactionHash: any,
    _currentAction: any,
    _tokenIn: any,
    _tokenOut: any,
    _amountIn: any,
    _amountOut: any,
    _price: any = 0,
    _address: any = '',
  ) => {
    const shouldPlay = shouldPlayAudio(_currentAction);
    if (shouldPlay) {
      audio.currentTime = 0;
      audio.play().catch(console.error);
    }
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

      return [...prevTransactions, newTransaction];
    });
  }, [activechain, audio, isAudioEnabled]);

  const handleSetChain = useCallback(async () => {
    return await alchemyconfig?._internal?.wagmiConfig?.state?.connections?.entries()?.next()?.value?.[1]?.connector?.switchChain({ chainId: activechain as any });
  }, [activechain]);

  const waitForTxReceipt = useCallback(async (hash: `0x${string}`) => {
    if (!client) {
      return await Promise.race([
        new Promise<void>((resolve) => {
          txReceiptResolvers.set(hash, resolve);
        }),
        waitForTransactionReceipt(config, { hash, pollingInterval: 500 }).then((r) => {
          txReceiptResolvers.delete(hash);
          return r.transactionHash;
        }),
      ]);
    }
    return hash
  }, [client])

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
    if (tokenAddress == market.quoteAddress && tokenAddress == usdc) {
      return Number(amount) / 10 ** 6;
    }
    else if (tokenAddress == market.quoteAddress) {
      return Number(amount) * tradesByMarket[(market.quoteAsset == wethticker ? ethticker : market.quoteAsset) + 'USDC']?.[0]?.[3]
        / Number(markets[(market.quoteAsset == wethticker ? ethticker : market.quoteAsset) + 'USDC']?.priceFactor) / 10 ** 18;
    }
    const latestPrice = fetchLatestPrice(trades, market);
    if (!latestPrice) return 0;
    const quotePrice = market.quoteAsset == 'USDC' ? 1 : tradesByMarket[(market.quoteAsset == wethticker ? ethticker : market.quoteAsset) + 'USDC']?.[0]?.[3]
      / Number(markets[(market.quoteAsset == wethticker ? ethticker : market.quoteAsset) + 'USDC']?.priceFactor)
    const usdValue = (Number(amount) * latestPrice * quotePrice / 10 ** Number(tokendict[tokenAddress].decimals));
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
    const quotePrice = market.quoteAsset == 'USDC' ? 1 : tradesByMarket[(market.quoteAsset == wethticker ? ethticker : market.quoteAsset) + 'USDC']?.[0]?.[3]
      / Number(markets[(market.quoteAsset == wethticker ? ethticker : market.quoteAsset) + 'USDC']?.priceFactor)
    return BigInt(
      Math.round(
        (usdNumeric / (latestPrice * quotePrice)) *
        10 ** Number(tokendict[tokenAddress].decimals),
      ),
    );
  };

  const [walletTokenBalances, setWalletTokenBalances] = useState({});
  const [walletTotalValues, setWalletTotalValues] = useState({});
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [subwalletBalanceLoading, setSubwalletBalanceLoading] = useState({});

  const findMarketForToken = useCallback((tokenAddress: string) => {
    for (const [marketKey, marketData] of Object.entries(markets)) {
      if (marketData.baseAddress === tokenAddress || marketData.quoteAddress === tokenAddress) {
        return { marketKey, marketData, trades: tradesByMarket[marketKey] };
      }
    }
    return null;
  }, [markets, tradesByMarket]);

  const refreshWalletBalance = useCallback(async (walletAddress: string) => {
    if (!walletAddress || !tokendict || Object.keys(tokendict).length === 0) return;

    setSubwalletBalanceLoading(prev => ({ ...prev, [walletAddress]: true }));

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const tokenAddresses = Object.values(tokendict).map((t) => t.address);

      const callData = {
        target: balancegetter,
        callData: encodeFunctionData({
          abi: CrystalDataHelperAbi,
          functionName: 'batchBalanceOf',
          args: [walletAddress as `0x${string}`, tokenAddresses]
        })
      };

      const multicallData = encodeFunctionData({
        abi: [{
          inputs: [
            { name: 'requireSuccess', type: 'bool' },
            {
              components: [
                { name: 'target', type: 'address' },
                { name: 'callData', type: 'bytes' }
              ], name: 'calls', type: 'tuple[]'
            }
          ],
          name: 'tryBlockAndAggregate',
          outputs: [
            { name: 'blockNumber', type: 'uint256' },
            { name: 'blockHash', type: 'bytes32' },
            {
              components: [
                { name: 'success', type: 'bool' },
                { name: 'returnData', type: 'bytes' }
              ], name: 'returnData', type: 'tuple[]'
            }
          ],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'tryBlockAndAggregate',
        args: [false, [callData]]
      });

      const response = await fetch(HTTP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Math.random(),
          method: 'eth_call',
          params: [{ to: settings.chainConfig[activechain].multicall3, data: multicallData }, 'latest']
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message || 'RPC Error');
      }

      if (json.result) {
        const returnData = decodeFunctionResult({
          abi: [{
            inputs: [
              { name: 'requireSuccess', type: 'bool' },
              {
                components: [
                  { name: 'target', type: 'address' },
                  { name: 'callData', type: 'bytes' }
                ], name: 'calls', type: 'tuple[]'
              }
            ],
            name: 'tryBlockAndAggregate',
            outputs: [
              { name: 'blockNumber', type: 'uint256' },
              { name: 'blockHash', type: 'bytes32' },
              {
                components: [
                  { name: 'success', type: 'bool' },
                  { name: 'returnData', type: 'bytes' }
                ], name: 'returnData', type: 'tuple[]'
              }
            ],
            stateMutability: 'view',
            type: 'function'
          }],
          functionName: 'tryBlockAndAggregate',
          data: json.result
        });

        if (returnData[2] && returnData[2][0] && returnData[2][0].success) {
          const balances = decodeFunctionResult({
            abi: CrystalDataHelperAbi,
            functionName: 'batchBalanceOf',
            data: returnData[2][0].returnData
          });

          const balanceMap: { [key: string]: bigint } = {};
          let totalValue = 0;

          tokenAddresses.forEach((tokenAddress, index) => {
            if (balances[index]) {
              balanceMap[tokenAddress] = balances[index];

              try {
                const marketInfo = findMarketForToken(tokenAddress);
                if (marketInfo && marketInfo.trades) {
                  const usdValue = calculateUSDValue(
                    balances[index],
                    marketInfo.trades,
                    tokenAddress,
                    marketInfo.marketData
                  );
                  totalValue += usdValue;
                }
              } catch (error) {
                console.warn('Error calculating USD value for', tokenAddress, error);
              }
            }
          });

          setWalletTokenBalances(prev => ({
            ...prev,
            [walletAddress]: balanceMap
          }));

          setWalletTotalValues(prev => ({
            ...prev,
            [walletAddress]: totalValue
          }));
        }
      }
    } catch (error) {
      console.error('Error refreshing wallet balance:', error);
      // Don't throw the error, just log it and continue
    } finally {
      setSubwalletBalanceLoading(prev => ({ ...prev, [walletAddress]: false }));
    }
  }, [tokendict, activechain, tradesByMarket, findMarketForToken, calculateUSDValue]);

  const forceRefreshAllWallets = useCallback(async () => {
    if (subWallets.length === 0) return;

    setWalletsLoading(true);

    try {
      // Refresh wallets one by one with delays to avoid rate limiting
      for (const wallet of subWallets) {
        await refreshWalletBalance(wallet.address);
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error('Error refreshing all wallets:', error);
    } finally {
      setWalletsLoading(false);
    }
  }, [subWallets, refreshWalletBalance]);

  const refreshDebounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (refreshDebounceRef.current) {
      clearTimeout(refreshDebounceRef.current);
    }

    if (subWallets.length > 0 && tokendict && Object.keys(tokendict).length > 0 && markets && Object.keys(markets).length > 0) {
      refreshDebounceRef.current = setTimeout(() => {
        console.log('Refreshing wallet balances for', subWallets.length, 'wallets');
        forceRefreshAllWallets();
      }, 1000);
    }

    return () => {
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current);
      }
    };
  }, [subWallets.length, Object.keys(tokendict).length, Object.keys(markets).length]);

  const handleSubwalletTransfer = useCallback(async (fromAddress: string, toAddress: string, amount: string, fromPrivateKey: string) => {
    try {
      setIsVaultDepositSigning(true);
      const originalSigner = oneCTSigner;
      setOneCTSigner(fromPrivateKey);

      const ethAmount = BigInt(Math.round(parseFloat(amount) * 1e18));

      const hash = await sendUserOperationAsync({
        uo: {
          target: toAddress as `0x${string}`,
          value: ethAmount,
          data: '0x'
        }
      });

      console.log('Subwallet transfer successful:', hash);

      // Restore original signer
      setOneCTSigner(originalSigner);

      // Refresh both wallet balances after a delay
      setTimeout(() => {
        refreshWalletBalance(fromAddress);
        refreshWalletBalance(toAddress);
      }, 2000);

    } catch (error) {
      console.error('Subwallet transfer failed:', error);
      throw error;
    } finally {
      setIsVaultDepositSigning(false);
    }
  }, [refreshWalletBalance, sendUserOperationAsync, oneCTSigner, setOneCTSigner]);

  const saveSubWallets = useCallback((wallets: { address: string; privateKey: string; }[] | ((prevState: { address: string; privateKey: string; }[]) => { address: string; privateKey: string; }[])) => {
    setSubWallets((prevWallets) => {
      const newWallets = typeof wallets === 'function' ? wallets(prevWallets) : wallets;
      saveSubWalletsToStorage(newWallets);
      return newWallets;
    });
  }, [saveSubWalletsToStorage]);

  // on market select
  const onMarketSelect = useCallback((market: { quoteAddress: any; baseAddress: any; }) => {
    if (!['swap', 'limit', 'send', 'scale', 'market'].includes(location.pathname.slice(1))) {
      if (simpleView) {
        navigate('/swap');
      }
      else {
        navigate('/market');
      }
    }

    setTokenIn(market.quoteAddress);
    setTokenOut(market.baseAddress);
    setswitched(false);
    setInputString('');
    setsendInputString('');
    setamountIn(BigInt(0));
    setSliderPercent(0);
    setamountOutSwap(BigInt(0));
    setoutputString('');
    setlimitChase(true);
    setScaleStart(BigInt(0))
    setScaleEnd(BigInt(0))
    setScaleStartString('')
    setScaleEndString('')
    const slider = document.querySelector('.balance-amount-slider');
    const popup = document.querySelector('.slider-percentage-popup');
    if (slider && popup) {
      (popup as HTMLElement).style.left = `${15 / 2}px`;
    }
  }, [location.pathname, simpleView]);

  // update limit amount
  const updateLimitAmount = useCallback((price: number, priceFactor: number) => {
    let newPrice = BigInt(Math.round(price * priceFactor));
    setlimitPrice(newPrice);
    setlimitPriceString(price.toFixed(Math.floor(Math.log10(priceFactor))));
    setlimitChase(false);
    if (location.pathname.slice(1) == 'limit') {
      if (switched) {
        debouncedSetAmount(
          newPrice !== BigInt(0) && amountOutSwap !== BigInt(0)
            ? tokenIn === activeMarket?.baseAddress
              ? (amountOutSwap *
                (activeMarket.scaleFactor || BigInt(1))) /
              newPrice
              : (amountOutSwap * newPrice) /
              (activeMarket.scaleFactor || BigInt(1))
            : BigInt(0),
        );
        setInputString(
          (newPrice !== BigInt(0) && amountOutSwap !== BigInt(0)
            ? tokenIn === activeMarket?.baseAddress
              ? customRound(
                Number(
                  (amountOutSwap *
                    (activeMarket.scaleFactor || BigInt(1))) /
                  newPrice,
                ) /
                10 ** Number(tokendict[tokenIn].decimals),
                3,
              )
              : customRound(
                Number(
                  (amountOutSwap * newPrice) /
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
                  (newPrice !== BigInt(0) &&
                    amountOutSwap !== BigInt(0)
                    ? tokenIn === activeMarket?.baseAddress
                      ? (amountOutSwap *
                        (activeMarket.scaleFactor ||
                          BigInt(1))) /
                      newPrice
                      : (amountOutSwap * newPrice) /
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
      else {
        setamountOutSwap(
          newPrice != BigInt(0) && amountIn != BigInt(0)
            ? tokenIn === activeMarket?.baseAddress
              ? (amountIn * newPrice) / (activeMarket.scaleFactor || BigInt(1))
              : (amountIn * (activeMarket.scaleFactor || BigInt(1))) / newPrice
            : BigInt(0),
        );
        setoutputString(
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
      }
    }
  }, [activeMarket?.scaleFactor,
  activeMarket?.baseAddress,
    switched,
    amountIn,
    amountOutSwap,
    tokenIn,
    tokenOut,
  tokenBalances[tokenIn],
    tokendict,
  location.pathname.slice(1),
  ]);

  // set amount for a token
  const debouncedSetAmount = (amount: bigint) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setStateIsLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      setamountIn(amount);
      debounceTimerRef.current = null;
    }, 300);
  };

  // set amountout for a token
  const debouncedSetAmountOut = (amount: bigint) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setStateIsLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      setamountOutSwap(amount);
      debounceTimerRef.current = null;
    }, 300);
  };

  // data loop, reuse to have every single rpc call method in this loop
  const { data: rpcQueryData, isLoading, dataUpdatedAt, refetch } = useQuery({
    queryKey: [
      'crystal_rpc_reads',
      switched,
      String(amountOutSwap),
      String(amountIn),
      tokenIn,
      tokenOut,
      address,
      activeMarketKey,
      isStake,
    ],
    queryFn: async () => {
      let gasEstimateCall: any = null;
      let gasEstimate: bigint = 0n;

      if (address && (amountIn || amountOutSwap)) {
        try {
          const deadline = BigInt(Math.floor(Date.now() / 1000) + 900);

          const path = activeMarket.path[0] === tokenIn ? activeMarket.path : [...activeMarket.path].reverse();

          let tx: any = null;

          if (tokenIn === eth && tokenOut === weth) {
            tx = wrapeth(amountIn, weth);
          } else if (tokenIn === weth && tokenOut === eth) {
            tx = unwrapeth(amountIn, weth);
          } else if (tokenIn === eth && tokendict[tokenOut]?.lst && isStake) {
            tx = stake(tokenOut, address, amountIn);
          } else if (orderType === 1 || multihop) {
            const slippageAmount = !switched
              ? (amountOutSwap * slippage + 5000n) / 10000n
              : (amountIn * 10000n + slippage / 2n) / slippage;

            if (tokenIn === eth && tokenOut !== eth) {
              tx = !switched
                ? swapExactETHForTokens(router, amountIn, slippageAmount, path, address, deadline, usedRefAddress)
                : swapETHForExactTokens(router, amountOutSwap, slippageAmount, path, address, deadline, usedRefAddress);
            } else if (tokenIn !== eth && tokenOut === eth) {
              tx = !switched
                ? swapExactTokensForETH(router, amountIn, slippageAmount, path, address, deadline, usedRefAddress)
                : swapTokensForExactETH(router, amountOutSwap, slippageAmount, path, address, deadline, usedRefAddress);
            } else {
              tx = !switched
                ? swapExactTokensForTokens(router, amountIn, slippageAmount, path, address, deadline, usedRefAddress)
                : swapTokensForExactTokens(router, amountOutSwap, slippageAmount, path, address, deadline, usedRefAddress);
            }
          } else {
            const amount = !switched ? amountIn : amountOutSwap;
            const limitPrice = tokenIn === activeMarket.quoteAddress
              ? (lowestAsk * 10000n + slippage / 2n) / slippage
              : (highestBid * slippage + 5000n) / 10000n;

            tx = _swap(
              router,
              tokenIn === eth
                ? (!switched ? amountIn : BigInt((amountIn * 10000n + slippage / 2n) / slippage))
                : BigInt(0),
              activeMarket.path[0] === tokenIn ? activeMarket.path.at(0) : activeMarket.path.at(1),
              activeMarket.path[0] === tokenIn ? activeMarket.path.at(1) : activeMarket.path.at(0),
              !switched,
              BigInt(0),
              amount,
              limitPrice,
              deadline,
              usedRefAddress
            );
          }

          if (tx) {
            gasEstimateCall = {
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_estimateGas',
              params: [{
                from: address as `0x${string}`,
                to: tx.target,
                data: tx.data,
                value: tx.value ? `0x${tx.value.toString(16)}` : '0x'
              }]
            };
          }
        } catch (e) {
          gasEstimateCall = null;
        }
      }

      const mainGroup: any = [
        {
          disabled: (switched ? amountOutSwap : amountIn) > maxUint256,
          to: router,
          abi: CrystalRouterAbi,
          functionName: switched ? 'getAmountsIn' : 'getAmountsOut',
          args: [
            switched ? amountOutSwap : amountIn,
            activeMarket.path[0] === tokenIn ? activeMarket.path : [...activeMarket.path].reverse()
          ]
        },
        {
          disabled: !address,
          to: tokenIn === eth ? weth : tokenIn,
          abi: TokenAbi,
          functionName: 'allowance',
          args: [
            address as `0x${string}`,
            (getMarket(activeMarket.path.at(0) as any, activeMarket.path.at(1) as any) as any).address
          ]
        },
        {
          disabled: !address,
          to: balancegetter,
          abi: CrystalDataHelperAbi,
          functionName: 'batchBalanceOf',
          args: [
            address as `0x${string}`,
            Object.values(tokendict).map((t: any) => t.address)
          ]
        },
        {
          to: router,
          abi: CrystalMarketAbi,
          functionName: 'getPriceLevelsFromMid',
          args: [activeMarket?.address, BigInt(1000000), BigInt(100)]
        },
        {
          to: balancegetter,
          abi: CrystalDataHelperAbi,
          functionName: 'getPrices',
          args: [
            Array.from(new Set(Object.values(markets).map((m: any) => m.address)))
          ]
        },
        ...(isStake && tokenIn === eth && (tokendict[tokenOut] as any)?.lst && (switched ? amountOutSwap : amountIn) > maxUint256
          ? [{
            to: tokenOut,
            abi: tokenOut === '0xe1d2439b75fb9746E7Bc6cB777Ae10AA7f7ef9c5' ? sMonAbi : shMonadAbi,
            functionName: switched ? 'convertToAssets' : 'convertToShares',
            args: [switched ? amountOutSwap : amountIn]
          }]
          : [])
      ];

      const refGroup: any = [
        {
          disabled: !address,
          to: settings.chainConfig[activechain].referralManager,
          abi: CrystalReferralAbi as any,
          functionName: 'addressToReferrer',
          args: [address],
        },
        ...Array.from(
          new Set(
            Object.values(markets).map(
              (market) => market.address as `0x${string}`
            )
          )
        ).flatMap((marketAddress: any) => ({
          to: marketAddress as `0x${string}`,
          abi: CrystalMarketAbi,
          functionName: 'accumulatedFeeQuote',
          args: [address],
        })),
        ...Array.from(
          new Set(
            Object.values(markets).map(
              (market) => market.address as `0x${string}`
            )
          )
        ).flatMap((marketAddress: any) => ({
          to: marketAddress as `0x${string}`,
          abi: CrystalMarketAbi,
          functionName: 'accumulatedFeeBase',
          args: [address],
        }))
      ]

      const oneCTDepositGroup: any = [
        {
          disabled: !scaAddress,
          to: balancegetter,
          abi: CrystalDataHelperAbi,
          functionName: 'batchBalanceOf',
          args: [
            scaAddress as `0x${string}`,
            Object.values(tokendict).map((t: any) => t.address)
          ]
        },
      ]

      const groups: any = {
        mainGroup
      };

      if (address && Date.now() - lastRefGroupFetch.current >= 9500) {
        lastRefGroupFetch.current = Date.now();
        groups.refGroup = refGroup;
      }

      if (popup == 25) {
        groups.oneCTDepositGroup = oneCTDepositGroup;
      }

      const callData: any = []
      const callMapping: any = []

      const groupResults: any = {};
      Object.keys(groups).forEach(groupKey => {
        groupResults[groupKey] = [];
      });

      Object.entries(groups).forEach(([groupKey, group]: [string, any]) => {
        group.forEach((call: any, callIndex: number) => {
          if (!call.disabled) {
            try {
              callData.push({
                target: call.to || call.address,
                callData: encodeFunctionData({
                  abi: call.abi,
                  functionName: call.functionName,
                  args: call.args
                })
              });

              callMapping.push({
                groupKey,
                callIndex
              });
            } catch (e: any) {
              while (groupResults[groupKey].length < callIndex) {
                groupResults[groupKey].push(null);
              }
              groupResults[groupKey][callIndex] = { error: e.message, result: undefined, status: "failure" };
            }
          }
          else {
            while (groupResults[groupKey].length < callIndex) {
              groupResults[groupKey].push(null);
            }
            groupResults[groupKey][callIndex] = { error: "param missing", result: undefined, status: "failure" };
          }
        });
      });

      const multicallData: any = encodeFunctionData({
        abi: [{
          inputs: [
            { name: 'requireSuccess', type: 'bool' },
            {
              components: [
                { name: 'target', type: 'address' },
                { name: 'callData', type: 'bytes' }
              ], name: 'calls', type: 'tuple[]'
            }
          ],
          name: 'tryBlockAndAggregate',
          outputs: [
            { name: 'blockNumber', type: 'uint256' },
            { name: 'blockHash', type: 'bytes32' },
            {
              components: [
                { name: 'success', type: 'bool' },
                { name: 'returnData', type: 'bytes' }
              ], name: 'returnData', type: 'tuple[]'
            }
          ],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'tryBlockAndAggregate',
        args: [false, callData]
      })

      const response: any = await fetch(HTTP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{ to: settings.chainConfig[activechain].multicall3, data: multicallData }, 'latest']
        }, ...(gasEstimateCall ? [gasEstimateCall] : [])])
      })

      const json: any = await response.json()


      const returnData: any = decodeFunctionResult({
        abi: [{
          inputs: [
            { name: 'requireSuccess', type: 'bool' },
            {
              components: [
                { name: 'target', type: 'address' },
                { name: 'callData', type: 'bytes' }
              ], name: 'calls', type: 'tuple[]'
            }
          ],
          name: 'tryBlockAndAggregate',
          outputs: [
            { name: 'blockNumber', type: 'uint256' },
            { name: 'blockHash', type: 'bytes32' },
            {
              components: [
                { name: 'success', type: 'bool' },
                { name: 'returnData', type: 'bytes' }
              ], name: 'returnData', type: 'tuple[]'
            }
          ],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'tryBlockAndAggregate',
        data: json[0].result
      })

      blockNumber.current = returnData?.[0]
      returnData?.[2]?.forEach((data: any, responseIndex: number) => {
        const { groupKey, callIndex } = callMapping[responseIndex] || {};
        if (groupKey === undefined) return;
        const originalCall = groups[groupKey][callIndex];
        while (groupResults[groupKey].length <= callIndex) {
          groupResults[groupKey].push(null);
        }
        if (data?.success == true) {
          try {
            const decodedResult = decodeFunctionResult({
              abi: originalCall.abi,
              functionName: originalCall.functionName,
              data: data?.returnData
            });
            groupResults[groupKey][callIndex] = { result: decodedResult, status: "success" };
          } catch (e: any) {
            groupResults[groupKey][callIndex] = { error: e.message, result: undefined, status: "failure" };
          }
        }
        else {
          groupResults[groupKey][callIndex] = { error: 'call reverted', result: undefined, status: "failure" };
        }
      });

      if (json?.[1]?.result) {
        gasEstimate = BigInt(json[1].result)
      }

      return { readContractData: groupResults, gasEstimate: gasEstimate }
    },
    enabled: !!activeMarket && !!tokendict && !!markets,
    refetchInterval: ['market', 'limit', 'send', 'scale'].includes(location.pathname.slice(1)) && !simpleView ? 800 : 5000,
    gcTime: 0,
  })

  const handleSearchKeyDown = (
    e: ReactKeyboardEvent<HTMLInputElement>,
  ): void => {
    if (e.key === 'Enter' && sortedMarkets.length > 0) {
      e.preventDefault();
      const selectedMarket = sortedMarkets[selectedIndex];
      setSearchQuery('');
      setpopup(0);
      onMarketSelect(selectedMarket)
    } else if (e.key === 'Escape') {
      setSearchQuery('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = selectedIndex < sortedMarkets.length - 1 ? selectedIndex + 1 : selectedIndex;
      setSelectedIndex(newIndex);

      const selectedItem = document.getElementById(`search-market-item-${newIndex}`);
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }

      refocusSearchInput();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = selectedIndex > 0 ? selectedIndex - 1 : 0;
      setSelectedIndex(newIndex);

      const selectedItem = document.getElementById(`search-market-item-${newIndex}`);
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }

      refocusSearchInput();
    }
  };

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
    setSelectedTokenIndex(0);
  }, [searchQuery, tokenString, popup]);

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
        orderUsdValues[orderUsdValues.length - 1] += (amountIn - totalUsdValue)
        totalUsdValue = amountIn
      }
      setamountOutSwap(BigInt(totalTokenValue))
      setoutputString(
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
        orderSizes[orderSizes.length - 1] += (amountIn - totalTokenValue)
        totalTokenValue = amountIn
      }
      setamountOutSwap(BigInt(totalUsdValue))
      setoutputString(
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
    amountIn: bigint,
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

    let orderSizes: bigint[];
    let factorSum: number;

    if (tokenIn == activeMarket.quoteAddress) {
      factorSum = prices.reduce(
        (sum, price, i) => sum + price * (1 + ((skew - 1) * i) / (numOrders - 1)),
        0
      );
      const x = (Number(amountIn) * Number(activeMarket.scaleFactor)) / factorSum;
      orderSizes = Array.from({ length: numOrders }, (_, i) =>
        BigInt(Math.round(x * (1 + ((skew - 1) * i) / (numOrders - 1))))
      );
    } else {
      factorSum = Array.from({ length: numOrders }).reduce(
        (sum: number, _, i) => sum + (1 + ((skew - 1) * i) / (numOrders - 1)),
        0
      );
      const x = Number(amountIn) / factorSum;
      orderSizes = Array.from({ length: numOrders }, (_, i) =>
        BigInt(Math.round(x * (1 + ((skew - 1) * i) / (numOrders - 1))))
      );
    }
    const orderUsdValues: bigint[] = prices.map((price, i) =>
      ((BigInt(price) * orderSizes[i]) / activeMarket.scaleFactor))
    let totalUsdValue = orderUsdValues.reduce((sum, val) => sum + val, BigInt(0));
    let totalTokenValue = orderSizes.reduce((sum, val) => sum + val, BigInt(0));
    if (tokenIn == activeMarket.quoteAddress) {
      if (totalUsdValue != amountIn) {
        orderUsdValues[orderUsdValues.length - 1] += amountIn - totalUsdValue
      }
    }
    else {
      if (totalTokenValue != amountIn) {
        orderSizes[orderSizes.length - 1] += amountIn - totalTokenValue
      }
    }
    return prices.map((price, i) => [price, orderSizes[i], orderUsdValues[i]])
  }

  const calculateScaleInput = (
    desiredOutput: bigint,
    startPrice: number,
    endPrice: number,
    numOrders: number,
    skew: number,
  ): bigint => {
    if (numOrders <= 1) {
      return 0n;
    }

    const prices: bigint[] = Array.from({ length: numOrders }, (_, i) =>
      BigInt(Math.round(startPrice + ((endPrice - startPrice) * i) / (numOrders - 1)))
    );

    const weights: bigint[] = Array.from({ length: numOrders }, (_, i) =>
      BigInt(Math.round(1e8 + ((skew - 1) * i * 1e8) / (numOrders - 1)))
    );

    const S_p = prices.reduce((sum, price, i) => sum + (price * weights[i]), 0n);
    const S_w = weights.reduce((sum, w) => sum + w, 0n);

    if (S_p === 0n || S_w === 0n || desiredOutput === 0n) {
      return 0n;
    }

    let requiredInput: bigint;

    if (tokenIn === activeMarket.quoteAddress) {
      requiredInput = (desiredOutput * S_p) / (BigInt(activeMarket.scaleFactor) * S_w);
    } else {
      requiredInput = (desiredOutput * BigInt(activeMarket.scaleFactor) * S_w) / S_p;
    }

    return requiredInput;
  };

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
  const processOrders = (buyOrdersRaw: any[], sellOrdersRaw: any[]) => {
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

  const processOrdersForDisplay = (
    orders: Order[],
    amountsQuote: string,
    latestPrice: number,
    userOrders: any[],
    isBuyOrderList: boolean
  ) => {
    const priceDecimals = Math.max(
      0,
      Math.floor(Math.log10(Number(activeMarket.priceFactor))) +
      Math.floor(
        Math.log10(Number(latestPrice))
      ) + (Math.log10(Number(latestPrice)) < -1 ? Math.log10(Number(latestPrice)) + 1 : 0)
    )

    const priceMap: { [key: string]: boolean } = {};
    if (userOrders && userOrders.length > 0 && orders && orders.length > 0) {
      const filteredUserOrders = userOrders.filter((order) => {
        return isBuyOrderList == (Number(order[3]) === 1) && String(order[4]) === ((activeMarket.baseAsset == wethticker ? ethticker : activeMarket.baseAsset) + (activeMarket.quoteAsset == wethticker ? ethticker : activeMarket.quoteAsset));
      });

      filteredUserOrders.forEach((order) => {
        priceMap[Number(Number(order[0] / Number(activeMarket.priceFactor)).toFixed(
          Math.floor(Math.log10(Number(activeMarket.priceFactor)))
        ))] = true;
      });
    }

    const roundedOrders = orders.map((order) => {
      const roundedPrice = Number(Number(order.price).toFixed(
        Math.floor(Math.log10(Number(activeMarket.priceFactor)))
      ));
      const roundedSize =
        amountsQuote === 'Base'
          ? Number((order.size / order.price).toFixed(priceDecimals))
          : Number(order.size.toFixed(2));
      const roundedTotalSize =
        amountsQuote === 'Base'
          ? Number((order.totalSize / order.price).toFixed(priceDecimals))
          : Number(order.totalSize.toFixed(2));

      const userPrice = priceMap[roundedPrice] === true;

      return {
        price: roundedPrice,
        size: roundedSize,
        totalSize: roundedTotalSize,
        shouldFlash: false,
        userPrice,
      };
    });

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVertDragging) return;

      e.preventDefault();
      e.stopPropagation();

      const mouseDeltaY = e.clientY - initialMousePosRef.current;
      const newHeight = Math.max(
        234,
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
        setOrderCenterHeight(367.58);
      } else if (window.innerHeight > 960) {
        setOrderCenterHeight(324.38);
      } else if (window.innerHeight > 840) {
        setOrderCenterHeight(282.18);
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

    switch (true) {
      case location.pathname === '/portfolio':
        title = 'Portfolio | Crystal';
        break;
      case location.pathname === '/referrals':
        title = 'Referrals | Crystal';
        break;
      case location.pathname === '/leaderboard':
        title = 'Leaderboard | Crystal';
        break;
      case location.pathname === '/launchpad':
        title = 'Launchpad | Crystal';
        break;
      case location.pathname === '/explorer':
        title = 'Explorer | Crystal';
        break;
      case location.pathname.startsWith('/earn/vaults'):
        if (location.pathname === '/earn/vaults') {
          title = 'Vaults | Crystal';
        } else {
          const pathParts = location.pathname.split('/');
          if (pathParts.length >= 4) {
            const vaultAddress = pathParts[3];
            title = `Vault ${vaultAddress.slice(0, 8)}... | Crystal`;
          }
        }
        break;
      case location.pathname.startsWith('/earn'):
        if (location.pathname === '/earn' || location.pathname === '/earn/liquidity-pools') {
          title = 'Earn | Crystal';
        } else if (location.pathname.startsWith('/earn/liquidity-pools/')) {
          const pathParts = location.pathname.split('/');
          if (pathParts.length >= 4) {
            const poolIdentifier = pathParts[3];
            const [firstToken, secondToken] = poolIdentifier.split('-');
            title = `${firstToken.toUpperCase()}-${secondToken.toUpperCase()} Pool | Crystal`;
          }
        }
        break;
      case ['/swap', '/market', '/limit', '/send', '/scale'].includes(location.pathname):
        if (trades.length > 0) {
          const formattedPrice = formatSubscript(trades[0][1]);
          if (activeMarket.quoteAsset) {
            title = `${formattedPrice} - ${activeMarket.baseAsset + '/' + activeMarket.quoteAsset} | Crystal`;
          } else {
            title = `${location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2)} | Crystal`;
          }
        }
        break;
    }

    document.title = title;
  }, [trades, location.pathname, activeMarket]);

  useEffect(() => {
    if (prevOrderData && Array.isArray(prevOrderData) && prevOrderData.length >= 4) {
      try {
        const buyOrdersRaw: bigint[] = [];
        const sellOrdersRaw: bigint[] = [];

        for (let i = 2; i < prevOrderData[2].length; i += 64) {
          const chunk = prevOrderData[2].slice(i, i + 64);
          buyOrdersRaw.push(BigInt(`0x${chunk}`));
        }

        for (let i = 2; i < prevOrderData[3].length; i += 64) {
          const chunk = prevOrderData[3].slice(i, i + 64);
          sellOrdersRaw.push(BigInt(`0x${chunk}`));
        }

        const {
          buyOrders: processedBuyOrders,
          sellOrders: processedSellOrders,
        } = processOrders(buyOrdersRaw, sellOrdersRaw);

        const { roundedOrders: roundedBuy, } =
          processOrdersForDisplay(
            processedBuyOrders,
            amountsQuote,
            processedBuyOrders?.[0]?.price && processedSellOrders?.[0]?.price ? (processedBuyOrders?.[0]?.price + processedSellOrders?.[0]?.price) / 2 : processedBuyOrders?.[0]?.price,
            orders,
            true,
          );
        const {
          roundedOrders: roundedSell,
        } = processOrdersForDisplay(
          processedSellOrders,
          amountsQuote,
          processedBuyOrders?.[0]?.price && processedSellOrders?.[0]?.price ? (processedBuyOrders?.[0]?.price + processedSellOrders?.[0]?.price) / 2 : processedSellOrders?.[0]?.price,
          orders,
          false,
        );

        const prevBuyMap = new Map(roundedBuyOrders?.orders?.map((o, i) => [`${o.price}_${o.size}`, i]));
        const prevSellMap = new Map(roundedSellOrders?.orders?.map((o, i) => [`${o.price}_${o.size}`, i]));

        for (let i = 0; i < roundedBuy.length; i++) {
          const prevIndex = prevBuyMap.get(`${roundedBuy[i].price}_${roundedBuy[i].size}`);
          if (prevIndex === undefined || (i === 0 && prevIndex !== 0)) {
            roundedBuy[i].shouldFlash = true;
          }
        }

        for (let i = 0; i < roundedSell.length; i++) {
          const prevIndex = prevSellMap.get(`${roundedSell[i].price}_${roundedSell[i].size}`);
          if (prevIndex === undefined || (i === 0 && prevIndex !== 0)) {
            roundedSell[i].shouldFlash = true;
          }
        }

        setRoundedBuyOrders({ orders: roundedBuy, key: activeMarketKey });
        setRoundedSellOrders({ orders: roundedSell, key: activeMarketKey });
      } catch (error) {
        console.error(error);
      }
    }
  }, [amountsQuote]);

  useLayoutEffect(() => {
    const data = rpcQueryData?.readContractData?.mainGroup;
    const refData = rpcQueryData?.readContractData?.refGroup;
    const oneCTDepositData = rpcQueryData?.readContractData?.oneCTDepositGroup;
    if (!isLoading && data) {
      if (!txPending.current && !debounceTimerRef.current) {
        if (data?.[1]?.result != null) {
          setallowance(data[1].result);
        }
        let tempbalances = tokenBalances
        if (data?.[2]?.result || !address) {
          tempbalances = Object.values(tokendict).reduce((acc, token, i) => {
            const balance = data[2].result?.[i] || BigInt(0);
            acc[token.address] = balance;
            return acc;
          }, {});
          if (stateloading || sliderPercent == 0) {
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
        }
        if (tokenIn === eth && tokendict[tokenOut]?.lst && isStake) {
          setStateIsLoading(false);
          setstateloading(false);
          const stakeResult = data?.[5]?.result as bigint | undefined;
          if (stakeResult !== undefined && (location.pathname.slice(1) == 'swap' || location.pathname.slice(1) == 'market')) {
            if (switched === false) {
              setamountOutSwap(stakeResult);
              setoutputString(
                stakeResult === 0n
                  ? ''
                  : customRound(
                    Number(stakeResult) /
                    10 ** Number(tokendict[tokenOut].decimals),
                    3,
                  ).toString(),
              );
            } else {
              setamountIn(stakeResult);
              setInputString(
                stakeResult === 0n
                  ? ''
                  : customRound(
                    Number(stakeResult) /
                    10 ** Number(tokendict[tokenIn].decimals),
                    3,
                  ).toString(),
              );
              const percentage = !tempbalances[tokenIn]
                ? 0
                : Math.min(
                  100,
                  Math.floor(
                    Number((stakeResult * BigInt(100)) / tempbalances[tokenIn]),
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
          }
        } else if (data?.[0]?.result || (data?.[0]?.error == 'call reverted') || (data?.[0]?.error == 'param missing')) {
          setStateIsLoading(false);
          setstateloading(false);
          if (switched == false && !isWrap && (location.pathname.slice(1) == 'swap' || location.pathname.slice(1) == 'market')) {
            const outputValue = BigInt(data[0].result?.at(-1) || BigInt(0));
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
          } else if (!isWrap && (location.pathname.slice(1) == 'swap' || location.pathname.slice(1) == 'market')) {
            let inputValue;
            if (BigInt(data[0].result?.at(-1) || BigInt(0)) != amountOutSwap) {
              inputValue = BigInt(0);
            } else {
              inputValue = BigInt(data[0].result?.[0] || BigInt(0));
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
        }
      }
      let tempmids = mids;
      if (data?.[4]?.result) {
        tempmids = Object.keys(markets).filter((key) => {
          return !(
            key.startsWith(wethticker) || key.endsWith(wethticker)
          );
        }).reduce(
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
      if (data?.[3]?.result) {
        sethighestBid((data as any)[3].result[0] || BigInt(0));
        setlowestAsk((data as any)[3].result[1] || BigInt(0));
        const orderdata = data[3].result;
        setPrevOrderData(orderdata as any);
        if (orderdata && Array.isArray(orderdata) && orderdata.length >= 4 && !(orderdata[0] == prevOrderData[0] &&
          orderdata[1] == prevOrderData[1] &&
          orderdata[2]?.toLowerCase() == prevOrderData[2]?.toLowerCase() &&
          orderdata[3]?.toLowerCase() == prevOrderData[3]?.toLowerCase())) {
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

            const { roundedOrders: roundedBuy, defaultOrders: liquidityBuy } =
              processOrdersForDisplay(
                processedBuyOrders,
                amountsQuote,
                processedBuyOrders?.[0]?.price && processedSellOrders?.[0]?.price ? (processedBuyOrders?.[0]?.price + processedSellOrders?.[0]?.price) / 2 : processedBuyOrders?.[0]?.price,
                orders,
                true,
              );
            const {
              roundedOrders: roundedSell,
              defaultOrders: liquiditySell,
            } = processOrdersForDisplay(
              processedSellOrders,
              amountsQuote,
              processedBuyOrders?.[0]?.price && processedSellOrders?.[0]?.price ? (processedBuyOrders?.[0]?.price + processedSellOrders?.[0]?.price) / 2 : processedSellOrders?.[0]?.price,
              orders,
              false,
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
                      Math.floor(Math.log10(Number(activeMarket.priceFactor))) + 1,
                    ),
                  )
                  : NaN,
            };

            const prevBuyMap = new Map(roundedBuyOrders?.orders?.map((o, i) => [`${o.price}_${o.size}`, i]));
            const prevSellMap = new Map(roundedSellOrders?.orders?.map((o, i) => [`${o.price}_${o.size}`, i]));

            for (let i = 0; i < roundedBuy.length; i++) {
              const prevIndex = prevBuyMap.get(`${roundedBuy[i].price}_${roundedBuy[i].size}`);
              if (prevIndex === undefined || (i === 0 && prevIndex !== 0)) {
                roundedBuy[i].shouldFlash = true;
              }
            }

            for (let i = 0; i < roundedSell.length; i++) {
              const prevIndex = prevSellMap.get(`${roundedSell[i].price}_${roundedSell[i].size}`);
              if (prevIndex === undefined || (i === 0 && prevIndex !== 0)) {
                roundedSell[i].shouldFlash = true;
              }
            }

            setSpreadData(spread);
            setRoundedBuyOrders({ orders: roundedBuy, key: activeMarketKey });
            setRoundedSellOrders({ orders: roundedSell, key: activeMarketKey });
            setLiquidityBuyOrders({ orders: liquidityBuy, market: activeMarket.address });
            setLiquiditySellOrders({ orders: liquiditySell, market: activeMarket.address });

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
      if (refData && Object.keys(tempmids).length > 0) {
        setUsedRefAddress(
          refData[0]?.result as any || '0x0000000000000000000000000000000000000000',
        );
        setClaimableFees(() => {
          let newFees = {};
          let totalFees = 0;
          const baseOffset = new Set(
            Object.values(markets).map(
              (market) => market.address as `0x${string}`
            )
          ).size
          Array.from(
            Object.values(markets).reduce((acc, market: any) => {
              if (!acc.has(market.address)) acc.set(market.address, market);
              return acc;
            }, new Map<string, any>()).values()
          ).forEach((market: any, index) => {
            if (
              tempmids !== null &&
              market !== null
            ) {
              const quoteIndex = index;
              const baseIndex = index + baseOffset;
              const quotePrice = market.quoteAsset == 'USDC' ? 1 : Number(tempmids[(market.quoteAsset == wethticker ? ethticker : market.quoteAsset) + 'USDC']?.[0])
                / Number(markets[(market.quoteAsset == wethticker ? ethticker : market.quoteAsset) + 'USDC']?.priceFactor)
              const midValue = Number(
                (tempmids?.[`${market.baseAsset}${market.quoteAsset}`]?.[0]) || 0,
              ) * quotePrice;

              if (!(newFees as any)[market.quoteAsset]) {
                (newFees as any)[market.quoteAsset] =
                  Number(refData[quoteIndex + 1].result) /
                  10 ** Number(market.quoteDecimals);
                totalFees +=
                  Number(refData[quoteIndex + 1].result) /
                  10 ** Number(market.quoteDecimals);
              } else {
                (newFees as any)[market.quoteAsset] +=
                  Number(refData[quoteIndex + 1].result) /
                  10 ** Number(market.quoteDecimals);
                totalFees +=
                  Number(refData[quoteIndex + 1].result) /
                  10 ** Number(market.quoteDecimals);
              }

              if (!(newFees as any)[market.baseAsset]) {
                (newFees as any)[market.baseAsset] =
                  Number(refData[baseIndex + 1].result) /
                  10 ** Number(market.baseDecimals);
                totalFees +=
                  (Number(refData[baseIndex + 1].result) * midValue) /
                  Number(market.scaleFactor) /
                  10 ** Number(market.quoteDecimals);
              } else {
                (newFees as any)[market.baseAsset] +=
                  Number(refData[baseIndex + 1].result) /
                  10 ** Number(market.baseDecimals);
                totalFees +=
                  (Number(refData[baseIndex + 1].result) * midValue) /
                  Number(market.scaleFactor) /
                  10 ** Number(market.quoteDecimals);
              }
            }
          });
          setTotalClaimableFees(totalFees || 0);
          return newFees;
        });
      }
      if (oneCTDepositData?.[0]?.result || !scaAddress) {
        let tempbalances = mainWalletBalances;
        tempbalances = Object.values(tokendict).reduce((acc, token, i) => {
          const balance = oneCTDepositData?.[0]?.result?.[i] || BigInt(0);
          acc[token.address] = balance;
          return acc;
        }, {});
        setMainWalletBalances(tempbalances);
      }
    } else {
      setStateIsLoading(true);
    }
  }, [rpcQueryData?.readContractData, activechain, isLoading, dataUpdatedAt, location.pathname.slice(1)]);

  // update display values when loading is finished
  useLayoutEffect(() => {
    if (!isLoading && !stateIsLoading && Object.keys(mids).length > 0) {
      setDisplayValuesLoading(false);
      if (location.pathname.slice(1) == 'swap' || location.pathname.slice(1) == 'market') {
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
                mid = Number(mids[(market.baseAsset + market.quoteAsset).replace(
                  new RegExp(
                    `^${wethticker}|${wethticker}$`,
                    'g'
                  ),
                  ethticker
                )][2]);
                price *= mid / Number(market.priceFactor);
              } else {
                mid = Number(mids[(market.baseAsset + market.quoteAsset).replace(
                  new RegExp(
                    `^${wethticker}|${wethticker}$`,
                    'g'
                  ),
                  ethticker
                )][1]);
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
            : `${estPrice.toFixed(Math.floor(Math.log10(Number(activeMarket.priceFactor))))} USDC`,
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
              mid = Number(mids[(market.baseAsset + market.quoteAsset).replace(
                new RegExp(
                  `^${wethticker}|${wethticker}$`,
                  'g'
                ),
                ethticker
              )][0]);
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
                !isWrap && !((tokenIn == eth && tokendict[tokenOut]?.lst == true) && isStake) &&
                BigInt(rpcQueryData?.readContractData?.mainGroup?.[0].result?.at(0) || BigInt(0)) != amountIn)) &&
            connected &&
            userchain == activechain,
          );
          setSwapButton(
            connected && userchain == activechain
              ? (switched &&
                amountOutSwap != BigInt(0) &&
                amountIn == BigInt(0)) ||
                ((orderType == 1 || multihop) &&
                  !isWrap && !((tokenIn == eth && tokendict[tokenOut]?.lst == true) && isStake) &&
                  BigInt(rpcQueryData?.readContractData?.mainGroup?.[0].result?.at(0) || BigInt(0)) != amountIn)
                ? 0
                : amountIn === BigInt(0)
                  ? 1
                  : amountIn <= tokenBalances[tokenIn]
                    ? allowance < amountIn && tokenIn != eth && !isWrap && !((tokenIn == eth && tokendict[tokenOut]?.lst == true) && isStake)
                      ? 6
                      : 2
                    : 3
              : connected
                ? 4
                : 5,
          );
          setwarning(
            !isWrap && !((tokenIn == eth && tokendict[tokenOut]?.lst == true) && isStake) &&
              ((amountIn == BigInt(0) && amountOutSwap != BigInt(0)) ||
                ((orderType == 1 || multihop) &&
                  BigInt(rpcQueryData?.readContractData?.mainGroup?.[0].result?.at(0) || BigInt(0)) != amountIn))
              ? multihop
                ? 3
                : 2
              : parseFloat(temppriceimpact.slice(0, -1)) > 5 &&
                !isWrap && !((tokenIn == eth && tokendict[tokenOut]?.lst == true) && isStake) &&
                (orderType != 0 || (slippage < BigInt(9500))) &&
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
      }
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
      setSendPopupButtonDisabled(
        (sendAmountIn === BigInt(0) ||
          sendAmountIn > tokenBalances[sendTokenIn] ||
          !/^(0x[0-9a-fA-F]{40})$/.test(recipient)) &&
        connected &&
        userchain == activechain,
      );
      setSendPopupButton(
        connected && userchain == activechain
          ? sendAmountIn === BigInt(0)
            ? 0
            : !/^(0x[0-9a-fA-F]{40})$/.test(recipient)
              ? 1
              : sendAmountIn <= tokenBalances[sendTokenIn]
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
            amountIn,
            Number(scaleStart),
            Number(scaleEnd),
            Number(scaleOrders || 2),
            Number(scaleSkew)
          ).some((order) => order[2] < activeMarket.minSize) ||
          amountIn > tokenBalances[tokenIn] ||
          (
            ((scaleStart >= lowestAsk &&
              tokenIn == activeMarket.quoteAddress && (addliquidityonly || tokenIn == eth)) ||
              (scaleStart <= highestBid &&
                tokenIn == activeMarket.baseAddress && (addliquidityonly || tokenIn == eth)) || (scaleEnd >= lowestAsk &&
                  tokenIn == activeMarket.quoteAddress && (addliquidityonly || tokenIn == eth)) ||
              (scaleEnd <= highestBid &&
                tokenIn == activeMarket.baseAddress && (addliquidityonly || tokenIn == eth))))) &&
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
                    tokenIn == activeMarket.quoteAddress && (addliquidityonly || tokenIn == eth)) ||
                    (scaleStart <= highestBid &&
                      tokenIn == activeMarket.baseAddress && (addliquidityonly || tokenIn == eth)))
                    ? tokenIn == activeMarket.quoteAddress
                      ? 3
                      : 4 : ((scaleEnd >= lowestAsk &&
                        tokenIn == activeMarket.quoteAddress && (addliquidityonly || tokenIn == eth)) ||
                        (scaleEnd <= highestBid &&
                          tokenIn == activeMarket.baseAddress && (addliquidityonly || tokenIn == eth)))
                      ? tokenIn == activeMarket.quoteAddress
                        ? 5
                        : 6
                      : (
                        calculateScaleOutput(
                          amountIn,
                          Number(scaleStart),
                          Number(scaleEnd),
                          Number(scaleOrders || 2),
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
    rpcQueryData?.readContractData?.mainGroup?.[0].result?.at(0),
    recipient,
    mids,
    scaleStart,
    scaleEnd,
    scaleOrders,
    scaleSkew,
  ]);

  // trades processing
  useEffect(() => {
    const temp: Trade[] | undefined = tradesByMarket[activeMarketKey];

    let processed: [boolean, string, number, string, string][] = [];

    if (temp) {
      processed = temp.slice(0, 100).map((trade: Trade) => {
        const isBuy = trade[2] === 1;
        const { price, tradeValue } = getTradeValue(trade, activeMarket);
        const time = formatTime(trade[6]);
        const hash = trade[5];

        return [
          isBuy,
          formatCommas(
            price.toFixed(Math.floor(Math.log10(Number(activeMarket.priceFactor)))),
          ),
          tradeValue,
          time,
          hash,
        ];
      });
    }

    setTrades(processed);
  }, [tradesByMarket?.[activeMarketKey]?.[0]])

  // fetch initial address info and event stream
  useEffect(() => {
    let liveStreamCancelled = false;
    let isAddressInfoFetching = false;
    let startBlockNumber = '';
    let endBlockNumber = '';

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
                fromBlock: startBlockNumber,
                toBlock: endBlockNumber,
                address: Object.values(markets).map(
                  (market: { address: string }) => market.address,
                ),
                topics: [
                  [
                    '0xc3bcf95b5242764f3f2dc3e504ce05823a3b50c4ccef5e660d13beab2f51f2ca',
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
                fromBlock: startBlockNumber,
                toBlock: endBlockNumber,
                address: Object.values(markets).map(
                  (market: { address: string }) => market.address,
                ),
                topics: [
                  [
                    '0x1c87843c023cd30242ff04316b77102e873496e3d8924ef015475cf066c1d4f4',
                  ],
                  [
                    '0x000000000000000000000000' + address?.slice(2),
                  ],
                ],
              },
            ],
          }] : [])]),
        });
        const result = await req.json();
        if (liveStreamCancelled) return;
        startBlockNumber = '0x' + (parseInt(result[0].result, 16) - 30).toString(16);
        endBlockNumber = '0x' + (parseInt(result[0].result, 16) + 10).toString(16);
        const tradelogs = result[1].result;
        const orderlogs = result?.[2]?.result;
        let ordersChanged = false;
        let canceledOrdersChanged = false;
        let tradesByMarketChanged = false;
        let tradeHistoryChanged = false;
        let temporders: any;
        let tempcanceledorders: any;
        let temptradesByMarket: any;
        let temptradehistory: any;
        setorders((orders) => {
          temporders = [...orders];
          return orders;
        })
        setcanceledorders((canceledorders) => {
          tempcanceledorders = [...canceledorders];
          return canceledorders;
        })
        settradesByMarket((tradesByMarket: any) => {
          temptradesByMarket = { ...tradesByMarket };
          return tradesByMarket;
        })
        settradehistory((tradehistory: any) => {
          temptradehistory = [...tradehistory];
          return tradehistory;
        })
        setProcessedLogs(prev => {
          let tempset = new Set(prev);
          let temptrades: any = {};
          if (Array.isArray(orderlogs)) {
            for (const log of orderlogs) {
              const logIdentifier = `${log['transactionHash']}-${log['logIndex']}`;
              const marketKey = addresstoMarket[log['address']];
              if (!tempset.has(logIdentifier) && marketKey && log['topics'][1].slice(26) ==
                address?.slice(2).toLowerCase()) {
                if (tempset.size >= 10000) {
                  const first = tempset.values().next().value;
                  if (first !== undefined) {
                    tempset.delete(first);
                  }
                }
                tempset.add(logIdentifier);
                const resolve = txReceiptResolvers.get(log['transactionHash']);
                if (resolve) {
                  resolve();
                  txReceiptResolvers.delete(log['transactionHash']);
                }
                let _timestamp = parseInt(log['blockTimestamp'], 16);
                let _orderdata = log['data'].slice(130);
                for (let i = 0; i < _orderdata.length; i += 64) {
                  let chunk = _orderdata.slice(i, i + 64);
                  let _isplace = parseInt(chunk.slice(0, 1), 16) < 2;
                  if (_isplace) {
                    let buy = parseInt(chunk.slice(0, 1), 16);
                    let price = parseInt(chunk.slice(1, 20), 16);
                    let id = parseInt(chunk.slice(20, 32), 16);
                    let size = parseInt(chunk.slice(32, 64), 16);
                    let alreadyExist = tempcanceledorders.some(
                      (o: any) => o[0] == price && o[1] == id && o[4] == marketKey
                    );
                    if (!alreadyExist) {
                      ordersChanged = true;
                      canceledOrdersChanged = true;
                      let order = [
                        price,
                        id,
                        size /
                        price,
                        buy,
                        marketKey,
                        log['transactionHash'],
                        _timestamp,
                        0,
                        size,
                        2,
                      ];
                      temporders.push(order)
                      tempcanceledorders.push([
                        price,
                        id,
                        size /
                        price,
                        buy,
                        marketKey,
                        log['transactionHash'],
                        _timestamp,
                        0,
                        size,
                        2,
                      ])
                      let quoteasset =
                        markets[marketKey].quoteAddress;
                      let baseasset =
                        markets[marketKey].baseAddress;
                      let amountquote = (
                        size /
                        (Number(
                          markets[marketKey].scaleFactor,
                        ) *
                          10 **
                          Number(
                            markets[marketKey]
                              .quoteDecimals,
                          ))
                      ).toFixed(2);
                      let amountbase = customRound(
                        size /
                        price /
                        10 **
                        Number(
                          markets[marketKey]
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
                        `${price / Number(markets[marketKey].priceFactor)} ${markets[marketKey].quoteAsset}`,
                        '',
                      );
                    }
                  } else {
                    let buy = parseInt(chunk.slice(0, 1), 16) == 3;
                    let price = parseInt(chunk.slice(1, 20), 16);
                    let id = parseInt(chunk.slice(20, 32), 16);
                    let size = parseInt(chunk.slice(32, 64), 16);
                    let index = temporders.findIndex(
                      (o: any) =>
                        o[0] == price &&
                        o[1] == id &&
                        o[4] == marketKey,
                    );
                    if (index != -1) {
                      ordersChanged = true;
                      canceledOrdersChanged = true;
                      let canceledOrderIndex: number;
                      canceledOrderIndex = tempcanceledorders.findIndex(
                        (canceledOrder: any) =>
                          canceledOrder[0] ==
                          price &&
                          canceledOrder[1] ==
                          id &&
                          canceledOrder[4] ==
                          marketKey,
                      );
                      if (canceledOrderIndex !== -1 && tempcanceledorders[canceledOrderIndex][9] != 0) {
                        tempcanceledorders[canceledOrderIndex] = [...tempcanceledorders[canceledOrderIndex]]
                        tempcanceledorders[canceledOrderIndex][9] = 0;
                        tempcanceledorders[canceledOrderIndex][8] =
                          tempcanceledorders[canceledOrderIndex][8] -
                          size;
                        tempcanceledorders[canceledOrderIndex][6] =
                          _timestamp;
                      }
                      if (temporders[index]?.[10] && typeof temporders[index][10].remove === 'function') {
                        temporders[index] = [...temporders[index]]
                        try {
                          temporders[index][10].remove();
                        }
                        catch { }
                        temporders[index].splice(10, 1)
                      }
                      temporders.splice(index, 1);
                      let quoteasset =
                        markets[marketKey].quoteAddress;
                      let baseasset =
                        markets[marketKey].baseAddress;
                      let amountquote = (
                        size /
                        (Number(
                          markets[marketKey].scaleFactor,
                        ) *
                          10 **
                          Number(
                            markets[marketKey]
                              .quoteDecimals,
                          ))
                      ).toFixed(2);
                      let amountbase = customRound(
                        size /
                        price /
                        10 **
                        Number(
                          markets[marketKey]
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
                        `${price / Number(markets[marketKey].priceFactor)} ${markets[marketKey].quoteAsset}`,
                        '',
                      );
                    }
                  }
                }
              }
            }
          }
          if (Array.isArray(tradelogs)) {
            for (const log of tradelogs) {
              const logIdentifier = `${log['transactionHash']}-${log['logIndex']}`;
              const marketKey = addresstoMarket[log['address']];
              if (!tempset.has(logIdentifier) && marketKey && !temptradesByMarket[marketKey]?.some((trade: any) =>
                trade[0] == parseInt(log['data'].slice(2, 34), 16) &&
                trade[1] == parseInt(log['data'].slice(34, 66), 16) &&
                trade[5] == log['transactionHash'])) {
                if (tempset.size >= 10000) {
                  const first = tempset.values().next().value;
                  if (first !== undefined) {
                    tempset.delete(first);
                  }
                }
                tempset.add(logIdentifier);
                const resolve = txReceiptResolvers.get(log['transactionHash']);
                if (resolve) {
                  resolve();
                  txReceiptResolvers.delete(log['transactionHash']);
                }
                let _timestamp = parseInt(log['blockTimestamp'], 16);
                let _orderdata = log['data'].slice(258);
                for (let i = 0; i < _orderdata.length; i += 64) {
                  let chunk = _orderdata.slice(i, i + 64);
                  let price = parseInt(chunk.slice(1, 20), 16);
                  let id = parseInt(chunk.slice(20, 32), 16);
                  let size = parseInt(chunk.slice(32, 64), 16);
                  let orderIndex = temporders.findIndex(
                    (sublist: any) =>
                      sublist[0] ==
                      price &&
                      sublist[1] ==
                      id &&
                      sublist[4] == marketKey,
                  );
                  let canceledOrderIndex = tempcanceledorders.findIndex(
                    (sublist: any) =>
                      sublist[0] ==
                      price &&
                      sublist[1] ==
                      id &&
                      sublist[4] == marketKey,
                  );
                  if (orderIndex != -1 && canceledOrderIndex != -1) {
                    ordersChanged = true;
                    canceledOrdersChanged = true;
                    temporders[orderIndex] = [...temporders[orderIndex]]
                    tempcanceledorders[canceledOrderIndex] = [...tempcanceledorders[canceledOrderIndex]]
                    let order = [...temporders[orderIndex]];
                    let buy = order[3];
                    let quoteasset =
                      markets[marketKey]
                        .quoteAddress;
                    let baseasset =
                      markets[marketKey]
                        .baseAddress;
                    let amountquote = (
                      ((order[2] - order[7] - size / order[0]) *
                        order[0]) /
                      (Number(
                        markets[marketKey]
                          .scaleFactor,
                      ) *
                        10 **
                        Number(
                          markets[marketKey]
                            .quoteDecimals,
                        ))
                    ).toFixed(2);
                    let amountbase = customRound(
                      (order[2] - order[7] - size / order[0]) /
                      10 **
                      Number(
                        markets[marketKey]
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
                      `${order[0] / Number(markets[marketKey].priceFactor)} ${markets[marketKey].quoteAsset}`,
                      '',
                    );
                    if (size == 0) {
                      tradeHistoryChanged = true;
                      temptradehistory.push([
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
                        _timestamp,
                        0,
                      ]);
                      if (temporders[orderIndex]?.[10] && typeof temporders[orderIndex][10].remove === 'function') {
                        try {
                          temporders[orderIndex][10].remove();
                        }
                        catch { }
                        temporders[orderIndex].splice(10, 1)
                      }
                      temporders.splice(orderIndex, 1);
                      tempcanceledorders[canceledOrderIndex][9] =
                        1;
                      tempcanceledorders[canceledOrderIndex][7] = order[2]
                      tempcanceledorders[canceledOrderIndex][8] = order[8];
                    } else {
                      if (temporders[orderIndex]?.[10] && typeof temporders[orderIndex][10].setQuantity === 'function') {
                        try {
                          temporders[orderIndex][10].setQuantity(formatDisplay(customRound((size / order[0]) / 10 ** Number(markets[order[4]].baseDecimals), 3)))
                        }
                        catch { }
                      }
                      temporders[orderIndex][7] =
                        order[2] - size / order[0];
                      tempcanceledorders[canceledOrderIndex][7] =
                        order[2] - size / order[0];
                    }
                  }
                }
                tradesByMarketChanged = true;
                if (!Array.isArray(temptradesByMarket[marketKey])) {
                  temptradesByMarket[marketKey] = [];
                }
                let amountIn = parseInt(log['data'].slice(2, 34), 16);
                let amountOut = parseInt(log['data'].slice(34, 66), 16);
                let buy = parseInt(log['data'].slice(66, 67), 16);
                let price = parseInt(log['data'].slice(98, 130), 16);
                temptradesByMarket[marketKey].unshift([
                  amountIn,
                  amountOut,
                  buy,
                  price,
                  marketKey,
                  log['transactionHash'],
                  _timestamp,
                ]);
                if (!Array.isArray(temptrades[marketKey])) {
                  temptrades[marketKey] = [];
                }
                temptrades[marketKey].unshift([
                  amountIn,
                  amountOut,
                  buy,
                  price,
                  marketKey,
                  log['transactionHash'],
                  _timestamp,
                  parseInt(log['data'].slice(67, 98), 16),
                ])
                if (
                  log['topics'][1].slice(26) ==
                  address?.slice(2).toLowerCase()
                ) {
                  tradeHistoryChanged = true;
                  temptradehistory.push([
                    amountIn,
                    amountOut,
                    buy,
                    price,
                    marketKey,
                    log['transactionHash'],
                    _timestamp,
                    1,
                  ])
                  let quoteasset =
                    markets[marketKey].quoteAddress;
                  let baseasset =
                    markets[marketKey].baseAddress;
                  let popupAmountIn = customRound(
                    amountIn /
                    10 **
                    Number(
                      buy
                        ? markets[marketKey]
                          .quoteDecimals
                        : markets[marketKey]
                          .baseDecimals,
                    ),
                    3,
                  );
                  let popupAmountOut = customRound(
                    amountOut /
                    10 **
                    Number(
                      buy
                        ? markets[marketKey]
                          .baseDecimals
                        : markets[marketKey]
                          .quoteDecimals,
                    ),
                    3,
                  );
                  newTxPopup(
                    log['transactionHash'],
                    'swap',
                    buy ? quoteasset : baseasset,
                    buy ? baseasset : quoteasset,
                    popupAmountIn,
                    popupAmountOut,
                    '',
                    '',
                  );
                }
              }
            }
            if (tradesByMarketChanged) {
              setChartData(([existingBars, existingIntervalLabel, existingShowOutliers]) => {
                const marketKey = existingIntervalLabel?.match(/^\D*/)?.[0];
                const updatedBars = [...existingBars];
                let rawVolume;
                if (marketKey && Array.isArray(temptrades?.[marketKey])) {
                  const barSizeSec =
                    existingIntervalLabel?.match(/\d.*/)?.[0] === '1' ? 60 :
                      existingIntervalLabel?.match(/\d.*/)?.[0] === '5' ? 5 * 60 :
                        existingIntervalLabel?.match(/\d.*/)?.[0] === '15' ? 15 * 60 :
                          existingIntervalLabel?.match(/\d.*/)?.[0] === '30' ? 30 * 60 :
                            existingIntervalLabel?.match(/\d.*/)?.[0] === '60' ? 60 * 60 :
                              existingIntervalLabel?.match(/\d.*/)?.[0] === '240' ? 4 * 60 * 60 :
                                existingIntervalLabel?.match(/\d.*/)?.[0] === '1D' ? 24 * 60 * 60 :
                                  5 * 60;
                  const priceFactor = Number(markets[marketKey].priceFactor);
                  for (const lastTrade of temptrades[marketKey]) {
                    const lastBarIndex = updatedBars.length - 1;
                    const lastBar = updatedBars[lastBarIndex];

                    let openPrice = parseFloat((lastTrade[7] / priceFactor).toFixed(Math.floor(Math.log10(priceFactor))));
                    let closePrice = parseFloat((lastTrade[3] / priceFactor).toFixed(Math.floor(Math.log10(priceFactor))));
                    rawVolume =
                      (lastTrade[2] == 1 ? lastTrade[0] : lastTrade[1]) /
                      10 ** Number(markets[marketKey].quoteDecimals);

                    const tradeTimeSec = lastTrade[6];
                    const flooredTradeTimeSec = Math.floor(tradeTimeSec / barSizeSec) * barSizeSec;
                    const lastBarTimeSec = Math.floor(new Date(lastBar?.time).getTime() / 1000);
                    if (flooredTradeTimeSec === lastBarTimeSec) {
                      updatedBars[lastBarIndex] = {
                        ...lastBar,
                        high: Math.max(lastBar.high, Math.max(openPrice, closePrice)),
                        low: Math.min(lastBar.low, Math.min(openPrice, closePrice)),
                        close: closePrice,
                        volume: lastBar.volume + rawVolume,
                      };
                      if (realtimeCallbackRef.current[existingIntervalLabel]) {
                        realtimeCallbackRef.current[existingIntervalLabel]({
                          ...lastBar,
                          high: Math.max(lastBar.high, Math.max(openPrice, closePrice)),
                          low: Math.min(lastBar.low, Math.min(openPrice, closePrice)),
                          close: closePrice,
                          volume: lastBar.volume + rawVolume,
                        });
                      }
                    } else {
                      updatedBars.push({
                        time: flooredTradeTimeSec * 1000,
                        open: lastBar.close ?? openPrice,
                        high: Math.max(lastBar.close ?? openPrice, closePrice),
                        low: Math.min(lastBar.close ?? openPrice, closePrice),
                        close: closePrice,
                        volume: rawVolume,
                      });
                      if (realtimeCallbackRef.current[existingIntervalLabel]) {
                        realtimeCallbackRef.current[existingIntervalLabel]({
                          time: flooredTradeTimeSec * 1000,
                          open: lastBar.close ?? openPrice,
                          high: Math.max(lastBar.close ?? openPrice, closePrice),
                          low: Math.min(lastBar.close ?? openPrice, closePrice),
                          close: closePrice,
                          volume: rawVolume,
                        });
                      }
                    }
                  }
                }
                setMarketsData((marketsData) =>
                  marketsData.map((market) => {
                    if (!market) return;
                    const marketKey = market?.marketKey.replace(
                      new RegExp(`^${wethticker}|${wethticker}$`, 'g'),
                      ethticker
                    );
                    const newTrades = temptrades?.[marketKey]
                    if (!Array.isArray(newTrades) || newTrades.length < 1) return market;
                    const firstKlineOpen: number =
                      market?.series && Array.isArray(market?.series) && market?.series.length > 0
                        ? Number(market?.series[0].open)
                        : 0;
                    const currentPriceRaw = Number(newTrades[newTrades.length - 1][3]);
                    const percentageChange = firstKlineOpen === 0 ? 0 : ((currentPriceRaw - firstKlineOpen) / firstKlineOpen) * 100;
                    const quotePrice = market.quoteAsset == 'USDC' ? 1 : temptradesByMarket[(market.quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : market.quoteAsset) + 'USDC']?.[0]?.[3]
                      / Number(markets[(market.quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : market.quoteAsset) + 'USDC']?.priceFactor)
                    let high = market.high24h ? Number(market.high24h.replace(/,/g, '')) : null;
                    let low = market.low24h ? Number(market.low24h.replace(/,/g, '')) : null;
                    const volume = newTrades.reduce((sum: number, trade: any) => {
                      if (high && trade[3] / Number(market.priceFactor) > high) {
                        high = trade[3] / Number(market.priceFactor)
                      }
                      if (low && trade[3] / Number(market.priceFactor) < low) {
                        low = trade[3] / Number(market.priceFactor)
                      }
                      const amount = Number(trade[2] === 1 ? trade[0] : trade[1]);
                      return sum + amount;
                    }, 0) / 10 ** Number(market?.quoteDecimals) * quotePrice;

                    return {
                      ...market,
                      volume: formatCommas(
                        (parseFloat(market.volume.replace(/,/g, '')) + volume).toFixed(2)
                      ),
                      currentPrice: formatSubscript(
                        (currentPriceRaw / Number(market.priceFactor)).toFixed(Math.floor(Math.log10(Number(market.priceFactor))))
                      ),
                      priceChange: `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(2)}`,
                      priceChangeAmount: currentPriceRaw - firstKlineOpen,
                      ...(high != null && {
                        high24h: formatSubscript(
                          high.toFixed(Math.floor(Math.log10(Number(market.priceFactor))))
                        )
                      }),
                      ...(low != null && {
                        low24h: formatSubscript(
                          low.toFixed(Math.floor(Math.log10(Number(market.priceFactor))))
                        )
                      })
                    };
                  })
                );
                return [updatedBars, existingIntervalLabel, existingShowOutliers];
              });
            }
          }
          if (tradeHistoryChanged) {
            settradehistory(temptradehistory)
          }
          if (tradesByMarketChanged) {
            settradesByMarket(temptradesByMarket)
          }
          if (canceledOrdersChanged) {
            setcanceledorders(tempcanceledorders)
          }
          if (ordersChanged) {
            setorders(temporders)
          }
          return tempset;
        })
      } catch {
      }
    };

    (async () => {
      if (address) {
        if (validOneCT) {
          oneCTNonceRef.current = await getTransactionCount(config, {
            address: (address as any),
          })
        }
        setTransactions([]);
        settradehistory([]);
        setorders([]);
        setcanceledorders([]);
        setrecipient('');
        isAddressInfoFetching = true;
        try {
          const endpoint = `https://gateway.thegraph.com/api/${settings.graphKey}/subgraphs/id/6ikTAWa2krJSVCr4bSS9tv3i5nhyiELna3bE8cfgm8yn`;
          let temptradehistory: any[] = [];
          let temporders: any[] = [];
          let tempcanceledorders: any[] = [];

          const query = `
            query {
              marketFilledMaps(
                where: {
                  caller: "${address}"
                }
              ) {
                id
                orders(first: 1000, orderDirection: desc, orderBy: timeStamp) {
                  id
                  caller
                  amountIn
                  amountOut
                  buySell
                  price
                  contractAddress
                  transactionHash
                  timeStamp
                }
              }
              orders1: orderMaps(where:{caller: "${address}"}) {
                id
                batches(first: 200, orderDirection: desc, orderBy: id) {
                  id
                  orders(first: 1000, where:{status: 2}) {
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
              orders2: orderMaps(where:{caller: "${address}"}) {
                id
                batches(first: 10, orderDirection: desc, orderBy: id) {
                  id
                  orders(first: 1000, where: { status_not: 2 }) {
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
                    filledTimestamp
                    status
                  }
                }
              }
              filledMaps(where:{caller: "${address}"}) {
                id
                orders(first: 1000, orderDirection: desc, orderBy: timestamp) {
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
                  filledTimestamp
                  status
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

          if (!isAddressInfoFetching) return;
          const map = result?.data?.marketFilledMaps || [];
          for (const batch of map) {
            for (const event of batch.orders) {
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

          const updatedMaps = (result?.data?.orders1 || []).concat(result?.data?.orders2 || []).concat(result?.data?.filledMaps || []);
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
                } else if (order.status === 1) {
                  const tradeRow = [
                    order.buySell === 1 ? Number(BigInt(order.originalSizeQuote) / markets[marketKey].scaleFactor) : order.originalSizeBase,
                    order.buySell === 1 ? order.originalSizeBase : Number(BigInt(order.originalSizeQuote) / markets[marketKey].scaleFactor),
                    order.buySell,
                    parseInt(order.id.split('-')[0], 10),
                    marketKey,
                    order.transactionHash,
                    order?.filledTimestamp ? order.filledTimestamp : order.timestamp,
                    0
                  ];

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

                  temptradehistory.push(tradeRow);
                  tempcanceledorders.push(row);
                } else {
                  tempcanceledorders.push(row);
                }
              }
            }
          }

          settradehistory([...temptradehistory]);
          setorders([...temporders]);
          setcanceledorders([...tempcanceledorders]);
          setaddressinfoloading(false);
          isAddressInfoFetching = false
        } catch (error) {
          console.error("Error fetching logs:", error);
          setaddressinfoloading(false);
        }
      }
      else if (!user) {
        setSliderPercent(0)
        const slider = document.querySelector('.balance-amount-slider');
        const popup = document.querySelector('.slider-percentage-popup');
        if (slider && popup) {
          (popup as HTMLElement).style.left = `${15 / 2}px`;
        }
        setTransactions([]);
        settradehistory([]);
        setorders([]);
        setcanceledorders([]);
        setaddressinfoloading(false);
      }
    })()

    const connectWebSocket = () => {
      if (liveStreamCancelled) return;
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = async () => {
        const subscriptionMessages = [
          JSON.stringify({
            jsonrpc: '2.0',
            id: 'sub1',
            method: 'eth_subscribe',
            params: [
              'monadLogs',
              {
                address: Object.values(markets).map(
                  (market: { address: string }) => market.address,
                ),
                topics: [
                  [
                    '0xc3bcf95b5242764f3f2dc3e504ce05823a3b50c4ccef5e660d13beab2f51f2ca',
                  ],
                ],
              },
            ],
          }), ...(address?.slice(2) ? [JSON.stringify({
            jsonrpc: '2.0',
            id: 'sub2',
            method: 'eth_subscribe',
            params: [
              'monadLogs',
              {
                address: Object.values(markets).map(
                  (market: { address: string }) => market.address,
                ),
                topics: [
                  [
                    '0x1c87843c023cd30242ff04316b77102e873496e3d8924ef015475cf066c1d4f4',
                  ],
                  [
                    '0x000000000000000000000000' + address?.slice(2),
                  ],
                ],
              },
            ],
          })] : [])
        ];

        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              jsonrpc: '2.0',
              id: 'ping',
              method: 'eth_syncing'
            }));
          }
        }, 15000);

        subscriptionMessages.forEach((message) => {
          wsRef.current?.send(message);
        });

        if (blockNumber.current) {
          startBlockNumber = '0x' + (blockNumber.current - BigInt(80)).toString(16)
          endBlockNumber = '0x' + (blockNumber.current + BigInt(10)).toString(16)
        }
        else {
          let firstBlockNumber = await getBlockNumber(config);
          startBlockNumber = '0x' + (firstBlockNumber - BigInt(80)).toString(16)
          endBlockNumber = '0x' + (firstBlockNumber + BigInt(10)).toString(16)
        }
        fetchData();
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message?.params?.result) {
          const log = message?.params?.result;
          let ordersChanged = false;
          let canceledOrdersChanged = false;
          let tradesByMarketChanged = false;
          let tradeHistoryChanged = false;
          let temporders: any;
          let tempcanceledorders: any;
          let temptradesByMarket: any;
          let temptradehistory: any;
          setorders((orders) => {
            temporders = [...orders];
            return orders;
          })
          setcanceledorders((canceledorders) => {
            tempcanceledorders = [...canceledorders];
            return canceledorders;
          })
          settradesByMarket((tradesByMarket: any) => {
            temptradesByMarket = { ...tradesByMarket };
            return tradesByMarket;
          })
          settradehistory((tradehistory: any) => {
            temptradehistory = [...tradehistory];
            return tradehistory;
          })
          setProcessedLogs(prev => {
            let tempset = new Set(prev);
            let temptrades: any = {};
            if (log['topics']?.[0] == '0x1c87843c023cd30242ff04316b77102e873496e3d8924ef015475cf066c1d4f4') {
              const logIdentifier = `${log['transactionHash']}-${log['logIndex']}`;
              const marketKey = addresstoMarket[log['address']];
              if (!tempset.has(logIdentifier) && marketKey && log['topics'][1].slice(26) ==
                address?.slice(2).toLowerCase()) {
                if (tempset.size >= 10000) {
                  const first = tempset.values().next().value;
                  if (first !== undefined) {
                    tempset.delete(first);
                  }
                }
                tempset.add(logIdentifier);
                const resolve = txReceiptResolvers.get(log['transactionHash']);
                if (resolve) {
                  resolve();
                  txReceiptResolvers.delete(log['transactionHash']);
                }
                let _timestamp = Math.floor(Date.now() / 1000);
                let _orderdata = log['data'].slice(130);
                for (let i = 0; i < _orderdata.length; i += 64) {
                  let chunk = _orderdata.slice(i, i + 64);
                  let _isplace = parseInt(chunk.slice(0, 1), 16) < 2;
                  if (_isplace) {
                    let buy = parseInt(chunk.slice(0, 1), 16);
                    let price = parseInt(chunk.slice(1, 20), 16);
                    let id = parseInt(chunk.slice(20, 32), 16);
                    let size = parseInt(chunk.slice(32, 64), 16);
                    let alreadyExist = tempcanceledorders.some(
                      (o: any) => o[0] == price && o[1] == id && o[4] == marketKey
                    );
                    if (!alreadyExist) {
                      ordersChanged = true;
                      canceledOrdersChanged = true;
                      let order = [
                        price,
                        id,
                        size /
                        price,
                        buy,
                        marketKey,
                        log['transactionHash'],
                        _timestamp,
                        0,
                        size,
                        2,
                      ];
                      temporders.push(order)
                      tempcanceledorders.push([
                        price,
                        id,
                        size /
                        price,
                        buy,
                        marketKey,
                        log['transactionHash'],
                        _timestamp,
                        0,
                        size,
                        2,
                      ])
                      let quoteasset =
                        markets[marketKey].quoteAddress;
                      let baseasset =
                        markets[marketKey].baseAddress;
                      let amountquote = (
                        size /
                        (Number(
                          markets[marketKey].scaleFactor,
                        ) *
                          10 **
                          Number(
                            markets[marketKey]
                              .quoteDecimals,
                          ))
                      ).toFixed(2);
                      let amountbase = customRound(
                        size /
                        price /
                        10 **
                        Number(
                          markets[marketKey]
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
                        `${price / Number(markets[marketKey].priceFactor)} ${markets[marketKey].quoteAsset}`,
                        '',
                      );
                    }
                  } else {
                    let buy = parseInt(chunk.slice(0, 1), 16) == 3;
                    let price = parseInt(chunk.slice(1, 20), 16);
                    let id = parseInt(chunk.slice(20, 32), 16);
                    let size = parseInt(chunk.slice(32, 64), 16);
                    let index = temporders.findIndex(
                      (o: any) =>
                        o[0] == price &&
                        o[1] == id &&
                        o[4] == marketKey,
                    );
                    if (index != -1) {
                      ordersChanged = true;
                      canceledOrdersChanged = true;
                      let canceledOrderIndex: number;
                      canceledOrderIndex = tempcanceledorders.findIndex(
                        (canceledOrder: any) =>
                          canceledOrder[0] ==
                          price &&
                          canceledOrder[1] ==
                          id &&
                          canceledOrder[4] ==
                          marketKey,
                      );
                      if (canceledOrderIndex !== -1 && tempcanceledorders[canceledOrderIndex][9] != 0) {
                        tempcanceledorders[canceledOrderIndex] = [...tempcanceledorders[canceledOrderIndex]]
                        tempcanceledorders[canceledOrderIndex][9] = 0;
                        tempcanceledorders[canceledOrderIndex][8] =
                          tempcanceledorders[canceledOrderIndex][8] -
                          size;
                        tempcanceledorders[canceledOrderIndex][6] =
                          _timestamp;
                      }
                      if (temporders[index]?.[10] && typeof temporders[index][10].remove === 'function') {
                        temporders[index] = [...temporders[index]]
                        try {
                          temporders[index][10].remove();
                        }
                        catch { }
                        temporders[index].splice(10, 1)
                      }
                      temporders.splice(index, 1);
                      let quoteasset =
                        markets[marketKey].quoteAddress;
                      let baseasset =
                        markets[marketKey].baseAddress;
                      let amountquote = (
                        size /
                        (Number(
                          markets[marketKey].scaleFactor,
                        ) *
                          10 **
                          Number(
                            markets[marketKey]
                              .quoteDecimals,
                          ))
                      ).toFixed(2);
                      let amountbase = customRound(
                        size /
                        price /
                        10 **
                        Number(
                          markets[marketKey]
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
                        `${price / Number(markets[marketKey].priceFactor)} ${markets[marketKey].quoteAsset}`,
                        '',
                      );
                    }
                  }
                }
              }
            }
            else {
              const logIdentifier = `${log['transactionHash']}-${log['logIndex']}`;
              const marketKey = addresstoMarket[log['address']];
              if (!tempset.has(logIdentifier) && marketKey && !temptradesByMarket[marketKey]?.some((trade: any) =>
                trade[0] == parseInt(log['data'].slice(2, 34), 16) &&
                trade[1] == parseInt(log['data'].slice(34, 66), 16) &&
                trade[5] == log['transactionHash'])) {
                if (tempset.size >= 10000) {
                  const first = tempset.values().next().value;
                  if (first !== undefined) {
                    tempset.delete(first);
                  }
                }
                tempset.add(logIdentifier);
                const resolve = txReceiptResolvers.get(log['transactionHash']);
                if (resolve) {
                  resolve();
                  txReceiptResolvers.delete(log['transactionHash']);
                }
                let _timestamp = Math.floor(Date.now() / 1000);
                let _orderdata = log['data'].slice(258);
                for (let i = 0; i < _orderdata.length; i += 64) {
                  let chunk = _orderdata.slice(i, i + 64);
                  let price = parseInt(chunk.slice(1, 20), 16);
                  let id = parseInt(chunk.slice(20, 32), 16);
                  let size = parseInt(chunk.slice(32, 64), 16);
                  let orderIndex = temporders.findIndex(
                    (sublist: any) =>
                      sublist[0] ==
                      price &&
                      sublist[1] ==
                      id &&
                      sublist[4] == marketKey,
                  );
                  let canceledOrderIndex = tempcanceledorders.findIndex(
                    (sublist: any) =>
                      sublist[0] ==
                      price &&
                      sublist[1] ==
                      id &&
                      sublist[4] == marketKey,
                  );
                  if (orderIndex != -1 && canceledOrderIndex != -1) {
                    ordersChanged = true;
                    canceledOrdersChanged = true;
                    temporders[orderIndex] = [...temporders[orderIndex]]
                    tempcanceledorders[canceledOrderIndex] = [...tempcanceledorders[canceledOrderIndex]]
                    let order = [...temporders[orderIndex]];
                    let buy = order[3];
                    let quoteasset =
                      markets[marketKey]
                        .quoteAddress;
                    let baseasset =
                      markets[marketKey]
                        .baseAddress;
                    let amountquote = (
                      ((order[2] - order[7] - size / order[0]) *
                        order[0]) /
                      (Number(
                        markets[marketKey]
                          .scaleFactor,
                      ) *
                        10 **
                        Number(
                          markets[marketKey]
                            .quoteDecimals,
                        ))
                    ).toFixed(2);
                    let amountbase = customRound(
                      (order[2] - order[7] - size / order[0]) /
                      10 **
                      Number(
                        markets[marketKey]
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
                      `${order[0] / Number(markets[marketKey].priceFactor)} ${markets[marketKey].quoteAsset}`,
                      '',
                    );
                    if (size == 0) {
                      tradeHistoryChanged = true;
                      temptradehistory.push([
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
                        _timestamp,
                        0,
                      ]);
                      if (temporders[orderIndex]?.[10] && typeof temporders[orderIndex][10].remove === 'function') {
                        try {
                          temporders[orderIndex][10].remove();
                        }
                        catch { }
                        temporders[orderIndex].splice(10, 1)
                      }
                      temporders.splice(orderIndex, 1);
                      tempcanceledorders[canceledOrderIndex][9] =
                        1;
                      tempcanceledorders[canceledOrderIndex][7] = order[2]
                      tempcanceledorders[canceledOrderIndex][8] = order[8];
                    } else {
                      if (temporders[orderIndex]?.[10] && typeof temporders[orderIndex][10].setQuantity === 'function') {
                        try {
                          temporders[orderIndex][10].setQuantity(formatDisplay(customRound((size / order[0]) / 10 ** Number(markets[order[4]].baseDecimals), 3)))
                        }
                        catch { }
                      }
                      temporders[orderIndex][7] =
                        order[2] - size / order[0];
                      tempcanceledorders[canceledOrderIndex][7] =
                        order[2] - size / order[0];
                    }
                  }
                }
                tradesByMarketChanged = true;
                if (!Array.isArray(temptradesByMarket[marketKey])) {
                  temptradesByMarket[marketKey] = [];
                }
                let amountIn = parseInt(log['data'].slice(2, 34), 16);
                let amountOut = parseInt(log['data'].slice(34, 66), 16);
                let buy = parseInt(log['data'].slice(66, 67), 16);
                let price = parseInt(log['data'].slice(98, 130), 16);
                temptradesByMarket[marketKey].unshift([
                  amountIn,
                  amountOut,
                  buy,
                  price,
                  marketKey,
                  log['transactionHash'],
                  _timestamp,
                ]);
                if (!Array.isArray(temptrades[marketKey])) {
                  temptrades[marketKey] = [];
                }
                temptrades[marketKey].unshift([
                  amountIn,
                  amountOut,
                  buy,
                  price,
                  marketKey,
                  log['transactionHash'],
                  _timestamp,
                  parseInt(log['data'].slice(67, 98), 16),
                ])
                if (
                  log['topics'][1].slice(26) ==
                  address?.slice(2).toLowerCase()
                ) {
                  tradeHistoryChanged = true;
                  temptradehistory.push([
                    amountIn,
                    amountOut,
                    buy,
                    price,
                    marketKey,
                    log['transactionHash'],
                    _timestamp,
                    1,
                  ])
                  let quoteasset =
                    markets[marketKey].quoteAddress;
                  let baseasset =
                    markets[marketKey].baseAddress;
                  let popupAmountIn = customRound(
                    amountIn /
                    10 **
                    Number(
                      buy
                        ? markets[marketKey]
                          .quoteDecimals
                        : markets[marketKey]
                          .baseDecimals,
                    ),
                    3,
                  );
                  let popupAmountOut = customRound(
                    amountOut /
                    10 **
                    Number(
                      buy
                        ? markets[marketKey]
                          .baseDecimals
                        : markets[marketKey]
                          .quoteDecimals,
                    ),
                    3,
                  );
                  newTxPopup(
                    log['transactionHash'],
                    'swap',
                    buy ? quoteasset : baseasset,
                    buy ? baseasset : quoteasset,
                    popupAmountIn,
                    popupAmountOut,
                    '',
                    '',
                  );
                }
              }
              if (tradesByMarketChanged) {
                setChartData(([existingBars, existingIntervalLabel, existingShowOutliers]) => {
                  const marketKey = existingIntervalLabel?.match(/^\D*/)?.[0];
                  const updatedBars = [...existingBars];
                  let rawVolume;
                  if (marketKey && Array.isArray(temptrades?.[marketKey])) {
                    const barSizeSec =
                      existingIntervalLabel?.match(/\d.*/)?.[0] === '1' ? 60 :
                        existingIntervalLabel?.match(/\d.*/)?.[0] === '5' ? 5 * 60 :
                          existingIntervalLabel?.match(/\d.*/)?.[0] === '15' ? 15 * 60 :
                            existingIntervalLabel?.match(/\d.*/)?.[0] === '30' ? 30 * 60 :
                              existingIntervalLabel?.match(/\d.*/)?.[0] === '60' ? 60 * 60 :
                                existingIntervalLabel?.match(/\d.*/)?.[0] === '240' ? 4 * 60 * 60 :
                                  existingIntervalLabel?.match(/\d.*/)?.[0] === '1D' ? 24 * 60 * 60 :
                                    5 * 60;
                    const priceFactor = Number(markets[marketKey].priceFactor);
                    for (const lastTrade of temptrades[marketKey]) {
                      const lastBarIndex = updatedBars.length - 1;
                      const lastBar = updatedBars[lastBarIndex];

                      let openPrice = parseFloat((lastTrade[7] / priceFactor).toFixed(Math.floor(Math.log10(priceFactor))));
                      let closePrice = parseFloat((lastTrade[3] / priceFactor).toFixed(Math.floor(Math.log10(priceFactor))));
                      rawVolume =
                        (lastTrade[2] == 1 ? lastTrade[0] : lastTrade[1]) /
                        10 ** Number(markets[marketKey].quoteDecimals);

                      const tradeTimeSec = lastTrade[6];
                      const flooredTradeTimeSec = Math.floor(tradeTimeSec / barSizeSec) * barSizeSec;
                      const lastBarTimeSec = Math.floor(new Date(lastBar?.time).getTime() / 1000);
                      if (flooredTradeTimeSec === lastBarTimeSec) {
                        updatedBars[lastBarIndex] = {
                          ...lastBar,
                          high: Math.max(lastBar.high, Math.max(openPrice, closePrice)),
                          low: Math.min(lastBar.low, Math.min(openPrice, closePrice)),
                          close: closePrice,
                          volume: lastBar.volume + rawVolume,
                        };
                        if (realtimeCallbackRef.current[existingIntervalLabel]) {
                          realtimeCallbackRef.current[existingIntervalLabel]({
                            ...lastBar,
                            high: Math.max(lastBar.high, Math.max(openPrice, closePrice)),
                            low: Math.min(lastBar.low, Math.min(openPrice, closePrice)),
                            close: closePrice,
                            volume: lastBar.volume + rawVolume,
                          });
                        }
                      } else {
                        updatedBars.push({
                          time: flooredTradeTimeSec * 1000,
                          open: lastBar.close ?? openPrice,
                          high: Math.max(lastBar.close ?? openPrice, closePrice),
                          low: Math.min(lastBar.close ?? openPrice, closePrice),
                          close: closePrice,
                          volume: rawVolume,
                        });
                        if (realtimeCallbackRef.current[existingIntervalLabel]) {
                          realtimeCallbackRef.current[existingIntervalLabel]({
                            time: flooredTradeTimeSec * 1000,
                            open: lastBar.close ?? openPrice,
                            high: Math.max(lastBar.close ?? openPrice, closePrice),
                            low: Math.min(lastBar.close ?? openPrice, closePrice),
                            close: closePrice,
                            volume: rawVolume,
                          });
                        }
                      }
                    }
                  }
                  setMarketsData((marketsData) =>
                    marketsData.map((market) => {
                      if (!market) return;
                      const marketKey = market?.marketKey.replace(
                        new RegExp(`^${wethticker}|${wethticker}$`, 'g'),
                        ethticker
                      );
                      const newTrades = temptrades?.[marketKey]
                      if (!Array.isArray(newTrades) || newTrades.length < 1) return market;
                      const firstKlineOpen: number =
                        market?.series && Array.isArray(market?.series) && market?.series.length > 0
                          ? Number(market?.series[0].open)
                          : 0;
                      const currentPriceRaw = Number(newTrades[newTrades.length - 1][3]);
                      const percentageChange = firstKlineOpen === 0 ? 0 : ((currentPriceRaw - firstKlineOpen) / firstKlineOpen) * 100;
                      const quotePrice = market.quoteAsset == 'USDC' ? 1 : temptradesByMarket[(market.quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : market.quoteAsset) + 'USDC']?.[0]?.[3]
                        / Number(markets[(market.quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : market.quoteAsset) + 'USDC']?.priceFactor)
                      let high = market.high24h ? Number(market.high24h.replace(/,/g, '')) : null;
                      let low = market.low24h ? Number(market.low24h.replace(/,/g, '')) : null;
                      const volume = newTrades.reduce((sum: number, trade: any) => {
                        if (high && trade[3] / Number(market.priceFactor) > high) {
                          high = trade[3] / Number(market.priceFactor)
                        }
                        if (low && trade[3] / Number(market.priceFactor) < low) {
                          low = trade[3] / Number(market.priceFactor)
                        }
                        const amount = Number(trade[2] === 1 ? trade[0] : trade[1]);
                        return sum + amount;
                      }, 0) / 10 ** Number(market?.quoteDecimals) * quotePrice;

                      return {
                        ...market,
                        volume: formatCommas(
                          (parseFloat(market.volume.replace(/,/g, '')) + volume).toFixed(2)
                        ),
                        currentPrice: formatSubscript(
                          (currentPriceRaw / Number(market.priceFactor)).toFixed(Math.floor(Math.log10(Number(market.priceFactor))))
                        ),
                        priceChange: `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(2)}`,
                        priceChangeAmount: currentPriceRaw - firstKlineOpen,
                        ...(high != null && {
                          high24h: formatSubscript(
                            high.toFixed(Math.floor(Math.log10(Number(market.priceFactor))))
                          )
                        }),
                        ...(low != null && {
                          low24h: formatSubscript(
                            low.toFixed(Math.floor(Math.log10(Number(market.priceFactor))))
                          )
                        })
                      };
                    })
                  );
                  return [updatedBars, existingIntervalLabel, existingShowOutliers];
                });
              }
            }
            if (tradeHistoryChanged) {
              settradehistory(temptradehistory)
            }
            if (tradesByMarketChanged) {
              settradesByMarket(temptradesByMarket)
            }
            if (canceledOrdersChanged) {
              setcanceledorders(tempcanceledorders)
            }
            if (ordersChanged) {
              setorders(temporders)
            }
            return tempset;
          })
        }
      }

      wsRef.current.onclose = () => {
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        if (liveStreamCancelled) {
          reconnectIntervalRef.current = setTimeout(() => {
            connectWebSocket();
          }, 500);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error(error);
      };
    };

    connectWebSocket();

    return () => {
      liveStreamCancelled = true;
      isAddressInfoFetching = false;
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectIntervalRef.current) {
        clearTimeout(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
    };
  }, [activechain, address]);

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
        const endpoint = `https://gateway.thegraph.com/api/${settings.graphKey}/subgraphs/id/6ikTAWa2krJSVCr4bSS9tv3i5nhyiELna3bE8cfgm8yn`;
        let allLogs: any[] = [];

        const query = `
          query {
            orders1: orderFilleds(
              first: 50,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0xCd5455B24f3622A1CfEce944615AE5Bc8f36Ee18" }
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
              first: 50,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0x97fa0031E2C9a21F0727bcaB884E15c090eC3ee3" }
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
              first: 50,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0x33C5Dc9091952870BD1fF47c89fA53D63f9729b6" }
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
              first: 50,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0xcB5ec6D6d0E49478119525E4013ff333Fc46B742" }
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
              first: 50,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0x93cBC4b52358c489665680182f0056f4F23C76CD" }
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
            orders6: orderFilleds(
              first: 50,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0xf00A3bd942DC0e32d07048ED6255E281667784f6" }
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
            orders7: orderFilleds(
              first: 50,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0x3051ec9feFaEc14F2bAB836FAb5A4c970A71874a" }
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
            orders8: orderFilleds(
              first: 50,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0x9fA48CFB43829A932A227E4d7996e310ccf40E9C" }
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
            orders9: orderFilleds(
              first: 50,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0x45f7db719367bbf9E508D3CeA401EBC62fc732A9" }
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
            orders10: orderFilleds(
              first: 50,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0x5a6f296032AaAE6737ed5896bC09D01dc2d42507" }
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
            orders11: orderFilleds(
              first: 50,
              orderBy: timeStamp,
              orderDirection: desc,
              where: { contractAddress: "0xCF16582dC82c4C17fA5b54966ee67b74FD715fB5" }
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
            json.data.orders5,
            json.data.orders6,
            json.data.orders7,
            json.data.orders8,
            json.data.orders9,
            json.data.orders10,
            json.data.orders11,
          );

        allLogs = allLogs.concat(orders);

        if (Array.isArray(allLogs)) {
          for (const event of allLogs) {
            if (addresstoMarket[event.contractAddress]) {
              temptradesByMarket[addresstoMarket[event.contractAddress]].push([
                parseInt(event.amountIn),
                parseInt(event.amountOut),
                event.buySell,
                event.price,
                addresstoMarket[event.contractAddress],
                event.transactionHash,
                event.timeStamp,
              ]);
            }
          }
        }
        settradesByMarket(temptradesByMarket);
        settradesloading(false);
        if (
          sendInputString === '' &&
          location.pathname.slice(1) === 'send' &&
          amountIn &&
          BigInt(amountIn) != BigInt(0)
        ) {
          setsendInputString(
            `$${calculateUSDValue(
              BigInt(amountIn),
              temptradesByMarket[
              (({ baseAsset, quoteAsset }) =>
                (baseAsset === wethticker ? ethticker : baseAsset) +
                (quoteAsset === wethticker ? ethticker : quoteAsset)
              )(getMarket(activeMarket.path.at(0), activeMarket.path.at(1)))
              ],
              tokenIn,
              getMarket(activeMarket.path.at(0), activeMarket.path.at(1)),
            ).toFixed(2)}`,
          );
        }

        try {
          const data = json.data.series_collection;
          const processedMarkets = data.map((series: any) => {
            const idParts = series.id.split("-");
            const address = idParts[2];

            const match = Object.values(markets).find(
              (m) => m.address.toLowerCase() === address.toLowerCase()
            );
            if (!match) return;
            const candles: any = series.klines.reverse();
            const highs = candles.map((c: any) => c.high);
            const lows = candles.map((c: any) => c.low);
            const high = Math.max(...highs);
            const low = Math.min(...lows);
            const firstPrice = candles[0].open;
            const lastPrice = candles[candles.length - 1].close;
            const percentageChange = firstPrice === 0 ? 0 : ((lastPrice - firstPrice) / firstPrice) * 100;
            const quotePrice = match.quoteAsset == 'USDC' ? 1 : temptradesByMarket[(match.quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : match.quoteAsset) + 'USDC']?.[0]?.[3]
              / Number(markets[(match.quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : match.quoteAsset) + 'USDC']?.priceFactor)
            const totalVolume = candles
              .filter((c: any) => Math.floor(Date.now() / 1000) - parseInt(c.time) <= 86400)
              .reduce((acc: number, c: any) => acc + parseFloat(c.volume.toString()), 0) * quotePrice;
            const decimals = Math.floor(Math.log10(Number(match.priceFactor)));

            return {
              ...match,
              pair: `${match.baseAsset}/${match.quoteAsset}`,
              currentPrice: formatSubscript((lastPrice / Number(match.priceFactor)).toFixed(decimals)),
              priceChange: `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(2)}`,
              priceChangeAmount: lastPrice - firstPrice,
              volume: formatCommas(totalVolume.toFixed(2)),
              marketKey: `${match.baseAsset}${match.quoteAsset}`,
              series: candles,
              firstPrice: firstPrice,
              high24h: formatSubscript((high / Number(match.priceFactor)).toFixed(decimals)),
              low24h: formatSubscript((low / Number(match.priceFactor)).toFixed(decimals)),
            };
          });
          setMarketsData(processedMarkets);
        } catch (error) {
          console.error("error fetching candles:", error);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        settradesloading(false);
      }
    })();
  }, [activechain]);

  // mobile trade
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && popup != 11) {
        setpopup(0);
        setSendUsdValue('');
        setSendInputAmount('');
        setSendAmountIn(BigInt(0));
        settokenString('');
        setSelectedConnector(null);

        if (showTrade && !simpleView) {
          document.body.style.overflow = 'auto'
          document.querySelector('.right-column')?.classList.add('hide');
          document.querySelector('.right-column')?.classList.remove('show');
          document.querySelector('.trade-mobile-switch')?.classList.remove('open');
          setShowTrade(false);
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
            setShowTrade(false);
          }
        }

        if (!popupref.current?.contains(e.target as Node) && popup != 11) {
          setSendUsdValue('');
          setSendInputAmount('');
          setSendAmountIn(BigInt(0));
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
    if (['swap', 'limit', 'send', 'scale', 'market'].includes(path)) {
      setSearchParams({
        ...(path != 'send' ? { tokenIn } : { token: tokenIn }),
        ...(tokenOut && path != 'send' && { tokenOut }),
        ...(switched && (path == 'swap' || path == 'market')
          ? { amountOut: amountOutSwap }
          : { amountIn }),
      });
    }
  }, [tokenIn, tokenOut, location.pathname.slice(1), amountIn, amountOutSwap, switched]);

  // update active tab
  useLayoutEffect(() => {
    const path = location.pathname.slice(1);
    if (path === 'swap') {
      setSimpleView(true);
    } else if (path === 'market') {
      setSimpleView(false);
    }
    if (path === 'send' || path === 'scale') {
      setCurrentProText(path.toLowerCase());
    } else {
      setCurrentProText('pro');
    }
    if (['swap', 'limit', 'send', 'scale', 'market'].includes(path)) {
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
        setsendInputString(
          amountIn != BigInt(0)
            ? `$${calculateUSDValue(
              amountIn,
              tradesByMarket[
              (({ baseAsset, quoteAsset }) =>
                (baseAsset === wethticker ? ethticker : baseAsset) +
                (quoteAsset === wethticker ? ethticker : quoteAsset)
              )(getMarket(activeMarket.path.at(0), activeMarket.path.at(1)))
              ],
              tokenIn,
              getMarket(activeMarket.path.at(0), activeMarket.path.at(1)),
            ).toFixed(2)}`
            : '',
        );
      } else if (path == 'limit') {
        if (multihop || isWrap) {
          let token;
          let pricefetchmarket;
          let found = false;
          for (const market in markets) {
            if (markets[market].baseAddress === tokenOut) {
              token = tokendict[markets[market].quoteAddress];
              pricefetchmarket = getMarket(
                markets[market].quoteAddress,
                tokenOut,
              );
              setTokenIn(markets[market].quoteAddress);
              found = true;
              break;
            }
          }
          if (!found) {
            for (const market in markets) {
              if (markets[market].quoteAddress === tokenOut) {
                token = tokendict[markets[market].baseAddress];
                pricefetchmarket = getMarket(
                  markets[market].baseAddress,
                  tokenOut,
                );
                setTokenIn(markets[market].baseAddress);
                break;
              }
            }
          }
          setswitched(true);
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
          if (switched) {
            setamountIn(
              limitPrice !== BigInt(0) && amountOutSwap !== BigInt(0)
                ? tokenIn === activeMarket?.baseAddress
                  ? (amountOutSwap *
                    (activeMarket.scaleFactor || BigInt(1))) /
                  limitPrice
                  : (amountOutSwap * limitPrice) /
                  (activeMarket.scaleFactor || BigInt(1))
                : BigInt(0),
            );
            setInputString(
              (limitPrice !== BigInt(0) && amountOutSwap !== BigInt(0)
                ? tokenIn === activeMarket?.baseAddress
                  ? customRound(
                    Number(
                      (amountOutSwap *
                        (activeMarket.scaleFactor || BigInt(1))) /
                      limitPrice,
                    ) /
                    10 ** Number(tokendict[tokenIn].decimals),
                    3,
                  )
                  : customRound(
                    Number(
                      (amountOutSwap * limitPrice) /
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
                        amountOutSwap !== BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? (amountOutSwap *
                            (activeMarket.scaleFactor ||
                              BigInt(1))) /
                          limitPrice
                          : (amountOutSwap * limitPrice) /
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
          else {
            setamountOutSwap(
              limitPrice != BigInt(0) && amountIn != BigInt(0)
                ? tokenIn === activeMarket?.baseAddress
                  ? (amountIn * limitPrice) /
                  (activeMarket.scaleFactor || BigInt(1))
                  : (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
                  limitPrice
                : BigInt(0),
            );
            setoutputString(
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
        }
      } else if (path == 'swap' || path == 'market') {
      } else if (path == 'scale') {
        if (multihop || isWrap) {
          let token;
          let found = false;
          for (const market in markets) {
            if (markets[market].baseAddress === tokenOut) {
              token = tokendict[markets[market].quoteAddress];
              setTokenIn(markets[market].quoteAddress);
              found = true;
              break;
            }
          }
          if (!found) {
            for (const market in markets) {
              if (markets[market].quoteAddress === tokenOut) {
                token = tokendict[markets[market].baseAddress];
                setTokenIn(markets[market].baseAddress);
                break;
              }
            }
          }
          setamountIn(
            BigInt(0)
          );
          setInputString('')
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
            if (switched) {
              const requiredInput = calculateScaleInput(
                amountOutSwap,
                Number(scaleStart),
                Number(scaleEnd),
                Number(scaleOrders),
                Number(scaleSkew)
              );
              setamountIn(requiredInput);
              setInputString(
                customRound(
                  Number(requiredInput) / 10 ** Number(tokendict[tokenIn].decimals),
                  3
                ).toString()
              );
              const percentage =
                tokenBalances[tokenIn] === BigInt(0)
                  ? 0
                  : Math.min(
                    100,
                    Math.floor(
                      Number(
                        (requiredInput) * BigInt(100) / tokenBalances[tokenIn])
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
            else {
              setScaleOutput(Number(amountIn), Number(scaleStart), Number(scaleEnd), Number(scaleOrders), Number(scaleSkew))
            }
          }
          else {
            if (switched) {
              const requiredInput = calculateScaleInput(
                amountOutSwap,
                Number(scaleStart),
                Number(scaleEnd),
                Number(0),
                Number(scaleSkew)
              );
              setamountIn(requiredInput);
              setInputString('');
              const percentage =
                tokenBalances[tokenIn] === BigInt(0)
                  ? 0
                  : Math.min(
                    100,
                    Math.floor(
                      Number(
                        (requiredInput) * BigInt(100) / tokenBalances[tokenIn])
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
            else {
              setScaleOutput(Number(amountIn), Number(scaleStart), Number(scaleEnd), Number(0), Number(scaleSkew))
            }
          }
        }
      }
    }
  }, [location.pathname.slice(1)]);

  // limit chase
  useEffect(() => {
    if (limitChase && mids?.[activeMarketKey]?.[0]) {
      const price = tokenIn === activeMarket?.baseAddress ? mids[activeMarketKey][0] == mids[activeMarketKey][1] ? mids[activeMarketKey][2] : mids[activeMarketKey][0] : mids[activeMarketKey][0] == mids[activeMarketKey][2] ? mids[activeMarketKey][1] : mids[activeMarketKey][0]
      setlimitPrice(price);
      setlimitPriceString(
        (
          Number(price) / Number(activeMarket.priceFactor)
        ).toFixed(Math.floor(Math.log10(Number(activeMarket.priceFactor)))),
      );
      if (switched && location.pathname.slice(1) == 'limit' && !multihop && !isWrap) {
        setamountIn(
          price !== BigInt(0) && amountOutSwap !== BigInt(0)
            ? tokenIn === activeMarket?.baseAddress
              ? (amountOutSwap *
                (activeMarket.scaleFactor || BigInt(1))) /
              price
              : (amountOutSwap * price) /
              (activeMarket.scaleFactor || BigInt(1))
            : BigInt(0),
        );
        setInputString(
          (price !== BigInt(0) && amountOutSwap !== BigInt(0)
            ? tokenIn === activeMarket?.baseAddress
              ? customRound(
                Number(
                  (amountOutSwap *
                    (activeMarket.scaleFactor || BigInt(1))) /
                  price,
                ) /
                10 ** Number(tokendict[tokenIn].decimals),
                3,
              )
              : customRound(
                Number(
                  (amountOutSwap * price) /
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
                  (price !== BigInt(0) &&
                    amountOutSwap !== BigInt(0)
                    ? tokenIn === activeMarket?.baseAddress
                      ? (amountOutSwap *
                        (activeMarket.scaleFactor ||
                          BigInt(1))) /
                      price
                      : (amountOutSwap * price) /
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
      else if (location.pathname.slice(1) == 'limit' && !multihop && !isWrap) {
        setamountOutSwap(
          price != BigInt(0) && amountIn != BigInt(0)
            ? tokenIn === activeMarket?.baseAddress
              ? (amountIn * price) /
              (activeMarket.scaleFactor || BigInt(1))
              : (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
              price
            : BigInt(0),
        );
        setoutputString(
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
                  (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
                  price,
                ) /
                10 ** Number(tokendict[tokenOut].decimals),
                3,
              )
            : ''
          ).toString(),
        );
      }
    }
  }, [limitChase, activechain, mids?.[activeMarketKey]?.[0], activeMarketKey, tokenIn, location.pathname.slice(1)]);

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
    if (user && !connected && !loading) {
      setpopup(11);
    }
    else if (connected && popup === 11) {
      setpopup(12);
    }
  }, [popup, connected, user != null, loading]);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState('forward');
  const [exitingChallenge, setExitingChallenge] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [isUsernameSigning, setIsUsernameSigning] = useState(false);
  const [typedRefCode, setTypedRefCode] = useState(() => searchParams.get('ref') || '');
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isRefSigning, setIsRefSigning] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [isConnectEntering, setIsConnectEntering] = useState(false);
  const [usernameResolved, setUsernameResolved] = useState(false);
  const [isWelcomeExiting, setIsWelcomeExiting] = useState(false);
  const [animating, setAnimating] = useState(false);
  const backAudioRef = useRef<HTMLAudioElement>(null);

  const isValidInput = (value: string) => {
    const regex = /^[a-zA-Z0-9-]{0,20}$/;
    return regex.test(value);
  };

  const handleWelcomeTransition = () => {
    audio.currentTime = 0;
    audio.play();

    setIsTransitioning(true);
    setIsWelcomeExiting(true);

    setTimeout(() => {
      setIsConnectEntering(true);
    }, 200);

    setTimeout(() => {
      setShowWelcomeScreen(false);
      setIsTransitioning(false);
      setIsWelcomeExiting(false);
    }, 200);
  };

  const handleSetRef = async (used: string) => {
    let lookup
    setIsRefSigning(true);
    if (used !== '') {
      lookup = (await readContracts(config, {
        contracts: [
          {
            abi: CrystalReferralAbi,
            address: settings.chainConfig[activechain].referralManager,
            functionName: 'refToAddress',
            args: [used.toLowerCase()],
          },
        ],
      })) as any[];

      if (lookup[0].result === '0x0000000000000000000000000000000000000000') {
        setError(t('setRefFailed'));
        setIsRefSigning(false);
        return false;
      }
    }

    if (used === '') {
      try {
        const hash = await sendUserOperationAsync({
          uo: {
            target: settings.chainConfig[activechain].referralManager,
            data: encodeFunctionData({
              abi: CrystalReferralAbi,
              functionName: 'setUsedRef',
              args: [used],
            }),
            value: 0n,
          },
        });
        await waitForTxReceipt(hash.hash);
        setUsedRefLink(used);
        setUsedRefAddress('0x0000000000000000000000000000000000000000')
        setIsRefSigning(false);
        return true;
      } catch {
        setIsRefSigning(false);
        return false;
      }
    } else {
      try {
        const hash = await sendUserOperationAsync({
          uo: {
            target: settings.chainConfig[activechain].referralManager,
            data: encodeFunctionData({
              abi: CrystalReferralAbi,
              functionName: 'setUsedRef',
              args: [used],
            }),
            value: 0n,
          },
        });
        await waitForTxReceipt(hash.hash);
        setUsedRefLink(used);
        setUsedRefAddress(lookup?.[0].result)
        setIsRefSigning(false);
        return true;
      } catch (error) {
        setIsRefSigning(false);
        return false;
      }
    }
  };

  const handleNextClick = () => {
    audio.currentTime = 0;
    audio.play();
    handleCompleteChallenge();
  };

  const handleBackClick = () => {
    if (backAudioRef.current) {
      backAudioRef.current.currentTime = 0;
      backAudioRef.current.play().catch(console.error);
    }
    if (currentStep > 0) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  };

  const handleCompleteChallenge = () => {
    if (currentStep < 2) { setCurrentStep(c => c + 1); return; }

    setExitingChallenge(true);
    setTimeout(() => {
      localStorage.setItem('crystal_has_completed_onboarding', 'true');
      setpopup(0);
      setCurrentStep(0)
      setExitingChallenge(false);
    }, 250);
  };

  const handleEditUsername = async (_usernameInput: any) => {
    setUsernameError("");

    if (_usernameInput.length < 3) {
      setUsernameError(t("minUsernameLength"));
      return;
    }

    if (_usernameInput.length > 20) {
      setUsernameError(t("maxUsernameLength"));
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(_usernameInput)) {
      setUsernameError("Username can only contain letters, numbers, and underscores");
      return;
    }

    setIsUsernameSigning(true);

    try {
      const read = (await readContracts(config, {
        contracts: [
          {
            abi: CrystalReferralAbi,
            address: settings.chainConfig[activechain].referralManager,
            functionName: 'usernameToAddress',
            args: [_usernameInput],
          },
        ]
      })) as any[];

      if (read[0].result !== '0x0000000000000000000000000000000000000000') {
        setUsernameError(t("usernameAlreadyTaken"));
        setIsUsernameSigning(false);
        return;
      }

      const hash = await sendUserOperationAsync({
        uo: {
          target: settings.chainConfig[activechain].referralManager,
          data: encodeFunctionData({
            abi: CrystalReferralAbi,
            functionName: 'setUsername',
            args: [
              _usernameInput
            ],
          }),
          value: 0n,
        },
      });

      await waitForTxReceipt(hash.hash);
      setUsername(_usernameInput);
      audio.currentTime = 0;
      audio.play();
      if (popup == 16) {
        setpopup(0)
      }
      else {
        setpopup(17);
      }
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsUsernameSigning(false);
    }
  };

  const handleBackToUsernameWithAudio = () => {
    if (backAudioRef.current) {
      backAudioRef.current.currentTime = 0;
      backAudioRef.current.play().catch(console.error);
    }
    setIsTransitioning(true);
    setTransitionDirection('backward');
    setExitingChallenge(true);

    setTimeout(() => {
      setpopup(14);
      setCurrentStep(0);

      setTimeout(() => {
        setIsTransitioning(false);
        setExitingChallenge(false);
      });
    }, 10);
  };

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const read = await readContracts(config, {
          contracts: [
            {
              abi: CrystalReferralAbi,
              address: settings.chainConfig[activechain].referralManager,
              functionName: 'addressToUsername',
              args: [address as `0x${string}`],
            },
          ]
        });

        if (read[0]?.result?.length != null) {
          setUsernameInput(read[0]?.result?.length > 0 ? read[0]?.result : "");
          setUsername(read[0]?.result?.length > 0 ? read[0]?.result : "");
          setUsernameResolved(true);
        }
      } catch (error) {
        console.error("Failed to fetch username:", error);
      }
    };

    if (address) {
      fetchUsername();
    }
  }, [address, activechain, config]);

  useEffect(() => {
    let animationStartTimer: ReturnType<typeof setTimeout> | undefined;
    let animatingTimer: ReturnType<typeof setTimeout> | undefined;

    if (currentStep === 0) {
      animationStartTimer = setTimeout(() => {
        setAnimationStarted(true);
      }, 100);
    } else {
      setAnimationStarted(false);
    }

    setAnimating(true);
    animatingTimer = setTimeout(() => {
      setAnimating(false);
    }, 300);

    return () => {
      if (animationStartTimer) clearTimeout(animationStartTimer);
      if (animatingTimer) clearTimeout(animatingTimer);
    };
  }, [currentStep]);

  const formatKeyDisplay = (key: string) => {
    if (!key) return '';
    const keyMap: { [key: string]: string } = {
      'Enter': 'Enter',
      'Escape': 'Esc',
      'Space': 'Space',
      'Slash': '/',
      'Backslash': '\\',
      'Comma': ',',
      'Period': '.',
      'Semicolon': ';',
      'Quote': "'",
      'BracketLeft': '[',
      'BracketRight': ']',
      'Backquote': '`',
      'Minus': '-',
      'Equal': '=',
      'Tab': 'Tab',
      'CapsLock': 'Caps Lock',
      'ShiftLeft': 'Shift',
      'ShiftRight': 'Shift',
      'ControlLeft': 'Ctrl',
      'ControlRight': 'Ctrl',
      'AltLeft': 'Alt',
      'AltRight': 'Alt',
      'MetaLeft': 'Cmd',
      'MetaRight': 'Cmd',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'Delete': 'Del',
      'Backspace': '⌫',
    };

    if (keyMap[key]) return keyMap[key];
    if (key.startsWith('Key')) return key.slice(3).toUpperCase();
    if (key.startsWith('Digit')) return key.slice(5);
    if (key.startsWith('F') && key.length <= 3) return key.toUpperCase();
    return key;
  };

  const handleRefreshQuote = useCallback(async (e: any) => {
    e.preventDefault();
    if (isRefreshing) return;
    setIsRefreshing(true);
    setStateIsLoading(true);
    await refetch()
    setIsRefreshing(false);
  }, [isRefreshing, refetch]);

  const handleCancelTopOrder = useCallback(async () => {
    if (!connected || userchain !== activechain || orders.length === 0 || isSigning) {
      return;
    }

    try {
      let hash;
      setIsSigning(true);

      const topOrder = orders[0];

      hash = await cancelOrder(
        sendUserOperationAsync,
        router,
        topOrder[3] == 1
          ? markets[topOrder[4]].quoteAddress
          : markets[topOrder[4]].baseAddress,
        topOrder[3] == 1
          ? markets[topOrder[4]].baseAddress
          : markets[topOrder[4]].quoteAddress,
        BigInt(topOrder[0]),
        BigInt(topOrder[1]),
      );

      await waitForTxReceipt(hash.hash);
      refetch();

    } catch (error) {
      console.error('Error canceling top order:', error);
    } finally {
      setIsSigning(false);
    }
  }, [connected, userchain, activechain, orders, router, markets, sendUserOperationAsync, waitForTxReceipt, refetch, isSigning]);

  const handleCancelAllOrders = useCallback(async () => {
    if (!connected || userchain !== activechain || orders.length === 0 || isSigning) {
      return;
    }

    try {
      let hash;
      setIsSigning(true);

      const orderbatch: Record<
        string,
        { 0: any[]; 1: any[]; 2: any[]; 3: any[] }
      > = {};

      orders.forEach((order) => {
        const k = markets[order[4]].address;
        if (!orderbatch[k]) {
          orderbatch[k] = { 0: [], 1: [], 2: [], 3: [] };
        }
        orderbatch[k][0].push(0);
        orderbatch[k][1].push(order[0]);
        orderbatch[k][2].push(order[1]);
        orderbatch[k][3].push(
          markets[order[4]].baseAddress ===
            '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' &&
            order[3] === 0
            ? router
            : address,
        );
      });

      const m = Object.keys(orderbatch) as `0x${string}`[];
      const action = m.map((market) => orderbatch[market][0]);
      const price = m.map((market) => orderbatch[market][1]);
      const param1 = m.map((market) => orderbatch[market][2]);
      const param2 = m.map((market) => orderbatch[market][3]);

      hash = await sendUserOperationAsync({
        uo: multiBatchOrders(
          router,
          BigInt(0),
          m,
          action,
          price,
          param1,
          param2,
          '0x0000000000000000000000000000000000000000',
        )
      });

      await waitForTxReceipt(hash.hash);
      refetch();

    } catch (error) {
      console.error('Error canceling all orders:', error);
    } finally {
      setIsSigning(false);
    }
  }, [connected, userchain, activechain, orders, markets, router, address, sendUserOperationAsync, waitForTxReceipt, refetch, isSigning]);

  const handleSubmitTransaction = useCallback(() => {
    if (popup !== 0) return;

    const currentPath = location.pathname.slice(1);
    if (!['swap', 'market', 'limit', 'send', 'scale'].includes(currentPath)) {
      return;
    }

    switch (currentPath) {
      case 'swap':
      case 'market':
        if (!swapButtonDisabled && !displayValuesLoading && !isSigning && connected && userchain === activechain) {
          const swapButton = document.querySelector('.swap-button') as HTMLButtonElement;
          if (swapButton && !swapButton.disabled) {
            swapButton.click();
          }
        }
        break;
      case 'limit':
        if (!limitButtonDisabled && !isSigning && connected && userchain === activechain) {
          const limitButton = document.querySelector('.limit-swap-button') as HTMLButtonElement;
          if (limitButton && !limitButton.disabled) {
            limitButton.click();
          }
        }
        break;
      case 'send':
        if (!sendButtonDisabled && !isSigning && connected && userchain === activechain) {
          const sendButton = document.querySelector('.send-swap-button') as HTMLButtonElement;
          if (sendButton && !sendButton.disabled) {
            sendButton.click();
          }
        }
        break;
      case 'scale':
        if (!scaleButtonDisabled && !isSigning && connected && userchain === activechain) {
          const scaleButton = document.querySelector('.limit-swap-button') as HTMLButtonElement;
          if (scaleButton && !scaleButton.disabled) {
            scaleButton.click();
          }
        }
        break;
    }
  }, [popup, location.pathname, swapButtonDisabled, displayValuesLoading, isSigning, connected, userchain, activechain, limitButtonDisabled, sendButtonDisabled, scaleButtonDisabled]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isListeningForKey && editingKeybind) {
        event.preventDefault();
        event.stopPropagation();

        const forbiddenKeys = ['F5', 'F11', 'F12', 'Tab', 'AltLeft', 'AltRight', 'ControlLeft', 'ControlRight', 'Escape', 'ArrowUp', 'ArrowDown'];
        if (forbiddenKeys.includes(event.code)) {
          return;
        }

        const existingKeybindEntry = Object.entries(keybinds).find(
          ([key, value]) => value === event.code && key !== editingKeybind
        );

        if (existingKeybindEntry) {
          const [duplicateKey] = existingKeybindEntry;
          setKeybindError(`This key is already assigned to "${duplicateKey}"`);
          setDuplicateKeybind(duplicateKey);
          setTimeout(() => {
            setKeybindError(null);
            setDuplicateKeybind(null);
          }, 3000);

          return;
        }

        const newKeybinds = { ...keybinds, [editingKeybind]: event.code };
        setKeybinds(newKeybinds);
        localStorage.setItem('crystal_keybinds', JSON.stringify(newKeybinds));
        setEditingKeybind(null);
        setIsListeningForKey(false);

        setKeybindError(null);
        setDuplicateKeybind(null);
        return;
      }

      if (isListeningForKey || (popup !== 0 && event.code !== keybinds.cancelTopOrder)) {
        return;
      }

      const activeElement = document.activeElement;
      if (activeElement && event.code !== keybinds.submitTransaction && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.hasAttribute('contenteditable')
      )) {
        return;
      }

      if (event.code === keybinds.submitTransaction) {
        event.preventDefault();
        handleSubmitTransaction();
        return;
      }

      if (event.code === keybinds.switchTokens && ['swap', 'limit', 'market', 'scale'].includes(location.pathname.slice(1))) {
        event.preventDefault();
        const switchButton = document.querySelector('.switch-button') as HTMLElement;
        if (switchButton) switchButton.click();
        return;
      }

      if (event.code === keybinds.maxAmount && ['swap', 'limit', 'send', 'scale', 'market'].includes(location.pathname.slice(1))) {
        event.preventDefault();
        const maxButton = document.querySelector('.max-button') as HTMLElement;
        if (maxButton) maxButton.click();
        return;
      }

      if (event.code === keybinds.focusInput && ['swap', 'limit', 'send', 'scale', 'market'].includes(location.pathname.slice(1))) {
        event.preventDefault();
        const mainInput = document.querySelector('.input') as HTMLInputElement;
        if (mainInput) mainInput.focus();
        return;
      }

      if (event.code === keybinds.openSettings) {
        event.preventDefault();
        setpopup(5);
        return;
      }

      if (event.code === keybinds.openWallet) {
        event.preventDefault();
        setpopup(4);
        return;
      }

      if (event.code === keybinds.openTokenInSelect && ['swap', 'limit', 'send', 'scale', 'market'].includes(location.pathname.slice(1))) {
        event.preventDefault();
        setpopup(1);
        return;
      }

      if (event.code === keybinds.openTokenOutSelect && ['swap', 'limit', 'scale', 'market'].includes(location.pathname.slice(1))) {
        event.preventDefault();
        setpopup(2);
        return;
      }

      if (event.code === keybinds.cancelAllOrders) {
        event.preventDefault();
        handleCancelAllOrders();
        return;
      }

      if (event.code === keybinds.cancelTopOrder) {
        event.preventDefault();
        handleCancelTopOrder();
        return;
      }

      if (event.code === keybinds.openPortfolio) {
        event.preventDefault();
        navigate('/portfolio');
        return;
      }

      if (event.code === keybinds.openLeaderboard) {
        event.preventDefault();
        navigate('/leaderboard');
        return;
      }

      if (event.code === keybinds.openReferrals) {
        event.preventDefault();
        navigate('/referrals');
        return;
      }

      if (event.code === keybinds.openMarketSearch) {
        event.preventDefault();
        setpopup(8);
        return;
      }

      if (event.code === keybinds.toggleFavorite && activeMarket) {
        event.preventDefault();
        toggleFavorite(activeMarket.baseAddress?.toLowerCase() ?? '');
        return;
      }

      if (event.code === keybinds.toggleSimpleView) {
        event.preventDefault();
        const newSimpleView = !simpleView;
        setSimpleView(newSimpleView);
        localStorage.setItem('crystal_simple_view', JSON.stringify(newSimpleView));

        if (newSimpleView) {
          navigate('/swap');
        } else {
          navigate('/market');
        }
        return;
      }

      if (event.code === keybinds.refreshQuote && ['swap', 'limit', 'send', 'scale', 'market'].includes(location.pathname.slice(1))) {
        event.preventDefault();
        handleRefreshQuote(event as any);
        return;
      }

      if (isOrderCenterVisible && !simpleView) {
        if (event.code === keybinds.switchToOrders) {
          event.preventDefault();
          setActiveSection('orders');
          localStorage.setItem('crystal_oc_tab', 'orders');
          return;
        }

        if (event.code === keybinds.switchToTrades) {
          event.preventDefault();
          setActiveSection('tradeHistory');
          localStorage.setItem('crystal_oc_tab', 'tradeHistory');
          return;
        }

        if (event.code === keybinds.switchToHistory) {
          event.preventDefault();
          setActiveSection('orderHistory');
          localStorage.setItem('crystal_oc_tab', 'orderHistory');
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    keybinds,
    isListeningForKey,
    editingKeybind,
    popup,
    location.pathname,
    simpleView,
    isOrderCenterVisible,
    activeMarket,
    navigate,
    toggleFavorite,
    setSimpleView,
    setActiveSection,
    handleRefreshQuote,
    handleSubmitTransaction,
    handleCancelAllOrders,
    handleCancelTopOrder,
    setpopup
  ]);

  const renderKeybindButton = (keybindKey: string, labelText: string, descriptionText: string) => (
    <>
      <div className="keybind-setting-row">
        <div className="keybind-info">
          <span className="keybind-label">{labelText}</span>
          <span className="keybind-description">{descriptionText}</span>
        </div>
        <div className="keybind-button-container">
          <button
            className={`keybind-button ${editingKeybind === keybindKey && isListeningForKey ? 'listening' : ''
              } ${duplicateKeybind === keybindKey ? 'error' : ''
              }`}
            onClick={() => {
              if (editingKeybind === keybindKey && isListeningForKey) {
                setEditingKeybind(null);
                setIsListeningForKey(false);
                setKeybindError(null);
                setDuplicateKeybind(null);
              } else {
                setEditingKeybind(keybindKey);
                setIsListeningForKey(true);
                setKeybindError(null);
                setDuplicateKeybind(null);
              }
            }}
          >
            {editingKeybind === keybindKey && isListeningForKey
              ? t('pressAKey')
              : formatKeyDisplay(keybinds[keybindKey])}
          </button>
        </div>

      </div>
      {keybindError && editingKeybind === keybindKey && (
        <div className="keybind-error-message">
          {keybindError}
        </div>
      )}
    </>
  );

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
                token.ticker.toLowerCase().includes(tokenString.toLowerCase()) ||
                token.name.toLowerCase().includes(tokenString.toLowerCase()) ||
                token.address.toLowerCase().includes(tokenString.toLowerCase()),
            )
            .map((token, index) => (
              <button
                className={`tokenbutton ${index === selectedTokenIndex ? 'selected' : ''}`}
                key={token.address}
                onMouseEnter={() => setSelectedTokenIndex(index)}
                onClick={() => {
                  if ((location.pathname.slice(1) == 'lending' || location.pathname.slice(1) == 'earn/liquidity-pools') && onSelectTokenCallback) {
                    onSelectTokenCallback({
                      icon: token.image,
                      symbol: token.ticker
                    });
                    setpopup(0);
                    settokenString('');
                    return;
                  }
                  let pricefetchmarket;
                  let newTokenOut;
                  setpopup(0);
                  settokenString('');
                  setTokenIn(token.address);
                  setStateIsLoading(true);
                  if (location.pathname.slice(1) == 'swap' || location.pathname.slice(1) == 'market') {
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
                        if (path && path.length > 1 && (location.pathname.slice(1) == 'swap' || location.pathname.slice(1) == 'market')) {
                          newTokenOut = tokenOut;
                        } else {
                          let found = false;
                          for (const market in markets) {
                            if (
                              markets[market].baseAddress === token.address
                            ) {
                              setTokenOut(markets[market].quoteAddress);
                              newTokenOut = markets[market].quoteAddress;
                              found = true;
                              break;
                            }
                          }
                          if (!found) {
                            for (const market in markets) {
                              if (
                                markets[market].quoteAddress === token.address
                              ) {
                                setTokenOut(markets[market].baseAddress);
                                newTokenOut = markets[market].baseAddress;
                                break;
                              }
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
                      setScaleStart(BigInt(0))
                      setScaleEnd(BigInt(0))
                      setScaleStartString('')
                      setScaleEndString('')
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
                  } else if (location.pathname.slice(1) == 'limit') {
                    if ((token.address == weth ? eth : token.address) != (tokenOut == weth ? eth : tokenOut)) {
                      if (
                        markets[
                        `${tokendict[token.address].ticker}${tokendict[tokenOut].ticker}`
                        ] ||
                        markets[
                        `${tokendict[tokenOut].ticker}${tokendict[token.address].ticker}`
                        ]
                      ) {
                      } else {
                        let found = false;
                        for (const market in markets) {
                          if (
                            markets[market].baseAddress === token.address
                          ) {
                            setTokenOut(markets[market].quoteAddress);
                            found = true;
                            break;
                          }
                        }
                        if (!found) {
                          for (const market in markets) {
                            if (markets[market].quoteAddress === token.address) {
                              setTokenOut(markets[market].baseAddress);
                              break;
                            }
                          }
                        }
                      }
                      setamountIn(
                        (amountIn * BigInt(10) ** token.decimals) /
                        BigInt(10) ** tokendict[tokenIn].decimals
                      );
                      setlimitChase(true);
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
                      setswitched((switched) => { return !switched });
                      if (amountIn != BigInt(0)) {
                        if (limitChase && mids?.[activeMarketKey]?.[0]) {
                          const price = tokenOut === activeMarket?.baseAddress ? mids[activeMarketKey][0] == mids[activeMarketKey][1] ? mids[activeMarketKey][2] : mids[activeMarketKey][0] : mids[activeMarketKey][0] == mids[activeMarketKey][2] ? mids[activeMarketKey][1] : mids[activeMarketKey][0]
                          setlimitPrice(price);
                          setlimitPriceString(
                            (
                              Number(price) / Number(activeMarket.priceFactor)
                            ).toFixed(Math.floor(Math.log10(Number(activeMarket.priceFactor)))),
                          );
                          setamountOutSwap(
                            price != BigInt(0) && amountIn != BigInt(0)
                              ? tokenOut === activeMarket?.baseAddress
                                ? (amountIn * price) /
                                (activeMarket.scaleFactor || BigInt(1))
                                : (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
                                price
                              : BigInt(0),
                          );
                          setoutputString(
                            (price != BigInt(0) && amountIn != BigInt(0)
                              ? tokenOut === activeMarket?.baseAddress
                                ? customRound(
                                  Number(
                                    (amountIn * price) /
                                    (activeMarket.scaleFactor || BigInt(1)),
                                  ) /
                                  10 ** Number(tokendict[tokenIn].decimals),
                                  3,
                                )
                                : customRound(
                                  Number(
                                    (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
                                    price,
                                  ) /
                                  10 ** Number(tokendict[tokenIn].decimals),
                                  3,
                                )
                              : ''
                            ).toString(),
                          );
                        }
                        setInputString(outputString);
                        setoutputString(inputString);
                        setamountIn(amountOutSwap);
                        setamountOutSwap(amountIn);
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
                  } else if (location.pathname.slice(1) == 'send') {
                    setlimitChase(true);
                    setScaleStart(BigInt(0))
                    setScaleEnd(BigInt(0))
                    setScaleStartString('')
                    setScaleEndString('')
                    if (((token.address == weth ? eth : token.address) != (tokenOut == weth ? eth : tokenOut)) && multihop == false) {
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
                      let found = false;
                      for (const market in markets) {
                        if (
                          markets[market].baseAddress === token.address
                        ) {
                          setTokenOut(markets[market].quoteAddress);
                          pricefetchmarket = getMarket(
                            token.address,
                            markets[market].quoteAddress,
                          );
                          found = true;
                          break;
                        }
                      }
                      if (!found) {
                        for (const market in markets) {
                          if (markets[market].quoteAddress === token.address) {
                            setTokenOut(markets[market].baseAddress);
                            pricefetchmarket = getMarket(
                              token.address,
                              markets[market].baseAddress,
                            );
                            break;
                          }
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
                              (({ baseAsset, quoteAsset }) =>
                                (baseAsset === wethticker ? ethticker : baseAsset) +
                                (quoteAsset === wethticker ? ethticker : quoteAsset)
                              )(pricefetchmarket)
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
                          (({ baseAsset, quoteAsset }) =>
                            (baseAsset === wethticker ? ethticker : baseAsset) +
                            (quoteAsset === wethticker ? ethticker : quoteAsset)
                          )(pricefetchmarket)
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
                                (({ baseAsset, quoteAsset }) =>
                                  (baseAsset === wethticker ? ethticker : baseAsset) +
                                  (quoteAsset === wethticker ? ethticker : quoteAsset)
                                )(pricefetchmarket)
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
                          (({ baseAsset, quoteAsset }) =>
                            (baseAsset === wethticker ? ethticker : baseAsset) +
                            (quoteAsset === wethticker ? ethticker : quoteAsset)
                          )(pricefetchmarket)
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
                  } else if (location.pathname.slice(1) == 'scale') {
                    if ((token.address == weth ? eth : token.address) != (tokenOut == weth ? eth : tokenOut)) {
                      if (
                        markets[
                        `${tokendict[token.address].ticker}${tokendict[tokenOut].ticker}`
                        ] ||
                        markets[
                        `${tokendict[tokenOut].ticker}${tokendict[token.address].ticker}`
                        ]
                      ) {
                      } else {
                        let found = false;
                        for (const market in markets) {
                          if (
                            markets[market].baseAddress === token.address
                          ) {
                            setTokenOut(markets[market].quoteAddress);
                            found = true;
                            break;
                          }
                        }
                        if (!found) {
                          for (const market in markets) {
                            if (markets[market].quoteAddress === token.address) {
                              setTokenOut(markets[market].baseAddress);
                              break;
                            }
                          }
                        }
                      }
                      setamountIn(
                        BigInt(0)
                      );
                      setInputString('')
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
                      setswitched((switched) => { return !switched });
                      if (amountIn != BigInt(0) && scaleStart && scaleEnd && scaleOrders && scaleSkew) {
                        setInputString(outputString);
                        setoutputString(inputString);
                        setamountIn(amountOutSwap);
                        setamountOutSwap(amountIn);
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
                token.ticker.toLowerCase().includes(tokenString.toLowerCase()) ||
                token.name.toLowerCase().includes(tokenString.toLowerCase()) ||
                token.address.toLowerCase().includes(tokenString.toLowerCase()),
            )
            .map((token, index) => (
              <button
                className={`tokenbutton ${index === selectedTokenIndex ? 'selected' : ''}`}
                key={token.address}
                onMouseEnter={() => setSelectedTokenIndex(index)}
                onClick={() => {
                  let newTokenIn;
                  setpopup(0);
                  settokenString('');
                  setTokenOut(token.address);
                  setStateIsLoading(true);
                  if (location.pathname.slice(1) == 'swap' || location.pathname.slice(1) == 'market') {
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
                          let found = false;
                          for (const market in markets) {
                            if (
                              markets[market].baseAddress === token.address
                            ) {
                              setTokenIn(markets[market].quoteAddress);
                              newTokenIn = markets[market].quoteAddress;
                              found = true;
                              break;
                            }
                          }
                          if (!found) {
                            for (const market in markets) {
                              if (
                                markets[market].quoteAddress === token.address
                              ) {
                                setTokenIn(markets[market].baseAddress);
                                newTokenIn = markets[market].baseAddress;
                                break;
                              }
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
                      setScaleStart(BigInt(0))
                      setScaleEnd(BigInt(0))
                      setScaleStartString('')
                      setScaleEndString('')
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
                  } else if (location.pathname.slice(1) == 'limit') {
                    if ((token.address == weth ? eth : token.address) != (tokenIn == weth ? eth : tokenIn)) {
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
                        let found = false;
                        for (const market in markets) {
                          if (
                            markets[market].baseAddress === token.address
                          ) {
                            setTokenIn(markets[market].quoteAddress);
                            newTokenIn = markets[market].quoteAddress;
                            found = true;
                            break;
                          }
                        }
                        if (!found) {
                          for (const market in markets) {
                            if (markets[market].quoteAddress === token.address) {
                              setTokenIn(markets[market].baseAddress);
                              newTokenIn = markets[market].baseAddress;
                              break;
                            }
                          }
                        }
                      }
                      setamountIn(
                        (amountIn *
                          BigInt(10) ** tokendict[newTokenIn].decimals) /
                        BigInt(10) ** tokendict[tokenIn].decimals,
                      );
                      setlimitChase(true);
                      setScaleStart(BigInt(0))
                      setScaleEnd(BigInt(0))
                      setScaleStartString('')
                      setScaleEndString('')
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
                      setswitched((switched) => { return !switched });
                      if (amountIn != BigInt(0)) {
                        if (limitChase && mids?.[activeMarketKey]?.[0]) {
                          const price = tokenOut === activeMarket?.baseAddress ? mids[activeMarketKey][0] == mids[activeMarketKey][1] ? mids[activeMarketKey][2] : mids[activeMarketKey][0] : mids[activeMarketKey][0] == mids[activeMarketKey][2] ? mids[activeMarketKey][1] : mids[activeMarketKey][0]
                          setlimitPrice(price);
                          setlimitPriceString(
                            (
                              Number(price) / Number(activeMarket.priceFactor)
                            ).toFixed(Math.floor(Math.log10(Number(activeMarket.priceFactor)))),
                          );
                          setamountOutSwap(
                            price != BigInt(0) && amountIn != BigInt(0)
                              ? tokenOut === activeMarket?.baseAddress
                                ? (amountIn * price) /
                                (activeMarket.scaleFactor || BigInt(1))
                                : (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
                                price
                              : BigInt(0),
                          );
                          setoutputString(
                            (price != BigInt(0) && amountIn != BigInt(0)
                              ? tokenOut === activeMarket?.baseAddress
                                ? customRound(
                                  Number(
                                    (amountIn * price) /
                                    (activeMarket.scaleFactor || BigInt(1)),
                                  ) /
                                  10 ** Number(tokendict[tokenIn].decimals),
                                  3,
                                )
                                : customRound(
                                  Number(
                                    (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
                                    price,
                                  ) /
                                  10 ** Number(tokendict[tokenIn].decimals),
                                  3,
                                )
                              : ''
                            ).toString(),
                          );
                        }
                        setInputString(outputString);
                        setoutputString(inputString);
                        setamountIn(amountOutSwap);
                        setamountOutSwap(amountIn);
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
                  } else if (location.pathname.slice(1) == 'scale') {
                    if ((token.address == weth ? eth : token.address) != (tokenIn == weth ? eth : tokenIn)) {
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
                        let found = false;
                        for (const market in markets) {
                          if (
                            markets[market].baseAddress === token.address
                          ) {
                            setTokenIn(markets[market].quoteAddress);
                            newTokenIn = markets[market].quoteAddress;
                            found = true;
                            break;
                          }
                        }
                        if (!found) {
                          for (const market in markets) {
                            if (markets[market].quoteAddress === token.address) {
                              setTokenIn(markets[market].baseAddress);
                              newTokenIn = markets[market].baseAddress;
                              break;
                            }
                          }
                        }
                      }
                      setamountIn(
                        BigInt(0)
                      );
                      setInputString('')
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
                      setswitched((switched) => { return !switched });
                      if (amountIn != BigInt(0) && scaleStart && scaleEnd && scaleOrders && scaleSkew) {
                        setInputString(outputString);
                        setoutputString(inputString);
                        setamountIn(amountOutSwap);
                        setamountOutSwap(amountIn);
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
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    depositAmount: '',
    type: 'Spot' as 'Spot' | 'Margin',
    tradableTokens: [] as string[],
    selectedMarket: '',
    website: '',
    telegram: '',
    discord: '',
    twitter: ''
  });

  const usdcBalance = tokenBalances[usdc] || BigInt(0);
  const usdcDecimals = Number(tokendict[usdc]?.decimals || 18);
  const userUSDCBalance = Number(usdcBalance) / (10 ** usdcDecimals);

  const minDeposit = 900;
  const creationFee = 100;

  const isCreateFormValid = () => {
    const depositValid = parseFloat(createForm.depositAmount) >= minDeposit;
    const balanceValid = parseFloat(createForm.depositAmount) <= (userUSDCBalance - creationFee);
    const marketValid = createForm.type === 'Margin' || (createForm.type === 'Spot' && createForm.selectedMarket !== '');

    return createForm.name.trim() !== '' &&
      createForm.description.trim() !== '' &&
      depositValid &&
      balanceValid &&
      marketValid;
  };

  const handleCreateVault = () => {
    if (isCreateFormValid()) {
      console.log('Creating vault:', createForm);
      setpopup(0);
      setCreateForm({
        name: '',
        description: '',
        depositAmount: '',
        type: 'Spot',
        tradableTokens: [],
        selectedMarket: '',
        website: '',
        telegram: '',
        discord: '',
        twitter: ''
      });
    }
  };
  const [explorerFiltersActiveTab, setExplorerFiltersActiveTab] = useState<'new' | 'graduating' | 'graduated'>(() => {
    const saved = localStorage.getItem('crystal_explorer_active_tab');
    return (saved as 'new' | 'graduating' | 'graduated') || 'new';
  });

  const [explorerFiltersActiveSection, setExplorerFiltersActiveSection] = useState<'audit' | 'metrics' | 'socials'>(() => {
    const saved = localStorage.getItem('crystal_explorer_active_section');
    return (saved as 'audit' | 'metrics' | 'socials') || 'audit';
  });
  const handleOpenFiltersForColumn = useCallback((columnType: 'new' | 'graduating' | 'graduated') => {
    setExplorerFiltersActiveTab(columnType);
    setpopup(24);
  }, []);


  const initialExplorerFilters = {
    ageMin: '', ageMax: '',
    holdersMin: '', holdersMax: '',
    proTradersMin: '', proTradersMax: '',
    kolTradersMin: '', kolTradersMax: '',
    top10HoldingMin: '', top10HoldingMax: '',
    devHoldingMin: '', devHoldingMax: '',
    sniperHoldingMin: '', sniperHoldingMax: '',
    bundleHoldingMin: '', bundleHoldingMax: '',
    insiderHoldingMin: '', insiderHoldingMax: '',
    marketCapMin: '', marketCapMax: '',
    volume24hMin: '', volume24hMax: '',
    globalFeesMin: '', globalFeesMax: '',
    buyTransactionsMin: '', buyTransactionsMax: '',
    sellTransactionsMin: '', sellTransactionsMax: '',
    priceMin: '', priceMax: '',
    searchKeywords: '',
    excludeKeywords: '',
    hasWebsite: false,
    hasTwitter: false,
    hasTelegram: false
  };

  const [explorerFilters, setExplorerFilters] = useState(() => {
    const saved = localStorage.getItem('crystal_explorer_filters');
    return saved ? JSON.parse(saved) : initialExplorerFilters;
  });

  const [appliedExplorerFilters, setAppliedExplorerFilters] = useState(() => {
    const saved = localStorage.getItem('crystal_applied_explorer_filters');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeExplorerFilterTab, setActiveExplorerFilterTab] = useState<'new' | 'graduating' | 'graduated'>(() => {
    const saved = localStorage.getItem('crystal_active_explorer_filter_tab');
    return (saved as 'new' | 'graduating' | 'graduated') || 'new';
  });
  useEffect(() => {
    localStorage.setItem('crystal_explorer_active_tab', explorerFiltersActiveTab);
  }, [explorerFiltersActiveTab]);

  useEffect(() => {
    localStorage.setItem('crystal_explorer_active_section', explorerFiltersActiveSection);
  }, [explorerFiltersActiveSection]);

  useEffect(() => {
    localStorage.setItem('crystal_explorer_filters', JSON.stringify(explorerFilters));
  }, [explorerFilters]);

  useEffect(() => {
    if (appliedExplorerFilters) {
      localStorage.setItem('crystal_applied_explorer_filters', JSON.stringify(appliedExplorerFilters));
    } else {
      localStorage.removeItem('crystal_applied_explorer_filters');
    }
  }, [appliedExplorerFilters]);

  useEffect(() => {
    localStorage.setItem('crystal_active_explorer_filter_tab', activeExplorerFilterTab);
  }, [activeExplorerFilterTab]);
  const handleExplorerFilterInputChange = useCallback((field: string, value: string | boolean) => {
    setExplorerFilters((prev: any) => {
      const newFilters = { ...prev, [field]: value };
      return newFilters;
    });
  }, []);

  const handleExplorerFiltersReset = useCallback(() => {
    setExplorerFilters(initialExplorerFilters);
    setAppliedExplorerFilters(null);
    setActiveExplorerFilterTab('new');
    setExplorerFiltersActiveTab('new');
    setExplorerFiltersActiveSection('audit');
    localStorage.removeItem('crystal_explorer_filters');
    localStorage.removeItem('crystal_applied_explorer_filters');
    localStorage.removeItem('crystal_active_explorer_filter_tab');
    localStorage.setItem('crystal_explorer_active_tab', 'new');
    localStorage.setItem('crystal_explorer_active_section', 'audit');
  }, []);


  const handleExplorerFiltersImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedFilters = JSON.parse(e.target?.result as string);
            setExplorerFilters(importedFilters);
          } catch (error) {
            alert('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);
  const handleExplorerFiltersExport = useCallback(() => {
    const dataStr = JSON.stringify(explorerFilters, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `explorer-filters-${explorerFiltersActiveTab}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [explorerFilters, explorerFiltersActiveTab]);

  const handleExplorerFiltersApply = useCallback(() => {
    const hasActiveFilters = Object.values(explorerFilters).some(value =>
      value !== '' && value !== false && value !== null && value !== undefined
    );

    if (hasActiveFilters) {
      setAppliedExplorerFilters(explorerFilters);
      setActiveExplorerFilterTab(explorerFiltersActiveTab);
    } else {
      setAppliedExplorerFilters(null);
      setActiveExplorerFilterTab('new');
    }

    setpopup(0);
  }, [explorerFilters, explorerFiltersActiveTab]);

  const handleExplorerTabSwitch = useCallback((newTab: 'new' | 'graduating' | 'graduated') => {
    setExplorerFiltersActiveTab(newTab);
  }, []);

  const [tradingMode, setTradingMode] = useState<'spot' | 'trenches'>('spot');
  type CustomizationSettings = {
    mainTextColor: string;
    positivePNLColor: string;
    negativePNLColor: string;
    rectangleTextColor: string;
    showPNLRectangle: boolean;
  };

  interface ColorInputProps {
    color: string;
    onChange: (color: string) => void;
    label: string;
    id: string;
    defaultColor: string;
  }

  // ============ CONSTANTS ============
  const tokenIconUrl = './monad.svg';
  const tokenName = 'MON';
  const leverage = 10;
  const pnl = -55.05;
  const entryPrice = 38.88;
  const exitPrice = 38.88;
  const referralCode = 138296;

  const defaultCustomizationSettings: CustomizationSettings = {
    mainTextColor: '#EAEDFF',
    positivePNLColor: '#2FE3AC',
    negativePNLColor: '#EC397A',
    rectangleTextColor: '#020307',
    showPNLRectangle: true,
  };

  // ============ STATE VARIABLES TO ADD ============
  const [uploadedBg, setUploadedBg] = useState<string | null>(null);
  const [currency, setCurrency] = useState(tokenName);
  const [selectedBg, setSelectedBg] = useState(PNLBG2);
  const [customizationSettings, setCustomizationSettings] = useState<CustomizationSettings>(defaultCustomizationSettings);
  const [tempCustomizationSettings, setTempCustomizationSettings] = useState<CustomizationSettings>(defaultCustomizationSettings);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

  // ============ REFS TO ADD ============
  const captureRef = useRef<HTMLDivElement>(null);
  const pickerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // ============ FUNCTIONS TO ADD ============

  // ColorInput component
  const ColorInput = React.memo<ColorInputProps>(({
    color,
    onChange,
    label,
    id,
    defaultColor
  }) => {
    const [inputValue, setInputValue] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const displayValue = isEditing ? inputValue : color.replace('#', '').toUpperCase();

    const validateAndApply = useCallback((value: string) => {
      const cleaned = value.replace(/[^0-9A-Fa-f]/g, '');
      if (cleaned.length === 6) {
        onChange(`#${cleaned}`);
        return true;
      } else if (cleaned.length === 3) {
        const expanded = cleaned.split('').map(c => c + c).join('');
        onChange(`#${expanded}`);
        return true;
      }
      return false;
    }, [onChange]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value.toUpperCase());
    }, []);

    const handleFocus = useCallback(() => {
      setIsEditing(true);
      setInputValue(color.replace('#', '').toUpperCase());
    }, [color]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      if (e.relatedTarget?.classList.contains('refresh-button')) {
        e.target.focus();
        return;
      }

      setIsEditing(false);
      if (inputValue && !validateAndApply(inputValue)) {
        setInputValue('');
      }
    }, [inputValue, validateAndApply]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        setIsEditing(false);
        validateAndApply(inputValue);
        (e.target as HTMLInputElement).blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        setInputValue('');
        (e.target as HTMLInputElement).blur();
      }
    }, [inputValue, validateAndApply]);

    const handleRefreshClick = useCallback(() => {
      onChange(defaultColor);
      setInputValue('');
      setIsEditing(false);
    }, [onChange, defaultColor]);

    const handleColorPickerClick = useCallback((e: React.MouseEvent) => {
      const event = new CustomEvent('colorPickerClick', {
        detail: { id, event: e }
      });
      document.dispatchEvent(event);
    }, [id]);

    return (
      <div className="color-input-row">
        <label className="color-label-inline">{label}</label>
        <div className="color-input-container">
          <div
            className="color-preview"
            style={{ backgroundColor: color }}
            onClick={handleColorPickerClick}
            title="Click to pick color"
          />
          <input
            type="text"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="hex-input"
            placeholder="FFFFFF"
            maxLength={6}
          />
          <button
            className="refresh-button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleRefreshClick}
            title="Reset to default"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>
      </div>
    );
  });

  // Main functions
  const toggleRightPanel = useCallback(() => {
    setShowRightPanel(!showRightPanel);
    if (!showRightPanel) {
      setTempCustomizationSettings(customizationSettings);
    }
  }, [showRightPanel, customizationSettings]);

  const handleApplySettings = useCallback(() => {
    setCustomizationSettings(tempCustomizationSettings);
  }, [tempCustomizationSettings]);

  const captureImage = async () => {
    if (!captureRef.current) return null;

    setIsCapturing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      return await html2canvas(captureRef.current, {
        useCORS: true,
        backgroundColor: '#000000',
        scale: 2,
        width: 600,
        height: 360,
      });
    } catch (error) {
      console.error('Error capturing image:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownload = async () => {
    const canvas = await captureImage();
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'pnl-snapshot.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopyImage = async () => {
    const canvas = await captureImage();
    if (!canvas) return;

    canvas.toBlob(async blob => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        console.log('Image copied to clipboard!');
      } catch (err) {
        console.error('Clipboard write failed:', err);
      }
    }, 'image/png');
  };

  const handleTempColorChange = useCallback((key: keyof CustomizationSettings, color: string) => {
    setTempCustomizationSettings(prev => ({ ...prev, [key]: color }));
  }, []);

  const handleTempToggle = useCallback((key: keyof CustomizationSettings) => {
    setTempCustomizationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleColorPickerClickInternal = (id: string, event: React.MouseEvent) => {
    if (activePicker === id) {
      setActivePicker(null);
      return;
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const pickerWidth = 200;
    const pickerHeight = 250;

    let left = rect.right + 10;
    let top = rect.top;

    if (left + pickerWidth > viewportWidth) {
      left = rect.left - pickerWidth - 10;
    }
    if (top + pickerHeight > viewportHeight) {
      top = viewportHeight - pickerHeight - 20;
    }
    if (top < 20) {
      top = 20;
    }

    setPickerPosition({ top, left });
    setActivePicker(id);
  };

  const handleBgSelect = (bg: string) => {
    setSelectedBg(bg);
    setCustomizationSettings(defaultCustomizationSettings);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setUploadedBg(result);
          setSelectedBg(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const colorChangeHandlers = useMemo(() => ({
    mainText: (color: string) => handleTempColorChange('mainTextColor', color),
    positivePNL: (color: string) => handleTempColorChange('positivePNLColor', color),
    negativePNL: (color: string) => handleTempColorChange('negativePNLColor', color),
    rectangleText: (color: string) => handleTempColorChange('rectangleTextColor', color),
  }), [handleTempColorChange]);

  const colorInputs = useMemo(() => ({
    mainText: (
      <ColorInput
        color={tempCustomizationSettings.mainTextColor}
        onChange={colorChangeHandlers.mainText}
        label="Main Text"
        id="mainText"
        defaultColor="#EAEDFF"
      />
    ),
    positivePNL: (
      <ColorInput
        color={tempCustomizationSettings.positivePNLColor}
        onChange={colorChangeHandlers.positivePNL}
        label="Positive PNL"
        id="positivePNL"
        defaultColor="#2FE3AC"
      />
    ),
    negativePNL: (
      <ColorInput
        color={tempCustomizationSettings.negativePNLColor}
        onChange={colorChangeHandlers.negativePNL}
        label="Negative PNL"
        id="negativePNL"
        defaultColor="#EC397A"
      />
    ),
    rectangleText: (
      <ColorInput
        color={tempCustomizationSettings.rectangleTextColor}
        onChange={colorChangeHandlers.rectangleText}
        label="Rectangle Text"
        id="rectangleText"
        defaultColor="#020307"
      />
    ),
  }), [tempCustomizationSettings, colorChangeHandlers]);

  const getCurrentColor = (pickerId: string) => {
    const key = pickerId.includes('mainText') ? 'mainTextColor' :
      pickerId.includes('positivePNL') ? 'positivePNLColor' :
        pickerId.includes('negativePNL') ? 'negativePNLColor' :
          'rectangleTextColor';
    return tempCustomizationSettings[key];
  };

  const getSettingKey = (pickerId: string): keyof CustomizationSettings => {
    return pickerId.includes('mainText') ? 'mainTextColor' :
      pickerId.includes('positivePNL') ? 'positivePNLColor' :
        pickerId.includes('negativePNL') ? 'negativePNLColor' :
          'rectangleTextColor';
  };

  useEffect(() => {
    setCurrency(tokenName);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activePicker && pickerRefs.current[activePicker] &&
        !pickerRefs.current[activePicker]?.contains(event.target as Node)) {
        setActivePicker(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePicker]);

  useEffect(() => {
    const handleColorPickerClick = (event: any) => {
      const { id, event: clickEvent } = event.detail;
      handleColorPickerClickInternal(id, clickEvent);
    };

    document.addEventListener('colorPickerClick', handleColorPickerClick);
    return () => document.removeEventListener('colorPickerClick', handleColorPickerClick);
  }, [activePicker]);

  useEffect(() => {
    setTempCustomizationSettings(customizationSettings);
  }, [customizationSettings]);
  //popup modals
  const Modals = (
    <>
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
            <div style={{ position: 'relative' }}>
              <input
                className="tokenselect"
                onChange={(e) => {
                  settokenString(e.target.value);
                }}
                onKeyDown={handleTokenSelectKeyDown}
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
          <div ref={popupref} className="tokenselectbg" >
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
            <div style={{ position: 'relative' }}>
              <input
                className="tokenselect"
                onChange={(e) => {
                  settokenString(e.target.value);
                }}
                onKeyDown={handleTokenSelectKeyDown}
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
                          } else {
                            setSendUsdValue(`$${e.currentTarget.value.replace(/^\$/, '')}`);
                            const calculatedAmount = calculateTokenAmount(
                              e.currentTarget.value.replace(/^\$/, ''),
                              tradesByMarket[
                              (({ baseAsset, quoteAsset }) =>
                                (baseAsset === wethticker ? ethticker : baseAsset) +
                                (quoteAsset === wethticker ? ethticker : quoteAsset)
                              )(getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc))
                              ],
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
                              tradesByMarket[
                              (({ baseAsset, quoteAsset }) =>
                                (baseAsset === wethticker ? ethticker : baseAsset) +
                                (quoteAsset === wethticker ? ethticker : quoteAsset)
                              )(getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc))
                              ],
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
                          } else {
                            setSendUsdValue(`$${e.target.value.replace(/^\$/, '')}`);
                            const calculatedAmount = calculateTokenAmount(
                              e.target.value.replace(/^\$/, ''),
                              tradesByMarket[
                              (({ baseAsset, quoteAsset }) =>
                                (baseAsset === wethticker ? ethticker : baseAsset) +
                                (quoteAsset === wethticker ? ethticker : quoteAsset)
                              )(getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc))
                              ],
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
                              tradesByMarket[
                              (({ baseAsset, quoteAsset }) =>
                                (baseAsset === wethticker ? ethticker : baseAsset) +
                                (quoteAsset === wethticker ? ethticker : quoteAsset)
                              )(getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc))
                              ],
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
                            (sendTokenIn == eth && !client)
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
                              tradesByMarket[
                              (({ baseAsset, quoteAsset }) =>
                                (baseAsset === wethticker ? ethticker : baseAsset) +
                                (quoteAsset === wethticker ? ethticker : quoteAsset)
                              )(getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc))
                              ],
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
                              tradesByMarket[
                              (({ baseAsset, quoteAsset }) =>
                                (baseAsset === wethticker ? ethticker : baseAsset) +
                                (quoteAsset === wethticker ? ethticker : quoteAsset)
                              )(getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc))
                              ],
                              sendTokenIn,
                              getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc),
                            )
                          )}
                    </div>
                    <img src={sendSwitch} className="send-arrow" />
                  </div>
                </div>
              </div>
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
                className={`send-swap-button ${isSigning ? 'signing' : ''}`}
                onClick={async () => {
                  if (
                    connected &&
                    userchain === activechain
                  ) {
                    let hash: any;
                    setIsSigning(true)
                    if (client) {
                      txPending.current = true
                    }
                    try {
                      if (sendTokenIn == eth) {
                        hash = await sendUserOperationAsync({
                          uo: sendeth(
                            recipient as `0x${string}`,
                            sendAmountIn,
                          )
                        });
                        if (!client) {
                          txPending.current = true
                        }
                        newTxPopup(
                          (client ? hash.hash : await waitForTxReceipt(hash.hash)),
                          'send',
                          eth,
                          '',
                          customRound(
                            Number(sendAmountIn) / 10 ** Number(tokendict[eth].decimals),
                            3,
                          ),
                          0,
                          '',
                          recipient,
                        );
                      } else {
                        hash = await sendUserOperationAsync({
                          uo: sendtokens(
                            sendTokenIn as `0x${string}`,
                            recipient as `0x${string}`,
                            sendAmountIn,
                          )
                        });
                        if (!client) {
                          txPending.current = true
                        }
                        newTxPopup(
                          (client ? hash.hash : await waitForTxReceipt(hash.hash)),
                          'send',
                          sendTokenIn,
                          '',
                          customRound(
                            Number(sendAmountIn) /
                            10 ** Number(tokendict[sendTokenIn].decimals),
                            3,
                          ),
                          0,
                          '',
                          recipient,
                        );
                      }
                      setSendUsdValue('')
                      setSendInputAmount('');
                      setSendAmountIn(BigInt(0));
                      setSendPopupButton(0);
                      setSendPopupButtonDisabled(true);
                      setIsSigning(false)
                      await refetch()
                      txPending.current = false
                    } catch (error) {
                      if (!(error instanceof TransactionExecutionError)) {
                        newTxPopup(
                          hash.hash,
                          "sendFailed",
                          sendTokenIn === eth ? eth : sendTokenIn,
                          "",
                          customRound(
                            Number(sendAmountIn) / 10 ** Number(tokendict[sendTokenIn === eth ? eth : sendTokenIn].decimals),
                            3,
                          ),
                          0,
                          "",
                          recipient,
                        );
                      }
                    } finally {
                      txPending.current = false
                      setIsSigning(false)
                    }
                  } else {
                    !connected
                      ? setpopup(4)
                      : handleSetChain()
                  }
                }}
                disabled={sendPopupButtonDisabled || isSigning}
              >
                {isSigning ? (
                  <div className="button-content">
                    <div className="loading-spinner" />
                    {validOneCT ? t('') : t('signTransaction')}
                  </div>
                ) : !connected ? (
                  t('connectWallet')
                ) : sendPopupButton == 0 ? (
                  t('enterAmount')
                ) : sendPopupButton == 1 ? (
                  t('enterWalletAddress')
                ) : sendPopupButton == 2 ? (
                  t('send')
                ) : sendPopupButton == 3 ? (
                  t('insufficient') +
                  (tokendict[sendTokenIn].ticker || '?') +
                  ' ' +
                  t('bal')
                ) : sendPopupButton == 4 ? (
                  `${t('switchto')} ${t(settings.chainConfig[activechain].name)}`
                ) : (
                  t('connectWallet')
                )}
              </button>
            </div>
          </div>
        ) : null}
        {popup === 4 ? (
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
                              src={getWalletIcon()}
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
                  className="popup-deposit-button"
                  onClick={() => {
                    setpopup(12)
                  }}
                >
                  <svg
                    className="deposit-icon"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="7 11 12 16 17 11"></polyline>
                    <line x1="12" y1="1" x2="12" y2="14"></line>
                    <path d="M22 14V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V14" />

                  </svg>
                </button>
                <button
                  className="popup-disconnect-button"
                  onClick={() => {
                    setOneCTSigner('')
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
                  style={{ marginTop: 15, marginBottom: 10, height: 215 }}
                >
                  <LoadingOverlay
                    isVisible={true}
                    bgcolor={'#00000000'}
                    height={30}
                  />
                </div>
              ) : (
                <>
                  <div className="total-account-summary-value">
                    <div
                      className={`total-value ${isBlurred ? 'blurred' : ''}`}
                    >
                      ${typeof totalAccountValue === 'number' ? formatCommas(totalAccountValue.toFixed(2)) : '0.00'}
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
                      chartData={typeof totalAccountValue === 'number' ? [
                        ...chartData.slice(0, -1),
                        {
                          ...chartData[chartData.length - 1],
                          value: totalAccountValue,
                        },
                      ] : chartData}
                      portChartLoading={portChartLoading}
                      chartDays={chartDays}
                      setChartDays={setChartDays}
                      isBlurred={isBlurred}
                    />
                  </div>
                </>
              )}
              <div className="graph-assets-divider" />
              <div className="portfolio-content-popup">
                <PortfolioContent
                  tokenList={Object.values(tokendict)}
                  onMarketSelect={onMarketSelect}
                  setSendTokenIn={setSendTokenIn}
                  setpopup={setpopup}
                  sortConfig={memoizedSortConfig}
                  tokenBalances={tokenBalances}
                  marketsData={marketsData}
                  isBlurred={isBlurred}
                />
              </div>
            </div>
          )
        ) : null}
        {popup === 5 ? ( // settings
          <div
            className="layout-settings-background"
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

            <div className="settings-main-container">
              <div className="settings-sidebar">
                <div className="settings-section-buttons">
                  <button
                    className={`settings-section-button ${activeSettingsSection === 'general' ? 'active' : ''}`}
                    onClick={() => updateActiveSettingsSection('general')}
                  >
                    <span>{t('general')}</span>
                  </button>
                  {windowWidth >= 1020 && (
                    <button
                      className={`settings-section-button ${activeSettingsSection === 'layout' ? 'active' : ''}`}
                      onClick={() => updateActiveSettingsSection('layout')}
                    >
                      <span>{t('tradingLayout')}</span>
                    </button>
                  )}
                  <button
                    className={`settings-section-button ${activeSettingsSection === 'display' ? 'active' : ''}`}
                    onClick={() => updateActiveSettingsSection('display')}
                  >
                    <span>{t('tradingSettings')}</span>
                  </button>
                  <button
                    className={`settings-section-button ${activeSettingsSection === 'audio' ? 'active' : ''}`}
                    onClick={() => updateActiveSettingsSection('audio')}
                  >
                    <span>{t('notifications')}</span>
                  </button>
                  <button
                    className={`settings-section-button ${activeSettingsSection === 'keybinds' ? 'active' : ''}`}
                    onClick={() => updateActiveSettingsSection('keybinds')}
                  >
                    <span>{t('keybinds')}</span>
                  </button>
                </div>

                <button
                  className="revert-settings-button sidebar-revert-button"
                  onClick={() => {
                    setLanguage('EN');
                    localStorage.setItem('crystal_language', 'EN');

                    setHideNotificationPopups(false);
                    localStorage.setItem('crystal_hide_notification_popups', 'false');

                    setNotificationPosition('bottom-right');
                    localStorage.setItem('crystal_notification_position', 'bottom-right');

                    setHiddenPopupTypes({});
                    localStorage.setItem('crystal_hidden_popup_types', JSON.stringify({}));

                    setLayoutSettings('default');
                    localStorage.setItem('crystal_layout', 'default');

                    setOrderbookPosition('right');
                    localStorage.setItem('crystal_orderbook', 'right');

                    setIsMarksVisible(true);
                    localStorage.setItem('crystal_marks_visible', 'true');

                    setIsOrdersVisible(true);
                    localStorage.setItem('crystal_orders_visible', 'true');

                    setHideNotificationPopups(false);
                    localStorage.setItem('crystal_hide_notification_popups', 'false');

                    setIsOrderbookVisible(true);
                    localStorage.setItem('crystal_orderbook_visible', 'true');

                    setIsOrderCenterVisible(true);
                    localStorage.setItem(
                      'crystal_ordercenter_visible',
                      'true',
                    );

                    setShowChartOutliers(false);
                    localStorage.setItem('crystal_show_chart_outliers', 'false');

                    setIsAudioEnabled(false);
                    localStorage.setItem('crystal_audio_notifications', 'false');

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

                    setTradingMode('spot');
                    localStorage.setItem('crystal_trading_mode', 'spot');
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

                    localStorage.setItem('crystal_chart_timeframe', '5')

                    let defaultHeight: number;

                    if (window.innerHeight > 1080) defaultHeight = 367.58;
                    else if (window.innerHeight > 960) defaultHeight = 324.38;
                    else if (window.innerHeight > 840) defaultHeight = 282.18;
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
              </div>

              <div className="right-side-settings-panel">
                <div className="settings-content-panel">
                  {activeSettingsSection === 'general' && (
                    <div className="settings-section-content">
                      <div className="layout-language-row">
                        <span className="layout-language-label">{t('language')}</span>
                        <div className="settings-section-subtitle">
                          {t('selectPreferredLanguage')}
                        </div>
                        <div className="language-selector-app-container">
                          <div className="language-grid">
                            {languageOptions.map((lang) => (
                              <button
                                key={lang.code}
                                className={`language-grid-item ${language === lang.code ? 'active' : ''}`}
                                onClick={() => {
                                  setLanguage(lang.code);
                                  localStorage.setItem('crystal_language', lang.code);
                                }}
                              >
                                {lang.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="slider-settings-section">
                        <div className="settings-subsection">
                          <div className="layout-section-title">{t('tradingMode')}</div>
                          <div className="settings-section-subtitle">
                            {t('chooseTradingInterface')}
                          </div>

                          <div className="slider-mode-options">
                            <button
                              className={`control-layout-option ${tradingMode === 'spot' ? 'active' : ''}`}
                              onClick={() => {
                                setTradingMode('spot');
                                localStorage.setItem('crystal_trading_mode', 'spot');
                              }}
                            >
                              <div className="layout-label">
                                <span className="control-layout-name">{t('spot')}</span>
                              </div>
                            </button>

                            <button
                              className={`control-layout-option ${tradingMode === 'trenches' ? 'active' : ''}`}
                              onClick={() => {
                                setTradingMode('trenches');
                                localStorage.setItem('crystal_trading_mode', 'trenches');
                              }}
                            >
                              <div className="layout-label">
                                <span className="control-layout-name">{t('trenches')}</span>
                              </div>
                            </button>
                          </div>
                        </div>

                        <div className="settings-subsection">
                          <div className="layout-section-title">{t('balanceSliderMode')}</div>
                          <div className="settings-section-subtitle">
                            {t('chooseBalancePercentages')}
                          </div>

                          <div className="slider-mode-options">
                            <button
                              className={`control-layout-option ${(tradingMode === 'spot' ? spotSliderMode : trenchesSliderMode) === 'slider' ? 'active' : ''}`}
                              onClick={() => {
                                if (tradingMode === 'spot') {
                                  setSpotSliderMode('slider');
                                  localStorage.setItem('crystal_spot_slider_mode', 'slider');
                                } else {
                                  setTrenchesSliderMode('slider');
                                  localStorage.setItem('crystal_trenches_slider_mode', 'slider');
                                }
                              }}
                            >
                              <div className="layout-label">
                                <span className="control-layout-name">{t('slider')}</span>
                              </div>
                            </button>

                            <button
                              className={`control-layout-option ${(tradingMode === 'spot' ? spotSliderMode : trenchesSliderMode) === 'presets' ? 'active' : ''}`}
                              onClick={() => {
                                if (tradingMode === 'spot') {
                                  setSpotSliderMode('presets');
                                  localStorage.setItem('crystal_spot_slider_mode', 'presets');
                                } else {
                                  setTrenchesSliderMode('presets');
                                  localStorage.setItem('crystal_trenches_slider_mode', 'presets');
                                }
                              }}
                            >
                              <div className="layout-label">
                                <span className="control-layout-name">{t('presets')}</span>
                              </div>
                            </button>

                            <button
                              className={`control-layout-option ${(tradingMode === 'spot' ? spotSliderMode : trenchesSliderMode) === 'increment' ? 'active' : ''}`}
                              onClick={() => {
                                if (tradingMode === 'spot') {
                                  setSpotSliderMode('increment');
                                  localStorage.setItem('crystal_spot_slider_mode', 'increment');
                                } else {
                                  setTrenchesSliderMode('increment');
                                  localStorage.setItem('crystal_trenches_slider_mode', 'increment');
                                }
                              }}
                            >
                              <div className="layout-label">
                                <span className="control-layout-name">{t('increment')}</span>
                              </div>
                            </button>
                          </div>
                        </div>

                        {(tradingMode === 'spot' ? spotSliderMode : trenchesSliderMode) === 'presets' && (
                          <div className="settings-subsection">
                            <div className="layout-section-title">{t('presetPercentages')}</div>
                            <div className="settings-section-subtitle">
                              {t('setThreeFavoritePercentages')}
                            </div>
                            <div className="preset-inputs">
                              {(tradingMode === 'spot' ? spotSliderPresets : trenchesSliderPresets).map((preset: number, index: number) => (
                                <div key={index} className="preset-input-group">
                                  <label className="preset-label">{t('preset')} {index + 1}</label>
                                  <div className="preset-input-container">
                                    <input
                                      type="text"
                                      value={preset === 0 ? '' : preset.toString()}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const inputValue = e.target.value;
                                        const currentPresets = tradingMode === 'spot' ? spotSliderPresets : trenchesSliderPresets;
                                        const setCurrentPresets = tradingMode === 'spot' ? setSpotSliderPresets : setTrenchesSliderPresets;
                                        const storageKey = tradingMode === 'spot' ? 'crystal_spot_slider_presets' : 'crystal_trenches_slider_presets';

                                        if (inputValue === '') {
                                          const newPresets = [...currentPresets];
                                          newPresets[index] = 0;
                                          setCurrentPresets(newPresets);
                                          localStorage.setItem(storageKey, JSON.stringify(newPresets));
                                        } else if (/^\d*\.?\d*$/.test(inputValue)) {
                                          const numValue = parseFloat(inputValue);
                                          if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                                            const newPresets = [...currentPresets];
                                            newPresets[index] = numValue;
                                            setCurrentPresets(newPresets);
                                            localStorage.setItem(storageKey, JSON.stringify(newPresets));
                                          }
                                        }
                                      }}
                                      placeholder="0"
                                      className="preset-input"
                                    />
                                    <span className="preset-unit">%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(tradingMode === 'spot' ? spotSliderMode : trenchesSliderMode) === 'increment' && (
                          <div className="settings-subsection">
                            <div className="layout-section-title">{t('incrementAmount')}</div>
                            <div className="settings-section-subtitle">
                              {t('setIncrementAmount')}
                            </div>
                            <div className="increment-input-group">
                              <div className="increment-input-container">
                                <div className="percentage-input-wrapper">
                                  <input
                                    type="text"
                                    value={(tradingMode === 'spot' ? spotSliderIncrement : trenchesSliderIncrement) === 0 ? '' : (tradingMode === 'spot' ? spotSliderIncrement : trenchesSliderIncrement).toString()}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const inputValue = e.target.value;
                                      const setCurrentIncrement = tradingMode === 'spot' ? setSpotSliderIncrement : setTrenchesSliderIncrement;
                                      const storageKey = tradingMode === 'spot' ? 'crystal_spot_slider_increment' : 'crystal_trenches_slider_increment';

                                      if (inputValue === '') {
                                        setCurrentIncrement(0);
                                        localStorage.setItem(storageKey, '0');
                                      } else if (/^\d*\.?\d{0,2}$/.test(inputValue)) {
                                        const numValue = parseFloat(inputValue || '0') || 0;
                                        if (numValue <= 50) {
                                          setCurrentIncrement(numValue);
                                          localStorage.setItem(storageKey, numValue.toString());
                                        }
                                      }
                                    }}
                                    placeholder="10"
                                    className="percentage-input"
                                  />
                                  <span className="percentage-input-suffix">%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="settings-subsection">
                          <div className="layout-section-title">
                            {t('customRPCGraphAPI')}
                          </div>
                          <div className="settings-section-subtitle">
                            {t('specifyCustomEndpoints')}
                          </div>

                          <div className="custom-rpc-settings">
                            <div className="input-group">
                              <label className="input-label">{t('rpcURL')}</label>
                              <input
                                type="text"
                                className="input-field"
                                value={rpcUrl}
                                placeholder="https://mainnet.infura.io/v3/…"
                                onChange={e => {
                                  setRpcUrl(e.target.value)
                                  localStorage.setItem('crystal_rpc_url', e.target.value)
                                }}
                              />
                            </div>

                            <div className="input-group">
                              <label className="input-label">{t('graphAPIURL')}</label>
                              <input
                                type="text"
                                className="input-field"
                                value={graphUrl}
                                placeholder="https://api.thegraph.com/subgraphs/name/…"
                                onChange={e => {
                                  setGraphUrl(e.target.value)
                                  localStorage.setItem('crystal_graph_url', e.target.value)
                                }}
                              />
                            </div>

                            <div className="input-group">
                              <label className="input-label">{t('graphAPIKey')} <small>({t('optional')})</small></label>
                              <input
                                type="text"
                                className="input-field"
                                value={graphKey}
                                placeholder={t('yourAPIKey')}
                                onChange={e => {
                                  setGraphKey(e.target.value)
                                  localStorage.setItem('crystal_graph_key', e.target.value)
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSettingsSection === 'layout' && (
                    <div className="settings-section-content">
                      {!simpleView && (<div className="layout-options">
                        <div>
                          <div className="layout-section-title">
                            {t('tradePanelPosition')}
                          </div>
                          <div className="settings-section-subtitle">
                            {t('chooseTradingPanelPosition')}
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
                          <div className="settings-section-subtitle">
                            {t('positionOrderbookSide')}
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
                      </div>)}
                      <div>
                        <div className="layout-section-title">
                          {t('notificationPosition')}
                        </div>
                        <div className="settings-section-subtitle">
                          {t('chooseNotificationPopupPosition')}
                        </div>
                        <div className="notification-position-grid">
                          <button
                            className={`notification-position-option ${notificationPosition === 'top-left' ? 'active' : ''}`}
                            onClick={() => updateNotificationPosition('top-left')}
                          >
                            <div className="position-preview-container">
                              <div className="preview-popup top-left"></div>
                            </div>
                          </button>

                          <button
                            className={`notification-position-option ${notificationPosition === 'top-right' ? 'active' : ''}`}
                            onClick={() => updateNotificationPosition('top-right')}
                          >
                            <div className="position-preview-container">
                              <div className="preview-popup top-right"></div>
                            </div>
                          </button>

                          <button
                            className={`notification-position-option ${notificationPosition === 'bottom-left' ? 'active' : ''}`}
                            onClick={() => updateNotificationPosition('bottom-left')}
                          >
                            <div className="position-preview-container">
                              <div className="preview-popup bottom-left"></div>
                            </div>
                          </button>

                          <button
                            className={`notification-position-option ${notificationPosition === 'bottom-right' ? 'active' : ''}`}
                            onClick={() => updateNotificationPosition('bottom-right')}
                          >
                            <div className="position-preview-container">
                              <div className="preview-popup bottom-right"></div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSettingsSection === 'display' && (
                    <div className="settings-section-content">
                      <div className="trade-markers-toggle-row">
                        <div className="settings-option-info">
                          <span className="trade-markers-toggle-label">
                            {t('showTradeMarkers')}
                          </span>
                          <span className="settings-option-subtitle">
                            {t('displayTradeExecutionMarkers')}
                          </span>
                        </div>
                        <ToggleSwitch
                          checked={isMarksVisible}
                          onChange={() => {
                            setIsMarksVisible(!isMarksVisible);
                            localStorage.setItem(
                              'crystal_marks_visible',
                              JSON.stringify(!isMarksVisible),
                            );
                          }}
                        />
                      </div>
                      <div className="trade-markers-toggle-row">
                        <div className="settings-option-info">
                          <span className="trade-markers-toggle-label">
                            {t('showChartOrders')}
                          </span>
                          <span className="settings-option-subtitle">
                            {t('showActiveOrdersOnChart')}
                          </span>
                        </div>
                        <ToggleSwitch
                          checked={isOrdersVisible}
                          onChange={() => {
                            setIsOrdersVisible(!isOrdersVisible);
                            localStorage.setItem(
                              'crystal_orders_visible',
                              JSON.stringify(!isOrdersVisible),
                            );
                          }}
                        />
                      </div>
                      <div className="orderbook-toggle-row">
                        <div className="settings-option-info">
                          <span className="orderbook-toggle-label">
                            {t('showOB')}
                          </span>
                          <span className="settings-option-subtitle">
                            {t('displayOrderbookPanel')}
                          </span>
                        </div>
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
                        <div className="settings-option-info">
                          <span className="ordercenter-toggle-label">
                            {t('showOC')}
                          </span>
                          <span className="settings-option-subtitle">
                            {t('showOrderCenterAtBottom')}
                          </span>
                        </div>
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
                        <div className="settings-option-info">
                          <span className="audio-toggle-label">{t('showChartOutliers')}</span>
                          <span className="settings-option-subtitle">
                            {t('includeOutlierDataPoints')}
                          </span>
                        </div>
                        <ToggleSwitch
                          checked={showChartOutliers}
                          onChange={() => {
                            setShowChartOutliers(!showChartOutliers);
                            localStorage.setItem('crystal_show_chart_outliers', JSON.stringify(!showChartOutliers));
                          }}
                        />
                      </div>
                      {/* <div className="audio-toggle-row">
                        <div className="settings-option-info">
                          <span className="audio-toggle-label">{t('useOneCT')}</span>
                          <span className="settings-option-subtitle">
                            {t('useOneCTText')}
                          </span>
                        </div>
                        <ToggleSwitch
                          checked={useOneCT}
                          onChange={() => {
                            setUseOneCT(!useOneCT);
                            localStorage.setItem('crystal_use_onect', JSON.stringify(!useOneCT));
                          }}
                        />
                      </div>

                      {useOneCT && (
                        <div className="subwallets-section">
                          {validOneCT && (
                            <div className="active-wallet-section">
                              <div className="layout-section-title">{t('activeWallet')}</div>
                              <div className="onect-address-box">
                                <span className="onect-address">{address}</span>
                                <CopyButton textToCopy={address as string} />
                              </div>
                            </div>
                          )}

                          <div className="create-wallet-section">
                            <div className="layout-section-title">{t('subWallets')}</div>
                            <div className="settings-section-subtitle">
                              {t('createAndManageSubWallets')}
                            </div>
                            <button
                              className="reset-tab-button create-subwallet-btn"
                              onClick={createSubWallet}
                            >
                              {t('createNewWallet')}
                            </button>
                          </div>

                          {subWallets.length > 0 && (
                            <div className="subwallets-list">
                              <div className="layout-section-title">{t('savedSubWallets')}</div>
                              <div className="subwallets-container">
                                {subWallets.map((wallet, index) => (
                                  <div key={index} className="subwallet-item">
                                    <div className="subwallet-info">
                                      <div className="subwallet-address">
                                        <span className="subwallet-label">{t('wallet')} {index + 1}:</span>
                                        <span className="subwallet-address-text">{wallet.address}</span>
                                        <CopyButton textToCopy={wallet.address} />
                                      </div>
                                      <div className="subwallet-private-key">
                                        <span className="subwallet-label">{t('privateKey')}:</span>
                                        <span className="subwallet-key-text">{wallet.privateKey.slice(0, 10)}...{wallet.privateKey.slice(-6)}</span>
                                        <CopyButton textToCopy={wallet.privateKey} />
                                      </div>
                                    </div>
                                    <div className="subwallet-actions">
                                      <button
                                        className="subwallet-action-btn activate-btn"
                                        onClick={() => setActiveSubWallet(wallet.privateKey)}
                                      >
                                        {t('setActive')}
                                      </button>
                                      <button
                                        className="subwallet-action-btn delete-btn"
                                        onClick={() => deleteSubWallet(index)}
                                      >
                                        {t('delete')}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )} */}
                    </div>
                  )}

                  {activeSettingsSection === 'audio' && (
                    <div className="settings-section-content">
                      <div className="audio-toggle-row">
                        <div className="settings-option-info">
                          <span className="audio-toggle-label">{t('audioNotifications')}</span>
                          <span className="settings-option-subtitle">
                            {t('playSoundsForTrades')}
                          </span>
                        </div>
                        <ToggleSwitch
                          checked={isAudioEnabled}
                          onChange={() => {
                            setIsAudioEnabled(!isAudioEnabled);
                            localStorage.setItem('crystal_audio_notifications', JSON.stringify(!isAudioEnabled));
                          }}
                        />
                      </div>
                      {isAudioEnabled && (
                        <div className="popup-type-settings">
                          <div className="popup-type-toggle-row">
                            <div className="settings-option-info">
                              <span className="popup-type-label">{t('playSwapSounds')}</span>
                              <span className="settings-option-subtitle">
                                {t('playSoundsForSwaps')}
                              </span>
                            </div>
                            <ToggleSwitch
                              checked={audioGroups.swap}
                              onChange={() => toggleAudioGroup('swap')}
                            />
                          </div>

                          <div className="popup-type-toggle-row">
                            <div className="settings-option-info">
                              <span className="popup-type-label">{t('playOrderSounds')}</span>
                              <span className="settings-option-subtitle">
                                {t('playSoundsForOrders')}
                              </span>
                            </div>
                            <ToggleSwitch
                              checked={audioGroups.order}
                              onChange={() => toggleAudioGroup('order')}
                            />
                          </div>

                          <div className="popup-type-toggle-row">
                            <div className="settings-option-info">
                              <span className="popup-type-label">{t('playTransferSounds')}</span>
                              <span className="settings-option-subtitle">
                                {t('playSoundsForTransfers')}
                              </span>
                            </div>
                            <ToggleSwitch
                              checked={audioGroups.transfer}
                              onChange={() => toggleAudioGroup('transfer')}
                            />
                          </div>

                          <div className="popup-type-toggle-row">
                            <div className="settings-option-info">
                              <span className="popup-type-label">{t('playApprovalSounds')}</span>
                              <span className="settings-option-subtitle">
                                {t('playSoundsForApprovals')}
                              </span>
                            </div>
                            <ToggleSwitch
                              checked={audioGroups.approve}
                              onChange={() => toggleAudioGroup('approve')}
                            />
                          </div>
                        </div>
                      )}

                      <div className="audio-toggle-row">
                        <div className="settings-option-info">
                          <span className="audio-toggle-label">{t('notificationControls')}</span>
                          <span className="settings-option-subtitle">
                            {t('showAdvancedNotificationOptions')}
                          </span>
                        </div>
                        <ToggleSwitch
                          checked={hideNotificationPopups}
                          onChange={() => {
                            const newValue = !hideNotificationPopups;
                            setHideNotificationPopups(newValue);
                            localStorage.setItem('crystal_hide_notification_popups', JSON.stringify(newValue));
                          }}
                        />
                      </div>

                      {hideNotificationPopups && (
                        <div className="popup-type-settings">
                          <div className="popup-type-toggle-row">
                            <div className="settings-option-info">
                              <span className="popup-type-label">{t('hideSwapNotifications')}</span>
                              <span className="settings-option-subtitle">
                                {t('hideSwapNotificationsDesc')}
                              </span>
                            </div>
                            <ToggleSwitch
                              checked={hiddenPopupTypes.swap === true && hiddenPopupTypes.swapFailed === true}
                              onChange={() => {
                                const shouldHide = !(hiddenPopupTypes.swap === true && hiddenPopupTypes.swapFailed === true);
                                updateMultipleHiddenPopupTypes(['swap', 'swapFailed'], shouldHide);
                              }}
                            />
                          </div>

                          <div className="popup-type-toggle-row">
                            <div className="settings-option-info">
                              <span className="popup-type-label">{t('hideOrderNotifications')}</span>
                              <span className="settings-option-subtitle">
                                {t('hideOrderNotificationsDesc')}
                              </span>
                            </div>
                            <ToggleSwitch
                              checked={hiddenPopupTypes.limit === true && hiddenPopupTypes.fill === true && hiddenPopupTypes.cancel === true && hiddenPopupTypes.limitFailed === true}
                              onChange={() => {
                                const shouldHide = !(hiddenPopupTypes.limit === true && hiddenPopupTypes.fill === true && hiddenPopupTypes.cancel === true && hiddenPopupTypes.limitFailed === true);
                                updateMultipleHiddenPopupTypes(['limit', 'fill', 'cancel', 'limitFailed'], shouldHide);
                              }}
                            />
                          </div>

                          <div className="popup-type-toggle-row">
                            <div className="settings-option-info">
                              <span className="popup-type-label">{t('hideTransferNotifications')}</span>
                              <span className="settings-option-subtitle">
                                {t('hideTransferNotificationsDesc')}
                              </span>
                            </div>
                            <ToggleSwitch
                              checked={hiddenPopupTypes.send === true && hiddenPopupTypes.sendFailed === true && hiddenPopupTypes.wrap === true && hiddenPopupTypes.unwrap === true && hiddenPopupTypes.stake === true}
                              onChange={() => {
                                const shouldHide = !(hiddenPopupTypes.send === true && hiddenPopupTypes.sendFailed === true && hiddenPopupTypes.wrap === true && hiddenPopupTypes.unwrap === true && hiddenPopupTypes.stake === true);
                                updateMultipleHiddenPopupTypes(['send', 'sendFailed', 'wrap', 'unwrap', 'stake'], shouldHide);
                              }}
                            />
                          </div>

                          <div className="popup-type-toggle-row">
                            <div className="settings-option-info">
                              <span className="popup-type-label">{t('hideApprovalNotifications')}</span>
                              <span className="settings-option-subtitle">
                                {t('hideApprovalNotificationsDesc')}
                              </span>
                            </div>
                            <ToggleSwitch
                              checked={hiddenPopupTypes.approve === true}
                              onChange={() => {
                                updateHiddenPopupType('approve', !hiddenPopupTypes.approve);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSettingsSection === 'keybinds' && (
                    <div className="settings-section-content">
                      <div className="keybinds-section">
                        <div className="settings-subsection">
                          <div className="layout-section-title">{t('tradingShortcuts')}</div>
                          <div className="settings-section-subtitle">
                            {t('keyboardShortcutsForTrading')}
                          </div>
                          {renderKeybindButton('submitTransaction', t('submitTransaction'), t('executeTradesPlaceOrders'))}
                          {renderKeybindButton('switchTokens', t('switchTokens'), t('swapInputOutputTokens'))}
                          {renderKeybindButton('maxAmount', t('maxAmount'), t('setInputToMaxBalance'))}
                          {renderKeybindButton('focusInput', t('focusInput'), t('focusMainAmountInput'))}
                        </div>
                        <div className="settings-subsection">
                          <div className="layout-section-title">{t('tokenSelection')}</div>
                          <div className="settings-section-subtitle">
                            {t('quickAccessTokenSelection')}
                          </div>
                          {renderKeybindButton('openTokenInSelect', t('selectInputToken'), t('openTokenSelectionForInput'))}
                          {renderKeybindButton('openTokenOutSelect', t('selectOutputToken'), t('openTokenSelectionForOutput'))}
                        </div>
                        <div className="settings-subsection">
                          <div className="layout-section-title">{t('orderManagement')}</div>
                          <div className="settings-section-subtitle">
                            {t('manageActiveOrdersQuickly')}
                          </div>
                          {renderKeybindButton('cancelAllOrders', t('cancelAllOrders'), t('cancelAllActiveOrders'))}
                          {renderKeybindButton('cancelTopOrder', t('cancelTopOrder'), t('cancelMostRecentOrder'))}
                        </div>
                        <div className="settings-subsection">
                          <div className="layout-section-title">{t('interfaceShortcuts')}</div>
                          <div className="settings-section-subtitle">
                            {t('navigateInterfaceQuickly')}
                          </div>
                          {renderKeybindButton('openSettings', t('openSettings'), t('openSettingsPanel'))}
                          {renderKeybindButton('openWallet', t('openWallet'), t('openWalletConnectionPortfolio'))}
                          {renderKeybindButton('toggleSimpleView', t('toggleSimpleView'), t('switchBetweenSimpleAdvanced'))}
                          {renderKeybindButton('refreshQuote', t('refreshQuote'), t('refreshCurrentPriceQuote'))}
                        </div>
                        <div className="settings-subsection">
                          <div className="layout-section-title">{t('navigationShortcuts')}</div>
                          <div className="settings-section-subtitle">
                            {t('jumpToDifferentPagesQuickly')}
                          </div>
                          {renderKeybindButton('openPortfolio', t('openPortfolio'), t('navigateToPortfolioPage'))}
                          {renderKeybindButton('openLeaderboard', t('openLeaderboard'), t('navigateToLeaderboardPage'))}
                          {renderKeybindButton('openReferrals', t('openReferrals'), t('navigateToReferralsPage'))}
                        </div>
                        <div className="settings-subsection">
                          <div className="layout-section-title">{t('marketShortcuts')}</div>
                          <div className="settings-section-subtitle">
                            {t('interactWithMarketDataQuickly')}
                          </div>
                          {renderKeybindButton('toggleFavorite', t('toggleFavorite'), t('addRemoveCurrentMarketFavorites'))}
                        </div>
                        <div className="settings-subsection">
                          <div className="layout-section-title">{t('orderCenterShortcuts')}</div>
                          <div className="settings-section-subtitle">
                            {t('navigateOrderCenterTabsQuickly')}
                          </div>
                          {renderKeybindButton('switchToOrders', t('switchToOrders'), t('viewActiveOrdersTab'))}
                          {renderKeybindButton('switchToTrades', t('switchToTradeHistory'), t('viewTradeHistoryTab'))}
                          {renderKeybindButton('switchToHistory', t('switchToOrderHistory'), t('viewOrderHistoryTab'))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className="reset-tab-button"
                  onClick={() => {
                    switch (activeSettingsSection) {
                      case 'general':
                        setLanguage('EN');
                        localStorage.setItem('crystal_language', 'EN');
                        setTradingMode('spot');
                        localStorage.setItem('crystal_trading_mode', 'spot');
                        setSliderMode('slider');
                        localStorage.setItem('crystal_slider_mode', 'slider');
                        setSliderPresets([25, 50, 75]);
                        localStorage.setItem('crystal_slider_presets', JSON.stringify([25, 50, 75]));
                        setSliderIncrement(10);
                        localStorage.setItem('crystal_slider_increment', '10');
                        setRpcUrl('');
                        localStorage.setItem('crystal_rpc_url', '');
                        setGraphUrl('');
                        localStorage.setItem('crystal_graph_url', '');
                        setGraphKey('');
                        localStorage.setItem('crystal_graph_key', '');
                        break;

                      case 'layout':
                        setLayoutSettings('default');
                        localStorage.setItem('crystal_layout', 'default');
                        setOrderbookPosition('right');
                        localStorage.setItem('crystal_orderbook', 'right');
                        setNotificationPosition('bottom-right');
                        localStorage.setItem('crystal_notification_position', 'bottom-right');
                        break;

                      case 'display':
                        setIsMarksVisible(true);
                        localStorage.setItem('crystal_marks_visible', 'true');
                        setIsOrdersVisible(true);
                        localStorage.setItem('crystal_orders_visible', 'true');
                        setIsOrderbookVisible(true);
                        localStorage.setItem('crystal_orderbook_visible', 'true');
                        setIsOrderCenterVisible(true);
                        localStorage.setItem('crystal_ordercenter_visible', 'true');
                        setShowChartOutliers(false);
                        localStorage.setItem('crystal_show_chart_outliers', 'false');
                        break;

                      case 'audio':
                        setIsAudioEnabled(false);
                        localStorage.setItem('crystal_audio_notifications', 'false');
                        setAudioGroups({ swap: true, order: true, transfer: true, approve: true });
                        localStorage.setItem('crystal_audio_groups', JSON.stringify({ swap: true, order: true, transfer: true, approve: true }));
                        setHideNotificationPopups(false);
                        localStorage.setItem('crystal_hide_notification_popups', 'false');
                        setHiddenPopupTypes({});
                        localStorage.setItem('crystal_hidden_popup_types', JSON.stringify({}));
                        break;

                      case 'keybinds':
                        const defaultKeybinds = {
                          submitTransaction: 'Enter',
                          switchTokens: 'KeyZ',
                          maxAmount: 'KeyA',
                          focusInput: 'KeyF',
                          openSettings: 'KeyS',
                          openWallet: 'KeyW',
                          openTokenInSelect: 'KeyQ',
                          openTokenOutSelect: 'KeyE',
                          cancelAllOrders: 'KeyC',
                          cancelTopOrder: 'KeyX',
                          openPortfolio: 'KeyP',
                          openLeaderboard: 'KeyL',
                          openReferrals: 'KeyO',
                          toggleFavorite: 'KeyM',
                          toggleSimpleView: 'KeyV',
                          refreshQuote: 'KeyR',
                          switchToOrders: 'Digit1',
                          switchToTrades: 'Digit2',
                          switchToHistory: 'Digit3',
                        };
                        setKeybinds(defaultKeybinds);
                        localStorage.setItem('crystal_keybinds', JSON.stringify(defaultKeybinds));
                        setEditingKeybind(null);
                        setIsListeningForKey(false);
                        break;
                    }
                  }}
                >
                  {t('resetTab')}
                </button>
              </div>
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
            <div
              className="search-markets-list"
              id="search-markets-list-container"
            >
              {sortedMarkets.filter((market) => {
                const matchesSearch = market?.pair
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase());
                const notWeth =
                  market?.baseAddress !== settings.chainConfig[activechain].weth;
                return matchesSearch && notWeth;
              }).length > 0 ? (
                sortedMarkets.filter((market) => {
                  const matchesSearch = market?.pair
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());
                  const notWeth =
                    market?.baseAddress !== settings.chainConfig[activechain].weth;
                  return matchesSearch && notWeth;
                }).map((market, index) => (
                  <div
                    key={market.pair}
                    className={`search-market-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => {
                      setSearchQuery('');
                      setpopup(0);
                      onMarketSelect(market)
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    role="button"
                    tabIndex={-1}
                    id={`search-market-item-${index}`}
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
                <h1 className="social-heading">Join our growing community!</h1>
                <p className="social-description">
                  Crystal Exchange is being released in phases. Be the first to know when new features arrive by joining our vibrant community!
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
                    />
                    <span className="wallet-name">Follow us on X (Twitter)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {popup === 10 ? ( // send token search popup
          <div ref={popupref} className="sendselectbg">
            <div className="send-top-row">
              <input
                className="sendselect"
                onChange={(e) => {
                  settokenString(e.target.value);
                }}
                placeholder={t('searchToken')}
                autoFocus={!(windowWidth <= 1020)}
              />
              {tokenString && (
                <button
                  className="sendselect-clear visible"
                  onClick={() => {
                    settokenString('');
                    const input = document.querySelector('.sendselect') as HTMLInputElement;
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
        ) : null}
        {popup === 11 ? (
          <div ref={popupref} className="generating-address-popup">
            <span className="loader"></span>
            <h2 className="generating-address-title">Fetching Your Smart Wallet</h2>
            <p className="generating-address-text">
              Please wait while your smart wallet address is being loaded...
            </p>
          </div>
        ) : null}
        {popup === 12 ? (
          <div ref={popupref} className="deposit-page-container" onClick={(e) => e.stopPropagation()}>
            <div className="deposit-page-header">
              <h2>{t("deposit")}</h2>
              <button className="deposit-close-button" onClick={() => { setpopup(0) }}>
                <img src={closebutton} className="deposit-close-icon" />
              </button>
            </div>
            <div className={`token-dropdown-container ${dropdownOpen ? 'open' : ''}`}>
              <div
                className="selected-token-display"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="selected-token-info">
                  <img className="deposit-token-icon" src={tokendict[selectedDepositToken].image} />
                  <span className="deposit-token-name">{tokendict[selectedDepositToken].name}</span>
                  <span className="deposit-token-ticker">({tokendict[selectedDepositToken].ticker})</span>
                  <CopyButton textToCopy={selectedDepositToken} />
                </div>
                <div className="selected-token-balance">
                  {formatDisplayValue(
                    tokenBalances[selectedDepositToken] || 0,
                    Number(tokendict[selectedDepositToken].decimals || 18)
                  )}

                  <svg
                    className="deposit-button-arrow"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>

              </div>

              {dropdownOpen && (
                <div className="token-dropdown-list">
                  {Object.entries(tokendict).map(([address, token]) => (
                    <div
                      key={address}
                      className={`token-dropdown-item ${selectedDepositToken === address ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedDepositToken(address);
                        setDropdownOpen(false);
                      }}
                    >
                      <div className="dropdown-token-info">
                        <img className="deposit-token-icon" src={token.image} />
                        <span className="deposit-token-name">{token.name}</span>
                        <span className="deposit-token-ticker">({token.ticker})</span>
                        <CopyButton textToCopy={address} />
                      </div>
                      <span className="deposit-token-balance">
                        {formatDisplayValue(
                          tokenBalances[address] || 0,
                          Number(token.decimals || 18)
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="deposit-subtitle">{t('sendTo')}</span>
            <div className="deposit-address-container">
              <div className="deposit-address-box">
                <span className="deposit-address">{address}</span>
                <button
                  className={`deposit-copy-button ${copyTooltipVisible ? 'success' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(address || '');
                    setCopyTooltipVisible(true);
                    setTimeout(() => setCopyTooltipVisible(false), 2000);
                  }}
                >
                  {copyTooltipVisible ?
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg> :
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                    </svg>
                  }
                </button>
              </div>
            </div>

            <div className="deposit-warning">
              {t("depositWarning")}
            </div>
            <div className="deposit-qr-container">
              <QRCodeSVG
                value={address || ''}
                size={170}
                level="H"
                includeMargin={true}
                bgColor="#000000"
                fgColor="#ffffff"
              />
            </div>

            <button
              className="deposit-done-button"
              onClick={() => { setpopup(4) }}
            >
              {t('done')}
            </button>
          </div>
        ) : null}
        {popup === 13 ? (
          <div ref={popupref} className="high-impact-confirmation-popup">
            <div className="high-impact-confirmation-header">
              <button
                className="high-impact-close-button"
                onClick={() => {
                  setpopup(0);
                  window.dispatchEvent(new Event('high-impact-cancel'));
                }}
              >
                <img src={closebutton} className="close-button-icon" />
              </button>
            </div>
            <div className="high-impact-content">
              <div className="high-impact-warning-icon">
                <img className="warning-image" src={warningicon} />
              </div>

              <p className="high-impact-message">
                {t('highPriceImpactMessage')}
              </p>

              <div className="high-impact-details">
                <div className="high-impact-detail-row">
                  <span className="high-impact-value-title">{t('priceImpact')}</span>
                  <span className="high-impact-value">{priceImpact}</span>
                </div>

                <div className="high-impact-detail-row">
                  <span className="high-impact-value-title">{t('pay')}</span>
                  <span className="high-impact-value">
                    {formatDisplayValue(
                      amountIn,
                      Number(tokendict[tokenIn].decimals)
                    )} {tokendict[tokenIn].ticker}
                  </span>
                </div>

                <div className="high-impact-detail-row">
                  <span className="high-impact-value-title">{t('receive')}</span>
                  <span className="high-impact-value">
                    {formatDisplayValue(
                      amountOutSwap,
                      Number(tokendict[tokenOut].decimals)
                    )} {tokendict[tokenOut].ticker}
                  </span>
                </div>
              </div>
            </div>

            <div className="high-impact-actions">
              <button
                className="high-impact-cancel-button"
                onClick={() => {
                  setpopup(0);
                  window.dispatchEvent(new Event('high-impact-cancel'));
                }}
              >
                {t('cancel')}
              </button>

              <button
                className="high-impact-confirm-button"
                onClick={async () => {
                  setpopup(0);
                  window.dispatchEvent(new Event('high-impact-confirm'));
                }}
              >
                {t('confirmSwap')}
              </button>
            </div>
          </div>
        ) : null}
        {(popup === 14 || popup === 15 || popup === 17 || popup === 18 || isTransitioning) ? (
          <div ref={popupref} className={`onboarding-container ${exitingChallenge ? 'exiting' : ''}`}>
            <div
              className={`onboarding-background-blur ${exitingChallenge ? 'exiting' : ''} ${(isTransitioning && transitionDirection === 'forward') || (popup === 15 && connected)
                ? 'active'
                : ''
                }`}
            />
            <div className="onboarding-crystal-logo">
              <img className="onboarding-crystal-logo-image" src={clearlogo} />
              <span className="onboarding-crystal-text">CRYSTAL</span>
            </div>
            <CrystalObject />

            {user && !connected && (
              <div className="generating-address-popup">
                <span className="loader"></span>
                <h2 className="generating-address-title">Fetching Your Smart Wallet</h2>
                <p className="generating-address-text">
                  Please wait while your smart wallet address is being loaded...
                </p>
              </div>
            )}
            {connected ? (
              <>
                <div className="step-indicators">
                  {[1, 2, 3, 4, 5, 6].map((index) => (
                    <div
                      key={index}
                      className={`step-indicator ${popup === 14
                        ? index === 1 ? 'active' : ''
                        : popup === 17
                          ? index === 2 ? 'active' : ''
                          : popup === 18
                            ? index === 3 ? 'active' : ''
                            : (currentStep + 4) === index ? 'active' : ''
                        } ${popup === 14
                          ? index < 1 ? 'completed' : ''
                          : popup === 17
                            ? index < 2 ? 'completed' : ''
                            : popup === 18
                              ? index < 3 ? 'completed' : ''
                              : (currentStep + 4) > index ? 'completed' : ''
                        } ${isTransitioning ? 'transitioning' : ''}`}
                    />
                  ))}
                </div>

                <div
                  className={`onboarding-wrapper ${isTransitioning ? `transitioning ${transitionDirection}` : ''
                    }`}
                >
                  {popup == 18 && (
                    <div className="onboarding-section active">
                      <div className="onboarding-split-container">
                        <div className="onboarding-left-side">
                          <div className="onboarding-content">
                            <div className="onboarding-header">
                              <h2 className="onboarding-title">Join our growing community!</h2>
                              <p className="onboarding-subtitle">
                                Crystal is being released in phases. Join our community to be the first to know when new features arrive.
                              </p>
                            </div>

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
                                />
                                <span className="wallet-name">Follow us on X (Twitter)</span>
                              </button>
                            </div>

                            <div className="onboarding-actions">
                              <button
                                className="skip-button"
                                onClick={() => {
                                  audio.currentTime = 0;
                                  audio.play();
                                  setpopup(15);
                                }}
                              >
                                Continue
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {popup == 17 && (
                    <div className="onboarding-section active">
                      <div className="onboarding-split-container">
                        <div className="onboarding-left-side">
                          <div className="onboarding-content">
                            <div className="onboarding-header">
                              <h2 className="use-ref-title">Add a referral code (optional)</h2>
                              <div className="form-group">
                                {error && <span className="error-message">{error}</span>}

                                <input
                                  className="username-input"
                                  placeholder="Enter a code"
                                  value={typedRefCode}
                                  onChange={e => {
                                    const value = e.target.value.trim();
                                    if (isValidInput(value) || value === "") {
                                      setTypedRefCode(value);
                                      setError('')
                                    }
                                  }}
                                />
                              </div>

                              <div className="onboarding-actions">
                                <button
                                  className={`create-username-button ${isRefSigning ? 'signing' : !typedRefCode ? 'disabled' : ''}`}
                                  disabled={!typedRefCode || isRefSigning}
                                  onClick={async () => {
                                    const ok = await handleSetRef(typedRefCode);
                                    if (ok) {
                                      audio.currentTime = 0;
                                      audio.play();
                                      setpopup(18);
                                    }
                                  }}
                                >
                                  {isRefSigning ? (
                                    <div className="button-content">
                                      <div className="loading-spinner" />
                                      {t('signTransaction')}
                                    </div>
                                  ) : t('setReferral')}
                                </button>

                                <button
                                  className="skip-button"
                                  onClick={() => {
                                    audio.currentTime = 0;
                                    audio.play();
                                    setpopup(18);
                                  }}
                                >
                                  Skip
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    className={`onboarding-section username-section ${(popup === 14 || (isTransitioning)) && ((!username && usernameResolved) || transitionDirection == 'backward')
                      ? 'active'
                      : ''
                      }`}
                  >
                    <div className="onboarding-split-container">
                      <div className="onboarding-left-side">
                        <div className="onboarding-content">
                          <div className="onboarding-header">
                            <h2 className="onboarding-title">
                              {username ? 'Edit Name' : 'Enter a Name'}
                            </h2>
                            <p className="onboarding-subtitle">
                              {username
                                ? 'Update the name that appears on the leaderboard.'
                                : 'This username will be visible on the leaderboard to all.'}
                            </p>
                          </div>

                          <div className="onboarding-form">
                            <div className="form-group">
                              <label className="form-label">Your Wallet Address</label>
                              <div className="wallet-address">{address || '0x1234...5678'}</div>
                            </div>

                            <div className="form-group">
                              <label htmlFor="username" className="form-label">Username</label>
                              <input
                                type="text"
                                id="username"
                                className="username-input"
                                placeholder={usernameInput ? usernameInput : 'Enter a username'}
                                value={usernameInput || ''}
                                onChange={e => {
                                  const value = e.target.value.trim();
                                  if (isValidInput(value) || value === "") {
                                    setUsernameInput(value);
                                  }
                                }}
                              />
                              {usernameError && <p className="username-error">{usernameError}</p>}
                            </div>
                          </div>

                          <button
                            className={`create-username-button ${isUsernameSigning ? 'signing' : ''
                              } ${!usernameInput.trim() ? 'disabled' : ''}`}
                            onClick={async () => {
                              if (!usernameInput.trim() || isUsernameSigning || usernameInput === username) return;
                              await handleEditUsername(usernameInput)
                            }}
                            disabled={!usernameInput.trim() || isUsernameSigning || usernameInput === username}
                          >
                            {isUsernameSigning ? (
                              <div className="button-content">
                                <div className="loading-spinner" />
                                {t('signTransaction')}
                              </div>
                            ) : username ? t('editUsername') : 'Create Username'}
                          </button>
                        </div>

                        {(!usernameInput || username !== '') && (
                          <>
                            <div className="onboarding-actions">
                              <button
                                className="skip-button"
                                type="button"
                                onClick={() => {
                                  audio.currentTime = 0;
                                  audio.play();
                                  setpopup(17);
                                }}
                              >
                                {!usernameInput ? "Continue Without Username" : "Continue"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`onboarding-section challenge-section ${popup === 15 ||
                      (isTransitioning && transitionDirection === 'forward')
                      ? 'active'
                      : ''
                      } ${exitingChallenge ? 'exiting' : ''}`}
                    data-step={currentStep}
                  >
                    <div className="challenge-intro-split-container">
                      <div className="floating-elements-container">
                        <img src={circleleft} className="circle-bottom-crystal" />
                        <img src={topright} className="top-right-crystal" />
                        <img src={topleft} className="top-left-crystal" />
                        <img src={circleleft} className="circle-left-crystal" />
                        <img src={veryleft} className="very-left-crystal" />
                        <img src={circleleft} className="circle-right-crystal" />
                        <img src={veryright} className="very-right-crystal" />
                        <img src={topmiddle} className="top-middle-crystal" />
                        <img src={topleft} className="bottom-middle-crystal" />
                        <img src={circleleft} className="bottom-right-crystal" />

                        <div className="account-setup-header">
                          <div className="account-setup-title-wrapper">
                            <h2 className="account-setup-title">
                              {t('challengeOverview')}
                            </h2>
                            <p className="account-setup-subtitle">
                              {t('learnHowToCompete')}
                            </p>
                          </div>
                        </div>

                        <div className="challenge-intro-content-wrapper">
                          <div className="challenge-intro-content-side">
                            <div className="challenge-intro-content-inner">
                              <div className="intro-text">
                                <h3 className="intro-title">
                                  {currentStep === 0
                                    ? t('precisionMatters')
                                    : currentStep === 1
                                      ? t('earnCrystals')
                                      : t('claimRewards')}
                                </h3>
                                <p className="intro-description">
                                  {currentStep === 0
                                    ? t('placeYourBids')
                                    : currentStep === 1
                                      ? t('midsGiveYou')
                                      : t('competeOnLeaderboards')}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`challenge-intro-visual-side${animating ? ' is-animating' : ''
                              }`}
                          >
                            {currentStep === 0 && (
                              <div className="intro-image-container">
                                <div
                                  className={`zoom-container${animationStarted ? ' zoom-active' : ''
                                    }`}
                                >
                                  <img
                                    src={part1image}
                                    className="intro-image"
                                    alt="Tutorial illustration"
                                  />
                                </div>
                              </div>
                            )}

                            {currentStep === 1 && (
                              <div className="xp-animation-container">
                                <div className="user-profile">
                                  <div className="self-pfp">
                                    <img
                                      src={defaultPfp}
                                      className="profile-pic-second"
                                      alt="User profile"
                                    />
                                    <div className="username-display">
                                      @{usernameInput || 'player123'}
                                    </div>
                                    <div className="xp-counter">
                                      <img
                                        src={crystalxp}
                                        className="xp-icon"
                                        alt="Crystal XP"
                                        style={{
                                          width: '23px',
                                          height: '23px',
                                          verticalAlign: 'middle',
                                        }}
                                      />
                                      <span className="self-pfp-xp">8732.23</span>
                                    </div>
                                  </div>

                                  <div className="challenge-mini-leaderboard">
                                    <div className="mini-leaderboard-header">
                                      <span className="mini-leaderboard-title">
                                        Season 0 Leaderboard
                                      </span>
                                      <span className="mini-leaderboard-time">
                                        7d 22h 50m 54s
                                      </span>
                                    </div>

                                    <div className="mini-progress-bar">
                                      <div className="mini-progress-fill"></div>
                                    </div>

                                    <div className="mini-leaderboard-user">
                                      <div className="mini-leaderboard-user-left">
                                        <span className="mini-user-rank">#62</span>
                                        <span className="mini-user-address">
                                          0xB080...c423
                                          <svg
                                            className="mini-user-copy-icon"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#b8b7b7"
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
                                            />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                          </svg>
                                        </span>
                                      </div>
                                      <div className="mini-user-points">
                                        14.448
                                        <img
                                          src={crystalxp}
                                          width="14"
                                          height="14"
                                          alt="XP"
                                        />
                                      </div>
                                    </div>

                                    <div className="mini-top-users">
                                      <div className="mini-top-user mini-top-user-1">
                                        <span className="mini-top-rank mini-top-rank-1">
                                          1
                                        </span>
                                        <img
                                          className="mini-user-pfp"
                                          src={firstPlacePfp}
                                        />
                                        <div className="mini-points-container">
                                          <img
                                            src={crystalxp}
                                            className="mini-token-icon"
                                            alt="Token"
                                          />
                                          <span className="mini-top-points">
                                            234,236
                                          </span>
                                        </div>
                                      </div>

                                      <div className="mini-top-user mini-top-user-2">
                                        <span className="mini-top-rank mini-top-rank-2">
                                          2
                                        </span>
                                        <img
                                          className="mini-user-pfp"
                                          src={secondPlacePfp}
                                        />
                                        <div className="mini-points-container">
                                          <img
                                            src={crystalxp}
                                            className="mini-token-icon"
                                            alt="Token"
                                          />
                                          <span className="mini-top-points">91,585</span>
                                        </div>
                                      </div>

                                      <div className="mini-top-user mini-top-user-3">
                                        <span className="mini-top-rank mini-top-rank-3">
                                          3
                                        </span>
                                        <img
                                          className="mini-user-pfp"
                                          src={thirdPlacePfp}
                                        />
                                        <div className="mini-points-container">
                                          <img
                                            src={crystalxp}
                                            className="mini-token-icon"
                                            alt="Token"
                                          />
                                          <span className="mini-top-points">52,181</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {currentStep === 2 && (
                              <div className="rewards-container">
                                <div className="rewards-stage">
                                  <img className="lbstand" src={lbstand} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="account-setup-footer">
                      {currentStep > 0 ? (
                        <button className="back-button" onClick={handleBackClick}>
                          {t('back')}
                        </button>
                      ) : (
                        <button
                          className="back-to-username-button"
                          onClick={handleBackToUsernameWithAudio}
                        >
                          {t('back')}
                        </button>
                      )}

                      <button className="next-button" onClick={handleNextClick}>
                        {currentStep < 2 ? t('next') : t('getStarted')}
                      </button>

                      <audio ref={backAudioRef} src={backaudio} preload="auto" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              !user && (
                <div
                  className="connect-wallet-username-onboarding-bg"
                >
                  {showWelcomeScreen || isTransitioning ? (
                    <div className={`crystal-welcome-screen ${isWelcomeExiting ? 'welcome-screen-exit' : ''}`}>
                      <div className="welcome-screen-content">
                        <div className="welcome-text-container">
                          <p className="welcome-text"></p>
                        </div>
                        {animationStarted ? (
                          <button
                            className="welcome-enter-button"
                            onClick={handleWelcomeTransition}
                          >
                            EXPLORE NOW
                          </button>
                        ) : (
                          <button
                            className="welcome-enter-button noshow"
                            onClick={handleWelcomeTransition}
                          >
                            EXPLORE NOW
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={`connect-wallet-username-wrapper ${!showWelcomeScreen || isConnectEntering ? 'connect-wallet-enter' : 'connect-wallet-hidden'}`}>
                      <div className="onboarding-connect-wallet">
                        <div className="smart-wallet-reminder">
                          <img className="onboarding-info-icon" src={infoicon} />
                          Use a Smart Wallet to receive a multiplier on all Crystals
                        </div>
                        <div className="connect-wallet-content-container">
                          <AuthCard {...alchemyconfig.ui.auth} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        ) : null}
        {popup === 16 ? (
          <div className="edit-username-bg">
            <div ref={popupref} className="edit-username-container">
              <div className="onboarding-split-container">
                <div className="onboarding-content">
                  <div className="onboarding-header">
                    <h2 className="onboarding-title">{t("editUsername")}</h2>
                    <p className="onboarding-subtitle">{t("editUsernameSubtitle")}</p>
                  </div>

                  <div className="onboarding-form">
                    <div className="form-group">
                      <label className="form-label">{t("yourWalletAddress")}</label>
                      <div className="wallet-address">{address || "0x1234...5678"}</div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="username" className="form-label">{t('username')}</label>
                      <input
                        type="text"
                        id="username"
                        className="username-input"
                        placeholder="Enter a username"
                        value={usernameInput || ""}
                        onChange={e => {
                          const value = e.target.value.trim();
                          if (isValidInput(value) || value === "") {
                            setUsernameInput(value);
                          }
                        }}
                      />
                      {usernameError && (
                        <p className="username-error">{usernameError}</p>
                      )}
                    </div>
                  </div>
                  <button
                    className={`create-username-button ${isUsernameSigning ? 'signing' : ''} ${!usernameInput.trim() ? 'disabled' : ''}`}
                    onClick={async () => {
                      if (!usernameInput.trim() || isUsernameSigning) return;
                      await handleEditUsername(usernameInput);
                    }}
                    disabled={!usernameInput.trim() || isUsernameSigning}
                  >
                    {isUsernameSigning ? (
                      <div className="button-content">
                        <div className="loading-spinner" />
                        {t('signTransaction')}
                      </div>
                    ) : (
                      t("editUsername")
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
        ) : null}
        {popup === 19 ? (
          <div className="edit-limit-price-popup-bg" ref={popupref}>
            <div className="edit-limit-price-header">
              <span className="edit-limit-price-title">Edit Limit Price</span>
              <span className="edit-limit-price-subtitle">Adjust the price at which your limit order will trigger</span>
            </div>
            <div className="edit-limit-price-content">
              <input
                className="edit-limit-price-input"
                type="text"
                inputMode="decimal"
                value={displayLimitPrice}
                placeholder="0.00"
                onChange={e => {
                  const val = e.target.value;
                  if (!/^\d*(?:\.\d*)?$/.test(val)) return;
                  setlimitPriceString(val);
                  setHasEditedPrice(true);

                  if (val === '' || val === '.') {
                    setCurrentLimitPrice(0);
                  } else {
                    const num = parseFloat(val);
                    if (!isNaN(num)) setCurrentLimitPrice(num);
                  }
                }}
              />

              {(() => {
                const isBuyOrder = editingOrder[3] === 1;
                const market = markets[editingOrder[4]];
                let midPriceRaw = 0;
                if (mids?.[editingOrder[4]]?.[0]) {
                  const m = mids[editingOrder[4]];
                  midPriceRaw = isBuyOrder
                    ? (m[0] === m[1] ? m[2] : m[0])
                    : (m[0] === m[2] ? m[1] : m[0]);
                }
                const midPrice = market.priceFactor
                  ? Number(midPriceRaw) / Number(market.priceFactor)
                  : 0;
                const showWarning =
                  midPrice > 0 &&
                  ((isBuyOrder && currentLimitPrice > midPrice) ||
                    (!isBuyOrder && currentLimitPrice < midPrice));

                return showWarning ? (
                  <div className="edit-limit-price-warning">
                    <span>
                      {isBuyOrder
                        ? t('priceOutOfRangeWarningBuy')
                        : t('priceOutOfRangeWarningSell')}
                    </span>
                  </div>
                ) : null;
              })()}

              <div className="edit-limit-price-button-container">
                {[0.995, 0.99, 0.975, 0.95].map(factor => {
                  const label = `${((factor - 1) * 100).toFixed(2)}%`;
                  return (
                    <button
                      key={factor}
                      className="edit-limit-price-level-button"
                      onClick={() => {
                        const isBuyOrder = editingOrder[3] === 1;
                        const raw =
                          currentLimitPrice *
                          (isBuyOrder ? factor : 1 / factor);
                        const decimals = Math.floor(
                          Math.log10(Number(markets[editingOrder[4]].priceFactor))
                        );
                        const newPrice = parseFloat(raw.toFixed(decimals));
                        setCurrentLimitPrice(newPrice);
                        setlimitPriceString(newPrice.toFixed(decimals));
                        setHasEditedPrice(true);
                      }}
                    >
                      {editingOrder[3] === 1 ? label : `+${label.slice(1)}`}
                    </button>
                  );
                })}
              </div>

              <div className="edit-limit-price-actions">
                <div className="edit-limit-price-actions">
                  <button
                    className="edit-limit-price-confirm-button"
                    onClick={handleEditLimitPriceConfirm}
                    disabled={isEditingSigning || !hasEditedPrice}
                    style={{
                      opacity: isEditingSigning || !hasEditedPrice ? 0.5 : 1,
                      cursor: isEditingSigning || !hasEditedPrice
                        ? 'not-allowed'
                        : 'pointer',
                    }}
                  >
                    {isEditingSigning ? (
                      <div className="signing-indicator">
                        <div className="loading-spinner" />
                        {validOneCT ? null : <span>{t('signTransaction')}</span>}
                      </div>
                    ) : (
                      'Confirm'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {popup === 20 ? (
          <div className="edit-order-size-popup-bg" ref={popupref}>
            <div className="edit-order-size-header">
              <span className="edit-order-size-title">Edit Order Size</span>
              <span className="edit-order-size-subtitle">Adjust the size of your limit order</span>
            </div>
            <div className="edit-order-size-content">
              {(() => {
                if (!editingOrderSize) return null;

                const tokenAddress = editingOrderSize[3] === 1 ? markets[editingOrderSize[4]].quoteAddress : markets[editingOrderSize[4]].baseAddress;
                const tokenBalance = tokenBalances[tokenAddress] || BigInt(0);
                const tokenDecimals = Number(tokendict[tokenAddress]?.decimals || 18);
                const availableBalance = Number(tokenBalance) / (10 ** tokenDecimals);

                return (
                  <div className="edit-order-size-balance-display">
                    <img src={walleticon} className="balance-wallet-icon" />{' '}
                    <span className="balance-value">{availableBalance.toFixed(2)}</span>
                  </div>
                );
              })()}

              <div className="edit-order-size-input-container">
                <input
                  className="edit-order-size-input"
                  type="text"
                  inputMode="decimal"
                  value={displayValue}
                  placeholder="0.00"
                  onChange={e => {
                    const val = e.target.value;
                    if (!/^\d*(?:\.\d{0,8})?$/.test(val)) return;
                    setOrderSizeString(val);
                    setHasEditedSize(true);

                    if (val === '' || val === '.') {
                      setCurrentOrderSize(0);
                      setOrderSizePercent(0);
                    } else {
                      const num = parseFloat(val);
                      setCurrentOrderSize(num);
                      const pct = originalOrderSize > 0
                        ? Math.round((num / originalOrderSize) * 100)
                        : 100;
                      setOrderSizePercent(Math.min(200, Math.max(0, pct)));
                    }
                  }}
                />
                <span className="edit-order-size-token-label">
                  {editingOrderSize
                    ? tokendict[
                      editingOrderSize[3] === 1
                        ? markets[editingOrderSize[4]].quoteAddress
                        : markets[editingOrderSize[4]].baseAddress
                    ]?.ticker
                    : ''}
                </span>
              </div>

              {(() => {
                if (!editingOrderSize) return null;
                const isBuy = editingOrderSize[3] === 1;
                const market = markets[editingOrderSize[4]];

                let quotePrice = 1;
                if (market.quoteAsset !== 'USDC') {
                  const cfg = settings.chainConfig[activechain];
                  const key = `${market.quoteAsset === cfg.wethticker
                    ? cfg.ethticker
                    : market.quoteAsset}USDC`;

                  const tradesMap = trades as any as Record<string, any[]>;
                  const marketsMap = markets as any as Record<string, any>;

                  const lastTrade = tradesMap[key]?.[0]?.[3] ?? 0;
                  const priceFactor = Number(marketsMap[key]?.priceFactor ?? 1);
                  quotePrice = lastTrade / priceFactor;
                }
                const baseFilled =
                  editingOrderSize[7] / 10 ** Number(market.baseDecimals);

                const unfilledInput = isBuy
                  ? originalOrderSize - baseFilled * quotePrice
                  : (editingOrderSize[2] - editingOrderSize[7]) /
                  10 ** Number(market.baseDecimals);

                const needed = Math.max(0, currentOrderSize - unfilledInput);

                const inputAddr = isBuy ? market.quoteAddress : market.baseAddress;
                const available =
                  Number((tokenBalances as any)[inputAddr] ?? BigInt(0)) /
                  10 ** Number((tokendict as any)[inputAddr]?.decimals ?? 18);
                const isUsdcBacked = market.quoteAsset === 'USDC';
                const minSize = isUsdcBacked ? 1 : 0.1;
                const minSizeToken = isUsdcBacked ? 'USDC' : 'MON';
                const isBelowMinSize = currentOrderSize > 0 && currentOrderSize < minSize;

                if (needed > available) {
                  return (
                    <div className="edit-order-size-warning">
                      Insufficient balance. Need {needed.toFixed(6)} more{' '}
                      {(tokendict as any)[inputAddr]?.ticker}. Available:{' '}
                      {available.toFixed(6)}{' '}
                      {(tokendict as any)[inputAddr]?.ticker}
                    </div>
                  );
                }

                if (isBelowMinSize) {
                  return (
                    <div className="edit-order-size-warning">
                      Minimum order size is {minSize} {minSizeToken}
                    </div>
                  );
                }

                return null;
              })()}

              <div className="order-size-balance-slider-wrapper">
                <div className="order-size-slider-container">
                  <input
                    type="range"
                    className="order-size-balance-amount-slider"
                    min="0"
                    max="200"
                    step="1"
                    value={orderSizePercent}
                    onChange={e => {
                      const pct = parseInt(e.target.value, 10)
                      const newSize = (originalOrderSize * pct) / 100

                      setOrderSizePercent(pct)
                      setCurrentOrderSize(newSize)
                      setOrderSizeString(newSize === 0 ? '' : newSize.toFixed(2))
                      setHasEditedSize(true)

                      const rect = e.target.getBoundingClientRect()
                      const thumb = (pct / 200) * (rect.width - 15) + 15 / 2
                      const popup = document.querySelector('.order-size-slider-percentage-popup')
                      if (popup) (popup as HTMLElement).style.left = `${thumb}px`
                    }}
                    onMouseDown={() => {
                      const popup = document.querySelector('.order-size-slider-percentage-popup')
                      if (popup) popup.classList.add('visible')
                    }}
                    onMouseUp={() => {
                      const popup = document.querySelector('.order-size-slider-percentage-popup')
                      if (popup) popup.classList.remove('visible')
                    }}
                    style={{
                      background: `linear-gradient(to right, rgb(171, 176, 224) ${(orderSizePercent / 200) * 100}%, rgba(17, 17, 20, 1) ${(orderSizePercent / 200) * 100}%)`,
                    }}
                  />
                  <div className="order-size-slider-percentage-popup">{orderSizePercent}%</div>
                  <div className="order-size-balance-slider-marks">
                    {[0, 50, 100, 150, 200].map((markPercent) => (
                      <span
                        key={markPercent}
                        className="order-size-balance-slider-mark"
                        data-active={orderSizePercent >= markPercent}
                        data-percentage={markPercent}
                        onClick={() => {
                          const newSize = (originalOrderSize * markPercent) / 100;
                          setOrderSizePercent(markPercent);
                          setCurrentOrderSize(parseFloat(newSize.toFixed(8)));
                          setHasEditedSize(true);

                          const slider = document.querySelector('.order-size-balance-amount-slider');
                          const popup = document.querySelector('.order-size-slider-percentage-popup');
                          if (slider && popup) {
                            const rect = slider.getBoundingClientRect();
                            (popup as HTMLElement).style.left = `${(rect.width - 15) * (markPercent / 200) + 15 / 2}px`;
                          }
                        }}
                      >
                        {markPercent}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="edit-order-size-actions">
                <button
                  className="edit-order-size-confirm-button"
                  onClick={handleEditOrderSizeConfirm}
                  disabled={(() => {
                    if (!editingOrderSize) return true;

                    const tokenAddress = editingOrderSize[3] === 1 ? markets[editingOrderSize[4]].quoteAddress : markets[editingOrderSize[4]].baseAddress;
                    const tokenBalance = tokenBalances[tokenAddress] || BigInt(0);
                    const tokenDecimals = Number(tokendict[tokenAddress]?.decimals || 18);
                    const availableBalance = Number(tokenBalance) / (10 ** tokenDecimals);
                    const market = markets[editingOrderSize[4]];
                    const baseDecimals = Number(market.baseDecimals);
                    const currentUnfilledAmount = (editingOrderSize[2] - editingOrderSize[7]) / (10 ** baseDecimals);
                    const additionalAmountNeeded = Math.max(0, currentOrderSize - currentUnfilledAmount);
                    const hasInsufficientBalance = additionalAmountNeeded > availableBalance;
                    const isUsdcBacked = market.quoteAsset === 'USDC';
                    const minSize = isUsdcBacked ? 1 : 0.1;
                    const isBelowMinSize = currentOrderSize > 0 && currentOrderSize < minSize;

                    return isEditingSizeSigning || !hasEditedSize || currentOrderSize <= 0 || hasInsufficientBalance || isBelowMinSize;
                  })()}
                  style={{
                    opacity: (() => {
                      if (!editingOrderSize) return 0.5;

                      const tokenAddress = editingOrderSize[3] === 1 ? markets[editingOrderSize[4]].quoteAddress : markets[editingOrderSize[4]].baseAddress;
                      const tokenBalance = tokenBalances[tokenAddress] || BigInt(0);
                      const tokenDecimals = Number(tokendict[tokenAddress]?.decimals || 18);
                      const availableBalance = Number(tokenBalance) / (10 ** tokenDecimals);

                      const market = markets[editingOrderSize[4]];
                      const baseDecimals = Number(market.baseDecimals);
                      const currentUnfilledAmount = (editingOrderSize[2] - editingOrderSize[7]) / (10 ** baseDecimals);
                      const additionalAmountNeeded = Math.max(0, currentOrderSize - currentUnfilledAmount);
                      const hasInsufficientBalance = additionalAmountNeeded > availableBalance;
                      const isUsdcBacked = market.quoteAsset === 'USDC';
                      const minSize = isUsdcBacked ? 1 : 0.1;
                      const isBelowMinSize = currentOrderSize > 0 && currentOrderSize < minSize;

                      return (isEditingSizeSigning || !hasEditedSize || currentOrderSize <= 0 || hasInsufficientBalance || isBelowMinSize) ? 0.5 : 1;
                    })(),
                    cursor: (() => {
                      if (!editingOrderSize) return 'not-allowed';

                      const tokenAddress = editingOrderSize[3] === 1 ? markets[editingOrderSize[4]].quoteAddress : markets[editingOrderSize[4]].baseAddress;
                      const tokenBalance = tokenBalances[tokenAddress] || BigInt(0);
                      const tokenDecimals = Number(tokendict[tokenAddress]?.decimals || 18);
                      const availableBalance = Number(tokenBalance) / (10 ** tokenDecimals);

                      const market = markets[editingOrderSize[4]];
                      const baseDecimals = Number(market.baseDecimals);
                      const currentUnfilledAmount = (editingOrderSize[2] - editingOrderSize[7]) / (10 ** baseDecimals);
                      const additionalAmountNeeded = Math.max(0, currentOrderSize - currentUnfilledAmount);
                      const hasInsufficientBalance = additionalAmountNeeded > availableBalance;

                      const isUsdcBacked = market.quoteAsset === 'USDC';
                      const minSize = isUsdcBacked ? 1 : 0.1;
                      const isBelowMinSize = currentOrderSize > 0 && currentOrderSize < minSize;

                      return (isEditingSizeSigning || !hasEditedSize || currentOrderSize <= 0 || hasInsufficientBalance || isBelowMinSize) ? 'not-allowed' : 'pointer';
                    })()
                  }}
                >
                  {isEditingSizeSigning ? (
                    <div className="signing-indicator">
                      <div className="loading-spinner"></div>
                      <span>{t('signTransaction')}</span>
                    </div>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {popup === 21 ? (
          <div className="modal-overlay">
            <div className="modal-content" ref={popupref}>
              <div className="modal-header">
                <h2>Create New Vault</h2>
                <button
                  className="modal-close"
                  onClick={() => {
                    setpopup(0);
                    setMarketDropdownOpen(false);
                    setCreateForm({
                      name: '',
                      description: '',
                      depositAmount: '',
                      type: 'Spot',
                      tradableTokens: [],
                      selectedMarket: '',
                      website: '',
                      telegram: '',
                      discord: '',
                      twitter: ''
                    });
                  }}
                >
                  <img src={closebutton} className="close-button-icon" />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Vault Name</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter vault name"
                    className="form-input"
                  />
                  <small>Name is permanent and cannot be changed later</small>
                </div>

                <div className="form-group">
                  <label>Vault Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your vault strategy..."
                    className="form-textarea"
                    rows={3}
                  />
                  <small>Description can be edited later</small>
                </div>

                <div className="form-group">
                  <label>Vault Type</label>
                  <div className="vault-type-selector">
                    <button
                      className={`type-option ${createForm.type === 'Spot' ? 'active' : ''}`}
                      onClick={() => setCreateForm(prev => ({ ...prev, type: 'Spot', selectedMarket: '' }))}
                    >
                      <div className="type-title">Spot Vault</div>
                      <div className="type-desc">Trade on exactly one market</div>
                    </button>
                    <button
                      className={`type-option ${createForm.type === 'Margin' ? 'active' : ''}`}
                      onClick={() => setCreateForm(prev => ({ ...prev, type: 'Margin', selectedMarket: '' }))}
                    >
                      <div className="type-title">Cross-Margin Vault</div>
                      <div className="type-desc">Trade across multiple markets</div>
                    </button>
                  </div>
                </div>

                {createForm.type === 'Spot' ? (
                  <div className="form-group">
                    <label>Select Trading Market</label>
                    <div className={`vault-market-dropdown-container ${marketDropdownOpen ? 'open' : ''}`}>
                      <div
                        className="vault-market-selected-display"
                        onClick={() => setMarketDropdownOpen(!marketDropdownOpen)}
                      >
                        <div className="vault-market-selected-info">
                          {createForm.selectedMarket ? (
                            <>
                              <img
                                className="vault-market-icon"
                                src={markets[createForm.selectedMarket]?.image || tokendict[markets[createForm.selectedMarket]?.baseAddress]?.image}
                              />
                              <span className="vault-market-name">{createForm.selectedMarket.replace(/(.+)(.{4})$/, '$1/$2')}</span>
                            </>
                          ) : (
                            <span className="vault-market-placeholder">Choose a market...</span>
                          )}
                        </div>
                        <svg
                          className="vault-market-arrow"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>

                      {marketDropdownOpen && (
                        <div className="vault-market-dropdown-list">
                          {Object.values(markets).map((market) => {
                            const marketKey = market.baseAsset + market.quoteAsset;
                            return (
                              <div
                                key={marketKey}
                                className={`vault-market-dropdown-item ${createForm.selectedMarket === marketKey ? 'selected' : ''}`}
                                onClick={() => {
                                  setCreateForm(prev => ({ ...prev, selectedMarket: marketKey }));
                                  setMarketDropdownOpen(false);
                                }}
                              >
                                <div className="vault-market-item-info">
                                  <img
                                    className="vault-market-icon"
                                    src={market.image || tokendict[market.baseAddress]?.image}
                                  />
                                  <span className="vault-market-name">{market.baseAsset}/{market.quoteAsset}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <small>Your vault will only trade on this selected market</small>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Trading Markets</label>
                    <div className="vault-market-info-text">
                      <p>This vault is allowed to trade on all listed markets with USDC as the quote token.</p>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Socials <span className="optional-text">[Optional]</span></label>
                  <div className="vault-socials-grid">
                    <div className="vault-social-field">
                      <label className="vault-social-label">Website</label>
                      <input
                        type="text"
                        value={createForm.website}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, website: e.target.value }))}
                        className="form-input"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="vault-social-field">
                      <label className="vault-social-label">Telegram</label>
                      <input
                        type="text"
                        value={createForm.telegram}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, telegram: e.target.value }))}
                        className="form-input"
                        placeholder="https://t.me/..."
                      />
                    </div>
                    <div className="vault-social-field">
                      <label className="vault-social-label">Discord</label>
                      <input
                        type="text"
                        value={createForm.discord}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, discord: e.target.value }))}
                        className="form-input"
                        placeholder="https://discord.gg/..."
                      />
                    </div>
                    <div className="vault-social-field">
                      <label className="vault-social-label">X/Twitter</label>
                      <input
                        type="text"
                        value={createForm.twitter}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, twitter: e.target.value }))}
                        className="form-input"
                        placeholder="https://x.com/..."
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Initial Deposit (USDC)</label>
                  <input
                    type="number"
                    value={createForm.depositAmount}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, depositAmount: e.target.value }))}
                    placeholder="100"
                    min="100"
                    className="form-input"
                  />
                  <div className="vault-deposit-info">
                    <small>              <img src={walleticon} className="balance-wallet-icon" />{' '}
                      {formatDisplayValue(usdcBalance, usdcDecimals)} USDC</small>
                    <small>Minimum: {minDeposit} USDC + {creationFee} USDC creation fee</small>
                  </div>
                </div>

                <div className="vault-requirements">
                  <ul>
                    <li>Vault creator must maintain {'>'}5% of total liquidity</li>
                    <li>1000 USDC creation fee (non-refundable)</li>
                    <li>Name is permanent, description can be edited later</li>
                  </ul>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="vault-cancel-button"
                  onClick={() => {
                    setpopup(0);
                    setMarketDropdownOpen(false);
                    setCreateForm({
                      name: '',
                      description: '',
                      depositAmount: '',
                      type: 'Spot',
                      tradableTokens: [],
                      selectedMarket: '',
                      website: '',
                      telegram: '',
                      discord: '',
                      twitter: ''
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  className={`create-button ${isCreateFormValid() ? 'enabled' : ''}`}
                  onClick={handleCreateVault}
                  disabled={!isCreateFormValid()}
                >
                  Create Vault
                </button>
              </div>
            </div>
          </div>
        ) : null}

{popup === 22 ? (
  <div className="modal-overlay">
    <div className="modal-content vault-action-modal" ref={popupref}>
      <div className="modal-header">
        <h2>Deposit to {selectedVaultForAction?.name}</h2>
        <button
          className="modal-close"
          onClick={() => {
            setpopup(0);
            setSelectedVaultForAction(null);
            setVaultDepositAmounts({ quote: '', base: '' });
            setVaultQuoteExceedsBalance(false);
            setVaultBaseExceedsBalance(false);
            setDepositPreview(null);
          }}
        >
          <img src={closebutton} className="close-button-icon" />
        </button>
      </div>

      <div className="modal-body">
        <div className="vault-deposit-form">
          <div className="deposit-amounts-section">
            <div className={`deposit-input-group ${vaultQuoteExceedsBalance ? 'lp-input-container-balance-error' : ''}`}>
              <div className="deposit-input-wrapper">
                <input
                  type="text"
                  placeholder="0.0"
                  className={`deposit-amount-input ${vaultQuoteExceedsBalance ? 'lp-input-balance-error' : ''}`}
                  value={vaultDepositAmounts.quote}
                  onChange={(e) => handleVaultDepositAmountChange('quote', e.target.value)}
                />
                <div className="deposit-token-badge">
                  <img
                    src={tokendict[selectedVaultForAction?.quoteAsset]?.image}
                    className="deposit-token-icon"
                  />
                  <span>{tokendict[selectedVaultForAction?.quoteAsset]?.ticker}</span>
                </div>
              </div>
              <div className="lp-deposit-balance-wrapper">
                <div className={`lp-deposit-usd-value ${vaultQuoteExceedsBalance ? 'lp-usd-value-balance-error' : ''}`}>
                  ${((parseFloat(vaultDepositAmounts.quote) || 0) * 1).toFixed(2)}
                </div>
                <div className="deposit-balance">
                  <div className="deposit-balance-value">
                    <img src={walleticon} className="balance-wallet-icon" />
                    {selectedVaultForAction?.quoteAsset ? formatDisplayValue(
                      tokenBalances[selectedVaultForAction?.quoteAsset],
                      Number(tokendict[selectedVaultForAction?.quoteAsset]?.decimals || 18)
                    ) : '0.00'} {tokendict[selectedVaultForAction?.quoteAsset]?.ticker}
                  </div>
                  <button
                    className="vault-max-button"
                    onClick={() => {
                      if (selectedVaultForAction?.quoteAsset) {
                        const maxAmount = formatDisplayValue(
                          tokenBalances[selectedVaultForAction?.quoteAsset],
                          Number(tokendict[selectedVaultForAction?.quoteAsset]?.decimals || 18)
                        ).replace(/,/g, '');
                        handleVaultDepositAmountChange('quote', maxAmount);
                      }
                    }}
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>
            <div className={`deposit-input-group ${vaultBaseExceedsBalance ? 'lp-input-container-balance-error' : ''}`}>
              <div className="deposit-input-wrapper">
                <input
                  type="text"
                  placeholder="0.0"
                  className={`deposit-amount-input ${vaultBaseExceedsBalance ? 'lp-input-balance-error' : ''}`}
                  value={vaultDepositAmounts.base}
                  onChange={(e) => handleVaultDepositAmountChange('base', e.target.value)}
                />
                <div className="deposit-token-badge">
                  <img
                    src={tokendict[selectedVaultForAction?.baseAsset]?.image}
                    className="deposit-token-icon"
                  />
                  <span>{tokendict[selectedVaultForAction?.baseAsset]?.ticker}</span>
                </div>
              </div>
              <div className="lp-deposit-balance-wrapper">
                <div className={`lp-deposit-usd-value ${vaultBaseExceedsBalance ? 'lp-usd-value-balance-error' : ''}`}>
                  ${((parseFloat(vaultDepositAmounts.base) || 0) * 1).toFixed(2)}
                </div>
                <div className="deposit-balance">
                  <div className="deposit-balance-value">
                    <img src={walleticon} className="balance-wallet-icon" />
                    {selectedVaultForAction?.baseAsset ? formatDisplayValue(
                      tokenBalances[selectedVaultForAction?.baseAsset],
                      Number(tokendict[selectedVaultForAction?.baseAsset]?.decimals || 18)
                    ) : '0.00'} {tokendict[selectedVaultForAction?.baseAsset]?.ticker}
                  </div>
                  <button
                    className="vault-max-button"
                    onClick={() => {
                      if (selectedVaultForAction?.baseAsset) {
                        const maxAmount = formatDisplayValue(
                          tokenBalances[selectedVaultForAction?.baseAsset],
                          Number(tokendict[selectedVaultForAction?.baseAsset]?.decimals || 18)
                        ).replace(/,/g, '');
                        handleVaultDepositAmountChange('base', maxAmount);
                      }
                    }}
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>
          </div>

          {depositPreview && (
            <div className="deposit-preview">
              <h5 style={{ color: '#ffffff79', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Deposit Preview:</h5>
              <div className="preview-item">
                <span>Shares to receive:</span>
                <span>{formatDisplayValue(depositPreview.shares, 0)}</span>
              </div>
              <div className="preview-item">
                <span>Quote amount:</span>
                <span>{formatDisplayValue(depositPreview.amountQuote, Number(tokendict[selectedVaultForAction?.quoteAsset]?.decimals || 18))} {tokendict[selectedVaultForAction?.quoteAsset]?.ticker}</span>
              </div>
              <div className="preview-item">
                <span>Base amount:</span>
                <span>{formatDisplayValue(depositPreview.amountBase, Number(tokendict[selectedVaultForAction?.baseAsset]?.decimals || 18))} {tokendict[selectedVaultForAction?.baseAsset]?.ticker}</span>
              </div>
            </div>
          )}

          <div className="deposit-summary">
            <div className="deposit-summary-row">
              <span>Vault Type:</span>
              <span>{selectedVaultForAction?.type || 'Spot'}</span>
            </div>
            <div className="deposit-summary-row">
              <span>Total Value:</span>
              <span>
                {(() => {
                  const quoteValue = parseFloat(vaultDepositAmounts.quote) || 0;
                  const baseValue = parseFloat(vaultDepositAmounts.base) || 0;
                  const total = quoteValue + baseValue;
                  return `${total.toFixed(2)}`;
                })()}
              </span>
            </div>
            <div className="deposit-summary-row">
              <span>Status:</span>
              <span className={selectedVaultForAction?.closed ? 'status-error' : selectedVaultForAction?.locked ? 'status-warning' : 'status-success'}>
                {selectedVaultForAction?.closed ? 'Closed' : selectedVaultForAction?.locked ? 'Locked' : 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button
          className={`vault-confirm-button ${(!isVaultDepositEnabled() || isVaultDepositSigning) ? 'disabled' : ''}`}
          onClick={handleVaultDeposit}
          disabled={!isVaultDepositEnabled() || isVaultDepositSigning}
        >
          {isVaultDepositSigning ? (
            <div className="button-content">
              <div className="loading-spinner" />
              Depositing...
            </div>
          ) : (
            getVaultDepositButtonText()
          )}
        </button>
      </div>
    </div>
  </div>
) : null}


{popup === 23 ? (
  <div className="modal-overlay">
    <div className="modal-content vault-action-modal" ref={popupref}>
      <div className="modal-header">
        <h2>Withdraw from {selectedVaultForAction?.name}</h2>
        <button
          className="modal-close"
          onClick={() => {
            setpopup(0);
            setSelectedVaultForAction(null);
            setWithdrawPercentage('');
            setWithdrawExceedsBalance(false);
            setWithdrawPreview(null);
          }}
        >
          <img src={closebutton} className="close-button-icon" />
        </button>
      </div>

      <div className="modal-body">
        <div className="vault-withdraw-form">
          <div className="withdraw-section">
            <div className="withdraw-amount-section">
              <h4 className="withdraw-section-title">Amount to withdraw</h4>
              
              <div className="withdraw-percentage-input-container">
                <div className="withdraw-percentage-display">
                  <input
                    type="text"
                    placeholder="0"
                    className="withdraw-percentage-input"
                    value={withdrawPercentage}
                    onChange={(e) => handleWithdrawPercentageChange(e.target.value)}
                  />
                  <span className="withdraw-percentage-symbol">%</span>
                </div>
              </div>

              <div className="percentage-buttons">
                <button
                  className={`percentage-btn ${withdrawPercentage === '25' ? 'active' : ''}`}
                  onClick={() => handleWithdrawPercentageChange('25')}
                >
                  25%
                </button>
                <button
                  className={`percentage-btn ${withdrawPercentage === '50' ? 'active' : ''}`}
                  onClick={() => handleWithdrawPercentageChange('50')}
                >
                  50%
                </button>
                <button
                  className={`percentage-btn ${withdrawPercentage === '75' ? 'active' : ''}`}
                  onClick={() => handleWithdrawPercentageChange('75')}
                >
                  75%
                </button>
                <button
                  className={`percentage-btn ${withdrawPercentage === '100' ? 'active' : ''}`}
                  onClick={() => handleWithdrawPercentageChange('100')}
                >
                  Max
                </button>
              </div>

              {/* Position Overview */}
              <div className="position-overview">
                <div className="position-header">
                  <div className="position-pair">
                    <div className="lp-token-pair-icons">
                      <img
                        src={tokendict[selectedVaultForAction?.quoteAsset]?.image}
                        className="lp-token-icon lp-token-icon-first"
                      />
                      <img
                        src={tokendict[selectedVaultForAction?.baseAsset]?.image}
                        className="lp-token-icon lp-token-icon-second"
                      />
                    </div>
                    <span className="pair-name">
                      {tokendict[selectedVaultForAction?.quoteAsset]?.ticker}/
                      {tokendict[selectedVaultForAction?.baseAsset]?.ticker}
                    </span>
                  </div>
                  <div className="position-balance">
                    Your Position
                  </div>
                </div>

                {/* Token Positions */}
                <div className="token-positions">
                  <div className="token-position">
                    <div className="token-info">
                      <img 
                        src={tokendict[selectedVaultForAction?.quoteAsset]?.image} 
                        className="token-position-icon" 
                      />
                      <span className="token-symbol">
                        {tokendict[selectedVaultForAction?.quoteAsset]?.ticker}
                      </span>
                    </div>
                    <div className="token-amount">
                      {(() => {
                        const userSharesNumber = Number(selectedVaultForAction?.userShares || 0);
                        const totalSharesNumber = Number(selectedVaultForAction?.totalShares || 1);
                        const userPercentage = userSharesNumber / totalSharesNumber;
                        const estimatedQuoteAmount = userPercentage * parseFloat((selectedVaultForAction)) / 2;
                        return estimatedQuoteAmount.toFixed(4);
                      })()}
                    </div>
                  </div>
                  
                  <div className="token-position">
                    <div className="token-info">
                      <img 
                        src={tokendict[selectedVaultForAction?.baseAsset]?.image} 
                        className="token-position-icon" 
                      />
                      <span className="token-symbol">
                        {tokendict[selectedVaultForAction?.baseAsset]?.ticker}
                      </span>
                    </div>
                    <div className="token-amount">
                      {(() => {
                        const userSharesNumber = Number(selectedVaultForAction?.userShares || 0);
                        const totalSharesNumber = Number(selectedVaultForAction?.totalShares || 1);
                        const userPercentage = userSharesNumber / totalSharesNumber;
                        const estimatedBaseAmount = userPercentage * parseFloat((selectedVaultForAction)) / 2;
                        return estimatedBaseAmount.toFixed(4);
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
{/* 
            {withdrawPercentage && parseFloat(withdrawPercentage) > 0 && (
              <div className="withdraw-preview">
                <h5 className="preview-title">You will receive</h5>
                <div className="withdraw-token-preview">
                  <div className="withdraw-token-item">
                    <div className="token-info">
                      <img 
                        src={tokendict[selectedVaultForAction?.quoteAsset]?.image} 
                        className="withdraw-token-icon" 
                      />
                      <span className="token-symbol">
                        {tokendict[selectedVaultForAction?.quoteAsset]?.ticker}
                      </span>
                    </div>
                    <span className="token-amount">
                      {(() => {
                        const percentage = parseFloat(withdrawPercentage) / 100;
                        const userSharesNumber = Number(selectedVaultForAction?.userShares || 0);
                        const totalSharesNumber = Number(selectedVaultForAction?.totalShares || 1);
                        const userPercentage = userSharesNumber / totalSharesNumber;
                        const estimatedQuoteAmount = userPercentage * parseFloat((selectedVaultForAction)) / 2;
                        return (estimatedQuoteAmount * percentage).toFixed(4);
                      })()}
                    </span>
                  </div>
                  <div className="withdraw-token-item">
                    <div className="token-info">
                      <img 
                        src={tokendict[selectedVaultForAction?.baseAsset]?.image} 
                        className="withdraw-token-icon" 
                      />
                      <span className="token-symbol">
                        {tokendict[selectedVaultForAction?.baseAsset]?.ticker}
                      </span>
                    </div>
                    <span className="token-amount">
                      {(() => {
                        const percentage = parseFloat(withdrawPercentage) / 100;
                        const userSharesNumber = Number(selectedVaultForAction?.userShares || 0);
                        const totalSharesNumber = Number(selectedVaultForAction?.totalShares || 1);
                        const userPercentage = userSharesNumber / totalSharesNumber;
                        const estimatedBaseAmount = userPercentage * parseFloat((selectedVaultForAction)) / 2;
                        return (estimatedBaseAmount * percentage).toFixed(4);
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            )} */}

            <div className="withdraw-summary">
              <div className="deposit-summary-row">
                <span>Vault Status:</span>
                <span className={selectedVaultForAction?.closed ? 'status-error' : selectedVaultForAction?.locked ? 'status-warning' : 'status-success'}>
                  {selectedVaultForAction?.closed ? 'Closed' : selectedVaultForAction?.locked ? 'Locked' : 'Active'}
                </span>
              </div>
              {selectedVaultForAction?.lockup && selectedVaultForAction.lockup > 0 && (
                <div className="deposit-summary-row">
                  <span>Lockup Period:</span>
                  <span>{selectedVaultForAction.lockup} seconds</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button
          className={`vault-confirm-button withdraw ${(!isWithdrawEnabled() || isVaultWithdrawSigning) ? 'disabled' : ''}`}
          onClick={handleVaultWithdraw}
          disabled={!isWithdrawEnabled() || isVaultWithdrawSigning}
        >
          {isVaultWithdrawSigning ? (
            <div className="button-content">
              <div className="loading-spinner" />
              Withdrawing...
            </div>
          ) : (
            getWithdrawButtonText()
          )}
        </button>
      </div>
    </div>
  </div>
) : null}
        {popup === 24 ? (
          <div className="explorer-filters-popup" ref={popupref}>
            <div className="explorer-filters-header">
              <h2 className="filters-title">Filters</h2>
              <button className="filters-close-button" onClick={() => setpopup(0)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="status-tabs">
              <button
                className={`status-tab ${explorerFiltersActiveTab === 'new' ? 'active' : ''}`}
                onClick={() => handleExplorerTabSwitch('new')}
              >
                New Pairs
              </button>
              <button
                className={`status-tab ${explorerFiltersActiveTab === 'graduating' ? 'active' : ''}`}
                onClick={() => handleExplorerTabSwitch('graduating')}
              >
                Graduating
              </button>
              <button
                className={`status-tab ${explorerFiltersActiveTab === 'graduated' ? 'active' : ''}`}
                onClick={() => handleExplorerTabSwitch('graduated')}
              >
                Graduated
              </button>
              <button className="explorer-revert-button" onClick={handleExplorerFiltersReset}>
                <img className="filters-reset-icon" src={reset}/>
              </button>
            </div>

            <div className="section-tabs">
              <button
                className={`section-tab ${explorerFiltersActiveSection === 'audit' ? 'active' : ''}`}
                onClick={() => setExplorerFiltersActiveSection('audit')}
              >
                Audit
              </button>
              <button
                className={`section-tab ${explorerFiltersActiveSection === 'metrics' ? 'active' : ''}`}
                onClick={() => setExplorerFiltersActiveSection('metrics')}
              >
                $ Metrics
              </button>
              <button
                className={`section-tab ${explorerFiltersActiveSection === 'socials' ? 'active' : ''}`}
                onClick={() => setExplorerFiltersActiveSection('socials')}
              >
                Socials
              </button>
            </div>

            <div className="filters-content">
              {explorerFiltersActiveSection === 'audit' && (
                <div className="audit-filters">
                  <div className="filter-row">
                    <span className="filter-label">Age (mins)</span>
                    <div className="filter-inputs">
                      <input
                        type="text"
                        placeholder="Min"
                        value={explorerFilters.ageMin}
                        onChange={(e) => handleExplorerFilterInputChange('ageMin', e.target.value)}
                        className="filter-input"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={explorerFilters.ageMax}
                        onChange={(e) => handleExplorerFilterInputChange('ageMax', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>

                  <div className="filter-row">
                    <span className="filter-label">Holders</span>
                    <div className="filter-inputs">
                      <input
                        type="text"
                        placeholder="Min"
                        value={explorerFilters.holdersMin}
                        onChange={(e) => handleExplorerFilterInputChange('holdersMin', e.target.value)}
                        className="filter-input"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={explorerFilters.holdersMax}
                        onChange={(e) => handleExplorerFilterInputChange('holdersMax', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>

                  <div className="filter-row">
                    <span className="filter-label">Pro Traders</span>
                    <div className="filter-inputs">
                      <input
                        type="text"
                        placeholder="Min"
                        value={explorerFilters.proTradersMin}
                        onChange={(e) => handleExplorerFilterInputChange('proTradersMin', e.target.value)}
                        className="filter-input"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={explorerFilters.proTradersMax}
                        onChange={(e) => handleExplorerFilterInputChange('proTradersMax', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>

                  <div className="filter-row">
                    <span className="filter-label">KOL Traders</span>
                    <div className="filter-inputs">
                      <input
                        type="text"
                        placeholder="Min"
                        value={explorerFilters.kolTradersMin}
                        onChange={(e) => handleExplorerFilterInputChange('kolTradersMin', e.target.value)}
                        className="filter-input"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={explorerFilters.kolTradersMax}
                        onChange={(e) => handleExplorerFilterInputChange('kolTradersMax', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>

                  <div className="filter-row">
                    <span className="filter-label">Top 10 Holders %</span>
                    <div className="filter-inputs">
                      <input
                        type="text"
                        placeholder="Min"
                        value={explorerFilters.top10HoldingMin}
                        onChange={(e) => handleExplorerFilterInputChange('top10HoldingMin', e.target.value)}
                        className="filter-input"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={explorerFilters.top10HoldingMax}
                        onChange={(e) => handleExplorerFilterInputChange('top10HoldingMax', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>

                  <div className="filter-row">
                    <span className="filter-label">Dev Holding %</span>
                    <div className="filter-inputs">
                      <input
                        type="text"
                        placeholder="Min"
                        value={explorerFilters.devHoldingMin}
                        onChange={(e) => handleExplorerFilterInputChange('devHoldingMin', e.target.value)}
                        className="filter-input"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={explorerFilters.devHoldingMax}
                        onChange={(e) => handleExplorerFilterInputChange('devHoldingMax', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>

                  <div className="filter-row">
                    <span className="filter-label">Snipers %</span>
                    <div className="filter-inputs">
                      <input
                        type="text"
                        placeholder="Min"
                        value={explorerFilters.sniperHoldingMin}
                        onChange={(e) => handleExplorerFilterInputChange('sniperHoldingMin', e.target.value)}
                        className="filter-input"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={explorerFilters.sniperHoldingMax}
                        onChange={(e) => handleExplorerFilterInputChange('sniperHoldingMax', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>

                  <div className="filter-row">
                    <span className="filter-label">Bundle Holding %</span>
                    <div className="filter-inputs">
                      <input
                        type="text"
                        placeholder="Min"
                        value={explorerFilters.bundleHoldingMin}
                        onChange={(e) => handleExplorerFilterInputChange('bundleHoldingMin', e.target.value)}
                        className="filter-input"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={explorerFilters.bundleHoldingMax}
                        onChange={(e) => handleExplorerFilterInputChange('bundleHoldingMax', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>

                  <div className="filter-row">
                    <span className="filter-label">Insider Holding %</span>
                    <div className="filter-inputs">
                      <input
                        type="text"
                        placeholder="Min"
                        value={explorerFilters.insiderHoldingMin}
                        onChange={(e) => handleExplorerFilterInputChange('insiderHoldingMin', e.target.value)}
                        className="filter-input"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={explorerFilters.insiderHoldingMax}
                        onChange={(e) => handleExplorerFilterInputChange('insiderHoldingMax', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {explorerFiltersActiveSection === 'metrics' && (
                <div className="metrics-filters">
                  <div className="filter-row">
                    <span className="filter-label">Market Cap</span>
                    <div className="filter-inputs">
                      <input
                        type="text"
                        placeholder="Min"
                        value={explorerFilters.marketCapMin}
                        onChange={(e) => handleExplorerFilterInputChange('marketCapMin', e.target.value)}
                        className="filter-input"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={explorerFilters.marketCapMax}
                        onChange={(e) => handleExplorerFilterInputChange('marketCapMax', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>

                  <div className="filter-row">
                    <span className="filter-label">Volume 24h</span>
                    <div className="filter-inputs">
                      <input
                        type="text"
                        placeholder="Min"
                        value={explorerFilters.volume24hMin}
                        onChange={(e) => handleExplorerFilterInputChange('volume24hMin', e.target.value)}
                        className="filter-input"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={explorerFilters.volume24hMax}
                        onChange={(e) => handleExplorerFilterInputChange('volume24hMax', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>

                  <div className="filter-row">
                    <span className="filter-label">Global Fees Paid</span>
                    <div className="filter-inputs">
                      <input
                        type="text"
                        placeholder="Min"
                        value={explorerFilters.globalFeesMin}
                        onChange={(e) => handleExplorerFilterInputChange('globalFeesMin', e.target.value)}
                        className="filter-input"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={explorerFilters.globalFeesMax}
                        onChange={(e) => handleExplorerFilterInputChange('globalFeesMax', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>

                  <div className="filter-row">
                    <span className="filter-label">Buy Transactions</span>
                    <div className="filter-inputs">
                      <input
                        type="text"
                        placeholder="Min"
                        value={explorerFilters.buyTransactionsMin}
                        onChange={(e) => handleExplorerFilterInputChange('buyTransactionsMin', e.target.value)}
                        className="filter-input"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={explorerFilters.buyTransactionsMax}
                        onChange={(e) => handleExplorerFilterInputChange('buyTransactionsMax', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>

                  <div className="filter-row">
                    <span className="filter-label">Sell Transactions</span>
                    <div className="filter-inputs">
                      <input
                        type="text"
                        placeholder="Min"
                        value={explorerFilters.sellTransactionsMin}
                        onChange={(e) => handleExplorerFilterInputChange('sellTransactionsMin', e.target.value)}
                        className="filter-input"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={explorerFilters.sellTransactionsMax}
                        onChange={(e) => handleExplorerFilterInputChange('sellTransactionsMax', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>

                  <div className="filter-row">
                    <span className="filter-label">Price</span>
                    <div className="filter-inputs">
                      <input
                        type="text"
                        placeholder="Min"
                        value={explorerFilters.priceMin}
                        onChange={(e) => handleExplorerFilterInputChange('priceMin', e.target.value)}
                        className="filter-input"
                      />
                      <input
                        type="text"
                        placeholder="Max"
                        value={explorerFilters.priceMax}
                        onChange={(e) => handleExplorerFilterInputChange('priceMax', e.target.value)}
                        className="filter-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {explorerFiltersActiveSection === 'socials' && (
                <div className="socials-filters">
                  <div className="keywords-section">
                    <div className="keyword-group">
                      <label className="keyword-label">Search Keywords</label>
                      <input
                        type="text"
                        placeholder="keyword1, keyword2..."
                        value={explorerFilters.searchKeywords}
                        onChange={(e) => handleExplorerFilterInputChange('searchKeywords', e.target.value)}
                        className="keyword-input"
                      />
                    </div>
                    <div className="keyword-group">
                      <label className="keyword-label">Exclude Keywords</label>
                      <input
                        type="text"
                        placeholder="keyword1, keyword2..."
                        value={explorerFilters.excludeKeywords}
                        onChange={(e) => handleExplorerFilterInputChange('excludeKeywords', e.target.value)}
                        className="keyword-input"
                      />
                    </div>
                  </div>

                  <div className="social-checkboxes">
                    <div className="checkbox-row">
                      <input
                        type="checkbox"
                        id="hasWebsite"
                        checked={explorerFilters.hasWebsite}
                        onChange={(e) => handleExplorerFilterInputChange('hasWebsite', e.target.checked)}
                        className="filter-checkbox"
                      />
                      <label htmlFor="hasWebsite" className="checkbox-label">Has Website</label>
                    </div>

                    <div className="checkbox-row">
                      <input
                        type="checkbox"
                        id="hasTwitter"
                        checked={explorerFilters.hasTwitter}
                        onChange={(e) => handleExplorerFilterInputChange('hasTwitter', e.target.checked)}
                        className="filter-checkbox"
                      />
                      <label htmlFor="hasTwitter" className="checkbox-label">Has Twitter</label>
                    </div>

                    <div className="checkbox-row">
                      <input
                        type="checkbox"
                        id="hasTelegram"
                        checked={explorerFilters.hasTelegram}
                        onChange={(e) => handleExplorerFilterInputChange('hasTelegram', e.target.checked)}
                        className="filter-checkbox"
                      />
                      <label htmlFor="hasTelegram" className="checkbox-label">Has Telegram</label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="filters-actions">
              <div className="action-buttons-left">
                <button className="import-button" onClick={handleExplorerFiltersImport}>
                  Import
                </button>
                <button className="export-button" onClick={handleExplorerFiltersExport}>
                  Export
                </button>
              </div>
              <div className="action-buttons-right">
                <button className="apply-button" onClick={handleExplorerFiltersApply}>
                  Apply All
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {popup === 25 ? ( // send popup
          <div ref={popupref} className="send-popup-container">
            <div className="send-popup-background">
              <div className={`sendbg ${connected && sendAmountIn > mainWalletBalances[sendTokenIn] ? 'exceed-balance' : ''}`}>

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
                    className={`send-input ${connected && sendAmountIn > mainWalletBalances[sendTokenIn] ? 'exceed-balance' : ''}`}
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
                          } else {
                            setSendUsdValue(`$${e.currentTarget.value.replace(/^\$/, '')}`);
                            const calculatedAmount = calculateTokenAmount(
                              e.currentTarget.value.replace(/^\$/, ''),
                              tradesByMarket[
                              (({ baseAsset, quoteAsset }) =>
                                (baseAsset === wethticker ? ethticker : baseAsset) +
                                (quoteAsset === wethticker ? ethticker : quoteAsset)
                              )(getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc))
                              ],
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
                              tradesByMarket[
                              (({ baseAsset, quoteAsset }) =>
                                (baseAsset === wethticker ? ethticker : baseAsset) +
                                (quoteAsset === wethticker ? ethticker : quoteAsset)
                              )(getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc))
                              ],
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
                          } else {
                            setSendUsdValue(`$${e.target.value.replace(/^\$/, '')}`);
                            const calculatedAmount = calculateTokenAmount(
                              e.target.value.replace(/^\$/, ''),
                              tradesByMarket[
                              (({ baseAsset, quoteAsset }) =>
                                (baseAsset === wethticker ? ethticker : baseAsset) +
                                (quoteAsset === wethticker ? ethticker : quoteAsset)
                              )(getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc))
                              ],
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
                              tradesByMarket[
                              (({ baseAsset, quoteAsset }) =>
                                (baseAsset === wethticker ? ethticker : baseAsset) +
                                (quoteAsset === wethticker ? ethticker : quoteAsset)
                              )(getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc))
                              ],
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
                      {formatDisplayValue(mainWalletBalances[sendTokenIn], Number(tokendict[sendTokenIn].decimals))}
                    </div>
                    <div
                      className="send-max-button"
                      onClick={() => {
                        if (mainWalletBalances[sendTokenIn] != BigInt(0)) {
                          let amount =
                            (sendTokenIn == eth && !client)
                              ? mainWalletBalances[sendTokenIn] - settings.chainConfig[activechain].gasamount > BigInt(0)
                                ? mainWalletBalances[sendTokenIn] - settings.chainConfig[activechain].gasamount
                                : BigInt(0)
                              : mainWalletBalances[sendTokenIn];
                          setSendAmountIn(amount);
                          setSendInputAmount(
                            customRound(Number(amount) / 10 ** Number(tokendict[sendTokenIn].decimals), 3).toString()
                          );
                          setSendUsdValue(
                            `$${calculateUSDValue(
                              amount,
                              tradesByMarket[
                              (({ baseAsset, quoteAsset }) =>
                                (baseAsset === wethticker ? ethticker : baseAsset) +
                                (quoteAsset === wethticker ? ethticker : quoteAsset)
                              )(getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc))
                              ],
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
                              tradesByMarket[
                              (({ baseAsset, quoteAsset }) =>
                                (baseAsset === wethticker ? ethticker : baseAsset) +
                                (quoteAsset === wethticker ? ethticker : quoteAsset)
                              )(getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc))
                              ],
                              sendTokenIn,
                              getMarket(sendTokenIn, sendTokenIn == usdc ? eth : usdc),
                            )
                          )}
                    </div>
                    <img src={sendSwitch} className="send-arrow" />
                  </div>
                </div>
              </div>
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
                className={`send-swap-button ${isSigning ? 'signing' : ''}`}
                onClick={async () => {
                  if (
                    connected &&
                    userchain === activechain
                  ) {
                    let hash: any;
                    setIsSigning(true)
                    if (client) {
                      txPending.current = true
                    }
                    try {
                      if (sendTokenIn == eth) {
                        hash = await sendUserOperationAsync({
                          uo: sendeth(
                            recipient as `0x${string}`,
                            sendAmountIn,
                          )
                        });
                        if (!client) {
                          txPending.current = true
                        }
                        newTxPopup(
                          (client ? hash.hash : await waitForTxReceipt(hash.hash)),
                          'send',
                          eth,
                          '',
                          customRound(
                            Number(sendAmountIn) / 10 ** Number(tokendict[eth].decimals),
                            3,
                          ),
                          0,
                          '',
                          recipient,
                        );
                      } else {
                        hash = await sendUserOperationAsync({
                          uo: sendtokens(
                            sendTokenIn as `0x${string}`,
                            recipient as `0x${string}`,
                            sendAmountIn,
                          )
                        });
                        if (!client) {
                          txPending.current = true
                        }
                        newTxPopup(
                          (client ? hash.hash : await waitForTxReceipt(hash.hash)),
                          'send',
                          sendTokenIn,
                          '',
                          customRound(
                            Number(sendAmountIn) /
                            10 ** Number(tokendict[sendTokenIn].decimals),
                            3,
                          ),
                          0,
                          '',
                          recipient,
                        );
                      }
                      setSendUsdValue('')
                      setSendInputAmount('');
                      setSendAmountIn(BigInt(0));
                      setSendPopupButton(0);
                      setSendPopupButtonDisabled(true);
                      setIsSigning(false)
                      await refetch()
                      txPending.current = false
                    } catch (error) {
                      if (!(error instanceof TransactionExecutionError)) {
                        newTxPopup(
                          hash.hash,
                          "sendFailed",
                          sendTokenIn === eth ? eth : sendTokenIn,
                          "",
                          customRound(
                            Number(sendAmountIn) / 10 ** Number(tokendict[sendTokenIn === eth ? eth : sendTokenIn].decimals),
                            3,
                          ),
                          0,
                          "",
                          recipient,
                        );
                      }
                    } finally {
                      txPending.current = false
                      setIsSigning(false)
                    }
                  } else {
                    !connected
                      ? setpopup(4)
                      : handleSetChain()
                  }
                }}
                disabled={sendPopupButtonDisabled || isSigning}
              >
                {isSigning ? (
                  <div className="button-content">
                    <div className="loading-spinner" />
                    {validOneCT ? t('') : t('signTransaction')}
                  </div>
                ) : !connected ? (
                  t('connectWallet')
                ) : sendPopupButton == 0 ? (
                  t('enterAmount')
                ) : sendPopupButton == 1 ? (
                  t('enterWalletAddress')
                ) : sendPopupButton == 2 ? (
                  t('send')
                ) : sendPopupButton == 3 ? (
                  t('insufficient') +
                  (tokendict[sendTokenIn].ticker || '?') +
                  ' ' +
                  t('bal')
                ) : sendPopupButton == 4 ? (
                  `${t('switchto')} ${t(settings.chainConfig[activechain].name)}`
                ) : (
                  t('connectWallet')
                )}
              </button>
            </div>
          </div>
        ) : null}

        {popup === 26 ? (
          <div
            className="layout-settings-background"
            ref={popupref}
          >
            <div className="layout-settings-header">
              <button
                className="layout-settings-close-button"
                onClick={() => setpopup(0)}
              >
                <img src={closebutton} className="close-button-icon" />
              </button>
              <div className="layout-settings-title">Import Wallet</div>
            </div>

            <div className="settings-main-container">
              <div className="import-wallet-content">
                <div className="import-wallet-section">
                  <div className="layout-section-title">Import Existing Wallet</div>
                  <div className="settings-section-subtitle">
                    Enter the private key of an existing wallet to import it
                  </div>

                  <div className="input-group">
                    <label className="input-label">Private Key</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="0x... or without 0x prefix"
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>

                  <div className="import-actions">
                    <button
                      className="reset-tab-button"
                      onClick={() => {
                        setpopup(0);
                      }}
                    >
                      Import Wallet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {popup === 27 ? ( // PNL popup
          <div className="pnl-modal-overlay" onClick={() => setpopup(0)}>
            <div
              className={`pnl-modal-container ${showRightPanel ? 'with-right-panel' : ''} ${windowWidth <= 768 ? 'mobile' : ''}`}
              onClick={e => e.stopPropagation()}
              ref={popupref}
            >
              <div className="pnl-modal main-popup">
                <div
                  className={`pnl-card ${!isCapturing ? 'pnl-card-display' : ''}`}
                  ref={captureRef}
                  style={{
                    backgroundImage: `url(${selectedBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  <div className="pnl-card-content">
                    <div className="pnl-header-section">
                      <div className="pnl-card-header">
                        <img className="pnl-logo" src={LogoText} alt="Logo" crossOrigin="anonymous" />
                      </div>

                      <div className="pnl-token-row">
                        <div className="pnl-token-info-leverage">
                          <div className="pnl-token-info">
                            <img src={tokenIconUrl} alt={tokenName} className="pnl-token-icon" crossOrigin="anonymous" />
                            <span className="pnl-token-name" style={{ color: customizationSettings.mainTextColor }}>
                              {tokenName}
                            </span>
                          </div>
                          <div className="pnl-leverage-tag">SHORT {leverage}X</div>
                        </div>
                      </div>

                      <div
                        className="pnl-percentage"
                        style={{
                          color: customizationSettings.showPNLRectangle
                            ? customizationSettings.rectangleTextColor
                            : (pnl > 0 ? customizationSettings.positivePNLColor : customizationSettings.negativePNLColor),
                          backgroundColor: customizationSettings.showPNLRectangle
                            ? (pnl > 0 ? customizationSettings.positivePNLColor : customizationSettings.negativePNLColor)
                            : 'transparent',
                        }}
                      >
                        {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}%
                      </div>
                    </div>

                    <div className="pnl-entry-exit-referral">
                      <div className="pnl-entry-exit-group">
                        <div className="pnl-entry">
                          <div className="pnl-entry-label">Entry Price</div>
                          <div className="pnl-entry-value" style={{ color: customizationSettings.mainTextColor }}>
                            ${entryPrice.toFixed(2)}
                          </div>
                        </div>
                        <div className="pnl-exit">
                          <div className="pnl-exit-label">Exit Price</div>
                          <div className="pnl-exit-value" style={{ color: customizationSettings.mainTextColor }}>
                            ${exitPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="pnl-referral">
                        <div className="pnl-referral-label">Referral Code</div>
                        <div className="pnl-referral-value" style={{ color: customizationSettings.mainTextColor }}>
                          {referralCode}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pnl-section pnl-layer-middle">
                  <div className="pnl-middle-left">
                    <button
                      className="pnl-box"
                      onClick={() => handleBgSelect(PNLBG)}
                      style={{
                        backgroundImage: `url(${PNLBG})`,
                        border: selectedBg === PNLBG ? '2px solid white' : '1px solid gray',
                      }}
                    />
                    <button
                      className="pnl-box"
                      onClick={() => handleBgSelect(PNLBG2)}
                      style={{
                        backgroundImage: `url(${PNLBG2})`,
                        border: selectedBg === PNLBG2 ? '2px solid white' : '1px solid gray',
                      }}
                    />
                    {uploadedBg && (
                      <button
                        className="pnl-box"
                        onClick={() => setSelectedBg(uploadedBg)}
                        style={{
                          backgroundImage: `url(${uploadedBg})`,
                          border: selectedBg === uploadedBg ? '2px solid white' : '1px solid gray',
                        }}
                      />
                    )}
                  </div>

                  <div className="pnl-middle-right">
                    <label className="pnl-upload-box">
                      Upload File
                      <input
                        type="file"
                        accept="image/*"
                        className="pnl-file-input"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>

                <div className="pnl-footer pnl-layer-bottom">
                  <div className="pnl-footer-left">
                    <button
                      className="pnl-footer-btn"
                      onClick={() => setCurrency(prev => (prev === tokenName ? 'USD' : tokenName))}
                    >
                      ⬆⬇ {currency}
                    </button>
                    {['1D', '7D', '30D', 'MAX'].map(label => (
                      <button key={label} className="pnl-footer-btn">{label}</button>
                    ))}
                    <button className="pnl-footer-btn" onClick={toggleRightPanel}>
                      {showRightPanel ? 'Hide Panel' : 'Customize'}
                    </button>
                  </div>
                  <div className="pnl-footer-right">
                    <button className="pnl-footer-btn" onClick={handleDownload}>Download</button>
                    <button className="pnl-footer-btn" onClick={handleCopyImage}>Copy</button>
                  </div>
                </div>
              </div>

              <div className={`pnl-modal right-popup ${showRightPanel ? 'show' : ''}`}>
                <div className="right-panel-content">
                  <div className="right-panel-header">
                    <h3>Customize PNL Colors</h3>
                    <button
                      className="close-right-panel"
                      onClick={() => setShowRightPanel(false)}
                      aria-label="Close panel"
                    >
                      <img src={closebutton} className="close-button-icon" alt="Close" />
                    </button>
                  </div>

                  <div className="customization-body">
                    <div className="section">
                      <h3 className="section-title">Text Colors</h3>
                      {colorInputs.mainText}
                    </div>

                    <div className="section">
                      <h3 className="section-title">PNL Colors</h3>
                      {colorInputs.positivePNL}
                      {colorInputs.negativePNL}
                    </div>

                    <div className="section">
                      <h3 className="section-title">Layout Options</h3>
                      <div className="layout-toggle-row">
                        <span className="layout-toggle-sublabel">Show PNL Rectangle</span>
                        <div className="toggle-switch-wrapper">
                          <ToggleSwitch
                            checked={tempCustomizationSettings.showPNLRectangle}
                            onChange={() => handleTempToggle('showPNLRectangle')}
                          />
                        </div>
                      </div>
                      {colorInputs.rectangleText}
                    </div>
                  </div>

                  <div className="customization-footer">
                    <button className="apply-btn" onClick={handleApplySettings}>
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {activePicker && (
              <div
                className="color-picker-dropdown"
                style={{
                  top: `${pickerPosition.top}px`,
                  left: `${pickerPosition.left}px`,
                }}
                ref={(el) => pickerRefs.current[activePicker] = el}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <HexColorPicker
                  color={getCurrentColor(activePicker)}
                  onChange={(color) => {
                    const settingKey = getSettingKey(activePicker);
                    handleTempColorChange(settingKey, color);
                  }}
                />
                <div className="rgb-inputs">
                  {['R', 'G', 'B'].map((channel, i) => {
                    const currentColor = getCurrentColor(activePicker);
                    const slice = currentColor.slice(1 + i * 2, 3 + i * 2);
                    const value = parseInt(slice, 16) || 0;

                    return (
                      <div className="rgb-input-group" key={channel}>
                        <label>{channel}</label>
                        <input
                          type="number"
                          min="0"
                          max="255"
                          value={value}
                          onChange={(e) => {
                            const rgb = [0, 0, 0].map((_, idx) =>
                              idx === i
                                ? Math.max(0, Math.min(255, Number(e.target.value)))
                                : parseInt(currentColor.slice(1 + idx * 2, 3 + idx * 2), 16)
                            );
                            const newColor = `#${rgb
                              .map((c) => c.toString(16).padStart(2, '0'))
                              .join('')}`;

                            const settingKey = getSettingKey(activePicker);
                            handleTempColorChange(settingKey, newColor);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : null}
        {popup === 28 ? (
  <div className="onect-trading-selection-bg">
    <div ref={popupref} className="onect-trading-selection-container">
      <div className="onect-trading-header">
        <h2 className="onect-trading-title">Choose Trading Mode</h2>
        <button
          className="onect-trading-close-button"
          onClick={() => setpopup(0)}
        >
          <img src={closebutton} className="close-button-icon" />
        </button>
      </div>
      
      <div className="onect-trading-content">
        <div className="trading-mode-options">
          <div className="trading-mode-option selected">
            <div className="trading-mode-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              </svg>
            </div>
            <div className="trading-mode-info">
              <h3>Regular Trading</h3>
              <p>Standard wallet-based trading with manual approvals</p>
            </div>
          </div>
          
          <div className="trading-mode-option">
            <div className="trading-mode-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
            </div>
            <div className="trading-mode-info">
              <h3>1CT Trading</h3>
              <p>Faster execution, better prices, and advanced features</p>
            </div>
            <div className="trading-mode-status">
              <button 
                className="enable-onect-btn"
                onClick={async () => {
                  try {
                    setIsUsernameSigning(true);
                    await createSubWallet();
                    setpopup(0);
                  } catch (error) {
                    console.error('Failed to enable 1CT trading:', error);
                  } finally {
                    setIsUsernameSigning(false);
                  }
                }}
                disabled={isUsernameSigning}
              >
                {isUsernameSigning ? (
                  <div className="button-content">
                    <div className="loading-spinner" />
                  </div>
                ) : (
                  'Enable 1CT'
                )}
              </button>
            </div>
          </div>
        </div>
              </div>
    </div>
  </div>
) : null}
      </div>
    </>
  );

  // trade ui component
  const swap = (
    <div className="rectangle">
      <div className="navlinkwrapper" onClick={() => {
        if (windowWidth <= 1020 && !simpleView && !showTrade) {
          setShowTrade(true);
          document.querySelector('.trade-mobile-switch')?.classList.add('open');
        }
      }} data-active={location.pathname.slice(1)}>
        <div className="innernavlinkwrapper">
          <Link
            to={simpleView ? "/swap" : "/market"}
            className={`navlink ${location.pathname.slice(1) === 'market' || location.pathname.slice(1) === 'swap' ? 'active' : ''}`}
            onClick={(e) => {
              if ((location.pathname === '/swap' && simpleView) ||
                (location.pathname === '/market' && !simpleView)) {
                e.preventDefault();
              }
            }}
          >
            {simpleView ? t('swap') : t('market')}
          </Link>
          <Link
            to="/limit"
            className={`navlink ${location.pathname.slice(1) === 'limit' ? 'active' : ''}`}
          >
            {t('limit')}
          </Link>
          <span
            ref={(el: HTMLSpanElement | null) => {
              sendButtonRef.current = el;
            }}
            className={`navlink ${location.pathname.slice(1) === 'send' || location.pathname.slice(1) === 'scale' ? 'active' : ''}`}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              setShowSendDropdown(!showSendDropdown);
            }}
          >
            <span className="current-pro-text">{t(currentProText)}</span>
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
          <button
            className={`refresh-quote-button ${isRefreshing ? 'refreshing' : ''}`}
            onClick={handleRefreshQuote}
            disabled={isRefreshing}
          >
            <img src={refreshicon} className="refresh-quote-icon"></img>
            <svg className="refresh-timer-circle" viewBox="0 0 24 24">
              <circle className="timer-circle-border" cx="12" cy="12" r="9" />
            </svg>
          </button>
          {showSendDropdown && (
            <div className="navlink-dropdown" ref={sendDropdownRef}>
              <Link
                to="/send"
                className="dropdown-item"
                onClick={() => {
                  setShowSendDropdown(false);
                  setCurrentProText('send');
                }}
              >
                {t('send')}
              </Link>
              <Link
                to="/scale"
                className="dropdown-item"
                onClick={() => {
                  setShowSendDropdown(false);
                  setCurrentProText('scale');
                }}
              >
                <TooltipLabel
                  label={t('scale')}
                  tooltipText={
                    <div>
                      <div className="tooltip-description">
                        {t('scaleTooltip')}
                      </div>
                    </div>
                  }
                  className="impact-label"
                />
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
                    setInputString(e.currentTarget.value);
                    if (
                      (inputString.endsWith('.') && e.currentTarget.value === inputString.slice(0, -1)) ||
                      (e.currentTarget.value.endsWith('.') && e.currentTarget.value.slice(0, -1) === inputString)
                    ) {
                      return;
                    }
                    const inputValue = BigInt(
                      Math.round(
                        (parseFloat(e.currentTarget.value || '0') || 0) *
                        10 ** Number(tokendict[tokenIn].decimals),
                      ),
                    );
                    debouncedSetAmount(inputValue);
                    setswitched(false);
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
                    setInputString(e.target.value);
                    if (
                      (inputString.endsWith('.') && e.target.value === inputString.slice(0, -1)) ||
                      (e.target.value.endsWith('.') && e.target.value.slice(0, -1) === inputString)
                    ) {
                      return;
                    }
                    const inputValue = BigInt(
                      Math.round(
                        (parseFloat(e.target.value || '0') || 0) *
                        10 ** Number(tokendict[tokenIn].decimals),
                      ),
                    );
                    debouncedSetAmount(inputValue);
                    setswitched(false);
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
                className={`button-arrow ${popup == 1 ? 'open' : ''}`}
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
                      (({ baseAsset, quoteAsset }) =>
                        (baseAsset === wethticker ? ethticker : baseAsset) +
                        (quoteAsset === wethticker ? ethticker : quoteAsset)
                      )(getMarket(activeMarket.path.at(0), activeMarket.path.at(1)))
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
                  let amount =
                    (tokenIn == eth && !client)
                      ? tokenBalances[tokenIn] -
                        settings.chainConfig[activechain].gasamount >
                        BigInt(0)
                        ? tokenBalances[tokenIn] -
                        settings.chainConfig[activechain].gasamount
                        : BigInt(0)
                      : tokenBalances[tokenIn];
                  debouncedSetAmount(BigInt(amount));
                  setswitched(false);
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
                    setoutputString(e.currentTarget.value);
                    if (
                      (outputString.endsWith('.') && e.currentTarget.value === outputString.slice(0, -1)) ||
                      (e.currentTarget.value.endsWith('.') && e.currentTarget.value.slice(0, -1) === outputString)
                    ) {
                      return;
                    }
                    const outputValue = BigInt(
                      Math.round(
                        (parseFloat(e.currentTarget.value || '0') || 0) *
                        10 ** Number(tokendict[tokenOut].decimals),
                      ),
                    );
                    if (isWrap) {
                      setamountIn(outputValue);
                      setInputString(e.currentTarget.value);
                    }
                    debouncedSetAmountOut(outputValue);
                    setswitched(true);
                  }
                }}
                onChange={(e) => {
                  if (isComposing) {
                    setoutputString(e.target.value);
                    return;
                  }
                  if (/^\d*\.?\d{0,18}$/.test(e.target.value)) {
                    setoutputString(e.target.value);
                    if (
                      (outputString.endsWith('.') && e.target.value === outputString.slice(0, -1)) ||
                      (e.target.value.endsWith('.') && e.target.value.slice(0, -1) === outputString)
                    ) {
                      return;
                    }
                    const outputValue = BigInt(
                      Math.round(
                        (parseFloat(e.target.value || '0') || 0) *
                        10 ** Number(tokendict[tokenOut].decimals),
                      ),
                    );
                    if (isWrap) {
                      setamountIn(outputValue);
                      setInputString(e.target.value);
                    }
                    debouncedSetAmountOut(outputValue);
                    setswitched(true);
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
                className={`button-arrow ${popup == 2 ? 'open' : ''}`}
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
                      BigInt(
                        Math.round(
                          (parseFloat(outputString || '0') || 0) *
                          10 ** Number(tokendict[tokenOut].decimals),
                        ),
                      ),
                      tradesByMarket[
                      (({ baseAsset, quoteAsset }) =>
                        (baseAsset === wethticker ? ethticker : baseAsset) +
                        (quoteAsset === wethticker ? ethticker : quoteAsset)
                      )(getMarket(activeMarket.path.at(-2), activeMarket.path.at(-1)))
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
                      (({ baseAsset, quoteAsset }) =>
                        (baseAsset === wethticker ? ethticker : baseAsset) +
                        (quoteAsset === wethticker ? ethticker : quoteAsset)
                      )(getMarket(activeMarket.path.at(0), activeMarket.path.at(1)))
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
                        {inputUSD > 0 && !displayValuesLoading && !stateIsLoading && (
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
          {sliderMode === 'presets' ? (
            <div className="slider-container presets-mode">
              <div className="preset-buttons">
                {sliderPresets.map((preset: number, index: number) => (
                  <button
                    key={index}
                    className={`preset-button ${sliderPercent === preset ? 'active' : ''}`}
                    onClick={() => {
                      if (connected) {
                        const newAmount =
                          (((tokenIn == eth && !client)
                            ? tokenBalances[tokenIn] -
                              settings.chainConfig[activechain].gasamount >
                              BigInt(0)
                              ? tokenBalances[tokenIn] -
                              settings.chainConfig[activechain].gasamount
                              : BigInt(0)
                            : tokenBalances[tokenIn]) *
                            BigInt(preset)) /
                          100n;
                        setSliderPercent(preset);
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
                        setswitched(false);
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
                        if (location.pathname.slice(1) === 'limit') {
                          setamountOutSwap(
                            limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                              ? tokenIn === activeMarket?.baseAddress
                                ? (newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))
                                : (newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice
                              : BigInt(0),
                          );
                          setoutputString(
                            (limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                              ? tokenIn === activeMarket?.baseAddress
                                ? customRound(
                                  Number((newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))) /
                                  10 ** Number(tokendict[tokenOut].decimals),
                                  3,
                                )
                                : customRound(
                                  Number((newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice) /
                                  10 ** Number(tokendict[tokenOut].decimals),
                                  3,
                                )
                              : ''
                            ).toString(),
                          );
                        }
                        const slider = document.querySelector('.balance-amount-slider');
                        const popup = document.querySelector('.slider-percentage-popup');
                        if (slider && popup) {
                          const rect = slider.getBoundingClientRect();
                          (popup as HTMLElement).style.left = `${(rect.width - 15) * (preset / 100) + 15 / 2}px`;
                        }
                      }
                    }}
                    disabled={!connected}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
          ) : sliderMode === 'increment' ? (
            <div className="slider-container increment-mode">
              <button
                className="increment-button minus"
                onClick={() => {
                  if (connected && sliderPercent > 0) {
                    const newPercent = Math.max(0, sliderPercent - sliderIncrement);
                    const newAmount =
                      (((tokenIn == eth && !client)
                        ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount >
                          BigInt(0)
                          ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount
                          : BigInt(0)
                        : tokenBalances[tokenIn]) *
                        BigInt(newPercent)) /
                      100n;
                    setSliderPercent(newPercent);
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
                    setswitched(false);
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
                    if (location.pathname.slice(1) === 'limit') {
                      setamountOutSwap(
                        limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                          ? tokenIn === activeMarket?.baseAddress
                            ? (newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))
                            : (newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice
                          : BigInt(0),
                      );
                      setoutputString(
                        (limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                          ? tokenIn === activeMarket?.baseAddress
                            ? customRound(
                              Number((newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3,
                            )
                            : customRound(
                              Number((newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3,
                            )
                          : ''
                        ).toString(),
                      );
                    }
                    const slider = document.querySelector('.balance-amount-slider');
                    const popup = document.querySelector('.slider-percentage-popup');
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      (popup as HTMLElement).style.left = `${(rect.width - 15) * (newPercent / 100) + 15 / 2}px`;
                    }
                  }
                }}
                disabled={!connected || sliderPercent === 0}
              >
                −
              </button>
              <div className="increment-display">
                <div className="increment-amount">{sliderIncrement}%</div>
              </div>
              <button
                className="increment-button plus"
                onClick={() => {
                  if (connected && sliderPercent < 100) {
                    const newPercent = Math.min(100, sliderPercent + sliderIncrement);
                    const newAmount =
                      (((tokenIn == eth && !client)
                        ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount >
                          BigInt(0)
                          ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount
                          : BigInt(0)
                        : tokenBalances[tokenIn]) *
                        BigInt(newPercent)) /
                      100n;
                    setSliderPercent(newPercent);
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
                    setswitched(false);
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
                    if (location.pathname.slice(1) === 'limit') {
                      setamountOutSwap(
                        limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                          ? tokenIn === activeMarket?.baseAddress
                            ? (newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))
                            : (newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice
                          : BigInt(0),
                      );
                      setoutputString(
                        (limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                          ? tokenIn === activeMarket?.baseAddress
                            ? customRound(
                              Number((newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3,
                            )
                            : customRound(
                              Number((newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3,
                            )
                          : ''
                        ).toString(),
                      );
                    }
                    const slider = document.querySelector('.balance-amount-slider');
                    const popup = document.querySelector('.slider-percentage-popup');
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      (popup as HTMLElement).style.left = `${(rect.width - 15) * (newPercent / 100) + 15 / 2}px`;
                    }
                  }
                }}
                disabled={!connected || sliderPercent === 100}
              >
                +
              </button>
            </div>
          ) : (
            <div className="slider-container slider-mode">
              <input
                type="range"
                className={`balance-amount-slider ${isDragging ? 'dragging' : ''}`}
                min="0"
                max="100"
                step="1"
                value={sliderPercent}
                disabled={!connected}
                onChange={(e) => {
                  const percent = parseInt(e.target.value);
                  const newAmount =
                    (((tokenIn == eth && !client)
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
                  setswitched(false);
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
                  if (location.pathname.slice(1) === 'limit') {
                    setamountOutSwap(
                      limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? (newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))
                          : (newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice
                        : BigInt(0),
                    );
                    setoutputString(
                      (limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? customRound(
                            Number((newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))) /
                            10 ** Number(tokendict[tokenOut].decimals),
                            3,
                          )
                          : customRound(
                            Number((newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice) /
                            10 ** Number(tokendict[tokenOut].decimals),
                            3,
                          )
                        : ''
                      ).toString(),
                    );
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
                  background: `linear-gradient(to right,rgb(171, 176, 224) ${sliderPercent}%,rgba(17, 17, 20, 1) ${sliderPercent}%)`,
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
                      if (connected) {
                        const newAmount =
                          (((tokenIn == eth && !client)
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
                        setswitched(false);
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
                        if (location.pathname.slice(1) === 'limit') {
                          setamountOutSwap(
                            limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                              ? tokenIn === activeMarket?.baseAddress
                                ? (newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))
                                : (newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice
                              : BigInt(0),
                          );
                          setoutputString(
                            (limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                              ? tokenIn === activeMarket?.baseAddress
                                ? customRound(
                                  Number((newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))) /
                                  10 ** Number(tokendict[tokenOut].decimals),
                                  3,
                                )
                                : customRound(
                                  Number((newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice) /
                                  10 ** Number(tokendict[tokenOut].decimals),
                                  3,
                                )
                              : ''
                            ).toString(),
                          );
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
                      }
                    }}
                  >
                    {markPercent}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          className={`swap-button ${isSigning ? 'signing' : ''}`}
          onClick={async () => {
            if (connected && userchain === activechain) {
              if (warning == 1) {
                setpopup(13);
                const confirmed = await new Promise((resolve) => {
                  const handleConfirm = () => {
                    cleanup();
                    resolve(true);
                  };

                  const handleCancel = () => {
                    cleanup();
                    resolve(false);
                  };

                  const cleanup = () => {
                    window.removeEventListener('high-impact-confirm', handleConfirm);
                    window.removeEventListener('high-impact-cancel', handleCancel);
                  };

                  window.addEventListener('high-impact-confirm', handleConfirm);
                  window.addEventListener('high-impact-cancel', handleCancel);

                });
                if (!confirmed) return;
              }
              let hash: any;
              setIsSigning(true);
              if (client) {
                txPending.current = true;
              }
              try {
                if (tokenIn == eth && tokenOut == weth) {
                  hash = await sendUserOperationAsync({ uo: wrapeth(amountIn, weth) }, (rpcQueryData?.gasEstimate ?? 0n));
                  newTxPopup(
                    (client
                      ? hash.hash
                      : await waitForTxReceipt(hash.hash)),
                    'wrap',
                    eth,
                    weth,
                    customRound(Number(amountIn) / 10 ** Number(tokendict[eth].decimals), 3),
                    customRound(Number(amountIn) / 10 ** Number(tokendict[eth].decimals), 3),
                    '',
                    ''
                  );
                } else if (tokenIn == weth && tokenOut == eth) {
                  hash = await sendUserOperationAsync({ uo: unwrapeth(amountIn, weth) }, (rpcQueryData?.gasEstimate ?? 0n));
                  newTxPopup(
                    (client
                      ? hash.hash
                      : await waitForTxReceipt(hash.hash)),
                    'unwrap',
                    weth,
                    eth,
                    customRound(Number(amountIn) / 10 ** Number(tokendict[eth].decimals), 3),
                    customRound(Number(amountIn) / 10 ** Number(tokendict[eth].decimals), 3),
                    '',
                    ''
                  );
                } else if (tokenIn == eth && tokendict[tokenOut]?.lst == true && isStake) {
                  hash = await sendUserOperationAsync({ uo: stake(tokenOut, address, amountIn) }, (rpcQueryData?.gasEstimate ?? 0n) * 1100n / 1000n);
                  newTxPopup(
                    (client
                      ? hash.hash
                      : await waitForTxReceipt(hash.hash)),
                    'stake',
                    eth,
                    tokenOut,
                    customRound(Number(amountIn) / 10 ** Number(tokendict[eth].decimals), 3),
                    customRound(Number(amountIn) / 10 ** Number(tokendict[eth].decimals), 3),
                    '',
                    ''
                  );
                } else {
                  if (switched == false) {
                    if (tokenIn == eth) {
                      if (orderType == 1 || multihop) {
                        hash = await sendUserOperationAsync({
                          uo: swapExactETHForTokens(
                            router,
                            amountIn,
                            (amountOutSwap * slippage + 5000n) / 10000n,
                            activeMarket.path[0] == tokenIn ? activeMarket.path : [...activeMarket.path].reverse(),
                            address as `0x${string}`,
                            BigInt(Math.floor(Date.now() / 1000) + 900),
                            usedRefAddress as `0x${string}`
                          )
                        }, (rpcQueryData?.gasEstimate ?? 0n) * 1500n / 1000n)
                      } else {
                        hash = await sendUserOperationAsync({
                          uo: _swap(
                            router,
                            amountIn,
                            activeMarket.path[0] == tokenIn ? activeMarket.path.at(0) : activeMarket.path.at(1),
                            activeMarket.path[0] == tokenIn ? activeMarket.path.at(1) : activeMarket.path.at(0),
                            true,
                            BigInt(0),
                            amountIn,
                            tokenIn == activeMarket.quoteAddress
                              ? (lowestAsk * 10000n + slippage / 2n) / slippage
                              : (highestBid * slippage + 5000n) / 10000n,
                            BigInt(Math.floor(Date.now() / 1000) + 900),
                            usedRefAddress as `0x${string}`
                          )
                        }, (rpcQueryData?.gasEstimate ?? 0n) * 1500n / 1000n)
                      }
                    } else {
                      if (allowance < amountIn) {
                        if (client) {
                          let uo = []
                          uo.push(approve(
                            tokenIn as `0x${string}`,
                            getMarket(activeMarket.path.at(0), activeMarket.path.at(1)).address,
                            maxUint256
                          ))
                          if (tokenOut == eth) {
                            if (orderType == 1 || multihop) {
                              uo.push(swapExactTokensForETH(
                                router,
                                amountIn,
                                (amountOutSwap * slippage + 5000n) / 10000n,
                                activeMarket.path[0] == tokenIn ? activeMarket.path : [...activeMarket.path].reverse(),
                                address as `0x${string}`,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              ))
                            } else {
                              uo.push(_swap(
                                router,
                                BigInt(0),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(0) : activeMarket.path.at(1),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(1) : activeMarket.path.at(0),
                                true,
                                BigInt(0),
                                amountIn,
                                tokenIn == activeMarket.quoteAddress
                                  ? (lowestAsk * 10000n + slippage / 2n) / slippage
                                  : (highestBid * slippage + 5000n) / 10000n,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              ))
                            }
                          } else {
                            if (orderType == 1 || multihop) {
                              uo.push(swapExactTokensForTokens(
                                router,
                                amountIn,
                                (amountOutSwap * slippage + 5000n) / 10000n,
                                activeMarket.path[0] == tokenIn ? activeMarket.path : [...activeMarket.path].reverse(),
                                address as `0x${string}`,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              ))
                            } else {
                              uo.push(_swap(
                                router,
                                BigInt(0),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(0) : activeMarket.path.at(1),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(1) : activeMarket.path.at(0),
                                true,
                                BigInt(0),
                                amountIn,
                                tokenIn == activeMarket.quoteAddress
                                  ? (lowestAsk * 10000n + slippage / 2n) / slippage
                                  : (highestBid * slippage + 5000n) / 10000n,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              ))
                            }
                          }
                          hash = await sendUserOperationAsync({ uo: uo })
                          newTxPopup(
                            hash.hash,
                            'approve',
                            tokenIn,
                            '',
                            customRound(Number(amountIn) / 10 ** Number(tokendict[tokenIn].decimals), 3),
                            0,
                            '',
                            getMarket(activeMarket.path.at(0), activeMarket.path.at(1)).address
                          );
                        }
                        else {
                          hash = await sendUserOperationAsync({
                            uo: approve(
                              tokenIn as `0x${string}`,
                              getMarket(activeMarket.path.at(0), activeMarket.path.at(1)).address,
                              maxUint256
                            )
                          })
                          newTxPopup(
                            client
                              ? hash.hash
                              : await waitForTxReceipt(hash.hash),
                            'approve',
                            tokenIn,
                            '',
                            customRound(Number(amountIn) / 10 ** Number(tokendict[tokenIn].decimals), 3),
                            0,
                            '',
                            getMarket(activeMarket.path.at(0), activeMarket.path.at(1)).address
                          );
                        }
                      }
                      if (!client || !(allowance < amountIn)) {
                        if (tokenOut == eth) {
                          if (orderType == 1 || multihop) {
                            hash = await sendUserOperationAsync({
                              uo: swapExactTokensForETH(
                                router,
                                amountIn,
                                (amountOutSwap * slippage + 5000n) / 10000n,
                                activeMarket.path[0] == tokenIn ? activeMarket.path : [...activeMarket.path].reverse(),
                                address as `0x${string}`,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              )
                            }, (rpcQueryData?.gasEstimate ?? 0n) * 1500n / 1000n)
                          } else {
                            hash = await sendUserOperationAsync({
                              uo: _swap(
                                router,
                                BigInt(0),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(0) : activeMarket.path.at(1),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(1) : activeMarket.path.at(0),
                                true,
                                BigInt(0),
                                amountIn,
                                tokenIn == activeMarket.quoteAddress
                                  ? (lowestAsk * 10000n + slippage / 2n) / slippage
                                  : (highestBid * slippage + 5000n) / 10000n,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              )
                            }, (rpcQueryData?.gasEstimate ?? 0n) * 1500n / 1000n)
                          }
                        } else {
                          if (orderType == 1 || multihop) {
                            hash = await sendUserOperationAsync({
                              uo: swapExactTokensForTokens(
                                router,
                                amountIn,
                                (amountOutSwap * slippage + 5000n) / 10000n,
                                activeMarket.path[0] == tokenIn ? activeMarket.path : [...activeMarket.path].reverse(),
                                address as `0x${string}`,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              )
                            }, (rpcQueryData?.gasEstimate ?? 0n) * 1500n / 1000n)
                          } else {
                            hash = await sendUserOperationAsync({
                              uo: _swap(
                                router,
                                BigInt(0),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(0) : activeMarket.path.at(1),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(1) : activeMarket.path.at(0),
                                true,
                                BigInt(0),
                                amountIn,
                                tokenIn == activeMarket.quoteAddress
                                  ? (lowestAsk * 10000n + slippage / 2n) / slippage
                                  : (highestBid * slippage + 5000n) / 10000n,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              )
                            }, (rpcQueryData?.gasEstimate ?? 0n) * 1500n / 1000n)
                          }
                        }
                      }
                    }
                  } else {
                    if (tokenIn == eth) {
                      if (orderType == 1 || multihop) {
                        hash = await sendUserOperationAsync({
                          uo: swapETHForExactTokens(
                            router,
                            amountOutSwap,
                            (amountIn * 10000n + slippage / 2n) / slippage,
                            activeMarket.path[0] == tokenIn ? activeMarket.path : [...activeMarket.path].reverse(),
                            address as `0x${string}`,
                            BigInt(Math.floor(Date.now() / 1000) + 900),
                            usedRefAddress as `0x${string}`
                          )
                        }, (rpcQueryData?.gasEstimate ?? 0n) * 1500n / 1000n)
                      } else {
                        hash = await sendUserOperationAsync({
                          uo: _swap(
                            router,
                            BigInt((amountIn * 10000n + slippage / 2n) / slippage),
                            activeMarket.path[0] == tokenIn ? activeMarket.path.at(0) : activeMarket.path.at(1),
                            activeMarket.path[0] == tokenIn ? activeMarket.path.at(1) : activeMarket.path.at(0),
                            false,
                            BigInt(0),
                            amountOutSwap,
                            tokenIn == activeMarket.quoteAddress
                              ? (lowestAsk * 10000n + slippage / 2n) / slippage
                              : (highestBid * slippage + 5000n) / 10000n,
                            BigInt(Math.floor(Date.now() / 1000) + 900),
                            usedRefAddress as `0x${string}`
                          )
                        }, (rpcQueryData?.gasEstimate ?? 0n) * 1500n / 1000n)
                      }
                    } else {
                      if (allowance < amountIn) {
                        if (client) {
                          let uo = []
                          uo.push(approve(
                            tokenIn as `0x${string}`,
                            getMarket(activeMarket.path.at(0), activeMarket.path.at(1)).address,
                            maxUint256
                          ))
                          if (tokenOut == eth) {
                            if (orderType == 1 || multihop) {
                              uo.push(swapTokensForExactETH(
                                router,
                                amountOutSwap,
                                (amountIn * 10000n + slippage / 2n) / slippage,
                                activeMarket.path[0] == tokenIn ? activeMarket.path : [...activeMarket.path].reverse(),
                                address as `0x${string}`,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              ))
                            } else {
                              uo.push(_swap(
                                router,
                                BigInt(0),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(0) : activeMarket.path.at(1),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(1) : activeMarket.path.at(0),
                                true,
                                BigInt(0),
                                amountOutSwap,
                                tokenIn == activeMarket.quoteAddress
                                  ? (lowestAsk * 10000n + slippage / 2n) / slippage
                                  : (highestBid * slippage + 5000n) / 10000n,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              ))
                            }
                          } else {
                            if (orderType == 1 || multihop) {
                              uo.push(swapTokensForExactTokens(
                                router,
                                amountOutSwap,
                                (amountIn * 10000n + slippage / 2n) / slippage,
                                activeMarket.path[0] == tokenIn ? activeMarket.path : [...activeMarket.path].reverse(),
                                address as `0x${string}`,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              ))
                            } else {
                              uo.push(_swap(
                                router,
                                BigInt(0),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(0) : activeMarket.path.at(1),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(1) : activeMarket.path.at(0),
                                true,
                                BigInt(0),
                                amountOutSwap,
                                tokenIn == activeMarket.quoteAddress
                                  ? (lowestAsk * 10000n + slippage / 2n) / slippage
                                  : (highestBid * slippage + 5000n) / 10000n,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              ))
                            }
                          }
                          hash = await sendUserOperationAsync({ uo: uo })
                          newTxPopup(
                            hash.hash,
                            'approve',
                            tokenIn,
                            '',
                            customRound(Number(amountIn) / 10 ** Number(tokendict[tokenIn].decimals), 3),
                            0,
                            '',
                            getMarket(activeMarket.path.at(0), activeMarket.path.at(1)).address
                          );
                        }
                        else {
                          hash = await sendUserOperationAsync({
                            uo: approve(
                              tokenIn as `0x${string}`,
                              getMarket(activeMarket.path.at(0), activeMarket.path.at(1)).address,
                              maxUint256
                            )
                          })
                          newTxPopup(
                            client
                              ? hash.hash
                              : await waitForTxReceipt(hash.hash),
                            'approve',
                            tokenIn,
                            '',
                            customRound(Number(amountIn) / 10 ** Number(tokendict[tokenIn].decimals), 3),
                            0,
                            '',
                            getMarket(activeMarket.path.at(0), activeMarket.path.at(1)).address
                          );
                        }
                      }
                      if (!client || !(allowance < amountIn)) {
                        if (tokenOut == eth) {
                          if (orderType == 1 || multihop) {
                            hash = await sendUserOperationAsync({
                              uo: swapTokensForExactETH(
                                router,
                                amountOutSwap,
                                (amountIn * 10000n + slippage / 2n) / slippage,
                                activeMarket.path[0] == tokenIn ? activeMarket.path : [...activeMarket.path].reverse(),
                                address as `0x${string}`,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              )
                            }, (rpcQueryData?.gasEstimate ?? 0n) * 1500n / 1000n)
                          } else {
                            hash = await sendUserOperationAsync({
                              uo: _swap(
                                router,
                                BigInt(0),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(0) : activeMarket.path.at(1),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(1) : activeMarket.path.at(0),
                                true,
                                BigInt(0),
                                amountOutSwap,
                                tokenIn == activeMarket.quoteAddress
                                  ? (lowestAsk * 10000n + slippage / 2n) / slippage
                                  : (highestBid * slippage + 5000n) / 10000n,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              )
                            }, (rpcQueryData?.gasEstimate ?? 0n) * 1500n / 1000n)
                          }
                        } else {
                          if (orderType == 1 || multihop) {
                            hash = await sendUserOperationAsync({
                              uo: swapTokensForExactTokens(
                                router,
                                amountOutSwap,
                                (amountIn * 10000n + slippage / 2n) / slippage,
                                activeMarket.path[0] == tokenIn ? activeMarket.path : [...activeMarket.path].reverse(),
                                address as `0x${string}`,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              )
                            }, (rpcQueryData?.gasEstimate ?? 0n) * 1500n / 1000n)
                          } else {
                            hash = await sendUserOperationAsync({
                              uo: _swap(
                                router,
                                BigInt(0),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(0) : activeMarket.path.at(1),
                                activeMarket.path[0] == tokenIn ? activeMarket.path.at(1) : activeMarket.path.at(0),
                                true,
                                BigInt(0),
                                amountOutSwap,
                                tokenIn == activeMarket.quoteAddress
                                  ? (lowestAsk * 10000n + slippage / 2n) / slippage
                                  : (highestBid * slippage + 5000n) / 10000n,
                                BigInt(Math.floor(Date.now() / 1000) + 900),
                                usedRefAddress as `0x${string}`
                              )
                            }, (rpcQueryData?.gasEstimate ?? 0n) * 1500n / 1000n)
                          }
                        }
                      }
                    }
                  }
                }
                if (!client) {
                  txPending.current = true
                  await waitForTxReceipt(hash.hash);
                }
                setswitched(false);
                setInputString('');
                setamountIn(BigInt(0));
                setoutputString('')
                setamountOutSwap(BigInt(0));
                setSliderPercent(0);
                setSwapButtonDisabled(true);
                setSwapButton(1);
                setIsSigning(false)
                const slider = document.querySelector('.balance-amount-slider');
                const popup = document.querySelector('.slider-percentage-popup');
                if (slider && popup) {
                  (popup as HTMLElement).style.left = `${15 / 2}px`;
                }
                await refetch()
                txPending.current = false
              } catch (error) {
                if (!(error instanceof TransactionExecutionError)) {
                  newTxPopup(
                    hash.hash,
                    "swapFailed",
                    tokenIn == eth ? eth : tokenIn,
                    tokenOut == eth ? eth : tokenOut,
                    customRound(Number(amountIn) / 10 ** Number(tokendict[tokenIn == eth ? eth : tokenIn].decimals), 3),
                    customRound(Number(amountOutSwap) / 10 ** Number(tokendict[tokenOut == eth ? eth : tokenOut].decimals), 3),
                    "",
                    "",
                  );
                }
              } finally {
                txPending.current = false
                setIsSigning(false)
              }
            } else {
              !connected ? setpopup(4) : handleSetChain();
            }
          }}
          disabled={swapButtonDisabled || displayValuesLoading || isSigning}
        >
          {isSigning ? (
            <div className="button-content">
              <div className="loading-spinner" />
              {validOneCT ? t('') : t('signTransaction')}
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
            client ? t('swap') : t('approve')
          )}
        </button>
      </div>
      <div className="trade-info-rectangle">
        {(tokenIn == eth && tokendict[tokenOut]?.lst == true) && <div className="trade-fee">
          <div className="label-container">
            <TooltipLabel
              label={t('stake')}
              tooltipText={
                <div>
                  <div className="tooltip-description">
                    {t('stakeSubtitle')}
                  </div>
                </div>
              }
              className="impact-label"
            />
          </div>
          <ToggleSwitch
            checked={isStake}
            onChange={() => {
              const newValue = isStake == true ? false : true;
              setIsStake(newValue);
            }}
          />
        </div>}
        {!multihop && !isWrap && !((tokenIn == eth && tokendict[tokenOut]?.lst == true) && isStake) && (
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

        {!isWrap && !((tokenIn == eth && tokendict[tokenOut]?.lst == true) && isStake) && (
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur()
                    e.stopPropagation()
                  };
                }}
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
                `${formatSubscript(multihop ? parseFloat(averagePrice).toString() : parseFloat(averagePrice).toFixed(Math.floor(Math.log10(Number(activeMarket.priceFactor)))))} ${multihop ? tokendict[tokenIn].ticker : activeMarket.quoteAsset}`
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
            ) : isWrap || ((tokenIn == eth && tokendict[tokenOut]?.lst == true) && isStake) ? (
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
              label={`${t('fee')} (0.${isWrap || ((tokenIn == eth && tokendict[tokenOut]?.lst == true) && isStake) ? '00' : String(Number(BigInt(100000) - activeMarket.fee) / 100).replace(/\./g, "")}%)`}
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
            ) : isWrap || ((tokenIn == eth && tokendict[tokenOut]?.lst == true) && isStake) ? (
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
    </div>
  );

  // limit ui component
  const limit = (
    <div className="rectangle">
      <div className="navlinkwrapper" data-active={location.pathname.slice(1)} onClick={() => {
        if (windowWidth <= 1020 && !simpleView && !showTrade) {
          setShowTrade(true);
          document.querySelector('.trade-mobile-switch')?.classList.add('open');
        }
      }}>
        <div className="innernavlinkwrapper">
          <Link
            to={simpleView ? "/swap" : "/market"}
            className={`navlink ${location.pathname.slice(1) === 'swap' ? 'active' : ''}`}
          >
            {simpleView ? t('swap') : t('market')}
          </Link>
          <Link
            to="/limit"
            className={`navlink ${location.pathname.slice(1) === 'limit' ? 'active' : ''}`}
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
            className={`navlink ${location.pathname.slice(1) != 'swap' && location.pathname.slice(1) != 'limit' ? 'active' : ''}`}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              setShowSendDropdown(!showSendDropdown);
            }}
          >
            <span className="current-pro-text">{t(currentProText)}</span>
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
                  setCurrentProText('send');
                }}
              >
                {t('send')}
              </Link>
              <Link
                to="/scale"
                className="dropdown-item"
                onClick={() => {
                  setShowSendDropdown(false);
                  setCurrentProText('scale');
                }}
              >
                <TooltipLabel
                  label={t('scale')}
                  tooltipText={
                    <div>
                      <div className="tooltip-description">
                        {t('scaleTooltip')}
                      </div>
                    </div>
                  }
                  className="impact-label"
                />
              </Link>

            </div>
          )}
        </div>
        <div className="sliding-tab-indicator" />
      </div>
      <div className="swapmodal">
        <div
          className={`inputbg ${connected &&
            ((amountIn > tokenBalances[tokenIn]) ||
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
                ((amountIn > tokenBalances[tokenIn]) ||
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
                  if (
                    (inputString.endsWith('.') && e.currentTarget.value === inputString.slice(0, -1)) ||
                    (e.currentTarget.value.endsWith('.') && e.currentTarget.value.slice(0, -1) === inputString)
                  ) {
                    return;
                  }
                  const inputValue = BigInt(
                    Math.round(
                      (parseFloat(e.currentTarget.value || '0') || 0) *
                      10 ** Number(tokendict[tokenIn].decimals),
                    ),
                  );

                  setamountOutSwap(
                    limitPrice !== BigInt(0) && inputValue !== BigInt(0)
                      ? tokenIn === activeMarket?.baseAddress
                        ? (inputValue * limitPrice) /
                        (activeMarket.scaleFactor || BigInt(1))
                        : (inputValue *
                          (activeMarket.scaleFactor || BigInt(1))) /
                        limitPrice
                      : BigInt(0),
                  );

                  setoutputString(
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
                  setswitched(false);

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
                  if (
                    (inputString.endsWith('.') && e.target.value === inputString.slice(0, -1)) ||
                    (e.target.value.endsWith('.') && e.target.value.slice(0, -1) === inputString)
                  ) {
                    return;
                  }
                  const inputValue = BigInt(
                    Math.round(
                      (parseFloat(e.target.value || '0') || 0) *
                      10 ** Number(tokendict[tokenIn].decimals),
                    ),
                  );

                  setamountOutSwap(
                    limitPrice !== BigInt(0) && inputValue !== BigInt(0)
                      ? tokenIn === activeMarket?.baseAddress
                        ? (inputValue * limitPrice) /
                        (activeMarket.scaleFactor || BigInt(1))
                        : (inputValue *
                          (activeMarket.scaleFactor || BigInt(1))) /
                        limitPrice
                      : BigInt(0),
                  );

                  setoutputString(
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
                  setswitched(false);

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
                ((amountIn > tokenBalances[tokenIn]) ||
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
                className={`button-arrow ${popup == 1 ? 'open' : ''}`}
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
                    (({ baseAsset, quoteAsset }) =>
                      (baseAsset === wethticker ? ethticker : baseAsset) +
                      (quoteAsset === wethticker ? ethticker : quoteAsset)
                    )(getMarket(activeMarket.path.at(0), activeMarket.path.at(1)))
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
                    (tokenIn == eth && !client)
                      ? tokenBalances[tokenIn] -
                        settings.chainConfig[activechain].gasamount >
                        BigInt(0)
                        ? tokenBalances[tokenIn] -
                        settings.chainConfig[activechain].gasamount
                        : BigInt(0)
                      : tokenBalances[tokenIn];
                  setamountIn(BigInt(amount));
                  setswitched(false);
                  setInputString(
                    customRound(
                      Number(amount) /
                      10 ** Number(tokendict[tokenIn].decimals),
                      3,
                    ).toString(),
                  );
                  setamountOutSwap(
                    limitPrice != BigInt(0) && amount != BigInt(0)
                      ? tokenIn === activeMarket?.baseAddress
                        ? (amount * limitPrice) /
                        (activeMarket.scaleFactor || BigInt(1))
                        : (BigInt(amount) *
                          (activeMarket.scaleFactor || BigInt(1))) /
                        limitPrice
                      : BigInt(0),
                  );
                  setoutputString(
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
            setswitched((switched) => { return !switched });
            if (amountIn != BigInt(0)) {
              if (limitChase && mids?.[activeMarketKey]?.[0]) {
                const price = tokenOut === activeMarket?.baseAddress ? mids[activeMarketKey][0] == mids[activeMarketKey][1] ? mids[activeMarketKey][2] : mids[activeMarketKey][0] : mids[activeMarketKey][0] == mids[activeMarketKey][2] ? mids[activeMarketKey][1] : mids[activeMarketKey][0]
                setlimitPrice(price);
                setlimitPriceString(
                  (
                    Number(price) / Number(activeMarket.priceFactor)
                  ).toFixed(Math.floor(Math.log10(Number(activeMarket.priceFactor)))),
                );
                setamountOutSwap(
                  price != BigInt(0) && amountIn != BigInt(0)
                    ? tokenOut === activeMarket?.baseAddress
                      ? (amountIn * price) /
                      (activeMarket.scaleFactor || BigInt(1))
                      : (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
                      price
                    : BigInt(0),
                );
                setoutputString(
                  (price != BigInt(0) && amountIn != BigInt(0)
                    ? tokenOut === activeMarket?.baseAddress
                      ? customRound(
                        Number(
                          (amountIn * price) /
                          (activeMarket.scaleFactor || BigInt(1)),
                        ) /
                        10 ** Number(tokendict[tokenIn].decimals),
                        3,
                      )
                      : customRound(
                        Number(
                          (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
                          price,
                        ) /
                        10 ** Number(tokendict[tokenIn].decimals),
                        3,
                      )
                    : ''
                  ).toString(),
                );
              }
              setInputString(outputString);
              setoutputString(inputString);
              setamountIn(amountOutSwap);
              setamountOutSwap(amountIn);
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
                    setoutputString(e.currentTarget.value);
                    const outputValue = BigInt(
                      Math.round(
                        (parseFloat(e.currentTarget.value || '0') || 0) *
                        10 ** Number(tokendict[tokenOut].decimals),
                      ),
                    );
                    setamountOutSwap(outputValue);
                    setswitched(true);
                    setamountIn(
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
                    setoutputString(e.target.value);
                    return;
                  }
                  if (/^\d*\.?\d{0,18}$/.test(e.target.value)) {
                    setoutputString(e.target.value);
                    const outputValue = BigInt(
                      Math.round(
                        (parseFloat(e.target.value || '0') || 0) *
                        10 ** Number(tokendict[tokenOut].decimals),
                      ),
                    );
                    setamountOutSwap(outputValue);
                    setswitched(true);
                    setamountIn(
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
                value={outputString}
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
                  className={`button-arrow ${popup == 2 ? 'open' : ''}`}
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
              {amountOutSwap === BigInt(0)
                ? '$0.00'
                : (() => {
                  const outputUSD = calculateUSDValue(
                    amountOutSwap,
                    tradesByMarket[
                    (({ baseAsset, quoteAsset }) =>
                      (baseAsset === wethticker ? ethticker : baseAsset) +
                      (quoteAsset === wethticker ? ethticker : quoteAsset)
                    )(getMarket(activeMarket.path.at(-2), activeMarket.path.at(-1)))
                    ],
                    tokenOut,
                    getMarket(
                      activeMarket.path.at(-2),
                      activeMarket.path.at(-1),
                    ),
                  );

                  const inputUSD = calculateUSDValue(
                    limitPrice != BigInt(0) && amountOutSwap != BigInt(0)
                      ? tokenIn === activeMarket?.baseAddress
                        ? (amountOutSwap *
                          (activeMarket.scaleFactor || BigInt(1))) /
                        limitPrice
                        : (amountOutSwap * limitPrice) /
                        (activeMarket.scaleFactor || BigInt(1))
                      : BigInt(0),
                    tradesByMarket[
                    (({ baseAsset, quoteAsset }) =>
                      (baseAsset === wethticker ? ethticker : baseAsset) +
                      (quoteAsset === wethticker ? ethticker : quoteAsset)
                    )(getMarket(activeMarket.path.at(0), activeMarket.path.at(1)))
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
              amountIn > tokenBalances[tokenIn]) &&
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
                  amountIn > tokenBalances[tokenIn]) &&
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
              onCompositionStart={() => {
                setIsComposing(true);
              }}
              onCompositionEnd={(
                e: React.CompositionEvent<HTMLInputElement>,
              ) => {
                setIsComposing(false);
                if (
                  new RegExp(
                    `^\\d*\\.?\\d{0,${Math.floor(Math.log10(Number(activeMarket.priceFactor)))}}$`
                  ).test(e.currentTarget.value)
                ) {
                  setlimitChase(false);
                  setlimitPriceString(e.currentTarget.value);
                  let price = BigInt(
                    Math.round(
                      (parseFloat(e.currentTarget.value || '0') || 0) *
                      Number(activeMarket.priceFactor)
                    )
                  );
                  setlimitPrice(price);
                  if (switched) {
                    setamountIn(
                      price !== BigInt(0) && amountOutSwap !== BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? (amountOutSwap *
                            (activeMarket.scaleFactor || BigInt(1))) /
                          price
                          : (amountOutSwap * price) /
                          (activeMarket.scaleFactor || BigInt(1))
                        : BigInt(0),
                    );
                    setInputString(
                      (price !== BigInt(0) && amountOutSwap !== BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? customRound(
                            Number(
                              (amountOutSwap *
                                (activeMarket.scaleFactor || BigInt(1))) /
                              price,
                            ) /
                            10 ** Number(tokendict[tokenIn].decimals),
                            3,
                          )
                          : customRound(
                            Number(
                              (amountOutSwap * price) /
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
                              (price !== BigInt(0) &&
                                amountOutSwap !== BigInt(0)
                                ? tokenIn === activeMarket?.baseAddress
                                  ? (amountOutSwap *
                                    (activeMarket.scaleFactor ||
                                      BigInt(1))) /
                                  price
                                  : (amountOutSwap * price) /
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
                  else {
                    setamountOutSwap(
                      price != BigInt(0) && amountIn != BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? (amountIn * price) /
                          (activeMarket.scaleFactor || BigInt(1))
                          : (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
                          price
                        : BigInt(0)
                    );
                    setoutputString(
                      (
                        price != BigInt(0) && amountIn != BigInt(0)
                          ? tokenIn === activeMarket?.baseAddress
                            ? customRound(
                              Number(
                                (amountIn * price) /
                                (activeMarket.scaleFactor || BigInt(1))
                              ) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3
                            )
                            : customRound(
                              Number(
                                (amountIn *
                                  (activeMarket.scaleFactor || BigInt(1))) /
                                price
                              ) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3
                            )
                          : ''
                      ).toString()
                    );
                  }
                }
              }}
              onChange={(e) => {
                if (isComposing) {
                  setlimitPriceString(e.target.value);
                  return;
                }
                if (
                  new RegExp(
                    `^\\d*\\.?\\d{0,${Math.floor(Math.log10(Number(activeMarket.priceFactor)))}}$`
                  ).test(e.target.value)
                ) {
                  setlimitChase(false);
                  setlimitPriceString(e.target.value);
                  let price = BigInt(
                    Math.round(
                      (parseFloat(e.target.value || '0') || 0) *
                      Number(activeMarket.priceFactor)
                    )
                  );
                  setlimitPrice(price);
                  if (switched) {
                    setamountIn(
                      price !== BigInt(0) && amountOutSwap !== BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? (amountOutSwap *
                            (activeMarket.scaleFactor || BigInt(1))) /
                          price
                          : (amountOutSwap * price) /
                          (activeMarket.scaleFactor || BigInt(1))
                        : BigInt(0),
                    );
                    setInputString(
                      (price !== BigInt(0) && amountOutSwap !== BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? customRound(
                            Number(
                              (amountOutSwap *
                                (activeMarket.scaleFactor || BigInt(1))) /
                              price,
                            ) /
                            10 ** Number(tokendict[tokenIn].decimals),
                            3,
                          )
                          : customRound(
                            Number(
                              (amountOutSwap * price) /
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
                              (price !== BigInt(0) &&
                                amountOutSwap !== BigInt(0)
                                ? tokenIn === activeMarket?.baseAddress
                                  ? (amountOutSwap *
                                    (activeMarket.scaleFactor ||
                                      BigInt(1))) /
                                  price
                                  : (amountOutSwap * price) /
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
                  else {
                    setamountOutSwap(
                      price != BigInt(0) && amountIn != BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? (amountIn * price) /
                          (activeMarket.scaleFactor || BigInt(1))
                          : (amountIn * (activeMarket.scaleFactor || BigInt(1))) /
                          price
                        : BigInt(0)
                    );
                    setoutputString(
                      (
                        price != BigInt(0) && amountIn != BigInt(0)
                          ? tokenIn === activeMarket?.baseAddress
                            ? customRound(
                              Number(
                                (amountIn * price) /
                                (activeMarket.scaleFactor || BigInt(1))
                              ) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3
                            )
                            : customRound(
                              Number(
                                (amountIn *
                                  (activeMarket.scaleFactor || BigInt(1))) /
                                price
                              ) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3
                            )
                          : ''
                      ).toString()
                    );
                  }
                }
              }}
              placeholder="0.00"
              value={limitPriceString}
              step={1 / Math.pow(10, Math.floor(Math.log10(Number(activeMarket.priceFactor))))}
            />
            <span className="limit-order-usd-label">USDC</span>
          </div>
          <div className="limit-price-buttons">
            <button
              className="limit-price-button limit-custom-button"
              onClick={() => {
                const customButton = document.querySelector('.limit-custom-button');
                if (customButton) {
                  customButton.classList.add('editing');
                }

                setTimeout(() => {
                  const input = document.querySelector('.limit-custom-input') as HTMLInputElement | null;
                  if (input) {
                    input.value = '';
                    input.focus();
                  }
                }, 10);
              }}
            >
              <span className="limit-custom-label">
                {(() => {
                  const marketPrice = Number(tokenIn === activeMarket?.baseAddress ? mids[activeMarketKey]?.[0] == mids[activeMarketKey]?.[1] ? mids[activeMarketKey]?.[2] : mids[activeMarketKey]?.[0] : mids[activeMarketKey]?.[0] == mids[activeMarketKey]?.[2] ? mids[activeMarketKey]?.[1] : mids[activeMarketKey]?.[0])

                  if (marketPrice > 0 && limitPrice > 0) {
                    const percentDiff = ((Number(limitPrice) - marketPrice) / marketPrice) * 100;
                    if (Math.abs(percentDiff) < 0.01) {
                      return t('custom');
                    }

                    return (percentDiff >= 0 ? "+" : "") + percentDiff.toFixed(1) + "%";
                  }

                  return t('custom');
                })()}
              </span>
              <div className="custom-input-container">
                <input
                  className="limit-custom-input"
                  type="text"
                  inputMode="decimal"
                  placeholder={tokenIn === activeMarket?.quoteAddress ? "-%" : "+%"}
                  onBlur={(e) => {
                    const customButton = document.querySelector('.limit-custom-button');
                    if (customButton) {
                      customButton.classList.remove('editing');
                    }

                    let value = e.target.value.replace(/[^0-9.]/g, '');

                    let numValue = parseFloat(value);
                    if (isNaN(numValue)) numValue = 0;
                    if (numValue > 100) {
                      value = "100";
                      numValue = 100;
                    }

                    if (value) {
                      const marketPrice = tokenIn === activeMarket?.baseAddress
                        ? Number(mids[activeMarketKey]?.[0]) / Number(activeMarket.priceFactor)
                        : Number(mids[activeMarketKey]?.[0]) / Number(activeMarket.priceFactor);

                      let newPrice;
                      if (tokenIn === activeMarket?.quoteAddress) {
                        newPrice = marketPrice * (1 - numValue / 100);
                      } else {
                        newPrice = marketPrice * (1 + numValue / 100);
                      }

                      updateLimitAmount(newPrice, Number(activeMarket.priceFactor));
                    }
                  }}
                  onFocus={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    e.target.value = value;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      input.blur();
                    } else if (e.key === 'Escape') {
                      const customButton = document.querySelector('.limit-custom-button');
                      if (customButton) {
                        customButton.classList.remove('editing');
                      }
                    }
                    if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                      (e.keyCode === 65 && e.ctrlKey === true) ||
                      (e.keyCode === 67 && e.ctrlKey === true) ||
                      (e.keyCode === 86 && e.ctrlKey === true) ||
                      (e.keyCode === 88 && e.ctrlKey === true) ||
                      (e.keyCode >= 35 && e.keyCode <= 39)) {
                      return;
                    }

                    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) &&
                      (e.keyCode < 96 || e.keyCode > 105)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9.]/g, '');

                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue > 100) {
                      value = "100";
                    }

                    const sign = tokenIn === activeMarket?.quoteAddress ? "-" : "+";

                    if (value && value !== "0") {
                      e.target.value = sign + value;
                    } else {
                      e.target.value = value;
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </button>
            <button
              className="limit-price-button"
              onClick={() => {
                const marketPrice = tokenIn === activeMarket?.baseAddress
                  ? Number(mids[activeMarketKey]?.[0]) / Number(activeMarket.priceFactor)
                  : Number(mids[activeMarketKey]?.[0]) / Number(activeMarket.priceFactor);

                const newPrice = tokenIn === activeMarket?.quoteAddress
                  ? Math.max(0, marketPrice * 0.99)
                  : marketPrice * 1.01;

                updateLimitAmount(newPrice, Number(activeMarket.priceFactor));
              }}
            >
              {tokenIn === activeMarket?.quoteAddress ? "-1%" : "+1%"}
            </button>
            <button
              className="limit-price-button"
              onClick={() => {
                const marketPrice = tokenIn === activeMarket?.baseAddress
                  ? Number(mids[activeMarketKey]?.[0]) / Number(activeMarket.priceFactor)
                  : Number(mids[activeMarketKey]?.[0]) / Number(activeMarket.priceFactor);
                const newPrice = tokenIn === activeMarket?.quoteAddress
                  ? Math.max(0, marketPrice * 0.95)
                  : marketPrice * 1.05;

                updateLimitAmount(newPrice, Number(activeMarket.priceFactor));
              }}
            >
              {tokenIn === activeMarket?.quoteAddress ? "-5%" : "+5%"}
            </button>
            <button
              className="limit-price-button"
              onClick={() => {
                const marketPrice = tokenIn === activeMarket?.baseAddress
                  ? Number(mids[activeMarketKey]?.[0]) / Number(activeMarket.priceFactor)
                  : Number(mids[activeMarketKey]?.[0]) / Number(activeMarket.priceFactor);

                const newPrice = tokenIn === activeMarket?.quoteAddress
                  ? Math.max(0, marketPrice * 0.9)
                  : marketPrice * 1.1;

                updateLimitAmount(newPrice, Number(activeMarket.priceFactor));
              }}
            >
              {tokenIn === activeMarket?.quoteAddress ? "-10%" : "+10%"}
            </button>
          </div>
        </div>
        <div className="balance-slider-wrapper">
          {sliderMode === 'presets' ? (
            <div className="slider-container presets-mode">
              <div className="preset-buttons">
                {sliderPresets.map((preset: number, index: number) => (
                  <button
                    key={index}
                    className={`preset-button ${sliderPercent === preset ? 'active' : ''}`}
                    onClick={() => {
                      if (connected) {
                        const newAmount =
                          (((tokenIn == eth && !client)
                            ? tokenBalances[tokenIn] -
                              settings.chainConfig[activechain].gasamount >
                              BigInt(0)
                              ? tokenBalances[tokenIn] -
                              settings.chainConfig[activechain].gasamount
                              : BigInt(0)
                            : tokenBalances[tokenIn]) *
                            BigInt(preset)) /
                          100n;
                        setSliderPercent(preset);
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
                        setswitched(false);
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
                        if (location.pathname.slice(1) === 'limit') {
                          setamountOutSwap(
                            limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                              ? tokenIn === activeMarket?.baseAddress
                                ? (newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))
                                : (newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice
                              : BigInt(0),
                          );
                          setoutputString(
                            (limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                              ? tokenIn === activeMarket?.baseAddress
                                ? customRound(
                                  Number((newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))) /
                                  10 ** Number(tokendict[tokenOut].decimals),
                                  3,
                                )
                                : customRound(
                                  Number((newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice) /
                                  10 ** Number(tokendict[tokenOut].decimals),
                                  3,
                                )
                              : ''
                            ).toString(),
                          );
                        }
                        const slider = document.querySelector('.balance-amount-slider');
                        const popup = document.querySelector('.slider-percentage-popup');
                        if (slider && popup) {
                          const rect = slider.getBoundingClientRect();
                          (popup as HTMLElement).style.left = `${(rect.width - 15) * (preset / 100) + 15 / 2}px`;
                        }
                      }
                    }}
                    disabled={!connected}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
          ) : sliderMode === 'increment' ? (
            <div className="slider-container increment-mode">
              <button
                className="increment-button minus"
                onClick={() => {
                  if (connected && sliderPercent > 0) {
                    const newPercent = Math.max(0, sliderPercent - sliderIncrement);
                    const newAmount =
                      (((tokenIn == eth && !client)
                        ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount >
                          BigInt(0)
                          ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount
                          : BigInt(0)
                        : tokenBalances[tokenIn]) *
                        BigInt(newPercent)) /
                      100n;
                    setSliderPercent(newPercent);
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
                    setswitched(false);
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
                    if (location.pathname.slice(1) === 'limit') {
                      setamountOutSwap(
                        limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                          ? tokenIn === activeMarket?.baseAddress
                            ? (newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))
                            : (newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice
                          : BigInt(0),
                      );
                      setoutputString(
                        (limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                          ? tokenIn === activeMarket?.baseAddress
                            ? customRound(
                              Number((newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3,
                            )
                            : customRound(
                              Number((newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3,
                            )
                          : ''
                        ).toString(),
                      );
                    }
                    const slider = document.querySelector('.balance-amount-slider');
                    const popup = document.querySelector('.slider-percentage-popup');
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      (popup as HTMLElement).style.left = `${(rect.width - 15) * (newPercent / 100) + 15 / 2}px`;
                    }
                  }
                }}
                disabled={!connected || sliderPercent === 0}
              >
                −
              </button>
              <div className="increment-display">
                <div className="increment-amount">{sliderIncrement}%</div>
              </div>
              <button
                className="increment-button plus"
                onClick={() => {
                  if (connected && sliderPercent < 100) {
                    const newPercent = Math.min(100, sliderPercent + sliderIncrement);
                    const newAmount =
                      (((tokenIn == eth && !client)
                        ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount >
                          BigInt(0)
                          ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount
                          : BigInt(0)
                        : tokenBalances[tokenIn]) *
                        BigInt(newPercent)) /
                      100n;
                    setSliderPercent(newPercent);
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
                    setswitched(false);
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
                    if (location.pathname.slice(1) === 'limit') {
                      setamountOutSwap(
                        limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                          ? tokenIn === activeMarket?.baseAddress
                            ? (newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))
                            : (newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice
                          : BigInt(0),
                      );
                      setoutputString(
                        (limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                          ? tokenIn === activeMarket?.baseAddress
                            ? customRound(
                              Number((newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3,
                            )
                            : customRound(
                              Number((newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3,
                            )
                          : ''
                        ).toString(),
                      );
                    }
                    const slider = document.querySelector('.balance-amount-slider');
                    const popup = document.querySelector('.slider-percentage-popup');
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      (popup as HTMLElement).style.left = `${(rect.width - 15) * (newPercent / 100) + 15 / 2}px`;
                    }
                  }
                }}
                disabled={!connected || sliderPercent === 100}
              >
                +
              </button>
            </div>
          ) : (
            <div className="slider-container slider-mode">
              <input
                type="range"
                className={`balance-amount-slider ${isDragging ? 'dragging' : ''}`}
                min="0"
                max="100"
                step="1"
                value={sliderPercent}
                disabled={!connected}
                onChange={(e) => {
                  const percent = parseInt(e.target.value);
                  const newAmount =
                    (((tokenIn == eth && !client)
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
                  setswitched(false);
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
                  if (location.pathname.slice(1) === 'limit') {
                    setamountOutSwap(
                      limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? (newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))
                          : (newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice
                        : BigInt(0),
                    );
                    setoutputString(
                      (limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? customRound(
                            Number((newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))) /
                            10 ** Number(tokendict[tokenOut].decimals),
                            3,
                          )
                          : customRound(
                            Number((newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice) /
                            10 ** Number(tokendict[tokenOut].decimals),
                            3,
                          )
                        : ''
                      ).toString(),
                    );
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
                  background: `linear-gradient(to right,rgb(171, 176, 224) ${sliderPercent}%,rgba(17, 17, 20, 1) ${sliderPercent}%)`,
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
                      if (connected) {
                        const newAmount =
                          (((tokenIn == eth && !client)
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
                        setswitched(false);
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
                        if (location.pathname.slice(1) === 'limit') {
                          setamountOutSwap(
                            limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                              ? tokenIn === activeMarket?.baseAddress
                                ? (newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))
                                : (newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice
                              : BigInt(0),
                          );
                          setoutputString(
                            (limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                              ? tokenIn === activeMarket?.baseAddress
                                ? customRound(
                                  Number((newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))) /
                                  10 ** Number(tokendict[tokenOut].decimals),
                                  3,
                                )
                                : customRound(
                                  Number((newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice) /
                                  10 ** Number(tokendict[tokenOut].decimals),
                                  3,
                                )
                              : ''
                            ).toString(),
                          );
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
                      }
                    }}
                  >
                    {markPercent}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          className={`limit-swap-button ${isSigning ? 'signing' : ''}`}
          onClick={async () => {
            if (connected && userchain === activechain) {
              let hash;
              setIsSigning(true)
              if (client) {
                txPending.current = true
              }
              try {
                if (tokenIn == eth) {
                  if (addliquidityonly) {
                    hash = await sendUserOperationAsync({
                      uo: limitOrder(
                        router,
                        amountIn,
                        eth,
                        tokenOut as `0x${string}`,
                        limitPrice,
                        amountIn,
                      )
                    })
                  } else {
                    hash = await sendUserOperationAsync({
                      uo: _swap(
                        router,
                        amountIn,
                        eth,
                        tokenOut as `0x${string}`,
                        true,
                        BigInt(2),
                        amountIn,
                        limitPrice,
                        BigInt(Math.floor(Date.now() / 1000) + 900),
                        usedRefAddress as `0x${string}`,
                      )
                    })
                  }
                } else {
                  if (allowance < amountIn) {
                    if (client) {
                      let uo = []
                      uo.push(approve(
                        tokenIn as `0x${string}`,
                        getMarket(
                          activeMarket.path.at(0),
                          activeMarket.path.at(1),
                        ).address,
                        maxUint256,
                      ))
                      if (addliquidityonly) {
                        uo.push(limitOrder(
                          router,
                          BigInt(0),
                          tokenIn as `0x${string}`,
                          tokenOut as `0x${string}`,
                          limitPrice,
                          amountIn,
                        ))
                      } else {
                        uo.push(_swap(
                          router,
                          BigInt(0),
                          tokenIn as `0x${string}`,
                          tokenOut as `0x${string}`,
                          true,
                          BigInt(2),
                          amountIn,
                          limitPrice,
                          BigInt(Math.floor(Date.now() / 1000) + 900),
                          usedRefAddress as `0x${string}`,
                        ))
                      }
                      hash = await sendUserOperationAsync({ uo: uo })
                      newTxPopup(
                        hash.hash,
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
                        activeMarket.address,
                      );
                    }
                    else {
                      hash = await sendUserOperationAsync({
                        uo: approve(
                          tokenIn as `0x${string}`,
                          getMarket(
                            activeMarket.path.at(0),
                            activeMarket.path.at(1),
                          ).address,
                          maxUint256,
                        )
                      })
                      newTxPopup(
                        client
                          ? hash.hash
                          : await waitForTxReceipt(hash.hash),
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
                        activeMarket.address,
                      );
                    }
                  }
                  if (!client || !(allowance < amountIn)) {
                    if (addliquidityonly) {
                      hash = await sendUserOperationAsync({
                        uo: limitOrder(
                          router,
                          BigInt(0),
                          tokenIn as `0x${string}`,
                          tokenOut as `0x${string}`,
                          limitPrice,
                          amountIn,
                        )
                      })
                    } else {
                      hash = await sendUserOperationAsync({
                        uo: _swap(
                          router,
                          BigInt(0),
                          tokenIn as `0x${string}`,
                          tokenOut as `0x${string}`,
                          true,
                          BigInt(2),
                          amountIn,
                          limitPrice,
                          BigInt(Math.floor(Date.now() / 1000) + 900),
                          usedRefAddress as `0x${string}`,
                        )
                      })
                    }
                  }
                }
                if (!client && hash?.hash) {
                  txPending.current = true
                  await waitForTxReceipt(hash.hash);
                }
                setInputString('');
                setamountIn(BigInt(0));
                setamountOutSwap(BigInt(0));
                setoutputString('');
                setLimitButtonDisabled(true);
                setLimitButton(0);
                setSliderPercent(0);
                setIsSigning(false)
                const slider = document.querySelector('.balance-amount-slider');
                const popup = document.querySelector('.slider-percentage-popup');
                if (slider && popup) {
                  (popup as HTMLElement).style.left = `${15 / 2}px`;
                }
                await refetch()
                txPending.current = false
              } catch (error) {
                if (!(error instanceof TransactionExecutionError)) {
                  newTxPopup(
                    hash?.hash,
                    "limitFailed",
                    tokenIn == eth ? eth : tokenIn,
                    tokenOut == eth ? eth : tokenOut,
                    customRound(Number(amountIn) / 10 ** Number(tokendict[tokenIn == eth ? eth : tokenIn].decimals), 3),
                    customRound(Number(amountOutSwap) / 10 ** Number(tokendict[tokenOut == eth ? eth : tokenOut].decimals), 3),
                    `${limitPrice / activeMarket.priceFactor} ${activeMarket.quoteAsset}`,
                    "",
                  );
                }
              } finally {
                txPending.current = false
                setIsSigning(false)
              }
            } else {
              !connected ? setpopup(4) : handleSetChain();
            }
          }}
          disabled={limitButtonDisabled || isSigning}
        >
          {isSigning ? (
            <div className="button-content">
              <div className="loading-spinner" />
              {validOneCT ? t('') : t('signTransaction')}
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
            (tokenIn == activeMarket.quoteAddress ? t('buy') : t('sell')) + ' ' + activeMarket.baseAsset
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
            client ? (tokenIn == activeMarket.quoteAddress ? t('buy') : t('sell')) + ' ' + activeMarket.baseAsset : t('approve')
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
              label={`${t('fee')} (0.00%)`}
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

        {!addliquidityonly && !limitChase &&
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
      {simpleView && <div className="orders-info-rectangle">
        <SimpleOrdersContainer
          orders={orders}
          router={router}
          address={address}
          refetch={refetch}
          sendUserOperationAsync={sendUserOperationAsync}
          setChain={handleSetChain}
          waitForTxReceipt={waitForTxReceipt}
        />
      </div>}
    </div>
  );

  // send ui component
  const send = (
    <div className="rectangle">
      <div className="navlinkwrapper" onClick={() => {
        if (windowWidth <= 1020 && !simpleView && !showTrade) {
          setShowTrade(true);
          document.querySelector('.trade-mobile-switch')?.classList.add('open');
        }
      }} data-active={location.pathname.slice(1)}>
        <div className="innernavlinkwrapper">
          <Link
            to={simpleView ? "/swap" : "/market"}
            className={`navlink ${location.pathname.slice(1) === 'swap' ? 'active' : ''}`}
          >
            {simpleView ? t('swap') : t('market')}
          </Link>
          <Link
            to="/limit"
            className={`navlink ${location.pathname.slice(1) === 'limit' ? 'active' : ''}`}
          >
            {t('limit')}
          </Link>
          <span
            ref={(el: HTMLSpanElement | null) => {
              sendButtonRef.current = el;
            }}
            className={`navlink ${location.pathname.slice(1) != 'swap' && location.pathname.slice(1) != 'limit' ? 'active' : ''}`}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              setShowSendDropdown(!showSendDropdown);
            }}
          >
            <span className="current-pro-text">{t(currentProText)}</span>
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
                  setCurrentProText('send');
                }}
              >
                {t('send')}
              </Link>
              <Link
                to="/scale"
                className="dropdown-item"
                onClick={() => {
                  setShowSendDropdown(false);
                  setCurrentProText('scale');
                }}
              >
                <TooltipLabel
                  label={t('scale')}
                  tooltipText={
                    <div>
                      <div className="tooltip-description">
                        {t('scaleTooltip')}
                      </div>
                    </div>
                  }
                  className="impact-label"
                />
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
                        (({ baseAsset, quoteAsset }) =>
                          (baseAsset === wethticker ? ethticker : baseAsset) +
                          (quoteAsset === wethticker ? ethticker : quoteAsset)
                        )(getMarket(activeMarket.path.at(0), activeMarket.path.at(1)))
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
                      setswitched(false);

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
                    setswitched(false);

                    const usd = calculateUSDValue(
                      tokenBigInt,
                      tradesByMarket[
                      (({ baseAsset, quoteAsset }) =>
                        (baseAsset === wethticker ? ethticker : baseAsset) +
                        (quoteAsset === wethticker ? ethticker : quoteAsset)
                      )(getMarket(activeMarket.path.at(0), activeMarket.path.at(1)))
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
                        (({ baseAsset, quoteAsset }) =>
                          (baseAsset === wethticker ? ethticker : baseAsset) +
                          (quoteAsset === wethticker ? ethticker : quoteAsset)
                        )(getMarket(activeMarket.path.at(0), activeMarket.path.at(1)))
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
                      setswitched(false);

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
                    setswitched(false);

                    const usd = calculateUSDValue(
                      tokenBigInt,
                      tradesByMarket[
                      (({ baseAsset, quoteAsset }) =>
                        (baseAsset === wethticker ? ethticker : baseAsset) +
                        (quoteAsset === wethticker ? ethticker : quoteAsset)
                      )(getMarket(activeMarket.path.at(0), activeMarket.path.at(1)))
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
                      (tokenIn == eth && !client)
                        ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount >
                          BigInt(0)
                          ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount
                          : BigInt(0)
                        : tokenBalances[tokenIn];
                    debouncedSetAmount(BigInt(amount));
                    setswitched(false);
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
                        (({ baseAsset, quoteAsset }) =>
                          (baseAsset === wethticker ? ethticker : baseAsset) +
                          (quoteAsset === wethticker ? ethticker : quoteAsset)
                        )(getMarket(activeMarket.path.at(0), activeMarket.path.at(1)))
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
                          (({ baseAsset, quoteAsset }) =>
                            (baseAsset === wethticker ? ethticker : baseAsset) +
                            (quoteAsset === wethticker ? ethticker : quoteAsset)
                          )(getMarket(activeMarket.path.at(0), activeMarket.path.at(1)))
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
          className={`send-swap-button ${isSigning ? 'signing' : ''}`}
          onClick={async () => {
            if (
              connected &&
              userchain === activechain
            ) {
              let hash: any;
              setIsSigning(true)
              if (client) {
                txPending.current = true
              }
              try {
                if (tokenIn == eth) {
                  hash = await sendUserOperationAsync({
                    uo: sendeth(
                      recipient as `0x${string}`,
                      amountIn,
                    )
                  });
                  if (!client) {
                    txPending.current = true
                  }
                  newTxPopup(
                    (client ? hash.hash : await waitForTxReceipt(hash.hash)),
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
                  hash = await sendUserOperationAsync({
                    uo: sendtokens(
                      tokenIn as `0x${string}`,
                      recipient as `0x${string}`,
                      amountIn,
                    )
                  });
                  if (!client) {
                    txPending.current = true
                  }
                  newTxPopup(
                    (client ? hash.hash : await waitForTxReceipt(hash.hash)),
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
                setIsSigning(false)
                const slider = document.querySelector('.balance-amount-slider');
                const popup = document.querySelector(
                  '.slider-percentage-popup',
                );
                if (slider && popup) {
                  (popup as HTMLElement).style.left = `${15 / 2}px`;
                }
                await refetch()
                txPending.current = false
              } catch (error) {
                if (!(error instanceof TransactionExecutionError)) {
                  newTxPopup(
                    hash.hash,
                    "sendFailed",
                    tokenIn === eth ? eth : tokenIn,
                    "",
                    customRound(
                      Number(amountIn) / 10 ** Number(tokendict[tokenIn === eth ? eth : tokenIn].decimals),
                      3,
                    ),
                    0,
                    "",
                    recipient,
                  );
                }
              } finally {
                txPending.current = false
                setIsSigning(false)
              }
            } else {
              !connected
                ? setpopup(4)
                : handleSetChain()
            }
          }}
          disabled={sendButtonDisabled || isSigning}
        >
          {isSigning ? (
            <div className="button-content">
              <div className="loading-spinner" />
              {validOneCT ? t('') : t('signTransaction')}
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
  );

  // scale ui component
  const scale = (
    <div className="rectangle">
      <div className="navlinkwrapper" onClick={() => {
        if (windowWidth <= 1020 && !simpleView && !showTrade) {
          setShowTrade(true);
          document.querySelector('.trade-mobile-switch')?.classList.add('open');
        }
      }} data-active={location.pathname.slice(1)}>
        <div className="innernavlinkwrapper">
          <Link
            to={simpleView ? "/swap" : "/market"}
            className={`navlink ${location.pathname.slice(1) === 'swap' ? 'active' : ''}`}
          >
            {simpleView ? t('swap') : t('market')}
          </Link>
          <Link
            to="/limit"
            className={`navlink ${location.pathname.slice(1) === 'limit' ? 'active' : ''}`}
          >
            {t('limit')}
          </Link>
          <span
            ref={(el: HTMLSpanElement | null) => {
              sendButtonRef.current = el;
            }}
            className={`navlink ${location.pathname.slice(1) != 'swap' && location.pathname.slice(1) != 'limit' ? 'active' : ''}`}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              setShowSendDropdown(!showSendDropdown);
            }}
          >
            <span className="current-pro-text">{t(currentProText)}</span>
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
                  setCurrentProText('send');
                }}
              >
                {t('send')}
              </Link>
              <Link
                to="/scale"
                className="dropdown-item"
                onClick={() => {
                  setShowSendDropdown(false);
                  setCurrentProText('scale');
                }}
              >
                <TooltipLabel
                  label={t('scale')}
                  tooltipText={
                    <div>
                      <div className="tooltip-description">
                        {t('scaleTooltip')}
                      </div>
                    </div>
                  }
                  className="impact-label"
                />
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
                  if (
                    (inputString.endsWith('.') && e.currentTarget.value === inputString.slice(0, -1)) ||
                    (e.currentTarget.value.endsWith('.') && e.currentTarget.value.slice(0, -1) === inputString)
                  ) {
                    return;
                  }
                  const inputValue = BigInt(
                    Math.round(
                      (parseFloat(e.currentTarget.value || '0') || 0) *
                      10 ** Number(tokendict[tokenIn].decimals),
                    ),
                  );
                  if (scaleStart && scaleEnd && scaleOrders && scaleSkew) {
                    setScaleOutput(Number(inputValue), Number(scaleStart), Number(scaleEnd), Number(scaleOrders), Number(scaleSkew))
                  }
                  else {
                    setScaleOutput(Number(inputValue), Number(scaleStart), Number(scaleEnd), Number(0), Number(scaleSkew))
                  }

                  debouncedSetAmount(inputValue);
                  setswitched(false);

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
                  if (
                    (inputString.endsWith('.') && e.target.value === inputString.slice(0, -1)) ||
                    (e.target.value.endsWith('.') && e.target.value.slice(0, -1) === inputString)
                  ) {
                    return;
                  }
                  const inputValue = BigInt(
                    Math.round(
                      (parseFloat(e.currentTarget.value || '0') || 0) *
                      10 ** Number(tokendict[tokenIn].decimals),
                    ),
                  );
                  if (scaleStart && scaleEnd && scaleOrders && scaleSkew) {
                    setScaleOutput(Number(inputValue), Number(scaleStart), Number(scaleEnd), Number(scaleOrders), Number(scaleSkew))
                  }
                  else {
                    setScaleOutput(Number(inputValue), Number(scaleStart), Number(scaleEnd), Number(0), Number(scaleSkew))
                  }

                  debouncedSetAmount(inputValue);
                  setswitched(false);

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
                className={`button-arrow ${popup == 1 ? 'open' : ''}`}
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
                    (({ baseAsset, quoteAsset }) =>
                      (baseAsset === wethticker ? ethticker : baseAsset) +
                      (quoteAsset === wethticker ? ethticker : quoteAsset)
                    )(getMarket(activeMarket.path.at(0), activeMarket.path.at(1)))
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
                    (tokenIn == eth && !client)
                      ? tokenBalances[tokenIn] -
                        settings.chainConfig[activechain].gasamount >
                        BigInt(0)
                        ? tokenBalances[tokenIn] -
                        settings.chainConfig[activechain].gasamount
                        : BigInt(0)
                      : tokenBalances[tokenIn];
                  debouncedSetAmount(BigInt(amount));
                  setswitched(false);
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
                  else {
                    setScaleOutput(Number(amount), Number(scaleStart), Number(scaleEnd), Number(0), Number(scaleSkew))
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
            setswitched((switched) => { return !switched });
            if (amountIn != BigInt(0) && scaleStart && scaleEnd && scaleOrders && scaleSkew) {
              setInputString(outputString);
              setoutputString(inputString);
              setamountIn(amountOutSwap);
              setamountOutSwap(amountIn);
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
                onCompositionStart={() => {
                  setIsComposing(true);
                }}
                onCompositionEnd={(
                  e: React.CompositionEvent<HTMLInputElement>,
                ) => {
                  setIsComposing(false);
                  if (/^\d*\.?\d{0,18}$/.test(e.currentTarget.value)) {
                    setoutputString(e.currentTarget.value);
                    const outputValue = BigInt(
                      Math.round(
                        (parseFloat(e.currentTarget.value || '0') || 0) *
                        10 ** Number(tokendict[tokenOut].decimals),
                      ),
                    )
                    setamountOutSwap(outputValue);
                    setswitched(true);
                    if (scaleStart && scaleEnd && scaleOrders && scaleSkew) {
                      const requiredInput = calculateScaleInput(
                        outputValue,
                        Number(scaleStart),
                        Number(scaleEnd),
                        Number(scaleOrders),
                        Number(scaleSkew)
                      );
                      setamountIn(requiredInput);
                      setInputString(
                        customRound(
                          Number(requiredInput) / 10 ** Number(tokendict[tokenIn].decimals),
                          3
                        ).toString()
                      );
                      const percentage =
                        tokenBalances[tokenIn] === BigInt(0)
                          ? 0
                          : Math.min(
                            100,
                            Math.floor(
                              Number(
                                (requiredInput) * BigInt(100) / tokenBalances[tokenIn])
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
                    else {
                      const requiredInput = calculateScaleInput(
                        outputValue,
                        Number(scaleStart),
                        Number(scaleEnd),
                        Number(0),
                        Number(scaleSkew)
                      );
                      setamountIn(requiredInput);
                      setInputString('');
                      const percentage =
                        tokenBalances[tokenIn] === BigInt(0)
                          ? 0
                          : Math.min(
                            100,
                            Math.floor(
                              Number(
                                (requiredInput) * BigInt(100) / tokenBalances[tokenIn])
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
                    setoutputString(e.target.value);
                    return;
                  }
                  if (/^\d*\.?\d{0,18}$/.test(e.target.value)) {
                    setoutputString(e.target.value);
                    const outputValue = BigInt(
                      Math.round(
                        (parseFloat(e.target.value || '0') || 0) *
                        10 ** Number(tokendict[tokenOut].decimals),
                      ),
                    )
                    setamountOutSwap(outputValue);
                    setswitched(true);
                    if (scaleStart && scaleEnd && scaleOrders && scaleSkew) {
                      const requiredInput = calculateScaleInput(
                        outputValue,
                        Number(scaleStart),
                        Number(scaleEnd),
                        Number(scaleOrders),
                        Number(scaleSkew)
                      );
                      setamountIn(requiredInput);
                      setInputString(
                        customRound(
                          Number(requiredInput) / 10 ** Number(tokendict[tokenIn].decimals),
                          3
                        ).toString()
                      );
                      const percentage =
                        tokenBalances[tokenIn] === BigInt(0)
                          ? 0
                          : Math.min(
                            100,
                            Math.floor(
                              Number(
                                (requiredInput) * BigInt(100) / tokenBalances[tokenIn])
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
                    else {
                      const requiredInput = calculateScaleInput(
                        outputValue,
                        Number(scaleStart),
                        Number(scaleEnd),
                        Number(0),
                        Number(scaleSkew)
                      );
                      setamountIn(requiredInput);
                      setInputString('');
                      const percentage =
                        tokenBalances[tokenIn] === BigInt(0)
                          ? 0
                          : Math.min(
                            100,
                            Math.floor(
                              Number(
                                (requiredInput) * BigInt(100) / tokenBalances[tokenIn])
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
                placeholder="0.00"
                value={outputString}
              />
              <button
                className="button2"
                onClick={() => {
                  setpopup(2);
                }}
              >
                <img className="button2pic" src={tokendict[tokenOut].image} />
                <span>{tokendict[tokenOut].ticker || "?"}</span>
                <svg
                  className={`button-arrow ${popup == 2 ? 'open' : ''}`}
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
              {amountOutSwap === BigInt(0)
                ? "$0.00"
                : (() => {
                  const outputUSD = calculateUSDValue(
                    amountOutSwap,
                    tradesByMarket[
                    (({ baseAsset, quoteAsset }) =>
                      (baseAsset === wethticker ? ethticker : baseAsset) +
                      (quoteAsset === wethticker ? ethticker : quoteAsset)
                    )(getMarket(activeMarket.path.at(-2), activeMarket.path.at(-1)))
                    ],
                    tokenOut,
                    getMarket(
                      activeMarket.path.at(-2),
                      activeMarket.path.at(-1)
                    )
                  );

                  const inputUSD = calculateUSDValue(
                    BigInt(
                      Math.round(
                        (parseFloat(inputString || "0") || 0) *
                        10 ** Number(tokendict[tokenIn].decimals)
                      )
                    ),
                    tradesByMarket[
                    (({ baseAsset, quoteAsset }) =>
                      (baseAsset === wethticker ? ethticker : baseAsset) +
                      (quoteAsset === wethticker ? ethticker : quoteAsset)
                    )(getMarket(activeMarket.path.at(0), activeMarket.path.at(1)))
                    ],
                    tokenIn,
                    getMarket(
                      activeMarket.path.at(0),
                      activeMarket.path.at(1)
                    )
                  );

                  const percentageDiff =
                    inputUSD > 0 ? ((outputUSD - inputUSD) / inputUSD) * 100 : 0;

                  return (
                    <div className="output-usd-container">
                      <span>{formatUSDDisplay(outputUSD)}</span>
                      {inputUSD > 0 && (
                        <span
                          className={`output-percentage ${percentageDiff >= 0 ? "positive" : "negative"
                            }`}
                        >
                          ({percentageDiff >= 0 ? "+" : ""}
                          {percentageDiff.toFixed(2)}%)
                        </span>
                      )}
                    </div>
                  );
                })()}
            </div>
            <div className="balance2">
              <img src={walleticon} className="balance-wallet-icon" />{" "}
              {formatDisplayValue(
                tokenBalances[tokenOut],
                Number(tokendict[tokenOut].decimals)
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
                tokenIn == activeMarket.quoteAddress && (addliquidityonly || tokenIn == eth)) ||
                (scaleStart <= highestBid &&
                  tokenIn == activeMarket.baseAddress && (addliquidityonly || tokenIn == eth))) &&
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
                    tokenIn == activeMarket.quoteAddress && (addliquidityonly || tokenIn == eth)) ||
                    (scaleStart <= highestBid &&
                      tokenIn == activeMarket.baseAddress && (addliquidityonly || tokenIn == eth))) &&
                  !(tokenIn == activeMarket.quoteAddress
                    ? amountIn < activeMarket.minSize
                    : (amountIn * scaleStart) / activeMarket.scaleFactor <
                    activeMarket.minSize)
                  ? 'exceed-balance'
                  : ''
                  }`}
                onChange={(e) => {
                  if (
                    new RegExp(
                      `^\\d*\\.?\\d{0,${Math.floor(Math.log10(Number(activeMarket.priceFactor)))}}$`
                    ).test(e.target.value)
                  ) {
                    setScaleStartString(e.target.value);
                    let price = BigInt(
                      Math.round(
                        (parseFloat(e.target.value || '0') || 0) *
                        Number(activeMarket.priceFactor)
                      )
                    );
                    setScaleStart(price);
                    if (price && scaleEnd && scaleOrders && scaleSkew) {
                      if (!switched) {
                        setScaleOutput(
                          Number(amountIn),
                          Number(price),
                          Number(scaleEnd),
                          Number(scaleOrders),
                          Number(scaleSkew)
                        );
                      } else {
                        const requiredInput = calculateScaleInput(
                          BigInt(Number(outputString) * 10 ** Number(tokendict[tokenOut].decimals)),
                          Number(price),
                          Number(scaleEnd),
                          Number(scaleOrders),
                          Number(scaleSkew)
                        );
                        setamountIn(BigInt(requiredInput));
                        setInputString(
                          customRound(
                            Number(requiredInput) / 10 ** Number(tokendict[tokenIn].decimals),
                            3
                          ).toString()
                        );
                      }
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
                tokenIn == activeMarket.quoteAddress && (addliquidityonly || tokenIn == eth)) ||
                (scaleEnd <= highestBid &&
                  tokenIn == activeMarket.baseAddress && (addliquidityonly || tokenIn == eth))) &&
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
                    tokenIn == activeMarket.quoteAddress && (addliquidityonly || tokenIn == eth)) ||
                    (scaleEnd <= highestBid &&
                      tokenIn == activeMarket.baseAddress && (addliquidityonly || tokenIn == eth))) &&
                  !(tokenIn == activeMarket.quoteAddress
                    ? amountIn < activeMarket.minSize
                    : (amountIn * scaleEnd) / activeMarket.scaleFactor <
                    activeMarket.minSize)
                  ? 'exceed-balance'
                  : ''
                  }`}
                onChange={(e) => {
                  if (
                    new RegExp(
                      `^\\d*\\.?\\d{0,${Math.floor(Math.log10(Number(activeMarket.priceFactor)))}}$`
                    ).test(e.target.value)
                  ) {
                    setScaleEndString(e.target.value);
                    let price = BigInt(
                      Math.round(
                        (parseFloat(e.target.value || '0') || 0) *
                        Number(activeMarket.priceFactor)
                      )
                    );
                    setScaleEnd(price);
                    if (price && scaleStart && scaleOrders && scaleSkew) {
                      if (!switched) {
                        setScaleOutput(
                          Number(amountIn),
                          Number(scaleStart),
                          Number(price),
                          Number(scaleOrders),
                          Number(scaleSkew)
                        );
                      } else {
                        const requiredInput = calculateScaleInput(
                          BigInt(Number(outputString) * 10 ** Number(tokendict[tokenOut].decimals)),
                          Number(scaleStart),
                          Number(price),
                          Number(scaleOrders),
                          Number(scaleSkew)
                        );
                        setamountIn(BigInt(requiredInput));
                        setInputString(
                          customRound(
                            Number(requiredInput) / 10 ** Number(tokendict[tokenIn].decimals),
                            3
                          ).toString()
                        );
                      }
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
                  if (/^\d*$/.test(e.target.value) && Number(e.target.value) <= 1000) {
                    setScaleOrdersString(e.target.value);
                    let temporders = BigInt(e.target.value == "1" ? 0 : e.target.value)
                    setScaleOrders(temporders)
                    if (temporders && scaleStart && scaleSkew && scaleEnd) {
                      if (!switched) {
                        setScaleOutput(
                          Number(amountIn),
                          Number(scaleStart),
                          Number(scaleEnd),
                          Number(temporders),
                          Number(scaleSkew)
                        );
                      } else {
                        const requiredInput = calculateScaleInput(
                          BigInt(Number(outputString) * 10 ** Number(tokendict[tokenOut].decimals)),
                          Number(scaleStart),
                          Number(scaleEnd),
                          Number(temporders),
                          Number(scaleSkew)
                        );
                        setamountIn(requiredInput);
                        setInputString(
                          customRound(
                            Number(requiredInput) / 10 ** Number(tokendict[tokenIn].decimals),
                            3
                          ).toString()
                        );
                      }
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
                      if (!switched) {
                        setScaleOutput(
                          Number(amountIn),
                          Number(scaleStart),
                          Number(scaleEnd),
                          Number(scaleOrders),
                          Number(skew)
                        );
                      } else {
                        const requiredInput = calculateScaleInput(
                          BigInt(Number(outputString) * 10 ** Number(tokendict[tokenOut].decimals)),
                          Number(scaleStart),
                          Number(scaleEnd),
                          Number(scaleOrders),
                          Number(skew)
                        );
                        setamountIn(requiredInput);
                        setInputString(
                          customRound(
                            Number(requiredInput) / 10 ** Number(tokendict[tokenIn].decimals),
                            3
                          ).toString()
                        );
                      }
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
          {sliderMode === 'presets' ? (
            <div className="slider-container presets-mode">
              <div className="preset-buttons">
                {sliderPresets.map((preset: number, index: number) => (
                  <button
                    key={index}
                    className={`preset-button ${sliderPercent === preset ? 'active' : ''}`}
                    onClick={() => {
                      if (connected) {
                        const newAmount =
                          (((tokenIn == eth && !client)
                            ? tokenBalances[tokenIn] -
                              settings.chainConfig[activechain].gasamount >
                              BigInt(0)
                              ? tokenBalances[tokenIn] -
                              settings.chainConfig[activechain].gasamount
                              : BigInt(0)
                            : tokenBalances[tokenIn]) *
                            BigInt(preset)) /
                          100n;
                        setSliderPercent(preset);
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
                        setswitched(false);
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
                        if (location.pathname.slice(1) === 'limit') {
                          setamountOutSwap(
                            limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                              ? tokenIn === activeMarket?.baseAddress
                                ? (newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))
                                : (newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice
                              : BigInt(0),
                          );
                          setoutputString(
                            (limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                              ? tokenIn === activeMarket?.baseAddress
                                ? customRound(
                                  Number((newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))) /
                                  10 ** Number(tokendict[tokenOut].decimals),
                                  3,
                                )
                                : customRound(
                                  Number((newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice) /
                                  10 ** Number(tokendict[tokenOut].decimals),
                                  3,
                                )
                              : ''
                            ).toString(),
                          );
                        }
                        const slider = document.querySelector('.balance-amount-slider');
                        const popup = document.querySelector('.slider-percentage-popup');
                        if (slider && popup) {
                          const rect = slider.getBoundingClientRect();
                          (popup as HTMLElement).style.left = `${(rect.width - 15) * (preset / 100) + 15 / 2}px`;
                        }
                      }
                    }}
                    disabled={!connected}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
          ) : sliderMode === 'increment' ? (
            <div className="slider-container increment-mode">
              <button
                className="increment-button minus"
                onClick={() => {
                  if (connected && sliderPercent > 0) {
                    const newPercent = Math.max(0, sliderPercent - sliderIncrement);
                    const newAmount =
                      (((tokenIn == eth && !client)
                        ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount >
                          BigInt(0)
                          ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount
                          : BigInt(0)
                        : tokenBalances[tokenIn]) *
                        BigInt(newPercent)) /
                      100n;
                    setSliderPercent(newPercent);
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
                    setswitched(false);
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
                    if (location.pathname.slice(1) === 'limit') {
                      setamountOutSwap(
                        limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                          ? tokenIn === activeMarket?.baseAddress
                            ? (newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))
                            : (newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice
                          : BigInt(0),
                      );
                      setoutputString(
                        (limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                          ? tokenIn === activeMarket?.baseAddress
                            ? customRound(
                              Number((newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3,
                            )
                            : customRound(
                              Number((newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3,
                            )
                          : ''
                        ).toString(),
                      );
                    }
                    const slider = document.querySelector('.balance-amount-slider');
                    const popup = document.querySelector('.slider-percentage-popup');
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      (popup as HTMLElement).style.left = `${(rect.width - 15) * (newPercent / 100) + 15 / 2}px`;
                    }
                  }
                }}
                disabled={!connected || sliderPercent === 0}
              >
                −
              </button>
              <div className="increment-display">
                <div className="increment-amount">{sliderIncrement}%</div>
              </div>
              <button
                className="increment-button plus"
                onClick={() => {
                  if (connected && sliderPercent < 100) {
                    const newPercent = Math.min(100, sliderPercent + sliderIncrement);
                    const newAmount =
                      (((tokenIn == eth && !client)
                        ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount >
                          BigInt(0)
                          ? tokenBalances[tokenIn] -
                          settings.chainConfig[activechain].gasamount
                          : BigInt(0)
                        : tokenBalances[tokenIn]) *
                        BigInt(newPercent)) /
                      100n;
                    setSliderPercent(newPercent);
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
                    setswitched(false);
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
                    if (location.pathname.slice(1) === 'limit') {
                      setamountOutSwap(
                        limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                          ? tokenIn === activeMarket?.baseAddress
                            ? (newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))
                            : (newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice
                          : BigInt(0),
                      );
                      setoutputString(
                        (limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                          ? tokenIn === activeMarket?.baseAddress
                            ? customRound(
                              Number((newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3,
                            )
                            : customRound(
                              Number((newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice) /
                              10 ** Number(tokendict[tokenOut].decimals),
                              3,
                            )
                          : ''
                        ).toString(),
                      );
                    }
                    const slider = document.querySelector('.balance-amount-slider');
                    const popup = document.querySelector('.slider-percentage-popup');
                    if (slider && popup) {
                      const rect = slider.getBoundingClientRect();
                      (popup as HTMLElement).style.left = `${(rect.width - 15) * (newPercent / 100) + 15 / 2}px`;
                    }
                  }
                }}
                disabled={!connected || sliderPercent === 100}
              >
                +
              </button>
            </div>
          ) : (
            <div className="slider-container slider-mode">
              <input
                type="range"
                className={`balance-amount-slider ${isDragging ? 'dragging' : ''}`}
                min="0"
                max="100"
                step="1"
                value={sliderPercent}
                disabled={!connected}
                onChange={(e) => {
                  const percent = parseInt(e.target.value);
                  const newAmount =
                    (((tokenIn == eth && !client)
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
                  setswitched(false);
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
                  if (location.pathname.slice(1) === 'limit') {
                    setamountOutSwap(
                      limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? (newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))
                          : (newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice
                        : BigInt(0),
                    );
                    setoutputString(
                      (limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                        ? tokenIn === activeMarket?.baseAddress
                          ? customRound(
                            Number((newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))) /
                            10 ** Number(tokendict[tokenOut].decimals),
                            3,
                          )
                          : customRound(
                            Number((newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice) /
                            10 ** Number(tokendict[tokenOut].decimals),
                            3,
                          )
                        : ''
                      ).toString(),
                    );
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
                  background: `linear-gradient(to right,rgb(171, 176, 224) ${sliderPercent}%,rgba(17, 17, 20, 1) ${sliderPercent}%)`,
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
                      if (connected) {
                        const newAmount =
                          (((tokenIn == eth && !client)
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
                        setswitched(false);
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
                        if (location.pathname.slice(1) === 'limit') {
                          setamountOutSwap(
                            limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                              ? tokenIn === activeMarket?.baseAddress
                                ? (newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))
                                : (newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice
                              : BigInt(0),
                          );
                          setoutputString(
                            (limitPrice !== BigInt(0) && newAmount !== BigInt(0)
                              ? tokenIn === activeMarket?.baseAddress
                                ? customRound(
                                  Number((newAmount * limitPrice) / (activeMarket.scaleFactor || BigInt(1))) /
                                  10 ** Number(tokendict[tokenOut].decimals),
                                  3,
                                )
                                : customRound(
                                  Number((newAmount * (activeMarket.scaleFactor || BigInt(1))) / limitPrice) /
                                  10 ** Number(tokendict[tokenOut].decimals),
                                  3,
                                )
                              : ''
                            ).toString(),
                          );
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
                      }
                    }}
                  >
                    {markPercent}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          className={`limit-swap-button ${isSigning ? 'signing' : ''}`}
          onClick={async () => {
            if (connected && userchain === activechain) {
              let finalAmountIn = amountIn;
              if (switched) {
                const desiredOutput =
                  Number(outputString) *
                  10 ** Number(tokendict[tokenOut].decimals);
                finalAmountIn = calculateScaleInput(
                  BigInt(desiredOutput),
                  Number(scaleStart),
                  Number(scaleEnd),
                  Number(scaleOrders),
                  Number(scaleSkew)
                );
              }
              let o = calculateScaleOutput(
                finalAmountIn,
                Number(scaleStart),
                Number(scaleEnd),
                Number(scaleOrders),
                Number(scaleSkew)
              );
              let action: any = [[]];
              let price: any = [[]];
              let param1: any = [[]];
              let param2: any = [[]];
              let sum = BigInt(0)
              o.forEach((order) => {
                sum += tokenIn == activeMarket.quoteAddress ? BigInt(order[2]) : BigInt(order[1])
                action[0].push(tokenIn == activeMarket.quoteAddress ? ((addliquidityonly || tokenIn == eth) ? 1 : 5) : ((addliquidityonly || tokenIn == eth) ? 2 : 6));
                price[0].push(order[0]);
                param1[0].push(tokenIn == activeMarket.quoteAddress ? order[2] : order[1]);
                param2[0].push(tokenIn == eth ? router : address);
              });
              let hash;
              setIsSigning(true)
              if (client) {
                txPending.current = true
              }
              try {
                if (tokenIn == eth) { // sell
                  hash = await sendUserOperationAsync({
                    uo: multiBatchOrders(
                      router,
                      BigInt(finalAmountIn),
                      [activeMarket.address],
                      action,
                      price,
                      param1,
                      param2,
                      usedRefAddress
                    )
                  })
                } else {
                  if (allowance < finalAmountIn) {
                    if (client) {
                      let uo = []
                      uo.push(approve(
                        tokenIn as `0x${string}`,
                        getMarket(
                          activeMarket.path.at(0),
                          activeMarket.path.at(1),
                        ).address,
                        maxUint256,
                      ))
                      uo.push(multiBatchOrders(
                        router,
                        BigInt(0),
                        [activeMarket.address],
                        action,
                        price,
                        param1,
                        param2,
                        usedRefAddress
                      ))
                      hash = await sendUserOperationAsync({ uo: uo })
                      newTxPopup(
                        hash.hash,
                        'approve',
                        tokenIn,
                        '',
                        customRound(
                          Number(finalAmountIn) /
                          10 ** Number(tokendict[tokenIn].decimals),
                          3,
                        ),
                        0,
                        '',
                        activeMarket.address,
                      );
                    }
                    else {
                      hash = await sendUserOperationAsync({
                        uo: approve(
                          tokenIn as `0x${string}`,
                          getMarket(
                            activeMarket.path.at(0),
                            activeMarket.path.at(1),
                          ).address,
                          maxUint256,
                        )
                      })
                      newTxPopup(
                        (client
                          ? hash.hash
                          : await waitForTxReceipt(hash.hash)
                        ),
                        'approve',
                        tokenIn,
                        '',
                        customRound(
                          Number(finalAmountIn) /
                          10 ** Number(tokendict[tokenIn].decimals),
                          3,
                        ),
                        0,
                        '',
                        activeMarket.address,
                      );
                    }
                  }
                  if (!client || !(allowance < finalAmountIn)) {
                    hash = await sendUserOperationAsync({
                      uo: multiBatchOrders(
                        router,
                        BigInt(0),
                        [activeMarket.address],
                        action,
                        price,
                        param1,
                        param2,
                        usedRefAddress
                      )
                    })
                  }
                }
                if (!client && hash?.hash) {
                  txPending.current = true
                  await waitForTxReceipt(hash.hash);
                }
                setInputString('');
                setamountIn(BigInt(0));
                setamountOutSwap(BigInt(0));
                setoutputString('');
                setScaleButtonDisabled(true);
                setScaleButton(0);
                setScaleStart(BigInt(0));
                setScaleEnd(BigInt(0));
                setScaleStartString('');
                setScaleEndString('');
                setScaleSkew(1);
                setScaleSkewString('1.00');
                setScaleOrders(BigInt(0));
                setScaleOrdersString('');
                setSliderPercent(0);
                setIsSigning(false)
                const slider = document.querySelector('.balance-amount-slider');
                const popup = document.querySelector('.slider-percentage-popup');
                if (slider && popup) {
                  (popup as HTMLElement).style.left = `${15 / 2}px`;
                }
                await refetch()
                txPending.current = false
              } catch (error) {
                if (!(error instanceof TransactionExecutionError)) {
                  newTxPopup(
                    hash?.hash,
                    "limitFailed",
                    tokenIn == eth ? eth : tokenIn,
                    tokenOut == eth ? eth : tokenOut,
                    customRound(Number(amountIn) / 10 ** Number(tokendict[tokenIn == eth ? eth : tokenIn].decimals), 3),
                    customRound(Number(amountOutSwap) / 10 ** Number(tokendict[tokenOut == eth ? eth : tokenOut].decimals), 3),
                    "",
                    "",
                  );
                }
              } finally {
                txPending.current = false
                setIsSigning(false)
              }
            } else {
              !connected ? setpopup(4) : handleSetChain();
            }
          }}
          disabled={scaleButtonDisabled || isSigning}
        >
          {isSigning ? (
            <div className="button-content">
              <div className="loading-spinner" />
              {validOneCT ? t('') : t('signTransaction')}
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
            t('insufficient') + (tokendict[tokenIn].ticker || '?') + ' ' + t('bal')
          ) : scaleButton == 11 ? (
            `${t('switchto')} ${t(settings.chainConfig[activechain].name)}`
          ) : scaleButton == 12 ? (
            t('connectWallet')
          ) : scaleButton == 13 ? (
            client ? (tokenIn == activeMarket.quoteAddress ? t('buy') : t('sell')) + ' ' + activeMarket.baseAsset : t('approve')
          ) : (
            (tokenIn == activeMarket.quoteAddress ? t('buy') : t('sell')) + ' ' + activeMarket.baseAsset
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
            checked={(addliquidityonly || tokenIn == eth)}
            onChange={() => {
              const newValue = !addliquidityonly;
              setAddLiquidityOnly(newValue);
              localStorage.setItem(
                'crystal_add_liquidity_only',
                JSON.stringify(newValue),
              );
            }}
            disabled={tokenIn == eth}
          />
        </div>
        <div className="trade-fee">
          <div className="label-container">
            <TooltipLabel
              label={`${t('fee')} (0.00%)`}
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
      {simpleView && <div className="orders-info-rectangle">
        <SimpleOrdersContainer
          orders={orders}
          router={router}
          address={address}
          refetch={refetch}
          sendUserOperationAsync={sendUserOperationAsync}
          setChain={handleSetChain}
          waitForTxReceipt={waitForTxReceipt}
        />
      </div>}
    </div>
  );

  const renderChartComponent = useMemo(() => (
    <ChartComponent
      activeMarket={activeMarket}
      tradehistory={tradehistory}
      isMarksVisible={isMarksVisible}
      orders={orders}
      isOrdersVisible={isOrdersVisible}
      showChartOutliers={showChartOutliers}
      router={router}
      refetch={refetch}
      sendUserOperationAsync={sendUserOperationAsync}
      setChain={handleSetChain}
      waitForTxReceipt={waitForTxReceipt}
      address={address}
      client={client}
      newTxPopup={newTxPopup}
      usedRefAddress={usedRefAddress}
      data={advChartData}
      setData={setChartData}
      realtimeCallbackRef={realtimeCallbackRef}
    />
  ), [
    activeMarket,
    tradehistory,
    isMarksVisible,
    orders,
    isOrdersVisible,
    showChartOutliers,
    router,
    refetch,
    handleSetChain,
    waitForTxReceipt,
    address,
    client,
    newTxPopup,
    usedRefAddress,
    advChartData,
    realtimeCallbackRef
  ]);

  const TradeLayout = (swapComponent: JSX.Element) => (
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
            <div className="right-column">{swapComponent}</div>
          </>
        ) : (
          <>
            <div className="chartandorderbookandordercenter">
              <div className="chartandorderbook">
                <ChartOrderbookPanel
                  layoutSettings={layoutSettings}
                  orderbookPosition={orderbookPosition}
                  orderdata={{
                    roundedBuyOrders: roundedBuyOrders?.orders,
                    roundedSellOrders: roundedSellOrders?.orders,
                    spreadData,
                    priceFactor: Number(markets[roundedBuyOrders?.key]?.priceFactor),
                    symbolIn: markets[roundedBuyOrders?.key]?.quoteAsset,
                    symbolOut: markets[roundedBuyOrders?.key]?.baseAsset,
                  }}
                  windowWidth={windowWidth}
                  mobileView={mobileView}
                  isOrderbookVisible={isOrderbookVisible}
                  orderbookWidth={orderbookWidth}
                  setOrderbookWidth={setOrderbookWidth}
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
                  updateLimitAmount={updateLimitAmount}
                  renderChartComponent={renderChartComponent}
                />
              </div>
              <div
                className={`oc-spacer ${!isOrderCenterVisible ? 'collapsed' : ''}`}
              >
                <div
                  className="ordercenter-drag-handle"
                  onMouseDown={handleVertMouseDown}
                />
              </div>
              <OrderCenter
                orders={orders}
                tradehistory={tradehistory}
                canceledorders={canceledorders}
                router={router}
                address={address}
                trades={tradesByMarket}
                currentMarket={
                  activeMarketKey.replace(
                    new RegExp(
                      `^${wethticker}|${wethticker}$`,
                      'g'
                    ),
                    ethticker
                  )
                }
                orderCenterHeight={orderCenterHeight}
                hideBalances={true}
                tokenList={memoizedTokenList}
                onMarketSelect={onMarketSelect}
                setSendTokenIn={setSendTokenIn}
                setpopup={setpopup}
                sortConfig={memoizedSortConfig}
                onSort={emptyFunction}
                tokenBalances={tokenBalances}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                filter={filter}
                setFilter={setFilter}
                onlyThisMarket={onlyThisMarket}
                setOnlyThisMarket={setOnlyThisMarket}
                refetch={refetch}
                sendUserOperationAsync={sendUserOperationAsync}
                setChain={handleSetChain}
                waitForTxReceipt={waitForTxReceipt}
                isVertDragging={isVertDragging}
                isOrderCenterVisible={isOrderCenterVisible}
                onLimitPriceUpdate={setCurrentLimitPrice}
                openEditOrderPopup={openEditOrderPopup}
                openEditOrderSizePopup={openEditOrderSizePopup}
                marketsData={marketsData}
              />
            </div>
            {windowWidth > 1020 && (
              <div className="right-column"> {swapComponent} </div>
            )}
          </>
        )}
      </div>
    </div>
  );


  return (
    <div className="app-wrapper" key={language}>
      <NavigationProgress location={location} />
      <FullScreenOverlay isVisible={loading} />
      <MemeTransactionPopupManager />

      {Modals}
      <SidebarNav simpleView={simpleView} setSimpleView={setSimpleView}/>
      {windowWidth <= 1020 &&
        !simpleView &&
        ['swap', 'limit', 'send', 'scale', 'market'].includes(location.pathname.slice(1)) && (
          <>
            <div
              className={`right-column ${showTrade ? 'show' : ''} ${isMobileDragging ? 'dragging' : ''}`}
              style={{
                transform: showTrade && isMobileDragging
                  ? `translateY(${mobileDragY}px)`
                  : showTrade
                    ? 'translateY(0)'
                    : 'translateY(calc(100% - 91px))'
              }}
              onTouchStart={(e: React.TouchEvent) => {
                if (windowWidth <= 1020 && showTrade) {
                  setMobileStartY(e.touches[0].clientY);
                  setIsMobileDragging(true);
                }
              }}
              onTouchMove={(e: React.TouchEvent) => {
                if (!isMobileDragging || windowWidth > 1020 || !showTrade) return;

                const currentY = e.touches[0].clientY;
                const deltaY = currentY - mobileStartY;

                if (deltaY > 0) {
                  setMobileDragY(deltaY);
                }
              }}
              onTouchEnd={() => {
                if (!isMobileDragging || windowWidth > 1020) return;

                setIsMobileDragging(false);

                if (mobileDragY > 100) {
                  setShowTrade(false);
                  document.body.style.overflow = 'auto';
                  document.querySelector('.right-column')?.classList.add('hide');
                  document.querySelector('.right-column')?.classList.remove('show');
                  document.querySelector('.trade-mobile-switch')?.classList.remove('open');
                }
                setMobileDragY(0);
              }}
            >
              <div className="mobile-drag-handle">
                <div className="drag-indicator"></div>
              </div>

              {location.pathname.slice(1) == 'swap' || location.pathname.slice(1) == 'market' ? swap : location.pathname.slice(1) == 'limit' ? limit : location.pathname.slice(1) == 'send' ? send : scale}
            </div>
          </>
        )}
      {
        <>
          <div
            // style={getAppContainerStyle()} 
          >
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
  activeMarket={activeMarket}
  orderdata={{
    liquidityBuyOrders,
    liquiditySellOrders,
  }}
  onMarketSelect={onMarketSelect}
  marketsData={sortedMarkets}
  tradesloading={tradesloading}
  tradesByMarket={tradesByMarket}
  currentWalletIcon={currentWalletIcon}
  subWallets={subWallets}
  walletTokenBalances={walletTokenBalances}
  activeWalletPrivateKey={oneCTSigner}
  setOneCTSigner={setOneCTSigner}
  refetch={refetch}
  isBlurred={isBlurred}
  forceRefreshAllWallets={forceRefreshAllWallets}
  tokenList={memoizedTokenList}
  logout={logout}
  tokenBalances={tokenBalances}
          />
        </div>
        <div className="headerfiller"></div>
      </>
    }
    <div className="app-container">

<Routes>
  <Route path="/" element={<Navigate to="/market" replace />} />
  <Route path="*" element={<Navigate to="/market" replace />} />
  <Route
    path="/leaderboard"
    element={
      <Leaderboard
        setpopup={setpopup}
        orders={orders}
        address={address}
        username={username}
        setIsTransitioning={setIsTransitioning}
        setTransitionDirection={setTransitionDirection}
      />
    }
  />
  <Route path="/lending" element={
    <EarnVaults
      setpopup={setpopup}
      onSelectToken={(token) => {
        setSelectedToken(token);
        setTimeout(() => setSelectedToken(null), 100);
      }}
      setOnSelectTokenCallback={setOnSelectTokenCallback}
      selectedToken={selectedToken}
      tokenBalances={tokenBalances}
      tokendict={tokendict}
      address={address}
      connected={connected}
      refetch={refetch}
      tradesByMarket={tradesByMarket}
      markets={markets}
      usdc={usdc}
      wethticker={wethticker}
      ethticker={ethticker}
      account={{
        connected: connected,
        address: address,
        chainId: userchain,
      }}
      sendUserOperationAsync={sendUserOperationAsync}
      waitForTxReceipt={waitForTxReceipt}
      activechain={activechain}
      setChain={handleSetChain}
    />}
  />
  <Route path="/earn" element={<Navigate to="/earn/vaults" replace />} />
  <Route path="/earn/vaults" element={
    <LPVaults
      setpopup={setpopup}
      onSelectToken={(token) => {
        setSelectedToken(token);
        setTimeout(() => setSelectedToken(null), 100);
      }}
      setOnSelectTokenCallback={setOnSelectTokenCallback}
      tokendict={tokendict}
      tradesByMarket={tradesByMarket}
      markets={markets}
      tokenBalances={tokenBalances}
      currentRoute="/earn/vaults"
      onRouteChange={(route) => navigate(route)}
      connected={connected}
      account={{
        connected: connected,
        address: address,
        chainId: userchain,
      }}
      selectedVaultForAction={selectedVaultForAction}
      setSelectedVaultForAction={setSelectedVaultForAction}
      vaultDepositAmount={vaultDepositAmount}
      setVaultDepositAmount={setVaultDepositAmount}
      vaultWithdrawAmount={vaultWithdrawAmount}
      setVaultWithdrawAmount={setVaultWithdrawAmount}
      isVaultDepositSigning={isVaultDepositSigning}
      setIsVaultDepositSigning={setIsVaultDepositSigning}
      isVaultWithdrawSigning={isVaultWithdrawSigning}
      setIsVaultWithdrawSigning={setIsVaultWithdrawSigning}
      sendUserOperationAsync={sendUserOperationAsync}
      waitForTxReceipt={waitForTxReceipt}
      setChain={handleSetChain}
      address={address}
      refetch={refetch}
      activechain={activechain}
      crystalVaultsAddress={crystalVaults}
    />
  } />
<Route
  path="/board"
  element={
    <TokenBoard
      sendUserOperationAsync={sendUserOperationAsync}
      waitForTxReceipt={waitForTxReceipt}
      account={{
        connected: connected,
        address: address,
        chainId: userchain,
      }}
      setChain={handleSetChain}
      setpopup={setpopup}
    />
  }
/>
<Route
  path="/board/:tokenAddress"
  element={
    <TokenDetail
      sendUserOperationAsync={sendUserOperationAsync}
      waitForTxReceipt={waitForTxReceipt}
      account={{
        connected: connected,
        address: address,
        chainId: userchain,
      }}
      setChain={handleSetChain}
      setpopup={setpopup}
    />
  }
/>
  <Route path="/earn/vaults/:vaultAddress" element={
    <LPVaults
      setpopup={setpopup}
      onSelectToken={(token) => {
        setSelectedToken(token);
        setTimeout(() => setSelectedToken(null), 100);
      }}
      setOnSelectTokenCallback={setOnSelectTokenCallback}
      tokendict={tokendict}
      tradesByMarket={tradesByMarket}
      markets={markets}
      tokenBalances={tokenBalances}
      currentRoute={location.pathname}
      onRouteChange={(route) => navigate(route)}
      connected={connected}
      account={{
        connected: connected,
        address: address,
        chainId: userchain,
      }}
      selectedVaultForAction={selectedVaultForAction}
      setSelectedVaultForAction={setSelectedVaultForAction}
      vaultDepositAmount={vaultDepositAmount}
      setVaultDepositAmount={setVaultDepositAmount}
      vaultWithdrawAmount={vaultWithdrawAmount}
      setVaultWithdrawAmount={setVaultWithdrawAmount}
      isVaultDepositSigning={isVaultDepositSigning}
      setIsVaultDepositSigning={setIsVaultDepositSigning}
      isVaultWithdrawSigning={isVaultWithdrawSigning}
      setIsVaultWithdrawSigning={setIsVaultWithdrawSigning}
      sendUserOperationAsync={sendUserOperationAsync}
      waitForTxReceipt={waitForTxReceipt}
      setChain={handleSetChain}
      address={address}
      refetch={refetch}
      activechain={activechain}
      crystalVaultsAddress={crystalVaults}
    />
  } />

  <Route
    path="/launchpad"
    element={
      <Launchpad
        address={address}
        sendUserOperationAsync={sendUserOperationAsync}
        waitForTxReceipt={waitForTxReceipt}
        account={{
          connected: connected,
          address: address,
          chainId: userchain,
          logout: logout,
        }}
        setChain={handleSetChain}
        setpopup={setpopup}
      />
    }
  />
  <Route path="/meme/:tokenAddress" element={
    <MemeInterface
      tradingMode={tradingMode}
      sliderMode={tradingMode === 'spot' ? spotSliderMode : trenchesSliderMode}
      sliderPresets={tradingMode === 'spot' ? spotSliderPresets : trenchesSliderPresets}
      sliderIncrement={tradingMode === 'spot' ? spotSliderIncrement : trenchesSliderIncrement}
      marketsData={marketsData}
      onMarketSelect={onMarketSelect}
      setSendTokenIn={setSendTokenIn}
      setpopup={setpopup}
      tokenList={memoizedTokenList}
      sendUserOperationAsync={sendUserOperationAsync}
      waitForTxReceipt={waitForTxReceipt}
      account={{
        connected: connected,
        address: address,
        chainId: userchain,
      }}
      setChain={handleSetChain}
      address={address}
      subWallets={subWallets}
      walletTokenBalances={walletTokenBalances}
      activeWalletPrivateKey={oneCTSigner}
      setOneCTSigner={setOneCTSigner}
      refetch={refetch}
      isBlurred={isBlurred}
      forceRefreshAllWallets={forceRefreshAllWallets}
      tradesByMarket={tradesByMarket}
      markets={markets}
      tokendict={tokendict}
      usdc={usdc}
      wethticker={wethticker}
      ethticker={ethticker}
    />
  } />

  <Route
    path="/explorer"
    element={
      <TokenExplorer
        setpopup={setpopup}
        appliedFilters={appliedExplorerFilters}
        activeFilterTab={activeExplorerFilterTab}
        onOpenFiltersForColumn={handleOpenFiltersForColumn}
        sendUserOperationAsync={sendUserOperationAsync}
        waitForTxReceipt={waitForTxReceipt}
      />
    }
  />
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
        onMarketSelect={onMarketSelect}
        setSendTokenIn={setSendTokenIn}
        setpopup={setpopup}
        tokenBalances={tokenBalances}
        totalAccountValue={totalAccountValue}
        setTotalVolume={setTotalVolume}
        totalVolume={totalVolume}
        chartData={typeof totalAccountValue === 'number' ? [
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
        claimableFees={claimableFees}
        refLink={refLink}
        setRefLink={setRefLink}
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
        sendUserOperationAsync={sendUserOperationAsync}
        setChain={handleSetChain}
        waitForTxReceipt={waitForTxReceipt}
        marketsData={marketsData}
        usedRefLink={usedRefLink}
        setUsedRefLink={setUsedRefLink}
        usedRefAddress={usedRefAddress}
        setUsedRefAddress={setUsedRefAddress}
        client={client}
        activechain={activechain}
        markets={markets}
        subWallets={subWallets}
        setSubWallets={saveSubWallets}
        walletTokenBalances={walletTokenBalances}
        walletTotalValues={walletTotalValues}
        walletsLoading={walletsLoading}
        subwalletBalanceLoading={subwalletBalanceLoading}
        forceRefreshAllWallets={forceRefreshAllWallets}
        setOneCTSigner={setOneCTSigner}
        isVaultDepositSigning={isVaultDepositSigning}
        setIsVaultDepositSigning={setIsVaultDepositSigning}
        handleSetChain={handleSetChain}
        handleSubwalletTransfer={handleSubwalletTransfer}
        createSubWallet={createSubWallet}
        signTypedDataAsync={signTypedDataAsync}
        keccak256={keccak256}
        Wallet={Wallet}
        refreshWalletBalance={refreshWalletBalance}
        activeWalletPrivateKey={oneCTSigner} setShowRefModal={undefined}      />
    }
  />
  <Route path="/swap" element={TradeLayout(swap)} />
  <Route path="/market" element={TradeLayout(swap)} />
  <Route path="/limit" element={TradeLayout(limit)} />
  <Route path="/send" element={TradeLayout(send)} />
  <Route path="/scale" element={TradeLayout(scale)} />
</Routes>
        <TransactionPopupManager
          transactions={transactions}
          setTransactions={setTransactions}
          tokendict={tokendict}
          showPreview={showPreview}
          previewPosition={previewPosition}
          previewExiting={previewExiting}
        />
{/* <WidgetExplorer
  isOpen={isWidgetExplorerOpen}
  onClose={handleCloseWidgetExplorer}
  setpopup={setpopup}
  appliedFilters={appliedExplorerFilters}
  activeFilterTab={activeExplorerFilterTab}
  onOpenFiltersForColumn={handleOpenFiltersForColumn}
  sendUserOperationAsync={sendUserOperationAsync}
  waitForTxReceipt={waitForTxReceipt}
  onSnapToSide={handleWidgetExplorerSnapToSide}
  currentSnapSide={widgetExplorerSnapSide}
  onWidgetResize={handleWidgetExplorerResize} 
/> */}
      </div>
    </div>
  );
}

export default App;