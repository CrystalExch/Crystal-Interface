import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { HexColorPicker } from 'react-colorful';
import closebutton from '../../assets/close_button.png';
import LogoText from '../../assets/whitecrystal.png';
import PNLBG from '../../assets/lbstand.png';
import PNLBG2 from '../../assets/PNLBG.png';
import monadblack from '../../assets/monadblack.svg';
import monadicon from '../../assets/monad.svg';
import globe from '../../assets/globe.svg';
import twitter from '../../assets/twitter.png';
import './PNLComponent.css';

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/104695/test/v0.3.11';

interface PNLData {
  balance: number;
  amountBought: number;
  amountSold: number;
  valueBought: number;
  valueSold: number;
  valueNet: number;
  lastPrice: number;
}

interface TimePeriod {
  label: string;
  days: number | null;
}

interface CustomizationSettings {
  mainTextColor: string;
  positivePNLColor: string;
  negativePNLColor: string;
  rectangleTextColor: string;
  showPNLRectangle: boolean;
}

interface DisplayData {
  monPnl: number;
  pnlPercentage: number;
  entryPrice: number;
  exitPrice: number;
  leverage: number;
  valueNet: number;
  balance?: number;
}

interface PNLComponentProps {
  windowWidth?: number;
  tokenAddress?: string;
  userAddress?: string;
  tokenSymbol?: string;
  tokenName?: string;
  monUsdPrice?: number;
  demoMode?: boolean;
  demoData?: {
    monPnl: number;
    pnlPercentage: number;
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

interface ImageCollection {
  logo?: HTMLImageElement;
  bg1?: HTMLImageElement;
  bg2?: HTMLImageElement;
  monadBlack?: HTMLImageElement;
  monadIcon?: HTMLImageElement;
  globe?: HTMLImageElement;
  twitter?: HTMLImageElement;
  closeButton?: HTMLImageElement;
  uploaded?: HTMLImageElement;
}

interface ColorInputProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
  id: string;
  defaultColor: string;
}

const formatNumber = (num: number, decimals: number = 2): string => {
  if (num === 0) return '0';
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1000000) {
    const formatted = (absNum / 1000000).toFixed(decimals);
    const cleaned = parseFloat(formatted).toString();
    return `${sign}${cleaned}M`;
  } else if (absNum >= 1000) {
    const formatted = (absNum / 1000).toFixed(decimals);
    const cleaned = parseFloat(formatted).toString();
    return `${sign}${cleaned}K`;
  } else {
    return `${sign}${absNum.toFixed(decimals)}`;
  }
};

const usePNLData = (tokenAddress: string, userAddress: string, days: number | null) => {
  const [pnlData, setPnlData] = useState<PNLData>({
    balance: 0,
    amountBought: 0,
    amountSold: 0,
    valueBought: 0,
    valueSold: 0,
    valueNet: 0,
    lastPrice: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
    monPnl: 0,
    pnlPercentage: 0,
    entryPrice: 0,
    exitPrice: 0,
    leverage: 0,
  },
  externalUserStats,
  currentPrice = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<ImageCollection>({});
  const [imagesLoaded, setImagesLoaded] = useState<boolean>(false);
  const [selectedBg, setSelectedBg] = useState<string>(PNLBG2);
  const [uploadedBg, setUploadedBg] = useState<string | null>(null);
  const [isUSD, setIsUSD] = useState<boolean>(false);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(false);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>({ label: 'MAX', days: null });
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

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

  const pnlData = useMemo<PNLData>(() => {
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

  const displayData = useMemo<DisplayData>(() => {
    if (demoMode) {
      const baseData: DisplayData = {
        ...demoData,
        valueNet: demoData.valueNet ?? 0,
      };
      
      if (isUSD) {
        return {
          ...baseData,
          monPnl: baseData.monPnl * monUsdPrice,
          entryPrice: baseData.entryPrice * monUsdPrice,
          exitPrice: baseData.exitPrice * monUsdPrice,
          valueNet: baseData.valueNet * monUsdPrice,
        };
      }
      
      return baseData;
    }
    
    const pnlPercentage = pnlData.valueBought > 0
      ? ((pnlData.valueNet / pnlData.valueBought) * 100)
      : 0;
    const monPnl = pnlData.valueBought > 0
      ? ((pnlData.valueNet))
      : 0;

    const entryPrice = pnlData.amountBought > 0
      ? (pnlData.valueBought)
      : 0;

    const exitPrice = pnlData.amountSold > 0
      ? (pnlData.valueSold)
      : 0;

    const baseData: DisplayData = {
      monPnl: monPnl,
      pnlPercentage: pnlPercentage,
      entryPrice: entryPrice,
      exitPrice: exitPrice,
      leverage: 2,
      valueNet: pnlData.valueNet,
      balance: pnlData.balance,
    };

    if (isUSD) {
      return {
        ...baseData,
        monPnl: baseData.monPnl * monUsdPrice,
        entryPrice: baseData.entryPrice * monUsdPrice,
        exitPrice: baseData.exitPrice * monUsdPrice,
        valueNet: baseData.valueNet * monUsdPrice,
      };
    }

    return baseData;
  }, [demoMode, demoData, pnlData, monUsdPrice, isUSD]);

  const [customizationSettings, setCustomizationSettings] = useState<CustomizationSettings>({
    mainTextColor: '#EAEDFF',
    positivePNLColor: '#D8DCFF',
    negativePNLColor: '#e94e4eff',
    rectangleTextColor: '#020307',
    showPNLRectangle: true,
  });

  const [tempCustomizationSettings, setTempCustomizationSettings] = useState<CustomizationSettings>({
    mainTextColor: '#EAEDFF',
    positivePNLColor: '#D8DCFF',
    negativePNLColor: '#e94e4eff',
    rectangleTextColor: '#020307',
    showPNLRectangle: true,
  });

  const loadImages = useCallback(async () => {
    const imagePromises: { [key: string]: Promise<HTMLImageElement> } = {
      logo: loadImage(LogoText),
      bg1: loadImage(PNLBG),
      bg2: loadImage(PNLBG2),
      monadBlack: loadImage(monadblack),
      monadIcon: loadImage(monadicon),
      globe: loadImage(globe),
      twitter: loadImage(twitter),
      closeButton: loadImage(closebutton)
    };

    if (uploadedBg) {
      imagePromises.uploaded = loadImage(uploadedBg);
    }

    try {
      const loadedImages: ImageCollection = {};
      for (const [key, promise] of Object.entries(imagePromises)) {
        loadedImages[key as keyof ImageCollection] = await promise;
      }
      setImages(loadedImages);
      setImagesLoaded(true);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  }, [uploadedBg]);

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const drawPNLImage = useCallback(() => {
    if (!canvasRef.current || !imagesLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = 720;
    const displayHeight = 450;
    
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    ctx.scale(dpr, dpr);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    let bgImage: HTMLImageElement | undefined;
    if (selectedBg === PNLBG) bgImage = images.bg1;
    else if (selectedBg === PNLBG2) bgImage = images.bg2;
    else if (selectedBg === uploadedBg && images.uploaded) bgImage = images.uploaded;
    else bgImage = images.bg2;
    
    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, displayWidth, displayHeight);
    }
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    if (images.logo) {
      ctx.drawImage(images.logo, 32, 32, 40, 50);
    }
    
    ctx.fillStyle = customizationSettings.mainTextColor;
    ctx.font = '35px Funnel Display, Arial, sans-serif';
    ctx.fillText(tokenSymbol || tokenName, 32, 105);
    
    const pnlText = isUSD 
      ? `${displayData.monPnl >= 0 ? '+' : ''}$${formatNumber(Math.abs(displayData.monPnl))}`
      : `${displayData.monPnl >= 0 ? '+' : ''}${formatNumber(displayData.monPnl)}`;
    
    ctx.font = 'bold 53px Funnel Display, Arial, sans-serif';
    const pnlMetrics = ctx.measureText(pnlText);
    const pnlWidth = 290;
    const pnlHeight = 70;
    const pnlX = 32;
    const pnlY = 150;
    
    if (customizationSettings.showPNLRectangle) {
      ctx.fillStyle = displayData.monPnl >= 0 
        ? customizationSettings.positivePNLColor 
        : customizationSettings.negativePNLColor;
      ctx.fillRect(pnlX, pnlY, pnlWidth, pnlHeight);
      
      ctx.fillStyle = customizationSettings.rectangleTextColor;
    } else {
      ctx.fillStyle = displayData.monPnl >= 0 
        ? customizationSettings.positivePNLColor 
        : customizationSettings.negativePNLColor;
    }
    
    if (!isUSD && images.monadBlack) {
      const iconSize = 45;
      const signWidth = 30;
      
      if (displayData.monPnl < 0) {
        ctx.fillText('-', pnlX + 12, pnlY + 8);
      } else if (displayData.monPnl > 0) {
        ctx.fillText('+', pnlX + 12, pnlY + 8);
      }
      
      ctx.drawImage(images.monadBlack, pnlX + 16 + signWidth, pnlY + 12, iconSize, iconSize);
      
      ctx.fillText(formatNumber(Math.abs(displayData.monPnl)), pnlX + 12 + signWidth + iconSize + 8, pnlY + 8);
    } else {
      ctx.fillText(pnlText, pnlX + 12, pnlY + 8);
    }
    
    const statsY = 255;
    ctx.font = '23px Funnel Display, Arial, sans-serif';
    ctx.fillStyle = customizationSettings.mainTextColor;
    
    ctx.fillText('PNL', 52, statsY);
    ctx.fillStyle = displayData.monPnl >= 0 
      ? customizationSettings.positivePNLColor 
      : customizationSettings.negativePNLColor;
    ctx.fillText(`${displayData.monPnl >= 0 ? '+' : ''}${displayData.pnlPercentage.toFixed(2)}%`, 200, statsY);
    
    ctx.fillStyle = customizationSettings.mainTextColor;
    ctx.fillText('Invested', 52, statsY + 35);
    if (!isUSD && images.monadIcon) {
      ctx.drawImage(images.monadIcon, 200, statsY + 35, 22, 22);
      ctx.fillText(formatNumber(displayData.entryPrice), 230, statsY + 35);
    } else {
      const investedText = isUSD ? `$${formatNumber(displayData.entryPrice)}` : formatNumber(displayData.entryPrice);
      ctx.fillText(investedText, 200, statsY + 35);
    }
    
    ctx.fillText('Position', 52, statsY + 70);
    if (!isUSD && images.monadIcon) {
      ctx.drawImage(images.monadIcon, 200, statsY + 70, 22, 22);
      ctx.fillText(formatNumber(displayData.exitPrice), 230, statsY + 70);
    } else {
      const positionText = isUSD ? `$${formatNumber(displayData.exitPrice)}` : formatNumber(displayData.exitPrice);
      ctx.fillText(positionText, 200, statsY + 70);
    }
    
    const bottomY = 380;
    ctx.font = '16px Funnel Display, Arial, sans-serif';
    ctx.fillStyle = customizationSettings.mainTextColor;
    
    if (images.globe) {
      ctx.drawImage(images.globe, 52, bottomY + 25,  17, 17);
    }
    ctx.fillText('crystal.exchange', 75, bottomY + 25);
    
    if (images.twitter) {
      ctx.drawImage(images.twitter, 220, bottomY + 24, 17, 17);
    }
    ctx.fillText('CrystalExch', 240, bottomY + 25);
    
    ctx.textAlign = 'right';
    ctx.font = '24px Funnel Display, Arial, sans-serif';
    ctx.fillText('@crystal', 668, bottomY - 10);
    ctx.font = '16px Funnel Display, Arial, sans-serif';
    ctx.fillText('Save 25% off Fees', 668, bottomY + 25);
    
  }, [imagesLoaded, images, selectedBg, uploadedBg, displayData, customizationSettings, isUSD, tokenSymbol, tokenName]);

  useEffect(() => {
    if (imagesLoaded) {
      drawPNLImage();
    }
  }, [drawPNLImage, imagesLoaded]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  useEffect(() => {
    setTempCustomizationSettings(customizationSettings);
  }, [customizationSettings]);

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob(async (blob) => {
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

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = 'pnl-snapshot.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setUploadedBg(result);
          setSelectedBg(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplySettings = useCallback(() => {
    setCustomizationSettings(tempCustomizationSettings);
  }, [tempCustomizationSettings]);

  const handleTempColorChange = useCallback((key: keyof CustomizationSettings, color: string) => {
    setTempCustomizationSettings(prev => ({ ...prev, [key]: color }));
  }, []);

  const handleTempToggle = useCallback((key: keyof CustomizationSettings) => {
    setTempCustomizationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleRightPanel = useCallback(() => {
    setShowRightPanel(!showRightPanel);
    if (!showRightPanel) {
      setTempCustomizationSettings(customizationSettings);
    }
  }, [showRightPanel, customizationSettings]);

  const handleColorPickerClick = (id: string, event: React.MouseEvent) => {
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

    return (
      <div className="color-input-row">
        <label className="color-label-inline">{label}</label>
        <div className="color-input-container">
          <div
            className="color-preview"
            style={{ backgroundColor: color }}
            onClick={(e) => handleColorPickerClick(id, e)}
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>
      </div>
    );
  });

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

  if (!imagesLoaded) {
    return (
      <div className="pnl-loading">
        <p>Loading images...</p>
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
          <canvas 
            ref={canvasRef} 
            width={720} 
            height={450}
            style={{ 
              borderRadius: '20px',
              border: '1.5px solid rgba(179, 184, 249, 0.1)',
              marginBottom: '20px',
              display: 'block'
            }}
          />

          <div className="pnl-section pnl-layer-middle">
            <div className="pnl-middle-left">
              <button
                className="pnl-box"
                onClick={() => setSelectedBg(PNLBG)}
                style={{
                  backgroundImage: `url(${PNLBG})`,
                  border: selectedBg === PNLBG ? '1px solid #d8dcff' : '1px solid transparent',
                }}
              />
              <button
                className="pnl-box"
                onClick={() => setSelectedBg(PNLBG2)}
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
              <button 
                className={`pnl-footer-btn ${isUSD ? 'active' : ''}`} 
                onClick={() => setIsUSD(!isUSD)}
              >
                {isUSD ? 'USD' : 'MON'}
              </button>
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
                <ColorInput
                  color={tempCustomizationSettings.mainTextColor}
                  onChange={(color) => handleTempColorChange('mainTextColor', color)}
                  label="Main Text"
                  id="mainText"
                  defaultColor="#EAEDFF"
                />
              </div>

              <div className="section">
                <h3 className="pnl-section-title">PNL Colors</h3>
                <ColorInput
                  color={tempCustomizationSettings.positivePNLColor}
                  onChange={(color) => handleTempColorChange('positivePNLColor', color)}
                  label="Positive PNL"
                  id="positivePNL"
                  defaultColor="#D8DCFF"
                />
                <ColorInput
                  color={tempCustomizationSettings.negativePNLColor}
                  onChange={(color) => handleTempColorChange('negativePNLColor', color)}
                  label="Negative PNL"
                  id="negativePNL"
                  defaultColor="#e94e4eff"
                />
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
                <ColorInput
                  color={tempCustomizationSettings.rectangleTextColor}
                  onChange={(color) => handleTempColorChange('rectangleTextColor', color)}
                  label="Rectangle Text"
                  id="rectangleText"
                  defaultColor="#020307"
                />
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