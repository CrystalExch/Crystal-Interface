import { Search } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import CopyButton from '../../../CopyButton/CopyButton';
import TokenInfoPopup from './TokenInfoPopup/TokenInfoPopup';
import MiniChart from './MiniChart/MiniChart';

import SortArrow from '../../../OrderCenter/SortArrow/SortArrow';
import PriceDisplay from '../PriceDisplay/PriceDisplay';
import TokenIcons from '../TokenIcons/TokenIcons';

import { useSharedContext } from '../../../../contexts/SharedContext';
import {
  formatCommas,
  formatSubscript,
} from '../../../../utils/numberDisplayFormat';

import { settings } from '../../../../settings.ts';

import './TokenInfo.css';

interface TokenInfoProps {
  in_icon: string;
  out_icon: string;
  price: string;
  activeMarket: any;
  onMarketSelect: any;
  tokendict: any;
  setpopup: (value: number) => void;
  marketsData: any[];
  isLoading?: boolean;
  isTradeRoute?: boolean;
  simpleView?: boolean;
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
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shouldFocus, setShouldFocus] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const filterTabsRef = useRef<HTMLDivElement>(null);

  const isAdvancedView = isTradeRoute && !simpleView;

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        
        if (isAdvancedView) {
          toggleDropdown();
        } else {
          setpopup(8);
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isDropdownOpen, isAdvancedView, setpopup]);

  // Handle filter tabs scroll gradients
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
      case 'Favorites':
        return favorites.includes(market.baseAddress.toLowerCase());
      case 'LSTs':
        return market.pair.includes('aprMON') || market.pair.includes('sMON') || market.pair.includes('shMON');
      case 'Meme':
        return market.pair.includes('YAKI') || market.pair.includes('CHOG') || market.pair.includes('DAK');
      case 'Stablecoins':
        return market.pair.includes('USDT');
      case 'Chains':
        return market.pair.includes('WBTC') || market.pair.includes('WETH') || market.pair.includes('WBTC') || market.pair.includes('WSOL');
      case 'All':
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
          <TokenIcons inIcon={in_icon} outIcon={out_icon} />
        )}

        <div className="token-details">
          <div className={isLoading && shouldShowFullHeader ? 'symbol-skeleton' : 'trading-pair'}>
            {shouldShowFullHeader ? (
              <>
                <span className="first-asset">{activeMarket.baseAsset} /</span><span className="second-asset">{activeMarket.quoteAsset}</span>
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
          <button className="markets-dropdown-trigger" >
            <div
              className={`trigger-content ${isDropdownVisible ? 'active' : ''}`}
            >

            </div>
          </button>

          {isDropdownOpen && (
            <div
              className={`markets-dropdown-content ${isDropdownVisible ? 'visible' : ''}`}
              onClick={(e) => e.stopPropagation()}
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
                {['All', 'Favorites', 'LSTs', 'Meme','Stablecoins', 'Chains'].map((filter) => (
                  <button
                    key={filter}
                    className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
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
              <div className="markets-list">
                {sortedMarkets.length > 0 ? (
                  sortedMarkets.map((market) => (
                    <div
                      key={market.pair}
                      className="market-item-container"
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
                            <span className="market-pair">{market.pair}</span>
                            <span className="market-volume">
                              ${formatCommas(market.volume)}
                            </span>
                          </div>
                        </div>
                        <div className="minichart-section">
                          <MiniChart
                            market={market}
                            series={market.series}
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
                            {market.priceChange+'%'}
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