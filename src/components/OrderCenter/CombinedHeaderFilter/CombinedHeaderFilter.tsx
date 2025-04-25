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
  onPageChange: (page: number) => void;
  showPageSize?: boolean;
}

const CombinedHeaderFilter: React.FC<CombinedHeaderFilterProps> = ({
  pageSize,
  setPageSize,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onPageChange,
  showPageSize = true
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [pageInput, setPageInput] = useState<string>(currentPage.toString());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSizeChange = (size: number) => {
    setPageSize(size);
    localStorage.setItem('crystal_page_size', size.toString());
    setIsOpen(false);
  };

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    const adjustInputWidth = () => {
      if (inputRef.current) {
        const charWidth = 9; 
        const contentWidth = `${Math.max(pageInput.length * charWidth, 8)}px`;
        inputRef.current.style.width = contentWidth;
      }
    };
    
    adjustInputWidth();
  }, [pageInput]);

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

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    
    if (value === '' || parseInt(value) <= totalPages || totalPages === 0) {
      setPageInput(value);
    }
  };

  const handlePageInputBlur = () => {
    let newPage = parseInt(pageInput, 10);

    if (isNaN(newPage) || newPage < 1) {
      newPage = 1;
    } else if (newPage > totalPages) {
      newPage = totalPages;
    }

    setPageInput(newPage.toString());

    onPageChange(newPage);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      let newPage = parseInt(pageInput, 10);
      
      if (isNaN(newPage) || newPage < 1) {
        newPage = 1;
      } else if (newPage > totalPages) {
        newPage = totalPages;
      }
      
      setPageInput(newPage.toString());
      
      onPageChange(newPage);
      
      inputRef.current?.blur();
    }
  };

  return (
    <div className="combined-header-filter">
      {showPageSize && (
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
                {[10, 25, 50, 100].map(size => (
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
      )}
      
      <div className="header-navigation">
        <button 
          className="header-nav-button"
          onClick={onPrevPage}
          disabled={currentPage <= 1}
        >
          <img className="filter-left-arrow" src={arrow} />
        </button>
        <div className="header-page-indicator">
          <input
            ref={inputRef}
            type="text"
            className="page-input"
            value={pageInput}
            onChange={handlePageInputChange}
            onBlur={handlePageInputBlur}
            onKeyDown={handlePageInputKeyDown}
            aria-label="Current page"
          />
          <span className="header-page-total"> / {Math.max(totalPages, 1)}</span>
        </div>
        <button 
          className="header-nav-button"
          onClick={onNextPage}
          disabled={currentPage >= totalPages || totalPages === 0}
        >          
          <img className="filter-right-arrow" src={arrow} />
        </button>
      </div>
    </div>
  );
};

export default CombinedHeaderFilter;