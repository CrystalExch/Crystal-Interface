import React, { useContext, useEffect, useRef } from 'react';

import DropdownContext from '../DropdownContext/DropdownContext';

import './PriceIntervals.css';

interface PriceIntervalsProps {
  interval: number;
  localInterval: number;
  setLocalInterval: any;
  symbolOut: any;
}

const PriceIntervals: React.FC<PriceIntervalsProps> = ({
  interval,
  localInterval,
  setLocalInterval,
  symbolOut,
}) => {
  const baseInterval = interval;
  const selectWrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const intervals = [1, 5, 10, 100, 1000].map(mult => 
    Number((baseInterval * mult).toPrecision(12))
  );
  

  const formatDisplay = (value: string) => {
    const num = Number(value);

    const preciseStr = num.toLocaleString('fullwide', {
      useGrouping: false,
      maximumSignificantDigits: 21,
    });

    const [integerPart, fractionalPart = ''] = preciseStr.split('.');

    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    let roundedFractional = '';
    if (fractionalPart) {
      const last9Index = fractionalPart.search(/9{5,}$/);
      if (last9Index !== -1) {
        const roundedNum = (
          Number('0.' + fractionalPart.slice(0, last9Index)) +
          Number('0.' + '0'.repeat(last9Index - 1) + '1')
        ).toString();
        roundedFractional = roundedNum.slice(2);
      } else {
        const last0Index = fractionalPart.search(/0{5,}$/);
        if (last0Index !== -1) {
          roundedFractional = fractionalPart.slice(0, last0Index);
        } else {
          roundedFractional = fractionalPart;
        }
      }
    }

    return roundedFractional
      ? `${formattedInteger}.${roundedFractional}`
      : formattedInteger;
  };

  const { openDropdown, setOpenDropdown } = useContext(DropdownContext);
  const isOpen = openDropdown === 'interval';

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(isOpen ? null : 'interval');
  };

  const handleIntervalChange = (newInterval: number) => {
    setLocalInterval(newInterval);
    localStorage.setItem(
      `${symbolOut}_ob_interval`,
      JSON.stringify(newInterval),
    );
    setOpenDropdown(null);
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        !selectWrapperRef.current?.contains(event.target as Node) &&
        !dropdownRef.current?.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    if (isOpen) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen]);

  return (
    <div className="interval-selector" ref={selectWrapperRef}>
      <div className="spread-select-wrapper" onClick={handleSelectClick}>
        <span className="spread-selected">
          {formatDisplay(String(localInterval))}
        </span>
        <svg
          className={`interval-arrow ${isOpen ? 'open' : ''}`}
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
      {isOpen && (
        <ul ref={dropdownRef} className="spread-options-list">
          {intervals.map((int) => (
            <li
              key={int}
              className={`option ${Number(int) === localInterval ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleIntervalChange(Number(int));
              }}
            >
              <span>{formatDisplay(String(int))}</span>
              <svg
                className="spread-checkmark"
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PriceIntervals;
