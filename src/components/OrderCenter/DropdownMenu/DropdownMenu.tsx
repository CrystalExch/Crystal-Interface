import { Check } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

import './DropdownMenu.css';

interface DropdownMenuProps {
  isOpen: boolean;
  toggleDropdown: () => void;
  items: { key: string; label: string }[];
  activeItem: string;
  onItemSelect: (key: string) => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  isOpen,
  toggleDropdown,
  items,
  activeItem,
  onItemSelect,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        toggleDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      if (isOpen) {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, [isOpen, toggleDropdown]);

  return (
    <div className="oc-dropdown-container" ref={dropdownRef}>
      <button className="oc-dropdown-toggle" onClick={toggleDropdown}>
        {items.find((item) => item.key === activeItem)?.label}
        <svg
          className={`oc-dropdown-icon ${isOpen ? 'open' : ''}`}
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
      </button>
      <div className={`oc-dropdown-menu ${isOpen ? 'open' : ''}`}>
        {items.map(({ key, label }) => (
          <div
            key={key}
            className="oc-dropdown-item"
            onClick={() => onItemSelect(key)}
          >
            {label}
            {key === activeItem && (
              <Check
                size={13}
                style={{ display: 'inline', marginLeft: '4px' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DropdownMenu;
