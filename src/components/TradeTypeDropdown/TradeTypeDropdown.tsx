import { RefreshCw, Send } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './TradeTypeDropdown.css';

interface TradeTypeDropdownProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TradeTypeDropdown: React.FC<TradeTypeDropdownProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: { target: any }) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="trade-type-dropdown" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="dropdown-button">
        {activeTab === 'send' ? (
          <Send className="dropdown-icon" size={18} />
        ) : (
          <RefreshCw className="dropdown-icon" size={18} />
        )}
        <span>{activeTab === 'send' ? 'Send' : 'Spot'}</span>
        <svg
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <Link
            to="/swap"
            className={`dropdown-item ${activeTab !== 'send' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('swap');
              setIsOpen(false);
            }}
          >
            <RefreshCw className="menu-icon" size={18} />
            Spot
          </Link>
          <Link
            to="/send"
            className={`dropdown-item ${activeTab === 'send' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('send');
              setIsOpen(false);
            }}
          >
            <Send className="menu-icon" size={18} />
            Send
          </Link>
        </div>
      )}
    </div>
  );
};

export default TradeTypeDropdown;
