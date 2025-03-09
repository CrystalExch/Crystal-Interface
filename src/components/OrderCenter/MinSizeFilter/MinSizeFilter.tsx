import React, { useState, useRef, useEffect } from 'react';
import ToggleSwitch from '../../ToggleSwitch/ToggleSwitch';
import './MinSizeFilter.css';
import dotsicon from '../../../assets/dots_icon.png';

interface MinSizeFilterProps {
  minSizeEnabled: boolean;
  setMinSizeEnabled: (enabled: boolean) => void;
  minSizeValue: string;
  setMinSizeValue: (value: string) => void;
}

const MinSizeFilter: React.FC<MinSizeFilterProps> = ({
  minSizeEnabled,
  setMinSizeEnabled,
  minSizeValue,
  setMinSizeValue,
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

  return (
    <div className="min-size-filter-container">
      <div 
        ref={buttonRef}
        className="min-size-filter-button" 
        onClick={toggleDropdown}
        title="Minimum size filter"
      >
        <img className="min-size-filter-dots" src={dotsicon}/>
      </div>
      
        {isOpen && (
                <div 
                ref={dropdownRef} 
                className={`min-size-filter-dropdown ${isOpen ? 'open' : ''}`}
                style={{ 
                  maxHeight: isOpen ? '300px' : '0',
                  opacity: isOpen ? '1' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease, opacity 0.3s ease'
                }}
              >
          <>
            <div className="min-size-filter-header">
              {t("minimumSize")}
            </div>
            <div className="min-size-filter-content">
              <div className="min-size-input-container">
                <div className="min-size-input-wrapper">
                  <input
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
          </>
          </div>
        )}
    </div>
  );
};

export default MinSizeFilter;