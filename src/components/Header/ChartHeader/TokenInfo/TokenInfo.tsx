import { Search, SearchIcon } from 'lucide-react';
import React, { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom'
import camera from '../../../../assets/camera.svg'
import CopyButton from '../../../CopyButton/CopyButton';
import TokenInfoPopup from './TokenInfoPopup/TokenInfoPopup';
import MiniChart from './MiniChart/MiniChart';
import '../../../Portfolio/Portfolio.css';
import { FixedSizeList as List } from 'react-window';

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
            <div className="skeleton-circle" style={{ width: '28px', height: '28px', marginRight: '3px' }}></div>
          </div>
          <div className="perps-interface-token-identity">
            <div className="perps-interface-token-name-row">
              <div className="skeleton-text skeleton-symbol" style={{ width: '80px', height: '24px' }}></div>
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
              <div className="skeleton-text skeleton-value" style={{ width: '70px', height: '14px' }}></div>
            </div>

            <div className="perps-interface-token-metric">
              <div className="skeleton-text skeleton-label" style={{ width: '70px', height: '12px' }}></div>
              <div className="skeleton-text skeleton-value" style={{ width: '80px', height: '14px' }}></div>
            </div>

            <div className="perps-interface-token-metric">
              <div className="skeleton-text skeleton-label" style={{ width: '90px', height: '12px' }}></div>
              <div className="skeleton-text skeleton-value" style={{ width: '90px', height: '14px' }}></div>
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

const PerpsMarketRow = memo(({ index, style, data }: {
  index: number;
  style: React.CSSProperties;
  data: {
    markets: any[];
    selectedIndex: number;
    onMouseEnter: (index: number) => void;
    onClick: (market: any) => void;
    toggleFavorite: any;
  }
}) => {
  const { markets, selectedIndex, onMouseEnter, onClick, toggleFavorite } = data;
  const market = markets[index];

  if (!market) return null;

  return (
    <div
      style={style}
      className={`perps-market-item-container ${index === selectedIndex ? 'selected' : ''}`}
      onMouseEnter={() => onMouseEnter(index)}
    >
      <div className="perps-market-item" onClick={() => onClick(market)}>
        <button onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(market.contractName);
          }} className="dropdown-market-favorite-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </button>

        <div className="market-pair-section">
          <img
            src={market.iconSrc}
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
          <div className="perps-open-interest">{market.lastPrice}</div>
        </div>

        <div className="perps-funding-section">
          <div className={`perps-market-change ${market.changeClass}`}>
            {market.formattedChange}
          </div>
        </div>

        <div className="perps-funding-section">
          <div className={`perps-funding-rate ${market.fundingClass}`}>
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
  };
  isPerpsToken?: boolean;
  perpsActiveMarketKey: string;
  perpsMarketsData: { [key: string]: any };
  perpsFilterOptions: any;
  monUsdPrice: number;
  showLoadingPopup?: (id: string, config: any) => void;
  updatePopup?: (id: string, config: any) => void;
  userPnl?: {
    totalPnl: number;
  };
  setperpsActiveMarketKey: any;
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
  isPerpsToken = false,
  perpsActiveMarketKey,
  perpsMarketsData,
  perpsFilterOptions,
  monUsdPrice,
  showLoadingPopup,
  updatePopup,
  userPnl,
  setperpsActiveMarketKey
}) => {
  const navigate = useNavigate()
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
  const [debouncedPerpsSearchQuery, setDebouncedPerpsSearchQuery] = useState('');
  const [perpsActiveFilter, setPerpsActiveFilter] = useState('All');
  const [perpsSelectedIndex, setPerpsSelectedIndex] = useState(0);
  const [perpsShouldFocus, setPerpsShouldFocus] = useState(false);
  const filterTabsRef = useRef<HTMLDivElement>(null);
  const marketsListRef = useRef<HTMLDivElement>(null);
  const memeMetricsRef = useRef<HTMLDivElement>(null);
  const perpsMetricsRef = useRef<HTMLDivElement>(null);
  const perpsFilterTabsRef = useRef<HTMLDivElement>(null);
  const perpsMarketsListRef = useRef<HTMLDivElement>(null);
  const perpsDropdownRef = useRef<HTMLDivElement>(null);
  const perpsSearchInputRef = useRef<HTMLInputElement>(null);
  const virtualizationListRef = useRef<List>(null);
  const { favorites, toggleFavorite, activechain } = useSharedContext();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPerpsSearchQuery(perpsSearchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [perpsSearchQuery]);

  const filteredPerpsMarkets = useMemo(() => {
    return Object.values(perpsMarketsData)
      .filter(market =>
        perpsFilterOptions[perpsActiveFilter]?.includes(market.contractName) &&
        market.contractName.toLowerCase().includes(debouncedPerpsSearchQuery.toLowerCase())
      )
      .map(market => ({
        ...market,
        formattedVolume: `$${formatCommas(Number(market.value).toFixed(2))}`,
        formattedOI: `$${formatCommas((Number(market.openInterest) * Number(market.lastPrice)).toFixed(2))}`,
        formattedFunding: `${market.fundingRate >= 0 ? '+' : ''}${(market.fundingRate * 100).toFixed(4)}%`,
        formattedChange: `${(Number(market.priceChangePercent) >= 0 ? '+' : '') +
          (market.priceChange) + ' / ' +
          (Number(market.priceChangePercent) >= 0 ? '+' : '') +
          Number(market.priceChangePercent * 100).toFixed(2)}%`,
        fundingClass: market.fundingRate < 0 ? 'negative' : 'positive',
        changeClass: market.priceChangePercent < 0 ? 'negative' : 'positive',
        iconSrc: market.iconURL
      }));
  }, [perpsMarketsData, perpsFilterOptions, perpsActiveFilter, debouncedPerpsSearchQuery]);

  const togglePerpsDropdown = () => {
    if (!isPerpsDropdownOpen) {
      setPerpsSearchQuery('');
      setPerpsSelectedIndex(0);
      setIsPerpsDropdownOpen(true);
      requestAnimationFrame(() => {
        setIsPerpsDropdownVisible(true);
      });
    } else {
      setIsPerpsDropdownVisible(false);
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
    navigate(`/perps/${market.contractName}`);
    setTimeout(() => {
      setIsPerpsDropdownOpen(false);
    }, 200);
  }, [navigate, setperpsActiveMarketKey]);

  const handlePerpsMouseEnter = useCallback((index: number) => {
    setPerpsSelectedIndex(index);
  }, []);

  const virtualizationData = useMemo(() => ({
    markets: filteredPerpsMarkets,
    selectedIndex: perpsSelectedIndex,
    onMouseEnter: handlePerpsMouseEnter,
    onClick: handlePerpsMarketSelect,
    toggleFavorite: toggleFavorite,
  }), [filteredPerpsMarkets, perpsSelectedIndex, handlePerpsMouseEnter, handlePerpsMarketSelect, toggleFavorite]); <div className="perps-markets-list-virtualized" style={{ height: '400px', width: '100%' }}>
    <List
      ref={virtualizationListRef}
      height={400}
      width="100%"
      itemCount={filteredPerpsMarkets.length}
      itemSize={40}
      itemData={virtualizationData}
      overscanCount={15}
      itemKey={(index, data) => data.markets[index]?.contractName || index}
      useIsScrolling={true}
    >
      {PerpsMarketRow}
    </List>
  </div>

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
      console.error('Failed to copy:', err);
      if (showLoadingPopup && updatePopup) {
        showLoadingPopup(txId, { title: 'Copy Failed', subtitle: 'Unable to copy to clipboard' });
        setTimeout(() => {
          updatePopup(txId, { title: 'Copy Failed', subtitle: 'Unable to copy to clipboard', variant: 'error', confirmed: true, isLoading: false });
        }, 100);
      }
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
      const container = memeMetricsRef.current;
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

    const container = memeMetricsRef.current;
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
    'volume' | 'price' | 'change' | 'favorites' | null
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

  const perpsTokenInfo = perpsMarketsData[perpsActiveMarketKey];

  const [remaining, setRemaining] = useState("")
  const [priceColor, setPriceColor] = useState<string>("")
  const prevPriceRef = useRef<number | null>(null)

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

  if (isMemeToken && !memeTokenData) {
    return <MemeTokenSkeleton />;
  }

  if (isMemeToken && memeTokenData) {
    return (
      <div
        className="meme-interface-token-info-container-meme"
      >
        <div className="meme-interface-token-header-info">
          <div className="meme-interface-token-header-left">
            <div className="meme-interface-token-icon-container">
              <div
                className={`meme-interface-token-icon-wrapper ${memeTokenData.status === 'graduated' ? 'graduated' : ''}`}
                style={
                  memeTokenData.status !== 'graduated'
                    ? {
                      '--progress-angle': `${(bondingPercentage / 100) * 360}deg`,
                      '--progress-color': getBondingColorMeme(bondingPercentage),
                    } as React.CSSProperties
                    : {}
                }
                onClick={() => window.open(
                  `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(memeTokenData.image)}`,
                  '_blank',
                  'noopener,noreferrer'
                )}
              >
                <div className="meme-interface-image-container">
                  {memeTokenData.image ? (
                    <img src={memeTokenData.image} alt={memeTokenData.name} className="meme-interface-token-icon" />
                  ) : (
                    <div
                      className="meme-interface-token-icon"
                      style={{
                        width: '37px',
                        height: '37px',
                        backgroundColor: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        color: '#ffffff',
                        borderRadius: '3px',
                        boxShadow: '0px 0px 0 1.5px rgb(6, 6, 6)',
                        position: 'relative',
                        zIndex: 3
                      }}
                    >
                      {memeTokenData.symbol.charAt(0).toUpperCase()}
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
                <div className="meme-interface-token-name-container">
                  <span
                    className="meme-interface-token-name"
                    onClick={() => copyToClipboard(memeTokenData.tokenAddress, 'Contract address copied')}
                    style={{ cursor: 'pointer' }}
                    title="Click to copy contract address"
                  >
                    {memeTokenData.name}
                  </span>                  <button
                    className="meme-interface-social-btn"
                    onClick={() => copyToClipboard(memeTokenData.tokenAddress, 'Contract address copied')}
                    title="Copy contract address"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                    </svg>
                  </button>
                </div>
                {/* <button
                  className="meme-interface-share-btn"
                  onClick={() => copyToClipboard(`app.crystal.exchange/meme/${memeTokenData.tokenAddress}`)}
                  title="Copy share link"
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
                  </svg>
                </button> */}


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

          <div className="meme-interface-token-header-right">
            <div className="meme-interface-token-metrics" ref={memeMetricsRef}>
              <span className="meme-interface-market-cap">
                {formatPrice((memeTokenData.marketCap || 1000) * monUsdPrice)}
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
                <span className="meme-interface-metric-label">Your PNL</span>
                <div className="meme-interface-pnl-value-container">
                  {userPnl && userPnl.totalPnl !== 0 && (
                    <span
                      className={`meme-interface-metric-value ${userPnl.totalPnl >= 0 ? 'positive' : 'negative'}`}
                    >
                      {userPnl.totalPnl >= 0 ? '+' : ''}${Math.abs(userPnl.totalPnl).toFixed(2)}
                    </span>
                  )}
                  <button
                    className="trenches-pnl-button"
                    onClick={() => setpopup(27)}
                  >
                    <svg fill="#cfcfdfff" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="16" height="16">
                      <path d="M 31.964844 2.0078125 A 2 2 0 0 0 30.589844 2.5898438 L 20.349609 12.820312 A 2.57 2.57 0 0 0 19.910156 13.470703 A 2 2 0 0 0 21.759766 16.240234 L 30 16.240234 L 30 39.779297 A 2 2 0 0 0 34 39.779297 L 34 16.240234 L 42.25 16.240234 A 2 2 0 0 0 43.660156 12.820312 L 33.410156 2.5898438 A 2 2 0 0 0 31.964844 2.0078125 z M 4 21.619141 A 2 2 0 0 0 2 23.619141 L 2 56 A 2 2 0 0 0 4 58 L 60 58 A 2 2 0 0 0 62 56 L 62 23.619141 A 2 2 0 0 0 60 21.619141 L 44.269531 21.619141 A 2 2 0 0 0 44.269531 25.619141 L 58 25.619141 L 58 54 L 6 54 L 6 25.619141 L 19.730469 25.619141 A 2 2 0 0 0 19.730469 21.619141 L 4 21.619141 z" />
                    </svg>
                  </button>
                </div>
              </div>
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
                {Number(perpsTokenInfo.lastPrice).toFixed((perpsTokenInfo.lastPrice.toString().split(".")[1] || "").length).toLocaleString()}
              </span>

              <div className="perps-interface-token-metric">
                <span className="perps-interface-metric-label">Oracle</span>
                <span className="perps-interface-metric-value perps-price-small">
                  {Number(perpsTokenInfo.oraclePrice).toFixed((perpsTokenInfo.lastPrice.toString().split(".")[1] || "").length).toLocaleString()}
                </span>
              </div>

              <div className="perps-interface-token-metric">
                <span className="perps-interface-metric-label">24h Change</span>
                <span
                  className={`perps-interface-metric-value ${Number(perpsTokenInfo.priceChangePercent) >= 0 ? 'positive' : 'negative'}`}
                >
                  {(Number(perpsTokenInfo.priceChangePercent) >= 0 ? '+' : '') + (perpsTokenInfo.priceChange) + ' / ' + (Number(perpsTokenInfo.priceChangePercent) >= 0 ? '+' : '') + Number(perpsTokenInfo.priceChangePercent * 100).toFixed(2)}%
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
                <div className="favorites-header" />
                <div>Market / Volume</div>
                <div className="markets-dropdown-chart-container">Last Price</div>
                <div className="perps-oi-header">24hr Change</div>
                <div className="perps-funding-header">8hr Funding</div>
                <div className="markets-dropdown-price-container">Open Interest</div>
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