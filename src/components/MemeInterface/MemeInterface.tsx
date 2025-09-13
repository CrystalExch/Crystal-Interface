import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { encodeFunctionData, decodeEventLog } from "viem";
import { settings } from "../../settings";
import QuickBuyWidget from "./QuickBuyWidget/QuickBuyWidget";
import MemeOrderCenter from "./MemeOrderCenter/MemeOrderCenter";
import MemeTradesComponent from "./MemeTradesComponent/MemeTradesComponent";
import MemeChart from "./MemeChart/MemeChart";
import { showLoadingPopup, updatePopup } from '../MemeTransactionPopup/MemeTransactionPopupManager';
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";
import { CrystalRouterAbi } from "../../abis/CrystalRouterAbi";
import { useSharedContext } from "../../contexts/SharedContext";
import TooltipLabel from '../../components/TooltipLabel/TooltipLabel.tsx';

import contract from "../../assets/contract.svg";
import gas from "../../assets/gas.svg";
import slippage from "../../assets/slippage.svg";
import switchicon from "../../assets/switch.svg";
import editicon from "../../assets/edit.svg";
import walleticon from "../../assets/wallet_icon.png"
import closebutton from "../../assets/close_button.png";
import monadicon from "../../assets/monadlogo.svg";
import trash from '../../assets/trash.svg';

import "./MemeInterface.css";

interface Token {
  id: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  image: string;
  price: number;
  marketCap: number;
  change24h: number;
  volume24h: number;
  holders: number;
  proTraders: number;
  kolTraders: number;
  sniperHolding: number;
  devHolding: number;
  bundleHolding: number;
  insiderHolding: number;
  top10Holding: number;
  buyTransactions: number;
  sellTransactions: number;
  globalFeesPaid: number;
  website: string;
  twitterHandle: string;
  progress: number;
  status: "new" | "graduating" | "graduated";
  description: string;
  created: number;
  bondingAmount: number;
  volumeDelta: number;
  quote?: number;
  dev: string;
}

interface Trade {
  id: string;
  timestamp: number;
  isBuy: boolean;
  price: number;
  tokenAmount: number;
  nativeAmount: number;
  caller: string;
}

interface Holder {
  address: string;
  balance: number;
  tokenNet: number;
  valueNet: number;
  amountBought: number;
  amountSold: number;
  valueBought: number;
  valueSold: number;
}

interface MemeInterfaceProps {
  tradingMode: "spot" | "trenches";
  sliderMode: string;
  sliderPresets: number[];
  sliderIncrement: number;
  tokenList: any[];
  marketsData: any[];
  onMarketSelect: (market: any) => void;
  setSendTokenIn: (token: any) => void;
  setpopup: (value: number) => void;
  sendUserOperationAsync: any;
  account: { connected: boolean; address: string; chainId: number };
  setChain: () => void;
  tokendict?: { [key: string]: any };
  tradesByMarket?: any;
  markets?: any;
  usdc?: string;
  wethticker?: string;
  ethticker?: string;
  address: any;
  subWallets?: Array<{ address: string, privateKey: string }>;
  walletTokenBalances?: { [address: string]: any };
  activeWalletPrivateKey?: string;
  setOneCTSigner: (privateKey: string) => void;
  refetch?: () => void;
  isBlurred?: boolean;
  terminalQueryData: any;
  terminalToken: any;
  setTerminalToken: any;
  terminalRefetch: any;
  tokenData?: any;
  setTokenData: any;
}

const MARKET_UPDATE_EVENT = "0xc367a2f5396f96d105baaaa90fe29b1bb18ef54c712964410d02451e67c19d3e";
const MARKET_CREATED_EVENT = "0x32a005ee3e18b7dd09cfff956d3a1e8906030b52ec1a9517f6da679db7ffe540";
const TOTAL_SUPPLY = 1e9;
const SUBGRAPH_URL = 'https://gateway.thegraph.com/api/b9cc5f58f8ad5399b2c4dd27fa52d881/subgraphs/id/BJKD3ViFyTeyamKBzC1wS7a3XMuQijvBehgNaSBb197e';
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const PAGE_SIZE = 100;

const HOLDERS_QUERY = `
  query ($m: Bytes!, $skip: Int!, $first: Int!) {
    launchpadPositions(
      where: { token: $m }
      orderBy: remainingTokens
      orderDirection: desc
      skip: $skip
      first: $first
    ) {
      account { id }
      tokenBought
      tokenSold
      nativeSpent
      nativeReceived
      remainingTokens
      remainingPctOfBuys
      avgEntryNativePerTokenWad
      realizedPnlNative
      unrealizedPnlNative
      lastUpdatedAt
    }

    launchpadTokens(where: { id: $m }) {
      lastPriceNativePerTokenWad
    }

    top10: launchpadPositions(
      where: { token: $m }
      orderBy: remainingTokens
      orderDirection: desc
      first: 10
    ) {
      remainingTokens
    }
  }
`;

const POSITIONS_QUERY = `
  query ($a: Bytes!, $skip: Int!, $first: Int!) {
    launchpadPositions(
      where: { account: $a, remainingTokens_gt: "0" }
      orderBy: remainingTokens
      orderDirection: desc
      skip: $skip
      first: $first
    ) {
      token { id symbol name decimals lastPriceNativePerTokenWad metadataCID }
      account { id }
      tokenBought
      tokenSold
      nativeSpent
      nativeReceived
      remainingTokens
      avgEntryNativePerTokenWad
      realizedPnlNative
      unrealizedPnlNative
      lastUpdatedAt
    }
  }
`;

const DEV_TOKENS_QUERY = `
  query ($d: Bytes!, $skip: Int!, $first: Int!) {
    launchpadTokens(
      where: { creator: $d }
      orderBy: timestamp
      orderDirection: desc
      skip: $skip
      first: $first
    ) {
      id
      name
      symbol
      metadataCID
      lastPriceNativePerTokenWad
      timestamp
      migrated
    }
  }
`;

const TOP_TRADERS_QUERY = `
  query ($m: Bytes!, $since: BigInt!, $skip: Int!, $first: Int!) {
    launchpadPositions(
      where: { token: $m, lastUpdatedAt_gte: $since }
      orderBy: realizedPnlNative
      orderDirection: desc
      skip: $skip
      first: $first
    ) {
      account { id }
      tokenBought
      tokenSold
      nativeSpent
      nativeReceived
      remainingTokens
      realizedPnlNative
      unrealizedPnlNative
      lastUpdatedAt
    }

    launchpadTokens(where: { id: $m }) {
      lastPriceNativePerTokenWad
    }
  }
`;

const RESOLUTION_SECS: Record<string, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

const toSeriesKey = (sym: string, interval: string) =>
  sym + "MON" + (interval === "1d" ? "1D" : interval === "4h" ? "240" : interval === "1h" ? "60" : interval.slice(0, -1));

const fmt = (v: number, d = 6) => {
  if (v === 0) return "0";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  if (v >= 1) return v.toLocaleString("en-US", { maximumFractionDigits: d });
  return v.toFixed(Math.min(d, 8));
};
const formatTradeAmount = (value: number): string => {
  if (value === 0) return "0";
  if (value > 0 && value < 0.01) {
    return value.toFixed(6);
  }
  return value.toFixed(2);
};


const MemeInterface: React.FC<MemeInterfaceProps> = ({
  sliderMode,
  sliderPresets,
  sliderIncrement,
  tokenList,
  onMarketSelect,
  setSendTokenIn,
  setpopup,
  sendUserOperationAsync,
  account,
  setChain,
  tokendict = {},
  tradesByMarket,
  markets,
  usdc,
  wethticker,
  ethticker,
  address,
  subWallets = [],
  walletTokenBalances = {},
  activeWalletPrivateKey,
  setOneCTSigner,
  refetch,
  isBlurred = false,
  setTerminalToken,
  terminalRefetch,
  tokenData,
  setTokenData,
}) => {
  const getSliderPosition = (activeView: 'chart' | 'trades' | 'ordercenter') => {
    switch (activeView) {
      case 'chart': return 0;
      case 'trades': return 1;
      case 'ordercenter': return 2;
      default: return 0;
    }
  };

  const resolveNative = useCallback(
    (symbol: string | undefined) => {
      if (!symbol) return "";
      if (symbol === wethticker) return ethticker ?? symbol;
      return symbol;
    },
    [wethticker, ethticker],
  );

  const usdPer = useCallback(
    (symbol?: string): number => {
      if (!symbol || !tradesByMarket || !markets) return 0;
      const sym = resolveNative(symbol);
      if (usdc && sym === "USDC") return 1;
      const pair = `${sym}USDC`;
      const top = tradesByMarket[pair]?.[0]?.[3];
      const pf = Number(markets[pair]?.priceFactor) || 1;
      if (!top || !pf) return 0;
      return Number(top) / pf;
    },
    [tradesByMarket, markets, resolveNative, usdc],
  );
  const { tokenAddress } = useParams<{ tokenAddress: string }>();
  const [tokenInfoExpanded, setTokenInfoExpanded] = useState(true);
  const [isWidgetOpen, setIsWidgetOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('crystal_quickbuy_widget_open');
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('crystal_quickbuy_widget_open', JSON.stringify(isWidgetOpen));
    } catch (error) {
    }
  }, [isWidgetOpen]);

  const [tradeAmount, setTradeAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteValue, setQuoteValue] = useState<number | undefined>(undefined);
  const [inputCurrency, setInputCurrency] = useState<"MON" | "TOKEN">("MON");
  const [sliderPercent, setSliderPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [slippageValue, _setSlippageValue] = useState("20");
  const [priorityFee, _setPriorityFee] = useState("0.01");
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
  const [isVertDragging, setIsVertDragging] = useState<boolean>(false);
  const [isSigning, setIsSigning] = useState(false);
  const [activeTradeType, setActiveTradeType] = useState<"buy" | "sell">("buy");
  const [activeOrderType, setActiveOrderType] = useState<"market" | "Limit">("market");
  const [live, setLive] = useState<Partial<Token>>({});
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedInterval, setSelectedInterval] = useState("5m");
  const [chartData, setChartData] = useState<any>(null);
  const realtimeCallbackRef = useRef<any>({});
  const wsRef = useRef<WebSocket | null>(null);
  const holdersMapRef = useRef<Map<string, number>>(new Map());
  const positionsMapRef = useRef<Map<string, number>>(new Map());
  const devTokenIdsRef = useRef<Set<string>>(new Set());
  const [selectedBuyPreset, setSelectedBuyPreset] = useState(1);
  const [buySlippageValue, setBuySlippageValue] = useState('20');
  const [buyPriorityFee, setBuyPriorityFee] = useState('0.01');
  const [settingsMode, setSettingsMode] = useState<'buy' | 'sell'>('buy');
  const [selectedSellPreset, setSelectedSellPreset] = useState(1);
  const [sellSlippageValue, setSellSlippageValue] = useState('15');
  const [sellPriorityFee, setSellPriorityFee] = useState('0.005');
  const [notif, setNotif] = useState<({ title: string; subtitle?: string; variant?: 'success' | 'error' | 'info'; visible?: boolean }) | null>(null);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [page, _setPage] = useState(0);
  const [userStats, setUserStats] = useState({
    balance: 0, amountBought: 0, amountSold: 0,
    valueBought: 0, valueSold: 0, valueNet: 0,
  });
  const [positions, setPositions] = useState<any[]>([]);
  const [devTokens, setDevTokens] = useState<any[]>([]);
  const [topTraders, setTopTraders] = useState<Holder[]>([]);
  const topTradersMapRef = useRef<Map<string, number>>(new Map());
  const [advancedTradingEnabled, setAdvancedTradingEnabled] = useState(false);
  const [showAdvancedDropdown, setShowAdvancedDropdown] = useState(false);
  const [advancedOrders, setAdvancedOrders] = useState<Array<{
    id: string;
    type: 'takeProfit' | 'stopLoss' | 'devSell' | 'migration';
    percentage?: string;
    amount?: string;
  }>>([]);
  const [mobileActiveView, setMobileActiveView] = useState<'chart' | 'trades' | 'ordercenter'>('chart');
  const [mobileBuyAmounts, _setMobileBuyAmounts] = useState(['1', '5', '10', '50']);
  const [mobileSellPercents, _setMobileSellPercents] = useState(['10%', '25%', '50%', '100%']);
  const [mobileSelectedBuyAmount, setMobileSelectedBuyAmount] = useState('1');
  const [mobileSelectedSellPercent, setMobileSelectedSellPercent] = useState('25%');
  const [mobileQuickBuyPreset, setMobileQuickBuyPreset] = useState(1);
  const [mobileTradeType, setMobileTradeType] = useState<'buy' | 'sell'>('buy');
  const [mobileWalletsExpanded, setMobileWalletsExpanded] = useState(false);
  const [mobileWalletNames, setMobileWalletNames] = useState<{ [address: string]: string }>({});
  const [showUSD, setShowUSD] = useState(false);
  const { activechain } = useSharedContext();

  const routerAddress = settings.chainConfig[activechain]?.launchpadRouter;

  const buyPresets = {
    1: { slippage: '20', priority: '0.01' },
    2: { slippage: '15', priority: '0.02' },
    3: { slippage: '10', priority: '0.05' }
  };
  const sellPresets = {
    1: { slippage: '15', priority: '0.005' },
    2: { slippage: '12', priority: '0.01' },
    3: { slippage: '8', priority: '0.03' }
  };

  const userAddr = (address ?? account?.address ?? "");

  useEffect(() => {
    const storedWalletNames = localStorage.getItem('crystal_wallet_names');
    if (storedWalletNames) {
      try {
        setMobileWalletNames(JSON.parse(storedWalletNames));
      } catch (error) {
        console.error('Error loading wallet names:', error);
      }
    }
  }, []);

  const [top10HoldingPercentage, setTop10HoldingPercentage] = useState(0);

  const handleBuyPresetSelect = useCallback((preset: number) => {
    setSelectedBuyPreset(preset);
    setMobileQuickBuyPreset(preset);
    const presetValues = buyPresets[preset as keyof typeof buyPresets];
    setBuySlippageValue(presetValues.slippage);
    setBuyPriorityFee(presetValues.priority);
  }, []);

  const handleSellPresetSelect = useCallback((preset: number) => {
    setSelectedSellPreset(preset);
    const presetValues = sellPresets[preset as keyof typeof sellPresets];
    setSellSlippageValue(presetValues.slippage);
    setSellPriorityFee(presetValues.priority);
  }, []);

  const handleAdvancedOrderAdd = (orderType: 'takeProfit' | 'stopLoss' | 'devSell' | 'migration') => {
    if (advancedOrders.length >= 5) return;

    const newOrder = {
      id: `${orderType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: orderType,
      ...(orderType === 'migration'
        ? {}
        : orderType === 'devSell'
          ? { percentage: '0' }
          : { percentage: orderType === 'takeProfit' ? '+0' : '-0', amount: '0' }
      )
    };

    setAdvancedOrders(prev => [...prev, newOrder]);
    setShowAdvancedDropdown(false);
  };

  const handleAdvancedOrderRemove = (orderId: string) => {
    setAdvancedOrders(prev => prev.filter(order => order.id !== orderId));
  };
  const handleToggleCurrency = () => {
    setShowUSD(!showUSD);
  };
  const positionPopup = useCallback((percent: number) => {
    const input = sliderRef.current;
    const popup = popupRef.current;
    if (!input || !popup) return;

    const container = input.parentElement as HTMLElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const inputLeft = inputRect.left - containerRect.left;

    const thumbW = 10;
    const x = inputLeft + (percent / 100) * (inputRect.width - thumbW) + thumbW / 2;

    popup.style.left = `${x}px`;
    popup.style.transform = 'translateX(-50%)';
  }, []);

  const handleAdvancedOrderUpdate = (orderId: string, field: string, value: string) => {
    setAdvancedOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, [field]: value }
        : order
    ));
  };

  const handlePresetSelect = (preset: number) => {
    if (settingsMode === 'buy') {
      handleBuyPresetSelect(preset);
    } else {
      handleSellPresetSelect(preset);
    }
  };

  const getMobileWalletBalance = (address: string) => {
    const balances = walletTokenBalances[address];
    if (!balances) return 0;

    if (balances[settings.chainConfig[activechain || '']?.eth]) {
      return Number(balances[settings.chainConfig[activechain || '']?.eth]) / 10 ** Number(18);
    }
    return 0;
  };

  const getMobileWalletName = (address: string, index: number) => {
    return mobileWalletNames[address] || `Wallet ${index + 1}`;
  };

  const isMobileWalletActive = (privateKey: string) => {
    return activeWalletPrivateKey === privateKey;
  };

  const handleMobileSetActiveWallet = (privateKey: string) => {
    if (!isMobileWalletActive(privateKey) && setOneCTSigner) {
      localStorage.setItem('crystal_active_wallet_private_key', privateKey);
      setOneCTSigner(privateKey);

      if (refetch) {
        setTimeout(() => refetch(), 100);
      }
      if (terminalRefetch) {
        setTimeout(() => terminalRefetch(), 0);
      }
    }
  };

  const getCurrentMobileWalletMONBalance = () => {
    if (!activeWalletPrivateKey) return 0;

    const currentWallet = subWallets.find(w => w.privateKey === activeWalletPrivateKey);
    if (!currentWallet) return 0;

    return getMobileWalletBalance(currentWallet.address);
  };

  const handleMobileBuyTrade = async (amount: string) => {
    if (!account?.connected || !sendUserOperationAsync || !tokenAddress || !routerAddress) {
      if (setpopup) setpopup(4);
      return;
    }

    const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) {
      setChain();
      return;
    }

    const requestedAmount = parseFloat(amount);
    const currentMONBalance = getCurrentMobileWalletMONBalance();

    if (requestedAmount > currentMONBalance) {
      const txId = `insufficient-${Date.now()}`;
      if (showLoadingPopup) {
        showLoadingPopup(txId, {
          title: 'Insufficient Balance',
          subtitle: `Need ${amount} MON but only have ${currentMONBalance.toFixed(4)} MON`,
          amount: amount,
          amountUnit: 'MON'
        });
      }

      if (updatePopup) {
        setTimeout(() => {
          updatePopup(txId, {
            title: 'Insufficient Balance',
            subtitle: `You need ${amount} MON but only have ${currentMONBalance.toFixed(4)} MON available`,
            variant: 'error',
            isLoading: false
          });
        }, 100);
      }
      return;
    }

    const txId = `mobile-buy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      if (showLoadingPopup) {
        showLoadingPopup(txId, {
          title: 'Sending transaction...',
          subtitle: `Buying ${amount} MON worth of ${token.symbol}`,
          amount: amount,
          amountUnit: 'MON'
        });
      }

      const valNum = parseFloat(amount);
      const value = BigInt(Math.round(valNum * 1e18));

      const uo = {
        target: routerAddress,
        data: encodeFunctionData({
          abi: CrystalRouterAbi,
          functionName: "buy",
          args: [true, token.tokenAddress as `0x${string}`, value, 0n],
        }),
        value,
      };

      if (updatePopup) {
        updatePopup(txId, {
          title: 'Confirming transaction...',
          subtitle: `Buying ${amount} MON worth of ${token.symbol}`,
          variant: 'info'
        });
      }

      await sendUserOperationAsync({ uo });

      const expectedTokens = currentPrice > 0 ? parseFloat(amount) / currentPrice : 0;
      if (updatePopup) {
        updatePopup(txId, {
          title: `Bought ~${Number(expectedTokens).toFixed(4)} ${token.symbol}`,
          subtitle: `Spent ${Number(amount).toFixed(4)} MON`,
          variant: 'success',
          isLoading: false
        });
      }

    } catch (e: any) {
      console.error(e);
      const msg = String(e?.message ?? '');

      if (updatePopup) {
        updatePopup(txId, {
          title: msg.toLowerCase().includes('insufficient') ? 'Insufficient balance' : 'Transaction failed',
          subtitle: msg || 'Please try again.',
          variant: 'error',
          isLoading: false
        });
      }
    }
  };

  const handleSellPosition = async (position: any, monAmount: string) => {
    if (!account?.connected || !sendUserOperationAsync || !routerAddress) {
      setpopup?.(4);
      return;
    }

    const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) {
      setChain?.();
      return;
    }

    const txId = `sell-position-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      if (showLoadingPopup) {
        showLoadingPopup(txId, {
          title: 'Sending transaction...',
          subtitle: `Selling ${monAmount} ${position.symbol}`,
          amount: monAmount,
          amountUnit: position.symbol
        });
      }

      const amountTokenWei = BigInt(Math.round(parseFloat(monAmount) * 1e18));

      if (updatePopup) {
        updatePopup(txId, {
          title: 'Confirming sell...',
          subtitle: `Selling ${monAmount} ${position.symbol}`,
          variant: 'info'
        });
      }

      const sellUo = {
        target: routerAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: CrystalRouterAbi,
          functionName: "sell",
          args: [true, position.tokenId as `0x${string}`, amountTokenWei, 0n],
        }),
        value: 0n,
      };

      await sendUserOperationAsync({ uo: sellUo });

      const soldTokens = Number(amountTokenWei) / 1e18;
      const expectedMON = soldTokens * (position.lastPrice || 0);
      if (updatePopup) {
        updatePopup(txId, {
          title: `Sold ${Number(soldTokens).toFixed(4)} ${position.symbol}`,
          subtitle: `Received ≈ ${Number(expectedMON).toFixed(4)} MON`,
          variant: 'success',
          isLoading: false
        });
      }

    } catch (e: any) {
      console.error(e);
      if (updatePopup) {
        updatePopup(txId, {
          title: 'Sell failed',
          subtitle: e?.message || 'Transaction was rejected',
          variant: 'error',
          isLoading: false
        });
      }
    }
  };

  const handleMobileSellTrade = async (value: string) => {
    if (!account?.connected || !sendUserOperationAsync || !tokenAddress || !routerAddress) {
      setpopup?.(4);
      return;
    }

    const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) {
      setChain?.();
      return;
    }

    const txId = `mobile-sell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      if (showLoadingPopup) {
        showLoadingPopup(txId, {
          title: 'Sending transaction...',
          subtitle: `Selling ${value} of ${token.symbol}`,
          amount: value,
          amountUnit: '%'
        });
      }

      const pct = BigInt(parseInt(value.replace('%', ''), 10));
      const amountTokenWei = pct === 100n
        ? (walletTokenBalances?.[userAddr]?.[token.id] && walletTokenBalances?.[userAddr]?.[token.id] > 0n ? walletTokenBalances?.[userAddr]?.[token.id] - 1n : 0n)
        : ((walletTokenBalances?.[userAddr]?.[token.id] || 0n) * pct) / 100n;

      if (amountTokenWei <= 0n) {
        throw new Error(`Invalid sell amount`);
      }

      if (updatePopup) {
        updatePopup(txId, {
          title: 'Confirming sell...',
          subtitle: `Selling ${value} of ${token.symbol}`,
          variant: 'info'
        });
      }

      const sellUo = {
        target: routerAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: CrystalRouterAbi,
          functionName: "sell",
          args: [true, tokenAddress as `0x${string}`, amountTokenWei, 0n],
        }),
        value: 0n,
      };

      await sendUserOperationAsync({ uo: sellUo });

      const soldTokens = Number(amountTokenWei) / 1e18;
      const expectedMON = soldTokens * currentPrice;
      if (updatePopup) {
        updatePopup(txId, {
          title: `Sold ${Number(soldTokens).toFixed(4)} ${token.symbol}`,
          subtitle: `Received ≈ ${Number(expectedMON).toFixed(4)} MON`,
          variant: 'success',
          isLoading: false
        });
      }

    } catch (e: any) {
      console.error(e);
      if (updatePopup) {
        updatePopup(txId, {
          title: 'Sell failed',
          subtitle: e?.message || 'Transaction was rejected',
          variant: 'error',
          isLoading: false
        });
      }
    }
  };

  const baseDefaults: Token = {
    id: tokenAddress || "",
    tokenAddress: tokenAddress || "",
    name: "Unknown Token",
    symbol: "UNKNOWN",
    image: "",
    price: 0,
    marketCap: 0,
    change24h: 0,
    volume24h: 0,
    holders: 0,
    proTraders: 0,
    kolTraders: 0,
    sniperHolding: 0,
    devHolding: 0,
    bundleHolding: 0,
    insiderHolding: 0,
    top10Holding: 0,
    buyTransactions: 0,
    sellTransactions: 0,
    globalFeesPaid: 0,
    website: "",
    twitterHandle: "",
    progress: 0,
    status: "new",
    description: "",
    created: Math.floor(Date.now() / 1000),
    bondingAmount: 0,
    volumeDelta: 0,
    dev: "",
  };

  const baseToken: Token = (() => {
    const fromState = (tokenData ?? {}) as Partial<Token>;
    const t = tokenList.find(
      x => x.contractAddress === tokenAddress || x.tokenAddress === tokenAddress
    );

    if (t) {
      return {
        ...baseDefaults,
        id: (t.id || t.contractAddress) ?? baseDefaults.id,
        tokenAddress: (t.contractAddress || t.tokenAddress) ?? baseDefaults.tokenAddress,
        name: t.name,
        symbol: t.symbol,
        image: t.image,
      };
    }

    return { ...baseDefaults, ...fromState };
  })();

  const token: Token = { ...baseToken, ...live } as Token;
  const currentPrice = token.price || 0;

  const getCurrentMONBalance = useCallback(() => {
    if (!account?.address) return 0;

    const balances = walletTokenBalances[account.address];
    if (!balances) return 0;

    const ethToken = settings.chainConfig[activechain]?.eth;
    if (ethToken && balances[ethToken]) {
      return Number(balances[ethToken]) / 1e18;
    }
    return 0;
  }, [account?.address, walletTokenBalances, activechain]);

  const getCurrentTokenBalance = useCallback(() => {
    if (!account?.address || !token.id) return 0;
    const balance = walletTokenBalances[account.address]?.[token.id];
    return balance ? Number(balance) / 1e18 : 0;
  }, [account?.address, walletTokenBalances, token.id]);
  const pushRealtimeTick = useCallback(
    (lastPrice: number, volNative: number) => {
      if (!lastPrice || lastPrice <= 0) return;

      const resSecs = RESOLUTION_SECS[selectedInterval] ?? 60;
      const now = Date.now();
      const bucketMs = Math.floor(now / (resSecs * 1000)) * resSecs * 1000;

      const seriesKey = toSeriesKey(token.symbol, selectedInterval);
      const cb = realtimeCallbackRef.current?.[seriesKey];

      setChartData((prev: any) => {
        if (!prev || !Array.isArray(prev) || prev.length < 2) return prev;
        const [bars, key, flag] = prev;

        const updated = Array.isArray(bars) ? [...bars] : [];
        const last = updated[updated.length - 1];
        const prevBar = updated[updated.length - 2];
        const prevClose = prevBar?.close ?? last?.close ?? lastPrice;

        if (!last || typeof last.time !== "number" || last.time < bucketMs) {
          const open = prevClose;
          const high = Math.max(open, lastPrice);
          const low = Math.min(open, lastPrice);

          const newBar = {
            time: bucketMs,
            open,
            high,
            low,
            close: lastPrice,
            volume: volNative || 0,
          };

          updated.push(newBar);
          if (typeof cb === "function") cb(newBar);
        } else {
          const cur = { ...last };

          cur.open = prevClose;
          if (cur.high < cur.open) cur.high = cur.open;
          if (cur.low > cur.open) cur.low = cur.open;

          cur.high = Math.max(cur.high, lastPrice);
          cur.low = Math.min(cur.low, lastPrice);
          cur.close = lastPrice;
          cur.volume = (cur.volume || 0) + (volNative || 0);

          updated[updated.length - 1] = cur;
          if (typeof cb === "function") cb(cur);
        }

        if (updated.length > 1200) updated.splice(0, updated.length - 1200);
        return [updated, key, flag];
      });
    },
    [selectedInterval, token.symbol]
  );

  useEffect(() => {
    if (!trades.length) return;
    const t = trades[0];
    pushRealtimeTick(t.price, t.nativeAmount);
  }, [trades, pushRealtimeTick]);

  // metadata n klines
  useEffect(() => {
    if (!token.id) return;
    let isCancelled = false;

    const fetchMemeTokenData = async () => {
      try {
        const response = await fetch(SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query: `
            query ($id: ID!) {
              launchpadTokens: launchpadTokens(where: { id: $id }) {
                lastPriceNativePerTokenWad
                volumeNative
                buyTxs
                sellTxs
                name
                symbol
                metadataCID
                creator {
                  id
                }
                timestamp
                trades(first: 50, orderBy: block, orderDirection: desc) {
                  id
                  account {id}
                  block
                  isBuy
                  priceNativePerTokenWad
                  amountIn
                  amountOut
                }
                series: ${'series' + (selectedInterval === '1m' ? '60' :
                selectedInterval === '5m' ? '300' :
                  selectedInterval === '15m' ? '900' :
                    selectedInterval === '1h' ? '3600' :
                      selectedInterval === '4h' ? '14400' :
                        '86400')} {
                  klines(first: 1000, orderBy: time, orderDirection: desc) {
                    time open high low close baseVolume
                  }
                }
              }
            }`,
            variables: {
              id: token.id.toLowerCase(),
            }
          }),
        });

        const data = (await response.json())?.data;
        if (isCancelled || !data) return;

        if (data.launchpadTokens?.length) {
          const m = data.launchpadTokens[0];

          let imageUrl = token.image || '';
          if (m.metadataCID && !imageUrl) {
            try {
              const metaRes = await fetch(m.metadataCID);
              if (metaRes.ok) {
                const meta = await metaRes.json();
                imageUrl = meta.image || '';
              }
            } catch (e) {
              console.warn('Failed to load metadata for token:', token.id, e);
            }
          }

          const updatedTokenData = {
            ...token,
            name: m.name || token.name || "Unknown Token",
            symbol: m.symbol || token.symbol || "UNKNOWN",
            image: imageUrl,
            dev: m.creator.id || "",
            price: Number(m.lastPriceNativePerTokenWad || 0) / 1e18,
            marketCap: (Number(m.lastPriceNativePerTokenWad || 0) / 1e18) * TOTAL_SUPPLY,
            volume24h: Number(m.volumeNative || 0) / 1e18,
            buyTransactions: Number(m.buyTxs || 0),
            sellTransactions: Number(m.sellTxs || 0),
            created: m.timestamp,
          };

          setLive(p => ({
            ...p,
            name: updatedTokenData.name,
            symbol: updatedTokenData.symbol,
            image: updatedTokenData.image,
            dev: updatedTokenData.dev,
            price: updatedTokenData.price,
            marketCap: updatedTokenData.marketCap,
            volume24h: updatedTokenData.volume24h,
            buyTransactions: updatedTokenData.buyTransactions,
            sellTransactions: updatedTokenData.sellTransactions,
          }));

          setTokenData(updatedTokenData);
        }

        if (data.launchpadTokens?.[0]?.trades?.length) {
          const mapped = data.launchpadTokens[0].trades.map((t: any) => ({
            id: t.id,
            timestamp: Number(t.block),
            isBuy: t.isBuy,
            price: Number(t.priceNativePerTokenWad) / 1e18,
            tokenAmount: Number(t.isBuy ? t.amountOut : t.amountIn) / 1e18,
            nativeAmount: Number(t.isBuy ? t.amountIn : t.amountOut) / 1e18,
            caller: t.account.id,
          }));

          setTrades(mapped);
        } else {
          setTrades([]);
        }

        if (data.launchpadTokens?.[0]?.series?.klines) {
          const bars = data.launchpadTokens[0].series.klines
            .slice()
            .reverse()
            .map((c: any) => ({
              time: Number(c.time) * 1000,
              open: Number(c.open) / 1e18,
              high: Number(c.high) / 1e18,
              low: Number(c.low) / 1e18,
              close: Number(c.close) / 1e18,
              volume: Number(c.baseVolume) / 1e18,
            }));

          const key =
            (data.launchpadTokens[0].symbol || token.symbol) +
            "MON" +
            (selectedInterval === "1d"
              ? "1D"
              : selectedInterval === "4h"
                ? "240"
                : selectedInterval === "1h"
                  ? "60"
                  : selectedInterval.slice(0, -1));

          setChartData([bars, key, false]);
        }

      } catch (e) {
        console.error('Error fetching token data:', e);
        setLive(p => ({
          ...p,
          price: 0,
          marketCap: 0,
          volume24h: 0,
          buyTransactions: 0,
          sellTransactions: 0
        }));
        setTrades([]);
        setChartData(null);
      }
    };

    fetchMemeTokenData();
    return () => { isCancelled = true; };
  }, [token.id, selectedInterval, setTokenData, token.name, token.symbol, token.image, token.dev]);

  const lastInvalidateRef = useRef(0);

  const closeNotif = useCallback(() => {
    setNotif((prev) => (prev ? { ...prev, visible: false } : prev));
    setTimeout(() => setNotif(null), 300);
  }, []);

  const addDevTokenFromEvent = useCallback(async (log: any) => {
    let args: any;
    try {
      const decoded = decodeEventLog({
        abi: CrystalRouterAbi,
        data: log.data,
        topics: log.topics,
      }) as any;
      args = decoded.args || {};
    } catch (e) {
      console.error("failed to decode MARKET_CREATED_EVENT", e);
      return;
    }

    const tokenId = String(args.token || "").toLowerCase();
    const creator = String(args.creator || "").toLowerCase();

    if (!token.dev || creator !== String(token.dev).toLowerCase()) return;

    if (devTokenIdsRef.current.has(tokenId)) return;

    let imageUrl = "";
    try {
      if (args.metadataCID) {
        const r = await fetch(args.metadataCID);
        if (r.ok) {
          const meta = await r.json();
          imageUrl = meta?.image || "";
        }
      }
    } catch { }

    const symbol = String(args.symbol || "").toUpperCase();
    const name = String(args.name || symbol || tokenId.slice(0, 6));

    const initialPrice = 0;
    const newDev: any = {
      id: tokenId,
      symbol,
      name,
      imageUrl,
      price: initialPrice,
      marketCap: initialPrice * TOTAL_SUPPLY,
      timestamp: Math.floor(Date.now() / 1000),
      migrated: false,
    };

    setDevTokens(prev => {
      if (prev.some(t => String(t.id).toLowerCase() === tokenId)) return prev;
      const updated = [newDev, ...prev];
      devTokenIdsRef.current = new Set(updated.map(t => String(t.id || "").toLowerCase()));
      return updated;
    });
  }, [setDevTokens, token.dev]);

  // ws manager
  useEffect(() => {
    if (!token.id) return;
    const ws = new WebSocket(settings.chainConfig[activechain].wssurl);
    wsRef.current = ws;

    const sendSub = (params: any) => {
      ws.send(JSON.stringify({
        id: Date.now(),
        jsonrpc: "2.0",
        method: "eth_subscribe",
        params
      }));
    };

    ws.onopen = () => {
      sendSub(["logs", { address: token.id }]);
      sendSub(["logs", { address: settings.chainConfig[activechain].router, topics: [[MARKET_CREATED_EVENT, MARKET_UPDATE_EVENT]] }]);

      if (tokenAddress) {
        sendSub(["logs", { address: tokenAddress, topics: [[TRANSFER_TOPIC]] }]);
      }
    };

    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data);
      if (msg?.method !== "eth_subscription") return;
      const log = msg.params?.result;
      if (!log?.topics?.length) return;

      if (log.topics[0] === MARKET_UPDATE_EVENT) {
        const tokenAddr = `0x${log.topics[1].slice(26)}`.toLowerCase();
        const callerAddr = `0x${log.topics[2].slice(26)}`.toLowerCase();

        const hex = log.data.startsWith('0x') ? log.data.slice(2) : log.data;
        const word = (i: number) => BigInt('0x' + hex.slice(i * 64, i * 64 + 64));

        const isBuy = word(0) !== 0n;
        const inputAmountWei = word(1);
        const outputAmountWei = word(2);
        const vNativeWei = word(3);
        const vTokenWei = word(4);

        const toNum = (x: bigint) => Number(x) / 1e18;

        const amountIn = toNum(inputAmountWei);
        const amountOut = toNum(outputAmountWei);
        const vNative = Number(vNativeWei);
        const vToken = Number(vTokenWei);

        const price = vToken === 0 ? 0 : (vNative / vToken);
        const tradePrice = (isBuy ? amountIn / amountOut : amountOut / amountIn) || 0;

        if (tokenAddress && tokenAddr === tokenAddress.toLowerCase()) {
          setLive((p) => ({
            ...p,
            price,
            marketCap: price * TOTAL_SUPPLY,
            buyTransactions: (p.buyTransactions || 0) + (isBuy ? 1 : 0),
            sellTransactions: (p.sellTransactions || 0) + (isBuy ? 0 : 1),
            volume24h: (p.volume24h || 0) + (isBuy ? amountIn : amountOut),
          }));

          setTrades((prev) => [
            {
              id: `${log.transactionHash}-${log.logIndex}`,
              timestamp: Date.now() / 1000,
              isBuy,
              price: tradePrice,
              nativeAmount: isBuy ? amountIn : amountOut,
              tokenAmount: isBuy ? amountOut : amountIn,
              caller: `0x${log.topics[2].slice(26)}`,
            },
            ...prev.slice(0, 99),
          ]);
          setTokenData((prev: any) => ({
            ...prev,
            price: price,
            marketCap: price * TOTAL_SUPPLY,
          }));
          pushRealtimeTick(tradePrice, isBuy ? amountIn : amountOut);

          setHolders((prev) => {
            const copy = [...prev];
            let idx = holdersMapRef.current.get(callerAddr) ?? -1;

            if (idx === -1) {
              const newRow: Holder = {
                address: `0x${log.topics[2].slice(26)}`,
                balance: 0,
                tokenNet: 0,
                valueNet: 0,
                amountBought: 0,
                amountSold: 0,
                valueBought: 0,
                valueSold: 0,
              };
              copy.push(newRow);
              idx = copy.length - 1;
              holdersMapRef.current.set(callerAddr, idx);
            }

            const row = { ...copy[idx] };
            if (isBuy) {
              row.amountBought += amountOut;
              row.valueBought += amountIn;
              row.balance += amountOut;
            } else {
              row.amountSold += amountIn;
              row.valueSold += amountOut;
              row.balance = Math.max(0, row.balance - amountIn);
            }
            row.tokenNet = row.amountBought - row.amountSold;
            row.valueNet = (row.valueSold - row.valueBought) + (row.balance * price);

            copy[idx] = row;

            const topSum = copy
              .map((h) => Math.max(0, h.balance))
              .sort((a, b) => b - a)
              .slice(0, 10)
              .reduce((s, n) => s + n, 0);
            const pct = (topSum / TOTAL_SUPPLY) * 100;
            setTop10HoldingPercentage(pct);

            return copy;
          });

          setTopTraders((prev) => {
            const copy = Array.isArray(prev) ? [...prev] : [];
            const key = callerAddr;
            let idx = topTradersMapRef.current.get(key) ?? -1;

            if (idx === -1) {
              const row: Holder = {
                address: `0x${log.topics[2].slice(26)}`,
                balance: 0,
                tokenNet: 0,
                valueNet: 0,
                amountBought: 0,
                amountSold: 0,
                valueBought: 0,
                valueSold: 0,
              };
              copy.push(row);
              idx = copy.length - 1;
              topTradersMapRef.current.set(key, idx);
            }

            const row = { ...copy[idx] };

            if (isBuy) {
              row.amountBought += amountOut;
              row.valueBought += amountIn;
              row.balance += amountOut;
            } else {
              row.amountSold += amountIn;
              row.valueSold += amountOut;
              row.balance = Math.max(0, row.balance - amountIn);
            }

            row.tokenNet = row.amountBought - row.amountSold;
            row.valueNet = (row.valueSold - row.valueBought) + (row.balance * (price || 0));

            copy[idx] = row;

            copy.sort((a, b) => (b.valueNet - a.valueNet));
            if (copy.length > 300) {
              const removed = copy.splice(300);
              for (const r of removed) topTradersMapRef.current.delete((r.address || '').toLowerCase());
            }
            copy.forEach((r, i) => topTradersMapRef.current.set((r.address || '').toLowerCase(), i));

            return copy;
          });
        }

        if (callerAddr == userAddr.toLowerCase()) {
          setPositions((prev) => {
            const copy = Array.isArray(prev) ? [...prev] : [];
            let idx = positionsMapRef.current.get(tokenAddr);

            if (idx === undefined) {
              const isCurrent = tokenAddress && tokenAddr === tokenAddress.toLowerCase();

              const newPos = {
                tokenId: isCurrent ? token.id : tokenAddr,
                symbol: isCurrent ? token.symbol : (copy.find(p => (p.tokenId || '').toLowerCase() === tokenAddr)?.symbol || ''),
                name: isCurrent ? token.name : (copy.find(p => (p.tokenId || '').toLowerCase() === tokenAddr)?.name || ''),
                imageUrl: isCurrent ? (token.image || '') : '',
                metadataCID: '',
                boughtTokens: 0,
                soldTokens: 0,
                spentNative: 0,
                receivedNative: 0,
                remainingTokens: 0,
                remainingPct: 0,
                pnlNative: 0,
                lastPrice: price,
              };

              copy.push(newPos);
              idx = copy.length - 1;
              positionsMapRef.current.set(tokenAddr, idx);
            }

            const pos = { ...copy[idx!] };
            pos.lastPrice = price;

            if (isBuy) {
              pos.boughtTokens += amountOut;
              pos.spentNative += amountIn;
              pos.remainingTokens += amountOut;
            } else {
              pos.soldTokens += amountIn;
              pos.receivedNative += amountOut;
              pos.remainingTokens = Math.max(0, pos.remainingTokens - amountIn);
            }

            pos.remainingPct = pos.boughtTokens > 0 ? (pos.remainingTokens / pos.boughtTokens) * 100 : 0;

            const balance = pos.remainingTokens;
            const realized = pos.receivedNative - pos.spentNative;
            const unrealized = balance * (pos.lastPrice || 0);
            pos.pnlNative = realized + unrealized;

            copy[idx!] = pos;

            if (tokenAddress && tokenAddr === tokenAddress.toLowerCase()) {
              const markToMarket = balance * (pos.lastPrice || 0);
              const totalPnL = (pos.receivedNative + markToMarket) - pos.spentNative;

              setUserStats({
                balance,
                amountBought: pos.boughtTokens,
                amountSold: pos.soldTokens,
                valueBought: pos.spentNative,
                valueSold: pos.receivedNative,
                valueNet: totalPnL,
              });
            }

            return copy;
          });
        }

        if (devTokenIdsRef.current.has(tokenAddr)) {
          setDevTokens((prev) => {
            const updated = prev.map((t) => {
              if ((t.id || '').toLowerCase() !== tokenAddr) return t;
              const next = { ...t };
              next.price = price;
              next.marketCap = price * TOTAL_SUPPLY;
              next.timestamp = Date.now() / 1000;
              return next;
            });
            devTokenIdsRef.current = new Set(updated.map((t) => (t.id || '').toLowerCase()));
            return updated;
          });
        }

        return;
      }

      if (log.topics[0] === MARKET_CREATED_EVENT) {
        addDevTokenFromEvent(log);
        return;
      }

      if (
        tokenAddress &&
        log.address?.toLowerCase() === tokenAddress.toLowerCase() &&
        log.topics[0] === TRANSFER_TOPIC &&
        address
      ) {
        const walletTopic = "0x" + address.slice(2).padStart(64, "0");
        const involvesWallet = log.topics[1] === walletTopic || log.topics[2] === walletTopic;
        if (involvesWallet) {
          const now = Date.now();
          if (now - lastInvalidateRef.current > 800) {
            lastInvalidateRef.current = now;
            terminalRefetch();
          }
        }
      }
    };

    return () => {
      try { ws.close(); } catch { }
    };
  }, [token.id, tokenAddress, address, terminalRefetch]);

  // holders
  useEffect(() => {
    if (!token.id) return;

    (async () => {
      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: HOLDERS_QUERY,
          variables: {
            m: (token.id || '').toLowerCase(),
            skip: page * PAGE_SIZE,
            first: PAGE_SIZE,
          },
        }),
      });

      const { data } = await response.json();

      if (data?.top10) {
        const top10TotalBalance = data.top10.reduce((sum: number, r: any) => sum + Number(r.remainingTokens) / 1e18, 0);
        const top10Percentage = (top10TotalBalance / TOTAL_SUPPLY) * 100;
        setTop10HoldingPercentage(top10Percentage);
      }

      const positions: any[] = data?.launchpadPositions ?? [];
      const lastNative = Number(data?.launchpadTokens?.[0]?.lastPriceNativePerTokenWad ?? 0) / 1e18;

      const mapped: Holder[] = positions.map((p: any) => {
        const amountBought = Number(p.tokenBought) / 1e18;
        const amountSold = Number(p.tokenSold) / 1e18;
        const valueBought = Number(p.nativeSpent) / 1e18;
        const valueSold = Number(p.nativeReceived) / 1e18;

        const balance = amountBought - amountSold;
        const realized = valueSold - valueBought;
        const unrealized = balance * lastNative;
        const totalPnl = realized + unrealized;

        return {
          address: p.account.id,
          balance,
          amountBought,
          amountSold,
          valueBought,
          valueSold,
          tokenNet: balance,
          valueNet: totalPnl,
        };
      });

      setHolders(mapped);
      holdersMapRef.current = new Map(mapped.map((h: Holder, i: number) => [h.address.toLowerCase(), i]));
    })();
  }, [token.id, page]);

  // dev tokens
  useEffect(() => {
    if (!token.dev) return;
    let cancelled = false;

    (async () => {
      const out: any[] = [];
      let skip = 0;

      while (true) {
        const res = await fetch(SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query: DEV_TOKENS_QUERY,
            variables: { d: token.dev.toLowerCase(), skip, first: PAGE_SIZE },
          }),
        });

        const { data } = await res.json();
        const rows: any[] = data?.launchpadTokens ?? [];
        if (!rows.length) break;

        for (const t of rows) {
          let imageUrl = '';
          if (t.metadataCID) {
            try {
              const metaRes = await fetch(t.metadataCID);
              if (metaRes.ok) {
                const meta = await metaRes.json();
                imageUrl = meta.image || '';
              }
            } catch { }
          }

          const price = Number(t.lastPriceNativePerTokenWad || 0) / 1e18;
          out.push({
            id: t.id,
            symbol: t.symbol,
            name: t.name,
            imageUrl,
            price,
            marketCap: price * TOTAL_SUPPLY,
            timestamp: Number(t.timestamp ?? 0),
            status: t.migrated,
          });
        }

        if (rows.length < PAGE_SIZE) break;
        skip += PAGE_SIZE;
        if (cancelled) return;
      }

      if (!cancelled) {
        setDevTokens(out);
        devTokenIdsRef.current = new Set(out.map((t) => (t.id || '').toLowerCase()));
      }
    })();

    return () => { cancelled = true; };
  }, [token.dev, token.id]);

  // top traders
  useEffect(() => {
    if (!token.id) return;
    setTerminalToken(token.id);
    let cancelled = false;

    (async () => {
      const out: Holder[] = [];
      let skip = 0;
      const first = PAGE_SIZE;
      const since = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

      while (true) {
        const res = await fetch(SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query: TOP_TRADERS_QUERY,
            variables: {
              m: (token.id || '').toLowerCase(),
              since: String(since),
              skip,
              first,
            },
          }),
        });


        const { data } = await res.json();
        const rows: any[] = data?.launchpadPositions ?? [];
        if (!rows.length) break;

        for (const p of rows) {
          const amountBought = Number(p.tokenBought) / 1e18;
          const amountSold = Number(p.tokenSold) / 1e18;
          const valueBought = Number(p.nativeSpent) / 1e18;
          const valueSold = Number(p.nativeReceived) / 1e18;

          const balance = amountBought - amountSold;
          const realized = Number(p.realizedPnlNative) / 1e18;
          const unrealized = Number(p.unrealizedPnlNative) / 1e18;
          const pnl = realized + unrealized;

          out.push({
            address: p.account.id,
            balance,
            tokenNet: amountBought - amountSold,
            valueNet: pnl,
            amountBought,
            amountSold,
            valueBought,
            valueSold,
          });
        }

        if (rows.length < first) break;
        skip += first;
        if (cancelled) return;
      }

      if (!cancelled) {
        out.sort((a, b) => (b.valueNet - a.valueNet));
        const trimmed = out.slice(0, 100);
        setTopTraders(trimmed);
        topTradersMapRef.current = new Map(trimmed.map((t, i) => [t.address.toLowerCase(), i]));
      }
    })();

    return () => { cancelled = true; };
  }, [token.id]);

  // positions
  useEffect(() => {
    if (!userAddr) return;
    let cancelled = false;

    (async () => {
      const totals = {
        balance: 0,
        amountBought: 0,
        amountSold: 0,
        valueBought: 0,
        valueSold: 0,
        lastPriceNative: 0,
      };

      const all: any[] = [];
      let skip = 0;

      while (true) {
        const response = await fetch(SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query: POSITIONS_QUERY,
            variables: {
              a: (userAddr || '').toLowerCase(),
              skip,
              first: PAGE_SIZE,
            },
          }),
        });

        const { data } = await response.json();
        const rows: any[] = data?.launchpadPositions ?? [];
        if (!rows.length) break;

        for (const p of rows) {
          const boughtTokens = Number(p.tokenBought) / 1e18;
          const soldTokens = Number(p.tokenSold) / 1e18;
          const spentNative = Number(p.nativeSpent) / 1e18;
          const receivedNative = Number(p.nativeReceived) / 1e18;
          const remainingTokens = boughtTokens - soldTokens;
          const lastPrice = Number(p?.token?.lastPriceNativePerTokenWad ?? 0) / 1e18;
          const balance = boughtTokens - soldTokens
          const realized = receivedNative - spentNative;
          const lastNative = lastPrice;
          const unrealized = balance * lastNative;
          const pnlNative = realized + unrealized;
          const remainingPct = boughtTokens > 0 ? (remainingTokens / boughtTokens) * 100 : 0;

          if (p.token.id == tokenAddress) {
            totals.amountBought += boughtTokens;
            totals.amountSold += soldTokens;
            totals.valueBought += spentNative;
            totals.valueSold += receivedNative;
            totals.balance += remainingTokens;
            totals.lastPriceNative = lastPrice || totals.lastPriceNative;
          }

          let imageUrl = '';
          if (p.token.metadataCID) {
            try {
              const metaRes = await fetch(p.token.metadataCID);
              if (metaRes.ok) {
                const meta = await metaRes.json();
                imageUrl = meta.image || '';
              }
            } catch (e) {
              console.warn('Failed to load metadata for token', p.token.id, e);
            }
          }

          all.push({
            tokenId: p.token.id,
            symbol: p.token.symbol,
            name: p.token.name,
            metadataCID: p.token.metadataCID,
            imageUrl: imageUrl,
            boughtTokens,
            soldTokens,
            spentNative,
            receivedNative,
            remainingTokens,
            remainingPct,
            pnlNative,
            lastPrice,
          });
        }

        if (rows.length < PAGE_SIZE) break;
        skip += PAGE_SIZE;
        if (cancelled) return;
      }

      if (cancelled) return;

      const markToMarket = totals.balance * (totals.lastPriceNative || 0);
      const totalPnL = (totals.valueSold + markToMarket) - totals.valueBought;

      const sorted = all.sort((a, b) => b.remainingTokens - a.remainingTokens);
      setPositions(sorted);
      positionsMapRef.current = new Map(sorted.map((p, i) => [String(p.tokenId).toLowerCase(), i]));

      setUserStats({
        balance: totals.balance,
        amountBought: totals.amountBought,
        amountSold: totals.amountSold,
        valueBought: totals.valueBought,
        valueSold: totals.valueSold,
        valueNet: totalPnL,
      });
    })();

    return () => { cancelled = true; };
  }, [userAddr]);

  useEffect(() => {
    if (tradeAmount && tradeAmount !== "" && tradeAmount !== "0" && currentPrice && currentPrice > 0) {
      setIsQuoteLoading(true);
    }

    const id = setTimeout(() => {
      if (!tradeAmount || tradeAmount === "" || !currentPrice || currentPrice === 0) {
        setQuoteValue(undefined);
        setIsQuoteLoading(false);
        return;
      }

      const amt = parseFloat(tradeAmount);

      if (isNaN(amt) || amt <= 0) {
        setQuoteValue(undefined);
        setIsQuoteLoading(false);
        return;
      }

      let converted = 0;

      if (activeTradeType === "buy") {
        if (inputCurrency === "MON") {
          converted = amt / currentPrice;
        } else {
          converted = amt * currentPrice;
        }
      } else {
        if (inputCurrency === "TOKEN") {
          converted = amt * currentPrice;
        } else {
          converted = amt / currentPrice;
        }
      }

      setQuoteValue(converted);
      setIsQuoteLoading(false);
    }, 400);

    return () => clearTimeout(id);
  }, [tradeAmount, currentPrice, activeTradeType, inputCurrency]);

  useEffect(() => {
    if (activeTradeType === 'sell') {
      setInputCurrency('TOKEN')
    }
  }, [activeTradeType])

  const formatNumberWithCommas = fmt;
  const formatVolume = (n: number) =>
    n >= 1e6
      ? `$${(n / 1e6).toFixed(1)}M`
      : n >= 1e3
        ? `$${(n / 1e3).toFixed(1)}K`
        : `$${n.toFixed(0)}`;

  const handleTrade = async () => {
    if (!tradeAmount || !account.connected) return;
    if (activeOrderType === "Limit" && !limitPrice) return;

    const targetChainId = settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) {
      setChain();
      return;
    }

    const txId = `meme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      setIsSigning(true);

      if (activeTradeType === "buy") {
        if (showLoadingPopup) {
          showLoadingPopup(txId, {
            title: 'Sending transaction...',
            subtitle: `Buying ${tradeAmount} ${inputCurrency} worth of ${token.symbol}`,
            amount: tradeAmount,
            amountUnit: inputCurrency
          });
        }

        const valNum =
          inputCurrency === "MON"
            ? parseFloat(tradeAmount)
            : parseFloat(tradeAmount) * currentPrice;
        const value = BigInt(Math.round(valNum * 1e18));

        const uo = {
          target: routerAddress,
          data: encodeFunctionData({
            abi: CrystalRouterAbi,
            functionName: "buy",
            args: [true, token.tokenAddress as `0x${string}`, value, 0n],
          }),
          value,
        };

        if (updatePopup) {
          updatePopup(txId, {
            title: 'Confirming transaction...',
            subtitle: `Buying ${tradeAmount} ${inputCurrency} worth of ${token.symbol}`,
            variant: 'info'
          });
        }

        await sendUserOperationAsync({ uo });

        if (updatePopup) {
          updatePopup(txId, {
            title: `Bought ~${Number(quoteValue ?? 0).toFixed(4)} ${token.symbol}`,
            subtitle: `Spent ${Number(tradeAmount).toFixed(4)} ${inputCurrency}`,
            variant: 'success',
            isLoading: false

          });
        }
        terminalRefetch()
      } else {
        if (showLoadingPopup) {
          showLoadingPopup(txId, {
            title: 'Sending transaction...',
            subtitle: `Selling ${tradeAmount} ${token.symbol}`,
            amount: tradeAmount,
            amountUnit: token.symbol
          });
        }

        let amountTokenWei: bigint;
        let monAmountWei: bigint;
        let isExactInput: boolean;

        if (inputCurrency === "TOKEN") {
          amountTokenWei = BigInt(Math.round(parseFloat(tradeAmount) * 1e18));
          isExactInput = true;
          monAmountWei = 0n;
        } else {
          monAmountWei = BigInt(Math.round(parseFloat(tradeAmount) * 1e18));
          amountTokenWei = BigInt(Math.round(Number(walletTokenBalances?.[userAddr]?.[token.id])));
          isExactInput = false;
        }
        if (updatePopup) {
          updatePopup(txId, {
            title: 'Confirming sell...',
            subtitle: `Selling ${tradeAmount} ${token.symbol}`,
            variant: 'info'
          });
        }

        const sellUo = {
          target: routerAddress as `0x${string}`,
          data: encodeFunctionData({
            abi: CrystalRouterAbi,
            functionName: "sell",
            args: [isExactInput, tokenAddress as `0x${string}`, amountTokenWei, monAmountWei],
          }),
          value: 0n,
        };

        await sendUserOperationAsync({ uo: sellUo });

        if (updatePopup) {
          updatePopup(txId, {
            title: `Sold ${Number(tradeAmount).toFixed(4)} ${token.symbol}`,
            subtitle: `Received ≈ ${Number(quoteValue ?? 0).toFixed(4)} MON`,
            variant: 'success',
            isLoading: false
          });
        }
        terminalRefetch()
      }

      setTradeAmount("");
      setLimitPrice("");
      setSliderPercent(0);
    } catch (e: any) {
      console.error(e);
      const msg = String(e?.message ?? '');

      if (updatePopup) {
        updatePopup(txId, {
          title: msg.toLowerCase().includes('insufficient') ? 'Insufficient balance' : 'Transaction failed',
          subtitle: msg || 'Please try again.',
          variant: 'error',
          isLoading: false
        });
      }
    } finally {
      setIsSigning(false);
    }
  };

  const getButtonText = () => {
    if (!account.connected) return "Connect Wallet";
    const targetChainId =
      settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId)
      return `Switch to ${settings.chainConfig[activechain]?.name || "Monad"}`;
    if (activeOrderType === "market")
      return `${activeTradeType === "buy" ? "Buy" : "Sell"} ${token.symbol}`;
    return `Set ${activeTradeType === "buy" ? "Buy" : "Sell"} Limit`;
  };

  const isTradeDisabled = () => {
    if (!account.connected) return false;
    const targetChainId =
      settings.chainConfig[activechain]?.chainId || activechain;
    if (account.chainId !== targetChainId) return false;
    if (isSigning) return true;
    if (!tradeAmount) return true;
    if (activeOrderType === "Limit" && !limitPrice) return true;
    return false;
  };

  const monUsdPrice = usdPer(ethticker || wethticker) || usdPer(wethticker || ethticker) || 0;
  const timePeriodsData = {
    "24H": {
      change: token.change24h || 0,
      volume: token.volume24h || 0,
      buyTransactions: token.buyTransactions || 0,
      sellTransactions: token.sellTransactions || 0,
      buyVolumePercentage: 65,
      sellVolumePercentage: 35,
      buyerPercentage: 70,
      sellerPercentage: 30,
    },
  };
  const currentData = timePeriodsData["24H"];
  const totalTraders = (token.holders || 0) + (token.proTraders || 0) + (token.kolTraders || 0);
  const buyVolume = (currentData.volume * currentData.buyVolumePercentage) / 100;
  const sellVolume = (currentData.volume * currentData.sellVolumePercentage) / 100;
  const buyers = Math.floor((totalTraders * currentData.buyerPercentage) / 100);
  const sellers = Math.floor(
    (totalTraders * currentData.sellerPercentage) / 100,
  );

  return (
    <div className="meme-interface-container">
      {notif && (
        <div className={`meme-notif-popup ${notif.variant || 'info'}${notif.visible === false ? ' hide' : ''}`}
          style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, minWidth: 260 }}>
          <div className="meme-notif-content">
            <div className="meme-notif-title">{notif.title}</div>
            {notif.subtitle && <div className="meme-notif-subtitle">{notif.subtitle}</div>}
          </div>
          <button className="meme-notif-close" onClick={closeNotif} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', position: 'absolute', top: 8, right: 8 }}>&times;</button>
        </div>
      )}

      <div className="meme-mobile-view-toggle">
        <div
          className="meme-mobile-toggle-slider"
          style={{
            transform: `translateX(${getSliderPosition(mobileActiveView) * 100}%)`
          }}
        />
        <button
          className={`meme-mobile-toggle-btn ${mobileActiveView === 'chart' ? 'active' : ''}`}
          onClick={() => setMobileActiveView('chart')}
        >
          Chart
        </button>
        <button
          className={`meme-mobile-toggle-btn ${mobileActiveView === 'trades' ? 'active' : ''}`}
          onClick={() => setMobileActiveView('trades')}
        >
          Trades
        </button>
        <button
          className={`meme-mobile-toggle-btn ${mobileActiveView === 'ordercenter' ? 'active' : ''}`}
          onClick={() => setMobileActiveView('ordercenter')}
        >
          Orders
        </button>
      </div>

      <div className="memechartandtradesandordercenter">
        <div className="memecharttradespanel">
          <div className={`meme-chart-container ${mobileActiveView !== 'chart' ? 'mobile-hidden' : ''}`}>
            <MemeChart
              token={token}
              data={chartData}
              selectedInterval={selectedInterval}
              setSelectedInterval={setSelectedInterval}
              realtimeCallbackRef={realtimeCallbackRef}
            />
          </div>
          <div className={`meme-trades-container ${mobileActiveView !== 'trades' ? 'mobile-hidden' : ''}`}>
            <MemeTradesComponent
              tokenList={tokenList}
              trades={trades}
              market={{ id: token.id, quoteAddress: 'YOUR_QUOTE_ADDRESS', quoteAsset: 'USDC' }}
              tradesByMarket={tradesByMarket}
              markets={markets}
              tokendict={tokendict}
              usdc={usdc}
              wethticker={wethticker}
              ethticker={ethticker}
              onMarketSelect={onMarketSelect}
              setSendTokenIn={setSendTokenIn}
              setpopup={setpopup}
              holders={holders}
              currentUserAddress={userAddr}
            />
          </div>
        </div>
        <div className={`meme-ordercenter ${mobileActiveView !== 'ordercenter' ? 'mobile-hidden' : ''}`}>
          <MemeOrderCenter
            orderCenterHeight={orderCenterHeight}
            isVertDragging={isVertDragging}
            isOrderCenterVisible={true}
            onHeightChange={(h) => setOrderCenterHeight(h)}
            onDragStart={() => {
              setIsVertDragging(true);
              document.body.style.cursor = "row-resize";
              document.body.style.userSelect = "none";
            }}
            onDragEnd={() => {
              setIsVertDragging(false);
              document.body.style.cursor = "";
              document.body.style.userSelect = "";
            }}
            isWidgetOpen={isWidgetOpen}
            onToggleWidget={() => setIsWidgetOpen(!isWidgetOpen)}
            holders={holders}
            positions={positions}
            topTraders={topTraders}
            devTokens={devTokens}
            page={page}
            pageSize={PAGE_SIZE}
            currentPrice={currentPrice}
            monUsdPrice={monUsdPrice}
            onSellPosition={handleSellPosition}
          />
        </div>
      </div>

      <div className="meme-trade-panel desktop-only">
        <div className="meme-buy-sell-container">
          <button
            className={`meme-buy-button ${activeTradeType === "buy" ? "active" : "inactive"}`}
            onClick={() => setActiveTradeType("buy")}
          >
            Buy
          </button>
          <button
            className={`meme-sell-button ${activeTradeType === "sell" ? "active" : "inactive"}`}
            onClick={() => setActiveTradeType("sell")}
          >
            Sell
          </button>
        </div>
        <div className="meme-trade-panel-content">
          <div className="meme-order-types">
            <button
              className={`meme-order-type-button ${activeOrderType === "market" ? "active" : "inactive"}`}
              onClick={() => setActiveOrderType("market")}
            >
              Market
            </button>
            <button
              className={`meme-order-type-button ${activeOrderType === "Limit" ? "active" : "inactive"}`}
              onClick={() => setActiveOrderType("Limit")}
            >
              Limit
            </button>
          </div>
          <div className="meme-amount-header">
            <div className="meme-amount-header-left">
              <span className="meme-amount-label">
                {inputCurrency === "TOKEN" ? "Qty" : "Amount"}
              </span>
              <button
                className="meme-currency-switch-button"
                onClick={() =>
                  setInputCurrency((p) => (p === "MON" ? "TOKEN" : "MON"))
                }
              >
                <img
                  src={switchicon}
                  alt=""
                  className="meme-currency-switch-icon"
                />
              </button>
            </div>
            <div className="meme-balance-right">
              {activeTradeType === 'buy' && (
                <>
                  <div className="meme-balance-display">
                    <img src={walleticon} className="meme-wallet-icon" />
                    {formatNumberWithCommas(getCurrentMONBalance(), 3)} MON
                  </div>
                  <button
                    className="meme-balance-max-buy"
                    onClick={() => setTradeAmount(formatTradeAmount(getCurrentMONBalance()))}
                  >
                    MAX
                  </button>
                </>
              )}
              {activeTradeType === 'sell' && (
                <>
                  <div className="meme-balance-display">
                    <img src={walleticon} className="meme-wallet-icon" />
                    {formatNumberWithCommas(getCurrentTokenBalance(), 3)} {token.symbol}
                  </div>
                  <button
                    className="meme-balance-max-sell"
                    onClick={() => setTradeAmount(formatTradeAmount(getCurrentTokenBalance()))}
                  >
                    MAX
                  </button>
                </>
              )}
            </div>

          </div>
          <div className="meme-trade-input-wrapper">
            <input
              type="number"
              placeholder="0"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
              className="meme-trade-input"
            />

            <div
              className="meme-trade-currency"
              style={{
                left: `${Math.max(12 + (tradeAmount.length || 1) * 10, 12)}px`,
              }}
            >
              {inputCurrency === "TOKEN" ? token.symbol : "MON"}
            </div>

            {isQuoteLoading ? (
              <div className="meme-trade-spinner"></div>
            ) : (
              <div className="meme-trade-conversion">
                {quoteValue !== undefined && quoteValue > 0 ? (
                  <>
                    ≈ {formatNumberWithCommas(quoteValue, 6)}{" "}
                    {(() => {
                      if (activeTradeType === "buy") {
                        return inputCurrency === "MON" ? token.symbol : "MON";
                      } else {
                        return inputCurrency === "TOKEN" ? "MON" : token.symbol;
                      }
                    })()}
                  </>
                ) : tradeAmount && tradeAmount !== "" && tradeAmount !== "0" ? (
                  <>
                    ≈ 0.00{" "}
                    {(() => {
                      if (activeTradeType === "buy") {
                        return inputCurrency === "MON" ? token.symbol : "MON";
                      } else {
                        return inputCurrency === "TOKEN" ? "MON" : token.symbol;
                      }
                    })()}
                  </>
                ) : tradeAmount === "0" ? (
                  <>
                    ≈ 0.00{" "}
                    {(() => {
                      if (activeTradeType === "buy") {
                        return inputCurrency === "MON" ? token.symbol : "MON";
                      } else {
                        return inputCurrency === "TOKEN" ? "MON" : token.symbol;
                      }
                    })()}
                  </>
                ) : (
                  ""
                )}
              </div>
            )}
          </div>
          {activeOrderType === "Limit" && (
            <div className="meme-trade-input-wrapper">
              <input
                type="number"
                placeholder={token.marketCap.toString()}
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="meme-trade-input"
              />
            </div>
          )}
          <div className="meme-balance-slider-wrapper">
            {sliderMode === "presets" && (
              <div className="meme-slider-container meme-presets-mode">
                <div className="meme-preset-buttons">
                  {sliderPresets.map((preset: number) => (
                    <button
                      key={preset}
                      className={`meme-preset-button ${sliderPercent === preset ? `active ${activeTradeType}` : ""}`}
                      onClick={() => {
                        setSliderPercent(preset);
                        if (activeTradeType === "buy") {
                          const currentBalance = getCurrentMONBalance();
                          const newAmount = (currentBalance * preset) / 100;
                          setTradeAmount(newAmount.toString());
                        } else {
                          const currentBalance = getCurrentTokenBalance();
                          const newAmount = (currentBalance * preset) / 100;
                          setTradeAmount(newAmount.toString());
                        }
                      }}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>
            )}
            {sliderMode === "increment" && (
              <div className="meme-slider-container meme-increment-mode">
                <button
                  className="meme-increment-button meme-minus"
                  onClick={() => {
                    const newPercent = Math.max(0, sliderPercent - sliderIncrement);
                    setSliderPercent(newPercent);
                    if (activeTradeType === "buy") {
                      const currentBalance = getCurrentMONBalance();
                      const newAmount = (currentBalance * newPercent) / 100;
                      setTradeAmount(newAmount.toString());
                    } else {
                      const currentBalance = getCurrentTokenBalance();
                      const newAmount = (currentBalance * newPercent) / 100;
                      setTradeAmount(newAmount.toString());
                    }
                  }}
                  disabled={sliderPercent === 0}
                >
                  −
                </button>
                <div className="meme-increment-display">
                  <div className="meme-increment-amount">{sliderIncrement}%</div>
                </div>
                <button
                  className="meme-increment-button meme-plus"
                  onClick={() => {
                    const newPercent = Math.min(100, sliderPercent + sliderIncrement);
                    setSliderPercent(newPercent);
                    if (activeTradeType === "buy") {
                      const currentBalance = getCurrentMONBalance();
                      const newAmount = (currentBalance * newPercent) / 100;
                      setTradeAmount(newAmount.toString());
                    } else {
                      const currentBalance = getCurrentTokenBalance();
                      const newAmount = (currentBalance * newPercent) / 100;
                      setTradeAmount(newAmount.toString());
                    }
                  }}
                  disabled={sliderPercent === 100}
                >
                  +
                </button>
              </div>
            )}
            {sliderMode === "slider" && (
              <div className="meme-slider-container meme-slider-mode">
                <input
                  ref={sliderRef}
                  type="range"
                  className={`meme-balance-amount-slider ${isDragging ? "dragging" : ""}`}
                  min="0"
                  max="100"
                  step="1"
                  value={sliderPercent}
                  onChange={(e) => {
                    const percent = parseInt(e.target.value);
                    setSliderPercent(percent);
                    if (activeTradeType === "buy") {
                      const currentBalance = getCurrentMONBalance();
                      const newAmount = (currentBalance * percent) / 100;
                      setTradeAmount(formatTradeAmount(newAmount));
                    } else {
                      const currentBalance = getCurrentTokenBalance();
                      const newAmount = (currentBalance * percent) / 100;
                      setTradeAmount(formatTradeAmount(newAmount));
                    }
                    positionPopup(percent);
                  }}
                  onMouseDown={() => {
                    setIsDragging(true);
                    positionPopup(sliderPercent);
                  }}
                  onMouseUp={() => setIsDragging(false)}
                  style={{
                    background: `linear-gradient(to right, ${activeTradeType === 'buy' ? 'rgb(67, 254, 154)' : 'rgb(235, 112, 112)'
                      } ${sliderPercent}%, rgb(28, 28, 31) ${sliderPercent}%)`,
                  }}
                />
                <div
                  ref={popupRef}
                  className={`meme-slider-percentage-popup ${isDragging ? "visible" : ""}`}
                >
                  {sliderPercent}%
                </div>

                <div className="meme-balance-slider-marks">
                  {[0, 25, 50, 75, 100].map((markPercent) => (
                    <span
                      key={markPercent}
                      className={`meme-balance-slider-mark ${activeTradeType}`}
                      data-active={sliderPercent >= markPercent}
                      data-percentage={markPercent}
                      onClick={() => {
                        setSliderPercent(markPercent);
                        if (activeTradeType === "buy") {
                          const currentBalance = getCurrentMONBalance();
                          const newAmount = (currentBalance * markPercent) / 100;
                          setTradeAmount(newAmount.toString());
                        } else {
                          const currentBalance = getCurrentTokenBalance();
                          const newAmount = (currentBalance * markPercent) / 100;
                          setTradeAmount(newAmount.toString());
                        }
                        positionPopup(markPercent);
                      }}
                    >
                      {markPercent}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="meme-trade-settings">
            <div className="meme-settings-toggle">
              <div className="meme-settings-collapsed">
                <div className="meme-settings-item">
                  <img src={slippage} className="meme-settings-icon1" />
                  <span className="meme-settings-value">{slippageValue}%</span>
                </div>
                <div className="meme-settings-item">
                  <img src={gas} className="meme-settings-icon2" />
                  <span className="meme-settings-value">{priorityFee}</span>
                </div>
              </div>
              <button
                className="meme-settings-edit-button"
                onClick={() => setSettingsExpanded(!settingsExpanded)}
              >
                <img
                  src={editicon}
                  className={`meme-settings-edit-icon ${settingsExpanded ? "expanded" : ""}`}
                />
              </button>
            </div>
            {settingsExpanded && (
              <div className="meme-settings-content">
                <div className="meme-settings-presets">
                  <button
                    className={`meme-settings-preset ${(settingsMode === 'buy' ? selectedBuyPreset : selectedSellPreset) === 1 ? 'active' : ''}`}
                    onClick={() => handlePresetSelect(1)}
                  >
                    Preset 1
                  </button>
                  <button
                    className={`meme-settings-preset ${(settingsMode === 'buy' ? selectedBuyPreset : selectedSellPreset) === 2 ? 'active' : ''}`}
                    onClick={() => handlePresetSelect(2)}
                  >
                    Preset 2
                  </button>
                  <button
                    className={`meme-settings-preset ${(settingsMode === 'buy' ? selectedBuyPreset : selectedSellPreset) === 3 ? 'active' : ''}`}
                    onClick={() => handlePresetSelect(3)}
                  >
                    Preset 3
                  </button>
                </div>

                <div className="meme-settings-mode-toggle">
                  <button
                    className={`meme-settings-mode-btn ${settingsMode === 'buy' ? 'active' : ''}`}
                    onClick={() => setSettingsMode('buy')}
                  >
                    Buy settings
                  </button>
                  <button
                    className={`meme-settings-mode-btn ${settingsMode === 'sell' ? 'active' : ''}`}
                    onClick={() => setSettingsMode('sell')}
                  >
                    Sell settings
                  </button>
                </div>
                <div className="meme-settings-grid">
                  <div className="meme-setting-item">
                    <label className="meme-setting-label">
                      <img src={slippage} alt="Slippage" className="meme-setting-label-icon" />
                      Slippage
                    </label>
                    <div className="meme-setting-input-wrapper">
                      <input
                        type="number"
                        className="meme-setting-input"
                        value={settingsMode === 'buy' ? buySlippageValue : sellSlippageValue}
                        onChange={(e) => settingsMode === 'buy' ? setBuySlippageValue(e.target.value) : setSellSlippageValue(e.target.value)}
                        step="0.1"
                        min="0"
                        max="100"
                      />
                      <span className="meme-setting-unit">%</span>
                    </div>
                  </div>

                  <div className="meme-setting-item">
                    <label className="meme-setting-label">
                      <img src={gas} alt="Priority Fee" className="meme-setting-label-icon" />
                      Priority
                    </label>
                    <div className="meme-setting-input-wrapper">
                      <input
                        type="number"
                        className="meme-setting-input"
                        value={settingsMode === 'buy' ? buyPriorityFee : sellPriorityFee}
                        onChange={(e) => settingsMode === 'buy' ? setBuyPriorityFee(e.target.value) : setSellPriorityFee(e.target.value)}
                        step="0.001"
                        min="0"
                      />
                      <span className="meme-setting-unit">MON</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {activeTradeType === "buy" && (
            <div className="meme-advanced-trading-section">
              <div className="meme-advanced-trading-toggle">
                <div className="meme-advanced-trading-header">
                  <div className="meme-advanced-trading-icon-label">
                    <span className="meme-advanced-trading-label">Advanced Trading Strategy</span>
                  </div>
                  <ToggleSwitch
                    checked={advancedTradingEnabled}
                    onChange={() => setAdvancedTradingEnabled(!advancedTradingEnabled)}
                  />
                </div>

                {advancedTradingEnabled && (
                  <div className="meme-advanced-trading-content">
                    {advancedOrders.map((order) => (
                      <div key={order.id} className="meme-advanced-order-item">
                        <div className="meme-advanced-order-inputs">
                          {(order.type === 'takeProfit' || order.type === 'stopLoss') && (
                            <>
                              <div className="meme-advanced-order-input-group">
                                <svg
                                  className="advanced-order-type-icon"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="rgb(154 155 164)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{
                                    transform: order.type === 'stopLoss' ? 'rotate(180deg)' : 'none',
                                    paddingRight: '2px',
                                  }}
                                >
                                  <path d="m5 12 7-7 7 7" /><path d="M12 19V5" />
                                </svg>
                                <span className="meme-advanced-order-input-label">
                                  {order.type === 'takeProfit' ? 'TP' : 'SL'}
                                </span>
                                <input
                                  type="text"
                                  className="meme-advanced-order-input"
                                  value={order.percentage || ''}
                                  onChange={(e) => handleAdvancedOrderUpdate(order.id, 'percentage', e.target.value)}
                                  placeholder={order.type === 'takeProfit' ? '+0' : '-0'}
                                />
                                <span className="meme-advanced-order-unit">%</span>
                              </div>
                              <div className="meme-advanced-order-input-group">
                                <span className="meme-advanced-order-input-label">Amount</span>
                                <input
                                  type="number"
                                  className="meme-advanced-order-input"
                                  value={order.amount || ''}
                                  onChange={(e) => handleAdvancedOrderUpdate(order.id, 'amount', e.target.value)}
                                  placeholder="0"
                                />
                                <span className="meme-advanced-order-unit">%</span>
                              </div>
                              <button
                                className="meme-advanced-order-remove"
                                onClick={() => handleAdvancedOrderRemove(order.id)}
                              >
                                <img src={trash} className="meme-advanced-order-remove-icon" alt="Remove" width="14" height="14" />
                              </button>
                            </>
                          )}
                          {order.type === 'devSell' && (
                            <>
                              <div className="meme-advanced-order-input-group">
                                <svg className="advanced-order-type-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgb(154 155 164)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 17V3" /><path d="m6 11 6 6 6-6" /><path d="M19 21H5" />
                                </svg>
                                <span className="meme-advanced-order-input-label">Sell Amount on Dev Sell</span>
                                <input
                                  type="number"
                                  className="meme-advanced-order-input"
                                  value={order.percentage || ''}
                                  onChange={(e) => handleAdvancedOrderUpdate(order.id, 'percentage', e.target.value)}
                                  placeholder="0"
                                />
                                <span className="meme-advanced-order-unit">%</span>
                              </div>
                              <button
                                className="meme-advanced-order-remove"
                                onClick={() => handleAdvancedOrderRemove(order.id)}
                              >
                                <img src={trash} className="meme-advanced-order-remove-icon" alt="Remove" width="14" height="14" />
                              </button>
                            </>
                          )}
                          {order.type === 'migration' && (
                            <>
                              <div className="meme-advanced-order-input-group">
                                <svg className="advanced-order-type-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgb(154 155 164)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m6 17 5-5-5-5" /><path d="m13 17 5-5-5-5" />
                                </svg>
                                <span className="meme-advanced-order-input-label">Sell Amount on Migration</span>
                                <input
                                  type="number"
                                  className="meme-advanced-order-input"
                                  value={order.percentage || ''}
                                  onChange={(e) => handleAdvancedOrderUpdate(order.id, 'percentage', e.target.value)}
                                  placeholder="0"
                                />
                                <span className="meme-advanced-order-unit">%</span>
                              </div>
                              <button
                                className="meme-advanced-order-remove"
                                onClick={() => handleAdvancedOrderRemove(order.id)}
                              >
                                <img src={trash} className="meme-advanced-order-remove-icon" alt="Remove" width="14" height="14" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add Button with Dropdown */}
                    {advancedOrders.length < 5 && (
                      <div className="meme-advanced-add-container">
                        <button
                          className="meme-advanced-add-button"
                          onClick={() => setShowAdvancedDropdown(!showAdvancedDropdown)}
                        >
                          <span>Add</span>
                          <svg className="meme-advanced-add-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>

                        {showAdvancedDropdown && (
                          <div className="meme-advanced-dropdown">
                            <button
                              className="meme-advanced-dropdown-item"
                              onClick={() => handleAdvancedOrderAdd('takeProfit')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(154 155 164)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m5 12 7-7 7 7" /><path d="M12 19V5" />
                              </svg>
                              Take Profit
                            </button>
                            <button
                              className="meme-advanced-dropdown-item"
                              onClick={() => handleAdvancedOrderAdd('stopLoss')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(154 155 164)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14" /><path d="m19 12-7 7-7-7" />
                              </svg>
                              Stop Loss
                            </button>
                            <button
                              className="meme-advanced-dropdown-item"
                              onClick={() => handleAdvancedOrderAdd('devSell')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(154 155 164)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 17V3" /><path d="m6 11 6 6 6-6" /><path d="M19 21H5" />
                              </svg>
                              Sell on Dev Sell
                            </button>
                            <button
                              className="meme-advanced-dropdown-item"
                              onClick={() => handleAdvancedOrderAdd('migration')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(154 155 164)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 17 5-5-5-5" /><path d="m13 17 5-5-5-5" />
                              </svg>
                              Migration
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (!account.connected) {
                setpopup(4);
              } else {
                const targetChainId =
                  settings.chainConfig[activechain]?.chainId || activechain;
                if (account.chainId !== targetChainId) {
                  setChain();
                } else {
                  handleTrade();
                }
              }
            }}
            className={`meme-trade-action-button ${activeTradeType}`}
            disabled={isTradeDisabled()}
          >
            {isSigning ? (
              <div className="meme-button-spinner"></div>
            ) : (
              getButtonText()
            )}
          </button>
          <div className="meme-portfolio-stats" onClick={handleToggleCurrency} style={{ cursor: 'pointer' }}>
            <div className="meme-portfolio-stat">
              <div className="meme-portfolio-label">Bought</div>
              <div className="meme-portfolio-value bought">
                {showUSD ? (
                  <>
                    <span>$</span>
                    {formatNumberWithCommas(userStats.valueBought * monUsdPrice, 1)}
                  </>
                ) : (
                  <>
                    <img className="meme-mobile-monad-icon" src={monadicon} alt="MON" />
                    {formatNumberWithCommas(userStats.valueBought, 1)}
                  </>
                )}
              </div>
            </div>
            <div className="meme-portfolio-stat">
              <div className="meme-portfolio-label">Sold</div>
              <div className="meme-portfolio-value sold">
                {showUSD ? (
                  <>
                    <span>$</span>
                    {formatNumberWithCommas(userStats.valueSold * monUsdPrice, 1)}
                  </>
                ) : (
                  <>
                    <img className="meme-mobile-monad-icon" src={monadicon} alt="MON" />
                    {formatNumberWithCommas(userStats.valueSold, 1)}
                  </>
                )}
              </div>
            </div>
            <div className="meme-portfolio-stat">
              <div className="meme-portfolio-label">Holding</div>
              <div className="meme-portfolio-value holding">
                {showUSD ? (
                  <>
                    <span >$</span>
                    {formatNumberWithCommas(userStats.balance * currentPrice * monUsdPrice, 3)}
                  </>
                ) : (
                  <>
                    <img className="meme-mobile-monad-icon" src={monadicon} alt="MON" />
                    {formatNumberWithCommas(userStats.balance * currentPrice, 3)}
                  </>
                )}
              </div>
            </div>
            <div className="meme-portfolio-stat pnl">
              <div className="meme-portfolio-label">PnL</div>
              <div className={`meme-portfolio-value pnl ${userStats.valueNet >= 0 ? 'positive' : 'negative'}`}>
                {showUSD ? (
                  <>
                    <span>$</span>
                    {userStats.valueNet >= 0 ? '+' : ''}{formatNumberWithCommas(userStats.valueNet * monUsdPrice, 1)}
                    {userStats.valueBought > 0 ? ` (${userStats.valueNet >= 0 ? '+' : ''}${((userStats.valueNet / userStats.valueBought) * 100).toFixed(1)}%)` : ' (0%)'}
                  </>
                ) : (
                  <>
                    <img className="meme-mobile-monad-icon" src={monadicon} alt="MON" />
                    {userStats.valueNet >= 0 ? '+' : ''}{formatNumberWithCommas(userStats.valueNet, 1)}
                    {userStats.valueBought > 0 ? ` (${userStats.valueNet >= 0 ? '+' : ''}${((userStats.valueNet / userStats.valueBought) * 100).toFixed(1)}%)` : ' (0%)'}
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
        <div className="meme-trading-stats-container">
          <div className="meme-trading-stats-row">
            <div className="meme-stat-group">
              <div className="meme-stat-header">
                <span className="meme-stat-label">TXNS</span>
                <div className="meme-stat-value">
                  {formatNumberWithCommas(totalTraders)}
                </div>
              </div>
              <div className="meme-stat-details">
                <div className="meme-stat-subrow">
                  <div className="stat-sublabel">BUYS</div>
                  <div className="stat-sublabel">SELLS</div>
                </div>
                <div className="meme-stat-subrow">
                  <div className="stat-subvalue buy">
                    {formatNumberWithCommas(buyers)}
                  </div>
                  <div className="stat-subvalue sell">
                    {formatNumberWithCommas(sellers)}
                  </div>
                </div>
                <div className="meme-progress-bar">
                  <div
                    className="progress-buy"
                    style={{ width: `${currentData.buyerPercentage}%` }}
                  ></div>
                  <div
                    className="progress-sell"
                    style={{ width: `${currentData.sellerPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="meme-stat-group">
              <div className="meme-stat-header">
                <span className="meme-stat-label">VOLUME</span>
                <div className="meme-stat-value">
                  {formatVolume(currentData.volume)}
                </div>
              </div>
              <div className="meme-stat-details">
                <div className="meme-stat-subrow">
                  <div className="stat-sublabel">BUY VOL</div>
                  <div className="stat-sublabel">SELL VOL</div>
                </div>
                <div className="meme-stat-subrow">
                  <div className="stat-subvalue buy">
                    {formatVolume(buyVolume)}
                  </div>
                  <div className="stat-subvalue sell">
                    {formatVolume(sellVolume)}
                  </div>
                </div>
                <div className="meme-progress-bar">
                  <div
                    className="progress-buy"
                    style={{ width: `${currentData.buyVolumePercentage}%` }}
                  ></div>
                  <div
                    className="progress-sell"
                    style={{ width: `${currentData.sellVolumePercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="meme-stat-group">
              <div className="meme-stat-header">
                <span className="meme-stat-label">MAKERS</span>
                <div className="meme-stat-value">
                  {formatNumberWithCommas(totalTraders)}
                </div>
              </div>
              <div className="meme-stat-details">
                <div className="meme-stat-subrow">
                  <div className="stat-sublabel">BUYERS</div>
                  <div className="stat-sublabel">SELLERS</div>
                </div>
                <div className="meme-stat-subrow">
                  <div className="stat-subvalue buy">
                    {formatNumberWithCommas(buyers)}
                  </div>
                  <div className="stat-subvalue sell">
                    {formatNumberWithCommas(sellers)}
                  </div>
                </div>
                <div className="meme-progress-bar">
                  <div
                    className="progress-buy"
                    style={{ width: `${currentData.buyerPercentage}%` }}
                  ></div>
                  <div
                    className="progress-sell"
                    style={{ width: `${currentData.sellerPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

          </div>
        </div>
        <div className="meme-token-info-container">
          <div className="meme-token-info-header">
            <h3 className="meme-token-info-title">Token Info</h3>
            <button
              className="meme-token-info-collapse-button"
              onClick={() => setTokenInfoExpanded(!tokenInfoExpanded)}
            >
              <svg
                className={`meme-token-info-arrow ${tokenInfoExpanded ? "expanded" : ""}`}
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
          {tokenInfoExpanded && (
            <div>
              <div className="meme-token-info-grid">
                <div className="meme-token-info-item">
                  <div className="meme-token-info-icon-container">
                    <svg
                      className="meme-token-info-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 32 32"
                      fill={
                        top10HoldingPercentage > 50
                          ? "#eb7070ff"
                          : top10HoldingPercentage > 30
                            ? "#fbbf24"
                            : "rgb(67 254 154)"
                      }
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 15 4 L 15 6 L 13 6 L 13 8 L 15 8 L 15 9.1875 C 14.011719 9.554688 13.25 10.433594 13.0625 11.5 C 12.277344 11.164063 11.40625 11 10.5 11 C 6.921875 11 4 13.921875 4 17.5 C 4 19.792969 5.199219 21.8125 7 22.96875 L 7 27 L 25 27 L 25 22.96875 C 26.800781 21.8125 28 19.792969 28 17.5 C 28 13.921875 25.078125 11 21.5 11 C 20.59375 11 19.722656 11.164063 18.9375 11.5 C 18.75 10.433594 17.988281 9.554688 17 9.1875 L 17 8 L 19 8 L 19 6 L 17 6 L 17 4 Z M 16 11 C 16.5625 11 17 11.4375 17 12 C 17 12.5625 16.5625 13 16 13 C 15.4375 13 15 12.5625 15 12 C 15 11.4375 15.4375 11 16 11 Z M 10.5 13 C 12.996094 13 15 15.003906 15 17.5 L 15 22 L 10.5 22 C 8.003906 22 6 19.996094 6 17.5 C 6 15.003906 8.003906 13 10.5 13 Z M 21.5 13 C 23.996094 13 26 15.003906 26 17.5 C 26 19.996094 23.996094 22 21.5 22 L 17 22 L 17 17.5 C 17 15.003906 19.003906 13 21.5 13 Z M 9 24 L 23 24 L 23 25 L 9 25 Z" />
                    </svg>
                    <span
                      className="meme-token-info-value"
                      style={{
                        color:
                          top10HoldingPercentage > 50
                            ? "#eb7070ff"
                            : top10HoldingPercentage > 30
                              ? "#fbbf24"
                              : "rgb(67 254 154)",
                      }}
                    >
                      {top10HoldingPercentage.toFixed(2)}%
                    </span>
                  </div>
                  <span className="meme-token-info-label">Top 10 H.</span>
                </div>
               <div className="meme-token-info-item">
                  <div className="meme-token-info-icon-container">
                    <svg
                      className="meme-token-info-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 32 32"
                      fill={
                        token.devHolding > 50
                          ? "#eb7070ff"
                          : token.devHolding > 30
                            ? "#fbbf24"
                            : "rgb(67 254 154)"
                      }
                      xmlns="http://www.w3.org/2000/svg"
                    >
                  <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                    </svg>
                    <span
                      className="meme-token-info-value"
                      style={{
                        color:
                          token.devHolding > 50
                            ? "#eb7070ff"
                            : token.devHolding > 30
                              ? "#fbbf24"
                              : "rgb(67 254 154)",
                      }}
                    >
                      {token.devHolding.toFixed(2)}%
                    </span>
                  </div>
                  <span className="meme-token-info-label">Dev H.</span>
                </div>
                                <div className="meme-token-info-item">
                  <div className="meme-token-info-icon-container">
                    <svg
                  className="sniper-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={token.sniperHolding > 5 ? "#eb7070ff" : "rgb(67, 254, 154)"}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 11.244141 2.0019531 L 11.244141 2.7519531 L 11.244141 3.1542969 C 6.9115518 3.5321749 3.524065 6.919829 3.1445312 11.251953 L 2.7421875 11.251953 L 1.9921875 11.251953 L 1.9921875 12.751953 L 2.7421875 12.751953 L 3.1445312 12.751953 C 3.5225907 17.085781 6.9110367 20.473593 11.244141 20.851562 L 11.244141 21.253906 L 11.244141 22.003906 L 12.744141 22.003906 L 12.744141 21.253906 L 12.744141 20.851562 C 17.076343 20.47195 20.463928 17.083895 20.841797 12.751953 L 21.244141 12.751953 L 21.994141 12.751953 L 21.994141 11.251953 L 21.244141 11.251953 L 20.841797 11.251953 C 20.462285 6.9209126 17.074458 3.5337191 12.744141 3.1542969 L 12.744141 2.7519531 L 12.744141 2.0019531 L 11.244141 2.0019531 z M 11.244141 4.6523438 L 11.244141 8.0742188 C 9.6430468 8.3817751 8.3759724 9.6507475 8.0683594 11.251953 L 4.6425781 11.251953 C 5.0091295 7.7343248 7.7260437 5.0173387 11.244141 4.6523438 z M 12.744141 4.6523438 C 16.25959 5.0189905 18.975147 7.7358303 19.341797 11.251953 L 15.917969 11.251953 C 15.610766 9.6510551 14.344012 8.3831177 12.744141 8.0742188 L 12.744141 4.6523438 z M 11.992188 9.4980469 C 13.371637 9.4980469 14.481489 10.6041 14.492188 11.982422 L 14.492188 12.021484 C 14.481501 13.40006 13.372858 14.503906 11.992188 14.503906 C 10.606048 14.503906 9.4921875 13.389599 9.4921875 12.001953 C 9.4921875 10.614029 10.60482 9.4980469 11.992188 9.4980469 z M 4.6425781 12.751953 L 8.0683594 12.751953 C 8.3760866 14.352973 9.6433875 15.620527 11.244141 15.927734 L 11.244141 19.353516 C 7.7258668 18.988181 5.0077831 16.270941 4.6425781 12.751953 z M 15.917969 12.751953 L 19.34375 12.751953 C 18.97855 16.26893 16.261295 18.986659 12.744141 19.353516 L 12.744141 15.927734 C 14.344596 15.619809 15.610176 14.35218 15.917969 12.751953 z" />
                </svg>
                    <span
                      className="meme-token-info-value"
                      style={{
                        color:
                          token.sniperHolding > 50
                            ? "#eb7070ff"
                            : token.sniperHolding > 30
                              ? "#fbbf24"
                              : "rgb(67 254 154)",
                      }}
                    >
                      {token.sniperHolding.toFixed(2)}%
                    </span>
                  </div>
                  <span className="meme-token-info-label">Sniper H.</span>
                </div>
                                <div className="meme-token-info-item">
                  <div className="meme-token-info-icon-container">
                    <svg
                      className="meme-token-info-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 32 32"
                      fill={
                        token.insiderHolding > 50
                          ? "#eb7070ff"
                          : token.insiderHolding > 30
                            ? "#fbbf24"
                            : "rgb(67 254 154)"
                      }
                      xmlns="http://www.w3.org/2000/svg"
                    >
                  <path d="M 16 3 C 14.0625 3 12.570313 3.507813 11.5 4.34375 C 10.429688 5.179688 9.8125 6.304688 9.375 7.34375 C 8.9375 8.382813 8.65625 9.378906 8.375 10.09375 C 8.09375 10.808594 7.859375 11.085938 7.65625 11.15625 C 4.828125 12.160156 3 14.863281 3 18 L 3 19 L 4 19 C 5.347656 19 6.003906 19.28125 6.3125 19.53125 C 6.621094 19.78125 6.742188 20.066406 6.8125 20.5625 C 6.882813 21.058594 6.847656 21.664063 6.9375 22.34375 C 6.984375 22.683594 7.054688 23.066406 7.28125 23.4375 C 7.507813 23.808594 7.917969 24.128906 8.375 24.28125 C 9.433594 24.632813 10.113281 24.855469 10.53125 25.09375 C 10.949219 25.332031 11.199219 25.546875 11.53125 26.25 C 11.847656 26.917969 12.273438 27.648438 13.03125 28.1875 C 13.789063 28.726563 14.808594 29.015625 16.09375 29 C 18.195313 28.972656 19.449219 27.886719 20.09375 26.9375 C 20.417969 26.460938 20.644531 26.050781 20.84375 25.78125 C 21.042969 25.511719 21.164063 25.40625 21.375 25.34375 C 22.730469 24.9375 23.605469 24.25 24.09375 23.46875 C 24.582031 22.6875 24.675781 21.921875 24.8125 21.40625 C 24.949219 20.890625 25.046875 20.6875 25.375 20.46875 C 25.703125 20.25 26.453125 20 28 20 L 29 20 L 29 19 C 29 17.621094 29.046875 16.015625 28.4375 14.5 C 27.828125 12.984375 26.441406 11.644531 24.15625 11.125 C 24.132813 11.121094 24.105469 11.132813 24 11 C 23.894531 10.867188 23.734375 10.601563 23.59375 10.25 C 23.3125 9.550781 23.042969 8.527344 22.59375 7.46875 C 22.144531 6.410156 21.503906 5.269531 20.4375 4.40625 C 19.371094 3.542969 17.90625 3 16 3 Z M 16 5 C 17.539063 5 18.480469 5.394531 19.1875 5.96875 C 19.894531 6.542969 20.367188 7.347656 20.75 8.25 C 21.132813 9.152344 21.402344 10.128906 21.75 11 C 21.921875 11.433594 22.109375 11.839844 22.40625 12.21875 C 22.703125 12.597656 23.136719 12.96875 23.6875 13.09375 C 25.488281 13.503906 26.15625 14.242188 26.5625 15.25 C 26.871094 16.015625 26.878906 17.066406 26.90625 18.09375 C 25.796875 18.1875 24.886719 18.386719 24.25 18.8125 C 23.40625 19.378906 23.050781 20.25 22.875 20.90625 C 22.699219 21.5625 22.632813 22.042969 22.40625 22.40625 C 22.179688 22.769531 21.808594 23.128906 20.78125 23.4375 C 20.070313 23.652344 19.558594 24.140625 19.21875 24.59375 C 18.878906 25.046875 18.675781 25.460938 18.4375 25.8125 C 17.960938 26.515625 17.617188 26.980469 16.0625 27 C 15.078125 27.011719 14.550781 26.820313 14.1875 26.5625 C 13.824219 26.304688 13.558594 25.929688 13.3125 25.40625 C 12.867188 24.460938 12.269531 23.765625 11.53125 23.34375 C 10.792969 22.921875 10.023438 22.714844 9 22.375 C 8.992188 22.359375 8.933594 22.285156 8.90625 22.09375 C 8.855469 21.710938 8.886719 21.035156 8.78125 20.28125 C 8.675781 19.527344 8.367188 18.613281 7.5625 17.96875 C 7 17.515625 6.195313 17.289063 5.25 17.15625 C 5.542969 15.230469 6.554688 13.65625 8.3125 13.03125 C 9.375 12.65625 9.898438 11.730469 10.25 10.84375 C 10.601563 9.957031 10.851563 8.96875 11.21875 8.09375 C 11.585938 7.21875 12.019531 6.480469 12.71875 5.9375 C 13.417969 5.394531 14.402344 5 16 5 Z M 13 9 C 12.449219 9 12 9.671875 12 10.5 C 12 11.328125 12.449219 12 13 12 C 13.550781 12 14 11.328125 14 10.5 C 14 9.671875 13.550781 9 13 9 Z M 17 9 C 16.449219 9 16 9.671875 16 10.5 C 16 11.328125 16.449219 12 17 12 C 17.550781 12 18 11.328125 18 10.5 C 18 9.671875 17.550781 9 17 9 Z" />
                    </svg>
                    <span
                      className="meme-token-info-value"
                      style={{
                        color:
                          token.insiderHolding > 50
                            ? "#eb7070ff"
                            : token.insiderHolding > 30
                              ? "#fbbf24"
                              : "rgb(67 254 154)",
                      }}
                    >
                      {token.insiderHolding.toFixed(2)}%
                    </span>
                  </div>
                  <span className="meme-token-info-label">Insiders</span>
                </div>
                <div className="meme-token-info-item">
                  <div className="meme-token-info-icon-container">
                     <svg
                      className="meme-interface-traders-icon"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="#ced0df"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 8.8007812 3.7890625 C 6.3407812 3.7890625 4.3496094 5.78 4.3496094 8.25 C 4.3496094 9.6746499 5.0287619 10.931069 6.0703125 11.748047 C 3.385306 12.836193 1.4902344 15.466784 1.4902344 18.550781 C 1.4902344 18.960781 1.8202344 19.300781 2.2402344 19.300781 C 2.6502344 19.300781 2.9902344 18.960781 2.9902344 18.550781 C 2.9902344 15.330781 5.6000781 12.720703 8.8300781 12.720703 L 8.8203125 12.710938 C 8.9214856 12.710938 9.0168776 12.68774 9.1054688 12.650391 C 9.1958823 12.612273 9.2788858 12.556763 9.3476562 12.488281 C 9.4163056 12.41992 9.4712705 12.340031 9.5097656 12.25 C 9.5480469 12.160469 9.5703125 12.063437 9.5703125 11.960938 C 9.5703125 11.540938 9.2303125 11.210938 8.8203125 11.210938 C 7.1903125 11.210938 5.8691406 9.8897656 5.8691406 8.2597656 C 5.8691406 6.6297656 7.1900781 5.3105469 8.8300781 5.3105469 L 8.7890625 5.2890625 C 9.2090625 5.2890625 9.5507812 4.9490625 9.5507812 4.5390625 C 9.5507812 4.1190625 9.2107813 3.7890625 8.8007812 3.7890625 z M 14.740234 3.8007812 C 12.150234 3.8007812 10.060547 5.9002344 10.060547 8.4902344 L 10.039062 8.4707031 C 10.039063 10.006512 10.78857 11.35736 11.929688 12.212891 C 9.0414704 13.338134 7 16.136414 7 19.429688 C 7 19.839688 7.33 20.179688 7.75 20.179688 C 8.16 20.179688 8.5 19.839688 8.5 19.429688 C 8.5 15.969687 11.29 13.179688 14.75 13.179688 L 14.720703 13.160156 C 14.724012 13.160163 14.727158 13.160156 14.730469 13.160156 C 16.156602 13.162373 17.461986 13.641095 18.519531 14.449219 C 18.849531 14.709219 19.320078 14.640313 19.580078 14.320312 C 19.840078 13.990313 19.769219 13.519531 19.449219 13.269531 C 18.873492 12.826664 18.229049 12.471483 17.539062 12.205078 C 18.674662 11.350091 19.419922 10.006007 19.419922 8.4804688 C 19.419922 5.8904687 17.320234 3.8007812 14.740234 3.8007812 z M 14.730469 5.2890625 C 16.490469 5.2890625 17.919922 6.7104688 17.919922 8.4804688 C 17.919922 10.240469 16.500234 11.669922 14.740234 11.669922 C 12.980234 11.669922 11.560547 10.250234 11.560547 8.4902344 C 11.560547 6.7302344 12.98 5.3105469 14.75 5.3105469 L 14.730469 5.2890625 z M 21.339844 16.230469 C 21.24375 16.226719 21.145781 16.241797 21.050781 16.279297 L 21.039062 16.259766 C 20.649063 16.409766 20.449609 16.840469 20.599609 17.230469 C 20.849609 17.910469 20.990234 18.640156 20.990234 19.410156 C 20.990234 19.820156 21.320234 20.160156 21.740234 20.160156 C 22.150234 20.160156 22.490234 19.820156 22.490234 19.410156 C 22.490234 18.470156 22.319766 17.560703 22.009766 16.720703 C 21.897266 16.428203 21.628125 16.241719 21.339844 16.230469 z" />
                    </svg>      
                    <span
                      className="meme-token-info-value"
                      style={{
                        color:
                          "#ced0df"
                      }}
                    >
                      {token.holders}
                    </span>
                  </div>
                  <span className="meme-token-info-label">Holders</span>
                </div>
                                <div className="meme-token-info-item">
                  <div className="meme-token-info-icon-container">
                     <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="#ced0df"
                      xmlns="http://www.w3.org/2000/svg"
                      className="meme-interface-traders-icon"
                    >
                      <path d="M 12 2 L 12 4 L 11 4 C 10.4 4 10 4.4 10 5 L 10 10 C 10 10.6 10.4 11 11 11 L 12 11 L 12 13 L 14 13 L 14 11 L 15 11 C 15.6 11 16 10.6 16 10 L 16 5 C 16 4.4 15.6 4 15 4 L 14 4 L 14 2 L 12 2 z M 4 9 L 4 11 L 3 11 C 2.4 11 2 11.4 2 12 L 2 17 C 2 17.6 2.4 18 3 18 L 4 18 L 4 20 L 6 20 L 6 18 L 7 18 C 7.6 18 8 17.6 8 17 L 8 12 C 8 11.4 7.6 11 7 11 L 6 11 L 6 9 L 4 9 z M 18 11 L 18 13 L 17 13 C 16.4 13 16 13.4 16 14 L 16 19 C 16 19.6 16.4 20 17 20 L 18 20 L 18 22 L 20 22 L 20 20 L 21 20 C 21.6 20 22 19.6 22 19 L 22 14 C 22 13.4 21.6 13 21 13 L 20 13 L 20 11 L 18 11 z M 4 13 L 6 13 L 6 16 L 4 16 L 4 13 z" />
                    </svg>     
                    <span
                      className="meme-token-info-value"
                      style={{
                        color:
                          "#ced0df"
                      }}
                    >
                      {token.proTraders}
                    </span>
                  </div>
                  <span className="meme-token-info-label">Pro Traders</span>
                </div>
              </div>
              <div className="meme-token-info-footer">
                <span className="meme-address">
                  <img className="meme-contract-icon" src={contract} />
                  <span className="meme-address-title">CA:</span>{" "}
                  {token.id.slice(0, 21)}...{token.id.slice(-4)}
                  <TooltipLabel label={<svg
                    className="meme-address-link"
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                    <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
                  </svg>} tooltipText="View on Monad Explorer"
                  />
                </span>
                <span className="meme-address">
                  <img className="meme-contract-icon" src={contract} />
                  <span className="meme-address-title">DA:</span>{" "}
                  {token.dev.slice(0, 21)}...{token.dev.slice(-4)}
                  <TooltipLabel label={<svg
                    className="meme-address-link"
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
                    <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
                  </svg>} tooltipText="View on Monad Explorer"
                  />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="meme-mobile-quickbuy mobile-only">
        <div className="meme-mobile-header">
          <div className="meme-mobile-trade-toggle">
            <button
              className={`meme-mobile-trade-btn ${mobileTradeType === 'buy' ? 'active buy' : ''}`}
              onClick={() => setMobileTradeType('buy')}
            >
              Buy
            </button>
            <button
              className={`meme-mobile-trade-btn ${mobileTradeType === 'sell' ? 'active sell' : ''}`}
              onClick={() => setMobileTradeType('sell')}
            >
              Sell
            </button>
          </div>

          <div className="meme-mobile-controls">
            {subWallets.length > 0 && (
              <button
                className={`meme-mobile-wallets-button ${mobileWalletsExpanded ? 'active' : ''}`}
                onClick={() => setMobileWalletsExpanded(!mobileWalletsExpanded)}
                title="Toggle Wallets"
              >
                <img src={walleticon} alt="Wallet" className="meme-mobile-wallets-icon" />
                <span className="meme-mobile-wallets-count">{subWallets.length}</span>
              </button>
            )}
          </div>
        </div>

        {/* Trading Section */}
        {mobileTradeType === 'buy' ? (
          <div className="meme-mobile-buy-section">
            <div className="meme-mobile-section-header">
              <div className="meme-mobile-preset-controls">
                <button
                  className={`meme-mobile-preset-pill ${mobileQuickBuyPreset === 1 ? 'active' : ''}`}
                  onClick={() => setMobileQuickBuyPreset(1)}
                >
                  P1
                </button>
                <button
                  className={`meme-mobile-preset-pill ${mobileQuickBuyPreset === 2 ? 'active' : ''}`}
                  onClick={() => setMobileQuickBuyPreset(2)}
                >
                  P2
                </button>
                <button
                  className={`meme-mobile-preset-pill ${mobileQuickBuyPreset === 3 ? 'active' : ''}`}
                  onClick={() => setMobileQuickBuyPreset(3)}
                >
                  P3
                </button>
              </div>
              <div className="meme-mobile-order-indicator">
                <img className="meme-mobile-monad-icon" src={monadicon} alt="MON" />
                0
              </div>
            </div>

            <div className="meme-mobile-amount-buttons">
              {mobileBuyAmounts.map((amount, index) => (
                <button
                  key={index}
                  className={`meme-mobile-amount-btn ${mobileSelectedBuyAmount === amount ? 'active' : ''}`}
                  onClick={() => {
                    setMobileSelectedBuyAmount(amount);
                    handleMobileBuyTrade(amount);
                  }}
                  disabled={!account?.connected}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="meme-mobile-sell-section">
            <div className="meme-mobile-section-header">
              <div className="meme-mobile-preset-controls">
                <button
                  className={`meme-mobile-preset-pill ${mobileQuickBuyPreset === 1 ? 'active' : ''}`}
                  onClick={() => setMobileQuickBuyPreset(1)}
                >
                  P1
                </button>
                <button
                  className={`meme-mobile-preset-pill ${mobileQuickBuyPreset === 2 ? 'active' : ''}`}
                  onClick={() => setMobileQuickBuyPreset(2)}
                >
                  P2
                </button>
                <button
                  className={`meme-mobile-preset-pill ${mobileQuickBuyPreset === 3 ? 'active' : ''}`}
                  onClick={() => setMobileQuickBuyPreset(3)}
                >
                  P3
                </button>
              </div>
              <div className="meme-mobile-order-indicator">
                <img className="meme-mobile-monad-icon" src={monadicon} alt="MON" />
                0
              </div>
            </div>

            <div className="meme-mobile-percent-buttons">
              {mobileSellPercents.map((percent, index) => (
                <button
                  key={index}
                  className={`meme-mobile-percent-btn ${mobileSelectedSellPercent === percent ? 'active' : ''}`}
                  onClick={() => {
                    setMobileSelectedSellPercent(percent);
                    handleMobileSellTrade(percent);
                  }}
                  disabled={!account?.connected || walletTokenBalances?.[userAddr]?.[token.id] <= 0}
                >
                  {percent}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Settings Display */}
        <div className="meme-mobile-settings-display">
          <div className="meme-mobile-settings-item">
            <img src={slippage} alt="Slippage" className="meme-mobile-settings-icon" />
            <span className="meme-mobile-settings-value">
              {mobileTradeType === 'buy' ? buySlippageValue : sellSlippageValue}%
            </span>
          </div>
          <div className="meme-mobile-settings-item">
            <img src={gas} alt="Priority Fee" className="meme-mobile-settings-icon" />
            <span className="meme-mobile-settings-value">
              {mobileTradeType === 'buy' ? buyPriorityFee : sellPriorityFee}
            </span>
          </div>
        </div>

        {mobileWalletsExpanded && (
          <div className="meme-mobile-wallets-panel">
            <div className="meme-mobile-wallets-header">
              <span className="meme-mobile-wallets-title">Wallets ({subWallets.length})</span>
              <button
                className="meme-mobile-wallets-close"
                onClick={() => setMobileWalletsExpanded(false)}
              >
                <img src={closebutton} alt="Close" className="meme-mobile-wallets-close-icon" />
              </button>
            </div>

            <div className="meme-mobile-wallets-list">
              {subWallets.length === 0 ? (
                <div className="meme-mobile-wallets-empty">
                  <div className="meme-mobile-wallets-empty-text">No wallets available</div>
                  <div className="meme-mobile-wallets-empty-subtitle">Create wallets in Portfolio section</div>
                </div>
              ) : (
                subWallets.map((wallet, index) => {
                  const balance = getMobileWalletBalance(wallet.address);
                  const isActive = isMobileWalletActive(wallet.privateKey);

                  return (
                    <div
                      key={wallet.address}
                      className={`meme-mobile-wallet-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleMobileSetActiveWallet(wallet.privateKey)}
                    >
                      <div className="meme-mobile-wallet-checkbox-container">
                        <input
                          type="checkbox"
                          className="meme-mobile-wallet-checkbox"
                          checked={isActive}
                          onChange={() => handleMobileSetActiveWallet(wallet.privateKey)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className="meme-mobile-wallet-info">
                        <div className="meme-mobile-wallet-name">
                          {getMobileWalletName(wallet.address, index)}
                        </div>
                        <div className="meme-mobile-wallet-address">
                          {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                        </div>
                      </div>

                      <div className="meme-mobile-wallet-balance">
                        <div className={`meme-mobile-wallet-balance-amount ${isBlurred ? 'blurred' : ''}`}>
                          <img src={monadicon} className="meme-mobile-wallet-mon-icon" alt="MON" />
                          {formatNumberWithCommas(balance, 2)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      <QuickBuyWidget
        isOpen={isWidgetOpen}
        onClose={() => setIsWidgetOpen(false)}
        tokenSymbol={token.symbol}
        tokenAddress={tokenAddress}
        tokenPrice={currentPrice}
        buySlippageValue={buySlippageValue}
        buyPriorityFee={buyPriorityFee}
        sellSlippageValue={sellSlippageValue}
        sellPriorityFee={sellPriorityFee}
        sendUserOperationAsync={sendUserOperationAsync}
        account={account}
        setChain={setChain}
        activechain={activechain}
        routerAddress={routerAddress}
        setpopup={setpopup}
        subWallets={subWallets}
        walletTokenBalances={walletTokenBalances}
        activeWalletPrivateKey={activeWalletPrivateKey}
        setOneCTSigner={setOneCTSigner}
        tokenList={tokenList}
        isBlurred={isBlurred}
        terminalRefetch={terminalRefetch}
        userStats={userStats}
        monUsdPrice={monUsdPrice}
        showUSD={showUSD}
        onToggleCurrency={handleToggleCurrency}
      />
    </div>
  );
};

export default MemeInterface;