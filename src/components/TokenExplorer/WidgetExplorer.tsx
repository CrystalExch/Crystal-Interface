import { EyeOff, Search } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import { encodeFunctionData } from 'viem';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi';
import { settings } from '../../settings';
import {
  showLoadingPopup,
  updatePopup,
} from '../MemeTransactionPopup/MemeTransactionPopupManager';
import { defaultMetrics } from './TokenData';

import camera from '../../assets/camera.svg';
import closebutton from '../../assets/close_button.png';
import discord from '../../assets/discord1.svg';
import empty from '../../assets/empty.svg';
import filter from '../../assets/filter.svg';
import lightning from '../../assets/flash.png';
import monadicon from '../../assets/monadlogo.svg';
import telegram from '../../assets/telegram.png';
import './WidgetExplorer.css';

export interface Token {
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
  status: 'new' | 'graduating' | 'graduated';
  description: string;
  created: string;
  bondingAmount: number;
  volumeDelta: number;
  telegramHandle: string;
  discordHandle: string;
}

interface WidgetExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  setpopup: (popup: number) => void;
  appliedFilters?: any;
  onOpenFiltersForColumn: (c: Token['status']) => void;
  activeFilterTab?: Token['status'];
  sendUserOperationAsync: any;
  onSnapToSide?: (side: 'left' | 'right' | 'none') => void;
  currentSnapSide?: 'left' | 'right' | 'none';
  onWidgetResize?: (width: number) => void;
}

interface WidgetPosition {
  x: number;
  y: number;
}

interface WidgetDimensions {
  width: number;
  height: number;
}

interface DragOffset {
  x: number;
  y: number;
}

interface ResizeStart {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PreviewPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

const MAX_PER_COLUMN = 30;
const TOTAL_SUPPLY = 1e9;
const SNAP_THRESHOLD = 50;
const SIDEBAR_WIDTH = 280;
const MIN_WIDTH = 350;
const MAX_WIDTH = 800;
const MIN_HEIGHT = 400;
const MAX_HEIGHT = 900;

const ROUTER_EVENT =
  '0xfe210c99153843bc67efa2e9a61ec1d63c505e379b9dcf05a9520e84e36e6063';
const MARKET_UPDATE_EVENT =
  '0xc367a2f5396f96d105baaaa90fe29b1bb18ef54c712964410d02451e67c19d3e';
const SUBGRAPH_URL = 'https://gateway.thegraph.com/api/b9cc5f58f8ad5399b2c4dd27fa52d881/subgraphs/id/BJKD3ViFyTeyamKBzC1wS7a3XMuQijvBehgNaSBb197e';

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

const getBondingColor = (b: number): string => {
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

const formatPrice = (p: number): string => {
  if (p >= 1e12) return `${(p / 1e12).toFixed(1)}T MON`;
  if (p >= 1e9) return `${(p / 1e9).toFixed(1)}B MON`;
  if (p >= 1e6) return `${(p / 1e6).toFixed(1)}M MON`;
  if (p >= 1e3) return `${(p / 1e3).toFixed(1)}K MON`;
  return `${p.toFixed(2)} MON`;
};

const formatTimeAgo = (t: string): string => {
  if (t.includes('h ago')) return t.replace(' ago', '');
  if (t.includes('d ago')) return `${parseInt(t) * 24}h`;
  if (t.includes('w ago')) return `${parseInt(t) * 7 * 24}h`;
  if (t.includes('m ago')) return t.replace(' ago', '');
  if (t.includes('s ago')) return t.replace(' ago', '');
  return t;
};

const calculateBondingPercentage = (marketCap: number): number => {
  const bondingPercentage = Math.min((marketCap / 10000) * 100, 100);
  return bondingPercentage;
};

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const [vis, setVis] = useState<boolean>(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top + scrollY - 25;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollY + 25;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - 25;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + 25;
        break;
    }

    setTooltipPosition({ top, left });
  }, [position]);

  useEffect(() => {
    if (vis) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [vis, updatePosition]);

  return (
    <div
      ref={containerRef}
      className="widget-tooltip-container"
      onMouseEnter={() => setVis(true)}
      onMouseLeave={() => setVis(false)}
    >
      {children}
      {vis &&
        createPortal(
          <div
            className={`widget-tooltip widget-tooltip-${position} widget-fade-popup widget-visible`}
            style={{
              position: 'absolute',
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform:
                position === 'top' || position === 'bottom'
                  ? 'translateX(-50%)'
                  : position === 'left' || position === 'right'
                    ? 'translateY(-50%)'
                    : 'none',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          >
            <div className="widget-tooltip-content">{content}</div>
          </div>,
          document.body,
        )}
    </div>
  );
};

interface TokenRowProps {
  token: Token;
  quickbuyAmount: string;
  onHideToken: (tokenId: string) => void;
  isLoading: boolean;
  hoveredToken: string | null;
  hoveredImage: string | null;
  onTokenHover: (id: string) => void;
  onTokenLeave: () => void;
  onImageHover: (tokenId: string) => void;
  onImageLeave: () => void;
  onTokenClick: (token: Token) => void;
  onQuickBuy: (token: Token, amount: string) => void;
  onCopyToClipboard: (text: string) => void;
  onWebsiteOpen: (url: string) => void;
  onTwitterOpen: (handle: string) => void;
  onTwitterContractSearch: (address: string) => void;
  onImageSearch: (image: string) => void;
  onTelegramOpen: (handle: string) => void;
  onDiscordOpen: (handle: string) => void;
}

// Complete TokenRow component (EXACT same as TokenExplorer)
const TokenRow = React.memo<TokenRowProps>(
  ({
    token,
    quickbuyAmount,
    onHideToken,
    isLoading,
    hoveredToken,
    hoveredImage,
    onTokenHover,
    onTokenLeave,
    onImageHover,
    onImageLeave,
    onTokenClick,
    onQuickBuy,
    onCopyToClipboard,
    onWebsiteOpen,
    onTwitterOpen,
    onTwitterContractSearch,
    onImageSearch,
    onTelegramOpen,
    onDiscordOpen,
  }) => {
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const [previewPosition, setPreviewPosition] = useState<PreviewPosition>({
      top: 0,
      left: 0,
      placement: 'bottom',
    });
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [positionCalculated, setPositionCalculated] =
      useState<boolean>(false);

    const bondingPercentage = useMemo(() => {
      return calculateBondingPercentage(token.marketCap);
    }, [token.marketCap]);

    const updatePreviewPosition = useCallback(() => {
      if (!imageContainerRef.current) return;

      const rect = imageContainerRef.current.getBoundingClientRect();
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const previewWidth = 150;
      const previewHeight = 150 + 30;
      const offset = 12;

      let top = 0;
      let left = 0;
      let placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const spaceRight = viewportWidth - rect.right;
      const spaceLeft = rect.left;

      if (spaceBelow >= previewHeight + offset) {
        placement = 'bottom';
        top = rect.bottom + scrollY + offset;
        left = centerX + scrollX - previewWidth / 2;
      } else if (spaceAbove >= previewHeight + offset) {
        placement = 'top';
        top = rect.top + scrollY - previewHeight - offset;
        left = centerX + scrollX - previewWidth / 2;
      } else if (spaceRight >= previewWidth + offset) {
        placement = 'right';
        top = centerY + scrollY - previewHeight / 2;
        left = rect.right + scrollX + offset;
      } else if (spaceLeft >= previewWidth + offset) {
        placement = 'left';
        top = centerY + scrollY - previewHeight / 2;
        left = rect.left + scrollX - previewWidth - offset;
      } else {
        placement = 'bottom';
        top = rect.bottom + scrollY + offset;
        left = centerX + scrollX - previewWidth / 2;
      }

      if (left < scrollX + 10) {
        left = scrollX + 10;
      } else if (left + previewWidth > scrollX + viewportWidth - 10) {
        left = scrollX + viewportWidth - previewWidth - 10;
      }

      if (top < scrollY + 10) {
        top = scrollY + 10;
      } else if (top + previewHeight > scrollY + viewportHeight - 10) {
        top = scrollY + viewportHeight - previewHeight - 10;
      }

      setPreviewPosition({ top, left, placement });
    }, []);

    useEffect(() => {
      if (hoveredImage === token.id) {
        setPositionCalculated(false);
        updatePreviewPosition();

        const timer = setTimeout(() => {
          setPositionCalculated(true);
          setShowPreview(true);
        }, 10);

        const handleResize = () => {
          updatePreviewPosition();
        };

        window.addEventListener('scroll', updatePreviewPosition);
        window.addEventListener('resize', handleResize);

        return () => {
          clearTimeout(timer);
          window.removeEventListener('scroll', updatePreviewPosition);
          window.removeEventListener('resize', handleResize);
        };
      } else {
        setShowPreview(false);
        setPositionCalculated(false);
      }
    }, [hoveredImage, token.id, updatePreviewPosition]);

    const totalTraders = useMemo(
      () => token.holders + token.proTraders + token.kolTraders,
      [token.holders, token.proTraders, token.kolTraders],
    );

    const showBonding =
      (token.status === 'new' || token.status === 'graduating') &&
      hoveredToken === token.id;

    const totalTransactions = token.buyTransactions + token.sellTransactions;
    const buyPct = useMemo(() => {
      if (totalTransactions === 0) return 0;
      return (token.buyTransactions / totalTransactions) * 100;
    }, [token.buyTransactions, totalTransactions]);

    const sellPct = useMemo(() => {
      if (totalTransactions === 0) return 0;
      return (token.sellTransactions / totalTransactions) * 100;
    }, [token.sellTransactions, totalTransactions]);

    return (
      <div
        className="widget-explorer-token-row"
        onMouseEnter={() => onTokenHover(token.id)}
        onMouseLeave={onTokenLeave}
        onClick={() => onTokenClick(token)}
      >
        <Tooltip content="Hide Token">
          <button
            className="widget-explorer-hide-button"
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
          className={`widget-bonding-amount-display ${showBonding ? 'widget-visible' : ''}`}
          style={{ color: getBondingColor(bondingPercentage) }}
        >
          BONDING: {bondingPercentage.toFixed(1)}%
        </div>

        <div className="widget-explorer-token-left">
          <div
            ref={imageContainerRef}
            className={`widget-explorer-token-image-container ${token.status === 'graduated' ? 'widget-graduated' : ''}`}
            onClick={() => onImageSearch(token.image)}
            onMouseEnter={() => onImageHover(token.id)}
            onMouseLeave={onImageLeave}
            style={
              token.status === 'graduated'
                ? { position: 'relative' }
                : ({
                    position: 'relative',
                    '--progress-angle': `${(bondingPercentage / 100) * 360}deg`,
                    '--progress-color-start': createColorGradient(
                      getBondingColor(bondingPercentage),
                    ).start,
                    '--progress-color-mid': createColorGradient(
                      getBondingColor(bondingPercentage),
                    ).mid,
                    '--progress-color-end': createColorGradient(
                      getBondingColor(bondingPercentage),
                    ).end,
                  } as React.CSSProperties)
            }
          >
            <div className="widget-explorer-progress-spacer">
              <div className="widget-explorer-image-wrapper">
                <img
                  src={token.image}
                  alt={token.name}
                  className="widget-explorer-token-image"
                />
                <div className="widget-explorer-image-overlay">
                  <img
                    className="widget-camera-icon"
                    src={camera}
                    alt="inspect"
                  />
                </div>
              </div>
            </div>

            {hoveredImage === token.id &&
              positionCalculated &&
              createPortal(
                <div
                  className={`widget-explorer-image-preview ${showPreview ? 'widget-show' : ''} widget-placement-${previewPosition.placement}`}
                  style={{
                    position: 'absolute',
                    top: `${previewPosition.top}px`,
                    left: `${previewPosition.left}px`,
                    zIndex: 10000,
                    pointerEvents: 'none',
                  }}
                >
                  <div className="widget-explorer-preview-content">
                    <img
                      src={token.image}
                      alt={`${token.name} preview`}
                      className="widget-explorer-preview-image"
                    />
                    <div className="widget-explorer-camera-preview-text">
                      <span className="widget-explorer-token-ticker-preview">
                        {token.symbol}
                      </span>
                      <span className="widget-explorer-token-name-preview">
                        {token.name}
                      </span>
                    </div>
                  </div>
                </div>,
                document.body,
              )}
          </div>

          <span className="widget-explorer-contract-address">
            {token.tokenAddress.slice(0, 6)}…{token.tokenAddress.slice(-4)}
          </span>
        </div>

        <div className="widget-explorer-token-details">
          <div className="widget-explorer-detail-section">
            <div className="widget-explorer-top-row">
              <div className="widget-explorer-token-info">
                <h3 className="widget-explorer-token-symbol">{token.symbol}</h3>
                <div className="widget-explorer-token-name-container">
                  <p
                    className="widget-explorer-token-name"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyToClipboard(token.name);
                    }}
                    style={{ cursor: 'pointer' }}
                    title="Click to copy token name"
                  >
                    {token.name}
                  </p>
                  <button
                    className="widget-explorer-copy-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyToClipboard(token.tokenAddress);
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="widget-explorer-second-row">
              <div className="widget-explorer-price-section">
                <span className="widget-explorer-time-created">
                  {formatTimeAgo(token.created)}
                </span>

                {token.twitterHandle && (
                  <button
                    className="widget-explorer-twitter-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTwitterOpen(token.twitterHandle);
                    }}
                    title={`visit @${token.twitterHandle}`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </button>
                )}

                {token.website && (
                  <button
                    className="widget-explorer-website-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      onWebsiteOpen(token.website);
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                  </button>
                )}

                {token.telegramHandle && (
                  <button
                    className="widget-explorer-telegram-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTelegramOpen(token.telegramHandle);
                    }}
                    title="share on telegram"
                  >
                    <img src={telegram} alt="telegram" />
                  </button>
                )}

                {token.discordHandle && (
                  <button
                    className="widget-explorer-discord-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDiscordOpen(token.discordHandle);
                    }}
                  >
                    <img src={discord} alt="discord" />
                  </button>
                )}

                <button
                  className="widget-explorer-twitter-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTwitterContractSearch(token.tokenAddress);
                  }}
                  title="search contract on twitter"
                >
                  <Search size={14} />
                </button>
              </div>

              <div className="widget-explorer-additional-data">
                <Tooltip content="Holders">
                  <div className="widget-explorer-stat-item">
                    <svg
                      className="widget-traders-icon"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 8.8007812 3.7890625 C 6.3407812 3.7890625 4.3496094 5.78 4.3496094 8.25 C 4.3496094 9.6746499 5.0287619 10.931069 6.0703125 11.748047 C 3.385306 12.836193 1.4902344 15.466784 1.4902344 18.550781 C 1.4902344 18.960781 1.8202344 19.300781 2.2402344 19.300781 C 2.6502344 19.300781 2.9902344 18.960781 2.9902344 18.550781 C 2.9902344 15.330781 5.6000781 12.720703 8.8300781 12.720703 L 8.8203125 12.710938 C 8.9214856 12.710938 9.0168776 12.68774 9.1054688 12.650391 C 9.1958823 12.612273 9.2788858 12.556763 9.3476562 12.488281 C 9.4163056 12.41992 9.4712705 12.340031 9.5097656 12.25 C 9.5480469 12.160469 9.5703125 12.063437 9.5703125 11.960938 C 9.5703125 11.540938 9.2303125 11.210938 8.8203125 11.210938 C 7.1903125 11.210938 5.8691406 9.8897656 5.8691406 8.2597656 C 5.8691406 6.6297656 7.1900781 5.3105469 8.8300781 5.3105469 L 8.7890625 5.2890625 C 9.2090625 5.2890625 9.5507812 4.9490625 9.5507812 4.5390625 C 9.5507812 4.1190625 9.2107813 3.7890625 8.8007812 3.7890625 z M 14.740234 3.8007812 C 12.150234 3.8007812 10.060547 5.9002344 10.060547 8.4902344 L 10.039062 8.4707031 C 10.039063 10.006512 10.78857 11.35736 11.929688 12.212891 C 9.0414704 13.338134 7 16.136414 7 19.429688 C 7 19.839688 7.33 20.179688 7.75 20.179688 C 8.16 20.179688 8.5 19.839688 8.5 19.429688 C 8.5 15.969687 11.29 13.179688 14.75 13.179688 L 14.720703 13.160156 C 14.724012 13.160163 14.727158 13.160156 14.730469 13.160156 C 16.156602 13.162373 17.461986 13.641095 18.519531 14.449219 C 18.849531 14.709219 19.320078 14.640313 19.580078 14.320312 C 19.840078 13.990313 19.769219 13.519531 19.449219 13.269531 C 18.873492 12.826664 18.229049 12.471483 17.539062 12.205078 C 18.674662 11.350091 19.419922 10.006007 19.419922 8.4804688 C 19.419922 5.8904687 17.320234 3.8007812 14.740234 3.8007812 z M 14.730469 5.2890625 C 16.490469 5.2890625 17.919922 6.7104688 17.919922 8.4804688 C 17.919922 10.240469 16.500234 11.669922 14.740234 11.669922 C 12.980234 11.669922 11.560547 10.250234 11.560547 8.4902344 C 11.560547 6.7302344 12.98 5.3105469 14.75 5.3105469 L 14.730469 5.2890625 z M 21.339844 16.230469 C 21.24375 16.226719 21.145781 16.241797 21.050781 16.279297 L 21.039062 16.259766 C 20.649063 16.409766 20.449609 16.840469 20.599609 17.230469 C 20.849609 17.910469 20.990234 18.640156 20.990234 19.410156 C 20.990234 19.820156 21.320234 20.160156 21.740234 20.160156 C 22.150234 20.160156 22.490234 19.820156 22.490234 19.410156 C 22.490234 18.470156 22.319766 17.560703 22.009766 16.720703 C 21.897266 16.428203 21.628125 16.241719 21.339844 16.230469 z" />
                    </svg>
                    <span className="widget-explorer-stat-value">
                      {totalTraders.toLocaleString()}
                    </span>
                  </div>
                </Tooltip>

                <Tooltip content="Pro Traders">
                  <div className="widget-explorer-stat-item">
                    <svg
                      className="widget-traders-icon"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 12 2 L 12 4 L 11 4 C 10.4 4 10 4.4 10 5 L 10 10 C 10 10.6 10.4 11 11 11 L 12 11 L 12 13 L 14 13 L 14 11 L 15 11 C 15.6 11 16 10.6 16 10 L 16 5 C 16 4.4 15.6 4 15 4 L 14 4 L 14 2 L 12 2 z M 4 9 L 4 11 L 3 11 C 2.4 11 2 11.4 2 12 L 2 17 C 2 17.6 2.4 18 3 18 L 4 18 L 4 20 L 6 20 L 6 18 L 7 18 C 7.6 18 8 17.6 8 17 L 8 12 C 8 11.4 7.6 11 7 11 L 6 11 L 6 9 L 4 9 z M 18 11 L 18 13 L 17 13 C 16.4 13 16 13.4 16 14 L 16 19 C 16 19.6 16.4 20 17 20 L 18 20 L 18 22 L 20 22 L 20 20 L 21 20 C 21.6 20 22 19.6 22 19 L 22 14 C 22 13.4 21.6 13 21 13 L 20 13 L 20 11 L 18 11 z M 4 13 L 6 13 L 6 16 L 4 16 L 4 13 z" />
                    </svg>
                    <span className="widget-explorer-stat-value">
                      {token.proTraders.toLocaleString()}
                    </span>
                  </div>
                </Tooltip>

                <Tooltip content="KOLs">
                  <div className="widget-explorer-stat-item">
                    <svg
                      className="widget-traders-icon"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 2 3 L 2 4 C 2 6.7666667 3.1395226 8.7620178 4.1679688 10.304688 C 5.1964149 11.847357 6 12.944444 6 14 L 8 14 C 8 13.983831 7.9962584 13.96922 7.9960938 13.953125 C 8.97458 16.166161 10 17 10 17 L 14 17 C 14 17 15.02542 16.166161 16.003906 13.953125 C 16.003742 13.96922 16 13.983831 16 14 L 18 14 C 18 12.944444 18.803585 11.847356 19.832031 10.304688 C 20.860477 8.7620178 22 6.7666667 22 4 L 22 3 L 2 3 z M 4.1914062 5 L 6.2734375 5 C 6.337283 7.4080712 6.6187571 9.3802374 7.0078125 10.974609 C 6.6365749 10.366787 6.2230927 9.7819045 5.8320312 9.1953125 C 5.0286664 7.9902652 4.4191868 6.6549795 4.1914062 5 z M 8.3027344 5 L 15.697266 5 L 15.697266 6 L 15.693359 6 C 15.380359 11.398 13.843047 14.041 13.123047 15 L 10.882812 15 C 10.142812 14.016 8.6176406 11.371 8.3066406 6 L 8.3027344 6 L 8.3027344 5 z M 17.726562 5 L 19.808594 5 C 19.580813 6.6549795 18.971334 7.9902652 18.167969 9.1953125 C 17.776907 9.7819045 17.363425 10.366787 16.992188 10.974609 C 17.381243 9.3802374 17.662717 7.4080712 17.726562 5 z M 7 19 L 7 21 L 17 21 L 17 19 L 7 19 z" />
                    </svg>
                    <span className="widget-explorer-stat-value">
                      {token.kolTraders.toLocaleString()}
                    </span>
                  </div>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="widget-explorer-holdings-section">
            <Tooltip content="Sniper Holding">
              <div className="widget-explorer-holding-item">
                <svg
                  className="widget-sniper-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={
                    token.sniperHolding > 5 ? '#eb7070ff' : 'rgb(67, 254, 154)'
                  }
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 11.244141 2.0019531 L 11.244141 2.7519531 L 11.244141 3.1542969 C 6.9115518 3.5321749 3.524065 6.919829 3.1445312 11.251953 L 2.7421875 11.251953 L 1.9921875 11.251953 L 1.9921875 12.751953 L 2.7421875 12.751953 L 3.1445312 12.751953 C 3.5225907 17.085781 6.9110367 20.473593 11.244141 20.851562 L 11.244141 21.253906 L 11.244141 22.003906 L 12.744141 22.003906 L 12.744141 21.253906 L 12.744141 20.851562 C 17.076343 20.47195 20.463928 17.083895 20.841797 12.751953 L 21.244141 12.751953 L 21.994141 12.751953 L 21.994141 11.251953 L 21.244141 11.251953 L 20.841797 11.251953 C 20.462285 6.9209126 17.074458 3.5337191 12.744141 3.1542969 L 12.744141 2.7519531 L 12.744141 2.0019531 L 11.244141 2.0019531 z M 11.244141 4.6523438 L 11.244141 8.0742188 C 9.6430468 8.3817751 8.3759724 9.6507475 8.0683594 11.251953 L 4.6425781 11.251953 C 5.0091295 7.7343248 7.7260437 5.0173387 11.244141 4.6523438 z M 12.744141 4.6523438 C 16.25959 5.0189905 18.975147 7.7358303 19.341797 11.251953 L 15.917969 11.251953 C 15.610766 9.6510551 14.344012 8.3831177 12.744141 8.0742188 L 12.744141 4.6523438 z M 11.992188 9.4980469 C 13.371637 9.4980469 14.481489 10.6041 14.492188 11.982422 L 14.492188 12.021484 C 14.481501 13.40006 13.372858 14.503906 11.992188 14.503906 C 10.606048 14.503906 9.4921875 13.389599 9.4921875 12.001953 C 9.4921875 10.614029 10.60482 9.4980469 11.992188 9.4980469 z M 4.6425781 12.751953 L 8.0683594 12.751953 C 8.3760866 14.352973 9.6433875 15.620527 11.244141 15.927734 L 11.244141 19.353516 C 7.7258668 18.988181 5.0077831 16.270941 4.6425781 12.751953 z M 15.917969 12.751953 L 19.34375 12.751953 C 18.97855 16.26893 16.261295 18.986659 12.744141 19.353516 L 12.744141 15.927734 C 14.344596 15.619809 15.610176 14.35218 15.917969 12.751953 z" />
                </svg>
                <span
                  className="widget-explorer-holding-value"
                  style={{
                    color:
                      token.sniperHolding > 5
                        ? '#eb7070ff'
                        : 'rgb(67, 254, 154)',
                  }}
                >
                  {token.sniperHolding.toFixed(1)}%
                </span>
              </div>
            </Tooltip>

            <Tooltip content="Developer Holding">
              <div className="widget-explorer-holding-item">
                <svg
                  className="widget-holding-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 30 30"
                  fill={
                    token.devHolding > 5 ? '#eb7070ff' : 'rgb(67, 254, 154)'
                  }
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                </svg>
                <span
                  className="widget-explorer-holding-value"
                  style={{
                    color:
                      token.devHolding > 5 ? '#eb7070ff' : 'rgb(67, 254, 154)',
                  }}
                >
                  {token.devHolding.toFixed(1)}%
                </span>
              </div>
            </Tooltip>

            <Tooltip content="Bundle Holding">
              <div className="widget-explorer-holding-item">
                <svg
                  className="widget-holding-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 128 128"
                  fill={
                    token.bundleHolding > 5 ? '#eb7070ff' : 'rgb(67, 254, 154)'
                  }
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M117 68.26l-26-15a2 2 0 00-2 0l-26 15A2 2 0 0062 70v30a2 2 0 001 1.73l26 15a2 2 0 002 0l26-15a2 2 0 001-1.73V70A2 2 0 00117 68.26zm-27-11l22.46 13L90 82.7 68 70zM66 73.46L88 86.15v25.41L66 98.86zm26 38.1V86.18L114 74V98.85zM56 102.25l-16 8.82V86.72l17-10a2 2 0 10-2-3.44l-17 10L15.55 70.56 38 57.82l17 8.95a2 2 0 001.86-3.54l-18-9.46a2 2 0 00-1.92 0L11 68.53a2 2 0 00-1 1.74V99.73a2 2 0 001 1.74L37 116.2a2 2 0 002 0l19-10.46a2 2 0 10-1.92-3.5zm-42-28L36 86.74V111L14 98.56zM38 49a2 2 0 002-2V28.46L62 41.15V61a2 2 0 004 0V41.15L88 28.46V47a2 2 0 004 0V25a2 2 0 00-1-1.73l-26-15a2 2 0 00-2 0l-26 15A2 2 0 0036 25V47A2 2 0 0038 49zM64 12.31L86 25 64 37.69 42 25z" />
                </svg>
                <span
                  className="widget-explorer-holding-value"
                  style={{
                    color:
                      token.bundleHolding > 5
                        ? '#eb7070ff'
                        : 'rgb(67, 254, 154)',
                  }}
                >
                  {token.bundleHolding.toFixed(1)}%
                </span>
              </div>
            </Tooltip>

            <Tooltip content="Insider Holding">
              <div className="widget-explorer-holding-item">
                <svg
                  className="widget-holding-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 32 32"
                  fill={
                    token.insiderHolding > 5 ? '#eb7070ff' : 'rgb(67, 254, 154)'
                  }
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 16 3 C 14.0625 3 12.570313 3.507813 11.5 4.34375 C 10.429688 5.179688 9.8125 6.304688 9.375 7.34375 C 8.9375 8.382813 8.65625 9.378906 8.375 10.09375 C 8.09375 10.808594 7.859375 11.085938 7.65625 11.15625 C 4.828125 12.160156 3 14.863281 3 18 L 3 19 L 4 19 C 5.347656 19 6.003906 19.28125 6.3125 19.53125 C 6.621094 19.78125 6.742188 20.066406 6.8125 20.5625 C 6.882813 21.058594 6.847656 21.664063 6.9375 22.34375 C 6.984375 22.683594 7.054688 23.066406 7.28125 23.4375 C 7.507813 23.808594 7.917969 24.128906 8.375 24.28125 C 9.433594 24.632813 10.113281 24.855469 10.53125 25.09375 C 10.949219 25.332031 11.199219 25.546875 11.53125 26.25 C 11.847656 26.917969 12.273438 27.648438 13.03125 28.1875 C 13.789063 28.726563 14.808594 29.015625 16.09375 29 C 18.195313 28.972656 19.449219 27.886719 20.09375 26.9375 C 20.417969 26.460938 20.644531 26.050781 20.84375 25.78125 C 21.042969 25.511719 21.164063 25.40625 21.375 25.34375 C 22.730469 24.9375 23.605469 24.25 24.09375 23.46875 C 24.582031 22.6875 24.675781 21.921875 24.8125 21.40625 C 24.949219 20.890625 25.046875 20.6875 25.375 20.46875 C 25.703125 20.25 26.453125 20 28 20 L 29 20 L 29 19 C 29 17.621094 29.046875 16.015625 28.4375 14.5 C 27.828125 12.984375 26.441406 11.644531 24.15625 11.125 C 24.132813 11.121094 24.105469 11.132813 24 11 C 23.894531 10.867188 23.734375 10.601563 23.59375 10.25 C 23.3125 9.550781 23.042969 8.527344 22.59375 7.46875 C 22.144531 6.410156 21.503906 5.269531 20.4375 4.40625 C 19.371094 3.542969 17.90625 3 16 3 Z M 16 5 C 17.539063 5 18.480469 5.394531 19.1875 5.96875 C 19.894531 6.542969 20.367188 7.347656 20.75 8.25 C 21.132813 9.152344 21.402344 10.128906 21.75 11 C 21.921875 11.433594 22.109375 11.839844 22.40625 12.21875 C 22.703125 12.597656 23.136719 12.96875 23.6875 13.09375 C 25.488281 13.503906 26.15625 14.242188 26.5625 15.25 C 26.871094 16.015625 26.878906 17.066406 26.90625 18.09375 C 25.796875 18.1875 24.886719 18.386719 24.25 18.8125 C 23.40625 19.378906 23.050781 20.25 22.875 20.90625 C 22.699219 21.5625 22.632813 22.042969 22.40625 22.40625 C 22.179688 22.769531 21.808594 23.128906 20.78125 23.4375 C 20.070313 23.652344 19.558594 24.140625 19.21875 24.59375 C 18.878906 25.046875 18.675781 25.460938 18.4375 25.8125 C 17.960938 26.515625 17.617188 26.980469 16.0625 27 C 15.078125 27.011719 14.550781 26.820313 14.1875 26.5625 C 13.824219 26.304688 13.558594 25.929688 13.3125 25.40625 C 12.867188 24.460938 12.269531 23.765625 11.53125 23.34375 C 10.792969 22.921875 10.023438 22.714844 9 22.375 C 8.992188 22.359375 8.933594 22.285156 8.90625 22.09375 C 8.855469 21.710938 8.886719 21.035156 8.78125 20.28125 C 8.675781 19.527344 8.367188 18.613281 7.5625 17.96875 C 7 17.515625 6.195313 17.289063 5.25 17.15625 C 5.542969 15.230469 6.554688 13.65625 8.3125 13.03125 C 9.375 12.65625 9.898438 11.730469 10.25 10.84375 C 10.601563 9.957031 10.851563 8.96875 11.21875 8.09375 C 11.585938 7.21875 12.019531 6.480469 12.71875 5.9375 C 13.417969 5.394531 14.402344 5 16 5 Z M 13 9 C 12.449219 9 12 9.671875 12 10.5 C 12 11.328125 12.449219 12 13 12 C 13.550781 12 14 11.328125 14 10.5 C 14 9.671875 13.550781 9 13 9 Z M 17 9 C 16.449219 9 16 9.671875 16 10.5 C 16 11.328125 16.449219 12 17 12 C 17.550781 12 18 11.328125 18 10.5 C 18 9.671875 17.550781 9 17 9 Z" />
                </svg>
                <span
                  className="widget-explorer-holding-value"
                  style={{
                    color:
                      token.insiderHolding > 5
                        ? '#eb7070ff'
                        : 'rgb(67, 254, 154)',
                  }}
                >
                  {token.insiderHolding.toFixed(1)}%
                </span>
              </div>
            </Tooltip>

            <Tooltip content="Top 10 holders percentage">
              <div className="widget-explorer-holding-item">
                <svg
                  className="widget-holding-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 32 32"
                  fill={
                    token.top10Holding > 5 ? '#eb7070ff' : 'rgb(67, 254, 154)'
                  }
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 15 4 L 15 6 L 13 6 L 13 8 L 15 8 L 15 9.1875 C 14.011719 9.554688 13.25 10.433594 13.0625 11.5 C 12.277344 11.164063 11.40625 11 10.5 11 C 6.921875 11 4 13.921875 4 17.5 C 4 19.792969 5.199219 21.8125 7 22.96875 L 7 27 L 25 27 L 25 22.96875 C 26.800781 21.8125 28 19.792969 28 17.5 C 28 13.921875 25.078125 11 21.5 11 C 20.59375 11 19.722656 11.164063 18.9375 11.5 C 18.75 10.433594 17.988281 9.554688 17 9.1875 L 17 8 L 19 8 L 19 6 L 17 6 L 17 4 Z M 16 11 C 16.5625 11 17 11.4375 17 12 C 17 12.5625 16.5625 13 16 13 C 15.4375 13 15 12.5625 15 12 C 15 11.4375 15.4375 11 16 11 Z M 10.5 13 C 12.996094 13 15 15.003906 15 17.5 L 15 22 L 10.5 22 C 8.003906 22 6 19.996094 6 17.5 C 6 15.003906 8.003906 13 10.5 13 Z M 21.5 13 C 23.996094 13 26 15.003906 26 17.5 C 26 19.996094 23.996094 22 21.5 22 L 17 22 L 17 17.5 C 17 15.003906 19.003906 13 21.5 13 Z M 9 24 L 23 24 L 23 25 L 9 25 Z" />
                </svg>
                <span
                  className="widget-explorer-holding-value"
                  style={{
                    color:
                      token.top10Holding > 5
                        ? '#eb7070ff'
                        : 'rgb(67, 254, 154)',
                  }}
                >
                  {token.top10Holding.toFixed(1)}%
                </span>
              </div>
            </Tooltip>
          </div>
        </div>

        <div className="widget-explorer-third-row">
          <Tooltip content="Market Cap">
            <div className="widget-explorer-market-cap">
              <span className="widget-mc-label">MC</span>
              <span className="widget-explorer-market-cap">
                {formatPrice(token.marketCap)}
              </span>
            </div>
          </Tooltip>

          <Tooltip content="Volume">
            <div className="widget-explorer-volume">
              <span className="widget-mc-label">V</span>
              <span className="widget-mc-value">
                {formatPrice(token.volume24h)}
              </span>
            </div>
          </Tooltip>

          <div className="widget-explorer-third-row-section">
            <Tooltip content="Global Fees Paid">
              <div className="widget-explorer-stat-item">
                <span className="widget-explorer-fee-label">F</span>
                <img
                  className="widget-explorer-fee-icon"
                  src={monadicon}
                  alt="fee"
                />
                <span className="widget-explorer-fee-total">
                  {token.globalFeesPaid}
                </span>
              </div>
            </Tooltip>

            <Tooltip content="Transactions">
              <div className="widget-explorer-tx-bar">
                <div className="widget-explorer-tx-header">
                  <span className="widget-explorer-tx-label">TX</span>
                  <span className="widget-explorer-tx-total">
                    {totalTransactions.toLocaleString()}
                  </span>
                </div>
                <div className="widget-explorer-tx-visual-bar">
                  {totalTransactions === 0 ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#252526ff',
                        borderRadius: '1px',
                      }}
                    />
                  ) : (
                    <>
                      <div
                        className="widget-explorer-tx-buy-portion"
                        style={{ width: `${buyPct}%` }}
                      />
                      <div
                        className="widget-explorer-tx-sell-portion"
                        style={{ width: `${sellPct}%` }}
                      />
                    </>
                  )}
                </div>
              </div>
            </Tooltip>
          </div>

          <div className="widget-explorer-actions-section">
            <button
              className="widget-explorer-quick-buy-btn"
              onClick={(e) => {
                e.stopPropagation();
                onQuickBuy(token, quickbuyAmount);
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="widget-quickbuy-loading-spinner" />
              ) : (
                <>
                  <img
                    className="widget-explorer-quick-buy-icon"
                    src={lightning}
                  />
                  {quickbuyAmount} MON
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  },
);

interface MobileTabSelectorProps {
  activeTab: Token['status'];
  onTabChange: (tab: Token['status']) => void;
  tokenCounts: Record<Token['status'], number>;
}

const MobileTabSelector: React.FC<MobileTabSelectorProps> = ({
  activeTab,
  onTabChange,
  tokenCounts,
}) => {
  const tabs = [
    { key: 'new', label: 'New Pairs', count: tokenCounts.new },
    {
      key: 'graduating',
      label: 'Final Stretch',
      count: tokenCounts.graduating,
    },
    { key: 'graduated', label: 'Migrated', count: tokenCounts.graduated },
  ] as const;

  return (
    <div className="widget-explorer-mobile-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`widget-explorer-mobile-tab ${activeTab === tab.key ? 'widget-active' : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          <span className="widget-explorer-mobile-tab-label">{tab.label}</span>
          <span className="widget-explorer-mobile-tab-count">
            ({tab.count})
          </span>
        </button>
      ))}
    </div>
  );
};

const WidgetExplorer: React.FC<WidgetExplorerProps> = ({
  isOpen,
  onClose,
  setpopup,
  appliedFilters,
  activeFilterTab,
  onOpenFiltersForColumn,
  sendUserOperationAsync,
  onSnapToSide,
  currentSnapSide = 'none',
  onWidgetResize,
}) => {
  const navigate = useNavigate();
  const activechain =
    (settings as any).activechain ??
    (Object.keys(settings.chainConfig)[0] as keyof typeof settings.chainConfig);
  const routerAddress =
    settings.chainConfig[activechain].launchpadRouter.toLowerCase();

  // Widget positioning and dragging state
  const [position, setPosition] = useState<WidgetPosition>({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const [widgetDimensions, setWidgetDimensions] = useState<WidgetDimensions>({
    width: 400,
    height: 700,
  });
  const [isSnapped, setIsSnapped] = useState<boolean>(false);
  const [snapSide, setSnapSide] = useState<'left' | 'right' | 'none'>('none');
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [resizeStart, setResizeStart] = useState<ResizeStart>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // TokenExplorer state
  const [{ tokensByStatus, hidden, loading }, dispatch] = useReducer(
    reducer,
    initialState,
  );
  const [activeMobileTab, setActiveMobileTab] =
    useState<Token['status']>('new');
  const [quickAmounts, setQuickAmounts] = useState<
    Record<Token['status'], string>
  >(() => ({
    new: localStorage.getItem('widget-explorer-quickbuy-new') ?? '1',
    graduating:
      localStorage.getItem('widget-explorer-quickbuy-graduating') ?? '1',
    graduated:
      localStorage.getItem('widget-explorer-quickbuy-graduated') ?? '1',
  }));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  const widgetRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const subIdRef = useRef(1);
  const marketSubs = useRef<Record<string, string>>({});

  const setQuickAmount = useCallback((s: Token['status'], v: string) => {
    const clean = v.replace(/[^0-9.]/g, '');
    setQuickAmounts((p) => ({ ...p, [s]: clean }));
    localStorage.setItem(`widget-explorer-quickbuy-${s}`, clean);
  }, []);

  const handleInputFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value === '0') e.target.select();
    },
    [],
  );

  // Memoized handlers
  const handleTokenHover = useCallback((id: string) => setHoveredToken(id), []);
  const handleTokenLeave = useCallback(() => setHoveredToken(null), []);
  const handleImageHover = useCallback((id: string) => setHoveredImage(id), []);
  const handleImageLeave = useCallback(() => setHoveredImage(null), []);

  // Social handlers
  const copyToClipboard = useCallback(async (text: string) => {
    const txId = `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      await navigator.clipboard.writeText(text);

      if (showLoadingPopup && updatePopup) {
        showLoadingPopup(txId, {
          title: 'Address Copied',
          subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`,
        });

        setTimeout(() => {
          updatePopup(txId, {
            title: 'Address Copied',
            subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`,
            variant: 'success',
            confirmed: true,
            isLoading: false,
          });
        }, 100);
      }
    } catch (err) {
      console.error('Copy failed', err);

      if (showLoadingPopup && updatePopup) {
        showLoadingPopup(txId, {
          title: 'Copy Failed',
          subtitle: 'Unable to copy address to clipboard',
        });

        setTimeout(() => {
          updatePopup(txId, {
            title: 'Copy Failed',
            subtitle: 'Unable to copy address to clipboard',
            variant: 'error',
            confirmed: true,
            isLoading: false,
          });
        }, 100);
      }
    }
  }, []);

  const handleWebsiteOpen = useCallback((url: string) => {
    if (!url) return;
    const u = url.startsWith('http') ? url : `https://${url}`;
    window.open(u, '_blank', 'noopener,noreferrer');
  }, []);

  const handleTwitterOpen = useCallback((h: string) => {
    window.open(`https://${h}`, '_blank', 'noopener,noreferrer');
  }, []);

  const handleTelegramOpen = useCallback((h: string) => {
    window.open(`https://${h}`, '_blank', 'noopener,noreferrer');
  }, []);

  const handleDiscordOpen = useCallback((h: string) => {
    window.open(`https://${h}`, '_blank', 'noopener,noreferrer');
  }, []);

  const handleTwitterContractSearch = useCallback((addr: string) => {
    window.open(
      `https://twitter.com/search?q=${addr}`,
      '_blank',
      'noopener,noreferrer',
    );
  }, []);

  const handleImageSearch = useCallback((img: string) => {
    window.open(
      `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(img)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }, []);

  // WebSocket and data fetching (same as TokenExplorer)
  const subscribe = useCallback(
    (ws: WebSocket, params: any, onAck?: (subId: string) => void) => {
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
    },
    [],
  );

  const addMarket = useCallback(
    async (log: any) => {
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
          .map((byteHex: string) => String.fromCharCode(parseInt(byteHex, 16)))
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
        volumeDelta: 0,
        telegramHandle: meta?.telegram ?? '',
        discordHandle: meta?.discord ?? '',
      };

      dispatch({ type: 'ADD_MARKET', token });

      if (!marketSubs.current[market] && wsRef.current) {
        subscribe(
          wsRef.current,
          ['logs', { address: market }],
          (sub) => (marketSubs.current[market] = sub),
        );
      }
    },
    [subscribe],
  );

  const updateMarket = useCallback((log: any) => {
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
        volumeDelta: isBuy > 0 ? amountIn / 1e18 : amountOut / 1e18,
      },
    });
  }, []);

  const openWebsocket = useCallback(
    (initialMarkets: string[]): void => {
      const ws = new WebSocket('wss://testnet-rpc.monad.xyz');
      wsRef.current = ws;

      ws.onopen = () => {
        subscribe(ws, [
          'logs',
          { address: routerAddress, topics: [ROUTER_EVENT] },
        ]);

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
    },
    [routerAddress, subscribe, addMarket, updateMarket],
  );

  // Initialize data (same as TokenExplorer)
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
              launchpadTokens(first: 30, orderBy: createdAt, orderDirection: desc) {
                id
                creator {
                  id
                }
                name
                symbol
                metadataCID
                description
                social1
                social2
                social3
                createdAt
                migrated
                migratedAt
                volumeNative
                volumeToken
                buyTxs
                sellTxs
                distinctBuyers
                distinctSellers
                lastPriceNativePerTokenWad
                lastUpdatedAt
                trades {
                  id
                  amountIn
                  amountOut
                }
              }
            }`,
          }),
        });
        const json = await res.json();
        if (cancelled) return;

        const rawMarkets = json.data?.markets ?? [];

        const tokens: Token[] = await Promise.all(
          rawMarkets.map(async (m: any) => {
            const price = Number(m.latestPrice) / 1e18;

            let meta: any = {};
            try {
              const metaRes = await fetch(m.metadataCID);
              if (metaRes.ok) meta = await metaRes.json();
            } catch (e) {
              console.warn('failed to load metadata for', m.metadataCID, e);
            }

            const ageSec = Math.floor(Date.now() / 1000) - Number(m.createdAt);
            const created =
              ageSec >= 3600
                ? `${Math.floor(ageSec / 3600)}h ago`
                : ageSec >= 60
                  ? `${Math.floor(ageSec / 60)}m ago`
                  : `${ageSec}s ago`;

            return {
              ...defaultMetrics,
              id: m.id.toLowerCase(),
              tokenAddress: m.tokenAddress.toLowerCase(),
              name: m.name,
              symbol: m.symbol,
              image: meta.image ?? '/discord.svg',
              description: meta.description ?? '',
              twitterHandle: meta.twitter ?? '',
              website: meta.website ?? '',
              status: 'new',
              created,
              price,
              marketCap: price * TOTAL_SUPPLY,
              buyTransactions: Number(m.buyCount),
              sellTransactions: Number(m.sellCount),
              volume24h: Number(m.volume24h) / 1e18,
              volumeDelta: 0,
              telegramHandle: meta.telegram ?? '',
              discordHandle: meta.discord ?? '',
            };
          }),
        );

        dispatch({ type: 'INIT', tokens });
        openWebsocket(tokens.map((t) => t.id));
      } catch (err) {
        console.error('initial subgraph fetch failed', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (isOpen) {
      bootstrap();
    }

    return () => {
      cancelled = true;
      if (wsRef.current) wsRef.current.close();
    };
  }, [isOpen, openWebsocket]);

  // Quick buy handler
  const handleQuickBuy = useCallback(
    async (token: Token, amt: string) => {
      const val = BigInt(amt || '0') * 10n ** 18n;
      if (val === 0n) return;

      const txId = `quickbuy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      dispatch({ type: 'SET_LOADING', id: token.id, loading: true });

      try {
        if (showLoadingPopup) {
          showLoadingPopup(txId, {
            title: 'Sending transaction...',
            subtitle: `Quick buying ${amt} MON worth of ${token.symbol}`,
            amount: amt,
            amountUnit: 'MON',
          });
        }

        const uo = {
          target: routerAddress,
          data: encodeFunctionData({
            abi: CrystalRouterAbi,
            functionName: 'buy',
            args: [true, token.tokenAddress as `0x${string}`, val, 0n],
          }),
          value: val,
        };

        if (updatePopup) {
          updatePopup(txId, {
            title: 'Confirming transaction...',
            subtitle: `Quick buying ${amt} MON worth of ${token.symbol}`,
            variant: 'info',
          });
        }

        const op = await sendUserOperationAsync({ uo });

        if (updatePopup) {
          updatePopup(txId, {
            title: 'Quick Buy Complete',
            subtitle: `Successfully bought ${token.symbol} with ${amt} MON`,
            variant: 'success',
            confirmed: true,
            isLoading: false,
          });
        }
      } catch (e: any) {
        console.error('Quick buy failed', e);
        const msg = String(e?.message ?? '');

        if (updatePopup) {
          updatePopup(txId, {
            title: msg.toLowerCase().includes('insufficient')
              ? 'Insufficient Balance'
              : 'Quick Buy Failed',
            subtitle: msg || 'Please try again.',
            variant: 'error',
            confirmed: true,
            isLoading: false,
          });
        }
      } finally {
        dispatch({ type: 'SET_LOADING', id: token.id, loading: false });
      }
    },
    [routerAddress, sendUserOperationAsync],
  );

  // Other handlers
  const handleTokenClick = useCallback(
    (t: Token) => {
      navigate(`/meme/${t.tokenAddress}`, {
        state: { tokenData: t },
      });
    },
    [navigate],
  );

  const hideToken = useCallback(
    (id: string) => dispatch({ type: 'HIDE_TOKEN', id }),
    [],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!widgetRef.current || isSnapped || isResizing) return;

      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'IMG' ||
        target.closest('button') ||
        target.closest('.widget-close-btn') ||
        target.closest('.widget-explorer-content') ||
        target.closest('.widget-resize-handle')
      ) {
        return;
      }

      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
      e.preventDefault();
    },
    [isSnapped, isResizing],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const maxX = Math.max(0, window.innerWidth - widgetDimensions.width);
      const maxY = Math.max(0, window.innerHeight - widgetDimensions.height);

      let finalX = Math.max(0, Math.min(newX, maxX));
      let finalY = Math.max(0, Math.min(newY, maxY));

      // Check for snap zones
      const leftSnapZone = finalX < SNAP_THRESHOLD + SIDEBAR_WIDTH;
      const rightSnapZone =
        finalX > window.innerWidth - widgetDimensions.width - SNAP_THRESHOLD;

      if (leftSnapZone) {
        finalX = SIDEBAR_WIDTH;
        setSnapSide('left');
      } else if (rightSnapZone) {
        finalX = window.innerWidth - widgetDimensions.width;
        setSnapSide('right');
      } else {
        setSnapSide('none');
      }

      setPosition({ x: finalX, y: finalY });
    },
    [isDragging, dragOffset, widgetDimensions],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && snapSide !== 'none') {
      setIsSnapped(true);
      if (onSnapToSide) {
        onSnapToSide(snapSide);
      }
    }
    setIsDragging(false);
  }, [isDragging, snapSide, onSnapToSide]);

  // Resize functionality
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.preventDefault();
      e.stopPropagation();

      if (!widgetRef.current) return;

      const rect = widgetRef.current.getBoundingClientRect();
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
      });
      setResizeDirection(direction);
      setIsResizing(true);
    },
    [],
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !widgetRef.current) return;

      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = position.x;
      let newY = position.y;

      if (isSnapped) {
        // Snapped mode - only allow width adjustment, no position changes
        if (resizeDirection.includes('right')) {
          newWidth = Math.max(
            MIN_WIDTH,
            Math.min(MAX_WIDTH, resizeStart.width + deltaX),
          );
        } else if (resizeDirection.includes('left')) {
          newWidth = Math.max(
            MIN_WIDTH,
            Math.min(MAX_WIDTH, resizeStart.width - deltaX),
          );
          // Don't change position when snapped
        }
      } else {
        // Free-flow mode - allow both width and height adjustment
        if (resizeDirection.includes('right')) {
          newWidth = Math.max(
            MIN_WIDTH,
            Math.min(MAX_WIDTH, resizeStart.width + deltaX),
          );
        } else if (resizeDirection.includes('left')) {
          const proposedWidth = Math.max(
            MIN_WIDTH,
            Math.min(MAX_WIDTH, resizeStart.width - deltaX),
          );
          const widthDiff = proposedWidth - resizeStart.width;

          // Only update if the new position would be valid
          const proposedX = position.x - widthDiff;
          if (proposedX >= 0) {
            newWidth = proposedWidth;
            newX = proposedX;
          }
        }

        if (resizeDirection.includes('bottom')) {
          newHeight = Math.max(
            MIN_HEIGHT,
            Math.min(MAX_HEIGHT, resizeStart.height + deltaY),
          );
        } else if (resizeDirection.includes('top')) {
          const proposedHeight = Math.max(
            MIN_HEIGHT,
            Math.min(MAX_HEIGHT, resizeStart.height - deltaY),
          );
          const heightDiff = proposedHeight - resizeStart.height;

          // Only update if the new position would be valid
          const proposedY = position.y - heightDiff;
          if (proposedY >= 0) {
            newHeight = proposedHeight;
            newY = proposedY;
          }
        }
      }

      // Ensure the widget doesn't go off-screen
      const maxX = Math.max(0, window.innerWidth - newWidth);
      const maxY = Math.max(0, window.innerHeight - newHeight);

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setWidgetDimensions({ width: newWidth, height: newHeight });

      if (!isSnapped) {
        setPosition({ x: newX, y: newY });
      }

      if (onWidgetResize) {
        onWidgetResize(newWidth);
      }
    },
    [
      isResizing,
      resizeStart,
      resizeDirection,
      position,
      isSnapped,
      onWidgetResize,
    ],
  );
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeDirection('');
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);
  const handleUnsnap = useCallback(() => {
    setIsSnapped(false);
    setSnapSide('none');
    if (onSnapToSide) {
      onSnapToSide('none');
    }
  }, [onSnapToSide]);

  // Event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Widget dimensions calculation
  useEffect(() => {
    const handleResize = () => {
      if (!widgetRef.current) return;

      const rect = widgetRef.current.getBoundingClientRect();
      const actualWidth = rect.width || 400;
      const actualHeight = rect.height || 700;

      setWidgetDimensions({ width: actualWidth, height: actualHeight });

      if (!isSnapped) {
        setPosition((prevPosition) => {
          const maxX = Math.max(0, window.innerWidth - actualWidth);
          const maxY = Math.max(0, window.innerHeight - actualHeight);

          return {
            x: Math.max(0, Math.min(prevPosition.x, maxX)),
            y: Math.max(0, Math.min(prevPosition.y, maxY)),
          };
        });
      }
    };

    if (isOpen) {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isOpen, isSnapped]);

  // Apply filters
  const applyFilters = useCallback((list: Token[], fil: any) => {
    if (!fil) return list;
    return list.filter((t) => {
      if (fil.priceMin && t.price < +fil.priceMin) return false;
      if (fil.priceMax && t.price > +fil.priceMax) return false;
      if (fil.holdersMin && t.holders < +fil.holdersMin) return false;
      if (fil.holdersMax && t.holders > +fil.holdersMax) return false;
      if (fil.searchKeywords) {
        const kw = fil.searchKeywords
          .toLowerCase()
          .split(',')
          .map((x: string) => x.trim());
        const hay = `${t.name} ${t.symbol} ${t.description}`.toLowerCase();
        if (!kw.some((k: string) => hay.includes(k))) return false;
      }
      return true;
    });
  }, []);

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
          activeFilterTab === s
            ? applyFilters(base[s], appliedFilters)
            : base[s],
      }),
      {} as Record<Token['status'], Token[]>,
    );
  }, [tokensByStatus, hidden, appliedFilters, activeFilterTab, applyFilters]);

  const newTokens = visibleTokens.new;
  const graduatingTokens = visibleTokens.graduating;
  const graduatedTokens = visibleTokens.graduated;
  const tokenCounts = useMemo(
    () => ({
      new: newTokens.length,
      graduating: graduatingTokens.length,
      graduated: graduatedTokens.length,
    }),
    [newTokens.length, graduatingTokens.length, graduatedTokens.length],
  );

  const getWidgetStyle = () => {
    if (isSnapped && snapSide !== 'none') {
      return {
        position: 'fixed' as const,
        left: snapSide === 'left' ? `${SIDEBAR_WIDTH}px` : 'auto',
        right: snapSide === 'right' ? '0px' : 'auto',
        top: '0px',
        height: '100vh',
        width: `${widgetDimensions.width}px`,
        zIndex: 1000,
        transform: 'none',
      };
    }

    return {
      position: 'fixed' as const,
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${widgetDimensions.width}px`,
      height: `${widgetDimensions.height}px`,
      zIndex: 1000,
    };
  };

  if (!isOpen) return null;

  return (
    <div
      ref={widgetRef}
      className={`widget-explorer ${isDragging ? 'dragging' : ''} ${isSnapped ? 'snapped' : ''} ${isSnapped ? `snapped-${currentSnapSide}` : ''}`}
      style={getWidgetStyle()}
    >
      {!isSnapped && (
        <>
          <div
            className="resize-handle resize-handle-top"
            onMouseDown={(e) => handleResizeStart(e, 'top')}
          />
          <div
            className="resize-handle resize-handle-right"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
          <div
            className="resize-handle resize-handle-bottom"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
          <div
            className="resize-handle resize-handle-left"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          />
          <div
            className="resize-handle resize-handle-top-right"
            onMouseDown={(e) => handleResizeStart(e, 'top-right')}
          />
          <div
            className="resize-handle resize-handle-bottom-right"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
          />
          <div
            className="resize-handle resize-handle-top-left"
            onMouseDown={(e) => handleResizeStart(e, 'top-left')}
          />
          <div
            className="resize-handle resize-handle-bottom-left"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
          />
        </>
      )}

      {/* Resize handle for snapped mode */}
      {isSnapped && (
        <div
          className={`resize-handle resize-handle-snap ${snapSide === 'left' ? 'snap-right' : 'snap-left'}`}
          onMouseDown={(e) =>
            handleResizeStart(e, snapSide === 'left' ? 'right' : 'left')
          }
        />
      )}
      {/* Header */}
      <div className="widget-explorer-header" onMouseDown={handleMouseDown}>
        <div className="widget-explorer-header-left">
          {/* <div className="widget-explorer-drag-handle">
            <img src={squares} alt="Drag" className="widget-explorer-squares-icon" />
            <img src={squares} alt="Drag" className="widget-explorer-squares-icon" />
          </div> */}
          <h1 className="widget-explorer-title">Terminal</h1>
        </div>

        <div className="widget-explorer-header-right">
          {isSnapped && (
            <button
              className="widget-explorer-unsnap-btn"
              onClick={handleUnsnap}
            >
              ⚡
            </button>
          )}

          <button className="close-btn" onClick={onClose}>
            <img
              className="widget-explorer-close-icon"
              src={closebutton}
              alt="Close"
            />
          </button>
        </div>
      </div>

      {/* Mobile Tab Selector */}
      <MobileTabSelector
        activeTab={activeMobileTab}
        onTabChange={setActiveMobileTab}
        tokenCounts={tokenCounts}
      />

      {/* Main Content Container */}
      <div className="widget-explorer-container">
        {/* Column Headers */}
        <div className="widget-explorer-columns-header">
          <div
            className={`widget-explorer-column-header ${activeMobileTab === 'new' ? 'active' : ''}`}
          >
            <div className="widget-explorer-column-title-section">
              <h2 className="widget-explorer-column-title">New Pairs</h2>
            </div>
            <div className="widget-explorer-column-title-right">
              <div className="explorer-quickbuy-container">
                <img
                  className="explorer-quick-buy-search-icon"
                  src={lightning}
                  alt=""
                />
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
                className={`column-filter-icon ${appliedFilters && activeFilterTab === 'new' ? 'active' : ''}`}
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

          <div
            className={`widget-explorer-column-header ${activeMobileTab === 'graduating' ? 'active' : ''}`}
          >
            <div className="widget-explorer-column-title-section">
              <h2 className="widget-explorer-column-title">
                Graduating Tokens
                {appliedFilters && activeFilterTab === 'graduating' && (
                  <span className="filtered-count">
                    ({graduatingTokens.length})
                  </span>
                )}
              </h2>
            </div>
            <div className="widget-explorer-column-title-right">
              <div className="explorer-quickbuy-container">
                <img
                  className="explorer-quick-buy-search-icon"
                  src={lightning}
                  alt=""
                />
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
                className={`column-filter-icon ${appliedFilters && activeFilterTab === 'graduating' ? 'active' : ''}`}
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

          <div
            className={`widget-explorer-column-header ${activeMobileTab === 'graduated' ? 'active' : ''}`}
          >
            <div className="widget-explorer-column-title-section">
              <h2 className="widget-explorer-column-title">
                Graduated
                {appliedFilters && activeFilterTab === 'graduated' && (
                  <span className="filtered-count">
                    ({graduatedTokens.length})
                  </span>
                )}
              </h2>
            </div>
            <div className="widget-explorer-column-title-right">
              <div className="explorer-quickbuy-container">
                <img
                  className="explorer-quick-buy-search-icon"
                  src={lightning}
                  alt=""
                />
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
                className={`column-filter-icon ${appliedFilters && activeFilterTab === 'graduated' ? 'active' : ''}`}
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
        </div>

        {/* Token Lists Container */}
        <div className="widget-explorer-columns">
          {/* New Tokens Column */}
          <div
            className={`widget-explorer-column ${activeMobileTab === 'new' ? 'mobile-active' : ''}`}
          >
            <div className="explorer-tokens-list">
              {isLoading ? (
                Array.from({ length: 14 }).map((_, index) => (
                  <div
                    key={`skeleton-new-${index}`}
                    className="explorer-token-row loading"
                  >
                    <div className="explorer-token-left">
                      <div className="explorer-token-image-container">
                        <div className="explorer-progress-spacer">
                          <div className="explorer-image-wrapper">
                            <img
                              className="explorer-token-image"
                              alt="loading"
                            />
                          </div>
                        </div>
                      </div>
                      <span className="explorer-contract-address">
                        Loading...
                      </span>
                    </div>
                    <div className="explorer-token-details">
                      <div className="explorer-detail-section">
                        <div className="explorer-top-row">
                          <div className="explorer-token-info">
                            <h3 className="explorer-token-symbol">LOAD</h3>
                            <p className="explorer-token-name">Loading Token</p>
                          </div>
                        </div>
                        <div className="explorer-second-row">
                          <span className="explorer-time-created">0h</span>
                          <div className="explorer-stat-item">
                            <span className="explorer-stat-value">0</span>
                          </div>
                        </div>
                      </div>
                      <div className="explorer-holdings-section"></div>
                    </div>
                    <div className="explorer-third-row">
                      <div className="explorer-market-cap">
                        <span className="mc-label">MC</span>
                        <span>$0</span>
                      </div>
                      <div className="explorer-third-row-section"></div>
                      <div className="explorer-actions-section">
                        <button className="explorer-quick-buy-btn">
                          Loading
                        </button>
                      </div>
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
                    hoveredToken={hoveredToken}
                    hoveredImage={hoveredImage}
                    onTokenHover={handleTokenHover}
                    onTokenLeave={handleTokenLeave}
                    onImageHover={handleImageHover}
                    onImageLeave={handleImageLeave}
                    onTokenClick={handleTokenClick}
                    onQuickBuy={handleQuickBuy}
                    onCopyToClipboard={copyToClipboard}
                    onWebsiteOpen={handleWebsiteOpen}
                    onTwitterOpen={handleTwitterOpen}
                    onTelegramOpen={handleTelegramOpen}
                    onTwitterContractSearch={handleTwitterContractSearch}
                    onImageSearch={handleImageSearch}
                    onDiscordOpen={handleDiscordOpen}
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

          {/* Graduating Tokens Column */}
          <div
            className={`widget-explorer-column ${activeMobileTab === 'graduating' ? 'mobile-active' : ''}`}
          >
            <div className="explorer-tokens-list">
              {isLoading ? (
                Array.from({ length: 14 }).map((_, index) => (
                  <div
                    key={`skeleton-graduating-${index}`}
                    className="explorer-token-row loading"
                  >
                    <div className="explorer-token-left">
                      <div className="explorer-token-image-container">
                        <div className="explorer-progress-spacer">
                          <div className="explorer-image-wrapper">
                            <img
                              className="explorer-token-image"
                              alt="loading"
                            />
                          </div>
                        </div>
                      </div>
                      <span className="explorer-contract-address">
                        Loading...
                      </span>
                    </div>
                    <div className="explorer-token-details">
                      <div className="explorer-detail-section">
                        <div className="explorer-top-row">
                          <div className="explorer-token-info">
                            <h3 className="explorer-token-symbol">LOAD</h3>
                            <p className="explorer-token-name">Loading Token</p>
                          </div>
                        </div>
                        <div className="explorer-second-row">
                          <span className="explorer-time-created">0h</span>
                          <div className="explorer-stat-item">
                            <span className="explorer-stat-value">0</span>
                          </div>
                        </div>
                      </div>
                      <div className="explorer-holdings-section"></div>
                    </div>
                    <div className="explorer-third-row">
                      <div className="explorer-market-cap">
                        <span className="mc-label">MC</span>
                        <span>$0</span>
                      </div>
                      <div className="explorer-third-row-section"></div>
                      <div className="explorer-actions-section">
                        <button className="explorer-quick-buy-btn">
                          Loading
                        </button>
                      </div>
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
                    hoveredToken={hoveredToken}
                    hoveredImage={hoveredImage}
                    onTokenHover={handleTokenHover}
                    onTokenLeave={handleTokenLeave}
                    onImageHover={handleImageHover}
                    onImageLeave={handleImageLeave}
                    onTokenClick={handleTokenClick}
                    onQuickBuy={handleQuickBuy}
                    onCopyToClipboard={copyToClipboard}
                    onWebsiteOpen={handleWebsiteOpen}
                    onTwitterOpen={handleTwitterOpen}
                    onTwitterContractSearch={handleTwitterContractSearch}
                    onImageSearch={handleImageSearch}
                    onTelegramOpen={handleTelegramOpen}
                    onDiscordOpen={handleDiscordOpen}
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

          {/* Graduated Tokens Column */}
          <div
            className={`widget-explorer-column ${activeMobileTab === 'graduated' ? 'mobile-active' : ''}`}
          >
            <div className="explorer-tokens-list">
              {isLoading ? (
                Array.from({ length: 14 }).map((_, index) => (
                  <div
                    key={`skeleton-graduated-${index}`}
                    className="explorer-token-row loading"
                  >
                    <div className="explorer-token-left">
                      <div className="explorer-token-image-container">
                        <div className="explorer-progress-spacer">
                          <div className="explorer-image-wrapper">
                            <img
                              className="explorer-token-image"
                              alt="loading"
                            />
                          </div>
                        </div>
                      </div>
                      <span className="explorer-contract-address">
                        Loading...
                      </span>
                    </div>
                    <div className="explorer-token-details">
                      <div className="explorer-detail-section">
                        <div className="explorer-top-row">
                          <div className="explorer-token-info">
                            <h3 className="explorer-token-symbol">LOAD</h3>
                            <p className="explorer-token-name">Loading Token</p>
                          </div>
                        </div>
                        <div className="explorer-second-row">
                          <span className="explorer-time-created">0h</span>
                          <div className="explorer-stat-item">
                            <span className="explorer-stat-value">0</span>
                          </div>
                        </div>
                      </div>
                      <div className="explorer-holdings-section"></div>
                    </div>
                    <div className="explorer-third-row">
                      <div className="explorer-market-cap">
                        <span className="mc-label">MC</span>
                        <span>$0</span>
                      </div>
                      <div className="explorer-third-row-section"></div>
                      <div className="explorer-actions-section">
                        <button className="explorer-quick-buy-btn">
                          Loading
                        </button>
                      </div>
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
                    hoveredToken={hoveredToken}
                    hoveredImage={hoveredImage}
                    onTokenHover={handleTokenHover}
                    onTokenLeave={handleTokenLeave}
                    onImageHover={handleImageHover}
                    onImageLeave={handleImageLeave}
                    onTokenClick={handleTokenClick}
                    onQuickBuy={handleQuickBuy}
                    onCopyToClipboard={copyToClipboard}
                    onWebsiteOpen={handleWebsiteOpen}
                    onTwitterOpen={handleTwitterOpen}
                    onTwitterContractSearch={handleTwitterContractSearch}
                    onImageSearch={handleImageSearch}
                    onTelegramOpen={handleTelegramOpen}
                    onDiscordOpen={handleDiscordOpen}
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

export default WidgetExplorer;
