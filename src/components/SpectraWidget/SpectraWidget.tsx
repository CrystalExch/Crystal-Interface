import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import ReactDOM, { createPortal } from 'react-dom';
import {
  BarChart3,
  Bell,
  ChevronDown,
  Eye,
  EyeOff,
  Hash,
  Image,
  Play,
  RotateCcw,
  Search,
  Volume2,
} from 'lucide-react';
import avatar from '../../assets/avatar.png';
import communities from '../../assets/community.png';
import tweet from '../../assets/tweet.png';
import telegram from '../../assets/telegram.png';
import discord from '../../assets/discord1.svg';
import lightning from '../../assets/flash.png';
import camera from '../../assets/camera.svg';
import monadicon from '../../assets/monadlogo.svg';
import filter from '../../assets/filter.svg';
import slippage from '../../assets/slippage.svg';
import circle from '../../assets/circle_handle.png';
import gas from '../../assets/gas.svg';
import reset from '../../assets/reset.svg';
import { TwitterHover } from '../TwitterHover/TwitterHover';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi';
import { encodeFunctionData } from 'viem';
import './SpectraWidget.css';
import { HexColorPicker } from 'react-colorful';
import { useNavigate } from 'react-router-dom';
import { settings } from '../../settings';

const crystal = '/CrystalLogo.png';

export interface Token {
  id: string;
  tokenAddress: string;
  dev: string;
  name: string;
  symbol: string;
  image: string;
  price: number;
  marketCap: number;
  change24h: number;
  volume24h: number;
  holders: number;
  proTraders: number;
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
  created: number;
  bondingAmount: number;
  volumeDelta: number;
  telegramHandle: string;
  discordHandle: string;
  graduatedTokens: number;
  launchedTokens: number;
}

type ColumnKey = 'new' | 'graduating' | 'graduated';

interface DisplaySettings {
  metricSize: 'small' | 'large';
  quickBuySize: 'small' | 'large' | 'mega' | 'ultra';
  quickBuyStyle: 'color' | 'grey';
  ultraStyle: 'default' | 'glowing' | 'border';
  ultraColor: 'color' | 'grey';
  hideSearchBar: boolean;
  noDecimals: boolean;
  hideHiddenTokens: boolean;
  squareImages: boolean;
  progressBar: boolean;
  spacedTables: boolean;
  colorRows: boolean;
  columnOrder: Array<ColumnKey>;
  hiddenColumns?: Array<ColumnKey>;
  quickBuyClickBehavior: 'nothing' | 'openPage' | 'openNewTab';
  secondQuickBuyEnabled: boolean;
  secondQuickBuyColor: string;
  visibleRows: {
    marketCap: boolean;
    volume: boolean;
    fees: boolean;
    tx: boolean;
    socials: boolean;
    holders: boolean;
    proTraders: boolean;
    devMigrations: boolean;
    top10Holders: boolean;
    devHolding: boolean;
    fundingTime: boolean;
    snipers: boolean;
    insiders: boolean;
    dexPaid: boolean;
  };
  metricColoring: boolean;
  metricColors: {
    marketCap: { range1: string; range2: string; range3: string };
    volume: { range1: string; range2: string; range3: string };
    holders: { range1: string; range2: string; range3: string };
  };
}

const DISPLAY_DEFAULTS: DisplaySettings = {
  metricSize: 'small',
  quickBuySize: 'large',
  quickBuyStyle: 'color',
  ultraStyle: 'default',
  ultraColor: 'color',
  hideSearchBar: false,
  noDecimals: false,
  hideHiddenTokens: false,
  squareImages: true,
  progressBar: true,
  spacedTables: false,
  colorRows: false,
  columnOrder: ['new', 'graduating', 'graduated'],
  hiddenColumns: [],
  quickBuyClickBehavior: 'nothing',
  secondQuickBuyEnabled: false,
  secondQuickBuyColor: '#606BCC',
  visibleRows: {
    marketCap: true,
    volume: true,
    fees: true,
    tx: true,
    socials: true,
    holders: true,
    proTraders: true,
    devMigrations: true,
    top10Holders: true,
    devHolding: true,
    fundingTime: false,
    snipers: true,
    insiders: true,
    dexPaid: false,
  },
  metricColoring: true,
  metricColors: {
    marketCap: { range1: '#d8dcff', range2: '#eab308', range3: '#14b8a6' },
    volume: { range1: '#ffffff', range2: '#ffffff', range3: '#ffffff' },
    holders: { range1: '#ffffff', range2: '#ffffff', range3: '#ffffff' },
  },
};
interface TabFilters {
  new: any;
  graduating: any;
  graduated: any;
}
interface SpectraWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  appliedFilters?: TabFilters;
  onOpenFiltersForColumn: (c: Token['status']) => void;
  onSnapChange?: (snapSide: 'left' | 'right' | null, width: number) => void;
  tokensByStatus?: { new: any[]; graduating: any[]; graduated: any[] };
  monUsdPrice?: number;
  routerAddress?: string;
  sendUserOperationAsync?: any;
  showLoadingPopup?: any;
  updatePopup?: any;
  setTokenData: any;
  selectedWallets?: Set<string>;
  subWallets?: Array<{ address: string; privateKey: string }>;
  walletTokenBalances?: { [address: string]: any };
  activeWalletPrivateKey?: string;
  tokenList?: any[];
  activechain?: number;
  nonces?: any;
  account?: {
    connected: boolean;
    address?: string;
    chainId?: number;
  };
  terminalRefetch?: any;
}


const HEADER_HEIGHT = 53;
const SIDEBAR_WIDTH = 50;
const SNAP_THRESHOLD = 10;
const SNAP_HOVER_TIME = 300;

const formatPrice = (p: number, noDecimals = false) => {
  if (p >= 1e6) {
    return `$${(p / 1e6).toFixed(noDecimals ? 0 : 1)}M`;
  }
  if (p >= 1e3) {
    return `$${(p / 1e3).toFixed(noDecimals ? 0 : 1)}K`;
  }
  if (p >= 1) {
    return `$${p.toFixed(noDecimals ? 0 : 2)}`;
  }
  return `$${p.toFixed(noDecimals ? 4 : 6)}`;
};

const formatTimeAgo = (createdTimestamp: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const ageSec = now - createdTimestamp;

  if (ageSec < 60) {
    return `${ageSec}s`;
  }

  const ageMin = Math.floor(ageSec / 60);
  if (ageMin < 60) {
    return `${ageMin}m`;
  }

  const ageHour = Math.floor(ageMin / 60);
  if (ageHour < 24) {
    return `${ageHour}h`;
  }

  const ageDay = Math.floor(ageHour / 24);
  return `${ageDay}d`;
};

const calculateBondingPercentage = (marketCap: number) => {
  const bondingPercentage = Math.min((marketCap / 25000) * 100, 100);
  return bondingPercentage;
};

const getBondingColor = (b: number) => {
  if (b < 25) return '#ee5b5bff';
  if (b < 50) return '#f59e0b';
  if (b < 75) return '#eab308';
  return '#43e17dff';
};

const getBondingColorClass = (percentage: number) => {
  if (percentage < 25) return 'bonding-0-25';
  if (percentage < 50) return 'bonding-25-50';
  if (percentage < 75) return 'bonding-50-75';
  return 'bonding-75-100';
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

const getMetricColorClasses = (
  token: Token | undefined,
  display: DisplaySettings,
) => {
  if (!token || !display?.metricColors || !display?.metricColoring) return null;

  const classes: string[] = [];
  const cssVars: Record<string, string> = {};

  if (typeof token.marketCap === 'number' && !isNaN(token.marketCap)) {
    if (token.marketCap < 30000) {
      classes.push('market-cap-range1');
      cssVars['--metric-market-cap-range1'] =
        display.metricColors.marketCap.range1;
    } else if (token.marketCap < 150000) {
      classes.push('market-cap-range2');
      cssVars['--metric-market-cap-range2'] =
        display.metricColors.marketCap.range2;
    } else {
      classes.push('market-cap-range3');
      cssVars['--metric-market-cap-range3'] =
        display.metricColors.marketCap.range3;
    }
  }

  if (typeof token.volume24h === 'number' && !isNaN(token.volume24h)) {
    if (token.volume24h < 1000) {
      classes.push('volume-range1');
      cssVars['--metric-volume-range1'] = display.metricColors.volume.range1;
    } else if (token.volume24h < 2000) {
      classes.push('volume-range2');
      cssVars['--metric-volume-range2'] = display.metricColors.volume.range2;
    } else {
      classes.push('volume-range3');
      cssVars['--metric-volume-range3'] = display.metricColors.volume.range3;
    }
  }

  if (typeof token.holders === 'number' && !isNaN(token.holders)) {
    if (token.holders < 10) {
      classes.push('holders-range1');
      cssVars['--metric-holders-range1'] = display.metricColors.holders.range1;
    } else if (token.holders < 50) {
      classes.push('holders-range2');
      cssVars['--metric-holders-range2'] = display.metricColors.holders.range2;
    } else {
      classes.push('holders-range3');
      cssVars['--metric-holders-range3'] = display.metricColors.holders.range3;
    }
  }

  return classes.length > 0 ? { classes: classes.join(' '), cssVars } : null;
};

const hasMetricColoring = (displaySettings: DisplaySettings | undefined) => {
  return displaySettings?.metricColoring === true;
};

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
        top = rect.top + scrollY - tooltipRect.height - offset - 15;
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

const TokenCard: React.FC<{
  token: any;
  idx: number;
  hiddenTokens: Set<string>;
  blacklistedDevs: Set<string>;
  loadingTokens: Set<string>;
  quickbuyAmount: string;
  quickbuyAmountSecond: string;
  isLoadingPrimary: boolean;
  isLoadingSecondary: boolean;
  monUsdPrice: number;
  handleHideToken: (tokenId: string) => void;
  handleBlacklistDev: (token: any) => void;
  handleQuickBuy: (token: any, amount: string, buttonType: 'primary' | 'secondary') => void;
  hoveredImage: string | null;
  hoveredToken: string | null;
  onImageHover: (tokenId: string) => void;
  onImageLeave: () => void;
  onTokenHover: (tokenId: string) => void;
  onTokenLeave: () => void;
  displaySettings: DisplaySettings;
  onCopyToClipboard: (text: string) => void;
  isBlacklisted: boolean;
  onBlacklistToken: (token: Token) => void;
  onTokenClick: (token: Token) => void;

}> = ({
  token,
  idx,
  hiddenTokens,
  blacklistedDevs,
  loadingTokens,
  quickbuyAmount,
  quickbuyAmountSecond,
  monUsdPrice,
  handleHideToken,
  handleBlacklistDev,
  handleQuickBuy,
  hoveredImage,
  hoveredToken,
  onImageHover,
  onImageLeave,
  onTokenHover,
  onTokenLeave,
  displaySettings,
  onCopyToClipboard,
  isBlacklisted,
  onBlacklistToken,
  onTokenClick,
}) => {
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const tokenRowRef = useRef<HTMLDivElement>(null);
    const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
    const [showPreview, setShowPreview] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [bondingPopupPosition, setBondingPopupPosition] = useState({
      top: 0,
      left: 0,
    });

    const totalTraders = (token.holders || 0) + (token.proTraders || 0);
    const totalTransactions = (token.buyTransactions || 0) + (token.sellTransactions || 0);
    const buyPct = totalTransactions === 0 ? 0 : ((token.buyTransactions || 0) / totalTransactions) * 100;
    const sellPct = totalTransactions === 0 ? 0 : ((token.sellTransactions || 0) / totalTransactions) * 100;

    const tokenId = token.id || token.tokenAddress;
    const devAddress = token.dev?.toLowerCase();
    const isHidden = hiddenTokens.has(tokenId);
    const isLoadingPrimary = loadingTokens.has(`${tokenId}-primary`);
    const isLoadingSecondary = loadingTokens.has(`${tokenId}-secondary`);

    const bondingPercentage = useMemo(
      () => calculateBondingPercentage(token.marketCap),
      [token.marketCap],
    );

    const gradient = useMemo(
      () => createColorGradient(getBondingColor(bondingPercentage)),
      [bondingPercentage],
    );

    type CSSVars = React.CSSProperties & Record<string, string>;

    const imageStyle: CSSVars = {
      position: 'relative',
      '--progress-angle': `${(bondingPercentage / 100) * 360}deg`,
      '--progress-color-start': gradient.start,
      '--progress-color-mid': gradient.mid,
      '--progress-color-end': gradient.end,
    };

    const progressLineStyle: CSSVars = {
      '--progress-percentage': `${bondingPercentage}%`,
      '--progress-color': getBondingColor(bondingPercentage),
    };

    const metricData = hasMetricColoring(displaySettings)
      ? getMetricColorClasses(token, displaySettings)
      : null;
    const cssVariables: CSSVars = metricData?.cssVars || {};

    const showBonding =
      (token.status === 'new' || token.status === 'graduating') &&
      hoveredToken === tokenId;

    const extractTwitterUsername = (url: string): string | null => {
      if (!url) return null;
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          return pathParts[0];
        }
      } catch {
        return null;
      }
      return null;
    };

    const updatePreviewPosition = useCallback(() => {
      if (!imageContainerRef.current) return;

      const rect = imageContainerRef.current.getBoundingClientRect();
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      const viewportWidth = window.innerWidth;
      const previewWidth = 220;
      const offset = 10;

      let left = rect.right + scrollX + offset;

      if (left + previewWidth > viewportWidth) {
        left = rect.left + scrollX - previewWidth - offset;
      }

      const top = rect.top + scrollY;

      setPreviewPosition({ top, left });
    }, []);

    const updateBondingPopupPosition = useCallback(() => {
      if (!tokenRowRef.current) return;

      const rect = tokenRowRef.current.getBoundingClientRect();
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      const popupWidth = 0;
      const popupHeight = 28;
      const offset = 4;

      const top = rect.top + scrollY - popupHeight - offset;
      const left = rect.left + scrollX + rect.width / 2 - popupWidth / 2;

      setBondingPopupPosition({ top, left });
    }, []);

    useEffect(() => {
      if (hoveredImage === tokenId) {
        const calculateAndShow = () => {
          updatePreviewPosition();
          setTimeout(() => setShowPreview(true), 10);
        };

        calculateAndShow();

        const handleResize = () => updatePreviewPosition();
        window.addEventListener('scroll', updatePreviewPosition, true);
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('scroll', updatePreviewPosition, true);
          window.removeEventListener('resize', handleResize);
        };
      } else {
        setShowPreview(false);
      }
    }, [hoveredImage, tokenId, updatePreviewPosition]);

    useEffect(() => {
      if (hoveredToken === tokenId) {
        updateBondingPopupPosition();

        const handleResize = () => updateBondingPopupPosition();
        window.addEventListener('scroll', updateBondingPopupPosition);
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('scroll', updateBondingPopupPosition);
          window.removeEventListener('resize', handleResize);
        };
      }
    }, [hoveredToken, tokenId, updateBondingPopupPosition]);

    return (
      <>
        <div
          key={token.id || idx}
          ref={tokenRowRef}
          className={`spectra-market-row ${isHidden ? 'hidden-token' : ''} ${isBlacklisted ? 'blacklisted-token' : ''} ${displaySettings.colorRows && token.status !== 'graduated'
            ? `colored-row ${getBondingColorClass(bondingPercentage)}`
            : ''
            } ${metricData ? `metric-colored ${metricData.classes}` : ''} ${token.status === 'graduated' ? 'graduated' : ''}`}
          style={cssVariables}
          onMouseEnter={() => onTokenHover(tokenId)}
          onMouseLeave={onTokenLeave}
          onClick={() => onTokenClick(token)}
        >
          <div className="spectra-token-actions">
            <Tooltip content={isHidden ? 'Show Token' : 'Hide Token'}>
              <button
                className={`spectra-hide-button ${isHidden ? 'strikethrough' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleHideToken(tokenId);
                }}
              >
                <EyeOff size={16} />
              </button>
            </Tooltip>
            <Tooltip content={isBlacklisted ? 'Unblacklist Dev' : 'Blacklist Dev'}>
              <button
                className={`spectra-blacklist-button ${isBlacklisted ? 'strikethrough' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBlacklistDev(token);
                }}
              >
                <svg
                  className="spectra-blacklist-dev-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 30 30"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                </svg>
              </button>
            </Tooltip>
          </div>

          <div className="spectra-market-left"
            style={!displaySettings.progressBar ? { marginTop: '-3px' } : {}}>
            <div
              ref={imageContainerRef}
              className={`spectra-market-image-container ${token.status === 'graduated' ? 'graduated' : ''} ${!displaySettings.squareImages ? 'circle-mode' : ''} ${!displaySettings.progressBar ? 'no-progress-ring' : ''}`}
              style={
                token.status === 'graduated' || !displaySettings.progressBar
                  ? { position: 'relative' }
                  : imageStyle
              }
            >
              <div className={`spectra-progress-spacer ${!displaySettings.squareImages ? 'circle-mode' : ''}`}>
                <div className={`spectra-image-wrapper ${!displaySettings.squareImages ? 'circle-mode' : ''}`}>
                  {token.image && !imageError ? (
                    <img
                      src={token.image}
                      className={`spectra-market-image ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
                      alt={token.symbol}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div
                      className={`spectra-market-letter ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgb(6,6,6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: token.symbol?.length <= 3 ? '34px' : '28px',
                        fontWeight: '200',
                        color: '#ffffff',
                        letterSpacing: token.symbol?.length > 3 ? '-1px' : '0',
                        borderRadius: displaySettings.squareImages ? '8px' : '50%',
                      }}
                    >
                      {token.symbol?.slice(0, 2).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`spectra-image-overlay ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
                onMouseEnter={() => onImageHover(tokenId)}
                onMouseLeave={onImageLeave}
              >
                <img className="spectra-camera-icon" src={camera} alt="Preview" />
              </div>
              <div className="spectra-launchpad-logo-container">
                <Tooltip content="crystal.fun">
                  <img src={crystal} className="spectra-launchpad-logo" alt="Crystal" />
                </Tooltip>
              </div>
            </div>

            {!displaySettings.progressBar && token.status !== 'graduated' && (
              <div className="spectra-progress-line" style={progressLineStyle}>
                <div className="spectra-progress-line-fill" />
              </div>
            )}

            <span className="spectra-contract-address">
              {token.tokenAddress?.slice(0, 6)}…{token.tokenAddress?.slice(-4)}
            </span>
          </div>

          {/* Image Preview Portal */}
          {hoveredImage === tokenId &&
            showPreview &&
            ReactDOM.createPortal(
              <div
                className="spectra-image-preview show"
                style={{
                  position: 'absolute',
                  top: `${previewPosition.top}px`,
                  left: `${previewPosition.left}px`,
                  zIndex: 9999,
                  pointerEvents: 'none',
                }}
              >
                {token.image && !imageError ? (
                  <img
                    src={token.image}
                    alt={token.name}
                    className="spectra-preview-image"
                  />
                ) : (
                  <div className="spectra-preview-placeholder">
                    {token.symbol?.slice(0, 2).toUpperCase() || '?'}
                  </div>
                )}
              </div>,
              document.body
            )}

          <div className="spectra-market-details">
            <div className="spectra-detail-section">
              <div className="spectra-top-row">
                <div className="spectra-market-info">
                  <h3 className="spectra-market-symbol">{token.symbol || 'Unknown'}</h3>
                  <Tooltip content="Click to copy address">
                    <div className="spectra-market-name-copy-container">
                      <div className="spectra-market-name-container"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyToClipboard(token.tokenAddress);
                        }}
                        style={{ cursor: 'pointer' }}>
                        <p className="spectra-market-name">{token.name || 'Unknown'}</p>
                      </div>
                      <button
                        className="explorer-copy-btn"
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
                  </Tooltip>
                </div>
              </div>

              <div className="spectra-second-row">
                <div className="spectra-price-section">
                  <span className="spectra-time-created">
                    {formatTimeAgo(token.created)}
                  </span>
                  {displaySettings.visibleRows.socials && (
                    <>
                      {!!token.twitterHandle && (
                        <TwitterHover url={token.twitterHandle}>
                          <a
                            className="spectra-avatar-btn"
                            href={token.twitterHandle}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <img
                              src={
                                token.twitterHandle.includes('/i/communities/')
                                  ? communities
                                  : token.twitterHandle.includes('/status/')
                                    ? tweet
                                    : avatar
                              }
                              alt={
                                token.twitterHandle.includes('/i/communities/')
                                  ? 'Community'
                                  : 'Twitter'
                              }
                              className={
                                token.twitterHandle.includes('/i/communities/')
                                  ? 'spectra-community-icon'
                                  : token.twitterHandle.includes('/status/')
                                    ? 'spectra-tweet-icon'
                                    : 'spectra-avatar-icon'
                              }
                            />
                          </a>
                        </TwitterHover>
                      )}

                      {!!token.website && (
                        <a
                          className="spectra-website-btn"
                          href={token.website}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Tooltip content="Website">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                            </svg>
                          </Tooltip>
                        </a>
                      )}

                      {!!token.telegramHandle && (
                        <a
                          className="spectra-telegram-btn"
                          href={token.telegramHandle}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Tooltip content="Telegram">
                            <img src={telegram} alt="Telegram" />
                          </Tooltip>
                        </a>
                      )}

                      {!!token.discordHandle && (
                        <a
                          className="spectra-discord-btn"
                          href={token.discordHandle}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Tooltip content="Discord">
                            <img src={discord} alt="Discord" />
                          </Tooltip>
                        </a>
                      )}

                      <a
                        className="spectra-telegram-btn"
                        href={`https://twitter.com/search?q=${token.tokenAddress}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Tooltip content="Search CA Twitter">
                          <Search size={14} />
                        </Tooltip>
                      </a>
                    </>
                  )}
                </div>

                <div className="spectra-additional-data">
                  {displaySettings.visibleRows.holders && (
                    <Tooltip content="Holders">
                      <div className="spectra-stat-item">
                        <svg
                          className="spectra-traders-icon"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M 8.8007812 3.7890625 C 6.3407812 3.7890625 4.3496094 5.78 4.3496094 8.25 C 4.3496094 9.6746499 5.0287619 10.931069 6.0703125 11.748047 C 3.385306 12.836193 1.4902344 15.466784 1.4902344 18.550781 C 1.4902344 18.960781 1.8202344 19.300781 2.2402344 19.300781 C 2.6502344 19.300781 2.9902344 18.960781 2.9902344 18.550781 C 2.9902344 15.330781 5.6000781 12.720703 8.8300781 12.720703 L 8.8203125 12.710938 C 8.9214856 12.710938 9.0168776 12.68774 9.1054688 12.650391 C 9.1958823 12.612273 9.2788858 12.556763 9.3476562 12.488281 C 9.4163056 12.41992 9.4712705 12.340031 9.5097656 12.25 C 9.5480469 12.160469 9.5703125 12.063437 9.5703125 11.960938 C 9.5703125 11.540938 9.2303125 11.210938 8.8203125 11.210938 C 7.1903125 11.210938 5.8691406 9.8897656 5.8691406 8.2597656 C 5.8691406 6.6297656 7.1900781 5.3105469 8.8300781 5.3105469 L 8.7890625 5.2890625 C 9.2090625 5.2890625 9.5507812 4.9490625 9.5507812 4.5390625 C 9.5507812 4.1190625 9.2107813 3.7890625 8.8007812 3.7890625 z M 14.740234 3.8007812 C 12.150234 3.8007812 10.060547 5.9002344 10.060547 8.4902344 L 10.039062 8.4707031 C 10.039063 10.006512 10.78857 11.35736 11.929688 12.212891 C 9.0414704 13.338134 7 16.136414 7 19.429688 C 7 19.839688 7.33 20.179688 7.75 20.179688 C 8.16 20.179688 8.5 19.839688 8.5 19.429688 C 8.5 15.969687 11.29 13.179688 14.75 13.179688 L 14.720703 13.160156 C 14.724012 13.160163 14.727158 13.160156 14.730469 13.160156 C 16.156602 13.162373 17.461986 13.641095 18.519531 14.449219 C 18.849531 14.709219 19.320078 14.640313 19.580078 14.320312 C 19.840078 13.990313 19.769219 13.519531 19.449219 13.269531 C 18.873492 12.826664 18.229049 12.471483 17.539062 12.205078 C 18.674662 11.350091 19.419922 10.006007 19.419922 8.4804688 C 19.419922 5.8904687 17.320234 3.8007812 14.740234 3.8007812 z M 14.730469 5.2890625 C 16.490469 5.2890625 17.919922 6.7104688 17.919922 8.4804688 C 17.919922 10.240469 16.500234 11.669922 14.740234 11.669922 C 12.980234 11.669922 11.560547 10.250234 11.560547 8.4902344 C 11.560547 6.7302344 12.98 5.3105469 14.75 5.3105469 L 14.730469 5.2890625 z M 21.339844 16.230469 C 21.24375 16.226719 21.145781 16.241797 21.050781 16.279297 L 21.039062 16.259766 C 20.649063 16.409766 20.449609 16.840469 20.599609 17.230469 C 20.849609 17.910469 20.990234 18.640156 20.990234 19.410156 C 20.990234 19.820156 21.320234 20.160156 21.740234 20.160156 C 22.150234 20.160156 22.490234 19.820156 22.490234 19.410156 C 22.490234 18.470156 22.319766 17.560703 22.009766 16.720703 C 21.897266 16.428203 21.628125 16.241719 21.339844 16.230469 z" />
                        </svg>{' '}
                        <span className="spectra-stat-value">
                          {totalTraders.toLocaleString()}
                        </span>
                      </div>
                    </Tooltip>
                  )}

                  {displaySettings.visibleRows.proTraders && (
                    <Tooltip content="Pro Traders">
                      <div className="spectra-stat-item">
                        <svg
                          className="spectra-traders-icon"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M 12 2 L 12 4 L 11 4 C 10.4 4 10 4.4 10 5 L 10 10 C 10 10.6 10.4 11 11 11 L 12 11 L 12 13 L 14 13 L 14 11 L 15 11 C 15.6 11 16 10.6 16 10 L 16 5 C 16 4.4 15.6 4 15 4 L 14 4 L 14 2 L 12 2 z M 4 9 L 4 11 L 3 11 C 2.4 11 2 11.4 2 12 L 2 17 C 2 17.6 2.4 18 3 18 L 4 18 L 4 20 L 6 20 L 6 18 L 7 18 C 7.6 18 8 17.6 8 17 L 8 12 C 8 11.4 7.6 11 7 11 L 6 11 L 6 9 L 4 9 z M 18 11 L 18 13 L 17 13 C 16.4 13 16 13.4 16 14 L 16 19 C 16 19.6 16.4 20 17 20 L 18 20 L 18 22 L 20 22 L 20 20 L 21 20 C 21.6 20 22 19.6 22 19 L 22 14 C 22 13.4 21.6 13 21 13 L 20 13 L 20 11 L 18 11 z M 4 13 L 6 13 L 6 16 L 4 16 L 4 13 z" />
                        </svg>{' '}
                        <span className="spectra-pro-stat-value">
                          {(token.proTraders || 0).toLocaleString()}
                        </span>
                      </div>
                    </Tooltip>
                  )}

                  {displaySettings.visibleRows.devMigrations && (
                    <Tooltip content="Dev Migrations">
                      <div className="spectra-stat-item">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="spectra-graduated-icon"
                          style={
                            (token.graduatedTokens || 0) > 0
                              ? { color: 'rgba(255, 251, 0, 1)' }
                              : undefined
                          }
                        >
                          <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
                          <path d="M5 21h14" />
                        </svg>
                        <div className="spectra-dev-migrations-container">
                          <span className="spectra-dev-migrations">
                            {(token.graduatedTokens || 0).toLocaleString()}
                          </span>{' '}
                          <span className="spectra-dev-migrations-slash">/</span>
                          <span className="spectra-dev-migrations">
                            {(token.launchedTokens || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>

            {token.twitterHandle && !token.twitterHandle.includes('/i/communities/') && (() => {
              const username = extractTwitterUsername(token.twitterHandle);
              return username ? (
                <a
                  href={`https://x.com/${username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="spectra-twitter-username"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip content={`@${username} on X`}>
                    @{username}
                  </Tooltip>
                </a>
              ) : null;
            })()}

            <div className="spectra-holdings-section">
              {displaySettings.visibleRows.devHolding && (
                <Tooltip content="Dev Holding">
                  <div className="spectra-holding-item">
                    <svg
                      className="spectra-holding-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 30 30"
                      fill={
                        (token.devHolding || 0) * 100 > 25
                          ? '#eb7070ff'
                          : 'rgb(67, 254, 154)'
                      }
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                    </svg>
                    <span
                      className="spectra-holding-value"
                      style={{
                        color:
                          (token.devHolding || 0) * 100 > 25
                            ? '#eb7070ff'
                            : 'rgb(67, 254, 154)',
                      }}
                    >
                      {((token.devHolding || 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                </Tooltip>
              )}

              {displaySettings.visibleRows.top10Holders && (
                <Tooltip content="Top 10 Holders Percentage">
                  <div className="spectra-holding-item">
                    <svg
                      className="spectra-holding-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 32 32"
                      fill={
                        (token.top10Holding || 0) > 25
                          ? '#eb7070ff'
                          : 'rgb(67, 254, 154)'
                      }
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 15 4 L 15 6 L 13 6 L 13 8 L 15 8 L 15 9.1875 C 14.011719 9.554688 13.25 10.433594 13.0625 11.5 C 12.277344 11.164063 11.40625 11 10.5 11 C 6.921875 11 4 13.921875 4 17.5 C 4 19.792969 5.199219 21.8125 7 22.96875 L 7 27 L 25 27 L 25 22.96875 C 26.800781 21.8125 28 19.792969 28 17.5 C 28 13.921875 25.078125 11 21.5 11 C 20.59375 11 19.722656 11.164063 18.9375 11.5 C 18.75 10.433594 17.988281 9.554688 17 9.1875 L 17 8 L 19 8 L 19 6 L 17 6 L 17 4 Z M 16 11 C 16.5625 11 17 11.4375 17 12 C 17 12.5625 16.5625 13 16 13 C 15.4375 13 15 12.5625 15 12 C 15 11.4375 15.4375 11 16 11 Z M 10.5 13 C 12.996094 13 15 15.003906 15 17.5 L 15 22 L 10.5 22 C 8.003906 22 6 19.996094 6 17.5 C 6 15.003906 8.003906 13 10.5 13 Z M 21.5 13 C 23.996094 13 26 15.003906 26 17.5 C 26 19.996094 23.996094 22 21.5 22 L 17 22 L 17 17.5 C 17 15.003906 19.003906 13 21.5 13 Z M 9 24 L 23 24 L 23 25 L 9 25 Z" />
                    </svg>
                    <span
                      className="spectra-holding-value"
                      style={{
                        color:
                          (token.top10Holding || 0) > 25
                            ? '#eb7070ff'
                            : 'rgb(67, 254, 154)',
                      }}
                    >
                      {(token.top10Holding || 0).toFixed(2)}%
                    </span>
                  </div>
                </Tooltip>
              )}

              {displaySettings.visibleRows.snipers && (
                <Tooltip content="Sniper Holding">
                  <div className="spectra-holding-item">
                    <svg
                      className="spectra-sniper-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={
                        (token.sniperHolding || 0) > 20
                          ? '#eb7070ff'
                          : 'rgb(67, 254, 154)'
                      }
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 11.244141 2.0019531 L 11.244141 2.7519531 L 11.244141 3.1542969 C 6.9115518 3.5321749 3.524065 6.919829 3.1445312 11.251953 L 2.7421875 11.251953 L 1.9921875 11.251953 L 1.9921875 12.751953 L 2.7421875 12.751953 L 3.1445312 12.751953 C 3.5225907 17.085781 6.9110367 20.473593 11.244141 20.851562 L 11.244141 21.253906 L 11.244141 22.003906 L 12.744141 22.003906 L 12.744141 21.253906 L 12.744141 20.851562 C 17.076343 20.47195 20.463928 17.083895 20.841797 12.751953 L 21.244141 12.751953 L 21.994141 12.751953 L 21.994141 11.251953 L 21.244141 11.251953 L 20.841797 11.251953 C 20.462285 6.9209126 17.074458 3.5337191 12.744141 3.1542969 L 12.744141 2.7519531 L 12.744141 2.0019531 L 11.244141 2.0019531 z M 11.244141 4.6523438 L 11.244141 8.0742188 C 9.6430468 8.3817751 8.3759724 9.6507475 8.0683594 11.251953 L 4.6425781 11.251953 C 5.0091295 7.7343248 7.7260437 5.0173387 11.244141 4.6523438 z M 12.744141 4.6523438 C 16.25959 5.0189905 18.975147 7.7358303 19.341797 11.251953 L 15.917969 11.251953 C 15.610766 9.6510551 14.344012 8.3831177 12.744141 8.0742188 L 12.744141 4.6523438 z M 11.992188 9.4980469 C 13.371637 9.4980469 14.481489 10.6041 14.492188 11.982422 L 14.492188 12.021484 C 14.481501 13.40006 13.372858 14.503906 11.992188 14.503906 C 10.606048 14.503906 9.4921875 13.389599 9.4921875 12.001953 C 9.4921875 10.614029 10.60482 9.4980469 11.992188 9.4980469 z M 4.6425781 12.751953 L 8.0683594 12.751953 C 8.3760866 14.352973 9.6433875 15.620527 11.244141 15.927734 L 11.244141 19.353516 C 7.7258668 18.988181 5.0077831 16.270941 4.6425781 12.751953 z M 15.917969 12.751953 L 19.34375 12.751953 C 18.97855 16.26893 16.261295 18.986659 12.744141 19.353516 L 12.744141 15.927734 C 14.344596 15.619809 15.610176 14.35218 15.917969 12.751953 z" />
                    </svg>
                    <span
                      className="spectra-holding-value"
                      style={{
                        color:
                          (token.sniperHolding || 0) > 20
                            ? '#eb7070ff'
                            : 'rgb(67, 254, 154)',
                      }}
                    >
                      {(token.sniperHolding || 0).toFixed(1)}%
                    </span>
                  </div>
                </Tooltip>
              )}

              {displaySettings.visibleRows.insiders && (
                <Tooltip content="Insider Holding">
                  <div className="spectra-holding-item">
                    <svg
                      className="spectra-holding-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 32 32"
                      fill={
                        (token.insiderHolding || 0) > 5
                          ? '#eb7070ff'
                          : 'rgb(67, 254, 154)'
                      }
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 16 3 C 14.0625 3 12.570313 3.507813 11.5 4.34375 C 10.429688 5.179688 9.8125 6.304688 9.375 7.34375 C 8.9375 8.382813 8.65625 9.378906 8.375 10.09375 C 8.09375 10.808594 7.859375 11.085938 7.65625 11.15625 C 4.828125 12.160156 3 14.863281 3 18 L 3 19 L 4 19 C 5.347656 19 6.003906 19.28125 6.3125 19.53125 C 6.621094 19.78125 6.742188 20.066406 6.8125 20.5625 C 6.882813 21.058594 6.847656 21.664063 6.9375 22.34375 C 6.984375 22.683594 7.054688 23.066406 7.28125 23.4375 C 7.507813 23.808594 7.917969 24.128906 8.375 24.28125 C 9.433594 24.632813 10.113281 24.855469 10.53125 25.09375 C 10.949219 25.332031 11.199219 25.546875 11.53125 26.25 C 11.847656 26.917969 12.273438 27.648438 13.03125 28.1875 C 13.789063 28.726563 14.808594 29.015625 16.09375 29 C 18.195313 28.972656 19.449219 27.886719 20.09375 26.9375 C 20.417969 26.460938 20.644531 26.050781 20.84375 25.78125 C 21.042969 25.511719 21.164063 25.40625 21.375 25.34375 C 22.730469 24.9375 23.605469 24.25 24.09375 23.46875 C 24.582031 22.6875 24.675781 21.921875 24.8125 21.40625 C 24.949219 20.890625 25.046875 20.6875 25.375 20.46875 C 25.703125 20.25 26.453125 20 28 20 L 29 20 L 29 19 C 29 17.621094 29.046875 16.015625 28.4375 14.5 C 27.828125 12.984375 26.441406 11.644531 24.15625 11.125 C 24.132813 11.121094 24.105469 11.132813 24 11 C 23.894531 10.867188 23.734375 10.601563 23.59375 10.25 C 23.3125 9.550781 23.042969 8.527344 22.59375 7.46875 C 22.144531 6.410156 21.503906 5.269531 20.4375 4.40625 C 19.371094 3.542969 17.90625 3 16 3 Z M 16 5 C 17.539063 5 18.480469 5.394531 19.1875 5.96875 C 19.894531 6.542969 20.367188 7.347656 20.75 8.25 C 21.132813 9.152344 21.402344 10.128906 21.75 11 C 21.921875 11.433594 22.109375 11.839844 22.40625 12.21875 C 22.703125 12.597656 23.136719 12.96875 23.6875 13.09375 C 25.488281 13.503906 26.15625 14.242188 26.5625 15.25 C 26.871094 16.015625 26.878906 17.066406 26.90625 18.09375 C 25.796875 18.1875 24.886719 18.386719 24.25 18.8125 C 23.40625 19.378906 23.050781 20.25 22.875 20.90625 C 22.699219 21.5625 22.632813 22.042969 22.40625 22.40625 C 22.179688 22.769531 21.808594 23.128906 20.78125 23.4375 C 20.070313 23.652344 19.558594 24.140625 19.21875 24.59375 C 18.878906 25.046875 18.675781 25.460938 18.4375 25.8125 C 17.960938 26.515625 17.617188 26.980469 16.0625 27 C 15.078125 27.011719 14.550781 26.820313 14.1875 26.5625 C 13.824219 26.304688 13.558594 25.929688 13.3125 25.40625 C 12.867188 24.460938 12.269531 23.765625 11.53125 23.34375 C 10.792969 22.921875 10.023438 22.714844 9 22.375 C 8.992188 22.359375 8.933594 22.285156 8.90625 22.09375 C 8.855469 21.710938 8.886719 21.035156 8.78125 20.28125 C 8.675781 19.527344 8.367188 18.613281 7.5625 17.96875 C 7 17.515625 6.195313 17.289063 5.25 17.15625 C 5.542969 15.230469 6.554688 13.65625 8.3125 13.03125 C 9.375 12.65625 9.898438 11.730469 10.25 10.84375 C 10.601563 9.957031 10.851563 8.96875 11.21875 8.09375 C 11.585938 7.21875 12.019531 6.480469 12.71875 5.9375 C 13.417969 5.394531 14.402344 5 16 5 Z M 13 9 C 12.449219 9 12 9.671875 12 10.5 C 12 11.328125 12.449219 12 13 12 C 13.550781 12 14 11.328125 14 10.5 C 14 9.671875 13.550781 9 13 9 Z M 17 9 C 16.449219 9 16 9.671875 16 10.5 C 16 11.328125 16.449219 12 17 12 C 17.550781 12 18 11.328125 18 10.5 C 18 9.671875 17.550781 9 17 9 Z" />
                    </svg>
                    <span
                      className="spectra-holding-value"
                      style={{
                        color:
                          (token.insiderHolding || 0) > 5
                            ? '#eb7070ff'
                            : 'rgb(67, 254, 154)',
                      }}
                    >
                      {(token.insiderHolding || 0).toFixed(1)}%
                    </span>
                  </div>
                </Tooltip>
              )}
            </div>
          </div>

          {displaySettings.quickBuySize === 'ultra' &&
            displaySettings.secondQuickBuyEnabled && (
              <div
                className={`spectra-second-ultra-container ultra-${displaySettings.ultraStyle} ultra-text-${displaySettings.ultraColor} ${isLoadingSecondary ? 'disabled' : ''}`}
                style={
                  displaySettings.ultraStyle === 'border'
                    ? {
                      border: `1px solid ${displaySettings.secondQuickBuyColor}`,
                      boxShadow: `inset 0 0 0 1px ${displaySettings.secondQuickBuyColor}99`,
                    }
                    : undefined
                }
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLoadingSecondary) return;
                  handleQuickBuy(token, quickbuyAmountSecond, 'secondary');
                }}
              >
                <div className="spectra-actions-section">
                  <button
                    className={`spectra-quick-buy-btn size-ultra ultra-${displaySettings.ultraStyle} ultra-text-${displaySettings.ultraColor}`}
                    style={{ color: displaySettings.secondQuickBuyColor }}
                    disabled={isLoadingSecondary}
                  >
                    {isLoadingSecondary ? (
                      <div
                        style={{
                          border: `1.5px solid ${displaySettings.secondQuickBuyColor}`,
                          borderTop: `1.5px solid transparent`,
                        }}
                        className="ultra-quickbuy-loading-spinner"
                      />
                    ) : (
                      <>
                        <svg
                          fill={displaySettings.secondQuickBuyColor}
                          className="second-ultra-quickbuy-icon"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 72 72"
                          width="64px"
                          height="64px"
                        >
                          <path d="M30.992,60.145c-0.599,0.753-1.25,1.126-1.952,1.117c-0.702-0.009-1.245-0.295-1.631-0.86	c-0.385-0.565-0.415-1.318-0.09-2.26l5.752-16.435H20.977c-0.565,0-1.036-0.175-1.412-0.526C19.188,40.83,19,40.38,19,39.833	c0-0.565,0.223-1.121,0.668-1.669l21.34-26.296c0.616-0.753,1.271-1.13,1.965-1.13s1.233,0.287,1.618,0.86	c0.385,0.574,0.415,1.331,0.09,2.273l-5.752,16.435h12.095c0.565,0,1.036,0.175,1.412,0.526C52.812,31.183,53,31.632,53,32.18	c0,0.565-0.223,1.121-0.668,1.669L30.992,60.145z" />
                        </svg>{' '}
                        {quickbuyAmountSecond} MON
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          <div
            className={`spectra-third-row metrics-size-${displaySettings.metricSize} ${displaySettings.quickBuySize === 'large' ? 'large-quickbuy-mode' : ''} ${displaySettings.quickBuySize === 'mega' ? 'mega-quickbuy-mode' : ''} ${displaySettings.quickBuySize === 'ultra' ? `ultra-quickbuy-mode ultra-${displaySettings.ultraStyle} ultra-text-${displaySettings.ultraColor}` : ''} ${displaySettings.quickBuySize === 'ultra' && displaySettings.secondQuickBuyEnabled ? 'ultra-dual-buttons' : ''} ${isLoadingPrimary ? 'disabled' : ''}`}
            onClick={(e) => {
              if (displaySettings.quickBuySize !== 'ultra') return;
              e.stopPropagation();
              if (isLoadingPrimary) return;
              handleQuickBuy(token, quickbuyAmount, 'primary');
            }}
          >
            <div className="spectra-metrics-container">
              {displaySettings.visibleRows.volume && (
                <Tooltip content="Volume">
                  <div className="spectra-volume">
                    <span className="spectra-mc-label">V</span>
                    <span className="spectra-mc-value">
                      {formatPrice(
                        (token.volume24h || 0) * monUsdPrice,
                        displaySettings.noDecimals,
                      )}
                    </span>
                  </div>
                </Tooltip>
              )}
              {displaySettings.visibleRows.marketCap && (
                <Tooltip content="Market Cap">
                  <div className="spectra-market-cap">
                    <span className="spectra-mc-label">MC</span>
                    <span className="spectra-mc-value">
                      {formatPrice(
                        (token.marketCap || 0) * monUsdPrice,
                        displaySettings.noDecimals,
                      )}
                    </span>
                  </div>
                </Tooltip>
              )}
            </div>

            <div className="spectra-third-row-section">
              {displaySettings.visibleRows.fees && (
                <Tooltip content="Global Fees Paid">
                  <div className="spectra-stat-item">
                    <span className="spectra-fee-label">F</span>
                    <span className="spectra-fee-total">
                      {formatPrice(
                        ((token.volume24h || 0) * monUsdPrice) / 100,
                        displaySettings.noDecimals,
                      )}
                    </span>
                  </div>
                </Tooltip>
              )}

              {displaySettings.visibleRows.tx && (
                <Tooltip content="Transactions">
                  <div className="spectra-tx-bar">
                    <div className="spectra-tx-header">
                      <span className="spectra-tx-label">TX</span>
                      <span className="spectra-tx-total">
                        {totalTransactions.toLocaleString()}
                      </span>
                    </div>
                    <div className="spectra-tx-visual-bar">
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
                            className="spectra-tx-buy-portion"
                            style={{ width: `${buyPct}%` }}
                          />
                          <div
                            className="spectra-tx-sell-portion"
                            style={{ width: `${sellPct}%` }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </Tooltip>
              )}
            </div>

            <div
              className={`spectra-actions-section ${displaySettings.quickBuySize === 'ultra' ? 'ultra-mode' : ''}`}
            >
              {displaySettings.secondQuickBuyEnabled &&
                displaySettings.quickBuySize !== 'ultra' && (
                  <button
                    className={`spectra-quick-buy-btn second-button size-${displaySettings.quickBuySize} style-${displaySettings.quickBuyStyle}`}
                    style={{
                      ['--second-quickbuy-color' as any]:
                        displaySettings.secondQuickBuyColor,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickBuy(token, quickbuyAmountSecond, 'secondary');
                    }}
                    disabled={isLoadingSecondary}
                  >
                    {isLoadingSecondary ? (
                      <div className="spectra-quickbuy-loading-spinner" />
                    ) : (
                      <>
                        <img
                          className="spectra-quick-buy-icon"
                          src={lightning}
                          alt="Quick Buy"
                        />
                        {quickbuyAmountSecond} MON
                      </>
                    )}
                  </button>
                )}

              {(() => {
                const sizeClass = `size-${displaySettings.quickBuySize}`;
                const modeClass =
                  displaySettings.quickBuySize !== 'ultra'
                    ? `style-${displaySettings.quickBuyStyle}`
                    : `ultra-${displaySettings.ultraStyle} ultra-text-${displaySettings.ultraColor}`;
                const buttonClass = `spectra-quick-buy-btn ${sizeClass} ${modeClass}`;

                return (
                  <button
                    className={buttonClass}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickBuy(token, quickbuyAmount, 'primary');
                    }}
                    disabled={isLoadingPrimary}
                  >
                    {isLoadingPrimary ? (
                      <div className="spectra-quickbuy-loading-spinner" />
                    ) : (
                      <>
                        <img
                          className="spectra-quick-buy-icon"
                          src={lightning}
                          alt="Quick Buy"
                        />
                        {quickbuyAmount} MON
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>

        {showBonding &&
          createPortal(
            <div
              className="bonding-amount-display visible"
              style={{
                position: 'absolute',
                top: `${bondingPopupPosition.top}px`,
                left: `${bondingPopupPosition.left}px`,
                color: getBondingColor(bondingPercentage),
                zIndex: 10000,
                pointerEvents: 'none',
              }}
            >
              BONDING: {bondingPercentage.toFixed(1)}%
            </div>,
            document.body,
          )}
      </>
    );
  };

const DisplayDropdown: React.FC<{
  settings: DisplaySettings;
  onSettingsChange: (settings: DisplaySettings) => void;
  quickAmountsSecond: Record<Token['status'], string>;
  setQuickAmountSecond: (status: Token['status'], value: string) => void;
  activePresetsSecond: Record<Token['status'], number>;
  setActivePresetSecond: (status: Token['status'], preset: number) => void;
}> = ({
  settings,
  onSettingsChange,
  quickAmountsSecond,
  setQuickAmountSecond,
  activePresetsSecond,
  setActivePresetSecond,
}) => {
    const [showSecondButtonColorPicker, setShowSecondButtonColorPicker] =
      useState(false);
    const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
    const [showMetricColorPicker, setShowMetricColorPicker] = useState(false);
    const [metricPickerPosition, setMetricPickerPosition] = useState({
      top: 0,
      left: 0,
    });
    const [hexInputValue, setHexInputValue] = useState(
      settings.secondQuickBuyColor.replace('#', '').toUpperCase(),
    );

    useEffect(() => {
      setHexInputValue(
        settings.secondQuickBuyColor.replace('#', '').toUpperCase(),
      );
    }, [settings.secondQuickBuyColor]);

    const [activeMetricPicker, setActiveMetricPicker] = useState<{
      metric: 'marketCap' | 'volume' | 'holders';
      range: 'range1' | 'range2' | 'range3';
    } | null>(null);

    const handleColorPickerClick = (event: React.MouseEvent) => {
      event.stopPropagation();

      if (showSecondButtonColorPicker) {
        setShowSecondButtonColorPicker(false);
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
      setShowSecondButtonColorPicker(true);
    };

    const handleMetricColorPickerClick = (
      event: React.MouseEvent,
      metric: 'marketCap' | 'volume' | 'holders',
      range: 'range1' | 'range2' | 'range3',
    ) => {
      event.stopPropagation();

      if (
        showMetricColorPicker &&
        activeMetricPicker?.metric === metric &&
        activeMetricPicker?.range === range
      ) {
        setShowMetricColorPicker(false);
        setActiveMetricPicker(null);
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

      setMetricPickerPosition({ top, left });
      setActiveMetricPicker({ metric, range });
      setShowMetricColorPicker(true);
    };

    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<
      'layout' | 'metrics' | 'row' | 'extras'
    >('layout');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const safeOrder: Array<ColumnKey> =
      Array.isArray(settings?.columnOrder) && settings.columnOrder.length
        ? settings.columnOrder
        : (['new', 'graduating', 'graduated'] as Array<ColumnKey>);

    const handleToggle = useCallback(() => {
      if (isOpen) {
        setIsVisible(false);
        setTimeout(() => {
          setIsOpen(false);
        }, 200);
      } else {
        setIsOpen(true);
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      }
    }, [isOpen]);

    const handleDragStart = (e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex) return;

      const newOrder = [...safeOrder];
      const draggedItem = newOrder[draggedIndex];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(dropIndex, 0, draggedItem);

      onSettingsChange({ ...settings, columnOrder: newOrder });
      setDraggedIndex(null);
      setDragOverIndex(null);
    };

    const handleDragEnd = () => {
      setDraggedIndex(null);
      setDragOverIndex(null);
    };

    const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnKey>>(
      () => new Set(settings.hiddenColumns || []),
    );

    const handleHide = (e: React.MouseEvent, column: ColumnKey) => {
      e.preventDefault();
      e.stopPropagation();
      const newHidden = new Set(hiddenColumns);
      if (newHidden.has(column)) {
        newHidden.delete(column);
      } else {
        newHidden.add(column);
      }
      setHiddenColumns(newHidden);
      onSettingsChange({ ...settings, hiddenColumns: Array.from(newHidden) });
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        if (dropdownRef.current && !dropdownRef.current.contains(target)) {
          if (isOpen) {
            setIsVisible(false);
            setTimeout(() => {
              setIsOpen(false);
            }, 200);
          }
        }

        if (showSecondButtonColorPicker) {
          if (
            !target.closest('.color-picker-dropdown') &&
            !target.closest('.color-preview')
          ) {
            setShowSecondButtonColorPicker(false);
          }
        }

        if (showMetricColorPicker) {
          if (
            !target.closest('.metric-color-picker-dropdown') &&
            !target.closest('.metric-color-square')
          ) {
            setShowMetricColorPicker(false);
            setActiveMetricPicker(null);
          }
        }
      };

      if (isOpen || showSecondButtonColorPicker || showMetricColorPicker) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, showSecondButtonColorPicker, showMetricColorPicker]);

    const updateSetting = <K extends keyof DisplaySettings>(
      key: K,
      value: DisplaySettings[K],
    ) => onSettingsChange({ ...settings, [key]: value });

    const updateMetricColor = (
      metric: 'marketCap' | 'volume' | 'holders',
      range: 'range1' | 'range2' | 'range3',
      color: string,
    ) => {
      onSettingsChange({
        ...settings,
        metricColors: {
          ...settings.metricColors,
          [metric]: {
            ...settings.metricColors?.[metric],
            [range]: color,
          },
        },
      });
    };

    const updateRowSetting = (
      key: keyof DisplaySettings['visibleRows'],
      value: boolean,
    ) => {
      onSettingsChange({
        ...settings,
        visibleRows: { ...settings.visibleRows, [key]: value },
      });
    };

    return (
      <div className="display-dropdown" ref={dropdownRef}>
        <Tooltip content="Display Settings">
          <button
            className={`spectra-display-dropdown-trigger ${isOpen ? 'active' : ''}`}
            onClick={handleToggle}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="display-list-icon"><path d="M16 5H3" /><path d="M11 12H3" /><path d="M16 19H3" /><path d="M18 9v6" /><path d="M21 12h-6" /></svg>
            <ChevronDown
              size={16}
              className={`display-dropdown-arrow ${isOpen ? 'open' : ''}`}
              aria-hidden="true"
            />
          </button>
        </Tooltip>

        {isOpen && (
          <div
            className={`display-dropdown-content ${isVisible ? 'visible' : ''}`}
          >
            <div className="display-section">
              <h4 className="display-section-title">Metrics</h4>
              <div className="metrics-size-options">
                <button
                  className={`small-size-option ${settings.metricSize === 'small' ? 'active' : ''}`}
                  onClick={() => updateSetting('metricSize', 'small')}
                >
                  MC 123K
                  <br />
                  <span className="size-label">Small</span>
                </button>
                <button
                  className={`large-size-option ${settings.metricSize === 'large' ? 'active' : ''}`}
                  onClick={() => updateSetting('metricSize', 'large')}
                >
                  MC 123K
                  <br />
                  <span className="size-label">Large</span>
                </button>
              </div>
            </div>

            <div className="display-section">
              <h4 className="display-section-title">Quick Buy</h4>
              <div className="quickbuy-size-options">
                <button
                  className={`quickbuy-option ${settings.quickBuySize === 'small' ? 'active' : ''}`}
                  onClick={() => updateSetting('quickBuySize', 'small')}
                >
                  <div
                    className={`quickbuy-preview-button-small ${settings.quickBuyStyle === 'grey' ? 'grey-style' : ''}`}
                  >
                    <img
                      className="quickbuy-preview-button-lightning-small"
                      src={lightning}
                      alt=""
                    />
                    7
                  </div>
                  Small
                </button>
                <button
                  className={`quickbuy-option ${settings.quickBuySize === 'large' ? 'active' : ''}`}
                  onClick={() => updateSetting('quickBuySize', 'large')}
                >
                  <div
                    className={`quickbuy-preview-button-large ${settings.quickBuyStyle === 'grey' ? 'grey-style' : ''}`}
                  >
                    <img
                      className="quickbuy-preview-button-lightning-large"
                      src={lightning}
                      alt=""
                    />
                    7
                  </div>
                  Large
                </button>
                <button
                  className={`quickbuy-option ${settings.quickBuySize === 'mega' ? 'active' : ''}`}
                  onClick={() => updateSetting('quickBuySize', 'mega')}
                >
                  <div
                    className={`quickbuy-preview-button-mega ${settings.quickBuyStyle === 'grey' ? 'grey-style' : ''}`}
                  >
                    <img
                      className="quickbuy-preview-button-lightning-mega"
                      src={lightning}
                      alt=""
                    />
                    7
                  </div>
                  Mega
                </button>
                <button
                  className={`quickbuy-option ${settings.quickBuySize === 'ultra' ? 'active' : ''}`}
                  onClick={() => updateSetting('quickBuySize', 'ultra')}
                >
                  <div
                    className={`quickbuy-preview-button-ultra ultra-${settings.ultraStyle} ultra-text-${settings.ultraColor}`}
                  >
                    <img
                      className="quickbuy-preview-button-lightning-ultra"
                      src={lightning}
                      alt=""
                    />
                    7
                  </div>
                  Ultra
                </button>
              </div>

              {(settings.quickBuySize === 'small' ||
                settings.quickBuySize === 'large' ||
                settings.quickBuySize === 'mega') && (
                  <div className="quickbuy-style-toggles">
                    <div className="style-toggle-row">
                      <span className="style-toggle-label">Style</span>
                      <div className="style-toggle-buttons">
                        <button
                          className={`style-toggle-btn ${settings.quickBuyStyle === 'color' ? 'active' : ''}`}
                          onClick={() => updateSetting('quickBuyStyle', 'color')}
                        >
                          Color
                        </button>
                        <button
                          className={`style-toggle-btn ${settings.quickBuyStyle === 'grey' ? 'active' : ''}`}
                          onClick={() => updateSetting('quickBuyStyle', 'grey')}
                        >
                          Grey
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              {settings.quickBuySize === 'ultra' && (
                <div className="ultra-style-controls">
                  <div className="style-toggle-row">
                    <span className="style-toggle-label">Ultra Style:</span>
                    <div className="style-toggle-buttons">
                      <button
                        className={`style-toggle-btn ${settings.ultraStyle === 'default' ? 'active' : ''}`}
                        onClick={() => updateSetting('ultraStyle', 'default')}
                      >
                        Default
                      </button>
                      <button
                        className={`style-toggle-btn ${settings.ultraStyle === 'glowing' ? 'active' : ''}`}
                        onClick={() => updateSetting('ultraStyle', 'glowing')}
                      >
                        Glowing
                      </button>
                      <button
                        className={`style-toggle-btn ${settings.ultraStyle === 'border' ? 'active' : ''}`}
                        onClick={() => updateSetting('ultraStyle', 'border')}
                      >
                        Border
                      </button>
                    </div>
                  </div>
                  <div className="style-toggle-row">
                    <span className="style-toggle-label">Text Color:</span>
                    <div className="style-toggle-buttons">
                      <button
                        className={`style-toggle-btn ${settings.ultraColor === 'color' ? 'active' : ''}`}
                        onClick={() => updateSetting('ultraColor', 'color')}
                      >
                        Color
                      </button>
                      <button
                        className={`style-toggle-btn ${settings.ultraColor === 'grey' ? 'active' : ''}`}
                        onClick={() => updateSetting('ultraColor', 'grey')}
                      >
                        Grey
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="display-tabs">
              <button
                className={`display-tab ${activeTab === 'layout' ? 'active' : ''}`}
                onClick={() => setActiveTab('layout')}
              >
                Layout
              </button>
              <button
                className={`display-tab ${activeTab === 'metrics' ? 'active' : ''}`}
                onClick={() => setActiveTab('metrics')}
              >
                Metrics
              </button>
              <button
                className={`display-tab ${activeTab === 'row' ? 'active' : ''}`}
                onClick={() => setActiveTab('row')}
              >
                Row
              </button>
              <button
                className={`display-tab ${activeTab === 'extras' ? 'active' : ''}`}
                onClick={() => setActiveTab('extras')}
              >
                Extras
              </button>
            </div>

            <div className="display-content">
              {activeTab === 'layout' && (
                <div>
                  <div className="display-toggles">
                    <div className="toggle-item">
                      <label className="toggle-label">
                        <Hash size={16} />
                        No Decimals
                      </label>
                      <div
                        className={`toggle-switch ${settings.noDecimals ? 'active' : ''}`}
                        onClick={() =>
                          updateSetting('noDecimals', !settings.noDecimals)
                        }
                      >
                        <div className="toggle-slider" />
                      </div>
                    </div>

                    <div className="toggle-item">
                      <label className="toggle-label">
                        <EyeOff size={16} />
                        Hide Hidden Tokens
                      </label>
                      <div
                        className={`toggle-switch ${settings.hideHiddenTokens ? 'active' : ''}`}
                        onClick={() =>
                          updateSetting(
                            'hideHiddenTokens',
                            !settings.hideHiddenTokens,
                          )
                        }
                      >
                        <div className="toggle-slider" />
                      </div>
                    </div>

                    <div className="toggle-item">
                      <label className="toggle-label">
                        <Image size={16} />
                        Square Images
                      </label>
                      <div
                        className={`toggle-switch ${settings.squareImages ? 'active' : ''}`}
                        onClick={() =>
                          updateSetting('squareImages', !settings.squareImages)
                        }
                      >
                        <div className="toggle-slider" />
                      </div>
                    </div>

                    <div className="toggle-item">
                      <label className="toggle-label">
                        <BarChart3 size={16} />
                        Progress Ring
                      </label>
                      <div
                        className={`toggle-switch ${settings.progressBar ? 'active' : ''}`}
                        onClick={() =>
                          updateSetting('progressBar', !settings.progressBar)
                        }
                      >
                        <div className="toggle-slider" />
                      </div>
                    </div>
                  </div>

                  <div className="customize-section">
                    <h4 className="display-section-title">Customize rows</h4>
                    <div className="row-toggles">
                      {(
                        [
                          ['marketCap', 'Market Cap'],
                          ['volume', 'Volume'],
                          ['fees', 'Fees'],
                          ['tx', 'TX'],
                          ['socials', 'Socials'],
                          ['holders', 'Holders'],
                          ['proTraders', 'Pro Traders'],
                          ['devMigrations', 'Dev Migrations'],
                          ['top10Holders', 'Top 10 Holders'],
                          ['devHolding', 'Dev Holding'],
                          ['snipers', 'Snipers'],
                          ['insiders', 'Insiders'],
                        ] as Array<[keyof DisplaySettings['visibleRows'], string]>
                      ).map(([k, label]) => (
                        <div
                          key={k}
                          className={`row-toggle ${settings.visibleRows[k] ? 'active' : ''}`}
                          onClick={() =>
                            updateRowSetting(k, !settings.visibleRows[k])
                          }
                        >
                          <span className="row-toggle-label">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'metrics' && (
                <div>
                  {(['marketCap', 'volume', 'holders'] as const).map((metric) => (
                    <div className="metrics-display-section" key={metric}>
                      <h4 className="display-section-title">
                        {metric === 'marketCap'
                          ? 'Market Cap'
                          : metric === 'volume'
                            ? 'Volume'
                            : 'Holders'}
                      </h4>
                      <div className="metric-color-options">
                        {(['range1', 'range2', 'range3'] as const).map(
                          (range, idx) => (
                            <div className="metric-color-option" key={range}>
                              <div className="metric-color-item">
                                <div className="display-metric-value">
                                  {metric === 'marketCap'
                                    ? idx === 0
                                      ? '30000'
                                      : idx === 1
                                        ? '150000'
                                        : 'Above'
                                    : metric === 'volume'
                                      ? idx === 0
                                        ? '1000'
                                        : idx === 1
                                          ? '2000'
                                          : 'Above'
                                      : idx === 0
                                        ? '10'
                                        : idx === 1
                                          ? '50'
                                          : 'Above'}
                                </div>
                                <div className="metric-color-controls">
                                  <button
                                    className="metric-color-square"
                                    style={{
                                      backgroundColor:
                                        (settings.metricColors as any)?.[
                                        metric
                                        ]?.[range] || '#ffffff',
                                    }}
                                    onClick={(e) =>
                                      handleMetricColorPickerClick(
                                        e,
                                        metric,
                                        range,
                                      )
                                    }
                                  />
                                  <button
                                    className="metric-reset-btn"
                                    onClick={() =>
                                      updateMetricColor(
                                        metric,
                                        range,
                                        metric === 'marketCap'
                                          ? range === 'range1'
                                            ? '#d8dcff'
                                            : range === 'range2'
                                              ? '#eab308'
                                              : '#14b8a6'
                                          : '#ffffff',
                                      )
                                    }
                                  >
                                    <img
                                      src={reset}
                                      alt="Reset"
                                      className="reset-icon"
                                    />
                                  </button>
                                </div>
                              </div>
                              <div className="metric-range-label">
                                {metric === 'marketCap'
                                  ? idx === 0
                                    ? '0 - 30K'
                                    : idx === 1
                                      ? '30K - 150K'
                                      : '150K+'
                                  : metric === 'volume'
                                    ? idx === 0
                                      ? '0 - 1K'
                                      : idx === 1
                                        ? '1K - 2K'
                                        : '2K+'
                                    : idx === 0
                                      ? '0 - 10'
                                      : idx === 1
                                        ? '10 - 50'
                                        : '50+'}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'row' && (
                <div>
                  <div className="display-section">
                    <div className="display-toggles">
                      <div className="toggle-item">
                        <label className="toggle-label">
                          <BarChart3 size={16} />
                          Color Rows
                        </label>
                        <div
                          className={`toggle-switch ${settings.colorRows ? 'active' : ''}`}
                          onClick={() =>
                            updateSetting('colorRows', !settings.colorRows)
                          }
                        >
                          <div className="toggle-slider" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'extras' && (
                <div>
                  <div className="extras-display-section">
                    <h4 className="display-section-title">Table Layout</h4>
                    <div className="column-drag-container">
                      {safeOrder.map((column, index) => (
                        <div
                          key={column}
                          className={`column-drag-item ${hiddenColumns.has(column) ? 'column-hidden' : ''} ${dragOverIndex === index && draggedIndex !== index ? 'drag-over' : ''}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => handleHide(e, column)}
                        >
                          {column === 'new'
                            ? 'New Pairs'
                            : column === 'graduating'
                              ? 'Final Stretch'
                              : 'Migrated'}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="extras-display-section">
                    <h4 className="display-section-title">
                      Click Quick Buy Behavior
                    </h4>
                    <div className="quickbuy-behavior-options">
                      {(['nothing', 'openPage', 'openNewTab'] as const).map(
                        (mode) => (
                          <div
                            key={mode}
                            className={`behavior-option ${settings.quickBuyClickBehavior === mode ? 'active' : ''}`}
                            onClick={() =>
                              updateSetting('quickBuyClickBehavior', mode)
                            }
                          >
                            <span className="behavior-label">
                              {mode === 'nothing'
                                ? 'Nothing'
                                : mode === 'openPage'
                                  ? 'Open Page'
                                  : 'Open in New Tab'}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="extras-display-section">
                    <div className="toggle-item">
                      <label className="toggle-label">
                        Second Quick Buy Button
                      </label>
                      <div
                        className={`toggle-switch ${settings.secondQuickBuyEnabled ? 'active' : ''}`}
                        onClick={() =>
                          updateSetting(
                            'secondQuickBuyEnabled',
                            !settings.secondQuickBuyEnabled,
                          )
                        }
                      >
                        <div className="toggle-slider" />
                      </div>
                    </div>

                    {settings.secondQuickBuyEnabled && (
                      <div className="second-quickbuy-controls">
                        <div className="explorer-quickbuy-container-second">
                          <span className="explorer-second-quickbuy-label">
                            Quick Buy
                          </span>
                          <input
                            type="text"
                            placeholder="0.0"
                            value={quickAmountsSecond.new}
                            onChange={(e) => {
                              const value = e.target.value;
                              setQuickAmountSecond('new', value);
                              setQuickAmountSecond('graduating', value);
                              setQuickAmountSecond('graduated', value);
                            }}
                            className="explorer-quickbuy-input-second"
                          />
                          <img className="quickbuy-monad-icon" src={monadicon} />
                          <div className="explorer-preset-controls">
                            {[1, 2, 3].map((p) => (
                              <button
                                key={p}
                                className={`explorer-preset-pill-second ${activePresetsSecond.new === p ? 'active' : ''}`}
                                onClick={() => {
                                  setActivePresetSecond('new', p);
                                  setActivePresetSecond('graduating', p);
                                  setActivePresetSecond('graduated', p);
                                }}
                              >
                                P{p}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="color-input-row">
                          <div className="color-input-container">
                            <div
                              className="color-preview"
                              style={{
                                backgroundColor: settings.secondQuickBuyColor,
                              }}
                              onClick={handleColorPickerClick}
                            />
                            <input
                              type="text"
                              value={hexInputValue}
                              onChange={(e) => {
                                const value = e.target.value
                                  .replace(/[^0-9A-Fa-f]/g, '')
                                  .toUpperCase();
                                setHexInputValue(value);

                                if (value.length === 6) {
                                  updateSetting(
                                    'secondQuickBuyColor',
                                    `#${value}`,
                                  );
                                }
                              }}
                              onBlur={() => {
                                if (hexInputValue.length === 3) {
                                  const expanded = hexInputValue
                                    .split('')
                                    .map((c) => c + c)
                                    .join('');
                                  updateSetting(
                                    'secondQuickBuyColor',
                                    `#${expanded}`,
                                  );
                                  setHexInputValue(expanded);
                                } else if (hexInputValue.length !== 6) {
                                  setHexInputValue(
                                    settings.secondQuickBuyColor
                                      .replace('#', '')
                                      .toUpperCase(),
                                  );
                                }
                              }}
                              onFocus={(e) => e.target.select()}
                              className="quickbuy-hex-input"
                              placeholder="FFFFFF"
                              maxLength={6}
                            />
                            <button
                              className="refresh-button"
                              onClick={() =>
                                updateSetting('secondQuickBuyColor', '#aaaecf')
                              }
                              title="Reset to default"
                              type="button"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {showSecondButtonColorPicker && (
          <div
            className="color-picker-dropdown"
            style={{
              top: `${pickerPosition.top}px`,
              left: `${pickerPosition.left}px`,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <HexColorPicker
              color={settings.secondQuickBuyColor}
              onChange={(color) => updateSetting('secondQuickBuyColor', color)}
            />
            <div className="rgb-inputs">
              {['R', 'G', 'B'].map((channel, i) => {
                const currentColor = settings.secondQuickBuyColor;
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
                            : parseInt(
                              currentColor.slice(1 + idx * 2, 3 + idx * 2),
                              16,
                            ),
                        );
                        const newColor = `#${rgb
                          .map((c) => c.toString(16).padStart(2, '0'))
                          .join('')}`;
                        updateSetting('secondQuickBuyColor', newColor);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {showMetricColorPicker && activeMetricPicker && (
          <div
            className="color-picker-dropdown"
            style={{
              top: `${metricPickerPosition.top}px`,
              left: `${metricPickerPosition.left}px`,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <HexColorPicker
              color={
                (settings.metricColors as any)?.[activeMetricPicker.metric]?.[
                activeMetricPicker.range
                ] || '#ffffff'
              }
              onChange={(color) =>
                updateMetricColor(
                  activeMetricPicker.metric,
                  activeMetricPicker.range,
                  color,
                )
              }
            />
            <div className="rgb-inputs">
              {['R', 'G', 'B'].map((channel, i) => {
                const currentColor =
                  (settings.metricColors as any)?.[activeMetricPicker.metric]?.[
                  activeMetricPicker.range
                  ] || '#ffffff';
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
                            : parseInt(
                              currentColor.slice(1 + idx * 2, 3 + idx * 2),
                              16,
                            ),
                        );
                        const newColor = `#${rgb
                          .map((c) => c.toString(16).padStart(2, '0'))
                          .join('')}`;
                        updateMetricColor(
                          activeMetricPicker.metric,
                          activeMetricPicker.range,
                          newColor,
                        );
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

const SpectraWidget: React.FC<SpectraWidgetProps> = ({
  isOpen,
  onClose,
  onSnapChange,
  appliedFilters,
  onOpenFiltersForColumn,
  tokensByStatus = { new: [], graduating: [], graduated: [] },
  monUsdPrice = 1,
  routerAddress,
  sendUserOperationAsync,
  showLoadingPopup,
  updatePopup,
  setTokenData,
  selectedWallets = new Set(),
  subWallets = [],
  walletTokenBalances = {},
  activeWalletPrivateKey,
  tokenList = [],
  activechain = 0,
  nonces,
  account,
  terminalRefetch,
}) => {
  const navigate = useNavigate();
  const handleTokenClick = useCallback(
    (t: Token) => {
      setTokenData(t);
      navigate(`/meme/${t.tokenAddress}`);
    },
    [navigate],
  );
  const [quickAmountsSecond, setQuickAmountsSecond] = useState<
    Record<Token['status'], string>
  >(() => ({
    new: localStorage.getItem('spectra-quickbuy-second-new') ?? '1',
    graduating:
      localStorage.getItem('spectra-quickbuy-second-graduating') ?? '1',
    graduated:
      localStorage.getItem('spectra-quickbuy-second-graduated') ?? '1',
  }));

  const setQuickAmountSecond = useCallback((s: Token['status'], v: string) => {
    const clean = v.replace(/[^0-9.]/g, '');
    setQuickAmountsSecond((p) => ({ ...p, [s]: clean }));
    localStorage.setItem(`spectra-quickbuy-second-${s}`, clean);
  }, []);

  const setActivePresetSecond = useCallback(
    (status: Token['status'], preset: number) => {
      setActivePresetsSecond((p) => ({ ...p, [status]: preset }));
      localStorage.setItem(
        `spectra-preset-second-${status}`,
        preset.toString(),
      );
    },
    [],
  );

  const [activePresetsSecond, setActivePresetsSecond] = useState<
    Record<Token['status'], number>
  >(() => ({
    new: parseInt(localStorage.getItem('spectra-preset-second-new') ?? '1'),
    graduating: parseInt(
      localStorage.getItem('spectra-preset-second-graduating') ?? '1',
    ),
    graduated: parseInt(
      localStorage.getItem('spectra-preset-second-graduated') ?? '1',
    ),
  }));

  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(
    () => {
      const saved = localStorage.getItem('spectra-display-settings');
      if (!saved) return DISPLAY_DEFAULTS;
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DISPLAY_DEFAULTS,
          ...parsed,
          columnOrder:
            Array.isArray(parsed?.columnOrder) && parsed.columnOrder.length
              ? parsed.columnOrder
              : DISPLAY_DEFAULTS.columnOrder,
          hiddenColumns: Array.isArray(parsed?.hiddenColumns)
            ? parsed.hiddenColumns
            : [],
          visibleRows: {
            ...DISPLAY_DEFAULTS.visibleRows,
            ...(parsed?.visibleRows || {}),
          },
          metricColors: {
            marketCap: {
              ...DISPLAY_DEFAULTS.metricColors.marketCap,
              ...(parsed?.metricColors?.marketCap || {}),
            },
            volume: {
              ...DISPLAY_DEFAULTS.metricColors.volume,
              ...(parsed?.metricColors?.volume || {}),
            },
            holders: {
              ...DISPLAY_DEFAULTS.metricColors.holders,
              ...(parsed?.metricColors?.holders || {}),
            },
          },
        };
      } catch {
        return DISPLAY_DEFAULTS;
      }
    },
  );

  useEffect(() => {
    localStorage.setItem(
      'spectra-display-settings',
      JSON.stringify(displaySettings),
    );
  }, [displaySettings]);

  const widgetRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 480, height: 700 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [isSnapped, setIsSnapped] = useState<'left' | 'right' | null>(null);
  const [snapZoneHover, setSnapZoneHover] = useState<'left' | 'right' | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'graduating' | 'graduated'>('new');
  const [hiddenTokens, setHiddenTokens] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('spectra-hidden-tokens');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [blacklistedDevs, setBlacklistedDevs] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('spectra-blacklisted-devs');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [loadingTokens, setLoadingTokens] = useState<Set<string>>(new Set());
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);

  const [quickbuyAmounts, setQuickbuyAmounts] = useState<Record<'new' | 'graduating' | 'graduated', string>>(() => ({
    new: localStorage.getItem('spectra-quickbuy-new') ?? '1',
    graduating: localStorage.getItem('spectra-quickbuy-graduating') ?? '1',
    graduated: localStorage.getItem('spectra-quickbuy-graduated') ?? '1',
  }));
  const rafId = useRef<number | null>(null);
  const currentPosition = useRef(position);
  const currentSize = useRef(size);
  const isAnimating = useRef(false);

  useEffect(() => {
    currentPosition.current = position;
    currentSize.current = size;
  }, [position, size]);
  const [activePresets, setActivePresets] = useState<Record<'new' | 'graduating' | 'graduated', number>>(() => ({
    new: parseInt(localStorage.getItem('spectra-preset-new') ?? '1'),
    graduating: parseInt(localStorage.getItem('spectra-preset-graduating') ?? '1'),
    graduated: parseInt(localStorage.getItem('spectra-preset-graduated') ?? '1'),
  }));

  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const resizeStartPosition = useRef({ x: 0, y: 0 });
  const snapHoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const presnapState = useRef<{ position: { x: number; y: number }; size: { width: number; height: number } } | null>(null);

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        const txId = `copy-${Date.now()}`;
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
      }
    },
    [showLoadingPopup, updatePopup],
  );


  const handleDragStart = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Only drag if clicking directly on the draggable area
    // Check if we clicked on an interactive element
    const isInteractive = target.closest('button, input, select, a, svg, [role="button"]');

    if (isInteractive) {
      return; // Don't drag if clicking interactive elements
    }

    if (isSnapped && presnapState.current) {
      setIsSnapped(null);
      setPosition(presnapState.current.position);
      setSize(presnapState.current.size);
      dragStartPos.current = {
        x: e.clientX - presnapState.current.position.x,
        y: e.clientY - presnapState.current.position.y,
      };
      presnapState.current = null;
    } else {
      dragStartPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }

    setIsDragging(true);
    e.preventDefault(); // Prevent text selection
  }, [position, isSnapped]);


  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.stopPropagation();
      setIsResizing(true);
      setResizeDirection(direction);
      resizeStartPos.current = { x: e.clientX, y: e.clientY };
      resizeStartSize.current = { ...size };
      resizeStartPosition.current = { ...position };
    },
    [size, position]
  );

  useEffect(() => {
    if (onSnapChange) {
      onSnapChange(isSnapped, size.width);
    }
  }, [isSnapped, size.width, onSnapChange]);

  useEffect(() => {
    const handleWindowResize = () => {
      if (isSnapped) {
        if (isSnapped === 'left') {
          setPosition({ x: SIDEBAR_WIDTH, y: HEADER_HEIGHT });
          setSize(prev => ({
            width: Math.min(prev.width, window.innerWidth - SIDEBAR_WIDTH - 200),
            height: window.innerHeight - HEADER_HEIGHT
          }));
        } else if (isSnapped === 'right') {
          const maxWidth = window.innerWidth - SIDEBAR_WIDTH - 200;
          const newWidth = Math.min(size.width, maxWidth);
          setSize({
            width: newWidth,
            height: window.innerHeight - HEADER_HEIGHT
          });
          setPosition({
            x: window.innerWidth - newWidth,
            y: HEADER_HEIGHT
          });
        }
      } else {
        setPosition(prev => ({
          x: Math.max(SIDEBAR_WIDTH, Math.min(prev.x, window.innerWidth - size.width)),
          y: Math.max(HEADER_HEIGHT, Math.min(prev.y, window.innerHeight - size.height))
        }));
        setSize(prev => ({
          width: Math.min(prev.width, window.innerWidth - SIDEBAR_WIDTH),
          height: Math.min(prev.height, window.innerHeight - HEADER_HEIGHT)
        }));
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [isSnapped, size.width]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      // Cancel any pending animation frame
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      // Use RAF for smooth updates
      rafId.current = requestAnimationFrame(() => {
        if (isDragging) {
          let newX = e.clientX - dragStartPos.current.x;
          let newY = e.clientY - dragStartPos.current.y;

          const maxX = window.innerWidth - currentSize.current.width;
          const maxY = window.innerHeight - currentSize.current.height;

          newX = Math.max(SIDEBAR_WIDTH, Math.min(newX, maxX));
          newY = Math.max(HEADER_HEIGHT, Math.min(newY, maxY));

          currentPosition.current = { x: newX, y: newY };
          setPosition({ x: newX, y: newY });

          const distanceFromLeft = newX - SIDEBAR_WIDTH;
          const distanceFromRight = window.innerWidth - (newX + currentSize.current.width);

          if (distanceFromLeft <= SNAP_THRESHOLD) {
            if (!snapHoverTimeout.current) {
              setSnapZoneHover('left');
              snapHoverTimeout.current = setTimeout(() => {
                presnapState.current = {
                  position: { x: newX, y: newY },
                  size: currentSize.current
                };

                setIsSnapped('left');
                const snappedWidth = Math.min(
                  currentSize.current.width,
                  window.innerWidth - SIDEBAR_WIDTH - 200
                );
                setPosition({ x: SIDEBAR_WIDTH, y: HEADER_HEIGHT });
                setSize({ width: snappedWidth, height: window.innerHeight - HEADER_HEIGHT });
                currentPosition.current = { x: SIDEBAR_WIDTH, y: HEADER_HEIGHT };
                currentSize.current = { width: snappedWidth, height: window.innerHeight - HEADER_HEIGHT };
                setSnapZoneHover(null);
                snapHoverTimeout.current = null;
              }, SNAP_HOVER_TIME);
            }
          } else if (distanceFromRight <= SNAP_THRESHOLD) {
            if (!snapHoverTimeout.current) {
              setSnapZoneHover('right');
              snapHoverTimeout.current = setTimeout(() => {
                presnapState.current = {
                  position: { x: newX, y: newY },
                  size: currentSize.current
                };

                setIsSnapped('right');
                const snappedWidth = Math.min(
                  currentSize.current.width,
                  window.innerWidth - SIDEBAR_WIDTH - 200
                );
                const newPos = {
                  x: window.innerWidth - snappedWidth,
                  y: HEADER_HEIGHT
                };
                const newSz = {
                  width: snappedWidth,
                  height: window.innerHeight - HEADER_HEIGHT
                };
                setPosition(newPos);
                setSize(newSz);
                currentPosition.current = newPos;
                currentSize.current = newSz;
                setSnapZoneHover(null);
                snapHoverTimeout.current = null;
              }, SNAP_HOVER_TIME);
            }
          } else {
            if (snapHoverTimeout.current) {
              clearTimeout(snapHoverTimeout.current);
              snapHoverTimeout.current = null;
            }
            setSnapZoneHover(null);
          }
        } else if (isResizing) {
          const deltaX = e.clientX - resizeStartPos.current.x;
          const deltaY = e.clientY - resizeStartPos.current.y;

          let newWidth = resizeStartSize.current.width;
          let newHeight = resizeStartSize.current.height;
          let newX = resizeStartPosition.current.x;
          let newY = resizeStartPosition.current.y;

          if (isSnapped === 'left' && resizeDirection === 'right') {
            newWidth = Math.max(
              200,
              Math.min(
                resizeStartSize.current.width + deltaX,
                window.innerWidth - SIDEBAR_WIDTH
              )
            );
          } else if (isSnapped === 'right' && resizeDirection === 'left') {
            newWidth = Math.max(
              200,
              Math.min(
                resizeStartSize.current.width - deltaX,
                window.innerWidth
              )
            );
            newX = window.innerWidth - newWidth;
          } else if (!isSnapped) {
            if (resizeDirection.includes('right')) {
              newWidth = Math.max(
                200,
                Math.min(
                  resizeStartSize.current.width + deltaX,
                  window.innerWidth - newX
                )
              );
            }
            if (resizeDirection.includes('left')) {
              const maxWidthIncrease = newX - SIDEBAR_WIDTH;
              newWidth = Math.max(
                200,
                Math.min(
                  resizeStartSize.current.width - deltaX,
                  resizeStartSize.current.width + maxWidthIncrease
                )
              );
              if (newWidth > 200) {
                newX = Math.max(SIDEBAR_WIDTH, resizeStartPosition.current.x + deltaX);
              }
            }
            if (resizeDirection.includes('bottom')) {
              newHeight = Math.max(
                150,
                Math.min(
                  resizeStartSize.current.height + deltaY,
                  window.innerHeight - newY
                )
              );
            }
            if (resizeDirection.includes('top')) {
              const maxHeightIncrease = newY - HEADER_HEIGHT;
              newHeight = Math.max(
                150,
                Math.min(
                  resizeStartSize.current.height - deltaY,
                  resizeStartSize.current.height + maxHeightIncrease
                )
              );
              if (newHeight > 150) {
                newY = Math.max(HEADER_HEIGHT, resizeStartPosition.current.y + deltaY);
              }
            }
          }

          currentSize.current = { width: newWidth, height: newHeight };
          currentPosition.current = { x: newX, y: newY };
          setSize({ width: newWidth, height: newHeight });
          setPosition({ x: newX, y: newY });
        }
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }

      if (snapHoverTimeout.current) {
        clearTimeout(snapHoverTimeout.current);
        snapHoverTimeout.current = null;
      }
      setSnapZoneHover(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
        }
      };
    }
  }, [isDragging, isResizing, resizeDirection, isSnapped]);

  useEffect(() => {
    localStorage.setItem('spectra-hidden-tokens', JSON.stringify(Array.from(hiddenTokens)));
  }, [hiddenTokens]);

  useEffect(() => {
    localStorage.setItem('spectra-blacklisted-devs', JSON.stringify(Array.from(blacklistedDevs)));
  }, [blacklistedDevs]);

  const handleImageHover = useCallback((tokenId: string) => {
    setHoveredImage(tokenId);
  }, []);

  const handleImageLeave = useCallback(() => {
    setHoveredImage(null);
  }, []);

  const handleTokenHover = useCallback((tokenId: string) => {
    setHoveredToken(tokenId);
  }, []);

  const handleTokenLeave = useCallback(() => {
    setHoveredToken(null);
  }, []);

  const handleHideToken = useCallback((tokenId: string) => {
    setHiddenTokens((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        newSet.add(tokenId);
      }
      return newSet;
    });
  }, []);

  const handleBlacklistDev = useCallback((token: any) => {
    const devAddress = token.dev?.toLowerCase();
    if (!devAddress) return;

    setBlacklistedDevs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(devAddress)) {
        newSet.delete(devAddress);
      } else {
        newSet.add(devAddress);
        setHiddenTokens((hiddenPrev) => {
          const newHiddenSet = new Set(hiddenPrev);
          newHiddenSet.add(token.id || token.tokenAddress);
          return newHiddenSet;
        });
      }
      return newSet;
    });
  }, []);

  const setQuickAmount = useCallback((status: 'new' | 'graduating' | 'graduated', value: string) => {
    const clean = value.replace(/[^0-9.]/g, '');
    setQuickbuyAmounts((prev) => ({ ...prev, [status]: clean }));
    localStorage.setItem(`spectra-quickbuy-${status}`, clean);
  }, []);

  const setActivePreset = useCallback((status: 'new' | 'graduating' | 'graduated', preset: number) => {
    setActivePresets((prev) => ({ ...prev, [status]: preset }));
    localStorage.setItem(`spectra-preset-${status}`, preset.toString());
  }, []);

  const getMaxSpendableWei = useCallback(
    (addr: string): bigint => {
      const balances = walletTokenBalances[addr];
      if (!balances) return 0n;

      const ethToken = tokenList.find(
        (t) => t.address === settings.chainConfig[activechain]?.eth,
      );
      if (!ethToken || !balances[ethToken.address]) return 0n;

      let raw = balances[ethToken.address];
      if (raw <= 0n) return 0n;

      const gasReserve = BigInt(settings.chainConfig[activechain]?.gasamount ?? 0);
      const safe = raw > gasReserve ? raw - gasReserve : 0n;

      return safe;
    },
    [walletTokenBalances, tokenList, activechain],
  );

  // Replace the entire handleQuickBuy function with this:
  const handleQuickBuy = useCallback(
    async (token: any, amount: string, buttonType: 'primary' | 'secondary') => {
      const val = BigInt(amount || '0') * 10n ** 18n;
      if (val === 0n) return;

      const targets: string[] = Array.from(selectedWallets);
      const txId = `spectra-quickbuy-batch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const tokenId = token.id || token.tokenAddress;

      setLoadingTokens((prev) => new Set(prev).add(`${tokenId}-${buttonType}`));

      try {
        if (showLoadingPopup) {
          showLoadingPopup(txId, {
            title: 'Sending batch buy...',
            subtitle: `Buying ${amount} MON of ${token.symbol} across ${targets.length} wallet${targets.length > 1 ? 's' : ''}`,
            amount: amount,
            amountUnit: 'MON',
            tokenImage: token.image,
          });
        }

        // Build distribution plan with redistribution
        let remaining = val;
        const plan: { addr: string; amount: bigint }[] = [];
        const transferPromises = [];

        if (targets.length > 0) {
          // First pass: allocate fair share capped by wallet balance
          for (const addr of targets) {
            const maxWei = getMaxSpendableWei(addr);
            const fairShare = val / BigInt(targets.length);
            const allocation = fairShare > maxWei ? maxWei : fairShare;
            if (allocation > 0n) {
              plan.push({ addr, amount: allocation });
              remaining -= allocation;
            } else {
              plan.push({ addr, amount: 0n });
            }
          }

          // Second pass: redistribute remaining among wallets with spare balance
          for (const entry of plan) {
            if (remaining <= 0n) break;
            const maxWei = getMaxSpendableWei(entry.addr);
            const room = maxWei - entry.amount;
            if (room > 0n) {
              const add = remaining > room ? room : remaining;
              entry.amount += add;
              remaining -= add;
            }
          }

          if (remaining > 0n) {
            if (updatePopup) {
              updatePopup(txId, {
                title: 'Batch buy failed',
                subtitle: 'Not enough MON balance across selected wallets',
                variant: 'error',
                isLoading: false,
              });
            }
            setLoadingTokens((prev) => {
              const newSet = new Set(prev);
              newSet.delete(`${tokenId}-${buttonType}`);
              return newSet;
            });
            return;
          }

          // Execute transfers
          for (const { addr, amount: partWei } of plan) {
            if (partWei <= 0n) continue;

            const wally = subWallets.find((w) => w.address === addr);
            const pk = wally?.privateKey ?? activeWalletPrivateKey;
            if (!pk) continue;

            const uo = {
              target: routerAddress as `0x${string}`,
              data: encodeFunctionData({
                abi: CrystalRouterAbi,
                functionName: 'buy',
                args: [true, token.tokenAddress as `0x${string}`, partWei, 0n],
              }),
              value: partWei,
            };

            const wallet = nonces.current.get(addr);
            const params = [{ uo }, 0n, 0n, false, pk, wallet?.nonce];
            if (wallet) wallet.nonce += 1;
            wallet?.pendingtxs.push(params);

            const transferPromise = sendUserOperationAsync(...params)
              .then(() => {
                if (wallet)
                  wallet.pendingtxs = wallet.pendingtxs.filter(
                    (p: any) => p[5] != params[5],
                  );
                return true;
              })
              .catch(() => {
                if (wallet)
                  wallet.pendingtxs = wallet.pendingtxs.filter(
                    (p: any) => p[5] != params[5],
                  );
                return false;
              });
            transferPromises.push(transferPromise);
          }
        } else {
          if (account?.address) {
            const uo = {
              target: routerAddress as `0x${string}`,
              data: encodeFunctionData({
                abi: CrystalRouterAbi,
                functionName: 'buy',
                args: [true, token.tokenAddress as `0x${string}`, val, 0n],
              }),
              value: val,
            };
            const transferPromise = sendUserOperationAsync({ uo });
            transferPromises.push(transferPromise);
          }
        }

        const results = await Promise.allSettled(transferPromises);
        const successfulTransfers = results.filter(
          (result) => result.status === 'fulfilled' && result.value === true,
        ).length;

        if (terminalRefetch) {
          terminalRefetch();
        }

        if (updatePopup) {
          updatePopup(txId, {
            title: `Bought ${amount} MON Worth`,
            subtitle: `Distributed across ${successfulTransfers} wallet${successfulTransfers !== 1 ? 's' : ''}`,
            variant: 'success',
            confirmed: true,
            isLoading: false,
            tokenImage: token.image,
          });
        }
      } catch (e: any) {
        console.error('Quick buy failed', e);
        const msg = String(e?.message ?? '');
        if (updatePopup) {
          updatePopup(txId, {
            title: msg.toLowerCase().includes('insufficient')
              ? 'Insufficient Balance'
              : 'Buy Failed',
            subtitle: msg || 'Transaction failed',
            variant: 'error',
            confirmed: true,
            isLoading: false,
            tokenImage: token.image,
          });
        }
      } finally {
        setLoadingTokens((prev) => {
          const newSet = new Set(prev);
          newSet.delete(`${tokenId}-${buttonType}`);
          return newSet;
        });
      }
    },
    [
      routerAddress,
      sendUserOperationAsync,
      selectedWallets,
      subWallets,
      activeWalletPrivateKey,
      getMaxSpendableWei,
      account,
      nonces,
      terminalRefetch,
      showLoadingPopup,
      updatePopup,
    ],
  );

  if (!isOpen) return null;

  return (
    <>
      {snapZoneHover && (
        <>
          <div className={`spectra-snap-zone-overlay left ${snapZoneHover === 'left' ? 'active' : ''}`} />
          <div className={`spectra-snap-zone-overlay right ${snapZoneHover === 'right' ? 'active' : ''}`} />
        </>
      )}

      <div
        ref={widgetRef}
        className={`spectra-widget ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isSnapped ? `snapped snapped-${isSnapped}` : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height - 35}px`,
        }}
      >
        <div className="spectra-widget-header">
          <div className="spectra-filters-header" onMouseDown={handleDragStart}>
            <div className="spectra-status-tabs">
              <button
                className={`spectra-status-tab ${activeTab === 'new' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('new');
                }}
              >
                New
              </button>
              <button
                className={`spectra-status-tab ${activeTab === 'graduating' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('graduating');
                }}
              >
                Final Stretch
              </button>
              <button
                className={`spectra-status-tab ${activeTab === 'graduated' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('graduated');
                }}
              >
                Graduated
              </button>
            </div>

            <div className="spectra-widget-header-right">
              <div className="spectra-column-title-right">
                <div className="spectra-filters-button-wrapper">
                  <DisplayDropdown
                    settings={displaySettings}
                    onSettingsChange={setDisplaySettings}
                    quickAmountsSecond={quickAmountsSecond}
                    setQuickAmountSecond={setQuickAmountSecond}
                    activePresetsSecond={activePresetsSecond}
                    setActivePresetSecond={setActivePresetSecond}
                  />
                </div>
              </div>
              <div className="spectra-divider" />
              <Tooltip content="Open Spectra in a new tab">
                <button
                  className="spectra-open-new-tab-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`${window.location.origin}/spectra`, '_blank');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="link-icon"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                </button>
              </Tooltip>
              <button className="spectra-filters-close-button" onClick={onClose}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className="quickbuy-drag-handle">
              <div className="circle-row">
                <img src={circle} className="circle" />
              </div>
            </div>
          </div>
          <div className="spectra-header-second-row">
            <div className="spectra-quickbuy-container">
              <img className="edit-spectra-quick-buy-icon" src={lightning} alt="" />
              <input
                type="text"
                placeholder="0.0"
                value={quickbuyAmounts[activeTab]}
                onChange={(e) => setQuickAmount(activeTab, e.target.value)}
                className="spectra-quickbuy-input"
              />
              <img className="spectra-monad-icon" src={monadicon} alt="MON" />
              <div className="spectra-preset-controls">
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    className={`spectra-preset-pill ${activePresets[activeTab] === p ? 'active' : ''}`}
                    onClick={() => setActivePreset(activeTab, p)}
                  >
                    P{p}
                  </button>
                ))}
              </div>
            </div>
            <div className="spectra-second-row-right">
              <input
                type="text"
                className="spectra-token-search"
                placeholder="Search by ticker or name"
              />
              <Tooltip content="Filters">
                <button
                  className={`column-filter-icon ${appliedFilters?.new ? 'active' : ''}`}
                  onClick={() => onOpenFiltersForColumn('new')}
                  title="filter new pairs"
                >
                  <img className="filter-icon" src={filter} />
                  {appliedFilters?.new && (
                    <span className="filter-active-dot" />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="spectra-widget-content">
          <div className="spectra-markets-container">
            {tokensByStatus[activeTab] && tokensByStatus[activeTab].length > 0 ? (
              tokensByStatus[activeTab]
                .filter((token: any) => {
                  const tokenId = token.id || token.tokenAddress;
                  const devAddress = token.dev?.toLowerCase();
                  if (displaySettings.hideHiddenTokens) {
                    return !hiddenTokens.has(tokenId) && (!devAddress || !blacklistedDevs.has(devAddress));
                  }
                  return true;
                })
                .map((token: any, idx: number) => (
                  <TokenCard
                    key={token.id || token.tokenAddress || idx}
                    token={token}
                    idx={idx}
                    hiddenTokens={hiddenTokens}
                    blacklistedDevs={blacklistedDevs}
                    loadingTokens={loadingTokens}
                    quickbuyAmount={quickbuyAmounts[activeTab]}
                    quickbuyAmountSecond={quickAmountsSecond[activeTab]}
                    isLoadingPrimary={loadingTokens.has(`${token.id || token.tokenAddress}-primary`)}
                    isLoadingSecondary={loadingTokens.has(`${token.id || token.tokenAddress}-secondary`)}
                    monUsdPrice={monUsdPrice}
                    handleHideToken={handleHideToken}
                    handleBlacklistDev={handleBlacklistDev}
                    handleQuickBuy={handleQuickBuy}
                    hoveredImage={hoveredImage}
                    hoveredToken={hoveredToken}
                    onImageHover={handleImageHover}
                    onImageLeave={handleImageLeave}
                    onTokenHover={handleTokenHover}
                    onTokenLeave={handleTokenLeave}
                    displaySettings={displaySettings}
                    onCopyToClipboard={copyToClipboard}
                    isBlacklisted={(token as any).isBlacklisted || false}
                    onBlacklistToken={handleBlacklistDev}
                    onTokenClick={handleTokenClick}
                  />
                ))
            ) : (
              <div className="spectra-empty-state">
                <p>No tokens found</p>
              </div>
            )}
          </div>
        </div>

        {!isSnapped && (
          <>
            <div className="spectra-resize-handle top-left" onMouseDown={(e) => handleResizeStart(e, 'top-left')} />
            <div className="spectra-resize-handle top-right" onMouseDown={(e) => handleResizeStart(e, 'top-right')} />
            <div className="spectra-resize-handle bottom-left" onMouseDown={(e) => handleResizeStart(e, 'bottom-left')} />
            <div className="spectra-resize-handle bottom-right" onMouseDown={(e) => handleResizeStart(e, 'bottom-right')} />
            <div className="spectra-resize-handle top" onMouseDown={(e) => handleResizeStart(e, 'top')} />
            <div className="spectra-resize-handle bottom" onMouseDown={(e) => handleResizeStart(e, 'bottom')} />
            <div className="spectra-resize-handle left" onMouseDown={(e) => handleResizeStart(e, 'left')} />
            <div className="spectra-resize-handle right" onMouseDown={(e) => handleResizeStart(e, 'right')} />
          </>
        )}

        {isSnapped === 'left' && (
          <div className="spectra-resize-handle right snapped-resize" onMouseDown={(e) => handleResizeStart(e, 'right')} />
        )}
        {isSnapped === 'right' && (
          <div className="spectra-resize-handle left snapped-resize" onMouseDown={(e) => handleResizeStart(e, 'left')} />
        )}
      </div>
    </>
  );
};

export default SpectraWidget;