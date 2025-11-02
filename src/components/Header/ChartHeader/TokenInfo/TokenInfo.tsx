import { Search, SearchIcon } from 'lucide-react';
import React, { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import camera from '../../../../assets/camera.svg'
import CopyButton from '../../../CopyButton/CopyButton';
import TokenInfoPopup from './TokenInfoPopup/TokenInfoPopup';
import MiniChart from './MiniChart/MiniChart';
import '../../../Portfolio/Portfolio.css';
import { FixedSizeList as List } from 'react-window';
import { createPortal } from 'react-dom';

import SortArrow from '../../../OrderCenter/SortArrow/SortArrow';
import PriceDisplay from '../PriceDisplay/PriceDisplay';
import TokenIcons from '../TokenIcons/TokenIcons';
import telegram from '../../../../assets/telegram.png';
import discord from '../../../../assets/discord1.svg';
import avatar from '../../../../assets/avatar.png';
import tweet from '../../../../assets/tweet.png';
import { TwitterHover } from '../../../TwitterHover/TwitterHover';
import { useSharedContext } from '../../../../contexts/SharedContext';
import {
  formatCommas,
} from '../../../../utils/numberDisplayFormat';
import { formatSubscript } from '../../../../utils/numberDisplayFormat';
import { formatSig } from '../../../OrderCenter/utils/formatDisplay.ts';

import { settings } from '../../../../settings.ts';

import './TokenInfo.css';


const getBondingColor = (percentage: number): string => {
  if (percentage < 25) return '#ee5b5bff';
  if (percentage < 50) return '#f59e0b';
  if (percentage < 75) return '#eab308';
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
const crystal = '/CrystalLogo.png';

const calculateBondingPercentage = (marketCap: number) => {
  const bondingPercentage = Math.min((marketCap / 25000) * 100, 100);
  return bondingPercentage;
};

const PerpsTokenSkeleton = () => {
  return (
    <div className="perps-interface-token-info-container">
      <div className="perps-interface-token-header-info">
        <div className="perps-interface-token-header-left">
          <button
            className={`favorite-icon ${''}`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={'none'}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </button>
          <div className="perps-interface-token-icon-container">
            <div className="skeleton-circle" style={{ width: '29px', height: '29px', marginRight: '5px' }}></div>
          </div>
          <div className="perps-interface-token-identity">
            <div className="perps-interface-token-name-row">
              <div className="skeleton-text skeleton-symbol" style={{ width: '79px', height: '24px' }}></div>
            </div>
            <div className="ctrlktooltip">
              Ctrl+K
            </div>
          </div>
        </div>

        <div className="perps-interface-token-header-right">
          <div className="perps-interface-token-metrics">
            <div className="perps-skeleton-text" style={{ width: '80px', height: '20px' }}></div>

            <div className="perps-interface-token-metric">
              <div className="skeleton-text skeleton-label" style={{ width: '40px', height: '12px' }}></div>
              <div className="skeleton-text skeleton-value" style={{ width: '60px', height: '14px' }}></div>
            </div>

            <div className="perps-interface-token-metric">
              <div className="skeleton-text skeleton-label" style={{ width: '60px', height: '12px' }}></div>
              <div className="skeleton-text skeleton-value" style={{ width: '80px', height: '14px' }}></div>
            </div>

            <div className="perps-interface-token-metric">
              <div className="skeleton-text skeleton-label" style={{ width: '50px', height: '12px' }}></div>
              <div className="skeleton-text skeleton-value" style={{ width: '90px', height: '14px' }}></div>
            </div>

            <div className="perps-interface-token-metric">
              <div className="skeleton-text skeleton-label" style={{ width: '70px', height: '12px' }}></div>
              <div className="skeleton-text skeleton-value" style={{ width: '90px', height: '14px' }}></div>
            </div>

            <div className="perps-interface-token-metric">
              <div className="skeleton-text skeleton-label" style={{ width: '110px', height: '12px' }}></div>
              <div className="skeleton-text skeleton-value" style={{ width: '110px', height: '14px' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MemeTokenSkeleton = () => {
  return (
    <div className="meme-interface-token-info-container-meme">
      <div className="meme-interface-token-header-info">
        <div className="meme-interface-token-header-left">
          <div className="meme-interface-token-icon-container">
            <div className="meme-interface-token-icon-wrapper loading-skeleton">
              <div className="meme-interface-token-icon skeleton-circle"></div>
            </div>
          </div>

          <div className="meme-interface-token-identity">
            <div className="meme-interface-token-name-row">
              <div className="skeleton-text skeleton-symbol"></div>
              <div className="meme-interface-token-name-container">
              </div>
            </div>

            <div className="meme-interface-token-meta-row">
              <div className="skeleton-text skeleton-time"></div>
              <div className="meme-interface-token-social-links">
                <div className="skeleton-button skeleton-social"></div>
                <div className="skeleton-button skeleton-social"></div>
                <div className="skeleton-button skeleton-social"></div>
                <div className="skeleton-button skeleton-social"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="meme-interface-token-header-right">
          <div className="meme-interface-token-metrics">
            <div className="skeleton-text skeleton-market-cap"></div>

            <div className="meme-interface-token-metric">
              <div className="skeleton-text skeleton-label"></div>
              <div className="skeleton-text skeleton-value"></div>
            </div>

            <div className="meme-interface-token-metric">
              <div className="skeleton-text skeleton-label"></div>
              <div className="skeleton-text skeleton-value"></div>
            </div>

            <div className="meme-interface-token-metric">
              <div className="skeleton-text skeleton-label"></div>
              <div className="skeleton-text skeleton-value"></div>
            </div>

            <div className="meme-interface-token-metric">
              <div className="skeleton-text skeleton-label"></div>
              <div className="skeleton-text skeleton-value"></div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
const toSub = (n: number) =>
  String(n)
    .split('')
    .map((d) => SUB[+d])
    .join('');

function formatMemePrice(price: number): string {
  if (!isFinite(price)) return '';
  if (Math.abs(price) < 1e-18) return '0';

  const neg = price < 0 ? '-' : '';
  const abs = Math.abs(price);

  if (abs >= 1_000_000_000)
    return neg + (abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (abs >= 1_000_000)
    return neg + (abs / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1_000)
    return neg + (abs / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';

  if (abs >= 100) return neg + abs.toFixed(0).replace(/\.00$/, '');
  if (abs >= 10) return neg + abs.toFixed(1).replace(/\.00$/, '');
  if (abs >= 1) return neg + abs.toFixed(2).replace(/\.00$/, '');
  if (abs >= 1e-1) return neg + abs.toFixed(3).replace(/\.00$/, '');
  if (abs >= 1e-2) return neg + abs.toFixed(4).replace(/\.00$/, '');
  if (abs >= 1e-3) return neg + abs.toFixed(5).replace(/\.00$/, '');
  if (abs >= 1e-4) return neg + abs.toFixed(6).replace(/\.00$/, '');

  const exp = Math.floor(Math.log10(abs));
  let zeros = -exp - 1;
  if (zeros < 0) zeros = 0;

  const tailDigits = 2;
  const factor = Math.pow(10, tailDigits);
  let scaled = abs * Math.pow(10, zeros + 1);
  let t = Math.round(scaled * factor);

  if (t >= Math.pow(10, 1 + tailDigits)) {
    zeros = Math.max(0, zeros - 1);
    scaled = abs * Math.pow(10, zeros + 1);
    t = Math.round(scaled * factor);
  }

  const s = t.toString().padStart(1 + tailDigits, '0');
  const tail2 = s.slice(0, 3);

  return `${neg}0.0${toSub(zeros)}${tail2}`;
}

const PerpsMarketRow = memo(({ index, style, data }: {
  index: number;
  style: React.CSSProperties;
  data: {
    markets: any[];
    selectedIndex: number;
    onMouseEnter: (index: number) => void;
    onClick: (market: any) => void;
    toggleFavorite: any;
    favorites: any;
  }
}) => {
  const { markets, selectedIndex, onMouseEnter, onClick, toggleFavorite, favorites } = data;
  const market = markets[index];

  if (!market) return null;

  return (
    <div
      style={style}
      className={`perps-market-item-container ${index === selectedIndex ? 'selected' : ''}`}
      onMouseEnter={() => onMouseEnter(index)}
      onClick={() => onClick(market)}
    >
      <div className="perps-market-item">
        <button onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(market.contractName);
        }} className={`dropdown-market-favorite-button 
        ${favorites.includes(market.contractName) ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={favorites.includes(market.contractName) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </button>

        <div className="market-pair-section">
          <img
            src={market.iconURL}
            className="market-icon"
          />
          <div className="market-info">
            <div className="market-pair-container">
              <span className="market-pair">{market.baseAsset}/{market.quoteAsset}</span>  <span className="market-leverage">{market.displayMaxLeverage}x</span>
            </div>
            <span className="market-volume">{market.formattedVolume}</span>
          </div>
        </div>

        <div className="perps-oi-section">
          <div className="perps-open-interest">{formatCommas(market.lastPrice)}</div>
        </div>

        <div className="perps-funding-section">
          <div className={`perps-market-change ${market.changeClass}`}>
            {market.formattedChange}
          </div>
        </div>

        <div className="perps-funding-section">
          <div className={`perps-funding-rate`}>
            {market.formattedFunding}
          </div>
        </div>

        <div className="perps-oi-section">
          <div className="perps-open-interest">
            {market.formattedOI}
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps: { index: string | number; data: { selectedIndex: any; markets: { [x: string]: any; }; }; }, nextProps: { index: string | number; data: { selectedIndex: any; markets: { [x: string]: any; }; }; }) => {
  return (
    prevProps.index === nextProps.index &&
    prevProps.data.selectedIndex === nextProps.data.selectedIndex &&
    prevProps.data.markets[prevProps.index] === nextProps.data.markets[nextProps.index]
  );
});

interface TokenInfoProps {
  externalUserStats?: {
    balance: number;
    amountBought: number;
    amountSold: number;
    valueBought: number;
    valueSold: number;
    valueNet: number;
  };
  userAddress?: string;
  in_icon: string;
  out_icon: string;
  price: string;
  activeMarket: any;
  onMarketSelect: any;
  tokendict: any;
  setpopup: any;
  marketsData: any[];
  isLoading?: boolean;
  isTradeRoute?: boolean;
  simpleView?: boolean;
  isMemeToken?: boolean;
  memeTokenData?: {
    symbol: string;
    name: string;
    image: string;
    tokenAddress: string;
    marketCap: number;
    change24h: number;
    status: 'new' | 'graduating' | 'graduated';
    created: string;
    website?: string;
    twitterHandle?: string;
    telegramHandle?: string;
    discordHandle?: string;
    graduatedTokens?: number;
    launchedTokens?: number;
    developerAddress?: string;
    reserveQuote?: bigint;
    reserveBase?: bigint;
  };
  isPerpsToken?: boolean;
  perpsActiveMarketKey: string;
  perpsMarketsData: { [key: string]: any };
  perpsFilterOptions: any;
  monUsdPrice: number;
  showLoadingPopup?: (id: string, config: any) => void;
  updatePopup?: (id: string, config: any) => void;
  setperpsActiveMarketKey: any;
}

const Tooltip: React.FC<{
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
}> = ({ content, children, position = 'top', offset = 10 }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current || !tooltipRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.bottom + scrollY + offset;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollY + offset;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - tooltipRect.width - offset;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + offset;
        break;
    }

    const margin = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (position === 'top' || position === 'bottom') {
      left = Math.min(
        Math.max(left, margin + tooltipRect.width / 2),
        viewportWidth - margin - tooltipRect.width / 2,
      );
    } else {
      top = Math.min(
        Math.max(top, margin),
        viewportHeight - margin - tooltipRect.height,
      );
    }

    setTooltipPosition({ top, left });
  }, [position, offset]);

  const handleMouseEnter = useCallback(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    setIsLeaving(false);
    setShouldRender(true);

    fadeTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      fadeTimeoutRef.current = null;
    }, 10);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    setIsLeaving(true);
    setIsVisible(false);

    fadeTimeoutRef.current = setTimeout(() => {
      setShouldRender(false);
      setIsLeaving(false);
      fadeTimeoutRef.current = null;
    }, 150);
  }, []);

  useEffect(() => {
    if (shouldRender && !isLeaving) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [shouldRender, updatePosition, isLeaving]);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tooltip-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {shouldRender &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`tooltip tooltip-${position} ${isVisible ? 'tooltip-entering' : isLeaving ? 'tooltip-leaving' : ''}`}
            style={{
              position: 'absolute',
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: `${position === 'top' || position === 'bottom'
                ? 'translateX(-50%)'
                : position === 'left' || position === 'right'
                  ? 'translateY(-50%)'
                  : 'none'
                } scale(${isVisible ? 1 : 0})`,
              opacity: isVisible ? 1 : 0,
              zIndex: 9999,
              pointerEvents: 'none',
              transition:
                'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform, opacity',
            }}
          >
            <div className="tooltip-content">{content}</div>
          </div>,
          document.body,
        )}
    </div>
  );
};
const TokenInfo: React.FC<TokenInfoProps> = ({
  userAddress,
  externalUserStats,
  in_icon,
  out_icon,
  price,
  activeMarket,
  onMarketSelect,
  tokendict,
  setpopup,
  marketsData,
  isLoading,
  isTradeRoute = true,
  simpleView = false,
  isMemeToken = false,
  memeTokenData,
  isPerpsToken = false,
  perpsActiveMarketKey,
  perpsMarketsData,
  perpsFilterOptions,
  monUsdPrice,
  showLoadingPopup,
  updatePopup,
  setperpsActiveMarketKey,
}) => {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredMemeImage, setHoveredMemeImage] = useState(false);

  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const updatePreviewPosition = useCallback(() => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const previewWidth = 220;
    const previewHeight = 220;
    const offset = 15;

    let top = 0;
    let left = 0;

    const leftX = rect.left;
    const centerY = rect.top + rect.height / 2;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = viewportWidth - rect.right;
    const spaceLeft = rect.left;

    if (spaceBelow >= previewHeight + offset) {
      top = rect.bottom + scrollY + offset;
      left = leftX + scrollX;
    } else if (spaceAbove >= previewHeight + offset) {
      top = rect.top + scrollY - previewHeight - offset - 15;
      left = leftX + scrollX;
    } else if (spaceRight >= previewWidth + offset) {
      left = rect.right + scrollX + offset;
      top = centerY + scrollY - previewHeight / 2;
    } else if (spaceLeft >= previewWidth + offset) {
      left = rect.left + scrollX - previewWidth - offset;
      top = centerY + scrollY - previewHeight / 2;
    } else {
      top = rect.bottom + scrollY + offset;
      left = leftX + scrollX;
    }

    const margin = 10;
    if (left < scrollX + margin) left = scrollX + margin;
    else if (left + previewWidth > scrollX + viewportWidth - margin)
      left = scrollX + viewportWidth - previewWidth - margin;

    if (top < scrollY + margin) top = scrollY + margin;
    else if (top + previewHeight > scrollY + viewportHeight - margin)
      top = scrollY + viewportHeight - previewHeight - margin;

    setPreviewPosition({ top, left });
  }, []);

  useEffect(() => {
    if (hoveredMemeImage && memeTokenData?.image) {
      const calculateAndShow = () => {
        updatePreviewPosition();
        setTimeout(() => setShowPreview(true), 10);
      };

      calculateAndShow();

      const handleResize = () => updatePreviewPosition();
      window.addEventListener('scroll', updatePreviewPosition);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', updatePreviewPosition);
        window.removeEventListener('resize', handleResize);
      };
    } else {
      setShowPreview(false);
    }
  }, [hoveredMemeImage, memeTokenData?.image, updatePreviewPosition]);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shouldFocus, setShouldFocus] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredToken, setHoveredToken] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isPerpsDropdownOpen, setIsPerpsDropdownOpen] = useState(false);
  const [isPerpsDropdownVisible, setIsPerpsDropdownVisible] = useState(false);
  const [perpsSearchQuery, setPerpsSearchQuery] = useState('');
  const [perpsActiveFilter, setPerpsActiveFilter] = useState('All');
  const [perpsSelectedIndex, setPerpsSelectedIndex] = useState(0);
  const [perpsShouldFocus, setPerpsShouldFocus] = useState(false);
  const [perpsSortField, setPerpsSortField] = useState<'volume' | 'price' | 'change' | 'funding' | 'openInterest' | null>('volume');
  const [perpsSortDirection, setPerpsSortDirection] = useState<'asc' | 'desc' | undefined>('desc');
  const filterTabsRef = useRef<HTMLDivElement>(null);
  const marketsListRef = useRef<HTMLDivElement>(null);
  const memeHeaderRightRef = useRef<HTMLDivElement>(null);
  const perpsMetricsRef = useRef<HTMLDivElement>(null);
  const perpsFilterTabsRef = useRef<HTMLDivElement>(null);
  const perpsMarketsListRef = useRef<HTMLDivElement>(null);
  const perpsDropdownRef = useRef<HTMLDivElement>(null);
  const perpsSearchInputRef = useRef<HTMLInputElement>(null);
  const virtualizationListRef = useRef<List>(null);
  const { favorites, toggleFavorite, activechain } = useSharedContext();

  const filteredPerpsMarkets = useMemo(() => {
    const filtered = Object.values(perpsMarketsData)
      .filter(market =>
        perpsFilterOptions[perpsActiveFilter]?.includes(market.contractName) &&
        market.baseAsset.toLowerCase().includes(perpsSearchQuery.toLowerCase())
      )
      .map(market => ({
        ...market,
        formattedVolume: `$${formatCommas(Number(market.value).toFixed(2))}`,
        formattedOI: `$${formatCommas((Number(market.openInterest) * Number(market.lastPrice)).toFixed(2))}`,
        formattedFunding: `${(market.fundingRate * 100).toFixed(4)}%`,
        formattedChange: `${(Number(market.priceChangePercent) >= 0 ? '+' : '') +
          (market?.priceChange ? formatCommas(market.priceChange) : '') + ' / ' +
          (Number(market.priceChangePercent) >= 0 ? '+' : '') +
          Number(market.priceChangePercent * 100).toFixed(2)}%`,
        fundingClass: market.fundingRate < 0 ? 'negative' : 'positive',
        changeClass: market.priceChangePercent < 0 ? 'negative' : 'positive',
      }));

    if (perpsSortField && perpsSortDirection) {
      filtered.sort((a, b) => {
        let aValue: number = 0;
        let bValue: number = 0;

        switch (perpsSortField) {
          case 'volume':
            aValue = parseFloat((a.value || 0).toString().replace(/,/g, ''));
            bValue = parseFloat((b.value || 0).toString().replace(/,/g, ''));
            break;
          case 'price':
            aValue = parseFloat((a.lastPrice || 0).toString().replace(/,/g, ''));
            bValue = parseFloat((b.lastPrice || 0).toString().replace(/,/g, ''));
            break;
          case 'change':
            aValue = parseFloat((a.priceChangePercent || 0).toString().replace(/[+%]/g, ''));
            bValue = parseFloat((b.priceChangePercent || 0).toString().replace(/[+%]/g, ''));
            break;
          case 'funding':
            aValue = parseFloat((a.fundingRate || 0).toString());
            bValue = parseFloat((b.fundingRate || 0).toString());
            break;
          case 'openInterest':
            aValue = parseFloat((a.openInterest || 0).toString()) * parseFloat((a.lastPrice || 0).toString());
            bValue = parseFloat((b.openInterest || 0).toString()) * parseFloat((b.lastPrice || 0).toString());
            break;
          default:
            return 0;
        }
        return perpsSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    return filtered;
  }, [perpsMarketsData, perpsFilterOptions, perpsActiveFilter, perpsSearchQuery, perpsSortField, perpsSortDirection, favorites]);

  const togglePerpsDropdown = () => {
    if (!isPerpsDropdownOpen) {
      setPerpsSearchQuery('');
      setPerpsSelectedIndex(0);
      setIsPerpsDropdownOpen(true);
      setPerpsShouldFocus(true);
      requestAnimationFrame(() => {
        setIsPerpsDropdownVisible(true);
      });
    } else {
      setIsPerpsDropdownVisible(false);
      setPerpsShouldFocus(false);
      setTimeout(() => {
        setIsPerpsDropdownOpen(false);
        setPerpsSearchQuery('');
        setPerpsSelectedIndex(0);
      }, 200);
    }
  };

  const handlePerpsMarketSelect = useCallback((market: any) => {
    setPerpsSearchQuery('');
    setIsPerpsDropdownVisible(false);
    setperpsActiveMarketKey(market.contractName);
    setTimeout(() => {
      setIsPerpsDropdownOpen(false);
    }, 200);
  }, [setperpsActiveMarketKey]);

  const handlePerpsMouseEnter = useCallback((index: number) => {
    setPerpsSelectedIndex(index);
  }, []);

  const virtualizationData = useMemo(() => ({
    markets: filteredPerpsMarkets,
    selectedIndex: perpsSelectedIndex,
    onMouseEnter: handlePerpsMouseEnter,
    onClick: handlePerpsMarketSelect,
    toggleFavorite: toggleFavorite,
    favorites: favorites,
  }), [filteredPerpsMarkets, perpsSelectedIndex, handlePerpsMouseEnter, handlePerpsMarketSelect, toggleFavorite]);

  const isAdvancedView = isTradeRoute && !simpleView;

  const perpsFilterTabs = Object.keys(perpsFilterOptions).map((filter) => (
    <button
      key={filter}
      className={`filter-tab ${perpsActiveFilter === filter ? 'active' : ''}`}
      onClick={() => setPerpsActiveFilter(filter)}
    >
      {filter.charAt(0).toUpperCase() + filter.slice(1)}
    </button>
  ));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const bondingPercentage = useMemo(() => {
    if (!isMemeToken || !activeMarket) return 0;
    const TOTAL_SUPPLY = 1e9;
    const marketCap = parseFloat(price.replace(/,/g, '')) * TOTAL_SUPPLY;
    return calculateBondingPercentage(marketCap || 0);
  }, [activeMarket, price, isMemeToken]);

  const getBondingColorMeme = (percentage: number): string => {
    if (percentage < 25) return 'rgb(235, 112, 112)';
    if (percentage < 50) return '#f59e0b';
    if (percentage < 75) return '#eab308';
    return '#43e17d';
  };

  const formatPrice = (price: number): string => {
    if (price >= 1e9) return `$${(price / 1e9).toFixed(2)}B`;
    if (price >= 1e6) return `$${(price / 1e6).toFixed(2)}M`;
    if (price >= 1e3) return `$${(price / 1e3).toFixed(2)}K`;
    return `$${price.toFixed(2)}`;
  };

  const formatTimeAgo = useMemo(() => {
    return (createdTimestamp: number) => {
      const now = Math.floor(currentTime / 1000);
      const ageSec = now - createdTimestamp;

      if (ageSec < 60) {
        return `${ageSec}s`;
      } else if (ageSec < 3600) {
        return `${Math.floor(ageSec / 60)}m`;
      } else if (ageSec < 86400) {
        return `${Math.floor(ageSec / 3600)}h`;
      } else if (ageSec < 604800) {
        return `${Math.floor(ageSec / 86400)}d`;
      } else {
        return `${Math.floor(ageSec / 604800)}w`;
      }
    };
  }, [currentTime]);

  const copyToClipboard = async (text: string, label = 'Address copied') => {
    const txId = `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    try {
      await navigator.clipboard.writeText(text);
      if (showLoadingPopup && updatePopup) {
        showLoadingPopup(txId, { title: label, subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard` });
        setTimeout(() => {
          updatePopup(txId, { title: label, subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`, variant: 'success', confirmed: true, isLoading: false });
        }, 100);
      }
    } catch (err) {
    }
  };

  const linkCopyToClipboard = async (text: string, label = 'Link Copied') => {
    const txId = `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    try {
      await navigator.clipboard.writeText(text);
      if (showLoadingPopup && updatePopup) {
        showLoadingPopup(txId, { title: label });
        setTimeout(() => {
          updatePopup(txId, { title: label, subtitle: `Link copied to clipboard`, variant: 'success', confirmed: true, isLoading: false });
        }, 100);
      }
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  useEffect(() => {
    if (isPerpsDropdownVisible && perpsShouldFocus) {
      const focusInput = () => {
        if (perpsSearchInputRef.current) {
          perpsSearchInputRef.current.focus();

          setTimeout(() => {
            if (document.activeElement !== perpsSearchInputRef.current) {
              perpsSearchInputRef.current?.focus();
            }
          }, 50);
        }
      };

      focusInput();
      requestAnimationFrame(focusInput);
      setTimeout(focusInput, 100);
    }
  }, [isPerpsDropdownVisible, perpsShouldFocus]);

  useEffect(() => {
    const handleMemeScroll = () => {
      const container = memeHeaderRightRef.current;
      if (container) {
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;

        if (scrollLeft > 0) {
          container.classList.add('show-left-gradient');
        } else {
          container.classList.remove('show-left-gradient');
        }

        if (scrollLeft + clientWidth < scrollWidth - 2) {
          container.classList.add('show-right-gradient');
        } else {
          container.classList.remove('show-right-gradient');
        }
      }
    };

    const container = memeHeaderRightRef.current;
    if (container && isMemeToken) {
      container.addEventListener('scroll', handleMemeScroll);
      handleMemeScroll();
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleMemeScroll);
      }
    };
  }, [isMemeToken]);
  
  useEffect(() => {
    const handlePerpsScroll = () => {
      const container = perpsMetricsRef.current;
      if (container) {
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;

        if (scrollLeft > 0) {
          container.classList.add('show-left-gradient');
        } else {
          container.classList.remove('show-left-gradient');
        }

        if (scrollLeft + clientWidth < scrollWidth - 2) {
          container.classList.add('show-right-gradient');
        } else {
          container.classList.remove('show-right-gradient');
        }
      }
    };

    const container = perpsMetricsRef.current;
    if (container && isPerpsToken) {
      container.addEventListener('scroll', handlePerpsScroll);
      handlePerpsScroll();
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handlePerpsScroll);
      }
    };
  }, [isPerpsToken]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();

        if (isAdvancedView) {
          toggleDropdown();
        } else {
          setpopup((popup: number) => { return popup == 0 ? 8 : 0 });
        }
      }
      else if (e.key == 'Escape') {
        if (isAdvancedView && isDropdownOpen) {
          e.preventDefault();
          toggleDropdown();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isDropdownOpen, isAdvancedView, setpopup]);

  useEffect(() => {
    const handleFilterScroll = () => {
      const filterTabsElement = filterTabsRef.current;

      if (filterTabsElement) {
        const scrollLeft = filterTabsElement.scrollLeft;
        const scrollWidth = filterTabsElement.scrollWidth;
        const clientWidth = filterTabsElement.clientWidth;

        if (scrollLeft > 0) {
          filterTabsElement.classList.add('show-left-gradient');
        } else {
          filterTabsElement.classList.remove('show-left-gradient');
        }

        if (scrollLeft + clientWidth < scrollWidth - 2) {
          filterTabsElement.classList.add('show-right-gradient');
        } else {
          filterTabsElement.classList.remove('show-right-gradient');
        }
      }
    };

    const filterTabsElement = filterTabsRef.current;
    if (filterTabsElement && isDropdownVisible) {
      filterTabsElement.addEventListener('scroll', handleFilterScroll);
      handleFilterScroll();
    }

    return () => {
      if (filterTabsElement) {
        filterTabsElement.removeEventListener('scroll', handleFilterScroll);
      }
    };
  }, [isDropdownVisible]);

  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setIsDropdownOpen(true);
      setShouldFocus(true);
      requestAnimationFrame(() => {
        setIsDropdownVisible(true);
      });
    } else {
      setIsDropdownVisible(false);
      setShouldFocus(false);
      setTimeout(() => {
        setIsDropdownOpen(false);
        setSearchQuery('');
        setSelectedIndex(0);
      }, 200);
    }
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sortField, setSortField] = useState<
    'volume' | 'price' | 'change' | null
  >('volume');
  const [sortDirection, setSortDirection] = useState<
    'asc' | 'desc' | undefined
  >('desc');

  const marketAddress =
    activeMarket?.baseAddress || '0x0000000000000000000000000000000000000000';
  const tokenAddress =
    activeMarket?.baseAddress?.toLowerCase() ||
    '0x0000000000000000000000000000000000000000';

  const shouldShowFullHeader = isTradeRoute && !simpleView;
  const shouldShowTokenInfo = isTradeRoute && !simpleView ? "token-info-container" : "token-info-container-simple";

  const handleSymbolInfoClick = (e: React.MouseEvent) => {
    if (
      e.target instanceof Element &&
      (e.target.closest('.favorite-icon') ||
        e.target.closest('.token-actions') ||
        e.target.closest('.price-display-section'))
    ) {
      return;
    }

    if (isAdvancedView) {
      toggleDropdown();
    } else {
      setpopup(36);
    }
  };

  useEffect(() => {
    if (isDropdownVisible && shouldFocus) {
      const focusInput = () => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();

          setTimeout(() => {
            if (document.activeElement !== searchInputRef.current) {
              searchInputRef.current?.focus();
            }
          }, 50);
        }
      };

      focusInput();

      requestAnimationFrame(focusInput);

      setTimeout(focusInput, 100);
    }
  }, [isDropdownVisible, shouldFocus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const symbolInfoElement =
        event.target instanceof Element && event.target.closest('.symbol-info');
      const dropdownContent =
        event.target instanceof Element &&
        event.target.closest('.markets-dropdown-content');
      const perpsHeaderElement =
        event.target instanceof Element && event.target.closest('.perps-interface-token-header-left');
      const perpsDropdownContent =
        event.target instanceof Element &&
        event.target.closest('.perps-markets-dropdown-content');

      if (!symbolInfoElement && !dropdownContent) {
        setIsDropdownVisible(false);
        setShouldFocus(false);
        setTimeout(() => {
          setIsDropdownOpen(false);
          setSearchQuery('');
          setSelectedIndex(0);
        }, 200);
      }

      if (!perpsHeaderElement && !perpsDropdownContent) {
        setIsPerpsDropdownVisible(false);
        setPerpsShouldFocus(false);
        setTimeout(() => {
          setIsPerpsDropdownOpen(false);
          setPerpsSearchQuery('');
          setPerpsSelectedIndex(0);
        }, 200);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      setShouldFocus(false);
      setPerpsShouldFocus(false);
    };
  }, []);

  const handleSort = (field: 'volume' | 'price' | 'change') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  const handlePerpsSort = (field: 'volume' | 'price' | 'change' | 'funding' | 'openInterest') => {
    if (perpsSortField === field) {
      setPerpsSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setPerpsSortField(field);
      setPerpsSortDirection('desc');
    }
  };
  const filterMarketsByTab = (market: any) => {
    switch (activeFilter) {
      case 'favorites':
        return favorites.includes(market.baseAddress.toLowerCase());
      case 'lsts':
        return market.pair.includes('aprMON') || market.pair.includes('sMON') || market.pair.includes('shMON');
      case 'stablecoins':
        return market.pair.includes('USDT');
      case 'memes':
        return market.pair.includes('YAKI') || market.pair.includes('CHOG') || market.pair.includes('DAK');
      case 'all':
      default:
        return true;
    }
  };

  const filteredMarkets = marketsData.filter((market) => {
    const matchesSearch = market?.pair
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const notWeth =
      market?.baseAddress !== settings.chainConfig[activechain].weth;
    const matchesFilter = filterMarketsByTab(market);
    return matchesSearch && notWeth && matchesFilter;
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
      default:
        return 0;
    }

    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownVisible || sortedMarkets.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => {
          const newIndex = prev < sortedMarkets.length - 1 ? prev + 1 : prev;
          scrollToItem(newIndex);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : prev;
          scrollToItem(newIndex);
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (sortedMarkets[selectedIndex]) {
          onMarketSelect(sortedMarkets[selectedIndex]);
          toggleDropdown();
        }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        toggleDropdown();
        break;
    }
  };

  const scrollToItem = (index: number) => {
    if (!marketsListRef.current) return;

    const allItems = marketsListRef.current.querySelectorAll('.market-item-container');
    const itemElement = allItems[index];

    if (itemElement) {
      itemElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    setPerpsSelectedIndex(0);
  }, [perpsSearchQuery, perpsActiveFilter]);

  const perpsTokenInfo = perpsMarketsData[perpsActiveMarketKey];
  const [memeImageError, setMemeImageError] = useState(false);
  const [remaining, setRemaining] = useState("")
  const [priceColor, setPriceColor] = useState<string>("")
  const prevPriceRef = useRef<number | null>(null)

  useEffect(() => {
    setMemeImageError(false);
  }, [memeTokenData?.tokenAddress, memeTokenData?.image]);
  
  useEffect(() => {
    if (!perpsTokenInfo?.lastPrice) return
    const current = Number(perpsTokenInfo.lastPrice)
    const prev = prevPriceRef.current

    if (prev !== null) {
      if (current > prev) setPriceColor("positive")
      else if (current < prev) setPriceColor("negative")
      else setPriceColor("")
    }

    prevPriceRef.current = current
  }, [perpsTokenInfo?.lastPrice])

  useEffect(() => {
    if (!perpsTokenInfo?.nextFundingTime) return
    const tick = () => {
      const diff = (perpsTokenInfo?.nextFundingTime) - Date.now()
      if (diff <= 0) {
        setRemaining("00:00:00")
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(
        [h, m, s].map(v => v.toString().padStart(2, "0")).join(":")
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [perpsTokenInfo?.nextFundingTime])

  if (isMemeToken && memeTokenData) {
    if (!memeTokenData) {
      return <MemeTokenSkeleton />;
    }
    return (
      <div className={`meme-interface-token-info-container-meme ${memeTokenData.status === 'graduated' ? 'graduated' : ''}`}>
        <div className="meme-interface-token-header-info">
          <div className="meme-interface-token-header-left">
            <div className="meme-interface-token-icon-container">
              <div
                className={`meme-interface-token-icon-wrapper ${memeTokenData.status === 'graduated' ? 'graduated' : ''}`}
                ref={imageContainerRef}
                style={
                  memeTokenData.status !== 'graduated'
                    ? {
                      '--progress-angle': `${(bondingPercentage / 100) * 360}deg`,
                      '--progress-color-start': createColorGradient(getBondingColor(bondingPercentage)).start,
                      '--progress-color-mid': createColorGradient(getBondingColor(bondingPercentage)).mid,
                      '--progress-color-end': createColorGradient(getBondingColor(bondingPercentage)).end,
                    } as React.CSSProperties
                    : {}
                }
                onClick={() => window.open(
                  `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(memeTokenData.image)}`,
                  '_blank',
                  'noopener,noreferrer'
                )}
                onMouseEnter={() => setHoveredMemeImage(true)}
                onMouseLeave={() => setHoveredMemeImage(false)}
              >
                <div className="meme-interface-image-container">
                  {memeTokenData.image && !memeImageError ? (
                    <img
                      key={memeTokenData.tokenAddress}
                      src={memeTokenData.image}
                      className="meme-interface-token-icon"
                      onError={() => setMemeImageError(true)}
                      alt={memeTokenData.symbol}
                    />
                  ) : (
                    <div
                      key={memeTokenData.tokenAddress}
                      className="meme-interface-token-icon"
                      style={{
                        width: '37px',
                        height: '37px',
                        backgroundColor: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: memeTokenData.symbol.length <= 2 ? '18px' : '14px',
                        color: '#ffffff',
                        borderRadius: '3px',
                        boxShadow: '0px 0px 0 1.5px rgb(6, 6, 6)',
                        position: 'relative',
                        zIndex: 3,
                        letterSpacing: memeTokenData.symbol.length > 2 ? '-.5px' : '0',
                      }}
                    >
                      {memeTokenData.symbol.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="meme-interface-image-overlay">
                    <img className="token-info-camera-icon" src={camera} alt="inspect" />
                  </div>
                </div>
              </div>
            </div>
            <div className="meme-interface-token-identity">
              <div className="meme-interface-token-name-row">
                <h1 className="meme-interface-token-symbol">{memeTokenData.symbol}</h1>
                <Tooltip content={memeTokenData.name} offset={5}>
                  <div className="meme-interface-token-name-container">
                    <span
                      className="meme-interface-token-name"
                      onClick={() => copyToClipboard(memeTokenData.tokenAddress, 'Contract address copied')}
                      style={{ cursor: 'pointer' }}
                    >
                      {memeTokenData.name}
                    </span>
                    <button
                      className="meme-interface-social-btn"
                      onClick={() => copyToClipboard(memeTokenData.tokenAddress, 'Contract address copied')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                      </svg>
                    </button>
                  </div>
                </Tooltip>
                <div className="meme-social-buttons">
                  <Tooltip content="Share link to this pair">
                    <button
                      className="meme-interface-share-btn"
                      onClick={() => linkCopyToClipboard(`app.crystal.exchange/meme/${memeTokenData.tokenAddress}`)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
                    </button>
                  </Tooltip>
                  <Tooltip content="Add to watchlist">
                    <button
                      className="meme-interface-share-btn"
                      onClick={() => {
                        const isCurrentlyFavorited = favorites.includes(memeTokenData.tokenAddress.toLowerCase());
                        toggleFavorite(memeTokenData.tokenAddress.toLowerCase());

                        const txId = `favorite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        if (showLoadingPopup && updatePopup) {
                          const message = isCurrentlyFavorited ? 'Removed from Watchlist' : 'Added to Watchlist';
                          showLoadingPopup(txId, { title: message, subtitle: `${memeTokenData.symbol} ${isCurrentlyFavorited ? 'removed from' : 'added to'} your watchlist` });
                          setTimeout(() => {
                            updatePopup(txId, { title: message, subtitle: `${memeTokenData.symbol} ${isCurrentlyFavorited ? 'removed from' : 'added to'} your watchlist`, variant: 'success', confirmed: true, isLoading: false });
                          }, 100);
                        }
                      }}
                      title={favorites.includes(memeTokenData.tokenAddress.toLowerCase()) ? "Remove from Watchlist" : "Add to Watchlist"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={favorites.includes(memeTokenData.tokenAddress.toLowerCase()) ? '#d8dcff' : 'none'} stroke={favorites.includes(memeTokenData.tokenAddress.toLowerCase()) ? '#d8dcff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /></svg>
                    </button>
                  </Tooltip>
                </div>
                {hoveredMemeImage &&
                  showPreview &&
                  createPortal(
                    <div
                      className="explorer-image-preview show"
                      style={{
                        position: 'absolute',
                        top: `${previewPosition.top}px`,
                        left: `${previewPosition.left}px`,
                        zIndex: 9999,
                        pointerEvents: 'none',
                        opacity: 1,
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      <div className="explorer-preview-content">
                        {memeTokenData?.image && !memeImageError ? (
                          <img
                            src={memeTokenData.image}
                            style={{
                              width: '220px',
                              height: '220px',
                              borderRadius: '6px',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '220px',
                              height: '220px',
                              borderRadius: '6px',
                              backgroundColor: 'rgb(6,6,6)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid rgba(179, 184, 249, 0.15)',
                            }}
                          >
                            <div
                              style={{
                                fontSize: memeTokenData?.symbol?.length <= 3 ? '72px' : '56px',
                                fontWeight: '200',
                                color: '#ffffff',
                                letterSpacing: memeTokenData?.symbol?.length > 3 ? '-4px' : '0',
                                marginBottom: '8px',
                              }}
                            >
                              {(memeTokenData?.symbol || '?').slice(0, 3).toUpperCase()}
                            </div>
                            <div
                              style={{
                                fontSize: '14px',
                                fontWeight: '300',
                                color: 'rgba(255, 255, 255, 0.5)',
                              }}
                            >
                              {memeTokenData?.name || 'Unknown Token'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>,
                    document.body,
                  )}
                <div className="header-launchpad-logo-container">
                  <Tooltip content="crystal.fun">
                    <img src={crystal} className="header-launchpad-logo" />
                  </Tooltip>

                </div>
              </div>

              <div className="meme-interface-token-meta-row">
                <span className="meme-interface-token-created">{formatTimeAgo(Number(memeTokenData.created))}</span>

                <div className="meme-interface-token-social-links">

                  {memeTokenData.twitterHandle && (
                    <TwitterHover url={memeTokenData.twitterHandle}>
                      <a
                        className="token-info-meme-interface-twitter-btn"
                        href={memeTokenData.twitterHandle}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={memeTokenData.twitterHandle.includes('/status/') ? tweet : avatar}
                          className={memeTokenData.twitterHandle.includes('/status/') ? 'tweet-icon' : 'avatar-icon'}
                          style={{ width: '18px', height: '18px' }}
                        />
                      </a>
                    </TwitterHover>
                  )}

                  {memeTokenData.website && (
                    <a
                      className="token-info-meme-interface-social-btn"
                      href={memeTokenData.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                      </svg>
                    </a>
                  )}

                  {memeTokenData.telegramHandle && (
                    <a
                      className="token-info-meme-interface-social-btn"
                      href={memeTokenData.telegramHandle}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img src={telegram} alt="telegram" style={{ width: '16px', height: '16px' }} />
                    </a>
                  )}

                  {memeTokenData.discordHandle && (
                    <a
                      className="token-info-meme-interface-social-btn"
                      href={memeTokenData.discordHandle}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img src={discord} alt="discord" style={{ width: '14px', height: '14px' }} />
                    </a>
                  )}

                  <a
                    className="token-info-meme-interface-social-btn"
                    href={`https://twitter.com/search?q=${memeTokenData.tokenAddress}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Search size={14} />
                  </a>

                </div>
              </div>
            </div>
          </div>

          <div className="meme-interface-token-header-right" ref={memeHeaderRightRef}>
            <div className="meme-interface-token-metrics">
              <span className="meme-interface-market-cap">
                {formatPrice((memeTokenData.marketCap || 1000) * monUsdPrice)}
              </span>
              <div className="meme-interface-token-metric">
                <span className="meme-interface-metric-label">Price</span>
                <span className="meme-interface-metric-value meme-price-large">
                  ${formatMemePrice((Number(price) * monUsdPrice))}
                </span>
              </div>

              <div className="meme-interface-token-metric">
                <span className="meme-interface-metric-label">Liquidity</span>
                {(() => {
                  const liquidityValue = Number(memeTokenData?.reserveQuote || 0) * 2 * monUsdPrice / 10 ** 18;
                  const isLowLiquidity = liquidityValue < 8000;

                  const liquidityContent = (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                      <span
                        className={`meme-interface-metric-value meme-price-large ${isLowLiquidity ? 'low-liquidity' : ''}`}
                      >
                        {formatPrice(liquidityValue)}
                      </span>
                      {isLowLiquidity && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 22"
                          fill="none"
                          stroke="rgb(241, 213, 68)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="low-liquidity-icon"
                        >
                          <path d="M12 2C12 2 6 9 6 13a6 6 0 0 0 12 0c0-4-6-11-6-11z" />
                        </svg>
                      )}
                    </div>
                  );

                  return isLowLiquidity ? (
                    <Tooltip content="Warning: low liquidity" offset={5}>
                      {liquidityContent}
                    </Tooltip>
                  ) : liquidityContent;
                })()}
              </div>
              <div className="meme-interface-token-metric">
                <span className="meme-interface-metric-label">24h Change</span>
                <span
                  className={`meme-interface-metric-value ${memeTokenData.change24h >= 0 ? 'positive' : 'negative'}`}
                >
                  {memeTokenData.change24h >= 0 ? '+' : ''}{memeTokenData.change24h.toFixed(2)}%
                </span>
              </div>
              {memeTokenData.status == 'graduated' ? (
                <div className="meme-interface-token-metric">
                  <span className="meme-interface-metric-label">B. Curve</span>
                  <span
                    className="meme-interface-metric-value"
                    style={{ color: getBondingColorMeme(bondingPercentage) }}
                  >
                    Graduated
                  </span>
                </div>
              ) : (
                <div className="meme-interface-token-metric">
                  <span className="meme-interface-metric-label">B. Curve</span>
                  <span
                    className="meme-interface-metric-value"
                    style={{ color: getBondingColorMeme(bondingPercentage) }}
                  >
                    {bondingPercentage.toFixed(1)}%
                  </span>
                </div>

              )}
              <div className="meme-interface-token-metric">
                <span className="meme-interface-metric-label">Supply</span>
                <span className="meme-interface-metric-value meme-price-large">
                  1B
                </span>
              </div>
              <Tooltip content="Dev Migrations">
                <div className="meme-interface-token-metric"
                  onClick={() => window.open(`https://testnet.monadscan.com/address/${memeTokenData.developerAddress}`, '_blank', 'noopener,noreferrer')
                  }
                >
                  <span className="meme-interface-dev-migrations-value" style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: "pointer", marginLeft: "4px" }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        width: '15px',
                        height: '15px',
                        color: (memeTokenData.graduatedTokens || 0) > 0 ? 'rgba(255, 251, 0, 1)' : '#b0b7c8'
                      }}
                    >
                      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
                      <path d="M5 21h14" />
                    </svg>
                    <span style={{ color: "#b0b7c8" }}>
                      {memeTokenData.graduatedTokens || 0}
                    </span>
                  </span>
                </div>
              </Tooltip>

              {externalUserStats && externalUserStats.valueBought > 0 && externalUserStats.valueNet !== 0 && (
                <div className="meme-interface-token-metric">
                  <div className="meme-interface-pnl-value-container">

                    <button
                      className="token-info-trenches-pnl-button"
                      onClick={() => setpopup(27)}
                    >
                      <svg fill="#d8dcff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="16" height="16">
                        <path d="M31.965 2.008a2 2 0 0 0-1.375.582L20.35 12.82a2.57 2.57 0 0 0-.44.65 2 2 0 0 0 1.85 2.77H30v23.54a2 2 0 0 0 4 0V16.24h8.25a2 2 0 0 0 1.41-3.42L33.41 2.59a2 2 0 0 0-1.446-.582zM12 22a2 2 0 0 0-2 2v32a2 2 0 0 0 2 2h40a2 2 0 0 0 2-2V24a2 2 0 0 0-2-2H42a2 2 0 0 0 0 4h8v28H14V26h8a2 2 0 0 0 0-4H12z" />
                      </svg>
                      Share PNL
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isPerpsToken) {
    const isPerpsLoading = !perpsTokenInfo?.lastPrice || !perpsTokenInfo?.contractName;
    if (isPerpsLoading) {
      return <PerpsTokenSkeleton />;
    }

    return (
      <div className="perps-interface-token-info-container">
        <div className="perps-interface-token-header-info">
          <div className="perps-interface-token-header-left" onClick={togglePerpsDropdown}>
            <button
              className={`favorite-icon ${favorites.includes(perpsTokenInfo.contractName) ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(perpsTokenInfo.contractName);
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={favorites.includes(perpsTokenInfo.contractName) ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </button>
            <div className="perps-interface-token-icon-container">
              <img
                src={perpsTokenInfo.iconURL}
                className="perps-interface-token-icon"
              />
            </div>
            <div className="perps-interface-token-identity">
              <div className="perps-interface-token-name-row">
                <div className="perps-interface-token-symbol">{perpsTokenInfo.baseAsset}/{perpsTokenInfo.quoteAsset}</div>
              </div>
              <div className="ctrlktooltip">
                Ctrl+K
              </div>
            </div>
          </div>

          <div className="perps-interface-token-header-right">
            <div className="perps-interface-token-metrics" ref={perpsMetricsRef}>
              <span className={`perps-interface-metric-value perps-price-large ${priceColor}`}>
                {formatCommas(Number(perpsTokenInfo.lastPrice).toFixed((perpsTokenInfo.lastPrice.toString().split(".")[1] || "").length))}
              </span>

              <div className="perps-interface-token-metric">
                <span className="perps-interface-metric-label">Oracle</span>
                <span className="perps-interface-metric-value perps-price-small">
                  {formatCommas(Number(perpsTokenInfo.oraclePrice).toFixed((perpsTokenInfo.lastPrice.toString().split(".")[1] || "").length))}
                </span>
              </div>

              <div className="perps-interface-token-metric">
                <span className="perps-interface-metric-label">24h Change</span>
                <span
                  className={`perps-interface-metric-value ${Number(perpsTokenInfo.priceChangePercent) >= 0 ? 'positive' : 'negative'}`}
                >
                  {(Number(perpsTokenInfo.priceChangePercent) >= 0 ? '+' : '') + formatCommas(perpsTokenInfo.priceChange) + ' / ' + (Number(perpsTokenInfo.priceChangePercent) >= 0 ? '+' : '') + Number(perpsTokenInfo.priceChangePercent * 100).toFixed(2)}%
                </span>
              </div>

              <div className="perps-interface-token-metric">
                <span className="perps-interface-metric-label">24h Volume</span>
                <span className="perps-interface-metric-value perps-price-small">
                  ${formatCommas(Number(perpsTokenInfo.value).toFixed(2))}
                </span>
              </div>

              <div className="perps-interface-token-metric">
                <span className="perps-interface-metric-label">Open Interest</span>
                <span className="perps-interface-metric-value perps-price-small">
                  ${formatCommas((Number(perpsTokenInfo.openInterest) * Number(perpsTokenInfo.lastPrice)).toFixed(2))}
                </span>
              </div>

              <div className="perps-interface-token-metric">
                <span className="perps-interface-metric-label">Funding / Countdown</span>
                <div className="perps-interface-funding-container">
                  <span
                    className={`perps-interface-metric-value ${perpsTokenInfo.fundingRate >= 0 ? 'positive' : 'negative'}`}
                  >
                    {perpsTokenInfo.fundingRate >= 0 ? '+' : ''}{(perpsTokenInfo.fundingRate * 100).toFixed(4)}%
                  </span>
                  <span className="perps-interface-metric-value perps-price-small">
                    {' / ' + remaining}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="perps-markets-dropdown" ref={perpsDropdownRef}>
          {isPerpsDropdownOpen && (
            <div
              className={`perps-markets-dropdown-content ${isPerpsDropdownVisible ? 'visible' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="markets-dropdown-header">
                <div className="search-container">
                  <div className="search-wrapper">
                    <Search className="search-icon" size={12} />
                    <input
                      ref={perpsSearchInputRef}
                      type="text"
                      placeholder="Search perps markets"
                      className="search-input"
                      value={perpsSearchQuery}
                      onChange={(e) => setPerpsSearchQuery(e.target.value)}
                      tabIndex={isPerpsDropdownVisible ? 0 : -1}
                      autoComplete="off"
                    />
                    {perpsSearchQuery && (
                      <button
                        className="cancel-search"
                        onClick={() => setPerpsSearchQuery('')}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="market-filter-tabs" ref={perpsFilterTabsRef}>
                {perpsFilterTabs}
              </div>

              <div className="perps-markets-list-header">
                <div className="favorites-header"></div>
                <div onClick={() => handlePerpsSort('volume')}>
                  Market / Volume
                  <SortArrow
                    sortDirection={perpsSortField === 'volume' ? perpsSortDirection : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePerpsSort('volume');
                    }}
                  />
                </div>
                <div className="markets-dropdown-chart-container" onClick={() => handlePerpsSort('price')}>
                  Last Price
                  <SortArrow
                    sortDirection={perpsSortField === 'price' ? perpsSortDirection : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePerpsSort('price');
                    }}
                  />
                </div>
                <div className="perps-oi-header" onClick={() => handlePerpsSort('change')}>
                  24hr Change
                  <SortArrow
                    sortDirection={perpsSortField === 'change' ? perpsSortDirection : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePerpsSort('change');
                    }}
                  />
                </div>
                <div className="perps-funding-header" onClick={() => handlePerpsSort('funding')}>
                  8hr Funding
                  <SortArrow
                    sortDirection={perpsSortField === 'funding' ? perpsSortDirection : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePerpsSort('funding');
                    }}
                  />
                </div>
                <div className="markets-dropdown-price-container" onClick={() => handlePerpsSort('openInterest')}>
                  Open Interest
                  <SortArrow
                    sortDirection={perpsSortField === 'openInterest' ? perpsSortDirection : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePerpsSort('openInterest');
                    }}
                  />
                </div>
              </div>
              <div className="perps-markets-list-virtualized" style={{ height: '400px', width: '100%' }}>
                <List
                  ref={virtualizationListRef}
                  height={400}
                  width="100%"
                  itemCount={filteredPerpsMarkets.length}
                  itemSize={40}
                  itemData={virtualizationData}
                  overscanCount={2}
                  itemKey={(index, data) => data.markets[index]?.contractName || index}
                >
                  {PerpsMarketRow}
                </List>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={shouldShowTokenInfo}>
      <div
        className="symbol-info"
        onClick={handleSymbolInfoClick}
        role="button"
        tabIndex={0}
      >
        {isAdvancedView ? (
          <div className="markets-favorite-section">
            <button
              className={`favorite-icon ${favorites.includes(tokenAddress) ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(tokenAddress);
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={favorites.includes(tokenAddress) ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </button>
          </div>
        ) : (
          <Search className="token-info-search-icon" size={18} />
        )}

        {shouldShowFullHeader && (
          <div
            className="token-icons-container"
            onMouseEnter={() => setHoveredToken(true)}
            onMouseLeave={() => setHoveredToken(false)}
          >
            {bondingPercentage > 0 && isMemeToken ? (
              <div
                className="token-icons-with-bonding"
                style={{
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
                } as React.CSSProperties}
              >
                <div className="token-icons-inner">
                  <TokenIcons inIcon={in_icon} outIcon={out_icon} />
                </div>
              </div>
            ) : (
              <TokenIcons inIcon={in_icon} outIcon={out_icon} />
            )}
          </div>
        )}

        <div className="token-details">
          <div className={isLoading && shouldShowFullHeader ? 'symbol-skeleton' : 'trading-pair'}>
            {shouldShowFullHeader ? (
              <>
                <span className="first-asset">{activeMarket.baseAsset}</span>
                <span>/</span>
                <span className="second-asset">{activeMarket?.quoteAsset}</span>
                {tokendict[activeMarket?.baseAddress]?.lst && (
                  <span className="lst-multiplier">
                    1.25x
                  </span>
                )}
              </>
            ) : (
              <>
                <div className="search-market-text-container">
                  <span className="search-market-text">{t("searchAMarket")}</span>
                  <span className="second-asset">{t("browsePairs")}</span>
                </div>
              </>
            )}
          </div>
          {shouldShowFullHeader && (
            <div className={isLoading && shouldShowFullHeader ? 'pair-skeleton' : 'token-name'}>
              <span className="full-token-name">
                {tokendict[activeMarket?.baseAddress]?.name}
              </span>
              <div
                className="token-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <CopyButton textToCopy={marketAddress} />
                <TokenInfoPopup
                  symbol={activeMarket?.baseAsset}
                  setpopup={setpopup}
                />
              </div>
            </div>
          )}
        </div>

        <div className="markets-dropdown" ref={dropdownRef}>
          {isDropdownOpen && (
            <div
              className={`markets-dropdown-content ${isDropdownVisible ? 'visible' : ''}`}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleDropdownKeyDown}
            >
              <div className="markets-dropdown-header">
                <div className="search-container">
                  <div className="search-wrapper">
                    <Search className="search-icon" size={12} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={t('searchMarkets')}
                      className="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      tabIndex={isDropdownVisible ? 0 : -1}
                      autoComplete="off"
                    />
                    {searchQuery && (
                      <button
                        className="cancel-search"
                        onClick={() => setSearchQuery('')}
                      >
                        {t('clear')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="market-filter-tabs" ref={filterTabsRef}>
                {['all', 'favorites', 'lsts', 'stablecoins', 'memes'].map((filter) => (
                  <button
                    key={filter}
                    className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {t(filter)}
                  </button>
                ))}
              </div>

              <div className="markets-list-header">
                <div className="favorites-header" />
                <div onClick={() => handleSort('volume')}>
                  {t('market')} / {t('volume')}
                  <SortArrow
                    sortDirection={
                      sortField === 'volume' ? sortDirection === 'asc' ? 'desc' : 'asc' : undefined
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSort('volume');
                    }}
                  />
                </div>
                <div
                  className="markets-dropdown-chart-container"
                  onClick={() => handleSort('change')}
                >
                  {t('last')} {t('day')}
                  <SortArrow
                    sortDirection={
                      sortField === 'change' ? sortDirection === 'asc' ? 'desc' : 'asc' : undefined
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSort('change');
                    }}
                  />
                </div>
                <div
                  className="markets-dropdown-price-container"
                  onClick={() => handleSort('price')}
                >
                  {t('price')}
                  <SortArrow
                    sortDirection={
                      sortField === 'price' ? sortDirection === 'asc' ? 'desc' : 'asc' : undefined
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSort('price');
                    }}
                  />
                </div>
              </div>
              <div className="markets-list" ref={marketsListRef}>
                {sortedMarkets.length > 0 ? (
                  sortedMarkets.map((market, index) => (
                    <div
                      key={market.pair}
                      className={`market-item-container ${index === selectedIndex ? 'selected' : ''}`}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div
                        className="market-item"
                        onClick={() => {
                          onMarketSelect(market);
                          setSearchQuery('');
                          setIsDropdownVisible(false);
                          setTimeout(() => {
                            setIsDropdownOpen(false);
                          }, 200);
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(market.baseAddress.toLowerCase());
                          }}
                          className={`dropdown-market-favorite-button 
                            ${favorites.includes(market.baseAddress?.toLowerCase()) ? 'active' : ''}`}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill={
                              favorites.includes(market.baseAddress?.toLowerCase())
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

                        <div className="market-pair-section">
                          <img src={market.image} className="market-icon" />
                          <div className="market-info">
                            <div className="market-pair-container">
                              <span className="market-pair">{market.pair}</span>
                            </div>
                            <span className="market-volume">
                              ${formatCommas(market.volume)}
                            </span>
                          </div>
                        </div>
                        <div className="minichart-section">
                          <MiniChart
                            market={market}
                            series={market.mini}
                            priceChange={market.priceChange}
                            isVisible={true}
                          />
                        </div>
                        <div className="market-price-section">
                          <div className="market-price">
                            {formatSubscript(market.currentPrice)}
                          </div>
                          <div
                            className={`market-change ${market.priceChange.startsWith('-') ? 'negative' : 'positive'}`}
                          >
                            {market.priceChange + '%'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-markets-message">{t('noMarkets')}</div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="ctrlktooltip">
          Ctrl+K
        </div>
      </div>

      {shouldShowFullHeader && (
        <>
          <div className="token-info-right-section">
            <div className="price-display-section">
              <PriceDisplay
                price={price}
                activeMarket={activeMarket}
                isLoading={isLoading}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TokenInfo;