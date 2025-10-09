import {
  BarChart3,
  Bell,
  ChevronDown,
  Eye,
  EyeOff,
  Hash,
  Image,
  Play,
  RotateCcw,
  Search,
  Volume2,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { HexColorPicker } from 'react-colorful';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { encodeFunctionData } from 'viem';

import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi.ts';
import { settings as appSettings } from '../../settings';
import { loadBuyPresets } from '../../utils/presetManager';
import {
  showLoadingPopup,
  updatePopup,
} from '../MemeTransactionPopup/MemeTransactionPopupManager';

import avatar from '../../assets/avatar.png';
import camera from '../../assets/camera.svg';
import closebutton from '../../assets/close_button.png';
import communities from '../../assets/community.png';
import discord from '../../assets/discord1.svg';
import empty from '../../assets/empty.svg';
import filter from '../../assets/filter.svg';
import lightning from '../../assets/flash.png';
import gas from '../../assets/gas.svg';
import kaching from '../../assets/ka-ching.mp3';
import monadicon from '../../assets/monadlogo.svg';
import reset from '../../assets/reset.svg';
import slippage from '../../assets/slippage.svg';
import stepaudio from '../../assets/step_audio.mp3';
import telegram from '../../assets/telegram.png';
import trash from '../../assets/trash.svg';
import tweet from '../../assets/tweet.png';
import walleticon from '../../assets/wallet_icon.png';
import { TwitterHover } from '../TwitterHover/TwitterHover';

import './TokenExplorer.css';

export interface Token {
  id: string;
  tokenAddress: string;
  dev: string;
  name: string;
  symbol: string;
  image: string;
  price: number;
  marketCap: number;
  change24h: number;
  volume24h: number;
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
        top = rect.bottom + scrollY + offset;
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
              transform: `${position === 'top' || position === 'bottom'
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
    audioRef.current = new Audio(stepaudio);
    audioRef.current.volume = settings.volume / 100;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
      setOpenDropdowns((prev) => ({ ...prev, [soundType]: false }));
    }
    event.target.value = '';
  };

  const selectSound = (
    soundType: keyof AlertSettings['sounds'],
    soundValue: string,
  ) => {
    updateSoundSetting(soundType, soundValue);
    setOpenDropdowns((prev) => ({ ...prev, [soundType]: false }));
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
                            <button
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
                                  title="Play sound"
                                >
                                  <Play size={14} />
                                </button>

                                <button
                                  className="sound-action-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateSoundSetting(key, stepaudio);
                                  }}
                                  title="Reset to default"
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
                                      closeDropdown(key);
                                    }}
                                  >
                                    Step Audio
                                  </button>
                                  <button
                                    className={`sound-dropdown-item ${settings.sounds[key] === kaching ? 'active' : ''}`}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      selectSound(key, kaching);
                                      closeDropdown(key);
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
                                        closeDropdown(key);
                                      }}
                                    />
                                  </label>
                                </div>
                              )}
                            </button>
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
}

interface TabFilters {
  new: any;
  graduating: any;
  graduated: any;
}

const DISPLAY_DEFAULTS: DisplaySettings = {
  metricSize: 'small',
  quickBuySize: 'small',
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
  secondQuickBuyColor: '#aaaecf',
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
    marketCap: { range1: '#d8dcff', range2: '#eab308', range3: '#14b8a6' },
    volume: { range1: '#ffffff', range2: '#ffffff', range3: '#ffffff' },
    holders: { range1: '#ffffff', range2: '#ffffff', range3: '#ffffff' },
  },
};
const BLACKLIST_DEFAULTS: BlacklistSettings = { items: [] };

const getMetricColorClasses = (
  token: Token | undefined,
  display: DisplaySettings,
) => {
  if (!token || !display?.metricColors || !display?.metricColoring) return null;

  const classes: string[] = [];
  const cssVars: Record<string, string> = {};

  if (typeof token.marketCap === 'number' && !isNaN(token.marketCap)) {
    if (token.marketCap < 30000) {
      classes.push('market-cap-range1');
      cssVars['--metric-market-cap-range1'] =
        display.metricColors.marketCap.range1;
    } else if (token.marketCap < 150000) {
      classes.push('market-cap-range2');
      cssVars['--metric-market-cap-range2'] =
        display.metricColors.marketCap.range2;
    } else {
      classes.push('market-cap-range3');
      cssVars['--metric-market-cap-range3'] =
        display.metricColors.marketCap.range3;
    }
  }

  // Volume coloring
  if (typeof token.volume24h === 'number' && !isNaN(token.volume24h)) {
    if (token.volume24h < 1000) {
      classes.push('volume-range1');
      cssVars['--metric-volume-range1'] = display.metricColors.volume.range1;
    } else if (token.volume24h < 2000) {
      classes.push('volume-range2');
      cssVars['--metric-volume-range2'] = display.metricColors.volume.range2;
    } else {
      classes.push('volume-range3');
      cssVars['--metric-volume-range3'] = display.metricColors.volume.range3;
    }
  }

  // Holders coloring
  if (typeof token.holders === 'number' && !isNaN(token.holders)) {
    if (token.holders < 10) {
      classes.push('holders-range1');
      cssVars['--metric-holders-range1'] = display.metricColors.holders.range1;
    } else if (token.holders < 50) {
      classes.push('holders-range2');
      cssVars['--metric-holders-range2'] = display.metricColors.holders.range2;
    } else {
      classes.push('holders-range3');
      cssVars['--metric-holders-range3'] = display.metricColors.holders.range3;
    }
  }

  return classes.length > 0 ? { classes: classes.join(' '), cssVars } : null;
};

const hasMetricColoring = (displaySettings: DisplaySettings | undefined) => {
  return displaySettings?.metricColoring === true;
};

const getBondingColorClass = (percentage: number) => {
  if (percentage < 25) return 'bonding-0-25';
  if (percentage < 50) return 'bonding-25-50';
  if (percentage < 75) return 'bonding-50-75';
  return 'bonding-75-100';
};

const getBondingColor = (b: number) => {
  if (b < 25) return '#ee5b5bff';
  if (b < 50) return '#f59e0b';
  if (b < 75) return '#eab308';
  return '#43e17dff';
};

const createColorGradient = (base: string) => {
  const hex = base.replace('#', '');
  const [r, g, b] = [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
  const lighter = (x: number) => Math.min(255, Math.round(x + (255 - x) * 0.3));
  const darker = (x: number) => Math.round(x * 0.7);
  return {
    start: `rgb(${darker(r)}, ${darker(g)}, ${darker(b)})`,
    mid: base,
    end: `rgb(${lighter(r)}, ${lighter(g)}, ${lighter(b)})`,
  };
};

const formatPrice = (p: number, noDecimals = false) => {
  if (p >= 1e12)
    return `$${noDecimals ? Math.round(p / 1e12) : (p / 1e12).toFixed(1)}T`;
  if (p >= 1e9)
    return `$${noDecimals ? Math.round(p / 1e9) : (p / 1e9).toFixed(1)}B`;
  if (p >= 1e6)
    return `$${noDecimals ? Math.round(p / 1e6) : (p / 1e6).toFixed(1)}M`;
  if (p >= 1e3)
    return `$${noDecimals ? Math.round(p / 1e3) : (p / 1e3).toFixed(1)}K`;
  return `$${noDecimals ? Math.round(p) : p.toFixed(2)}`;
};

const calculateBondingPercentage = (marketCap: number) => {
  const bondingPercentage = Math.min((marketCap / 25000) * 100, 100);
  return bondingPercentage;
};

const DisplayDropdown: React.FC<{
  settings: DisplaySettings;
  onSettingsChange: (settings: DisplaySettings) => void;
  quickAmountsSecond: Record<Token['status'], string>;
  setQuickAmountSecond: (status: Token['status'], value: string) => void;
  activePresetsSecond: Record<Token['status'], number>;
  setActivePresetSecond: (status: Token['status'], preset: number) => void;
}> = ({
  settings,
  onSettingsChange,
  quickAmountsSecond,
  setQuickAmountSecond,
  activePresetsSecond,
  setActivePresetSecond,
}) => {
    const [showSecondButtonColorPicker, setShowSecondButtonColorPicker] =
      useState(false);
    const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
    const [showMetricColorPicker, setShowMetricColorPicker] = useState(false);
    const [metricPickerPosition, setMetricPickerPosition] = useState({
      top: 0,
      left: 0,
    });
    const [hexInputValue, setHexInputValue] = useState(
      settings.secondQuickBuyColor.replace('#', '').toUpperCase(),
    );
    useEffect(() => {
      setHexInputValue(
        settings.secondQuickBuyColor.replace('#', '').toUpperCase(),
      );
    }, [settings.secondQuickBuyColor]);
    const [activeMetricPicker, setActiveMetricPicker] = useState<{
      metric: 'marketCap' | 'volume' | 'holders';
      range: 'range1' | 'range2' | 'range3';
    } | null>(null);
    const handleColorPickerClick = (event: React.MouseEvent) => {
      event.stopPropagation();

      if (showSecondButtonColorPicker) {
        setShowSecondButtonColorPicker(false);
        return;
      }

      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const pickerWidth = 200;
      const pickerHeight = 250;

      let left = rect.right + 10;
      let top = rect.top;

      if (left + pickerWidth > viewportWidth) {
        left = rect.left - pickerWidth - 10;
      }
      if (top + pickerHeight > viewportHeight) {
        top = viewportHeight - pickerHeight - 20;
      }
      if (top < 20) {
        top = 20;
      }

      setPickerPosition({ top, left });
      setShowSecondButtonColorPicker(true);
    };

    const handleMetricColorPickerClick = (
      event: React.MouseEvent,
      metric: 'marketCap' | 'volume' | 'holders',
      range: 'range1' | 'range2' | 'range3',
    ) => {
      event.stopPropagation();

      if (
        showMetricColorPicker &&
        activeMetricPicker?.metric === metric &&
        activeMetricPicker?.range === range
      ) {
        setShowMetricColorPicker(false);
        setActiveMetricPicker(null);
        return;
      }

      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const pickerWidth = 200;
      const pickerHeight = 250;

      let left = rect.right + 10;
      let top = rect.top;

      if (left + pickerWidth > viewportWidth) {
        left = rect.left - pickerWidth - 10;
      }
      if (top + pickerHeight > viewportHeight) {
        top = viewportHeight - pickerHeight - 20;
      }
      if (top < 20) {
        top = 20;
      }

      setMetricPickerPosition({ top, left });
      setActiveMetricPicker({ metric, range });
      setShowMetricColorPicker(true);
    };
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<
      'layout' | 'metrics' | 'row' | 'extras'
    >('layout');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const safeOrder: Array<ColumnKey> =
      Array.isArray(settings?.columnOrder) && settings.columnOrder.length
        ? settings.columnOrder
        : (['new', 'graduating', 'graduated'] as Array<ColumnKey>);

    const handleToggle = useCallback(() => {
      if (isOpen) {
        setIsVisible(false);
        setTimeout(() => {
          setIsOpen(false);
        }, 200);
      } else {
        setIsOpen(true);
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      }
    }, [isOpen]);

    const handleDragStart = (e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex) return;

      const newOrder = [...safeOrder];
      const draggedItem = newOrder[draggedIndex];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(dropIndex, 0, draggedItem);

      onSettingsChange({ ...settings, columnOrder: newOrder });
      setDraggedIndex(null);
      setDragOverIndex(null);
    };

    const handleDragEnd = () => {
      setDraggedIndex(null);
      setDragOverIndex(null);
    };
    const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnKey>>(
      () => new Set(settings.hiddenColumns || []),
    );

    const handleHide = (e: React.MouseEvent, column: ColumnKey) => {
      e.preventDefault();
      e.stopPropagation();
      const newHidden = new Set(hiddenColumns);
      if (newHidden.has(column)) {
        newHidden.delete(column);
      } else {
        newHidden.add(column);
      }
      setHiddenColumns(newHidden);
      onSettingsChange({ ...settings, hiddenColumns: Array.from(newHidden) });
    };
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        if (dropdownRef.current && !dropdownRef.current.contains(target)) {
          if (isOpen) {
            setIsVisible(false);
            setTimeout(() => {
              setIsOpen(false);
            }, 200);
          }
        }

        if (showSecondButtonColorPicker) {
          if (
            !target.closest('.color-picker-dropdown') &&
            !target.closest('.color-preview')
          ) {
            setShowSecondButtonColorPicker(false);
          }
        }

        if (showMetricColorPicker) {
          if (
            !target.closest('.metric-color-picker-dropdown') &&
            !target.closest('.metric-color-square')
          ) {
            setShowMetricColorPicker(false);
            setActiveMetricPicker(null);
          }
        }
      };

      if (isOpen || showSecondButtonColorPicker || showMetricColorPicker) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, showSecondButtonColorPicker, showMetricColorPicker]);
    const updateSetting = <K extends keyof DisplaySettings>(
      key: K,
      value: DisplaySettings[K],
    ) => onSettingsChange({ ...settings, [key]: value });

    const updateMetricColor = (
      metric: 'marketCap' | 'volume' | 'holders',
      range: 'range1' | 'range2' | 'range3',
      color: string,
    ) => {
      onSettingsChange({
        ...settings,
        metricColors: {
          ...settings.metricColors,
          [metric]: {
            ...settings.metricColors?.[metric],
            [range]: color,
          },
        },
      });
    };

    const updateRowSetting = (
      key: keyof DisplaySettings['visibleRows'],
      value: boolean,
    ) => {
      onSettingsChange({
        ...settings,
        visibleRows: { ...settings.visibleRows, [key]: value },
      });
    };

    return (
      <div className="display-dropdown" ref={dropdownRef}>
        <button
          className={`display-dropdown-trigger ${isOpen ? 'active' : ''}`}
          onClick={handleToggle}
        >
          <span>Display</span>
          <ChevronDown
            size={16}
            className={`display-dropdown-arrow ${isOpen ? 'open' : ''}`}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <div
            className={`display-dropdown-content ${isVisible ? 'visible' : ''}`}
          >
            <div className="display-section">
              <h4 className="display-section-title">Metrics</h4>
              <div className="metrics-size-options">
                <button
                  className={`small-size-option ${settings.metricSize === 'small' ? 'active' : ''}`}
                  onClick={() => updateSetting('metricSize', 'small')}
                >
                  MC 123K
                  <br />
                  <span className="size-label">Small</span>
                </button>
                <button
                  className={`large-size-option ${settings.metricSize === 'large' ? 'active' : ''}`}
                  onClick={() => updateSetting('metricSize', 'large')}
                >
                  MC 123K
                  <br />
                  <span className="size-label">Large</span>
                </button>
              </div>
            </div>

            <div className="display-section">
              <h4 className="display-section-title">Quick Buy</h4>
              <div className="quickbuy-size-options">
                <button
                  className={`quickbuy-option ${settings.quickBuySize === 'small' ? 'active' : ''}`}
                  onClick={() => updateSetting('quickBuySize', 'small')}
                >
                  <div
                    className={`quickbuy-preview-button-small ${settings.quickBuyStyle === 'grey' ? 'grey-style' : ''}`}
                  >
                    <img
                      className="quickbuy-preview-button-lightning-small"
                      src={lightning}
                      alt=""
                    />
                    7
                  </div>
                  Small
                </button>
                <button
                  className={`quickbuy-option ${settings.quickBuySize === 'large' ? 'active' : ''}`}
                  onClick={() => updateSetting('quickBuySize', 'large')}
                >
                  <div
                    className={`quickbuy-preview-button-large ${settings.quickBuyStyle === 'grey' ? 'grey-style' : ''}`}
                  >
                    <img
                      className="quickbuy-preview-button-lightning-large"
                      src={lightning}
                      alt=""
                    />
                    7
                  </div>
                  Large
                </button>
                <button
                  className={`quickbuy-option ${settings.quickBuySize === 'mega' ? 'active' : ''}`}
                  onClick={() => updateSetting('quickBuySize', 'mega')}
                >
                  <div
                    className={`quickbuy-preview-button-mega ${settings.quickBuyStyle === 'grey' ? 'grey-style' : ''}`}
                  >
                    <img
                      className="quickbuy-preview-button-lightning-mega"
                      src={lightning}
                      alt=""
                    />
                    7
                  </div>
                  Mega
                </button>
                <button
                  className={`quickbuy-option ${settings.quickBuySize === 'ultra' ? 'active' : ''}`}
                  onClick={() => updateSetting('quickBuySize', 'ultra')}
                >
                  <div
                    className={`quickbuy-preview-button-ultra ultra-${settings.ultraStyle} ultra-text-${settings.ultraColor}`}
                  >
                    <img
                      className="quickbuy-preview-button-lightning-ultra"
                      src={lightning}
                      alt=""
                    />
                    7
                  </div>
                  Ultra
                </button>
              </div>

              {(settings.quickBuySize === 'small' ||
                settings.quickBuySize === 'large' ||
                settings.quickBuySize === 'mega') && (
                  <div className="quickbuy-style-toggles">
                    <div className="style-toggle-row">
                      <span className="style-toggle-label">Style</span>
                      <div className="style-toggle-buttons">
                        <button
                          className={`style-toggle-btn ${settings.quickBuyStyle === 'color' ? 'active' : ''}`}
                          onClick={() => updateSetting('quickBuyStyle', 'color')}
                        >
                          Color
                        </button>
                        <button
                          className={`style-toggle-btn ${settings.quickBuyStyle === 'grey' ? 'active' : ''}`}
                          onClick={() => updateSetting('quickBuyStyle', 'grey')}
                        >
                          Grey
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              {settings.quickBuySize === 'ultra' && (
                <div className="ultra-style-controls">
                  <div className="style-toggle-row">
                    <span className="style-toggle-label">Ultra Style:</span>
                    <div className="style-toggle-buttons">
                      <button
                        className={`style-toggle-btn ${settings.ultraStyle === 'default' ? 'active' : ''}`}
                        onClick={() => updateSetting('ultraStyle', 'default')}
                      >
                        Default
                      </button>
                      <button
                        className={`style-toggle-btn ${settings.ultraStyle === 'glowing' ? 'active' : ''}`}
                        onClick={() => updateSetting('ultraStyle', 'glowing')}
                      >
                        Glowing
                      </button>
                      <button
                        className={`style-toggle-btn ${settings.ultraStyle === 'border' ? 'active' : ''}`}
                        onClick={() => updateSetting('ultraStyle', 'border')}
                      >
                        Border
                      </button>
                    </div>
                  </div>
                  <div className="style-toggle-row">
                    <span className="style-toggle-label">Text Color:</span>
                    <div className="style-toggle-buttons">
                      <button
                        className={`style-toggle-btn ${settings.ultraColor === 'color' ? 'active' : ''}`}
                        onClick={() => updateSetting('ultraColor', 'color')}
                      >
                        Color
                      </button>
                      <button
                        className={`style-toggle-btn ${settings.ultraColor === 'grey' ? 'active' : ''}`}
                        onClick={() => updateSetting('ultraColor', 'grey')}
                      >
                        Grey
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="display-tabs">
              <button
                className={`display-tab ${activeTab === 'layout' ? 'active' : ''}`}
                onClick={() => setActiveTab('layout')}
              >
                Layout
              </button>
              <button
                className={`display-tab ${activeTab === 'metrics' ? 'active' : ''}`}
                onClick={() => setActiveTab('metrics')}
              >
                Metrics
              </button>
              <button
                className={`display-tab ${activeTab === 'row' ? 'active' : ''}`}
                onClick={() => setActiveTab('row')}
              >
                Row
              </button>
              <button
                className={`display-tab ${activeTab === 'extras' ? 'active' : ''}`}
                onClick={() => setActiveTab('extras')}
              >
                Extras
              </button>
            </div>

            <div className="display-content">
              {activeTab === 'layout' && (
                <div>
                  <div className="display-toggles">
                    <div className="toggle-item">
                      <label className="toggle-label">
                        <Hash size={16} />
                        No Decimals
                      </label>
                      <div
                        className={`toggle-switch ${settings.noDecimals ? 'active' : ''}`}
                        onClick={() =>
                          updateSetting('noDecimals', !settings.noDecimals)
                        }
                      >
                        <div className="toggle-slider" />
                      </div>
                    </div>

                    <div className="toggle-item">
                      <label className="toggle-label">
                        <EyeOff size={16} />
                        Hide Hidden Tokens
                      </label>
                      <div
                        className={`toggle-switch ${settings.hideHiddenTokens ? 'active' : ''}`}
                        onClick={() =>
                          updateSetting(
                            'hideHiddenTokens',
                            !settings.hideHiddenTokens,
                          )
                        }
                      >
                        <div className="toggle-slider" />
                      </div>
                    </div>

                    <div className="toggle-item">
                      <label className="toggle-label">
                        <Image size={16} />
                        Square Images
                      </label>
                      <div
                        className={`toggle-switch ${settings.squareImages ? 'active' : ''}`}
                        onClick={() =>
                          updateSetting('squareImages', !settings.squareImages)
                        }
                      >
                        <div className="toggle-slider" />
                      </div>
                    </div>

                    <div className="toggle-item">
                      <label className="toggle-label">
                        <BarChart3 size={16} />
                        Progress Ring
                      </label>
                      <div
                        className={`toggle-switch ${settings.progressBar ? 'active' : ''}`}
                        onClick={() =>
                          updateSetting('progressBar', !settings.progressBar)
                        }
                      >
                        <div className="toggle-slider" />
                      </div>
                    </div>
                  </div>

                  <div className="customize-section">
                    <h4 className="display-section-title">Customize rows</h4>
                    <div className="row-toggles">
                      {(
                        [
                          ['marketCap', 'Market Cap'],
                          ['volume', 'Volume'],
                          ['fees', 'Fees'],
                          ['tx', 'TX'],
                          ['socials', 'Socials'],
                          ['holders', 'Holders'],
                          ['proTraders', 'Pro Traders'],
                          ['devMigrations', 'Dev Migrations'],
                          ['top10Holders', 'Top 10 Holders'],
                          ['devHolding', 'Dev Holding'],
                          ['snipers', 'Snipers'],
                          ['insiders', 'Insiders'],
                        ] as Array<[keyof DisplaySettings['visibleRows'], string]>
                      ).map(([k, label]) => (
                        <div
                          key={k}
                          className={`row-toggle ${settings.visibleRows[k] ? 'active' : ''}`}
                          onClick={() =>
                            updateRowSetting(k, !settings.visibleRows[k])
                          }
                        >
                          <span className="row-toggle-label">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'metrics' && (
                <div>
                  {(['marketCap', 'volume', 'holders'] as const).map((metric) => (
                    <div className="metrics-display-section" key={metric}>
                      <h4 className="display-section-title">
                        {metric === 'marketCap'
                          ? 'Market Cap'
                          : metric === 'volume'
                            ? 'Volume'
                            : 'Holders'}
                      </h4>
                      <div className="metric-color-options">
                        {(['range1', 'range2', 'range3'] as const).map(
                          (range, idx) => (
                            <div className="metric-color-option">
                              <div className="metric-color-item" key={range}>
                                <div className="display-metric-value">
                                  {metric === 'marketCap'
                                    ? idx === 0
                                      ? '30000'
                                      : idx === 1
                                        ? '150000'
                                        : 'Above'
                                    : metric === 'volume'
                                      ? idx === 0
                                        ? '1000'
                                        : idx === 1
                                          ? '2000'
                                          : 'Above'
                                      : idx === 0
                                        ? '10'
                                        : idx === 1
                                          ? '50'
                                          : 'Above'}
                                </div>
                                <div className="metric-color-controls">
                                  <button
                                    className="metric-color-square"
                                    style={{
                                      backgroundColor:
                                        (settings.metricColors as any)?.[
                                        metric
                                        ]?.[range] || '#ffffff',
                                    }}
                                    onClick={(e) =>
                                      handleMetricColorPickerClick(
                                        e,
                                        metric,
                                        range,
                                      )
                                    }
                                  />
                                  <button
                                    className="metric-reset-btn"
                                    onClick={() =>
                                      updateMetricColor(
                                        metric,
                                        range,
                                        metric === 'marketCap'
                                          ? range === 'range1'
                                            ? '#d8dcff'
                                            : range === 'range2'
                                              ? '#eab308'
                                              : '#14b8a6'
                                          : '#ffffff',
                                      )
                                    }
                                  >
                                    <img
                                      src={reset}
                                      alt="Reset"
                                      className="reset-icon"
                                    />
                                  </button>
                                </div>
                              </div>
                              <div className="metric-range-label">
                                {metric === 'marketCap'
                                  ? idx === 0
                                    ? '0 - 30K'
                                    : idx === 1
                                      ? '30K - 150K'
                                      : '150K+'
                                  : metric === 'volume'
                                    ? idx === 0
                                      ? '0 - 1K'
                                      : idx === 1
                                        ? '1K - 2K'
                                        : '2K+'
                                    : idx === 0
                                      ? '0 - 10'
                                      : idx === 1
                                        ? '10 - 50'
                                        : '50+'}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'row' && (
                <div>
                  <div className="display-section">
                    <div className="display-toggles">
                      <div className="toggle-item">
                        <label className="toggle-label">
                          <BarChart3 size={16} />
                          Color Rows
                        </label>
                        <div
                          className={`toggle-switch ${settings.colorRows ? 'active' : ''}`}
                          onClick={() =>
                            updateSetting('colorRows', !settings.colorRows)
                          }
                        >
                          <div className="toggle-slider" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'extras' && (
                <div>
                  <div className="extras-display-section">
                    <h4 className="display-section-title">Table Layout</h4>
                    <div className="column-drag-container">
                      {safeOrder.map((column, index) => (
                        <div
                          key={column}
                          className={`column-drag-item ${hiddenColumns.has(column) ? 'column-hidden' : ''} ${dragOverIndex === index && draggedIndex !== index ? 'drag-over' : ''}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => handleHide(e, column)}
                        >
                          {column === 'new'
                            ? 'New Pairs'
                            : column === 'graduating'
                              ? 'Final Stretch'
                              : 'Migrated'}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="extras-display-section">
                    <h4 className="display-section-title">
                      Click Quick Buy Behavior
                    </h4>
                    <div className="quickbuy-behavior-options">
                      {(['nothing', 'openPage', 'openNewTab'] as const).map(
                        (mode) => (
                          <div
                            key={mode}
                            className={`behavior-option ${settings.quickBuyClickBehavior === mode ? 'active' : ''}`}
                            onClick={() =>
                              updateSetting('quickBuyClickBehavior', mode)
                            }
                          >
                            <span className="behavior-label">
                              {mode === 'nothing'
                                ? 'Nothing'
                                : mode === 'openPage'
                                  ? 'Open Page'
                                  : 'Open in New Tab'}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="extras-display-section">
                    <div className="toggle-item">
                      <label className="toggle-label">
                        Second Quick Buy Button
                      </label>
                      <div
                        className={`toggle-switch ${settings.secondQuickBuyEnabled ? 'active' : ''}`}
                        onClick={() =>
                          updateSetting(
                            'secondQuickBuyEnabled',
                            !settings.secondQuickBuyEnabled,
                          )
                        }
                      >
                        <div className="toggle-slider" />
                      </div>
                    </div>

                    {settings.secondQuickBuyEnabled && (
                      <div className="second-quickbuy-controls">
                        <div className="explorer-quickbuy-container-second">
                          <span className="explorer-second-quickbuy-label">
                            Quick Buy
                          </span>
                          <input
                            type="text"
                            placeholder="0.0"
                            value={quickAmountsSecond.new}
                            onChange={(e) => {
                              const value = e.target.value;
                              setQuickAmountSecond('new', value);
                              setQuickAmountSecond('graduating', value);
                              setQuickAmountSecond('graduated', value);
                            }}
                            className="explorer-quickbuy-input-second"
                          />
                          <img className="quickbuy-monad-icon" src={monadicon} />
                          <div className="explorer-preset-controls">
                            {[1, 2, 3].map((p) => (
                              <button
                                key={p}
                                className={`explorer-preset-pill-second ${activePresetsSecond.new === p ? 'active' : ''}`}
                                onClick={() => {
                                  setActivePresetSecond('new', p);
                                  setActivePresetSecond('graduating', p);
                                  setActivePresetSecond('graduated', p);
                                }}
                              >
                                P{p}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="color-input-row">
                          <div className="color-input-container">
                            <div
                              className="color-preview"
                              style={{
                                backgroundColor: settings.secondQuickBuyColor,
                              }}
                              onClick={handleColorPickerClick}
                            />
                            <input
                              type="text"
                              value={hexInputValue}
                              onChange={(e) => {
                                const value = e.target.value
                                  .replace(/[^0-9A-Fa-f]/g, '')
                                  .toUpperCase();
                                setHexInputValue(value);

                                if (value.length === 6) {
                                  updateSetting(
                                    'secondQuickBuyColor',
                                    `#${value}`,
                                  );
                                }
                              }}
                              onBlur={() => {
                                if (hexInputValue.length === 3) {
                                  const expanded = hexInputValue
                                    .split('')
                                    .map((c) => c + c)
                                    .join('');
                                  updateSetting(
                                    'secondQuickBuyColor',
                                    `#${expanded}`,
                                  );
                                  setHexInputValue(expanded);
                                } else if (hexInputValue.length !== 6) {
                                  setHexInputValue(
                                    settings.secondQuickBuyColor
                                      .replace('#', '')
                                      .toUpperCase(),
                                  );
                                }
                              }}
                              onFocus={(e) => e.target.select()}
                              className="quickbuy-hex-input"
                              placeholder="FFFFFF"
                              maxLength={6}
                            />
                            <button
                              className="refresh-button"
                              onClick={() =>
                                updateSetting('secondQuickBuyColor', '#aaaecf')
                              }
                              title="Reset to default"
                              type="button"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {showSecondButtonColorPicker && (
          <div
            className="color-picker-dropdown"
            style={{
              top: `${pickerPosition.top}px`,
              left: `${pickerPosition.left}px`,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <HexColorPicker
              color={settings.secondQuickBuyColor}
              onChange={(color) => updateSetting('secondQuickBuyColor', color)}
            />
            <div className="rgb-inputs">
              {['R', 'G', 'B'].map((channel, i) => {
                const currentColor = settings.secondQuickBuyColor;
                const slice = currentColor.slice(1 + i * 2, 3 + i * 2);
                const value = parseInt(slice, 16) || 0;

                return (
                  <div className="rgb-input-group" key={channel}>
                    <label>{channel}</label>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={value}
                      onChange={(e) => {
                        const rgb = [0, 0, 0].map((_, idx) =>
                          idx === i
                            ? Math.max(0, Math.min(255, Number(e.target.value)))
                            : parseInt(
                              currentColor.slice(1 + idx * 2, 3 + idx * 2),
                              16,
                            ),
                        );
                        const newColor = `#${rgb
                          .map((c) => c.toString(16).padStart(2, '0'))
                          .join('')}`;
                        updateSetting('secondQuickBuyColor', newColor);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {showMetricColorPicker && activeMetricPicker && (
          <div
            className="color-picker-dropdown"
            style={{
              top: `${metricPickerPosition.top}px`,
              left: `${metricPickerPosition.left}px`,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <HexColorPicker
              color={
                (settings.metricColors as any)?.[activeMetricPicker.metric]?.[
                activeMetricPicker.range
                ] || '#ffffff'
              }
              onChange={(color) =>
                updateMetricColor(
                  activeMetricPicker.metric,
                  activeMetricPicker.range,
                  color,
                )
              }
            />
            <div className="rgb-inputs">
              {['R', 'G', 'B'].map((channel, i) => {
                const currentColor = settings.secondQuickBuyColor;
                const slice = currentColor.slice(1 + i * 2, 3 + i * 2);
                const value = parseInt(slice, 16) || 0;

                return (
                  <div className="rgb-input-group" key={channel}>
                    <label>{channel}</label>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={value}
                      onChange={(e) => {
                        const rgb = [0, 0, 0].map((_, idx) =>
                          idx === i
                            ? Math.max(0, Math.min(255, Number(e.target.value)))
                            : parseInt(
                              currentColor.slice(1 + idx * 2, 3 + idx * 2),
                              16,
                            ),
                        );
                        const newColor = `#${rgb
                          .map((c) => c.toString(16).padStart(2, '0'))
                          .join('')}`;
                        updateSetting('secondQuickBuyColor', newColor);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

const MobileTabSelector: React.FC<{
  activeTab: Token['status'];
  onTabChange: (tab: Token['status']) => void;
  tokenCounts: Record<Token['status'], number>;
}> = ({ activeTab, onTabChange, tokenCounts }) => {
  const tabs = [
    { key: 'new', label: 'New Pairs', count: tokenCounts.new },
    {
      key: 'graduating',
      label: 'Final Stretch',
      count: tokenCounts.graduating,
    },
    { key: 'graduated', label: 'Migrated', count: tokenCounts.graduated },
  ] as const;

  return (
    <div className="mobile-tab-selector">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`mobile-tab ${activeTab === tab.key ? 'active' : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          <span className="mobile-tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

const TokenRow = React.memo<{
  token: Token;
  quickbuyAmount: string;
  quickbuyAmountSecond: string;
  onHideToken: (tokenId: string) => void;
  onBlacklistToken: (token: Token) => void;
  isLoadingPrimary: boolean;
  isLoadingSecondary: boolean;
  hoveredToken: string | null;
  hoveredImage: string | null;
  onTokenHover: (id: string) => void;
  onTokenLeave: () => void;
  onImageHover: (tokenId: string) => void;
  onImageLeave: () => void;
  onTokenClick: (token: Token) => void;
  onQuickBuy: (
    token: Token,
    amount: string,
    buttonType: 'primary' | 'secondary',
  ) => void;
  onCopyToClipboard: (text: string) => void;
  displaySettings: DisplaySettings;
  isHidden: boolean;
  monUsdPrice: number;
  blacklistSettings: any;
  formatTimeAgo: (timestamp: number) => string;
}>((props) => {
  const {
    token,
    quickbuyAmount,
    quickbuyAmountSecond,
    onHideToken,
    onBlacklistToken,
    isLoadingPrimary,
    isLoadingSecondary,
    hoveredToken,
    hoveredImage,
    onTokenHover,
    onTokenLeave,
    onImageHover,
    onImageLeave,
    onTokenClick,
    onQuickBuy,
    onCopyToClipboard,
    displaySettings,
    isHidden,
    monUsdPrice,
    // blacklistSettings,
    formatTimeAgo,
  } = props;
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const tokenRowRef = useRef<HTMLDivElement>(null);
  const [bondingPopupPosition, setBondingPopupPosition] = useState({
    top: 0,
    left: 0,
  });
  type CSSVars = React.CSSProperties & Record<string, string>;
  const bondingPercentage = useMemo(
    () => calculateBondingPercentage(token.marketCap),
    [token.marketCap],
  );
  const gradient = useMemo(
    () => createColorGradient(getBondingColor(bondingPercentage)),
    [bondingPercentage],
  );

  const imageStyle: CSSVars = {
    position: 'relative',
    '--progress-angle': `${(bondingPercentage / 100) * 360}deg`,
    '--progress-color-start': gradient.start,
    '--progress-color-mid': gradient.mid,
    '--progress-color-end': gradient.end,
  };
  const progressLineStyle: CSSVars = {
    '--progress-percentage': `${bondingPercentage}%`,
    '--progress-color': getBondingColor(bondingPercentage),
  };

  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const updatePreviewPosition = useCallback(() => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const previewWidth = 220;
    const previewHeight = 220;
    const offset = 15;

    let top = 0;
    let left = 0;

    const leftX = rect.left;
    const centerY = rect.top + rect.height / 2;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = viewportWidth - rect.right;
    const spaceLeft = rect.left;

    if (spaceBelow >= previewHeight + offset) {
      top = rect.bottom + scrollY + offset;
      left = leftX + scrollX;
    } else if (spaceAbove >= previewHeight + offset) {
      top = rect.top + scrollY - previewHeight - offset - 15;
      left = leftX + scrollX;
    } else if (spaceRight >= previewWidth + offset) {
      left = rect.right + scrollX + offset;
      top = centerY + scrollY - previewHeight / 2;
    } else if (spaceLeft >= previewWidth + offset) {
      left = rect.left + scrollX - previewWidth - offset;
      top = centerY + scrollY - previewHeight / 2;
    } else {
      top = rect.bottom + scrollY + offset;
      left = leftX + scrollX;
    }

    const margin = 10;
    if (left < scrollX + margin) left = scrollX + margin;
    else if (left + previewWidth > scrollX + viewportWidth - margin)
      left = scrollX + viewportWidth - previewWidth - margin;

    if (top < scrollY + margin) top = scrollY + margin;
    else if (top + previewHeight > scrollY + viewportHeight - margin)
      top = scrollY + viewportHeight - previewHeight - margin;

    setPreviewPosition({ top, left });
  }, []);
  const updateBondingPopupPosition = useCallback(() => {
    if (!tokenRowRef.current) return;

    const rect = tokenRowRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    const popupWidth = 0;
    const popupHeight = 28;
    const offset = 4;

    const top = rect.top + scrollY - popupHeight - offset;
    const left = rect.left + scrollX + rect.width / 2 - popupWidth / 2;

    setBondingPopupPosition({ top, left });
  }, []);

  useEffect(() => {
    if (hoveredImage === token.id) {
      const calculateAndShow = () => {
        updatePreviewPosition();
        setTimeout(() => setShowPreview(true), 10);
      };

      calculateAndShow();

      const handleResize = () => updatePreviewPosition();
      window.addEventListener('scroll', updatePreviewPosition);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', updatePreviewPosition);
        window.removeEventListener('resize', handleResize);
      };
    } else {
      setShowPreview(false);
    }
  }, [hoveredImage, token.id, updatePreviewPosition]);

  useEffect(() => {
    if (hoveredToken === token.id) {
      updateBondingPopupPosition();

      const handleResize = () => updateBondingPopupPosition();
      window.addEventListener('scroll', updateBondingPopupPosition);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', updateBondingPopupPosition);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [hoveredToken, token.id, updateBondingPopupPosition]);

  const totalTraders = useMemo(
    () => token.holders + token.proTraders,
    [token.holders, token.proTraders],
  );

  const showBonding =
    (token.status === 'new' || token.status === 'graduating') &&
    hoveredToken === token.id;

  const totalTransactions = token.buyTransactions + token.sellTransactions;
  const buyPct = useMemo(
    () =>
      totalTransactions === 0
        ? 0
        : (token.buyTransactions / totalTransactions) * 100,
    [token.buyTransactions, totalTransactions],
  );
  const sellPct = useMemo(
    () =>
      totalTransactions === 0
        ? 0
        : (token.sellTransactions / totalTransactions) * 100,
    [token.sellTransactions, totalTransactions],
  );

  const metricData = hasMetricColoring(displaySettings)
    ? getMetricColorClasses(token, displaySettings)
    : null;
  const cssVariables: CSSVars = metricData?.cssVars || {};


  return (
    <>
      <div
        ref={tokenRowRef}
        className={`explorer-token-row ${isHidden ? 'hidden-token' : ''} ${displaySettings.colorRows && token.status !== 'graduated'
            ? `colored-row ${getBondingColorClass(bondingPercentage)}`
            : ''
          } ${metricData ? `metric-colored ${metricData.classes}` : ''} ${token.status === 'graduated' ? 'graduated' : ''}`}
        style={cssVariables}
        onMouseEnter={() => onTokenHover(token.id)}
        onMouseLeave={onTokenLeave}
        onClick={() => onTokenClick(token)}
      >
        <div className="explorer-token-actions">
          <button
            className="explorer-hide-button"
            onClick={(e) => {
              e.stopPropagation();
              onHideToken(token.id);
            }}
          >
            <Tooltip content={isHidden ? 'Show Token' : 'Hide Token'}>
              {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
            </Tooltip>
          </button>
        </div>

        <div
          className="explorer-token-left"
          style={!displaySettings.progressBar ? { marginTop: '-3px' } : {}}
        >
          <div
            ref={imageContainerRef}
            className={`explorer-token-image-container ${token.status === 'graduated' ? 'graduated' : ''} ${!displaySettings.squareImages ? 'circle-mode' : ''} ${!displaySettings.progressBar ? 'no-progress-ring' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(token.image)}`,
                '_blank',
                'noopener,noreferrer',
              );
            }}
            onMouseEnter={() => onImageHover(token.id)}
            onMouseLeave={onImageLeave}
            style={
              token.status === 'graduated' || !displaySettings.progressBar
                ? { position: 'relative' }
                : imageStyle
            }
          >
            <div
              className={`explorer-progress-spacer ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
            >
              <div
                className={`explorer-image-wrapper ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
              >
                {token.image ? (
                  <img
                    src={token.image}
                    alt={token.name}
                    className={`explorer-token-image ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
                  />
                ) : (
                  <div
                    className={`explorer-token-letter ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgb(6,6,6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '40px',
                      fontWeight: '200',
                      color: '#ffffff',
                      borderRadius: displaySettings.squareImages
                        ? '8px'
                        : '50%',
                    }}
                  >
                    {token.symbol.charAt(0).toUpperCase()}
                  </div>
                )}
                <div
                  className={`explorer-image-overlay ${!displaySettings.squareImages ? 'circle-mode' : ''}`}
                >
                  <img className="camera-icon" src={camera} alt="inspect" />
                </div>
              </div>
            </div>

            {hoveredImage === token.id &&
              token.image &&
              showPreview &&
              createPortal(
                <div
                  className="explorer-image-preview show"
                  style={{
                    position: 'absolute',
                    top: `${previewPosition.top}px`,
                    left: `${previewPosition.left}px`,
                    zIndex: 9999,
                    pointerEvents: 'none',
                    opacity: 1,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  <div className="explorer-preview-content">
                    <img
                      src={token.image}
                      alt={token.name}
                      style={{
                        width: '220px',
                        height: '220px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                </div>,
                document.body,
              )}
          </div>

          {!displaySettings.progressBar && token.status !== 'graduated' && (
            <div className="explorer-progress-line" style={progressLineStyle}>
              <div className="explorer-progress-line-fill" />
            </div>
          )}

          <span className="explorer-contract-address">
            {token.tokenAddress.slice(0, 6)}…{token.tokenAddress.slice(-4)}
          </span>
        </div>

        <div className="explorer-token-details">
          <div className="explorer-detail-section">
            <div className="explorer-top-row">
              <div className="explorer-token-info">
                <h3 className="explorer-token-symbol">{token.symbol}</h3>
                <div className="explorer-token-name-container" onClick={(e) => {
                  e.stopPropagation();
                  onCopyToClipboard(token.tokenAddress);
                }}
                  style={{ cursor: 'pointer' }}>
                  <Tooltip content="Click to copy address">
                    <p
                      className="explorer-token-name"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyToClipboard(token.tokenAddress);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {token.name}
                    </p>
                    <button
                      className="explorer-copy-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyToClipboard(token.tokenAddress);
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
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="explorer-second-row">
              <div className="explorer-price-section">
                <span className="explorer-time-created">
                  {formatTimeAgo(token.created)}
                </span>
                {displaySettings.visibleRows.socials && (
                  <>
                    {!!token.twitterHandle && (
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
                              token.twitterHandle.includes('/i/communities/')
                                ? communities
                                : token.twitterHandle.includes('/status/')
                                  ? tweet
                                  : avatar
                            }
                            alt={
                              token.twitterHandle.includes('/i/communities/')
                                ? 'Community'
                                : 'Twitter'
                            }
                            className={
                              token.twitterHandle.includes('/i/communities/')
                                ? 'community-icon'
                                : token.twitterHandle.includes('/status/')
                                  ? 'tweet-icon'
                                  : 'avatar-icon'
                            }
                          />
                        </a>
                      </TwitterHover>
                    )}

                    {!!token.website && (
                      <a
                        className="explorer-website-btn"
                        href={token.website}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                        </svg>
                      </a>
                    )}

                    {!!token.telegramHandle && (
                      <a
                        className="explorer-telegram-btn"
                        href={token.telegramHandle}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img src={telegram} />
                      </a>
                    )}

                    {!!token.discordHandle && (
                      <a
                        className="explorer-discord-btn"
                        href={token.discordHandle}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img src={discord} />
                      </a>
                    )}

                    <a
                      className="explorer-telegram-btn"
                      href={`https://twitter.com/search?q=${token.tokenAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Search size={14} />
                    </a>
                  </>
                )}
              </div>

              <div className="explorer-additional-data">
                {displaySettings.visibleRows.holders && (
                  <Tooltip content="Holders">
                    <div className="explorer-stat-item">
                      <svg
                        className="traders-icon"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M 8.8007812 3.7890625 C 6.3407812 3.7890625 4.3496094 5.78 4.3496094 8.25 C 4.3496094 9.6746499 5.0287619 10.931069 6.0703125 11.748047 C 3.385306 12.836193 1.4902344 15.466784 1.4902344 18.550781 C 1.4902344 18.960781 1.8202344 19.300781 2.2402344 19.300781 C 2.6502344 19.300781 2.9902344 18.960781 2.9902344 18.550781 C 2.9902344 15.330781 5.6000781 12.720703 8.8300781 12.720703 L 8.8203125 12.710938 C 8.9214856 12.710938 9.0168776 12.68774 9.1054688 12.650391 C 9.1958823 12.612273 9.2788858 12.556763 9.3476562 12.488281 C 9.4163056 12.41992 9.4712705 12.340031 9.5097656 12.25 C 9.5480469 12.160469 9.5703125 12.063437 9.5703125 11.960938 C 9.5703125 11.540938 9.2303125 11.210938 8.8203125 11.210938 C 7.1903125 11.210938 5.8691406 9.8897656 5.8691406 8.2597656 C 5.8691406 6.6297656 7.1900781 5.3105469 8.8300781 5.3105469 L 8.7890625 5.2890625 C 9.2090625 5.2890625 9.5507812 4.9490625 9.5507812 4.5390625 C 9.5507812 4.1190625 9.2107813 3.7890625 8.8007812 3.7890625 z M 14.740234 3.8007812 C 12.150234 3.8007812 10.060547 5.9002344 10.060547 8.4902344 L 10.039062 8.4707031 C 10.039063 10.006512 10.78857 11.35736 11.929688 12.212891 C 9.0414704 13.338134 7 16.136414 7 19.429688 C 7 19.839688 7.33 20.179688 7.75 20.179688 C 8.16 20.179688 8.5 19.839688 8.5 19.429688 C 8.5 15.969687 11.29 13.179688 14.75 13.179688 L 14.720703 13.160156 C 14.724012 13.160163 14.727158 13.160156 14.730469 13.160156 C 16.156602 13.162373 17.461986 13.641095 18.519531 14.449219 C 18.849531 14.709219 19.320078 14.640313 19.580078 14.320312 C 19.840078 13.990313 19.769219 13.519531 19.449219 13.269531 C 18.873492 12.826664 18.229049 12.471483 17.539062 12.205078 C 18.674662 11.350091 19.419922 10.006007 19.419922 8.4804688 C 19.419922 5.8904687 17.320234 3.8007812 14.740234 3.8007812 z M 14.730469 5.2890625 C 16.490469 5.2890625 17.919922 6.7104688 17.919922 8.4804688 C 17.919922 10.240469 16.500234 11.669922 14.740234 11.669922 C 12.980234 11.669922 11.560547 10.250234 11.560547 8.4902344 C 11.560547 6.7302344 12.98 5.3105469 14.75 5.3105469 L 14.730469 5.2890625 z M 21.339844 16.230469 C 21.24375 16.226719 21.145781 16.241797 21.050781 16.279297 L 21.039062 16.259766 C 20.649063 16.409766 20.449609 16.840469 20.599609 17.230469 C 20.849609 17.910469 20.990234 18.640156 20.990234 19.410156 C 20.990234 19.820156 21.320234 20.160156 21.740234 20.160156 C 22.150234 20.160156 22.490234 19.820156 22.490234 19.410156 C 22.490234 18.470156 22.319766 17.560703 22.009766 16.720703 C 21.897266 16.428203 21.628125 16.241719 21.339844 16.230469 z" />
                      </svg>{' '}
                      <span className="explorer-stat-value">
                        {totalTraders.toLocaleString()}
                      </span>
                    </div>
                  </Tooltip>
                )}

                {displaySettings.visibleRows.proTraders && (
                  <Tooltip content="Pro Traders">
                    <div className="explorer-stat-item">
                      <svg
                        className="traders-icon"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M 12 2 L 12 4 L 11 4 C 10.4 4 10 4.4 10 5 L 10 10 C 10 10.6 10.4 11 11 11 L 12 11 L 12 13 L 14 13 L 14 11 L 15 11 C 15.6 11 16 10.6 16 10 L 16 5 C 16 4.4 15.6 4 15 4 L 14 4 L 14 2 L 12 2 z M 4 9 L 4 11 L 3 11 C 2.4 11 2 11.4 2 12 L 2 17 C 2 17.6 2.4 18 3 18 L 4 18 L 4 20 L 6 20 L 6 18 L 7 18 C 7.6 18 8 17.6 8 17 L 8 12 C 8 11.4 7.6 11 7 11 L 6 11 L 6 9 L 4 9 z M 18 11 L 18 13 L 17 13 C 16.4 13 16 13.4 16 14 L 16 19 C 16 19.6 16.4 20 17 20 L 18 20 L 18 22 L 20 22 L 20 20 L 21 20 C 21.6 20 22 19.6 22 19 L 22 14 C 22 13.4 21.6 13 21 13 L 20 13 L 20 11 L 18 11 z M 4 13 L 6 13 L 6 16 L 4 16 L 4 13 z" />
                      </svg>{' '}
                      <span className="pro-explorer-stat-value">
                        {token.proTraders.toLocaleString()}
                      </span>
                    </div>
                  </Tooltip>
                )}

                {displaySettings.visibleRows.devMigrations && (
                  <Tooltip content="Dev Migrations ">
                    <div className="explorer-stat-item">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="graduated-icon"
                        style={
                          token.graduatedTokens > 0
                            ? { color: 'rgba(255, 251, 0, 1)' }
                            : undefined
                        }
                      >
                        <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
                        <path d="M5 21h14" />
                      </svg>
                      <div className="dev-migrations-container">
                        <span className="explorer-dev-migrations">
                          {token.graduatedTokens.toLocaleString()}
                        </span>{' '}
                        <span className="dev-migrations-slash">/</span>
                        <span className="explorer-dev-migrations">
                          {token.launchedTokens.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>

          <div className="explorer-holdings-section">
            {displaySettings.visibleRows.top10Holders && (
              <Tooltip content="Top 10 holders percentage">
                <div className="explorer-holding-item">
                  <svg
                    className="holding-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 32 32"
                    fill={
                      token.top10Holding > 25
                        ? '#eb7070ff'
                        : 'rgb(67, 254, 154)'
                    }
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M 15 4 L 15 6 L 13 6 L 13 8 L 15 8 L 15 9.1875 C 14.011719 9.554688 13.25 10.433594 13.0625 11.5 C 12.277344 11.164063 11.40625 11 10.5 11 C 6.921875 11 4 13.921875 4 17.5 C 4 19.792969 5.199219 21.8125 7 22.96875 L 7 27 L 25 27 L 25 22.96875 C 26.800781 21.8125 28 19.792969 28 17.5 C 28 13.921875 25.078125 11 21.5 11 C 20.59375 11 19.722656 11.164063 18.9375 11.5 C 18.75 10.433594 17.988281 9.554688 17 9.1875 L 17 8 L 19 8 L 19 6 L 17 6 L 17 4 Z M 16 11 C 16.5625 11 17 11.4375 17 12 C 17 12.5625 16.5625 13 16 13 C 15.4375 13 15 12.5625 15 12 C 15 11.4375 15.4375 11 16 11 Z M 10.5 13 C 12.996094 13 15 15.003906 15 17.5 L 15 22 L 10.5 22 C 8.003906 22 6 19.996094 6 17.5 C 6 15.003906 8.003906 13 10.5 13 Z M 21.5 13 C 23.996094 13 26 15.003906 26 17.5 C 26 19.996094 23.996094 22 21.5 22 L 17 22 L 17 17.5 C 17 15.003906 19.003906 13 21.5 13 Z M 9 24 L 23 24 L 23 25 L 9 25 Z" />
                  </svg>{' '}
                  <span
                    className="explorer-holding-value"
                    style={{
                      color:
                        token.top10Holding > 25
                          ? '#eb7070ff'
                          : 'rgb(67, 254, 154)',
                    }}
                  >
                    {token.top10Holding.toFixed(2)}%
                  </span>
                </div>
              </Tooltip>
            )}
            {displaySettings.visibleRows.devHolding && (
              <Tooltip content="Developer Holding">
                <div className="explorer-holding-item">
                  <svg
                    className="holding-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 30 30"
                    fill={
                      token.devHolding * 100 > 25
                        ? '#eb7070ff'
                        : 'rgb(67, 254, 154)'
                    }
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                  </svg>{' '}
                  <span
                    className="explorer-holding-value"
                    style={{
                      color:
                        token.devHolding * 100 > 25
                          ? '#eb7070ff'
                          : 'rgb(67, 254, 154)',
                    }}
                  >
                    {(token.devHolding * 100).toFixed(2)}%
                  </span>
                </div>
              </Tooltip>
            )}
            {displaySettings.visibleRows.snipers && (
              <Tooltip content="Sniper Holding">
                <div className="explorer-holding-item">
                  <svg
                    className="sniper-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={
                      token.sniperHolding > 20
                        ? '#eb7070ff'
                        : 'rgb(67, 254, 154)'
                    }
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M 11.244141 2.0019531 L 11.244141 2.7519531 L 11.244141 3.1542969 C 6.9115518 3.5321749 3.524065 6.919829 3.1445312 11.251953 L 2.7421875 11.251953 L 1.9921875 11.251953 L 1.9921875 12.751953 L 2.7421875 12.751953 L 3.1445312 12.751953 C 3.5225907 17.085781 6.9110367 20.473593 11.244141 20.851562 L 11.244141 21.253906 L 11.244141 22.003906 L 12.744141 22.003906 L 12.744141 21.253906 L 12.744141 20.851562 C 17.076343 20.47195 20.463928 17.083895 20.841797 12.751953 L 21.244141 12.751953 L 21.994141 12.751953 L 21.994141 11.251953 L 21.244141 11.251953 L 20.841797 11.251953 C 20.462285 6.9209126 17.074458 3.5337191 12.744141 3.1542969 L 12.744141 2.7519531 L 12.744141 2.0019531 L 11.244141 2.0019531 z M 11.244141 4.6523438 L 11.244141 8.0742188 C 9.6430468 8.3817751 8.3759724 9.6507475 8.0683594 11.251953 L 4.6425781 11.251953 C 5.0091295 7.7343248 7.7260437 5.0173387 11.244141 4.6523438 z M 12.744141 4.6523438 C 16.25959 5.0189905 18.975147 7.7358303 19.341797 11.251953 L 15.917969 11.251953 C 15.610766 9.6510551 14.344012 8.3831177 12.744141 8.0742188 L 12.744141 4.6523438 z M 11.992188 9.4980469 C 13.371637 9.4980469 14.481489 10.6041 14.492188 11.982422 L 14.492188 12.021484 C 14.481501 13.40006 13.372858 14.503906 11.992188 14.503906 C 10.606048 14.503906 9.4921875 13.389599 9.4921875 12.001953 C 9.4921875 10.614029 10.60482 9.4980469 11.992188 9.4980469 z M 4.6425781 12.751953 L 8.0683594 12.751953 C 8.3760866 14.352973 9.6433875 15.620527 11.244141 15.927734 L 11.244141 19.353516 C 7.7258668 18.988181 5.0077831 16.270941 4.6425781 12.751953 z M 15.917969 12.751953 L 19.34375 12.751953 C 18.97855 16.26893 16.261295 18.986659 12.744141 19.353516 L 12.744141 15.927734 C 14.344596 15.619809 15.610176 14.35218 15.917969 12.751953 z" />
                  </svg>{' '}
                  <span
                    className="explorer-holding-value"
                    style={{
                      color:
                        token.sniperHolding > 20
                          ? '#eb7070ff'
                          : 'rgb(67, 254, 154)',
                    }}
                  >
                    {token.sniperHolding.toFixed(1)}%
                  </span>
                </div>
              </Tooltip>
            )}

            {displaySettings.visibleRows.insiders && (
              <Tooltip content="Insider Holding">
                <div className="explorer-holding-item">
                  <svg
                    className="holding-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 32 32"
                    fill={
                      token.insiderHolding > 5
                        ? '#eb7070ff'
                        : 'rgb(67, 254, 154)'
                    }
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M 16 3 C 14.0625 3 12.570313 3.507813 11.5 4.34375 C 10.429688 5.179688 9.8125 6.304688 9.375 7.34375 C 8.9375 8.382813 8.65625 9.378906 8.375 10.09375 C 8.09375 10.808594 7.859375 11.085938 7.65625 11.15625 C 4.828125 12.160156 3 14.863281 3 18 L 3 19 L 4 19 C 5.347656 19 6.003906 19.28125 6.3125 19.53125 C 6.621094 19.78125 6.742188 20.066406 6.8125 20.5625 C 6.882813 21.058594 6.847656 21.664063 6.9375 22.34375 C 6.984375 22.683594 7.054688 23.066406 7.28125 23.4375 C 7.507813 23.808594 7.917969 24.128906 8.375 24.28125 C 9.433594 24.632813 10.113281 24.855469 10.53125 25.09375 C 10.949219 25.332031 11.199219 25.546875 11.53125 26.25 C 11.847656 26.917969 12.273438 27.648438 13.03125 28.1875 C 13.789063 28.726563 14.808594 29.015625 16.09375 29 C 18.195313 28.972656 19.449219 27.886719 20.09375 26.9375 C 20.417969 26.460938 20.644531 26.050781 20.84375 25.78125 C 21.042969 25.511719 21.164063 25.40625 21.375 25.34375 C 22.730469 24.9375 23.605469 24.25 24.09375 23.46875 C 24.582031 22.6875 24.675781 21.921875 24.8125 21.40625 C 24.949219 20.890625 25.046875 20.6875 25.375 20.46875 C 25.703125 20.25 26.453125 20 28 20 L 29 20 L 29 19 C 29 17.621094 29.046875 16.015625 28.4375 14.5 C 27.828125 12.984375 26.441406 11.644531 24.15625 11.125 C 24.132813 11.121094 24.105469 11.132813 24 11 C 23.894531 10.867188 23.734375 10.601563 23.59375 10.25 C 23.3125 9.550781 23.042969 8.527344 22.59375 7.46875 C 22.144531 6.410156 21.503906 5.269531 20.4375 4.40625 C 19.371094 3.542969 17.90625 3 16 3 Z M 16 5 C 17.539063 5 18.480469 5.394531 19.1875 5.96875 C 19.894531 6.542969 20.367188 7.347656 20.75 8.25 C 21.132813 9.152344 21.402344 10.128906 21.75 11 C 21.921875 11.433594 22.109375 11.839844 22.40625 12.21875 C 22.703125 12.597656 23.136719 12.96875 23.6875 13.09375 C 25.488281 13.503906 26.15625 14.242188 26.5625 15.25 C 26.871094 16.015625 26.878906 17.066406 26.90625 18.09375 C 25.796875 18.1875 24.886719 18.386719 24.25 18.8125 C 23.40625 19.378906 23.050781 20.25 22.875 20.90625 C 22.699219 21.5625 22.632813 22.042969 22.40625 22.40625 C 22.179688 22.769531 21.808594 23.128906 20.78125 23.4375 C 20.070313 23.652344 19.558594 24.140625 19.21875 24.59375 C 18.878906 25.046875 18.675781 25.460938 18.4375 25.8125 C 17.960938 26.515625 17.617188 26.980469 16.0625 27 C 15.078125 27.011719 14.550781 26.820313 14.1875 26.5625 C 13.824219 26.304688 13.558594 25.929688 13.3125 25.40625 C 12.867188 24.460938 12.269531 23.765625 11.53125 23.34375 C 10.792969 22.921875 10.023438 22.714844 9 22.375 C 8.992188 22.359375 8.933594 22.285156 8.90625 22.09375 C 8.855469 21.710938 8.886719 21.035156 8.78125 20.28125 C 8.675781 19.527344 8.367188 18.613281 7.5625 17.96875 C 7 17.515625 6.195313 17.289063 5.25 17.15625 C 5.542969 15.230469 6.554688 13.65625 8.3125 13.03125 C 9.375 12.65625 9.898438 11.730469 10.25 10.84375 C 10.601563 9.957031 10.851563 8.96875 11.21875 8.09375 C 11.585938 7.21875 12.019531 6.480469 12.71875 5.9375 C 13.417969 5.394531 14.402344 5 16 5 Z M 13 9 C 12.449219 9 12 9.671875 12 10.5 C 12 11.328125 12.449219 12 13 12 C 13.550781 12 14 11.328125 14 10.5 C 14 9.671875 13.550781 9 13 9 Z M 17 9 C 16.449219 9 16 9.671875 16 10.5 C 16 11.328125 16.449219 12 17 12 C 17.550781 12 18 11.328125 18 10.5 C 18 9.671875 17.550781 9 17 9 Z" />
                  </svg>{' '}
                  <span
                    className="explorer-holding-value"
                    style={{
                      color:
                        token.insiderHolding > 5
                          ? '#eb7070ff'
                          : 'rgb(67, 254, 154)',
                    }}
                  >
                    {token.insiderHolding.toFixed(1)}%
                  </span>
                </div>
              </Tooltip>
            )}
          </div>
        </div>

        {displaySettings.quickBuySize === 'ultra' &&
          displaySettings.secondQuickBuyEnabled && (
            <div
              className={`explorer-second-ultra-container ultra-${displaySettings.ultraStyle} ultra-text-${displaySettings.ultraColor}`}
              style={
                displaySettings.ultraStyle === 'border'
                  ? {
                    border: `1px solid ${displaySettings.secondQuickBuyColor}`,
                    boxShadow: `inset 0 0 0 1px ${displaySettings.secondQuickBuyColor}99`,
                  }
                  : undefined
              }
              onClick={(e) => {
                e.stopPropagation();
                if (displaySettings.quickBuyClickBehavior === 'openPage') {
                  onQuickBuy(token, quickbuyAmountSecond, 'secondary');
                  onTokenClick(token);
                } else if (
                  displaySettings.quickBuyClickBehavior === 'openNewTab'
                ) {
                  onQuickBuy(token, quickbuyAmountSecond, 'secondary');
                  window.open(`/meme/${token.tokenAddress}`, '_blank');
                } else {
                  onQuickBuy(token, quickbuyAmountSecond, 'secondary');
                }
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
              }}
            >
              <div className="explorer-actions-section">
                <button
                  className={`explorer-quick-buy-btn size-ultra ultra-${displaySettings.ultraStyle} ultra-text-${displaySettings.ultraColor}`}
                  style={{ color: displaySettings.secondQuickBuyColor }}
                  disabled={isLoadingSecondary}
                >
                  {isLoadingSecondary ? (
                    <div
                      style={{
                        border: `1.5px solid ${displaySettings.secondQuickBuyColor}`,
                        borderTop: `1.5px solid transparent`,
                      }}
                      className="ultra-quickbuy-loading-spinner"
                    />
                  ) : (
                    <>
                      <svg
                        fill={displaySettings.secondQuickBuyColor}
                        className="second-ultra-quickbuy-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 72 72"
                        width="64px"
                        height="64px"
                      >
                        <path d="M30.992,60.145c-0.599,0.753-1.25,1.126-1.952,1.117c-0.702-0.009-1.245-0.295-1.631-0.86	c-0.385-0.565-0.415-1.318-0.09-2.26l5.752-16.435H20.977c-0.565,0-1.036-0.175-1.412-0.526C19.188,40.83,19,40.38,19,39.833	c0-0.565,0.223-1.121,0.668-1.669l21.34-26.296c0.616-0.753,1.271-1.13,1.965-1.13s1.233,0.287,1.618,0.86	c0.385,0.574,0.415,1.331,0.09,2.273l-5.752,16.435h12.095c0.565,0,1.036,0.175,1.412,0.526C52.812,31.183,53,31.632,53,32.18	c0,0.565-0.223,1.121-0.668,1.669L30.992,60.145z" />
                      </svg>{' '}
                      {quickbuyAmountSecond} MON
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        <div
          className={`explorer-third-row metrics-size-${displaySettings.metricSize} ${displaySettings.quickBuySize === 'large' ? 'large-quickbuy-mode' : ''} ${displaySettings.quickBuySize === 'mega' ? 'mega-quickbuy-mode' : ''} ${displaySettings.quickBuySize === 'ultra' ? `ultra-quickbuy-mode ultra-${displaySettings.ultraStyle} ultra-text-${displaySettings.ultraColor}` : ''} ${displaySettings.quickBuySize === 'ultra' && displaySettings.secondQuickBuyEnabled ? 'ultra-dual-buttons' : ''}`}
          onClick={
            displaySettings.quickBuySize === 'ultra' &&
              displaySettings.secondQuickBuyEnabled
              ? (e) => {
                e.stopPropagation();
                onQuickBuy(token, quickbuyAmount, 'primary');
              }
              : displaySettings.quickBuySize === 'ultra' &&
                !displaySettings.secondQuickBuyEnabled
                ? (e) => {
                  e.stopPropagation();
                  onQuickBuy(token, quickbuyAmount, 'primary');
                }
                : undefined
          }
          onMouseMove={
            displaySettings.quickBuySize === 'ultra'
              ? (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
              }
              : undefined
          }
        >
          <div className="explorer-metrics-container">
            {displaySettings.visibleRows.volume && (
              <Tooltip content="Volume">
                <div className="explorer-volume">
                  <span className="mc-label">V</span>
                  <span className="mc-value">
                    {formatPrice(
                      token.volume24h * monUsdPrice,
                      displaySettings.noDecimals,
                    )}
                  </span>
                </div>
              </Tooltip>
            )}
            {displaySettings.visibleRows.marketCap && (
              <Tooltip content="Market Cap">
                <div className="explorer-market-cap">
                  <span className="mc-label">MC</span>
                  <span className="mc-value">
                    {formatPrice(
                      token.marketCap * monUsdPrice,
                      displaySettings.noDecimals,
                    )}
                  </span>
                </div>
              </Tooltip>
            )}
          </div>

          <div className="explorer-third-row-section">
            {displaySettings.visibleRows.fees && (
              <Tooltip content="Global Fees Paid">
                <div className="explorer-stat-item">
                  <span className="explorer-fee-label">F</span>
                  <span className="explorer-fee-total">
                    {formatPrice(
                      (token.volume24h * monUsdPrice) / 100,
                      displaySettings.noDecimals,
                    )}
                  </span>
                </div>
              </Tooltip>
            )}

            {displaySettings.visibleRows.tx && (
              <Tooltip content="Transactions">
                <div className="explorer-tx-bar">
                  <div className="explorer-tx-header">
                    <span className="explorer-tx-label">TX</span>
                    <span className="explorer-tx-total">
                      {totalTransactions.toLocaleString()}
                    </span>
                  </div>
                  <div className="explorer-tx-visual-bar">
                    {totalTransactions === 0 ? (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#252526ff',
                          borderRadius: '1px',
                        }}
                      />
                    ) : (
                      <>
                        <div
                          className="explorer-tx-buy-portion"
                          style={{ width: `${buyPct}%` }}
                        />
                        <div
                          className="explorer-tx-sell-portion"
                          style={{ width: `${sellPct}%` }}
                        />
                      </>
                    )}
                  </div>
                </div>
              </Tooltip>
            )}
          </div>

          <div
            className={`explorer-actions-section ${displaySettings.quickBuySize === 'ultra' ? 'ultra-mode' : ''}`}
          >
            {(() => {
              const sizeClass = `size-${displaySettings.quickBuySize}`;
              const modeClass =
                displaySettings.quickBuySize !== 'ultra'
                  ? `style-${displaySettings.quickBuyStyle}`
                  : `ultra-${displaySettings.ultraStyle} ultra-text-${displaySettings.ultraColor}`;
              const buttonClass = `explorer-quick-buy-btn ${sizeClass} ${modeClass}`;

              return (
                <button
                  className={buttonClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickBuy(token, quickbuyAmount, 'primary');

                    if (displaySettings.quickBuyClickBehavior === 'openPage') {
                      onTokenClick(token);
                    } else if (
                      displaySettings.quickBuyClickBehavior === 'openNewTab'
                    ) {
                      window.open(`/meme/${token.tokenAddress}`, '_blank');
                    }
                  }}
                  disabled={isLoadingPrimary}
                >
                  {isLoadingPrimary ? (
                    <>
                      <div className="quickbuy-loading-spinner" />
                      <img
                        className="explorer-quick-buy-icon"
                        src={lightning}
                        style={{ opacity: 0 }}
                      />
                      <span style={{ opacity: 0 }}>{quickbuyAmount} MON</span>
                    </>
                  ) : (
                    <>
                      <img
                        className="explorer-quick-buy-icon"
                        src={lightning}
                      />
                      {quickbuyAmount} MON
                    </>
                  )}
                </button>
              );
            })()}

            {displaySettings.secondQuickBuyEnabled &&
              displaySettings.quickBuySize !== 'ultra' && (
                <button
                  className={`explorer-quick-buy-btn second-button size-${displaySettings.quickBuySize} style-${displaySettings.quickBuyStyle}`}
                  style={{
                    ['--second-quickbuy-color' as any]:
                      displaySettings.secondQuickBuyColor,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (displaySettings.quickBuyClickBehavior === 'openPage') {
                      onQuickBuy(token, quickbuyAmountSecond, 'secondary');
                      onTokenClick(token);
                    } else if (
                      displaySettings.quickBuyClickBehavior === 'openNewTab'
                    ) {
                      onQuickBuy(token, quickbuyAmountSecond, 'secondary');
                      window.open(`/meme/${token.tokenAddress}`, '_blank');
                    } else {
                      onQuickBuy(token, quickbuyAmountSecond, 'secondary');
                    }
                  }}
                  disabled={isLoadingSecondary}
                >
                  {isLoadingSecondary ? (
                    <>
                      <div className="quickbuy-loading-spinner" />
                      <img
                        className="explorer-quick-buy-icon"
                        src={lightning}
                        style={{ opacity: 0 }}
                      />
                      <span style={{ opacity: 0 }}>
                        {quickbuyAmountSecond} MON
                      </span>
                    </>
                  ) : (
                    <>
                      <img
                        className="explorer-quick-buy-icon"
                        src={lightning}
                      />
                      {quickbuyAmountSecond} MON
                    </>
                  )}
                </button>
              )}
          </div>
        </div>
      </div>
      {showBonding &&
        createPortal(
          <div
            className="bonding-amount-display visible"
            style={{
              position: 'absolute',
              top: `${bondingPopupPosition.top}px`,
              left: `${bondingPopupPosition.left}px`,
              color: getBondingColor(bondingPercentage),
              zIndex: 1,
              pointerEvents: 'none',
            }}
          >
            BONDING: {bondingPercentage.toFixed(1)}%
          </div>,
          document.body,
        )}
    </>
  );
});

interface TokenExplorerProps {
  setpopup?: (popup: number) => void;
  appliedFilters?: TabFilters;
  onOpenFiltersForColumn: (c: Token['status']) => void;
  activeFilterTab?: Token['status'];
  sendUserOperationAsync: any;
  terminalQueryData: any;
  terminalToken: any;
  setTerminalToken: any;
  terminalRefetch: any;
  setTokenData: any;
  monUsdPrice: number;
  subWallets?: Array<{ address: string; privateKey: string }>;
  walletTokenBalances?: { [address: string]: any };
  activeWalletPrivateKey?: string;
  setOneCTSigner: (privateKey: string) => void;
  refetch: () => void;
  tokenList?: any[];
  activechain: number;
  logout: () => void;
  lastRefGroupFetch: any;
  lastNonceGroupFetch: any;
  currentWalletIcon?: string;
  isBlurred?: boolean;
  account: {
    connected: boolean;
    address?: string;
    chainId?: number;
  };
  quickAmounts: any;
  setQuickAmounts: any;
  openWebsocket: any;
  pausedColumn: any;
  setPausedColumn: any;
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

}

const TokenExplorer: React.FC<TokenExplorerProps> = ({
  appliedFilters,
  // activeFilterTab,
  onOpenFiltersForColumn,
  sendUserOperationAsync,
  setTerminalToken,
  terminalRefetch,
  setTokenData,
  monUsdPrice,
  setpopup,
  subWallets = [],
  walletTokenBalances = {},
  activeWalletPrivateKey,
  setOneCTSigner,
  // refetch,
  tokenList = [],
  activechain,
  // logout,
  // lastRefGroupFetch,
  // lastNonceGroupFetch,
  // currentWalletIcon,
  isBlurred = false,
  account,
  quickAmounts,
  setQuickAmounts,
  openWebsocket,
  pausedColumn,
  setPausedColumn,
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
}) => {
  const getMaxSpendableWei = useCallback(
    (addr: string): bigint => {
      const balances = walletTokenBalances[addr];
      if (!balances) return 0n;

      const ethToken = tokenList.find(
        (t) => t.address === appSettings.chainConfig[activechain].eth,
      );
      if (!ethToken || !balances[ethToken.address]) return 0n;

      let raw = balances[ethToken.address];
      if (raw <= 0n) return 0n;

      const gasReserve = BigInt(appSettings.chainConfig[activechain].gasamount ?? 0);
      const safe = raw > gasReserve ? raw - gasReserve : 0n;

      return safe;
    },
    [walletTokenBalances, tokenList, activechain],
  );
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [quickAmountsSecond, setQuickAmountsSecond] = useState<
    Record<Token['status'], string>
  >(() => ({
    new: localStorage.getItem('explorer-quickbuy-second-new') ?? '1',
    graduating:
      localStorage.getItem('explorer-quickbuy-second-graduating') ?? '1',
    graduated:
      localStorage.getItem('explorer-quickbuy-second-graduated') ?? '1',
  }));
  const setQuickAmountSecond = useCallback((s: Token['status'], v: string) => {
    const clean = v.replace(/[^0-9.]/g, '');
    setQuickAmountsSecond((p) => ({ ...p, [s]: clean }));
    localStorage.setItem(`explorer-quickbuy-second-${s}`, clean);
  }, []);

  const setActivePresetSecond = useCallback(
    (status: Token['status'], preset: number) => {
      setActivePresetsSecond((p) => ({ ...p, [status]: preset }));
      localStorage.setItem(
        `explorer-preset-second-${status}`,
        preset.toString(),
      );
    },
    [],
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
  const formatTimeAgo = (createdTimestamp: number) => {
    const now = Math.floor(currentTime / 1000);
    const ageSec = now - createdTimestamp;

    if (ageSec < 60) {
      return `${ageSec}s`;
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
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [walletNames, setWalletNames] = useState<{ [address: string]: string }>(
    {},
  );
  const walletDropdownRef = useRef<HTMLDivElement>(null);

  // Load wallet names from localStorage
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

  // Sync active wallet from localStorage
  useEffect(() => {
    const storedActiveWalletPrivateKey = localStorage.getItem(
      'crystal_active_wallet_private_key',
    );

    if (storedActiveWalletPrivateKey && subWallets.length > 0) {
      const isValidWallet = subWallets.some(
        (wallet) => wallet.privateKey === storedActiveWalletPrivateKey,
      );

      if (isValidWallet) {
        if (activeWalletPrivateKey !== storedActiveWalletPrivateKey) {
          setOneCTSigner(storedActiveWalletPrivateKey);
        }
      } else {
        localStorage.removeItem('crystal_active_wallet_private_key');
      }
    }
  }, [subWallets, setOneCTSigner, activeWalletPrivateKey]);

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

  // Wallet helper functions
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
    if (!balances || !tokenList.length) return 0;

    const ethToken = tokenList.find(
      (t) => t.address === appSettings.chainConfig[activechain]?.eth,
    );
    if (ethToken && balances[ethToken.address]) {
      return (
        Number(balances[ethToken.address]) / 10 ** Number(ethToken.decimals)
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
const toggleWalletSelection = useCallback((address: string) => {
  setSelectedWallets((prev) => {
    const next = new Set(prev);
    if (next.has(address)) {
      next.delete(address);
    } else {
      next.add(address);
    }
    return next;
  });
}, [setSelectedWallets]);

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
      if (setpopup) setpopup(4);
    } else {
      setIsWalletDropdownOpen(!isWalletDropdownOpen);
    }
  };

  const formatNumberWithCommas = (num: number, decimals = 2) => {
    if (num === 0) return '0';
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    if (num >= 1)
      return num.toLocaleString('en-US', { maximumFractionDigits: decimals });
    return num.toFixed(Math.min(decimals, 8));
  };

  const selectedSet = useMemo(() => new Set<string>(), []);

  const totalSelectedBalance = useMemo(() => {
    if (selectedWallets.size === 0) return 0;
    let total = 0;
    selectedWallets.forEach((address) => {
      total += getWalletBalance(address);
    });
    return total;
  }, [selectedWallets, walletTokenBalances, tokenList]);

  const navigate = useNavigate();
  const routerAddress =
    appSettings.chainConfig[activechain].launchpadRouter.toLowerCase();

  const [activeMobileTab, setActiveMobileTab] =
    useState<Token['status']>('new');
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(
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
        };
      } catch {
        return DISPLAY_DEFAULTS;
      }
    },
  );
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
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
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [buyPresets, setBuyPresets] = useState(() => loadBuyPresets());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      forceUpdate();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const wsRef = useRef<WebSocket | null>(null);
  const subIdRef = useRef(1);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const trackedMarketsRef = useRef<Set<string>>(new Set());
  const connectionStateRef = useRef<
    'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  >('disconnected');
  const retryCountRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const connectionAttemptsRef = useRef(0);
  const lastConnectionAttemptRef = useRef(0);
  const consecutiveFailuresRef = useRef(0);

  const scheduleReconnect = useCallback((initialMarkets: string[]) => {
    if (
      connectionStateRef.current === 'connecting' ||
      connectionStateRef.current === 'connected'
    )
      return;

    const baseDelay = consecutiveFailuresRef.current > 5 ? 10000 : 1000;
    const attempt = Math.min(retryCountRef.current, 8);
    const exponentialDelay = baseDelay * Math.pow(1.5, attempt);
    const jitter = Math.random() * 1000;
    const delay = Math.round(exponentialDelay + jitter);

    const now = Date.now();
    const timeSinceLastAttempt = now - lastConnectionAttemptRef.current;
    const minInterval = 2000;

    if (timeSinceLastAttempt < minInterval) {
      const additionalDelay = minInterval - timeSinceLastAttempt;
      setTimeout(() => scheduleReconnect(initialMarkets), additionalDelay);
      return;
    }

    if (reconnectTimerRef.current)
      window.clearTimeout(reconnectTimerRef.current);

    connectionStateRef.current = 'reconnecting';
    reconnectTimerRef.current = window.setTimeout(() => {
      openWebsocket(initialMarkets);
    }, delay);
  }, []);

  const handleTokenHover = useCallback((id: string) => setHoveredToken(id), []);
  const handleTokenLeave = useCallback(() => setHoveredToken(null), []);
  const handleImageHover = useCallback((id: string) => setHoveredImage(id), []);
  const handleImageLeave = useCallback(() => setHoveredImage(null), []);
  const handleInputFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value === '0') e.target.select();
    },
    [],
  );

  const handleColumnHover = useCallback((_columnType: Token['status']) => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    // setPausedColumn(columnType);
  }, []);

  const handleColumnLeave = useCallback(() => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = setTimeout(() => {
      setPausedColumn(null);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

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
            title = 'Developer Address Copied';
            subtitle = `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`;
          } else if (type === 'ca') {
            title = 'Contract Address Copied';
            subtitle = `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`;
          } else if (type === 'keyword') {
            title = 'Keyword Copied';
            subtitle = `"${text}" copied to clipboard`;
          } else if (type === 'website') {
            title = 'Website Copied';
            subtitle = `${text} copied to clipboard`;
          } else if (type === 'handle') {
            title = 'Twitter Handle Copied';
            subtitle = `${text} copied to clipboard`;
          } else {
            // Default for token addresses (when called from token rows without type)
            // Check if text looks like an Ethereum address
            if (/^0x[a-fA-F0-9]{40}$/.test(text)) {
              title = 'Address Copied';
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
      const val = BigInt(amt || '0') * 10n ** 18n;
      if (val === 0n) return;

      const targets: string[] = Array.from(selectedWallets);

      // If no wallets selected, fall back to current account
      if (targets.length === 0) {
        const currentAddr = account?.address;
        if (!currentAddr) {
          const txId = `quickbuy-error-${Date.now()}`;
          if (updatePopup) {
            updatePopup(txId, {
              title: 'No wallet selected',
              subtitle: 'Please select at least one wallet',
              variant: 'error',
              isLoading: false,
            });
          }
          return;
        }
        targets.push(currentAddr);
      }

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
            subtitle: `Buying ${amt} MON of ${token.symbol} across ${targets.length} wallet${targets.length > 1 ? 's' : ''}`,
            amount: amt,
            amountUnit: 'MON',
            tokenImage: token.image,
          });
        }

        // Build distribution plan with redistribution
        let remaining = val;
        const plan: { addr: string; amount: bigint }[] = [];

        // First pass: allocate fair share capped by wallet balance
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

        // Second pass: redistribute remaining among wallets with spare balance
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

        // Execute transfers
        const transferPromises = [];
        for (const { addr, amount: partWei } of plan) {
          if (partWei <= 0n) continue;

          const wally = subWallets.find((w) => w.address === addr);
          const pk = wally?.privateKey ?? activeWalletPrivateKey;
          if (!pk) continue;

          const uo = {
            target: routerAddress as `0x${string}`,
            data: encodeFunctionData({
              abi: CrystalRouterAbi,
              functionName: 'buy',
              args: [true, token.tokenAddress as `0x${string}`, partWei, 0n],
            }),
            value: partWei,
          };

          const wallet = nonces.current.get(addr);
          const params = [{ uo }, 0n, 0n, false, pk, wallet?.nonce];
          if (wallet) wallet.nonce += 1;
          wallet?.pendingtxs.push(params);

          const transferPromise = sendUserOperationAsync(...params)
            .then(() => {
              if (wallet)
                wallet.pendingtxs = wallet.pendingtxs.filter(
                  (p: any) => p !== params,
                );
              return true;
            })
            .catch(() => {
              if (wallet)
                wallet.pendingtxs = wallet.pendingtxs.filter(
                  (p: any) => p !== params,
                );
              return false;
            });
          transferPromises.push(transferPromise);
        }

        const results = await Promise.allSettled(transferPromises);
        const successfulTransfers = results.filter(
          (result) => result.status === 'fulfilled' && result.value === true,
        ).length;

        terminalRefetch();

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
      routerAddress,
      sendUserOperationAsync,
      selectedWallets,
      subWallets,
      activeWalletPrivateKey,
      getMaxSpendableWei,
      account,
      nonces,
      terminalRefetch,
    ],
  );

  const handleTokenClick = useCallback(
    (t: Token) => {
      setTerminalToken(t.tokenAddress);
      setTokenData(t);
      navigate(`/meme/${t.tokenAddress}`);
    },
    [navigate],
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

  const handleBlacklistToken = useCallback((token: Token) => {
    const newItem = {
      id: Date.now().toString(),
      text: token.dev,
      type: 'dev' as const,
    };
    setBlacklistSettings((prev) => ({ items: [...prev.items, newItem] }));
  }, []);

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

  const visibleTokens = useMemo(() => {
    const base = {
      new: displaySettings.hideHiddenTokens
        ? tokensByStatus.new.filter((t: any) => !hidden.has(t.id))
        : tokensByStatus.new,
      graduating: displaySettings.hideHiddenTokens
        ? tokensByStatus.graduating.filter((t: any) => !hidden.has(t.id))
        : tokensByStatus.graduating,
      graduated: displaySettings.hideHiddenTokens
        ? tokensByStatus.graduated.filter((t: any) => !hidden.has(t.id))
        : tokensByStatus.graduated,
    } as Record<Token['status'], Token[]>;

    const filterByBlacklist = (tokens: Token[]) => {
      return tokens.filter((token) => {
        return !blacklistSettings.items.some((item) => {
          const itemText = item.text.toLowerCase();

          switch (item.type) {
            case 'dev':
              return token.dev.toLowerCase() === itemText;
            case 'ca':
              return token.tokenAddress.toLowerCase() === itemText;
            case 'keyword':
              const searchText =
                `${token.name} ${token.symbol} ${token.description}`.toLowerCase();
              return searchText.includes(itemText);
            case 'website':
              return token.website.toLowerCase().includes(itemText);
            case 'handle':
              return token.twitterHandle.toLowerCase().includes(itemText);
            default:
              return false;
          }
        });
      });
    };

    // Apply blacklist to all categories
    const blacklisted = {
      new: filterByBlacklist(base.new),
      graduating: filterByBlacklist(base.graduating),
      graduated: filterByBlacklist(base.graduated),
    };

    if (!appliedFilters) return blacklisted;

    return (['new', 'graduating', 'graduated'] as Token['status'][]).reduce(
      (acc, s) => ({
        ...acc,
        [s]: appliedFilters[s]
          ? applyFilters(blacklisted[s], appliedFilters[s])
          : blacklisted[s],
      }),
      {} as Record<Token['status'], Token[]>,
    );
  }, [
    tokensByStatus,
    hidden,
    appliedFilters,
    applyFilters,
    displaySettings.hideHiddenTokens,
    blacklistSettings,
  ]);
  const newTokens = visibleTokens.new;
  const graduatingTokens = visibleTokens.graduating;
  const graduatedTokens = visibleTokens.graduated;

  const tokenCounts = useMemo(
    () => ({
      new: newTokens.length,
      graduating: graduatingTokens.length,
      graduated: graduatedTokens.length,
    }),
    [newTokens.length, graduatingTokens.length, graduatedTokens.length],
  );

  const renderOrder: Array<ColumnKey> =
    Array.isArray(displaySettings?.columnOrder) &&
      displaySettings.columnOrder.length
      ? displaySettings.columnOrder
      : (['new', 'graduating', 'graduated'] as Array<ColumnKey>);

  return (
    <div className="explorer-main">
      <div className="explorer-header-row">
        <div className="explorer-header-left">
          <h1 className="explorer-app-title">Spectra</h1>
        </div>

        <div className="explorer-header-right">
          <DisplayDropdown
            settings={displaySettings}
            onSettingsChange={setDisplaySettings}
            quickAmountsSecond={quickAmountsSecond}
            setQuickAmountSecond={setQuickAmountSecond}
            activePresetsSecond={activePresetsSecond}
            setActivePresetSecond={setActivePresetSecond}
          />
          <button
            className="alerts-popup-trigger"
            onClick={() => setShowAlertsPopup(true)}
          >
            <Bell size={18} />
          </button>

          <button
            className="alerts-popup-trigger"
            onClick={() => setShowBlacklistPopup(true)}
          >
            <svg
              className="blacklist-dev-icon"
              width="18"
              height="18"
              viewBox="0 0 30 30"
              fill="#7f808d"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
            </svg>
          </button>

          <div className="wallet-dropdown-container" ref={walletDropdownRef}>
            <button
              type="button"
              className="transparent-button"
              onClick={handleWalletButtonClick}
            >
              <div className="connect-content">
                <span className="transparent-button-container">
                  <img src={walleticon} className="img-wallet-icon" />
                  <span
                    className={`wallet-count ${selectedSet.size ? 'has-active' : ''}`}
                  >
                    {selectedWallets.size}
                  </span>
                  <span className="subwallet-total-balance">
                    {selectedWallets.size > 0 ? (
                      <>
                        <img
                          src={monadicon}
                          className="wallet-dropdown-mon-icon"
                          style={{
                            width: '15px',
                            height: '15px',
                            marginRight: '4px',
                          }}
                        />
                        {formatNumberWithCommas(totalSelectedBalance, 2)}
                      </>
                    ) : (
                      <>
                        <img
                          src={monadicon}
                          className="wallet-dropdown-mon-icon"
                          style={{
                            width: '15px',
                            height: '15px',
                            marginRight: '4px',
                          }}
                        />{' '}
                        <span>0</span>
                      </>
                    )}
                  </span>
                  <svg
                    className={`wallet-dropdown-arrow ${isWalletDropdownOpen ? 'open' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </div>
            </button>
            {account.connected && (
              <div
                className={`wallet-dropdown-panel ${isWalletDropdownOpen ? 'visible' : ''}`}
              >
                <div className="wallet-dropdown-header">
                  <div className="wallet-dropdown-actions">
                    <button
                      className="wallet-action-btn"
                      onClick={
                        selectedWallets.size === subWallets.length
                          ? unselectAllWallets
                          : selectAllWallets
                      }
                    >
                      {selectedWallets.size === subWallets.length
                        ? 'Unselect All'
                        : 'Select All'}
                    </button>
                    <button
                      className="wallet-action-btn"
                      onClick={selectAllWithBalance}
                    >
                      Select All with Balance
                    </button>
                  </div>
                  <button
                    className="wallet-dropdown-close"
                    onClick={() => setIsWalletDropdownOpen(false)}
                  >
                    <img
                      src={closebutton}
                      className="wallet-dropdown-close-icon"
                    />
                  </button>
                </div>
                <div className="wallet-dropdown-list">
                  {subWallets.length > 0 ? (
                    subWallets.map((wallet, index) => {
                      const balance = getWalletBalance(wallet.address);
                      const isActive = isWalletActive(wallet.privateKey);
                      const isSelected = selectedWallets.has(wallet.address);

                      return (
                        <div
                          key={wallet.address}
                          className={`quickbuy-wallet-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleWalletSelection(wallet.address)}
                        >
                          <div className="quickbuy-wallet-checkbox-container">
                            <input
                              type="checkbox"
                              className="quickbuy-wallet-checkbox selection"
                              checked={isSelected}
                              readOnly
                            />
                          </div>
                          <div className="wallet-dropdown-info">
                            <div className="wallet-dropdown-name">
                              {getWalletName(wallet.address, index)}
                            </div>
                            <div className="wallet-dropdown-address">
                              {wallet.address.slice(0, 6)}...
                              {wallet.address.slice(-4)}
                            </div>
                          </div>
                          <Tooltip content="MON Balance">
                            <div className="wallet-dropdown-balance">
                              <div
                                className={`wallet-dropdown-balance-amount ${isBlurred ? 'blurred' : ''}`}
                              >
                                <img
                                  src={monadicon}
                                  className="wallet-dropdown-mon-icon"
                                />
                                {formatNumberWithCommas(balance, 2)}
                              </div>
                            </div>
                          </Tooltip>
                          <Tooltip content="Tokens">
                            <div className="wallet-drag-tokens">
                              <div className="wallet-token-count">
                                <div className="wallet-token-structure-icons">
                                  <div className="token1"></div>
                                  <div className="token2"></div>
                                  <div className="token3"></div>
                                </div>
                                <span className="wallet-total-tokens">
                                  {getWalletTokenCount(wallet.address)}
                                </span>
                              </div>
                            </div>
                          </Tooltip>
                        </div>
                      );
                    })
                  ) : (
                    <div className="wallet-dropdown-no-subwallets">
                      <button
                        className="wallet-dropdown-action-btn 1ct-trading-btn"
                        onClick={() => {
                          if (setpopup) setpopup(28);
                          setIsWalletDropdownOpen(false);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="wallet-dropdown-action-icon"
                        >
                          <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
                        </svg>
                        Enable 1CT
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="explorer-container">
        <MobileTabSelector
          activeTab={activeMobileTab}
          onTabChange={setActiveMobileTab}
          tokenCounts={tokenCounts}
        />

        <div className="explorer-columns">
          {renderOrder
            .filter((col) => !displaySettings.hiddenColumns?.includes(col))
            .map((columnType) => (
              <div
                key={columnType}
                className={`explorer-column ${activeMobileTab === columnType ? 'mobile-active' : ''}`}
                onMouseEnter={() => handleColumnHover(columnType)}
                onMouseLeave={handleColumnLeave}
              >
                {' '}
                {columnType === 'new' && (
                  <>
                    <div className="explorer-column-header">
                      <div className="explorer-column-title-section">
                        <h2 className="explorer-column-title">New Pairs</h2>
                      </div>
                      <div className="explorer-column-title-right">
                        <div
                          className={`column-pause-icon ${pausedColumn === 'new' ? 'visible' : ''}`}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M7 19h2V5H7v14zm8-14v14h2V5h-2z" />
                          </svg>
                        </div>
                        <div className="explorer-quickbuy-container">
                          <img
                            className="explorer-quick-buy-search-icon"
                            src={lightning}
                            alt=""
                          />
                          <input
                            type="text"
                            placeholder="0.0"
                            value={quickAmounts.new}
                            onChange={(e) =>
                              setQuickAmount('new', e.target.value)
                            }
                            onFocus={handleInputFocus}
                            className="explorer-quickbuy-input"
                          />
                          <img
                            className="quickbuy-monad-icon"
                            src={monadicon}
                          />
                          <div className="explorer-preset-controls">
                            {[1, 2, 3].map((p) => (
                              <Tooltip
                                key={p}
                                offset={35}
                                content={
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '4px',
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                      }}
                                    >
                                      <img
                                        src={slippage}
                                        style={{
                                          width: '14px',
                                          height: '14px',
                                        }}
                                        alt="Slippage"
                                      />
                                      <span>
                                        {buyPresets[p]?.slippage || '0'}%
                                      </span>
                                    </div>
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                      }}
                                    >
                                      <img
                                        src={gas}
                                        style={{
                                          width: '14px',
                                          height: '14px',
                                        }}
                                        alt="sPriority"
                                      />
                                      <span>
                                        {buyPresets[p]?.priority || '0'}{' '}
                                      </span>
                                    </div>
                                  </div>
                                }
                              >
                                <button
                                  className={`explorer-preset-pill ${activePresets.new === p ? 'active' : ''}`}
                                  onClick={() => setActivePreset('new', p)}
                                >
                                  P{p}
                                </button>
                              </Tooltip>
                            ))}
                          </div>
                        </div>

                        {alertSettings.soundAlertsEnabled && (
                          <button
                            className="alerts-popup-trigger"
                            onClick={() => setShowAlertsPopup(true)}
                          >
                            <Bell size={18} />
                          </button>
                        )}
                        <button
                          className={`column-filter-icon ${appliedFilters?.new ? 'active' : ''}`}
                          onClick={() => onOpenFiltersForColumn('new')}
                          title="filter new pairs"
                        >
                          <img className="filter-icon" src={filter} />
                          {appliedFilters?.new && (
                            <span className="filter-active-dot" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="explorer-tokens-list">
                      {isLoading ? (
                        Array.from({ length: 14 }).map((_, index) => (
                          <div
                            key={`skeleton-new-${index}`}
                            className="explorer-token-row loading"
                          >
                            <div className="explorer-token-left">
                              <div className="explorer-token-image-container">
                                <div className="explorer-progress-spacer">
                                  <div className="explorer-image-wrapper">
                                    <img
                                      className="explorer-token-image"
                                      alt="loading"
                                    />
                                  </div>
                                </div>
                              </div>
                              <span className="explorer-contract-address">
                                Loading...
                              </span>
                            </div>
                            <div className="explorer-token-details">
                              <div className="explorer-detail-section">
                                <div className="explorer-top-row">
                                  <div className="explorer-token-info">
                                    <h3 className="explorer-token-symbol">
                                      LOAD
                                    </h3>
                                    <p className="explorer-token-name">
                                      Loading Token
                                    </p>
                                  </div>
                                </div>
                                <div className="explorer-second-row">
                                  <div className="explorer-stat-item">
                                    <span className="explorer-stat-value">
                                      0
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="explorer-holdings-section" />
                            </div>
                            <div className="explorer-third-row">
                              <div className="explorer-market-cap">
                                <span className="mc-label"></span>
                                <span className="mc-label"></span>
                              </div>
                              <div className="explorer-actions-section">
                                <button className="explorer-quick-buy-btn">
                                  Loading
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : newTokens.length ? (
                        newTokens.map((t) => (
                          <TokenRow
                            key={t.id}
                            token={t}
                            quickbuyAmount={quickAmounts.new}
                            quickbuyAmountSecond={quickAmountsSecond.new}
                            onHideToken={hideToken}
                            onBlacklistToken={handleBlacklistToken}
                            isLoadingPrimary={loading.has(`${t.id}-primary`)}
                            isLoadingSecondary={loading.has(
                              `${t.id}-secondary`,
                            )}
                            hoveredToken={hoveredToken}
                            hoveredImage={hoveredImage}
                            onTokenHover={handleTokenHover}
                            onTokenLeave={handleTokenLeave}
                            onImageHover={handleImageHover}
                            onImageLeave={handleImageLeave}
                            onTokenClick={handleTokenClick}
                            onQuickBuy={handleQuickBuy}
                            onCopyToClipboard={copyToClipboard}
                            displaySettings={displaySettings}
                            isHidden={hidden.has(t.id)}
                            monUsdPrice={monUsdPrice}
                            blacklistSettings={blacklistSettings}
                            formatTimeAgo={formatTimeAgo}
                          />
                        ))
                      ) : (
                        <div className="no-tokens-message">
                          <img src={empty} className="empty-icon" />
                          No tokens match the current filters
                        </div>
                      )}
                    </div>
                  </>
                )}
                {columnType === 'graduating' && (
                  <>
                    <div className="explorer-column-header">
                      <div className="explorer-column-title-section">
                        <h2 className="explorer-column-title">Final Stretch</h2>
                      </div>
                      <div className="explorer-column-title-right">
                        <div
                          className={`column-pause-icon ${pausedColumn === 'graduating' ? 'visible' : ''}`}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M7 19h2V5H7v14zm8-14v14h2V5h-2z" />
                          </svg>
                        </div>
                        <div className="explorer-quickbuy-container">
                          <img
                            className="explorer-quick-buy-search-icon"
                            src={lightning}
                            alt=""
                          />
                          <input
                            type="text"
                            placeholder="0.0"
                            value={quickAmounts.graduating}
                            onChange={(e) =>
                              setQuickAmount('graduating', e.target.value)
                            }
                            onFocus={handleInputFocus}
                            className="explorer-quickbuy-input"
                          />
                          <img
                            className="quickbuy-monad-icon"
                            src={monadicon}
                          />
                          <div className="explorer-preset-controls">
                            {[1, 2, 3].map((p) => (
                              <Tooltip
                                key={p}
                                offset={35}
                                content={
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '4px',
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                      }}
                                    >
                                      <img
                                        src={slippage}
                                        style={{
                                          width: '14px',
                                          height: '14px',
                                        }}
                                        alt="Slippage"
                                      />
                                      <span>
                                        {buyPresets[p]?.slippage || '0'}%
                                      </span>
                                    </div>
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                      }}
                                    >
                                      <img
                                        src={gas}
                                        style={{
                                          width: '14px',
                                          height: '14px',
                                        }}
                                        alt="Priority"
                                      />
                                      <span>
                                        {buyPresets[p]?.priority || '0'}
                                      </span>
                                    </div>
                                  </div>
                                }
                              >
                                <button
                                  className={`explorer-preset-pill ${activePresets.graduating === p ? 'active' : ''}`}
                                  onClick={() =>
                                    setActivePreset('graduating', p)
                                  }
                                >
                                  P{p}
                                </button>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                        {alertSettings.soundAlertsEnabled && (
                          <button
                            className="alerts-popup-trigger"
                            onClick={() => setShowAlertsPopup(true)}
                          >
                            <Bell size={18} />
                          </button>
                        )}
                        <button
                          className={`column-filter-icon ${appliedFilters?.graduating ? 'active' : ''}`}
                          onClick={() => onOpenFiltersForColumn('graduating')}
                          title="Filter graduating tokens"
                        >
                          <img className="filter-icon" src={filter} />
                          {appliedFilters?.graduating && (
                            <span className="filter-active-dot" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="explorer-tokens-list">
                      {isLoading ? (
                        Array.from({ length: 14 }).map((_, index) => (
                          <div
                            key={`skeleton-graduating-${index}`}
                            className="explorer-token-row loading"
                          >
                            <div className="explorer-token-left">
                              <div className="explorer-token-image-container">
                                <div className="explorer-progress-spacer">
                                  <div className="explorer-image-wrapper">
                                    <img
                                      className="explorer-token-image"
                                      alt="loading"
                                    />
                                  </div>
                                </div>
                              </div>
                              <span className="explorer-contract-address">
                                Loading...
                              </span>
                            </div>
                            <div className="explorer-token-details">
                              <div className="explorer-detail-section">
                                <div className="explorer-top-row">
                                  <div className="explorer-token-info">
                                    <h3 className="explorer-token-symbol">
                                      LOAD
                                    </h3>
                                    <p className="explorer-token-name">
                                      Loading Token
                                    </p>
                                  </div>
                                </div>
                                <div className="explorer-second-row">
                                  <div className="explorer-stat-item">
                                    <span className="explorer-stat-value">
                                      0
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="explorer-holdings-section" />
                            </div>
                            <div className="explorer-third-row">
                              <div className="explorer-market-cap">
                                <span className="mc-label"></span>
                                <span className="mc-label"></span>
                              </div>
                              <div className="explorer-actions-section">
                                <button className="explorer-quick-buy-btn">
                                  Loading
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : graduatingTokens.length ? (
                        graduatingTokens.map((t) => (
                          <TokenRow
                            key={t.id}
                            token={t}
                            quickbuyAmount={quickAmounts.new}
                            quickbuyAmountSecond={quickAmountsSecond.new}
                            onHideToken={hideToken}
                            onBlacklistToken={handleBlacklistToken}
                            isLoadingPrimary={loading.has(`${t.id}-primary`)}
                            isLoadingSecondary={loading.has(
                              `${t.id}-secondary`,
                            )}
                            hoveredToken={hoveredToken}
                            hoveredImage={hoveredImage}
                            onTokenHover={handleTokenHover}
                            onTokenLeave={handleTokenLeave}
                            onImageHover={handleImageHover}
                            onImageLeave={handleImageLeave}
                            onTokenClick={handleTokenClick}
                            onQuickBuy={handleQuickBuy}
                            onCopyToClipboard={copyToClipboard}
                            displaySettings={displaySettings}
                            isHidden={hidden.has(t.id)}
                            monUsdPrice={monUsdPrice}
                            blacklistSettings={blacklistSettings}
                            formatTimeAgo={formatTimeAgo}
                          />
                        ))
                      ) : (
                        <div className="no-tokens-message">
                          <img src={empty} className="empty-icon" />
                          No tokens match the current filters
                        </div>
                      )}
                    </div>
                  </>
                )}
                {columnType === 'graduated' && (
                  <>
                    <div className="explorer-column-header">
                      <div className="explorer-column-title-section">
                        <h2 className="explorer-column-title">Graduated</h2>
                      </div>
                      <div className="explorer-column-title-right">
                        <div
                          className={`column-pause-icon ${pausedColumn === 'graduated' ? 'visible' : ''}`}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M7 19h2V5H7v14zm8-14v14h2V5h-2z" />
                          </svg>
                        </div>
                        <div className="explorer-quickbuy-container">
                          <img
                            className="explorer-quick-buy-search-icon"
                            src={lightning}
                            alt=""
                          />
                          <input
                            type="text"
                            placeholder="0.0"
                            value={quickAmounts.graduated}
                            onChange={(e) =>
                              setQuickAmount('graduated', e.target.value)
                            }
                            onFocus={handleInputFocus}
                            className="explorer-quickbuy-input"
                          />
                          <img
                            className="quickbuy-monad-icon"
                            src={monadicon}
                          />
                          <div className="explorer-preset-controls">
                            {[1, 2, 3].map((p) => (
                              <Tooltip
                                key={p}
                                offset={35}
                                content={
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '4px',
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                      }}
                                    >
                                      <img
                                        src={slippage}
                                        style={{
                                          width: '14px',
                                          height: '14px',
                                        }}
                                        alt="Slippage"
                                      />
                                      <span>
                                        {buyPresets[p]?.slippage || '0'}%
                                      </span>
                                    </div>
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                      }}
                                    >
                                      <img
                                        src={gas}
                                        style={{
                                          width: '14px',
                                          height: '14px',
                                        }}
                                        alt="Priority"
                                      />
                                      <span>
                                        {buyPresets[p]?.priority || '0'}{' '}
                                      </span>
                                    </div>
                                  </div>
                                }
                              >
                                <button
                                  className={`explorer-preset-pill ${activePresets.graduated === p ? 'active' : ''}`}
                                  onClick={() =>
                                    setActivePreset('graduated', p)
                                  }
                                >
                                  P{p}
                                </button>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                        {alertSettings.soundAlertsEnabled && (
                          <button
                            className="alerts-popup-trigger"
                            onClick={() => setShowAlertsPopup(true)}
                          >
                            <Bell size={18} />
                          </button>
                        )}
                        <button
                          className={`column-filter-icon ${appliedFilters?.graduated ? 'active' : ''}`}
                          onClick={() => onOpenFiltersForColumn('graduated')}
                          title="filter graduated tokens"
                        >
                          <img className="filter-icon" src={filter} />
                          {appliedFilters?.graduated && (
                            <span className="filter-active-dot" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="explorer-tokens-list">
                      {isLoading ? (
                        Array.from({ length: 14 }).map((_, index) => (
                          <div
                            key={`skeleton-graduated-${index}`}
                            className="explorer-token-row loading"
                          >
                            <div className="explorer-token-left">
                              <div className="explorer-token-image-container">
                                <div className="explorer-progress-spacer">
                                  <div className="explorer-image-wrapper">
                                    <img
                                      className="explorer-token-image"
                                      alt="loading"
                                    />
                                  </div>
                                </div>
                              </div>
                              <span className="explorer-contract-address">
                                Loading...
                              </span>
                            </div>
                            <div className="explorer-token-details">
                              <div className="explorer-detail-section">
                                <div className="explorer-top-row">
                                  <div className="explorer-token-info">
                                    <h3 className="explorer-token-symbol">
                                      LOAD
                                    </h3>
                                    <p className="explorer-token-name">
                                      Loading Token
                                    </p>
                                  </div>
                                </div>
                                <div className="explorer-second-row">
                                  <div className="explorer-stat-item">
                                    <span className="explorer-stat-value">
                                      0
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="explorer-holdings-section" />
                            </div>
                            <div className="explorer-third-row">
                              <div className="explorer-market-cap">
                                <span className="mc-label"></span>
                                <span className="mc-label"></span>
                              </div>
                              <div className="explorer-actions-section">
                                <button className="explorer-quick-buy-btn">
                                  Loading
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : graduatedTokens.length ? (
                        graduatedTokens.map((t) => (
                          <TokenRow
                            key={t.id}
                            token={t}
                            quickbuyAmount={quickAmounts.new}
                            quickbuyAmountSecond={quickAmountsSecond.new}
                            onHideToken={hideToken}
                            onBlacklistToken={handleBlacklistToken}
                            isLoadingPrimary={loading.has(`${t.id}-primary`)}
                            isLoadingSecondary={loading.has(
                              `${t.id}-secondary`,
                            )}
                            hoveredToken={hoveredToken}
                            hoveredImage={hoveredImage}
                            onTokenHover={handleTokenHover}
                            onTokenLeave={handleTokenLeave}
                            onImageHover={handleImageHover}
                            onImageLeave={handleImageLeave}
                            onTokenClick={handleTokenClick}
                            onQuickBuy={handleQuickBuy}
                            onCopyToClipboard={copyToClipboard}
                            displaySettings={displaySettings}
                            isHidden={hidden.has(t.id)}
                            monUsdPrice={monUsdPrice}
                            blacklistSettings={blacklistSettings}
                            formatTimeAgo={formatTimeAgo}
                          />
                        ))
                      ) : (
                        <div className="no-tokens-message">
                          <img src={empty} className="empty-icon" />
                          No tokens match the current filters
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
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

export default TokenExplorer;
