import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { encodeFunctionData } from "viem";
import { defaultMetrics } from "../TokenExplorer/TokenData";
import { settings } from "../../settings";
import { CrystalLaunchpadRouter } from "../../abis/CrystalLaunchpadRouter";
import QuickBuyWidget from "./QuickBuyWidget/QuickBuyWidget";
import MemeOrderCenter from "./MemeOrderCenter/MemeOrderCenter";
import MemeTradesComponent from "./MemeTradesComponent/MemeTradesComponent";
import contract from "../../assets/contract.svg";
import gas from "../../assets/gas.svg";
import slippage from "../../assets/slippage.svg";
import bribe from "../../assets/bribe.svg";
import switchicon from "../../assets/switch.svg";
import editicon from "../../assets/edit.svg";
import walleticon from "../../assets/wallet_icon.png";
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
  created: string;
  bondingAmount: number;
  volumeDelta: number;
}

interface Trade {
  id: string;
  timestamp: number;
  isBuy: boolean;
  price: number;
  tokenAmount: number;
  nativeAmount: number;
}

interface MemeInterfaceProps {
  tradingMode: "spot" | "trenches";
  sliderMode: "presets" | "increment" | "slider";
  sliderPresets: number[];
  sliderIncrement: number;
  tokenList: any[];
  marketsData: any[];
  onMarketSelect: (market: any) => void;
  setSendTokenIn: (token: any) => void;
  setpopup: (value: number) => void;
  sendUserOperationAsync: any;
  waitForTxReceipt: any;
  account: { connected: boolean; address: string; chainId: number };
  setChain: () => void;
  tokenBalances?: { [key: string]: bigint };
  tokendict?: { [key: string]: any };
}

const MARKET_UPDATE_EVENT =
  "0x797f1d495432fad97f05f9fdae69fbc68c04742c31e6dfcba581332bd1e7272a";
const TOTAL_SUPPLY = 1e9;
const SUBGRAPH_URL =
  "https://api.studio.thegraph.com/query/104695/crystal-launchpad/version/latest";

const gq = async (query: string, variables: Record<string, any>) => {
  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await res.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
};

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
  waitForTxReceipt,
  account,
  setChain,
  tokenBalances = {},
  tokendict = {},
}) => {
  const { tokenAddress } = useParams<{ tokenAddress: string }>();
  const location = useLocation();
  const [tokenInfoExpanded, setTokenInfoExpanded] = useState(true);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [tradeAmount, setTradeAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [inputCurrency, setInputCurrency] = useState<"MON" | "TOKEN">("MON");
  const [sliderPercent, setSliderPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(1);
  const [slippageValue, setSlippageValue] = useState("20");
  const [priorityFee, setPriorityFee] = useState("0.01");
  const [bribeValue, setBribeValue] = useState("0.05");
  const [orderCenterHeight, setOrderCenterHeight] = useState<number>(350);
  const [isVertDragging, setIsVertDragging] = useState<boolean>(false);
  const [isSigning, setIsSigning] = useState(false);
  const [activeTradeType, setActiveTradeType] = useState<"buy" | "sell">("buy");
  const [activeOrderType, setActiveOrderType] = useState<"market" | "Limit">(
    "market",
  );
  const [live, setLive] = useState<Partial<Token>>({});
  const [trades, setTrades] = useState<Trade[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

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

  const token: Token = { ...baseToken, ...live } as Token;
  const currentPrice = token.price || 0;

  useEffect(() => {
    if (!token.id) return;
    (async () => {
      try {
        const data = await gq(
          `
          query ($id: ID!) {
            market: markets(where: { id: $id }) {
              latestPrice
              volume24h
              buyCount
              sellCount
            }
            trades(first: 100, orderBy: timestamp, orderDirection: desc, where: { market: $id }) {
              id
              timestamp
              isBuy
              price
              tokenAmount
              nativeAmount
            }
          }
        `,
          { id: token.id.toLowerCase() },
        );
        if (data.market.length) {
          const m = data.market[0];
          setLive((p) => ({
            ...p,
            price: Number(m.latestPrice) / 1e18,
            marketCap: (Number(m.latestPrice) / 1e18) * TOTAL_SUPPLY,
            volume24h: Number(m.volume24h) / 1e18,
            buyTransactions: Number(m.buyCount),
            sellTransactions: Number(m.sellCount),
          }));
        }
        const mapped: Trade[] = data.trades.map((t: any) => ({
          id: t.id,
          timestamp: Number(t.timestamp),
          isBuy: t.isBuy,
          price: Number(t.price) / 1e18,
          tokenAmount: Number(t.tokenAmount) / 1e18,
          nativeAmount: Number(t.nativeAmount) / 1e18,
        }));
        setTrades(mapped);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [token.id]);

  useEffect(() => {
    if (!token.id) return;
    const ws = new WebSocket("wss://testnet-rpc.monad.xyz");
    wsRef.current = ws;
    const sendSub = (params: any) => {
      const id = Date.now();
      ws.send(
        JSON.stringify({ id, jsonrpc: "2.0", method: "eth_subscribe", params }),
      );
    };
    ws.onopen = () => sendSub(["logs", { address: token.id }]);
    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.method !== "eth_subscription") return;
      const log = msg.params.result;
      if (log.topics[0] !== MARKET_UPDATE_EVENT) return;
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
      setLive((p) => ({
        ...p,
        price,
        marketCap: price * TOTAL_SUPPLY,
        buyTransactions: buys,
        sellTransactions: sells,
        volume24h: (p.volume24h || 0) + (isBuy ? amountIn : amountOut),
      }));
      const newTrade: Trade = {
        id: `${log.transactionHash}-${log.logIndex}`,
        timestamp: Date.now() / 1000,
        isBuy,
        price,
        tokenAmount: isBuy ? amountIn : amountOut,
        nativeAmount: isBuy ? amountOut : amountIn,
      };
      setTrades((prev) => [newTrade, ...prev.slice(0, 99)]);
    };
    return () => {
      ws.close();
    };
  }, [token.id]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (!tradeAmount) {
        setIsQuoteLoading(false);
        return;
      }
      setIsQuoteLoading(true);
      const amt = parseFloat(tradeAmount);
      let converted = 0;
      if (activeTradeType === "buy") {
        converted =
          inputCurrency === "MON" ? amt / currentPrice : amt * currentPrice;
      } else {
        converted =
          inputCurrency === "MON" ? amt * currentPrice : amt / currentPrice;
      }
      setLive((p) => ({ ...p, quote: fmt(converted, 6) }));
      setIsQuoteLoading(false);
    }, 400);
    return () => clearTimeout(id);
  }, [tradeAmount, currentPrice, activeTradeType, inputCurrency]);

  const getTokenBalance = () => {
    if (!account.connected) return "0";
    const key = token.tokenAddress.toLowerCase();
    const dec = tokendict[key]?.decimals || 18;
    const bal = tokenBalances[key] || BigInt(0);
    return fmt(Number(bal) / 10 ** dec, 4);
  };

  const formatNumberWithCommas = fmt;
  const formatVolume = (n: number) =>
    n >= 1e6
      ? `$${(n / 1e6).toFixed(1)}M`
      : n >= 1e3
        ? `$${(n / 1e3).toFixed(1)}K`
        : `$${n.toFixed(0)}`;

  const activechain =
    typeof (settings as any).activechain === "string"
      ? (settings as any).activechain
      : Object.keys(settings.chainConfig)[0];
  const routerAddress = settings.chainConfig[activechain]?.launchpadRouter;

  const handleTrade = async () => {
    if (!tradeAmount || !account.connected) return;
    if (activeOrderType === "Limit" && !limitPrice) return;
    const targetChainId =
      settings.chainConfig[activechain]?.chainId ||
      parseInt(activechain) ||
      activechain;
    if (account.chainId !== targetChainId) {
      setChain();
      return;
    }
    try {
      setIsSigning(true);
      if (activeTradeType === "buy") {
        const value = BigInt(parseFloat(tradeAmount) * 1e18);
        const uo = {
          target: routerAddress,
          data: encodeFunctionData({
            abi: CrystalLaunchpadRouter,
            functionName: "buy",
            args: [token.tokenAddress as `0x${string}`],
          }),
          value,
        };
        const op = await sendUserOperationAsync({ uo });
        await waitForTxReceipt(op.hash);
      } else {
        const amountIn = BigInt(parseFloat(tradeAmount) * 1e18);
        const uo = {
          target: routerAddress,
          data: encodeFunctionData({
            abi: CrystalLaunchpadRouter,
            functionName: "sell",
            args: [token.tokenAddress as `0x${string}`, amountIn],
          }),
          value: 0n,
        };
        const op = await sendUserOperationAsync({ uo });
        await waitForTxReceipt(op.hash);
      }
      setTradeAmount("");
      setLimitPrice("");
      setSliderPercent(0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSigning(false);
    }
  };

  const getButtonText = () => {
    if (!account.connected) return "Connect Wallet";
    const targetChainId =
      settings.chainConfig[activechain]?.chainId ||
      parseInt(activechain) ||
      activechain;
    if (account.chainId !== targetChainId)
      return `Switch to ${settings.chainConfig[activechain]?.name || "Monad"}`;
    if (isSigning) return "Signing...";
    if (activeOrderType === "market")
      return `${activeTradeType === "buy" ? "Buy" : "Sell"} ${token.symbol}`;
    return `Set ${activeTradeType === "buy" ? "Buy" : "Sell"} Limit`;
  };

  const isTradeDisabled = () => {
    if (!account.connected) return false;
    const targetChainId =
      settings.chainConfig[activechain]?.chainId ||
      parseInt(activechain) ||
      activechain;
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
      <div className="memechartandtradesandordercenter">
        <div className="memecharttradespanel">
          <div className="meme-chart-container"></div>
          <div className="meme-trades-container">
            <span className="meme-trades-title">Trades</span>
            <MemeTradesComponent
              tokenList={tokenList}
              trades={trades}
              onMarketSelect={onMarketSelect}
              setSendTokenIn={setSendTokenIn}
              setpopup={setpopup}
            />
          </div>
        </div>
        <div className="meme-ordercenter">
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
          />
        </div>
      </div>
      <div className="meme-trade-panel">
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
                ≈{" "}
                {formatNumberWithCommas(
                  parseFloat(token.price.toString() || "0"),
                )}{" "}
                {inputCurrency === "TOKEN" ? "MON" : token.symbol}
              </div>
            )}
          </div>
          {account.connected && (
            <div className="meme-token-balance">
              <img src={walleticon} className="balance-wallet-icon" />
              <span className="balance-amount">
                {getTokenBalance()} {token.symbol}
              </span>
            </div>
          )}
          {activeOrderType === "Limit" && (
            <div className="meme-trade-input-wrapper">
              <input
                type="number"
                placeholder="Limit price"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="meme-trade-input"
              />
              <div className="meme-trade-currency">USD</div>
            </div>
          )}
          <div className="meme-balance-slider-wrapper">
            {sliderMode === "presets" && (
              <div className="meme-slider-container meme-presets-mode">
                <div className="meme-preset-buttons">
                  {sliderPresets.map((preset: number, index: number) => (
                    <button
                      key={index}
                      className={`meme-preset-button ${sliderPercent === preset ? "active" : ""}`}
                      onClick={() => {
                        setSliderPercent(preset);
                        const newAmount = (1000 * preset) / 100;
                        setTradeAmount(newAmount.toString());
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
                    background: `linear-gradient(to right,rgb(171, 176, 224) ${sliderPercent}%,rgb(28, 28, 31) ${sliderPercent}%)`,
                  }}
                />
                <div
                  className={`meme-slider-percentage-popup ${isDragging ? "visible" : ""}`}
                >
                  {sliderPercent}%
                </div>
                <div className="meme-balance-slider-marks">
                  {[0, 25, 50, 75, 100].map((markPercent) => (
                    <span
                      key={markPercent}
                      className="meme-balance-slider-mark"
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
                <div className="meme-settings-item">
                  <img src={bribe} className="meme-settings-icon3" />
                  <span className="meme-settings-value">{bribeValue}</span>
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
                    className={`meme-settings-preset ${selectedPreset === 1 ? "active" : ""}`}
                    onClick={() => {
                      setSelectedPreset(1);
                      setSlippageValue("20");
                      setPriorityFee("0.001");
                      setBribeValue("0.05");
                    }}
                  >
                    Preset 1
                  </button>
                  <button
                    className={`meme-settings-preset ${selectedPreset === 2 ? "active" : ""}`}
                    onClick={() => {
                      setSelectedPreset(2);
                      setSlippageValue("10");
                      setPriorityFee("0.005");
                      setBribeValue("0.1");
                    }}
                  >
                    Preset 2
                  </button>
                  <button
                    className={`meme-settings-preset ${selectedPreset === 3 ? "active" : ""}`}
                    onClick={() => {
                      setSelectedPreset(3);
                      setSlippageValue("5");
                      setPriorityFee("0.01");
                      setBribeValue("0.2");
                    }}
                  >
                    Preset 3
                  </button>
                </div>
                <div className="meme-settings-grid">
                  <div className="meme-setting-item">
                    <label className="meme-setting-label">
                      <img src={slippage} className="meme-setting-label-icon" />
                      Slippage
                    </label>
                    <div className="meme-setting-input-wrapper">
                      <input
                        type="number"
                        className="meme-setting-input"
                        value={slippageValue}
                        onChange={(e) => setSlippageValue(e.target.value)}
                        step="0.1"
                        min="0"
                        max="100"
                      />
                      <span className="meme-setting-unit">%</span>
                    </div>
                  </div>
                  <div className="meme-setting-item">
                    <label className="meme-setting-label">
                      <img src={gas} className="meme-setting-label-icon" />
                      Priority
                    </label>
                    <div className="meme-setting-input-wrapper">
                      <input
                        type="number"
                        className="meme-setting-input"
                        value={priorityFee}
                        onChange={(e) => setPriorityFee(e.target.value)}
                        step="1"
                        min="0"
                      />
                      <span className="meme-setting-unit">MON</span>
                    </div>
                  </div>
                  <div className="meme-setting-item">
                    <label className="meme-setting-label">
                      <img src={bribe} className="meme-setting-label-icon" />
                      Bribe
                    </label>
                    <div className="meme-setting-input-wrapper">
                      <input
                        type="number"
                        className="meme-setting-input"
                        value={bribeValue}
                        onChange={(e) => setBribeValue(e.target.value)}
                        step="0.0000001"
                        min="0"
                      />
                      <span className="meme-setting-unit">MON</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (!account.connected) {
                setpopup(4);
              } else {
                const targetChainId =
                  settings.chainConfig[activechain]?.chainId ||
                  parseInt(activechain) ||
                  activechain;
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
            {getButtonText()}
          </button>
        </div>
        <div className="meme-trading-stats-container">
          <div className="meme-time-stats-row"></div>
          <div className="meme-trading-stats-row">
            <div className="meme-stat-group">
              <div className="meme-stat-header">
                <span className="meme-stat-label">TXNS</span>
                <div className="meme-stat-value">
                  {formatNumberWithCommas(totalTransactions)}
                </div>
              </div>
              <div className="meme-stat-details">
                <div className="meme-stat-subrow">
                  <div className="stat-sublabel">BUYS</div>
                  <div className="stat-sublabel">SELLS</div>
                </div>
                <div className="meme-stat-subrow">
                  <div className="stat-subvalue buy">
                    {formatNumberWithCommas(currentData.buyTransactions)}
                  </div>
                  <div className="stat-subvalue sell">
                    {formatNumberWithCommas(currentData.sellTransactions)}
                  </div>
                </div>
                <div className="meme-progress-bar">
                  <div
                    className="progress-buy"
                    style={{ width: `${buyTxPercentage}%` }}
                  ></div>
                  <div
                    className="progress-sell"
                    style={{ width: `${sellTxPercentage}%` }}
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
            <div className="meme-token-info-grid">
              <div className="meme-token-info-item">
                <div className="meme-token-info-icon-container">
                  <svg
                    className="meme-token-info-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 32 32"
                    fill={
                      (token.top10Holding || 0) > 5
                        ? "#eb7070ff"
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
                        (token.top10Holding || 0) > 5
                          ? "#eb7070ff"
                          : "rgb(67 254 154)",
                    }}
                  >
                    {(token.top10Holding || 0).toFixed(2)}%
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
            {token.tokenAddress.slice(0, 16)}...{token.tokenAddress.slice(-8)}
            <svg
              className="meme-address-link"
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
              <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
            </svg>
          </span>
        </div>
      </div>
      <QuickBuyWidget
        isOpen={isWidgetOpen}
        onClose={() => setIsWidgetOpen(false)}
        tokenSymbol={token.symbol}
        tokenName={token.name}
      />
    </div>
  );
};

export default MemeInterface;
