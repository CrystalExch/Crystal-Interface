import React, { useState } from 'react';
import closebutton from '../../../assets/close_button.png';
import './LiveTradesFiltersPopup.css';

export interface LiveTradesFiltersPopupProps {
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export interface FilterState {
  transactionTypes: {
    buyMore: boolean;
    firstBuy: boolean;
    sellPartial: boolean;
    sellAll: boolean;
    addLiquidity: boolean;
    removeLiquidity: boolean;
  };
  marketCap: {
    min: string;
    max: string;
  };
  transactionAmount: {
    min: string;
    max: string;
  };
  tokenAge: {
    min: string;
    max: string;
  };
}

const LiveTradesFiltersPopup: React.FC<LiveTradesFiltersPopupProps> = ({ onClose, onApply, initialFilters }) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters || {
    transactionTypes: {
      buyMore: true,
      firstBuy: true,
      sellPartial: true,
      sellAll: true,
      addLiquidity: true,
      removeLiquidity: true,
    },
    marketCap: {
      min: '',
      max: '',
    },
    transactionAmount: {
      min: '',
      max: '',
    },
    tokenAge: {
      min: '',
      max: '',
    },
  });

  const handleTransactionTypeToggle = (type: keyof FilterState['transactionTypes']) => {
    setFilters(prev => ({
      ...prev,
      transactionTypes: {
        ...prev.transactionTypes,
        [type]: !prev.transactionTypes[type],
      },
    }));
  };

  const handleRangeChange = (
    category: 'marketCap' | 'transactionAmount' | 'tokenAge',
    field: 'min' | 'max',
    value: string
  ) => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleReset = () => {
    setFilters({
      transactionTypes: {
        buyMore: true,
        firstBuy: true,
        sellPartial: true,
        sellAll: true,
        addLiquidity: true,
        removeLiquidity: true,
      },
      marketCap: {
        min: '',
        max: '',
      },
      transactionAmount: {
        min: '',
        max: '',
      },
      tokenAge: {
        min: '',
        max: '',
      },
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <div className="live-trades-filters-backdrop" onClick={onClose}>
      <div className="live-trades-filters-container" onClick={(e) => e.stopPropagation()}>
        <div className="live-trades-filters-header">
          <h3 className="live-trades-filters-title">Live Trades Filters</h3>
          <button className="live-trades-filters-close" onClick={onClose}>
            <img src={closebutton} className="close-button-icon" alt="Close" />
          </button>
        </div>

        <div className="live-trades-filters-content">
          {/* Transaction Types */}
          <div className="live-trades-filters-section">
            <h4 className="live-trades-filters-section-title">Transaction Types</h4>
            
            <div className="live-trades-filters-checkboxes">
              <label className="live-trades-filters-checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.transactionTypes.buyMore}
                  onChange={() => handleTransactionTypeToggle('buyMore')}
                  className="live-trades-filters-checkbox"
                />
                <span className="live-trades-filters-checkbox-text">Buy More</span>
              </label>

              <label className="live-trades-filters-checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.transactionTypes.firstBuy}
                  onChange={() => handleTransactionTypeToggle('firstBuy')}
                  className="live-trades-filters-checkbox"
                />
                <span className="live-trades-filters-checkbox-text">First Buy</span>
              </label>

              <label className="live-trades-filters-checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.transactionTypes.sellPartial}
                  onChange={() => handleTransactionTypeToggle('sellPartial')}
                  className="live-trades-filters-checkbox"
                />
                <span className="live-trades-filters-checkbox-text">Sell Partial</span>
              </label>

              <label className="live-trades-filters-checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.transactionTypes.sellAll}
                  onChange={() => handleTransactionTypeToggle('sellAll')}
                  className="live-trades-filters-checkbox"
                />
                <span className="live-trades-filters-checkbox-text">Sell All</span>
              </label>

              <label className="live-trades-filters-checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.transactionTypes.addLiquidity}
                  onChange={() => handleTransactionTypeToggle('addLiquidity')}
                  className="live-trades-filters-checkbox"
                />
                <span className="live-trades-filters-checkbox-text">Add Liquidity</span>
              </label>

              <label className="live-trades-filters-checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.transactionTypes.removeLiquidity}
                  onChange={() => handleTransactionTypeToggle('removeLiquidity')}
                  className="live-trades-filters-checkbox"
                />
                <span className="live-trades-filters-checkbox-text">Remove Liquidity</span>
              </label>
            </div>
          </div>

          {/* Market Cap */}
          <div className="live-trades-filters-section">
            <h4 className="live-trades-filters-section-title">Market Cap (USD)</h4>
            <div className="live-trades-filters-range">
              <div className="live-trades-filters-input-wrapper">
                <input
                  type="text"
                  placeholder="Min"
                  value={filters.marketCap.min}
                  onChange={(e) => handleRangeChange('marketCap', 'min', e.target.value)}
                  className="live-trades-filters-input"
                />
                <span className="live-trades-filters-input-suffix">USD</span>
              </div>
              <div className="live-trades-filters-input-wrapper">
                <input
                  type="text"
                  placeholder="Max"
                  value={filters.marketCap.max}
                  onChange={(e) => handleRangeChange('marketCap', 'max', e.target.value)}
                  className="live-trades-filters-input"
                />
                <span className="live-trades-filters-input-suffix">USD</span>
              </div>
            </div>
          </div>

          {/* Transaction Amount */}
          <div className="live-trades-filters-section">
            <h4 className="live-trades-filters-section-title">Transaction Amount (MON)</h4>
            <div className="live-trades-filters-range">
              <div className="live-trades-filters-input-wrapper">
                <input
                  type="text"
                  placeholder="Min"
                  value={filters.transactionAmount.min}
                  onChange={(e) => handleRangeChange('transactionAmount', 'min', e.target.value)}
                  className="live-trades-filters-input"
                />
                <span className="live-trades-filters-input-suffix">MON</span>
              </div>
              <div className="live-trades-filters-input-wrapper">
                <input
                  type="text"
                  placeholder="Max"
                  value={filters.transactionAmount.max}
                  onChange={(e) => handleRangeChange('transactionAmount', 'max', e.target.value)}
                  className="live-trades-filters-input"
                />
                <span className="live-trades-filters-input-suffix">MON</span>
              </div>
            </div>
          </div>

          {/* Token Age */}
          <div className="live-trades-filters-section">
            <h4 className="live-trades-filters-section-title">Token Age (Minutes)</h4>
            <div className="live-trades-filters-range">
              <div className="live-trades-filters-input-wrapper">
                <input
                  type="text"
                  placeholder="Min"
                  value={filters.tokenAge.min}
                  onChange={(e) => handleRangeChange('tokenAge', 'min', e.target.value)}
                  className="live-trades-filters-input"
                />
                <span className="live-trades-filters-input-suffix">min</span>
              </div>
              <div className="live-trades-filters-input-wrapper">
                <input
                  type="text"
                  placeholder="Max"
                  value={filters.tokenAge.max}
                  onChange={(e) => handleRangeChange('tokenAge', 'max', e.target.value)}
                  className="live-trades-filters-input"
                />
                <span className="live-trades-filters-input-suffix">min</span>
              </div>
            </div>
          </div>
        </div>

        <div className="live-trades-filters-footer">
          <button className="live-trades-filters-reset-button" onClick={handleReset}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
          </button>
          <button className="live-trades-filters-apply-button" onClick={handleApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveTradesFiltersPopup;