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
import { calculate24hVolume, computePrice } from '../../utils';

import { settings } from '../../../../config';

import './TokenInfo.css';

interface UniversalTrades {
  [key: string]: Array<
    [number, number, number, number, string, string, number]
  >;
}

interface TokenInfoProps {
  in_icon: string;
  out_icon: string;
  price: string;
  activeMarket: any;
  onMarketSelect: any;
  tokendict: any;
  mids: any;
  universalTrades: UniversalTrades;
  setpopup: (value: number) => void;
}

const TokenInfo: React.FC<TokenInfoProps> = ({
  in_icon,
  out_icon,
  price,
  activeMarket,
  onMarketSelect,
  tokendict,
  mids,
  universalTrades,
  setpopup,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [marketsData, setMarketsData] = useState<any[]>([]);
  const [shouldFocus, setShouldFocus] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sortField, setSortField] = useState<
    'volume' | 'price' | 'change' | 'favorites' | null
  >(null);
  const [sortDirection, setSortDirection] = useState<
    'asc' | 'desc' | undefined
  >(undefined);

  const { favorites, toggleFavorite, activechain } = useSharedContext();

  const isLoading = !activeMarket;
  const marketAddress =
    activeMarket?.baseAddress || '0x0000000000000000000000000000000000000000';

  const tokenAddress =
    activeMarket?.baseAddress?.toLowerCase() ||
    '0x0000000000000000000000000000000000000000';

  const handleSymbolInfoClick = (e: React.MouseEvent) => {
    if (
      e.target instanceof Element &&
      (e.target.closest('.favorite-icon') ||
        e.target.closest('.token-actions') ||
        e.target.closest('.price-display-section'))
    ) {
      return;
    }

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

  useEffect(() => {
    const processMarkets = async () => {
      const processedMarkets = await Promise.all(
        Object.entries(markets || {}).map(async ([marketKey, market]) => {
          const marketTrades = universalTrades[marketKey] || [];
          const marketVolume = calculate24hVolume(marketTrades, market);

          const now = Date.now();
          const oneDayAgo = now - 24 * 60 * 60 * 1000;

          const cutoffIndex = marketTrades.findIndex(
            (trade) => trade[6] * 1000 > oneDayAgo,
          );

          let recentTrades =
            cutoffIndex === -1
              ? [...marketTrades]
              : marketTrades.slice(
                  cutoffIndex > 0 ? cutoffIndex - 1 : cutoffIndex,
                );

          if (!recentTrades.some((trade) => trade[6] * 1000 > oneDayAgo)) {
            recentTrades = [];
          }

          const recentPrices = recentTrades.map((trade) =>
            computePrice(
              trade,
              market,
              Math.floor(Math.log10(Number(market.priceFactor))),
            ),
          );

          let percentageChange = 0;
          if (recentPrices.length > 0) {
            const lastPrice = recentPrices[recentPrices.length - 1];
            const firstPrice = recentPrices[0];
            percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100;
          }

          const currentMid = mids[marketKey]?.[0];
          let currentPrice = '0';
          if (
            universalTrades[marketKey] &&
            universalTrades[marketKey].length > 0 &&
            market.priceFactor
          ) {
            const raw =
              Number(
                universalTrades[marketKey][
                  universalTrades[marketKey].length - 1
                ][3],
              ) / Number(market.priceFactor);
            currentPrice = raw.toFixed(Math.log10(Number(market.priceFactor)));
          } else if (currentMid && market.priceFactor) {
            const raw = Number(currentMid) / Number(market.priceFactor);
            currentPrice = raw.toFixed(Math.log10(Number(market.priceFactor)));
          }

          return {
            ...market,
            pair: `${market.baseAsset}/${market.quoteAsset}`,
            currentPrice,
            priceChange: `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(2)}%`,
            volume: marketVolume,
            marketKey,
          };
        }),
      );
      setMarketsData(processedMarkets);
    };

    processMarkets();
  }, [universalTrades, mids]);

  const handleSort = (field: 'volume' | 'price' | 'change' | 'favorites') => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(undefined);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredMarkets = marketsData.filter((market) => {
    const matchesSearch = market.pair
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const notWeth =
      market.baseAddress !== settings.chainConfig[activechain].weth;
    return matchesSearch && notWeth;
  });

  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    if (sortField === 'favorites') {
      const aIsFavorite = favorites.includes(a.baseAddress?.toLowerCase());
      const bIsFavorite = favorites.includes(b.baseAddress?.toLowerCase());
      return sortDirection === 'asc'
        ? aIsFavorite === bIsFavorite
          ? 0
          : aIsFavorite
            ? -1
            : 1
        : aIsFavorite === bIsFavorite
          ? 0
          : aIsFavorite
            ? 1
            : -1;
    }

    const aValue =
      sortField === 'volume'
        ? parseFloat(a.volume)
        : sortField === 'change' ? parseFloat(a.priceChange) : parseFloat(a.currentPrice);
    const bValue =
      sortField === 'volume'
        ? parseFloat(b.volume)
        : sortField === 'change' ? parseFloat(b.priceChange) : parseFloat(b.currentPrice);

    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });
  
  const getMarketTrades = (market: { marketKey: string | number; }) => {
    if (!market || !market.marketKey) return [];
    return universalTrades[market.marketKey] || [];
  };

  return (
    <div
      className="symbol-info"
      onClick={handleSymbolInfoClick}
      role="button"
      tabIndex={0}
    >
      <div className="markets-favorite-section">
        <button
          className={`favorite-icon ${favorites.includes(tokenAddress) ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(tokenAddress);
          }}
          title={
            favorites.includes(tokenAddress)
              ? 'Remove from favorites'
              : 'Add to favorites'
          }
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

      <TokenIcons inIcon={in_icon} outIcon={out_icon} />

      <div className="token-details">
        {isLoading ? (
          <>
            <div className="symbol-skeleton" />
            <div className="pair-skeleton" />
          </>
        ) : (
          <>
            <div className="trading-pair">
              {activeMarket.baseAsset}/{activeMarket.quoteAsset}
            </div>
            <div className="token-name">
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
          </>
        )}
      </div>

      <div className="markets-dropdown" ref={dropdownRef}>
        <button className="markets-dropdown-trigger" title="Select Market">
          <div
            className={`trigger-content ${isDropdownVisible ? 'active' : ''}`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
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
                      title="Clear search"
                    >
                      {t('clear')}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="markets-list-header">
              <div className="favorites-header" />
              <div onClick={() => handleSort('volume')}>
                {t('market')} / {t('volume')}
                <SortArrow
                  sortDirection={
                    sortField === 'volume' ? sortDirection : undefined
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
                {t('last') + ' ' +  t('day')}
                <SortArrow
                  sortDirection={
                    sortField === 'change' ? sortDirection : undefined
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
                    sortField === 'price' ? sortDirection : undefined
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
                            trades={getMarketTrades(market)}
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
                          {market.priceChange}
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

      <div className="token-name-vertical-divider"></div>

      {activeMarket && (
        <div className="price-display-section">
          <PriceDisplay price={price} />
        </div>
      )}
    </div>
  );
};

export default TokenInfo;