import { Check } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import './FilterSelect.css';

interface FilterSelectProps {
  filter: 'all' | 'buy' | 'sell';
  setFilter: (value: 'all' | 'buy' | 'sell') => void;
  inDropdown?: boolean;
}

const FilterSelect: React.FC<FilterSelectProps> = ({ 
  filter, 
  setFilter,
  inDropdown = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const toggleDropdown = () => setIsOpen(!isOpen);
  
  const handleItemClick = (value: 'all' | 'buy' | 'sell') => {
    localStorage.setItem('crystal_oc_filter', value);
    setFilter(value);
    setIsOpen(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      )
        setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className={`oc-filter-dropdown ${inDropdown ? 'in-filter-menu' : ''}`} ref={dropdownRef}>
      <div className="oc-filter-dropdown-header" onClick={toggleDropdown}>
        <span>{t(filter)}</span>
        <svg
          className={`oc-filter-dropdown-arrow ${isOpen ? 'open' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <ul className={`oc-filter-dropdown-list ${isOpen ? 'open' : ''}`}>
        <li
          className={`oc-filter-dropdown-item ${filter == 'all' ? 'selected' : ''}`}
          onClick={() => handleItemClick('all')}
        >
          {t('all')}{' '}
          {filter === 'all' && (
            <Check size={11} style={{ display: 'inline', marginLeft: '4px' }} />
          )}
        </li>
        <li
          className={`oc-filter-dropdown-item ${filter == 'buy' ? 'selected' : ''}`}
          onClick={() => handleItemClick('buy')}
        >
          {t('buy')}{' '}
          {filter === 'buy' && (
            <Check size={11} style={{ display: 'inline', marginLeft: '4px' }} />
          )}
        </li>
        <li
          className={`oc-filter-dropdown-item ${filter == 'sell' ? 'selected' : ''}`}
          onClick={() => handleItemClick('sell')}
        >
          {t('sell')}{' '}
          {filter === 'sell' && (
            <Check size={11} style={{ display: 'inline', marginLeft: '4px' }} />
          )}
        </li>
      </ul>
    </div>
  );
};

export default FilterSelect;