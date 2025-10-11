import React, { useEffect, useState } from 'react';
import closebutton from '../../../assets/close_button.png';
import reset from '../../../assets/reset.svg';
interface TransactionFilters {
  makerAddress: string;
  minUSD: string;
  maxUSD: string;
}

interface TransactionFiltersPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: TransactionFilters) => void;
  currentFilters: TransactionFilters;
}

const TransactionFiltersPopup: React.FC<TransactionFiltersPopupProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}) => {
  const [filters, setFilters] = useState<TransactionFilters>(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const handleReset = () => {
    const resetFilters: TransactionFilters = {
      makerAddress: '',
      minUSD: '',
      maxUSD: '',
    };
    setFilters(resetFilters);
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleInputChange = (
    field: keyof TransactionFilters,
    value: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="trades-filters-popup-overlay" onClick={onClose}>
      <div
        className="trades-filters-popup"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="explorer-filters-header">
          <h3 className="filters-title">Transactions Filter</h3>
          <button className="filters-close-button" onClick={onClose}>
            <img
              src={closebutton}
              className="explorer-close-button"
              alt="Close"
            />
          </button>
        </div>

        <div className="trades-filters-content">
          <div className="filter-row">
            <div className="filter-label">Maker Address</div>
            <div className="filter-inputs">
              <input
                type="text"
                className="filter-input"
                placeholder="Enter Maker Address"
                value={filters.makerAddress}
                onChange={(e) =>
                  handleInputChange('makerAddress', e.target.value)
                }
              />
            </div>
          </div>
          <div className="trades-filter-group">
            <div className="filter-row">
              <div className="filter-label">Min Value</div>
              <div className="filter-inputs">
                <input
                  type="number"
                  className="filter-input"
                  placeholder="Enter min value"
                  value={filters.minUSD}
                  onChange={(e) => handleInputChange('minUSD', e.target.value)}
                />
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-label">Max Value</div>
              <div className="filter-inputs">
                <input
                  type="number"
                  className="filter-input"
                  placeholder="Enter max value"
                  value={filters.maxUSD}
                  onChange={(e) => handleInputChange('maxUSD', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="filters-actions">
          <div className="action-buttons-left">
            <button className="trades-reset-button" onClick={handleReset}>
              <img src={reset} alt="Reset" className="trades-reset-icon" />
              Reset
            </button>
          </div>
          <div className="action-buttons-right">
            <button className="apply-button" onClick={handleApply}>
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionFiltersPopup;
