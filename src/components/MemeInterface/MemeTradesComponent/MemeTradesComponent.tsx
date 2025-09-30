import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import filledcup from '../../../assets/filledcup.svg';
import filter from '../../../assets/filter.svg';
import filtercup from '../../../assets/filtercup.svg';
import monadlogo from '../../../assets/monadlogo.svg';
import switchicon from '../../../assets/switch.svg';
import TraderPortfolioPopup from './TraderPortfolioPopup/TraderPortfolioPopup';
import TransactionFiltersPopup from './TransactionFiltersPopup';

import {
  formatSubscript,
  FormattedNumber,
} from '../../../utils/memeFormatSubscript';

import './MemeTradesComponent.css';

const Tooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, children, position = 'top' }) => {
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
        top = rect.top + scrollY - tooltipRect.height - 10;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollY + 10;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - tooltipRect.width - 10;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + 10;
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
  }, [position]);

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
              top: `${tooltipPosition.top - 20}px`,
              left: `${tooltipPosition.left}px`,
              transform: `${
                position === 'top' || position === 'bottom'
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

export interface RawTrade {
  id: string;
  timestamp: number;
  isBuy: boolean;
  price: number;
  tokenAmount: number;
  nativeAmount: number;
  tokenAddress?: string;
  caller: string;
}

interface ViewTrade {
  id: string;
  timestamp: number;
  amountUSD: number;
  amountMON: number;
  mcUSD: number;
  priceUSD: number;
  trader: string;
  fullAddress: string;
  tags: ('sniper' | 'dev' | 'kol' | 'bundler' | 'insider' | 'topHolder')[];
  isTopHolder: boolean;
  isCurrentUser: boolean;
  isDev: boolean;
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

interface TransactionFilters {
  makerAddress: string;
  minUSD: string;
  maxUSD: string;
}

type AmountMode = 'USDC' | 'MON';
type MCMode = 'MC' | 'Price';

interface Props {
  trades: RawTrade[];
  tokenList?: any[];
  market?:
    | {
        baseAsset?: string;
        quoteAsset?: string;
        quoteAddress?: string;
      }
    | any;
  tradesByMarket?: any;
  markets?: any;
  tokendict?: any;
  usdc?: string;
  wethticker?: string;
  ethticker?: string;
  onMarketSelect?: (m: any) => void;
  setSendTokenIn?: (t: any) => void;
  setpopup?: (v: number) => void;
  holders?: Holder[];
  currentUserAddress?: string;
  isPaused?: boolean;
  backlogCount?: number;
  devAddress?: string;
  monUsdPrice: number;
  trackedAddresses?: string[];
  onFilterDev?: () => void;
  onFilterYou?: () => void;
  onClearTracked?: () => void;
  isLoadingTrades?: boolean;
  subWallets?: Array<{ address: string; privateKey: string }>;
}

export default function MemeTradesComponent({
  trades,
  tokenList = [],
  market,
  tradesByMarket,
  markets,
  usdc,
  wethticker,
  ethticker,
  onMarketSelect,
  setSendTokenIn,
  setpopup,
  holders = [],
  currentUserAddress,
  devAddress,
  monUsdPrice,
  trackedAddresses = [],
  onFilterDev,
  onFilterYou,
  onClearTracked,
  isLoadingTrades = false,
  subWallets = [],
}: Props) {
  const [amountMode, setAmountMode] = useState<AmountMode>('MON');
  const [mcMode, setMcMode] = useState<MCMode>('MC');
  const [hover, setHover] = useState(false);
  const [popupAddr, setPopupAddr] = useState<string | null>(null);
  const [displayTrades, setDisplayTrades] = useState<RawTrade[]>([]);
  const [showFiltersPopup, setShowFiltersPopup] = useState(false);
  const [transactionFilters, setTransactionFilters] =
    useState<TransactionFilters>({
      makerAddress: '',
      minUSD: '',
      maxUSD: '',
    });
  const tradesBacklogRef = useRef<RawTrade[]>([]);
  const lastProcessedTradesRef = useRef<RawTrade[]>([]);

  const norm = (s?: string) => (s || '').toLowerCase();
  const trackedSet = new Set((trackedAddresses || []).map(norm));
  const dev = norm(devAddress);
  const you = norm(currentUserAddress);
  const devEqualsYou = dev !== '' && dev === you;

  let devActive = false;
  let youActive = false;
  let trackedActive = false;

  if (trackedSet.size === 0) {
  } else if (trackedSet.size === 1) {
    const [only] = Array.from(trackedSet);
    if (devEqualsYou && only === dev) {
      youActive = true;
    } else if (only === you) {
      youActive = true;
    } else if (only === dev) {
      devActive = true;
    } else {
      trackedActive = true;
    }
  } else {
    trackedActive = true;
  }

  // Check if transaction filters are active
  const hasActiveFilters =
    transactionFilters.makerAddress.trim() !== '' ||
    transactionFilters.minUSD.trim() !== '' ||
    transactionFilters.maxUSD.trim() !== '';

  useEffect(() => {
    const newTrades = trades.slice(0, 100);

    if (hover) {
      const previousTrades = lastProcessedTradesRef.current;
      const reallyNewTrades = newTrades.filter(
        (newTrade) =>
          !previousTrades.some((oldTrade) => oldTrade.id === newTrade.id),
      );

      if (reallyNewTrades.length > 0) {
        tradesBacklogRef.current = [
          ...reallyNewTrades,
          ...tradesBacklogRef.current,
        ].slice(0, 50);
      }
    } else {
      if (tradesBacklogRef.current.length > 0) {
        const combined = [...tradesBacklogRef.current, ...newTrades];
        const uniqueTrades = combined
          .filter(
            (trade, index, arr) =>
              arr.findIndex((t) => t.id === trade.id) === index,
          )
          .slice(0, 40);

        setDisplayTrades(uniqueTrades);
        tradesBacklogRef.current = [];
      } else {
        setDisplayTrades(newTrades);
      }
      lastProcessedTradesRef.current = newTrades;
    }
  }, [trades, hover]);

  const top10HolderAddresses = useMemo(() => {
    return new Set(
      holders.slice(0, 10).map((holder) => holder.address.toLowerCase()),
    );
  }, [holders]);

  const resolveNative = useCallback(
    (symbol: string | undefined) => {
      if (!symbol) return '';
      if (symbol === wethticker) return ethticker ?? symbol;
      return symbol;
    },
    [wethticker, ethticker],
  );

  const usdPer = useCallback(
    (symbol?: string): number => {
      if (!symbol || !tradesByMarket || !markets) return 0;
      const sym = resolveNative(symbol);
      if (usdc && sym === 'USDC') return 1;
      const pair = `${sym}USDC`;
      const top = tradesByMarket[pair]?.[0]?.[3];
      const pf = Number(markets[pair]?.priceFactor) || 1;
      if (!top || !pf) return 0;
      return Number(top) / pf;
    },
    [tradesByMarket, markets, resolveNative, usdc],
  );

  const fetchLatestPriceInQuote = (tradesArr: RawTrade[]): number | null => {
    if (!tradesArr || tradesArr.length === 0) return null;
    const sorted = [...tradesArr].sort((a, b) => b.timestamp - a.timestamp);
    return sorted[0]?.price ?? null;
  };

  const viewTrades: ViewTrade[] = useMemo(() => {
    if (!displayTrades?.length) return [];

    const latestQuotePerBase = fetchLatestPriceInQuote(trades) ?? 0;
    const quoteUsd = usdPer(market?.quoteAsset);
    const monUsd =
      usdPer(ethticker || wethticker) || usdPer(wethticker || ethticker);

    let filteredTrades = displayTrades;

    // Apply transaction filters
    if (hasActiveFilters) {
      filteredTrades = displayTrades.filter((r) => {
        // Filter by maker address
        if (transactionFilters.makerAddress.trim() !== '') {
          const filterAddress = transactionFilters.makerAddress
            .toLowerCase()
            .trim();
          const callerAddress = r.caller.toLowerCase();
          if (!callerAddress.includes(filterAddress)) {
            return false;
          }
        }

        // Calculate USD amount for filtering
        let amountUSD = 0;
        const sign = r.isBuy ? 1 : -1;
        let amountMON = sign * (r.nativeAmount ?? 0);

        if (!amountMON) {
          const priceInQuote = r.price ?? latestQuotePerBase;
          if (
            market?.quoteAsset &&
            (market.quoteAsset === wethticker ||
              market.quoteAsset === ethticker)
          ) {
            amountMON = sign * (r.tokenAmount ?? 0) * priceInQuote;
          } else {
            if (monUsd > 0 && quoteUsd > 0) {
              const amountUSDfromToken =
                sign * (r.tokenAmount ?? 0) * priceInQuote * quoteUsd;
              amountMON = amountUSDfromToken / monUsd;
            } else {
              amountMON = 0;
            }
          }
        }

        amountUSD = monUsd > 0 ? Math.abs(amountMON) * monUsd : 0;

        // Filter by min USD
        if (transactionFilters.minUSD.trim() !== '') {
          const minUSD = parseFloat(transactionFilters.minUSD);
          if (!isNaN(minUSD) && amountUSD < minUSD) {
            return false;
          }
        }

        // Filter by max USD
        if (transactionFilters.maxUSD.trim() !== '') {
          const maxUSD = parseFloat(transactionFilters.maxUSD);
          if (!isNaN(maxUSD) && amountUSD > maxUSD) {
            return false;
          }
        }

        return true;
      });
    }

    return filteredTrades.map((r) => {
const callerLower = r.caller.toLowerCase();
const devAddressLower = devAddress?.toLowerCase();

const subWalletSet = new Set(
  (subWallets || []).map(w => w.address.toLowerCase())
);

const isCurrentUser =
  (currentUserAddress && callerLower === currentUserAddress.toLowerCase()) ||
  subWalletSet.has(callerLower);
      const isTopHolder = top10HolderAddresses.has(callerLower);
      const isDev = Boolean(devAddressLower && callerLower === devAddressLower);
      const sign = r.isBuy ? 1 : -1;

      let amountMON = sign * (r.nativeAmount ?? 0);

      if (!amountMON) {
        const priceInQuote = r.price ?? latestQuotePerBase;
        if (
          market?.quoteAsset &&
          (market.quoteAsset === wethticker || market.quoteAsset === ethticker)
        ) {
          amountMON = sign * (r.tokenAmount ?? 0) * priceInQuote;
        } else {
          if (monUsd > 0 && quoteUsd > 0) {
            const amountUSDfromToken =
              sign * (r.tokenAmount ?? 0) * priceInQuote * quoteUsd;
            amountMON = amountUSDfromToken / monUsd;
          } else {
            amountMON = 0;
          }
        }
      }

      const amountUSD = monUsd > 0 ? amountMON * monUsd : 0;
const short = isCurrentUser ? 'YOU' : r.caller.slice(2, 6);
      const tags: (
        | 'sniper'
        | 'dev'
        | 'kol'
        | 'bundler'
        | 'insider'
        | 'topHolder'
      )[] = [];
      if (isDev) {
        tags.push('dev');
      }
      if (isTopHolder) {
        tags.push('topHolder');
      }

      return {
        id: r.id,
        timestamp: r.timestamp,
        amountUSD,
        amountMON,
        mcUSD: r.price * monUsdPrice * 1_000_000_000,
        priceUSD: r.price * quoteUsd * monUsdPrice,
        trader: short,
        fullAddress: r.caller,
        tags,
        isTopHolder,
        isCurrentUser,
        isDev,
      };
    });
  }, [
    displayTrades,
    market?.quoteAsset,
    usdPer,
    ethticker,
    wethticker,
    currentUserAddress,
    top10HolderAddresses,
    devAddress,
    transactionFilters,
    hasActiveFilters,
  ]);

  const maxForMode = useMemo(() => {
    if (viewTrades.length === 0) return 0;
    if (amountMode === 'USDC') {
      return Math.max(...viewTrades.map((t) => Math.abs(t.amountUSD)));
    }
    return Math.max(...viewTrades.map((t) => Math.abs(t.amountMON)));
  }, [viewTrades, amountMode]);

  const getBarWidth = (amt: number): number => {
    if (maxForMode === 0) return 0;
    return (Math.abs(amt) / maxForMode) * 100;
  };

  const FormattedNumberDisplay = ({
    formatted,
  }: {
    formatted: FormattedNumber;
  }) => {
    if (formatted.type === 'simple') {
      return <span>{formatted.text}</span>;
    }
    return (
      <span>
        {formatted.beforeSubscript}
        <span className="subscript">{formatted.subscriptValue}</span>
        {formatted.afterSubscript}
      </span>
    );
  };
const fmtAmount = (v: number) => {
  const val = Math.abs(v);

  if (amountMode === 'USDC') {
    // >=$1k uses K/M/B/T; otherwise compact dollars
    return val >= 1_000 ? `$${formatKMBT(val, 2)}` : `$${val.toFixed(2)}`;
  }

  if (val >= 1_000) return formatKMBT(val, 2); 
  if (val >= 1) return val.toFixed(3);        
  if (val >= 0.01) return val.toFixed(4);      
  return val.toPrecision(3);                  
};
  const fmtTimeAgo = (ts: number) => {
    const now = Date.now() / 1000;
    const secondsAgo = Math.max(0, Math.floor(now - ts));

    if (secondsAgo < 60) return `${secondsAgo}s`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h`;
    return `${Math.floor(secondsAgo / 86400)}d`;
  };
const formatKMBT = (value: number, decimals: number = 2) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(decimals)}T`;
  if (abs >= 1e9)  return `${sign}${(abs / 1e9).toFixed(decimals)}B`;
  if (abs >= 1e6)  return `${sign}${(abs / 1e6).toFixed(decimals)}M`;
  if (abs >= 1e3)  return `${sign}${(abs / 1e3).toFixed(decimals)}K`;
  return `${sign}${abs.toFixed(8).replace(/\.?0+$/,'')}`;
};

  const handleApplyFilters = (filters: TransactionFilters) => {
    setTransactionFilters(filters);
  };

  const TopHolderIcon = () => (
    <svg
      className="meme-top-holder-icon"
      width="14"
      height="14"
      viewBox="0 0 32 32"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M 15 4 L 15 6 L 13 6 L 13 8 L 15 8 L 15 9.1875 C 14.011719 9.554688 13.25 10.433594 13.0625 11.5 C 12.277344 11.164063 11.40625 11 10.5 11 C 6.921875 11 4 13.921875 4 17.5 C 4 19.792969 5.199219 21.8125 7 22.96875 L 7 27 L 25 27 L 25 22.96875 C 26.800781 21.8125 28 19.792969 28 17.5 C 28 13.921875 25.078125 11 21.5 11 C 20.59375 11 19.722656 11.164063 18.9375 11.5 C 18.75 10.433594 17.988281 9.554688 17 9.1875 L 17 8 L 19 8 L 19 6 L 17 6 L 17 4 Z M 16 11 C 16.5625 11 17 11.4375 17 12 C 17 12.5625 16.5625 13 16 13 C 15.4375 13 15 12.5625 15 12 C 15 11.4375 15.4375 11 16 11 Z M 10.5 13 C 12.996094 13 15 15.003906 15 17.5 L 15 22 L 10.5 22 C 8.003906 22 6 19.996094 6 17.5 C 6 15.003906 8.003906 13 10.5 13 Z M 21.5 13 C 23.996094 13 26 15.003906 26 17.5 C 26 19.996094 23.996094 22 21.5 22 L 17 22 L 17 17.5 C 17 15.003906 19.003906 13 21.5 13 Z M 9 24 L 23 24 L 23 25 L 9 25 Z" />
    </svg>
  );

  const SniperIcon = () => (
    <svg
      className="meme-tag-icon sniper"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M 11.244141 2.0019531 L 11.244141 2.7519531 L 11.244141 3.1542969 C 6.9115518 3.5321749 3.524065 6.919829 3.1445312 11.251953 L 2.7421875 11.251953 L 1.9921875 11.251953 L 1.9921875 12.751953 L 2.7421875 12.751953 L 3.1445312 12.751953 C 3.5225907 17.085781 6.9110367 20.473593 11.244141 20.851562 L 11.244141 21.253906 L 11.244141 22.003906 L 12.744141 22.003906 L 12.744141 21.253906 L 12.744141 20.851562 C 17.076343 20.47195 20.463928 17.083895 20.841797 12.751953 L 21.244141 12.751953 L 21.994141 12.751953 L 21.994141 11.251953 L 21.244141 11.251953 L 20.841797 11.251953 C 20.462285 6.9209126 17.074458 3.5337191 12.744141 3.1542969 L 12.744141 2.7519531 L 12.744141 2.0019531 L 11.244141 2.0019531 z M 11.244141 4.6523438 L 11.244141 8.0742188 C 9.6430468 8.3817751 8.3759724 9.6507475 8.0683594 11.251953 L 4.6425781 11.251953 C 5.0091295 7.7343248 7.7260437 5.0173387 11.244141 4.6523438 z M 12.744141 4.6523438 C 16.25959 5.0189905 18.975147 7.7358303 19.341797 11.251953 L 15.917969 11.251953 C 15.610766 9.6510551 14.344012 8.3831177 12.744141 8.0742188 L 12.744141 4.6523438 z M 11.992188 9.4980469 C 13.371637 9.4980469 14.481489 10.6041 14.492188 11.982422 L 14.492188 12.021484 C 14.481501 13.40006 13.372858 14.503906 11.992188 14.503906 C 10.606048 14.503906 9.4921875 13.389599 9.4921875 12.001953 C 9.4921875 10.614029 10.60482 9.4980469 11.992188 9.4980469 z M 4.6425781 12.751953 L 8.0683594 12.751953 C 8.3760866 14.352973 9.6433875 15.620527 11.244141 15.927734 L 11.244141 19.353516 C 7.7258668 18.988181 5.0077831 16.270941 4.6425781 12.751953 z M 15.917969 12.751953 L 19.34375 12.751953 C 18.97855 16.26893 16.261295 18.986659 12.744141 19.353516 L 12.744141 15.927734 C 14.344596 15.619809 15.610176 14.35218 15.917969 12.751953 z" />
    </svg>
  );

  const DevIcon = () => (
    <svg
      className="meme-tag-icon dev"
      width="12"
      height="12"
      viewBox="0 0 30 30"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
    </svg>
  );

  const KolIcon = () => (
    <svg
      className="meme-tag-icon kol"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M 2 3 L 2 4 C 2 6.7666667 3.1395226 8.7620178 4.1679688 10.304688 C 5.1964149 11.847357 6 12.944444 6 14 L 8 14 C 8 13.983831 7.9962584 13.96922 7.9960938 13.953125 C 8.97458 16.166161 10 17 10 17 L 14 17 C 14 17 15.02542 16.166161 16.003906 13.953125 C 16.003742 13.96922 16 13.983831 16 14 L 18 14 C 18 12.944444 18.803585 11.847356 19.832031 10.304688 C 20.860477 8.7620178 22 6.7666667 22 4 L 22 3 L 2 3 z M 4.1914062 5 L 6.2734375 5 C 6.337283 7.4080712 6.6187571 9.3802374 7.0078125 10.974609 C 6.6365749 10.366787 6.2230927 9.7819045 5.8320312 9.1953125 C 5.0286664 7.9902652 4.4191868 6.6549795 4.1914062 5 z M 8.3027344 5 L 15.697266 5 L 15.697266 6 L 15.693359 6 C 15.380359 11.398 13.843047 14.041 13.123047 15 L 10.882812 15 C 10.142812 14.016 8.6176406 11.371 8.3066406 6 L 8.3027344 6 L 8.3027344 5 z M 17.726562 5 L 19.808594 5 C 19.580813 6.6549795 18.971334 7.9902652 18.167969 9.1953125 C 17.776907 9.7819045 17.363425 10.366787 16.992188 10.974609 C 17.381243 9.3802374 17.662717 7.4080712 17.726562 5 z M 7 19 L 7 21 L 17 21 L 17 19 L 7 19 z" />
    </svg>
  );

  const BundlerIcon = () => (
    <svg
      className="meme-tag-icon bundler"
      width="12"
      height="12"
      viewBox="0 0 128 128"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M117 68.26l-26-15a2 2 0 00-2 0l-26 15A2 2 0 0062 70v30a2 2 0 001 1.73l26 15a2 2 0 002 0l26-15a2 2 0 001-1.73V70A2 2 0 00117 68.26zm-27-11l22.46 13L90 82.7 68 70zM66 73.46L88 86.15v25.41L66 98.86zm26 38.1V86.18L114 74V98.85zM56 102.25l-16 8.82V86.72l17-10a2 2 0 10-2-3.44l-17 10L15.55 70.56 38 57.82l17 8.95a2 2 0 001.86-3.54l-18-9.46a2 2 0 00-1.92 0L11 68.53a2 2 0 00-1 1.74V99.73a2 2 0 001 1.74L37 116.2a2 2 0 002 0l19-10.46a2 2 0 10-1.92-3.5zm-42-28L36 86.74V111L14 98.56zM38 49a2 2 0 002-2V28.46L62 41.15V61a2 2 0 004 0V41.15L88 28.46V47a2 2 0 004 0V25a2 2 0 00-1-1.73l-26-15a2 2 0 00-2 0l-26 15A2 2 0 0036 25V47A2 2 0 0038 49zM64 12.31L86 25 64 37.69 42 25z" />
    </svg>
  );

  const InsiderIcon = () => (
    <svg
      className="meme-tag-icon insider"
      width="12"
      height="12"
      viewBox="0 0 32 32"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M 16 3 C 14.0625 3 12.570313 3.507813 11.5 4.34375 C 10.429688 5.179688 9.8125 6.304688 9.375 7.34375 C 8.9375 8.382813 8.65625 9.378906 8.375 10.09375 C 8.09375 10.808594 7.859375 11.085938 7.65625 11.15625 C 4.828125 12.160156 3 14.863281 3 18 L 3 19 L 4 19 C 5.347656 19 6.003906 19.28125 6.3125 19.53125 C 6.621094 19.78125 6.742188 20.066406 6.8125 20.5625 C 6.882813 21.058594 6.847656 21.664063 6.9375 22.34375 C 6.984375 22.683594 7.054688 23.066406 7.28125 23.4375 C 7.507813 23.808594 7.917969 24.128906 8.375 24.28125 C 9.433594 24.632813 10.113281 24.855469 10.53125 25.09375 C 10.949219 25.332031 11.199219 25.546875 11.53125 26.25 C 11.847656 26.917969 12.273438 27.648438 13.03125 28.1875 C 13.789063 28.726563 14.808594 29.015625 16.09375 29 C 18.195313 28.972656 19.449219 27.886719 20.09375 26.9375 C 20.417969 26.460938 20.644531 26.050781 20.84375 25.78125 C 21.042969 25.511719 21.164063 25.40625 21.375 25.34375 C 22.730469 24.9375 23.605469 24.25 24.09375 23.46875 C 24.582031 22.6875 24.675781 21.921875 24.8125 21.40625 C 24.949219 20.890625 25.046875 20.6875 25.375 20.46875 C 25.703125 20.25 26.453125 20 28 20 L 29 20 L 29 19 C 29 17.621094 29.046875 16.015625 28.4375 14.5 C 27.828125 12.984375 26.441406 11.644531 24.15625 11.125 C 24.132813 11.121094 24.105469 11.132813 24 11 C 23.894531 10.867188 23.734375 10.601563 23.59375 10.25 C 23.3125 9.550781 23.042969 8.527344 22.59375 7.46875 C 22.144531 6.410156 21.503906 5.269531 20.4375 4.40625 C 19.371094 3.542969 17.90625 3 16 3 Z M 16 5 C 17.539063 5 18.480469 5.394531 19.1875 5.96875 C 19.894531 6.542969 20.367188 7.347656 20.75 8.25 C 21.132813 9.152344 21.402344 10.128906 21.75 11 C 21.921875 11.433594 22.109375 11.839844 22.40625 12.21875 C 22.703125 12.597656 23.136719 12.96875 23.6875 13.09375 C 25.488281 13.503906 26.15625 14.242188 26.5625 15.25 C 26.871094 16.015625 26.878906 17.066406 26.90625 18.09375 C 25.796875 18.1875 24.886719 18.386719 24.25 18.8125 C 23.40625 19.378906 23.050781 20.25 22.875 20.90625 C 22.699219 21.5625 22.632813 22.042969 22.40625 22.40625 C 22.179688 22.769531 21.808594 23.128906 20.78125 23.4375 C 20.070313 23.652344 19.558594 24.140625 19.21875 24.59375 C 18.878906 25.046875 18.675781 25.460938 18.4375 25.8125 C 17.960938 26.515625 17.617188 26.980469 16.0625 27 C 15.078125 27.011719 14.550781 26.820313 14.1875 26.5625 C 13.824219 26.304688 13.558594 25.929688 13.3125 25.40625 C 12.867188 24.460938 12.269531 23.765625 11.53125 23.34375 C 10.792969 22.921875 10.023438 22.714844 9 22.375 C 8.992188 22.359375 8.933594 22.285156 8.90625 22.09375 C 8.855469 21.710938 8.886719 21.035156 8.78125 20.28125 C 8.675781 19.527344 8.367188 18.613281 7.5625 17.96875 C 7 17.515625 6.195313 17.289063 5.25 17.15625 C 5.542969 15.230469 6.554688 13.65625 8.3125 13.03125 C 9.375 12.65625 9.898438 11.730469 10.25 10.84375 C 10.601563 9.957031 10.851563 8.96875 11.21875 8.09375 C 11.585938 7.21875 12.019531 6.480469 12.71875 5.9375 C 13.417969 5.394531 14.402344 5 16 5 Z M 13 9 C 12.449219 9 12 9.671875 12 10.5 C 12 11.328125 12.449219 12 13 12 C 13.550781 12 14 11.328125 14 10.5 C 14 9.671875 13.550781 9 13 9 Z M 17 9 C 16.449219 9 16 9.671875 16 10.5 C 16 11.328125 16.449219 12 17 12 C 17.550781 12 18 11.328125 18 10.5 C 18 9.671875 17.550781 9 17 9 Z" />
    </svg>
  );

  const LoadingSkeleton = () => (
    <div className="meme-trades-loading">
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} className="meme-trade-skeleton">
          <div className="skeleton-bar"></div>
          <div className="skeleton-amount"></div>
          <div className="skeleton-mc"></div>
          <div className="skeleton-trader"></div>
          <div className="skeleton-age"></div>
        </div>
      ))}
    </div>
  );

  const handleFilterClick = (filterType: 'dev' | 'you' | 'tracked') => {
    switch (filterType) {
      case 'dev':
        if (devActive) {
          onClearTracked?.();
        } else {
          onFilterDev?.();
        }
        break;
      case 'you':
        if (youActive) {
          onClearTracked?.();
        } else {
          onFilterYou?.();
        }
        break;
      case 'tracked':
        onClearTracked?.();
        break;
    }
  };

  const renderTraderTags = (
    tags: ('sniper' | 'dev' | 'kol' | 'bundler' | 'insider' | 'topHolder')[],
  ) => {
    const tagComponents = {
      sniper: { icon: SniperIcon, tooltip: 'Sniper Trader' },
      dev: { icon: DevIcon, tooltip: 'Developer' },
      kol: { icon: KolIcon, tooltip: 'Key Opinion Leader' },
      bundler: { icon: BundlerIcon, tooltip: 'Bundler' },
      insider: { icon: InsiderIcon, tooltip: 'Insider' },
      topHolder: { icon: TopHolderIcon, tooltip: 'Top 10 Holder' },
    };

    return tags.map((tag) => {
      const TagIcon = tagComponents[tag].icon;
      return (
        <Tooltip key={tag} content={tagComponents[tag].tooltip} position="top">
          <TagIcon />
        </Tooltip>
      );
    });
  };

  return (
    <>
      <div className="meme-trades-container">
        <div className="meme-trades-title-header">
          <div className="meme-trades-filters">
            <div className="meme-trade-filter-container">
              <button
                className={`meme-trade-filter-btn ${devActive ? 'active' : ''}`}
                onClick={() => handleFilterClick('dev')}
              >
                <img
                  src={devActive ? filledcup : filtercup}
                  alt="Filter"
                  className="filter-cup"
                />
                DEV
              </button>
            </div>
            <div className="meme-trade-filter-container">
              <button
                className={`meme-trade-filter-btn ${trackedActive ? 'active' : ''}`}
                onClick={() => handleFilterClick('tracked')}
              >
                <img
                  src={trackedActive ? filledcup : filtercup}
                  alt="Filter"
                  className="filter-cup"
                />
                TRACKED
              </button>
            </div>
            <div className="meme-trade-filter-container">
              <button
                className={`meme-trade-filter-btn ${youActive ? 'active' : ''}`}
                onClick={() => handleFilterClick('you')}
              >
                <img
                  src={youActive ? filledcup : filtercup}
                  alt="Filter"
                  className="filter-cup"
                />
                YOU
              </button>
            </div>
          </div>
          <button
            className={`filter-icon-button ${hasActiveFilters ? 'active' : ''}`}
            onClick={() => setShowFiltersPopup(true)}
            title="Advanced Filters"
          >
            <img
              className="filter-icon"
              src={filter}
              alt="Advanced Filters"
              style={{
                filter: hasActiveFilters
                  ? 'brightness(0) saturate(100%) invert(83%) sepia(11%) saturate(527%) hue-rotate(194deg) brightness(95%) contrast(92%)'
                  : undefined,
              }}
            />
            {hasActiveFilters && <span className="trades-filter-active-dot" />}
          </button>
        </div>

        {devActive && (
          <div className="meme-filter-status">
            <div className="filter-status-text">
              Showing {viewTrades.length} transactions of maker{' '}
              {devAddress?.slice(0, 6)}...{devAddress?.slice(-4)}
            </div>
            <button
              className="filter-reset-btn"
              onClick={() => onClearTracked?.()}
            >
              RESET
            </button>
          </div>
        )}
        {youActive && (
          <div className="meme-filter-status">
            <div className="filter-status-text">
              Showing {viewTrades.length} of your transactions
            </div>
            <button
              className="filter-reset-btn"
              onClick={() => onClearTracked?.()}
            >
              RESET
            </button>
          </div>
        )}
        {hasActiveFilters && !devActive && !youActive && (
          <div className="meme-filter-status">
            <div className="filter-status-text">
              Showing {viewTrades.length} filtered transactions
            </div>
            <button
              className="filter-reset-btn"
              onClick={() =>
                setTransactionFilters({
                  makerAddress: '',
                  minUSD: '',
                  maxUSD: '',
                })
              }
            >
              RESET
            </button>
          </div>
        )}

        <div className="meme-trades-header">
          <div
            className="meme-trades-header-item meme-trades-header-amount"
            onClick={() =>
              setAmountMode((p) => (p === 'USDC' ? 'MON' : 'USDC'))
            }
          >
            Amount
          </div>
          <div
            className="meme-trades-header-item meme-trades-header-mc"
            onClick={() => setMcMode((p) => (p === 'MC' ? 'Price' : 'MC'))}
          >
            {mcMode}
            <img src={switchicon} className="meme-header-switch-icon" alt="" />
          </div>
          <div className="meme-trades-header-item meme-trades-header-trader">
            Trader
          </div>
          <div className="meme-trades-header-item meme-trades-header-age">
            Time
          </div>
        </div>

        <div
          className="meme-trades-list"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {isLoadingTrades ? (
            <LoadingSkeleton />
          ) : (
            viewTrades.map((t) => {
              const shownAmount =
                amountMode === 'USDC' ? t.amountUSD : t.amountMON;
              const barWidth = getBarWidth(shownAmount);
              const positive = shownAmount >= 0;

              return (
                <div key={t.id} className="meme-trade-row">
                  <div
                    className={`meme-trade-volume-bar ${positive ? 'positive' : 'negative'}`}
                    style={{ width: `${barWidth}%` }}
                  />

                  <div
                    className={`meme-trade-amount ${positive ? 'positive' : 'negative'}`}
                  >
                    {amountMode === 'MON' && (
                      <img
                        src={monadlogo}
                        alt=""
                        className="meme-trade-mon-logo"
                      />
                    )}
                    {fmtAmount(shownAmount)}
                  </div>

                <div className="meme-trade-mc">
  {mcMode === 'MC' ? (
    <span className="meme-trade-mc">
      ${formatKMBT(t.mcUSD, 2)}
    </span>
  ) : (
    <span>
      ${formatKMBT(t.priceUSD, 6)}
    </span>
  )}
</div>

                  <div
                    className={`meme-trade-trader ${t.isCurrentUser ? 'current-user' : 'clickable'}`}
                    onClick={() =>
                      !t.isCurrentUser && setPopupAddr(t.fullAddress)
                    }
                  >
                    {t.trader}
                  </div>

                  <div className="meme-trade-age-container">
                    <div className="meme-trade-tags">
                      {t.tags.length > 0 && renderTraderTags(t.tags)}
                    </div>
                    <span className="meme-trade-age">
                      {fmtTimeAgo(t.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={`pause-indicator ${hover ? 'visible' : ''}`}>
          <div className="pause-content">
            <div className="pause-icon">
              <svg
                className="pause-icon-svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 19h2V5H7v14zm8-14v14h2V5h-2z" />
              </svg>
            </div>
            <span className="pause-text">Paused</span>
          </div>
        </div>
      </div>

      {popupAddr && (
        <TraderPortfolioPopup
          traderAddress={popupAddr}
          onClose={() => setPopupAddr(null)}
          tokenList={tokenList}
          marketsData={[]}
          onMarketSelect={onMarketSelect}
          setSendTokenIn={setSendTokenIn}
          setpopup={setpopup}
        />
      )}

      <TransactionFiltersPopup
        isOpen={showFiltersPopup}
        onClose={() => setShowFiltersPopup(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={transactionFilters}
      />
    </>
  );
}
