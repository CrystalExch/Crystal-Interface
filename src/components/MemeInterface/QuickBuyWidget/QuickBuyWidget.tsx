import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { encodeFunctionData } from 'viem';

import {
  showLoadingPopup,
  updatePopup,
} from '../../MemeTransactionPopup/MemeTransactionPopupManager';

import { CrystalLaunchpadToken } from '../../../abis/CrystalLaunchpadToken';
import { CrystalRouterAbi } from '../../../abis/CrystalRouterAbi';
import { NadFunAbi } from '../../../abis/NadFun';
import circle from '../../../assets/circle_handle.png';
import closebutton from '../../../assets/close_button.png';
import editicon from '../../../assets/edit.svg';
import gas from '../../../assets/gas.svg';
import merge from '../../../assets/merge.png';
import monadicon from '../../../assets/monadlogo.svg';
import slippage from '../../../assets/slippage.svg';
import switchicon from '../../../assets/switch.svg';
import walleticon from '../../../assets/wallet_icon.svg';
import { settings } from '../../../settings';
import { zeroXAbi } from '../../../abis/zeroXAbi';
import { zeroXActionsAbi } from '../../../abis/zeroXActionsAbi';
import { CrystalDataHelperAbi } from '../../../abis/CrystalDataHelperAbi';
import { TokenAbi } from '../../../abis/TokenAbi';

import './QuickBuyWidget.css';

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
  token: any;
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
  setpopup: (value: number) => void;
  subWallets?: Array<{ address: string; privateKey: string }>;
  walletTokenBalances?: { [address: string]: any };
  activeWalletPrivateKey?: string;
  tokenList?: any[];
  isBlurred?: boolean;
  terminalRefetch: any;
  userStats?: UserStats;
  monUsdPrice?: number;
  showUSD?: boolean;
  onToggleCurrency?: () => void;
  showLoadingPopup?: (id: string, config: any) => void;
  updatePopup?: (id: string, config: any) => void;
  nonces: any;
  selectedWallets: Set<string>;
  setSelectedWallets: React.Dispatch<React.SetStateAction<Set<string>>>;
  isTerminalDataFetching: any;
  createSubWallet: any;
  setOneCTDepositAddress: any;
  signTypedDataAsync: any;
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

const QuickBuyWidget: React.FC<QuickBuyWidgetProps> = ({
  isOpen,
  onClose,
  token,
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
  nonces,
  selectedWallets,
  setSelectedWallets,
  isTerminalDataFetching,
  createSubWallet,
  setOneCTDepositAddress,
  signTypedDataAsync
}) => {
  if (window.innerWidth < 1020) return (<></>)
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
  const [pendingSpend, setPendingSpend] = useState<Map<string, bigint>>(new Map());

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [walletNames, setWalletNames] = useState<{ [address: string]: string }>(
    {},
  );
  const [selectedBuyAmount, setSelectedBuyAmount] = useState('1');
  const [selectedSellPercent, setSelectedSellPercent] = useState('25%');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState('');
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
        return settings.buyAmounts ?? ['100', '500', '1000', '10000'];
      }
      return ['100', '500', '1000', '10000'];
    } catch (error) {
      console.error('Error loading QuickBuy buy amounts:', error);
      return ['100', '500', '1000', '10000'];
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
        return settings.sellMONAmounts ?? ['100', '500', '1000', '10000'];
      }
      return ['100', '500', '1000', '10000'];
    } catch (error) {
      console.error('Error loading QuickBuy sell MON amounts:', error);
      return ['100', '500', '1000', '10000'];
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
  const distributeEvenly = (totalWei: bigint, n: number): bigint[] => {
    if (n <= 0) return [];
    const base = totalWei / BigInt(n);
    const rem = totalWei % BigInt(n);
    const out = Array<bigint>(n).fill(base);
    out[out.length - 1] = out[out.length - 1] + rem;
    return out;
  };

  const [isConsolidating, setIsConsolidating] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);

  const widgetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentTokenBalance =
    walletTokenBalances?.[account?.address || '']?.[token.id || ''] ?? 0n;
  const currentSellValues =
    sellMode === 'percent' ? sellPercents : sellMONAmounts;

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
    if (num === 0) return '0.00';
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
    if (!balances || !token.id) return 0;

    const balance = balances[token.id];
    if (!balance || balance <= 0n) return 0;

    const tokenInfo = tokenList.find((t) => t.address === token.id);
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

  const selectAllWithBalance = () => {
    const walletsWithBalance = subWallets.filter(
      (wallet) => getWalletBalance(wallet.address) > 0,
    );
    setSelectedWallets(new Set(walletsWithBalance.map((w) => w.address)));
  };

  const handleConsolidateTokens = async () => {
    if (!token.id) return;

    if (selectedWallets.size !== 1) {
      const txId = `consolidate-error-${Date.now()}`;
      showLoadingPopup?.(txId, {
        title: 'Select one destination wallet',
        subtitle: 'Check exactly one wallet to receive all tokens',
      });
      setTimeout(() => {
        updatePopup?.(txId, {
          title: 'Select one destination wallet',
          subtitle: 'Check exactly one wallet to receive all tokens',
          variant: 'error',
          isLoading: false,
        });
      }, 100);
      return;
    }

    const destinationAddr = Array.from(selectedWallets)[0];

    const sourceWallets = subWallets
      .map((w) => w.address)
      .filter((addr) => addr !== destinationAddr)
      .filter((addr) => (walletTokenBalances[addr]?.[token.id] ?? 0n) > 0n);

    if (sourceWallets.length === 0) {
      const txId = `consolidate-error-${Date.now()}`;
      showLoadingPopup?.(txId, {
        title: 'Nothing to consolidate',
        subtitle: `No other wallets hold ${token.symbol}`,
      });
      setTimeout(() => {
        updatePopup?.(txId, {
          title: 'Nothing to consolidate',
          subtitle: `No other wallets hold ${token.symbol}`,
          variant: 'error',
          isLoading: false,
        });
      }, 100);
      return;
    }

    setIsConsolidating(true);
    const txId = `consolidate-${Date.now()}`;
    showLoadingPopup?.(txId, {
      title: 'Consolidating Tokens',
      subtitle: `Sending ${token.symbol} from ${sourceWallets.length} wallets to selected wallet`,
      tokenImage: token.image,
    });

    try {
      const transferPromises = [];
      for (const sourceAddr of sourceWallets) {
        const sourceWallet = subWallets.find((w) => w.address === sourceAddr);
        if (!sourceWallet) continue;

        const balance = walletTokenBalances[sourceAddr]?.[token.id];
        if (!balance || balance <= 0n) continue;

        try {
          const uo = {
            target: token.id as `0x${string}`,
            data: encodeFunctionData({
              abi: CrystalLaunchpadToken,
              functionName: 'transfer',
              args: [destinationAddr as `0x${string}`, balance as bigint],
            }),
            value: 0n,
          };
          const wallet = nonces.current.get(sourceAddr);
          const params = [
            { uo },
            0n,
            0n,
            false,
            sourceWallet.privateKey,
            wallet?.nonce,
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
        } catch (err) {
          console.error(`Failed to consolidate from ${sourceAddr}:`, err);
        }
      }
      const results = await Promise.allSettled(transferPromises);
      const successfulTransfers = results.filter(
        (result) => result.status === 'fulfilled' && result.value === true,
      ).length;
      terminalRefetch();
      updatePopup?.(txId, {
        title: 'Consolidation Complete',
        subtitle: `Consolidated ${token.symbol} from ${successfulTransfers}/${sourceWallets.length} wallets`,
        variant: 'success',
        isLoading: false,
      });

      setSelectedWallets(new Set([destinationAddr]));
    } catch (error: any) {
      updatePopup?.(txId, {
        title: 'Consolidation Failed',
        subtitle: error?.message || 'Failed to consolidate tokens',
        variant: 'error',
        isLoading: false,
      });
    } finally {
      setIsConsolidating(false);
    }
  };
  const selectAllWallets = useCallback(() => {
    const walletsWithToken = subWallets.filter(
      (w) => getWalletTokenBalance(w.address) > 0,
    );

    if (walletsWithToken.length > 0) {
      setSelectedWallets(new Set(walletsWithToken.map((w) => w.address)));
    } else {
      setSelectedWallets(new Set(subWallets.map((w) => w.address)));
    }
  }, [subWallets, setSelectedWallets, getWalletTokenBalance]);

  const unselectAllWallets = useCallback(() => {
    setSelectedWallets(new Set());
  }, [setSelectedWallets]);

  const selectAllWithBalanceWithoutToken = useCallback(() => {
    const walletsWithoutToken = subWallets.filter(
      (w) => getWalletTokenBalance(w.address) === 0,
    );
    const walletsWithBalance = walletsWithoutToken.filter(
      (wallet) => getWalletBalance(wallet.address) > 0,
    );
    setSelectedWallets(new Set(walletsWithBalance.map((w) => w.address)));
  }, [subWallets, setSelectedWallets, getWalletTokenBalance, getWalletBalance]);

  const handleSplitTokens = async () => {
    if (selectedWallets.size === 0 || !token.id) return;

    const selected = Array.from(selectedWallets);

    const sourceAddr = selected.find(
      (addr) => (walletTokenBalances[addr]?.[token.id] ?? 0n) > 0n,
    );
    if (!sourceAddr) {
      const txId = `split-error-${Date.now()}`;
      showLoadingPopup?.(txId, {
        title: 'No Tokens to Split',
        subtitle: 'None of the selected wallets have tokens to split',
      });
      setTimeout(
        () =>
          updatePopup?.(txId, {
            title: 'No Tokens to Split',
            subtitle: 'None of the selected wallets have tokens to split',
            variant: 'error',
            isLoading: false,
          }),
        100,
      );
      return;
    }

    const sourceBalance: bigint =
      walletTokenBalances[sourceAddr]?.[token.id] ?? 0n;
    if (sourceBalance <= 0n) {
      const txId = `split-error-${Date.now()}`;
      showLoadingPopup?.(txId, {
        title: 'Insufficient Source Balance',
        subtitle: 'Source wallet has 0 tokens',
      });
      setTimeout(
        () =>
          updatePopup?.(txId, {
            title: 'Insufficient Source Balance',
            subtitle: 'Source wallet has 0 tokens',
            variant: 'error',
            isLoading: false,
          }),
        100,
      );
      return;
    }

    if (selected.length < 2) {
      const txId = `split-error-${Date.now()}`;
      showLoadingPopup?.(txId, {
        title: 'Need More Wallets',
        subtitle: 'Select at least 2 wallets to split tokens',
      });
      setTimeout(
        () =>
          updatePopup?.(txId, {
            title: 'Need More Wallets',
            subtitle: 'Select at least 2 wallets to split tokens',
            variant: 'error',
            isLoading: false,
          }),
        100,
      );
      return;
    }

    setIsSplitting(true);
    const txId = `split-${Date.now()}`;
    showLoadingPopup?.(txId, {
      title: 'Splitting Tokens',
      subtitle: `Redistributing ${token.symbol} across ${selected.length} wallets (±20%)`,
      tokenImage: token.image,
    });

    try {
      // random weights for all selected wallets
      const BP = 10_000;
      const VAR = 2_000;
      const weights: number[] = selected.map(() => {
        const delta = Math.floor(Math.random() * (2 * VAR + 1)) - VAR;
        return Math.max(1, BP + delta);
      });
      const sumW = weights.reduce((a, b) => a + b, 0);
      const sumWBig = BigInt(sumW);

      // target balances each wallet should have after split
      const desired: Record<string, bigint> = {};
      let allocated = 0n;
      for (let i = 0; i < selected.length; i++) {
        if (i === selected.length - 1) {
          // last wallet takes the remainder
          desired[selected[i]] = sourceBalance - allocated;
        } else {
          const amt = (sourceBalance * BigInt(weights[i])) / sumWBig;
          desired[selected[i]] = amt;
          allocated += amt;
        }
      }

      // build transfer plan: source sends difference to others
      const plan: { to: string; amount: bigint }[] = [];
      for (const addr of selected) {
        if (addr === sourceAddr) continue;
        const targetAmt = desired[addr];
        if (targetAmt > 0n) {
          plan.push({ to: addr, amount: targetAmt });
        }
      }

      if (plan.length === 0) {
        const txId2 = `split-error-${Date.now()}`;
        showLoadingPopup?.(txId2, {
          title: 'Split amounts are zero',
          subtitle: 'Try selecting fewer wallets',
        });
        setTimeout(
          () =>
            updatePopup?.(txId2, {
              title: 'Split amounts are zero',
              subtitle: 'Try selecting fewer wallets',
              variant: 'error',
              isLoading: false,
            }),
          100,
        );
        setIsSplitting(false);
        return;
      }

      // send transfers
      const sourceWalletData = subWallets.find((w) => w.address === sourceAddr);
      if (!sourceWalletData) throw new Error('Source wallet not found');

      const transferPromises = [];
      for (const { to, amount } of plan) {
        try {
          const uo = {
            target: token.id as `0x${string}`,
            data: encodeFunctionData({
              abi: CrystalLaunchpadToken,
              functionName: 'transfer',
              args: [to as `0x${string}`, amount],
            }),
            value: 0n,
          };

          const wallet = nonces.current.get(sourceAddr);
          const params = [
            { uo },
            0n,
            0n,
            false,
            sourceWalletData.privateKey,
            wallet?.nonce,
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
        } catch (err) {
          console.error(`Split transfer failed to ${to}:`, err);
        }
      }

      const results = await Promise.allSettled(transferPromises);
      const successfulTransfers = results.filter(
        (result) => result.status === 'fulfilled' && result.value === true,
      ).length;

      terminalRefetch();
      updatePopup?.(txId, {
        title: 'Split Complete',
        subtitle: `Sent ${token.symbol} to ${successfulTransfers}/${plan.length} wallets`,
        variant: 'success',
        isLoading: false,
      });

      setSelectedWallets(new Set());
    } catch (error: any) {
      updatePopup?.(txId, {
        title: 'Split Failed',
        subtitle: error?.message || 'Failed to split tokens',
        variant: 'error',
        isLoading: false,
      });
    } finally {
      setIsSplitting(false);
    }
  };

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

  const getMaxSpendableWei = (addr: string): bigint => {
    const balances = walletTokenBalances[addr];
    if (!balances) return 0n;

    const ethToken = tokenList.find(
      (t) => t.address === settings.chainConfig[activechain].eth,
    );
    if (!ethToken || !balances[ethToken.address]) return 0n;

    const raw = balances[ethToken.address];
    if (raw <= 0n) return 0n;

    const gasReserve = BigInt(settings.chainConfig[activechain].gasamount ?? 0);
    const safe = raw > gasReserve ? raw - gasReserve : 0n;

    const pending = pendingSpend.get(addr) || 0n;
    return safe > pending ? safe - pending : 0n;
  };

  const handleBuyTrade = async (amount: string) => {
    if (!sendUserOperationAsync || !token.id || !routerAddress) {
      setpopup?.(4);
      return;
    }

    const currentChainId = Number(account?.chainId);
    if (account?.connected && currentChainId !== activechain) {
      setChain?.();
      return;
    }

    const totalMon = parseFloat(amount || '0');
    if (!isFinite(totalMon) || totalMon <= 0) return;
    const totalWei = BigInt(Math.round(totalMon * 1e18));

    let targets: string[] = Array.from(selectedWallets);
    if (targets.length === 0) {
      const txId = `quickbuy-error-${Date.now()}`;
      updatePopup?.(txId, {
        title: 'Insufficient Balance',
        subtitle: 'No wallets selected with funds to use',
        variant: 'error',
        isLoading: false,
      });
      return;
    }

    // Filter out wallets that don't have enough balance to cover gas
    const gasReserve = BigInt(settings.chainConfig[activechain].gasamount ?? 0);

    // First pass: check if wallets have minimum balance for gas
    targets = targets.filter(addr => {
      const balances = walletTokenBalances[addr];
      if (!balances) return false;

      const ethToken = tokenList.find(
        (t) => t.address === settings.chainConfig[activechain].eth,
      );
      if (!ethToken || !balances[ethToken.address]) return false;

      const raw = balances[ethToken.address];
      return raw > gasReserve; // Only include wallets with balance greater than gas reserve
    });

    if (targets.length === 0) {
      const txId = `quickbuy-error-${Date.now()}`;
      updatePopup?.(txId, {
        title: 'Insufficient Balance',
        subtitle: 'No selected wallets have enough balance to cover gas costs',
        variant: 'error',
        isLoading: false,
      });
      return;
    }

    let totalAvailable = 0n;
    for (const addr of targets) {
      const maxWei = getMaxSpendableWei(addr);
      totalAvailable += maxWei;
    }

    if (totalAvailable < totalWei) {
      const txId = `quickbuy-error-${Date.now()}`;
      updatePopup?.(txId, {
        title: 'Insufficient Balance',
        subtitle: `Need ${(Number(totalWei) / 1e18).toFixed(2)} MON but only ${(Number(totalAvailable) / 1e18).toFixed(2)} MON available after gas reserves`,
        variant: 'error',
        isLoading: false,
      });
      return;
    }

    const txId = `quickbuy-batch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    showLoadingPopup?.(txId, {
      title: 'Sending batch buy...',
      subtitle: `Buying ${amount} MON of ${token.symbol} across ${targets.length} wallet${targets.length > 1 ? 's' : ''}`,
      amount,
      amountUnit: 'MON',
      tokenImage: token.image,
    });

    let remaining = totalWei;
    const plan: { addr: string; amount: bigint }[] = [];

    for (const addr of targets) {
      const maxWei = getMaxSpendableWei(addr);
      const fairShare = totalWei / BigInt(targets.length);
      const allocation = fairShare > maxWei ? maxWei : fairShare;
      plan.push({ addr, amount: allocation });
      remaining -= allocation;
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
      updatePopup?.(txId, {
        title: 'Batch buy failed',
        subtitle: 'Not enough MON across selected wallets',
        variant: 'error',
        isLoading: false,
      });
      return;
    }

    setPendingSpend((prev) => {
      const updated = new Map(prev);
      for (const { addr, amount } of plan) {
        const current = updated.get(addr) || 0n;
        updated.set(addr, current + amount);
      }
      return updated;
    });

    try {
      const transferPromises: Promise<boolean>[] = [];

      for (const { addr, amount: partWei } of plan) {
        if (partWei <= 0n) continue;

        const wally = subWallets.find((w) => w.address === addr);
        const pk = wally?.privateKey ?? activeWalletPrivateKey;
        if (!pk) continue;
        const isNadFun = token.source === 'nadfun';
        const contractAddress = isNadFun
        ? token.migrated ? settings.chainConfig[activechain].nadFunDexRouter : settings.chainConfig[activechain].nadFunRouter
        : routerAddress;

        let uo;
        if (isNadFun) {
          if (token.migrated) {
            let minOutput = BigInt(Math.floor(Number(partWei) / (token.price || 1) * (1 - Number(buySlippageValue) / 100)))
            const actions: any = []
            actions.push(encodeFunctionData({
              abi: zeroXActionsAbi,
              functionName: 'BASIC',
              args: [settings.chainConfig[activechain].eth, 9900n, contractAddress, 100n, encodeFunctionData({
                abi: NadFunAbi,
                functionName: 'buy',
                args: [{
                  amountOutMin: BigInt(minOutput == 0n ? 1n : minOutput),
                  token: token.id as `0x${string}`,
                  to: addr as `0x${string}`,
                  deadline: 0n,
                }],
              })],
            }))
            actions.push(encodeFunctionData({
              abi: zeroXActionsAbi,
              functionName: 'BASIC',
              args: [settings.chainConfig[activechain].eth, 10000n, settings.chainConfig[activechain].feeAddress, 0n, '0x'],
            }))
            uo = {
              target: settings.chainConfig[activechain].zeroXSettler as `0x${string}`,
              data: encodeFunctionData({
                abi: zeroXAbi,
                functionName: 'execute',
                args: [{
                  recipient: addr as `0x${string}`,
                  buyToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                  minAmountOut: BigInt(0n),
                }, actions, '0x0000000000000000000000000000000000000000000000000000000000000000'],
              }),
              value: partWei,
            };
          }
          else {
            const fee = 99000n;
            const iva = partWei * fee / 100000n;
            const vNative = token.reserveQuote + iva;
            const vToken = (((token.reserveQuote * token.reserveBase) + vNative - 1n) / vNative);
            const output = Number(token.reserveBase - vToken) * (1 / (1 + (Number(buySlippageValue) / 100)));

            const actions: any = []
            actions.push(encodeFunctionData({
              abi: zeroXActionsAbi,
              functionName: 'BASIC',
              args: [settings.chainConfig[activechain].eth, 9900n, contractAddress, 100n, encodeFunctionData({
                abi: NadFunAbi,
                functionName: 'buy',
                args: [{
                  amountOutMin: BigInt(output),
                  token: token.id as `0x${string}`,
                  to: addr as `0x${string}`,
                  deadline: 0n,
                }],
              })],
            }))
            actions.push(encodeFunctionData({
              abi: zeroXActionsAbi,
              functionName: 'BASIC',
              args: [settings.chainConfig[activechain].eth, 10000n, settings.chainConfig[activechain].feeAddress, 0n, '0x'],
            }))
            uo = {
              target: settings.chainConfig[activechain].zeroXSettler as `0x${string}`,
              data: encodeFunctionData({
                abi: zeroXAbi,
                functionName: 'execute',
                args: [{
                  recipient: addr as `0x${string}`,
                  buyToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                  minAmountOut: BigInt(0n),
                }, actions, '0x0000000000000000000000000000000000000000000000000000000000000000'],
              }),
              value: partWei,
            };
          }
        } else {
          const fee = 99000n;
          const iva = partWei * fee / 100000n;
          const vNative = token.reserveQuote + iva;
          const vToken = (((token.reserveQuote * token.reserveBase) + vNative - 1n) / vNative);
          const output = Number(token.reserveBase - vToken) * (1 / (1 + (Number(buySlippageValue) / 100)));

          uo = {
            target: contractAddress as `0x${string}`,
            data: encodeFunctionData({
              abi: CrystalRouterAbi,
              functionName: 'buy',
              args: [true, token.id as `0x${string}`, partWei, BigInt(output)],
            }),
            value: partWei,
          };
        }


        const wallet = nonces.current.get(addr);
        const params = [{ uo }, 0n, 0n, false, pk, wallet?.nonce, true, false, 1, addr];
        if (wallet) wallet.nonce += 1;
        wallet?.pendingtxs.push(params);

        const transferPromise = sendUserOperationAsync(...params)
          .then(() => {
            if (wallet)
              wallet.pendingtxs = wallet.pendingtxs.filter((p: any) => p[5] != params[5]);
            return true;
          })
          .catch(() => {
            if (wallet)
              wallet.pendingtxs = wallet.pendingtxs.filter((p: any) => p[5] != params[5]);
            return false;
          });

        transferPromises.push(transferPromise);
      }

      if (transferPromises.length === 0) {
        updatePopup?.(txId, {
          title: 'No transactions executed',
          subtitle: 'Unable to process buy transactions for selected wallets',
          variant: 'error',
          isLoading: false,
        });
        return;
      }

      const results = await Promise.allSettled(transferPromises);
      const successfulTransfers = results.filter(
        (r) => r.status === 'fulfilled' && r.value === true,
      ).length;

      const totalMonBought = Number(totalWei) / 1e18;

      updatePopup?.(txId, {
        title: `Bought ${totalMonBought} MON Worth`,
        subtitle: `Distributed across ${successfulTransfers} wallet${successfulTransfers !== 1 ? 's' : ''}`,
        variant: 'success',
        isLoading: false,
      });
    } catch (error: any) {
      updatePopup?.(txId, {
        title: 'Batch buy failed',
        subtitle: error?.message || 'One or more transactions failed',
        variant: 'error',
        isLoading: false,
      });
    } finally {
      setPendingSpend((prev) => {
        const updated = new Map(prev);
        for (const { addr, amount } of plan) {
          const cur = updated.get(addr) || 0n;
          updated.set(addr, cur >= amount ? cur - amount : 0n);
        }
        return updated;
      });
    }
  };

  const handleSellTrade = async (value: string) => {
    if (!sendUserOperationAsync || !token.id || !routerAddress) {
      setpopup?.(4);
      return;
    }

    const currentChainId = Number(account?.chainId);
    if (account?.connected && currentChainId != activechain) {
      setChain?.();
      return;
    }
    let targets: string[] = Array.from(selectedWallets);
    if (targets.length === 0) {
      const txId = `quicksell-error-${Date.now()}`;
      updatePopup?.(txId, {
        title: 'Insufficient Balance',
        subtitle: 'No wallets selected with tokens to sell',
        variant: 'error',
        isLoading: false,
      });
      return;
    }
    const isNadFun = token.source === 'nadfun';
    const gasReserve = BigInt(settings.chainConfig[activechain].gasamount ?? 0);
    targets = targets.filter(addr => {
      const tokenBalance = walletTokenBalances[addr]?.[token.id] ?? 0n;
      if (tokenBalance <= 0n) return false;

      const balances = walletTokenBalances[addr];
      if (!balances) return false;

      const ethToken = tokenList.find(
        (t) => t.address === settings.chainConfig[activechain].eth,
      );
      if (!ethToken || !balances[ethToken.address]) return false;

      const monBalance = balances[ethToken.address];
      return monBalance > gasReserve
    });

    if (targets.length === 0) {
      const txId = `quicksell-error-${Date.now()}`;
      updatePopup?.(txId, {
        title: 'Insufficient Balance',
        subtitle: 'No wallets have both tokens to sell and enough MON for gas',
        variant: 'error',
        isLoading: false,
      });
      return;
    }
    const txId = `quicksell-batch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    showLoadingPopup?.(txId, {
      title: 'Sending batch sell...',
      subtitle: `Selling ${sellMode === 'percent' ? value + '' : value + ' MON'} of ${token.symbol} across ${targets.length} wallet${targets.length > 1 ? 's' : ''}`,
      amount: value,
      amountUnit: sellMode === 'percent' ? '%' : 'MON',
      tokenImage: token.image,
    });
    const sellContractAddress = isNadFun
    ? token.migrated ? settings.chainConfig[activechain].nadFunDexRouter : settings.chainConfig[activechain].nadFunRouter
    : routerAddress;

    try {
      let skippedZero = 0;
      let skippedInsufficient = 0;
      const transferPromises = [];
      if (sellMode === 'percent') {
        const pct = BigInt(parseInt(value.replace('%', ''), 10));
        for (const addr of targets) {
          const balWei: bigint =
            walletTokenBalances[addr]?.[token.id] ?? 0n;
          let amountWei = pct >= 100n ? balWei : (balWei * pct) / 100n;

          if (amountWei <= 0n) {
            skippedZero++;
            continue;
          }

          const wally = subWallets.find((w) => w.address === addr);
          const pk = wally?.privateKey ?? activeWalletPrivateKey;
          if (!pk) {
            skippedInsufficient++;
            continue;
          }
          let uo;
          if (isNadFun) {
            const actions: any = []
            let inputAmountWei = BigInt(Math.floor(Number(amountWei) * token.price * (1 - Number(sellSlippageValue) / 100)))
            const settler = settings.chainConfig[activechain].zeroXSettler as `0x${string}`
            const sellToken = token.id as `0x${string}`
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)
            if ((token?.allowances?.[addr.toLowerCase()]?.allowance || 0n) < amountWei) {
              const nonce = token?.allowances?.[addr.toLowerCase()]?.nonce ?? 0n
            
              const signature = await signTypedDataAsync(
                {
                  domain: {
                    name: token.name,
                    version: '1',
                    chainId: activechain,
                    verifyingContract: sellToken,
                  },
                  types: {
                    Permit: [
                      { name: 'owner', type: 'address' },
                      { name: 'spender', type: 'address' },
                      { name: 'value', type: 'uint256' },
                      { name: 'nonce', type: 'uint256' },
                      { name: 'deadline', type: 'uint256' },
                    ],
                  },
                  primaryType: 'Permit',
                  message: {
                    owner: addr,
                    spender: settings.chainConfig[activechain].zeroXAllowanceHolder,
                    value: 115792089237316195423570985008687907853269984665640564039457584007913129639935n,
                    nonce,
                    deadline,
                  },
                }, wally?.privateKey
              )
              
              const sigHex = signature.slice(2)
              const r = (`0x${sigHex.slice(0, 64)}`) as `0x${string}`
              const s = (`0x${sigHex.slice(64, 128)}`) as `0x${string}`
              const v = Number(`0x${sigHex.slice(128, 130)}`)
              
              actions.push(encodeFunctionData({
                abi: zeroXActionsAbi,
                functionName: 'BASIC',
                args: ['0x0000000000000000000000000000000000000000', 0n, settings.chainConfig[activechain].balancegetter, 0n, encodeFunctionData({
                  abi: CrystalDataHelperAbi,
                  functionName: 'tryPermit',
                  args: [
                    sellToken,
                    addr as `0x${string}`,
                    settings.chainConfig[activechain].zeroXAllowanceHolder,
                    115792089237316195423570985008687907853269984665640564039457584007913129639935n,
                    deadline,
                    v,
                    r,
                    s
                  ],
                })],
              }))
            }
            actions.push(encodeFunctionData({
              abi: zeroXActionsAbi,
              functionName: 'BASIC',
              args: ['0x0000000000000000000000000000000000000000', 0n, settings.chainConfig[activechain].balancegetter, 0n, encodeFunctionData({
                abi: zeroXActionsAbi,
                functionName: 'transferFrom',
                args: [settings.chainConfig[activechain].zeroXAllowanceHolder, sellToken, addr as `0x${string}`, settler, amountWei],
              })],
            }))
            actions.push(encodeFunctionData({
              abi: zeroXActionsAbi,
              functionName: 'BASIC',
              args: [token.id, 10000n, sellContractAddress, 4n, encodeFunctionData({
                abi: NadFunAbi,
                functionName: 'sell',
                args: [{
                  amountIn: 0n,
                  amountOutMin: inputAmountWei,
                  token: token.id as `0x${string}`,
                  to: settler as `0x${string}`,
                  deadline: deadline,
                }],
              })],
            }))
            actions.push(encodeFunctionData({
              abi: zeroXActionsAbi,
              functionName: 'BASIC',
              args: [settings.chainConfig[activechain].eth, 100n, settings.chainConfig[activechain].feeAddress, 0n, '0x'],
            }))
            actions.push(encodeFunctionData({
              abi: zeroXActionsAbi,
              functionName: 'BASIC',
              args: [settings.chainConfig[activechain].eth, 10000n, addr as `0x${string}`, 0n, '0x'],
            }))
            uo = {
              target: settings.chainConfig[activechain].zeroXAllowanceHolder as `0x${string}`,
              data: encodeFunctionData({
                abi: zeroXActionsAbi,
                functionName: 'exec',
                args: [settings.chainConfig[activechain].balancegetter, sellToken, 115792089237316195423570985008687907853269984665640564039457584007913129639935n, settler, encodeFunctionData({
                  abi: zeroXAbi,
                  functionName: 'execute',
                  args: [{
                    recipient: addr as `0x${string}`,
                    buyToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                    minAmountOut: BigInt(0n),
                  }, actions, '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'],
                })],
              }),
              value: 0n,
            };
          } else {
            uo = {
              target: routerAddress as `0x${string}`,
              data: encodeFunctionData({
                abi: CrystalRouterAbi,
                functionName: 'sell',
                args: [true, token.id as `0x${string}`, amountWei, 0n],
              }),
              value: 0n,
            };
          }


          const wallet = nonces.current.get(addr);
          const params = [{ uo }, 0n, 0n, false, pk, wallet?.nonce, true, false, 1, addr];
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
        const totalMon = parseFloat(value || '0');
        if (!isFinite(totalMon) || totalMon <= 0) {
          updatePopup?.(txId, {
            title: 'Sell failed',
            subtitle: 'Invalid MON amount',
            variant: 'error',
            isLoading: false,
          });
          return;
        }
        const totalMonWei = BigInt(Math.round(totalMon * 1e18 / 0.99));
        const parts = distributeEvenly(totalMonWei, targets.length);

        for (let i = 0; i < targets.length; i++) {
          const addr = targets[i];
          const partMonWei = parts[i];
          if (partMonWei <= 0n) {
            skippedZero++;
            continue;
          }

          const balWei: bigint =
            walletTokenBalances[addr]?.[token.id] ?? 0n;
          let amountWei = totalMonWei / BigInt(targets.length);

          if (amountWei <= 0n) {
            skippedInsufficient++;
            continue;
          }

          const wally = subWallets.find((w) => w.address === addr);
          const pk = wally?.privateKey ?? activeWalletPrivateKey;
          if (!pk) {
            skippedInsufficient++;
            continue;
          }
          let uo;
          if (isNadFun) {
            const actions: any = []
            let inputAmountWei = BigInt(Math.floor(Number(amountWei) / (token.price || 1) * (1 + Number(sellSlippageValue) / 100)))
            const settler = settings.chainConfig[activechain].zeroXSettler as `0x${string}`
            const sellToken = token.id as `0x${string}`
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)
            if ((token?.allowances?.[addr.toLowerCase()]?.allowance || 0n) < inputAmountWei) {
              const nonce = token?.allowances?.[addr.toLowerCase()]?.nonce ?? 0n
              
              const signature = await signTypedDataAsync(
                {
                  domain: {
                    name: token.name,
                    version: '1',
                    chainId: activechain,
                    verifyingContract: sellToken,
                  },
                  types: {
                    Permit: [
                      { name: 'owner', type: 'address' },
                      { name: 'spender', type: 'address' },
                      { name: 'value', type: 'uint256' },
                      { name: 'nonce', type: 'uint256' },
                      { name: 'deadline', type: 'uint256' },
                    ],
                  },
                  primaryType: 'Permit',
                  message: {
                    owner: addr,
                    spender: settings.chainConfig[activechain].zeroXAllowanceHolder,
                    value: 115792089237316195423570985008687907853269984665640564039457584007913129639935n,
                    nonce,
                    deadline,
                  },
                }, wally?.privateKey
              )
              
              const sigHex = signature.slice(2)
              const r = (`0x${sigHex.slice(0, 64)}`) as `0x${string}`
              const s = (`0x${sigHex.slice(64, 128)}`) as `0x${string}`
              const v = Number(`0x${sigHex.slice(128, 130)}`)
              
              actions.push(encodeFunctionData({
                abi: zeroXActionsAbi,
                functionName: 'BASIC',
                args: ['0x0000000000000000000000000000000000000000', 0n, settings.chainConfig[activechain].balancegetter, 0n, encodeFunctionData({
                  abi: CrystalDataHelperAbi,
                  functionName: 'tryPermit',
                  args: [
                    sellToken,
                    addr as `0x${string}`,
                    settings.chainConfig[activechain].zeroXAllowanceHolder,
                    115792089237316195423570985008687907853269984665640564039457584007913129639935n,
                    deadline,
                    v,
                    r,
                    s
                  ],
                })],
              }))
            }
            actions.push(encodeFunctionData({
              abi: zeroXActionsAbi,
              functionName: 'BASIC',
              args: ['0x0000000000000000000000000000000000000000', 0n, settings.chainConfig[activechain].balancegetter, 0n, encodeFunctionData({
                abi: zeroXActionsAbi,
                functionName: 'nadFunExactOutSell',
                args: [settings.chainConfig[activechain].zeroXAllowanceHolder, addr as `0x${string}`, settings.chainConfig[activechain].nadFunLens, inputAmountWei, amountWei, sellToken, settler, deadline],
              })],
            }))
            actions.push(encodeFunctionData({
              abi: zeroXActionsAbi,
              functionName: 'BASIC',
              args: [settings.chainConfig[activechain].eth, 100n, settings.chainConfig[activechain].feeAddress, 0n, '0x'],
            }))
            actions.push(encodeFunctionData({
              abi: zeroXActionsAbi,
              functionName: 'BASIC',
              args: [settings.chainConfig[activechain].eth, 10000n, addr as `0x${string}`, 0n, '0x'],
            }))
            uo = {
              target: settings.chainConfig[activechain].zeroXAllowanceHolder as `0x${string}`,
              data: encodeFunctionData({
                abi: zeroXActionsAbi,
                functionName: 'exec',
                args: [settings.chainConfig[activechain].balancegetter, sellToken, 115792089237316195423570985008687907853269984665640564039457584007913129639935n, settler, encodeFunctionData({
                  abi: zeroXAbi,
                  functionName: 'execute',
                  args: [{
                    recipient: addr as `0x${string}`,
                    buyToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
                    minAmountOut: BigInt(0n),
                  }, actions, '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'],
                })],
              }),
              value: 0n,
            };
          }
          else {
            uo = {
              target: routerAddress as `0x${string}`,
              data: encodeFunctionData({
                abi: CrystalRouterAbi,
                functionName: 'sell',
                args: [false, token.id as `0x${string}`, amountWei * 2n, partMonWei],
              }),
              value: 0n,
            };
          }
          const wallet = nonces.current.get(addr);
          const params = [{ uo }, 0n, 0n, false, pk, wallet?.nonce, true, false, 1, addr];
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
      }
      const results = await Promise.allSettled(transferPromises);
      const successfulTransfers = results.filter(
        (result) => result.status === 'fulfilled' && result.value === true,
      ).length;
      const sellLabel =
        sellMode === 'percent' ? `${value} of Position` : `${value} MON`;
      updatePopup?.(txId, {
        title: `Sold ${sellLabel}`,
        subtitle: `Across ${successfulTransfers} wallet${successfulTransfers !== 1 ? 's' : ''}`,
        variant: 'success',
        isLoading: false,
      });
    } catch (error: any) {
      updatePopup?.(txId, {
        title: 'Batch sell failed',
        subtitle: error?.message || 'One or more transactions failed',
        variant: 'error',
        isLoading: false,
      });
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

      if (e.target && 'setPointerCapture' in e.target) {
        (e.target as HTMLElement).setPointerCapture((e.nativeEvent as PointerEvent).pointerId);
      }
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
      const handleMouseUp = (e: MouseEvent) => {
        if (e.target && 'releasePointerCapture' in e.target) {
          const target = e.target as HTMLElement;
          target.releasePointerCapture((e as any).pointerId);
        }

        setIsDragging(false);
        localStorage.setItem(
          'crystal_quickbuy_widget_position',
          JSON.stringify(position),
        );
      };

      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('mouseup', handleMouseUp, true);
      document.addEventListener('mouseleave', handleMouseUp, true);

      document.addEventListener('pointermove', handleMouseMove as any, true);
      document.addEventListener('pointerup', handleMouseUp as any, true);
      document.addEventListener('pointercancel', handleMouseUp as any, true);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove, true);
        document.removeEventListener('mouseup', handleMouseUp, true);
        document.removeEventListener('mouseleave', handleMouseUp, true);
        document.removeEventListener('pointermove', handleMouseMove as any, true);
        document.removeEventListener('pointerup', handleMouseUp as any, true);
        document.removeEventListener('pointercancel', handleMouseUp as any, true);
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
    if (!account?.connected) return true;
    if (!token.id) return true;

    if (selectedWallets.size > 0) {
      const anySelectedHasTokens = Array.from(selectedWallets).some(
        (a) => (walletTokenBalances[a]?.[token.id] ?? 0n) > 0n,
      );
      return !anySelectedHasTokens;
    }

    const hasTokens = currentTokenBalance > 0n;
    if (sellMode === 'percent') return !hasTokens;
    const monAmount = parseFloat(value);
    const requiredTokens = tokenPrice > 0 ? monAmount / tokenPrice : 0;
    return requiredTokens > Number(currentTokenBalance) / 1e18;
  };

  if (!isOpen) return null;

  return (
    <>
      {(isDragging) && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9998,
          cursor: isDragging ? 'move' : 'resize',
          userSelect: 'none'
        }} />
      )}
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
                <Tooltip
                  content={`Toggle Wallets • ${selectedWallets.size} active`}
                >
                  <button
                    className={`quickbuy-wallets-button ${isWalletsExpanded ? 'active' : ''}`}
                    onClick={() => setIsWalletsExpanded(!isWalletsExpanded)}
                    aria-label={`Toggle Wallets, ${selectedWallets.size} active`}
                  >
                    <img
                      src={walleticon}
                      alt="Wallet"
                      className="quickbuy-wallets-icon"
                    />
                    <span
                      className={`quickbuy-wallets-count ${selectedWallets.size ? 'has-active' : ''}`}
                    >
                      {selectedWallets.size}
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
            <div className="circle-row">
              <img src={circle} className="circle" />
            </div>
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
                  Array.from(selectedWallets).reduce(
                    (sum, addr) => sum + getWalletBalance(addr),
                    0,
                  ),
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
                      type="decimal"
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
                  />
                </button>
              </div>
              <div className="quickbuy-order-indicator">
                <div className="quickbuy-token-balance">
                  <span className="quickbuy-token-amount">
                    {formatNumberWithCommas(Array.from(selectedWallets).reduce(
                      (sum, addr) => sum + getWalletTokenBalance(addr),
                      0,
                    ), 2)} {token.symbol}
                  </span>
                  •
                  <span className="quickbuy-usd-value">
                    $
                    {formatNumberWithCommas(
                      (Array.from(selectedWallets).reduce(
                        (sum, addr) => sum + getWalletTokenBalance(addr),
                        0,
                      ) * tokenPrice * monUsdPrice),
                      2,
                    )}
                  </span>
                  •
                  <span className="quickbuy-mon-value">
                    <img
                      className="quickbuy-monad-icon"
                      src={monadicon}
                    />
                    {formatNumberWithCommas(Array.from(selectedWallets).reduce(
                      (sum, addr) => sum + getWalletTokenBalance(addr),
                      0,
                    ) * tokenPrice, 2)}
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
                        type="decimal"
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
                    {userStats.valueNet >= 0 ? '+' : '-'}
                    <span>$</span>
                    {formatNumberWithCommas(
                      Math.abs(userStats.valueNet * monUsdPrice),
                      1,
                    )}
                    {userStats.valueBought > 0
                      ? ` (${((userStats.valueNet / userStats.valueBought) * 100).toFixed(1)}%)`
                      : ' (0%)'}
                  </>
                ) : (
                  <>
                    <img
                      className="quickbuy-monad-icon"
                      src={monadicon}
                    />
                    {userStats.valueNet >= 0 ? '+' : '-'}
                    {formatNumberWithCommas(Math.abs(userStats.valueNet), 1)}
                    {userStats.valueBought > 0
                      ? ` (${((userStats.valueNet / userStats.valueBought) * 100).toFixed(1)}%)`
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
          {(() => {
            const walletsWithToken = subWallets.filter(
              (w) => getWalletTokenBalance(w.address) > 0,
            );
            const walletsWithoutToken = subWallets.filter(
              (w) => getWalletTokenBalance(w.address) === 0,
            );
            const hasTokenHolders = walletsWithToken.length > 0;
            const allSelected = hasTokenHolders
              ? selectedWallets.size === walletsWithToken.length
              : selectedWallets.size === subWallets.length;
            const walletsWithoutTokenAddrs = walletsWithoutToken.map(
              (w) => w.address,
            );
            const allWithoutSelected =
              walletsWithoutTokenAddrs.length > 0 &&
              walletsWithoutTokenAddrs.every((a) => selectedWallets.has(a));

            const hasExactlyOneSelected = selectedWallets.size === 1;
            const destinationAddr = hasExactlyOneSelected
              ? Array.from(selectedWallets)[0]
              : undefined;

            const hasSourceWallets =
              !!destinationAddr &&
              subWallets.some(
                (w) =>
                  w.address !== destinationAddr &&
                  (walletTokenBalances[w.address]?.[token.id!] ?? 0n) > 0n,
              );

            return (
              <>
                <div className="quickbuy-wallets-header">
                  <div className="quickbuy-wallets-actions">
                    {hasTokenHolders ? (
                      <>
                        <Tooltip
                          content={
                            allSelected
                              ? 'Unselect all wallets'
                              : 'Select all wallets'
                          }
                        >
                          <button
                            className="quickbuy-wallet-action-btn select-all"
                            onClick={
                              allSelected
                                ? unselectAllWallets
                                : selectAllWallets
                            }
                          >
                            {allSelected ? 'Unselect All' : 'Select All'}
                          </button>
                        </Tooltip>
                        <div className="cs-container">
                          <Tooltip content="Consolidate all tokens to the selected wallet">
                            <button
                              className="quickbuy-wallet-merge-btn consolidate"
                              onClick={handleConsolidateTokens}
                              disabled={
                                !hasExactlyOneSelected ||
                                !hasSourceWallets ||
                                isConsolidating
                              }
                            >
                              <img src={merge} className="merge-icon" />
                              Consolidate
                            </button>
                          </Tooltip>
                          <Tooltip content="Split tokens across selected wallets with 20% variance">
                            <button
                              className="quickbuy-wallet-merge-btn split"
                              onClick={handleSplitTokens}
                              disabled={selectedWallets.size < 2 || isSplitting}
                            >
                              <img src={merge} className="merge-icon" />
                              Split Tokens
                            </button>
                          </Tooltip>
                        </div>
                      </>
                    ) : (
                      <>
                        <Tooltip
                          content={
                            allSelected
                              ? 'Unselect all wallets'
                              : 'Select all wallets'
                          }
                        >
                          <button
                            className="quickbuy-wallet-action-btn select-all"
                            onClick={
                              allSelected
                                ? unselectAllWallets
                                : selectAllWallets
                            }
                          >
                            {allSelected ? 'Unselect All' : 'Select All'}
                          </button>
                        </Tooltip>

                        <Tooltip content="Select wallets with MON balance">
                          <button
                            className="quickbuy-wallet-action-btn select-all"
                            onClick={selectAllWithBalance}
                          >
                            Select All With Balance
                          </button>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>

                <div className="quickbuy-wallets-list">

                    <>
                      {walletsWithToken.map((wallet, index) => {
                        const balance = getWalletBalance(wallet.address);
                        const isActive = isWalletActive(wallet.privateKey);
                        const isSelected = selectedWallets.has(wallet.address);

                        return (
                          <div
                            key={wallet.address}
                            className={`quickbuy-wallet-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() =>
                              toggleWalletSelection(wallet.address)
                            }
                          >
                            <div className="quickbuy-wallet-checkbox-container">
                              <input
                                type="checkbox"
                                className="quickbuy-wallet-checkbox selection"
                                checked={isSelected}
                                readOnly
                              />
                            </div>

                            <div
                              className="quickbuy-wallet-info"
                            >
                              <div className="quickbuy-wallet-name">
                                {getWalletName(wallet.address, index)}
                                <Tooltip content="Primary Wallet">
                                  {isActive && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', verticalAlign: 'middle' }}>
                                      <path d="M4 20a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
                                      <path d="m12.474 5.943 1.567 5.34a1 1 0 0 0 1.75.328l2.616-3.402" />
                                      <path d="m20 9-3 9" />
                                      <path d="m5.594 8.209 2.615 3.403a1 1 0 0 0 1.75-.329l1.567-5.34" />
                                      <path d="M7 18 4 9" />
                                      <circle cx="12" cy="4" r="2" />
                                      <circle cx="20" cy="7" r="2" />
                                      <circle cx="4" cy="7" r="2" />
                                    </svg>
                                  )}
                                </Tooltip>
                              </div>
                              <div
                                className="quickbuy-wallet-address"
                                onClick={(e) =>
                                  handleCopyAddress(wallet.address, e)
                                }
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
                              {(() => {
                                const gasReserve = BigInt(settings.chainConfig[activechain].gasamount ?? 0);
                                const balanceWei = walletTokenBalances[wallet.address]?.[
                                  tokenList.find(t => t.address === settings.chainConfig[activechain]?.eth)?.address || ''
                                ] || 0n;
                                const hasInsufficientGas = balanceWei > 0n && balanceWei <= gasReserve;

                                return (
                                  <Tooltip content={hasInsufficientGas ? "Not enough for gas, transactions will revert" : "MON Balance"}>
                                    <div
                                      className={`quickbuy-wallet-balance-amount ${isBlurred ? 'blurred' : ''} ${hasInsufficientGas ? 'insufficient-gas' : ''}`}
                                    >
                                      <img
                                        src={monadicon}
                                        className="quickbuy-wallet-mon-icon"
                                      />
                                      {formatNumberWithCommas(balance, 2)}
                                    </div>
                                  </Tooltip>
                                );
                              })()}
                            </div>
                            <div className="quickbuy-wallet-tokens">
                              {(() => {
                                const tokenBalance = getWalletTokenBalance(
                                  wallet.address,
                                );
                                if (tokenBalance > 0) {
                                  return (
                                    <Tooltip content="Tokens">
                                      <div
                                        className={`quickbuy-wallet-token-amount ${isBlurred ? 'blurred' : ''}`}
                                      >
                                        {token.image && (
                                          <img
                                            src={token.image}
                                            className="quickbuy-wallet-token-icon"
                                            onError={(e) => {
                                              e.currentTarget.style.display =
                                                'none';
                                            }}
                                          />
                                        )}
                                        <span className="quickbuy-wallet-token-balance">
                                          {formatNumberWithCommas(
                                            tokenBalance,
                                            2,
                                          )}
                                        </span>
                                      </div>
                                    </Tooltip>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        );
                      })}

                      {hasTokenHolders && walletsWithoutToken.length > 0 && (
                        <div className="quickbuy-wallets-section-label">
                          <Tooltip
                            content={
                              allWithoutSelected
                                ? 'Unselect wallets without tokens'
                                : 'Select wallets without tokens'
                            }
                          >
                            <button
                              className="quickbuy-wallet-action-btn select-all"
                              onClick={() => {
                                if (allWithoutSelected) {
                                  setSelectedWallets((prev) => {
                                    const next = new Set(prev);
                                    walletsWithoutTokenAddrs.forEach((a) =>
                                      next.delete(a),
                                    );
                                    return next;
                                  });
                                } else {
                                  setSelectedWallets((prev) => {
                                    const next = new Set(prev);
                                    walletsWithoutTokenAddrs.forEach((a) =>
                                      next.add(a),
                                    );
                                    return next;
                                  });
                                }
                              }}
                            >
                              {allWithoutSelected
                                ? 'Unselect All'
                                : 'Select All'}
                            </button>
                          </Tooltip>

                          <Tooltip content="Select wallets with MON balance (no tokens)">
                            <button
                              className="quickbuy-wallet-action-btn select-all"
                              onClick={selectAllWithBalanceWithoutToken}
                            >
                              Select All With Balance
                            </button>
                          </Tooltip>
                        </div>
                      )}

                      {walletsWithoutToken.map((wallet, index) => {
                        const balance = getWalletBalance(wallet.address);
                        const isActive = isWalletActive(wallet.privateKey);
                        const isSelected = selectedWallets.has(wallet.address);

                        return (
                          <div
                            key={wallet.address}
                            className={`quickbuy-wallet-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() =>
                              toggleWalletSelection(wallet.address)
                            }
                          >
                            <div className="quickbuy-wallet-checkbox-container">
                              <input
                                type="checkbox"
                                className="quickbuy-wallet-checkbox selection"
                                checked={isSelected}
                                readOnly
                              />
                            </div>

                            <div
                              className="quickbuy-wallet-info"
                            >
                              <div className="quickbuy-wallet-name">
                                {getWalletName(wallet.address, index + walletsWithToken.length)}
                                <Tooltip content="Primary Wallet">
                                  {isActive && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', verticalAlign: 'middle' }}>
                                      <path d="M4 20a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
                                      <path d="m12.474 5.943 1.567 5.34a1 1 0 0 0 1.75.328l2.616-3.402" />
                                      <path d="m20 9-3 9" />
                                      <path d="m5.594 8.209 2.615 3.403a1 1 0 0 0 1.75-.329l1.567-5.34" />
                                      <path d="M7 18 4 9" />
                                      <circle cx="12" cy="4" r="2" />
                                      <circle cx="20" cy="7" r="2" />
                                      <circle cx="4" cy="7" r="2" />
                                    </svg>
                                  )}
                                </Tooltip>
                              </div>
                              <div
                                className="quickbuy-wallet-address"
                                onClick={(e) =>
                                  handleCopyAddress(wallet.address, e)
                                }
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
                              {(() => {
                                const gasReserve = BigInt(settings.chainConfig[activechain].gasamount ?? 0);
                                const balanceWei = walletTokenBalances[wallet.address]?.[
                                  tokenList.find(t => t.address === settings.chainConfig[activechain]?.eth)?.address || ''
                                ] || 0n;
                                const hasInsufficientGas = balanceWei > 0n && balanceWei <= gasReserve;

                                return (
                                  <Tooltip content={hasInsufficientGas ? "Not enough for gas, transactions will revert" : "MON Balance"}>
                                    <div
                                      className={`quickbuy-wallet-balance-amount ${isBlurred ? 'blurred' : ''} ${hasInsufficientGas ? 'insufficient-gas' : ''}`}
                                    >
                                      <img
                                        src={monadicon}
                                        className="quickbuy-wallet-mon-icon"
                                        alt="MON"
                                      />
                                      {formatNumberWithCommas(balance, 2)}
                                    </div>
                                  </Tooltip>
                                );
                              })()}
                            </div>
                            <div className="quickbuy-wallet-tokens">
                              {(() => {
                                const tokenCount = getWalletTokenCount(
                                  wallet.address,
                                );
                                if (tokenCount > 0) {
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
                      })}
                    </>
                  

                  {subWallets.length < 10 && (
                    <div
                      className="quickbuy-add-wallet-button"
                      onClick={async () => {
                        let isSuccess = await createSubWallet(true);
                        if (isSuccess) {
                          setOneCTDepositAddress(isSuccess);
                          setpopup(25);
                        }
                      }}
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
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      <span>Add Wallet</span>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </>
  );
};

export default QuickBuyWidget;