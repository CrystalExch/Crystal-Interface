import React, { useState, useRef, useEffect } from 'react';
import ToggleSwitch from '../../ToggleSwitch/ToggleSwitch';
import TooltipLabel from '../../TooltipLabel/TooltipLabel';
import FilterSelect from '../FilterSelect/FilterSelect';
import './MinSizeFilter.css';
import dotsicon from '../../../assets/dots_icon.png';

interface MinSizeFilterProps {
  minSizeEnabled: boolean;
  setMinSizeEnabled: (enabled: boolean) => void;
  minSizeValue: string;
  setMinSizeValue: (value: string) => void;
  onlyThisMarket?: boolean;
  setOnlyThisMarket?: (onlyThisMarket: boolean) => void;
  filter?: 'all' | 'buy' | 'sell';
  setFilter?: any;
  hideMarketFilter?: boolean;
  showMarketFilter?: boolean;
  showTypeFilter?: boolean;
  showSizeFilter?: boolean;
  alwaysShowButton?: boolean;
}

const MinSizeFilter: React.FC<MinSizeFilterProps> = ({
  minSizeEnabled,
  setMinSizeEnabled,
  minSizeValue,
  setMinSizeValue,
  onlyThisMarket,
  setOnlyThisMarket,
  filter,
  setFilter,
  hideMarketFilter = false,
  showMarketFilter = true,
  showTypeFilter = true,
  showSizeFilter = true,
  alwaysShowButton = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setMinSizeValue(value);
    }
  };

  const handleToggleChange = () => {
    setMinSizeEnabled(!minSizeEnabled);
    if (!minSizeEnabled) {
      localStorage.setItem('crystal_min_size_enabled', 'true');
      localStorage.setItem('crystal_min_size_value', minSizeValue);
    } else {
      localStorage.setItem('crystal_min_size_enabled', 'false');
    }
  };

  const handleMarketToggleChange = () => {
    if (setOnlyThisMarket && onlyThisMarket !== undefined) {
      localStorage.setItem(
        'crystal_only_this_market',
        JSON.stringify(!onlyThisMarket),
      );
      setOnlyThisMarket(!onlyThisMarket);
    }
  };

  useEffect(() => {
    if (minSizeEnabled) {
      localStorage.setItem('crystal_min_size_value', minSizeValue);
    }
  }, [minSizeValue, minSizeEnabled]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        buttonRef.current && 
        !dropdownRef.current.contains(event.target as Node) && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const shouldShowButton = alwaysShowButton || 
                          (showTypeFilter && filter !== undefined) || 
                          (showMarketFilter && !hideMarketFilter && onlyThisMarket !== undefined) || 
                          showSizeFilter;

  return (
    <div className="min-size-filter-container">
      {shouldShowButton && (
        <div 
          ref={buttonRef}
          className="min-size-filter-button" 
          onClick={toggleDropdown}
        >
          <img className="min-size-filter-dots" src={dotsicon} alt="Filters" />
        </div>
      )}
      
      {isOpen && (
        <div 
          ref={dropdownRef} 
          className={`min-size-filter-dropdown ${isOpen ? 'open' : ''}`}
          style={{ 
            maxHeight: isOpen ? '500px' : '0',
            opacity: isOpen ? '1' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease, opacity 0.3s ease',
            width: '240px'
          }}
        >
          <>
            {showTypeFilter && filter !== undefined && setFilter && (
              <div className="market-type-filter-section">
                <div className="filter-section-header">
                  {t("orderType")}
                </div>
                <div className="filter-section-content filter-dropdown-wrapper">
                  <FilterSelect filter={filter} setFilter={setFilter} inDropdown={true} />
                </div>
              </div>
            )}
            
            {showMarketFilter && !hideMarketFilter && onlyThisMarket !== undefined && setOnlyThisMarket && (
              <>
                <div className={`only-filter-section ${!showTypeFilter ? '' : ''}`}>
                  <div className="filter-section-content">
                    <ToggleSwitch
                      checked={onlyThisMarket}
                      onChange={handleMarketToggleChange}
                      label={
                        <TooltipLabel
                          label={t('onlyCurrentMarket')}
                          tooltipText={
                            <div>
                              <div className="tooltip-description">
                                {t('onlyCurrentMarketHelp')}
                              </div>
                            </div>
                          }
                        />
                      }
                    />
                  </div>
                </div>
              </>
            )}

            <div className={`filter-section ${(!showTypeFilter && !showMarketFilter) ? '' : ''}`}>
              <div className="min-size-filter-section-header">
                {t("minimumSize")}
              </div>
              <div className="filter-section-content">
                <div className="min-size-input-container">
                  <div className="min-size-input-wrapper">
                    <input
                      inputMode="decimal"
                      type="text"
                      value={minSizeValue}
                      onChange={handleInputChange}
                      placeholder="Enter minimum size"
                      className="min-size-input"
                    />
                    {minSizeValue !== '' && <span className="min-size-currency">USDC</span>}
                  </div>
                </div>
                <div className="min-size-toggle-container">
                  <ToggleSwitch
                    checked={minSizeEnabled}
                    onChange={handleToggleChange}
                    label={
                      <span className="min-size-toggle-label">
                        {t("enableFilter")}
                      </span>
                    }
                  />
                </div>
              </div>
            </div>
          </>
        </div>  
      )}
    </div>
  );
};

export default MinSizeFilter;