import React, {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { Search, EyeOff, Hash, Image, BarChart3, Bell, Volume2, Play, RotateCcw, Eye, ChevronDown } from 'lucide-react';

import { settings as appSettings } from '../../settings';
import { CrystalRouterAbi } from '../../abis/CrystalRouterAbi.ts';
import { encodeFunctionData, decodeEventLog } from 'viem';
import { defaultMetrics } from './TokenData';
import { showLoadingPopup, updatePopup } from '../MemeTransactionPopup/MemeTransactionPopupManager';

import telegram from '../../assets/telegram.png';
import lightning from '../../assets/flash.png';
import monadicon from '../../assets/monadlogo.svg';
import camera from '../../assets/camera.svg';
import filter from '../../assets/filter.svg';
import empty from '../../assets/empty.svg';
import trash from '../../assets/trash.svg';
import discord from '../../assets/discord1.svg';
import reset from '../../assets/reset.svg';
import closebutton from '../../assets/close_button.png';
import './TokenExplorer.css';
import { useNavigate } from 'react-router-dom';

import stepaudio from '../../assets/step_audio.mp3';
import kaching from '../../assets/ka-ching.mp3';

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
  kolTraders: number;
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
}

type ColumnKey = 'new' | 'graduating' | 'graduated';

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
    kols: boolean;
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
    marketCap: { range1: string; range2: string; range3: string; };
    volume: { range1: string; range2: string; range3: string; };
    holders: { range1: string; range2: string; range3: string; };
  };
}

interface AlertSettings {
  soundAlertsEnabled: boolean;
  volume: number;
  sounds: {
    newPairs: string;
    pairMigrating: string;
    migrated: string;
  };
}

interface BlacklistSettings {
  items: Array<{
    id: string;
    text: string;
    type: 'dev' | 'ca' | 'keyword' | 'website' | 'handle';
  }>;
}

type BlacklistTab = 'all' | 'dev' | 'ca' | 'keyword' | 'website' | 'handle';

interface TokenExplorerProps {
  setpopup?: (popup: number) => void;
  appliedFilters?: any;
  onOpenFiltersForColumn: (c: Token['status']) => void;
  activeFilterTab?: Token['status'];
  sendUserOperationAsync: any;
  terminalQueryData: any;
  terminalToken: any;
  setTerminalToken: any;
}

const MAX_PER_COLUMN = 30;
const TOTAL_SUPPLY = 1e9;

const ROUTER_EVENT = '0x32a005ee3e18b7dd09cfff956d3a1e8906030b52ec1a9517f6da679db7ffe540';
const MARKET_UPDATE_EVENT = '0xc367a2f5396f96d105baaaa90fe29b1bb18ef54c712964410d02451e67c19d3e';
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/104695/test/v0.3.3';

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
  quickBuyClickBehavior: 'nothing',
  secondQuickBuyEnabled: false,
  secondQuickBuyColor: '#526FFF',
  visibleRows: {
    marketCap: true,
    volume: true,
    fees: true,
    tx: true,
    socials: true,
    holders: true,
    proTraders: true,
    kols: true,
    devMigrations: false,
    top10Holders: true,
    devHolding: true,
    fundingTime: false,
    snipers: true,
    insiders: true,
    dexPaid: false,
  },
  metricColoring: false,
  metricColors: {
    marketCap: { range1: '#d8dcff', range2: '#eab308', range3: '#14b8a6' },
    volume: { range1: '#ffffff', range2: '#ffffff', range3: '#ffffff' },
    holders: { range1: '#ffffff', range2: '#ffffff', range3: '#ffffff' },
  },
};

const ALERT_DEFAULTS: AlertSettings = {
  soundAlertsEnabled: true,
  volume: 100,
  sounds: {
    newPairs: stepaudio,
    pairMigrating: stepaudio,
    migrated: stepaudio,
  },
};

const BLACKLIST_DEFAULTS: BlacklistSettings = { items: [] };

const getMetricColorClass = (token: Token | undefined, display: DisplaySettings) => {
  if (!token || !display?.metricColors || !display?.metricColoring) return null;
  if (typeof token.marketCap !== 'number' || isNaN(token.marketCap)) return null;

  if (token.marketCap < 30000) {
    return { class: 'market-cap-range1', color: display.metricColors.marketCap.range1 };
  } else if (token.marketCap < 150000) {
    return { class: 'market-cap-range2', color: display.metricColors.marketCap.range2 };
  } else {
    return { class: 'market-cap-range3', color: display.metricColors.marketCap.range3 };
  }
};

const hasMetricColoring = (displaySettings: DisplaySettings | undefined) => {
  if (!displaySettings?.metricColoring || !displaySettings?.metricColors) return false;
  try {
    return Object.values(displaySettings.metricColors).some(ranges =>
      ranges && Object.values(ranges).some(color =>
        color && typeof color === 'string' && color.toLowerCase() !== '#ffffff'
      )
    );
  } catch {
    return false;
  }
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
  if (p >= 1e12) return `${noDecimals ? Math.round(p / 1e12) : (p / 1e12).toFixed(1)}T MON`;
  if (p >= 1e9) return `${noDecimals ? Math.round(p / 1e9) : (p / 1e9).toFixed(1)}B MON`;
  if (p >= 1e6) return `${noDecimals ? Math.round(p / 1e6) : (p / 1e6).toFixed(1)}M MON`;
  if (p >= 1e3) return `${noDecimals ? Math.round(p / 1e3) : (p / 1e3).toFixed(1)}K MON`;
  return `${noDecimals ? Math.round(p) : p.toFixed(2)} MON`;
};

const formatTimeAgo = (createdTimestamp: number) => {
  const now = Math.floor(Date.now() / 1000);
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

const calculateBondingPercentage = (marketCap: number) => {
  const bondingPercentage = Math.min((marketCap / 10000) * 100, 100);
  return bondingPercentage;
};

const Tooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, children, position = 'top' }) => {
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
        top = rect.top + scrollY - tooltipRect.height - 25;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollY + 10;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - tooltipRect.width - 10;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + 10;
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
  }, [position]);

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
      {shouldRender && createPortal(
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
                : 'none'} scale(${isVisible ? 1 : 0})`,
            opacity: isVisible ? 1 : 0,
            zIndex: 9999,
            pointerEvents: 'none',
            transition: 'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform, opacity'
          }}
        >
          <div className="tooltip-content">
            {content}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const BlacklistPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  settings: BlacklistSettings;
  onSettingsChange: (settings: BlacklistSettings) => void;
}> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [activeTab, setActiveTab] = useState<BlacklistTab>('all');
  const [inputValue, setInputValue] = useState('');

  const addToBlacklist = () => {
    if (!inputValue.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      type: activeTab === 'all' ? 'keyword' : (activeTab as any),
    };

    onSettingsChange({
      items: [...settings.items, newItem]
    });

    setInputValue('');
  };

  const removeFromBlacklist = (id: string) => {
    onSettingsChange({
      items: settings.items.filter(item => item.id !== id)
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

  const filteredItems = activeTab === 'all'
    ? settings.items
    : settings.items.filter(item => item.type === activeTab);

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
            <input
              type="text"
              className="blacklist-input"
              placeholder="Enter twitter handle, dev address or keyword"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addToBlacklist()}
            />
            <button className="blacklist-add-btn" onClick={addToBlacklist}>
              Blacklist
            </button>
          </div>

          <div className="blacklist-tabs">
            {(['all', 'dev', 'ca', 'keyword', 'website', 'handle'] as BlacklistTab[]).map((tab) => (
              <button
                key={tab}
                className={`blacklist-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="blacklist-list">
            {filteredItems.length === 0 ? (
              <div className="blacklist-empty">
                <svg
                  className="blacklist-dev-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 30 30"
                  fill="rgb(95, 99, 105)"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                </svg>
                <span>No blacklisted items</span>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="blacklist-item">
                  <div className="blacklist-item-content">
                    <span className="blacklist-item-text">{item.text}</span>
                    <span className="blacklist-item-type">{item.type}</span>
                  </div>
                  <button
                    className="blacklist-remove-btn"
                    onClick={() => removeFromBlacklist(item.id)}
                  >
                    <img src={trash} className="blacklist-remove-icon" alt="Remove" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="blacklist-footer">
            <span className="blacklist-count">
              {settings.items.length} / 1000 blacklists
            </span>
            <div className="blacklist-actions">
              <button className="blacklist-delete-all-btn" onClick={deleteAll}>
                Delete All
              </button>
              <label className="blacklist-import-btn">
                Import
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={importBlacklist}
                />
              </label>
              <button className="blacklist-export-btn" onClick={exportBlacklist}>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertsPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  settings: AlertSettings;
  onSettingsChange: (settings: AlertSettings) => void;
}> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  const sliderRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastVolumeRef = useRef<number>(settings.volume);

  const toggleDropdown = (key: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const closeDropdown = (key: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [key]: false
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
    value: AlertSettings[K]
  ) => onSettingsChange({ ...settings, [key]: value });

  const updateSoundSetting = (key: keyof AlertSettings['sounds'], value: string) => {
    onSettingsChange({
      ...settings,
      sounds: { ...settings.sounds, [key]: value }
    });
  };

  const handleVolumeChange = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    updateSetting('volume', Math.round(percentage));
  }, []);

  const handleVolumeSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    updateSetting('volume', newVolume);
  }, []);

  const handleVolumeChangeEnd = useCallback(() => {
    if (audioRef.current && Math.abs(settings.volume - lastVolumeRef.current) > 0) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
    lastVolumeRef.current = settings.volume;
    setIsDragging(false);
  }, [settings.volume]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { if (isDragging) handleVolumeChange(e.clientX); };
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

    if (soundUrl === stepaudio || soundUrl === kaching || soundUrl === 'Default') {
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

  const handleFileUpload = (soundType: keyof AlertSettings['sounds'], event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateSoundSetting(soundType, url);
      setOpenDropdowns(prev => ({ ...prev, [soundType]: false }));
    }
    event.target.value = '';
  };

  const selectSound = (soundType: keyof AlertSettings['sounds'], soundValue: string) => {
    updateSoundSetting(soundType, soundValue);
    setOpenDropdowns(prev => ({ ...prev, [soundType]: false }));
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
                <p className="alerts-description">Play sound alerts for Tokens in Terminal</p>
              </div>
              <div
                className={`toggle-switch ${settings.soundAlertsEnabled ? 'active' : ''}`}
                onClick={() => updateSetting('soundAlertsEnabled', !settings.soundAlertsEnabled)}
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

                <div className="meme-slider-container meme-slider-mode" style={{ position: 'relative' }}>
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
                  {(['newPairs', 'pairMigrating', 'migrated'] as const).map((key) => (
                    <div className="sound-option" key={key}>
                      <span className="sound-option-label">
                        {key === 'newPairs' ? 'New Pairs' : key === 'pairMigrating' ? 'Pair Migrating' : 'Migrated Sound'}
                      </span>
                      <div className="sound-controls">
                        <div className="sound-selector-dropdown">
                          <button
                            className="sound-selector"
                            onClick={() => toggleDropdown(key)}
                            onBlur={(e) => {
                              if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                                closeDropdown(key);
                              }
                            }}
                          >
                            <Volume2 size={14} />
                            <span>{getSoundDisplayName(settings.sounds[key])}</span>
                            <div className="sound-action-button-container">

                              <button className="sound-action-btn" onClick={(e) => { e.stopPropagation(); playSound(key); }} title="Play sound">

                                <Play size={14} />

                              </button>

                              <button className="sound-action-btn" onClick={(e) => { e.stopPropagation(); updateSoundSetting(key, stepaudio); }} title="Reset to default">

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
                  ))}
                </div>

                <p className="alerts-file-info">Maximum 5 seconds and 0.2MB file size</p>
              </div>
            </div>
          )}
          <button className="alerts-continue-btn" onClick={onClose}>Continue</button>

        </div>
      </div>
    </div>
  );
};

const ColorPicker: React.FC<{
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}> = ({ color, onChange, onClose }) => {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [hexInput, setHexInput] = useState(color);

  useEffect(() => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    setHue(Math.round(h * 360));
    setSaturation(Math.round(s * 100));
    setLightness(Math.round(l * 100));
    setHexInput(color);
  }, [color]);

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const updateColor = (newHue: number, newSat: number, newLight: number) => {
    const hex = hslToHex(newHue, newSat, newLight);
    onChange(hex);
    setHexInput(hex);
  };

  const handleHexChange = (hex: string) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) onChange(hex);
  };

  return (
    <div className="color-picker-overlay" onClick={onClose}>
      <div className="color-picker" onClick={(e) => e.stopPropagation()}>
        <div className="color-picker-header">
          <h4>Pick Color</h4>
          <button onClick={onClose}>×</button>
        </div>

        <div className="color-picker-content">
          <div className="color-preview" style={{ backgroundColor: color }} />

          <div className="color-slider-container">
            <label>Hue</label>
            <input
              type="range"
              min="0"
              max="360"
              value={hue}
              onChange={(e) => {
                const newHue = parseInt(e.target.value);
                setHue(newHue);
                updateColor(newHue, saturation, lightness);
              }}
              className="hue-slider"
            />
          </div>

          <div className="color-slider-container">
            <label>Saturation</label>
            <input
              type="range"
              min="0"
              max="100"
              value={saturation}
              onChange={(e) => {
                const newSat = parseInt(e.target.value);
                setSaturation(newSat);
                updateColor(hue, newSat, lightness);
              }}
              className="saturation-slider"
              style={{ background: `linear-gradient(to right, hsl(${hue}, 0%, ${lightness}%), hsl(${hue}, 100%, ${lightness}%))` }}
            />
          </div>

          <div className="color-slider-container">
            <label>Lightness</label>
            <input
              type="range"
              min="0"
              max="100"
              value={lightness}
              onChange={(e) => {
                const newLight = parseInt(e.target.value);
                setLightness(newLight);
                updateColor(hue, saturation, newLight);
              }}
              className="lightness-slider"
              style={{ background: `linear-gradient(to right, hsl(${hue}, ${saturation}%, 0%), hsl(${hue}, ${saturation}%, 50%), hsl(${hue}, ${saturation}%, 100%))` }}
            />
          </div>

          <div className="hex-input-container">
            <label>Hex</label>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => {
                setHexInput(e.target.value);
                if (e.target.value.length === 7) handleHexChange(e.target.value);
              }}
              className="hex-input"
              placeholder="#ffffff"
            />
          </div>

          <div className="preset-colors">
            <div className="preset-color-grid">
              {[
                '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
                '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
                '#ffc0cb', '#a52a2a', '#808080', '#add8e6', '#90ee90'
              ].map((preset) => (
                <button
                  key={preset}
                  className="preset-color"
                  style={{ backgroundColor: preset }}
                  onClick={() => onChange(preset)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DisplayDropdown: React.FC<{
  settings: DisplaySettings;
  onSettingsChange: (settings: DisplaySettings) => void;
}> = ({ settings, onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'layout' | 'metrics' | 'row' | 'extras'>('layout');
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setIsVisible(false);
          setTimeout(() => {
            setIsOpen(false);
          }, 200);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const updateSetting = <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) =>
    onSettingsChange({ ...settings, [key]: value });

  const [colorPickerOpen, setColorPickerOpen] = useState<{
    isOpen: boolean;
    metric: 'marketCap' | 'volume' | 'holders';
    range: 'range1' | 'range2' | 'range3';
  } | null>(null);

  const updateMetricColor = (
    metric: 'marketCap' | 'volume' | 'holders',
    range: 'range1' | 'range2' | 'range3',
    color: string
  ) => {
    onSettingsChange({
      ...settings,
      metricColors: {
        ...settings.metricColors,
        [metric]: {
          ...settings.metricColors?.[metric],
          [range]: color
        }
      }
    });
  };

  const updateRowSetting = (key: keyof DisplaySettings['visibleRows'], value: boolean) => {
    onSettingsChange({
      ...settings,
      visibleRows: { ...settings.visibleRows, [key]: value }
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
        <div className={`display-dropdown-content ${isVisible ? 'visible' : ''}`}>
          <div className="display-section">
            <h4 className="display-section-title">Metrics</h4>
            <div className="metrics-size-options">
              <button
                className={`small-size-option ${settings.metricSize === 'small' ? 'active' : ''}`}
                onClick={() => updateSetting('metricSize', 'small')}
              >
                MC 77K<br /><span className="size-label">Small</span>
              </button>
              <button
                className={`large-size-option ${settings.metricSize === 'large' ? 'active' : ''}`}
                onClick={() => updateSetting('metricSize', 'large')}
              >
                MC 77K<br /><span className="size-label">Large</span>
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
                <div className={`quickbuy-preview-button-small ${settings.quickBuyStyle === 'grey' ? 'grey-style' : ''}`}>
                  <img className="quickbuy-preview-button-lightning-small" src={lightning} alt="" />
                  7</div>
                Small
              </button>
              <button
                className={`quickbuy-option ${settings.quickBuySize === 'large' ? 'active' : ''}`}
                onClick={() => updateSetting('quickBuySize', 'large')}
              >
                <div className={`quickbuy-preview-button-large ${settings.quickBuyStyle === 'grey' ? 'grey-style' : ''}`}>
                  <img className="quickbuy-preview-button-lightning-large" src={lightning} alt="" />
                  7</div>
                Large
              </button>
              <button
                className={`quickbuy-option ${settings.quickBuySize === 'mega' ? 'active' : ''}`}
                onClick={() => updateSetting('quickBuySize', 'mega')}
              >
                <div className={`quickbuy-preview-button-mega ${settings.quickBuyStyle === 'grey' ? 'grey-style' : ''}`}>
                  <img className="quickbuy-preview-button-lightning-mega" src={lightning} alt="" />
                  7</div>
                Mega
              </button>
              <button
                className={`quickbuy-option ${settings.quickBuySize === 'ultra' ? 'active' : ''}`}
                onClick={() => updateSetting('quickBuySize', 'ultra')}
              >
                <div className={`quickbuy-preview-button-ultra ultra-${settings.ultraStyle} ultra-text-${settings.ultraColor}`}>
                  <img className="quickbuy-preview-button-lightning-ultra" src={lightning} alt="" />
                  7
                </div>
                Ultra
              </button>
            </div>

            {(settings.quickBuySize === 'small' || settings.quickBuySize === 'large' || settings.quickBuySize === 'mega') && (
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
                    <button className={`style-toggle-btn ${settings.ultraStyle === 'default' ? 'active' : ''}`} onClick={() => updateSetting('ultraStyle', 'default')}>Default</button>
                    <button className={`style-toggle-btn ${settings.ultraStyle === 'glowing' ? 'active' : ''}`} onClick={() => updateSetting('ultraStyle', 'glowing')}>Glowing</button>
                    <button className={`style-toggle-btn ${settings.ultraStyle === 'border' ? 'active' : ''}`} onClick={() => updateSetting('ultraStyle', 'border')}>Border</button>
                  </div>
                </div>
                <div className="style-toggle-row">
                  <span className="style-toggle-label">Text Color:</span>
                  <div className="style-toggle-buttons">
                    <button className={`style-toggle-btn ${settings.ultraColor === 'color' ? 'active' : ''}`} onClick={() => updateSetting('ultraColor', 'color')}>Color</button>
                    <button className={`style-toggle-btn ${settings.ultraColor === 'grey' ? 'active' : ''}`} onClick={() => updateSetting('ultraColor', 'grey')}>Grey</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="display-tabs">
            <button className={`display-tab ${activeTab === 'layout' ? 'active' : ''}`} onClick={() => setActiveTab('layout')}>Layout</button>
            <button className={`display-tab ${activeTab === 'metrics' ? 'active' : ''}`} onClick={() => setActiveTab('metrics')}>Metrics</button>
            <button className={`display-tab ${activeTab === 'row' ? 'active' : ''}`} onClick={() => setActiveTab('row')}>Row</button>
            <button className={`display-tab ${activeTab === 'extras' ? 'active' : ''}`} onClick={() => setActiveTab('extras')}>Extras</button>
          </div>

          <div className="display-content">
            {activeTab === 'layout' && (
              <div>
                <div className="display-toggles">
                  <div className="toggle-item">
                    <label className="toggle-label"><Hash size={16} />No Decimals</label>
                    <div className={`toggle-switch ${settings.noDecimals ? 'active' : ''}`} onClick={() => updateSetting('noDecimals', !settings.noDecimals)}>
                      <div className="toggle-slider" />
                    </div>
                  </div>

                  <div className="toggle-item">
                    <label className="toggle-label"><EyeOff size={16} />Hide Hidden Tokens</label>
                    <div className={`toggle-switch ${settings.hideHiddenTokens ? 'active' : ''}`} onClick={() => updateSetting('hideHiddenTokens', !settings.hideHiddenTokens)}>
                      <div className="toggle-slider" />
                    </div>
                  </div>

                  <div className="toggle-item">
                    <label className="toggle-label"><Image size={16} />Square Images</label>
                    <div className={`toggle-switch ${settings.squareImages ? 'active' : ''}`} onClick={() => updateSetting('squareImages', !settings.squareImages)}>
                      <div className="toggle-slider" />
                    </div>
                  </div>

                  <div className="toggle-item">
                    <label className="toggle-label"><BarChart3 size={16} />Progress Ring</label>
                    <div className={`toggle-switch ${settings.progressBar ? 'active' : ''}`} onClick={() => updateSetting('progressBar', !settings.progressBar)}>
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
                        ['kols', 'KOLs'],
                        ['top10Holders', 'Top 10 Holders'],
                        ['devHolding', 'Dev Holding'],
                        ['snipers', 'Snipers'],
                        ['insiders', 'Insiders'],
                      ] as Array<[keyof DisplaySettings['visibleRows'], string]>
                    ).map(([k, label]) => (
                      <div key={k} className={`row-toggle ${settings.visibleRows[k] ? 'active' : ''}`} onClick={() => updateRowSetting(k, !settings.visibleRows[k])}>
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
                  <div className="display-section" key={metric}>
                    <h4 className="display-section-title">
                      {metric === 'marketCap' ? 'Market Cap' : metric === 'volume' ? 'Volume' : 'Holders'}
                    </h4>
                    <div className="metric-color-options">
                      {(['range1', 'range2', 'range3'] as const).map((range, idx) => (
                        <div className="metric-color-option">
                          <div className="metric-color-item" key={range}>
                            <div className="metric-value">{metric === 'marketCap' ? (idx === 0 ? '30000' : idx === 1 ? '150000' : 'Above') : metric === 'volume' ? (idx === 0 ? '1000' : idx === 1 ? '2000' : 'Above') : (idx === 0 ? '10' : idx === 1 ? '50' : 'Above')}</div>
                            <div className="metric-color-controls">
                              <button
                                className="metric-color-square"
                                style={{ backgroundColor: (settings.metricColors as any)?.[metric]?.[range] || '#ffffff' }}
                                onClick={() => setColorPickerOpen({ isOpen: true, metric, range })}
                              />
                              <button
                                className="metric-reset-btn"
                                onClick={() => updateMetricColor(metric, range, metric === 'marketCap'
                                  ? (range === 'range1' ? '#d8dcff' : range === 'range2' ? '#eab308' : '#14b8a6')
                                  : '#ffffff'
                                )}
                              ><img src={reset} alt="Reset" className="reset-icon" /></button>
                            </div>
                          </div>
                          <div className="metric-range-label">
                            {metric === 'marketCap'
                              ? (idx === 0 ? '0 - 30K' : idx === 1 ? '30K - 150K' : '150K+')
                              : metric === 'volume'
                                ? (idx === 0 ? '0 - 1K' : idx === 1 ? '1K - 2K' : '2K+')
                                : (idx === 0 ? '0 - 10' : idx === 1 ? '10 - 50' : '50+')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {colorPickerOpen?.isOpen && (
                  <ColorPicker
                    color={(settings.metricColors as any)?.[colorPickerOpen.metric]?.[colorPickerOpen.range] || '#ffffff'}
                    onChange={(color) => updateMetricColor(colorPickerOpen.metric, colorPickerOpen.range, color)}
                    onClose={() => setColorPickerOpen(null)}
                  />
                )}
              </div>
            )}

            {activeTab === 'row' && (
              <div>
                <div className="display-section">
                  <div className="display-toggles">
                    <div className="toggle-item">
                      <label className="toggle-label"><BarChart3 size={16} />Color Rows</label>
                      <div className={`toggle-switch ${settings.colorRows ? 'active' : ''}`} onClick={() => updateSetting('colorRows', !settings.colorRows)}>
                        <div className="toggle-slider" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'extras' && (
              <div>
                <div className="display-section">
                  <h4 className="display-section-title">Table Layout</h4>
                  <div className="column-drag-container">
                    {safeOrder.map((column, index) => (
                      <div
                        key={column}
                        className="column-drag-item"
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        {column === 'new' ? 'New Pairs' :
                          column === 'graduating' ? 'Final Stretch' : 'Migrated'}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="display-section">
                  <h4 className="display-section-title">Click Quick Buy Behavior</h4>
                  <div className="quickbuy-behavior-options">
                    {(['nothing', 'openPage', 'openNewTab'] as const).map(mode => (
                      <div
                        key={mode}
                        className={`behavior-option ${settings.quickBuyClickBehavior === mode ? 'active' : ''}`}
                        onClick={() => updateSetting('quickBuyClickBehavior', mode)}
                      >
                        <span className="behavior-label">
                          {mode === 'nothing' ? 'Nothing' : mode === 'openPage' ? 'Open Page' : 'Open in New Tab'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="display-section">
                  <div className="toggle-item">
                    <label className="toggle-label">Second Quick Buy Button</label>
                    <div
                      className={`toggle-switch ${settings.secondQuickBuyEnabled ? 'active' : ''}`}
                      onClick={() => updateSetting('secondQuickBuyEnabled', !settings.secondQuickBuyEnabled)}
                    >
                      <div className="toggle-slider" />
                    </div>
                  </div>

                  {settings.secondQuickBuyEnabled && (
                    <div className="second-quickbuy-controls">
                      <div className="color-input-container">
                        <span className="color-label">Button Color:</span>
                        <input
                          type="color"
                          className="color-input"
                          value={settings.secondQuickBuyColor}
                          onChange={(e) => updateSetting('secondQuickBuyColor', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
    { key: 'graduating', label: 'Final Stretch', count: tokenCounts.graduating },
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

type State = {
  tokensByStatus: Record<Token['status'], Token[]>;
  hidden: Set<string>;
  loading: Set<string>;
};

type Action =
  | { type: 'INIT'; tokens: Token[] }
  | { type: 'ADD_MARKET'; token: Token }
  | { type: 'UPDATE_MARKET'; id: string; updates: Partial<Token> }
  | { type: 'HIDE_TOKEN'; id: string }
  | { type: 'SHOW_TOKEN'; id: string }
  | { type: 'SET_LOADING'; id: string; loading: boolean };

const initialState: State = {
  tokensByStatus: { new: [], graduating: [], graduated: [] },
  hidden: new Set(),
  loading: new Set(),
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT': {
      const buckets: State['tokensByStatus'] = { new: [], graduating: [], graduated: [] };
      action.tokens.forEach((t) => buckets[t.status].push(t));
      return { ...state, tokensByStatus: buckets };
    }
    case 'ADD_MARKET': {
      const { token } = action;
      const list = [token, ...state.tokensByStatus[token.status]].slice(0, MAX_PER_COLUMN);
      return { ...state, tokensByStatus: { ...state.tokensByStatus, [token.status]: list } };
    }
    case 'UPDATE_MARKET': {
      const buckets = { ...state.tokensByStatus };
      (Object.keys(buckets) as Token['status'][]).forEach((s) => {
        buckets[s] = buckets[s].map((t) => {
          if (t.id.toLowerCase() !== action.id.toLowerCase()) return t;
          const { volumeDelta = 0, ...rest } = action.updates;
          return { ...t, ...rest, volume24h: t.volume24h + volumeDelta };
        });
      });
      return { ...state, tokensByStatus: buckets };
    }
    case 'HIDE_TOKEN': {
      const h = new Set(state.hidden).add(action.id);
      return { ...state, hidden: h };
    }
    case 'SET_LOADING': {
      const l = new Set(state.loading);
      action.loading ? l.add(action.id) : l.delete(action.id);
      return { ...state, loading: l };
    }
    case 'SHOW_TOKEN': {
      const h = new Set(state.hidden);
      h.delete(action.id);
      return { ...state, hidden: h };
    }
    default:
      return state;
  }
}

const TokenRow = React.memo<{
  token: Token;
  quickbuyAmount: string;
  onHideToken: (tokenId: string) => void;
  onBlacklistToken: (token: Token) => void;
  isLoading: boolean;
  hoveredToken: string | null;
  hoveredImage: string | null;
  onTokenHover: (id: string) => void;
  onTokenLeave: () => void;
  onImageHover: (tokenId: string) => void;
  onImageLeave: () => void;
  onTokenClick: (token: Token) => void;
  onQuickBuy: (token: Token, amount: string) => void;
  onCopyToClipboard: (text: string) => void;
  displaySettings: DisplaySettings;
  isHidden: boolean;
}>((props) => {
  const {
    token,
    quickbuyAmount,
    onHideToken,
    onBlacklistToken,
    isLoading,
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
    isHidden
  } = props;

  const imageContainerRef = useRef<HTMLDivElement>(null);
  type CSSVars = React.CSSProperties & Record<string, string>;

  const bondingPercentage = useMemo(() => calculateBondingPercentage(token.marketCap), [token.marketCap]);
  const gradient = useMemo(
    () => createColorGradient(getBondingColor(bondingPercentage)),
    [bondingPercentage]
  );

  const imageStyle: CSSVars = {
    position: 'relative',
    '--progress-angle': `${(bondingPercentage / 100) * 360}deg`,
    '--progress-color-start': gradient.start,
    '--progress-color-mid': gradient.mid,
    '--progress-color-end': gradient.end,
  }; const progressLineStyle: CSSVars = {
    '--progress-percentage': `${bondingPercentage}%`,
    '--progress-color': getBondingColor(bondingPercentage),
  };

  const updatePreviewPosition = useCallback(() => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const previewWidth = 150;
    const previewHeight = 180;
    const offset = 12;

    let top = 0;
    let left = 0;
    let placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = viewportWidth - rect.right;
    const spaceLeft = rect.left;

    if (spaceBelow >= previewHeight + offset) {
      placement = 'bottom';
      top = rect.bottom + scrollY + offset;
      left = centerX + scrollX - previewWidth / 2;
    } else if (spaceAbove >= previewHeight + offset) {
      placement = 'top';
      top = rect.top + scrollY - previewHeight - offset;
      left = centerX + scrollX - previewWidth / 2;
    } else if (spaceRight >= previewWidth + offset) {
      placement = 'right';
      top = centerY + scrollY - previewHeight / 2;
      left = rect.right + scrollX + offset;
    } else if (spaceLeft >= previewWidth + offset) {
      placement = 'left';
      top = centerY + scrollY - previewHeight / 2;
      left = rect.left + scrollX - previewWidth - offset;
    } else {
      placement = 'bottom';
      top = rect.bottom + scrollY + offset;
      left = centerX + scrollX - previewWidth / 2;
    }

    if (left < scrollX + 10) left = scrollX + 10;
    else if (left + previewWidth > scrollX + viewportWidth - 10) left = scrollX + viewportWidth - previewWidth - 10;

    if (top < scrollY + 10) top = scrollY + 10;
    else if (top + previewHeight > scrollY + viewportHeight - 10) top = scrollY + viewportHeight - previewHeight - 10;
  }, []);

  useEffect(() => {
    if (hoveredImage === token.id) {
      updatePreviewPosition();

      const handleResize = () => updatePreviewPosition();
      window.addEventListener('scroll', updatePreviewPosition);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', updatePreviewPosition);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [hoveredImage, token.id, updatePreviewPosition]);

  const totalTraders = useMemo(() => token.holders + token.proTraders + token.kolTraders, [token.holders, token.proTraders, token.kolTraders]);

  const showBonding = (token.status === 'new' || token.status === 'graduating') && hoveredToken === token.id;

  const totalTransactions = token.buyTransactions + token.sellTransactions;
  const buyPct = useMemo(() => (totalTransactions === 0 ? 0 : (token.buyTransactions / totalTransactions) * 100), [token.buyTransactions, totalTransactions]);
  const sellPct = useMemo(() => (totalTransactions === 0 ? 0 : (token.sellTransactions / totalTransactions) * 100), [token.sellTransactions, totalTransactions]);

  const metricInfo = hasMetricColoring(displaySettings) ? getMetricColorClass(token, displaySettings) : null;
  const cssVariables: CSSVars = metricInfo
    ? { [`--metric-${metricInfo.class}`]: metricInfo.color }
    : {};

  return (
    <div
      className={`explorer-token-row ${isHidden ? 'hidden-token' : ''} ${displaySettings.colorRows && token.status !== 'graduated'
        ? `colored-row ${getBondingColorClass(bondingPercentage)}`
        : ''} ${metricInfo ? `metric-colored ${metricInfo.class}` : ''} ${token.status === 'graduated' ? 'graduated' : ''}`}
      style={cssVariables}
      onMouseEnter={() => onTokenHover(token.id)}
      onMouseLeave={onTokenLeave}
      onClick={() => onTokenClick(token)}
    >
      <div className="explorer-token-actions">
        <Tooltip content={isHidden ? "Show Token" : "Hide Token"}>
          <button
            className="explorer-hide-button"
            onClick={(e) => { e.stopPropagation(); onHideToken(token.id); }}
            title={isHidden ? "Show token" : "Hide token"}
          >
            {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </Tooltip>

        <Tooltip content="Blacklist Dev">
          <button
            className="explorer-blacklist-button"
            onClick={(e) => { e.stopPropagation(); onBlacklistToken(token); }}
            title="Blacklist dev"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 30 30"
              fill="rgba(255, 255, 255, 0.9)"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
            </svg>                </button>
        </Tooltip>
      </div>
      <div className={`bonding-amount-display ${showBonding ? 'visible' : ''}`} style={{ color: getBondingColor(bondingPercentage) }}>
        BONDING: {bondingPercentage.toFixed(1)}%
      </div>

      <div className="explorer-token-left">
        <div
          ref={imageContainerRef}
          className={`explorer-token-image-container ${token.status === 'graduated' ? 'graduated' : ''} ${!displaySettings.squareImages ? 'circle-mode' : ''} ${!displaySettings.progressBar ? 'no-progress-ring' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            window.open(
              `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(token.image)}`,
              '_blank',
              'noopener,noreferrer'
            )
          }}
          onMouseEnter={() => onImageHover(token.id)}
          onMouseLeave={onImageLeave}
          style={token.status === 'graduated' || !displaySettings.progressBar
            ? { position: 'relative' }
            : imageStyle}
        >
          <div className={`explorer-progress-spacer ${!displaySettings.squareImages ? 'circle-mode' : ''}`}>
            <div className={`explorer-image-wrapper ${!displaySettings.squareImages ? 'circle-mode' : ''}`}>
              <img src={token.image} alt={token.name} className={`explorer-token-image ${!displaySettings.squareImages ? 'circle-mode' : ''}`} />
              <div className={`explorer-image-overlay ${!displaySettings.squareImages ? 'circle-mode' : ''}`}>
                <img className="camera-icon" src={camera} alt="inspect" />
              </div>
            </div>
          </div>
        </div>

        {!displaySettings.progressBar && token.status !== 'graduated' && (
          <div
            className="explorer-progress-line"
            style={progressLineStyle}
          >
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
              <div className="explorer-token-name-container">
                <p
                  className="explorer-token-name"
                  onClick={(e) => { e.stopPropagation(); onCopyToClipboard(token.tokenAddress); }}
                  style={{ cursor: 'pointer' }}
                  title="Click to copy token address"
                >
                  {token.name}
                </p>
                <button
                  className="explorer-copy-btn"
                  onClick={(e) => { e.stopPropagation(); onCopyToClipboard(token.tokenAddress); }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="explorer-second-row">
            <div className="explorer-price-section">
              <span className="explorer-time-created">{formatTimeAgo(token.created)}</span>

              {displaySettings.visibleRows.socials && (
                <>
                  {!!token.twitterHandle && (
                    <a
                      className="explorer-twitter-btn"
                      href={token.twitterHandle}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}

                  {!!token.website && (
                    <a
                      className="explorer-twitter-btn"
                      href={token.website}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
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
                      onClick={e => e.stopPropagation()}
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
                      onClick={e => e.stopPropagation()}
                    >
                      <img src={discord} />
                    </a>
                  )}

                  <a
                    className="explorer-telegram-btn"
                    href={`https://twitter.com/search?q=${token.tokenAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
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
                    </svg>                    <span className="explorer-stat-value">{totalTraders.toLocaleString()}</span>
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
                    </svg>                    <span className="explorer-stat-value">{token.proTraders.toLocaleString()}</span>
                  </div>
                </Tooltip>
              )}

              {displaySettings.visibleRows.kols && (
                <Tooltip content="KOLs">
                  <div className="explorer-stat-item">
                    <svg
                      className="traders-icon"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 2 3 L 2 4 C 2 6.7666667 3.1395226 8.7620178 4.1679688 10.304688 C 5.1964149 11.847357 6 12.944444 6 14 L 8 14 C 8 13.983831 7.9962584 13.96922 7.9960938 13.953125 C 8.97458 16.166161 10 17 10 17 L 14 17 C 14 17 15.02542 16.166161 16.003906 13.953125 C 16.003742 13.96922 16 13.983831 16 14 L 18 14 C 18 12.944444 18.803585 11.847356 19.832031 10.304688 C 20.860477 8.7620178 22 6.7666667 22 4 L 22 3 L 2 3 z M 4.1914062 5 L 6.2734375 5 C 6.337283 7.4080712 6.6187571 9.3802374 7.0078125 10.974609 C 6.6365749 10.366787 6.2230927 9.7819045 5.8320312 9.1953125 C 5.0286664 7.9902652 4.4191868 6.6549795 4.1914062 5 z M 8.3027344 5 L 15.697266 5 L 15.697266 6 L 15.693359 6 C 15.380359 11.398 13.843047 14.041 13.123047 15 L 10.882812 15 C 10.142812 14.016 8.6176406 11.371 8.3066406 6 L 8.3027344 6 L 8.3027344 5 z M 17.726562 5 L 19.808594 5 C 19.580813 6.6549795 18.971334 7.9902652 18.167969 9.1953125 C 17.776907 9.7819045 17.363425 10.366787 16.992188 10.974609 C 17.381243 9.3802374 17.662717 7.4080712 17.726562 5 z M 7 19 L 7 21 L 17 21 L 17 19 L 7 19 z" />
                    </svg>                    <span className="explorer-stat-value">{token.kolTraders.toLocaleString()}</span>
                  </div>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        <div className="explorer-holdings-section">
          {displaySettings.visibleRows.snipers && (
            <Tooltip content="Sniper Holding">
              <div className="explorer-holding-item">
                <svg
                  className="sniper-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={token.sniperHolding > 5 ? "#eb7070ff" : "rgb(67, 254, 154)"}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 11.244141 2.0019531 L 11.244141 2.7519531 L 11.244141 3.1542969 C 6.9115518 3.5321749 3.524065 6.919829 3.1445312 11.251953 L 2.7421875 11.251953 L 1.9921875 11.251953 L 1.9921875 12.751953 L 2.7421875 12.751953 L 3.1445312 12.751953 C 3.5225907 17.085781 6.9110367 20.473593 11.244141 20.851562 L 11.244141 21.253906 L 11.244141 22.003906 L 12.744141 22.003906 L 12.744141 21.253906 L 12.744141 20.851562 C 17.076343 20.47195 20.463928 17.083895 20.841797 12.751953 L 21.244141 12.751953 L 21.994141 12.751953 L 21.994141 11.251953 L 21.244141 11.251953 L 20.841797 11.251953 C 20.462285 6.9209126 17.074458 3.5337191 12.744141 3.1542969 L 12.744141 2.7519531 L 12.744141 2.0019531 L 11.244141 2.0019531 z M 11.244141 4.6523438 L 11.244141 8.0742188 C 9.6430468 8.3817751 8.3759724 9.6507475 8.0683594 11.251953 L 4.6425781 11.251953 C 5.0091295 7.7343248 7.7260437 5.0173387 11.244141 4.6523438 z M 12.744141 4.6523438 C 16.25959 5.0189905 18.975147 7.7358303 19.341797 11.251953 L 15.917969 11.251953 C 15.610766 9.6510551 14.344012 8.3831177 12.744141 8.0742188 L 12.744141 4.6523438 z M 11.992188 9.4980469 C 13.371637 9.4980469 14.481489 10.6041 14.492188 11.982422 L 14.492188 12.021484 C 14.481501 13.40006 13.372858 14.503906 11.992188 14.503906 C 10.606048 14.503906 9.4921875 13.389599 9.4921875 12.001953 C 9.4921875 10.614029 10.60482 9.4980469 11.992188 9.4980469 z M 4.6425781 12.751953 L 8.0683594 12.751953 C 8.3760866 14.352973 9.6433875 15.620527 11.244141 15.927734 L 11.244141 19.353516 C 7.7258668 18.988181 5.0077831 16.270941 4.6425781 12.751953 z M 15.917969 12.751953 L 19.34375 12.751953 C 18.97855 16.26893 16.261295 18.986659 12.744141 19.353516 L 12.744141 15.927734 C 14.344596 15.619809 15.610176 14.35218 15.917969 12.751953 z" />
                </svg>                <span className="explorer-holding-value" style={{ color: token.sniperHolding > 5 ? "#eb7070ff" : "rgb(67, 254, 154)" }}>
                  {token.sniperHolding.toFixed(1)}%
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
                  fill={token.devHolding > 5 ? "#eb7070ff" : "rgb(67, 254, 154)"}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
                </svg>                <span className="explorer-holding-value" style={{ color: token.devHolding > 5 ? "#eb7070ff" : "rgb(67, 254, 154)" }}>
                  {token.devHolding.toFixed(1)}%
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
                  fill={token.insiderHolding > 5 ? "#eb7070ff" : "rgb(67, 254, 154)"}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 16 3 C 14.0625 3 12.570313 3.507813 11.5 4.34375 C 10.429688 5.179688 9.8125 6.304688 9.375 7.34375 C 8.9375 8.382813 8.65625 9.378906 8.375 10.09375 C 8.09375 10.808594 7.859375 11.085938 7.65625 11.15625 C 4.828125 12.160156 3 14.863281 3 18 L 3 19 L 4 19 C 5.347656 19 6.003906 19.28125 6.3125 19.53125 C 6.621094 19.78125 6.742188 20.066406 6.8125 20.5625 C 6.882813 21.058594 6.847656 21.664063 6.9375 22.34375 C 6.984375 22.683594 7.054688 23.066406 7.28125 23.4375 C 7.507813 23.808594 7.917969 24.128906 8.375 24.28125 C 9.433594 24.632813 10.113281 24.855469 10.53125 25.09375 C 10.949219 25.332031 11.199219 25.546875 11.53125 26.25 C 11.847656 26.917969 12.273438 27.648438 13.03125 28.1875 C 13.789063 28.726563 14.808594 29.015625 16.09375 29 C 18.195313 28.972656 19.449219 27.886719 20.09375 26.9375 C 20.417969 26.460938 20.644531 26.050781 20.84375 25.78125 C 21.042969 25.511719 21.164063 25.40625 21.375 25.34375 C 22.730469 24.9375 23.605469 24.25 24.09375 23.46875 C 24.582031 22.6875 24.675781 21.921875 24.8125 21.40625 C 24.949219 20.890625 25.046875 20.6875 25.375 20.46875 C 25.703125 20.25 26.453125 20 28 20 L 29 20 L 29 19 C 29 17.621094 29.046875 16.015625 28.4375 14.5 C 27.828125 12.984375 26.441406 11.644531 24.15625 11.125 C 24.132813 11.121094 24.105469 11.132813 24 11 C 23.894531 10.867188 23.734375 10.601563 23.59375 10.25 C 23.3125 9.550781 23.042969 8.527344 22.59375 7.46875 C 22.144531 6.410156 21.503906 5.269531 20.4375 4.40625 C 19.371094 3.542969 17.90625 3 16 3 Z M 16 5 C 17.539063 5 18.480469 5.394531 19.1875 5.96875 C 19.894531 6.542969 20.367188 7.347656 20.75 8.25 C 21.132813 9.152344 21.402344 10.128906 21.75 11 C 21.921875 11.433594 22.109375 11.839844 22.40625 12.21875 C 22.703125 12.597656 23.136719 12.96875 23.6875 13.09375 C 25.488281 13.503906 26.15625 14.242188 26.5625 15.25 C 26.871094 16.015625 26.878906 17.066406 26.90625 18.09375 C 25.796875 18.1875 24.886719 18.386719 24.25 18.8125 C 23.40625 19.378906 23.050781 20.25 22.875 20.90625 C 22.699219 21.5625 22.632813 22.042969 22.40625 22.40625 C 22.179688 22.769531 21.808594 23.128906 20.78125 23.4375 C 20.070313 23.652344 19.558594 24.140625 19.21875 24.59375 C 18.878906 25.046875 18.675781 25.460938 18.4375 25.8125 C 17.960938 26.515625 17.617188 26.980469 16.0625 27 C 15.078125 27.011719 14.550781 26.820313 14.1875 26.5625 C 13.824219 26.304688 13.558594 25.929688 13.3125 25.40625 C 12.867188 24.460938 12.269531 23.765625 11.53125 23.34375 C 10.792969 22.921875 10.023438 22.714844 9 22.375 C 8.992188 22.359375 8.933594 22.285156 8.90625 22.09375 C 8.855469 21.710938 8.886719 21.035156 8.78125 20.28125 C 8.675781 19.527344 8.367188 18.613281 7.5625 17.96875 C 7 17.515625 6.195313 17.289063 5.25 17.15625 C 5.542969 15.230469 6.554688 13.65625 8.3125 13.03125 C 9.375 12.65625 9.898438 11.730469 10.25 10.84375 C 10.601563 9.957031 10.851563 8.96875 11.21875 8.09375 C 11.585938 7.21875 12.019531 6.480469 12.71875 5.9375 C 13.417969 5.394531 14.402344 5 16 5 Z M 13 9 C 12.449219 9 12 9.671875 12 10.5 C 12 11.328125 12.449219 12 13 12 C 13.550781 12 14 11.328125 14 10.5 C 14 9.671875 13.550781 9 13 9 Z M 17 9 C 16.449219 9 16 9.671875 16 10.5 C 16 11.328125 16.449219 12 17 12 C 17.550781 12 18 11.328125 18 10.5 C 18 9.671875 17.550781 9 17 9 Z" />
                </svg>                <span className="explorer-holding-value" style={{ color: token.insiderHolding > 5 ? "#eb7070ff" : "rgb(67, 254, 154)" }}>
                  {token.insiderHolding.toFixed(1)}%
                </span>
              </div>
            </Tooltip>
          )}

          {displaySettings.visibleRows.top10Holders && (
            <Tooltip content="Top 10 holders percentage">
              <div className="explorer-holding-item">
                <svg
                  className="holding-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 32 32"
                  fill={token.top10Holding > 5 ? "#eb7070ff" : "rgb(67, 254, 154)"}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 15 4 L 15 6 L 13 6 L 13 8 L 15 8 L 15 9.1875 C 14.011719 9.554688 13.25 10.433594 13.0625 11.5 C 12.277344 11.164063 11.40625 11 10.5 11 C 6.921875 11 4 13.921875 4 17.5 C 4 19.792969 5.199219 21.8125 7 22.96875 L 7 27 L 25 27 L 25 22.96875 C 26.800781 21.8125 28 19.792969 28 17.5 C 28 13.921875 25.078125 11 21.5 11 C 20.59375 11 19.722656 11.164063 18.9375 11.5 C 18.75 10.433594 17.988281 9.554688 17 9.1875 L 17 8 L 19 8 L 19 6 L 17 6 L 17 4 Z M 16 11 C 16.5625 11 17 11.4375 17 12 C 17 12.5625 16.5625 13 16 13 C 15.4375 13 15 12.5625 15 12 C 15 11.4375 15.4375 11 16 11 Z M 10.5 13 C 12.996094 13 15 15.003906 15 17.5 L 15 22 L 10.5 22 C 8.003906 22 6 19.996094 6 17.5 C 6 15.003906 8.003906 13 10.5 13 Z M 21.5 13 C 23.996094 13 26 15.003906 26 17.5 C 26 19.996094 23.996094 22 21.5 22 L 17 22 L 17 17.5 C 17 15.003906 19.003906 13 21.5 13 Z M 9 24 L 23 24 L 23 25 L 9 25 Z" />
                </svg>                <span className="explorer-holding-value" style={{ color: token.top10Holding > 5 ? "#eb7070ff" : "rgb(67, 254, 154)" }}>
                  {token.top10Holding.toFixed(1)}%
                </span>
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      <div
        className={`explorer-third-row metrics-size-${displaySettings.metricSize} ${displaySettings.quickBuySize === 'large' ? 'large-quickbuy-mode' : ''} ${displaySettings.quickBuySize === 'mega' ? 'mega-quickbuy-mode' : ''} ${displaySettings.quickBuySize === 'ultra' ? `ultra-quickbuy-mode ultra-${displaySettings.ultraStyle} ultra-text-${displaySettings.ultraColor}` : ''}`}
        onClick={displaySettings.quickBuySize === 'ultra' ? (e) => { e.stopPropagation(); onQuickBuy(token, quickbuyAmount); } : undefined}
      >
        <div className="explorer-metrics-container">
          {displaySettings.visibleRows.marketCap && (
            <Tooltip content="Market Cap">
              <div className="explorer-market-cap">
                <span className="mc-label">MC</span>
                <span className="explorer-market-cap">{formatPrice(token.marketCap, displaySettings.noDecimals)}</span>
              </div>
            </Tooltip>
          )}

          {displaySettings.visibleRows.volume && (
            <Tooltip content="Volume">
              <div className="explorer-volume">
                <span className="mc-label">V</span>
                <span className="mc-value">{formatPrice(token.volume24h, displaySettings.noDecimals)}</span>
              </div>
            </Tooltip>
          )}
        </div>

        <div className="explorer-third-row-section">
          {displaySettings.visibleRows.fees && (
            <Tooltip content="Global Fees Paid">
              <div className="explorer-stat-item">
                <span className="explorer-fee-label">F</span>
                <img className="explorer-fee-icon" src={monadicon} alt="fee" />
                <span className="explorer-fee-total">{token.globalFeesPaid}</span>
              </div>
            </Tooltip>
          )}

          {displaySettings.visibleRows.tx && (
            <Tooltip content="Transactions">
              <div className="explorer-tx-bar">
                <div className="explorer-tx-header">
                  <span className="explorer-tx-label">TX</span>
                  <span className="explorer-tx-total">{totalTransactions.toLocaleString()}</span>
                </div>
                <div className="explorer-tx-visual-bar">
                  {totalTransactions === 0 ? (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#252526ff', borderRadius: '1px' }} />
                  ) : (
                    <>
                      <div className="explorer-tx-buy-portion" style={{ width: `${buyPct}%` }} />
                      <div className="explorer-tx-sell-portion" style={{ width: `${sellPct}%` }} />
                    </>
                  )}
                </div>
              </div>
            </Tooltip>
          )}
        </div>

        <div className={`explorer-actions-section ${displaySettings.quickBuySize === 'ultra' ? 'ultra-mode' : ''}`}>
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
                  if (displaySettings.quickBuySize !== 'ultra') {
                    e.stopPropagation();

                    if (displaySettings.quickBuyClickBehavior === 'openPage') {
                      onTokenClick(token);
                    } else if (displaySettings.quickBuyClickBehavior === 'openNewTab') {
                      window.open(`/meme/${token.tokenAddress}`, '_blank');
                    } else {
                      onQuickBuy(token, quickbuyAmount);
                    }
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="quickbuy-loading-spinner" />
                ) : (
                  <>
                    <img className="explorer-quick-buy-icon" src={lightning} alt="⚡" />
                    {quickbuyAmount} MON
                  </>
                )}
              </button>
            );
          })()}

          {displaySettings.secondQuickBuyEnabled && displaySettings.quickBuySize !== 'ultra' && (
            <button
              className={`explorer-quick-buy-btn second-button size-${displaySettings.quickBuySize} style-${displaySettings.quickBuyStyle}`}
              style={{ ['--second-quickbuy-color' as any]: displaySettings.secondQuickBuyColor }}
              onClick={(e) => {
                e.stopPropagation();
                onQuickBuy(token, quickbuyAmount);
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="quickbuy-loading-spinner" />
              ) : (
                <>
                  <img className="explorer-quick-buy-icon" src={lightning} alt="⚡" />
                  {quickbuyAmount} MON
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div >
  );
});

const TokenExplorer: React.FC<TokenExplorerProps> = ({
  appliedFilters,
  activeFilterTab,
  onOpenFiltersForColumn,
  sendUserOperationAsync,
}) => {
  const navigate = useNavigate();
  const activechain =
    (appSettings as any).activechain ??
    (Object.keys(appSettings.chainConfig)[0] as keyof typeof appSettings.chainConfig);
  const routerAddress = appSettings.chainConfig[activechain].launchpadRouter.toLowerCase();

  const [{ tokensByStatus, hidden, loading }, dispatch] = useReducer(reducer, initialState);
  const [activeMobileTab, setActiveMobileTab] = useState<Token['status']>('new');
  const [pausedColumn, setPausedColumn] = useState<Token['status'] | null>(null);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(() => {
    const saved = localStorage.getItem('explorer-display-settings');
    if (!saved) return DISPLAY_DEFAULTS;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...DISPLAY_DEFAULTS,
        ...parsed,
        columnOrder: Array.isArray(parsed?.columnOrder) && parsed.columnOrder.length
          ? parsed.columnOrder
          : DISPLAY_DEFAULTS.columnOrder,
        visibleRows: { ...DISPLAY_DEFAULTS.visibleRows, ...(parsed?.visibleRows || {}) },
        metricColors: {
          marketCap: { ...DISPLAY_DEFAULTS.metricColors.marketCap, ...(parsed?.metricColors?.marketCap || {}) },
          volume: { ...DISPLAY_DEFAULTS.metricColors.volume, ...(parsed?.metricColors?.volume || {}) },
          holders: { ...DISPLAY_DEFAULTS.metricColors.holders, ...(parsed?.metricColors?.holders || {}) },
        },
      };
    } catch {
      return DISPLAY_DEFAULTS;
    }
  });
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const [alertSettings, setAlertSettings] = useState<AlertSettings>(() => {
    const saved = localStorage.getItem('explorer-alert-settings');
    if (!saved) return ALERT_DEFAULTS;
    try {
      const parsed = JSON.parse(saved);
      return { ...ALERT_DEFAULTS, ...parsed, sounds: { ...ALERT_DEFAULTS.sounds, ...(parsed?.sounds || {}) } };
    } catch {
      return ALERT_DEFAULTS;
    }
  });
  const [blacklistSettings, setBlacklistSettings] = useState<BlacklistSettings>(() => {
    const saved = localStorage.getItem('explorer-blacklist-settings');
    if (!saved) return BLACKLIST_DEFAULTS;
    try {
      const parsed = JSON.parse(saved);
      return { ...BLACKLIST_DEFAULTS, ...parsed, items: Array.isArray(parsed?.items) ? parsed.items : [] };
    } catch {
      return BLACKLIST_DEFAULTS;
    }
  });
  const [showAlertsPopup, setShowAlertsPopup] = useState(false);
  const [showBlacklistPopup, setShowBlacklistPopup] = useState(false);
    const [quickAmounts, setQuickAmounts] = useState<Record<Token['status'], string>>(() => ({
    new: localStorage.getItem('explorer-quickbuy-new') ?? '0',
    graduating: localStorage.getItem('explorer-quickbuy-graduating') ?? '0',
    graduated: localStorage.getItem('explorer-quickbuy-graduated') ?? '0',
  }));
  const [activePresets, setActivePresets] = useState<Record<Token['status'], number>>(() => ({
    new: parseInt(localStorage.getItem('explorer-preset-new') ?? '1'),
    graduating: parseInt(localStorage.getItem('explorer-preset-graduating') ?? '1'),
    graduated: parseInt(localStorage.getItem('explorer-preset-graduated') ?? '1'),
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('explorer-display-settings', JSON.stringify(displaySettings)); }, [displaySettings]);
  useEffect(() => { localStorage.setItem('explorer-alert-settings', JSON.stringify(alertSettings)); }, [alertSettings]);
  useEffect(() => { localStorage.setItem('explorer-blacklist-settings', JSON.stringify(blacklistSettings)); }, [blacklistSettings]);

  const setQuickAmount = useCallback((s: Token['status'], v: string) => {
    const clean = v.replace(/[^0-9.]/g, '');
    setQuickAmounts((p) => ({ ...p, [s]: clean }));
    localStorage.setItem(`explorer-quickbuy-${s}`, clean);
  }, []);

  const setActivePreset = useCallback((status: Token['status'], preset: number) => {
    setActivePresets((p) => ({ ...p, [status]: preset }));
    localStorage.setItem(`explorer-preset-${status}`, preset.toString());
  }, []);

  const wsRef = useRef<WebSocket | null>(null);
  const subIdRef = useRef(1);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const trackedMarketsRef = useRef<Set<string>>(new Set());
  const connectionStateRef = useRef<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const retryCountRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const connectionAttemptsRef = useRef(0);
  const lastConnectionAttemptRef = useRef(0);
  const consecutiveFailuresRef = useRef(0);

  const scheduleReconnect = useCallback((initialMarkets: string[]) => {
    if (connectionStateRef.current === 'connecting' || connectionStateRef.current === 'connected') return;
    
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
    
    if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
    
    connectionStateRef.current = 'reconnecting';
    reconnectTimerRef.current = window.setTimeout(() => {
      openWebsocket(initialMarkets);
    }, delay);
  }, []);

  const handleTokenHover = useCallback((id: string) => setHoveredToken(id), []);
  const handleTokenLeave = useCallback(() => setHoveredToken(null), []);
  const handleImageHover = useCallback((id: string) => setHoveredImage(id), []);
  const handleImageLeave = useCallback(() => setHoveredImage(null), []);
  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => { if (e.target.value === '0') e.target.select(); }, []);

  const subscribe = useCallback((ws: WebSocket, params: any, onAck?: (subId: string) => void) => {
    const reqId = subIdRef.current++;
    ws.send(JSON.stringify({ id: reqId, jsonrpc: '2.0', method: 'eth_subscribe', params }));
    if (!onAck) return;
    const handler = (evt: MessageEvent) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === reqId && msg.result) {
        onAck(msg.result);
        ws.removeEventListener('message', handler);
      }
    };
    ws.addEventListener('message', handler);
  }, []);

  const addMarket = useCallback(async (log: any) => {
    if (pausedColumn !== null) {
      return;
    }
    const { args } = decodeEventLog({ abi: CrystalRouterAbi, data: log.data, topics: log.topics }) as any

    let meta: any = {};
    try {
      const res = await fetch(args.metadataCID);
      if (res.ok) meta = await res.json();
    } catch (e) {
      console.warn('failed to load metadata', e);
    }

    const socials = [args.social1, args.social2, args.social3].map(s => s ? (/^https?:\/\//.test(s) ? s : `https://${s}`) : s)
    const twitter = socials.find(s => s?.startsWith("https://x.com") || s?.startsWith("https://twitter.com"))
    if (twitter) { socials.splice(socials.indexOf(twitter), 1) }
    const telegram = socials.find(s => s?.startsWith("https://t.me"))
    if (telegram) { socials.splice(socials.indexOf(telegram), 1) }
    const discord = socials.find(s => s?.startsWith("https://discord.gg") || s?.startsWith("https://discord.com"))
    if (discord) { socials.splice(socials.indexOf(discord), 1) }

    const token: Token = {
      ...defaultMetrics,
      id: args.token,
      tokenAddress: args.token,
      name: args.name,
      symbol: args.symbol,
      image: meta?.image ?? '',
      description: args.description ?? '',
      twitterHandle: twitter ?? '',
      website: meta?.website ?? '',
      status: 'new',
      marketCap: defaultMetrics.price * TOTAL_SUPPLY,
      created: Math.floor(Date.now() / 1000),
      volumeDelta: 0,
      telegramHandle: telegram ?? '',
      discordHandle: discord ?? '',
      dev: args.creator,
    };

    dispatch({ type: 'ADD_MARKET', token });

    if (alertSettings.soundAlertsEnabled) {
      try {
        const audio = new Audio(alertSettings.sounds.newPairs);
        audio.volume = alertSettings.volume / 100;
        audio.play().catch(console.error);
      } catch (error) {
        console.error('Failed to play new pairs sound:', error);
      }
    }
  }, [subscribe, alertSettings.soundAlertsEnabled, alertSettings.sounds.newPairs, alertSettings.volume, pausedColumn]);

  const updateMarket = useCallback((log: any) => {
    if (log.topics?.[0] !== MARKET_UPDATE_EVENT) return;
    if (pausedColumn !== null) return;

    const tokenAddr = (`0x${log.topics[1].slice(26)}`).toLowerCase();

    const hex = log.data.replace(/^0x/, '');
    const words: string[] = [];
    for (let i = 0; i < hex.length; i += 64) words.push(hex.slice(i, i + 64));

    const amounts = BigInt('0x' + words[0]);
    const isBuy = BigInt('0x' + words[1]);
    const priceRaw = BigInt('0x' + words[2]);
    const counts = BigInt('0x' + words[3]);

    const priceEth = Number(priceRaw) / 1e18;
    const buys = Number(counts >> 128n);
    const sells = Number(counts & ((1n << 128n) - 1n));
    const amountIn = Number(amounts >> 128n);
    const amountOut = Number(amounts & ((1n << 128n) - 1n));

    dispatch({
      type: 'UPDATE_MARKET',
      id: tokenAddr,
      updates: {
        price: priceEth,
        marketCap: priceEth * TOTAL_SUPPLY,
        buyTransactions: buys,
        sellTransactions: sells,
        volumeDelta: isBuy > 0 ? amountIn / 1e18 : amountOut / 1e18,
      },
    });
  }, [pausedColumn]);

  const handleColumnHover = useCallback((columnType: Token['status']) => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    setPausedColumn(columnType);
  }, []);

  const openWebsocket = useCallback((initialMarkets: string[]): void => {
    if (connectionStateRef.current === 'connecting' || connectionStateRef.current === 'connected') {
      return;
    }
    
    initialMarkets.forEach(addr => trackedMarketsRef.current.add(addr.toLowerCase()));
    lastConnectionAttemptRef.current = Date.now();
    connectionAttemptsRef.current += 1;
    
    if (wsRef.current) {
      const oldWs = wsRef.current;
      wsRef.current = null;
      
      oldWs.onopen = null;
      oldWs.onmessage = null;
      oldWs.onerror = null;
      oldWs.onclose = null;
      
      if (oldWs.readyState === WebSocket.OPEN || oldWs.readyState === WebSocket.CONNECTING) {
        oldWs.close(1000, 'reconnecting');
      }
    }

    connectionStateRef.current = 'connecting';

    try {
      const ws = new WebSocket(appSettings.chainConfig[activechain].wssurl);
      wsRef.current = ws;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close(1000, 'connection timeout');
          handleConnectionError('timeout');
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        connectionStateRef.current = 'connected';
        retryCountRef.current = 0;
        consecutiveFailuresRef.current = 0;

        subscribe(ws, ['logs', { address: routerAddress, topics: [[ROUTER_EVENT]] }]);
        subscribe(ws, ['logs', { address: routerAddress, topics: [[MARKET_UPDATE_EVENT]] }]);
      };

      ws.onmessage = ({ data }) => {
        try {
          const msg = JSON.parse(data);
          console.log(msg);
          if (msg.method !== 'eth_subscription' || !msg.params?.result) return;
          const log = msg.params.result;
          if (log.topics?.[0] === ROUTER_EVENT) addMarket(log);
          else if (log.topics?.[0] === MARKET_UPDATE_EVENT) updateMarket(log);
        } catch (parseError) {
          console.warn('Failed to parse WebSocket message:', parseError);
        }
      };

      ws.onerror = (event) => {
        clearTimeout(connectionTimeout);
        console.warn('WebSocket error:', event);
        handleConnectionError('error');
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        connectionStateRef.current = 'disconnected';
        
        const isNormalClose = event.code === 1000;
        const isServerError = event.code >= 1011 && event.code <= 1014;
        const isNetworkError = event.code === 1006;
        
        if (!isNormalClose) {
          consecutiveFailuresRef.current += 1;
          retryCountRef.current += 1;
          
          console.warn(`WebSocket closed (${event.code}): ${event.reason || 'No reason'}`);
          
          if (isServerError && consecutiveFailuresRef.current > 3) {
            retryCountRef.current += 2;
          } else if (isNetworkError && consecutiveFailuresRef.current > 2) {
            retryCountRef.current += 1;
          }
          
          const markets = [
            ...tokensByStatus.new,
            ...tokensByStatus.graduating,
            ...tokensByStatus.graduated,
          ].map(t => t.id);
          
          scheduleReconnect(markets.length ? markets : Array.from(trackedMarketsRef.current));
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      handleConnectionError('creation');
    }
  }, [routerAddress, subscribe, addMarket, updateMarket, tokensByStatus, scheduleReconnect]);

  const handleConnectionError = useCallback((errorType: string) => {
    connectionStateRef.current = 'disconnected';
    consecutiveFailuresRef.current += 1;
    retryCountRef.current += 1;
    
    const markets = Array.from(trackedMarketsRef.current);
    scheduleReconnect(markets);
  }, [scheduleReconnect]);

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

  const copyToClipboard = useCallback(async (text: string) => {
    const txId = `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    try {
      await navigator.clipboard.writeText(text);
      if (showLoadingPopup && updatePopup) {
        showLoadingPopup(txId, { title: 'Address Copied', subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard` });
        setTimeout(() => {
          updatePopup(txId, { title: 'Address Copied', subtitle: `${text.slice(0, 6)}...${text.slice(-4)} copied to clipboard`, variant: 'success', confirmed: true, isLoading: false });
        }, 100);
      }
    } catch (err) {
      console.error('Copy failed', err);
      if (showLoadingPopup && updatePopup) {
        showLoadingPopup(txId, { title: 'Copy Failed', subtitle: 'Unable to copy address to clipboard' });
        setTimeout(() => {
          updatePopup(txId, { title: 'Copy Failed', subtitle: 'Unable to copy address to clipboard', variant: 'error', confirmed: true, isLoading: false });
        }, 100);
      }
    }
  }, []);

  const handleQuickBuy = useCallback(async (token: Token, amt: string) => {
    const val = BigInt(amt || '0') * 10n ** 18n;
    if (val === 0n) return;

    const txId = `quickbuy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    dispatch({ type: 'SET_LOADING', id: token.id, loading: true });

    try {
      if (showLoadingPopup) {
        showLoadingPopup(txId, {
          title: 'Sending transaction...',
          subtitle: `${amt} MON worth of ${token.symbol}`,
          amount: amt,
          amountUnit: 'MON',
          tokenImage: token.image
        });
      }

      const uo = {
        target: routerAddress,
        data: encodeFunctionData({ abi: CrystalRouterAbi, functionName: 'buy', args: [true, token.tokenAddress as `0x${string}`, val, 0n] }),
        value: val,
      };

      if (updatePopup) {
        updatePopup(txId, {
          title: 'Confirming transaction...',
          subtitle: `${amt} MON worth of ${token.symbol}`,
          variant: 'info',
          tokenImage: token.image
        });
      }

      await sendUserOperationAsync({ uo });

      if (updatePopup) {
        updatePopup(txId, {
          title: 'Quick Buy Complete',
          subtitle: `Successfully bought ${token.symbol} with ${amt} MON`,
          variant: 'success',
          confirmed: true,
          isLoading: false,
          tokenImage: token.image
        });
      }
    } catch (e: any) {
      console.error('Quick buy failed', e);
      const msg = String(e?.message ?? '');
      if (updatePopup) {
        updatePopup(txId, {
          title: msg.toLowerCase().includes('insufficient') ? 'Insufficient Balance' : 'Quick Buy Failed',
          subtitle: msg || 'Please try again.',
          variant: 'error',
          confirmed: true,
          isLoading: false,
          tokenImage: token.image
        });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', id: token.id, loading: false });
    }
  }, [routerAddress, sendUserOperationAsync]);

  const handleTokenClick = useCallback((t: Token) => {
    navigate(`/meme/${t.tokenAddress}`, { state: { tokenData: t } });
  }, [navigate]);

  const hideToken = useCallback((id: string) => {
    if (hidden.has(id)) {
      dispatch({ type: 'SHOW_TOKEN', id });
    } else {
      dispatch({ type: 'HIDE_TOKEN', id });
    }
  }, [hidden]);

  const handleBlacklistToken = useCallback((token: Token) => {
    const newItem = { id: Date.now().toString(), text: token.dev, type: 'dev' as const };
    setBlacklistSettings(prev => ({ items: [...prev.items, newItem] }));
    console.log(`Blacklisted dev: ${token.dev}`);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const res = await fetch(SUBGRAPH_URL, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
            query: `
          {
            active: launchpadTokens(first:30, orderBy: timestamp, orderDirection: desc, where:{migrated:false}) {
              id creator { id } name symbol metadataCID description social1 social2 social3 timestamp migrated migratedAt
              volumeNative volumeToken buyTxs sellTxs distinctBuyers distinctSellers lastPriceNativePerTokenWad lastUpdatedAt
              trades { id amountIn amountOut }
            }
            migrated: launchpadTokens(first:30, orderBy: migratedAt, orderDirection: desc, where:{migrated:true}) {
              id creator { id } name symbol metadataCID description social1 social2 social3 timestamp migrated migratedAt
              volumeNative volumeToken buyTxs sellTxs distinctBuyers distinctSellers lastPriceNativePerTokenWad lastUpdatedAt
              trades { id amountIn amountOut }
            }
          }`
          })
        });
        const json = await res.json();
        const rawMarkets = [...(json.data?.active ?? []), ...(json.data?.migrated ?? [])];

        const tokens: Token[] = await Promise.all(
          rawMarkets.map(async (m: any) => {
            const price = Number(m.lastPriceNativePerTokenWad) / 1e18 || defaultMetrics.price;

            let meta: any = {};
            try {
              const metaRes = await fetch(m.metadataCID);
              if (metaRes.ok) meta = await metaRes.json();
            } catch (e) {
              console.warn('failed to load metadata for', m.metadataCID, e);
            }

            let createdTimestamp = Number(m.timestamp);
            if (createdTimestamp > 1e10) {
              createdTimestamp = Math.floor(createdTimestamp / 1000);
            }
            const socials = [m.social1, m.social2, m.social3].map(s => s ? (/^https?:\/\//.test(s) ? s : `https://${s}`) : s)
            const twitter = socials.find(s => s?.startsWith("https://x.com") || s?.startsWith("https://twitter.com"))
            if (twitter) { socials.splice(socials.indexOf(twitter), 1) }
            const telegram = socials.find(s => s?.startsWith("https://t.me"))
            if (telegram) { socials.splice(socials.indexOf(telegram), 1) }
            const discord = socials.find(s => s?.startsWith("https://discord.gg") || s?.startsWith("https://discord.com"))
            if (discord) { socials.splice(socials.indexOf(discord), 1) }
            const website = socials[0]

            return {
              ...defaultMetrics,
              id: m.id.toLowerCase(),
              tokenAddress: m.id.toLowerCase(),
              dev: m.creator.id,
              name: m.name,
              symbol: m.symbol,
              image: meta.image ?? '/discord.svg',
              description: meta.description ?? '',
              twitterHandle: twitter ?? '',
              website: website ?? '',
              status: m.migrated ? 'graduated' : price * TOTAL_SUPPLY > 12500 ? 'graduating' : 'new',
              created: createdTimestamp,
              price,
              marketCap: price * TOTAL_SUPPLY,
              buyTransactions: Number(m.buyTxs),
              sellTransactions: Number(m.sellTxs),
              volume24h: Number(m.volumeNative) / 1e18,
              volumeDelta: 0,
              discordHandle: discord ?? '',
              telegramHandle: telegram ?? '',
            } as Token;
          })
        );

        dispatch({ type: 'INIT', tokens });
        const all = tokens.map(t => t.id);
        trackedMarketsRef.current = new Set(all.map(x => x.toLowerCase()));
        openWebsocket(all);
      } catch (err) {
        console.error('initial subgraph fetch failed', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
      connectionStateRef.current = 'disconnected';
      
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
      
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null;
        
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          try {
            ws.close(1000, 'component unmount');
          } catch (error) {
            console.warn('Error closing WebSocket on unmount:', error);
          }
        }
      }
      
      connectionAttemptsRef.current = 0;
      retryCountRef.current = 0;
      consecutiveFailuresRef.current = 0;
      trackedMarketsRef.current.clear();
    };
  }, [openWebsocket]);

  const applyFilters = useCallback((list: Token[], fil: any) => {
    if (!fil) return list;
    return list.filter((t) => {
      if (fil.priceMin !== undefined && fil.priceMin !== '' && t.price < +fil.priceMin) return false;
      if (fil.priceMax !== undefined && fil.priceMax !== '' && t.price > +fil.priceMax) return false;

      if (fil.marketCapMin !== undefined && fil.marketCapMin !== '' && t.marketCap < +fil.marketCapMin) return false;
      if (fil.marketCapMax !== undefined && fil.marketCapMax !== '' && t.marketCap > +fil.marketCapMax) return false;

      if (fil.volumeMin !== undefined && fil.volumeMin !== '' && t.volume24h < +fil.volumeMin) return false;
      if (fil.volumeMax !== undefined && fil.volumeMax !== '' && t.volume24h > +fil.volumeMax) return false;

      if (fil.holdersMin !== undefined && fil.holdersMin !== '' && t.holders < +fil.holdersMin) return false;
      if (fil.holdersMax !== undefined && fil.holdersMax !== '' && t.holders > +fil.holdersMax) return false;

      if (fil.ageMin !== undefined && fil.ageMin !== '') {
        const ageHours = (Date.now() / 1000 - t.created) / 3600;
        if (ageHours < +fil.ageMin) return false;
      }
      if (fil.ageMax !== undefined && fil.ageMax !== '') {
        const ageHours = (Date.now() / 1000 - t.created) / 3600;
        if (ageHours > +fil.ageMax) return false;
      }

      if (fil.searchKeywords && fil.searchKeywords.trim()) {
        const keywords = fil.searchKeywords.toLowerCase().split(',').map((x: string) => x.trim()).filter(Boolean);
        const searchText = `${t.name} ${t.symbol} ${t.description} ${t.tokenAddress}`.toLowerCase();
        if (!keywords.some((keyword: string) => searchText.includes(keyword))) return false;
      }

      if (fil.hasTwitter && !t.twitterHandle) return false;
      if (fil.hasWebsite && !t.website) return false;
      if (fil.hasTelegram && !t.telegramHandle) return false;
      if (fil.hasDiscord && !t.discordHandle) return false;
      if (fil.sniperHoldingMax !== undefined && fil.sniperHoldingMax !== '' && t.sniperHolding > +fil.sniperHoldingMax) return false;
      if (fil.devHoldingMax !== undefined && fil.devHoldingMax !== '' && t.devHolding > +fil.devHoldingMax) return false;
      if (fil.insiderHoldingMax !== undefined && fil.insiderHoldingMax !== '' && t.insiderHolding > +fil.insiderHoldingMax) return false;
      if (fil.top10HoldingMax !== undefined && fil.top10HoldingMax !== '' && t.top10Holding > +fil.top10HoldingMax) return false;
      if (fil.proTradersMin !== undefined && fil.proTradersMin !== '' && t.proTraders < +fil.proTradersMin) return false;
      if (fil.kolTradersMin !== undefined && fil.kolTradersMin !== '' && t.kolTraders < +fil.kolTradersMin) return false;

      return true;
    });
  }, []);

  const visibleTokens = useMemo(() => {
    const base = {
      new: displaySettings.hideHiddenTokens ? tokensByStatus.new.filter((t) => !hidden.has(t.id)) : tokensByStatus.new,
      graduating: displaySettings.hideHiddenTokens ? tokensByStatus.graduating.filter((t) => !hidden.has(t.id)) : tokensByStatus.graduating,
      graduated: displaySettings.hideHiddenTokens ? tokensByStatus.graduated.filter((t) => !hidden.has(t.id)) : tokensByStatus.graduated,
    } as Record<Token['status'], Token[]>;

    if (!appliedFilters) return base;

    return (['new', 'graduating', 'graduated'] as Token['status'][]).reduce(
      (acc, s) => ({ ...acc, [s]: activeFilterTab === s ? applyFilters(base[s], appliedFilters) : base[s] }),
      {} as Record<Token['status'], Token[]>
    );
  }, [tokensByStatus, hidden, appliedFilters, activeFilterTab, applyFilters, displaySettings.hideHiddenTokens]);

  const newTokens = visibleTokens.new;
  const graduatingTokens = visibleTokens.graduating;
  const graduatedTokens = visibleTokens.graduated;

  const tokenCounts = useMemo(() => ({
    new: newTokens.length,
    graduating: graduatingTokens.length,
    graduated: graduatedTokens.length,
  }), [newTokens.length, graduatingTokens.length, graduatedTokens.length]);

  const renderOrder: Array<ColumnKey> =
    Array.isArray(displaySettings?.columnOrder) && displaySettings.columnOrder.length
      ? displaySettings.columnOrder
      : (['new', 'graduating', 'graduated'] as Array<ColumnKey>);

  return (
    <div className="explorer-main">
      <div className="explorer-header-row">
        <div className="explorer-header-left">
          <h1 className="explorer-app-title">Terminal</h1>
        </div>
        <div className="explorer-header-right">
          <button className="alerts-popup-trigger" onClick={() => setShowAlertsPopup(true)}>
            <Bell size={18} />
          </button>
          <button className="alerts-popup-trigger" onClick={() => setShowBlacklistPopup(true)}>
            <svg
              className="blacklist-dev-icon"
              width="18"
              height="18"
              viewBox="0 0 30 30"
              fill="rgb(95, 99, 105)"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M 15 3 C 12.922572 3 11.153936 4.1031436 10.091797 5.7207031 A 1.0001 1.0001 0 0 0 9.7578125 6.0820312 C 9.7292571 6.1334113 9.7125605 6.1900515 9.6855469 6.2421875 C 9.296344 6.1397798 8.9219965 6 8.5 6 C 5.4744232 6 3 8.4744232 3 11.5 C 3 13.614307 4.2415721 15.393735 6 16.308594 L 6 21.832031 A 1.0001 1.0001 0 0 0 6 22.158203 L 6 26 A 1.0001 1.0001 0 0 0 7 27 L 23 27 A 1.0001 1.0001 0 0 0 24 26 L 24 22.167969 A 1.0001 1.0001 0 0 0 24 21.841797 L 24 16.396484 A 1.0001 1.0001 0 0 0 24.314453 16.119141 C 25.901001 15.162328 27 13.483121 27 11.5 C 27 8.4744232 24.525577 6 21.5 6 C 21.050286 6 20.655525 6.1608623 20.238281 6.2636719 C 19.238779 4.3510258 17.304452 3 15 3 z M 15 5 C 16.758645 5 18.218799 6.1321075 18.761719 7.703125 A 1.0001 1.0001 0 0 0 20.105469 8.2929688 C 20.537737 8.1051283 21.005156 8 21.5 8 C 23.444423 8 25 9.5555768 25 11.5 C 25 13.027915 24.025062 14.298882 22.666016 14.78125 A 1.0001 1.0001 0 0 0 22.537109 14.839844 C 22.083853 14.980889 21.600755 15.0333 21.113281 14.978516 A 1.0004637 1.0004637 0 0 0 20.888672 16.966797 C 21.262583 17.008819 21.633549 16.998485 22 16.964844 L 22 21 L 19 21 L 19 20 A 1.0001 1.0001 0 0 0 17.984375 18.986328 A 1.0001 1.0001 0 0 0 17 20 L 17 21 L 13 21 L 13 18 A 1.0001 1.0001 0 0 0 11.984375 16.986328 A 1.0001 1.0001 0 0 0 11 18 L 11 21 L 8 21 L 8 15.724609 A 1.0001 1.0001 0 0 0 7.3339844 14.78125 C 5.9749382 14.298882 5 13.027915 5 11.5 C 5 9.5555768 6.5555768 8 8.5 8 C 8.6977911 8 8.8876373 8.0283871 9.0761719 8.0605469 C 8.9619994 8.7749993 8.9739615 9.5132149 9.1289062 10.242188 A 1.0003803 1.0003803 0 1 0 11.085938 9.8261719 C 10.942494 9.151313 10.98902 8.4619936 11.1875 7.8203125 A 1.0001 1.0001 0 0 0 11.238281 7.703125 C 11.781201 6.1321075 13.241355 5 15 5 z M 8 23 L 11.832031 23 A 1.0001 1.0001 0 0 0 12.158203 23 L 17.832031 23 A 1.0001 1.0001 0 0 0 18.158203 23 L 22 23 L 22 25 L 8 25 L 8 23 z" />
            </svg>
          </button>
          <DisplayDropdown settings={displaySettings} onSettingsChange={setDisplaySettings} />

        </div>
      </div>

      <div className="explorer-container">
        <MobileTabSelector activeTab={activeMobileTab} onTabChange={setActiveMobileTab} tokenCounts={tokenCounts} />

        <div className="explorer-columns">
          {renderOrder.map((columnType) => (
            <div
              key={columnType}
              className={`explorer-column ${activeMobileTab === columnType ? 'mobile-active' : ''}`}
              onMouseEnter={() => handleColumnHover(columnType)}
              onMouseLeave={handleColumnLeave}
            >              {columnType === 'new' && (
              <>
                <div className="explorer-column-header">
                  <div className="explorer-column-title-section">
                    <h2 className="explorer-column-title">New Pairs</h2>

                  </div>
                  <div className="explorer-column-title-right">
                    <div className={`column-pause-icon ${pausedColumn === 'new' ? 'visible' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 19h2V5H7v14zm8-14v14h2V5h-2z" />
                      </svg>
                    </div>
                    <div className="explorer-quickbuy-container">
                      <img className="explorer-quick-buy-search-icon" src={lightning} alt="" />
                      <input
                        type="text"
                        placeholder="0.0"
                        value={quickAmounts.new}
                        onChange={(e) => setQuickAmount('new', e.target.value)}
                        onFocus={handleInputFocus}
                        className="explorer-quickbuy-input"
                      />
                      <img className="quickbuy-monad-icon" src={monadicon} />
                      <div className="explorer-preset-controls">
                        {[1, 2, 3].map(p => (
                          <button key={p} className={`explorer-preset-pill ${activePresets.new === p ? 'active' : ''}`} onClick={() => setActivePreset('new', p)}>
                            P{p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      className={`column-filter-icon ${appliedFilters && activeFilterTab === 'new' ? 'active' : ''}`}
                      onClick={() => onOpenFiltersForColumn('new')}
                      title="filter new pairs"
                    >
                      <img className="filter-icon" src={filter} />
                      {appliedFilters && activeFilterTab === 'new' && <span className="filter-active-dot" />}
                    </button>
                  </div>
                </div>

                <div className="explorer-tokens-list">
                  {isLoading ? (
                    Array.from({ length: 14 }).map((_, index) => (
                      <div key={`skeleton-new-${index}`} className="explorer-token-row loading">
                        <div className="explorer-token-left">
                          <div className="explorer-token-image-container">
                            <div className="explorer-progress-spacer">
                              <div className="explorer-image-wrapper">
                                <img className="explorer-token-image" alt="loading" />
                              </div>
                            </div>
                          </div>
                          <span className="explorer-contract-address">Loading...</span>
                        </div>
                        <div className="explorer-token-details">
                          <div className="explorer-detail-section">
                            <div className="explorer-top-row">
                              <div className="explorer-token-info">
                                <h3 className="explorer-token-symbol">LOAD</h3>
                                <p className="explorer-token-name">Loading Token</p>
                              </div>
                            </div>
                            <div className="explorer-second-row">
                              <div className="explorer-stat-item">
                                <span className="explorer-stat-value">0</span>
                              </div>
                            </div>
                          </div>
                          <div className="explorer-holdings-section" />
                        </div>
                        <div className="explorer-third-row">
                          <div className="explorer-market-cap"><span className="mc-label"></span><span className="mc-label"></span></div>
                          <div className="explorer-actions-section"><button className="explorer-quick-buy-btn">Loading</button></div>
                        </div>
                      </div>
                    ))
                  ) : newTokens.length ? (
                    newTokens.map((t) => (
                      <TokenRow
                        key={t.id}
                        token={t}
                        quickbuyAmount={quickAmounts.new}
                        onHideToken={hideToken}
                        onBlacklistToken={handleBlacklistToken}
                        isLoading={loading.has(t.id)}
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
                      <h2 className="explorer-column-title">
                        Final Stretch
                      </h2>

                    </div>
                    <div className="explorer-column-title-right">
                      <div className={`column-pause-icon ${pausedColumn === 'graduating' ? 'visible' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7 19h2V5H7v14zm8-14v14h2V5h-2z" />
                        </svg>
                      </div>
                      <div className="explorer-quickbuy-container">
                        <img className="explorer-quick-buy-search-icon" src={lightning} alt="" />
                        <input
                          type="text"
                          placeholder="0.0"
                          value={quickAmounts.graduating}
                          onChange={(e) => setQuickAmount('graduating', e.target.value)}
                          onFocus={handleInputFocus}
                          className="explorer-quickbuy-input"
                        />
                        <img className="quickbuy-monad-icon" src={monadicon} />
                        <div className="explorer-preset-controls">
                          {[1, 2, 3].map(p => (
                            <button key={p} className={`explorer-preset-pill ${activePresets.graduating === p ? 'active' : ''}`} onClick={() => setActivePreset('graduating', p)}>
                              P{p}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        className={`column-filter-icon ${appliedFilters && activeFilterTab === 'graduating' ? 'active' : ''}`}
                        onClick={() => onOpenFiltersForColumn('graduating')}
                        title="Filter graduating tokens"
                      >
                        <img className="filter-icon" src={filter} />
                        {appliedFilters && activeFilterTab === 'graduating' && <span className="filter-active-dot" />}
                      </button>
                    </div>
                  </div>

                  <div className="explorer-tokens-list">
                    {isLoading ? (
                      Array.from({ length: 14 }).map((_, index) => (
                        <div key={`skeleton-graduating-${index}`} className="explorer-token-row loading">
                          <div className="explorer-token-left">
                            <div className="explorer-token-image-container">
                              <div className="explorer-progress-spacer">
                                <div className="explorer-image-wrapper">
                                  <img className="explorer-token-image" alt="loading" />
                                </div>
                              </div>
                            </div>
                            <span className="explorer-contract-address">Loading...</span>
                          </div>
                          <div className="explorer-token-details">
                            <div className="explorer-detail-section">
                              <div className="explorer-top-row">
                                <div className="explorer-token-info">
                                  <h3 className="explorer-token-symbol">LOAD</h3>
                                  <p className="explorer-token-name">Loading Token</p>
                                </div>
                              </div>
                              <div className="explorer-second-row">
                                <div className="explorer-stat-item"><span className="explorer-stat-value">0</span></div>
                              </div>
                            </div>
                            <div className="explorer-holdings-section" />
                          </div>
                          <div className="explorer-third-row">
                            <div className="explorer-market-cap"><span className="mc-label"></span><span className="mc-label"></span></div>
                            <div className="explorer-actions-section"><button className="explorer-quick-buy-btn">Loading</button></div>
                          </div>
                        </div>
                      ))
                    ) : graduatingTokens.length ? (
                      graduatingTokens.map((t) => (
                        <TokenRow
                          key={t.id}
                          token={t}
                          quickbuyAmount={quickAmounts.graduating}
                          onHideToken={hideToken}
                          onBlacklistToken={handleBlacklistToken}
                          isLoading={loading.has(t.id)}
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
                      <h2 className="explorer-column-title">
                        Graduated
                      </h2>

                    </div>
                    <div className="explorer-column-title-right">
                      <div className={`column-pause-icon ${pausedColumn === 'graduated' ? 'visible' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7 19h2V5H7v14zm8-14v14h2V5h-2z" />
                        </svg>
                      </div>
                      <div className="explorer-quickbuy-container">
                        <img className="explorer-quick-buy-search-icon" src={lightning} alt="" />
                        <input
                          type="text"
                          placeholder="0.0"
                          value={quickAmounts.graduated}
                          onChange={(e) => setQuickAmount('graduated', e.target.value)}
                          onFocus={handleInputFocus}
                          className="explorer-quickbuy-input"
                        />
                        <img className="quickbuy-monad-icon" src={monadicon} />
                        <div className="explorer-preset-controls">
                          {[1, 2, 3].map(p => (
                            <button key={p} className={`explorer-preset-pill ${activePresets.graduated === p ? 'active' : ''}`} onClick={() => setActivePreset('graduated', p)}>
                              P{p}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        className={`column-filter-icon ${appliedFilters && activeFilterTab === 'graduated' ? 'active' : ''}`}
                        onClick={() => onOpenFiltersForColumn('graduated')}
                        title="filter graduated tokens"
                      >
                        <img className="filter-icon" src={filter} />
                        {appliedFilters && activeFilterTab === 'graduated' && <span className="filter-active-dot" />}
                      </button>
                    </div>
                  </div>

                  <div className="explorer-tokens-list">
                    {isLoading ? (
                      Array.from({ length: 14 }).map((_, index) => (
                        <div key={`skeleton-graduated-${index}`} className="explorer-token-row loading">
                          <div className="explorer-token-left">
                            <div className="explorer-token-image-container">
                              <div className="explorer-progress-spacer">
                                <div className="explorer-image-wrapper">
                                  <img className="explorer-token-image" alt="loading" />
                                </div>
                              </div>
                            </div>
                            <span className="explorer-contract-address">Loading...</span>
                          </div>
                          <div className="explorer-token-details">
                            <div className="explorer-detail-section">
                              <div className="explorer-top-row">
                                <div className="explorer-token-info">
                                  <h3 className="explorer-token-symbol">LOAD</h3>
                                  <p className="explorer-token-name">Loading Token</p>
                                </div>
                              </div>
                              <div className="explorer-second-row">
                                <div className="explorer-stat-item">
                                  <span className="explorer-stat-value">0</span>
                                </div>
                              </div>
                            </div>
                            <div className="explorer-holdings-section" />
                          </div>
                          <div className="explorer-third-row">
                            <div className="explorer-market-cap"><span className="mc-label"></span><span className="mc-label"></span></div>
                            <div className="explorer-actions-section"><button className="explorer-quick-buy-btn">Loading</button></div>
                          </div>
                        </div>
                      ))
                    ) : graduatedTokens.length ? (
                      graduatedTokens.map((t) => (
                        <TokenRow
                          key={t.id}
                          token={t}
                          quickbuyAmount={quickAmounts.graduated}
                          onHideToken={hideToken}
                          onBlacklistToken={handleBlacklistToken}
                          isLoading={loading.has(t.id)}
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
      />
    </div>
  );
};

export default TokenExplorer;
