import React, {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Search, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { settings } from '../../settings';
import { CrystalLaunchpadRouter } from '../../abis/CrystalLaunchpadRouter';
import { encodeFunctionData } from 'viem';
import { defaultMetrics } from './TokenData';

import telegram from '../../assets/telegram.png';
import lightning from '../../assets/flash.png';
import monadicon from '../../assets/monadlogo.svg';
import camera from '../../assets/camera.svg';
import filter from '../../assets/filter.svg';
import empty from '../../assets/empty.svg';

import './TokenExplorer.css';

export interface Token {
  id: string; // market address
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
  status: 'new' | 'graduating' | 'graduated';
  description: string;
  created: string;
  bondingAmount: number;
  volumeDelta: number;
}

interface TokenExplorerProps {
  setpopup: (popup: number) => void;
  appliedFilters?: any;
  onOpenFiltersForColumn: (c: Token['status']) => void;
  activeFilterTab?: Token['status'];
  sendUserOperationAsync: any;
  waitForTxReceipt: any;
}

const MAX_PER_COLUMN = 30;
const TOTAL_SUPPLY = 1e9;

const ROUTER_EVENT = '0xfe210c99153843bc67efa2e9a61ec1d63c505e379b9dcf05a9520e84e36e6063';
const MARKET_UPDATE_EVENT = '0x797f1d495432fad97f05f9fdae69fbc68c04742c31e6dfcba581332bd1e7272a';
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/104695/crystal-launchpad/version/latest';

type State = {
  tokensByStatus: Record<Token['status'], Token[]>;
  hidden: Set<string>;
  loading: Set<string>;
};

type Action =
  | { type: 'INIT'; tokens: Token[] }
  | { type: 'ADD_MARKET'; token: Token }
  | { type: 'UPDATE_MARKET'; id: string; updates: Partial<Token> }
  | { type: 'HIDE_TOKEN'; id: string }
  | { type: 'SET_LOADING'; id: string; loading: boolean };

const initialState: State = {
  tokensByStatus: { new: [], graduating: [], graduated: [] },
  hidden: new Set(),
  loading: new Set(),
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT': {
      const buckets: State['tokensByStatus'] = {
        new: [],
        graduating: [],
        graduated: [],
      };
      action.tokens.forEach((t) => buckets[t.status].push(t));
      return { ...state, tokensByStatus: buckets };
    }
    case 'ADD_MARKET': {
      const { token } = action;
      const list = [token, ...state.tokensByStatus[token.status]].slice(
        0,
        MAX_PER_COLUMN,
      );
      return {
        ...state,
        tokensByStatus: { ...state.tokensByStatus, [token.status]: list },
      };
    }
    case 'UPDATE_MARKET': {
      const buckets = { ...state.tokensByStatus };

      (Object.keys(buckets) as Token['status'][]).forEach((s) => {
        buckets[s] = buckets[s].map((t) => {
          if (t.id.toLowerCase() !== action.id.toLowerCase()) return t;

          const { volumeDelta = 0, ...rest } = action.updates;
          return {
            ...t,
            ...rest,
            volume24h: t.volume24h + volumeDelta,
          };
        });
      });

      return { ...state, tokensByStatus: buckets };
    }
    case 'HIDE_TOKEN': {
      const h = new Set(state.hidden).add(action.id);
      return { ...state, hidden: h };
    }
    case 'SET_LOADING': {
      const l = new Set(state.loading);
      action.loading ? l.add(action.id) : l.delete(action.id);
      return { ...state, loading: l };
    }
    default:
      return state;
  }
}

const getBondingColor = (b: number) => {
  if (b < 25) return '#ee5b5bff';
  if (b < 50) return '#f59e0b';
  if (b < 75) return '#eab308';
  return '#43e17dff';
};

const createColorGradient = (base: string) => {
  const hex = base.replace('#', '');
  const [r, g, b] = [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
  const lighter = (x: number) => Math.min(255, Math.round(x + (255 - x) * 0.3));
  const darker = (x: number) => Math.round(x * 0.7);
  return {
    start: `rgb(${darker(r)}, ${darker(g)}, ${darker(b)})`,
    mid: base,
    end: `rgb(${lighter(r)}, ${lighter(g)}, ${lighter(b)})`,
  };
};

const formatPrice = (p: number) => {
  if (p >= 1e12) return `${(p / 1e12).toFixed(1)}T MON`;
  if (p >= 1e9) return `${(p / 1e9).toFixed(1)}B MON`;
  if (p >= 1e6) return `${(p / 1e6).toFixed(1)}M MON`;
  if (p >= 1e3) return `${(p / 1e3).toFixed(1)}K MON`;
  return `${p.toFixed(2)} MON`;
};

const formatTimeAgo = (t: string) => {
  if (t.includes('d ago')) return `${parseInt(t) * 24}h ago`;
  if (t.includes('w ago')) return `${parseInt(t) * 7 * 24}h ago`;
  return t;
};

const Tooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, children, position = 'top' }) => {
  const [vis, setVis] = useState(false);
  return (
    <div
      className="tooltip-container"
      onMouseEnter={() => setVis(true)}
      onMouseLeave={() => setVis(false)}
    >
      {children}
      <div className={`tooltip tooltip-${position} fade-popup ${vis ? 'visible' : ''}`}>
        <div className="tooltip-content">
          {content}
          <div className={`tooltip-arrow tooltip-arrow-${position}`} />
        </div>
      </div>
    </div>
  );
};

const TokenExplorer: React.FC<TokenExplorerProps> = ({
  // setpopup,
  appliedFilters,
  activeFilterTab,
  onOpenFiltersForColumn,
  sendUserOperationAsync,
  waitForTxReceipt,
}) => {
  const navigate = useNavigate();
  const activechain =
    (settings as any).activechain ??
    (Object.keys(settings.chainConfig)[0] as keyof typeof settings.chainConfig);
  const routerAddress = settings.chainConfig[activechain].launchpadRouter.toLowerCase();

  const [{ tokensByStatus, hidden, loading }, dispatch] = useReducer(reducer, initialState);

  const [quickAmounts, setQuickAmounts] = useState<Record<Token['status'], string>>(() => ({
    new: localStorage.getItem('explorer-quickbuy-new') ?? '0',
    graduating: localStorage.getItem('explorer-quickbuy-graduating') ?? '0',
    graduated: localStorage.getItem('explorer-quickbuy-graduated') ?? '0',
  }));
  const setQuickAmount = (s: Token['status'], v: string) => {
    const clean = v.replace(/[^0-9.]/g, '');
    setQuickAmounts((p) => ({ ...p, [s]: clean }));
    localStorage.setItem(`explorer-quickbuy-${s}`, clean);
  };

  const [isLoading, setIsLoading] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const subIdRef = useRef(1);
  const marketSubs = useRef<Record<string, string>>({});
  const subscribe = (
    ws: WebSocket,
    params: any,
    onAck?: (subId: string) => void,
  ) => {
    const reqId = subIdRef.current++;
    ws.send(
      JSON.stringify({
        id: reqId,
        jsonrpc: '2.0',
        method: 'eth_subscribe',
        params,
      }),
    );
    if (!onAck) return;
    const handler = (evt: MessageEvent) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === reqId && msg.result) {
        onAck(msg.result);
        ws.removeEventListener('message', handler);
      }
    };
    ws.addEventListener('message', handler);
  };

  const addMarket = async (log: any) => {
    const { topics, data } = log;
    const market = `0x${topics[1].slice(26)}`.toLowerCase();
    const tokenAddr = `0x${topics[2].slice(26)}`.toLowerCase();

    const hex = data.replace(/^0x/, '');
    const offs = [
      parseInt(hex.slice(0, 64), 16),
      parseInt(hex.slice(64, 128), 16),
      parseInt(hex.slice(128, 192), 16),
    ];
    const read = (at: number): string => {
      const start = at * 2;
      const len = parseInt(hex.slice(start, start + 64), 16);
      const strHex = hex.slice(start + 64, start + 64 + len * 2);
      const bytes: string[] = strHex.match(/.{2}/g) ?? [];
      return bytes
        .map((byteHex: string) =>
          String.fromCharCode(parseInt(byteHex, 16))
        )
        .join('');
    };
    const name = read(offs[0]);
    const symbol = read(offs[1]);
    const cid = read(offs[2]);

    let meta: any = {};
    try {
      const res = await fetch(cid);
      if (res.ok) meta = await res.json();
    } catch (e) {
      console.warn('failed to load metadata for', cid, e);
    }

    const token: Token = {
      ...defaultMetrics,
      id: market,
      tokenAddress: tokenAddr,
      name,
      symbol,
      image: meta?.image ?? '',
      description: meta?.description ?? '',
      twitterHandle: meta?.twitter ?? '',
      website: meta?.website ?? '',
      status: 'new',
      marketCap: defaultMetrics.price * TOTAL_SUPPLY,
      created: '0s ago',
      volumeDelta: 0
    };

    dispatch({ type: 'ADD_MARKET', token });

    if (!marketSubs.current[market] && wsRef.current) {
      subscribe(
        wsRef.current,
        ['logs', { address: market }],
        (sub) => (marketSubs.current[market] = sub),
      );
    }
  };

  const updateMarket = (log: any) => {
    if (log.topics[0] !== MARKET_UPDATE_EVENT) return;

    const market = log.address.toLowerCase();
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

    dispatch({
      type: 'UPDATE_MARKET',
      id: market,
      updates: {
        price: priceEth,
        marketCap: priceEth * TOTAL_SUPPLY,
        buyTransactions: buys,
        sellTransactions: sells,
        volumeDelta: isBuy > 0 ? amountIn / 1e18: amountOut / 1e18,
      },
    });
  };

  function openWebsocket(initialMarkets: string[]): void {
    const ws = new WebSocket('wss://testnet-rpc.monad.xyz');
    wsRef.current = ws;

    ws.onopen = () => {
      subscribe(ws, ['logs', { address: routerAddress, topics: [ROUTER_EVENT] }]);

      initialMarkets.forEach((addr) => {
        subscribe(
          ws,
          ['logs', { address: addr }],
          (subId) => (marketSubs.current[addr] = subId),
        );
      });
    };

    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.method !== 'eth_subscription' || !msg.params?.result) return;
      const log = msg.params.result;
      if (log.topics[0] === ROUTER_EVENT) addMarket(log);
      else if (log.topics[0] === MARKET_UPDATE_EVENT) updateMarket(log);
    };

    ws.onerror = (e) => console.error('ws error', e);
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const res = await fetch(SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query: `
            {
              markets(first: 30, orderBy: createdAt, orderDirection: desc) {
                id
                tokenAddress
                name
                symbol
                metadataCID
                createdAt
                latestPrice
                buyCount
                sellCount
                volume24h
              }
            }`,
          }),
        });
        const json = await res.json();

        console.log(json);

        if (cancelled) return;

        const tokens: Token[] = (json.data?.markets ?? []).map((m: any) => {
          const price = Number(m.latestPrice) / 1e18;
          return {
            ...defaultMetrics,
            id: m.id.toLowerCase(),
            tokenAddress: m.tokenAddress.toLowerCase(),
            name: m.name,
            symbol: m.symbol,
            image: m.metadataCID,
            description: '',
            twitterHandle: '',
            website: '',
            status: 'new',
            created: ((d => d >= 3600 ? `${Math.floor(d / 3600)}h ago` : d >= 60 ? `${Math.floor(d / 60)}m ago` : `${d}s ago`) (Math.floor(Date.now() / 1000) - Number(m.createdAt))),
            price,
            marketCap: price * TOTAL_SUPPLY,
            buyTransactions: Number(m.buyCount),
            sellTransactions: Number(m.sellCount),
            volume24h: Number(m.volume24h) / 1e18,
          };
        });

        dispatch({ type: 'INIT', tokens });

        openWebsocket(tokens.map((t) => t.id));
      } catch (err) {
        console.error('initial subgraph fetch failed', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const [hoveredToken, setHoveredToken] = useState<string | null>(null);
  const handleTokenHover = (id: string) => setHoveredToken(id);
  const handleTokenLeave = () => setHoveredToken(null);
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '0') e.target.select();
  };
  const copyToClipboard = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
    } catch (err) {
      console.error('copy failed', err);
    }
  };
  const handleWebsiteOpen = (url: string) => {
    if (!url) return;
    const u = url.startsWith('http') ? url : `https://${url}`;
    window.open(u, '_blank', 'noopener,noreferrer');
  };
  const handleTwitterOpen = (h: string) => {
    window.open(`https://twitter.com/${h}`, '_blank', 'noopener,noreferrer');
  };
  const handleTwitterContractSearch = (addr: string) => {
    window.open(`https://twitter.com/search?q=${addr}`, '_blank', 'noopener,noreferrer');
  };
  const handleImageSearch = (img: string) => {
    window.open(
      `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(img)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };
  const handleQuickBuy = async (token: Token, amt: string) => {
    const val = BigInt(amt || '0') * 10n ** 18n;
    if (val === 0n) return;
    dispatch({ type: 'SET_LOADING', id: token.id, loading: true });
    try {
      const uo = {
        target: routerAddress,
        data: encodeFunctionData({
          abi: CrystalLaunchpadRouter,
          functionName: 'buy',
          args: [token.tokenAddress as `0x${string}`],
        }),
        value: val,
      };
      const op = await sendUserOperationAsync({ uo });
      await waitForTxReceipt(op.hash);
    } catch (e) {
      console.error('quick buy failed', e);
    } finally {
      dispatch({ type: 'SET_LOADING', id: token.id, loading: false });
    }
  };
  const handleTokenClick = (t: Token) => navigate(`/meme/${t.tokenAddress}`);

  const applyFilters = (list: Token[], fil: any) => {
    if (!fil) return list;
    return list.filter((t) => {
      if (fil.priceMin && t.price < +fil.priceMin) return false;
      if (fil.priceMax && t.price > +fil.priceMax) return false;
      if (fil.holdersMin && t.holders < +fil.holdersMin) return false;
      if (fil.holdersMax && t.holders > +fil.holdersMax) return false;
      if (fil.searchKeywords) {
        const kw = fil.searchKeywords.toLowerCase().split(',').map((x: string) => x.trim());
        const hay = `${t.name} ${t.symbol} ${t.description}`.toLowerCase();
        if (!kw.some((k: string) => hay.includes(k))) return false;
      }
      return true;
    });
  };

  const visibleTokens = useMemo(() => {
    const base = {
      new: tokensByStatus.new.filter((t) => !hidden.has(t.id)),
      graduating: tokensByStatus.graduating.filter((t) => !hidden.has(t.id)),
      graduated: tokensByStatus.graduated.filter((t) => !hidden.has(t.id)),
    } as Record<Token['status'], Token[]>;
    if (!appliedFilters) return base;
    return (['new', 'graduating', 'graduated'] as Token['status'][]).reduce(
      (acc, s) => ({
        ...acc,
        [s]:
          activeFilterTab === s ? applyFilters(base[s], appliedFilters) : base[s],
      }),
      {} as Record<Token['status'], Token[]>,
    );
  }, [tokensByStatus, hidden, appliedFilters, activeFilterTab]);

  const TokenRow: React.FC<{
    token: Token;
    quickbuyAmount: string;
    onHideToken: (id: string) => void;
    isLoading: boolean;
  }> = React.memo(({ token, quickbuyAmount, onHideToken, isLoading }) => {
    const totalTraders = token.holders + token.proTraders + token.kolTraders;
    const showBonding = (token.status === 'new' || token.status === 'graduating') && hoveredToken === token.id;
    const buyPct =
      token.buyTransactions + token.sellTransactions === 0
        ? 0
        : (token.buyTransactions / (token.buyTransactions + token.sellTransactions)) * 100;
    const sellPct = 100 - buyPct;

    return (
      <div
        className="explorer-token-row"
        onMouseEnter={() => handleTokenHover(token.id)}
        onMouseLeave={handleTokenLeave}
        onClick={() => handleTokenClick(token)}
      >
        <Tooltip content="Hide Token">
          <button
            className="explorer-hide-button"
            onClick={(e) => {
              e.stopPropagation();
              onHideToken(token.id);
            }}
            title="Hide token"
          >
            <EyeOff size={16} />
          </button>
        </Tooltip>

        <div
          className={`bonding-amount-display ${showBonding ? 'visible' : ''}`}
          style={{ color: getBondingColor(token.bondingAmount) }}
        >
          BONDING: {token.bondingAmount}%
        </div>

        <div className="explorer-token-left">
          <div
            className={`explorer-token-image-container ${token.status === 'graduated' ? 'graduated' : ''
              }`}
            onClick={() => handleImageSearch(token.image)}
            style={
              token.status === 'graduated'
                ? {}
                : {
                  '--progress-angle': `${(token.bondingAmount / 100) * 360}deg`,
                  '--progress-color-start': createColorGradient(
                    getBondingColor(token.bondingAmount),
                  ).start,
                  '--progress-color-mid': createColorGradient(
                    getBondingColor(token.bondingAmount),
                  ).mid,
                  '--progress-color-end': createColorGradient(
                    getBondingColor(token.bondingAmount),
                  ).end,
                } as React.CSSProperties
            }
          >
            <div className="explorer-progress-spacer">
              <div className="explorer-image-wrapper">
                <img src={token.image} alt={token.name} className="explorer-token-image" />
                <div className="explorer-image-overlay">
                  <img className="camera-icon" src={camera} alt="inspect" />
                </div>
              </div>
            </div>
          </div>

          <span className="explorer-contract-address">
            {token.tokenAddress.slice(0, 6)}…{token.tokenAddress.slice(-4)}
          </span>
        </div>

        <div className="explorer-token-details">
          <div className="explorer-detail-section">
            <div className="explorer-top-row">
              <div className="explorer-token-info">
                <h3 className="explorer-token-symbol">{token.symbol}</h3>
                <div className="explorer-token-name-container">
                  <p className="explorer-token-name">{token.name}</p>
                  <button
                    className="explorer-copy-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(token.tokenAddress);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="explorer-second-row">
              <span className="explorer-time-created">{formatTimeAgo(token.created)}</span>

              <button
                className="explorer-twitter-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTwitterOpen(token.twitterHandle);
                }}
                title={`visit @${token.twitterHandle}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 4.557a9.83 9.83 0 0 1-2.828.775A4.932 4.932 0 0 0 23.337 3a9.864 9.864 0 0 1-3.127 1.195 4.916 4.916 0 0 0-8.379 4.482A13.957 13.957 0 0 1 1.671 3.149 4.916 4.916 0 0 0 3.195 9.723a4.904 4.904 0 0 1-2.228-.616v.063a4.916 4.916 0 0 0 3.946 4.813 4.902 4.902 0 0 1-2.224.085 4.918 4.918 0 0 0 4.588 3.414A9.867 9.867 0 0 1 .96 19.54a13.94 13.94 0 0 0 7.548 2.209c9.057 0 14.009-7.514 14.009-14.011 0-.213-.005-.425-.014-.637A10.025 10.025 0 0 0 24 4.557z" />
                </svg>
              </button>

              <button
                className="explorer-website-link"
                onClick={(e) => {
                  e.stopPropagation();
                  handleWebsiteOpen(token.website);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              </button>

              <button
                className="explorer-telegram-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTwitterOpen(token.twitterHandle);
                }}
                title="share on telegram"
              >
                <img src={telegram} alt="telegram" />
              </button>

              <button
                className="explorer-twitter-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTwitterContractSearch(token.tokenAddress);
                }}
                title="search contract on twitter"
              >
                <Search size={14} />
              </button>

              <Tooltip content="Holders">
                <div className="explorer-stat-item">
                  <svg
                    className="traders-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3L19 8c0-1.66-1.34-3-3-3S13 6.34 13 8s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3L11 8c0-1.66-1.34-3-3-3S5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                  <span className="explorer-stat-value">{totalTraders.toLocaleString()}</span>
                </div>
              </Tooltip>
            </div>
          </div>

          <div className="explorer-holdings-section">
            <Tooltip content="Sniper Holding">
              <div className="explorer-holding-item">
                <svg
                  className="holding-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={token.sniperHolding > 5 ? '#eb7070ff' : '#64ef84'}
                >
                  <path d="M12 2v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11zm9 11c0 4.97-4.03 9-9 9v2c6.07 0 11-4.93 11-11h-2zM3 13c0-4.97 4.03-9 9-9V2C5.93 2 1 6.92 1 13h2zm9 9c-4.97 0-9-4.03-9-9H1c0 6.07 4.93 11 11 11v-2zm1-15h-2v4H7v2h4v4h2v-4h4v-2h-4V7z" />
                </svg>
                <span
                  className="explorer-holding-value"
                  style={{ color: token.sniperHolding > 5 ? '#eb7070ff' : '#64ef84' }}
                >
                  {token.sniperHolding.toFixed(1)}%
                </span>
              </div>
            </Tooltip>

            <Tooltip content="Developer Holding">
              <div className="explorer-holding-item">
                <svg
                  className="holding-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={token.devHolding > 5 ? '#eb7070ff' : '#64ef84'}
                >
                  <path d="M12 4a8 8 0 0 0 0 16v-2a6 6 0 1 1 0-12V4zm2 8l5-5-5-5v3H4v4h10v3z" />
                </svg>
                <span
                  className="explorer-holding-value"
                  style={{ color: token.devHolding > 5 ? '#eb7070ff' : '#64ef84' }}
                >
                  {token.devHolding.toFixed(1)}%
                </span>
              </div>
            </Tooltip>

            <Tooltip content="Bundle Holding">
              <div className="explorer-holding-item">
                <svg
                  className="holding-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={token.bundleHolding > 5 ? '#eb7070ff' : '#64ef84'}
                >
                  <path d="M20 6H4v12h16V6zm2-2v16H2V4h20zM6 8h5v5H6V8zm7 0h5v5h-5V8zM6 15h5v5H6v-5zm7 0h5v5h-5v-5z" />
                </svg>
                <span
                  className="explorer-holding-value"
                  style={{ color: token.bundleHolding > 5 ? '#eb7070ff' : '#64ef84' }}
                >
                  {token.bundleHolding.toFixed(1)}%
                </span>
              </div>
            </Tooltip>

            <Tooltip content="Insider Holding">
              <div className="explorer-holding-item">
                <svg
                  className="holding-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={token.insiderHolding > 5 ? '#eb7070ff' : '#64ef84'}
                >
                  <path d="M12 2a10 10 0 0 0-1 19.95V14H8v-4h3V7.77C11 5.43 12.12 4 15.67 4H18v4h-2.09C14.78 8 15 8.9 15 9.77V10h3l-.39 4H15v7.95A10 10 0 0 0 12 2z" />
                </svg>
                <span
                  className="explorer-holding-value"
                  style={{ color: token.insiderHolding > 5 ? '#eb7070ff' : '#64ef84' }}
                >
                  {token.insiderHolding.toFixed(1)}%
                </span>
              </div>
            </Tooltip>

            <Tooltip content="Top 10 Holding">
              <div className="explorer-holding-item">
                <svg
                  className="holding-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={token.top10Holding > 5 ? '#eb7070ff' : '#64ef84'}
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-3.1 0-5.64-1.64-7-4.06L5.25 13.5A4.98 4.98 0 0 1 7 8a4.98 4.98 0 0 1 1.75-3.5L12 4c3.1 0 5.64 1.64 7 4.06L18.75 10.5A4.98 4.98 0 0 1 17 16c-1.37 2.42-3.9 4.06-7 4.06z" />
                </svg>
                <span
                  className="explorer-holding-value"
                  style={{ color: token.top10Holding > 5 ? '#eb7070ff' : '#64ef84' }}
                >
                  {token.top10Holding.toFixed(1)}%
                </span>
              </div>
            </Tooltip>
          </div>
        </div>

        <div className="explorer-third-row">
          <Tooltip content="Market Cap">
            <div className="explorer-market-cap">
              <span className="mc-label">MC</span>
              <span className="explorer-market-cap">{formatPrice(token.marketCap)}</span>
            </div>
          </Tooltip>

          <Tooltip content="Volume">
            <div className="explorer-volume">
              <span className="mc-label">V</span>
              <span className="mc-value">{formatPrice(token.volume24h)}</span>
            </div>
          </Tooltip>

          <div className="explorer-third-row-section">
            <Tooltip content="Global Fees Paid">
              <div className="explorer-stat-item">
                <span className="explorer-fee-label">F</span>
                <img className="explorer-fee-icon" src={monadicon} alt="fee" />
                <span className="explorer-fee-total">{token.globalFeesPaid}</span>
              </div>
            </Tooltip>

            <Tooltip content="Transactions">
              <div className="explorer-tx-bar">
                <div className="explorer-tx-header">
                  <span className="explorer-tx-label">TX</span>
                  <span className="explorer-tx-total">
                    {(token.buyTransactions + token.sellTransactions).toLocaleString()}
                  </span>
                </div>
                <div className="explorer-tx-visual-bar">
                  <div
                    className="explorer-tx-buy-portion"
                    style={{ width: `${buyPct}%` }}
                  />
                  <div
                    className="explorer-tx-sell-portion"
                    style={{ width: `${sellPct}%` }}
                  />
                </div>
              </div>
            </Tooltip>
          </div>

          <div className="explorer-actions-section">
            <button
              className="explorer-quick-buy-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleQuickBuy(token, quickbuyAmount);
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="quickbuy-loading-spinner" />
              ) : (
                <>
                  <img className="explorer-quick-buy-icon" src={lightning} alt="⚡" />
                  {quickbuyAmount} MON
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  });

  const newTokens = visibleTokens.new;
  const graduatingTokens = visibleTokens.graduating;
  const graduatedTokens = visibleTokens.graduated;

  const hideToken = (id: string) => dispatch({ type: 'HIDE_TOKEN', id });

  return (
    <div className="explorer-main">
      <div className="explorer-container">
        <div className="explorer-columns">
          <div className="explorer-column">
            <div className="explorer-column-header">
              <div className="explorer-column-title-section">
                <h2 className="explorer-column-title">New Pairs</h2>
              </div>
              <div className="explorer-column-title-right">
                <div className="explorer-quickbuy-container">
                  <img className="explorer-quick-buy-search-icon" src={lightning} alt="" />
                  <input
                    type="text"
                    placeholder="0"
                    value={quickAmounts.new}
                    onChange={(e) => setQuickAmount('new', e.target.value)}
                    onFocus={handleInputFocus}
                    className="explorer-quickbuy-input"
                  />
                  <img className="quickbuy-monad-icon" src={monadicon} />
                </div>
                <button
                  className={`column-filter-icon ${appliedFilters && activeFilterTab === 'new' ? 'active' : ''
                    }`}
                  onClick={() => onOpenFiltersForColumn('new')}
                  title="filter new pairs"
                >
                  <img className="filter-icon" src={filter} />
                  {appliedFilters && activeFilterTab === 'new' && (
                    <span className="filter-active-dot" />
                  )}
                </button>
              </div>
            </div>

            <div className="explorer-tokens-list">
              {isLoading ? (
                Array.from({ length: 14 }).map((_, i) => (
                  <div key={`sk-new-${i}`} className="explorer-token-row loading">
                    <div className="explorer-token-left">
                      <div className="explorer-token-image-container">
                        <div className="explorer-progress-spacer">
                          <div className="explorer-image-wrapper">
                            <img className="explorer-token-image" alt="loading" />
                          </div>
                        </div>
                      </div>
                      <span className="explorer-contract-address">Loading...</span>
                    </div>
                  </div>
                ))
              ) : newTokens.length ? (
                newTokens.map((t) => (
                  <TokenRow
                    key={t.id}
                    token={t}
                    quickbuyAmount={quickAmounts.new}
                    onHideToken={hideToken}
                    isLoading={loading.has(t.id)}
                  />
                ))
              ) : (
                <div className="no-tokens-message">
                  <img src={empty} className="empty-icon" />
                  No tokens match the current filters
                </div>
              )}
            </div>
          </div>

          <div className="explorer-column">
            <div className="explorer-column-header">
              <div className="explorer-column-title-section">
                <h2 className="explorer-column-title">
                  Graduating Tokens
                  {appliedFilters && activeFilterTab === 'graduating' && (
                    <span className="filtered-count">({graduatingTokens.length})</span>
                  )}
                </h2>
              </div>
              <div className="explorer-column-title-right">
                <div className="explorer-quickbuy-container">
                  <img className="explorer-quick-buy-search-icon" src={lightning} alt="" />
                  <input
                    type="text"
                    placeholder="0"
                    value={quickAmounts.graduating}
                    onChange={(e) => setQuickAmount('graduating', e.target.value)}
                    onFocus={handleInputFocus}
                    className="explorer-quickbuy-input"
                  />
                  <img className="quickbuy-monad-icon" src={monadicon} />
                </div>
                <button
                  className={`column-filter-icon ${appliedFilters && activeFilterTab === 'graduating' ? 'active' : ''
                    }`}
                  onClick={() => onOpenFiltersForColumn('graduating')}
                  title="Filter graduating tokens"
                >
                  <img className="filter-icon" src={filter} />
                  {appliedFilters && activeFilterTab === 'graduating' && (
                    <span className="filter-active-dot" />
                  )}
                </button>
              </div>
            </div>

            <div className="explorer-tokens-list">
              {isLoading ? (
                Array.from({ length: 14 }).map((_, i) => (
                  <div key={`sk-grad-${i}`} className="explorer-token-row loading">
                    <div className="explorer-token-left">
                      <div className="explorer-token-image-container">
                        <div className="explorer-progress-spacer">
                          <div className="explorer-image-wrapper">
                            <img className="explorer-token-image" alt="loading" />
                          </div>
                        </div>
                      </div>
                      <span className="explorer-contract-address">Loading...</span>
                    </div>
                  </div>
                ))
              ) : graduatingTokens.length ? (
                graduatingTokens.map((t) => (
                  <TokenRow
                    key={t.id}
                    token={t}
                    quickbuyAmount={quickAmounts.graduating}
                    onHideToken={hideToken}
                    isLoading={loading.has(t.id)}
                  />
                ))
              ) : (
                <div className="no-tokens-message">
                  <img src={empty} className="empty-icon" />
                  No tokens match the current filters
                </div>
              )}
            </div>
          </div>

          <div className="explorer-column">
            <div className="explorer-column-header">
              <div className="explorer-column-title-section">
                <h2 className="explorer-column-title">
                  Graduated
                  {appliedFilters && activeFilterTab === 'graduated' && (
                    <span className="filtered-count">({graduatedTokens.length})</span>
                  )}
                </h2>
              </div>
              <div className="explorer-column-title-right">
                <div className="explorer-quickbuy-container">
                  <img className="explorer-quick-buy-search-icon" src={lightning} alt="" />
                  <input
                    type="text"
                    placeholder="0"
                    value={quickAmounts.graduated}
                    onChange={(e) => setQuickAmount('graduated', e.target.value)}
                    onFocus={handleInputFocus}
                    className="explorer-quickbuy-input"
                  />
                  <img className="quickbuy-monad-icon" src={monadicon} />
                </div>
                <button
                  className={`column-filter-icon ${appliedFilters && activeFilterTab === 'graduated' ? 'active' : ''
                    }`}
                  onClick={() => onOpenFiltersForColumn('graduated')}
                  title="filter graduated tokens"
                >
                  <img className="filter-icon" src={filter} />
                  {appliedFilters && activeFilterTab === 'graduated' && (
                    <span className="filter-active-dot" />
                  )}
                </button>
              </div>
            </div>

            <div className="explorer-tokens-list">
              {isLoading ? (
                Array.from({ length: 14 }).map((_, i) => (
                  <div key={`sk-graduated-${i}`} className="explorer-token-row loading">
                    <div className="explorer-token-left">
                      <div className="explorer-token-image-container">
                        <div className="explorer-progress-spacer">
                          <div className="explorer-image-wrapper">
                            <img className="explorer-token-image" alt="loading" />
                          </div>
                        </div>
                      </div>
                      <span className="explorer-contract-address">Loading...</span>
                    </div>
                  </div>
                ))
              ) : graduatedTokens.length ? (
                graduatedTokens.map((t) => (
                  <TokenRow
                    key={t.id}
                    token={t}
                    quickbuyAmount={quickAmounts.graduated}
                    onHideToken={hideToken}
                    isLoading={loading.has(t.id)}
                  />
                ))
              ) : (
                <div className="no-tokens-message">
                  <img src={empty} className="empty-icon" />
                  No tokens match the current filters
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenExplorer;
