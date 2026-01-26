import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { formatCommas } from '../../utils/numberDisplayFormat';
import './Predict.css';

// Color palette for outcome lines
const OUTCOME_COLORS = [
  '#3B82F6', // blue
  '#F59E0B', // orange
  '#10B981', // green
  '#EC4899', // pink
  '#8B5CF6', // purple
  '#EF4444', // red
  '#06B6D4', // cyan
  '#84CC16', // lime
];

interface PredictProps {
  layoutSettings?: string;
  orderbookPosition?: string;
  windowWidth: number;
  mobileView: string;
  isOrderbookVisible?: boolean;
  orderbookWidth?: number;
  setOrderbookWidth?: any;
  viewMode?: 'both' | 'buy' | 'sell';
  setViewMode?: any;
  activeTab?: 'orderbook' | 'trades';
  setActiveTab?: any;
  perpsActiveMarketKey: string;
  setperpsActiveMarketKey: (key: string) => void;
  perpsMarketsData: Record<string, any>;
  setPerpsMarketsData: (data: any) => void;
  address?: string;
  router?: any;
  orderCenterHeight?: number;
  setSendTokenIn?: any;
  refetch?: () => void;
  setpopup?: (value: number) => void;
  sortConfig?: any;
  onSort?: (config: any) => void;
  activeSection?: 'balances' | 'orders' | 'tradeHistory' | 'orderHistory';
  setActiveSection?: any;
  filter?: 'all' | 'buy' | 'sell';
  setFilter?: any;
  onlyThisMarket?: boolean;
  setOnlyThisMarket?: any;
  sendUserOperationAsync?: any;
  setChain?: any;
  isOrderCenterVisible?: boolean;
  openEditOrderPopup?: (order: any) => void;
  openEditOrderSizePopup?: (order: any) => void;
  wethticker?: any;
  ethticker?: any;
  memoizedSortConfig?: any;
  emptyFunction?: any;
  handleSetChain?: any;
  selectedInterval?: string;
  setSelectedInterval?: any;
  perpsFilterOptions?: any;
  setPerpsFilterOptions?: any;
  signMessageAsync?: any;
  leverage?: string;
  setLeverage?: (value: string) => void;
  signer?: any;
  setSigner?: any;
  setOrderCenterHeight?: (height: number) => void;
  isMarksVisible?: any;
  setIsMarksVisible?: any;
  setPerpsLimitChase?: any;
  perpsLimitChase?: any;
  handlePerpsMarketSelect?: any;
  scaAddress?: string;
  setTempLeverage?: any;
}

interface OutcomeData {
  name: string;
  probability: number;
  volume: number;
  yesPrice: number;
  noPrice: number;
  color: string;
}

type IntervalType = '1H' | '24H' | '7D' | '30D' | 'ALL';

const Predict: React.FC<PredictProps> = ({
  windowWidth,
  mobileView,
  perpsActiveMarketKey,
  setperpsActiveMarketKey,
  perpsMarketsData,
  setPerpsMarketsData,
  address,
  setpopup,
}) => {
  const { marketSlug } = useParams<{ marketSlug?: string }>();
  const activeRequestRef = useRef<AbortController | null>(null);
  const selectedOutcomeRef = useRef<string | null>(null);

  // Chart state
  const [selectedInterval, setSelectedInterval] = useState<IntervalType>('ALL');
  const [chartData, setChartData] = useState<Record<string, { time: number; value: number }[]>>({});

  // Order state
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<'Yes' | 'No'>('Yes');
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState<'Market' | 'Limit'>('Market');
  const [isOrderTypeDropdownOpen, setIsOrderTypeDropdownOpen] = useState(false);

  // Limit order state
  const [limitPrice, setLimitPrice] = useState(0);
  const [shares, setShares] = useState('');
  const [expirationEnabled, setExpirationEnabled] = useState(false);

  // Table state
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' }>({
    column: 'probability',
    direction: 'desc'
  });
  const [activityTab, setActivityTab] = useState<'all' | 'openOrders'>('all');

  // Chart refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());

  // Get current market data
  const activeMarket = perpsMarketsData[perpsActiveMarketKey] || {};

  useEffect(() => {
    selectedOutcomeRef.current = selectedOutcome;
  }, [selectedOutcome]);

  // Fetch market data when marketSlug changes
  useEffect(() => {
    if (marketSlug) {
      const fetchPolymarketJson = async (path: string, signal: AbortSignal) => {
        const response = await fetch(path, { signal });
        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(`Polymarket request failed (${response.status}) for ${path}: ${body.slice(0, 200)}`);
        }
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(`Polymarket response not JSON for ${path}: ${text.slice(0, 200)}`);
        }
      };

      const parseClobTokenIds = (value: any) => {
        if (Array.isArray(value)) {
          return value.filter(Boolean).map((item) => String(item));
        }
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              return parsed.filter(Boolean).map((item) => String(item));
            }
          } catch {
            return [];
          }
        }
        return [];
      };

      const getTokenIdsForMarket = (marketData: any) => {
        const clobTokenIds = parseClobTokenIds(marketData?.clobTokenIds);
        if (clobTokenIds.length) return clobTokenIds;
        const tokens = Array.isArray(marketData?.tokens)
          ? marketData.tokens.map((token: any) => token?.token_id).filter(Boolean)
          : [];
        return tokens.map((item: any) => String(item));
      };

      const fetchOrderbooks = async (tokenIds: string[], signal: AbortSignal) => {
        if (!tokenIds.length) return {};
        try {
          const response = await fetch('/clob/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tokenIds.map((tokenId) => ({ token_id: tokenId }))),
            signal,
          });
          if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`Orderbook request failed (${response.status}): ${body.slice(0, 200)}`);
          }
          const books = await response.json().catch(() => []);
          if (!Array.isArray(books)) return {};
          return books.reduce((acc: Record<string, any>, book: any) => {
            if (book?.asset_id) {
              acc[String(book.asset_id)] = book;
            }
            return acc;
          }, {});
        } catch (error) {
          if ((error as Error).name === 'AbortError') return {};
          console.warn('Failed to fetch orderbooks:', error);
          return {};
        }
      };

      const getOrderbookPrice = (book: any, fallback: number) => {
        const bestAsk = book?.asks?.[0]?.price;
        const bestBid = book?.bids?.[0]?.price;
        const price = bestAsk ?? bestBid;
        const parsed = price != null ? Number(price) : fallback;
        return Number.isFinite(parsed) ? parsed : fallback;
      };

      const fetchMarketData = async () => {
        activeRequestRef.current?.abort();
        const controller = new AbortController();
        activeRequestRef.current = controller;

        try {
          const data = await fetchPolymarketJson(
            `/predictapi/events?active=true&closed=false&slug=${encodeURIComponent(marketSlug)}`,
            controller.signal,
          ).catch(() => fetchPolymarketJson(
            `/predictapi/events?slug=${encodeURIComponent(marketSlug)}`,
            controller.signal,
          ));

          if (data && data.length > 0) {
            const event = data[0];
            const markets = event.markets || [];

            if (markets.length > 0) {
              const market = markets[0];
              const conditionId = market.conditionId;
              const tokenID = market.tokenID || market.tokens?.[0]?.token_id;
              const isMultiOutcome = markets.length > 1;

              setperpsActiveMarketKey(conditionId);

              const outcomePrices = typeof market.outcomePrices === 'string'
                ? JSON.parse(market.outcomePrices)
                : market.outcomePrices || [];

              // Fetch series data for chart
              const seriesResponse = await fetch(`/clob/series?id=${conditionId}`, { signal: controller.signal }).catch(() => null);
              const seriesData = seriesResponse ? await seriesResponse.json().catch(() => null) : null;

              // Build chart data from series
              if (seriesData?.history) {
                const chartPoints: Record<string, { time: number; value: number }[]> = {};

                // For multi-outcome markets, we'd need separate series per outcome
                // For now, use the primary outcome
                const primaryPoints = seriesData.history.map((point: any) => ({
                  time: point.t,
                  value: parseFloat(point.p) * 100, // Convert to percentage
                }));

                chartPoints['Primary'] = primaryPoints;
                setChartData(chartPoints);
              }

              const baseOutcomePrices = isMultiOutcome
                ? markets.map((m: any) => {
                    const prices = typeof m.outcomePrices === 'string'
                      ? JSON.parse(m.outcomePrices)
                      : m.outcomePrices || [];
                    return parseFloat(prices[0] || 0);
                  })
                : outcomePrices.map((p: any) => parseFloat(p || 0));

              const orderbookTokenIds = isMultiOutcome
                ? markets.map((m: any) => getTokenIdsForMarket(m)[0] || '')
                : getTokenIdsForMarket(market);
              const orderbookFetchTokenIds = orderbookTokenIds.filter(Boolean);

              const orderbooksByTokenId = await fetchOrderbooks(orderbookFetchTokenIds, controller.signal);
              const derivedOutcomePrices = orderbookTokenIds.length
                ? baseOutcomePrices.map((price: number, index: number) => {
                    const tokenId = orderbookTokenIds[index];
                    const book = tokenId ? orderbooksByTokenId[tokenId] : null;
                    return book ? getOrderbookPrice(book, price) : price;
                  })
                : baseOutcomePrices;

              // Build market data
              const marketData = {
                contractId: conditionId,
                baseAsset: event.title || market.question,
                quoteAsset: 'USD',
                lastPrice: derivedOutcomePrices[0] || 0,
                value: market.volume || market.volume24hr || 0,
                liquidity: market.liquidity || 0,
                outcomes: isMultiOutcome
                  ? markets.map((m: any) => m.groupItemTitle || m.question)
                  : (typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes) || ['Yes', 'No'],
                outcomePrices: derivedOutcomePrices,
                eventTitle: event.title,
                eventSlug: event.slug,
                iconURL: event.image || event.icon,
                question: market.question,
                endDate: market.endDate,
                startDate: market.startDate || market.creationDate,
                enableDisplay: true,
                active: market.active,
                closed: market.closed ?? event.closed ?? false,
                tokenID: tokenID,
                orderbooks: orderbooksByTokenId,
                markets: markets,
                volume24hr: market.volume24hr || 0,
                volumeNum: market.volumeNum || 0,
                description: market.description || event.description,
                tags: event.tags || [],
                source: 'polymarket',
              };

              setPerpsMarketsData((prev: any) => ({
                ...prev,
                [conditionId]: marketData,
              }));

              // Auto-select first outcome
              if (marketData.outcomes?.length > 0 && !selectedOutcomeRef.current) {
                setSelectedOutcome(marketData.outcomes[0]);
              }
            }
          }
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            console.error('Error fetching market data:', error);
          }
        }
      };

      fetchMarketData();

      // Refresh the currently viewed market on an interval.
      const refreshId = window.setInterval(fetchMarketData, 60_000);
      return () => {
        window.clearInterval(refreshId);
        activeRequestRef.current?.abort();
      };
    }
    return undefined;
  }, [marketSlug, setperpsActiveMarketKey, setPerpsMarketsData]);

  // Process outcomes data
  const outcomes: OutcomeData[] = useMemo(() => {
    const outcomeLabels = Array.isArray(activeMarket?.outcomes) ? activeMarket.outcomes : ['Yes', 'No'];
    const outcomePrices = Array.isArray(activeMarket?.outcomePrices) ? activeMarket.outcomePrices : [0.5, 0.5];
    const markets = activeMarket?.markets || [];

    const outcomeData = outcomeLabels.map((label: string, idx: number) => {
      const price = Number(outcomePrices[idx] ?? 0);
      const marketVolume = markets[idx]?.volume24hr || markets[idx]?.volume || 0;

      return {
        name: label,
        probability: price,
        volume: marketVolume || (activeMarket?.volume24hr || 0) / outcomeLabels.length,
        yesPrice: price,
        noPrice: 1 - price,
        color: OUTCOME_COLORS[idx % OUTCOME_COLORS.length],
      };
    });

    if (outcomeLabels.length > 2) {
      outcomeData.sort((a: OutcomeData, b: OutcomeData) => b.probability - a.probability);
    }

    return outcomeData;
  }, [activeMarket]);

  // Sort outcomes
  const sortedOutcomes = useMemo(() => {
    return [...outcomes].sort((a, b) => {
      const mult = sortConfig.direction === 'asc' ? 1 : -1;
      if (sortConfig.column === 'probability') {
        return (a.probability - b.probability) * mult;
      }
      return a.name.localeCompare(b.name) * mult;
    });
  }, [outcomes, sortConfig]);

  const leaderOutcomeName = useMemo(() => {
    if (!outcomes.length) return null;
    return outcomes.reduce((leader, current) => (
      current.probability > leader.probability ? current : leader
    )).name;
  }, [outcomes]);

  // Get selected outcome data
  const selectedOutcomeData = useMemo(() => {
    return outcomes.find(o => o.name === selectedOutcome);
  }, [outcomes, selectedOutcome]);

  // Calculate potential win
  const toWin = useMemo(() => {
    if (!amount || !selectedOutcomeData) return '0.00';
    const price = selectedSide === 'Yes' ? selectedOutcomeData.yesPrice : selectedOutcomeData.noPrice;
    if (price <= 0) return '0.00';
    const potentialWin = (Number(amount) / price) - Number(amount);
    return potentialWin.toFixed(2);
  }, [amount, selectedOutcomeData, selectedSide]);

  // Format countdown
  const getCountdown = useCallback((endDate: string) => {
    if (!endDate) return null;
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRefs.current.clear();
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.5)',
      },
      grid: {
        vertLines: { color: 'rgba(170, 174, 207, 0.06)' },
        horzLines: { color: 'rgba(170, 174, 207, 0.06)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(170, 174, 207, 0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(170, 174, 207, 0.3)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(170, 174, 207, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(170, 174, 207, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    // Add line series for each outcome
    outcomes.forEach((outcome, idx) => {
      const lineSeries = chart.addLineSeries({
        color: outcome.color,
        lineWidth: 2,
        priceFormat: {
          type: 'custom',
          formatter: (price: number) => `${price.toFixed(0)}%`,
        },
      });
      seriesRefs.current.set(outcome.name, lineSeries);
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [outcomes.length]);

  // Update chart data
  useEffect(() => {
    if (!chartRef.current || Object.keys(chartData).length === 0) return;

    // For now, apply same data to all series (would be per-outcome in full implementation)
    const primaryData = chartData['Primary'] || [];

    outcomes.forEach((outcome, idx) => {
      const series = seriesRefs.current.get(outcome.name);
      if (series && primaryData.length > 0) {
        // Simulate different lines by offsetting based on current probability
        const adjustedData = primaryData.map(point => ({
          time: point.time as any,
          value: Math.max(0, Math.min(100, point.value + (outcome.probability * 100 - 50) * 0.5)),
        }));
        series.setData(adjustedData);
      }
    });

    chartRef.current.timeScale().fitContent();
  }, [chartData, outcomes]);

  // Handle sort
  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Handle preset amount
  const handlePreset = (value: number) => {
    setAmount(prev => (Number(prev || 0) + value).toString());
  };

  // Handle place order (placeholder)
  const handlePlaceOrder = () => {
    if (!selectedOutcome || !amount || Number(amount) <= 0) return;
    console.log('Place order:', { selectedOutcome, selectedSide, orderType, amount });
    // TODO: Implement actual order placement
  };

  // Format large numbers
  const formatVolume = (vol: number | string | undefined | null) => {
    const numVol = Number(vol) || 0;
    if (numVol >= 1e9) return `$${(numVol / 1e9).toFixed(1)}B`;
    if (numVol >= 1e6) return `$${(numVol / 1e6).toFixed(1)}M`;
    if (numVol >= 1e3) return `$${(numVol / 1e3).toFixed(1)}K`;
    return `$${numVol.toFixed(0)}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Extract market info
  const eventTitle = activeMarket?.eventTitle || activeMarket?.baseAsset || 'Loading...';
  const eventImage = activeMarket?.iconURL || '';
  const eventTags = activeMarket?.tags || [];
  const volume24h = activeMarket?.volume24hr || activeMarket?.value || 0;
  const liquidity = activeMarket?.liquidity || 0;
  const endDate = activeMarket?.endDate || '';
  const countdown = getCountdown(endDate);
  const isResolved = Boolean(activeMarket?.closed || activeMarket?.active === false);
  const statusLabel = isResolved ? 'Resolved' : 'Live';
  const statusTitle = endDate
    ? `${isResolved ? 'Resolved' : 'Ends'} ${formatDate(endDate)}`
    : statusLabel;
  const isTradingDisabled = isResolved;

  return (
    <div className={`predict-event-page ${isResolved ? 'predict-event-resolved' : ''}`}>
      {/* HEADER */}
      <div className="predict-event-header">
        <div className="predict-event-header-left">
          <div className="predict-event-image">
            {eventImage ? (
              <img src={eventImage} alt={eventTitle} />
            ) : (
              <span>{eventTitle.charAt(0)}</span>
            )}
          </div>
          <div className="predict-event-info">
            {eventTags.length > 0 && (
              <div className="predict-event-tags">
                {eventTags.slice(0, 3).map((tag: any, idx: number) => (
                  <span key={idx} className="predict-event-tag">
                    {tag.label || tag.name || tag}
                  </span>
                ))}
              </div>
            )}
            <div className="predict-event-title-row">
              <h1 className="predict-event-title">{eventTitle}</h1>
              <span
                className={`predict-event-status-pill ${isResolved ? 'resolved' : 'live'}`}
                title={statusTitle}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="predict-event-header-stats">
          <div className="predict-event-stat">
            <span className="predict-event-stat-value">{formatVolume(volume24h)}</span>
            <span className="predict-event-stat-label">Vol</span>
          </div>
          <div className="predict-event-stat">
            <span className="predict-event-stat-value">{formatDate(endDate)}</span>
            <span className="predict-event-stat-label">End Date</span>
          </div>
          {countdown && (
            <div className="predict-event-stat predict-event-countdown-stat">
              <span className="predict-event-stat-value predict-event-countdown-value">{countdown}</span>
            </div>
          )}
        </div>
      </div>

      <div className="predict-event-main-content">
        {/* LEFT PANEL */}
        <div className="predict-event-left-panel">
          {/* Chart Section */}
          <div className="predict-event-chart-section">
            {/* Chart Legend */}
            <div className="predict-event-chart-legend">
              {outcomes.slice(0, 4).map((outcome, idx) => (
                <div key={outcome.name} className="predict-event-legend-item">
                  <span className="predict-event-legend-color" style={{ backgroundColor: outcome.color }} />
                  <span className="predict-event-legend-name">{outcome.name}</span>
                  <span className="predict-event-legend-value">{(outcome.probability * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>

            {/* Chart Container */}
            <div className="predict-event-chart-container" ref={chartContainerRef} />

            {/* Interval Selector */}
            <div className="predict-event-interval-selector">
              {(['1H', '24H', '7D', '30D', 'ALL'] as IntervalType[]).map(interval => (
                <button
                  key={interval}
                  className={`predict-event-interval-btn ${selectedInterval === interval ? 'active' : ''}`}
                  onClick={() => setSelectedInterval(interval)}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>

          {/* Outcomes Table */}
          <div className="predict-event-outcomes-table">
            <div className="predict-event-outcomes-header">
              <div
                className="predict-event-outcome-col predict-event-outcome-name-col"
                onClick={() => handleSort('name')}
              >
                OUTCOME
                {sortConfig.column === 'name' && (
                  <span className="predict-event-sort-arrow">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
              <div
                className="predict-event-outcome-col predict-event-outcome-prob-col"
                onClick={() => handleSort('probability')}
              >
                % CHANCE
                {sortConfig.column === 'probability' && (
                  <span className="predict-event-sort-arrow">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
              <div className="predict-event-outcome-col predict-event-outcome-actions-col">
                {/* Empty header for actions */}
              </div>
            </div>
            <div className="predict-event-outcomes-body">
              {sortedOutcomes.map(outcome => (
                <div
                  key={outcome.name}
                  className={`predict-event-outcome-row ${selectedOutcome === outcome.name ? 'selected' : ''}`}
                  onClick={() => setSelectedOutcome(outcome.name)}
                >
                  <div className="predict-event-outcome-col predict-event-outcome-name-col">
                    <span className="predict-event-outcome-label">{outcome.name}</span>
                    <span className="predict-event-outcome-volume">{formatVolume(outcome.volume)} Vol</span>
                  </div>
                  <div className="predict-event-outcome-col predict-event-outcome-prob-col">
                    <span className="predict-event-probability-value">{(outcome.probability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="predict-event-outcome-col predict-event-outcome-actions-col">
                    <button
                      className="predict-event-buy-yes-btn"
                      disabled={isTradingDisabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOutcome(outcome.name);
                        setSelectedSide('Yes');
                      }}
                    >
                      Buy Yes {(outcome.yesPrice * 100).toFixed(1)}c
                    </button>
                    <button
                      className="predict-event-buy-no-btn"
                      disabled={isTradingDisabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOutcome(outcome.name);
                        setSelectedSide('No');
                      }}
                    >
                      Buy No {(outcome.noPrice * 100).toFixed(1)}c
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Order Panel */}
        <div className="predict-event-right-panel">
          {/* Selected Outcome */}
          {selectedOutcomeData && (
            <div className="predict-event-selected-outcome-display">
              <div className="predict-event-selected-outcome-image">
                {eventImage ? (
                  <img src={eventImage} alt={selectedOutcomeData.name} />
                ) : (
                  <span>{selectedOutcomeData.name.charAt(0)}</span>
                )}
              </div>
              <span className="predict-event-selected-outcome-name">{selectedOutcomeData.name}</span>
            </div>
          )}

          {/* Buy/Sell Toggle + Order Type */}
          <div className="predict-event-trade-header-row">
            <div className="predict-event-trade-toggle">
              <button className="predict-event-trade-toggle-btn buy active" disabled={isTradingDisabled}>Buy</button>
              <button className="predict-event-trade-toggle-btn sell" disabled={isTradingDisabled}>Sell</button>
            </div>
            <div className="predict-event-order-type-dropdown">
              <button
                className="predict-event-order-type-button"
                disabled={isTradingDisabled}
                onClick={() => {
                  if (isTradingDisabled) return;
                  setIsOrderTypeDropdownOpen(!isOrderTypeDropdownOpen);
                }}
              >
                {orderType}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {isOrderTypeDropdownOpen && !isTradingDisabled && (
                <div className="predict-event-order-type-dropdown-menu">
                  {(['Market', 'Limit'] as const).map((option) => (
                    <div
                      key={option}
                      className={`predict-event-order-type-option ${orderType === option ? 'active' : ''}`}
                      onClick={() => {
                        setOrderType(option);
                        setIsOrderTypeDropdownOpen(false);
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Yes/No Selection */}
          <div className="predict-event-outcome-selection">
            <button
              className={`predict-event-outcome-btn yes ${selectedSide === 'Yes' ? 'active' : ''}`}
              disabled={isTradingDisabled}
              onClick={() => setSelectedSide('Yes')}
            >
              <span className="predict-event-outcome-btn-label">Yes</span>
              {selectedOutcomeData && (
                <span className="predict-event-outcome-btn-price">{(selectedOutcomeData.yesPrice * 100).toFixed(1)}c</span>
              )}
            </button>
            <button
              className={`predict-event-outcome-btn no ${selectedSide === 'No' ? 'active' : ''}`}
              disabled={isTradingDisabled}
              onClick={() => setSelectedSide('No')}
            >
              <span className="predict-event-outcome-btn-label">No</span>
              {selectedOutcomeData && (
                <span className="predict-event-outcome-btn-price">{(selectedOutcomeData.noPrice * 100).toFixed(1)}c</span>
              )}
            </button>
          </div>

          {/* Market Order - Amount Section */}
          {orderType === 'Market' && (
            <>
              <div className="predict-event-amount-section">
                <div className="predict-event-amount-header">
                  <span className="predict-event-amount-label">Amount</span>
                  <div className="predict-event-amount-input-wrapper">
                    <span className="predict-event-amount-currency">$</span>
                    <input
                      type="text"
                      value={amount}
                      disabled={isTradingDisabled}
                      onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="0.00"
                      className="predict-event-amount-input"
                    />
                  </div>
                </div>
                <div className="predict-event-amount-presets">
                  <button onClick={() => handlePreset(1)} disabled={isTradingDisabled}>+$1</button>
                  <button onClick={() => handlePreset(20)} disabled={isTradingDisabled}>+$20</button>
                  <button onClick={() => handlePreset(100)} disabled={isTradingDisabled}>+$100</button>
                  <button onClick={() => setAmount('0')} disabled={isTradingDisabled}>Max</button>
                </div>
              </div>

              {/* Market Order Summary */}
              <div className="predict-event-order-summary">
                <div className="predict-event-summary-row">
                  <span className="predict-event-summary-label">To win</span>
                  <span className="predict-event-summary-value to-win">${toWin}</span>
                </div>
              </div>
            </>
          )}

          {/* Limit Order - Price & Shares Section */}
          {orderType === 'Limit' && (
            <>
              {/* Limit Price */}
              <div className="predict-event-limit-section">
                <div className="predict-event-limit-row">
                  <span className="predict-event-limit-label">Limit Price</span>
                  <div className="predict-event-limit-control">
                    <button
                      className="predict-event-limit-btn"
                      disabled={isTradingDisabled}
                      onClick={() => setLimitPrice(prev => Math.max(0, prev - 1))}
                    >
                      −
                    </button>
                    <span className="predict-event-limit-value">{limitPrice}¢</span>
                    <button
                      className="predict-event-limit-btn"
                      disabled={isTradingDisabled}
                      onClick={() => setLimitPrice(prev => Math.min(99, prev + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Shares */}
              <div className="predict-event-amount-section">
                <div className="predict-event-amount-header">
                  <span className="predict-event-amount-label">Shares</span>
                </div>
                <div className="predict-event-amount-input-wrapper">
                  <input
                    type="text"
                    value={shares}
                    disabled={isTradingDisabled}
                    onChange={(e) => setShares(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    className="predict-event-amount-input predict-event-shares-input"
                  />
                </div>
                <div className="predict-event-amount-presets">
                  <button onClick={() => setShares(prev => String(Math.max(0, Number(prev || 0) - 100)))} disabled={isTradingDisabled}>-100</button>
                  <button onClick={() => setShares(prev => String(Math.max(0, Number(prev || 0) - 10)))} disabled={isTradingDisabled}>-10</button>
                  <button onClick={() => setShares(prev => String(Number(prev || 0) + 10))} disabled={isTradingDisabled}>+10</button>
                  <button onClick={() => setShares(prev => String(Number(prev || 0) + 100))} disabled={isTradingDisabled}>+100</button>
                </div>
              </div>

              {/* Set Expiration */}
              <div className="predict-event-expiration-row">
                <span className="predict-event-expiration-label">Set Expiration</span>
                <button
                  className={`predict-event-toggle ${expirationEnabled ? 'active' : ''}`}
                  disabled={isTradingDisabled}
                  onClick={() => setExpirationEnabled(!expirationEnabled)}
                >
                  <span className="predict-event-toggle-knob" />
                </button>
              </div>

              {/* Total */}
              <div className="predict-event-order-summary">
                <div className="predict-event-summary-row">
                  <span className="predict-event-summary-label">Total</span>
                  <span className="predict-event-summary-value">
                    ${((Number(shares) || 0) * (limitPrice / 100)).toFixed(0)}
                  </span>
                </div>
                <div className="predict-event-summary-row">
                  <span className="predict-event-summary-label">To win</span>
                  <span className="predict-event-summary-value to-win">
                    ${shares || '0'}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Place Order Button */}
          <button
            className="predict-event-place-order-btn"
            disabled={isTradingDisabled || !selectedOutcome || !amount || Number(amount) <= 0}
            onClick={handlePlaceOrder}
          >
            Place {orderType} Buy
          </button>

          <p className="predict-event-terms-text">
            By trading, you agree to the <a href="#">Terms of Use</a>.
          </p>

          {/* Recent Activity */}
          <div className="predict-event-recent-activity">
            <div className="predict-event-activity-header">
              <span className="predict-event-activity-title">Recent Activity</span>
              <button className="predict-event-activity-hide-btn">Hide</button>
            </div>
            <div className="predict-event-activity-tabs">
              <button
                className={`predict-event-activity-tab ${activityTab === 'all' ? 'active' : ''}`}
                onClick={() => setActivityTab('all')}
              >
                All
              </button>
              <button
                className={`predict-event-activity-tab ${activityTab === 'openOrders' ? 'active' : ''}`}
                onClick={() => setActivityTab('openOrders')}
              >
                Open Orders
              </button>
            </div>
            <div className="predict-event-activity-list">
              <div className="predict-event-activity-empty">
                No recent activity
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predict;
