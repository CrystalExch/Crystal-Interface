import React, { useState } from 'react';
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
}

interface MonitorFiltersPopupProps {
  onClose: () => void;
  onApply: (filters: MonitorFilterState) => void;
  initialFilters?: MonitorFilterState;
}

const MonitorFiltersPopup: React.FC<MonitorFiltersPopupProps> = ({ 
  onClose, 
  onApply, 
  initialFilters 
}) => {
  const [activeTab, setActiveTab] = useState<'market' | 'transactions'>('market');
  const [filters, setFilters] = useState<MonitorFilterState>(
    initialFilters || {
      general: {
        lastTransaction: '',
        tokenAgeMin: '',
        tokenAgeMax: '',
      },
      market: {
        marketCapMin: '',
        marketCapMax: '',
        liquidityMin: '',
        liquidityMax: '',
        holdersMin: '',
        holdersMax: '',
      },
    }
  );

  const handleReset = () => {
    setFilters({
      general: {
        lastTransaction: '',
        tokenAgeMin: '',
        tokenAgeMax: '',
      },
      market: {
        marketCapMin: '',
        marketCapMax: '',
        liquidityMin: '',
        liquidityMax: '',
        holdersMin: '',
        holdersMax: '',
      },
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

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
          <div className="monitor-filters-section">
            <h4 className="monitor-filters-section-title">General</h4>

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

          <div className="monitor-filters-tabs">
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
                    <span className="monitor-filter-input-suffix">SOL</span>
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
                    <span className="monitor-filter-input-suffix">SOL</span>
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
                    <span className="monitor-filter-input-suffix">SOL</span>
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
                    <span className="monitor-filter-input-suffix">SOL</span>
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