import { Search, SearchIcon } from 'lucide-react';
import React, { useEffect, useRef, useState, useMemo } from 'react';

import CopyButton from '../../../CopyButton/CopyButton';
import TokenInfoPopup from './TokenInfoPopup/TokenInfoPopup';
import MiniChart from './MiniChart/MiniChart';

import SortArrow from '../../../OrderCenter/SortArrow/SortArrow';
import PriceDisplay from '../PriceDisplay/PriceDisplay';
import TokenIcons from '../TokenIcons/TokenIcons';
import telegram from '../../../../assets/telegram.png';
import discord from '../../../../assets/discord1.svg';
import { useSharedContext } from '../../../../contexts/SharedContext';
import {
  formatCommas,
} from '../../../../utils/numberDisplayFormat';
import { formatSubscript, FormattedNumber } from '../../../../utils/memeFormatSubscript';

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

const calculateBondingPercentage = (marketCap: number) => {
  const bondingPercentage = Math.min((marketCap / 10000) * 100, 100);
  return bondingPercentage;
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

interface TokenInfoProps {
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
    bondingPercentage: number;
    status: 'new' | 'graduating' | 'graduated';
    created: string;
    website?: string;
    twitterHandle?: string;
    telegramHandle?: string;
    discordHandle?: string;
  };
  monUsdPrice: number;
}

const TokenInfo: React.FC<TokenInfoProps> = ({
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
  monUsdPrice,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shouldFocus, setShouldFocus] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredToken, setHoveredToken] = useState(false);
  const filterTabsRef = useRef<HTMLDivElement>(null);
  const marketsListRef = useRef<HTMLDivElement>(null);

  const isAdvancedView = isTradeRoute && !simpleView;

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

  const formatTimeAgo = (createdTimestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
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
  const FormattedNumberDisplay = ({ formatted }: { formatted: FormattedNumber }) => {
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
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWebsiteOpen = (url: string) => {
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTwitterOpen = (handle: string) => {
    const cleanHandle = handle.replace('@', '');
    window.open(`https://twitter.com/${cleanHandle}`, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramOpen = (handle: string) => {
    window.open(`https://${handle}`, '_blank', 'noopener,noreferrer');
  };

  const handleDiscordOpen = (handle: string) => {
    window.open(`https://${handle}`, '_blank', 'noopener,noreferrer');
  };

  const handleImageSearch = (imageUrl: string) => {
    window.open(
      `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };
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
    'volume' | 'price' | 'change' | 'favorites' | null
  >('volume');
  const [sortDirection, setSortDirection] = useState<
    'asc' | 'desc' | undefined
  >('desc');

  const { favorites, toggleFavorite, activechain } = useSharedContext();

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
      setpopup(8);
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

      if (!symbolInfoElement && !dropdownContent) {
        setIsDropdownVisible(false);
        setShouldFocus(false);
        setTimeout(() => {
          setIsDropdownOpen(false);
          setSearchQuery('');
          setSelectedIndex(0);
        }, 200);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      setShouldFocus(false);
    };
  }, []);

  const handleSort = (field: 'volume' | 'price' | 'change' | 'favorites') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
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
      case 'favorites':
        aValue = favorites.includes(a.baseAddress.toLowerCase()) ? 1 : 0;
        bValue = favorites.includes(b.baseAddress.toLowerCase()) ? 1 : 0;
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

  if (isMemeToken && !memeTokenData) {
    return <MemeTokenSkeleton />;
  }

  if (isMemeToken && memeTokenData) {
    return (
      <div className="meme-interface-token-info-container-meme">
        <div className="meme-interface-token-header-info">
          <div className="meme-interface-token-header-left">
            <div className="meme-interface-token-icon-container">
              <div
                className={`meme-interface-token-icon-wrapper ${memeTokenData.status === 'graduated' ? 'graduated' : ''}`}
                style={
                  memeTokenData.status !== 'graduated'
                    ? {
                      '--progress-angle': `${(memeTokenData.bondingPercentage / 100) * 360}deg`,
                      '--progress-color': getBondingColorMeme(memeTokenData.bondingPercentage),
                    } as React.CSSProperties
                    : {}
                }
              >
                <img src={memeTokenData.image} alt={memeTokenData.name} className="meme-interface-token-icon" />
              </div>
            </div>

            <div className="meme-interface-token-identity">
              <div className="meme-interface-token-name-row">
                <h1 className="meme-interface-token-symbol">{memeTokenData.symbol}</h1>
                <div className="meme-interface-token-name-container">
                  <span className="meme-interface-token-name">{memeTokenData.name}</span>
                  <button
                    className="meme-interface-social-btn"
                    onClick={() => copyToClipboard(memeTokenData.tokenAddress)}
                    title="Copy contract address"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                    </svg>
                  </button>
                </div>
                <button
                  className="meme-interface-share-btn"
                  onClick={() => copyToClipboard(memeTokenData.tokenAddress)}
                  title="Copy contract address"
                >
                  <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" ><path d="M 36.5 5 A 6.5 6.5 0 0 0 30.236328 13.207031 L 30.121094 13.263672 L 16.738281 19.953125 L 16.623047 20.009766 A 6.5 6.5 0 0 0 11.5 17.5 A 6.5 6.5 0 0 0 11.5 30.5 A 6.5 6.5 0 0 0 16.626953 27.990234 L 16.738281 28.046875 L 30.121094 34.736328 L 30.230469 34.791016 A 6.5 6.5 0 0 0 36.5 43 A 6.5 6.5 0 0 0 36.5 30 A 6.5 6.5 0 0 0 31.671875 32.158203 L 31.460938 32.052734 L 18.080078 25.363281 L 17.871094 25.259766 A 6.5 6.5 0 0 0 17.869141 22.742188 L 18.080078 22.636719 L 31.460938 15.947266 L 31.666016 15.84375 A 6.5 6.5 0 0 0 36.5 18 A 6.5 6.5 0 0 0 36.5 5 z" /></svg>
                </button>

                <button
                  className="meme-interface-share-btn"
                  onClick={() => copyToClipboard(memeTokenData.tokenAddress)}
                  title="Copy contract address"
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
                  </svg>                  </button>


              </div>

              <div className="meme-interface-token-meta-row">
                <span className="meme-interface-token-created">{formatTimeAgo(Number(memeTokenData.created))}</span>

                <div className="meme-interface-token-social-links">

                  {memeTokenData.twitterHandle && (
                    <a
                      className="meme-interface-social-btn"
                      href={memeTokenData.twitterHandle}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}

                  {memeTokenData.website && (
                    <a
                      className="meme-interface-social-btn"
                      href={memeTokenData.website}
                      target="_blank"
                      rel="noreferrer"                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                      </svg>
                    </a>
                  )}

                  {memeTokenData.telegramHandle && (
                    <a
                      className="explorer-telegram-btn"
                      href={memeTokenData.telegramHandle}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img src={telegram} alt="discord" />
                    </a>
                  )}

                  {memeTokenData.discordHandle && (
                    <a
                      className="explorer-discord-btn"
                      href={memeTokenData.discordHandle}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img src={discord} alt="discord" />
                    </a>
                  )}

                  <button
                    className="meme-interface-social-btn"
                    onClick={() => handleImageSearch(memeTokenData.image)}
                    title="Reverse image search"
                  >
                    <SearchIcon size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="meme-interface-token-header-right">
            <div className="meme-interface-token-metrics">
              <span className="meme-interface-market-cap">
                {formatPrice(memeTokenData.marketCap * monUsdPrice)}
              </span>
              <div className="meme-interface-token-metric">
                <span className="meme-interface-metric-label">Price</span>
                <span className="meme-interface-metric-value meme-price-large">
                  $<FormattedNumberDisplay formatted={formatSubscript((Number(price) * monUsdPrice).toFixed(7))} />
                </span>
              </div>


              <div className="meme-interface-token-metric">
                <span className="meme-interface-metric-label">Liquidity</span>
                <span className="meme-interface-metric-value meme-price-large">
                  $6.23K
                </span>
              </div>
              <div className="meme-interface-token-metric">
                <span className="meme-interface-metric-label">24h Change</span>
                <span
                  className={`meme-interface-metric-value ${memeTokenData.change24h >= 0 ? 'positive' : 'negative'}`}
                >
                  {memeTokenData.change24h >= 0 ? '+' : ''}{memeTokenData.change24h.toFixed(2)}%
                </span>
              </div>

              <div className="meme-interface-token-metric">
                <span className="meme-interface-metric-label">Supply</span>
                <span className="meme-interface-metric-value meme-price-large">
                  1B
                </span>
              </div>
              {memeTokenData.status == 'graduated' ? (
                <div className="meme-interface-token-metric">
                  <span className="meme-interface-metric-label">B. Curve</span>
                  <span
                    className="meme-interface-metric-value"
                    style={{ color: getBondingColorMeme(memeTokenData.bondingPercentage) }}
                  >
                    Graduated
                  </span>
                </div>
              ) : (
                <div className="meme-interface-token-metric">
                  <span className="meme-interface-metric-label">B. Curve</span>
                  <span
                    className="meme-interface-metric-value"
                    style={{ color: getBondingColorMeme(memeTokenData.bondingPercentage) }}
                  >
                    {memeTokenData.bondingPercentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
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
            <div
              className={`bonding-amount-display ${hoveredToken && bondingPercentage > 0 && isMemeToken ? 'visible' : ''}`}
              style={{ color: getBondingColor(bondingPercentage) }}
            >
              BONDING: {bondingPercentage.toFixed(1)}%
            </div>
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
                <span className="second-asset">{activeMarket.quoteAsset}</span>
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
                {tokendict[activeMarket.baseAddress].name}
              </span>
              <div
                className="token-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <CopyButton textToCopy={marketAddress} />
                <TokenInfoPopup
                  symbol={activeMarket.baseAsset}
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
                            <FormattedNumberDisplay formatted={formatSubscript(market.currentPrice)} />
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
