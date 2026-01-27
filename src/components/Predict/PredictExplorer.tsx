import { BarChart3, Bell, Play, RotateCcw, Search, Volume2 } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { encodeFunctionData } from 'viem';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi.ts';
import { NadFunAbi } from '../../abis/NadFun.ts';
import { settings as appSettings, settings } from '../../settings';
import { loadBuyPresets } from '../../utils/presetManager';
import {
  showLoadingPopup,
  updatePopup,
} from '../MemeTransactionPopup/MemeTransactionPopupManager';

import { zeroXAbi } from '../../abis/zeroXAbi.ts';
import { zeroXActionsAbi } from '../../abis/zeroXActionsAbi.ts';
import avatar from '../../assets/avatar.png';
import closebutton from '../../assets/close_button.png';
import communities from '../../assets/community.png';
import discord from '../../assets/discord1.svg';
import empty from '../../assets/empty.svg';
import lightning from '../../assets/flash.png';
import gas from '../../assets/gas.svg';
import kaching from '../../assets/ka-ching.mp3';
import monadicon from '../../assets/monadlogo.svg';
import slippage from '../../assets/slippage.svg';
import stepaudio from '../../assets/step_audio.mp3';
import telegram from '../../assets/telegram.png';
import trash from '../../assets/trash.svg';
import tweet from '../../assets/tweet.png';
import walleticon from '../../assets/wallet_icon.svg';
import { TwitterHover } from '../TwitterHover/TwitterHover';
import './PredictExplorer.css';
import { formatCommas } from '../../utils/numberDisplayFormat.ts';
import SortArrow from '../OrderCenter/SortArrow/SortArrow.tsx';

interface Token {
  id: string;
  dev: string;
  name: string;
  symbol: string;
  image: string;
  price: number;
  marketCap: number;
  change24h: number;
  volume24h: number;
  mini: any;
  holders: number;
  proTraders: number;
  sniperHolding: number;
  devHolding: number;
  bundleHolding: number;
  insiderHolding: number;
  top10Holding: number;
  buyTransactions: number;
  sellTransactions: number;
  globalFeesPaid: number;
  website: string;
  twitterHandle: string;
  progress: number;
  status: 'new' | 'graduating' | 'graduated';
  description: string;
  created: number;
  bondingAmount: number;
  volumeDelta: number;
  telegramHandle: string;
  discordHandle: string;
  graduatedTokens: number;
  launchedTokens: number;
  trades?: any;
  bondingPercentage: number;
  source?: 'crystal' | 'nadfun';
  market?: string;
  circulatingSupply: number;
}

type ColumnKey = 'new' | 'graduating' | 'graduated';

const Tooltip: React.FC<{
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
}> = ({ content, children, position = 'top', offset = 10 }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current || !tooltipRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top + scrollY - tooltipRect.height - offset - 15;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'bottom':
        top = rect.top + scrollY - tooltipRect.height - offset;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - tooltipRect.width - offset;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + offset;
        break;
    }

    const margin = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (position === 'top' || position === 'bottom') {
      left = Math.min(
        Math.max(left, margin + tooltipRect.width / 2),
        viewportWidth - margin - tooltipRect.width / 2,
      );
    } else {
      top = Math.min(
        Math.max(top, margin),
        viewportHeight - margin - tooltipRect.height,
      );
    }

    setTooltipPosition({ top, left });
  }, [position, offset]);

  const handleMouseEnter = useCallback(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    setIsLeaving(false);
    setShouldRender(true);

    fadeTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      fadeTimeoutRef.current = null;
    }, 10);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    setIsLeaving(true);
    setIsVisible(false);

    fadeTimeoutRef.current = setTimeout(() => {
      setShouldRender(false);
      setIsLeaving(false);
      fadeTimeoutRef.current = null;
    }, 150);
  }, []);

  useEffect(() => {
    if (shouldRender && !isLeaving) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [shouldRender, updatePosition, isLeaving]);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tooltip-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {shouldRender &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`tooltip tooltip-${position} ${isVisible ? 'tooltip-entering' : isLeaving ? 'tooltip-leaving' : ''}`}
            style={{
              position: 'absolute',
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: `${
                position === 'top' || position === 'bottom'
                  ? 'translateX(-50%)'
                  : position === 'left' || position === 'right'
                    ? 'translateY(-50%)'
                    : 'none'
              } scale(${isVisible ? 1 : 0})`,
              opacity: isVisible ? 1 : 0,
              zIndex: 9999,
              pointerEvents: 'none',
              transition:
                'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform, opacity',
            }}
          >
            <div className="tooltip-content">{content}</div>
          </div>,
          document.body,
        )}
    </div>
  );
};

interface BlacklistSettings {
  items: Array<{
    id: string;
    text: string;
    type: 'dev' | 'ca' | 'keyword' | 'website' | 'handle';
  }>;
}

type BlacklistTab = 'all' | 'dev' | 'ca' | 'keyword' | 'website' | 'handle';
const crystal = '/CrystalLogo.png';

const BlacklistPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  settings: BlacklistSettings;
  onSettingsChange: (settings: BlacklistSettings) => void;
  onCopyToClipboard: (
    text: string,
    type?: 'dev' | 'ca' | 'keyword' | 'website' | 'handle',
  ) => void;
}> = ({ isOpen, onClose, settings, onSettingsChange, onCopyToClipboard }) => {
  const [activeTab, setActiveTab] = useState<BlacklistTab>('all');
  const [inputValue, setInputValue] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    'dev' | 'ca' | 'keyword' | 'website' | 'handle'
  >('keyword');

  const isValidEthAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const checkScroll = useCallback(() => {
    if (!tabsContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabsContainerRef.current) return;

    const scrollAmount = 200;
    const newScrollLeft =
      direction === 'left'
        ? tabsContainerRef.current.scrollLeft - scrollAmount
        : tabsContainerRef.current.scrollLeft + scrollAmount;

    tabsContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    checkScroll();

    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [checkScroll, settings.items]);

  const isValidUrl = (url: string) => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const addToBlacklist = (
    category: 'dev' | 'ca' | 'keyword' | 'website' | 'handle',
  ) => {
    if (!inputValue.trim()) return;

    if (
      (category === 'dev' || category === 'ca') &&
      !isValidEthAddress(inputValue.trim())
    ) {
      return;
    }

    if (category === 'website' && !isValidUrl(inputValue.trim())) {
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      type: category,
    };

    onSettingsChange({
      items: [...settings.items, newItem],
    });

    setInputValue('');
    setShowCategoryDropdown(false);
  };
  const removeFromBlacklist = (id: string) => {
    onSettingsChange({
      items: settings.items.filter((item) => item.id !== id),
    });
  };

  const deleteAll = () => {
    onSettingsChange({ items: [] });
  };

  const exportBlacklist = () => {
    const data = JSON.stringify(settings.items, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blacklist.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBlacklist = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          onSettingsChange({ items: imported });
        }
      } catch (error) {
        console.error('Failed to import blacklist:', error);
      }
    };
    reader.readAsText(file);
  };

  const filteredItems =
    activeTab === 'all'
      ? settings.items
      : settings.items.filter((item) => item.type === activeTab);

  if (!isOpen) return null;

  return (
    <div className="blacklist-popup-overlay" onClick={onClose}>
      <div className="blacklist-popup" onClick={(e) => e.stopPropagation()}>
        <div className="blacklist-popup-header">
          <h3 className="blacklist-popup-title">Blacklist</h3>
          <button className="blacklist-close-button" onClick={onClose}>
            <img src={closebutton} className="explorer-close-button" />
          </button>
        </div>

        <div className="blacklist-content">
          <div className="blacklist-input-section">
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="blacklist-input"
                placeholder="Enter twitter handle, dev address, contract address or keyword"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (e.target.value.trim()) {
                    setShowCategoryDropdown(true);
                  }
                }}
                onFocus={() => {
                  if (inputValue.trim()) {
                    setShowCategoryDropdown(true);
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addToBlacklist(selectedCategory);
                  }
                }}
              />
              {showCategoryDropdown && inputValue.trim() && (
                <div
                  className="blacklist-category-dropdown"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <button
                    className={`blacklist-category-option ${selectedCategory === 'dev' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory('dev');
                      addToBlacklist('dev');
                    }}
                    disabled={!isValidEthAddress(inputValue.trim())}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 30 30"
                      fill="currentColor"
                    >
                      <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                    </svg>
                    Developer Address
                  </button>
                  <button
                    className={`blacklist-category-option ${selectedCategory === 'ca' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory('ca');
                      addToBlacklist('ca');
                    }}
                    disabled={!isValidEthAddress(inputValue.trim())}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                    </svg>
                    Contract Address
                  </button>
                  <button
                    className={`blacklist-category-option ${selectedCategory === 'keyword' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory('keyword');
                      addToBlacklist('keyword');
                    }}
                  >
                    <Search size={16} />
                    Keyword
                  </button>
                  <button
                    className={`blacklist-category-option ${selectedCategory === 'website' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory('website');
                      addToBlacklist('website');
                    }}
                    disabled={!isValidUrl(inputValue.trim())}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                    Website
                  </button>
                  <button
                    className={`blacklist-category-option ${selectedCategory === 'handle' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory('handle');
                      addToBlacklist('handle');
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                    Twitter Profile
                  </button>
                </div>
              )}
            </div>
          </div>

          <div
            className={`blacklist-tabs-container ${showLeftArrow ? 'show-left-gradient' : ''} ${showRightArrow ? 'show-right-gradient' : ''}`}
          >
            <button
              className={`blacklist-tab-arrow left ${showLeftArrow ? 'visible' : ''}`}
              onClick={() => scrollTabs('left')}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div
              className="blacklist-tabs"
              ref={tabsContainerRef}
              onScroll={checkScroll}
            >
              {(
                [
                  'all',
                  'dev',
                  'ca',
                  'keyword',
                  'website',
                  'handle',
                ] as BlacklistTab[]
              ).map((tab) => {
                const count =
                  tab === 'all'
                    ? settings.items.length
                    : settings.items.filter((item) => item.type === tab).length;

                return (
                  <button
                    key={tab}
                    className={`blacklist-tab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {count > 0 && (
                      <span className="blacklist-tab-count">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              className={`blacklist-tab-arrow right ${showRightArrow ? 'visible' : ''}`}
              onClick={() => scrollTabs('right')}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          <div className="blacklist-list">
            {filteredItems.length === 0 ? (
              <div className="blacklist-empty">
                <span>No blacklisted items</span>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="blacklist-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyToClipboard(item.text, item.type);
                  }}
                >
                  <div className="blacklist-item-content">
                    <span className="blacklist-item-text">
                      {item.text}{' '}
                      <button
                        className="blacklist-copy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyToClipboard(item.text, item.type);
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                        </svg>
                      </button>
                    </span>
                    <span className="blacklist-item-type">{item.type}</span>
                  </div>
                  <div className="blacklist-item-actions">
                    <button
                      className="blacklist-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromBlacklist(item.id);
                      }}
                    >
                      <img
                        src={trash}
                        className="blacklist-remove-icon"
                        alt="Remove"
                      />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="blacklist-footer">
            <span className="blacklist-count">
              {settings.items.length} / 1000 blacklists
            </span>
            <div className="blacklist-actions">
              <label className="blacklist-import-btn">
                Import
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={importBlacklist}
                />
              </label>
              <button
                className="blacklist-export-btn"
                onClick={exportBlacklist}
              >
                Export
              </button>
              <button className="blacklist-delete-all-btn" onClick={deleteAll}>
                Delete All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AlertSettings {
  soundAlertsEnabled: boolean;
  volume: number;
  sounds: {
    newPairs: string;
    pairMigrating: string;
    migrated: string;
  };
}

const AlertsPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  settings: AlertSettings;
  onSettingsChange: (settings: AlertSettings) => void;
}> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {},
  );

  const sliderRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastVolumeRef = useRef<number>(settings.volume);

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const closeDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: false,
    }));
  };

  const getSoundDisplayName = (soundPath: string) => {
    if (soundPath === stepaudio) return 'Step Audio';
    if (soundPath === kaching) return 'Ka-ching';
    if (soundPath.includes('blob:')) return 'Custom Audio';
    return 'Step Audio';
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.volume / 100;
    }
  }, [settings.volume]);

  const updateSetting = <K extends keyof AlertSettings>(
    key: K,
    value: AlertSettings[K],
  ) => onSettingsChange({ ...settings, [key]: value });

  const updateSoundSetting = (
    key: keyof AlertSettings['sounds'],
    value: string,
  ) => {
    onSettingsChange({
      ...settings,
      sounds: { ...settings.sounds, [key]: value },
    });
  };

  const handleVolumeChange = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100),
    );
    updateSetting('volume', Math.round(percentage));
  }, []);

  const handleVolumeSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseInt(e.target.value, 10);
      updateSetting('volume', newVolume);
    },
    [],
  );

  const handleVolumeChangeEnd = useCallback(() => {
    if (
      audioRef.current &&
      Math.abs(settings.volume - lastVolumeRef.current) > 0
    ) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
    lastVolumeRef.current = settings.volume;
    setIsDragging(false);
  }, [settings.volume]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleVolumeChange(e.clientX);
    };
    const handleMouseUp = () => {
      if (isDragging) handleVolumeChangeEnd();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleVolumeChange, handleVolumeChangeEnd]);

  const playSound = (soundType: keyof AlertSettings['sounds']) => {
    if (!audioRef.current) return;

    const soundUrl = settings.sounds[soundType];

    if (
      soundUrl === stepaudio ||
      soundUrl === kaching ||
      soundUrl === 'Default'
    ) {
      const audio = new Audio(soundUrl === 'Default' ? stepaudio : soundUrl);
      audio.volume = settings.volume / 100;
      audio.currentTime = 0;
      audio.play().catch(console.error);
    } else {
      const customAudio = new Audio(soundUrl);
      customAudio.volume = settings.volume / 100;
      customAudio.play().catch(console.error);
    }
  };

  const handleFileUpload = (
    soundType: keyof AlertSettings['sounds'],
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateSoundSetting(soundType, url);
    }
    event.target.value = '';
  };

  const selectSound = (
    soundType: keyof AlertSettings['sounds'],
    soundValue: string,
  ) => {
    updateSoundSetting(soundType, soundValue);
  };

  if (!isOpen) return null;

  return (
    <div className="alerts-popup-overlay" onClick={onClose}>
      <div className="alerts-popup" onClick={(e) => e.stopPropagation()}>
        <div className="alerts-popup-header">
          <h3 className="alerts-popup-title">Alerts</h3>
          <button className="alerts-close-button" onClick={onClose}>
            <img src={closebutton} className="explorer-close-button" />
          </button>
        </div>

        <div className="alerts-content">
          <div className="alerts-section">
            <div className="alerts-main-toggle">
              <div>
                <h4 className="alerts-main-label">Sound Alerts</h4>
                <p className="alerts-description">
                  Play sound alerts for Tokens in Spectra
                </p>
              </div>
              <div
                className={`toggle-switch ${settings.soundAlertsEnabled ? 'active' : ''}`}
                onClick={() =>
                  updateSetting(
                    'soundAlertsEnabled',
                    !settings.soundAlertsEnabled,
                  )
                }
              >
                <div className="toggle-slider" />
              </div>
            </div>
          </div>

          {settings.soundAlertsEnabled && (
            <div>
              <div className="alerts-volume-slider">
                <div className="volume-label">
                  <span className="volume-text">Volume</span>
                  <span className="volume-value">{settings.volume}%</span>
                </div>

                <div
                  className="meme-slider-container meme-slider-mode"
                  style={{ position: 'relative' }}
                >
                  <input
                    type="range"
                    className={`meme-balance-amount-slider ${isDragging ? 'dragging' : ''}`}
                    min="0"
                    max="100"
                    step="1"
                    value={settings.volume}
                    onChange={handleVolumeSliderChange}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={handleVolumeChangeEnd}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={handleVolumeChangeEnd}
                    style={{
                      background: `linear-gradient(to right, rgb(171,176,224) ${settings.volume}%, rgb(28,28,31) ${settings.volume}%)`,
                    }}
                  />

                  <div className="meme-volume-slider-marks">
                    {[0, 25, 50, 75, 100].map((mark) => (
                      <span
                        key={mark}
                        className="meme-volume-slider-mark"
                        data-active={settings.volume >= mark}
                        data-percentage={mark}
                        onClick={() => updateSetting('volume', mark)}
                      >
                        {mark}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="alerts-section">
                <div className="sound-options">
                  {(['newPairs', 'pairMigrating', 'migrated'] as const).map(
                    (key) => (
                      <div className="sound-option" key={key}>
                        <span className="sound-option-label">
                          {key === 'newPairs'
                            ? 'New Pairs'
                            : key === 'pairMigrating'
                              ? 'Pair Migrating'
                              : 'Migrated Sound'}
                        </span>
                        <div className="sound-controls">
                          <div className="sound-selector-dropdown">
                            <div
                              className="sound-selector"
                              onClick={() => toggleDropdown(key)}
                              onBlur={(e) => {
                                if (
                                  !e.currentTarget.parentElement?.contains(
                                    e.relatedTarget as Node,
                                  )
                                ) {
                                  closeDropdown(key);
                                }
                              }}
                            >
                              <Volume2 size={14} />
                              <span>
                                {getSoundDisplayName(settings.sounds[key])}
                              </span>
                              <div className="sound-action-button-container">
                                <button
                                  className="sound-action-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playSound(key);
                                  }}
                                >
                                  <Play size={14} />
                                </button>

                                <button
                                  className="sound-action-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateSoundSetting(key, stepaudio);
                                  }}
                                >
                                  <RotateCcw size={14} />
                                </button>
                              </div>
                              {openDropdowns[key] && (
                                <div className="sound-dropdown-content">
                                  <button
                                    className={`sound-dropdown-item ${settings.sounds[key] === stepaudio ? 'active' : ''}`}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      selectSound(key, stepaudio);
                                    }}
                                  >
                                    Step Audio
                                  </button>
                                  <button
                                    className={`sound-dropdown-item ${settings.sounds[key] === kaching ? 'active' : ''}`}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      selectSound(key, kaching);
                                    }}
                                  >
                                    Ka-ching
                                  </button>
                                  <label className="sound-dropdown-item">
                                    Upload Other
                                    <input
                                      type="file"
                                      accept="audio/*"
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        handleFileUpload(key, e);
                                      }}
                                    />
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <p className="alerts-file-info">
                  Maximum 5 seconds and 0.2MB file size
                </p>
              </div>
            </div>
          )}
          <button className="alerts-continue-btn" onClick={onClose}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

interface DisplaySettings {
  metricSize: 'small' | 'large';
  quickBuySize: 'small' | 'large' | 'mega' | 'ultra';
  quickBuyStyle: 'color' | 'grey';
  ultraStyle: 'default' | 'glowing' | 'border';
  ultraColor: 'color' | 'grey';
  hideSearchBar: boolean;
  noDecimals: boolean;
  hideHiddenTokens: boolean;
  squareImages: boolean;
  progressBar: boolean;
  spacedTables: boolean;
  colorRows: boolean;
  columnOrder: Array<ColumnKey>;
  hiddenColumns?: Array<ColumnKey>;
  quickBuyClickBehavior: 'nothing' | 'openPage' | 'openNewTab';
  secondQuickBuyEnabled: boolean;
  secondQuickBuyColor: string;
  visibleRows: {
    marketCap: boolean;
    volume: boolean;
    fees: boolean;
    tx: boolean;
    socials: boolean;
    holders: boolean;
    proTraders: boolean;
    devMigrations: boolean;
    top10Holders: boolean;
    devHolding: boolean;
    fundingTime: boolean;
    snipers: boolean;
    insiders: boolean;
    dexPaid: boolean;
  };
  metricColoring: boolean;
  metricColors: {
    marketCap: { range1: string; range2: string; range3: string };
    volume: { range1: string; range2: string; range3: string };
    holders: { range1: string; range2: string; range3: string };
  };
  metricThresholds: {
    marketCap: { range1: number; range2: number };
    volume: { range1: number; range2: number };
    holders: { range1: number; range2: number };
  };
}

interface TabFilters {
  new: any;
  graduating: any;
  graduated: any;
}

const DISPLAY_DEFAULTS: DisplaySettings = {
  metricSize: 'small',
  quickBuySize: 'large',
  quickBuyStyle: 'color',
  ultraStyle: 'default',
  ultraColor: 'color',
  hideSearchBar: false,
  noDecimals: false,
  hideHiddenTokens: false,
  squareImages: true,
  progressBar: true,
  spacedTables: false,
  colorRows: false,
  columnOrder: ['new', 'graduating', 'graduated'],
  hiddenColumns: [],
  quickBuyClickBehavior: 'nothing',
  secondQuickBuyEnabled: false,
  secondQuickBuyColor: '#606BCC',
  visibleRows: {
    marketCap: true,
    volume: true,
    fees: true,
    tx: true,
    socials: true,
    holders: true,
    proTraders: true,
    devMigrations: true,
    top10Holders: true,
    devHolding: true,
    fundingTime: false,
    snipers: true,
    insiders: true,
    dexPaid: false,
  },
  metricColoring: true,
  metricColors: {
    marketCap: { range1: '#ffffff', range2: '#d8dcff', range3: '#82f9a4ff' },
    volume: { range1: '#ffffff', range2: '#ffffff', range3: '#ffffff' },
    holders: { range1: '#ffffff', range2: '#ffffff', range3: '#ffffff' },
  },
  metricThresholds: {
    marketCap: { range1: 30000, range2: 150000 },
    volume: { range1: 1000, range2: 2000 },
    holders: { range1: 10, range2: 50 },
  },
};

const BLACKLIST_DEFAULTS: BlacklistSettings = { items: [] };

const formatNumberWithCommas = (v: number, d = 2) => {
  if (v === 0) return '0.00';
  if (v >= 1e11) return `${(v / 1e9).toFixed(0)}B`;
  if (v >= 1e10) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e8) return `${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e7) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e5) return `${(v / 1e3).toFixed(0)}K`;
  if (v >= 1e4) return `${(v / 1e3).toFixed(1)}K`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  if (v >= 1) return v.toLocaleString('en-US', { maximumFractionDigits: d });
  return v.toFixed(Math.min(d, 8));
};

const formatCompactNumber = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  const abs = Math.abs(value);
  const format = (num: number) => {
    if (num >= 100) return num.toFixed(0);
    if (num >= 10) return num.toFixed(1);
    return num.toFixed(2);
  };

  if (abs >= 1e9) return `${format(abs / 1e9)}B`;
  if (abs >= 1e6) return `${format(abs / 1e6)}M`;
  if (abs >= 1e3) return `${format(abs / 1e3)}K`;
  return abs.toFixed(0);
};


interface PredictExplorerProps {
  setpopup: (popup: number) => void;
  appliedFilters?: TabFilters;
  onOpenFiltersForColumn: (c: Token['status']) => void;
  sendUserOperationAsync: any;
  setTokenData: any;
  monUsdPrice: number;
  subWallets?: Array<{ address: string; privateKey: string }>;
  walletTokenBalances?: { [address: string]: any };
  activeWalletPrivateKey?: string;
  activechain: number;
  isBlurred?: boolean;
  account: {
    connected: boolean;
    address?: string;
    chainId?: number;
  };
  quickAmounts: any;
  setQuickAmounts: any;
  alertSettingsRef: any;
  pausedColumnRef: any;
  dispatch: any;
  hidden: any;
  tokensByStatus: any;
  alertSettings: any;
  setAlertSettings: any;
  loading: any;
  isLoading: any;
  nonces: any;
  selectedWallets: Set<string>;
  setSelectedWallets: React.Dispatch<React.SetStateAction<Set<string>>>;
  createSubWallet: any;
  setOneCTDepositAddress: any;
  layoutSettings: string;
  orderbookPosition: string;
  windowWidth: any;
  mobileView: any;
  isOrderbookVisible: boolean;
  orderbookWidth: number;
  setOrderbookWidth: any;
  viewMode: 'both' | 'buy' | 'sell';
  setViewMode: any;
  activeTab: 'orderbook' | 'trades';
  setActiveTab: any;
  router: any;
  address: any;
  orderCenterHeight: number;
  setSendTokenIn: any;
  hideMarketFilter?: boolean;
  sortConfig: any;
  onSort: (config: any) => void;
  activeSection: 'balances' | 'orders' | 'tradeHistory' | 'orderHistory';
  setActiveSection: any;
  filter: 'all' | 'buy' | 'sell';
  setFilter: any;
  onlyThisMarket: boolean;
  setOnlyThisMarket: any;
  isPortfolio?: boolean;
  refetch: any;
  setChain: any;
  isOrderCenterVisible?: boolean;
  openEditOrderPopup: (order: any) => void;
  openEditOrderSizePopup: (order: any) => void;
  wethticker: any;
  ethticker: any;
  memoizedSortConfig: any;
  emptyFunction: any;
  handleSetChain: any;
  sliderIncrement?: number;
  selectedInterval: string;
  setSelectedInterval: any;
  predictActiveMarketKey: any;
  setPredictActiveMarketKey: any;
  predictMarketsData: any;
  setPredictMarketsData: any;
  predictFilterOptions: any;
  setPredictFilterOptions: any;
  signMessageAsync: any;
  leverage: string;
  setLeverage: (value: string) => void;
  signer: any;
  setSigner: any;
  setOrderCenterHeight: (height: number) => void;
  isMarksVisible: any;
  setIsMarksVisible: any;
  scaAddress: string;
  setTempLeverage: any;
}

const PredictExplorer: React.FC<PredictExplorerProps> = ({
  appliedFilters,
  sendUserOperationAsync,
  setTokenData,
  setpopup,
  subWallets = [],
  walletTokenBalances = {},
  activeWalletPrivateKey,
  activechain,
  isBlurred = false,
  account,
  quickAmounts,
  setQuickAmounts,
  alertSettingsRef,
  dispatch,
  hidden,
  tokensByStatus,
  alertSettings,
  setAlertSettings,
  loading,
  isLoading,
  nonces,
  selectedWallets,
  setSelectedWallets,
  createSubWallet,
  setOneCTDepositAddress,
  setPredictActiveMarketKey,
  predictMarketsData,
  setPredictMarketsData,
  predictFilterOptions,
  setPredictFilterOptions,
  setOnlyThisMarket,
}) => {

  const getMaxSpendableWei = useCallback(
    (addr: string): bigint => {
      const balances = walletTokenBalances[addr];
      if (!balances) return 0n;

      if (
        !appSettings.chainConfig[activechain].eth ||
        !balances[appSettings.chainConfig[activechain].eth]
      )
        return 0n;

      let raw = balances[appSettings.chainConfig[activechain].eth];
      if (raw <= 0n) return 0n;

      const gasReserve = BigInt(
        appSettings.chainConfig[activechain].gasamount ?? 0,
      );
      const safe = raw > gasReserve ? raw - gasReserve : 0n;

      return safe;
    },
    [walletTokenBalances, activechain],
  );
  const [activePresetsSecond, setActivePresetsSecond] = useState<
    Record<Token['status'], number>
  >(() => ({
    new: parseInt(localStorage.getItem('explorer-preset-second-new') ?? '1'),
    graduating: parseInt(
      localStorage.getItem('explorer-preset-second-graduating') ?? '1',
    ),
    graduated: parseInt(
      localStorage.getItem('explorer-preset-second-graduated') ?? '1',
    ),
  }));
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<any>(null);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeCallbackRef = useRef<any>({});
  const isPredictLoadingRef = useRef(false);
  const selectedCategoryRef = useRef<string>('All');
  const perpsCurrentPageRef = useRef(1);
  const itemsPerPageRef = useRef(40);
  const multiOutcomeHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
      let liveStreamCancelled = false;
      let priceUpdateInterval: NodeJS.Timeout | null = null;

    const startTradeStream = () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      const ws = new WebSocket('wss://ws-live-data.polymarket.com/');
      wsRef.current = ws;

      ws.onopen = () => {
        try {
          ws.send(
            JSON.stringify({
              type: 'subscribe',
              channels: ['trades'],
            }),
          );
        } catch (error) {
          console.warn('Polymarket trade stream subscribe failed:', error);
        }

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            try {
              wsRef.current.send(JSON.stringify({ type: 'ping' }));
            } catch (error) {
              console.warn('Polymarket trade stream ping failed:', error);
            }
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        if (liveStreamCancelled) return;
        try {
          const payload = JSON.parse(event.data);
          const trades = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.trades)
              ? payload.trades
              : Array.isArray(payload?.data?.trades)
                ? payload.data.trades
                : payload?.trade
                  ? [payload.trade]
                  : payload?.data?.trade
                    ? [payload.data.trade]
                    : [];

          if (!trades.length) return;

          setLiveTrades((prev) => {
            const combined = [...trades, ...prev];
            const uniqueMap = new Map<string, any>();

            combined.forEach((trade) => {
              const timestamp =
                trade?.timestamp ??
                trade?.time ??
                trade?.ts ??
                trade?.createdAt;
              const normalizedTimestamp =
                typeof timestamp === 'string'
                  ? new Date(timestamp).getTime()
                  : timestamp;
              const tradeId =
                trade?.id ||
                trade?.trade_id ||
                trade?.transactionHash ||
                trade?.tx_hash ||
                `${trade?.market || trade?.conditionId || trade?.marketId || 'market'}-${normalizedTimestamp}`;

              if (!uniqueMap.has(tradeId)) {
                uniqueMap.set(tradeId, {
                  ...trade,
                  timestamp: normalizedTimestamp,
                });
              }
            });

            return Array.from(uniqueMap.values())
              .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
              .slice(0, MAX_LIVE_TRADES);
          });
        } catch (error) {
          console.warn('Polymarket trade stream parse failed:', error);
        }
      };

      ws.onclose = () => {
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        if (liveStreamCancelled) return;
        reconnectIntervalRef.current = setTimeout(() => {
          if (!liveStreamCancelled) {
            startTradeStream();
          }
        }, 5000);
      };

      ws.onerror = (error) => {
        console.warn('Polymarket trade stream error:', error);
      };
    };

    const ensureDefaultCategories = () => {
      setPredictFilterOptions((prev: any) => {
        const next = { ...(prev || {}) };
        if (!next.All) next.All = [];
        DEFAULT_TAG_ORDER.forEach((tagName) => {
          if (!next[tagName]) {
            next[tagName] = [];
          }
          if (!tagMetaRef.current[tagName]) {
            const slug = slugifyTag(tagName);
            tagMetaRef.current[tagName] = {
              slug: slug || undefined,
            };
          }
        });
        return next;
      });
    };

    const updateVolumeCategories = (_tokens: any[], allMarketIds: string[]) => {
      setPredictFilterOptions((prev: any) => {
        const {
          Trending: _omitTrending,
          '24hr Highest Volume': _omitHighestVolume,
          ...rest
        } = prev || {};
        return {
          ...rest,
          All: allMarketIds,
        };
      });
      setSelectedCategory((prev) => (prev === 'Trending' ? 'All' : prev));
    };

    const fetchVolumeMarketsPage = async () => {
      if (volumeFetchInFlightRef.current || !hasMoreVolumeMarketsRef.current) {
        return;
      }
      volumeFetchInFlightRef.current = true;

      try {
        const endDateMin = encodeURIComponent(new Date().toISOString());
        const eventsRes = await fetchPolymarketJson(
          `/predictapi/events?active=true&archived=false&closed=false&order=volume24hr&ascending=false&limit=${EVENTS_PAGE_SIZE}&offset=${volumeOffsetRef.current}&end_date_min=${endDateMin}`,
        );

        if (liveStreamCancelled) return;

        const allEvents = Array.isArray(eventsRes) ? eventsRes : [];
        if (allEvents.length === 0) {
          hasMoreVolumeMarketsRef.current = false;
          return;
        }

        hasMoreVolumeMarketsRef.current = false;

        volumeOffsetRef.current += EVENTS_PAGE_SIZE;

        const groupedMarkets = buildGroupedMarkets(allEvents);
        const entries = groupedMarkets
          .map((market: any) => formatMarketEntry(market))
          .filter(Boolean) as [string, any][];

        const freshEntries = entries.filter(([marketId]) => {
          if (!marketId) return false;
          if (seenMarketIdsRef.current.has(marketId)) return false;
          seenMarketIdsRef.current.add(marketId);
          return true;
        });

        if (freshEntries.length === 0) return;

        const newMarketIds = freshEntries.map(([marketId]) => marketId);
        marketIdsRef.current = [...marketIdsRef.current, ...newMarketIds];

        const newEntriesMap = Object.fromEntries(freshEntries);
        let mergedMarkets: any = {};

        setPredictMarketsData((prev: any) => {
          mergedMarkets = {
            ...prev,
            ...newEntriesMap,
          };
          predictMarketsRef.current = mergedMarkets;
          return mergedMarkets;
        });

        if (Object.keys(mergedMarkets).length > 0) {
          updateVolumeCategories(
            Object.values(mergedMarkets),
            marketIdsRef.current,
          );
        }
      } catch (error) {
        console.error('Error fetching Polymarket data:', error);
        hasMoreVolumeMarketsRef.current = false;
      } finally {
        volumeFetchInFlightRef.current = false;
        if (!liveStreamCancelled) {
          setIsPredictLoading(false);
        }
      }
    };

    fetchVolumePageRef.current = fetchVolumeMarketsPage;

    const fetchInitialData = async () => {
      try {
        if (Object.keys(predictMarketsRef.current || {}).length === 0) {
          ensureDefaultCategories();
          await fetchVolumeMarketsPage();
        }
      } catch (error) {
        console.error('Error fetching Polymarket data:', error);
        setPredictFilterOptions((prev: any) => ({
          ...(prev || {}),
          All: [],
        }));
      }
    };

      const updatePrices = async (currentPageMarkets: string[]) => {
        if (liveStreamCancelled || currentPageMarkets.length === 0) return;

        try {
          const category = selectedCategoryRef.current || 'All';
          const slug =
            category !== 'All' ? slugifyTag(category) : '';
          const tagParam = slug ? `&tag_slug=${encodeURIComponent(slug)}` : '';
          const offset =
            Math.max(0, perpsCurrentPageRef.current - 1) *
            itemsPerPageRef.current;

          // Fetch the exact current page for the active category
          const endDateMin = encodeURIComponent(new Date().toISOString());
          const eventsRes = await fetchPolymarketJson(
            `/predictapi/events?active=true&archived=false&closed=false&order=volume24hr&ascending=false&limit=${itemsPerPageRef.current}&offset=${offset}&end_date_min=${endDateMin}${tagParam}`,
          );

        if (liveStreamCancelled || !eventsRes) return;

        const allEvents = Array.isArray(eventsRes) ? eventsRes : [];

        // Update market prices only for currently visible markets
        setPredictMarketsData((prev: any) => {
          const updated = { ...prev };

          allEvents.forEach((event: any) => {
            (event.markets || []).forEach((market: any) => {
              if (!isMarketOpen(market, event)) return;
              // Only update if this market is in the current page
              if (updated[market.conditionId] && currentPageMarkets.includes(market.conditionId)) {
                const outcomes = typeof market.outcomes === 'string'
                  ? JSON.parse(market.outcomes)
                  : market.outcomes || [];

                const outcomePrices = typeof market.outcomePrices === 'string'
                  ? JSON.parse(market.outcomePrices)
                  : market.outcomePrices || [];

                const primaryPrice = parseFloat(outcomePrices[0] || 0);

                updated[market.conditionId] = {
                  ...updated[market.conditionId],
                  outcomes: outcomes,
                  outcomePrices: outcomePrices,
                  lastPrice: primaryPrice,
                  value: market.volume24hr || market.volume || 0,
                  volume24h: market.volume24hr || 0,
                  volume: market.volume || 0,
                  liquidity: market.liquidity || 0,
                  openInterest: market.liquidity || 0,
                  trades: Math.floor((market.volume24hr || 0) / 100) || 0,
                };
              }
            });
          });

          return updated;
        });
      } catch (error) {
        console.error('Error updating Polymarket prices:', error);
      }
    };

    const initializeData = async () => {
      await fetchInitialData();

      if (!liveStreamCancelled) {
        startTradeStream();

        // Start polling for price updates every second
        priceUpdateInterval = setInterval(() => {
          if (isPredictLoadingRef.current) return;
          // Get current page markets from realtimeCallbackRef
          const currentMarkets = realtimeCallbackRef.current.getCurrentPageMarkets?.() || [];
          updatePrices(currentMarkets);
        }, 1000);
      }
    };

    initializeData();

    return () => {
      liveStreamCancelled = true;
      if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
        priceUpdateInterval = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (reconnectIntervalRef.current) {
        clearTimeout(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [walletNames, setWalletNames] = useState<{ [address: string]: string }>(
    {},
  );
  const walletDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedWalletNames = localStorage.getItem('crystal_wallet_names');
    if (storedWalletNames) {
      try {
        setWalletNames(JSON.parse(storedWalletNames));
      } catch (error) {
        console.error('Error loading wallet names:', error);
      }
    }

    const handleWalletNamesUpdate = (event: CustomEvent) => {
      setWalletNames(event.detail);
    };

    window.addEventListener(
      'walletNamesUpdated',
      handleWalletNamesUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        'walletNamesUpdated',
        handleWalletNamesUpdate as EventListener,
      );
    };
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        walletDropdownRef.current &&
        !walletDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWalletDropdownOpen(false);
      }
    };

    if (isWalletDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isWalletDropdownOpen]);

  const getWalletTokenCount = (address: string) => {
    const balances = walletTokenBalances[address];
    if (!balances) return 0;

    const ethAddress = appSettings.chainConfig[activechain]?.eth;
    let count = 0;

    for (const [tokenAddr, balance] of Object.entries(balances)) {
      if (
        tokenAddr !== ethAddress &&
        balance &&
        BigInt(balance.toString()) > 0n
      ) {
        count++;
      }
    }

    return count;
  };

  const getWalletBalance = (address: string) => {
    const balances = walletTokenBalances[address];
    if (!balances) return 0;

    if (
      appSettings.chainConfig[activechain].eth &&
      balances[appSettings.chainConfig[activechain].eth]
    ) {
      return (
        Number(balances[appSettings.chainConfig[activechain].eth]) / 10 ** 18
      );
    }
    return 0;
  };

  const getWalletName = (address: string, index: number) => {
    return walletNames[address] || `Wallet ${index + 1}`;
  };

  const isWalletActive = (privateKey: string) => {
    return activeWalletPrivateKey === privateKey;
  };

  const toggleWalletSelection = useCallback(
    (address: string) => {
      setSelectedWallets((prev) => {
        const next = new Set(prev);
        if (next.has(address)) {
          next.delete(address);
        } else {
          next.add(address);
        }
        return next;
      });
    },
    [setSelectedWallets],
  );

  const selectAllWallets = useCallback(() => {
    setSelectedWallets(new Set(subWallets.map((w) => w.address)));
  }, [subWallets, setSelectedWallets]);

  const unselectAllWallets = useCallback(() => {
    setSelectedWallets(new Set());
  }, [setSelectedWallets]);

  const selectAllWithBalance = useCallback(() => {
    const walletsWithBalance = subWallets.filter(
      (wallet) => getWalletBalance(wallet.address) > 0,
    );
    setSelectedWallets(new Set(walletsWithBalance.map((w) => w.address)));
  }, [subWallets, setSelectedWallets, getWalletBalance]);

  const handleWalletButtonClick = () => {
    if (!account.connected) {
      setpopup(4);
    } else {
      setIsWalletDropdownOpen(!isWalletDropdownOpen);
    }
  };

  const selectedSet = useMemo(() => new Set<string>(), []);

  const totalSelectedBalance = useMemo(() => {
    if (selectedWallets.size == 0 || !activeWalletPrivateKey) {
      return (
        Number(
          walletTokenBalances?.[account.address ?? '']?.[
            settings.chainConfig[activechain]?.eth
          ] ?? 0,
        ) /
        10 ** Number(18)
      );
    }
    let total = 0;
    selectedWallets.forEach((address) => {
      total += getWalletBalance(address);
    });
    return total;
  }, [selectedWallets, walletTokenBalances]);

  const navigate = useNavigate();
  const [displaySettings] = useState<DisplaySettings>(
    () => {
      const saved = localStorage.getItem('explorer-display-settings');
      if (!saved) return DISPLAY_DEFAULTS;
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DISPLAY_DEFAULTS,
          ...parsed,
          columnOrder:
            Array.isArray(parsed?.columnOrder) && parsed.columnOrder.length
              ? parsed.columnOrder
              : DISPLAY_DEFAULTS.columnOrder,
          hiddenColumns: Array.isArray(parsed?.hiddenColumns)
            ? parsed.hiddenColumns
            : [],
          visibleRows: {
            ...DISPLAY_DEFAULTS.visibleRows,
            ...(parsed?.visibleRows || {}),
          },
          metricColors: {
            marketCap: {
              ...DISPLAY_DEFAULTS.metricColors.marketCap,
              ...(parsed?.metricColors?.marketCap || {}),
            },
            volume: {
              ...DISPLAY_DEFAULTS.metricColors.volume,
              ...(parsed?.metricColors?.volume || {}),
            },
            holders: {
              ...DISPLAY_DEFAULTS.metricColors.holders,
              ...(parsed?.metricColors?.holders || {}),
            },
          },
          metricThresholds: {
            marketCap: {
              ...DISPLAY_DEFAULTS.metricThresholds.marketCap,
              ...(parsed?.metricThresholds?.marketCap || {}),
            },
            volume: {
              ...DISPLAY_DEFAULTS.metricThresholds.volume,
              ...(parsed?.metricThresholds?.volume || {}),
            },
            holders: {
              ...DISPLAY_DEFAULTS.metricThresholds.holders,
              ...(parsed?.metricThresholds?.holders || {}),
            },
          },
        };
      } catch {
        return DISPLAY_DEFAULTS;
      }
    },
  );
  const [blacklistSettings, setBlacklistSettings] = useState<BlacklistSettings>(
    () => {
      const saved = localStorage.getItem('explorer-blacklist-settings');
      if (!saved) return BLACKLIST_DEFAULTS;
      try {
        const parsed = JSON.parse(saved);
        return {
          ...BLACKLIST_DEFAULTS,
          ...parsed,
          items: Array.isArray(parsed?.items) ? parsed.items : [],
        };
      } catch {
        return BLACKLIST_DEFAULTS;
      }
    },
  );
  const [showAlertsPopup, setShowAlertsPopup] = useState(false);
  const [showBlacklistPopup, setShowBlacklistPopup] = useState(false);

  const [activePresets, setActivePresets] = useState<
    Record<Token['status'], number>
  >(() => ({
    new: parseInt(localStorage.getItem('explorer-preset-new') ?? '1'),
    graduating: parseInt(
      localStorage.getItem('explorer-preset-graduating') ?? '1',
    ),
    graduated: parseInt(
      localStorage.getItem('explorer-preset-graduated') ?? '1',
    ),
  }));
  const [buyPresets, setBuyPresets] = useState(() => loadBuyPresets());

  const formatTimeAgo = (timestamp: number) => {
    const formatTimeAgoStatic = (createdTimestamp: number, now: number) => {
      const ageSec = now - createdTimestamp;

      if (ageSec < 60) {
        return `${Math.ceil(ageSec)}s`;
      } else if (ageSec < 3600) {
        return `${Math.floor(ageSec / 60)}m`;
      } else if (ageSec < 86400) {
        return `${Math.floor(ageSec / 3600)}h`;
      } else if (ageSec < 604800) {
        return `${Math.floor(ageSec / 86400)}d`;
      } else {
        return `${Math.floor(ageSec / 604800)}w`;
      }
    };
    return formatTimeAgoStatic(timestamp, Math.floor(Date.now() / 1000));
  };

  const isTimeOutcome = (text: string) => {
    const value = text.trim();
    if (!value) return false;
    const monthPattern =
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,?\s+\d{2,4})?$/i;
    const numericDatePattern = /^\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?$/;
    return monthPattern.test(value) || numericDatePattern.test(value);
  };

  const isTimeBasedMarket = (outcomes: unknown) => {
    if (!Array.isArray(outcomes) || outcomes.length === 0) return false;
    const matches = outcomes.filter(
      (outcome) => typeof outcome === 'string' && isTimeOutcome(outcome),
    ).length;
    return matches >= Math.max(1, Math.ceil(outcomes.length / 2));
  };

  const formatResolutionDate = (
    endMs: number,
    includeTime: boolean,
    includeYear: boolean,
  ) => {
    const date = new Date(endMs);
    if (!Number.isFinite(date.getTime())) return null;
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    if (includeYear) {
      options.year = 'numeric';
    }
    if (includeTime) {
      options.hour = 'numeric';
      options.minute = '2-digit';
    }
    return date.toLocaleString('en-US', options);
  };

  const getResolutionDate = (
    endDate: string | number | undefined,
    outcomes: unknown,
  ) => {
    if (!endDate) return null;
    const endMs =
      typeof endDate === 'number'
        ? endDate < 1e12
          ? endDate * 1000
          : endDate
        : new Date(endDate).getTime();
    if (!Number.isFinite(endMs)) return null;
    if (endMs <= Date.now()) return null;
    const sameYear = new Date(endMs).getFullYear() === new Date().getFullYear();
    const timeBased = isTimeBasedMarket(outcomes);
    const label = formatResolutionDate(endMs, sameYear && !timeBased, !sameYear);
    if (!label) return null;
    return {
      label,
      isSoon: endMs - Date.now() <= 21600000,
    };
  };

  useEffect(() => {
    localStorage.setItem(
      'explorer-display-settings',
      JSON.stringify(displaySettings),
    );
  }, [displaySettings]);

  useEffect(() => {
    localStorage.setItem(
      'explorer-alert-settings',
      JSON.stringify(alertSettings),
    );
    alertSettingsRef.current = alertSettings;
  }, [alertSettings]);

  useEffect(() => {
    localStorage.setItem(
      'explorer-blacklist-settings',
      JSON.stringify(blacklistSettings),
    );
  }, [blacklistSettings]);

  useEffect(() => {
    const handleBuyPresetsUpdate = (event: CustomEvent) => {
      setBuyPresets(event.detail);
    };

    window.addEventListener(
      'buyPresetsUpdated',
      handleBuyPresetsUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        'buyPresetsUpdated',
        handleBuyPresetsUpdate as EventListener,
      );
    };
  }, []);

  const setQuickAmount = useCallback((s: Token['status'], v: string) => {
    const clean = v.replace(/[^0-9.]/g, '');
    setQuickAmounts((p: any) => ({ ...p, [s]: clean }));
    localStorage.setItem(`explorer-quickbuy-${s}`, clean);
  }, []);

  const setActivePreset = useCallback(
    (status: Token['status'], preset: number) => {
      setActivePresets((p) => ({ ...p, [status]: preset }));
      localStorage.setItem(`explorer-preset-${status}`, preset.toString());
    },
    [],
  );

  const handleInputFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value === '0') e.target.select();
    },
    [],
  );

  const copyToClipboard = useCallback(
    async (
      text: string,
      type?: 'dev' | 'ca' | 'keyword' | 'website' | 'handle',
    ) => {
      const txId = `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      try {
        await navigator.clipboard.writeText(text);
        if (showLoadingPopup && updatePopup) {
          let title = 'Copied';
          let subtitle = '';

          if (type === 'dev') {
            title = 'Developer address copied';
            subtitle = `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`;
          } else if (type === 'ca') {
            title = 'Contract address copied';
            subtitle = `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`;
          } else if (type === 'keyword') {
            title = 'Keyword copied';
            subtitle = `"${text}" copied to clipboard`;
          } else if (type === 'website') {
            title = 'Website copied';
            subtitle = `${text} copied to clipboard`;
          } else if (type === 'handle') {
            title = 'Twitter handle copied';
            subtitle = `${text} copied to clipboard`;
          } else {
            if (/^0x[a-fA-F0-9]{40}$/.test(text)) {
              title = 'Wallet address copied';
              subtitle = `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`;
            } else {
              title = 'Copied';
              subtitle = `${text} copied to clipboard`;
            }
          }
          showLoadingPopup(txId, {
            title,
            subtitle,
          });
          setTimeout(() => {
            updatePopup(txId, {
              title,
              subtitle,
              variant: 'success',
              confirmed: true,
              isLoading: false,
            });
          }, 100);
        }
      } catch (err) {
        console.error('Copy failed', err);
        if (showLoadingPopup && updatePopup) {
          showLoadingPopup(txId, {
            title: 'Copy Failed',
            subtitle: 'Unable to copy to clipboard',
          });
          setTimeout(() => {
            updatePopup(txId, {
              title: 'Copy Failed',
              subtitle: 'Unable to copy to clipboard',
              variant: 'error',
              confirmed: true,
              isLoading: false,
            });
          }, 100);
        }
      }
    },
    [],
  );

  const handleQuickBuy = useCallback(
    async (token: Token, amt: string, buttonType: 'primary' | 'secondary') => {
      if (!account.connected) {
        setpopup(4);
        return;
      }
      const val = BigInt(parseFloat(amt) * 10 ** 18 || 0);
      if (val === 0n) return;

      const targets: string[] = Array.from(selectedWallets);
      const txId = `quickbuy-batch-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      dispatch({
        type: 'SET_LOADING',
        id: token.id,
        loading: true,
        buttonType,
      });
      try {
        if (showLoadingPopup) {
          showLoadingPopup(txId, {
            title: 'Sending batch buy...',
            subtitle: `Buying ${amt} MON of ${token.symbol} across ${targets.length == 0 ? 1 : targets.length} wallet${targets.length > 1 ? 's' : ''}`,
            amount: amt,
            amountUnit: 'MON',
            tokenImage: token.image,
          });
        }

        const isNadFun = token.source === 'nadfun';
        const contractAddress = isNadFun
          ? token.status == 'graduated'
            ? settings.chainConfig[activechain].nadFunDexRouter
            : settings.chainConfig[activechain].nadFunRouter
          : appSettings.chainConfig[activechain].router;

        let remaining = val;
        const plan: { addr: string; amount: bigint }[] = [];
        const transferPromises = [];

        if (targets.length > 0) {
          for (const addr of targets) {
            const maxWei = getMaxSpendableWei(addr);
            const fairShare = val / BigInt(targets.length);
            const allocation = fairShare > maxWei ? maxWei : fairShare;
            if (allocation > 0n) {
              plan.push({ addr, amount: allocation });
              remaining -= allocation;
            } else {
              plan.push({ addr, amount: 0n });
            }
          }
          for (const entry of plan) {
            if (remaining <= 0n) break;
            const maxWei = getMaxSpendableWei(entry.addr);
            const room = maxWei - entry.amount;
            if (room > 0n) {
              const add = remaining > room ? room : remaining;
              entry.amount += add;
              remaining -= add;
            }
          }
          if (remaining > 0n) {
            if (updatePopup) {
              updatePopup(txId, {
                title: 'Batch buy failed',
                subtitle: 'Not enough MON balance across selected wallets',
                variant: 'error',
                isLoading: false,
              });
            }

            dispatch({
              type: 'SET_LOADING',
              id: token.id,
              loading: false,
              buttonType,
            });
            return;
          }
          for (const { addr, amount: partWei } of plan) {
            if (partWei <= 0n) continue;
            const wally = subWallets.find((w) => w.address === addr);
            const pk = wally?.privateKey ?? activeWalletPrivateKey;
            if (!pk) continue;

            let uo;
            if (isNadFun) {
              if (token.status == 'graduated') {
                let minOutput = BigInt(
                  (Number(partWei) / token.price) *
                    (1 -
                      Number(
                        buyPresets[
                          buttonType == 'primary'
                            ? activePresets.graduated
                            : activePresetsSecond.graduated
                        ]?.slippage,
                      ) /
                        100),
                );
                const actions: any = [];
                actions.push(
                  encodeFunctionData({
                    abi: zeroXActionsAbi,
                    functionName: 'BASIC',
                    args: [
                      settings.chainConfig[activechain].eth,
                      9900n,
                      contractAddress,
                      100n,
                      encodeFunctionData({
                        abi: NadFunAbi,
                        functionName: 'buy',
                        args: [
                          {
                            amountOutMin: BigInt(
                              minOutput == 0n ? 1n : minOutput,
                            ),
                            token: token.id as `0x${string}`,
                            to: addr as `0x${string}`,
                            deadline: 0n,
                          },
                        ],
                      }),
                    ],
                  }),
                );
                actions.push(
                  encodeFunctionData({
                    abi: zeroXActionsAbi,
                    functionName: 'BASIC',
                    args: [
                      settings.chainConfig[activechain].eth,
                      10000n,
                      settings.chainConfig[activechain].feeAddress,
                      0n,
                      '0x',
                    ],
                  }),
                );
                uo = {
                  target: settings.chainConfig[activechain]
                    .zeroXSettler as `0x${string}`,
                  data: encodeFunctionData({
                    abi: zeroXAbi,
                    functionName: 'execute',
                    args: [
                      {
                        recipient: addr as `0x${string}`,
                        buyToken:
                          '0x0000000000000000000000000000000000000000' as `0x${string}`,
                        minAmountOut: BigInt(0n),
                      },
                      actions,
                      '0x0000000000000000000000000000000000000000000000000000000000000000',
                    ],
                  }),
                  value: partWei,
                };
              } else {
                // const fee = 99000n;
                // const iva = value * fee / 100000n;
                // const vNative = token.reserveQuote + iva;
                // const vToken = (((token.reserveQuote * token.reserveBase) + vNative - 1n) / vNative);
                // const output = Number(token.reserveBase - vToken) * (1 / (1 + (Number(buySlippageValue) / 100)));
                let minOutput = BigInt(
                  (Number(partWei) / token.price) *
                    (1 -
                      Number(
                        buyPresets[
                          buttonType == 'primary'
                            ? token.status == 'new'
                              ? activePresets.new
                              : token.status == 'graduating'
                                ? activePresets.graduating
                                : activePresets.graduated
                            : token.status == 'new'
                              ? activePresetsSecond.new
                              : token.status == 'graduating'
                                ? activePresetsSecond.graduating
                                : activePresetsSecond.graduated
                        ]?.slippage,
                      ) /
                        100),
                );

                const actions: any = [];
                actions.push(
                  encodeFunctionData({
                    abi: zeroXActionsAbi,
                    functionName: 'BASIC',
                    args: [
                      settings.chainConfig[activechain].eth,
                      9900n,
                      contractAddress,
                      100n,
                      encodeFunctionData({
                        abi: NadFunAbi,
                        functionName: 'buy',
                        args: [
                          {
                            amountOutMin: BigInt(minOutput),
                            token: token.id as `0x${string}`,
                            to: addr as `0x${string}`,
                            deadline: 0n,
                          },
                        ],
                      }),
                    ],
                  }),
                );
                actions.push(
                  encodeFunctionData({
                    abi: zeroXActionsAbi,
                    functionName: 'BASIC',
                    args: [
                      settings.chainConfig[activechain].eth,
                      10000n,
                      settings.chainConfig[activechain].feeAddress,
                      0n,
                      '0x',
                    ],
                  }),
                );
                uo = {
                  target: settings.chainConfig[activechain]
                    .zeroXSettler as `0x${string}`,
                  data: encodeFunctionData({
                    abi: zeroXAbi,
                    functionName: 'execute',
                    args: [
                      {
                        recipient: addr as `0x${string}`,
                        buyToken:
                          '0x0000000000000000000000000000000000000000' as `0x${string}`,
                        minAmountOut: BigInt(0n),
                      },
                      actions,
                      '0x0000000000000000000000000000000000000000000000000000000000000000',
                    ],
                  }),
                  value: partWei,
                };
              }
            } else {
              // const fee = 99000n;
              // const iva = partWei * fee / 100000n;
              // const vNative = token.reserveQuote + iva;
              // const vToken = (((token.reserveQuote * token.reserveBase) + vNative - 1n) / vNative);
              // const output = Number(token.reserveBase - vToken) * (1 / (1 + (Number(buyPresets[buttonType == 'primary' ? (token.status == 'new' ? activePresets.new : token.status == 'graduating' ? activePresets.graduating : activePresets.graduated) : (token.status == 'new' ? activePresetsSecond.new : token.status == 'graduating' ? activePresetsSecond.graduating : activePresetsSecond.graduated)]?.slippage) / 100)));

              uo = {
                target: contractAddress as `0x${string}`,
                data: encodeFunctionData({
                  abi: CrystalRouterAbi,
                  functionName: 'buy',
                  args: [true, token.id as `0x${string}`, partWei, BigInt(0)],
                }),
                value: partWei,
              };
            }

            const wallet = nonces.current.get(addr);
            const params = [
              { uo },
              0n,
              0n,
              false,
              pk,
              wallet?.nonce,
              false,
              false,
              1,
              addr,
            ];
            if (wallet) wallet.nonce += 1;
            wallet?.pendingtxs.push(params);
            const transferPromise = sendUserOperationAsync(...params)
              .then(() => {
                if (wallet)
                  wallet.pendingtxs = wallet.pendingtxs.filter(
                    (p: any) => p[5] != params[5],
                  );
                return true;
              })
              .catch(() => {
                if (wallet)
                  wallet.pendingtxs = wallet.pendingtxs.filter(
                    (p: any) => p[5] != params[5],
                  );
                return false;
              });
            transferPromises.push(transferPromise);
          }
        } else {
          if (account?.address && !activeWalletPrivateKey) {
            let uo;

            if (isNadFun) {
              if (token.status == 'graduated') {
                let minOutput = BigInt(
                  (Number(val) / token.price) *
                    (1 -
                      Number(
                        buyPresets[
                          buttonType == 'primary'
                            ? activePresets.graduated
                            : activePresetsSecond.graduated
                        ]?.slippage,
                      ) /
                        100),
                );
                const actions: any = [];
                actions.push(
                  encodeFunctionData({
                    abi: zeroXActionsAbi,
                    functionName: 'BASIC',
                    args: [
                      settings.chainConfig[activechain].eth,
                      9900n,
                      contractAddress,
                      100n,
                      encodeFunctionData({
                        abi: NadFunAbi,
                        functionName: 'buy',
                        args: [
                          {
                            amountOutMin: BigInt(
                              minOutput == 0n ? 1n : minOutput,
                            ),
                            token: token.id as `0x${string}`,
                            to: account.address as `0x${string}`,
                            deadline: 0n,
                          },
                        ],
                      }),
                    ],
                  }),
                );
                actions.push(
                  encodeFunctionData({
                    abi: zeroXActionsAbi,
                    functionName: 'BASIC',
                    args: [
                      settings.chainConfig[activechain].eth,
                      10000n,
                      settings.chainConfig[activechain].feeAddress,
                      0n,
                      '0x',
                    ],
                  }),
                );
                uo = {
                  target: settings.chainConfig[activechain]
                    .zeroXSettler as `0x${string}`,
                  data: encodeFunctionData({
                    abi: zeroXAbi,
                    functionName: 'execute',
                    args: [
                      {
                        recipient: account.address as `0x${string}`,
                        buyToken:
                          '0x0000000000000000000000000000000000000000' as `0x${string}`,
                        minAmountOut: BigInt(0n),
                      },
                      actions,
                      '0x0000000000000000000000000000000000000000000000000000000000000000',
                    ],
                  }),
                  value: val,
                };
              } else {
                // const fee = 99000n;
                // const iva = value * fee / 100000n;
                // const vNative = token.reserveQuote + iva;
                // const vToken = (((token.reserveQuote * token.reserveBase) + vNative - 1n) / vNative);
                // const output = Number(token.reserveBase - vToken) * (1 / (1 + (Number(buySlippageValue) / 100)));
                let minOutput = BigInt(
                  (Number(val) / token.price) *
                    (1 -
                      Number(
                        buyPresets[
                          buttonType == 'primary'
                            ? token.status == 'new'
                              ? activePresets.new
                              : token.status == 'graduating'
                                ? activePresets.graduating
                                : activePresets.graduated
                            : token.status == 'new'
                              ? activePresetsSecond.new
                              : token.status == 'graduating'
                                ? activePresetsSecond.graduating
                                : activePresetsSecond.graduated
                        ]?.slippage,
                      ) /
                        100),
                );

                const actions: any = [];
                actions.push(
                  encodeFunctionData({
                    abi: zeroXActionsAbi,
                    functionName: 'BASIC',
                    args: [
                      settings.chainConfig[activechain].eth,
                      9900n,
                      contractAddress,
                      100n,
                      encodeFunctionData({
                        abi: NadFunAbi,
                        functionName: 'buy',
                        args: [
                          {
                            amountOutMin: BigInt(minOutput),
                            token: token.id as `0x${string}`,
                            to: account.address as `0x${string}`,
                            deadline: 0n,
                          },
                        ],
                      }),
                    ],
                  }),
                );
                actions.push(
                  encodeFunctionData({
                    abi: zeroXActionsAbi,
                    functionName: 'BASIC',
                    args: [
                      settings.chainConfig[activechain].eth,
                      10000n,
                      settings.chainConfig[activechain].feeAddress,
                      0n,
                      '0x',
                    ],
                  }),
                );
                uo = {
                  target: settings.chainConfig[activechain]
                    .zeroXSettler as `0x${string}`,
                  data: encodeFunctionData({
                    abi: zeroXAbi,
                    functionName: 'execute',
                    args: [
                      {
                        recipient: account.address as `0x${string}`,
                        buyToken:
                          '0x0000000000000000000000000000000000000000' as `0x${string}`,
                        minAmountOut: BigInt(0n),
                      },
                      actions,
                      '0x0000000000000000000000000000000000000000000000000000000000000000',
                    ],
                  }),
                  value: val,
                };
              }
            } else {
              uo = {
                target: contractAddress as `0x${string}`,
                data: encodeFunctionData({
                  abi: CrystalRouterAbi,
                  functionName: 'buy',
                  args: [true, token.id as `0x${string}`, val, 0n],
                }),
                value: val,
              };
            }

            const transferPromise = sendUserOperationAsync({ uo });
            transferPromises.push(
              transferPromise
                .then(() => {
                  return true;
                })
                .catch(() => {
                  return false;
                }),
            );
          }
        }

        const results = await Promise.allSettled(transferPromises);
        const successfulTransfers = results.filter(
          (result) => result.status === 'fulfilled' && result.value === true,
        ).length;

        if (updatePopup) {
          updatePopup(txId, {
            title: `Bought ${amt} MON Worth`,
            subtitle: `Distributed across ${successfulTransfers} wallet${successfulTransfers !== 1 ? 's' : ''}`,
            variant: 'success',
            confirmed: true,
            isLoading: false,
            tokenImage: token.image,
          });
        }
      } catch (e: any) {
        console.error('Quick buy failed', e);
        const msg = String(e?.message ?? '');
        if (updatePopup) {
          updatePopup(txId, {
            title: msg.toLowerCase().includes('insufficient')
              ? 'Insufficient Balance'
              : 'Buy Failed',
            subtitle: msg || 'Transaction failed',
            variant: 'error',
            confirmed: true,
            isLoading: false,
            tokenImage: token.image,
          });
        }
      } finally {
        dispatch({
          type: 'SET_LOADING',
          id: token.id,
          loading: false,
          buttonType,
        });
      }
    },
    [
      sendUserOperationAsync,
      selectedWallets,
      subWallets,
      activeWalletPrivateKey,
      getMaxSpendableWei,
      account,
      nonces,
      activechain,
    ],
  );

  const handleTokenClick = useCallback(
    (t: Token) => {
      setTokenData(t);
      const marketKey = (t as any).contractId || (t as any).contractName;
      const marketSlug = (t as any).eventSlug || (t as any).slug || marketKey;
      if (marketKey) {
        setPredictActiveMarketKey(marketKey);
      }
      if (setOnlyThisMarket) {
        setOnlyThisMarket(true);
      }
      navigate(`/event/${marketSlug}`);
    },
    [navigate, setOnlyThisMarket, setPredictActiveMarketKey],
  );

  const hideToken = useCallback(
    (id: string) => {
      if (hidden.has(id)) {
        dispatch({ type: 'SHOW_TOKEN', id });
      } else {
        dispatch({ type: 'HIDE_TOKEN', id });
      }
    },
    [hidden],
  );

  const handleBlacklistToken = useCallback(
    (token: Token) => {
      const existingItem = blacklistSettings.items.find(
        (item) =>
          item.type === 'dev' &&
          item.text.toLowerCase() === token.dev.toLowerCase(),
      );

      if (existingItem) {
        setBlacklistSettings((prev) => ({
          items: prev.items.filter((item) => item.id !== existingItem.id),
        }));

        const txId = `blacklist-removed-${Date.now()}`;
        if (showLoadingPopup && updatePopup) {
          showLoadingPopup(txId, {
            title: 'Developer Unblacklisted',
            subtitle: `Tokens from ${token.dev.slice(0, 6)}...${token.dev.slice(-4)} are now visible`,
          });
          setTimeout(() => {
            updatePopup(txId, {
              title: 'Developer Unblacklisted',
              subtitle: `Tokens from ${token.dev.slice(0, 6)}...${token.dev.slice(-4)} are now visible`,
              variant: 'success',
              confirmed: true,
              isLoading: false,
            });
          }, 100);
        }
        return;
      }

      const newItem = {
        id: Date.now().toString(),
        text: token.dev,
        type: 'dev' as const,
      };
      setBlacklistSettings((prev) => ({ items: [...prev.items, newItem] }));

      const txId = `blacklist-success-${Date.now()}`;
      if (showLoadingPopup && updatePopup) {
        showLoadingPopup(txId, {
          title: 'Developer Blacklisted',
          subtitle: `All tokens from ${token.dev.slice(0, 6)}...${token.dev.slice(-4)} are now hidden`,
        });
        setTimeout(() => {
          updatePopup(txId, {
            title: 'Developer Blacklisted',
            subtitle: `All tokens from ${token.dev.slice(0, 6)}...${token.dev.slice(-4)} are now hidden`,
            variant: 'success',
            confirmed: true,
            isLoading: false,
          });
        }, 100);
      }
    },
    [blacklistSettings],
  );

  const applyFilters = useCallback((list: Token[], fil: any) => {
    if (!fil) return list;
    return list.filter((t) => {
      if (
        fil.priceMin !== undefined &&
        fil.priceMin !== '' &&
        t.price < +fil.priceMin
      )
        return false;
      if (
        fil.priceMax !== undefined &&
        fil.priceMax !== '' &&
        t.price > +fil.priceMax
      )
        return false;

      if (
        fil.marketCapMin !== undefined &&
        fil.marketCapMin !== '' &&
        t.marketCap < +fil.marketCapMin
      )
        return false;
      if (
        fil.marketCapMax !== undefined &&
        fil.marketCapMax !== '' &&
        t.marketCap > +fil.marketCapMax
      )
        return false;

      if (
        fil.volumeMin !== undefined &&
        fil.volumeMin !== '' &&
        t.volume24h < +fil.volumeMin
      )
        return false;
      if (
        fil.volumeMax !== undefined &&
        fil.volumeMax !== '' &&
        t.volume24h > +fil.volumeMax
      )
        return false;

      if (
        fil.holdersMin !== undefined &&
        fil.holdersMin !== '' &&
        t.holders < +fil.holdersMin
      )
        return false;
      if (
        fil.holdersMax !== undefined &&
        fil.holdersMax !== '' &&
        t.holders > +fil.holdersMax
      )
        return false;

      if (fil.ageMin !== undefined && fil.ageMin !== '') {
        const ageHours = (Date.now() / 1000 - t.created) / 3600;
        if (ageHours < +fil.ageMin) return false;
      }
      if (fil.ageMax !== undefined && fil.ageMax !== '') {
        const ageHours = (Date.now() / 1000 - t.created) / 3600;
        if (ageHours > +fil.ageMax) return false;
      }

      if (fil.searchKeywords && fil.searchKeywords.trim()) {
        const keywords = fil.searchKeywords
          .toLowerCase()
          .split(',')
          .map((x: string) => x.trim())
          .filter(Boolean);
        const searchText =
          `${t.name} ${t.symbol} ${t.description}`.toLowerCase();
        if (!keywords.some((keyword: string) => searchText.includes(keyword)))
          return false;
      }

      if (fil.hasTwitter && !t.twitterHandle) return false;
      if (fil.hasWebsite && !t.website) return false;
      if (fil.hasTelegram && !t.telegramHandle) return false;
      if (fil.hasDiscord && !t.discordHandle) return false;
      if (
        fil.sniperHoldingMax !== undefined &&
        fil.sniperHoldingMax !== '' &&
        t.sniperHolding > +fil.sniperHoldingMax
      )
        return false;
      if (
        fil.devHoldingMax !== undefined &&
        fil.devHoldingMax !== '' &&
        t.devHolding > +fil.devHoldingMax
      )
        return false;
      if (
        fil.insiderHoldingMax !== undefined &&
        fil.insiderHoldingMax !== '' &&
        t.insiderHolding > +fil.insiderHoldingMax
      )
        return false;
      if (
        fil.top10HoldingMax !== undefined &&
        fil.top10HoldingMax !== '' &&
        t.top10Holding > +fil.top10HoldingMax
      )
        return false;
      if (
        fil.proTradersMin !== undefined &&
        fil.proTradersMin !== '' &&
        t.proTraders < +fil.proTradersMin
      )
        return false;
      return true;
    });
  }, []);

  const { blacklistedDevs, blacklistedCAs } = useMemo(() => {
    const devs = new Set<string>();
    const cas = new Set<string>();

    for (const item of blacklistSettings.items) {
      const lowerText = item.text.toLowerCase();
      if (item.type === 'dev') devs.add(lowerText);
      else if (item.type === 'ca') cas.add(lowerText);
    }

    return { blacklistedDevs: devs, blacklistedCAs: cas };
  }, [blacklistSettings.items]);

  const visibleTokens = useMemo(() => {
    const processTokens = (tokens: Token[], status: Token['status']) => {
      const hideHidden = displaySettings.hideHiddenTokens;
      const hasFilters = appliedFilters?.[status];

      let result = tokens;

      result = tokens
        .filter((token) => {
          const isBlacklisted =
            blacklistedDevs.has(token.dev.toLowerCase()) ||
            blacklistedCAs.has(token.id.toLowerCase());

          if (hideHidden && (hidden.has(token.id) || isBlacklisted)) {
            return false;
          }

          return true;
        })
        .map((token) => ({
          ...token,
          isBlacklisted:
            blacklistedDevs.has(token.dev.toLowerCase()) ||
            blacklistedCAs.has(token.id.toLowerCase()),
        }));

      if (hasFilters) {
        result = applyFilters(result, appliedFilters[status]);
      }

      return result;
    };

    return {
      new: processTokens(tokensByStatus.new, 'new'),
      graduating: processTokens(tokensByStatus.graduating, 'graduating'),
      graduated: processTokens(tokensByStatus.graduated, 'graduated'),
    };
  }, [
    tokensByStatus.new,
    tokensByStatus.graduating,
    tokensByStatus.graduated,
    hidden,
    appliedFilters,
    displaySettings.hideHiddenTokens,
    blacklistedDevs,
    blacklistedCAs,
  ]);

  const newTokens = visibleTokens.new;
  const graduatingTokens = visibleTokens.graduating;
  const graduatedTokens = visibleTokens.graduated;

  const [perpsSortField, setPerpsSortField] = useState<'market' | 'change' | 'volume' | 'openInterest' | 'trades' | 'endDate' | null>('volume');
  const [perpsSortDirection, setPerpsSortDirection] = useState<'asc' | 'desc' | undefined>('desc');
  const [perpsCurrentPage, setPerpsCurrentPage] = useState(1);
  const [favoriteMarkets, setFavoriteMarkets] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const hasSetDefaultCategoryRef = useRef(false);
  const [liveTrades, setLiveTrades] = useState<any[]>([]);
  const [tradeMinSize, setTradeMinSize] = useState('');
  const [tradeSideFilter, setTradeSideFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [activeMultiScrollCard, setActiveMultiScrollCard] = useState<string | null>(null);
  const [isPredictLoading, setIsPredictLoading] = useState(
    () => Object.keys(predictMarketsData || {}).length === 0,
  );
  const initialPredictLoadRef = useRef(true);
  const predictMarketsRef = useRef<any>({});
    const [marketHoverData, setMarketHoverData] = useState<Record<string, { orderbook?: any; series?: any }>>({});
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [itemsPerPage, setItemsPerPage] = useState(40);
    const MAX_LIVE_TRADES = 50;
    const EVENTS_PAGE_SIZE = 100;
    const TAG_EVENTS_LIMIT = 100;
    const DEFAULT_TAG_ORDER = [
      'Politics',
      'Sports',
      'Crypto',
      'Finance',
      'Geopolitics',
      'Earnings',
      'Tech',
      'Culture',
      'World',
      'Economy',
      'Climate & Science',
      'Elections',
    ];
    const tagMetaRef = useRef<Record<string, { id?: number; slug?: string }>>({});
    const tagFetchInFlightRef = useRef<Set<string>>(new Set());
    const tagFetchedRef = useRef<Set<string>>(new Set());
    const marketIdsRef = useRef<string[]>([]);
    const seenMarketIdsRef = useRef<Set<string>>(new Set());
    const volumeOffsetRef = useRef(0);
    const hasMoreVolumeMarketsRef = useRef(true);
    const volumeFetchInFlightRef = useRef(false);
    const trendingListRef = useRef<HTMLDivElement | null>(null);
    const fetchVolumePageRef = useRef<(() => void) | null>(null);

    const normalizeTagName = (value: string) =>
      value
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');

    useEffect(() => {
      const updateItemsPerPage = () => {
        const width = window.innerWidth;
        const columns =
          width <= 768 ? 1 : width <= 1200 ? 2 : width <= 1600 ? 3 : 4;
        setItemsPerPage(columns * 10);
      };

      updateItemsPerPage();
      window.addEventListener('resize', updateItemsPerPage);
      return () => window.removeEventListener('resize', updateItemsPerPage);
    }, []);

    const slugifyTag = (value: string) =>
      normalizeTagName(value).replace(/\s+/g, '-');

    useEffect(() => {
      if (!isPredictLoading) return;
      if (
        initialPredictLoadRef.current &&
        Object.keys(predictMarketsData || {}).length > 0
      ) {
        setIsPredictLoading(false);
        initialPredictLoadRef.current = false;
      }
    }, [isPredictLoading, predictMarketsData]);

  useEffect(() => {
    predictMarketsRef.current = predictMarketsData || {};
  }, [predictMarketsData]);

  useEffect(() => {
    isPredictLoadingRef.current = isPredictLoading;
  }, [isPredictLoading]);

  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  useEffect(() => {
    perpsCurrentPageRef.current = perpsCurrentPage;
  }, [perpsCurrentPage]);

  useEffect(() => {
    itemsPerPageRef.current = itemsPerPage;
  }, [itemsPerPage]);

    const fetchPolymarketJson = useCallback(async (path: string) => {
      const response = await fetch(path, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const body = contentType.includes('application/json')
          ? JSON.stringify(await response.json())
          : await response.text();
        throw new Error(
          `Polymarket request failed (${response.status}) for ${path}: ${body.slice(0, 200)}`,
        );
      }
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(
          `Polymarket response not JSON for ${path}: ${text.slice(0, 200)}`,
        );
      }
      return response.json();
    }, []);

    const resolveTagMeta = useCallback(async (category: string) => {
      let tagMeta = tagMetaRef.current[category];

      if (!tagMeta || (tagMeta.id == null && !tagMeta.slug)) {
        const fallbackSlug = slugifyTag(category);
        if (fallbackSlug) {
          tagMeta = { slug: fallbackSlug };
          tagMetaRef.current[category] = tagMeta;
        }
      }

      return tagMeta;
    }, [slugifyTag]);

    const isMarketOpen = useCallback((market: any, event?: any) => {
      if (!market) return false;
      if (event?.archived || market?.archived) return false;
      if (event?.closed || market?.closed) return false;
      if (event?.active === false || market?.active === false) return false;
      return true;
    }, []);

    const buildGroupedMarkets = useCallback((events: any[]) => {
      const groupedMarkets: any[] = [];

      events.forEach((event: any) => {
        const activeMarkets = (event.markets || []).filter((m: any) =>
          isMarketOpen(m, event),
        );

        if (activeMarkets.length === 0) return;
        const isResolved = Boolean(event.closed || activeMarkets.every((m: any) => m.closed));
        const eventMeta = {
          eventClosed: event.closed ?? false,
          eventActive: event.active ?? true,
          eventArchived: event.archived ?? false,
        };

        if (activeMarkets.length > 2) {
          groupedMarkets.push({
            conditionId: `event-${event.slug || event.id}`,
            eventId: event.slug || event.id,
            eventTitle: event.title,
            eventSlug: event.slug,
            eventImage: event.image || event.icon,
            eventTags: event.tags || [],
            isMultiOutcome: true,
            active: true,
            closed: isResolved,
            eventClosed: eventMeta.eventClosed,
            eventActive: eventMeta.eventActive,
            eventArchived: eventMeta.eventArchived,
            outcomes: activeMarkets.map((m: any) => m.groupItemTitle || m.question),
            outcomePrices: activeMarkets.map((m: any) => {
              const prices = typeof m.outcomePrices === 'string'
                ? JSON.parse(m.outcomePrices)
                : m.outcomePrices || [];
              return parseFloat(prices[0] || 0);
            }),
            markets: activeMarkets,
            volume24hr: activeMarkets.reduce((sum: number, m: any) => sum + (m.volume24hr || 0), 0),
            volume: activeMarkets.reduce((sum: number, m: any) => sum + (m.volume || 0), 0),
            liquidity: activeMarkets.reduce((sum: number, m: any) => sum + (Number(m.liquidity) || 0), 0),
            endDate: activeMarkets[0]?.endDate,
            startDate: activeMarkets[0]?.startDate,
            fundingTime: new Date(activeMarkets[0]?.startDate || activeMarkets[0]?.creationDate || Date.now()).getTime(),
          });
        } else {
          activeMarkets.forEach((market: any) => {
            groupedMarkets.push({
              ...market,
              eventTitle: event.title,
              eventSlug: event.slug,
              eventImage: event.image || event.icon,
              eventTags: event.tags || [],
              isMultiOutcome: false,
              closed: Boolean(market.closed || event.closed),
              eventClosed: eventMeta.eventClosed,
              eventActive: eventMeta.eventActive,
              eventArchived: eventMeta.eventArchived,
            });
          });
        }
      });

      return groupedMarkets;
    }, [isMarketOpen]);

    const formatMarketEntry = useCallback((market: any) => {
      if (!market?.conditionId) return null;

      const outcomes = typeof market.outcomes === 'string'
        ? JSON.parse(market.outcomes)
        : market.outcomes || [];

      const outcomePrices = typeof market.outcomePrices === 'string'
        ? JSON.parse(market.outcomePrices)
        : market.outcomePrices || [];

      const numericOutcomePrices = outcomePrices
        .map((price: any) => Number(price))
        .filter((price: number) => Number.isFinite(price));
      const isMultiOutcome = Boolean(market.isMultiOutcome || outcomePrices.length > 2);
      const primaryPrice = isMultiOutcome
        ? (numericOutcomePrices.length > 0 ? Math.max(...numericOutcomePrices) : 0)
        : Number(outcomePrices[0] || 0);
      const isOpen = isMarketOpen(market, {
        closed: market.eventClosed,
        archived: market.eventArchived,
        active: market.eventActive,
      });
      const questionText = (market.question || market.eventTitle || '').toString();
      const shortName = questionText
        .replace(/^Will\s+/i, '')
        .replace(/^Is\s+/i, '')
        .replace(/\?.*$/, '')
        .substring(0, 50);

      return [
        market.conditionId,
        {
          contractId: market.conditionId,
          contractName: market.conditionId,
          baseAsset: shortName,
          quoteAsset: 'USD',
          iconURL: market.image || market.eventImage || '',
          question: market.question,
          outcomes: outcomes,
          outcomePrices: outcomePrices,
          // Price fields
          lastPrice: primaryPrice,
          priceChangePercent: market.oneDayPriceChange || 0,
          // Volume fields - Polymarket uses volume in USD
          value: market.volume24hr || market.volume || 0,
          volume: market.volume || 0,
          volume24h: market.volume24hr || 0,
          // Liquidity
          liquidity: market.liquidity || 0,
          openInterest: market.liquidity || 0, // Use liquidity as proxy for OI
          // Funding rate (Polymarket doesn't have this, set to 0)
          fundingRate: 0,
          fundingTime: new Date(market.startDate || market.creationDate || Date.now()).getTime(),
          // Trade count (use a reasonable estimate based on volume)
          trades: Math.floor((market.volume24hr || 0) / 100) || 0,
          // Status
          enableDisplay: isOpen,
          status: 'graduated', // All Polymarket markets are "active"
          // Social links (Polymarket doesn't provide these directly)
          twitterHandle: market.twitterHandle || '',
          telegram: market.telegram || '',
          discord: market.discord || '',
          website: `https://polymarket.com/event/${market.eventSlug || market.slug}`,
          // Additional Polymarket-specific fields
          clobTokenIds: market.clobTokenIds || [],
          marketSlug: market.slug,
          eventTitle: market.eventTitle,
          eventSlug: market.eventSlug,
          endDate: market.endDate,
          startDate: market.startDate,
          closed: Boolean(market.closed || market.eventClosed),
          isBlacklisted: false,
          bondingPercentage: 1, // All markets are "complete"
          source: 'polymarket',
        },
      ] as [string, any];
    }, []);

    const compareTokens = useCallback((
      a: any,
      b: any,
      field: 'market' | 'change' | 'volume' | 'openInterest' | 'trades' | 'endDate' | null,
      direction: 'asc' | 'desc' | undefined,
    ) => {
      if (!field || !direction) return 0;

      if (field === 'market') {
        const cmp = (a.baseAsset || '').localeCompare(b.baseAsset || '');
        return direction === 'asc' ? cmp : -cmp;
      }

      let aValue = 0;
      let bValue = 0;

      switch (field) {
        case 'change':
          aValue = parseFloat((a.lastPrice || 0).toString());
          bValue = parseFloat((b.lastPrice || 0).toString());
          break;
        case 'volume':
          aValue = parseFloat((a.value || 0).toString().replace(/,/g, ''));
          bValue = parseFloat((b.value || 0).toString().replace(/,/g, ''));
          break;
        case 'openInterest':
          aValue = parseFloat((a.liquidity || 0).toString());
          bValue = parseFloat((b.liquidity || 0).toString());
          break;
        case 'trades':
          aValue = parseFloat((a.trades || 0).toString());
          bValue = parseFloat((b.trades || 0).toString());
          break;
        case 'endDate':
          aValue = new Date(a.endDate || 0).getTime();
          bValue = new Date(b.endDate || 0).getTime();
          break;
        default:
          return 0;
      }

      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }, []);

    const handlePerpsSort = (field: 'market' | 'change' | 'volume' | 'openInterest' | 'trades' | 'endDate') => {
      if (perpsSortField === field) {
        setPerpsSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setPerpsSortField(field);
        setPerpsSortDirection('desc');
      }
      setPerpsCurrentPage(1);
    };

  // Fetch orderbook and series data on hover
  const fetchMarketHoverData = useCallback(async (conditionId: string, tokenId?: string) => {
    try {
      // Fetch orderbook
      const orderbookPromise = fetch(`/clob/book?token_id=${tokenId || conditionId}`)
        .then(res => res.json())
        .catch(err => {
          console.warn('Failed to fetch orderbook:', err);
          return null;
        });

      // Fetch series
      const seriesPromise = fetch(`/clob/series?id=${conditionId}`)
        .then(res => res.json())
        .catch(err => {
          console.warn('Failed to fetch series:', err);
          return null;
        });

      const [orderbook, series] = await Promise.all([orderbookPromise, seriesPromise]);

      setMarketHoverData(prev => ({
        ...prev,
        [conditionId]: { orderbook, series }
      }));
    } catch (error) {
      console.error('Error fetching market hover data:', error);
    }
  }, []);

  const handleMarketHover = useCallback((conditionId: string, tokenId?: string) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set new timeout to fetch data after 300ms hover
    hoverTimeoutRef.current = setTimeout(() => {
      // Only fetch if we don't already have the data
      if (!marketHoverData[conditionId]) {
        fetchMarketHoverData(conditionId, tokenId);
      }
    }, 300);
  }, [marketHoverData, fetchMarketHoverData]);

    const handleMarketLeave = useCallback(() => {
      // Clear timeout if user leaves before 300ms
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    }, []);

    const fetchAllMarketsForTag = useCallback(async (category: string) => {
      if (tagFetchInFlightRef.current.has(category)) return;
      if (tagFetchedRef.current.has(category)) return;

      const tagMeta = await resolveTagMeta(category);
      if (!tagMeta) return;

      const tagSlug = tagMeta.slug ? tagMeta.slug.trim() : '';
      const tagParam = tagMeta.id != null
        ? `tag_id=${tagMeta.id}`
        : tagSlug
          ? `tag_slug=${encodeURIComponent(tagSlug)}`
          : '';
      if (!tagParam) return;

      setIsPredictLoading(true);
      tagFetchInFlightRef.current.add(category);

      try {
        const endDateMin = encodeURIComponent(new Date().toISOString());
        const page = await fetchPolymarketJson(
          `/predictapi/events?active=true&archived=false&closed=false&${tagParam}&order=volume24hr&ascending=false&limit=${TAG_EVENTS_LIMIT}&offset=0&end_date_min=${endDateMin}`,
        );

        if (!Array.isArray(page) || page.length === 0) {
          tagFetchedRef.current.add(category);
          return;
        }

        const groupedMarkets = buildGroupedMarkets(page);
        const entries = groupedMarkets
          .map((market: any) => formatMarketEntry(market))
          .filter(Boolean) as [string, any][];

        if (entries.length > 0) {
          setPredictMarketsData((prev: any) => ({
            ...prev,
            ...Object.fromEntries(entries),
          }));
        }

        const categoryMarketIds = Array.from(
          new Set(
            groupedMarkets
              .map((market: any) => market.conditionId)
              .filter(Boolean),
          ),
        );

        setPredictFilterOptions((prev: any) => ({
          ...(prev || {}),
          [category]: categoryMarketIds,
        }));

        tagFetchedRef.current.add(category);
      } catch (error) {
        console.error('Error fetching full tag markets:', error);
      } finally {
        tagFetchInFlightRef.current.delete(category);
        setIsPredictLoading(false);
      }
    }, [buildGroupedMarkets, fetchPolymarketJson, formatMarketEntry, resolveTagMeta, setPredictFilterOptions, setPredictMarketsData]);

    const scrollTrendingListToTop = useCallback(() => {
      const grid = trendingListRef.current;
      if (grid) {
        grid.scrollTop = 0;
      }
    }, []);

    const handleCategoryClick = useCallback((category: string) => {
      const isSameCategory = category === selectedCategory;
      setSelectedCategory(category);
      setPerpsCurrentPage(1);
      if (isSameCategory) {
        scrollTrendingListToTop();
        return;
      }
      if (category !== 'All') {
        setPerpsSortField('volume');
        setPerpsSortDirection('desc');
        const cachedIds = predictFilterOptions?.[category];
        const hasCachedIds = Array.isArray(cachedIds) && cachedIds.length > 0;

        if (hasCachedIds) {
          setIsPredictLoading(false);
          return;
        }

        setIsPredictLoading(true);
        setPredictFilterOptions((prev: any) => ({
          ...(prev || {}),
          [category]: [],
        }));
        fetchAllMarketsForTag(category);
      } else {
        setIsPredictLoading(false);
      }
    }, [fetchAllMarketsForTag, predictFilterOptions, scrollTrendingListToTop, selectedCategory]);

  const trendingTokens = useMemo(() => {
    // Filter by category first
    let filtered = Object.values(predictMarketsData).filter((t: any) => t.enableDisplay) as any[];

    if (selectedCategory && selectedCategory !== 'All' && predictFilterOptions[selectedCategory]) {
      const categoryMarketIds = predictFilterOptions[selectedCategory];
      filtered = filtered.filter((t: any) => categoryMarketIds.includes(t.contractId));
    }

    if (perpsSortField && perpsSortDirection) {
      filtered.sort((a, b) => compareTokens(a, b, perpsSortField, perpsSortDirection));
    }

    return filtered;
  }, [compareTokens, predictMarketsData, perpsSortField, perpsSortDirection, selectedCategory, predictFilterOptions]);

  useEffect(() => {
    if (hasSetDefaultCategoryRef.current) return;
    if (predictFilterOptions?.All?.length) {
      setSelectedCategory('All');
      setPerpsCurrentPage(1);
      hasSetDefaultCategoryRef.current = true;
      return;
    }
  }, [predictFilterOptions]);

  const paginatedTokens = useMemo(() => {
    const startIndex = (perpsCurrentPage - 1) * itemsPerPage;
    const endIndex = perpsCurrentPage * itemsPerPage;
    return trendingTokens.slice(startIndex, endIndex);
  }, [trendingTokens, perpsCurrentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(trendingTokens.length / itemsPerPage);
  }, [trendingTokens, itemsPerPage]);
  const hasMoreVolumePages =
    selectedCategory === 'All' && hasMoreVolumeMarketsRef.current;
  const showPagination = totalPages > 1 || hasMoreVolumePages;
  const showPredictLoading = isPredictLoading && paginatedTokens.length === 0;
  const categoryList = useMemo(() => {
    const keys = Object.keys(predictFilterOptions || {}).filter(
      (category) =>
        category !== 'Trending' && category !== '24hr Highest Volume',
    );
    if (keys.length > 0) return keys;
    return ['All', ...DEFAULT_TAG_ORDER];
  }, [predictFilterOptions]);

  useEffect(() => {
    if (!totalPages || perpsCurrentPage <= totalPages) return;
    setPerpsCurrentPage(totalPages);
  }, [perpsCurrentPage, totalPages]);

  const handleMultiOutcomeEnter = useCallback((contractId: string) => {
    if (multiOutcomeHoverTimeoutRef.current) {
      clearTimeout(multiOutcomeHoverTimeoutRef.current);
    }
    multiOutcomeHoverTimeoutRef.current = setTimeout(() => {
      setActiveMultiScrollCard(contractId);
    }, 400);
  }, []);

  const handleMultiOutcomeLeave = useCallback(() => {
    if (multiOutcomeHoverTimeoutRef.current) {
      clearTimeout(multiOutcomeHoverTimeoutRef.current);
      multiOutcomeHoverTimeoutRef.current = null;
    }
    setActiveMultiScrollCard(null);
  }, []);

  const getTradeAmount = useCallback((trade: any) => {
    const raw = trade?.amount ?? trade?.size ?? trade?.quantity ?? 0;
    const parsed = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }, []);

  const isTradeBuy = useCallback((trade: any) => {
    return trade?.side === 'BUY' || trade?.type === 'buy' || trade?.isBuy;
  }, []);

  const filteredLiveTrades = useMemo(() => {
    const min = parseFloat(tradeMinSize);
    const minSize = Number.isFinite(min) ? min : 0;

    return liveTrades.filter((trade) => {
      const amount = getTradeAmount(trade);
      if (minSize > 0 && amount < minSize) return false;

      const isBuy = isTradeBuy(trade);
      if (tradeSideFilter === 'buy' && !isBuy) return false;
      if (tradeSideFilter === 'sell' && isBuy) return false;
      return true;
    });
  }, [getTradeAmount, isTradeBuy, liveTrades, tradeMinSize, tradeSideFilter]);

  // Update the callback with current page markets for real-time price updates
  useEffect(() => {
    realtimeCallbackRef.current.getCurrentPageMarkets = () => {
      return paginatedTokens.map((token: any) => token.contractId);
    };
  }, [paginatedTokens]);

  const toggleFavorite = (contractId: string) => {
    setFavoriteMarkets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contractId)) {
        newSet.delete(contractId);
      } else {
        newSet.add(contractId);
      }
      return newSet;
    });
  };

  return (
    <div className="explorer-main">
      <div className="explorer-container">
        <div className="predict-layout-with-stream">
            {/* Live Trade Stream Sidebar */}
            <div className="predict-trade-stream-sidebar">
              <div className="predict-trade-stream-header">
                <div className="predict-trade-stream-title-row">
                  <h3>Live Trades</h3>
                  <div className="predict-trade-stream-filters">
                    <div className="predict-trade-filter-group">
                      <label
                        className="predict-trade-filter-label"
                        htmlFor="predict-trade-min-size"
                      >
                        Min $
                      </label>
                      <input
                        id="predict-trade-min-size"
                        className="predict-trade-filter-input"
                        inputMode="decimal"
                        placeholder="0"
                        value={tradeMinSize}
                        onChange={(e) =>
                          setTradeMinSize(
                            e.target.value.replace(/[^0-9.]/g, ''),
                          )
                        }
                      />
                    </div>
                    <div className="predict-trade-filter-group">
                      <select
                        className="predict-trade-filter-select"
                        value={tradeSideFilter}
                        onChange={(e) =>
                          setTradeSideFilter(e.target.value as 'all' | 'buy' | 'sell')
                        }
                      >
                        <option value="all">All</option>
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="predict-trade-stream-list">
                {filteredLiveTrades.length === 0 ? (
                  <div className="predict-trade-stream-empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <p>{liveTrades.length === 0 ? 'Waiting for trades...' : 'No trades match filters.'}</p>
                  </div>
                ) : (
                  filteredLiveTrades.map((trade, idx) => {
                    const timestamp = trade?.timestamp ?? trade?.time ?? trade?.ts ?? trade?.createdAt ?? Date.now();
                    const timeAgo = formatTimeAgo(typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp);
                    const isBuy = isTradeBuy(trade);
                    const amount = getTradeAmount(trade);
                    const price = trade?.price || 0;
                    const market = trade?.market || trade?.marketName || trade?.eventName || 'Unknown';

                    return (
                      <div key={idx} className="predict-trade-stream-item">
                        <div className="predict-trade-stream-item-header">
                          <span className="predict-trade-stream-market">{market.length > 30 ? market.substring(0, 30) + '...' : market}</span>
                          <span className="predict-trade-stream-time">{timeAgo}</span>
                        </div>
                        <div className="predict-trade-stream-item-details">
                          <span className={`predict-trade-stream-side ${isBuy ? 'buy' : 'sell'}`}>
                            {isBuy ? 'YES' : 'NO'}
                          </span>
                          <span className="predict-trade-stream-price">{(price * 100).toFixed(1)}¢</span>
                          <span className="predict-trade-stream-amount">${formatCommas(amount.toFixed(0))}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="trending-container predict-grid-container predict-trending-container">
            {/* Filter and Sort Bar */}
            <div className="predict-filter-bar">
              {/* Category Filters */}
              <div className="predict-category-filters">
                {categoryList.map((category) => {
                  const label = category === 'All' ? 'Trending' : category;
                  return (
                    <button
                      key={category}
                      className={`predict-category-btn ${selectedCategory === category ? 'active' : ''}`}
                      onClick={() => handleCategoryClick(category)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Sort Dropdown */}
              <div className="predict-sort-container">
                <label className="predict-sort-label">Sort by:</label>
                <select
                  value={perpsSortField || ''}
                  onChange={(e) => handlePerpsSort(e.target.value as any)}
                  className="predict-sort-select"
                >
                  <option value="volume">Highest Volume</option>
                  <option value="openInterest">Highest Liquidity</option>
                  <option value="change">Highest Probability</option>
                  <option value="trades">Most Traders</option>
                  <option value="endDate">Ending Soon</option>
                </select>
                <button
                  className="predict-sort-direction-btn"
                  onClick={() => {
                    setPerpsSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                    setPerpsCurrentPage(1);
                  }}
                  title={perpsSortDirection === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: perpsSortDirection === 'asc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                  >
                    <path d="M12 5v14M19 12l-7 7-7-7"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="trending-list" ref={trendingListRef}>
              {showPredictLoading ? (
                Array.from({ length: itemsPerPage }).map((_, index) => (
                  <div
                    key={`skeleton-trending-${index}`}
                    className="trending-row perps loading"
                  >
                    <div className="trending-cell pair-info-cell">
                      <div className="skeleton trending-image perps" />
                      <div className="skeleton trending-name-text perps" />
                    </div>
                    <div className="trending-cell">
                      <div className="skeleton trending-value-text" />
                    </div>
                    <div className="trending-cell">
                      <div className="skeleton trending-value-text" />
                    </div>
                    <div className="trending-cell">
                      <div className="skeleton trending-value-text" />
                    </div>
                    <div className="trending-cell action-cell" style={{gap: '10px'}}>
                      <div className="skeleton trending-button perps" />
                      <div className="skeleton trending-button perps" />
                    </div>
                  </div>
                ))
              ) : paginatedTokens.length ? (
                paginatedTokens.map((token) => {
                  const outcomes = token.outcomes || ['Yes', 'No'];
                  const outcomePrices = token.outcomePrices || [token.lastPrice, 1 - token.lastPrice];
                  const isMultiOutcome = outcomes.length > 2;
                  const isResolved = Boolean(token.closed || token.eventClosed);
                  const endTimestamp = token.endDate ? new Date(token.endDate).getTime() : Number.NaN;
                  const endLabel = Number.isFinite(endTimestamp)
                    ? new Date(endTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '';
                  const statusLabel = isResolved ? 'Resolved' : 'Live';
                  const statusTitle = isResolved
                    ? 'Resolved market'
                    : endLabel
                      ? `Ends ${endLabel}`
                      : 'Active market';
                  const resolution = !isResolved
                    ? getResolutionDate(token.endDate, token.outcomes)
                    : null;
                  const sortedOutcomes = isMultiOutcome
                    ? outcomes
                        .map((outcome: string, index: number) => ({
                          outcome,
                          probability: Number(outcomePrices[index] || 0),
                          index,
                        }))
                        .sort((a: { probability: number }, b: { probability: number }) => b.probability - a.probability)
                    : [];

                  // For multi-outcome markets, render a special card layout
                  if (isMultiOutcome) {
                    return (
                      <div
                        key={token.contractId}
                        className={`trending-row perps multi-outcome ${hidden.has(token.contractId) ? 'hidden-token' : ''} ${token.isBlacklisted ? 'blacklisted-token' : ''} ${isResolved ? 'predict-market-resolved' : ''}`}
                        onClick={() => handleTokenClick(token)}
                        onMouseEnter={() => {
                          handleMarketHover(token.contractId, token.tokenID);
                          handleMultiOutcomeEnter(token.contractId);
                        }}
                        onMouseLeave={() => {
                          handleMarketLeave();
                          handleMultiOutcomeLeave();
                        }}
                      >
                        {/* Event Header */}
                        <div className="trending-cell pair-info-cell">
                          <div
                            className={`perps-trending-token-image-container ${token.status === 'graduated' ? 'graduated' : ''} ${!displaySettings.squareImages ? 'circle-mode' : ''} ${!displaySettings.progressBar ? 'no-progress-ring' : ''} ${token.source === 'nadfun' ? 'nadfun-token' : ''}`}
                            style={
                              token.status === 'graduated' ||
                              !displaySettings.progressBar
                                ? { position: 'relative' }
                                : ({
                                    position: 'relative',
                                    '--progress-angle': `${((token.bondingPercentage * 100) / 100) * 360}deg`,
                                  } as React.CSSProperties & {
                                    '--progress-angle': string;
                                  })
                            }
                          >
                            <div
                              className={`perps-trending-progress-spacer ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
                            >
                              <div
                                className={`trending-image-wrapper ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
                              >
                                {token.iconURL && (token.iconURL.startsWith('https://static') || token.iconURL.startsWith('https://polymarket') || token.iconURL.startsWith('http')) ? (
                                  <img
                                    src={token.iconURL}
                                    className={`perps-trending-token-image ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
                                    alt={token.baseAsset}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      if (target.nextElementSibling) {
                                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                      }
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`trending-token-letter ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
                                  style={{ display: (token.iconURL && (token.iconURL.startsWith('https://static') || token.iconURL.startsWith('https://polymarket') || token.iconURL.startsWith('http'))) ? 'none' : 'flex' }}
                                >
                                  {token.baseAsset.slice(0, 2).toUpperCase()}
                                </div>
                              </div>
                            </div>
                            {/* Removed Polymarket badge - it's the default */}
                            <div className="perps-token-explorer-launchpad-logo-container" style={{ display: 'none' }}>
                              {token.iconURL.startsWith(
                                  'https://static',
                                ) ? (
                                <Tooltip content="edgeX">
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 32 32"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="perps-token-explorer-launchpad-logo"
                                  >
                                    <defs>
                                      <linearGradient
                                        id="nadfun"
                                        x1="0%"
                                        y1="0%"
                                        x2="100%"
                                        y2="0%"
                                      >
                                        <stop
                                          offset="0%"
                                          stopColor="#7C55FF"
                                          stopOpacity="1"
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor="#AD5FFB"
                                          stopOpacity="1"
                                        />
                                      </linearGradient>
                                    </defs>
                                    <path
                                      fill="url(#nadfun)"
                                      d="m29.202 10.664-4.655-3.206-3.206-4.653A6.48 6.48 0 0 0 16.004 0a6.48 6.48 0 0 0-5.337 2.805L7.46 7.458l-4.654 3.206a6.474 6.474 0 0 0 0 10.672l4.654 3.206 3.207 4.653A6.48 6.48 0 0 0 16.004 32a6.5 6.5 0 0 0 5.337-2.805l3.177-4.616 4.684-3.236A6.49 6.49 0 0 0 32 16.007a6.47 6.47 0 0 0-2.806-5.335zm-6.377 5.47c-.467 1.009-1.655.838-2.605 1.06-2.264.528-2.502 6.813-3.05 8.35-.424 1.484-1.916 1.269-2.272 0-.631-1.53-.794-6.961-2.212-7.993-.743-.542-2.502-.267-3.177-.95-.668-.675-.698-1.729-.023-2.412l5.3-5.298a1.734 1.734 0 0 1 2.45 0l5.3 5.298c.505.505.586 1.306.297 1.937z"
                                    />
                                  </svg>
                                </Tooltip>
                              ) : (
                                <Tooltip content="crystal.fun">
                                  <img
                                    src={crystal}
                                    className="token-explorer-launchpad-logo crystal"
                                  />
                                </Tooltip>
                              )}
                            </div>
                          </div>

                          <div className="perps-trending-token-info">
                            <div
                              className="trending-token-name-row"
                            >
                              <div className="predict-multi-title">
                                {token.eventTitle || token.baseAsset}
                              </div>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '-4px'
                              }}
                            >
                              {resolution && (
                                <span
                                  className="trending-time-created"
                                  style={{
                                    color:
                                      resolution.isSoon
                                        ? '#f77f7d'
                                        : 'rgb(67, 254, 154)',
                                  }}
                                >
                                  {resolution.label}
                                </span>
                              )}
                              <div className="token-socials-row">
                                {token.twitterHandle && (
                                  <Tooltip content="Twitter">
                                    <TwitterHover url={token.twitterHandle}>
                                      <a
                                        className="explorer-avatar-btn"
                                        href={token.twitterHandle}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <img
                                          src={
                                            token.twitterHandle.includes(
                                              '/i/communities/',
                                            )
                                              ? communities
                                              : token.twitterHandle.includes(
                                                    '/status/',
                                                  )
                                                ? tweet
                                                : avatar
                                          }
                                          alt={
                                            token.twitterHandle.includes(
                                              '/i/communities/',
                                            )
                                              ? 'Community'
                                              : 'Twitter'
                                          }
                                          className={
                                            token.twitterHandle.includes(
                                              '/i/communities/',
                                            )
                                              ? 'community-icon'
                                              : token.twitterHandle.includes(
                                                    '/status/',
                                                  )
                                                ? 'tweet-icon'
                                                : 'avatar-icon'
                                          }
                                        />
                                      </a>
                                    </TwitterHover>
                                  </Tooltip>
                                )}
                                {token.telegram && (
                                  <Tooltip content="Telegram">
                                    <a
                                      href={token.telegram}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="token-social-link"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <img src={telegram} alt="Telegram" />
                                    </a>
                                  </Tooltip>
                                )}
                                {token.discord && (
                                  <Tooltip content="Discord">
                                    <a
                                      href={token.discord}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="token-social-link"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <img src={discord} alt="Discord" />
                                    </a>
                                  </Tooltip>
                                )}
                                {token.website && (
                                  <Tooltip content="Website">
                                    <a
                                      className="explorer-website-btn"
                                      href={token.website}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Tooltip content={token.website}>
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="currentColor"
                                        >
                                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                        </svg>
                                      </Tooltip>
                                    </a>
                                  </Tooltip>
                                )}
                                <Tooltip content="Search Asset on Twitter">
                                  <a
                                    className="explorer-telegram-btn"
                                    href={`https://twitter.com/search?q=$${token.baseAsset}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Search size={14} />
                                  </a>
                                </Tooltip>
                                <button
                                  className="predict-favorite-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(token.contractId);
                                  }}
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill={favoriteMarkets.has(token.contractId) ? '#aaaecf' : 'none'}
                                    stroke={favoriteMarkets.has(token.contractId) ? '#aaaecf' : 'rgba(255,255,255,0.5)'}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Outcomes List */}
                        <div
                          className={`predict-multi-outcomes ${activeMultiScrollCard === token.contractId ? 'scroll-enabled' : ''}`}
                        >
                          {sortedOutcomes.map((entry: { outcome: string; probability: number; index: number }, rank: number) => {
                            const probability = entry.probability;
                            const outcome = entry.outcome;
                            const outcomeIndex = entry.index;

                            // Clean up the outcome text to extract the key information
                            let displayName = outcome;

                            // Try to extract numeric/specific parts: "by 50+ bps", "by 25 bps", etc.
                            const byMatch = outcome.match(/by\s+([^?\s][^?]*?)(?:\s+after|\s+before|\s+in|\?|$)/i);
                            if (byMatch) {
                              displayName = byMatch[1].trim();
                            } else {
                              // Try to extract names: "Will Trump nominate Kevin Warsh" -> "Kevin Warsh"
                              const nominateMatch = outcome.match(/(?:nominate|choose|select|appoint)\s+([A-Z][^?]+?)(?:\s+as|\?|$)/);
                              if (nominateMatch) {
                                displayName = nominateMatch[1].trim();
                              } else if (outcome.includes('?')) {
                                // Remove question mark and common prefixes
                                displayName = outcome
                                  .replace(/\?$/, '')
                                  .replace(/^Will\s+/i, '')
                                  .replace(/^Does\s+/i, '')
                                  .replace(/^Did\s+/i, '')
                                  .replace(/^Is\s+/i, '')
                                  .replace(/^Are\s+/i, '')
                                  .trim();
                              }
                            }

                            return (
                              <div
                                key={outcomeIndex}
                                className={`predict-multi-outcome-row`}
                              >
                                <div className="predict-multi-outcome-info">
                                  <span className="predict-multi-outcome-name">
                                    {displayName}
                                  </span>
                                  <span className="predict-multi-outcome-probability">
                                    {(probability * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <div className="predict-multi-outcome-actions">
                                  <button
                                    className="predict-multi-yes-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickBuy(token, quickAmounts.new, rank === 0 ? 'primary' : 'secondary');
                                    }}
                                    disabled={isResolved || loading.has(`${token.contractId}-${outcomeIndex}`)}
                                  >
                                    {loading.has(`${token.contractId}-${outcomeIndex}`) ? (
                                      <div className="quickbuy-loading-spinner" />
                                    ) : (
                                      'Yes'
                                    )}
                                  </button>
                                  <button
                                    className="predict-multi-no-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickBuy(token, quickAmounts.new, rank === 0 ? 'secondary' : 'primary');
                                    }}
                                    disabled={isResolved || loading.has(`${token.contractId}-${outcomeIndex}-no`)}
                                  >
                                    {loading.has(`${token.contractId}-${outcomeIndex}-no`) ? (
                                      <div className="quickbuy-loading-spinner" />
                                    ) : (
                                      'No'
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Volume Footer */}
                        <div className="predict-multi-footer">
                          <div className="predict-metric metric-volume">
                            <BarChart3 className="predict-metric-icon" size={14} />
                            <span className="predict-metric-value">
                              ${formatCompactNumber(Number(token.value || 0))}
                            </span>
                          </div>
                          <div className="predict-metric metric-liquidity">
                            <svg
                              className="predict-metric-icon"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2C14 2 8 9 8 13a6 6 0 0 0 12 0c0-4-6-11-6-11z" />
                            </svg>
                            <span className="predict-metric-value">
                              ${formatCompactNumber(Number(token.liquidity || 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Standard 2-outcome market
                  return (
                    <div
                      key={token.contractId}
                      className={`trending-row perps ${hidden.has(token.contractId) ? 'hidden-token' : ''} ${token.isBlacklisted ? 'blacklisted-token' : ''} ${isResolved ? 'predict-market-resolved' : ''}`}
                      onClick={() => handleTokenClick(token)}
                      onMouseEnter={() => handleMarketHover(token.contractId, token.tokenID)}
                      onMouseLeave={handleMarketLeave}
                  >
                    <div className="trending-cell pair-info-cell">
                      <div className="trending-token-actions">
                        <button
                          className={`explorer-hide-button ${hidden.has(token.contractId) ? 'strikethrough' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            hideToken(token.contractId);
                          }}
                        >
                          <Tooltip
                            content={
                              hidden.has(token.contractId) ? 'Show Token' : 'Hide Token'
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </Tooltip>
                        </button>
                        <button
                          className={`explorer-blacklist-button ${token.isBlacklisted ? 'strikethrough' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBlacklistToken(token);
                            hideToken(token.contractId);
                          }}
                        >
                          <Tooltip
                            content={
                              token.isBlacklisted
                                ? 'Unblacklist Dev'
                                : 'Blacklist Dev'
                            }
                          >
                            <svg
                              className="blacklist-dev-icon"
                              width="16"
                              height="16"
                              viewBox="0 0 30 30"
                              fill="currentColor"
                            >
                              <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                            </svg>
                          </Tooltip>
                        </button>
                      </div>
                      <div
                        className={`perps-trending-token-image-container ${token.status === 'graduated' ? 'graduated' : ''} ${!displaySettings.squareImages ? 'circle-mode' : ''} ${!displaySettings.progressBar ? 'no-progress-ring' : ''} ${token.source === 'nadfun' ? 'nadfun-token' : ''}`}
                        style={
                          token.status === 'graduated' ||
                          !displaySettings.progressBar
                            ? { position: 'relative' }
                            : ({
                                position: 'relative',
                                '--progress-angle': `${((token.bondingPercentage * 100) / 100) * 360}deg`,
                              } as React.CSSProperties & {
                                '--progress-angle': string;
                              })
                        }
                      >
                        <div
                          className={`perps-trending-progress-spacer ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
                        >
                          <div
                            className={`trending-image-wrapper ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
                          >
                            {token.iconURL && (token.iconURL.startsWith('https://static') || token.iconURL.startsWith('https://polymarket') || token.iconURL.startsWith('http')) ? (
                              <img
                                src={token.iconURL}
                                className={`perps-trending-token-image ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
                                alt={token.baseAsset}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  if (target.nextElementSibling) {
                                    (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className={`trending-token-letter ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
                              style={{ display: (token.iconURL && (token.iconURL.startsWith('https://static') || token.iconURL.startsWith('https://polymarket') || token.iconURL.startsWith('http'))) ? 'none' : 'flex' }}
                            >
                              {token.baseAsset.slice(0, 2).toUpperCase()}
                            </div>
                          </div>
                        </div>
                        {/* Removed Polymarket badge - it's the default */}
                        <div className="perps-token-explorer-launchpad-logo-container" style={{ display: 'none' }}>
                          {token.iconURL.startsWith(
                              'https://static',
                            ) ? (
                            <Tooltip content="edgeX">
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 32 32"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="perps-token-explorer-launchpad-logo"
                              >
                                <defs>
                                  <linearGradient
                                    id="nadfun"
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="0%"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#7C55FF"
                                      stopOpacity="1"
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#AD5FFB"
                                      stopOpacity="1"
                                    />
                                  </linearGradient>
                                </defs>
                                <path
                                  fill="url(#nadfun)"
                                  d="m29.202 10.664-4.655-3.206-3.206-4.653A6.48 6.48 0 0 0 16.004 0a6.48 6.48 0 0 0-5.337 2.805L7.46 7.458l-4.654 3.206a6.474 6.474 0 0 0 0 10.672l4.654 3.206 3.207 4.653A6.48 6.48 0 0 0 16.004 32a6.5 6.5 0 0 0 5.337-2.805l3.177-4.616 4.684-3.236A6.49 6.49 0 0 0 32 16.007a6.47 6.47 0 0 0-2.806-5.335zm-6.377 5.47c-.467 1.009-1.655.838-2.605 1.06-2.264.528-2.502 6.813-3.05 8.35-.424 1.484-1.916 1.269-2.272 0-.631-1.53-.794-6.961-2.212-7.993-.743-.542-2.502-.267-3.177-.95-.668-.675-.698-1.729-.023-2.412l5.3-5.298a1.734 1.734 0 0 1 2.45 0l5.3 5.298c.505.505.586 1.306.297 1.937z"
                                />
                              </svg>
                            </Tooltip>
                          ) : (
                            <Tooltip content="crystal.fun">
                              <img
                                src={crystal}
                                className="token-explorer-launchpad-logo crystal"
                              />
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      <div className="perps-trending-token-info">
                        <div
                          className="trending-token-name-row"
                        >
                          <div className="predict-multi-title">
                            {token.eventTitle || token.baseAsset}
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '-4px'
                          }}
                        >
                          {resolution && (
                            <span
                              className="trending-time-created"
                              style={{
                                color:
                                  resolution.isSoon
                                    ? '#f77f7d'
                                    : 'rgb(67, 254, 154)',
                              }}
                            >
                              {resolution.label}
                            </span>
                          )}
                          <div className="token-socials-row">
                            {token.twitterHandle && (
                              <Tooltip content="Twitter">
                                <TwitterHover url={token.twitterHandle}>
                                  <a
                                    className="explorer-avatar-btn"
                                    href={token.twitterHandle}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <img
                                      src={
                                        token.twitterHandle.includes(
                                          '/i/communities/',
                                        )
                                          ? communities
                                          : token.twitterHandle.includes(
                                                '/status/',
                                              )
                                            ? tweet
                                            : avatar
                                      }
                                      alt={
                                        token.twitterHandle.includes(
                                          '/i/communities/',
                                        )
                                          ? 'Community'
                                          : 'Twitter'
                                      }
                                      className={
                                        token.twitterHandle.includes(
                                          '/i/communities/',
                                        )
                                          ? 'community-icon'
                                          : token.twitterHandle.includes(
                                                '/status/',
                                              )
                                            ? 'tweet-icon'
                                            : 'avatar-icon'
                                      }
                                    />
                                  </a>
                                </TwitterHover>
                              </Tooltip>
                            )}
                            {token.telegram && (
                              <Tooltip content="Telegram">
                                <a
                                  href={token.telegram}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="token-social-link"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <img src={telegram} alt="Telegram" />
                                </a>
                              </Tooltip>
                            )}
                            {token.discord && (
                              <Tooltip content="Discord">
                                <a
                                  href={token.discord}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="token-social-link"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <img src={discord} alt="Discord" />
                                </a>
                              </Tooltip>
                            )}
                            {token.website && (
                              <Tooltip content="Website">
                                <a
                                  className="explorer-website-btn"
                                  href={token.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Tooltip content={token.website}>
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                    >
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                    </svg>
                                  </Tooltip>
                                </a>
                              </Tooltip>
                            )}
                            <Tooltip content="Search Asset on Twitter">
                              <a
                                className="explorer-telegram-btn"
                                href={`https://twitter.com/search?q=$${token.baseAsset}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Search size={14} />
                              </a>
                            </Tooltip>
                            <button
                              className="predict-favorite-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(token.contractId);
                              }}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill={favoriteMarkets.has(token.contractId) ? '#aaaecf' : 'none'}
                                stroke={favoriteMarkets.has(token.contractId) ? '#aaaecf' : 'rgba(255,255,255,0.5)'}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="perps-trending-cell">
                      <div className="predict-probability">
                        <div className="predict-probability-main">
                          {(Number(token.lastPrice) * 100).toFixed(0)}%
                        </div>
                        <span
                          className={`predict-probability-change ${token.priceChangePercent >= 0 ? 'positive' : 'negative'}`}
                        >
                          {token.priceChangePercent >= 0 ? '+' : ''}
                          {(token.priceChangePercent * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="trending-cell action-cell" style={{gap: '10px'}}>
                      {(() => {
                        const outcomes = token.outcomes || ['Yes', 'No'];
                        const outcomePrices = token.outcomePrices || [token.lastPrice, 1 - token.lastPrice];
                        const outcome1 = outcomes[0] || 'Yes';
                        const outcome2 = outcomes[1] || 'No';
                        const yesPrice = Number(outcomePrices[0] || token.lastPrice || 0.5);
                        const noPrice = Number(outcomePrices[1] || (1 - yesPrice));

                        return (
                          <>
                            <button
                              className={`perps-trending-buy-btn`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickBuy(token, quickAmounts.new, 'primary');
                              }}
                              disabled={isResolved || loading.has(`${token.contractId}-primary`)}
                            >
                              {loading.has(`${token.contractId}-primary`) ? (
                                <div className="quickbuy-loading-spinner" />
                              ) : (
                                <span className="mon-text">{outcome1.length > 10 ? outcome1.substring(0, 10) + '...' : outcome1} {(yesPrice * 100).toFixed(0)}¢</span>
                              )}
                            </button>
                            <button
                              className={`perps-trending-sell-btn`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickBuy(token, quickAmounts.new, 'secondary');
                              }}
                              disabled={isResolved || loading.has(`${token.contractId}-secondary`)}
                            >
                              {loading.has(`${token.contractId}-secondary`) ? (
                                <div className="quickbuy-loading-spinner" />
                              ) : (
                                <span className="mon-text">{outcome2.length > 10 ? outcome2.substring(0, 10) + '...' : outcome2} {(noPrice * 100).toFixed(0)}¢</span>
                              )}
                            </button>
                          </>
                        );
                      })()}
                    </div>

                    <div className="predict-multi-footer">
                      <div className="predict-metric metric-volume">
                        <BarChart3 className="predict-metric-icon" size={14} />
                        <span className="predict-metric-value">
                          ${formatCompactNumber(Number(token.value || 0))}
                        </span>
                      </div>
                      <div className="predict-metric metric-liquidity">
                        <svg
                          className="predict-metric-icon"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2C14 2 8 9 8 13a6 6 0 0 0 12 0c0-4-6-11-6-11z" />
                        </svg>
                        <span className="predict-metric-value">
                          ${formatCompactNumber(Number(token.liquidity || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
                })
              ) : (
                <div className="no-tokens-message">
                  <img src={empty} className="empty-icon" />
                  No trending tokens found
                </div>
              )}
              {showPagination && (
                <div className="predict-pagination predict-pagination-in-grid">
                  <button
                    className="predict-pagination-btn"
                    onClick={() => {
                      setPerpsCurrentPage((prev) => Math.max(1, prev - 1));
                      scrollTrendingListToTop();
                    }}
                    disabled={perpsCurrentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="predict-pagination-info">
                    Page {perpsCurrentPage} of{' '}
                    {hasMoreVolumePages ? `${totalPages}+` : totalPages} (
                    {trendingTokens.length} markets)
                  </span>
                  <button
                    className="predict-pagination-btn"
                    onClick={() => {
                      const canAdvanceBeyond =
                        selectedCategory === 'All' &&
                        hasMoreVolumeMarketsRef.current;
                      if (canAdvanceBeyond) {
                        fetchVolumePageRef.current?.();
                      }
                      setPerpsCurrentPage((prev) =>
                        canAdvanceBeyond
                          ? prev + 1
                          : Math.min(totalPages, prev + 1),
                      );
                      scrollTrendingListToTop();
                    }}
                    disabled={
                      perpsCurrentPage === totalPages &&
                      !(
                        selectedCategory === 'All' &&
                        hasMoreVolumeMarketsRef.current
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <AlertsPopup
        isOpen={showAlertsPopup}
        onClose={() => setShowAlertsPopup(false)}
        settings={alertSettings}
        onSettingsChange={setAlertSettings}
      />
      <BlacklistPopup
        isOpen={showBlacklistPopup}
        onClose={() => setShowBlacklistPopup(false)}
        settings={blacklistSettings}
        onSettingsChange={setBlacklistSettings}
        onCopyToClipboard={copyToClipboard}
      />
    </div>
  );
};

export default PredictExplorer;
