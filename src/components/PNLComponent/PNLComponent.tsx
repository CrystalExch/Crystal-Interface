import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { HexColorPicker } from 'react-colorful';
import closebutton from '../../assets/close_button.png';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';
import LogoText from '../../assets/whitecrystal.png';
import PNLBG from '../../assets/lbstand.png';
import PNLBG2 from '../../assets/PNLBG.png';
import globe from '../../assets/globe.svg';
import twitter from '../../assets/twitter.png';
import monadsvg from '../../assets/monad.svg';
import './PNLComponent.css';

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/104695/test/v0.5.5';

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
  showShadows: boolean;
}

const DEFAULT_SETTINGS: CustomizationSettings = {
  mainTextColor: '#EAEDFF',
  positivePNLColor: '#D8DCFF',
  negativePNLColor: '#EA7A7A',
  rectangleTextColor: '#020307',
  showPNLRectangle: true,
  showShadows: false,
};
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
  globe?: HTMLImageElement;
  twitter?: HTMLImageElement;
  closeButton?: HTMLImageElement;
  uploaded?: HTMLImageElement;
  monad?: HTMLImageElement;
  monadicon?: HTMLImageElement;
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
  const [selectedBg, setSelectedBg] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pnl-selected-bg') || PNLBG2;
    }
    return PNLBG2;
  }); const [uploadedBg, setUploadedBg] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pnl-uploaded-bg') || null;
    }
    return null;
  }); const [isUSD, setIsUSD] = useState<boolean>(false);
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

  const [customizationSettings, setCustomizationSettings] = useState<CustomizationSettings>(DEFAULT_SETTINGS);

  const [customBgSettings, setCustomBgSettings] = useState<CustomizationSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pnl-custom-bg-settings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved custom background settings:', e);
        }
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [tempCustomizationSettings, setTempCustomizationSettings] = useState<CustomizationSettings>({
    mainTextColor: '#EAEDFF',
    positivePNLColor: '#D8DCFF',
    negativePNLColor: '#EA7A7A',
    rectangleTextColor: '#020307',
    showPNLRectangle: true,
    showShadows: false,
  });
  const createGlobeSVG = useCallback((fillColor: string) => {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${fillColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe-icon lucide-globe"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;
    const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
    return loadImage(dataUrl);
  }, []);

  const createTwitterSVG = useCallback((fillColor: string) => {
    const svgString = `<svg  viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.08318 6.33193L14.2436 0.333313H13.0208L8.53995 5.54183L4.96112 0.333313H0.833374L6.24526 8.20951L0.833374 14.5H2.05631L6.78818 8.99961L10.5677 14.5H14.6954L9.08288 6.33193H9.08318ZM7.4082 8.2789L6.85987 7.49461L2.49695 1.25392H4.3753L7.89623 6.29036L8.44456 7.07465L13.0213 13.6212H11.143L7.4082 8.2792V8.2789Z" fill="${fillColor}"/></svg>`;
    const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
    return loadImage(dataUrl);
  }, []);

  const createLogoSVG = useCallback((fillColor: string) => {
    const svgString = `<svg version="1.2" fill="${fillColor}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700" width="38" height="50"><path d="m136 388l288-349 121 147-89 107-54-65-113 138 53 66-85 105zm413-115l115 139-289 350-116-140 87-103 56 66 113-138-55-67z"/></svg>`;
    const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
    return loadImage(dataUrl);
  }, []);

  const createMonadSVG = useCallback((fillColor: string) => {
    const svgString = `  <svg width="33" height="32" viewBox="0 0 33 32" xmlns="http://www.w3.org/2000/svg">
     <path d="M16.4452 0C11.8248 0 0.445312 11.3792 0.445312 15.9999C0.445312 20.6206 11.8248 32 16.4452 32C21.0656 32 32.4453 20.6204 32.4453 15.9999C32.4453 11.3794 21.0658 0 16.4452 0ZM13.9519 25.1492C12.0035 24.6183 6.76512 15.455 7.29614 13.5066C7.82716 11.5581 16.9903 6.31979 18.9386 6.8508C20.8871 7.38173 26.1255 16.5449 25.5945 18.4934C25.0635 20.4418 15.9003 25.6802 13.9519 25.1492Z" fill="${fillColor}"  /></svg>`;
    const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
    return loadImage(dataUrl);
  }, []);


const loadImages = useCallback(async () => {
  const monadIconColor = customizationSettings.showPNLRectangle 
    ? '#000000'
    : customizationSettings.negativePNLColor;

  const imagePromises: { [key: string]: Promise<HTMLImageElement> } = {
    logo: createLogoSVG(customizationSettings.mainTextColor),
    bg1: loadImage(PNLBG),
    bg2: loadImage(PNLBG2),
    globe: createGlobeSVG(customizationSettings.mainTextColor),  
    twitter: createTwitterSVG(customizationSettings.mainTextColor),
    closeButton: loadImage(closebutton),
    monad: createMonadSVG(monadIconColor), 
    monadicon: loadImage(monadsvg),
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
}, [uploadedBg, customizationSettings.mainTextColor, customizationSettings.showPNLRectangle, customizationSettings.negativePNLColor, createLogoSVG, createGlobeSVG, createTwitterSVG, createMonadSVG]);
  const applyShadow = useCallback((ctx: CanvasRenderingContext2D) => {
    if (customizationSettings.showShadows) {
      ctx.shadowColor = 'rgba(0, 0, 0, .8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
  }, [customizationSettings.showShadows]);

  const clearShadow = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }, []);
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
      applyShadow(ctx);
      ctx.drawImage(images.logo, 22, 22, 46, 60);
      clearShadow(ctx);
    }

    applyShadow(ctx);
    ctx.fillStyle = customizationSettings.mainTextColor;
    ctx.font = '40px Funnel Display, Arial, sans-serif';
    ctx.fillText(tokenSymbol || tokenName, 32, 105);
    clearShadow(ctx);

    const pnlText = isUSD
      ? `${displayData.monPnl >= 0 ? '+' : '-'}$${formatNumber(Math.abs(displayData.monPnl))}`
      : `${displayData.monPnl >= 0 ? '+' : ''}${formatNumber(displayData.monPnl)}`;

    ctx.font = 'bold 53px Funnel Display, Arial, sans-serif';
    const pnlMetrics = ctx.measureText(pnlText);
    const pnlWidth = 320;
    const pnlHeight = 70;
    const pnlX = 32;
    const pnlY = 160;

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

    if (!isUSD && images.monad) {
      const iconSize = 43;
      let currentX = pnlX + 12;
      let signWidth = 0;

      if (displayData.monPnl < 0) {
        ctx.fillText('-', currentX, pnlY + 8);
        signWidth = 20;
      } else if (displayData.monPnl > 0) {
        ctx.fillText('+', currentX, pnlY + 8);
        signWidth = 34;
      }

      if (displayData.monPnl !== 0) {
        currentX += signWidth;
      }

      ctx.drawImage(images.monad, currentX + 3, pnlY + 12, iconSize, iconSize);

      ctx.fillText(formatNumber(Math.abs(displayData.monPnl)), currentX + iconSize + 8, pnlY + 8);
    } else {
      ctx.fillText(pnlText, pnlX + 12, pnlY + 8);
    }
    const statsY = 255;
    ctx.font = '23px Funnel Display, Arial, sans-serif';
    ctx.fillStyle = customizationSettings.mainTextColor;

    applyShadow(ctx);
    ctx.fillText('PNL', 52, statsY);
    clearShadow(ctx);

    ctx.fillStyle = displayData.monPnl >= 0
      ? customizationSettings.positivePNLColor
      : customizationSettings.negativePNLColor;
    applyShadow(ctx);
    ctx.fillText(`${displayData.monPnl >= 0 ? '+' : ''}${displayData.pnlPercentage.toFixed(2)}%`, 200, statsY);
    clearShadow(ctx);

    ctx.fillStyle = customizationSettings.mainTextColor;
    applyShadow(ctx);
    ctx.fillText('Invested', 52, statsY + 35);
    clearShadow(ctx);

    if (!isUSD && images.monadicon) {
      applyShadow(ctx);
      ctx.drawImage(images.monadicon, 200, statsY + 35, 20, 20);
      clearShadow(ctx);
      applyShadow(ctx);
      ctx.fillText(formatNumber(displayData.entryPrice), 225, statsY + 33);
      clearShadow(ctx);
    } else {
      const investedText = isUSD ? `$${formatNumber(displayData.entryPrice)}` : formatNumber(displayData.entryPrice);
      applyShadow(ctx);
      ctx.fillText(investedText, 200, statsY + 35);
      clearShadow(ctx);
    }

    applyShadow(ctx);
    ctx.fillText('Position', 52, statsY + 70);
    clearShadow(ctx);

    if (!isUSD && images.monadicon) {
      applyShadow(ctx);
      ctx.drawImage(images.monadicon, 200, statsY + 70, 20, 20);
      clearShadow(ctx);
      applyShadow(ctx);
      ctx.fillText(formatNumber(displayData.exitPrice), 225, statsY + 69);
      clearShadow(ctx);
    } else {
      const positionText = isUSD ? `$${formatNumber(displayData.exitPrice)}` : formatNumber(displayData.exitPrice);
      applyShadow(ctx);
      ctx.fillText(positionText, 200, statsY + 70);
      clearShadow(ctx);
    }
    const bottomY = 380;
    ctx.font = '16px Funnel Display, Arial, sans-serif';
    ctx.fillStyle = customizationSettings.mainTextColor;

    if (images.globe) {
      applyShadow(ctx);
      ctx.drawImage(images.globe, 52, bottomY + 29, 17, 17);
      clearShadow(ctx);
    }
    applyShadow(ctx);
    ctx.fillText('crystal.exchange', 74, bottomY + 30);
    clearShadow(ctx);

    if (images.twitter) {
      applyShadow(ctx);
      ctx.drawImage(images.twitter, 223, bottomY + 31, 14, 14);
      clearShadow(ctx);
    }
    applyShadow(ctx);
    ctx.fillText('@CrystalExch', 240, bottomY + 30);
    clearShadow(ctx);

    ctx.textAlign = 'right';
    ctx.font = '24px Funnel Display, Arial, sans-serif';
    applyShadow(ctx);
    ctx.fillText('@crystal', 688, bottomY - 10);
    clearShadow(ctx);
    ctx.font = '16px Funnel Display, Arial, sans-serif';
    applyShadow(ctx);
    ctx.fillText('Save 25% on Fees', 688, bottomY + 25);
    clearShadow(ctx);
  }, [imagesLoaded, images, selectedBg, uploadedBg, displayData, customizationSettings, isUSD, tokenSymbol, tokenName, applyShadow, clearShadow]);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pnl-selected-bg', selectedBg);
    }

    if (uploadedBg && selectedBg === uploadedBg) {
      const saved = localStorage.getItem('pnl-custom-bg-settings');
      if (saved) {
        try {
          const savedSettings = JSON.parse(saved);
          setCustomizationSettings(savedSettings);
        } catch (e) {
          setCustomizationSettings(DEFAULT_SETTINGS);
        }
      } else {
        setCustomizationSettings(DEFAULT_SETTINGS);
      }
    } else {
      setCustomizationSettings(DEFAULT_SETTINGS);
      setShowRightPanel(false);
    }
  }, [selectedBg, uploadedBg]);

  useEffect(() => {
    if (typeof window !== 'undefined' && uploadedBg && selectedBg === uploadedBg) {
      localStorage.setItem('pnl-custom-bg-settings', JSON.stringify(customizationSettings));
    }
  }, [customizationSettings, selectedBg, uploadedBg]);
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
          localStorage.setItem('pnl-uploaded-bg', result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const clearUploadedBg = () => {
    setUploadedBg(null);
    localStorage.removeItem('pnl-uploaded-bg');
    setSelectedBg(PNLBG2);
    setShowRightPanel(false);
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
  const handleOutsideClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.color-picker-dropdown')) {
      setActivePicker(null);
      document.removeEventListener('mousedown', handleOutsideClick);
    }
  };
  const handleColorPickerClick = (id: string, event: React.MouseEvent) => {
    if (activePicker === id) {
      setActivePicker(null);
      document.removeEventListener('mousedown', handleOutsideClick);
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



    document.addEventListener('mousedown', handleOutsideClick);
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
              borderRadius: '6px',
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
                <div className="uploaded-bg-container" style={{ position: 'relative' }}>
                  <button
                    className="pnl-box"
                    onClick={() => setSelectedBg(uploadedBg)}
                    style={{
                      backgroundImage: `url(${uploadedBg})`,
                      border: selectedBg === uploadedBg ? '1px solid #d8dcff' : '1px solid transparent',
                    }}
                  />
                </div>
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
                {isUSD ? 'Switch to MON' : 'Switch to USD'}
              </button>
              {uploadedBg && selectedBg === uploadedBg && (
                <button className="pnl-footer-btn" onClick={toggleRightPanel}>
                  {showRightPanel ? 'Hide Panel' : 'Customize'}
                </button>
              )}
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
                  defaultColor="#EA7A7A"
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
                <div className="layout-toggle-row">
                  <span className="layout-toggle-sublabel">Show Text Shadows</span>
                  <div className="toggle-switch-wrapper">
                    <ToggleSwitch
                      checked={tempCustomizationSettings.showShadows}
                      onChange={() => handleTempToggle('showShadows')}
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