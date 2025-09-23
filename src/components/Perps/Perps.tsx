import React, { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import ChartOrderbookPanel from '../ChartOrderbookPanel/ChartOrderbookPanel';
import OrderCenter from '../OrderCenter/OrderCenter';
import ChartComponent from '../Chart/Chart';
import editicon from "../../assets/edit.svg";
import { DataPoint } from '../Chart/utils/chartDataGenerator';
import './Perps.css'
import TooltipLabel from '../TooltipLabel/TooltipLabel';
import { formatTime } from '../../utils/formatTime.ts'
import { formatCommas } from '../../utils/numberDisplayFormat';

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
  tokenList: any[];
  onMarketSelect: (token: any) => void;
  setSendTokenIn: any;
  setpopup: (value: number) => void;
  hideMarketFilter?: boolean;
  sortConfig: any;
  onSort: (config: any) => void;
  tokenBalances: any;
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
  isVertDragging?: boolean;
  isOrderCenterVisible?: boolean;
  openEditOrderPopup: (order: any) => void;
  openEditOrderSizePopup: (order: any) => void;
  wethticker: any;
  ethticker: any;
  memoizedTokenList: any;
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
  tokenList,
  onMarketSelect,
  setSendTokenIn,
  setpopup,
  sortConfig,
  onSort,
  tokenBalances,
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
  isVertDragging,
  isOrderCenterVisible,
  openEditOrderPopup,
  openEditOrderSizePopup,
  wethticker,
  ethticker,
  memoizedTokenList,
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
}) => {

  const [exchangeConfig, setExchangeConfig] = useState();
  const [chartData, setChartData] = useState<[DataPoint[], string, boolean]>([[], '', true]);
  const [orderdata, setorderdata] = useState<any>([]);
  const activeMarket = perpsMarketsData[perpsActiveMarketKey] || {};

  const [activeTradeType, setActiveTradeType] = useState<"long" | "short">("long");
  const [activeOrderType, setActiveOrderType] = useState<"market" | "Limit" | "Pro">("market");

  const [inputString, setInputString] = useState('');
  const [limitPriceString, setlimitPriceString] = useState('');
  const [amountIn, setAmountIn] = useState(BigInt(0));
  const [limitPrice, setlimitPrice] = useState(BigInt(0));
  const [sliderPercent, setSliderPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPerpsPreset, setSelectedPerpsPreset] = useState<number | null>(null);
  const [isPresetEditMode, setIsPresetEditMode] = useState(false);
  const [editingPresetIndex, setEditingPresetIndex] = useState<number | null>(null);
  const [tempPresetValue, setTempPresetValue] = useState('');

  const [isTpSlEnabled, setIsTpSlEnabled] = useState(false);
  const [tpPrice, setTpPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");
  const [tpPercent, setTpPercent] = useState("0.0");
  const [slPercent, setSlPercent] = useState("0.0");

  const [slippage, setSlippage] = useState(() => {
    const saved = localStorage.getItem('crystal_perps_slippage');
    return saved !== null ? BigInt(saved) : BigInt(9900);
  });
  const [slippageString, setSlippageString] = useState(() => {
    const saved = localStorage.getItem('crystal_perps_slippage_string');
    return saved !== null ? saved : '1';
  });

  const [timeInForce, setTimeInForce] = useState("GTC");
  const [isTifDropdownOpen, setIsTifDropdownOpen] = useState(false);

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

  const updateIndicatorPosition = useCallback(() => {
    const container = orderTypesContainerRef.current;
    if (!container) return;

    let activeButton: HTMLButtonElement | null = null;

    switch (activeOrderType) {
      case 'market':
        activeButton = marketButtonRef.current;
        break;
      case 'Limit':
        activeButton = limitButtonRef.current;
        break;
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

const isTokenInfoLoading = !activeMarket.contractId || Object.keys(perpsMarketsData).length === 0;
const isOrderbookLoading = !orderdata || !Array.isArray(orderdata) || orderdata.length < 2;

  const [_isVertDragging, setIsVertDragging] = useState(false);
  const initialHeightRef = useRef(0);
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
    // You can add logic here to calculate trade amount based on balance and percentage
    // const calculatedAmount = (totalBalance * percent) / 100;
    // setTradeAmount(calculatedAmount.toString());
    positionPopup(percent);
  }, [positionPopup]);

  const [orders, setorders] = useState<any[]>([]);
  const [canceledorders, setcanceledorders] = useState<any[]>([]);
  const [tradehistory, settradehistory] = useState<any[]>([]);
  const [tradesByMarket, settradesByMarket] = useState<any>({});
  const [currentLimitPrice, setCurrentLimitPrice] = useState<number>(0);
  const [amountsQuote, setAmountsQuote] = useState(() => {
    const stored = localStorage.getItem('perps_ob_amounts_quote');

    return ['Quote', 'Base'].includes(String(stored))
      ? (stored as string)
      : 'Quote';
  });
  const prevAmountsQuote = useRef(amountsQuote)
  const [roundedBuyOrders, setRoundedBuyOrders] = useState<{ orders: any[], key: string, amountsQuote: string }>({ orders: [], key: '', amountsQuote });
  const [roundedSellOrders, setRoundedSellOrders] = useState<{ orders: any[], key: string, amountsQuote: string }>({ orders: [], key: '', amountsQuote });

  const updateLimitAmount = useCallback((price: number, priceFactor: number, displayPriceFactor?: number) => {
  }, []);

  useEffect(() => {
    return () => {
      setPerpsMarketsData({})
      setPerpsFilterOptions({})
    }
  }, [])

  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    if (!activeMarket?.contractId) return

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

  }, [activeMarket?.contractId, selectedInterval])

  useEffect(() => {
    if (!orderdata || !Array.isArray(orderdata) || orderdata.length < 2) return

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
      const spread = {
        spread:
          highestBid !== undefined && lowestAsk !== undefined
            ? lowestAsk - highestBid
            : NaN,
        averagePrice:
          highestBid !== undefined && lowestAsk !== undefined
            ? (highestBid + lowestAsk) / 2
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
      setRoundedBuyOrders({ orders: processedBids, key: perpsActiveMarketKey, amountsQuote })
      setRoundedSellOrders({ orders: processedAsks, key: perpsActiveMarketKey, amountsQuote })
      prevAmountsQuote.current = amountsQuote
    } catch (e) {
      console.error(e)
    }
  }, [orderdata, amountsQuote, perpsActiveMarketKey])

  useEffect(() => {
    let liveStreamCancelled = false;
    let isAddressInfoFetching = false;
    
    const fetchData = async () => {
      try {
        const [metaRes, labelsRes] = await Promise.all([
          fetch('/api/v1/public/meta/getMetaData', { method: 'GET', headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
          fetch('/api/v1/public/contract-labels', { method: 'GET', headers: { 'Content-Type': 'application/json' } }).then(r => r.json())
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
      const endpoint = `wss://quote.edgex.exchange/api/v1/public/ws?timestamp=${Date.now()}`;
      wsRef.current = new WebSocket(endpoint);

      wsRef.current.onopen = async () => {
        const subscriptionMessages = [
          JSON.stringify({
            type: 'subscribe',
            channel: 'ticker.all.1s',
          })
        ];

        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'pong',
              time: Date.now().toString()
            }));
          }
        }, 15000);

        subscriptionMessages.forEach((message) => {
          wsRef.current?.send(message);
        });
        if (activeMarket?.contractId) {
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
      
          subs.forEach((channel: any) => {
            wsRef.current?.send(JSON.stringify({ type: 'subscribe', channel }))
          })
      
          subRefs.current = subs
        }
        fetchData();
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message?.content?.data) {
          const msg = message?.content?.data;
          if (message.content.channel.startsWith('depth')) {
            if (msg[0].depthType == 'SNAPSHOT') {
              setorderdata([
                msg[0].bids.map((i: any) => ({ ...i, price: Number(i.price), size: Number(i.size) })),
                msg[0].asks.map((i: any) => ({ ...i, price: Number(i.price), size: Number(i.size) }))
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

                return temporders
              })
            }
          }
          else if (message.content.channel.startsWith('trades')) {
            if (message.content.dataType == 'Snapshot') {
              const trades = msg.map((t: any) => {
                  const isBuy = !t.isBuyerMaker
                  const priceFormatted = formatCommas(t.price)
                  const tradeValue = Number(t.value)
                  const time = formatTime(Number(t.time))                
                  return [isBuy, priceFormatted, tradeValue, time]
                })
              setTrades(trades)
            }
            else {
              const trades = msg.map((t: any) => {
                  const isBuy = t.isBuyerMaker
                  const priceFormatted = formatCommas(t.price)
                  const tradeValue = Number(t.value)
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
                      volume: Number(candle.makerBuyValue),
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
                      volume: Number(candle.makerBuyValue),
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
  }, []);

  const renderChartComponent = useMemo(() => (
    <ChartComponent
      activeMarket={activeMarket}
      tradehistory={tradehistory}
      isMarksVisible={true}
      orders={orders}
      isOrdersVisible={true}
      showChartOutliers={true}
      router={router}
      refetch={refetch}
      sendUserOperationAsync={sendUserOperationAsync}
      setChain={handleSetChain}
      usedRefAddress={'0x0000000000000000000000000000000000000000'}
      data={chartData}
      setData={setChartData}
      realtimeCallbackRef={realtimeCallbackRef}
      limitPrice={limitPrice}
      updateLimitAmount={updateLimitAmount}
      tokenIn={'0x0000000000000000000000000000000000000000'}
      amountIn={amountIn}
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
    limitPrice,
    updateLimitAmount,
    amountIn,
    location.pathname,
    selectedInterval
  ]);

  return (
    <div className="main-content-wrapper">
      <div className="chartandorderbookandordercenter">
        <div className="chartandorderbook">
<ChartOrderbookPanel
  layoutSettings={layoutSettings}
  orderbookPosition={orderbookPosition}
  orderdata={{
    roundedBuyOrders: roundedBuyOrders?.orders,
    roundedSellOrders: roundedSellOrders?.orders,
    spreadData,
    priceFactor: Number(1 / activeMarket?.tickSize),
    marketType: 0,
    symbolIn: activeMarket.quoteAsset,
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
          tokenList={memoizedTokenList}
          onMarketSelect={onMarketSelect}
          setSendTokenIn={setSendTokenIn}
          setpopup={setpopup}
          sortConfig={memoizedSortConfig}
          onSort={emptyFunction}
          tokenBalances={tokenBalances}
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
        />
      </div>
      <div className="perps-trade-modal">
        <div className="perps-top-section" >
          <div className="perps-order-types-wrapper">
            <div className="perps-order-types" ref={orderTypesContainerRef}>
              <button
                ref={marketButtonRef}
                className={`perps-order-type-button ${activeOrderType === "market" ? "active" : "inactive"}`}
                onClick={() => setActiveOrderType("market")}
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
              <button
                ref={proButtonRef}
                className={`perps-order-type-button ${activeOrderType === "Pro" ? "active" : "inactive"}`}
                onClick={() => setActiveOrderType("Pro")}
              >
                Pro
              </button>
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
                {t('Available to Trade')}
              </div>
              <div className="value-container">
                $0.00
              </div>
            </div>
            <div className="perps-available-to-trade">
              <div className="label-container">
                {t('Current Position')}
              </div>
              <div className="value-container">
                $0.00
              </div>
            </div>
            {activeOrderType === "Limit" && (
              <div className="perps-trade-input-wrapper">
                Price
                <input
                  type="number"
                  placeholder="0"
                  value={limitPriceString}
                  onChange={(e) => setlimitPriceString(e.target.value)}
                  className="perps-trade-input"
                />
                <span className="perps-mid-button">
                  Mid
                </span>
              </div>
            )}
            <div className="perps-trade-input-wrapper">
              Size
              <input
                type="number"
                placeholder="0"
                value={inputString}
                onChange={(e) => setInputString(e.target.value)}
                className="perps-trade-input"
              />
              USD
            </div>



            <div className="perps-balance-slider-wrapper">
              <div className="perps-slider-container perps-slider-mode">
                <input
                  ref={sliderRef}
                  type="range"
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
                      } ${sliderPercent}%, rgb(28, 28, 31) ${sliderPercent}%)`,
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
                      onClick={() => handleSliderChange(markPercent)}
                    >
                      {markPercent}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="perps-tpsl-section">
            <div className="perps-tpsl-header">
              <div>
                <label className="perps-tpsl-checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={isTpSlEnabled}
                    onChange={(e) => setIsTpSlEnabled(e.target.checked)}
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
              <div className="perps-tif-dropdown">
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
                                            type="number"
                                            placeholder="Enter TP price"
                                            value={tpPrice}
                                            onChange={(e) => setTpPrice(e.target.value)}
                                            className="perps-tpsl-price-input"
                                        />
                                    </div>
                                    <div className="perps-tpsl-input-section">
                                        <div className="perps-tpsl-percentage">
                                            <span className="perps-tpsl-row-label">TP%</span>
                                            <input
                                                type="number"
                                                value={tpPercent}
                                                onChange={(e) => setTpPercent(e.target.value)}
                                                className="perps-tpsl-percent-input"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="perps-tpsl-row">
                                    <div className="perps-tpsl-label-section">
                                        <span className="perps-tpsl-row-label">SL Price</span>
                                        <input
                                            type="number"
                                            placeholder="Enter SL price"
                                            value={tpPrice}
                                            onChange={(e) => setSlPrice(e.target.value)}
                                            className="perps-tpsl-price-input"
                                        />
                                    </div>
                                    <div className="perps-tpsl-input-section">
                                        <div className="perps-tpsl-percentage">
                                            <span className="perps-tpsl-row-label">SL%</span>
                                            <input
                                                type="number"
                                                value={tpPercent}
                                                onChange={(e) => setSlPercent(e.target.value)}
                                                className="perps-tpsl-percent-input"
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                    <div className="perps-trade-details-section">
                        <button
                            className={`perps-trade-action-button ${activeTradeType}`}
                            onClick={() => {
                                if (isTpSlEnabled) {
                                    console.log(`TP Price: ${tpPrice}, SL Price: ${slPrice}`);
                                }
                            }}
                        >
                            {activeOrderType === "market"
                                ? `${activeTradeType === "long" ? "Long" : "Short"} Market`
                                : `Set ${activeTradeType === "long" ? "Long" : "Short"} Limit`
                            }
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
                                    $0.00
                                </div>
                            </div>
                            <div className="price-impact">
                                <div className="label-container">
                                    <TooltipLabel
                                        label={t('Order Value')}
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
                                    $0.00
                                </div>
                            </div>
                            <div className="price-impact">
                                <div className="label-container">
                                    <TooltipLabel
                                        label={t('Margin Required')}
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
                                    $0.00
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
                                    0.038% / 0.015%
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
                <div className="perps-bottom-section" style={{ minHeight: `${orderCenterHeight}px`, maxHeight: `${orderCenterHeight}px`}}>
                <div className="perps-deposit-withdraw-section">
                    <button
                        className="perps-deposit-button"
                        onClick={() => setpopup(30)}
                    >
                        Deposit
                    </button>
                    <button
                        className="perps-withdraw-button"
                        onClick={() => setpopup(31)}
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
                            Balance
                        </span>
                        <span className="perps-account-subtitle">
                            $0.00
                        </span>
                    </div>
                    <div className="perps-account-row">
                        <span className="perps-account-title">
                            Unrealized PNL
                        </span>
                        <span className="perps-account-subtitle">
                            $0.00
                        </span>
                    </div>
                    <div className="perps-account-row">
                        <span className="perps-account-title">
                            Cross Margin Ratio
                        </span>
                        <span className="perps-account-subtitle">
                            $0.00
                        </span>
                    </div>
                    <div className="perps-account-row">
                        <span className="perps-account-title">
                            Maintenance Margin
                        </span>
                        <span className="perps-account-subtitle">
                            $0.00
                        </span>
                    </div>
                    <div className="perps-account-row">
                        <span className="perps-account-title">
                            Cross Account Leverage
                        </span>
                        <span className="perps-account-subtitle">
                            $0.00
                        </span>
                    </div>
                </div>
        </div>
      </div>
    </div>
  );
};

export default Perps;