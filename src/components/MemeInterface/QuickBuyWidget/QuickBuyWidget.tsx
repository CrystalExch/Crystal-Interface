import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { encodeFunctionData } from 'viem';
import { CrystalRouterAbi } from '../../../abis/CrystalRouterAbi';
import closebutton from '../../../assets/close_button.png';
import editicon from '../../../assets/edit.svg';
import gas from '../../../assets/gas.svg';
import monadicon from '../../../assets/monadlogo.svg';
import slippage from '../../../assets/slippage.svg';
import squares from '../../../assets/squares.svg';
import switchicon from '../../../assets/switch.svg';
import walleticon from '../../../assets/wallet_icon.png';
import { settings } from '../../../settings';
import {
  showLoadingPopup,
  updatePopup,
} from '../../MemeTransactionPopup/MemeTransactionPopupManager';
import './QuickBuyWidget.css';

interface PendingTransaction {
  id: string;
  type: 'buy' | 'sell';
  amount: string;
  timestamp: number;
  status: 'pending' | 'confirming' | 'complete' | 'error';
}

interface UserStats {
  balance: number;
  amountBought: number;
  amountSold: number;
  valueBought: number;
  valueSold: number;
  valueNet: number;
}
interface QuickBuyWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  tokenSymbol?: string;
  tokenAddress?: string;
  tokenPrice?: number;
  buySlippageValue: string;
  buyPriorityFee: string;
  sellSlippageValue: string;
  sellPriorityFee: string;
  sendUserOperationAsync?: any;
  account?: { connected: boolean; address: string; chainId: number };
  setChain?: () => void;
  activechain: number;
  routerAddress?: string;
  setpopup?: (value: number) => void;
  subWallets?: Array<{ address: string; privateKey: string }>;
  walletTokenBalances?: { [address: string]: any };
  activeWalletPrivateKey?: string;
  setOneCTSigner: (privateKey: string) => void;
  tokenList?: any[];
  isBlurred?: boolean;
  terminalRefetch: any;
  userStats?: UserStats;
  monUsdPrice?: number;
  showUSD?: boolean;
  onToggleCurrency?: () => void;
  showLoadingPopup?: (id: string, config: any) => void;
  updatePopup?: (id: string, config: any) => void;
  tokenImage?: string;
}
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
        top = rect.top + scrollY - tooltipRect.height - 10;
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
      {shouldRender &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`tooltip tooltip-${position} ${isVisible ? 'tooltip-entering' : isLeaving ? 'tooltip-leaving' : ''}`}
            style={{
              position: 'absolute',
              top: `${tooltipPosition.top - 20}px`,
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
const QuickBuyWidget: React.FC<QuickBuyWidgetProps> = ({
  isOpen,
  onClose,
  tokenSymbol = 'TOKEN',
  tokenAddress,
  tokenPrice = 0,
  buySlippageValue,
  buyPriorityFee,
  sellSlippageValue,
  sellPriorityFee,
  sendUserOperationAsync,
  account,
  setChain,
  activechain,
  routerAddress,
  setpopup,
  subWallets = [],
  walletTokenBalances = {},
  activeWalletPrivateKey,
  setOneCTSigner,
  tokenList = [],
  isBlurred = false,
  terminalRefetch,
  userStats = {
    balance: 0,
    amountBought: 0,
    amountSold: 0,
    valueBought: 0,
    valueSold: 0,
    valueNet: 0,
  },
  monUsdPrice = 0,
  showUSD = false,
  onToggleCurrency,
  tokenImage,
}) => {
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('crystal_quickbuy_widget_position');
      if (saved) {
        const savedPosition = JSON.parse(saved);
        const maxX = Math.max(0, window.innerWidth - 430);
        const maxY = Math.max(0, window.innerHeight - 480);
        return {
          x: Math.max(0, Math.min(savedPosition.x || 200, maxX)),
          y: Math.max(0, Math.min(savedPosition.y || 200, maxY)),
        };
      }
      return { x: 200, y: 200 };
    } catch (error) {
      console.error('Error loading QuickBuy widget position:', error);
      return { x: 200, y: 200 };
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [walletNames, setWalletNames] = useState<{ [address: string]: string }>(
    {},
  );
  const [selectedBuyAmount, setSelectedBuyAmount] = useState('1');
  const [selectedSellPercent, setSelectedSellPercent] = useState('25%');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [pendingTransactions, setPendingTransactions] = useState<
    PendingTransaction[]
  >([]);
  const [quickBuyPreset, setQuickBuyPreset] = useState(() => {
    try {
      const saved = localStorage.getItem('crystal_quickbuy_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.quickBuyPreset ?? 1;
      }
      return 1;
    } catch (error) {
      console.error('Error loading QuickBuy preset:', error);
      return 1;
    }
  });
  const [keybindsEnabled, setKeybindsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('crystal_quickbuy_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.keybindsEnabled ?? false;
      }
      return false;
    } catch (error) {
      console.error('Error loading QuickBuy keybinds setting:', error);
      return false;
    }
  });
  const [buyAmounts, setBuyAmounts] = useState(() => {
    try {
      const saved = localStorage.getItem('crystal_quickbuy_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.buyAmounts ?? ['1', '5', '10', '50'];
      }
      return ['1', '5', '10', '50'];
    } catch (error) {
      console.error('Error loading QuickBuy buy amounts:', error);
      return ['1', '5', '10', '50'];
    }
  });
  const [sellPercents, setSellPercents] = useState(() => {
    try {
      const saved = localStorage.getItem('crystal_quickbuy_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.sellPercents ?? ['10%', '25%', '50%', '100%'];
      }
      return ['10%', '25%', '50%', '100%'];
    } catch (error) {
      console.error('Error loading QuickBuy sell percents:', error);
      return ['10%', '25%', '50%', '100%'];
    }
  });
  const [sellMONAmounts, setSellMONAmounts] = useState(() => {
    try {
      const saved = localStorage.getItem('crystal_quickbuy_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.sellMONAmounts ?? ['1', '5', '10', '25'];
      }
      return ['1', '5', '10', '25'];
    } catch (error) {
      console.error('Error loading QuickBuy sell MON amounts:', error);
      return ['1', '5', '10', '25'];
    }
  });
  const [sellMode, setSellMode] = useState<'percent' | 'mon'>(() => {
    try {
      const saved = localStorage.getItem('crystal_quickbuy_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.sellMode ?? 'percent';
      }
      return 'percent';
    } catch (error) {
      console.error('Error loading QuickBuy sell mode:', error);
      return 'percent';
    }
  });
  const [isWalletsExpanded, setIsWalletsExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem('crystal_quickbuy_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.isWalletsExpanded ?? false;
      }
      return false;
    } catch (error) {
      console.error('Error loading QuickBuy wallets expanded state:', error);
      return false;
    }
  });
  const [widgetDimensions, setWidgetDimensions] = useState({
    width: 330,
    height: 480,
  });

  const widgetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentTokenBalance =
    walletTokenBalances?.[account?.address || '']?.[tokenAddress || ''] ?? 0n;
  const currentSellValues =
    sellMode === 'percent' ? sellPercents : sellMONAmounts;
  const pendingBuyCount = pendingTransactions.filter(
    (tx) => tx.type === 'buy',
  ).length;
  const pendingSellCount = pendingTransactions.filter(
    (tx) => tx.type === 'sell',
  ).length;

  const walletsPosition = useMemo(() => {
    const walletsPanelWidth = 320;
    const baseX = position.x + widgetDimensions.width - 4;
    const baseY = position.y;
    const maxWalletsX = window.innerWidth - walletsPanelWidth;

    if (baseX > maxWalletsX)
      return { x: Math.max(10, position.x - walletsPanelWidth), y: baseY };
    return { x: baseX, y: baseY };
  }, [position, widgetDimensions]);

  const isPanelLeft = walletsPosition.x < position.x;

  useEffect(() => {
    try {
      const settings = {
        quickBuyPreset,
        keybindsEnabled,
        buyAmounts,
        sellPercents,
        sellMONAmounts,
        sellMode,
        isWalletsExpanded,
      };
      localStorage.setItem(
        'crystal_quickbuy_settings',
        JSON.stringify(settings),
      );
    } catch (error) {
      console.error('Error saving QuickBuy settings:', error);
    }
  }, [
    quickBuyPreset,
    keybindsEnabled,
    buyAmounts,
    sellPercents,
    sellMONAmounts,
    sellMode,
    isWalletsExpanded,
  ]);

  useEffect(() => {
    const storedWalletNames = localStorage.getItem('crystal_wallet_names');
    if (storedWalletNames) {
      try {
        setWalletNames(JSON.parse(storedWalletNames));
      } catch (error) {
        console.error('Error loading wallet names:', error);
      }
    }
  }, []);

  const handleCopyAddress = useCallback(
    async (address: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const txId = `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      try {
        await navigator.clipboard.writeText(address);
        if (showLoadingPopup && updatePopup) {
          showLoadingPopup(txId, {
            title: 'Address Copied',
            subtitle: `${address.slice(0, 6)}...${address.slice(-4)} copied to clipboard`,
          });
          setTimeout(() => {
            updatePopup(txId, {
              title: 'Address Copied',
              subtitle: `${address.slice(0, 6)}...${address.slice(-4)} copied to clipboard`,
              variant: 'success',
              confirmed: true,
              isLoading: false,
            });
          }, 100);
        }
      } catch (err) {
        console.error('Failed to copy address:', err);
        const textArea = document.createElement('textarea');
        textArea.value = address;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          if (showLoadingPopup && updatePopup) {
            showLoadingPopup(txId, {
              title: 'Address Copied',
              subtitle: `${address.slice(0, 6)}...${address.slice(-4)} copied to clipboard`,
            });
            setTimeout(() => {
              updatePopup(txId, {
                title: 'Address Copied',
                subtitle: `${address.slice(0, 6)}...${address.slice(-4)} copied to clipboard`,
                variant: 'success',
                confirmed: true,
                isLoading: false,
              });
            }, 100);
          }
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr);
          if (showLoadingPopup && updatePopup) {
            showLoadingPopup(txId, {
              title: 'Copy Failed',
              subtitle: 'Unable to copy address to clipboard',
            });
            setTimeout(() => {
              updatePopup(txId, {
                title: 'Copy Failed',
                subtitle: 'Unable to copy address to clipboard',
                variant: 'error',
                confirmed: true,
                isLoading: false,
              });
            }, 100);
          }
        }
        document.body.removeChild(textArea);
      }
    },
    [showLoadingPopup, updatePopup],
  );

  const formatNumberWithCommas = (num: number, decimals = 2) => {
    if (num === 0) return '0';
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    if (num >= 1)
      return num.toLocaleString('en-US', { maximumFractionDigits: decimals });
    return num.toFixed(Math.min(decimals, 8));
  };

  const getWalletBalance = (address: string) => {
    const balances = walletTokenBalances[address];
    if (!balances) return 0;

    const ethToken = tokenList.find(
      (t) => t.address === settings.chainConfig[activechain]?.eth,
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

  const getWalletTokenBalance = (address: string) => {
    const balances = walletTokenBalances[address];
    if (!balances || !tokenAddress) return 0;

    const balance = balances[tokenAddress];
    if (!balance || balance <= 0n) return 0;

    const tokenInfo = tokenList.find((t) => t.address === tokenAddress);
    const decimals = tokenInfo?.decimals || 18;
    return Number(balance) / 10 ** Number(decimals);
  };

  const getWalletTokenCount = (address: string) => {
    const balances = walletTokenBalances[address];
    if (!balances) return 0;

    const ethAddress = settings.chainConfig[activechain]?.eth;
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

  const isWalletActive = (privateKey: string) => {
    return activeWalletPrivateKey === privateKey;
  };

  const handleSetActiveWallet = (privateKey: string) => {
    if (!isWalletActive(privateKey)) {
      localStorage.setItem('crystal_active_wallet_private_key', privateKey);
      setOneCTSigner(privateKey);
      if (terminalRefetch) {
        setTimeout(() => terminalRefetch(), 0);
      }
    } else {
      localStorage.removeItem('crystal_active_wallet_private_key');
      setOneCTSigner('');
      if (terminalRefetch) {
        setTimeout(() => terminalRefetch(), 0);
      }
    }
  };

  useEffect(() => {
    if (isOpen && account?.connected) {
      terminalRefetch();
    }
  }, [isOpen, account?.connected]);

  useEffect(() => {
    const handleResize = () => {
      if (!widgetRef.current) return;

      const rect = widgetRef.current.getBoundingClientRect();
      const actualWidth = rect.width || 330;
      const actualHeight = rect.height || 480;

      setWidgetDimensions({ width: actualWidth, height: actualHeight });

      setPosition((prevPosition) => {
        const maxX = Math.max(0, window.innerWidth - actualWidth);
        const maxY = Math.max(0, window.innerHeight - actualHeight);

        const needsXAdjust = prevPosition.x > maxX;
        const needsYAdjust = prevPosition.y > maxY;

        if (needsXAdjust || needsYAdjust) {
          return {
            x: needsXAdjust ? maxX : prevPosition.x,
            y: needsYAdjust ? maxY : prevPosition.y,
          };
        }

        return prevPosition;
      });
    };

    if (isOpen) {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isOpen]);

  const handleBuyTrade = async (amount: string) => {
    if (
      !account?.connected ||
      !sendUserOperationAsync ||
      !tokenAddress ||
      !routerAddress
    ) {
      if (setpopup) setpopup(4);
      return;
    }

    const currentChainId = Number(account.chainId);

    if (currentChainId != activechain) {
      if (setChain) setChain();
      return;
    }

    const requestedAmount = parseFloat(amount);
    const currentMONBalance = getWalletBalance(account?.address);

    if (requestedAmount > currentMONBalance) {
      const txId = `insufficient-${Date.now()}`;
      if (showLoadingPopup) {
        showLoadingPopup(txId, {
          title: 'Insufficient Balance',
          subtitle: `Need ${amount} MON but only have ${currentMONBalance.toFixed(4)} MON`,
          amount: amount,
          amountUnit: 'MON',
        });
      }

      if (updatePopup) {
        setTimeout(() => {
          updatePopup(txId, {
            title: 'Insufficient Balance',
            subtitle: `You need ${amount} MON but only have ${currentMONBalance.toFixed(4)} MON available`,
            variant: 'error',
            isLoading: false,
          });
        }, 100);
      }
      return;
    }

    const txId = `quickbuy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newTx: PendingTransaction = {
      id: txId,
      type: 'buy',
      amount,
      timestamp: Date.now(),
      status: 'pending',
    };

    setPendingTransactions((prev) => [...prev, newTx]);

    if (showLoadingPopup) {
      showLoadingPopup(txId, {
        title: 'Sending transaction...',
        subtitle: `Buying ${amount} MON worth of ${tokenSymbol}`,
        amount,
        amountUnit: 'MON',
        tokenImage: tokenImage,
      });
    }

    try {
      const valNum = parseFloat(amount);
      const value = BigInt(Math.round(valNum * 1e18));

      const uo = {
        target: routerAddress,
        data: encodeFunctionData({
          abi: CrystalRouterAbi,
          functionName: 'buy',
          args: [true, tokenAddress as `0x${string}`, value, 0n],
        }),
        value,
      };

      if (updatePopup) {
        updatePopup(txId, {
          title: 'Confirming transaction...',
          subtitle: `Buying ${amount} MON worth of ${tokenSymbol}`,
          variant: 'info',
        });
      }

      const op = await sendUserOperationAsync({ uo });

      const expectedTokens =
        tokenPrice > 0 ? parseFloat(amount) / tokenPrice : 0;
      if (updatePopup) {
        updatePopup(txId, {
          title: 'Buy completed!',
          subtitle: `Bought ~${formatNumberWithCommas(expectedTokens, 4)} ${tokenSymbol}`,
          variant: 'success',
          isLoading: false,
        });
      }

      setPendingTransactions((prev) => prev.filter((tx) => tx.id !== txId));
      terminalRefetch();
    } catch (error: any) {
      if (updatePopup) {
        updatePopup(txId, {
          title: 'Buy failed',
          subtitle: error?.message || 'Transaction was rejected',
          variant: 'error',
          isLoading: false,
        });
      }

      setPendingTransactions((prev) => prev.filter((tx) => tx.id !== txId));
    }
  };

  const handleSellTrade = async (value: string) => {
    if (
      !account?.connected ||
      !sendUserOperationAsync ||
      !tokenAddress ||
      !routerAddress
    ) {
      setpopup?.(4);
      return;
    }

    const currentChainId = Number(account.chainId);
    if (currentChainId != activechain) {
      setChain?.();
      return;
    }

    const txId = `quicksell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newTx: PendingTransaction = {
      id: txId,
      type: 'sell',
      amount: value,
      timestamp: Date.now(),
      status: 'pending',
    };

    setPendingTransactions((prev) => [...prev, newTx]);

    if (showLoadingPopup) {
      showLoadingPopup(txId, {
        title: 'Sending transaction...',
        subtitle: `Selling ${value} ${sellMode === 'percent' ? '' : 'MON worth'} of ${tokenSymbol}`,
        amount: value,
        amountUnit: sellMode === 'percent' ? '%' : 'MON',
        tokenImage: tokenImage,
      });
    }

    try {
      let amountTokenWei: bigint;

      if (sellMode === 'percent') {
        const pct = BigInt(parseInt(value.replace('%', ''), 10));
        amountTokenWei =
          pct === 100n
            ? currentTokenBalance > 0n
              ? currentTokenBalance
              : 0n
            : (currentTokenBalance * pct) / 100n;
      } else {
        const mon = parseFloat(value);
        const tokens = tokenPrice > 0 ? mon / tokenPrice : 0;
        amountTokenWei = BigInt(Math.floor(tokens * 1e18));
      }

      if (amountTokenWei <= 0n || amountTokenWei > currentTokenBalance) {
        throw new Error(
          `Invalid sell amount. Trying to sell ${amountTokenWei.toString()} but only have ${currentTokenBalance.toString()}`,
        );
      }

      if (updatePopup) {
        updatePopup(txId, {
          title: 'Confirming sell...',
          subtitle: `Selling ${value} ${sellMode === 'percent' ? '' : 'MON worth'} of ${tokenSymbol}`,
          variant: 'info',
        });
      }

      const sellUo = {
        target: routerAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: CrystalRouterAbi,
          functionName: 'sell',
          args: [true, tokenAddress as `0x${string}`, amountTokenWei, 0n],
        }),
        value: 0n,
      };

      const sellOp = await sendUserOperationAsync({ uo: sellUo });

      const soldTokens = Number(amountTokenWei) / 1e18;
      const expectedMON = soldTokens * tokenPrice;
      if (updatePopup) {
        updatePopup(txId, {
          title: 'Sell completed!',
          subtitle: `Sold ${formatNumberWithCommas(soldTokens, 4)} ${tokenSymbol} for ~${formatNumberWithCommas(expectedMON, 4)} MON`,
          variant: 'success',
          isLoading: false,
        });
      }

      setPendingTransactions((prev) => prev.filter((tx) => tx.id !== txId));
      terminalRefetch();
    } catch (e: any) {
      if (updatePopup) {
        updatePopup(txId, {
          title: 'Sell failed',
          subtitle: e?.message || 'Transaction was rejected',
          variant: 'error',
          isLoading: false,
        });
      }

      setPendingTransactions((prev) => prev.filter((tx) => tx.id !== txId));

      if (String(e?.message || '').includes('Invalid sell amount')) {
        if (updatePopup) {
          updatePopup(txId, {
            title: 'Insufficient balance',
            subtitle: `Not enough ${tokenSymbol} for this sell`,
            variant: 'error',
            isLoading: false,
          });
        }
      }
    }
  };

  useEffect(() => {
    if (!keybindsEnabled || !isOpen || isEditMode) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (['q', 'w', 'e', 'r'].includes(key)) {
        e.preventDefault();
        const buyIndex = ['q', 'w', 'e', 'r'].indexOf(key);
        if (buyIndex < buyAmounts.length) {
          const amount = buyAmounts[buyIndex];
          setSelectedBuyAmount(amount);
          handleBuyTrade(amount);
        }
      }

      if (['a', 's', 'd', 'f'].includes(key)) {
        e.preventDefault();
        const sellIndex = ['a', 's', 'd', 'f'].indexOf(key);
        const currentSellValues =
          sellMode === 'percent' ? sellPercents : sellMONAmounts;
        if (sellIndex < currentSellValues.length) {
          const value = currentSellValues[sellIndex];
          setSelectedSellPercent(value);
          handleSellTrade(value);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [
    keybindsEnabled,
    isOpen,
    isEditMode,
    buyAmounts,
    sellPercents,
    sellMONAmounts,
    sellMode,
    handleBuyTrade,
    handleSellTrade,
  ]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!widgetRef.current || isEditMode) return;

      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'IMG' ||
        target.closest('button') ||
        target.closest('.quickbuy-edit-icon') ||
        target.closest('.close-btn') ||
        target.closest('.quickbuy-settings-display') ||
        target.closest('.quickbuy-preset-controls')
      ) {
        return;
      }

      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
      e.preventDefault();
    },
    [isEditMode],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const maxX = Math.max(0, window.innerWidth - widgetDimensions.width);
      const maxY = Math.max(0, window.innerHeight - widgetDimensions.height);

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    },
    [isDragging, dragOffset, widgetDimensions],
  );

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', () => {
        setIsDragging(false);
        localStorage.setItem(
          'crystal_quickbuy_widget_position',
          JSON.stringify(position),
        );
      });

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', () => {
          setIsDragging(false);
          localStorage.setItem(
            'crystal_quickbuy_widget_position',
            JSON.stringify(position),
          );
        });
      };
    }
  }, [isDragging, position, handleMouseMove]);

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIndex]);

  const handleEditToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditMode(!isEditMode);
      setEditingIndex(null);
      setTempValue('');
    },
    [isEditMode],
  );

  const handleKeybindToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setKeybindsEnabled(!keybindsEnabled);
    },
    [keybindsEnabled],
  );

  const handleSellModeToggle = useCallback(() => {
    setSellMode(sellMode === 'percent' ? 'mon' : 'percent');
  }, [sellMode]);

  const handleBuyButtonClick = useCallback(
    (amount: string, index: number) => {
      if (isEditMode) {
        setEditingIndex(index);
        setTempValue(amount);
      } else {
        setSelectedBuyAmount(amount);
        handleBuyTrade(amount);
      }
    },
    [isEditMode, handleBuyTrade],
  );

  const handleSellButtonClick = useCallback(
    (value: string, index: number) => {
      if (isEditMode) {
        setEditingIndex(index + 100);
        setTempValue(sellMode === 'percent' ? value.replace('%', '') : value);
      } else {
        setSelectedSellPercent(value);
        handleSellTrade(value);
      }
    },
    [isEditMode, sellMode, handleSellTrade],
  );

  const handleInputSubmit = useCallback(() => {
    if (editingIndex === null || tempValue.trim() === '') return;

    if (editingIndex < 100) {
      const newBuyAmounts = [...buyAmounts];
      newBuyAmounts[editingIndex] = tempValue;
      setBuyAmounts(newBuyAmounts);
    } else {
      const sellIndex = editingIndex - 100;
      if (sellMode === 'percent') {
        const newSellPercents = [...sellPercents];
        newSellPercents[sellIndex] = `${tempValue}%`;
        setSellPercents(newSellPercents);
      } else {
        const newSellMONAmounts = [...sellMONAmounts];
        newSellMONAmounts[sellIndex] = tempValue;
        setSellMONAmounts(newSellMONAmounts);
      }
    }

    setEditingIndex(null);
    setTempValue('');
  }, [
    editingIndex,
    tempValue,
    buyAmounts,
    sellPercents,
    sellMONAmounts,
    sellMode,
  ]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleInputSubmit();
      } else if (e.key === 'Escape') {
        setEditingIndex(null);
        setTempValue('');
      }
    },
    [handleInputSubmit],
  );

  const getSellButtonStatus = (value: string) => {
    if (!account?.connected || currentTokenBalance <= 0n) return true;

    if (sellMode === 'percent') {
      return currentTokenBalance == 0n;
    } else {
      const monAmount = parseFloat(value);
      const requiredTokens = tokenPrice > 0 ? monAmount / tokenPrice : 0;
      return requiredTokens > currentTokenBalance / 1e18;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={widgetRef}
        className={`quickbuy-widget ${isDragging ? 'dragging' : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="quickbuy-header" onMouseDown={handleMouseDown}>
          <div className="quickbuy-controls">
            <div className="quickbuy-controls-left">
              <Tooltip
                content={`${keybindsEnabled ? 'Disable Keybinds' : 'Enable Keybinds'}`}
              >
                <button
                  className={`quickbuy-edit-icon  ${keybindsEnabled ? 'active' : ''}`}
                  onClick={handleKeybindToggle}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 -960 960 960"
                    fill="#a6a9b6ff"
                  >
                    <path d="M260-120q-58 0-99-41t-41-99q0-58 41-99t99-41h60v-160h-60q-58 0-99-41t-41-99q0-58 41-99t99-41q58 0 99 41t41 99v60h160v-60q0-58 41-99t99-41q58 0 99 41t41 99q0 58-41 99t-99 41h-60v160h60q58 0 99 41t41 99q0 58-41 99t-99 41q-58 0-99-41t-41-99v-60H400v60q0 58-41 99t-99 41Zm0-80q25 0 42.5-17.5T320-260v-60h-60q-25 0-42.5 17.5T200-260q0 25 17.5 42.5T260-200Zm440 0q25 0 42.5-17.5T760-260q0-25-17.5-42.5T700-320h-60v60q0 25 17.5 42.5T700-200ZM400-400h160v-160H400v160ZM260-640h60v-60q0-25-17.5-42.5T260-760q-25 0-42.5 17.5T200-700q0 25 17.5 42.5T260-640Zm380 0h60q25 0 42.5-17.5T760-700q0-25-17.5-42.5T700-760q-25 0-42.5 17.5T640-700v60Z" />
                  </svg>
                </button>
              </Tooltip>
              <div className="quickbuy-preset-controls">
                <Tooltip content="Preset 1">
                  <button
                    className={`quickbuy-preset-pill ${quickBuyPreset === 1 ? 'active' : ''}`}
                    onClick={() => setQuickBuyPreset(1)}
                  >
                    P1
                  </button>
                </Tooltip>
                <Tooltip content="Preset 2">
                  <button
                    className={`quickbuy-preset-pill ${quickBuyPreset === 2 ? 'active' : ''}`}
                    onClick={() => setQuickBuyPreset(2)}
                  >
                    P2
                  </button>
                </Tooltip>
                <Tooltip content="Preset 3">
                  <button
                    className={`quickbuy-preset-pill ${quickBuyPreset === 3 ? 'active' : ''}`}
                    onClick={() => setQuickBuyPreset(3)}
                  >
                    P3
                  </button>
                </Tooltip>
              </div>
              <Tooltip content="Edit Mode">
                <img
                  src={editicon}
                  alt="Edit"
                  className={`quickbuy-edit-icon ${isEditMode ? 'active' : ''}`}
                  onClick={handleEditToggle}
                />
              </Tooltip>
            </div>

            <div className="quickbuy-controls-right-side">
              {subWallets.length > 0 && (
                <Tooltip content="Toggle Wallets">
                  <button
                    className={`quickbuy-wallets-button ${isWalletsExpanded ? 'active' : ''}`}
                    onClick={() => setIsWalletsExpanded(!isWalletsExpanded)}
                  >
                    <img
                      src={walleticon}
                      alt="Wallet"
                      className="quickbuy-wallets-icon"
                    />
                    <span className="quickbuy-wallets-count">
                      {subWallets.length}
                    </span>
                  </button>
                </Tooltip>
              )}

              <button className="close-btn" onClick={onClose}>
                <img
                  className="quickbuy-close-icon"
                  src={closebutton}
                  alt="Close"
                />
              </button>
            </div>
          </div>
          <div className="quickbuy-drag-handle">
            <img
              src={squares}
              alt="Squares"
              className="quickbuy-squares-icon"
            />
            <img
              src={squares}
              alt="Squares"
              className="quickbuy-squares-icon"
            />
          </div>
        </div>

        <div className="quickbuy-content">
          <div className="buy-section">
            <div className="section-header">
              <span>Buy</span>
              <div className="quickbuy-order-indicator">
                <img
                  className="quickbuy-monad-icon"
                  src={monadicon}
                  alt="Order Indicator"
                />
                {formatNumberWithCommas(
                  getWalletBalance(account?.address || ''),
                  2,
                )}
              </div>
            </div>

            <div className="amount-buttons">
              {buyAmounts.map((amount: any, index: any) => (
                <div key={index} className="button-container">
                  {editingIndex === index ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      onBlur={handleInputSubmit}
                      className="edit-input"
                    />
                  ) : (
                    <button
                      className={`amount-btn ${isEditMode ? 'edit-mode' : ''} ${selectedBuyAmount === amount ? 'active' : ''} ${keybindsEnabled ? 'keybind-enabled' : ''}`}
                      onClick={() => handleBuyButtonClick(amount, index)}
                      disabled={!account?.connected}
                    >
                      <span className="button-amount">{amount}</span>
                      {keybindsEnabled && (
                        <span className="keybind-indicator">
                          {['q', 'w', 'e', 'r'][index]}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="quickbuy-settings-display">
              <Tooltip content="Slippage">
                <div className="quickbuy-settings-item">
                  <img
                    src={slippage}
                    alt="Slippage"
                    className="quickbuy-settings-icon-slippage"
                  />
                  <span className="quickbuy-settings-value">
                    {buySlippageValue}%
                  </span>
                </div>
              </Tooltip>
              <Tooltip content="Priority Fee">
                <div className="quickbuy-settings-item">
                  <img
                    src={gas}
                    alt="Priority Fee"
                    className="quickbuy-settings-icon-priority"
                  />
                  <span className="quickbuy-settings-value">
                    {buyPriorityFee}
                  </span>
                </div>
              </Tooltip>
            </div>
          </div>

          <div className="sell-section">
            <div className="section-header">
              <div className="sell-header-left">
                <span>Sell </span>
                <span className="quickbuy-percent">
                  {sellMode === 'percent' ? '%' : 'MON'}
                </span>
                <button
                  className="sell-mode-toggle"
                  onClick={handleSellModeToggle}
                  title={`Switch to ${sellMode === 'percent' ? 'MON' : '%'} mode`}
                >
                  <img
                    className="quickbuy-switch-icon"
                    src={switchicon}
                    alt="Switch"
                  />
                </button>
              </div>
              <div className="quickbuy-order-indicator">
                <div className="quickbuy-token-balance">
                  <span className="quickbuy-token-amount">
                    {formatNumberWithCommas(userStats.balance, 2)} {tokenSymbol}
                  </span>
                  •
                  <span className="quickbuy-usd-value">
                    $
                    {formatNumberWithCommas(
                      userStats.balance * tokenPrice * monUsdPrice,
                      2,
                    )}
                  </span>
                  •
                  <span className="quickbuy-mon-value">
                    <img
                      className="quickbuy-monad-icon"
                      src={monadicon}
                      alt="Order Indicator"
                    />
                    {formatNumberWithCommas(userStats.balance * tokenPrice, 2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="percent-buttons">
              {currentSellValues.map((value: any, index: any) => {
                const isDisabled = getSellButtonStatus(value);
                return (
                  <div key={index} className="button-container">
                    {editingIndex === index + 100 ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        onBlur={handleInputSubmit}
                        className="edit-input"
                      />
                    ) : (
                      <button
                        className={`percent-btn ${isEditMode ? 'edit-mode' : ''} ${selectedSellPercent === value ? 'active' : ''} ${isDisabled ? 'insufficient' : ''} ${keybindsEnabled ? 'keybind-enabled' : ''}`}
                        onClick={() => handleSellButtonClick(value, index)}
                        disabled={
                          !account?.connected || (!isEditMode && isDisabled)
                        }
                        title={
                          isDisabled && !isEditMode
                            ? `Insufficient balance for ${value}`
                            : ''
                        }
                      >
                        <span className="button-amount">{value}</span>
                        {keybindsEnabled && (
                          <span className="keybind-indicator">
                            {['a', 's', 'd', 'f'][index]}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="quickbuy-settings-display">
              <Tooltip content="Slippage">
                <div className="quickbuy-settings-item">
                  <img
                    src={slippage}
                    alt="Slippage"
                    className="quickbuy-settings-icon"
                  />
                  <span className="quickbuy-settings-value">
                    {sellSlippageValue}%
                  </span>
                </div>
              </Tooltip>
              <Tooltip content="Priority Fee">
                <div className="quickbuy-settings-item">
                  <img
                    src={gas}
                    alt="Priority Fee"
                    className="quickbuy-settings-icon"
                  />
                  <span className="quickbuy-settings-value">
                    {sellPriorityFee}
                  </span>
                </div>
              </Tooltip>
            </div>
          </div>
          <div
            className="quickbuy-portfolio-section"
            onClick={onToggleCurrency}
            style={{ cursor: 'pointer' }}
          >
            <div className="quickbuy-portfolio-stat">
              <div className="quickbuy-portfolio-value bought">
                {showUSD ? (
                  <>
                    <span>$</span>
                    {formatNumberWithCommas(
                      userStats.valueBought * monUsdPrice,
                      1,
                    )}
                  </>
                ) : (
                  <>
                    <img
                      className="quickbuy-monad-icon"
                      src={monadicon}
                      alt="MON"
                    />
                    {formatNumberWithCommas(userStats.valueBought, 1)}
                  </>
                )}
              </div>
            </div>
            <div className="quickbuy-portfolio-stat">
              <div className="quickbuy-portfolio-value sold">
                {showUSD ? (
                  <>
                    <span>$</span>
                    {formatNumberWithCommas(
                      userStats.valueSold * monUsdPrice,
                      1,
                    )}
                  </>
                ) : (
                  <>
                    <img
                      className="quickbuy-monad-icon"
                      src={monadicon}
                      alt="MON"
                    />
                    {formatNumberWithCommas(userStats.valueSold, 1)}
                  </>
                )}
              </div>
            </div>
            <div className="quickbuy-portfolio-stat">
              <div className="quickbuy-portfolio-value holding">
                {showUSD ? (
                  <>
                    <span>$</span>
                    {formatNumberWithCommas(
                      userStats.balance * tokenPrice * monUsdPrice,
                      2,
                    )}
                  </>
                ) : (
                  <>
                    <img
                      className="quickbuy-monad-icon"
                      src={monadicon}
                      alt="MON"
                    />
                    {formatNumberWithCommas(userStats.balance * tokenPrice, 2)}
                  </>
                )}
              </div>
            </div>
            <div className="quickbuy-portfolio-stat pnl">
              <div
                className={`quickbuy-portfolio-value pnl ${userStats.valueNet >= 0 ? 'positive' : 'negative'}`}
              >
                {showUSD ? (
                  <>
                    <span>$</span>
                    {userStats.valueNet >= 0 ? '+' : ''}
                    {formatNumberWithCommas(
                      userStats.valueNet * monUsdPrice,
                      1,
                    )}
                    {userStats.valueBought > 0
                      ? ` (${userStats.valueNet >= 0 ? '+' : ''}${((userStats.valueNet / userStats.valueBought) * 100).toFixed(1)}%)`
                      : ' (0%)'}
                  </>
                ) : (
                  <>
                    <img
                      className="quickbuy-monad-icon"
                      src={monadicon}
                      alt="MON"
                    />
                    {userStats.valueNet >= 0 ? '+' : ''}
                    {formatNumberWithCommas(userStats.valueNet, 1)}
                    {userStats.valueBought > 0
                      ? ` (${userStats.valueNet >= 0 ? '+' : ''}${((userStats.valueNet / userStats.valueBought) * 100).toFixed(1)}%)`
                      : ' (0%)'}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isWalletsExpanded && (
        <div
          className={`quickbuy-wallets-panel ${isPanelLeft ? 'left' : 'right'}`}
          style={{
            left: `${walletsPosition.x}px`,
            top: `${walletsPosition.y}px`,
          }}
        >
          <div className="quickbuy-wallets-header">
            <span className="quickbuy-wallets-title">Wallets</span>
          </div>

          <div className="quickbuy-wallets-list">
            {subWallets.length === 0 ? (
              <div className="quickbuy-wallets-empty">
                <div className="quickbuy-wallets-empty-text">No wallets</div>
                <div className="quickbuy-wallets-empty-subtitle">
                  Create in Portfolio
                </div>
              </div>
            ) : (
              subWallets.map((wallet, index) => {
                const balance = getWalletBalance(wallet.address);
                const isActive = isWalletActive(wallet.privateKey);

                return (
                  <div
                    key={wallet.address}
                    className={`quickbuy-wallet-item ${isActive ? 'active' : ''}`}
                    onClick={(e) => {
                      handleSetActiveWallet(wallet.privateKey);
                      e.stopPropagation();
                    }}
                  >
                    <div className="quickbuy-wallet-checkbox-container">
                      <input
                        type="checkbox"
                        className="quickbuy-wallet-checkbox"
                        checked={isActive}
                        readOnly
                      />
                    </div>

                    <div className="quickbuy-wallet-info">
                      <div className="quickbuy-wallet-name">
                        {getWalletName(wallet.address, index)}
                      </div>
                      <div
                        className="quickbuy-wallet-address"
                        onClick={(e) => handleCopyAddress(wallet.address, e)}
                        style={{ cursor: 'pointer' }}
                      >
                        {wallet.address.slice(0, 4)}...
                        {wallet.address.slice(-4)}
                        <svg
                          className="quickbuy-wallet-address-copy-icon"
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M4 2c-1.1 0-2 .9-2 2v14h2V4h14V2H4zm4 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8zm0 2h14v14H8V8z" />
                        </svg>
                      </div>
                    </div>

                    <div className="quickbuy-wallet-balance">
                      <Tooltip content="MON Balance">
                        <div
                          className={`quickbuy-wallet-balance-amount ${isBlurred ? 'blurred' : ''}`}
                        >
                          <img
                            src={monadicon}
                            className="quickbuy-wallet-mon-icon"
                            alt="MON"
                          />
                          {formatNumberWithCommas(balance, 2)}
                        </div>
                      </Tooltip>
                    </div>

                    <div className="quickbuy-wallet-tokens">
                      {(() => {
                        const tokenBalance = getWalletTokenBalance(
                          wallet.address,
                        );
                        const tokenCount = getWalletTokenCount(wallet.address);

                        if (tokenBalance > 0) {
                          return (
                            <Tooltip content="Tokens">
                              <div
                                className={`quickbuy-wallet-token-amount ${isBlurred ? 'blurred' : ''}`}
                              >
                                {tokenImage && (
                                  <img
                                    src={tokenImage}
                                    className="quickbuy-wallet-token-icon"
                                    alt={tokenSymbol}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                                <span className="quickbuy-wallet-token-balance">
                                  {formatNumberWithCommas(tokenBalance, 2)}
                                </span>
                              </div>
                            </Tooltip>
                          );
                        } else if (tokenCount > 0) {
                          return (
                            <Tooltip content="Tokens">
                              <div className="quickbuy-wallet-token-count">
                                <div className="quickbuy-wallet-token-structure-icons">
                                  <div className="token1"></div>
                                  <div className="token2"></div>
                                  <div className="token3"></div>
                                </div>
                                <span className="quickbuy-wallet-total-tokens">
                                  {tokenCount}
                                </span>
                              </div>
                            </Tooltip>
                          );
                        } else {
                          return (
                            <Tooltip content="Tokens">
                              <div className="quickbuy-wallet-token-count">
                                <div className="quickbuy-wallet-token-structure-icons">
                                  <div className="token1"></div>
                                  <div className="token2"></div>
                                  <div className="token3"></div>
                                </div>
                                <span className="quickbuy-wallet-total-tokens">
                                  0
                                </span>
                              </div>
                            </Tooltip>
                          );
                        }
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default QuickBuyWidget;
