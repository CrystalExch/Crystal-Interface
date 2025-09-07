import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { encodeFunctionData, decodeFunctionResult } from "viem";
import { settings } from "../../settings";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MaxUint256 } from "ethers";
import QuickBuyWidget from "./QuickBuyWidget/QuickBuyWidget";
import MemeOrderCenter from "./MemeOrderCenter/MemeOrderCenter";
import MemeTradesComponent from "./MemeTradesComponent/MemeTradesComponent";
import MemeChart from "./MemeChart/MemeChart";
import { showLoadingPopup, updatePopup } from '../MemeTransactionPopup/MemeTransactionPopupManager';
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";
import { defaultMetrics } from "../TokenExplorer/TokenData";
import { CrystalRouterAbi } from "../../abis/CrystalRouterAbi";
import { CrystalDataHelperAbi } from "../../abis/CrystalDataHelperAbi";
import { CrystalLaunchpadToken } from "../../abis/CrystalLaunchpadToken";
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
import { Tooltip } from "recharts";

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
  created: string;
  bondingAmount: number;
  volumeDelta: number;
  quote?: number;
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

interface AdvancedOrder {
  enabled: boolean;
  percentage?: string;
  amount?: string;
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
  tokenBalances?: { [key: string]: bigint };
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
  setOneCTSigner?: (privateKey: string) => void;
  refetch?: () => void;
  isBlurred?: boolean;
  forceRefreshAllWallets?: () => void;
}

const MARKET_UPDATE_EVENT = "0xc367a2f5396f96d105baaaa90fe29b1bb18ef54c712964410d02451e67c19d3e";
const TOTAL_SUPPLY = 1e9;
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/104695/test/v0.2.12';
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const PAGE_SIZE = 100;

const HOLDER_FIELDS = `
  address balance amountBought amountSold
  valueBought valueSold valueNet tokenNet
`;

const HOLDERS_QUERY = `
  query ($m: Bytes!, $skip: Int!, $first: Int!) {
    holders(where:{market:$m},
    orderBy: balance,
    orderDirection: desc,
    skip:$skip,
    first:$first) {
      ${HOLDER_FIELDS}
    }
  }
`;

const USER_HOLDER_QUERY = `
  query ($id: ID!){
    holder(id:$id){ ${HOLDER_FIELDS} }
  }
`;

const queryCache = new Map();
const lastRequestTime = { value: 0 };
const MIN_REQUEST_INTERVAL = 2000;

const fmt = (v: number, d = 6) => {
  if (v === 0) return "0";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  if (v >= 1) return v.toLocaleString("en-US", { maximumFractionDigits: d });
  return v.toFixed(Math.min(d, 8));
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
  forceRefreshAllWallets,
}) => {

  const getSliderPosition = (activeView: 'chart' | 'trades' | 'ordercenter') => {
    switch (activeView) {
      case 'chart': return 0;
      case 'trades': return 1;
      case 'ordercenter': return 2;
      default: return 0;
    }
  };

  const { tokenAddress } = useParams<{ tokenAddress: string }>();
  const location = useLocation();
  const [tokenInfoExpanded, setTokenInfoExpanded] = useState(true);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [tradeAmount, setTradeAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteValue, setQuoteValue] = useState<number | undefined>(undefined);
  const [inputCurrency, setInputCurrency] = useState<"MON" | "TOKEN">("MON");
  const [sliderPercent, setSliderPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [slippageValue, _setSlippageValue] = useState("20");
  const [priorityFee, _setPriorityFee] = useState("0.01");
  const [orderCenterHeight, setOrderCenterHeight] = useState<number>(350);
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
  const [selectedBuyPreset, setSelectedBuyPreset] = useState(1);
  const [buySlippageValue, setBuySlippageValue] = useState('20');
  const [buyPriorityFee, setBuyPriorityFee] = useState('0.01');
  const [settingsMode, setSettingsMode] = useState<'buy' | 'sell'>('buy');
  const [selectedSellPreset, setSelectedSellPreset] = useState(1);
  const [sellSlippageValue, setSellSlippageValue] = useState('15');
  const [sellPriorityFee, setSellPriorityFee] = useState('0.005');
  const [tokenBalance, setTokenBalance] = useState(0);
  const [notif, setNotif] = useState<({ title: string; subtitle?: string; variant?: 'success' | 'error' | 'info'; visible?: boolean }) | null>(null);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [page, _setPage] = useState(0);
  const [userStats, setUserStats] = useState({
    balance: 0, amountBought: 0, amountSold: 0,
    valueBought: 0, valueSold: 0, valueNet: 0,
  });

  const [advancedTradingEnabled, setAdvancedTradingEnabled] = useState(false);
  const [showAdvancedDropdown, setShowAdvancedDropdown] = useState(false);
  const [advancedOrders, setAdvancedOrders] = useState<Array<{
    id: string;
    type: 'takeProfit' | 'stopLoss' | 'devSell' | 'migration';
    percentage?: string;
    amount?: string;
  }>>([]);

  // Mobile-specific states
  const [mobileActiveView, setMobileActiveView] = useState<'chart' | 'trades' | 'ordercenter'>('chart');
  const [mobileBuyAmounts, _setMobileBuyAmounts] = useState(['1', '5', '10', '50']);
  const [mobileSellPercents, _setMobileSellPercents] = useState(['10%', '25%', '50%', '100%']);
  const [mobileSelectedBuyAmount, setMobileSelectedBuyAmount] = useState('1');
  const [mobileSelectedSellPercent, setMobileSelectedSellPercent] = useState('25%');
  const [mobileQuickBuyPreset, setMobileQuickBuyPreset] = useState(1);
  const [mobileTradeType, setMobileTradeType] = useState<'buy' | 'sell'>('buy');
  const [mobileWalletsExpanded, setMobileWalletsExpanded] = useState(false);
  const [mobileWalletNames, setMobileWalletNames] = useState<{ [address: string]: string }>({});

  const { activechain } = useSharedContext();

  const balancegetter = settings.chainConfig[activechain].balancegetter;
  const routerAddress = settings.chainConfig[activechain]?.launchpadRouter;
  const HTTP_URL = settings.chainConfig[activechain]?.httpurl;
  const multicallAddress = settings.chainConfig[activechain]?.multicall3;

  const buyPresets = {
    1: { slippage: '20', priority: '0.01' },
    2: { slippage: '15', priority: '0.02'},
    3: { slippage: '10', priority: '0.05'}
  };
  const queryClient = useQueryClient();
  const sellPresets = {
    1: { slippage: '15', priority: '0.005'},
    2: { slippage: '12', priority: '0.01' },
    3: { slippage: '8', priority: '0.03'}
  };

  const userAddr = (address ?? account?.address ?? "").toLowerCase();
  const tokAddr = (tokenAddress ?? "").toLowerCase();
  const BAL_KEY = ["balance-and-allowance", userAddr, tokAddr] as const;

  const { data: rpcData } = useQuery({
    queryKey: BAL_KEY,
    queryFn: async () => {
      const balanceCalldata = encodeFunctionData({
        abi: CrystalDataHelperAbi,
        functionName: "batchBalanceOf",
        args: [
          address as `0x${string}`,
          [tokenAddress as `0x${string}`],
        ],
      });

      const multiCalldata = encodeFunctionData({
        abi: [{
          inputs: [
            { name: "requireSuccess", type: "bool" },
            {
              components: [
                { name: "target", type: "address" },
                { name: "callData", type: "bytes" },
              ],
              name: "calls",
              type: "tuple[]",
            },
          ],
          name: "tryBlockAndAggregate",
          outputs: [
            { name: "blockNumber", type: "uint256" },
            { name: "blockHash", type: "bytes32" },
            {
              components: [
                { name: "success", type: "bool" },
                { name: "returnData", type: "bytes" },
              ],
              name: "returnData",
              type: "tuple[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        }],
        functionName: "tryBlockAndAggregate",
        args: [false, [
          { target: balancegetter, callData: balanceCalldata },
        ]],
      });

      const res = await fetch(HTTP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [
            { to: multicallAddress, data: multiCalldata },
            "latest",
          ],
        }),
      });
      const { result } = await res.json();

      const [, , returnData] = decodeFunctionResult({
        abi: [{
          inputs: [
            { name: "requireSuccess", type: "bool" },
            {
              components: [
                { name: "target", type: "address" },
                { name: "callData", type: "bytes" },
              ],
              name: "calls",
              type: "tuple[]",
            },
          ],
          name: "tryBlockAndAggregate",
          outputs: [
            { name: "blockNumber", type: "uint256" },
            { name: "blockHash", type: "bytes32" },
            {
              components: [
                { name: "success", type: "bool" },
                { name: "returnData", type: "bytes" },
              ],
              name: "returnData",
              type: "tuple[]",
            },
          ],
          stateMutability: "view",
          type: "function",
        }],
        functionName: "tryBlockAndAggregate",
        data: result,
      });

      let rawBalance = 0n;

      if (returnData[0].success) {
        [rawBalance] = decodeFunctionResult({
          abi: CrystalDataHelperAbi,
          functionName: "batchBalanceOf",
          data: returnData[0].returnData,
        });
      }

      return { rawBalance };
    },
    enabled: !!address && !!tokenAddress,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!rpcData) return;
    const { rawBalance } = rpcData;

    const bal = Number(rawBalance.toString()) / 1e18;

    setTokenBalance(bal);
  }, [rpcData]);

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

    const ethToken = tokenList.find(t => t.address === settings.chainConfig[activechain || '']?.eth);
    if (ethToken && balances[ethToken.address]) {
      return Number(balances[ethToken.address]) / 10 ** Number(ethToken.decimals);
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
      if (forceRefreshAllWallets) {
        setTimeout(() => forceRefreshAllWallets(), 200);
      }
    }
  };

  const getCurrentMobileWalletMONBalance = () => {
    if (!activeWalletPrivateKey) return 0;

    const currentWallet = subWallets.find(w => w.privateKey === activeWalletPrivateKey);
    if (!currentWallet) return 0;

    return getMobileWalletBalance(currentWallet.address);
  };

  // Mobile QuickBuy Trading Functions
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

      const op = await sendUserOperationAsync({ uo });

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
        ? (rpcData?.rawBalance && rpcData.rawBalance > 0n ? rpcData.rawBalance - 1n : 0n)
        : ((rpcData?.rawBalance || 0n) * pct) / 100n;

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

      const sellOp = await sendUserOperationAsync({ uo: sellUo });

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

  const baseToken: Token = (() => {
    if (location.state?.tokenData) return location.state.tokenData as Token;
    const t = tokenList.find(
      (x) =>
        x.contractAddress === tokenAddress || x.tokenAddress === tokenAddress,
    );
    if (t) {
      return {
        id: t.id || t.contractAddress,
        tokenAddress: t.contractAddress || t.tokenAddress,
        name: t.name,
        symbol: t.symbol,
        image: t.image,
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
        created: "0h ago",
        bondingAmount: 0,
        volumeDelta: 0,
      };
    }
    return {
      id: tokenAddress || "",
      tokenAddress: tokenAddress || "",
      name: "Unknown Token",
      symbol: "UNKNOWN",
      image: "",
      ...defaultMetrics,
    } as Token;
  })();

  const refetchBalances = useCallback(() => {
    if (!userAddr || !tokAddr) return;
    const key = ["balance-and-allowance", userAddr, tokAddr] as const;
    queryClient.invalidateQueries({ queryKey: key });
    queryClient.refetchQueries({ queryKey: key, type: "active" });
  }, [queryClient, userAddr, tokAddr]);

  const token: Token = { ...baseToken, ...live } as Token;
  const currentPrice = token.price || 0;

  // Rest of your existing useEffect hooks and logic...
  useEffect(() => {
    if (!realtimeCallbackRef.current || !trades.length) return;

    const latestTrade = trades[0];
    const key = token.symbol + 'MON' + (
      selectedInterval === '1d' ? '1D' :
        selectedInterval === '4h' ? '240' :
          selectedInterval === '1h' ? '60' :
            selectedInterval.slice(0, -1)
    );

    const callback = realtimeCallbackRef.current[key];
    if (callback && latestTrade) {
      const bar = {
        time: Date.now(),
        open: latestTrade.price,
        high: latestTrade.price,
        low: latestTrade.price,
        close: latestTrade.price,
        volume: latestTrade.nativeAmount,
      };
      callback(bar);
    }
  }, [trades, selectedInterval, token.symbol]);

  // Data fetching and WebSocket logic (keeping existing implementation)
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
            query ($id: ID!, $seriesId: ID!) {
              launchpadTokens: launchpadTokens(where: { id: $id }) {
                lastPriceNativePerTokenWad
                volumeNative
                buyTxs
                sellTxs
                trades(first: 50, orderBy: block, orderDirection: desc) {
                  id
                  account {id}
                  block
                  isBuy
                  priceNativePerTokenWad
                  amountIn
                  amountOut
                }
              }
              candles: series(id: $seriesId) {
                klines(first: 1000, orderBy: time, orderDirection: desc) {
                  time open high low close baseVolume
                }
              }
            }`,
            variables: {
              id: token.id.toLowerCase(),
              seriesId: `${token.id.toLowerCase()}-${(
                selectedInterval === '1m' ? 60 :
                selectedInterval === '5m' ? 300 :
                selectedInterval === '15m' ? 900 :
                selectedInterval === '1h' ? 3600 :
                selectedInterval === '4h' ? 14400 :
                86400
              )}`
            }
          }),
        });
    
        const data = (await response.json())?.data;
        console.log(data)
        if (isCancelled || !data) return;

        if (data.launchpadTokens?.length) {
          const m = data.launchpadTokens[0];
          setLive(p => ({
            ...p,
            price: Number(m.latestPrice) / 1e18,
            marketCap: (Number(m.latestPrice) / 1e18) * TOTAL_SUPPLY,
            volume24h: Number(m.volume24h) / 1e18,
            buyTransactions: Number(m.buyCount),
            sellTransactions: Number(m.sellCount),
          }));
        }

        if (data.launchpadTokens?.[0]?.trades?.length) {
          const mapped = data.launchpadTokens?.[0]?.trades.map((t: any) => ({
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

        if (data.candles?.klines) {
          const bars = data.candles.klines
            .slice().reverse()
            .map((c: any) => ({
              time: Number(c.time) * 1000,
              open: Number(c.open) / 1e18,
              high: Number(c.high) / 1e18,
              low: Number(c.low) / 1e18,
              close: Number(c.close) / 1e18,
              volume: Number(c.baseVolume) / 1e18,
            }));

          const key = token.symbol + 'MON' + (
            selectedInterval === '1d' ? '1D'
              : selectedInterval === '4h' ? '240'
                : selectedInterval === '1h' ? '60'
                  : selectedInterval.slice(0, -1)
          );

          const intervalMs =
            selectedInterval === '1d' ? 86400_000 :
              selectedInterval === '4h' ? 14_400_000 :
                selectedInterval === '1h' ? 3_600_000 :
                  parseInt(selectedInterval, 10) * 60_000;

          const filled: any[] = [];
          for (let i = 0; i < bars.length; i++) {
            const bar = bars[i]; filled.push(bar);
            const next = bars[i + 1];
            if (next) {
              let t = bar.time + intervalMs;
              while (t < next.time) {
                filled.push({ time: t, open: bar.close, high: bar.close, low: bar.close, close: bar.close, volume: bar.baseVolume });
                t += intervalMs;
              }
            }
          }

          setChartData([filled, key, false]);
        }
      } catch (e) {
        console.error(e);
        setLive(p => ({ ...p, price: 0, marketCap: 0, volume24h: 0, buyTransactions: 0, sellTransactions: 0 }));
        setTrades([]);
      }
    };

    fetchMemeTokenData();
    return () => { isCancelled = true; };
  }, [token.id, selectedInterval]);

  // WebSocket and other data loading logic (keeping existing)
  const lastInvalidateRef = useRef(0);

  const closeNotif = useCallback(() => {
    setNotif((prev) => (prev ? { ...prev, visible: false } : prev));
    setTimeout(() => setNotif(null), 300);
  }, []);

  // Continue with existing data fetching and trading logic...
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
        const caller = `0x${log.topics[1].slice(26)}`;
        const hex = log.data.slice(2);
        const word = (i: number) => BigInt("0x" + hex.slice(i * 64, i * 64 + 64));
        const price = Number(word(2)) / 1e18;
        const isBuy = word(1) > 0n;
        const amounts = word(0);
        const amountIn = Number(amounts >> 128n) / 1e18;
        const amountOut = Number(amounts & ((1n << 128n) - 1n)) / 1e18;
        const counts = word(3);
        const buys = Number(counts >> 128n);
        const sells = Number(counts & ((1n << 128n) - 1n));

        setLive(p => ({
          ...p,
          price,
          marketCap: price * TOTAL_SUPPLY,
          buyTransactions: buys,
          sellTransactions: sells,
          volume24h: (p.volume24h || 0) + (isBuy ? amountIn : amountOut),
        }));

        setTrades(prev => [
          {
            id: `${log.transactionHash}-${log.logIndex}`,
            timestamp: Date.now() / 1000,
            isBuy,
            price,
            nativeAmount: isBuy ? amountIn : amountOut,
            tokenAmount: isBuy ? amountOut : amountIn,
            caller,
          },
          ...prev.slice(0, 99),
        ]);

        setHolders(prev => {
          const idx = prev.findIndex(r => r.address.toLowerCase() === caller.toLowerCase());
          if (idx === -1) return prev;
          const row = { ...prev[idx] };

          if (isBuy) {
            row.amountBought += amountOut;
            row.valueBought += amountIn;
            row.balance += amountOut;
          } else {
            row.amountSold += amountIn;
            row.valueSold += amountOut;
            row.balance -= amountIn;
          }
          row.tokenNet = row.amountBought - row.amountSold;
          row.valueNet = row.valueSold - row.valueBought;

          const copy = [...prev];
          copy[idx] = row;
          return copy;
        });

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
            refetchBalances();
          }
        }
      }
    };

    return () => {
      try { ws.close(); } catch { }
    };
  }, [token.id, tokenAddress, address, refetchBalances]);

  useEffect(() => {
    if (!token.id) return;

    (async () => {
      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: HOLDERS_QUERY,
        }),
      });
  
      const data = await response.json();
      console.log(data)
      if (data?.holders) {
        const top10TotalBalance = data.holders.reduce((sum: number, holder: any) => {
          return sum + (Number(holder.balance) / 1e18);
        }, 0);

        const top10Percentage = (top10TotalBalance / TOTAL_SUPPLY) * 100;
        setTop10HoldingPercentage(top10Percentage);
      }

      if (page === 0) {
        setHolders(
          data.holders.map((h: any) => ({
            address: h.address,
            balance: Number(h.balance) / 1e18,
            amountBought: Number(h.amountBought) / 1e18,
            amountSold: Number(h.amountSold) / 1e18,
            valueBought: Number(h.valueBought) / 1e18,
            valueSold: Number(h.valueSold) / 1e18,
            valueNet: Number(h.valueNet) / 1e18,
            tokenNet: Number(h.tokenNet) / 1e18,
          }))
        );
      } else {
        const response = await fetch(SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query: HOLDERS_QUERY,
          }),
        });
    
        const data = await response.json();

        if (data?.holders) {
          setHolders(
            data.holders.map((h: any) => ({
              address: h.address,
              balance: Number(h.balance) / 1e18,
              amountBought: Number(h.amountBought) / 1e18,
              amountSold: Number(h.amountSold) / 1e18,
              valueBought: Number(h.valueBought) / 1e18,
              valueSold: Number(h.valueSold) / 1e18,
              valueNet: Number(h.valueNet) / 1e18,
              tokenNet: Number(h.tokenNet) / 1e18,
            }))
          );
        }
      }
    })();
  }, [token.id, page]);

  useEffect(() => {
    if (!userAddr || !token.id) return;

    (async () => {
      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: USER_HOLDER_QUERY,
        }),
      });
  
      const data = await response.json();
      if (!data?.holder) {
        setUserStats({ balance: 0, amountBought: 0, amountSold: 0, valueBought: 0, valueSold: 0, valueNet: 0 });
        return;
      }
      const h = data.holder;
      setUserStats({
        balance: Number(h.balance) / 1e18,
        amountBought: Number(h.amountBought) / 1e18,
        amountSold: Number(h.amountSold) / 1e18,
        valueBought: Number(h.valueBought) / 1e18,
        valueSold: Number(h.valueSold) / 1e18,
        valueNet: Number(h.valueNet) / 1e18,
      });
    })();
  }, [userAddr, token.id]);

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

        const op = await sendUserOperationAsync({ uo });

        if (updatePopup) {
          updatePopup(txId, {
            title: `Bought ~${Number(quoteValue ?? 0).toFixed(4)} ${token.symbol}`,
            subtitle: `Spent ${Number(tradeAmount).toFixed(4)} ${inputCurrency}`,
            variant: 'success',
            isLoading: false

          });
        }

      } else {
        if (showLoadingPopup) {
          showLoadingPopup(txId, {
            title: 'Sending transaction...',
            subtitle: `Selling ${tradeAmount} ${token.symbol}`,
            amount: tradeAmount,
            amountUnit: token.symbol
          });
        }

        const amountTokenWei = BigInt(Math.round(parseFloat(tradeAmount) * 1e18));

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
            args: [true, tokenAddress as `0x${string}`, amountTokenWei, 0n],
          }),
          value: 0n,
        };

        const sellOp = await sendUserOperationAsync({ uo: sellUo });

        if (updatePopup) {
          updatePopup(txId, {
            title: `Sold ${Number(tradeAmount).toFixed(4)} ${token.symbol}`,
            subtitle: `Received ≈ ${Number(quoteValue ?? 0).toFixed(4)} MON`,
            variant: 'success',
            isLoading: false
          });
        }
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
  const totalTransactions =
    currentData.buyTransactions + currentData.sellTransactions;
  const totalTraders =
    (token.holders || 0) + (token.proTraders || 0) + (token.kolTraders || 0);
  const buyTxPercentage =
    totalTransactions > 0
      ? (currentData.buyTransactions / totalTransactions) * 100
      : 0;
  const sellTxPercentage =
    totalTransactions > 0
      ? (currentData.sellTransactions / totalTransactions) * 100
      : 0;
  const buyVolume =
    (currentData.volume * currentData.buyVolumePercentage) / 100;
  const sellVolume =
    (currentData.volume * currentData.sellVolumePercentage) / 100;
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
          {/* Desktop: Always show chart and trades side by side */}
          {/* Mobile: Show only the selected view */}
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
            page={page}
            pageSize={PAGE_SIZE}
            currentPrice={currentPrice}
          />
        </div>
      </div>

      {/* Desktop Trade Panel */}
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
              {activeTradeType === 'sell' && (
                <div className="meme-balance-display">
                  <img src={walleticon} className="meme-wallet-icon" /> {formatNumberWithCommas(tokenBalance, 3)} {token.symbol}
                </div>
              )}
              {activeTradeType === 'sell' && (
                <button
                  className="meme-balance-max"
                  onClick={() => setTradeAmount(tokenBalance.toString())}
                >
                  MAX
                </button>
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
                      className={`meme-preset-button ${sliderPercent === preset ? `active ${activeTradeType}` : ""}`}
                      onClick={() => {
                        setSliderPercent(preset);
                        if (activeTradeType == "buy") {
                        }
                        else {
                          const newAmount = (tokenBalance * preset) / 100;
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
                    const newPercent = Math.max(
                      0,
                      sliderPercent - sliderIncrement,
                    );
                    setSliderPercent(newPercent);
                    const newAmount = (1000 * newPercent) / 100;
                    setTradeAmount(newAmount.toString());
                  }}
                  disabled={sliderPercent === 0}
                >
                  −
                </button>
                <div className="meme-increment-display">
                  <div className="meme-increment-amount">
                    {sliderIncrement}%
                  </div>
                </div>
                <button
                  className="meme-increment-button meme-plus"
                  onClick={() => {
                    const newPercent = Math.min(
                      100,
                      sliderPercent + sliderIncrement,
                    );
                    setSliderPercent(newPercent);
                    const newAmount = (1000 * newPercent) / 100;
                    setTradeAmount(newAmount.toString());
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
                  type="range"
                  className={`meme-balance-amount-slider ${isDragging ? "dragging" : ""}`}
                  min="0"
                  max="100"
                  step="1"
                  value={sliderPercent}
                  onChange={(e) => {
                    const percent = parseInt(e.target.value);
                    setSliderPercent(percent);
                    const newAmount = (1000 * percent) / 100;
                    setTradeAmount(newAmount.toString());
                  }}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  style={{
                    background: `linear-gradient(to right, ${activeTradeType === 'buy' ? 'rgb(67, 254, 154)' : 'rgb(235, 112, 112)'
                      } ${sliderPercent}%, rgb(28, 28, 31) ${sliderPercent}%)`,
                  }}
                />
           <div
                  className={`meme-slider-percentage-popup ${isDragging ? "visible" : ""}`}
                  style={{
                    left: `${Math.max(0, Math.min(100, sliderPercent))}%`
                  }}
                >
                  {sliderPercent}%
                </div>
                <div className="meme-balance-slider-marks">
                  {[0, 25, 50, 75, 100].map((markPercent) => (
                    <span
                      className={`meme-balance-slider-mark ${activeTradeType}`}
                      data-active={sliderPercent >= markPercent}
                      data-percentage={markPercent}
                      onClick={() => {
                        setSliderPercent(markPercent);
                        const newAmount = (1000 * markPercent) / 100;
                        setTradeAmount(newAmount.toString());
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

          {/* Advanced Trading Strategy Section - Only show for buy orders */}
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

          {/* Portfolio Stats Section */}
          <div className="meme-portfolio-stats">
            <div className="meme-portfolio-stat">
              <div className="meme-portfolio-label">Bought</div>
              <div className="meme-portfolio-value bought">
                <img className="meme-mobile-monad-icon" src={monadicon} alt="MON" />
                {formatNumberWithCommas(userStats.valueBought, 1)}
              </div>
            </div>
            <div className="meme-portfolio-stat">
              <div className="meme-portfolio-label">Sold</div>
              <div className="meme-portfolio-value sold">
                <img className="meme-mobile-monad-icon" src={monadicon} alt="MON" />

                {formatNumberWithCommas(userStats.valueSold, 1)}
              </div>
            </div>
            <div className="meme-portfolio-stat">
              <div className="meme-portfolio-label">Holding</div>
              <div className="meme-portfolio-value holding">
                <img className="meme-mobile-monad-icon" src={monadicon} alt="MON" />

                {formatNumberWithCommas(userStats.balance, 1)}
              </div>
            </div>
            <div className="meme-portfolio-stat pnl">
              <div className="meme-portfolio-label">PnL</div>
              <div className={`meme-portfolio-value pnl ${userStats.valueNet >= 0 ? 'positive' : 'negative'}`}>
                <img className="meme-mobile-monad-icon" src={monadicon} alt="MON" />

                {userStats.valueNet >= 0 ? '+' : ''}{formatNumberWithCommas(userStats.valueNet, 1)}
                {userStats.valueBought > 0 ? ` (${userStats.valueNet >= 0 ? '+' : ''}${((userStats.valueNet / userStats.valueBought) * 100).toFixed(1)}%)` : ' (0%)'}
              </div>
            </div>
          </div>

        </div>
        <div className="meme-trading-stats-container">
          <div className="meme-trading-stats-row">
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
            </div>
          )}
        </div>
        <div className="meme-token-info-footer">
          <span className="meme-address">
            <img className="meme-contract-icon" src={contract} />
            <span className="meme-address-title">CA:</span>{" "}
            {token.id.slice(0, 24)}...{token.id.slice(-4)}
            <TooltipLabel label={  <svg
                className="meme-address-link"
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
              <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
            </svg>} tooltipText="View on Monad Eplorer"
             />
          </span>
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
                  disabled={!account?.connected || tokenBalance <= 0}
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
        activechain={String(activechain)}
        routerAddress={routerAddress}
        setpopup={setpopup}
        tokenBalances={tokenAddress ? { [tokenAddress]: rpcData?.rawBalance ?? 0n } : {}}
        refetch={refetchBalances}
        subWallets={subWallets}
        walletTokenBalances={walletTokenBalances}
        activeWalletPrivateKey={activeWalletPrivateKey}
        setOneCTSigner={setOneCTSigner}
        tokenList={tokenList}
        isBlurred={isBlurred}
        forceRefreshAllWallets={forceRefreshAllWallets}
      />
    </div>
  );
};

export default MemeInterface;