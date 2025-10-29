import React, { useState, useEffect } from 'react';
import closebutton from '../../../assets/close_button.png';
import './MonitorFiltersPopup.css';

export interface MonitorFilterState {
  general: {
    lastTransaction: string;
    tokenAgeMin: string;
    tokenAgeMax: string;
  };
  market: {
    marketCapMin: string;
    marketCapMax: string;
    liquidityMin: string;
    liquidityMax: string;
    holdersMin: string;
    holdersMax: string;
  };
  transactions: {
    transactionCountMin: string;
    transactionCountMax: string;
    inflowVolumeMin: string;
    inflowVolumeMax: string;
    outflowVolumeMin: string;
    outflowVolumeMax: string;
  };
}

interface MonitorFiltersPopupProps {
  onClose: () => void;
  onApply: (filters: MonitorFilterState) => void;
  onSimpleSort?: (sortKey: string | null) => void;
  initialFilters?: MonitorFilterState;
}

const MonitorFiltersPopup: React.FC<MonitorFiltersPopupProps> = ({ 
  onClose, 
  onApply, 
  onSimpleSort,
  initialFilters 
}) => {

  const SIMPLE_PRESETS: Record<string, MonitorFilterState> = {
    latest: {
      general: { lastTransaction: '', tokenAgeMin: '', tokenAgeMax: '' },
      market: { marketCapMin: '', marketCapMax: '', liquidityMin: '', liquidityMax: '', holdersMin: '', holdersMax: '' },
      transactions: { transactionCountMin: '', transactionCountMax: '', inflowVolumeMin: '', inflowVolumeMax: '', outflowVolumeMin: '', outflowVolumeMax: '' }
    },
    marketCap: {
      general: { lastTransaction: '', tokenAgeMin: '', tokenAgeMax: '' },
      market: { marketCapMin: '', marketCapMax: '', liquidityMin: '', liquidityMax: '', holdersMin: '', holdersMax: '' },
      transactions: { transactionCountMin: '', transactionCountMax: '', inflowVolumeMin: '', inflowVolumeMax: '', outflowVolumeMin: '', outflowVolumeMax: '' }
    },
    liquidity: {
      general: { lastTransaction: '', tokenAgeMin: '', tokenAgeMax: '' },
      market: { marketCapMin: '', marketCapMax: '', liquidityMin: '', liquidityMax: '', holdersMin: '', holdersMax: '' },
      transactions: { transactionCountMin: '', transactionCountMax: '', inflowVolumeMin: '', inflowVolumeMax: '', outflowVolumeMin: '', outflowVolumeMax: '' }
    },
    txns: {
      general: { lastTransaction: '', tokenAgeMin: '', tokenAgeMax: '' },
      market: { marketCapMin: '', marketCapMax: '', liquidityMin: '', liquidityMax: '', holdersMin: '', holdersMax: '' },
      transactions: { transactionCountMin: '', transactionCountMax: '', inflowVolumeMin: '', inflowVolumeMax: '', outflowVolumeMin: '', outflowVolumeMax: '' }
    },
    holders: {
      general: { lastTransaction: '', tokenAgeMin: '', tokenAgeMax: '' },
      market: { marketCapMin: '', marketCapMax: '', liquidityMin: '', liquidityMax: '', holdersMin: '', holdersMax: '' },
      transactions: { transactionCountMin: '', transactionCountMax: '', inflowVolumeMin: '', inflowVolumeMax: '', outflowVolumeMin: '', outflowVolumeMax: '' }
    },
    inflow: {
      general: { lastTransaction: '', tokenAgeMin: '', tokenAgeMax: '' },
      market: { marketCapMin: '', marketCapMax: '', liquidityMin: '', liquidityMax: '', holdersMin: '', holdersMax: '' },
      transactions: { transactionCountMin: '', transactionCountMax: '', inflowVolumeMin: '', inflowVolumeMax: '', outflowVolumeMin: '', outflowVolumeMax: '' }
    },
    outflow: {
      general: { lastTransaction: '', tokenAgeMin: '', tokenAgeMax: '' },
      market: { marketCapMin: '', marketCapMax: '', liquidityMin: '', liquidityMax: '', holdersMin: '', holdersMax: '' },
      transactions: { transactionCountMin: '', transactionCountMax: '', inflowVolumeMin: '', inflowVolumeMax: '', outflowVolumeMin: '', outflowVolumeMax: '' }
    },
    tokenAge: {
      general: { lastTransaction: '', tokenAgeMin: '', tokenAgeMax: '' },
      market: { marketCapMin: '', marketCapMax: '', liquidityMin: '', liquidityMax: '', holdersMin: '', holdersMax: '' },
      transactions: { transactionCountMin: '', transactionCountMax: '', inflowVolumeMin: '', inflowVolumeMax: '', outflowVolumeMin: '', outflowVolumeMax: '' }
    }
  };
  const detectSimplePreset = (currentFilters: MonitorFilterState): string | null => {
    if (!currentFilters) return null;
    
    for (const [key, preset] of Object.entries(SIMPLE_PRESETS)) {
      const matches = 
        preset.general.lastTransaction === currentFilters.general.lastTransaction &&
        preset.general.tokenAgeMin === currentFilters.general.tokenAgeMin &&
        preset.general.tokenAgeMax === currentFilters.general.tokenAgeMax &&
        preset.market.marketCapMin === currentFilters.market.marketCapMin &&
        preset.market.liquidityMin === currentFilters.market.liquidityMin &&
        preset.market.holdersMin === currentFilters.market.holdersMin &&
        preset.transactions.transactionCountMin === currentFilters.transactions.transactionCountMin &&
        preset.transactions.inflowVolumeMin === currentFilters.transactions.inflowVolumeMin &&
        preset.transactions.outflowVolumeMin === currentFilters.transactions.outflowVolumeMin;
      
      if (matches) return key;
    }
    return null;
  };
  

  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');
  const [selectedSimpleFilter, setSelectedSimpleFilter] = useState<string | null>(() =>
    detectSimplePreset(initialFilters || {
      general: { lastTransaction: '', tokenAgeMin: '', tokenAgeMax: '' },
      market: { marketCapMin: '', marketCapMax: '', liquidityMin: '', liquidityMax: '', holdersMin: '', holdersMax: '' },
      transactions: { transactionCountMin: '', transactionCountMax: '', inflowVolumeMin: '', inflowVolumeMax: '', outflowVolumeMin: '', outflowVolumeMax: '' },
    })
  );
  const [activeTab, setActiveTab] = useState<'market' | 'transactions'>('market');
  const [filters, setFilters] = useState<MonitorFilterState>(
    initialFilters || {
      general: { lastTransaction: '', tokenAgeMin: '', tokenAgeMax: '' },
      market: { marketCapMin: '', marketCapMax: '', liquidityMin: '', liquidityMax: '', holdersMin: '', holdersMax: '' },
      transactions: { transactionCountMin: '', transactionCountMax: '', inflowVolumeMin: '', inflowVolumeMax: '', outflowVolumeMin: '', outflowVolumeMax: '' },
    }
  );

  const normalize = (v: string) => (v == null ? '' : String(v).trim());

  const computeSimpleFilters = (key: string | null): MonitorFilterState =>
    key && SIMPLE_PRESETS[key]
      ? {
          general: {
            lastTransaction: normalize(SIMPLE_PRESETS[key].general.lastTransaction),
            tokenAgeMin: normalize(SIMPLE_PRESETS[key].general.tokenAgeMin),
            tokenAgeMax: normalize(SIMPLE_PRESETS[key].general.tokenAgeMax)
          },
          market: {
            marketCapMin: normalize(SIMPLE_PRESETS[key].market.marketCapMin),
            marketCapMax: normalize(SIMPLE_PRESETS[key].market.marketCapMax),
            liquidityMin: normalize(SIMPLE_PRESETS[key].market.liquidityMin),
            liquidityMax: normalize(SIMPLE_PRESETS[key].market.liquidityMax),
            holdersMin: normalize(SIMPLE_PRESETS[key].market.holdersMin),
            holdersMax: normalize(SIMPLE_PRESETS[key].market.holdersMax)
          },
          transactions: {
            transactionCountMin: normalize(SIMPLE_PRESETS[key].transactions.transactionCountMin),
            transactionCountMax: normalize(SIMPLE_PRESETS[key].transactions.transactionCountMax),
            inflowVolumeMin: normalize(SIMPLE_PRESETS[key].transactions.inflowVolumeMin),
            inflowVolumeMax: normalize(SIMPLE_PRESETS[key].transactions.inflowVolumeMax),
            outflowVolumeMin: normalize(SIMPLE_PRESETS[key].transactions.outflowVolumeMin),
            outflowVolumeMax: normalize(SIMPLE_PRESETS[key].transactions.outflowVolumeMax)
          }
        }
      : {
          general: { lastTransaction: '', tokenAgeMin: '', tokenAgeMax: '' },
          market: { marketCapMin: '', marketCapMax: '', liquidityMin: '', liquidityMax: '', holdersMin: '', holdersMax: '' },
          transactions: { transactionCountMin: '', transactionCountMax: '', inflowVolumeMin: '', inflowVolumeMax: '', outflowVolumeMin: '', outflowVolumeMax: '' }
  };


  const handleSimpleFilterClick = (t: string) => {
    if (selectedSimpleFilter === t) {
      // Deselect if clicking the same filter
      setSelectedSimpleFilter(null);
      setFilters({
        general: { lastTransaction: '', tokenAgeMin: '', tokenAgeMax: '' },
        market: { marketCapMin: '', marketCapMax: '', liquidityMin: '', liquidityMax: '', holdersMin: '', holdersMax: '' },
        transactions: { transactionCountMin: '', transactionCountMax: '', inflowVolumeMin: '', inflowVolumeMax: '', outflowVolumeMin: '', outflowVolumeMax: '' }
      });
      // Don't call onSimpleSort here - wait for Apply button
    } else {
      setSelectedSimpleFilter(t);
      setFilters(computeSimpleFilters(t));
      // Don't call onSimpleSort here - wait for Apply button
    }
  };

  const handleReset = () => {
    const emptyFilters: MonitorFilterState = {
      general: { lastTransaction: '', tokenAgeMin: '', tokenAgeMax: '' },
      market: {
        marketCapMin: '',
        marketCapMax: '',
        liquidityMin: '',
        liquidityMax: '',
        holdersMin: '',
        holdersMax: ''
      },
      transactions: {
        transactionCountMin: '',
        transactionCountMax: '',
        inflowVolumeMin: '',
        inflowVolumeMax: '',
        outflowVolumeMin: '',
        outflowVolumeMax: ''
      }
    };
    setFilters(emptyFilters);
    setSelectedSimpleFilter(null);
  };

  const handleApply = () => {
    onApply(JSON.parse(JSON.stringify(filters)));
    onSimpleSort?.(selectedSimpleFilter);
    onClose();
  };

  const syncFiltersFromSimple = (presetKey: string | null) => {
    if (presetKey && SIMPLE_PRESETS[presetKey]) {
      setFilters(computeSimpleFilters(presetKey));
    }
  };

  useEffect(() => {
    if (viewMode === 'advanced' && selectedSimpleFilter) {
      syncFiltersFromSimple(selectedSimpleFilter);
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'simple') {
      const detected = detectSimplePreset(filters);
      if (detected !== selectedSimpleFilter) {
        setSelectedSimpleFilter(detected);
      }
    }
  }, [viewMode, filters]);



  return (
    <div className="monitor-filters-backdrop" onClick={onClose}>
      <div className="monitor-filters-container" onClick={(e) => e.stopPropagation()}>
        <div className="monitor-filters-header">
          <h3 className="monitor-filters-title">Monitor Filters</h3>
          <button className="monitor-filters-close" onClick={onClose}>
            <img src={closebutton} className="close-button-icon" alt="Close" />
          </button>
        </div>

        <div className="monitor-filters-content">
          <div className="monitor-filters-view-tabs" data-mode={viewMode}>
            <button
              className={`monitor-filter-view-tab ${viewMode === 'simple' ? 'active' : ''}`}
              onClick={() => setViewMode('simple')}
            >
              Simple
            </button>
            <button
              className={`monitor-filter-view-tab ${viewMode === 'advanced' ? 'active' : ''}`}
              onClick={() => setViewMode('advanced')}
            >
              Advanced
            </button>
          </div>

          {viewMode === 'simple' ? (
            <div className="monitor-filters-simple-list">
              <button 
                className={`monitor-simple-sort-option ${selectedSimpleFilter === 'latest' ? 'active' : ''}`}
                onClick={() => handleSimpleFilterClick('latest')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Latest
              </button>
              <button 
                className={`monitor-simple-sort-option ${selectedSimpleFilter === 'marketCap' ? 'active' : ''}`}
                onClick={() => handleSimpleFilterClick('marketCap')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Market Cap
              </button>
              <button
                className={`monitor-simple-sort-option ${selectedSimpleFilter === 'liquidity' ? 'active' : ''}`}
                onClick={() => handleSimpleFilterClick('liquidity')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
                Liquidity
              </button>
              <button
                className={`monitor-simple-sort-option ${selectedSimpleFilter === 'txns' ? 'active' : ''}`}
                onClick={() => handleSimpleFilterClick('txns')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Txns
              </button>
              <button
                className={`monitor-simple-sort-option ${selectedSimpleFilter === 'holders' ? 'active' : ''}`}
                onClick={() => handleSimpleFilterClick('holders')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Num Holders
              </button>
              <button
                className={`monitor-simple-sort-option ${selectedSimpleFilter === 'inflow' ? 'active' : ''}`}
                onClick={() => handleSimpleFilterClick('inflow')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
                Inflow
              </button>
              <button
                className={`monitor-simple-sort-option ${selectedSimpleFilter === 'outflow' ? 'active' : ''}`}
                onClick={() => handleSimpleFilterClick('outflow')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
                Outflow
              </button>
              <button
                className={`monitor-simple-sort-option ${selectedSimpleFilter === 'tokenAge' ? 'active' : ''}`}
                onClick={() => handleSimpleFilterClick('tokenAge')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Token Age
              </button>
            </div>
          ) : (
            <>
              <div className="monitor-filters-section">

                <div className="monitor-filter-group">
                  <label className="monitor-filter-label">Last Transaction</label>
                  <div className="monitor-filter-input-wrapper">
                    <input
                      type="text"
                      placeholder="Any time"
                      value={filters.general.lastTransaction}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          general: { ...prev.general, lastTransaction: e.target.value },
                        }))
                      }
                      className="monitor-filter-input"
                    />
                    <span className="monitor-filter-input-suffix">sec ago</span>
                  </div>
                </div>

                <div className="monitor-filter-group">
                  <label className="monitor-filter-label">Token Age</label>
                  <div className="monitor-filter-range">
                    <div className="monitor-filter-input-wrapper">
                      <input
                        type="text"
                        placeholder="Min"
                        value={filters.general.tokenAgeMin}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            general: { ...prev.general, tokenAgeMin: e.target.value },
                          }))
                        }
                        className="monitor-filter-input"
                      />
                      <span className="monitor-filter-input-suffix">min ago</span>
                    </div>
                    <div className="monitor-filter-input-wrapper">
                      <input
                        type="text"
                        placeholder="Max"
                        value={filters.general.tokenAgeMax}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            general: { ...prev.general, tokenAgeMax: e.target.value },
                          }))
                        }
                        className="monitor-filter-input"
                      />
                      <span className="monitor-filter-input-suffix">hr ago</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="monitor-filters-tabs" data-tab={activeTab}>
                <button
                  className={`monitor-filter-tab ${activeTab === 'market' ? 'active' : ''}`}
                  onClick={() => setActiveTab('market')}
                >
                  Market
                </button>
                <button
                  className={`monitor-filter-tab ${activeTab === 'transactions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('transactions')}
                >
                  Transactions
                </button>
              </div>

              {activeTab === 'market' && (
                <>
                  <div className="monitor-filter-group">
                    <label className="monitor-filter-label">Market Cap</label>
                    <div className="monitor-filter-range">
                      <div className="monitor-filter-input-wrapper">
                        <input
                          type="text"
                          placeholder="Min"
                          value={filters.market.marketCapMin}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              market: { ...prev.market, marketCapMin: e.target.value },
                            }))
                          }
                          className="monitor-filter-input"
                        />
                        <span className="monitor-filter-input-suffix">MON</span>
                      </div>
                      <div className="monitor-filter-input-wrapper">
                        <input
                          type="text"
                          placeholder="Max"
                          value={filters.market.marketCapMax}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              market: { ...prev.market, marketCapMax: e.target.value },
                            }))
                          }
                          className="monitor-filter-input"
                        />
                        <span className="monitor-filter-input-suffix">MON</span>
                      </div>
                    </div>
                  </div>

                  <div className="monitor-filter-group">
                    <label className="monitor-filter-label">Liquidity</label>
                    <div className="monitor-filter-range">
                      <div className="monitor-filter-input-wrapper">
                        <input
                          type="text"
                          placeholder="Min"
                          value={filters.market.liquidityMin}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              market: { ...prev.market, liquidityMin: e.target.value },
                            }))
                          }
                          className="monitor-filter-input"
                        />
                        <span className="monitor-filter-input-suffix">MON</span>
                      </div>
                      <div className="monitor-filter-input-wrapper">
                        <input
                          type="text"
                          placeholder="Max"
                          value={filters.market.liquidityMax}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              market: { ...prev.market, liquidityMax: e.target.value },
                            }))
                          }
                          className="monitor-filter-input"
                        />
                        <span className="monitor-filter-input-suffix">MON</span>
                      </div>
                    </div>
                  </div>

                  <div className="monitor-filter-group">
                    <label className="monitor-filter-label">Holders</label>
                    <div className="monitor-filter-range">
                      <div className="monitor-filter-input-wrapper">
                        <input
                          type="text"
                          placeholder="Min"
                          value={filters.market.holdersMin}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              market: { ...prev.market, holdersMin: e.target.value },
                            }))
                          }
                          className="monitor-filter-input"
                        />
                      </div>
                      <div className="monitor-filter-input-wrapper">
                        <input
                          type="text"
                          placeholder="Max"
                          value={filters.market.holdersMax}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              market: { ...prev.market, holdersMax: e.target.value },
                            }))
                          }
                          className="monitor-filter-input"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'transactions' && (
                <>
                  <div className="monitor-filter-group">
                    <label className="monitor-filter-label">Transaction Count</label>
                    <div className="monitor-filter-range">
                      <div className="monitor-filter-input-wrapper">
                        <input
                          type="text"
                          placeholder="Min"
                          value={filters.transactions.transactionCountMin}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              transactions: { ...prev.transactions, transactionCountMin: e.target.value },
                            }))
                          }
                          className="monitor-filter-input"
                        />
                      </div>
                      <div className="monitor-filter-input-wrapper">
                        <input
                          type="text"
                          placeholder="Max"
                          value={filters.transactions.transactionCountMax}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              transactions: { ...prev.transactions, transactionCountMax: e.target.value },
                            }))
                          }
                          className="monitor-filter-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="monitor-filter-group">
                    <label className="monitor-filter-label">Inflow Volume</label>
                    <div className="monitor-filter-range">
                      <div className="monitor-filter-input-wrapper">
                        <input
                          type="text"
                          placeholder="Min"
                          value={filters.transactions.inflowVolumeMin}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              transactions: { ...prev.transactions, inflowVolumeMin: e.target.value },
                            }))
                          }
                          className="monitor-filter-input"
                        />
                        <span className="monitor-filter-input-suffix">MON</span>
                      </div>
                      <div className="monitor-filter-input-wrapper">
                        <input
                          type="text"
                          placeholder="Max"
                          value={filters.transactions.inflowVolumeMax}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              transactions: { ...prev.transactions, inflowVolumeMax: e.target.value },
                            }))
                          }
                          className="monitor-filter-input"
                        />
                        <span className="monitor-filter-input-suffix">MON</span>
                      </div>
                    </div>
                  </div>

                  <div className="monitor-filter-group">
                    <label className="monitor-filter-label">Outflow Volume</label>
                    <div className="monitor-filter-range">
                      <div className="monitor-filter-input-wrapper">
                        <input
                          type="text"
                          placeholder="Min"
                          value={filters.transactions.outflowVolumeMin}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              transactions: { ...prev.transactions, outflowVolumeMin: e.target.value },
                            }))
                          }
                          className="monitor-filter-input"
                        />
                        <span className="monitor-filter-input-suffix">MON</span>
                      </div>
                      <div className="monitor-filter-input-wrapper">
                        <input
                          type="text"
                          placeholder="Max"
                          value={filters.transactions.outflowVolumeMax}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              transactions: { ...prev.transactions, outflowVolumeMax: e.target.value },
                            }))
                          }
                          className="monitor-filter-input"
                        />
                        <span className="monitor-filter-input-suffix">MON</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          
        </div>

        <div className="monitor-filters-footer">
          <button className="monitor-filters-reset-button" onClick={handleReset}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          </button>
          <button className="monitor-filters-apply-button" onClick={handleApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonitorFiltersPopup;