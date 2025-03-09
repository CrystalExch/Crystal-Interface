import React, { useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import DropdownContext from '../DropdownContext/DropdownContext';

import {
  calculateDropdownPosition,
  formatSymbol,
  handleOutsideClick,
} from '../../utils';

import './TokenViewSelect.css';

interface OrderbookTokenSelectProps {
  value: string;
  onChange: (value: string) => void;
  symbol: string;
}

const OrderbookTokenSelect: React.FC<OrderbookTokenSelectProps> = ({
  value,
  onChange,
  symbol,
}) => {
  const selectorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const { openDropdown, setOpenDropdown } = useContext(DropdownContext);
  const isOpen = openDropdown === 'token';

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(isOpen ? null : 'token');
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setOpenDropdown(null);
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) =>
      handleOutsideClick(event, [selectorRef, dropdownRef], () =>
        setOpenDropdown(null),
      );
    if (isOpen) document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [isOpen, setOpenDropdown]);

  const CheckmarkIcon = () => (
    <svg
      className="token-checkmark"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 6L9 17L4 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="interval-token-selector" ref={selectorRef}>
      <div className="interval-select-wrapper" onClick={toggleDropdown}>
        <span className="interval-selected-value">
          [{formatSymbol(value, symbol)}]
        </span>
        <svg
          className={`token-interval-arrow ${isOpen ? 'open' : ''}`}
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
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {isOpen &&
        createPortal(
          <ul
            ref={dropdownRef}
            className={`interval-options-list ${isOpen ? 'open' : ''}`}
            style={{
              position: 'fixed',
              ...calculateDropdownPosition(selectorRef),
              width: 'auto',
              minWidth: '60px',
            }}
          >
            <li
              className={`interval-option ${value === 'Quote' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleOptionClick('Quote');
                localStorage.setItem('ob_amounts_quote', 'Quote');
              }}
            >
              <span>USDC</span>
              <CheckmarkIcon />
            </li>
            <li
              className={`interval-option ${value === 'Base' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleOptionClick('Base');
                localStorage.setItem('ob_amounts_quote', 'Base');
              }}
            >
              <span>{symbol}</span>
              <CheckmarkIcon />
            </li>
          </ul>,
          document.body,
        )}
    </div>
  );
};

export default OrderbookTokenSelect;
