import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { HexColorPicker } from 'react-colorful';

import closebutton from '../../assets/close_button.png';
import LogoText from '../../assets/LogoText.png';
import PNLBG from '../../assets/PNLBG.png';
import PNLBG2 from '../../assets/PNLBG2.png'
import monadicon from '../../assets/monadlogo.svg'

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/104695/test/v0.3.11';

const usePNLData = (tokenAddress: string, userAddress: string, days: number | null) => {
  const [pnlData, setPnlData] = useState({
    balance: 0,
    amountBought: 0,
    amountSold: 0,
    valueBought: 0,
    valueSold: 0,
    valueNet: 0,
    lastPrice: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress || !userAddress) {
      setPnlData({
        balance: 0,
        amountBought: 0,
        amountSold: 0,
        valueBought: 0,
        valueSold: 0,
        valueNet: 0,
        lastPrice: 0,
      });
      return;
    }

    const fetchPNLData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeFilter = days ? currentTime - (days * 24 * 60 * 60) : 0;
        
        const response = await fetch(SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query: `
              query ($userAddr: String!, $tokenAddr: String!, $timestamp: Int!) {
                launchpadPositions(
                  where: { 
                    account: $userAddr, 
                    token: $tokenAddr 
                  }
                ) {
                  tokenBought
                  tokenSold
                  nativeSpent
                  nativeReceived
                  tokens
                  token {
                    lastPriceNativePerTokenWad
                    symbol
                    name
                  }
                }
                launchpadBuys(
                  where: {
                    account: $userAddr,
                    token: $tokenAddr,
                    timestamp_gte: $timestamp
                  }
                ) {
                  tokenAmount
                  nativeAmount
                }
                launchpadSells(
                  where: {
                    account: $userAddr,
                    token: $tokenAddr,
                    timestamp_gte: $timestamp
                  }
                ) {
                  tokenAmount
                  nativeAmount
                }
              }
            `,
            variables: {
              userAddr: userAddress.toLowerCase(),
              tokenAddr: tokenAddress.toLowerCase(),
              timestamp: timeFilter,
            },
          }),
        });

        const { data } = await response.json();
        const position = data?.launchpadPositions?.[0];
        const buys = data?.launchpadBuys || [];
        const sells = data?.launchpadSells || [];

        if (position || buys.length > 0 || sells.length > 0) {
          // Calculate totals from filtered transactions
          const totalBoughtTokens = buys.reduce((sum: number, buy: any) => 
            sum + (Number(buy.tokenAmount) / 1e18), 0);
          const totalSoldTokens = sells.reduce((sum: number, sell: any) => 
            sum + (Number(sell.tokenAmount) / 1e18), 0);
          const totalSpentNative = buys.reduce((sum: number, buy: any) => 
            sum + (Number(buy.nativeAmount) / 1e18), 0);
          const totalReceivedNative = sells.reduce((sum: number, sell: any) => 
            sum + (Number(sell.nativeAmount) / 1e18), 0);
          
          const balance = position ? Number(position.tokens) / 1e18 : 0;
          const lastPrice = position ? Number(position.token.lastPriceNativePerTokenWad) / 1e18 : 0;

          // Calculate PnL for the time period
          const realized = totalReceivedNative - totalSpentNative;
          const unrealized = balance * lastPrice;
          const totalPnL = realized + unrealized;

          setPnlData({
            balance,
            amountBought: totalBoughtTokens,
            amountSold: totalSoldTokens,
            valueBought: totalSpentNative,
            valueSold: totalReceivedNative,
            valueNet: totalPnL,
            lastPrice,
          });
        } else {
          setPnlData({
            balance: 0,
            amountBought: 0,
            amountSold: 0,
            valueBought: 0,
            valueSold: 0,
            valueNet: 0,
            lastPrice: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching PNL data:', error);
        setError('Failed to fetch trading data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPNLData();
  }, [tokenAddress, userAddress, days]);

  return { pnlData, isLoading, error };
};

interface PNLComponentProps {
  windowWidth?: number;
  tokenAddress?: string;
  userAddress?: string;
  tokenSymbol?: string;
  tokenName?: string;
  monUsdPrice?: number;
  demoMode?: boolean;
  demoData?: {
    pnl: number;
    entryPrice: number;
    exitPrice: number;
    leverage: number;
    valueNet?: number;
  };
  externalUserStats?: {
    balance: number;
    amountBought: number;
    amountSold: number;
    valueBought: number;
    valueSold: number;
    valueNet: number;
  };
  currentPrice?: number;
}

interface CustomizationSettings {
  mainTextColor: string;
  positivePNLColor: string;
  negativePNLColor: string;
  rectangleTextColor: string;
  showPNLRectangle: boolean;
}

interface ColorInputProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
  id: string;
  defaultColor: string;
}

interface ImageDimensions {
  width: number;
  height: number;
}

interface TimePeriod {
  label: string;
  days: number | null;
}

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
}> = ({ checked, onChange }) => (
  <div className={`toggle-switch ${checked ? 'checked' : ''}`} onClick={onChange}>
    <div className="toggle-switch-handle" />
  </div>
);

const PNLComponent: React.FC<PNLComponentProps> = ({ 
  windowWidth = window.innerWidth,
  tokenAddress,
  userAddress,
  tokenSymbol = 'MON',
  tokenName = 'MON',
  monUsdPrice = 1,
  demoMode = false,
  demoData = {
    pnl: 0,
    entryPrice: 0,
    exitPrice: 0,
    leverage: 0,
  },
  externalUserStats,
  currentPrice = 0,
}) => {

  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>({ label: 'MAX', days: null });
  
  const timePeriods: TimePeriod[] = [
    { label: '1D', days: 1 },
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: 'MAX', days: null }
  ];

  const { pnlData: fetchedPnlData, isLoading, error } = usePNLData(
    (!demoMode && !externalUserStats) ? (tokenAddress || '') : '',
    (!demoMode && !externalUserStats) ? (userAddress || '') : '',
    selectedTimePeriod.days
  );

  const pnlData = useMemo(() => {
    if (demoMode) {
      return {
        balance: 0,
        amountBought: 0,
        amountSold: 0,
        valueBought: 0,
        valueSold: 0,
        valueNet: 0,
        lastPrice: 0,
      };
    }
    
    if (externalUserStats) {
      return {
        balance: externalUserStats.balance,
        amountBought: externalUserStats.amountBought,
        amountSold: externalUserStats.amountSold,
        valueBought: externalUserStats.valueBought,
        valueSold: externalUserStats.valueSold,
        valueNet: externalUserStats.valueNet,
        lastPrice: currentPrice,
      };
    }
    
    return fetchedPnlData;
  }, [demoMode, externalUserStats, fetchedPnlData, currentPrice]);

  // Calculations
  const displayData = useMemo(() => {
    if (demoMode) {
      return {
        ...demoData,
        valueNet: demoData.valueNet ?? 0,
      }
    }

    const pnlPercentage = pnlData.valueBought > 0 
      ? ((pnlData.valueNet / pnlData.valueBought) * 100) 
      : 0;

    const entryPrice = pnlData.amountBought > 0
      ? (pnlData.valueBought / pnlData.amountBought) * monUsdPrice
      : 0;
      
    const exitPrice = pnlData.amountSold > 0 
      ? (pnlData.valueSold / pnlData.amountSold) * monUsdPrice
      : pnlData.lastPrice * monUsdPrice;

    return {
      pnl: pnlPercentage,
      entryPrice: entryPrice,
      exitPrice: exitPrice,
      leverage: 2, // Default to 1x for spot
      valueNet: pnlData.valueNet * monUsdPrice,
      balance: pnlData.balance,
    };
  }, [demoMode, demoData, pnlData, monUsdPrice]);

  const defaultCustomizationSettings: CustomizationSettings = {
    mainTextColor: '#EAEDFF',
    positivePNLColor: '#2FE3AC',
    negativePNLColor: '#ec5757ff',
    rectangleTextColor: '#020307',
    showPNLRectangle: true,
  };

  const [backgroundZoom, setBackgroundZoom] = useState(100);
  const [uploadedBg, setUploadedBg] = useState<string | null>(null);
  const [uploadedImageDimensions, setUploadedImageDimensions] = useState<ImageDimensions | null>(null);
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 50, y: 50 });
  const [currency, setCurrency] = useState(tokenName);
  const [selectedBg, setSelectedBg] = useState(PNLBG2);
  const [customizationSettings, setCustomizationSettings] = useState<CustomizationSettings>(defaultCustomizationSettings);
  const [tempCustomizationSettings, setTempCustomizationSettings] = useState<CustomizationSettings>(defaultCustomizationSettings);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);

  const captureRef = useRef<HTMLDivElement>(null);
  const pickerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const cardRef = useRef<HTMLDivElement>(null);

  const ColorInput = React.memo<ColorInputProps>(({
    color,
    onChange,
    label,
    id,
    defaultColor
  }) => {
    const [inputValue, setInputValue] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const displayValue = isEditing ? inputValue : color.replace('#', '').toUpperCase();

    const validateAndApply = useCallback((value: string) => {
      const cleaned = value.replace(/[^0-9A-Fa-f]/g, '');
      if (cleaned.length === 6) {
        onChange(`#${cleaned}`);
        return true;
      } else if (cleaned.length === 3) {
        const expanded = cleaned.split('').map(c => c + c).join('');
        onChange(`#${expanded}`);
        return true;
      }
      return false;
    }, [onChange]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value.toUpperCase());
    }, []);

    const handleFocus = useCallback(() => {
      setIsEditing(true);
      setInputValue(color.replace('#', '').toUpperCase());
    }, [color]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      if (e.relatedTarget?.classList.contains('refresh-button')) {
        e.target.focus();
        return;
      }

      setIsEditing(false);
      if (inputValue && !validateAndApply(inputValue)) {
        setInputValue('');
      }
    }, [inputValue, validateAndApply]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        setIsEditing(false);
        validateAndApply(inputValue);
        (e.target as HTMLInputElement).blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        setInputValue('');
        (e.target as HTMLInputElement).blur();
      }
    }, [inputValue, validateAndApply]);

    const handleRefreshClick = useCallback(() => {
      onChange(defaultColor);
      setInputValue('');
      setIsEditing(false);
    }, [onChange, defaultColor]);

    const handleColorPickerClick = useCallback((e: React.MouseEvent) => {
      const event = new CustomEvent('colorPickerClick', {
        detail: { id, event: e }
      });
      document.dispatchEvent(event);
    }, [id]);

    return (
      <div className="color-input-row">
        <label className="color-label-inline">{label}</label>
        <div className="color-input-container">
          <div
            className="color-preview"
            style={{ backgroundColor: color }}
            onClick={handleColorPickerClick}
          />
          <input
            type="text"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="hex-input"
            placeholder="FFFFFF"
            maxLength={6}
          />
          <button
            className="refresh-button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleRefreshClick}
            title="Reset to default"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>
      </div>
    );
  });

  const toggleRightPanel = useCallback(() => {
    setShowRightPanel(!showRightPanel);
    if (!showRightPanel) {
      setTempCustomizationSettings(customizationSettings);
    }
  }, [showRightPanel, customizationSettings]);

  const handleApplySettings = useCallback(() => {
    setCustomizationSettings(tempCustomizationSettings);
  }, [tempCustomizationSettings]);

  const captureImage = async () => {
    if (!captureRef.current) return null;

    setIsCapturing(true);
    try {
      return await html2canvas(captureRef.current, {
        useCORS: true,
        backgroundColor: '#000000',
        scale: 2,
        ignoreElements: (element) => {
          return element.classList?.contains('scroll-hint');
        }
      });
    } catch (error) {
      console.error('Error capturing image:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCopyImage = async () => {
    const canvas = await captureImage();
    if (!canvas) return;

    canvas.toBlob(async blob => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        console.log('Image copied to clipboard!');
      } catch (err) {
        console.error('Clipboard write failed:', err);
      }
    }, 'image/png');
  };

  const handleDownload = async () => {
    const canvas = await captureImage();
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'pnl-snapshot.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleTempColorChange = useCallback((key: keyof CustomizationSettings, color: string) => {
    setTempCustomizationSettings(prev => ({ ...prev, [key]: color }));
  }, []);

  const handleTempToggle = useCallback((key: keyof CustomizationSettings) => {
    setTempCustomizationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleColorPickerClickInternal = (id: string, event: React.MouseEvent) => {
    if (activePicker === id) {
      setActivePicker(null);
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
    setActivePicker(id);
  };

  const isUploadedImageSelected = selectedBg === uploadedBg && uploadedBg !== null;

  const checkImageNeedsScrolling = useCallback(() => {
    if (!uploadedImageDimensions || !cardRef.current) return { needsHorizontal: false, needsVertical: false };
    
    const cardRect = cardRef.current.getBoundingClientRect();
    const cardWidth = cardRect.width;
    const cardHeight = cardRect.height;
    
    const { width: imgWidth, height: imgHeight } = uploadedImageDimensions;

    const scaleX = cardWidth / imgWidth;
    const scaleY = cardHeight / imgHeight;
    const baseScale = Math.max(scaleX, scaleY);
    const zoomScale = baseScale * (backgroundZoom / 100);
    
    const scaledWidth = imgWidth * zoomScale;
    const scaledHeight = imgHeight * zoomScale;
    
    const needsHorizontal = scaledWidth > cardWidth;
    const needsVertical = scaledHeight > cardHeight;
    
    return { needsHorizontal, needsVertical };
  }, [uploadedImageDimensions, backgroundZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isUploadedImageSelected) return;
    
    const { needsHorizontal, needsVertical } = checkImageNeedsScrolling();
    if (!needsHorizontal && !needsVertical) return;
    
    e.preventDefault();
    setIsDragging(true);
    setHasInteracted(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  }, [isUploadedImageSelected, checkImageNeedsScrolling]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !isUploadedImageSelected) return;
    
    const { needsHorizontal, needsVertical } = checkImageNeedsScrolling();
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const sensitivity = 0.2;
    
    let newX = backgroundPosition.x;
    let newY = backgroundPosition.y;
    
    if (needsHorizontal) {
      newX = Math.max(0, Math.min(100, backgroundPosition.x - (deltaX * sensitivity)));
    }
    
    if (needsVertical) {
      newY = Math.max(0, Math.min(100, backgroundPosition.y - (deltaY * sensitivity)));
    }
    
    setBackgroundPosition({ x: newX, y: newY });
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, isUploadedImageSelected, dragStart, backgroundPosition, checkImageNeedsScrolling]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleBgSelect = (bg: string) => {
    setSelectedBg(bg);
    setCustomizationSettings(defaultCustomizationSettings);
    setHasInteracted(false);
    setBackgroundZoom(100);
    if (bg !== uploadedBg) {
      setBackgroundPosition({ x: 50, y: 50 });
    }
  };

  const getImageDimensions = (src: string): Promise<ImageDimensions> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          try {
            const dimensions = await getImageDimensions(result);
            setUploadedImageDimensions(dimensions);
            setUploadedBg(result);
            setSelectedBg(result);
            setBackgroundPosition({ x: 50, y: 50 });
            setBackgroundZoom(100);
            setHasInteracted(false);
          } catch (error) {
            console.error('Error getting image dimensions:', error);
            setUploadedBg(result);
            setSelectedBg(result);
            setUploadedImageDimensions(null);
            setBackgroundZoom(100);
            setHasInteracted(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const colorChangeHandlers = useMemo(() => ({
    mainText: (color: string) => handleTempColorChange('mainTextColor', color),
    positivePNL: (color: string) => handleTempColorChange('positivePNLColor', color),
    negativePNL: (color: string) => handleTempColorChange('negativePNLColor', color),
    rectangleText: (color: string) => handleTempColorChange('rectangleTextColor', color),
  }), [handleTempColorChange]);

  const colorInputs = useMemo(() => ({
    mainText: (
      <ColorInput
        color={tempCustomizationSettings.mainTextColor}
        onChange={colorChangeHandlers.mainText}
        label="Main Text"
        id="mainText"
        defaultColor="#EAEDFF"
      />
    ),
    positivePNL: (
      <ColorInput
        color={tempCustomizationSettings.positivePNLColor}
        onChange={colorChangeHandlers.positivePNL}
        label="Positive PNL"
        id="positivePNL"
        defaultColor="#2FE3AC"
      />
    ),
    negativePNL: (
      <ColorInput
        color={tempCustomizationSettings.negativePNLColor}
        onChange={colorChangeHandlers.negativePNL}
        label="Negative PNL"
        id="negativePNL"
        defaultColor="#EC397A"
      />
    ),
    rectangleText: (
      <ColorInput
        color={tempCustomizationSettings.rectangleTextColor}
        onChange={colorChangeHandlers.rectangleText}
        label="Rectangle Text"
        id="rectangleText"
        defaultColor="#020307"
      />
    ),
  }), [tempCustomizationSettings, colorChangeHandlers]);

  const getCurrentColor = (pickerId: string) => {
    const key = pickerId.includes('mainText') ? 'mainTextColor' :
      pickerId.includes('positivePNL') ? 'positivePNLColor' :
        pickerId.includes('negativePNL') ? 'negativePNLColor' :
          'rectangleTextColor';
    return tempCustomizationSettings[key];
  };

  const getSettingKey = (pickerId: string): keyof CustomizationSettings => {
    return pickerId.includes('mainText') ? 'mainTextColor' :
      pickerId.includes('positivePNL') ? 'positivePNLColor' :
        pickerId.includes('negativePNL') ? 'negativePNLColor' :
          'rectangleTextColor';
  };

  const getBackgroundSize = () => {
    if (!isUploadedImageSelected || !uploadedImageDimensions || !cardRef.current) {
      return 'cover';
    }

    const cardRect = cardRef.current.getBoundingClientRect();
    const cardWidth = cardRect.width;
    const cardHeight = cardRect.height;
    const { width: imgWidth, height: imgHeight } = uploadedImageDimensions;

    const scaleX = cardWidth / imgWidth;
    const scaleY = cardHeight / imgHeight;

    const baseScale = Math.max(scaleX, scaleY);
    const zoomScale = baseScale * (backgroundZoom / 100);
    
    const scaledWidth = imgWidth * zoomScale;
    const scaledHeight = imgHeight * zoomScale;

    return `${scaledWidth}px ${scaledHeight}px`;
  };

  const getBackgroundStyle = () => {
    if (isUploadedImageSelected && uploadedImageDimensions) {
      const { needsHorizontal, needsVertical } = checkImageNeedsScrolling();
      
      if (needsHorizontal || needsVertical) {
        return {
          backgroundImage: `url(${selectedBg})`,
          backgroundSize: getBackgroundSize(),
          backgroundPosition: `${backgroundPosition.x}% ${backgroundPosition.y}%`,
          backgroundRepeat: 'no-repeat',
          cursor: isDragging ? 'grabbing' : 'grab',
        };
      }
    }
    
    return {
      backgroundImage: `url(${selectedBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      cursor: 'default',
    };
  };

  // Effects
  useEffect(() => {
    setCurrency(tokenName);
  }, [tokenName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activePicker && pickerRefs.current[activePicker] &&
        !pickerRefs.current[activePicker]?.contains(event.target as Node)) {
        setActivePicker(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePicker]);

  useEffect(() => {
    const handleColorPickerClick = (event: any) => {
      const { id, event: clickEvent } = event.detail;
      handleColorPickerClickInternal(id, clickEvent);
    };

    document.addEventListener('colorPickerClick', handleColorPickerClick);
    return () => document.removeEventListener('colorPickerClick', handleColorPickerClick);
  }, [activePicker]);

  useEffect(() => {
    setTempCustomizationSettings(customizationSettings);
  }, [customizationSettings]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const { needsHorizontal, needsVertical } = checkImageNeedsScrolling();
  const showScrollHint = isUploadedImageSelected && (needsHorizontal || needsVertical) && !hasInteracted && !isCapturing;

  if (isLoading && !demoMode && !externalUserStats) {
    return (
      <div className="pnl-loading">
        <p>Loading trading data...</p>
      </div>
    );
  }

  if (error && !demoMode && !externalUserStats) {
    return (
      <div className="pnl-error">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`pnl-modal-container ${showRightPanel ? 'with-right-panel' : ''} ${windowWidth <= 768 ? 'mobile' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="pnl-modal main-popup">
          <div
            className={`pnl-card ${!isCapturing ? 'pnl-card-display' : ''}`}
            ref={captureRef}
            style={getBackgroundStyle()}
            onMouseDown={handleMouseDown}
          >
              <div ref={cardRef} className="pnl-card-content">
                {showScrollHint && (
                  <div className="scroll-hint" style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    pointerEvents: 'none',
                    zIndex: 1000
                  }}>
                    Drag to scroll
                  </div>
                )}
                
                <div className="pnl-header-section">
                  <div className="pnl-card-header">
                    <img className="pnl-logo" src={LogoText} alt="Logo" crossOrigin="anonymous" />
                  </div>

                  <div className="pnl-token-row">
                    <div className="pnl-token-info-leverage" ref={captureRef}> 
                      <div className="pnl-token-info">
                        <img src={monadicon} className="pnl-token-icon" crossOrigin="anonymous" />
                        <span className="pnl-token-name" style={{ color: customizationSettings.mainTextColor }}>
                          {tokenSymbol || tokenName}
                        </span>
                      </div>
                      {displayData.leverage > 1 && (
                        <div className="pnl-leverage-tag">
                          {displayData.pnl > 0 ? 'LONG' : 'SHORT'} {displayData.leverage}X
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className="pnl-percentage"
                    style={{
                      color: customizationSettings.showPNLRectangle
                        ? customizationSettings.rectangleTextColor
                        : (displayData.pnl > 0 ? customizationSettings.positivePNLColor : customizationSettings.negativePNLColor),
                      backgroundColor: customizationSettings.showPNLRectangle
                        ? (displayData.pnl > 0 ? customizationSettings.positivePNLColor : customizationSettings.negativePNLColor)
                        : 'transparent',
                    }} 
                  >
                    {displayData.pnl > 0 ? '+' : ''}{displayData.pnl.toFixed(2)}%
                  </div>
                </div>

                <div className="pnl-entry-exit-referral">
                  <div className="pnl-entry-exit-group">
                    <div className="pnl-entry">
                      <div className="pnl-entry-label">Entry Price</div>
                      <div className="pnl-entry-value" style={{ color: customizationSettings.mainTextColor }}>
                        ${displayData.entryPrice.toFixed(8)}
                      </div>
                    </div>
                    <div className="pnl-exit">
                      <div className="pnl-exit-label">Exit Price</div>
                      <div className="pnl-exit-value" style={{ color: customizationSettings.mainTextColor }}>
                        ${displayData.exitPrice.toFixed(8)}
                      </div>
                    </div>
                  </div>
                  <div className="pnl-referral">
                    <div className="pnl-referral-label">Referral Code</div>
                    <div className="pnl-referral-value" style={{ color: customizationSettings.mainTextColor }}>
                      {demoMode ? '42069' : 'crystal'}
                    </div>
                  </div>
                </div>
              </div>
          </div>

          {isUploadedImageSelected && (
            <div className="pnl-zoom-controls">
              <label className="zoom-label">Zoom: {backgroundZoom}%</label>
              <input
                type="range"
                min="50"
                max="200"
                value={backgroundZoom}
                onChange={(e) => setBackgroundZoom(Number(e.target.value))}
                className="zoom-slider"
              />
              <div className="zoom-buttons">
                <button 
                  className="zoom-btn"
                  onClick={() => setBackgroundZoom(Math.max(50, backgroundZoom - 10))}
                >
                  -
                </button>
                <button 
                  className="zoom-btn"
                  onClick={() => setBackgroundZoom(100)}
                >
                  Reset
                </button>
                <button 
                  className="zoom-btn"
                  onClick={() => setBackgroundZoom(Math.min(200, backgroundZoom + 10))}
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="pnl-section pnl-layer-middle">
            <div className="pnl-middle-left">
              <button
                className="pnl-box"
                onClick={() => handleBgSelect(PNLBG)}
                style={{
                  backgroundImage: `url(${PNLBG})`,
                  border: selectedBg === PNLBG ? '1px solid #d8dcff' : '1px solid transparent',
                }}
              />
              <button
                className="pnl-box"
                onClick={() => handleBgSelect(PNLBG2)}
                style={{
                  backgroundImage: `url(${PNLBG2})`,
                  border: selectedBg === PNLBG2 ? '1px solid #d8dcff' : '1px solid transparent',
                }}
              />
              {uploadedBg && (
                <button
                  className="pnl-box"
                  onClick={() => setSelectedBg(uploadedBg)}
                  style={{
                    backgroundImage: `url(${uploadedBg})`,
                    border: selectedBg === uploadedBg ? '1px solid #d8dcff' : '1px solid transparent',
                  }}
                />
              )}
            </div>

            <div className="pnl-middle-right">
              <label className="pnl-upload-box">
                Upload File
                <input
                  type="file"
                  accept="image/*"
                  className="pnl-file-input"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>

          <div className="pnl-footer pnl-layer-bottom">
            <div className="pnl-footer-left">
              <button className="pnl-footer-btn" onClick={toggleRightPanel}>
                {showRightPanel ? 'Hide Panel' : 'Customize'}
              </button>
              {timePeriods.map(period => (
                <button 
                  key={period.label} 
                  className={`pnl-footer-btn ${selectedTimePeriod.label === period.label ? 'active' : ''}`}
                  onClick={() => setSelectedTimePeriod(period)}
                  disabled={isLoading}
                >
                  {period.label}
                </button>
              ))}
            </div>
            <div className="pnl-footer-right">
              <button className="pnl-footer-btn" onClick={handleDownload}>Download</button>
              <button className="pnl-footer-btn" onClick={handleCopyImage}>Copy</button>
            </div>
          </div>
        </div>

        <div className={`pnl-modal right-popup ${showRightPanel ? 'show' : ''}`}>
          <div className="right-panel-content">
            <div className="right-panel-header">
              <h3>Customize PNL Colors</h3>
              <button
                className="close-right-panel"
                onClick={() => setShowRightPanel(false)}
                aria-label="Close panel"
              >
                <img src={closebutton} className="close-button-icon" alt="Close" />
              </button>
            </div>

            <div className="customization-body">
              <div className="section">
                <h3 className="pnl-section-title">Text Colors</h3>
                {colorInputs.mainText}
              </div>

              <div className="section">
                <h3 className="pnl-section-title">PNL Colors</h3>
                {colorInputs.positivePNL}
                {colorInputs.negativePNL}
              </div>

              <div className="section">
                <h3 className="pnl-section-title">Layout Options</h3>
                <div className="layout-toggle-row">
                  <span className="layout-toggle-sublabel">Show PNL Rectangle</span>
                  <div className="toggle-switch-wrapper">
                    <ToggleSwitch
                      checked={tempCustomizationSettings.showPNLRectangle}
                      onChange={() => handleTempToggle('showPNLRectangle')}
                    />
                  </div>
                </div>
                {colorInputs.rectangleText}
              </div>
            </div>

            <div className="customization-footer">
              <button className="apply-btn" onClick={handleApplySettings}>
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {activePicker && (
        <div
          className="color-picker-dropdown"
          style={{
            top: `${pickerPosition.top}px`,
            left: `${pickerPosition.left}px`,
          }}
          ref={(el) => pickerRefs.current[activePicker] = el}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <HexColorPicker
            color={getCurrentColor(activePicker)}
            onChange={(color) => {
              const settingKey = getSettingKey(activePicker);
              handleTempColorChange(settingKey, color);
            }}
          />
          <div className="rgb-inputs">
            {['R', 'G', 'B'].map((channel, i) => {
              const currentColor = getCurrentColor(activePicker);
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
                          : parseInt(currentColor.slice(1 + idx * 2, 3 + idx * 2), 16)
                      );
                      const newColor = `#${rgb
                        .map((c) => c.toString(16).padStart(2, '0'))
                        .join('')}`;

                      const settingKey = getSettingKey(activePicker);
                      handleTempColorChange(settingKey, newColor);
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

export default PNLComponent;