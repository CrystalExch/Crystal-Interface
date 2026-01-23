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
  windowWidth: number;
  mobileView: boolean;
  perpsActiveMarketKey: string;
  setperpsActiveMarketKey: (key: string) => void;
  perpsMarketsData: Record<string, any>;
  setPerpsMarketsData: (data: any) => void;
  address?: string;
  router?: any;
  refetch?: () => void;
  setpopup?: (value: number) => void;
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

  // Chart state
  const [selectedInterval, setSelectedInterval] = useState<IntervalType>('ALL');
  const [chartData, setChartData] = useState<Record<string, { time: number; value: number }[]>>({});

  // Order state
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<'Yes' | 'No'>('Yes');
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState<'Market' | 'Limit'>('Market');
  const [isOrderTypeDropdownOpen, setIsOrderTypeDropdownOpen] = useState(false);

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

  // Fetch market data when marketSlug changes
  useEffect(() => {
    if (marketSlug) {
      const fetchMarketData = async () => {
        try {
          const response = await fetch(`/predictapi/events?slug=${marketSlug}`);
          const data = await response.json();

          if (data && data.length > 0) {
            const event = data[0];
            const markets = event.markets || [];

            if (markets.length > 0) {
              const market = markets[0];
              const conditionId = market.conditionId;
              const tokenID = market.tokenID || market.tokens?.[0]?.token_id;

              setperpsActiveMarketKey(conditionId);

              const outcomePrices = typeof market.outcomePrices === 'string'
                ? JSON.parse(market.outcomePrices)
                : market.outcomePrices || [];

              // Fetch series data for chart
              const seriesResponse = await fetch(`/clob/series?id=${conditionId}`).catch(() => null);
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

              // Build market data
              const marketData = {
                contractId: conditionId,
                baseAsset: event.title || market.question,
                quoteAsset: 'USD',
                lastPrice: parseFloat(outcomePrices[0] || 0),
                value: market.volume || market.volume24hr || 0,
                liquidity: market.liquidity || 0,
                outcomes: markets.length > 1
                  ? markets.map((m: any) => m.question || m.groupItemTitle)
                  : (typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes) || ['Yes', 'No'],
                outcomePrices: markets.length > 1
                  ? markets.map((m: any) => {
                      const prices = typeof m.outcomePrices === 'string' ? JSON.parse(m.outcomePrices) : m.outcomePrices || [];
                      return parseFloat(prices[0] || 0);
                    })
                  : outcomePrices.map((p: any) => parseFloat(p || 0)),
                eventTitle: event.title,
                eventSlug: event.slug,
                iconURL: event.image || event.icon,
                question: market.question,
                endDate: market.endDate,
                startDate: market.startDate || market.creationDate,
                enableDisplay: true,
                active: market.active,
                tokenID: tokenID,
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
              if (marketData.outcomes?.length > 0 && !selectedOutcome) {
                setSelectedOutcome(marketData.outcomes[0]);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching market data:', error);
        }
      };

      fetchMarketData();
    }
  }, [marketSlug, setperpsActiveMarketKey, setPerpsMarketsData]);

  // Process outcomes data
  const outcomes: OutcomeData[] = useMemo(() => {
    const outcomeLabels = Array.isArray(activeMarket?.outcomes) ? activeMarket.outcomes : ['Yes', 'No'];
    const outcomePrices = Array.isArray(activeMarket?.outcomePrices) ? activeMarket.outcomePrices : [0.5, 0.5];
    const markets = activeMarket?.markets || [];

    return outcomeLabels.map((label: string, idx: number) => {
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
  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
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

  return (
    <div className="predict-page">
      {/* HEADER */}
      <div className="prediction-header">
        <div className="prediction-header-left">
          <div className="prediction-image">
            {eventImage ? (
              <img src={eventImage} alt={eventTitle} />
            ) : (
              <span>{eventTitle.charAt(0)}</span>
            )}
          </div>
          <div className="prediction-info">
            {eventTags.length > 0 && (
              <div className="prediction-tags">
                {eventTags.slice(0, 3).map((tag: any, idx: number) => (
                  <span key={idx} className="prediction-tag">
                    {tag.label || tag.name || tag}
                  </span>
                ))}
              </div>
            )}
            <h1 className="prediction-title">{eventTitle}</h1>
          </div>
        </div>
        <div className="prediction-header-stats">
          <div className="prediction-stat">
            <span className="stat-value">{formatVolume(volume24h)}</span>
            <span className="stat-label">Vol</span>
          </div>
          <div className="prediction-stat">
            <span className="stat-value">{formatDate(endDate)}</span>
            <span className="stat-label">End Date</span>
          </div>
          {countdown && (
            <div className="prediction-stat countdown-stat">
              <span className="stat-value countdown-value">{countdown}</span>
            </div>
          )}
        </div>
      </div>

      <div className="predict-main-content">
        {/* LEFT PANEL */}
        <div className="predict-left-panel">
          {/* Chart Section */}
          <div className="chart-section">
            {/* Chart Legend */}
            <div className="chart-legend">
              {outcomes.map((outcome, idx) => (
                <div key={outcome.name} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: outcome.color }} />
                  <span className="legend-name">{outcome.name}</span>
                  <span className="legend-value">{(outcome.probability * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>

            {/* Chart Container */}
            <div className="chart-container" ref={chartContainerRef} />

            {/* Interval Selector */}
            <div className="interval-selector">
              {(['1H', '24H', '7D', '30D', 'ALL'] as IntervalType[]).map(interval => (
                <button
                  key={interval}
                  className={`interval-btn ${selectedInterval === interval ? 'active' : ''}`}
                  onClick={() => setSelectedInterval(interval)}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>

          {/* Outcomes Table */}
          <div className="outcomes-table">
            <div className="outcomes-header">
              <div
                className="outcome-col outcome-name-col"
                onClick={() => handleSort('name')}
              >
                OUTCOME
                {sortConfig.column === 'name' && (
                  <span className="sort-arrow">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
              <div
                className="outcome-col outcome-prob-col"
                onClick={() => handleSort('probability')}
              >
                % CHANCE
                {sortConfig.column === 'probability' && (
                  <span className="sort-arrow">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
              <div className="outcome-col outcome-actions-col">
                {/* Empty header for actions */}
              </div>
            </div>
            <div className="outcomes-body">
              {sortedOutcomes.map(outcome => (
                <div
                  key={outcome.name}
                  className={`outcome-row ${selectedOutcome === outcome.name ? 'selected' : ''}`}
                  onClick={() => setSelectedOutcome(outcome.name)}
                >
                  <div className="outcome-col outcome-name-col">
                    <span className="outcome-label">{outcome.name}</span>
                    <span className="outcome-volume">{formatVolume(outcome.volume)} Vol</span>
                  </div>
                  <div className="outcome-col outcome-prob-col">
                    <span className="probability-value">{(outcome.probability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="outcome-col outcome-actions-col">
                    <button
                      className="buy-yes-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOutcome(outcome.name);
                        setSelectedSide('Yes');
                      }}
                    >
                      Buy Yes {(outcome.yesPrice * 100).toFixed(1)}c
                    </button>
                    <button
                      className="buy-no-btn"
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
        <div className="predict-right-panel">
          {/* Selected Outcome */}
          {selectedOutcomeData && (
            <div className="selected-outcome-display">
              <div className="selected-outcome-image">
                {eventImage ? (
                  <img src={eventImage} alt={selectedOutcomeData.name} />
                ) : (
                  <span>{selectedOutcomeData.name.charAt(0)}</span>
                )}
              </div>
              <span className="selected-outcome-name">{selectedOutcomeData.name}</span>
            </div>
          )}

          {/* Buy/Sell Toggle + Order Type */}
          <div className="trade-header-row">
            <div className="trade-toggle">
              <button className="trade-toggle-btn buy active">Buy</button>
              <button className="trade-toggle-btn sell">Sell</button>
            </div>
            <div className="order-type-dropdown">
              <button
                className="order-type-button"
                onClick={() => setIsOrderTypeDropdownOpen(!isOrderTypeDropdownOpen)}
              >
                {orderType}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {isOrderTypeDropdownOpen && (
                <div className="order-type-dropdown-menu">
                  {(['Market', 'Limit'] as const).map((option) => (
                    <div
                      key={option}
                      className={`order-type-option ${orderType === option ? 'active' : ''}`}
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
          <div className="outcome-selection">
            <button
              className={`outcome-btn yes ${selectedSide === 'Yes' ? 'active' : ''}`}
              onClick={() => setSelectedSide('Yes')}
            >
              <span className="outcome-btn-label">Yes</span>
              {selectedOutcomeData && (
                <span className="outcome-btn-price">{(selectedOutcomeData.yesPrice * 100).toFixed(1)}c</span>
              )}
            </button>
            <button
              className={`outcome-btn no ${selectedSide === 'No' ? 'active' : ''}`}
              onClick={() => setSelectedSide('No')}
            >
              <span className="outcome-btn-label">No</span>
              {selectedOutcomeData && (
                <span className="outcome-btn-price">{(selectedOutcomeData.noPrice * 100).toFixed(1)}c</span>
              )}
            </button>
          </div>

          {/* Amount Section */}
          <div className="amount-section">
            <div className="amount-header">
              <span className="amount-label">Amount</span>
              <span className="balance-display">Balance $0.00</span>
            </div>
            <div className="amount-input-wrapper">
              <span className="amount-currency">$</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                className="amount-input"
              />
            </div>
            <div className="amount-presets">
              <button onClick={() => handlePreset(2)}>+$2</button>
              <button onClick={() => handlePreset(20)}>+$20</button>
              <button onClick={() => handlePreset(100)}>+$100</button>
              <button onClick={() => setAmount('0')}>Max</button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <div className="summary-row">
              <span className="summary-label">To win</span>
              <span className="summary-value to-win">${toWin}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Avg. Price</span>
              <span className="summary-value">
                {selectedOutcomeData
                  ? `${((selectedSide === 'Yes' ? selectedOutcomeData.yesPrice : selectedOutcomeData.noPrice) * 100).toFixed(1)}c`
                  : '--'
                }
              </span>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            className="place-order-btn"
            disabled={!selectedOutcome || !amount || Number(amount) <= 0}
            onClick={handlePlaceOrder}
          >
            Place {orderType} Buy
          </button>

          <p className="terms-text">
            By trading, you agree to the <a href="#">Terms of Use</a>.
          </p>

          {/* Recent Activity */}
          <div className="recent-activity">
            <div className="activity-header">
              <span className="activity-title">Recent Activity</span>
              <button className="activity-hide-btn">Hide</button>
            </div>
            <div className="activity-tabs">
              <button
                className={`activity-tab ${activityTab === 'all' ? 'active' : ''}`}
                onClick={() => setActivityTab('all')}
              >
                All
              </button>
              <button
                className={`activity-tab ${activityTab === 'openOrders' ? 'active' : ''}`}
                onClick={() => setActivityTab('openOrders')}
              >
                Open Orders
              </button>
            </div>
            <div className="activity-list">
              <div className="activity-empty">
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
