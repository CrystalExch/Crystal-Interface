import React, { useState, useRef, useEffect } from 'react';
import './CombinedHeaderFilter.css';
import arrow from '../../../assets/arrow.svg';

interface CombinedHeaderFilterProps {
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

const CombinedHeaderFilter: React.FC<CombinedHeaderFilterProps> = ({
  pageSize,
  setPageSize,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSizeChange = (size: number) => {
    setPageSize(size);
    localStorage.setItem('crystal_page_size', size.toString());
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
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
    <div className="combined-header-filter">
      <div className="page-size-container">
        <span className="show-text">Show</span>
        <div className="page-size-section" ref={dropdownRef}>
          <div className="page-size-button" onClick={toggleDropdown}>
            <span className="page-size-display">{pageSize}</span>
            <svg
              className={`page-size-arrow ${isOpen ? 'open' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          
          {isOpen && (
            <div className="page-size-dropdown">
              {[10, 25, 50].map(size => (
                <div 
                  key={size} 
                  className={`page-size-option ${pageSize === size ? 'selected' : ''}`}
                  onClick={() => handleSizeChange(size)}
                >
                  {size}
                </div>
              ))}
            </div>
          )}
        </div>
        <span className="per-page-text">per page</span>
      </div>
      
      <div className="header-navigation">
        <button 
          className="header-nav-button" 
          onClick={onPrevPage}
          disabled={currentPage <= 1}
        >
          <img className="filter-left-arrow" src={arrow}/>
        </button>
        <span className="header-page-indicator">
          {currentPage} / {Math.max(totalPages, 1)}
        </span>
        <button 
          className="header-nav-button" 
          onClick={onNextPage}
          disabled={currentPage >= totalPages || totalPages === 0}
        >
                    <img className="filter-right-arrow" src={arrow}/>

        </button>
      </div>
    </div>
  );
};

export default CombinedHeaderFilter;