import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import ChartOrderbookPanel from '../ChartOrderbookPanel/ChartOrderbookPanel';
import OrderCenter from '../OrderCenter/OrderCenter';
import ChartComponent from '../Chart/Chart';
import editicon from "../../assets/edit.png";
import { keccak256, toUtf8Bytes, computeHmac, sha256 } from 'ethers';
import { DataPoint } from '../Chart/utils/chartDataGenerator';
import './Perps.css'
import TooltipLabel from '../TooltipLabel/TooltipLabel';
import { formatTime } from '../../utils/formatTime.ts'
import { formatCommas } from '../../utils/numberDisplayFormat';
import walleticon from '../../assets/wallet_icon.svg'
import { settings } from '../../settings.ts';
// @ts-ignore
import { SignableOrder } from './edgeXsdk/src/starkex-lib'

interface PerpsProps {
  layoutSettings: string;
  orderbookPosition: string;
  windowWidth: any;
  mobileView: any;
  isOrderbookVisible: boolean;
  orderbookWidth: number;
  setOrderbookWidth: any;
  viewMode: 'both' | 'buy' | 'sell';
  setViewMode: any;
  activeTab: 'orderbook' | 'trades';
  setActiveTab: any;
  router: any;
  address: any;
  orderCenterHeight: number;
  setSendTokenIn: any;
  setpopup: (value: number) => void;
  hideMarketFilter?: boolean;
  sortConfig: any;
  onSort: (config: any) => void;
  activeSection: 'balances' | 'orders' | 'tradeHistory' | 'orderHistory';
  setActiveSection: any;
  filter: 'all' | 'buy' | 'sell';
  setFilter: any;
  onlyThisMarket: boolean;
  setOnlyThisMarket: any;
  isPortfolio?: boolean;
  refetch: any;
  sendUserOperationAsync: any;
  setChain: any;
  isBlurred?: boolean;
  isOrderCenterVisible?: boolean;
  openEditOrderPopup: (order: any) => void;
  openEditOrderSizePopup: (order: any) => void;
  wethticker: any;
  ethticker: any;
  memoizedSortConfig: any;
  emptyFunction: any;
  handleSetChain: any;
  sliderIncrement?: number;
  selectedInterval: string;
  setSelectedInterval: any;
  perpsActiveMarketKey: any;
  setperpsActiveMarketKey: any;
  perpsMarketsData: any;
  setPerpsMarketsData: any;
  perpsFilterOptions: any;
  setPerpsFilterOptions: any;
  signMessageAsync: any;
  leverage: string;
  setLeverage: (value: string) => void;
  userLeverage: any;
  setUserLeverage: any;
  signer: any;
  setSigner: any;
  setOrderCenterHeight: (height: number) => void;
  isMarksVisible: any;
  setIsMarksVisible: any;
  setPerpsLimitChase: any;
  perpsLimitChase: any;
  handlePerpsMarketSelect: any;
}

const Perps: React.FC<PerpsProps> = ({
  layoutSettings,
  orderbookPosition,
  windowWidth,
  mobileView,
  isOrderbookVisible,
  orderbookWidth,
  setOrderbookWidth,
  viewMode,
  setViewMode,
  activeTab,
  setActiveTab,
  router,
  address,
  orderCenterHeight,
  hideMarketFilter = false,
  setSendTokenIn,
  setpopup,
  sortConfig,
  onSort,
  activeSection,
  setActiveSection,
  filter,
  setFilter,
  onlyThisMarket,
  setOnlyThisMarket,
  isPortfolio,
  refetch,
  sendUserOperationAsync,
  setChain,
  isBlurred,
  isOrderCenterVisible,
  openEditOrderPopup,
  openEditOrderSizePopup,
  wethticker,
  ethticker,
  memoizedSortConfig,
  emptyFunction,
  handleSetChain,
  sliderIncrement = 10,
  selectedInterval,
  setSelectedInterval,
  perpsActiveMarketKey,
  setperpsActiveMarketKey,
  perpsMarketsData,
  setPerpsMarketsData,
  perpsFilterOptions,
  setPerpsFilterOptions,
  signMessageAsync,
  leverage,
  setLeverage,
  userLeverage,
  setUserLeverage,
  signer,
  setSigner,
  setOrderCenterHeight,
  isMarksVisible,
  setIsMarksVisible,
  setPerpsLimitChase,
  perpsLimitChase,
  handlePerpsMarketSelect
}) => {
  const [isMobileTradeModalOpen, setIsMobileTradeModalOpen] = useState(false);
const [mobileTradeType, setMobileTradeType] = useState<"long" | "short">("long");
  const [exchangeConfig, setExchangeConfig] = useState<any>();
  const [chartData, setChartData] = useState<[DataPoint[], string, boolean]>([[], '', true]);
  const [orderdata, setorderdata] = useState<any>([]);
  const activeMarket = perpsMarketsData[perpsActiveMarketKey] || {};
  const [activeTradeType, setActiveTradeType] = useState<"long" | "short">("long");
  const [activeOrderType, setActiveOrderType] = useState<"Market" | "Limit" | "Scale" | "Stop" | "TP/SL" | "Pro">("Market");
  const [inputString, setInputString] = useState('');
  const [limitPriceString, setlimitPriceString] = useState('');
  const [isLimitEditing, setIsLimitEditing] = useState(false)
  const [maintenanceMargin, setMaintenanceMargin] = useState('0.00');
  const [usedMargin, setUsedMargin] = useState('0.00');
  const [balance, setBalance] = useState('0.00');
  const [upnl, setUpnl] = useState(0)
  const [userFees, setUserFees] = useState(["0.00038", "0.00012"]);
  const [amountIn, setAmountIn] = useState(BigInt(0));
  const [sliderPercent, setSliderPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPerpsPreset, setSelectedPerpsPreset] = useState<number | null>(null);
  const [isPresetEditMode, setIsPresetEditMode] = useState(false);
  const [editingPresetIndex, setEditingPresetIndex] = useState<number | null>(null);
  const [tempPresetValue, setTempPresetValue] = useState('');
  const [isTpSlEnabled, setIsTpSlEnabled] = useState(false);
  const [tpPrice, setTpPrice] = useState("");
  const [isReduceOnly, setIsReduceOnly] = useState(false);
  const [slPrice, setSlPrice] = useState("");
  const [currentPosition, setCurrentPosition] = useState<any>({});
  const [sizeUnit, setSizeUnit] = useState<"USD" | string>("USD");
  const [isSizeUnitDropdownOpen, setIsSizeUnitDropdownOpen] = useState(false);
  const [slippage, setSlippage] = useState(() => {
    const saved = localStorage.getItem('crystal_perps_slippage');
    return saved !== null ? BigInt(saved) : BigInt(9900);
  });
  const [tpPercent, setTpPercent] = useState("");
  const [slPercent, setSlPercent] = useState("");
  const [tpUnit, setTpUnit] = useState<"%" | "$">("%");
  const [slUnit, setSlUnit] = useState<"%" | "$">("%");
  const [isTpUnitDropdownOpen, setIsTpUnitDropdownOpen] = useState(false);
  const [isSlUnitDropdownOpen, setIsSlUnitDropdownOpen] = useState(false);
  const [slippageString, setSlippageString] = useState(() => {
    const saved = localStorage.getItem('crystal_perps_slippage_string');
    return saved !== null ? saved : '1';
  });
  const [timeInForce, setTimeInForce] = useState("GTC");
  const [isTifDropdownOpen, setIsTifDropdownOpen] = useState(false);
  const [isProDropdownOpen, setIsProDropdownOpen] = useState(false);
  const [selectedProOption, setSelectedProOption] = useState<"TP/SL" | "Scale" | "Stop">("Scale");
  const [indicatorStyle, setIndicatorStyle] = useState<{
    width: number;
    left: number;
  }>({ width: 0, left: 0 });
  const [trades, setTrades] = useState<
    [boolean, string, number, string, string][]
  >([]);
  const [spreadData, setSpreadData] = useState<any>({});
  const [obTab, setOBTab] = useState<'orderbook' | 'trades'>(() => {
    const stored = localStorage.getItem('perps_ob_active_tab');

    if (['orderbook', 'trades'].includes(stored ?? '')) {
      return stored as 'orderbook' | 'trades';
    }

    return mobileView === 'trades' ? 'trades' : 'orderbook';
  });
  const [baseInterval, setBaseInterval] = useState<number>(0.1);
  const [obInterval, setOBInterval] = useState<number>(() => {
    const stored = localStorage.getItem(
      `${activeMarket.baseAsset}_ob_interval`,
    );
    return stored !== null ? JSON.parse(stored) : 0.1;
  });
  const [isDragging2, setIsDragging2] = useState(false);
  const [perpsIsLoaded, setPerpsIsLoaded] = useState(false);
  const [leverageIsLoaded, setLeverageIsLoaded] = useState(false);
  const [wsReady, setWsReady] = useState(false);

  const initialMousePosRef = useRef(0);
  const initialWidthRef = useRef(0);
  const widthRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const presetInputRef = useRef<HTMLInputElement>(null);
  const subRefs = useRef<any>([]);

  const marketButtonRef = useRef<HTMLButtonElement>(null);
  const limitButtonRef = useRef<HTMLButtonElement>(null);
  const proButtonRef = useRef<HTMLButtonElement>(null);
  const orderTypesContainerRef = useRef<HTMLDivElement>(null);
  const realtimeCallbackRef = useRef<any>({});
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<any>(null);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const accwsRef = useRef<WebSocket | null>(null);
  const accpingIntervalRef = useRef<any>(null);
  const accreconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const starkPubFromPriv = (privHex: string) => {
    const P = BigInt("0x800000000000011000000000000000000000000000000000000000000000001"), A = 1n;
    const GX = 874739451078007766457464989774322083649278607533249481151382481072868806602n, GY = 152666792071518830868575557812948353041420400780739481342941381225525861407n;
    const mod = (x: bigint) => ((x % P) + P) % P;
    const inv = (x: bigint) => { let a = mod(x), b = P, u = 1n, v = 0n; while (b) { const q = a / b;[a, b] = [b, a - q * b];[u, v] = [v, u - q * v]; } return u < 0n ? u + P : u; };
    const add = (x1: bigint, y1: bigint, x2: bigint, y2: bigint): [bigint, bigint] => { if (!x1 && !y1) return [x2, y2]; if (!x2 && !y2) return [x1, y1]; const m = x1 === x2 && y1 === y2 ? mod((3n * x1 * x1 + A) * inv(2n * y1)) : mod((y2 - y1) * inv(x2 - x1)); const x3 = mod(m * m - x1 - x2), y3 = mod(m * (x1 - x3) - y1); return [x3, y3]; };
    let k = BigInt(privHex.startsWith("0x") ? privHex : "0x" + privHex), rx = 0n, ry = 0n, ax = GX, ay = GY;
    while (k > 0n) { if (k & 1n) [rx, ry] = add(rx, ry, ax, ay);[ax, ay] = add(ax, ay, ax, ay); k >>= 1n; }
    return { privateKey: privHex, publicKey: "0x" + rx.toString(16).padStart(64, "0"), publicKeyY: "0x" + ry.toString(16).padStart(64, "0") };
  };

  function generateApiKeyFromSignature(signature: string): { apiKey: string; apiPassphrase: string; apiSecret: string } {
    try {
      const hexToByteArray = (hex: string) => { hex = hex.replace(/^0x/i, ''); if (hex.length % 2) hex = '0' + hex; const b = new Uint8Array(hex.length / 2); for (let i = 0; i < b.length; i++)b[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16); return b }
      const byteArrayToHex = (a: Uint8Array) => Array.from(a, x => (x & 255).toString(16).padStart(2, '0')).join('')
      const uuidFormat = (k: string) => [k.slice(0, 8), k.slice(8, 12), k.slice(12, 16), k.slice(16, 20), k.slice(20)].join('-')
      const urlBase64Encode = (a: Uint8Array) => ((typeof Buffer !== 'undefined' ? Buffer.from(a).toString('base64') : btoa(String.fromCharCode(...a)))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
      const buf = hexToByteArray(signature)
      const rHashBytes = hexToByteArray(keccak256(buf.slice(0, 32)))
      const sHashBytes = hexToByteArray(keccak256(buf.slice(32, 64)))
      const apiKey = uuidFormat(byteArrayToHex(sHashBytes.slice(0, 16)))
      const apiSecret = urlBase64Encode(rHashBytes.slice(0, 32))
      const apiPassphrase = urlBase64Encode(sHashBytes.slice(16, 32))
      return { apiKey, apiPassphrase, apiSecret }
    } catch (e) { throw new Error(`Failed to generate API key from signature: ${e}`) }
  }

  function buildSignatureBody(payload: Record<string, any>) {
    return Object.keys(payload)
      .sort()
      .map(k => `${k}=${payload[k]}`)
      .join('&')
  }

  const updateIndicatorPosition = useCallback(() => {
    const container = orderTypesContainerRef.current;
    if (!container) return;

    let activeButton: HTMLButtonElement | null = null;

    switch (activeOrderType) {
      case 'Market':
        activeButton = marketButtonRef.current;
        break;
      case 'Limit':
        activeButton = limitButtonRef.current;
        break;
      case 'Scale':
      case 'Stop':
      case 'Pro':
        activeButton = proButtonRef.current;
        break;
    }

    if (activeButton) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      const containerPadding = 13;
      const relativeLeft = buttonRect.left - containerRect.left - containerPadding;

      const indicatorWidth = buttonRect.width;
      const centeredLeft = relativeLeft + (buttonRect.width - indicatorWidth) / 2;

      setIndicatorStyle({
        width: indicatorWidth,
        left: centeredLeft
      });
    }
  }, [activeOrderType]);
  useEffect(() => {
    updateIndicatorPosition();

    const handleResize = () => {
      updateIndicatorPosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicatorPosition]);

  useEffect(() => {
    if (editingPresetIndex !== null && presetInputRef.current) {
      presetInputRef.current.focus();
      presetInputRef.current.select();
    }
  }, [editingPresetIndex]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging2) return;

      e.preventDefault();
      e.stopPropagation();

      const mouseDelta = e.clientX - initialMousePosRef.current;
      const delta = orderbookPosition === 'left' ? mouseDelta : -mouseDelta;
      const newWidth = Math.max(
        250,
        Math.min(
          widthRef.current
            ? widthRef.current.getBoundingClientRect().width / 2
            : 450,
          initialWidthRef.current + delta,
        ),
      );

      setOrderbookWidth(newWidth);
      localStorage.setItem('orderbookWidth', newWidth.toString())
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging2) return;

      e.preventDefault();
      e.stopPropagation();
      setIsDragging2(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      const overlay = document.getElementById('global-drag-overlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }
    };

    if (isDragging2) {
      const overlay = document.createElement('div');
      overlay.id = 'global-drag-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.zIndex = '9999';
      overlay.style.cursor = 'col-resize';
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
  }, [isDragging2, orderbookPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    initialMousePosRef.current = e.clientX;
    initialWidthRef.current = orderbookWidth;
    setIsDragging2(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const [perpsActiveSection, setPerpsActiveSection] = useState<'positions' | 'openOrders' | 'tradeHistory' | 'orderHistory'>(() => {
    const stored = localStorage.getItem('crystal_perps_oc_tab');
    if (['positions', 'openOrders', 'tradeHistory', 'orderHistory'].includes(stored ?? '')) {
      return stored as 'positions' | 'openOrders' | 'tradeHistory' | 'orderHistory';
    }
    return 'positions';
  });

  const isOrderbookLoading = !orderdata || !Array.isArray(orderdata) || orderdata.length < 3;
  const [isVertDragging, setIsVertDragging] = useState(false);
  const initialHeightRef = useRef(0);
  const [fetchedpositions, setfetchedpositions] = useState<any[]>([]);
  const [fetchedorders, setfetchedorders] = useState<any[]>([]);
  const [fetchedtradehistory, setfetchedtradehistory] = useState<any[]>([]);
  const [positions, setpositions] = useState<any[]>([]);
  const [orders, setorders] = useState<any[]>([]);
  const [canceledorders, setcanceledorders] = useState<any[]>([]);
  const [tradehistory, settradehistory] = useState<any[]>([]);
  const [tradesByMarket, settradesByMarket] = useState<any>({});
  const [currentLimitPrice, setCurrentLimitPrice] = useState<number>(0);
  const [isSigning, setIsSigning] = useState(false);
  const [amountsQuote, setAmountsQuote] = useState(() => {
    const stored = localStorage.getItem('perps_ob_amounts_quote');

    return ['Quote', 'Base'].includes(String(stored))
      ? (stored as string)
      : 'Quote';
  });

  // Add this useEffect for vertical dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVertDragging) return;

      e.preventDefault();
      e.stopPropagation();

      const mouseDelta = e.clientY - initialMousePosRef.current;
      const newHeight = Math.max(
        150, // minimum height
        Math.min(
          window.innerHeight - 400, // maximum height (leaves room for chart/orderbook)
          initialHeightRef.current - mouseDelta // subtract because Y increases downward
        )
      );

      // CRITICAL FIX: Actually update the height state!
      setOrderCenterHeight(newHeight);
      localStorage.setItem('perps_orderCenterHeight', newHeight.toString());
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isVertDragging) return;

      e.preventDefault();
      e.stopPropagation();
      setIsVertDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      const overlay = document.getElementById('global-vert-drag-overlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }
    };

    if (isVertDragging) {
      const overlay = document.createElement('div');
      overlay.id = 'global-vert-drag-overlay';
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
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });

      const overlay = document.getElementById('global-vert-drag-overlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }
    };
  }, [isVertDragging, setOrderCenterHeight]); // Add setOrderCenterHeight to dependencies

  const prevAmountsQuote = useRef(amountsQuote)
  const [roundedBuyOrders, setRoundedBuyOrders] = useState<{ orders: any[], key: string, amountsQuote: string }>({ orders: [], key: '', amountsQuote });
  const [roundedSellOrders, setRoundedSellOrders] = useState<{ orders: any[], key: string, amountsQuote: string }>({ orders: [], key: '', amountsQuote });
  const availableBalance = (activeMarket?.oraclePrice ? Math.max((Number(balance) - positions.reduce((t, p) => t + Number(p.margin || 0), 0) + positions.reduce((t, p) => t + Number(p.pnl || 0), 0) - orders.reduce((t, p) => t + Number(p.margin || 0), 0) + ((activeTradeType == "long" == Number(currentPosition?.size ?? 0) < 0) ? Math.abs(Number(currentPosition?.size ?? 0)) * 2 * activeMarket?.oraclePrice / Number(leverage) : 0)), 0) : 0);

  const handleVertMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    initialMousePosRef.current = e.clientY;
    initialHeightRef.current = orderCenterHeight;

    setIsVertDragging(true);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
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

  const handlePresetEditToggle = useCallback(() => {
    setIsPresetEditMode(!isPresetEditMode);
    setEditingPresetIndex(null);
    setTempPresetValue('');
  }, [isPresetEditMode]);

  const handleSliderChange = useCallback((percent: number) => {
    setSliderPercent(percent);
    positionPopup(percent);
    let inputString = Number((Number(availableBalance) * Number(leverage) * percent / 100)) == 0 ? '' : (Math.floor(Number(availableBalance) * Number(leverage) * percent) / 100).toFixed(2)
    setInputString(inputString)
  }, [availableBalance, leverage]);

  const updateLimitAmount = useCallback((price: number, priceFactor: number, displayPriceFactor?: number) => {
    setPerpsLimitChase(false)
    setlimitPriceString(price.toString())
  }, []);

  async function generateSignedOrder(
    size: number,
    side: 'BUY' | 'SELL',
    type: 'MARKET' | 'LIMIT',
    price: number,
    accountId: string,
    contractId: string,
    symbol: string,
    l2PrivateKey: string,
    activeMarket: any,
    userFees: any,
    reduceOnly: any,
  ): Promise<any> {
    const ts = Date.now().toString()
    const l2ExpireTime = (Date.now() + 365 * 24 * 60 * 60 * 1000)
    const l1ExpireTime = (Number(l2ExpireTime) - 9 * 24 * 60 * 60 * 1000)
    const l2Value = type == 'MARKET' ? Math.ceil(((side == 'BUY' ? (price * 10 * size) : Number(activeMarket?.tickSize))) * 100) / 100 : Math.floor(price * size * 100) / 100
    const limitFee = Math.ceil(l2Value * Number(type == 'MARKET' ? userFees[0] : userFees[1])).toString()
    const clientOrderId = Math.random().toString().slice(2).replace(/^0+/, '');
    const l2Nonce = BigInt(sha256(toUtf8Bytes(clientOrderId)).slice(0, 10)).toString()
    const baseRes = Number(activeMarket.starkExResolution)
    const quoteRes = Number(exchangeConfig.global.starkExCollateralCoin.starkExResolution)
    const quantumsAmountSynthetic = (side === 'BUY'
      ? Math.ceil(size * baseRes)
      : Math.floor(size * baseRes)).toString()
    const quantumsAmountCollateral = (side === 'BUY'
      ? Math.ceil(l2Value * quoteRes)
      : Math.floor(l2Value * quoteRes)).toString()
    const quantumsAmountFee = Math.ceil(Number(limitFee) * quoteRes).toString()
    const orderToSign: any = {
      clientId: clientOrderId,
      nonce: l2Nonce,
      positionId: accountId,
      isBuyingSynthetic: side == 'BUY',
      limitFee: limitFee,
      expirationIsoTimestamp: l2ExpireTime,
      quantumsAmountFee,
      quantumsAmountSynthetic,
      quantumsAmountCollateral,
      assetIdSynthetic: activeMarket.starkExSyntheticAssetId,
      assetIdCollateral: exchangeConfig.global.starkExCollateralCoin.starkExAssetId,
    }

    const signable = SignableOrder.fromOrderWithNonce(orderToSign, Number(exchangeConfig.global.starkExChainId))
    const l2Signature = await signable.sign(l2PrivateKey.replace(/^0x/, ''))

    return {
      price: type === 'MARKET' ? '0' : price.toFixed(Math.floor(Math.log10(Number(1 / activeMarket.tickSize)))),
      size: size.toFixed(Math.floor(Math.log10(Math.max(1, 1 / Number(activeMarket?.stepSize))))),
      type,
      timeInForce: type == 'MARKET' ? 'IMMEDIATE_OR_CANCEL' : 'GOOD_TIL_CANCEL',
      reduceOnly,
      isPositionTpsl: false,
      isSetOpenTp: false,
      isSetOpenSl: false,
      accountId,
      contractId,
      side,
      triggerPrice: '',
      triggerPriceType: 'LAST_PRICE',
      clientOrderId,
      expireTime: l1ExpireTime.toString(),
      l2Nonce,
      l2Value: l2Value,
      l2Size: size.toFixed(Math.floor(Math.log10(Math.max(1, 1 / Number(activeMarket?.stepSize))))),
      l2LimitFee: limitFee,
      l2ExpireTime: l2ExpireTime.toString(),
      l2Signature,
      extraType: '',
      extraDataJson: '',
      symbol,
      timestamp: ts
    }
  }

  const handleCancel = async (
    orderId: any,
  ) => {
    if (Object.keys(perpsMarketsData).length == 0) return;
    const payload = {
      accountId: signer.accountId,
      orderIdList: [orderId],
    }
    const ts = Date.now().toString()
    const path = '/api/v1/private/order/cancelOrderById'
    const qs = buildSignatureBody(payload)
    const signature = computeHmac("sha256", Buffer.from(btoa(encodeURI(signer.apiSecret))), toUtf8Bytes(ts + "POST" + path + qs)).slice(2)
    const [metaRes] = await Promise.all([
      fetch(`${settings.perpsEndpoint}/api/v1/private/order/cancelOrderById`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-edgeX-Timestamp": ts,
          "X-edgeX-Signature": signature,
          "X-edgeX-Passphrase": signer.apiPassphrase,
          "X-edgeX-Api-Key": signer.apiKey
        },
        body: JSON.stringify(payload)
      }).then(r => r.json())
    ])
    console.log(metaRes)
  }

  const handleClose = async (
    marketKey: any,
    ordersize: any,
    side: any,
  ) => {
    if (Object.keys(perpsMarketsData).length == 0) return;
    const size = Math.ceil(Number(ordersize) / Number(perpsMarketsData[marketKey]?.stepSize)) * Number(perpsMarketsData[marketKey]?.stepSize)
    const payload = await generateSignedOrder(size, (side === "long" ? "SELL" : "BUY"), "MARKET", Number(perpsMarketsData[marketKey]?.lastPrice), signer.accountId, perpsMarketsData[marketKey].contractId, marketKey, signer.privateKey, perpsMarketsData[marketKey], userFees, true)
    const ts = Date.now().toString()
    const path = '/api/v1/private/order/createOrder'
    const qs = buildSignatureBody(payload)
    const signature = computeHmac("sha256", Buffer.from(btoa(encodeURI(signer.apiSecret))), toUtf8Bytes(ts + "POST" + path + qs)).slice(2)
    const [metaRes] = await Promise.all([
      fetch(`${settings.perpsEndpoint}/api/v1/private/order/createOrder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-edgeX-Timestamp": ts,
          "X-edgeX-Signature": signature,
          "X-edgeX-Passphrase": signer.apiPassphrase,
          "X-edgeX-Api-Key": signer.apiKey
        },
        body: JSON.stringify(payload)
      }).then(r => r.json())
    ])
    console.log(metaRes)
  }

  const handleTrade = async () => {
    if (Object.keys(perpsMarketsData).length == 0) return;
    setIsSigning(true);
    const size = Math.floor(Number(inputString) / (1 + Number(userFees[0])) / Number(activeMarket?.lastPrice) / Number(activeMarket?.stepSize)) * Number(activeMarket?.stepSize)
    const payload = await generateSignedOrder(size, (activeTradeType === "long" ? "BUY" : "SELL"), activeOrderType == "Market" ? "MARKET" : "LIMIT", activeOrderType == "Market" ? Number(activeMarket?.lastPrice) : (activeTradeType == 'long' ? Math.floor(Number(limitPriceString) / Number(activeMarket?.tickSize)) * Number(activeMarket?.tickSize) : Math.ceil(Number(limitPriceString) / Number(activeMarket?.tickSize)) * Number(activeMarket?.tickSize)), signer.accountId, activeMarket.contractId, perpsActiveMarketKey, signer.privateKey, activeMarket, userFees, isReduceOnly)
    const ts = Date.now().toString()
    const path = '/api/v1/private/order/createOrder'
    const qs = buildSignatureBody(payload)
    const signature = computeHmac("sha256", Buffer.from(btoa(encodeURI(signer.apiSecret))), toUtf8Bytes(ts + "POST" + path + qs)).slice(2)
    const [metaRes] = await Promise.all([
      fetch(`${settings.perpsEndpoint}/api/v1/private/order/createOrder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-edgeX-Timestamp": ts,
          "X-edgeX-Signature": signature,
          "X-edgeX-Passphrase": signer.apiPassphrase,
          "X-edgeX-Api-Key": signer.apiKey
        },
        body: JSON.stringify(payload)
      }).then(r => r.json())
    ])
    console.log(metaRes)
    setIsSigning(false);
  }

  const calculateLiquidation = () => {
    if (activeMarket?.lastPrice && (Number(balance) + Number(upnl)) && (Number(inputString) / Number(activeMarket.oraclePrice) + currentPosition?.size)) {
      const liqPrice = (Number(currentPosition.entryPrice) - ((Number(balance) + Number(upnl) - positions.reduce((t, p) => t + Number(p.maintenanceMargin || 0), 0) - currentPosition.pnl) / (currentPosition.direction == 'long' ? Number(currentPosition.size) : -Number(currentPosition.size)) / (1 - (currentPosition.direction == 'long' ? 1 : -1) * currentPosition.mmr))).toFixed((currentPosition.markPrice.toString().split(".")[1] || "").length)
      return liqPrice;
    }
    return '0.00';
    (activeMarket?.lastPrice && (Number(balance) + Number(upnl)) && (Number(inputString) / Number(activeMarket.oraclePrice) + currentPosition)) ? formatCommas(
      Math.max(Number(activeOrderType == 'Limit' ? limitPriceString : activeTradeType == 'long' ? activeMarket.bestAskPrice : activeMarket.bestBidPrice) - ((Number(balance) + Number(upnl) - positions.reduce((t, p) => t + Number(p.maintenanceMargin || 0), 0) - Number(inputString) * parseFloat(activeMarket?.riskTierList.find((t: any) => Number(inputString) <= parseFloat(t.positionValueUpperBound))?.maintenanceMarginRate ?? activeMarket?.riskTierList.at(-1).maintenanceMarginRate)) / ((activeTradeType == 'long' ? Number(inputString) / Number(activeOrderType == 'Limit' ? limitPriceString : activeMarket.bestAskPrice) : -Number(inputString) / Number(activeOrderType == 'Limit' ? limitPriceString : activeMarket.bestBidPrice)) + currentPosition) /
        ((1 - (((activeTradeType == 'long' ? Number(inputString) / Number(activeOrderType == 'Limit' ? limitPriceString : activeMarket.bestAskPrice) : -Number(inputString) / Number(activeOrderType == 'Limit' ? limitPriceString : activeMarket.bestBidPrice)) + currentPosition) > 0 ? 1 : -1) * (parseFloat(activeMarket?.riskTierList?.find((t: any) => Number(inputString) <= parseFloat(t.positionValueUpperBound))?.maintenanceMarginRate ?? activeMarket?.riskTierList?.at(-1).maintenanceMarginRate)))))
        , 0).toFixed((activeMarket.lastPrice.toString().split(".")[1] || "").length)) : '0.00'
  }

  useEffect(() => {
    const percentage =
      Number(availableBalance) == 0
        ? Number(inputString) > 0 ? 100 : 0
        : Math.min(
          100,
          Math.floor(
            Number(inputString) * 100 / (Number(availableBalance) * Number(leverage))
          ),
        );
    setSliderPercent(percentage);
    const slider = document.querySelector(
      '.perps-balance-amount-slider',
    );
    const popup = document.querySelector(
      '.perps-slider-percentage-popup',
    );
    if (slider && popup) {
      const rect = slider.getBoundingClientRect();
      (popup as HTMLElement).style.left = `${(rect.width - 15) * (percentage / 100) + 15 / 2
        }px`;
    }
  }, [availableBalance, leverage])

  useEffect(() => {
    if (perpsLimitChase && !isLimitEditing) {
      if (activeMarket?.bestBidPrice) {
        const tick = Number(activeMarket.tickSize)
        const precision = Math.floor(Math.log10(1 / tick))
        const mid = (Number(activeMarket.bestBidPrice) + Number(activeMarket.bestAskPrice)) / 2
        setlimitPriceString((activeTradeType == 'long' ? Math.floor(mid / tick) * tick : Math.ceil(mid / tick) * tick).toFixed(precision))
      }
      /* if (false && activeOrderType == 'Limit') {
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
      else if (activeOrderType == 'Limit') {
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
      } */
    }
  }, [perpsLimitChase, activeOrderType, activeTradeType, perpsMarketsData?.[perpsActiveMarketKey]?.bestBidPrice, perpsMarketsData?.[perpsActiveMarketKey]?.bestAskPrice, perpsActiveMarketKey, isLimitEditing]);

  useEffect(() => {
    if (Object.keys(perpsMarketsData).length == 0) return;
    let tempupnl = 0
    let temppositions: any = []
    let temporders: any = []
    let tempcurrentposition: any = {}

    for (const position of fetchedpositions) {
      const marketData = (Object.values(perpsMarketsData).find((v: any) => v.contractId == position.contractId) as any)
      tempupnl += Number(marketData?.oraclePrice) * Number(position.openSize) - Number(position.openValue)
      const positionValue = Math.abs(Number(marketData?.oraclePrice) * Number(position.openSize));
      if (marketData.contractName == perpsActiveMarketKey) {
        tempcurrentposition = {
          leverage: userLeverage?.[marketData?.contractId]?.maxLeverage ? userLeverage?.[marketData?.contractId]?.maxLeverage : marketData?.displayMaxLeverage,
          image: marketData?.iconURL,
          direction: position.openSize > 0 ? 'long' : 'short',
          symbol: marketData.contractName,
          size: Math.abs(position.openSize).toString(),
          positionValue: positionValue,
          entryPrice: (Number(position.openValue) / Number(position.openSize)).toFixed((marketData?.lastPrice?.toString().split(".")[1] || "").length),
          markPrice: Number(marketData?.oraclePrice).toFixed((marketData?.lastPrice?.toString().split(".")[1] || "").length),
          pnl: Number(marketData?.oraclePrice) * Number(position.openSize) - position.openValue,
          liqPrice: 0,
          margin: positionValue / (userLeverage?.[marketData?.contractId]?.maxLeverage ? userLeverage?.[marketData?.contractId]?.maxLeverage : marketData?.displayMaxLeverage),
          funding: -Number(position.fundingFee),
          maintenanceMargin: Math.abs(position.openValue) * parseFloat(marketData?.riskTierList.find((t: any) => Math.abs(position.openValue) <= parseFloat(t.positionValueUpperBound))?.maintenanceMarginRate ?? marketData?.riskTierList.at(-1).maintenanceMarginRate),
          mmr: parseFloat(marketData?.riskTierList.find((t: any) => Math.abs(position.openValue) <= parseFloat(t.positionValueUpperBound))?.maintenanceMarginRate ?? marketData?.riskTierList.at(-1).maintenanceMarginRate)
        }
      }

      temppositions.push({
        leverage: userLeverage?.[marketData?.contractId]?.maxLeverage ? userLeverage?.[marketData?.contractId]?.maxLeverage : marketData?.displayMaxLeverage,
        image: marketData?.iconURL,
        direction: position.openSize > 0 ? 'long' : 'short',
        symbol: marketData.contractName,
        size: Math.abs(position.openSize).toString(),
        positionValue: positionValue,
        entryPrice: (Number(position.openValue) / Number(position.openSize)).toFixed((marketData?.lastPrice?.toString().split(".")[1] || "").length),
        markPrice: Number(marketData?.oraclePrice).toFixed((marketData?.lastPrice?.toString().split(".")[1] || "").length),
        pnl: Number(marketData?.oraclePrice) * Number(position.openSize) - position.openValue,
        liqPrice: 0,
        margin: positionValue / (userLeverage?.[marketData?.contractId]?.maxLeverage ? userLeverage?.[marketData?.contractId]?.maxLeverage : marketData?.displayMaxLeverage),
        funding: -Number(position.fundingFee),
        maintenanceMargin: Math.abs(position.openValue) * parseFloat(marketData?.riskTierList.find((t: any) => Math.abs(position.openValue) <= parseFloat(t.positionValueUpperBound))?.maintenanceMarginRate ?? marketData?.riskTierList.at(-1).maintenanceMarginRate),
        mmr: parseFloat(marketData?.riskTierList.find((t: any) => Math.abs(position.openValue) <= parseFloat(t.positionValueUpperBound))?.maintenanceMarginRate ?? marketData?.riskTierList.at(-1).maintenanceMarginRate)
      })
    }

    for (const order of fetchedorders) {
      const marketData = (Object.values(perpsMarketsData).find((v: any) => v.contractId == order.contractId) as any)
      const orderValue = Number(order.price) * Number(order.size);
      temporders.push({
        leverage: order.maxLeverage,
        image: marketData?.iconURL,
        direction: order.side == "BUY" ? 'long' : 'short',
        symbol: marketData.contractName,
        filledSize: order.cumMatchSize,
        size: order.size,
        orderValue: orderValue,
        price: Number(order.price).toFixed((order.price?.toString().split(".")[1] || "").length),
        markPrice: Number(marketData?.oraclePrice).toFixed((order.price?.toString().split(".")[1] || "").length),
        time: Number(order.createdTime) / 1000,
        type: order.type,
        reduceOnly: order.reduceOnly,
        margin: orderValue / (userLeverage?.[marketData?.contractId]?.maxLeverage ? userLeverage?.[marketData?.contractId]?.maxLeverage : marketData?.displayMaxLeverage),
        id: order.id,
      })
    }
    const tempmaintenancemargin = positions.reduce((t, p) => t + Number(p.maintenanceMargin || 0), 0)
    for (const position of temppositions) {
      position.liqPrice = (Number(position.entryPrice) - ((Number(balance) + Number(tempupnl) - tempmaintenancemargin - position.pnl) / (position.direction == 'long' ? Number(position.size) : -Number(position.size)) / (1 - (position.direction == 'long' ? 1 : -1) * position.mmr))).toFixed((position.markPrice.toString().split(".")[1] || "").length)
    }

    setUpnl(isNaN(tempupnl) ? 0 : tempupnl)
    setpositions(temppositions)
    setorders(temporders)
    setCurrentPosition(tempcurrentposition)
  }, [fetchedpositions, fetchedorders, perpsMarketsData, perpsActiveMarketKey])

  useEffect(() => {
    if (!activeMarket?.contractId || (Object.keys(signer).length > 0 && !userLeverage)) return;
    setLeverage(userLeverage?.[activeMarket?.contractId]?.maxLeverage ? userLeverage?.[activeMarket?.contractId]?.maxLeverage : activeMarket?.displayMaxLeverage)
    setLeverageIsLoaded(true)
  }, [activeMarket?.contractId, userLeverage])

  useEffect(() => {
    if (!orderdata || !Array.isArray(orderdata) || orderdata.length < 3 || orderdata[2] != perpsActiveMarketKey) return

    try {
      const [bids, asks] = orderdata

      let runningBid = 0
      const processedBids = bids.map((o: any) => {
        const sizeVal = amountsQuote == 'Quote' ? o.size * o.price : o.size
        runningBid += sizeVal
        return { ...o, size: sizeVal, totalSize: runningBid, shouldFlash: false }
      })

      let runningAsk = 0
      const processedAsks = asks.map((o: any) => {
        const sizeVal = amountsQuote == 'Quote' ? o.size * o.price : o.size
        runningAsk += sizeVal
        return { ...o, size: sizeVal, totalSize: runningAsk, shouldFlash: false }
      })

      const highestBid = processedBids[0]?.price
      const lowestAsk = processedAsks[0]?.price
      const averagePrice = highestBid !== undefined && lowestAsk !== undefined
        ? (highestBid + lowestAsk) / 2
        : NaN;
      const spread = {
        spread:
          highestBid !== undefined && lowestAsk !== undefined
            ? `${(((lowestAsk - highestBid) / averagePrice) * 100).toFixed(2)}%`
            : NaN,
        averagePrice:
          highestBid !== undefined && lowestAsk !== undefined
            ? formatCommas(((highestBid + lowestAsk) / 2).toFixed(Math.floor(Math.log10(1 / Number(activeMarket.tickSize)))))
            : NaN,
      }
      if (prevAmountsQuote.current == amountsQuote) {
        const prevBuyMap = new Map(
          roundedBuyOrders?.orders?.map((o: any, i: number) => [
            `${o.price}_${o.size}`,
            i,
          ])
        )
        const prevSellMap = new Map(
          roundedSellOrders?.orders?.map((o: any, i: number) => [
            `${o.price}_${o.size}`,
            i,
          ])
        )

        for (let i = 0; i < processedBids.length; i++) {
          const prevIndex = prevBuyMap.get(
            `${processedBids[i].price}_${processedBids[i].size}`
          )
          if (prevIndex === undefined || (i === 0 && prevIndex !== 0)) {
            processedBids[i].shouldFlash = true
          }
        }

        for (let i = 0; i < processedAsks.length; i++) {
          const prevIndex = prevSellMap.get(
            `${processedAsks[i].price}_${processedAsks[i].size}`
          )
          if (prevIndex === undefined || (i === 0 && prevIndex !== 0)) {
            processedAsks[i].shouldFlash = true
          }
        }
        setSpreadData(spread)
        setBaseInterval(Number(activeMarket.tickSize));
        setOBInterval(
          localStorage.getItem(`${activeMarket.baseAsset}_ob_interval`)
            ? Number(
              localStorage.getItem(
                `${activeMarket.baseAsset}_ob_interval`,
              ),
            )
            : Number(activeMarket.tickSize)
        );
      }
      setRoundedBuyOrders({ orders: processedBids, key: orderdata[2], amountsQuote })
      setRoundedSellOrders({ orders: processedAsks, key: orderdata[2], amountsQuote })
      prevAmountsQuote.current = amountsQuote
    } catch (e) {
      console.error(e)
    }
  }, [orderdata, amountsQuote])

  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !activeMarket?.contractId) return
    setPerpsIsLoaded(true)
    setInputString('')
    setSliderPercent(0);
    const slider = document.querySelector(
      '.perps-balance-amount-slider',
    );
    const popup = document.querySelector(
      '.perps-slider-percentage-popup',
    );
    if (slider && popup) {
      const rect = slider.getBoundingClientRect();
      (popup as HTMLElement).style.left = `${(rect.width - 15) * (0 / 100) + 15 / 2
        }px`;
    }
    const subs = [
      `depth.${activeMarket.contractId}.200`,
      `trades.${activeMarket.contractId}`,
      `kline.LAST_PRICE.${activeMarket.contractId}.${selectedInterval === '1d'
        ? 'DAY_1'
        : selectedInterval === '4h'
          ? 'HOUR_4'
          : selectedInterval === '1h'
            ? 'HOUR_1'
            : 'MINUTE_' + selectedInterval.slice(0, -1)}`
    ]

    const newSubs = new Set(subs)
    const oldSubs = new Set(subRefs.current)

    oldSubs.forEach((channel: any) => {
      if (!newSubs.has(channel)) {
        wsRef.current?.send(JSON.stringify({ type: 'unsubscribe', channel }))
      }
    })

    newSubs.forEach((channel: any) => {
      if (!oldSubs.has(channel)) {
        wsRef.current?.send(JSON.stringify({ type: 'subscribe', channel }))
      }
    })

    subRefs.current = subs

  }, [activeMarket?.contractId, selectedInterval, wsReady])

  useEffect(() => {
    let liveStreamCancelled = false;

    const fetchData = async () => {
      try {
        if (Object.keys(perpsMarketsData).length == 0) {
          const [metaRes, labelsRes] = await Promise.all([
            fetch(`${settings.perpsEndpoint}/api/v1/public/meta/getMetaData`, { method: 'GET', headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
            fetch(`${settings.perpsEndpoint}/api/v1/public/contract-labels`, { method: 'GET', headers: { 'Content-Type': 'application/json' } }).then(r => r.json())
          ])
          if (liveStreamCancelled) return;
          if (metaRes?.data) setExchangeConfig(metaRes.data)
          if (labelsRes?.data) {
            const categoriesMap: Record<string, string[]> = {
              All: metaRes.data.contractList.filter((c: any) => c.enableDisplay == true).flatMap((c: any) => c.contractName),
              ...Object.fromEntries(
                labelsRes.data.map((s: any) => [s.name, s.contracts.map((c: any) => c.contractName)])
              )
            }
            if (metaRes?.data) {
              const coinMap = Object.fromEntries(metaRes.data.coinList.map((c: any) => [c.coinName, c.iconUrl]))
              setPerpsMarketsData(Object.fromEntries(metaRes.data.contractList.filter((c: any) => categoriesMap.All.includes(c.contractName)).map((c: any) => {
                const name = c.contractName.toUpperCase()
                const quote = name.endsWith('USD') ? 'USD' : ''
                const base = quote ? name.replace(quote, '') : name
                return [c.contractName, { ...c, baseAsset: base, quoteAsset: quote, iconURL: coinMap[base] }]
              })))
            }
            setPerpsFilterOptions(categoriesMap)
          }
        }

        /* const tradelogs = result[1].result;
        const orderlogs = result?.[2]?.result;
        const filllogs = result?.[3]?.result;
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
        }) */
      } catch {
      }
    };

    const connectWebSocket = () => {
      if (liveStreamCancelled) return;
      fetchData();
      const endpoint = `wss://quote.edgex.exchange/api/v1/public/ws?timestamp=${Date.now()}`;
      wsRef.current = new WebSocket(endpoint);

      wsRef.current.onopen = async () => {
        setWsReady(true);
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'pong',
              time: Date.now().toString()
            }));
          }
        }, 15000);

        const subs = [
          'ticker.all.1s',
        ]

        subs.forEach((channel: any) => {
          wsRef.current?.send(JSON.stringify({ type: 'subscribe', channel }));
        });
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message?.content?.data) {
          const msg = message?.content?.data;
          if (message.content.channel.startsWith('depth')) {
            if (msg[0].depthType == 'SNAPSHOT') {
              setorderdata([
                msg[0].bids.map((i: any) => ({ ...i, price: Number(i.price), size: Number(i.size) })),
                msg[0].asks.map((i: any) => ({ ...i, price: Number(i.price), size: Number(i.size) })),
                msg[0].contractName
              ])
            }
            else {
              setorderdata((prev: any) => {
                const temporders = [[...prev[0]], [...prev[1]]]

                msg[0].bids.forEach((i: any) => {
                  const price = Number(i.price)
                  const size = Number(i.size)
                  const idx = temporders[0].findIndex(o => o.price === price)

                  if (size === 0 && idx !== -1) {
                    temporders[0].splice(idx, 1)
                  } else if (idx !== -1) {
                    temporders[0][idx].size = size
                  } else if (size > 0) {
                    let insertAt = temporders[0].findIndex(o => o.price < price)
                    if (insertAt === -1) insertAt = temporders[0].length
                    temporders[0].splice(insertAt, 0, { ...i, price, size })
                  }
                })

                msg[0].asks.forEach((i: any) => {
                  const price = Number(i.price)
                  const size = Number(i.size)
                  const idx = temporders[1].findIndex(o => o.price === price)

                  if (size === 0 && idx !== -1) {
                    temporders[1].splice(idx, 1)
                  } else if (idx !== -1) {
                    temporders[1][idx].size = size
                  } else if (size > 0) {
                    let insertAt = temporders[1].findIndex(o => o.price > price)
                    if (insertAt === -1) insertAt = temporders[1].length
                    temporders[1].splice(insertAt, 0, { ...i, price, size })
                  }
                })
                temporders.push(msg[0].contractName)
                return temporders
              })
            }
          }
          else if (message.content.channel.startsWith('trades')) {
            if (message.content.dataType == 'Snapshot') {
              const trades = msg.map((t: any) => {
                const isBuy = !t.isBuyerMaker
                const priceFormatted = formatCommas(t.price)
                const tradeValue = formatCommas(Number(t.value).toFixed(0))
                const time = formatTime(Number(t.time) / 1000)
                return [isBuy, priceFormatted, tradeValue, time]
              })
              setTrades(trades)
            }
            else {
              const trades = msg.map((t: any) => {
                const isBuy = !t.isBuyerMaker
                const priceFormatted = formatCommas(t.price)
                const tradeValue = formatCommas(Number(t.value).toFixed(0))
                const time = formatTime(Number(t.time) / 1000)
                return [isBuy, priceFormatted, tradeValue, time]
              })

              setTrades(prev => [...trades, ...prev].slice(0, 100))
            }
          }
          else if (message.content.channel.startsWith('kline')) {
            if (message.content.dataType == 'Snapshot') {
              const key = msg?.[0].contractName + (msg?.[0].klineType === 'DAY_1'
                ? '1D'
                : msg?.[0].klineType === 'HOUR_4'
                  ? '240'
                  : msg?.[0].klineType === 'HOUR_1'
                    ? '60'
                    : msg?.[0].klineType.startsWith('MINUTE_')
                      ? msg?.[0].klineType.slice('MINUTE_'.length)
                      : msg?.[0].klineType)

              if (realtimeCallbackRef.current[key]) {
                const mapKlines = (klines: any[]) =>
                  klines.map(candle => ({
                    time: Number(candle.klineTime),
                    open: Number(candle.open),
                    high: Number(candle.high),
                    low: Number(candle.low),
                    close: Number(candle.close),
                    volume: Number(candle.value),
                  }))
                realtimeCallbackRef.current[key](mapKlines(msg.reverse())[0]);
              }
            }
            else {
              const key = msg?.[0].contractName + (msg?.[0].klineType === 'DAY_1'
                ? '1D'
                : msg?.[0].klineType === 'HOUR_4'
                  ? '240'
                  : msg?.[0].klineType === 'HOUR_1'
                    ? '60'
                    : msg?.[0].klineType.startsWith('MINUTE_')
                      ? msg?.[0].klineType.slice('MINUTE_'.length)
                      : msg?.[0].klineType)
              if (realtimeCallbackRef.current[key]) {
                const mapKlines = (klines: any[]) =>
                  klines.map(candle => ({
                    time: Number(candle.klineTime),
                    open: Number(candle.open),
                    high: Number(candle.high),
                    low: Number(candle.low),
                    close: Number(candle.close),
                    volume: Number(candle.value),
                  }))
                realtimeCallbackRef.current[key](mapKlines(msg.reverse())[0]);
              }
            }
          }
          else if (message.content.channel.startsWith('ticker')) {
            setPerpsMarketsData((prev: any) =>
              Object.fromEntries(
                Object.entries(prev).map(([name, market]: any) => {
                  const update = message.content.data.find((d: any) => d.contractName === name)
                  return [
                    name,
                    update ? { ...market, ...update } : market
                  ]
                })
              )
            )
          }
          /* let ordersChanged = false;
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
          }) */
        }
      }

      wsRef.current.onclose = () => {
        setWsReady(false);
        subRefs.current = []
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        reconnectIntervalRef.current = setTimeout(() => {
          connectWebSocket();
        }, 500);
      };

      wsRef.current.onerror = (error) => {
        console.error(error);
      };
    };

    connectWebSocket();

    return () => {
      liveStreamCancelled = true;
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (reconnectIntervalRef.current) {
        clearTimeout(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (Object.keys(signer).length == 0) return;
    let liveStreamCancelled = false;

    const fetchData = async () => {
      try {
        const onboardpayload = {
          clientAccountId: "main",
          ethAddress: address,
          l2Key: signer.publicKey,
          l2KeyYCoordinate: signer.publicKeyY,
          onlySignOn: "https://pro.edgex.exchange",
          signature: signer.signature
        }
        const regts = Date.now().toString()
        const regpath = '/api/v1/private/account/registerAccount'
        const payload = {
          clientAccountId: "main",
          l2Key: signer.publicKey,
          l2KeyYCoordinate: signer.publicKeyY
        }
        const regqs = buildSignatureBody(payload)
        const regsig = computeHmac("sha256", Buffer.from(btoa(encodeURI(signer.apiSecret))), toUtf8Bytes(regts + "POST" + regpath + regqs)).slice(2)
        const ts = Date.now().toString()
        const path = '/api/v1/private/account/getAccountPage'
        const qs = 'size=100'
        const signature = computeHmac("sha256", Buffer.from(btoa(encodeURI(signer.apiSecret))), toUtf8Bytes(ts + "GET" + path + qs)).slice(2)
        const [onboardRes, registerRes, metaRes] = await Promise.all([
          fetch(`${settings.perpsEndpoint}/api/v1/public/user/onboardSite`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(onboardpayload)
          }).then(r => r.json()),
          fetch(`${settings.perpsEndpoint}/api/v1/private/account/registerAccount`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-edgeX-Timestamp": regts,
              "X-edgeX-Signature": regsig,
              "X-edgeX-Passphrase": signer.apiPassphrase,
              "X-edgeX-Api-Key": signer.apiKey
            },
            body: JSON.stringify(payload)
          }).then(r => r.json()),
          fetch(`${settings.perpsEndpoint}/api/v1/private/account/getAccountPage?size=100`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-edgeX-Timestamp": ts,
              "X-edgeX-Signature": signature,
              "X-edgeX-Passphrase": signer.apiPassphrase,
              "X-edgeX-Api-Key": signer.apiKey
            }
          }).then(r => r.json())
        ])
        if (liveStreamCancelled) return
        if (metaRes?.data?.dataList?.[0]?.defaultTradeSetting && metaRes.data.dataList[0].defaultTradeSetting.takerFeeRate != 0) {
          setUserFees([metaRes.data.dataList[0].defaultTradeSetting.takerFeeRate, metaRes.data.dataList[0].defaultTradeSetting.makerFeeRate])
        }
        return metaRes.data.dataList[0]
      } catch (e) {
        console.log(e)
      }
    };

    const connectWebSocket = async () => {
      const accountInfo = await fetchData();
      if (liveStreamCancelled) return;
      const accountId = accountInfo.id;
      setSigner((prev: any) => ({ ...prev, accountId }))
      const ts = Date.now().toString()
      const path = "/api/v1/private/ws";
      const qs = `accountId=${accountId}&timestamp=${ts}`;
      const endpoint = `wss://quote.edgex.exchange${path}?${qs}`;
      const signature = computeHmac("sha256", Buffer.from(btoa(encodeURI(signer.apiSecret))), toUtf8Bytes(ts + "GET" + path + qs)).slice(2)

      const payload = JSON.stringify({
        "X-edgeX-Timestamp": ts,
        "X-edgeX-Signature": signature,
        "X-edgeX-Passphrase": signer.apiPassphrase,
        "X-edgeX-Api-Key": signer.apiKey
      });

      accwsRef.current = new WebSocket(endpoint, btoa(payload).replace(/=+$/, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_"));

      accwsRef.current.onopen = async () => {
        accpingIntervalRef.current = setInterval(() => {
          if (accwsRef.current?.readyState === WebSocket.OPEN) {
            accwsRef.current.send(JSON.stringify({
              type: 'pong',
              time: Date.now().toString()
            }));
          }
        }, 15000);

        const subs: any = [];

        subs.forEach((channel: any) => {
          accwsRef.current?.send(JSON.stringify({ type: 'subscribe', channel }));
        });
      };

      accwsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log(message)
        if (message?.content?.data) {
          const msg = message?.content?.data;
          if (message.type == 'trade-event') {
            if (message.content.event == 'Snapshot') {
              let balance = Number(msg.collateral[0].amount)
              for (const position of msg.position) {
                balance += Number(position.openValue)
              }
              setfetchedpositions(msg.position)
              setfetchedorders(msg.order)
              setBalance(balance.toFixed(2))
              setUserLeverage(msg.account[0].contractIdToTradeSetting)
            }
            else if (message.content.event == 'TRANSFER_IN_UPDATE') {
              if (msg?.collateral?.[0]?.amount) {
                setBalance(msg.collateral[0].amount)
              }
            }
            else if (message.content.event == 'ORDER_UPDATE') {
              for (const fill of msg?.positionTransaction) {
                setBalance(balance => {
                  return (Number(balance) - Math.abs(Number(fill.realizePnl))).toFixed(2)
                })
              }
              setfetchedpositions(prev => {
                const updated = msg.position || []
                const merged = [...prev]

                for (const pos of updated) {
                  const i = merged.findIndex(p => p.contractId === pos.contractId)
                  if (i !== -1) merged[i] = pos
                  else merged.push(pos)
                }

                return merged.filter(p => parseFloat(p.openValue) !== 0)
              })
              setfetchedorders(prev => {
                const updated = msg.order || []
                const merged = [...prev]

                for (const pos of updated) {
                  const i = merged.findIndex(p => p.clientOrderId === pos.clientOrderId)
                  if (i !== -1) merged[i] = pos
                  else merged.push(pos)
                }

                return merged.filter(p => p.status !== "CANCELED" && p.status !== "FILLED")
              })
            }
          }
        }
      }

      accwsRef.current.onclose = () => {
        if (accpingIntervalRef.current) {
          clearInterval(accpingIntervalRef.current);
          accpingIntervalRef.current = null;
        }
        accreconnectIntervalRef.current = setTimeout(() => {
          connectWebSocket();
        }, 500);
      };

      accwsRef.current.onerror = (error) => {
        console.error(error);
      };
    };

    connectWebSocket();

    return () => {
      liveStreamCancelled = true;
      if (accpingIntervalRef.current) {
        clearInterval(accpingIntervalRef.current);
        accpingIntervalRef.current = null;
      }
      if (accwsRef.current) {
        accwsRef.current.close();
        accwsRef.current = null;
      }
      if (accreconnectIntervalRef.current) {
        clearTimeout(accreconnectIntervalRef.current);
        accreconnectIntervalRef.current = null;
      }
      setUserLeverage()
    };
  }, [signer?.publicKey]);

  const renderChartComponent = useMemo(() => (
    <ChartComponent
      activeMarket={activeMarket}
      tradehistory={tradehistory}
      isMarksVisible={isMarksVisible}
      setIsMarksVisible={setIsMarksVisible}
      orders={orders}
      isOrdersVisible={true}
      showChartOutliers={true}
      setShowChartOutliers={setChartData}
      router={router}
      refetch={refetch}
      sendUserOperationAsync={sendUserOperationAsync}
      setChain={handleSetChain}
      usedRefAddress={'0x0000000000000000000000000000000000000000'}
      data={chartData}
      setData={setChartData}
      realtimeCallbackRef={realtimeCallbackRef}
      limitPrice={0n}
      updateLimitAmount={updateLimitAmount}
      tokenIn={'0x0000000000000000000000000000000000000000'}
      amountIn={BigInt(0)}
      isLimitOrderMode={location.pathname.slice(1) === 'limit'}
      perps={true}
      selectedInterval={selectedInterval}
      setSelectedInterval={setSelectedInterval}
    />
  ), [
    activeMarket,
    tradehistory,
    orders,
    router,
    refetch,
    handleSetChain,
    chartData,
    realtimeCallbackRef,
    updateLimitAmount,
    location.pathname,
    selectedInterval
  ]);

  const tradeModal = (
    <div className="perps-trade-modal">
      <div className="perps-top-section" >
        <div className="perps-order-types-wrapper">
          <div className="perps-order-types" ref={orderTypesContainerRef}>
            <button
              ref={marketButtonRef}
              className={`perps-order-type-button ${activeOrderType === "Market" ? "active" : "inactive"}`}
              onClick={() => setActiveOrderType("Market")}
            >
              Market
            </button>
            <button
              ref={limitButtonRef}
              className={`perps-order-type-button ${activeOrderType === "Limit" ? "active" : "inactive"}`}
              onClick={() => setActiveOrderType("Limit")}
            >
              Limit
            </button>
            <div
              className="perps-pro-button-wrapper"
              tabIndex={-1}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsProDropdownOpen(false);
                }
              }}
            >
              <button
                ref={proButtonRef}
                className={`perps-order-type-button ${(activeOrderType === "Scale" || activeOrderType === "Stop" || activeOrderType === "TP/SL" || activeOrderType === "Pro") ? "active" : "inactive"}`}
                onClick={() => setIsProDropdownOpen(!isProDropdownOpen)}
              >
                {(activeOrderType === "Scale" || activeOrderType === "Stop" || activeOrderType === "TP/SL") ? activeOrderType : "Pro"}
                <svg
                  className={`perps-pro-dropdown-arrow ${isProDropdownOpen ? 'open' : ''}`}
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
              </button>
              {isProDropdownOpen && (
                <div className="perps-pro-dropdown-menu">
                  {['Scale', 'Stop'].map((option) => (
                    <div
                      key={option}
                      className="perps-pro-option"
                      onClick={() => {
                        const typedOption = option as "TP/SL" | "Scale" | "Stop";
                        setSelectedProOption(typedOption);
                        setActiveOrderType(typedOption);
                        setIsProDropdownOpen(false);
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div
              className="perps-sliding-tab-indicator"
              style={{
                width: `${indicatorStyle.width}px`,
                transform: `translateX(${indicatorStyle.left}px)`
              }}
            />
          </div>
        </div>
        <div className="perps-buy-sell-container">
          <button
            className={`perps-long-button ${activeTradeType === "long" ? "active" : "inactive"}`}
            onClick={() => setActiveTradeType("long")}
          >
            Long
          </button>
          <button
            className={`perps-short-button ${activeTradeType === "short" ? "active" : "inactive"}`}
            onClick={() => setActiveTradeType("short")}
          >
            Short
          </button>
        </div>
        <div className="perps-amount-section">
          <div className="perps-available-to-trade">
            <div className="label-container">
              <div className="perps-current-position-container">{t('Current Position')}</div>
            </div>
            <div className={`value-container ${Number(currentPosition?.size) > 0 ? 'positive' : Number(currentPosition?.size) < 0 ? 'negative' : 0}`}>
              {formatCommas(Number(currentPosition?.size ?? 0).toFixed(activeMarket?.stepSize ? (activeMarket?.stepSize.split('.')[1] || '').length : 2)) + (activeMarket?.baseAsset ? ' ' + activeMarket.baseAsset : '')}
            </div>
          </div>
          <div className="perps-available-to-trade">
            <div className="perps-balance-container">
              <img className="perps-wallet-icon" src={walleticon} />
              <div className="balance-value-container">
                {formatCommas(availableBalance.toFixed(2))}
              </div>
            </div>
            <button
              className="leverage-button"
              onClick={() => setpopup(35)}
            >
              {leverage}x
              <img className="leverage-button-icon" src={editicon} />
            </button>
          </div>
          {activeOrderType === "Limit" && (
            <div className="perps-trade-input-wrapper">
              Price
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={limitPriceString}
                onFocus={() => setIsLimitEditing(true)}
                onBlur={() => setIsLimitEditing(false)}
                onChange={(e) => {
                  if (new RegExp(
                    `^\\d*\\.?\\d{0,${Math.floor(Math.log10(Number(1 / activeMarket.tickSize)))}}$`
                  ).test(e.target.value)) {
                    setPerpsLimitChase(false)
                    setlimitPriceString(e.target.value)
                  }
                }}
                className="perps-trade-input"
              />
              <span className="perps-mid-button" onClick={(e) => {
                if (activeMarket?.bestBidPrice) {
                  setPerpsLimitChase(true)
                  const tick = Number(activeMarket.tickSize)
                  const precision = Math.floor(Math.log10(1 / tick))
                  const mid = (Number(activeMarket.bestBidPrice) + Number(activeMarket.bestAskPrice)) / 2
                  setlimitPriceString((activeTradeType == 'long' ? Math.floor(mid / tick) * tick : Math.ceil(mid / tick) * tick).toFixed(precision))
                }
              }}>
                Mid
              </span>
            </div>
          )}
          {activeOrderType === "Stop" && (
            <>
              <div className="perps-trade-input-wrapper">
                <span style={{ whiteSpace: 'nowrap' }}>Stop Price</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={limitPriceString}
                  onFocus={() => setIsLimitEditing(true)}
                  onBlur={() => setIsLimitEditing(false)}
                  onChange={(e) => {
                    if (new RegExp(
                      `^\\d*\\.?\\d{0,${Math.floor(Math.log10(Number(1 / activeMarket.tickSize)))}}$`
                    ).test(e.target.value)) {
                      setPerpsLimitChase(false)
                      setlimitPriceString(e.target.value)
                    }
                  }}
                  className="perps-trade-input"
                />
                <span className="perps-mid-button" onClick={(e) => {
                  if (activeMarket?.bestBidPrice) {
                    setPerpsLimitChase(true)
                    const tick = Number(activeMarket.tickSize)
                    const precision = Math.floor(Math.log10(1 / tick))
                    const mid = (Number(activeMarket.bestBidPrice) + Number(activeMarket.bestAskPrice)) / 2
                    setlimitPriceString((activeTradeType == 'long' ? Math.floor(mid / tick) * tick : Math.ceil(mid / tick) * tick).toFixed(precision))
                  }
                }}>
                  Mid
                </span>
              </div>
            </>
          )}
          <div className="perps-trade-input-wrapper">
            <span style={{ whiteSpace: 'nowrap' }}>Size</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={inputString}
              disabled={!perpsIsLoaded || !leverageIsLoaded}
              onChange={(e) => {
                if (!/^\d*\.?\d{0,18}$/.test(e.target.value)) return;
                setInputString(e.target.value)
                const percentage =
                  Number(availableBalance) == 0
                    ? Number(e.target.value) > 0 ? 100 : 0
                    : Math.min(
                      100,
                      Math.floor(
                        Number(e.target.value) * 100 / (Number(availableBalance) * Number(leverage))
                      ),
                    );
                setSliderPercent(percentage);
                const slider = document.querySelector(
                  '.perps-balance-amount-slider',
                );
                const popup = document.querySelector(
                  '.perps-slider-percentage-popup',
                );
                if (slider && popup) {
                  const rect = slider.getBoundingClientRect();
                  (popup as HTMLElement).style.left = `${(rect.width - 15) * (percentage / 100) + 15 / 2
                    }px`;
                }
              }}
              className="perps-trade-input"
              autoFocus
            />
            <div
              className="perps-size-unit-dropdown"
              tabIndex={-1}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsSizeUnitDropdownOpen(false);
                }
              }}
            >
              <div
                className="perps-size-unit-button"
                onClick={() => setIsSizeUnitDropdownOpen(!isSizeUnitDropdownOpen)}
              >
                <span className="perps-size-unit-value">{sizeUnit}</span>
                <svg
                  className={`perps-size-unit-arrow ${isSizeUnitDropdownOpen ? 'open' : ''}`}
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
              {isSizeUnitDropdownOpen && (
                <div className="perps-size-unit-dropdown-menu">
                  {['USD', activeMarket?.baseAsset || 'BTC'].map((option) => (
                    <div
                      key={option}
                      className="perps-size-unit-option"
                      onClick={() => {
                        setSizeUnit(option);
                        setIsSizeUnitDropdownOpen(false);
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="perps-balance-slider-wrapper">
            <div className="perps-slider-container perps-slider-mode">
              <input
                ref={sliderRef}
                type="range"
                disabled={!perpsIsLoaded || !leverageIsLoaded}
                className={`perps-balance-amount-slider ${isDragging ? "dragging" : ""}`}
                min="0"
                max="100"
                step="1"
                value={sliderPercent}
                onChange={(e) => {
                  const percent = parseInt(e.target.value);
                  handleSliderChange(percent);
                }}
                onMouseDown={() => {
                  setIsDragging(true);
                  positionPopup(sliderPercent);
                }}
                onMouseUp={() => setIsDragging(false)}
                style={{
                  background: `linear-gradient(to right, ${activeTradeType === 'long' ? '#aaaecf' : '#aaaecf'
                    } ${sliderPercent}%, rgb(21 21 27) ${sliderPercent}%)`,
                }}
              />
              <div
                ref={popupRef}
                className={`perps-slider-percentage-popup ${isDragging ? "visible" : ""}`}
              >
                {sliderPercent}%
              </div>

              <div className="perps-balance-slider-marks">
                {[0, 25, 50, 75, 100].map((markPercent) => (
                  <span
                    key={markPercent}
                    className={`perps-balance-slider-mark ${activeTradeType}`}
                    data-active={sliderPercent >= markPercent}
                    data-percentage={markPercent}
                    onClick={() => { if (perpsIsLoaded && leverageIsLoaded) handleSliderChange(markPercent) }}
                  >
                    {markPercent}%
                  </span>
                ))}
              </div>
            </div>
          </div>
          {activeOrderType === "Scale" && (
            <div>
              <div className="perps-scale-start-end-container">
                <div
                  className="scalebgtop"
                >
                  <div className="scalepricecontainer">
                    <span className="scale-order-start-label">{t('start')}</span>
                    <input
                      inputMode="decimal"
                      className="scale-input"
                      placeholder="0.00"
                      value={''}
                    />
                  </div>
                </div>
                <div
                  className="scalebgtop"
                >
                  <div className="scalepricecontainer">
                    <span className="scale-order-end-label">{t('end')}</span>
                    <input
                      inputMode="decimal"
                      className="scale-input"
                      placeholder="0.00"
                      value={''}
                    />
                  </div>
                </div>
              </div>
              <div className="perps-scale-size-skew">
                <div
                  className="scalebottombg"
                >
                  <div className="scalebottomcontainer">
                    <span className="scale-order-total-label">{t('orders')}</span>
                    <input
                      inputMode="numeric" pattern="[0-9]*"
                      className="scale-bottom-input"
                      placeholder="0"
                      value={''}
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
                      placeholder="0.00"
                      value={''}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="perps-tpsl-section">
          <div className="perps-tpsl-header">
            <div>
              <label className="perps-tpsl-checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={isReduceOnly}
                  onChange={(e) => setIsReduceOnly(e.target.checked)}
                  className="perps-tpsl-checkbox"
                />
                <span className="perps-tpsl-label">Reduce Only</span>
              </label>
              <label className="perps-tpsl-checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={isTpSlEnabled}
                  onChange={(e) => setIsTpSlEnabled(e.target.checked)}
                  className="perps-tpsl-checkbox"
                />
                <span className="perps-tpsl-label">TP/SL</span>
              </label>
            </div>
            <div
              className="perps-tif-dropdown"
              tabIndex={-1}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsTifDropdownOpen(false);
                }
              }}
            >
              <div
                className="perps-tif-button"
              >
                <span className="perps-tif-label">TIF</span>
                <div className="perps-tif-inner" onClick={() => setIsTifDropdownOpen(!isTifDropdownOpen)}>
                  <span className="perps-tif-value">{timeInForce}</span>
                  <svg
                    className={`perps-tif-button-arrow ${isTifDropdownOpen ? 'open' : ''}`}
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
              </div>

              {isTifDropdownOpen && (
                <div className="perps-tif-dropdown-menu">
                  {['GTC', 'IOC', 'ALO'].map((option) => (
                    <div
                      key={option}
                      className="perps-tif-option"
                      onClick={() => {
                        setTimeInForce(option);
                        setIsTifDropdownOpen(false);
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isTpSlEnabled && (
            <div className="perps-tpsl-content">
              <div className="perps-tpsl-row">
                <div className="perps-tpsl-label-section">
                  <span className="perps-tpsl-row-label">TP Price</span>
                  <input
                    type="text"
                    placeholder="0"
                    value={tpPrice}
                    onChange={(e) => setTpPrice(e.target.value)}
                    className="perps-tpsl-price-input"
                  />
                </div>
                <div className="perps-tpsl-input-section">
                  <div className="perps-tpsl-percentage">
                    <span className="perps-tpsl-row-label">Gain</span>
                    <input
                      type="text"
                      value={tpPercent}
                      onChange={(e) => setTpPercent(e.target.value)}
                      className="perps-tpsl-percent-input"
                      placeholder='0'
                    />
                  </div>
                  <div
                    className="perps-tpsl-unit-dropdown"
                    tabIndex={-1}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsTpUnitDropdownOpen(false);
                      }
                    }}
                  >
                    <div
                      className="perps-tpsl-unit-button"
                      onClick={() => setIsTpUnitDropdownOpen(!isTpUnitDropdownOpen)}
                    >
                      <span className="perps-tpsl-unit-value">{tpUnit}</span>
                      <svg
                        className={`perps-tpsl-unit-arrow ${isTpUnitDropdownOpen ? 'open' : ''}`}
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
                    {isTpUnitDropdownOpen && (
                      <div className="perps-tpsl-unit-dropdown-menu">
                        {['%', '$'].map((option) => (
                          <div
                            key={option}
                            className="perps-tpsl-unit-option"
                            onClick={() => {
                              setTpUnit(option as "%" | "$");
                              setIsTpUnitDropdownOpen(false);
                            }}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="perps-tpsl-row">
                <div className="perps-tpsl-label-section">
                  <span className="perps-tpsl-row-label">SL Price</span>
                  <input
                    type="text"
                    placeholder="0"
                    value={slPrice}
                    onChange={(e) => setSlPrice(e.target.value)}
                    className="perps-tpsl-price-input"
                  />
                </div>
                <div className="perps-tpsl-input-section">
                  <div className="perps-tpsl-percentage">
                    <span className="perps-tpsl-row-label">Loss</span>
                    <input
                      type="text"
                      value={slPercent}
                      onChange={(e) => setSlPercent(e.target.value)}
                      className="perps-tpsl-percent-input"
                      placeholder='0'
                    />
                  </div>
                  <div
                    className="perps-tpsl-unit-dropdown"
                    tabIndex={-1}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsSlUnitDropdownOpen(false);
                      }
                    }}
                  >
                    <div
                      className="perps-tpsl-unit-button"
                      onClick={() => setIsSlUnitDropdownOpen(!isSlUnitDropdownOpen)}
                    >
                      <span className="perps-tpsl-unit-value">{slUnit}</span>
                      <svg
                        className={`perps-tpsl-unit-arrow ${isSlUnitDropdownOpen ? 'open' : ''}`}
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
                    {isSlUnitDropdownOpen && (
                      <div className="perps-tpsl-unit-dropdown-menu">
                        {['%', '$'].map((option) => (
                          <div
                            key={option}
                            className="perps-tpsl-unit-option"
                            onClick={() => {
                              setSlUnit(option as "%" | "$");
                              setIsSlUnitDropdownOpen(false);
                            }}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="perps-trade-details-section">
          <button
            className={`perps-trade-action-button ${activeTradeType}`}
            onClick={async () => {
              if (!address) {
                setpopup(4)
              }
              else if (Object.keys(signer).length == 0) {
                const signature = await signMessageAsync({ message: "name: edgeX\nenvId: mainnet\naction: L2 Key\nonlySignOn: https://pro.edgex.exchange\nclientAccountId: main" })
                const apiSig = await signMessageAsync({ message: "action: edgeX Onboard\nonlySignOn: https://pro.edgex.exchange" })
                const privateKey = '0x' + (BigInt(keccak256(signature)) >> 5n).toString(16).padStart(64, "0");
                const tempsigner = { ...starkPubFromPriv(privateKey), ...generateApiKeyFromSignature(apiSig), signature: apiSig };
                localStorage.setItem("crystal_perps_signer", JSON.stringify(tempsigner));
                setSigner(tempsigner)
              }
              else {
                await handleTrade();
              }
            }}
            disabled={address && Object.keys(signer).length != 0 && (isSigning || !inputString || Number(inputString) == 0 || (Math.floor(Number(inputString) / (1 + Number(userFees[0])) / Number(activeOrderType == 'Limit' ? limitPriceString : activeMarket?.lastPrice) / Number(activeMarket?.stepSize)) * Number(activeMarket?.stepSize) < Number(activeMarket?.minOrderSize)) || Number(inputString) > (Number(availableBalance) * Number(leverage)))}
          >
            {isSigning ? (
              <div className="perps-button-spinner"></div>
            ) : (address ? (Object.keys(signer).length == 0 ? 'Coming Soon!' : (inputString && (Math.floor(Number(inputString) / (1 + Number(userFees[0])) / Number(activeOrderType == 'Limit' ? limitPriceString : activeMarket?.lastPrice) / Number(activeMarket?.stepSize)) * Number(activeMarket?.stepSize) < Number(activeMarket?.minOrderSize))) ? `Order size must be >${activeMarket?.minOrderSize} ${activeMarket?.baseAsset}` :
              Number(inputString) > (Number(availableBalance) * Number(leverage)) ? 'Insufficient Margin' : activeOrderType === "Market"
                ? `${!activeMarket?.baseAsset ? `Place Order` : (activeTradeType == "long" ? "Long " : "Short ") + activeMarket?.baseAsset}`
                : `${!activeMarket?.baseAsset ? `Place Order` : (activeTradeType == "long" ? "Limit Long " : "Limit Short ") + activeMarket?.baseAsset}`) : 'Connect Wallet'
            )}
          </button>
          <div className="perps-info-rectangle">
            <div className="price-impact">
              <div className="label-container">
                <TooltipLabel
                  label={t('Liquidation Price')}
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
                {calculateLiquidation()}
              </div>
            </div>
            <div className="price-impact">
              <div className="label-container">
                <TooltipLabel
                  label={t('Order Value')}
                  tooltipText={
                    <div>
                      <div className="tooltip-description">
                        {t('The total notional value of your position including leverage. This represents the full exposure of your trade in the market.')}
                      </div>
                    </div>
                  }
                  className="impact-label"
                />
              </div>
              <div className="value-container">
                ${formatCommas((Number(inputString) / (1 + Number(userFees[0]))).toFixed(2))}
              </div>
            </div>
            <div className="price-impact">
              <div className="label-container">
                <TooltipLabel
                  label={t('Margin Required')}
                  tooltipText={
                    <div>
                      <div className="tooltip-description">
                        {t('        The amount of collateral needed to open this position. Calculated as Order Value divided by Leverage. This is the actual amount that will be reserved from your account balance.')}
                      </div>
                    </div>
                  }
                  className="impact-label"
                />
              </div>
              <div className="value-container">
                ${formatCommas((Number(inputString) / (1 + Number(userFees[0])) / Number(leverage)).toFixed(2))}
              </div>
            </div>
            <div className="price-impact">
              <div className="label-container">
                <TooltipLabel
                  label={t('Slippage')}
                  tooltipText={
                    <div>
                      <div className="tooltip-description">
                        {t('slippageHelp')}
                      </div>
                    </div>
                  }
                  className="impact-label"
                />
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
            <div className="price-impact">
              <div className="label-container">
                <TooltipLabel
                  label={t('Fees')}
                  tooltipText={
                    <div>
                      <div className="tooltip-description">
                        {t('takerfeeexplanation')}
                      </div>
                    </div>
                  }
                  className="impact-label"
                />
              </div>
              <div className="value-container">
                {Number(userFees[0]) * 100}% / {Number(userFees[1]) * 100}%
              </div>
            </div>
          </div>

        </div>
      </div>
      <div className="perps-bottom-section" style={{ minHeight: `${orderCenterHeight}px`, maxHeight: `${orderCenterHeight}px` }}>
        <div className="perps-deposit-withdraw-section">
          <button
            className="perps-deposit-button"
            onClick={async () => {
              if (!address) {
                setpopup(4)
              }
              else if (Object.keys(signer).length == 0) {
                const signature = await signMessageAsync({ message: "name: edgeX\nenvId: mainnet\naction: L2 Key\nonlySignOn: https://pro.edgex.exchange\nclientAccountId: main" })
                const apiSig = await signMessageAsync({ message: "action: edgeX Onboard\nonlySignOn: https://pro.edgex.exchange" })
                const privateKey = '0x' + (BigInt(keccak256(signature)) >> 5n).toString(16).padStart(64, "0");
                const tempsigner = { ...starkPubFromPriv(privateKey), ...generateApiKeyFromSignature(apiSig), signature: apiSig };
                localStorage.setItem("crystal_perps_signer", JSON.stringify(tempsigner));
                setSigner(tempsigner)
                setpopup(30)
              }
              else {
                setpopup(30)
              }
            }}
          >
            Deposit
          </button>
          <button
            className="perps-withdraw-button"
            disabled
            onClick={async () => {
              if (!address) {
                setpopup(4)
              }
              else if (Object.keys(signer).length == 0) {
                const signature = await signMessageAsync({ message: "name: edgeX\nenvId: mainnet\naction: L2 Key\nonlySignOn: https://pro.edgex.exchange\nclientAccountId: main" })
                const apiSig = await signMessageAsync({ message: "action: edgeX Onboard\nonlySignOn: https://pro.edgex.exchange" })
                const privateKey = '0x' + (BigInt(keccak256(signature)) >> 5n).toString(16).padStart(64, "0");
                const tempsigner = { ...starkPubFromPriv(privateKey), ...generateApiKeyFromSignature(apiSig), signature: apiSig };
                localStorage.setItem("crystal_perps_signer", JSON.stringify(tempsigner));
                setSigner(tempsigner)
                setpopup(31)
              }
              else {
                setpopup(31)
              }
            }}
          >
            Withdraw
          </button>
        </div>
        <div
          className="perps-account-details"
        >
          <span className="perps-account-section-title" >Account Overview</span>
          <div className="perps-account-row">
            <span className="perps-account-title">
              Total Equity
            </span>
            <span className="perps-account-subtitle">
              ${formatCommas((Number(balance) + Number(upnl)).toFixed(2))}
            </span>
          </div>
          <div className="perps-account-row">
            <span className="perps-account-title">
              Balance
            </span>
            <span className="perps-account-subtitle">
              ${formatCommas(Number(balance).toFixed(2))}
            </span>
          </div>
          <div className="perps-account-row">
            <span className="perps-account-title">
              Unrealized PNL
            </span>
            <span className={`perps-account-subtitle ${Number(upnl) > 0 ? 'green' : Number(upnl) < 0 ? 'red' : ''}`}>
              {Number(upnl) < 0 ? '-' : ''}${formatCommas(Math.abs(Number(upnl)).toFixed(2))}
            </span>
          </div>
          <div className="perps-account-row">
            <span className="perps-account-title">
              Cross Margin Ratio
            </span>
            <span className="perps-account-subtitle">
              {(Number(balance) + Number(upnl)) == 0 ? '0.00' : (positions.reduce((t, p) => t + Number(p.maintenanceMargin || 0), 0) * 100 / (Number(balance) + Number(upnl))).toFixed(2)}%
            </span>
          </div>
          <div className="perps-account-row">
            <span className="perps-account-title">
              Maintenance Margin
            </span>
            <span className="perps-account-subtitle">
              ${formatCommas(positions.reduce((t, p) => t + Number(p.maintenanceMargin || 0), 0).toFixed(2))}
            </span>
          </div>
          <div className="perps-account-row">
            <span className="perps-account-title">
              Cross Account Leverage
            </span>
            <span className="perps-account-subtitle">
              {(Number(balance) + Number(upnl)) == 0 ? '0.00' : (positions.reduce((t, p) => t + Number(p.positionValue || 0), 0) / (Number(balance) + Number(upnl))).toFixed(2)}x
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="main-content-wrapper">
      {layoutSettings === 'alternative' && (
        tradeModal
      )}
      <div className="perps-mobile-bottom-bar">
        <button
          className="perps-mobile-trade-button long"
          onClick={() => {
            setActiveTradeType("long");
            setMobileTradeType("long");
            setIsMobileTradeModalOpen(true);
          }}
        >
          Long
        </button>
        <button
          className="perps-mobile-trade-button short"
          onClick={() => {
            setActiveTradeType("short");
            setMobileTradeType("short");
            setIsMobileTradeModalOpen(true);
          }}
        >
          Short
        </button>
      </div>
      {isMobileTradeModalOpen && (
        <>
          <div 
            className="perps-mobile-modal-overlay"
            onClick={() => setIsMobileTradeModalOpen(false)}
          />
          <div className="perps-mobile-modal-container">
            <div className="perps-mobile-modal-content">
              <div className="perps-buy-sell-container">
                <button
                  className={`perps-long-button ${activeTradeType === "long" ? "active" : "inactive"}`}
                  onClick={() => setActiveTradeType("long")}
                >
                  Long
                </button>
                <button
                  className={`perps-short-button ${activeTradeType === "short" ? "active" : "inactive"}`}
                  onClick={() => setActiveTradeType("short")}
                >
                  Short
                </button>
              </div>
              <div className="perps-order-types-wrapper">
                <div className="perps-order-types" ref={orderTypesContainerRef}>
                  <button
                    ref={marketButtonRef}
                    className={`perps-order-type-button ${activeOrderType === "Market" ? "active" : "inactive"}`}
                    onClick={() => setActiveOrderType("Market")}
                  >
                    Market
                  </button>
                  <button
                    ref={limitButtonRef}
                    className={`perps-order-type-button ${activeOrderType === "Limit" ? "active" : "inactive"}`}
                    onClick={() => setActiveOrderType("Limit")}
                  >
                    Limit
                  </button>
                  <div
                    className="perps-pro-button-wrapper"
                    tabIndex={-1}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsProDropdownOpen(false);
                      }
                    }}
                  >
                    <button
                      ref={proButtonRef}
                      className={`perps-order-type-button ${(activeOrderType === "Scale" || activeOrderType === "Stop" || activeOrderType === "TP/SL" || activeOrderType === "Pro") ? "active" : "inactive"}`}
                      onClick={() => setIsProDropdownOpen(!isProDropdownOpen)}
                    >
                      {(activeOrderType === "Scale" || activeOrderType === "Stop" || activeOrderType === "TP/SL") ? activeOrderType : "Pro"}
                      <svg
                        className={`perps-pro-dropdown-arrow ${isProDropdownOpen ? 'open' : ''}`}
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
                    </button>
                    {isProDropdownOpen && (
                      <div className="perps-pro-dropdown-menu">
                        {['Scale', 'Stop'].map((option) => (
                          <div
                            key={option}
                            className="perps-pro-option"
                            onClick={() => {
                              const typedOption = option as "TP/SL" | "Scale" | "Stop";
                              setSelectedProOption(typedOption);
                              setActiveOrderType(typedOption);
                              setIsProDropdownOpen(false);
                            }}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div
                    className="perps-sliding-tab-indicator"
                    style={{
                      width: `${indicatorStyle.width}px`,
                      transform: `translateX(${indicatorStyle.left}px)`
                    }}
                  />
                </div>
              </div>
              <div className="perps-amount-section">
                <div className="perps-available-to-trade">
                  <div className="label-container">
                    <div className="perps-current-position-container">{t('Current Position')}</div>
                  </div>
                  <div className={`value-container ${Number(currentPosition?.size) > 0 ? 'positive' : Number(currentPosition?.size) < 0 ? 'negative' : 0}`}>
                    {formatCommas(Number(currentPosition?.size ?? 0).toFixed(activeMarket?.stepSize ? (activeMarket?.stepSize.split('.')[1] || '').length : 2)) + (activeMarket?.baseAsset ? ' ' + activeMarket.baseAsset : '')}
                  </div>
                </div>
                <div className="perps-available-to-trade">
                  <div className="perps-balance-container">
                    <img className="perps-wallet-icon" src={walleticon} />
                    <div className="balance-value-container">
                      {formatCommas(availableBalance.toFixed(2))}
                    </div>
                  </div>
                  <button
                    className="leverage-button"
                    onClick={() => setpopup(35)}
                  >
                    {leverage}x
                    <img className="leverage-button-icon" src={editicon} />
                  </button>
                </div>
                {activeOrderType === "Limit" && (
                  <div className="perps-trade-input-wrapper">
                    Price
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={limitPriceString}
                      onFocus={() => setIsLimitEditing(true)}
                      onBlur={() => setIsLimitEditing(false)}
                      onChange={(e) => {
                        if (new RegExp(
                          `^\\d*\\.?\\d{0,${Math.floor(Math.log10(Number(1 / activeMarket.tickSize)))}}$`
                        ).test(e.target.value)) {
                          setPerpsLimitChase(false)
                          setlimitPriceString(e.target.value)
                        }
                      }}
                      className="perps-trade-input"
                    />
                    <span className="perps-mid-button" onClick={(e) => {
                      if (activeMarket?.bestBidPrice) {
                        setPerpsLimitChase(true)
                        const tick = Number(activeMarket.tickSize)
                        const precision = Math.floor(Math.log10(1 / tick))
                        const mid = (Number(activeMarket.bestBidPrice) + Number(activeMarket.bestAskPrice)) / 2
                        setlimitPriceString((activeTradeType == 'long' ? Math.floor(mid / tick) * tick : Math.ceil(mid / tick) * tick).toFixed(precision))
                      }
                    }}>
                      Mid
                    </span>
                  </div>
                )}
                {activeOrderType === "Stop" && (
                  <>
                    <div className="perps-trade-input-wrapper">
                      <span style={{ whiteSpace: 'nowrap' }}>Stop Price</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={limitPriceString}
                        onFocus={() => setIsLimitEditing(true)}
                        onBlur={() => setIsLimitEditing(false)}
                        onChange={(e) => {
                          if (new RegExp(
                            `^\\d*\\.?\\d{0,${Math.floor(Math.log10(Number(1 / activeMarket.tickSize)))}}$`
                          ).test(e.target.value)) {
                            setPerpsLimitChase(false)
                            setlimitPriceString(e.target.value)
                          }
                        }}
                        className="perps-trade-input"
                      />
                      <span className="perps-mid-button" onClick={(e) => {
                        if (activeMarket?.bestBidPrice) {
                          setPerpsLimitChase(true)
                          const tick = Number(activeMarket.tickSize)
                          const precision = Math.floor(Math.log10(1 / tick))
                          const mid = (Number(activeMarket.bestBidPrice) + Number(activeMarket.bestAskPrice)) / 2
                          setlimitPriceString((activeTradeType == 'long' ? Math.floor(mid / tick) * tick : Math.ceil(mid / tick) * tick).toFixed(precision))
                        }
                      }}>
                        Mid
                      </span>
                    </div>
                  </>
                )}
                <div className="perps-trade-input-wrapper">
                  <span style={{ whiteSpace: 'nowrap' }}>Size</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={inputString}
                    disabled={!perpsIsLoaded || !leverageIsLoaded}
                    onChange={(e) => {
                      if (!/^\d*\.?\d{0,18}$/.test(e.target.value)) return;
                      setInputString(e.target.value)
                      const percentage =
                        Number(availableBalance) == 0
                          ? Number(e.target.value) > 0 ? 100 : 0
                          : Math.min(
                            100,
                            Math.floor(
                              Number(e.target.value) * 100 / (Number(availableBalance) * Number(leverage))
                            ),
                          );
                      setSliderPercent(percentage);
                      const slider = document.querySelector(
                        '.perps-balance-amount-slider',
                      );
                      const popup = document.querySelector(
                        '.perps-slider-percentage-popup',
                      );
                      if (slider && popup) {
                        const rect = slider.getBoundingClientRect();
                        (popup as HTMLElement).style.left = `${(rect.width - 15) * (percentage / 100) + 15 / 2
                          }px`;
                      }
                    }}
                    className="perps-trade-input"
                    autoFocus
                  />
                  <div
                    className="perps-size-unit-dropdown"
                    tabIndex={-1}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsSizeUnitDropdownOpen(false);
                      }
                    }}
                  >
                    <div
                      className="perps-size-unit-button"
                      onClick={() => setIsSizeUnitDropdownOpen(!isSizeUnitDropdownOpen)}
                    >
                      <span className="perps-size-unit-value">{sizeUnit}</span>
                      <svg
                        className={`perps-size-unit-arrow ${isSizeUnitDropdownOpen ? 'open' : ''}`}
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
                    {isSizeUnitDropdownOpen && (
                      <div className="perps-size-unit-dropdown-menu">
                        {['USD', activeMarket?.baseAsset || 'BTC'].map((option) => (
                          <div
                            key={option}
                            className="perps-size-unit-option"
                            onClick={() => {
                              setSizeUnit(option);
                              setIsSizeUnitDropdownOpen(false);
                            }}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="perps-balance-slider-wrapper">
                  <div className="perps-slider-container perps-slider-mode">
                    <input
                      ref={sliderRef}
                      type="range"
                      disabled={!perpsIsLoaded || !leverageIsLoaded}
                      className={`perps-balance-amount-slider ${isDragging ? "dragging" : ""}`}
                      min="0"
                      max="100"
                      step="1"
                      value={sliderPercent}
                      onChange={(e) => {
                        const percent = parseInt(e.target.value);
                        handleSliderChange(percent);
                      }}
                      onMouseDown={() => {
                        setIsDragging(true);
                        positionPopup(sliderPercent);
                      }}
                      onMouseUp={() => setIsDragging(false)}
                      style={{
                        background: `linear-gradient(to right, ${activeTradeType === 'long' ? '#aaaecf' : '#aaaecf'
                          } ${sliderPercent}%, rgb(21 21 27) ${sliderPercent}%)`,
                      }}
                    />
                    <div
                      ref={popupRef}
                      className={`perps-slider-percentage-popup ${isDragging ? "visible" : ""}`}
                    >
                      {sliderPercent}%
                    </div>

                    <div className="perps-balance-slider-marks">
                      {[0, 25, 50, 75, 100].map((markPercent) => (
                        <span
                          key={markPercent}
                          className={`perps-balance-slider-mark ${activeTradeType}`}
                          data-active={sliderPercent >= markPercent}
                          data-percentage={markPercent}
                          onClick={() => { if (perpsIsLoaded && leverageIsLoaded) handleSliderChange(markPercent) }}
                        >
                          {markPercent}%
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {activeOrderType === "Scale" && (
                  <div>
                    <div className="perps-scale-start-end-container">
                      <div
                        className="scalebgtop"
                      >
                        <div className="scalepricecontainer">
                          <span className="scale-order-start-label">{t('start')}</span>
                          <input
                            inputMode="decimal"
                            className="scale-input"
                            placeholder="0.00"
                            value={''}
                          />
                        </div>
                      </div>
                      <div
                        className="scalebgtop"
                      >
                        <div className="scalepricecontainer">
                          <span className="scale-order-end-label">{t('end')}</span>
                          <input
                            inputMode="decimal"
                            className="scale-input"
                            placeholder="0.00"
                            value={''}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="perps-scale-size-skew">
                      <div
                        className="scalebottombg"
                      >
                        <div className="scalebottomcontainer">
                          <span className="scale-order-total-label">{t('orders')}</span>
                          <input
                            inputMode="numeric" pattern="[0-9]*"
                            className="scale-bottom-input"
                            placeholder="0"
                            value={''}
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
                            placeholder="0.00"
                            value={''}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="perps-tpsl-section">
                <div className="perps-tpsl-header">
                  <div>
                    <label className="perps-tpsl-checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={isReduceOnly}
                        onChange={(e) => setIsReduceOnly(e.target.checked)}
                        className="perps-tpsl-checkbox"
                      />
                      <span className="perps-tpsl-label">Reduce Only</span>
                    </label>
                    <label className="perps-tpsl-checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={isTpSlEnabled}
                        onChange={(e) => setIsTpSlEnabled(e.target.checked)}
                        className="perps-tpsl-checkbox"
                      />
                      <span className="perps-tpsl-label">TP/SL</span>
                    </label>
                  </div>
                  <div
                    className="perps-tif-dropdown"
                    tabIndex={-1}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsTifDropdownOpen(false);
                      }
                    }}
                  >
                    <div
                      className="perps-tif-button"
                    >
                      <span className="perps-tif-label">TIF</span>
                      <div className="perps-tif-inner" onClick={() => setIsTifDropdownOpen(!isTifDropdownOpen)}>
                        <span className="perps-tif-value">{timeInForce}</span>
                        <svg
                          className={`perps-tif-button-arrow ${isTifDropdownOpen ? 'open' : ''}`}
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
                    </div>

                    {isTifDropdownOpen && (
                      <div className="perps-tif-dropdown-menu">
                        {['GTC', 'IOC', 'ALO'].map((option) => (
                          <div
                            key={option}
                            className="perps-tif-option"
                            onClick={() => {
                              setTimeInForce(option);
                              setIsTifDropdownOpen(false);
                            }}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {isTpSlEnabled && (
                  <div className="perps-tpsl-content">
                    <div className="perps-tpsl-row">
                      <div className="perps-tpsl-label-section">
                        <span className="perps-tpsl-row-label">TP Price</span>
                        <input
                          type="text"
                          placeholder="0"
                          value={tpPrice}
                          onChange={(e) => setTpPrice(e.target.value)}
                          className="perps-tpsl-price-input"
                        />
                      </div>
                      <div className="perps-tpsl-input-section">
                        <div className="perps-tpsl-percentage">
                          <span className="perps-tpsl-row-label">Gain</span>
                          <input
                            type="text"
                            value={tpPercent}
                            onChange={(e) => setTpPercent(e.target.value)}
                            className="perps-tpsl-percent-input"
                            placeholder='0'
                          />
                        </div>
                        <div
                          className="perps-tpsl-unit-dropdown"
                          tabIndex={-1}
                          onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              setIsTpUnitDropdownOpen(false);
                            }
                          }}
                        >
                          <div
                            className="perps-tpsl-unit-button"
                            onClick={() => setIsTpUnitDropdownOpen(!isTpUnitDropdownOpen)}
                          >
                            <span className="perps-tpsl-unit-value">{tpUnit}</span>
                            <svg
                              className={`perps-tpsl-unit-arrow ${isTpUnitDropdownOpen ? 'open' : ''}`}
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
                          {isTpUnitDropdownOpen && (
                            <div className="perps-tpsl-unit-dropdown-menu">
                              {['%', '$'].map((option) => (
                                <div
                                  key={option}
                                  className="perps-tpsl-unit-option"
                                  onClick={() => {
                                    setTpUnit(option as "%" | "$");
                                    setIsTpUnitDropdownOpen(false);
                                  }}
                                >
                                  {option}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="perps-tpsl-row">
                      <div className="perps-tpsl-label-section">
                        <span className="perps-tpsl-row-label">SL Price</span>
                        <input
                          type="text"
                          placeholder="0"
                          value={slPrice}
                          onChange={(e) => setSlPrice(e.target.value)}
                          className="perps-tpsl-price-input"
                        />
                      </div>
                      <div className="perps-tpsl-input-section">
                        <div className="perps-tpsl-percentage">
                          <span className="perps-tpsl-row-label">Loss</span>
                          <input
                            type="text"
                            value={slPercent}
                            onChange={(e) => setSlPercent(e.target.value)}
                            className="perps-tpsl-percent-input"
                            placeholder='0'
                          />
                        </div>
                        <div
                          className="perps-tpsl-unit-dropdown"
                          tabIndex={-1}
                          onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              setIsSlUnitDropdownOpen(false);
                            }
                          }}
                        >
                          <div
                            className="perps-tpsl-unit-button"
                            onClick={() => setIsSlUnitDropdownOpen(!isSlUnitDropdownOpen)}
                          >
                            <span className="perps-tpsl-unit-value">{slUnit}</span>
                            <svg
                              className={`perps-tpsl-unit-arrow ${isSlUnitDropdownOpen ? 'open' : ''}`}
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
                          {isSlUnitDropdownOpen && (
                            <div className="perps-tpsl-unit-dropdown-menu">
                              {['%', '$'].map((option) => (
                                <div
                                  key={option}
                                  className="perps-tpsl-unit-option"
                                  onClick={() => {
                                    setSlUnit(option as "%" | "$");
                                    setIsSlUnitDropdownOpen(false);
                                  }}
                                >
                                  {option}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="perps-trade-details-section">
                <button
                  className={`perps-trade-action-button ${activeTradeType}`}
                  onClick={async () => {
                    if (!address) {
                      setpopup(4)
                    }
                    else if (Object.keys(signer).length == 0) {
                      const signature = await signMessageAsync({ message: "name: edgeX\nenvId: mainnet\naction: L2 Key\nonlySignOn: https://pro.edgex.exchange\nclientAccountId: main" })
                      const apiSig = await signMessageAsync({ message: "action: edgeX Onboard\nonlySignOn: https://pro.edgex.exchange" })
                      const privateKey = '0x' + (BigInt(keccak256(signature)) >> 5n).toString(16).padStart(64, "0");
                      const tempsigner = { ...starkPubFromPriv(privateKey), ...generateApiKeyFromSignature(apiSig), signature: apiSig };
                      localStorage.setItem("crystal_perps_signer", JSON.stringify(tempsigner));
                      setSigner(tempsigner)
                    }
                    else {
                      await handleTrade();
                    }
                  }}
                  disabled={true || address && Object.keys(signer).length != 0 && (isSigning || !inputString || Number(inputString) == 0 || (Math.floor(Number(inputString) / (1 + Number(userFees[0])) / Number(activeOrderType == 'Limit' ? limitPriceString : activeMarket?.lastPrice) / Number(activeMarket?.stepSize)) * Number(activeMarket?.stepSize) < Number(activeMarket?.minOrderSize)) || Number(inputString) > (Number(availableBalance) * Number(leverage)))}
                >
                  {isSigning ? (
                    <div className="perps-button-spinner"></div>
                  ) : (address ? (Object.keys(signer).length == 0 ? 'Coming Soon!' : (inputString && (Math.floor(Number(inputString) / (1 + Number(userFees[0])) / Number(activeOrderType == 'Limit' ? limitPriceString : activeMarket?.lastPrice) / Number(activeMarket?.stepSize)) * Number(activeMarket?.stepSize) < Number(activeMarket?.minOrderSize))) ? `Order size must be >${activeMarket?.minOrderSize} ${activeMarket?.baseAsset}` :
                    Number(inputString) > (Number(availableBalance) * Number(leverage)) ? 'Insufficient Margin' : activeOrderType === "Market"
                      ? `${!activeMarket?.baseAsset ? `Place Order` : (activeTradeType == "long" ? "Long " : "Short ") + activeMarket?.baseAsset}`
                      : `${!activeMarket?.baseAsset ? `Place Order` : (activeTradeType == "long" ? "Limit Long " : "Limit Short ") + activeMarket?.baseAsset}`) : 'Connect Wallet'
                  )}
                </button>
                <div className="perps-info-rectangle">
                  <div className="price-impact">
                    <div className="label-container">
                      <TooltipLabel
                        label={t('Liquidation Price')}
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
                      {calculateLiquidation()}
                    </div>
                  </div>
                  <div className="price-impact">
                    <div className="label-container">
                      <TooltipLabel
                        label={t('Order Value')}
                        tooltipText={
                          <div>
                            <div className="tooltip-description">
                              {t('The total notional value of your position including leverage. This represents the full exposure of your trade in the market.')}
                            </div>
                          </div>
                        }
                        className="impact-label"
                      />
                    </div>
                    <div className="value-container">
                      ${formatCommas((Number(inputString) / (1 + Number(userFees[0]))).toFixed(2))}
                    </div>
                  </div>
                  <div className="price-impact">
                    <div className="label-container">
                      <TooltipLabel
                        label={t('Margin Required')}
                        tooltipText={
                          <div>
                            <div className="tooltip-description">
                              {t('        The amount of collateral needed to open this position. Calculated as Order Value divided by Leverage. This is the actual amount that will be reserved from your account balance.')}
                            </div>
                          </div>
                        }
                        className="impact-label"
                      />
                    </div>
                    <div className="value-container">
                      ${formatCommas((Number(inputString) / (1 + Number(userFees[0])) / Number(leverage)).toFixed(2))}
                    </div>
                  </div>
                  <div className="price-impact">
                    <div className="label-container">
                      <TooltipLabel
                        label={t('Slippage')}
                        tooltipText={
                          <div>
                            <div className="tooltip-description">
                              {t('slippageHelp')}
                            </div>
                          </div>
                        }
                        className="impact-label"
                      />
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
                  <div className="price-impact">
                    <div className="label-container">
                      <TooltipLabel
                        label={t('Fees')}
                        tooltipText={
                          <div>
                            <div className="tooltip-description">
                              {t('takerfeeexplanation')}
                            </div>
                          </div>
                        }
                        className="impact-label"
                      />
                    </div>
                    <div className="value-container">
                      {Number(userFees[0]) * 100}% / {Number(userFees[1]) * 100}%
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </>
      )}
      <div className="chartandorderbookandordercenter">
        <div className="chartandorderbook">
          <ChartOrderbookPanel
            layoutSettings={layoutSettings}
            orderbookPosition={orderbookPosition}
            orderdata={{
              roundedBuyOrders: roundedBuyOrders?.orders,
              roundedSellOrders: roundedSellOrders?.orders,
              spreadData,
              priceFactor: 1 / baseInterval,
              marketType: 0,
              symbolIn: activeMarket?.quoteAsset ?? 'USD',
              symbolOut: activeMarket.baseAsset,
            }}
            windowWidth={windowWidth}
            mobileView={mobileView}
            isOrderbookVisible={isOrderbookVisible}
            orderbookWidth={orderbookWidth}
            setOrderbookWidth={setOrderbookWidth}
            obInterval={obInterval}
            amountsQuote={roundedBuyOrders?.amountsQuote}
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
            reserveQuote={0n}
            reserveBase={0n}
            isOrderbookLoading={isOrderbookLoading}
            perps={true}
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
          orders={[]}
          tradehistory={[]}
          canceledorders={[]}
          router={router}
          address={address}
          trades={tradesByMarket}
          currentMarket={
            perpsActiveMarketKey.replace(
              new RegExp(
                `^${wethticker}|${wethticker}$`,
                'g'
              ),
              ethticker
            )
          }
          orderCenterHeight={orderCenterHeight}
          hideBalances={true}
          tokenList={[]}
          onMarketSelect={handlePerpsMarketSelect}
          setSendTokenIn={setSendTokenIn}
          setpopup={setpopup}
          sortConfig={memoizedSortConfig}
          onSort={emptyFunction}
          tokenBalances={[]}
          activeSection={perpsActiveSection}
          setActiveSection={setPerpsActiveSection}
          filter={filter}
          setFilter={setFilter}
          onlyThisMarket={onlyThisMarket}
          setOnlyThisMarket={setOnlyThisMarket}
          refetch={refetch}
          sendUserOperationAsync={sendUserOperationAsync}
          setChain={handleSetChain}
          isVertDragging={isVertDragging}
          isOrderCenterVisible={isOrderCenterVisible}
          onLimitPriceUpdate={setCurrentLimitPrice}
          openEditOrderPopup={openEditOrderPopup}
          openEditOrderSizePopup={openEditOrderSizePopup}
          marketsData={{}}
          isPerps={true}
          perpsPositions={positions}
          perpsOpenOrders={orders}
          handleClose={handleClose}
          handleCancel={handleCancel}
        />
      </div>
      {layoutSettings === 'default' && (
        tradeModal
      )}
    </div>
  );
};

export default Perps;