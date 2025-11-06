import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Settings, RotateCcw } from 'lucide-react';
import './PNLWidget.css';
import PNLBG from '../../assets/lbstand.png';
import PNLHistoryPopup from './PNLHistoryPopup';
import monadIcon from '../../assets/monad.svg';

interface PNLWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSnapChange?: (snapSide: 'left' | 'right' | null, width: number) => void;
}

type PNLTab = '24h' | '7d' | '30d';

const HEADER_HEIGHT = 53;
const SIDEBAR_WIDTH = 50;

const PNLWidget: React.FC<PNLWidgetProps> = ({
  isOpen,
  onClose,
  onSnapChange
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 480, height: 380 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [isSnapped, setIsSnapped] = useState<'left' | 'right' | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [activeTab, setActiveTab] = useState<PNLTab>('24h');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'background' | 'text'>('background');
  const [swapCurrency, setSwapCurrency] = useState(false);
  const [showAltCurrency, setShowAltCurrency] = useState(false);
  const [blurAmount, setBlurAmount] = useState(0);
  const [opacityAmount, setOpacityAmount] = useState(100);
  const [textShadows, setTextShadows] = useState(false);
  const [boldText, setBoldText] = useState(false);
  const [primaryTextColor, setPrimaryTextColor] = useState('FCFCFC');
  const [secondaryTextColor, setSecondaryTextColor] = useState('777A8C');
  const [increaseColor, setIncreaseColor] = useState('2FE3AC');
  const [decreaseColor, setDecreaseColor] = useState('EC397A');
  const [showHistory, setShowHistory] = useState(false);
  const [showGraph, setShowGraph] = useState(true);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const resizeStartPosition = useRef({ x: 0, y: 0 });

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return;
    }

    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };

    setIsDragging(true);
  }, [position]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.stopPropagation();
      setIsResizing(true);
      setResizeDirection(direction);
      resizeStartPos.current = { x: e.clientX, y: e.clientY };
      resizeStartSize.current = { ...size };
      resizeStartPosition.current = { ...position };
    },
    [size, position]
  );

  useEffect(() => {
    if (onSnapChange) {
      onSnapChange(isSnapped, size.width);
    }
  }, [isSnapped, size.width, onSnapChange]);

  useEffect(() => {
    const handleWindowResize = () => {
      setPosition(prev => ({
        x: Math.max(SIDEBAR_WIDTH, Math.min(prev.x, window.innerWidth - size.width)),
        y: Math.max(HEADER_HEIGHT, Math.min(prev.y, window.innerHeight - size.height))
      }));
      setSize(prev => ({
        width: Math.min(prev.width, window.innerWidth - SIDEBAR_WIDTH),
        height: Math.min(prev.height, window.innerHeight - HEADER_HEIGHT)
      }));
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [size.width]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        let newX = e.clientX - dragStartPos.current.x;
        let newY = e.clientY - dragStartPos.current.y;

        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;

        newX = Math.max(SIDEBAR_WIDTH, Math.min(newX, maxX));
        newY = Math.max(HEADER_HEIGHT, Math.min(newY, maxY));

        setPosition({ x: newX, y: newY });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStartPos.current.x;
        const deltaY = e.clientY - resizeStartPos.current.y;

        let newWidth = resizeStartSize.current.width;
        let newHeight = resizeStartSize.current.height;
        let newX = resizeStartPosition.current.x;
        let newY = resizeStartPosition.current.y;

        if (resizeDirection.includes('e')) {
          newWidth = Math.max(300, resizeStartSize.current.width + deltaX);
        }
        if (resizeDirection.includes('w')) {
          newWidth = Math.max(300, resizeStartSize.current.width - deltaX);
          newX = resizeStartPosition.current.x + deltaX;
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(200, resizeStartSize.current.height + deltaY);
        }
        if (resizeDirection.includes('n')) {
          newHeight = Math.max(200, resizeStartSize.current.height - deltaY);
          newY = resizeStartPosition.current.y + deltaY;
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, size, position, resizeDirection]);

  if (!isOpen) return null;

  return (
    <>
      {showSettings && (
        <div className="pnl-settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="pnl-settings-popup" onClick={(e) => e.stopPropagation()}>
            <div className="pnl-settings-header">
              <h3 className="pnl-settings-title">PNL Settings</h3>
              <button className="pnl-settings-close-btn" onClick={() => setShowSettings(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="pnl-settings-content">
              {/* General Section */}
              <div className="pnl-settings-section">
                <h4 className="pnl-settings-section-title">General</h4>

                <div className="pnl-toggle-row">
                  <span className="pnl-toggle-label">Swap USD and MON</span>
                  <button
                    className={`pnl-toggle ${swapCurrency ? 'active' : ''}`}
                    onClick={() => setSwapCurrency(!swapCurrency)}
                  >
                    <div className="pnl-toggle-slider"></div>
                  </button>
                </div>

                <div className="pnl-toggle-row">
                  <span className="pnl-toggle-label">Show alternate currency</span>
                  <button
                    className={`pnl-toggle ${showAltCurrency ? 'active' : ''}`}
                    onClick={() => setShowAltCurrency(!showAltCurrency)}
                  >
                    <div className="pnl-toggle-slider"></div>
                  </button>
                </div>
              </div>

              {/* Appearance Section */}
              <div className="pnl-settings-section">
                <h4 className="pnl-settings-section-title">Appearance</h4>

                <div className="pnl-background-image-row">
                  <span className="pnl-toggle-label">Background Image</span>
                  <button className="pnl-delete-bg-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>

                <div className="pnl-bg-preview">
                  <div className="pnl-bg-preview-wrapper">
                    <div
                      className="pnl-bg-preview-background"
                      style={{
                        backgroundImage: `url(${PNLBG})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: `blur(${blurAmount}px)`,
                        opacity: opacityAmount / 100
                      }}
                    />
                    <div className="pnl-bg-preview-content">
                      <div className="pnl-bg-balance">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        <div className="pnl-bg-value-container">
                          <div className="pnl-bg-value-row">
                            {!swapCurrency ? (
                              <>
                                <img src={monadIcon} alt="MON" className="pnl-bg-mon-icon" />
                                <span className="pnl-bg-value">12.34</span>
                              </>
                            ) : (
                              <span className="pnl-bg-value">$1,234.56</span>
                            )}
                          </div>
                          {showAltCurrency && (
                            <span className="pnl-bg-alt-currency">
                              {!swapCurrency ? '$1,234.56' : '12.34 MON'}
                            </span>
                          )}
                        </div>
                        <span className="pnl-bg-label">Balance</span>
                      </div>
                      <div className="pnl-bg-pnl">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        <div className="pnl-bg-value-container">
                          <div className="pnl-bg-value-row">
                            {!swapCurrency ? (
                              <>
                                <img src={monadIcon} alt="MON" className="pnl-bg-mon-icon" />
                                <span className="pnl-bg-value negative">-1.234</span>
                              </>
                            ) : (
                              <span className="pnl-bg-value negative">-$123.45</span>
                            )}
                          </div>
                          {showAltCurrency && (
                            <span className="pnl-bg-alt-currency">
                              {!swapCurrency ? '-$123.45' : '-1.234 MON'}
                            </span>
                          )}
                        </div>
                        <span className="pnl-bg-label">PNL</span>
                      </div>
                    </div>
                  </div>
                  <div className="pnl-bg-recommendation">Recommended aspect ratio 4:1 and 0.2MB file size</div>
                </div>

                <div className="pnl-appearance-tabs" data-tab={settingsTab}>
                  <button
                    className={`pnl-appearance-tab ${settingsTab === 'background' ? 'active' : ''}`}
                    onClick={() => setSettingsTab('background')}
                  >
                    Background
                  </button>
                  <button
                    className={`pnl-appearance-tab ${settingsTab === 'text' ? 'active' : ''}`}
                    onClick={() => setSettingsTab('text')}
                  >
                    Text
                  </button>
                </div>

                {settingsTab === 'background' && (
                  <>
                    <div className="pnl-slider-row">
                      <span className="pnl-slider-label">Blur</span>
                      <div className="pnl-slider-value-box">{blurAmount} px</div>
                    </div>
                    <div
                      className="pnl-slider-container"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                        setBlurAmount(Math.round((percentage / 100) * 20));
                      }}
                    >
                      <div className="pnl-slider-fill" style={{ width: `${(blurAmount / 20) * 100}%` }} />
                      <div
                        className="pnl-slider-thumb"
                        style={{ left: `${(blurAmount / 20) * 100}%` }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            const container = (e.target as HTMLElement).parentElement;
                            if (!container) return;
                            const rect = container.getBoundingClientRect();
                            const x = moveEvent.clientX - rect.left;
                            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                            setBlurAmount(Math.round((percentage / 100) * 20));
                          };
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    </div>

                    <div className="pnl-slider-row">
                      <span className="pnl-slider-label">Opacity</span>
                      <div className="pnl-slider-value-box">{opacityAmount} %</div>
                    </div>
                    <div
                      className="pnl-slider-container"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                        setOpacityAmount(Math.round(percentage));
                      }}
                    >
                      <div className="pnl-slider-fill" style={{ width: `${opacityAmount}%` }} />
                      <div
                        className="pnl-slider-thumb"
                        style={{ left: `${opacityAmount}%` }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            const container = (e.target as HTMLElement).parentElement;
                            if (!container) return;
                            const rect = container.getBoundingClientRect();
                            const x = moveEvent.clientX - rect.left;
                            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                            setOpacityAmount(Math.round(percentage));
                          };
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    </div>
                  </>
                )}

                {settingsTab === 'text' && (
                  <>
                    <div className="pnl-toggle-row">
                      <span className="pnl-toggle-label">Text shadows</span>
                      <button
                        className={`pnl-toggle ${textShadows ? 'active' : ''}`}
                        onClick={() => setTextShadows(!textShadows)}
                      >
                        <div className="pnl-toggle-slider"></div>
                      </button>
                    </div>

                    <div className="pnl-toggle-row">
                      <span className="pnl-toggle-label">Bold text</span>
                      <button
                        className={`pnl-toggle ${boldText ? 'active' : ''}`}
                        onClick={() => setBoldText(!boldText)}
                      >
                        <div className="pnl-toggle-slider"></div>
                      </button>
                    </div>

                    <div className="pnl-color-picker-row">
                      <span className="pnl-color-picker-label">Primary Text</span>
                      <div className="pnl-color-picker-input-wrapper">
                        <div className="pnl-color-swatch" style={{ background: `#${primaryTextColor}` }}></div>
                        <input
                          type="text"
                          className="pnl-color-input"
                          value={primaryTextColor}
                          onChange={(e) => setPrimaryTextColor(e.target.value.replace('#', ''))}
                          maxLength={6}
                        />
                        <button className="pnl-color-reset">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                            <path d="M3 3v5h5"></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="pnl-color-picker-row">
                      <span className="pnl-color-picker-label">Secondary Text</span>
                      <div className="pnl-color-picker-input-wrapper">
                        <div className="pnl-color-swatch" style={{ background: `#${secondaryTextColor}` }}></div>
                        <input
                          type="text"
                          className="pnl-color-input"
                          value={secondaryTextColor}
                          onChange={(e) => setSecondaryTextColor(e.target.value.replace('#', ''))}
                          maxLength={6}
                        />
                        <button className="pnl-color-reset">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                            <path d="M3 3v5h5"></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="pnl-color-picker-row">
                      <span className="pnl-color-picker-label">Increase Color</span>
                      <div className="pnl-color-picker-input-wrapper">
                        <div className="pnl-color-swatch" style={{ background: `#${increaseColor}` }}></div>
                        <input
                          type="text"
                          className="pnl-color-input"
                          value={increaseColor}
                          onChange={(e) => setIncreaseColor(e.target.value.replace('#', ''))}
                          maxLength={6}
                        />
                        <button className="pnl-color-reset">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                            <path d="M3 3v5h5"></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="pnl-color-picker-row">
                      <span className="pnl-color-picker-label">Decrease Color</span>
                      <div className="pnl-color-picker-input-wrapper">
                        <div className="pnl-color-swatch" style={{ background: `#${decreaseColor}` }}></div>
                        <input
                          type="text"
                          className="pnl-color-input"
                          value={decreaseColor}
                          onChange={(e) => setDecreaseColor(e.target.value.replace('#', ''))}
                          maxLength={6}
                        />
                        <button className="pnl-color-reset">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                            <path d="M3 3v5h5"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pnl-settings-footer">
              <button className="pnl-reset-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
              </button>
              <button className="pnl-done-btn" onClick={() => setShowSettings(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={widgetRef}
        className={`pnl-widget ${isDragging ? 'dragging' : ''} ${isSnapped ? `pnl-snapped pnl-snapped-${isSnapped}` : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: isSnapped ? `${size.height}px` : 'auto',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="pnl-header-container" style={{ display: 'none' }}>
          <div className="pnl-widget-header" onMouseDown={handleDragStart}>
            <div className="pnl-header-left">
              <h2 className="pnl-widget-title">PNL</h2>
            </div>
          </div>

          <div className="pnl-tabs-row">
            <button
              className={`pnl-tab ${activeTab === '24h' ? 'active' : ''}`}
              onClick={() => setActiveTab('24h')}
            >
              24h
            </button>
            <button
              className={`pnl-tab ${activeTab === '7d' ? 'active' : ''}`}
              onClick={() => setActiveTab('7d')}
            >
              7d
            </button>
            <button
              className={`pnl-tab ${activeTab === '30d' ? 'active' : ''}`}
              onClick={() => setActiveTab('30d')}
            >
              30d
            </button>
          </div>
        </div>

        <div className="pnl-widget-body">
          <div className="pnl-stats-section" onMouseDown={handleDragStart}>
            <div className="pnl-stats-section-controls-left" onMouseDown={(e) => e.stopPropagation()}>
              <button className={`pnl-header-action-button ${isHovered ? 'visible' : ''}`} onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}>
                <Settings size={16} />
              </button>
              <button className={`pnl-header-action-button ${isHovered ? 'visible' : ''}`} onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h18v18H3V3z"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
              </button>
              <button className={`pnl-header-action-button ${isHovered ? 'visible' : ''} ${!showGraph ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setShowGraph(!showGraph); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </button>
              <button className={`pnl-header-action-button ${isHovered ? 'visible' : ''}`} onClick={(e) => { e.stopPropagation(); }}>
                <RotateCcw size={16} />
              </button>
            </div>
            <div className="pnl-stats-section-controls-right" onMouseDown={(e) => e.stopPropagation()}>
              <button className={`pnl-header-action-button ${isHovered ? 'visible' : ''}`} onClick={(e) => { e.stopPropagation(); onClose(); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="pnl-stat-item">
              <div className="pnl-stat-icon balance-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h18v18H3V3z"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
              </div>
              <div className="pnl-stat-content">
                <div className="pnl-stat-value-wrapper">
                  <div className="pnl-stat-value-main">
                    {!swapCurrency ? (
                      <>
                        <img src={monadIcon} alt="MON" className="pnl-stat-mon-icon" />
                        <span className="pnl-stat-value">12.34</span>
                      </>
                    ) : (
                      <span className="pnl-stat-value">$1,234.56</span>
                    )}
                  </div>
                  {showAltCurrency && (
                    <div className="pnl-stat-alt-value">
                      {!swapCurrency ? '$1,234.56' : '12.34 MON'}
                    </div>
                  )}
                </div>
                                <div className="pnl-stat-label">Balance</div>
              </div>
            </div>

            <div className="pnl-stat-item">
              <div className="pnl-stat-icon pnl-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div className="pnl-stat-content">
                <div className="pnl-stat-value-wrapper">
                  <div className="pnl-stat-value-main">
                    {!swapCurrency ? (
                      <>
                        <img src={monadIcon} alt="MON" className="pnl-stat-mon-icon" />
                        <span className="pnl-stat-value pnl-positive">+0.737</span>
                      </>
                    ) : (
                      <span className="pnl-stat-value pnl-positive">+$73.70</span>
                    )}
                  </div>
                  {showAltCurrency && (
                    <div className="pnl-stat-alt-value">
                      {!swapCurrency ? '+$73.70' : '+0.737 MON'}
                    </div>
                  )}
                </div>
                <div className="pnl-stat-label">PNL</div>
              </div>
            </div>
          </div>

          {showGraph && (
            <div className="pnl-chart-section">
              <svg className="pnl-chart" viewBox="0 0 400 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="pnlGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(52, 211, 153, 0.3)" />
                  <stop offset="100%" stopColor="rgba(52, 211, 153, 0)" />
                </linearGradient>
              </defs>
              <path
                d="M 0,80 L 20,50 L 40,30 L 60,25 L 80,20 L 100,22 L 120,18 L 140,15 L 160,14 L 180,16 L 200,20 L 220,25 L 240,30 L 260,35 L 280,38 L 300,40 L 320,42 L 340,45 L 360,48 L 380,50 L 400,52"
                fill="url(#pnlGradient)"
                stroke="none"
              />
              <path
                d="M 0,80 L 20,50 L 40,30 L 60,25 L 80,20 L 100,22 L 120,18 L 140,15 L 160,14 L 180,16 L 200,20 L 220,25 L 240,30 L 260,35 L 280,38 L 300,40 L 320,42 L 340,45 L 360,48 L 380,50 L 400,52"
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
          )}
        </div>

        <div className="resize-handle resize-handle-n" onMouseDown={(e) => handleResizeStart(e, 'n')} />
        <div className="resize-handle resize-handle-s" onMouseDown={(e) => handleResizeStart(e, 's')} />
        <div className="resize-handle resize-handle-e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
        <div className="resize-handle resize-handle-w" onMouseDown={(e) => handleResizeStart(e, 'w')} />
        <div className="resize-handle resize-handle-ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
        <div className="resize-handle resize-handle-nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
        <div className="resize-handle resize-handle-se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
        <div className="resize-handle resize-handle-sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
      </div>

      {showHistory && <PNLHistoryPopup onClose={() => setShowHistory(false)} />}
    </>
  );
};

export default PNLWidget;